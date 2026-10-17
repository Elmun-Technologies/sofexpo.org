import { test, expect } from '@playwright/test';

/* Cookie consent (ConsentInit.astro + CookieBanner.astro): EEA/UK/CH time zones are asked,
   everyone else starts granted with no banner. */
test.describe('EEA visitor', () => {
  test.use({ timezoneId: 'Europe/Berlin' });

  test('is asked once, starts denied, and the choice sticks', async ({ page }) => {
    await page.goto('/en/events/foodera-expo/');
    const banner = page.locator('[data-cookie-banner]');
    await expect(banner).toBeVisible();
    expect(await page.evaluate(() => window.sofConsent?.state)).toBe('pending');
    /* Consent Mode v2 default is in the dataLayer before any tag */
    const defaults = await page.evaluate(() =>
      (window.dataLayer as unknown[][]).find((e) => e[0] === 'consent' && e[1] === 'default')?.[2],
    );
    expect(defaults).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    /* nothing of the centre's own analytics is stored before consent */
    expect(await page.evaluate(() => localStorage.getItem('sofexpo.analytics'))).toBeNull();

    await banner.getByRole('button', { name: 'Accept' }).click();
    await expect(banner).toBeHidden();
    expect(await page.evaluate(() => window.sofConsent?.state)).toBe('granted');
    const update = await page.evaluate(() =>
      (window.dataLayer as unknown[][]).find((e) => e[0] === 'consent' && e[1] === 'update')?.[2],
    );
    expect(update).toMatchObject({ analytics_storage: 'granted', ad_storage: 'granted' });

    await page.goto('/ru/');
    await expect(page.locator('[data-cookie-banner]')).toBeHidden();
    expect(await page.evaluate(() => window.sofConsent?.state)).toBe('granted');
  });

  test('can reject, and reopen the choice from the footer', async ({ page }) => {
    await page.goto('/ru/');
    const banner = page.locator('[data-cookie-banner]');
    await banner.getByRole('button', { name: 'Отклонить' }).click();
    await expect(banner).toBeHidden();
    expect(await page.evaluate(() => window.sofConsent?.state)).toBe('denied');
    await page.locator('footer [data-consent-open]').click();
    await expect(banner).toBeVisible();
  });
});

test.describe('visitor outside the EEA', () => {
  test.use({ timezoneId: 'Asia/Tashkent' });

  test('sees no banner and starts granted', async ({ page }) => {
    await page.goto('/uz/events/foodera-expo/');
    await expect(page.locator('[data-cookie-banner]')).toBeHidden();
    expect(await page.evaluate(() => window.sofConsent?.state)).toBe('granted');
    /* the localized banner is still there for the footer link */
    await page.locator('footer [data-consent-open]').click();
    await expect(page.locator('[data-cookie-banner]')).toBeVisible();
  });
});

declare global {
  interface Window {
    sofConsent?: { state: string; strict: boolean };
    dataLayer: unknown[];
  }
}
