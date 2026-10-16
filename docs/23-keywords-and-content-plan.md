# 23. Kalit so'zlar (5 til) va kontent-reja — global qidiruv uchun

Holat: 2026-10-16. Davomi: `docs/16-keyword-audit.md` (metodika) va `docs/02-semantic-core.md`.

## 1. Xulosa: sayt SEO talablariga qanchalik mos

**On-page va texnik qism — tayyor.** Har bir build quyidagilarni tekshiradi (`npm run check`):

| Talab | Holat | Qayerda |
|---|---|---|
| 5 til: ru, en, uz, zh, tr — har biri o'z URL'ida | ✓ | `src/i18n/config.ts`, `scripts/localized-editions.mjs` |
| `hreflang` 5 til + `x-default` (en), `zh-CN` | ✓ | `Base.astro`, sitemap `xhtml:link` |
| canonical, OG/Twitter, JSON-LD (Organization, Event, Article, Breadcrumb, ItemList) | ✓ | `src/lib/seo.ts` |
| title ≤ 70 (CJK ≤ 36), description ≤ 160 (CJK ≤ 80) | ✓ | `scripts/fit-meta.mjs` |
| sitemap + rasm sitemap, robots.txt (hamma narsa ochiq) | ✓ | `prune-sitemap.mjs`, `sitemap-images.mjs` |
| Search Console, Bing, GA4, GTM ulangan | ✓ | admin → «Analitika va SEO kodlari» (docs/22) |
| Kalit so'z auditi: A-so'rov < 70 bo'lsa build yiqiladi | ✓ | `scripts/keyword-audit.mjs` |
| Tarjima sifat gate'i (nomlar, takror, buzilgan belgi) | ✓ | `scripts/audit-translations.mjs` |

**Bu PR'da qo'shildi:**

1. **zh va tr ham kalit so'z auditiga kirdi.** Avval faqat ru/en/uz tekshirilardi; endi bosh sahifa,
   kalendar, maydon, ijara, ishtirokchilar, stend bron qilish va 5 ta ko'rgazma sahifasi xitoy va turk
   tilida ham o'lchanadi (`global` bloki, `scripts/keyword-map.mjs`).
2. **Ko'rgazma sahifalari sarlavhalariga mamlakat qo'shildi** (zh/tr). Xitoylik va turkiyalik xaridor
   avval mamlakat bo'yicha qidiradi: «乌兹别克斯坦食品展», «Özbekistan gıda fuarı». Avval title'larda
   faqat «撒马尔罕 / Semerkant» bor edi. Masalan: `FOODERA EXPO 2026：乌兹别克斯坦食品饮料展（撒马尔罕）`,
   `BUILD PRO EXPO 2026 — Özbekistan inşaat ve yapı fuarı, Semerkant`.
3. **10 ta yangi maqola** — 5 tilda (jami 50 sahifa), har biri bitta axborot so'roviga (§3).
4. Ikki g'alati mashina tarjimasi tuzatildi (`/tr/articles/` va `/zh/venue/halls/` description).
5. Post sanasi («Insight · 12 October 2026») va kutubxona hisoblagichi («18 articles · 114 min»)
   endi qoida bilan tarjima qilinadi. Avval har yangi post uchun katalogga qo'lda yozuv kerak edi;
   Telegram'dan kelgan yangi maqola zh/tr build'ini yiqitishi mumkin edi.

**Sayt ichida qilib bo'lmaydigan ishlar (off-page) — hozir eng katta richag shular:** §5.

## 2. Kalit so'z klasterlari — 5 til

> ⚠️ **Hajmlar o'lchanmagan.** Bizda Wordstat / Keyword Planner / Baidu Index'ga kirish yo'q,
> shuning uchun bu ro'yxat — soha mantig'i va raqobatchi sahifalari asosida ekspert bahosi.
> Search Console'da 4–6 hafta ma'lumot yig'ilgach haqiqiy so'rovlar bilan solishtiring (§6).

Prioritet: **A** — pul so'rovi (bron, ijara), **B** — ko'rgazma/kategoriya, **C** — axborot (maqola).

### 2.1. Markaz va kalendar (A/B)

