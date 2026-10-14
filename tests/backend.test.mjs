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
    formType: 'exhibitor', industry: 'Food', area: '18 м²', locale: 'uz', page: 'https://sof-expo.com/uz/request-stand/?utm_source=secret',
    landing: 'https://sof-expo.com/uz/?utm_campaign=launch', referrer: 'https://search.example/result?q=private',
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
    'https://sof-expo.com', 'https://foodera.sof-expo.com', 'https://buildpro.sof-expo.com',
    'https://agropro.sof-expo.com', 'https://worldedu.sof-expo.com', 'https://ecomretail.sof-expo.com',
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
  const { server, base } = await startBackend(t, { origins: ['https://sof-expo.com'] });
  let result = await jsonRequest(base, '/lead', {
    method: 'POST',
    origin: 'https://sof-expo.com',
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
    method: 'POST', origin: 'https://sof-expo.com', body: { name: 'Missing phone' },
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
        { event: 'page_view', sessionId: 'anon-session-1', locale: 'uz', path: '/uz/request-stand/?email=private', url: 'https://sof-expo.com/?private=1', referrer: 'https://search.example/?user=secret', utm: { source: 'newsletter', campaign: 'october' } },
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

test('lead lifecycle: deal fields, typed activity, stage history, journey, pipeline, tasks and sales analytics', async (t) => {
  const { base } = await startBackend(t);
  const sessionId = 'sess_lifecycle_1';
  await jsonRequest(base, '/event', {
    method: 'POST', body: { events: [
      { event: 'page_view', sessionId, path: '/uz/buildpro-expo/', utm_source: 'instagram' },
      { event: 'cta_click', sessionId, path: '/uz/buildpro-expo/', cta: 'Stend band qilish' },
    ] },
  });
  let result = await jsonRequest(base, '/lead', {
    method: 'POST', body: {
      name: 'Lifecycle Lead', phone: '+998 90 555 44 33', company: 'Beton LLC', formType: 'exhibitor', industry: 'Build',
      area: '24', consent: 'yes', event: 'BUILD PRO EXPO 2026', utm_source: 'instagram', utm_campaign: 'autumn', sessionId,
    },
  });
  assert.equal(result.response.status, 202);
  const leadId = result.data.id;
  const admin = await login(base);

  result = await jsonRequest(base, `/api/admin/leads/${leadId}`, { cookie: admin.cookie });
  assert.equal(result.data.lead.sessionId, sessionId);
  assert.deepEqual(result.data.lead.journey.map((step) => step.event), ['page_view', 'cta_click']);
  assert.deepEqual(result.data.lead.stageHistory.map((step) => step.toStatus), ['new']);
  assert.equal(result.data.lead.payload.sessionId, undefined, 'session id is metadata, not form payload');

  result = await jsonRequest(base, `/api/admin/leads/${leadId}/notes`, {
    method: 'POST', cookie: admin.cookie, csrf: admin.csrf, body: { body: 'Called, wants 24 m²', kind: 'call' },
  });
  assert.equal(result.response.status, 201);
  result = await jsonRequest(base, `/api/admin/leads/${leadId}`, { cookie: admin.cookie });
  assert.equal(result.data.lead.status, 'contacted', 'a logged call moves a new lead on');
  assert.ok(result.data.lead.firstContactAt);
  assert.equal(result.data.lead.notes[0].kind, 'call');

  result = await jsonRequest(base, `/api/admin/leads/${leadId}/notes`, {
    method: 'POST', cookie: admin.cookie, csrf: admin.csrf, body: { body: 'x', kind: 'fax' },
  });
  assert.equal(result.response.status, 422);
  result = await jsonRequest(base, `/api/admin/leads/${leadId}`, {
    method: 'PATCH', cookie: admin.cookie, csrf: admin.csrf, body: { currency: 'BTC' },
  });
  assert.equal(result.response.status, 422);

  const tomorrow = new Date(Date.now() + 26 * 3_600_000).toISOString();
  result = await jsonRequest(base, `/api/admin/leads/${leadId}`, {
    method: 'PATCH', cookie: admin.cookie, csrf: admin.csrf,
    body: { status: 'proposal', dealAmount: 4800, currency: 'USD', standArea: 24, assignee: ADMIN_EMAIL, nextAction: 'Send contract', nextActionAt: tomorrow },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.lead.dealAmount, 4800);
  assert.equal(result.data.lead.nextAction, 'Send contract');
  assert.ok(result.data.lead.history.some((item) => item.details?.status?.to === 'proposal'));

  result = await jsonRequest(base, '/api/admin/pipeline', { cookie: admin.cookie });
  const proposal = result.data.columns.find((column) => column.status === 'proposal');
  assert.equal(proposal.count, 1);
  assert.equal(proposal.amount.USD, 4800);

  result = await jsonRequest(base, '/api/admin/tasks', { cookie: admin.cookie });
  assert.equal(result.data.upcoming.length + result.data.today.length, 1);

  result = await jsonRequest(base, '/api/admin/leads?status=open&assignee=' + encodeURIComponent(ADMIN_EMAIL), { cookie: admin.cookie });
  assert.equal(result.data.total, 1);

  result = await jsonRequest(base, `/api/admin/leads/${leadId}`, {
    method: 'PATCH', cookie: admin.cookie, csrf: admin.csrf, body: { status: 'lost', lostReason: '' },
  });
  assert.equal(result.response.status, 422, 'a lost deal needs a reason');
  result = await jsonRequest(base, `/api/admin/leads/${leadId}`, {
    method: 'PATCH', cookie: admin.cookie, csrf: admin.csrf, body: { status: 'won' },
  });
  assert.ok(result.data.lead.closedAt);
  assert.deepEqual(result.data.lead.stageHistory.map((step) => step.toStatus), ['new', 'contacted', 'proposal', 'won']);

  result = await jsonRequest(base, '/api/admin/sales-analytics?days=30', { cookie: admin.cookie });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.totals.won, 1);
  assert.equal(result.data.totals.revenue.USD, 4800);
  assert.equal(result.data.totals.trackedJourneys, 1);
  assert.equal(result.data.funnel.find((step) => step.stage === 'qualified').count, 1, 'skipped stages still count as passed');
  assert.equal(result.data.channels[0].key, 'instagram');
  assert.equal(result.data.campaigns[0].key, 'autumn');

  result = await jsonRequest(base, '/api/admin/team', { cookie: admin.cookie });
  assert.ok(result.data.team.some((member) => member.email === ADMIN_EMAIL));
  result = await jsonRequest(base, '/api/admin/dashboard', { cookie: admin.cookie });
  assert.equal(result.data.sales.won, 1);
});

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF\n');

async function upload(base, { cookie, csrf, kind, name, body }) {
  const response = await fetch(`${base}/api/portal/files?kind=${kind}&name=${encodeURIComponent(name)}`, {
    method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/octet-stream' }, body,
  });
  return { response, data: await response.json() };
}

test('exhibitor company page: uploads, moderation and the public directory', async (t) => {
  const { base } = await startBackend(t);
  let result = await jsonRequest(base, '/api/portal/register', {
    method: 'POST', body: {
      accountType: 'exhibitor', name: 'Aziz Eksponent', email: 'aziz@beton.test', password: 'exhibitor-password-2026',
      phone: '+998 90 111 22 33', company: 'Beton Group', industry: 'Construction', consent: 'yes',
    },
  });
  const cookie = result.response.headers.get('set-cookie').split(';')[0];
  const csrf = result.data.csrfToken;
  const accountId = result.data.user.id;

  result = await upload(base, { cookie, csrf, kind: 'catalog', name: 'notes.txt', body: Buffer.from('just some text here') });
  assert.equal(result.response.status, 415, 'bytes decide the type, not the name');
  result = await upload(base, { cookie, csrf, kind: 'logo', name: 'logo.pdf', body: PDF });
  assert.equal(result.response.status, 415, 'a logo must be an image');
  result = await upload(base, { cookie, csrf: 'bad', kind: 'logo', name: 'logo.png', body: PNG });
  assert.equal(result.response.status, 403);

  result = await upload(base, { cookie, csrf, kind: 'logo', name: 'logo.png', body: PNG });
  assert.equal(result.response.status, 201);
  const logoId = result.data.file.id;
  result = await upload(base, { cookie, csrf, kind: 'catalog', name: 'Beton_katalog_2026.pdf', body: PDF });
  assert.equal(result.response.status, 201);
  assert.equal(result.data.file.title, 'Beton katalog 2026');
  const catalogId = result.data.file.id;

  const own = await fetch(`${base}/api/portal/files/${catalogId}`, { headers: { Cookie: cookie } });
  assert.equal(own.status, 200);
  assert.equal(own.headers.get('content-type'), 'application/pdf');

  const showcase = {
    name: 'Beton Group', tagline: 'Ready-mix concrete', about: 'Concrete for 15 years.', website: 'beton.test',
    socials: { instagram: '@betongroup', telegram: 't.me/betongroup' },
    participation: [{ event: 'buildpro-expo', year: 2026, stand: 'A-12' }, { event: 'buildpro-expo', year: 2024 }],
  };
  result = await jsonRequest(base, '/api/portal/showcase', { method: 'PUT', cookie, csrf, body: { showcase: { ...showcase, participation: [] }, submit: true } });
  assert.equal(result.response.status, 422);
  assert.equal(result.data.details.participation, 'required');
  result = await jsonRequest(base, '/api/portal/showcase', { method: 'PUT', cookie, csrf, body: { showcase: { ...showcase, website: 'not a url' } } });
  assert.equal(result.response.status, 422);
  result = await jsonRequest(base, '/api/portal/showcase', { method: 'PUT', cookie, csrf, body: { showcase, submit: true } });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.showcase.status, 'pending');
  assert.equal(result.data.showcase.draft.logoFileId, logoId);
  assert.equal(result.data.showcase.draft.socials.instagram, 'https://instagram.com/betongroup');

  result = await jsonRequest(base, '/api/public/exhibitors');
  assert.equal(result.data.items.length, 0, 'nothing is public before moderation');
  assert.equal((await fetch(`${base}/media/exhibitors/${catalogId}`)).status, 404);

  const admin = await login(base);
  result = await jsonRequest(base, '/api/admin/showcases?status=pending', { cookie: admin.cookie });
  assert.equal(result.data.items.length, 1);
  assert.equal(result.data.counts.pending, 1);
  result = await jsonRequest(base, `/api/admin/showcases/${accountId}/review`, { method: 'POST', cookie: admin.cookie, csrf: admin.csrf, body: { action: 'reject' } });
  assert.equal(result.response.status, 422, 'a rejection needs a note');
  result = await jsonRequest(base, `/api/admin/showcases/${accountId}/review`, { method: 'POST', cookie: admin.cookie, csrf: admin.csrf, body: { action: 'publish' } });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.showcase.slug, 'beton-group');

  result = await jsonRequest(base, '/api/public/exhibitors?when=current', { origin: 'https://buildpro.sof-expo.com' });
  assert.equal(result.response.headers.get('access-control-allow-origin'), '*');
  assert.equal(result.data.items.length, 1);
  const company = result.data.items[0];
  assert.equal(company.current, true);
  assert.equal(company.materials[0].title, 'Beton katalog 2026');
  assert.equal(company.participation[0].label, 'BUILD PRO EXPO 2026');
  assert.equal((await jsonRequest(base, '/api/public/exhibitors?event=agropro-expo')).data.items.length, 0);
  assert.equal((await jsonRequest(base, '/api/public/exhibitors?q=concrete')).data.items.length, 1);

  const media = await fetch(`${base}${company.materials[0].url}`, { headers: { Origin: 'https://sof-expo.com' } });
  assert.equal(media.status, 200);
  assert.equal(media.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(media.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal(Buffer.from(await media.arrayBuffer()).toString('latin1', 0, 5), '%PDF-');
  const logo = await fetch(`${base}${company.logo}`);
  assert.match(logo.headers.get('content-security-policy'), /sandbox/);

  /* a material added after publishing waits for the next review; deleting one is immediate */
  result = await upload(base, { cookie, csrf, kind: 'flyer', name: 'flyer.pdf', body: PDF });
  assert.equal((await fetch(`${base}/media/exhibitors/${result.data.file.id}`)).status, 404);
  result = await jsonRequest(base, `/api/portal/files/${catalogId}`, { method: 'DELETE', cookie, csrf });
  assert.equal(result.response.status, 200);
  assert.equal((await fetch(`${base}/media/exhibitors/${catalogId}`)).status, 404);
  assert.equal((await jsonRequest(base, '/api/public/exhibitors')).data.items[0].materials.length, 0);

  result = await jsonRequest(base, `/api/admin/showcases/${accountId}/review`, { method: 'POST', cookie: admin.cookie, csrf: admin.csrf, body: { action: 'hide', note: 'Duplicate' } });
  assert.equal(result.response.status, 200);
  assert.equal((await jsonRequest(base, '/api/public/exhibitors')).data.items.length, 0);

  /* visitors have no company page */
  result = await jsonRequest(base, '/api/portal/register', {
    method: 'POST', body: { accountType: 'visitor', name: 'Mehmon', email: 'guest@example.test', password: 'visitor-password-2026', phone: '+998 90 000 11 22', consent: 'yes' },
  });
  assert.equal(result.response.status, 201, 'a visitor needs no company');
  const visitorCookie = result.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await jsonRequest(base, '/api/portal/showcase', { cookie: visitorCookie })).response.status, 403);
});
