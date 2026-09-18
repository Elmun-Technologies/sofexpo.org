import { locales, type Locale } from "@/i18n/config";
import { CURRENT_EVENT, isRootHost } from "@/data/hosts";
import { localePaths } from "@/lib/pages";

/**
 * Route helpers for the multi-host build (see `docs/05-subdomains.md`).
 *
 * Everything that belongs to the centre — the calendar, the audience hubs, ALL editorial,
 * search, feeds — is published on the root host only. An exhibition hostname builds its own
 * cluster and links to those pages with absolute URLs, which `localize()` produces on its own,
 * so a route that is not meant for the event host simply returns no paths.
 */
export function rootOnlyPaths(): { params: { locale: Locale } }[] {
  return isRootHost ? localePaths() : [];
}

/** Locales of the host being built (an event host serves both, like the centre). */
export function hostLocales(): Locale[] {
  return locales;
}

/** The exhibition this hostname is dedicated to, if any. */
export const hostEventSlug = CURRENT_EVENT;
