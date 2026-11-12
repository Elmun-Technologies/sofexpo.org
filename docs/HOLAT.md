# Holat (har ishdan keyin yangilanadi)

Bu fayl — yangi chat/sessiya uchun **joriy holat**: "hozir nima qilindi, nima qolgan,
qaysi branch'da ishlanmoqda". CLAUDE.md konventsiyalarni biladi, bu fayl holatni biladi.
Yangi sessiya boshida shuni o'qing, eski chat tarixini qayta o'qishga harakat qilmang.

**Qoida**: katta ish (PR, muhim o'zgarish, bloklangan narsa) tugagach — shu faylni
qisqa yangilang (3–10 qator yetarli — bu uzun hisobot emas).

## Branch

`main` — oxirgi birlashtirilgan holat `f4d661e`da (PR #50 timeline + PR #51 Hetzner/Coolify).
PR #52 ochiq (`claude/awesome-meitner-wux8pn`): db.mjs clock fix + AGROPRO'ni bosh sahifaga
chiqarish uchun yangi commit; shu PR'da Fly.io ham repodan butunlay olib tashlandi (quyida).

## Joriy / bloklangan

- ✅ **Fly.io → Xezner/Coolify migratsiyasi yakunlangan** (operator tasdiqladi, 2026-11-12).
  `backend-uptime` 10-noyabrdan beri yashil. `fly.toml`, `deploy-backend.yml` o'chirildi;
  `docs/20` tarixiy belgilandi, `docs/25` "bajarilgan" holatga yangilandi, CLAUDE.md/docs/17
  Hetzner/Coolify'ga moslandi.
- 🟡 **`VERCEL_DEPLOY_HOOK_URL` hali sozlanmagan** — `daily-rebuild.yml` har kecha hech narsa
  qilmay o'tib ketyapti (faqat notice). Vercel faqat `main`ga yangi commit kelganda o'zi
  qayta quradi (git integratsiya), shuning uchun ko'rgazmalar orasida uzoq tanaffus bo'lsa
  (kod o'zgarmasa) sayt eski holatda qotib qoladi. Bir martalik tuzatish: Vercel → Deploy
  Hooks → secret qo'shish (docs/24 §3).
- 🟡 **Coolify'dagi `BLOG_SYNC_GIT_PUSH`ni tekshiring** — `docker-compose.coolify.yml` shablonda
  endi `"1"` (migratsiya tugagani uchun), lekin bu reponing fayli Coolify'ning haqiqiy
  environment variable'ini avtomatik o'zgartirmaydi — operator Coolify UI'da shu qiymat `1`
  ekanini tasdiqlasin (aks holda Telegram → blog sync ishlamaydi).
- ⬜ Hetzner'da muntazam SQLite backup hali sozlanmagan (docs/25 §7) — yagona ochiq band.

## Limitni tejash

- Og'ir subagent/workflow kerak bo'lmasa chaqirmang, javoblar qisqa bo'lsin.
- "Cloud memory" vositalari (claude-mem va shunga o'xshash) bu muhitda ishlamaydi —
  har yangi chat = yangi vaqtinchalik konteyner, faqat git'ga commit qilingan narsa
  saqlanadi. Shu HOLAT.md — aynan shu uchun.
