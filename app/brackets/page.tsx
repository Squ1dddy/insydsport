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
    return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200">{error}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full space-y-6 p-2 lg:p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          {(['senior', 'junior'] as BracketName[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setBracket(item);
                setActiveRound(1);
              }}
              className={`rounded-full px-6 py-2 text-sm font-black uppercase tracking-[0.3em] transition-all duration-200 hover:scale-105 ${
                bracket === item ? 'bg-gold text-primary' : 'border border-secondary bg-primary text-textMuted hover:text-slate-100'
              }`}
            >
              {item === 'senior' ? 'Seniors' : 'Juniors'}
            </button>
          ))}
        </div>
        
        <div className="flex h-14 items-center gap-2 overflow-x-clip overflow-y-hidden pb-3 pr-3 sm:pb-0 sm:pr-0">
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
            <div key={round} className="flex h-12 items-center justify-center px-1">
              <button
                onClick={() => setActiveRound(round)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 ${
                  activeRound === round 
                    ? 'border-gold bg-gold/20 text-gold' 
                    : 'border-secondary bg-primary text-textMuted hover:border-gold/30 hover:text-slate-100'
                } border`}
              >
                Round {round}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full">
        <BracketTree matches={matches} bracket={bracket} highlightRound={activeRound} />
      </div>
    </motion.div>
  );
}
