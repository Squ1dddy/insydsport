'use client';

import { useMemo, useState } from 'react';
import { BracketTree } from '@/components/bracket-tree';
import { useTournament } from '@/components/tournament-provider';
import type { BracketName } from '@/types/tournament';

export default function BracketsPage() {
  const { data, loading, error } = useTournament();
  const [bracket, setBracket] = useState<BracketName>('senior');
  const [activeRound, setActiveRound] = useState(1);

  const matches = useMemo(() => data?.matches.filter((match) => match.bracket === bracket) || [], [data, bracket]);
  const totalRounds = bracket === 'senior' ? 5 : 4;

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-textMuted">Loading brackets...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(['senior', 'junior'] as BracketName[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setBracket(item);
                setActiveRound(1);
              }}
              className={`rounded-full px-5 py-2 text-sm font-black uppercase tracking-[0.3em] transition-all ${
                bracket === item ? 'bg-win text-[#0f1c2e]' : 'border border-white/10 bg-white/5 text-textMuted hover:text-white'
              }`}
            >
              {item === 'senior' ? 'Seniors' : 'Juniors'}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
            <button
              key={round}
              onClick={() => setActiveRound(round)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                activeRound === round 
                  ? 'border-win bg-win/20 text-win' 
                  : 'border-white/10 bg-white/5 text-textMuted hover:border-white/20 hover:text-white'
              } border`}
            >
              R{round}
            </button>
          ))}
        </div>
      </div>

      <BracketTree matches={matches} bracket={bracket} highlightRound={activeRound} />
    </div>
  );
}
