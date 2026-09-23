import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

/**
 * Functional test of the lead quiz against the *built* HTML (dist), so the real
 * output — markup, inline script and the strict zh/tr localization — is exercised
 * end to end without a browser. Skips when dist/ has not been built yet
 * (`npm run check` always builds first).
 */
const dist = (path) => fileURLToPath(new URL(`../dist/${path}`, import.meta.url));
const load = (path, { scripts = true, query = '' } = {}) => {
  const html = readFileSync(dist(path), 'utf8');
  const dom = new JSDOM(html, {
    url: `https://sofexpo.org/${path.replace(/index\.html$/, '')}${query}`,
    runScripts: scripts ? 'dangerously' : undefined,
  });
  // jsdom does not implement scrolling
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  return dom;
};
const change = (el) => { el.checked = true; el.dispatchEvent(new el.ownerDocument.defaultView.Event('change', { bubbles: true })); };
const submit = (form) => form.dispatchEvent(new form.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }));

test('quiz: three tap-only steps auto-advance into the contact step (en build)', { skip: !existsSync(dist('en/request-stand/index.html')) && 'dist missing — run npm run build' }, async () => {
  const dom = load('en/request-stand/index.html');
  await new Promise((r) => setTimeout(r, 50));
  const { document } = dom.window;
  const quiz = document.querySelector('[data-quiz]');
  assert.ok(quiz, 'quiz present on /request-stand/');
  assert.equal(quiz.dataset.quizReady, '1', 'inline script initialised the quiz');
  const step = (n) => quiz.querySelector(`[data-step="${n}"]`);

  change(quiz.querySelector('input[name=event]'));
  assert.equal(step(1).hidden, true, 'step 1 hides after an answer');
  assert.equal(step(2).hidden, false, 'step 2 auto-advances');
  assert.match(quiz.querySelector('[data-step-label]:not([hidden])').textContent, /Step 2 of 4/);

  change(quiz.querySelector('input[name=goal]'));
  assert.equal(step(3).hidden, false);
  change(quiz.querySelector('input[name=area][value="18 m²"]'));
  assert.equal(step(4).hidden, false);
  assert.match(quiz.querySelector('[data-step-label]:not([hidden])').textContent, /Step 4 of 4/);
  const back = step(4).querySelector('[data-quiz-back]');
  assert.equal(back.hidden, false, 'back control appears from step 2 onward');
  back.click();
  assert.equal(step(3).hidden, false);
  assert.equal(step(4).hidden, true);
  change(quiz.querySelector('input[name=area][value="18 m²"]'));
  assert.equal(step(4).hidden, false);

  // honest validation first, then the offline preview store
  submit(quiz.querySelector('[data-quiz-form]'));
  assert.ok(!quiz.querySelector('.form__msg').hidden, 'empty contact shows the error message');
  const form = quiz.querySelector('[data-quiz-form]');
  form.querySelector('[name=name]').value = 'Test Exhibitor';
  form.querySelector('[name=company]').value = 'QA Company';
  form.querySelector('[name=phone]').value = '90 123 45 67';
  form.querySelector('[name=consent]').checked = true;
  submit(form);
  const done = quiz.querySelector('[data-quiz-done]');
  assert.equal(done.hidden, false, 'success panel replaces the form');
  assert.match(done.querySelector('[data-quiz-summary=goal]').textContent, /New buyers and sales/);
  assert.match(done.querySelector('[data-quiz-summary=area]').textContent, /18/);
  // funnel telemetry reached the dataLayer
  const tracked = dom.window.dataLayer.map((e) => e.event);
  assert.ok(tracked.includes('quiz_start'), 'quiz_start tracked');
  assert.ok(tracked.includes('quiz_step'), 'quiz_step tracked');
  const submitEvent = dom.window.dataLayer.find((e) => e.event === 'quiz_submit');
  assert.equal(submitEvent && submitEvent.goal, 'New buyers and sales');
  const lead = JSON.parse(dom.window.localStorage.getItem('sofexpo.leads')).at(-1);
  assert.equal(lead.quiz, 'stand');
  assert.equal(lead.name, 'Test Exhibitor');
  assert.match(lead.phone, /^\+998 90 123 45 67$/);
  assert.equal(lead.channel, 'call');
  assert.equal(lead.goal, 'New buyers and sales');
  assert.equal(lead.area, '18 m²');
  assert.ok(lead.page.includes('/en/request-stand'));
  dom.window.close();
});

