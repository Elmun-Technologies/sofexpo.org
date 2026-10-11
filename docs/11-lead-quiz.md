# 11 — Lead quiz (rush-agency.ru pattern, adapted)

The conversion mechanics behind rush-agency.ru's top SEO performance, absorbed into
the centre's own design system. The quiz is not a gimmick form: it is a strict funnel
that postpones typing until the visitor has already invested three answers.

## Anatomy

`src/components/QuizForm.astro` renders a 4-step funnel (3 in focused mode):

| Step | Question | Source of options |
| ---- | -------- | ----------------- |
| 1    | Which exhibition fits your business? | the current line-up from `src/data/events.ts`, plus the “help me choose” escape option |
| 2    | Main goal? | sales / export / brand / dealers / other (`quiz.goal.*`) |
| 3    | How much space? | the area ladder, ending in “not sure yet” |
| 4    | Contact | name, company, phone (code select + number), email, call/Telegram channel, comment |

Mechanics worth keeping if this is ever redesigned:

- **tap-only steps auto-advance** — one `click`/`change` on a choice moves forward;
  re-clicking an already-selected option also advances (that is the dead-end a plain
  `change` listener misses after a Back);
- **contact last, one promise line** (“we reply within 30 minutes”) next to the phone;
- **success state confirms the selection** (`quiz__summary`) instead of a bare “ok”;
- without JavaScript every step renders visible — the quiz degrades to one long form.

`StandQuizModal.astro` mounts a native `<dialog>` with the quiz in `Base.astro`.
Any CTA with `data-quiz-open` (header “Book a stand”, CtaBand/callout/hero actions
whose href is `/request-stand/`) opens it; the href stays as the no-JS fallback.

### Context focus

Rush's key trick: the funnel already knows what page you are on. On event pages the
header CTA carries `data-quiz-event="<brand>"` (looked up from `events.ts` by the
current path in `Header.astro`). Opening the dialog dispatches `quiz:focus` — the
modal quiz collapses its show question into a hidden field and continues as the
three-step funnel, with the “Step N of 3” label set. Both label sets ship
server-rendered, so no translation is computed in the client.

## Funnel telemetry

The quiz pushes `window.dataLayer` events — invisible until a GA4/Yandex Metrika
container is added, then the funnel appears without touching the components:

| event         | when                      | fields                             |
| ------------- | ------------------------- | ---------------------------------- |
| `quiz_open`   | a `[data-quiz-open]` CTA  | `context`: show brand or `general`, `src`     |
| `quiz_start`  | first advance from step 1 | `step`, `total`                    |
| `quiz_step`   | every forward/back move   | `step`, `total`, `back?`           |
| `quiz_submit` | successful submit         | `show`, `goal`, `area`, `channel`, `src`      |

## Authoring

Pages compose it like any other block:

```ts
{ type: "quiz", title: "…", text: "…", event: "FOODERA EXPO 2026", areas: ["9 м²", …] }
```

- without `event` the quiz asks the show question (4 steps, options from `events.ts`);
- with `event` the show collapses into a hidden field — a focused 3-step funnel for
  event pages (used by every `/events/<show>/exhibitors/` page);
- `shows` overrides the option list explicitly; `areas` overrides the area ladder;
- keep the plain `form` block below the quiz (both conversion paths stay available).

## Payload contract

Identical storage to `LeadForm`: `PUBLIC_LEAD_ENDPOINT` (build-time env) receives
`POST {name, company, phone, email, event, goal, area, channel, comment, quiz:"stand",
page, ts, src?, landing?, referrer?, utm_*?}`; without an endpoint the lead lands in
`localStorage["sofexpo.leads"]`.

### Where the attribution comes from

- **`src`** — which CTA opened the funnel: every `[data-quiz-open]` trigger carries a
  `data-quiz-source` label (`header`, `menu`, `cta-band`, `hero`, `callout`,
  `cta-inline`); unlabeled triggers fall back to `dialog`. Stored on the quiz root at
  open time and reported both in the payload and in `quiz_open`.
- **`landing`, `referrer`, `utm_*`** — captured once per session at first page view
  (`sessionStorage["sofexpo.leadctx"]`, written by the modal script), so a visitor who
  lands on a blog post with a UTM tag and submits the quiz three pages later still
  carries the campaign. Current-URL UTM wins over the stored set.
- The webhook (`formatLead`) renders `📍 Источник`, `🏷 UTM` and `🚪 Лендинг` lines
  when present; a legacy `LeadForm` payload simply omits them.

## CRM fan-out: `scripts/lead-webhook.mjs`

The zero-dependency Node process is both `PUBLIC_LEAD_ENDPOINT` and the first-party
analytics receiver. It validates/rate-limits (10 leads/min/IP), writes a SQLite
transaction (`.data/sofexpo.sqlite`), inserts one durable outbox item per configured
provider, then returns `202` only after the lead is saved. Telegram/CRM delivery retries
with exponential backoff; provider downtime never loses the lead. The admin inbox at
`/admin` can search, assign, change status, add internal notes and export CSV.

```bash
cp .env.example .env            # set ADMIN_EMAIL + a unique ADMIN_PASSWORD (12+ chars)
npm run lead-webhook            # API/admin on :8787
npm run dev                     # public site on :4321, second terminal
```

Configure `PUBLIC_LEAD_ENDPOINT=http://localhost:8787/lead` and
`PUBLIC_ANALYTICS_ENDPOINT=http://localhost:8787/event` for local use. In production,
point them at the API host and allow-list every public site origin in
`LEAD_WEBHOOK_ORIGINS`. Details, table schema, retry algorithm, roles and deploy steps:
[docs/17-backend-admin.md](17-backend-admin.md). `formatLead()` remains exported and tested.

## Localization rules

All copy lives in `src/i18n/ui.ts` (`quiz.*`); the inline scripts contain no
human-readable literals, so the strict zh/tr editions stay deterministic. New EN quiz
strings must be added to both catalogs (docs/09 workflow). Measurement strings
(`18 m²`) and brand names are protected terms.

## Tests

- `tests/quiz.test.mjs` — UI keys in both source locales, catalog coverage, payload contract;
- `tests/quiz-dom.test.mjs` — jsdom against the **built** HTML: en funnel, focused
  3-step mode, zh strict output, dialog open/close, no-JS contract;
- `tests/browser/quiz.spec.ts` — Playwright version of the same for CI with browsers.
