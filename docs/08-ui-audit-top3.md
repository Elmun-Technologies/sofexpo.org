# 08 · UI-audit 2026-09-21 — «SNGda istalgan Expo bo'yicha top-3» maqsadiga nisbatan

Buyurtmachi so'rovi: «UI uncha yoqmayapti — vizualizatsiyasi, joylashuv strukturasi. Maqsad — SNGda
har qanday Expo bo'yicha top-3'likda bo'lish. Har bir sahifaga individual kirib chiqish kerak».

Bu hujjat — ta'm haqida emas, o'lchanadigan narsalar haqida. Har bir kuzatuv (a) skrinshotda ko'rinadi,
(b) kodda aniq joyi bor, (c) nima qilish kerakligi yozilgan. Ko'rilgan: 17 sahifa (RU), 1440 px va 390 px,
`astro preview` ustida headless Chromium, `dist/` bo'yicha grep. Oldingi ikki dizayn-iteratsiya
(`docs/07`) hisobga olingan: v1 «bolalarcha / AI», v2 «dabdala», v3 (hozirgi) — toza, lekin **esda
qolmaydigan shablon**. Uchinchi xato — birinchi ikkitasining aksi bo'lib, o'z-o'zidan «top-3» bermaydi.

---

## 0. Qisqa xulosa (TL;DR)

| # | Muammo (tizimli) | Dalil | Ta'sir |
| --- | --- | --- | --- |
| 1 | **Ko'rinmas elementlar** — 4 ta kontrast-bug prodda | `/events/` featured-kartada sarlavha va chiplar oq-oqda; tadbir sahifasida «125 mln+ / $58–78 mlrd» raqamlari kulrangda kulrang; barcha hero'larda ghost-tugmalar qora-yashilda qora; `/events/` «идёт набор» chipi to'liq kenglikdagi qora blok | Birinchi ekranda CTA yo'qoladi → konversiya |
| 2 | **Ritm buzilgan** — sarlavha va uning kontenti orasida ~170 px bo'shliq | `Blocks.astro`: har blok alohida `<section class="sec">` (padding 4 rem × 2) + `.sec-head` margin | Sahifa «bo'sh», «tugallanmagan» ko'rinadi; skroll 30–40 % uzunroq |
| 3 | **Bir shablon × 40 sahifa** | Har ichki sahifa: kicker → h1 → lead → 3 chip → 2 tugma → o'ngda foto → stat-band → 4/6/8 oq karta → jadval | Sahifalar farqlanmaydi; foydalanuvchi «qayerdaman» bilmaydi |
| 4 | **Ierarxiya yo'q** — h2 max 1.6 rem, sana va raqamlar 0.8 rem mono | `--t-h2: 1.6rem`, `.ev__date .8rem`, `.mono-label .78rem` | Expo sayti uchun eng muhim ma'lumot — **sana** — eng kichik element |
| 5 | **Ko'rgazma brendlari ko'rinmaydi** | 6 tadbir — bitta yashil; faqat FOODERA'da alohida token to'plami bor, u ham faqat subdomen hostida | Top-3 saytlarda kalendar = 6 rang, 6 logotip; bizda 6 bir xil karta |
| 6 | **Foto yo'q** | `public/images/` — 10 ta render, hero'da 42 % opacity bilan | «AI ko'rinadi» da'vosi shu yerdan; hech qanday CSS buni yopmaydi |
| 7 | **Ichki kalitlar UI'ga oqib chiqqan** | `food`, `automotive`, `guide`, `foodera-expo`, `buyer`, `horeca`, `2026-09-16` | «Tugallanmagan mahsulot» hissi |
| 8 | **Header 3 qavat** | promo (40 px) + topbar (40 px) + nav (72 px) = 152 px; mobilda promo 5 qator | Birinchi ekranning 20 % i xizmat panellari; CTA ikki marta takrorlanadi |
| 9 | **Mobil bosh sahifa 19 549 px** (≈25 ekran) | 14 seksiya, stat-band 1 ustunda, kartalar cheksiz chiplar bilan | Mobil trafik SNGda 65–75 %; hech kim 25 ekran skroll qilmaydi |
| 10 | **Venue/kontakt sahifalarida asosiy narsa yo'q** | Zal rejasi (floor plan) yo'q, xarita yo'q, galereya 2 ta render, narx «по запросу» | Organizator va eksponent uchun qaror qabul qilish mumkin emas |

**Bugun tuzatildi** (Phase 0, §5): 1, 2, 7, qisman 8 va 9, `/news/` lead-karta, FOODERA'da dasturning
takrorlanishi. **Phase 1** (§5b) bilan 3, 4, 8, 9 va 10 yopildi — kalendar birinchi ekranda, sana
eng katta element, header 1 bar, bosh sahifa 14 → 6 seksiya, mobil 19 549 → 9 235 px, `/events/`
jadval-kalendar + filtr + `.ics`, tadbir overview 16 → ~10 blok, `/venue/` SVG-reja, `/contacts/`
statik xarita, `/organizers/` band sanalar, `/visitors/` bitta-oqim (rail → bilet → yo'l → mehmonxona
→ FAQ), `/exhibitors/` kalendar-reyka, mobil tadbir sahifasida sticky «Стенд» bari, `/` gate yopildi
(301 → `/en/`). **2026-09-22:** 5 host o'z palitra + wordmark + OG-kartalarini oldi
(`brand-map.json`, `scripts/build-assets.mjs`), mustaqil QA **0 topshiriq** (143 → 0).
Qolganlari — materialga bog'liq (Phase 2/3) va §7 ning Q4/Q5/Q7 qarorlari.

---

## 1. «Top-3 SNG» nimani anglatadi — benchmark

