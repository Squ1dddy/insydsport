import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import type { Match, Team } from '@/types/tournament';
import { verifyAdminPassword } from '@/lib/admin-auth';

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
      action: 'create-match';
      payload: Omit<Match, 'id' | 'team1_score' | 'team2_score' | 'team3_score' | 'team4_score' | 'winner1_id' | 'winner2_id' | 'played_at' | 'duration_minutes'>;
    }
  | { action: 'clear-scores' };

function asTeamIds(match: Match) {
  return [match.team1_id, match.team2_id, match.team3_id, match.team4_id].filter(Boolean) as string[];
}

function nextRoundLimit(bracket: Match['bracket']) {
  return bracket === 'senior' ? 5 : 4;
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

  return rankings.slice(0, Math.min(2, rankings.length)).map((item) => item.id);
}

async function upsertNextRoundMatch(supabase: ReturnType<typeof createSupabaseServerClient>, match: Match, winnerIds: string[]) {
  const nextRound = match.round + 1;
  if (nextRound > nextRoundLimit(match.bracket)) {
    return;
  }

  const nextMatchNumber = Math.ceil(match.match_number / 2);
  const slots = targetSlot(match.match_number);
  const { data: existingNextMatch, error: nextMatchError } = await supabase
    .from('matches')
    .select('*')
    .eq('bracket', match.bracket)
    .eq('round', nextRound)
    .eq('match_number', nextMatchNumber)
    .maybeSingle();
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
    // Keep the whole knockout line on the same side of the next-term divide as its
    // parent, so a Year 11 ("next term") match never spawns a round into the
    // current Year 12 schedule.
    is_next_term: match.is_next_term
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

  return NextResponse.json({ ok: false }, { status: 400 });
}
