# 03 · Link map

152 pages: 75 URLs per locale, mirrored 1:1, plus the bilingual gate `/` and `/404`.

**Hosts.** Всё ниже описывает режим `alias` (один хост). В режиме `subdomain` те же связи
разъезжаются по hostname'ам: `ownerOf()` решает, какой путь на каком хосте публикуется,
а `localize()` превращает чужой путь в абсолютный URL — якоря, глубина и логика хаба не
меняются. Матрица владения и 7 правил межхостовой перелинковки: `docs/05-subdomains.md`;
интегральность ссылок между хостами проверяет `scripts/check-hosts.mjs`.
Every page is reachable in ≤ 3 clicks from `/ru/` or `/en/`, and no indexable page has
zero inbound links (rule 10 of the audit).

## 1. Site tree

    /                                  bilingual gate (indexable, x-default source)
    ├── /ru/ , /en/                    home: unique hero + 9 authored sections
    │   ├── /events/                   line-up hub (ItemList, countdown, 6 cards)
    │   │   ├── /events/past/          archive of finished editions (children noindex)
    │   │   └── /events/{slug}/        ── per event, 4 pages:
    │   │       ├── /events/{slug}/            main: dates, venue, sections, stats, FAQ, form
    │   │       ├── /events/{slug}/exhibitors/  stand packages, deadlines, quote
    │   │       ├── /events/{slug}/visitors/    tickets, registration, route
    │   │       └── /events/{slug}/program/     forum tracks, speakers, timetable
    │   ├── /venue/                    centre hub
    │   │   ├── /venue/halls/          5 halls + open air, capacities, plans
    │   │   ├── /venue/services/       rental list, order in advance
    │   │   ├── /venue/tech-specs/     power, load, rigging, ceiling, floors
    │   │   ├── /venue/how-to-get-there/  airport/station, taxi, trucks, parking
    │   │   └── /venue/gallery/        photos, captioned, press-ready
    │   ├── /exhibitors/               audience hub (why exhibit)
    │   │   ├── /exhibitors/packages/  ·  /exhibitors/floor-plan/
    │   │   ├── /exhibitors/stand-construction/  ·  /exhibitors/services/
    │   │   ├── /exhibitors/sponsorship/  ·  /exhibitors/catalogue/
    │   │   └── /exhibitors/documents/ ·  /exhibitors/faq/
    │   ├── /visitors/                 audience hub (how to attend)
    │   │   ├── /visitors/tickets/  ·  /visitors/programme/
    │   │   └── /visitors/travel/   ·  /visitors/access/
    │   ├── /organizers/               audience hub (rent the venue for your own event)
    │   │   └── /organizers/rates/  ·  /organizers/conferences/  ·  /organizers/checklist/
    │   ├── /about/                    operator, figures, standards
    │   │   ├── /about/team/         ·  /about/partners/
    │   ├── /news/                     index → 5 press releases + /news/media-kit/
    │   ├── /articles/                 index → 8 long-read market/how-to pieces
    │   ├── /contacts/                 phones, e-mail, map, form
    │   ├── /request-stand/            the single conversion endpoint (form)
    │   ├── /search/                   + /{locale}/search/index.json
    │   ├── /legal/privacy/ · /legal/terms/
    │   └── /{locale}/rss.xml
    └── /404                           noindex,follow

Cluster sizes (per locale): events 26 · exhibitors 9 · news 7 · venue 6 · articles 9 ·
visitors 5 · organizers 4 · about 3 · legal 2 · contacts 1 · request-stand 1 · search 1 ·
home 1 = **75**.

## 2. Hubs and one funnel

Two structures carry the load site-wide:

- **`PromoBar`** (`src/components/PromoBar.astro`) — the announcement strip above the header,
  built from `nextEvent()`: the next edition, its dates and the one real urgency fact
  (for FOODERA: _38 premium stands left, 12 sections_), plus «Book a stand», «About this
  edition», «Get an entry pass» and the phone. It renders on all 144 templated pages except the
  pages of that very edition (no repeating the hero), and disappears when nothing is upcoming.
