import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import type { Match, Notification, Team } from '@/types/tournament';
import { verifyAdminPassword } from '@/lib/admin-auth';
import { advanceCount } from '@/lib/tournament-utils';

type ActionBody =
  | { action: 'set-live'; matchId: string }
  | { action: 'stop-live'; matchId: string }
  | { action: 'increment'; matchId: string; slot: 1 | 2 | 3 | 4 }
  | { action: 'undo'; matchId: string; slot: 1 | 2 | 3 | 4 }
  | { action: 'complete'; matchId: string; winnerIds?: string[] }
  | { action: 'manual-advance'; matchId: string; winnerIds: string[] }
  | {
      action: 'update-match';
      matchId: string;
      payload: Partial<
        Pick<
          Match,
          | 'scheduled_day'
          | 'scheduled_date'
          | 'round'
          | 'match_number'
          | 'is_skill_stretch'
          | 'status'
          | 'team1_score'
          | 'team2_score'
          | 'team3_score'
          | 'team4_score'
          | 'winner1_id'
          | 'winner2_id'
          | 'played_at'
        >
      >;
    }
  | {
      action: 'update-team';
      teamId: string;
      payload: Partial<Pick<Team, 'name' | 'player1' | 'player2' | 'skill_level' | 'status' | 'points' | 'games_played' | 'is_teacher'>>;
    }
  | { action: 'adjust-standings'; teamId: string; pointsDelta: number; gamesDelta: number }
  | {
      action: 'create-team';
      payload: Pick<Team, 'name' | 'player1' | 'player2' | 'skill_level' | 'bracket' | 'year_group' | 'status'> &
        Partial<Pick<Team, 'is_teacher' | 'points' | 'games_played'>>;
    }
  | {
      action: 'delete-team';
      teamId: string;
    }
  | {
      action: 'delete-match';
      matchId: string;
    }
  | {
      action: 'create-match';
      payload: Omit<
        Match,
        'id' | 'scheduled_date' | 'team1_score' | 'team2_score' | 'team3_score' | 'team4_score' | 'winner1_id' | 'winner2_id' | 'played_at' | 'duration_minutes'
      >;
    }
  | { action: 'clear-scores' }
  | { action: 'set-current-day'; day: number | null }
  | {
      action: 'create-notification';
      payload: Pick<Notification, 'message'> & Partial<Pick<Notification, 'title' | 'level'>>;
    }
  | { action: 'toggle-notification'; id: string; active: boolean }
  | { action: 'delete-notification'; id: string };

function asTeamIds(match: Match) {
  return [match.team1_id, match.team2_id, match.team3_id, match.team4_id].filter(Boolean) as string[];
}

// How many rounds the match's series runs to. The senior bracket carries three
// series with different depths — Year 12 five rounds, the 12-team Year 11 series
// three, Teachers two — so the cap must follow `series`, otherwise completing a
// grand final would spawn a phantom extra round.
//
// Falls back to deriving from `is_next_term` when `series` is absent, so this path
// is correct before supabase/match-series.sql is run. Note the teacher series
// cannot be derived here (it needs the team rows), which is only a concern if
// someone re-completes a teacher match pre-migration — it would then be treated as
// year12 and cap at 5 instead of 2.
function nextRoundLimit(match: Pick<Match, 'bracket' | 'is_next_term' | 'series'>) {
  if (match.bracket === 'junior') return 4;
  const series = match.series ?? (match.is_next_term ? 'year11' : 'year12');
  if (series === 'year11') return 3;
  if (series === 'teacher') return 2;
  return 5;
}

function targetSlot(sourceMatchNumber: number) {
  return sourceMatchNumber % 2 === 1 ? [1, 2] : [3, 4];
}

function resolvedWinners(match: Match, winnerIds?: string[]) {
  if (winnerIds && winnerIds.length > 0) {
    return winnerIds;
  }

  const rankings = [
    { id: match.team1_id, score: match.team1_score },
    { id: match.team2_id, score: match.team2_score },
    { id: match.team3_id, score: match.team3_score },
    { id: match.team4_id, score: match.team4_score }
  ]
    .filter((item): item is { id: string; score: number } => Boolean(item.id))
    .sort((a, b) => b.score - a.score);

  // Top 2 out of 3 or 4 teams — but a 1v1 has ONE winner. Advancing both would
  // record the losing side as a winner. See advanceCount in lib/tournament-utils.
  return rankings.slice(0, advanceCount(rankings.length)).map((item) => item.id);
}

