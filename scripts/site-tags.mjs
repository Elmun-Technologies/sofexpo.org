/**
 * Search-engine verification and analytics/pixel ids for the public site (docs/22).
 *
 * One spec shared by the backend (admin "Analitika va SEO kodlari" form, validation, the
 * materialized src/data/site-tags.json) and the site build (src/lib/analytics.ts), so the two
 * never disagree on what a valid id looks like. Admins may paste a whole vendor snippet —
 * the id is pulled out of it; anything that does not match is rejected, never printed.
 */

const TOKEN = /^[A-Za-z0-9_.:-]{6,120}$/;

/**
 * kind: 'meta'  — <meta name=… content=…>, several tokens comma-separated (one per property)
 *       'id'    — a tracker id matched by `find` anywhere in the pasted text
 *       'bool'  — a switch
 *       'code'  — raw HTML for <head> (admin only, last resort for vendors without a field)
 */
export const SITE_TAG_FIELDS = [
  { key: 'googleVerification', group: 'verify', kind: 'meta', meta: 'google-site-verification', label: 'Google Search Console' },
  { key: 'yandexVerification', group: 'verify', kind: 'meta', meta: 'yandex-verification', label: 'Yandex Webmaster' },
  { key: 'bingVerification', group: 'verify', kind: 'meta', meta: 'msvalidate.01', label: 'Bing Webmaster' },
  { key: 'baiduVerification', group: 'verify', kind: 'meta', meta: 'baidu-site-verification', label: 'Baidu Search (站长平台)' },
  { key: 'facebookVerification', group: 'verify', kind: 'meta', meta: 'facebook-domain-verification', label: 'Meta (Facebook) domain' },
  { key: 'ga4Id', upper: true, group: 'analytics', kind: 'id', find: /\bG-[A-Z0-9]{4,16}\b/i, label: 'Google Analytics 4', example: 'G-ABC123XYZ9' },
  { key: 'gtmId', upper: true, group: 'analytics', kind: 'id', find: /\bGTM-[A-Z0-9]{4,12}\b/i, label: 'Google Tag Manager', example: 'GTM-ABCD123' },
  { key: 'yandexMetrikaId', group: 'analytics', kind: 'id', find: /(?:ym\(\s*|\/watch\/|^)(\d{5,12})(?:\b|$)/, label: 'Yandex Metrika', example: '98765432' },
  { key: 'yandexWebvisor', group: 'analytics', kind: 'bool', label: 'Vebvizor (sessiya yozuvlari)', default: true },
  { key: 'baiduTongjiId', group: 'analytics', kind: 'id', find: /(?:hm\.js\?|^)([a-f0-9]{32})\b/, label: 'Baidu Tongji (百度统计)', example: '0123456789abcdef0123456789abcdef' },
  { key: 'googleAdsId', upper: true, group: 'ads', kind: 'id', find: /\bAW-\d{6,14}\b/i, label: 'Google Ads', example: 'AW-123456789' },
  { key: 'metaPixelId', group: 'ads', kind: 'id', find: /(?:fbq\(\s*['"]init['"]\s*,\s*['"]|id=|^)(\d{10,20})\b/, label: 'Meta Pixel (Facebook/Instagram)', example: '1234567890123456' },
  { key: 'tiktokPixelId', upper: true, group: 'ads', kind: 'id', find: /(?:ttq\.load\(\s*['"]|sdkid=|^)([A-Z0-9]{15,25})\b/i, label: 'TikTok Pixel', example: 'C1ABCDEFGHIJ2KLMNOPQ' },
  { key: 'customHead', group: 'custom', kind: 'code', max: 20_000, label: 'Qo‘shimcha kod (<head>)' },
];

const FIELD = new Map(SITE_TAG_FIELDS.map((field) => [field.key, field]));

/** pull the content="…" out of a pasted <meta>, then split several tokens */
function metaTokens(raw) {
  const text = String(raw ?? '');
  const contents = [...text.matchAll(/content\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]);
  const parts = (contents.length ? contents : text.split(/[\s,]+/)).map((t) => t.trim()).filter(Boolean);
  return parts;
}

/**
 * @returns {{ value: Record<string, string|boolean>, errors: Record<string, string> }}
 *   value holds only non-empty, valid entries (booleans always), errors names bad fields.
 */
export function normalizeSiteTags(input = {}) {
  const value = {};
  const errors = {};
  for (const field of SITE_TAG_FIELDS) {
    const raw = input?.[field.key];
    if (field.kind === 'bool') {
      value[field.key] = raw === undefined || raw === null || raw === '' ? field.default : Boolean(raw) && raw !== 'false' && raw !== '0';
      continue;
    }
    const text = String(raw ?? '').trim();
    if (!text) continue;
    if (field.kind === 'meta') {
      const tokens = metaTokens(text);
      const bad = tokens.filter((t) => !TOKEN.test(t));
      if (bad.length || !tokens.length) errors[field.key] = 'Tasdiqlash kodi noto‘g‘ri: faqat content="…" ichidagi qiymat kerak.';
      else value[field.key] = [...new Set(tokens)].join(',');
    } else if (field.kind === 'id') {
      const match = field.find.exec(text);
      const found = match ? (match[1] ?? match[0]) : '';
      const id = field.upper ? found.toUpperCase() : found;
      if (!id) errors[field.key] = `ID topilmadi. Namuna: ${field.example}`;
      else value[field.key] = id;
    } else if (field.kind === 'code') {
      if (text.length > field.max) errors[field.key] = `Kod juda uzun (eng ko‘pi ${field.max} belgi).`;
      else if (/<\/head|<body|<\/html/i.test(text)) errors[field.key] = 'Faqat <head> ichiga tegishli kod (<script>, <meta>, <noscript>) kiriting.';
      else value[field.key] = text;
    }
  }
  return { value, errors };
}

/** build-time fallback: the same fields from PUBLIC_* env (docs/22 §3) */
export function siteTagsFromEnv(env = {}) {
  return {
    ga4Id: env.PUBLIC_GA4_ID,
    yandexMetrikaId: env.PUBLIC_YM_ID,
    googleVerification: env.PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandexVerification: env.PUBLIC_YANDEX_VERIFICATION,
    bingVerification: env.PUBLIC_BING_VERIFICATION,
  };
}

/** admin-saved values win; env only fills what the admin left empty */
export function resolveSiteTags(saved = {}, env = {}) {
  const merged = { ...siteTagsFromEnv(env) };
  for (const [key, val] of Object.entries(saved || {})) {
    if (FIELD.has(key) && val !== '' && val !== undefined && val !== null) merged[key] = val;
  }
  return normalizeSiteTags(merged).value;
}

/** <meta name content> pairs in field order */
export function verificationTags(value = {}) {
  return SITE_TAG_FIELDS.filter((field) => field.kind === 'meta' && value[field.key]).flatMap((field) =>
    String(value[field.key]).split(',').map((content) => ({ name: field.meta, content })),
  );
}

/** byte-stable file body, so an unchanged save is a git no-op */
export function serializeSiteTags(value = {}) {
  const out = {};
  for (const field of SITE_TAG_FIELDS) {
    if (value[field.key] !== undefined && value[field.key] !== '') out[field.key] = value[field.key];
  }
  return `${JSON.stringify(out, null, 2)}\n`;
}

export const SITE_TAGS_FILE = 'src/data/site-tags.json';
