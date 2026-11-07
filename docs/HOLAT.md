# Holat (har ishdan keyin yangilanadi)

Bu fayl — yangi chat/sessiya uchun **joriy holat**: "hozir nima qilindi, nima qolgan,
qaysi branch'da ishlanmoqda". CLAUDE.md konventsiyalarni biladi, bu fayl holatni biladi.
Yangi sessiya boshida shuni o'qing, eski chat tarixini qayta o'qishga harakat qilmang.

**Qoida**: katta ish (PR, muhim o'zgarish, bloklangan narsa) tugagach — shu faylni
qisqa yangilang (3–10 qator yetarli — bu uzun hisobot emas).

## Branch

`main` — oxirgi birlashtirilgan holat `022c877`da. Joriy branch'da tugallanmagan
ish bo'lsa shu yerga yozing.

## Joriy / bloklangan

_(hali to'ldirilmagan — keyingi katta ishdan keyin bu bo'limni yangilang)_

## Limitni tejash

- Og'ir subagent/workflow kerak bo'lmasa chaqirmang, javoblar qisqa bo'lsin.
- "Cloud memory" vositalari (claude-mem va shunga o'xshash) bu muhitda ishlamaydi —
  har yangi chat = yangi vaqtinchalik konteyner, faqat git'ga commit qilingan narsa
  saqlanadi. Shu HOLAT.md — aynan shu uchun.
