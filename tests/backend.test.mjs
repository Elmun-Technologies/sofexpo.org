import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLeadServer, formatLead, normalizeLead, summarize } from '../scripts/lead-webhook.mjs';

const ADMIN_EMAIL = 'admin@sofexpo.test';
const ADMIN_PASSWORD = 'test-admin-password-2026';

async function startBackend(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'sofexpo-backend-test-'));
  const server = createLeadServer({
    host: '127.0.0.1',
    port: 0,
    dbPath: join(directory, 'sofexpo.sqlite'),
    legacyLeadsPath: '',
    legacyEventsPath: '',
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    origins: ['*'],
    ...options,
  });
  const address = await server.listenBackend();
  const base = `http://127.0.0.1:${address.port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    server.backendStore.close();
    rmSync(directory, { recursive: true, force: true });
  });
  return { server, base };
}

async function jsonRequest(base, path, { method = 'GET', body, cookie, csrf, origin } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  if (origin) headers.Origin = origin;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  return { response, data: contentType.includes('application/json') ? await response.json() : await response.text() };
}

async function login(base) {
  const { response, data } = await jsonRequest(base, '/api/admin/login', {
    method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.match(response.headers.get('set-cookie'), /SameSite=Strict/);
  return { cookie, csrf: data.csrfToken, user: data.user };
}

async function waitFor(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for backend state');
}

test('lead normalization validates required contacts and strips tracking queries from URLs', () => {
  const lead = normalizeLead({
    name: '   Test Exhibitor ', company: 'ACME', phone: '+998 90 123 45 67', email: 'team@example.com',
    formType: 'exhibitor', industry: 'Food', area: '18 м²', locale: 'uz', page: 'https://sofexpo.org/uz/request-stand/?utm_source=secret',
    landing: 'https://sofexpo.org/uz/?utm_campaign=launch', referrer: 'https://search.example/result?q=private',
    utm_source: 'newsletter', utm_campaign: 'october', comment: 'Interested in a 18 m² stand', consent: 'yes',
  });
  assert.equal(lead.name, 'Test Exhibitor');
  assert.equal(lead.page, '/uz/request-stand/');
  assert.equal(lead.landing, '/uz/');
  assert.equal(lead.referrer, 'https://search.example/result');
  assert.deepEqual(lead.utm, { utm_source: 'newsletter', utm_campaign: 'october' });
  assert.equal(lead.payload.comment, 'Interested in a 18 m² stand');
  assert.equal(lead.payload.consent, 'yes');
  assert.throws(() => normalizeLead({ name: 'A', phone: '123' }), /Ism va to‘g‘ri telefon/);
  assert.throws(() => normalizeLead({ name: 'Valid Name', phone: '123456', email: 'not-an-email' }), /Email manzili/);
  assert.throws(() => normalizeLead({ name: 'Valid Name', phone: '123456', formType: 'exhibitor', company: 'ACME' }), /Majburiy maydon/);
});

test('legacy lead formatter and summary stay backward-compatible', () => {
  const message = formatLead({
    quiz: 'stand', name: 'Aziz Karimov', company: 'ACME', phone: '+998 90 123 45 67',
    event: 'FOODERA EXPO 2026', goal: 'New buyers', area: '18 м²', page: '/en/request-stand/',
    ts: '2026-10-09T10:00:00Z',
  });
  assert.match(message, /Новая заявка-квиз/);
  assert.match(message, /FOODERA EXPO 2026/);
  assert.match(message, /Площадь: 18 м²/);
  const days = summarize([
    { event: 'page_view', ts: '2026-10-09T10:00:00Z', sessionId: 'a' },
    { event: 'form_submit', form: 'exhibitor', ts: '2026-10-09T10:02:00Z', sessionId: 'a' },
    { event: 'form_submit', form: 'visitor', fallback: true, ts: '2026-10-09T10:03:00Z', sessionId: 'b' },
  ]);
  assert.equal(days['2026-10-09'].sessions, 2);
  assert.deepEqual(days['2026-10-09'].forms, { exhibitor: 1, 'visitor (not delivered)': 1 });
});

test('CORS preflight admits every production host for lead and analytics endpoints', async (t) => {
  const origins = [
    'https://sofexpo.org', 'https://foodera.sofexpo.org', 'https://buildpro.sofexpo.org',
    'https://agropro.sofexpo.org', 'https://worldedu.sofexpo.org', 'https://ecomretail.sofexpo.org',
  ];
  const { base } = await startBackend(t, { origins });
  for (const endpoint of ['/lead', '/event']) {
    for (const origin of origins) {
      const response = await fetch(`${base}${endpoint}`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      assert.equal(response.status, 204, `${endpoint} should accept ${origin}`);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
      assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
      assert.match(response.headers.get('access-control-allow-methods'), /POST/);
    }
  }
});

test('public lead API persists valid requests and rejects invalid/cross-origin submissions', async (t) => {
  const { server, base } = await startBackend(t, { origins: ['https://sofexpo.org'] });
  let result = await jsonRequest(base, '/lead', {
    method: 'POST',
    origin: 'https://sofexpo.org',
    body: {
      name: 'QA Lead', company: 'Samarkand Foods', phone: '+998 90 555 55 55', email: 'qa@example.com',
      formType: 'exhibitor', event: 'FOODERA EXPO 2026', industry: 'Food', area: '18 м²', consent: 'on', locale: 'uz', page: '/uz/request-stand/',
      utm_source: 'newsletter', comment: 'Test comment',
    },
  });
  assert.equal(result.response.status, 202);
  assert.equal(result.data.status, 'stored');
  const saved = server.backendStore.getLead(result.data.id);
  assert.equal(saved.name, 'QA Lead');
  assert.equal(saved.status, 'new');
  assert.equal(saved.formType, 'exhibitor');
  assert.equal(saved.utm.utm_source, 'newsletter');
  assert.equal(saved.payload.comment, 'Test comment');

  result = await jsonRequest(base, '/lead', {
    method: 'POST', origin: 'https://evil.example', body: { name: 'Bad', phone: '123456' },
  });
  assert.equal(result.response.status, 403);

  result = await jsonRequest(base, '/lead', {
    method: 'POST', origin: 'https://sofexpo.org', body: { name: 'Missing phone' },
  });
  assert.equal(result.response.status, 422);
  assert.equal(server.backendStore.listLeads().total, 1);
});

test('admin login, CSRF, lead updates, internal notes, search and CSV export work end-to-end', async (t) => {
  const { server, base } = await startBackend(t);
  const leadResponse = await jsonRequest(base, '/lead', {
    method: 'POST', body: { name: 'Searchable Lead', company: 'QA Company', phone: '+998901234567', formType: 'exhibitor', industry: 'Food', area: '18 м²', consent: 'on', comment: 'Need a plan' },
  });
  const id = leadResponse.data.id;

  let result = await jsonRequest(base, '/api/admin/login', {
    method: 'POST', body: { email: ADMIN_EMAIL, password: 'incorrect-password' },
  });
  assert.equal(result.response.status, 401);

  const session = await login(base);
  assert.equal(session.user.role, 'admin');
  result = await jsonRequest(base, '/api/admin/leads?q=Searchable');
  assert.equal(result.response.status, 401);

  result = await jsonRequest(base, `/api/admin/leads/${id}`, {
    method: 'PATCH', cookie: session.cookie, body: { status: 'contacted' }, csrf: 'wrong-token',
  });
  assert.equal(result.response.status, 403);

  result = await jsonRequest(base, '/api/admin/leads?q=Searchable', { cookie: session.cookie });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.total, 1);
  assert.equal(result.data.items[0].name, 'Searchable Lead');

  result = await jsonRequest(base, `/api/admin/leads/${id}`, {
    method: 'PATCH', cookie: session.cookie, csrf: session.csrf,
    body: { status: 'contacted', priority: 'high', assignee: 'Dilshod' },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.lead.status, 'contacted');
  assert.equal(result.data.lead.priority, 'high');
  assert.equal(result.data.lead.assignee, 'Dilshod');

  result = await jsonRequest(base, `/api/admin/leads/${id}/notes`, {
    method: 'POST', cookie: session.cookie, csrf: session.csrf, body: { body: 'Call again on Monday.' },
  });
  assert.equal(result.response.status, 201);
  assert.equal(server.backendStore.getLead(id).notes[0].body, 'Call again on Monday.');
  assert.equal(server.backendStore.recentAudit().length, 2);
  const history = server.backendStore.getLead(id).history;
  assert.equal(history.length, 2);
  assert.deepEqual(history[0].details.status, { from: 'new', to: 'contacted' });
  const auditPage = await jsonRequest(base, '/api/admin/audit?page=1&limit=1&entity=lead', { cookie: session.cookie });
  assert.equal(auditPage.response.status, 200);
  assert.equal(auditPage.data.total, 2);
  assert.equal(auditPage.data.items.length, 1);
  assert.equal(auditPage.data.items[0].action, 'lead.note.add');

  result = await jsonRequest(base, '/api/admin/leads/export.csv?q=Searchable', { cookie: session.cookie });
  assert.equal(result.response.status, 200);
  assert.match(result.data, /Searchable Lead/);
  assert.match(result.response.headers.get('content-type'), /text\/csv/);

  result = await jsonRequest(base, '/api/admin/logout', { method: 'POST', cookie: session.cookie, csrf: session.csrf, body: {} });
  assert.equal(result.response.status, 200);
  result = await jsonRequest(base, '/api/admin/dashboard', { cookie: session.cookie });
  assert.equal(result.response.status, 401);
});

test('first-party analytics omits IP, full URL, and referrer query; dashboard aggregates sessions', async (t) => {
  const { server, base } = await startBackend(t);
  const result = await jsonRequest(base, '/event', {
    method: 'POST',
    body: {
      events: [
        { event: 'page_view', sessionId: 'anon-session-1', locale: 'uz', path: '/uz/request-stand/?email=private', url: 'https://sofexpo.org/?private=1', referrer: 'https://search.example/?user=secret', utm: { source: 'newsletter', campaign: 'october' } },
        { event: 'cta_click', sessionId: 'anon-session-1', locale: 'uz', path: '/uz/request-stand/', cta: 'book-stand', source: 'hero' },
        { event: 'form_start', sessionId: 'anon-session-1', locale: 'uz', path: '/uz/request-stand/', form: 'exhibitor', channel: 'website' },
        { event: 'form_submit', sessionId: 'anon-session-1', locale: 'uz', path: '/uz/request-stand/', form: 'exhibitor', success: true, fallback: false },
        { event: 'not valid event !' },
      ],
    },
  });
  assert.equal(result.response.status, 202);
  assert.equal(result.data.stored, 4);
  const event = server.backendStore.db.prepare('SELECT * FROM analytics_events ORDER BY id ASC LIMIT 1').get();
  assert.equal(event.path, '/uz/request-stand/');
  assert.equal(event.utm_source, 'newsletter');
  assert.equal(JSON.stringify(event).includes('private=1'), false);
  assert.equal(JSON.stringify(event).includes('search.example'), false);

  const { cookie } = await login(base);
  const dashboard = await jsonRequest(base, '/api/admin/dashboard?days=30', { cookie });
  assert.equal(dashboard.data.sessions, 1);
  const analytics = await jsonRequest(base, '/api/admin/analytics?days=30', { cookie });
  assert.ok(analytics.data.events.some((item) => item.key === 'page_view' && item.count === 1));
  assert.ok(analytics.data.pages.some((item) => item.key === '/uz/request-stand/'));
  assert.deepEqual(analytics.data.funnel, {
    visits: 1, ctaSessions: 1, formStartSessions: 1, successSessions: 1,
    successfulSubmissions: 1, fallbackSubmissions: 0,
  });
  assert.ok(analytics.data.ctas.some((item) => item.key === 'book-stand' && item.count === 1));
  assert.ok(analytics.data.channels.some((item) => item.key === 'website' && item.count === 1));
  assert.ok(analytics.data.locales.some((item) => item.key === 'uz' && item.count === 1));
});

test('outbox keeps a lead on provider failure and an admin can retry it', async (t) => {
  let shouldFail = true;
  let attempts = 0;
  const { server, base } = await startBackend(t, {
    telegramToken: 'test-token',
    telegramChat: 'test-chat',
    maxDeliveryAttempts: 1,
    deliverProvider: async (provider, lead) => {
      assert.equal(provider, 'telegram');
      assert.equal(lead.name, 'Outbox Lead');
      attempts += 1;
      if (shouldFail) throw new Error('temporary provider outage');
    },
  });
  const received = await jsonRequest(base, '/lead', {
    method: 'POST', body: { name: 'Outbox Lead', phone: '+998901234567', formType: 'callback' },
  });
  assert.equal(received.response.status, 202);
  const failed = await waitFor(() => server.backendStore.getLead(received.data.id)?.deliveries[0]?.state === 'failed');
  assert.equal(failed, true);
  assert.equal(server.backendStore.getLead(received.data.id).status, 'new');
  assert.equal(server.backendStore.outboxStats().failed, 1);

  const session = await login(base);
  shouldFail = false;
  const retried = await jsonRequest(base, '/api/admin/outbox/retry', {
    method: 'POST', cookie: session.cookie, csrf: session.csrf, body: {},
  });
  assert.equal(retried.response.status, 200);
  assert.equal(retried.data.retried, 1);
  await waitFor(() => server.backendStore.getLead(received.data.id)?.deliveries[0]?.state === 'sent');
  assert.equal(attempts, 2);
});

test('admin and portal panel assets load with noindex and security headers', async (t) => {
  const { base } = await startBackend(t);
  const healthResponse = await fetch(`${base}/health`);
  const health = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(health.ok, true);
  assert.equal(health.service, 'sofexpo-lead-backend');
  const response = await fetch(`${base}/admin`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const adminJs = await fetch(`${base}/admin/app.js`);
  assert.equal(adminJs.status, 200);
  assert.match(adminJs.headers.get('content-type'), /javascript/);
  const portal = await fetch(`${base}/cabinet`);
  assert.equal(portal.status, 200);
  const portalHtml = await portal.text();
  assert.match(portalHtml, /Shaxsiy kabinet/);
  assert.match(portalHtml, /id="register-form"/);
  assert.match(portal.headers.get('x-robots-tag'), /noindex/);
  assert.match(portal.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const portalJs = await fetch(`${base}/cabinet/app.js`);
  assert.equal(portalJs.status, 200);
  assert.match(portalJs.headers.get('content-type'), /javascript/);
  const portalTranslations = await fetch(`${base}/cabinet/i18n.js`);
  assert.equal(portalTranslations.status, 200);
  assert.match(portalTranslations.headers.get('content-type'), /javascript/);
  assert.match(portalTranslations.headers.get('cache-control'), /max-age=300/);
  assert.match(portalTranslations.headers.get('x-robots-tag'), /noindex/);
  assert.match(await portalTranslations.text(), /SOFEXPO_PORTAL_I18N/);
});

test('visitor and exhibitor accounts have isolated profiles and their own CRM-tracked requests', async (t) => {
  const { server, base } = await startBackend(t);
  const options = await jsonRequest(base, '/api/portal/options');
  assert.equal(options.response.status, 200);
  assert.equal(options.data.events.find((event) => event.slug === 'foodera-expo').dates, '27–29 oktabr 2026');
  assert.ok(!options.data.events.some((event) => event.slug.startsWith('promotors')));
  let result = await jsonRequest(base, '/api/portal/register', {
    method: 'POST', body: {
      accountType: 'visitor', name: 'Dilnoza Mehmon', email: 'dilnoza@example.test', password: 'visitor-password-2026',
      phone: '+998 90 123 45 67', country: 'Uzbekistan', industry: 'Retail', interests: 'Food and retail', consent: 'yes',
    },
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.data.user.accountType, 'visitor');
  const visitorCookieHeader = result.response.headers.get('set-cookie');
  assert.match(visitorCookieHeader, /Path=\/api\/portal/);
  assert.match(visitorCookieHeader, /HttpOnly/);
  const visitorCookie = visitorCookieHeader.split(';')[0];
  let visitorCsrf = result.data.csrfToken;

  result = await jsonRequest(base, '/api/admin/dashboard', { cookie: visitorCookie });
  assert.equal(result.response.status, 401);

  result = await jsonRequest(base, '/api/portal/profile', {
    method: 'PATCH', cookie: visitorCookie, csrf: 'bad-token', body: { interests: 'Updated interests' },
  });
  assert.equal(result.response.status, 403);
  result = await jsonRequest(base, '/api/portal/profile', {
    method: 'PATCH', cookie: visitorCookie, csrf: visitorCsrf, body: { interests: 'Updated interests' },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.user.profile.interests, 'Updated interests');

  result = await jsonRequest(base, '/api/portal/requests', {
    method: 'POST', cookie: visitorCookie, csrf: visitorCsrf,
    body: { event: 'foodera-expo', interest: 'buyer-program', message: 'Looking for retail suppliers.', consent: 'yes', locale: 'uz' },
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.data.request.requestType, 'visitor');
  const visitorRequestId = result.data.request.id;

  const exhibitor = await jsonRequest(base, '/api/portal/register', {
    method: 'POST', body: {
      accountType: 'exhibitor', name: 'Aziz Rahimov', email: 'aziz@demo-company.test', password: 'exhibitor-password-2026',
      phone: '+998 91 234 56 78', company: 'Demo Foods LLC', country: 'Uzbekistan', industry: 'Food manufacturing',
      website: 'https://example.test/company', consent: 'yes',
    },
  });
  assert.equal(exhibitor.response.status, 201);
  assert.equal(exhibitor.data.user.accountType, 'exhibitor');
  const exhibitorCookie = exhibitor.response.headers.get('set-cookie').split(';')[0];
  const exhibitorRequest = await jsonRequest(base, '/api/portal/requests', {
    method: 'POST', cookie: exhibitorCookie, csrf: exhibitor.data.csrfToken,
    body: { event: 'foodera-expo', area: '24', package: 'Stend / pavilyon', message: 'Please send the floor plan.', consent: 'yes', locale: 'uz' },
  });
  assert.equal(exhibitorRequest.response.status, 201);
  assert.equal(exhibitorRequest.data.request.requestType, 'exhibitor');
  assert.equal(exhibitorRequest.data.request.details.area, '24 m²');

  const visitorRequests = await jsonRequest(base, '/api/portal/requests', { cookie: visitorCookie });
  const exhibitorRequests = await jsonRequest(base, '/api/portal/requests', { cookie: exhibitorCookie });
  assert.deepEqual(visitorRequests.data.items.map((item) => item.id), [visitorRequestId]);
  assert.equal(exhibitorRequests.data.items.length, 1);
  assert.notEqual(visitorRequests.data.items[0].id, exhibitorRequests.data.items[0].id);

  const admin = await login(base);
  const visitorLeads = await jsonRequest(base, '/api/admin/leads?form=visitor', { cookie: admin.cookie });
  const exhibitorLeads = await jsonRequest(base, '/api/admin/leads?form=exhibitor', { cookie: admin.cookie });
  assert.equal(visitorLeads.data.total, 1);
  assert.equal(exhibitorLeads.data.total, 1);
  assert.equal(visitorLeads.data.items[0].source, 'Portal: mehmon');
  const leadId = server.backendStore.db.prepare('SELECT lead_id FROM portal_requests WHERE request_type = ?').get('exhibitor').lead_id;
  await jsonRequest(base, `/api/admin/leads/${leadId}`, {
    method: 'PATCH', cookie: admin.cookie, csrf: admin.csrf, body: { status: 'contacted' },
  });
  const refreshed = await jsonRequest(base, '/api/portal/requests', { cookie: exhibitorCookie });
  assert.equal(refreshed.data.items[0].status, 'contacted');
});

test('admin portal account workspace filters profiles, tracks request lifecycles, and revokes disabled sessions', async (t) => {
  const { server, base } = await startBackend(t);
  const registration = await jsonRequest(base, '/api/portal/register', {
    method: 'POST', body: {
      accountType: 'visitor', name: 'Admin View Visitor', email: 'admin-view@example.test',
      password: 'visitor-password-2026', phone: '+998 90 123 45 67', country: 'Uzbekistan',
      industry: 'Retail', interests: 'Food sourcing', consent: 'yes',
    },
  });
  assert.equal(registration.response.status, 201);
  const portalCookie = registration.response.headers.get('set-cookie').split(';')[0];
  const accountId = registration.data.user.id;
  const portalRequest = await jsonRequest(base, '/api/portal/requests', {
    method: 'POST', cookie: portalCookie, csrf: registration.data.csrfToken,
    body: { event: 'foodera-expo', interest: 'buyer-program', message: 'Meet retail suppliers', consent: 'yes', locale: 'uz' },
  });
  assert.equal(portalRequest.response.status, 201);
  const admin = await login(base);

  let result = await jsonRequest(base, '/api/admin/portal-accounts?type=visitor&q=admin-view&limit=10', { cookie: admin.cookie });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.total, 1);
  assert.equal(result.data.items[0].id, accountId);
  assert.equal(result.data.items[0].requestCount, 1);
  assert.equal(result.data.items[0].newRequests, 1);
  assert.equal('password_hash' in result.data.items[0], false);
  result = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}`, { cookie: admin.cookie });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.account.requests.length, 1);
  const linkedLeadId = server.backendStore.db.prepare('SELECT lead_id FROM portal_requests WHERE id = ?').get(portalRequest.data.request.id).lead_id;
  assert.equal(result.data.account.requests[0].leadId, linkedLeadId);
  assert.equal(result.data.account.requests[0].status, 'new');
  assert.equal('password_hash' in result.data.account, false);

  const manager = server.backendStore.createUser({ email: 'manager@example.test', password: 'manager-password-2026', role: 'manager' });
  const managerLogin = await jsonRequest(base, '/api/admin/login', { method: 'POST', body: { email: manager.email, password: 'manager-password-2026' } });
  assert.equal(managerLogin.response.status, 200);
  const managerCookie = managerLogin.response.headers.get('set-cookie').split(';')[0];
  result = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}`, { cookie: managerCookie });
  assert.equal(result.response.status, 200);
  const managerAudit = await jsonRequest(base, '/api/admin/audit', { cookie: managerCookie });
  assert.equal(managerAudit.response.status, 403);
  result = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}`, {
    method: 'PATCH', cookie: managerCookie, csrf: managerLogin.data.csrfToken, body: { active: false },
  });
  assert.equal(result.response.status, 403);

  result = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}`, {
    method: 'PATCH', cookie: admin.cookie, csrf: admin.csrf, body: { active: false },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.account.active, 0);
  assert.equal(result.data.revokedSessions, 1);
  const disabledAccounts = await jsonRequest(base, '/api/admin/portal-accounts?active=0', { cookie: admin.cookie });
  assert.equal(disabledAccounts.data.total, 1);
  assert.equal(disabledAccounts.data.items[0].active, 0);
  result = await jsonRequest(base, '/api/portal/me', { cookie: portalCookie });
  assert.equal(result.response.status, 401);

  result = await jsonRequest(base, '/api/admin/dashboard', { cookie: admin.cookie });
  assert.equal(result.data.portalAccounts, 1);
  assert.equal(result.data.portalRequests, 1);
  assert.equal(result.data.portalNewRequests, 1);
  result = await jsonRequest(base, '/api/admin/analytics', { cookie: admin.cookie });
  assert.equal(result.data.portal.accounts, 1);
  assert.equal(result.data.portal.requests, 1);
  assert.deepEqual(result.data.portal.requestsByType, [{ key: 'visitor', count: 1 }]);
  assert.deepEqual(result.data.portal.requestStatuses, [{ key: 'new', count: 1 }]);

  result = await jsonRequest(base, '/api/admin/audit?limit=20', { cookie: admin.cookie });
  assert.ok(result.data.items.some((item) => item.action === 'portal_account.deactivate' && item.entityId === accountId));
  result = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}`, {
    method: 'PATCH', cookie: admin.cookie, csrf: admin.csrf, body: { active: true },
  });
  assert.equal(result.data.account.active, 1);
  const relogin = await jsonRequest(base, '/api/portal/login', { method: 'POST', body: { email: 'admin-view@example.test', password: 'visitor-password-2026' } });
  assert.equal(relogin.response.status, 200);
});

