import type { Team } from '@/types/tournament';

// Small "Teacher" marker shown beside teacher-team names across the whole site.
// Teacher teams used to be hidden from public views; instead we now surface them
// everywhere with this badge so staff / exhibition teams are recognisable at a
// glance. Renders nothing for student teams, so callers can drop
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
      title="Teacher / staff team"
      className={`inline-flex shrink-0 items-center rounded-full border border-gold/45 bg-gold/15 px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.18em] text-gold ${className}`}
    >
      Teacher
    </span>
  );
}
