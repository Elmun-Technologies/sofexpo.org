/**
 * Cyrillic → Latin transliteration + URL slug helpers for Telegram-synced posts.
 * Russian table with Uzbek-Cyrillic extras (ў ғ қ ҳ); anything non [a-z0-9] becomes '-'.
 */

const TABLE = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
  'я': 'ya',
  // Uzbek Cyrillic specials
  'ў': 'o', 'ғ': 'g', 'қ': 'q', 'ҳ': 'h',
  // Ukrainian, just in case a repost slips in
  'є': 'e', 'ї': 'yi', 'і': 'i', 'ґ': 'g',
};

/** Transliterate Cyrillic (and pass through Latin); keeps original case. */
export function transliterate(input) {
  const text = String(input ?? '');
  let out = '';
  for (const char of text) {
    const lower = char.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(TABLE, lower)) {
      const mapped = TABLE[lower];
      out += char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    } else {
      out += char;
    }
  }
  return out;
}

/** Lowercase ASCII slug, words joined by '-', trimmed to a word boundary under maxLen. */
export function slugify(input, { maxLen = 70, fallback = 'post' } = {}) {
  let slug = transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length > maxLen) {
    slug = slug.slice(0, maxLen);
    const cut = slug.lastIndexOf('-');
    if (cut > 20) slug = slug.slice(0, cut);
    slug = slug.replace(/-+$/g, '');
  }
  return slug || fallback;
}

/**
 * Slug that does not collide with `taken` (case-insensitive):
 * `name`, `name-2`, `name-3`, … Mirrors the requirement ("-2", "-3" on repeats).
 */
export function uniqueSlug(candidate, taken) {
  const base = slugify(candidate);
  const set = typeof taken?.has === 'function'
    ? taken
    : new Set((taken || []).map((v) => String(v).toLowerCase()));
  const has = (s) => set.has(s) || set.has(s.toLowerCase());
  if (!has(base)) return base;
  for (let i = 2; i < 10_000; i += 1) {
    const next = `${base}-${i}`;
    if (!has(next)) return next;
  }
  return `${base}-${Date.now().toString(36)}`;
}