test('CRM lead retention removes expired portal requests but keeps current accounts and recent leads', async (t) => {
  const { server } = await startBackend(t);
  const store = server.backendStore;
  const account = store.createPortalAccount({
    email: 'retention@example.test', password: 'retention-password-2026', accountType: 'visitor',
    profile: { name: 'Retention Visitor', phone: '+998 90 111 22 33' },
  });
  const expiredRequest = store.createPortalRequest({
    accountId: account.id, requestType: 'visitor', event: 'FOODERA EXPO 2026',
    details: { interest: 'business-visit' }, providers: [],
    lead: {
      name: account.name, company: '', phone: account.phone, email: account.email,
      formType: 'visitor', event: 'FOODERA EXPO 2026', locale: 'uz', source: 'Portal: mehmon',
      page: '/cabinet', landing: '', referrer: '', utm: {}, payload: { consent: 'yes' },
    },
  });
  const expiredLeadId = store.db.prepare('SELECT lead_id FROM portal_requests WHERE id = ?').get(expiredRequest.id).lead_id;
  const oldDate = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString();
  store.db.prepare('UPDATE leads SET created_at = ?, updated_at = ? WHERE id = ?').run(oldDate, oldDate, expiredLeadId);
  store.db.prepare('UPDATE portal_requests SET created_at = ? WHERE id = ?').run(oldDate, expiredRequest.id);

  const recentLead = store.createLead({
    name: 'Recent Lead', company: 'Recent Co', phone: '+998 90 222 33 44', email: 'recent@example.test',
    formType: 'generic', event: '', locale: 'uz', source: 'website', page: '/', landing: '/',
    referrer: '', utm: {}, payload: {},
  });
  assert.equal(store.cleanupExpiredLeads(), 1);
  assert.equal(store.getLead(expiredLeadId), null);
  assert.equal(store.getPortalRequest(account.id, expiredRequest.id), null);
  assert.equal(store.getPortalAccountById(account.id).email, 'retention@example.test');
  assert.ok(store.getLead(recentLead.id));
});

