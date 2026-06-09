import type { BracketName, EnrichedMatch, Team } from '@/types/tournament';

export function roundLabel(bracket: BracketName, round: number) {
  if (bracket === 'senior') {
    return ['Round 1', 'Round 2', 'Quarterfinals', 'Semifinals', 'Grand Final'][round - 1] || `Round ${round}`;
  }

  return ['Round 1', 'Round 2', 'Semifinals', 'Grand Final'][round - 1] || `Round ${round}`;
}

export function matchLabel(match: EnrichedMatch) {
  const date = getScheduledDate(match.scheduled_day);
  const dateStr = date ? ` (${formatAestDate(date)})` : '';
  return `Day ${match.scheduled_day}${dateStr} — Match ${match.match_number}`;
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

export function teamBadgeClass(team?: Team | null, winnerIds: string[] = []) {
  if (!team) return 'text-textMuted';
  if (winnerIds.includes(team.id)) return 'text-win';
  if (team.status === 'eliminated') return 'text-eliminated';
  return 'text-white';
}
