import test from 'node:test';
import assert from 'node:assert/strict';
import { entitiesToHtml, htmlToEntities, safeUrl } from '../scripts/backend/tgblog/html.mjs';

test('emoji offsets: bold after emojis covers the intended word', () => {
  const text = '🔥hi🔥 bold rest';
  const offset = text.indexOf('bold'); // UTF-16 index, as Bot API sends it
  const html = entitiesToHtml(text, [{ type: 'bold', offset, length: 4 }]);
  assert.equal(html, '<p>🔥hi🔥 <strong>bold</strong> rest</p>');
});

test('nested bold+italic and strikethrough render as nested tags', () => {
  const text = 'bold and italic done';
  const html = entitiesToHtml(text, [
    { type: 'bold', offset: 0, length: 15 },
    { type: 'italic', offset: 9, length: 6 },
    { type: 'strikethrough', offset: 16, length: 4 },
  ]);
  assert.equal(html, '<p><strong>bold and <em>italic</em></strong> <s>done</s></p>');
});

test('text_link: safe https URL becomes an anchor; unsafe schemes unwrap', () => {
  const text = 'birinchi link va ikkinchi link';
  const html = entitiesToHtml(text, [
    { type: 'text_link', offset: 0, length: 13, url: 'https://example.com/?a=1&b="2"' },
    { type: 'text_link', offset: 17, length: 13, url: 'javascript:alert(1)' },
  ]);
  assert.equal(
    html,
    '<p><a href="https://example.com/?a=1&amp;b=%222%22" target="_blank" rel="noopener">birinchi link</a> va ikkinchi link</p>',
  );
  assert.equal(safeUrl('tg://resolve?domain=x'), null);
  assert.equal(safeUrl('mailto:a@b.uz'), 'mailto:a@b.uz');
});

test('url entity links to the covered text itself', () => {
  const text = 'kanal: https://t.me/sofexpo obuna';
  const offset = text.indexOf('https://');
  const html = entitiesToHtml(text, [{ type: 'url', offset, length: 'https://t.me/sofexpo'.length }]);
  assert.equal(html, '<p>kanal: <a href="https://t.me/sofexpo" target="_blank" rel="noopener">https://t.me/sofexpo</a> obuna</p>');
});

test('paragraphs split on blank lines; single newline becomes <br>', () => {
  const html = entitiesToHtml('Birinchi\nqator\n\nIkkinchi paragraf', []);
  assert.equal(html, '<p>Birinchi<br>qator</p>\n<p>Ikkinchi paragraf</p>');
});

test('code and pre (with language) escape their content', () => {
  const inline = entitiesToHtml('run <x> now', [{ type: 'code', offset: 4, length: 3 }]);
  assert.equal(inline, '<p>run <code>&lt;x&gt;</code> now</p>');
  const text = 'pre boshi\n\nconst a = 1 < 2;\nline two';
  const offset = text.indexOf('const a');
  const html = entitiesToHtml(text, [{ type: 'pre', offset, length: 'const a = 1 < 2;\nline two'.length, language: 'js' }]);
  assert.equal(html, '<p>pre boshi</p>\n<pre><code class="language-js">const a = 1 &lt; 2;\nline two</code></pre>');
});

test('blockquote becomes a block element with paragraphs inside', () => {
  const text = 'kirish so‘zi\n\ndono odam so‘zi\nikkinchi qator';
  const offset = text.indexOf('dono');
  const length = 'dono odam so‘zi\nikkinchi qator'.length;
  const html = entitiesToHtml(text, [{ type: 'blockquote', offset, length }]);
  assert.equal(html, '<p>kirish so‘zi</p>\n<blockquote><p>dono odam so‘zi<br>ikkinchi qator</p></blockquote>');
});

test('spoiler is marked up for CSS hiding', () => {
  const text = 'yashirin matn oco';
  const html = entitiesToHtml(text, [{ type: 'spoiler', offset: 0, length: 13 }]);
  assert.equal(html, '<p><span class="tg-spoiler">yashirin matn</span> oco</p>');
});

test('XSS: raw markup in the text is escaped, never interpreted', () => {
  const html = entitiesToHtml('<script>alert("x")</script> & <img src=x onerror=1>', []);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('unknown/mention/hashtag entities render as plain text', () => {
  const text = '@admin #blog muhim';
  const html = entitiesToHtml(text, [
    { type: 'mention', offset: 0, length: 6 },
    { type: 'hashtag', offset: 7, length: 5 },
  ]);
  assert.equal(html, '<p>@admin #blog muhim</p>');
});

test('htmlToEntities: backfill roundtrip keeps bold, link, br and code', () => {
  const { text, entities } = htmlToEntities(
    '<b>Sarlavha</b> oddiy <a href="https://t.me/sofexpo">havola</a><br>kiyin <code>x=1</code>',
  );
  assert.equal(text, 'Sarlavha oddiy havola\nkiyin x=1');
  const byType = Object.fromEntries(entities.map((e) => [e.type, e]));
  assert.equal(text.slice(byType.bold.offset, byType.bold.offset + byType.bold.length), 'Sarlavha');
  assert.equal(byType.text_link.url, 'https://t.me/sofexpo');
  assert.equal(text.slice(byType.code.offset, byType.code.offset + byType.code.length), 'x=1');
  // identical pipeline → identical html
  assert.equal(
    entitiesToHtml(text, entities),
    '<p><strong>Sarlavha</strong> oddiy <a href="https://t.me/sofexpo" target="_blank" rel="noopener">havola</a><br>kiyin <code>x=1</code></p>',
  );
});

test('htmlToEntities: unsafe/relative links unwrap to text', () => {
  const { text, entities } = htmlToEntities('<a href="?q=%23blog">#blog</a> va <a href="javascript:x">bosma</a>');
  assert.equal(text, '#blog va bosma');
  assert.deepEqual(entities, []);
});
