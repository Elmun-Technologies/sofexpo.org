# 20 · Fly.io: backend production deploy

Ushbu qo‘llanma faqat uzoq ishlaydigan Node backend’ni `api.sof-expo.com` ga chiqaradi.
Ommaviy Astro sayt alohida: `sof-expo.com` Vercel’da statik quriladi (`vercel.json`,
`PUBLIC_HOSTS_MODE=alias`). Fly.io’da backend’ni Vercel serverless funksiyasi sifatida ishga
tushirmang: `node:sqlite` va Telegram → blog publisher doimiy process hamda yoziladigan disk talab
qiladi.

| Sozlama | Qiymat |
|---|---|
| Fly app | `sofexpo-api` |
| Region | `ist` (Istanbul) |
| Machine | 1 ta shared CPU, 512 MB RAM |
| SQLite volume | `sofexpo_data` → `/data` |
| Health check | `GET /health` |
| Public API | `https://api.sof-expo.com` |

> **SQLite cheklovi:** bu deploy ataylab **bitta machine** bilan ishlaydi. Bitta SQLite volume’ni
> ikki machine’ga ulash yoki `fly scale count 2` qilish mumkin emas — SQLite single-writer. `fly.toml`
> dagi `min_machines_running = 1` va auto-stop o‘chiq; shu holatni saqlang.

## 1. Fly app va doimiy volume

