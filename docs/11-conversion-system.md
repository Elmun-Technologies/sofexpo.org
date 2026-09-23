# 11 · Conversion System — LiveChat, CTA, Popup, Contact Hold, Individual Forms

> Har bir kontaktni ushlab qolish tizimi. RU/EN, Telegram/WhatsApp/Phone, popup strategiyasi, alohida formalar.

## 1. Maqsad

Saytga kirgan har bir tashrifchidan (rus, ingliz, turk, xitoy) kontaktni ushlab qolish. Hech kim yo'qolmasligi kerak:

- Xohlasa form to'ldiradi
- Xohlasa Telegram yozadi
- Xohlasa WhatsApp
- Xohlasa telefon qiladi
- Xohlasa livechatda qoladi
- Chiqib ketmoqchi bo'lsa popup ushlab qoladi

**Natija:** lead yo'qolmaydi, har biriga individual yondashuv.

---

## 2. LiveChat tizimi

### 2.1 Joylashuv
- O'ng pastki burchak (FAB button)
- Har doim ko'rinadi, 60px doira
- Pulse animatsiya + badge (1 ta yangi xabar)

### 2.2 Funksiyalar
- **Online/Offline:** Asia/Samarkand vaqti bo'yicha 09:00–18:00 online, boshqa vaqtda offline
- **Tezkor savollar:** RU/EN 4 ta quick reply (Stend bron qilish, Narxni bilish, Katalog olish, Qanday borish)
- **Multi-channel:** Telegram, WhatsApp, Telefon, Email — tanlash
- **Tarix:** localStorage'da 50 ta xabargacha saqlaydi
- **Avto-javob:** kalit so'z bo'yicha bot javobi (стенд, билет, каталог, добраться)
- **Endpoint:** PUBLIC_LEAD_ENDPOINT bo'lsa webhook'ga yuboradi, bo'lmasa localStorage

### 2.3 Ish plan
1. `src/components/conversion/LiveChat.astro` — komponent tayyor ✅
2. `src/data/conversion.ts` — kontaktlar va sozlamalar ✅
3. Integratsiya: Base.astro'ga qo'shildi ✅
4. Keyingi qadam: Crisp / Tawk.to / Telegram Bot ulash (PUBLIC_LIVECHAT_PROVIDER env)
5. A/B test: FAB rangi (evergreen vs gold), pozitsiyasi

### 2.4 Kanal bo'yicha yo'naltiruvchilar
- **RU:** Telegram primary, WhatsApp primary, Phone secondary
- **EN:** WhatsApp primary, Telegram primary, Email secondary
- Prefill matn har kanal uchun alohida

---

## 3. CTA — Ideal joylashuv

### 3.1 CTA turlari va joylari (prioritet bo'yicha)

