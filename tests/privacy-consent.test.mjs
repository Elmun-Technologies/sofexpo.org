import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

test('public forms keep request consent separate from marketing and do not claim a mailing-list workflow', () => {
  const copyByLocale = {
    ru: 'не подписывает вас на email-рассылку',
    en: 'does not subscribe you to email updates',
    zh: '不会让您订阅电子邮件资讯',
    tr: 'abone yapmaz',
  };

  for (const [locale, copy] of Object.entries(copyByLocale)) {
    const page = read(`dist/${locale}/news/media-kit/index.html`);
    const pressForm = page.match(/<form\b(?=[^>]*\bdata-form-type="press")[^>]*>[\s\S]*?<\/form>/i);
    assert.ok(pressForm, `${locale}: press accreditation form is present`);
    assert.match(pressForm[0], /<input type="checkbox" name="consent" required/i, `${locale}: request processing consent remains required`);
    assert.doesNotMatch(pressForm[0], /name="marketingConsent"/i, `${locale}: no unimplemented marketing opt-in is offered`);
    assert.ok(page.includes(copy), `${locale}: accreditation copy explicitly says it does not subscribe applicants`);
  }

  const catalog = read('dist/en/exhibitors/catalogue/index.html');
  assert.match(catalog, /Free · one-time catalog request · no mailing-list subscription/);
  assert.doesNotMatch(catalog, /unsubscribe in 1 click/i);

  const uz = JSON.parse(read('src/i18n/catalogs/uz.json'));
  assert.equal(uz['Free · one-time catalog request · no mailing-list subscription'], 'Bepul · katalog uchun bir martalik so‘rov · email ro‘yxatiga obuna bo‘lmaydi');
});

test('privacy disclosures distinguish required request processing consent from marketing', () => {
  const disclosureByLocale = {
    ru: 'не подписывает вас на маркетинговую рассылку',
    en: 'does not subscribe you to marketing emails',
    zh: '不会让您订阅营销邮件',
    tr: 'sizi tanıtım e-postalarına abone yapmaz',
  };

  for (const [locale, copy] of Object.entries(disclosureByLocale)) {
    assert.ok(read(`dist/${locale}/legal/privacy/index.html`).includes(copy), `${locale}: privacy disclosure is localized`);
  }

  const uz = JSON.parse(read('src/i18n/catalogs/uz.json'));
  assert.match(uz['To create and maintain an account, handle a visitor or exhibitor request, follow up on participation terms and perform a contract. Tickets/admission are handled separately. Required consent on the press accreditation form covers processing that request only; it does not subscribe you to marketing emails.'], /majburiy rozilik faqat shu murojaatni ko‘rib chiqish uchun/);
});
