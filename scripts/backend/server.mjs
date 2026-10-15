import http from 'node:http';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BackendStore, LEAD_PRIORITIES, LEAD_STATUSES, USER_ROLES } from './db.mjs';
import { createSecret, hashToken, normalizeEmail, validEmail, validPassword, verifyPassword } from './auth.mjs';

const ADMIN_DIR = fileURLToPath(new URL('./admin/', import.meta.url));
const PORTAL_DIR = fileURLToPath(new URL('./portal/', import.meta.url));
/* the 2026-10 design layer shared by /admin and /cabinet, and the site's own fonts and mark,
   served from an allow-list (never a path taken from the request) */
const SHARED_FILES = {
  '/admin/theme.css': fileURLToPath(new URL('./shared/theme.css', import.meta.url)),
  '/cabinet/theme.css': fileURLToPath(new URL('./shared/theme.css', import.meta.url)),
  '/brand-assets/sofexpo-logo.png': fileURLToPath(new URL('../../public/brand/sofexpo-logo.png', import.meta.url)),
  ...Object.fromEntries(['manrope', 'onest'].flatMap((face) => ['latin', 'latin-ext', 'cyrillic'].map((subset) => [
    `/brand-fonts/${face}-${subset}.woff2`,
    fileURLToPath(new URL(`../../public/fonts/${face}-${subset}.woff2`, import.meta.url)),
  ]))),
};
const CONTENT_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const PORTAL_EVENTS = [
  { slug: 'foodera-expo', name: 'FOODERA EXPO 2026', dates: '27–29 oktabr 2026' },
  { slug: 'buildpro-expo', name: 'BUILD PRO EXPO 2026', dates: '9–11 noyabr 2026' },
  { slug: 'agropro-expo', name: 'AGROPRO EXPO 2027', dates: '2–4 mart 2027' },
  { slug: 'world-edu-expo', name: 'WORLD EDU · SPRING 2027', dates: '9–10 aprel 2027' },
  { slug: 'ecom-retail-expo', name: 'ECOM & RETAIL EXPO', dates: '16–17 iyun 2027' },
];
/* exhibitor uploads (logo, flyers, catalogue, stand photos): what each slot accepts, how many
   files and how large. The type is read from the file's first bytes, never from its name or the
   browser's Content-Type, and SVG is not accepted (it can carry script). */
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const UPLOAD_KINDS = {
  logo: { max: 1, bytes: 3 * 1024 * 1024, types: IMAGE_TYPES },
  flyer: { max: 10, bytes: 15 * 1024 * 1024, types: ['application/pdf', ...IMAGE_TYPES] },
  catalog: { max: 3, bytes: 25 * 1024 * 1024, types: ['application/pdf'] },
  photo: { max: 12, bytes: 8 * 1024 * 1024, types: IMAGE_TYPES },
};
const UPLOAD_QUOTA_BYTES = 120 * 1024 * 1024;
const UPLOAD_EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'application/pdf': '.pdf' };
function sniffUpload(buffer) {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer.subarray(1, 4).toString('latin1') === 'PNG') return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  return '';
}
const COMPANY_STATUSES = new Set(['approved', 'changes']);
const LEAD_TEXT_FIELDS = {
  formType: 'Форма', event: 'Выставка', name: 'Имя', company: 'Компания', position: 'Должность',
  phone: 'Телефон', email: 'Email', direction: 'Направление', area: 'Площадь', goal: 'Задача',
  purpose: 'Цель', industry: 'Отрасль', package: 'Пакет', eventType: 'Формат', attendees: 'Гостей',
  count: 'Человек', date: 'Дата', time: 'Время', channel: 'Канал', messenger: 'Мессенджер', comment: 'Комментарий',
};
const LEAD_SKIP_FIELDS = new Set(['ts', 'locale', 'url', 'referrer', 'source', 'src', '_error', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'page', 'landing']);
const REQUIRED_BY_FORM = {
  generic: ['company', 'consent'], press: ['company', 'consent'],
  exhibitor: ['company', 'industry', 'area', 'consent'],
  visitor: ['email', 'industry', 'consent'],
  organizer: ['company', 'email', 'eventType', 'consent'], sponsor: ['company'],
  callback: [], catalog: [], group: ['count'], quiz: ['company', 'event', 'goal', 'area', 'consent'],
};
const CONSENT_VALUES = new Set(['on', '1', 'true', 'yes', 'accepted']);
const VALID_EVENT_NAME = /^[a-z][a-z0-9_]{0,59}$/i;

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const clamp = (value, min, max, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  return Number.isInteger(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
const cleanText = (value, max = 500) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const nullableInteger = (value, min, max) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.trunc(number))) : null;
};

