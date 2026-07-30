'use client';

import { useMemo, useState } from 'react';
import { BracketTree } from '@/components/bracket-tree';
import { JuniorStandings } from '@/components/junior-standings';
import { useTournament } from '@/components/tournament-provider';
import { getSeriesChampion, SENIOR_SERIES, seriesLabel, totalRoundsFor } from '@/lib/tournament-utils';
import type { BracketName, SeniorSeries } from '@/types/tournament';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function BracketsPage() {
  const { data, loading, error } = useTournament();
  const [bracket, setBracket] = useState<BracketName>('senior');
  // The senior bracket holds two independent knockout series. Year 11 is the one
  // still running, so it opens first; Year 12 is kept for the record + its champion.
  const [series, setSeries] = useState<SeniorSeries>('year11');
  const [activeRound, setActiveRound] = useState(1);

  const isJunior = bracket === 'junior';

  const allMatches = data?.matches || [];
  // Senior matches are split by series so a Year 11 fixture never appears in the
  // Year 12 or teacher tree — they share the bracket but nothing else.
  const matches = useMemo(
    () => allMatches.filter((match) => match.bracket === bracket && (isJunior || match.series === series)),
    [allMatches, bracket, isJunior, series]
  );
  // Only a concluded series gets a Winners column — this is null until its grand
  // final is played, so the Year 11 tree simply won't show one yet.
  const champion = useMemo(
    () => (isJunior ? null : getSeriesChampion(allMatches, 'senior', series)),
    [allMatches, isJunior, series]
  );
  const teams = data?.teams || [];
  const totalRounds = totalRoundsFor(bracket, series);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-3xl border border-flare/30 bg-flare/10 p-8 text-center text-flare">{error}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full space-y-7">
      <div className="border-b border-line pb-2">
        <p className="eyebrow text-volt">
          {isJunior ? 'Round Robin Ladder' : champion ? 'The Series Is Decided' : 'The Road To The Final'}
        </p>
        <h1 className="mt-1 font-display text-4xl uppercase tracking-wide text-bone lg:text-5xl">
          {isJunior ? 'Standings' : 'Brackets'}
        </h1>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-line bg-surface p-1 shadow-inset">
            {(['senior', 'junior'] as BracketName[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setBracket(item);
                  setActiveRound(1);
                }}
                className={`rounded-full px-7 py-2 font-mono text-xs font-semibold uppercase tracking-[0.24em] transition-all duration-200 ${
                  bracket === item ? 'bg-volt text-ink shadow-volt' : 'text-ash hover:text-bone'
                }`}
              >
                {item === 'senior' ? 'Seniors' : 'Juniors'}
              </button>
            ))}
          </div>

          {/* Senior series switch — Year 11 is live; Year 12 and Teachers are the
              concluded records, each with its own bracket and champion. */}
          {!isJunior ? (
            <div className="inline-flex flex-wrap rounded-full border border-line bg-surface p-1 shadow-inset">
              {SENIOR_SERIES.map((item) => {
                // "Live" vs "Final" is read from the data, not hardcoded, so a series
                // relabels itself the moment its grand final is played.
                const done = Boolean(getSeriesChampion(allMatches, 'senior', item));
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSeries(item);
                      setActiveRound(1);
                    }}
                    className={`flex items-center gap-2 rounded-full px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-200 ${
                      series === item ? 'bg-gold text-ink shadow-card' : 'text-ash hover:text-bone'
                    }`}
                  >
                    {seriesLabel(item)}
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.16em] ${
                        series === item ? 'bg-ink/25 text-ink' : done ? 'text-gold' : 'text-volt'
                      }`}
                    >
                      {done ? 'Final' : 'Live'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {!isJunior ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
              <button
                key={round}
                onClick={() => setActiveRound(round)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${
                  activeRound === round
                    ? 'border-volt bg-volt/15 text-volt'
                    : 'border-line bg-surface text-ash hover:border-volt/30 hover:text-bone'
                }`}
              >
                Round {round}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="w-full space-y-7">
        {isJunior ? (
          <JuniorStandings teams={teams} />
        ) : (
          <BracketTree matches={matches} bracket={bracket} highlightRound={activeRound} series={series} champion={champion} />
        )}
      </div>
    </motion.div>
  );
}
