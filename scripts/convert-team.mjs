/**
 * One-shot helper: turn the client's PNG team posters into a clean JPEG source
 * inside `images/team/` so `scripts/build-photos.mjs` can run them through the
 * same ladder as every other photograph on the site.
 *
 * The originals are 1254×1254 PNG artboards with the SOF EXPO brand frame baked
 * in — we keep the square aspect and downscale to 1600 max (they're already
 * under that), then JPEG them at quality 86 so the type on the cards stays
 * crisp when the ladder's smallest rung is 400w.
 */
import { mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "images/team-original";
const OUT = "images/team";

mkdirSync(OUT, { recursive: true });

for (const f of await readdir(SRC)) {
  const src = path.join(SRC, f);
  const base = f.replace(/\.(png|PNG)$/, ".jpg");
  const out = path.join(OUT, base);
  if (!existsSync(src)) continue;
  await sharp(src, { failOn: "none" })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .jpeg({ quality: 86, progressive: true, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(out);
  process.stdout.write(`· ${base}\n`);
}

console.log(`${(await readdir(OUT)).length} team sources ready in ${OUT}`);