'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { TournamentData } from '@/types/tournament';

type TournamentContextValue = {
  data: TournamentData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<TournamentData>;
  bootstrap: () => Promise<void>;
};

const TournamentContext = createContext<TournamentContextValue | null>(null);

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

  const refresh = useCallback(async () => {
    const next = await fetchTournamentData();
    setData(next);
    setLoading(false);
    setError(null);
    return next;
  }, []);

  const bootstrap = useCallback(async () => {
    const response = await fetch('/api/bootstrap', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Unable to seed tournament data.');
    }
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const initial = await refresh();
        if (!active) {
          return;
        }

        if (initial.teams.length === 0 || initial.matches.length === 0) {
          await bootstrap();
          if (!active) {
            return;
          }
          await refresh();
        }
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setLoading(false);
      }
    };

    init();

    const client = getSupabaseBrowserClient();
    const channel = client
      ? client
          .channel('inner-sydney-matches')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
            refresh().catch((err) => setError(err instanceof Error ? err.message : 'Something went wrong.'));
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
            refresh().catch((err) => setError(err instanceof Error ? err.message : 'Something went wrong.'));
          })
          .subscribe()
      : null;

    return () => {
      active = false;
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, [bootstrap, refresh]);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
      bootstrap
    }),
    [data, loading, error, refresh, bootstrap]
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
