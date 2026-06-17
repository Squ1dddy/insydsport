'use client';

import { useEffect, useRef } from 'react';
import { useTournament } from '@/components/tournament-provider';
import { getFollowed } from '@/lib/followed-teams';
import { displayTeamName, matchTeamsLabel, roundLabel, winnerIdsForMatch } from '@/lib/tournament-utils';
import type { EnrichedMatch, MatchStatus } from '@/types/tournament';

// Watches the live tournament feed and fires a browser notification when a
// followed team's match goes live or finishes. Foreground only — it works while
// any tab is open (no service worker / push backend). Mounted once in the layout.
function notify(title: string, body: string, tag: string) {
  try {
    new Notification(title, { body, tag, icon: '/images/school-emblem.png' });
  } catch {
    // Some browsers throw if Notification is constructed without a service worker
    // on certain platforms — fail silently rather than break the page.
  }
}

function winnerIdsFor(match: EnrichedMatch): string[] {
  return match.winner1_id || match.winner2_id
    ? ([match.winner1_id, match.winner2_id].filter(Boolean) as string[])
    : winnerIdsForMatch(match);
}

export function FollowNotifier() {
  const { data } = useTournament();
  // Last seen status per match id. null until the first snapshot is recorded, so
  // we never fire a burst of alerts for matches that were already live on load.
  const prevStatus = useRef<Map<string, MatchStatus> | null>(null);

  useEffect(() => {
    if (!data) return;

    const current = new Map<string, MatchStatus>();
    for (const match of data.matches) current.set(match.id, match.status);

    const previous = prevStatus.current;
    prevStatus.current = current;
    if (previous === null) return; // first load — baseline only

    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const followed = new Set(getFollowed());
    if (followed.size === 0) return;

    for (const match of data.matches) {
      const before = previous.get(match.id);
      if (before === match.status) continue;

      const followedHere = [match.team1, match.team2, match.team3, match.team4]
        .filter((team): team is NonNullable<typeof team> => Boolean(team) && followed.has(team!.id));
      if (followedHere.length === 0) continue;

      const names = followedHere.map((team) => displayTeamName(team.name)).join(', ');

      if (match.status === 'live') {
        notify(`${names} is now LIVE`, `${roundLabel(match.bracket, match.round)} · ${matchTeamsLabel(match)}`, `live-${match.id}`);
      } else if (match.status === 'completed') {
        const winners = winnerIdsFor(match);
        const advanced = followedHere.some((team) => winners.includes(team.id));
        notify(
          advanced ? `${names} advanced! 🎉` : `${names} — match finished`,
          `${roundLabel(match.bracket, match.round)} · ${matchTeamsLabel(match)}`,
          `done-${match.id}`
        );
      }
    }
  }, [data]);

  return null;
}
