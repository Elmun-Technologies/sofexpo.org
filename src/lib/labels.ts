import type { SourceLocale as Locale } from '@/i18n/config';

/**
 * Human labels for the internal keys that used to leak into the UI as raw slugs
 * (`food`, `automotive`, `guide`, `foodera-expo` …). One map, both locales, used by
 * post cards, the line-up page and the event hero kicker.
 */
const INDUSTRY: Record<string, { ru: string; en: string }> = {
  food: { ru: 'Продукты и напитки', en: 'Food and beverages' },
  construction: { ru: 'Строительство и архитектура', en: 'Construction and architecture' },
  agriculture: { ru: 'Агропром', en: 'Agriculture' },
  agro: { ru: 'Агропром', en: 'Agriculture' },
  automotive: { ru: 'Автоиндустрия', en: 'Automotive' },
  ecommerce: { ru: 'E-commerce и ритейл', en: 'E-commerce and retail' },
  education: { ru: 'Образование', en: 'Education' },
  company: { ru: 'Центр', en: 'The centre' },
  guide: { ru: 'Практика', en: 'How-to' },
  market: { ru: 'Рынок', en: 'Market' },
};

export function industryLabel(key: string | undefined, locale: Locale): string {
  if (!key) return locale === 'ru' ? 'Заметка' : 'Note';
  return INDUSTRY[key]?.[locale] ?? key;
}

/**
 * One calm colour per industry: the 4px rule and date block of a show's calendar row.
 * Muted, low-saturation — the site stays a specification sheet, the colour only routes the eye.
 */
const INDUSTRY_COLOR: Record<string, string> = {
  food: '#2e6e4b',
  construction: '#7d5a26',
  agriculture: '#5c7233',
  agro: '#5c7233',
  automotive: '#3c556e',
  ecommerce: '#6e4a63',
  education: '#2f5d76',
  company: '#0f2b1c',
  guide: '#4b5350',
  market: '#4b5350',
};

export function industryColor(key: string | undefined, fallback = 'var(--ink-40)'): string {
  if (!key) return fallback;
  return INDUSTRY_COLOR[key] ?? fallback;
}

/** Short month, for the big date block: `2026-10-20` → `ОКТ` / `OCT`. */
const MONTH_SHORT: Record<string, { ru: string; en: string }> = {
  '01': { ru: 'ЯНВ', en: 'JAN' },
  '02': { ru: 'ФЕВ', en: 'FEB' },
  '03': { ru: 'МАР', en: 'MAR' },
  '04': { ru: 'АПР', en: 'APR' },
  '05': { ru: 'МАЙ', en: 'MAY' },
  '06': { ru: 'ИЮН', en: 'JUN' },
  '07': { ru: 'ИЮЛ', en: 'JUL' },
  '08': { ru: 'АВГ', en: 'AUG' },
  '09': { ru: 'СЕН', en: 'SEP' },
  '10': { ru: 'ОКТ', en: 'OCT' },
  '11': { ru: 'НОЯ', en: 'NOV' },
  '12': { ru: 'ДЕК', en: 'DEC' },
};

/**
 * The calendar hero's date, e.g. `20–22 ОКТ 2026` / `20–22 OCT 2026`.
 * The date is the biggest element on a trade-show page — it is what visitors come for.
 */
export function bigDate(start: string, end: string, locale: Locale): { days: string; month: string; year: string } {
  const a = start.slice(5);
  const b = end.slice(5);
  const dayA = start.slice(8, 10);
  const dayB = end.slice(8, 10);
  const days = dayA === dayB ? dayA : `${dayA}–${dayB}`;
  const month = MONTH_SHORT[a.slice(0, 2)]?.[locale] ?? '';
  const year = start.slice(0, 4);
  return { days, month, year };
}

/** Whole days from now (site timezone) until `start`; 0 while running, negative when past. */
export function daysUntil(start: string): number {
  const tz = Date.now();
  const target = new Date(`${start}T09:00:00+05:00`).getTime();
  return Math.ceil((target - tz) / 86400000);
}

/** `2026-09-16` → `16 сентября 2026` / `16 September 2026` */
export function humanDate(d: Date | string, locale: Locale): string {
  const date = typeof d === 'string' ? new Date(`${d}T12:00:00+05:00`) : d;
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Samarkand',
  }).format(date);
}
