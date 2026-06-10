'use client';

import type { Team } from '@/types/tournament';

// Roster reveal used on the home-page match cards. Hover (or keyboard focus) on
// desktop smoothly animates it in; `open` lets touch devices toggle it on tap
// since there is no hover on mobile. The animation is pure CSS (opacity + slide +
// scale) so it eases both in and out — `hidden`/`block` can't transition.
export function TeamTooltip({ team, open = false }: { team: Team; open?: boolean }) {
  const visible = open
    ? 'opacity-100 translate-y-0 scale-100'
    : 'opacity-0 -translate-y-1 scale-95';

  return (
    <span
      className={`pointer-events-none absolute left-2 top-full z-[100] mt-2 w-60 origin-top rounded-xl border border-gold/30 bg-surface/95 p-4 text-left shadow-card backdrop-blur-md transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 ${visible}`}
    >
      <span className="block font-mono text-[9px] uppercase tracking-[0.32em] text-gold">Roster</span>
      <span className="mt-2 flex items-center gap-2 text-sm font-bold text-bone">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-gold/15 font-mono text-[9px] text-gold">P1</span>
        {team.player1}
      </span>
      <span className="mt-1.5 flex items-center gap-2 text-sm font-bold text-bone">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-gold/15 font-mono text-[9px] text-gold">P2</span>
        {team.player2}
      </span>
    </span>
  );
}
