#!/usr/bin/env node
/**
 * One-off import of channel history from the public mirror https://t.me/s/<username>
 * into the Telegram → blog sync pipeline (docs/telegram-blog-sync.md §7).
 *
 *   node --env-file-if-exists=.env scripts/telegram-backfill.mjs --dry-run
 *   node --env-file-if-exists=.env scripts/telegram-backfill.mjs --limit 40
 *
 * Flags: --username <name>   (default TELEGRAM_CHANNEL_USERNAME)
 *        --limit <n>         max messages to import (default 50)
 *        --db <path>         SQLite file (default LEAD_WEBHOOK_DB or .data/sofexpo.sqlite)
 *        --repo <dir>        repo checkout for markdown/media (default cwd)
 *        --dry-run           parse + report only: no DB, no downloads, no files
 *        --push              after import, commit & push (same env as the webhook flow)
 *
 * Idempotent: (chat_id, message_id) is the pipeline's primary key — a re-run skips
 * messages already imported. IMPORTANT: run this where the PRODUCTION SQLite lives, so
 * later edit-webhooks dedupe against the same DB (docs §7).
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse as parseDocument, serialize as serializeFragment } from 'parse5';
import { loadTgBlogConfig } from './backend/tgblog/config.mjs';
import { TgBlogStore } from './backend/tgblog/store.mjs';
import { TgBlogSync } from './backend/tgblog/sync.mjs';
import { GitPublisher } from './backend/tgblog/publish.mjs';
import { TelegramClient } from './backend/tgblog/telegram.mjs';
import { htmlToEntities } from './backend/tgblog/html.mjs';

const args = process.argv.slice(2);
const flagValue = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const hasFlag = (name) => args.includes(`--${name}`);

const DRY_RUN = hasFlag('dry-run');
const LIMIT = Math.max(1, Number(flagValue('limit')) || 50);
const config = loadTgBlogConfig({ enabled: '1', gitPush: hasFlag('push') ? '1' : '0' });
const username = (flagValue('username') || config.channelUsername || '').replace(/^@/, '');

const textOrMedia = (m) => Boolean((m.text && m.text.trim()) || m.media.length);

/* ---------------- t.me/s mirror parsing ---------------- */

const mirrorUrl = (before) =>
  `https://t.me/s/${encodeURIComponent(username)}${before ? `?before=${before}` : ''}`;

const attrOf = (node, name) => (node.attrs || []).find((a) => a.name === name)?.value || '';
const hasClass = (node, klass) => (attrOf(node, 'class') || '').split(/\s+/).includes(klass);

function findAll(root, predicate, out = []) {
  if (predicate(root)) out.push(root);
  for (const child of root.childNodes || []) findAll(child, predicate, out);
  return out;
}

const innerHtml = (node) => serializeFragment({ nodeName: '#document-fragment', childNodes: node.childNodes || [] });

/** One tgme_widget_message container → ingest model (photos + text, album aware). */
function widgetToModel(widget, chatId) {
  const dataPost = attrOf(widget, 'data-post'); // "<username>/<messageId>"
  const messageId = Number(dataPost.split('/')[1]);
  if (!messageId) return null;
  const time = findAll(widget, (n) => n.tagName === 'time' && attrOf(n, 'datetime'))[0];
  const textNode = findAll(widget, (n) => hasClass(n, 'tgme_widget_message_text'))[0];
  const { text, entities } = textNode ? htmlToEntities(innerHtml(textNode)) : { text: '', entities: [] };
  const media = [];
  const relatedIds = [messageId];
  findAll(widget, (n) => hasClass(n, 'tgme_widget_message_photo_wrap')).forEach((wrap, idx) => {
    const url = attrOf(wrap, 'style').match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/)?.[2];
    if (!url?.startsWith('https://')) return;
    const ownId = Number(attrOf(wrap, 'href').match(/^\/[^/]+\/(\d+)/)?.[1]) || 0; // "/<user>/<photoMsgId>?single"
    if (ownId && ownId !== messageId) relatedIds.push(ownId);
    media.push({
      kind: 'photo',
      url,
      uid: ownId && ownId !== messageId ? `bf-${ownId}` : `bf-${messageId}-${idx}`,
      ext: url.match(/\.(jpe?g|png|webp|gif)(\?|&|$)/i)?.[1].toLowerCase().replace('jpeg', 'jpg').replace(/^/, '.') || '.jpg',
    });
  });
  return {
    chatId,
    messageId,
    mediaGroupId: null, // the real group id is not recoverable from the mirror; anchor id dedupes
    date: time ? Math.trunc(Date.parse(attrOf(time, 'datetime')) / 1000) : Math.trunc(Date.now() / 1000),
    editDate: 0,
    text,
    entities,
    media,
    relatedIds,
  };
}

