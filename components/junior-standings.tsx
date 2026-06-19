'use client';

import { useMemo, useState } from 'react';
import type { Team } from '@/types/tournament';
import { displayTeamName, getJuniorStandings, yearGroupOf } from '@/lib/tournament-utils';
import { FollowButton } from '@/components/follow-button';
import { TeacherBadge } from '@/components/teacher-badge';

const YEAR_ORDER = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 7-10'];

// Junior round-robin ladder. Unlike the senior knockout there is no bracket tree —
// juniors accumulate points across games and are ranked on a single table. Years
// 7-10 share the ladder, so each row is tagged with its year and the ladder can be
// filtered by year group (re-ranked within that year).
export function JuniorStandings({ teams }: { teams: Team[] }) {
  const [year, setYear] = useState<string>('all');

  const juniorTeams = useMemo(() => teams.filter((team) => team.bracket === 'junior'), [teams]);

  const years = useMemo(() => {
    const set = new Set(juniorTeams.map(yearGroupOf));
    return [...set].sort((a, b) => {
      const ia = YEAR_ORDER.indexOf(a);
      const ib = YEAR_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
  }, [juniorTeams]);

  const filtered = year === 'all' ? juniorTeams : juniorTeams.filter((team) => yearGroupOf(team) === year);
  const standings = getJuniorStandings(filtered);

  if (juniorTeams.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-4 py-10 text-center font-mono text-xs uppercase tracking-[0.18em] text-ash">
        Ladder&apos;s empty — the first game sets the standard.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {years.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {['all', ...years].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setYear(option)}
              className={`rounded-full border px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${
                year === option ? 'border-volt bg-volt/15 text-volt' : 'border-line bg-surface text-ash hover:border-volt/30 hover:text-bone'
              }`}
            >
              {option === 'all' ? 'All Years' : option}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface/60 shadow-card">
        <div className="grid grid-cols-[2.25rem_1fr_3.5rem_3.25rem] gap-2 border-b border-line bg-ink/60 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ash sm:grid-cols-[2.75rem_1fr_4.5rem_4rem]">
          <span className="text-center">#</span>
          <span>Team</span>
          <span className="text-center">Played</span>
          <span className="text-right">Pts</span>
        </div>
        <div className="divide-y divide-line/60">
          {standings.map(({ rank, team }) => {
            const leader = rank === 1;
            return (
              <div
                key={team.id}
                className={`grid grid-cols-[2.25rem_1fr_3.5rem_3.25rem] items-center gap-2 px-4 py-3 transition-colors duration-200 hover:bg-volt/[0.04] sm:grid-cols-[2.75rem_1fr_4.5rem_4rem] ${
                  leader ? 'bg-volt/[0.06]' : ''
                }`}
              >
                <span className={`text-center font-display text-xl leading-none ${leader ? 'text-volt' : 'text-ash'}`}>{rank}</span>
                <div className="flex min-w-0 items-center gap-2">
                  <FollowButton teamId={team.id} teamName={team.name} />
                  <div className="min-w-0">
                    <p className={`flex items-center gap-2 truncate text-sm font-bold leading-tight ${leader ? 'text-volt' : 'text-bone'}`}>
                      <span className="truncate">{displayTeamName(team.name)}</span>
                      <TeacherBadge team={team} />
                      <span className="shrink-0 rounded border border-line bg-ink/60 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-ash">
                        {yearGroupOf(team).replace('Year ', 'Yr ')}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ash">
                      {team.player1}
                      {team.player2 ? ` · ${team.player2}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-center font-mono text-sm font-semibold text-ash">{team.games_played}</span>
                <span className={`digits text-right font-display text-2xl leading-none ${leader ? 'text-volt' : 'text-bone'}`}>{team.points}</span>
              </div>
            );
          })}
          {standings.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-xs uppercase tracking-[0.18em] text-ash">No teams in {year}.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
