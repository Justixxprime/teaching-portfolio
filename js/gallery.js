/* ============================================================
   GALLERY DATA LAYER — shared by private-portfolio.html and
   video-library.html (read-only display) and gallery-admin.html
   (upload/delete).

   Admin key: it is NOT stored in the site's source. The owner types
   it once on gallery-admin.html and it is remembered in this browser
   only (localStorage). A key in js/r2-config.js still works as a
   fallback, but leaving it blank is safer.
   ============================================================ */
window.GalleryAPI = (function () {
  var KEY_STORE = "gallery-admin-key";

  function cfg() {
    return window.GALLERY_CONFIG || {};
  }
  function configured() {
    var u = cfg().workerUrl;
    return !!u && u.indexOf("YOUR-WORKER-NAME") === -1;
  }

  function getKey() {
    try {
      var saved = localStorage.getItem(KEY_STORE);
      if (saved) return saved;
    } catch (e) {}
    var c = cfg().adminKey;
    return c && c.indexOf("YOUR-ADMIN-KEY") === -1 ? c : "";
  }
  function setKey(k) {
    try {
      if (k) localStorage.setItem(KEY_STORE, k);
      else localStorage.removeItem(KEY_STORE);
    } catch (e) {}
  }
  function hasKey() {
    return !!getKey();
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function decode(s) {
    try {
      return decodeURIComponent(s || "");
    } catch (e) {
      return s || "";
    }
  }
  // Keeps file keys URL-safe (no spaces or % signs) so every upload plays/loads.
  function safeName(name) {
    var dot = name.lastIndexOf(".");
    var base = dot > 0 ? name.slice(0, dot) : name;
    var ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
    base = base.normalize("NFKD").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "upload";
    return base + ext;
  }

  async function list() {
    var res = await fetch(cfg().workerUrl + "/list");
    if (!res.ok) throw new Error("Could not load gallery");
    var data = await res.json();
    return (data.items || []).map(function (it) {
      it.caption = decode(it.caption);
      return it;
    });
  }

  function upload(file, caption, category, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", cfg().workerUrl + "/upload");
      xhr.setRequestHeader("X-Admin-Key", getKey());
      xhr.setRequestHeader("X-Caption", encodeURIComponent(caption || ""));
      xhr.setRequestHeader("X-Category", category);
      xhr.setRequestHeader("X-Filename", safeName(file.name));
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = function (e) {
        if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = function () {
        if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
        else if (xhr.status === 401) reject(new Error("BAD_KEY"));
        else reject(new Error(xhr.responseText || "Upload failed"));
      };
      xhr.onerror = function () {
        reject(new Error("NETWORK"));
      };
      xhr.send(file);
    });
  }

  async function remove(key) {
    var res = await fetch(cfg().workerUrl + "/delete?key=" + encodeURIComponent(key), {
      method: "DELETE",
      headers: { "X-Admin-Key": getKey() },
    });
    if (res.status === 401) throw new Error("BAD_KEY");
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
  }

  return { list: list, upload: upload, remove: remove, configured: configured, getKey: getKey, setKey: setKey, hasKey: hasKey, esc: esc, safeName: safeName };
})();

/* ============================================================
   READ-ONLY GALLERY RENDERING
   Any <div class="gallery-grid" data-dynamic> is filled with the
   uploaded items. Add data-only="video" to show videos only.
   ============================================================ */
document.addEventListener("DOMContentLoaded", async function () {
  var grids = document.querySelectorAll(".gallery-grid[data-dynamic]");
  if (!grids.length) return;
  var api = window.GalleryAPI;

  function message(grid, text) {
    grid.innerHTML = '<p class="gallery-empty" style="grid-column:1/-1; color:var(--ink-soft); text-align:center; padding:var(--sp-5) 0;">' + api.esc(text) + "</p>";
  }

  if (!api.configured()) {
    grids.forEach(function (g) {
      message(g, "The gallery storage isn't connected yet. See docs/r2-setup-guide.md.");
    });
    return;
  }

  var items;
  try {
    items = await api.list();
  } catch (e) {
    grids.forEach(function (g) {
      message(g, "The gallery could not be loaded right now. Please try again shortly.");
    });
    return;
  }
  items.sort(function (a, b) {
    return new Date(b.uploaded) - new Date(a.uploaded);
  });

  grids.forEach(function (grid) {
    var only = grid.getAttribute("data-only");
    var shown = items.filter(function (it) {
      return !only || it.category === only;
    });
    if (!shown.length) {
      message(grid, only === "video" ? "No videos have been added yet." : "Nothing has been added yet. Use Manage gallery to upload photos, videos and notes.");
      return;
    }
    grid.innerHTML = "";
    shown.forEach(function (item) {
      var isVideo = item.category === "video";
      var url = api.esc(item.url);
      var caption = api.esc(item.caption || "Untitled");
      var article = document.createElement("article");
      article.className = "tile";
      article.setAttribute("data-category", item.category);
      article.innerHTML =
        '<div class="img-frame gallery-media' + (isVideo ? ' video-card" data-video="' + url + '" role="button" tabindex="0" aria-label="Play video: ' + caption : "") + '">' +
        (isVideo
          ? '<video muted loop playsinline preload="metadata" src="' + url + '#t=1"></video>' +
            '<span class="media-badge video-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z"/></svg></span>'
          : '<img src="' + url + '" alt="' + caption + '" loading="lazy">' +
            '<span class="media-badge">' + (item.category === "notes" ? "Notes" : "Photo") + "</span>") +
        "</div>" +
        '<div class="tile-body"><h3>' + caption + "</h3></div>";
      grid.appendChild(article);
    });
  });
});
