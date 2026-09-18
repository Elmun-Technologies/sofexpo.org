export const locales = ['ru', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeMeta: Record<
  Locale,
  { html: string; og: string; label: string; flag: string; region: string }
> = {
  ru: { html: 'ru', og: 'ru_RU', label: 'Русский', flag: 'RU', region: 'ru-RU' },
  en: { html: 'en', og: 'en_US', label: 'English', flag: 'EN', region: 'en-US' },
};

/** `/events/foodera-expo/` -> `/ru/events/foodera-expo/` (always trailing slash). */
export function localize(locale: Locale, path = '/'): string {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] && locales.includes(parts[0] as Locale)) parts.shift();
  return `/${locale}/${parts.join('/')}${parts.length ? '/' : ''}`;
}

/** Locale pair for a path without locale prefix — used for hreflang. */
export function alternates(path: string) {
  return {
    ru: localize('ru', path),
    en: localize('en', path),
    'x-default': '/',
  };
}

/** Which other locale a visitor should be swapped to, keeping the same page. */
export function switchHref(current: string, target: Locale): string {
  return localize(target, current);
}

export function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return locales.includes(first as Locale) ? (first as Locale) : defaultLocale;
}
