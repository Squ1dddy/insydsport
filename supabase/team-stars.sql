-- Crowd favourites ("stars") for the Inner Sydney Handball Knockout.
-- Each team shows how many viewers have starred it. To keep the count honest and
-- un-exploitable WITHOUT user accounts, stars are recorded one row per
-- (device, team): the primary key makes starring idempotent, so the public
-- endpoint can't be looped to inflate a count. teams.star_count is kept in
-- lockstep by a trigger (same transaction → race-safe, never drifts).
-- Paste into Supabase dashboard → SQL Editor → Run. Safe to re-run.

alter table teams add column if not exists star_count int not null default 0;

-- One row per device per team. PK (device_id, team_id) => a device can star a
-- team at most once; re-sending "follow" is a no-op (ON CONFLICT DO NOTHING).
-- char_length bound rejects junk/oversized ids at the boundary.
create table if not exists team_stars (
  device_id  text        not null check (char_length(device_id) between 8 and 64),
  team_id    uuid        not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (device_id, team_id)
);

create index if not exists team_stars_team_idx on team_stars(team_id);

-- Maintain teams.star_count from team_stars, in the same transaction as the
-- insert/delete. Row-level locks on the teams row serialise concurrent bumps, so
-- the count can never race or drift from the underlying rows.
create or replace function sync_team_star_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update teams set star_count = star_count + 1 where id = new.team_id;
  elsif (tg_op = 'DELETE') then
    update teams set star_count = greatest(0, star_count - 1) where id = old.team_id;
  end if;
  return null;
end;
$$;

drop trigger if exists team_stars_count_trg on team_stars;
create trigger team_stars_count_trg
after insert or delete on team_stars
for each row execute function sync_team_star_count();

-- Reconcile the cached count with the source of truth (idempotent; corrects any
-- values left over from the earlier direct-bump approach).
update teams t
   set star_count = coalesce((select count(*) from team_stars s where s.team_id = t.id), 0);

-- team_stars is written only by the server (service-role key). RLS on with NO
-- policies => the public anon key can neither read nor write it directly.
alter table team_stars enable row level security;

-- Remove the old direct-increment function — replaced by the dedup table above.
drop function if exists bump_team_stars(uuid, int);
