# Private Portfolio: Password & Access Guide

## The short answer

A password typed into a static site's HTML/JS can always be found by anyone who opens their browser's dev tools, no matter how it's hidden. So the real password should never live in the code. And since **this site is deployed under your (the developer's) Netlify account**, the client also shouldn't need a login to *your* Netlify team to manage it — that would expose your other client sites and billing to her. The fix for both problems is the same: use a standalone access tool that she owns on her own account, fully decoupled from your hosting.

## Recommended: a standalone membership tool she signs up for herself

Tools like **Memberstack**, **Outseta**, or **Supabase Auth** let her create her own account directly with that provider, independent of Netlify entirely. A small script tag connects it to the site.

What this gets her:
- Her own login, on her own account. You are never in the loop for day to day access.
- She adds a new family, removes one, or resets anyone's password herself, anytime, from her own dashboard.
- If she ever changes developers or hosts, this layer moves with her.
- Free for a small number of users; typically $10 to $30/month once she has more than a handful of client families.

**Memberstack** is the easiest to set up and has the friendliest non-technical dashboard. Start there.

## Alternative: Netlify Identity (only if she gets her own restricted login)

Netlify Identity is free and well built, but by default managing it means logging into *your* Netlify team. It only stays clean if you add her as a **collaborator with a role restricted to just this one site** — which requires Netlify's paid Pro plan, since the free plan doesn't offer per-site role limits. If you're already on or planning to move to Pro, this is a solid option. Otherwise, the standalone tool above is the better fit.

## Simplest interim option: one shared password, stored outside the code

If you need something live before either of the above is set up:

1. Store the password as an **environment variable** in Netlify (Site configuration → Environment variables), e.g. `PORTFOLIO_PASSWORD`.
2. A small serverless function checks a submitted password against that variable.
3. To change it, you (the developer) update the environment variable in Netlify — she would still need to ask you, since it's on your account.

This is a stopgap, not a real answer to "she controls it herself" — flagging it only because it's the fastest thing to wire up if you need it live sooner. Everyone shares one password, there's no individual access, and only you can change it.

## What NOT to do

- Don't hardcode a password string in `private-portfolio.html` or any `.js` file, even "temporarily" — it's visible to anyone who views source.
- Don't rely on a hard-to-guess URL as protection.
- Don't put real children's videos or images directly in the public `/assets` folder even if the *page* is gated — the file itself would still be reachable by direct link.

## Bottom line

For genuine independence from you, set her up with **Memberstack** (or Outseta). It's the only path here where she truly never needs to reach you to add someone, remove someone, or reset a password.

## What's built into the prototype right now

`private-portfolio.html` currently shows a styled login form that is clearly a **visual placeholder** — the button is disabled and the page says so outright. That's intentional, so the client can see what the experience will look like before real access control is wired in.
