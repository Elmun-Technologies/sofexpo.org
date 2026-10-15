/**
 * Partner logos — single source of truth.
 *
 * The client sends the real logos per edition and for SOF EXPO in general
 * (docs/08 §7 Q4). Drop each logo as a white-on-transparent SVG or PNG at
 *   public/images/partners/<id>.svg   (or .png)
 * and every wall that reads this file updates without a line of code. Width is
 * scaled, height is capped, so a 600px horizontal and a 240px square logo both
 * sit on one optical line. `id` doubles as the alt-text fallback ("logo of …")
 * so list items are named for screen readers even without real art.
 *
 * `show` controls which walls an organization appears on:
 *  - 'site'   → every page (the shared SOF EXPO partners)
 *  - 'event'  → only that exhibition's own overview page
 * `event` is the event slug; `kind` hints the shape class for the monogram
 * placeholder that renders until the real file is added.
 */

import logoDims from '@/data/partner-logo-dims.json';

export type PartnerKind = 'org' | 'media' | 'hotel' | 'service' | 'state';

export interface Partner {
  /** file name + a11y/fragment id: `/images/partners/<id>.<svg|png>` */
  id: string;
  name: { ru: string; en: string };
  note?: { ru: string; en: string };
  kind: PartnerKind;
  /* which surface shows this partner */
  show: 'site' | 'event';
  /* when show === 'event' — the exhibition slug from events.ts */
  event?: string;
  /* has real artwork been dropped in? */
  hasLogo?: boolean;
  /**
   * The partner's own site. A logo wall that does not link out wastes the strongest
   * signal a partner page has: who these organizations are. External links are plain
   * anchors — no request, no embed, no third-party script (docs/02).
   */
  url?: string;
}

const SHARED: Partner[] = [
  /* Real artwork pending — the client provides the logos (docs/08 §7 Q4). */
  { id: 'reikartz', kind: 'hotel', show: 'site', hasLogo: true, name: { ru: 'Рекарц (Reikartz)', en: 'Reikartz' }, note: { ru: 'отель-партнёр · −15%', en: 'partner hotel · −15%' } },
  { id: 'ticketon', kind: 'service', show: 'site', name: { ru: 'Ticketon.uz', en: 'Ticketon.uz' }, note: { ru: 'билетный оператор', en: 'ticketing' } },
  { id: 'cci-uz', kind: 'state', show: 'site', hasLogo: true, name: { ru: 'Торгово-промышленная палата', en: 'Chamber of Commerce & Industry' } },
  { id: 'hotel-partner', kind: 'hotel', show: 'site', hasLogo: true, name: { ru: 'Hilton Samarkand', en: 'Hilton Samarkand' }, note: { ru: 'рекомендованный отель', en: 'recommended hotel' } },
  /* The centre's own partner list, as published by the organiser (sofexpo.uz, 2026).
     Names and links come from there; artwork still arrives per partner, so every tile
     keeps the monogram until the real file is dropped in. */
  { id: 'samarkand-region', kind: 'state', show: 'site', hasLogo: true, name: { ru: 'Хокимият Самаркандской области', en: 'Samarkand Regional Administration' }, note: { ru: 'при поддержке', en: 'with support of' }, url: 'https://samarkand.uz/' },
  { id: 'uza', kind: 'media', show: 'site', hasLogo: true, name: { ru: 'UzA — Национальное информационное агентство Узбекистана', en: 'UzA — National News Agency of Uzbekistan' }, note: { ru: 'информационный партнёр', en: 'media partner' }, url: 'https://uza.uz/' },
  { id: 'tashkent-times', kind: 'media', show: 'site', hasLogo: true, name: { ru: 'The Tashkent Times', en: 'The Tashkent Times' }, note: { ru: 'информационный партнёр', en: 'media partner' }, url: 'https://tashkenttimes.uz/' },
  { id: 'expomap', kind: 'org', show: 'site', hasLogo: true, name: { ru: 'Expomap', en: 'Expomap' }, note: { ru: 'отраслевой каталог', en: 'industry directory' }, url: 'https://expomap.ru/' },
  { id: 'exposale', kind: 'service', show: 'site', name: { ru: 'Exposale', en: 'Exposale' }, note: { ru: 'отраслевой каталог', en: 'industry directory' }, url: 'https://exposale.net/en' },
  { id: 'totalexpo', kind: 'org', show: 'site', hasLogo: true, name: { ru: 'TotalExpo', en: 'TotalExpo' }, note: { ru: 'отраслевой каталог', en: 'industry directory' }, url: 'https://totalexpo.ru/' },
  { id: 'worldexpo', kind: 'org', show: 'site', name: { ru: 'WorldExpo', en: 'WorldExpo' }, note: { ru: 'отраслевой каталог', en: 'industry directory' }, url: 'https://worldexpo.pro/' },
  { id: 'advantour', kind: 'service', show: 'site', name: { ru: 'Advantour', en: 'Advantour' }, url: 'https://www.advantour.com/' },
  { id: 'led-master', kind: 'service', show: 'site', hasLogo: true, name: { ru: 'LED Master', en: 'LED Master' }, url: 'https://www.instagram.com/ledmasteruz/' },
  { id: 'iimps', kind: 'org', show: 'site', hasLogo: true, name: { ru: 'International Institute of Meta Professional', en: 'International Institute of Meta Professional' }, url: 'https://iimps.org/' },
];

