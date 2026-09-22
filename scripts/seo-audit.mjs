#!/usr/bin/env node
/**
 * SEO + accessibility audit over the built site (dist/).
 * Run after `npm run build`:  node scripts/seo-audit.mjs
 *
 * Checks are the ones that decide whether a fresh international site can reach the
 * top of the SERP: unique and well-sized metadata, exactly one h1, hreflang pairs that
 * resolve, canonicals that match the file layout, no broken internal links, alt text on
 * every image, and no orphan pages.
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";

const SITE_URL = process.env.SITE_URL || "https://sofexpo.org";
const ROOT = process.argv[2] ?? "dist";
/** `--host foodera.sofexpo.org --peers dist-hosts`: count inbound links that arrive from the
 *  sibling hosts of a multi-host build, so a page linked only from the centre is not an orphan. */
const argOf = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
};
const THIS_HOST = argOf("host");
const PEERS = argOf("peers");
if (!existsSync(ROOT)) {
  console.error(`No ${ROOT}. Run "npm run build" first.`);
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".html")) files.push(p);
  }
})(ROOT);

const urlOf = (file) => {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  return "/" + rel.replace(/index\.html$/, "");
};

const problems = [];
const warn = (url, msg) => problems.push({ url, msg });

const titleByUrl = new Map();
const descriptions = new Map();
const allUrls = new Set(files.map(urlOf));
const inbound = new Map([...allUrls].map((u) => [u, 0]));
const internalHrefs = new Set();

