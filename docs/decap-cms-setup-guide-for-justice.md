# Setting Up the Article Editor (Decap CMS) — Step by Step

This gives Jennifer a real writing tool at `yoursite.com/admin` — a clean editor with a title box, category dropdown, and a formatted text area (bold, headings, images all have buttons, no markdown syntax needed). She publishes, and the article is live within about a minute, no rebuild, no contacting you.

Total setup: about 25 minutes, one time only. You'll deploy a second small Cloudflare Worker (same free platform as the gallery one), plus a GitHub setting.

## Step 1 — Create a GitHub OAuth App
1. Go to github.com/settings/developers (while logged into the GitHub account that owns the site's repo).
2. Click **OAuth Apps → New OAuth App**.
3. Fill in:
   - **Application name**: anything, e.g. "Jennifer Amaka Site CMS"
   - **Homepage URL**: her live site URL, e.g. `https://jenniferamaka.com`
   - **Authorization callback URL**: the Worker URL you'll get in Step 3, with `/callback` on the end — you can come back and edit this after Step 3 if you don't have it yet.
4. Click **Register application**.
5. Click **Generate a new client secret**. Copy both the **Client ID** and the **Client Secret** somewhere safe — you need both in Step 3.

## Step 2 — Deploy the OAuth proxy Worker
1. In this project's `workers/` folder, you already have `decap-oauth-worker.js`.
2. Create a second `wrangler.toml` (or add to the existing one with a second `[env]` block — simplest is a separate folder) with:
   ```toml
   name = "jennifer-cms-oauth"
   main = "decap-oauth-worker.js"
   compatibility_date = "2026-01-01"
   ```
3. From that folder, run:
   ```
   wrangler deploy
   ```
4. Copy the URL it prints, something like:
   ```
   https://jennifer-cms-oauth.YOUR-SUBDOMAIN.workers.dev
   ```

## Step 3 — Set the OAuth secrets on the Worker
```
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```
Paste in the two values from Step 1 when prompted.

## Step 4 — Finish the GitHub OAuth App
1. Go back to the OAuth App you created in Step 1.
2. Set **Authorization callback URL** to your Worker URL from Step 2, plus `/callback`:
   ```
   https://jennifer-cms-oauth.YOUR-SUBDOMAIN.workers.dev/callback
   ```
3. Save.

## Step 5 — Fill in the CMS config
1. Open `admin/config.yml` in this project.
2. Update:
   ```yaml
   backend:
     name: github
     repo: YOUR-GITHUB-USERNAME/YOUR-REPO-NAME
     branch: main
     base_url: https://jennifer-cms-oauth.YOUR-SUBDOMAIN.workers.dev
   ```
3. Also open `js/cms-config.js` and fill in the same owner/repo — this is what lets the public site (Insights page, article pages) read published articles directly from GitHub, no build step needed.

## Step 6 — Give Jennifer access
Since the CMS uses her actual GitHub login, she needs a GitHub account with write access to the repo:
1. Have her create a free GitHub account if she doesn't have one (just an email + password, at github.com/join).
2. On the repo, go to **Settings → Collaborators → Add people**, and add her GitHub username.
3. She'll get an email invite to accept.

## Step 7 — Test it
1. Visit `yoursite.com/admin`.
2. Click **Login with GitHub**, sign in as Jennifer (or your own account first, to test).
3. Click **New Insight Article**, fill in the form, click **Publish**.
4. Visit `insights.html` on the live site — the new article should appear within moments.

## What Jennifer actually sees
A simple form: Title, Category (dropdown), Publish Date, a short Description box, and a big text area for the article itself with a formatting toolbar (bold, italic, headings, bullet points, links, images). She never sees code, YAML, or markdown syntax directly.

## One limitation worth knowing
Because this reads live from GitHub's API on every page load (not a pre-built site), there's a soft rate limit of about 60 reads per hour for anonymous visitors sharing the same limit pool. For a personal portfolio's traffic level this is not a real-world concern, but flagging it so you know why it exists.
