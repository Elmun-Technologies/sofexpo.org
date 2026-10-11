# 17 · Backend va admin paneli

SOF EXPO ommaviy sayti Astro SSG bo‘lib qoladi: sahifalar HTML sifatida quriladi; admin panel va
mehmon/eksponent kabinetlari esa alohida Node.js backend’da ishlaydi. Backend formalarni qabul qiladi,
SQLite’da saqlaydi, Telegram/CRM’ga navbat bilan uzatadi va birinchi tomon analitikasini yig‘adi.

> **Qamrov:** arizalar (lead CRM), analitika, integratsiyalar, admin/menejer hisoblari hamda alohida
> mehmon va eksponent o‘z-o‘ziga xizmat kabinetlari. Mehmon tadbirga qiziqish/tashrif so‘rovi yuboradi;
> eksponent kompaniya profilini saqlab, maydon/ishtirok so‘rovi yuboradi. Murojaatlar admin CRM’da
> ko‘rinadi, holati kabinetda kuzatiladi. Profil, ro‘yxatdan o‘tish va so‘rovlar tranzaksion SQLite’da
> saqlanadi; portal akkauntlari admin rollaridan alohida jadval va sessiyalarda turadi.
>
> **Hozircha yo‘q:** sayt matni, ko‘rgazma sanalari va SEO ma’lumotlari `src/data/**` va
> `src/content/**` ichida qoladi; kabinet CMS emas. QR/chiptani chiqarish, to‘lov, joyni band qilish,
> shartnoma/faktura va hujjat yuklash kiritilmagan. Ommaviy formalarda press/marketing obunasi,
> email jo‘natish ro‘yxati va unsubscribe oqimi mavjud emas; majburiy shaxsiy ma’lumotlarni qayta
> ishlash roziligi marketing roziligi sifatida talqin qilinmasligi kerak. Akkaunt emailini tasdiqlash
> va email orqali parol tiklash ham kiritilmagan; bunlar uchun production email provayderi va
> qo‘shimcha oqim kerak.

## 1. Tuzilma

```text
Static public site (Cloudflare Pages / CDN)
  ├─ POST PUBLIC_LEAD_ENDPOINT ───────────────┐
  ├─ POST PUBLIC_ANALYTICS_ENDPOINT ──────────┤ CORS: exact site-origin allow-list
  └─ PUBLIC_PORTAL_URL → /cabinet             │
                                               ▼
                                   Node 22 · scripts/lead-webhook.mjs
                         ┌─────────────────────┼─────────────────────┐
                         ▼                     ▼                     ▼
                 SQLite (.data/)       delivery_outbox        first-party events
                 ├─ admin/users        ├─ Telegram Bot              │
                 └─ portal/users       └─ CRM webhook               │
                         │                                           │
             /admin · /cabinet                   /api/admin/* · /api/portal/*
                 session + CSRF                     dashboard / self-service
```

`node:sqlite` Node’ning o‘z modulidir — npm runtime dependency qo‘shilmaydi. SQLite `WAL`, foreign
key va busy timeout bilan ishlaydi. Bitta backend process va doimiy disk/volume talab qilinadi;
serverless fayl tizimida `.data/` ni persistent volume’ga ulash yoki tashqi SQL bazasiga adapter
yozish kerak.

### So‘rov algoritmi

1. **Qabul qilish.** `POST /lead` yoki `POST /api/lead` faqat JSON, 32 KB gacha; 10 so‘rov/min/IP.
   `name` va telefon tekshiriladi, email format, forma turiga xos majburiy maydonlar va rozilik
   tekshiriladi. Matn uzunligi cheklanadi, HTML ijro qilinmaydi, URL query qismlari lead URL’laridan
   olib tashlanadi.
