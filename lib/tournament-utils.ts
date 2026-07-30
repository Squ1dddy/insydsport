import type { BracketName, EnrichedMatch, Match, SeniorSeries, Team } from '@/types/tournament';

// The senior bracket carries three independent knockout series that share it:
//   • year12  — concluded (5 rounds: R1 → R2 → QF → SF → GF). Champion: Bessintown.
//   • year11  — running now (12 teams → 3 R1 matches → 6 advance → 2 semis →
//               final, so 3 rounds, NOT 5).
//   • teacher — concluded (2 rounds: one 4-team round, then a 1v1 final). Staff.
// Carried on `Match.series`; /api/state guarantees it is populated even before the
// supabase/match-series.sql migration is run.
export type { SeniorSeries };

/** Display order for the senior series switch — the live one first. */
export const SENIOR_SERIES: SeniorSeries[] = ['year11', 'year12', 'teacher'];

export function seriesOf(match: Pick<Match, 'bracket' | 'series'>): SeniorSeries | null {
  return match.bracket === 'senior' ? match.series : null;
}

export function seriesLabel(series: SeniorSeries) {
  return series === 'year11' ? 'Year 11' : series === 'teacher' ? 'Teachers' : 'Year 12';
}

// How many rounds a bracket/series runs to. Drives the bracket-tree column count,
// the round pills, and the auto-advance cap in /api/admin/matches.
export function totalRoundsFor(bracket: BracketName, series: SeniorSeries = 'year12'): number {
  if (bracket === 'junior') return 4;
  if (series === 'year11') return 3;
  if (series === 'teacher') return 2;
  return 5;
}

export function roundLabel(bracket: BracketName, round: number, series: SeniorSeries = 'year12') {
  if (bracket === 'senior') {
    const labels =
      series === 'year11'
        ? ['Round 1', 'Semifinals', 'Grand Final']
        : series === 'teacher'
          ? ['Round 1', 'Grand Final']
          : ['Round 1', 'Round 2', 'Quarterfinals', 'Semifinals', 'Grand Final'];
    return labels[round - 1] || `Round ${round}`;
  }

  return ['Round 1', 'Round 2', 'Semifinals', 'Grand Final'][round - 1] || `Round ${round}`;
}

export function matchLabel(match: EnrichedMatch) {
  // Only the Year 12 series uses the fixed day→date mapping. Year 11 and teacher
  // matches are date-driven: they read "Date TBC" until an admin enters a real date
  // (Admin → Matches → Date), then switch to that date automatically.
  if (match.bracket === 'senior' && match.series !== 'year12') {
    return match.scheduled_date
      ? `${formatAestDate(getMatchDate(match))} — Match ${match.match_number}`
      : `Date TBC — Match ${match.match_number}`;
  }
  const date = getMatchDate(match);
  const dateStr = date ? ` (${formatAestDate(date)})` : '';
  return `Day ${match.scheduled_day}${dateStr} — Match ${match.match_number}`;
}

// Normalises a team's year_group ("Year 12, Week 1" → "Year 12") for grouping.
// Teacher teams collapse to a single "Teachers" bucket regardless of year.
export function yearGroupOf(team: Team): string {
  if (team.is_teacher) return 'Teachers';
  const match = team.year_group.match(/Year\s*\d+(?:\s*-\s*\d+)?/i);
  return match ? match[0].replace(/\s+/g, ' ').trim() : team.year_group;
}

// Resolves a match's display date. Prefers its per-match `scheduled_date`
// override (anchored to 9am AEST so the calendar day renders correctly in the
// Sydney timezone), falling back to the fixed day→date mapping when unset.
export function getMatchDate(match: Pick<Match, 'scheduled_day' | 'scheduled_date'>): string | null {
  if (match.scheduled_date) {
    return `${match.scheduled_date}T09:00:00+10:00`;
  }
  return getScheduledDate(match.scheduled_day);
}

export function getScheduledDate(day: number): string | null {
  const mapping: Record<number, string> = {
    1: '2026-06-05T09:00:00+10:00',
    2: '2026-06-11T09:00:00+10:00',
    3: '2026-06-12T09:00:00+10:00',
    4: '2026-06-18T09:00:00+10:00',
    5: '2026-06-19T09:00:00+10:00'
  };
  return mapping[day] || null;
}

