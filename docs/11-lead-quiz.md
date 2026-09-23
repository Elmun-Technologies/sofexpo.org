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
page, ts}`; without an endpoint the lead lands in `localStorage["sofexpo.leads"]`.

## CRM fan-out: `scripts/lead-webhook.mjs`

A zero-dependency Node process that is `PUBLIC_LEAD_ENDPOINT`. It validates,
rate-limits (10/min/IP), appends to `.cache/leads.jsonl` (durable first), then sends a
readable message to Telegram:

```
TELEGRAM_BOT_TOKEN=… TELEGRAM_CHAT_ID=… npm run lead-webhook   # :8787
LEAD_WEBHOOK_ORIGIN=https://sofexpo.org LEAD_WEBHOOK_SECRET=…   # optional hardening
```

Telegram down ⇒ `502` ⇒ the form shows its email fallback; the JSONL store still has
the lead. `formatLead()` is exported and unit-tested.

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
