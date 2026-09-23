/**
 * The SOF EXPO team — the people who answer the phone when an exhibitor calls.
 *
 * The client delivered 17 finished 1:1 artboards (one per team member) with the brand
 * frame already laid down: name, role, the SOF EXPO identity and the lower-right contact
 * line where applicable. The cards are never cropped — the type on the artboard is part
 * of the message — so each rendered tile is the full artboard at 1:1, sized only by the
 * CSS grid. This file is the one place a team member is described; the page reads it and
 * when somebody joins or leaves the array is edited without touching any layout.
 *
 * `kind` sorts the wall in the order a visitor actually wants to read it: leadership
 * first, then the media and marketing voice of the venue, then sales and the
 * customer-facing managers a buyer will get routed to, then the technical, operations
 * and support people who keep the centre running. The array itself is laid out in that
 * same order — the ItemList markup mirrors it, so the wall and the structured data
 * always tell the same story.
 */
export type TeamKind =
  | "leadership"
  | "media"
  | "sales"
  | "client"
  | "technical"
  | "operations"
  | "support";

export interface TeamMember {
  /** matches `public/images/team/<card>-{400,800,1200}.webp + .jpg` */
  card: string;
  name: { ru: string; en: string };
  role: { ru: string; en: string };
  /** a one-line, third-person description for the alt text and the Person schema */
  blurb?: { ru: string; en: string };
  /** direct line for the staff who own their own phone (so the contact link can be tel:) */
  phone?: string;
  /** show this card on top of the wall (leadership) or below (everything else) */
  kind: TeamKind;
}

