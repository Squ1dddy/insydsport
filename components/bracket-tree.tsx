'use client';

import { useState } from 'react';
import type { BracketName, EnrichedMatch, SeniorSeries, Team } from '@/types/tournament';
import { displayTeamName, roundLabel, totalRoundsFor, winnerIdsForMatch, type SeriesChampion } from '@/lib/tournament-utils';
import { TeacherBadge } from '@/components/teacher-badge';

function getPlacement(match: EnrichedMatch, teamId: string) {
  const winnerIds = [match.winner1_id, match.winner2_id].filter(Boolean) as string[];
  const resolved = winnerIds.length > 0 ? winnerIds : winnerIdsForMatch(match);
  return resolved.includes(teamId) ? 'advanced' : 'eliminated';
}

function TeamLine({ match, team, score }: { match: EnrichedMatch; team?: Team | null; score: number }) {
  if (!team) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
        <span className="block">TBD</span>
        <span className="text-ash/50">0</span>
      </div>
    );
  }

  const placement = match.status === 'completed' ? getPlacement(match, team.id) : 'upcoming';
  const advanced = placement === 'advanced';
  const eliminated = placement === 'eliminated';

  return (
    <div
      className={`relative flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 ${
        advanced ? 'bg-volt/[0.07]' : ''
      }`}
    >
      {advanced ? <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-volt" aria-hidden /> : null}
      <span className="flex min-w-0 items-center gap-1.5 pl-1.5">
        <span
          className={`min-w-0 break-words text-[12px] font-bold leading-tight ${
            advanced ? 'text-volt' : eliminated ? 'text-eliminated line-through decoration-eliminated/60' : 'text-bone'
          }`}
        >
          {displayTeamName(team.name)}
        </span>
        <TeacherBadge team={team} />
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={`digits font-display text-base leading-none ${advanced ? 'text-volt' : eliminated ? 'text-eliminated' : 'text-bone'}`}>{score}</span>
        {advanced ? (
          <span className="rounded border border-volt/40 bg-volt/10 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-volt">Adv</span>
        ) : null}
      </div>
    </div>
  );
}

