import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../scripts/backend/portal/index.html', import.meta.url), 'utf8');
const headerSource = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
const translations = readFileSync(new URL('../scripts/backend/portal/i18n.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../scripts/backend/portal/app.js', import.meta.url), 'utf8');
const foodera = { slug: 'foodera-expo', name: 'FOODERA EXPO 2026', dates: '27–29 oktabr 2026' };
const shows = [
  { slug: 'foodera-expo', name: 'FOODERA EXPO', editions: [{ year: 2026, upcoming: true }] },
  { slug: 'buildpro-expo', name: 'BUILD PRO EXPO', editions: [{ year: 2026, upcoming: true }, { year: 2025 }] },
];

function chooseType(window, type) {
  const radio = window.document.querySelector(`#register-type-${type}`);
  radio.checked = true;
  radio.dispatchEvent(new window.Event('change', { bubbles: true }));
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null },
    json: async () => data,
  };
}

function createPortalPage(search = '', { failRequests = false } = {}) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: `https://api.sofexpo.test/cabinet${search}` });
  const { window } = dom;
  const calls = [];
  let account = null;
  let requests = [];
  let showcase = { status: 'draft', draft: null, live: false, hasChanges: false, reviewNote: '', files: [] };

  window.fetch = async (path, options = {}) => {
    const raw = options.body && typeof options.body !== 'string';
    const call = { path: String(path), method: options.method || 'GET', headers: options.headers || {}, body: options.body && !raw ? JSON.parse(options.body) : null, raw };
    calls.push(call);
    if (call.path === '/api/portal/options') return jsonResponse({ ok: true, events: [foodera], shows, socials: ['instagram', 'telegram'], fileKinds: ['catalog', 'brochure', 'flyer', 'image', 'other'] });
    if (call.path === '/api/portal/me') return jsonResponse({ ok: false, error: 'Login required' }, 401);
    if (call.path === '/api/portal/register') {
      const body = call.body;
      account = {
        id: 'account-1', email: body.email, accountType: body.accountType,
        profile: {
          name: body.name, phone: body.phone, company: body.company || '', country: body.country || '',
          industry: body.industry || '', website: body.website || '', interests: body.interests || '',
        },
      };
      return jsonResponse({ ok: true, user: account, csrfToken: 'csrf-test-token' }, 201);
    }
    if (call.path === '/api/portal/profile' && call.method === 'PATCH') {
      account.profile = { ...account.profile, ...call.body };
      return jsonResponse({ ok: true, user: account });
    }
    if (call.path === '/api/portal/requests' && call.method === 'POST') {
      const body = call.body;
      const request = {
        id: 'request-1', event: foodera.name, createdAt: '2026-10-11T10:00:00.000Z',
        requestType: account.accountType, status: 'new',
        details: account.accountType === 'exhibitor'
          ? { industry: account.profile.industry, area: `${body.area} m²`, package: body.package, message: body.message }
          : { interest: body.interest, message: body.message },
      };
      requests = [request];
      return jsonResponse({ ok: true, request }, 201);
    }
    if (call.path === '/api/portal/requests' && call.method === 'GET') {
      if (failRequests) return jsonResponse({ ok: false, error: 'Temporary error' }, 503);
      return jsonResponse({ ok: true, items: requests });
    }
    if (call.path === '/api/portal/showcase' && call.method === 'GET') return jsonResponse({ ok: true, showcase });
    if (call.path === '/api/portal/showcase' && call.method === 'PUT') {
      const errors = {};
      if (call.body.submit && !call.body.showcase.participation.length) errors.participation = 'required';
      if (call.body.showcase.website === 'not a url') errors.website = 'url';
      if (Object.keys(errors).length) return jsonResponse({ ok: false, error: 'Ba’zi maydonlar noto‘g‘ri to‘ldirilgan.', details: errors }, 422);
      showcase = { ...showcase, draft: { ...call.body.showcase, logoFileId: showcase.draft?.logoFileId || '' }, status: call.body.submit ? 'pending' : showcase.status };
      return jsonResponse({ ok: true, showcase });
    }
    if (call.path.startsWith('/api/portal/files?') && call.method === 'POST') {
      const params = new URL(call.path, 'https://x.test').searchParams;
      const file = { id: `00000000-0000-4000-8000-00000000000${showcase.files.length + 1}`, kind: params.get('kind'), title: params.get('name').replace(/\.pdf$/, ''), mime: 'application/pdf', size: 2048, published: false };
      file.url = `/api/portal/files/${file.id}`;
      showcase = { ...showcase, files: [...showcase.files, file] };
      return jsonResponse({ ok: true, file }, 201);
    }
    if (call.path === '/api/portal/logout') return jsonResponse({ ok: true });
    throw new Error(`Unexpected portal API request: ${call.method} ${call.path}`);
  };

  window.eval(translations);
  window.eval(app);
  return { dom, window, calls };
}

