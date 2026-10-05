# 16 · Kalit so'zlar auditi va optimizatsiyasi (2026-10-05)

Sana: 2026-10-05 · Holat: bajarildi + takliflar · Gate: `npm run audit:keywords` (`npm run check` ichida)

> `docs/02` — texnik SEO-kontrakt (canonical, hreflang, JSON-LD, sitemap). Bu hujjat uning
> ustidagi qavat: **har bir sahifa qaysi qidiruv so'roviga javob beradi** va o'sha so'rov
> sahifaning qayerida turibdi. Semantik yadro endi ma'lumot sifatida saqlanadi
> (`scripts/keyword-map.mjs`) va har build'dan keyin avtomatik tekshiriladi.

---

## 0. Qisqa xulosa

Texnik SEO a'lo edi (0 topilma), lekin **kalit so'z darajasida** sayt o'z pul so'rovlariga
yetarlicha "gapirmas" edi: H1 sarlavhalar ijodiy shiorlar edi ("Вы — организатор. Мы — зал…"),
title'larning yarmi build paytida kesilib, ikkinchi darajali kalit so'zlarni yo'qotardi,
«аренда выставочного зала Самарканд» kabi tijoriy so'rov hech bir title'da yo'q edi.

| Ko'rsatkich (209 ta sahifa×til maqsadi) | Oldin | Keyin |
| --- | --- | --- |
| O'rtacha ball (0–100) | **50** | **88** |
| Pul sahifalari (A-prioritet) o'rtacha | 50 | **91** |
| RU / EN / UZ o'rtacha | 41 / 59 / 52 | **87 / 87 / 95** |
| Asosiy so'z `<title>` da | 147 / 209 | **209 / 209** |
| Asosiy so'z `<h1>` da | **5** / 209 | **189** / 209 |
| Bo'lim (segment) sahifalari, 94 ta, o'rtacha | 46 | **94** |
| A-prioritet sahifalar 70 dan past | 44 | **0** |
| `fit-meta` kesgan sahifalar | 293 | 204 |
| Kannibalizatsiya holatlari | 4 | 1 (qabul qilingan, §2.6) |

Barcha mavjud gate'lar yashil: `audit:seo` 0, `page-audit` 0, tarjima auditi 0, 30/30 unit
test, `typecheck` 0. Brauzer testlari: axe WCAG 2.1 AA en/zh/tr/uz — 0 buzilish; ikkita
test (`a11y ru` — navigatsiya paytida kontekst yo'qolishi, `without JavaScript` — til
tanlagichida 4 ta havola) **o'zgartirilmagan HEAD'da ham xuddi shunday tushadi**, ya'ni bu
o'zgarishlarga aloqasi yo'q.

## 1. Metodika

