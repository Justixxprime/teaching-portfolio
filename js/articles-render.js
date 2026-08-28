/* ============================================================
   ARTICLES ENGINE — reads content/articles/*.md directly from
   GitHub (raw.githubusercontent.com) at runtime, no build step.
   This is what makes Decap CMS work on plain GitHub Pages:
   Jennifer publishes through the CMS, which commits a markdown
   file to the repo, and it appears on the live site within
   moments, no rebuild or redeploy needed.
   ============================================================ */
(function () {
  function cfg() {
    return window.CMS_CONFIG || {};
  }
  function configured() {
    return cfg().owner && cfg().owner.indexOf("YOUR-GITHUB-USERNAME") === -1;
  }

  // ---- tiny frontmatter parser (our format is simple key: "value" pairs,
  // no need to pull in a full YAML library for this) ----
  function parseFrontmatter(raw) {
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };
    const meta = {};
    match[1].split("\n").forEach((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      val = val.replace(/^"(.*)"$/, "$1");
      meta[key] = val;
    });
    return { meta, body: match[2].trim() };
  }

  // ---- minimal markdown -> HTML (paragraphs only, which is all
  // our articles use; swap in marked.js later if richer formatting
  // is ever needed) ----
  function renderMarkdown(md) {
    return md
      .split(/\n\s*\n/)
      .map((p) => `<p style="margin-bottom: var(--sp-3); color: var(--ink-soft); max-width: 68ch;">${p.trim()}</p>`)
      .join("\n");
  }

  function readTime(body) {
    const words = body.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  async function listArticleFiles() {
    const { owner, repo, branch } = cfg();
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/content/articles?ref=${branch}`);
    if (!res.ok) throw new Error("Could not list articles");
    const files = await res.json();
    return files.filter((f) => f.name.endsWith(".md"));
  }

  async function fetchArticle(slug) {
    const { owner, repo, branch } = cfg();
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/content/articles/${slug}.md`);
    if (!res.ok) throw new Error("Article not found");
    const raw = await res.text();
    return parseFrontmatter(raw);
  }

  // ---- Insights index: render a live tile grid ----
  async function renderIndex() {
    const grid = document.querySelector(".tile-grid[data-articles-index]");
    if (!grid || !configured()) return;
    try {
      const files = await listArticleFiles();
      const articles = await Promise.all(
        files.map(async (f) => {
          const slug = f.name.replace(/\.md$/, "");
          const { meta, body } = await fetchArticle(slug);
          return { slug, meta, minutes: readTime(body) };
        })
      );
      articles.sort((a, b) => new Date(b.meta.date) - new Date(a.meta.date));
      grid.innerHTML = "";
      articles.forEach((a) => {
        const article = document.createElement("article");
        article.className = "tile";
        article.innerHTML = `
          <a href="article.html?slug=${a.slug}" style="text-decoration:none; color:inherit; display:block;">
            <div class="img-frame"><span>Photography pending</span></div>
            <div class="tile-body">
              <p class="eyebrow" style="margin-bottom:0.4em;">${a.meta.category || ""} &middot; ${a.minutes} min read</p>
              <h3>${a.meta.title || a.slug}</h3>
              <p>${a.meta.description || ""}</p>
            </div>
          </a>`;
        grid.appendChild(article);
      });
    } catch (e) {
      console.warn("Could not load live articles, showing static fallback:", e);
    }
  }

  // ---- Single article page ----
  async function renderArticle() {
    const container = document.querySelector("[data-article-container]");
    if (!container) return;
    const slug = new URLSearchParams(location.search).get("slug");
    if (!slug || !configured()) return;

    try {
      const { meta, body } = await fetchArticle(slug);
      const minutes = readTime(body);
      document.title = `${meta.title} | Insights | Jennifer Amaka`;
      container.innerHTML = `
        <section class="hero" style="padding-bottom: var(--sp-3);">
          <div class="container-narrow">
            <p class="eyebrow">${meta.category || ""} &middot; ${minutes} min read</p>
            <h1 style="margin: var(--sp-2) 0 var(--sp-3);">${meta.title}</h1>
            <p class="lede">${meta.description || ""}</p>
          </div>
        </section>
        <section class="section-tight">
          <div class="container"><div class="img-frame" style="aspect-ratio: 21/9;"><span>Photography pending</span></div></div>
        </section>
        <section class="section">
          <div class="container-narrow">${renderMarkdown(body)}</div>
        </section>
        <section class="section-tight deep">
          <div class="container"><a href="insights.html" class="link-underline">&larr; Back to insights</a></div>
        </section>`;
    } catch (e) {
      container.innerHTML = `<section class="section"><div class="container-narrow"><p>Couldn't load this article. <a href="insights.html" class="link-underline">Back to insights</a></p></div></section>`;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderIndex();
    renderArticle();
  });
})();
