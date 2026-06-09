import { NextResponse } from 'next/server';
import { getSupabaseServerReadOnlyClient } from '@/lib/supabase';
import type { EnrichedMatch, Match, Team, TournamentData } from '@/types/tournament';

export async function GET() {
  try {
    const supabase = getSupabaseServerReadOnlyClient();
    const [{ data: teams, error: teamsError }, { data: matches, error: matchesError }] = await Promise.all([
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase.from('matches').select('*').order('scheduled_day', { ascending: true }).order('round', { ascending: true }).order('match_number', { ascending: true })
    ]);

    if (teamsError) {
      console.error('Supabase teams error:', teamsError);
      return NextResponse.json({ error: teamsError.message }, { status: 500 });
    }

    if (matchesError) {
      console.error('Supabase matches error:', matchesError);
      return NextResponse.json({ error: matchesError.message }, { status: 500 });
    }

    const teamRows = (teams || []) as Team[];
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

    const data: TournamentData = { teams: teamRows, matches: enrichedMatches };
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected state API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
