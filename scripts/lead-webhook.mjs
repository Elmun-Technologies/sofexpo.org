#!/usr/bin/env node
/**
 * Lead webhook — the smallest possible CRM bridge for sofexpo.org forms.
 *
 * The site is static: LeadForm/QuizForm POST JSON to PUBLIC_LEAD_ENDPOINT. This
 * process is that endpoint. It validates, rate-limits, appends the lead to a local
 * JSONL file (nothing is ever lost) and forwards a human-readable message to a
 * Telegram chat via the Bot API. Zero dependencies — deploy anywhere Node runs.
 *
 *   TELEGRAM_BOT_TOKEN   required for the Telegram fan-out (get it from @BotFather)
 *   TELEGRAM_CHAT_ID     required for the Telegram fan-out (manager chat or group)
 *   LEAD_WEBHOOK_PORT    default 8787
 *   LEAD_WEBHOOK_ORIGIN  allowed browser origin, default https://sofexpo.org
 *                        (set to * only for staging)
 *   LEAD_WEBHOOK_SECRET  optional shared secret; the form cannot add headers, so
 *                        instead the endpoint URL may carry ?key=… — set the same
 *                        value here and keep the URL private
 *
 *   LEAD_WEBHOOK_EVENTS  analytics store, default .cache/events.jsonl
 *
 *   npm run lead-webhook
 *
 * The same process is also the site's first-party analytics sink: point
 * PUBLIC_ANALYTICS_ENDPOINT at `<this url>/event`. Tracking.astro posts
 * {events:[…]} batches (page views, CTA clicks, form starts/submits); they are
 * appended to LEAD_WEBHOOK_EVENTS without IP addresses, and `GET /stats`
 * (same ?key= when a secret is set) returns daily counts per event and per form.
 *
 * The quiz payload arrives flat: {name, company, phone, email, event, goal, area,
 * channel, comment, quiz, page, ts}. Legacy LeadForm payloads simply lack the quiz
 * fields and include position/direction — they render the same way.
 */
import http from 'node:http';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.LEAD_WEBHOOK_PORT || 8787);
const ORIGIN = process.env.LEAD_WEBHOOK_ORIGIN || 'https://sofexpo.org';
const SECRET = process.env.LEAD_WEBHOOK_SECRET || '';
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT = process.env.TELEGRAM_CHAT_ID || '';
const STORE = process.env.LEAD_WEBHOOK_STORE || join(dirname(fileURLToPath(import.meta.url)), '..', '.cache', 'leads.jsonl');
const EVENTS = process.env.LEAD_WEBHOOK_EVENTS || join(dirname(STORE), 'events.jsonl');
/** analytics fields kept per event — nothing that identifies a person */
const EVENT_FIELDS = ['event', 'ts', 'locale', 'path', 'sessionId', 'form', 'source', 'success', 'fallback', 'cta', 'channel', 'seconds', 'percent'];

const CHANNEL_LABELS = { call: 'Позвонить', telegram: 'Telegram' };

/** Human-readable Telegram message for one lead payload. Exported for tests. */
export function formatLead(lead = {}) {
  const cut = (v, n = 300) => String(v ?? '—').replace(/[<>&]/g, ' ').slice(0, n);
  const lines = [
    lead.quiz ? '🎯 Новая заявка-квиз' : lead.formType === 'press' ? '📰 Аккредитация СМИ' : '🎯 Новая заявка',
    '',
    `👤 ${cut(lead.name)}`,
    `🏢 ${cut(lead.company)}`,
    `📞 ${cut(lead.phone)}`,
  ];
  if (lead.email) lines.push(`✉️ ${cut(lead.email)}`);
  if (lead.event) lines.push(`🎪 ${cut(lead.event)}`);
  if (lead.goal) lines.push(`🎲 Задача: ${cut(lead.goal)}`);
  if (lead.area) lines.push(`📐 Площадь: ${cut(lead.area)}`);
  if (lead.position) lines.push(`💼 ${cut(lead.position)}`);
  if (lead.direction) lines.push(`🧭 Направление: ${cut(lead.direction)}`);
  if (lead.formType && !['generic', 'press'].includes(lead.formType)) lines.push(`📝 Форма: ${cut(lead.formType, 40)}`);
  if (lead.channel) lines.push(`📡 Канал: ${CHANNEL_LABELS[lead.channel] || cut(lead.channel)}`);
  if (lead.src) lines.push(`📍 Источник: ${cut(lead.src)}`);
  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .filter((k) => lead[k])
    .map((k) => `${k}=${cut(lead[k], 80)}`)
    .join(', ');
  if (utm) lines.push(`🏷 UTM: ${utm}`);
  if (lead.landing) lines.push(`🚪 Лендинг: ${cut(lead.landing, 160)}`);
  if (lead.comment) lines.push(`💬 ${cut(lead.comment)}`);
  lines.push('', `🔗 ${cut(lead.page, 200)}`, `🕒 ${cut(lead.ts, 40)}`);
  return lines.join('\n');
}

