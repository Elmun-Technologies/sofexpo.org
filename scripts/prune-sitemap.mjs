#!/usr/bin/env node
/**
 * Post-build: drop every <url> whose page declares `noindex`.
 *
 * @astrojs/sitemap does not know about the `noindex` prop our routes pass to
 * Base.astro, and the past-edition event pages must stay out of the sitemap
 * while remaining linked (they hand equity to the live editions). The built
 * HTML is the single source of truth here, so this can never drift from the
 * pages themselves.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || 'dist';
/* per-host build: `SITE` is what Astro was given, so <loc> prefixes match (docs/05) */
const SITE = (process.env.SITE || 'https://sofexpo.org').replace(/\/+$/, '');

for (const name of ['sitemap-0.xml', 'sitemap-index.xml']) {
  const file = join(ROOT, name);
  if (!existsSync(file)) continue;
  if (name === 'sitemap-index.xml') continue;

  const src = readFileSync(file, 'utf8');
  const kept = [];
  let removed = [];

  for (const block of src.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
    const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!loc) {
      kept.push(block);
      continue;
    }
    const rel = loc.replace(SITE, '').replace(/^\/+/, '').replace(/\/+$/, '');
    const html = rel ? join(ROOT, rel, 'index.html') : join(ROOT, 'index.html');
    const noindex = existsSync(html) && /name="robots" content="noindex/.test(readFileSync(html, 'utf8'));
    if (noindex) removed.push(loc);
    else kept.push(block);
  }

  if (!removed.length) {
    console.log(`sitemap: no noindex URLs to prune (${kept.length} URLs)`);
    continue;
  }
  const head = src.slice(0, src.indexOf('<url>'));
  const tail = src.slice(src.lastIndexOf('</urlset>'));
  writeFileSync(file, `${head}${kept.join('')}${tail}`);
  console.log(
    `sitemap: pruned ${removed.length} noindex URL(s), ${kept.length} left`,
    ...removed.map((u) => `\n  - ${u}`),
  );
}
