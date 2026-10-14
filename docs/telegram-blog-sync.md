# Telegram kanal → sayt blogi sinxronizatsiyasi

Telegram kanalidagi yangi post avtomatik ravishda saytdagi `/news/` (yoki `/articles/`) bo‘limida
maqola bo‘lib chiqadi; kanalda tahrirlansa, saytdagi maqola ham yangilanadi. Polling ishlatilmaydi —
faqat **webhook**. Bu hujjat: bot yaratishdan troubleshooting’gacha bo‘lgan to‘liq yo‘l xaritasi.

> **Arxitektura (qisqa):** sayt statik (Astro SSG, Cloudflare Pages), shuning uchun "revalidate"ning
> bu yerda analogi — **repo’ga markdown yozib git push qilish**: push Cloudflare Pages’ni qayta
> quradi. Canonical holat backend SQLite’sida turadi; markdown/media — uning deterministik
> proektsiyasi. Modul: `scripts/backend/tgblog/`, route: `POST /api/telegram/webhook`.
>
> ```
> Kanal post → Bot API webhook → POST /api/telegram/webhook (sekret + channel id tekshiruvi)
>   → darhol 200 → fon: parse (UTF-16 entities→HTML, teglar, sarlavha)
>   → media Bot API’dan yuklab olinadi → public/images/telegram/…
>   → SQLite upsert ((chat_id, message_id) unique; album media_group bo‘yicha birlashadi)
>   → src/content/<kolleksiya>/<locale>/<slug>.md yoziladi
>   → debounce bilan git add/commit/pull --rebase/push (+ deploy hook’lar) → CF Pages rebuild
> ```

## 1. Bot yaratish (BotFather)