2. **Atomik saqlash.** Yangi lead va konfiguratsiya qilingan har bir yetkazish ishi bitta SQLite
   tranzaksiyasida yoziladi. Faqat tranzaksiya muvaffaqiyatli tugagach `202 {ok:true,id}` qaytadi.
   Telegram yoki CRM ishlamay qolsa ham ariza bazada qoladi — mijozga noto‘g‘ri “yetib bormadi”
   xabari ko‘rsatilmaydi.
3. **Yetkazish navbati.** Worker `pending` ishni olib `sending` qiladi; muvaffaqiyatda `sent`, xatoda
   eksponensial backoff bilan yana `pending`, sakkiz urinishdan so‘ng `failed`. Admin “qayta
   urinish” bosishi mumkin. Bu **at-least-once** yetkazish: provider javobidan keyin process yiqilsa
   takror xabar kelishi ehtimoli bor. CRM payload’da idempotency uchun `X-SOFEXPO-Lead-ID` yuboriladi.
4. **Analitika.** `POST /event` bir so‘rovda 500 tagacha event oladi, 256 KB gacha va 120 so‘rov/min/IP.
   Faqat event nomi, anonim session ID, locale, URL query’siz pathname, forma/CTA/UTM kabi ruxsat
   etilgan ustunlar yoziladi. IP, to‘liq URL, query, referer va request body arxivlanmaydi.
5. **Admin.** Email/parol `scrypt` bilan tekshiriladi; sessiya — 256-bit tasodifiy token, bazada
   faqat SHA-256 xeshi. HttpOnly + SameSite cookie, HTTPS’da Secure, 7 kunlik expiry, CSRF token,
   origin allow-list, login rate limit va rollar ishlaydi. O‘zgartirishlar `audit_log` ga tushadi.

## 2. Ma’lumotlar modeli

| Jadval | Mazmuni |
|---|---|
| `users` | Admin CRM emaili, scrypt salt/hash, `admin` yoki `manager`, faollik va so‘nggi login |
| `sessions` | Admin token/CSRF xeshi va expiry; portal sessiyalaridan alohida |
| `portal_accounts` | Email, scrypt salt/hash, faqat `visitor` yoki `exhibitor`; admin huquqi bilan kesishmaydi |
| `portal_sessions` | Portal token/CSRF xeshi, expiry va account foreign key |
| `portal_profiles` | Ism, telefon, kompaniya, mamlakat, soha, sayt va qiziqishlar |
| `portal_requests` | Account’ga tegishli tashrif/ishtirok so‘rovi; CRM lead ID va holat bilan bog‘langan |
| `leads` | Aloqa, forma/tadbir, locale, manba, landing/referrer, UTM, status, priority, mas’ul va forma payload’i |
| `lead_notes` | Ariza ustidagi ichki izohlar, muallif va sana |
| `delivery_outbox` | Provider, urinish soni, keyingi urinish, holat va oxirgi xato |
| `analytics_events` | Privacy-minimal hodisalar; IP va raw URL yo‘q |
| `audit_log` | Status/ustuvorlik/mas’ul/foydalanuvchi o‘zgarishlari |
| `schema_migrations` | Eski `.cache/leads.jsonl` va `events.jsonl` ni bir marta import qilish belgisi |

Lead statuslari: `new → contacted → qualified → won / lost`; qo‘shimcha `spam`. Admin panelda
qidiruv, status/forma filtri, sahifalash, CSV eksport (10 000 tagacha), priority, mas’ul, ichki
izoh va ariza tarixi mavjud. “Status transition” qattiq bloklanmaydi — menejer xato statusni ham
orqaga qaytara oladi; har o‘zgarish audit logga yoziladi.

## 3. Admin paneli

`/admin` (API serverning o‘z domenida):

- **Umumiy ko‘rinish:** davr tanlash (7/30/90 kun), jami/yangi leadlar, sessiya va konversiya,
  arizalar trendi/status/form/source kesimi hamda shu davrdagi yangi mehmon/eksponent akkauntlari,
  kabinet so‘rovlari va yangi so‘rovlar.
