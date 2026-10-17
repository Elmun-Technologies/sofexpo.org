import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { KEY, urlsForChanged, sitemapUrls } from '../scripts/indexnow.mjs';

test('the IndexNow key file is published with the key as its only content', () => {
  const file = new URL(`../public/${KEY}.txt`, import.meta.url);
  assert.ok(existsSync(file));
  assert.equal(readFileSync(file, 'utf8').trim(), KEY);
});

test('a changed article maps to its page in all five locales plus the hubs', () => {
  const urls = urlsForChanged(['src/content/articles/en/business-trip-to-samarkand-guide.md']);
  for (const l of ['en', 'ru', 'uz', 'zh', 'tr']) {
    assert.ok(urls.includes(`https://sof-expo.com/${l}/articles/business-trip-to-samarkand-guide/`));
    assert.ok(urls.includes(`https://sof-expo.com/${l}/events/foodera-expo/`));
  }
});

test('changes outside the site (backend, docs, tests) submit nothing', () => {
  assert.deepEqual(urlsForChanged(['scripts/backend/server.mjs', 'docs/23-keywords-and-content-plan.md', 'tests/x.test.mjs']), []);
});

test('sitemap URLs on other hosts are never submitted', () => {
  const xml = '<urlset><url><loc>https://sof-expo.com/en/</loc></url><url><loc>https://evil.example/en/</loc></url></urlset>';
  assert.deepEqual(sitemapUrls(xml), ['https://sof-expo.com/en/']);
});
