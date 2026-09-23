/**
 * Figures ("4 400 м²", "125 млн+", "от 36 м²", "5-е") are authored once, usually in
 * Russian notation, and reused by both editions. Rendering them verbatim leaked Cyrillic
 * units into the English pages. `fig()` is the single place that turns an authored figure
 * into the notation of the page's locale. Russian output is returned untouched.
 */
import type { SourceLocale as Locale } from '@/i18n/config';

const WORDS: [RegExp, string][] = [
  [/^от\s+/i, 'from '],
  [/^до\s+/i, 'up to '],
  [/^улица\s+/i, 'outdoor '],
  [/\s*\/\s*улица$/i, ' / outdoor'],
  [/^за\s+м²$/i, 'per m²'],
  [/^по проекту$/i, 'on request'],
  [/^по регламенту$/i, 'per regulations'],
  [/^в зале$/i, 'in the hall'],
  [/^Спонсорский пакет$/i, 'Sponsorship package'],
  [/^итоги$/i, 'results'],
  [/^пакеты$/i, 'packages'],
  [/^документы$/i, 'documents'],
  [/^импорт$/i, 'import'],
  [/^экспорт$/i, 'export'],
  [/^стенд$/i, 'stand'],
  [/^бюджет$/i, 'budget'],
  [/^эффективность$/i, 'ROI'],
  [/^аналитика$/i, 'analytics'],
  [/^маркетплейсы$/i, 'marketplaces'],
  [/^компания$/i, 'company'],
  [/^сайт$/i, 'website'],
  [/\bэкс-/g, 'ex-'],
];

const UNITS: [RegExp, string][] = [
  [/м²/g, 'm²'],
  [/м³/g, 'm³'],
  [/(\d)\s*кВт(?![\u0400-\u04FF])/g, '$1 kW'],
  [/(\d)\s*В(?![\u0400-\u04FF])/g, '$1 V'],
  [/(\d)\s*км(?![\u0400-\u04FF])/g, '$1 km'],
  [/(\d)\s*мин(?![\u0400-\u04FF])/g, '$1 min'],
  [/(\d)\s*ч(?![\u0400-\u04FF])/g, '$1 h'],
  [/(\d)\s*т(?![\u0400-\u04FF])/g, '$1 t'],
  [/(\d)\s*м(?![\u0400-\u04FF])/g, '$1 m'],
  [/([\d–.,-]+)\s*млрд\s*\$/g, '$$$1 bn'],
  [/\$([\d–.,-]+)\s*млрд/g, '$$$1 bn'],
  [/\s*млрд(?![\u0400-\u04FF])/g, ' bn'],
  [/\s*млн\s*сум(ов)?/g, ' M UZS'],
  [/\s*млн(?![\u0400-\u04FF])/g, ' M'],
  [/\s*тыс\.?/g, 'k'],
  [/\s*сум(ов)?(?![\u0400-\u04FF])/g, ' UZS'],
];

/** "4 400" → "4,400" (thin/normal space thousands separator → comma) */
const thousands = (s: string) => s.replace(/(\d)[\s\u00a0\u202f](?=\d{3}\b)/g, '$1,');

export function fig(value: string | undefined | null, locale: Locale | string): string {
  if (value == null) return '';
  const v = String(value);
  if (locale === 'ru' || !/[\u0400-\u04FF]|\d[\s\u00a0]\d{3}/.test(v)) return v;
  let out = v.trim();
  const ord = /^(\d+)-(е|й|я|ое|ий|ая)$/.exec(out);
  if (ord) {
    const n = Number(ord[1]);
    const suf = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
    return `${n}${suf}`;
  }
  for (const [re, to] of WORDS) out = out.replace(re, to);
  for (const [re, to] of UNITS) out = out.replace(re, to);
  return thousands(out);
}

/** For HTML strings (table cells): only touches text, never markup. */
export function figHtml(html: string, locale: Locale | string): string {
  if (locale === 'ru' || !/[\u0400-\u04FF]/.test(html)) return html;
  return html.replace(/(^|>)([^<]+)(?=<|$)/g, (_, a, text) => {
    const lead = /^\s*/.exec(text)![0];
    const tail = /\s*$/.exec(text)![0];
    return a + lead + fig(text, locale) + (text.trim() ? tail : '');
  });
}
