/**
 * Partner logos: images/partner-masters/<id>.{webp,png,svg} → public/images/partners/<id>.{webp,svg}
 * plus src/data/partner-logo-dims.json (the trimmed width × height the walls size from).
 *
 * The masters arrived as small rasters, several on their own plate (white, grey, beige, a
 * dark square), which read as pasted screenshots on the site's cards. Each one is cut free
 * of that plate here — flood-filled from the edges, so white inside a mark survives — then
 * trimmed to the ink, so every wall can size logos optically from their real proportions
 * (lib/partners.ts → logoBox). Vector masters are copied as is.
 * Run with `npm run logos:partners` when a master changes; the outputs are committed.
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, basename } from 'node:path';
import sharp from 'sharp';

const SRC = 'images/partner-masters';
const OUT = 'public/images/partners';
/* per logo: `plate` = remove the flat background around the mark (tolerance in RGB distance),
   `keepTop` = keep only the top share of the height (Artel's row of tiny product icons is
   illegible at wall size) */
const RULES = {
  agromir: { plate: 34 },
  artel: { plate: 34, keepTop: 0.66 },
  'grand-plaza': { plate: 46 },
  reikartz: { plate: 26 },
  sag: { plate: 34 },
  sibeco: { plate: 30 },
};
const MAX_H = 160; /* 2× the tallest a wall draws a logo (72px), rounded up */

function cutPlate(data, w, h, tol) {
  const at = (x, y) => (y * w + x) * 4;
  /* the plate colour = the median of the border pixels */
  const border = [];
  for (let x = 0; x < w; x += 1) border.push(at(x, 0), at(x, h - 1));
  for (let y = 0; y < h; y += 1) border.push(at(0, y), at(w - 1, y));
  const ref = [0, 1, 2].map((c) => border.map((i) => data[i + c]).sort((a, b) => a - b)[border.length >> 1]);
  const dist = (i) => Math.hypot(data[i] - ref[0], data[i + 1] - ref[1], data[i + 2] - ref[2]);
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (const i of border) if (dist(i) < tol) stack.push(i / 4);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const x = p % w;
    const y = (p - x) / w;
    data[p * 4 + 3] = 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const q = ny * w + nx;
      if (seen[q]) continue;
      if (dist(q * 4) < tol) stack.push(q);
      else {
        /* anti-aliased rim: fade by how close it still is to the plate, and pull the plate
           colour back out of it so no light/dark halo stays on the card */
        const d = dist(q * 4);
        if (d < tol * 2.6) {
          const a = Math.min(1, (d - tol) / (tol * 1.6));
          const i = q * 4;
          if (a > 0.04) for (let c = 0; c < 3; c += 1) data[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - ref[c] * (1 - a)) / a)));
          data[i + 3] = Math.min(data[i + 3], Math.round(a * 255));
        }
      }
    }
  }
}

function inkBox(data, w, h) {
  let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    if (data[(y * w + x) * 4 + 3] > 10) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const dims = {};
for (const file of readdirSync(SRC).sort()) {
  const ext = extname(file);
  const id = basename(file, ext);
  if (ext === '.svg') {
    copyFileSync(`${SRC}/${file}`, `${OUT}/${id}.svg`);
    const [, , w, h] = readFileSync(`${SRC}/${file}`, 'utf8').match(/viewBox="([\d.\s-]+)"/)[1].trim().split(/\s+/).map(Number);
    dims[id] = { w, h, ext: 'svg' };
    console.log(`· ${id}.svg  ${w}×${h}`);
    continue;
  }
  if (!['.webp', '.png', '.jpg'].includes(ext)) continue;
  const rule = RULES[id] || {};
  const meta = await sharp(`${SRC}/${file}`).metadata();
  let img = sharp(`${SRC}/${file}`).ensureAlpha();
  if (rule.keepTop) img = img.extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * rule.keepTop) });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  if (rule.plate) cutPlate(data, info.width, info.height, rule.plate);
  const box = inkBox(data, info.width, info.height);
  const pad = 2;
  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  const crop = { left, top, width: Math.min(info.width - left, box.width + pad * 2), height: Math.min(info.height - top, box.height + pad * 2) };
  const out = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract(crop)
    .resize({ height: MAX_H, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toBuffer();
  writeFileSync(`${OUT}/${id}.webp`, out);
  const m = await sharp(out).metadata();
  dims[id] = { w: m.width, h: m.height, ext: 'webp' };
  console.log(`· ${id}.webp  ${m.width}×${m.height}${rule.plate ? '  plate removed' : ''}${rule.keepTop ? '  cropped' : ''}`);
}
writeFileSync('src/data/partner-logo-dims.json', JSON.stringify(dims, null, 2) + '\n');