/** Read mirror pages newest→oldest (?before=<minId>) until the limit or history ends. */
async function fetchMirrorModels(chatId) {
  const out = [];
  let before = 0;
  while (out.length < LIMIT) {
    const response = await fetch(mirrorUrl(before), { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`t.me/s yuklanmadi: HTTP ${response.status}`);
    const doc = parseDocument(await response.text());
    const models = findAll(doc, (n) => hasClass(n, 'tgme_widget_message') && attrOf(n, 'data-post'))
      .map((w) => widgetToModel(w, chatId))
      .filter(Boolean)
      .filter(textOrMedia);
    if (!models.length) return out;
    const minId = Math.min(...models.map((m) => m.messageId));
    out.push(...models);
    if ((before && minId >= before) || minId <= 1) return out; // no older history
    before = minId;
    if (models.length < 20) return out; // mirror pages hold ~20 posts; short page = the end
  }
  return out;
}

/* ---------------- main ---------------- */

async function main() {
  if (!username) {
    console.error('Kanal username kerak: --username sofexpo yoki TELEGRAM_CHANNEL_USERNAME.');
    process.exit(2);
  }
  if (flagValue('repo')) config.repoDir = flagValue('repo');
  console.log(`kanal: @${username} | limit ${LIMIT} | ${DRY_RUN ? 'DRY-RUN (hech narsa yozilmaydi)' : 'import'}`);

  let chatId = config.channelId || '';
  if (!chatId && config.token) {
    try {
      const chat = await new TelegramClient(config.token).getChat(username);
      chatId = String(chat.id);
      console.log(`getChat: real channel id = ${chatId}`);
    } catch (error) {
      console.warn(`getChat ishlamadi (${error.message}) — sintetik id ishlatiladi`);
    }
  }
  if (!chatId) chatId = `user:${username}`;
  if (chatId.startsWith('user:')) {
    console.warn('DIQQAT: real channel id yo‘q — bu lokal sinov uchun. Prod importdan oldin TELEGRAM_CHANNEL_ID to‘ldiring (docs §3).');
  }

  const dbPath = flagValue('db') || process.env.LEAD_WEBHOOK_DB || '.data/sofexpo.sqlite';
  let sync = null;
  if (!DRY_RUN) {
    mkdirSync(dirname(dbPath), { recursive: true });
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
    const store = new TgBlogStore(db);
    const publisher = config.gitPush
      ? new GitPublisher({ repoDir: config.repoDir, remote: config.gitRemote, branch: config.gitBranch, debounceMs: 100, pushEnabled: true })
      : { schedule() {} };
    sync = new TgBlogSync({ config, store, telegram: new TelegramClient(config.token || 'backfill-unused-token'), publisher });
  }

  const collected = (await fetchMirrorModels(chatId)).slice(0, LIMIT);
  collected.sort((a, b) => a.messageId - b.messageId); // oldest first, like live delivery
  console.log(`mirror'dan ${collected.length} ta xabar o'qindi`);

  let imported = 0;
  let skipped = 0;
  for (const model of collected) {
    if (DRY_RUN) {
      const title = (model.text || '').split('\n')[0].replace(/<[^>]+>/g, '').slice(0, 60) || '(matnsiz)';
      console.log(`  #${model.messageId} ${new Date(model.date * 1000).toISOString().slice(0, 10)} «${title}» · media: ${model.media.length}`);
      continue;
    }
    if (sync.store.hasMessage(model.chatId, model.messageId)) { skipped += 1; continue; }
    if (config.hashtag && !new RegExp(`#${config.hashtag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'iu').test(model.text || '')) { skipped += 1; continue; }
    const result = await sync.ingestMessage(model, { edited: false, source: 'backfill' });
    if (result.ok && !result.deduped) {
      imported += 1;
      for (const id of model.relatedIds || []) sync.store.recordMessage(result.post.id, { chatId: model.chatId, messageId: id });
      console.log(`  + #${model.messageId} → ${result.slug}`);
    } else if (result.deduped) {
      skipped += 1;
    } else {
      console.warn(`  ! #${model.messageId}: ${result.error || result.ignored || 'noma’lum'}`);
    }
  }
  console.log(`tayyor: ${imported} import, ${skipped} o‘tkazib yuborildi${DRY_RUN ? ' (dry-run)' : ''}`);
  if (!DRY_RUN && imported && !config.gitPush) {
    console.log('eslatma: fayllar repo’da — tekshirib, o‘zingiz commit/push qiling (yoki --push bilan qayta ishga tushiring).');
  }
  if (sync?.publisher?.flush) await sync.publisher.flush();
}

main().catch((error) => {
  console.error(`Xato: ${error?.message || error}`);
  process.exit(1);
});
