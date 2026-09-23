import {test,expect} from '@playwright/test';

for(const locale of ['en','ru','zh','tr']) {
  test(`${locale}: interior pages fit phones and tablets; tables scroll with a keyboard`,async({page})=>{
    const paths=['articles/gruppovoy-vizit-na-vystavku/','articles/kak-izmerit-effektivnost-vystavki/','articles/rynok-produktov-centralnoy-azii/','exhibitors/','organizers/'];
    for(const width of [320,768]) {
      await page.setViewportSize({width,height:850});
      for(const path of paths) {
        await page.goto(`/${locale}/${path}`);
        await page.evaluate(()=>document.fonts.ready);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),`${locale}/${path} at ${width}px`).toBeTruthy();
      }
    }
    await page.setViewportSize({width:320,height:850});
    await page.goto(`/${locale}/articles/kak-izmerit-effektivnost-vystavki/`);
    const table=page.locator('.post-body .table-scroll').first();
    await expect(table).toHaveAttribute('tabindex','0');
    await expect(table).toHaveAccessibleName(/.+/);
    await expect(table.locator('table')).toBeVisible();
    await table.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(()=>table.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
    await page.setViewportSize({width:1440,height:900});
    await expect(table).not.toHaveAttribute('tabindex','0');
    await expect(page.locator('.post-body .table-hint').first()).toBeHidden();
    expect(await page.locator('.post-body').evaluate(el=>el.clientWidth)).toBeGreaterThanOrEqual(620);
    const tocLink=page.locator('.pdetail__toc a[href^="#"]').first();
    await expect(tocLink).toBeVisible();
    const href=await tocLink.getAttribute('href');
    await tocLink.click();
    await expect.poll(()=>page.evaluate(id=>{
      const heading=document.getElementById(id!)!.getBoundingClientRect();
      const header=document.querySelector('.hdr')!.getBoundingClientRect();
      return heading.top>=header.bottom&&heading.top<header.bottom+100;
    },href!.slice(1))).toBeTruthy();
  });
}

test('desktop navigation is dismissible; compact header releases the mobile focus lock on resize',async({page})=>{
  await page.setViewportSize({width:1241,height:900});
  await page.goto('/ru/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.locator('.burger').click();
  await expect(page.locator('main')).toHaveAttribute('inert','');
  await page.setViewportSize({width:1281,height:900});
  await expect(page.locator('.mnav')).toBeHidden();
  await expect(page.locator('main')).not.toHaveAttribute('inert','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.setViewportSize({width:1440,height:900});
  const group=page.locator('.nav__item').first(), link=group.locator('.nav__link'), menu=group.locator('.mega');
  await link.focus();
  await page.keyboard.press('ArrowDown');
  await expect(menu.locator('a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(link).toBeFocused();
  await expect(menu).toBeHidden();
  await page.keyboard.press('ArrowDown');
  await expect(menu.locator('a').first()).toBeFocused();
  await page.locator('.language-picker summary').focus();
  await link.hover();
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.locator('.language-picker summary')).toBeFocused();
});

test('the active event section stays in view without jumping past the hero',async({page})=>{
  for(const locale of ['zh','tr']) {
    await page.setViewportSize({width:320,height:850});
    await page.goto(`/${locale}/events/foodera-expo/program/`);
    await page.evaluate(()=>document.fonts.ready);
    const selected=page.locator('.evnav__tabs [aria-current="page"]');
    await expect.poll(()=>selected.evaluate(el=>{
      const a=el.getBoundingClientRect(),b=el.closest('.evnav__tabs')!.getBoundingClientRect();
      return a.left>=b.left-1&&a.right<=b.right+1;
    })).toBeTruthy();
    expect(await page.evaluate(()=>scrollY)).toBe(0);
    expect(await selected.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
});

test('article tables remain contained and keyboard-scrollable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:850}});
  const page=await context.newPage();
  for(const locale of ['zh','tr']) {
    await page.goto(`${process.env.BASE_URL||'http://127.0.0.1:4321'}/${locale}/articles/gruppovoy-vizit-na-vystavku/`);
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    const table=page.locator('.table-scroll').first();
    await expect(table).toHaveAttribute('tabindex','0');
    await table.focus();await page.keyboard.press('ArrowRight');
    await expect.poll(()=>table.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  }
  await context.close();
});
