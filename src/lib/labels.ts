import type { Locale } from '@/i18n/config';

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
