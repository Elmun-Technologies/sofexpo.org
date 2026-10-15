/**
 * Telegram MessageEntity[] + text → safe HTML.
 *
 * Entity offsets are UTF-16 code-unit offsets (Bot API spec) — the same indexing JS
 * strings use, so emojis (surrogate pairs) just work as long as everything stays in
 * JS-string index space and ranges never split a surrogate pair.
 *
 * Sanitization model: the input text is ALWAYS escaped; the only tags emitted are the
 * fixed whitelist below; link hrefs are limited to http(s)/mailto. Nothing from the
 * channel post can inject markup — XSS-safe by construction, no sanitizer dependency.
 */
import { parseFragment } from 'parse5';

export const escapeHtml = (value) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (value) => escapeHtml(value).replace(/"/g, '&quot;');

/** Only these URL schemes survive; anything else unwraps to plain text. */
export function safeUrl(value) {
  const text = String(value ?? '').trim();
  if (!text || text.length > 2048) return null;
  try {
    const url = new URL(text);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

const INLINE_TAGS = {
  bold: ['<strong>', '</strong>'],
  italic: ['<em>', '</em>'],
  underline: ['<u>', '</u>'],
  strikethrough: ['<s>', '</s>'],
  code: ['<code>', '</code>'],
  spoiler: ['<span class="tg-spoiler">', '</span>'],
};
const BLOCK_TYPES = new Set(['pre', 'blockquote', 'expandable_blockquote']);
/** Entities we knowingly render as plain text (mention, hashtag, cashtag, email, …). */

const clampEntities = (entities, textLength) =>
  (Array.isArray(entities) ? entities : [])
    .filter((e) => e && typeof e.type === 'string' && Number.isInteger(e.offset) && Number.isInteger(e.length))
    .map((e) => ({ ...e, offset: Math.max(0, Math.min(e.offset, textLength)), length: Math.max(0, Math.min(e.length, textLength - e.offset)) }))
    .filter((e) => e.length > 0);

/** Remove [start,end) ranges from text; entities are clamped to the surviving parts. */
export function removeRanges(text, entities, ranges) {
  const sorted = (ranges || [])
    .filter(([a, b]) => Number.isInteger(a) && Number.isInteger(b) && b > a)
    .sort((x, y) => x[0] - y[0]);
  if (!sorted.length) return { text: String(text ?? ''), entities: (entities || []).slice() };
  const merged = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const source = String(text ?? '');
  const kept = []; // [oldStart, oldEnd, newStart]
  let out = '';
  let prev = 0;
  for (const [start, end] of merged) {
    kept.push([prev, Math.min(start, source.length), out.length]);
    out += source.slice(prev, start);
    prev = Math.max(prev, end);
  }
  kept.push([prev, source.length, out.length]);
  out += source.slice(prev);

  const nextEntities = [];
  for (const entity of entities || []) {
    const end = entity.offset + entity.length;
    const segments = kept
      .map(([oldStart, oldEnd, newStart]) => {
        const a = Math.max(entity.offset, oldStart);
        const b = Math.min(end, oldEnd);
        return b > a ? { offset: newStart + (a - oldStart), length: b - a } : null;
      })
      .filter(Boolean);
    if (!segments.length) continue;
    const best = segments.reduce((winner, s) => (s.length > winner.length ? s : winner));
    nextEntities.push({ ...entity, offset: best.offset, length: best.length });
  }
  return { text: out, entities: nextEntities };
}

/** Inline render of one contiguous range: boundary-event walk, closes mirror opens. */
function renderInline(text, entities) {
  const list = clampEntities(entities, text.length).filter((e) => {
    if (INLINE_TAGS[e.type] || e.type === 'text_link' || e.type === 'url') return true;
    if (e.type === 'pre' || BLOCK_TYPES.has(e.type)) return false; // handled by caller
    return false; // unknown/mention/hashtag → plain text
  });
  if (!list.length) return escapeHtml(text).replace(/\n/g, '<br>');

  const opensAt = new Map();
  for (const entity of list) {
    const arr = opensAt.get(entity.offset) || [];
    arr.push(entity);
    opensAt.set(entity.offset, arr);
  }
  const positions = [...new Set([...opensAt.keys(), ...list.map((e) => e.offset + e.length)])].sort((a, b) => a - b);

  const openTag = (entity) => {
    if (INLINE_TAGS[entity.type]) return INLINE_TAGS[entity.type][0];
    if (entity.type === 'text_link') {
      const url = safeUrl(entity.url);
      return url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">` : '';
    }
    if (entity.type === 'url') {
      const url = safeUrl(text.slice(entity.offset, entity.offset + entity.length));
      return url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">` : '';
    }
    return '';
  };
  const closeTag = (entity) => {
    if (INLINE_TAGS[entity.type]) return INLINE_TAGS[entity.type][1];
    if (entity.type === 'text_link' || entity.type === 'url') return openTag(entity) ? '</a>' : '';
    return '';
  };

  let html = '';
  let cursor = 0;
  const stack = [];
  for (const pos of positions) {
    html += escapeHtml(text.slice(cursor, pos)).replace(/\n/g, '<br>');
    cursor = pos;
    // close everything ending here, innermost first
    const closing = stack.filter((e) => e.offset + e.length === pos).sort((a, b) => stack.indexOf(b) - stack.indexOf(a));
    for (const entity of closing) {
      html += closeTag(entity);
      stack.splice(stack.indexOf(entity), 1);
    }
    // open everything starting here, outermost (longest) first for valid nesting
    const opening = (opensAt.get(pos) || []).sort((a, b) => b.length - a.length || a.type.localeCompare(b.type));
    for (const entity of opening) {
      html += openTag(entity);
      stack.push(entity);
    }
  }
  html += escapeHtml(text.slice(cursor)).replace(/\n/g, '<br>');
  while (stack.length) html += closeTag(stack.pop());
  return html;
}

/** Split a range into <p> paragraphs on blank lines; single \n inside → <br>. */
function renderParagraphs(text, entities) {
  const parts = [];
  let cursor = 0;
  const paraRe = /\n{2,}/g;
  let match;
  const ranges = [];
  while ((match = paraRe.exec(text))) {
    ranges.push([cursor, match.index]);
    cursor = match.index + match[0].length;
  }
  ranges.push([cursor, text.length]);
  for (const [start, end] of ranges) {
    if (text.slice(start, end).trim() === '') continue;
    const slice = text.slice(start, end);
    const local = clampEntities(entities, text.length)
      .map((e) => {
        const a = Math.max(e.offset, start);
        const b = Math.min(e.offset + e.length, end);
        return b > a ? { ...e, offset: a - start, length: b - a } : null;
      })
      .filter(Boolean);
    parts.push(`<p>${renderInline(slice, local)}</p>`);
  }
  return parts.join('\n');
}

/**
 * Full message body → HTML. Block entities (pre, blockquote, expandable_blockquote)
 * become block elements; everything else is paragraphified inline markup.
 */
export function entitiesToHtml(text, entities) {
  const source = String(text ?? '');
  if (!source.trim()) return '';
  const all = clampEntities(entities, source.length);
  const blocks = all
    .filter((e) => BLOCK_TYPES.has(e.type))
    .sort((a, b) => a.offset - b.offset || b.length - a.length);
  // drop block ranges contained in another block (pre wins over blockquote on tie)
  const topBlocks = [];
  for (const block of blocks) {
    const end = block.offset + block.length;
    if (topBlocks.some((t) => block.offset >= t.offset && end <= t.offset + t.length)) continue;
    topBlocks.push(block);
  }
  const out = [];
  let cursor = 0;
  for (const block of topBlocks) {
    if (block.offset < cursor) continue; // pathological overlap — first block wins
    if (block.offset > cursor) {
      out.push(renderParagraphs(source.slice(cursor, block.offset), shiftEntities(all, -cursor, block.offset, cursor)));
    }
    const inner = source.slice(block.offset, block.offset + block.length);
    if (block.type === 'pre') {
      const language = typeof block.language === 'string' && /^[a-z0-9+#-]{1,20}$/i.test(block.language) ? block.language : '';
      out.push(`<pre><code${language ? ` class="language-${language}"` : ''}>${escapeHtml(inner)}</code></pre>`);
    } else {
      const innerEntities = shiftEntities(all.filter((e) => !BLOCK_TYPES.has(e.type)), -block.offset, block.offset + block.length, block.offset);
      out.push(`<blockquote>${renderParagraphs(inner, innerEntities)}</blockquote>`);
    }
    cursor = block.offset + block.length;
  }
  if (cursor < source.length) {
    out.push(renderParagraphs(source.slice(cursor), shiftEntities(all, -cursor, source.length, cursor)));
  }
  return out.filter(Boolean).join('\n');
}

/** Rebase entities that intersect [start,end) by `delta` (negative shifts left). */
function shiftEntities(entities, delta, end, start) {
  return (entities || [])
    .map((e) => {
      const a = Math.max(e.offset, start);
      const b = Math.min(e.offset + e.length, end);
      return b > a ? { ...e, offset: a + delta, length: b - a } : null;
    })
    .filter(Boolean);
}

/**
 * Reverse direction: trusted-ish HTML (the public t.me/s mirror) → { text, entities }.
 * Walks the parse5 tree with the same whitelist; unsupported markup unwraps to text.
 * Used by the backfill script so both import paths share ONE formatting pipeline.
 */
export function htmlToEntities(html) {
  const fragment = parseFragment(String(html ?? ''));
  const textParts = [];
  const entities = [];
  const pos = () => textParts.join('').length;

  const walkChildren = (node) => (node.childNodes || []).forEach(walk);
  const wrap = (node, type, extra = {}) => {
    const start = pos();
    walkChildren(node);
    const length = pos() - start;
    if (length > 0) entities.push({ type, offset: start, length, ...extra });
  };

  function walk(node) {
    if (node.nodeName === '#text') {
      textParts.push(node.value || '');
      return;
    }
    const tag = node.tagName;
    if (!tag) return walkChildren(node);
    const klass = (node.attrs || []).find((a) => a.name === 'class')?.value || '';
    switch (tag) {
      case 'br':
        textParts.push('\n');
        return;
      case 'b': case 'strong': return wrap(node, 'bold');
      case 'i': case 'em': return wrap(node, 'italic');
      case 'u': case 'ins': return wrap(node, 'underline');
      case 's': case 'strike': case 'del': return wrap(node, 'strikethrough');
      case 'code': case 'kbd': return wrap(node, 'code');
      case 'pre': {
        const codeNode = (node.childNodes || []).find((c) => c.tagName === 'code');
        const langClass = ((codeNode?.attrs || []).find((a) => a.name === 'class')?.value || '').match(/language-([a-z0-9+#-]+)/i);
        const start = pos();
        walkChildren(codeNode || node);
        const length = pos() - start;
        if (length > 0) entities.push({ type: 'pre', offset: start, length, ...(langClass ? { language: langClass[1] } : {}) });
        return;
      }
      case 'blockquote': return wrap(node, 'blockquote');
      case 'a': {
        const href = (node.attrs || []).find((a) => a.name === 'href')?.value || '';
        const url = safeUrl(href);
        if (url) return wrap(node, 'text_link', { url });
        return walkChildren(node); // relative/unsafe href → plain text
      }
      case 'span':
        if (/tg[_-]spoiler/i.test(klass)) return wrap(node, 'spoiler');
        return walkChildren(node);
      case 'p': case 'div': {
        const start = pos();
        walkChildren(node);
        if (pos() > start) textParts.push('\n\n');
        return;
      }
      default:
        return walkChildren(node);
    }
  }
  walkChildren(fragment);
  return { text: textParts.join(''), entities };
}
