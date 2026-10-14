/**
 * Telegram → blog sync configuration. Every value has a createLeadServer options
 * override (tests never touch process env), env is only the production default.
 */

const clampInt = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
};

const bool = (value) => ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase());

const list = (value) => String(value ?? '').split(',').map((v) => v.trim()).filter(Boolean);

const oneOf = (allowed, value, fallback) => {
  const text = String(value ?? '');
  return allowed.includes(text) ? text : fallback;
};

/**
 * @param {object} overrides — `tgBlog` option bag of createLeadServer (tests/embedding)
 * @param {object} env — process.env by default
 */
export function loadTgBlogConfig(overrides = {}, env = process.env) {
  const get = (key, envName, fallback = '') => overrides[key] ?? env[envName] ?? fallback;
  const config = {
    enabled: bool(get('enabled', 'BLOG_SYNC_ENABLED', '1')),
    token: get('token', 'TELEGRAM_BOT_TOKEN', ''),
    secret: get('secret', 'TELEGRAM_WEBHOOK_SECRET', ''),
    channelId: String(get('channelId', 'TELEGRAM_CHANNEL_ID', '')).trim(),
    channelUsername: String(get('channelUsername', 'TELEGRAM_CHANNEL_USERNAME', '')).trim().replace(/^@/, ''),
    webhookPath: get('webhookPath', 'TELEGRAM_WEBHOOK_PATH', '/api/telegram/webhook'),
    mode: oneOf(['auto', 'draft'], get('mode', 'BLOG_SYNC_MODE', 'auto'), 'auto'),
    hashtag: String(get('hashtag', 'BLOG_SYNC_HASHTAG', '')).trim().replace(/^#/, ''),
    collection: oneOf(['news', 'articles'], get('collection', 'BLOG_SYNC_COLLECTION', 'news'), 'news'),
    locale: oneOf(['ru', 'en'], get('locale', 'BLOG_SYNC_LOCALE', 'ru'), 'ru'),
    repoDir: get('repoDir', 'BLOG_SYNC_REPO_DIR', process.cwd()),
    maxFileMb: clampInt(get('maxFileMb', 'BLOG_SYNC_MAX_FILE_MB', 20), 1, 20, 20), // Bot API getFile ceiling is 20 MB
    gitPush: bool(get('gitPush', 'BLOG_SYNC_GIT_PUSH', '')),
    gitRemote: get('gitRemote', 'BLOG_SYNC_GIT_REMOTE', 'origin'),
    gitBranch: get('gitBranch', 'BLOG_SYNC_GIT_BRANCH', 'main'),
    pushDebounceMs: clampInt(get('pushDebounceMs', 'BLOG_SYNC_PUSH_DEBOUNCE_MS', 20_000), 0, 600_000, 20_000),
    deployHooks: overrides.deployHooks ?? list(env.BLOG_SYNC_DEPLOY_HOOK_URLS),
    // dependency-injection seams (tests): apiFetch(url,opts)->Response-like, gitRunner(cmd,args,cwd)
    apiFetch: overrides.apiFetch ?? null,
    gitRunner: overrides.gitRunner ?? null,
    logger: overrides.logger ?? console,
  };
  // Webhook can only work when all three are present; otherwise the route stays off.
  config.ready = config.enabled && Boolean(config.token && config.secret && config.channelId);
  return config;
}
