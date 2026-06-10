'use client';

import type { Team } from '@/types/tournament';

// Roster reveal used on the home-page match cards. On devices with a real hover
// pointer (desktop), hover/keyboard-focus smoothly animates it in — but those
// reveal styles are gated behind `@media (hover: hover)` so touch devices never
// trigger them via sticky hover/focus. On touch, `open` is the *sole* controller,
// toggled by tapping the team button, so tapping again (or the ✕ / tapping
// outside) reliably dismisses it. The animation is pure CSS so it eases in and out.
export function TeamTooltip({ team, open = false, onClose }: { team: Team; open?: boolean; onClose?: () => void }) {
  // `open` reveals on every device; the gated group-hover/-focus reveals only on
  // hover-capable pointers. Base state is hidden + non-interactive.
  const openState = open ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : '';

  return (
    <span
      className={`pointer-events-none absolute left-2 top-full z-[100] mt-2 w-60 origin-top -translate-y-1 scale-95 rounded-xl border border-gold/30 bg-surface/95 p-4 pr-8 text-left opacity-0 shadow-card backdrop-blur-md transition-all duration-200 ease-out [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:scale-100 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:scale-100 [@media(hover:hover)]:group-focus-within:opacity-100 ${openState}`}
    >
      <span className="block font-mono text-[9px] uppercase tracking-[0.32em] text-gold">Roster</span>
      {onClose ? (
        <button
          type="button"
          onClick={(event) => {
            // Don't let the tap bubble to the team button (which would re-toggle).
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close roster"
          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md border border-line text-ash transition-colors hover:border-gold/40 hover:text-gold"
        >
          ✕
        </button>
      ) : null}
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
