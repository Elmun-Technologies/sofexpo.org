import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLeadServer } from '../scripts/lead-webhook.mjs';
import { normalizeSiteTags, resolveSiteTags, serializeSiteTags, verificationTags } from '../scripts/site-tags.mjs';

const ADMIN_EMAIL = 'admin@sofexpo.test';
const ADMIN_PASSWORD = 'test-admin-password-2026';

test('site tags: ids are pulled out of pasted vendor snippets, junk is rejected', () => {
  const { value, errors } = normalizeSiteTags({
    googleVerification: '<meta name="google-site-verification" content="AbC_dEf-123456" />',
    yandexVerification: 'abc123def456, zzz999yyy888',
    bingVerification: 'bad token "><script>',
    ga4Id: '<script async src="https://www.googletagmanager.com/gtag/js?id=g-ab12cd34ef"></script>',
    gtmId: 'GTM-AB12CD',
    yandexMetrikaId: '<script>ym(98765432, "init", {})</script><noscript><img src="https://mc.yandex.ru/watch/98765432"/></noscript>',
    yandexWebvisor: false,
    metaPixelId: "fbq('init', '1234567890123456'); fbq('track', 'PageView');",
    tiktokPixelId: "ttq.load('CABCDEFGHIJ1234567890'); ttq.page();",
    baiduTongjiId: 'https://hm.baidu.com/hm.js?0123456789abcdef0123456789abcdef',
    googleAdsId: 'nope',
    customHead: '<body><script>x</script>',
  });
  assert.deepEqual(value, {
    googleVerification: 'AbC_dEf-123456',
    yandexVerification: 'abc123def456,zzz999yyy888',
    ga4Id: 'G-AB12CD34EF',
    gtmId: 'GTM-AB12CD',
    yandexMetrikaId: '98765432',
    yandexWebvisor: false,
    metaPixelId: '1234567890123456',
    tiktokPixelId: 'CABCDEFGHIJ1234567890',
    baiduTongjiId: '0123456789abcdef0123456789abcdef',
  });
  assert.deepEqual(Object.keys(errors).sort(), ['bingVerification', 'customHead', 'googleAdsId']);
  assert.deepEqual(verificationTags(value), [
    { name: 'google-site-verification', content: 'AbC_dEf-123456' },
    { name: 'yandex-verification', content: 'abc123def456' },
    { name: 'yandex-verification', content: 'zzz999yyy888' },
  ]);
  // byte-stable: the same values always serialize to the same file
  assert.equal(serializeSiteTags(value), serializeSiteTags({ ...value }));
});

test('site tags: admin values win over PUBLIC_* env, env fills the gaps', () => {
  const tags = resolveSiteTags({ ga4Id: 'G-SAVED1234' }, { PUBLIC_GA4_ID: 'G-ENV12345', PUBLIC_YM_ID: '1234567', PUBLIC_BING_VERIFICATION: '<b>' });
  assert.equal(tags.ga4Id, 'G-SAVED1234');
  assert.equal(tags.yandexMetrikaId, '1234567');
  assert.equal(tags.bingVerification, undefined);
});

async function start(t, directory, repoDir, calls) {
  const server = createLeadServer({
    host: '127.0.0.1',
    port: 0,
    dbPath: join(directory, 'sofexpo.sqlite'),
    legacyLeadsPath: '',
    legacyEventsPath: '',
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    origins: ['*'],
    siteTags: {
      repoDir,
      gitPush: true,
      debounceMs: 5,
      deployHooks: [],
      gitRunner: async (cmd, args) => {
        calls.push(args.join(' '));
        return { stdout: args.includes('--cached') ? 'src/data/site-tags.json' : '', stderr: '' };
      },
    },
  });
  const address = await server.listenBackend();
  let open = true;
  const stop = async () => {
    if (!open) return;
    open = false;
    await new Promise((resolve) => server.close(resolve));
    server.backendStore.close();
  };
  t.after(stop);
  return { server, stop, base: `http://127.0.0.1:${address.port}` };
}

async function call(base, path, { method = 'GET', body, cookie, csrf } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const response = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { response, data: await response.json() };
}

async function login(base, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  const { response, data } = await call(base, '/api/admin/login', { method: 'POST', body: { email, password } });
  assert.equal(response.status, 200);
  return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: data.csrfToken };
}

