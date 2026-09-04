import type { BracketName, Match, SeniorSeries, Team } from '@/types/tournament';
import { createSupabaseServerClient } from '@/lib/supabase';
import { advanceCount } from '@/lib/tournament-utils';

type TeamSeed = Omit<Team, 'id' | 'points' | 'games_played' | 'is_teacher' | 'star_count'> & {
  points?: number;
  games_played?: number;
  is_teacher?: boolean;
};
type MatchSeed = Omit<
  Match,
  | 'id'
  | 'scheduled_date'
  | 'team1_id'
  | 'team2_id'
  | 'team3_id'
  | 'team4_id'
  | 'winner1_id'
  | 'winner2_id'
  | 'played_at'
  | 'duration_minutes'
  | 'is_next_term'
  | 'series'
> & {
  team1_name: string;
  team2_name: string;
  team3_name?: string | null;
  team4_name?: string | null;
  played_at?: string | null;
  /** Which senior series. Defaults to 'year12'; 'year11' also sets is_next_term. */
  series?: SeniorSeries;
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
  { name: "Joe R's", player1: 'Samuel V', player2: 'Bodhi R', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Ball Slappers', player1: 'Charlie H', player2: 'Cuba M', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'The Chronicles', player1: 'Rain J', player2: 'Leopold K', skill_level: 4, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' },
  { name: 'Holivy', player1: 'Holly D', player2: 'Olivia S', skill_level: 3, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' }
];

// Junior bracket runs as a points-based round-robin (not knockout). Each team
// carries a running `points` total and `games_played` count; the ladder ranks on
// points. Real names/skills/years come from the sign-up sheet; points carry over
// from the paper ladder. Merged duplicate sign-ups: #28 Gus B = #30 On Ont,
// #59 = #60 (Freddy/Souljah), #62 = #63 (Triple T's).
export const juniorTeams: TeamSeed[] = [
  // --- Year 10 ---
  { name: 'DIGGERS HC', player1: 'Atticus T', player2: 'Henry H', skill_level: 1, bracket: 'junior', year_group: 'Year 10', status: 'active', points: 5, games_played: 1 },
  { name: 'Ball Ticklers', player1: 'Max C', player2: 'Louis C', skill_level: 1, bracket: 'junior', year_group: 'Year 10', status: 'active', points: 8, games_played: 2 },
  { name: 'On Ont', player1: 'Gus B', player2: 'Massimo P', skill_level: 4, bracket: 'junior', year_group: 'Year 10', status: 'active', points: 5, games_played: 1 },
  { name: 'Static', player1: 'Chelsea K', player2: 'Ansh A', skill_level: 2, bracket: 'junior', year_group: 'Year 10', status: 'active', points: 2, games_played: 1 },
  { name: 'wesh', player1: 'Jonti B', player2: 'Raph R', skill_level: 5, bracket: 'junior', year_group: 'Year 10', status: 'active', points: 5, games_played: 1 },
  { name: 'Eastlakes', player1: 'Matheo D', player2: 'Emre G', skill_level: 2, bracket: 'junior', year_group: 'Year 10', status: 'active', points: 3, games_played: 1 },
  // --- Year 9 ---
  { name: 'Northside', player1: 'Connor F', player2: 'Maceo W', skill_level: 5, bracket: 'junior', year_group: 'Year 9', status: 'active', points: 0, games_played: 0 },
  { name: 'Sorianna', player1: "Sophia O", player2: 'Arianna P', skill_level: 3, bracket: 'junior', year_group: 'Year 9', status: 'active', points: 1, games_played: 1 },
  { name: 'The HH', player1: 'Harry H', player2: 'Harper S', skill_level: 2, bracket: 'junior', year_group: 'Year 9', status: 'active', points: 2, games_played: 1 },
  { name: 'T&C', player1: 'Tynan G', player2: 'Cadel F', skill_level: 5, bracket: 'junior', year_group: 'Year 9', status: 'active', points: 0, games_played: 0 },
  { name: 'MC', player1: 'Cassius S', player2: 'Marlo S', skill_level: 5, bracket: 'junior', year_group: 'Year 9', status: 'active', points: 0, games_played: 0 },
  { name: 'BH', player1: 'Bertie L', player2: 'Harrison G', skill_level: 3, bracket: 'junior', year_group: 'Year 9', status: 'active', points: 0, games_played: 0 },
  { name: 'Giggle n Hoot', player1: 'Michello L', player2: 'Zane R', skill_level: 3, bracket: 'junior', year_group: 'Year 9', status: 'active', points: 0, games_played: 0 },
  { name: 'Remitherat', player1: 'Louie H', player2: 'Remi M', skill_level: 3, bracket: 'junior', year_group: 'Year 9', status: 'active', points: 0, games_played: 0 },
  // --- Year 8 ---
  { name: 'Jai Lung', player1: 'Lai J', player2: 'Martin L', skill_level: 3, bracket: 'junior', year_group: 'Year 8', status: 'active', points: 5, games_played: 1 },
  { name: 'Daisy', player1: 'Billy B', player2: 'Jesse H', skill_level: 5, bracket: 'junior', year_group: 'Year 8', status: 'active', points: 0, games_played: 0 },
  { name: 'Mohsen & Felix', player1: 'Mohsen', player2: 'Felix', skill_level: 3, bracket: 'junior', year_group: 'Year 8', status: 'active', points: 0, games_played: 0 },
  // --- Year 7 ---
  { name: 'Freddy & Souljah', player1: 'Freddy A', player2: 'Souljah T', skill_level: 4, bracket: 'junior', year_group: 'Year 7', status: 'active', points: 5, games_played: 1 },
  { name: "Triple T's", player1: 'Monty C', player2: 'Shivraj S', skill_level: 4, bracket: 'junior', year_group: 'Year 7', status: 'active', points: 0, games_played: 0 },
  { name: 'Lil Jits', player1: 'Lucas L', player2: 'Rai C', skill_level: 3, bracket: 'junior', year_group: 'Year 7', status: 'active', points: 0, games_played: 0 },
  { name: 'The Handballers', player1: 'Kaspar G', player2: 'Joseph U', skill_level: 4, bracket: 'junior', year_group: 'Year 7', status: 'active', points: 3, games_played: 1 },
  { name: 'BJ', player1: 'James B', player2: 'Baxter A', skill_level: 1, bracket: 'junior', year_group: 'Year 7', status: 'active', points: 0, games_played: 0 },
  // --- Ladder-only (not on the sign-up sheet, kept with recorded points) ---
  { name: 'Darrel Strawberry HC', player1: 'Georgio', player2: 'Phoenix', skill_level: 3, bracket: 'junior', year_group: 'Year 7-10', status: 'active', points: 4, games_played: 1 },
  { name: 'Harrex', player1: 'TBC', player2: 'TBC', skill_level: 3, bracket: 'junior', year_group: 'Year 10', status: 'active', points: 4, games_played: 1 }
];

// Teacher teams: admin-only, hidden from public views, never auto-queued, but an
// admin can slot them into any junior or senior match.
export const teacherTeams: TeamSeed[] = [
  { name: 'Year 9 Mum & Dad', player1: "Miss O", player2: 'Mr M', skill_level: 5, bracket: 'junior', year_group: 'Teacher', status: 'active', is_teacher: true },
  { name: 'Demolition Men', player1: 'Stewart O', player2: 'Chris D', skill_level: 5, bracket: 'senior', year_group: 'Teacher', status: 'active', is_teacher: true },
  { name: 'The Ancients', player1: 'Chris E', player2: 'Nick S', skill_level: 5, bracket: 'senior', year_group: 'Teacher', status: 'active', is_teacher: true }
];

// Year 11 sit in the senior bracket but run their own series (series='year11',
// is_next_term=true), with dates entered per match rather than the fixed day
// mapping. They are the live front-page schedule now that Year 12 has finished.
// Teams whose
// players signed up on multiple teams are kept on the system but left out of matches
// until the duplicates are resolved: Jethro & coolposeonthewall (Alek D),
// Conrad F & butter turtle (Conrad F / Tristan T).
export const year11Teams: TeamSeed[] = [
  { name: 'Stranger and danger', player1: 'Finn B', player2: 'Alpha G', skill_level: 1, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'MO & JO', player1: 'Tyler J', player2: 'Massimo V', skill_level: 5, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'Hot shotz', player1: 'Iggy H', player2: 'Finn N', skill_level: 5, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: '4Square', player1: 'Leo C', player2: 'Arvan W', skill_level: 3, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'Jethro', player1: 'Alek D', player2: 'Jethro K', skill_level: 4, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'pogfrogmorten', player1: 'Alec B', player2: 'Morten M', skill_level: 5, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'coolposeonthewall', player1: 'Tristan T', player2: 'Alek D', skill_level: 5, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'Conrad F', player1: 'Tristan T', player2: 'Conrad F', skill_level: 2, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'Sodabean', player1: 'Lewis C', player2: 'Gabriel C', skill_level: 4, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'Pierced viper + crimson skull', player1: 'Zola G', player2: 'Ella O', skill_level: 2, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'Bounce bros', player1: 'Esteban C', player2: 'Mac A', skill_level: 3, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'butter turtle', player1: 'Conrad F', player2: 'Leo G', skill_level: 5, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'carel l', player1: 'Carel L', player2: 'Li C', skill_level: 5, bracket: 'senior', year_group: 'Year 11', status: 'active' },
  { name: 'Trouble Squared', player1: 'Marlow C', player2: 'Oliver S', skill_level: 5, bracket: 'senior', year_group: 'Year 11', status: 'active' }
];

export const matchSeeds: MatchSeed[] = [
  { bracket: 'senior', round: 1, match_number: 1, scheduled_day: 1, team1_name: 'The Jester and the Germ', team2_name: 'Yansi&Dunlop', team3_name: 'Greatest in Cosmos', team4_name: 'Aurora', team1_score: 7, team2_score: 8, team3_score: 15, team4_score: 3, status: 'completed', is_skill_stretch: false, played_at: '2026-06-05T12:50:00+10:00' },
  { bracket: 'senior', round: 1, match_number: 2, scheduled_day: 1, team1_name: 'ruby and the labubu', team2_name: 'Louis', team3_name: 'Taiquin', team4_name: 'Green deedle', team1_score: 1, team2_score: 4, team3_score: 6, team4_score: 7, status: 'completed', is_skill_stretch: false, played_at: '2026-06-05T12:52:00+10:00' },
  { bracket: 'senior', round: 1, match_number: 3, scheduled_day: 2, team1_name: 'Me and My Hero', team2_name: 'Finn P', team3_name: 'Bessintown', team4_name: 'CHC', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: false },
  { bracket: 'senior', round: 1, match_number: 4, scheduled_day: 2, team1_name: 'Xavier A', team2_name: 'Curdled Varangians', team3_name: 'Ball Slappers', team4_name: 'Microwave', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: true },
  { bracket: 'senior', round: 1, match_number: 5, scheduled_day: 3, team1_name: 'SAJA BOYS', team2_name: 'Mr Kazanis fan club', team3_name: 'Plants v Zombies', team4_name: 'The Handball Kingz', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: false },
  { bracket: 'senior', round: 1, match_number: 6, scheduled_day: 3, team1_name: 'SydneyWolves', team2_name: "Joe R's", team3_name: 'The Chronicles', team4_name: 'Caick', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: true },
  { bracket: 'senior', round: 1, match_number: 7, scheduled_day: 4, team1_name: 'PJ method', team2_name: 'Holivy', team3_name: 'The Greens', team4_name: 'K8ieGr8 & lilhuddyonthebeat2016', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: true },
  // Juniors run a round-robin (see juniorTeams standings), so they have no knockout
  // match fixtures — their results live on the points ladder, not in `matches`.
  //
  // Year 11's own senior series (series='year11'), match_number offset to the 101+
  // band so it never collides with the Year 12 round-1 fixtures (1-7).
  // Grouped by skill within 1-2; duplicate-player teams left unplaced.
  { bracket: 'senior', round: 1, match_number: 101, scheduled_day: 6, team1_name: 'MO & JO', team2_name: 'Hot shotz', team3_name: 'pogfrogmorten', team4_name: 'carel l', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: false, series: 'year11' },
  { bracket: 'senior', round: 1, match_number: 102, scheduled_day: 6, team1_name: 'Trouble Squared', team2_name: 'Sodabean', team3_name: '4Square', team4_name: 'Bounce bros', team1_score: 0, team2_score: 0, team3_score: 0, team4_score: 0, status: 'upcoming', is_skill_stretch: false, series: 'year11' }
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

  const seedTeamRows = [...seniorTeams, ...juniorTeams, ...year11Teams, ...teacherTeams].map((team) => ({
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
      status: team.status,
      points: team.points ?? 0,
      games_played: team.games_played ?? 0,
      is_teacher: team.is_teacher ?? false
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
      duration_minutes: null,
      series: match.series ?? 'year12',
      // Kept in sync with the series for anything still reading the old flag.
      is_next_term: (match.series ?? 'year12') === 'year11'
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
    // 1 winner in a 1v1, 2 otherwise — same rule as the live scoring path.
    const advancing = advanceCount(entries.length);
    const winners = entries.slice(0, advancing);
    const losers = entries.slice(advancing);

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
      status: record?.status ?? team.status,
      points: team.points ?? 0,
      games_played: team.games_played ?? 0,
      is_teacher: team.is_teacher ?? false
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
    const winners = entries.slice(0, advanceCount(entries.length)).map((entry) => entry.name);
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
