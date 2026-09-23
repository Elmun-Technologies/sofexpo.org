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
  'quiz.step1', 'quiz.step2', 'quiz.step3', 'quiz.step4', 'quiz.step1of3', 'quiz.step2of3',
  'quiz.step3of3', 'quiz.goal.label', 'quiz.result', 'quiz.done.calendar', 'quiz.done.manager',
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
  assert.ok(quiz.includes('quiz:focus'), 'quiz must support runtime re-focusing');
  assert.ok(quiz.includes('dataLayer'), 'quiz must push funnel events to window.dataLayer');
  const modal = readFileSync(new URL('../src/components/StandQuizModal.astro', import.meta.url), 'utf8');
  assert.ok(modal.includes('data-quiz-event'), 'modal must forward the trigger context');
  const header = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
  assert.ok(header.includes('data-quiz-event'), 'header must pass the event page context');
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

test('event pages ship a focused quiz before their form', () => {
  const pages = readFileSync(new URL('../src/data/pages/event-pages.ts', import.meta.url), 'utf8');
  const quizzes = (pages.match(/type: "quiz",/g) || []).length;
  const forms = (pages.match(/type: "form",/g) || []).length;
  assert.ok(quizzes >= 10, `every event form is preceded by a quiz (found ${quizzes})`);
  assert.equal(quizzes, forms, 'quiz/form pairs stay index-aligned per locale');
  assert.ok(/type: "quiz",[\s\S]{0,200}?event: "FOODERA EXPO 2026"/.test(pages), 'focused quiz carries the show');
});

test('webhook formats a quiz lead into a readable Telegram message', async () => {
  const { formatLead } = await import('../scripts/lead-webhook.mjs');
  const msg = formatLead({
    quiz: 'stand', name: 'Азиз Каримов', company: 'Oziq-Ovqat LLC', phone: '+998 90 123 45 67',
    event: 'FOODERA EXPO 2026', goal: 'Новые клиенты и продажи', area: '18 м²', channel: 'call',
    comment: 'Нужна дегустация', page: '/ru/request-stand/', ts: '2026-09-24T12:00:00Z',
  });
  assert.match(msg, /Новая заявка-квиз/);
  assert.match(msg, /Азиз Каримов/);
  assert.match(msg, /\+998 90 123 45 67/);
  assert.match(msg, /FOODERA EXPO 2026/);
  assert.match(msg, /Площадь: 18 м²/);
  assert.match(msg, /Канал: Позвонить/);
  assert.match(msg, /Нужна дегустация/);
  // legacy LeadForm payload renders without quiz-specific lines
  const plain = formatLead({ name: 'X', phone: '+998 1', position: 'Руководитель' });
  assert.match(plain, /Новая заявка\n/);
  assert.doesNotMatch(plain, /Задача|Площадь|Канал/);
});
