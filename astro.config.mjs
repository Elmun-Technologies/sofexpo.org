// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SOF EXPO SAMARKAND — international exhibition centre website.
// Static output (SSG): fastest Core Web Vitals, CDN friendly, no client JS framework.
// One project, many hostnames: `SITE` picks the host and `PUBLIC_HOSTS_MODE` the topology.
// `npm run build:hosts` builds every host; see docs/05-subdomains.md.
const SITE = process.env.SITE || 'https://sofexpo.org/';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  compressHTML: true,
  alias: { '@': 'src' },
  build: { inlineStylesheets: 'auto' },
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: {
        defaultLocale: 'en',
        locales: { ru: 'ru-RU', en: 'en-US' },
      },
      serialize: (item) => ({ ...item, lastmod: new Date('2026-09-18') }),
    }),
  ],
  vite: {
    build: { cssMinify: true },
    // allow any host in the sandbox/dev preview (the reverse proxy rewrites Host)
    server: { allowedHosts: true },
    preview: { allowedHosts: true },
  },
});
