/* ============================================================
   R2 GALLERY CONFIG
   Fill this in once the Worker is deployed (see
   docs/r2-setup-guide-for-justice.md). The URL is your Worker's
   address; the admin key matches the ADMIN_KEY secret set on
   the Worker. Neither of these being "wrong" can expose the
   gallery publicly — the Worker itself enforces the real check.
   ============================================================ */
window.GALLERY_CONFIG = {
  workerUrl: "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev",
  adminKey: "YOUR-ADMIN-KEY-HERE",
};
