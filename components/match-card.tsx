'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EnrichedMatch } from '@/types/tournament';
import { displayTeamName, matchLabel, roundLabel, teamBadgeClass, winnerIdsForMatch } from '@/lib/tournament-utils';
import { TeamTooltip } from '@/components/team-tooltip';

function TeamRow({
  team,
  score,
  winnerIds,
  muted,
  compact = false
}: {
  team?: EnrichedMatch['team1'];
  score: number;
  winnerIds: string[];
  muted?: boolean;
  compact?: boolean;
}) {
  if (!team) {
    return (
      <div className={`rounded-xl border border-dashed border-white/10 px-3 py-2 text-sm text-textMuted ${compact ? 'min-h-14' : 'min-h-16'}`}>
        TBD
      </div>
    );
  }

  return (
    <div className={`group relative rounded-xl border border-white/10 px-3 py-2 ${muted ? 'bg-white/5' : 'bg-[#101a2a]'} ${compact ? 'min-h-14' : 'min-h-16'}`}>
      <div className="flex items-center justify-between gap-3">
        <button type="button" className={`text-left font-extrabold leading-tight transition ${teamBadgeClass(team, winnerIds)}`}>
          <span className="block">{displayTeamName(team.name)}</span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-textMuted">{team.bracket} team</span>
        </button>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black tracking-tight transition ${muted ? 'text-eliminated' : 'text-white'} ${score ? 'animate-scorePop' : ''}`}>{score}</span>
        </div>
      </div>
      <TeamTooltip team={team} />
    </div>
  );
}

export function MatchCard({ match, compact = false }: { match: EnrichedMatch; compact?: boolean }) {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  const winnerIds = useMemo(() => {
    if (!isCompleted) return [];
    return match.winner1_id || match.winner2_id ? [match.winner1_id, match.winner2_id].filter(Boolean) as string[] : winnerIdsForMatch(match);
  }, [match, isCompleted]);

  const isWinner = (teamId?: string | null) => Boolean(teamId && winnerIds.includes(teamId));
  const [scoreTick, setScoreTick] = useState(0);
  const scoreKey = `${match.team1_score}-${match.team2_score}-${match.team3_score}-${match.team4_score}-${match.status}`;

  useEffect(() => {
    setScoreTick((value) => value + 1);
  }, [scoreKey]);

  return (
    <article
      className={`rounded-3xl border bg-[linear-gradient(180deg,rgba(27,42,74,0.92),rgba(12,20,34,0.98))] p-4 shadow-card transition ${isLive ? 'border-win/70 animate-livePulse' : 'border-white/10'} ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-textMuted">{roundLabel(match.bracket, match.round)}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-win/90">{matchLabel(match)}</p>
          <p className="mt-2 text-sm font-black leading-tight text-white">
            {[match.team1, match.team2, match.team3, match.team4]
              .filter(Boolean)
              .map((team) => displayTeamName(team!.name))
              .join(' · ')}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] ${
            match.status === 'live' ? 'border-red-500/40 bg-red-500/10 text-red-300' : match.status === 'completed' ? 'border-win/40 bg-win/10 text-win' : 'border-white/10 bg-white/5 text-textMuted'
          }`}
        >
          {match.status.toUpperCase()}
        </span>
      </div>

      <div key={scoreTick} className={`mt-4 grid gap-3 ${match.team3_id ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-3">
          <TeamRow team={match.team1 || undefined} score={match.team1_score} winnerIds={winnerIds} muted={isCompleted && !isWinner(match.team1_id)} compact={compact} />
          <TeamRow team={match.team2 || undefined} score={match.team2_score} winnerIds={winnerIds} muted={isCompleted && !isWinner(match.team2_id)} compact={compact} />
        </div>
        {match.team3_id ? (
          <div className="space-y-3">
            <TeamRow team={match.team3 || undefined} score={match.team3_score} winnerIds={winnerIds} muted={isCompleted && !isWinner(match.team3_id)} compact={compact} />
            <TeamRow team={match.team4 || undefined} score={match.team4_score} winnerIds={winnerIds} muted={isCompleted && !isWinner(match.team4_id)} compact={compact} />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-textMuted">
        <span>{match.is_skill_stretch ? '⚠ Skill stretch match' : 'Standard match'}</span>
        <span>{match.status === 'completed' ? 'Winner locked in' : 'Top 2 advance'}</span>
      </div>
    </article>
  );
}
