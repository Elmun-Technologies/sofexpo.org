# 12 · Widgets, partners and colour harmony — 2026-09-24

Buyurtmachi (client) feedback: the left-side Telegram/WhatsApp widget and the popups were
“hurting the eyes”, popups looked unprofessional, several sections had photos that did not
match their content, colour harmony was off, and the site needs partner logos per exhibition
and for SOF EXPO in general. This document records what changed and where to re-enable anything
later.

## 1. Floating widgets & popups — removed

The eye-catching floating chrome is gone from every page and locale:

| Component | Before | After |
| --- | --- | --- |
| `FloatingContacts` (desktop left rail + mobile TG/WA/phone bar) | always visible | **removed** from `src/layouts/Base.astro` |
| `LiveChat` (bottom-right chat bubble with a fake “manager types…” panel) | always visible | **removed** from `Base.astro` |
| `PopupSystem` (welcome quiz, exit-intent, scroll-50%, pricing, form-abandon, TG/WA hold) | timer/scroll-triggered | **removed** from `Base.astro` |

What stays, deliberately (it is part of the page, not floating chrome):

- **Sticky CTA bar** (`StickyCtaBar`) — one booking action that appears after scrolling, hidden
  when a form is on screen. It is the sanctioned “contact hold” now.
- **Stand quiz modal** (`StandQuizModal`) — opened by any explicit `data-quiz-open` CTA.
- **Inline conversions** (`SmartCta`, auto form on `Blocks`, hero/footer CTA bands).

### How to re-enable (if the client re-approves the widgets later)

1. `src/data/conversion.ts` — flip `liveChat.enabled` and each `popups.strategies[].enabled`
   back to `true`. They are now all `false`; the popup screenshots' hardcoded
   `event-*-640.webp` refs also stay in that file and would need proper `<Photo>` rungs.
2. `src/layouts/Base.astro` — add `<LiveChat />`, `<PopupSystem … />`, `<FloatingContacts … />`
   back into the body (imports were removed).
3. `src/components/conversion/StickyCtaBar.astro` no longer observes the removed `#fc-mob` bar —
   reconnect that offset if the mobile bar returns.

The widgets are not deleted, only unplugged, so nothing is lost.

## 2. Partner logos — new `PartnerLogoWall`

New data-driven component `src/components/PartnerLogoWall.astro` + `src/lib/partners.ts`.

- **One source.** `src/lib/partners.ts` lists every partner: shared SOF EXPO partners
  (`show: 'site'`) and per-show partners (`show: 'event'`, `event` = slug from `events.ts`).
- **Where it renders.**
  - Home (`/`): the shared SOF EXPO set, after the news section.
  - Every exhibition overview (`/events/<slug>/`): that show's organizers / co-organizers.
  - `/about/partners/`: full shared set via a new `partners` block type
    (`src/data/pages/types.ts`, `Blocks.astro`).
- **Drop-in logos.** The client sends the real logos; save each as
  `public/images/partners/<id>.svg` (or `.png`) and the wall shows it 1:1 — no code change.
  Until then tiles render a restrained monogram on paper, so the relationship is visible and the
  layout is already final. `hasLogo: true` marks the few real files already referenced
  (e.g. the Uzbekistan Sellers Association).
- **Design rule.** The strip is monochrome (ink → colour only on hover). A wall of full-colour
  vendor logos fights the exhibition identity (docs/04); colour stays reserved for the mark.

All placeholder names/roles are **marked for verification** — the client confirms the exact
partner list and logo files (docs/08 §7 Q4).

## 3. Colour harmony rework

- `--accent` / `--gold` deepened from `#c8882c` to `#b07a24` in both token sets
  (`global.css`, `premium.css`): the old mid-brass flattened to a sand tone against both
  evergreen (hero) and paper, i.e. the “gold on gold” problem. Button hover states
  (`#edc785` → `#c5903a`) and the lead-form selected channel accent followed.
- `--gold-soft` stays light (`#e7d5ae` / `#e5c88d`) because it is text/accents **on dark** —
  it must not darken.
- Monogram/logo-name initials in the new wall are `translate="no"` so the i18n pass never
  treats “RE” (RESOF EXPO) as a translatable phrase.

## 4. Wrong / missing photos

- `/events/world-edu-expo/` overview card used `event-ecom.jpg` (an e-commerce render) — fixed
  to the show's own imagery.
- `EventPage`/popups referenced `event-buildpro-640.webp` / `event-ecom-640.webp` as raw paths
  that the `<Photo>` pipeline never produced (the rungs are per-name). The remaining refs live
  only in the now-removed `PopupSystem` and `CatalogForm`; `CatalogForm` was switched to a
  proper `<Photo>`-built asset.

## 5. Verification

`npm run check` is green after this change:

- build: 152 pages + 231 localized ZH/TR/UZ editions, sitemap pruned;
- `seo-audit` — 0 problems (377 pages, 399 internal targets);
- `page-audit` — 300 pages, every page has its own title/description/h1/card, no copy-pasted
  paragraphs;
- `audit:translations` — 3514 source strings × 2 languages, 0 issues;
- `npm test` — 28/28.

New copy went through the strict i18n boundary: partner-wall strings are in
`src/i18n/reviewed.json` (ZH/TR) and `src/i18n/catalogs/uz.json` (UZ), plus two deterministic
rules in `scripts/localization.mjs` (`… is held with support from`, `N organizations`).
