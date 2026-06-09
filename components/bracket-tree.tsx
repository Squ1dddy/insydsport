'use client';

import { useState } from 'react';
import type { BracketName, EnrichedMatch, Team } from '@/types/tournament';
import { displayTeamName, roundLabel, winnerIdsForMatch } from '@/lib/tournament-utils';

const roundCounts: Record<BracketName, number> = {
  senior: 5,
  junior: 4
};

function getPlacement(match: EnrichedMatch, teamId: string) {
  const winnerIds = [match.winner1_id, match.winner2_id].filter(Boolean) as string[];
  const resolved = winnerIds.length > 0 ? winnerIds : winnerIdsForMatch(match);
  return resolved.includes(teamId) ? 'advanced' : 'eliminated';
}

function TeamLine({
  match,
  team,
  score
}: {
  match: EnrichedMatch;
  team?: Team | null;
  score: number;
}) {
  if (!team) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-xs text-textMuted">
        <span className="block">TBD</span>
        <span className="text-white/40">0</span>
      </div>
    );
  }

  const placement = match.status === 'completed' ? getPlacement(match, team.id) : 'upcoming';
  const tone =
    placement === 'advanced'
      ? 'text-gold'
      : placement === 'eliminated'
        ? 'text-eliminated line-through decoration-white/30'
        : 'text-slate-100';

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 ${tone}`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 break-words text-[12px] font-black leading-tight">{displayTeamName(team.name)}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs font-black">
        <span>{score}</span>
        {placement === 'advanced' ? <span className="rounded-full border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-gold">ADV</span> : null}
      </div>
    </div>
  );
}

function BracketNode({ match }: { match: EnrichedMatch }) {
  return (
    <article
      className={`group relative rounded-2xl border bg-[linear-gradient(180deg,rgba(27,42,74,0.94),rgba(10,18,30,0.98))] p-3 shadow-card transition-all duration-300 hover:scale-[1.02] hover:border-gold/30 ${
        match.status === 'live' ? 'border-gold/70 animate-livePulse' : 'border-secondary'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-textMuted">{roundLabel(match.bracket, match.round)}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold/90">
            Day {match.scheduled_day} · Match {match.match_number}
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.28em] ${
            match.status === 'live'
              ? 'border-red-500/40 bg-red-500/10 text-red-300'
              : match.status === 'completed'
                ? 'border-gold/40 bg-gold/10 text-gold'
                : 'border-white/10 bg-white/5 text-textMuted'
          }`}
        >
          {match.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <TeamLine match={match} team={match.team1 || null} score={match.team1_score} />
        <TeamLine match={match} team={match.team2 || null} score={match.team2_score} />
        <TeamLine match={match} team={match.team3 || null} score={match.team3_score} />
        <TeamLine match={match} team={match.team4 || null} score={match.team4_score} />
      </div>
    </article>
  );
}

export function BracketTree({ matches, bracket, highlightRound }: { matches: EnrichedMatch[]; bracket: BracketName; highlightRound?: number }) {
  const totalRounds = roundCounts[bracket];
  const [collapsedRounds, setCollapsedRounds] = useState<number[]>([]);

  const toggleRound = (round: number) => {
    setCollapsedRounds(prev => prev.includes(round) ? prev.filter(r => r !== round) : [...prev, round]);
  };

  return (
    <div className="w-full">
      <div className="grid w-full gap-4 md:grid-cols-1 lg:grid-cols-5">
        {Array.from({ length: totalRounds }, (_, index) => {
          const roundNumber = index + 1;
          const roundMatches = matches.filter((match) => match.round === roundNumber).sort((a, b) => a.match_number - b.match_number);
          const isCollapsed = collapsedRounds.includes(roundNumber);
          const isHighlighted = highlightRound === undefined || highlightRound === roundNumber;

          return (
            <section 
              key={roundNumber} 
              className={`flex flex-col rounded-[1.25rem] border transition-all duration-300 ${
                isHighlighted ? 'border-secondary bg-primary' : 'border-secondary/30 bg-primary/50'
              } p-4`}
            >
              <button 
                onClick={() => toggleRound(roundNumber)}
                className="mb-3 flex items-center justify-between rounded-xl border border-secondary bg-secondary px-4 py-3 text-left transition-all hover:border-gold/30"
              >
                <span className="text-xs font-black uppercase tracking-[0.28em] text-gold">
                  {roundLabel(bracket, roundNumber)}
                </span>
                <span className="text-textMuted">{isCollapsed ? '▼' : '▲'}</span>
              </button>
              
              {!isCollapsed && (
                <div className="space-y-4">
                  {roundMatches.length > 0 ? (
                    roundMatches.map((match) => <BracketNode key={match.id} match={match} />)
                  ) : (
                    <div className="rounded-xl border border-dashed border-secondary px-3 py-4 text-center text-xs text-textMuted">Awaiting results</div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
