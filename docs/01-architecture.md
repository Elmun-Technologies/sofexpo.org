# 01 · Architecture

SOF EXPO Samarkand — an international (RU/EN) website for an exhibition centre and its
own trade shows. 146 static pages, 2 locales, zero client-side framework.

## 1. Decisions and why

| Decision | Value | Reason |
| --- | --- | --- |
| Rendering | Astro 7, `output: 'static'` | Every page is a plain HTML file: fastest Core Web Vitals, cheapest hosting, crawlable without JS. No hydration = no framework budget. |
| Client JS | ~1.5 KB total (countdown, search, menu, form) | Only three behaviours need JS; everything else is CSS. No React/Svelte runtime. |
| Styling | Hand-written CSS with design tokens (`src/styles/global.css`) | Full control of the "photo-led, no fluff" look; no utility-class dependency. One stylesheet for the whole site (27 KB / 8.8 KB gzip), cached across all 146 pages; component-scoped styles are added per chunk (`Blocks.astro`, `PostDetail.astro`). |
| Fonts | Self-hosted `@fontsource-variable/onest` + `unbounded` | No third-party request, no CLS from remote fonts, works offline in the sandbox preview. |
| i18n | `src/pages/[locale]/…` with explicit `/ru/` and `/en/` prefixes | Prefixed URLs keep hreflang/canonical unambiguous, per-locale sitemaps/RSS, and let `/` serve a bilingual gate. |
| Default locale | `en` (`astro.config.mjs` → `i18n.defaultLocale`) | International buyers (organizers, foreign exhibitors) are the money audience; RU is fully mirrored, not a fallback. |
| Root `/` | Bilingual gate page (indexable, not a redirect) | A redirect would waste the brand query ("sof expo samarkand") for the most important URL; the gate ranks and hands the user to `/ru/` or `/en/`. |
| Trailing slash | `'ignore'` in config, `localize()` always emits `/path/` | Canonical URLs always carry the slash, so `/ru/about` and `/ru/about/` never split equity in our markup. |
| Content model | Typed TS data (`src/data/**`) + 1 shared block renderer | Copy is authored per page in both locales, so structure and text differ everywhere while the renderer stays single-sourced. |
| SEO gate | `npm run audit:seo` (`scripts/seo-audit.mjs`) over `dist` | 146 pages × 2 locales cannot be checked by hand; the audit is the contract (see 02). |

## 2. Repository layout

```
sofexpo.org/
├── astro.config.mjs        # static output, site URL, i18n, sitemap, @ alias, lastmod
├── tsconfig.json           # strict, paths: @/* → src/*
├── package.json            # dev / build / preview / audit:seo
├── scripts/
│   ├── build-assets.mjs    # regenerates og/default.jpg + favicon/apple PNGs from public/images
│   ├── seo-audit.mjs        # SERP-readiness gate over dist/ (exits 1 on findings)
│   └── prune-sitemap.mjs    # drops noindex URLs from sitemap-0.xml (runs after astro build)
├── public/                 # copied verbatim to dist/
│   ├── images/*.jpg        # 10 photos: venue, halls, conference, exterior, 6 event posters
│   ├── files/*.pdf         # 21 documents (exhibitor forms, tech sheet, catalogues) — placeholders until real PDFs land
│   ├── robots.txt          # sitemap refs, per-locale allow, no /404
│   ├── llms.txt            # assistant-facing summary of venue, events, contacts
│   └── site.webmanifest
└── src/
    ├── i18n/{config.ts,ui.ts}   # locales, localize(), alternates(), switchHref, UI strings
    ├── data/
    │   ├── site.ts              # brand, contacts, venue, halls, services, stats, files, nav, footer
    │   ├── events.ts            # 6 ExpoEvent: dates, categories, stands, programme, FAQ, materials
    │   ├── archive.ts           # past editions (results, catalogue, photo) for /events/past/
    │   ├── posts.ts             # news + articles (front-matter-equivalent objects, both locales)
    │   └── pages/*.ts           # 32 authored pages + event-pages.ts (24 per-event pages)
    ├── lib/
    │   ├── seo.ts               # buildMeta, JSON-LD node factories, abs()
    │   ├── pages.ts             # authored-page index/getters, getStaticPaths helpers
    │   ├── nav.ts               # nav tree, pageCrumbs()
    │   └── search.ts            # search index builder (used by /search/index.json.ts)
    ├── styles/global.css        # tokens + all component CSS (single file, ~1500 lines)
    ├── layouts/Base.astro       # <head>, OG/Twitter, hreflang, JSON-LD graph, Header/Footer
    ├── components/              # 18 components, Blocks.astro is the content renderer
    └── pages/
        ├── index.astro              # bilingual gate
        ├── 404.astro                  # noindex,follow
        ├── [locale]/index.astro       # locale home (unique hero + 9 sections)
        ├── [locale]/[...slug].astro   # all 32 authored pages, one route
        ├── [locale]/events/{index,past,[slug],[slug]/[section]}.astro
        ├── [locale]/news/{index,[slug]}.astro
        ├── [locale]/articles/{index,[slug]}.astro
        ├── [locale]/search/{index.astro,index.json.ts}
        ├── [locale]/rss.xml.ts         # per-locale RSS 2.0
        └── [locale]/sitemap-*.xml      # emitted by @astrojs/sitemap
```