export function matchTeamsLabel(match: EnrichedMatch) {
  return [match.team1, match.team2, match.team3, match.team4]
    .filter(Boolean)
    .map((team) => displayTeamName(team!.name))
    .join(' · ');
}

export function skillClass(skill: number) {
  return (
    {
      5: 'text-skill5 border-skill5/40 bg-skill5/10',
      4: 'text-skill4 border-skill4/40 bg-skill4/10',
      3: 'text-skill3 border-skill3/40 bg-skill3/10',
      2: 'text-skill2 border-skill2/40 bg-skill2/10',
      1: 'text-skill1 border-skill1/40 bg-skill1/10'
    }[skill] || 'text-white border-white/20 bg-white/5'
  );
}

export function skillDotClass(skill: number) {
  return (
    {
      5: 'bg-skill5',
      4: 'bg-skill4',
      3: 'bg-skill3',
      2: 'bg-skill2',
      1: 'bg-skill1'
    }[skill] || 'bg-white'
  );
}

/**
 * How many teams come out of a match.
 *
 * The headline format is "4 teams per match, top 2 advance", but that must not be
 * applied blindly: a **1v1 has exactly one winner**. Advancing 2 of 2 would advance
 * the team that just lost — which is what made the grand final read "x and etti
 * advanced" when they had in fact been beaten 15–14.
 *
 * So: 2 teams → 1 advances. 3 or 4 teams → 2 advance. This is the single source of
 * truth; nothing should hardcode 2.
 */
export function advanceCount(teamCount: number): number {
  return teamCount <= 2 ? 1 : 2;
}

/** True when this match is the last round of its bracket/series — i.e. the final. */
export function isGrandFinal(match: Pick<Match, 'bracket' | 'round' | 'series'>) {
  return match.round === totalRoundsFor(match.bracket, match.series);
}

export function winnerIdsForMatch(match: EnrichedMatch) {
  const teams = [
    { id: match.team1_id, score: match.team1_score },
    { id: match.team2_id, score: match.team2_score },
    { id: match.team3_id, score: match.team3_score },
    { id: match.team4_id, score: match.team4_score }
  ].filter((item): item is { id: string; score: number } => Boolean(item.id));

  return teams
    .sort((a, b) => b.score - a.score)
    .slice(0, advanceCount(teams.length))
    .map((item) => item.id);
}

export function formatAestTime(iso: string | null) {
  if (!iso) return '—';

  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(iso));
}

export function formatAestDate(iso: string | null) {
  if (!iso) return '—';

  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(iso));
}

export function formatAestDateTime(iso: string | null) {
  if (!iso) return '—';

  const date = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
  const time = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
    .format(new Date(iso))
    .replace(/\s+/g, '')
    .toLowerCase();

  return `${date} · ${time}`;
}

export function displayTeamName(name: string) {
  return name.toUpperCase();
}

// Reduce a player's full name to "First L" for public display (school privacy
// rule: no surnames on the site). Applied server-side in /api/state so the full
// surname never reaches the browser. Idempotent — running it on an already
// reduced name ("Xavier M") returns the same value, and single-word names
// ("Harrex", "TBC") are left untouched.
export function displayPlayerName(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initial = last.charAt(0).toUpperCase();
  return `${parts[0]} ${initial}`;
}

export type MatchPlacement = 'advanced' | 'eliminated' | 'tie';

export function getMatchPlacements(match: EnrichedMatch) {
  const entries = [
    { id: match.team1_id, score: match.team1_score },
    { id: match.team2_id, score: match.team2_score },
    { id: match.team3_id, score: match.team3_score },
    { id: match.team4_id, score: match.team4_score }
  ].filter((entry): entry is { id: string; score: number } => Boolean(entry.id));

  const sorted = [...entries].sort((a, b) => b.score - a.score);
  // The cutoff sits at however many actually advance — 1 in a 1v1, 2 otherwise —
  // so a level scoreline is flagged for admin review at the right boundary. In a
  // 1v1 that means a genuine draw; in a 4-team match, a tie for 2nd/3rd.
  const advancing = advanceCount(entries.length);
  const tieAtCutoff = sorted.length > advancing && sorted[advancing - 1]?.score === sorted[advancing]?.score;
  const cutoff = sorted[advancing - 1]?.score ?? 0;

  return {
    tieAtCutoff,
    placements: new Map<string, MatchPlacement>(
      entries.map((entry) => {
        if (tieAtCutoff && entry.score === cutoff) {
          return [entry.id, 'tie'];
        }

        const advanced = sorted.findIndex((item) => item.id === entry.id) < advancing;
        return [entry.id, advanced ? 'advanced' : 'eliminated'];
      })
    )
  };
}

