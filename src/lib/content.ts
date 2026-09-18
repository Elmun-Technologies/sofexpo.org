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
