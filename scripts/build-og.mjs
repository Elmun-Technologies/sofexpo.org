/**
 * Individual social / AI-preview card for EVERY indexable page (docs/02 §2).
 *
 * Before: ~95 pages unfurled with the same /og/default.jpg, so Telegram, WhatsApp,
 * LinkedIn, Google Discover and AI answer cards showed one identical picture for the
 * whole site. Now each page gets /og/<locale>/<path>.jpg: the page's own photo, its
 * section label, its title and the brand line — and the HTML meta is rewritten to it.
 *
 * Runs after `astro build` (and after the zh/tr editions are materialised).
 * CJK: the build machine has no CJK face, so the zh card prints the English source
 * title (same path under /en/) — the zh page's own text stays in og:title.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import sharp from 'sharp';

const DIST = process.argv[2] || 'dist';
const W = 1200;
const H = 630;

const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('index.html') ? [p] : [];
  });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unent = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, key) =>
  unent((html.match(new RegExp(`(?:property|name)="${key}" content="([^"]*)"`)) ?? [])[1] ?? '');

const SECTION = {
  en: { events: 'Exhibitions', venue: 'The venue', exhibitors: 'For exhibitors', visitors: 'For visitors', organizers: 'For organizers', about: 'About us', news: 'News', articles: 'Insights', contacts: 'Contacts', legal: 'Legal', 'request-stand': 'Book a stand', search: 'Search' },
  ru: { events: 'Выставки', venue: 'Экспоцентр', exhibitors: 'Экспонентам', visitors: 'Посетителям', organizers: 'Организаторам', about: 'О нас', news: 'Новости', articles: 'Аналитика', contacts: 'Контакты', legal: 'Правовая информация', 'request-stand': 'Заявка на стенд', search: 'Поиск' },
  tr: { events: 'Fuarlar', venue: 'Fuar merkezi', exhibitors: 'Katılımcılar için', visitors: 'Ziyaretçiler için', organizers: 'Organizatörler için', about: 'Hakkımızda', news: 'Haberler', articles: 'Analizler', contacts: 'İletişim', legal: 'Yasal', 'request-stand': 'Stant başvurusu', search: 'Arama' },
};
const HOME = { en: 'Exhibition centre · Samarkand, Uzbekistan', ru: 'Выставочный центр · Самарканд, Узбекистан', tr: 'Fuar merkezi · Semerkant, Özbekistan' };

const FALLBACK = {
  events: ['hall-crowd', 'opening-ceremony', 'expo-banner', 'hall-walk'],
  venue: ['venue-aerial', 'venue-facade', 'hall-empty', 'hall-windows', 'outdoor-area'],
  exhibitors: ['stand-modern', 'stand-equipment', 'stand-green', 'hall-stand', 'buyers-talk', 'floor-plan'],
  visitors: ['hall-walk', 'badge-lanyard', 'visitors-flowers', 'afrosiyob-train', 'hotel-facade'],
  organizers: ['conference-room', 'conference-audience', 'venue-conference', 'hall-empty'],
  about: ['office-people', 'officials-tour', 'opening-ceremony'],
  news: ['expo-banner', 'hall-crowd', 'opening-ceremony'],
  articles: ['buyers-talk', 'supermarket-aisle', 'documents', 'stand-industrial'],
  contacts: ['venue-facade', 'office-people'],
  legal: ['documents'],
  'request-stand': ['stand-modern', 'hall-stand'],
  search: ['hall-aisle-red'],
  _: ['hero-hall', 'hall-crowd', 'venue-aerial'],
};
const cache = new Map();
async function background(src) {
  if (cache.has(src)) return cache.get(src);
  let file = join(DIST, src.replace(/^https?:\/\/[^/]+/, ''));
  if (!existsSync(file)) file = join(DIST, 'og/default.jpg');
  const buf = await sharp(file).resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();
  cache.set(src, buf);
  return buf;
}

async function text(markup, width, size) {
  return sharp({
    text: { text: markup, font: `sans ${size}`, rgba: true, width, wrap: 'word', spacing: Math.round(size * 0.2) },
  })
    .png()
    .toBuffer();
}

const files = walk(DIST).filter((f) => /\/(en|ru|zh|tr)\//.test(f.slice(DIST.length)));
let made = 0;
const pages = [];
for (const file of files) {
  let html = readFileSync(file, 'utf8');
  if (/name="robots" content="noindex/.test(html)) continue;
  const rel = file.slice(DIST.length + 1, -'index.html'.length); // "en/events/foodera-expo/"
  const [locale, ...parts] = rel.split('/').filter(Boolean);
  let title = meta(html, 'og:title');
  if (locale === 'zh') {
    const src = join(DIST, 'en', ...parts, 'index.html');
    if (existsSync(src)) title = meta(readFileSync(src, 'utf8'), 'og:title');
  }
  title = title.replace(/\s*\|\s*SOF EXPO.*$/, '').replace(/\s+—\s+SOF EXPO Samarkand$/, '');
  const lang = locale === 'zh' ? 'en' : locale;
  const SHOWS = { 'foodera-expo': 'FOODERA EXPO', 'buildpro-expo': 'BUILD PRO EXPO', 'agropro-expo': 'AGROPRO EXPO', 'world-edu-expo': 'WORLD EDU EXPO', 'ecom-retail-expo': 'ECOM & RETAIL EXPO', 'promotors-show-samarkand': 'PROMOTORS SHOW' };
  const kicker = !parts.length ? HOME[lang] : parts[0] === 'events' && SHOWS[parts[1]] ? `${SECTION[lang].events} · ${SHOWS[parts[1]]}` : (SECTION[lang]?.[parts[0]] ?? '');
  let photo = meta(html, 'og:image');
  /* pages without a photo of their own inherited the old text-heavy default card; pick a
     real photograph by section instead (rotated by path so neighbours differ) */
  if (/\/og\/default\.jpg$|\/brand\/[^/]+\/og\.jpg$/.test(photo)) {
    const pool = FALLBACK[parts[0]] ?? FALLBACK._;
    const h = [...rel].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 3);
    photo = `/images/${pool[h % pool.length]}.jpg`;
  }

  const bg = await background(photo);
  const shade = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0" stop-color="#08160e" stop-opacity=".94"/>
        <stop offset=".6" stop-color="#08160e" stop-opacity=".78"/>
        <stop offset="1" stop-color="#08160e" stop-opacity=".35"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="80" y="84" width="56" height="4" fill="#c8882c"/>
      <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#c8882c"/>
    </svg>`,
  );
  const size = title.length > 70 ? 46 : title.length > 45 ? 54 : 62;
  const [k, t, b] = await Promise.all([
    text(`<span foreground="#f3e3c9" letter_spacing="2048">${esc(kicker.toUpperCase())}</span>`, 900, 22),
    text(`<span foreground="#ffffff" weight="bold">${esc(title)}</span>`, 1000, size),
    text(`<span foreground="#ffffff" weight="bold">SOF EXPO</span><span foreground="#ffffffb0">  ·  sofexpo.org</span>`, 700, 26),
  ]);
  const out = join(DIST, 'og', rel.replace(/\/$/, '') || 'index') + '.jpg';
  mkdirSync(dirname(out), { recursive: true });
  await sharp(bg)
    .composite([
      { input: shade, left: 0, top: 0 },
      { input: k, left: 80, top: 112 },
      { input: t, left: 80, top: 170 },
      { input: b, left: 80, top: H - 96 },
    ])
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(out);

  const url = `https://sofexpo.org/${out.slice(DIST.length + 1)}`;
  html = html
    .replace(/(property="og:image" content=")[^"]*/, `$1${url}`)
    .replace(/(name="twitter:image" content=")[^"]*/, `$1${url}`)
    .replace(/(property="og:image:width" content=")[^"]*/, `$1${W}`)
    .replace(/(property="og:image:height" content=")[^"]*/, `$1${H}`)
    .split(`"primaryImageOfPage":{"@type":"ImageObject","url":"${photo}"}`)
    .join(`"primaryImageOfPage":{"@type":"ImageObject","url":"${url}","width":${W},"height":${H}}`);
  pages.push({ locale, url: `https://sofexpo.org/${rel}`, title: meta(html, 'og:title'), desc: meta(html, 'description') });
  writeFileSync(file, html);
  made++;
}
/* llms-full.txt: every indexable page with its own one-line summary, per language, so an
   answer engine can pick the exact page instead of guessing from the home page */
const order = ['en', 'ru', 'tr', 'zh'];
const names = { en: 'English', ru: 'Русский', tr: 'Türkçe', zh: '简体中文' };
const full = ['# SOF EXPO Samarkand — full page index', '', '> Exhibition centre and trade-show operator in Samarkand, Uzbekistan. Every public page with its summary. Short version: /llms.txt', ''];
for (const l of order) {
  const list = pages.filter((p) => p.locale === l).sort((a, b) => a.url.localeCompare(b.url));
  if (!list.length) continue;
  full.push(`## ${names[l]}`, '');
  for (const p of list) full.push(`- [${p.title}](${p.url}): ${p.desc}`);
  full.push('');
}
writeFileSync(join(DIST, 'llms-full.txt'), full.join('\n'));
console.log(`og: ${made} individual cards written to ${DIST}/og/`);
