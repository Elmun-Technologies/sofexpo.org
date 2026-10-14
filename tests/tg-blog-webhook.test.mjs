/**
 * Webhook endpoint + pipeline fixtures: plain post, photo post, 3-photo album, edit,
 * wrong secret, foreign channel, duplicate delivery, hashtag gate, and the admin
 * publish/unpublish/delete API. The Bot API and git are faked via the createLeadServer
 * dependency seams — no network, no repo mutations outside a temp dir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLeadServer } from '../scripts/lead-webhook.mjs';
import { slugify } from '../scripts/backend/tgblog/slug.mjs';

const ADMIN_EMAIL = 'admin@sofexpo.test';
const ADMIN_PASSWORD = 'test-admin-password-2026';
const SECRET = 'test-webhook-secret-32chars-minimum';
const CHANNEL_ID = '-100555';
const CHAT = { id: -100555, type: 'channel', title: 'SOF EXPO' };

const jsonResponse = (payload) => ({
  ok: true,
  status: 200,
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => payload,
});

/** Fake Bot API: getFile answers per file_id, /file/bot downloads return bytes. */
function fakeTelegram() {
  const calls = { getFile: [], downloads: [] };
  const apiFetch = async (url) => {
    const u = String(url);
    if (u.includes('/getFile')) {
      const fileId = new URL(u).searchParams.get('file_id');
      calls.getFile.push(fileId);
      return jsonResponse({ ok: true, result: { file_id: fileId, file_unique_id: `u-${fileId}`, file_size: 1234, file_path: `photos/${fileId}.jpg` } });
    }
    if (u.includes('/file/bot')) {
      calls.downloads.push(u);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: async () => new TextEncoder().encode(`jpeg-bytes`).buffer,
      };
    }
    throw new Error(`unexpected Bot API call: ${u}`);
  };
  return { calls, apiFetch };
}

function gitCapture() {
  const commands = [];
  return {
    commands,
    gitRunner: async (cmd, args) => {
      commands.push(`${cmd} ${args.join(' ')}`);
      return { stdout: '', stderr: '' };
    },
  };
}

async function startBackend(t, tgOverrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'sofexpo-tgblog-test-'));
  const repoDir = join(directory, 'repo');
  mkdirSync(join(repoDir, 'src', 'content', 'news', 'ru'), { recursive: true });
  const telegram = fakeTelegram();
  const git = gitCapture();
  const server = createLeadServer({
    host: '127.0.0.1',
    port: 0,
    dbPath: join(directory, 'sofexpo.sqlite'),
    legacyLeadsPath: '',
    legacyEventsPath: '',
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    origins: ['*'],
    tgBlog: {
      token: 'test-token',
      secret: SECRET,
      channelId: CHANNEL_ID,
      channelUsername: 'testchan',
      mode: 'auto',
      repoDir,
      pushDebounceMs: 60_000, // flush manually in assertions that need it
      apiFetch: telegram.apiFetch,
      gitRunner: git.gitRunner,
      deployHooks: [],
      logger: { info() {}, warn() {}, error() {} },
      ...tgOverrides,
    },
  });
  const address = await server.listenBackend();
  const base = `http://127.0.0.1:${address.port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    server.backendStore.close();
    rmSync(directory, { recursive: true, force: true });
  });
  return { server, base, repoDir, telegram, git };
}

async function hook(base, update, { secret = SECRET } = {}) {
  const response = await fetch(`${base}/api/telegram/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': secret },
    body: JSON.stringify(update),
  });
  return { status: response.status, data: await response.json() };
}

async function waitFor(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  throw new Error('Timed out waiting for the sync pipeline');
}

const postsInDb = (server) => server.backendStore.db.prepare(
  "SELECT * FROM tg_blog_posts WHERE status != 'deleted' ORDER BY id",
).all();

const readPost = (repoDir, slug) => readFileSync(join(repoDir, 'src', 'content', 'news', 'ru', `${slug}.md`), 'utf8');

/* ---------- fixtures ---------- */

const textPost = (over = {}) => {
  const text = over.text ?? 'Новости недели\n\nЦентр SOF EXPO утвердил план зала. Подробности на сайте. #blog #новости';
  return {
    update_id: 1,
    channel_post: {
      message_id: 101,
      chat: CHAT,
      date: 1_760_000_000,
      text,
      entities: [
        { type: 'bold', offset: text.indexOf('SOF EXPO'), length: 8 },
        { type: 'hashtag', offset: text.indexOf('#blog'), length: 5 },
      ],
      ...over,
    },
  };
};

