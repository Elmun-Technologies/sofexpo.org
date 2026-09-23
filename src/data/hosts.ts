/**
 * Host registry — "which hostname owns which path", typed for the app.
 *
 * One Astro project, one build per hostname: `SITE` picks the host, `PUBLIC_HOSTS_MODE` picks
 * the topology (docs: `docs/05-subdomains.md`). All logic lives in `scripts/host-rules.mjs` so
 * the SSG and the build/verify scripts can never disagree; this file only exposes it with types
 * plus the env reading. Every internal href in the site is produced by `localize()` in
 * `src/i18n/config.ts`, which resolves the owner here — so the topology is a config decision,
 * not a template rewrite.
 *
 * Modes:
 *  'alias'     — everything on `sofexpo.org`; vanity subdomains (if registered) are pure 301s
 *                to `/events/{slug}/`. DEFAULT: output is byte-identical to the single-host build.
 *  'subdomain' — each recurring exhibition owns a hostname. Its 4-page cluster lives there
 *                (`/`, `/exhibitors/`, `/visitors/`, `/program/`); the centre keeps the venue,
 *                the audience hubs, the calendar, ALL editorial (news + long-reads) and legal.
 *                The old root paths become redirect stubs with a cross-host canonical, so no
 *                inbound anchor is stranded on a 404.
 *
 * SEO invariants (verified by `scripts/check-hosts.mjs`):
 *  · a path is built on exactly one host — no duplicated text, no canonical conflict;
 *  · cross-host links are absolute and go through `localize()`, never hand-written;
 *  · hreflang pairs are same-host — a language switch never jumps hostname;
 *  · every host gets its own robots.txt, sitemap and Search Console property.
 */
import map from "./host-map.json";
import { brandForEvent, type HostBrand } from "./brands";
import {
  ROOT_HOST as ROOT,
  aliasRedirects as aliasRedirectsRaw,
  allHosts,
  eventOfHost,
  hostOfEvent,
  hrefFor,
  isBuiltHere as builtHere,
  movedRedirects,
  ownerOf as ownerOfRaw,
} from "../../scripts/host-rules.mjs";

export type HostMode = "alias" | "subdomain";

/**
 * Env-first, twice over: `import.meta.env` is what Astro injects into app code, `process.env`
 * is what the plain-Node scripts and the Astro config see.
 */
function envValue(key: string): string | undefined {
  const injected = (
    import.meta as unknown as { env?: Record<string, string | undefined> }
  ).env;
  return (
    injected?.[key] ??
    (typeof process !== "undefined" ? process.env[key] : undefined)
  );
}

/** Flip the env var (`PUBLIC_HOSTS_MODE`) to change the topology. */
export const HOSTS_MODE: HostMode =
  (envValue("PUBLIC_HOSTS_MODE") as HostMode) || "alias";

export const ROOT_HOST: string = ROOT;

export interface HostDef {
  /** hostname, no protocol */
  host: string;
  /** event slug this host is dedicated to; null for the root host */
  event: string | null;
  /** brand label used in nav, docs and the deploy config */
  label: { ru: string; en: string };
}

/**
 * One entry per recurring exhibition (data in `src/data/host-map.json`). Names are short and
 * brand-shaped: the show name only, no `-expo` echo, no underscores (illegal in hostnames).
 * `promotors-show-samarkand` is deliberately absent: a finished one-off festival does not earn
 * a hostname or its own search property — it stays in the root archive where its noindex pages
 * already live.
 */
export const EVENT_HOSTS: HostDef[] = map.hosts as HostDef[];

export const ALL_HOSTS: HostDef[] = allHosts() as HostDef[];

/** Host this build produces, e.g. `sofexpo.org` or `foodera.sofexpo.org`. */
export const CURRENT_HOST: string = (() => {
  const raw = envValue("SITE") || `https://${ROOT_HOST}/`;
  return raw.replace(/^https?:\/\//, "").replace(/\/+$/, "") || ROOT_HOST;
})();

export const isRootHost = CURRENT_HOST === ROOT_HOST;

/** Slug of the exhibition this build is dedicated to (null on the root host). */
export const CURRENT_EVENT: string | null = eventOfHost(CURRENT_HOST);

/** the identity of this host, or null when it wears the centre's own */
export const CURRENT_BRAND: HostBrand | null = brandForEvent(CURRENT_EVENT);

export function hostOfEventSlug(slug: string): HostDef | null {
  return hostOfEvent(slug) as HostDef | null;
}

/** Owner of a root-space path (no locale prefix) and the path it becomes there. */
export function ownerOf(path: string): { host: string; path: string } {
  return ownerOfRaw(path, HOSTS_MODE, CURRENT_HOST);
}

/** Absolute-or-relative href for a link target — the implementation behind `localize()`. */
export function hrefForPath(locale: "ru" | "en" | "zh" | "tr", path: string): string {
  return hrefFor(locale, path, { mode: HOSTS_MODE, currentHost: CURRENT_HOST });
}

/** Should this host emit the page at this root-space path? */
export function isOwnPage(path: string): boolean {
  return ownerOf(path).host === CURRENT_HOST;
}

/**
 * Is this path emitted by THIS build at THIS very URL? A relocated cluster page is owned by this
 * host but lives at a shorter path, so the `/events/{slug}/…` route files must skip it and the
 * host-local route files must build it instead.
 */
export function isBuiltHere(path: string): boolean {
  return builtHere(path, { mode: HOSTS_MODE, currentHost: CURRENT_HOST });
}

/** True when the cluster of `slug` lives on another host and the root must only redirect. */
export function clusterMoved(slug: string): boolean {
  return HOSTS_MODE === "subdomain" && isRootHost && !!hostOfEvent(slug);
}

export function hostUrl(host: string, path = "/"): string {
  const p = path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`;
  return `https://${host}${p}`;
}

/** Root-host URL — used for shared assets and legal pages referenced from an event host. */
export function rootUrl(path = "/"): string {
  return hostUrl(ROOT_HOST, path);
}

/** 301 map for vanity hostnames in alias mode. */
export function aliasRedirects(): { from: string; to: string }[] {
  return aliasRedirectsRaw(HOSTS_MODE);
}

/** Paths the root host must redirect in subdomain mode. */
export function movedClusterPaths(): { from: string; to: string }[] {
  return movedRedirects(HOSTS_MODE);
}
