/**
 * Where the iCalendar file of one edition lives *in this build*.
 *
 * The line-up calendar (`/sofexpo-calendar.ics`) is one file for the whole season; an
 * exhibitor or a visitor wants the dates of the one show they are coming to, so every
 * edition also gets its own file next to its own page. In subdomain mode that page
 * moves to the show's hostname, and the file moves with it — the rule below is the
 * single source of truth for both the link (this module) and the file
 * (`scripts/ics.mjs`, which re-implements it against `scripts/host-rules.mjs` because
 * a plain Node script cannot import the app's TS modules). Change one, change both.
 */
import { CURRENT_EVENT, isBuiltHere } from '@/data/hosts';

export function icsFileName(slug: string, startISO: string): string {
  return `${slug}-${startISO.slice(0, 4)}.ics`;
}

/** Locale-free path of the edition's .ics, or null where the cluster is only a stub. */
export function eventIcsPath(slug: string, startISO: string): string | null {
  const file = icsFileName(slug, startISO);
  if (isBuiltHere(`/events/${slug}/`)) return `/events/${slug}/${file}`;
  if (CURRENT_EVENT === slug) return `/${file}`;
  return null;
}
