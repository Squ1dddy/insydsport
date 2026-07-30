import type { Team } from '@/types/tournament';

// Teacher/staff marker shown beside teacher-team names across the whole site.
//
// It renders as a compact gold SYMBOL (a mortarboard) rather than the word
// "Teacher", so it sits inside score cards and bracket nodes without crowding the
// team name. Hovering — or focusing it by keyboard, or tapping on touch — reveals
// "Teacher / staff team" via the native tooltip, and the same string is exposed to
// screen readers so the meaning is never colour- or shape-only.
//
// Renders nothing for student teams, so callers can drop
// `<TeacherBadge team={team} />` unconditionally next to any name.
export function TeacherBadge({
  team,
  className = ''
}: {
  team?: Pick<Team, 'is_teacher'> | null;
  className?: string;
}) {
  if (!team?.is_teacher) return null;
  return (
    <span
      // `title` drives the hover tooltip; tabIndex makes it reachable so keyboard and
      // touch users can surface it too.
      title="Teacher / staff team"
      tabIndex={0}
      role="img"
      aria-label="Teacher / staff team"
      className={`inline-grid h-4 w-4 shrink-0 cursor-help place-items-center rounded-full border border-gold/50 bg-gold/15 align-middle text-gold outline-none transition-colors hover:bg-gold/30 focus-visible:ring-1 focus-visible:ring-gold ${className}`}
    >
      {/* Mortarboard */}
      <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2.5 15 6l-7 3.5L1 6l7-3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M4 7.6v3.1c0 .9 1.8 1.8 4 1.8s4-.9 4-1.8V7.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