test('portal registration rejects invalid roles, missing consent, and invalid exhibitor profiles', async (t) => {
  const { base } = await startBackend(t);
  const baseBody = { name: 'Test Person', email: 'test@example.test', password: 'test-password-2026', phone: '+998901234567', consent: 'yes' };
  let result = await jsonRequest(base, '/api/portal/register', { method: 'POST', body: { ...baseBody, accountType: 'admin' } });
  assert.equal(result.response.status, 422);
  result = await jsonRequest(base, '/api/portal/register', { method: 'POST', body: { ...baseBody, accountType: 'visitor', consent: '' } });
  assert.equal(result.response.status, 422);
  result = await jsonRequest(base, '/api/portal/register', { method: 'POST', body: { ...baseBody, accountType: 'exhibitor' } });
  assert.equal(result.response.status, 422);
  result = await jsonRequest(base, '/api/portal/register', { method: 'POST', body: { ...baseBody, accountType: 'visitor' } });
  assert.equal(result.response.status, 201);
  result = await jsonRequest(base, '/api/portal/register', { method: 'POST', body: { ...baseBody, accountType: 'visitor' } });
  assert.equal(result.response.status, 409);
});

test('backend bootstraps only an environment-provided admin and protects last admin account', async (t) => {
  const { server, base } = await startBackend(t);
  const session = await login(base);
  const users = await jsonRequest(base, '/api/admin/users', { cookie: session.cookie });
  assert.equal(users.data.users.length, 1);
  const result = await jsonRequest(base, `/api/admin/users/${session.user.id}`, {
    method: 'PATCH', cookie: session.cookie, csrf: session.csrf,
    body: { role: 'manager' },
  });
  assert.equal(result.response.status, 422);
  assert.match(result.data.error, /Oxirgi faol admin/);
  assert.equal(server.backendStore.listUsers()[0].active, 1);
});

