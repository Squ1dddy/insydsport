'use client';

// Route-segment error boundary. Any client render/runtime error inside the app
// shell lands here instead of white-screening every viewer. `reset()` re-renders
// the failed segment without a full reload (realtime/provider state is kept).

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaced in the browser console / hosting logs for debugging without
    // exposing internals to the page.
    console.error('App render error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.45em] text-gold">Something broke</p>
      <h1 className="mt-3 text-4xl font-black uppercase leading-tight text-slate-100 lg:text-5xl">We hit a snag</h1>
      <p className="mt-3 text-sm text-textMuted">
        The page ran into an unexpected error. Your scores are safe — try again, or head back to the action.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-2xl bg-gold px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-primary transition-all duration-200 hover:scale-105"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-2xl border border-secondary bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-slate-100 transition-all duration-200 hover:scale-105"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
