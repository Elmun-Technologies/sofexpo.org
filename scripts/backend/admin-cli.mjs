#!/usr/bin/env node
import { BackendStore } from './db.mjs';
import { hashPassword, normalizeEmail, validPassword } from './auth.mjs';

const [command, ...args] = process.argv.slice(2);
const dbPath = process.env.LEAD_WEBHOOK_DB || '.data/sofexpo.sqlite';
const store = new BackendStore({
  dbPath,
  legacyLeadsPath: process.env.LEAD_WEBHOOK_STORE || '.cache/leads.jsonl',
  legacyEventsPath: process.env.LEAD_WEBHOOK_EVENTS || '.cache/events.jsonl',
});

try {
  if (command !== 'reset-password') {
    throw new Error('Foydalanish: npm run admin:reset-password -- <email> (ADMIN_RESET_PASSWORD env bilan)');
  }
  const email = normalizeEmail(args[0] || process.env.ADMIN_RESET_EMAIL);
  const password = process.env.ADMIN_RESET_PASSWORD || '';
  if (!email) throw new Error('Admin email ko‘rsatilmagan. Buyruqqa email bering yoki ADMIN_RESET_EMAIL sozlang.');
  if (!validPassword(password)) throw new Error('ADMIN_RESET_PASSWORD kamida 12 ta belgidan iborat bo‘lishi kerak.');
  const user = store.findUserByEmail(email);
  if (!user) throw new Error(`Foydalanuvchi topilmadi: ${email}`);
  const { salt, hash } = hashPassword(password);
  store.db.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').run(salt, hash, user.id);
  store.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  store.recordAudit('cli', 'user.password.reset', 'user', user.id, { email });
  console.log(`Parol yangilandi; ${email} hisobining eski sessiyalari bekor qilindi.`);
} catch (error) {
  console.error(`[admin-cli] ${error.message}`);
  process.exitCode = 1;
} finally {
  store.close();
}
