#!/usr/bin/env node
/* Post-build: add <image:image> entries (Google image sitemap) to every sitemap URL —
   content photos from the page itself (not icons/logos), so expo photos rank in Image Search.
   Up to 40 per page: a gallery page (/venue/gallery/, a show's photo report) is the page
   those photos should rank from, and Google reads up to 1,000 per URL. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = process.argv[2] || 'dist';
const SITE = (process.env.SITE || 'https://sof-expo.com').replace(/\/+$/, '');
const file = join(ROOT, 'sitemap-0.xml');
if (existsSync(file)) {
  let src = readFileSync(file, 'utf8');
  if (!src.includes('xmlns:image=')) src = src.replace('<urlset ', '<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" ');
  let total = 0;
  src = src.replace(/<url>([\s\S]*?)<\/url>/g, (block, inner) => {
    if (inner.includes('<image:image>')) return block;
    const loc = inner.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!loc) return block;
    const rel = loc.replace(SITE, '').replace(/^\/+|\/+$/g, '');
    const html = join(ROOT, rel, 'index.html');
    if (!existsSync(html)) return block;
    const main = (readFileSync(html, 'utf8').match(/<main[\s\S]*<\/main>/) || [''])[0];
    const seen = new Set();
    for (const m of main.matchAll(/<img[^>]*\ssrc="(\/images\/[^"]+\.(?:jpe?g|webp|png))"/g)) {
      seen.add(SITE + m[1]);
      if (seen.size >= 40) break;
    }
    if (!seen.size) return block;
    total += seen.size;
    const imgs = [...seen].map((u) => `<image:image><image:loc>${u}</image:loc></image:image>`).join('');
    return `<url>${inner}${imgs}</url>`;
  });
  writeFileSync(file, src);
  console.log(`sitemap: ${total} image entries added`);
}