test('quiz: without JavaScript all four steps render as one long form', { skip: !existsSync(dist('en/request-stand/index.html')) && 'dist missing — run npm run build' }, () => {
  const dom = load('en/request-stand/index.html', { scripts: false });
  const { document } = dom.window;
  const quiz = document.querySelector('[data-quiz]');
  for (const n of [1, 2, 3, 4]) {
    assert.equal(quiz.querySelector(`[data-step="${n}"]`).hasAttribute('hidden'), false, `step ${n} visible without JS`);
  }
  assert.equal(quiz.querySelector('button[type=submit]').hasAttribute('disabled'), false, 'submit reachable without JS');
  dom.window.close();
});

test('quiz: focused event-page mode runs three steps with a hidden show field', { skip: !existsSync(dist('en/events/foodera-expo/exhibitors/index.html')) && 'dist missing — run npm run build' }, async () => {
  const dom = load('en/events/foodera-expo/exhibitors/index.html');
  await new Promise((r) => setTimeout(r, 50));
  const { document } = dom.window;
  const quizzes = document.querySelectorAll('[data-quiz]');
  const quiz = quizzes[0]; /* the focused inline quiz, modal copy comes second */
  assert.ok(!quiz.closest('[data-quiz-modal]'), 'first quiz is the inline one');
  const hidden = quiz.querySelector('input[type=hidden][name=event]');
  assert.equal(hidden && hidden.value, 'FOODERA EXPO 2026', 'the show is carried as a hidden field');
  assert.equal(quiz.querySelectorAll('fieldset[data-step]').length, 3, 'focused quiz has three steps');
  assert.match(quiz.querySelector('[data-step-label]:not([hidden])').textContent, /Step 1 of 3/);
  change(quiz.querySelector('input[name=goal]'));
  assert.match(quiz.querySelector('[data-step-label]:not([hidden])').textContent, /Step 2 of 3/);
  change(quiz.querySelector('input[name=area][value="18 m²"]'));
  assert.ok(quiz.querySelector('[data-step="3"]').hidden === false, 'contact step is step 3');
  dom.window.close();
});

test('quiz: re-clicking a chosen option still advances after going Back', { skip: !existsSync(dist('en/request-stand/index.html')) && 'dist missing — run npm run build' }, async () => {
  const dom = load('en/request-stand/index.html');
  await new Promise((r) => setTimeout(r, 50));
  const { document } = dom.window;
  const quiz = document.querySelector('[data-quiz]');
  const goal = quiz.querySelector('input[name=goal]');
  change(goal);
  assert.ok(quiz.querySelector('[data-step="2"]').hidden === false);
  const back = quiz.querySelector('[data-step="2"] [data-quiz-back]');
  back.click();
  assert.ok(quiz.querySelector('[data-step="1"]').hidden === false, 'back returns to step 1');
  // re-click the already-checked option: `change` never fires, the click must advance
  const click = new dom.window.MouseEvent('click', { bubbles: true });
  Object.defineProperty(click, 'target', { value: goal });
  quiz.querySelector('[data-quiz-form]').dispatchEvent(click);
  assert.ok(quiz.querySelector('[data-step="2"]').hidden === false, 're-click advances from the revisited step');
  dom.window.close();
});

