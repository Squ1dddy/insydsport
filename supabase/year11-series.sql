-- Year 11 series build-out for the Inner Sydney Handball Knockout.
-- Paste into Supabase dashboard → SQL Editor → Run. Safe to re-run.
--
-- NOTE: the live production DB already satisfies this (its team1_id/team2_id are
-- nullable despite schema.sql having declared them NOT NULL), so running it there
-- is a harmless no-op. It exists so a FRESH setup from schema.sql matches.
--
-- The Year 12 series has concluded, so Year 11 (rows flagged is_next_term) is now
-- the live senior series and needs its later rounds visible as empty placeholders
-- before any qualifiers are known.
--
-- Placeholder bracket slots need team1_id/team2_id to be nullable. They were NOT
-- NULL, which made an unfilled Semifinal/Grand Final row impossible to insert —
-- and also meant upsertNextRoundMatch (app/api/admin/matches/route.ts) would fail
-- outright if an EVEN-numbered parent match completed first, because that path
-- writes only team3_id/team4_id and left team1_id null.
--
-- The UI already renders a null slot as "TBD" (bracket-tree TeamLine,
-- match-card TeamRow), so nothing downstream needs to change.

alter table matches alter column team1_id drop not null;
alter table matches alter column team2_id drop not null;