- **`EventNav`** — the per-edition rail under every event hero (the Textilelegprom left-panel
  pattern, laid out horizontally so it survives mobile): the 4 pages of the cluster
  (`aria-current="page"`), then «Packages and rates», «Exhibitor catalogue»,
  «Technical sheet», «Getting there», and the CTA pair «Book a stand / Get an entry pass».
  For a finished edition the rail switches to archive labels and points at `/events/` and
  `/events/past/`, so the noindex cluster keeps handing equity to the live ones.

  home ──► /events/ ─────► /events/{slug}/ ──► /events/{slug}/exhibitors/ ─┐
  │ └───────► /events/{slug}/visitors/ ─┐ │
  │ ▼ ▼
  ├───► /venue/ ───────► 5 sub-pages ──────► /organizers/ ──► /request-stand/ (form)
  │ ▲ ▲
  ├───► /exhibitors/ ──► 8 sub-pages ───────────────┴────────────────────┤
  ├───► /visitors/ ────► 4 sub-pages ────────────────────────────────────┤
  ├───► /organizers/ ──► 3 sub-pages ────────────────────────────────────┘
  └───► /news/ · /articles/ ──► 13 details (link up to a hub and sideways)

- **Money pages** are the four audience hubs and `/request-stand/`. They are linked from the
  header and footer on all 150 templated pages, from home, from the relevant event pages and
  from each other.
- **Event pages** carry the topical authority: each event owns a 4-page cluster whose children
  link back to the parent, to `/exhibitors/packages/`, `/visitors/tickets/` and
  `/request-stand/`, so the commercial hubs inherit the event's relevance.
- **Editorial** is the long-tail engine: each article links to the event it concerns and to one
  hub, and every detail page links back to the index and sideways to siblings — which is what
  keeps the 13 posts from being orphans.

## 3. Anchor rules

| Rule                                    | Implementation                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Locale-relative internal links only     | `localize(locale, path)` via the `H()` helper in `Blocks.astro`; `https://` and `/files/`, `/images/`, `/og/` hrefs pass through untouched     |
| Anchor text = the target page's keyword | nav uses authored `ru`/`en` labels; `links` blocks use real titles, never a bare "read more"                                                   |
| Exact spelling everywhere               | trailing slash always; no `?query` internal links; no `index.html`                                                                             |
| Breadcrumbs                             | `pageCrumbs()` in `src/lib/nav.ts` — a parent crumb only when the parent path is itself a page (this is what removed the dead `/legal/` crumb) |
| Language switch                         | `switchHref()` points at the sibling's own URL, never at a home page                                                                           |
| No link rot                             | the audit fails the build on a single unresolved href — 173 distinct internal targets verified                                                 |
| External links                          | `rel="noopener"` on ticketon.uz / Telegram / socials / maps; not `nofollow`-ed (real partners, real relevance)                                 |

Header nav (6 items with dropdown children), footer (4 columns × 5–6 links + a legal row) and
the page-level `links` / `cta` / `grid` blocks, the announcement strip and the per-edition rail
are the other link sources; each page ends up with 46–52 distinct internal targets (median 49)
— enough to cover a 75-page site in 3 clicks without turning into a link farm.

## 4. Query → URL map