**Kalit so'z xaritasi** — `scripts/keyword-map.mjs`: har bir sahifa va til uchun bitta asosiy
so'rov + ikkinchi darajali so'rovlar. Moslash **o'zak (stem)** bo'yicha: `выстав` → «выставка /
выставки / выставок / выставочный»; `ko'rgazma` → «ko‘rgazmasi / ko‘rgazmalar». O'zbekcha
apostrof variantlari (‘ ’ ʻ ` ´) bitta `'` ga keltiriladi, `ё` → `е`.

**Ball** — `scripts/keyword-audit.mjs` qurilgan `dist/` ustida ishlaydi, asosiy so'rov uchun:

| Joy | Og'irlik | Nega |
| --- | --- | --- |
| `<title>` | 35 | SERP'dagi ko'k qator, eng kuchli on-page signal |
| `<h1>` | 25 | sahifa mavzusining ikkinchi signali |
| meta description | 15 | SERP snippet'ida qalin bo'lib chiqadi → CTR |
| `<main>` ning birinchi 100 so'zi | 10 | mavzu boshidanoq aniq |
| biror `<h2>` | 5 | tuzilma |
| matnda ≥ 2 marta | 10 | tabiiy zichlik (spam emas) |

**Prioritet** — so'rovning *tijoriy og'irligi*, o'lchangan hajm emas: **A** — pul so'rovi (stend
bron qilish, zal ijarasi, ko'rgazma nomi + soha), **B** — ko'rgazma/kategoriya so'rovi, **C** —
ma'lumot so'rovi. Hajmlar bu muhitda o'lchanmadi (Wordstat/Keyword Planner'ga kirish yo'q) —
§5 ga qarang.

**Kannibalizatsiya** — A-prioritet so'rovi boshqa (A bo'lmagan) sahifaning title'ida ham
uchrasa, xabar beriladi.

**Gate** — A-prioritetli so'rov 70 dan past bo'lsa `npm run audit:keywords` 1 bilan chiqadi.

## 2. Topilgan muammolar va tuzatishlar

### 2.1 `fit-meta` title'larni birinchi ajratkichdan kesardi — 169 sahifa

`scripts/fit-meta.mjs` 70 belgidan uzun title'ni ajratkichdan kesadi, lekin ajratkichlarni
tartib bilan sinardi: avval ` — `, keyin `: `, keyin ` | `. Natija:

- RU bosh sahifa: «Выставочный центр в Самарканде — выставки и экспо Узбекистана | SOF EXPO» →
  **«Выставочный центр в Самарканде»** (30 belgi; «выставки», «Узбекистан» yo'qoldi);
- `/ru/visitors/`: «Посетителям выставок SOF EXPO Samarkand — билеты, программа…» →
  «Посетителям выставок SOF EXPO Samarkand»;
- `/en/exhibitors/`: «For exhibitors at SOF EXPO Samarkand: participation, packages, audience» →
  «For exhibitors at SOF EXPO Samarkand».

**Tuzatish:** chegaraga eng yaqin ajratkich tanlanadi (qaysi turi bo'lishidan qat'i nazar).
RU bosh sahifa endi «Выставочный центр в Самарканде — выставки и экспо Узбекистана» (63).
Uzun title'lar qayta yozildi (kalit so'z oldinda, ≤ 70 belgi) — kesilgan sahifalar 293 → 204
(qolganlari asosan `— SOF EXPO` brend qo'shimchasini yo'qotadi, kalit so'zni emas).

### 2.2 H1 kalit so'zsiz edi — 209 tadan 5 tasida

Hero sarlavhalar shior: «Три дня, которые закрывают квартальный план по контактам»,
«A hall alone does not make a show». Kalit so'z ustidagi kichik yorliqda (kicker,
`<p class="kicker">`) edi — H1 tashqarisida.

**Tuzatish (dizayn o'zgarmaydi):** kicker endi H1 ichida `<span class="kicker">` — xuddi bosh
sahifadagi kabi. To'rt komponent: `PageHero`, `Blocks` (hero), `SectionHead` (`level=1`),
`EventHero`. CSS: `h1 > .kicker` alohida qatorda, yorliq ko'rinishida; animatsiya ikki
marta ishlamasligi uchun `motion.css` da o'chirilgan. Pul sahifalarining kicker matni
so'rovga aylantirildi:

| Sahifa | Oldin (kicker) | Keyin (H1 boshi) |
| --- | --- | --- |
| `/organizers/` | Площадка для вашего события | **Аренда выставочного зала · Самарканд** |
| `/organizers/conferences/` | Конгресс-сервис / Congress service | **Конференц-зал в Самарканде** / Conference venue · Samarkand |
| `/exhibitors/` | Экспонентам / For exhibitors | **Участие в выставках · Самарканд** / Exhibiting in Uzbekistan · Samarkand |
| `/exhibitors/packages/` | Деньги / Money | **Стоимость участия в выставке** / Participation packages and rates |
| `/request-stand/` | Бронирование / Booking | **Бронирование стенда · Самарканд** / Book a stand · Samarkand |
| `/visitors/tickets/` | Билеты / Tickets | **Билеты на выставки · Самарканд** / Exhibition tickets · Samarkand |
| `/venue/` | Экспоцентр · Самарканд | **Выставочная площадка · Самарканд** / Exhibition venue · Samarkand |
| `/events/` | Афиша 2026–2027 | **Выставки в Самарканде 2026–2027** |
| ko'rgazma sahifalari | Выставка продуктов и напитков | **Выставка продуктов и напитков в Самарканде** (va 4 ta boshqa ko'rgazma) |

Yana 16 ta B/C sahifaning kicker'i ham shunday yangilandi (zallar, yo'l, xizmatlar, dastur,
hujjatlar, homiylik, FAQ, galereya …).

### 2.3 Tijoriy so'rovlar title/description'da yo'q edi

