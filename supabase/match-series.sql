-- Explicit series column for the Inner Sydney Handball Knockout.
-- Paste into Supabase dashboard → SQL Editor → Run. Safe to re-run.
--
-- WHY: the senior bracket carries three independent knockout series — Year 12
-- (concluded), Year 11 (running) and Teachers (concluded) — but they were all
-- discriminated by the single boolean `is_next_term`, which can only express two.
-- A third series was about to become another implicit convention layered on top of
-- the existing 100+ match-number band, so it gets its own column instead.
--
-- SAFE TO RUN AT ANY TIME: the app does not require this column. /api/state fills
-- `series` in from `is_next_term` (plus "are all this match's teams teacher teams")
-- whenever the column is absent, so the site behaves identically before and after.
-- Running it just makes the value authoritative instead of derived.

alter table matches add column if not exists series text not null default 'year12';

-- Backfill from the old boolean. Teacher rows are set by the data script (they are
-- identified by their teams, not by any column that existed before now).
update matches set series = 'year11' where is_next_term and series <> 'year11';
update matches set series = 'year12' where not is_next_term and series not in ('year12', 'teacher');

-- Recreate rather than add, so re-running is not an error.
alter table matches drop constraint if exists matches_series_check;
alter table matches add constraint matches_series_check check (series in ('year12', 'year11', 'teacher'));

create index if not exists matches_series_idx on matches(bracket, series, round, match_number);

-- `is_next_term` is intentionally KEPT and kept in sync (series='year11'). Dropping
-- it is a separate cleanup once nothing reads it.
