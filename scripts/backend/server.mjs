import http from 'node:http';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BackendStore, CURRENCIES, FILE_KINDS, LEAD_PRIORITIES, LEAD_STATUSES, NOTE_KINDS, SHOWCASE_STATUSES, USER_ROLES,
} from './db.mjs';
import { PORTAL_EVENTS, SHOWS } from './shows.mjs';
import {
  SHOWCASE_LIMITS, SOCIAL_NETWORKS, UPLOAD_LIMITS, cleanFileName, cleanFileTitle, fileTitleFromName, normalizeShowcase,
  sniffUpload, submitErrors,
} from './showcase.mjs';
import { createSecret, hashToken, normalizeEmail, validEmail, validPassword, verifyPassword } from './auth.mjs';
import { loadTgBlogConfig } from './tgblog/config.mjs';
import { TgBlogStore } from './tgblog/store.mjs';
import { TgBlogSync } from './tgblog/sync.mjs';
import { GitPublisher } from './tgblog/publish.mjs';

const ADMIN_DIR = fileURLToPath(new URL('./admin/', import.meta.url));
const PORTAL_DIR = fileURLToPath(new URL('./portal/', import.meta.url));
/* the 2026-10 design layer shared by /admin and /cabinet, and the site's own fonts and mark,
   served from an allow-list (never a path taken from the request) */
const SHARED_FILES = {
  '/brand-assets/sofexpo-logo.png': fileURLToPath(new URL('../../public/brand/sofexpo-horizontal.png', import.meta.url)),
  '/brand-assets/sofexpo-logo-white.png': fileURLToPath(new URL('../../public/brand/sofexpo-horizontal-white.png', import.meta.url)),
  ...Object.fromEntries(['manrope', 'onest'].flatMap((face) => ['latin', 'latin-ext', 'cyrillic'].map((subset) => [
    `/brand-fonts/${face}-${subset}.woff2`,
    fileURLToPath(new URL(`../../public/fonts/${face}-${subset}.woff2`, import.meta.url)),
  ]))),
};
const CONTENT_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const LEAD_TEXT_FIELDS = {
  formType: 'Форма', event: 'Выставка', name: 'Имя', company: 'Компания', position: 'Должность',
  phone: 'Телефон', email: 'Email', direction: 'Направление', area: 'Площадь', goal: 'Задача',
  purpose: 'Цель', industry: 'Отрасль', package: 'Пакет', eventType: 'Формат', attendees: 'Гостей',
  count: 'Человек', visitorType: 'Кто', date: 'Дата', time: 'Время', channel: 'Канал', messenger: 'Мессенджер', comment: 'Комментарий',
};
const LEAD_SKIP_FIELDS = new Set(['ts', 'locale', 'url', 'referrer', 'source', 'src', '_error', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'page', 'landing', 'sessionId']);
const REQUIRED_BY_FORM = {
  generic: ['company', 'consent'], press: ['company', 'consent'],
  exhibitor: ['company', 'industry', 'area', 'consent'],
  /* a guest gives a name, a phone, an email and the show — no company, title or industry */
  visitor: ['email', 'consent'],
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
    /* the site's anonymous analytics session: links the request to the pages that led to it */
    sessionId: cleanText(input.sessionId, 100).replace(/[^a-zA-Z0-9_-]/g, ''),
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

async function readRaw(req, maxBytes) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > maxBytes) throw new HttpError(413, 'Fayl hajmi ruxsat etilgan chegaradan oshdi.');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, 'Fayl hajmi ruxsat etilgan chegaradan oshdi.');
    chunks.push(chunk);
  }
  if (!size) throw new HttpError(400, 'Fayl bo‘sh.');
  return Buffer.concat(chunks);
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
  const assignee = cleanText(url.searchParams.get('assignee'), 254);
  const event = cleanText(url.searchParams.get('event'), 180);
  const overdue = url.searchParams.get('overdue') === '1';
  const sort = cleanText(url.searchParams.get('sort'), 20) || 'created';
  if (status && status !== 'open' && !LEAD_STATUSES.includes(status)) throw new HttpError(400, 'Status filtri noto‘g‘ri.');
  if (!['created', 'updated', 'next', 'amount'].includes(sort)) throw new HttpError(400, 'Saralash turi noto‘g‘ri.');
  return { page, limit, status, formType, search, from, to, assignee, event, overdue, sort };
}

