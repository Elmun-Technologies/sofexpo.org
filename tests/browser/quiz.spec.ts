import {test,expect} from '@playwright/test';
/**
 * The lead quiz: header CTA opens the dialog, three tap-only steps, contact last,
 * success state confirms the selection and the payload lands in the preview store.
 */
const answers = (locale:string) => ({
  ru: { q1any:'Ещё не выбрал', goal:'Новые клиенты и продажи', area:'18 м²', done:'Заявка принята', event:'Выставка', open:'Забронировать стенд' },
  en: { q1any:'Not sure yet — help me choose', goal:'New buyers and sales', area:'18 m²', done:'Request received', event:'Exhibition', open:'Book a stand' },
}[locale]!);

for(const locale of ['en','ru']) {
  const a = answers(locale);
  test(`${locale}: inline quiz funnels into the success summary`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`/${locale}/request-stand/`);
    const quiz=page.locator('[data-quiz]').first();
    await expect(quiz.locator('[data-step="1"] legend')).toBeVisible();
    // step mode: only step 1 is visible while JavaScript is on
    await expect(quiz.locator('[data-step="4"]')).toBeHidden();
    // progress reads "Step 1 of 4"
    await expect(quiz.locator('[data-step-label]:visible')).toHaveText(new RegExp('^'+(locale==='ru'?'Шаг 1 из 4':'Step 1 of 4')+'$'));
    // Q1 — one tap auto-advances
    await quiz.locator('[name=event]').last().check();
    await expect(quiz.locator('[data-step="2"]')).toBeVisible();
    await quiz.getByLabel(a.goal).check();
    await expect(quiz.locator('[data-step="3"]')).toBeVisible();
    await quiz.getByLabel(a.area, {exact:true}).check();
    await expect(quiz.locator('[data-step="4"]')).toBeVisible();
    // contact step: validation first, then the honest offline fallback
    await quiz.locator('button[type=submit]').click();
    await expect(quiz.locator('.form__msg')).toBeVisible();
    await quiz.locator('[name=name]').fill('Test Exhibitor');
    await quiz.locator('[name=company]').fill('QA Company');
    await quiz.locator('[name=phone]').fill('90 123 45 67');
    await quiz.locator('[name=consent]').check();
    await quiz.locator('button[type=submit]').click();
    await expect(quiz.locator('[data-quiz-done]')).toBeVisible();
    await expect(quiz.locator('[data-quiz-done]')).toContainText(a.done);
    const summary = await quiz.evaluate((el)=>{
      const get=(n:string)=>el.querySelector(`[data-quiz-summary=${n}]`)?.textContent?.trim();
      return {event:get('event'),goal:get('goal'),area:get('area')};
    });
    expect(summary.goal).toBe(a.goal);
    expect(summary.area).toBe(a.area);
    // payload kept in the preview store, same contract as LeadForm
    const leads = await page.evaluate(()=>JSON.parse(localStorage.getItem('sofexpo.leads')||'[]'));
    const last = leads.at(-1);
    expect(last.quiz).toBe('stand');
    expect(last.name).toBe('Test Exhibitor');
    expect(last.phone).toContain('+998');
    expect(last.channel).toBe('call');
    expect(String(last.page)).toContain(`/${locale}/request-stand`);
    expect(errors).toEqual([]);
  });

  test(`${locale}: header CTA opens the quiz dialog`,async({page})=>{
    await page.goto(`/${locale}/`);
    await page.locator('a[data-quiz-open]').first().click();
    const dialog=page.locator('[data-quiz-modal]');
    await expect(dialog).toHaveAttribute('open',/.*/);
    await expect(dialog.locator('[data-step="1"] legend')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open');
  });

  test(`${locale}: quiz degrades to one long form without JavaScript`,async({browser})=>{
    const context=await browser.newContext({javaScriptEnabled:false});
    const page=await context.newPage();
    await page.goto(`/${locale}/request-stand/`);
    const quiz=page.locator('[data-quiz]').first();
    for(const step of [1,2,3,4]) await expect(quiz.locator(`[data-step="${step}"]`)).toBeVisible();
    await expect(quiz.locator('button[type=submit]')).toBeVisible();
    await context.close();
  });
}
