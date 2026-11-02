# 24. Ko'rgazmalar timeline'i — o'tgan ko'rgazma avtomatik arxivga, keyingisi bosh sahifaga

Holat: 2026-11-02. Sabab: FOODERA EXPO 2026 (27–29 oktyabr) o'tib bo'ldi, lekin `status: 'open'`
qo'lda yozilgani uchun sayt uni hali ham "ближайшая выставка" deb ko'rsatib turardi.

## 1. Qoida

Ko'rgazmaning holati endi **sanadan hisoblanadi**, qo'lda emas:

| Bugun (Samarqand vaqti, UTC+5) | Holat | Saytda |
|---|---|---|
| `dates.start` dan oldin | ahead | bosh sahifa / menyu / promo-bar'da "keyingi ko'rgazma", countdown |
| `start` … `end` (shu kunlar ham) | live | hali "ochiq" — eshiklar ochiq, ro'yxatdan o'tish ishlaydi |
| `end` dan **keyingi kun** | past | arxiv ko'rinishi, "Итоги" tugmasi, `highlight` o'chadi, keyingi ko'rgazma bosh sahifaga chiqadi |

Kod: `src/data/events.ts` — `phaseOf()`, `onTimeline()`, `TODAY`. Xom ma'lumot `catalogue`
massivida; butun sayt `events` / `upcoming` / `finished` / `nextEvent()` ni ishlatadi, ular
allaqachon timeline'dan o'tgan. `status: 'past'` ni qo'lda yozish shart emas.

## 2. Backend (kabinet) ham shu qoida bilan

`scripts/backend/shows.mjs`: har bir edition'da `end` sanasi bor. Server soatni har so'rovda
o'qiydi (`portalEventsOn()`, `showsOn()`, `isUpcomingEdition()`), shuning uchun:

- o'tgan ko'rgazma kabinetdagi "tadbirni tanlang" ro'yxatidan **o'zi chiqadi** (deploy kerak emas);
- ishtirokchi kompaniya sahifasida u "ishtirok etmoqda" dan "avval qatnashgan" ga o'tadi.

Testlar soatni `createLeadServer({ now: () => new Date(...) })` bilan qotiradi.

## 3. Har kecha avtomatik rebuild

Sayt statik — "bugun" bu build sanasi. `.github/workflows/daily-rebuild.yml` har kuni
**00:11 Samarqand vaqti** da saytni qayta build qiladi, ya'ni ko'rgazma tugagan kunning
ertasi ertalab sayt allaqachon yangilangan bo'ladi.

**Bir martalik sozlash (owner):**

1. Vercel → `sof-expo.com` loyihasi → Settings → Git → **Deploy Hooks** → nom `nightly`,
   branch `main` → Create → URL'ni nusxalang.
2. GitHub → repo → Settings → Secrets and variables → Actions → **New repository secret**:
   `VERCEL_DEPLOY_HOOK_URL` = shu URL.
3. Actions → `daily-rebuild` → **Run workflow** bilan bir marta qo'lda tekshiring.

Secret bo'lmasa workflow yiqilmaydi, faqat notice yozadi.

## 4. Ko'rgazma tugagandan keyin nima qilish kerak (ixtiyoriy, lekin yaxshi)

Avtomatik qism hech narsasiz ishlaydi. Qo'shimcha qilish mumkin bo'lganlar:

1. **Hisobot** — `src/data/archive.ts` ga edition qo'shing (masalan `foodera-2026`). Faqat
   tasdiqlangan raqamlar: tashrif buyuruvchilar, kompaniyalar soni — tashkilotchi sanaganidan
   keyin `results` ga. Hisobot bo'lmaguncha hero'dagi "Отчёт по итогам" `/events/past/` ga olib boradi.
2. **Keyingi yil sanasi** — tasdiqlangan bo'lsa, ko'rgazmaga `nextEdition` qo'shing:
   ```ts
   nextEdition: { start: '2027-10-26', end: '2027-10-28', display: { ru: '26–28 октября 2027', en: '26–28 October 2027' } },
   ```
   Hero'da "Следующая выставка: 26–28 октября 2027" chiqadi. Sana yo'q bo'lsa — "даты следующей скоро".
   Yangi sana matni zh/tr/uz kataloglariga ham kerak (5-band).
3. **Keyingi edition'ni ochish** — yangi yil uchun sotuv boshlanganda ko'rgazmaning `dates`,
   `brand` (yil), `highlight`, `status: 'open'` ni yangilang; eski yil `archive.ts` da qoladi.
   Backend: `shows.mjs` dagi `SHOWS` va `PORTAL_EVENTS` ga yangi yil qatorini `end` bilan qo'shing.

## 5. Oldindan tekshirish: `npm run timeline:check`

Ko'rgazma "past" ga o'tganda uning sahifalarida yangi matnlar paydo bo'ladi ("BUILD PRO is over
for this year…"). zh/tr build tarjimasiz satrda yiqiladi — Vercel'da build yiqilsa eski versiya
qoladi, ya'ni sayt o'sha kuni yangilanmay qoladi. Shuning uchun **yangi ko'rgazma qo'shganda yoki
ko'rgazma matnini o'zgartirganda**:

```bash
npm run timeline:check
```

U har bir oldindagi ko'rgazma tugagan kunning ertasi uchun saytni build qiladi
(`SITE_TODAY=YYYY-MM-DD`) va tarjima kerak bo'lgan satrlarni chiqaradi. Hozir: barcha 4 sana ✓.

Qo'lda ko'rish: `SITE_TODAY=2026-11-12 npm run build && npm run preview` — sayt 12-noyabrda qanday ko'rinadi.
