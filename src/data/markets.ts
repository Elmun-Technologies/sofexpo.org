import type { SourceLocale as Locale } from '@/i18n/config';

/**
 * The markets around the centre (docs/13 P2 — "why Samarkand" with numbers, not adjectives).
 *
 * Every figure below is quoted with its source and its year, because a market claim on an
 * expo site is either checkable or it is advertising. The five neighbours are the reach a
 * stand at SOF EXPO buys beyond Uzbekistan itself: one flight or one overnight truck.
 */
export interface NeighbourMarket {
  id: string;
  name: Record<Locale, string>;
  capital: Record<Locale, string>;
  /** straight-line distance from the centre, km */
  distanceKm: number;
  /** population, millions (2025) */
  populationMln: number;
  /** GDP, billion USD — `gdpYear` because one country lags a year behind */
  gdpBlnUsd: number;
  gdpYear: string;
  /** GDP per capita, USD */
  gdpPerCapitaUsd: number;
  /** GDP growth, % */
  growthPct: number;
  /** the year the growth figure belongs to */
  year: string;
  /** what this market means for an exhibitor — one line, no numbers to check */
  note: Record<Locale, string>;
}

export const neighbours: NeighbourMarket[] = [
  {
    id: 'kz',
    name: { ru: 'Казахстан', en: 'Kazakhstan' },
    capital: { ru: 'Астана', en: 'Astana' },
    distanceKm: 1320,
    populationMln: 20.8,
    gdpBlnUsd: 306.2,
    gdpYear: '2025',
    gdpPerCapitaUsd: 14692,
    growthPct: 6.5,
    year: '2025',
    note: {
      ru: 'крупнейший импортёр продуктов питания в ЦА',
      en: 'the largest food importer in Central Asia',
    },
  },
  {
    id: 'tm',
    name: { ru: 'Туркменистан', en: 'Turkmenistan' },
    capital: { ru: 'Ашхабад', en: 'Ashgabat' },
    distanceKm: 790,
    populationMln: 7.6,
    gdpBlnUsd: 49.8,
    gdpYear: '2025',
    gdpPerCapitaUsd: 6540,
    growthPct: 6.3,
    year: '2025',
    note: { ru: 'госзакупки и тендеры', en: 'state procurement and tenders' },
  },
  {
    id: 'tj',
    name: { ru: 'Таджикистан', en: 'Tajikistan' },
    capital: { ru: 'Душанбе', en: 'Dushanbe' },
    distanceKm: 190,
    populationMln: 10.8,
    gdpBlnUsd: 17.7,
    gdpYear: '2025',
    gdpPerCapitaUsd: 1637,
    growthPct: 8.4,
    year: '2025',
    note: { ru: 'высокая доля узбекского импорта', en: 'a high share of imports from Uzbekistan' },
  },
  {
    id: 'af',
    name: { ru: 'Афганистан', en: 'Afghanistan' },
    capital: { ru: 'Кабул', en: 'Kabul' },
    distanceKm: 600,
    populationMln: 43.8,
    gdpBlnUsd: 17.8,
    gdpYear: '2024',
    gdpPerCapitaUsd: 417,
    growthPct: 1.9,
    year: '2024',
    note: { ru: 'приграничная торговля через Термез', en: 'border trade through Termez' },
  },
  {
    id: 'kg',
    name: { ru: 'Кыргызстан', en: 'Kyrgyzstan' },
    capital: { ru: 'Бишкек', en: 'Bishkek' },
    distanceKm: 710,
    populationMln: 7.3,
    gdpBlnUsd: 22.6,
    gdpYear: '2025',
    gdpPerCapitaUsd: 3081,
    growthPct: 11.1,
    year: '2025',
    note: { ru: 'розничные сети и опт', en: 'retail chains and wholesale' },
  },
];

/** The five neighbours together — the number a stand actually buys. */
export const neighbourTotals = {
  populationMln: 90.4,
  populationYear: '2025',
  gdpBlnUsd: 414.1,
  gdpYear: '2024–2025',
};

export const marketSource: Record<Locale, string> = {
  ru: 'Источник: Всемирный банк, World Development Indicators (июль 2026).',
  en: 'Source: World Bank, World Development Indicators (July 2026).',
};