| So'rov | Sahifa | Oldin | Keyin |
| --- | --- | --- | --- |
| аренда выставочного зала Самарканд | `/ru/organizers/` | «Организаторам событий: аренда экспоцентра SOF EXPO Samarkand» | «**Аренда выставочного зала в Самарканде** — организаторам событий» |
| exhibition hall rental Samarkand | `/en/organizers/` | «Event organizers: rent SOF EXPO Samarkand as a venue» | «**Exhibition hall rental in Samarkand** for event organizers» |
| конференц-зал Самарканд | `/ru/organizers/conferences/` | «Конференции и форумы: зал, техника…» | «**Конференц-зал в Самарканде**: форумы, техника, модератор, трансляция» |
| выставки в Самарканде 2026 | `/ru/events/` | «Афиша выставок 2026–2027 в Самарканде» | «**Выставки в Самарканде 2026–2027**: календарь выставок» |
| exhibitions in Samarkand 2026 | `/en/events/` | «Exhibition line-up 2026–2027 in Samarkand» | «**Exhibitions in Samarkand 2026–2027**: trade show calendar» |
| участие в выставке | `/ru/exhibitors/` | (kesilgan) «Экспонентам SOF EXPO Samarkand» | «**Участие в выставках в Самарканде** — экспонентам SOF EXPO» |
| стоимость участия в выставке | `/ru/exhibitors/packages/` | «Пакеты участия и ставки…» | «**Стоимость участия в выставке**: пакеты и ставки» |
| стоимость аренды зала | `/ru/organizers/rates/` | «Ставки аренды зала и услуг» | «**Стоимость аренды выставочного зала**» |

Description'lar ham asosiy so'rov bilan boshlanadigan qilib qayta yozildi (5 ta ko'rgazma
sahifasi: «Выставка продуктов питания и напитков в Самарканде, 20–22 октября 2026: …»).
Faktlar o'zgarmadi — `docs/02 §5` (fact policy) saqlangan, yangi raqam qo'shilmadi.

### 2.4 Bo'lim sahifalari (94 ta) — shablon dum va kesilish

Oldin: «Dairy and cheese at FOODERA EXPO 2026: exhibitors, buyers, samples» → kesilib
«Dairy and cheese at FOODERA EXPO 2026». «Выставка», «Самарканд» umuman yo'q edi.

Keyin (`SegmentPage.astro` + `localization.mjs` dagi tarjima shablonlari):

| Til | Title |
| --- | --- |
| RU | «Молочная продукция и сыры» на выставке в Самарканде — FOODERA EXPO 2026 |
| EN | Dairy and cheese exhibition in Samarkand — FOODERA EXPO 2026 |
| UZ | Sut mahsulotlari va pishloq ko‘rgazmasi, Samarqand — FOODERA EXPO 2026 |
| TR | Süt ve peynir fuarı, Semerkant — FOODERA EXPO 2026 |
| ZH | 奶制品和奶酪展 · 撒马尔罕 — FOODERA EXPO 2026 |

Kalit so'z birinchi turadi — `fit-meta` dumni kessa ham so'rov saqlanadi. H1:
«FOODERA exhibition section» kicker + bo'lim nomi. O'rtacha ball 46 → 94.

### 2.5 Brend (entity) nomi ikki xil yozilardi: BUILD PRO va BUILDPRO

Logotipda **BUILD PRO EXPO** (`images/brand-masters/buildpro-expo-logo.png`), hub title,
yangiliklar, `llms.txt` — «BUILD PRO» (353 marta), lekin `events.ts` dagi `brand` va
`shortName` — «BUILDPRO» (141 marta): JSON-LD `ExhibitionEvent.name`, breadcrumb, bo'lim
title'lari, menyu, ariza formasi. Google uchun bu bitta entity'ning ikki nomi.

**Tuzatish:** `events.ts`, `site.ts` (menyu), `ExhibitorForm` → «BUILD PRO EXPO 2026». Kataloglarda
eski kalitlar saqlangan, yangi yozilishdagi nusxasi qo'shilgan (tarjima yo'qolmaydi).
Hostname (`buildpro.sofexpo.org`) va slug (`buildpro-expo`) o'zgarmadi — URL'lar barqaror.

### 2.6 Kannibalizatsiya

- `/about/` title «…выставочно-конгрессный центр в Самарканде» / «…exhibition and congress
  centre» bosh sahifa va `/venue/` bilan bir so'rovga raqobat qilardi → «О компании SOF EXPO
  Samarkand: оператор центра, команда, стандарты».
