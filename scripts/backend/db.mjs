import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { hashPassword, normalizeEmail } from './auth.mjs';
import { editionLabel } from './showcase.mjs';
import { isUpcomingEdition } from './shows.mjs';
import { slugify, uniqueSlug } from './tgblog/slug.mjs';

/* The sales pipeline, in order: a lead is a form filled on the site; it ends as a sold stand
   (won) or a closed opportunity (lost). spam stays outside the funnel. */
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'spam'];
export const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];
export const OPEN_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];
export const LEAD_PRIORITIES = ['low', 'normal', 'high'];
export const USER_ROLES = ['admin', 'manager'];
export const NOTE_KINDS = ['note', 'call', 'meeting', 'email', 'message', 'task'];
export const CURRENCIES = ['USD', 'UZS', 'EUR', 'RUB'];
export const SHOWCASE_STATUSES = ['draft', 'pending', 'published', 'rejected', 'hidden'];
export const FILE_KINDS = ['logo', 'catalog', 'brochure', 'flyer', 'presentation', 'pricelist', 'image', 'other'];
const CONTACT_NOTE_KINDS = new Set(['call', 'meeting', 'email', 'message']);
const STAGE_INDEX = Object.fromEntries(PIPELINE_STAGES.map((stage, index) => [stage, index]));

/* leads DDL — one definition for a fresh database and for the v2 rebuild of an old one */
const leadsTableSql = (name) => `CREATE TABLE IF NOT EXISTS ${name} (
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
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'spam')),
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
        assignee TEXT NOT NULL DEFAULT '',
        session_id TEXT NOT NULL DEFAULT '',
        deal_amount REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        stand_area REAL,
        lost_reason TEXT NOT NULL DEFAULT '',
        next_action TEXT NOT NULL DEFAULT '',
        next_action_at TEXT,
        first_contact_at TEXT,
        stage_changed_at TEXT,
        closed_at TEXT
      )`;
const LEADS_INDEXES = `
      CREATE INDEX IF NOT EXISTS leads_created_idx ON leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS leads_status_created_idx ON leads(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS leads_form_created_idx ON leads(form_type, created_at DESC);
      CREATE INDEX IF NOT EXISTS leads_next_action_idx ON leads(next_action_at);
      CREATE INDEX IF NOT EXISTS leads_session_idx ON leads(session_id);`;
const LEAD_COLUMNS = `id, created_at AS createdAt, updated_at AS updatedAt,
        name, company, phone, email, form_type AS formType, event, locale, source, page, landing,
        referrer, utm_json AS utmJson, payload_json AS payloadJson, status, priority, assignee,
        session_id AS sessionId, deal_amount AS dealAmount, currency, stand_area AS standArea,
        lost_reason AS lostReason, next_action AS nextAction, next_action_at AS nextActionAt,
        first_contact_at AS firstContactAt, stage_changed_at AS stageChangedAt, closed_at AS closedAt`;
const LEAD_LIST_COLUMNS = `id, created_at AS createdAt, updated_at AS updatedAt,
        name, company, phone, email, form_type AS formType, event, locale, source, page,
        status, priority, assignee, deal_amount AS dealAmount, currency, stand_area AS standArea,
        next_action AS nextAction, next_action_at AS nextActionAt, stage_changed_at AS stageChangedAt,
        first_contact_at AS firstContactAt, closed_at AS closedAt, lost_reason AS lostReason`;
