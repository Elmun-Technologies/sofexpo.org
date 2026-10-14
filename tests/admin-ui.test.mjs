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

const pipelineLead = {
  id: 'lead-2', name: 'Very-long-company-contact-name-without-any-spaces-at-all', company: 'Beton Group', phone: '+998 90 555 44 33',
  formType: 'exhibitor', event: 'BUILD PRO EXPO 2026', status: 'proposal', priority: 'high', assignee: 'sales@example.test',
  dealAmount: 4800, currency: 'USD', standArea: 24, nextAction: 'Send contract', nextActionAt: '2026-10-20T09:00:00.000Z',
  lostReason: '', createdAt: '2026-10-10T10:00:00.000Z', updatedAt: '2026-10-11T10:00:00.000Z', stageChangedAt: '2026-10-11T10:00:00.000Z',
};
let showcaseDetail;

function createAdminPage({ signedIn = true } = {}) {
  showcaseDetail = {
    accountId: 'exhibitor-1', slug: '', status: 'pending', live: false, hasChanges: false, reviewNote: '', reviewedBy: '',
    submittedAt: '2026-10-11T10:00:00.000Z', publishedAt: null,
    account: { id: 'exhibitor-1', email: 'aziz@beton.test', name: 'Aziz', phone: '+998 90 111 22 33', company: 'Beton Group', accountType: 'exhibitor' },
    draft: { name: 'Beton Group', tagline: 'Ready-mix concrete', about: 'Concrete for 15 years.', website: 'https://beton.test/', socials: { instagram: 'https://instagram.com/beton' }, participation: [{ event: 'buildpro-expo', year: 2026, stand: 'A-12' }], logoFileId: '' },
    files: [{ id: 'file-1', kind: 'catalog', title: 'Katalog 2026', mime: 'application/pdf', size: 120000, published: false }],
  };
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://api.sofexpo.test/admin' });
  const { window } = dom;
  const calls = [];
  let active = 1;
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
    if (call.path === '/api/admin/team') return jsonResponse({
      ok: true, team: [{ email: 'admin@example.test', role: 'admin' }, { email: 'sales@example.test', role: 'manager' }],
      events: ['FOODERA EXPO 2026', 'BUILD PRO EXPO 2026'], currencies: ['USD', 'UZS'],
      shows: [{ slug: 'buildpro-expo', name: 'BUILD PRO EXPO', editions: [{ year: 2026, upcoming: true }] }],
    });
    if (call.path === '/api/admin/tasks') return jsonResponse({
      ok: true, overdue: [{ ...pipelineLead, nextActionAt: '2026-10-01T09:00:00.000Z' }], today: [], upcoming: [], unassigned: [], stale: [], uncontactedHour: 0,
    });
    if (call.path.startsWith('/api/admin/pipeline')) return jsonResponse({
      ok: true, closedDays: 30,
      columns: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((status) => ({
        status, count: status === 'proposal' ? 1 : 0, amount: status === 'proposal' ? { USD: 4800 } : {},
        items: status === 'proposal' ? [pipelineLead] : [],
      })),
    });
    if (call.path === '/api/admin/leads/lead-2' && call.method === 'GET') return jsonResponse({ ok: true, lead: {
      ...pipelineLead, email: '', locale: 'uz', source: '', page: '/uz/', landing: '/uz/buildpro-expo/', referrer: '',
      utm: { utm_source: 'instagram' }, payload: { area: '24' }, notes: [{ id: 'n1', kind: 'call', authorEmail: 'admin@example.test', body: 'Called', createdAt: '2026-10-11T10:00:00.000Z' }],
      deliveries: [], history: [], stageHistory: [{ fromStatus: '', toStatus: 'new', actorEmail: '', createdAt: '2026-10-10T10:00:00.000Z' }],
      journey: [{ event: 'page_view', at: '2026-10-10T09:58:00.000Z', path: '/uz/buildpro-expo/', utmSource: 'instagram' }],
      related: [],
    } });
    if (call.path === '/api/admin/leads/lead-2' && call.method === 'PATCH') return jsonResponse({ ok: true, lead: { ...pipelineLead, ...call.body, notes: [], history: [], stageHistory: [], journey: [], related: [] } });
    if (call.path === '/api/admin/leads/lead-2/notes') return jsonResponse({ ok: true, note: { id: 'n2' } }, 201);
    if (call.path === '/api/admin/sales-analytics?days=30') return jsonResponse({
      ok: true, days: 30,
      totals: { sessions: 40, leads: 4, spam: 1, open: 2, won: 1, lost: 1, winRate: 50, leadToWon: 25, visitToLead: 10, trackedJourneys: 3, revenue: { USD: 4800 }, pipeline: { USD: 9000 }, avgDaysToClose: 6.5, medianFirstResponseHours: 0.5, respondedWithinHour: 75, uncontacted: 1 },
      funnel: [{ stage: 'new', count: 4 }, { stage: 'contacted', count: 3 }, { stage: 'qualified', count: 2 }, { stage: 'proposal', count: 2 }, { stage: 'negotiation', count: 1 }, { stage: 'won', count: 1 }],
      stageDays: [{ stage: 'new', days: 0.1 }], channels: [{ key: 'instagram', leads: 3, qualified: 2, won: 1, lost: 0, open: 2, conversion: 33.3, revenue: { USD: 4800 } }],
      campaigns: [], forms: [], events: [], managers: [], lostReasons: [{ key: 'Narx qimmat', count: 1 }], aging: [{ key: '0–2 kun', count: 2 }],
      daily: [{ day: '2026-10-11', leads: 2, won: 1 }],
    });
    if (call.path.startsWith('/api/admin/showcases?')) return jsonResponse({
      ok: true, page: 1, limit: 50, total: 1, pages: 1, counts: { pending: 1 },
      items: [{ accountId: 'exhibitor-1', slug: '', status: 'pending', name: 'Beton Group', logoFileId: '', participation: [{ event: 'buildpro-expo', year: 2026, stand: 'A-12' }], live: false, email: 'aziz@beton.test', materials: 1, updatedAt: '2026-10-11T10:00:00.000Z', submittedAt: '2026-10-11T10:00:00.000Z' }],
    });
    if (call.path === '/api/admin/showcases/exhibitor-1') return jsonResponse({ ok: true, showcase: showcaseDetail });
    if (call.path === '/api/admin/showcases/exhibitor-1/review') {
      showcaseDetail = { ...showcaseDetail, status: 'published', live: true, slug: 'beton-group', publishedAt: '2026-10-12T10:00:00.000Z' };
      return jsonResponse({ ok: true, showcase: showcaseDetail });
    }
    throw new Error(`Unexpected admin API request: ${call.method} ${call.path}`);
  };
  window.eval(app);
  return { dom, window, calls };
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

