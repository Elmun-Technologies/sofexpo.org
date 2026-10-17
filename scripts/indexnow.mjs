#!/usr/bin/env node
/**
 * IndexNow (docs/23 §5): tells Bing, Yandex, Seznam and Naver that pages changed, instead of
 * waiting for the next crawl. ChatGPT search and Copilot answer from the Bing index, so this is
 * also how a new article reaches the AI answer engines within hours.
 *
 *   node scripts/indexnow.mjs --changed HEAD~1   # pages touched by the last push (CI)
 *   node scripts/indexnow.mjs --all              # every URL of dist/sitemap-0.xml (after a build)
 *   node scripts/indexnow.mjs --dry-run …        # print, send nothing
 *
 * The key is public by design: the engines fetch https://sof-expo.com/<key>.txt to check that
 * the submitter controls the host (public/<key>.txt).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const HOST = 'sof-expo.com';
export const KEY = '8830aa4f998c40a12f5f358f2094ca8a';
export const LOCALES = ['en', 'ru', 'uz', 'zh', 'tr'];
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/* the pages every content push can move: home, calendar, show pages and the two indexes */
const HUBS = ['', 'events/', 'articles/', 'news/', 'events/foodera-expo/', 'events/buildpro-expo/', 'events/agropro-expo/', 'events/world-edu-expo/', 'events/ecom-retail-expo/', 'events/promotors-show-samarkand/'];

const url = (locale, path) => `https://${HOST}/${locale}/${path}`;

/** repo paths changed by a push → the public URLs they render, in every locale */
export function urlsForChanged(files) {
  const out = new Set();
  let touched = false;
  for (const file of files) {
    const post = /^src\/content\/(news|articles)\/(?:ru|en)\/([a-z0-9-]+)\.md$/.exec(file);
    if (post) for (const l of LOCALES) out.add(url(l, `${post[1]}/${post[2]}/`));
    if (post || /^src\/(data|pages|components|i18n|layouts)\//.test(file) || file === 'public/llms.txt') touched = true;
  }
  if (touched) for (const l of LOCALES) for (const h of HUBS) out.add(url(l, h));
  return [...out].sort();
}

export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => new URL(u).hostname === HOST);
}

async function submit(urlList) {
  /* IndexNow takes up to 10 000 URLs per request */
  for (let i = 0; i < urlList.length; i += 10000) {
    const chunk = urlList.slice(i, i + 10000);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: chunk }),
    });
    /* 200 = accepted, 202 = accepted while the key is being verified */
    console.log(`indexnow: ${chunk.length} URL(s) → HTTP ${res.status}`);
    if (res.status !== 200 && res.status !== 202) throw new Error(`IndexNow refused the batch: ${res.status} ${await res.text()}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run');
  let list = [];
  if (args.includes('--all')) list = sitemapUrls(readFileSync('dist/sitemap-0.xml', 'utf8'));
  const i = args.indexOf('--changed');
  if (i >= 0) {
    const base = args[i + 1] ?? 'HEAD~1';
    const files = execFileSync('git', ['diff', '--name-only', `${base}..HEAD`], { encoding: 'utf8' }).split('\n').filter(Boolean);
    list = [...new Set([...list, ...urlsForChanged(files)])];
  }
  if (!list.length) { console.log('indexnow: nothing to submit'); process.exit(0); }
  if (dry) { console.log(list.join('\n')); console.log(`indexnow: ${list.length} URL(s) (dry run)`); }
  else await submit(list);
}
