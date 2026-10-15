/**
 * The Telegram → blog sync pipeline. One instance per backend process; the webhook
 * route and the backfill script both feed it, so formatting/media/store behavior is
 * identical for live posts and imported history.
 *
 * Flow per message: channel check → hashtag gate → title/body/tags extraction
 * (plain-text ops, then entities→HTML) → store upsert (idempotent by chat+message;
 * albums merge by media_group, no waiting) → media download → markdown materialize →
 * debounced git publish.
 */
import { TelegramClient, largestPhoto, fileExt, TelegramApiError } from './telegram.mjs';
import { cleanInput, splitTitle, findHashtags, makeExcerpt, readingMinutes } from './text.mjs';
import { entitiesToHtml, removeRanges } from './html.mjs';
import { slugify, uniqueSlug } from './slug.mjs';
import {
  renderMarkdown, writePostFile, writeMediaFile, mediaExists, removePostFiles,
  slugsOnDisk, findSlugByTelegramLink, mediaPublicPath,
} from './materialize.mjs';

const DEFAULT_MAX_URL_BYTES = 26 * 1024 * 1024; // backfill CDN fetches

const STRINGS = {
  ru: { untitled: (id) => `Пост #${id}` },
  en: { untitled: (id) => `Post #${id}` },
};

/** Text + entities → { title, bodyHtml, bodyText, tags } (title line & hashtags removed). */
export function preparePostContent(rawText, rawEntities) {
  const text = cleanInput(rawText);
  const entities = Array.isArray(rawEntities) ? rawEntities : [];
  const { title, titleRange } = splitTitle(text);
  let prepared = titleRange ? removeRanges(text, entities, [titleRange]) : { text, entities: entities.slice() };
  const { tags, ranges } = findHashtags(prepared.text);
  if (ranges.length) prepared = removeRanges(prepared.text, prepared.entities, ranges);
  return {
    title,
    bodyHtml: entitiesToHtml(prepared.text, prepared.entities).trim(),
    bodyText: prepared.text.replace(/\s+/g, ' ').trim(),
    tags: tags.map((tag) => tag.toLowerCase()).slice(0, 12),
  };
}

/** Normalize a channel_post / edited_channel_post payload into an internal model. */
export function modelFromUpdate(post) {
  const photo = largestPhoto(post.photo);
  const media = [];
  if (photo) media.push({ kind: 'photo', fileId: photo.file_id, uid: photo.file_unique_id, w: photo.width, h: photo.height, fileSize: photo.file_size });
  for (const [key, kind] of [['video', 'video'], ['document', 'document'], ['video_note', 'video'], ['audio', 'audio'], ['animation', 'video']]) {
    const item = post[key];
    if (item?.file_id) media.push({ kind, fileId: item.file_id, uid: item.file_unique_id, w: item.width, h: item.height, fileSize: item.file_size, mime: item.mime_type, name: item.file_name });
  }
  return {
    chatId: post.chat?.id != null ? String(post.chat.id) : '',
    messageId: Number(post.message_id),
    mediaGroupId: post.media_group_id ? String(post.media_group_id) : null,
    date: Number(post.date) || Math.trunc(Date.now() / 1000),
    editDate: Number(post.edit_date) || 0,
    text: post.text ?? post.caption ?? '',
    entities: post.entities ?? post.caption_entities ?? [],
    media,
  };
}

export class TgBlogSync {
  /**
   * @param {object} deps { config, store, telegram?, publisher, logger }
   *  - config: output of loadTgBlogConfig
   *  - store: TgBlogStore
   *  - telegram: TelegramClient (or a test double with getFile/download/resolveUrl)
   *  - publisher: { schedule(reason) } — GitPublisher or a no-op stub
   */
  constructor({ config, store, telegram, publisher, logger = console } = {}) {
    this.config = config;
    this.store = store;
    this.telegram = telegram ?? new TelegramClient(config.token, { fetchImpl: config.apiFetch ?? undefined });
    this.publisher = publisher ?? { schedule() {} };
    this.logger = logger;
    // In-process mutex: album parts can arrive concurrently; upserts must be serial
    // (otherwise two messages of one media group could both "not find" the post and
    // race the unique slug index). The webhook already returned 200 by then, so
    // queueing here is free.
    this.mutex = Promise.resolve();
  }

  enqueue(work) {
    const job = this.mutex.then(work).catch((error) => {
      this.log('error', `background job failed: ${error?.message || error}`);
      return { ok: false, error: String(error?.message || error) };
    });
    this.mutex = job;
    return job;
  }