| Query (RU)                                                | Query (EN)                                         | Target                                                 |
| --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| выставочный центр Самарканд, экспоцентр Самарканд адрес   | exhibition centre Samarkand, expo venue Uzbekistan | `/venue/`                                              |
| аренда зала под выставку Самарканд                        | rent exhibition hall Samarkand                     | `/organizers/`, `/organizers/rates/`                   |
| забронировать стенд, участие в выставке Узбекистан        | book a stand, exhibit at a trade show              | `/exhibitors/` → `/exhibitors/packages/`               |
| FOODERA EXPO, выставка продуктов Самарканд                | FOODERA food exhibition Samarkand                  | `/events/foodera-expo/`                                |
| BUILDPRO EXPO, строительная выставка Самарканд            | Buildpro construction expo                         | `/events/buildpro-expo/`                               |
| AGROPRO EXPO, агропромышленная выставка Узбекистан        | Agropro agriculture expo Uzbekistan                | `/events/agropro-expo/`                                |
| WORLD EDU, выставка образования Самарканд                 | World Edu education exhibition                     | `/events/world-edu-expo/`                              |
| ECOM RETAIL EXPO, выставка e-commerce                     | Ecom & Retail white label expo                     | `/events/ecom-retail-expo/`                            |
| PROMOTORS SHOW Samarkand, дрифт билеты                    | Promotors show drift Samarkand                     | `/events/promotors-show-samarkand/` (noindex, archive) |
| как выбрать выставочный стенд                             | how to choose an exhibition stand                  | `/articles/kak-vybrat-vystavochnyy-stend/`             |
| эффективность выставки, ROI                               | measuring trade show ROI                           | `/articles/kak-izmerit-effektivnost-vystavki/`         |
| документы для иностранного поставщика Узбекистан          | documents for a foreign supplier in Uzbekistan     | `/articles/dokumenty-eksponenta-uzbekistan/`           |
| рынок продуктов Центральной Азии                          | Central Asia food market                           | `/articles/rynok-produktov-centralnoy-azii/`           |
| запуск своего бренда без производства                     | launch a white label brand                         | `/articles/white-label-zapustit-brend/`                |
| выйти в федеральную сеть Узбекистана, чем торговать сетям | get into retail chains Uzbekistan                  | `/articles/kak-voyti-v-roznichnye-seti-uzbekistana/`   |
| крупногабаритная техника на выставке, привезти образец    | oversize machinery at an expo                      | `/articles/krupnogabaritnaya-tehnika-na-vystavke/`     |
| групповой визит на выставку, автобус для сотрудников      | organising a group visit to an expo                | `/articles/gruppovoy-vizit-na-vystavku/`               |
| контакты SOF EXPO, как добраться                          | contacts, how to get there                         | `/contacts/`, `/venue/how-to-get-there/`               |
| расписание выставок 2026 2027                             | exhibition calendar 2026 2027                      | `/events/`                                             |

## 5. Full inventory (generated from the current build)

`in` = сколько раз URL встречается в `href` со всех страниц обеих локалей
(поэтому у `/` и хабов значения ≈ 150, у самой дальней страницы — 6). Таблица перегенерирована
из `dist/` — после любого изменения структуры её нужно перегенерировать.

