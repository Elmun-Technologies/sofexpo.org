# 04 · Design system

Reference: ohtapark.ru — "everything visible, no wasted words". Translated into rules:
photo first, one idea per block, numbers instead of adjectives, no gradients, no glass, no
decorative animation. One CSS file, one breakpoint ladder, no utility framework.

## 1. Tokens (`src/styles/global.css`, `:root`)

### Palette

Пересмотр 2026-09-18: тёплая «крем + золото + мята» палитра была главным признаком
AI-происхождения (тот же грэй, что и на рендерах) и давала мягкость без структуры. Сейчас —
бумага и графит, один тёмно-зелёный, ноль пастели.

| Токен                    | Значение                      | Где                                                                                                                          |
| ------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--paper`                | `#ffffff`                     | фон карточек, секции `.sec--paper`                                                                                           |
| `--cream`                | `#f4f5f3`                     | фон страницы; бывшие имена токенов сохранены, чтобы 14 использований поменялись разом                                        |
| `--cream-2`              | `#ebeeec`                     | `.sec--sand`, `.card--sand` — «вторая страница»                                                                              |
| `--ink`                  | `#0e1411`                     | текст, первичная кнопка, верхняя линейка `.stat`                                                                             |
| `--ink-60`               | `#4b5350`                     | вторичный текст, `.kicker`, `.mono-label`                                                                                    |
| `--ink-40`               | `#6f7773`                     | только крупное/служебное; на `--cream` даёт 4.2:1 — поэтому мелкие подписи переехали на `--ink-60`                           |
| `--line`                 | `#dde1dd`                     | 1px разделители (раньше был `rgba(ink,.14)` — полупрозрачные, «нечёткие» линии)                                              |
| `--line-strong`          | `#b6bdb7`                     | границы таблиц, hover-обводка                                                                                                |
| `--evergreen` / `-2`     | `#0f2b1c` / `#16412a`         | шапка, футер, тёмные секции, первичная кнопка                                                                                |
| `--moss`                 | `#1b6b40`                     | ссылки на светлом, статус «идёт набор» (белый на moss = 7.8:1)                                                               |
| `--sage`                 | `#dfe8e0`                     | чипы на тёмном, зебра таблиц                                                                                                 |
| `--gold` / `--gold-soft` | `#0f2b1c` / `#cfe0d4`         | **декоративного золота в UI больше нет**; имена оставлены, значения стали брендовыми, чтобы 18 использований не переписывать |
| `--danger`               | `#a33518`                     | ошибки формы, «осталось N дней»                                                                                              |
| `--ph-filter`            | `grayscale(1) contrast(1.06)` | единственная строка, которую нужно удалить, когда придут настоящие фото                                                      |

### Type

Дисплейный **Unbounded** (широкий geometric с «криптовалютной» plastic-подачей) и мягкий
**Onest** убраны. Теперь:

| Роль                | Шрифт                                                 | Почему                                                                                                                           |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| заголовки           | `Inter Tight Variable` 750, `letter-spacing: -.028em` | узкий гротеск, держит RU и EN одинаково; у Archivo (который хотелось) нет кириллического сабсета — проверено в пакете fontsource |
| текст               | `Golos Text Variable` (Paratype)                      | нейтральный, «инженерный», табличные цифры, родная кириллица                                                                     |
| лейблы, числа, даты | `JetBrains Mono Variable`                             | всё, что является фактом, а не прозой, набрано моно — это и есть «аніқ»                                                          |

| Токен                          | Значение                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `--t-hero`                     | `clamp(2.05rem, 1.28rem + 2.7vw, 3.4rem)` (было до 5.2rem — плакатность ушла) |
| `--t-h2` / `--t-h3` / `--t-h4` | `2.1 / 1.34 / 1.03rem` максимумы; шаг масштаба сделан заметным                |
| `--t-body`                     | `0.985rem / 1.62`                                                             |
| `--t-kicker`                   | `0.72rem` mono, uppercase, `letter-spacing: .12em`                            |

### Metrics

`--maxw 1240px` · `--gutter clamp(1rem, .62rem + 1.3vw, 2.2rem)` · `--pad clamp(1.05rem, .8rem +
0.9vw, 1.6rem)` · `--sec clamp(2.7rem, 1.7rem + 3.1vw, 4.7rem)` · `--header-h 72px`.

Радиусы: **`--r-sm 2px`, `--r 3px`, `--r-lg 4px`, `--r-pill 2px`** — то есть «pill» больше не
pill, все 11 капсул стали прямоугольниками без единой правки селектора. Тени: `--shadow` и
`--shadow-soft` = `none`; в CSS остались только два `box-shadow` фокус-ринга
(`:focus-visible`) — это доступность, не декор. Разделение — hairline-линией или 2px-верхней
линейкой (`.stat`), не тенью и не подъёмом: hover у карточки меняет цвет рамки, у
`.ev__img img` снимает обесцвечивание.

