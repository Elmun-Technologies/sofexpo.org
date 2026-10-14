# CLAUDE.md — SOF EXPO Samarkand (sof-expo.com)

## Overview

Marketing site for the SOF EXPO Samarkand international exhibition centre plus a small
first-party backend (lead CRM, analytics, visitor/exhibitor portals, Telegram notifications,
Telegram → blog sync). One repo builds **6 hostnames** (`sof-expo.com` + 5 exhibition
subdomains) from shared sources — see `docs/05-subdomains.md` and `docs/06-deploy.md`.

## Stack

- **Site:** Astro 7, `output: 'static'` (pure SSG), TypeScript, no client JS framework.
  Content lives in `src/content/{news,articles}/{ru,en}/*.md` (Astro content collections,
  schema in `src/content.config.ts`). Source locales: **ru, en** (`src/i18n/config.ts`;
  UI has zh/tr too, but editorial content is ru/en).
- **Backend:** Node 22 **stdlib only** HTTP server — `scripts/backend/server.mjs`
  (`createLeadServer`), SQLite via built-in `node:sqlite` (`scripts/backend/db.mjs`,
  `BackendStore`). No framework, no npm runtime deps on purpose — keep it that way.
  Static admin panel `scripts/backend/admin/` (vanilla JS, session cookie + CSRF header).
- **Deploy:** static output. Primary host today: **Vercel** — one project for the root domain
  (**`sof-expo.com`** — the .org was unavailable), zero-config via `vercel.json`,
  `PUBLIC_HOSTS_MODE=alias` (everything on the root host; exhibition subdomains come later).
  The Cloudflare Pages multi-host flow (one Pages project per hostname,
  `PUBLIC_HOSTS_MODE=subdomain`, `.github/workflows/deploy.yml`) stays maintained for when
  subdomains are connected — host topology lives in `src/data/host-map.json`.
  Backend runs as a long-lived process with a persistent disk (`.data/sofexpo.sqlite`) —
  see `docs/17-backend-admin.md`; it is NOT deployed by CI.
- **Tests:** `node:test` (`npm test` → `tests/*.test.mjs`), Playwright for e2e
  (`npm run test:e2e`). There is **no** Jest/Vitest — use `node:test` + `node:assert`.

## Structure

- `src/pages/[locale]/…` — routes; `[locale]` ∈ ru/en (+ zh/tr UI shell). Posts render via
  `src/components/PostDetail.astro` (used by both `/news/` and `/articles/`).
- `src/components/`, `src/layouts/Base.astro` — SEO (canonical, OG/Twitter, JSON-LD) lives
  in Base + `src/lib/seo.ts`; posts get `articleJsonLd` automatically.
- `src/lib/content.ts`, `src/lib/contentOwnership.ts` — post queries + the per-host
  editorial rule (`event:` frontmatter → post is published on that show's subdomain;
  untagged posts belong to the centre). Ownership map is **generated at build time** by
  `scripts/gen-editorial-map.mjs` (runs before every build) — new markdown files need no
  manual registration.
- `scripts/backend/` — the Node backend: `server.mjs` (routing in one `handleRequest`),
  `db.mjs` (schema + store methods), `auth.mjs`, `admin/`, `portal/`, `shared/`,
  `tgblog/` (Telegram → blog sync, see below).
- `scripts/` — build/audit tooling (`.mjs`, run via `node`); site scripts read the same
  conventions as the app.
- `tests/*.test.mjs` — `node:test` suites; backend tests boot `createLeadServer` with a
  temp SQLite dir and port 0, then drive it over `fetch`.

## Conventions

- **Languages:** repo docs/commits are mixed uz/ru/en; user-facing site content is ru/en;
  admin panel UI is Uzbek (Latin). Match the surrounding language of the file you edit.
- **Backend:** everything additive goes through `createLeadServer(options)` — every env
  var has an `options.*` override so tests never touch real env/secrets. Protected
  mutations need `requireSession` + `verifyCsrf`; destructive ones also `requireAdmin`;
  admin actions are audit-logged via `store.audit(...)`. Always fast-ACK public POST
  endpoints and process asynchronously (outbox pattern).
