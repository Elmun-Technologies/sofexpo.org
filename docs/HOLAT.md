# Holat (har ishdan keyin yangilanadi)

Bu fayl — yangi chat/sessiya uchun **joriy holat**: "hozir nima qilindi, nima qolgan,
qaysi branch'da ishlanmoqda". CLAUDE.md konventsiyalarni biladi, bu fayl holatni biladi.
Yangi sessiya boshida shuni o'qing, eski chat tarixini qayta o'qishga harakat qilmang.

**Qoida**: katta ish (PR, muhim o'zgarish, bloklangan narsa) tugagach — shu faylni
qisqa yangilang (3–10 qator yetarli — bu uzun hisobot emas).

## Branch

`main` — oxirgi birlashtirilgan holat `f4d661e`da (PR #50 timeline + PR #51 Hetzner/Coolify
tayyorgarlik). Joriy branch'da tugallanmagan ish bo'lsa shu yerga yozing.

## Joriy / bloklangan

- 🔴 **Fly.io production (`api.sof-expo.com`) ishlamayapti** — `deploy-backend` "app not
  found", DNS resolve bo'lmayapti, 2-noyabrdan beri barcha soatlik uptime-tekshiruv
  muvaffaqiyatsiz. Operatorga aytilgan (`flyctl apps list` / dashboard'da Volumes/snapshot
  tekshirish kerak), javob kutilmoqda. Buni hal qilmasdan Xezner cutover (`docs/25`)
  boshlanmasin — Fly volume o'chgan bo'lsa ko'chiradigan ma'lumot qolmagan bo'lishi mumkin.
- 🟡 **`VERCEL_DEPLOY_HOOK_URL` sozlanmagan** — `daily-rebuild.yml` har kecha hech narsa
  qilmay o'tib ketyapti (faqat notice). Vercel faqat `main`ga yangi commit kelganda o'zi
  qayta quradi (git integratsiya, deploy hook shart emas — docs/20 §6), shuning uchun
  ko'rgazmalar orasida uzoq tanaffus bo'lsa (kod o'zgarmasa) sayt eski holatda qotib qoladi.
  Bir martalik tuzatish: Vercel → Deploy Hooks → secret qo'shish (docs/24 §3).
- `db.mjs`dagi `isUpcomingEdition()` chaqiruvi server clock'ini olmasligi tuzatildi
  (production'da farq qilmagan, lekin test'larni qotirishga to'sqinlik qilgan edi) — yangi
  PR'da, bosh sahifada AGROPRO'ni chiqarish uchun shu bilan birga `main`ga push qilinadi.

## Limitni tejash

- Og'ir subagent/workflow kerak bo'lmasa chaqirmang, javoblar qisqa bo'lsin.
- "Cloud memory" vositalari (claude-mem va shunga o'xshash) bu muhitda ishlamaydi —
  har yangi chat = yangi vaqtinchalik konteyner, faqat git'ga commit qilingan narsa
  saqlanadi. Shu HOLAT.md — aynan shu uchun.