const photoPost = (over = {}) => ({
  update_id: 2,
  channel_post: {
    message_id: 102,
    chat: CHAT,
    date: 1_760_000_100,
    caption: 'План зала\n\nСхема размещения стендов готова',
    photo: [
      { file_id: 'sm-p1', file_unique_id: 'usm-p1', width: 90, height: 90 },
      { file_id: 'lg-p1', file_unique_id: 'ulg-p1', width: 800, height: 600, file_size: 12_345 },
    ],
    ...over,
  },
});

const albumUpdate = (messageId, fileId, withCaption) => ({
  update_id: messageId,
  channel_post: {
    message_id: messageId,
    chat: CHAT,
    date: 1_760_000_200 + messageId,
    media_group_id: 'group-77',
    ...(withCaption ? { caption: 'Фотоотчёт с форума\n\nТри кадра с площадки SOF EXPO' } : {}),
    photo: [{ file_id: fileId, file_unique_id: `u-${fileId}`, width: 1280, height: 720, file_size: 54_321 }],
  },
});

/* ---------- tests ---------- */

test('webhook: wrong secret → 401, valid → 200', async (t) => {
  const { base } = await startBackend(t);
  const bad = await hook(base, textPost(), { secret: 'wrong' });
  assert.equal(bad.status, 401);
  const good = await hook(base, textPost());
  assert.equal(good.status, 200);
  assert.equal(good.data.ok, true);
});

test('webhook: update from a foreign channel is accepted but ignored', async (t) => {
  const { base, server } = await startBackend(t);
  const update = textPost({ chat: { id: -100999, type: 'channel', title: 'Boshqa' } });
  const { status } = await hook(base, update);
  assert.equal(status, 200);
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(postsInDb(server).length, 0);
});

test('webhook: unsupported update types answer 200 and do nothing', async (t) => {
  const { base, server } = await startBackend(t);
  const { status } = await hook(base, { update_id: 9, message: { message_id: 1, chat: { id: 5 }, text: 'dm' } });
  assert.equal(status, 200);
  assert.equal(postsInDb(server).length, 0);
});

test('text post → markdown article with slug, tags stripped, title extracted', async (t) => {
  const { base, server, repoDir } = await startBackend(t);
  await hook(base, textPost());
  await waitFor(() => postsInDb(server).length === 1);
  const row = postsInDb(server)[0];
  assert.equal(row.slug, 'novosti-nedeli');
  assert.equal(row.status, 'published');
  assert.equal(row.tg_link, 'https://t.me/testchan/101');
  const md = readPost(repoDir, 'novosti-nedeli');
  assert.match(md, /title: "Новости недели"/);
  assert.match(md, /date: 2025-10-09/);
  assert.match(md, /tags: \["blog", ?"новости"\]/);
  assert.match(md, /telegram: "https:\/\/t\.me\/testchan\/101"/);
  assert.ok(!md.includes('#blog'), 'hashtags are stripped from the body');
  assert.ok(md.includes('<strong>SOF EXPO</strong>') || md.includes('центр'));
  assert.ok(!md.endsWith('draft: true\n'));
});

test('photo post → largest photo downloaded via getFile, becomes hero + figure', async (t) => {
  const { base, server, repoDir, telegram } = await startBackend(t);
  await hook(base, photoPost());
  await waitFor(() => postsInDb(server).length === 1);
  assert.deepEqual(telegram.calls.getFile, ['lg-p1'], 'getFile only for the largest size');
  const row = postsInDb(server)[0];
  assert.equal(row.cover_path, '/images/telegram/plan-zala/ulg-p1.jpg');
  const mediaDir = join(repoDir, 'public', 'images', 'telegram', 'plan-zala');
  assert.deepEqual(readdirSync(mediaDir), ['ulg-p1.jpg']);
  const md = readPost(repoDir, 'plan-zala');
  assert.match(md, /hero: "\/images\/telegram\/plan-zala\/ulg-p1\.jpg"/);
  assert.match(md, /<img src="\/images\/telegram\/plan-zala\/ulg-p1\.jpg" alt="План зала" loading="lazy" width="800" height="600" \/>/);
  // the token-bearing Bot API URL must never leak anywhere
  assert.ok(!md.includes('api.telegram.org'));
});

