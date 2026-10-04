import type { SourceLocale as Locale } from '@/i18n/config';

/**
 * A quote in a post-show report. Only approved quotes go in here: a line invented in the
 * office is worse than no quote at all, so `quotes` stays undefined until an exhibitor or
 * a buyer has agreed to be named.
 */
export interface ReportQuote {
  text: Record<Locale, string>;
  author: string;
  role: Record<Locale, string>;
  org: string;
}

/**
 * The parts of a post-show report that are not numbers (docs/13 §P0-5).
 * Every field is optional: a report ships with whatever the organiser actually has,
 * and the page is built to look finished with the figures alone.
 */
export interface PostShowReport {
  /** what happened, one sentence per line — the part a visitor skims */
  highlights?: Record<Locale, string>[];
  /** how the figures were produced (registration desk, badge scans, survey …) */
  method?: Record<Locale, string>;
  /** one paragraph of context that is not a number: who came, what was signed */
  outcome?: Record<Locale, string>;
  quotes?: ReportQuote[];
}

/** Past editions: proof-of-results pages. These are the strongest SEO/EEAT assets for an expo site. */
export interface Edition {
  id: string;
  eventSlug: string;
  year: number;
  /** ISO date the edition opened — used for the report's Article markup */
  start: string;
  dates: string;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  results: { value: string; label: Record<Locale, string> }[];
  catalogue?: string;
  photo?: string;
  /** the report itself; the fields that are still empty are the organiser's to-do list */
  report?: PostShowReport;
  /** hero image for the report page; falls back to the show's own hero */
  image?: string;
}

