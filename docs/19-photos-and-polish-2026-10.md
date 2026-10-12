# 19 · Haqiqiy suratlar va eski dizaynni tozalash (2026-10-12)

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

## 3. Tekshiruvlar

`npm run check` (SEO, kalit so'zlar, tarjima, 54/54 unit), typecheck 0, Playwright 30/30
(axe 5 tilda, 320–3840 px), `check:hosts` 6 host.

## 4. Ochiq

- sofexpo.uz va astro-sof-expo.vercel.app muhit tarmog'ida bloklangan; ularni ruxsat
  berilgan domenlarga qo'shilsa, qolgan suratlarni bevosita saytdan olish mumkin.
