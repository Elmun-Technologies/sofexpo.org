import { CURRENT_HOST, ROOT_HOST, hrefForPath, ownerOf } from "../data/hosts";

export const locales = ["ru", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeMeta: Record<
  Locale,
  { html: string; og: string; label: string; flag: string; region: string }
> = {
  ru: {
    html: "ru",
    og: "ru_RU",
    label: "Русский",
    flag: "RU",
    region: "ru-RU",
  },
  en: {
    html: "en",
    og: "en_US",
    label: "English",
    flag: "EN",
    region: "en-US",
  },
};

/** `/events/foodera-expo/` -> `/ru/events/foodera-expo/` (always trailing slash). */
export function joinLocale(locale: Locale, path = "/"): string {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] && locales.includes(parts[0] as Locale)) parts.shift();
  return `/${locale}/${parts.join("/")}${parts.length ? "/" : ""}`;
}

/**
 * Locale + host aware link builder — the ONLY function components should use for hrefs.
 *
 * Authored data always speaks root-space paths (`/events/foodera-expo/exhibitors/`).
 * On the host that owns the page the result is a plain root-relative URL; when the page
 * belongs to another host (see `src/data/hosts.ts` and `docs/05-subdomains.md`) the result
 * is absolute, so a relative href could never silently point at a page that was not built.
 * In `alias` mode — the default — every path resolves to this host, i.e. output is
 * byte-identical to the pre-subdomain behaviour.
 */
export function localize(locale: Locale, path = "/"): string {
  return hrefForPath(locale, path);
}

/** Like `localize`, but always stays on the host being built — for identity links
 *  (language switch, self-references) that must never jump to another hostname. */
export function localizeSameHost(locale: Locale, path = "/"): string {
  const owner = ownerOf(path);
  // a relocated page is addressed by its host-local path; anything else stays where it is
  return joinLocale(locale, owner.host === CURRENT_HOST ? owner.path : path);
}

/** Locale pair for a path without locale prefix — used for hreflang. */
export function alternates(path: string) {
  return {
    ru: localizeSameHost("ru", path),
    en: localizeSameHost("en", path),
    "x-default": "/",
  };
}

/** Which other locale a visitor should be swapped to, keeping the same page. */
export function switchHref(current: string, target: Locale): string {
  return localizeSameHost(target, current);
}

export function localeFromPath(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return locales.includes(first as Locale) ? (first as Locale) : defaultLocale;
}
