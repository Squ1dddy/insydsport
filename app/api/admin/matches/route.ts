import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import type { Match, Team } from '@/types/tournament';
import { verifyAdminPassword } from '@/lib/admin-auth';

type ActionBody =
  | { action: 'set-live'; matchId: string }
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
      payload: Partial<Pick<Team, 'name' | 'player1' | 'player2' | 'skill_level' | 'status'>>;
    }
  | {
      action: 'create-team';
      payload: Pick<Team, 'name' | 'player1' | 'player2' | 'skill_level' | 'bracket' | 'year_group' | 'status'>;
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

  const payload: Partial<Record<'team1_id' | 'team2_id' | 'team3_id' | 'team4_id' | 'status', string | null>> = {
    status: 'upcoming'
  };

  if (slots[0] === 1) {
    payload.team1_id = winnerIds[0] || null;
    payload.team2_id = winnerIds[1] || null;
  } else {
    payload.team3_id = winnerIds[0] || null;
    payload.team4_id = winnerIds[1] || null;
  }

  if (existingNextMatch) {
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
    duration_minutes: null
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
    const { error } = await supabase.from('matches').update({ status: 'live' }).eq('id', body.matchId);
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