export const archive: Edition[] = [
  {
    id: 'promotors-2026',
    start: '2026-09-12',
    eventSlug: 'promotors-show-samarkand',
    year: 2026,
    dates: '12–13.09.2026',
    title: { ru: 'PROMOTORS SHOW SAMARKAND 2026', en: 'PROMOTORS SHOW SAMARKAND 2026' },
    summary: {
      ru: 'Выставка-фестиваль автоиндустрии: дрифт, SPL-автотюнинг, ретро-автомобили, гонки на безмоторных машинах и экспозиция производителей запчастей, химии и оборудования для СТО.',
      en: 'The automotive exhibition and festival: drift, SPL tuning, retro cars, non-motorized racing, plus an expo of parts, chemicals and service-station equipment.',
    },
    results: [
      { value: '2', label: { ru: 'дня фестиваля', en: 'festival days' } },
      { value: '20 млн сум', label: { ru: 'призовой фонд', en: 'total prize fund' } },
      { value: '9', label: { ru: 'гоночных и шоу-номинаций', en: 'racing and show nominations' } },
    ],
    photo: 'https://disk.yandex.ru/d/AomBFx1nb3VAWg',
    report: {
      highlights: [
        { ru: 'Дрифт, SPL-автотюнинг, ретро-автомобили и гонки на безмоторных машинах', en: 'Drift, SPL tuning, retro cars and non-motorized racing' },
        { ru: 'Экспозиция запчастей, автохимии и оборудования для СТО', en: 'Parts, car chemicals and service-station equipment on display' },
        { ru: 'Призовой фонд 20 млн сум в девяти гоночных и шоу-номинациях', en: 'A 20 million soum prize fund across nine racing and show nominations' }
      ],
    },
  },

  {
    id: 'buildpro-2025',
    start: '2025-11-10',
    eventSlug: 'buildpro-expo',
    year: 2025,
    dates: '10–12.11.2025',
    title: { ru: 'BUILD PRO EXPO 2025 · итоги', en: 'BUILD PRO EXPO 2025 · results' },
    summary: {
      ru: 'Четвёртая строительная выставка: 1 600+ посетителей, 80+ компаний, 10+ форумов и сессий деловой программы, живые демонстрации технологий на открытой площадке.',
      en: 'The fourth construction show: 1,600+ visitors, 80+ companies, 10+ forums and sessions, live technology demonstrations on the open area.',
    },
    results: [
      { value: '1 600+', label: { ru: 'посетителей', en: 'visitors' } },
      { value: '80+', label: { ru: 'экспонентов', en: 'exhibitors' } },
      { value: '10+', label: { ru: 'сессий программы', en: 'programme sessions' } },
    ],
    catalogue: '/files/build-2025-catalog.pdf',
    report: {
      highlights: [
        { ru: '10+ форумов и сессий деловой программы', en: '10+ forums and sessions in the business programme' },
        { ru: 'Живые демонстрации технологий на открытой площадке', en: 'Live technology demonstrations on the open-air area' },
        { ru: '80+ компаний и 1 600+ посетителей за три дня', en: '80+ companies and 1,600+ visitors over three days' }
      ],
    },
  },

  {
    id: 'agropro-2026',
    start: '2026-03-03',
    eventSlug: 'agropro-expo',
    year: 2026,
    dates: '03–05.03.2026',
    title: { ru: 'AGROPRO EXPO 2026 · итоги', en: 'AGROPRO EXPO 2026 · results' },
    summary: {
      ru: 'Первая агровыставка серии: 100+ компаний из Узбекистана, России, Турции, Нидерландов и Германии, 4 500+ специалистов, техника, орошение, агрохимия и теплицы.',
      en: 'The first agro show of the series: 100+ companies from Uzbekistan, Russia, Türkiye, the Netherlands and Germany, 4,500+ specialists, machinery, irrigation, agrochemistry and greenhouses.',
    },
    results: [
      { value: '100+', label: { ru: 'компаний', en: 'exhibiting companies' } },
      { value: '4 500+', label: { ru: 'специалистов', en: 'trade visitors' } },
      { value: '5', label: { ru: 'стран-участниц', en: 'participating countries' } },
    ],
    catalogue: '/files/catalog-agro-2026.pdf',
    report: {
      highlights: [
        { ru: 'Первая агровыставка серии', en: 'The first agro show of the series' },
        { ru: 'Компании из Узбекистана, России, Турции, Нидерландов и Германии', en: 'Companies from Uzbekistan, Russia, Türkiye, the Netherlands and Germany' },
        { ru: 'Техника, орошение, агрохимия и теплицы в зале и на улице', en: 'Machinery, irrigation, agrochemistry and greenhouses, indoors and out' }
      ],
    },
  },

  {
    id: 'world-edu-2026-spring',
    start: '2026-04-10',
    eventSlug: 'world-edu-expo',
    year: 2026,
    dates: '10–11.04.2026',
    title: { ru: 'WORLD EDU 2026 Spring · итоги', en: 'WORLD EDU 2026 Spring · results' },
    summary: {
      ru: 'Образовательная выставка: вузы Узбекистана, России, Беларуси, Казахстана, представительства зарубежных университетов, тестирование IELTS/GMAT/SAT и розыгрыш призов.',
      en: 'The education exhibition: universities from Uzbekistan, Russia, Belarus and Kazakhstan, foreign university branches, IELTS/GMAT/SAT testing and the prize draw.',
    },
    results: [
      { value: '2', label: { ru: 'дня работы', en: 'days' } },
      { value: '10+', label: { ru: 'стран-участниц', en: 'countries' } },
      { value: '2', label: { ru: 'смартфона в розыгрыше', en: 'smartphones drawn' } },
    ],
    catalogue: '/files/world-edu-catalog-2024.pdf',
    report: {
      highlights: [
        { ru: 'Вузы Узбекистана, России, Беларуси, Казахстана и зарубежные представительства', en: 'Universities from Uzbekistan, Russia, Belarus, Kazakhstan and foreign branches' },
        { ru: 'Тестирование IELTS, GMAT и SAT на площадке', en: 'IELTS, GMAT and SAT testing on site' },
        { ru: 'Розыгрыш призов для посетителей', en: 'A prize draw for visitors' }
      ],
    },
  },

  {
    id: 'ecom-retail-2025',
    start: '2025-11-18',
    eventSlug: 'ecom-retail-expo',
    year: 2025,
    dates: '18–19.11.2025',
    title: { ru: 'ECOM & RETAIL EXPO SAMARKAND 2025 · итоги', en: 'ECOM & RETAIL EXPO SAMARKAND 2025 · results' },
    summary: {
      ru: 'Выставка-форум e-commerce и ритейла при поддержке Управления Самаркандской области и Ассоциации продавцов Узбекистана: 12+ спикеров, треки по маркетплейсам, логистике и финтеху.',
      en: 'The e-commerce and retail forum supported by the Samarkand Regional Administration and the Uzbekistan Sellers Association: 12+ speakers, marketplace, logistics and fintech tracks.',
    },
    results: [
      { value: '12+', label: { ru: 'спикеров форума', en: 'forum speakers' } },
      { value: '9', label: { ru: 'тематических треков', en: 'thematic tracks' } },
      { value: '2', label: { ru: 'дня программы', en: 'programme days' } },
    ],
    report: {
      highlights: [
        { ru: '12+ спикеров форума и 9 тематических треков', en: '12+ forum speakers across nine thematic tracks' },
        { ru: 'Треки по маркетплейсам, логистике и финтеху', en: 'Marketplace, logistics and fintech tracks' },
        { ru: 'При поддержке Управления Самаркандской области и Ассоциации продавцов Узбекистана', en: 'Supported by the Samarkand Regional Administration and the Uzbekistan Sellers Association' }
      ],
    },
  },

];
