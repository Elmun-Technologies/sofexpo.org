import test from 'node:test';
import assert from 'node:assert/strict';
import { transliterate, slugify, uniqueSlug } from '../scripts/backend/tgblog/slug.mjs';
import { cleanInput, splitTitle, findHashtags, makeExcerpt, readingMinutes } from '../scripts/backend/tgblog/text.mjs';
import { removeRanges } from '../scripts/backend/tgblog/html.mjs';

test('transliterate: Russian + Uzbek Cyrillic', () => {
  assert.equal(transliterate('Привет мир'), 'Privet mir');
  assert.equal(transliterate('Ўзбекистон Республикаси'), 'Ozbekiston Respublikasi');
  assert.equal(transliterate('Қороқалпоғистон Ғарб Ҳудуди'), 'Qoroqalpogiston Garb Hududi');
  assert.equal(transliterate('выставка ЁДУ ёшлар'), 'vystavka YoDU yoshlar');
  assert.equal(transliterate('Mixed Text 2026!'), 'Mixed Text 2026!');
});

test('slugify: lowercase ascii, dashes, word-boundary cut, fallback', () => {
  assert.equal(slugify('Новости центра за неделю'), 'novosti-tsentra-za-nedelyu');
  assert.equal(slugify('  Много   пробелов && символов '), 'mnogo-probelov-simvolov');
  assert.equal(slugify('Ўзбек тилида сарлавҳа'), 'ozbek-tilida-sarlavha');
  assert.equal(slugify(''), 'post');
  assert.equal(slugify('!!!'), 'post');
  const long = slugify('слово '.repeat(40), { maxLen: 40 });
  assert.ok(long.length <= 40);
  assert.ok(!long.endsWith('-'));
});

test('uniqueSlug appends -2, -3 on collisions', () => {
  assert.equal(uniqueSlug('Новости', new Set()), 'novosti');
  assert.equal(uniqueSlug('Новости', new Set(['novosti'])), 'novosti-2');
  assert.equal(uniqueSlug('Новости', new Set(['novosti', 'novosti-2'])), 'novosti-3');
  assert.equal(uniqueSlug('Новости', ['NOVOSTI']), 'novosti-2'); // case-insensitive
});

test('splitTitle: first line ≤100 chars becomes the title and is cut from the body', () => {
  const { title, titleRange } = splitTitle('Qisqa sarlavha\n\nTananing birinchi qatori');
  assert.equal(title, 'Qisqa sarlavha');
  assert.deepEqual(titleRange, [0, 'Qisqa sarlavha\n\n'.length]);
});

test('splitTitle: empty first line / overlong line → truncated derivation, body intact', () => {
  assert.deepEqual(splitTitle('\n\nasosiy matn shu yerda').title.length > 0, true);
  assert.equal(splitTitle('\n\nasosiy matn shu yerda').titleRange, null);
  const longLine = `uzun ${'qator '.repeat(40).trim()}\nqolgan matn`;
  const result = splitTitle(longLine);
  assert.ok(result.title.length <= 101); // 100 chars + ellipsis
  assert.equal(result.titleRange, null);
  assert.ok(result.title.endsWith('…'));
  assert.equal(splitTitle('   ').title, '');
});

test('findHashtags: collects tags + strip ranges, dedupes case-insensitively', () => {
  const { tags, ranges } = findHashtags('Matn #Blog va #expo-2026 yana #blog #cyrillic_тег');
  assert.deepEqual(tags, ['Blog', 'expo-2026', 'cyrillic_тег']);
  assert.equal(ranges.length, 4);
  const stripped = removeRanges('Matn #blog qoladi', [], [[5, 10]]);
  assert.equal(stripped.text, 'Matn  qoladi');
});

test('removeRanges: entities are re-offset, contained ones dropped', () => {
  const text = 'Bosh #tag qolgan qism';
  // bold covers 'qolgan', hashtag entity covers '#tag'
  const { text: out, entities } = removeRanges(text, [
    { type: 'bold', offset: text.indexOf('qolgan'), length: 6 },
    { type: 'hashtag', offset: 5, length: 4 },
  ], [[5, 10]]); // remove ' #tag'
  assert.equal(out, 'Bosh qolgan qism');
  assert.equal(entities.length, 1);
  assert.equal(entities[0].type, 'bold');
  assert.equal(out.slice(entities[0].offset, entities[0].offset + entities[0].length), 'qolgan');
});

test('removeRanges: entity spanning a cut keeps its longest surviving part', () => {
  const text = 'aa #x bb';
  const { text: out, entities } = removeRanges(text, [{ type: 'italic', offset: 0, length: text.length }], [[3, 6]]);
  assert.equal(out, 'aa bb');
  assert.equal(entities.length, 1);
  assert.equal(out.slice(entities[0].offset, entities[0].offset + entities[0].length), 'aa ');
});

test('makeExcerpt: collapses whitespace, trims to ~155 on a word boundary', () => {
  assert.equal(makeExcerpt('  ko‘p\n\n bo‘shliqli   matn '), 'ko‘p bo‘shliqli matn');
  const long = 'so‘z '.repeat(80).trim();
  const excerpt = makeExcerpt(long);
  assert.ok(excerpt.length <= 155);
  assert.ok(excerpt.endsWith('…'));
  assert.ok(!excerpt.slice(0, -1).endsWith('so‘'));
});

test('cleanInput: strips control characters and caps length, keeps emoji', () => {
  assert.equal(cleanInput('ab\u0001\u001Fc\ndef'), 'abc\ndef');
  assert.equal(cleanInput('🔥 salom 🔥'), '🔥 salom 🔥');
  assert.equal(cleanInput('x'.repeat(10_000), 4096).length, 4096);
});

test('readingMinutes: at least one, ~180 wpm', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes(Array(360).fill('so‘z').join(' ')), 2);
});