function BracketNode({ match }: { match: EnrichedMatch }) {
  return (
    <article
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-b from-surface to-ink/90 p-3 shadow-card transition-all duration-300 hover:border-volt/40 ${
        match.status === 'live' ? 'border-flare/55 animate-livePulse' : 'border-line'
      }`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-line/70 pb-2">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-ash">
          D{match.scheduled_day} · M{match.match_number}
        </p>
        <span
          className={`rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] ${
            match.status === 'live'
              ? 'border-flare/50 bg-flare/12 text-flare'
              : match.status === 'completed'
                ? 'border-volt/40 bg-volt/10 text-volt'
                : 'border-line bg-ink/60 text-ash'
          }`}
        >
          {match.status === 'completed' ? 'Final' : match.status === 'live' ? 'Live' : 'Soon'}
        </span>
      </div>

      <div className="mt-2 space-y-0.5">
        <TeamLine match={match} team={match.team1 || null} score={match.team1_score} />
        <TeamLine match={match} team={match.team2 || null} score={match.team2_score} />
        <TeamLine match={match} team={match.team3 || null} score={match.team3_score} />
        <TeamLine match={match} team={match.team4 || null} score={match.team4_score} />
      </div>
    </article>
  );
}

// Static class map so Tailwind keeps the column utilities (it can't see dynamic
// strings). Grows as brackets gain rounds.
const roundColumns: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6'
};

// Closing column for a concluded series: who actually lifted it. Sits after the
// grand final so the tree reads left-to-right all the way to the trophy, instead
// of just stopping at the last match.
function WinnersColumn({ champion }: { champion: SeriesChampion }) {
  return (
    <section className="flex flex-col rounded-2xl border border-gold/40 bg-gold/[0.04] p-3">
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-gold/40 bg-ink/60 px-3 py-2.5">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-xs leading-none text-gold/50">★</span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Winners</span>
        </span>
      </div>

      <article className="relative overflow-hidden rounded-xl border border-gold/45 bg-gradient-to-b from-surface to-ink/90 p-3 shadow-card">
        <div className="pointer-events-none absolute -right-6 -top-8 font-display text-[5rem] leading-none text-gold/[0.07]">01</div>

        <div className="relative">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-gold">Champion</p>
          <p className="mt-1.5 flex items-center gap-1.5">
            <span className="min-w-0 break-words font-display text-lg uppercase leading-tight tracking-wide text-gold">
              {displayTeamName(champion.champion.name)}
            </span>
            <TeacherBadge team={champion.champion} />
          </p>
          <p className="digits mt-1 font-display text-3xl leading-none text-gold">{champion.championScore}</p>

          {champion.runnerUp ? (
            <div className="mt-3 border-t border-line/70 pt-2.5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ash">Runner-up</p>
              <p className="mt-1 flex items-center gap-1.5">
                <span className="min-w-0 break-words text-[12px] font-bold leading-tight text-bone">
                  {displayTeamName(champion.runnerUp.name)}
                </span>
                <TeacherBadge team={champion.runnerUp} />
              </p>
              <p className="digits mt-0.5 font-display text-xl leading-none text-bone">{champion.runnerUpScore}</p>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}

export function BracketTree({
  matches,
  bracket,
  highlightRound,
  series = 'year12',
  champion
}: {
  matches: EnrichedMatch[];
  bracket: BracketName;
  highlightRound?: number;
  /** Which senior series — each runs a different number of rounds with its own labels. */
  series?: SeniorSeries;
  /** When set, a closing "Winners" column is appended after the grand final. */
  champion?: SeriesChampion | null;
}) {
  const totalRounds = totalRoundsFor(bracket, series);
  const columns = totalRounds + (champion ? 1 : 0);
  const [collapsedRounds, setCollapsedRounds] = useState<number[]>([]);

  const toggleRound = (round: number) => {
    setCollapsedRounds((prev) => (prev.includes(round) ? prev.filter((r) => r !== round) : [...prev, round]));
  };

  return (
    <div className="w-full">
      <div className={`grid w-full gap-4 md:grid-cols-1 ${roundColumns[columns] ?? 'lg:grid-cols-5'}`}>
        {Array.from({ length: totalRounds }, (_, index) => {
          const roundNumber = index + 1;
          const roundMatches = matches.filter((match) => match.round === roundNumber).sort((a, b) => a.match_number - b.match_number);
          const isCollapsed = collapsedRounds.includes(roundNumber);
          const isHighlighted = highlightRound === undefined || highlightRound === roundNumber;

          return (
            <section
              key={roundNumber}
              className={`flex flex-col rounded-2xl border p-3 transition-all duration-300 ${
                isHighlighted ? 'border-line bg-surface/40' : 'border-line/40 bg-surface/20 opacity-55'
              }`}
            >
              <button
                onClick={() => toggleRound(roundNumber)}
                className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-line bg-ink/60 px-3 py-2.5 text-left transition-colors hover:border-volt/40"
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-xs leading-none text-volt/40">{String(roundNumber).padStart(2, '0')}</span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-bone">{roundLabel(bracket, roundNumber, series)}</span>
                </span>
                <span className="text-[10px] text-ash">{isCollapsed ? '▼' : '▲'}</span>
              </button>

              {!isCollapsed && (
                <div className="space-y-3">
                  {roundMatches.length > 0 ? (
                    roundMatches.map((match) => <BracketNode key={match.id} match={match} />)
                  ) : (
                    <div className="rounded-xl border border-dashed border-line px-3 py-5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                      Awaiting results
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}

        {champion ? <WinnersColumn champion={champion} /> : null}
      </div>
    </div>
  );
}
