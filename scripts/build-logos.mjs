/**
 * Show logos: images/brand-masters/<master> → public/brand/<id>/logo.{webp,png}.
 *
 * The masters are the organiser's own artwork (badge, poster crops — docs/15 §10). Each
 * output is padded on its own plate colour, so the raster edge never shows on the site,
 * and written at 2× the largest size the site draws it (hero: 64px tall, wide logos 240px).
 * Run with `npm run logos` when a master changes; the outputs are committed.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const logos = JSON.parse(readFileSync('src/data/show-logos.json', 'utf8'));
const dims = {};
for (const [slug, l] of Object.entries(logos)) {
  if (slug.startsWith('_')) continue;
  const out = `public/brand/${l.id}`;
  mkdirSync(out, { recursive: true });
  const round = l.shape === 'round';
  const H = round ? 256 : 160;
  const pad = round ? 0 : Math.round(H * 0.14);
  const inner = await sharp(`images/brand-masters/${l.master}`)
    .resize({ height: H - pad * 2, width: round ? H : 900, fit: 'inside', kernel: 'lanczos3' })
    .toBuffer();
  const { width: iw } = await sharp(inner).metadata();
  const W = round ? H : iw + pad * 2;
  const canvas = sharp({ create: { width: W, height: H, channels: 4, background: l.plate } })
    .composite([{ input: inner, gravity: 'centre' }]);
  const png = await canvas.png({ compressionLevel: 9, palette: !round }).toBuffer();
  writeFileSync(`${out}/logo.png`, png);
  await sharp(png).webp({ quality: 90 }).toFile(`${out}/logo.webp`);
  dims[slug] = [W, H];
  console.log(`· ${l.id}/logo  ${W}×${H}`);
}
writeFileSync('src/data/show-logo-dims.json', JSON.stringify(dims, null, 2) + '\n');
