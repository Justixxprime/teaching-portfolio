# Setting Up the Gallery Storage (Cloudflare R2) — Step by Step

This gives Alex a working upload panel at `gallery-admin.html` where she can add or remove photos/videos herself, free, with no bandwidth charges regardless of how much footage families view. Total setup time: about 20 minutes, one time only.

## Step 1 — Create a Cloudflare account (skip if you have one)
1. Go to dash.cloudflare.com and sign up. Free, no credit card required for this.

## Step 2 — Create the R2 bucket
1. In the Cloudflare dashboard, click **R2 Object Storage** in the left sidebar.
2. Click **Create bucket**.
3. Name it `support-gallery` (or anything you like — just remember it for Step 4).
4. Location: Automatic is fine.
5. Click **Create bucket**.

## Step 3 — Install Wrangler (Cloudflare's deploy tool)
This is a one-time install on your computer.
```
npm install -g wrangler
wrangler login
```
This opens a browser tab to connect Wrangler to your Cloudflare account.

## Step 4 — Deploy the Worker
1. In this project folder, go into `workers/`.
2. The file `workers/wrangler.toml` is already there. It contains:
   ```toml
   name = "support-gallery-worker"
   main = "gallery-worker.js"
   compatibility_date = "2026-01-01"

   [[r2_buckets]]
   binding = "GALLERY_BUCKET"
   bucket_name = "support-gallery"
   ```
   (If you named your bucket something other than `support-gallery` in Step 2, put that name here instead.)
3. From inside the `workers/` folder, run:
   ```
   wrangler deploy
   ```
4. Wrangler will print a URL that looks like:
   ```
   https://support-gallery-worker.YOUR-SUBDOMAIN.workers.dev
   ```
   Copy this — you'll need it in Step 6.

## Step 5 — Set the admin secret
This is the password that protects uploading/deleting (separate from the site's visitor password).
```
wrangler secret put ADMIN_KEY
```
It will ask you to type a value — enter any long, random string (20+ characters). Save it somewhere safe. You will paste it into the admin page in Step 7. **It never goes into any file in this project.**

## Step 6 — Connect the site to the Worker
1. Open `js/r2-config.js` and replace only the `workerUrl` placeholder with the address from Step 4. Leave `adminKey` as the placeholder text.
   ```js
   window.GALLERY_CONFIG = {
     workerUrl: "https://support-gallery-worker.YOUR-SUBDOMAIN.workers.dev",  // from Step 4
     adminKey: "YOUR-ADMIN-KEY-HERE",   // leave as is, the key is entered on the admin page instead
   };
   ```
2. Open `workers/gallery-worker.js` and set the `ALLOWED_ORIGIN` constant near the top to the live site address (`https://justixxprime.github.io`, no path), then run `wrangler deploy` again from `workers/`.

## Step 7 — Test it
1. Open `gallery-admin.html` on the live site.
2. Log in with the site's existing password, then paste the admin key from Step 5 into the **Admin key** box and press Save key (it is remembered on that device only).
3. Upload a test photo, confirm it appears in the list below.
4. Visit `private-portfolio.html`, confirm the photo shows up there too.
5. Delete the test photo from the admin page to confirm that works too.

## That's it — permanent, hands-off setup
From here forward, the owner uploads and deletes gallery items entirely alone from `gallery-admin.html`, with zero code changes and zero contact with you. The free tier covers 10 GB of storage with **no bandwidth charges ever**, so normal use won't hit a cost wall.

## A note on the admin key
The key lives only in the Worker's secrets and in the browser you typed it into, so it is not visible in the website's source. Anyone who learns the key can upload or delete, so keep it private and change it with `wrangler secret put ADMIN_KEY` if it leaks.

## Upload limits
The uploader accepts files up to about 95 MB (a Cloudflare Workers limit on request size). Use MP4 (H.264) for videos so they play on every phone; compress longer clips with a free tool such as HandBrake first.
