# 02 · Semantic core (SEO contract)

Goal: top-3 for the money queries in both languages — «выставочный центр Самарканд»,
«FOODERA EXPO», «забронировать стенд Самарканд», "exhibition centre Samarkand",
"trade show Uzbekistan". Nothing here is decoration: every tag below is asserted by
`npm run audit:seo`, which must exit 0 before a deploy.

## 1. Entity spine

Three permanent nodes are emitted on **every** indexable page (`Base.astro` builds one
`@graph`, deduplicated by `@id`, so richer home-page nodes win):

| `@id` | Type | Role |
| --- | --- | --- |
| `https://sofexpo.org/#website` | `WebSite` | the site itself; `publisher` → `#organization`; `inLanguage: [ru, en]` |
| `https://sofexpo.org/#organization` | `Organization` | ООО «RESOF EXPO» — legal name, phone, e-mail, address, `sameAs` (IG/FB/TG), `subOrganization` → `#venue` |
| `https://sofexpo.org/#venue` | `ExhibitionCenter` | the physical centre: geo, `hasMap`, `areaServed`, `amenityFeature` (4 400 m², 5 000 m², 700 kW, Wi-Fi, parking, 350 café seats) |

`WebPage` on each page carries `isPartOf: #website` and `breadcrumb: #breadcrumbs`, so the
page nodes join the same entity graph instead of floating free.

Per-page-type nodes (counts from the current build, 152 pages):

| Node | Emitted on | Pages |
| --- | --- | --- |
| `BreadcrumbList` (`#breadcrumbs`) | every page with ≥1 crumb | 144 |
| `ExhibitionEvent` (`#event`) | 4 pages of each of 6 events | 48 |
| `Article` (`#article`) | news + article detail pages | 20 |
| `FAQPage` (`#faq`) | pages that author an FAQ block | 8 |
| `ItemList` (`#list`) | events index, past archive, news, articles, home | 10 |
| `WebSite` + `SearchAction` (root) | home only (`rootJsonLd`) | 2 |

Event nodes are truthful about state: `eventStatus` flips to `EventCompleted` once
`dates.end` has passed, `eventAttendanceMode` is `OnSiteEventAttendanceMode` (no online
broadcast is promised anywhere), and there is **no** `offers` node — we do not publish
stand or ticket prices in markup that could not be matched on the page.

## 2. Head contract

```html
<html lang="ru">                                   <!-- localeMeta[locale].html -->
<title>FOODERA EXPO 2026 — выставка продуктов и напитков, Самарканд</title>
<meta name="description" content="…">              <!-- authored per page, per locale -->
<link rel="canonical" href="https://sofexpo.org/ru/events/foodera-expo/">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="alternate" hreflang="ru"  href="…/ru/events/foodera-expo/">
<link rel="alternate" hreflang="en"  href="…/en/events/foodera-expo/">
<link rel="alternate" hreflang="x-default" href="…/en/events/foodera-expo/">
<link rel="alternate" type="application/rss+xml" href="/ru/rss.xml">
<meta property="og:type" content="website">        <!-- article: on editorial pages -->
<meta property="og:locale" content="ru_RU">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:image" content="https://sofexpo.org/images/event-foodera.jpg">
<meta property="og:image:width|height|alt" …>      <!-- 1200×630, alt = page title -->
<meta name="twitter:card" content="summary_large_image">
<link rel="icon|apple-touch-icon|manifest|sitemap" …>
<script type="application/ld+json">{ "@graph": [...] }</script>
```

`localize()` always appends the trailing slash, so `canonical`, `hreflang` and every
internal `href` share one spelling. `x-default` points at the EN twin (never at `/`, except
for `/` itself, which is its own x-default).

## 3. Title and description budgets

| Family | Title | Description | Rule |
| --- | --- | --- | --- |
| Venue / exhibitors / visitors / organizers / about / contacts | ≤ 78 chars | ≤ 185 chars | keyword first, brand second, no `|`-stuffing |
| News & article details | ≤ 96 | ≤ 210 | the headline *is* the SERP line; the brand goes in the site-name slot |
| `noindex` pages (past editions, 404) | free | free | still checked for uniqueness and h1 |

Enforced additionally: exactly one `<h1>` per page; the brand suffix appears once
(the event/archive index pages used to render `SOF EXPO Samarkand — SOF EXPO Samarkand — …`);
no two pages share a title or a description; canonical is absolute.

## 4. Indexation policy

Multi-host builds (`docs/05-subdomains.md`) follow the same contract per host: every hostname
is an independent site with its own `robots.txt`, sitemap, `hreflang` pairs and Search Console
property. A page is emitted on exactly one host; the path an exhibition cluster gave up on the
centre is a `noindex,follow` stub whose `canonical` points across hosts, so equity moves and no
duplicate competes with the live page.

| Route | State | Why |
| --- | --- | --- |
| `/` (gate) | index, `x-default` | owns the brand query; a 301 here would throw that equity away |
| `/ru/**`, `/en/**` | index, mirrored 1:1 | parity is asserted per path by the audit |
| `/events/promotors-show-samarkand/**` | `noindex,follow` | 12–13 Sep 2026 already happened; it is an archive page, not a sales page — it must not compete with the live editions |
| `/404` | `noindex,follow`, excluded from sitemap | — |
| `/search/` | index, but result-free by design | gives crawlers one more entry point; no query params are ever indexed |
| `/legal/**` | index, `nofollow`-free | present for the org's trust signals, deliberately not linked from the nav |

`robots.txt`: `Allow: /` for everything, three `Disallow` rules for tracking parameters
(`?utm_`, `?gclid=`, `?fbclid=`), a Yandex-style `Host:` line, and `Sitemap: …/sitemap-index.xml`.
`/files/` is deliberately **not** disallowed — the PDFs are link-equity targets, not hidden assets.