test('album: three separate media_group updates assemble into ONE ordered article', async (t) => {
  const { base, server, repoDir } = await startBackend(t);
  // caption rides the first message; arrival order of the rest is shuffled on purpose
  await hook(base, albumUpdate(201, 'a1', true));
  await hook(base, albumUpdate(203, 'a3', false));
  await hook(base, albumUpdate(202, 'a2', false));
  await waitFor(() => {
    const rows = postsInDb(server);
    return rows.length === 1 && JSON.parse(rows[0].media_json).length === 3;
  });
  const row = postsInDb(server)[0];
  const media = JSON.parse(row.media_json);
  assert.deepEqual(media.map((m) => m.uid), ['u-a1', 'u-a2', 'u-a3'], 'ordered by message id');
  assert.equal(row.slug, slugify('Фотоотчёт с форума'));
  const md = readPost(repoDir, row.slug);
  assert.equal((md.match(/<figure>/g) || []).length, 3);
  assert.match(md, /hero: "\/images\/telegram\/[a-z0-9-]+\/u-a1\.jpg"/);
  assert.match(md, /Три кадра с площадки/);
});

test('duplicate webhook delivery is idempotent — one article, unchanged file', async (t) => {
  const { base, server, repoDir } = await startBackend(t);
  await hook(base, textPost());
  await waitFor(() => postsInDb(server).length === 1);
  const before = readPost(repoDir, 'novosti-nedeli');
  await hook(base, textPost()); // Telegram retry of the very same update
  await hook(base, textPost());
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(postsInDb(server).length, 1);
  assert.equal(readPost(repoDir, 'novosti-nedeli'), before);
});

test('edited_channel_post updates the article but never the slug', async (t) => {
  const { base, server, repoDir } = await startBackend(t);
  await hook(base, textPost());
  await waitFor(() => postsInDb(server).length === 1);
  const edit = {
    update_id: 50,
    edited_channel_post: {
      message_id: 101,
      chat: CHAT,
      date: 1_760_000_000,
      edit_date: 1_760_100_000,
      text: 'Новости недели\n\nПлан зала утверждён — регистрация экспонентов открыта. #blog',
    },
  };
  await hook(base, edit);
  await waitFor(() => postsInDb(server)[0]?.edited_at != null);
  const row = postsInDb(server)[0];
  assert.equal(row.slug, 'novosti-nedeli', 'slug is stable across edits');
  const md = readPost(repoDir, 'novosti-nedeli');
  assert.match(md, /План зала утверждён/);
  assert.match(md, /updated: 2025-10-1/);
  assert.ok(!md.includes('утвердил план зала. Подробности'));
});

test('BLOG_SYNC_MODE=draft keeps the post unpublished until an admin publishes it', async (t) => {
  const { base, server, repoDir } = await startBackend(t, { mode: 'draft' });
  await hook(base, textPost());
  await waitFor(() => postsInDb(server).length === 1);
  const row = postsInDb(server)[0];
  assert.equal(row.status, 'draft');
  assert.match(readPost(repoDir, 'novosti-nedeli'), /draft: true/);
  // admin publishes via the API
  const login = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  }).then((r) => r.json().then((data) => ({ r, data })));
  const cookie = login.r.headers.get('set-cookie').split(';')[0];
  const csrf = login.data.csrfToken;
  const publish = await fetch(`${base}/api/admin/blog-posts/${row.id}/publish`, {
    method: 'POST',
    headers: { cookie, 'X-CSRF-Token': csrf },
  });
  assert.equal(publish.status, 200);
  await waitFor(() => postsInDb(server)[0].status === 'published');
  const md = readPost(repoDir, 'novosti-nedeli');
  assert.ok(!md.includes('draft: true'));
});

test('BLOG_SYNC_HASHTAG filters untagged posts out', async (t) => {
  const { base, server } = await startBackend(t, { hashtag: 'blog' });
  await hook(base, textPost({ text: 'Просто заметка\n\nБез нужной метки #другое' }));
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(postsInDb(server).length, 0);
  await hook(base, textPost()); // contains #blog
  await waitFor(() => postsInDb(server).length === 1);
});

