# Premium UI and Chinese / Turkish editions

Updated: 2026-09-23.

## Delivered

- Photo-led premium home, featured exhibition, clear primary actions, exhibition cards,
  warm paper/evergreen/brass tokens and shared interior-page styling.
- Four-language native-name dropdown, active-language state, same-page links preserving
  query strings and anchors, mobile search, Escape handling and keyboard focus containment.
- Turkish Latin Extended font subsets, local CJK fallback stacks, reduced-motion support.
- `/zh/` (Simplified Chinese, `zh-CN`, `zh_CN`) and `/tr/` (Turkish, `tr`, `tr_TR`).
- **75 HTML pages per language** in a single-host build, including every news/article body,
  exhibition cluster, venue/service/legal page, search UI, lead form and its messages.
- Localized RSS and `/[locale]/search/index.json`, canonical/Open Graph/JSON-LD metadata,
  reciprocal four-language hreflang and sitemap entries. The shared 404 offers all four languages.
- The same editions are emitted on all six hosts in subdomain mode. Ownership, redirects,
  editorial links and the noindex archive policy are retained.
- An unconfigured lead endpoint no longer reports a successful submission: it explicitly
  asks the visitor to send the request by email. Configure `PUBLIC_LEAD_ENDPOINT` for delivery.

## How localization works

The existing site has two large, independently authored editorial sources, RU and EN.
Rewriting every legacy ternary would duplicate the page/host logic and invite omissions.
Instead, the two additional editions use an **offline, static semantic localization boundary**:

1. `src/i18n/config.ts`: `locales` / `Locale` are the four public languages;
   `sourceLocales` / `SourceLocale` are the two editorial render sources.
2. Astro renders the existing source pages normally.
3. `scripts/localization.mjs` walks semantic HTML text, accessible labels, metadata,
   JSON-LD, search data and inline client messages using HTML/JavaScript parsers.
   It preserves markup, selectors, IDs, payload keys, event names, external URLs and file paths.
4. `scripts/localized-editions.mjs`, an Astro build integration after the sitemap integration,
   materializes ZH/TR HTML, RSS and JSON before the existing noindex sitemap pruning step.
5. A pre-routing Vite middleware rewrites development requests to the EN source route
   and passes the requested locale through Astro request locals. `src/middleware.ts` then
   applies exactly the same localization renderer. Production remains ordinary static files: **no browser translation, network
   service, model download or English-to-localized content flash**.

`src/i18n/ui.ts` also exposes complete RU/EN/ZH/TR UI dictionaries to new components.

### Translation files

- `src/i18n/catalogs/zh.json` and `tr.json`: machine-assisted editorial translation catalogs,
  keyed by normalized source text. They cover the full website, including full article bodies.
- `src/i18n/reviewed.json`: manually edited bilingual corrections and preferred terminology,
  especially navigation, home copy, booking controls, names and key descriptions.
  Values are always `[Chinese, Turkish]` and take precedence over the base catalogs.
- Dates, month labels, live countdowns and brand names are handled deterministically rather
  than entrusted to machine translation. All dates use the original source values.

The catalogs are checked in. No translation models, research downloads, Python packages,
credentials, or third-party translation requests are needed for a normal build.

**Editorial release note:** coverage is complete, but the long-form translations are
machine-assisted, not a certified native-language or legal review. A Chinese and Turkish
editor should review the long-form, technical and legal copy before a production release.
**Download blocker:** the 21 repository PDFs are English placeholders, not final documents.
Their download lists now explicitly identify them as samples in all four languages.
Real originals are needed before PDF translation can begin. See
[Download publication readiness](10-download-readiness.md) for the inventory and release gate.
Text embedded in photographs remains in its original language.

## Updating copy

A missing translation fails the normal build (and dev rendering) instead of silently
publishing an English or legacy Russian paragraph under a Chinese/Turkish URL.

```sh
# Render the editorial sources for catalog maintenance only (not a deployable build).
I18N_EXTRACT=1 npm run build
npm run i18n:extract
# New source strings are listed in ignored .cache/translation-source.json.
# Add approved translations to both catalogs or to reviewed.json.
npm run check
```

For host-specific additions, collect every host's English source too:

```sh
I18N_EXTRACT=1 node scripts/build-hosts.mjs --mode subdomain --no-audit
node scripts/extract-translations.mjs dist/en dist-hosts
# Update translations, then run the normal, strict build:
npm run check:hosts
```

Keep dates, prices and factual claims in the source data; do not introduce new facts in
translations. Protected proper names/acronyms may legitimately remain Latin-script.

## Verification

```sh
npm ci
npm run check       # static build, 4-language SEO/link audit, integrity/download audits, 14 test groups
npm run check:hosts # all host builds, per-host SEO and cross-host links
npx playwright install chromium
npm run test:e2e    # 16 browser tests: 4 locales, responsive layouts, menus, tables, forms, no-JS
```

The browser suite supports `BASE_URL` for a running preview and
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for a preinstalled Chromium binary.
Tests cover calendar values, missing-copy failures, script/selector integrity, structured
metadata, full page parity, residual Russian copy, query/hash preservation, mobile Escape/focus, translated form
validation, honest no-endpoint behavior, search results, the JSON search index and multilingual
sample-document notices.

Verification performed: all fourteen localization/content-quality test groups, all sixteen browser tests, all
six host SEO audits and the cross-host link check pass. The root build has 302 HTML files
(75 × 4 locales, plus root redirect and shared 404) and 284 indexable sitemap entries.

`tsc --noEmit` is not the project's acceptance gate: existing authored block typings
(`BlockItem`, `eventName`, file kinds and Astro module declarations) still produce errors.
The pre-existing `sharp` dependency also has an npm audit advisory requiring a separate
version upgrade. Neither is represented as fixed by this UI/localization change.

## Follow-up content-quality pass

- Added over 300 bilingual corrections, including 181 recurring headings, exhibition
  terminology, stand packages, transport information and sensitive quantities/currencies.
- Countdown descriptors now pass through the strict translator rather than leaving an
  English prefix next to a translated day count. Unknown descriptors fail the build.
- Preparation deadlines (`days ahead`, `days out`, `days after`) and numbered programme
  days use deterministic rules. Their direction and quantity are covered by regression tests.
- `npm run audit:translations` checks **effective** translations (manual corrections and
  dynamic rules included) for repetition, replacement glyphs and implausible expansion.
  These heuristics detect corruption; they do not prove semantic accuracy or native fluency.
- Added regression checks for billion/million scale, UZS versus USD, amps/volts/kilowatts,
  brand names and exhibition terminology. Source factual claims were not independently verified.
- `npm run audit:downloads` and `npm run check:release` make the missing final PDFs explicit.
  The normal check passes with disclosed samples; the release check intentionally does not.

## Responsive interior-page pass

- Audited all 150 Chinese/Turkish HTML routes at a 320px viewport, plus four-language
  home/header layouts at 768, 1241, 1280 and 1440px. Fixed three overflowing Turkish
  article tables, two long hero chips and the Russian header near its desktop breakpoint.
- Markdown tables are wrapped at render time by `src/lib/scrollableTables.mjs`;
  authored block tables use `TableScroll.astro`. Both retain real table semantics,
  captions, headers and links. Scroll hints and accessible names are localized.
- Tables work with touch and keyboard, even without JavaScript. A ResizeObserver
  removes unnecessary tab stops and hides hints when all columns fit; nothing is clipped
  with a global `overflow-x: hidden` workaround.
- Article contents support the actual Markdown heading levels, including subheadings
  when an article has only one main heading. The two-column layout is enabled only
  when a contents panel exists, avoiding the previous 232px-wide desktop article body.
- The compact header is used through 1280px. Resizing to desktop releases the mobile
  focus/scroll lock. Desktop dropdowns support ArrowDown and Escape, including dismissing
  hover-open menus without moving unrelated keyboard focus.
- Event navigation reveals its active section horizontally without jumping past the hero.
  Section links have 44px minimum touch targets and a visible horizontal scroll indicator.
- Regression coverage includes interior pages at 320/768px, desktop reading width,
  contents anchors beneath the sticky header, no-JS tables, table keyboard scrolling,
  overflow-hint removal on resize, menu dismissal and active event navigation.

Development watch exclusions cover the QA output directories themselves as well as their
contents, so Playwright cleaning `test-results/` does not trigger a mid-test page reload.
