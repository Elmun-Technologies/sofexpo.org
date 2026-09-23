#!/usr/bin/env node
/** Inspect publication readiness. Does not certify PDF contents or approve legal terms. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export function inspectDownloads(publicRoot, inventory) {
  const root = resolve(publicRoot);
  const records = [], errors = [];
  const walk = dir => existsSync(dir) ? readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(resolve(dir,e.name)) : [resolve(dir,e.name)]) : [];
  const found = new Set(walk(resolve(root,'files')).filter(f => f.toLowerCase().endsWith('.pdf')));
  for (const [href, metadata] of Object.entries(inventory)) {
    const path = resolve(root, href.replace(/^\//, ''));
    if (!href.startsWith('/files/') || !path.startsWith(resolve(root,'files') + sep) || !href.endsWith('.pdf')) {
      errors.push(`${href}: invalid inventory path`); continue;
    }
    if (!['placeholder', 'ready'].includes(metadata.status) || !['en','ru','zh-CN','tr','multilingual'].includes(metadata.language)) errors.push(`${href}: invalid status or language`);
    found.delete(path);
    if (!existsSync(path)) { errors.push(`${href}: file is missing`); continue; }
    const content = readFileSync(path).toString('latin1');
    if (!content.startsWith('%PDF-') || !content.includes('%%EOF')) errors.push(`${href}: PDF signature or end marker is missing`);
    const containsPlaceholder = /This file is a placeholder in the repository build/i.test(content);
    if (containsPlaceholder && metadata.status === 'ready') errors.push(`${href}: marked ready but still contains the repository placeholder`);
    records.push({href, ...metadata, containsPlaceholder});
  }
  for (const path of found) errors.push(`/${relative(root,path).split(sep).join('/')}: PDF has no publication metadata`);
  return {records, errors, pending: records.filter(r => r.status !== 'ready' || r.containsPlaceholder)};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inventory = JSON.parse(readFileSync(new URL('../src/data/downloads.json', import.meta.url), 'utf8'));
  const strict = process.argv.includes('--require-final');
  const result = inspectDownloads('public', inventory);
  for (const error of result.errors) console.error(error);
  for (const record of result.pending) console.log(`PENDING  ${record.language.padEnd(5)} ${record.href}`);
  console.log(`Downloads: ${result.records.length} PDFs, ${result.pending.length} pending, ${result.errors.length} inventory errors.`);
  if (result.pending.length) console.log('Supply the real, approved documents and update src/data/downloads.json. Do not mark samples ready.');
  if (strict && result.pending.length) console.error('Release blocked: final documents have not been supplied.');
  process.exitCode = result.errors.length || (strict && result.pending.length) ? 1 : 0;
}