function parseOriginList(value) {
  if (Array.isArray(value)) return value;
  return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function originOf(value) {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

function safePath(value, { includeOrigin = false } = {}) {
  const text = cleanText(value, 1000);
  if (!text) return '';
  try {
    const url = new URL(text, 'https://sofexpo.invalid');
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const path = `${url.pathname}${url.hash}`.slice(0, 500);
    return includeOrigin && url.origin !== 'https://sofexpo.invalid' ? `${url.origin}${path}` : path;
  } catch {
    return text.startsWith('/') ? text.split(/[?#]/, 1)[0].slice(0, 300) : '';
  }
}

function cleanUtm(input) {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const result = {};
  for (const key of keys) {
    const value = cleanText(input?.[key], 160);
    if (value) result[key] = value;
  }
  return result;
}

export function normalizeLead(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(422, 'Ariza ma’lumotlari noto‘g‘ri.');
  const name = cleanText(input.name, 120);
  const phone = cleanText(input.phone, 60);
  const company = cleanText(input.company, 200);
  const email = cleanText(input.email, 254).toLowerCase();
  if (name.length < 2 || !phone || phone.replace(/\D/g, '').length < 5) {
    throw new HttpError(422, 'Ism va to‘g‘ri telefon raqami majburiy.');
  }
  if (email && !validEmail(email)) throw new HttpError(422, 'Email manzili noto‘g‘ri.');

  const payload = Object.create(null);
  let fields = 0;
  for (const [key, value] of Object.entries(input)) {
    if (fields >= 60 || !/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key) || LEAD_SKIP_FIELDS.has(key)) continue;
    if (!['string', 'number', 'boolean'].includes(typeof value)) continue;
    payload[key] = cleanText(value, key === 'comment' ? 4000 : 2000);
    fields += 1;
  }

  const formType = cleanText(input.formType, 60).toLowerCase().replace(/[^a-z0-9_-]/g, '') || (input.quiz ? 'quiz' : 'generic');
  const requiredFields = REQUIRED_BY_FORM[formType] || REQUIRED_BY_FORM.generic;
  for (const field of requiredFields) {
    const value = cleanText(input[field], field === 'comment' ? 4000 : 1000);
    if (!value || (field === 'consent' && !CONSENT_VALUES.has(value.toLowerCase()))) {
      throw new HttpError(422, `Majburiy maydon to‘ldirilmagan: ${field}.`);
    }
  }
  const locale = cleanText(input.locale, 10).toLowerCase();
  return {
    name,
    company,
    phone,
    email,
    formType,
    event: cleanText(input.event, 180),
    locale: ['ru', 'en', 'uz', 'zh', 'tr'].includes(locale) ? locale : '',
    source: cleanText(input.source || input.src, 120),
    page: safePath(input.page || input.url),
    landing: safePath(input.landing),
    referrer: safePath(input.referrer, { includeOrigin: true }),
    utm: cleanUtm(input),
    payload,
  };
}

/** Human-readable Telegram notification. Kept public for tests and downstream integrations. */
export function formatLead(lead = {}) {
  const cut = (value, length = 300) => cleanText(value, length).replace(/[<>&]/g, ' ');
  const fields = lead.payload && typeof lead.payload === 'object' ? { ...lead.payload, ...lead } : lead;
  const get = (key) => fields[key] ?? (lead.payload && typeof lead.payload === 'object' ? lead.payload[key] : undefined);
  const lines = [
    (lead.quiz || lead.payload?.quiz) ? '🎯 Новая заявка-квиз' : lead.formType === 'press' ? '📰 Аккредитация СМИ' : '🎯 Новая заявка',
    '',
    `👤 ${cut(get('name') || '—')}`,
    `🏢 ${cut(get('company') || '—')}`,
    `📞 ${cut(get('phone') || '—')}`,
  ];
  const email = get('email');
  const event = get('event');
  const goal = get('goal');
  const area = get('area');
  const position = get('position');
  const direction = get('direction');
  if (email) lines.push(`✉️ ${cut(email)}`);
  if (event) lines.push(`🎪 ${cut(event)}`);
  if (goal) lines.push(`🎲 Задача: ${cut(goal)}`);
  if (area) lines.push(`📐 Площадь: ${cut(area)}`);
  if (position) lines.push(`💼 ${cut(position)}`);
  if (direction) lines.push(`🧭 Направление: ${cut(direction)}`);
  for (const [key, label] of Object.entries(LEAD_TEXT_FIELDS)) {
    if (['formType', 'event', 'name', 'company', 'phone', 'email', 'goal', 'area', 'position', 'direction', 'channel', 'comment'].includes(key)) continue;
    const value = get(key);
    if (value !== undefined && value !== null && String(value).trim()) lines.push(`${label}: ${cut(value)}`);
  }
  const formType = get('formType');
  if (formType && !['generic', 'press'].includes(formType)) lines.push(`📝 Форма: ${cut(formType, 40)}`);
  const channel = get('channel');
  if (channel) lines.push(`📡 Канал: ${cut(({ call: 'Позвонить', telegram: 'Telegram', whatsapp: 'WhatsApp', email: 'Email' })[channel] || channel)}`);
  if (lead.source || lead.src) lines.push(`📍 Источник: ${cut(lead.source || lead.src, 120)}`);
  const utm = lead.utm && typeof lead.utm === 'object'
    ? Object.entries(lead.utm).map(([key, value]) => `${key}=${cut(value, 80)}`).join(', ')
    : ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].filter((key) => lead[key]).map((key) => `${key}=${cut(lead[key], 80)}`).join(', ');
  if (utm) lines.push(`🏷 UTM: ${utm}`);
  if (lead.landing) lines.push(`🚪 Лендинг: ${cut(lead.landing, 200)}`);
  const comment = get('comment');
  if (comment) lines.push(`💬 ${cut(comment, 800)}`);
  lines.push('', `🔗 ${cut(lead.page || '—', 200)}`, `🕒 ${cut(lead.createdAt || lead.ts || new Date().toISOString(), 40)}`);
  return lines.join('\n').slice(0, 3900);
}

/** Daily analytics summary contract retained for existing integrations/tests. */
export function summarize(events = []) {
  const days = {};
  for (const event of events) {
    if (!event || typeof event.event !== 'string') continue;
    const day = String(event.ts || '').slice(0, 10) || 'unknown';
    const bucket = days[day] ??= { events: {}, forms: {}, sessions: new Set() };
    bucket.events[event.event] = (bucket.events[event.event] || 0) + 1;
    if (event.event === 'form_submit' || event.event === 'quiz_submit') {
      const key = `${event.form || 'quiz'}${event.fallback ? ' (not delivered)' : ''}`;
      bucket.forms[key] = (bucket.forms[key] || 0) + 1;
    }
    if (event.sessionId) bucket.sessions.add(event.sessionId);
  }
  return Object.fromEntries(Object.entries(days).sort(([a], [b]) => a < b ? 1 : -1).map(([day, bucket]) => [day, {
    sessions: bucket.sessions.size,
    events: bucket.events,
    forms: bucket.forms,
  }]));
}

function parseCookies(header = '') {
  const cookies = Object.create(null);
  for (const item of String(header).split(';')) {
    const index = item.indexOf('=');
    if (index < 0) continue;
    const key = item.slice(0, index).trim();
    try { cookies[key] = decodeURIComponent(item.slice(index + 1).trim()); } catch { /* ignore malformed cookie */ }
  }
  return cookies;
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left ?? ''));
  const b = Buffer.from(String(right ?? ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readJson(req, maxBytes = 32_000) {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw new HttpError(415, 'Content-Type application/json talab qilinadi.');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, 'So‘rov hajmi ruxsat etilgan chegaradan oshdi.');
    chunks.push(chunk);
  }
  if (!size) throw new HttpError(400, 'JSON so‘rovi bo‘sh.');
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'JSON formati noto‘g‘ri.');
  }
}

function uploadLimits() {
  return Object.fromEntries(Object.entries(UPLOAD_KINDS).map(([kind, rule]) => [kind, { max: rule.max, megabytes: Math.round(rule.bytes / 1024 / 1024), types: rule.types }]));
}

async function readUpload(req, maxBytes) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > maxBytes) throw new HttpError(413, `Fayl juda katta: ${Math.round(maxBytes / 1024 / 1024)} MB gacha ruxsat etiladi.`);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, `Fayl juda katta: ${Math.round(maxBytes / 1024 / 1024)} MB gacha ruxsat etiladi.`);
    chunks.push(chunk);
  }
  if (!size) throw new HttpError(400, 'Fayl bo‘sh.');
  return Buffer.concat(chunks);
}

/* an uploaded file back to its owner or the organiser: images inline (previews), PDFs as a
   download; nosniff and a sandboxing CSP so a file can never act as a page */
function sendUpload(res, file, absolutePath) {
  if (!existsSync(absolutePath)) throw new HttpError(404, 'Fayl topilmadi.');
  const inline = file.mime.startsWith('image/');
  res.writeHead(200, {
    'Content-Type': file.mime,
    'Content-Length': file.size,
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cache-Control': 'private, no-store',
  });
  createReadStream(absolutePath).pipe(res);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  res.end(body);
}