Ekspocentr (Moskva), Crocus Expo, ExpoForum (SPb), Atakent / QazExpo (Almati–Astana), UzExpoCentre
(Toshkent), BelExpo (Minsk) va xalqaro etalonlar (Messe Frankfurt, Koelnmesse, Fiera Milano) saytlarida
takrorlanadigan **umumiy mexanika** — ta'm emas, standart:

| Mexanika | Ular | Bizda hozir |
| --- | --- | --- |
| **Kalendar — birinchi ekran.** Keyingi 3–5 ko'rgazma sanasi bilan lenta/slayder; sana — eng katta shrift | ✓ hamma | Slogan «Здесь отрасль встречается лицом к лицу» + xira render; kalendar 3-seksiyada |
| **Har ko'rgazma — o'z brendi**: logotip, rang, o'z hero'si, o'z kartasi | ✓ hamma | Bitta yashil, logotip yo'q, karta bir xil |
| **Kalendar sahifasi**: oy/yil bo'yicha, tarmoq filtri, «.ics ga qo'shish», o'tgan/kelasi | ✓ | 5 karta + 1 karta (3+2 yetim) |
| **Venue**: zal rejasi (SVG/PDF/DWG), 3D-tur yoki galereya (20+ foto), yuk logistikasi sxemasi, sig'im jadvali | ✓ | Matn + jadval, 2 render |
| **Narx**: rate-card yoki «от N $/м²» | ✓ (kamida PDF) | «по запросу» 6 joyda |
| **Tashrif**: onlayn ro'yxatdan o'tish / bilet (Ticketon), xarita, mehmonxona | ✓ | Forma bor; xarita yo'q; Ticketon — matnda |
| **Ishonch**: haqiqiy fotolar, real hamkor logotiplari, o'tgan yillar raqamlari | ✓ | Renderlar, hamkor nomlari matn bilan, arxiv raqamlari bor (yaxshi) |
| **Yangiliklar** — foto bilan, sana odam tilida | ✓ | Lead-karta 520 px bilbord, qolganlari fotosiz, slug'lar |
| **Mobil**: bitta bar, 1 CTA, ≤ 8 ekran bosh sahifa | ✓ | 3 bar, 25 ekran |

Xulosa: top-3 uchun **estetika emas, tuzilma** yetishmayapti. Hozirgi kod bazasi (Astro, tokenlar,
blok-renderer, SEO-audit) buni ko'tara oladi — arxitekturani buzmasdan.

---

## 2. Diagnoz: nima uchun «yoqmayapti» — kod bilan

### 2.1 Kontrast-buglar (tuzatildi)

| Qayerda | Sabab | Tuzatish |
| --- | --- | --- |
| `/events/` featured `EventCard variant="wide"` `.sec--forest` ichida | `.sec--forest h3 { color:#fff }` oq kartaning h3'iga ham tushadi; `.ev` o'z rangini bermagan | `.ev { color: var(--ink) }` + `.sec--forest .ev h3 { color: var(--ink) }` |
| Tadbir sahifasi «Цифры и факты» (`sec--forest` + `.stats`) | `.stats { background: var(--line) }` (och kulrang setka) + `.sec--forest .stat { background: rgba(255,255,255,.04) }` → shaffof katak, orqadan kulrang; raqam `--gold-soft` (och) → och-ochda | `.sec--forest .stats` — oq 18 % chiziqlar, `.stat` — `--evergreen-2` qattiq plita, raqam oq |
| Ghost-tugmalar `.hero`, `.ehero`, `.sec--forest`, `.cta` | `.btn--ghost { --btn-fg: var(--ink); border-color: var(--line) }` — qorong'i fonda override yo'q | Qorong'i konteynerlarda `--btn-fg:#fff`, border oq 45 % |
| `/events/` `.quick` plitkalar | `.quick span { color: var(--ink-60) }` spetsifikligi `.chip--gold` dan yuqori; `display:grid` chipni cho'zadi | Alohida `.quick__date` / `.quick__status`, `justify-self:start` |

### 2.2 Ritm (tuzatildi)

`Blocks.astro` har blokni `<section class="sec">` qiladi (padding-block `--sec` = 2.4–4 rem). `h2`
bloki + `grid` bloki = 4 + 4 rem + `.sec-head` 2.6 rem = **~170 px** sarlavha va kartalar orasida.
Bir xil fondagi ketma-ket bloklar ham 8 rem bilan ajratilgan — shuning uchun sahifalar «cho'zilgan».

Endi: `h2` → `block--head` (pastki padding 0), keyingi blok → `block--after-head` (ustki padding 0),
bir fondagi qo'shnilar → `block--cont` (ustki padding × 0.45). `hero` va `faq` — chegara, ularga tegilmaydi.
Natija: `/exhibitors/` 4818 → 4523 px, tadbir sahifasi 8998 → 7984 px, `/news/` 3560 → 3006 px —
**kontentga tegmasdan**.

### 2.3 Ierarxiya (taklif, §6 Phase 1)

`docs/07 §7` da «plakat» dan qochish uchun shrift 2.4 rem bilan cheklangan. Muammo o'shanda o'lcham
emas, **CAPS + tracking + har joyda plakat** edi. Hozirgi ekstremal: h2 1.6 rem ≈ lead 1.09 rem — farq
1.5×, ko'z «sarlavha qani» deb qidiradi; sana `.ev__date` 0.8 rem — kartadagi eng kichik matn.