- `/ru/visitors/` title'idagi «билеты» `/ru/visitors/tickets/` bilan raqobat qilardi →
  «вход, программа, маршрут».
- Qoldi (qabul qilingan): `/en/exhibitors/catalogue/` («Exhibitor catalogue…») — so'rov niyati
  boshqa (katalog qidirish), o'zgartirish shart emas.

### 2.7 Tarjimalar

- 60 ta yangi EN satr uchun ZH/TR/UZ tarjimalari qo'shildi (kataloglar, `reviewed.json` emas).
  UZ'da sohaviy atamalar: «ko‘rgazma zali ijarasi», «ko‘rgazmada ishtirok etish», «stend band
  qilish», «qishloq xo‘jaligi ko‘rgazmasi» — odamlar aynan shunday qidiradi.
- TR katalogida «SOF EXPO **Samamarkand**» xatosi tuzatildi.
- Eski TR katalogida «Book a stand…» → «stand a stand rezervasyonu» kabi buzuq satrlar bor,
  lekin `reviewed.json` ularni allaqachon ustidan yozadi — sahifada to'g'ri chiqadi.

## 3. Semantik yadro (har sahifa uchun)

Qalin — asosiy so'rov, qolgani — ikkinchi darajali. Bo'lim sahifalari (94 ta) avtomatik:
«выставка «<bo'lim>»» / «<segment> exhibition». Manba: `scripts/keyword-map.mjs`.

