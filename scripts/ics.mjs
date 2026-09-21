/**
 * `sofexpo-calendar.ics` — the line-up as an iCalendar file, generated at build time
 * from `src/data/events.ts` (docs/08 §4.3). One VEVENT per edition, all-day, with the
 * show's page as URL/DESCRIPTION. Written into dist/ after the build, so every host output
 * carries a fresh, in-sync copy — no stale file in public/.
 *
 * Node ≥ 22.18 strips the types from the imported .ts on its own.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { events } from '../src/data/events.ts';
import { site } from '../src/data/site.ts';

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
      },
    },
  };
}
