export type BracketName = 'senior' | 'junior';
export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type TeamStatus = 'active' | 'eliminated' | 'bye';

// The senior bracket holds three independent knockout series, carried on
// `Match.series`:
//   • year12  — concluded, 5 rounds. Champion: Bessintown.
//   • year11  — running, 3 rounds. The front-page schedule.
//   • teacher — concluded, 2 rounds (4-team round 1 → 1v1 final). Staff teams.
// See totalRoundsFor/roundLabel in lib/tournament-utils. Juniors run a round-robin
// ladder and have no series.
export type SeniorSeries = 'year12' | 'year11' | 'teacher';

export interface Team {
  id: string;
  name: string;
  player1: string;
  player2: string;
  skill_level: number;
  bracket: BracketName;
  year_group: string;
  status: TeamStatus;
  // Round-robin standings (junior bracket). Seniors keep these at 0 — they run a
  // knockout and rank by match winners, not a points ladder.
  points: number;
  games_played: number;
  // Teacher teams are admin-only: hidden from every public view and never
  // auto-queued, but can be slotted into any junior or senior match by an admin.
  is_teacher: boolean;
  // Crowd favourites: how many viewers have starred (followed) this team. Bumped
  // via /api/stars when a device follows/unfollows; surfaced on the stats page.
  star_count: number;
}

export interface Match {
  id: string;
  bracket: BracketName;
  round: number;
  match_number: number;
  scheduled_day: number;
  // Optional per-match date override (YYYY-MM-DD). When set it overrides the
  // fixed day→date mapping for display while the match keeps its "Day N" group.
  scheduled_date: string | null;
  team1_id: string;
  team2_id: string;
  team3_id: string | null;
  team4_id: string | null;
  team1_score: number;
  team2_score: number;
  team3_score: number;
  team4_score: number;
  status: MatchStatus;
  winner1_id: string | null;
  winner2_id: string | null;
  is_skill_stretch: boolean;
  played_at: string | null;
  duration_minutes: number | null;
  // Legacy two-way series flag, kept in sync with `series === 'year11'`. Prefer
  // `series` — this cannot express the teacher series.
  is_next_term: boolean;
  // Which senior series this match belongs to. Always present on matches returned
  // by /api/state: that route reads the `series` column when it exists and derives
  // the value otherwise, so consumers never have to handle it being missing.
  series: SeniorSeries;
}

export interface EnrichedMatch extends Match {
  team1?: Team | null;
  team2?: Team | null;
  team3?: Team | null;
  team4?: Team | null;
  winner1?: Team | null;
  winner2?: Team | null;
}

export interface AppSettings {
  // null = auto (derived from today's AEST date); 1-5 = admin-forced day.
  currentDayOverride: number | null;
}

export type NotificationLevel = 'info' | 'warning' | 'success';

// Admin-posted announcement shown as a dismissible banner on the home page.
export interface Notification {
  id: string;
  title: string | null;
  message: string;
  level: NotificationLevel;
  active: boolean;
  created_at: string;
}

export interface TournamentData {
  teams: Team[];
  matches: EnrichedMatch[];
  settings: AppSettings;
  notifications: Notification[];
}