Operator kompyuterida Fly CLI (`flyctl`) ni [rasmiy qo‘llanma](https://fly.io/docs/flyctl/install/)
bo‘yicha o‘rnating. Yangi akkaunt bo‘lsa `flyctl auth signup`, mavjud akkaunt bo‘lsa
`flyctl auth login` bajaring. So‘ng repo ildizidan app va volume yarating:

```sh
flyctl apps create sofexpo-api
flyctl volumes create sofexpo_data --region ist --size 1 --snapshot-retention 7 --app sofexpo-api
```

Volume hajmi bu yerda 1 GB, scheduled snapshot’lar yoqilgan va retention 7 kun. App va volume bir xil
Fly organization’da, volume esa `ist` regionida bo‘lishi shart. Repo ildizidagi `fly.toml` shu
app/volume nomlariga bog‘langan; nomlarni o‘zgartirsangiz, config’dagi qiymatlarni ham birga o‘zgartiring.

## 2. Fly secrets (qiymatlarni faqat operator kiritadi)

Quyidagi qiymatlar **Fly secrets** sifatida beriladi; ularni `fly.toml`, Docker image, Git yoki chat’ga
yozmang. O‘zingizning ishonchli terminalingizda `flyctl secrets set KEY=value ... --app sofexpo-api`
ko‘rinishida bajaring. Haqiqiy qiymatlarni komandaga qo‘yishda shell quoting’ga e’tibor bering.

| Secret nomi | Talab | Izoh |
|---|---|---|
| `GITHUB_TOKEN` | Blog sync push yoqilganida majburiy | `Elmun-Technologies/sofexpo.org` repo’siga cheklangan fine-grained token; faqat `Contents: Read and write`. Start script token bilan `origin` HTTPS URL’ini runtime’da sozlaydi, token image’ga kirmaydi va log’ga chiqarilmaydi. |
| `ADMIN_EMAIL` | Majburiy | Birinchi admin hisobi uchun email. |
| `ADMIN_PASSWORD` | Majburiy | Birinchi admin uchun noyob, kamida 12 belgili kuchli parol. Uni boshqa joyda qayta ishlatmang. |
| `TELEGRAM_BOT_TOKEN` | Telegram blog/webhook uchun majburiy | Kanalga admin qilib qo‘shilgan bot tokeni; lead bildirishnomalarida ham ishlatilishi mumkin. |
| `TELEGRAM_WEBHOOK_SECRET` | Blog webhook uchun majburiy | Telegram webhook header’i uchun tasodifiy, kamida 32 belgili qiymat. Operator o‘z terminalida `openssl rand -hex 32` bilan yaratishi mumkin. |
| `TELEGRAM_CHANNEL_ID` | Blog sync uchun majburiy | Kanalning `-100…` ko‘rinishidagi numeric ID’si. Bu credential emas, lekin Fly’da secret sifatida saqlash mumkin. |
| `TELEGRAM_CHAT_ID` | Ixtiyoriy | Lead bildirishnomalari yuboriladigan Telegram chat ID’si. |
| `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_TOKEN` | CRM ulansa ixtiyoriy | Tashqi CRM endpoint’i va uning credentials’i. |
| `LEAD_WEBHOOK_SECRET`, `LEAD_WEBHOOK_STATS_TOKEN` | Ixtiyoriy | Lead intake yoki server-to-server stats uchun alohida himoya kalitlari. |

`TELEGRAM_CHANNEL_USERNAME=sofexpo`, `TELEGRAM_WEBHOOK_URL` va boshqa maxfiy bo‘lmagan sozlamalar
allaqachon `fly.toml` dagi `[env]` da bor. `GITHUB_TOKEN` ni GitHub fine-grained token sifatida,
faqat shu repo va kerakli `Contents` ruxsati bilan yarating; PAT’ni hech qachon repo fayliga qo‘shmang.
Publisher `main` ga bevosita push qiladi, shuning uchun GitHub branch protection/rules bu tokenning
push’iga ruxsat berishi kerak.

> `ADMIN_EMAIL` / `ADMIN_PASSWORD` birinchi ishga tushishda adminni bootstrap qiladi. Fly secrets
> o‘rnatilgandan keyin serverni deploy/restart qiling. Admin parolini keyinchalik yangilash uchun
> mavjud backend admin CLI tartibidan foydalaning (`docs/17-backend-admin.md`).

## 3. Deploy va birinchi tekshiruv

PR merge bo‘lgach, production deploy’ni `main` branch’ning toza/latest checkout’idan qiling; Telegram
publisher runtime’da `origin/main` bilan `pull --rebase` qilib postlarni aynan `main` ga push qiladi.
Repo ildizida, secrets va volume tayyor bo‘lgach:

```sh
flyctl deploy --config fly.toml --app sofexpo-api
flyctl scale count 1 --app sofexpo-api
flyctl status --app sofexpo-api
flyctl checks list --app sofexpo-api
flyctl machines list --app sofexpo-api
flyctl logs --app sofexpo-api
```

Dockerfile `node:22-slim` va `git` ishlatadi; backend Node built-in’laridan boshqa runtime
dependency’ga ega emas, shuning uchun `npm install` / `npm ci` konteyner uchun kerak emas.
`.dockerignore` lokal `.env` faylini build context’dan chiqaradi, lekin `.git` va tracked repo
fayllarini saqlaydi — Telegram publisher maqola/media’ni shu checkout’da commit qilib `main` ga
push qilishi uchun. `GITHUB_TOKEN` Docker build vaqtida emas, Fly secret sifatida runtime’da beriladi.

Deploy tugagach aynan **bitta** running machine borligini va volume `/data` ga ulanganini tekshiring.
Fly check `GET /health` ga 200 javob olishi kerak. App’ning `fly.dev` manzilini vaqtincha olish uchun
`flyctl status --app sofexpo-api` chiqishini ko‘ring; custom domain ulanganidan keyin tekshiruvlar:

```sh
curl -fsS https://api.sof-expo.com/health
curl -fsS https://api.sof-expo.com/api/portal/options
```

Birinchi javobda `ok: true`, ikkinchisida portal event’lari bo‘lishi kerak. Admin sahifa:
`https://api.sof-expo.com/admin`; portal: `https://api.sof-expo.com/cabinet`.

## 4. Namecheap DNS va TLS

Deploy’dan so‘ng Fly’da custom certificate yarating va DNS uchun Fly ko‘rsatgan target’ni ko‘ring:

```sh
flyctl certs add api.sof-expo.com --app sofexpo-api
flyctl certs setup api.sof-expo.com --app sofexpo-api
```

Namecheap → **Domain List → sof-expo.com → Advanced DNS** da `api` host uchun CNAME yarating;
value sifatida Fly CLI ko‘rsatgan app hostname’ini ishlating (odatda `sofexpo-api.fly.dev`). Agar
CLI A/AAAA yozuvlarini taklif qilsa, aynan ko‘rsatilgan manzillarni kiriting. `sof-expo.com` apex
DNS yozuvlarini o‘zgartirmang — ular Vercel saytiga tegishli.

DNS tarqalgach sertifikat va HTTPS’ni tekshiring:

```sh
flyctl certs check api.sof-expo.com --app sofexpo-api
curl -fsS https://api.sof-expo.com/health
```

Sertifikat hali berilmagan bo‘lsa, CLI’dagi DNS holatini ko‘ring, Namecheap’dagi host/target’ni
tekshiring va qayta urinib ko‘ring. `api` CNAME’i Vercel saytini emas, `sofexpo-api` Fly app’ini
ko‘rsatishi kerak.

## 5. Vercel production env (3 ta)

Vercel’da **statik saytning** `sof-expo.com` production project’ini oching → **Settings → Environment
Variables**. Production environment uchun quyidagi uchta qiymatni qo‘shing yoki yangilang:

| Key | Value |
|---|---|
| `PUBLIC_LEAD_ENDPOINT` | `https://api.sof-expo.com/lead` |
| `PUBLIC_ANALYTICS_ENDPOINT` | `https://api.sof-expo.com/event` |
| `PUBLIC_PORTAL_URL` | `https://api.sof-expo.com` |

Bular public/build-time qiymatlar; token yoki boshqa secret qo‘ymang. `vercel.json`-dagi
`PUBLIC_HOSTS_MODE=alias` ni saqlang. Env’larni saqlagach Vercel’da production redeploy qiling —
ular yangi build’da HTML/JS’ga kiradi.

Backend’da `LEAD_WEBHOOK_ORIGINS` aniq ruxsat etilgan origin’larni allaqachon o‘z ichiga oladi.
CORS’ni production browser origin’i bilan tekshirish:

```sh
curl -i -X OPTIONS https://api.sof-expo.com/lead \
  -H 'Origin: https://sof-expo.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Kutilgan javob `204`, `Access-Control-Allow-Origin: https://sof-expo.com` va credentials header’i.
Boshqa production host qo‘shilsa, uni Fly `LEAD_WEBHOOK_ORIGINS` ro‘yxatiga aniq kiriting; `*`
ishlatmang. Vercel Preview URL’larini production allow-list’ga qo‘shish shart emas.

## 6. Telegram webhook’ni o‘rnatish

Buni faqat Fly deploy, DNS/TLS va `/health` muvaffaqiyatli bo‘lgandan keyin bajaring. Bot kanalga
**admin** qilib qo‘shilgan, `TELEGRAM_CHANNEL_ID` Fly secret’da bor, `TELEGRAM_BOT_TOKEN` va
`TELEGRAM_WEBHOOK_SECRET` esa Fly’da aynan production qiymatlar bilan sozlangan bo‘lishi kerak.

Operator kompyuterida repo `.gitignore` qiladigan lokal `.env` ni to‘ldiring (bu qiymatlarni repo’ga
commit qilmang), shu jumladan:

```dotenv
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_WEBHOOK_URL=https://api.sof-expo.com/api/telegram/webhook
```

Birinchi ikki qiymatni operator o‘zi lokal `.env` ga, Fly secrets’dagi bilan bir xil qilib kiritsin.

So‘ng mavjud skriptlarni ishga tushiring:

```sh
npm ci
npm run telegram:set-webhook
npm run telegram:webhook-info
```

`getWebhookInfo` natijasida webhook URL to‘g‘ri, `last_error_message` bo‘sh bo‘lishi kerak. Kanalga
sinov post yuborib `/admin → Blog · Telegram` da tekshiring. `BLOG_SYNC_MODE=auto`; publisher
`main` ga push qilganda Vercel Git integratsiyasi statik saytni qayta quradi. Deploy hook shart emas.
Lokal `.env` ni ish tugagach o‘chirib tashlang yoki xavfsiz joyda saqlang; `.env` hech qachon image,
Git yoki Vercel `PUBLIC_*` o‘zgaruvchilariga kirmasligi kerak.

## 7. Ishlatish, backup va tiklash

- **Bir machine’dan oshirmang.** `flyctl scale count 2` qilmang va `sofexpo_data` ni ikkinchi
  machine’ga ulamang. Bu backend SQLite single-writer sifatida loyihalangan.
- Fly health check `/health`, loglar `flyctl logs --app sofexpo-api`; secrets ro‘yxatini
  `flyctl secrets list --app sofexpo-api` bilan ko‘rish mumkin (qiymatlar qayta ko‘rsatilmaydi).
- `fly.toml` volume snapshot retention’ni 7 kunga o‘rnatadi. Vaqti-vaqti bilan volume/snapshot’lar
  mavjudligini `flyctl volumes list --app sofexpo-api` va
  `flyctl volumes snapshots list <VOLUME_ID> --app sofexpo-api` orqali tekshiring. Restore kerak
  bo‘lsa, yozuvlarni vaqtincha to‘xtating va snapshot’dan alohida volume yarating, masalan:
  `flyctl volumes create sofexpo_data_restore --region ist --size 1 --snapshot-id <SNAPSHOT_ID> --app sofexpo-api`.
  So‘ng `fly.toml` dagi mount source’ini tanlangan volume nomiga moslab deploy qiling; volume’ni
  faqat bitta machine’ga ulang. Avval tiklangan bazada
  admin/portal va `/health` ni tekshirib, keyin webhook’ni qayta faollashtiring.
- Volume snapshot’lari alohida off-site backup o‘rnini bosmaydi. SQLite `WAL` rejimida ishlaydi;
  faol `/data/sofexpo.sqlite` faylini yolg‘iz `cp` qilib olish izchil backup emas. Muhim ma’lumotlar
  uchun muntazam alohida backup va amalda tekshirilgan restore tartibini yo‘lga qo‘ying.
- GitHub PAT muddati tugasa, tokenni GitHub’da rotate qilib, yangi qiymatni operator terminalidan
  `flyctl secrets set GITHUB_TOKEN=... --app sofexpo-api` bilan yangilang, so‘ng machine’ni
  restart/deploy qiling. Tokenni log, Git yoki image ichiga kiritmang.
- `BLOG_SYNC_GIT_PUSH=1` faqat Fly runtime’da qoladi. Blog sync push’i muvaffaqiyatsiz bo‘lsa,
  `flyctl logs` dagi `[tg-blog]` xabarlarini va `GITHUB_TOKEN` ruxsatini tekshiring.

## 8. Qo‘lda bajariladigan yakuniy checklist

1. `flyctl` o‘rnating, signup/login qiling, `sofexpo-api` app va `sofexpo_data` volume’ni yarating.
2. Kerakli Fly secrets’larni o‘zingiz kiriting.
3. `flyctl deploy` qiling va bitta machine, volume, health check’ni tekshiring.
4. Namecheap’da `api` DNS yozuvini ulang va Fly TLS sertifikatini kutib tekshiring.
5. Vercel production’da yuqoridagi uchta `PUBLIC_*` env’ni qo‘shib redeploy qiling.
6. Lokal `.env` orqali `npm run telegram:set-webhook` bajaring va `webhook-info` bilan tekshiring.

Alohida sayt kontent vazifasi: `public/files/` dagi **21 ta placeholder PDF** ni tasdiqlangan haqiqiy
hujjatlar bilan almashtirish (`docs/10-download-readiness.md`). Bu Fly backend deploy’ining bir qismi
emas, lekin production kontentni yakunlash uchun qolgan.