test('quiz: modal quiz re-focuses to the event page context', { skip: !existsSync(dist('en/events/foodera-expo/visitors/index.html')) && 'dist missing — run npm run build' }, async () => {
  const dom = load('en/events/foodera-expo/visitors/index.html');
  await new Promise((r) => setTimeout(r, 50));
  const { document } = dom.window;
  const trigger = document.querySelector('a[data-quiz-open]');
  assert.equal(trigger && trigger.getAttribute('data-quiz-event'), 'FOODERA EXPO 2026', 'header CTA carries the show context');
  const dialog = document.querySelector('[data-quiz-modal]');
  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(dialog.open, true);
  const modalQuiz = dialog.querySelector('[data-quiz]');
  const hidden = modalQuiz.querySelector('input[type=hidden][name=event]');
  assert.equal(hidden && hidden.value, 'FOODERA EXPO 2026', 'show question collapsed into a hidden field');
  assert.equal(modalQuiz.querySelectorAll('fieldset[data-step]').length, 3, 'dialog quiz now has three steps');
  assert.equal(modalQuiz.querySelector('[data-step="1"]').hidden, false, 'goal question is now step 1');
  assert.match(modalQuiz.querySelector('[data-step-label]:not([hidden])').textContent, /Step 1 of 3/);
  // telemetry: the open event is tracked
  const events = dom.window.dataLayer.map((e) => e.event);
  assert.ok(events.includes('quiz_open'), 'quiz_open pushed to dataLayer');
  dialog.querySelector('[data-quiz-close]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dialog.open, false);
  dom.window.close();
});

test('quiz: leads carry attribution — trigger source, landing page and UTM', { skip: !existsSync(dist('en/events/foodera-expo/visitors/index.html')) && 'dist missing — run npm run build' }, async () => {
  const dom = load('en/events/foodera-expo/visitors/index.html', { query: '?utm_source=newsletter&utm_campaign=foodera' });
  await new Promise((r) => setTimeout(r, 50));
  const { document } = dom.window;
  // landing captured once per session at first view
  const ctx = JSON.parse(dom.window.sessionStorage.getItem('sofexpo.leadctx'));
  assert.match(ctx.landing, /\/en\/events\/foodera-expo\/visitors\/\?utm_source=newsletter&utm_campaign=foodera/);
  assert.equal(ctx.utm.utm_source, 'newsletter');
  const trigger = document.querySelector('a[data-quiz-open]');
  assert.equal(trigger.getAttribute('data-quiz-source'), 'header');
  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const quiz = document.querySelector('[data-quiz-modal] [data-quiz]');
  assert.equal(quiz.dataset.source, 'header');
  assert.equal(JSON.parse(dom.window.sessionStorage.getItem('sofexpo.leadctx')).src, 'header');
  // finish the focused funnel and submit
  change(quiz.querySelector('input[name=goal]'));
  change(quiz.querySelector('input[name=area][value="18 m²"]'));
  const form = quiz.querySelector('[data-quiz-form]');
  form.querySelector('[name=name]').value = 'Attribution Test';
  form.querySelector('[name=company]').value = 'QA Company';
  form.querySelector('[name=phone]').value = '90 000 00 01';
  form.querySelector('[name=consent]').checked = true;
  submit(form);
  const lead = JSON.parse(dom.window.localStorage.getItem('sofexpo.leads')).at(-1);
  assert.equal(lead.src, 'header');
  assert.equal(lead.utm_source, 'newsletter');
  assert.equal(lead.utm_campaign, 'foodera');
  assert.match(lead.landing, /utm_source=newsletter/);
  assert.equal(lead.event, 'FOODERA EXPO 2026', 'focus context survived the funnel');
  dom.window.close();
});

test('quiz: zh edition translates questions, buttons and messages (strict build output)', { skip: !existsSync(dist('zh/request-stand/index.html')) && 'dist missing — run npm run build' }, async () => {
  const dom = load('zh/request-stand/index.html');
  await new Promise((r) => setTimeout(r, 50));
  const { document } = dom.window;
  const quiz = document.querySelector('[data-quiz]');
  assert.match(quiz.querySelector('[data-step="1"] legend').textContent, /哪家展会/);
  assert.match(quiz.querySelector('[data-step="4"] legend').textContent, /展位图和报价/);
  assert.match(quiz.dataset.err, /星号/);
  assert.match(quiz.querySelector('.quiz__trust').textContent, /30分钟/);
  const back = quiz.querySelector('[data-quiz-back]');
  assert.match(back.textContent, /返回/);
  assert.match(quiz.querySelector('[data-quiz-done] .quiz__done-title').textContent, /24小时/);
  dom.window.close();
});

test('quiz: ru build keeps source copy and the header opens the dialog', { skip: !existsSync(dist('ru/index.html')) && 'dist missing — run npm run build' }, async () => {
  const dom = load('ru/index.html');
  await new Promise((r) => setTimeout(r, 50));
  const { document } = dom.window;
  const trigger = document.querySelector('a[data-quiz-open]');
  assert.ok(trigger, 'header CTA triggers the quiz dialog');
  assert.equal(trigger.getAttribute('href'), '/ru/request-stand/', 'fallback href preserved for no-JS');
  const dialog = document.querySelector('[data-quiz-modal]');
  assert.ok(dialog, 'dialog is mounted globally');
  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(dialog.open, true, 'showModal opens the dialog');
  assert.match(dialog.querySelector('[data-step="1"] legend').textContent, /Какая выставка/);
  dialog.querySelector('[data-quiz-close]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dialog.open, false, 'close button closes the dialog');
  dom.window.close();
});
