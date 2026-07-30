create extension if not exists pgcrypto;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  player1 text not null,
  player2 text not null,
  skill_level int not null check (skill_level between 1 and 5),
  bracket text not null check (bracket in ('senior', 'junior')),
  year_group text not null,
  status text not null default 'active' check (status in ('active', 'eliminated', 'bye')),
  -- Round-robin standings (junior bracket). Seniors keep these at 0.
  points int not null default 0,
  games_played int not null default 0,
  -- Teacher teams: admin-only, hidden from public views, slot-able into any match.
  is_teacher boolean not null default false
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  bracket text not null check (bracket in ('senior', 'junior')),
  round int not null,
  match_number int not null,
  scheduled_day int not null,
  -- Optional per-match date override. When set, it overrides the fixed
  -- day→date mapping (getScheduledDate) for display while the match keeps its
  -- "Day N" grouping. Null = use the day mapping.
  scheduled_date date,
  -- All four slots are nullable: an unfilled bracket placeholder (a Semifinal or
  -- Grand Final created before its qualifiers are known) has no teams yet, and the
  -- auto-advance path writes slots 3/4 only when fed by an even-numbered parent.
  -- The UI renders a null slot as "TBD". See supabase/year11-series.sql.
  team1_id uuid references teams(id) on delete cascade,
  team2_id uuid references teams(id) on delete cascade,
  team3_id uuid references teams(id) on delete cascade,
  team4_id uuid references teams(id) on delete cascade,
  team1_score int not null default 0,
  team2_score int not null default 0,
  team3_score int not null default 0,
  team4_score int not null default 0,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
  winner1_id uuid references teams(id) on delete set null,
  winner2_id uuid references teams(id) on delete set null,
  is_skill_stretch boolean not null default false,
  played_at timestamptz,
  duration_minutes int,
  -- Legacy two-way series flag, kept in sync with series = 'year11'. Superseded by
  -- `series` below, which can express the third (teacher) series.
  is_next_term boolean not null default false,
  -- Which senior series this match belongs to. See supabase/match-series.sql.
  --   year12  — concluded, 5 rounds (R1, R2, QF, SF, GF). Champion: Bessintown.
  --   year11  — running, 3 rounds. The front-page schedule.
  --   teacher — concluded, 2 rounds. Staff teams; champion: Demolition Men.
  -- Each series owns a match_number band (year12 from 1, year11 101, teacher 201)
  -- so numbers never collide inside the shared senior bracket.
  series text not null default 'year12' check (series in ('year12', 'year11', 'teacher'))
);

-- Admin-posted announcements shown as dismissible banners on the home page.
-- See supabase/notifications.sql for RLS + realtime setup.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text,
  message text not null,
  level text not null default 'info' check (level in ('info', 'warning', 'success')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists matches_status_idx on matches(status);
create index if not exists matches_series_idx on matches(bracket, series, round, match_number);
create index if not exists matches_bracket_round_idx on matches(bracket, round, match_number);
create index if not exists teams_bracket_idx on teams(bracket, status);

alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table matches;