## 5. Fact policy (the anti-penalty rule)

Every number on the site comes from sofexpo.uz. The working set:

`4 400 m²` indoor · `5 000 m²` open-air · `700 kW` (220/380 V) · conference hall + AV ·
`350` café seats (2 fast-food points) · `16 km` to the airport · `23 km` to the railway
station · `20+` events a year · `70 000+` visitors · Buildpro 2025: `1 600+` visitors,
`80+` exhibitors, `10+` forum sessions · Agropro 2026: `100+` companies, `4 500+`
specialists · FOODERA: `12` F&B categories, `38` premium stands left · market context:
CA F&B `$58–78B`, `125M+` consumers, UZ retail `182 trln UZS (2024)`, UZ agriculture
`>25 bn USD`, `85k+` farms, `4M+ ha`, `468` agro-clusters · prize fund `10/6/4 mln UZS`
(PROMOTORS) · phones `+998 55 705 0 705`, `+998 88 399 07 05`;
e-mail `info@sofexpo.uz`.

Deliberately **absent**, because the source does not state them: stand prices per m²,
hall rental tariffs in figures, attendance forecasts, founding year, awards, staff counts,
UFI/UEF membership claims. Three concrete removals during the last pass: the per-event
`earlyBird` field (invented `−10%` / `−15%` deadlines) was replaced by `highlight` —
one sourced sentence used by the hero and the announcement strip; the invented
`10:00 — 18:00` opening line in the event hero became «N days · Samarkand, Dzhambay
district»; the fake 08:00/22:00 build window in the venue copy was rewritten without times.
Anything still awaiting client confirmation is flagged in data with
`needsVerification: true` (office hours, floor load, ceiling height) — never silent.
**The rule covers editorial copy too**: three unsourced numbers that had slipped into the
long-reads («по данным внутренней статистики…», «12 образцов на одном стенде», «в 1,5–2 раза
выше конверсия») were replaced with qualitative phrasing — «стенд, который работает как
переговорная» instead of a multiplier. A guide may explain how to measure something; it may
not invent the result. `public/files/*.pdf` are named like the real documents and marked
as placeholders in `public/files/README.md`; the FOODERA early-bird discount is not claimed
because the 31 Aug deadline has passed.

## 6. The audit gate

`node scripts/seo-audit.mjs` (alias `npm run audit:seo`) walks `dist/` and fails on:

1. broken internal link (after stripping `<script>` bodies; only real `<a href>` count)
2. a `href` that looks like a file (`/files/`, `/images/`, `/_astro/`) not present on disk
3. `img` without a non-empty `alt`
4. missing / non-absolute / duplicated canonical, `og:title|description|image|url`
5. title or description outside the budgets in §3, empty, or reused on another page
6. zero or multiple `<h1>`
7. `hreflang` trio not resolving (both locales exist and their canonicals point back)
8. ru↔en sibling parity: a path present in one locale only
9. JSON-LD that does not parse, or an `@id` reference with no node
10. orphan page (indexable, zero inbound internal links)
11. `robots.txt`, `sitemap-index.xml`, `sitemap-0.xml`, `llms.txt`, `site.webmanifest`,
    `favicon.svg`, `og/default.jpg` missing from `dist`
12. sitemap honesty: a `<loc>` with no built page, a duplicated `<loc>`, an indexable page
    missing from the sitemap, or a `noindex` page still listed in it
13. every `<img src>` and `og:image` resolving to a real file in `dist/` — added after the
    editorial rail shipped `/images/no-image.jpg`, a file that only existed in the author's head

Current state: **152 pages (75 RU / 75 EN + gate + 404), 173 distinct internal targets,
0 findings.** Run `npm run check` (= build + this audit) before any commit.

## 7. Feeds and discovery

- `sitemap-index.xml` → `sitemap-0.xml`, one `<url>` per indexable page with `<xhtml:link>`
  alternates (ru/en/x-default) and `<lastmod>` pinned by the config `serialize` hook.
  `@astrojs/sitemap` only filters `/404`; the 8 `noindex` event-archive URLs are removed by
  `scripts/prune-sitemap.mjs`, which runs as part of `npm run build` and reads the robots meta
  out of the built HTML, so the sitemap can never disagree with the pages.
- `/ru/rss.xml`, `/en/rss.xml` — RSS 2.0 of news (title, link, guid, pubDate, description),
  linked from every page head and from the news index.
- `/ru/search/index.json` + `/{locale}/search/` — client-side search over the same index;
  the endpoint is emitted at build, so search quality can never drift from the pages.
- `llms.txt` — venue facts, the six events with dates, contacts and the page inventory, in
  the format assistants fetch before crawling.

## 8. Post-launch checklist (10 minutes, once)

1. Search Console: verify the domain, submit `sitemap-index.xml`, request indexing for
   `/`, `/ru/events/`, `/ru/exhibitors/`, `/ru/venue/` and the EN twins.
2. Validate one event page and one article in the Rich Results test (expect
   `ExhibitionEvent` + `BreadcrumbList`) and in the Schema.org validator (expect 0 warnings
   on the `@graph`).
3. `curl -sI https://sofexpo.org/ru/about` → confirm the host (not the app) canonicalises to
   `/ru/about/`; if it 404s folder-less URLs, add the trailing-slash rewrite.
4. Replace `public/files/*.pdf` with the real documents (same names), rerun
   `npm run build && npm run audit:seo`.
5. After the first backlink (ticketon.uz, Sellers Association, regional administration page),
   re-run the audit only if new pages are added — the gate catches the link structure,
   not the off-page work.
