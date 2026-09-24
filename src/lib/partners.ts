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
}

const SHARED: Partner[] = [
  /* Real artwork pending — the client provides the logos (docs/08 §7 Q4). */
  { id: 'reikartz', kind: 'hotel', show: 'site', name: { ru: 'Рекарц (Reikartz)', en: 'Reikartz' }, note: { ru: 'отель-партнёр · −15%', en: 'partner hotel · −15%' } },
  { id: 'ticketon', kind: 'service', show: 'site', name: { ru: 'Ticketon.uz', en: 'Ticketon.uz' }, note: { ru: 'билетный оператор', en: 'ticketing' } },
  { id: 'uzexpo', kind: 'org', show: 'site', name: { ru: 'UzExpoCentre', en: 'UzExpoCentre' }, note: { ru: 'отраслевой партнёр', en: 'industry partner' } },
  { id: 'cci-uz', kind: 'state', show: 'site', name: { ru: 'Торгово-промышленная палата', en: 'Chamber of Commerce & Industry' } },
  { id: 'hotel-partner', kind: 'hotel', show: 'site', name: { ru: 'Hilton Samarkand', en: 'Hilton Samarkand' }, note: { ru: 'рекомендованный отель', en: 'recommended hotel', hasLogo: false } },
];

const EVENT: Partner[] = [
  /* FOODERA EXPO 2026 — the organizer is the co-hosts + retail/food bodies */
  { id: 'foodera-organizer', kind: 'org', show: 'event', event: 'foodera-expo', name: { ru: 'RESOF EXPO', en: 'RESOF EXPO' }, note: { ru: 'организатор', en: 'organizer' } },
  { id: 'foodera-chamber', kind: 'state', show: 'event', event: 'foodera-expo', name: { ru: 'Хокимият Самаркандской области', en: 'Samarkand Regional Administration' }, note: { ru: 'при поддержке', en: 'with support of' } },
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
  { id: 'ecom-sellers', kind: 'org', show: 'event', event: 'ecom-retail-expo', name: { ru: 'Ассоциация продавцов Узбекистана', en: 'Uzbekistan Sellers Association', hasLogo: true }, note: { ru: 'соорганизатор', en: 'co-organizer' } },
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

export function partnerSrc(id: string): string {
  return `/images/partners/${id}.svg`;
}
