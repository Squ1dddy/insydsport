// Single source of truth for the site version + patch notes. Bump SITE_VERSION
// and prepend a new entry here whenever a release ships; the footer version badge
// reads from this and shows the notes in a popover.

export const SITE_VERSION = 'v1.1';

export interface ChangelogEntry {
  version: string;
  /** Human label for when it shipped (optional). */
  date?: string;
  changes: string[];
}

// Newest first.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v1.1',
    changes: [
      'New Big Screen mode — a full-screen live view for projectors and TVs, with a button that appears whenever a match is on air.',
      'New Stats page — scoring leaders ranked by total points and points per game, for both seniors and juniors.',
      'Follow your teams — tap the ★ next to any team (match cards, stats, results, junior ladder) to favourite it and get live alerts when they go on air or a result is posted.',
      'Crowd favourites — the Stats page shows how many fans each team has (one star per fan), a "Most Favourited" leader, and your own list of starred teams.',
      'Admin: notices can now be hidden and re-shown without deleting them, and removing a notice has been fixed.',
      'Admin: unsynced scores now retry automatically the moment the connection comes back.',
      'Cleaned up the team roster popover and refreshed the home-page taglines.'
    ]
  },
  {
    version: 'v1.0',
    changes: ['Initial launch — live brackets, real-time scoring, results, and the courtside admin panel.']
  }
];
