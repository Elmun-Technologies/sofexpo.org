/**
 * Real photography pipeline.
 *
 * `images/` holds the client's original photographs (SOF EXPO Samarkand halls, stands,
 * visitors, the building itself). This script maps each of them onto the semantic file
 * names the site already references in `public/images/`, and emits an optimised ladder:
 *
 *   public/images/<name>.jpg          — 1600w (or the source width) JPEG fallback
 *   public/images/<name>-640.webp     — small card
 *   public/images/<name>-1024.webp    — medium / two-column
 *   public/images/<name>-1600.webp    — hero / full-bleed
 *
 * Nothing in the markup has to know which photograph is behind a name: swapping a source
 * here re-skins the whole site. Run with `npm run photos`.
 */
import { mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'images';
const OUT = 'public/images';
const WIDTHS = [640, 1024, 1600];

/** name → [source file, focal position] ; position drives the smart crop. */
const MAP = {
  /* ── the hall, the building, the floor ───────────────────────────── */
  'hero-hall': ['Expo2024_7-1.jpg', 'centre'],
  'hall-crowd': ['1-3-768x432.jpg', 'centre'],
  'hall-stand': ['15.webp', 'centre'],
  'hall-walk': ['7-768x432.jpg', 'centre'],
  'hall-empty': ['20220624_144816-scaled-1-1536x865.jpg', 'centre'],
  'hall-windows': ['20220624_144839-scaled-1-1536x865.jpg', 'centre'],
  'venue-exterior': ['IMG_20220514_220651-1-scaled-1-1536x755.jpg', 'centre'],
  'venue-facade': ['4-3-1536x864.jpg', 'centre'],
  'venue-conference': ['1-2-1536x864.jpg', 'centre'],
  'conference-audience': ['4-2-1536x864.jpg', 'centre'],
  'outdoor-area': ['6-768x432.jpg', 'centre'],

  /* ── the shows ───────────────────────────────────────────────────── */
  'event-foodera': ['5-2-768x432.jpg', 'centre'],
  'event-agropro': ['3-3-768x432.jpg', 'centre'],
  'event-buildpro': ['16.webp', 'centre'],
  'event-ecom': ['10.webp', 'centre'],
  'event-promotors': ['11.webp', 'centre'],
  'event-worldedu': ['agro-expo-samarkand-768x512.webp', 'centre'],

  /* ── people, product, service ────────────────────────────────────── */
  'food-tasting': ['5-2-768x432.jpg', 'centre'],
  'food-tasting-counter': ['9-768x432.jpg', 'centre'],
  'supermarket-aisle': ['8-768x432.jpg', 'centre'],
  'greenhouse-tomatoes': ['13.webp', 'centre'],
  'students-campus': ['agro-expo-uzbekistan-3-768x512.webp', 'centre'],
  'office-people': ['12-1536x864.jpg', 'centre'],
  'officials-tour': ['agro-expo-uzbekistan-768x512.webp', 'centre'],
  'stand-equipment': ['2-3-768x432.jpg', 'centre'],
  'stand-agro': ['9-768x432.jpg', 'centre'],
  'stand-modern': ['12.webp', 'centre'],
  'stand-green': ['13.webp', 'centre'],
  'buyers-talk': ['4-4-768x432.jpg', 'centre'],
  'visitors-flowers': ['agro-expo-uzbekistan-2-768x512.webp', 'centre'],
  'machinery-outdoor': ['1-1-768x512.webp', 'centre'],

  /* ── the paperwork layer (badges, plans, contracts) ──────────────── */
  'badge-lanyard': ['3-2-1536x864.jpg', 'centre'],
  'documents': ['5-1-1536x864.jpg', 'centre'],
  'floor-plan': ['17-2048x1449.png', 'centre'],
  'hall-plan': ['222.png', 'centre'],

  /* ── travel & stay ───────────────────────────────────────────────── */
  'hotel-room': ['1-1-1536x864.jpg', 'centre'],
  'hotel-facade': ['2-1-1536x864.jpg', 'centre'],
  'car-road': ['2-2-1536x864.jpg', 'centre'],
};

/** names that must keep the source aspect (plans/diagrams must not be cropped) */
const NO_CROP = new Set(['floor-plan', 'hall-plan']);

/**
 * Full-bleed heroes. The client's show photography is mostly 768px wide, which is fine for a
 * card but visibly soft stretched across a 1920px hero. For these names only, the ladder is
 * allowed to upscale with Lanczos + a light unsharp pass — under the hero's dark wash that
 * reads as a clean photograph rather than a blurred one, and the file stays under ~180 KB.
 */
const HERO = new Set([
  'hero-hall',
  'event-foodera',
  'event-agropro',
  'event-buildpro',
  'event-ecom',
  'event-promotors',
  'event-worldedu',
  'venue-exterior',
  'hall-crowd',
  'hall-stand',
  'venue-conference',
  'conference-audience',
]);

const ratio = 16 / 10;

async function one(name, [file]) {
  const src = path.join(SRC, file);
  if (!existsSync(src)) {
    console.warn(`  ! missing source ${src} for ${name}`);
    return 0;
  }
  const meta = await sharp(src).metadata();
  const hero = HERO.has(name);
  const maxW = hero ? 1600 : Math.min(1600, meta.width ?? 1600);
  let bytes = 0;

  const base = () => {
    const p = sharp(src, { failOn: 'none' }).rotate();
    return NO_CROP.has(name)
      ? p
      : p.resize({ width: maxW, kernel: 'lanczos3', withoutEnlargement: !hero });
  };

  const crop = (w) => {
    const p = sharp(src, { failOn: 'none' }).rotate();
    if (NO_CROP.has(name)) return p.resize({ width: Math.min(w, maxW), withoutEnlargement: true });
    const out = p.resize({
      width: Math.min(w, maxW),
      height: Math.round(Math.min(w, maxW) / ratio),
      fit: 'cover',
      position: 'attention',
      kernel: 'lanczos3',
      withoutEnlargement: !hero,
    });
    return hero && (meta.width ?? 0) < w ? out.sharpen({ sigma: 0.8, m1: 0.6, m2: 1.4 }) : out;
  };

  const jpg = path.join(OUT, `${name}.jpg`);
  await base().jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(jpg);
  bytes += statSync(jpg).size;

  for (const w of WIDTHS) {
    if (w > maxW + 80) continue;
    const out = path.join(OUT, `${name}-${w}.webp`);
    /* bigger rung = seen larger but also further from the eye's detail budget: the quality
       ladder drops as the pixel count climbs, which is what keeps a 1600w hero under 200 KB */
    const q = w >= 1600 ? 64 : w >= 1024 ? 70 : 74;
    await crop(w).webp({ quality: q, effort: 6 }).toFile(out);
    bytes += statSync(out).size;
  }
  return bytes;
}

mkdirSync(OUT, { recursive: true });
const before = (await readdir(OUT)).length;
let total = 0;
for (const [name, def] of Object.entries(MAP)) {
  total += await one(name, def);
  process.stdout.write(`· ${name}\n`);
}
console.log(
  `\n${Object.keys(MAP).length} names built from real photography · ${(total / 1024 / 1024).toFixed(2)} MB · ${before} → ${(await readdir(OUT)).length} files`,
);

/* Legacy assets that already live in public/images but have no source in images/ (the
   Samarkand city shots, travel photography) still need the same ladder, otherwise a
   <Photo> call site would point srcset at files that do not exist. */
const built = new Set(Object.keys(MAP));
for (const f of await readdir(OUT)) {
  const mm = /^([a-z0-9-]+)\.jpg$/.exec(f);
  if (!mm || built.has(mm[1])) continue;
  const name = mm[1];
  const src = path.join(OUT, f);
  const meta = await sharp(src).metadata();
  for (const w of WIDTHS) {
    if (w > (meta.width ?? 0) + 80) continue;
    await sharp(src)
      .resize({ width: w, height: Math.round(w / ratio), fit: 'cover', position: 'attention', withoutEnlargement: true })
      .webp({ quality: 72, effort: 5 })
      .toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  console.log(`· ${name} (legacy)`);
}


/* A manifest so <Photo> can emit a srcset of files that actually exist: a 768px source
   has no 1600w rung, and pointing at one would be a 404 per card. */
const manifest = {};
for (const f of await readdir(OUT)) {
  const mm = /^([a-z0-9-]+)-(\d+)\.webp$/.exec(f);
  if (!mm) continue;
  (manifest[mm[1]] ??= []).push(Number(mm[2]));
}
for (const k of Object.keys(manifest)) manifest[k].sort((a, b) => a - b);
writeFileSync('src/data/photos.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${Object.keys(manifest).length} photos`);
