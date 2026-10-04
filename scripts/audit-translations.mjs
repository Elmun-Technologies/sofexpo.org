#!/usr/bin/env node
/** Deterministic checks for translation corruption, not a claim of linguistic review. */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { translator } from './localization.mjs';

/* Proper names a machine translation tends to mangle ("Samarkand" came out as "Semmark",
   "Semaretand", "Sembahpostası" …): when the source names the place, the translation must
   name it too, in the target's own spelling or the protected Latin brand form. */
const NAMES = [
  { source: /Samarkand/i, zh: /撒马尔罕|Samarkand/i, tr: /Semerkant|Samarkand/i, uz: /Samarqand|Samarkand/i },
  { source: /Tashkent/i, zh: /塔什干|Tashkent/i, tr: /Taşkent|Tashkent/i, uz: /Toshkent|Tashkent/i },
  { source: /Uzbekistan/i, zh: /乌兹别克|Uzbekistan/i, tr: /Özbekistan|Uzbekistan/i, uz: /O[‘'ʻ]?zbekiston|Uzbekistan/i },
];

export function translationProblems(source, target, locale) {
  const problems = [];
  if (locale) {
    for (const name of NAMES) if (name.source.test(source) && !name[locale].test(target)) problems.push(`proper name lost (${name.source.source})`);
  }
  if (/\b(\d{4}) \1\b/.test(target) && !/\b(\d{4}) \1\b/.test(source)) problems.push('year printed twice');
  if (/[⁇�]/u.test(target) && !/[⁇�]/u.test(source)) problems.push('replacement or undecodable character');
  const repeated = /(.{3,60}?)\1{3,}/u;
  if (repeated.test(target.replace(/\s+/g, '')) && !repeated.test(source.replace(/\s+/g, ''))) problems.push('repeated translation fragment');
  if (target.length > Math.max(160, source.length * 4)) problems.push('implausible translation expansion');
  return problems;
}

export function auditTranslations() {
  const sources = new Set();
  for (const name of ['catalogs/zh', 'catalogs/tr', 'reviewed']) {
    for (const source of Object.keys(JSON.parse(readFileSync(new URL(`../src/i18n/${name}.json`, import.meta.url), 'utf8')))) sources.add(source);
  }
  const problems = [];
  /* uz publishes page by page, so its catalog may lack strings of retired pages: it is
     checked for corruption only, not for completeness (the build enforces that per page) */
  for (const locale of ['zh', 'tr', 'uz']) {
    const translate = translator(locale, { strict: locale !== 'uz' });
    for (const source of sources) {
      try {
        for (const problem of translationProblems(source, translate(source), locale)) problems.push({locale, source, problem});
      } catch (error) {
        problems.push({locale, source, problem: error.message});
      }
    }
  }
  return { sources: sources.size, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = auditTranslations();
  for (const item of result.problems) console.error(`${item.locale}: ${item.problem}: ${item.source}`);
  console.log(`Translation integrity: ${result.sources} source strings × 3 languages, ${result.problems.length} issues.`);
  console.log('This check does not replace native-language or legal review.');
  process.exitCode = result.problems.length ? 1 : 0;
}