| Niyat | ru | en | uz | zh | tr | Sahifa |
|---|---|---|---|---|---|---|
| Markaz | выставочный центр Самарканд | exhibition centre Samarkand | Samarqand ko‘rgazma markazi | 撒马尔罕会展中心 | Semerkant fuar merkezi | `/` |
| Mamlakat bo'yicha | выставки Узбекистан 2026 | trade shows Uzbekistan 2026 | ko‘rgazmalar O‘zbekiston | 乌兹别克斯坦展会 2026 | Özbekistan fuarları 2026 | `/`, `/events/` |
| Kalendar | выставки в Самарканде 2026 | exhibitions in Samarkand 2026 | Samarqand ko‘rgazmalari | 撒马尔罕展会日历 | Semerkant fuar takvimi | `/events/` |
| Mintaqa | выставки Центральной Азии | Central Asia trade shows | Markaziy Osiyo ko‘rgazmalari | 中亚展会 | Orta Asya fuarları | `/events/` (+ backlink) |
| Ijara | аренда выставочного зала Самарканд | exhibition hall rental Samarkand | ko‘rgazma zali ijarasi | 撒马尔罕展厅租赁 | Semerkant fuar salonu kiralama | `/organizers/` |
| Konferensiya | конференц-зал Самарканд | conference venue Samarkand | Samarqand konferens-zal | 撒马尔罕会议场地 | Semerkant konferans salonu | `/venue/` |
| Ishtirok | участие в выставке Узбекистан | exhibit in Uzbekistan | ko‘rgazmada ishtirok etish | 乌兹别克斯坦参展 | Özbekistan'da fuara katılım | `/exhibitors/` |

### 2.2. Ko'rgazmalar (A)

| Ko'rgazma | ru | en | uz | zh | tr |
|---|---|---|---|---|---|
| FOODERA | выставка продуктов питания Узбекистан | food exhibition Uzbekistan | oziq-ovqat ko‘rgazmasi | 乌兹别克斯坦食品展 | Özbekistan gıda fuarı |
| BUILD PRO | строительная выставка Узбекистан | construction expo Uzbekistan | qurilish ko‘rgazmasi | 乌兹别克斯坦建材展 | Özbekistan inşaat fuarı |
| AGROPRO | сельскохозяйственная выставка Узбекистан | agriculture exhibition Uzbekistan | qishloq xo‘jaligi ko‘rgazmasi | 乌兹别克斯坦农业展 | Özbekistan tarım fuarı |
| WORLD EDU | выставка образования за рубежом | education fair Uzbekistan / study abroad fair | ta’lim ko‘rgazmasi / chet elda o‘qish | 乌兹别克斯坦留学展 | Özbekistan eğitim fuarı |
| ECOM & RETAIL | выставка e-commerce Узбекистан | e-commerce expo Uzbekistan | elektron tijorat ko‘rgazmasi | 乌兹别克斯坦电商展 | Özbekistan e-ticaret fuarı |
| PROMOTORS | автошоу Самарканд, дрифт | car show Samarkand | Samarqand avtoshou | 撒马尔罕车展 | Semerkant otomobil şovu |

### 2.3. Axborot so'rovlari → yangi maqolalar (C)

Bu so'rovlar «tepadagi» auditoriyani olib keladi: eksportchi, xorijiy ishtirokchi, ota-ona,
tashkilotchi. Maqola oxirida tegishli ko'rgazma yoki bron sahifasiga havola bor, ya'ni axborot
trafigi pul sahifalariga o'tadi.

