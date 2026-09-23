import { getCollection, render, type CollectionEntry } from 'astro:content';

export type PostKind = 'news' | 'articles';

/** Entries of one collection, for a locale, newest first. */
export async function postsFor(kind: PostKind, locale: string) {
  const all = await getCollection(kind, ({ data }: any) => !data.draft);
  return all
    .filter((e: CollectionEntry<PostKind>) => e.id.startsWith(`${locale}/`))
    .sort((a: any, b: any) => (b.data.date as Date).getTime() - (a.data.date as Date).getTime());
}

/** slug without the locale folder */
export function bareId(id: string) {
  return id.split('/').slice(1).join('/');
}

/** The counterpart entry id in another locale, if the slug matches. */
export function pairId(kind: PostKind, id: string, locale: string) {
  return `${locale}/${bareId(id)}`;
}

export async function allIds(kind: PostKind) {
  const all = await getCollection(kind, ({ data }: any) => !data.draft);
  return new Set(all.map((e: any) => e.id as string));
}

export { render };

/**
 * "Related" by topic, not by date: same show > same category > shared tags, ties broken by
 * a stable per-post rotation. Every post therefore links to a different set of neighbours
 * (no three cards repeated on every page) and the links carry topical relevance.
 */
export function relatedTo<T extends { id: string; data: any }>(entry: T, pool: T[], n = 3): T[] {
  const tags = new Set<string>((entry.data.tags ?? []).map((t: string) => t.toLowerCase()));
  const seed = [...entry.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const score = (e: T) =>
    (entry.data.event && e.data.event === entry.data.event ? 8 : 0) +
    (entry.data.category && e.data.category === entry.data.category ? 4 : 0) +
    (e.data.tags ?? []).filter((t: string) => tags.has(t.toLowerCase())).length * 2;
  const rot = (e: T) => ([...e.id].reduce((a, c) => (a * 17 + c.charCodeAt(0)) >>> 0, seed) % 1000) / 1000;
  return pool
    .filter((e) => e.id !== entry.id)
    .map((e) => ({ e, s: score(e) + rot(e) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.e);
}
