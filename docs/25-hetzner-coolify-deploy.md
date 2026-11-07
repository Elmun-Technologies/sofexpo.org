# 25 · Hetzner + Coolify: backend migration from Fly.io

Holat: 2026-11-07. Backend hozir Fly.io’da ishlaydi (`docs/20-fly-deploy.md`). Bu hujjat uni
Xezner serveridagi self-hosted Coolify’ga ko‘chirish uchun **tayyorgarlik** hujjati: kod va
konfiguratsiya tayyor, lekin bu sessiyadan Xezner serveriga SSH orqali ulanish yo‘q — quyidagi
qadamlarni operator o‘zining terminalidan bajaradi.

**Ko‘lam:** faqat backend (`api.sof-expo.com`) ko‘chadi. Statik sayt (`sof-expo.com`) Vercel’da
qoladi — `docs/20` dagi 5-band (Vercel `PUBLIC_*` env’lari) o‘zgarmaydi, chunki ular backend
manzilini `https://api.sof-expo.com` deb bilib qoladi, qaysi server shu nomni javob bersa ham.

> **SQLite cheklovi (docs/20’dagi bilan bir xil, lekin endi ikki host darajasida):** backend
> bitta yoziladigan SQLite fayl bilan ishlaydi. Fly va Hetzner’ni **bir vaqtda** production
> trafik bilan ishlatish mumkin emas — ikkalasi ham `/lead`, `/event`, admin/portal yozuvlarini
> qabul qilsa, ma’lumotlar ikki alohida faylga bo‘linib ketadi va birlashtirib bo‘lmaydi.
> Shuning uchun migratsiya **qattiq cutover**: bitta tekshiruv bosqichi (bo‘sh/sinov baza bilan,
> 2-band), so‘ng bitta real o‘tish bosqichi (Fly to‘xtatiladi → Hetzner yoqiladi, 4-band).
> Hech qachon ikkalasini ham `BLOG_SYNC_GIT_PUSH=1` yoki bir xil Telegram webhook bilan birga
> ishlatmang.

## 0. Nima tayyor, nima kerak

Shu reponing o‘zida tayyor:

- `Dockerfile` — host-agnostik, Fly va Coolify bir xil image’ni quradi (`scripts/backend/docker-start.sh`).
- `docker-compose.coolify.yml` — Coolify “Docker Compose” resursi shu faylni o‘qiydi: build,
  `/data` volume, health check, va `${VAR}` orqali Coolify’dagi environment variable’larga
  ishora qiladigan to‘liq env ro‘yxati.

Operatordan kerak bo‘ladigan narsalar:

- Xezner serveriga SSH kirish (IP, user, kalit) — bu sessiyada yo‘q.
- Coolify’ning shu serverga o‘rnatilgan (yoki o‘rnatiladigan) nusxasi.
- Fly’dagi barcha secret qiymatlar (`docs/20 §2` jadvali) — xuddi shu qiymatlarni Hetzner’da
  ham ishlatasiz (Telegram bot bitta, GitHub token bitta bo‘lib qoladi).
- Namecheap DNS’ga kirish (`sof-expo.com` zonasi).

## 1. Coolify’ni serverga o‘rnatish (agar hali o‘rnatilmagan bo‘lsa)

Operator Xezner serveriga SSH bilan kirib:

```sh
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

(Rasmiy o‘rnatish buyrug‘i — agar Coolify versiyasi farq qilsa, [coolify.io/docs](https://coolify.io/docs/installation)
dagi joriy buyruqni ishlating.) O‘rnatish tugagach brauzerda `http://<server-ip>:8000` ga kirib
birinchi admin hisobni yarating. Hetzner firewall’ida (agar Hetzner Cloud Firewall ishlatilsa)
kamida quyidagi portlar ochiq bo‘lishi kerak: `22` (SSH), `80`/`443` (Traefik, HTTP/HTTPS),
`8000` (Coolify panel — faqat o‘zingiz kiradigan IP’larga cheklashni tavsiya qilamiz).

## 2. Coolify’da resurs yaratish va birinchi (sinov) deploy