export interface StandingRow {
  rank: number;
  team: Team;
}

// Junior round-robin ladder: rank by total points (desc). Ties broken by fewer
// games played (more efficient), then alphabetically so the order is stable.
// Equal-points teams share the same rank number.
export function getJuniorStandings(teams: Team[]): StandingRow[] {
  const juniors = teams
    .filter((team) => team.bracket === 'junior')
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.games_played - b.games_played ||
        a.name.localeCompare(b.name)
    );

  let lastPoints: number | null = null;
  let lastRank = 0;
  return juniors.map((team, index) => {
    const rank = lastPoints !== null && team.points === lastPoints ? lastRank : index + 1;
    lastPoints = team.points;
    lastRank = rank;
    return { rank, team };
  });
}

export interface TeamStat {
  team: Team;
  /** Games played. */
  played: number;
  /** Senior: total score across completed matches. Junior: round-robin ladder points. */
  points: number;
  /** points / played (0 when unplayed) — the efficiency / per-game figure. */
  avgPoints: number;
}

// Points-vs-games leaderboard, scoped to a bracket. The two brackets store their
// scoring differently, so we read from the right source for each:
//   • Senior (knockout): aggregate actual match scores from completed matches.
//   • Junior (round-robin): there are NO junior match rows — they were removed in
//     junior-round-robin.sql — so points/games live on the team record (same
//     source as the junior ladder).
export function getTeamStats(matches: EnrichedMatch[], teams: Team[], bracket: BracketName): TeamStat[] {
  if (bracket === 'junior') {
    return teams
      .filter((team) => team.bracket === 'junior')
      .map((team) => ({
        team,
        played: team.games_played,
        points: team.points,
        avgPoints: team.games_played ? team.points / team.games_played : 0
      }))
      .sort(
        (a, b) => b.points - a.points || b.avgPoints - a.avgPoints || a.team.name.localeCompare(b.team.name)
      );
  }

  // Both senior series count. A senior team only ever plays in one of them, so
  // including Year 11 adds its teams' real totals without mixing anyone's numbers —
  // and excluding it would silently zero the series that is actually running.
  const completed = matches.filter((m) => m.status === 'completed' && m.bracket === bracket);
  const byTeam = new Map<string, TeamStat>();
  for (const match of completed) {
    const slots = [
      { team: match.team1, score: match.team1_score },
      { team: match.team2, score: match.team2_score },
      { team: match.team3, score: match.team3_score },
      { team: match.team4, score: match.team4_score }
    ];
    for (const { team, score } of slots) {
      if (!team) continue;
      const row = byTeam.get(team.id) ?? { team, played: 0, points: 0, avgPoints: 0 };
      row.played += 1;
      row.points += score;
      byTeam.set(team.id, row);
    }
  }

  return [...byTeam.values()]
    .map((row) => ({ ...row, avgPoints: row.played ? row.points / row.played : 0 }))
    .sort((a, b) => b.points - a.points || b.avgPoints - a.avgPoints || a.team.name.localeCompare(b.team.name));
}

export function teamBadgeClass(team?: Team | null, winnerIds: string[] = []) {
  if (!team) return 'text-textMuted';
  if (winnerIds.includes(team.id)) return 'text-win';
  if (team.status === 'eliminated') return 'text-eliminated';
  return 'text-white';
}

export interface DayWinnersBanner {
  /** The scheduled_day number of the most-recently-completed senior day. */
  day: number;
  /** ISO string for display formatting — a real per-match date when one exists. */
  dateIso: string | null;
  /** The round those matches belong to — how Year 11 days are labelled, since
   *  they carry no day→date mapping and "Day 6" means nothing to a viewer. */
  round: number;
  /** Which series the winners came from. */
  series: SeniorSeries;
  /** Unix ms of the earliest played_at in the day — the shared 24h clock anchor. */
  anchorMs: number;
  /** anchorMs + 24 hours — when both sets disappear together. */
  expiresAtMs: number;
  /** One entry per completed senior match in the day, sorted by match_number. */
  entries: { match: EnrichedMatch; winners: Team[] }[];
}

