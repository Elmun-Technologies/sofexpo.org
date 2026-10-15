import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { hashPassword, normalizeEmail } from './auth.mjs';

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost', 'spam'];
export const LEAD_PRIORITIES = ['low', 'normal', 'high'];
export const USER_ROLES = ['admin', 'manager'];

const nowIso = () => new Date().toISOString();
const parseJson = (value, fallback = {}) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
const dayKey = (date) => date.toISOString().slice(0, 10);

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

function dateRange(days) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { startDay: dayKey(start), startAt: start.toISOString() };
}

function normalizeLegacyLead(input) {
  const lead = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const text = (key, max = 1000) => String(lead[key] ?? '').trim().slice(0, max);
  const payload = Object.fromEntries(
    Object.entries(lead)
      .filter(([key, value]) => /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key) && ['string', 'number', 'boolean'].includes(typeof value))
      .slice(0, 60)
      .map(([key, value]) => [key, String(value).slice(0, 2000)]),
  );
  const name = text('name', 120);
  const phone = text('phone', 60);
  if (!name || !phone) return null;
  const createdAt = Number.isFinite(Date.parse(lead.ts)) ? new Date(lead.ts).toISOString() : nowIso();
  return {
    id: randomUUID(),
    createdAt,
    name,
    company: text('company', 200),
    phone,
    email: text('email', 254),
    formType: text('formType', 60) || (lead.quiz ? 'quiz' : 'generic'),
    event: text('event', 180),
    locale: text('locale', 10),
    source: text('source', 120) || text('src', 120),
    page: text('page', 300),
    landing: text('landing', 500),
    referrer: text('referrer', 500),
    utm: Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map((key) => [key, text(key, 160)]).filter(([, value]) => value)),
    payload,
  };
}