1. Coolify panel → **Projects** → yangi loyiha (masalan `sofexpo`) → **+ New Resource** →
   **Docker Compose** (yoki “Public Repository” tanlab, keyin compose rejimiga o‘ting).
2. Manba: GitHub repo `Elmun-Technologies/sofexpo.org`, branch `main`. Coolify’ning o‘z GitHub
   App’i yoki deploy key’i orqali ulaning (repo xususiy bo‘lsa shart).
3. **Compose file path**: `docker-compose.coolify.yml` (repo ildizida, yangi qo‘shilgan fayl).
4. **Environment Variables** bo‘limida `docs/20 §2` jadvalidagi har bir qiymatni kiriting —
   nomlari `docker-compose.coolify.yml`dagi `${VAR}` lar bilan **aynan** bir xil bo‘lishi kerak:
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`,
   `TELEGRAM_CHANNEL_ID`, `GITHUB_TOKEN`, va ixtiyoriy: `TELEGRAM_CHAT_ID`, `CRM_WEBHOOK_URL`,
   `CRM_WEBHOOK_TOKEN`, `LEAD_WEBHOOK_SECRET`, `LEAD_WEBHOOK_STATS_TOKEN`. Qiymatlarni Fly
   secrets bilan **bir xil** qiling (bir xil Telegram bot, bir xil admin — ikkita alohida admin
   hisobi yaratmang). “Is Secret” belgisini qo‘ying — Coolify ularni UI’da yashiradi.
5. **Birinchi deploy’ni sinov rejimida qiling**: compose faylida `BLOG_SYNC_GIT_PUSH=0` turibdi
   (shunday qoldiring hozircha) — bu bosqichda baza bo‘sh/yangi bo‘ladi, hali production
   ma’lumotlariga tegmaysiz. **Deploy** tugmasini bosing.
6. Coolify beradigan vaqtinchalik domen (masalan `*.sslip.io` yoki siz qo‘shgan test subdomen,
   lekin **`api.sof-expo.com` emas** — u hali Fly’ni ko‘rsatib turibdi) orqali tekshiring:

   ```sh
   curl -fsS https://<coolify-berib-turgan-domen>/health
   curl -fsS https://<coolify-berib-turgan-domen>/api/portal/options
   ```

   Ikkalasi ham `ok: true` qaytarishi, admin panel (`/admin`) yangi `ADMIN_EMAIL`/`ADMIN_PASSWORD`
   bilan ochilishi kerak. Bu bosqichda **hali** Namecheap DNS’ga tegmang va Telegram webhook’ni
   qayta sozlamang — bu hali faqat “konteyner to‘g‘ri quriladimi” tekshiruvi.
7. Tekshiruv o‘tgach, bu sinov deploy’ni **to‘xtating yoki o‘chiring** (yoki hech bo‘lmasa
   `/data` volume’ini tozalang) — 4-banddagi haqiqiy cutover’da bu xuddi shu resurs **bo‘sh
   emas, Fly’dan ko‘chirilgan** haqiqiy baza bilan qayta ishga tushadi.

## 3. Domen: hozircha ulamang

`api.sof-expo.com` ni Coolify resursining **Domains** maydoniga qo‘shish mumkin (Coolify Traefik
orqali Let’s Encrypt sertifikatini avtomatik oladi), lekin buni **faqat 4-band — haqiqiy
cutover — vaqtida** qiling. Undan oldin domen hali Fly’ni ko‘rsatib turishi kerak — aks holda
ikkala host ham bitta nomga javob berib, trafik tasodifiy bo‘linib ketishi mumkin.

## 4. Haqiqiy cutover (ma’lumotni ko‘chirish + DNS almashtirish)

Bu bosqichni **past trafik vaqtida** (tunda, Samarqand vaqti bilan) bajaring va oldindan
operator e’lon qilib qo‘ysin — bir necha daqiqa `/lead`, `/event`, admin/portal vaqtincha
ishlamasligi mumkin (SQLite volume ko‘chirilayotganda).

1. **Fly’ni faqat yozishdan to‘xtating** (o‘chirmang hali — zaxira sifatida kerak bo‘ladi):

   ```sh
   flyctl scale count 0 --app sofexpo-api
   ```

2. **Fly volume’dan ma’lumotni oling.** Eng oddiy yo‘l — Fly machine’ni vaqtincha qayta
   ishga tushirib (`flyctl scale count 1`), `flyctl ssh console --app sofexpo-api` bilan
   kirib, `/data` papkasini siqib, operator kompyuteriga tortib olish:

   ```sh
   flyctl scale count 1 --app sofexpo-api
   flyctl ssh console --app sofexpo-api -C "tar -czf /tmp/sofexpo-data.tgz -C /data ."
   flyctl ssh sftp get /tmp/sofexpo-data.tgz ./sofexpo-data.tgz --app sofexpo-api
   flyctl scale count 0 --app sofexpo-api
   ```

   (`sofexpo.sqlite`, `sofexpo.sqlite-wal`, `sofexpo.sqlite-shm`, `uploads/` shu arxivda bo‘ladi.)
3. **Arxivni Hetzner serveriga yuboring** va Coolify’ning `/data` volume’iga joylashtiring:

   ```sh
   scp ./sofexpo-data.tgz user@<hetzner-ip>:/tmp/
   ssh user@<hetzner-ip>
   # konteyner ichidagi named volume’ni toping (Coolify UI’da yoki `docker volume ls`),
   # masalan sofexpo_backend_sofexpo_data
   docker run --rm -v <volume-nomi>:/data -v /tmp:/backup alpine \
     sh -c "rm -rf /data/* && tar -xzf /backup/sofexpo-data.tgz -C /data"
   ```
4. **Coolify resursini qayta deploy qiling** (2-banddagi resurs, endi haqiqiy ma’lumot bilan).
   Deploy tugagach `/health` va `/api/portal/options` ni **Coolify’ning vaqtinchalik
   domenidan** qayta tekshiring (3-band).
5. **`api.sof-expo.com` ni Coolify’ga ulang**: resursning **Domains** maydoniga
   `https://api.sof-expo.com` qo‘shing. Namecheap → **Domain List → sof-expo.com → Advanced
   DNS** da `api` host’ining CNAME/A yozuvini Coolify ko‘rsatgan manzilga (odatda server IP’si,
   A yozuv sifatida) o‘zgartiring. `sof-expo.com` apex yozuvlarini o‘zgartirmang (Vercel’niki).