async function waitFor(window, predicate, message = 'portal UI did not settle') {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  assert.fail(message);
}


test('portal has complete copy and event labels for every supported language', () => {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  try {
    dom.window.eval(translations);
    const bundle = dom.window.SOFEXPO_PORTAL_I18N;
    const keys = new Set();
    for (const attribute of ['data-i18n', 'data-i18n-placeholder', 'data-i18n-aria-label']) {
      for (const element of dom.window.document.querySelectorAll(`[${attribute}]`)) keys.add(element.getAttribute(attribute));
    }
    for (const match of app.matchAll(/\bt\(['"]([^'"]+)['"]\)/g)) keys.add(match[1]);
    assert.deepEqual(Object.keys(bundle.locales).sort(), ['en', 'ru', 'tr', 'uz', 'zh']);
    for (const [locale, copy] of Object.entries(bundle.locales)) {
      for (const key of keys) assert.ok(key in copy, `${locale} is missing ${key}`);
      for (const slug of ['foodera-expo', 'buildpro-expo', 'agropro-expo', 'world-edu-expo', 'ecom-retail-expo']) {
        assert.ok(bundle.events[locale][slug], `${locale} is missing the ${slug} label`);
      }
    }
  } finally {
    dom.window.close();
  }
});

test('portal login/register tabs are accessible and switching roles keeps account-specific fields in sync', async () => {
  const { dom, window, calls } = createPortalPage();
  try {
    await waitFor(window, () => calls.some((call) => call.path === '/api/portal/me'));
    const document = window.document;
    const loginTab = document.querySelector('#login-tab');
    const registerTab = document.querySelector('#register-tab');
    const registerForm = document.querySelector('#register-form');

    assert.equal(loginTab.getAttribute('aria-controls'), 'login-form');
    assert.equal(registerTab.getAttribute('aria-controls'), 'register-form');
    assert.equal(loginTab.getAttribute('aria-selected'), 'true');
    assert.equal(registerTab.tabIndex, -1);

    loginTab.focus();
    loginTab.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    assert.equal(document.activeElement, registerTab);
    assert.equal(registerTab.getAttribute('aria-selected'), 'true');
    assert.equal(registerForm.hidden, false);

    assert.equal(document.querySelector('#register-company').required, false, 'guests may come without a company');
    assert.equal(document.querySelector('#register-industry').disabled, true);
    chooseType(window, 'exhibitor');
    assert.equal(document.querySelector('#register-company').disabled, false);
    assert.equal(document.querySelector('#register-company').required, true);
    assert.equal(document.querySelector('#register-industry').required, true);
    assert.equal(document.querySelector('[data-role-fields="exhibitor"]').hidden, false);
    assert.equal(document.querySelector('[data-visitor-only]').hidden, true);
    assert.equal(document.querySelector('.exhibitor-request-fields').hidden, false);
    assert.equal(document.querySelector('#request-area').required, true);
    assert.equal(document.querySelector('#request-interest').disabled, true);

    document.querySelector('#register-name').value = 'Demo Company Contact';
    document.querySelector('#register-phone').value = '+998 90 123 45 67';
    document.querySelector('#register-email').value = 'contact@example.test';
    document.querySelector('#register-password').value = 'long-demo-password-2026';
    document.querySelector('#register-company').value = 'Demo Foods';
    document.querySelector('#register-industry').value = 'Food';
    document.querySelector('input[name="consent"]').checked = true;
    registerForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));

    await waitFor(window, () => !document.querySelector('#portal-view').hidden && document.querySelector('#register-name').value === '');
    assert.equal(document.querySelector('#welcome-kicker').textContent, 'EKSPONENT KABINETI');
    assert.match(document.querySelector('#welcome-title').textContent, /Demo Foods/);
    assert.equal(document.querySelector('#request-title').textContent, 'Ko‘rgazmada qatnashish');
    assert.equal(document.querySelector('.exhibitor-profile-fields').hidden, false);
    assert.equal(document.querySelector('#request-area').required, true);
    assert.equal(document.querySelector('#request-interest').disabled, true);
    assert.ok(document.querySelector('.empty-state'));

    const requestForm = document.querySelector('#request-form');
    document.querySelector('#request-event').value = foodera.slug;
    document.querySelector('#request-area').value = '18';
    document.querySelector('#request-package').value = 'Stend / pavilyon';
    document.querySelector('#request-message').value = '<script>not executable</script>';
    requestForm.querySelector('input[name="consent"]').checked = true;
    requestForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => document.querySelector('#requests-list .request-item'));

    const post = calls.find((call) => call.path === '/api/portal/requests' && call.method === 'POST');
    assert.equal(post.body.event, foodera.slug);
    assert.equal(post.body.locale, 'uz');
    assert.equal(post.headers['X-CSRF-Token'], 'csrf-test-token');
    assert.equal(document.querySelector('#requests-list script'), null);
    assert.match(document.querySelector('#requests-list').textContent, /<script>not executable<\/script>/);
    assert.match(document.querySelector('#requests-list').textContent, /Ishtirok so‘rovi/);
  } finally {
    dom.window.close();
  }
});