async function waitFor(predicate, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('timed out');
}

test('admin site tags: validate, save, materialize the JSON, commit + push; managers are refused', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'sofexpo-sitetags-'));
  const repoDir = join(directory, 'repo');
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const calls = [];
  const { base } = await start(t, directory, repoDir, calls);
  const admin = await login(base);

  const empty = await call(base, '/api/admin/site-tags', { cookie: admin.cookie });
  assert.equal(empty.response.status, 200);
  assert.deepEqual(empty.data.tags, {});
  assert.ok(empty.data.fields.some((field) => field.key === 'metaPixelId' && field.group === 'ads'));
  assert.equal(empty.data.fields.some((field) => 'find' in field), false, 'regexes stay on the server');

  const noCsrf = await call(base, '/api/admin/site-tags', { method: 'PUT', cookie: admin.cookie, body: { tags: {} } });
  assert.equal(noCsrf.response.status, 403);

  const bad = await call(base, '/api/admin/site-tags', { method: 'PUT', ...admin, body: { tags: { ga4Id: 'UA-12345-1', metaPixelId: '1234567890123456' } } });
  assert.equal(bad.response.status, 422);
  assert.ok(bad.data.details.ga4Id);
  assert.equal(existsSync(join(repoDir, 'src/data/site-tags.json')), false, 'nothing is written while a field is invalid');

  const saved = await call(base, '/api/admin/site-tags', {
    method: 'PUT', ...admin,
    body: { tags: { ga4Id: 'G-AB12CD34EF', yandexMetrikaId: 'ym(98765432, "init")', googleVerification: '<meta name="google-site-verification" content="tok_123456" />' } },
  });
  assert.equal(saved.response.status, 200);
  assert.deepEqual(saved.data.changed.sort(), ['ga4Id', 'googleVerification', 'yandexMetrikaId', 'yandexWebvisor'].sort());
  assert.equal(saved.data.publish.scheduled, true);
  const file = JSON.parse(readFileSync(join(repoDir, 'src/data/site-tags.json'), 'utf8'));
  assert.deepEqual(file, { googleVerification: 'tok_123456', ga4Id: 'G-AB12CD34EF', yandexMetrikaId: '98765432', yandexWebvisor: true });

  await waitFor(() => calls.some((c) => c.includes('push origin HEAD:main')));
  assert.ok(calls.some((c) => c === `-C ${repoDir} add -- src/data/site-tags.json`));
  assert.ok(calls.some((c) => c.startsWith(`-C ${repoDir} commit -m chore(site): site tags:`)));

  const again = await call(base, '/api/admin/site-tags', {
    method: 'PUT', ...admin, body: { tags: { ga4Id: 'G-AB12CD34EF', yandexMetrikaId: '98765432', googleVerification: 'tok_123456' } },
  });
  assert.deepEqual(again.data.changed, []);
  assert.equal(again.data.publish.scheduled, false, 'an unchanged save does not commit');

  const audit = await call(base, '/api/admin/audit?limit=5', { cookie: admin.cookie });
  assert.ok(audit.data.items.some((item) => item.action === 'site_tags.update'));

  const created = await call(base, '/api/admin/users', { method: 'POST', ...admin, body: { email: 'manager@sofexpo.test', password: 'manager-password-2026', role: 'manager' } });
  assert.equal(created.response.status, 201);
  const manager = await login(base, 'manager@sofexpo.test', 'manager-password-2026');
  const refused = await call(base, '/api/admin/site-tags', { cookie: manager.cookie });
  assert.equal(refused.response.status, 403);
});

test('site tags: a saved value whose file got lost is re-materialized on boot', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'sofexpo-sitetags-heal-'));
  const repoDir = join(directory, 'repo');
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const calls = [];
  const first = await start(t, directory, repoDir, calls);
  const admin = await login(first.base);
  await call(first.base, '/api/admin/site-tags', { method: 'PUT', ...admin, body: { tags: { metaPixelId: '1234567890123456' } } });
  await first.stop();
  rmSync(join(repoDir, 'src/data/site-tags.json'));

  await start(t, directory, repoDir, calls);
  const file = JSON.parse(readFileSync(join(repoDir, 'src/data/site-tags.json'), 'utf8'));
  assert.equal(file.metaPixelId, '1234567890123456');
});
