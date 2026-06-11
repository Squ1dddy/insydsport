import { NextResponse } from 'next/server';
import { getSupabaseServerReadOnlyClient } from '@/lib/supabase';
import { displayPlayerName } from '@/lib/tournament-utils';
import type { AppSettings, EnrichedMatch, Match, Team, TournamentData } from '@/types/tournament';

export async function GET() {
  try {
    const supabase = getSupabaseServerReadOnlyClient();
    const [
      { data: teams, error: teamsError },
      { data: matches, error: matchesError }
    ] = await Promise.all([
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase.from('matches').select('*').order('scheduled_day', { ascending: true }).order('round', { ascending: true }).order('match_number', { ascending: true })
    ]);

    // app_settings is a single-row table added after launch — fetch it separately
    // so a missing table (before the SQL migration is run) never breaks the read path.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let settingsRow: Record<string, any> | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('app_settings')
        .select('current_day_override')
        .eq('id', 1)
        .maybeSingle();
      settingsRow = result.data ?? null;
    } catch {
      // Table not yet created — fall back to auto (null override).
    }

    if (teamsError) {
      console.error('Supabase teams error:', teamsError);
      return NextResponse.json({ error: teamsError.message }, { status: 500 });
    }

    if (matchesError) {
      console.error('Supabase matches error:', matchesError);
      return NextResponse.json({ error: matchesError.message }, { status: 500 });
    }

    // Privacy: reduce player surnames to an initial BEFORE anything leaves the
    // server. This is the single read path for every client (public site and the
    // admin panel), so full surnames are never sent over the wire, rendered into
    // the DOM, or visible in the network tab / inspect element. Full names stay in
    // the DB (server-only) as the organiser's source of truth.
    const teamRows = ((teams || []) as Team[]).map((team) => ({
      ...team,
      player1: displayPlayerName(team.player1),
      player2: displayPlayerName(team.player2)
    }));
    const matchRows = (matches || []) as Match[];
    const teamMap = new Map(teamRows.map((team) => [team.id, team]));

    const enrichedMatches: EnrichedMatch[] = matchRows.map((match) => ({
      ...match,
      team1: teamMap.get(match.team1_id) || null,
      team2: teamMap.get(match.team2_id) || null,
      team3: match.team3_id ? teamMap.get(match.team3_id) || null : null,
      team4: match.team4_id ? teamMap.get(match.team4_id) || null : null,
      winner1: match.winner1_id ? teamMap.get(match.winner1_id) || null : null,
      winner2: match.winner2_id ? teamMap.get(match.winner2_id) || null : null
    }));

    const settings: AppSettings = {
      currentDayOverride: settingsRow?.current_day_override ?? null
    };

    const data: TournamentData = { teams: teamRows, matches: enrichedMatches, settings };
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected state API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