- **Arizalar:** ism/telefon/kompaniya bo‘yicha qidiruv, status va forma filtri, tafsilot paneli,
  status/priority/mas’ulni yangilash, jamoa izohlari, CSV eksport. Portal so‘rovlari ham shu CRM
  kartalariga ulangan; menejer o‘zgartirgan status account egasining kabinetida ko‘rinadi.
- **Kabinet akkauntlari:** mehmon/eksponent profilini qidirish va filtrlash, ro‘yxatdan o‘tish/oxirgi
  kirish tarixi, har bir akkauntning barcha portal so‘rovlari va CRM kartalariga tez o‘tish. Admin
  akkauntni bloklaydi yoki qayta faollashtiradi; bloklash barcha sessiyalarni bekor qiladi va auditga
  yoziladi. Portal akkauntlari butunlay o‘chirilmaydi; retention siyosati so‘rov yozuvlariga qo‘llanadi.
- **Analitika:** anonim sessiya voronkasi (sahifa → CTA → forma/kviz boshlanishi → muvaffaqiyatli
  yuborish), CTA/channel/til, page view, mashhur sahifalar va UTM kampaniyalari; davr bo‘yicha portal
  ro‘yxatdan o‘tishlari, mehmon/eksponent so‘rovlari, tadbirlar va CRM statuslari. Bu agregat tahlil
  shaxsiy profilga bog‘lanmaydi.
- **Integratsiyalar:** Telegram/CRM sozlanganmi, saqlash navbati, xatolar va qayta yuborish.
- **Faoliyat tarixi:** barcha CRM o‘zgarishlari, kabinet bloklash/faollashtirish, profil va jamoa
  amallari, yetkazish qayta urinishlari; sana, bajaruvchi, obyekt va matn bo‘yicha qidirish/filtrlash,
  sahifalash. Lead kartasida aynan shu murojaatning status/ustuvorlik/mas’ul o‘zgarishlari timeline’da.
- **Jamoa:** menejer/admin yaratish, roli va faolligini boshqarish. Oxirgi faol adminni pasaytirish
  yoki o‘chirish mumkin emas.

Panel mobilga mos, vanilla JS/CSS. Foydalanuvchi kiritgan qiymatlar HTML sifatida ishlatilmaydi;
CSV formulaga aylanishi mumkin bo‘lgan `= + - @` bilan boshlanuvchi kataklarni himoyalaydi.

## 4. Mehmon va eksponent kabinetlari

Backenddagi `/cabinet` sahifasida alohida ro‘yxatdan o‘tish va kirish oqimi bor:

- **Mehmon (`visitor`)**: ism/telefon/profil va qiziqishlarini saqlaydi; tadbirni tanlab tashrif,
  buyer dasturi, guruh yoki konferensiya bo‘yicha so‘rov yuboradi.
- **Eksponent (`exhibitor`)**: kompaniya, soha, mamlakat va sayt profilini boshqaradi; tadbir,
  taxminiy m² va ishtirok formatini ko‘rsatib, stend so‘rovi yuboradi.
- Har bir so‘rov `portal_requests` va mavjud `leads` jadvaliga bitta SQLite tranzaksiyasida yoziladi.
  Admin uni odatdagi CRM lead sifatida ko‘radi; menejer statusni yangilasa, shu holat account
  egasining kabinetida ham ko‘rinadi. Bir account boshqa account so‘rovlarini o‘qiy olmaydi.
- Lead va unga bog‘langan portal so‘rovi 365 kundan keyin SQLite’dan cascade orqali o‘chiriladi:
  backend startida va har 24 soatda tekshiriladi. Kabinet profili akkaunt faol ekan saqlanadi; o‘chirish
  so‘rovi privacy sahifasidagi kontakt orqali yuboriladi. Backup nusxalari uchun ham mos retention belgilang.
