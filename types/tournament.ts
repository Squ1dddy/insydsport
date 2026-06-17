export type BracketName = 'senior' | 'junior';
export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type TeamStatus = 'active' | 'eliminated' | 'bye';

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
  // Year 11 plays next term — these matches are kept behind a "TBC Next Term"
  // toggle and excluded from the current schedule / This Week views.
  is_next_term: boolean;
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
