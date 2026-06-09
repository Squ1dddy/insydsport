'use client';

import { useMemo, useState } from 'react';
import { useTournament } from '@/components/tournament-provider';
import type { BracketName, EnrichedMatch, Team } from '@/types/tournament';
import { displayTeamName, formatAestDateTime, getMatchPlacements } from '@/lib/tournament-utils';

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
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-textMuted">Loading history...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {(['all', 'senior', 'junior', 'round'] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-[0.26em] ${
              filter === item ? 'bg-win text-[#0f1c2e]' : 'border border-white/10 bg-white/5 text-textMuted'
            }`}
          >
            {item === 'all' ? 'All' : item === 'senior' ? 'Seniors' : item === 'junior' ? 'Juniors' : 'By Round'}
          </button>
        ))}
        {filter === 'round' ? (
          <select value={round} onChange={(event) => setRound(event.target.value)} className="rounded-full border border-white/10 bg-[#101a2a] px-4 py-2 text-sm font-bold text-white">
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
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-textMuted">No completed matches yet.</div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ match }: { match: EnrichedMatch }) {
  const visibleTeams = [match.team1, match.team2, match.team3, match.team4].filter(Boolean) as Team[];
  const { tieAtCutoff, placements } = getMatchPlacements(match);
  const title = visibleTeams.map((team) => displayTeamName(team.name)).join(' · ');

  return (
    <article className="rounded-3xl border border-white/10 bg-[#132136] p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-win">
            Day {match.scheduled_day} · Match {match.match_number}
          </p>
          <h3 className="mt-2 text-lg font-black leading-tight text-white lg:text-xl">{title}</h3>
          <p className="mt-2 text-sm text-textMuted">{formatAestDateTime(match.played_at)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] ${
            match.status === 'completed' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-win/40 bg-win/10 text-win'
          }`}
        >
          {match.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
        </span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {visibleTeams.map((team) => (
          <HistoryTeamCard key={team.id} team={team} match={match} placement={placements.get(team.id) || 'eliminated'} />
        ))}
      </div>
      {tieAtCutoff ? <div className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-amber-200">Tie detected — admin review required</div> : null}
    </article>
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
      className={`group relative rounded-2xl border px-4 py-4 transition ${
        isTie ? 'border-amber-400/60 bg-amber-400/10' : isAdvanced ? 'border-win/60 bg-win/10' : 'border-red-500/30 bg-red-500/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`break-words text-sm font-black leading-tight ${isAdvanced ? 'text-win' : isTie ? 'text-amber-200' : 'text-white'}`}>{displayTeamName(team.name)}</p>
          <p className="mt-2 text-xs leading-5 text-textMuted">
            {team.player1} · {team.player2}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
            isTie ? 'border-amber-400/40 bg-amber-400/15 text-amber-200' : isAdvanced ? 'border-win/40 bg-win/15 text-win' : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {isTie ? 'TIE' : isAdvanced ? 'ADVANCED' : 'ELIMINATED'}
        </span>
      </div>

      <div className="absolute inset-x-4 top-full z-20 mt-2 hidden rounded-xl border border-white/10 bg-[#101a2a] px-3 py-2 text-xs font-bold text-white shadow-card group-hover:block">
        Score: {score}
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
