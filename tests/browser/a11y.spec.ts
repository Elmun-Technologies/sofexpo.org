import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/* WCAG 2.1 A/AA through axe-core on one page of every family, in every language.
   A violation fails the build with the rule, the impact and the offending selectors. */
test.setTimeout(10*60_000);

const pages = [
  '', 'events/', 'events/foodera-expo/', 'events/foodera-expo/exhibitors/', 'events/foodera-expo/buyers/',
  'events/foodera-expo/sections/tea-and-coffee/', 'events/past/promotors-2026/', 'exhibitors/packages/',
  'visitors/tickets/', 'organizers/', 'venue/', 'about/team/', 'contacts/', 'request-stand/',
  'news/media-kit/', 'articles/', 'search/',
];

for (const locale of ['ru','en','zh','tr','uz']) {
  test(`${locale}: no WCAG 2.1 A/AA violations`, async ({page}) => {
    const report: string[] = [];
    // final, settled colours: no entrance fades mid-way through when axe measures
    await page.emulateMedia({reducedMotion:'reduce'});
    for (const path of pages) {
      await page.goto(`/${locale}/${path}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      // reveal-on-scroll content is part of the page; audit it in its final state
      await page.evaluate(() => document.querySelectorAll('.reveal-pending').forEach((e) => e.classList.remove('reveal-pending')));
      const {violations} = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      for (const v of violations) report.push(`${path || '/'} · ${v.id} (${v.impact}) · ${v.nodes.slice(0,3).map((n)=>n.target.join(' ')).join(' | ')}`);
    }
    expect(report, report.join('\n')).toEqual([]);
  });
}