async function upsertNextRoundMatch(supabase: ReturnType<typeof createSupabaseServerClient>, match: Match, winnerIds: string[]) {
  const nextRound = match.round + 1;
  if (nextRound > nextRoundLimit(match)) {
    return;
  }

  const nextMatchNumber = Math.ceil(match.match_number / 2);
  const slots = targetSlot(match.match_number);
  // Scoped to the same series: bracket+round+match_number alone is not unique across
  // the three senior series, so without this a result could be slotted into another
  // series' match that happened to share a match number. `series` is only added to
  // the filter when the parent row actually carries it, so this still works before
  // supabase/match-series.sql has been run (is_next_term alone, as before).
  let lookup = supabase
    .from('matches')
    .select('*')
    .eq('bracket', match.bracket)
    .eq('round', nextRound)
    .eq('match_number', nextMatchNumber)
    .eq('is_next_term', match.is_next_term);
  if (match.series) {
    lookup = lookup.eq('series', match.series);
  }
  const { data: existingNextMatch, error: nextMatchError } = await lookup.maybeSingle();
  if (nextMatchError) {
    throw nextMatchError;
  }

  const payload: Partial<Record<'team1_id' | 'team2_id' | 'team3_id' | 'team4_id', string | null>> = {};

  if (slots[0] === 1) {
    payload.team1_id = winnerIds[0] || null;
    payload.team2_id = winnerIds[1] || null;
  } else {
    payload.team3_id = winnerIds[0] || null;
    payload.team4_id = winnerIds[1] || null;
  }

  if (existingNextMatch) {
    // Only re-slot the team(s) this parent feeds. Crucially, do NOT touch the
    // next match's status: if it has already gone live or been completed, forcing
    // it back to 'upcoming' would silently un-do a played match. Preserve whatever
    // status it currently has.
    const { error } = await supabase.from('matches').update(payload).eq('id', existingNextMatch.id);
    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await supabase.from('matches').insert({
    bracket: match.bracket,
    round: nextRound,
    match_number: nextMatchNumber,
    scheduled_day: match.scheduled_day + 1,
    team1_id: payload.team1_id || null,
    team2_id: payload.team2_id || null,
    team3_id: payload.team3_id || null,
    team4_id: payload.team4_id || null,
    team1_score: 0,
    team2_score: 0,
    team3_score: 0,
    team4_score: 0,
    status: 'upcoming',
    is_skill_stretch: false,
    winner1_id: null,
    winner2_id: null,
    played_at: null,
    duration_minutes: null,
    // Keep the whole knockout line inside its parent's series, so a Year 11 or
    // teacher match never spawns a round into another series' schedule. `series` is
    // only written when the parent carries it, so this insert still succeeds before
    // supabase/match-series.sql has been run.
    is_next_term: match.is_next_term,
    ...(match.series ? { series: match.series } : {})
  });
  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const isAuthed = await verifyAdminPassword(request);
  if (!isAuthed) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Wrap the whole action handler so a Supabase/DB error returns a JSON message
  // the admin client can show (e.g. "column … does not exist", connection drop)
  // instead of an unhandled 500 surfacing as a generic "Admin action failed."
  try {
    const body = (await request.json()) as ActionBody;
    const supabase = createSupabaseServerClient();

    if (body.action === 'set-live') {
    // Enforce one live match per bracket. Before airing this match, demote any
    // other match currently 'live' in the SAME bracket back to 'upcoming'. This
    // prevents the "old game stayed live while a new one went live too" state and
    // keeps the home scorebug unambiguous (the other bracket can still run its own
    // live match concurrently — different court).
    const { data: target, error: targetError } = await supabase
      .from('matches')
      .select('bracket')
      .eq('id', body.matchId)
      .single();
    if (targetError) throw targetError;

    const { error: demoteError } = await supabase
      .from('matches')
      .update({ status: 'upcoming' })
      .eq('bracket', (target as Pick<Match, 'bracket'>).bracket)
      .eq('status', 'live')
      .neq('id', body.matchId);
    if (demoteError) throw demoteError;

    const { error } = await supabase.from('matches').update({ status: 'live' }).eq('id', body.matchId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  // Override to take a match off-air without completing it. Reverts to 'upcoming'
  // so an admin can recover a match that got stuck 'live' (e.g. after completing
  // the wrong match) and re-run it cleanly.
  if (body.action === 'stop-live') {
    const { error } = await supabase.from('matches').update({ status: 'upcoming' }).eq('id', body.matchId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'increment' || body.action === 'undo') {
    const { data: match, error: matchError } = await supabase.from('matches').select('*').eq('id', body.matchId).single();
    if (matchError) throw matchError;

    const field = `team${body.slot}_score` as const;
    const current = (match as Match)[field] as number;
    const next = body.action === 'increment' ? current + 1 : Math.max(0, current - 1);
    const { error } = await supabase.from('matches').update({ [field]: next }).eq('id', body.matchId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'complete') {
    const { data: match, error: matchError } = await supabase.from('matches').select('*').eq('id', body.matchId).single();
    if (matchError) throw matchError;

    const winners = resolvedWinners(match as Match, body.winnerIds);

    const { error: matchUpdateError } = await supabase
      .from('matches')
      .update({
        status: 'completed',
        winner1_id: winners[0] || null,
        winner2_id: winners[1] || null,
        played_at: match.played_at || new Date().toISOString()
      })
      .eq('id', body.matchId);
    if (matchUpdateError) throw matchUpdateError;

    await upsertNextRoundMatch(supabase, match as Match, winners);

    return NextResponse.json({ ok: true });
  }

  if (body.action === 'manual-advance') {
    const { data: match, error: matchError } = await supabase.from('matches').select('*').eq('id', body.matchId).single();
    if (matchError) throw matchError;

    const { error: teamUpdateError } = await supabase
      .from('teams')
      .update({ status: 'active' })
      .in('id', body.winnerIds);
    if (teamUpdateError) throw teamUpdateError;

    const losingIds = asTeamIds(match).filter((id) => !body.winnerIds.includes(id));
    if (losingIds.length > 0) {
      const { error: losingUpdateError } = await supabase.from('teams').update({ status: 'eliminated' }).in('id', losingIds);
      if (losingUpdateError) throw losingUpdateError;
    }

    const { error } = await supabase.from('matches').update({
      status: 'completed',
      winner1_id: body.winnerIds[0] || null,
      winner2_id: body.winnerIds[1] || null,
      played_at: match.played_at || new Date().toISOString()
    }).eq('id', body.matchId);
    if (error) throw error;

    await upsertNextRoundMatch(supabase, match as Match, body.winnerIds);

    return NextResponse.json({ ok: true });
  }

  if (body.action === 'update-match') {
    const { error } = await supabase.from('matches').update(body.payload).eq('id', body.matchId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'update-team') {
    const { error } = await supabase.from('teams').update(body.payload).eq('id', body.teamId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  // Junior round-robin: add a game result to a team's running ladder totals.
  // pointsDelta is that game's points, gamesDelta is normally 1 (negative to undo).
  // Clamped at 0 so a mistaken undo can't drive totals negative.
  if (body.action === 'adjust-standings') {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('points, games_played')
      .eq('id', body.teamId)
      .single();
    if (teamError) throw teamError;

    const current = team as Pick<Team, 'points' | 'games_played'>;
    const { error } = await supabase
      .from('teams')
      .update({
        points: Math.max(0, current.points + body.pointsDelta),
        games_played: Math.max(0, current.games_played + body.gamesDelta)
      })
      .eq('id', body.teamId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'create-team') {
    const { error } = await supabase.from('teams').insert({
      ...body.payload
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'delete-team') {
    const { error } = await supabase.from('teams').delete().eq('id', body.teamId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'create-match') {
    const { error } = await supabase.from('matches').insert(body.payload);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  // Permanently remove a match. Used to clean up wrongly-created or stray matches
  // (e.g. an auto-spawned next-round match, or an exhibition/teacher game). Deleting
  // a parent match does NOT roll back any next-round match its completion created —
  // delete those separately if needed.
  if (body.action === 'delete-match') {
    const { error } = await supabase.from('matches').delete().eq('id', body.matchId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'clear-scores') {
    const { error } = await supabase
      .from('matches')
      .update({
        team1_score: 0,
        team2_score: 0,
        team3_score: 0,
        team4_score: 0,
        status: 'upcoming',
        winner1_id: null,
        winner2_id: null,
        played_at: null
      })
      .neq('status', 'live');
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'set-current-day') {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ id: 1, current_day_override: body.day ?? null });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'create-notification') {
    const message = body.payload.message?.trim();
    if (!message) {
      return NextResponse.json({ ok: false, message: 'Notification message is required.' }, { status: 400 });
    }
    const { error } = await supabase.from('notifications').insert({
      title: body.payload.title?.trim() || null,
      message,
      level: body.payload.level || 'info',
      active: true
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'toggle-notification') {
    // Hide/show a notice without deleting it: flips `active`. Hidden notices stay
    // in the DB (and are still returned by /api/state) so an admin can bring them
    // back; the public banner only renders `active` ones. `.select()` lets us
    // confirm a row actually changed — without the service-role key, RLS silently
    // filters the write to zero rows and returns no error, which looks like a no-op.
    const { data: updated, error } = await supabase
      .from('notifications')
      .update({ active: body.active })
      .eq('id', body.id)
      .select('id');
    if (error) throw error;
    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Notice not updated — the server may be missing the Supabase service-role key (writes blocked by RLS).' },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'delete-notification') {
    const { data: deleted, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', body.id)
      .select('id');
    if (error) throw error;
    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Notice not removed — the server may be missing the Supabase service-role key (deletes blocked by RLS), or it was already gone.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }

    return NextResponse.json({ ok: false, message: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    // Supabase throws PostgrestError objects (not Error instances) that carry the
    // useful reason on `.message` — surface it so the admin sees *why* a write
    // failed (e.g. "column … does not exist", "invalid input syntax for uuid").
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error && (error as { message?: unknown }).message
        ? String((error as { message: unknown }).message)
        : 'Unexpected server error.';
    console.error('Admin action error:', error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
