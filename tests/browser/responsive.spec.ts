import {test,expect} from '@playwright/test';

/* The device matrix walks 17 widths × 7 pages through the on-demand dev server; give the
   file a generous ceiling (the other tests here finish in seconds). */
test.setTimeout(10*60_000);

test.beforeEach(({page})=>{
  /* Marketing popups (welcome at 15 s, pricing interest at 45 s, exit intent) are timer-
     triggered and would intercept pointer events mid-test. One recent "show" record trips
     the 5-minute minimum-interval rule in PopupSystem.canShow(), so the suite can assert
     page behavior without fighting the modal. */
  page.addInitScript(()=>{try{localStorage.setItem('sofexpo.popups',JSON.stringify([{id:'e2e',ts:Date.now(),type:'show'}]))}catch{}});
});

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

/* The device matrix: 320px phones → 3840px 4K TVs. The mobile-first contract
   (docs/04 §5) is that a core page renders without horizontal overflow at every
   width in between. The full matrix runs on RU (the editorial source); the other
   editions are spot-checked at the extreme widths. */
const deviceMatrix=[320,360,390,414,480,560,640,768,834,1024,1180,1280,1440,1600,1920,2560,3840] as const;
const corePaths=['/','events/','events/foodera-expo/','articles/kak-izmerit-effektivnost-vystavki/','exhibitors/','organizers/','visitors/'] as const;
const tvHeight=(w:number)=>w>=2560?1440:w>=1920?1080:w>=1180?800:w>=768?1024:w>=640?900:850;

test('any gadget or TV: core pages never overflow horizontally (320px–3840px)',{timeout:10*60_000},async({page})=>{
  const failures:string[]=[];
  for(const width of deviceMatrix){
    await page.setViewportSize({width,height:tvHeight(width)});
    for(const path of corePaths){
      const res=await page.goto(`/ru/${path}`);
      if(!res||!res.ok()){failures.push(`/ru/${path} at ${width}px: HTTP ${res?.status()}`);continue;}
      await page.evaluate(()=>document.fonts.ready);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
      if(overflow)failures.push(`/ru/${path} at ${width}px: horizontal overflow`);
    }
  }
  expect(failures,failures.join('\n')).toEqual([]);
});

test('the large-display tier scales type and the column on TVs (1920/2560/3840)',async({page})=>{
  /* root font = clamp(16px, 15.6px + 0.25vw, 21px): 20.4px at 1920, capped at 21px from ~2240px */
  for(const [width,expectMaxw,expectRoot] of [[1920,1450,20.3],[2560,1700,20.9],[3840,1800,20.9]] as const){
    await page.setViewportSize({width,height:tvHeight(width)});
    await page.goto('/ru/');
    await page.evaluate(()=>document.fonts.ready);
    /* the fluid column: wider than the 1320px desktop floor at room scale */
    const maxw=await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.wrap')!).maxWidth));
    expect(maxw,`wrap max-width at ${width}px`).toBeGreaterThanOrEqual(expectMaxw);
    const rootFs=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(rootFs,`root font at ${width}px (${rootFs}px)`).toBeGreaterThanOrEqual(expectRoot);
    /* the headline ceiling is raised: home h1 must be bigger at 3840 than at 1440 */
  }
  const at1440=await (async()=>{
    await page.setViewportSize({width:1440,height:900});
    await page.goto('/ru/');
    return page.evaluate(()=>document.querySelector('.home-hero h1')!.getBoundingClientRect().width>0?
      parseFloat(getComputedStyle(document.querySelector('.home-hero h1')!).fontSize):0);
  })();
  await page.setViewportSize({width:3840,height:2160});
  await page.goto('/ru/');
  await page.evaluate(()=>document.fonts.ready);
  const at3840=await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.home-hero h1')!).fontSize));
  expect(at3840,`h1 font 3840 (${at3840}) vs 1440 (${at1440})`).toBeGreaterThan(at1440*1.4);
});

test('other editions share the device matrix at the extreme widths',async({page})=>{
  const failures:string[]=[];
  for(const locale of ['en','zh','tr']){
    for(const width of [320,768,1920,3840] as const){
      await page.setViewportSize({width,height:tvHeight(width)});
      for(const path of ['/','events/']){
        const res=await page.goto(`/${locale}/${path}`);
        if(!res||!res.ok()){failures.push(`/${locale}/${path} at ${width}px: HTTP ${res?.status()}`);continue;}
        await page.evaluate(()=>document.fonts.ready);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
        if(overflow)failures.push(`/${locale}/${path} at ${width}px: horizontal overflow`);
      }
    }
  }
  expect(failures,failures.join('\n')).toEqual([]);
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