6. DNS tarqalgach va Coolify Let’s Encrypt sertifikatini olgach:

   ```sh
   curl -fsS https://api.sof-expo.com/health
   curl -fsS https://api.sof-expo.com/api/portal/options
   curl -i -X OPTIONS https://api.sof-expo.com/lead \
     -H 'Origin: https://sof-expo.com' \
     -H 'Access-Control-Request-Method: POST' \
     -H 'Access-Control-Request-Headers: content-type'
   ```

   (`204` + `Access-Control-Allow-Origin: https://sof-expo.com` kutiladi — `docs/20 §5`dagi
   bilan bir xil tekshiruv.)
7. **Endi, va faqat endi**, Coolify’dagi `BLOG_SYNC_GIT_PUSH` ni `1` ga o‘zgartiring (Coolify
   env var UI’sida) va resursni qayta deploy qiling. Fly’dagi `BLOG_SYNC_GIT_PUSH` bu vaqtda
   allaqachon amalda ishlamaydi, chunki Fly machine `count 0` (1-band).
8. **Telegram webhook’ni Hetzner’ga qayta ko‘rsating.** `.env` (lokal, operator kompyuterida)
   `TELEGRAM_WEBHOOK_URL=https://api.sof-expo.com/api/telegram/webhook` — bu URL o‘zgarmaydi
   (domen bir xil), shuning uchun webhook’ni qayta ro‘yxatdan o‘tkazish shart emas, lekin
   tekshirib qo‘ying:

   ```sh
   npm run telegram:webhook-info
   ```

   `url` to‘g‘ri va `last_error_message` bo‘sh bo‘lishi kerak. Kanalga sinov post yuborib
   `/admin → Blog · Telegram` da ko‘rinishini tasdiqlang.