const likeTerm = (value) => `%${String(value).replace(/[\\%_]/g, '\\$&')}%`;
const hoursBetween = (from, to) => (Date.parse(to) - Date.parse(from)) / 3_600_000;

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
      ${leadsTableSql('leads')};
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
      CREATE TABLE IF NOT EXISTS lead_stage_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        from_status TEXT NOT NULL DEFAULT '',
        to_status TEXT NOT NULL,
        actor_email TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS lead_stage_history_lead_idx ON lead_stage_history(lead_id, id);
      CREATE INDEX IF NOT EXISTS lead_stage_history_to_idx ON lead_stage_history(to_status, created_at);
      CREATE TABLE IF NOT EXISTS exhibitor_showcases (
        account_id TEXT PRIMARY KEY REFERENCES portal_accounts(id) ON DELETE CASCADE,
        slug TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'hidden')),
        draft_json TEXT NOT NULL DEFAULT '{}',
        published_json TEXT NOT NULL DEFAULT '',
        review_note TEXT NOT NULL DEFAULT '',
        reviewed_by TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        submitted_at TEXT,
        published_at TEXT
      );
      CREATE INDEX IF NOT EXISTS exhibitor_showcases_status_idx ON exhibitor_showcases(status, updated_at DESC);
      CREATE TABLE IF NOT EXISTS portal_files (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
        kind TEXT NOT NULL DEFAULT 'other',
        title TEXT NOT NULL DEFAULT '',
        original_name TEXT NOT NULL DEFAULT '',
        mime TEXT NOT NULL,
        size INTEGER NOT NULL,
        sha256 TEXT NOT NULL,
        storage_name TEXT NOT NULL,
        published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS portal_files_account_idx ON portal_files(account_id, created_at);
    `);
    // If the old JSONL process was interrupted mid-send, let the new worker safely resume it.
    this.db.prepare("UPDATE delivery_outbox SET state = 'pending', next_attempt_at = ? WHERE state = 'sending'").run(nowIso());
    this.migrateLeadsV2();
    this.db.exec(LEADS_INDEXES);
    if (!this.db.prepare('PRAGMA table_info(lead_notes)').all().some((column) => column.name === 'kind')) {
      this.db.exec("ALTER TABLE lead_notes ADD COLUMN kind TEXT NOT NULL DEFAULT 'note'");
    }
    this.backfillStageHistory();
    this.cleanupSessions();
    this.seedAdmin(adminEmail, adminPassword);
    this.importLegacyFile(legacyLeadsPath, 'legacy-leads-jsonl-v1', (line) => this.importLegacyLead(line));
    this.importLegacyFile(legacyEventsPath, 'legacy-events-jsonl-v1', (line) => this.insertLegacyEvent(line));
    this.cleanupExpiredLeads();
  }

  close() {
    this.db.close();
  }

  /* v2 pipeline: the status CHECK gained proposal/negotiation and the lead got deal fields.
     SQLite cannot alter a CHECK, so an old table is rebuilt the documented way (foreign keys
     off, copy, drop, rename) — child tables keep pointing at "leads" by name. */
  migrateLeadsV2() {
    const columns = this.db.prepare('PRAGMA table_info(leads)').all().map((column) => column.name);
    if (columns.includes('deal_amount')) return;
    this.db.exec('PRAGMA foreign_keys = OFF');
    try {
      transaction(this.db, () => {
        this.db.exec(`${leadsTableSql('leads_v2')};`);
        this.db.exec(`INSERT INTO leads_v2 (
            id, created_at, updated_at, name, company, phone, email, form_type, event, locale, source,
            page, landing, referrer, utm_json, payload_json, status, priority, assignee,
            stage_changed_at, first_contact_at, closed_at
          ) SELECT id, created_at, updated_at, name, company, phone, email, form_type, event, locale, source,
            page, landing, referrer, utm_json, payload_json, status, priority, assignee,
            updated_at,
            CASE WHEN status <> 'new' THEN updated_at END,
            CASE WHEN status IN ('won', 'lost', 'spam') THEN updated_at END
          FROM leads`);
        this.db.exec('DROP TABLE leads');
        this.db.exec('ALTER TABLE leads_v2 RENAME TO leads');
        this.db.prepare('INSERT OR IGNORE INTO schema_migrations (name, applied_at) VALUES (?, ?)').run('leads-pipeline-v2', nowIso());
      });
    } finally {
      this.db.exec('PRAGMA foreign_keys = ON');
    }
  }

  /* one-off: leads created before the stage log get a history rebuilt from the audit trail */
  backfillStageHistory() {
    if (this.db.prepare('SELECT 1 FROM schema_migrations WHERE name = ?').get('lead-stage-history-v1')) return;
    transaction(this.db, () => {
      const insert = this.db.prepare(`INSERT INTO lead_stage_history (lead_id, from_status, to_status, actor_email, created_at)
        VALUES (?, ?, ?, ?, ?)`);
      const leads = this.db.prepare(`SELECT id, status, created_at AS createdAt, updated_at AS updatedAt FROM leads
        WHERE id NOT IN (SELECT DISTINCT lead_id FROM lead_stage_history)`).all();
      const audits = this.db.prepare(`SELECT actor_email AS actor, details_json AS details, created_at AS createdAt
        FROM audit_log WHERE entity_type = 'lead' AND action = 'lead.update' AND entity_id = ? ORDER BY id`);
      for (const lead of leads) {
        insert.run(lead.id, '', 'new', '', lead.createdAt);
        let last = 'new';
        for (const row of audits.all(lead.id)) {
          const change = parseJson(row.details)?.status;
          if (!change?.to || change.to === last) continue;
          insert.run(lead.id, change.from || last, change.to, row.actor, row.createdAt);
          last = change.to;
        }
        if (last !== lead.status) insert.run(lead.id, last, lead.status, '', lead.updatedAt);
      }
      this.db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run('lead-stage-history-v1', nowIso());
    });
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
    return { ...account, requests };
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
      this.insertLead(stored, { queueProviders: providers });
    });
    return this.getLead(id);
  }

  insertLead(lead, { queueProviders = [] } = {}) {
    const id = lead.id || randomUUID();
    const createdAt = lead.createdAt || nowIso();
    const result = this.db.prepare(`INSERT OR IGNORE INTO leads (
      id, created_at, updated_at, name, company, phone, email, form_type, event, locale,
      source, page, landing, referrer, utm_json, payload_json, session_id, stage_changed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        id, createdAt, createdAt, lead.name, lead.company || '', lead.phone, lead.email || '',
        lead.formType || 'generic', lead.event || '', lead.locale || '', lead.source || '', lead.page || '',
        lead.landing || '', lead.referrer || '', JSON.stringify(lead.utm || {}), JSON.stringify(lead.payload || {}),
        lead.sessionId || '', createdAt,
      );
    if (Number(result.changes)) {
      this.db.prepare(`INSERT INTO lead_stage_history (lead_id, from_status, to_status, actor_email, created_at)
        VALUES (?, '', 'new', '', ?)`).run(id, createdAt);
    }
    for (const provider of queueProviders) this.enqueueDelivery(id, provider, { lead: { ...lead, id, createdAt } });
    return id;
  }

  enqueueDelivery(leadId, provider, payload) {
    const now = nowIso();
    this.db.prepare(`INSERT INTO delivery_outbox (lead_id, provider, state, attempts, payload_json, next_attempt_at, created_at)
      VALUES (?, ?, 'pending', 0, ?, ?, ?)`)
      .run(leadId, provider, JSON.stringify(payload), now, now);
  }

  getLead(id) {
    const row = this.db.prepare(`SELECT ${LEAD_COLUMNS} FROM leads WHERE id = ?`).get(id);
    if (!row) return null;
    const notes = this.db.prepare(`SELECT id, kind, author_email AS authorEmail, body, created_at AS createdAt
      FROM lead_notes WHERE lead_id = ? ORDER BY created_at ASC`).all(id);
    const deliveries = this.db.prepare(`SELECT id, provider, state, attempts, next_attempt_at AS nextAttemptAt,
        sent_at AS sentAt, last_error AS lastError, created_at AS createdAt
      FROM delivery_outbox WHERE lead_id = ? ORDER BY id ASC`).all(id);
    const history = this.db.prepare(`SELECT id, actor_email AS actorEmail, action, details_json AS detailsJson, created_at AS createdAt
      FROM audit_log WHERE entity_type = 'lead' AND entity_id = ? ORDER BY id ASC`).all(id)
      .map((item) => ({ ...item, details: parseJson(item.detailsJson), detailsJson: undefined }));
    const stageHistory = this.db.prepare(`SELECT from_status AS fromStatus, to_status AS toStatus,
        actor_email AS actorEmail, created_at AS createdAt
      FROM lead_stage_history WHERE lead_id = ? ORDER BY id ASC`).all(id);
    /* the anonymous first-party session the form was sent from: the pages and clicks that led
       to this request (analytics_events carries no personal data of its own) */
    const journey = row.sessionId ? this.db.prepare(`SELECT event_name AS event, received_at AS at, path, cta,
        form_type AS formType, channel, seconds, percent, utm_source AS utmSource, utm_campaign AS utmCampaign
      FROM analytics_events WHERE session_id = ? ORDER BY id ASC LIMIT 300`).all(row.sessionId) : [];
    const digits = String(row.phone || '').replace(/\D/g, '').slice(-9);
    const related = this.db.prepare(`SELECT id, name, form_type AS formType, event, status, created_at AS createdAt
      FROM leads WHERE id <> ? AND ((? <> '' AND email = ? COLLATE NOCASE)
        OR (length(?) >= 7 AND replace(replace(replace(replace(replace(phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE ?))
      ORDER BY created_at DESC LIMIT 10`).all(id, row.email || '', row.email || '', digits, `%${digits}`);
    const lead = {
      ...row,
      dealAmount: Number(row.dealAmount || 0),
      standArea: row.standArea === null ? null : Number(row.standArea),
      utm: parseJson(row.utmJson),
      payload: parseJson(row.payloadJson),
      notes,
      deliveries,
      history,
      stageHistory,
      journey,
      related,
    };
    delete lead.utmJson;
    delete lead.payloadJson;
    return lead;
  }

  leadFilters({ status = '', formType = '', search = '', from = '', to = '', assignee = '', event = '', overdue = false } = {}) {
    const where = [];
    const params = [];
    if (status === 'open') {
      where.push(`status IN (${OPEN_STATUSES.map(() => '?').join(', ')})`);
      params.push(...OPEN_STATUSES);
    } else if (status) { where.push('status = ?'); params.push(status); }
    if (formType) { where.push('form_type = ?'); params.push(formType); }
    if (from) { where.push('substr(created_at, 1, 10) >= ?'); params.push(from); }
    if (to) { where.push('substr(created_at, 1, 10) <= ?'); params.push(to); }
    if (assignee === '__none') where.push("assignee = ''");
    else if (assignee) { where.push('assignee = ? COLLATE NOCASE'); params.push(assignee); }
    if (event) { where.push('event = ?'); params.push(event); }
    if (overdue) {
      where.push(`next_action_at IS NOT NULL AND next_action_at < ? AND status IN (${OPEN_STATUSES.map(() => '?').join(', ')})`);
      params.push(nowIso(), ...OPEN_STATUSES);
    }
    if (search) {
      const term = likeTerm(search);
      where.push(`(name LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\'
        OR email LIKE ? ESCAPE '\\' OR event LIKE ? ESCAPE '\\' OR id LIKE ? ESCAPE '\\')`);
      params.push(term, term, term, term, term, term);
    }
    return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
  }

  listLeads({ page = 1, limit = 25, sort = 'created', ...filters } = {}) {
    const { clause, params } = this.leadFilters(filters);
    const total = Number(this.db.prepare(`SELECT COUNT(*) AS n FROM leads ${clause}`).get(...params).n);
    const offset = (page - 1) * limit;
    const order = {
      created: 'created_at DESC',
      updated: 'updated_at DESC',
      next: 'CASE WHEN next_action_at IS NULL THEN 1 ELSE 0 END, next_action_at ASC, created_at DESC',
      amount: 'deal_amount DESC, created_at DESC',
    }[sort] || 'created_at DESC';
    const items = this.db.prepare(`SELECT ${LEAD_LIST_COLUMNS} FROM leads ${clause} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .all(...params, limit, offset)
      .map((row) => ({ ...row, dealAmount: Number(row.dealAmount || 0) }));
    return { items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  updateLead(id, patch, actorEmail) {
    const current = this.db.prepare(`SELECT status, priority, assignee, deal_amount AS dealAmount, currency,
        stand_area AS standArea, lost_reason AS lostReason, next_action AS nextAction,
        next_action_at AS nextActionAt, event, first_contact_at AS firstContactAt, closed_at AS closedAt
      FROM leads WHERE id = ?`).get(id);
    if (!current) return null;
    const fields = ['status', 'priority', 'assignee', 'dealAmount', 'currency', 'standArea', 'lostReason', 'nextAction', 'nextActionAt', 'event'];
    const next = Object.fromEntries(fields.map((key) => [key, patch[key] !== undefined ? patch[key] : current[key]]));
    const now = nowIso();
    const statusChanged = next.status !== current.status;
    let firstContactAt = current.firstContactAt;
    let closedAt = current.closedAt;
    if (statusChanged) {
      if (!firstContactAt && next.status !== 'new') firstContactAt = now;
      closedAt = ['won', 'lost', 'spam'].includes(next.status) ? now : null;
      if (next.status !== 'lost' && patch.lostReason === undefined) next.lostReason = '';
    }
    transaction(this.db, () => {
      this.db.prepare(`UPDATE leads SET status = ?, priority = ?, assignee = ?, deal_amount = ?, currency = ?,
          stand_area = ?, lost_reason = ?, next_action = ?, next_action_at = ?, event = ?,
          first_contact_at = ?, closed_at = ?, stage_changed_at = CASE WHEN ? THEN ? ELSE stage_changed_at END,
          updated_at = ?
        WHERE id = ?`)
        .run(
          next.status, next.priority, next.assignee, Number(next.dealAmount || 0), next.currency || 'USD',
          next.standArea === null || next.standArea === undefined ? null : Number(next.standArea),
          next.lostReason || '', next.nextAction || '', next.nextActionAt || null, next.event || '',
          firstContactAt || null, closedAt || null, statusChanged ? 1 : 0, now, now, id,
        );
      if (statusChanged) {
        this.db.prepare(`INSERT INTO lead_stage_history (lead_id, from_status, to_status, actor_email, created_at)
          VALUES (?, ?, ?, ?, ?)`).run(id, current.status, next.status, actorEmail, now);
      }
      const same = (a, b) => String(a ?? '') === String(b ?? '');
      const changed = Object.fromEntries(fields.filter((key) => !same(next[key], current[key]))
        .map((key) => [key, { from: current[key] ?? '', to: next[key] ?? '' }]));
      if (Object.keys(changed).length) this.audit(actorEmail, 'lead.update', 'lead', id, changed);
    });
    return this.getLead(id);
  }

  addLeadNote(leadId, { userId, authorEmail, body, kind = 'note' }) {
    const lead = this.db.prepare('SELECT status, first_contact_at AS firstContactAt FROM leads WHERE id = ?').get(leadId);
    if (!lead) return null;
    const noteKind = NOTE_KINDS.includes(kind) ? kind : 'note';
    const note = { id: randomUUID(), leadId, kind: noteKind, authorEmail, body, createdAt: nowIso() };
    transaction(this.db, () => {
      this.db.prepare(`INSERT INTO lead_notes (id, lead_id, user_id, author_email, body, created_at, kind)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(note.id, leadId, userId ?? null, authorEmail, body, note.createdAt, noteKind);
      this.audit(authorEmail, 'lead.note.add', 'lead', leadId, { noteId: note.id, kind: noteKind });
      /* a logged call/meeting/message is the first contact: a new lead moves on by itself */
      if (CONTACT_NOTE_KINDS.has(noteKind)) {
        if (!lead.firstContactAt) this.db.prepare('UPDATE leads SET first_contact_at = ? WHERE id = ?').run(note.createdAt, leadId);
        if (lead.status === 'new') {
          this.db.prepare("UPDATE leads SET status = 'contacted', stage_changed_at = ?, updated_at = ? WHERE id = ?")
            .run(note.createdAt, note.createdAt, leadId);
          this.db.prepare(`INSERT INTO lead_stage_history (lead_id, from_status, to_status, actor_email, created_at)
            VALUES (?, 'new', 'contacted', ?, ?)`).run(leadId, authorEmail, note.createdAt);
          this.audit(authorEmail, 'lead.update', 'lead', leadId, { status: { from: 'new', to: 'contacted' }, auto: true });
        }
      }
    });
    return note;
  }

  listTeam() {
    return this.db.prepare("SELECT email, role FROM users WHERE active = 1 ORDER BY email COLLATE NOCASE").all();
  }

  /* kanban: every open lead plus the last N days of closed ones, grouped by stage */
  pipeline({ assignee = '', event = '', search = '', closedDays = 30 } = {}) {
    const cutoff = new Date(Date.now() - closedDays * 86_400_000).toISOString();
    const { clause, params } = this.leadFilters({ assignee, event, search });
    const scope = `status <> 'spam' AND (status IN (${OPEN_STATUSES.map(() => '?').join(', ')}) OR closed_at >= ?)`;
    const where = clause ? `${clause} AND ${scope}` : `WHERE ${scope}`;
    const rows = this.db.prepare(`SELECT ${LEAD_LIST_COLUMNS},
        (SELECT COUNT(*) FROM lead_notes n WHERE n.lead_id = leads.id) AS noteCount
      FROM leads ${where}
      ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
        COALESCE(next_action_at, '9999'), created_at DESC LIMIT 2000`)
      .all(...params, ...OPEN_STATUSES, cutoff)
      .map((row) => ({ ...row, dealAmount: Number(row.dealAmount || 0), noteCount: Number(row.noteCount) }));
    const columns = [...PIPELINE_STAGES, 'lost'].map((status) => {
      const items = rows.filter((row) => row.status === status);
      const amount = {};
      for (const item of items) if (item.dealAmount) amount[item.currency || 'USD'] = (amount[item.currency || 'USD'] || 0) + item.dealAmount;
      return { status, count: items.length, amount, items: items.slice(0, 200) };
    });
    return { closedDays, columns };
  }

  /* the manager's to-do list: follow-ups due, new leads nobody took, deals that went quiet */
  tasks() {
    const now = new Date();
    const nowAt = now.toISOString();
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const week = new Date(now.getTime() + 7 * 86_400_000).toISOString();
    const staleCutoff = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const open = `status IN (${OPEN_STATUSES.map(() => '?').join(', ')})`;
    const followUps = this.db.prepare(`SELECT ${LEAD_LIST_COLUMNS} FROM leads
      WHERE ${open} AND next_action_at IS NOT NULL AND next_action_at <= ? ORDER BY next_action_at ASC LIMIT 200`)
      .all(...OPEN_STATUSES, week);
    const unassigned = this.db.prepare(`SELECT ${LEAD_LIST_COLUMNS} FROM leads
      WHERE status = 'new' AND assignee = '' ORDER BY created_at ASC LIMIT 30`).all();
    const stale = this.db.prepare(`SELECT ${LEAD_LIST_COLUMNS} FROM leads
      WHERE ${open} AND next_action_at IS NULL AND COALESCE(stage_changed_at, created_at) < ?
      ORDER BY COALESCE(stage_changed_at, created_at) ASC LIMIT 30`).all(...OPEN_STATUSES, staleCutoff);
    const uncontactedHour = Number(this.db.prepare(`SELECT COUNT(*) AS n FROM leads WHERE status = 'new' AND created_at < ?`)
      .get(new Date(now.getTime() - 3_600_000).toISOString()).n);
    return {
      overdue: followUps.filter((row) => row.nextActionAt < nowAt),
      today: followUps.filter((row) => row.nextActionAt >= nowAt && row.nextActionAt <= endOfDay.toISOString()),
      upcoming: followUps.filter((row) => row.nextActionAt > endOfDay.toISOString()),
      unassigned,
      stale,
      uncontactedHour,
    };
  }

  /* where a lead came from, in words a manager can act on */
  static leadChannel(lead) {
    const utm = typeof lead.utm === 'object' && lead.utm ? lead.utm : parseJson(lead.utmJson || '{}');
    if (utm.utm_source) return utm.utm_source.toLowerCase();
    if (String(lead.source || '').startsWith('Portal')) return 'kabinet';
    try {
      const host = new URL(lead.referrer).hostname.replace(/^www\./, '');
      if (host && !host.includes('sof-expo') && !host.includes('sofexpo')) return host;
    } catch { /* no external referrer */ }
    return 'to‘g‘ridan-to‘g‘ri';
  }

  salesAnalytics(days = 30) {
    const { startDay, startAt } = dateRange(days);
    const leads = this.db.prepare(`SELECT id, status, source, referrer, utm_json AS utmJson, form_type AS formType,
        event, assignee, deal_amount AS dealAmount, currency, created_at AS createdAt, first_contact_at AS firstContactAt,
        closed_at AS closedAt, lost_reason AS lostReason, session_id AS sessionId
      FROM leads WHERE created_at >= ?`).all(startAt);
    const historyRows = this.db.prepare(`SELECT h.lead_id AS leadId, h.to_status AS toStatus, h.created_at AS createdAt
      FROM lead_stage_history h JOIN leads l ON l.id = h.lead_id WHERE l.created_at >= ? ORDER BY h.lead_id, h.id`).all(startAt);
    const historyByLead = new Map();
    for (const row of historyRows) {
      if (!historyByLead.has(row.leadId)) historyByLead.set(row.leadId, []);
      historyByLead.get(row.leadId).push(row);
    }
    const nowAt = nowIso();
    const stageTime = Object.fromEntries(OPEN_STATUSES.map((stage) => [stage, { total: 0, n: 0 }]));
    const funnelLeads = leads.filter((lead) => lead.status !== 'spam');
    for (const lead of funnelLeads) {
      const history = historyByLead.get(lead.id) || [{ toStatus: 'new', createdAt: lead.createdAt }];
      let reached = STAGE_INDEX[lead.status] ?? 0;
      history.forEach((entry, index) => {
        if (STAGE_INDEX[entry.toStatus] !== undefined) reached = Math.max(reached, STAGE_INDEX[entry.toStatus]);
        if (stageTime[entry.toStatus]) {
          const until = history[index + 1]?.createdAt || (OPEN_STATUSES.includes(lead.status) ? nowAt : lead.closedAt || nowAt);
          stageTime[entry.toStatus].total += Math.max(0, hoursBetween(entry.createdAt, until));
          stageTime[entry.toStatus].n += 1;
        }
      });
      lead.reached = reached;
      lead.channel = BackendStore.leadChannel(lead);
    }
    const money = (rows) => {
      const sum = {};
      for (const row of rows) if (Number(row.dealAmount)) sum[row.currency || 'USD'] = (sum[row.currency || 'USD'] || 0) + Number(row.dealAmount);
      return sum;
    };
    const won = funnelLeads.filter((lead) => lead.status === 'won');
    const lost = funnelLeads.filter((lead) => lead.status === 'lost');
    const open = funnelLeads.filter((lead) => OPEN_STATUSES.includes(lead.status));
    const sessions = Number(this.db.prepare(`SELECT COUNT(DISTINCT session_id) AS n FROM analytics_events
      WHERE received_at >= ? AND event_name = 'page_view' AND session_id <> ''`).get(startAt).n);
    const funnel = PIPELINE_STAGES.map((stage, index) => ({ stage, count: funnelLeads.filter((lead) => lead.reached >= index).length }));
    const breakdown = (keyOf, limit = 12) => {
      const groups = new Map();
      for (const lead of funnelLeads) {
        const key = keyOf(lead) || '—';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(lead);
      }
      return [...groups.entries()].map(([key, rows]) => {
        const wonRows = rows.filter((lead) => lead.status === 'won');
        const lostRows = rows.filter((lead) => lead.status === 'lost');
        return {
          key,
          leads: rows.length,
          qualified: rows.filter((lead) => lead.reached >= STAGE_INDEX.qualified).length,
          won: wonRows.length,
          lost: lostRows.length,
          open: rows.length - wonRows.length - lostRows.length,
          conversion: rows.length ? Number(((wonRows.length / rows.length) * 100).toFixed(1)) : 0,
          revenue: money(wonRows),
        };
      }).sort((a, b) => b.leads - a.leads).slice(0, limit);
    };
    const responseHours = funnelLeads.filter((lead) => lead.firstContactAt).map((lead) => Math.max(0, hoursBetween(lead.createdAt, lead.firstContactAt))).sort((a, b) => a - b);
    const median = (values) => values.length ? values[Math.floor((values.length - 1) / 2)] : null;
    const closeDays = won.filter((lead) => lead.closedAt).map((lead) => Math.max(0, hoursBetween(lead.createdAt, lead.closedAt) / 24));
    const lostReasons = new Map();
    for (const lead of lost) {
      const key = lead.lostReason || 'Sabab ko‘rsatilmagan';
      lostReasons.set(key, (lostReasons.get(key) || 0) + 1);
    }
    /* open deals by how long they have sat in their current stage (all open leads, not the cohort) */
    const agingRows = this.db.prepare(`SELECT COALESCE(stage_changed_at, created_at) AS since FROM leads
      WHERE status IN (${OPEN_STATUSES.map(() => '?').join(', ')})`).all(...OPEN_STATUSES);
    const buckets = [['0–2 kun', 2], ['3–7 kun', 7], ['8–14 kun', 14], ['15–30 kun', 30], ['30+ kun', Infinity]];
    const aging = buckets.map(([key]) => ({ key, count: 0 }));
    for (const row of agingRows) {
      const age = hoursBetween(row.since, nowAt) / 24;
      aging[buckets.findIndex(([, max]) => age <= max)].count += 1;
    }
    const dailyLeads = new Map();
    for (const lead of leads) dailyLeads.set(lead.createdAt.slice(0, 10), (dailyLeads.get(lead.createdAt.slice(0, 10)) || 0) + 1);
    const wonDaily = new Map(this.db.prepare(`SELECT substr(closed_at, 1, 10) AS day, COUNT(*) AS count FROM leads
      WHERE status = 'won' AND closed_at >= ? GROUP BY day`).all(startAt).map((row) => [row.day, Number(row.count)]));
    const daily = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(`${startDay}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + i);
      const day = dayKey(date);
      daily.push({ day, leads: dailyLeads.get(day) || 0, won: wonDaily.get(day) || 0 });
    }
    return {
      days,
      totals: {
        sessions,
        leads: funnelLeads.length,
        spam: leads.length - funnelLeads.length,
        open: open.length,
        won: won.length,
        lost: lost.length,
        winRate: won.length + lost.length ? Number(((won.length / (won.length + lost.length)) * 100).toFixed(1)) : 0,
        leadToWon: funnelLeads.length ? Number(((won.length / funnelLeads.length) * 100).toFixed(1)) : 0,
        visitToLead: sessions ? Number(((funnelLeads.length / sessions) * 100).toFixed(2)) : 0,
        trackedJourneys: funnelLeads.filter((lead) => lead.sessionId).length,
        revenue: money(won),
        pipeline: money(open),
        avgDaysToClose: closeDays.length ? Number((closeDays.reduce((a, b) => a + b, 0) / closeDays.length).toFixed(1)) : null,
        medianFirstResponseHours: responseHours.length ? Number(median(responseHours).toFixed(1)) : null,
        respondedWithinHour: responseHours.length ? Number(((responseHours.filter((h) => h <= 1).length / funnelLeads.length) * 100).toFixed(1)) : 0,
        uncontacted: funnelLeads.filter((lead) => lead.status === 'new').length,
      },
      funnel,
      stageDays: OPEN_STATUSES.map((stage) => ({ stage, days: stageTime[stage].n ? Number((stageTime[stage].total / stageTime[stage].n / 24).toFixed(1)) : null })),
      channels: breakdown((lead) => lead.channel),
      campaigns: breakdown((lead) => parseJson(lead.utmJson || '{}').utm_campaign || ''),
      forms: breakdown((lead) => lead.formType),
      events: breakdown((lead) => lead.event),
      managers: breakdown((lead) => lead.assignee || 'Belgilanmagan'),
      lostReasons: [...lostReasons.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
      aging,
      daily,
    };
  }

  /* ---------- exhibitor company page + materials ---------- */

  static showcaseRow(row) {
    if (!row) return null;
    return {
      accountId: row.accountId,
      slug: row.slug || '',
      status: row.status,
      draft: parseJson(row.draftJson),
      published: row.publishedJson ? parseJson(row.publishedJson) : null,
      reviewNote: row.reviewNote,
      reviewedBy: row.reviewedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      submittedAt: row.submittedAt,
      publishedAt: row.publishedAt,
    };
  }

  getShowcaseRow(accountId) {
    return BackendStore.showcaseRow(this.db.prepare(`SELECT account_id AS accountId, slug, status, draft_json AS draftJson,
        published_json AS publishedJson, review_note AS reviewNote, reviewed_by AS reviewedBy, created_at AS createdAt,
        updated_at AS updatedAt, submitted_at AS submittedAt, published_at AS publishedAt
      FROM exhibitor_showcases WHERE account_id = ?`).get(accountId));
  }

  /* what the cabinet shows: the editable draft, its files and where moderation stands */
  getShowcase(accountId) {
    const row = this.getShowcaseRow(accountId);
    const files = this.listPortalFiles(accountId);
    if (!row) {
      return { status: 'draft', slug: '', draft: null, live: false, hasChanges: false, reviewNote: '', submittedAt: null, publishedAt: null, files };
    }
    const { published, ...rest } = row;
    return {
      ...rest,
      live: Boolean(published) && row.status !== 'hidden',
      hasChanges: Boolean(published) && JSON.stringify(published.content || {}) !== JSON.stringify(row.draft),
      files,
    };
  }

  saveShowcaseDraft(accountId, draft, { submit = false } = {}) {
    const now = nowIso();
    const current = this.getShowcaseRow(accountId);
    /* the logo is set by uploading (and cleared by deleting) it, never by the form itself */
    const logos = this.listPortalFiles(accountId).filter((file) => file.kind === 'logo');
    const keep = logos.find((file) => file.id === current?.draft?.logoFileId) || logos.at(-1);
    const content = { ...draft, logoFileId: keep?.id || '' };
    /* saving without sending keeps a pending/rejected/published state as it is — only an
       explicit send asks the moderators again */
    const status = submit ? 'pending' : (current?.status || 'draft');
    transaction(this.db, () => {
      if (!current) {
        this.db.prepare(`INSERT INTO exhibitor_showcases (account_id, status, draft_json, created_at, updated_at, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?)`).run(accountId, status, JSON.stringify(content), now, now, submit ? now : null);
      } else {
        this.db.prepare(`UPDATE exhibitor_showcases SET status = ?, draft_json = ?, updated_at = ?,
            submitted_at = CASE WHEN ? THEN ? ELSE submitted_at END,
            review_note = CASE WHEN ? THEN '' ELSE review_note END
          WHERE account_id = ?`).run(status, JSON.stringify(content), now, submit ? 1 : 0, now, submit ? 1 : 0, accountId);
      }
      this.audit('portal-account', submit ? 'showcase.submit' : 'showcase.save', 'portal_account', accountId, { name: content.name });
    });
    return this.getShowcase(accountId);
  }

  listPortalFiles(accountId) {
    return this.db.prepare(`SELECT id, kind, title, original_name AS originalName, mime, size, published, created_at AS createdAt
      FROM portal_files WHERE account_id = ? ORDER BY created_at ASC, id ASC`).all(accountId)
      .map((row) => ({ ...row, size: Number(row.size), published: Boolean(row.published) }));
  }

  countPortalFiles(accountId) {
    return Number(this.db.prepare('SELECT COUNT(*) AS n FROM portal_files WHERE account_id = ?').get(accountId).n);
  }

  getPortalFile(id) {
    const row = this.db.prepare(`SELECT id, account_id AS accountId, kind, title, original_name AS originalName, mime, size,
        sha256, storage_name AS storageName, published, created_at AS createdAt FROM portal_files WHERE id = ?`).get(id);
    return row ? { ...row, size: Number(row.size), published: Boolean(row.published) } : null;
  }

  /**
   * Stores the metadata of a file the server already wrote to disk. A new logo replaces the
   * previous unpublished ones; the returned `removed` storage names are for the caller to unlink.
   */
  addPortalFile({ accountId, kind, title, originalName, mime, size, sha256, storageName }) {
    const id = randomUUID();
    const createdAt = nowIso();
    let removed = [];
    transaction(this.db, () => {
      if (kind === 'logo') {
        removed = this.db.prepare(`SELECT id, storage_name AS storageName FROM portal_files
          WHERE account_id = ? AND kind = 'logo' AND published = 0`).all(accountId);
        for (const file of removed) this.db.prepare('DELETE FROM portal_files WHERE id = ?').run(file.id);
      }
      this.db.prepare(`INSERT INTO portal_files (id, account_id, kind, title, original_name, mime, size, sha256, storage_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, accountId, kind, title, originalName, mime, size, sha256, storageName, createdAt);
      if (kind === 'logo') {
        const row = this.getShowcaseRow(accountId);
        const draft = { ...(row?.draft || {}), logoFileId: id };
        if (row) this.db.prepare('UPDATE exhibitor_showcases SET draft_json = ?, updated_at = ? WHERE account_id = ?').run(JSON.stringify(draft), createdAt, accountId);
        else this.db.prepare(`INSERT INTO exhibitor_showcases (account_id, status, draft_json, created_at, updated_at)
          VALUES (?, 'draft', ?, ?, ?)`).run(accountId, JSON.stringify(draft), createdAt, createdAt);
      }
      this.audit('portal-account', 'portal_file.upload', 'portal_account', accountId, { fileId: id, kind, size });
    });
    return { file: this.listPortalFiles(accountId).find((file) => file.id === id), removed: removed.map((file) => file.storageName) };
  }

  updatePortalFile(accountId, id, { title, kind }) {
    const current = this.getPortalFile(id);
    if (!current || current.accountId !== accountId) return null;
    const nextKind = kind && current.kind !== 'logo' && kind !== 'logo' ? kind : current.kind;
    const nextTitle = title || current.title;
    this.db.prepare('UPDATE portal_files SET title = ?, kind = ? WHERE id = ?').run(nextTitle, nextKind, id);
    /* a published material's new title shows on the site straight away — it is the same file */
    if (current.published) this.patchPublishedFile(accountId, id, (file) => ({ ...file, title: nextTitle, kind: nextKind }));
    return this.listPortalFiles(accountId).find((file) => file.id === id);
  }

  /* removing a file is immediate everywhere, the public page included */
  deletePortalFile(accountId, id) {
    const current = this.getPortalFile(id);
    if (!current || current.accountId !== accountId) return null;
    transaction(this.db, () => {
      this.db.prepare('DELETE FROM portal_files WHERE id = ?').run(id);
      const row = this.getShowcaseRow(accountId);
      if (row?.draft?.logoFileId === id) {
        this.db.prepare('UPDATE exhibitor_showcases SET draft_json = ? WHERE account_id = ?')
          .run(JSON.stringify({ ...row.draft, logoFileId: '' }), accountId);
      }
      if (current.published) this.patchPublishedFile(accountId, id, () => null);
      this.audit('portal-account', 'portal_file.delete', 'portal_account', accountId, { fileId: id, kind: current.kind });
    });
    return current;
  }

  patchPublishedFile(accountId, fileId, change) {
    const row = this.getShowcaseRow(accountId);
    if (!row?.published) return;
    const snapshot = row.published;
    if (snapshot.logo?.id === fileId) snapshot.logo = change(snapshot.logo);
    snapshot.materials = (snapshot.materials || []).map((file) => (file.id === fileId ? change(file) : file)).filter(Boolean);
    this.db.prepare('UPDATE exhibitor_showcases SET published_json = ? WHERE account_id = ?').run(JSON.stringify(snapshot), accountId);
  }

  listShowcases({ status = '', search = '', page = 1, limit = 25 } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('s.status = ?'); params.push(status); }
    if (search) {
      const term = likeTerm(search);
      where.push(`(s.draft_json LIKE ? ESCAPE '\\' OR a.email LIKE ? ESCAPE '\\' OR p.company LIKE ? ESCAPE '\\')`);
      params.push(term, term, term);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const from = `FROM exhibitor_showcases s JOIN portal_accounts a ON a.id = s.account_id JOIN portal_profiles p ON p.account_id = a.id`;
    const total = Number(this.db.prepare(`SELECT COUNT(*) AS n ${from} ${clause}`).get(...params).n);
    const items = this.db.prepare(`SELECT s.account_id AS accountId, s.slug, s.status, s.draft_json AS draftJson,
        s.published_json AS publishedJson, s.updated_at AS updatedAt, s.submitted_at AS submittedAt, s.published_at AS publishedAt,
        a.email, p.company, p.name AS contactName,
        (SELECT COUNT(*) FROM portal_files f WHERE f.account_id = s.account_id AND f.kind <> 'logo') AS materials
      ${from} ${clause}
      ORDER BY CASE s.status WHEN 'pending' THEN 0 ELSE 1 END, s.updated_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, (page - 1) * limit)
      .map((row) => {
        const draft = parseJson(row.draftJson);
        return {
          accountId: row.accountId,
          slug: row.slug || '',
          status: row.status,
          name: draft.name || row.company || row.email,
          logoFileId: draft.logoFileId || '',
          participation: draft.participation || [],
          live: Boolean(row.publishedJson) && row.status !== 'hidden',
          email: row.email,
          contactName: row.contactName,
          materials: Number(row.materials),
          updatedAt: row.updatedAt,
          submittedAt: row.submittedAt,
          publishedAt: row.publishedAt,
        };
      });
    const counts = Object.fromEntries(this.db.prepare('SELECT status, COUNT(*) AS n FROM exhibitor_showcases GROUP BY status').all()
      .map((row) => [row.status, Number(row.n)]));
    return { items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)), counts };
  }

  getShowcaseForAdmin(accountId) {
    const account = this.getPortalAccountById(accountId);
    if (!account) return null;
    const showcase = this.getShowcase(accountId);
    const row = this.getShowcaseRow(accountId);
    return { account, ...showcase, publishedContent: row?.published || null };
  }

  /**
   * publish: the draft becomes the public page (a frozen copy, so later edits wait for the
   * next review); reject: the exhibitor sees the note, the live copy (if any) stays;
   * hide: the company disappears from the site until published again.
   */
  reviewShowcase(accountId, { action, note = '' }, actorEmail) {
    const row = this.getShowcaseRow(accountId);
    if (!row) return { error: 'not_found' };
    const now = nowIso();
    let removed = [];
    if (action === 'publish') {
      if (!row.draft?.name) return { error: 'name_required' };
      const files = this.db.prepare(`SELECT id, kind, title, mime, size, storage_name AS storageName FROM portal_files
        WHERE account_id = ? ORDER BY created_at ASC, id ASC`).all(accountId);
      const logo = files.find((file) => file.id === row.draft.logoFileId) || null;
      const materials = files.filter((file) => file.kind !== 'logo');
      const taken = new Set(this.db.prepare('SELECT slug FROM exhibitor_showcases WHERE slug IS NOT NULL AND account_id <> ?')
        .all(accountId).map((item) => item.slug));
      const slug = row.slug || uniqueSlug(slugify(row.draft.name, { maxLen: 60, fallback: 'company' }), taken);
      const pick = (file) => ({ id: file.id, kind: file.kind, title: file.title, mime: file.mime, size: Number(file.size) });
      const snapshot = { content: row.draft, logo: logo ? pick(logo) : null, materials: materials.map(pick) };
      transaction(this.db, () => {
        this.db.prepare('UPDATE portal_files SET published = 0 WHERE account_id = ?').run(accountId);
        const live = [logo, ...materials].filter(Boolean).map((file) => file.id);
        for (const id of live) this.db.prepare('UPDATE portal_files SET published = 1 WHERE id = ?').run(id);
        /* logos that are neither the draft's nor live any more are dead weight */
        removed = files.filter((file) => file.kind === 'logo' && file.id !== logo?.id);
        for (const file of removed) this.db.prepare('DELETE FROM portal_files WHERE id = ?').run(file.id);
        this.db.prepare(`UPDATE exhibitor_showcases SET status = 'published', slug = ?, published_json = ?, review_note = ?,
            reviewed_by = ?, published_at = ?, updated_at = ? WHERE account_id = ?`)
          .run(slug, JSON.stringify(snapshot), note, actorEmail, now, now, accountId);
        this.audit(actorEmail, 'showcase.publish', 'portal_account', accountId, { slug, materials: materials.length });
      });
    } else if (action === 'reject') {
      this.db.prepare(`UPDATE exhibitor_showcases SET status = 'rejected', review_note = ?, reviewed_by = ?, updated_at = ?
        WHERE account_id = ?`).run(note, actorEmail, now, accountId);
      this.audit(actorEmail, 'showcase.reject', 'portal_account', accountId, { note });
    } else if (action === 'hide') {
      this.db.prepare(`UPDATE exhibitor_showcases SET status = 'hidden', review_note = ?, reviewed_by = ?, updated_at = ?
        WHERE account_id = ?`).run(note, actorEmail, now, accountId);
      this.audit(actorEmail, 'showcase.hide', 'portal_account', accountId, { note });
    } else {
      return { error: 'action' };
    }
    return { showcase: this.getShowcaseForAdmin(accountId), removed: removed.map((file) => file.storageName) };
  }

  /* the public directory: published, visible pages of active accounts */
  publicExhibitors({ event = '', when = '', q = '' } = {}) {
    const rows = this.db.prepare(`SELECT s.account_id AS accountId, s.slug, s.published_json AS publishedJson, s.published_at AS publishedAt
      FROM exhibitor_showcases s JOIN portal_accounts a ON a.id = s.account_id
      WHERE s.published_json <> '' AND s.status <> 'hidden' AND a.active = 1`).all();
    const term = String(q || '').trim().toLowerCase();
    const items = [];
    for (const row of rows) {
      const snapshot = parseJson(row.publishedJson);
      const content = snapshot.content || {};
      const participation = (content.participation || []).map((item) => ({
        ...item,
        label: editionLabel(item.event, item.year),
        upcoming: isUpcomingEdition(item.event, item.year),
      }));
      if (event && !participation.some((item) => item.event === event)) continue;
      const scoped = event ? participation.filter((item) => item.event === event) : participation;
      const current = scoped.some((item) => item.upcoming);
      if (when === 'current' && !current) continue;
      if (when === 'past' && !scoped.some((item) => !item.upcoming)) continue;
      if (term && ![content.name, content.tagline, content.about, content.category, content.country, content.city]
        .some((value) => String(value || '').toLowerCase().includes(term))) continue;
      const fileUrl = (file) => `/media/exhibitors/${file.id}`;
      items.push({
        slug: row.slug,
        name: content.name,
        tagline: content.tagline || '',
        about: content.about || '',
        category: content.category || '',
        country: content.country || '',
        city: content.city || '',
        website: content.website || '',
        phone: content.phone || '',
        email: content.email || '',
        socials: content.socials || {},
        logo: snapshot.logo ? fileUrl(snapshot.logo) : null,
        participation,
        current,
        materials: (snapshot.materials || []).map((file) => ({ id: file.id, kind: file.kind, title: file.title, mime: file.mime, size: file.size, url: fileUrl(file) })),
        publishedAt: row.publishedAt,
      });
    }
    items.sort((a, b) => Number(b.current) - Number(a.current) || a.name.localeCompare(b.name));
    return items;
  }

  /* a file is public only while it belongs to a live published page of an active account */
  publicFile(id) {
    const row = this.db.prepare(`SELECT f.id, f.mime, f.size, f.title, f.original_name AS originalName, f.storage_name AS storageName,
        f.sha256 FROM portal_files f
      JOIN exhibitor_showcases s ON s.account_id = f.account_id
      JOIN portal_accounts a ON a.id = f.account_id
      WHERE f.id = ? AND f.published = 1 AND s.published_json <> '' AND s.status <> 'hidden' AND a.active = 1`).get(id);
    return row || null;
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
      sales: this.salesSnapshot(startAt),
    };
  }

  /* the dashboard's money line: the whole open pipeline + what closed in the period */
  salesSnapshot(startAt) {
    const open = `status IN (${OPEN_STATUSES.map(() => '?').join(', ')})`;
    const sum = (rows) => Object.fromEntries(rows.filter((row) => Number(row.amount)).map((row) => [row.currency || 'USD', Number(row.amount)]));
    const stages = this.db.prepare(`SELECT status, COUNT(*) AS count FROM leads WHERE ${open} GROUP BY status`).all(...OPEN_STATUSES);
    const won = this.db.prepare(`SELECT COUNT(*) AS n FROM leads WHERE status = 'won' AND closed_at >= ?`).get(startAt);
    const lost = this.db.prepare(`SELECT COUNT(*) AS n FROM leads WHERE status = 'lost' AND closed_at >= ?`).get(startAt);
    return {
      open: stages.reduce((total, row) => total + Number(row.count), 0),
      stages: OPEN_STATUSES.map((status) => ({ status, count: Number(stages.find((row) => row.status === status)?.count || 0) })),
      pipelineValue: sum(this.db.prepare(`SELECT currency, SUM(deal_amount) AS amount FROM leads WHERE ${open} GROUP BY currency`).all(...OPEN_STATUSES)),
      won: Number(won.n),
      lost: Number(lost.n),
      revenue: sum(this.db.prepare(`SELECT currency, SUM(deal_amount) AS amount FROM leads
        WHERE status = 'won' AND closed_at >= ? GROUP BY currency`).all(startAt)),
      overdue: Number(this.db.prepare(`SELECT COUNT(*) AS n FROM leads WHERE ${open} AND next_action_at IS NOT NULL AND next_action_at < ?`)
        .get(...OPEN_STATUSES, nowIso()).n),
      uncontactedHour: Number(this.db.prepare(`SELECT COUNT(*) AS n FROM leads WHERE status = 'new' AND created_at < ?`)
        .get(new Date(Date.now() - 3_600_000).toISOString()).n),
      pendingShowcases: Number(this.db.prepare("SELECT COUNT(*) AS n FROM exhibitor_showcases WHERE status = 'pending'").get().n),
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