/* The real Telegram path (no deliverProvider stub): a local stand-in for the Bot API checks the
   request the bot sends, then answers the way Telegram does when something is wrong. */
async function startFakeTelegram(t, reply) {
  const { createServer } = await import('node:http');
  const calls = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      calls.push({ url: req.url, body: JSON.parse(raw || '{}') });
      const [status, body] = reply(calls.length);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { base: `http://127.0.0.1:${server.address().port}`, calls };
}

test('telegram bot: sends the lead to the configured chat, keeps Telegram’s reason and its retry_after', async (t) => {
  let mode = 'ok';
  const telegram = await startFakeTelegram(t, () => {
    if (mode === 'ok') return [200, { ok: true, result: { message_id: 42 } }];
    if (mode === 'chat') return [400, { ok: false, error_code: 400, description: 'Bad Request: chat not found' }];
    return [429, { ok: false, error_code: 429, description: 'Too Many Requests: retry after 90', parameters: { retry_after: 90 } }];
  });
  const { server, base } = await startBackend(t, {
    telegramToken: '123:ABC', telegramChat: '-1001234567890', telegramApiBase: telegram.base, maxDeliveryAttempts: 3,
  });

  const sent = await jsonRequest(base, '/lead', {
    method: 'POST', body: { name: 'Bot Lead', company: 'Tasty LLC', phone: '+998901112233', email: 'bot@tasty.test', industry: 'Food', area: '18', consent: true, event: 'FOODERA EXPO 2026', formType: 'exhibitor' },
  });
  assert.equal(sent.response.status, 202);
  assert.ok(await waitFor(() => server.backendStore.getLead(sent.data.id)?.deliveries[0]?.state === 'sent', 3000));
  assert.equal(telegram.calls[0].url, '/bot123:ABC/sendMessage');
  assert.equal(telegram.calls[0].body.chat_id, '-1001234567890');
  assert.match(telegram.calls[0].body.text, /Bot Lead/);
  assert.match(telegram.calls[0].body.text, /FOODERA EXPO 2026/);
  assert.ok(telegram.calls[0].body.text.length <= 4096);

  mode = 'chat';
  const lost = await jsonRequest(base, '/lead', { method: 'POST', body: { name: 'Chat Missing', phone: '+998901112244', formType: 'callback' } });
  assert.ok(await waitFor(() => /chat not found/.test(server.backendStore.getLead(lost.data.id)?.deliveries[0]?.lastError || ''), 3000));

  mode = 'flood';
  const flood = await jsonRequest(base, '/lead', { method: 'POST', body: { name: 'Flood Lead', phone: '+998901112255', formType: 'callback' } });
  assert.ok(await waitFor(() => /retry after 90/.test(server.backendStore.getLead(flood.data.id)?.deliveries[0]?.lastError || ''), 3000));
  const next = Date.parse(server.backendStore.getLead(flood.data.id).deliveries[0].nextAttemptAt);
  assert.ok(next - Date.now() > 80_000, 'the next attempt waits at least as long as Telegram asked');

  const session = await login(base);
  mode = 'ok';
  const probe = await jsonRequest(base, '/api/admin/system/telegram-test', { method: 'POST', cookie: session.cookie, csrf: session.csrf, body: {} });
  assert.equal(probe.data.ok, true);
  assert.equal(probe.data.messageId, 42);
  mode = 'chat';
  const broken = await jsonRequest(base, '/api/admin/system/telegram-test', { method: 'POST', cookie: session.cookie, csrf: session.csrf, body: {} });
  assert.equal(broken.data.ok, false);
  assert.match(broken.data.error, /chat not found/);
});