9. Admin panelga kirib (`https://api.sof-expo.com/admin`), bir nechta leads/portal yozuvi
   ko‘rinishini tekshiring — bular Fly’dan ko‘chirilgan eski ma’lumotlar bo‘lishi kerak.

## 5. Orqaga qaytarish (rollback)

Agar 4-banddan keyin biror narsa noto‘g‘ri ketsa, 24 soat ichida (Fly machine hali o‘chirilmagan
bo‘lsa):

```sh
flyctl scale count 1 --app sofexpo-api
```

Namecheap’da `api` yozuvini Fly’ning avvalgi target’iga qaytaring (`docs/20 §4`). **Diqqat:**
rollback vaqtida Hetzner’da yozilgan yangi ma’lumotlar (4-banddan keyin kelgan lead’lar, blog
post’lar) Fly’ning eski bazasida bo‘lmaydi — rollback faqat “hali hech kim Hetzner’ga yozmagan”
qisqa oyna ichida xavfsiz. Shuning uchun 4-bandni qisqa ushlang va darhol tekshiring.

## 6. Fly’ni nihoyat o‘chirish (faqat barcha narsa bir necha kun barqaror ishlagach)

```sh
flyctl apps destroy sofexpo-api
```

Buni **shoshilmay**, kamida bir necha kun Hetzner’da hamma narsa (admin, portal, Telegram sync,
CRON uptime check) barqaror ishlaganini ko‘rgandan keyin bajaring. Shundan so‘ng:

- `fly.toml`, `.github/workflows/deploy-backend.yml` ni repodan olib tashlash mumkin (yoki
  tarix uchun saqlab, ishlatilmayotganini hujjatlashtirish mumkin) — bu alohida, keyingi PR.
- `docs/20-fly-deploy.md` boshidagi migratsiya eslatmasini “bekor qilindi, Hetzner production”
  ga yangilang.

## 7. Backup va monitoring (Hetzner’da)

- SQLite WAL rejimida ishlaydi — Fly’dagi kabi, faol faylni oddiy `cp` qilish izchil backup
  emas (`docs/20 §7`). Hetzner’da muntazam backup uchun: konteynerni to‘xtatmasdan
  `sqlite3 /data/sofexpo.sqlite ".backup /data/backup-$(date +%F).sqlite"` kabi SQLite’ning
  o‘z backup buyrug‘idan foydalaning (atomik, WAL bilan mos), so‘ng natijani serverdan
  tashqariga (masalan Hetzner Storage Box yoki boshqa off-site joyga) ko‘chiring. Buni cron
  bilan avtomatlashtirish — alohida vazifa.
- `.github/workflows/backend-uptime.yml` o‘zgarishsiz qoladi — u `https://api.sof-expo.com/health`
  ni tekshiradi, DNS Hetzner’ga ko‘chgach avtomatik ravishda Hetzner’ni tekshira boshlaydi.
- Coolify’ning o‘z monitoring/log paneli bor (**Logs** tab resurs sahifasida) — `flyctl logs`
  o‘rnini shu bosadi.

## 8. Qisqa checklist

1. Coolify’ni Xezner serveriga o‘rnating (1-band), agar hali yo‘q bo‘lsa.
2. Coolify’da `docker-compose.coolify.yml` asosida resurs yarating, barcha env/secret’larni
   Fly’dagi bilan bir xil kiriting, `BLOG_SYNC_GIT_PUSH=0` bilan sinov deploy qiling (2-band).
3. Vaqtinchalik domen orqali `/health`, `/api/portal/options`, admin panelni tekshiring.
4. Past trafik vaqtida: Fly’ni yozishdan to‘xtating → `/data` ni ko‘chiring → Coolify’ni
   qayta deploy qiling → `api.sof-expo.com` ni Coolify’ga DNS bilan ulang → `BLOG_SYNC_GIT_PUSH=1`
   qiling → Telegram webhook’ni tekshiring (4-band, 1–9 qadamlar).
5. Bir necha kun barqarorlikni kuzating, so‘ng Fly app’ini o‘chiring (6-band).
6. Hetzner’da muntazam SQLite backup’ni sozlang (7-band).
