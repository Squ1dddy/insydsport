'use client';

import type { Team } from '@/types/tournament';
import { displayTeamName, getJuniorStandings } from '@/lib/tournament-utils';

// Junior round-robin ladder. Unlike the senior knockout there is no bracket tree —
// juniors accumulate points across games and are ranked on a single table.
export function JuniorStandings({ teams }: { teams: Team[] }) {
  const standings = getJuniorStandings(teams);

  if (standings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-4 py-10 text-center font-mono text-xs uppercase tracking-[0.18em] text-ash">
        No junior teams on the ladder yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/60 shadow-card">
      <div className="grid grid-cols-[2.5rem_1fr_3.5rem_4rem] gap-2 border-b border-line bg-ink/60 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ash sm:grid-cols-[3rem_1fr_4rem_5rem]">
        <span className="text-center">#</span>
        <span>Team</span>
        <span className="text-center">GP</span>
        <span className="text-right">Pts</span>
      </div>
      <div className="divide-y divide-line/60">
        {standings.map(({ rank, team }) => {
          const podium = rank <= 3;
          return (
            <div
              key={team.id}
              className={`grid grid-cols-[2.5rem_1fr_3.5rem_4rem] items-center gap-2 px-4 py-3 transition-colors duration-200 hover:bg-volt/[0.04] sm:grid-cols-[3rem_1fr_4rem_5rem] ${
                podium ? 'bg-volt/[0.05]' : ''
              }`}
            >
              <span
                className={`text-center font-display text-xl leading-none ${
                  podium ? 'text-volt' : 'text-ash'
                }`}
              >
                {rank}
              </span>
              <div className="min-w-0">
                <p className={`truncate text-sm font-bold leading-tight ${podium ? 'text-volt' : 'text-bone'}`}>
                  {displayTeamName(team.name)}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ash">
                  {team.player1}
                  {team.player2 ? ` · ${team.player2}` : ''}
                </p>
              </div>
              <span className="text-center font-mono text-sm font-semibold text-ash">{team.games_played}</span>
              <span className={`digits text-right font-display text-2xl leading-none ${podium ? 'text-volt' : 'text-bone'}`}>
                {team.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
