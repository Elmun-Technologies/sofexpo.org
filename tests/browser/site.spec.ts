import {test,expect} from '@playwright/test';
const cases = [
  {locale:'en',lang:'en',query:'stand',error:'Please complete the required fields.',fallback:'browser only',sample:'Sample document'},
  {locale:'ru',lang:'ru',query:'стенд',error:'Заполните обязательные поля.',fallback:'только в этом браузере',sample:'Образец документа'},
  {locale:'zh',lang:'zh-CN',query:'展位',error:'请填写所有必填项。',fallback:'申请尚未发送',sample:'文件样本'},
  {locale:'tr',lang:'tr',query:'fuar',error:'Lütfen zorunlu alanları doldurun.',fallback:'henüz gönderilmedi',sample:'Örnek belge'},
];
for(const c of cases) {
  test(`${c.locale}: responsive home, native language picker and mobile keyboard navigation`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    for(const width of [1440,390,320]) {
      await page.setViewportSize({width,height:900});await page.goto(`/${c.locale}/`);
      await expect(page.locator('html')).toHaveAttribute('lang',c.lang);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    }
    await page.locator('.burger').click();await expect(page.locator('.burger')).toHaveAttribute('aria-expanded','true');
    await expect(page.locator('main')).toHaveAttribute('inert','');
    await page.keyboard.press('Escape');await expect(page.locator('.burger')).toBeFocused();
    await expect(page.locator('.burger')).toHaveAttribute('aria-expanded','false');
    await page.goto(`/${c.locale}/events/foodera-expo/visitors/?source=test#tickets`);
    await expect(page.locator('.ehero__bg')).toHaveCSS('position','absolute');
    await page.locator('.language-picker summary').click();
    for(const target of cases) await expect(page.locator(`.language-picker__menu a[hreflang="${target.lang}"]`)).toHaveAttribute('href',new RegExp(`/${target.locale}/events/foodera-expo/visitors/\\?source=test#tickets$`));
    expect(errors).toEqual([]);
  });
  test(`${c.locale}: localized search, JSON index and honest offline form`,async({page,request})=>{
    await page.goto(`/${c.locale}/search/?q=${encodeURIComponent(c.query)}`);
    await expect(page.locator('.sresults a').first()).toBeVisible();
    await expect(page.locator('.sresults a').first()).toHaveAttribute('href',new RegExp(`^/${c.locale}/`));
    const index=await request.get(`/${c.locale}/search/index.json`);expect(index.ok()).toBeTruthy();
    const data=await index.json();expect(data.locale).toBe(c.locale);expect(data.items.length).toBeGreaterThan(50);
    await page.goto(`/${c.locale}/request-stand/`);
    const form=page.locator('[data-lead-form]').first();await form.locator('button[type=submit]').click();
    await expect(form.locator('.form__msg')).toHaveText(c.error);
    await form.locator('[name=name]').fill('Test Visitor');await form.locator('[name=company]').fill('QA Company');await form.locator('[name=phone]').fill('+998901234567');
    await form.locator('[name=consent]').check();
    for(const select of await form.locator('select[required]').all()) await select.selectOption({index:1});
    if(!await form.getAttribute('data-endpoint')) {
      await form.locator('button[type=submit]').click();await expect(form.locator('.form__msg')).toContainText(c.fallback);
    }
    await page.setViewportSize({width:390,height:900});
    await page.goto(`/${c.locale}/venue/tech-specs/`);
    const notice=page.locator('.download-notice').first();
    await expect(notice).toBeVisible();
    await expect(notice.locator('strong')).toHaveText(c.sample);
    await expect(notice.locator('a')).toHaveAttribute('href','mailto:info@sofexpo.uz');
    await expect(page.locator('.files a[href="/files/sof-expo-regulations.pdf"] small').first()).toHaveText(c.sample);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  });
}
test('localized content remains usable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  for(const c of cases.slice(2)) {
    await page.goto(`${process.env.BASE_URL||'http://127.0.0.1:4321'}/${c.locale}/venue/`);
    await expect(page.locator('h1')).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang',c.lang);
    await page.locator('.language-picker summary').click();await expect(page.locator('.language-picker__menu a')).toHaveCount(4);
  }
  await context.close();
});
