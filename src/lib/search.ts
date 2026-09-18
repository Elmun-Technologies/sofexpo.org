import { pages } from '@/data/pages';
import { events } from '@/data/events';
import { getCollection } from 'astro:content';
import { localize, type Locale } from '@/i18n/config';

export interface SearchDoc {
  title: string;
  text: string;
  href: string;
  kind: string;
  haystack: string;
}

/** Everything indexable on the site, per locale: authored pages, events, news, articles. */
export async function searchDocs(locale: Locale): Promise<SearchDoc[]> {
  const out: SearchDoc[] = [];
  for (const page of pages) {
    const meta = page.meta[locale];
    const blocks = page.blocks[locale];
    const body = blocks
      .flatMap((b) => [b.title, b.lead, b.text, b.note, ...(b.paragraphs ?? []), ...(b.list ?? []), ...(b.items ?? []).map((i: any) => `${i.title ?? i.label ?? i.q ?? ''} ${i.text ?? i.a ?? ''}`)].filter(Boolean))
      .join(' ')
      .replace(/\s+/g, ' ')
      .slice(0, 700);
    out.push({ title: meta.title.split(' — ')[0], text: meta.description, href: localize(locale, page.path), kind: 'page', haystack: `${meta.title} ${meta.description} ${body}`.toLowerCase() });
  }
  for (const e of events) {
    const body = [e.tagline[locale], e.intro[locale], e.pitch[locale], ...e.categories.map((c) => c.name[locale]), ...e.benefits.map((b) => `${b.title[locale]} ${b.text[locale]}`), ...e.searchTerms.map((t) => t[locale])].join(' ');
    out.push({
      title: `${e.brand[locale]} — ${e.edition[locale]}`,
      text: `${e.dates.display[locale]} · ${e.tagline[locale]}`,
      href: localize(locale, `/events/${e.slug}/`),
      kind: 'event',
      haystack: `${e.brand[locale]} ${e.shortName} ${body}`.toLowerCase(),
    });
    for (const sub of ['exhibitors', 'visitors', 'program'] as const) {
      out.push({
        title: `${e.shortName} · ${sub === 'exhibitors' ? (locale === 'ru' ? 'участникам' : 'for exhibitors') : sub === 'visitors' ? (locale === 'ru' ? 'посетителям' : 'for visitors') : locale === 'ru' ? 'программа' : 'programme'}`,
        text: e.intro[locale],
        href: localize(locale, `/events/${e.slug}/${sub}/`),
        kind: 'event',
        haystack: `${e.brand[locale]} ${sub} ${e.intro[locale]}`.toLowerCase(),
      });
    }
  }
  for (const kind of ['news', 'articles'] as const) {
    const col = await getCollection(kind, ({ data }: any) => !data.draft);
    for (const entry of col) {
      if (!entry.id.startsWith(`${locale}/`)) continue;
      const slug = entry.id.split('/').slice(1).join('/');
      out.push({
        title: entry.data.title,
        text: entry.data.description,
        href: `/${locale}/${kind}/${slug}/`,
        kind,
        haystack: `${entry.data.title} ${entry.data.description} ${(entry.data.tags ?? []).join(' ')} ${entry.data.category ?? ''}`.toLowerCase(),
      });
    }
  }
  return out;
}

/** Simple token scoring: full-word prefix matches first, then substring. */
export function rank(docs: SearchDoc[], query: string): SearchDoc[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return docs
    .map((d) => {
      let score = 0;
      for (const t of tokens) {
        if (d.title.toLowerCase().includes(t)) score += 6;
        if (d.haystack.startsWith(t)) score += 4;
        const hits = d.haystack.split(t).length - 1;
        score += Math.min(hits, 8);
      }
      return { d, score };
    })
    .filter((r) => r.score > 2)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.d);
}
