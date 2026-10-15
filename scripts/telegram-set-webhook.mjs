#!/usr/bin/env node
/**
 * Telegram → blog sync: webhook registration utility (docs/telegram-blog-sync.md).
 *
 *   node --env-file-if-exists=.env scripts/telegram-set-webhook.mjs check   # bot + channel + webhook status
 *   node --env-file-if-exists=.env scripts/telegram-set-webhook.mjs set --url https://api.sof-expo.com/api/telegram/webhook
 *   node --env-file-if-exists=.env scripts/telegram-set-webhook.mjs unset   # deleteWebhook
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET (set), TELEGRAM_CHANNEL_USERNAME (check),
 * TELEGRAM_WEBHOOK_URL (set, unless --url). Secrets are never printed back.
 */
import { TelegramApiError } from './backend/tgblog/telegram.mjs';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const USERNAME = (process.env.TELEGRAM_CHANNEL_USERNAME || '').replace(/^@/, '');

const args = process.argv.slice(2);
const command = args.find((a) => ['set', 'unset', 'check'].includes(a)) || 'check';
const flagValue = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const api = async (method, params = {}) => {
  const url = new URL(`https://api.telegram.org/bot${TOKEN}/${method}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => null);
  if (!payload?.ok) throw new TelegramApiError(`${method}: ${payload?.description || `HTTP ${response.status}`}`, { method });
  return payload.result;
};

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN bo‘sh — .env faylni to‘ldiring (BotFather bergan token).');
  process.exit(2);
}

try {
  if (command === 'check') {
    const me = await api('getMe');
    console.log(`bot: @${me.username} (id ${me.id})`);
    if (USERNAME) {
      try {
        const chat = await api('getChat', { chat_id: `@${USERNAME}` });
        console.log(`kanal: ${chat.title} | TELEGRAM_CHANNEL_ID=${chat.id}  ← .env ga shuni yozing`);
      } catch (error) {
        console.warn(`kanal ma’lumoti olinmadi (@${USERNAME}): ${error.message}`);
        console.warn('Bot kanalga ADMIN qilib qo‘shilganini tekshiring, so‘ng qayta urinib ko‘ring.');
      }
    } else {
      console.log('TELEGRAM_CHANNEL_USERNAME bo‘sh — kanal ID sini olish uchun uni .env ga yozing.');
    }
    const info = await api('getWebhookInfo');
    console.log(`webhook url: ${info.url || '(o‘rnatilmagan)'}`);
    console.log(`pending: ${info.pending_update_count}, allowed: ${(info.allowed_updates || []).join(', ') || '—'}`);
    if (info.last_error_message) console.warn(`oxirgi xato: ${info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : ''} ${info.last_error_message}`);
    process.exit(0);
  }

  if (command === 'unset') {
    await api('deleteWebhook', { drop_pending_updates: false });
    console.log('webhook o‘chirildi (deleteWebhook).');
    process.exit(0);
  }

  // set
  const webhookUrl = flagValue('url') || process.env.TELEGRAM_WEBHOOK_URL || '';
  if (!webhookUrl || !/^https:\/\//.test(webhookUrl)) {
    console.error(' webhook URL kerak: --url https://api.sof-expo.com/api/telegram/webhook (https bo‘lishi shart)');
    process.exit(2);
  }
  if (SECRET.length < 16) {
    console.error('TELEGRAM_WEBHOOK_SECRET juda qisqa — kamida 16 (tavsiya: 32+) belgi. Generatsiya: openssl rand -hex 32');
    process.exit(2);
  }
  await api('setWebhook', {
    url: webhookUrl,
    secret_token: SECRET,
    allowed_updates: ['channel_post', 'edited_channel_post'],
    drop_pending_updates: false,
  });
  const info = await api('getWebhookInfo');
  console.log(`setWebhook OK → ${info.url}`);
  console.log(`tekshiruv: allowed_updates=${(info.allowed_updates || []).join(',')}, pending=${info.pending_update_count}`);
  console.log('Endi kanalga bitta test post yuboring — u /admin → Blog · Telegram ro‘yxatida ko‘rinishi kerak.');
} catch (error) {
  console.error(`Xato: ${error?.message || error}`);
  process.exit(1);
}