test('admin API: list, unpublish, delete (csrf + permissions enforced)', async (t) => {
  const { base, server, repoDir } = await startBackend(t);
  await hook(base, photoPost());
  await waitFor(() => postsInDb(server).length === 1);
  const row = postsInDb(server)[0];

  const loginReq = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const loginData = await loginReq.json();
  const cookie = loginReq.headers.get('set-cookie').split(';')[0];
  const csrf = loginData.csrfToken;

  // list
  const list = await fetch(`${base}/api/admin/blog-posts`, { headers: { cookie } }).then((r) => r.json());
  assert.equal(list.total, 1);
  assert.equal(list.items[0].slug, 'plan-zala');
  assert.equal(list.sync.channel, '@testchan');

  // mutation without CSRF → 403
  const noCsrf = await fetch(`${base}/api/admin/blog-posts/${row.id}/unpublish`, { method: 'POST', headers: { cookie } });
  assert.equal(noCsrf.status, 403);

  // unpublish with CSRF
  const unpublish = await fetch(`${base}/api/admin/blog-posts/${row.id}/unpublish`, {
    method: 'POST', headers: { cookie, 'X-CSRF-Token': csrf },
  });
  assert.equal(unpublish.status, 200);
  await waitFor(() => postsInDb(server)[0].status === 'unpublished');
  assert.match(readPost(repoDir, 'plan-zala'), /draft: true/);

  // delete: admin-only; files and media are removed, row tombstoned
  const del = await fetch(`${base}/api/admin/blog-posts/${row.id}`, {
    method: 'DELETE', headers: { cookie, 'X-CSRF-Token': csrf },
  });
  assert.equal(del.status, 200);
  await waitFor(() => postsInDb(server).length === 0);
  assert.ok(!existsSync(join(repoDir, 'src', 'content', 'news', 'ru', 'plan-zala.md')));
  assert.ok(!existsSync(join(repoDir, 'public', 'images', 'telegram', 'plan-zala')));
  const tombstone = server.backendStore.db.prepare('SELECT status FROM tg_blog_posts WHERE id = ?').get(row.id);
  assert.equal(tombstone.status, 'deleted');

  // an edit of the deleted message must NOT resurrect the article
  await hook(base, {
    update_id: 60,
    edited_channel_post: { message_id: 102, chat: CHAT, date: 1_760_000_100, edit_date: 1_760_200_000, caption: 'Попытка воскрешения' },
  });
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(postsInDb(server).length, 0);
  // unauthenticated access is rejected
  const anon = await fetch(`${base}/api/admin/blog-posts`);
  assert.equal(anon.status, 401);
});

test('git publisher: commit + push + deploy hooks (faked runner)', async () => {
  const { GitPublisher } = await import('../scripts/backend/tgblog/publish.mjs');
  const calls = [];
  const hooks = [];
  const publisher = new GitPublisher({
    repoDir: '/tmp/repo',
    debounceMs: 5,
    pushEnabled: true,
    deployHooks: ['https://api.cloudflare.com/hook/1'],
    gitRunner: async (cmd, args) => {
      calls.push(`${cmd} ${args.join(' ')}`);
      return { stdout: args.includes('status') ? ' M src/content/news/ru/x.md' : '', stderr: '' };
    },
    fetchImpl: async (url) => { hooks.push(String(url)); return { status: 200 }; },
    logger: { info() {}, error(msg) { throw new Error(`unexpected: ${msg}`); } },
  });
  publisher.schedule('post x');
  await publisher.flush();
  assert.ok(calls.some((c) => c.includes('git -C /tmp/repo add -- src/content')));
  assert.ok(calls.some((c) => c.includes('commit -m chore(content): telegram sync — post x [tg-sync]')));
  assert.ok(calls.some((c) => c.includes('pull --rebase origin main')));
  assert.ok(calls.some((c) => c.includes('push origin HEAD:main')));
  assert.deepEqual(hooks, ['https://api.cloudflare.com/hook/1']);
  await publisher.stop();
});

test('git publisher: clean tree → no commit; push disabled → local commit only', async () => {
  const { GitPublisher } = await import('../scripts/backend/tgblog/publish.mjs');
  const calls = [];
  const publisher = new GitPublisher({
    repoDir: '/tmp/repo',
    debounceMs: 5,
    pushEnabled: false,
    gitRunner: async (cmd, args) => { calls.push(args.join(' ')); return { stdout: '', stderr: '' }; },
    logger: { info() {}, error(msg) { throw new Error(`unexpected: ${msg}`); } },
  });
  await publisher.flush();
  assert.ok(calls.some((c) => c.includes('add -- src/content')));
  assert.ok(!calls.some((c) => c.includes('commit -m')), 'empty porcelain → nothing to commit');
  assert.ok(!calls.some((c) => c.includes('push origin')));
  await publisher.stop();
});
