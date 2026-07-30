'use client';

import { useMemo, useState } from 'react';
import { useTournament } from '@/components/tournament-provider';
import { JuniorStandings } from '@/components/junior-standings';
import { Year11Series } from '@/components/year11-series';
import { advanceCount, displayTeamName, matchTeamsLabel } from '@/lib/tournament-utils';
import type { BracketName } from '@/types/tournament';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { TypewriterTagline } from '@/components/typewriter-tagline';
import { WinnersBanner } from '@/components/winners-banner';
import { ChampionBanner } from '@/components/champion-banner';
import { NotificationBanner } from '@/components/notification-banner';
import { AnimatedScore } from '@/components/animated-score';
import { TeacherBadge } from '@/components/teacher-badge';

export default function HomePage() {
  const { data, loading, error } = useTournament();
  const [activeBracket, setActiveBracket] = useState<BracketName>('senior');

  // Live scorebugs are always visible regardless of the senior/junior toggle —
  // a live match must never be hidden just because the viewer is filtered to the
  // other bracket. Show every match that is currently on air.
  const liveMatches = useMemo(
    () =>
      (data?.matches || [])
        .filter((match) => match.status === 'live')
        .sort((a, b) => a.bracket.localeCompare(b.bracket) || a.match_number - b.match_number),
    [data]
  );
  // The senior bracket's live series is Year 11 — the Year 12 series concluded, so
  // its fixtures are no longer front-page content (they live on /brackets, under
  // the Year 12 tab, alongside the champion). Year 11 is the schedule now.
  const year11Matches = useMemo(
    () =>
      (data?.matches || [])
        .filter((match) => match.bracket === 'senior' && match.series === 'year11')
        .sort((a, b) => a.round - b.round || a.match_number - b.match_number),
    [data]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-3xl border border-flare/30 bg-flare/10 p-8 text-center text-flare">{error}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      {/* Admin-posted announcements — dismissible per device, persist until the
          viewer closes them or an admin deactivates/removes them. */}
      <NotificationBanner notifications={data?.notifications || []} />

      {/* Champions — permanent crown for every concluded senior series (Year 12 and
          Teachers share one header). Renders itself off each completed grand final,
          so it needs no maintenance as further series finish. */}
      <ChampionBanner matches={data?.matches || []} series={['year12', 'teacher']} />

      {/* Previous-day winners banner — stays for 24 h after the first Year 11 result
          of the day so anyone tuning in late can see who advanced. Accumulates as
          each match on the day completes; both sets vanish together at the 24 h mark.
          Scoped to Year 11: the concluded series must not resurface here. */}
      <WinnersBanner matches={data?.matches || []} series="year11" />

      {/* Live scorebugs — broadcast strips pinned above the hero whenever a match
          is on, for BOTH brackets, independent of the senior/junior toggle below. */}
      {liveMatches.map((liveMatch) => {
        // Whoever currently sits in an advancing spot (and has scored) is flagged
        // live — top 2 in a 3/4-team match, but only the leader in a 1v1.
        const liveTeams = [
          { team: liveMatch.team1, score: liveMatch.team1_score },
          { team: liveMatch.team2, score: liveMatch.team2_score },
          { team: liveMatch.team3, score: liveMatch.team3_score },
          { team: liveMatch.team4, score: liveMatch.team4_score }
        ].filter((entry) => entry.team);
        const advancingIds = [...liveTeams]
          .sort((a, b) => b.score - a.score)
          .slice(0, advanceCount(liveTeams.length))
          .filter((entry) => entry.score > 0)
          .map((entry) => entry.team!.id);
        return (
        <motion.section
          key={liveMatch.id}
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-3xl border border-flare/50 bg-surface p-5 shadow-flare animate-livePulse lg:p-6"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-flare/15 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-flare/50 bg-flare/12 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-flare">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flare opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-flare" />
                </span>
                On Air Now · {liveMatch.bracket}s
              </span>
              <h2 className="mt-3 font-display text-3xl uppercase leading-none tracking-wide text-bone lg:text-5xl">Live Match</h2>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-ash">{matchTeamsLabel(liveMatch)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:flex lg:gap-3">
              {liveTeams.map(({ team, score }) => {
                const advancing = advancingIds.includes(team!.id);
                return (
                  <div
                    key={team!.id}
                    className={`relative min-w-[6rem] rounded-2xl border px-4 py-3 text-center shadow-inset transition-colors ${
                      advancing ? 'border-volt/60 bg-volt/[0.08]' : 'border-line bg-ink/70'
                    }`}
                  >
                    {advancing ? (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-volt/50 bg-ink px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-volt">
                        Adv
                      </span>
                    ) : null}
                    <p className="flex items-center justify-center gap-1.5 truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
                      {displayTeamName(team!.name)}
                      <TeacherBadge team={team} />
                    </p>
                    <div className="mt-1">
                      <AnimatedScore score={score} className={`digits font-display text-4xl leading-none ${advancing ? 'text-volt' : 'text-bone'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
        );
      })}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface/80 p-6 shadow-card lg:p-12">
        <div className="pointer-events-none absolute inset-0 animate-floodlight bg-[radial-gradient(60%_120%_at_20%_-10%,rgba(244,196,48,0.17),transparent_60%)]" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 font-display text-[12rem] leading-none text-volt/[0.04] lg:text-[20rem]">
          S1
        </div>
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow text-volt">Season Opener · 2026</p>
            <h1 className="mt-4 font-display text-5xl uppercase leading-[0.92] tracking-wide text-bone sm:text-6xl lg:text-8xl">
              Handball
              <br />
              <span className="text-volt">Knockout</span>
            </h1>
            <TypewriterTagline />
          </div>
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-[1.75rem] bg-volt/15 blur-2xl" />
            <div className="relative grid h-36 w-36 place-items-center rounded-[1.75rem] border border-line bg-ink/80 shadow-inset lg:h-44 lg:w-44">
              <img src="/images/school-emblem.png" alt="Inner Sydney school emblem" className="h-24 w-24 object-contain lg:h-32 lg:w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Bracket toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-line bg-surface p-1 shadow-inset">
          {(['senior', 'junior'] as const).map((bracket) => (
            <button
              key={bracket}
              onClick={() => setActiveBracket(bracket)}
              className={`rounded-full px-9 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.26em] transition-all duration-200 ${
                activeBracket === bracket ? 'bg-volt text-ink shadow-volt' : 'text-ash hover:text-bone'
              }`}
            >
              {bracket}s
            </button>
          ))}
        </div>
      </div>

      {activeBracket === 'junior' ? (
        /* Juniors run a round-robin — show the points ladder instead of a knockout schedule. */
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="eyebrow text-volt">Round Robin</p>
              <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-bone">Junior Ladder</h2>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-ash">Ranked by points</p>
          </div>
          <JuniorStandings teams={data?.teams || []} />
        </section>
      ) : (
        /* Seniors: the Year 12 series has concluded — its champion is crowned in
           the banner above and its full bracket lives on /brackets, so Year 11 is
           the front-page schedule now. */
        <Year11Series matches={year11Matches} />
      )}
    </motion.div>
  );
}
