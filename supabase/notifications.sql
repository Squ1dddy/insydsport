-- Admin-posted announcements for the Inner Sydney Handball Knockout.
-- Shown as dismissible banners on the public home page; each viewer dismisses
-- locally (localStorage) and an admin can deactivate/delete them centrally.
-- Paste into Supabase dashboard → SQL Editor → Run. Safe to re-run.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text,
  message text not null,
  level text not null default 'info' check (level in ('info', 'warning', 'success')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists notifications_active_idx on notifications(active, created_at desc);

-- Row-Level Security: public read (same pattern as teams / matches / app_settings).
-- Writes go through the server's service-role key, which bypasses RLS.
alter table notifications enable row level security;

drop policy if exists "public read notifications" on notifications;
create policy "public read notifications" on notifications for select using (true);

-- Realtime: push new/edited/removed announcements to every open client instantly.
-- Guarded so re-running this file is safe (a plain ALTER ... ADD TABLE errors if
-- the table is already a member of the publication).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
