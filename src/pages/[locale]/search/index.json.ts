import type { APIContext } from 'astro';
import { locales, type Locale } from '@/i18n/config';
import { searchDocs } from '@/lib/search';

export function getStaticPaths() {
  return locales.map((locale) => ({ params: { locale } }));
}

/** Machine-readable site index used by the search page (no server, no third-party service). */
export async function GET(context: APIContext) {
  const locale = context.params.locale as Locale;
  const docs = await searchDocs(locale);
  return new Response(
    JSON.stringify({
      locale,
      generated: new Date().toISOString(),
      count: docs.length,
      items: docs.map(({ title, text, href, kind }) => ({ title, text, href, kind })),
    }),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
}
