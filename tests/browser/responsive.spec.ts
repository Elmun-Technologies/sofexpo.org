import {test,expect} from '@playwright/test';

/* The device matrix walks 17 widths × 7 pages through the on-demand dev server; give the
   file a generous ceiling (the other tests here finish in seconds). */
test.setTimeout(10*60_000);

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

test('any gadget or TV: core pages never overflow horizontally (320px–3840px)',async({page})=>{
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

test('large displays keep the 2026-10 design column: 1420px of panels, centred, 16px type (1920/2560/3840)',async({page})=>{
  /* docs/18 §2: the design is drawn on a fixed 1420px column inside a 10px canvas frame; a TV
     gets the same column centred on the canvas, not a stretched one */
  for(const width of [1920,2560,3840]){
    await page.setViewportSize({width,height:tvHeight(width)});
    await page.goto('/ru/');
    await page.evaluate(()=>document.fonts.ready);
    const main=await page.evaluate(()=>{const r=document.querySelector('main')!.getBoundingClientRect();const p=document.body.getBoundingClientRect();return {w:r.width,l:r.left-p.left,r:p.right-r.right};});
    expect(main.w,`main width at ${width}px`).toBeLessThanOrEqual(1440);
    expect(Math.abs(main.l-main.r),`main centred at ${width}px`).toBeLessThanOrEqual(2);
    const rootFs=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(rootFs,`root font at ${width}px`).toBe(16);
    const h1=await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('main h1')!).fontSize));
    expect(h1,`home h1 at ${width}px`).toBeGreaterThanOrEqual(80);
  }
});

/* docs/18 §4: `main` is a column of panels separated by the 10px canvas gutter, and a block
   that belongs to the heading above it (`.block--after-head` / `.block--cont`) sits
   border-to-border with it — that joined pair is why the negative margin exists.

   2026-10-15: a global `main { display: block }` in Base.astro (a pre-redesign leftover) beat
   the frame's `display: flex; gap: var(--gap)` and dropped every gutter. The panels fused into
   each other across the home, the audience row and the building row (the customer's screenshot),
   and on the section pages the joined blocks sat 10px *on top of* their neighbour. This test
   walks the frame that the fix restored: at rest the seam is either the gutter or zero (joined),
   never a negative overlap and never a gap wider than the design allows. */
test('the panel frame keeps its 10px canvas gutter on every page shape',async({page})=>{
  /* the scroll reveal translates a not-yet-revealed section by 8px, which would blur the
     geometry: with reduced motion the reveal never moves anything (docs/08 §5c) */
  await page.emulateMedia({reducedMotion:'reduce'});
  const measure=()=>page.evaluate(()=>{
    const main=document.querySelector('main')!;
    const kids=[...main.children].filter(el=>el.tagName!=='SCRIPT'&&getComputedStyle(el).display!=='none');
    const seams:{cls:string;seam:number}[]=[];
    for(let i=1;i<kids.length;i++){
      const a=kids[i-1].getBoundingClientRect(),b=kids[i].getBoundingClientRect();
      seams.push({cls:kids[i].className.toString(),seam:b.top-a.bottom});
    }
    return {display:getComputedStyle(main).display,gap:parseFloat(getComputedStyle(main).rowGap)||0,seams};
  });
  for(const path of ['','exhibitors/','venue/','organizers/','visitors/','events/','events/foodera-expo/','news/']){
    await page.goto(`/ru/${path}`);
    await page.evaluate(()=>document.fonts.ready);
    const frame=await measure();
    expect(frame.display,`/ru/${path}: main is the panel column`).toBe('flex');
    expect(frame.gap,`/ru/${path}: canvas gutter`).toBe(10);
    for(const {cls,seam} of frame.seams){
      expect(seam,`/ru/${path}: ${cls} overlaps the panel above it (fused seam)`).toBeGreaterThanOrEqual(-0.5);
      expect(seam,`/ru/${path}: ${cls} lost the canvas gutter`).toBeLessThanOrEqual(frame.gap+0.5);
      if(/block--after-head|block--cont/.test(cls)){
        expect(Math.abs(seam),`/ru/${path}: ${cls} must sit flush on its heading`).toBeLessThanOrEqual(0.5);
      }
    }
  }
  /* the gutter is the frame's, not a desktop extra: a phone keeps it too */
  await page.setViewportSize({width:390,height:844});
  await page.goto('/ru/');
  await page.evaluate(()=>document.fonts.ready);
  const phone=await measure();
  expect(phone.gap,'phone: canvas gutter').toBe(10);
  for(const {cls,seam} of phone.seams){
    expect(seam,`phone /: ${cls} seam`).toBeGreaterThanOrEqual(-0.5);
    expect(seam,`phone /: ${cls} seam`).toBeLessThanOrEqual(phone.gap+0.5);
  }
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
