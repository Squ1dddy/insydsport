// Per-device "followed teams" — no accounts, so a viewer's picks live in this
// browser's localStorage (same pattern as dismissed notifications / the score
// journal). A tiny external store backs a useSyncExternalStore hook so every star
// across the UI stays in sync the instant one is toggled, and persists reloads.

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'inner-sydney-followed-teams';
const DEVICE_KEY = 'inner-sydney-device-id';

// Stable per-device id so the server can dedupe stars to one-per-device-per-team
// (the count can't be inflated by replaying the endpoint). Generated once and
// kept in localStorage; it's an anonymous random id, not tied to any identity.
function deviceId(): string {
  let id = '';
  try {
    id = window.localStorage.getItem(DEVICE_KEY) || '';
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(DEVICE_KEY, id);
    }
  } catch {
    // localStorage unavailable — fall back to an ephemeral id (count just won't
    // persist dedupe across reloads on this device).
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
  return id;
}

const listeners = new Set<() => void>();
let cache: Set<string> | null = null;
// Stable empty snapshot for SSR / first hydration (must be referentially stable).
const EMPTY: ReadonlySet<string> = new Set();

function read(): Set<string> {
  if (typeof window === 'undefined') return EMPTY as Set<string>;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

function persist(next: Set<string>) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // localStorage unavailable (private mode / quota) — follows won't persist; acceptable.
  }
  listeners.forEach((listener) => listener());
}

export function getFollowed(): string[] {
  return [...read()];
}

export function isFollowed(id: string): boolean {
  return read().has(id);
}

/** Toggles follow state for a team. Returns the new state (true = now followed). */
export function toggleFollow(id: string): boolean {
  const next = new Set(read());
  const nowFollowed = !next.has(id);
  if (nowFollowed) {
    next.add(id);
  } else {
    next.delete(id);
  }
  persist(next);

  // Bump the team's global crowd-favourite count. Fire-and-forget: the local
  // follow state is the source of truth for THIS device, so a failed network
  // call must never block the toggle. The localStorage set guards against
  // double-counting (re-following an already-followed team can't happen here).
  if (typeof fetch !== 'undefined') {
    fetch('/api/stars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: id, deviceId: deviceId(), follow: nowFollowed })
    }).catch(() => {
      // Offline / server error — the public count just won't reflect this toggle.
    });
  }

  return nowFollowed;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Live, synced view of the followed-team ids for this device. */
export function useFollowedTeams() {
  const followed = useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY as Set<string>
  );
  return {
    followed,
    isFollowed: (id: string) => followed.has(id),
    toggle: toggleFollow
  };
}