- Tashrif/ishtirok tanlovlari `scripts/backend/server.mjs` ichidagi `PORTAL_EVENTS` dan keladi;
  kabinet interfeysi o‘zbek, rus, ingliz, turk va xitoy tillarida ishlaydi. Tadbir nomi/sanalari tarjimasi
  `scripts/backend/portal/i18n.js` ichida slug bo‘yicha saqlanadi; yangi tadbir qo‘shilganda ikkala
  ro‘yxatni ham yangilang. Portal faqat yaqinlashayotgan tadbirlarni ko‘rsatadi.
- Portal roli admin `users` jadvalidan va cookie’dan ajratilgan. Parollar `scrypt`; portal sessiyasi
  HttpOnly, SameSite=Strict, CSRF himoyali va standart 14 kun (1–30 kun sozlanadi). Ro‘yxatdan
  o‘tish IP bo‘yicha 5/soat, so‘rovlar account bo‘yicha 10/soat bilan cheklangan.
- Shaxsiy ma’lumotlarni qayta ishlashga rozilik ro‘yxatdan o‘tishda ham, har bir so‘rovda ham
  so‘raladi. Akkaunt emaili hozircha tasdiqlanmaydi; password recovery va email xabarnoma production
  email provayderi tanlangandan keyin alohida qo‘shiladi.

Sayt headeridagi kabinet havolalari `PUBLIC_PORTAL_URL` build-time env o‘zgaruvchisi berilganda
ko‘rinadi (masalan, `https://api.sofexpo.org`). Havola joriy sahifa tilini `lang` parametrida uzatadi;
qo‘llab-quvvatlanadigan qiymatlar `uz`, `ru`, `en`, `tr`, `zh`, to‘g‘ridan-to‘g‘ri ochilganda esa o‘zbek
tili tanlanadi. Foydalanuvchi kabinet ichida tilni o‘zgartirishi mumkin. Bo‘sh bo‘lsa noto‘g‘ri/localhost
havola chiqarilmaydi; portalni API hostidagi `/cabinet` orqali ochish mumkin.

**Chegaralar:** so‘rov yuborish chiptani/QR’ni chiqarish, qatnashishni tasdiqlash, stendni bron qilish,
to‘lov, shartnoma/faktura yoki fayl yuklash degani emas. Bu oqimlar ushbu MVP’da mavjud emas; portal
faqat murojaat va uning CRM holatini kuzatadi.

## 5. Lokal ishga tushirish

```bash
cp .env.example .env
# .env ichida ADMIN_EMAIL va ADMIN_PASSWORD ni o'zgartiring (kamida 12 belgi)
npm run lead-webhook              # Node backend :8787
npm run dev                       # Astro sayti :4321, boshqa terminalda
```

Keyin admin: `http://localhost:8787/admin`; mehmon/eksponent kabineti:
`http://localhost:8787/cabinet?type=visitor&lang=uz` yoki `?type=exhibitor&lang=en` (til qiymatlari:
`uz`, `ru`, `en`, `tr`, `zh`); public sayt: `http://localhost:4321/`. `.env` dagi `PUBLIC_LEAD_ENDPOINT`
va `PUBLIC_ANALYTICS_ENDPOINT` local
backend’ga ishora qiladi. `PUBLIC_PORTAL_URL=http://localhost:8787` qilsangiz, public sayt headerida
kabinet havolalari ko‘rinadi; Astro dev’ni qayta ishga tushiring.

Birinchi start’da `users` jadvali bo‘sh bo‘lsa, `ADMIN_EMAIL` + `ADMIN_PASSWORD` bilan admin yaratiladi.
Hech qanday default admin parol yoki admin self-signup yo‘q; qiymatlar bo‘lmasa admin panelga kirish
imkonsiz bo‘ladi. Portal mehmon/eksponent hisoblarini esa alohida public registratsiya orqali ochadi.