| Sahifa | P | RU | EN | UZ |
| --- | --- | --- | --- | --- |
| `/` | A | **выставочный центр Самарканд**; выставки в Самарканде; выставки Узбекистан; экспоцентр Самарканд | **exhibition centre Samarkand**; trade shows Uzbekistan; expo centre Samarkand | **Samarqand ko'rgazma markazi**; ko'rgazmalar O'zbekiston |
| `/venue/` | A | **выставочная площадка Самарканд**; выставочный зал 4 400 м² | **exhibition venue Samarkand**; exhibition halls | **ko'rgazma maydoni Samarqand** |
| `/venue/halls/` | B | **залы выставочного центра**; вместимость зала | **exhibition halls Samarkand**; hall capacity | — |
| `/venue/tech-specs/` | C | **технические характеристики выставочного зала**; электричество 700 кВт | **venue technical data sheet**; 700 kW power | — |
| `/venue/how-to-get-there/` | B | **SOF EXPO Самарканд адрес как добраться**; трансфер из аэропорта Самарканда | **how to get to SOF EXPO Samarkand**; Samarkand airport transfer | — |
| `/venue/services/` | B | **услуги для экспонентов аренда оборудования** | **exhibition equipment rental** | — |
| `/venue/gallery/` | C | **фото выставочного центра** | **exhibition centre photos** | — |
| `/events/` | A | **выставки в Самарканде 2026**; календарь выставок Узбекистан | **exhibitions in Samarkand 2026**; trade show calendar Uzbekistan | **Samarqanddagi ko'rgazmalar 2026** |
| `/events/past/` | C | **архив выставок итоги** | **exhibition archive results** | — |
| `/exhibitors/` | A | **участие в выставке Самарканд**; экспонентам | **exhibit at a trade show in Uzbekistan**; exhibitor information | **ko'rgazmada ishtirok etish** |
| `/exhibitors/packages/` | A | **стоимость участия в выставке** | **exhibition participation packages and rates** | — |
| `/exhibitors/stand-construction/` | A | **строительство выставочных стендов Самарканд** | **exhibition stand construction Samarkand** | — |
| `/exhibitors/floor-plan/` | B | **план зала выставки место под стенд** | **exhibition floor plan stand location** | — |
| `/exhibitors/documents/` | B | **документы экспонента** | **exhibitor documents** | — |
| `/exhibitors/faq/` | C | **вопросы экспонента FAQ** | **exhibitor FAQ** | — |
| `/exhibitors/services/` | B | **сервисы для экспонентов** | **exhibitor services** | — |
| `/exhibitors/sponsorship/` | B | **спонсорство выставки** | **exhibition sponsorship** | — |
| `/exhibitors/catalogue/` | C | **каталог участников выставки** | **exhibitor catalogue** | — |
| `/request-stand/` | A | **забронировать стенд на выставке Самарканд**; заявка на участие в выставке | **book an exhibition stand Samarkand**; exhibitor application | **ko'rgazmada stend band qilish** |
| `/visitors/` | B | **посетителям выставок Самарканд**; билеты на выставку | **visit a trade show in Samarkand**; exhibition tickets | — |
| `/visitors/tickets/` | A | **билеты на выставку Самарканд**; регистрация на выставку | **exhibition tickets Samarkand**; visitor registration | — |
| `/visitors/travel/` | B | **как приехать на выставку в Самарканд** | **Samarkand hotels and visa for an exhibition** | — |
| `/visitors/programme/` | B | **деловая программа выставки** | **exhibition business programme** | — |
| `/visitors/access/` | C | **доступная среда на выставке** | **exhibition accessibility** | — |
| `/organizers/` | A | **аренда выставочного зала Самарканд**; площадка для мероприятия | **exhibition hall rental Samarkand**; event venue Samarkand | **Samarqandda ko'rgazma zali ijarasi** |
| `/organizers/rates/` | A | **стоимость аренды выставочного зала** | **exhibition hall rental rates** | — |
| `/organizers/conferences/` | A | **конференц-зал в Самарканде** | **conference venue Samarkand** | — |
| `/organizers/checklist/` | C | **чек-лист организатора мероприятия** | **event organiser checklist** | — |
| `/about/` | C | **SOF EXPO Samarkand о компании** | **about SOF EXPO Samarkand** | — |
| `/contacts/` | B | **SOF EXPO контакты телефон** | **SOF EXPO contacts** | — |
| `/news/` | C | **новости выставок Самарканд** | **exhibition news Samarkand** | — |
| `/articles/` | C | **статьи о выставках** | **trade show insights** | — |
| `/events/foodera-expo/` | A | **выставка продуктов питания Узбекистан 2026**; FOODERA EXPO 2026; выставка напитков | **food exhibition Uzbekistan 2026**; FOODERA EXPO 2026; food and beverage trade show | **oziq-ovqat ko'rgazmasi** |
| `/events/buildpro-expo/` | A | **строительная выставка Узбекистан 2026**; BUILD PRO EXPO 2026; выставка строительных материалов | **construction exhibition Uzbekistan 2026**; BUILD PRO EXPO 2026; building materials expo | **qurilish ko'rgazmasi** |
| `/events/agropro-expo/` | A | **сельскохозяйственная выставка Узбекистан 2027**; AGROPRO EXPO 2027; выставка сельхозтехники | **agriculture exhibition Uzbekistan 2027**; AGROPRO EXPO 2027; agricultural machinery show | **qishloq xo'jaligi ko'rgazmasi** |
| `/events/world-edu-expo/` | A | **выставка образования Самарканд 2027**; WORLD EDU EXPO 2027; обучение за рубежом | **education fair Uzbekistan 2027**; WORLD EDU EXPO 2027; study abroad fair | **ta'lim ko'rgazmasi** |
| `/events/ecom-retail-expo/` | A | **выставка e-commerce и ритейла Узбекистан**; ECOM & RETAIL EXPO 2027; маркетплейсы | **e-commerce and retail expo Uzbekistan**; ECOM & RETAIL EXPO 2027; marketplaces | **elektron tijorat ko'rgazmasi** |
| `/events/foodera-expo/exhibitors/` | A | **участие в выставке** | **exhibiting at the show** | — |
| `/events/foodera-expo/visitors/` | B | **посетителям выставки** | **visiting the show** | — |
| `/events/foodera-expo/program/` | B | **программа выставки** | **show programme** | — |
| `/events/buildpro-expo/exhibitors/` | A | **участие в выставке** | **exhibiting at the show** | — |
| `/events/buildpro-expo/visitors/` | B | **посетителям выставки** | **visiting the show** | — |
| `/events/buildpro-expo/program/` | B | **программа выставки** | **show programme** | — |
| `/events/agropro-expo/exhibitors/` | A | **участие в выставке** | **exhibiting at the show** | — |
| `/events/agropro-expo/visitors/` | B | **посетителям выставки** | **visiting the show** | — |
| `/events/agropro-expo/program/` | B | **программа выставки** | **show programme** | — |
| `/events/world-edu-expo/exhibitors/` | A | **участие в выставке** | **exhibiting at the show** | — |
| `/events/world-edu-expo/visitors/` | B | **посетителям выставки** | **visiting the show** | — |
| `/events/world-edu-expo/program/` | B | **программа выставки** | **show programme** | — |
| `/events/ecom-retail-expo/exhibitors/` | A | **участие в выставке** | **exhibiting at the show** | — |
| `/events/ecom-retail-expo/visitors/` | B | **посетителям выставки** | **visiting the show** | — |
| `/events/ecom-retail-expo/program/` | B | **программа выставки** | **show programme** | — |

