import { alternates, localize, supportedLocales, localeMeta, type SourceLocale as Locale } from '@/i18n/config';
import { site } from '@/data/site';
import { CURRENT_BRAND } from '@/data/hosts';

export const SITE = (import.meta.env.SITE || 'https://sofexpo.org').replace(/\/$/, '');
export const ORG = 'SOF EXPO Samarkand';

/** Absolute URL for a path. */
export function abs(path: string): string {
  if (path.startsWith('http')) return path;
  return `${SITE}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface MetaInput {
  locale: Locale;
  /** path WITHOUT the locale prefix, e.g. `/events/foodera-expo/` */
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
}

export function buildMeta(input: MetaInput) {
  const { locale, path } = input;
  const self = localize(locale, path);
  const pair = alternates(path);
  /* a branded host unfurls with its own card, not the centre's */
  const ogImage = abs(input.image ?? (CURRENT_BRAND ? `/brand/${CURRENT_BRAND.id}/og.jpg` : '/og/default.jpg'));
  return {
    title: input.title,
    description: input.description,
    canonical: abs(self),
    self,
    hreflang: supportedLocales.map((l) => ({
      locale: l,
      href: abs(localize(l, path)),
      label: localeMeta[l].label,
      short: localeMeta[l].flag,
    })),
    xDefault: abs(pair['x-default']),
    og: {
      title: input.title,
      description: input.description,
      image: ogImage,
      url: abs(self),
      locale: localeMeta[locale].og,
      type: input.type ?? 'website',
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
    },
    noindex: input.noindex ?? false,
  };
}

/* ------------------------- structured data ------------------------- */

export function organizationJsonLd() {
  return {
    '@type': 'ExhibitionCenter',
    '@id': `${SITE}/#venue`,
    name: 'SOF EXPO Samarkand',
    legalName: 'ООО «RESOF EXPO»',
    url: `${SITE}/`,
    telephone: '+998557050705',
    email: site.contacts.email,
    sameAs: [
      'https://www.instagram.com/sofexpo.uz/',
      'https://www.facebook.com/sofexpo.uz',
      'https://t.me/sofexpo',
      'https://www.youtube.com/channel/UCNPRKCh6okafi4EBLR2LvKg',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Samarkand',
      addressRegion: 'Samarkand Region',
      addressCountry: 'UZ',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 39.6542, longitude: 66.9597 },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('SOF EXPO Samarkand')}`,
    areaServed: ['UZ', 'KZ', 'TJ', 'TM', 'KG', 'AF', 'RU', 'TR', 'CN'],
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Indoor exhibition area', value: '4400 m²' },
      { '@type': 'LocationFeatureSpecification', name: 'Open-air area', value: '5000 m²' },
      { '@type': 'LocationFeatureSpecification', name: 'Power supply', value: '700 kW, 220/380 V' },
      { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Parking', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Café seats', value: 350 },
    ],
  };
}

export function eventJsonLd(e: {
  slug: string;
  brand: { ru: string; en: string };
  dates: { start: string; end: string };
  tagline: { ru: string; en: string };
  intro: { ru: string; en: string };
  heroImage: string;
  locale: Locale;
  /** business-programme speakers, when the edition has a published line-up */
  performers?: { name: string; jobTitle: string; org?: string }[];
}) {
  const t = e.locale;
  return {
    '@type': 'ExhibitionEvent',
    '@id': `${SITE}/${t}/events/${e.slug}/#event`,
    name: e.brand[t],
    ...(Object.values(e.brand).some((v) => v !== e.brand[t])
      ? { alternateName: Object.values(e.brand).filter((v) => v !== e.brand[t]) }
      : {}),
    description: e.intro[t],
    eventAttendanceMode: 'https://schema.org/OnSiteEventAttendanceMode',
    eventStatus:
      new Date(`${e.dates.end}T23:59:59+05:00`).getTime() < Date.now()
        ? 'https://schema.org/EventCompleted'
        : 'https://schema.org/EventScheduled',
    startDate: `${e.dates.start}T09:00:00+05:00`,
    endDate: `${e.dates.end}T18:00:00+05:00`,
    image: abs(e.heroImage),
    organizer: { '@id': `${SITE}/#organization` },
    location: { '@id': `${SITE}/#venue` },
    audience: { '@type': 'Audience', audienceType: 'Trade visitors and exhibitors' },
    /* A named line-up is the strongest entity signal an event has: it is what turns
       "who is speaking at ..." into a result. Only emitted when the edition actually
       published one, so the other shows stay silent rather than claiming an empty list. */
    ...(e.performers?.length
      ? {
          performer: e.performers.map((p) => ({
            '@type': 'Person',
            name: p.name,
            jobTitle: p.jobTitle,
            ...(p.org ? { worksFor: { '@type': 'Organization', name: p.org } } : {}),
          })),
        }
      : {}),
  };
}

