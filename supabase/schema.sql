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
  team1_id uuid not null references teams(id) on delete cascade,
  team2_id uuid not null references teams(id) on delete cascade,
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
  -- Year 11 plays next term: kept behind a "TBC Next Term" toggle, excluded from
  -- the current schedule.
  is_next_term boolean not null default false
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
create index if not exists matches_bracket_round_idx on matches(bracket, round, match_number);
create index if not exists teams_bracket_idx on teams(bracket, status);

alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table matches;
