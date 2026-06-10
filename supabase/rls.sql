-- Row-Level Security for the Inner Sydney Handball Knockout database.
--
-- WHY: NEXT_PUBLIC_SUPABASE_ANON_KEY ships in the browser. Without RLS, anyone
-- with that key (i.e. anyone who opens DevTools) can read/edit/DELETE the whole
-- database directly, bypassing the admin password. This locks the public anon
-- key down to READ-ONLY. Admin writes still work because the server uses the
-- SERVICE ROLE key, which bypasses RLS.
--
-- PREREQUISITE: SUPABASE_SERVICE_ROLE_KEY MUST be set in your deploy env (Netlify)
-- before running this — otherwise server writes fall back to the anon key and the
-- admin panel will stop working once RLS is on.
--
-- HOW TO RUN: paste this into the Supabase dashboard → SQL Editor → Run.
-- Safe to re-run (drops existing policies first).

-- 1) Turn RLS on for both tables.
alter table teams   enable row level security;
alter table matches enable row level security;

-- 2) Public READ access (keeps the public site + realtime live scoring working).
drop policy if exists "public read teams"   on teams;
drop policy if exists "public read matches" on matches;

create policy "public read teams"   on teams   for select using (true);
create policy "public read matches" on matches for select using (true);

-- 3) No INSERT / UPDATE / DELETE policies are defined for the anon role, so the
--    public key cannot modify data. The server's SERVICE ROLE key bypasses RLS,
--    so all admin actions (scores, complete, team edits, seeding) keep working.
