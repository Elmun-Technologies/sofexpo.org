/**
 * SQLite state for the Telegram → blog sync (the canonical truth; markdown in the repo
 * is a materialized projection of these rows).
 *
 * Idempotency model:
 *  - `tg_blog_messages` PRIMARY KEY (chat_id, message_id) — a Telegram update delivered
 *    twice is the same message; processing is an upsert, never a duplicate article.
 *  - one `tg_blog_posts` row per article; single posts and albums share the table
 *    (albums anchor to the first message id seen, media merges by media_group_id).
 */

const nowIso = () => new Date().toISOString();
const parseJson = (value, fallback) => {
  try { return JSON.parse(value); } catch { return fallback; }
};

function transaction(db, work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// 'deleted' is a tombstone: files are gone, but the row (and its message map)
// stays so Telegram retries/edits can never resurrect an admin-deleted article.
const STATUSES = ['draft', 'published', 'unpublished', 'deleted'];

const rowToPost = (row) => row && ({
  id: row.id,
  chatId: row.chat_id,
  anchorMessageId: row.anchor_message_id,
  mediaGroupId: row.media_group_id,
  captionMessageId: row.caption_message_id,
  slug: row.slug,
  collection: row.collection,
  locale: row.locale,
  title: row.title,
  excerpt: row.excerpt,
  bodyHtml: row.body_html,
  tags: parseJson(row.tags_json, []),
  media: parseJson(row.media_json, []),
  coverPath: row.cover_path,
  tgLink: row.tg_link,
  postedAt: row.posted_at,
  editedAt: row.edited_at,
  status: row.status,
  source: row.source,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class TgBlogStore {
  /** @param {import('node:sqlite').DatabaseSync} db — shared connection (BackendStore.db) */
  constructor(db) {
    this.db = db;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tg_blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        anchor_message_id INTEGER NOT NULL,
        media_group_id TEXT,
        caption_message_id INTEGER,
        slug TEXT NOT NULL,
        collection TEXT NOT NULL DEFAULT 'news',
        locale TEXT NOT NULL DEFAULT 'ru',
        title TEXT NOT NULL DEFAULT '',
        excerpt TEXT NOT NULL DEFAULT '',
        body_html TEXT NOT NULL DEFAULT '',
        tags_json TEXT NOT NULL DEFAULT '[]',
        media_json TEXT NOT NULL DEFAULT '[]',
        cover_path TEXT,
        tg_link TEXT NOT NULL DEFAULT '',
        posted_at TEXT,
        edited_at TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished', 'deleted')),
        source TEXT NOT NULL DEFAULT 'webhook',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS tg_blog_posts_slug_idx ON tg_blog_posts(collection, locale, slug);
      CREATE INDEX IF NOT EXISTS tg_blog_posts_group_idx ON tg_blog_posts(chat_id, media_group_id);
      CREATE TABLE IF NOT EXISTS tg_blog_messages (
        chat_id TEXT NOT NULL,
        message_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL REFERENCES tg_blog_posts(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        PRIMARY KEY (chat_id, message_id)
      );
    `);
  }

  getPostByMessage(chatId, messageId) {
    const row = this.db.prepare(
      `SELECT p.* FROM tg_blog_posts p
       JOIN tg_blog_messages m ON m.post_id = p.id
       WHERE m.chat_id = ? AND m.message_id = ?`,
    ).get(String(chatId), Number(messageId));
    return rowToPost(row);
  }

  getPostByGroup(chatId, mediaGroupId) {
    if (!mediaGroupId) return null;
    const row = this.db.prepare(
      `SELECT * FROM tg_blog_posts WHERE chat_id = ? AND media_group_id = ? ORDER BY id ASC LIMIT 1`,
    ).get(String(chatId), String(mediaGroupId));
    return rowToPost(row);
  }

  getPostById(id) {
    return rowToPost(this.db.prepare('SELECT * FROM tg_blog_posts WHERE id = ?').get(Number(id)));
  }

  hasMessage(chatId, messageId) {
    return Boolean(this.db.prepare('SELECT 1 FROM tg_blog_messages WHERE chat_id = ? AND message_id = ?').get(String(chatId), Number(messageId)));
  }

  /** Slugs already taken in a collection/locale (DB + caller merges fs slugs). */
  slugsIn(collection, locale) {
    return new Set(this.db.prepare('SELECT slug FROM tg_blog_posts WHERE collection = ? AND locale = ?').all(collection, locale).map((r) => r.slug.toLowerCase()));
  }

  /**
   * Create the post row and (optionally) record the first message in one transaction.
   * On slug collision the caller must uniquify first; a race surfaces as an error and
   * the webhook is free to retry.
   */
  createPost(fields, message) {
    const now = nowIso();
    return transaction(this.db, () => {
      const info = this.db.prepare(`
        INSERT INTO tg_blog_posts (chat_id, anchor_message_id, media_group_id, caption_message_id, slug, collection, locale,
          title, excerpt, body_html, tags_json, media_json, cover_path, tg_link, posted_at, edited_at, status, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        String(fields.chatId), Number(message?.messageId ?? fields.anchorMessageId), fields.mediaGroupId ?? null,
        fields.captionMessageId ?? null, fields.slug, fields.collection ?? 'news', fields.locale ?? 'ru',
        fields.title ?? '', fields.excerpt ?? '', fields.bodyHtml ?? '', JSON.stringify(fields.tags ?? []),
        JSON.stringify(fields.media ?? []), fields.coverPath ?? null, fields.tgLink ?? '',
        fields.postedAt ?? null, fields.editedAt ?? null, STATUSES.includes(fields.status) ? fields.status : 'draft',
        String(fields.source ?? 'webhook').slice(0, 20), now, now,
      );
      const id = Number(info.lastInsertRowid);
      if (message) this.recordMessage(id, message, now);
      return this.getPostById(id);
    });
  }

  /** Idempotent by (chat_id, message_id) PK — re-record is a no-op update of post link. */
  recordMessage(postId, { chatId, messageId }, at = nowIso()) {
    this.db.prepare(`
      INSERT INTO tg_blog_messages (chat_id, message_id, post_id, created_at) VALUES (?, ?, ?, ?)
      ON CONFLICT (chat_id, message_id) DO UPDATE SET post_id = excluded.post_id`).run(
      String(chatId), Number(messageId), Number(postId), at,
    );
  }

  updatePost(id, patch) {
    const current = this.getPostById(id);
    if (!current) return null;
    const merged = { ...current, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) };
    this.db.prepare(`
      UPDATE tg_blog_posts SET media_group_id = ?, caption_message_id = ?, title = ?, excerpt = ?, body_html = ?,
        tags_json = ?, media_json = ?, cover_path = ?, tg_link = ?, posted_at = ?, edited_at = ?, updated_at = ?
      WHERE id = ?`).run(
      merged.mediaGroupId ?? null, merged.captionMessageId ?? null, merged.title, merged.excerpt, merged.bodyHtml,
      JSON.stringify(merged.tags ?? []), JSON.stringify(merged.media ?? []), merged.coverPath ?? null,
      merged.tgLink ?? '', merged.postedAt ?? null, merged.editedAt ?? null, nowIso(), Number(id),
    );
    return this.getPostById(id);
  }

  /**
   * Merge one message's media into a post: dedupe by file unique id, keep stable order
   * (message id, then index inside the message). Works for album updates arriving one
   * message at a time, in any delivery order — no waiting needed.
   */
  mergeMedia(postId, items) {
    const post = this.getPostById(postId);
    if (!post || !items?.length) return post;
    const byUid = new Map(post.media.filter((m) => m.uid).map((m) => [m.uid, m]));
    const next = post.media.filter((m) => !m.uid || !items.some((i) => i.uid === m.uid));
    for (const item of items) {
      if (!item || (item.uid && byUid.has(item.uid))) continue;
      next.push(item);
      if (item.uid) byUid.set(item.uid, item);
    }
    next.sort((a, b) => (a.msgId ?? 0) - (b.msgId ?? 0) || (a.idx ?? 0) - (b.idx ?? 0));
    return this.updatePost(postId, { media: next });
  }

  setStatus(id, status) {
    if (!STATUSES.includes(status)) throw new Error(`tg_blog: noto‘g‘ri holat: ${status}`);
    this.db.prepare('UPDATE tg_blog_posts SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso(), Number(id));
    return this.getPostById(id);
  }

  deletePost(id) {
    return transaction(this.db, () => {
      const post = this.getPostById(id);
      if (!post) return null;
      this.db.prepare('DELETE FROM tg_blog_posts WHERE id = ?').run(Number(id));
      return post; // ON DELETE CASCADE removes tg_blog_messages
    });
  }

  listPosts({ page = 1, limit = 25, status = '' } = {}) {
    const cap = Math.min(100, Math.max(1, Math.trunc(limit) || 25));
    const current = Math.max(1, Math.trunc(page) || 1);
    const filtered = STATUSES.includes(status);
    const where = filtered ? 'WHERE status = ?' : "WHERE status != 'deleted'";
    const countRow = filtered
      ? this.db.prepare('SELECT COUNT(*) AS c FROM tg_blog_posts WHERE status = ?').get(status)
      : this.db.prepare("SELECT COUNT(*) AS c FROM tg_blog_posts WHERE status != 'deleted'").get();
    const query = `
      SELECT * FROM tg_blog_posts ${where}
      ORDER BY COALESCE(posted_at, created_at) DESC, id DESC LIMIT ? OFFSET ?`;
    const items = (filtered
      ? this.db.prepare(query).all(status, cap, (current - 1) * cap)
      : this.db.prepare(query).all(cap, (current - 1) * cap)).map(rowToPost);
    const total = Number(countRow?.c ?? 0);
    return { items, total, page: current, pages: Math.max(1, Math.ceil(total / cap)) };
  }

  /** Find a post by its public Telegram link (t.me/<username>/<messageId>). */
  findByTelegramLink(chatId, messageId, username) {
    const suffix = `/${Number(messageId)}`;
    const rows = this.db.prepare(
      `SELECT * FROM tg_blog_posts WHERE chat_id = ? AND tg_link LIKE ?`,
    ).all(String(chatId), `%${suffix}`);
    const match = rows.find((r) => !username || r.tg_link.includes(`t.me/${username}/`));
    return rowToPost(match);
  }
}
