import downloads from '../data/downloads.json' with { type: 'json' };

/** Only owned, explicitly inventoried downloads can carry a publication status. */
export function downloadInfo(href) {
  try {
    const url = new URL(href, 'https://sof-expo.com');
    if (!['https:', 'http:'].includes(url.protocol) || !/^(?:[a-z0-9-]+\.)?sof-expo\.com$/i.test(url.hostname)) return undefined;
    return downloads[decodeURIComponent(url.pathname)];
  } catch {
    return undefined;
  }
}

export const isSampleDownload = href => downloadInfo(href)?.status === 'placeholder';

/**
 * The edition of an owned download for one locale: a document published in several languages
 * lists them under `variants` in downloads.json ({ ru: '/files/x-ru.pdf', uz: … }); every other
 * locale gets the base file. Query and fragment are kept.
 */
export function downloadFor(href, locale) {
  const variant = downloadInfo(href)?.variants?.[locale];
  if (!variant) return href;
  const url = new URL(href, 'https://sof-expo.com');
  return href.replace(url.pathname, variant);
}
