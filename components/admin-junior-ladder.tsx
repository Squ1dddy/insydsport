'use client';

import { useState } from 'react';
import type { Team } from '@/types/tournament';
import { displayTeamName, getJuniorStandings } from '@/lib/tournament-utils';

type ActionBody =
  | { action: 'adjust-standings'; teamId: string; pointsDelta: number; gamesDelta: number }
  | { action: 'update-team'; teamId: string; payload: { points: number; games_played: number } };

export function AdminJuniorLadder({
  teams,
  onAction,
  onRefresh
}: {
  teams: Team[];
  onAction: (body: ActionBody) => Promise<void>;
  onRefresh: () => Promise<unknown>;
}) {
  const standings = getJuniorStandings(teams);

  return (
    <section className="rounded-[2rem] border border-line bg-surface/80 p-5 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-volt">Round Robin</p>
          <h2 className="font-display text-2xl uppercase tracking-wide text-bone">Junior Ladder</h2>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
          Enter a game&apos;s points then tap + Game · Edit to correct totals
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {standings.map(({ rank, team }) => (
          <LadderRow key={team.id} rank={rank} team={team} onAction={onAction} onRefresh={onRefresh} />
        ))}
        {standings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-secondary bg-primary px-4 py-8 text-center text-textMuted">
            No junior teams yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LadderRow({
  rank,
  team,
  onAction,
  onRefresh
}: {
  rank: number;
  team: Team;
  onAction: (body: ActionBody) => Promise<void>;
  onRefresh: () => Promise<unknown>;
}) {
  const [gamePoints, setGamePoints] = useState('');
  const [editing, setEditing] = useState(false);
  const [draftPoints, setDraftPoints] = useState(team.points);
  const [draftGames, setDraftGames] = useState(team.games_played);
  const [busy, setBusy] = useState(false);

  async function addGame() {
    const pts = Number(gamePoints);
    if (!Number.isFinite(pts)) return;
    setBusy(true);
    try {
      await onAction({ action: 'adjust-standings', teamId: team.id, pointsDelta: pts, gamesDelta: 1 });
      setGamePoints('');
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveTotals() {
    setBusy(true);
    try {
      await onAction({
        action: 'update-team',
        teamId: team.id,
        payload: { points: Math.max(0, Math.trunc(draftPoints)), games_played: Math.max(0, Math.trunc(draftGames)) }
      });
      setEditing(false);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-secondary bg-primary p-4 transition-all duration-300 hover:border-gold/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-display text-2xl leading-none text-gold/70">{rank}</span>
          <div className="min-w-0">
            <p className="truncate font-black text-slate-100">{displayTeamName(team.name)}</p>
            <p className="truncate text-xs text-textMuted">
              {team.player1}
              {team.player2 ? ` · ${team.player2}` : ''} · {team.year_group}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.18em] text-textMuted">
          <span>
            GP <span className="text-slate-100">{team.games_played}</span>
          </span>
          <span>
            Pts <span className="font-display text-xl text-gold">{team.points}</span>
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={gamePoints}
          onChange={(event) => setGamePoints(event.target.value)}
          placeholder="Points this game"
          className="w-40 rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100 outline-none focus:border-gold"
        />
        <button
          type="button"
          onClick={addGame}
          disabled={busy || gamePoints === ''}
          className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200 transition-all duration-200 hover:scale-105 disabled:opacity-40"
        >
          + Game
        </button>
        <button
          type="button"
          onClick={() => {
            setDraftPoints(team.points);
            setDraftGames(team.games_played);
            setEditing((value) => !value);
          }}
          className="rounded-xl border border-secondary bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-100 transition-all duration-200 hover:scale-105"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-secondary pt-3">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
            Points
            <input
              type="number"
              value={draftPoints}
              onChange={(event) => setDraftPoints(Number(event.target.value))}
              className="mt-1 block w-28 rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
            Games
            <input
              type="number"
              value={draftGames}
              onChange={(event) => setDraftGames(Number(event.target.value))}
              className="mt-1 block w-28 rounded-xl border border-secondary bg-primary px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <button
            type="button"
            onClick={saveTotals}
            disabled={busy}
            className="rounded-xl bg-gold px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-primary transition-all duration-200 hover:scale-105 disabled:opacity-40"
          >
            Save Totals
          </button>
        </div>
      ) : null}
    </div>
  );
}
