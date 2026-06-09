import type { BracketName, Match, Team } from '@/types/tournament';
import { createSupabaseServerClient } from '@/lib/supabase';

type TeamSeed = Omit<Team, 'id'>;
type MatchSeed = Omit<Match, 'id' | 'team1_id' | 'team2_id' | 'team3_id' | 'team4_id' | 'winner1_id' | 'winner2_id' | 'played_at' | 'duration_minutes'> & {
  team1_name: string;
  team2_name: string;
  team3_name?: string | null;
  team4_name?: string | null;
  played_at?: string | null;
};

export const seniorTeams: TeamSeed[] = [
  { name: 'terby gerb', player1: 'Alistair B', player2: 'Michael Z', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'bye' },
  { name: 'Finn P', player1: 'Nevan C', player2: 'Finn P', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Curdled Varangians', player1: 'Ted M', player2: 'Spencer A', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Microwave', player1: 'Regan G', player2: 'Sonny L', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'The Jester and the Germ', player1: 'Hudson M', player2: 'Otto B', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Me and My Hero', player1: 'Neo C', player2: 'Xavier M', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Yansi&Dunlop', player1: 'Gulliver R', player2: 'Ren H', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Greatest in Cosmos', player1: 'Luca J', player2: 'Timofey O', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Mr Kazanis fan club', player1: 'Max C', player2: 'Leon A', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Plants v Zombies', player1: 'Felix M', player2: 'Zorigt G', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'The Handball Kingz', player1: 'Joe E', player2: 'Mitchell C', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'SydneyWolves', player1: 'Sonny H', player2: 'Eden E', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'The Greens', player1: 'Nate M', player2: 'Gabriel C', skill_level: 2, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'SAJA BOYS', player1: 'Reuben K', player2: 'Aden Y', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'ruby and the labubu', player1: 'Anastasia T', player2: 'Ruby R', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Louis', player1: 'Louis H', player2: 'Louis D', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Taiquin', player1: 'Joaquin C', player2: 'Taichi A', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Aurora', player1: 'Clementine B', player2: 'Lada I', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Green deedle', player1: 'Noah M', player2: 'Alex V', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Bessintown', player1: 'Jacob R', player2: 'Henry B', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'CHC', player1: 'Oscar B', player2: 'Charlie B', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Xavier A', player1: 'Etienne A', player2: 'Xavier A', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'K8ieGr8 & lilhuddyonthebeat2016', player1: 'Hudson H', player2: 'Kate G', skill_level: 1, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Caick', player1: 'Cairo E', player2: 'Nick R', skill_level: 3, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'PJ method', player1: 'Tyson K', player2: 'Eva M', skill_level: 3, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: "Joe R", player1: 'Samuel V', player2: 'Bodhi R', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Ball Slappers', player1: 'Charlie H', player2: 'Cuba M', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'The Chronicles', player1: 'Rain J', player2: 'Leopold K', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Holivy', player1: 'Holly D', player2: 'Olivia S', skill_level: 3, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' }
];

export const juniorTeams: TeamSeed[] = [
  { name: 'Daisy', player1: 'Billy B', player2: 'Jesse H', skill_level: 5, bracket: 'junior', year_group: 'Year 9-10', status: 'bye' },
  { name: 'Jai Lung', player1: 'Lai J', player2: 'Martin L', skill_level: 3, bracket: 'junior', year_group: 'Year 9-10', status: 'active' },
  { name: 'Northside', player1: 'Connor F', player2: 'Maceo W', skill_level: 5, bracket: 'junior', year_group: 'Year 9-10', status: 'active' },
  { name: "Sorianna", player1: "Sophia O", player2: 'Arianna P', skill_level: 3, bracket: 'junior', year_group: 'Year 9-10', status: 'active' },
  { name: 'The HH', player1: 'Harry H', player2: 'Harper S', skill_level: 2, bracket: 'junior', year_group: 'Year 9-10', status: 'active' },
  { name: 'Year 9 Mum & Dad', player1: "Miss O", player2: 'Mr M', skill_level: 5, bracket: 'junior', year_group: 'Year 9-10', status: 'bye' },
  { name: 'DIGGERS HC', player1: 'Atticus T', player2: 'Henry H', skill_level: 1, bracket: 'junior', year_group: 'Year 9-10', status: 'active' },
  { name: 'Ball Ticklers', player1: 'Max C', player2: 'Louis C', skill_level: 1, bracket: 'junior', year_group: 'Year 9-10', status: 'active' },
  { name: 'wesh', player1: 'Jonti B', player2: 'Raph R', skill_level: 5, bracket: 'junior', year_group: 'Year 9-10', status: 'active' },
  { name: 'Static', player1: 'Chelsea K', player2: 'Ansh A', skill_level: 2, bracket: 'junior', year_group: 'Year 9-10', status: 'active' }
];

export const matchSeeds: MatchSeed[] = [
  { bracket: 'senior', round: 1, match_number: 1, scheduled_day: 1, team1_name: 'The Jester and the Germ', team2_name: 'Yansi&Dunlop', team3_name: 'Greatest in Cosmos', team4_name: 'Aurora', team1_score: 7, team2_score: 8, team3_score: 15, team4_score: 3, status: 'completed', is_skill_stretch: false, played_at: '2026-06-05T12:50:00+10:00' },
  { bracket: 'senior', round: 1, match_number: 2, scheduled_day: 1, team1_name: 'ruby and the labubu', team2_name: 'Louis', team3_name: 'Taiquin', team4_name: 'Green deedle', team1_score: 1, team2_score: 4, team3_score: 6, team4_score: 7, status: 'completed', is_skill_stretch: false, played_at: '2026-06-05T12:52:00+10:00' },
  { bracket: 'senior', round: 1, match_number: 3, scheduled_day: 2, team1_name: 'Me and My Hero', team2_name: 'Finn P', team3_name: 'Bessintown', team4_name: 'CHC', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: false },
  { bracket: 'senior', round: 1, match_number: 4, scheduled_day: 2, team1_name: 'Xavier A', team2_name: 'Curdled Varangians', team3_name: 'Ball Slappers', team4_name: 'Microwave', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: true },
  { bracket: 'senior', round: 1, match_number: 5, scheduled_day: 3, team1_name: 'SAJA BOYS', team2_name: 'Mr Kazanis fan club', team3_name: 'Plants v Zombies', team4_name: 'The Handball Kingz', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: false },
  { bracket: 'senior', round: 1, match_number: 6, scheduled_day: 3, team1_name: 'SydneyWolves', team2_name: "Joe R", team3_name: 'The Chronicles', team4_name: 'Caick', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: true },
  { bracket: 'senior', round: 1, match_number: 7, scheduled_day: 4, team1_name: 'PJ method', team2_name: 'Holivy', team3_name: 'The Greens', team4_name: 'K8ieGr8 & lilhuddyonthebeat2016', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: true },
  { bracket: 'junior', round: 1, match_number: 1, scheduled_day: 1, team1_name: 'Northside', team2_name: 'wesh', team3_name: 'Jai Lung', team4_name: 'Sorianna', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: false },
  { bracket: 'junior', round: 1, match_number: 2, scheduled_day: 1, team1_name: 'The HH', team2_name: 'Static', team3_name: 'DIGGERS HC', team4_name: 'Ball Ticklers', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: false }
];

function buildTeamMap(teams: Team[]) {
  return new Map(teams.map((team) => [team.name, team]));
}

function bracketLabel(name: BracketName) {
  return name;
}

function scoreEntriesFromMatchRow(
  match: Pick<Match, 'team1_id' | 'team2_id' | 'team3_id' | 'team4_id' | 'team1_score' | 'team2_score' | 'team3_score' | 'team4_score'>,
  teamMap: Map<string, Team>
) {
  return [
    { name: teamMap.get(match.team1_id)?.name ?? '', score: match.team1_score },
    { name: teamMap.get(match.team2_id)?.name ?? '', score: match.team2_score },
    { name: match.team3_id ? teamMap.get(match.team3_id)?.name ?? '' : '', score: match.team3_score },
    { name: match.team4_id ? teamMap.get(match.team4_id)?.name ?? '' : '', score: match.team4_score }
  ].filter((entry) => entry.name.length > 0);
}

export async function seedDatabase() {
  const supabase = createSupabaseServerClient();

  const [{ count: teamCount, error: teamCountError }, { count: matchCount, error: matchCountError }] = await Promise.all([
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true })
  ]);

  if (teamCountError) {
    throw teamCountError;
  }

  if (matchCountError) {
    throw matchCountError;
  }

  const shouldSeedTeams = (teamCount ?? 0) === 0;
  const shouldSeedMatches = (matchCount ?? 0) === 0;

  if (!shouldSeedTeams && !shouldSeedMatches) {
    return { seeded: false };
  }

  const seedTeamRows = [...seniorTeams, ...juniorTeams].map((team) => ({
    ...team,
    bracket: bracketLabel(team.bracket)
  }));

  const { data: existingTeams, error: teamFetchError } = await supabase.from('teams').select('*');
  if (teamFetchError) {
    throw teamFetchError;
  }

  const teamRows = (existingTeams || []) as Team[];

  for (const team of seedTeamRows) {
    const existing = teamRows.find((row) => row.name === team.name);
    const payload = {
      name: team.name,
      player1: team.player1,
      player2: team.player2,
      skill_level: team.skill_level,
      bracket: team.bracket,
      year_group: team.year_group,
      status: team.status
    };

    if (existing) {
      const { error } = await supabase.from('teams').update(payload).eq('id', existing.id);
      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from('teams').insert(payload);
      if (error) {
        throw error;
      }
    }
  }

  const { data: refreshedTeams, error: refreshedTeamsError } = await supabase.from('teams').select('*');
  if (refreshedTeamsError) {
    throw refreshedTeamsError;
  }

  const refreshedTeamMap = buildTeamMap((refreshedTeams || []) as Team[]);
  const matchRows = matchSeeds.map((match) => {
    const team1 = refreshedTeamMap.get(match.team1_name);
    const team2 = refreshedTeamMap.get(match.team2_name);
    const team3 = match.team3_name ? refreshedTeamMap.get(match.team3_name) : null;
    const team4 = match.team4_name ? refreshedTeamMap.get(match.team4_name) : null;

    if (!team1 || !team2) {
      throw new Error(`Missing team data for ${match.bracket} round ${match.round} match ${match.match_number}`);
    }

    return {
      bracket: match.bracket,
      round: match.round,
      match_number: match.match_number,
      scheduled_day: match.scheduled_day,
      team1_id: team1.id,
      team2_id: team2.id,
      team3_id: team3?.id ?? null,
      team4_id: team4?.id ?? null,
      team1_score: match.team1_score,
      team2_score: match.team2_score,
      team3_score: match.team3_score,
      team4_score: match.team4_score,
      status: match.status,
      is_skill_stretch: match.is_skill_stretch,
      winner1_id: null,
      winner2_id: null,
      played_at: match.played_at || (match.status === 'completed' ? new Date().toISOString() : null),
      duration_minutes: null
    };
  });

  for (const match of matchRows) {
    const existing = await supabase
      .from('matches')
      .select('id')
      .eq('bracket', match.bracket)
      .eq('round', match.round)
      .eq('match_number', match.match_number)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data) {
      const { error } = await supabase.from('matches').update(match).eq('id', existing.data.id);
      if (error) {
        throw error;
      }
    } else if (shouldSeedMatches) {
      const { error } = await supabase.from('matches').insert(match);
      if (error) {
        throw error;
      }
    }
  }

  const completedMatches = matchRows.filter((match) => match.status === 'completed');
  const recordMap = new Map(
    seedTeamRows.map((team) => [
      team.name,
      {
        status: team.status
      }
    ])
  );

  for (const match of completedMatches) {
    const entries = scoreEntriesFromMatchRow(match, refreshedTeamMap).sort((a, b) => b.score - a.score);
    const winners = entries.slice(0, 2);
    const losers = entries.slice(2);

    for (const winner of winners) {
      const record = recordMap.get(winner.name);
      if (record) {
        record.status = 'active';
      }
    }

    for (const loser of losers) {
      const record = recordMap.get(loser.name);
      if (record) {
        record.status = 'eliminated';
      }
    }
  }

  for (const team of seedTeamRows) {
    const record = recordMap.get(team.name);
    const existing = refreshedTeamMap.get(team.name);
    const payload = {
      name: team.name,
      player1: team.player1,
      player2: team.player2,
      skill_level: team.skill_level,
      bracket: team.bracket,
      year_group: team.year_group,
      status: record?.status ?? team.status
    };

    if (existing) {
      const { error } = await supabase.from('teams').update(payload).eq('id', existing.id);
      if (error) {
        throw error;
      }
    }
  }

  const insertedMatches = matchRows.filter((match) => match.status === 'completed');
  for (const match of insertedMatches) {
    const entries = scoreEntriesFromMatchRow(match, refreshedTeamMap).sort((a, b) => b.score - a.score);
    const winners = entries.slice(0, 2).map((entry) => entry.name);
    const { data: existingMatch, error: matchLookupError } = await supabase
      .from('matches')
      .select('id')
      .eq('bracket', match.bracket)
      .eq('round', match.round)
      .eq('match_number', match.match_number)
      .single();

    if (matchLookupError) {
      throw matchLookupError;
    }

    const { error } = await supabase
      .from('matches')
      .update({
        winner1_id: refreshedTeamMap.get(winners[0] || '')?.id || null,
        winner2_id: refreshedTeamMap.get(winners[1] || '')?.id || null
      })
      .eq('id', existingMatch.id);
    if (error) {
      throw error;
    }
  }

  return { seeded: true };
}
