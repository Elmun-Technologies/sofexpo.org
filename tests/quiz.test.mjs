import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * The lead quiz (rush-agency.ru pattern adapted to the centre) must stay fully
 * localizable: every quiz.* UI key exists in RU and EN, and every EN source string
 * has a zh and a tr catalog entry — otherwise the strict editions build fails.
 */
const ui = readFileSync(new URL('../src/i18n/ui.ts', import.meta.url), 'utf8');

const block = (locale) => {
  const start = ui.indexOf(`  ${locale}: {`);
  const next = ui.indexOf('\n  },', start);
  return ui.slice(start, next);
};

const quizKeys = [
  'quiz.q1', 'quiz.q1any', 'quiz.q2', 'quiz.goal.sales', 'quiz.goal.export',
  'quiz.goal.brand', 'quiz.goal.dealers', 'quiz.goal.other', 'quiz.q3', 'quiz.q3any',
  'quiz.contact', 'quiz.channel', 'quiz.channel.call', 'quiz.trust', 'quiz.back',
  'quiz.step1', 'quiz.step2', 'quiz.step3', 'quiz.step4', 'quiz.goal.label', 'quiz.result',
];

test('quiz UI keys exist in both source locales', () => {
  const ru = block('ru');
  const en = block('en');
  for (const key of quizKeys) {
    assert.ok(ru.includes(`'${key}':`), `missing ru key ${key}`);
    assert.ok(en.includes(`'${key}':`), `missing en key ${key}`);
  }
});

test('every quiz EN string is present in the zh and tr catalogs (strict editions)', () => {
  const en = block('en');
  for (const key of quizKeys) {
    const line = en.split('\n').find((l) => l.includes(`'${key}':`));
    const value = line.match(/'((?:[^'\\]|\\.)*)'\s*,?\s*$/);
    assert.ok(value, `cannot read en value of ${key}`);
    const source = value[1].replace(/\\'/g, "'");
    for (const locale of ['zh', 'tr']) {
      const catalog = JSON.parse(readFileSync(new URL(`../src/i18n/catalogs/${locale}.json`, import.meta.url), 'utf8'));
      assert.ok(catalog[source] !== undefined, `missing ${locale} translation for ${key}: "${source}"`);
    }
  }
});

test('quiz and form blocks share one payload contract', () => {
  const quiz = readFileSync(new URL('../src/components/QuizForm.astro', import.meta.url), 'utf8');
  const lead = readFileSync(new URL('../src/components/LeadForm.astro', import.meta.url), 'utf8');
  for (const marker of ['data-lead-form', 'data-endpoint', "'sofexpo.leads'"]) {
    assert.ok(lead.includes(marker), `LeadForm lost ${marker}`);
  }
  assert.ok(quiz.includes('data-endpoint'), 'quiz must honour PUBLIC_LEAD_ENDPOINT');
  assert.ok(quiz.includes("'sofexpo.leads'"), 'quiz must reuse the preview lead store');
  assert.ok(quiz.includes("payload.quiz = 'stand'"), 'quiz payload must identify itself');
});

test('pages ship the quiz block and the global modal trigger', () => {
  const types = readFileSync(new URL('../src/data/pages/types.ts', import.meta.url), 'utf8');
  assert.ok(types.includes('| "quiz"'), 'BlockType must include quiz');
  const blocks = readFileSync(new URL('../src/components/Blocks.astro', import.meta.url), 'utf8');
  assert.ok(blocks.includes("b.type === 'quiz'"), 'Blocks must render the quiz block');
  const header = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
  assert.ok(header.includes('data-quiz-open'), 'header CTA must open the quiz dialog');
  const base = readFileSync(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8');
  assert.ok(base.includes('<StandQuizModal'), 'Base must mount the quiz dialog');
});
