# Setting Up the Gallery Storage (Cloudflare R2) — Step by Step

This gives Jennifer a working upload panel at `gallery-admin.html` where she can add or remove photos/videos herself, free, with no bandwidth charges regardless of how much footage families view. Total setup time: about 20 minutes, one time only.

## Step 1 — Create a Cloudflare account (skip if you have one)
1. Go to dash.cloudflare.com and sign up. Free, no credit card required for this.

## Step 2 — Create the R2 bucket
1. In the Cloudflare dashboard, click **R2 Object Storage** in the left sidebar.
2. Click **Create bucket**.
3. Name it `jennifer-gallery` (or anything you like — just remember it for Step 4).
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
2. Create a file called `wrangler.toml` right next to `gallery-worker.js` with this content:
   ```toml
   name = "jennifer-gallery-worker"
   main = "gallery-worker.js"
   compatibility_date = "2026-01-01"

   [[r2_buckets]]
   binding = "GALLERY_BUCKET"
   bucket_name = "jennifer-gallery"
   ```
   (If you named your bucket something other than `jennifer-gallery` in Step 2, put that name here instead.)
3. From inside the `workers/` folder, run:
   ```
   wrangler deploy
   ```
4. Wrangler will print a URL that looks like:
   ```
   https://jennifer-gallery-worker.YOUR-SUBDOMAIN.workers.dev
   ```
   Copy this — you'll need it in Step 6.

## Step 5 — Set the admin secret
This is the password that protects uploading/deleting (separate from the site's visitor password).
```
wrangler secret put ADMIN_KEY
```
It will ask you to type a value — enter any long, random string (e.g. mash your keyboard for 20+ characters). Save it somewhere safe, you'll need it in Step 6 too.

## Step 6 — Fill in the config file
1. Open `js/r2-config.js` in this project.
2. Replace the two placeholder values:
   ```js
   window.GALLERY_CONFIG = {
     workerUrl: "https://jennifer-gallery-worker.YOUR-SUBDOMAIN.workers.dev",  // from Step 4
     adminKey: "the-random-string-you-set-in-step-5",
   };
   ```
3. Also open `workers/gallery-worker.js` and update the `ALLOWED_ORIGIN` constant near the top to Jennifer's real live domain, then run `wrangler deploy` again from `workers/` to push that change.

## Step 7 — Test it
1. Open `gallery-admin.html` on the live site.
2. Log in with the site's existing password.
3. Upload a test photo, confirm it appears in the list below.
4. Visit `private-portfolio.html`, confirm the photo shows up there too.
5. Delete the test photo from the admin page to confirm that works too.

## That's it — permanent, hands-off setup
From here forward, Jennifer uploads and deletes gallery items entirely herself from `gallery-admin.html`, with zero code changes and zero contact with you. The free tier covers 10 GB of storage with **no bandwidth charges ever**, so normal use won't hit a cost wall.

## A note on the admin key
Right now, anyone who has the `adminKey` value (visible in `js/r2-config.js`'s source) could technically call the upload/delete endpoints directly, bypassing the site's UI. This is an acceptable tradeoff for a low-stakes personal gallery, but if you want it fully locked down later, the Worker can be upgraded to check Jennifer's actual Supabase login session instead of a shared key — happy to build that if it matters to you.
