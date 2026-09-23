#!/usr/bin/env node
/** Deterministic checks for translation corruption, not a claim of linguistic review. */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { translator } from './localization.mjs';

export function translationProblems(source, target) {
  const problems = [];
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
  for (const locale of ['zh', 'tr']) {
    const translate = translator(locale, { strict: true });
    for (const source of sources) {
      try {
        for (const problem of translationProblems(source, translate(source))) problems.push({locale, source, problem});
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
  console.log(`Translation integrity: ${result.sources} source strings × 2 languages, ${result.problems.length} issues.`);
  console.log('This check does not replace native-language or legal review.');
  process.exitCode = result.problems.length ? 1 : 0;
}
