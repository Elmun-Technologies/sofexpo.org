/**
 * Debounced repo publisher: after one or more syncs, commits content/media changes and
 * pushes once, then pings Cloudflare deploy hooks. On a static site the push IS the
 * revalidation — Cloudflare Pages rebuilds on push.
 *
 * Serialized via a promise queue; failures are logged, never thrown into the webhook
 * path (the files stay on disk and the next sync tries again).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const defaultRunner = promisify(execFile);
const GIT_TIMEOUT = 90_000;

export class GitPublisher {
  constructor({ repoDir, remote = 'origin', branch = 'main', debounceMs = 20_000, pushEnabled = false, deployHooks = [], gitRunner, fetchImpl, logger = console } = {}) {
    this.repoDir = repoDir;
    this.remote = remote;
    this.branch = branch;
    this.debounceMs = debounceMs;
    this.pushEnabled = pushEnabled;
    this.deployHooks = deployHooks;
    this.run = gitRunner ?? ((cmd, args) => defaultRunner(cmd, args, { timeout: GIT_TIMEOUT, maxBuffer: 4 * 1024 * 1024 }));
    this.fetch = fetchImpl ?? ((...fetchArgs) => fetch(...fetchArgs));
    this.logger = logger;
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
    const job = this.queue.then(() => this.publish()).catch((error) => {
      this.logger.error?.(`[tg-blog] repo publish failed: ${error?.message || error}`);
    });
    this.queue = job;
    return job;
  }

  async stop() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    await this.queue;
  }

  async publish() {
    const reasons = [...this.reasons];
    this.reasons.clear();
    const add = await this.run('git', ['-C', this.repoDir, 'add', '--', 'src/content', 'public/images/telegram']);
    void add;
    const status = await this.run('git', ['-C', this.repoDir, 'status', '--porcelain']);
    if (!String(status.stdout ?? '').trim()) {
      this.logger.info?.('[tg-blog] publish: no content changes to commit');
      return { committed: false };
    }
    const title = reasons.length === 1 ? reasons[0] : `${reasons.length} updates`;
    await this.run('git', ['-C', this.repoDir, 'commit', '-m', `chore(content): telegram sync — ${title} [tg-sync]`]);
    if (this.pushEnabled) {
      await this.run('git', ['-C', this.repoDir, 'pull', '--rebase', this.remote, this.branch]);
      await this.run('git', ['-C', this.repoDir, 'push', this.remote, `HEAD:${this.branch}`]);
      this.logger.info?.('[tg-blog] pushed to %s/%s — Cloudflare Pages rebuild triggered', this.remote, this.branch);
    } else {
      this.logger.info?.('[tg-blog] committed locally (BLOG_SYNC_GIT_PUSH off) — %s', title);
    }
    await this.fireHooks();
    return { committed: true, pushed: this.pushEnabled };
  }

  async fireHooks() {
    for (const hook of this.deployHooks) {
      try {
        const response = await this.fetch(hook, { method: 'POST', signal: AbortSignal.timeout(15_000) });
        this.logger.info?.(`[tg-blog] deploy hook → HTTP %s`, response.status);
      } catch (error) {
        this.logger.error?.(`[tg-blog] deploy hook failed: ${error?.message || error}`);
      }
    }
  }
}
