#!/usr/bin/env node
/**
 * Which EN text nodes still lack a zh / tr / uz translation (docs/23 §4).
 * Run after an EN-only build, then add the strings to src/i18n/catalogs/*.json:
 *   I18N_EXTRACT=1 npx astro build && node scripts/i18n-missing.mjs [out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { filesUnder } from './localized-editions.mjs';
import { localizeHTML, localizeRSS, localizeSearchJSON } from './localization.mjs';

const out = {};
for (const locale of ['zh', 'tr', 'uz']) {
  const missing = new Set();
  for (const file of filesUnder('dist/en')) {
    if (!/\.(html|xml|json)$/.test(file)) continue;
    const source = readFileSync(file, 'utf8');
    const options = { strict: false, missing };
    if (file.endsWith('.html')) localizeHTML(source, locale, options);
    else if (file.endsWith('.json')) localizeSearchJSON(source, locale, options);
    else localizeRSS(source, locale, options);
  }
  out[locale] = [...missing].sort();
  console.log(`${locale}: ${missing.size} missing`);
}
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(out, null, 2) + '\n');
else for (const s of new Set(Object.values(out).flat())) console.log(`  ${s}`);
