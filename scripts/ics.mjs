/**
 * `sofexpo-calendar.ics` — the line-up as an iCalendar file, generated at build time
 * from `src/data/events.ts` (docs/08 §4.3). One VEVENT per edition, all-day, with the
 * show's page as URL/DESCRIPTION. Written into dist/ after the build, so every host output
 * carries a fresh, in-sync copy — no stale file in public/.
 *
 * Node ≥ 22.18 strips the types from the imported .ts on its own.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { events } from '../src/data/events.ts';
import { site } from '../src/data/site.ts';
import { eventOfHost, isBuiltHere } from './host-rules.mjs';

const ROOT = site.domain.replace(/\/$/, '');

function fmtDate(iso) {
  return iso.replaceAll('-', '');
}

function endExclusive(iso) {
  const d = new Date(`${iso}T12:00:00+05:00`);
  d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
}

function fold(line) {
  /* RFC 5545 §3.1: lines longer than 75 octets fold; our summaries are ASCII, so chars == octets */
  if (line.length <= 75) return [line];
  const out = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    out.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return out;
}

function stamp(now, p) {
  return `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}T${p(now.getUTCHours())}${p(now.getUTCMinutes())}00Z`;
}

/** One VEVENT wrapped in its own calendar — the file behind "add this show to calendar". */
export function buildEventIcs(e, stampValue) {
  const p = (n) => String(n).padStart(2, '0');
  const s = stampValue ?? stamp(new Date(), p);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SOF EXPO Samarkand//Line-up 2026-2027//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${e.brand.en} — SOF EXPO Samarkand`,
    'BEGIN:VEVENT',
    `UID:${e.slug}-${e.dates.start}@sofexpo.org`,
    `DTSTAMP:${s}`,
    `DTSTART;VALUE=DATE:${fmtDate(e.dates.start)}`,
    `DTEND;VALUE=DATE:${endExclusive(e.dates.end)}`,
    ...fold(`SUMMARY:${e.brand.en} — SOF EXPO Samarkand`),
    'LOCATION:SOF EXPO Samarkand, Dzhambay district, Samarkand, Uzbekistan',
    ...fold(`DESCRIPTION:${e.tagline?.en ?? e.edition?.en ?? ''} — ${ROOT}/en/events/${e.slug}/`),
    `URL:${ROOT}/en/events/${e.slug}/`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function buildIcs() {
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}T${p(now.getUTCHours())}${p(now.getUTCMinutes())}00Z`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SOF EXPO Samarkand//Line-up 2026-2027//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SOF EXPO Samarkand — line-up',
  ];

  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.slug}-${e.dates.start}@sofexpo.org`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${fmtDate(e.dates.start)}`,
      `DTEND;VALUE=DATE:${endExclusive(e.dates.end)}`,
      ...fold(`SUMMARY:${e.brand.en} — SOF EXPO Samarkand`),
      'LOCATION:SOF EXPO Samarkand, Dzhambay district, Samarkand, Uzbekistan',
      ...fold(`DESCRIPTION:${ROOT}/en/events/${e.slug}/`),
      `URL:${ROOT}/en/events/${e.slug}/`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

/** Astro integration: the file lands in every host's dist/ after the build. */
export function icsIntegration() {
  return {
    name: 'sofexpo-ics',
    hooks: {
      'astro:build:done': ({ dir }) => {
        // dir arrives as a file:// URL (Astro ≥5) or a path string — normalise both
        const root = dir instanceof URL ? fileURLToPath(dir) : String(dir).replace(/\/+$/, '');
        writeFileSync(`${root}/sofexpo-calendar.ics`, buildIcs());
        /* one file per edition, next to the edition's own page (see src/lib/ics.ts) */
        const mode = process.env.PUBLIC_HOSTS_MODE === 'subdomain' ? 'subdomain' : 'alias';
        const currentHost = (process.env.SITE || `https://${site.domain.replace(/^https?:\/\//, '')}`)
          .replace(/^https?:\/\//, '')
          .replace(/\/+$/, '');
        for (const e of events) {
          const file = `${e.slug}-${e.dates.start.slice(0, 4)}.ics`;
          let rel = null;
          if (isBuiltHere(`/events/${e.slug}/`, { mode, currentHost })) rel = `events/${e.slug}/${file}`;
          else if (eventOfHost(currentHost) === e.slug) rel = file;
          if (!rel) continue;
          const target = `${root}/${rel}`;
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, buildEventIcs(e));
        }
      },
    },
  };
}
