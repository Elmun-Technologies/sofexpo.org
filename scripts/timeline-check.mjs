#!/usr/bin/env node
/**
 * Show timeline pre-flight (docs/24 §5): the nightly rebuild flips a show to "past" the day
 * after it closes, and that changes text on its pages ("BUILD PRO is over for this year…").
 * zh/tr builds fail on an untranslated string, so a rollover nobody tested would leave the
 * live site stale on that morning. This renders the site as it will look the day after every
 * show still ahead closes and lists any text that still needs a zh/tr/uz translation.
 *
 *   npm run timeline:check          # after adding a show or changing show copy
 *
 * Exit 1 = strings to add to src/i18n/catalogs/*.json (then run it again).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { upcoming, TODAY } from '../src/data/events.ts';

const dayAfter = (iso) => new Date(Date.parse(`${iso}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
const dates = [...new Set(upcoming.map((e) => dayAfter(e.dates.end)))].filter((d) => d > TODAY).sort();
if (!dates.length) {
  console.log('timeline: no show ahead — nothing to check');
  process.exit(0);
}

const scratch = mkdtempSync(join(tmpdir(), 'sofexpo-timeline-'));
const missing = new Map();
for (const date of dates) {
  const env = { ...process.env, SITE_TODAY: date, I18N_EXTRACT: '1' };
  const build = spawnSync('npx', ['astro', 'build'], { env, stdio: ['ignore', 'ignore', 'inherit'] });
  if (build.status !== 0) {
    console.error(`✗ ${date}: the site does not build on that day`);
    process.exit(1);
  }
  const out = join(scratch, `${date}.json`);
  spawnSync(process.execPath, ['scripts/i18n-missing.mjs', out], { stdio: 'ignore' });
  const found = JSON.parse(readFileSync(out, 'utf8'));
  const strings = new Set([...(found.zh ?? []), ...(found.tr ?? [])]);
  for (const s of strings) if (!missing.has(s)) missing.set(s, date);
  console.log(`${strings.size ? '✗' : '✓'} ${date} — ${strings.size} untranslated`);
}
rmSync(scratch, { recursive: true, force: true });
console.log('note: dist/ now holds an EN-only build — run `npm run build` before previewing or deploying');

if (missing.size) {
  console.log('\nAdd to src/i18n/catalogs/{zh,tr,uz}.json:');
  for (const [s, date] of missing) console.log(`  [from ${date}] ${s}`);
  process.exit(1);
}
