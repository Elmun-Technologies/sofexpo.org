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
import { mkdirSync, existsSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'images';
const OUT = 'public/images';
const WIDTHS = [640, 1024, 1600, 2048];

/** name → [source file, focal position] ; position drives the smart crop. */
const MAP = {
  /* ── the hall, the building, the floor ───────────────────────────── */
  'hero-hall': ['sofexpo-uz/hall-aerial.jpg', 'centre'],
  'hall-crowd': ['1-3-768x432.jpg', 'centre'],
  'hall-stand': ['sofexpo-uz/stand-glass.jpg', 'centre'],
  'hall-walk': ['sofexpo-uz/hall-panorama.jpg', 'centre'],
  'hall-empty': ['20220624_144816-scaled-1-1536x865.jpg', 'centre'],
  'hall-windows': ['20220624_144839-scaled-1-1536x865.jpg', 'centre'],
  'venue-exterior': ['IMG_20220514_220651-1-scaled-1-1536x755.jpg', 'centre'],
  /* 2026-10-04 (docs/15 §10): every name below now shows what it says — several pointed at
     stock frames or at another show's stand */
  'venue-facade': ['sofexpo-uz/exterior-1.jpg', 'centre'],
  'venue-conference': ['sofexpo-uz/speaker.jpg', 'centre'],
  'conference-audience': ['sofexpo-uz/speaker.jpg', 'centre'],
  'outdoor-area': ['client-2026-10/outdoor-area-3.jpg', 'centre'],

  /* ── the shows ───────────────────────────────────────────────────── */
  'event-foodera': ['client-2026-10/non.jpg', 'centre'],
  'event-agropro': ['sofexpo-uz/agro-machines.jpg', 'centre'],
  'event-buildpro': ['sofexpo-uz/stand-berat.jpg', 'centre'],
  'event-ecom': ['client-2026-10/ecom.jpg', 'centre'],
  'event-promotors': ['client-2026-10/drift.jpg', 'centre'],
  'event-worldedu': ['sofexpo-uz/edu-crowd.jpg', 'centre'],

  /* ── people, product, service ────────────────────────────────────── */
  'food-tasting': ['client-2026-10/chefs.jpg', 'centre'],
  'food-tasting-counter': ['client-2026-10/driedfruit.jpg', 'centre'],
  'supermarket-aisle': ['sofexpo-uz/stand-lights.jpg', 'centre'],
  'greenhouse-tomatoes': ['client-2026-10/food.jpg', 'centre'],
  'students-campus': ['sofexpo-uz/hall-crowd-world-edu.jpg', 'centre'],
  'office-people': ['sofexpo-uz/meeting-room-2.jpg', 'centre'],
  'officials-tour': ['sofexpo-uz/opening-officials.jpg', 'centre'],
  'stand-equipment': ['sofexpo-uz/stand-equip.jpg', 'centre'],
  'stand-agro': ['sofexpo-uz/stand-talk.jpg', 'centre'],
  'stand-modern': ['12.webp', 'centre'],
  'stand-green': ['13.webp', 'centre'],
  'buyers-talk': ['sofexpo-uz/b2b-talk.jpg', 'centre'],
  'visitors-flowers': ['sofexpo-uz/visitors-flowers.jpg', 'centre'],
  'machinery-outdoor': ['sofexpo-uz/tractors.jpg', 'centre'],

  /* ── the paperwork layer (badges, plans, contracts) ──────────────── */
  'badge-lanyard': ['3-2-1536x864.jpg', 'centre'],
  'documents': ['5-1-1536x864.jpg', 'centre'],
  'floor-plan': ['17-2048x1449.png', 'centre'],
  'hall-plan': ['222.png', 'centre'],

  /* ── more of the floor: the client sent far more than six usable frames ── */
  'stand-agro-chem': ['sofexpo-uz/visitors-7.jpg', 'centre'],
  'opening-ceremony': ['sofexpo-uz/opening.jpg', 'centre'],
  'stand-fertilizer': ['sofexpo-uz/stand-agro-2.jpg', 'centre'],
  'stand-industrial': ['sofexpo-uz/stand-equip.jpg', 'centre'],
  'conference-room': ['sofexpo-uz/conf-room.jpg', 'centre'],
  'hall-aisle-red': ['client-2026-10/hall-wide-5.jpg', 'centre'],
  'cafe-interior': ['sofexpo-uz/cafe-restaurant.jpg', 'centre'],
  'venue-aerial': ['sofexpo-uz/hall-aerial2.jpg', 'centre'],

  /* ── plans and identity ─────────────────────────────────────────── */
  'site-plan': ['Ресурс-1map1-1536x794.png', 'centre'],
  'site-section': ['Ресурс-2map2-1536x711.png', 'centre'],
  'expo-banner': ['Banners-1-2048x1287.png', 'centre'],

  /* ── travel & stay ───────────────────────────────────────────────── */
  'hotel-room': ['sofexpo-uz/hall-empty-3.jpg', 'centre'],
  'hotel-facade': ['sofexpo-uz/hotel.jpg', 'centre'],
  'car-road': ['sofexpo-uz/transfer.jpg', 'centre'],

  /* ── 2026-10-12: full-size frames from sofexpo.uz (images/sofexpo-uz/). The names above
     that used to sit on 768px CMS thumbnails now point at the same shots at 1536–1800px,
     and the names below give each page its own frame instead of the same three photos ── */
  'hall-aerial': ['sofexpo-uz/hall-aerial.jpg', 'centre'],
  'hall-aerial-2': ['sofexpo-uz/hall-aerial2.jpg', 'centre'],
  'hall-wide': ['sofexpo-uz/hall-wide-1.jpg', 'centre'],
  'hall-busy': ['sofexpo-uz/hall-wide-6.jpg', 'centre'],
  'stand-two-level': ['sofexpo-uz/stand-2level.jpg', 'centre'],
  'stand-falcon': ['sofexpo-uz/stand-blue-tall.jpg', 'centre'],
  'stand-nrg': ['sofexpo-uz/stand-nrg.jpg', 'centre'],
  'stand-lights': ['sofexpo-uz/stand-lights.jpg', 'centre'],
  'stand-basalt': ['sofexpo-uz/stand-basalt.jpg', 'centre'],
  'stand-agro-hall': ['sofexpo-uz/stand-agro-2.jpg', 'centre'],
  'stand-house-model': ['sofexpo-uz/stand-house.jpg', 'centre'],
  'stand-building-models': ['sofexpo-uz/stand-building-models.jpg', 'centre'],
  'stand-shell': ['site-2026-10/stand-1.jpg', 'centre'],
  'conference-stage': ['sofexpo-uz/conf-stage.jpg', 'centre'],
  'conference-rows': ['sofexpo-uz/conf-rows.jpg', 'centre'],
  'meeting-room': ['sofexpo-uz/meeting-room.jpg', 'centre'],

  /* ── 2026-10 redesign (docs/18): real photos from the new site package (sofexpo.uz) ── */
  'hall-panorama': ['site-2026-10/hall-panorama.jpg', 'centre'],
  'venue-flags': ['site-2026-10/exterior-1.jpg', 'centre'],
  'outdoor-tractors': ['site-2026-10/outdoor-tractors-building.jpg', 'centre'],
  'registan-night': ['site-2026-10/registan-night.jpg', 'centre'],
  'stand-dark': ['site-2026-10/stand-dark-art.jpg', 'centre'],
  'b2b-meeting': ['site-2026-10/b2b-meeting-2.jpg', 'centre'],
  'stand-exhibitor': ['site-2026-10/stand-1.jpg', 'centre'],
  'opening-crowd': ['site-2026-10/opening-crowd.jpg', 'centre'],
};

/* `node scripts/build-photos.mjs <name> …` rebuilds only those names (and the manifests),
   so swapping one source does not re-encode the whole library */
const ONLY = new Set(process.argv.slice(2));

/** names that must keep the source aspect (plans/diagrams must not be cropped) */
const NO_CROP = new Set(['floor-plan', 'hall-plan', 'site-plan', 'site-section', 'expo-banner']);

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
  /* the four 300x300 thumbnails the client's CMS produced: they are the only frame we have
     of the meeting room, the café, the red aisle and the site from the air, so they are
     upscaled to a usable card size rather than dropped */
  'conference-room',
  'hall-aisle-red',
  'cafe-interior',
  'venue-aerial',
]);