| RU path                                              | EN path                                              | RU title                                                                              | EN title                                                                          | in  | index   |
| ---------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --- | ------- |
| `/`                                                  | `/`                                                  | SOF EXPO Samarkand — экспоцентр и выставки в Самарканде                               | SOF EXPO Samarkand — exhibition centre and trade shows in Uzbekistan              | 156 | index   |
| `/about/`                                            | `/about/`                                            | О SOF EXPO Samarkand — выставочно-конгрессный центр в Самарканде                      | About SOF EXPO Samarkand — exhibition and congress centre                         | 152 | index   |
| `/about/partners/`                                   | `/about/partners/`                                   | Партнёры SOF EXPO: ассоциации, вузы, отели и медиа                                    | SOF EXPO partners: associations, universities, hotels and media                   | 152 | index   |
| `/about/team/`                                       | `/about/team/`                                       | Команда SOF EXPO: кто отвечает за выставку                                            | The SOF EXPO team: who owns which part of your show                               | 152 | index   |
| `/articles/dokumenty-eksponenta-uzbekistan/`         | `/articles/dokumenty-eksponenta-uzbekistan/`         | Документы и сертификация: как иностранному поставщику выйти на выставку в Узбекистане | Documents and certification: exhibiting in Uzbekistan as a foreign supplier       | 10  | index   |
| `/articles/gruppovoy-vizit-na-vystavku/`             | `/articles/gruppovoy-vizit-na-vystavku/`             | Групповой визит на выставку: как организовать делегацию предприятия в Самарканд       | Visiting as a group: how to run a company delegation to Samarkand                 | 22  | index   |
| `/articles/`                                         | `/articles/`                                         | Аналитика выставок и рынков — SOF EXPO Samarkand                                      | Exhibition and market insights from SOF EXPO                                      | 152 | index   |
| `/articles/kak-izmerit-effektivnost-vystavki/`       | `/articles/kak-izmerit-effektivnost-vystavki/`       | Влияние выставок на бизнес: что измерять, а что кажется результатом                   | How to measure exhibition ROI: what counts and what only feels like a result      | 6   | index   |
| `/articles/kak-voyti-v-roznichnye-seti-uzbekistana/` | `/articles/kak-voyti-v-roznichnye-seti-uzbekistana/` | Как производителю попасть в розничную сеть Узбекистана: путь через выставку           | How a producer gets onto Uzbek retail shelves: the trade-show route               | 30  | index   |
| `/articles/kak-vybrat-vystavochnyy-stend/`           | `/articles/kak-vybrat-vystavochnyy-stend/`           | Как выбрать выставочный стенд: 9, 18 или 36 м² и что реально входит в цену            | How to choose an exhibition stand: 9, 18 or 36 m² and what the price covers       | 12  | index   |
| `/articles/krupnogabaritnaya-tehnika-na-vystavke/`   | `/articles/krupnogabaritnaya-tehnika-na-vystavke/`   | Крупногабаритная техника на выставке: подъезд, разгрузка, монтаж — по шагам           | Oversized machinery at a trade show: access, unloading, installation step by step | 30  | index   |
| `/articles/rynok-produktov-centralnoy-azii/`         | `/articles/rynok-produktov-centralnoy-azii/`         | Рынок продуктов Центральной Азии: 125 млн потребителей и 58–78 млрд долларов          | The Central Asian food market: 125 million consumers and $58–78 billion           | 6   | index   |
| `/articles/white-label-zapustit-brend/`              | `/articles/white-label-zapustit-brend/`              | White Label: как запустить свой бренд без собственного производства                   | White Label: launching your brand without owning a factory                        | 6   | index   |
| `/contacts/`                                         | `/contacts/`                                         | Контакты SOF EXPO Samarkand — адрес, телефоны, форма заявки                           | Contacts — SOF EXPO Samarkand address, phones, request form                       | 153 | index   |
| `/events/agropro-expo/exhibitors/`                   | `/events/agropro-expo/exhibitors/`                   | AGROPRO 2027: метраж, уличная площадка, электричество 380 В                           | AGROPRO 2027: floor space, outdoor area, 380 V power                              | 14  | index   |
| `/events/agropro-expo/`                              | `/events/agropro-expo/`                              | AGROPRO EXPO 2027 — агровыставка в Самарканде, 2–4 марта                              | AGROPRO EXPO 2027 — agriculture exhibition in Samarkand, 2–4 March                | 152 | index   |
| `/events/agropro-expo/program/`                      | `/events/agropro-expo/program/`                      | Программа AGROPRO EXPO 2027: орошение, субсидии, экспорт                              | AGROPRO EXPO 2027 programme: irrigation, subsidies, export                        | 10  | index   |
| `/events/agropro-expo/visitors/`                     | `/events/agropro-expo/visitors/`                     | AGROPRO 2027 для хозяйств: групповой вход и маршрут                                   | AGROPRO 2027 for farms: group entry and a buying route                            | 10  | index   |
| `/events/buildpro-expo/exhibitors/`                  | `/events/buildpro-expo/exhibitors/`                  | Экспонентам BUILD PRO 2026: застройка, техника, перевод                               | BUILD PRO 2026 exhibitors: build-up, machinery, interpreting                      | 12  | index   |
| `/events/buildpro-expo/`                             | `/events/buildpro-expo/`                             | BUILD PRO EXPO 2026 — строительная выставка в Самарканде                              | BUILD PRO EXPO 2026 — construction exhibition in Samarkand                        | 152 | index   |
| `/events/buildpro-expo/program/`                     | `/events/buildpro-expo/program/`                     | Программа BUILD PRO EXPO 2026: форум архитекторов и сессии                            | BUILD PRO EXPO 2026 programme: architects forum and sessions                      | 10  | index   |
| `/events/buildpro-expo/visitors/`                    | `/events/buildpro-expo/visitors/`                    | Посетителям BUILD PRO 2026: форум, демо-площадка, контакты                            | BUILD PRO 2026 visitors: forum, demo area, supplier contacts                      | 10  | index   |
| `/events/ecom-retail-expo/exhibitors/`               | `/events/ecom-retail-expo/exhibitors/`               | Участие в ECOM &amp; RETAIL 2027: витрина, сервис, спонсорство                        | Exhibiting at ECOM &amp; RETAIL 2027: showcase, service, sponsorship              | 12  | index   |
| `/events/ecom-retail-expo/`                          | `/events/ecom-retail-expo/`                          | ECOM &amp; RETAIL EXPO 2027 — форум e-commerce в Самарканде                           | ECOM &amp; RETAIL EXPO 2027 — e-commerce forum in Samarkand                       | 152 | index   |
| `/events/ecom-retail-expo/program/`                  | `/events/ecom-retail-expo/program/`                  | Программа ECOM &amp; RETAIL EXPO 2027: ритейл и маркетплейсы                          | ECOM &amp; RETAIL EXPO 2027 programme: retail and marketplaces                    | 10  | index   |
| `/events/ecom-retail-expo/visitors/`                 | `/events/ecom-retail-expo/visitors/`                 | Посетителям ECOM &amp; RETAIL 2027: треки и биржа контактов                           | ECOM &amp; RETAIL 2027 visitors: tracks and contact exchange                      | 10  | index   |
| `/events/foodera-expo/exhibitors/`                   | `/events/foodera-expo/exhibitors/`                   | FOODERA 2026: пакеты участия, дегустации и сроки подачи заявок                        | FOODERA 2026: packages, tastings and application deadlines                        | 16  | index   |
| `/events/foodera-expo/`                              | `/events/foodera-expo/`                              | FOODERA EXPO 2026 — выставка продуктов и напитков, Самарканд                          | FOODERA EXPO 2026 — food and drink exhibition, Samarkand                          | 153 | index   |
| `/events/foodera-expo/program/`                      | `/events/foodera-expo/program/`                      | Программа FOODERA EXPO 2026: форум, биржа, конкурс продуктов                          | FOODERA EXPO 2026 programme: forum, marketplace, product contest                  | 12  | index   |
| `/events/foodera-expo/visitors/`                     | `/events/foodera-expo/visitors/`                     | FOODERA 2026 для посетителей: вход, дегустации, биржа контактов                       | FOODERA 2026 for visitors: entry, tastings, buying meetings                       | 10  | index   |
| `/events/`                                           | `/events/`                                           | Афиша выставок 2026–2027 в Самарканде — SOF EXPO                                      | Exhibition line-up 2026–2027 in Samarkand — SOF EXPO                              | 154 | index   |
| `/events/past/`                                      | `/events/past/`                                      | Архив выставок: итоги и каталоги — SOF EXPO                                           | Exhibition archive: results and catalogues — SOF EXPO                             | 152 | index   |
| `/events/promotors-show-samarkand/exhibitors/`       | `/events/promotors-show-samarkand/exhibitors/`       | PROMOTORS SHOW: форматы участия для брендов автоиндустрии                             | PROMOTORS SHOW: participation formats for automotive brands                       | 10  | noindex |
| `/events/promotors-show-samarkand/`                  | `/events/promotors-show-samarkand/`                  | PROMOTORS SHOW SAMARKAND 2026 — итоги авто-фестиваля                                  | PROMOTORS SHOW SAMARKAND 2026 — festival results                                  | 152 | noindex |
| `/events/promotors-show-samarkand/program/`          | `/events/promotors-show-samarkand/program/`          | Программа PROMOTORS SHOW 2026: дрифт, SPL, награждение                                | PROMOTORS SHOW 2026 programme: drift, SPL, awards                                 | 10  | noindex |
| `/events/promotors-show-samarkand/visitors/`         | `/events/promotors-show-samarkand/visitors/`         | PROMOTORS SHOW 2026: билеты и правила фестиваля                                       | PROMOTORS SHOW 2026: tickets and festival rules                                   | 10  | noindex |
| `/events/world-edu-expo/exhibitors/`                 | `/events/world-edu-expo/exhibitors/`                 | Вузам и консультантам: участие в WORLD EDU 2027                                       | For universities and agencies: exhibiting at WORLD EDU 2027                       | 10  | index   |
| `/events/world-edu-expo/`                            | `/events/world-edu-expo/`                            | WORLD EDU EXPO 2027 — выставка образования в Самарканде                               | WORLD EDU EXPO 2027 — education exhibition in Samarkand                           | 152 | index   |
| `/events/world-edu-expo/program/`                    | `/events/world-edu-expo/program/`                    | Программа WORLD EDU 2027: презентации вузов и тесты                                   | WORLD EDU 2027 programme: university presentations and tests                      | 10  | index   |
| `/events/world-edu-expo/visitors/`                   | `/events/world-edu-expo/visitors/`                   | Абитуриентам WORLD EDU 2027: регистрация и маршрут                                    | WORLD EDU 2027 for applicants: registration and route                             | 10  | index   |
| `/exhibitors/catalogue/`                             | `/exhibitors/catalogue/`                             | Каталог участников выставок SOF EXPO Samarkand                                        | Exhibitor catalogue of SOF EXPO Samarkand shows                                   | 152 | index   |
| `/exhibitors/documents/`                             | `/exhibitors/documents/`                             | Документы экспонента и ключевые даты подготовки к выставке                            | Exhibitor documents and key preparation dates                                     | 152 | index   |
| `/exhibitors/faq/`                                   | `/exhibitors/faq/`                                   | FAQ экспонента: договор, монтаж, техника, персонал, отчётность                        | Exhibitor FAQ: contract, build-up, machinery, staff, reporting                    | 152 | index   |
| `/exhibitors/floor-plan/`                            | `/exhibitors/floor-plan/`                            | Планировка зала и выбор места под стенд — SOF EXPO Samarkand                          | Floor plan and choosing a stand location — SOF EXPO Samarkand                     | 152 | index   |
| `/exhibitors/`                                       | `/exhibitors/`                                       | Экспонентам SOF EXPO Samarkand: участие, пакеты, подготовка, аудитория                | For exhibitors at SOF EXPO Samarkand: participation, packages, audience           | 152 | index   |
| `/exhibitors/packages/`                              | `/exhibitors/packages/`                              | Пакеты участия и ставки на выставках SOF EXPO Samarkand                               | Participation packages and rates at SOF EXPO Samarkand                            | 153 | index   |
| `/exhibitors/services/`                              | `/exhibitors/services/`                              | Сервисы для экспонентов: от мебели до переводчиков и хранения груза                   | Exhibitor services: from furniture to interpreting and cargo storage              | 152 | index   |
| `/exhibitors/sponsorship/`                           | `/exhibitors/sponsorship/`                           | Спонсорство и рекламные возможности на выставках SOF EXPO                             | Sponsorship and advertising at SOF EXPO exhibitions                               | 152 | index   |
| `/exhibitors/stand-construction/`                    | `/exhibitors/stand-construction/`                    | Строительство выставочных стендов в Самарканде: виды, сроки, согласование             | Exhibition stand construction in Samarkand: types, deadlines, approval            | 152 | index   |
| `/legal/privacy/`                                    | `/legal/privacy/`                                    | Политика конфиденциальности                                                           | Privacy policy — SOF EXPO Samarkand                                               | 152 | index   |
| `/legal/terms/`                                      | `/legal/terms/`                                      | Пользовательское соглашение                                                           | Terms of use — SOF EXPO Samarkand                                                 | 152 | index   |
| `/news/agropro-2027-priem-zayavok/`                  | `/news/agropro-2027-priem-zayavok/`                  | AGROPRO EXPO 2027: приём заявок открыт, даты 2–4 марта                                | AGROPRO EXPO 2027: call for exhibitors is open                                    | 14  | index   |
| `/news/buildpro-2026-plan-zala/`                     | `/news/buildpro-2026-plan-zala/`                     | BUILD PRO EXPO 2026: бронь мест открыта по десяти разделам                            | BUILD PRO EXPO 2026: booking opens across ten sections                            | 20  | index   |
| `/news/foodera-2026-registratsiya-otkryta/`          | `/news/foodera-2026-registratsiya-otkryta/`          | Открыта регистрация экспонентов FOODERA EXPO 2026                                     | FOODERA EXPO 2026 opens exhibitor registration                                    | 24  | index   |
| `/news/`                                             | `/news/`                                             | Новости SOF EXPO Samarkand: анонсы выставок и пресс-релизы                            | SOF EXPO Samarkand news: exhibition announcements and press releases              | 152 | index   |
| `/news/media-kit/`                                   | `/news/media-kit/`                                   | Пресс-центр и медиакит SOF EXPO: логотипы, фотобанк, аккредитация                     | Press centre and media kit: logos, photo bank, accreditation                      | 152 | index   |
| `/news/mezhdunarodnyy-sayt-sofexpo/`                 | `/news/mezhdunarodnyy-sayt-sofexpo/`                 | SOF EXPO запустил международный сайт на двух языках                                   | SOF EXPO launches an international two-language website                           | 6   | index   |
| `/news/promotors-2026-itogi/`                        | `/news/promotors-2026-itogi/`                        | PROMOTORS SHOW SAMARKAND 2026: итоги фестиваля                                        | PROMOTORS SHOW SAMARKAND 2026: festival results                                   | 24  | index   |
| `/organizers/checklist/`                             | `/organizers/checklist/`                             | Чек-лист подготовки события в экспоцентре                                             | Event readiness checklist for the exhibition centre                               | 152 | index   |
| `/organizers/conferences/`                           | `/organizers/conferences/`                           | Конференции и форумы: зал, техника, модератор, трансляция                             | Conferences and forums: hall, AV, moderator, streaming                            | 152 | index   |
| `/organizers/`                                       | `/organizers/`                                       | Организаторам событий: аренда экспоцентра SOF EXPO Samarkand                          | Event organizers: rent SOF EXPO Samarkand as a venue                              | 152 | index   |
| `/organizers/rates/`                                 | `/organizers/rates/`                                 | Ставки аренды зала и услуг — SOF EXPO Samarkand                                       | Hall rental and service rates — SOF EXPO Samarkand                                | 152 | index   |
| `/request-stand/`                                    | `/request-stand/`                                    | Забронировать стенд на выставке в Самарканде                                          | Book a stand at an exhibition in Samarkand                                        | 152 | index   |
| `/search/`                                           | `/search/`                                           | Поиск по сайту SOF EXPO Samarkand                                                     | Search SOF EXPO Samarkand                                                         | 153 | index   |
| `/venue/gallery/`                                    | `/venue/gallery/`                                    | Фото и видео выставочного центра SOF EXPO Samarkand                                   | Photos and video of SOF EXPO Samarkand                                            | 152 | index   |
| `/venue/halls/`                                      | `/venue/halls/`                                      | Залы и площадки SOF EXPO Samarkand: планировки и вместимость                          | Halls and areas at SOF EXPO Samarkand — layouts and capacity                      | 153 | index   |
| `/venue/how-to-get-there/`                           | `/venue/how-to-get-there/`                           | Как добраться до SOF EXPO Samarkand — адрес, трансфер, парковка                       | Getting to SOF EXPO Samarkand — address, transfer, parking                        | 152 | index   |
| `/venue/`                                            | `/venue/`                                            | Выставочный центр SOF EXPO Samarkand: залы, услуги, адрес                             | SOF EXPO Samarkand exhibition centre — halls, areas and services                  | 152 | index   |
| `/venue/services/`                                   | `/venue/services/`                                   | Услуги выставочного центра: прокат оборудования, мебель, техника, персонал            | Venue services: equipment rental, furniture, AV, print and staff                  | 152 | index   |
| `/venue/tech-specs/`                                 | `/venue/tech-specs/`                                 | Техническая спецификация SOF EXPO Samarkand: площади, нагрузка, электричество         | Technical data sheet of SOF EXPO Samarkand — areas, loads, power                  | 152 | index   |
| `/visitors/access/`                                  | `/visitors/access/`                                  | Доступная среда, дети и групповой визит на выставку                                   | Accessibility, children and group visits                                          | 152 | index   |
| `/visitors/`                                         | `/visitors/`                                         | Посетителям выставок SOF EXPO Samarkand — билеты, программа, что смотреть             | For visitors of SOF EXPO Samarkand — tickets, programme, what to see              | 152 | index   |
| `/visitors/programme/`                               | `/visitors/programme/`                               | Деловая программа выставок: форумы, сессии, мастер-классы                             | Business programme: forums, sessions and masterclasses                            | 152 | index   |
| `/visitors/tickets/`                                 | `/visitors/tickets/`                                 | Билеты и регистрация на выставки в Самарканде                                         | Tickets and registration for exhibitions in Samarkand                             | 152 | index   |
| `/visitors/travel/`                                  | `/visitors/travel/`                                  | Проезд, отели и виза: как приехать на выставку в Самарканд                            | Travel, hotels and visas: coming to an exhibition in Samarkand                    | 152 | index   |