export function createLeadServer(options = {}) {
  const host = options.host ?? process.env.LEAD_WEBHOOK_HOST ?? '0.0.0.0';
  const port = Number(options.port ?? process.env.LEAD_WEBHOOK_PORT ?? 8787);
  const adminEmail = options.adminEmail ?? process.env.ADMIN_EMAIL ?? '';
  const adminPassword = options.adminPassword ?? process.env.ADMIN_PASSWORD ?? '';
  const dbPath = options.dbPath ?? process.env.LEAD_WEBHOOK_DB ?? '.data/sofexpo.sqlite';
  const origins = parseOriginList(options.origins ?? process.env.LEAD_WEBHOOK_ORIGINS ?? process.env.LEAD_WEBHOOK_ORIGIN ?? 'https://sof-expo.com');
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
  const crmWebhookUrl = options.crmWebhookUrl ?? process.env.CRM_WEBHOOK_URL ?? '';
  const crmWebhookToken = options.crmWebhookToken ?? process.env.CRM_WEBHOOK_TOKEN ?? '';
  const deliverProvider = options.deliverProvider;
  /* exhibitor uploads live next to the database, never inside the web root; they are
     streamed only through the routes below (cabinet owner, admins, or — once published —
     the public directory) */
  const uploadsDir = options.uploadsDir ?? process.env.UPLOADS_DIR
    ?? (dbPath === ':memory:' ? join(tmpdir(), `sofexpo-uploads-${process.pid}`) : join(dirname(dbPath), 'uploads'));
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

  /* Telegram → blog sync (docs/telegram-blog-sync.md): the canonical state lives in the
     same SQLite file; markdown+media are materialized into the repo and a debounced git
     push triggers the Cloudflare Pages rebuild — the static-site equivalent of
     revalidation. Disabled unless token + webhook secret + channel id are all set. */
  const tgBlogConfig = loadTgBlogConfig(options.tgBlog ?? {});
  const tgBlogStore = tgBlogConfig.ready ? new TgBlogStore(store.db) : null;
  const tgBlogPublisher = tgBlogConfig.ready ? new GitPublisher({
    repoDir: tgBlogConfig.repoDir,
    remote: tgBlogConfig.gitRemote,
    branch: tgBlogConfig.gitBranch,
    debounceMs: tgBlogConfig.pushDebounceMs,
    pushEnabled: tgBlogConfig.gitPush,
    deployHooks: tgBlogConfig.deployHooks,
    gitRunner: tgBlogConfig.gitRunner,
  }) : null;
  const tgBlog = tgBlogStore ? new TgBlogSync({ config: tgBlogConfig, store: tgBlogStore, publisher: tgBlogPublisher }) : null;

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
  const storedPath = (storageName) => {
    if (!/^[a-f0-9-]{36}\.(pdf|png|jpg|webp)$/.test(storageName)) throw new HttpError(404, 'Fayl topilmadi.');
    return join(uploadsDir, storageName);
  };
  const removeStored = (names = []) => {
    for (const name of names) {
      try { unlinkSync(storedPath(name)); } catch { /* already gone */ }
    }
  };
  const sendStoredFile = (req, res, file, { publicCache = false } = {}) => {
    let path;
    let size;
    try {
      path = storedPath(file.storageName);
      size = statSync(path).size;
    } catch {
      throw new HttpError(404, 'Fayl topilmadi.');
    }
    const etag = `"${String(file.sha256 || '').slice(0, 32)}"`;
    if (file.sha256 && req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag });
      return res.end();
    }
    const ext = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[file.mime] || 'bin';
    const base = String(file.title || file.originalName || 'file').replace(/["\\\r\n]/g, '').slice(0, 100) || 'file';
    const ascii = base.normalize('NFKD').replace(/[^\x20-\x7e]/g, '').trim() || 'file';
    res.writeHead(200, {
      'Content-Type': file.mime,
      'Content-Length': size,
      'Content-Disposition': `inline; filename="${ascii}.${ext}"; filename*=UTF-8''${encodeURIComponent(`${base}.${ext}`)}`,
      'Cache-Control': publicCache ? 'public, max-age=3600' : 'private, no-store',
      ...(file.sha256 ? { ETag: etag } : {}),
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      /* PDFs need the browser's own viewer (a CSP sandbox blocks it in Chromium); the bytes
         were sniffed on upload, so only a real PDF or raster image is ever served here */
      ...(file.mime === 'application/pdf' ? {} : { 'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }),
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(path).pipe(res);
  };
  const portalFileResponse = (file) => ({ ...file, url: `/api/portal/files/${file.id}` });
  const showcaseResponse = (showcase) => ({ ...showcase, files: showcase.files.map(portalFileResponse) });
  const requireExhibitor = (session) => {
    if (session.account_type !== 'exhibitor') throw new HttpError(403, 'Bu bo‘lim faqat eksponentlar uchun.');
  };

  const checkIngressSecret = (req, url) => {
    if (!ingressSecret) return true;
    const header = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const query = url.searchParams.get('key') || '';
    return secureEqual(header, ingressSecret) || secureEqual(query, ingressSecret);
  };

  async function sendTelegram(text) {
    const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramChat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
    const result = await response.json().catch(() => null);
    if (!result?.ok) throw new Error('Telegram rejected the message');
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
          store.failDelivery(job.id, attempts, message, maxDeliveryAttempts);
          console.error(`[lead-backend] delivery ${job.id} (${job.provider}) failed: ${message}`);
        }
      }
    } catch (error) {
      console.error('[lead-backend] outbox worker error:', error?.message || error);
    } finally {
      workerActive = false;
    }
  }

  /* read-only public data for the static site (any sof-expo subdomain): no cookies, no
     credentials, so a wildcard origin is safe */
  async function handlePublic(req, res, path, url) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Max-Age': '600' });
      return res.end();
    }
    if (!['GET', 'HEAD'].includes(req.method)) throw new HttpError(405, 'Faqat o‘qish mumkin.');
    if (!rateAllowed(`public:${getClientAddress(req)}`, 240)) throw new HttpError(429, 'Juda ko‘p so‘rov.');
    const media = path.match(/^\/media\/exhibitors\/([a-f0-9-]{36})$/i);
    if (media) {
      const file = store.publicFile(media[1].toLowerCase());
      if (!file) throw new HttpError(404, 'Fayl topilmadi.');
      return sendStoredFile(req, res, file, { publicCache: true });
    }
    if (path === '/api/public/exhibitors') {
      const event = cleanText(url.searchParams.get('event'), 60);
      const when = cleanText(url.searchParams.get('when'), 10);
      const items = store.publicExhibitors({
        event: SHOWS.some((show) => show.slug === event) ? event : '',
        when: ['current', 'past'].includes(when) ? when : '',
        q: cleanText(url.searchParams.get('q'), 80),
      });
      const body = JSON.stringify({ ok: true, items, shows: SHOWS.map(({ slug, name }) => ({ slug, name })) });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'public, max-age=120' });
      return res.end(req.method === 'HEAD' ? undefined : body);
    }
    throw new HttpError(404, 'Sahifa topilmadi.');
  }

  async function handleRequest(req, res) {
    const rawPath = String(req.url || '/').split('?', 1)[0].replace(/\/{2,}/g, '/');
    if (rawPath.startsWith('/api/public/') || rawPath.startsWith('/media/')) {
      let publicUrl;
      try { publicUrl = new URL(req.url || '/', 'http://localhost'); } catch { throw new HttpError(400, 'URL noto‘g‘ri.'); }
      return handlePublic(req, res, rawPath, publicUrl);
    }
    if (!corsAndSecurity(req, res)) return sendJson(res, 403, { ok: false, error: 'Origin not allowed' });
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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

    /* Telegram posts webhook. ACK fast (200) and process asynchronously: on any
       processing failure we still return 200 so Telegram does not retry forever.
       Only signature/secret and payload validation may answer non-200 (spec). */
    if (tgBlog && req.method === 'POST' && path === tgBlogConfig.webhookPath) {
      const secret = String(req.headers['x-telegram-bot-api-secret-token'] || '');
      if (!secureEqual(secret, tgBlogConfig.secret)) throw new HttpError(401, 'Webhook kaliti noto‘g‘ri.');
      const update = await readJson(req, 1_000_000);
      void tgBlog.ingestUpdate(update);
      return sendJson(res, 200, { ok: true });
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
      return sendJson(res, 200, {
        ok: true,
        events: PORTAL_EVENTS,
        shows: SHOWS,
        fileKinds: FILE_KINDS.filter((kind) => kind !== 'logo'),
        socials: SOCIAL_NETWORKS,
        limits: { ...SHOWCASE_LIMITS, ...UPLOAD_LIMITS },
      });
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
          /* a guest only picks the show; the visit goal is optional (many come without a company) */
          const interest = cleanText(body.interest, 160) || 'visit';
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

      if (path === '/api/portal/showcase') {
        requireExhibitor(session);
        if (req.method === 'GET') return sendJson(res, 200, { ok: true, showcase: showcaseResponse(store.getShowcase(session.account_id)) });
        if (req.method === 'PUT') {
          verifyCsrf(req, session);
          if (!rateAllowed(`portal-showcase:${session.account_id}`, 60, 60 * 60_000)) throw new HttpError(429, 'Juda ko‘p saqlash. Birozdan keyin urinib ko‘ring.');
          const body = await readJson(req, 32_000);
          const { value, errors } = normalizeShowcase(body.showcase || {});
          const submit = body.submit === true;
          Object.assign(errors, submit ? submitErrors(value) : {});
          if (Object.keys(errors).length) throw new HttpError(422, 'Ba’zi maydonlar noto‘g‘ri to‘ldirilgan.', errors);
          const showcase = store.saveShowcaseDraft(session.account_id, value, { submit });
          return sendJson(res, 200, { ok: true, showcase: showcaseResponse(showcase) });
        }
      }

      if (req.method === 'GET' && path === '/api/portal/files') {
        requireExhibitor(session);
        return sendJson(res, 200, { ok: true, items: store.listPortalFiles(session.account_id).map(portalFileResponse) });
      }

      if (req.method === 'POST' && path === '/api/portal/files') {
        requireExhibitor(session);
        verifyCsrf(req, session);
        if (!rateAllowed(`portal-upload:${session.account_id}`, 40, 60 * 60_000)) throw new HttpError(429, 'Fayllar soni ko‘p. Birozdan keyin urinib ko‘ring.');
        const kind = cleanText(url.searchParams.get('kind'), 20) || 'other';
        if (!FILE_KINDS.includes(kind)) throw new HttpError(422, 'Fayl turi noto‘g‘ri.');
        if (store.countPortalFiles(session.account_id) >= UPLOAD_LIMITS.filesPerAccount) {
          throw new HttpError(422, `Ko‘pi bilan ${UPLOAD_LIMITS.filesPerAccount} ta fayl yuklash mumkin. Keraksizini o‘chiring.`);
        }
        const buffer = await readRaw(req, UPLOAD_LIMITS.pdfBytes);
        const type = sniffUpload(buffer);
        if (!type) throw new HttpError(415, 'Faqat PDF, PNG, JPG yoki WEBP fayl yuklash mumkin.');
        if (kind === 'logo' && !type.image) throw new HttpError(415, 'Logotip PNG, JPG yoki WEBP rasm bo‘lishi kerak.');
        if (type.image && buffer.length > UPLOAD_LIMITS.imageBytes) throw new HttpError(413, 'Rasm hajmi 5 MB dan oshmasin.');
        const originalName = cleanFileName(url.searchParams.get('name'));
        const title = cleanFileTitle(url.searchParams.get('title')) || (kind === 'logo' ? 'Logo' : fileTitleFromName(originalName));
        const storageName = `${randomUUID()}.${type.ext}`;
        mkdirSync(uploadsDir, { recursive: true });
        writeFileSync(storedPath(storageName), buffer, { mode: 0o640 });
        let result;
        try {
          result = store.addPortalFile({
            accountId: session.account_id,
            kind,
            title,
            originalName,
            mime: type.mime,
            size: buffer.length,
            sha256: createHash('sha256').update(buffer).digest('hex'),
            storageName,
          });
        } catch (error) {
          removeStored([storageName]);
          throw error;
        }
        removeStored(result.removed);
        return sendJson(res, 201, { ok: true, file: portalFileResponse(result.file) });
      }

      const portalFileMatch = path.match(/^\/api\/portal\/files\/([a-f0-9-]{36})$/i);
      if (portalFileMatch) {
        requireExhibitor(session);
        const fileId = portalFileMatch[1].toLowerCase();
        if (req.method === 'GET' || req.method === 'HEAD') {
          const file = store.getPortalFile(fileId);
          if (!file || file.accountId !== session.account_id) throw new HttpError(404, 'Fayl topilmadi.');
          return sendStoredFile(req, res, file);
        }
        if (req.method === 'PATCH') {
          verifyCsrf(req, session);
          const body = await readJson(req, 4_000);
          const kind = body.kind === undefined ? undefined : cleanText(body.kind, 20);
          if (kind !== undefined && (!FILE_KINDS.includes(kind) || kind === 'logo')) throw new HttpError(422, 'Fayl turi noto‘g‘ri.');
          const title = body.title === undefined ? undefined : cleanFileTitle(body.title);
          if (title !== undefined && !title) throw new HttpError(422, 'Fayl nomi bo‘sh bo‘lmasin.');
          const file = store.updatePortalFile(session.account_id, fileId, { title, kind });
          if (!file) throw new HttpError(404, 'Fayl topilmadi.');
          return sendJson(res, 200, { ok: true, file: portalFileResponse(file) });
        }
        if (req.method === 'DELETE') {
          verifyCsrf(req, session);
          const file = store.deletePortalFile(session.account_id, fileId);
          if (!file) throw new HttpError(404, 'Fayl topilmadi.');
          removeStored([file.storageName]);
          return sendJson(res, 200, { ok: true });
        }
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

      if (req.method === 'GET' && path === '/api/admin/sales-analytics') {
        return sendJson(res, 200, { ok: true, ...store.salesAnalytics(clamp(url.searchParams.get('days'), 1, 365, 30)) });
      }

      if (req.method === 'GET' && path === '/api/admin/pipeline') {
        return sendJson(res, 200, {
          ok: true,
          ...store.pipeline({
            assignee: cleanText(url.searchParams.get('assignee'), 254),
            event: cleanText(url.searchParams.get('event'), 180),
            search: cleanText(url.searchParams.get('q'), 120),
            closedDays: clamp(url.searchParams.get('closedDays'), 1, 365, 30),
          }),
        });
      }

      if (req.method === 'GET' && path === '/api/admin/tasks') {
        return sendJson(res, 200, { ok: true, ...store.tasks() });
      }

      if (req.method === 'GET' && path === '/api/admin/team') {
        return sendJson(res, 200, {
          ok: true,
          team: store.listTeam(),
          events: [...new Set([...PORTAL_EVENTS.map((item) => item.name), ...SHOWS.map((show) => show.name)])],
          shows: SHOWS,
          currencies: CURRENCIES,
          noteKinds: NOTE_KINDS,
          statuses: LEAD_STATUSES,
        });
      }

      if (req.method === 'GET' && path === '/api/admin/showcases') {
        const status = cleanText(url.searchParams.get('status'), 20);
        if (status && !SHOWCASE_STATUSES.includes(status)) throw new HttpError(422, 'Holat filtri noto‘g‘ri.');
        return sendJson(res, 200, {
          ok: true,
          ...store.listShowcases({
            status,
            search: cleanText(url.searchParams.get('q'), 120),
            page: clamp(url.searchParams.get('page'), 1, 1_000_000, 1),
            limit: clamp(url.searchParams.get('limit'), 1, 50, 25),
          }),
        });
      }

      const showcaseMatch = path.match(/^\/api\/admin\/showcases\/([a-f0-9-]{36})(?:\/(review))?$/i);
      if (showcaseMatch) {
        const accountId = showcaseMatch[1].toLowerCase();
        if (req.method === 'GET' && !showcaseMatch[2]) {
          const showcase = store.getShowcaseForAdmin(accountId);
          if (!showcase) throw new HttpError(404, 'Kompaniya sahifasi topilmadi.');
          return sendJson(res, 200, { ok: true, showcase });
        }
        if (req.method === 'POST' && showcaseMatch[2]) {
          verifyCsrf(req, session);
          const body = await readJson(req, 4_000);
          const action = cleanText(body.action, 20);
          if (!['publish', 'reject', 'hide'].includes(action)) throw new HttpError(422, 'Amal noto‘g‘ri.');
          const note = cleanText(body.note, 1000);
          if (action === 'reject' && !note) throw new HttpError(422, 'Rad etish sababini yozing — eksponent uni kabinetda ko‘radi.');
          const result = store.reviewShowcase(accountId, { action, note }, session.email);
          if (result.error === 'not_found') throw new HttpError(404, 'Kompaniya sahifasi topilmadi.');
          if (result.error === 'name_required') throw new HttpError(422, 'Kompaniya nomi bo‘sh — nashr qilib bo‘lmaydi.');
          removeStored(result.removed);
          return sendJson(res, 200, { ok: true, showcase: result.showcase });
        }
      }

      const adminFileMatch = path.match(/^\/api\/admin\/files\/([a-f0-9-]{36})$/i);
      if (adminFileMatch && (req.method === 'GET' || req.method === 'HEAD')) {
        const file = store.getPortalFile(adminFileMatch[1].toLowerCase());
        if (!file) throw new HttpError(404, 'Fayl topilmadi.');
        return sendStoredFile(req, res, file);
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

      /* Telegram-synced blog posts: list + publish/unpublish/delete (Bot API never
         reports deletions, so editorial control lives here — docs/telegram-blog-sync.md). */
      if (req.method === 'GET' && path === '/api/admin/blog-posts') {
        if (!tgBlog) throw new HttpError(503, 'Telegram blog sinxronizatsiyasi sozlanmagan.');
        const status = cleanText(url.searchParams.get('status'), 20);
        return sendJson(res, 200, {
          ok: true,
          ...tgBlog.listPosts({
            page: clamp(url.searchParams.get('page'), 1, 1_000_000, 1),
            limit: clamp(url.searchParams.get('limit'), 1, 100, 25),
            status,
          }),
          sync: {
            channel: tgBlogConfig.channelUsername ? `@${tgBlogConfig.channelUsername}` : tgBlogConfig.channelId,
            mode: tgBlogConfig.mode,
            collection: tgBlogConfig.collection,
            locale: tgBlogConfig.locale,
            gitPush: tgBlogConfig.gitPush,
          },
        });
      }

      const blogMatch = path.match(/^\/api\/admin\/blog-posts\/(\d{1,10})(?:\/(publish|unpublish))?$/);
      if (blogMatch) {
        if (!tgBlog) throw new HttpError(503, 'Telegram blog sinxronizatsiyasi sozlanmagan.');
        const postId = Number(blogMatch[1]);
        if (req.method === 'POST' && blogMatch[2]) {
          verifyCsrf(req, session);
          const status = blogMatch[2] === 'publish' ? 'published' : 'unpublished';
          const post = await tgBlog.setPostStatus(postId, status, session.email);
          if (!post) throw new HttpError(404, 'Maqola topilmadi.');
          store.audit(session.email, `blog.${blogMatch[2]}`, 'tg_blog_post', String(postId), { slug: post.slug });
          return sendJson(res, 200, { ok: true, post: { id: post.id, slug: post.slug, status: post.status } });
        }
        if (req.method === 'DELETE' && !blogMatch[2]) {
          requireAdmin(session);
          verifyCsrf(req, session);
          const post = await tgBlog.deletePost(postId, session.email);
          if (!post) throw new HttpError(404, 'Maqola topilmadi.');
          store.audit(session.email, 'blog.delete', 'tg_blog_post', String(postId), { slug: post.slug });
          return sendJson(res, 200, { ok: true, removed: post.removed });
        }
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
          if (body.dealAmount !== undefined) {
            const amount = body.dealAmount === '' || body.dealAmount === null ? 0 : Number(body.dealAmount);
            if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) throw new HttpError(422, 'Bitim summasi noto‘g‘ri.');
            patch.dealAmount = Math.round(amount * 100) / 100;
          }
          if (body.currency !== undefined) {
            if (!CURRENCIES.includes(body.currency)) throw new HttpError(422, 'Valyuta noto‘g‘ri.');
            patch.currency = body.currency;
          }
          if (body.standArea !== undefined) {
            const area = body.standArea === '' || body.standArea === null ? null : Number(body.standArea);
            if (area !== null && (!Number.isFinite(area) || area < 0 || area > 100_000)) throw new HttpError(422, 'Stend maydoni noto‘g‘ri.');
            patch.standArea = area;
          }
          if (body.lostReason !== undefined) patch.lostReason = cleanText(body.lostReason, 300);
          if (body.nextAction !== undefined) patch.nextAction = cleanText(body.nextAction, 300);
          if (body.nextActionAt !== undefined) {
            if (body.nextActionAt === '' || body.nextActionAt === null) patch.nextActionAt = null;
            else {
              const at = Date.parse(String(body.nextActionAt));
              if (!Number.isFinite(at)) throw new HttpError(422, 'Keyingi qadam sanasi noto‘g‘ri.');
              patch.nextActionAt = new Date(at).toISOString();
            }
          }
          if (body.event !== undefined) patch.event = cleanText(body.event, 180);
          if (patch.status === 'lost' && body.lostReason !== undefined && !patch.lostReason) {
            throw new HttpError(422, 'Yo‘qotish sababini ko‘rsating.');
          }
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
          const kind = body.kind === undefined ? 'note' : cleanText(body.kind, 20);
          if (!NOTE_KINDS.includes(kind)) throw new HttpError(422, 'Faoliyat turi noto‘g‘ri.');
          const note = store.addLeadNote(leadId, { userId: session.user_id, authorEmail: session.email, body: text, kind });
          if (!note) throw new HttpError(404, 'Lid topilmadi.');
          return sendJson(res, 201, { ok: true, note });
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
  /* uploads of up to 20 MB over a slow mobile link need more than the JSON default */
  server.requestTimeout = 120_000;
  server.keepAliveTimeout = 5_000;
  server.backendStore = store;
  server.uploadsDir = uploadsDir;
  server.tgBlog = tgBlog;
  server.tgBlogConfig = tgBlogConfig;
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
    if (tgBlogPublisher) void tgBlogPublisher.stop();
  });
  return server;
}