test('visitor deep links open registration, show only visitor fields, and privacy/home links leave the API host', async () => {
  const { dom, window, calls } = createPortalPage('?type=visitor');
  try {
    await waitFor(window, () => calls.some((call) => call.path === '/api/portal/me'));
    const document = window.document;
    assert.equal(document.querySelector('#register-form').hidden, false);
    assert.equal(document.querySelector('#register-type-visitor').checked, true);
    assert.equal(document.querySelector('.exhibitor-profile-fields').hidden, true);
    assert.equal(document.querySelector('[data-role-fields="exhibitor"]').hidden, true);
    assert.equal(document.querySelector('#register-company').disabled, false);
    assert.equal(document.querySelector('#register-company').required, false);
    assert.equal(document.querySelector('#request-interest').required, false, 'a guest only has to pick the show');
    const visibleRequired = [...document.querySelectorAll('#register-form [required]')].filter((field) => !field.disabled).map((field) => field.name);
    assert.deepEqual(visibleRequired.sort(), ['consent', 'email', 'name', 'password', 'phone']);
    assert.equal(document.querySelector('#request-area').disabled, true);
    assert.match(document.querySelector('.register-consent a').href, /^https:\/\/sof-expo\.com\/uz\/legal\/privacy\//);
    assert.equal(document.querySelector('.auth-story .brand').href, 'https://sof-expo.com/uz/');
    assert.equal(document.querySelector('.back-link').href, 'https://sof-expo.com/uz/');
  } finally {
    dom.window.close();
  }
});



test('public header forwards the active locale when linking to the account cabinet', () => {
  const script = headerSource.match(/<script is:inline translate="no">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'header locale-forwarding script exists');
  const dom = new JSDOM(`<!doctype html><html lang="zh-CN"><body><header><button class="burger"></button><nav id="mnav"></nav><a data-portal-language href="https://api.sofexpo.test/cabinet?type=visitor&lang=en">Visitor account</a></header></body></html>`, {
    runScripts: 'outside-only', url: 'https://sofexpo.test/zh/',
  });
  try {
    dom.window.matchMedia = () => ({ addEventListener() {} });
    dom.window.eval(script);
    const link = dom.window.document.querySelector('[data-portal-language]');
    assert.equal(new URL(link.href).searchParams.get('lang'), 'zh');
    assert.equal(new URL(link.href).searchParams.get('type'), 'visitor');
  } finally {
    dom.window.close();
  }
});

test('portal can switch across all five site languages and keeps its public links in the selected language', async () => {
  const expectations = [
    ['uz', 'Kirish', 'Tashrif rejasini yuborish', 'FOODERA EXPO 2026 · 27–29 oktabr 2026'],
    ['en', 'Log in', 'Plan your visit', 'FOODERA EXPO 2026 · 27–29 October 2026'],
    ['ru', 'Войти', 'Запланировать посещение', 'FOODERA EXPO 2026 · 27–29 октября 2026'],
    ['tr', 'Giriş yap', 'Ziyaretinizi planlayın', 'FOODERA EXPO 2026 · 27–29 Ekim 2026'],
    ['zh', '登录', '提交参观计划', 'FOODERA EXPO 2026 · 2026年10月27–29日'],
  ];
  for (const [locale, login, visitTitle, eventOption] of expectations) {
    const { dom, window, calls } = createPortalPage(`?type=visitor&lang=${locale}`);
    try {
      await waitFor(window, () => calls.some((call) => call.path === '/api/portal/me'));
      const document = window.document;
      assert.equal(document.documentElement.lang, locale === 'zh' ? 'zh-CN' : locale);
      assert.equal(document.querySelector('#login-tab').textContent, login);
      assert.equal(document.querySelector('#request-title').textContent, visitTitle);
      assert.equal(document.querySelector('#request-event option[value="foodera-expo"]').textContent, eventOption);
      assert.equal(document.querySelector('.register-consent a').href, `https://sof-expo.com/${locale}/legal/privacy/`);
      assert.equal(document.querySelector('.back-link').href, `https://sof-expo.com/${locale}/`);
      assert.equal(document.querySelector('#auth-locale').value, locale);
    } finally {
      dom.window.close();
    }
  }

  const { dom, window, calls } = createPortalPage('?type=visitor&lang=ru');
  try {
    await waitFor(window, () => calls.some((call) => call.path === '/api/portal/me'));
    const select = window.document.querySelector('#auth-locale');
    select.value = 'en';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.equal(window.document.documentElement.lang, 'en');
    assert.equal(window.document.querySelector('#request-title').textContent, 'Plan your visit');
    assert.equal(window.document.querySelector('.register-consent a').href, 'https://sof-expo.com/en/legal/privacy/');
    assert.equal(new URL(window.location.href).searchParams.get('type'), 'visitor');
    assert.equal(new URL(window.location.href).searchParams.get('lang'), 'en');
    assert.equal(window.document.querySelector('#portal-locale').value, 'en');
  } finally {
    dom.window.close();
  }
});


test('authenticated exhibitor content and CRM request locale update when the language changes', async () => {
  const { dom, window, calls } = createPortalPage('?lang=ru');
  try {
    await waitFor(window, () => calls.some((call) => call.path === '/api/portal/me'));
    const document = window.document;
    document.querySelector('#register-tab').click();
    chooseType(window, 'exhibitor');
    document.querySelector('#register-name').value = 'Demo Company Contact';
    document.querySelector('#register-phone').value = '+998 90 123 45 67';
    document.querySelector('#register-email').value = 'company@example.test';
    document.querySelector('#register-password').value = 'long-demo-password-2026';
    document.querySelector('#register-company').value = 'Demo Foods';
    document.querySelector('#register-industry').value = 'Food';
    document.querySelector('input[name="consent"]').checked = true;
    document.querySelector('#register-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => !document.querySelector('#portal-view').hidden);
    assert.equal(document.querySelector('#account-role').textContent, 'Экспонент');
    assert.equal(document.querySelector('#profile-form label[for="profile-company"] [data-i18n="fieldCompany"]').textContent, 'Название компании');

    const language = document.querySelector('#portal-locale');
    language.value = 'en';
    language.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.equal(document.querySelector('#account-role').textContent, 'Exhibitor');
    assert.equal(document.querySelector('#welcome-title').textContent, 'Welcome, Demo Foods');
    assert.equal(document.querySelector('#request-title').textContent, 'Exhibit at a show');
    assert.equal(document.querySelector('#profile-form label[for="profile-company"] [data-i18n="fieldCompany"]').textContent, 'Company name');

    document.querySelector('#request-event').value = foodera.slug;
    document.querySelector('#request-area').value = '18';
    document.querySelector('#request-package').value = document.querySelector('#request-package option[data-i18n="packageStand"]').textContent;
    document.querySelector('#request-message').value = 'Please send the stand options.';
    document.querySelector('#request-form input[name="consent"]').checked = true;
    document.querySelector('#request-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => document.querySelector('#requests-list .request-item'));
    const post = calls.find((call) => call.path === '/api/portal/requests' && call.method === 'POST');
    assert.equal(post.body.locale, 'en');
    assert.match(document.querySelector('#requests-list').textContent, /Exhibitor enquiry/);
    assert.match(document.querySelector('#requests-list').textContent, /Received/);
  } finally {
    dom.window.close();
  }
});

test('request history shows a recoverable error instead of an endless loading state', async () => {
  const { dom, window, calls } = createPortalPage('', { failRequests: true });
  try {
    await waitFor(window, () => calls.some((call) => call.path === '/api/portal/me'));
    const document = window.document;
    document.querySelector('#register-tab').click();
    document.querySelector('#register-name').value = 'Visitor Test';
    document.querySelector('#register-phone').value = '+998 90 123 45 67';
    document.querySelector('#register-email').value = 'visitor@example.test';
    document.querySelector('#register-password').value = 'long-demo-password-2026';
    document.querySelector('input[name="consent"]').checked = true;
    document.querySelector('#register-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => !document.querySelector('#portal-view').hidden && document.querySelector('#requests-list .requests-error'));
    assert.match(document.querySelector('#requests-list').textContent, /Qayta urinib ko‘ring/);
    assert.equal(document.querySelector('#portal-view').hidden, false);
  } finally {
    dom.window.close();
  }
});

test('exhibitor company page: prefilled from the account, edition chips, upload, field errors, draft and submit', async () => {
  const { dom, window, calls } = createPortalPage();
  try {
    await waitFor(window, () => calls.some((call) => call.path === '/api/portal/me'));
    const document = window.document;
    document.querySelector('#register-tab').click();
    chooseType(window, 'exhibitor');
    document.querySelector('#register-name').value = 'Aziz Karimov';
    document.querySelector('#register-phone').value = '+998 90 123 45 67';
    document.querySelector('#register-email').value = 'aziz@beton.test';
    document.querySelector('#register-password').value = 'long-demo-password-2026';
    document.querySelector('#register-company').value = 'Beton Group';
    document.querySelector('#register-industry').value = 'Construction';
    document.querySelector('input[name="consent"]').checked = true;
    document.querySelector('#register-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => !document.querySelector('#portal-view').hidden && document.querySelector('.edition-chip'));

    assert.equal(document.querySelector('#tab-showcase').hidden, false);
    assert.equal(document.querySelector('#panel-showcase').hidden, false, 'exhibitors land on their company page');
    assert.equal(document.querySelector('#panel-requests').hidden, true);
    assert.equal(document.querySelector('#sc-name').value, 'Beton Group');
    assert.equal(document.querySelector('#sc-category').value, 'Construction');
    assert.equal(document.querySelectorAll('[data-social]').length, 2);
    assert.equal(document.querySelector('#showcase-status').textContent, 'Qoralama');

    /* sending without any show selected → the server's field error is shown next to the section */
    document.querySelector('#showcase-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => !document.querySelector('[data-field="participation"] .field-error').hidden);
    assert.match(document.querySelector('[data-field="participation"] .field-error').textContent, /moderatsiya/i);

    const chip = document.querySelector('.edition-chip[data-edition="buildpro-expo:2025"]');
    chip.click();
    const stand = document.querySelector('[data-stand="buildpro-expo:2025"]');
    assert.ok(stand, 'a selected edition offers an optional stand number');
    stand.value = 'A-12';
    document.querySelector('#sc-tagline').value = 'Ready-mix <b>concrete</b>';
    document.querySelector('[data-social="instagram"]').value = '@betongroup';

    /* upload goes as raw bytes with the CSRF token */
    const input = document.querySelector('#materials-input');
    const file = new window.File(['%PDF-1.4 demo'], 'Katalog 2026.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new window.Event('change', { bubbles: true }));
    await waitFor(window, () => document.querySelector('#materials-list .material[data-file]'));
    const upload = calls.find((call) => call.path.startsWith('/api/portal/files?'));
    assert.equal(upload.raw, true);
    assert.equal(upload.headers['X-CSRF-Token'], 'csrf-test-token');
    assert.match(upload.path, /kind=catalog/);
    assert.equal(document.querySelector('.material-title').value, 'Katalog 2026');

    document.querySelector('#showcase-save').click();
    await waitFor(window, () => calls.some((call) => call.path === '/api/portal/showcase' && call.method === 'PUT' && call.body.submit === false));
    const draft = calls.find((call) => call.path === '/api/portal/showcase' && call.method === 'PUT' && call.body.submit === false).body.showcase;
    assert.deepEqual(draft.participation, [{ event: 'buildpro-expo', year: 2025, stand: 'A-12' }]);
    assert.equal(draft.socials.instagram, '@betongroup');
    assert.equal(draft.tagline, 'Ready-mix <b>concrete</b>');

    document.querySelector('#showcase-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => document.querySelector('#showcase-status').textContent === 'Moderatsiyada');
    assert.equal(document.querySelector('#showcase-status').classList.contains('sc-pending'), true);
    assert.ok(Number.parseInt(document.querySelector('#completeness-value').textContent, 10) >= 50);
  } finally {
    dom.window.close();
  }
});
