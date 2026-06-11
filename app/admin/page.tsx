'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useTournament } from '@/components/tournament-provider';
import { AdminJuniorLadder } from '@/components/admin-junior-ladder';
import type { BracketName, EnrichedMatch, Team } from '@/types/tournament';
import {
  displayTeamName,
  formatAestDateTime,
  getMatchPlacements,
  matchLabel,
  matchTeamsLabel,
  roundLabel,
  yearGroupOf
} from '@/lib/tournament-utils';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'inner-sydney-admin-auth-password';
type TabKey = 'live' | 'past' | 'junior' | 'matches' | 'teams';
type PlacementChoice = 'auto' | 'advanced' | 'eliminated';

async function postAction(body: unknown) {
  const password = window.localStorage.getItem(STORAGE_KEY) || '';
  const response = await fetch('/api/admin/matches', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-password': password
    },
    body: JSON.stringify(body)
  });

  if (response.status === 401) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error('Admin action failed.');
  }
}

export default function AdminPage() {
  const { data, loading, error, refresh } = useTournament();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<TabKey>('live');
  const [selectedLiveMatchId, setSelectedLiveMatchId] = useState('');
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [expandedMatchIds, setExpandedMatchIds] = useState<string[]>([]);
  const [newTeam, setNewTeam] = useState({
    name: '',
    player1: '',
    player2: '',
    skill_level: 5,
    bracket: 'senior' as BracketName,
    year_group: 'Year 12, Week 1',
    status: 'active' as Team['status'],
    is_teacher: false
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    // Verify the stored password is still valid before trusting it. This avoids a
    // stale credential (e.g. a pre-migration 'true' flag, or an old/rotated
    // password) silently getting sent on writes and 401-ing mid-edit. Fail closed:
    // anything other than a confirmed-valid password drops back to the login gate.
    let active = true;
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: stored })
    })
      .then((res) => {
        if (!active) return;
        if (res.ok) {
          setAuthed(true);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {
        if (!active) return;
        window.localStorage.removeItem(STORAGE_KEY);
      });

    return () => {
      active = false;
    };
  }, []);

  const teams = data?.teams || [];
  const matches = data?.matches || [];
  const liveMatches = useMemo(() => matches.filter((match) => match.status === 'live').sort((a, b) => a.bracket.localeCompare(b.bracket) || a.match_number - b.match_number), [matches]);
  const upcomingMatches = useMemo(() => matches.filter((match) => match.status === 'upcoming').sort((a, b) => a.scheduled_day - b.scheduled_day || a.match_number - b.match_number), [matches]);
  const completedMatches = useMemo(() => matches.filter((match) => match.status === 'completed').sort((a, b) => Number(new Date(b.played_at || 0)) - Number(new Date(a.played_at || 0))), [matches]);
  // The live tab can act on ANY match — live, upcoming, or already played — so the
  // selection is resolved against the full match list. This is what keeps a match
  // selected after Set Live flips its status to 'live' (it used to fall out of the
  // upcoming-only list and the selection would snap to a different match).
  const selectedLiveMatch = matches.find((match) => match.id === selectedLiveMatchId) || liveMatches[0] || upcomingMatches[0] || completedMatches[0] || null;

  useEffect(() => {
    // Only auto-pick a default when nothing valid is selected. Never override a
    // selection that still points at a real match (preserves the live match after
    // Set Live). Prefer a live match, then the next upcoming one, then any played
    // game — that last fallback covers the end-of-tournament state where every
    // match is completed, keeping the picker and selection in sync.
    const stillValid = selectedLiveMatchId && matches.some((match) => match.id === selectedLiveMatchId);
    if (!stillValid) {
      const fallback = liveMatches[0]?.id || upcomingMatches[0]?.id || completedMatches[0]?.id || '';
      if (fallback !== selectedLiveMatchId) {
        setSelectedLiveMatchId(fallback);
      }
    }
  }, [matches, liveMatches, upcomingMatches, completedMatches, selectedLiveMatchId]);

  async function login() {
    setLoginError('');
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        window.localStorage.setItem(STORAGE_KEY, password);
        setAuthed(true);
      } else {
        setLoginError(result.message || 'Incorrect password.');
      }
    } catch (err) {
      setLoginError('Authentication service unavailable.');
    }
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setPassword('');
    setAuthed(false);
  }

  async function resetAndReseed() {
    const response = await fetch('/api/admin/reset-seed', {
      method: 'POST',
      headers: { 'x-admin-password': window.localStorage.getItem(STORAGE_KEY) || '' }
    });
    if (!response.ok) {
      throw new Error('Reset and reseed failed.');
    }
    await refresh();
  }

  async function clearAllScores() {
    await postAction({ action: 'clear-scores' });
    await refresh();
  }

  if (!authed) {
    return (
      <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-[2rem] border border-line bg-gradient-to-b from-surface to-ink/90 p-7 shadow-card">
        <p className="eyebrow text-volt">Control Room</p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wide text-bone">Admin Login</h1>
        <p className="mt-2 text-sm text-ash">Shared password gate for tournament control.</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') login();
          }}
          placeholder="Enter password"
          className="mt-6 w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-bone outline-none transition-colors focus:border-volt"
        />
        <button
          onClick={login}
          className="mt-4 w-full rounded-2xl bg-volt px-4 py-3 font-mono text-sm font-bold uppercase tracking-[0.22em] text-ink transition-all duration-200 hover:shadow-volt"
        >
          Unlock
        </button>
        {loginError ? <p className="mt-3 text-sm text-flare">{loginError}</p> : null}
      </div>
    );
  }

  if (loading) {
    return <div className="rounded-3xl border border-secondary bg-primary p-8 text-center text-textMuted">Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200">{error}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-line bg-gradient-to-b from-surface to-ink/90 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-volt">Control Room</p>
            <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-bone lg:text-4xl">Match Management</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['live', 'Live Scoring'],
              ['past', 'Past Games'],
              ['junior', 'Junior Ladder'],
              ['matches', 'Matches'],
              ['teams', 'Team Management']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key as TabKey)}
                className={`rounded-full px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${
                  tab === key ? 'bg-volt text-ink shadow-volt' : 'border border-line bg-ink/50 text-ash hover:text-bone'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-flare/40 bg-flare/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-flare transition-all duration-200 hover:bg-flare/20"
            >
              Log out
            </button>
          </div>
        </div>
      </section>

      {tab === 'live' ? (
        <LiveScoringTab
          liveMatches={liveMatches}
          upcomingMatches={upcomingMatches}
          completedMatches={completedMatches}
          selectedMatch={selectedLiveMatch}
          selectedLiveMatchId={selectedLiveMatchId}
          setSelectedLiveMatchId={setSelectedLiveMatchId}
          selectedWinners={selectedWinners}
          setSelectedWinners={setSelectedWinners}
          currentDayOverride={data?.settings?.currentDayOverride ?? null}
          onRefresh={refresh}
        />
      ) : null}

      {tab === 'past' ? <PastGamesTab matches={completedMatches} expandedMatchIds={expandedMatchIds} setExpandedMatchIds={setExpandedMatchIds} onRefresh={refresh} /> : null}

      {tab === 'junior' ? <AdminJuniorLadder teams={teams} onAction={postAction} onRefresh={refresh} /> : null}

      {tab === 'matches' ? <MatchesTab matches={matches} teams={teams} onRefresh={refresh} /> : null}

      {tab === 'teams' ? (
        <TeamManagementTab
          teams={teams}
          newTeam={newTeam}
          setNewTeam={setNewTeam}
          onRefresh={refresh}
          onReset={resetAndReseed}
          onClearScores={clearAllScores}
        />
      ) : null}
    </motion.div>
  );
}

function LiveScoringTab({
  liveMatches,
  upcomingMatches,
  completedMatches,
  selectedMatch,
  selectedLiveMatchId,
  setSelectedLiveMatchId,
  selectedWinners,
  setSelectedWinners,
  currentDayOverride,
  onRefresh
}: {
  liveMatches: EnrichedMatch[];
  upcomingMatches: EnrichedMatch[];
  completedMatches: EnrichedMatch[];
  selectedMatch: EnrichedMatch | null;
  selectedLiveMatchId: string;
  setSelectedLiveMatchId: (id: string) => void;
  selectedWinners: string[];
  setSelectedWinners: (value: string[]) => void;
  currentDayOverride: number | null;
  onRefresh: () => Promise<unknown>;
}) {
  const [liveScores, setLiveScores] = useState<number[]>([0, 0, 0, 0]);
  const [scoreError, setScoreError] = useState<string | null>(null);
  // Serial write queue — each DB write chains onto this promise so concurrent taps
  // never race each other in the DB (which would cause lost increments via
  // read-modify-write conflicts). Optimistic display is still immediate.
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  // Guard against stale writes firing after the admin switches to a different match.
  const activeMatchId = useRef<string | undefined>(undefined);

  // Re-sync local scores only when the selected match changes. This keeps the
  // scoring device authoritative for the match in play, so optimistic taps aren't
  // overwritten by the realtime refresh echoing our own writes back.
  useEffect(() => {
    if (selectedMatch) {
      setLiveScores([selectedMatch.team1_score, selectedMatch.team2_score, selectedMatch.team3_score, selectedMatch.team4_score]);
      setScoreError(null);
      // Reset the queue and the guard for the new match.
      activeMatchId.current = selectedMatch.id;
      writeQueue.current = Promise.resolve();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatch?.id]);

  const displayMatch = selectedMatch
    ? ({ ...selectedMatch, team1_score: liveScores[0], team2_score: liveScores[1], team3_score: liveScores[2], team4_score: liveScores[3] } as EnrichedMatch)
    : null;
  const tieInfo = displayMatch ? getMatchPlacements(displayMatch) : null;
  const liveTeams = [selectedMatch?.team1, selectedMatch?.team2, selectedMatch?.team3, selectedMatch?.team4].filter(Boolean) as Team[];

  async function setLive() {
    if (!selectedMatch) return;
    await postAction({ action: 'set-live', matchId: selectedMatch.id });
    await onRefresh();
  }

  async function stopLive() {
    if (!selectedMatch) return;
    await postAction({ action: 'stop-live', matchId: selectedMatch.id });
    await onRefresh();
  }

  function adjustScore(slot: 1 | 2 | 3 | 4, delta: 1 | -1) {
    if (!selectedMatch) return;
    const idx = slot - 1;
    const matchId = selectedMatch.id; // capture at tap time — safe against re-renders
    setScoreError(null);

    // Update the display immediately (functional updater always sees latest state,
    // so rapid taps stack correctly even before any re-render).
    setLiveScores((prev) => prev.map((v, i) => (i === idx ? Math.max(0, v + delta) : v)));

    // Chain the DB write onto the serial queue. This guarantees writes are sent one
    // at a time, so each server-side read-modify-write sees the result of the last
    // one rather than racing against it — no lost increments from spam tapping.
    writeQueue.current = writeQueue.current.then(async () => {
      // Skip if the admin has already switched to a different match.
      if (activeMatchId.current !== matchId) return;
      try {
        await postAction({ action: delta === 1 ? 'increment' : 'undo', matchId, slot });
      } catch {
        // Undo only this tap's contribution — no stale snapshot needed.
        setLiveScores((prev) => prev.map((v, i) => (i === idx ? Math.max(0, v - delta) : v)));
        setScoreError('Score update failed — check your connection and try again.');
      }
    });
  }

  const increment = (slot: 1 | 2 | 3 | 4) => adjustScore(slot, 1);
  const decrement = (slot: 1 | 2 | 3 | 4) => adjustScore(slot, -1);

  async function completeMatch() {
    if (!selectedMatch) return;

    if (tieInfo?.tieAtCutoff && selectedWinners.length !== 2) {
      alert('You must select EXACTLY 2 teams to advance during a tie.');
      return;
    }

    if (!window.confirm('Complete this match? The top 2 teams will be locked in as winners and the next-round match will be created.')) {
      return;
    }

    if (tieInfo?.tieAtCutoff) {
      await postAction({ action: 'complete', matchId: selectedMatch.id, winnerIds: selectedWinners });
    } else {
      await postAction({ action: 'complete', matchId: selectedMatch.id });
    }
    setSelectedWinners([]);
    await onRefresh();
  }

  async function setCurrentDay(day: number | null) {
    await postAction({ action: 'set-current-day', day });
    await onRefresh();
  }

  return (
    <section className="space-y-5">
      {/* Home Day Override — controls which day "This Week" shows on the public home page */}
      <div className="rounded-[2rem] border border-line bg-surface/80 p-4 shadow-card">
        <p className="eyebrow text-volt">Home Page Day</p>
        <p className="mt-1 text-sm text-ash">
          Controls which day shows in "This Week" on the public home page for all viewers.{' '}
          <span className="text-volt">Auto</span> uses today's date.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentDay(null)}
            className={`rounded-full px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.22em] transition-all duration-200 ${
              currentDayOverride === null
                ? 'bg-volt text-ink shadow-volt'
                : 'border border-line bg-ink/50 text-ash hover:text-bone'
            }`}
          >
            Auto
          </button>
          {([1, 2, 3, 4, 5] as const).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setCurrentDay(day)}
              className={`rounded-full px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.22em] transition-all duration-200 ${
                currentDayOverride === day
                  ? 'bg-volt text-ink shadow-volt'
                  : 'border border-line bg-ink/50 text-ash hover:text-bone'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
        {currentDayOverride !== null ? (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-flare">
            Override active — home shows Day {currentDayOverride}. Set to Auto to restore date-driven behaviour.
          </p>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-secondary bg-primary p-4 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[280px] space-y-2 text-sm font-bold text-textMuted">
            <span className="block uppercase tracking-[0.28em]">Select match</span>
            <select
              value={selectedLiveMatchId}
              onChange={(event) => {
                setSelectedLiveMatchId(event.target.value);
                setSelectedWinners([]);
              }}
              className="w-full rounded-2xl border border-secondary bg-primary px-4 py-3 text-slate-100 outline-none focus:border-gold"
            >
              {liveMatches.length > 0 ? (
                <optgroup label="🔴 Live Now" className="bg-primary text-red-300">
                  {liveMatches.map((match) => (
                    <option key={match.id} value={match.id} className="text-slate-100">
                      {match.bracket === 'senior' ? 'SR' : 'JR'} · {matchLabel(match)} — {matchTeamsLabel(match)}
                    </option>
                  ))}
                </optgroup>
              ) : null}

              {([
                ['Upcoming · Seniors', 'senior', upcomingMatches, 'text-gold'],
                ['Upcoming · Juniors', 'junior', upcomingMatches, 'text-gold'],
                ['Previous Games · Seniors', 'senior', completedMatches, 'text-ash'],
                ['Previous Games · Juniors', 'junior', completedMatches, 'text-ash']
              ] as const).map(([label, bracket, source, labelClass]) => {
                const group = source.filter((m) => m.bracket === bracket);
                if (group.length === 0) return null;
                return (
                  <optgroup key={label} label={label} className={`bg-primary ${labelClass}`}>
                    {group.map((match) => (
                      <option key={match.id} value={match.id} className="text-slate-100">
                        {matchLabel(match)} — {matchTeamsLabel(match)}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
          {selectedMatch?.status === 'live' ? (
            <button
              type="button"
              onClick={stopLive}
              className="rounded-2xl border border-amber-400/50 bg-amber-400/10 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-amber-200 transition-all duration-200 hover:scale-105"
            >
              Stop Live
            </button>
          ) : (
            <button
              type="button"
              onClick={setLive}
              disabled={!selectedMatch}
              className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-red-200 transition-all duration-200 hover:scale-105 disabled:opacity-40"
            >
              Set Live
            </button>
          )}
        </div>
        {selectedMatch ? (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-textMuted">
            Selected: {matchLabel(selectedMatch)} ·{' '}
            <span
              className={
                selectedMatch.status === 'live'
                  ? 'text-red-300'
                  : selectedMatch.status === 'completed'
                  ? 'text-emerald-300'
                  : 'text-gold'
              }
            >
              {selectedMatch.status === 'live'
                ? 'ON AIR'
                : selectedMatch.status === 'completed'
                ? 'COMPLETED — editing score will not re-air it'
                : 'UPCOMING'}
            </span>
          </p>
        ) : null}
      </div>

      {selectedMatch ? (
        <>
          {scoreError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{scoreError}</div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {[1, 2, 3, 4].map((slot) => {
              const team = [selectedMatch.team1, selectedMatch.team2, selectedMatch.team3, selectedMatch.team4][slot - 1];
              const score = liveScores[slot - 1];
              return (
                <LiveScoreCard
                  key={slot}
                  team={team || null}
                  score={score}
                  active={selectedMatch.status === 'live'}
                  onPlus={() => increment(slot as 1 | 2 | 3 | 4)}
                  onMinus={() => decrement(slot as 1 | 2 | 3 | 4)}
                />
              );
            })}
          </div>

          {tieInfo?.tieAtCutoff ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
              <p className="text-sm font-black uppercase tracking-[0.26em]">Tie detected for 2nd/3rd</p>
              <p className="mt-2 text-sm">Pick exactly two advancing teams before completing.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {liveTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() =>
                      setSelectedWinners(
                        selectedWinners.includes(team.id) ? selectedWinners.filter((id) => id !== team.id) : [...selectedWinners, team.id]
                      )
                    }
                    className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.22em] transition-all duration-200 ${
                      selectedWinners.includes(team.id) ? 'border-gold/40 bg-gold/15 text-gold' : 'border-secondary bg-primary text-slate-100'
                    }`}
                  >
                    {displayTeamName(team.name)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={completeMatch}
            disabled={!selectedMatch || (tieInfo?.tieAtCutoff ? selectedWinners.length !== 2 : false)}
            className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black uppercase tracking-[0.26em] text-slate-100 transition-all duration-200 hover:scale-[1.01] disabled:opacity-40"
          >
            Complete Match
          </button>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-secondary bg-primary px-4 py-10 text-center text-textMuted">No matches available to score yet.</div>
      )}
    </section>
  );
}

function LiveScoreCard({
  team,
  score,
  active,
  onPlus,
  onMinus
}: {
  team: Team | null;
  score: number;
  active: boolean;
  onPlus: () => void;
  onMinus: () => void;
}) {
  return (
    <article
      className={`relative min-h-[280px] overflow-hidden rounded-[2rem] border bg-gradient-to-b from-surface to-ink/90 p-4 shadow-card transition-all duration-300 ${
        active ? 'border-volt/60 shadow-volt' : 'border-line'
      }`}
    >
      {active ? <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-volt/15 blur-2xl" /> : null}
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-center gap-2 text-center">
          {active ? <span className="h-1.5 w-1.5 rounded-full bg-volt animate-dotPulse" /> : null}
          <p className="truncate font-mono text-xs font-semibold uppercase tracking-[0.2em] text-bone">{team ? displayTeamName(team.name) : 'TBD'}</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span key={score} className={`digits font-display text-[7rem] leading-none animate-scorePop ${active ? 'text-volt' : 'text-bone'}`}>{score}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onMinus}
            className={`min-h-20 rounded-2xl border font-display text-4xl transition-all duration-150 active:scale-95 ${
              active ? 'border-line bg-ink/60 text-ash hover:text-bone' : 'border-line bg-ink/40 text-ash'
            }`}
          >
            −
          </button>
          <button
            type="button"
            onClick={onPlus}
            className={`min-h-20 rounded-2xl border font-display text-4xl transition-all duration-150 active:scale-95 ${
              active ? 'border-volt/50 bg-volt/15 text-volt hover:bg-volt/25' : 'border-line bg-ink/40 text-bone hover:border-volt/30'
            }`}
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

function PastGamesTab({
  matches,
  expandedMatchIds,
  setExpandedMatchIds,
  onRefresh
}: {
  matches: EnrichedMatch[];
  expandedMatchIds: string[];
  setExpandedMatchIds: (value: string[]) => void;
  onRefresh: () => Promise<unknown>;
}) {
  return (
    <section className="space-y-4">
      {matches.map((match) => (
        <PastGameEditor
          key={match.id}
          match={match}
          expanded={expandedMatchIds.includes(match.id)}
          onToggle={() => setExpandedMatchIds(expandedMatchIds.includes(match.id) ? expandedMatchIds.filter((id) => id !== match.id) : [...expandedMatchIds, match.id])}
          onRefresh={onRefresh}
        />
      ))}
      {matches.length === 0 ? <div className="rounded-3xl border border-dashed border-secondary bg-primary px-4 py-8 text-center text-textMuted">No completed matches yet.</div> : null}
    </section>
  );
}

function PastGameEditor({
  match,
  expanded,
  onToggle,
  onRefresh
}: {
  match: EnrichedMatch;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => Promise<unknown>;
}) {
  const [scores, setScores] = useState([match.team1_score, match.team2_score, match.team3_score, match.team4_score]);
  const [placements, setPlacements] = useState<PlacementChoice[]>(['auto', 'auto', 'auto', 'auto']);
  const outcome = getMatchPlacements({
    ...match,
    team1_score: scores[0],
    team2_score: scores[1],
    team3_score: scores[2],
    team4_score: scores[3]
  } as EnrichedMatch);
  const teams = [match.team1, match.team2, match.team3, match.team4].filter(Boolean) as Team[];

  async function save() {
    const manualAdvanced = placements
      .map((choice, index) => (choice === 'advanced' ? teams[index]?.id : null))
      .filter(Boolean) as string[];
    const winnerIds =
      manualAdvanced.length === 2
        ? manualAdvanced
        : Array.from(outcome.placements.entries())
            .filter(([, state]) => state === 'advanced')
            .map(([id]) => id);

    await postAction({
      action: 'update-match',
      matchId: match.id,
      payload: {
        team1_score: scores[0],
        team2_score: scores[1],
        team3_score: scores[2],
        team4_score: scores[3],
        status: 'completed',
        winner1_id: winnerIds[0] || null,
        winner2_id: winnerIds[1] || null,
        played_at: match.played_at || new Date().toISOString()
      }
    });
    await onRefresh();
  }

  return (
    <article className="rounded-[2rem] border border-secondary bg-primary p-4 shadow-card transition-all duration-300 hover:scale-[1.01] hover:border-gold/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-gold">
            {matchLabel(match)}
          </p>
          <p className="mt-2 text-sm font-black text-slate-100">{matchTeamsLabel(match)}</p>
          <p className="mt-2 text-xs text-textMuted">{formatAestDateTime(match.played_at)}</p>
        </div>
        <button type="button" onClick={onToggle} className="rounded-full border border-secondary bg-primary px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-100 transition-all duration-200 hover:scale-105">
          {expanded ? 'Hide Edit Scores' : 'Edit Scores'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {teams.map((team, index) => (
          <div key={team.id} className={`rounded-2xl border px-4 py-3 ${outcome.placements.get(team.id) === 'advanced' ? 'border-gold/50 bg-gold/10' : 'border-red-500/30 bg-red-500/5'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-100">{displayTeamName(team.name)}</p>
                <p className="text-xs text-textMuted">
                  {team.player1} · {team.player2}
                </p>
              </div>
              <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${outcome.placements.get(team.id) === 'advanced' ? 'border-gold/40 bg-gold/15 text-gold' : 'border-red-500/40 bg-red-500/10 text-red-200'}`}>
                {outcome.placements.get(team.id) === 'advanced' ? 'ADVANCED' : outcome.placements.get(team.id) === 'tie' ? 'TIE' : 'ELIMINATED'}
              </span>
            </div>
            {expanded ? (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs font-bold text-textMuted">
                  Score
                  <input
                    type="number"
                    min={0}
                    value={scores[index]}
                    onChange={(event) => {
                      const next = [...scores];
                      next[index] = Number(event.target.value);
                      setScores(next);
                    }}
                    className="mt-1 w-full rounded-xl border border-secondary bg-primary px-3 py-2 text-slate-100"
                  />
                </label>
                <label className="text-xs font-bold text-textMuted">
                  Override
                  <select
                    value={placements[index]}
                    onChange={(event) => {
                      const next = [...placements];
                      next[index] = event.target.value as PlacementChoice;
                      setPlacements(next);
                    }}
                    className="mt-1 w-full rounded-xl border border-secondary bg-primary px-3 py-2 text-slate-100"
                  >
                    <option value="auto">Auto</option>
                    <option value="advanced">Advanced</option>
                    <option value="eliminated">Eliminated</option>
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {expanded ? (
        <button type="button" onClick={save} className="mt-4 rounded-2xl bg-gold px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-primary transition-all duration-200 hover:scale-105">
          Save Changes
        </button>
      ) : null}
      {outcome.tieAtCutoff ? <div className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-200">Tie detected — manual review required</div> : null}
    </article>
  );
}

function MatchesTab({ matches, teams, onRefresh }: { matches: EnrichedMatch[]; teams: Team[]; onRefresh: () => Promise<unknown> }) {
  // Show all upcoming matches; current-term first, then Year 11 (next term).
  const upcomingMatches = matches
    .filter((match) => match.status === 'upcoming')
    .sort((a, b) => Number(a.is_next_term) - Number(b.is_next_term) || a.scheduled_day - b.scheduled_day || a.match_number - b.match_number);

  return (
    <div className="space-y-6">
      <CreateMatchForm matches={matches} teams={teams} onRefresh={onRefresh} />

      <section className="rounded-[2rem] border border-line bg-surface/80 p-5 shadow-card">
        <h2 className="font-display text-2xl uppercase tracking-wide text-bone">Upcoming Matches</h2>
        <p className="mt-1 text-sm text-textMuted">Reassign teams or reschedule. Year 11 (TBD next term) matches are listed here too.</p>
        <div className="mt-4 space-y-3">
          {upcomingMatches.map((match) => (
            <UpcomingMatchEditor key={match.id} match={match} teams={teams} onRefresh={onRefresh} />
          ))}
          {upcomingMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-secondary bg-primary px-4 py-8 text-center text-textMuted">No upcoming matches.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function CreateMatchForm({ matches, teams, onRefresh }: { matches: EnrichedMatch[]; teams: Team[]; onRefresh: () => Promise<unknown> }) {
  const [scheduledDay, setScheduledDay] = useState(1);
  const [round, setRound] = useState(1);
  const [isNextTerm, setIsNextTerm] = useState(false);
  const [isSkillStretch, setIsSkillStretch] = useState(false);
  const [slots, setSlots] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Any team already slotted into a match (any status). Used to split each year
  // section into "free" vs "already in a match" so it's obvious at a glance who
  // still needs a game — the fast path for building out the bracket.
  const placedIds = useMemo(() => {
    const set = new Set<string>();
    for (const match of matches) {
      for (const id of [match.team1_id, match.team2_id, match.team3_id, match.team4_id]) {
        if (id) set.add(id);
      }
    }
    return set;
  }, [matches]);

  // A senior match accepts any senior team plus any teacher team (teacher teams can
  // play in either bracket). Grouped by year for the dropdowns.
  const groupOrder = ['Year 12', 'Year 11', 'Teachers'];
  const grouped = new Map<string, Team[]>();
  for (const team of teams) {
    if (team.bracket !== 'senior' && !team.is_teacher) continue;
    const key = yearGroupOf(team);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(team);
  }
  const groups = [...grouped.entries()].sort(([a], [b]) => {
    const ia = groupOrder.indexOf(a);
    const ib = groupOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });

  const teamOption = (team: Team) => (
    <option key={team.id} value={team.id} className="text-slate-100">
      {displayTeamName(team.name)}
      {team.is_teacher ? ' · Teacher' : ''} - {team.skill_level}
    </option>
  );

  function setSlot(index: number, value: string) {
    setSlots((prev) => prev.map((current, i) => (i === index ? value : current)));
  }

  async function create() {
    setError(null);
    if (!slots[0] || !slots[1]) {
      setError('Pick at least the first two teams.');
      return;
    }
    const ids = slots.filter(Boolean);
    if (new Set(ids).size !== ids.length) {
      setError('A team can only appear once in a match.');
      return;
    }

    // Auto-assign a non-colliding match number. Next-term matches live in the 100+
    // band so they never clash with the current-term Year 12 fixtures.
    const base = isNextTerm ? 100 : 0;
    const matchNumber =
      matches
        .filter((match) => match.bracket === 'senior' && match.round === round && match.is_next_term === isNextTerm)
        .reduce((max, match) => Math.max(max, match.match_number), base) + 1;

    setBusy(true);
    try {
      await postAction({
        action: 'create-match',
        payload: {
          bracket: 'senior',
          round,
          match_number: matchNumber,
          scheduled_day: isNextTerm ? 6 : scheduledDay,
          team1_id: slots[0],
          team2_id: slots[1],
          team3_id: slots[2] || null,
          team4_id: slots[3] || null,
          status: 'upcoming',
          is_skill_stretch: isSkillStretch,
          is_next_term: isNextTerm
        }
      });
      setSlots(['', '', '', '']);
      setIsSkillStretch(false);
      await onRefresh();
    } catch {
      setError('Could not create the match. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-line bg-surface/80 p-5 shadow-card">
      <h2 className="font-display text-2xl uppercase tracking-wide text-bone">Create New Match</h2>
      <p className="mt-1 text-sm text-textMuted">Senior knockout match — pick any senior or teacher teams (4 max, top 2 advance). Teams 3 &amp; 4 are optional.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <label key={index} className="text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
            {`Team ${index + 1}${index < 2 ? ' (required)' : ' (optional)'}`}
            <select
              value={slots[index]}
              onChange={(event) => setSlot(index, event.target.value)}
              className="mt-1 block w-full rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100 outline-none focus:border-gold"
            >
              <option value="">—</option>
              {groups.map(([group, groupTeams]) => {
                const free = groupTeams.filter((team) => !placedIds.has(team.id));
                const placed = groupTeams.filter((team) => placedIds.has(team.id));
                return (
                  <Fragment key={group}>
                    {free.length > 0 ? (
                      <optgroup label={`${group} · Free (${free.length})`} className="bg-primary text-volt">
                        {free.map(teamOption)}
                      </optgroup>
                    ) : null}
                    {placed.length > 0 ? (
                      <optgroup label={`${group} · Already in a match`} className="bg-primary text-ash">
                        {placed.map(teamOption)}
                      </optgroup>
                    ) : null}
                  </Fragment>
                );
              })}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
          Round
          <input
            type="number"
            min={1}
            max={5}
            value={round}
            onChange={(event) => setRound(Math.max(1, Number(event.target.value)))}
            className="mt-1 block w-24 rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100"
          />
        </label>
        {!isNextTerm ? (
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
            Scheduled day
            <input
              type="number"
              min={1}
              value={scheduledDay}
              onChange={(event) => setScheduledDay(Math.max(1, Number(event.target.value)))}
              className="mt-1 block w-24 rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100"
            />
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
          <input type="checkbox" checked={isSkillStretch} onChange={(event) => setIsSkillStretch(event.target.checked)} className="h-4 w-4 accent-gold" />
          Skill stretch
        </label>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
          <input type="checkbox" checked={isNextTerm} onChange={(event) => setIsNextTerm(event.target.checked)} className="h-4 w-4 accent-gold" />
          TBD next term (Year 11)
        </label>
      </div>

      {error ? <p className="mt-3 text-sm font-bold text-flare">{error}</p> : null}

      <button
        type="button"
        onClick={create}
        disabled={busy}
        className="mt-4 rounded-2xl bg-volt px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-ink transition-all duration-200 hover:shadow-volt disabled:opacity-40"
      >
        Create Match
      </button>
    </section>
  );
}

function TeamManagementTab({
  teams,
  newTeam,
  setNewTeam,
  onRefresh,
  onReset,
  onClearScores
}: {
  teams: Team[];
  newTeam: {
    name: string;
    player1: string;
    player2: string;
    skill_level: number;
    bracket: BracketName;
    year_group: string;
    status: Team['status'];
    is_teacher: boolean;
  };
  setNewTeam: (value: any) => void;
  onRefresh: () => Promise<unknown>;
  onReset: () => Promise<void>;
  onClearScores: () => Promise<void>;
}) {
  // Group teams by year group (Teachers bucket last) so each cohort is easy to find.
  const groupOrder = ['Year 12', 'Year 11', 'Year 10', 'Year 9', 'Year 8', 'Year 7', 'Year 7-10', 'Teachers'];
  const grouped = new Map<string, Team[]>();
  for (const team of teams) {
    const key = yearGroupOf(team);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(team);
  }
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    const ia = groupOrder.indexOf(a);
    const ib = groupOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-line bg-surface/80 p-5 shadow-card">
        <h2 className="font-display text-2xl uppercase tracking-wide text-bone">Teams</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TeamCreateForm newTeam={newTeam} setNewTeam={setNewTeam} onRefresh={onRefresh} />
          <div className="rounded-2xl border border-secondary bg-primary p-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-gold">Quick notes</p>
            <p className="mt-2 text-sm text-textMuted">Teams are grouped by year. Teacher teams sit in their own group — they stay hidden from public pages and are never auto-queued, but you can slot them into any match from the Live or Match editors.</p>
          </div>
        </div>
        {sortedGroups.map(([group, groupTeams]) => (
          <TeamList key={group} title={`${group} (${groupTeams.length})`} teams={groupTeams} onRefresh={onRefresh} />
        ))}
      </section>

      <section className="rounded-[2rem] border border-flare/25 bg-flare/[0.04] p-5 shadow-card">
        <h2 className="font-display text-2xl uppercase tracking-wide text-flare">Danger Zone</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('Clear all match scores?')) {
                await onClearScores();
              }
            }}
            className="rounded-2xl border border-secondary bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-slate-100 transition-all duration-200 hover:scale-105"
          >
            Clear All Scores
          </button>
        </div>
      </section>
    </div>
  );
}

function TeamCreateForm({
  newTeam,
  setNewTeam,
  onRefresh
}: {
  newTeam: {
    name: string;
    player1: string;
    player2: string;
    skill_level: number;
    bracket: BracketName;
    year_group: string;
    status: Team['status'];
    is_teacher: boolean;
  };
  setNewTeam: (value: any) => void;
  onRefresh: () => Promise<unknown>;
}) {
  async function save() {
    await postAction({ action: 'create-team', payload: newTeam });
    setNewTeam({ name: '', player1: '', player2: '', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active', is_teacher: false });
    await onRefresh();
  }

  return (
    <div className="rounded-2xl border border-secondary bg-primary p-4">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-gold">Add New Team</p>
      <div className="mt-3 grid gap-3">
        {[
          ['name', 'Team name'],
          ['player1', 'Player 1'],
          ['player2', 'Player 2'],
          ['year_group', 'Year group']
        ].map(([field, label]) => (
          <input
            key={field}
            value={(newTeam as any)[field]}
            onChange={(event) => setNewTeam((current: any) => ({ ...current, [field]: event.target.value }))}
            placeholder={label}
            className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100 outline-none"
          />
        ))}
        <div className="grid grid-cols-2 gap-2">
          <select value={newTeam.skill_level} onChange={(event) => setNewTeam((current: any) => ({ ...current, skill_level: Number(event.target.value) }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100">
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                Skill {value}
              </option>
            ))}
          </select>
          <select value={newTeam.bracket} onChange={(event) => setNewTeam((current: any) => ({ ...current, bracket: event.target.value as BracketName }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100">
            <option value="senior">Senior</option>
            <option value="junior">Junior</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
          <input
            type="checkbox"
            checked={newTeam.is_teacher}
            onChange={(event) => setNewTeam((current: any) => ({ ...current, is_teacher: event.target.checked }))}
            className="h-4 w-4 accent-gold"
          />
          Teacher team (hidden from public, slot-able into any match)
        </label>
      </div>
      <button type="button" onClick={save} className="mt-3 rounded-2xl bg-gold px-4 py-3 text-sm font-black uppercase tracking-[0.22em] text-primary transition-all duration-200 hover:scale-105">
        Create Team
      </button>
    </div>
  );
}

function TeamList({ title, teams, onRefresh }: { title: string; teams: Team[]; onRefresh: () => Promise<unknown> }) {
  return (
    <div className="mt-5">
      <h3 className="text-lg font-black uppercase tracking-[0.22em] text-gold">{title}</h3>
      <div className="mt-3 space-y-3">
        {teams.map((team) => (
          <TeamRowEditor key={team.id} team={team} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}

function TeamRowEditor({ team, onRefresh }: { team: Team; onRefresh: () => Promise<unknown> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(team);

  async function save() {
    await postAction({
      action: 'update-team',
      teamId: team.id,
      payload: {
        name: draft.name,
        player1: draft.player1,
        player2: draft.player2,
        skill_level: draft.skill_level,
        status: draft.status,
        is_teacher: draft.is_teacher
      }
    });
    setEditing(false);
    await onRefresh();
  }

  async function remove() {
    if (window.confirm(`Delete ${team.name}?`)) {
      await postAction({ action: 'delete-team', teamId: team.id });
      await onRefresh();
    }
  }

  return (
    <div className="rounded-2xl border border-secondary bg-primary p-4 transition-all duration-300 hover:border-gold/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black text-slate-100">
            {displayTeamName(team.name)}
            {team.is_teacher ? <span className="ml-2 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-gold">Teacher</span> : null}
          </p>
          <p className="text-xs text-textMuted">
            {team.player1} · {team.player2} · Skill {team.skill_level} · {team.bracket} · {team.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-full border border-secondary bg-primary px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-100 transition-all duration-200 hover:scale-105">
            Edit
          </button>
          <button type="button" onClick={remove} className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-red-200 transition-all duration-200 hover:scale-105">
            Delete
          </button>
        </div>
      </div>
      {editing ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100 uppercase" />
          <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as Team['status'] }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100">
            <option value="active">active</option>
            <option value="eliminated">eliminated</option>
            <option value="bye">bye</option>
          </select>
          <input value={draft.player1} onChange={(event) => setDraft((current) => ({ ...current, player1: event.target.value }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100" />
          <input value={draft.player2} onChange={(event) => setDraft((current) => ({ ...current, player2: event.target.value }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100" />
          <select value={draft.skill_level} onChange={(event) => setDraft((current) => ({ ...current, skill_level: Number(event.target.value) }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100">
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                Skill {value}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
            <input
              type="checkbox"
              checked={draft.is_teacher}
              onChange={(event) => setDraft((current) => ({ ...current, is_teacher: event.target.checked }))}
              className="h-4 w-4 accent-gold"
            />
            Teacher team
          </label>
          <button type="button" onClick={save} className="rounded-xl bg-gold px-4 py-3 text-sm font-black uppercase tracking-[0.22em] text-primary transition-all duration-200 hover:scale-105">
            Save
          </button>
        </div>
      ) : null}
    </div>
  );
}

function UpcomingMatchEditor({ match, teams, onRefresh }: { match: EnrichedMatch; teams: Team[]; onRefresh: () => Promise<unknown> }) {
  const [draft, setDraft] = useState({
    scheduled_day: match.scheduled_day,
    team1_id: match.team1_id,
    team2_id: match.team2_id,
    team3_id: match.team3_id || '',
    team4_id: match.team4_id || ''
  });

  async function save() {
    await postAction({
      action: 'update-match',
      matchId: match.id,
      payload: {
        scheduled_day: draft.scheduled_day,
        team1_id: draft.team1_id,
        team2_id: draft.team2_id,
        team3_id: draft.team3_id || null,
        team4_id: draft.team4_id || null
      }
    });
    await onRefresh();
  }

  return (
    <div className="rounded-2xl border border-secondary bg-primary p-4 transition-all duration-300 hover:border-gold/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-gold">
            {matchLabel(match)}
          </p>
          <p className="mt-2 text-sm font-black text-slate-100">{matchTeamsLabel(match)}</p>
        </div>
        <button type="button" onClick={save} className="rounded-full border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-gold transition-all duration-200 hover:scale-105">
          Save
        </button>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-5">
        <input type="number" value={draft.scheduled_day} onChange={(event) => setDraft((current) => ({ ...current, scheduled_day: Number(event.target.value) }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100" />
        {(['team1_id', 'team2_id', 'team3_id', 'team4_id'] as const).map((field) => (
          <select key={field} value={draft[field]} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} className="rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100">
            <option value="">{field.toUpperCase()}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {displayTeamName(team.name)} - {team.skill_level}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}
