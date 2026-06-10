'use client';

import type { Team } from '@/types/tournament';

// `open` lets touch devices toggle the roster on tap (there is no hover on mobile);
// desktop still reveals it via group-hover / keyboard focus.
export function TeamTooltip({ team, open = false }: { team: Team; open?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute left-0 top-full z-[100] mt-2 w-64 rounded-2xl border border-secondary bg-primary p-4 text-left shadow-2xl group-hover:block group-focus-within:block ${
        open ? 'block' : 'hidden'
      }`}
    >
      <span className="block text-[11px] uppercase tracking-[0.35em] text-textMuted">Roster</span>
      <span className="mt-2 block text-sm font-bold text-slate-100">{team.player1}</span>
      <span className="block text-sm font-bold text-slate-100">{team.player2}</span>
    </span>
  );
}