## 4. Pul sahifalari: oldin → keyin

Ikkala ustun ham **bir xil** audit bilan o'lchangan (o'zgartirilmagan HEAD alohida worktree'da
yig'ildi).

| Sahifa | Asosiy so'rov | Oldin | Keyin |
| --- | --- | --- | --- |
| `/en/` | exhibition centre Samarkand | 80 | 95 |
| `/en/events/` | exhibitions in Samarkand 2026 | 55 | 95 |
| `/en/events/agropro-expo/` | agriculture exhibition Uzbekistan 2027 | 55 | 95 |
| `/en/events/agropro-expo/exhibitors/` | exhibiting at the show | 60 | 85 |
| `/en/events/buildpro-expo/` | construction exhibition Uzbekistan 2026 | 55 | 95 |
| `/en/events/buildpro-expo/exhibitors/` | exhibiting at the show | 75 | 100 |
| `/en/events/ecom-retail-expo/` | e-commerce and retail expo Uzbekistan | 55 | 70 |
| `/en/events/ecom-retail-expo/exhibitors/` | exhibiting at the show | 60 | 85 |
| `/en/events/foodera-expo/` | food exhibition Uzbekistan 2026 | 70 | 95 |
| `/en/events/foodera-expo/exhibitors/` | exhibiting at the show | 75 | 100 |
| `/en/events/world-edu-expo/` | education fair Uzbekistan 2027 | 55 | 95 |
| `/en/events/world-edu-expo/exhibitors/` | exhibiting at the show | 60 | 85 |
| `/en/exhibitors/` | exhibit at a trade show in Uzbekistan | 60 | 95 |
| `/en/exhibitors/packages/` | exhibition participation packages and rates | 75 | 100 |
| `/en/exhibitors/stand-construction/` | exhibition stand construction Samarkand | 35 | 85 |
| `/en/organizers/` | exhibition hall rental Samarkand | 35 | 95 |
| `/en/organizers/conferences/` | conference venue Samarkand | 0 | 85 |
| `/en/organizers/rates/` | exhibition hall rental rates | 55 | 95 |
| `/en/request-stand/` | book an exhibition stand Samarkand | 45 | 95 |
| `/en/venue/` | exhibition venue Samarkand | 55 | 95 |
| `/en/visitors/tickets/` | exhibition tickets Samarkand | 35 | 85 |
| `/ru/` | выставочный центр Самарканд | 45 | 95 |
| `/ru/events/` | выставки в Самарканде 2026 | 35 | 85 |
| `/ru/events/agropro-expo/` | сельскохозяйственная выставка Узбекистан 2027 | 55 | 95 |
| `/ru/events/agropro-expo/exhibitors/` | участие в выставке | 75 | 100 |
| `/ru/events/buildpro-expo/` | строительная выставка Узбекистан 2026 | 55 | 95 |
| `/ru/events/buildpro-expo/exhibitors/` | участие в выставке | 70 | 95 |
| `/ru/events/ecom-retail-expo/` | выставка e-commerce и ритейла Узбекистан | 55 | 70 |
| `/ru/events/ecom-retail-expo/exhibitors/` | участие в выставке | 55 | 80 |
| `/ru/events/foodera-expo/` | выставка продуктов питания Узбекистан 2026 | 55 | 95 |
| `/ru/events/foodera-expo/exhibitors/` | участие в выставке | 75 | 75 |
| `/ru/events/world-edu-expo/` | выставка образования Самарканд 2027 | 55 | 95 |
| `/ru/events/world-edu-expo/exhibitors/` | участие в выставке | 55 | 80 |
| `/ru/exhibitors/` | участие в выставке Самарканд | 10 | 95 |
| `/ru/exhibitors/packages/` | стоимость участия в выставке | 55 | 95 |
| `/ru/exhibitors/stand-construction/` | строительство выставочных стендов Самарканд | 35 | 85 |
| `/ru/organizers/` | аренда выставочного зала Самарканд | 0 | 85 |
| `/ru/organizers/conferences/` | конференц-зал в Самарканде | 0 | 85 |
| `/ru/organizers/rates/` | стоимость аренды выставочного зала | 55 | 95 |
| `/ru/request-stand/` | забронировать стенд на выставке Самарканд | 35 | 85 |
| `/ru/venue/` | выставочная площадка Самарканд | 10 | 85 |
| `/ru/visitors/tickets/` | билеты на выставку Самарканд | 35 | 85 |
| `/uz/` | Samarqand ko'rgazma markazi | 80 | 95 |
| `/uz/events/` | Samarqanddagi ko'rgazmalar 2026 | 35 | 85 |
| `/uz/events/agropro-expo/` | qishloq xo'jaligi ko'rgazmasi | 55 | 95 |
| `/uz/events/buildpro-expo/` | qurilish ko'rgazmasi | 55 | 95 |
| `/uz/events/ecom-retail-expo/` | elektron tijorat ko'rgazmasi | 55 | 95 |
| `/uz/events/foodera-expo/` | oziq-ovqat ko'rgazmasi | 55 | 95 |
| `/uz/events/world-edu-expo/` | ta'lim ko'rgazmasi | 55 | 95 |
| `/uz/exhibitors/` | ko'rgazmada ishtirok etish | 25 | 100 |
| `/uz/organizers/` | Samarqandda ko'rgazma zali ijarasi | 55 | 95 |
| `/uz/request-stand/` | ko'rgazmada stend band qilish | 45 | 95 |
| `/uz/venue/` | ko'rgazma maydoni Samarqand | 55 | 95 |

