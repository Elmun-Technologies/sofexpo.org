import { defineMiddleware } from 'astro:middleware';
import { localizeHTML, localizeRSS, localizeSearchJSON } from '../scripts/localization.mjs';

/** Dev uses the same static catalogs as the build. No browser translation/flicker. */
export const onRequest = defineMiddleware(async (context, next) => {
  // Passed by the development server adapter, not by client headers or query parameters.
  const locale = context.locals.sofexpoLocale;
  if (locale !== 'zh' && locale !== 'tr') return next();
  const response = await next();
  // The shared 404 is intentionally multilingual and has no translated route sibling.
  if (response.status === 404) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!/html|xml|json/.test(contentType)) return response;
  const body = await response.text();
  const options = { strict: true };
  const html = contentType.includes('html') ? localizeHTML(body, locale, options) : contentType.includes('json') ? localizeSearchJSON(body, locale, options) : localizeRSS(body, locale, options);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('content-language', locale === 'zh' ? 'zh-CN' : 'tr');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
});