| Maqola (slug) | en | ru | uz | zh | tr | Ko'rgazma |
|---|---|---|---|---|---|---|
| `uzbekistan-market-entry-trade-shows` | Uzbekistan market entry | выход на рынок Узбекистана | O‘zbekiston bozoriga kirish | 进入乌兹别克斯坦市场 | Özbekistan pazarına giriş | barchasi |
| `exhibiting-in-uzbekistan-foreign-company` | exhibiting in Uzbekistan | участие в выставке в Узбекистане | O‘zbekistonda ko‘rgazmada ishtirok | 在乌兹别克斯坦参展 | Özbekistan'da fuara katılım | barchasi |
| `food-export-to-uzbekistan-halal-labelling` | food export to Uzbekistan, halal | экспорт продуктов в Узбекистан, халяль | O‘zbekistonga oziq-ovqat eksporti | 向乌兹别克斯坦出口食品 | Özbekistan'a gıda ihracatı | FOODERA |
| `selling-on-uzbekistan-marketplaces` | selling on marketplaces in Uzbekistan, Uzum Market | продажи на маркетплейсах Узбекистана | O‘zbekiston marketpleyslarida sotish | 在乌兹别克斯坦电商平台销售 | Özbekistan pazaryerlerinde satış | ECOM & RETAIL |
| `agriculture-in-uzbekistan-greenhouses-irrigation` | agriculture in Uzbekistan, drip irrigation | сельское хозяйство Узбекистана, капельное орошение | O‘zbekiston qishloq xo‘jaligi | 乌兹别克斯坦农业 | Özbekistan tarımı | AGROPRO |
| `construction-market-uzbekistan-building-materials` | construction market in Uzbekistan | строительный рынок Узбекистана | O‘zbekiston qurilish bozori | 乌兹别克斯坦建筑市场 | Özbekistan inşaat pazarı | BUILD PRO |
| `study-abroad-from-uzbekistan-guide` | study abroad from Uzbekistan | обучение за рубежом из Узбекистана | chet elda o‘qish | 乌兹别克斯坦出国留学 | Özbekistan'dan yurt dışında eğitim | WORLD EDU |
| `car-show-samarkand-promotors-guide` | car show in Samarkand | автошоу в Самарканде | Samarqandda avtoshou | 撒马尔罕车展 | Semerkant otomobil şovu | PROMOTORS |
| `business-trip-to-samarkand-guide` | business trip to Samarkand | командировка в Самарканд | Samarqandga xizmat safari | 撒马尔罕商务出行 | Semerkant iş seyahati | barchasi |
| `how-to-organize-an-exhibition-in-uzbekistan` | organize an exhibition in Uzbekistan | организовать выставку в Узбекистане | O‘zbekistonda ko‘rgazma tashkil qilish | 在乌兹别克斯坦举办展览 | Özbekistan'da fuar düzenlemek | ijara |

## 3. Yangi maqolalar: qanday yozilgan

- **Manba tillari ru + en** (`src/content/articles/{ru,en}/<slug>.md`). uz/zh/tr — EN sahifadan
  kataloglar orqali (`src/i18n/catalogs/{zh,tr,uz}.json`). Maqola matnining har bir paragrafi
  qo'lda tarjima qilingan (kontekst bilan, mashina tarjimasi emas).
- Har birida 900–1 200 so'z, 5–7 ta `##` bo'lim (sahifada mundarija chiqadi) va oxirida FAQ.
  Asosiy so'rov title'ning boshida, h1'da, description'da va birinchi 100 so'zda bor.
- **Matn ichida bold/havola yo'q.** Tarjima HTML matn tuguni bo'yicha olinadi; gap ichidagi
  `**bold**` yoki havola gapni bo'laklarga ajratadi va tarjimani buzadi. Havolalar faqat oxirgi qatorda.
- **To'qima raqam yo'q.** Bozor hajmi, foiz, boj, qonun raqami yozilmagan. Tartib-qoidalar umumiy
  aytilgan va «amaldagi qoidani tegishli idora / bojxona brokeri / elchixonada tekshiring» deyilgan.
  SOF EXPO haqidagi faktlar faqat repodan olingan (`src/data/events.ts`, `src/data/pages/*`).
- **Rasmlar — saytdagi haqiqiy fotolar** (generatsiya qilinmagan): b2b-meeting, hall-main-aisle,
  food-tasting, event-ecom, agropro-irrigation-stand, buildpro-stand-interior,
  worldedu-university-stand, promotors-drift-aerial, samarkand-registan-flag, conference-stage.
  Haqiqiy foto ishonchliroq va AVIF/WebP ladder'i allaqachon bor.
