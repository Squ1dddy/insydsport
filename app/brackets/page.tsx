'use client';

import { useMemo, useState } from 'react';
import { BracketTree } from '@/components/bracket-tree';
import { useTournament } from '@/components/tournament-provider';
import type { BracketName } from '@/types/tournament';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function BracketsPage() {
  const { data, loading, error } = useTournament();
  const [bracket, setBracket] = useState<BracketName>('senior');
  const [activeRound, setActiveRound] = useState(1);

  const matches = useMemo(() => data?.matches.filter((match) => match.bracket === bracket) || [], [data, bracket]);
  const totalRounds = bracket === 'senior' ? 5 : 4;

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
        <p className="eyebrow text-volt">The Road To The Final</p>
        <h1 className="mt-1 font-display text-4xl uppercase tracking-wide text-bone lg:text-5xl">Brackets</h1>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
      </div>

      <div className="w-full">
        <BracketTree matches={matches} bracket={bracket} highlightRound={activeRound} />
      </div>
    </motion.div>
  );
}