export const team: TeamMember[] = [
  /* ── leadership ─────────────────────────────────────────────────── */
  {
    card: `team-ahmadkhon-tadzhibaev`,
    name: { ru: "Ахмаджон Таджибаев", en: "Ahmadkhon Tadzhibaev" },
    role: { ru: "Руководитель SOF EXPO", en: "Head of SOF EXPO" },
    blurb: {
      ru: "Отвечает за стратегию, партнёрства и итоги работы центра.",
      en: "Owns strategy, partnerships and the centre's annual results.",
    },
    kind: "leadership",
  },
  {
    card: `team-urokov-asliadin`,
    name: { ru: "Уроков Аслиадин", en: "Asliadin Urokov" },
    role: { ru: "Коммерческий директор SOF EXPO", en: "Commercial director of SOF EXPO" },
    blurb: {
      ru: "Отвечает за коммерческие условия участия и доходность площадки.",
      en: "Owns the commercial terms of participation and the venue's P&L.",
    },
    kind: "leadership",
  },

  /* ── media & marketing ──────────────────────────────────────────── */
  {
    card: `team-nazir-elmuradov`,
    name: { ru: "Назир Эльмурадов", en: "Nazir Elmuradov" },
    role: { ru: "Маркетолог SOF EXPO", en: "Marketing manager at SOF EXPO" },
    blurb: {
      ru: "Медиаплан, партнёрские публикации, аккредитация прессы на дни события.",
      en: "Media plan, partner publications and press accreditation for show days.",
    },
    kind: "media",
  },
  {
    card: `team-ziyadullaev-firdaus`,
    name: { ru: "Зиядуллаев Фируавс", en: "Firdaus Ziyadullaev" },
    role: { ru: "SMM-менеджер SOF EXPO", en: "SMM manager at SOF EXPO" },
    blurb: {
      ru: "Каналы площадки в соцсетях, анонсы событий и работа с подписчиками.",
      en: "The venue's social channels, event announcements and follower engagement.",
    },
    kind: "media",
  },

  /* ── show sales ─────────────────────────────────────────────────── */
  {
    card: `team-ziyaev-oybek`,
    name: { ru: "Зияев Ойбек", en: "Oybek Ziyaev" },
    role: {
      ru: "Менеджер по продажам BUILD PRO EXPO",
      en: "Sales manager for BUILD PRO EXPO",
    },
    blurb: {
      ru: "Заявки на BUILD PRO EXPO: строительные материалы, техника, инструмент.",
      en: "BUILD PRO EXPO enquiries: construction materials, equipment, tools.",
    },
    phone: "+998 97 392 07 05",
    kind: "sales",
  },

  /* ── client-facing managers ─────────────────────────────────────── */
  {
    card: `team-alieva-dilafruz`,
    name: { ru: "Алиева Дилафруз", en: "Dilafruz Alieva" },
    role: { ru: "Менеджер по работе с клиентами SOF EXPO", en: "Client manager at SOF EXPO" },
    blurb: {
      ru: "Первый контакт по участию: пакеты, метраж, договор и график платежей.",
      en: "First point of contact for participation: packages, space, contract, payment plan.",
    },
    kind: "client",
  },
  {
    card: `team-aminjanova-nargiza`,
    name: { ru: "Аминджанова Наргиза", en: "Nargiza Aminjanova" },
    role: {
      ru: "Менеджер по работе с клиентами FOODERA EXPO",
      en: "Client manager for FOODERA EXPO",
    },
    blurb: {
      ru: "Заявки на FOODERA EXPO: пищевая промышленность, дегустации, конкурс продуктов.",
      en: "FOODERA EXPO enquiries: food industry, tastings, product contest.",
    },
    phone: "+998 97 962 07 05",
    kind: "client",
  },
  {
    card: `team-kholboeva-farangiz`,
    name: { ru: "Холбоева Фарангиз", en: "Farangiz Kholboeva" },
    role: {
      ru: "Менеджер по работе с клиентами FOODERA EXPO",
      en: "Client manager for FOODERA EXPO",
    },
    blurb: {
      ru: "Заявки на FOODERA EXPO: производители, поставщики ингредиентов и упаковки.",
      en: "FOODERA EXPO enquiries: producers, ingredient and packaging suppliers.",
    },
    kind: "client",
  },
  {
    card: `team-vakhobov-sheroz`,
    name: { ru: "Вахобов Шероз", en: "Sheroz Vakhobov" },
    role: { ru: "Менеджер по работе с клиентами SOF EXPO", en: "Client manager at SOF EXPO" },
    blurb: {
      ru: "Заявки на участие: пакеты, метраж, сопровождение до подписания договора.",
      en: "Participation enquiries: packages, space, handover to contract.",
    },
    phone: "+998 88 938 07 05",
    kind: "client",
  },
  {
    card: `team-mirzabekov-farkhod`,
    name: { ru: "Мирзабеков Фарход", en: "Farkhod Mirzabekov" },
    role: { ru: "Менеджер по работе с клиентами SOF EXPO", en: "Client manager at SOF EXPO" },
    blurb: {
      ru: "Заявки на участие и сопровождение экспонента от заявки до закрытия события.",
      en: "Participation enquiries and end-to-end exhibitor support.",
    },
    kind: "client",
  },

  /* ── technical service ──────────────────────────────────────────── */
  {
    card: `team-govur-kulimuradov`,
    name: { ru: "Говур Кулиуродов", en: "Govur Kulimuradov" },
    role: { ru: "Технический директор SOF EXPO", en: "Technical director of SOF EXPO" },
    blurb: {
      ru: "Утверждает техплан: электричество, высота, кран, звук, свет, пожарная безопасность.",
      en: "Approves the technical plan: power, heights, crane, sound, light, fire safety.",
    },
    kind: "technical",
  },
  {
    card: `team-narziqulov-sunnatbek`,
    name: { ru: "Нарзикулов Суннатбек", en: "Sunnatbek Narziqulov" },
    role: { ru: "IT-специалист SOF EXPO", en: "IT specialist at SOF EXPO" },
    blurb: {
      ru: "Интернет на площадке, регистрация, бейджи, сеть в дни монтажа и работы.",
      en: "On-site internet, registration, badges and networking during build-up and show.",
    },
    kind: "technical",
  },

  /* ── operations & procurement (deputy director first, then the team) ── */
  {
    card: `team-ibragimov-botir`,
    name: {
      ru: "Ибрагимов Ботир Абдивайитович",
      en: "Botir Abdivayitovich Ibragimov",
    },
    role: {
      ru: "Заместитель директора по хозяйственным и организационным вопросам SOF EXPO",
      en: "Deputy director for operations and organisation at SOF EXPO",
    },
    blurb: {
      ru: "Хозяйство площадки: склад, погрузочный двор, клининг, регламенты.",
      en: "Venue operations: storage, loading yard, cleaning, regulations.",
    },
    kind: "operations",
  },
  {
    card: `team-mahmudjonov-abdulvosit`,
    name: { ru: "Махмуджонов Абдулвосиит", en: "Abdulvosit Mahmudjonov" },
    role: { ru: "Отдел закупок SOF EXPO", en: "Procurement at SOF EXPO" },
    blurb: {
      ru: "Закупки для собственных событий и хозяйственные закупки площадки.",
      en: "Procurement for in-house events and venue operations.",
    },
    kind: "operations",
  },
  {
    card: `team-kholmonov-sardor`,
    name: { ru: "Холмонов Сардор", en: "Sardor Kholmonov" },
    role: { ru: "Энергетик SOF EXPO", en: "Power engineer at SOF EXPO" },
    blurb: {
      ru: "Энергоснабжение площадки: распределение нагрузки и резервные линии.",
      en: "Site power distribution: load balancing and reserve feeds.",
    },
    kind: "operations",
  },
  {
    card: `team-norbutaev-ilkhom`,
    name: { ru: "Илхом Норбутаев", en: "Ilkhom Norbutaev" },
    role: { ru: "Электрик SOF EXPO", en: "Electrician at SOF EXPO" },
    blurb: {
      ru: "Электрика стенда и зала: мощность, разводка, подключение во время монтажа.",
      en: "Stand and hall power: load, wiring and live hook-ups during build-up.",
    },
    kind: "operations",
  },

  /* ── support ────────────────────────────────────────────────────── */
  {
    card: `team-kurbanova-bakhora`,
    name: { ru: "Курбанова Бахора", en: "Bakhora Kurbanova" },
    role: { ru: "HR-менеджер SOF EXPO", en: "HR manager at SOF EXPO" },
    blurb: {
      ru: "Команда, волонтёры, аккредитация персонала на дни монтажа и работы.",
      en: "Team, volunteers and staff accreditation for build-up and show days.",
    },
    kind: "support",
  },
];

/** kind → display label (one per locale) */
export const teamKinds: Record<TeamKind, { ru: string; en: string }> = {
  leadership: { ru: "Руководство", en: "Leadership" },
  media: { ru: "Медиа и маркетинг", en: "Media & marketing" },
  sales: { ru: "Продажи выставок", en: "Show sales" },
  client: { ru: "Работа с клиентами", en: "Client managers" },
  technical: { ru: "Техническая служба", en: "Technical" },
  operations: { ru: "Хозяйство и закупки", en: "Operations & procurement" },
  support: { ru: "Поддержка", en: "Support" },
};