  log(level, message, meta = {}) {
    const suffix = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    (this.logger[level] ?? this.logger.info ?? (() => {})).call(this.logger, `[tg-blog] ${message}${suffix}`);
  }

  tgLink(messageId) {
    return this.config.channelUsername ? `https://t.me/${this.config.channelUsername}/${messageId}` : '';
  }

  /** Entry point for the webhook route. Never throws — errors are logged + swallowed. */
  async ingestUpdate(update) {
    const isEdit = Boolean(update?.edited_channel_post);
    const post = update?.channel_post ?? update?.edited_channel_post;
    if (!post) return { ok: true, ignored: 'unsupported-update' };
    const model = modelFromUpdate(post);
    if (!model.chatId || model.chatId !== String(this.config.channelId)) {
      this.log('info', 'update from a foreign channel ignored', { chatId: model.chatId || 'unknown' });
      return { ok: true, ignored: 'foreign-channel' };
    }
    if (!Number.isInteger(model.messageId)) return { ok: true, ignored: 'no-message-id' };
    return this.ingestMessage(model, { edited: isEdit, source: isEdit ? 'edit' : 'webhook' });
  }

  /** Core: one channel message (or edit) → article upsert. Shared by webhook+backfill. */
  async ingestMessage(model, { edited = false, source = 'webhook' } = {}) {
    return this.enqueue(async () => {
      try {
        return await this._ingest(model, { edited, source });
      } catch (error) {
        this.log('error', `ingest failed: ${error?.message || error}`, { messageId: model.messageId, source });
        return { ok: false, error: String(error?.message || error) };
      }
    });
  }