test('telegram test button explains a missing bot configuration', async (t) => {
  const { base } = await startBackend(t);
  const session = await login(base);
  const probe = await jsonRequest(base, '/api/admin/system/telegram-test', { method: 'POST', cookie: session.cookie, csrf: session.csrf, body: {} });
  assert.equal(probe.data.ok, false);
  assert.equal(probe.data.configured, false);
});

/* An exhibitor fills the company card (logo, flyers, catalogue, text) and sends it for review;
   the organiser sees it, downloads the files and approves or asks for changes. */
const PNG_1PX = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');
const PDF_MIN = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

async function upload(base, { cookie, csrf, kind, name, body }) {
  const response = await fetch(`${base}/api/portal/files?kind=${kind}`, {
    method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(name) }, body,
  });
  return { response, data: await response.json() };
}

test('exhibitor company profile: uploads are checked by content, reviewed by the organiser, private to the owner', async (t) => {
  const { base } = await startBackend(t);
  const reg = await jsonRequest(base, '/api/portal/register', {
    method: 'POST', body: {
      accountType: 'exhibitor', name: 'Aziz Rahimov', email: 'brand@tasty.test', password: 'exhibitor-password-2026',
      phone: '+998 91 234 56 78', company: 'Tasty Foods LLC', country: 'Uzbekistan', industry: 'Food manufacturing', consent: 'yes',
    },
  });
  assert.equal(reg.response.status, 201);
  const cookie = reg.response.headers.get('set-cookie').split(';')[0];
  const csrf = reg.data.csrfToken;
  const accountId = reg.data.user.id;

  let company = await jsonRequest(base, '/api/portal/company', { cookie });
  assert.equal(company.data.company.status, 'draft');
  assert.equal(company.data.limits.logo.max, 1);

  // submit without a logo is refused with the missing items named
  const early = await jsonRequest(base, '/api/portal/company', { method: 'PUT', cookie, csrf, body: { brandName: 'Tasty', submit: true } });
  assert.equal(early.response.status, 422);
  assert.match(early.data.error, /logotip/);

  // a renamed text file is not an image, and SVG is never accepted
  const fake = await upload(base, { cookie, csrf, kind: 'logo', name: 'logo.png', body: Buffer.from('<svg onload=alert(1)></svg>') });
  assert.equal(fake.response.status, 415);
  const pdfAsLogo = await upload(base, { cookie, csrf, kind: 'logo', name: 'logo.pdf', body: PDF_MIN });
  assert.equal(pdfAsLogo.response.status, 415);
  const logo = await upload(base, { cookie, csrf, kind: 'logo', name: '../../etc/Tasty Logo.png', body: PNG_1PX });
  assert.equal(logo.response.status, 201);
  assert.equal(logo.data.file.mime, 'image/png');
  assert.equal(logo.data.file.fileName, 'Tasty Logo.png');
  const flyer = await upload(base, { cookie, csrf, kind: 'flyer', name: 'Flyer 2026.pdf', body: PDF_MIN });
  assert.equal(flyer.response.status, 201);
  const catalogImage = await upload(base, { cookie, csrf, kind: 'catalog', name: 'cat.png', body: PNG_1PX });
  assert.equal(catalogImage.response.status, 415);
  // a second logo replaces the first
  const logo2 = await upload(base, { cookie, csrf, kind: 'logo', name: 'logo-v2.png', body: PNG_1PX });
  assert.equal(logo2.response.status, 201);
  company = await jsonRequest(base, '/api/portal/company', { cookie });
  assert.deepEqual(company.data.company.files.map((f) => f.kind).sort(), ['flyer', 'logo']);

  // the owner can read a file back with safe headers
  const own = await fetch(`${base}/api/portal/files/${flyer.data.file.id}`, { headers: { Cookie: cookie } });
  assert.equal(own.status, 200);
  assert.equal(own.headers.get('content-type'), 'application/pdf');
  assert.match(own.headers.get('content-disposition'), /^attachment/);
  assert.equal(own.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(Buffer.from(await own.arrayBuffer()).equals(PDF_MIN));

  const saved = await jsonRequest(base, '/api/portal/company', {
    method: 'PUT', cookie, csrf, body: {
      brandName: 'Tasty', description: 'Dried fruit and nut mixes from the Fergana valley, packed for retail chains and HoReCa.',
      products: 'Dried apricots, raisins, nut mixes', website: 'https://tasty.test/about', event: 'foodera-expo', stand: 'B-14',
      contactEmail: 'sales@tasty.test', submit: true,
    },
  });
  assert.equal(saved.response.status, 200);
  assert.equal(saved.data.company.status, 'submitted');

  // a visitor has no company card, and cannot read the exhibitor's files
  const visitor = await jsonRequest(base, '/api/portal/register', {
    method: 'POST', body: { accountType: 'visitor', name: 'Guest', email: 'guest@tasty.test', password: 'visitor-password-2026', phone: '+998 90 000 00 00', country: 'Uzbekistan', industry: 'Retail', interests: 'Food', consent: 'yes' },
  });
  const visitorCookie = visitor.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await jsonRequest(base, '/api/portal/company', { cookie: visitorCookie })).response.status, 403);
  assert.equal((await fetch(`${base}/api/portal/files/${flyer.data.file.id}`, { headers: { Cookie: visitorCookie } })).status, 403);

  // the organiser: list, account card, file download, review
  const session = await login(base);
  const list = await jsonRequest(base, '/api/admin/exhibitor-profiles', { cookie: session.cookie });
  assert.equal(list.data.counts.submitted, 1);
  assert.equal(list.data.items[0].brandName, 'Tasty');
  assert.ok(list.data.items[0].logoId);
  const card = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}`, { cookie: session.cookie });
  assert.equal(card.data.account.company, 'Tasty Foods LLC');
  assert.equal(card.data.account.exhibitorCard.stand, 'B-14');
  assert.equal(card.data.account.exhibitorCard.files.length, 2);
  const staffDownload = await fetch(`${base}/api/admin/files/${logo2.data.file.id}`, { headers: { Cookie: session.cookie } });
  assert.equal(staffDownload.status, 200);
  assert.equal(staffDownload.headers.get('content-type'), 'image/png');
  const vague = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}/company`, { method: 'PATCH', cookie: session.cookie, csrf: session.csrf, body: { status: 'changes', note: '' } });
  assert.equal(vague.response.status, 422);
  const changes = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}/company`, { method: 'PATCH', cookie: session.cookie, csrf: session.csrf, body: { status: 'changes', note: 'Logo needs a transparent background.' } });
  assert.equal(changes.data.company.status, 'changes');
  company = await jsonRequest(base, '/api/portal/company', { cookie });
  assert.equal(company.data.company.reviewNote, 'Logo needs a transparent background.');
  const approved = await jsonRequest(base, `/api/admin/portal-accounts/${accountId}/company`, { method: 'PATCH', cookie: session.cookie, csrf: session.csrf, body: { status: 'approved', note: '' } });
  assert.equal(approved.data.company.status, 'approved');

  // deleting removes the file for good
  const removed = await jsonRequest(base, `/api/portal/files/${flyer.data.file.id}`, { method: 'DELETE', cookie, csrf });
  assert.equal(removed.response.status, 200);
  assert.equal((await fetch(`${base}/api/portal/files/${flyer.data.file.id}`, { headers: { Cookie: cookie } })).status, 404);
});

test('a card sent for review is announced in the managers’ Telegram chat', async (t) => {
  const telegram = await startFakeTelegram(t, () => [200, { ok: true, result: { message_id: 7 } }]);
  const { base } = await startBackend(t, { telegramToken: '123:ABC', telegramChat: '-100555', telegramApiBase: telegram.base });
  const reg = await jsonRequest(base, '/api/portal/register', {
    method: 'POST', body: { accountType: 'exhibitor', name: 'Nodira K', email: 'card@notice.test', password: 'exhibitor-password-2026', phone: '+998 90 111 22 33', company: 'Notice Foods', country: 'Uzbekistan', industry: 'Food', consent: 'yes' },
  });
  const cookie = reg.response.headers.get('set-cookie').split(';')[0];
  const csrf = reg.data.csrfToken;
  assert.equal((await upload(base, { cookie, csrf, kind: 'logo', name: 'logo.png', body: PNG_1PX })).response.status, 201);
  const sent = await jsonRequest(base, '/api/portal/company', {
    method: 'PUT', cookie, csrf, body: { brandName: 'Notice', description: 'Spices and dried fruit for retail chains in Central Asia and the Gulf.', event: 'foodera-expo', stand: 'C-3', submit: true },
  });
  assert.equal(sent.response.status, 200);
  assert.ok(await waitFor(() => telegram.calls.some((call) => /Eksponent kartasi tekshiruvga keldi/.test(call.body.text)), 3000));
  const notice = telegram.calls.find((call) => /Eksponent kartasi/.test(call.body.text)).body.text;
  assert.match(notice, /FOODERA EXPO 2026 · stend C-3/);
  assert.match(notice, /logo 1/);
});
