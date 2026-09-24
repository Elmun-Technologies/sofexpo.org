import type { PageDef } from "./types";

export const companyPages: PageDef[] = [
  {
    path: "/about/",
    meta: {
      ru: {
        title:
          "О SOF EXPO Samarkand — выставочно-конгрессный центр в Самарканде",
        description:
          "Оператор центра в Самарканде: 4 400 м² зала и 5 000 м² улицы, 20+ событий и 70 000+ посетителей в год, собственные выставки, стандарты сервиса и команда.",
      },
      en: {
        title: "About SOF EXPO Samarkand — exhibition and congress centre",
        description:
          "The operating company of the centre in Samarkand: 4,400 m² hall, 5,000 m² outdoors, 20+ events and 70,000+ visitors a year, our own shows, service standards and team.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "О компании",
          title: "Центр, который сам стоит в зале",
          lead: "SOF EXPO — не аренда метров, а оператор событий: мы сами придумываем, собираем и ведём выставки FOODERA, BUILD PRO, AGROPRO, WORLD EDU и ECOM & RETAIL. Поэтому техтребования, регламенты и сервис написаны с точки зрения того, что реально происходит в дни монтажа и работы.",
          bullets: [
            "Полный цикл: от идеи события до пост-отчёта",
            "Отраслевые команды, которые говорят на языке рынка",
            "Инфраструктура и сервис — свои",
          ],
          image: "/images/venue-exterior.jpg",
          imageAlt: "Выставочный центр SOF EXPO",
          actions: [
            { label: "Команда", href: "/about/team/" },
            { label: "Партнёры", href: "/about/partners/" },
          ],
        },
        {
          type: "stats",
          items: [
            { value: "4 400", unit: "м²", label: "закрытый зал" },
            { value: "5 000", unit: "м²", label: "открытая площадка" },
            { value: "20+", unit: "", label: "событий в год" },
            { value: "70 000", unit: "+", label: "посетителей" },
          ],
        },
        {
          type: "text",
          title: "Как устроен центр",
          paragraphs: [
            "Юридическая основа — ООО «RESOF EXPO», операционная компания центра «SOF EXPO SAMARKAND» в Джамбайском районе Самарканда. В здании один большой трансформируемый зал, конференц-пространство, служба регистрации, техническая и сервисная служба, склад и погрузочный двор.",
            "Мы работаем в трёх ролях: как площадка для внешних организаторов, как оператор собственных выставок и как партнёр государственных программ развития отраслей — от агропрома до лёгкой промышленности.",
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "sparkle",
              title: "Стандарт, а не обещание",
              text: "Все регламенты — чистка, высота, электрика, безопасность — описаны и применяются одинаково к участнику из Китая и к местному фермерскому хозяйству.",
            },
            {
              icon: "handshake",
              title: "Отрасль в центре стола",
              text: "Каждую выставку собирает команда, которая знает рынок: у нас нет универсальных менеджеров «на всё».",
            },
            {
              icon: "shield",
              title: "Ответственность за цифры",
              text: "Публикуем посещаемость и статистику по событиям: если заявка на выставку выросла, мы покажем это и в обратном случае тоже.",
            },
          ],
        },
        {
          type: "quote",
          text: "Мы строим не стенды, а рынок контакта: чтобы закупщик, производитель и поставщик услуги оказались в одном зале в один день.",
          cite: "команда SOF EXPO",
        },
        {
          type: "rows",
          items: [
            {
              title: "Собственные выставки",
              text: "Шесть регулярных событий, каждое — с деловой программой, конкурсом продуктов, каталогом участников и отчётностью.",
            },
            {
              title: "Приём чужих событий",
              text: "Выставки, форумы, корпоративные и государственные мероприятия, фестивали: инфраструктура, монтаж, безопасность, регистрация.",
            },
            {
              title: "Работа с отраслями",
              text: "Совместно с ассоциациями, министерствами и бизнес-кластерами: мы доводим рынок до площадки, а площадку — до рынка.",
            },
            {
              title: "Экономика региона",
              text: "Каждое событие — гостиницы, транспорт, питание и сервисы в Самарканде. Мы считаем это как часть результата.",
            },
          ],
        },
        {
          type: "links",
          items: [
            { label: "Афиша выставок", href: "/events/" },
            { label: "Площадка", href: "/venue/" },
            { label: "Экспонентам", href: "/exhibitors/" },
            { label: "Организаторам событий", href: "/organizers/" },
            { label: "Контакты и реквизиты", href: "/contacts/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "About",
          title: "A centre that stands in the hall itself",
          lead: "SOF EXPO is not a meter rental company but an event operator: we design, assemble and run FOODERA, BUILD PRO, AGROPRO, WORLD EDU and ECOM & RETAIL ourselves. That is why the technical rules, regulations and service standards are written from what actually happens during build-up and show days.",
          bullets: [
            "Full cycle: from concept to post-report",
            "Industry teams that speak the market language",
            "Our own infrastructure and service",
          ],
          image: "/images/venue-exterior.jpg",
          imageAlt: "SOF EXPO exhibition centre",
          actions: [
            { label: "Team", href: "/about/team/" },
            { label: "Partners", href: "/about/partners/" },
          ],
        },
        {
          type: "stats",
          items: [
            { value: "4,400", unit: "m²", label: "indoor hall" },
            { value: "5,000", unit: "m²", label: "open-air area" },
            { value: "20+", unit: "", label: "events a year" },
            { value: "70,000", unit: "+", label: "visitors" },
          ],
        },
        {
          type: "text",
          title: "How the centre is built",
          paragraphs: [
            "The legal entity is LLC «RESOF EXPO», the operating company of the «SOF EXPO SAMARKAND» centre in the Dzhambay district of Samarkand. One large transformable hall, a conference space, a registration service, technical and service departments, storage and a loading yard.",
            "We work in three roles: as a venue for external organizers, as the operator of our own exhibitions, and as a partner in state programs for industry development — from agriculture to light industry.",
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "sparkle",
              title: "Standard, not promise",
              text: "Every regulation — cleaning, heights, power, safety — is written down and applied the same way to a supplier from China and to a local farm.",
            },
            {
              icon: "handshake",
              title: "The industry at the table",
              text: "Each show is put together by a team that knows the market. We do not have universal managers covering everything.",
            },
            {
              icon: "shield",
              title: "Owning the numbers",
              text: "We publish attendance and event statistics. If a show grows we say so — and the same when it does not.",
            },
          ],
        },
        {
          type: "quote",
          text: "We build a contact market, not stands: so that a buyer, a manufacturer and a service provider end up in the same hall on the same day.",
          cite: "the SOF EXPO team",
        },
        {
          type: "rows",
          items: [
            {
              title: "Own exhibitions",
              text: "Six regular events, each with a business programme, product contest, exhibitor catalogue and reporting.",
            },
            {
              title: "Third-party events",
              text: "Trade shows, forums, corporate and state events, festivals: infrastructure, build, security, registration.",
            },
            {
              title: "Working with industries",
              text: "Together with associations, ministries and business clusters: we bring the market to the venue and the venue to the market.",
            },
            {
              title: "Regional economy",
              text: "Every event means hotels, transport, catering and services in Samarkand. We count that as part of the result.",
            },
          ],
        },
        {
          type: "links",
          items: [
            { label: "Exhibition line-up", href: "/events/" },
            { label: "The venue", href: "/venue/" },
            { label: "For exhibitors", href: "/exhibitors/" },
            { label: "For event organizers", href: "/organizers/" },
            { label: "Contacts and details", href: "/contacts/" },
          ],
        },
      ],
    },
  },
  {
    path: "/about/team/",
    meta: {
      ru: {
        title: "Команда SOF EXPO: кто отвечает за выставку",
        description:
          "Проектные директора отраслевых выставок, менеджер по продажам площади, технический директор площадки, служба регистрации и маркетинг. К кому по какому вопросу и как связаться напрямую.",
      },
      en: {
        title: "The SOF EXPO team: who owns which part of your show",
        description:
          "Project directors of industry shows, floor sales manager, venue technical director, registration desk and marketing. Who to contact for what and how to reach them directly.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Команда",
          title: "У каждого вопроса — своё имя",
          lead: "Мы принципиально не прячем контакты за общей почтой. На этой странице — все 17 человек SOF EXPO с лицами, ролями и зонами ответственности. Имя конкретного менеджера по вашей выставке вы получите в первом же письме.",
          actions: [{ label: "Написать в отдел продаж", href: "/contacts/" }],
          image: "/images/team/team-ahmadkhon-tadzhibaev.jpg",
          imageAlt: "Руководитель SOF EXPO Ахмаджон Таджибаев",
          mediaRatio: "1/1",
        },
        {
          type: "h2",
          kicker: "Кто есть кто",
          title: "Команда SOF EXPO",
          text: "Руководство — первым, за ним медиа и продажи, дальше — клиентские менеджеры, техслужба и хозяйство. У трёх менеджеров на карточке указан прямой номер.",
          id: "team-wall",
        },
        {
          type: "team",
        },
        {
          type: "h2",
          kicker: "Роли",
          title: "К кому по какому вопросу",
          text: "Короткий путь от вопроса к человеку: что решает каждая роль, кому писать и кому звонить в день выставки.",
          id: "team-roles",
        },
        {
          type: "rows",
          items: [
            {
              title: "Проектный директор выставки",
              text: "Отвечает за концепцию, состав участников, деловую программу и финальный результат события. Решение о нестандартном стенде, демо-зоне или special project — за ним.",
            },
            {
              title: "Менеджер по работе с экспонентами",
              text: "Пакеты, метраж, договор, документы, график платежей. Считает конфигурацию стенда и подбирает застройку.",
            },
            {
              title: "Технический директор центра",
              text: "Электричество, высота, кран, звуковое и световое оборудование, планировка, пожарная безопасность. Утверждает техплан до начала монтажа.",
            },
            {
              title: "Менеджер по посетителям",
              text: "Приглашения, регистрация, списки, маршруты, волонтёры, координация групп.",
            },
            {
              title: "Маркетинг и медиа",
              text: "Анонсы, партнёрские публикации, работа со СМИ, аккредитация, съёмка.",
            },
            {
              title: "Партнёрства",
              text: "Ассоциации, государственные программы, образовательные учреждения, спонсоры.",
            },
          ],
        },
        {
          type: "text",
          title: "Как мы работаем на событии",
          paragraphs: [
            "В дни выставки вся команда находится в оперштабе, и до любого ответчика можно дойти за 5 минут — физически. Для экспонента это означает, что технический вопрос не превращается в переписку на два дня.",
            "Мы говорим на узбекском, русском, английском и турецком: на этих языках ведутся переговоры, регистрация участников и деловые сессии.",
          ],
        },
        {
          type: "callout",
          kicker: "Вакансии",
          title: "Ищем менеджеров по продажам и technical coordinator",
          text: "Если вы знаете рынок стройматериалов, пищевой промышленности или агро — напишите нам, обсудим роль в команде.",
          action: { label: "Отправить резюме", href: "/contacts/" },
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Team",
          title: "Every question has a name",
          lead: "We do not hide contacts behind a generic mailbox. On this page — all 17 people at SOF EXPO with faces, roles and what they own. The specific manager for your show is named in the first reply.",
          actions: [{ label: "Write to sales", href: "/contacts/" }],
          image: "/images/team/team-ahmadkhon-tadzhibaev.jpg",
          imageAlt: "Ahmadkhon Tadzhibaev, head of SOF EXPO",
          mediaRatio: "1/1",
        },
        {
          type: "h2",
          kicker: "Who is who",
          title: "The SOF EXPO team",
          text: "Leadership first, then media and sales, followed by client managers, technical and operations. Three managers carry a direct line on their card.",
          id: "team-wall",
        },
        {
          type: "team",
        },
        {
          type: "h2",
          kicker: "Roles",
          title: "Who to contact for what",
          text: "A short path from a question to the person who settles it: what each role owns, who to write to, and who to call on show day.",
          id: "team-roles",
        },
        {
          type: "rows",
          items: [
            {
              title: "Show project director",
              text: "Owns concept, exhibitor mix, business programme and final results. Non-standard stands, demo zones and special projects are decided here.",
            },
            {
              title: "Exhibitor relations manager",
              text: "Packages, space, contract, documents, payment schedule. They size the stand and match the build.",
            },
            {
              title: "Venue technical director",
              text: "Power, heights, crane, sound and light, layout, fire safety. Approves the technical plan before build-up.",
            },
            {
              title: "Visitor manager",
              text: "Invitations, registration, lists, routes, volunteers, group coordination.",
            },
            {
              title: "Marketing and media",
              text: "Announcements, partner publications, press work, accreditation, filming.",
            },
            {
              title: "Partnerships",
              text: "Associations, state programs, education institutions, sponsors.",
            },
          ],
        },
        {
          type: "text",
          title: "How we work during a show",
          paragraphs: [
            "On show days the whole team sits in the operations room and any responder is five minutes away — physically. For an exhibitor that means a technical question does not turn into two days of email.",
            "We work in Uzbek, Russian, English and Turkish: negotiations, exhibitor registration and conference sessions run in these languages.",
          ],
        },
        {
          type: "callout",
          kicker: "Careers",
          title: "Hiring: sales manager and technical coordinator",
          text: "If you know the construction materials, food industry or agriculture market, write to us — we will shape the role.",
          action: { label: "Send a CV", href: "/contacts/" },
        },
      ],
    },
  },
  {
    path: "/about/partners/",
    meta: {
      ru: {
        title: "Партнёры SOF EXPO: ассоциации, вузы, отели и медиа",
        description:
          "С кем центр делает выставки: отраслевые ассоциации и госпрограммы, вузы и образовательные сети, гостиницы Reikartz для участников, профильные медиа и сервисные партнёры.",
      },
      en: {
        title:
          "SOF EXPO partners: associations, universities, hotels and media",
        description:
          "Who the centre builds shows with: industry associations and state programs, universities and education networks, Reikartz hotels for participants, trade media and service partners.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Партнёры",
          title: "Выставку делает не один зал",
          lead: "Ассоциации приводят отрасли, вузы — аудиторию, отели решают логистику, медиа — видимость. Ниже — с кем мы работаем и что это даёт вам как участнику или посетителю.",
          image: "/images/event-agropro.jpg",
          imageAlt: "Отраслевая выставка",
        },
        {
          type: "partners",
          kicker: "Логотипы партнёров",
          title: "Кто стоит за выставками SOF EXPO",
          text: "Организаторы, отраслевые союзы, отели и сервисы. Список обновляется по мере подписания партнёрств.",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "building",
              title: "Государство и ассоциации",
              text: "Министерства, торгово-промышленная палата, отраслевые союзы и региональные администрации — соорганизаторы профильных секций и деловых программ.",
            },
            {
              icon: "cap",
              title: "Университеты и колледжи",
              text: "Участие в WORLD EDU, стажировки для студентов на наших событиях, совместные исследования рынка.",
            },
            {
              icon: "seat",
              title: "Отели",
              text: "Reikartz даёт участникам и партнёрам SOF EXPO 15% на проживание — код высылается с подтверждением заявки.",
            },
            {
              icon: "megaphone",
              title: "Медиапартнёры",
              text: "Отраслевые издания, телеграм-каналы и деловые медиа: анонсы, репортажи, интервью на площадке.",
            },
            {
              icon: "truck",
              title: "Сервисные партнёры",
              text: "Фулфилмент, логистика, таможенное оформление, застройщики, печатные студии — по прайсу, без наценки с нашей стороны.",
            },
            {
              icon: "handshake",
              title: "Билетные операторы",
              text: "Ticketon.uz ведёт продажи фестивальных событий; данные о продажах доступны организатору.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Мы не ставим логотип партнёра на баннер «за бесплатно»: каждая строка партнёрства — это конкретное обязательство, дата и ответственный. Если вы хотите, чтобы ваша ассоциация, вуз или медиа стали частью события, напишите — предложим формат.",
            "Партнёрам доступны: зона регистрации и приветствия, сцена для презентации, доступ к каталогу участников, совместная рассылка.",
          ],
        },
        {
          type: "cta",
          title: "Стать партнёром выставки",
          text: "Расскажите, какую аудиторию вы приводите и что вам нужно взамен.",
          actions: [
            { label: "Предложить партнёрство", href: "/contacts/" },
            { label: "Медиа-кит", href: "/news/media-kit/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Partners",
          title: "A hall alone does not make a show",
          lead: "Associations bring industries, universities bring audiences, hotels solve logistics, media bring visibility. Here is who we work with and what it gives you as an exhibitor or visitor.",
          image: "/images/event-agropro.jpg",
          imageAlt: "Trade exhibition",
        },
        {
          type: "partners",
          kicker: "Partner logos",
          title: "Who stands behind the SOF EXPO shows",
          text: "Organizers, industry unions, hotels and services. The list grows as partnerships are signed.",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "building",
              title: "State and associations",
              text: "Ministries, the chamber of commerce, industry unions and regional administrations co-organize sections and business programmes.",
            },
            {
              icon: "cap",
              title: "Universities and colleges",
              text: "Participation in WORLD EDU, internships for students at our events, joint market research.",
            },
            {
              icon: "seat",
              title: "Hotels",
              text: "Reikartz gives SOF EXPO participants and partners 15% off accommodation — the code comes with your confirmation.",
            },
            {
              icon: "megaphone",
              title: "Media partners",
              text: "Trade publications, Telegram channels and business media: announcements, reports, interviews on site.",
            },
            {
              icon: "truck",
              title: "Service partners",
              text: "Fulfilment, logistics, customs, stand builders, print studios — at their rate card, with no mark-up from us.",
            },
            {
              icon: "handshake",
              title: "Ticketing",
              text: "Ticketon.uz runs festival sales; the organizer sees the sales data.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            'We do not put a partner logo on a banner "for exposure": every partnership line is a concrete commitment, a date and an owner. If your association, university or media wants to be part of an event, write — we will propose a format.',
            "Available to partners: a welcome and registration zone, a stage slot for a presentation, access to the exhibitor catalogue, a joint mailing.",
          ],
        },
        {
          type: "cta",
          title: "Become a show partner",
          text: "Tell us which audience you bring and what you need in return.",
          actions: [
            { label: "Propose a partnership", href: "/contacts/" },
            { label: "Media kit", href: "/news/media-kit/" },
          ],
        },
      ],
    },
  },
  {
    path: "/contacts/",
    meta: {
      ru: {
        title: "Контакты SOF EXPO Samarkand — адрес, телефоны, форма заявки",
        description:
          "Самаркандская область, Джамбайский район. Телефоны +998 55 705 0 705 и +998 88 399 07 05, почта info@sofexpo.uz, Telegram, часы работы, карта и форма заявки на участие.",
      },
      en: {
        title: "Contacts — SOF EXPO Samarkand address, phones, request form",
        description:
          "Samarkand region, Dzhambay district. Phones +998 55 705 0 705 and +998 88 399 07 05, info@sofexpo.uz, Telegram, opening hours, map and a participation request form.",
      },
    },
    blocks: {
      ru: [
        {
          /* a contacts page is map + phone + form — the render does not belong here (docs/08 §4.11) */
          type: "hero",
          kicker: "Контакты",
          title: "Напишите — ответим в тот же день",
          lead: "Этот адрес принимает всё: заявки на участие, запросы прайсов, техническую документацию, прессу и партнёрства. Если вопрос срочный во время выставки — звоните.",
          actions: [
            { label: "Забронировать стенд", href: "/request-stand/" },
            { label: "Telegram", href: "https://t.me/sofexpo" },
          ],
        },
        {
          type: "grid",
          cols: 2,
          items: [
            {
              icon: "pin",
              title: "Адрес",
              text: "Самаркандская область, Джамбайский район, выставочный центр «SOF EXPO SAMARKAND».",
              href: "https://maps.google.com/?q=SOF+EXPO+Samarkand",
            },
            {
              icon: "phone",
              title: "Телефоны",
              text: "+998 55 705 0 705 — участие и продажа площади. +998 88 399 07 05 — посетители и аккредитация.",
            },
            {
              icon: "mail",
              title: "Почта",
              text: "info@sofexpo.uz — общий адрес. Для прессы и партнёрств — та же почта с темой «Press» или «Partnership».",
            },
            {
              icon: "calendar",
              title: "Часы работы",
              text: "Пн–Пт 9:00–18:00. В дни монтажа и работы выставки офис открыт с 8:00 до последнего посетителя.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Как добраться",
          title: "16 км от аэропорта, 23 км от вокзала",
          text: "Въезд с самаркандского кольца, парковка при въезде, грузовой двор для фур. Трансфер от аэропорта и вокзала бронируется через менеджера.",
        },
        {
          type: "map",
        },
        {
          type: "table",
          head: ["Отдел", "Канал", "Что решить"],
          rows: [
            [
              "Отдел продаж площади",
              "info@sofexpo.uz, +998 55 705 0 705",
              "стенд, пакеты, спонсорство, счет и договор",
            ],
            [
              "Техническая служба",
              "по заявке через менеджера",
              "электричество, высота, кран, интернет, мебель",
            ],
            [
              "Служба посетителей",
              "+998 88 399 07 05",
              "билеты, группы, доступная среда, программы школ",
            ],
            [
              "Пресс-служба",
              "info@sofexpo.uz, тема «Press»",
              "аккредитация, материалы, интервью, фото",
            ],
            [
              "Партнёрства и ассоциации",
              "+998 55 705 0 705",
              "совместные события, конференции, господдержка",
            ],
          ],
        },
        {
          type: "form",
          formType: "callback",
          title: "Форма заявки",
          text: "Заполните — ответим в течение рабочего дня, а по вопросам участия пришлём план зала и цены.",
        },
        {
          type: "text",
          title: "Реквизиты",
          paragraphs: [
            "Операционная компания центра — ООО «RESOF EXPO». Реквизиты для оплаты, договор и акт предоставляются менеджером вместе со счётом; если нужно проверить контрагента заранее — запросите уставные документы письмом на общую почту.",
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Contacts",
          title: "Write and we reply the same day",
          lead: "This address takes everything: participation requests, price enquiries, technical documents, press and partnerships. If it is urgent during a show, call.",
          actions: [
            { label: "Book a stand", href: "/request-stand/" },
            { label: "Telegram", href: "https://t.me/sofexpo" },
          ],
        },
        {
          type: "grid",
          cols: 2,
          items: [
            {
              icon: "pin",
              title: "Address",
              text: "Samarkand region, Dzhambay district, «SOF EXPO SAMARKAND» exhibition centre.",
              href: "https://maps.google.com/?q=SOF+EXPO+Samarkand",
            },
            {
              icon: "phone",
              title: "Phones",
              text: "+998 55 705 0 705 — participation and floor sales. +998 88 399 07 05 — visitors and accreditation.",
            },
            {
              icon: "mail",
              title: "Email",
              text: 'info@sofexpo.uz — general address. For press and partnerships use the same mailbox with "Press" or "Partnership" in the subject.',
            },
            {
              icon: "calendar",
              title: "Office hours",
              text: "Mon–Fri 9:00–18:00. During build-up and show days the office is open from 8:00 until the last visitor.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Getting there",
          title: "16 km from the airport, 23 km from the station",
          text: "Entrance off the Samarkand ring road, parking at the gate, a loading yard for trucks. Transfers from the airport and station are booked through the manager.",
        },
        {
          type: "map",
        },
        {
          type: "table",
          head: ["Desk", "Channel", "What it settles"],
          rows: [
            [
              "Floor sales",
              "info@sofexpo.uz, +998 55 705 0 705",
              "stand, packages, sponsorship, invoice and contract",
            ],
            [
              "Technical service",
              "via your manager",
              "power, heights, crane, internet, furniture",
            ],
            [
              "Visitor desk",
              "+998 88 399 07 05",
              "tickets, groups, accessibility, school programmes",
            ],
            [
              "Press office",
              'info@sofexpo.uz, subject "Press"',
              "accreditation, material, interviews, photography",
            ],
            [
              "Partnerships",
              "+998 55 705 0 705",
              "joint events, conferences, subsidies",
            ],
          ],
        },
        {
          type: "form",
          formType: "callback",
          title: "Request form",
          text: "Fill it in and we reply within the business day, with the floor plan and prices for participation questions.",
        },
        {
          type: "text",
          title: "Company details",
          paragraphs: [
            "The operating company of the centre is LLC «RESOF EXPO». Payment details, contract and acceptance act come from your manager with the invoice; request constitutional documents by email if you need to verify us beforehand.",
          ],
        },
      ],
    },
  },
  {
    path: "/request-stand/",
    meta: {
      ru: {
        title: "Забронировать стенд на выставке в Самарканде",
        description:
          "Заявка на участие в FOODERA, BUILD PRO, AGROPRO, WORLD EDU или ECOM & RETAIL EXPO: выберите выставку, площадь и тип стенда — пришлём план, пакет и счёт в течение рабочего дня.",
      },
      en: {
        title: "Book a stand at an exhibition in Samarkand",
        description:
          "Apply for FOODERA, BUILD PRO, AGROPRO, WORLD EDU or ECOM & RETAIL EXPO: pick the show, area and stand type — we send the plan, package and invoice within a business day.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Бронирование",
          title: "Заявка вместо переписки",
          lead: "Опишите участие в одной форме — вы получите план зала со свободными метрами, расчёт пакета и проект договора. Не нужно гадать, какое событие вам подходит: если сомневаетесь, напишите в комментарии.",
          image: "/images/event-buildpro.jpg",
          imageAlt: "Экспозиция строительной выставки",
        },
        {
          type: "quiz",
          title: "Подберём стенд за 4 шага",
          text: "Четыре вопроса — и менеджер пришлёт план зала, свободные метры и расчёт пакета.",
          note: "Если нужны демонстрационная зона, улица или отдельный павильон — отметьте «Пока не знаю» и опишите задачу в комментарии.",
          areas: ["9 м²", "12 м²", "18 м²", "36 м²", "от 50 м² / улица"],
        },
        {
          type: "form",
          formType: "exhibitor",
          eventName: "любая выставка",
          title: "Заявка на стенд",
          text: "Ответ в течение рабочего дня.",
          areas: ["9 м²", "12 м²", "18 м²", "36 м²", "от 50 м² / улица"],
          note: "Если вам нужны демонстрационная зона, улица или отдельный павильон, напишите в комментарии площадь и требования к электричеству.",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cube",
              title: "Что входит в минимум",
              text: "Метраж, договор, регистрация в каталоге, базовая информация на сайте события, право заказывать услуги.",
            },
            {
              icon: "zap",
              title: "Техника — сразу",
              text: "Отметьте мощность, воду, интернет и высоту в заявке: потом это оформляется дополнительным соглашением и стоит дороже.",
            },
            {
              icon: "handshake",
              title: "Помощь с подготовкой",
              text: "Подбор застройщика, печать, логистика, перевод документов, регистрация сотрудников — всё на площадке.",
            },
          ],
        },
        {
          type: "faq",
          items: [
            {
              q: "Чем отличается заявка от договора?",
              a: "Заявка бронирует место на 3 рабочих дня. Договор и счёт присылает менеджер — их можно подписать удалённо.",
            },
            {
              q: "Если нужный метраж занят?",
              a: "Мы предложим соседнюю позицию или увеличим площадь: на части выставок есть лист ожидания на угловые стенды у прохода.",
            },
            {
              q: "Можно приехать посмотреть зал до брони?",
              a: "Да, технический визит согласуется в комментарии к заявке — покажем план, коммуникации и загрузку даты.",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Booking",
          title: "One form instead of an email chain",
          lead: "Describe your participation once — you get the hall plan with free space, the package quote and a draft contract. Unsure which show fits? Write it in the comment and we will route you.",
          image: "/images/event-buildpro.jpg",
          imageAlt: "Construction exhibition",
        },
        {
          type: "quiz",
          title: "Find your stand in four steps",
          text: "Four questions — and the manager sends the hall plan, free metres and the package quote.",
          note: "Need a demo area, outdoor space or a separate pavilion? Pick “Not sure yet” and describe the task in the comment.",
          areas: ["9 m²", "12 m²", "18 m²", "36 m²", "50 m²+ / outdoor"],
        },
        {
          type: "form",
          formType: "exhibitor",
          eventName: "any show",
          title: "Stand booking request",
          text: "We answer within one business day.",
          areas: ["9 m²", "12 m²", "18 m²", "36 m²", "50 m²+ / outdoor"],
          note: "Need a demo area, outdoor space or a separate pavilion? Put the size and power requirements in the comment.",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cube",
              title: "The minimum includes",
              text: "Space, contract, catalogue listing, basic event-page placement, the right to order services.",
            },
            {
              icon: "zap",
              title: "Book tech early",
              text: "Mark power, water, internet and height in the request: later it becomes a supplemental agreement and costs more.",
            },
            {
              icon: "handshake",
              title: "Preparation help",
              text: "Builder matching, print, logistics, document translation, staff registration — all on site.",
            },
          ],
        },
        {
          type: "faq",
          items: [
            {
              q: "Is a request the same as a contract?",
              a: "A request holds the space for three business days. The manager then sends contract and invoice, both signable remotely.",
            },
            {
              q: "What if my size is sold out?",
              a: "We offer the neighbouring position or more space; some shows keep a waiting list for corner stands on the main aisle.",
            },
            {
              q: "Can we inspect the hall first?",
              a: "Yes — request a technical visit in the comment and we will show the plan, utilities and the date load.",
            },
          ],
        },
      ],
    },
  },
  {
    path: "/news/media-kit/",
    meta: {
      ru: {
        title:
          "Пресс-центр и медиакит SOF EXPO: логотипы, фотобанк, аккредитация",
        description:
          "Материалы для СМИ: брендблок, фотографии зала и событий, факты о центре, правила аккредитации на выставки, контакты пресс-службы и порядок цитирования.",
      },
      en: {
        title: "Press centre and media kit: logos, photo bank, accreditation",
        description:
          "Materials for media: brand block, hall and event photography, centre facts, accreditation rules, press office contacts and citation guidelines.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "СМИ",
          title: "Материалы, которые можно брать в работу",
          lead: "Логотипы, фотографии зала и событий, проверенные цифры и контакты спикеров. Аккредитация на выставки — по заявке за 2 рабочих дня, съёмка в монтажные дни — по согласованию с техслужбой.",
          image: "/images/venue-exterior.jpg",
          imageAlt: "Экстерьер центра",
          actions: [{ label: "Запросить аккредитацию", href: "/contacts/" }],
        },
        {
          type: "files",
          items: [
            {
              title: "Брендблок SOF EXPO (SVG, PNG)",
              href: "/files/sof-expo-logo.svg",
              note: "версии на светлом и тёмном фоне",
              kind: "svg",
            },
            {
              title: "Факты о центре",
              href: "/files/sof-expo-technical-datasheet.pdf",
              note: "площади, мощности, вместимость",
              kind: "pdf",
            },
            {
              title: "Постер ближайшей выставки",
              href: "/files/foodera-catalogue.pdf",
              note: "анонс, даты, разделы",
              kind: "pdf",
            },
          ],
        },
        {
          type: "stats",
          items: [
            { value: "6", unit: "", label: "регулярных выставок" },
            { value: "20+", unit: "", label: "событий в год" },
            { value: "70 000", unit: "+", label: "посетителей" },
            { value: "4", unit: "языка", label: "рабочих языках событий" },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Как аккредитоваться",
              text: "Напишите на info@sofexpo.uz с темой «Press»: издание, ФИО, телефон, список материалов, которые вы готовите. Пропуск получат редакция и фотограф.",
            },
            {
              title: "Съёмка и интервью на площадке",
              text: "Съёмка в зале разрешена в часы работы без согласования, интервью с экспонентами — с их согласия. Штативы и свет в проходах — через пресс-службу.",
            },
            {
              title: "Что можно цитировать",
              text: "Цифры из отчётов о посещаемости и каталогов участников. Если нужно уточнение по рынку, дадим комментарий проектного директора.",
            },
            {
              title: "Фото и видео по запросу",
              text: "Отправим архив прошедшего события в течение дня: общий план, экспоненты, сцена, дегустации, демо.",
            },
          ],
        },
        {
          type: "callout",
          kicker: "Релизы",
          title: "Анонсы выходят заранее",
          text: "Релиз о старте продаж, о составе участников, о программе и итоговый релиз — по каждому событию. Подпишитесь на рассылку для прессы, чтобы не пропустить.",
          tone: "gold",
          action: { label: "Подписаться", href: "/contacts/" },
        },
        {
          type: "links",
          items: [
            { label: "Все новости", href: "/news/" },
            { label: "Афиша выставок", href: "/events/" },
            { label: "Площадка и факты", href: "/venue/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "For media",
          title: "Material you can put to work",
          lead: "Logos, hall and event photography, verified figures and speaker contacts. Show accreditation on request two business days ahead; filming during build-up goes through the technical service.",
          image: "/images/venue-exterior.jpg",
          imageAlt: "Centre exterior",
          actions: [{ label: "Request accreditation", href: "/contacts/" }],
        },
        {
          type: "files",
          items: [
            {
              title: "SOF EXPO brand block (SVG, PNG)",
              href: "/files/sof-expo-logo.svg",
              note: "light and dark background versions",
              kind: "svg",
            },
            {
              title: "Centre facts",
              href: "/files/sof-expo-technical-datasheet.pdf",
              note: "areas, power, capacity",
              kind: "pdf",
            },
            {
              title: "Next show poster",
              href: "/files/foodera-catalogue.pdf",
              note: "announcement, dates, sections",
              kind: "pdf",
            },
          ],
        },
        {
          type: "stats",
          items: [
            { value: "6", unit: "", label: "regular exhibitions" },
            { value: "20+", unit: "", label: "events a year" },
            { value: "70,000", unit: "+", label: "visitors" },
            { value: "4", unit: "languages", label: "working languages" },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "How to accredit",
              text: 'Write to info@sofexpo.uz with the subject "Press": outlet, name, phone, the stories you are preparing. The pass covers the journalist and the photographer.',
            },
            {
              title: "Filming and interviews",
              text: "Shooting in the hall during opening hours needs no approval; interviews with exhibitors need their consent. Tripods and lighting in aisles go through the press office.",
            },
            {
              title: "What you can cite",
              text: "Attendance reports and exhibitor catalogues. Need market context? We arrange a comment from the project director.",
            },
            {
              title: "Photo and video on request",
              text: "We send the archive of a past event within a day: wide shots, exhibitors, stage, tastings, demos.",
            },
          ],
        },
        {
          type: "callout",
          kicker: "Releases",
          title: "Announcements come early",
          text: "Sales opening, exhibitor line-up, programme and final results — one release per stage for every event. Join the press mailing list.",
          tone: "gold",
          action: { label: "Subscribe", href: "/contacts/" },
        },
        {
          type: "links",
          items: [
            { label: "All news", href: "/news/" },
            { label: "Exhibition line-up", href: "/events/" },
            { label: "Venue and facts", href: "/venue/" },
          ],
        },
      ],
    },
  },
  {
    path: "/legal/privacy/",
    meta: {
      ru: {
        title: "Политика конфиденциальности",
        description:
          "Какие данные собирает сайт SOF EXPO, с какой целью, как долго хранятся заявки на участие и регистрация посетителей, права субъекта данных и контакты.",
      },
      en: {
        title: "Privacy policy — SOF EXPO Samarkand",
        description:
          "What data the SOF EXPO website collects, for what purpose, how long stand bookings and visitor registrations are kept, data subject rights and contacts.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Правовая информация",
          title: "Политика конфиденциальности",
          lead: "Мы собираем минимум данных и только для того, чтобы обработать вашу заявку. Ниже — что именно, зачем и как удалить.",
          image: "/images/hero-hall.jpg",
          imageAlt: "Зал центра",
        },
        {
          type: "rows",
          items: [
            {
              title: "Какие данные мы собираем",
              text: "Имя, компания, должность, телефон, e-mail и текст сообщения из форм заявок и регистрации; технические данные обращения — для защиты от спама.",
            },
            {
              title: "Зачем",
              text: "Обработать заявку, заключить и исполнить договор участия, выдать билет и бейдж, рассказать о следующей дате, если вы согласились на рассылку.",
            },
            {
              title: "Сколько храним",
              text: "Заявки — 12 месяцев, договоры и акты — по срокам бухгалтерского учёта, списки посетителей события — до закрытия отчёта.",
            },
            {
              title: "Кому передаём",
              text: "Подрядчикам события (застройка, регистрация, кейтеринг) только в объёме, необходимом для услуги. Продажей баз не занимаемся.",
            },
            {
              title: "Cookies и аналитика",
              text: "Статический сайт использует только технические cookies формы и не подключает рекламные трекеры.",
            },
            {
              title: "Ваши права",
              text: "Просмотреть, исправить или удалить данные, отозвать согласие на рассылку — письмом на info@sofexpo.uz с темой «Data request».",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Оператор обработки — ООО «RESOF EXPO», Самаркандская область, Джамбайский район. Ответ на обращение по персональным данным даём в течение 10 рабочих дней.",
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Legal",
          title: "Privacy policy",
          lead: "We collect the minimum needed to handle your request. Below is what, why and how to delete it.",
          image: "/images/hero-hall.jpg",
          imageAlt: "Centre hall",
        },
        {
          type: "rows",
          items: [
            {
              title: "What we collect",
              text: "Name, company, role, phone, e-mail and the message from booking and registration forms; technical request data for spam protection.",
            },
            {
              title: "Why",
              text: "To process the request, conclude and perform a participation contract, issue a ticket and badge, and inform you about the next date if you opted in.",
            },
            {
              title: "Retention",
              text: "Requests — 12 months; contracts and acts — accounting retention; event visitor lists until the report is closed.",
            },
            {
              title: "Who sees it",
              text: "Event contractors (build, registration, catering) only within what the service requires. We never sell databases.",
            },
            {
              title: "Cookies and analytics",
              text: "The static site uses only form technical cookies and loads no advertising trackers.",
            },
            {
              title: "Your rights",
              text: 'View, correct or delete data and withdraw marketing consent by writing to info@sofexpo.uz with the subject "Data request".',
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "The data controller is LLC «RESOF EXPO», Dzhambay district, Samarkand region. We answer personal data requests within 10 working days.",
          ],
        },
      ],
    },
  },
  {
    path: "/legal/terms/",
    meta: {
      ru: {
        title: "Пользовательское соглашение",
        description:
          "Условия использования сайта SOF EXPO: материалы и права, точность информации о выставках, обработка заявок, ограничение ответственности, правила бронирования площади.",
      },
      en: {
        title: "Terms of use — SOF EXPO Samarkand",
        description:
          "Conditions for using the SOF EXPO website: content and rights, accuracy of exhibition information, request handling, liability limits, floor booking rules.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Правовая информация",
          title: "Пользовательское соглашение",
          lead: "Коротко: сайт информационный, заявки не являются офертой, материалы принадлежат нам или партнёрам. Подробно — ниже.",
          actions: [{ label: "Задать вопрос юристу", href: "/contacts/" }],
        },
        {
          type: "rows",
          items: [
            {
              title: "Статус информации",
              text: "Даты, площади, пакеты и цены на сайте — справочные. Обязывающими становятся документы, подписанные сторонами: заявка, договор, приложение, спецификация.",
            },
            {
              title: "Интеллектуальные права",
              text: "Тексты, фотографии, логотипы и каталоги принадлежат ООО «RESOF EXPO» или правообладателям-партнёрам. Цитирование — с активной ссылкой на источник, печать в материалах выставки — по согласованию.",
            },
            {
              title: "Ответственность",
              text: "Мы отвечаем за неисполнение услуг по договору, если это произошло по нашей вине. За данные участников и их предложения ответственность несут экспоненты.",
            },
            {
              title: "Отказы и изменения",
              text: "Мы оставляем право перенести или отменить событие по обстоятельствам непреодолимой силы, а также изменить состав разделов, уведомив участников.",
            },
            {
              title: "Регистрация посетителей",
              text: "Данные, указанные при регистрации, проверяются на принадлежность к отрасли. Вход может быть ограничен для лиц младше 14 лет без сопровождения.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Споры решаются переговорами; при недостижении согласия — в суде по месту нахождения оператора. Язык переписки и договоров — узбекский, русский или английский по выбору стороны.",
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Legal",
          title: "Terms of use",
          lead: "In short: the site is informational, requests are not an offer, content belongs to us or our partners. Details below.",
          actions: [{ label: "Ask a legal question", href: "/contacts/" }],
        },
        {
          type: "rows",
          items: [
            {
              title: "Status of information",
              text: "Dates, areas, packages and prices here are for reference. Binding documents are what the parties sign: request, contract, appendix, specification.",
            },
            {
              title: "Intellectual property",
              text: "Texts, photographs, logos and catalogues belong to LLC «RESOF EXPO» or partner rights holders. Quoting requires an active link; print use in show materials is by agreement.",
            },
            {
              title: "Liability",
              text: "We are liable for non-performance of contracted services when it is our fault. Exhibitor data and their offers are the exhibitor's responsibility.",
            },
            {
              title: "Changes and cancellation",
              text: "We may move or cancel an event due to force majeure and may change the section composition, notifying participants.",
            },
            {
              title: "Visitor registration",
              text: "Registration data is checked for trade eligibility. Entry may be restricted for under-14s without an adult.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Disputes are settled by negotiation, otherwise in the court at the operator's location. Correspondence and contracts may run in Uzbek, Russian or English at the party's choice.",
          ],
        },
      ],
    },
  },
];
