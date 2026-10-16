/**
 * Debounced repo publisher: after one or more syncs, commits content/media changes and
 * pushes once, then pings optional hosting deploy hooks. On a static site the push triggers
 * the hosting rebuild (= revalidation).
 *
 * Serialized via a promise queue; failures are logged, never thrown into the webhook
 * path (the files stay on disk and the next sync tries again).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const defaultRunner = promisify(execFile);
const GIT_TIMEOUT = 90_000;
/* every publisher of one checkout (blog sync, site tags) shares one queue: two git runs at
   once would collide on .git/index.lock */
const repoQueues = new Map();

/* The server checkout (Fly image) has no ~/.gitconfig, so `git commit` would stop at
   "Author identity unknown" and nothing would ever be pushed. Server commits are signed as
   the bot unless GIT_AUTHOR_* / GIT_COMMITTER_* (or BLOG_SYNC_GIT_NAME/EMAIL) say otherwise. */
export function gitEnv(env = process.env) {
  const name = env.BLOG_SYNC_GIT_NAME || 'SOF EXPO bot';
  const email = env.BLOG_SYNC_GIT_EMAIL || 'bot@sof-expo.com';
  return {
    ...env,
    GIT_AUTHOR_NAME: env.GIT_AUTHOR_NAME || name,
    GIT_AUTHOR_EMAIL: env.GIT_AUTHOR_EMAIL || email,
    GIT_COMMITTER_NAME: env.GIT_COMMITTER_NAME || name,
    GIT_COMMITTER_EMAIL: env.GIT_COMMITTER_EMAIL || email,
  };
}

export class GitPublisher {
  constructor({
    repoDir, remote = 'origin', branch = 'main', debounceMs = 20_000, pushEnabled = false, deployHooks = [], gitRunner, fetchImpl, logger = console,
    paths = ['src/content', 'public/images/telegram'],
    commitMessage = (title) => `chore(content): telegram sync — ${title} [tg-sync]`,
    logTag = 'tg-blog',
  } = {}) {
    this.repoDir = repoDir;
    this.remote = remote;
    this.branch = branch;
    this.debounceMs = debounceMs;
    this.pushEnabled = pushEnabled;
    this.deployHooks = deployHooks;
    this.run = gitRunner ?? ((cmd, args) => defaultRunner(cmd, args, { timeout: GIT_TIMEOUT, maxBuffer: 4 * 1024 * 1024, env: gitEnv() }));
    this.fetch = fetchImpl ?? ((...fetchArgs) => fetch(...fetchArgs));
    this.logger = logger;
    this.paths = paths;
    this.commitMessage = commitMessage;
    this.logTag = logTag;
    this.timer = null;
    this.queue = Promise.resolve();
    this.reasons = new Set();
  }

  /** Coalesce syncs that arrive together (album bursts) into a single commit/push. */
  schedule(reason = 'sync') {
    this.reasons.add(String(reason).slice(0, 120));
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.debounceMs);
    this.timer.unref?.();
  }

  async flush() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    const previous = repoQueues.get(this.repoDir) ?? Promise.resolve();
    const job = previous.then(() => this.publish()).catch((error) => {
      this.logger.error?.(`[${this.logTag}] repo publish failed: ${error?.message || error}`);
    });
    this.queue = job;
    repoQueues.set(this.repoDir, job);
    return job;
  }

  async stop() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    await this.queue;
  }

  async publish() {
    const reasons = [...this.reasons];
    this.reasons.clear();
    const add = await this.run('git', ['-C', this.repoDir, 'add', '--', ...this.paths]);
    void add;
    /* staged changes only: another publisher's untouched files must not make this one commit */
    const status = await this.run('git', ['-C', this.repoDir, 'diff', '--cached', '--name-only']);
    if (!String(status.stdout ?? '').trim()) {
      this.logger.info?.(`[${this.logTag}] publish: no content changes to commit`);
      return { committed: false };
    }
    const title = reasons.length === 1 ? reasons[0] : `${reasons.length} updates`;
    await this.run('git', ['-C', this.repoDir, 'commit', '-m', this.commitMessage(title)]);
    if (this.pushEnabled) {
      await this.run('git', ['-C', this.repoDir, 'pull', '--rebase', this.remote, this.branch]);
      await this.run('git', ['-C', this.repoDir, 'push', this.remote, `HEAD:${this.branch}`]);
      this.logger.info?.(`[${this.logTag}] pushed to %s/%s — hosting rebuild triggered on push`, this.remote, this.branch);
    } else {
      this.logger.info?.(`[${this.logTag}] committed locally (BLOG_SYNC_GIT_PUSH off) — %s`, title);
    }
    await this.fireHooks();
    return { committed: true, pushed: this.pushEnabled };
  }

  async fireHooks() {
    for (const hook of this.deployHooks) {
      try {
        const response = await this.fetch(hook, { method: 'POST', signal: AbortSignal.timeout(15_000) });
        this.logger.info?.(`[${this.logTag}] deploy hook → HTTP %s`, response.status);
      } catch (error) {
        this.logger.error?.(`[${this.logTag}] deploy hook failed: ${error?.message || error}`);
      }
    }
  }
}
