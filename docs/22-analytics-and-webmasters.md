# 22 · Search Console, Yandex Webmaster, GA4 va Yandex Metrika (2026-10-15)

Sayt bu xizmatlarga **oldindan tayyorlangan**: kod hammasi joyida, faqat ID/tokenlarni
Vercel'ga qo'yish (yoki menga yuborish) qoladi. ID qo'yilmaguncha sahifaga hech narsa
yuklanmaydi.

## 1. Qanday ishlaydi

| O'zgaruvchi | Nima | Qiymat namunasi |
| --- | --- | --- |
| `PUBLIC_GA4_ID` | Google Analytics 4 measurement ID | `G-ABC123XYZ9` |
| `PUBLIC_YM_ID` | Yandex Metrika hisoblagich raqami | `98765432` |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console HTML-teg tokeni | `content="…"` ichidagi qiymat |
| `PUBLIC_YANDEX_VERIFICATION` | Yandex Webmaster meta-teg tokeni | `content="…"` ichidagi qiymat |
| `PUBLIC_BING_VERIFICATION` | Bing Webmaster `msvalidate.01` tokeni | `content="…"` ichidagi qiymat |

- Kod: `src/lib/analytics.ts` (ID formatini tekshiradi, noto'g'ri qiymat tashlab yuboriladi),
  `src/layouts/Base.astro` (meta-teglar + skript).
- Bir nechta property bo'lsa (masalan, har subdomen uchun alohida token) — vergul bilan:
  `tokenA,tokenB`.
- GA4 va Metrika **faqat** `sof-expo.com` va uning subdomenlarida ishga tushadi —
  Vercel preview, localhost tashriflari statistikaga tushmaydi.
- Metrika: Vebvizor, klik xaritasi, tashqi havolalar va aniq bounce yoqilgan.
- Saytning o'z konversiya hodisalari GA4'ga **event**, Metrika'ga **goal (JavaScript-hodisa)**
  sifatida bir xil nom bilan yuboriladi:

| Hodisa | Qachon |
| --- | --- |
| `form_submit` | forma yuborildi (`success: true` — serverga yetdi; `fallback: true` — WhatsApp/email orqali) |
| `form_start` | formaga birinchi marta yozishni boshladi |
| `form_error` | forma xatosi |
| `phone_click`, `email_click` | telefon / email bosildi |
| `channel_click` | Telegram/WhatsApp kabi kanal bosildi |
| `cta_click` | asosiy tugma (stend band qilish va h.k.) bosildi |
| `quiz_start`, `quiz_step`, `quiz_submit` | stend kvizi bosqichlari |

  Sahifa ko'rishlari, scroll va vaqt GA4/Metrika'ning o'zida hisoblanadi (ikki marta sanalmaydi).
- Asosiy konversiya uchun Metrika'da yana bitta maqsad qulay: **URL** `thank-you` (har tilda
  `/…/thank-you/`) — muvaffaqiyatli arizadan keyin shu sahifa ochiladi.
- Maxfiylik siyosati (`/legal/privacy/`) GA va Metrika cookie'larini 5 tilda tilga oladi.

## 2. Ulash tartibi

### Google Search Console (birinchi)
1. search.google.com/search-console → **Add property**.
2. Tavsiya: **Domain** turi (`sof-expo.com`) — DNS'ga TXT yozuv qo'shiladi va bitta property
   barcha subdomenlarni (foodera., buildpro., …) qamraydi. Kod o'zgarmaydi.
3. DNS'ga kirish bo'lmasa: **URL prefix** → `https://sof-expo.com/` → *HTML tag* →
   `content="…"` qiymatini `PUBLIC_GOOGLE_SITE_VERIFICATION` ga qo'ying, deploy, keyin **Verify**.
4. **Sitemaps** → `https://sof-expo.com/sitemap-index.xml` yuboring.
5. **URL Inspection** → bosh sahifa → **Request indexing** (yangi ikonka tezroq chiqadi).

### Yandex Webmaster
1. webmaster.yandex.ru → sayt qo'shish `https://sof-expo.com`.
2. **Meta-teg** usuli → tokenni `PUBLIC_YANDEX_VERIFICATION` ga qo'ying, deploy, tasdiqlang.
3. **Indeksatsiya → Sitemap fayllari** → `https://sof-expo.com/sitemap-index.xml`.
4. Har subdomen (agar ulangan bo'lsa) — alohida sayt sifatida, tokenlar vergul bilan.

### Bing Webmaster (ixtiyoriy, 2 daqiqa)
- bing.com/webmasters → **Import from Google Search Console** — tasdiqlash shart emas.
  Yoki `msvalidate.01` tokenini `PUBLIC_BING_VERIFICATION` ga qo'ying.

### Google Analytics 4
1. analytics.google.com → Admin → **Create property** → Web stream `https://sof-expo.com`.
2. Measurement ID (`G-…`) ni `PUBLIC_GA4_ID` ga qo'ying.
3. Admin → Events → `form_submit` (va xohlasangiz `phone_click`) ni **Key event** qilib belgilang.
4. Admin → Product links → **Search Console** bilan bog'lang.

### Yandex Metrika (Vebvizor)
1. metrika.yandex.ru → **Hisoblagich qo'shish** → sayt `sof-expo.com`,
   "Subdomenlarni hisobga olish" belgilang, **Vebvizor** yoqing.
2. Hisoblagich raqamini `PUBLIC_YM_ID` ga qo'ying (kodni o'zingiz qo'ymang — sayt o'zi qo'yadi).
3. **Maqsadlar**: "JavaScript-hodisa" → identifikator `form_submit`; yana `phone_click`,
   `channel_click`; va "Sahifaga tashrif" → URL tarkibida `thank-you`.

## 3. ID'larni qayerga qo'yish

- **Vercel (production):** Project → Settings → Environment Variables → yuqoridagi nomlar,
  *Production* (va xohlasangiz *Preview*) → **Redeploy**. `PUBLIC_*` qiymatlar build paytida
  HTML'ga yoziladi, shuning uchun qayta deploy shart.
- Yoki ID'larni menga yuboring — `vercel.json` → `build.env` ga yozib push qilaman (bu ID'lar
  maxfiy emas, ular baribir har sahifa HTML'ida ko'rinadi).
- **Cloudflare Pages (subdomenlar):** GitHub → Settings → Secrets and variables → Actions →
  **Variables** (Secrets emas) — xuddi shu nomlar; `deploy.yml` ularni build'ga uzatadi.

## 4. Tekshirish

- Sahifa manbasida (`Ctrl+U`) `google-site-verification` / `yandex-verification` meta-teglari.
- GA4 → Reports → **Realtime**; Metrika → hisoblagich holati "ishlayapti", Vebvizor yozuvlari
  ~1 soat ichida chiqadi.
- Metrika'da `?_ym_debug=1` qo'shib ochsangiz, konsolda yuborilgan maqsadlar ko'rinadi.
