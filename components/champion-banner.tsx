'use client';

import { motion } from 'framer-motion';
import { displayTeamName, formatAestDate, getSeriesChampion, roundLabel, seriesLabel, type SeriesChampion } from '@/lib/tournament-utils';
import { TeacherBadge } from '@/components/teacher-badge';
import type { EnrichedMatch, SeniorSeries } from '@/types/tournament';

interface Props {
  matches: EnrichedMatch[];
  /**
   * Which senior series to crown, in display order. The first one with a decided
   * final becomes the hero; the rest appear as compact rows beneath it, so several
   * concluded series share one header rather than stacking banners.
   */
  series?: SeniorSeries[];
}

function TrophyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2h10v6a5 5 0 0 1-10 0V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 14h4M8 13v1M1 4H3M13 4h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Compact champion row for the second and subsequent concluded series. */
function ChampionRow({ series, result }: { series: SeniorSeries; result: SeriesChampion }) {
  const { champion, championScore, runnerUp, runnerUpScore } = result;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-gold/30 bg-ink/40 px-4 py-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gold">
          <TrophyIcon size={11} />
          {seriesLabel(series)}
        </span>
        <span className="flex items-center gap-1.5 font-display text-xl uppercase leading-none tracking-wide text-gold">
          {displayTeamName(champion.name)}
          <TeacherBadge team={champion} />
        </span>
        {runnerUp ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            def. {displayTeamName(runnerUp.name)}
          </span>
        ) : null}
      </div>
      <p className="digits shrink-0 font-display text-2xl leading-none text-gold">
        {championScore}
        {runnerUpScore !== null ? <span className="text-ash">–{runnerUpScore}</span> : null}
      </p>
    </div>
  );
}

/**
 * Permanent crown banner for the concluded knockout series. Unlike WinnersBanner
 * (24 h, per-day, "who advanced"), this never expires — champions stay up for the
 * rest of the season.
 *
 * Renders nothing until a series' grand final is completed, and deliberately skips
 * a series whose final is tied: the format records both of the top 2 as winners, so
 * a level scoreline means the title is genuinely undecided and an admin has to break
 * it before anyone is congratulated.
 */
export function ChampionBanner({ matches, series = ['year12', 'teacher'] }: Props) {
  const decided = series
    .map((name) => ({ name, result: getSeriesChampion(matches, 'senior', name) }))
    .filter((entry): entry is { name: SeniorSeries; result: SeriesChampion } => Boolean(entry.result) && !entry.result!.tied);

  if (decided.length === 0) return null;

  const [hero, ...rest] = decided;
  const { champion, championScore, runnerUp, runnerUpScore, match } = hero.result;
  const playedOn = match.played_at ? formatAestDate(match.played_at) : null;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[2rem] border border-gold/45 bg-surface shadow-card"
    >
      {/* Trophy-light wash + oversized watermark, echoing the hero treatment. */}
      <div className="pointer-events-none absolute inset-0 animate-floodlight bg-[radial-gradient(70%_140%_at_15%_-20%,rgba(244,196,48,0.22),transparent_65%)]" />
      <div className="pointer-events-none absolute -right-8 -top-10 font-display text-[9rem] leading-none text-gold/[0.06] lg:text-[13rem]">
        01
      </div>

      <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/12 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
            <TrophyIcon />
            {seriesLabel(hero.name)} Champions
          </span>

          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ash">Congratulations to</p>
          <h2 className="mt-1.5 flex flex-wrap items-center gap-3 font-display text-4xl uppercase leading-[0.95] tracking-wide text-gold sm:text-5xl lg:text-6xl">
            {displayTeamName(champion.name)}
            <TeacherBadge team={champion} />
          </h2>
          <p className="mt-3 max-w-xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-ash">
            {roundLabel('senior', match.round, match.series)} winners
            {runnerUp ? <> · def. {displayTeamName(runnerUp.name)}</> : null}
            {playedOn ? <> · {playedOn}</> : null}
            {' · the '}
            {seriesLabel(hero.name)} series has concluded.
          </p>
        </div>

        {/* Final scoreline */}
        <div className="flex shrink-0 items-stretch gap-2.5">
          <div className="min-w-[7rem] rounded-2xl border border-gold/55 bg-gold/[0.09] px-4 py-3 text-center shadow-inset">
            <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
              {displayTeamName(champion.name)}
            </p>
            <p className="digits mt-1 font-display text-4xl leading-none text-gold lg:text-5xl">{championScore}</p>
            <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-gold/80">Champion</p>
          </div>
          {runnerUp ? (
            <div className="min-w-[7rem] rounded-2xl border border-line bg-ink/70 px-4 py-3 text-center shadow-inset">
              <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
                {displayTeamName(runnerUp.name)}
              </p>
              <p className="digits mt-1 font-display text-4xl leading-none text-bone lg:text-5xl">{runnerUpScore}</p>
              <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ash">Runner-up</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Other concluded series share the same header. */}
      {rest.length > 0 ? (
        <div className="relative space-y-2.5 border-t border-gold/25 px-6 pb-6 pt-5 lg:px-8">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-gold/70">Also crowned</p>
          {rest.map((entry) => (
            <ChampionRow key={entry.name} series={entry.name} result={entry.result} />
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