const ratio = 16 / 10;

/**
 * Tone pass (docs/15 §11). The client's photos are phone and event-photographer frames shot
 * under hall lighting: flat, grey, slightly under-exposed. A 0.5–99.5 percentile stretch puts
 * real blacks and whites back, a small saturation lift brings stands and products forward,
 * and a final unsharp pass at output size restores the edge contrast every resize removes.
 * Plans, diagrams and banners are artwork and are left exactly as drawn.
 */
const tone = (p, name) =>
  NO_CROP.has(name)
    ? p
    : p
        .normalise({ lower: 0.5, upper: 99.5 })
        .modulate({ saturation: 1.1, brightness: 1.03 })
        .sharpen({ sigma: 0.7, m1: 0.5, m2: 1.2 });

/** images/hd/<stem>.jpg is the Real-ESRGAN 4x master of a small source (scripts/upscale-photos.py) */
const hdOf = (file) => path.join(SRC, 'hd', file.replace(/\.[a-z]+$/i, '.jpg'));

async function one(name, [file]) {
  /* a new source can have fewer rungs than the old one: drop the old ladder first */
  for (const f of await readdir(OUT)) if (new RegExp(`^${name}-\\d+\\.webp$`).test(f)) unlinkSync(path.join(OUT, f));
  const hd = hdOf(file);
  const src = existsSync(hd) ? hd : path.join(SRC, file);
  if (!existsSync(src)) {
    console.warn(`  ! missing source ${src} for ${name}`);
    return 0;
  }
  const meta = await sharp(src).metadata();
  const hero = HERO.has(name);
  /* a tiny source is never blown up to 1600: it is capped at 3x, which keeps the artefacts
     below what a card-sized viewport can resolve. Full-bleed heroes with a real (or
     AI-restored) 2000px+ master also get a 2048 rung for 1440px screens at 2x. */
  /* 2026-10-13: retina screens crop these 16:10 rungs into tall panels, so the old 3x
     upscale of 768px sources read as blur. A rung is never wider than ~1.15x its source
     now, and every source of 1800px+ gets the 2048 rung, not only heroes. */
  const sw = meta.width ?? 1600;
  const maxW = Math.min(sw >= 1800 ? 2048 : 1600, Math.max(640, Math.round(sw * (hero ? 1.15 : 1))));
  let bytes = 0;

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
    return tone(out, name);
  };

  /* The JPEG has two jobs and neither of them needs 1600 pixels:
     1. the <picture> fallback, which in practice only fires for a browser with no WebP —
        that population is ancient hardware on a small screen, not a 4K desktop;
     2. the og:image, and the Open Graph spec's own recommendation is 1200x630.
     Capping it at 1200w turns the biggest single file on the site (hero-hall.jpg, 274 KB)
     into something a third the size while the WebP ladder — which every real visitor
     actually receives — is untouched. */
  const JPEG_MAX = 1200;
  const jpg = path.join(OUT, `${name}.jpg`);
  await tone(sharp(src, { failOn: 'none' })
    .rotate()
    .resize(
      NO_CROP.has(name)
        ? { width: Math.min(JPEG_MAX, maxW), withoutEnlargement: true }
        : {
            width: Math.min(JPEG_MAX, maxW),
            height: Math.round(Math.min(JPEG_MAX, maxW) / ratio),
            fit: 'cover',
            position: 'attention',
            kernel: 'lanczos3',
            withoutEnlargement: !hero,
          },
    ), name)
    .jpeg({ quality: 76, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toFile(jpg);
  bytes += statSync(jpg).size;

  let prev = 0;
  for (const w of WIDTHS) {
    /* the top rung is emitted at the source's own width when it falls between two rungs
       (an 1800px photo gets an 1800px "-2048" file, not a cap at 1600) */
    if (w > maxW + 80 && prev >= maxW - 100) continue;
    prev = Math.min(w, maxW);
    const out = path.join(OUT, `${name}-${w}.webp`);
    /* bigger rung = seen larger but also further from the eye's detail budget: the quality
       ladder drops as the pixel count climbs, which is what keeps a 1600w hero under 200 KB */
    const q = w >= 2048 ? 72 : w >= 1600 ? 74 : w >= 1024 ? 76 : 78;
    await crop(w).webp({ quality: q, effort: 6 }).toFile(out);
    bytes += statSync(out).size;
  }
  return bytes;
}

mkdirSync(OUT, { recursive: true });
const before = (await readdir(OUT)).length;
let total = 0;
for (const [name, def] of Object.entries(MAP)) {
  if (ONLY.size && !ONLY.has(name)) continue;
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
  if (!mm || built.has(mm[1]) || ONLY.size) continue;
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


/**
 * Team posters for the SOF EXPO team page (/about/team/).
 *
 * The client delivered 17 finished 1:1 artboards with the brand frame baked in — name,
 * role and the SOF EXPO identity. They are not photographs to be cropped: each card is
 * a designed layout with type on it, so the ladder keeps the full frame at 1:1 and only
 * ever scales down. A 400w rung feeds the mobile card, an 800w rung feeds the desktop
 * grid, a 1200w rung feeds the LCP image on the team page itself.
 */
mkdirSync(`${OUT}/team`, { recursive: true });
{
  const teamSrc = 'images/team';
  const teamFiles = !ONLY.size && existsSync(teamSrc) ? (await readdir(teamSrc)).filter((f) => /^team-[\w-]+\.jpg$/i.test(f)).sort() : [];
  let t = 0;
  for (const f of teamFiles) {
    const src = path.join(teamSrc, f);
    const base = f.replace(/\.jpg$/i, '');
    for (const w of [400, 800, 1200]) {
      await sharp(src, { failOn: 'none' })
        .resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
        .webp({ quality: w >= 1200 ? 76 : w >= 800 ? 78 : 80, effort: 6 })
        .toFile(path.join(OUT, 'team', `${base}-${w}.webp`));
    }
    await sharp(src, { failOn: 'none' })
      .resize({ width: 1200, withoutEnlargement: true, kernel: 'lanczos3' })
      .jpeg({ quality: 84, progressive: true, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toFile(path.join(OUT, 'team', `${base}.jpg`));
    process.stdout.write(`· team/${base}\n`);
    t++;
  }
  if (t) console.log(`${t} team posters built`);
}

/**
 * Speaker cards for E-COM & RETAIL EXPO SAMARKAND.
 *
 * The client shot two poster series for the business programme — a dark "Biz Network" set
 * (April edition) and a teal set (20-21 May) — 37 finished 4:5 artboards in total. They are
 * not photographs to be cropped: each one is a designed card with type on it, so the ladder
 * keeps the full frame at 4:5 and only ever scales down.
 */
const SPEAKERS = ONLY.size ? [] : [
  ...(await readdir(SRC)).filter((f) => /^1-1-\d+\.png$/.test(f)),
  ...['2.jpg', '4.jpg', '5.jpg', '7.jpg', '9.jpg', '10.jpg', '11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg', '16.jpg', '17.jpg', '18.jpg', '19.jpg'],
].sort();

mkdirSync(`${OUT}/speakers`, { recursive: true });
let n = 0;
for (const f of SPEAKERS) {
  const src = path.join(SRC, f);
  if (!existsSync(src)) continue;
  const name = `speaker-${String(++n).padStart(2, '0')}`;
  for (const w of [400, 800]) {
    await sharp(src)
      .resize({ width: w, height: Math.round((w * 5) / 4), fit: 'contain', background: '#ffffff', kernel: 'lanczos3' })
      .webp({ quality: w >= 800 ? 72 : 76, effort: 6 })
      .toFile(path.join(OUT, 'speakers', `${name}-${w}.webp`));
  }
  await sharp(src)
    .resize({ width: 800, kernel: 'lanczos3' })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(path.join(OUT, 'speakers', `${name}.jpg`));
}
console.log(`${n} speaker cards built`);

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

/* The .jpg doubles as the og:image, and Facebook/Telegram/WhatsApp all trust the declared
   og:image:width/height over the bytes. Hard-coding 1200x630 was a lie for every photo
   whose source was smaller, which makes a scraper reserve the wrong box and crop the
   preview. Measure them instead. */
const dims = {};
for (const f of await readdir(OUT)) {
  const mm = /^([a-z0-9-]+)\.jpg$/.exec(f);
  if (!mm) continue;
  const { width, height } = await sharp(path.join(OUT, f)).metadata();
  dims[mm[1]] = [width, height];
}
writeFileSync('src/data/photo-dims.json', JSON.stringify(dims, null, 2) + '\n');
console.log(`og dimensions: ${Object.keys(dims).length} photos`);
