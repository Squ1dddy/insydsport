'use client';

import type { Team } from '@/types/tournament';
export function TeamTooltip({ team }: { team: Team }) {
  return (
    <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-2xl border border-white/10 bg-[#101a2a] p-3 text-left shadow-card group-hover:block group-focus-within:block">
      <span className="block text-[11px] uppercase tracking-[0.35em] text-textMuted">Roster</span>
      <span className="mt-2 block text-sm font-bold text-white">{team.player1}</span>
      <span className="block text-sm font-bold text-white">{team.player2}</span>
    </span>
  );
}
