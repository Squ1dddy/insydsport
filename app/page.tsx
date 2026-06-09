'use client';

import { useMemo, useState } from 'react';
import { useTournament } from '@/components/tournament-provider';
import { MatchCard } from '@/components/match-card';
import { displayTeamName, formatAestDate, matchTeamsLabel, getScheduledDate, matchLabel } from '@/lib/tournament-utils';
import type { BracketName } from '@/types/tournament';

export default function HomePage() {
  const { data, loading, error } = useTournament();
  const [activeBracket, setActiveBracket] = useState<BracketName>('senior');

  const { todayMatches, upcomingMatches, currentDay, currentDayDate } = useMemo(() => {
    const matches = (data?.matches || []).filter(m => m.bracket === activeBracket);
    // Find the first day that has matches that are not completed (live or upcoming)
    const activeDayMatch = matches.find(m => m.status !== 'completed');
    const day = activeDayMatch?.scheduled_day ?? 1;
    
    return {
      currentDay: day,
      currentDayDate: getScheduledDate(day),
      // Include BOTH live and upcoming matches for the current day in the main list
      todayMatches: matches.filter((match) => match.scheduled_day === day).sort((a, b) => a.match_number - b.match_number),
      upcomingMatches: matches.filter((match) => match.scheduled_day > day).sort((a, b) => a.scheduled_day - b.scheduled_day)
    };
  }, [data, activeBracket]);
  const liveMatch = data?.matches.find((match) => match.status === 'live' && match.bracket === activeBracket) || null;

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-textMuted">Loading live tournament data...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {liveMatch ? (
        <section className="overflow-hidden rounded-[2rem] border border-win/60 bg-[linear-gradient(135deg,#111c2e_0%,#1f3155_52%,#111c2e_100%)] p-5 shadow-card animate-livePulse">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-red-200">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-dotPulse" />
                Live Now
              </span>
              <h2 className="mt-3 text-2xl font-black uppercase text-white lg:text-4xl">Live Match</h2>
              <p className="mt-2 text-sm text-textMuted">{matchTeamsLabel(liveMatch)}</p>
            </div>
            <div className="flex gap-4 text-center">
              {[
                liveMatch.team1,
                liveMatch.team2,
                liveMatch.team3,
                liveMatch.team4
              ]
                .filter(Boolean)
                .map((team, index) => {
                  const score = [liveMatch.team1_score, liveMatch.team2_score, liveMatch.team3_score, liveMatch.team4_score][index];
                  return (
                    <div key={team!.id} className="min-w-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-white">{displayTeamName(team!.name)}</p>
                      <p className="mt-2 text-4xl font-black text-win">{score}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-win/30 bg-[linear-gradient(135deg,#101c2e_0%,#192b4a_52%,#0f1c2e_100%)] p-6 shadow-card lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.45em] text-win">Season opener</p>
            <h1 className="mt-3 text-4xl font-black uppercase leading-tight text-white lg:text-6xl">
              Inner Sydney Handball Knockout
              <span className="block text-win">Season 1</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-textMuted lg:text-base">
              Dark esports-style live scores, bracket trees, and real-time match control for the school tournament.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
            <img 
              src="/images/school-emblem.png" 
              alt="Inner Sydney school emblem" 
              className="h-28 w-28 object-contain" 
            />
          </div>
        </div>
      </section>

      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 shadow-card">
          {(['senior', 'junior'] as const).map((bracket) => (
            <button
              key={bracket}
              onClick={() => setActiveBracket(bracket)}
              className={`rounded-xl px-8 py-2.5 text-xs font-black uppercase tracking-[0.25em] transition-all ${
                activeBracket === bracket ? 'bg-win text-[#0f1c2e] shadow-lg' : 'text-textMuted hover:text-white'
              }`}
            >
              {bracket}s
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-win">Today&apos;s Matches</p>
            <h2 className="mt-1 text-2xl font-black text-white">Day {currentDay}</h2>
          </div>
          <p className="text-sm text-textMuted">{formatAestDate(currentDayDate || new Date().toISOString())}</p>
        </div>
        <div className="grid gap-4">
          {todayMatches.length > 0 ? (
            todayMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          ) : (
             <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-textMuted">No matches scheduled for {activeBracket}s today.</div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-win">Upcoming Matches</p>
          <h2 className="mt-1 text-2xl font-black text-white">Future days</h2>
        </div>
        <div className="grid gap-3">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((match) => (
              <div key={match.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">
                      {[match.team1, match.team2, match.team3, match.team4]
                        .filter(Boolean)
                        .map((team) => displayTeamName(team!.name))
                        .join(' · ')}
                    </p>
                    <p className="text-xs uppercase tracking-[0.25em] text-textMuted">
                      {matchLabel(match)}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-[#101a2a] px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-textMuted">
                    Upcoming
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-textMuted">No future {activeBracket} matches scheduled yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
