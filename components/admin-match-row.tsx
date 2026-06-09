'use client';

import { useMemo, useState } from 'react';
import type { EnrichedMatch, Team } from '@/types/tournament';
import { ScoreButton } from '@/components/score-button';
import { displayTeamName, formatAestDateTime, roundLabel } from '@/lib/tournament-utils';

async function postAdminAction(body: unknown) {
  const response = await fetch('/api/admin/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('Admin action failed.');
  }
}

export function AdminMatchRow({
  match,
  teams,
  onRefresh
}: {
  match: EnrichedMatch;
  teams: Team[];
  onRefresh: () => Promise<unknown>;
}) {
  const [saving, setSaving] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const linkedTeams = useMemo(() => [match.team1, match.team2, match.team3, match.team4].filter(Boolean) as Team[], [match]);

  async function run(action: unknown) {
    setSaving(true);
    try {
      await postAdminAction(action);
      await onRefresh();
      setSelectedWinners([]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-[#142033] p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-textMuted">{roundLabel(match.bracket, match.round)}</p>
          <h3 className="mt-1 text-lg font-black text-white">
            Day {match.scheduled_day} — Match {match.match_number}
          </h3>
          <p className="text-xs text-textMuted">{formatAestDateTime(match.played_at)}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] ${
            match.status === 'live' ? 'border-red-500/40 bg-red-500/10 text-red-300' : match.status === 'completed' ? 'border-win/40 bg-win/10 text-win' : 'border-white/10 bg-white/5 text-textMuted'
          }`}
        >
          {match.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ScoreButton label={`+1 ${displayTeamName(match.team1?.name || 'Team 1')}`} onConfirm={() => run({ action: 'increment', matchId: match.id, slot: 1 })} />
        <ScoreButton label={`+1 ${displayTeamName(match.team2?.name || 'Team 2')}`} onConfirm={() => run({ action: 'increment', matchId: match.id, slot: 2 })} />
        {match.team3_id ? <ScoreButton label={`+1 ${displayTeamName(match.team3?.name || 'Team 3')}`} onConfirm={() => run({ action: 'increment', matchId: match.id, slot: 3 })} /> : null}
        {match.team4_id ? <ScoreButton label={`+1 ${displayTeamName(match.team4?.name || 'Team 4')}`} onConfirm={() => run({ action: 'increment', matchId: match.id, slot: 4 })} /> : null}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <button type="button" onClick={() => run({ action: 'set-live', matchId: match.id })} className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-extrabold text-red-300">
          Set Live
        </button>
        <button type="button" onClick={() => run({ action: 'complete', matchId: match.id })} className="rounded-2xl border border-win/40 bg-win/10 px-4 py-3 text-sm font-extrabold text-win">
          Complete Match
        </button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((slot) =>
          match[`team${slot}_id` as keyof EnrichedMatch] ? (
            <button
              key={slot}
              type="button"
              onClick={() => run({ action: 'undo', matchId: match.id, slot: slot as 1 | 2 | 3 | 4 })}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white"
            >
              Undo Team {slot} Point
            </button>
          ) : null
        )}
      </div>

      <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.28em] text-win">Edit Teams</summary>
        <div className="mt-4 space-y-4">
          {linkedTeams.map((team) => (
            <TeamEditor key={team.id} team={team} teams={teams} onSave={onRefresh} />
          ))}
        </div>
      </details>

      <details className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.28em] text-win">Manual Advance</summary>
        <div className="mt-4 flex flex-wrap gap-2">
          {linkedTeams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedWinners((current) => (current.includes(team.id) ? current.filter((id) => id !== team.id) : [...current, team.id]))}
              className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.22em] ${
                selectedWinners.includes(team.id) ? 'border-win/40 bg-win/15 text-win' : 'border-white/10 bg-white/5 text-white'
              }`}
            >
              {displayTeamName(team.name)}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={saving || selectedWinners.length === 0}
          onClick={() => run({ action: 'manual-advance', matchId: match.id, winnerIds: selectedWinners })}
          className="mt-4 rounded-2xl border border-win/40 bg-win/10 px-4 py-3 text-sm font-extrabold text-win disabled:opacity-40"
        >
          Advance Selected
        </button>
      </details>
    </article>
  );
}

function TeamEditor({ team, onSave }: { team: Team; teams: Team[]; onSave: () => Promise<unknown> }) {
  const [name, setName] = useState(team.name);
  const [player1, setPlayer1] = useState(team.player1);
  const [player2, setPlayer2] = useState(team.player2);
  const [skillLevel, setSkillLevel] = useState(team.skill_level);
  const [status, setStatus] = useState(team.status);

  async function save() {
    await postAdminAction({
      action: 'update-team',
      teamId: team.id,
      payload: { name, player1, player2, skill_level: Number(skillLevel), status }
    });
    await onSave();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="grid gap-2 md:grid-cols-2">
        <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-xl border border-white/10 bg-[#0f1c2e] px-3 py-2 text-sm text-white uppercase outline-none" />
        <select value={status} onChange={(event) => setStatus(event.target.value as Team['status'])} className="rounded-xl border border-white/10 bg-[#0f1c2e] px-3 py-2 text-sm text-white outline-none">
          <option value="active">active</option>
          <option value="eliminated">eliminated</option>
          <option value="bye">bye</option>
        </select>
        <input value={player1} onChange={(event) => setPlayer1(event.target.value)} className="rounded-xl border border-white/10 bg-[#0f1c2e] px-3 py-2 text-sm text-white outline-none" />
        <input value={player2} onChange={(event) => setPlayer2(event.target.value)} className="rounded-xl border border-white/10 bg-[#0f1c2e] px-3 py-2 text-sm text-white outline-none" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <select value={skillLevel} onChange={(event) => setSkillLevel(Number(event.target.value))} className="rounded-xl border border-white/10 bg-[#0f1c2e] px-3 py-2 text-sm text-white outline-none">
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              Skill {value}
            </option>
          ))}
        </select>
        <button type="button" onClick={save} className="rounded-xl border border-win/40 bg-win/10 px-4 py-2 text-sm font-black text-win">
          Save
        </button>
      </div>
    </div>
  );
}
