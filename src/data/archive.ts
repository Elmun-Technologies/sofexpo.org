import type { SourceLocale as Locale } from '@/i18n/config';

/** Past editions: proof-of-results pages. These are the strongest SEO/EEAT assets for an expo site. */
export interface Edition {
  id: string;
  eventSlug: string;
  year: number;
  dates: string;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  results: { value: string; label: Record<Locale, string> }[];
  catalogue?: string;
  photo?: string;
}

export const archive: Edition[] = [
  {
    id: 'promotors-2026',
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
  },
  {
    id: 'buildpro-2025',
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
  },
  {
    id: 'agropro-2026',
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
  },
  {
    id: 'world-edu-2026-spring',
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
  },
  {
    id: 'ecom-retail-2025',
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
  },
];
