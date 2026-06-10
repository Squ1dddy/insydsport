'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTournament } from '@/components/tournament-provider';
import type { BracketName, EnrichedMatch, Team } from '@/types/tournament';
import {
  displayTeamName,
  formatAestDateTime,
  getMatchPlacements,
  matchLabel,
  matchTeamsLabel,
  roundLabel
} from '@/lib/tournament-utils';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'inner-sydney-admin-auth-password';
type TabKey = 'live' | 'past' | 'teams';
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
    status: 'active' as Team['status']
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
  const upcomingMatches = useMemo(() => matches.filter((match) => match.status === 'upcoming').sort((a, b) => a.scheduled_day - b.scheduled_day || a.match_number - b.match_number), [matches]);
  const completedMatches = useMemo(() => matches.filter((match) => match.status === 'completed').sort((a, b) => Number(new Date(b.played_at || 0)) - Number(new Date(a.played_at || 0))), [matches]);
  const selectedLiveMatch = upcomingMatches.find((match) => match.id === selectedLiveMatchId) || upcomingMatches[0] || null;

  useEffect(() => {
    if (!selectedLiveMatchId && upcomingMatches[0]) {
      setSelectedLiveMatchId(upcomingMatches[0].id);
    }
    if (selectedLiveMatchId && !upcomingMatches.find((match) => match.id === selectedLiveMatchId)) {
      setSelectedLiveMatchId(upcomingMatches[0]?.id || '');
    }
  }, [upcomingMatches, selectedLiveMatchId]);

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
          matches={upcomingMatches}
          selectedMatch={selectedLiveMatch}
          selectedLiveMatchId={selectedLiveMatchId}
          setSelectedLiveMatchId={setSelectedLiveMatchId}
          selectedWinners={selectedWinners}
          setSelectedWinners={setSelectedWinners}
          onRefresh={refresh}
        />
      ) : null}

      {tab === 'past' ? <PastGamesTab matches={completedMatches} expandedMatchIds={expandedMatchIds} setExpandedMatchIds={setExpandedMatchIds} onRefresh={refresh} /> : null}

      {tab === 'teams' ? (
        <TeamManagementTab
          teams={teams}
          matches={matches}
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
  matches,
  selectedMatch,
  selectedLiveMatchId,
  setSelectedLiveMatchId,
  selectedWinners,
  setSelectedWinners,
  onRefresh
}: {
  matches: EnrichedMatch[];
  selectedMatch: EnrichedMatch | null;
  selectedLiveMatchId: string;
  setSelectedLiveMatchId: (id: string) => void;
  selectedWinners: string[];
  setSelectedWinners: (value: string[]) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const [liveScores, setLiveScores] = useState<number[]>([0, 0, 0, 0]);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // Re-sync local scores only when the selected match changes. This keeps the
  // scoring device authoritative for the match in play, so optimistic taps aren't
  // overwritten by the realtime refresh echoing our own writes back.
  useEffect(() => {
    if (selectedMatch) {
      setLiveScores([selectedMatch.team1_score, selectedMatch.team2_score, selectedMatch.team3_score, selectedMatch.team4_score]);
      setScoreError(null);
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

  async function adjustScore(slot: 1 | 2 | 3 | 4, delta: 1 | -1) {
    if (!selectedMatch) return;
    const idx = slot - 1;
    const snapshot = [...liveScores];
    setScoreError(null);
    // Update the UI instantly, then persist. Courtside on flaky wifi this makes
    // taps feel immediate instead of waiting on a round-trip.
    setLiveScores((prev) => prev.map((value, i) => (i === idx ? Math.max(0, value + delta) : value)));
    try {
      await postAction({ action: delta === 1 ? 'increment' : 'undo', matchId: selectedMatch.id, slot });
    } catch {
      setLiveScores(snapshot);
      setScoreError('Score update failed — reverted. Check your connection and try again.');
    }
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

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-secondary bg-primary p-4 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[280px] space-y-2 text-sm font-bold text-textMuted">
            <span className="block uppercase tracking-[0.28em]">Select upcoming match</span>
            <select
              value={selectedLiveMatchId}
              onChange={(event) => {
                setSelectedLiveMatchId(event.target.value);
                setSelectedWinners([]);
              }}
              className="w-full rounded-2xl border border-secondary bg-primary px-4 py-3 text-slate-100 outline-none focus:border-gold"
            >
              <optgroup label="Seniors" className="bg-primary text-gold">
                {matches
                  .filter((m) => m.bracket === 'senior')
                  .map((match) => (
                    <option key={match.id} value={match.id} className="text-slate-100">
                      {matchLabel(match)} — {matchTeamsLabel(match)}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Juniors" className="bg-primary text-gold">
                {matches
                  .filter((m) => m.bracket === 'junior')
                  .map((match) => (
                    <option key={match.id} value={match.id} className="text-slate-100">
                      {matchLabel(match)} — {matchTeamsLabel(match)}
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>
          <button
            type="button"
            onClick={setLive}
            disabled={!selectedMatch}
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-red-200 transition-all duration-200 hover:scale-105 disabled:opacity-40"
          >
            Set Live
          </button>
        </div>
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
        <div className="rounded-3xl border border-dashed border-secondary bg-primary px-4 py-10 text-center text-textMuted">No upcoming matches available.</div>
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

function TeamManagementTab({
  teams,
  matches,
  newTeam,
  setNewTeam,
  onRefresh,
  onReset,
  onClearScores
}: {
  teams: Team[];
  matches: EnrichedMatch[];
  newTeam: {
    name: string;
    player1: string;
    player2: string;
    skill_level: number;
    bracket: BracketName;
    year_group: string;
    status: Team['status'];
  };
  setNewTeam: (value: any) => void;
  onRefresh: () => Promise<unknown>;
  onReset: () => Promise<void>;
  onClearScores: () => Promise<void>;
}) {
  const upcomingMatches = matches.filter((match) => match.status === 'upcoming').sort((a, b) => a.scheduled_day - b.scheduled_day || a.match_number - b.match_number);
  const seniors = teams.filter((team) => team.bracket === 'senior');
  const juniors = teams.filter((team) => team.bracket === 'junior');

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-line bg-surface/80 p-5 shadow-card">
        <h2 className="font-display text-2xl uppercase tracking-wide text-bone">Teams</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TeamCreateForm newTeam={newTeam} setNewTeam={setNewTeam} onRefresh={onRefresh} />
          <div className="rounded-2xl border border-secondary bg-primary p-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-gold">Quick notes</p>
            <p className="mt-2 text-sm text-textMuted">Edit, add, or delete teams from the lists below. Team names render uppercase throughout the site.</p>
          </div>
        </div>
        <TeamList title="Seniors" teams={seniors} onRefresh={onRefresh} />
        <TeamList title="Juniors" teams={juniors} onRefresh={onRefresh} />
      </section>

      <section className="rounded-[2rem] border border-line bg-surface/80 p-5 shadow-card">
        <h2 className="font-display text-2xl uppercase tracking-wide text-bone">Upcoming Matches</h2>
        <div className="mt-4 space-y-3">
          {upcomingMatches.map((match) => (
            <UpcomingMatchEditor key={match.id} match={match} teams={teams} onRefresh={onRefresh} />
          ))}
          {upcomingMatches.length === 0 ? <div className="rounded-2xl border border-dashed border-secondary bg-primary px-4 py-8 text-center text-textMuted">No upcoming matches.</div> : null}
        </div>
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
  };
  setNewTeam: (value: any) => void;
  onRefresh: () => Promise<unknown>;
}) {
  async function save() {
    await postAction({ action: 'create-team', payload: newTeam });
    setNewTeam({ name: '', player1: '', player2: '', skill_level: 5, bracket: 'senior', year_group: 'Year 12, Week 1', status: 'active' });
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
        status: draft.status
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
          <p className="font-black text-slate-100">{displayTeamName(team.name)}</p>
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
          <div />
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
                {displayTeamName(team.name)}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}
