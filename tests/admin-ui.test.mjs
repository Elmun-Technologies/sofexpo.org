import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../scripts/backend/admin/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../scripts/backend/admin/app.js', import.meta.url), 'utf8');

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null },
    json: async () => data,
  };
}

const account = (active = 1) => ({
  id: 'account-1', email: 'visitor@example.test', accountType: 'visitor', active,
  name: 'Dilnoza Mehmon', phone: '+998 90 123 45 67', company: '', country: 'Uzbekistan',
  industry: 'Retail', website: '', interests: 'Food sourcing',
  createdAt: '2026-10-10T10:00:00.000Z', lastLoginAt: '2026-10-11T10:00:00.000Z',
  profileUpdatedAt: '2026-10-11T10:00:00.000Z',
  requests: [{
    id: 'request-1', leadId: 'lead-1', requestType: 'visitor', event: 'FOODERA EXPO 2026',
    details: { interest: 'buyer-program' }, createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z', status: 'new', priority: 'normal', assignee: '', noteCount: 0,
  }],
});

function createAdminPage({ signedIn = true } = {}) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://api.sofexpo.test/admin' });
  const { window } = dom;
  const calls = [];
  const intervals = [];
  let latestLeads = [];
  let audioSignals = 0;
  let active = 1;
  window.setInterval = (callback, delay) => { intervals.push({ callback, delay }); return intervals.length; };
  window.clearInterval = () => {};
  window.AudioContext = class {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createOscillator() { return { frequency: { setValueAtTime() {} }, connect() {}, start() { audioSignals += 1; }, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    resume() { this.state = 'running'; return Promise.resolve(); }
  };
  window.confirm = () => true;
  window.fetch = async (path, options = {}) => {
    const call = {
      path: String(path), method: options.method || 'GET',
      headers: options.headers || {}, body: options.body ? JSON.parse(options.body) : null,
    };
    calls.push(call);
    if (call.path === '/api/admin/status') return jsonResponse({ ok: true, setupRequired: false });
    if (call.path === '/api/admin/me' && !signedIn) return jsonResponse({ ok: false, error: 'Sessiya tugagan. Qayta kiring.' }, 401);
    if (call.path === '/api/admin/login' && call.method === 'POST') {
      signedIn = true;
      return jsonResponse({ ok: true, user: { id: 'admin-1', email: 'admin@example.test', role: 'admin' }, csrfToken: 'csrf-admin' });
    }
    if (call.path === '/api/admin/me') return jsonResponse({ ok: true, user: { id: 'admin-1', email: 'admin@example.test', role: 'admin' }, csrfToken: 'csrf-admin' });
    if (call.path === '/api/admin/dashboard?days=30') return jsonResponse({
      ok: true, days: 30, totalLeads: 1, newLeads: 1, sessions: 5, conversionRate: 20,
      portalAccounts: 1, portalRequests: 1, portalNewRequests: 1,
      daily: [{ day: '2026-10-11', leads: 1, sessions: 5 }],
      statuses: [{ key: 'new', count: 1 }], forms: [{ key: 'visitor', count: 1 }], sources: [], outbox: { pending: 0, failed: 0 },
    });
    if (call.path === '/api/admin/leads?limit=100') return jsonResponse({ ok: true, items: latestLeads, total: latestLeads.length, page: 1, limit: 100, pages: 1 });
    if (call.path === '/api/admin/leads?limit=6') return jsonResponse({ ok: true, items: [], total: 0, page: 1, limit: 6, pages: 1 });
    if (call.path.startsWith('/api/admin/portal-accounts?')) return jsonResponse({
      ok: true, items: [{ ...account(active), requestCount: 1, newRequests: 1, latestRequestAt: '2026-10-11T10:00:00.000Z' }],
      total: 1, page: 1, limit: 20, pages: 1,
    });
    if (call.path === '/api/admin/portal-accounts/account-1' && call.method === 'GET') return jsonResponse({ ok: true, account: account(active) });
    if (call.path === '/api/admin/portal-accounts/account-1' && call.method === 'PATCH') {
      active = Number(call.body.active);
      return jsonResponse({ ok: true, account: account(active), revokedSessions: active ? 0 : 1 });
    }
    if (call.path.startsWith('/api/admin/audit?')) return jsonResponse({
      ok: true, total: 1, page: 1, limit: 25, pages: 1,
      items: [{ id: 1, actorEmail: 'admin@example.test', action: 'portal_account.deactivate', entityType: 'portal_account', entityId: 'account-1', details: { active: false, revokedSessions: 1 }, createdAt: '2026-10-11T10:00:00.000Z' }],
    });
    if (call.path === '/api/admin/analytics?days=30') return jsonResponse({
      ok: true, days: 30, eventTotal: 2, events: [{ key: 'page_view', count: 2 }],
      pages: [{ key: '/uz/', count: 2 }], campaigns: [], ctas: [{ key: 'book-stand', count: 1 }], channels: [], locales: [{ key: 'uz', count: 1 }],
      funnel: { visits: 1, ctaSessions: 1, formStartSessions: 1, successSessions: 1, successfulSubmissions: 1, fallbackSubmissions: 0 },
      daily: [{ day: '2026-10-11', views: 2, sessions: 1, formSubmits: 1 }],
      portal: {
        accounts: 1, requests: 1,
        accountsByType: [{ key: 'visitor', count: 1 }], requestsByType: [{ key: 'visitor', count: 1 }],
        requestStatuses: [{ key: 'new', count: 1 }], events: [{ key: 'FOODERA EXPO 2026', count: 1 }],
        daily: [{ day: '2026-10-11', accounts: 1, requests: 1 }],
      },
    });
    if (call.path === '/api/admin/leads/lead-1') return jsonResponse({ ok: true, lead: {
      id: 'lead-1', name: 'Dilnoza Mehmon', phone: '+998 90 123 45 67', email: 'visitor@example.test',
      company: '', event: 'FOODERA EXPO 2026', formType: 'visitor', locale: 'uz', source: 'Portal: mehmon',
      page: '/cabinet', landing: '', referrer: '', utm: {}, payload: { interest: 'buyer-program' },
      status: 'new', priority: 'normal', assignee: '', createdAt: '2026-10-11T10:00:00.000Z',
      notes: [], deliveries: [], history: [{ action: 'lead.update', actorEmail: 'admin@example.test', details: { status: { from: 'new', to: 'contacted' } }, createdAt: '2026-10-11T10:05:00.000Z' }],
    } });
    throw new Error(`Unexpected admin API request: ${call.method} ${call.path}`);
  };
  window.eval(app);
  return {
    dom,
    window,
    calls,
    intervals,
    setLatestLeads(value) { latestLeads = value; },
    get audioSignals() { return audioSignals; },
  };
}

async function waitFor(window, predicate, message = 'admin UI did not settle') {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  assert.fail(message);
}

test('admin workspace follows a portal account through profile, CRM request, moderation and analytics', async () => {
  const { dom, window, calls } = createAdminPage();
  try {
    await waitFor(window, () => window.document.querySelector('#new-count')?.textContent === '1');
    const document = window.document;
    document.querySelector('[data-view="portalAccounts"]').click();
    await waitFor(window, () => document.querySelector('[data-portal-account-id="account-1"]'));
    assert.match(document.querySelector('#content').textContent, /Mehmon va eksponent kabinetlari/);
    assert.match(document.querySelector('#content').textContent, /Dilnoza Mehmon/);

    document.querySelector('[data-portal-account-id="account-1"]').click();
    await waitFor(window, () => document.querySelector('.account-detail-grid'));
    assert.match(document.querySelector('#content').textContent, /So‘rovlar oqimi/);
    assert.match(document.querySelector('#content').textContent, /FOODERA EXPO 2026/);
    document.querySelector('#toggle-portal-account').click();
    await waitFor(window, () => document.querySelector('.notice-box'));
    assert.match(document.querySelector('.notice-box').textContent, /sessiyalari bekor qilingan/);
    assert.ok(calls.some((call) => call.path === '/api/admin/portal-accounts/account-1' && call.method === 'PATCH' && call.body.active === false));

    document.querySelector('[data-lead-id="lead-1"]').click();
    await waitFor(window, () => document.querySelector('#detail-status'));
    assert.match(document.querySelector('#drawer-content').textContent, /JAMOA IZOHLARI/);
    assert.match(document.querySelector('#drawer-content').textContent, /JARAYON TARIXI/);
    assert.match(document.querySelector('#drawer-content').textContent, /CRM kartasi yangilandi/);
    assert.ok(calls.some((call) => call.path === '/api/admin/leads/lead-1'));

    document.querySelector('[data-view="analytics"]').click();
    await waitFor(window, () => document.querySelector('#content').textContent.includes('Ko‘rgazmalar bo‘yicha kabinet so‘rovlari'));
    assert.match(document.querySelector('#content').textContent, /Yangi kabinetlar/);
    assert.match(document.querySelector('#content').textContent, /Konversiya yo‘li/);
    assert.match(document.querySelector('#content').textContent, /book-stand/);
    assert.match(document.querySelector('#content').textContent, /Mehmon/);
    assert.match(document.querySelector('#content').textContent, /FOODERA EXPO 2026/);

    document.querySelector('[data-view="activity"]').click();
    await waitFor(window, () => document.querySelector('#content').textContent.includes('Faoliyat tarixi'));
    assert.match(document.querySelector('#content').textContent, /Kabinet bloklandi/);
    assert.match(document.querySelector('#content').textContent, /admin@example.test/);
    assert.ok(calls.some((call) => call.path.startsWith('/api/admin/audit?page=1&limit=25')));
  } finally {
    dom.window.close();
  }
});

test('signing in renders the dashboard (the form is kept across the await)', async () => {
  const { dom, window, calls } = createAdminPage({ signedIn: false });
  try {
    const document = window.document;
    await waitFor(window, () => !document.querySelector('#auth').hidden, 'login screen did not show');
    assert.ok(document.querySelector('#login-error').hidden, 'a first visit is not told its session expired');
    document.querySelector('#login-email').value = 'admin@example.test';
    document.querySelector('#login-password').value = 'correct horse battery';
    document.querySelector('#login-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => document.querySelector('#content .metrics-grid'), 'dashboard did not render after login');
    assert.ok(calls.some((call) => call.path === '/api/admin/login' && call.method === 'POST'));
    assert.equal(document.querySelector('#login-email').value, '', 'the login form is reset');
    assert.ok(document.querySelector('#login-error').hidden, 'no error after a successful login');
  } finally {
    dom.window.close();
  }
});

test('admin polls for new leads and plays an opt-in sound alert', async () => {
  const page = createAdminPage();
  const { dom, window, calls, intervals, setLatestLeads } = page;
  try {
    const document = window.document;
    await waitFor(window, () => document.querySelector('#content .metrics-grid'));
    await waitFor(window, () => intervals.length === 1 && calls.some((call) => call.path === '/api/admin/leads?limit=100'));
    assert.equal(intervals[0].delay, 12_000, 'new leads are checked every 12 seconds');

    const soundToggle = document.querySelector('#sound-toggle');
    soundToggle.click();
    await waitFor(window, () => soundToggle.getAttribute('aria-pressed') === 'true');
    await waitFor(window, () => page.audioSignals >= 3, 'enabling sound should play a confirmation chime');

    setLatestLeads([{ id: 'lead-new-1', name: 'New Lead', status: 'new', createdAt: '2026-10-14T12:00:00.000Z' }]);
    await intervals[0].callback();
    await waitFor(window, () => document.querySelector('#toast').classList.contains('show'));
    assert.equal(document.querySelector('#toast').textContent, 'Yangi ariza: New Lead');
    assert.ok(page.audioSignals >= 6, 'a new lead plays the chime after sound is enabled');
  } finally {
    dom.window.close();
  }
});
