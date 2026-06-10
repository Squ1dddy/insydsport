'use client';

import { useState } from 'react';
import type { EnrichedMatch } from '@/types/tournament';
import { MatchCard } from '@/components/match-card';

// Collapsible "TBC Next Term" group for Year 11 matches. Public, but collapsed by
// default so the current-term schedule stays front and centre.
export function NextTermSection({ matches }: { matches: EnrichedMatch[] }) {
  const [open, setOpen] = useState(false);

  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface/60 px-5 py-4 text-left transition-colors duration-200 hover:border-volt/30 hover:bg-surface"
      >
        <div>
          <p className="eyebrow text-volt">Year 11 · Date TBC</p>
          <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-bone">TBC Next Term</h2>
        </div>
        <span className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ash">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          <span className="text-volt">{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open ? (
        <div className="grid gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
