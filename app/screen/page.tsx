'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useTournament } from '@/components/tournament-provider';
import { AnimatedScore } from '@/components/animated-score';
import { displayTeamName, matchLabel, roundLabel } from '@/lib/tournament-utils';
import { TeacherBadge } from '@/components/teacher-badge';
import type { EnrichedMatch } from '@/types/tournament';

// Big-screen / TV mode — a full-bleed live view for projecting at the venue.
// It renders as a fixed overlay so it covers the navbar and the constrained page
// wrapper without restructuring the route tree, and rides the same global
// realtime feed as every other page (TournamentProvider), so scores update live
// with no extra wiring. When more than one match is live it rotates through them
// one at a time so each gets the whole screen.

function teamEntries(match: EnrichedMatch) {
  return [
    { team: match.team1, score: match.team1_score },
    { team: match.team2, score: match.team2_score },
    { team: match.team3, score: match.team3_score },
    { team: match.team4, score: match.team4_score }
  ].filter((entry) => entry.team);
}

function advancingIds(match: EnrichedMatch): string[] {
  return [...teamEntries(match)]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.team!.id);
}

function Clock() {
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const tick = () =>
      setNow(
        new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Sydney',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(new Date())
      );
    tick();
    const id = window.setInterval(tick, 10000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="font-mono text-sm uppercase tracking-[0.3em] text-ash md:text-base">{now}</span>;
}

function LiveScreen({ match }: { match: EnrichedMatch }) {
  const entries = teamEntries(match);
  const advancing = advancingIds(match);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-3 rounded-full border border-flare/50 bg-flare/12 px-4 py-2 font-mono text-sm font-bold uppercase tracking-[0.3em] text-flare md:text-base">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flare opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-flare" />
          </span>
          On Air · {match.bracket}s
        </span>
        <div className="text-right">
          <p className="font-display text-2xl uppercase leading-none tracking-wide text-bone md:text-4xl">{roundLabel(match.bracket, match.round)}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ash md:text-xs">{matchLabel(match)}</p>
        </div>
      </div>

      <div
        className={`mt-6 grid flex-1 gap-4 md:mt-8 md:gap-6 ${
          entries.length > 2 ? 'grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {entries.map(({ team, score }) => {
          const adv = advancing.includes(team!.id);
          return (
            <div
              key={team!.id}
              className={`relative flex flex-col items-center justify-center rounded-3xl border px-6 py-6 text-center transition-colors ${
                adv ? 'border-volt/60 bg-volt/[0.08]' : 'border-line bg-ink/60'
              }`}
            >
              {adv ? (
                <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-volt/50 bg-ink px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.24em] text-volt">
                  Advancing
                </span>
              ) : null}
              <p className="max-w-full truncate font-display text-3xl uppercase leading-tight tracking-wide text-bone sm:text-4xl md:text-6xl lg:text-7xl">
                {displayTeamName(team!.name)}
              </p>
              <TeacherBadge team={team} className="mt-2 px-2.5 py-1 text-[10px] md:text-xs" />
              <div className="mt-2">
                <AnimatedScore
                  score={score}
                  className={`digits font-display leading-none text-[18vw] md:text-[14vh] ${adv ? 'text-volt' : 'text-bone'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.3em] text-ash md:text-sm">Top 2 advance</p>
    </div>
  );
}

function IdleScreen({ upcoming }: { upcoming: EnrichedMatch[] }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <img src="/images/school-emblem.png" alt="" className="h-24 w-24 object-contain opacity-80 md:h-32 md:w-32" />
      <h1 className="mt-6 font-display text-5xl uppercase leading-none tracking-wide text-bone md:text-7xl">
        Handball<span className="text-volt">·</span>Knockout
      </h1>
      <p className="mt-4 font-mono text-sm uppercase tracking-[0.3em] text-ash">No match on air right now</p>

      {upcoming.length > 0 ? (
        <div className="mt-10 w-full max-w-3xl space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-volt">Coming up</p>
          {upcoming.map((match) => (
            <div key={match.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-ink/50 px-5 py-3 text-left">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-lg uppercase tracking-wide text-bone md:text-xl">
                {[match.team1, match.team2, match.team3, match.team4]
                  .filter((team): team is NonNullable<typeof team> => Boolean(team))
                  .map((team, idx, arr) => (
                    <span key={team.id} className="inline-flex items-center gap-1.5">
                      {displayTeamName(team.name)}
                      <TeacherBadge team={team} />
                      {idx < arr.length - 1 ? <span className="text-ash">·</span> : null}
                    </span>
                  ))}
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ash md:text-xs">{roundLabel(match.bracket, match.round)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ScreenPage() {
  const { data } = useTournament();

  const live = useMemo(
    () =>
      (data?.matches || [])
        .filter((match) => match.status === 'live')
        .sort((a, b) => a.bracket.localeCompare(b.bracket) || a.match_number - b.match_number),
    [data]
  );

  const upcoming = useMemo(
    () =>
      (data?.matches || [])
        .filter((match) => match.status === 'upcoming' && !match.is_next_term)
        .sort((a, b) => a.scheduled_day - b.scheduled_day || a.match_number - b.match_number)
        .slice(0, 4),
    [data]
  );

  // Rotate through live matches so each fills the whole screen in turn.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (live.length <= 1) {
      setIndex(0);
      return;
    }
    const id = window.setInterval(() => setIndex((value) => (value + 1) % live.length), 9000);
    return () => window.clearInterval(id);
  }, [live.length]);

  const current = live.length > 0 ? live[index % live.length] : null;

  function toggleFullscreen() {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-ink p-6 md:p-12">
      {/* Floodlight wash — same sweeping animation as the home hero. */}
      <div className="pointer-events-none absolute inset-0 animate-floodlight bg-[radial-gradient(60%_120%_at_50%_-10%,rgba(244,196,48,0.16),transparent_60%)]" />

      {/* Controls — discreet, top-right, for the operator. */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-full border border-line bg-surface/70 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ash transition-colors hover:text-bone"
        >
          Fullscreen
        </button>
        <Link
          href="/"
          className="rounded-full border border-line bg-surface/70 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ash transition-colors hover:text-bone"
        >
          Exit
        </Link>
      </div>

      <div className="relative flex items-center justify-between gap-4 pr-28">
        <span className="font-mono text-sm uppercase tracking-[0.3em] text-volt md:text-base">Inner Sydney · Season 1</span>
        <div className="flex items-center gap-4">
          {live.length > 1 ? (
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ash">
              {index + 1} / {live.length} live
            </span>
          ) : null}
          <Clock />
        </div>
      </div>

      <div className="relative mt-4 flex-1 md:mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current ? current.id : 'idle'}
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {current ? <LiveScreen match={current} /> : <IdleScreen upcoming={upcoming} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