  async _ingest(model, { edited, source }) {
    const cfg = this.config;
    const hasHashtagGate = Boolean(cfg.hashtag);
    const gateRe = hasHashtagGate ? new RegExp(`#${cfg.hashtag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'iu') : null;

    let post = this.store.getPostByMessage(model.chatId, model.messageId)
      ?? this.store.getPostByGroup(model.chatId, model.mediaGroupId);

    if (post?.status === 'deleted') {
      this.log('info', 'message targets an admin-deleted post — not resurrecting', { slug: post.slug });
      this.store.recordMessage(post.id, model); // keep dedupe for future deliveries
      return { ok: true, ignored: 'deleted-tombstone', slug: post.slug };
    }

    // Redelivery of an already-processed message (Telegram retry) — no state change,
    // and an outdated payload must never overwrite a newer edit.
    const byMessage = this.store.getPostByMessage(model.chatId, model.messageId);
    if (byMessage && !edited && source === 'webhook') {
      return { ok: true, deduped: true, slug: byMessage.slug };
    }
    if (byMessage && edited && model.editDate && byMessage.editedAt && model.editDate * 1000 <= Date.parse(byMessage.editedAt)) {
      return { ok: true, deduped: true, stale: true, slug: byMessage.slug };
    }

    // Hashtag gate (only sync posts that carry BLOG_SYNC_HASHTAG when configured).
    if (gateRe) {
      const matched = gateRe.test(model.text || '');
      if (!matched) {
        if (!post) return { ok: true, ignored: 'hashtag-filter' };
        this.log('info', 'edited message lost the sync hashtag — keeping the article as-is', { slug: post.slug });
        this.store.recordMessage(post.id, model);
        return { ok: true, ignored: 'hashtag-filter-kept', slug: post.slug };
      }
    }

    const hasText = Boolean((model.text || '').trim());
    const decidesCaption = !model.mediaGroupId
      || !post?.captionMessageId
      || (hasText && (!post || model.messageId <= (post.captionMessageId ?? Infinity)));

    let title = post?.title ?? '';
    let bodyHtml = post?.bodyHtml ?? '';
    let bodyText = '';
    let tags = post?.tags ?? [];
    if (hasText && decidesCaption) {
      const prepared = preparePostContent(model.text, model.entities);
      title = prepared.title;
      bodyHtml = prepared.bodyHtml;
      bodyText = prepared.bodyText;
      tags = prepared.tags;
    } else if (post) {
      bodyText = post.excerpt;
    }

    const strings = STRINGS[cfg.locale] ?? STRINGS.en;

    const writeText = hasText && decidesCaption; // did this message update the article text?
    const excerpt = writeText ? (makeExcerpt(bodyText) || title) : post?.excerpt ?? '';

    // --- resolve route: create / update; on unknown edits first try orphan adoption ---
    if (!post) {
      if (edited) {
        const adoptedSlug = findSlugByTelegramLink(cfg.repoDir, {
          collection: cfg.collection, locale: cfg.locale,
          username: cfg.channelUsername, messageId: model.messageId,
        });
        if (adoptedSlug) {
          post = this.store.createPost({
            chatId: model.chatId, mediaGroupId: model.mediaGroupId,
            captionMessageId: hasText ? model.messageId : null,
            slug: adoptedSlug, collection: cfg.collection, locale: cfg.locale,
            title: title || strings.untitled(model.messageId),
            bodyHtml: writeText ? bodyHtml : '',
            tags: writeText ? tags : [],
            excerpt,
            tgLink: this.tgLink(model.messageId),
            status: cfg.mode === 'auto' ? 'published' : 'draft', source: 'adopted',
            postedAt: new Date(model.date * 1000).toISOString(),
          }, model);
          this.log('info', 'adopted a backfilled article for an incoming edit', { slug: adoptedSlug });
        }
      }
      if (!post) {
        const taken = this.store.slugsIn(cfg.collection, cfg.locale);
        for (const onDisk of slugsOnDisk(cfg.repoDir, cfg.collection, cfg.locale)) taken.add(onDisk);
        const slug = uniqueSlug(title ? slugify(title) : `post-${model.messageId}`, taken);
        post = this.store.createPost({
          chatId: model.chatId,
          mediaGroupId: model.mediaGroupId,
          captionMessageId: hasText ? model.messageId : null,
          slug, collection: cfg.collection, locale: cfg.locale,
          title: title || strings.untitled(model.messageId),
          bodyHtml: writeText ? bodyHtml : '',
          tags: writeText ? tags : [],
          excerpt,
          tgLink: this.tgLink(model.messageId),
          status: cfg.mode === 'auto' ? 'published' : 'draft',
          source,
          postedAt: new Date(model.date * 1000).toISOString(),
          editedAt: edited && model.editDate ? new Date(model.editDate * 1000).toISOString() : null,
        }, model);
        this.log('info', 'article created', { slug, status: post.status });
      }
    } else {
      // existing post (album merge, or edit of the anchor/caption message)
      const patch = {};
      if (writeText) {
        patch.title = title || strings.untitled(post.anchorMessageId);
        patch.bodyHtml = bodyHtml;
        patch.tags = tags;
        patch.excerpt = excerpt;
        if (hasText && (post.captionMessageId == null || model.messageId <= post.captionMessageId)) {
          patch.captionMessageId = model.messageId;
        }
      }
      if (edited) patch.editedAt = new Date((model.editDate || Math.trunc(Date.now() / 1000)) * 1000).toISOString();
      if (!post.postedAt) patch.postedAt = new Date(model.date * 1000).toISOString();
      if (!post.tgLink && cfg.channelUsername) patch.tgLink = this.tgLink(post.anchorMessageId);
      post = this.store.updatePost(post.id, patch);
      this.store.recordMessage(post.id, model);
    }

    // --- media (idempotent per file_unique_id; skip re-download when file exists) ---
    const downloaded = [];
    for (const [idx, item] of model.media.entries()) {
      const entry = await this.resolveMedia(post, item, { msgId: model.messageId, idx });
      if (entry) downloaded.push(entry);
    }
    if (downloaded.length) post = this.store.mergeMedia(post.id, downloaded);

    // cover: first photo, in message order
    const cover = (post.media || []).filter((m) => m.type === 'photo' && m.path)
      .sort((a, b) => (a.msgId ?? 0) - (b.msgId ?? 0) || (a.idx ?? 0) - (b.idx ?? 0))[0];
    if ((cover?.path ?? null) !== (post.coverPath ?? null)) {
      post = this.store.updatePost(post.id, { coverPath: cover?.path ?? post.coverPath ?? null });
    }

    // --- materialize + schedule publish ---
    const markdown = renderMarkdown(post, { readingMinutes: readingMinutes(excerpt + ' ' + bodyText || excerpt) });
    const { path, changed } = writePostFile(cfg.repoDir, post, markdown);
    this.publisher.schedule(`post ${post.slug}`);
    this.log('info', `article ${changed ? 'written' : 'unchanged'}`, { path, slug: post.slug, status: post.status });
    return { ok: true, slug: post.slug, post, changed };
  }

  /** Download one media item and return its media_json entry (or a link fallback). */
  async resolveMedia(post, item, { msgId, idx }) {
    const cfg = this.config;
    const maxBytes = cfg.maxFileMb * 1024 * 1024;
    const kind = item.kind === 'audio' ? 'file' : item.kind;
    const linkType = kind === 'video' ? 'video-link' : 'file-link';
    const declared = Number(item.fileSize) || 0;

    try {
      if (item.url) {
        // backfill path: public CDN mirror URL (no Bot API involved)
        if (mediaExists(cfg.repoDir, post.slug, item.uid, item.ext ?? '.jpg')) {
          return { type: 'photo', uid: item.uid, msgId, idx, path: mediaPublicPath(post.slug, item.uid, item.ext ?? '.jpg'), w: item.w, h: item.h };
        }
        const { bytes } = await this.telegram.resolveUrl(item.url, { maxBytes: item.kind === 'photo' ? DEFAULT_MAX_URL_BYTES : maxBytes });
        const ext = item.ext ?? '.jpg';
        const { publicPath } = writeMediaFile(cfg.repoDir, post.slug, item.uid, ext, bytes);
        return { type: 'photo', uid: item.uid, msgId, idx, path: publicPath, w: item.w, h: item.h };
      }

      if (declared > maxBytes || (declared === 0 && kind !== 'photo')) {
        // getFile has a hard 20 MB ceiling anyway; a too-big declared size is known up-front
        if (declared > maxBytes && kind !== 'photo') {
          this.log('info', 'media above size limit — linking instead of downloading', { uid: item.uid, mb: Math.round(declared / 1048576) });
          return { type: linkType, uid: item.uid, msgId, idx, name: item.name };
        }
      }
      const file = await this.telegram.getFile(item.fileId);
      const size = Number(file.file_size) || 0;
      if (size > maxBytes) {
        if (kind === 'photo') throw new TelegramApiError(`rasm limitdan katta (${size} bayt)`, { code: 413 });
        this.log('info', 'media above size limit — linking instead of downloading', { uid: item.uid, mb: Math.round(size / 1048576) });
        return { type: linkType, uid: item.uid, msgId, idx, name: item.name };
      }
      const ext = fileExt(file.file_path, item.mime);
      if (kind === 'photo' && mediaExists(cfg.repoDir, post.slug, item.uid, ext)) {
        return { type: 'photo', uid: item.uid, msgId, idx, path: mediaPublicPath(post.slug, item.uid, ext), w: item.w, h: item.h };
      }
      const { bytes } = await this.telegram.download(file.file_path, { maxBytes });
      const { publicPath } = writeMediaFile(cfg.repoDir, post.slug, item.uid, ext, bytes);
      if (kind === 'photo') return { type: 'photo', uid: item.uid, msgId, idx, path: publicPath, w: item.w, h: item.h };
      if (kind === 'video') return { type: 'video', uid: item.uid, msgId, idx, path: publicPath, w: item.w, h: item.h };
      return { type: 'file', uid: item.uid, msgId, idx, path: publicPath, name: item.name };
    } catch (error) {
      this.log('error', `media download failed: ${error?.message || error}`, { uid: item.uid, kind });
      if (kind === 'photo') return null; // article keeps the text; admin can re-trigger via delete+repost
      return { type: linkType, uid: item.uid, msgId, idx, name: item.name };
    }
  }

  /** Admin action: publish/unpublish — flips draft frontmatter + schedules publish. */
  async setPostStatus(id, status, actor = 'admin') {
    return this.enqueue(() => {
      const post = this.store.setStatus(id, status);
      if (!post) return null;
      const markdown = renderMarkdown(post, { readingMinutes: readingMinutes(post.bodyHtml.replace(/<[^>]+>/g, ' ')) });
      writePostFile(this.config.repoDir, post, markdown);
      this.publisher.schedule(`${status} ${post.slug}`);
      this.log('info', `article status → ${status}`, { slug: post.slug, actor });
      return post;
    });
  }

  /** Admin action: delete — tombstones the row (edits won't resurrect it) + removes files. */
  async deletePost(id, actor = 'admin') {
    return this.enqueue(() => {
      const post = this.store.getPostById(id);
      if (!post) return null;
      this.store.setStatus(id, 'deleted');
      const removed = removePostFiles(this.config.repoDir, post);
      this.publisher.schedule(`delete ${post.slug}`);
      this.log('info', 'article deleted (tombstoned)', { slug: post.slug, actor, removed: removed.length });
      return { ...post, status: 'deleted', removed };
    });
  }

  listPosts(query) {
    return this.store.listPosts(query);
  }
}
