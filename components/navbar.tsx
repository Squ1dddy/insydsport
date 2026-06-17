'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiveIndicator } from '@/components/live-indicator';
import { VersionBadge } from '@/components/version-badge';
import { useTournament } from '@/components/tournament-provider';
import type { RealtimeStatus } from '@/components/tournament-provider';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/brackets', label: 'Brackets' },
  { href: '/history', label: 'Results' },
  { href: '/stats', label: 'Stats' },
  { href: '/admin', label: 'Admin' }
];

// Base lines that crawl across the top ticker — broadcast flavour in the
// courtside voice. Live match count is prepended dynamically when games are on.
const baseTickerLines = ['Inner Sydney Handball Knockout', 'Season 1 · 2026', 'Top 2 advance', 'Seniors · Juniors · Year 11'];

function ConnectionStatus({ status }: { status: RealtimeStatus }) {
  // When live we stay quiet (a small green dot); only speak up when the data feed
  // can't be confirmed, so viewers know whether scores are current.
  if (status === 'live') {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-emerald-300/90"
        title="Live updates connected"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        <span className="hidden sm:inline">Online</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-amber-200"
      title="Reconnecting — scores still refresh automatically every few seconds"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-dotPulse" />
      Syncing
    </span>
  );
}

function Logo() {
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface shadow-inset md:h-12 md:w-12">
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-volt/10 blur-md" aria-hidden />
      <img
        src="/images/school-emblem.png"
        alt="Inner Sydney school emblem"
        className="relative h-8 w-auto object-contain md:h-9"
      />
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data, realtimeStatus } = useTournament();
  const [isOpen, setIsOpen] = useState(false);
  const liveMatches = data?.matches.filter((match) => match.status === 'live').length || 0;
  const tickerLines = useMemo(
    () => (liveMatches > 0 ? [`${liveMatches} ${liveMatches === 1 ? 'match' : 'matches'} live now`, ...baseTickerLines] : baseTickerLines),
    [liveMatches]
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-ink/85 backdrop-blur-xl">
      {/* Crawl ticker — broadcast lower-third energy at the very top. */}
      <div className="flex items-center overflow-hidden border-b border-line/60 bg-volt py-1 text-ink">
        <div className="flex shrink-0 animate-marquee whitespace-nowrap">
          {[0, 1].map((dup) => (
            <span key={dup} className="flex items-center" aria-hidden={dup === 1}>
              {tickerLines.map((line) => (
                <span key={line} className="flex items-center font-mono text-[10px] font-semibold uppercase tracking-[0.32em]">
                  {line}
                  <span className="mx-5 text-ink/50">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8 lg:px-10">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="group flex items-center gap-3">
            <Logo />
            <div className="leading-none">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.42em] text-volt">Inner Sydney</p>
              <p className="mt-1 font-display text-xl uppercase leading-none tracking-wide text-bone md:text-2xl">
                Handball<span className="text-volt">·</span>KO
              </p>
            </div>
          </Link>
          {/* Version + patch notes — grey underlined chip with a "!" nudge until read. */}
          <span className="mt-3 self-start">
            <VersionBadge />
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-3 md:flex">
          <ConnectionStatus status={realtimeStatus} />
          {liveMatches > 0 ? <LiveIndicator /> : null}
          {/* Big-screen / projector view — only offered while a match is on air. */}
          {liveMatches > 0 ? (
            <Link
              href="/screen"
              className="inline-flex items-center gap-1.5 rounded-full border border-volt/40 bg-volt/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-volt transition-colors duration-200 hover:bg-volt/20"
            >
              Big Screen
            </Link>
          ) : null}
          <div className="ml-1 flex items-center gap-1 rounded-full border border-line bg-surface/70 p-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 ${
                    active ? 'bg-volt text-ink' : 'text-ash hover:text-bone'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          <div className="flex flex-col gap-1.5">
            <span className={`h-0.5 w-6 rounded-full bg-bone transition-transform ${isOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`h-0.5 w-6 rounded-full bg-bone transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-6 rounded-full bg-bone transition-transform ${isOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <nav className="flex flex-col gap-1 border-t border-line bg-ink p-4 md:hidden">
          <div className="mb-2 flex items-center gap-2">
            <ConnectionStatus status={realtimeStatus} />
            {liveMatches > 0 ? <LiveIndicator /> : null}
          </div>
          {liveMatches > 0 ? (
            <Link
              href="/screen"
              onClick={() => setIsOpen(false)}
              className="mb-1 flex h-12 items-center rounded-xl border border-volt/40 bg-volt/10 px-4 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-volt"
            >
              Big Screen
            </Link>
          ) : null}
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-12 items-center rounded-xl px-4 font-mono text-xs font-semibold uppercase tracking-[0.22em] transition ${
                  active ? 'bg-volt text-ink' : 'text-ash hover:bg-surface hover:text-bone'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