## 3. Data flow

```
src/data/*.ts  ──►  getStaticPaths (per locale)  ──►  route .astro
                                                     │
   meta: {ru:{title,description},en:{…}}  ───────────► Base.astro → buildMeta() → head
   blocks: {ru: Block[], en: Block[]}     ───────────► Blocks.astro → components
   hero / before / after (events only)    ───────────► EventPage.astro
```

Three page families, one renderer each:

1. **Authored pages** (`/venue/**`, `/exhibitors/**`, `/visitors/**`, `/organizers/**`,
   `/about/**`, `/contacts/`, `/request-stand/`, `/legal/**`) — one entry in
   `src/data/pages/*.ts`, rendered by `[locale]/[...slug].astro`. Each entry owns its own
   `blocks` sequence, so no two pages share a layout.
2. **Event pages** — `getEvent(slug)` + `eventPages` from `src/data/pages/event-pages.ts`;
   4 pages per event (main, `/exhibitors/`, `/visitors/`, `/program/`), assembled by
   `EventPage.astro` from `hero`, optional `before`/`after` arrays and event-specific data.
3. **Editorial** — `posts.ts` → `news` and `articles` clusters; `PostDetail` +
   `PostBody` render markdown bodies with a sidebar layout.

## 4. Build & asset pipeline

```bash
npm run dev        # astro dev — binds all interfaces, /ru/ /en/ live
npm run build      # → dist/ (146 pages) + sitemap pruned of noindex URLs
npm run audit:seo  # SEO/accessibility gate over dist/ — 0 findings required
npm run check      # build + audit in one go (this is what CI must run)
npm run preview    # serve dist/ (allowedHosts is open for the sandbox proxy)
node scripts/build-assets.mjs   # only when public/images/*.jpg or favicon.svg change
```

Notes for whoever deploys:

- Host any static origin with `/404.html` fallback **or** keep the folder-style output
  (`dist/ru/about/index.html`) — trailing-slash URLs resolve as directories on every host.
- `site: 'https://sofexpo.org/'` in `astro.config.mjs` is the single source of absolute URLs
  (canonical, OG, JSON-LD, sitemap, RSS). Change it once when the domain is final.
- `serialize` in the sitemap plugin pins `lastmod` to the content freeze date; bump it when
  copy changes rather than letting the build date drift.
- Images are JPEG, served from `/images/`, referenced with `loading="lazy"` except the
  hero (`preload` + `fetchpriority=high`). WebP/AVIF is intentionally skipped: no runtime JS,
  and static hosting has no image pipeline. Add `astro:assets` if real photography arrives.
- The 21 files in `public/files/` are placeholder PDFs so no link 404s; drop the real
  documents in with the same names and nothing else changes.

## 5. Performance budget (measured on the build)

| Metric | Value |
| --- | --- |
| HTML per page | 72–91 KB raw → 15–19 KB gzip (content is the payload, not the framework) |
| CSS | one file, 27 KB → 8.8 KB gzip, shared by every page (hashed, cacheable forever) |
| Requests per page | 1 HTML + 1 CSS + 2 font files + 1–4 images = 5–7 |
| Third-party calls | **0** — fonts self-hosted, no analytics, maps are link-outs |
| JS | 0 external files — inline blocks only: menu, countdown, FAQ, form (0.7–2 KB typical; 22 KB on `/search/`, which embeds the index) |
| `preconnect`/`preload` | emitted by `Base.astro` only where the page needs the hero image |

If a page ever crosses ~140 KB of HTML, the fix is to shorten the authored `blocks` list, not
to add a client framework.

## 6. Extension recipes

**New page:** add an entry to the matching `src/data/pages/<cluster>.ts`
(`path`, `meta`, `blocks`, optional `image`, `noindex`) → it appears in
`[locale]/[...slug].astro`, `nav`/footer if listed in `src/data/site.ts`, and the sitemap.
Run `npm run build && npm run audit:seo`.

**New exhibition:** add an `ExpoEvent` to `src/data/events.ts`, four entries per page in
`src/data/pages/event-pages.ts`, one poster in `public/images/event-<slug>.jpg`, one
`<slug>.md` per cluster if there is news. The event routes, breadcrumbs, `Event` JSON-LD,
RSS item and both locales' cross-links are derived automatically.

**New article:** one object in `src/data/posts.ts` (+ body in `src/content/`), both locales.
Titles and descriptions may run longer here than on commercial pages — the audit allows
≤96/≤210 for `/news|articles/{slug}` and ≤78/≤185 elsewhere.