export class BackendStore {
  constructor({
    dbPath = '.data/sofexpo.sqlite',
    legacyLeadsPath = '.cache/leads.jsonl',
    legacyEventsPath = '.cache/events.jsonl',
    adminEmail = '',
    adminPassword = '',
  } = {}) {
    if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
    this.path = dbPath;
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        created_at TEXT NOT NULL,
        last_login_at TEXT
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        csrf_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        name TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        form_type TEXT NOT NULL DEFAULT 'generic',
        event TEXT NOT NULL DEFAULT '',
        locale TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT '',
        page TEXT NOT NULL DEFAULT '',
        landing TEXT NOT NULL DEFAULT '',
        referrer TEXT NOT NULL DEFAULT '',
        utm_json TEXT NOT NULL DEFAULT '{}',
        payload_json TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost', 'spam')),
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
        assignee TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS leads_created_idx ON leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS leads_status_created_idx ON leads(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS leads_form_created_idx ON leads(form_type, created_at DESC);
      CREATE TABLE IF NOT EXISTS lead_notes (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        author_email TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS lead_notes_lead_idx ON lead_notes(lead_id, created_at);
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_email TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_log(created_at DESC);
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        received_at TEXT NOT NULL,
        session_id TEXT NOT NULL DEFAULT '',
        locale TEXT NOT NULL DEFAULT '',
        path TEXT NOT NULL DEFAULT '',
        form_type TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT '',
        channel TEXT NOT NULL DEFAULT '',
        cta TEXT NOT NULL DEFAULT '',
        utm_source TEXT NOT NULL DEFAULT '',
        utm_medium TEXT NOT NULL DEFAULT '',
        utm_campaign TEXT NOT NULL DEFAULT '',
        seconds INTEGER,
        percent INTEGER,
        success INTEGER,
        fallback INTEGER
      );
      CREATE INDEX IF NOT EXISTS analytics_received_idx ON analytics_events(received_at DESC);
      CREATE INDEX IF NOT EXISTS analytics_name_received_idx ON analytics_events(event_name, received_at DESC);
      CREATE INDEX IF NOT EXISTS analytics_session_idx ON analytics_events(session_id, received_at);
      CREATE TABLE IF NOT EXISTS delivery_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sending', 'sent', 'failed')),
        attempts INTEGER NOT NULL DEFAULT 0,
        payload_json TEXT NOT NULL,
        next_attempt_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sent_at TEXT,
        last_error TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS outbox_due_idx ON delivery_outbox(state, next_attempt_at, id);
      CREATE TABLE IF NOT EXISTS portal_accounts (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        account_type TEXT NOT NULL CHECK (account_type IN ('visitor', 'exhibitor')),
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        created_at TEXT NOT NULL,
        last_login_at TEXT
      );
      CREATE INDEX IF NOT EXISTS portal_accounts_created_idx ON portal_accounts(created_at DESC);
      CREATE TABLE IF NOT EXISTS portal_sessions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
        csrf_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS portal_sessions_expiry_idx ON portal_sessions(expires_at);
      CREATE TABLE IF NOT EXISTS portal_profiles (
        account_id TEXT PRIMARY KEY REFERENCES portal_accounts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL DEFAULT '',
        industry TEXT NOT NULL DEFAULT '',
        website TEXT NOT NULL DEFAULT '',
        interests TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS portal_requests (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
        lead_id TEXT NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
        request_type TEXT NOT NULL CHECK (request_type IN ('visitor', 'exhibitor')),
        event TEXT NOT NULL,
        details_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS portal_requests_account_idx ON portal_requests(account_id, created_at DESC);
      -- 2026-10: an exhibitor's public face for the catalogue and the show's promo — company text,
      -- contacts, the stand, and a review state the organiser moves (docs/17 §exhibitor profile)
      CREATE TABLE IF NOT EXISTS exhibitor_companies (
        account_id TEXT PRIMARY KEY REFERENCES portal_accounts(id) ON DELETE CASCADE,
        brand_name TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        products TEXT NOT NULL DEFAULT '',
        website TEXT NOT NULL DEFAULT '',
        instagram TEXT NOT NULL DEFAULT '',
        telegram TEXT NOT NULL DEFAULT '',
        contact_name TEXT NOT NULL DEFAULT '',
        contact_phone TEXT NOT NULL DEFAULT '',
        contact_email TEXT NOT NULL DEFAULT '',
        event TEXT NOT NULL DEFAULT '',
        stand TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'changes')),
        review_note TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL,
        submitted_at TEXT,
        reviewed_at TEXT,
        reviewed_by TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS exhibitor_companies_status_idx ON exhibitor_companies(status, updated_at DESC);
      CREATE TABLE IF NOT EXISTS exhibitor_files (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('logo', 'flyer', 'catalog', 'photo')),
        file_name TEXT NOT NULL,
        mime TEXT NOT NULL,
        size INTEGER NOT NULL,
        sha256 TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS exhibitor_files_account_idx ON exhibitor_files(account_id, kind, created_at DESC);
    `);
    // If the old JSONL process was interrupted mid-send, let the new worker safely resume it.
    this.db.prepare("UPDATE delivery_outbox SET state = 'pending', next_attempt_at = ? WHERE state = 'sending'").run(nowIso());
    this.cleanupSessions();
    this.seedAdmin(adminEmail, adminPassword);
    this.importLegacyFile(legacyLeadsPath, 'legacy-leads-jsonl-v1', (line) => this.importLegacyLead(line));
    this.importLegacyFile(legacyEventsPath, 'legacy-events-jsonl-v1', (line) => this.insertLegacyEvent(line));
    this.cleanupExpiredLeads();
  }

  close() {
    this.db.close();
  }

  get dbPath() {
    return this.path;
  }

  hasActiveAdmin() {
    return Boolean(this.db.prepare("SELECT 1 AS ok FROM users WHERE role = 'admin' AND active = 1 LIMIT 1").get());
  }

  seedAdmin(email, password) {
    if (!email || !password || this.db.prepare('SELECT 1 FROM users LIMIT 1').get()) return false;
    const normalized = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || String(password).length < 12) return false;
    const { salt, hash } = hashPassword(String(password));
    this.db.prepare(`INSERT INTO users (id, email, password_salt, password_hash, role, active, created_at)
      VALUES (?, ?, ?, ?, 'admin', 1, ?)`)
      .run(randomUUID(), normalized, salt, hash, nowIso());
    return true;
  }

  importLegacyFile(path, migrationName, importer) {
    if (!path || path === ':memory:') return;
    if (this.db.prepare('SELECT 1 FROM schema_migrations WHERE name = ?').get(migrationName)) return;
    if (existsSync(path)) {
      const lines = readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean);
      transaction(this.db, () => {
        for (const line of lines) {
          try {
            importer(JSON.parse(line));
          } catch {
            // A bad historical line should not prevent the remaining records from importing.
          }
        }
        this.db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(migrationName, nowIso());
      });
      return;
    }
    this.db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(migrationName, nowIso());
  }

  importLegacyLead(input) {
    const lead = normalizeLegacyLead(input);
    if (!lead) return;
    this.insertLead(lead, { queueProviders: [] });
  }

  insertLegacyEvent(input) {
    if (!input || typeof input.event !== 'string') return;
    const ts = Number.isFinite(Date.parse(input.ts)) ? new Date(input.ts).toISOString() : nowIso();
    const utm = input.utm && typeof input.utm === 'object' ? input.utm : {};
    this.insertEvent({
      eventName: input.event.slice(0, 60),
      receivedAt: ts,
      sessionId: String(input.sessionId ?? '').slice(0, 100),
      locale: String(input.locale ?? '').slice(0, 10),
      path: String(input.path ?? '').split('?')[0].slice(0, 300),
      formType: String(input.form ?? '').slice(0, 60),
      source: String(input.source ?? '').slice(0, 120),
      channel: String(input.channel ?? '').slice(0, 40),
      cta: String(input.cta ?? '').slice(0, 120),
      utmSource: String(input.utm_source ?? utm.source ?? '').slice(0, 160),
      utmMedium: String(input.utm_medium ?? utm.medium ?? '').slice(0, 160),
      utmCampaign: String(input.utm_campaign ?? utm.campaign ?? '').slice(0, 160),
      seconds: Number.isFinite(Number(input.seconds)) ? Number(input.seconds) : null,
      percent: Number.isFinite(Number(input.percent ?? input.depth)) ? Number(input.percent ?? input.depth) : null,
      success: typeof input.success === 'boolean' ? Number(input.success) : null,
      fallback: typeof input.fallback === 'boolean' ? Number(input.fallback) : null,
    });
  }

  findUserByEmail(email) {
    return this.db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(normalizeEmail(email));
  }

  getUserById(id) {
    return this.db.prepare(`SELECT id, email, role, active, created_at AS createdAt,
      last_login_at AS lastLoginAt FROM users WHERE id = ?`).get(id);
  }

  updateLastLogin(id) {
    this.db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(nowIso(), id);
  }

  createSession({ id, userId, csrfHash, expiresAt }) {
    const now = nowIso();
    this.db.prepare(`INSERT INTO sessions (id, user_id, csrf_hash, created_at, last_seen_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, userId, csrfHash, now, now, expiresAt);
  }

  findSession(id) {
    if (!id) return null;
    const session = this.db.prepare(`SELECT s.id AS session_id, s.csrf_hash, s.expires_at,
        u.id AS user_id, u.email, u.role
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ? AND u.active = 1`)
      .get(id, nowIso());
    if (session) this.db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(nowIso(), id);
    return session || null;
  }

  deleteSession(id) {
    if (id) this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }

  cleanupSessions() {
    this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso());
    this.db.prepare('DELETE FROM portal_sessions WHERE expires_at <= ?').run(nowIso());
  }

  cleanupExpiredLeads(retentionDays = 365) {
    const days = Math.max(1, Math.min(3650, Number(retentionDays) || 365));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const result = this.db.prepare('DELETE FROM leads WHERE created_at < ?').run(cutoff);
    return Number(result.changes || 0);
  }

  findPortalAccountByEmail(email) {
    return this.db.prepare('SELECT * FROM portal_accounts WHERE email = ? COLLATE NOCASE').get(normalizeEmail(email));
  }

  getPortalAccountById(id) {
    const account = this.db.prepare(`SELECT a.id, a.email, a.account_type AS accountType, a.active,
        a.created_at AS createdAt, a.last_login_at AS lastLoginAt,
        p.name, p.phone, p.company, p.country, p.industry, p.website, p.interests,
        p.updated_at AS profileUpdatedAt
      FROM portal_accounts a JOIN portal_profiles p ON p.account_id = a.id
      WHERE a.id = ?`).get(id);
    return account || null;
  }

  createPortalAccount({ email, password, accountType, profile }) {
    const id = randomUUID();
    const createdAt = nowIso();
    const normalizedEmail = normalizeEmail(email);
    const { salt, hash } = hashPassword(password);
    transaction(this.db, () => {
      this.db.prepare(`INSERT INTO portal_accounts (id, email, password_salt, password_hash, account_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .run(id, normalizedEmail, salt, hash, accountType, createdAt);
      this.db.prepare(`INSERT INTO portal_profiles (
        account_id, name, phone, company, country, industry, website, interests, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, profile.name, profile.phone, profile.company || '', profile.country || '', profile.industry || '', profile.website || '', profile.interests || '', createdAt);
    });
    return this.getPortalAccountById(id);
  }

  updatePortalProfile(accountId, profile, actorEmail = 'portal-account') {
    const current = this.getPortalAccountById(accountId);
    if (!current) return null;
    const next = {
      name: profile.name,
      phone: profile.phone,
      company: profile.company || '',
      country: profile.country || '',
      industry: profile.industry || '',
      website: profile.website || '',
      interests: profile.interests || '',
    };
    const changedFields = Object.keys(next).filter((key) => next[key] !== (current[key] || ''));
    if (!changedFields.length) return current;
    const updatedAt = nowIso();
    transaction(this.db, () => {
      this.db.prepare(`UPDATE portal_profiles SET name = ?, phone = ?, company = ?, country = ?,
        industry = ?, website = ?, interests = ?, updated_at = ? WHERE account_id = ?`)
        .run(next.name, next.phone, next.company, next.country, next.industry, next.website, next.interests, updatedAt, accountId);
      this.audit(actorEmail, 'portal_profile.update', 'portal_account', accountId, { fields: changedFields });
    });
    return this.getPortalAccountById(accountId);
  }

  updatePortalLastLogin(id) {
    this.db.prepare('UPDATE portal_accounts SET last_login_at = ? WHERE id = ?').run(nowIso(), id);
  }

  createPortalSession({ id, accountId, csrfHash, expiresAt }) {
    const now = nowIso();
    this.db.prepare(`INSERT INTO portal_sessions (id, account_id, csrf_hash, created_at, last_seen_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, accountId, csrfHash, now, now, expiresAt);
  }

  findPortalSession(id) {
    if (!id) return null;
    const session = this.db.prepare(`SELECT s.id AS session_id, s.csrf_hash, s.expires_at,
        a.id AS account_id, a.email, a.account_type AS account_type
      FROM portal_sessions s JOIN portal_accounts a ON a.id = s.account_id
      WHERE s.id = ? AND s.expires_at > ? AND a.active = 1`)
      .get(id, nowIso());
    if (session) this.db.prepare('UPDATE portal_sessions SET last_seen_at = ? WHERE id = ?').run(nowIso(), id);
    return session || null;
  }

  deletePortalSession(id) {
    if (id) this.db.prepare('DELETE FROM portal_sessions WHERE id = ?').run(id);
  }

  deletePortalSessions(accountId) {
    this.db.prepare('DELETE FROM portal_sessions WHERE account_id = ?').run(accountId);
  }

  createPortalRequest({ accountId, requestType, event, details, lead, providers = [] }) {
    const id = randomUUID();
    const leadId = randomUUID();
    const createdAt = nowIso();
    const storedLead = {
      ...lead,
      id: leadId,
      createdAt,
      updatedAt: createdAt,
      status: 'new',
      priority: 'normal',
      assignee: '',
      payload: { ...(lead.payload || {}), portalRequestId: id },
    };
    transaction(this.db, () => {
      this.insertLead(storedLead, { queueProviders: providers });
      this.db.prepare(`INSERT INTO portal_requests (id, account_id, lead_id, request_type, event, details_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(id, accountId, leadId, requestType, event, JSON.stringify(details || {}), createdAt);
    });
    return this.getPortalRequest(accountId, id);
  }

  getPortalRequest(accountId, id) {
    const row = this.db.prepare(`SELECT r.id, r.request_type AS requestType, r.event,
        r.details_json AS detailsJson, r.created_at AS createdAt,
        l.status, l.updated_at AS updatedAt
      FROM portal_requests r JOIN leads l ON l.id = r.lead_id
      WHERE r.account_id = ? AND r.id = ?`).get(accountId, id);
    if (!row) return null;
    return { ...row, details: parseJson(row.detailsJson) };
  }

  listPortalRequests(accountId) {
    return this.db.prepare(`SELECT r.id, r.request_type AS requestType, r.event,
        r.details_json AS detailsJson, r.created_at AS createdAt,
        l.status, l.updated_at AS updatedAt
      FROM portal_requests r JOIN leads l ON l.id = r.lead_id
      WHERE r.account_id = ? ORDER BY r.created_at DESC LIMIT 100`).all(accountId)
      .map((row) => ({ ...row, details: parseJson(row.detailsJson) }));
  }

  listPortalAccounts({ page = 1, limit = 25, accountType = '', active = '', search = '' } = {}) {
    const where = [];
    const params = [];
    if (accountType) { where.push('a.account_type = ?'); params.push(accountType); }
    if (active !== '' && active !== undefined && active !== null) { where.push('a.active = ?'); params.push(Number(active) ? 1 : 0); }
    if (search) {
      const term = `%${String(search).replace(/[\\%_]/g, '\\$&')}%`;
      where.push(`(a.email LIKE ? ESCAPE '\\' OR p.name LIKE ? ESCAPE '\\' OR p.phone LIKE ? ESCAPE '\\'
        OR p.company LIKE ? ESCAPE '\\' OR p.country LIKE ? ESCAPE '\\' OR p.industry LIKE ? ESCAPE '\\')`);
      params.push(term, term, term, term, term, term);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = Number(this.db.prepare(`SELECT COUNT(*) AS n FROM portal_accounts a
      JOIN portal_profiles p ON p.account_id = a.id ${clause}`).get(...params).n);
    const offset = (page - 1) * limit;
    const items = this.db.prepare(`SELECT a.id, a.email, a.account_type AS accountType, a.active,
        a.created_at AS createdAt, a.last_login_at AS lastLoginAt,
        p.name, p.phone, p.company, p.country, p.industry,
        COUNT(r.id) AS requestCount,
        COALESCE(SUM(CASE WHEN l.status = 'new' THEN 1 ELSE 0 END), 0) AS newRequests,
        MAX(r.created_at) AS latestRequestAt
      FROM portal_accounts a JOIN portal_profiles p ON p.account_id = a.id
      LEFT JOIN portal_requests r ON r.account_id = a.id
      LEFT JOIN leads l ON l.id = r.lead_id
      ${clause}
      GROUP BY a.id ORDER BY a.created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset)
      .map((row) => ({
        ...row,
        active: Number(row.active),
        requestCount: Number(row.requestCount),
        newRequests: Number(row.newRequests),
      }));
    return { items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  getPortalAccountDetails(id) {
    const account = this.getPortalAccountById(id);
    if (!account) return null;
    const requests = this.db.prepare(`SELECT r.id, r.lead_id AS leadId,
        r.request_type AS requestType, r.event, r.details_json AS detailsJson,
        r.created_at AS createdAt, l.updated_at AS updatedAt, l.status,
        l.priority, l.assignee, COUNT(n.id) AS noteCount
      FROM portal_requests r JOIN leads l ON l.id = r.lead_id
      LEFT JOIN lead_notes n ON n.lead_id = l.id
      WHERE r.account_id = ?
      GROUP BY r.id ORDER BY r.created_at DESC LIMIT 100`).all(id)
      .map((row) => ({ ...row, details: parseJson(row.detailsJson), noteCount: Number(row.noteCount) }));
    /* `company` is already the profile's company name; the exhibitor's card travels as its own key */
    const exhibitorCard = account.accountType === 'exhibitor' ? this.getExhibitorCompany(id) : null;
    return { ...account, requests, exhibitorCard };
  }

  /* ---------- exhibitor company profile and files ---------- */

  getExhibitorCompany(accountId) {
    const row = this.db.prepare(`SELECT brand_name AS brandName, description, products, website, instagram, telegram,
        contact_name AS contactName, contact_phone AS contactPhone, contact_email AS contactEmail,
        event, stand, status, review_note AS reviewNote, updated_at AS updatedAt,
        submitted_at AS submittedAt, reviewed_at AS reviewedAt, reviewed_by AS reviewedBy
      FROM exhibitor_companies WHERE account_id = ?`).get(accountId);
    const company = row ? { ...row } : {
      brandName: '', description: '', products: '', website: '', instagram: '', telegram: '',
      contactName: '', contactPhone: '', contactEmail: '', event: '', stand: '',
      status: 'draft', reviewNote: '', updatedAt: null, submittedAt: null, reviewedAt: null, reviewedBy: '',
    };
    return { ...company, files: this.listExhibitorFiles(accountId) };
  }

  saveExhibitorCompany(accountId, fields, { submit = false } = {}) {
    const now = nowIso();
    const current = this.db.prepare('SELECT status, submitted_at AS submittedAt FROM exhibitor_companies WHERE account_id = ?').get(accountId);
    /* an edit after approval goes back to the organiser; "submit" sends a draft for review */
    const status = submit ? 'submitted' : current?.status === 'approved' || current?.status === 'submitted' ? 'submitted' : (current?.status || 'draft');
    const submittedAt = status === 'submitted' ? now : current?.submittedAt ?? null;
    this.db.prepare(`INSERT INTO exhibitor_companies (account_id, brand_name, description, products, website, instagram, telegram,
        contact_name, contact_phone, contact_email, event, stand, status, updated_at, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET brand_name = excluded.brand_name, description = excluded.description,
        products = excluded.products, website = excluded.website, instagram = excluded.instagram, telegram = excluded.telegram,
        contact_name = excluded.contact_name, contact_phone = excluded.contact_phone, contact_email = excluded.contact_email,
        event = excluded.event, stand = excluded.stand, status = excluded.status, updated_at = excluded.updated_at,
        submitted_at = excluded.submitted_at`)
      .run(accountId, fields.brandName, fields.description, fields.products, fields.website, fields.instagram, fields.telegram,
        fields.contactName, fields.contactPhone, fields.contactEmail, fields.event, fields.stand, status, now, submittedAt);
    return this.getExhibitorCompany(accountId);
  }

  reviewExhibitorCompany(accountId, { status, note }, actorEmail) {
    const result = this.db.prepare(`UPDATE exhibitor_companies SET status = ?, review_note = ?, reviewed_at = ?, reviewed_by = ?
      WHERE account_id = ?`).run(status, note, nowIso(), actorEmail, accountId);
    if (!result.changes) return null;
    this.audit(actorEmail, status === 'approved' ? 'exhibitor_profile.approve' : 'exhibitor_profile.request_changes', 'portal_account', accountId, { status, note });
    return this.getExhibitorCompany(accountId);
  }

  listExhibitorCompanies({ status = '' } = {}) {
    const where = status ? 'WHERE c.status = ?' : '';
    const rows = this.db.prepare(`SELECT c.account_id AS accountId, a.email, p.company, c.brand_name AS brandName, c.event, c.stand,
        c.status, c.updated_at AS updatedAt, c.submitted_at AS submittedAt,
        (SELECT COUNT(*) FROM exhibitor_files f WHERE f.account_id = c.account_id) AS fileCount,
        (SELECT id FROM exhibitor_files f WHERE f.account_id = c.account_id AND f.kind = 'logo' ORDER BY created_at DESC LIMIT 1) AS logoId
      FROM exhibitor_companies c JOIN portal_accounts a ON a.id = c.account_id
      LEFT JOIN portal_profiles p ON p.account_id = c.account_id
      ${where} ORDER BY CASE c.status WHEN 'submitted' THEN 0 WHEN 'changes' THEN 1 WHEN 'draft' THEN 2 ELSE 3 END, c.updated_at DESC LIMIT 500`)
      .all(...(status ? [status] : []));
    const counts = Object.fromEntries(this.db.prepare('SELECT status, COUNT(*) AS n FROM exhibitor_companies GROUP BY status').all().map((r) => [r.status, Number(r.n)]));
    return { items: rows.map((row) => ({ ...row, fileCount: Number(row.fileCount) })), counts };
  }

  listExhibitorFiles(accountId) {
    return this.db.prepare(`SELECT id, kind, file_name AS fileName, mime, size, created_at AS createdAt
      FROM exhibitor_files WHERE account_id = ? ORDER BY kind, created_at DESC`).all(accountId)
      .map((row) => ({ ...row, size: Number(row.size) }));
  }

  exhibitorFileUsage(accountId) {
    const rows = this.db.prepare('SELECT kind, COUNT(*) AS n, COALESCE(SUM(size), 0) AS bytes FROM exhibitor_files WHERE account_id = ? GROUP BY kind').all(accountId);
    const byKind = Object.fromEntries(rows.map((r) => [r.kind, Number(r.n)]));
    return { byKind, bytes: rows.reduce((sum, r) => sum + Number(r.bytes), 0) };
  }

  addExhibitorFile({ id, accountId, kind, fileName, mime, size, sha256, storageKey }) {
    this.db.prepare(`INSERT INTO exhibitor_files (id, account_id, kind, file_name, mime, size, sha256, storage_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, accountId, kind, fileName, mime, size, sha256, storageKey, nowIso());
    this.db.prepare(`UPDATE exhibitor_companies SET status = 'submitted', submitted_at = ?, updated_at = ?
      WHERE account_id = ? AND status = 'approved'`).run(nowIso(), nowIso(), accountId);
    return this.getExhibitorFile(id);
  }

  getExhibitorFile(id) {
    const row = this.db.prepare(`SELECT id, account_id AS accountId, kind, file_name AS fileName, mime, size, sha256,
        storage_key AS storageKey, created_at AS createdAt FROM exhibitor_files WHERE id = ?`).get(id);
    return row ? { ...row, size: Number(row.size) } : null;
  }

  deleteExhibitorFile(id) {
    const file = this.getExhibitorFile(id);
    if (file) this.db.prepare('DELETE FROM exhibitor_files WHERE id = ?').run(id);
    return file;
  }

  updatePortalAccount(id, { active }, actorEmail) {
    const current = this.getPortalAccountById(id);
    if (!current) return null;
    const nextActive = Number(Boolean(active));
    let revokedSessions = 0;
    transaction(this.db, () => {
      if (Number(current.active) !== nextActive) {
        this.db.prepare('UPDATE portal_accounts SET active = ? WHERE id = ?').run(nextActive, id);
        if (!nextActive) revokedSessions = Number(this.db.prepare('DELETE FROM portal_sessions WHERE account_id = ?').run(id).changes || 0);
        this.audit(actorEmail, nextActive ? 'portal_account.activate' : 'portal_account.deactivate', 'portal_account', id, {
          email: current.email,
          accountType: current.accountType,
          active: Boolean(nextActive),
          revokedSessions,
        });
      }
    });
    return { account: this.getPortalAccountDetails(id), revokedSessions };
  }

  createUser({ email, password, role = 'manager' }) {
    const normalized = normalizeEmail(email);
    const { salt, hash } = hashPassword(password);
    const user = { id: randomUUID(), email: normalized, role, createdAt: nowIso() };
    this.db.prepare(`INSERT INTO users (id, email, password_salt, password_hash, role, active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)`)
      .run(user.id, user.email, salt, hash, user.role, user.createdAt);
    return user;
  }

  listUsers() {
    return this.db.prepare(`SELECT id, email, role, active, created_at AS createdAt, last_login_at AS lastLoginAt
      FROM users ORDER BY created_at ASC`).all();
  }

  updateUser(id, patch, actorEmail) {
    const current = this.getUserById(id);
    if (!current) return null;
    const role = patch.role ?? current.role;
    const active = patch.active === undefined ? Number(current.active) : Number(Boolean(patch.active));
    const now = nowIso();
    transaction(this.db, () => {
      this.db.prepare('UPDATE users SET role = ?, active = ? WHERE id = ?').run(role, active, id);
      this.audit(actorEmail, 'user.update', 'user', id, { role, active });
    });
    return this.getUserById(id);
  }

  countActiveAdmins() {
    return Number(this.db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1").get().n);
  }

  recordAudit(actorEmail, action, entityType, entityId, details = {}) {
    this.audit(actorEmail, action, entityType, entityId, details);
  }

  audit(actorEmail, action, entityType, entityId, details = {}) {
    this.db.prepare(`INSERT INTO audit_log (actor_email, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run(actorEmail, action, entityType, entityId, JSON.stringify(details), nowIso());
  }

  createLead(lead, providers = []) {
    const id = randomUUID();
    const createdAt = nowIso();
    const stored = { ...lead, id, createdAt, updatedAt: createdAt, status: 'new', priority: 'normal', assignee: '' };
    transaction(this.db, () => {
      this.db.prepare(`INSERT INTO leads (
        id, created_at, updated_at, name, company, phone, email, form_type, event, locale,
        source, page, landing, referrer, utm_json, payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(
          id, createdAt, createdAt, stored.name, stored.company, stored.phone, stored.email,
          stored.formType, stored.event, stored.locale, stored.source, stored.page, stored.landing,
          stored.referrer, JSON.stringify(stored.utm), JSON.stringify(stored.payload),
        );
      for (const provider of providers) {
        this.enqueueDelivery(id, provider, { lead: stored });
      }
    });
    return this.getLead(id);
  }

  insertLead(lead, { queueProviders = [] } = {}) {
    const createdAt = lead.createdAt || nowIso();
    this.db.prepare(`INSERT OR IGNORE INTO leads (
      id, created_at, updated_at, name, company, phone, email, form_type, event, locale,
      source, page, landing, referrer, utm_json, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        lead.id || randomUUID(), createdAt, createdAt, lead.name, lead.company, lead.phone, lead.email,
        lead.formType, lead.event, lead.locale, lead.source, lead.page, lead.landing, lead.referrer,
        JSON.stringify(lead.utm || {}), JSON.stringify(lead.payload || {}),
      );
    const id = lead.id || this.db.prepare('SELECT id FROM leads ORDER BY rowid DESC LIMIT 1').get().id;
    for (const provider of queueProviders) this.enqueueDelivery(id, provider, { lead });
    return id;
  }

  enqueueDelivery(leadId, provider, payload) {
    const now = nowIso();
    this.db.prepare(`INSERT INTO delivery_outbox (lead_id, provider, state, attempts, payload_json, next_attempt_at, created_at)
      VALUES (?, ?, 'pending', 0, ?, ?, ?)`)
      .run(leadId, provider, JSON.stringify(payload), now, now);
  }

  getLead(id) {
    const row = this.db.prepare(`SELECT id, created_at AS createdAt, updated_at AS updatedAt,
        name, company, phone, email, form_type AS formType, event, locale, source, page, landing,
        referrer, utm_json AS utmJson, payload_json AS payloadJson, status, priority, assignee
      FROM leads WHERE id = ?`).get(id);
    if (!row) return null;
    const notes = this.db.prepare(`SELECT id, author_email AS authorEmail, body, created_at AS createdAt
      FROM lead_notes WHERE lead_id = ? ORDER BY created_at ASC`).all(id);
    const deliveries = this.db.prepare(`SELECT id, provider, state, attempts, next_attempt_at AS nextAttemptAt,
        sent_at AS sentAt, last_error AS lastError, created_at AS createdAt
      FROM delivery_outbox WHERE lead_id = ? ORDER BY id ASC`).all(id);
    const history = this.db.prepare(`SELECT id, actor_email AS actorEmail, action, details_json AS detailsJson, created_at AS createdAt
      FROM audit_log WHERE entity_type = 'lead' AND entity_id = ? ORDER BY id ASC`).all(id)
      .map((item) => ({ ...item, details: parseJson(item.detailsJson), detailsJson: undefined }));
    return {
      ...row,
      utm: parseJson(row.utmJson),
      payload: parseJson(row.payloadJson),
      notes,
      deliveries,
      history,
    };
  }

  listLeads({ page = 1, limit = 25, status = '', formType = '', search = '', from = '', to = '' } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('status = ?'); params.push(status); }
    if (formType) { where.push('form_type = ?'); params.push(formType); }
    if (from) { where.push("substr(created_at, 1, 10) >= ?"); params.push(from); }
    if (to) { where.push("substr(created_at, 1, 10) <= ?"); params.push(to); }
    if (search) {
      const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      where.push(`(name LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\'
        OR email LIKE ? ESCAPE '\\' OR event LIKE ? ESCAPE '\\' OR id LIKE ? ESCAPE '\\')`);
      params.push(term, term, term, term, term, term);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = Number(this.db.prepare(`SELECT COUNT(*) AS n FROM leads ${clause}`).get(...params).n);
    const offset = (page - 1) * limit;
    const items = this.db.prepare(`SELECT id, created_at AS createdAt, updated_at AS updatedAt,
        name, company, phone, email, form_type AS formType, event, locale, source, page,
        status, priority, assignee
      FROM leads ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);
    return { items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  updateLead(id, patch, actorEmail) {
    const current = this.db.prepare('SELECT status, priority, assignee FROM leads WHERE id = ?').get(id);
    if (!current) return null;
    const next = {
      status: patch.status ?? current.status,
      priority: patch.priority ?? current.priority,
      assignee: patch.assignee ?? current.assignee,
    };
    const updatedAt = nowIso();
    transaction(this.db, () => {
      this.db.prepare('UPDATE leads SET status = ?, priority = ?, assignee = ?, updated_at = ? WHERE id = ?')
        .run(next.status, next.priority, next.assignee, updatedAt, id);
      const changed = Object.fromEntries(Object.keys(next).filter((key) => next[key] !== current[key]).map((key) => [key, { from: current[key], to: next[key] }]));
      if (Object.keys(changed).length) this.audit(actorEmail, 'lead.update', 'lead', id, changed);
    });
    return this.getLead(id);
  }

  addLeadNote(leadId, { userId, authorEmail, body }) {
    if (!this.db.prepare('SELECT 1 FROM leads WHERE id = ?').get(leadId)) return null;
    const note = { id: randomUUID(), leadId, authorEmail, body, createdAt: nowIso() };
    transaction(this.db, () => {
      this.db.prepare(`INSERT INTO lead_notes (id, lead_id, user_id, author_email, body, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .run(note.id, leadId, userId, authorEmail, body, note.createdAt);
      this.audit(authorEmail, 'lead.note.add', 'lead', leadId, { noteId: note.id });
    });
    return note;
  }

  insertEvent(event) {
    this.db.prepare(`INSERT INTO analytics_events (
      event_name, received_at, session_id, locale, path, form_type, source, channel, cta,
      utm_source, utm_medium, utm_campaign, seconds, percent, success, fallback
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        event.eventName, event.receivedAt || nowIso(), event.sessionId || '', event.locale || '',
        event.path || '', event.formType || '', event.source || '', event.channel || '', event.cta || '',
        event.utmSource || '', event.utmMedium || '', event.utmCampaign || '', event.seconds ?? null,
        event.percent ?? null, event.success ?? null, event.fallback ?? null,
      );
  }

  addEvents(events) {
    const insert = this.db.prepare(`INSERT INTO analytics_events (
      event_name, received_at, session_id, locale, path, form_type, source, channel, cta,
      utm_source, utm_medium, utm_campaign, seconds, percent, success, fallback
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const now = nowIso();
    return transaction(this.db, () => {
      let saved = 0;
      for (const event of events) {
        insert.run(
          event.eventName, now, event.sessionId, event.locale, event.path, event.formType,
          event.source, event.channel, event.cta, event.utmSource, event.utmMedium,
          event.utmCampaign, event.seconds, event.percent, event.success, event.fallback,
        );
        saved += 1;
      }
      return saved;
    });
  }

  dashboard(days = 30) {
    const { startDay, startAt } = dateRange(days);
    const dailyLeads = this.db.prepare(`SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
      FROM leads WHERE created_at >= ? GROUP BY day ORDER BY day`).all(startAt);
    const dailySessions = this.db.prepare(`SELECT substr(received_at, 1, 10) AS day, COUNT(DISTINCT session_id) AS count
      FROM analytics_events WHERE received_at >= ? AND event_name = 'page_view' AND session_id <> ''
      GROUP BY day ORDER BY day`).all(startAt);
    const leadTotal = Number(this.db.prepare('SELECT COUNT(*) AS n FROM leads WHERE created_at >= ?').get(startAt).n);
    const sessions = Number(this.db.prepare(`SELECT COUNT(DISTINCT session_id) AS n FROM analytics_events
      WHERE received_at >= ? AND event_name = 'page_view' AND session_id <> ''`).get(startAt).n);
    const newLeads = Number(this.db.prepare("SELECT COUNT(*) AS n FROM leads WHERE created_at >= ? AND status = 'new'").get(startAt).n);
    const statusRows = this.db.prepare(`SELECT status AS key, COUNT(*) AS count FROM leads
      WHERE created_at >= ? GROUP BY status ORDER BY count DESC`).all(startAt);
    const formRows = this.db.prepare(`SELECT form_type AS key, COUNT(*) AS count FROM leads
      WHERE created_at >= ? GROUP BY form_type ORDER BY count DESC`).all(startAt);
    const sourceRows = this.db.prepare(`SELECT source AS key, COUNT(*) AS count FROM leads
      WHERE created_at >= ? AND source <> '' GROUP BY source ORDER BY count DESC LIMIT 8`).all(startAt);
    const portalAccounts = Number(this.db.prepare('SELECT COUNT(*) AS n FROM portal_accounts WHERE created_at >= ?').get(startAt).n);
    const portalRequests = Number(this.db.prepare('SELECT COUNT(*) AS n FROM portal_requests WHERE created_at >= ?').get(startAt).n);
    const portalNewRequests = Number(this.db.prepare(`SELECT COUNT(*) AS n FROM portal_requests r
      JOIN leads l ON l.id = r.lead_id WHERE r.created_at >= ? AND l.status = 'new'`).get(startAt).n);
    const outbox = this.outboxStats();
    const leadByDay = new Map(dailyLeads.map((row) => [row.day, Number(row.count)]));
    const sessionsByDay = new Map(dailySessions.map((row) => [row.day, Number(row.count)]));
    const daily = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(`${startDay}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + i);
      const day = dayKey(date);
      daily.push({ day, leads: leadByDay.get(day) || 0, sessions: sessionsByDay.get(day) || 0 });
    }
    return {
      days,
      totalLeads: leadTotal,
      newLeads,
      sessions,
      conversionRate: sessions ? Number(((leadTotal / sessions) * 100).toFixed(1)) : 0,
      portalAccounts,
      portalRequests,
      portalNewRequests,
      daily,
      statuses: statusRows,
      forms: formRows,
      sources: sourceRows,
      outbox,
    };
  }

  analytics(days = 30) {
    const { startAt } = dateRange(days);
    const eventRows = this.db.prepare(`SELECT event_name AS key, COUNT(*) AS count FROM analytics_events
      WHERE received_at >= ? GROUP BY event_name ORDER BY count DESC`).all(startAt);
    const pageRows = this.db.prepare(`SELECT path AS key, COUNT(*) AS count FROM analytics_events
      WHERE received_at >= ? AND event_name = 'page_view' AND path <> '' GROUP BY path ORDER BY count DESC LIMIT 10`).all(startAt);
    const campaignRows = this.db.prepare(`SELECT utm_campaign AS key, COUNT(*) AS count FROM analytics_events
      WHERE received_at >= ? AND utm_campaign <> '' GROUP BY utm_campaign ORDER BY count DESC LIMIT 10`).all(startAt);
    const ctaRows = this.db.prepare(`SELECT cta AS key, COUNT(*) AS count FROM analytics_events
      WHERE received_at >= ? AND event_name = 'cta_click' AND cta <> '' GROUP BY cta ORDER BY count DESC LIMIT 10`).all(startAt);
    const channelRows = this.db.prepare(`SELECT channel AS key, COUNT(*) AS count FROM analytics_events
      WHERE received_at >= ? AND channel <> '' GROUP BY channel ORDER BY count DESC LIMIT 10`).all(startAt);
    const localeRows = this.db.prepare(`SELECT locale AS key, COUNT(DISTINCT session_id) AS count FROM analytics_events
      WHERE received_at >= ? AND event_name = 'page_view' AND locale <> '' AND session_id <> '' GROUP BY locale ORDER BY count DESC`).all(startAt);
    const funnelRow = this.db.prepare(`SELECT
        COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND session_id <> '' THEN session_id END) AS visits,
        COUNT(DISTINCT CASE WHEN event_name = 'cta_click' AND session_id <> '' THEN session_id END) AS ctaSessions,
        COUNT(DISTINCT CASE WHEN event_name IN ('form_start', 'quiz_start') AND session_id <> '' THEN session_id END) AS formStartSessions,
        COUNT(DISTINCT CASE WHEN event_name IN ('form_submit', 'quiz_submit') AND success = 1 AND session_id <> '' THEN session_id END) AS successSessions,
        SUM(CASE WHEN event_name IN ('form_submit', 'quiz_submit') AND success = 1 THEN 1 ELSE 0 END) AS successfulSubmissions,
        SUM(CASE WHEN event_name IN ('form_submit', 'quiz_submit') AND fallback = 1 THEN 1 ELSE 0 END) AS fallbackSubmissions
      FROM analytics_events WHERE received_at >= ?`).get(startAt);
    const funnel = Object.fromEntries(Object.entries(funnelRow).map(([key, value]) => [key, Number(value || 0)]));
    const daily = this.db.prepare(`SELECT substr(received_at, 1, 10) AS day,
        SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS views,
        COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id END) AS sessions,
        SUM(CASE WHEN event_name IN ('form_submit', 'quiz_submit') AND success = 1 THEN 1 ELSE 0 END) AS formSubmits
      FROM analytics_events WHERE received_at >= ? GROUP BY day ORDER BY day`).all(startAt);
    const eventTotal = Number(this.db.prepare('SELECT COUNT(*) AS n FROM analytics_events WHERE received_at >= ?').get(startAt).n);
    const accountTypeRows = this.db.prepare(`SELECT account_type AS key, COUNT(*) AS count FROM portal_accounts
      WHERE created_at >= ? GROUP BY account_type ORDER BY count DESC`).all(startAt);
    const requestTypeRows = this.db.prepare(`SELECT request_type AS key, COUNT(*) AS count FROM portal_requests
      WHERE created_at >= ? GROUP BY request_type ORDER BY count DESC`).all(startAt);
    const requestStatusRows = this.db.prepare(`SELECT l.status AS key, COUNT(*) AS count FROM portal_requests r
      JOIN leads l ON l.id = r.lead_id WHERE r.created_at >= ? GROUP BY l.status ORDER BY count DESC`).all(startAt);
    const portalEventRows = this.db.prepare(`SELECT event AS key, COUNT(*) AS count FROM portal_requests
      WHERE created_at >= ? GROUP BY event ORDER BY count DESC LIMIT 10`).all(startAt);
    const portalAccounts = Number(this.db.prepare('SELECT COUNT(*) AS n FROM portal_accounts WHERE created_at >= ?').get(startAt).n);
    const portalRequests = Number(this.db.prepare('SELECT COUNT(*) AS n FROM portal_requests WHERE created_at >= ?').get(startAt).n);
    const accountDailyRows = this.db.prepare(`SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
      FROM portal_accounts WHERE created_at >= ? GROUP BY day`).all(startAt);
    const requestDailyRows = this.db.prepare(`SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
      FROM portal_requests WHERE created_at >= ? GROUP BY day`).all(startAt);
    const accountByDay = new Map(accountDailyRows.map((row) => [row.day, Number(row.count)]));
    const requestsByDay = new Map(requestDailyRows.map((row) => [row.day, Number(row.count)]));
    const portalDaily = Array.from(new Set([...accountByDay.keys(), ...requestsByDay.keys()])).sort()
      .map((day) => ({ day, accounts: accountByDay.get(day) || 0, requests: requestsByDay.get(day) || 0 }));
    return {
      days, eventTotal, events: eventRows, pages: pageRows, campaigns: campaignRows,
      ctas: ctaRows, channels: channelRows, locales: localeRows, funnel, daily,
      portal: {
        accounts: portalAccounts,
        requests: portalRequests,
        accountsByType: accountTypeRows,
        requestsByType: requestTypeRows,
        requestStatuses: requestStatusRows,
        events: portalEventRows,
        daily: portalDaily,
      },
    };
  }

  eventSummary() {
    const eventRows = this.db.prepare(`SELECT substr(received_at, 1, 10) AS day, event_name AS event, COUNT(*) AS count
      FROM analytics_events GROUP BY day, event_name ORDER BY day DESC`).all();
    const sessionRows = this.db.prepare(`SELECT substr(received_at, 1, 10) AS day, COUNT(DISTINCT session_id) AS count
      FROM analytics_events WHERE session_id <> '' GROUP BY day`).all();
    const formRows = this.db.prepare(`SELECT substr(received_at, 1, 10) AS day, form_type AS form, fallback, COUNT(*) AS count
      FROM analytics_events WHERE event_name IN ('form_submit', 'quiz_submit')
      GROUP BY day, form_type, fallback ORDER BY day DESC`).all();
    const days = {};
    for (const row of eventRows) {
      const bucket = days[row.day] ??= { sessions: 0, events: {}, forms: {} };
      bucket.events[row.event] = Number(row.count);
    }
    for (const row of sessionRows) {
      (days[row.day] ??= { sessions: 0, events: {}, forms: {} }).sessions = Number(row.count);
    }
    for (const row of formRows) {
      const bucket = days[row.day] ??= { sessions: 0, events: {}, forms: {} };
      const key = `${row.form || 'quiz'}${row.fallback ? ' (not delivered)' : ''}`;
      bucket.forms[key] = Number(row.count);
    }
    return Object.fromEntries(Object.entries(days).sort(([a], [b]) => a < b ? 1 : -1));
  }

  dueDeliveries(limit = 10) {
    return this.db.prepare(`SELECT id, lead_id AS leadId, provider, attempts, payload_json AS payloadJson
      FROM delivery_outbox WHERE state = 'pending' AND next_attempt_at <= ? ORDER BY id ASC LIMIT ?`)
      .all(nowIso(), limit)
      .map((row) => ({ ...row, payload: parseJson(row.payloadJson) }));
  }

  markDeliverySending(id) {
    return this.db.prepare("UPDATE delivery_outbox SET state = 'sending' WHERE id = ? AND state = 'pending'").run(id).changes > 0;
  }

  completeDelivery(id) {
    this.db.prepare("UPDATE delivery_outbox SET state = 'sent', sent_at = ?, last_error = '' WHERE id = ?")
      .run(nowIso(), id);
  }

  failDelivery(id, attempts, error, maxAttempts = 8, minWaitMs = 0) {
    const terminal = attempts >= maxAttempts;
    /* exponential back-off, but never sooner than the provider asked for (Telegram's 429) */
    const wait = Math.max(Number(minWaitMs) || 0, Math.min(60 * 60 * 1000, 30_000 * (2 ** Math.max(0, attempts - 1))));
    const next = terminal ? nowIso() : new Date(Date.now() + wait).toISOString();
    this.db.prepare(`UPDATE delivery_outbox SET state = ?, attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?`)
      .run(terminal ? 'failed' : 'pending', attempts, next, String(error || 'delivery failed').slice(0, 500), id);
  }

  retryFailedDeliveries() {
    const result = this.db.prepare("UPDATE delivery_outbox SET state = 'pending', attempts = 0, next_attempt_at = ?, last_error = '' WHERE state = 'failed'")
      .run(nowIso());
    return result.changes;
  }

  outboxStats() {
    const rows = this.db.prepare('SELECT provider, state, COUNT(*) AS count FROM delivery_outbox GROUP BY provider, state').all();
    const providers = {};
    let pending = 0;
    let failed = 0;
    for (const row of rows) {
      const count = Number(row.count);
      (providers[row.provider] ??= {})[row.state] = count;
      if (row.state === 'pending' || row.state === 'sending') pending += count;
      if (row.state === 'failed') failed += count;
    }
    return { pending, failed, providers };
  }

  listFailedDeliveries(limit = 20) {
    return this.db.prepare(`SELECT d.id, d.lead_id AS leadId, d.provider, d.state, d.attempts,
        d.last_error AS lastError, d.created_at AS createdAt, l.name, l.phone
      FROM delivery_outbox d JOIN leads l ON l.id = d.lead_id
      WHERE d.state IN ('pending', 'failed') ORDER BY CASE d.state WHEN 'failed' THEN 0 ELSE 1 END, d.id DESC LIMIT ?`)
      .all(limit);
  }

  listAudit({ page = 1, limit = 25, actorEmail = '', action = '', entityType = '', search = '', from = '', to = '' } = {}) {
    const where = [];
    const params = [];
    if (actorEmail) { where.push('actor_email = ? COLLATE NOCASE'); params.push(actorEmail); }
    if (action) { where.push('action = ?'); params.push(action); }
    if (entityType) { where.push('entity_type = ?'); params.push(entityType); }
    if (from) { where.push('substr(created_at, 1, 10) >= ?'); params.push(from); }
    if (to) { where.push('substr(created_at, 1, 10) <= ?'); params.push(to); }
    if (search) {
      const term = `%${String(search).replace(/[\\%_]/g, '\\$&')}%`;
      where.push(`(actor_email LIKE ? ESCAPE '\\' OR action LIKE ? ESCAPE '\\' OR entity_type LIKE ? ESCAPE '\\'
        OR entity_id LIKE ? ESCAPE '\\' OR details_json LIKE ? ESCAPE '\\')`);
      params.push(term, term, term, term, term);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = Number(this.db.prepare(`SELECT COUNT(*) AS n FROM audit_log ${clause}`).get(...params).n);
    const offset = (page - 1) * limit;
    const items = this.db.prepare(`SELECT id, actor_email AS actorEmail, action, entity_type AS entityType,
        entity_id AS entityId, details_json AS detailsJson, created_at AS createdAt
      FROM audit_log ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset)
      .map((row) => ({ ...row, details: parseJson(row.detailsJson), detailsJson: undefined }));
    return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  recentAudit(limit = 25) {
    return this.listAudit({ page: 1, limit }).items;
  }
}
