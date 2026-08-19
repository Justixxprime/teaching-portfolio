/* ============================================================
   SUPABASE CONFIG
   Fill these two values in after creating the Supabase project
   and running docs/supabase-setup.sql. Both values come from:
   Supabase dashboard → Project Settings → API.

   SUPABASE_ANON_KEY is safe to expose publicly — it's designed
   to be used in browser code. It cannot read the site_access
   table directly (see the RLS lock in supabase-setup.sql); it
   can only call the one-way password-check function.
   ============================================================ */
window.SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT-REF.supabase.co", // e.g. https://abcxyz123.supabase.co
  anonKey: "YOUR-PUBLIC-ANON-KEY-HERE",
};
