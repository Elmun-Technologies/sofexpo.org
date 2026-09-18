/**
 * Host rules — the ONLY implementation of "who owns a path".
 *
 * Imported by `src/data/hosts.ts` (so the SSG uses it) and by the plain-Node scripts
 * (`build-hosts.mjs`, `rewrite-host-links.mjs`, `check-hosts.mjs`), because a link layer that
 * is decided twice is a link layer that drifts. Data lives in `src/data/host-map.json`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The map is read, not imported: this module is consumed from three places with different
 * resolutions — the Astro config, the app bundle (whose prerender entry lives in
 * `dist/.prerender/`) and plain Node scripts. cwd is the project root in all of them, so try
 * it first and fall back to import-relative candidates.
 */
const REL = 'src/data/host-map.json';
function loadMap() {
  const tries = [
    `${process.cwd()}/${REL}`,
    fileURLToPath(new URL(`../${REL}`, import.meta.url)),
    fileURLToPath(new URL(`../../../${REL}`, import.meta.url)),
  ];
  for (const file of tries) {
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      /* next candidate */
    }
  }
  throw new Error(`host-map.json not found — tried:\n  ${tries.join('\n  ')}`);
}

export const map = loadMap();

export const ROOT_HOST = map.root;
export const SECTIONS = map.sections;
export const HOSTS = map.hosts;
export const LOCALES = ['ru', 'en'];

export function hostOfEvent(slug) {
  return HOSTS.find((h) => h.event === slug) ?? null;
}

export function eventOfHost(host) {
  return HOSTS.find((h) => h.host === host)?.event ?? null;
}

const CLUSTER_RE = new RegExp(`^/events/([a-z0-9-]+)(?:/(${SECTIONS.join('|')}))?/?$`);

/** `/ru/events/x/exhibitors/` -> `/events/x/exhibitors/` (idempotent on bare paths). */
export function stripLocale(path) {
  const parts = String(path || '/').split('/').filter(Boolean);
  if (LOCALES.includes(parts[0])) parts.shift();
  return parts.length ? `/${parts.join('/')}/` : '/';
}

/** `('ru', '/exhibitors/')` -> `/ru/exhibitors/` (always a trailing slash). */
export function joinLocale(locale, path) {
  const parts = stripLocale(path).split('/').filter(Boolean);
  return `/${locale}/${parts.join('/')}${parts.length ? '/' : ''}`;
}

/**
 * Owner of a root-space path + the path it becomes there.
 * mode 'alias' → always the root host, path unchanged (that is what keeps the default build
 * byte-identical); mode 'subdomain' → the exhibition cluster belongs to its own hostname.
 */
/**
 * `/` is deliberately host-relative: it means "the home of the host being built", so an
 * exhibition hostname's language switch, gate doors and x-default stay on that host while the
 * brand link in the header can still ask for `rootUrl('/')` explicitly.
 */
export function ownerOf(path, mode = 'alias', currentHost = ROOT_HOST) {
  const clean = stripLocale(path);
  if (clean === '/') return { host: currentHost, path: '/' };
  if (mode === 'subdomain') {
    const m = clean.match(CLUSTER_RE);
    if (m) {
      const def = hostOfEvent(m[1]);
      if (def) return { host: def.host, path: m[2] ? `/${m[2]}/` : '/' };
    }
  }
  return { host: ROOT_HOST, path: clean };
}

/**
 * The href a page on `currentHost` must write for `path`.
 * Same host → root-relative; another host → absolute. Never anything else.
 */
export function hrefFor(locale, path, { mode = 'alias', currentHost = ROOT_HOST } = {}) {
  const owner = ownerOf(path, mode, currentHost);
  const local = joinLocale(locale, owner.path);
  return owner.host === currentHost ? local : `https://${owner.host}${local}`;
}

export function isBuiltHere(path, { mode = 'alias', currentHost = ROOT_HOST } = {}) {
  const owner = ownerOf(path, mode, currentHost);
  return owner.host === currentHost && owner.path === stripLocale(path);
}

/** Legacy root URLs that must 301 to the cluster's own host (subdomain mode only). */
export function movedRedirects(mode = 'subdomain') {
  if (mode !== 'subdomain') return [];
  const out = [];
  for (const def of HOSTS) {
    for (const locale of LOCALES) {
      out.push({ from: `/${locale}/events/${def.event}/`, to: `https://${def.host}/${locale}/` });
      for (const section of SECTIONS)
        out.push({ from: `/${locale}/events/${def.event}/${section}/`, to: `https://${def.host}/${locale}/${section}/` });
    }
  }
  return out;
}

/** Vanity hosts that only ever redirect (alias mode only). */
export function aliasRedirects(mode = 'alias') {
  if (mode !== 'alias') return [];
  return HOSTS.flatMap((h) => [
    { from: h.host, to: `https://${ROOT_HOST}/events/${h.event}/` },
    { from: `www.${h.host}`, to: `https://${ROOT_HOST}/events/${h.event}/` },
  ]);
}

export function allHosts() {
  return [{ host: ROOT_HOST, event: null }, ...HOSTS];
}
