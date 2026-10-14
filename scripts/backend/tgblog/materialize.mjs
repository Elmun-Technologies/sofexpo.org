/**
 * Materializes tg_blog_posts rows into the repo:
 *   src/content/<collection>/<locale>/<slug>.md   — the article (Astro collection entry)
 *   public/images/telegram/<slug>/<uid>.<ext>     — downloaded media (served by the CDN)
 *
 * Everything is deterministic (stable paths, stable frontmatter order), so a repeated
 * run on unchanged input produces a byte-identical tree and `git status` stays clean.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const yamlString = (value) => JSON.stringify(String(value ?? ''));

const day = (iso) => (iso ? String(iso).slice(0, 10) : '');

export const mediaDirRel = (slug) => join('public', 'images', 'telegram', slug);
export const mediaPublicPath = (slug, uid, ext) => `/images/telegram/${slug}/${uid}${ext}`;
export const postPathRel = (collection, locale, slug) => join('src', 'content', collection, locale, `${slug}.md`);

/** All slugs present on disk for a collection/locale (both files and the DB count). */
export function slugsOnDisk(repoDir, collection, locale) {
  const dir = join(repoDir, 'src', 'content', collection, locale);
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, '').toLowerCase()),
  );
}

/** RU/EN strings for the generated body bits — follows BLOG_SYNC_LOCALE. */
const STRINGS = {
  ru: { watchVideo: 'Смотреть видео в Telegram', viewFile: 'Открыть файл в Telegram' },
  en: { watchVideo: 'Watch the video on Telegram', viewFile: 'Open the file on Telegram' },
};

/** Media gallery that goes above the text, mimicking the channel layout. */
export function mediaBlock(post) {
  const strings = STRINGS[post.locale] ?? STRINGS.en;
  const parts = [];
  for (const item of post.media || []) {
    if (item.type === 'photo' && item.path) {
      const size = item.w && item.h ? ` width="${item.w}" height="${item.h}"` : '';
      parts.push(`<figure>\n  <img src="${item.path}" alt="${escapeAttrMd(post.title)}" loading="lazy"${size} />\n</figure>`);
    } else if (item.type === 'video' && item.path) {
      parts.push(`<video controls preload="metadata" src="${item.path}"></video>`);
    } else if (item.type === 'video-link') {
      parts.push(`<p><a href="${post.tgLink}" target="_blank" rel="noopener">${strings.watchVideo} →</a></p>`);
    } else if (item.type === 'file-link') {
      parts.push(`<p><a href="${post.tgLink}" target="_blank" rel="noopener">${strings.viewFile} →</a></p>`);
    }
  }
  return parts.join('\n');
}

const escapeAttrMd = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Full source of the markdown file for a post row. */
export function renderMarkdown(post, { readingMinutes = 1 } = {}) {
  const frontmatter = [
    `title: ${yamlString(post.title)}`,
    `description: ${yamlString(post.excerpt || post.title)}`,
    `date: ${day(post.postedAt) || day(post.createdAt)}`,
  ];
  if (post.editedAt && day(post.editedAt) !== day(post.postedAt)) frontmatter.push(`updated: ${day(post.editedAt)}`);
  if (post.tags?.length) frontmatter.push(`tags: [${post.tags.map(yamlString).join(', ')}]`);
  if (post.coverPath) frontmatter.push(`hero: ${yamlString(post.coverPath)}`);
  frontmatter.push(`readingMinutes: ${Math.max(1, Math.trunc(readingMinutes) || 1)}`);
  if (post.status !== 'published') frontmatter.push('draft: true');
  if (post.tgLink) frontmatter.push(`telegram: ${yamlString(post.tgLink)}`);
  const gallery = mediaBlock(post);
  const body = [gallery, post.bodyHtml].filter(Boolean).join('\n');
  return `---\n${frontmatter.join('\n')}\n---\n\n${body}\n`;
}

/**
 * Write the markdown file; returns { path, changed: boolean }.
 * Byte-identical rewrites are skipped so debounced git runs stay no-ops.
 */
export function writePostFile(repoDir, post, content) {
  const rel = postPathRel(post.collection, post.locale, post.slug);
  const abs = join(repoDir, rel);
  if (existsSync(abs) && readFileSync(abs, 'utf8') === content) return { path: rel, changed: false };
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  return { path: rel, changed: true };
}

/** Persist a downloaded media buffer under the slug's media dir. Returns public path. */
export function writeMediaFile(repoDir, slug, uid, ext, bytes) {
  const dir = join(repoDir, mediaDirRel(slug));
  mkdirSync(dir, { recursive: true });
  const name = `${uid}${ext}`;
  writeFileSync(join(dir, name), bytes);
  return { publicPath: mediaPublicPath(slug, uid, ext), rel: join(mediaDirRel(slug), name) };
}

export function mediaExists(repoDir, slug, uid, ext) {
  return existsSync(join(repoDir, mediaDirRel(slug), `${uid}${ext}`));
}

/** Remove markdown + media dir of a deleted post. Returns removed relative paths. */
export function removePostFiles(repoDir, post) {
  const removed = [];
  const md = join(repoDir, postPathRel(post.collection, post.locale, post.slug));
  if (existsSync(md)) { rmSync(md); removed.push(postPathRel(post.collection, post.locale, post.slug)); }
  const dir = join(repoDir, mediaDirRel(post.slug));
  if (existsSync(dir)) { rmSync(dir, { recursive: true, force: true }); removed.push(mediaDirRel(post.slug)); }
  return removed;
}

/**
 * Orphan adoption: when an EDIT arrives for a message the DB does not know (e.g. the
 * article came from a one-off backfill against a different DB), the markdown it produced
 * is still findable via the `telegram:` frontmatter link — adopt that slug instead of
 * publishing a duplicate article.
 */
export function findSlugByTelegramLink(repoDir, { collection, locale, username, messageId }) {
  const dir = join(repoDir, 'src', 'content', collection, locale);
  if (!existsSync(dir)) return null;
  const needle = `t.me/${username}/${Number(messageId)}`;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const head = readFileSync(join(dir, name), 'utf8').slice(0, 4_000);
    if (head.includes(needle)) return name.replace(/\.md$/, '');
  }
  return null;
}