## 2. Layout primitives

| Class                                                              | Contract                                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `.wrap` / `.wrap--narrow`                                          | full-bleed section → centred measure; gutter from the token            |
| `.sec`, `.sec--paper`, `.sec--sand`, `.sec--forest`, `.sec--tight` | vertical rhythm + one of three grounds                                 |
| `.grid` + `.g2 .g3 .g4 .g-sidebar`                                 | every grid on the site; `.g-sidebar` = content + 340 px rail           |
| `.stack`, `.row`, `.btn-row`, `.pill-row`                          | gaps without wrappers                                                  |
| `.kicker`, `.mono-label`, `.lead`, `.muted`, `.small`, `.center`   | typography utilities only                                              |
| `.chip`, `.chip--gold`, `.chip--live`, `.dot`                      | status: dates, live countdown, "38 stands left"                        |
| `.btn`, `.btn--gold`, `.btn--ghost`, `.btn--light`, `.btn--sm`     | exactly four button looks                                              |
| `.card`, `.card--flat`, `.card--sand`, `.tile`                     | the only containers; `.card--flat` has no shadow                       |
| `.table`, `.table--rates`                                          | specs and rate cards; `<th scope="col                                  | row">` always present |
| `.hairline`, `.num`, `.ico-tile`, `.ico`, `.ico--lg`               | separators, index numbers, icon squares                                |
| `.sr-only`, `.skip`                                                | a11y scaffolding; `.skip` is the first focusable element on every page |

Sticky geometry: the utility topbar scrolls away, `.hdr__in` sticks at `top: 0` and is exactly
`--header-h` tall, so `scroll-padding-top`, the mobile menu overlay and the `.evnav` rail
(`top: var(--header-h)`, `z-index: 30`) all share one number. `.hdr__in::before` stretches the
frosted background to the viewport edges while `.hdr__in` itself stays inside `.wrap`.

Header nav items carry a descriptive sub-line (`note: {ru, en}` on every `nav` child, rendered
as `.mega a small` in a two-column grid) — keyword context in the navigation instead of a
repeated section name.

Breakpoints are a fixed ladder, mobile-first via `clamp()` so most components need no query:
`1180 · 1080 · 980 · 780 · 680 · 620 (min-width)` — plus `prefers-reduced-motion: reduce` (kills every animation and transition, restores
`scroll-behavior: auto`) and `@media print`, which drops the header, footer, topbar and buttons
so a spec page prints as a clean sheet.

## 3. Components (`src/components/`)