## 5b. Редакционные связи между кластерами

**Editorial split by host (решение клиента, 2026-09-18).** Поле `event` решает не только полосу
«Читать по теме», но и **хост, на котором текст публикуется**: в `PUBLIC_HOSTS_MODE=subdomain`
новость и лонгрид FOODERA строятся на `foodera.sofexpo.org`, два текста AGROPRO — на
`agropro.sofexpo.org`, `buildpro-2026-plan-zala` — на `buildpro.sofexpo.org`. Без тега (`«Групповые
заявки…»`) текст остаётся у центра. Индексы `/news/` и `/articles/` при этом живут только в центре и
перечисляют всё — карточки уехавших текстов ведут на их хост абсолютной ссылкой, поэтому переезд не
лишает текст входящих. Реестр — генерируемый `src/data/editorial-owners.json`; его же использует
пост-обработчик ссылок, так что ссылка, написанная руками внутри статьи, ведёт туда же, куда и
canonical. На хосте выставки своего `/news/`-индекса нет: кнопка «Все материалы» ведёт в центр.

Лонгриды и пресс-релизы не висят отдельно: у записи в коллекции есть необязательное поле
`event`. Если оно заполнено, все материалы с этим slug'ом считаются редаксией события и автоматически попадают
в полосу «Читать по теме» на **всех четырёх** страницах этого события (`EventPage.astro`,
сортировка по дате, максимум 3 карточки). Тот же `PostCard` используется в `layout="sidebar"`.
Обратно тоже ведёт ссылка: в лонгриде — на страницу события и его раздел, в релизе — на план зала.
Так каждая аналитическая страница получает тематический inbound от кластера события, а каждая
страница события — содержательный outbound, а не только формы.