Taklif — bitta qoida: **ekrandagi eng katta element — sana yoki raqam, so'ng sarlavha, so'ng matn.**
`--t-hero` 2.9 rem, `--t-h2` 2.05 rem, kartada sana `1.9rem` display, kicker 0.8 rem oddiy registr
(CAPS yo'q). Bu «dabdala» emas — bu o'qiladigan ierarxiya; tracking va CAPS'siz.

### 2.4 Bir shablon (taklif, §4)

Barcha 32 authored sahifa + 24 tadbir sahifasi bitta ochilish bilan boshlanadi: `hero` (o'ngda 300 px
foto) → `stats` → `grid`. Bloklar to'plami yaxshi, lekin **kompozitsiya** har sahifada bir xil. §4 da
har sahifa turi uchun o'z ochilishi taklif qilinadi (kalendar, zal rejasi, xarita, narx jadvali va h.k.).

### 2.5 Brend va foto (qaror + material kerak, §7)

`src/data/brand-map.json` faqat FOODERA. Qolgan 5 ko'rgazma «markaz yuzida». Kalendar 6 bir xil
karta bo'lib qoladi, toki har ko'rgazmaga logotip (SVG) va 1 rang berilmaguncha. Fotolar — `docs/07 §4`
dagi 22 kadr ro'yxati kuchda; arxiv kataloglar (BUILD PRO 2023–2025, AGRO 2023–2026, WORLD EDU 2024)
mavjud — demak, real fotolar ham bor.

---

## 3. Global elementlar

### 3.1 Header (hozir: 3 qavat, 152 px)

```
[promo: ● Бронирование открыто · FOODERA … | Забронировать стенд | Об этой выставке → | Билет → | +998…]   40px
[topbar: 📍 Самарканд … | 📞 | ✉ | Пн–Пт | ✈ @sofexpomgr]                                                 40px
[nav: SE SOF EXPO SAMARKAND | Выставки Экспоцентр Экспонентам Посетителям Организаторам Новости О компании | RU EN | Забронировать стенд] 72px
```

Muammolar: CTA 2 marta; telefon 2 marta; «О компании» 2 qatorga sinadi (tuzatildi: `white-space:nowrap`);
mobilda promo 5 qator (tuzatildi: 1 fakt + 1 tugma).

Taklif (Phase 1):
- **Bitta bar** 64–72 px: logotip · 6 punkt · RU/EN · 1 CTA. Topbar kontaktlari → footer va `/contacts/`.
- Promo → **36 px yupqa lenta** faqat bosh sahifa va `/events/` da: «FOODERA EXPO · 20–22 okt · 28 kun qoldi → Стенд».
  Boshqa sahifalarda yo'q (sahifaning o'z CTA'si bor).
- Nav punktlarini 7 → 6: «Новости» va «О компании» ni «Центр» ostiga (mega-menyuda), yoki «Новости» ni
  footer'ga. Har punkt ostida mega-menyuda **sana bilan** ko'rgazmalar ro'yxati (hozir bor — yaxshi).

### 3.2 Footer — yetarli. Kichik: ijtimoiy tarmoqlar doiralari 40 px → ikonkalar qatori; «Наверх» keraksiz.

### 3.3 Tugmalar va chiplar
- 4 tugma ko'rinishi bor, lekin `.chip` ham havola sifatida ishlatiladi («Залы и площади →») — bu 5-chi
  tugma. Qoida: chip = **status** (sana, «идёт набор», «+9»), havola = matn havola yoki `.btn--ghost`.
- Karta ichidagi `tag-list` (3 chip + «+9») kartalar balandligini sindiradi → «12 разделов» bitta raqam.

### 3.4 Rang
Evergreen + grafit yaxshi asos. Yetishmaydi: (1) **signal rangi** — «осталось 38 стендов», «через 29 дн.»
uchun (taklif: g'isht `--danger #a33518` yoki amber; faqat status, tugmalarga emas); (2) **6 ko'rgazma
rangi** — `brand-map.json` ga 5 ta yozuv, kartada 4 px chap chiziq + sana bloki shu rangda.

---

## 4. Sahifama-sahifa

Format: **Hozir** → **Xato** → **Bo'lishi kerak** (wireframe) → **Prioritet** (P0 bug / P1 tuzilma / P2 material kerak).

### 4.1 `/` — til darvozasi (gate)

- **Hozir**: chap 50 % render, o'ng — «Русский / English» ikkita karta, 4 raqam, keyingi tadbir 1 qator.
- **Xato**: 2026 da til-darvoza — anti-pattern. Foydalanuvchi 1 qo'shimcha klik; Google uchun `/` eng
  kuchli URL, lekin unda 117 so'z («thin page», QA ham ko'rsatadi). Mobilda render 390 px balandlikda
  ma'nosiz.
- **Bo'lishi kerak** (2 variant, qaror sizniki — §7 Q1):
  - A. `/` = `Accept-Language` bo'yicha 302 → `/ru/` yoki `/en/` (Netlify/Cloudflare `_redirects` bilan,
    statik), `x-default` hreflang `/en/` ga. Darvoza yo'qoladi.
  - B. `/` = to'liq **EN bosh sahifa** (kanonik), RU — switcher orqali. Xalqaro auditoriya birinchi.
- ✅ **2026-09-22 qo'llandi (Q1 → A)**: darvoza olib tashlandi — har hostning `_redirects` ga
  `/ /en/ 301` yoziladi (build: `scripts/build-hosts.mjs`), `x-default` → `/en/`; statik hostlar
  uchun HTML-fallback (meta-refresh + «→ Главная на русском» havolasi). `_redirects` header'larni
  o'qimaydi, shuning uchun `Accept-Language` bo'yicha RU/EN kasrli variant sifatida
  `docs/06-deploy.md` da Cloudflare Redirect Rule (expression) tayyor turadi — istalgan payt yoqiladi.
- **P1.**

