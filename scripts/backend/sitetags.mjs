/**
 * Admin-managed site tags (docs/22): search-engine verification codes, analytics and ad pixel
 * ids. Canonical state is the `site_settings` row in SQLite; the static site reads the same
 * values from src/data/site-tags.json, which is materialized into the checkout and pushed by
 * the shared GitPublisher — the push rebuilds the site (there is no runtime HTML to patch).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SITE_TAG_FIELDS, SITE_TAGS_FILE, normalizeSiteTags, serializeSiteTags } from '../site-tags.mjs';

const SETTING_KEY = 'site_tags';

/** the form spec the admin UI renders (regexes stay on the server) */
export const siteTagFormFields = SITE_TAG_FIELDS.map(({ key, group, kind, label, example, meta }) => ({
  key, group, kind, label, ...(example ? { example } : {}), ...(meta ? { meta } : {}),
}));

export class SiteTagsService {
  constructor({ store, repoDir, publisher = null, logger = console }) {
    this.store = store;
    this.file = join(repoDir, SITE_TAGS_FILE);
    this.publisher = publisher;
    this.logger = logger;
  }

  get() {
    const row = this.store.getSiteSetting(SETTING_KEY);
    if (row?.value && typeof row.value === 'object') {
      return { tags: row.value, updatedAt: row.updatedAt ?? null, updatedBy: row.updatedBy ?? null };
    }
    /* nothing saved in the panel yet: show what the repo file already carries (a code added
       before the panel existed), so the first save keeps it instead of wiping it */
    return { tags: this.readFile(), updatedAt: null, updatedBy: null };
  }

  readFile() {
    try {
      const parsed = JSON.parse(readFileSync(this.file, 'utf8'));
      return parsed && typeof parsed === 'object' ? normalizeSiteTags(parsed).value : {};
    } catch {
      return {};
    }
  }

  /** @returns {{ ok: true, tags, changed: string[], fileChanged: boolean } | { ok: false, errors }} */
  save(input, actorEmail) {
    const { value, errors } = normalizeSiteTags(input);
    if (Object.keys(errors).length) return { ok: false, errors };
    const before = this.get().tags;
    const changed = SITE_TAG_FIELDS.map((f) => f.key).filter((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(value[key] ?? null));
    this.store.setSiteSetting(SETTING_KEY, value, actorEmail);
    const fileChanged = this.materialize(value);
    if (fileChanged) this.publisher?.schedule(changed.length ? `site tags: ${changed.join(', ')}` : 'site tags');
    return { ok: true, tags: value, changed, fileChanged };
  }

  /** write the JSON the site build reads; byte-identical content is left alone */
  materialize(value) {
    const body = serializeSiteTags(value);
    let current = null;
    try { current = readFileSync(this.file, 'utf8'); } catch { current = null; }
    if (current === body) return false;
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, body);
    return true;
  }

  /**
   * On boot: a save whose push failed (network, token) is re-materialized and re-scheduled,
   * so the site converges on what the admin saved. Nothing saved yet → the repo file rules.
   */
  heal() {
    const row = this.store.getSiteSetting(SETTING_KEY);
    if (!row?.value) return false;
    try {
      const changed = this.materialize(normalizeSiteTags(row.value).value);
      if (changed) this.publisher?.schedule('site tags (resync)');
      return changed;
    } catch (error) {
      this.logger.error?.(`[site-tags] resync failed: ${error?.message || error}`);
      return false;
    }
  }
}
