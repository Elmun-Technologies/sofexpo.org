# SOF EXPO Samarkand — sofexpo.org

Website of the SOF EXPO Samarkand exhibition & congress centre and its own trade shows:
one **Astro 7** project, **152 static pages**, two locales (RU/EN), **zero client-side
framework**, and up to **six hostnames** (centre + five exhibition subdomains) built from the
same source tree.

| Gate                  | Result                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `npm run check`       | 152 pages built · `audit:seo` → **0 findings**                      |
| `npm run check:hosts` | 6 hosts built · **✓ hosts agree** (25,464 internal links verified)  |
| Client JS shipped     | 0 external files — inline behaviour only                            |
| Third-party requests  | **0** (fonts self-hosted, no analytics, no CDN calls)               |

---

## Qisqacha (UZ)

- **Nima bu.** SOF EXPO Samarkand ekspomarkazi va uning 6 ta ko'rgazmasining sayti: statik
  (Astro 7), RU/EN ikki tilda, 152 sahifa, reaktiv freymvorksiz (React/Vue yo'q).
- **Ishga tushirish.** `npm ci` → `npm run dev` → `http://localhost:4321/` (`/` avtomatik `/en/`
  ga o'tadi, `/ru/` ham ishlaydi).
- **Tekshirish.** `npm run check` = build + SEO/accessibility auditi (0 topilma bo'lishi shart).
- **Ko'p host.** `npm run build:hosts` — markaz + `foodera / buildpro / agropro / worldedu /
  ecomretail` subdomenlari; har biri o'z sitemap, robots, `_redirects` va brendi bilan.
  Bitta hostni yig'ish: `node scripts/build-one-host.mjs <hostname>`.
- **Deploy.** Bitta statik `dist/` katalogi: Cloudflare Pages'da har host uchun bitta loyiha
  (`docs/06-deploy.md`), yoki nginx/Caddy uchun `dist-hosts/<host>/`.
- **Kontent qayerda.** Matn va faktlar `src/data/**` (TS) va `src/content/**` (markdown);
  qolganini marshrutlar va komponentlar o'zi yig'adi. Sahifa qo'shish uchun shablon
  yozilmaydi — ma'lumot qo'shiladi (`docs/01` §6).
- **To'liq hujjatlar.** `docs/01` … `docs/08` (arxitektura, SEO-kontrakt, link-map, dizayn
  tizimi, subdomenlar, deploy, dizayn-revyu, UI-audit). Quyida qisqa yo'naltirgich bor.

---

## 1. What the project is

The centre runs its own portfolio of six exhibitions plus third-party events. The site has to
serve two audiences at once — international exhibitors/buyers in English and the regional
(UZ/RU-speaking) market in Russian — without a CMS, without a backend, and without a client
framework that would hurt Core Web Vitals.

So the whole thing is **authored data + one renderer per page family**, prerendered to plain
HTML:

- **Content** lives in typed TypeScript (`src/data/**`) and Markdown (`src/content/**`), both
  locales side by side, so structure and copy can differ per page instead of being templated.
- **Pages** are three families — authored pages (one route file), event clusters (4 pages per
  show), and editorial (news + long-reads) — see `docs/01-architecture.md`.
- **Links** are always produced by one function, `localize()` (`src/i18n/config.ts`), which asks
  `src/data/host-map.json` who owns the path. That is what makes the multi-host split a config
  decision rather than a template rewrite.

### The line-up the data drives

| Show                          | Dates          | Status                  | Host (`subdomain` mode)  |
| ----------------------------- | -------------- | ----------------------- | ------------------------ |
| FOODERA EXPO 2026             | 20–22 Oct 2026 | open                    | `foodera.sofexpo.org`    |
| BUILDPRO EXPO 2026            | 9–11 Nov 2026  | open                    | `buildpro.sofexpo.org`   |
| AGROPRO EXPO 2027             | 2–4 Mar 2027   | registration            | `agropro.sofexpo.org`    |
| WORLD EDU EXPO 2027           | 9–10 Apr 2027  | registration            | `worldedu.sofexpo.org`   |
| ECOM & RETAIL EXPO 2027       | 16–17 Jun 2027 | registration            | `ecomretail.sofexpo.org` |
| PROMOTORS SHOW SAMARKAND 2026 | 12–13 Sep 2026 | past (archive, noindex) | —                        |

Source of truth: `src/data/events.ts`; past results in `src/data/archive.ts`.

## 2. Quick start

Requirements: **Node ≥ 22.18** (the build scripts import `.ts` data files and rely on Node's
native type stripping) and npm ≥ 10. No database, no API keys, no services to start.

```bash
git clone https://github.com/Elmun-Technologies/sofexpo.org.git
cd sofexpo.org
npm ci
npm run dev            # http://localhost:4321/  → 301 to /en/  (/ru/ also live)
```

Other useful entry points:

```bash
npm run build          # → dist/  (152 pages) + sitemap pruned of noindex URLs
npm run preview        # serve dist/ locally on :4321
npm run check          # build + SEO/accessibility audit — the CI gate
npm run check:hosts    # build all 6 hostnames into dist-hosts/ and verify cross-host links
node scripts/build-one-host.mjs foodera.sofexpo.org   # exactly what a deploy target runs
```

## 3. Commands

| Command                        | What it does                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `npm run dev`                  | Astro dev server on `0.0.0.0:4321`; `/` 301s to `/en/`, both locales live                      |
| `npm run build`                | Regenerates the editorial ownership map, builds `dist/`, prunes `noindex` URLs from the sitemap |
| `npm run preview`              | Serves `dist/` (host allow-list open, for sandbox/preview proxies)                              |
| `npm run audit:seo`            | SEO + accessibility gate over `dist/` — exits non-zero on any finding                           |
| `npm run check`                | `build` + `audit:seo`; **this is the merge gate**                                               |
| `npm run build:hosts`          | Builds all 6 hostnames → `dist-hosts/<host>/`, each with its own robots/sitemap/_redirects      |
| `npm run build:alias`          | Same matrix in single-host (`alias`) mode                                                       |
| `npm run check:hosts`          | `build:hosts` + `scripts/check-hosts.mjs` — cross-host link integrity                           |
| `npm run build:host`           | Build **one** hostname into `dist/` (`node scripts/build-one-host.mjs <host> [--mode …]`)       |
| `npm run editorial:map`        | Regenerates `src/data/editorial-owners.json` (which host publishes which article)               |
| `node scripts/build-assets.mjs`| Regenerates OG cards + favicons from the source SVGs/photos (only when those change)            |
| `python3 scripts/qa-independent.py` | Independent QA reader over `dist/` + `dist-hosts/*` — deliberately not the project's own audit |

## 4. Repository layout

```
sofexpo.org/
├── astro.config.mjs        # static output, site URL from SITE, i18n, sitemap, @ alias, ICS integration
├── tsconfig.json           # strict + paths: @/* → src/*
├── scripts/                # build & verification tooling (see §8)
├── public/                 # copied verbatim to dist/
│   ├── images/             # 25 photos used by heroes, venue gallery and event cards
│   ├── files/              # 21 PDFs (tech sheet, rate card, catalogues…) — placeholders, same names
│   ├── brand/<id>/         # per-show favicon/apple-touch-icon/og card
│   ├── robots.txt          # hand-authored; the build injects per-host Sitemap:/Host: lines
│   ├── llms.txt            # assistant-facing summary of the venue, line-up and contacts
│   └── site.webmanifest
└── src/
    ├── i18n/               # locales, localize()/alternates(), UI strings
    ├── data/               # site.ts, events.ts, archive.ts, brands.ts,
    │                       # host-map.json, brand-map.json, editorial-owners.json,
    │                       # pages/*.ts (32 authored pages + 24 event pages)
    ├── content/            # news/ (5) + articles/ (8) per locale, Markdown + frontmatter
    ├── lib/                # seo.ts (meta + JSON-LD), pages.ts, nav.ts, search.ts, labels.ts,
    │                       # hostRoutes.ts, contentOwnership.ts, content.ts
    ├── styles/global.css   # design tokens + all component CSS (one file)
    ├── layouts/Base.astro  # <head>, OG/Twitter, hreflang, JSON-LD @graph, header/footer
    ├── components/         # 27 components; Blocks.astro is the content-block renderer
    └── pages/              # routes: [locale]/… , events, news, articles, search, rss.xml, 404
```

## 5. How a page is assembled

```
src/data/*.ts ─► getStaticPaths (per locale) ─► route .astro
   meta:   {ru:{title,description}, en:{…}} ─► Base.astro ─► buildMeta() ─► <head>
   blocks: {ru: Block[], en: Block[]}      ─► Blocks.astro ─► components
   hero / before / after (events only)     ─► EventPage.astro
```

- **Authored pages** — one entry in `src/data/pages/<cluster>.ts`, rendered by
  `[locale]/[...slug].astro`; each entry owns its own block sequence, so no two pages share a
  layout.
- **Event pages** — `getEvent(slug)` + `src/data/pages/event-pages.ts`; four pages per show
  (main, `/exhibitors/`, `/visitors/`, `/program/`) assembled by `EventPage.astro`.
- **Editorial** — Markdown in `src/content/news|articles/{ru,en}/`, rendered by
  `PostDetail` + `PostBody`; a piece tagged `event:` in its frontmatter is published on that
  show's hostname (`src/data/editorial-owners.json`), and the centre's indexes link to it
  absolutely.

Layout/typography rules live in `docs/04-design-system.md`: photo first, one idea per block,
numbers instead of adjectives, no gradients/glass/decorative animation, one CSS file.

## 6. Recipe: adding content

**New page** — add an entry to the matching `src/data/pages/<cluster>.ts` (`path`, `meta`,
`blocks`, optional `image`, `noindex`). It appears in the route, the sitemap, and nav/footer if
listed in `src/data/site.ts`. Then run `npm run check`.

**New exhibition** — add an `ExpoEvent` to `src/data/events.ts`, four entries to
`src/data/pages/event-pages.ts`, a poster `public/images/event-<slug>.jpg`, and (in subdomain
mode) a line in `src/data/host-map.json` + an identity entry in `src/data/brand-map.json`.
Routes, breadcrumbs, `ExhibitionEvent` JSON-LD, RSS items and both locales' cross-links are
derived automatically.

**New article / press release** — one Markdown file per locale under
`src/content/{articles,news}/{ru,en}/` with frontmatter `title`, `description`, `date`, `tags`,
optional `hero`, `event`, `readingMinutes`. Title/description budgets are looser for editorial
pages (≤ 96 / ≤ 210 chars vs ≤ 78 / ≤ 185 elsewhere) and are asserted by the audit.

## 7. One project, up to six hostnames

Two modes, one variable — `PUBLIC_HOSTS_MODE`:

| Mode                | What is published                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `alias` (default)   | Everything on `sofexpo.org`; a show's cluster lives at `/events/{slug}/…`                                                     |
| `subdomain`         | Each recurring show owns a hostname (`/`, `/exhibitors/`, `/visitors/`, `/program/`); the centre keeps the venue, the audience hubs, the calendar, **all editorial** and legal pages. Old centre URLs become `noindex,follow` stubs + 301s |

Ownership is decided once, in `scripts/host-rules.mjs` (+ `src/data/host-map.json`), imported by
both the SSG and the Node build scripts, and verified by `scripts/check-hosts.mjs`:

- a path is built on exactly one host (no duplicate content, no canonical conflict);
- relative links never point at a page this host does not build;
- `hreflang` pairs and the language switch never jump hostname;
- every host ships its own `robots.txt`, sitemap and Search Console property;
- each show host carries its own palette, wordmark, favicon and OG card (`src/data/brand-map.json`).

Full rules: `docs/05-subdomains.md`.

## 8. Quality gates

Everything that must not regress is a script, not a convention:

| Script                          | Guarantees                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/seo-audit.mjs`         | Unique titles/descriptions within budget, exactly one `h1`, canonical matches the file layout, hreflang resolves, no broken internal links, no orphan pages, `alt` on every image (JS `dist/`) |
| `scripts/prune-sitemap.mjs`     | `noindex` pages (past editions, moved stubs, 404) never reach the sitemap                                                              |
| `scripts/check-hosts.mjs`       | Cross-host integrity of the multi-host build (rules above)                                                                             |
| `scripts/gen-editorial-map.mjs` | Keeps "which host publishes which text" derived from the content's own frontmatter                                                     |
| `scripts/rewrite-host-links.mjs`| Turns hand-written links inside Markdown bodies into absolute URLs when the target moved host                                          |
| `scripts/qa-independent.py`     | Second, independent reader of the built output — a bug in the project's own audit cannot hide here                                     |

SEO contract in one paragraph: every indexable page emits a `WebSite` + `Organization` +
`ExhibitionCenter` node joined by `@id`, plus `BreadcrumbList`/`ExhibitionEvent`/`Article`/
`FAQPage`/`ItemList` where they apply (`src/lib/seo.ts`). Event nodes are truthful about state
(`eventStatus: EventCompleted` once the dates pass) and publish **no** `offers` we cannot back up
on the page. Detail: `docs/02-semantic-core.md`, `docs/03-link-map.md`.

Performance budget (measured on the current build): 0 external JS files, 0 third-party requests,
5 CSS files totalling ~64 KB raw / ~16 KB gzip (hashed, cached across all pages), self-hosted
variable fonts with Cyrillic subsets, 5–7 requests per page.

## 9. Deployment

Two supported shapes, both static:

**A. Cloudflare Pages (recommended) — one project per hostname.** Build command
`node scripts/build-one-host.mjs <hostname>`, output directory `dist`, variable
`PUBLIC_HOSTS_MODE=subdomain`. The centre's project also emits `dist/_redirects` with 41 rules —
the root rule (`/ → /en/ 301`) plus 40 legacy-cluster 301s. `/` keeps an HTML meta-refresh
fallback for hosts that ignore `_redirects`.

```
node scripts/build-one-host.mjs sofexpo.org
node scripts/build-one-host.mjs foodera.sofexpo.org      # …and the other four shows
```

**B. Own VPS (nginx/Caddy).** `npm run check:hosts` writes all six builds to
`dist-hosts/<host>/`; rsync each into its docroot, one `server`/`host` block per hostname.
DNS: CNAME per subdomain, A/ALIAS for the apex. Day-X checklist, redirect rules and rollback
(`PUBLIC_HOSTS_MODE=alias`, one build) are in `docs/06-deploy.md`.

## 10. Environment variables

| Variable            | Default                  | Used by                                                    |
| ------------------- | ------------------------ | ---------------------------------------------------------- |
| `SITE`              | `https://sofexpo.org/`   | `astro.config.mjs` → canonical, OG, JSON-LD, sitemap, RSS   |
| `PUBLIC_HOSTS_MODE` | `alias`                  | app + build scripts; `alias` \| `subdomain`                 |
| `SITE_URL`          | `https://sofexpo.org`    | `scripts/seo-audit.mjs`                                     |

## 11. Still owed by the client (nothing here blocks a deploy)

- **Photography.** `public/images/*.jpg` are placeholders with fixed filenames — replacing them
  1:1 needs no code change. The shot list is `docs/07-design-review.md` §4.
- **PDFs.** All 21 files in `public/files/` are placeholders so no link 404s; drop the real
  documents in with the same names.
- **Brand assets.** FOODERA's palette was read off a raster badge; the other four shows need
  their vector logos (`public/brand/<id>/logo.*`) and colours confirmed in `brand-map.json`.
- **Locale `uz`.** The i18n layer is ready for it; it stays off until Uzbek copy has an editor
  (`docs/02` §3).
- **Verification flags.** Anything unconfirmed is marked `needsVerification: true` in
  `src/data/site.ts` (venue coordinates, opening hours) — grep for it before launch.

## 12. Documentation

| Document                                                       | Contents                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| [docs/01-architecture.md](docs/01-architecture.md)             | Decisions and rationale, layout, data flow, build pipeline, perf budget |
| [docs/02-semantic-core.md](docs/02-semantic-core.md)           | SEO contract: entity graph, head tags, title/description budgets, indexation policy |
| [docs/03-link-map.md](docs/03-link-map.md)                     | Full site tree, anchors, inbound-link rules, ≤ 3 clicks rule      |
| [docs/04-design-system.md](docs/04-design-system.md)           | Tokens, layout primitives, components, breakpoints, accessibility |
| [docs/05-subdomains.md](docs/05-subdomains.md)                 | Host topology, ownership matrix, 7 cross-host linking rules       |
| [docs/06-deploy.md](docs/06-deploy.md)                         | Cloudflare Pages / nginx / DNS, day-X checklist, rollback         |
| [docs/07-design-review.md](docs/07-design-review.md)           | The 2026-09-18 design review: what was wrong and what changed     |
| [docs/08-ui-audit-top3.md](docs/08-ui-audit-top3.md)           | The 2026-09-21 UI audit against the "top-3 in the CIS" goal       |
| [public/files/README.md](public/files/README.md)               | Note on the placeholder PDFs                                      |

Conventions worth keeping: never edit `dist/` by hand (change `src/` and rebuild); never
hand-write an internal href (`localize()` or nothing); put every hostname in
`src/data/host-map.json`, never inline in a component; `npm run check` must be green before a
deploy.

---

Proprietary project of ООО «RESOF EXPO» (Resof Expo LLC), Samarkand. No open-source licence is
granted. Contacts: +998 55 705 0 705 · +998 88 399 07 05 · info@sofexpo.uz · `t.me/sofexpo`