/**
 * Returns a DayWinnersBanner for the most-recently-completed senior day, or null
 * when no qualifying matches exist or the 24h window has elapsed.
 *
 * "Winners of the day" = all senior completed matches on the latest played day.
 * The clock is anchored to the FIRST result (min played_at), so both sets
 * disappear together exactly 24h after the first match of the day finished.
 *
 * @param matches - EnrichedMatch[] from useTournament() (already has winner1/winner2 joined)
 * @param nowMs   - override for unit-testing / forced expiry checks (defaults to Date.now())
 */
export function getSeniorDayWinners(
  matches: EnrichedMatch[],
  nowMs: number = Date.now(),
  series: SeniorSeries = 'year12'
): DayWinnersBanner | null {
  // Senior completed matches with a completion timestamp and at least one winner,
  // scoped to one series — the three senior series run independently, so a concluded
  // Year 12 or teacher result must never surface as "today's winners" for Year 11.
  const candidates = matches.filter(
    (m) =>
      m.bracket === 'senior' &&
      m.status === 'completed' &&
      m.series === series &&
      m.played_at !== null &&
      (m.winner1 || m.winner2)
  );

  if (candidates.length === 0) return null;

  // The "most recent day" is determined by which day had the latest completion.
  const latestMs = Math.max(...candidates.map((m) => new Date(m.played_at!).getTime()));
  const latestMatch = candidates.find((m) => new Date(m.played_at!).getTime() === latestMs)!;
  const day = latestMatch.scheduled_day;

  // Gather all entries from that day.
  const dayEntries = candidates.filter((m) => m.scheduled_day === day);

  // Anchor: earliest played_at in the day (first result).
  const anchorMs = Math.min(...dayEntries.map((m) => new Date(m.played_at!).getTime()));
  const expiresAtMs = anchorMs + 24 * 60 * 60 * 1000;

  // Expired — both sets vanish together.
  if (nowMs >= expiresAtMs) return null;

  const entries = dayEntries
    .sort((a, b) => a.match_number - b.match_number)
    .map((match) => ({
      match,
      winners: [match.winner1, match.winner2].filter((t): t is Team => Boolean(t))
    }));

  return {
    day,
    // Prefer a real per-match date (the only date a Year 11 match ever has) and
    // fall back to the fixed day→date mapping for the Year 12 series.
    dateIso: getMatchDate(entries[0].match) ?? getScheduledDate(day),
    round: entries[0].match.round,
    series: entries[0].match.series,
    anchorMs,
    expiresAtMs,
    entries
  };
}

export interface SeriesChampion {
  champion: Team;
  championScore: number;
  runnerUp: Team | null;
  runnerUpScore: number | null;
  /** True when the top two scores are level — the title is then undecided. */
  tied: boolean;
  /** The grand-final match itself. */
  match: EnrichedMatch;
}

/**
 * The champion of a knockout series: the top scorer of its completed final-round
 * match, or null while the final is unplayed.
 *
 * Note the 4-team format records BOTH of the top 2 in `winner1_id`/`winner2_id`
 * even in the grand final, so the title cannot be read off those columns — it is
 * decided on score. A level top-two sets `tied`, which callers must handle rather
 * than crowning an arbitrary side.
 */
export function getSeriesChampion(
  matches: EnrichedMatch[],
  bracket: BracketName = 'senior',
  series: SeniorSeries = 'year12'
): SeriesChampion | null {
  const finalRound = totalRoundsFor(bracket, series);
  const final = matches.find(
    (m) => m.bracket === bracket && m.series === series && m.round === finalRound && m.status === 'completed'
  );
  if (!final) return null;

  const ranked = [
    { team: final.team1, score: final.team1_score },
    { team: final.team2, score: final.team2_score },
    { team: final.team3, score: final.team3_score },
    { team: final.team4, score: final.team4_score }
  ]
    .filter((entry): entry is { team: Team; score: number } => Boolean(entry.team))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return null;

  return {
    champion: ranked[0].team,
    championScore: ranked[0].score,
    runnerUp: ranked[1]?.team ?? null,
    runnerUpScore: ranked[1]?.score ?? null,
    tied: ranked.length > 1 && ranked[0].score === ranked[1].score,
    match: final
  };
}
