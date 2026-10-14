/**
 * Plain-text layer for Telegram posts: title from the first line, hashtag collection,
 * meta-description excerpt. All offsets are JS-string (UTF-16) offsets — exactly what
 * the Bot API uses for entity offsets, so emoji/surrogate pairs stay aligned.
 */

/** Strip control characters (same policy as the lead backend cleanText). */
export function cleanInput(value, max = 4096) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .slice(0, max);
}

function truncateWords(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s.,:;!?—–-]+$/g, '')}…`;
}

/**
 * Title from the first line (≤ max chars); that line is removed from the body.
 * If the first line is empty or too long, the title is a truncated beginning of the
 * whole text and the body stays intact (requirement: "matn boshidan qisqartirib olinsin").
 *
 * Returns { title, titleRange } — titleRange is [start, end) in UTF-16 offsets of the
 * text span to drop from the body, or null when nothing must be removed.
 */
export function splitTitle(text, { max = 100 } = {}) {
  const normalized = String(text ?? '');
  if (!normalized.trim()) return { title: '', titleRange: null };
  const nl = normalized.indexOf('\n');
  if (nl > 0) {
    const firstLine = normalized.slice(0, nl).trim();
    if (firstLine.length > 0 && firstLine.length <= max) {
      // consume the newline(s) after the title line as well, so the body starts clean
      let end = nl + 1;
      while (normalized[end] === '\n') end += 1;
      return { title: firstLine, titleRange: [0, end] };
    }
  }
  const flat = normalized.replace(/\s+/g, ' ').trim();
  return { title: truncateWords(flat, max), titleRange: null };
}

const HASHTAG_RE = /#([\p{L}\p{N}_][\p{L}\p{N}_-]*)/gu;

/**
 * Locate hashtag tokens. Returns { tags, ranges } — ranges are [start, end) spans of the
 * raw `#tag` token (incl. '#') so the caller can strip them from the body.
 */
export function findHashtags(text) {
  const tags = [];
  const ranges = [];
  HASHTAG_RE.lastIndex = 0;
  let match;
  const source = String(text ?? '');
  while ((match = HASHTAG_RE.exec(source))) {
    const tag = match[1];
    if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) tags.push(tag);
    ranges.push([match.index, match.index + match[0].length]);
  }
  return { tags, ranges };
}

/** Meta description / excerpt: whitespace-collapsed, word-boundary cut (~155 chars). */
export function makeExcerpt(text, { max = 155 } = {}) {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return truncateWords(flat, max);
}

/** Rough reading time for the frontmatter (matches existing posts' readingMinutes). */
export function readingMinutes(text, wpm = 180) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / wpm) || 1);
}
