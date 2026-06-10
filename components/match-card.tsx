'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [rosterOpen, setRosterOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const isWinner = team ? winnerIds.includes(team.id) : false;

  // On touch devices the roster is controlled purely by `rosterOpen` (hover/focus
  // reveals are gated to hover-capable pointers in TeamTooltip). Give it the usual
  // overlay dismissals: tap anywhere outside, or press Escape, to close it.
  useEffect(() => {
    if (!rosterOpen) return;
    const handlePointer = (event: PointerEvent) => {
      if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
        setRosterOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRosterOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [rosterOpen]);

  if (!team) {
    return (
      <div
        className={`flex items-center rounded-xl border border-dashed border-line/70 px-3 font-mono text-xs uppercase tracking-[0.2em] text-ash ${
          compact ? 'min-h-[3.25rem]' : 'min-h-[3.75rem]'
        }`}
      >
        TBD
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      className={`group relative rounded-xl border px-3 py-2 transition-colors ${
        isWinner ? 'border-gold/45 bg-gold/[0.07]' : muted ? 'border-line/50 bg-ink/40 hover:border-gold/25' : 'border-line bg-ink/60 hover:border-gold/30 hover:bg-ink/70'
      } ${compact ? 'min-h-[3.25rem]' : 'min-h-[3.75rem]'}`}
    >
      {/* Winner accent rail (inset so it stays inside the rounded corners). */}
      {isWinner ? <span className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-gold" aria-hidden /> : null}
      <div className="flex items-center justify-between gap-3 pl-1.5">
        <button
          type="button"
          onClick={() => setRosterOpen((value) => !value)}
          aria-expanded={rosterOpen}
          className={`text-left leading-tight transition ${teamBadgeClass(team, winnerIds)}`}
        >
          <span className="block font-bold tracking-tight">{displayTeamName(team.name)}</span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-ash transition-colors group-hover:text-gold">{team.year_group} · roster {rosterOpen ? '▴' : '▾'}</span>
        </button>
        <span
          className={`digits font-display text-3xl leading-none tracking-tight ${
            muted ? 'text-eliminated' : isWinner ? 'text-volt' : 'text-bone'
          } ${score ? 'animate-scorePop' : ''}`}
        >
          {score}
        </span>
      </div>
      <TeamTooltip team={team} open={rosterOpen} onClose={() => setRosterOpen(false)} />
    </div>
  );
}

function StatusChip({ status }: { status: EnrichedMatch['status'] }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-flare/50 bg-flare/12 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-flare">
        <span className="h-1.5 w-1.5 rounded-full bg-flare animate-dotPulse" />
        Live
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="rounded-full border border-volt/40 bg-volt/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-volt">
        Final
      </span>
    );
  }
  return (
    <span className="rounded-full border border-line bg-ink/60 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-ash">
      Upcoming
    </span>
  );
}

export function MatchCard({ match, compact = false }: { match: EnrichedMatch; compact?: boolean }) {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  const winnerIds = useMemo(() => {
    if (!isCompleted) return [];
    return match.winner1_id || match.winner2_id ? ([match.winner1_id, match.winner2_id].filter(Boolean) as string[]) : winnerIdsForMatch(match);
  }, [match, isCompleted]);

  const isWinner = (teamId?: string | null) => Boolean(teamId && winnerIds.includes(teamId));
  const [scoreTick, setScoreTick] = useState(0);
  const scoreKey = `${match.team1_score}-${match.team2_score}-${match.team3_score}-${match.team4_score}-${match.status}`;

  useEffect(() => {
    setScoreTick((value) => value + 1);
  }, [scoreKey]);

  return (
    <article
      className={`relative rounded-2xl border bg-gradient-to-b from-surface to-ink/90 shadow-card transition-all duration-300 hover:border-gold/40 ${
        isLive ? 'border-flare/55 animate-livePulse' : 'border-line'
      } ${compact ? 'p-3.5' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-line/70 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-base uppercase leading-none tracking-wide text-bone">{roundLabel(match.bracket, match.round)}</span>
          </div>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">{matchLabel(match)}</p>
        </div>
        <StatusChip status={match.status} />
      </div>

      <div key={scoreTick} className={`mt-3.5 grid gap-2.5 ${match.team3_id ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-2.5">
          <TeamRow team={match.team1 || undefined} score={match.team1_score} winnerIds={winnerIds} muted={isCompleted && !isWinner(match.team1_id)} compact={compact} />
          <TeamRow team={match.team2 || undefined} score={match.team2_score} winnerIds={winnerIds} muted={isCompleted && !isWinner(match.team2_id)} compact={compact} />
        </div>
        {match.team3_id ? (
          <div className="space-y-2.5">
            <TeamRow team={match.team3 || undefined} score={match.team3_score} winnerIds={winnerIds} muted={isCompleted && !isWinner(match.team3_id)} compact={compact} />
            <TeamRow team={match.team4 || undefined} score={match.team4_score} winnerIds={winnerIds} muted={isCompleted && !isWinner(match.team4_id)} compact={compact} />
          </div>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line/70 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
        <span className="inline-flex items-center gap-1.5">
          {match.is_skill_stretch ? <span className="text-flare">▲ Skill stretch</span> : 'Standard match'}
        </span>
        <span className={isCompleted ? 'text-volt' : ''}>{isCompleted ? 'Winners locked' : 'Top 2 advance'}</span>
      </div>
    </article>
  );
}
