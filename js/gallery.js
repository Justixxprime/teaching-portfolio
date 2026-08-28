/* ============================================================
   GALLERY DATA LAYER — shared between private-portfolio.html
   (read-only display) and gallery-admin.html (upload/delete).
   ============================================================ */
window.GalleryAPI = (function () {
  function cfg() {
    return window.GALLERY_CONFIG || {};
  }
  function configured() {
    return cfg().workerUrl && cfg().workerUrl.indexOf("YOUR-WORKER-NAME") === -1;
  }

  async function list() {
    const res = await fetch(cfg().workerUrl + "/list");
    if (!res.ok) throw new Error("Could not load gallery");
    const data = await res.json();
    return data.items || [];
  }

  async function upload(file, caption, category, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", cfg().workerUrl + "/upload");
      xhr.setRequestHeader("X-Admin-Key", cfg().adminKey);
      xhr.setRequestHeader("X-Caption", encodeURIComponent(caption));
      xhr.setRequestHeader("X-Category", category);
      xhr.setRequestHeader("X-Filename", encodeURIComponent(file.name));
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(xhr.responseText)));
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });
  }

  async function remove(key) {
    const res = await fetch(cfg().workerUrl + "/delete?key=" + encodeURIComponent(key), {
      method: "DELETE",
      headers: { "X-Admin-Key": cfg().adminKey },
    });
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
  }

  return { list, upload, remove, configured };
})();

/* ============================================================
   READ-ONLY GALLERY RENDERING (private-portfolio.html)
   Falls back to the existing static cards if R2 isn't configured
   yet, so the page never looks broken mid-setup.
   ============================================================ */
document.addEventListener("DOMContentLoaded", async function () {
  const grid = document.querySelector(".gallery-grid[data-dynamic]");
  if (!grid) return;
  if (!window.GalleryAPI.configured()) return; // keep static placeholder cards

  try {
    const items = await window.GalleryAPI.list();
    if (!items.length) return;
    grid.innerHTML = "";
    items.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
    items.forEach((item) => {
      const isVideo = item.category === "video";
      const article = document.createElement("article");
      article.className = "tile";
      article.setAttribute("data-category", item.category);
      article.innerHTML = `
        <div class="img-frame gallery-media ${isVideo ? "video-card" : ""}" ${isVideo ? `data-video="${item.url}"` : ""}>
          ${isVideo
            ? `<video muted loop playsinline preload="metadata"><source src="${item.url}#t=1" type="video/mp4"></video>
               <span class="media-badge video-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z"/></svg></span>`
            : `<img src="${item.url}" alt="${item.caption}" style="width:100%;height:100%;object-fit:cover;">
               <span class="media-badge">${item.category === "notes" ? "Notes" : "Photo"}</span>`
          }
        </div>
        <div class="tile-body"><h3>${item.caption || "Untitled"}</h3></div>
      `;
      grid.appendChild(article);
    });
  } catch (e) {
    console.warn("Gallery load failed, showing static fallback:", e);
  }
});
