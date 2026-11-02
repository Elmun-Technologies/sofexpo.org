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
 *
 * Timeline (docs/24): an edition carries its closing date (`end`, YYYY-MM-DD). Until that day
 * is over in Samarkand it is "upcoming" and in the cabinet's select; the day after, it moves
 * to "took part before" and drops out of the select — no deploy needed, the server reads the
 * clock on every request. `upcoming: true` without an `end` stays a manual flag.
 */

export const SHOWS = [
  { slug: 'foodera-expo', name: 'FOODERA EXPO', editions: [{ year: 2026, end: '2026-10-29' }] },
  { slug: 'buildpro-expo', name: 'BUILD PRO EXPO', editions: [{ year: 2026, end: '2026-11-11' }, { year: 2025 }, { year: 2024 }] },
  { slug: 'agropro-expo', name: 'AGROPRO EXPO', editions: [{ year: 2027, end: '2027-03-04' }, { year: 2026 }, { year: 2025 }] },
  { slug: 'world-edu-expo', name: 'WORLD EDU EXPO', editions: [{ year: 2027, end: '2027-04-10' }, { year: 2026 }, { year: 2025 }] },
  { slug: 'ecom-retail-expo', name: 'ECOM & RETAIL EXPO', editions: [{ year: 2027, end: '2027-06-17' }, { year: 2025 }] },
  { slug: 'promotors-show-samarkand', name: 'PROMOTORS SHOW', editions: [{ year: 2026, end: '2026-09-13' }] },
];

export const PORTAL_EVENTS = [
  { slug: 'foodera-expo', name: 'FOODERA EXPO 2026', dates: '27–29 oktabr 2026', year: 2026, end: '2026-10-29' },
  { slug: 'buildpro-expo', name: 'BUILD PRO EXPO 2026', dates: '9–11 noyabr 2026', year: 2026, end: '2026-11-11' },
  { slug: 'agropro-expo', name: 'AGROPRO EXPO 2027', dates: '2–4 mart 2027', year: 2027, end: '2027-03-04' },
  { slug: 'world-edu-expo', name: 'WORLD EDU · SPRING 2027', dates: '9–10 aprel 2027', year: 2027, end: '2027-04-10' },
  { slug: 'ecom-retail-expo', name: 'ECOM & RETAIL EXPO', dates: '16–17 iyun 2027', year: 2027, end: '2027-06-17' },
];

/** today's date in Samarkand (UTC+5, no DST) as YYYY-MM-DD */
export function samarkandToday(now = new Date()) {
  return new Date(now.getTime() + 5 * 36e5).toISOString().slice(0, 10);
}

function editionIsUpcoming(edition, today) {
  return edition.end ? edition.end >= today : Boolean(edition.upcoming);
}

/** SHOWS as they stand on `now`: every edition with a computed `upcoming` flag */
export function showsOn(now = new Date()) {
  const today = samarkandToday(now);
  return SHOWS.map((show) => ({
    slug: show.slug,
    name: show.name,
    editions: show.editions.map(({ year, ...edition }) => ({ year, upcoming: editionIsUpcoming(edition, today) })),
  }));
}

/** the editions a visitor/exhibitor can still send a request for on `now` */
export function portalEventsOn(now = new Date()) {
  const today = samarkandToday(now);
  return PORTAL_EVENTS.filter((item) => !item.end || item.end >= today).map(({ end, ...item }) => item);
}

export function findShow(slug) {
  return SHOWS.find((show) => show.slug === slug) || null;
}

/** true when the edition is a show's next (not yet held) one */
export function isUpcomingEdition(slug, year, now = new Date()) {
  const today = samarkandToday(now);
  return Boolean(findShow(slug)?.editions.some((edition) => edition.year === Number(year) && editionIsUpcoming(edition, today)));
}

export function validEdition(slug, year) {
  return Boolean(findShow(slug)?.editions.some((edition) => edition.year === Number(year)));
}