test('sales workspace: kanban, lead card with deal fields and typed activity, sales analytics, showcase moderation', async () => {
  const { dom, window, calls } = createAdminPage();
  try {
    const document = window.document;
    await waitFor(window, () => document.querySelector('#new-count')?.textContent === '1');
    await waitFor(window, () => document.querySelector('.task-item[data-lead-id="lead-2"]'), 'dashboard tasks did not render');
    assert.match(document.querySelector('#content').textContent, /Muddati o‘tgan/);

    document.querySelector('[data-view="pipeline"]').click();
    await waitFor(window, () => document.querySelector('.deal-card[data-deal="lead-2"]'), 'kanban did not render');
    assert.equal(document.querySelectorAll('.kanban-col').length, 7);
    assert.match(document.querySelector('.kanban-col[data-stage="proposal"]').textContent, /4 800 USD/);

    document.querySelector('.deal-card[data-deal="lead-2"]').click();
    await waitFor(window, () => document.querySelector('#deal-form'), 'lead card did not open');
    const drawer = document.querySelector('#drawer-content');
    assert.match(drawer.textContent, /SAYTDAGI YO‘LI/);
    assert.match(drawer.textContent, /Sahifani ochdi/);
    assert.match(drawer.textContent, /Qo‘ng‘iroq/);
    assert.ok(drawer.querySelector('a[href="https://wa.me/998905554433"]'), 'WhatsApp quick link');
    assert.equal(drawer.querySelector('.step.is-current').dataset.stage, 'proposal');

    drawer.querySelector('#detail-next').value = 'Sign contract';
    drawer.querySelector('#detail-amount').value = '5200';
    drawer.querySelector('#deal-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => calls.some((call) => call.path === '/api/admin/leads/lead-2' && call.method === 'PATCH'));
    const patch = calls.find((call) => call.path === '/api/admin/leads/lead-2' && call.method === 'PATCH');
    assert.equal(patch.body.dealAmount, 5200);
    assert.equal(patch.body.nextAction, 'Sign contract');
    assert.equal(patch.headers['X-CSRF-Token'], 'csrf-admin');

    await waitFor(window, () => document.querySelector('#note-form'));
    document.querySelector('.kind-tab[data-kind="meeting"]').click();
    document.querySelector('#note-form textarea').value = 'Met at the office';
    document.querySelector('#note-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(window, () => calls.some((call) => call.path === '/api/admin/leads/lead-2/notes'));
    assert.equal(calls.find((call) => call.path === '/api/admin/leads/lead-2/notes').body.kind, 'meeting');

    document.querySelector('[data-view="sales"]').click();
    await waitFor(window, () => document.querySelector('.funnel-step'), 'sales analytics did not render');
    const sales = document.querySelector('#content').textContent;
    assert.match(sales, /To‘liq voronka/);
    assert.match(sales, /Narx qimmat/);
    assert.match(sales, /instagram/);
    assert.match(sales, /4 800 USD/);

    document.querySelector('[data-view="showcases"]').click();
    await waitFor(window, () => document.querySelector('[data-showcase="exhibitor-1"]'), 'showcases did not render');
    assert.match(document.querySelector('#content').textContent, /BUILD PRO EXPO 2026/);
    document.querySelector('[data-showcase="exhibitor-1"]').click();
    await waitFor(window, () => document.querySelector('[data-review="publish"]'));
    assert.match(document.querySelector('#content').textContent, /Katalog 2026/);
    document.querySelector('[data-review="publish"]').click();
    await waitFor(window, () => calls.some((call) => call.path === '/api/admin/showcases/exhibitor-1/review'));
    assert.equal(calls.find((call) => call.path === '/api/admin/showcases/exhibitor-1/review').body.action, 'publish');
    await waitFor(window, () => document.querySelector('[data-review="hide"]'), 'published page offers hiding');
  } finally {
    dom.window.close();
  }
});