/** Daily counts per event and per submitted form. Exported for tests. */
export function summarize(events = []) {
  const days = {};
  for (const e of events) {
    if (!e || typeof e.event !== 'string') continue;
    const day = String(e.ts || '').slice(0, 10) || 'unknown';
    const d = (days[day] ??= { events: {}, forms: {}, sessions: new Set() });
    d.events[e.event] = (d.events[e.event] || 0) + 1;
    if (e.event === 'form_submit' || e.event === 'quiz_submit') {
      const key = `${e.form || 'quiz'}${e.fallback ? ' (not delivered)' : ''}`;
      d.forms[key] = (d.forms[key] || 0) + 1;
    }
    if (e.sessionId) d.sessions.add(e.sessionId);
  }
  return Object.fromEntries(
    Object.entries(days)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([day, d]) => [day, { sessions: d.sessions.size, events: d.events, forms: d.forms }]),
  );
}

const buckets = new Map();
const allowed = (ip, limit = 10) => {
  const now = Date.now();
  const hits = (buckets.get(ip) || []).filter((t) => now - t < 60_000);
  if (hits.length >= limit) return false;
  hits.push(now);
  buckets.set(ip, hits);
  if (buckets.size > 5_000) buckets.clear(); /* naive, enough for one origin */
  return true;
};

async function toTelegram(text) {
  if (!TOKEN || !CHAT) return { skipped: true };
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}: ${await res.text()}`);
  return { skipped: false };
}

const server = http.createServer(async (req, res) => {
  const cors = (code, body) => {
    res.writeHead(code, {
      'Access-Control-Allow-Origin': ORIGIN === '*' ? '*' : ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    });
    res.end(body === undefined ? undefined : JSON.stringify(body));
  };
  if (req.method === 'OPTIONS') return cors(204);

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (SECRET && url.searchParams.get('key') !== SECRET) return cors(401, { ok: false, error: 'bad key' });

  if (req.method === 'GET' && url.pathname.endsWith('/stats')) {
    let events = [];
    try {
      events = readFileSync(EVENTS, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } });
    } catch {}
    return cors(200, { ok: true, days: summarize(events) });
  }
  if (req.method !== 'POST') return cors(405, { ok: false, error: 'POST only' });

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();
  const isEvent = url.pathname.endsWith('/event');
  if (!allowed(isEvent ? `e:${ip}` : ip, isEvent ? 120 : 10)) return cors(429, { ok: false, error: 'too many requests' });

  if (isEvent) {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 256_000) return cors(413, { ok: false, error: 'payload too large' });
    }
    let batch;
    try { batch = JSON.parse(raw); } catch { return cors(400, { ok: false, error: 'invalid JSON' }); }
    const list = Array.isArray(batch?.events) ? batch.events.slice(0, 500) : [];
    const lines = list
      .filter((e) => e && typeof e.event === 'string')
      .map((e) => JSON.stringify(Object.fromEntries(EVENT_FIELDS.filter((k) => e[k] !== undefined).map((k) => [k, e[k]]))));
    try {
      mkdirSync(dirname(EVENTS), { recursive: true });
      if (lines.length) appendFileSync(EVENTS, lines.join('\n') + '\n');
    } catch (err) {
      console.error('[lead-webhook] event store failed:', err.message);
      return cors(500, { ok: false });
    }
    return cors(200, { ok: true, stored: lines.length });
  }

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 32_000) return cors(413, { ok: false, error: 'payload too large' });
  }
  let lead;
  try {
    lead = JSON.parse(raw);
  } catch {
    return cors(400, { ok: false, error: 'invalid JSON' });
  }
  if (!lead || typeof lead !== 'object' || !lead.name || !lead.phone) {
    return cors(422, { ok: false, error: 'name and phone are required' });
  }

  /* durable first: the JSONL store never depends on Telegram being up */
  try {
    mkdirSync(dirname(STORE), { recursive: true });
    appendFileSync(STORE, JSON.stringify(lead) + '\n');
  } catch (err) {
    console.error('[lead-webhook] store failed:', err.message);
  }

  try {
    await toTelegram(formatLead(lead));
  } catch (err) {
    console.error('[lead-webhook] telegram failed:', err.message);
    return cors(502, { ok: false, error: 'telegram unavailable' });
  }

  console.log(`[lead-webhook] ${lead.quiz ? 'quiz' : 'form'} lead from ${String(lead.name).slice(0, 60)} → stored${TOKEN && CHAT ? ' + telegram' : ' (telegram not configured)'}`);
  return cors(200, { ok: true });
});

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  server.listen(PORT, () => {
    console.log(`[lead-webhook] listening on :${PORT} (origin ${ORIGIN}, telegram ${TOKEN && CHAT ? 'on' : 'off'}, store ${STORE})`);
  });
}