| Component                                                | Props                                                                                                                       | Notes                                                                                                                                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Base.astro` (layout)                                    | `locale, path, title, description, image?, type?, publishedTime?, modifiedTime?, jsonLd?, noindex?, preload?, breadcrumbs?` | the whole head contract + JSON-LD graph + Header/Footer; nothing else may touch `<head>`                                                                                               |
| `Blocks.astro`                                           | `blocks: Block[], locale`                                                                                                   | the only content renderer; owns `H()` (locale-prefixing helper)                                                                                                                        |
| `PromoBar.astro`                                         | `locale, hideFor?`                                                                                                          | announcement strip above the header; data-driven from `nextEvent()`, self-hides when the edition is on its own page or nothing is upcoming                                             |
| `EventNav.astro`                                         | `locale, event, active, past?`                                                                                              | sticky per-edition rail: 4 cluster pages + 4 hub links + CTA pair; horizontal scroll under 680 px                                                                                      |
| `PageHero.astro`                                         | `kicker, title, lead?, bullets?, image, actions?, side?, locale`                                                            | 3 variants used by authored pages                                                                                                                                                      |
| `EventHero.astro`                                        | `event, kicker, title, lead, variant: 'open' \| 'past'`                                                                     | countdown + ticket CTA, or result band for finished editions                                                                                                                           |
| `SectionHead.astro`                                      | `kicker?, title, level: 1 \| 2 (default 2), text?, align?`                                                                  | `level={1}` exactly once per page                                                                                                                                                      |
| `StatBand.astro`                                         | `items: {value, unit?, ru, en}[]`                                                                                           | the "important facts" band                                                                                                                                                             |
| `FeatureGrid.astro`                                      | `items, cols = 3`                                                                                                           | icon + title + text tiles                                                                                                                                                              |
| `EventCard.astro`                                        | `event, locale, priority?, variant?`                                                                                        | poster + date chip + 1-line caption, `→`                                                                                                                                               |
| `Countdown.astro`                                        | `target, locale, label?`                                                                                                    | 1.5 KB inline, hides itself after the date                                                                                                                                             |
| `CtaBand.astro`                                          | `kicker, title, text, primary?, secondary?, dark = true`                                                                    | the conversion band                                                                                                                                                                    |
| `LeadForm.astro`                                         | `eventName?, directions?, areas?, subtitle?, note?, compact?, id`                                                           | static form: composes a `mailto:` link (no backend) + `form__ok` confirmation state, `role="status"`                                                                                   |
|                                                          |
| `PostCard.astro` / `PostBody.astro` / `PostDetail.astro` | `post, path, locale, variant?, priority?` / `layout: 'prose' \| 'sidebar'`                                                  | editorial cluster; the detail title is the plain headline (no brand suffix). Media is never optional in the markup: `data.hero` → poster of the linked event → `/images/hero-hall.jpg` |
| `EventSections.astro`                                    | `event, section: 'exhibitors' \| 'visitors' \| 'program', tone?`                                                            | per-event data views                                                                                                                                                                   |
| `EventPage.astro`                                        | `event, page, locale`                                                                                                       | composes `hero` + `EventNav` + `before` + sections + `after` + auto editorial rail + `CtaBand` + JSON-LD                                                                               |
| `Header.astro` / `Footer.astro`                          | `locale, path?`                                                                                                             | mega-dropdown nav, topbar actions, 4 footer columns, legal row                                                                                                                         |
| `Icon.astro`                                             | `name, size = 22, label?`                                                                                                   | 113 inline SVG glyphs (24-grid, stroke 1.6); an unknown name falls back to a neutral tile, so a typo never breaks a build                                                              |

Every component keeps its own scoped `<style>` only when its markup is not covered by the
primitives (Blocks, Header, LeadForm, PostCard/Detail, EventHero/Sections, FeatureGrid,
CtaBand, EventCard); everything else is global CSS.

## 4. Block contract (`src/data/pages/types.ts`)

A page is `blocks: { ru: Block[], en: Block[] }` — the arrays are index-aligned, so a
translation cannot silently shift the layout. Common fields on every block: `type`,
`title?`, `kicker?`, `text?`, `tone?: 'paper' | 'sand' | 'forest'`, `width?: 'narrow'`,
`id?: string` (anchor target).

| `type`      | Payload                                                         | Renders as                                                                 |
| ----------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `hero`      | `title, lead, bullets?, image, actions?[], side?`               | full-bleed photo hero with the date/venue rail                             |
| `h2`        | `title, kicker?, text?`                                         | section head (uses `SectionHead`, level 2)                                 |
| `text`      | `text` (HTML allowed), `width`                                  | prose measure                                                              |
| `stats`     | `items: {value, unit?, ru/en}[]`                                | `StatBand`                                                                 |
| `grid`      | `items: {icon?, title, text?, meta?, href?}[]`                  | card grid; `href` makes the whole card a link                              |
| `rows`      | `items: {title, text?}[]`                                       | numbered rows with hairlines                                               |
| `table`     | `head: string[], rows: string[][]`                              | spec / rate table, first column bold                                       |
| `steps`     | `items: {title, text?}[]`                                       | ordered process (1 → n)                                                    |
| `checklist` | `items: {title, text?}[]`                                       | checkmark list (what to bring, what to sign)                               |
| `callout`   | `title, text?, action?: {label, href}`, `tone`                  | bordered note; `--gold` variant for deadlines                              |
| `files`     | `items: {title, href, note?, kind: 'pdf' \| 'link' \| 'video'}` | downloadable documents (PDF icons, size note)                              |
| `gallery`   | `items: {src, alt?, caption?}[]`                                | photo grid; `alt` falls back to `caption` (the audit fails on empty `alt`) |
| `quote`     | `text, cite?`                                                   | pull-quote                                                                 |
| `links`     | `items: {label, href, note?}[]`                                 | cross-navigation block                                                     |
| `form`      | `fields?: …, note?`                                             | `LeadForm` in-page                                                         |
| `faq`       | `items: {q, a}[]`                                               | accordion, mirrored into `FAQPage` JSON-LD by the route                    |
| `cta`       | `kicker?, title, text?, primary?, secondary?`                   | `CtaBand`                                                                  |

Authoring rules: no two adjacent blocks may repeat a type; every page ends with either a
`links` or a `cta` block that points at a money page; `files` items must resolve to a real
file under `public/files/`; `hero` exists only in `PageHero`-equivalent position (first
block), otherwise the page opens with content, not a repeat of the header.

## 5. Imagery

- **Сейчас в `public/images/*.jpg` — 10 AI-рендеров зала и площадки, а не фотографии SOF
  EXPO.** Это видно по признакам, которые нельзя «доделать» стилями: ни одной читаемой вывески
  или логотипа на стендах, бесконечные одинаковые модули, идеальная симметрия ферм, нулевой
  пол без кабеля и упаковки, однотипные «стоковые» лица, и тот же тёплый грэй, что и у кремовой
  палитры сайта. Поэтому принято два решения (2026-09-18):
  1. рендеры **обесцвечены** токеном `--ph-filter` и больше не стоят первым экраном: хиро
     события — это размерная сетка зала + факты, а не размытое фото;
  2. как только клиент отдаст архив, файлы заменяются 1-в-1 по именам, и удаление **одной
     строки** `--ph-filter` возвращает цвет. Публиковать рендеры под видом съёмки центра нельзя
     ни в КП, ни в пресс-релизах. Спец-требования к съёмке — `docs/07-design-review.md` §4.
- Naming: `venue-*`, `hall-*`, `hero-*`, `event-<slug>`. Event posters are the OG image of the
  event cluster.
- Alt text describes the frame ("Главный зал: экспозиция и переговорные зоны"), never repeats
  the page title; the audit rejects empty `alt`.
- Every `src` must exist on disk. Rule 13 of the audit checks `<img>` and `og:image` against
  `dist/`, so a card cannot ship a filename someone invented.
- **Редакционная полоса события.** `EventPage` выбирает до трёх материалов из `articles` и
  `news` с тем же `data.event` (топ-3 по дате) и рендерит их тем же `PostCard` в секции
  `tone="sand"` перед финальным CTA. Полоса появляется на всех четырёх страницах события,
  и новый текст попадает в неё сам — достаточно указать `event: <slug>` во фронтоматтере.
- `og/default.jpg` (1 200×630, 90 KB) and the favicon PNGs are generated:
  `node scripts/build-assets.mjs` re-renders them from `public/images/venue-exterior.jpg` +
  `public/favicon.svg` with sharp — never edit them by hand.

## 6. Voice (the "no fluff" contract)

| Do                                                           | Don't                                            |
| ------------------------------------------------------------ | ------------------------------------------------ |
| «Зал 4 400 м², нагрузка на пол 2 т/м², 700 кВт на стенд»     | «Современные технологии и индивидуальный подход» |
| «38 премиальных стендов осталось»                            | «Количество мест ограничено»                     |
| Dates as numbers + weekdays: «20–22 октября 2026, secondary» | «Скоро», «Уже скоро»                             |
| A number per headline where one exists                       | Adjectives without a figure next to them         |
| One CTA per screen, verb first: «Забронировать стенд»        | Two competing CTAs, «Узнать больше» alone        |

Sentences ≤ 20 words; a paragraph ≤ 3 sentences; every claim traceable to sofexpo.uz
(otherwise the sentence is deleted, not softened).

## 7. Accessibility

- `lang` on `<html>` matches the URL locale; the switcher link carries `hreflang`-equivalent
  text and `aria-current` on the active one.
- exactly one `<h1>` (asserted by the audit); heading levels never skipped — `SectionHead`
  takes an explicit `level` prop instead of hard-coding `h2`, tables carry `scope="col|row"`;
- `.skip` link, visible focus ring (`outline: 2px solid var(--gold)`), `:focus-visible` only;
- accordions and the mobile menu use `aria-expanded` + `aria-controls` and close on `Escape`;
- the FAQ uses `<details>/<summary>`, so keyboard and screen-reader behaviour is native;
- contrast: body text on cream = 13.9:1, `--moss` link on cream = 5.4:1, gold on evergreen =
  6.1:1 — nothing relies on colour alone (live chips also carry a label);
- forms: `<label for>`, `aria-describedby` for hints, errors announced via `role="status"`.

## 8. Adding a look

1. Need a new arrangement? Add a **block type** to `types.ts` + `Blocks.astro` before adding a
   component — the goal is that page authors compose, not code.
2. New token? Put it in `:root`, use it in ≥ 2 places, otherwise keep it local to the
   component's scoped style.
3. No new shadows, no new radii, no third accent colour, no `!important`, no `px` font sizes.
   Labels, figures and dates go through `--f-mono`; a new colour means a new token in `:root`
   with a contrast number next to it (`.stat`, `.kicker`, `.chip--live` were moved this way).
4. Check both locales at 1 440 / 768 / 390 px, then `npm run build && npm run audit:seo`
   (the audit also catches the structural regressions a new component tends to cause:
   duplicate `h1`, missing `alt`, non-localised links).