- **Security:** never hardcode/log secrets; CORS is an exact-origin allow-list; HTML is
  escaped at render; only allow-listed files are served; HTTPS-only outbound.
- **Static-site "writes":** the site is rebuilt on push, so any dynamic content feature
  materializes markdown/assets into the repo and pushes (debounced) rather than serving
  runtime HTML.
- **Files:** ES modules, `.mjs` for scripts/backend, `.ts/.astro` for the site; Prettier
  is available but not enforced — match local style.
- Do not hand-edit `dist/`. Do not move `/news/` `/articles/` indexes to subdomains
  (docs/06 §5). New runtime dependencies need an explicit reason (backend is stdlib-only).

## Telegram → blog sync (`scripts/backend/tgblog/`)

> Full setup guide (bot, channel admin, env, webhook, backfill, troubleshooting, and the
> pitfalls list): `docs/telegram-blog-sync.md`. Backend architecture: `docs/17-backend-admin.md`.

**Pipeline:** Telegram channel post → `POST /api/telegram/webhook` (validates
`X-Telegram-Bot-Api-Secret-Token` against `TELEGRAM_WEBHOOK_SECRET`, else 401) → instant
200 → async `TgBlogSync.ingestUpdate()` → entities→HTML (UTF-16 aware) → media download
via Bot API → SQLite upsert → markdown written to `src/content/<collection>/<locale>/`
+ media to `public/images/telegram/` → debounced `git commit && pull --rebase && push`
→ Cloudflare Pages rebuilds. There is no `revalidatePath` in a static build — **the git
push is the revalidation**.

Decisions & pitfalls (do not re-litigate):

- **Canonical state = SQLite** (`tg_blog_posts`, `tg_blog_messages`, `tg_blog_media`,
  created by `TgBlogStore`). Idempotency is the `(chat_id, message_id)` primary key;
  albums merge per incoming message by `media_group_id` — **no timers/waits**, so the
  handler stays stateless and serverless-safe. Photos order by `message_id`.
- **Slug is immutable** after first creation (SEO). Edits rebuild title/body/media but
  never rename the file.
- **Files, not URLs:** Bot API file URLs embed the bot token — never persist them. Only
  repo-relative paths (`/images/telegram/<slug>/<file_unique_id>.jpg`) go to disk/DB.
  Reuses `TELEGRAM_BOT_TOKEN` — the file download limit is **20 MB** (`getFile` itself
  refuses larger), so videos/files above `BLOG_SYNC_MAX_FILE_MB` are replaced with a link
  to the Telegram post.
- **Bot API never reports deletions** — manage posts in `/admin` → "Blog" (publish /
  unpublish / delete, CSRF-protected, audit-logged).
- **Webhook returns 200 even on processing errors** (Telegram retries otherwise; secret
  or payload validation failures are the only non-200 cases).
- `BLOG_SYNC_GIT_PUSH=0` (default) materializes files without pushing — enable explicitly
  on the server that owns the checkout + credentials; `BLOG_SYNC_DEPLOY_HOOK_URLS` fires
  Cloudflare deploy hooks after pushes.
- Backfill (`scripts/telegram-backfill.mjs`) reuses the same pipeline from the public
  `t.me/s/<user>` mirror — **run it where the production SQLite lives** so edit-webhooks
  can later dedupe by message id; `--dry-run` first.

## Useful commands

- `npm run dev` / `npm run build` / `npm run preview` — site
- `npm run check` — build + all audits + unit tests (release gate is `check:release`)
- `npm test` / `npm run test:backend` — unit tests
- `npm run lead-webhook` — run the backend locally (uses `.env`)
- `npm run telegram:set-webhook` — register the webhook with Telegram (needs env)
- `npm run telegram:backfill -- --dry-run` — import channel history
- `npm run typecheck` — `astro sync && tsc --noEmit`
