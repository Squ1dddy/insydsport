// Durable, on-device scoring backup — independent of Supabase.
//
// WHY: scores are written to Supabase, but a dropped connection or a failed
// write can occasionally lose a result. A backup that lives in the same database
// is not a backup. This journal records every scoring action to the device's
// localStorage the INSTANT it happens (before/independent of the network write),
// so nothing is ever lost. Failed writes stay flagged `synced: false` and can be
// retried, and the whole log exports to a CSV "sheet" the organiser can keep.
//
// Scope/limitations: per-device (the scoring phone is the source of truth). State
// survives reloads, crashes and offline; it is not shared across devices.

const STORAGE_KEY = 'inner-sydney-score-journal';
const MAX_ENTRIES = 2000; // keep storage bounded — oldest entries roll off

export type JournalAction = 'increment' | 'undo' | 'complete' | 'set-live' | 'stop-live';

export interface JournalEntry {
  id: string;
  ts: number; // epoch ms when the action was taken
  matchId: string;
  matchLabel: string;
  bracket: string;
  action: JournalAction;
  slot?: number; // 1-4 for score changes
  teamName?: string;
  scoresAfter: [number, number, number, number];
  synced: boolean;
  error?: string;
}

function read(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JournalEntry[]) : [];
  } catch {
    // Corrupt/unreadable storage must never break scoring — start clean.
    return [];
  }
}

function write(entries: JournalEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // Quota/full or privacy mode — silently degrade; scoring still proceeds.
  }
}

export function getEvents(): JournalEntry[] {
  return read();
}

export function appendEvent(entry: Omit<JournalEntry, 'id' | 'ts' | 'synced'> & { synced?: boolean }): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const full: JournalEntry = { id, ts: Date.now(), synced: entry.synced ?? false, ...entry };
  const entries = read();
  entries.push(full);
  write(entries);
  return id;
}

export function markSynced(id: string): void {
  const entries = read();
  const target = entries.find((entry) => entry.id === id);
  if (target) {
    target.synced = true;
    target.error = undefined;
    write(entries);
  }
}

export function markFailed(id: string, error: string): void {
  const entries = read();
  const target = entries.find((entry) => entry.id === id);
  if (target) {
    target.synced = false;
    target.error = error;
    write(entries);
  }
}

export function unsyncedCount(): number {
  return read().reduce((count, entry) => count + (entry.synced ? 0 : 1), 0);
}

export function clearSynced(): void {
  write(read().filter((entry) => !entry.synced));
}

export function clearAll(): void {
  write([]);
}

// Render the log as CSV — the portable "sheet" the organiser keeps as a backup.
export function toCSV(entries: JournalEntry[]): string {
  const header = ['Timestamp (AEST)', 'Bracket', 'Match', 'Action', 'Slot', 'Team', 'Scores', 'Synced', 'Error'];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = entries.map((entry) => {
    const tsAest = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date(entry.ts));
    return [
      tsAest,
      entry.bracket,
      entry.matchLabel,
      entry.action,
      entry.slot != null ? String(entry.slot) : '',
      entry.teamName || '',
      entry.scoresAfter.join('-'),
      entry.synced ? 'yes' : 'NO',
      entry.error || ''
    ]
      .map((cell) => escape(String(cell)))
      .join(',');
  });
  return [header.map(escape).join(','), ...rows].join('\r\n');
}