Мини-правило для новых текстов: если материал можно привязать к выставке — привязывайте и
кладите в него ссылку на `/events/{slug}/…`; если нельзя (например, гайд про групповой визит) —
он всё равно живёт в общем хабе `/articles/` и в RSS.

## 6. Off-page plan

The internal graph is shaped so that these external targets land on pages that can convert
them; the numbers below are what those pages already promise:

| Source                                   | Target                                              | Why it fits                                        |
| ---------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| ticketon.uz event card                   | `/events/promotors-show-samarkand/`                 | the only page with ticket rules and the prize fund |
| Sellers Association of Uzbekistan        | `/events/ecom-retail-expo/`                         | listed there as co-organizer, with their contacts  |
| Samarkand Regional Administration        | `/events/ecom-retail-expo/`, `/about/`              | official support of the forum                      |
| Partner universities (UZ/RU/BY/KZ)       | `/events/world-edu-expo/`                           | their "where to study" pages list the fair         |
| DairyNews and other trade media          | `/news/`, the referenced article                    | existing partnership coverage                      |
| Hotel partners (Reikartz)                | `/visitors/travel/`                                 | the partner rate is a visitor-side asset           |
| Exhibitor sites (80+ at Buildpro 2025)   | `/exhibitors/catalogue/` → `/events/buildpro-expo/` | catalogue entries are the natural link target      |
| Expo associations (UFI, regional bodies) | `/venue/`, `/about/`                                | venue profile pages                                |
