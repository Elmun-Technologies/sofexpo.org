# 14. Post-show report — shablon va ko'rgazma kunida yig'iladigan ma'lumotlar

**Nima uchun.** THAIFEX, WorldFood Istanbul, SIAL va Fancy Food barchasi ko'rgazmadan
keyin hisobot chiqaradi: raqamlar, ishtirokchi ovozlari, fotolavhalar va keyingi
sana. Bu — saytning "proof layer"i: keyingi eksponentni ishontiradigan qatlam. Arxivda
allaqachon 5 ta yakunlangan ko'rgazma bor, lekin ularning raqamlari katalog ichida
ko'milib yotgan edi.

**Holat (2026-09-29): mexanika ishga tushdi.** Har bir yakunlangan ko'rgazma endi o'z
hisobot sahifasiga ega: `/events/past/<id>/`. Sahifa `src/data/archive.ts` dagi yozuvdan
quriladi — hisobot yozish uchun kodga tegilmaydi, faqat ma'lumot qo'shiladi.

---

## 1. Hisobot sahifasi qanday quriladi

`src/components/EditionReport.astro` — tartib:

| Blok | Ma'lumot | Majburiy? |
|---|---|---|
| Sarlavha + yetakchi paragraf | `title`, `summary` | ha (bor) |
| Raqamlar | `results[]` — qiymat + izoh | ha (bor) |
| Qanday o'tdi | `report.highlights[]` — 3 ta gap | ha (to'ldirilgan) |
| Raqamlar qanday hisoblangan | `report.method` | **bo'sh** |
| Kontekst (kelishuvlar, kim kelgan) | `report.outcome` | **bo'sh** |
| Ishtirokchi ovozlari | `report.quotes[]` — ism, lavozim, korxona | **bo'sh** |
| Materiallar | `catalogue` (PDF), `photo` (fotoalbom) | qisman |
| Keyingi sana | `events.ts` dan avtomatik | ha |

Bo'sh maydonlar sahifada **chiqmaydi** — yarim bo'sh blok o'rniga hech narsa. Shuning
uchun hisobot to'ldirilgan sari sahifa o'z-o'zidan boyib boradi.

**Qo'shish tartibi** (yangi ko'rgazma yakunlanganda):

1. `src/data/archive.ts` ga yangi `Edition` yozuvi: `id`, `eventSlug`, `year`, `start`
   (ISO sana — Article markup uchun), `dates`, `title`, `summary`, `results[]`.
2. `report.highlights` — 3 ta gap: nima bo'ldi, kim keldi, nima yangi edi.
3. `catalogue` → `/files/…pdf` (avval `src/data/downloads.json` ga yoziladi),
   `photo` → fotoalbom havolasi.
4. `npm run check` — tarjima yo'q bo'lsa build to'xtaydi (zh/tr/uz majburiy).
5. Hisobot chiqqach: `report.method`, `report.outcome`, va tasdiqlangan
   `report.quotes[]` ni qo'shib, yana `npm run check`.

**Tartib-intizom:** `results[]` dagi har bir raqam qayerdan olingani `method` da yozilishi
kerak ("akkreditatsiya ma'lumotlari", "badge skanerlari", "eksponent so'rovi"). Raqam
manbasi ko'rsatilmagan hisobot — marketing varaqasi, proof emas. `quotes[]` ga **faqat**
rozilik bergan ishtirokchining gaplari yoziladi; ofisda o'ylab topilgan iqtibos — eng
yomon variant (va anomal "repeated translation" auditi buni ushlay olmaydi).

---

## 2. Ko'rgazma kunida yig'iladigan ro'yxat (on-site collection list)

Hisobot kechiktirilganda u o'z qiymatini yo'qotadi: raqamlar bir hafta ichida eskiradi,
iqtiboslar bir oy ichida olinmay qoladi. Quyidagi ro'yxat — kim, qachon, nimani.

### Oldindan (ko'rgazmaga 2 hafta qolgan)

- [ ] Ro'yxatga olish stoli (akkreditatsiya) kunlik hisoblagichlari sozlangan
- [ ] Eksponentlar ro'yxati (kompaniya, mamlakat, maydon) tayyor — hisobot uchun asos
- [ ] Mehmonlar anketalari: 3 ta savol (kim, qaysi soha, nima izlayapti)
- [ ] Fotograf bilan kelishuv: kunlik 20+ kadr, qaysi zallar, qaysi lahzalar
- [ ] Iqtibos uchun 5–8 ta eksponent ro'yxati (oldindan rozilik olishga ulgurish uchun)

### 1-kun

- [ ] Kirish hisoblagichi: 10:00, 14:00, 18:00 (uchta nuqta — kunlik dinamika)
- [ ] Eksponentlar: haqiqatda kelganlar soni (rejadagi emas)
- [ ] Dastur: sessiyalar bo'yicha tashrif (har bir zalda hisoblovchi)
- [ ] Foto: ochilish, zal umumiy ko'rinishi, stendlar
- [ ] 2 ta qisqa iqtibos (eksponent + tashrif buyuruvchi), yozma rozilik bilan

### 2-kun

- [ ] Kirish hisoblagichi: xuddi shu uchta nuqtada
- [ ] Muzokara zonasi: o'tkazilgan uchrashuvlar soni (agar matchmaking bo'lsa)
- [ ] Foto: mahsulot namunalari, delegatsiyalar, dastur zali
- [ ] 2 ta iqtibos
- [ ] Eng ko'p tashrif bo'lgan 3 ta stend (kuzatuv, hisoblagich emas — sharh sifatida)

### 3-kun (yakuniy kun)

- [ ] Kirish hisoblagichi: xuddi shu nuqtalarda
- [ ] Yakuniy jami: tashrif buyuruvchilar, eksponentlar, mamlakatlar, maydon
- [ ] Foto: yopilish, sovrin topshirish (agar tanlov bo'lsa)
- [ ] 2 ta iqtibos ("kelasi yil kengaytiramiz" turidagi gaplar eng foydalisi)

### Keyin — 3 kun ichida

- [ ] Raqamlar jamlangan va `results[]` ga yozilgan
- [ ] `report.highlights` yozilgan (3 gap)
- [ ] `catalogue` PDF tayyor va `downloads.json` ga qo'shilgan
- [ ] Fotoalbom havolasi
- [ ] `npm run check` yashil → hisobot sahifasi e'lon qilindi

### Keyin — 2 hafta ichida

- [ ] Eksponent so'rovi (10 ta savol) yuborilgan; javoblar `report.outcome` ga
- [ ] 3–5 ta tasdiqlangan iqtibos `report.quotes[]` ga
- [ ] `report.method` — har bir raqamning manbasi
- [ ] Keyingi sana e'lon qilingan (hisobotning oxirgi bloki avtomatik yangilanadi)

---

## 3. O'lchov (docs/13 §9 bilan bir xil)

| Ko'rsatkich | Maqsad |
|---|---|
| Hisobot e'lon qilingan kun | ko'rgazma yopilgandan ≤ 5 ish kuni |
| Hisobot sahifasiga tashrif | keyingi ko'rgazma arizalarining 5% i shu sahifadan |
| Iqtiboslar soni | har hisobotda ≥ 3 ta, barchasi tasdiqlangan |
| Raqam manbasi | `method` to'ldirilmagan hisobot = hisobot emas |
