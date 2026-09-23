import downloads from '../data/downloads.json' with { type: 'json' };

/** Only owned, explicitly inventoried downloads can carry a publication status. */
export function downloadInfo(href) {
  try {
    const url = new URL(href, 'https://sofexpo.org');
    if (!['https:', 'http:'].includes(url.protocol) || !/^(?:[a-z0-9-]+\.)?sofexpo\.org$/i.test(url.hostname)) return undefined;
    return downloads[decodeURIComponent(url.pathname)];
  } catch {
    return undefined;
  }
}

export const isSampleDownload = href => downloadInfo(href)?.status === 'placeholder';