## 5. Qilinmagan ishlar va tavsiyalar

1. **Hajmlarni tekshirish.** Prioritetlar ekspert baholashi. Yandex Wordstat (RU), Google
   Keyword Planner (EN/UZ) va deploy'dan 4–6 hafta keyin Search Console'dagi haqiqiy
   so'rovlar bilan solishtiring; `keyword-map.mjs` dagi `p` ni yangilang.
2. **Lokal qidiruv.** «выставочный центр Самарканд» / «Samarqand ko‘rgazma markazi» uchun eng
   katta richag — sayt emas, **Google Business Profile va Yandex Maps** kartochkasi (nom, toifa
   «Выставочный центр», manzil, telefon, rasmlar, sharhlar). Sayt bunga NAP bilan mos:
   `organizationJsonLd()`.
3. **Backlink'lar.** ticketon.uz, Sotuvchilar assotsiatsiyasi, viloyat hokimligi, hamkor
   OTMlar — `docs/02 §8` dagi ro'yxat. On-page endi tayyor; off-page — keyingi qadam.
4. **O'zbek apostrofi.** Kataloglarda «ko‘» (U+2018) 302 marta, «ko'» (ASCII) 45 marta;
   rasmiy imlo — «koʻ» (U+02BB). Google odatda ularni tenglashtiradi, lekin bir xillik uchun
   bitta variantni tanlash kerak — bu qaror mijozniki, shuning uchun o'zgartirilmadi.
5. **Kirill yozuvidagi o'zbekcha so'rovlar** («кўргазма Самарқанд») hech qaysi tilda qamrab
   olinmagan. Agar Wordstat hajm ko'rsatsa — `uz-Cyrl` sahifalari yoki hech bo'lmasa
   description'larda kirill varianti.
6. **Maqola title'lari** hali ham kesiladi («How to choose an exhibition stand: 9, 18 or 36 m²…»
   → «How to choose an exhibition stand»). Kalit so'z oldinda turgani uchun zarar kam;
   ma'lumot so'rovlari (C) uchun alohida ko'rib chiqish mumkin.
7. **Brauzer testlari.** `a11y.spec.ts › ru` va `site.spec.ts › without JavaScript` HEAD'da
   ham tushadi (preview server bilan) — alohida tuzatish kerak.

## 6. Qanday ishlatish

```bash
npm run build
npm run audit:keywords                     # jadval + kannibalizatsiya + gate (A ≥ 70)
node scripts/keyword-audit.mjs dist --json out.json --min 80   # qattiqroq chegara, JSON hisobot
```

Yangi sahifa qo'shilsa — `scripts/keyword-map.mjs` ga yozuv qo'shing:
`k('so‘rov matni', ['o‘zak1', 'variant-a|variant-b'], 'A')`. Bo'lim sahifalari va ko'rgazma
ichki sahifalari (exhibitors/visitors/program) avtomatik qamrab olinadi.
