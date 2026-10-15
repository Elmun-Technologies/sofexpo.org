/**
 * Search-engine verification and analytics/pixel ids (docs/22). The admin panel saves them
 * into src/data/site-tags.json (the backend commits it and the push rebuilds the site);
 * PUBLIC_* env vars only fill fields the admin left empty. Every value is re-validated here
 * with the same spec the backend uses (scripts/site-tags.mjs) — these strings land in <head>
 * on every page, so nothing malformed gets through.
 */
import saved from '@/data/site-tags.json';
import { resolveSiteTags, verificationTags } from '../../scripts/site-tags.mjs';

export interface SiteTags {
  googleVerification?: string;
  yandexVerification?: string;
  bingVerification?: string;
  baiduVerification?: string;
  facebookVerification?: string;
  ga4Id?: string;
  gtmId?: string;
  yandexMetrikaId?: string;
  yandexWebvisor?: boolean;
  baiduTongjiId?: string;
  googleAdsId?: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
  customHead?: string;
}

export const siteTags: SiteTags = resolveSiteTags(saved, import.meta.env);

/** <meta name=… content=…> pairs for Google, Yandex, Bing, Baidu and Meta */
export const verificationMeta = verificationTags(siteTags) as { name: string; content: string }[];

/** any tracker at all → the loader script is printed */
export const hasTrackers = Boolean(
  siteTags.ga4Id || siteTags.gtmId || siteTags.yandexMetrikaId || siteTags.baiduTongjiId
    || siteTags.googleAdsId || siteTags.metaPixelId || siteTags.tiktokPixelId,
);