### 4.2 `/ru/`, `/en/` — bosh sahifa (14 seksiya, 10 667 px desktop / 19 549 px mobil)

- **Hozir**: hero (slogan + xira render + o'ngda countdown-karta) → stat-band → 5 tadbir kartasi (3+2)
  → venue (matn + 340 px tor jadval) → 4 «eshik» → qora «Форматы участия» → «Почему Самарканд» (6 mini +
  **yana o'sha 4 stat**) → dastur (4 qator) → 8 xizmat kartasi → 3 yangilik + 3 maqola → hamkorlar (matn)
  → FAQ → forma → CTA.
- **Xato**: (1) hero markazni sotadi, ko'rgazmani emas — countdown chetda; (2) 3+2 yetim kartalar;
  (3) stat-band 2 marta; (4) 14 seksiya — top-3 saytlarda 6–8; (5) 340 px jadvalda qiymatlar 3 qatorga
  sinadi; (6) yangilik kartalari fotosiz, sana ISO edi (tuzatildi); (7) hamkorlar — logotipsiz matn
  katakchalar — «hamkor yo'q» dek o'qiladi; (8) forma chap ustunida 60 % bo'sh joy.
- **Bo'lishi kerak** (7 seksiya):
  1. **Hero = keyingi ko'rgazma**: to'liq kenglikda real foto (FOODERA), chapda brend nomi + eng katta
     shrift bilan sana «20–22 OKT 2026», countdown, «Стенд» + «Билет»; pastda **kalendar-reyka**: keyingi
     4 ko'rgazma (rang chizig'i · sana · nom) — gorizontal, mobilda skroll.
  2. **Markaz 1 qatorda**: «SOF EXPO Samarkand — 4 400 м² · 5 000 м² · 700 кВт · 350 мест» + 1 foto +
     3 havola (zallar, texspes, yo'l). Jadval emas.
  3. **Kimga**: 3 eshik (Экспонент / Посетитель / Организатор) — press → footer.
  4. **Nima uchun Samarqand**: xarita-sxema (6 bozor, masofalar) + 4 raqam — **bitta** stat-band shu yerda.
  5. **Yangiliklar**: 1 lead (foto) + 3 qator.
  6. **Hamkorlar**: faqat logotip bo'lsa; yo'q bo'lsa — seksiya olib tashlanadi.
  7. **Forma** (2 ustun to'liq kenglikda) + FAQ akkordeon yonida.
- Mobil maqsad: ≤ 9 000 px.
- **P1**; hero-foto — **P2** (material).

### 4.3 `/events/` — afisha

- **Hozir**: h1 + 6 tez-plitka (5+1 yetim; chip buzilgan — tuzatildi) → qora fon, featured karta
  (sarlavha ko'rinmas edi — tuzatildi) → 3 karta + 1 karta → «Как выбрать» 6 ro'yxat → CTA.
- **Xato**: kalendar emas, kartalar to'plami. Xronologiya yo'q, tarmoq filtri yo'q, oy ko'rinmaydi.
- **Bo'lishi kerak**: **jadval-kalendar** (top-3 standarti):
  ```
  2026  │ OKT 20–22 │ ■ FOODERA EXPO        │ Продукты и напитки │ идёт набор │ Стенд · Билет
        │ NOY 9–11  │ ■ BUILDPRO EXPO       │ Строительство      │ идёт набор │ …
  2027  │ MAR 2–4   │ ■ AGROPRO EXPO        │ Агропром           │ …
        │ APR 9–10  │ ■ WORLD EDU           │ Образование        │
        │ IYUN 16–17│ ■ ECOM & RETAIL       │ E-commerce         │
  Arxiv │ SEN 12–13 │ ■ PROMOTORS SHOW 2026 │ Авто               │ отчёт      │ Итоги →
  ```
  Ustida: tarmoq bo'yicha filtr-chiplar (CSS `:has()` / `data-industry`, JS'siz), «Скачать календарь
  (.ics)» — statik fayl, build'da `events.ts` dan generatsiya. Pastda — kartalar galereyasi (foto bilan)
  ixtiyoriy. Har qator — ko'rgazma rangi bilan 4 px chiziq.
- **P1**; `.ics` — P1 (30 qator skript).

### 4.4 `/events/{slug}/` — ko'rgazma sahifasi (+ `/exhibitors/`, `/visitors/`, `/program/`)

- **Hozir**: yashil hero (foto yo'q, ghost-tugmalar ko'rinmas edi — tuzatildi) → evnav → «Цифры»
  (ko'rinmas edi — tuzatildi) → 4 profil → matn → sariq-gradient callout (palitradan tashqarida —
  tuzatildi) → dastur 4 qator → 3 stat → CTA → 12 bo'lim-chip → **dastur yana** (FOODERA — tuzatildi) →
  auditoriya (`buyer/horeca` kalitlari — tuzatildi) → venue 4 karta → 2 fayl havola → FAQ → 3 karta.
- **Xato**: hero'da ko'rgazma yuzi yo'q — na logotip, na foto, na rang; 16 blok, 9 000 px; evnav'da
  «Каталог уча…» kesiladi (`overflow` — P0 kichik); materiallar 2 ta inline havola.
- **Bo'lishi kerak**:
  1. **Hero — brendlangan**: ko'rgazma rangi fon, logotip (SVG), sana 3 rem, joy, countdown, 2 CTA; o'ngda
     real foto o'tgan nashrdan (yoki afisha).
  2. **Fakt-lenta**: 4 raqam (bo'limlar, eksponentlar o'tgan yil, tashrifchilar, mamlakatlar).
  3. **Kimga / nima beradi** — 4 profil (bor).
  4. **Bo'limlar** — 12 chip (bor) + «Скачать список экспонентов 2025 (PDF)».
  5. **Dastur** — kun bo'yicha tab: 20 okt / 21 okt / 22 okt (hozir `program` massivi kunlarsiz —
     `events.ts` ga `day` maydoni).
  6. **Ishtirok**: 3 stend-paket **narxi bilan** («от … $/м²») — §7 Q4.
  7. **Materiallar**: prezentatsiya · katalog · zal rejasi · reglament — 4 karta, PDF hajmi bilan.
  8. FAQ · Boshqa ko'rgazmalar · Forma (`event` oldindan tanlangan — bor).
  Sub-sahifalar: `/exhibitors/` = 6 dan boshlanadi, `/visitors/` = bilet/ro'yxat + xarita + mehmonxona,
  `/program/` = 5 dan boshlanadi. Hozir sub-sahifalar overview'ni 70 % takrorlaydi.
- **P1** (tuzilma), **P2** (logotip, foto, narx).

### 4.5 `/exhibitors/` klasteri (9 sahifa)

- **Hozir**: standart ochilish → 4 stat → «Что даёт участие» + 6 karta (170 px bo'shliq — tuzatildi) →
  jadval «Кто приходит» → paketlar → … `/packages/`: 4 paket kartasi, jadval «да / нет / по запросу».
- **Xato**: narx yo'q — eksponentning 1-savoli; `/floor-plan/` sahifasida **zal rejasi yo'q** (PDF havola);
  `/documents/` — 21 ta placeholder PDF; `/catalogue/` — ro'yxat emas.
- **Bo'lishi kerak**: `/exhibitors/` = 3 qadam (Выбрать выставку → Выбрать стенд → Заявка) + narx jadvali
  (kamida «от») + kalendar-reyka + forma. `/packages/` = **taqqoslash jadvali** ustunlar sifatida 3 paket,
  narx qatori birinchi. `/floor-plan/` = **SVG reja** (`64 px modul setkasi` `docs/07` da bor edi — uni
  ma'lumot bilan: zonalar, kirish, yuk darvozasi, elektr shchitlar) + «Скачать DWG/PDF».
- **P1** (tuzilma, SVG), **P2** (narx, real PDF).

### 4.6 `/visitors/` klasteri

- **Hozir**: standart ochilish → 4 qadam → 4 sabab → jadval → …
- **Xato**: «Зарегистрироваться» tugmasi bor, lekin ro'yxatdan o'tish oqimi yo'q (Ticketon havolasi
  matnda); xarita yo'q; «что взять с собой» kabi matnlar 3 sahifaga tarqalgan.
- **Bo'lishi kerak**: 1 sahifa: **Qaysi ko'rgazma?** (kalendar-reyka) → **Bilet** (bepul ro'yxat / Ticketon
  tugmasi, QR haqida 1 jumla) → **Qanday borish** (xarita + aeroport/vokzal 16/23 km + taksi/transfer) →
  **Qayerda turish** (3 mehmonxona-hamkor) → FAQ. `/tickets/`, `/how-to-get-there/` — anchor'lar.
- **P1**; Ticketon integratsiya — §7 Q5.

### 4.7 `/organizers/` klasteri

- **Hozir**: standart ochilish → 6 karta → 4 qadam → jadval → `/rates/` «по запросу».
- **Xato**: organizatorga kerak: sig'im (teatr/klass/banket), band sanalar, ijaraga nima kiradi,
  texnik rayder, **narx** — ulardan faqat qisman jadval bor. Sanalar kalendari yo'q.
- **Bo'lishi kerak**: **Konfigurator-jadval**: zal · maydon · sig'im (3 konfiguratsiya) · elektr · nima
  kiradi; **Band sanalar** — `events.ts` dan avtomatik (montaj ±2 kun bilan) — «свободно с … по …»;
  **Texnik rayder** (PDF); **Rate-card** «от … за день»; **3 keys** (o'tgan tashqi tadbirlar, agar bo'lsa);
  forma «Расчёт даты».
- **P1** (band sanalar — 20 qator kod), **P2** (narx).

### 4.8 `/venue/` klasteri (6 sahifa)

- **Hozir**: standart ochilish → 4 stat → 4 element → jadval → … `/halls/` = matn + jadval, `/gallery/` =
  2 render, `/how-to-get-there/` = matn, xaritasiz.
- **Xato**: expo-markaz sayti uchun eng zaif klaster. Zal rejasi, o'lchamlar, balandlik («уточняется»),
  pol yuklamasi («уточняется»), yuk darvozasi o'lchami — organizatorning shartnoma savollari.
- **Bo'lishi kerak**: `/venue/` = **1 ekran = 1 sxema**: bino plani (SVG, o'lchamlar bilan: zal 4 400 м²,
  ochiq maydon 5 000 м², konferens, kafe, kirish, parking, yuk darvozalari) + har zona bosilganda spec-karta
  (CSS `:target`/`details`, JS'siz). Keyin galereya (≥ 12 real foto), texspes jadvali (to'liq),
  logistika (aeroport/vokzal/Termez yo'li). `/halls/` = shu SVG + har zal alohida.
- **P1** (SVG — biz chizamiz, o'lchamlar sizdan), **P2** (foto, «уточняется» qiymatlari).

### 4.9 `/news/`, `/articles/`, `/news/{slug}/`

- **Hozir**: lead-karta 520 px bilbord (tuzatildi: foto yonma-yon), slug'lar `food`/`foodera-expo`
  (tuzatildi), qolgan yozuvlar fotosiz qatorlar oy bo'yicha; maqola sahifasi — sidebar bilan, yaxshi.
- **Xato**: yangiliklar — barcha renderlar ichida eng «tirik» joy bo'lishi kerak; hozir eng quruq.
  5 yangilik + 8 maqola uchun 2 alohida indeks — ko'p.
- **Bo'lishi kerak**: `/news/` = lead + 2 karta (foto) + qatorlar; har yangilikda `hero` maydoni
  to'ldiriladi (real foto); `/articles/` — «Практика» bo'limi sifatida `/news/` ichida tab (URL saqlanadi).
- **P1** kichik; foto — P2.

### 4.10 `/about/`, `/about/team/`, `/about/partners/`

- **Hozir**: standart ochilish; jamoa — kartalar fotosiz; hamkorlar — nomlar.
- **Bo'lishi kerak**: `/about/` = 1 sahifa: 3 xatboshi + xronologiya (2019 → 2026: nashrlar soni yil
  bo'yicha — `archive.ts` dan) + jamoa (foto bilan, 6–8 kishi) + hamkor logotiplari (SVG/PNG) + rekvizitlar.
  `/team/`, `/partners/` — anchor.
- **P2** (material: foto, logotiplar).

### 4.11 `/contacts/`

- **Hozir**: standart ochilish (o'ngda render!) → 4 karta (birida adashgan «→») → bo'limlar jadvali →
  forma.
- **Xato**: **xarita yo'q**. Kontakt sahifasi = xarita + telefon + forma; render bu yerda keraksiz.
- **Bo'lishi kerak**: chapda xarita (Yandex/Google static image yoki iframe; `site.location.lat/lng`
  `needsVerification` — tekshirish kerak), o'ngda: manzil, 2 telefon (kim uchun), email, Telegram, ish
  vaqti, «как добраться» 3 qator (aeroport 16 km · vokzal 23 km · taksi ~ N min); pastda bo'limlar jadvali
  va forma.
- **P1** (xarita statik rasm bo'lsa — 0 tashqi so'rov; iframe — 1 tashqi so'rov, §7 Q3).

### 4.12 `/request-stand/`, `/search/`, `404`

- Forma sahifasi yaxshi; `event` GET-parametridan oldindan tanlash bor. Qo'shimcha: 3 qadam indikatori
  va «что будет после отправки» (24 soat, PDF, manager).
- `/search/` — ishlaydi; natijalarga turi (Выставка / Страница / Новость) rangli teg.
- `404` — 3 havola + qidiruv; yetarli.

### 4.13 Mobil (390 px)

- Tuzatildi: promo 5 → 1–2 qator; stat-band 1 → 2 ustun.
- Qoladi (P1): hero'da countdown-karta 2-ekranga tushadi → sana + «через 28 дн.» 1 qatorda hero
  matni ostida; kalendar-reyka gorizontal skroll; tadbir kartasi ixcham (foto 16:9 → 3:2, chiplar yo'q);
  evnav — gorizontal skroll bilan «Стенд» tugmasi doim ko'rinadigan (sticky pastda, 56 px).

---

## 5. Bugun tuzatilgan (Phase 0) — fayllar

| Fayl | Nima |
| --- | --- |
| `src/styles/global.css` | ghost-tugmalar qorong'i fonda oq; `.sec--forest .stats` plita+chiziqlar; `.ev` rangi; `.callout` gradientlari → tekis; `.nav__link nowrap`; promo mobil; stat-band 2×2; evnav'da ikkinchi tugma ≤ 1440 px da yashirin («Каталог участников» kesilmaydi) |
| `src/components/Blocks.astro` | `block--head` / `block--after-head` / `block--cont` — sarlavha o'z kontentiga yopishadi, bir fondagi bloklar orasida yarim padding |
| `src/lib/labels.ts` (yangi) | `industryLabel()` — `food`→«Продукты и напитки» va h.k.; `humanDate()` — `2026-09-16`→«16 сентября 2026» |
| `src/components/PostCard.astro` | kategoriya va tadbir slug'lari o'rniga nomlar; lead-karta foto yonma-yon (≥ 900 px) |
| `src/pages/[locale]/events/index.astro` | `.quick` chip bugi; umumiy `industryLabel` |
| `src/pages/[locale]/index.astro` | media-kartalarda odam tilidagi sana |
| `src/components/EventSections.astro` | auditoriya ro'yxatidan ichki kalitlar (`buyer`, `horeca`) olib tashlandi |
| `src/components/EventHero.astro` | kicker fallback `FOOD` → tarmoq nomi |
| `src/data/pages/event-pages.ts` | FOODERA overview: dastur ikki marta emas (authored `rows` qoladi, `programme` — `/program/` da) |

Tekshiruv: `npm run check` → 152 sahifa, SEO-audit «no problems»; `build:hosts` 6 host;
`qa-independent.py` — o'sha 8 qoida / 75 ta (yangi tur yo'q); hover'da `translate`/`scale` — 0,
`@keyframes` — 0; yig'ilgan CSS'da qolgan 4 gradient — hammasi foto/fon ustidagi o'qiluvchanlik
qatlami (`.hero__media::after`, `.ehero::after` ×2, `.tile__body`), dekorativ gradient — 0.

## 5b. Phase 1 · Tuzilma — bajarildi (2026-09-21)

§4 dagi P1-lar bajarildi. **URL, host-model, SEO-kontrakt, QA qoidalari o'zgarmadi** — faqat
tuzilma, ierarxiya va uch yangi blok turi (`plan`, `map`, `calendar`-reyka). O'lchangan natija:

| O'lchov | Oldin | Endi |
| --- | --- | --- |
| Bosh sahifa, desktop | 10 667 px (14 seksiya) | **6 174 px (6 seksiya)** |
| Bosh sahifa, mobil | 19 549 px (≈25 ekran) | **9 235 px (≈13 ekran)** |
| `/events/`, desktop | 4 818 px (karta to'plami) | **2 272 px (jadval-kalendar)** |
| Tadbir overview, desktop | 8 998 px (16 blok) | **6 703 px (dastur kun bo'yicha, takrorlanishlarsiz)** |

Nima qilindi, faylma-fayl:

| Fayl | Nima |
| --- | --- |
| `src/styles/global.css` | Shrift shkalasi ko'tarildi (`--t-hero` 2.9 rem, `--t-h2` 2.05 rem, yangi `--t-date` 1.95 rem) — qoida «eng katta element = sana/raqam». Header 3 qavat → 1 bar (topbar olib tashlandi, `--header-h` 72 px qoldi). Promo 36 px yupqa lenta. `/events/` jadval-kalendar (`.cal`), tarmoq rangi 4 px chiziq, CSS `:has()` filtr. Bosh sahifa hero (`.home-hero`) + kalendar-reyka (`.rail`), venue 1 qator (`.venue-strip`). Tadbir kartasi (`.ev`) — sana katta, chiplar yo'q, «N разделов» bitta raqam |
| `src/components/Header.astro` | 3 bar → **1 bar**: logotip · 6 punkt · RU/EN · 1 CTA. Topbar (manzil/telefon/pochta) → `/contacts/` va footer. Nav 7 → 6 («Новости» footer'da qoldi) |
| `src/components/PromoBar.astro` | 152 px'lik 3 qavatdan **faqat bosh sahifa + `/events/`** da 36 px: brend · sana · «через N дн.» · 1 «Стенд» tugma. Sana o'tgach keyingi ko'rgazmaga o'tadi |
| `src/pages/[locale]/index.astro` | **14 → 6 seksiya**: (1) hero = keyingi ko'rgazma — eng katta shrift bilan sana, countdown, kalendar-reyka; (2) markaz 1 qator; (3) 3 eshik; (4) Samarqand + **bitta** stat-band; (5) yangiliklar 1 lead + 3 qator; (6) forma + FAQ. Olib tashlandi: 2-marta stat-band, «Форматы участия», 8 xizmat kartasi, logotipsiz hamkorlar, 3+2 yetim karta to'plami |
| `src/pages/[locale]/events/index.astro` | Karta to'plami → **jadval-kalendar**: sana bloki (katta), tarmoq rangi chiziq, tarmoq, status, «Стенд/Билет». Ustida **tarmoq filtri** (JS'siz, `:has()`) + «Скачать календарь (.ics)». O'tganlar — «архив / Итоги →» |
| `src/components/EventCard.astro` | Sana — katta display bloq, chapda tarmoq rangi 4 px chiziq, `tag-list` chiplari → «12 разделов» bitta raqam |
| `src/components/EventHero.astro` | Sana hero'da **eng katta element** (2.2–3.6 rem) — 0.95 rem fakt-ro'yxatidan olib, alohida qator qilindi |
| `src/components/EventSections.astro` | «Деловая программа» — **kun bo'yicha** tab (20 окт / 21 окт …), `events.ts` ga `day` maydoni qo'shildi |
| `src/data/events.ts` | Har dastur yozuviga `day` (kun) maydoni |
| `src/components/CalendarRail.astro` (yangi) | Bosh sahifa kalendar-reyakasi: keyingi 4 ko'rgazma, rang chizig'i · sana · nom; mobilda gorizontal skroll |
| `src/components/VenuePlan.astro` (yangi) + `Blocks.astro` `plan` | `/venue/` — **1 ekran = 1 sxema**: zonalar, maydonlar, kirish, yuk davori, parковка, 64 px modul setkasi. «Схема, не в масштабе» + texspes havolasi. Aniq o'lchamlar (balandlik, pol yuklamasi) Phase 3 da `site.ts` dan to'ldiriladi |
| `src/components/MapSchema.astro` (yangi) + `Blocks.astro` `map` | `/contacts/` — **statik xarita-sxema** (0 tashqi so'rov): aэропорт 16 km, вокзал 23 km, Termez M-40, pinn + Yandex/Google/2GIS havolalari. `site.location.lat/lng` (`needsVerification`) tagida «координаты подтвервляются» yozuvi |
| `src/data/pages/organizers.ts` | **Band sanalar** — `events.ts` dan avtomatik (montaj −2 / demонтаж +2 kun), jadval ko'rinishida; afisha o'zgarganda o'zi qayta hisoblanadi |
| `src/data/pages/venue.ts`, `company.ts` | `/venue/` ga `plan`, `/contacts/` ga `map` bloklari; contact hero'dan render olib tashlandi |
| `scripts/ics.mjs` (yangi) + `astro.config.mjs` | `/sofexpo-calendar.ics` — **build'da** `events.ts` dan generatsiya (Astro integratsiyasi), har hostning `dist/` ga yoziladi; `events.ts` bilan doimo sinxron, `public/` da eskiruvchi fayl yo'q |
| `src/data/pages/event-pages.ts` | Overview'larda takrorlanishlar olib tashlandi: «stats» (factlarni takrorlaydi) va «cta» (CtaBand takrorlaydi) bloklari; FOODERA dastur `rows` takrori o'rniga data-driven by-day |
| `src/components/EventPage.astro` | **Mobil sticky-CTA** (§4.13): ≤780 px da ekran tagida 56 px bar — `shortName` · sana · «Стенд» (o'tganlar uchun «Следующая редакция»). Desktop'ta `display:none`, state-only, evergreen fon |
| `src/components/CalendarRail.astro` | `tone` prop qo'shildi: `dark` (bosh sahifa hero) / `light` (yorug' seksiyalar uchun — paper karta, moss sana) |
| `src/data/pages/types.ts` + `Blocks.astro` | Yangi blok turi `rail` (+ `railCount`) — kalendar-reyka istalgan blok-sahifaga o'rnatiladi |
| `src/data/pages/visitors.ts` | **`/visitors/` bitta-oqim** (§4.6): hero → «Какая выставка ваша» (rail) → «Регистрация вместо очереди» (grid2: trade bepul / festival biletli) → «16 км / 23 км» (xarita + 3 yo'l) → Reikartz −15% callout → FAQ → havolalar. Detailar sub-sahifalarda qoladi |
| `src/data/pages/exhibitors.ts` | `stats` dan keyin **rail** (§4.5): «Выберите свою выставку» — keyingi 4 ta, status bilan; 5-qadam bloki o'z joyida |

Tekshiruv: `npm run check` → 152 sahifa, SEO-audit «no problems»; `check:hosts` → 6 host, «hosts
agree»; `qa-independent.py` — yangi tur yo'q (faqat eski 8 qoida / 75 ta). CSS `:has()` filtr
headless Chromium'da tekshirildi (6 → 1 qator). `.ics` valid VCALENDAR (6 VEVENT). Hover'da
`translate`/`scale` — 0, `@keyframes` — 0. Mobil sticky-CTA headless'da ko'rishga tasdiqlandi
(FOODERA host, 390 px: bar hero'dan footergacha yopishib turadi). `/ru/visitors/` (4 530 px
desktop / 6 301 px mobil) va `/ru/exhibitors/` (4 706 px) ssuralari ko'rib chiqildi.

**Qolgan (Phase 1 dan tushib qolgan):** tadbir kartasidagi «rang chizig'i» endi tarmoq rangida,
lekin **ko'rgazma brendi/logotipi** — Phase 2 (material). `/exhibitors/` narx jadvali va real
PDF'lar — Phase 3 (Q4). Bilet-oqimi narxlarsiz qurildi (trade = bepul registratsiya,
festival = Ticketon) — narx chiqqach 1 satr. **`/` gate — 2026-09-22 yopildi** (Q1 → A: 301).

---

## 6. Roadmap

| Faza | Muddat | Nima | Sizdan kerak |
| --- | --- | --- | --- |
| **0 · Buglar** | ✅ 2026-09-21 | §5 | — |
| **1 · Tuzilma** | ✅ 2026-09-22 | §5b — to'liq: kalendar-first, /visitors/ oqimi, /exhibitors/ rail, mobil sticky-CTA, `/` gate yopildi (Q1 → A, 301 → /en/) | — (narx/PDF Phase 3, zal o'lchamlari Phase 3) |
| **2 · Identifikatsiya** | qisman ✅ 2026-09-22, fotolar kelgach 2–3 kun | ✅ 5 host: palitra + wordmark `brand-map.json` da, OG-kartalar, faviconlar (`scripts/build-assets.mjs`). ⏳ Organizator logotiplari (5 ta) → `mark: "star"` + huddi o'sha `favicon.svg`; real fotolar 1:1 fayl nomi bo'yicha; hamkor logotiplari; jamoa fotolari | Logotiplar (SVG/AI), 22 kadr (`docs/07 §4`), hamkor logotiplari |
| **3 · Kommersiya** | narxlar kelgach, 2 kun | Rate-card jadvallari (`/packages/`, `/organizers/rates/`, tadbir sahifasi), «уточняется» 6 joy o'rniga qiymatlar, real PDF (21 fayl) | Narxlar, texspes qiymatlari, PDF'lar |

Phase 1 kodda hech narsani buzmaydi: URL, host-model, SEO-kontrakt, audit qoidalari o'zgarmaydi;
`Blocks` tizimiga 3 yangi blok turi qo'shiladi (`calendar`, `plan`, `map`), qolgani — mavjud bloklar
kompozitsiyasi va tokenlar.

---

## 7. Sizdan qaror kutiladigan savollar

1. **`/` darvoza**: A (til bo'yicha redirect) yoki B (`/` = EN bosh sahifa)? ✅ **Yopildi 2026-09-22 → A**:
   `_redirects` ga `/ /en/ 301` (har host), `x-default` → `/en/`, HTML-fallback sahifa.
   `Accept-Language` kasrli variant — `docs/06-deploy.md` (Cloudflare Redirect Rule).
2. **Hero yo'nalishi**: «keyingi ko'rgazma» (kalendar-birinchi, tavsiya) yoki «markaz» (hozirgi)?
3. **Xarita**: statik rasm (0 tashqi so'rov, tez, klik → Yandex/Google) yoki iframe (interaktiv, +1 tashqi
   so'rov, cookie)? Tavsiya: **statik**, tagida 3 havola (Yandex · Google · 2GIS).
4. **Narx**: «от … $/м²» ko'rsatishga ruxsat bormi? Top-3 saytlar kamida rate-card PDF beradi. Narx
   bo'lmasa — «по запросу» o'rniga «прайс за 24 часа» + forma (yumshoqroq, lekin baribir zaif).
5. **Bilet**: Ticketon (yoki boshqa) bilan to'g'ridan-to'g'ri havola/vidjet bormi? Bo'lsa — «Получить
   билет» tugmasi tashqi oqimga, forma faqat eksponentlar uchun qoladi.
6. **Signal rang**: «осталось 38 стендов / через 29 дней» uchun g'isht `#a33518` (bor) yoki amber?
   Yoki umuman yo'q (hozirgi)?
7. **Materiallar**: 6 logotip (SVG), fotoarxiv 2023–2026, hamkor logotiplari — kim va qachon beradi?
   Bularsiz Phase 2 boshlanmaydi, va «AI ko'rinadi» da'vosi to'liq yopilmaydi.