Parolni unutganda — backendni to‘xtatib, `.env` da `ADMIN_RESET_EMAIL` va `ADMIN_RESET_PASSWORD`
(12+ belgi) o‘rnating, so‘ng:

```bash
npm run admin:reset-password
```

Bu foydalanuvchining barcha oldingi sessiyalarini bekor qiladi. Parolni qayta tiklagandan so‘ng
reset env qatorlarini o‘chiring. Yangi foydalanuvchini admin panelning “Jamoa va ruxsatlar”
bo‘limidan yarating.

## 6. Production sozlash

1. Node 22.18+ server/VPS yoki persistent volume’li runtime’da backendni ishga tushiring.
2. DNS/TLS: masalan `api.sofexpo.org` → Node backend; reverse proxy HTTP’ni backendga uzatsin va
   `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-For` ni o‘zi yozsin. Faqat ishonchli
   proxy bo‘lsa `LEAD_WEBHOOK_TRUST_PROXY=1` qiling; to‘g‘ridan-to‘g‘ri internetga ochiq serverda
   bu qiymat `0` qolsin.
3. `LEAD_WEBHOOK_DB` ni persistent diskka qo‘ying, fayl ruxsatini faqat backend useriga bering,
   diskni shifrlang va muntazam backup qiling. `.data/` Git’ga kirmaydi.
4. `.env` da haqiqiy `ADMIN_EMAIL`, uzun random `ADMIN_PASSWORD`, `LEAD_WEBHOOK_ORIGINS` (aniq
   `https://sofexpo.org`, `https://foodera.sofexpo.org` … va `https://api.sofexpo.org`), Telegram
   token/chat yoki `CRM_WEBHOOK_URL`/token sozlang. Bot/CRM sirlari faqat backend env’da bo‘ladi.
5. `.github/workflows/deploy.yml` Cloudflare Pages uchun statik saytni quradi. Standart ochiq manzillar
   `PUBLIC_LEAD_ENDPOINT=https://api.sofexpo.org/lead`,
   `PUBLIC_ANALYTICS_ENDPOINT=https://api.sofexpo.org/event` va `PUBLIC_PORTAL_URL=https://api.sofexpo.org`;
   boshqa backend domeni ishlatilsa, GitHub repository variables’da mos qiymatlarni belgilang.
   `PUBLIC_*` qiymatlari build vaqtida HTML/JS’ga kiradi — ularga secret token qo‘ymang. Deploy workflow
   Cloudflare `CLOUDFLARE_API_TOKEN` va `CLOUDFLARE_ACCOUNT_ID` secrets’larini talab qiladi,
   nashrdan oldin `/health`, `/api/portal/options` va `/cabinet` ni tekshiradi, ammo **Node backendni
   o‘zi deploy qilmaydi**. Shu sabab Pages’ni nashr etishdan oldin API server, persistent DB, TLS, CORS,
   admin bootstrap hamda Telegram/CRM yetkazish sozlamalari production’da ishga tushganini tekshiring.
6. Admin panel: `https://api.sofexpo.org/admin`; portal login/registratsiya: `https://api.sofexpo.org/cabinet`.
   Ular public statik hostda emas, API server domenida. `LEAD_WEBHOOK_ORIGIN` eski bitta-origin
   sozlamasi qabul qilinadi, lekin yangi deploy’da bir nechta domen uchun `LEAD_WEBHOOK_ORIGINS` ishlating.

`LEAD_WEBHOOK_SECRET` browser endpoint URL’iga kiritilsa foydalanuvchi ko‘ra oladi; u spamdan
ishonchli himoya emas. Production uchun exact CORS, server rate-limit, validatsiya, TLS va zarur
bo‘lsa reverse-proxy/WAF qo‘llang. `GET /stats` admin cookie talab qiladi; server-to-server uchun
alohida `LEAD_WEBHOOK_STATS_TOKEN` ni `Authorization: Bearer …` orqali ishlatish mumkin, URL query’da
kalit yubormang.

