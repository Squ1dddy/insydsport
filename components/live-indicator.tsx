'use client';

export function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-flare/50 bg-flare/12 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-flare">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flare opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-flare" />
      </span>
      Live
    </span>
  );
}
