'use client';

import { useMemo, useState } from 'react';
import { useTournament } from '@/components/tournament-provider';
import type { BracketName, EnrichedMatch, Team } from '@/types/tournament';
import { displayTeamName, formatAestDateTime, getMatchPlacements, matchLabel } from '@/lib/tournament-utils';
import { motion } from 'framer-motion';

type Filter = 'all' | BracketName | 'round';

export default function HistoryPage() {
  const { data, loading, error } = useTournament();
  const [filter, setFilter] = useState<Filter>('all');
  const [round, setRound] = useState('1');

  const matches = useMemo(() => {
    const completed = data?.matches.filter((match) => match.status === 'completed') || [];
    return completed
      .filter((match) => (filter === 'all' ? true : filter === 'round' ? String(match.round) === round : match.bracket === filter))
      .sort((a, b) => Number(new Date(b.played_at || 0)) - Number(new Date(a.played_at || 0)));
  }, [data, filter, round]);

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
        {(['all', 'senior', 'junior', 'round'] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-200 ${
              filter === item ? 'border-volt bg-volt text-ink shadow-volt' : 'border-line bg-surface text-ash hover:text-bone'
            }`}
          >
            {item === 'all' ? 'All' : item === 'senior' ? 'Seniors' : item === 'junior' ? 'Juniors' : 'By Round'}
          </button>
        ))}
        {filter === 'round' ? (
          <select
            value={round}
            onChange={(event) => setRound(event.target.value)}
            className="rounded-full border border-line bg-surface px-4 py-2 font-mono text-xs font-semibold text-bone outline-none focus:border-volt"
          >
            {['1', '2', '3', '4', '5'].map((item) => (
              <option key={item} value={item}>
                Round {item}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="space-y-4">
        {matches.length > 0 ? (
          matches.map((match) => <HistoryRow key={match.id} match={match} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-surface/40 px-4 py-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-ash">
            No completed matches yet.
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HistoryRow({ match }: { match: EnrichedMatch }) {
  const visibleTeams = [match.team1, match.team2, match.team3, match.team4].filter(Boolean) as Team[];
  const { tieAtCutoff, placements } = getMatchPlacements(match);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface to-ink/90 p-5 shadow-card transition-colors duration-300 hover:border-volt/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/70 pb-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-volt">{matchLabel(match)}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">{formatAestDateTime(match.played_at)}</p>
        </div>
        <span className="shrink-0 rounded-full border border-volt/40 bg-volt/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-volt">
          Final
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {visibleTeams.map((team) => (
          <HistoryTeamCard key={team.id} team={team} match={match} placement={placements.get(team.id) || 'eliminated'} />
        ))}
      </div>
      {tieAtCutoff ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
          ▲ Tie detected — admin review required
        </div>
      ) : null}
    </motion.article>
  );
}

function HistoryTeamCard({
  team,
  match,
  placement
}: {
  team: Team;
  match: EnrichedMatch;
  placement: 'advanced' | 'eliminated' | 'tie';
}) {
  const isAdvanced = placement === 'advanced';
  const isTie = placement === 'tie';
  const score = scoreForTeam(match, team.id);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
        isAdvanced ? 'border-volt/40 bg-volt/[0.06]' : 'border-line bg-ink/40 opacity-70'
      }`}
    >
      {isAdvanced ? <span className="absolute inset-y-0 left-0 w-1 bg-volt" aria-hidden /> : null}
      <div className="flex items-start justify-between gap-4 pl-1.5">
        <div className="min-w-0">
          <p className={`break-words text-sm font-bold leading-tight ${isAdvanced ? 'text-volt' : 'text-bone'}`}>{displayTeamName(team.name)}</p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ash">
            {team.player1} · {team.player2}
          </p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ash">Score</span>
            <span className={`digits font-display text-2xl leading-none ${isAdvanced ? 'text-volt' : 'text-bone'}`}>{score}</span>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${
            isTie
              ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
              : isAdvanced
                ? 'border-volt/40 bg-volt/15 text-volt'
                : 'border-line bg-ink/60 text-ash'
          }`}
        >
          {isTie ? 'Tie' : isAdvanced ? 'Advanced' : 'Out'}
        </span>
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
