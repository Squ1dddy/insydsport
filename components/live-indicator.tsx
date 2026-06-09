'use client';

export function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-extrabold tracking-[0.25em] text-red-300">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-dotPulse" />
      LIVE
    </span>
  );
}
