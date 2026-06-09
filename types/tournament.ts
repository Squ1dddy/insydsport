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
}

export interface Match {
  id: string;
  bracket: BracketName;
  round: number;
  match_number: number;
  scheduled_day: number;
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
}

export interface EnrichedMatch extends Match {
  team1?: Team | null;
  team2?: Team | null;
  team3?: Team | null;
  team4?: Team | null;
  winner1?: Team | null;
  winner2?: Team | null;
}

export interface TournamentData {
  teams: Team[];
  matches: EnrichedMatch[];
}