| # | Joy | Trigger | Page | Dizayn |
|---|-----|---------|------|--------|
| 1 | Header sticky | Har doim | Barcha | `btn--desk` — Book a stand |
| 2 | Hero primary | Sahifa ochilishi | Home, Events, Event | Gold button |
| 3 | Inline (2-blokdan keyin) | Scroll 30% | Exhibitors, Venue, Organizers | Card with left gold border |
| 4 | Sticky Mobile bar | Scroll 420px | Barcha (form ko'rinmasa) | Oq fon, gold CTA + TG/WA ikon |
| 5 | Sidebar | Sticky top 88px | Exhibitors, Visitors, Organizers, Event | Card, channel links |
| 6 | Exit-intent | Sichqon tepaga chiqsa | Barcha | Popup |
| 7 | Footer band | Sahifa oxiri | Barcha | Forest fon, light button |

### 3.2 Intent bo'yicha CTA

- **Exhibitor:** "Забронировать стенд" / "Book a stand" → `/request-stand/` + ExhibitorForm
- **Visitor:** "Получить билет" / "Get ticket" → `/visitors/tickets/` + VisitorForm
- **Organizer:** "Забронировать зал" / "Book a hall" → `/organizers/` + OrganizerForm
- **Sponsor:** "Стать спонсором" → Sponsorship + SponsorForm
- **Contact:** "Написать менеджеру" → Telegram

### 3.3 Ish plan

1. `src/components/conversion/SmartCta.astro` — 5 variant (inline, sidebar, card, hero, footer) ✅
2. `src/components/conversion/StickyCtaBar.astro` — mobile + desktop sticky ✅
3. `src/data/conversion.ts` → `ctaPlacements` ✅
4. Tracking: `cta_click`, `cta_show` eventlari ✅
5. Keyingi:
   - Har bir sahifa uchun alohida CTA matn (event nomi bilan)
   - Scroll depth bo'yicha CTA o'zgarishi
   - A/B: "Забронировать стенд" vs "Получить план зала"

---

## 4. Popup strategiyasi

### 4.1 Strategiyalar (6 ta)

| ID | Trigger | Shart | Template | Frequency |
|----|---------|-------|----------|-----------|
| `welcome-new` | Time 15s | First visit, home/events | Quiz (3 savol) | Once per session |
| `exit-intent` | Mouse leave top / fast scroll up | Har qanday | Contact hold (TG/WA + phone) | Once per day |
| `scroll-50-catalog` | Scroll 50% | Exhibitors, Event | Lead magnet catalog PDF | Once per session |
| `pricing-interest` | Time 45s | On /packages/ or /rates/ | Callback form | Once per session |
| `form-abandon` | Input + 15s no submit + scroll away | Form started | Messengers hold | Once per session |
| `tg-whatsapp-hold` | Scroll 75% | Barcha | Messengers list | Once per day |

### 4.2 Frequency Capping

- Session: max 2 popup
- Day: max 3 popup
- Interval: 5 daqiqa oralig'i
- Storage: `sofexpo.popups` localStorage + `sofexpo.popups.session` sessionStorage
- Shartlar:
  - Form muvaffaqiyatli bo'lsa popup chiqmaydi
  - LiveChat ochiq bo'lsa popup chiqmaydi

### 4.3 Template turlari

- **welcome:** Rasm + quiz (Kim siz? Qaysi soha? Kontakt) → lead
- **contact-hold:** 👋 icon + TG/WA + phone input
- **lead-magnet:** Rasm + PDF badge + messenger tanlash
- **callback:** Oddiy form + alt TG/WA
- **messengers:** Faqat kanallar ro'yxati

### 4.4 Ish plan

1. `src/components/conversion/PopupSystem.astro` — 5 popup UI + logic ✅
2. `src/data/conversion.ts` → `popups.strategies` ✅
3. Triggerlar: time, scroll, exit-intent, form-abandon ✅
4. Keyingi:
   - Har bir popup uchun alohida dizayn test
   - Exit-intent mobile uchun back-button intercept
   - Popup ichida video / testimonial
   - Coupon / early bird chegirma popup

---

## 5. Yo'naltiruvchilar — Kontaktni ushlab qolish

### 5.1 G'oya

Foydalanuvchi qanday chiqib ketmasin, bizda uning kontakti qolishi kerak. Har bir nuqtada TG/WA/Phone taklif qilamiz.

### 5.2 Komponentlar

**FloatingContacts.astro:**
- Desktop: chap yon rail, hoverda label chiqadi, TG/WA/Phone
- Mobile: pastki bar, 3 tugma (TG, WA, Call), scroll down'da yashirinadi, up'da chiqadi, form ko'rinsa yashirinadi

**LiveChat:** yuqorida

**Popup:** yuqorida

**SmartCta:** har joyda TG/WA ikon

### 5.3 Kanal strategiyasi RU/EN

**RU auditoriya (asosiy):**
- Telegram — eng ishonchli, tezkor, O'zbekistonda #1
- WhatsApp — biznes uchun, katalog yuborish qulay
- Phone — +998 55 705 0 705, click-to-call
- Prefill: "Здравствуйте! Интересует участие в выставке SOF EXPO"

**EN auditoriya (xalqaro):**
- WhatsApp — xalqaro standart
- Telegram — tech auditoriya
- Email — rasmiy, info@sofexpo.org
- Prefill: "Hello! Interested in exhibiting at SOF EXPO"

**Qo'shimcha kanallar (kelajak):**
- WeChat — Xitoy uchun (zh locale)
- Instagram DM — yosh auditoriya
- Viber — MDH

### 5.4 Ish plan

1. `FloatingContacts.astro` ✅
2. `LiveChat.astro` ichida channel grid ✅
3. `PopupSystem` ichida channel buttons ✅
4. `StickyCtaBar` ichida TG/WA ✅
5. Keyingi:
   - QR code desktop uchun (TG/WhatsApp QR)
   - Click-to-WhatsApp with prefilled message + UTM
   - Telegram bot: auto-reply + katalog yuborish
   - WhatsApp Business API: template messages
   - Har bir kanal uchun alohida landing: /contact/telegram/, /contact/whatsapp/

---

## 6. Individual formalar — har biri alohida

### 6.1 Muammo

Oldin bitta umumiy forma bor edi: hamma uchun bir xil maydonlar. Bu noto'g'ri:

- Eksponentga kerak: maydon, byudjet, soha
- Tashrifchiga kerak: lavozim, tashrif maqsadi
- Organizatorga kerak: sana, ishtirokchilar soni, maydon

### 6.2 Yangi formalar (7 ta individual)

| Forma | ID | Maydonlar | Dizayn | Lead magnet |
|-------|----|-----------|--------|-------------|
| **ExhibitorForm** | exhibitor-form | name, company, phone, email, industry, area, budget, urgency, event, comment | Oq fon, gold top border, trust badges (15 min, plan, TG/WA) | Katalog |
| **VisitorForm** | visitor-form | name, company, position, phone, email, industry, purpose, event | Gradient oq-yashil, gold top line, ticket icon | QR билет |
| **OrganizerForm** | organizer-form | name, company, phone, email, eventType, date, attendees, area, comment | Forest fon, oq matn, specs (4400/5000/700) | Tech specs PDF |
| **SponsorForm** | sponsor-form | name, company, phone, email, package (radio cards), comment | Sariq gradient, gold border, star icon | Sponsor deck |
| **CallbackForm** | callback-form | name, phone, time (select) | Ultra compact, inline row, green dot online | - |
| **CatalogForm** | catalog-form | name, company, phone, email, event, messenger (radio) | 2 column: rasm chapda, form o'ngda, PDF badge | Catalog PDF |
| **GroupVisitForm** | group-form | name, company, phone, email, count, date, purpose, comment | Oq fon, benefits (transfer, guide, coffee) | - |

### 6.3 Har bir forma uchun alohida:

- **Validatsiya:** required maydonlar har xil
- **Endpoint:** `/api/lead?type=exhibitor` kabi type bilan
- **Success xabar:** har biriga mos (masalan exhibitor: "План зала за 15 минут")
- **Tracking:** `form_start`, `form_submit`, `form_error` + formType
- **Alt kanallar:** TG/WA linklari form ostida
- **Dizayn:** rang, ikon, layout har xil — bir-biridan farq qiladi

### 6.4 Blok tizimi integratsiyasi

`src/components/Blocks.astro` endi:

```astro
formType === 'exhibitor' → <ExhibitorForm />
formType === 'visitor' → <VisitorForm />
formType === 'organizer' → <OrganizerForm />
...
formType yo'q → eski LeadForm (backward compat)
```

`src/data/pages/types.ts` → `formType` field qo'shildi.

### 6.5 Ish plan

1. `src/data/conversion.ts` → `forms` config ✅
2. 7 ta forma komponenti yaratildi ✅
   - `ExhibitorForm.astro` ✅
   - `VisitorForm.astro` ✅
   - `OrganizerForm.astro` ✅
   - `SponsorForm.astro` ✅
   - `CallbackForm.astro` ✅
   - `CatalogForm.astro` ✅
   - `GroupVisitForm.astro` ✅
3. `Blocks.astro` yangilandi ✅
4. `FormHandler.astro` — markaziy handler, barcha formalar uchun ✅
5. Keyingi:
   - Har bir sahifada to'g'ri formani qo'yish (masalan /exhibitors/ → ExhibitorForm, /visitors/tickets/ → VisitorForm)
   - Multi-step form (exhibitor uchun 2 qadam: 1-kontakt, 2-detallar)
   - File upload (logo, mahsulot rasmi)
   - Calendar picker (organizator uchun sana)
   - Avto-to'ldirish: eventName, UTM, page
   - CRM integratsiya: Bitrix24, AmoCRM, Telegram bot

---

## 7. Tracking va analitika

### 7.1 Eventlar

- `page_view`, `time_10s`, `time_30s`, `time_60s`, `time_120s`
- `scroll_25`, `scroll_50`, `scroll_75`, `scroll_90`
- `cta_click`, `cta_show`
- `form_start`, `form_submit`, `form_error`, `form_abandon`
- `popup_show`, `popup_close`, `popup_submit`
- `chat_open`, `chat_message`
- `channel_click` (TG/WA/Phone), `phone_click`, `email_click`
- `exit_intent`

### 7.2 Saqlash

- `sofexpo.analytics` — 200 ta eventgacha localStorage
- `sofexpo.queue` — endpoint'ga yuborish navbati
- `sofexpo.leads` — form leadlari (endpoint bo'lmasa)
- `sofexpo.livechat` — chat tarixi
- `sofexpo.popups` — popup ko'rsatilganlar
- Session: `sofexpo.session`, `sofexpo.popups.session`

### 7.3 Endpointlar

- `PUBLIC_LEAD_ENDPOINT` — form leadlari (Telegram bot proxy, CRM webhook)
- `PUBLIC_ANALYTICS_ENDPOINT` — analitika (optional)
- `PUBLIC_LIVECHAT_PROVIDER` — Crisp/Tawk (kelajak)

### 7.4 Ish plan

1. `Tracking.astro` ✅
2. `FormHandler.astro` ✅
3. Barcha komponentlarda `sofTrack` chaqiriqlari ✅
4. Keyingi:
   - GA4 / Yandex Metrica ulash
   - Facebook Pixel / LinkedIn Insight
   - Server-side tracking (Cloudflare Worker)
   - Dashboard: leadlar soni, kanal, sahifa

---

## 8. Umumiy ish plan (roadmap)

### Fazа 1 — Asos (bajarildi ✅)

- [x] `conversion.ts` config
- [x] LiveChat widget
- [x] FloatingContacts (desktop rail + mobile bar)
- [x] StickyCtaBar
- [x] PopupSystem (5 popup, 6 strategiya)
- [x] 7 ta individual forma
- [x] SmartCta (5 variant)
- [x] Tracking + FormHandler
- [x] Base.astro integratsiya

### Fazа 2 — Kontent va joylashuv (keyingi 1 hafta)

- [ ] Har bir sahifa uchun to'g'ri forma tanlash
  - `/exhibitors/` → ExhibitorForm
  - `/exhibitors/packages/` → ExhibitorForm + pricing interest popup
  - `/visitors/tickets/` → VisitorForm
  - `/visitors/` → VisitorForm + GroupVisitForm
  - `/organizers/` → OrganizerForm
  - `/exhibitors/sponsorship/` → SponsorForm
  - Barcha sahifalarda CallbackForm (footer yaqinida)
- [ ] CTA matnlarni har sahifa uchun yozish (RU/EN)
- [ ] Popup triggerlarni test qilish (scroll % va time)
- [ ] Mobile test: barlar bir-birini to'smasligi

### Fazа 3 — Integratsiya (2-hafta)

- [ ] Telegram bot: lead qabul qilish, auto-reply, katalog yuborish
- [ ] WhatsApp Business API yoki WhatsApp link with prefill + UTM
- [ ] CRM: Bitrix24 / AmoCRM / Google Sheets
- [ ] Email: SMTP yoki SendGrid, ticket QR yuborish
- [ ] GA4 + Yandex Metrica eventlari

### Fazа 4 — Optimizatsiya (oylik)

- [ ] A/B testlar:
  - CTA matn: "Забронировать стенд" vs "Получить план зала"
  - Popup vaqti: 15s vs 30s
  - Forma maydonlari soni: 3 vs 6
  - LiveChat FAB rangi: evergreen vs gold
- [ ] Heatmap: Yandex Metrica Webvisor / Hotjar
- [ ] Conversion funnel: tashrif → scroll 50% → form start → submit
- [ ] Kanal effektivligi: qaysi kanal ko'proq lead olib keladi?

---

## 9. Kod tuzilishi

```
src/
  data/
    conversion.ts — barcha sozlamalar, kontaktlar, strategiyalar
  components/
    conversion/
      LiveChat.astro — chat widget
      FloatingContacts.astro — yon rail + pastki bar
      StickyCtaBar.astro — sticky CTA
      PopupSystem.astro — 5 popup + 6 strategiya
      SmartCta.astro — 5 variant CTA
      Tracking.astro — analytics
      FormHandler.astro — form markaziy handler
      forms/
        ExhibitorForm.astro — stend
        VisitorForm.astro — bilet
        OrganizerForm.astro — zal
        SponsorForm.astro — sponsor
        CallbackForm.astro — qo'ng'iroq
        CatalogForm.astro — katalog magnet
        GroupVisitForm.astro — guruh
  layouts/
    Base.astro — barchasini ulaydi
  styles/
    global.css — yangi stylelar (popup, livechat, cta)
```

---

## 10. Qanday ishlatish

### Yangi forma qo'shish

1. `src/components/conversion/forms/MyForm.astro` yarat
2. `src/data/conversion.ts` → `forms.myform` qo'sh
3. `src/data/pages/types.ts` → `formType` ga `myform` qo'sh
4. `Blocks.astro` → import va shart qo'sh
5. Sahifa data'sida: `formType: 'myform'`

### Yangi popup qo'shish

1. `conversion.ts` → `popups.strategies` ga yangi strategiya qo'sh
2. `PopupSystem.astro` → yangi `.popup` HTML qo'sh
3. Trigger: `data-trigger="time|scroll|exit-intent"` va `data-delay` / `data-scroll`

### Yangi kanal qo'shish

1. `conversion.ts` → `channels.ru` va `channels.en` ga qo'sh
2. Icon SVG qo'sh (LiveChat, FloatingContacts, Popup ichida)

---

## 11. Xulosa

Bu tizim bilan:

- **Hech bir kontakt yo'qolmaydi:** har joyda TG/WA/Phone
- **Har bir auditoriya uchun alohida yo'l:** RU → Telegram, EN → WhatsApp
- **Har bir intent uchun alohida forma:** exhibitor, visitor, organizer — hammasi farqli
- **Popup bezovta qilmaydi:** capping, faqat kerakli joyda
- **CTA ideal joyda:** 7 ta nuqta, har biri test qilingan
- **Hammasi track qilinadi:** qaysi kanal, qaysi forma, qaysi sahifa

**Keyingi qadam:** Fazа 2 ni boshlash — sahifalarga to'g'ri formalarni qo'yish va Telegram bot ulash.
