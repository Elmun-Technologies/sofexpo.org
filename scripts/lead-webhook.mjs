#!/usr/bin/env node
/**
 * SOF EXPO first-party backend: lead API, SQLite CRM, analytics, admin and visitor/exhibitor
 * portals, and a retryable Telegram/CRM delivery outbox. See docs/17-backend-admin.md.
 */
import { pathToFileURL } from 'node:url';
import { createLeadServer, formatLead, normalizeLead, summarize } from './backend/server.mjs';

export { createLeadServer, formatLead, normalizeLead, summarize };

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const server = createLeadServer();
  const port = Number(process.env.LEAD_WEBHOOK_PORT || 8787);
  const host = process.env.LEAD_WEBHOOK_HOST || '0.0.0.0';
  server.listen(port, host, () => {
    const address = server.address();
    const store = server.backendStore;
    console.log(`[lead-backend] listening on ${typeof address === 'object' ? address.port : port} (${host})`);
    console.log(`[lead-backend] admin: /admin | visitor/exhibitor portal: /cabinet | database: ${process.env.LEAD_WEBHOOK_DB || '.data/sofexpo.sqlite'}`);
    console.log(`[lead-backend] integrations: Telegram ${process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? 'on' : 'off'}, CRM ${process.env.CRM_WEBHOOK_URL ? 'on' : 'off'} | active admin: ${store.hasActiveAdmin() ? 'yes' : 'no'}`);
    const tg = server.tgBlog;
    if (tg) {
      const cfg = server.tgBlogConfig;
      console.log(`[lead-backend] telegram→blog sync: ON ${cfg.webhookPath} (channel ${cfg.channelUsername ? `@${cfg.channelUsername}` : cfg.channelId}, mode ${cfg.mode}, ${cfg.collection}/${cfg.locale}, git push ${cfg.gitPush ? 'on' : 'off'})`);
    } else {
      console.log('[lead-backend] telegram→blog sync: OFF (set TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET + TELEGRAM_CHANNEL_ID to enable)');
    }
    if (!store.hasActiveAdmin()) console.warn('[lead-backend] set ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars) in .env, then restart to create the first admin account.');
  });
  const shutdown = () => {
    console.info('[lead-backend] shutting down');
    server.close(() => {
      try { server.backendStore.close(); } catch {}
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
