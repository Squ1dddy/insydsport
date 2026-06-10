'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { TournamentData } from '@/types/tournament';

export type RealtimeStatus = 'live' | 'connecting' | 'offline';

type TournamentContextValue = {
  data: TournamentData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<TournamentData>;
  realtimeStatus: RealtimeStatus;
};

const TournamentContext = createContext<TournamentContextValue | null>(null);

const POLL_INTERVAL_MS = 20000;

async function fetchTournamentData(): Promise<TournamentData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch('/api/state', {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to load tournament data.');
    }
    return (await response.json()) as TournamentData;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Tournament data request timed out. Please check your connection.');
    }
    throw err;
  }
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const statusRef = useRef<RealtimeStatus>('connecting');

  const setStatus = useCallback((next: RealtimeStatus) => {
    statusRef.current = next;
    setRealtimeStatus(next);
  }, []);

  const refresh = useCallback(async () => {
    const next = await fetchTournamentData();
    setData(next);
    setLoading(false);
    setError(null);
    return next;
  }, []);

  useEffect(() => {
    let active = true;

    refresh().catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    });

    const client = getSupabaseBrowserClient();

    // No realtime client (env not configured) — fall back to polling so the
    // scoreboard never silently freezes.
    if (!client) {
      setStatus('offline');
      const pollId = setInterval(() => {
        refresh().catch(() => {});
      }, POLL_INTERVAL_MS);
      return () => {
        active = false;
        clearInterval(pollId);
      };
    }

    const channel = client
      .channel('inner-sydney-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        refresh().catch((err) => setError(err instanceof Error ? err.message : 'Something went wrong.'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        refresh().catch((err) => setError(err instanceof Error ? err.message : 'Something went wrong.'));
      })
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setStatus('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setStatus('offline');
        } else {
          setStatus('connecting');
        }
      });

    // Safety-net poll: whenever realtime isn't confirmed live, pull fresh data so
    // a dropped socket can't leave viewers staring at stale scores.
    const pollId = setInterval(() => {
      if (statusRef.current !== 'live') {
        refresh().catch(() => {});
      }
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(pollId);
      client.removeChannel(channel);
    };
  }, [refresh, setStatus]);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
      realtimeStatus
    }),
    [data, loading, error, refresh, realtimeStatus]
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used inside TournamentProvider.');
  }
  return context;
}
