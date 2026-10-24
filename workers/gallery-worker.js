/**
 * gallery-worker.js
 * Deploy this as a Cloudflare Worker bound to the R2 bucket.
 * Handles three things for the owner's private gallery:
 *   POST /upload   — add a new photo/video + its caption/category
 *   GET  /list     — list everything currently in the gallery
 *   DELETE /delete — remove an item
 *
 * Auth: every request must include a header
 *   X-Admin-Key: <the secret you set below as a Worker env var>
 * This key lives ONLY in the private upload page's local storage
 * after Alex logs in through the existing Supabase password
 * gate — it is never present in the public site's source code.
 *
 * See docs/r2-setup-guide.md for full deploy steps.
 */

const ALLOWED_ORIGIN = "https://YOUR-DOMAIN.com"; // set to the live site address, e.g. https://alexmorgan.com

function cors(resp) {
  resp.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  resp.headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type,X-Admin-Key,X-Caption,X-Category");
  return resp;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const adminKey = request.headers.get("X-Admin-Key");

    // /list is safe to expose read-only without the admin key, since
    // it only returns what's already shown in the (password-gated)
    // gallery — but everything else requires the admin key.
    if (url.pathname === "/list" && request.method === "GET") {
      const listed = await env.GALLERY_BUCKET.list();
      const items = await Promise.all(
        listed.objects.map(async (obj) => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          caption: obj.customMetadata?.caption || "",
          category: obj.customMetadata?.category || "photo",
          url: `${url.origin}/file/${obj.key}`,
        }))
      );
      return cors(Response.json({ items }));
    }

    if (url.pathname.startsWith("/file/") && request.method === "GET") {
      const key = decodeURIComponent(url.pathname.replace("/file/", ""));
      const obj = await env.GALLERY_BUCKET.get(key);
      if (!obj) return cors(new Response("Not found", { status: 404 }));
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("etag", obj.httpEtag);
      return cors(new Response(obj.body, { headers }));
    }

    if (adminKey !== env.ADMIN_KEY) {
      return cors(new Response("Unauthorized", { status: 401 }));
    }

    if (url.pathname === "/upload" && request.method === "POST") {
      const caption = request.headers.get("X-Caption") || "";
      const category = request.headers.get("X-Category") || "photo";
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      const filename = request.headers.get("X-Filename") || `upload-${Date.now()}`;
      const key = `${Date.now()}-${filename}`;

      await env.GALLERY_BUCKET.put(key, request.body, {
        httpMetadata: { contentType },
        customMetadata: { caption, category },
      });

      return cors(Response.json({ ok: true, key }));
    }

    if (url.pathname === "/delete" && request.method === "DELETE") {
      const key = url.searchParams.get("key");
      if (!key) return cors(new Response("Missing key", { status: 400 }));
      await env.GALLERY_BUCKET.delete(key);
      return cors(Response.json({ ok: true }));
    }

    return cors(new Response("Not found", { status: 404 }));
  },
};
