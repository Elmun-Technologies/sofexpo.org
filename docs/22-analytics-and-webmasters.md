# 22 · Search Console, Yandex, GA4, Metrika, Meta/TikTok pikselli — admin paneldan (2026-10-15)

Barcha kodlar **admin paneldan** ulanadi, dasturchi kerak emas:
`https://api.sof-expo.com/admin` → **Sayt → Analitika va SEO kodlari** (faqat administrator).

## 1. Qanday ishlaydi

1. Admin maydonga ID'ni yoki xizmat bergan **butun kodni** qo'yadi. Masalan, Metrika'ning
   to'liq `<script>…ym(98765432, "init"…)` kodi yoki Search Console'ning
   `<meta name="google-site-verification" content="…">` tegi. Kerakli ID o'zi ajratib olinadi.
   Noto'g'ri qiymat saqlanmaydi: maydon ostida xato yoziladi.
2. **Saqlash** bosilgach:
   - backend qiymatni SQLite'ga yozadi (`site_settings`);
   - `src/data/site-tags.json` faylini repoga yozadi;
   - `chore(site): site tags: … [admin]` commit qilib `main` ga push qiladi.
   Bunda blog sync bilan bir xil checkout, branch va `BLOG_SYNC_GIT_PUSH` ishlatiladi.
3. Push Vercel'da saytni qayta build qiladi (odatda 2–3 daqiqa). Kodlar barcha sahifalar va
   5 tilda `<head>` ga tushadi.
4. Push o'xshamasa (tarmoq, token), server keyingi ishga tushishida faylni qayta yozib, yana
   push qiladi (`SiteTagsService.heal`).
5. Har o'zgarish **Faoliyat tarixi**da qayd etiladi (`site_tags.update`).

| Guruh | Maydonlar |
| --- | --- |
| Qidiruv tizimlarida tasdiqlash | Google Search Console, Yandex Webmaster, Bing, Baidu (站长平台), Meta domain verification |
| Analitika | Google Analytics 4, Google Tag Manager, Yandex Metrika (+ Vebvizor yoqish/o'chirish), Baidu Tongji |
| Reklama piksellari | Google Ads (AW-…), Meta Pixel (Facebook/Instagram), TikTok Pixel |
| Qo'shimcha kod | Ro'yxatda yo'q xizmatlar uchun xom `<head>` kodi: Telegram Ads, VK, boshqa piksellar |

- Tasdiqlash meta-teglari har doim chiqadi.
- Analitika va piksellar **faqat** `sof-expo.com` va uning subdomenlarida yuklanadi. Vercel
  preview va localhost tashriflari statistikaga tushmaydi. "Qo'shimcha kod" bundan mustasno:
  u qanday yozilgan bo'lsa, shunday qo'yiladi.
- Kod: spec va validatsiya `scripts/site-tags.mjs` (backend ham, sayt build'i ham shuni
  ishlatadi); backend `scripts/backend/sitetags.mjs`, `GET/PUT /api/admin/site-tags`; sayt
  `src/lib/analytics.ts` va `src/components/conversion/SiteTags.astro`.
- `PUBLIC_GA4_ID`, `PUBLIC_YM_ID`, `PUBLIC_GOOGLE_SITE_VERIFICATION`,
  `PUBLIC_YANDEX_VERIFICATION`, `PUBLIC_BING_VERIFICATION` env'lari faqat zaxira: admin bo'sh
  qoldirgan maydonni to'ldiradi.

### Avtomatik yuboriladigan hodisalar

Saytning o'z konversiya hodisalari har bir ulangan xizmatga yuboriladi:

| Sayt hodisasi | GA4 / GTM | Yandex Metrika | Meta Pixel | TikTok | Baidu |
| --- | --- | --- | --- | --- | --- |
| `form_submit`, `quiz_submit` | event | goal | **Lead** | **SubmitForm** | _trackEvent |
| `phone_click`, `email_click`, `channel_click` | event | goal | **Contact** | **Contact** | _trackEvent |
| `cta_click`, `form_start`, `form_error`, `quiz_start`, `quiz_step` | event | goal | trackCustom | — | _trackEvent |

Sahifa ko'rishlari, scroll va vaqtni har bir xizmat o'zi hisoblaydi, shuning uchun ular
ikki marta yuborilmaydi. `form_submit` dagi `success: true` ariza serverga yetganini,
`fallback: true` esa WhatsApp yoki email orqali yuborilganini bildiradi.

## 2. Ulash tartibi (tavsiya)

1. **Google Search Console:** eng yaxshisi **Domain** turi — DNS'ga TXT yozuv qo'shiladi va
   barcha subdomenlar qamraladi, paneldagi maydon kerak bo'lmaydi. DNS'ga kirish bo'lmasa,
   **URL prefix → HTML tag** usulida tegni paneldagi maydonga qo'ying, Saqlash bosing,
   ~3 daqiqa kuting, keyin **Verify**. Undan so'ng **Sitemaps** →
   `https://sof-expo.com/sitemap-index.xml`, va **URL Inspection → Request indexing**.
2. **Yandex Webmaster:** meta-teg usuli → panel → Saqlash → tasdiqlash. Keyin
   **Indeksatsiya → Sitemap fayllari** ga `sitemap-index.xml` ni qo'shing.
3. **Bing:** "Import from Google Search Console" (kod kerak emas) yoki meta-teg.
4. **Baidu:** `ziyuan.baidu.com` → HTML标签验证 → panel. Statistika uchun Baidu Tongji kodi.
5. **GA4:** Measurement ID (`G-…`). Admin → Events → `form_submit` ni **Key event** qiling.
   Search Console bilan bog'lang.
6. **Yandex Metrika:** "Subdomenlarni hisobga olish" va Vebvizorni yoqing, hisoblagich
   raqamini panelga qo'ying. Maqsadlar:
   - "JavaScript-hodisa" turidagi maqsadlar: `form_submit`, `phone_click`, `channel_click`;
   - "Sahifaga tashrif" turidagi maqsad: URL tarkibida `thank-you`.
7. **Meta Pixel / TikTok Pixel:** Pixel ID → panel. Lead va Contact hodisalari avtomatik.
   Meta domain verification tegini ham shu sahifaga qo'ying.

## 3. Shartlar

- Backend Fly'da ishlab turishi kerak (`docs/20-fly-deploy.md`): `BLOG_SYNC_GIT_PUSH=1`,
  `BLOG_SYNC_REPO_DIR=/app`, `GITHUB_TOKEN` (repo'ga yozish ruxsati bilan). Push o'chiq
  bo'lsa, panel sariq ogohlantirish ko'rsatadi: saqlangan kodlar saytga faqat keyingi deploy
  bilan chiqadi.
- Maxfiylik siyosati (`/legal/privacy/`) 5 tilda GA, Metrika, Meta Pixel va shu kabi
  xizmatlarning cookie'larini tilga oladi.

## 4. Tekshirish

- Sahifa manbasida (`Ctrl+U`) `google-site-verification` va `yandex-verification` teglari
  ko'rinadi.
- **GA4:** Reports → **Realtime**.
- **Metrika:** hisoblagich holati "ishlayapti". Sayt manziliga `?_ym_debug=1` qo'shib ochsangiz,
  konsolda yuborilgan maqsadlar ko'rinadi.
- **Meta:** "Meta Pixel Helper" kengaytmasi yoki Events Manager → Test events.
- **TikTok:** "TikTok Pixel Helper".
