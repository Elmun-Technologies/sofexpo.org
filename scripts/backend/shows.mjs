/**
 * The shows the backend knows about, in one place.
 *
 * - `PORTAL_EVENTS` — upcoming editions a visitor/exhibitor can send a request for (the
 *   cabinet's event select). Their localized names/dates live in `portal/i18n.js` by slug.
 * - `SHOWS` — every show with the editions an exhibitor can claim participation in on their
 *   company page (the public exhibitor directory groups companies by show + year:
 *   "taking part now" vs "took part before").
 *
 * The site's own source of truth is `src/data/events.ts` + `src/data/archive.ts`; keep the
 * slugs identical. A new edition is one line here.
 */

export const SHOWS = [
  { slug: 'foodera-expo', name: 'FOODERA EXPO', editions: [{ year: 2026, upcoming: true }] },
  { slug: 'buildpro-expo', name: 'BUILD PRO EXPO', editions: [{ year: 2026, upcoming: true }, { year: 2025 }, { year: 2024 }] },
  { slug: 'agropro-expo', name: 'AGROPRO EXPO', editions: [{ year: 2027, upcoming: true }, { year: 2026 }, { year: 2025 }] },
  { slug: 'world-edu-expo', name: 'WORLD EDU EXPO', editions: [{ year: 2027, upcoming: true }, { year: 2026 }, { year: 2025 }] },
  { slug: 'ecom-retail-expo', name: 'ECOM & RETAIL EXPO', editions: [{ year: 2027, upcoming: true }, { year: 2025 }] },
  { slug: 'promotors-show-samarkand', name: 'PROMOTORS SHOW', editions: [{ year: 2026 }] },
];

export const PORTAL_EVENTS = [
  { slug: 'foodera-expo', name: 'FOODERA EXPO 2026', dates: '27–29 oktabr 2026', year: 2026 },
  { slug: 'buildpro-expo', name: 'BUILD PRO EXPO 2026', dates: '9–11 noyabr 2026', year: 2026 },
  { slug: 'agropro-expo', name: 'AGROPRO EXPO 2027', dates: '2–4 mart 2027', year: 2027 },
  { slug: 'world-edu-expo', name: 'WORLD EDU · SPRING 2027', dates: '9–10 aprel 2027', year: 2027 },
  { slug: 'ecom-retail-expo', name: 'ECOM & RETAIL EXPO', dates: '16–17 iyun 2027', year: 2027 },
];

export function findShow(slug) {
  return SHOWS.find((show) => show.slug === slug) || null;
}

/** true when the edition is a show's next (not yet held) one */
export function isUpcomingEdition(slug, year) {
  return Boolean(findShow(slug)?.editions.some((edition) => edition.year === Number(year) && edition.upcoming));
}

export function validEdition(slug, year) {
  return Boolean(findShow(slug)?.editions.some((edition) => edition.year === Number(year)));
}
