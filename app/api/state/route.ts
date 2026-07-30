import { NextResponse } from 'next/server';
import { getSupabaseServerReadOnlyClient } from '@/lib/supabase';
import { displayPlayerName } from '@/lib/tournament-utils';
import type { AppSettings, EnrichedMatch, Match, Notification, SeniorSeries, Team, TournamentData } from '@/types/tournament';

export async function GET() {
  try {
    const supabase = getSupabaseServerReadOnlyClient();
    const [
      { data: teams, error: teamsError },
      { data: matches, error: matchesError }
    ] = await Promise.all([
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase.from('matches').select('*').order('scheduled_day', { ascending: true }).order('round', { ascending: true }).order('match_number', { ascending: true })
    ]);

    // app_settings is a single-row table added after launch — fetch it separately
    // so a missing table (before the SQL migration is run) never breaks the read path.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let settingsRow: Record<string, any> | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('app_settings')
        .select('current_day_override')
        .eq('id', 1)
        .maybeSingle();
      settingsRow = result.data ?? null;
    } catch {
      // Table not yet created — fall back to auto (null override).
    }

    // notifications is also a post-launch table — fetch it defensively so a
    // missing table (before the SQL migration) never breaks the read path.
    // We return ALL rows (active and inactive): the public banner filters to
    // `active` itself (notification-banner.tsx), while the admin panel needs the
    // inactive ones so it can re-activate a hidden notice.
    let notificationRows: Notification[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      notificationRows = (result.data ?? []) as Notification[];
    } catch {
      // Table not yet created — no announcements.
    }

    if (teamsError) {
      console.error('Supabase teams error:', teamsError);
      return NextResponse.json({ error: teamsError.message }, { status: 500 });
    }

    if (matchesError) {
      console.error('Supabase matches error:', matchesError);
      return NextResponse.json({ error: matchesError.message }, { status: 500 });
    }

    // Privacy: reduce player surnames to an initial BEFORE anything leaves the
    // server. This is the single read path for every client (public site and the
    // admin panel), so full surnames are never sent over the wire, rendered into
    // the DOM, or visible in the network tab / inspect element. Full names stay in
    // the DB (server-only) as the organiser's source of truth.
    const teamRows = ((teams || []) as Team[]).map((team) => ({
      ...team,
      player1: displayPlayerName(team.player1),
      player2: displayPlayerName(team.player2)
    }));
    const matchRows = (matches || []) as Match[];
    const teamMap = new Map(teamRows.map((team) => [team.id, team]));

    // `series` is the authoritative senior-series column (supabase/match-series.sql).
    // It is filled in here when absent so the app is identical before and after that
    // migration is run: `is_next_term` still identifies Year 11, and a match whose
    // every team is a staff team is the teacher series. Juniors are always 'year12'
    // by default and simply never consult it.
    const deriveSeries = (match: Match): SeniorSeries => {
      if (match.series) return match.series;
      if (match.is_next_term) return 'year11';
      const slots = [match.team1_id, match.team2_id, match.team3_id, match.team4_id].filter(Boolean) as string[];
      const allTeacher = slots.length > 0 && slots.every((id) => teamMap.get(id)?.is_teacher);
      return match.bracket === 'senior' && allTeacher ? 'teacher' : 'year12';
    };

    const enrichedMatches: EnrichedMatch[] = matchRows.map((match) => ({
      ...match,
      series: deriveSeries(match),
      team1: match.team1_id ? teamMap.get(match.team1_id) || null : null,
      team2: match.team2_id ? teamMap.get(match.team2_id) || null : null,
      team3: match.team3_id ? teamMap.get(match.team3_id) || null : null,
      team4: match.team4_id ? teamMap.get(match.team4_id) || null : null,
      winner1: match.winner1_id ? teamMap.get(match.winner1_id) || null : null,
      winner2: match.winner2_id ? teamMap.get(match.winner2_id) || null : null
    }));

    const settings: AppSettings = {
      currentDayOverride: settingsRow?.current_day_override ?? null
    };

    const data: TournamentData = { teams: teamRows, matches: enrichedMatches, settings, notifications: notificationRows };
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected state API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