const EVENT: Partner[] = [
  /* FOODERA EXPO 2026 — the organizer is the co-hosts + retail/food bodies */
  { id: 'foodera-organizer', kind: 'org', show: 'event', event: 'foodera-expo', name: { ru: 'RESOF EXPO', en: 'RESOF EXPO' }, note: { ru: 'организатор', en: 'organizer' } },
  { id: 'foodera-retail', kind: 'org', show: 'event', event: 'foodera-expo', name: { ru: 'Союз предприятий пищевой промышленности', en: 'Food Industry Union' }, note: { ru: 'отраслевой союз', en: 'industry union' } },
  /* BUILDPRO EXPO 2026 */
  { id: 'buildpro-organizer', kind: 'org', show: 'event', event: 'buildpro-expo', name: { ru: 'RESOF EXPO', en: 'RESOF EXPO' }, note: { ru: 'организатор', en: 'organizer' } },
  { id: 'buildpro-union', kind: 'org', show: 'event', event: 'buildpro-expo', name: { ru: 'Союз строителей Узбекистана', en: 'Builders Union of Uzbekistan' }, note: { ru: 'отраслевой партнёр', en: 'industry partner' } },
  /* AGROPRO EXPO 2027 */
  { id: 'agropro-organizer', kind: 'org', show: 'event', event: 'agropro-expo', name: { ru: 'RESOF EXPO', en: 'RESOF EXPO' }, note: { ru: 'организатор', en: 'organizer' } },
  { id: 'agropro-ministry', kind: 'state', show: 'event', event: 'agropro-expo', name: { ru: 'Министерство сельского хозяйства', en: 'Ministry of Agriculture' }, note: { ru: 'при поддержке', en: 'with support of' } },
  /* WORLD EDU EXPO 2027 */
  { id: 'worldedu-organizer', kind: 'org', show: 'event', event: 'world-edu-expo', name: { ru: 'RESOF EXPO', en: 'RESOF EXPO' }, note: { ru: 'организатор', en: 'organizer' } },
  { id: 'worldedu-ministry', kind: 'state', show: 'event', event: 'world-edu-expo', name: { ru: 'Министерство высшего образования', en: 'Ministry of Higher Education' }, note: { ru: 'при поддержке', en: 'with support of' } },
  /* ECOM & RETAIL EXPO 2027 */
  { id: 'ecom-organizer', kind: 'org', show: 'event', event: 'ecom-retail-expo', name: { ru: 'RESOF EXPO', en: 'RESOF EXPO' }, note: { ru: 'организатор', en: 'organizer' } },
  { id: 'ecom-sellers', kind: 'org', show: 'event', event: 'ecom-retail-expo', name: { ru: 'Ассоциация продавцов Узбекистана', en: 'Uzbekistan Sellers Association' }, note: { ru: 'соорганизатор', en: 'co-organizer' } },
  /* PROMOTORS SHOW 2026 */
  { id: 'promotors-organizer', kind: 'org', show: 'event', event: 'promotors-show-samarkand', name: { ru: 'RESOF EXPO', en: 'RESOF EXPO' }, note: { ru: 'организатор', en: 'organizer' } },
];

export const partners: Partner[] = [...SHARED, ...EVENT];

export function sitePartners(): Partner[] {
  return partners.filter((p) => p.show === 'site');
}

export function partnersForEvent(slug?: string | null): Partner[] {
  if (!slug) return [];
  return partners.filter((p) => p.show === 'event' && p.event === slug);
}

/* trimmed size of every logo file — written by scripts/build-partner-logos.mjs */
const DIMS = logoDims as Record<string, { w: number; h: number; ext: 'webp' | 'svg' }>;

export function partnerSrc(id: string): string {
  /* the masters (images/partner-masters) are cut free of their plates and trimmed to the
     ink by `npm run logos:partners`; a vector master stays an SVG */
  return `/images/partners/${id}.${DIMS[id]?.ext ?? 'webp'}`;
}

/**
 * Optical sizing for a logo wall. Logos of one height look wildly different — an 8:1
 * newspaper masthead turns into a ribbon, a square badge into a stamp — so every logo gets
 * the same visible AREA instead, then is held inside the cell's box:
 *   h = √(area / ratio), w = h · ratio, clamped to maxW × maxH.
 */
/* equal area still over-weights a logo that is solid ink edge to edge (UzA's heavy capitals
   fill their whole box, while most marks are a thin emblem plus small type) — such logos get
   a smaller share of the area so the wall reads even */
const DENSITY: Record<string, number> = { uza: 0.62 };

export function logoBox(id: string, { area = 7600, maxW = 180, maxH = 68 }: { area?: number; maxW?: number; maxH?: number } = {}) {
  const d = DIMS[id];
  const ratio = d ? d.w / d.h : 2.5;
  area *= DENSITY[id] ?? 1;
  let h = Math.min(maxH, Math.sqrt(area / ratio));
  let w = h * ratio;
  if (w > maxW) { w = maxW; h = w / ratio; }
  return { width: Math.round(w), height: Math.round(h) };
}

/**
 * The home page's logo wall (docs/18 §4): exhibitors and partners together, as the 2026-10
 * design lays it out. Exhibiting brands are not partners, so they are listed here and not in
 * SHARED — no partner page claims them. Confirm each one is current before an edition.
 */
export const homeLogos: { id: string; name: string }[] = [
  { id: 'samarkand-region', name: 'Samarkand Regional Administration' },
  { id: 'uzauto-motors', name: 'UzAuto Motors' },
  { id: 'artel', name: 'Artel' },
  { id: 'agromir', name: 'Agromir' },
  { id: 'sag', name: 'SAG' },
  { id: 'sibeco', name: 'Sibeco' },
  { id: 'uza', name: 'UzA' },
  { id: 'tashkent-times', name: 'The Tashkent Times' },
  { id: 'reikartz', name: 'Amar Reikartz Hotel' },
  { id: 'grand-plaza', name: 'Grand Plaza Hotel' },
  { id: 'sellers-association', name: 'Sellers Association' },
  { id: 'led-master', name: 'LED Master' },
];
