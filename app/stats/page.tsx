'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTournament } from '@/components/tournament-provider';
import { displayTeamName, getTeamStats } from '@/lib/tournament-utils';
import { TeacherBadge } from '@/components/teacher-badge';
import type { BracketName } from '@/types/tournament';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from '@/components/follow-button';
import { useFollowedTeams } from '@/lib/followed-teams';

function HeadlineCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-surface/70 p-5 shadow-card">
      <p className="eyebrow text-volt">{label}</p>
      <p className="mt-2 font-display text-2xl uppercase leading-tight tracking-wide text-bone lg:text-3xl">{value}</p>
      {sub ? <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">{sub}</p> : null}
    </div>
  );
}

function StarCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-end gap-1 font-mono text-sm text-ash">
      <span className={count > 0 ? 'text-gold' : 'text-ash/40'}>★</span>
      {count}
    </span>
  );
}

export default function StatsPage() {
  const { data, loading, error } = useTournament();
  const [activeBracket, setActiveBracket] = useState<BracketName>('senior');
  const { followed } = useFollowedTeams();

  const stats = useMemo(
    () => getTeamStats(data?.matches || [], data?.teams || [], activeBracket),
    [data, activeBracket]
  );

  // Best points-per-game among teams that have actually played — the efficiency leader.
  const bestAvg = useMemo(() => {
    const played = stats.filter((row) => row.played > 0);
    return played.length ? [...played].sort((a, b) => b.avgPoints - a.avgPoints)[0] : null;
  }, [stats]);

  // Crowd favourite: the team in this bracket with the most stars (any team, not
  // just ones that have played).
  const mostFavourited = useMemo(() => {
    const teams = (data?.teams || []).filter((t) => t.bracket === activeBracket && t.star_count > 0);
    return teams.length ? [...teams].sort((a, b) => b.star_count - a.star_count)[0] : null;
  }, [data, activeBracket]);

  // This device's starred teams (across both brackets) — the personal tracker.
  const myTeams = useMemo(
    () => (data?.teams || []).filter((t) => followed.has(t.id)).sort((a, b) => b.star_count - a.star_count),
    [data, followed]
  );

  // Junior "points" are round-robin ladder points; senior "points" are match scores.
  const pointsWord = activeBracket === 'junior' ? 'ladder points' : 'points scored';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-3xl border border-flare/30 bg-flare/10 p-8 text-center text-flare">{error}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <section>
        <p className="eyebrow text-volt">By The Numbers</p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-wide text-bone sm:text-5xl">Scoring Leaders</h1>
        <p className="mt-3 max-w-2xl text-sm text-ash">Ranked by {pointsWord}, with games played and points per game. Star a team to follow it and add to its fan count. Updates live as results come in.</p>
      </section>

      {/* Your favourites — this device's starred teams. */}
      {myTeams.length > 0 ? (
        <section className="rounded-3xl border border-gold/25 bg-gold/[0.04] p-5">
          <p className="eyebrow text-gold">Your Favourites</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {myTeams.map((team) => (
              <span
                key={team.id}
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-ink/40 px-3 py-1.5 text-sm font-bold text-bone"
              >
                <FollowButton teamId={team.id} teamName={team.name} />
                {displayTeamName(team.name)}
                <TeacherBadge team={team} />
                <span className="font-mono text-[10px] font-semibold text-gold">★ {team.star_count}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Bracket toggle — mirrors the home page. */}
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

      {stats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-4 py-12 text-center font-mono text-xs uppercase tracking-[0.18em] text-ash">
          No {activeBracket} stats yet — they appear once games are played.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HeadlineCard
              label="Most Points"
              value={displayTeamName(stats[0].team.name)}
              sub={`${stats[0].points} pts · ${stats[0].played} ${stats[0].played === 1 ? 'game' : 'games'}`}
            />
            {bestAvg ? (
              <HeadlineCard label="Best Per Game" value={`${bestAvg.avgPoints.toFixed(1)} avg`} sub={displayTeamName(bestAvg.team.name)} />
            ) : null}
            {mostFavourited ? (
              <HeadlineCard
                label="Most Favourited"
                value={displayTeamName(mostFavourited.name)}
                sub={`${mostFavourited.star_count} ${mostFavourited.star_count === 1 ? 'star' : 'stars'}`}
              />
            ) : null}
          </div>

          <section className="overflow-hidden rounded-3xl border border-line bg-surface/70 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Team</th>
                    <th className="px-3 py-3 text-right font-semibold">Played</th>
                    <th className="px-3 py-3 text-right font-semibold">Points</th>
                    <th className="px-3 py-3 text-right font-semibold">Avg / Game</th>
                    <th className="px-4 py-3 text-right font-semibold">Stars</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((row, index) => (
                    <tr
                      key={row.team.id}
                      className={`border-b border-line/50 transition-colors hover:bg-ink/40 ${index < 3 ? 'bg-volt/[0.04]' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-display text-lg ${index < 3 ? 'text-volt' : 'text-ash'}`}>{index + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FollowButton teamId={row.team.id} teamName={row.team.name} />
                          <span className="font-bold text-bone">{displayTeamName(row.team.name)}</span>
                          <TeacherBadge team={row.team} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-ash">{row.played}</td>
                      <td className="px-3 py-3 text-right font-display text-xl text-bone">{row.points}</td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-ash">{row.avgPoints.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">
                        <StarCount count={row.team.star_count} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}
