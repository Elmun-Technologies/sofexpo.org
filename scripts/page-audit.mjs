/**
 * Per-page uniqueness & completeness audit (complements seo-audit.mjs).
 * Every indexable page must own: a unique <title>, meta description, <h1>, og:image
 * (its own card), canonical; all <img> must have alt; JSON-LD must parse; and no
 * long content paragraph may be copy-pasted on 4+ pages of the same locale.
 * Exit 1 on any finding.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const DIST = process.argv[2] || 'dist';
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : p.endsWith('index.html') ? [p] : []; });
const files = walk(DIST).filter((f) => /\/(en|ru|zh|tr)\//.test(f));
const problems = [];
const seen = { title: new Map(), desc: new Map(), h1: new Map(), og: new Map() };
const para = new Map();
const g = (h, re) => (h.match(re) ?? [])[1]?.trim() ?? '';
for (const f of files) {
  const h = readFileSync(f, 'utf8');
  if (/name="robots" content="noindex/.test(h) || /http-equiv="refresh"/.test(h)) continue;
  const url = f.slice(DIST.length).replace(/index\.html$/, '');
  const loc = url.split('/')[1];
  const vals = {
    title: g(h, /<title>([^<]*)<\/title>/),
    desc: g(h, /name="description" content="([^"]*)"/),
    h1: g(h, /<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '),
    og: g(h, /property="og:image" content="([^"]*)"/),
  };
  for (const [k, v] of Object.entries(vals)) {
    if (!v) { problems.push(`${url} missing ${k}`); continue; }
    const key = `${loc}|${v}`;
    if (seen[k].has(key)) problems.push(`${url} duplicate ${k} with ${seen[k].get(key)}`);
    else seen[k].set(key, url);
  }
  if (!/rel="canonical" href="https:\/\/sofexpo\.org\//.test(h)) problems.push(`${url} canonical missing`);
  for (const img of h.match(/<img\b[^>]*>/g) ?? []) if (!/\balt="/.test(img)) problems.push(`${url} <img> without alt`);
  for (const m of h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { problems.push(`${url} JSON-LD does not parse`); }
  }
  const main = (h.match(/<main[\s\S]*<\/main>/) ?? [''])[0]
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<form[\s\S]*?<\/form>|<[^>]*data-nosnippet[^>]*>[\s\S]*?<\/(?:p|aside|div)>/g, '')
    .replace(/<(article|a) class="(?:pc|ev)[\s\S]*?<\/\1>/g, ''); // cards are links to other pages, by design
  const local = new Set();
  for (const s of main.replace(/<[^>]+>/g, '\n').split('\n').map((x) => x.replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim()).filter((x) => x.length >= 60)) {
    if (local.has(s)) continue; local.add(s);
    const k = `${loc}|${s}`; para.set(k, (para.get(k) ?? []).concat(url));
  }
}
for (const [k, urls] of para) if (urls.length >= 4) problems.push(`repeated paragraph on ${urls.length} pages: "${k.split('|')[1].slice(0, 90)}…"`);
console.log(`page audit: ${files.length} pages checked`);
if (problems.length) { console.log(`✗ ${problems.length} finding(s):`); for (const p of problems.slice(0, 80)) console.log('  - ' + p); process.exit(1); }
console.log('✓ every page has its own title, description, h1, social card; no copy-pasted paragraphs');
