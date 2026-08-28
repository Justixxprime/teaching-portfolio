/* ============================================================
   CMS / ARTICLES CONFIG
   owner + repo let the site list markdown files in
   content/articles/ via GitHub's public API (works for public
   repos with no auth, ~60 requests/hour — plenty for a low
   traffic personal site). Fill these in once, they match
   whatever GitHub username/repo the site is hosted from.
   ============================================================ */
window.CMS_CONFIG = {
  owner: "YOUR-GITHUB-USERNAME",
  repo: "YOUR-REPO-NAME",
  branch: "main",
};
