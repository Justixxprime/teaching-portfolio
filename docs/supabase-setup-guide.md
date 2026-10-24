# Setting Up the Real Password System (Supabase) — Step by Step

Right now the private pages work with a **test password** (`preview2026`) hardcoded in `js/access-gate.js`, clearly marked "TEST MODE" so you can click through the flow today. This guide replaces that with the real thing. Total time: about 15 minutes, one time only.

## Step 1 — Create the Supabase account and project
1. Go to supabase.com and click "Start your project."
2. Sign up (email or GitHub — either is fine).
3. Click "New project."
4. Give it a name, e.g. `practitioner-portfolio`.
5. Set a database password (this is separate from the site's access password — just a technical setting, save it somewhere safe, you won't need it day to day).
6. Choose the region closest to where the site's visitors mostly are.
7. Click "Create new project." It takes about two minutes to spin up.

## Step 2 — Run the setup script
1. Once the project is ready, click "SQL Editor" in the left sidebar.
2. Click "New query."
3. Open `docs/supabase-setup.sql` from this project folder, copy the entire file.
4. Paste it into the SQL Editor.
5. Before running it, find this line near the top and change the password to whatever you want the starting password to be:
   ```
   values (1, 'change-this-starting-password')
   ```
6. Click "Run" (bottom right, or Cmd/Ctrl + Enter).
7. You should see "Success. No rows returned." That means it worked.

## Step 3 — Get your project's URL and key
1. Click the gear icon ("Project Settings") in the left sidebar.
2. Click "API."
3. You'll see two things you need:
   - **Project URL** — looks like `https://abcxyz123.supabase.co`
   - **anon public** key — a long string of letters and numbers
4. Keep this tab open, you'll copy both into the next step.

## Step 4 — Fill in the config file
1. Open `js/supabase-config.js` in this project.
2. Replace the two placeholder values:
   ```js
   window.SUPABASE_CONFIG = {
     url: "https://abcxyz123.supabase.co",       // paste your Project URL here
     anonKey: "paste-your-anon-public-key-here",
   };
   ```
3. Save the file.

## Step 5 — Remove the test mode
1. Open `js/access-gate.js`.
2. Find the block that starts with `// TEST MODE` and ends with `// END TEST MODE`.
3. Delete that whole block (it's clearly commented so it's easy to find).
4. Save.

## Step 6 — Test it
1. Open `private-portfolio.html` in a browser (or deploy and visit the live page).
2. Type in whatever password you set in Step 2.
3. You should see "Access granted" and the private content should reveal itself.
4. Try a wrong password too, confirm it's rejected.

## That's it — you're done, permanently
From this point forward, **you never need to touch this again**. To change the password in the future (you or the client, from the Supabase dashboard, no code):
1. Log into supabase.com
2. Click "Table Editor" in the left sidebar
3. Click the `site_access` table
4. Click the password cell, type the new value, press Enter

## Giving the client her own login (recommended before handoff)
Right now, only your Supabase account can see this project. To let her manage the password herself without contacting you:
1. In the Supabase dashboard, go to "Project Settings → Team."
2. Click "Invite a member."
3. Enter her email, choose a role (Developer or Editor is enough for this).
4. She creates her own Supabase login via the invite email, and from then on can edit the password herself using Step 6 of "Bottom line" above, without ever reaching you.
