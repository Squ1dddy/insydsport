-- App-level settings for the Inner Sydney Handball Knockout.
-- Single-row table (id is always 1). Paste into Supabase dashboard → SQL Editor → Run.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).

create table if not exists app_settings (
  id int primary key default 1,
  current_day_override int,            -- null = auto (date-driven); 1-5 = force a day
  constraint app_settings_single_row check (id = 1)
);

-- Ensure the singleton row exists.
insert into app_settings (id, current_day_override)
  values (1, null)
  on conflict (id) do nothing;

-- Row-Level Security: public read (same pattern as teams / matches).
alter table app_settings enable row level security;

drop policy if exists "public read app_settings" on app_settings;
create policy "public read app_settings" on app_settings for select using (true);

-- Realtime: push setting changes to every open client instantly.
alter publication supabase_realtime add table app_settings;