## 7. API qisqa ma’lumot

| Method | Path | Huquq | Vazifa |
|---|---|---|---|
| `GET` | `/health` | Ochiq | Liveness |
| `POST` | `/lead` | Ochiq + rate limit | Forma arizasi; `202` = SQLite’da saqlandi |
| `POST` | `/event` | Ochiq + rate limit | Privacy-minimal event batch |
| `GET` | `/cabinet` | Ochiq | Mehmon/eksponent portal UI (noindex) |
| `GET` | `/api/portal/options` | Ochiq | Ochiq tadbirlar ro‘yxati |
| `POST` | `/api/portal/register` | Ochiq + rate limit | Visitor/exhibitor hisob yaratish |
| `POST` | `/api/portal/login` | Ochiq + rate limit | Portal sessiyasi yaratish |
| `GET` | `/api/portal/me` | Login | Portal profili + CSRF tokenini yangilash |
| `PATCH` | `/api/portal/profile` | Login + CSRF | Faqat o‘z profilini tahrirlash |
| `GET/POST` | `/api/portal/requests` | Login (POST + CSRF) | Faqat o‘z tashrif/ishtirok so‘rovlarini ko‘rish/yuborish |
| `POST` | `/api/portal/logout` | Login + CSRF | Portal sessiyasini bekor qilish |
| `GET` | `/api/admin/status` | Ochiq | Birinchi admin sozlanganmi |
| `POST` | `/api/admin/login` | Ochiq + rate limit | Sessiya yaratish |
| `GET` | `/api/admin/me` | Login | Profil + yangilanadigan CSRF token |
| `GET` | `/api/admin/dashboard?days=30` | Login | KPI va lead trend |
| `GET` | `/api/admin/analytics?days=30` | Login | Funnel, CTA/channel/til, event/page/campaign + portal account/so‘rov/status kesimi |
| `GET` | `/api/admin/portal-accounts?...` | Login | Mehmon/eksponent akkauntlarini qidirish, filtrlash va sahifalash |
| `GET` | `/api/admin/portal-accounts/:id` | Login | Profil va unga bog‘langan so‘rov/CRM kartalari |
| `PATCH` | `/api/admin/portal-accounts/:id` | Admin + CSRF | Akkauntni bloklash/faollashtirish; bloklanganda sessiyalar bekor qilinadi |
| `GET` | `/api/admin/leads?...` | Login | Qidiruv/filtr/sahifalash |
| `GET` | `/api/admin/leads/:id` | Login | Tafsilot + izoh + yetkazish holati |
| `PATCH` | `/api/admin/leads/:id` | Login + CSRF | Status/priority/assignee |
| `POST` | `/api/admin/leads/:id/notes` | Login + CSRF | Ichki izoh |
| `GET` | `/api/admin/leads/export.csv` | Login | Filtrlangan CSV, 10k limit |
| `GET/POST/PATCH` | `/api/admin/users` | Admin + CSRF (o‘qishdan tashqari) | Hisob va ruxsatlar |
| `GET` | `/api/admin/system` | Admin | Integratsiya/navbat holati |
| `GET` | `/api/admin/audit?...` | Admin | Sana, bajaruvchi, obyekt/qidiruv filtri va sahifalangan audit tarixi |
| `POST` | `/api/admin/outbox/retry` | Admin + CSRF | Xato ishlarni qayta navbatga qo‘yish |

Backend integratsion testlar: `npm run test:backend`. To‘liq loyiha suite’i builddan keyin
`npm test` (yoki `npm run check`) orqali ishlaydi. Backend testlari admin/portal login va CSRF,
role isolation, visitor/exhibitor ariza flow’i, admin akkaunt qidiruvi/bloklash va sessiya bekor qilish,
portal analytics, CORS, SQLite, outbox retry, eksport va last-admin himoyasini tekshiradi.