for (const file of files) {
  const url = urlOf(file);
  /* the bare root is a 301 redirect document (docs/08 §7, Q1), not a content
     page: no h1/og/hreflang contract — the existence check below still runs */
  if (url === "/") continue;
  const isPost = /^\/(ru|en)\/(news|articles)\/[^/]+\/$/.test(url);
  const htmlRaw = readFileSync(file, "utf8");
  const html = htmlRaw.replace(/<script[\s\S]*?<\/script>/g, "");

  for (const src of new Set(
    [...html.matchAll(/<img[^]+?src="([^"]+)"/g)].map((m) => m[1]),
  )) {
    if (/^(https?:|data:)/.test(src)) continue;
    const rel = src.replace(/^\/+/, "").split("?")[0];
    if (!existsSync(join(ROOT, rel)))
      warn(url, `img src not found on disk: /${rel}`);
  }

  {
    const ogImg = html.match(/property="og:image" content="([^"]+)"/)?.[1];
    if (ogImg && /^https?:\/\//.test(ogImg)) {
      const rel = ogImg.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "");
      if (rel && !existsSync(join(ROOT, rel)))
        warn(url, `og:image missing on disk: /${rel}`);
    }
  }

  const title =
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/) ?? [])[1]
      ?.replace(/\s+/g, " ")
      .trim() ?? "";
  if (!title) warn(url, "missing <title>");
  if (title) {
    if (title.length > (isPost ? 96 : 78))
      warn(url, `title too long (${title.length} chars)`);
    if (title.length < 22) warn(url, `title too short (${title.length} chars)`);
    titleByUrl.set(url, title);
  }

  const desc =
    (html.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? "";
  if (!desc) warn(url, "missing meta description");
  if (desc && (desc.length < 60 || desc.length > (isPost ? 210 : 185)))
    warn(url, `description length ${desc.length}`);
  descriptions.set(url, desc);

  const h1 = html.match(/<h1[\s>]/g) ?? [];
  if (h1.length !== 1) warn(url, `${h1.length} <h1> elements`);

  const robots =
    (html.match(/<meta name="robots" content="([^"]+)"/) ?? [])[1] ?? "";
  const noindex = robots.includes("noindex");

  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) ??
    [])[1];
  if (!noindex) {
    if (!canonical) warn(url, "missing canonical");
    else if (!canonical.startsWith("https://"))
      warn(url, `canonical is not absolute: ${canonical}`);
  }

  if (!noindex) {
    for (const need of ["og:title", "og:description", "og:image", "og:url"]) {
      if (!html.includes(`property="${need}"`)) warn(url, `missing ${need}`);
    }
    if (!htmlRaw.includes("application/ld+json")) warn(url, "no JSON-LD block");
  }

  // hreflang: every alternates pair must exist on disk and point at the same page.
  const alts = [
    ...html.matchAll(
      /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g,
    ),
  ].map((m) => ({ lang: m[1], href: m[2] }));
  if (!noindex) {
    const path = url.replace(/^\/ru\//, "/").replace(/^\/en\//, "/");
    if (!alts.some((a) => a.lang === "x-default"))
      warn(url, "missing x-default alternate");
    for (const lang of ["ru", "en"]) {
      const want = `/${lang}${path === "/" ? "/" : ""}`.replace(/\/{2,}/g, "/");
      const found = alts.find((a) => a.lang === lang);
      if (!found) {
        if (alts.length) warn(url, `missing hreflang ${lang}`);
        continue;
      }
      const hrefPath = found.href.replace(/^https?:\/\/[^/]+/, "");
      if (!allUrls.has(hrefPath) && hrefPath !== want)
        warn(url, `hreflang ${lang} points to ${hrefPath} (not built)`);
    }
  }

  // internal links (only real anchors; head links are handled above)
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
    let target = href;
    if (!target.startsWith("/")) {
      target = resolve(dirname(url), href).replace(/\\/g, "/");
    }
    const isFile = /\.[a-z0-9]+$/i.test(target);
    if (!isFile && !target.endsWith("/")) target += "/";
    internalHrefs.add(target);
    const ok = isFile
      ? existsSync(join(ROOT, target.replace(/^\//, "")))
      : allUrls.has(target);
    if (!ok) warn(url, `broken internal link → ${target}`);
    else if (target !== url && allUrls.has(target))
      inbound.set(target, (inbound.get(target) ?? 0) + 1);
  }

  // images need alt text and dimensions
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    /* an empty alt is only allowed on an image that says so: a content photo must be describable.
       This rule used to exempt alt="" wholesale, which is how 136 images quietly shipped without
       a description. */
    const decorative = /role="presentation"|aria-hidden="true"/.test(tag);
    if (!/alt="[^"]*"/.test(tag)) warn(url, "img without alt attribute");
    else if (!/alt="[^"]{8,}"/.test(tag) && !decorative)
      warn(url, `img with thin or empty alt: ${tag.slice(0, 90)}`);
    if (/alt="\/images\/|alt="[a-z0-9-]+\.jpe?g"/i.test(tag))
      warn(url, `alt is a filename: ${tag.slice(0, 60)}`);
    if (!/loading="(eager|lazy)"/.test(tag))
      warn(
        url,
        `img without an explicit loading strategy: ${tag.slice(0, 70)}`,
      );
  }
}

// duplicate metadata across indexable pages
for (const [map, label] of [
  [titleByUrl, "title"],
  [descriptions, "description"],
]) {
  const seen = new Map();
  for (const [url, value] of map) {
    if (!value) continue;
    if (seen.has(value))
      warn(url, `duplicate ${label} with ${seen.get(value)}`);
    else seen.set(value, url);
  }
}

// peer-host links count as inbound: on an exhibition hostname the centre is the referrer
if (THIS_HOST && PEERS && existsSync(PEERS)) {
  const needle = new RegExp(
    `href="https:\\/\\/${THIS_HOST.replace(/\./g, "\\.")}(/[^"]*)"?`,
    "g",
  );
  for (const entry of readdirSync(PEERS)) {
    if (entry === THIS_HOST) continue;
    const dir = join(PEERS, entry);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of (function walk(d) {
      const out = [];
      for (const name of readdirSync(d)) {
        const full = join(d, name);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else if (full.endsWith(".html")) out.push(full);
      }
      return out;
    })(dir)) {
      for (const m of readFileSync(file, "utf8").matchAll(needle)) {
        let target = m[1];
        if (!target.endsWith("/") && !/\.[a-z0-9]+$/i.test(target))
          target += "/";
        if (allUrls.has(target))
          inbound.set(target, (inbound.get(target) ?? 0) + 1);
      }
    }
  }
}

// orphans: indexable pages with no inbound link (home + gate excluded)
for (const url of allUrls) {
  if (url === "/" || url === "/404") continue;
  const html = readFileSync(
    join(ROOT, url.replace(/^\//, ""), url.endsWith("/") ? "index.html" : ""),
    "utf8",
  );
  if (!url.startsWith("/ru/") && !url.startsWith("/en/")) continue;
  if (
    (html.match(/<meta name="robots" content="([^"]+)"/) ?? [])[1]?.includes(
      "noindex",
    )
  )
    continue;
  if ((inbound.get(url) ?? 0) === 0)
    warn(url, "orphan page (no internal links)");
}

// locale parity: every ru page should have an en sibling
const locales = ["ru", "en"];
for (const url of allUrls) {
  const m = url.match(/^\/(ru|en)\/(.*)$/);
  if (!m) continue;
  const other = `/${locales.find((l) => l !== m[1])}/${m[2]}`;
  if (!allUrls.has(other))
    warn(url, `no sibling in the other locale: ${other}`);
}

const indexHtml = existsSync(join(ROOT, "index.html"));
if (!indexHtml) warn("/", "missing root redirect page (301 to /en/)");
for (const asset of [
  "robots.txt",
  "sitemap-index.xml",
  "sitemap-0.xml",
  "llms.txt",
  "site.webmanifest",
  "favicon.svg",
  "og/default.jpg",
]) {
  if (!existsSync(join(ROOT, asset))) warn("/" + asset, "missing file");
}

/* ---- sitemap honesty: every <loc> exists, is indexable, and every indexable page is listed ---- */
const sitemapFile = join(ROOT, "sitemap-0.xml");
if (existsSync(sitemapFile)) {
  const xml = readFileSync(sitemapFile, "utf8");
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const seen = new Set();
  const seenPaths = new Set();
  for (const loc of locs) {
    let path = loc.replace(SITE_URL, "").replace(/^https?:\/\/[^/]+/, "");
    if (!path.startsWith("/")) path = "/" + path;
    if (!path.endsWith("/")) path += "/";
    if (seenPaths.has(path)) warn("/sitemap-0.xml", `duplicate <loc> ${loc}`);
    seenPaths.add(path);
    const rel = path.replace(/^\/+/, "").replace(/\/+$/, "");
    const html = rel ? join(ROOT, rel, "index.html") : join(ROOT, "index.html");
    if (!existsSync(html)) {
      warn("/sitemap-0.xml", `sitemap URL has no built page: ${loc}`);
      continue;
    }
    if (/name="robots" content="noindex/.test(readFileSync(html, "utf8"))) {
      warn("/sitemap-0.xml", `noindex page listed in the sitemap: ${loc}`);
    }
    seen.add(html);
  }
  for (const f of files) {
    const t = readFileSync(f, "utf8");
    if (/name="robots" content="index/.test(t) && !seen.has(f)) {
      warn(urlOf(f), "indexable page missing from the sitemap");
    }
  }
}

const counts = {
  pages: files.length,
  ru: files.filter((f) => /(^|\/)ru\//.test(f)).length,
  en: files.filter((f) => /(^|\/)en\//.test(f)).length,
  links: internalHrefs.size,
};

console.log(`\nSOF EXPO SEO audit — ${ROOT}`);
console.log(
  `pages: ${counts.pages} (ru ${counts.ru} / en ${counts.en}) · distinct internal targets: ${counts.links}`,
);
if (problems.length === 0) {
  console.log("✓ no problems found\n");
  process.exit(0);
}
const byKind = new Map();
for (const p of problems) {
  const key = p.msg
    .replace(/\(.*?\)/g, "")
    .replace(/: .*/, "")
    .replace(/^\w+ \d+ chars$/, (s) => s);
  byKind.set(key, (byKind.get(key) ?? 0) + 1);
}
console.log(`✗ ${problems.length} problem(s):\n`);
for (const [kind, n] of [...byKind.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 14))
  console.log(`  ${String(n).padStart(4)}  ${kind}`);
console.log("\nfirst 40 details:");
for (const p of problems.slice(0, 40)) console.log(`  ${p.url} — ${p.msg}`);
console.log("");
process.exit(problems.length > 0 ? 1 : 0);