/** Commercial "service" signal for the hall-rental hub: a searcher typing
 *  «аренда выставочного зала Самарканд» / «exhibition hall rental Samarkand»
 *  matches an entity-level Service, not just a page (docs/08 §5c). */
export function serviceJsonLd(locale: Locale, url: string) {
  return {
    '@type': 'Service',
    name:
      locale === 'ru' ? 'Аренда выставочного зала в Самарканде' : 'Exhibition hall rental in Samarkand',
    alternateName:
      locale === 'ru' ? 'Exhibition hall rental in Samarkand' : 'Аренда выставочного зала в Самарканде',
    serviceType: 'Exhibition hall rental',
    description:
      locale === 'ru'
        ? 'Аренда выставочных площадей 13 680 м², логистика, строительство стендов и организационное сопровождение мероприятий в выставочном центре SOF EXPO, Самарканд.'
        : 'Rental of 13,680 m² of exhibition space plus logistics, stand construction and event management at the SOF EXPO exhibition centre, Samarkand.',
    url,
    provider: { '@id': `${SITE}/#organization` },
    serviceLocation: { '@id': `${SITE}/#venue` },
    serviceArea: { '@type': 'AdministrativeArea', name: 'Samarkand Region' },
    areaServed: { '@type': 'Country', name: 'Uzbekistan' },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE}${items.at(-1)?.url ?? '/'}#breadcrumbs`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[], url: string) {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE}${url}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  date: string;
  modified?: string;
  locale: Locale;
  url: string;
  image?: string;
  authorName?: string;
}) {
  return {
    '@type': 'Article',
    '@id': `${SITE}${input.url}#article`,
    headline: input.headline,
    description: input.description,
    datePublished: input.date,
    dateModified: input.modified ?? input.date,
    inLanguage: localeMeta[input.locale].html,
    image: input.image ? abs(input.image) : undefined,
    author: {
      '@type': 'Organization',
      name: input.authorName ?? ORG,
      url: `${SITE}${localize(input.locale, '/about/')}`,
    },
    publisher: { '@id': `${SITE}/#organization` },
    isPartOf: { '@type': 'WebSite', name: ORG, url: SITE },
  };
}

/** WebSite + SearchAction and Organization root graph (only emitted on the home page). */
export function rootJsonLd() {
  return [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'SOF EXPO Samarkand',
      alternateName: ['Выставочный центр SOF EXPO', 'SOF EXPO Exhibition Centre'],
      inLanguage: ['ru', 'en', 'zh-CN', 'tr'],
      publisher: { '@id': `${SITE}/#organization` },
      /* site search in Google sitelinks (docs/08 §5c): the search page reads ?q=
         on load, so the template is honest */
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE}/en/search/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'RESOF EXPO',
      legalName: 'ООО «RESOF EXPO»',
      url: `${SITE}${localize('en', '/about/')}`,
      logo: `${SITE}/favicon.svg`,
        email: site.contacts.email,
      telephone: '+998557050705',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Samarkand',
        addressRegion: 'Самаркандская область',
        addressCountry: 'UZ',
      },
      sameAs: [
        'https://www.instagram.com/sofexpo.uz/',
        'https://www.facebook.com/sofexpo.uz',
        'https://t.me/sofexpo',
      ],
      subOrganization: { '@id': `${SITE}/#venue` },
    },
    organizationJsonLd(),
  ];
}

/** Entity stubs so `#website` / `#organization` references resolve on every page.
 *  The home page emits the richer rootJsonLd() nodes instead (deduped in Base.astro). */
export function entityNodes() {
  return [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: ORG,
      inLanguage: ['ru', 'en', 'zh-CN', 'tr'],
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'RESOF EXPO',
      legalName: 'ООО «RESOF EXPO»',
      url: `${SITE}${localize('en', '/about/')}`,
      email: site.contacts.email,
      telephone: '+998557050705',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Samarkand',
        addressRegion: 'Samarkand Region',
        addressCountry: 'UZ',
      },
      sameAs: [
        'https://www.instagram.com/sofexpo.uz/',
        'https://www.facebook.com/sofexpo.uz',
        'https://t.me/sofexpo',
      ],
      subOrganization: { '@id': `${SITE}/#venue` },
    },
    organizationJsonLd(),
  ];
}

export function itemListJsonLd(items: { name: string; url: string }[], url: string, name: string) {
  return {
    '@type': 'ItemList',
    '@id': `${SITE}${url}#list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: abs(item.url),
    })),
  };
}

export function isoDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
