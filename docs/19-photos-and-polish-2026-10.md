# 19 · Haqiqiy suratlar va eski dizaynni tozalash (2026-10-12)

> **Yangilanish (2026-10-12, keyinroq):** buyurtmachi redizaynni davom ettirishni so'radi —
> 1–2-fazalar qayta tiklandi va shu hujjatdagi ish bilan birlashtirildi (docs/18 §9–12).

Qaror (buyurtmachi, 2026-10-12): yangi redizayn (docs/18, 1–2-fazalar) **qabul qilinmadi** va
`git revert` bilan qaytarildi — sayt eski dizaynida qoladi. FOODERA EXPO 2026 sanasi
(27–29 oktabr) saqlandi. Vazifa: sofexpo.uz suratlari bilan saytni boyitish va eski
dizayndagi g'alati joylarni tuzatish.

## 1. Suratlar

- Manba: mijoz paketidagi `public/images/photos/` (CREDITS.md: sofexpo.uz'dan olingan,
  RESOF EXPO mulki). Stok (Pexels) suratlar ishlatilmadi. 40 ta asl kadr
  `images/sofexpo-uz/` ga qo'shildi.
- 28 ta mavjud nom endi 768 px CMS eskizlari o'rniga shu kadrlarning 1536–1800 px
  asl nusxasidan quriladi (masalan `buyers-talk`, `opening-ceremony`, `cafe-interior`,
  `conference-room` — oldin 300 px'dan kattalashtirilgan edi).
- Mazmuniga mos kelmagan nomlar to'g'rilandi: `students-campus` (ochilish marosimi edi →
  WORLD EDU talabalari), `event-worldedu` (spiker edi → WORLD EDU zali), `venue-facade`
  (`venue-exterior` nusxasi edi → binoning o'zi), `office-people` (diagramma → muzokara xonasi).
- 16 ta yangi nom (`hall-aerial`, `hall-wide`, `hall-busy`, `stand-two-level`,
  `stand-falcon`, `stand-nrg`, `stand-basalt`, `stand-shell`, `conference-stage`,
  `conference-rows`, `meeting-room` …). Natijada bir xil surat takrorlanishi:
  `hall-stand` 32 → 0, `conference-audience` 30 → 12, `hall-crowd` 22 → 9 joy.
  Har bir sahifaga alt matniga mos kadr tanlandi.
- `npm run photos <nom> …` endi faqat ko'rsatilgan nomlarni qayta quradi (butun kutubxona
  qayta kodlanmaydi) va eski rung'larni o'chiradi.

## 2. Eski dizayndagi tuzatishlar

- **Tarjima xatosi (butun sayt):** ikkita JSX ifodasi yonma-yon kelgan matnda (ikki bo'sh
  joy) dinamik tarjima natijasi yozilmasdi — kalendar va kartalarda ZH/TR/UZ sahifalarda
  "The fifth international … · in 28 d" inglizcha qolardi. `scripts/localization.mjs` tuzatildi.
- **Bosh sahifa:** galereyaning 6-surati butun kenglikda 190 px'lik ingichka lenta edi —
  2 ta surat qo'shilib, setka to'liq yopildi. "Bitta bino, ikki maydon" bloki uch ustunda
  siqilgan edi (matn 0.84rem, 220 px eskiz) — endi chapda bino surati, o'ngda raqamlar va matn.
- **Kalendar `/events/`:** o'tgan PROMOTORS SHOW endi ro'yxat oxirida; status pill'i
  ("arizalar ochiq") kesilmaydi; uzun nom "…" bilan uzilmaydi.
- **Markaz sxemasi:** "tashrif buyuruvchilar kirishi" va "yuk mashinalari kirishi" ustma-ust
  edi, elektr xonasi yozuvi qutidan chiqardi, "Avtoturargoh" yuk joyiga kirib ketardi —
  qayta joylandi. Noto'g'ri tarjimalar tuzatildi (zh "交换室" → "配电室", tr "Anahtar Oda" →
  "Elektrik odası" va h.k.).
- **CTA kartasi:** markazga tekislangan emoji + to'liq kenglikdagi tugma o'rniga bir qator:
  chiziqli ikonka, matn, tugma.
- **Mobil footer:** kompaniya matni tor ustunda so'zma-so'z uzilardi — endi to'liq kenglikda.

## 3. Har bir ko'rgazmaning o'z uslubi (logotip ranglaridan)

Umumiy karkas — SOF EXPO; har bir ko'rgazma sahifasi o'z logotipi ranglarini oladi
(`src/data/brand-map.json`, hammasi `scripts/check-brand-contrast.mjs` bo'yicha WCAG AA):

| Ko'rgazma | Logotip ranglari | Hero foni | Asosiy tugma | Imzo chizig'i |
| --- | --- | --- | --- | --- |
| FOODERA | ko'k #2490CC, oltin #CCA878 | ko'k | oltin | ko'k / oltin |
| BUILD PRO | grafit, teal #0C8484 → ko'k #244884 | grafit | teal | teal → ko'k |
| AGROPRO | yashil #90C048, sariq #FCD83C, qizil #CC3024 | dala yashili | quyosh sarig'i | yashil / sariq / qizil |
| WORLD EDU | to'q moviy #246078, havorang #00B4E4 | to'q moviy | havorang | moviy / havorang |
| ECOM & RETAIL | qora, teal #60C0C0 | qora | teal | teal |
| PROMOTORS | qora, qizil #E43018 | qora | qizil | qizil |

- AGROPRO va WORLD EDU palitralari logotip kelguncha taxminiy edi (WORLD EDU — bordo);
  endi haqiqiy logotipdan. Ikkala logotip ham saytga qo'shildi (`npm run logos`) — hero,
  kalendar va kartalarda harf o'rniga logotip.
- Hero: parda brend rangida (oldin 70% qora — hamma ko'rgazma deyarli qora edi), tepada
  6 px logotip ranglaridagi chiziq, asosiy tugma ko'rgazma aksentida (oldin fon rangida —
  ko'rinmasdi).
- Imzo chizig'i (`--brand-stripe`) yana tablar ostida va footer tepasida; markaz
  sahifalarida SOF EXPO logotipining yashil / moviy / qizil ranglari.
- Markaz sahifalarida (kalendar, bosh sahifa tasmasi, kartalar) har bir qatorning chizig'i
  soha emas, ko'rgazmaning o'z rangi (`showColor()`).
- Qattiq kodlangan markaz yashili (`rgba(29,122,72)`) va bronza (CTA, formalar, karta hover)
  tokenlarga bog'landi — ko'rgazma sahifalarida yashil dog' qolmadi.
- O'tgan nashr heroida "Chipta olish", "Kalendarga qo'shish" va o'ziga ishora qiluvchi
  "Keyingi nashr" o'rniga — "Ko'rgazmadan keyingi hisobot" va "Barcha ko'rgazmalar".
- Ko'rgazma sahifasidagi "Materiallar" ro'yxati uslubsiz bir qator havola edi (uslub faqat
  Blocks ichida edi) — endi kartalar.

## 4. Tekshiruvlar

`npm run check` (SEO, kalit so'zlar, tarjima, 54/54 unit), typecheck 0, Playwright 30/30
(axe 5 tilda, 320–3840 px), `check:hosts` 6 host.

## 5. Ochiq

- sofexpo.uz va astro-sof-expo.vercel.app muhit tarmog'ida bloklangan (DNS ham). Ma'lumotlar
  mijoz paketidagi `content/` (sofexpo.uz'dan yig'ilgan) bilan solishtirildi: sanalar,
  bo'limlar soni, kontaktlar, jamoa va paketlar sayt bilan mos. PROMOTORS SHOW 2027
  (12–13 sentabr 2027) paketda ham tasdiqlanmagan — qo'shilmadi.

## 6. Fotograf arxivi va rasm formatlari (2026-10-15)

**Manba.** Mijoz 10 ta arxiv yubordi (113 fayl, ko'pi takror): **133 ta noyob** 2560 px kadr —
PROMOTORS SHOW, WORLD EDU 2024, BUILD PRO EXPO, AGROPRO EXPO 2024, PROM PRO EXPO 2024 (boshqa
tashkilotchining sanoat yarmarkasi), bino, foye, kafe, ochiq maydon, Registon. Takror va
bir-biriga juda o'xshash kadrlar ajratilib, **86 tasi** `images/client-2026-10-15/` ga 2048 px
master sifatida saqlandi (EXIF/GPS olib tashlangan, mozjpeg q84). Fayl nomlari mazmunni aytadi:
`promotors-drift-aerial`, `agropro-irrigation-stand`, `venue-foyer` — bu nom saytdagi URL ham.

**Kuchsiz manbalar almashtirildi** (`scripts/build-photos.mjs` → `MAP`): `venue-exterior` (render
edi), `cafe-interior`, `conference-room`, `hall-aisle-red` (300 px CMS eskizlari), `hall-crowd`
(768 px'dan AI-kattalashtirilgan), `event-agropro`, `event-promotors`, `event-worldedu`,
`conference-audience`, `officials-tour`, `outdoor-area` — endi fotografning 2560 px kadrlari.

**Formatlar.**
- Har bir rasm uchun WebP + **AVIF** narvoni (640/1024/1600/2048); AVIF bir xil sifatda ~30%
  yengil. `<Photo>` avval AVIF, keyin WebP, oxirida JPEG beradi; LCP preload ham AVIF.
- Narvon pog'onalari endi **rasmning o'z nisbatida** (avval hammasi 16:10 ga qirqilardi): baland
  kartochka (4:5) kadrning tepasi va pastini yo'qotmaydi, `sizes` ham haqiqiy nisbatdan hisoblanadi.
- **Fokus nuqtasi** libvips `attention` bilan topiladi va `object-position` bo'ladi — CSS qirqqanda
  stend, mashina yoki ma'ruzachi kadrda qoladi. Ma'lumot: `src/data/photo-meta.json`
  (`r` nisbat, `p` fokus, `a` AVIF bor).
- Fotograf kadrlari allaqachon rang/ekspozitsiyadan o'tgan: ularga faqat yengil sharpen, eski
  telefon kadrlariga avvalgidek tone pass.
- `npm run photos` 3 oqimda ishlaydi (AVIF sekin kodlanadi).

**Sahifalar.**
- PROMOTORS, WORLD EDU, BUILD PRO, AGROPRO asosiy sahifalarida **fotoreportaj** bloki (albomlar
  bilan); ichki sahifalar (eksponentlar, tashrifchilar, dastur) bir xil hero o'rniga o'z kadrini oladi.
- `/venue/gallery/`: foye, kofexona, ochiq maydon, forum, shartnoma imzolash, Registon va yangi
  albom "Boshqa tashkilotchilarning tarmoq yarmarkalari" (PROM PRO EXPO 2024). Bino albomida bitta
  rasm ikki marta turardi — tuzatildi.
- `/organizers/`: PROM PRO EXPO 2024 kadrlari (boshqa tashkilotchi tadbiri — isbot sifatida).
- Barcha izoh/alt ru/en'da yozilgan, uz/tr/zh katalogga qo'shilgan (73 qator).
- Galereyaning birinchi rasmi faqat sahifa boshida bo'lsa eager yuklanadi (o'rtadagi galereya LCP'ni
  o'g'irlamaydi).

**SEO.**
- uz tilidagi 11 ta sahifa (FOODERA, BUILD PRO, AGROPRO, WORLD EDU, ECOM va ularning
  eksponentlar sahifalari, katalog) `noindex` edi: eksponentlar katalogi skriptidagi
  `'noopener nofollow'` satri "tarjima qilinmagan matn" deb o'qilardi, ustiga 4 ta description
  uz'da yo'q edi. Ikkalasi tuzatildi — sahifalar uz'da indeksga va hreflang klasteriga qaytadi.
- PROMOTORS SHOW asosiy sahifasi indeksga ochildi (fotoreportaj bilan endi to'liq sahifa; brend
  qidiruvi shu sahifaga tushadi). Ichki arxiv sahifalari `noindex` qoladi.
- Image sitemap bir sahifadan 40 tagacha rasm beradi (avval 10): galereya sahifalari Google
  Images'da to'liq ko'rinadi.

**Ochiq.** Samarqand bo'yicha stok/litsenziyasiz rasmlar (Wikimedia Commons, Unsplash, Pexels)
muhit tarmog'ida bloklangan — ruxsat berilgach qo'shiladi.

**Shapka.** Hide-on-scroll endi kompyuterda ham: pastga o'qiganda shapka yashirinadi, tepaga
aylantirganda qaytadi; mega-menyu yoki til ro'yxati ochiq bo'lsa yashirinmaydi. Ko'rgazma
sahifasida shapka + tablar 138 px o'rniga faqat tablar qoladi.

## 7. Ranglar — O'zbekiston bayrog'i, FOODERA naqshi (2026-10-15)

**Markaz ranglari.** SOF EXPO ranglari O'zbekiston bayrog'i ranglari: samoviy `#0099B5`, yashil
`#1EB53A`, qizil `#CE1126`. Logotip yoylari (`#249CB4`, `#48B454`, `#CC243C`) ularning bosma
yaqinlashuvi edi; `--brand-stripe` va `--sx-*` endi bayroq qiymatlarida. Matn/havola ko'ki
`--moss` = `#00738C` (bayroq samoviysi, to'liq to'yingan, bir pog'ona to'q: oqda 5.5:1, kanvasda
4.9:1). Avvalgi `#21687E` kulrang "petrol" bo'lib, hech kimning ko'kiga o'xshamasdi. Bron tugmasi
qizili — bayroq qizili `#CE1126` (oq matn 5.6:1). Admin va kabinet: `#0063E4` ko'k va kislotali
sariq `#F4FD10` o'rniga bayroq samoviysi (`#00738C`, qora yon panelda `#5CCFE3`).

Ikkinchi qadam (o'sha kun): saytda eng ko'p ko'rinadigan rang hali ham to'q yashil `#123B25` edi
(tugmalar, to'q bloklar, footer) — sayt bayroqqa o'xshamasdi. Endi `--evergreen` = bayroq samoviysining
tungi tusi `#00475A` (oq matn 10.2:1), `--evergreen-2` `#005F73`, siyoh `--ink` `#0B1C22` (ko'k-qora),
to'q fondagi och urg'u `--gold-soft` `#8FDCEC`, `--accent-soft` `#E3F4F8`; `theme-color`, manifest va
OG kartochka ham shu rangda. Yashil va qizil bayroqdagidek: chiziqlar va urg'u (qizil — bron tugmasi).

**FOODERA naqshi.** FOODERA'ning naqshi uning badge'ida: tilla islimiy jingalak gullar halqasi.
`images/brand-masters/foodera-naqsh-ring.png` — badge'dan kesilgan (yulduz va yozuv olib
tashlangan) halqa; `public/brand/foodera/naqsh.webp` maska sifatida: hero'ning o'ng yuqori
burchagida badge oltini `#CCA878` bilan, CTA-band va footer'da `--gold-soft` bilan. Avvalgi
geometrik kvadrat-yulduz plitkasi FOODERA'da shu medalyon bilan almashtirildi.
