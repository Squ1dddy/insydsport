import type { BracketName, EnrichedMatch, Match, Team } from '@/types/tournament';

export function roundLabel(bracket: BracketName, round: number) {
  if (bracket === 'senior') {
    return ['Round 1', 'Round 2', 'Quarterfinals', 'Semifinals', 'Grand Final'][round - 1] || `Round ${round}`;
  }

  return ['Round 1', 'Round 2', 'Semifinals', 'Grand Final'][round - 1] || `Round ${round}`;
}

export function matchLabel(match: EnrichedMatch) {
  if (match.is_next_term) {
    return `TBC · Next Term — Match ${match.match_number}`;
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

// YYYY-MM-DD in Sydney time — lets us compare "which day are we on" by calendar
// date (en-CA formats as YYYY-MM-DD, which sorts lexicographically).
function aestDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// Returns the "current" scheduled day, driven by today's AEST date and AWARE of
// per-match `scheduled_date` overrides. For each day it takes the earliest match
// date on that day (falling back to the fixed day→date mapping for days with no
// matches), then returns the highest day whose date is today or earlier. A day
// becomes "current" on its actual calendar date. Day 6+ next-term (Year 11)
// matches are intentionally excluded.
//
// Passing no matches falls back to the fixed mapping (legacy behaviour).
export function getCurrentScheduledDay(
  matches: Pick<Match, 'scheduled_day' | 'scheduled_date' | 'is_next_term'>[] = [],
  now: Date = new Date()
): number {
  const todayKey = aestDateKey(now);

  // day -> earliest YYYY-MM-DD (AEST) among that day's current-term matches.
  const dayKeys = new Map<number, string>();
  for (const match of matches) {
    if (match.is_next_term) continue;
    const iso = getMatchDate(match);
    if (!iso) continue;
    const key = aestDateKey(new Date(iso));
    const existing = dayKeys.get(match.scheduled_day);
    if (existing === undefined || key < existing) {
      dayKeys.set(match.scheduled_day, key);
    }
  }

  // Ensure baseline days 1-5 always have a date from the fixed mapping.
  for (let day = 1; day <= 5; day += 1) {
    if (!dayKeys.has(day)) {
      const iso = getScheduledDate(day);
      if (iso) dayKeys.set(day, aestDateKey(new Date(iso)));
    }
  }

  const days = [...dayKeys.keys()].sort((a, b) => a - b);
  let result = days[0] ?? 1;
  for (const day of days) {
    if (dayKeys.get(day)! <= todayKey) {
      result = day;
    }
  }
  return result;
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

export function winnerIdsForMatch(match: EnrichedMatch) {
  const teams = [
    { id: match.team1_id, score: match.team1_score },
    { id: match.team2_id, score: match.team2_score },
    { id: match.team3_id, score: match.team3_score },
    { id: match.team4_id, score: match.team4_score }
  ].filter((item): item is { id: string; score: number } => Boolean(item.id));

  return teams.sort((a, b) => b.score - a.score).slice(0, Math.min(2, teams.length)).map((item) => item.id);
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
  const tieAtCutoff = sorted.length >= 4 && sorted[1]?.score === sorted[2]?.score;
  const cutoff = sorted[1]?.score ?? 0;

  return {
    tieAtCutoff,
    placements: new Map<string, MatchPlacement>(
      entries.map((entry) => {
        if (tieAtCutoff && entry.score === cutoff) {
          return [entry.id, 'tie'];
        }

        const advanced = sorted.findIndex((item) => item.id === entry.id) < 2;
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
    .filter((team) => team.bracket === 'junior' && !team.is_teacher)
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
      .filter((team) => team.bracket === 'junior' && !team.is_teacher)
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

  const completed = matches.filter((m) => m.status === 'completed' && !m.is_next_term && m.bracket === bracket);
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
  /** ISO string from getScheduledDate for display formatting. */
  dateIso: string | null;
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
  nowMs: number = Date.now()
): DayWinnersBanner | null {
  // Senior completed matches with a completion timestamp and at least one winner.
  const candidates = matches.filter(
    (m) =>
      m.bracket === 'senior' &&
      m.status === 'completed' &&
      !m.is_next_term &&
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
    dateIso: getScheduledDate(day),
    anchorMs,
    expiresAtMs,
    entries
  };
}