1. Telegram’da [@BotFather](https://t.me/BotFather) → `/newbot` → nom va username bering.
2. Olingan token’ni backend `.env` ga yozing: `TELEGRAM_BOT_TOKEN=…`
   (xuddi shu token lead-xabarnomalar uchun ham ishlatiladi — bitta bot kifoya).
3. Botni **kanalga ADMIN qilib qo‘shing** (kanal → Manage channel → Administrators → Add admin).
   `channel_post`/`edited_channel_post` update’lari faqat shunda keladi. Post yuborish huquqi
   kerak emas — o‘qish kifoya.

## 2. Kanal ID sini olish

`TELEGRAM_CHANNEL_ID` — `-100…` ko‘rinishdagi son. Eng ishonchli usul (bot allaqachon admin):

```bash
# .env ga TELEGRAM_CHANNEL_USERNAME=sofexpo yozing, so‘ng:
npm run telegram:webhook-info
# chiqadi: kanal: SOF EXPO | TELEGRAM_CHANNEL_ID=-1001234567890
```

`getChat(@username)` faqat bot kanal a’zosi (admin) bo‘lganda ishlaydi. Alternativa: web.telegram.org’da
kanalni oching — URL’dagi son `-100` prefiksi bilan ID hisoblanadi.

## 3. `.env` to‘ldirish

```bash
TELEGRAM_BOT_TOKEN=123456:ABC…               # §1
openssl rand -hex 32                          # → TELEGRAM_WEBHOOK_SECRET (32+ belgi)
TELEGRAM_WEBHOOK_SECRET=<yuqoridagi qiymat>
TELEGRAM_CHANNEL_ID=-1001234567890            # §2
TELEGRAM_CHANNEL_USERNAME=sofexpo
TELEGRAM_WEBHOOK_URL=https://api.sof-expo.com/api/telegram/webhook
BLOG_SYNC_MODE=draft                          # sinov davrida draft tavsiya etiladi
```

Qolgan sozlamalar (`.env.example` da izohlangan): `BLOG_SYNC_COLLECTION=news`, `BLOG_SYNC_LOCALE=ru`,
`BLOG_SYNC_HASHTAG=` (bo‘sh — hamma postlar; masalan `blog` yozilsa faqat `#blog` li postlar),
`BLOG_SYNC_MAX_FILE_MB=20` (yuqori chegara — Bot API’ning o‘z limiti), git boshqaruvi (§6).

Backend restartdan keyin log’da ko‘rinishi kerak:
`[lead-backend] telegram→blog sync: ON /api/telegram/webhook (channel @sofexpo, mode draft, news/ru, git push on)`.

## 4. Webhook o‘rnatish

Webhook URL’i **backend** serverining public HTTPS manzili bo‘lishi kerak (masalan
`https://api.sof-expo.com/api/telegram/webhook`; statik saytda emas!). Backend proxy’si
(Caddy/nginx) shu yo‘lni ochiq qoldiradi — secret header uni himoya qiladi.

```bash
npm run telegram:set-webhook          # setWebhook + getWebhookInfo tekshiruvi bilan
npm run telegram:webhook-info         # holatni istalgan vaqtda ko‘rish
# bekor qilish: node --env-file-if-exists=.env scripts/telegram-set-webhook.mjs unset
```

Skript `allowed_updates: ["channel_post","edited_channel_post"]` va `secret_token` ni yuboradi.
Tekshiruv: kanalga test post yozing → 1–2 daqiqada `/admin → Blog · Telegram` ro‘yxatida chiqishi
kerak (`BLOG_SYNC_MODE=draft` da "Qoralama" holatida).

## 5. Publikatsiya oqimi

- `BLOG_SYNC_MODE=auto` — post darhol e’lon qilinadi (`draft: false`).
- `BLOG_SYNC_MODE=draft` — qoralama; `/admin → Blog · Telegram` da **E’lon qilish** tugmasi.
- **Tahrir** (`edited_channel_post`): matn, teglar, excerpt va media yangilanadi; **slug o‘zgarmaydi**
  (SEO havolasi tirik qoladi). Tahrir qoralamani avtomatik e’lon qilmaydi.
- **O‘chirish:** Bot API delete hodisasini umuman yubormaydi. Shu sabab o‘chirish faqat admindan:
  **O‘chirish** tugmasi markdown faylni va `public/images/telegram/<slug>/` papkasini olib tashlaydi,
  qator esa *tombstone* (`deleted`) bo‘lib qoladi — keyingi tahrir/retry maqolani tiriltirmaydi.
  Barcha amallar audit log’ga yoziladi (`blog.publish` / `blog.unpublish` / `blog.delete`).
- **Album** (`media_group`): har bir xabar alohida keladi; pipeline kutish/taymer ishlatmaydi —
  birinchi rasm (xabar tartibi bo‘yicha) cover/OG image bo‘ladi, caption qaysi xabarda bo‘lsa matn
  o‘shandan olinadi. Albom tahrirlanganda (caption’li xabar tahrirlansa) maqola yangilanadi.
- **Kontent qoidalari:** sarlavha — birinchi qator (≤100 belgi, body’dan olib tashlanadi; bo‘sh/uzun
  bo‘lsa matn boshidan qisqartiriladi); `#teglar` maqola tegiga aylanib body’dan o‘chiriladi;
  `description` ~155 belgi; kirill sluglarni lotinchaga transliteratsiya qiladi (takror yuzasidan
  `-2`, `-3`). Emoji/UTF-16 offsetlar to‘g‘ri ishlaydi; HTML whitelist asosida — XSS imkonsiz.
- Har bir maqola: `<title>`, meta description, OG/Twitter og-image (hero), canonical,
  JSON-LD (Article + Breadcrumb), sitemap va RSS’ga avtomatik kiradi (mavjud komponentlar
  frontmatter’dan o‘qiydi), sahifa oxirida **"Telegram’da o‘qish"** havolasi chiqadi.

## 6. "Revalidate": git push va deploy hook’lar

Sinxron fayllarni backend ishlayotgan **checkout** ichiga yozadi (`BLOG_SYNC_REPO_DIR`, default `.`).
Odatiy prod sozlama:

```bash
BLOG_SYNC_GIT_PUSH=1
BLOG_SYNC_GIT_REMOTE=origin
BLOG_SYNC_GIT_BRANCH=main
BLOG_SYNC_PUSH_DEBOUNCE_MS=20000      # albom burstlari bitta commit bo‘lsin
# ixtiyoriy: BLOG_SYNC_DEPLOY_HOOK_URLS=https://api.cloudflare.com/pages/.../deploy_hooks/<id>
```

- Serverda repo checkout + `git` + push huquqi (SSH kalit yoki token) bo‘lishi shart; commit’lar
  `chore(content): telegram sync — … [tg-sync]` imzosi bilan tushadi, oldin `pull --rebase` bajariladi.
- `BLOG_SYNC_GIT_PUSH=0` (default): fayllar faqat yoziladi — xavfsiz rejim; ularni o‘zingiz
  commit/push qilishingiz yoki sozlama yoqqaningizdan keyingi sync kutishingiz mumkin.
- Deploy hook’lar har bir publish’dan so‘ng POST qilinadi (push o‘chiq bo‘lsa ham rebuild
  majburlash uchun qulay; hook URL’i secret — `.env` da qoladi).

## 7. Backfill (eski postlarni import qilish)

Bir martalik, kanal tarixini public `t.me/s/<username>` sahifasidan o‘qib, **xuddi shu pipeline**dan
o‘tkazadi (formatlash/media/store bir xil):

```bash
npm run telegram:backfill -- --dry-run --limit 20   # avval har doim dry-run
npm run telegram:backfill -- --limit 50             # yozadi, push qilmaydi
npm run telegram:backfill -- --limit 50 --push      # yozadi + commit/push
```

- **Idempotent:** `(chat_id, message_id)` pipeline’unung PK’si — qayta urish import qilingan
  xabarlarni o‘tkazib yuboradi. Rasmlar `bf-<msgid>` uid bilan — qayta yuklab olinmaydi.
- **MUHIM:** import’ni **production SQLite yonida** bajaring (`--db /path/to/sofexpo.sqlite` yoki
  to‘g‘ridan-to‘g‘ri serverda). Aks holda webhook-DB backfill qilingan xabarlarni tanimaydi va
  ularga keyin keladigan tahrirlar dublikat maqola yaratishi mumkin. Buning uchun himoya ham bor
  (edit kelganda `telegram:` frontmatter orqali slug "adopt" qilinadi), lekin albumlarning boshqa
  xabarlari uchun u yordam bermaydi — to‘g‘ri yo‘l: prod DB’da backfill.
- t.me/s mirror’dan real `media_group_id` o‘qib bo‘lmaydi; albomlar bitta vidjetda keladi va
  anchor xabar ID’si orqali dedupe qilinadi. Videolar mirror’dan yuklab olinmaydi — maqolaga
  Telegram havolasi qo‘yiladi (xuddi 20 MB qoidasidagi kabi).
- `--dry-run`: hech narsa yozmaydi/yuklamaydi — faqat topilgan xabarlar ro‘yxatini chiqaradi.

## 8. Muhim bo‘shliqlar va cheklovlar (pitfalls)

1. **20 MB:** Bot API `getFile` 20 MB dan kattaroq faylni qaytarmaydi. Katta video/fayl maqolada
   "Telegram’da ko‘rish" havolasiga aylanadi (`BLOG_SYNC_MAX_FILE_MB` bilan pastga borish mumkin).
2. **Delete event yo‘q:** §5. O‘chirilgan kanal posti saytda qoladi — admindan o‘chiring.
3. **Media URL’larida token bor:** biz ularni hech qayerga saqlamaymiz/loglamaymiz; DB va repoda
   faqat `/images/telegram/…` yo‘llari turadi.
4. **Telegram retry:** webhook har doim 200 qaytaradi (xato bo‘lsa ham — faqat secret/payload
   validatsiyasi 401/400 beradi), dublikat upsert `(chat_id, message_id)` bilan bloklanadi;
   eski tahrir payload’i yangirog‘ining ustiga yozilmaydi (`edit_date` solishtiriladi).
5. **Hashtag filtri:** `BLOG_SYNC_HASHTAG` berilganda tag’siz postlar umuman kirmaydi; tahrir
   paytida tag olib tashlansa maqola saqlanib qoladi (avtomatik unpublish yo‘q).
6. **Til:** `BLOG_SYNC_LOCALE` faqat `ru`/`en` (sayt kontenti shu ikki tilda; `uz` yoqish uchun
   alohida tahririy qaror — `docs/02`).
7. **SQLite:** canonical holat — uni periodik backup qiling; fayllar undan qayta materializatsiya
   qilinadi, lekin admin-holatlar (draft/unpublished) faqat DB’da.

## 9. Troubleshooting

| Alomat | Sabab / yechim |
| --- | --- |
| Post kanalda bor, adminda yo‘q | `npm run telegram:webhook-info` — `last_error_message` ni ko‘ring; backend log’da `[tg-blog]` qidirish; `TELEGRAM_CHANNEL_ID` noto‘g‘ri bo‘lishi mumkin (§2). |
| `last_error_message: Wrong response: 401` | `TELEGRAM_WEBHOOK_SECRET` webhook o‘rnatilgan va serverdagi qiymat bir xilmi? §4’ni qayta bajaring. |
| `last_error_message: Connection refused/timeout` | Backend hostiga Telegram serverlari kira olmayapti — firewall/HTTPS/proxy tekshiring; `/health` public ochiqmi? |
| Maqola bor, saytda yo‘q | `BLOG_SYNC_GIT_PUSH=1`mi? Git kredensiallari bormi (log’da `repo publish failed`)? `BLOG_SYNC_MODE=draft` bo‘lsa admin paneldan e’lon qiling. Build ~2–5 daqiqa oladi. |
| Albom faqat bitta rasm bilan chiqdi | Qolgan xabarlar hali kelmagan bo‘lishi mumkin — keyingi xabarlar merge qiladi. `tg_blog_posts.media_json` ni tekshiring. |
| Dublikat maqola (tahrirdan keyin) | Backfill boshqa DB’da qilingan — §7 ogohlantirishini ko‘ring; dublikatni admindan o‘chiring. |
| `repo publish failed: could not read Username` | Server git’ga push qila olmayapti — SSH agent/kalit yoki PAT sozlang, `git -C <repo> ls-remote` bilan tekshiring. |
| Test post o‘chirib yuborilganini qayta tiklash | DB’da tombstone (`deleted`) — SQLite’dan status’ni `draft` ga qaytaring yoki qatorni o‘chiring va postni qayta tahrirlang (edit webhook yangidan yaratadi). |

Qo‘shimcha foydali buyruqlar:

```bash
node --env-file-if-exists=.env scripts/telegram-set-webhook.mjs unset   # webhook’ni o‘chirish
sqlite3 .data/sofexpo.sqlite 'select id,slug,status,edited_at from tg_blog_posts'   # holat
```
