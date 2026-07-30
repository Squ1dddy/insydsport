'use client';

import { useMemo, useState } from 'react';
import { useTournament } from '@/components/tournament-provider';
import { JuniorStandings } from '@/components/junior-standings';
import type { BracketName, EnrichedMatch, Team } from '@/types/tournament';
import { displayTeamName, formatAestDateTime, getMatchPlacements, isGrandFinal, matchLabel, roundLabel, seriesLabel } from '@/lib/tournament-utils';
import { motion } from 'framer-motion';
import { FollowButton } from '@/components/follow-button';
import { TeacherBadge } from '@/components/teacher-badge';

// 'teacher' filters by senior series rather than bracket — staff teams play in the
// senior bracket, so "Seniors" includes them and "Teachers" narrows to just theirs.
type Filter = 'all' | BracketName | 'teacher' | 'round';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  senior: 'Seniors',
  junior: 'Juniors',
  teacher: 'Teachers',
  round: 'By Round'
};

export default function HistoryPage() {
  const { data, loading, error } = useTournament();
  const [filter, setFilter] = useState<Filter>('all');
  const [round, setRound] = useState('1');

  const matches = useMemo(() => {
    const completed = data?.matches.filter((match) => match.status === 'completed') || [];
    return completed
      .filter((match) => {
        if (filter === 'all') return true;
        if (filter === 'round') return String(match.round) === round;
        if (filter === 'teacher') return match.series === 'teacher';
        return match.bracket === filter;
      })
      .sort((a, b) => Number(new Date(b.played_at || 0)) - Number(new Date(a.played_at || 0)));
  }, [data, filter, round]);

  // Round options follow the deepest series actually on show, so the dropdown never
  // offers a Round 5 when only the 2-round teacher series is selected.
  const roundOptions = useMemo(() => {
    const deepest = Math.max(
      1,
      ...(data?.matches || [])
        .filter((match) => match.status === 'completed')
        .map((match) => match.round)
    );
    return Array.from({ length: deepest }, (_, i) => String(i + 1));
  }, [data]);

  if (loading) {
    return <div className="rounded-3xl border border-line bg-surface/50 p-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-ash">Loading results…</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-flare/30 bg-flare/10 p-8 text-center text-flare">{error}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7">
      <div className="border-b border-line pb-2">
        <p className="eyebrow text-volt">The Record Books</p>
        <h1 className="mt-1 font-display text-4xl uppercase tracking-wide text-bone lg:text-5xl">Results</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'senior', 'junior', 'teacher', 'round'] as Filter[]).map((item) => {
          const active = filter === item;
          // Teachers get the gold accent that marks staff everywhere else on the site.
          const activeClass = item === 'teacher' ? 'border-gold bg-gold text-ink shadow-card' : 'border-volt bg-volt text-ink shadow-volt';
          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full border px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-200 ${
                active ? activeClass : 'border-line bg-surface text-ash hover:text-bone'
              }`}
            >
              {FILTER_LABELS[item]}
            </button>
          );
        })}
        {filter === 'round' ? (
          <select
            value={round}
            onChange={(event) => setRound(event.target.value)}
            className="rounded-full border border-line bg-surface px-4 py-2 font-mono text-xs font-semibold text-bone outline-none focus:border-volt"
          >
            {roundOptions.map((item) => (
              <option key={item} value={item}>
                Round {item}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {filter === 'junior' ? (
        /* Juniors are a round-robin — their "results" are the points ladder, not knockout matches. */
        <JuniorStandings teams={data?.teams || []} />
      ) : (
        <div className="space-y-4">
          {matches.length > 0 ? (
            matches.map((match) => <HistoryRow key={match.id} match={match} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-surface/40 px-4 py-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-ash">
              The record books are empty — for now.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function HistoryRow({ match }: { match: EnrichedMatch }) {
  const visibleTeams = [match.team1, match.team2, match.team3, match.team4].filter(Boolean) as Team[];
  const { tieAtCutoff, placements } = getMatchPlacements(match);
  // A grand final is not "just another game" — it decides the series, so it gets a
  // gold treatment and names the champion instead of listing who "advanced".
  const decider = isGrandFinal(match) && !tieAtCutoff;
  const champion = decider ? visibleTeams.find((team) => placements.get(team.id) === 'advanced') ?? null : null;
  const isTeacherGame = match.series === 'teacher';

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-surface to-ink/90 p-5 shadow-card transition-colors duration-300 ${
        champion ? 'border-gold/45 hover:border-gold/70' : 'border-line hover:border-volt/40'
      }`}
    >
      {champion ? (
        <div className="pointer-events-none absolute -right-6 -top-8 font-display text-[6rem] leading-none text-gold/[0.07]">01</div>
      ) : null}

      <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-line/70 pb-4">
        <div className="min-w-0">
          {/* Series flag — which competition this result belongs to. Teacher games
              are marked in gold so staff results are identifiable at a glance. */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] ${
                isTeacherGame ? 'border-gold/45 bg-gold/15 text-gold' : 'border-line bg-ink/60 text-ash'
              }`}
            >
              {isTeacherGame ? <span aria-hidden="true">✎</span> : null}
              {match.bracket === 'junior' ? 'Juniors' : seriesLabel(match.series)}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ash">
              {roundLabel(match.bracket, match.round, match.series)}
            </span>
          </div>
          <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.22em] ${champion ? 'text-gold' : 'text-volt'}`}>
            {matchLabel(match)}
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">{formatAestDateTime(match.played_at)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] ${
            champion ? 'border-gold/50 bg-gold/15 text-gold' : 'border-volt/40 bg-volt/10 text-volt'
          }`}
        >
          {champion ? 'Champions' : 'Final'}
        </span>
      </div>

      {champion ? (
        <div className="relative mt-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-gold/40 bg-gold/[0.07] px-4 py-3">
          <span className="text-gold" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h10v6a5 5 0 0 1-10 0V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M6 14h4M8 13v1M1 4H3M13 4h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80">
            {roundLabel(match.bracket, match.round, match.series)} winners
          </span>
          <span className="flex items-center gap-1.5 font-display text-xl uppercase leading-none tracking-wide text-gold">
            {displayTeamName(champion.name)}
            <TeacherBadge team={champion} />
          </span>
        </div>
      ) : null}

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        {visibleTeams.map((team) => (
          <HistoryTeamCard
            key={team.id}
            team={team}
            match={match}
            placement={placements.get(team.id) || 'eliminated'}
            decider={decider}
          />
        ))}
      </div>
      {tieAtCutoff ? (
        <div className="relative mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
          ▲ Tie detected — admin review required
        </div>
      ) : null}
    </motion.article>
  );
}

function HistoryTeamCard({
  team,
  match,
  placement,
  decider = false
}: {
  team: Team;
  match: EnrichedMatch;
  placement: 'advanced' | 'eliminated' | 'tie';
  /** This match is the series decider, so winners are champions, not advancers. */
  decider?: boolean;
}) {
  const isAdvanced = placement === 'advanced';
  const isTie = placement === 'tie';
  const isChampion = decider && isAdvanced;
  const score = scoreForTeam(match, team.id);
  // In a decider nobody "goes out" — the beaten side is the runner-up.
  const label = isTie ? 'Tie' : isChampion ? 'Champion' : isAdvanced ? 'Advanced' : decider ? 'Runner-up' : 'Out';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
        isChampion
          ? 'border-gold/50 bg-gold/[0.08]'
          : isAdvanced
            ? 'border-volt/40 bg-volt/[0.06]'
            : 'border-line bg-ink/40 opacity-70'
      }`}
    >
      {isAdvanced ? (
        <span className={`absolute inset-y-0 left-0 w-1 ${isChampion ? 'bg-gold' : 'bg-volt'}`} aria-hidden />
      ) : null}
      <div className="flex items-start justify-between gap-4 pl-1.5">
        <div className="min-w-0">
          <p
            className={`flex flex-wrap items-center gap-1.5 break-words text-sm font-bold leading-tight ${
              isChampion ? 'text-gold' : isAdvanced ? 'text-volt' : 'text-bone'
            }`}
          >
            {displayTeamName(team.name)}
            <TeacherBadge team={team} />
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ash">
            {team.player1} · {team.player2}
          </p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ash">Score</span>
            <span className={`digits font-display text-2xl leading-none ${isChampion ? 'text-gold' : isAdvanced ? 'text-volt' : 'text-bone'}`}>
              {score}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <FollowButton teamId={team.id} teamName={team.name} />
          <span
            className={`rounded-full border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${
              isTie
                ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
                : isChampion
                  ? 'border-gold/50 bg-gold/20 text-gold'
                  : isAdvanced
                    ? 'border-volt/40 bg-volt/15 text-volt'
                    : 'border-line bg-ink/60 text-ash'
            }`}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

function scoreForTeam(match: EnrichedMatch, teamId: string) {
  if (match.team1_id === teamId) return match.team1_score;
  if (match.team2_id === teamId) return match.team2_score;
  if (match.team3_id === teamId) return match.team3_score;
  if (match.team4_id === teamId) return match.team4_score;
  return 0;
}
