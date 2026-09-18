import { locales, type Locale } from '@/i18n/config';
import { events, type ExpoEvent } from '@/data/events';

/** Static paths for a plain page in both locales. */
export function localePaths() {
  return locales.map((locale) => ({ params: { locale } }));
}

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Static paths for every event detail page in both locales. */
export function eventPaths(extra: Record<string, string> = {}) {
  const out: { params: Record<string, string> }[] = [];
  for (const locale of locales) {
    for (const event of events) out.push({ params: { locale, slug: event.slug, ...extra } });
  }
  return out;
}

export const eventSlugs = events.map((e) => e.slug);
export { events };
export type { ExpoEvent };
