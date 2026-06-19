'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSeniorDayWinners } from '@/lib/tournament-utils';
import { displayTeamName, formatAestDate, matchLabel } from '@/lib/tournament-utils';
import { TeacherBadge } from '@/components/teacher-badge';
import type { EnrichedMatch } from '@/types/tournament';

interface Props {
  matches: EnrichedMatch[];
}

export function WinnersBanner({ matches }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [collapsed, setCollapsed] = useState(false);
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const banner = getSeniorDayWinners(matches, now);

  // Persist collapsed state per day so each new day starts expanded.
  const storageKey = banner ? `winnersBanner:collapsed:day${banner.day}` : null;

  // Read initial collapsed state from localStorage once the banner mounts.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'true') setCollapsed(true);
    } catch {
      // localStorage unavailable (SSR / private browsing) — ignore.
    }
  // Only run when the storage key changes (i.e. banner first appears or day changes).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Schedule a re-render at the exact expiry time so the banner vanishes on cue
  // rather than waiting for the next Supabase poll (up to ~20 s later).
  useEffect(() => {
    if (!banner) return;
    const msLeft = banner.expiresAtMs - Date.now();
    if (msLeft <= 0) return;
    expireTimerRef.current = setTimeout(() => setNow(Date.now()), msLeft);
    return () => {
      if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
    };
  }, [banner?.expiresAtMs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!banner) return null;

  const totalWinners = banner.entries.reduce((n, e) => n + e.winners.length, 0);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    if (storageKey) {
      try {
        if (next) {
          localStorage.setItem(storageKey, 'true');
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        // ignore
      }
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden rounded-3xl border border-volt/30 bg-surface shadow-card"
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-volt/5 lg:px-6"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-3">
          {/* Trophy / checkmark icon */}
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-volt/40 bg-volt/10 text-volt">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 2h10v6a5 5 0 0 1-10 0V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M6 14h4M8 13v1M1 4H3M13 4h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-volt">
              Results · Day {banner.day}
            </p>
            {collapsed ? (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
                {totalWinners} team{totalWinners !== 1 ? 's' : ''} advancing · {formatAestDate(banner.dateIso)}
              </p>
            ) : (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
                {formatAestDate(banner.dateIso)}
              </p>
            )}
          </div>
        </div>

        {/* Chevron */}
        <span
          className={`shrink-0 text-ash transition-transform duration-200 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-line px-5 py-5 lg:px-6">
              {banner.entries.map(({ match, winners }) => (
                <div key={match.id} className="space-y-2.5">
                  {/* Match label */}
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
                    {matchLabel(match)}
                  </p>

                  {/* Advancing teams */}
                  <div className="flex flex-wrap gap-2">
                    {winners.length > 0 ? (
                      winners.map((team) => (
                        <div
                          key={team.id}
                          className="inline-flex items-center gap-2 rounded-full border border-volt/50 bg-volt/[0.08] px-3.5 py-1.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-volt" aria-hidden="true" />
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-volt">
                            {displayTeamName(team.name)}
                          </span>
                          <TeacherBadge team={team} />
                          <span className="rounded-full border border-volt/30 bg-ink px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-volt">
                            Adv
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
                        Winners TBC
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