- Ko'rgazmaga oid maqolalarda `event:` bor. Hozir (Vercel, `alias` rejim) hammasi `sof-expo.com`
  da; subdomenlar ulanganda o'sha ko'rgazma hostiga o'tadi (`docs/05`).

**Tekshirishni so'raymiz (mijoz tomonidan):** grant nomlari (Chevening, DAAD, Türkiye Bursları,
Stipendium Hungaricum, CSC, GKS, Erasmus Mundus, El-yurt umidi) va oziq-ovqat maqolasidagi
«ayrim tovar guruhlari majburiy raqamli markirovkaga tushadi» degan umumiy gap. Ular repodan emas,
umumiy bilimdan olingan.

## 4. Yangi maqola qo'shish tartibi

1. `src/content/articles/en/<slug>.md` va `ru/<slug>.md` (frontmatter: title ≤ 65, description
   140–160, `category`, `tags`, `hero: /images/<photo>.jpg`, kerak bo'lsa `event:`).
2. `I18N_EXTRACT=1 npx astro build && npm run i18n:missing` — zh/tr/uz uchun yetishmayotgan qatorlarni
   kataloglarga qo'shing (zh/tr build qattiq: tarjima yo'q bo'lsa build yiqiladi; uz bo'lmasa
   sahifa noindex bo'ladi).
3. `scripts/keyword-map.mjs` → `insights` blokiga bitta qator.
4. `npm run check`.

## 5. Global TOP uchun keyingi qadamlar (sayt tashqarisida)

Ustuvorlik bo'yicha:

1. **Google Business Profile + Yandex Maps + 2GIS** — «выставочный центр Самарканд»,
   «exhibition centre Samarkand» bo'yicha xarita blokida chiqish. Nom, toifa «Exhibition centre»,
   manzil, telefon, 20+ foto, sharhlar. Bu bitta ish eng ko'p lokal trafik beradi.
2. **Backlink'lar (havola beruvchi saytlar):**
   - O'zbekiston: hamkor OTMlar (WORLD EDU), Sotuvchilar assotsiatsiyasi (ECOM), viloyat hokimligi,
     Savdo-sanoat palatasi, ticketon.uz, uzdaily, kun.uz / gazeta.uz press-relizlari.
   - Xalqaro: fuar kataloglari (10times, eventseye, AUMA, expodatabase, TOBB/İKMİB fuar takvimi
     Turkiya uchun), Xitoy uchun 中国国际贸易促进委员会 (CCPIT) va 环球展览网 kabi kataloglar.
   - Har bir ko'rgazma ishtirokchisidan «we exhibit at …» havolasi (ishtirokchi kabinetida banner).
3. **Search Console'da sitemap** (`https://sof-expo.com/sitemap-index.xml`) — yuborilgan; yangi
   maqolalar uchun «URL Inspection → Request indexing» ni 10 ta maqolaning **en** sahifasi uchun
   qiling, qolgan tillar hreflang orqali topiladi.
4. **Baidu** (Xitoy) — ziyuan.baidu.com, xitoy telefon raqami kerak. Hozircha zh sahifalar Google
   va Bing orqali indekslanadi.
5. **Yandex Webmaster** — xizmat tiklangach, admin panelga kod qo'yiladi (docs/22).
6. **Muntazamlik:** oyiga 2–4 ta maqola. Har ko'rgazmadan keyin «natijalar» posti (raqamlar bilan),
   ko'rgazmadan 6–8 hafta oldin «qanday tayyorlanish» posti. Telegram kanalidagi postlar avtomatik
   blogga tushadi (`docs/telegram-blog-sync.md`).

## 6. O'lchash (4–6 hafta keyin)

- Search Console → Performance → Pages: `/articles/` sahifalari bo'yicha impressions/kliklar,
  Queries: haqiqiy so'rovlar. §2 jadvalidagi so'rovlar bilan solishtiring va `keyword-map.mjs`
  dagi prioritetlarni yangilang.
- GA4: maqoladan ko'rgazma / `request-stand` sahifasiga o'tish (`form_submit` key event).
- Ko'rinmagan til yoki so'rov bo'lsa — title va h1 o'sha so'rovga moslab qayta yoziladi.
