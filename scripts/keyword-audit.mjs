/**
 * Keyword audit over the built site (docs/16-keyword-audit.md).
 *
 * For every page in scripts/keyword-map.mjs and every locale it lists, checks where each target
 * query appears: <title>, <h1>, meta description, the first 100 words of <main>, any <h2>, and
 * how often in the body. The primary query is scored out of 100; secondary queries only need
 * to appear somewhere on the page. It also reports cannibalisation (two pages whose titles carry
 * the same primary query) and titles that fit-meta.mjs had to cut, because a cut title loses
 * whatever keyword stood after the separator.
 *
 *   node scripts/keyword-audit.mjs [dist] [--json out.json] [--min 70]
 *
 * Exits 1 when a priority-A primary query scores under --min (default 70) — the money pages
 * are the ones a regression must not slip through.
 */
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { keywordMap, sectionRule, normalize } from './keyword-map.mjs';

const args = process.argv.slice(2);
const DIST = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a) && !a.endsWith('.json')) ?? 'dist';
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const MIN = args.includes('--min') ? Number(args[args.indexOf('--min') + 1]) : 70;

const dec = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = (h) => dec(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const g = (h, re) => (h.match(re) ?? [])[1] ?? '';

function read(locale, path) {
  const f = join(DIST, locale, path, 'index.html');
  if (!existsSync(f)) return null;
  const h = readFileSync(f, 'utf8');
  const main = g(h, /<main[^>]*>([\s\S]*)<\/main>/);
  const body = strip(main);
  return {
    noindex: /name="robots" content="noindex/.test(h),
    title: normalize(dec(g(h, /<title>([^<]*)<\/title>/))),
    desc: normalize(dec(g(h, /name="description" content="([^"]*)"/))),
    h1: normalize(strip(g(h, /<h1[^>]*>([\s\S]*?)<\/h1>/))),
    h2: [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => normalize(strip(m[1]))).join(' | '),
    first: normalize(body.split(' ').slice(0, 100).join(' ')),
    body: normalize(body),
  };
}

const has = (text, stems) => stems.every((s) => new RegExp(s).test(text));
const count = (text, stems) => {
  /* occurrences of the rarest stem — a phrase cannot occur more often than its rarest word */
  return Math.min(...stems.map((s) => (text.match(new RegExp(s, 'g')) ?? []).length));
};
const WEIGHTS = { title: 35, h1: 25, desc: 15, first: 10, h2: 5, body: 10 };

function score(page, kw) {
  const hit = {
    title: has(page.title, kw.s),
    h1: has(page.h1, kw.s),
    desc: has(page.desc, kw.s),
    first: has(page.first, kw.s),
    h2: has(page.h2, kw.s),
  };
  const freq = count(page.body, kw.s);
  hit.body = freq >= 2;
  const total = Object.entries(WEIGHTS).reduce((n, [f, w]) => n + (hit[f] ? w : 0), 0);
  return { ...hit, freq, score: total };
}

/* expand section pages: the segment name is the page's own h1 */
const map = { ...keywordMap };
const ls = (d) => (existsSync(d) ? readdirSync(d) : []);
for (const show of ls(join(DIST, 'en', 'events'))) {
  for (const seg of ls(join(DIST, 'en', 'events', show, 'sections'))) {
    const path = `/events/${show}/sections/${seg}/`;
    /* the h1 minus its kicker span (docs/16 §2.2) is the segment name */
    const name = (l) => strip(g(readFileSync(join(DIST, l, path, 'index.html'), 'utf8'), /<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<span class="kicker"[^>]*>[\s\S]*?<\/span>/, ''));
    map[path] = { ru: sectionRule.ru(name('ru')), en: sectionRule.en(name('en')) };
  }
}

const rows = [];
for (const [path, locales] of Object.entries(map)) {
  for (const [locale, kws] of Object.entries(locales)) {
    const page = read(locale, path === '/' ? '' : path);
    if (!page || page.noindex) continue;
    const [primary, ...secondary] = kws;
    const p = score(page, primary);
    rows.push({
      path: `/${locale}${path}`,
      locale,
      priority: primary.p,
      query: primary.q,
      ...p,
      secondary: secondary.map((kw) => ({ q: kw.q, found: has(page.title + ' ' + page.desc + ' ' + page.h1 + ' ' + page.h2 + ' ' + page.body, kw.s) })),
      pageTitle: page.title,
    });
  }
}

/* cannibalisation: the same primary query in the titles of two pages of one locale */
const cannibal = [];
for (const r of rows) {
  const kw = Object.values(map[r.path.replace(/^\/\w+/, '')] ?? {}).flat().find((x) => x.q === r.query);
  if (!kw || kw.p !== 'A') continue;
  const rivals = rows.filter((o) => o !== r && o.locale === r.locale && has(o.pageTitle, kw.s) && o.priority !== 'A' && !o.path.includes('/sections/'));
  if (rivals.length) cannibal.push({ path: r.path, query: r.query, rivals: rivals.map((o) => o.path) });
}

const pad = (s, n) => String(s).padEnd(n);
const mark = (b) => (b ? '✓' : '·');
console.log(`keyword audit: ${rows.length} page×locale targets\n`);
console.log(pad('score', 6) + pad('P', 2) + 'T H1 D F H2 B  ' + pad('path', 58) + 'query');
for (const r of [...rows].sort((a, b) => a.score - b.score)) {
  console.log(pad(r.score, 6) + pad(r.priority, 2) + [r.title, r.h1, r.desc, r.first, r.h2, r.body].map(mark).join(' ').replace(/^(\S)/, '$1') + '  ' + pad(r.path, 58) + r.query + (r.secondary.some((s) => !s.found) ? `  [missing: ${r.secondary.filter((s) => !s.found).map((s) => s.q).join('; ')}]` : ''));
}
const avg = (xs) => Math.round(xs.reduce((n, r) => n + r.score, 0) / (xs.length || 1));
console.log(`\naverage score: all ${avg(rows)} · A ${avg(rows.filter((r) => r.priority === 'A'))} · ru ${avg(rows.filter((r) => r.locale === 'ru'))} · en ${avg(rows.filter((r) => r.locale === 'en'))} · uz ${avg(rows.filter((r) => r.locale === 'uz'))}`);
console.log(`primary query in <title>: ${rows.filter((r) => r.title).length}/${rows.length} · in <h1>: ${rows.filter((r) => r.h1).length}/${rows.length}`);
if (cannibal.length) {
  console.log(`\npossible cannibalisation (${cannibal.length}):`);
  for (const c of cannibal) console.log(`  ${c.path} «${c.query}» also in the title of ${c.rivals.join(', ')}`);
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ rows, cannibal }, null, 1));

const failing = rows.filter((r) => r.priority === 'A' && r.score < MIN);
if (failing.length) {
  console.log(`\n✗ ${failing.length} money page(s) under ${MIN}:`);
  for (const r of failing) console.log(`  - ${r.path} «${r.query}» ${r.score}`);
  process.exit(1);
}
console.log(`\n✓ every priority-A query scores ≥ ${MIN}`);
