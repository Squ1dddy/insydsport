'use client';

import { useFollowedTeams } from '@/lib/followed-teams';

// Star toggle to follow a team. Following is stored per-device; the first time a
// viewer follows a team we ask for notification permission so the FollowNotifier
// can alert them when that team goes live or a result posts (while a tab is open).
export function FollowButton({ teamId, teamName, className = '' }: { teamId: string; teamName: string; className?: string }) {
  const { isFollowed, toggle } = useFollowedTeams();
  const following = isFollowed(teamId);

  return (
    <button
      type="button"
      onClick={(event) => {
        // Don't trigger any parent row handler (e.g. the roster toggle).
        event.stopPropagation();
        const nowFollowing = toggle(teamId);
        if (nowFollowing && typeof Notification !== 'undefined' && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {
            // Permission flow unavailable — following still works, just no alerts.
          });
        }
      }}
      aria-pressed={following}
      aria-label={following ? `Unfollow ${teamName}` : `Follow ${teamName} for live alerts`}
      title={following ? 'Following — tap to unfollow' : 'Follow for live alerts'}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors ${
        following ? 'text-gold' : 'text-ash/60 hover:text-gold'
      } ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={following ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.77l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85L12 3.5z" />
      </svg>
    </button>
  );
}
