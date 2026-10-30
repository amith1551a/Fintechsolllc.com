// Site-wide checks against a running server: links, images, metadata, and original-URL preservation.
// Usage: node tests/crawl.mjs [baseUrl] [recoveryPagesJson]
import fs from "node:fs";
import path from "node:path";

const BASE = (process.argv[2] || "http://localhost:3100").replace(/\/$/, "");
const RECOVERY_PAGES = process.argv[3] || "../fintechsol-recovery/recovery-data/pages.json";
const SITE = "https://fintechsolllc.com";

const statusCache = new Map();
async function status(url) {
  if (!statusCache.has(url)) {
    statusCache.set(
      url,
      fetch(url, { redirect: "manual" }).then(
        (r) => ({ status: r.status, location: r.headers.get("location") }),
        (e) => ({ status: 0, error: String(e) }),
      ),
    );
  }
  return statusCache.get(url);
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];
const decode = (s) => s?.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ""));
console.log(`sitemap: ${urls.length} URLs`);

const pages = await pool(urls, 8, async (p) => {
  const res = await fetch(BASE + p, { redirect: "manual" });
  const html = await res.text();
  const head = html.slice(0, html.indexOf("</head>"));
  const metas = [...head.matchAll(/<meta\s[^>]*>/g)].map((m) => m[0]);
  const meta = (key, val) => decode(attr(metas.find((m) => attr(m, key) === val) ?? "", "content"));
  const links = [...html.matchAll(/<a\s[^>]*>/g)].map((m) => decode(attr(m[0], "href"))).filter(Boolean);
  const imgs = [...html.matchAll(/<img\s[^>]*>/g)].map((m) => ({ src: decode(attr(m[0], "src")), alt: attr(m[0], "alt") }));
  return {
    path: p,
    status: res.status,
    title: decode(head.match(/<title>([^<]*)<\/title>/)?.[1]),
    description: meta("name", "description"),
    canonical: decode(attr(head.match(/<link[^>]+rel="canonical"[^>]*>/)?.[0] ?? "", "href")),
    ogTitle: meta("property", "og:title"),
    ogImage: meta("property", "og:image"),
    twitter: meta("name", "twitter:card"),
    h1: (html.match(/<h1[\s>]/g) || []).length,
    jsonld: (html.match(/application\/ld\+json/g) || []).length,
    archiveRefs: (html.match(/web\.archive\.org/g) || []).length,
    oldAssetRefs: (html.match(/fintechsolllc\.com\/wp-content/g) || []).length,
    links,
    imgs,
  };
});

const problems = [];
const add = (kind, detail) => problems.push({ kind, ...detail });
for (const p of pages) {
  if (p.status !== 200) add("page-status", { path: p.path, status: p.status });
  if (!p.title) add("missing-title", { path: p.path });
  if (!p.description) add("missing-description", { path: p.path });
  if (p.canonical !== SITE + p.path && !(p.canonical && urls.includes(p.canonical.replace(SITE, ""))))
    add("canonical", { path: p.path, canonical: p.canonical });
  if (!p.ogTitle || !p.ogImage || !p.twitter) add("social-meta", { path: p.path });
  if (p.h1 !== 1) add("h1-count", { path: p.path, h1: p.h1 });
  if (p.archiveRefs) add("wayback-reference", { path: p.path, count: p.archiveRefs });
  if (p.oldAssetRefs) add("old-wp-content-reference", { path: p.path, count: p.oldAssetRefs });
  for (const i of p.imgs) if (i.alt === undefined) add("img-without-alt", { path: p.path, src: i.src });
}
const dup = (key) => {
  const m = new Map();
  // pages that declare another URL as canonical are intentional duplicates
  for (const p of pages) if (p[key] && p.canonical === SITE + p.path) m.set(p[key], [...(m.get(p[key]) || []), p.path]);
  return [...m.entries()].filter(([, v]) => v.length > 1).map(([value, paths]) => ({ value, paths }));
};
for (const d of dup("title")) add("duplicate-title", d);
for (const d of dup("description")) add("duplicate-description", d);

// internal links and images
const internal = new Set();
const images = new Set();
const linkSources = new Map();
for (const p of pages) {
  for (const l of p.links) {
    if (/^(mailto:|tel:|#|javascript:)/.test(l)) continue;
    const u = new URL(l, BASE + p.path);
    if (u.origin !== BASE && u.origin !== SITE) continue;
    const key = u.pathname;
    internal.add(key);
    if (!linkSources.has(key)) linkSources.set(key, p.path);
  }
  for (const i of p.imgs) if (i.src && !i.src.startsWith("data:")) images.add(new URL(i.src, BASE + p.path).href);
}
const linkResults = await pool([...internal], 12, async (k) => ({ k, ...(await status(BASE + k)) }));
for (const r of linkResults) if (r.status !== 200) add("broken-internal-link", { target: r.k, status: r.status, location: r.location, from: linkSources.get(r.k) });
const imgResults = await pool([...images], 12, async (u) => ({ u, ...(await status(u)) }));
for (const r of imgResults) if (r.status !== 200) add("broken-image", { src: r.u, status: r.status });

// every recovered original URL must still resolve (200, or a deliberate redirect / documented exclusion)
const recovered = JSON.parse(fs.readFileSync(path.resolve(RECOVERY_PAGES), "utf8")).map((p) => p.path);
const orig = await pool(recovered, 12, async (p) => ({ p, ...(await status(BASE + p)) }));
const byStatus = {};
for (const r of orig) (byStatus[r.status] ||= []).push(r.p);

const summary = {
  base: BASE,
  pagesChecked: pages.length,
  internalLinkTargets: internal.size,
  imagesChecked: images.size,
  pagesWithJsonLd: pages.filter((p) => p.jsonld > 0).length,
  originalUrls: { total: recovered.length, byStatus: Object.fromEntries(Object.entries(byStatus).map(([s, v]) => [s, v.length])) },
  problemCounts: problems.reduce((a, p) => ((a[p.kind] = (a[p.kind] || 0) + 1), a), {}),
};
fs.mkdirSync("test-results", { recursive: true });
fs.writeFileSync("test-results/crawl.json", JSON.stringify({ summary, problems, originalUrlsByStatus: byStatus }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const p of problems.slice(0, 25)) console.log(" -", JSON.stringify(p).slice(0, 220));