function sendCsv(res, rows) {
  const columns = ['id', 'createdAt', 'status', 'priority', 'formType', 'event', 'name', 'company', 'phone', 'email', 'locale', 'source', 'page', 'assignee'];
  const cell = (value) => {
    let text = String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`; // spreadsheet formula injection guard
    return `"${text}"`;
  };
  const body = [columns.map(cell).join(','), ...rows.map((row) => columns.map((column) => cell(row[column])).join(','))].join('\r\n');
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="sofexpo-leads.csv"',
    'Content-Length': Buffer.byteLength(`\uFEFF${body}`),
    'Cache-Control': 'no-store',
  });
  res.end(`\uFEFF${body}`);
}

function makeCookie(req, token, maxAge, trustProxy) {
  const secure = req.socket.encrypted || (trustProxy && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https');
  return `sofexpo_admin=${encodeURIComponent(token)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function makePortalCookie(req, token, maxAge, trustProxy) {
  const secure = req.socket.encrypted || (trustProxy && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https');
  return `sofexpo_portal=${encodeURIComponent(token)}; Path=/api/portal; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function sanitizeAnalyticsEvent(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const eventName = cleanText(raw.event, 60);
  if (!VALID_EVENT_NAME.test(eventName)) return null;
  const utm = raw.utm && typeof raw.utm === 'object' ? raw.utm : {};
  const bool = (value) => typeof value === 'boolean' ? Number(value) : null;
  return {
    eventName,
    receivedAt: new Date().toISOString(),
    sessionId: cleanText(raw.sessionId, 100).replace(/[^a-zA-Z0-9_-]/g, ''),
    locale: ['ru', 'en', 'uz', 'zh', 'tr'].includes(cleanText(raw.locale, 10).toLowerCase()) ? cleanText(raw.locale, 10).toLowerCase() : '',
    path: safePath(raw.path),
    formType: cleanText(raw.form || raw.formType, 60),
    source: cleanText(raw.source, 120),
    channel: cleanText(raw.channel, 40),
    cta: cleanText(raw.cta, 120),
    utmSource: cleanText(raw.utm_source || utm.source, 160),
    utmMedium: cleanText(raw.utm_medium || utm.medium, 160),
    utmCampaign: cleanText(raw.utm_campaign || utm.campaign, 160),
    seconds: nullableInteger(raw.seconds ?? raw.timeOnPage, 0, 86_400),
    percent: nullableInteger(raw.percent ?? raw.depth, 0, 100),
    success: bool(raw.success),
    fallback: bool(raw.fallback),
  };
}

function normalizeDateParam(value) {
  const text = cleanText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(`${text}T00:00:00.000Z`)) ? text : '';
}

function parseLeadQuery(url) {
  const page = clamp(url.searchParams.get('page'), 1, 1_000_000, 1);
  const limit = clamp(url.searchParams.get('limit'), 1, 100, 25);
  const status = cleanText(url.searchParams.get('status'), 20);
  const formType = cleanText(url.searchParams.get('form'), 60);
  const search = cleanText(url.searchParams.get('q'), 120);
  const from = normalizeDateParam(url.searchParams.get('from'));
  const to = normalizeDateParam(url.searchParams.get('to'));
  if (status && !LEAD_STATUSES.includes(status)) throw new HttpError(400, 'Status filtri noto emas.');
  return { page, limit, status, formType, search, from, to };
}

export function createLeadServer(options = {}) {
  const host = options.host ?? process.env.LEAD_WEBHOOK_HOST ?? '0.0.0.0';
  const port = Number(options.port ?? process.env.LEAD_WEBHOOK_PORT ?? 8787);
  const adminEmail = options.adminEmail ?? process.env.ADMIN_EMAIL ?? '';
  const adminPassword = options.adminPassword ?? process.env.ADMIN_PASSWORD ?? '';
  const dbPath = options.dbPath ?? process.env.LEAD_WEBHOOK_DB ?? '.data/sofexpo.sqlite';
  const origins = parseOriginList(options.origins ?? process.env.LEAD_WEBHOOK_ORIGINS ?? process.env.LEAD_WEBHOOK_ORIGIN ?? 'https://sofexpo.org');
  const allowedOrigins = new Set(origins.map(originOf).filter(Boolean));
  const wildcardOrigin = origins.includes('*');
  const trustProxy = options.trustProxy ?? process.env.LEAD_WEBHOOK_TRUST_PROXY === '1';
  const ingressSecret = options.ingressSecret ?? process.env.LEAD_WEBHOOK_SECRET ?? '';
  const statsToken = options.statsToken ?? process.env.LEAD_WEBHOOK_STATS_TOKEN ?? '';
  const sessionDays = clamp(options.sessionDays ?? process.env.ADMIN_SESSION_DAYS, 1, 30, 7);
  const portalSessionDays = clamp(options.portalSessionDays ?? process.env.PORTAL_SESSION_DAYS, 1, 30, 14);
  const maxDeliveryAttempts = clamp(options.maxDeliveryAttempts, 1, 20, 8);
  const telegramToken = options.telegramToken ?? process.env.TELEGRAM_BOT_TOKEN ?? '';
  const telegramChat = options.telegramChat ?? process.env.TELEGRAM_CHAT_ID ?? '';
  /* the Bot API host; overridable so a test (or a proxy in a blocked network) can stand in */
  /* exhibitor uploads live next to the database (the same persistent volume on Fly) */
  const uploadDir = resolvePath(options.uploadDir ?? process.env.PORTAL_UPLOAD_DIR ?? join(dirname(dbPath === ':memory:' ? '.data/x' : dbPath), 'uploads'));
  const uploadPath = (storageKey) => {
    const absolute = resolvePath(uploadDir, storageKey);
    if (!absolute.startsWith(uploadDir + '/')) throw new HttpError(400, 'Fayl yo‘li noto‘g‘ri.');
    return absolute;
  };
  const telegramApiBase = String(options.telegramApiBase ?? process.env.TELEGRAM_API_BASE ?? 'https://api.telegram.org').replace(/\/+$/, '');
  const crmWebhookUrl = options.crmWebhookUrl ?? process.env.CRM_WEBHOOK_URL ?? '';
  const crmWebhookToken = options.crmWebhookToken ?? process.env.CRM_WEBHOOK_TOKEN ?? '';
  const deliverProvider = options.deliverProvider;
  const store = options.store ?? new BackendStore({
    dbPath,
    legacyLeadsPath: options.legacyLeadsPath ?? process.env.LEAD_WEBHOOK_STORE ?? '.cache/leads.jsonl',
    legacyEventsPath: options.legacyEventsPath ?? process.env.LEAD_WEBHOOK_EVENTS ?? '.cache/events.jsonl',
    adminEmail,
    adminPassword,
  });
  const rateBuckets = new Map();
  const loginFailures = new Map();
  let workerActive = false;

  const getClientAddress = (req) => {
    if (trustProxy && req.headers['x-forwarded-for']) return String(req.headers['x-forwarded-for']).split(',')[0].trim().slice(0, 100);
    return String(req.socket.remoteAddress || 'unknown').slice(0, 100);
  };
  const rateAllowed = (key, limit, windowMs = 60_000) => {
    const now = Date.now();
    const recent = (rateBuckets.get(key) || []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) return false;
    recent.push(now);
    rateBuckets.set(key, recent);
    if (rateBuckets.size > 10_000) rateBuckets.clear();
    return true;
  };
  const loginAllowed = (ip) => {
    const now = Date.now();
    const data = loginFailures.get(ip) || { hits: [], lockedUntil: 0 };
    data.hits = data.hits.filter((time) => now - time < 10 * 60_000);
    if (data.lockedUntil > now || data.hits.length >= 10) {
      data.lockedUntil = Math.max(data.lockedUntil, now + 10 * 60_000);
      loginFailures.set(ip, data);
      return false;
    }
    loginFailures.set(ip, data);
    return true;
  };
  const loginFailed = (ip) => {
    const data = loginFailures.get(ip) || { hits: [], lockedUntil: 0 };
    data.hits = data.hits.filter((time) => Date.now() - time < 10 * 60_000);
    data.hits.push(Date.now());
    if (data.hits.length >= 10) data.lockedUntil = Date.now() + 10 * 60_000;
    loginFailures.set(ip, data);
    if (loginFailures.size > 10_000) loginFailures.clear();
  };
  const loginSucceeded = (ip) => loginFailures.delete(ip);

  const requestOrigin = (req) => {
    const proto = trustProxy && req.headers['x-forwarded-proto']
      ? String(req.headers['x-forwarded-proto']).split(',')[0].trim()
      : req.socket.encrypted ? 'https' : 'http';
    const forwardedHost = trustProxy && req.headers['x-forwarded-host'] ? String(req.headers['x-forwarded-host']).split(',')[0].trim() : req.headers.host;
    return originOf(`${proto}://${forwardedHost || 'localhost'}`);
  };
  const isAllowedOrigin = (origin, req) => {
    const normalized = originOf(origin);
    if (!normalized) return false;
    return wildcardOrigin || allowedOrigins.has(normalized) || normalized === requestOrigin(req);
  };
  const corsAndSecurity = (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Vary', 'Origin');
    const origin = req.headers.origin;
    if (origin) {
      if (!isAllowedOrigin(origin, req)) return false;
      res.setHeader('Access-Control-Allow-Origin', wildcardOrigin ? origin : originOf(origin));
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    return true;
  };

  const getSession = (req) => {
    const token = parseCookies(req.headers.cookie).sofexpo_admin;
    if (!token || token.length > 200) return null;
    return store.findSession(hashToken(token));
  };
  const getPortalSession = (req) => {
    const token = parseCookies(req.headers.cookie).sofexpo_portal;
    if (!token || token.length > 200) return null;
    return store.findPortalSession(hashToken(token));
  };
  const portalAccountResponse = (account) => ({
    id: account.id,
    email: account.email,
    accountType: account.accountType,
    profile: {
      name: account.name,
      phone: account.phone,
      company: account.company,
      country: account.country,
      industry: account.industry,
      website: account.website,
      interests: account.interests,
    },
  });
  const issuePortalSession = (req, res, account) => {
    const sessionToken = createSecret(32);
    const csrfToken = createSecret(32);
    const expiresAt = new Date(Date.now() + portalSessionDays * 24 * 60 * 60 * 1000).toISOString();
    store.createPortalSession({ id: hashToken(sessionToken), accountId: account.id, csrfHash: hashToken(csrfToken), expiresAt });
    store.updatePortalLastLogin(account.id);
    res.setHeader('Set-Cookie', makePortalCookie(req, sessionToken, portalSessionDays * 24 * 60 * 60, trustProxy));
    return { ok: true, user: portalAccountResponse(store.getPortalAccountById(account.id)), csrfToken };
  };
  const requirePortalSession = (req) => {
    const session = getPortalSession(req);
    if (!session) throw new HttpError(401, 'Sessiya tugagan. Qayta kiring.');
    return session;
  };
  const requireSession = (req) => {
    const session = getSession(req);
    if (!session) throw new HttpError(401, 'Sessiya tugagan. Qayta kiring.');
    return session;
  };
  const requireAdmin = (session) => {
    if (session.role !== 'admin') throw new HttpError(403, 'Bu amal uchun administrator huquqi kerak.');
  };
  const verifyCsrf = (req, session) => {
    const origin = req.headers.origin;
    if (origin && !isAllowedOrigin(origin, req)) throw new HttpError(403, 'So‘rov manbasi ruxsat etilmagan.');
    const token = String(req.headers['x-csrf-token'] || '');
    if (!token || !secureEqual(hashToken(token), session.csrf_hash)) throw new HttpError(403, 'Xavfsizlik tokeni yaroqsiz. Sahifani yangilang.');
  };
  const checkIngressSecret = (req, url) => {
    if (!ingressSecret) return true;
    const header = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const query = url.searchParams.get('key') || '';
    return secureEqual(header, ingressSecret) || secureEqual(query, ingressSecret);
  };

  /* Telegram says why it refused ("chat not found", "bot was blocked by the user", "Too Many
     Requests: retry after 17"); that sentence is what the admin needs to fix the bot, so it is
     kept in the error, and a 429's retry_after becomes the next attempt's delay. */
  async function sendTelegram(text) {
    const response = await fetch(`${telegramApiBase}/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramChat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      const reason = cleanText(result?.description || (response.ok ? 'rejected the message' : `HTTP ${response.status}`), 300);
      const error = new Error(`Telegram ${response.status}: ${reason}`);
      const retryAfter = Number(result?.parameters?.retry_after);
      if (Number.isFinite(retryAfter) && retryAfter > 0) error.retryAfterMs = retryAfter * 1000;
      throw error;
    }
    return result.result;
  }

  async function sendCrm(lead) {
    const url = new URL(crmWebhookUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('CRM webhook URL is invalid');
    const headers = { 'Content-Type': 'application/json', 'X-SOFEXPO-Lead-ID': lead.id };
    if (crmWebhookToken) headers.Authorization = `Bearer ${crmWebhookToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...lead.payload, ...lead, payload: undefined }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`CRM webhook HTTP ${response.status}`);
  }

  async function processOutbox() {
    if (workerActive) return;
    workerActive = true;
    try {
      for (const job of store.dueDeliveries(5)) {
        if (!store.markDeliverySending(job.id)) continue;
        const attempts = Number(job.attempts) + 1;
        try {
          const lead = job.payload?.lead || {};
          if (typeof deliverProvider === 'function') await deliverProvider(job.provider, lead);
          else if (job.provider === 'telegram' && telegramToken && telegramChat) await sendTelegram(formatLead(lead));
          else if (job.provider === 'crm' && crmWebhookUrl) await sendCrm(lead);
          else throw new Error(`Provider ${job.provider} is not configured`);
          store.completeDelivery(job.id);
          console.info(`[lead-backend] delivery ${job.id} (${job.provider}) sent`);
        } catch (error) {
          const message = cleanText(error?.message || 'Delivery failed', 500);
          store.failDelivery(job.id, attempts, message, maxDeliveryAttempts, error?.retryAfterMs);
          console.error(`[lead-backend] delivery ${job.id} (${job.provider}) failed: ${message}`);
        }
      }
    } catch (error) {
      console.error('[lead-backend] outbox worker error:', error?.message || error);
    } finally {
      workerActive = false;
    }
  }

  async function handleRequest(req, res) {
    if (!corsAndSecurity(req, res)) return sendJson(res, 403, { ok: false, error: 'Origin not allowed' });
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, Idempotency-Key',
        'Access-Control-Max-Age': '600',
      });
      return res.end();
    }

    let url;
    try { url = new URL(req.url || '/', requestOrigin(req) || 'http://localhost'); } catch { throw new HttpError(400, 'URL noto‘g‘ri.'); }
    const path = url.pathname.replace(/\/{2,}/g, '/');

    if (req.method === 'GET' && (path === '/health' || path === '/healthz')) {
      return sendJson(res, 200, { ok: true, service: 'sofexpo-lead-backend', time: new Date().toISOString() });
    }

    if (req.method === 'GET' && SHARED_FILES[path]) {
      const file = SHARED_FILES[path];
      const body = readFileSync(file);
      res.writeHead(200, {
        'Content-Type': CONTENT_TYPES[extname(file)] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': extname(file) === '.css' ? 'public, max-age=300' : 'public, max-age=604800',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(body);
    }

    const adminFiles = {
      '/admin': 'index.html',
      '/admin/': 'index.html',
      '/admin/app.css': 'app.css',
      '/admin/app.js': 'app.js',
    };
    if (req.method === 'GET' && adminFiles[path]) {
      const file = `${ADMIN_DIR}${adminFiles[path]}`;
      const body = readFileSync(file);
      res.writeHead(200, {
        'Content-Type': CONTENT_TYPES[extname(file)] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': path === '/admin/app.js' || path === '/admin/app.css' ? 'public, max-age=300' : 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
      });
      return res.end(body);
    }

    const portalFiles = {
      '/cabinet': 'index.html',
      '/cabinet/': 'index.html',
      '/cabinet/app.css': 'app.css',
      '/cabinet/app.js': 'app.js',
      '/cabinet/i18n.js': 'i18n.js',
    };
    if (req.method === 'GET' && portalFiles[path]) {
      const file = `${PORTAL_DIR}${portalFiles[path]}`;
      const body = readFileSync(file);
      res.writeHead(200, {
        'Content-Type': CONTENT_TYPES[extname(file)] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': ['/cabinet/app.js', '/cabinet/app.css', '/cabinet/i18n.js'].includes(path) ? 'public, max-age=300' : 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
      });
      return res.end(body);
    }

    if (req.method === 'POST' && ['/lead', '/api/lead', '/'].includes(path)) {
      if (!checkIngressSecret(req, url)) throw new HttpError(401, 'Endpoint kaliti noto‘g‘ri.');
      if (!rateAllowed(`lead:${getClientAddress(req)}`, 10)) throw new HttpError(429, 'Juda ko‘p so‘rov. Birozdan so‘ng qayta urinib ko‘ring.');
      const lead = normalizeLead(await readJson(req, 32_000));
      const providers = [];
      if (telegramToken && telegramChat) providers.push('telegram');
      if (crmWebhookUrl) providers.push('crm');
      const saved = store.createLead(lead, providers);
      console.info(`[lead-backend] saved lead ${saved.id} (${saved.formType})`);
      void processOutbox();
      return sendJson(res, 202, { ok: true, id: saved.id, status: 'stored' });
    }

    if (req.method === 'POST' && ['/event', '/api/event'].includes(path)) {
      if (!checkIngressSecret(req, url)) throw new HttpError(401, 'Endpoint kaliti noto‘g‘ri.');
      if (!rateAllowed(`event:${getClientAddress(req)}`, 120)) throw new HttpError(429, 'Juda ko‘p so‘rov.');
      const body = await readJson(req, 256_000);
      const events = Array.isArray(body?.events) ? body.events.slice(0, 500).map(sanitizeAnalyticsEvent).filter(Boolean) : [];
      const stored = store.addEvents(events);
      return sendJson(res, 202, { ok: true, stored });
    }

    if (req.method === 'GET' && path === '/stats') {
      const session = getSession(req);
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!session && (!statsToken || !secureEqual(bearer, statsToken))) throw new HttpError(401, 'Admin sessiyasi talab qilinadi.');
      return sendJson(res, 200, { ok: true, days: store.eventSummary() });
    }

    if (path === '/api/admin/status' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, setupRequired: !store.hasActiveAdmin() });
    }

    if (path === '/api/admin/login' && req.method === 'POST') {
      const ip = getClientAddress(req);
      if (!loginAllowed(ip)) throw new HttpError(429, 'Urinishlar vaqtincha bloklandi. 10 daqiqadan so‘ng qayta urinib ko‘ring.');
      if (!store.hasActiveAdmin()) throw new HttpError(503, 'Admin foydalanuvchi sozlanmagan. Serverda ADMIN_EMAIL va ADMIN_PASSWORD kiriting.');
      const body = await readJson(req, 8_000);
      const email = normalizeEmail(body.email);
      const user = store.findUserByEmail(email);
      const valid = Boolean(user && user.active && verifyPassword(String(body.password ?? ''), user.password_salt, user.password_hash));
      if (!valid) {
        loginFailed(ip);
        throw new HttpError(401, 'Email yoki parol noto‘g‘ri.');
      }
      loginSucceeded(ip);
      const sessionToken = createSecret(32);
      const csrfToken = createSecret(32);
      const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();
      store.createSession({ id: hashToken(sessionToken), userId: user.id, csrfHash: hashToken(csrfToken), expiresAt });
      store.updateLastLogin(user.id);
      res.setHeader('Set-Cookie', makeCookie(req, sessionToken, sessionDays * 24 * 60 * 60, trustProxy));
      return sendJson(res, 200, { ok: true, user: { id: user.id, email: user.email, role: user.role }, csrfToken });
    }

    if (req.method === 'GET' && path === '/api/portal/options') {
      return sendJson(res, 200, { ok: true, events: PORTAL_EVENTS });
    }

    if (req.method === 'POST' && path === '/api/portal/register') {
      const ip = getClientAddress(req);
      if (!rateAllowed(`portal-register:${ip}`, 5, 60 * 60_000)) throw new HttpError(429, 'Ro‘yxatdan o‘tish urinishlari ko‘p. Keyinroq qayta urinib ko‘ring.');
      const body = await readJson(req, 12_000);
      const accountType = cleanText(body.accountType, 20);
      if (!['visitor', 'exhibitor'].includes(accountType)) throw new HttpError(422, 'Kabinet turini tanlang.');
      const email = normalizeEmail(body.email);
      const password = String(body.password ?? '');
      if (!validEmail(email)) throw new HttpError(422, 'Email manzili noto‘g‘ri.');
      if (!validPassword(password)) throw new HttpError(422, 'Parol kamida 12 ta belgidan iborat bo‘lishi kerak.');
      if (!CONSENT_VALUES.has(String(body.consent ?? '').toLowerCase())) throw new HttpError(422, 'Shaxsiy ma’lumotlarni qayta ishlashga rozilik kerak.');
      if (store.findPortalAccountByEmail(email) || store.findUserByEmail(email)) throw new HttpError(409, 'Bu email bilan hisob mavjud. Tizimga kiring.');
      const profile = {
        name: cleanText(body.name, 120),
        phone: cleanText(body.phone, 60),
        company: cleanText(body.company, 200),
        country: cleanText(body.country, 100),
        industry: cleanText(body.industry, 160),
        website: cleanText(body.website, 300),
        interests: cleanText(body.interests, 500),
      };
      if (profile.name.length < 2 || profile.phone.replace(/\D/g, '').length < 5) throw new HttpError(422, 'Ism va telefon raqamini to‘g‘ri kiriting.');
      if (accountType === 'exhibitor' && (!profile.company || !profile.industry)) throw new HttpError(422, 'Eksponent uchun kompaniya va faoliyat sohasi majburiy.');
      if (profile.website) {
        try {
          const website = new URL(profile.website);
          if (!['http:', 'https:'].includes(website.protocol) || website.username || website.password) throw new Error('invalid');
          profile.website = website.origin + website.pathname.slice(0, 180);
        } catch { throw new HttpError(422, 'Kompaniya sayti http:// yoki https:// bilan boshlansin.'); }
      }
      let account;
      try { account = store.createPortalAccount({ email, password, accountType, profile }); } catch (error) {
        if (String(error?.message).includes('UNIQUE')) throw new HttpError(409, 'Bu email bilan hisob mavjud. Tizimga kiring.');
        throw error;
      }
      loginSucceeded(`portal:${ip}`);
      return sendJson(res, 201, issuePortalSession(req, res, account));
    }

    if (req.method === 'POST' && path === '/api/portal/login') {
      const ip = `portal:${getClientAddress(req)}`;
      if (!loginAllowed(ip)) throw new HttpError(429, 'Urinishlar vaqtincha bloklandi. 10 daqiqadan so‘ng qayta urinib ko‘ring.');
      const body = await readJson(req, 8_000);
      const email = normalizeEmail(body.email);
      const account = store.findPortalAccountByEmail(email);
      const valid = Boolean(account && account.active && verifyPassword(String(body.password ?? ''), account.password_salt, account.password_hash));
      if (!valid) {
        loginFailed(ip);
        throw new HttpError(401, 'Email yoki parol noto‘g‘ri.');
      }
      loginSucceeded(ip);
      return sendJson(res, 200, issuePortalSession(req, res, store.getPortalAccountById(account.id)));
    }

    if (path.startsWith('/api/portal/')) {
      const session = requirePortalSession(req);

      if (req.method === 'GET' && path === '/api/portal/me') {
        const csrfToken = createSecret(32);
        store.db.prepare('UPDATE portal_sessions SET csrf_hash = ? WHERE id = ?').run(hashToken(csrfToken), session.session_id);
        const account = store.getPortalAccountById(session.account_id);
        return sendJson(res, 200, { ok: true, user: portalAccountResponse(account), csrfToken });
      }

      if (req.method === 'POST' && path === '/api/portal/logout') {
        verifyCsrf(req, session);
        store.deletePortalSession(session.session_id);
        res.setHeader('Set-Cookie', makePortalCookie(req, '', 0, trustProxy));
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === 'PATCH' && path === '/api/portal/profile') {
        verifyCsrf(req, session);
        const body = await readJson(req, 12_000);
        const current = store.getPortalAccountById(session.account_id);
        if (!current) throw new HttpError(401, 'Kabinet topilmadi.');
        const profile = {
          name: cleanText(body.name ?? current.name, 120),
          phone: cleanText(body.phone ?? current.phone, 60),
          company: cleanText(body.company ?? current.company, 200),
          country: cleanText(body.country ?? current.country, 100),
          industry: cleanText(body.industry ?? current.industry, 160),
          website: cleanText(body.website ?? current.website, 300),
          interests: cleanText(body.interests ?? current.interests, 500),
        };
        if (profile.name.length < 2 || profile.phone.replace(/\D/g, '').length < 5) throw new HttpError(422, 'Ism va telefon raqamini to‘g‘ri kiriting.');
        if (current.accountType === 'exhibitor' && (!profile.company || !profile.industry)) throw new HttpError(422, 'Kompaniya va faoliyat sohasi majburiy.');
        if (profile.website) {
          try {
            const website = new URL(profile.website);
            if (!['http:', 'https:'].includes(website.protocol) || website.username || website.password) throw new Error('invalid');
            profile.website = website.origin + website.pathname.slice(0, 180);
          } catch { throw new HttpError(422, 'Kompaniya sayti http:// yoki https:// bilan boshlansin.'); }
        }
        const account = store.updatePortalProfile(session.account_id, profile, session.email);
        return sendJson(res, 200, { ok: true, user: portalAccountResponse(account) });
      }

      /* ---------- exhibitor company profile: text, logo, flyers, catalogue, photos ---------- */
      if (path === '/api/portal/company' || path.startsWith('/api/portal/files')) {
        const owner = store.getPortalAccountById(session.account_id);
        if (!owner) throw new HttpError(401, 'Kabinet topilmadi.');
        if (owner.accountType !== 'exhibitor') throw new HttpError(403, 'Kompaniya profili faqat eksponentlar uchun.');

        if (req.method === 'GET' && path === '/api/portal/company') {
          return sendJson(res, 200, { ok: true, company: store.getExhibitorCompany(owner.id), limits: uploadLimits(), events: PORTAL_EVENTS });
        }

        if (req.method === 'PUT' && path === '/api/portal/company') {
          verifyCsrf(req, session);
          const body = await readJson(req, 20_000);
          const fields = {
            brandName: cleanText(body.brandName, 120),
            description: cleanText(body.description, 2000),
            products: cleanText(body.products, 1000),
            website: cleanText(body.website, 300),
            instagram: cleanText(body.instagram, 120),
            telegram: cleanText(body.telegram, 120),
            contactName: cleanText(body.contactName, 120),
            contactPhone: cleanText(body.contactPhone, 60),
            contactEmail: normalizeEmail(cleanText(body.contactEmail, 200)),
            event: cleanText(body.event, 60),
            stand: cleanText(body.stand, 40),
          };
          if (fields.website) {
            try {
              const website = new URL(fields.website);
              if (!['http:', 'https:'].includes(website.protocol) || website.username || website.password) throw new Error('invalid');
              fields.website = website.origin + website.pathname.slice(0, 180);
            } catch { throw new HttpError(422, 'Sayt manzili http:// yoki https:// bilan boshlansin.'); }
          }
          if (fields.contactEmail && !validEmail(fields.contactEmail)) throw new HttpError(422, 'Kontakt email manzili noto‘g‘ri.');
          if (fields.event && !PORTAL_EVENTS.some((item) => item.slug === fields.event)) throw new HttpError(422, 'Ko‘rgazmani ro‘yxatdan tanlang.');
          const submit = body.submit === true;
          if (submit) {
            const missing = [];
            if (!fields.brandName) missing.push('brend nomi');
            if (fields.description.length < 40) missing.push('kompaniya haqida kamida 40 belgi');
            if (!fields.event) missing.push('ko‘rgazma');
            if (!store.exhibitorFileUsage(owner.id).byKind.logo) missing.push('logotip');
            if (missing.length) throw new HttpError(422, `Tekshiruvga yuborish uchun to‘ldiring: ${missing.join(', ')}.`);
          }
          const company = store.saveExhibitorCompany(owner.id, fields, { submit });
          if (submit) store.audit(owner.email, 'exhibitor_profile.submit', 'portal_account', owner.id, { brandName: fields.brandName, event: fields.event });
          return sendJson(res, 200, { ok: true, company });
        }

        if (req.method === 'POST' && path === '/api/portal/files') {
          verifyCsrf(req, session);
          if (!rateAllowed(`portal-upload:${owner.id}`, 60, 60 * 60_000)) throw new HttpError(429, 'Yuklashlar soni ko‘p. Birozdan keyin urinib ko‘ring.');
          const kind = cleanText(url.searchParams.get('kind'), 20);
          const rule = UPLOAD_KINDS[kind];
          if (!rule) throw new HttpError(422, 'Fayl turi noto‘g‘ri: logo, flyer, catalog yoki photo.');
          const usage = store.exhibitorFileUsage(owner.id);
          if (kind !== 'logo' && (usage.byKind[kind] || 0) >= rule.max) throw new HttpError(422, `Bu bo‘limga ko‘pi bilan ${rule.max} ta fayl yuklash mumkin.`);
          const buffer = await readUpload(req, rule.bytes);
          const mime = sniffUpload(buffer);
          if (!mime || !rule.types.includes(mime)) {
            throw new HttpError(415, kind === 'catalog' ? 'Katalog PDF formatida bo‘lishi kerak.' : kind === 'flyer' ? 'Flayer PDF, PNG, JPG yoki WebP bo‘lishi kerak.' : 'Rasm PNG, JPG yoki WebP bo‘lishi kerak.');
          }
          const previousLogo = kind === 'logo' ? store.listExhibitorFiles(owner.id).filter((f) => f.kind === 'logo') : [];
          const freed = previousLogo.reduce((sum, f) => sum + f.size, 0);
          if (usage.bytes - freed + buffer.length > UPLOAD_QUOTA_BYTES) throw new HttpError(413, 'Kabinetdagi fayllar hajmi 120 MB dan oshib ketadi. Eskisini o‘chiring.');
          let rawName = String(req.headers['x-file-name'] || '');
          try { rawName = decodeURIComponent(rawName); } catch { /* keep as sent */ }
          const base = cleanText(rawName.split(/[\\/]/).pop().replace(/\.[a-z0-9]{1,5}$/i, ''), 100).replace(/[^\p{L}\p{N} ._()-]+/gu, '').trim() || kind;
          const id = randomUUID();
          const storageKey = `${owner.id}/${id}${UPLOAD_EXT[mime]}`;
          const absolute = uploadPath(storageKey);
          mkdirSync(dirname(absolute), { recursive: true });
          writeFileSync(absolute, buffer, { flag: 'wx' });
          const file = store.addExhibitorFile({
            id, accountId: owner.id, kind, fileName: `${base}${UPLOAD_EXT[mime]}`, mime, size: buffer.length,
            sha256: createHash('sha256').update(buffer).digest('hex'), storageKey,
          });
          for (const old of previousLogo) {
            const removed = store.deleteExhibitorFile(old.id);
            if (removed) try { unlinkSync(uploadPath(removed.storageKey)); } catch { /* already gone */ }
          }
          return sendJson(res, 201, { ok: true, file: { id: file.id, kind: file.kind, fileName: file.fileName, mime: file.mime, size: file.size, createdAt: file.createdAt } });
        }

        const ownFile = path.match(/^\/api\/portal\/files\/([a-f0-9-]{36})$/i);
        if (ownFile) {
          const file = store.getExhibitorFile(ownFile[1]);
          if (!file || file.accountId !== owner.id) throw new HttpError(404, 'Fayl topilmadi.');
          if (req.method === 'GET') return sendUpload(res, file, uploadPath(file.storageKey));
          if (req.method === 'DELETE') {
            verifyCsrf(req, session);
            store.deleteExhibitorFile(file.id);
            try { unlinkSync(uploadPath(file.storageKey)); } catch { /* already gone */ }
            return sendJson(res, 200, { ok: true });
          }
        }
        throw new HttpError(405, 'Bu amal qo‘llab-quvvatlanmaydi.');
      }

      if (req.method === 'GET' && path === '/api/portal/requests') {
        return sendJson(res, 200, { ok: true, items: store.listPortalRequests(session.account_id) });
      }

      if (req.method === 'POST' && path === '/api/portal/requests') {
        verifyCsrf(req, session);
        if (!rateAllowed(`portal-request:${session.account_id}`, 10, 60 * 60_000)) throw new HttpError(429, 'So‘rovlar soni ko‘p. Birozdan keyin urinib ko‘ring.');
        const body = await readJson(req, 12_000);
        const event = PORTAL_EVENTS.find((item) => item.slug === cleanText(body.event, 60));
        if (!event) throw new HttpError(422, 'Ro‘yxatdan tadbirni tanlang.');
        if (!CONSENT_VALUES.has(String(body.consent ?? '').toLowerCase())) throw new HttpError(422, 'Ushbu murojaatni yuborishga rozilik bering.');
        const account = store.getPortalAccountById(session.account_id);
        if (!account) throw new HttpError(401, 'Kabinet topilmadi.');
        const message = cleanText(body.message, 2000);
        let details;
        let payload;
        if (account.accountType === 'exhibitor') {
          const areaNumber = Number(body.area);
          const packageName = cleanText(body.package, 80);
          if (!Number.isFinite(areaNumber) || areaNumber < 1 || areaNumber > 10_000) throw new HttpError(422, 'Maydonni 1–10 000 m² oralig‘ida kiriting.');
          if (!packageName) throw new HttpError(422, 'Ishtirok formatini tanlang.');
          details = { industry: account.industry, area: `${areaNumber} m²`, package: packageName, message };
          payload = { portalAccountType: account.accountType, industry: account.industry, country: account.country, area: details.area, package: packageName, comment: message };
        } else {
          const interest = cleanText(body.interest, 160);
          if (!interest) throw new HttpError(422, 'Qiziqish yo‘nalishini kiriting.');
          details = { interest, message };
          payload = { portalAccountType: account.accountType, country: account.country, industry: account.industry, interest, comment: message };
        }
        const providers = [];
        if (telegramToken && telegramChat) providers.push('telegram');
        if (crmWebhookUrl) providers.push('crm');
        const request = store.createPortalRequest({
          accountId: account.id,
          requestType: account.accountType,
          event: event.name,
          details,
          providers,
          lead: {
            name: account.name,
            company: account.company,
            phone: account.phone,
            email: account.email,
            formType: account.accountType,
            event: event.name,
            locale: ['ru', 'en', 'uz', 'zh', 'tr'].includes(cleanText(body.locale, 10)) ? cleanText(body.locale, 10) : 'uz',
            source: account.accountType === 'exhibitor' ? 'Portal: eksponent' : 'Portal: mehmon',
            page: '/cabinet',
            landing: '',
            referrer: '',
            utm: {},
            payload,
          },
        });
        void processOutbox();
        return sendJson(res, 201, { ok: true, request });
      }

      throw new HttpError(404, 'Portal API manzili topilmadi.');
    }

    if (path.startsWith('/api/admin/')) {
      const session = requireSession(req);

      if (req.method === 'GET' && path === '/api/admin/me') {
        const csrfToken = createSecret(32);
        store.db.prepare('UPDATE sessions SET csrf_hash = ? WHERE id = ?').run(hashToken(csrfToken), session.session_id);
        return sendJson(res, 200, { ok: true, user: { id: session.user_id, email: session.email, role: session.role }, csrfToken });
      }

      if (req.method === 'POST' && path === '/api/admin/logout') {
        verifyCsrf(req, session);
        store.deleteSession(session.session_id);
        res.setHeader('Set-Cookie', makeCookie(req, '', 0, trustProxy));
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === 'GET' && path === '/api/admin/dashboard') {
        return sendJson(res, 200, { ok: true, ...store.dashboard(clamp(url.searchParams.get('days'), 1, 90, 30)) });
      }

      if (req.method === 'GET' && path === '/api/admin/analytics') {
        return sendJson(res, 200, { ok: true, ...store.analytics(clamp(url.searchParams.get('days'), 1, 90, 30)) });
      }

      if (req.method === 'GET' && path === '/api/admin/exhibitor-profiles') {
        const status = cleanText(url.searchParams.get('status'), 20);
        if (status && !['draft', 'submitted', 'approved', 'changes'].includes(status)) throw new HttpError(422, 'Holat filtri noto‘g‘ri.');
        return sendJson(res, 200, { ok: true, ...store.listExhibitorCompanies({ status }) });
      }

      const adminFile = path.match(/^\/api\/admin\/files\/([a-f0-9-]{36})$/i);
      if (adminFile && req.method === 'GET') {
        const file = store.getExhibitorFile(adminFile[1]);
        if (!file) throw new HttpError(404, 'Fayl topilmadi.');
        return sendUpload(res, file, uploadPath(file.storageKey));
      }

      const companyReview = path.match(/^\/api\/admin\/portal-accounts\/([a-f0-9-]{36})\/company$/i);
      if (companyReview && req.method === 'PATCH') {
        verifyCsrf(req, session);
        const body = await readJson(req, 8_000);
        const status = cleanText(body.status, 20);
        if (!COMPANY_STATUSES.has(status)) throw new HttpError(422, 'Holat approved yoki changes bo‘lishi kerak.');
        const note = cleanText(body.note, 1000);
        if (status === 'changes' && note.length < 5) throw new HttpError(422, 'Eksponentga nimani tuzatish kerakligini yozing.');
        const company = store.reviewExhibitorCompany(companyReview[1], { status, note }, session.email);
        if (!company) throw new HttpError(404, 'Kompaniya profili hali to‘ldirilmagan.');
        return sendJson(res, 200, { ok: true, company });
      }

      if (req.method === 'GET' && path === '/api/admin/portal-accounts') {
        const accountType = cleanText(url.searchParams.get('type'), 20);
        const active = url.searchParams.get('active') ?? '';
        if (accountType && !['visitor', 'exhibitor'].includes(accountType)) throw new HttpError(422, 'Kabinet turi noto‘g‘ri.');
        if (active && !['0', '1'].includes(active)) throw new HttpError(422, 'Hisob holati filtri noto‘g‘ri.');
        return sendJson(res, 200, {
          ok: true,
          ...store.listPortalAccounts({
            page: clamp(url.searchParams.get('page'), 1, 1_000_000, 1),
            limit: clamp(url.searchParams.get('limit'), 1, 50, 25),
            accountType,
            active,
            search: cleanText(url.searchParams.get('q'), 200),
          }),
        });
      }

      const portalAccountMatch = path.match(/^\/api\/admin\/portal-accounts\/([a-f0-9-]{36})$/i);
      if (portalAccountMatch) {
        const accountId = portalAccountMatch[1];
        if (req.method === 'GET') {
          const account = store.getPortalAccountDetails(accountId);
          if (!account) throw new HttpError(404, 'Kabinet hisobi topilmadi.');
          return sendJson(res, 200, { ok: true, account });
        }
        if (req.method === 'PATCH') {
          requireAdmin(session);
          verifyCsrf(req, session);
          const body = await readJson(req, 8_000);
          if (typeof body.active !== 'boolean') throw new HttpError(422, 'Hisob faolligi true yoki false bo‘lishi kerak.');
          const result = store.updatePortalAccount(accountId, { active: body.active }, session.email);
          if (!result) throw new HttpError(404, 'Kabinet hisobi topilmadi.');
          return sendJson(res, 200, { ok: true, ...result });
        }
      }

      if (req.method === 'GET' && path === '/api/admin/leads') {
        return sendJson(res, 200, { ok: true, ...store.listLeads(parseLeadQuery(url)) });
      }

      if (req.method === 'GET' && path === '/api/admin/leads/export.csv') {
        const { items, total } = store.listLeads({ ...parseLeadQuery(url), page: 1, limit: 10_000 });
        if (total > items.length) throw new HttpError(413, 'Eksport uchun 10 000 ta ariza limiti oshdi. Filtrni toraytiring.');
        sendCsv(res, items);
        return;
      }

      const leadMatch = path.match(/^\/api\/admin\/leads\/([a-f0-9-]{36})(?:\/(notes))?$/i);
      if (leadMatch) {
        const leadId = leadMatch[1];
        if (req.method === 'GET' && !leadMatch[2]) {
          const lead = store.getLead(leadId);
          if (!lead) throw new HttpError(404, 'Lid topilmadi.');
          return sendJson(res, 200, { ok: true, lead });
        }
        if (req.method === 'PATCH' && !leadMatch[2]) {
          verifyCsrf(req, session);
          const body = await readJson(req, 8_000);
          const patch = {};
          if (body.status !== undefined) {
            if (!LEAD_STATUSES.includes(body.status)) throw new HttpError(422, 'Lid statusi noto‘g‘ri.');
            patch.status = body.status;
          }
          if (body.priority !== undefined) {
            if (!LEAD_PRIORITIES.includes(body.priority)) throw new HttpError(422, 'Ustuvorlik noto‘g‘ri.');
            patch.priority = body.priority;
          }
          if (body.assignee !== undefined) patch.assignee = cleanText(body.assignee, 120);
          if (!Object.keys(patch).length) throw new HttpError(422, 'Yangilash uchun maydon topilmadi.');
          const lead = store.updateLead(leadId, patch, session.email);
          if (!lead) throw new HttpError(404, 'Lid topilmadi.');
          return sendJson(res, 200, { ok: true, lead });
        }
        if (req.method === 'POST' && leadMatch[2] === 'notes') {
          verifyCsrf(req, session);
          const body = await readJson(req, 8_000);
          const text = cleanText(body.body, 4000);
          if (!text) throw new HttpError(422, 'Izoh matni bo‘sh bo‘lmasligi kerak.');
          const note = store.addLeadNote(leadId, { userId: session.user_id, authorEmail: session.email, body: text });
          if (!note) throw new HttpError(404, 'Lid topilmadi.');
          return sendJson(res, 201, { ok: true, note });
        }
      }

      if (req.method === 'POST' && path === '/api/admin/system/telegram-test') {
        requireAdmin(session);
        verifyCsrf(req, session);
        if (!telegramToken || !telegramChat) {
          return sendJson(res, 200, { ok: false, configured: false, error: 'TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID o‘rnatilmagan.' });
        }
        try {
          const message = await sendTelegram(`✅ SOF EXPO: bot ulangan. Test xabar ${new Date().toISOString()} da ${session.email} tomonidan yuborildi.`);
          store.audit(session.email, 'system.telegram_test', 'system', 'telegram', { ok: true });
          return sendJson(res, 200, { ok: true, configured: true, messageId: message?.message_id ?? null });
        } catch (error) {
          return sendJson(res, 200, { ok: false, configured: true, error: cleanText(error?.message || 'Telegram xatosi', 300) });
        }
      }

      if (req.method === 'GET' && path === '/api/admin/system') {
        requireAdmin(session);
        return sendJson(res, 200, {
          ok: true,
          node: process.version,
          storage: 'sqlite',
          providers: {
            telegram: Boolean(telegramToken && telegramChat),
            crm: Boolean(crmWebhookUrl),
          },
          outbox: store.outboxStats(),
          recentDeliveries: store.listFailedDeliveries(20),
          adminUsers: store.listUsers().length,
        });
      }

      if (req.method === 'GET' && path === '/api/admin/audit') {
        requireAdmin(session);
        const from = normalizeDateParam(url.searchParams.get('from'));
        const to = normalizeDateParam(url.searchParams.get('to'));
        if (from && to && from > to) throw new HttpError(422, 'Sana oralig‘i noto‘g‘ri.');
        return sendJson(res, 200, {
          ok: true,
          ...store.listAudit({
            page: clamp(url.searchParams.get('page'), 1, 1_000_000, 1),
            limit: clamp(url.searchParams.get('limit'), 1, 100, 25),
            actorEmail: normalizeEmail(cleanText(url.searchParams.get('actor'), 254)),
            action: cleanText(url.searchParams.get('action'), 80),
            entityType: cleanText(url.searchParams.get('entity'), 80),
            search: cleanText(url.searchParams.get('q'), 200),
            from,
            to,
          }),
        });
      }

      if (req.method === 'POST' && path === '/api/admin/outbox/retry') {
        requireAdmin(session);
        verifyCsrf(req, session);
        const retried = store.retryFailedDeliveries();
        store.recordAudit(session.email, 'outbox.retry', 'delivery_outbox', 'failed', { retried });
        void processOutbox();
        return sendJson(res, 200, { ok: true, retried });
      }

      if (path === '/api/admin/users') {
        requireAdmin(session);
        if (req.method === 'GET') return sendJson(res, 200, { ok: true, users: store.listUsers() });
        if (req.method === 'POST') {
          verifyCsrf(req, session);
          const body = await readJson(req, 8_000);
          const email = normalizeEmail(body.email);
          const password = String(body.password ?? '');
          const role = body.role ?? 'manager';
          if (!validEmail(email)) throw new HttpError(422, 'Email manzili noto‘g‘ri.');
          if (!validPassword(password)) throw new HttpError(422, 'Parol kamida 12 ta belgidan iborat bo‘lishi kerak.');
          if (!USER_ROLES.includes(role)) throw new HttpError(422, 'Foydalanuvchi roli noto‘g‘ri.');
          if (store.findUserByEmail(email) || store.findPortalAccountByEmail(email)) throw new HttpError(409, 'Bu email bilan hisob mavjud.');
          let user;
          try { user = store.createUser({ email, password, role }); } catch (error) {
            if (String(error?.message).includes('UNIQUE')) throw new HttpError(409, 'Bu email bilan foydalanuvchi mavjud.');
            throw error;
          }
          store.recordAudit(session.email, 'user.create', 'user', user.id, { email: user.email, role: user.role });
          return sendJson(res, 201, { ok: true, user: store.getUserById(user.id) });
        }
      }

      const userMatch = path.match(/^\/api\/admin\/users\/([a-f0-9-]{36})$/i);
      if (userMatch && req.method === 'PATCH') {
        requireAdmin(session);
        verifyCsrf(req, session);
        const body = await readJson(req, 8_000);
        const current = store.getUserById(userMatch[1]);
        if (!current) throw new HttpError(404, 'Foydalanuvchi topilmadi.');
        const patch = {};
        if (body.role !== undefined) {
          if (!USER_ROLES.includes(body.role)) throw new HttpError(422, 'Foydalanuvchi roli noto‘g‘ri.');
          patch.role = body.role;
        }
        if (body.active !== undefined) patch.active = Boolean(body.active);
        if (!Object.keys(patch).length) throw new HttpError(422, 'Yangilash uchun maydon topilmadi.');
        if (userMatch[1] === session.user_id && patch.active === false) throw new HttpError(422, 'O‘z hisobingizni o‘chira olmaysiz.');
        if (current.role === 'admin' && Number(current.active) === 1 && ((patch.active === false) || (patch.role && patch.role !== 'admin')) && store.countActiveAdmins() <= 1) {
          throw new HttpError(422, 'Oxirgi faol admin hisobini o‘chirib bo‘lmaydi.');
        }
        const user = store.updateUser(userMatch[1], patch, session.email);
        if (patch.active === false) store.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userMatch[1]);
        return sendJson(res, 200, { ok: true, user });
      }

      throw new HttpError(404, 'API yo‘li topilmadi.');
    }

    if (req.method === 'GET' && path === '/') {
      return sendJson(res, 200, { ok: true, service: 'sofexpo-lead-backend', admin: '/admin', health: '/health' });
    }
    throw new HttpError(404, 'Sahifa topilmadi.');
  }

  const server = http.createServer((req, res) => {
    Promise.resolve(handleRequest(req, res)).catch((error) => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      const status = Number.isInteger(error?.status) ? error.status : 500;
      if (status >= 500) console.error('[lead-backend] request failed:', error?.stack || error);
      sendJson(res, status, {
        ok: false,
        error: status >= 500 ? 'Ichki server xatosi.' : error.message,
        ...(error?.details === undefined ? {} : { details: error.details }),
      });
    });
  });
  server.headersTimeout = 10_000;
  server.requestTimeout = 20_000;
  server.keepAliveTimeout = 5_000;
  server.backendStore = store;
  server.processOutbox = processOutbox;
  server.listenBackend = () => new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve(server.address());
    });
  });
  const workerTimer = setInterval(() => void processOutbox(), 5_000);
  const retentionTimer = setInterval(() => {
    try {
      const deleted = store.cleanupExpiredLeads();
      if (deleted) console.info(`[lead-backend] removed ${deleted} lead(s) older than 12 months`);
    } catch (error) {
      console.error('[lead-backend] retention cleanup failed:', error?.message || error);
    }
  }, 24 * 60 * 60 * 1000);
  workerTimer.unref?.();
  retentionTimer.unref?.();
  server.on('close', () => {
    clearInterval(workerTimer);
    clearInterval(retentionTimer);
  });
  return server;
}
