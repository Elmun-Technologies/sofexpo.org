/**
 * Third-party measurement and webmaster verification, all switched on by build-time env only
 * (docs/22). Nothing loads until an id is set, and a malformed value is dropped rather than
 * printed into every page — these strings land in <head> on all hosts.
 */
const env = import.meta.env;

const pick = (value: unknown, pattern: RegExp): string => {
  const text = String(value ?? '').trim();
  return pattern.test(text) ? text : '';
};

/** a verification var may carry several tokens (one per Search Console / Webmaster property) */
const tokens = (value: unknown): string[] =>
  String(value ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter((token) => /^[A-Za-z0-9_-]{8,100}$/.test(token));

export const analytics = {
  /** Google Analytics 4 measurement id, e.g. G-ABC123XYZ9 */
  ga4: pick(env.PUBLIC_GA4_ID, /^G-[A-Z0-9]{4,16}$/),
  /** Yandex Metrica counter number; Webvisor, click map and link tracking are on */
  ym: pick(env.PUBLIC_YM_ID, /^\d{5,12}$/),
};

/** <meta name=… content=…> pairs for Google Search Console, Yandex Webmaster and Bing */
export const verificationMeta: { name: string; content: string }[] = [
  ...tokens(env.PUBLIC_GOOGLE_SITE_VERIFICATION).map((content) => ({ name: 'google-site-verification', content })),
  ...tokens(env.PUBLIC_YANDEX_VERIFICATION).map((content) => ({ name: 'yandex-verification', content })),
  ...tokens(env.PUBLIC_BING_VERIFICATION).map((content) => ({ name: 'msvalidate.01', content })),
];
