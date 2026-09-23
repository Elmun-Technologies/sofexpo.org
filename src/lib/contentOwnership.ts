/**
 * The per-host editorial rule (decided 2026-09-18): a news note or long-read tagged with an
 * exhibition that owns a hostname is PUBLISHED on that hostname. The centre's indexes still list
 * it — with an absolute link — so nothing becomes an orphan, and the show host gains a text that
 * exists nowhere else.
 *
 * The decision itself lives in `src/data/editorial-owners.json`, generated from the `event:`
 * frontmatter by `scripts/gen-editorial-map.mjs`, and is applied by `ownerOf()` — so a canonical
 * tag, a card href and a link inside an article body can never disagree. In `alias` mode the map
 * is never consulted and every piece belongs to the centre.
 */
import { CURRENT_HOST, ownerOf } from "@/data/hosts";
import { localize, type SourceLocale as Locale } from "@/i18n/config";

export type PostKind = "news" | "articles";

export function postPath(kind: PostKind, slug: string): string {
  return `/${kind}/${slug}/`;
}

/** The host that publishes this piece. */
export function ownerHostOfPost(kind: PostKind, slug: string): string {
  return ownerOf(postPath(kind, slug)).host;
}

/** Does the host being build own it? (used by the detail routes' getStaticPaths) */
export function ownsPost(kind: PostKind, slug: string): boolean {
  return ownerHostOfPost(kind, slug) === CURRENT_HOST;
}

/** href for a post — relative on its own host, absolute from any other. */
export function postHref(locale: Locale, kind: PostKind, slug: string): string {
  return localize(locale, postPath(kind, slug));
}
