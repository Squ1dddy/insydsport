-- Per-match date override for the Inner Sydney Handball Knockout.
-- Lets an admin reschedule a single match to a specific calendar date while it
-- still belongs to its "Day N" (scheduled_day). When null, the date falls back
-- to the fixed day→date mapping in getScheduledDate (lib/tournament-utils.ts).
-- Paste into Supabase dashboard → SQL Editor → Run. Safe to re-run.

alter table matches add column if not exists scheduled_date date;
