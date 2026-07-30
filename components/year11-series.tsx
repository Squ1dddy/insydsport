'use client';

import type { EnrichedMatch } from '@/types/tournament';
import { MatchCard } from '@/components/match-card';
import { displayTeamName, matchLabel, roundLabel, totalRoundsFor } from '@/lib/tournament-utils';
import { TeacherBadge } from '@/components/teacher-badge';

// One compact fixture row — the same visual language the home page uses for
// "on the horizon" matches, reused for the Year 11 rounds that aren't live yet.
function FixtureRow({ match }: { match: EnrichedMatch }) {
  const teams = [match.team1, match.team2, match.team3, match.team4].filter(
    (team): team is NonNullable<typeof team> => Boolean(team)
  );

  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface/60 px-5 py-4 transition-colors duration-200 hover:border-volt/30 hover:bg-surface">
      <div className="min-w-0 flex-1">
        {teams.length > 0 ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-bone">
            {teams.map((team, idx) => (
              <span key={team.id} className="inline-flex items-center gap-1.5">
                {displayTeamName(team.name)}
                <TeacherBadge team={team} />
                {idx < teams.length - 1 ? <span className="text-ash">·</span> : null}
              </span>
            ))}
          </p>
        ) : (
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash">Awaiting qualifiers</p>
        )}
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.2em] text-ash">{matchLabel(match)}</p>
      </div>
      {match.status === 'completed' ? (
        <span className="shrink-0 rounded-full border border-volt/40 bg-volt/10 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-volt">
          Final
        </span>
      ) : match.status === 'live' ? (
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-flare/50 bg-flare/12 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-flare">
          <span className="h-1.5 w-1.5 rounded-full bg-flare animate-dotPulse" />
          Live
        </span>
      ) : (
        <span className="shrink-0 rounded-full border border-line bg-ink/60 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-ash">
          Upcoming
        </span>
      )}
    </div>
  );
}

/**
 * The Year 11 series schedule — the senior bracket's live series now that Year 12
 * has concluded. This is front-page content, not a collapsed drawer: the active
 * round renders as full match cards, and the rounds either side render as compact
 * fixture rows so the whole series fits without hunting.
 *
 * Year 11 has no fixed day→date mapping, so every match reads "Date TBC" until an
 * admin sets a real date (Admin → Matches → Date) — see matchLabel.
 */
export function Year11Series({ matches }: { matches: EnrichedMatch[] }) {
  if (matches.length === 0) {
    return (
      <section className="space-y-5">
        <div className="border-b border-line pb-4">
          <p className="eyebrow text-volt">Now Running</p>
          <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-bone">Year 11 Series</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-4 py-10 text-center font-mono text-xs uppercase tracking-[0.18em] text-ash">
          Fixtures not published yet — check back soon.
        </div>
      </section>
    );
  }

  const rounds = [...new Set(matches.map((match) => match.round))].sort((a, b) => a - b);
  // The active round is the earliest one still holding an unfinished match; once
  // every match is done the final round stays expanded as the result.
  const activeRound =
    rounds.find((round) => matches.some((match) => match.round === round && match.status !== 'completed')) ??
    rounds[rounds.length - 1];
  const finalRound = totalRoundsFor('senior', 'year11');
  const datesSet = matches.filter((match) => match.scheduled_date).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-5xl leading-none text-volt/30">11</span>
          <div>
            <p className="eyebrow text-volt">Now Running</p>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-bone">Year 11 Series</h2>
          </div>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ash">
          {datesSet === 0
            ? 'Dates TBC'
            : datesSet < matches.length
              ? `${datesSet}/${matches.length} dates confirmed`
              : 'All dates confirmed'}
          {' · '}
          {roundLabel('senior', finalRound, 'year11')} decides it
        </p>
      </div>

      {rounds.map((round) => {
        const roundMatches = matches
          .filter((match) => match.round === round)
          .sort((a, b) => a.match_number - b.match_number);
        const isActive = round === activeRound;

        return (
          <div key={round} className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-line/50 pb-2">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ash">
                {roundLabel('senior', round, 'year11')}
              </p>
              {isActive ? (
                <span className="rounded-full border border-volt/40 bg-volt/10 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-volt">
                  Up Next
                </span>
              ) : null}
            </div>

            {isActive ? (
              <div className="grid gap-4">
                {roundMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {roundMatches.map((match) => (
                  <FixtureRow key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
