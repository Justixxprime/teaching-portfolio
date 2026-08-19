-- ============================================================
-- SUPABASE SETUP SCRIPT — run this once
-- ============================================================
-- What this does:
-- 1. Creates a tiny table with exactly one row: the current
--    shared password for the private portfolio area.
-- 2. Creates a function that checks a submitted password
--    against that row WITHOUT ever exposing the real password
--    to the website's visitors — the website only ever gets
--    back "true" or "false", never the actual password value.
-- 3. Locks the table down so the password can only be changed
--    from inside the Supabase dashboard (by the practitioner),
--    never read directly from the website.
--
-- HOW TO RUN THIS:
-- 1. Log into supabase.com, open your project.
-- 2. In the left sidebar, click "SQL Editor".
-- 3. Click "New query".
-- 4. Paste this entire file in.
-- 5. Click "Run".
-- That's it — this only needs to be run once, ever.
-- ============================================================

create table if not exists site_access (
  id int primary key default 1,
  password text not null,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Insert the starting password. CHANGE THIS before running,
-- or change it afterward directly in the Table Editor.
insert into site_access (id, password)
values (1, 'change-this-starting-password')
on conflict (id) do nothing;

-- Lock the table so it can't be read directly over the API —
-- only the function below (which never reveals the password)
-- is allowed to touch it from outside Supabase.
alter table site_access enable row level security;
-- (No policies are added, which means: no direct access at all
-- from the public API key. Only the function below can read it,
-- because functions run with elevated rights by default.)

create or replace function check_site_password(input_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from site_access
    where password = input_password
  );
$$;

-- Allow the website's public (anon) key to call the function
-- above — but note it can ONLY call this one function, which
-- only ever returns true/false. It cannot read the password
-- table directly, because of the RLS lock above.
grant execute on function check_site_password(text) to anon;

-- ============================================================
-- TO CHANGE THE PASSWORD LATER (for the practitioner):
-- 1. Log into supabase.com
-- 2. Click "Table Editor" in the left sidebar
-- 3. Click the "site_access" table
-- 4. Click the password cell, type the new password, hit Enter
-- Done — no code, no SQL Editor needed for this part.
-- ============================================================
