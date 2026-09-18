import type { PageDef } from "./types";

export const visitorPages: PageDef[] = [
  {
    path: "/visitors/",
    meta: {
      ru: {
        title:
          "Посетителям выставок SOF EXPO Samarkand — билеты, программа, что смотреть",
        description:
          "Как посетить выставку в Самарканде: регистрация для специалистов, электронные билеты, программа, маршруты по разделам и где поесть.",
      },
      en: {
        title:
          "For visitors of SOF EXPO Samarkand — tickets, programme, what to see",
        description:
          "How to attend a show in Samarkand: trade registration, e-tickets, the programme schedule, section routes and catering.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Посетителям",
          title: "Прийти на три часа и уйти с решениями",
          lead: "Отраслевые выставки в центре бесплатны для профильных специалистов по предварительной регистрации: вы получаете электронный билет и сразу — маршрут по нужным разделам. Фестивальные форматы (авто, образование) работают по билету.",
          bullets: [
            "Электронный билет по регистрации",
            "Программа и карта разделов заранее",
            "Парковка и кафе на территории",
          ],
          actions: [
            { label: "Зарегистрироваться", href: "/visitors/tickets/" },
            { label: "Программа выставок", href: "/visitors/programme/" },
          ],
          image: "/images/event-worldedu.jpg",
          imageAlt: "Посетители образовательной выставки",
        },
        {
          type: "grid",
          cols: 4,
          items: [
            {
              icon: "ticket",
              title: "1. Выберите выставку",
              text: "Даты и формат — в афише. Если задача — найти поставщика, идите на отраслевое событие, а не на потребительское.",
            },
            {
              icon: "check",
              title: "2. Зарегистрируйтесь",
              text: "Имя, компания, роль и телефон. Регистрация занимает минуту и превращается в QR-билет.",
            },
            {
              icon: "calendar",
              title: "3. Составьте список",
              text: "За две недели до старта пришлём перечень участников: отметьте 8–12 стендов и напишите им заранее.",
            },
            {
              icon: "handshake",
              title: "4. Приезжайте с вопросом",
              text: "Цены, сроки, условия дилерства, документы. С вопросом вы получаете ответ, с «просто посмотреть» — буклет.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Что вы получаете",
          title: "Четыре причины потратить утро на выставку",
        },
        {
          type: "rows",
          items: [
            {
              title: "Сравнить поставщиков за один заход",
              text: "Вместо месяца писем: 10–15 компаний раздела в одном зале, с образцами и возможностью потрогать.",
            },
            {
              title: "Понять цены рынка",
              text: "На выставках озвучивают диапазоны, акции сезона и условия для дилеров — то, что в прайсе на сайте не найдёте.",
            },
            {
              title: "Увидеть новинки раньше каталогов",
              text: "Презентации на сцене и живые демо: техника, материалы, упаковка, сервисы.",
            },
            {
              title: "Получить контакты для тендера",
              text: "У закупщиков сетей и девелоперов выставка — способ собрать альтернативных поставщиков за один день.",
            },
          ],
        },
        {
          type: "callout",
          kicker: "Практика",
          title: "Планируйте два дня из трёх",
          text: "Первый день — экспозиция и переговоры, второй — деловая программа и доклады. Вечер третьего дня обычно пустой: демонтаж.",
          action: { label: "Смотреть афишу", href: "/events/" },
        },
        {
          type: "links",
          items: [
            { label: "Билеты и регистрация", href: "/visitors/tickets/" },
            { label: "Проезд, отели, визы", href: "/visitors/travel/" },
            { label: "Деловая программа", href: "/visitors/programme/" },
            { label: "Доступная среда и дети", href: "/visitors/access/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "For visitors",
          title: "Come for three hours, leave with decisions",
          lead: "Trade shows at the centre are free for professionals with pre-registration: you get an e-ticket and, right away, a route through the sections you need. Festival formats (automotive, education) are ticketed.",
          bullets: [
            "E-ticket after registration",
            "Programme and section map in advance",
            "Parking and cafés on site",
          ],
          actions: [
            { label: "Register", href: "/visitors/tickets/" },
            { label: "Show programmes", href: "/visitors/programme/" },
          ],
          image: "/images/event-worldedu.jpg",
          imageAlt: "Visitors at an education exhibition",
        },
        {
          type: "grid",
          cols: 4,
          items: [
            {
              icon: "ticket",
              title: "1. Pick the show",
              text: "Dates and format are in the line-up. If the goal is to find a supplier, go to the trade event, not the consumer one.",
            },
            {
              icon: "check",
              title: "2. Register",
              text: "Name, company, role, phone. One minute, and you have a QR ticket.",
            },
            {
              icon: "calendar",
              title: "3. Build a list",
              text: "Two weeks ahead we send the exhibitor list: tick 8–12 stands and write to them before the opening.",
            },
            {
              icon: "handshake",
              title: "4. Arrive with a question",
              text: 'Prices, lead times, dealer terms, documents. A question gets an answer; "just looking" gets a leaflet.',
            },
          ],
        },
        {
          type: "h2",
          kicker: "What you get",
          title: "Four reasons to spend a morning at a show",
        },
        {
          type: "rows",
          items: [
            {
              title: "Compare suppliers in one go",
              text: "Instead of a month of emails: 10–15 companies of your section in one hall, with samples you can touch.",
            },
            {
              title: "Learn real market prices",
              text: "At shows people say the ranges, seasonal promotions and dealer terms out loud — you will not find that on a website.",
            },
            {
              title: "See new products before catalogues",
              text: "Stage presentations and live demos: machinery, materials, packaging, services.",
            },
            {
              title: "Collect contacts for a tender",
              text: "For chain and developer buyers, a show is the way to gather alternative suppliers in one day.",
            },
          ],
        },
        {
          type: "callout",
          kicker: "Practice",
          title: "Plan for two of the three days",
          text: "Day one: expo and negotiations. Day two: the business programme. The third evening is mostly dismantle.",
          action: { label: "See the line-up", href: "/events/" },
        },
        {
          type: "links",
          items: [
            { label: "Tickets and registration", href: "/visitors/tickets/" },
            { label: "Travel, hotels, visas", href: "/visitors/travel/" },
            { label: "Business programme", href: "/visitors/programme/" },
            { label: "Accessibility and children", href: "/visitors/access/" },
          ],
        },
      ],
    },
  },
  {
    path: "/visitors/tickets/",
    meta: {
      ru: {
        title: "Билеты и регистрация на выставки в Самарканде",
        description:
          "Как получить электронный билет: онлайн-регистрация для специалистов, продажа билетов на фестивальные форматы через Ticketon.uz, вход для групп, льготы и правила посещения.",
      },
      en: {
        title: "Tickets and registration for exhibitions in Samarkand",
        description:
          "How to get an e-ticket: online registration for trade visitors, Ticketon.uz sales for festival formats, group entry, benefits and visiting rules.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Билеты",
          title: "Регистрация вместо очереди на входе",
          lead: "Для отраслевых выставок вход бесплатный по предварительной регистрации — она же даёт доступ к программе и списку участников. Потребительские и фестивальные форматы продаются по билету.",
          actions: [
            { label: "Заявка на регистрацию", href: "/contacts/" },
            { label: "Билеты PROMOTORS", href: "https://ticketon.uz" },
          ],
          image: "/images/event-promotors.jpg",
          imageAlt: "Фестивальная аудитория",
        },
        {
          type: "table",
          head: ["Выставка", "Вход", "Как получить", "Особенности"],
          rows: [
            [
              "FOODERA EXPO",
              "бесплатно для специалистов",
              "онлайн-регистрация",
              "дегустации — по записи на стенде",
            ],
            [
              "BUILD PRO EXPO",
              "бесплатно для специалистов",
              "онлайн-регистрация, списки от компаний",
              "доступ на демо-площадку по бейджу",
            ],
            [
              "AGROPRO EXPO",
              "бесплатно для специалистов",
              "регистрация, групповые заявки",
              "для фермерских хозяйств — трансфер по договорённости",
            ],
            [
              "PROMOTORS SHOW",
              "по билету",
              "Ticketon.uz",
              "билет включает шоу-программу и маркет",
            ],
            [
              "WORLD EDU",
              "бесплатно",
              "регистрация посетителя",
              "розыгрыш призов среди зарегистрированных",
            ],
            [
              "ECOM & RETAIL EXPO",
              "по регистрации",
              "форма участника форума",
              "деловые встречи — по предварительному отбору",
            ],
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Правила посещения",
              text: "Проход в зал — по электронному билету или бейджу. С собой: паспорт или документ компании для верификации специалиста. Въезд транспорта на открытую часть — только по списку.",
            },
            {
              title: "Группы и делегации",
              text: "Организованные группы от 10 человек регистрируются списком: отдельный вход, координатор, экскурсия по разделам. Заявка за 5 рабочих дней.",
            },
            {
              title: "Пропуск на деловые сессии",
              text: "Места в конференц-зале резервируются во время регистрации — их ограниченное количество, поэтому регистрируйтесь заранее.",
            },
            {
              title: "Фото и съёмка",
              text: "Личная фотография — свободно. Профессиональная съёмка и трансляция — по аккредитации прессы.",
            },
          ],
        },
        {
          type: "faq",
          items: [
            {
              q: "Можно ли купить билет на месте?",
              a: "Да, на кассе при наличии мест; на отраслевые выставки регистрация на кассе тоже бесплатна, но займёт 10–15 минут вместо одной минуты онлайн.",
            },
            {
              q: "Что делать, если не пришло письмо с билетом?",
              a: "Проверьте спам и напишите на info@sofexpo.org — восстановим по телефону, указанному при регистрации.",
            },
            {
              q: "Есть ли льготы для студентов и педагогов?",
              a: "На образовательных выставках — свободный вход и отдельная программа; на профильных отраслевых событиях студенты профильных специальностей проходят по письму от учебного заведения.",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Tickets",
          title: "Registration instead of a queue at the door",
          lead: "Trade shows are free for professionals with pre-registration, which also unlocks the programme and the exhibitor list. Consumer and festival formats are ticketed.",
          actions: [
            { label: "Request registration", href: "/contacts/" },
            { label: "PROMOTORS tickets", href: "https://ticketon.uz" },
          ],
          image: "/images/event-promotors.jpg",
          imageAlt: "Festival audience",
        },
        {
          type: "table",
          head: ["Show", "Entry", "How to get it", "Notes"],
          rows: [
            [
              "FOODERA EXPO",
              "free for trade visitors",
              "online registration",
              "tastings by appointment at the stand",
            ],
            [
              "BUILD PRO EXPO",
              "free for trade visitors",
              "registration, company lists",
              "demo area access with a badge",
            ],
            [
              "AGROPRO EXPO",
              "free for trade visitors",
              "registration, group requests",
              "farm transfers arranged on request",
            ],
            [
              "PROMOTORS SHOW",
              "ticketed",
              "Ticketon.uz",
              "ticket includes show programme and market",
            ],
            [
              "WORLD EDU",
              "free",
              "visitor registration",
              "prize draw among registered visitors",
            ],
            [
              "ECOM & RETAIL EXPO",
              "by registration",
              "forum participant form",
              "business meetings after screening",
            ],
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Visiting rules",
              text: "Entry by e-ticket or badge. Bring an ID or a company document for trade verification. Vehicle access to the open area is by approved list only.",
            },
            {
              title: "Groups and delegations",
              text: "Organized groups of 10+ register by list: separate entrance, coordinator and a guided route. Apply five working days ahead.",
            },
            {
              title: "Seats at business sessions",
              text: "Conference hall seats are reserved during registration and are limited, so register early.",
            },
            {
              title: "Photography",
              text: "Personal photos are welcome. Professional shooting and streaming require press accreditation.",
            },
          ],
        },
        {
          type: "faq",
          items: [
            {
              q: "Can I buy a ticket at the door?",
              a: "Yes, if seats remain. Trade registration at the desk is also free but takes 10–15 minutes instead of one online.",
            },
            {
              q: "I did not receive the e-ticket email",
              a: "Check spam and write to info@sofexpo.org — we restore it from the phone number used at registration.",
            },
            {
              q: "Are there discounts for students and teachers?",
              a: "Education shows are free with a dedicated programme; at industry events, students of relevant majors enter with a letter from their institution.",
            },
          ],
        },
      ],
    },
  },
  {
    path: "/visitors/travel/",
    meta: {
      ru: {
        title: "Проезд, отели и виза: как приехать на выставку в Самарканд",
        description:
          "Маршрут из Ташкента и из-за рубежа, скоростные поезда, аэропорт Самарканда, трансфер, отели для участников — скидка 15% в Reikartz для партнёров SOF EXPO, правила въезда в Узбекистан.",
      },
      en: {
        title: "Travel, hotels and visas: coming to an exhibition in Samarkand",
        description:
          "Routes from Tashkent and abroad, high-speed trains, Samarkand airport, transfers, participant hotels — 15% Reikartz discount for SOF EXPO partners, entry rules for Uzbekistan.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Поездка",
          title: "Самарканд — 1 час 40 минут от Ташкента",
          lead: "Города-миллионники Центральной Азии и крупные хабы России и Турции соединены прямыми рейсами и поездами. Экспоцентр находится в 16 км от аэропорта — это 20 минут на машине без транзита через город.",
          image: "/images/samarkand.jpg",
          imageAlt: "Самарканд",
          actions: [
            { label: "Заказать трансфер", href: "/contacts/" },
            {
              label: "Как добраться до центра",
              href: "/venue/how-to-get-there/",
            },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "plane",
              title: "Самолёт",
              text: "Аэропорт Самарканда (SKD) принимает рейсы из Ташкента, Стамбула, Дубая и Москвы. Альтернатива — Ташкент (TAS) + скоростной поезд.",
            },
            {
              icon: "train",
              title: "Поезд",
              text: "Afrosiyob и Sharq: Ташкент — Самарканд около 1 ч 40 мин. Билеты покупаются за 2–3 недели до даты.",
            },
            {
              icon: "car",
              title: "Авто",
              text: "Трасса М39 из Ташкента, 4–5 часов без скоростного поезда; из Бухары — 3 часа. Парковка на площадке центра бесплатна.",
            },
            {
              icon: "seat",
              title: "Отели",
              text: "Reikartz для партнёров и участников SOF EXPO даёт скидку 15% — назовите код выставки при бронировании.",
            },
            {
              icon: "globe",
              title: "Виза",
              text: "Для граждан 90+ стран действует безвизовый или упрощённый режим; для ряда стран — e-visa за 2 рабочих дня.",
            },
            {
              icon: "phone",
              title: "Связь",
              text: "Локальная SIM у оператора Uzmobile/Beeline в аэропорту; Wi-Fi есть во всём выставочном центре.",
            },
          ],
        },
        {
          type: "table",
          head: ["Откуда", "Как ехать", "Время", "Ориентир по бюджету"],
          rows: [
            [
              "Ташкент",
              "скоростной поезд",
              "1 ч 40 мин",
              "билет бизнес-класса дороже обычного в 2–3 раза",
            ],
            ["Ташкент", "авто", "4–5 ч", "такси или трансфер делегации"],
            ["Бухара", "поезд или авто", "1,5–3 ч", "поезд дешевле"],
            ["Стамбул", "прямой рейс", "~5 ч", "билет зависит от сезона"],
            [
              "Москва",
              "рейс через Ташкент или прямой",
              "4–6 ч",
              "покупать за 3–6 недель",
            ],
            ["Алматы", "рейс", "~2 ч", "прямые рейсы сезонные"],
          ],
        },
        {
          type: "callout",
          kicker: "Два дня вместо одного",
          text: "Если у вас встреча с сетью или переговоры с дистрибьютором, планируйте два дня: один на экспозицию, второй на объекты и склады. Мы поможем со встречами на выезде.",
          title: "Совместите выставку с визитом на объект",
          action: { label: "Составить маршрут визита", href: "/contacts/" },
        },
        {
          type: "links",
          items: [
            {
              label: "Как добраться до центра",
              href: "/venue/how-to-get-there/",
            },
            { label: "Правила посещения", href: "/visitors/tickets/" },
            { label: "Экспоцентр", href: "/venue/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Travel",
          title: "Samarkand is 1 h 40 min from Tashkent",
          lead: "Central Asian cities and major Russian and Turkish hubs connect by direct flights and trains. The centre is 16 km from the airport — 20 minutes by car without crossing the city.",
          image: "/images/samarkand.jpg",
          imageAlt: "Samarkand",
          actions: [
            { label: "Book a transfer", href: "/contacts/" },
            { label: "Getting to the venue", href: "/venue/how-to-get-there/" },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "plane",
              title: "By air",
              text: "Samarkand (SKD) takes flights from Tashkent, Istanbul, Dubai and Moscow. Alternative: Tashkent (TAS) plus the high-speed train.",
            },
            {
              icon: "train",
              title: "By rail",
              text: "Afrosiyob and Sharq: Tashkent to Samarkand in about 1 h 40 min. Buy tickets 2–3 weeks ahead.",
            },
            {
              icon: "car",
              title: "By road",
              text: "Highway M39 from Tashkent, 4–5 hours; 3 hours from Bukhara. Parking at the centre is free.",
            },
            {
              icon: "seat",
              title: "Hotels",
              text: "Reikartz gives SOF EXPO participants and partners 15% off — mention the exhibition code at booking.",
            },
            {
              icon: "globe",
              title: "Visa",
              text: "Visa-free or simplified entry applies to citizens of 90+ countries; several nationalities use an e-visa issued in two working days.",
            },
            {
              icon: "phone",
              title: "Connectivity",
              text: "A local SIM at the airport; Wi-Fi covers the whole exhibition centre.",
            },
          ],
        },
        {
          type: "table",
          head: ["From", "Route", "Time", "Budget note"],
          rows: [
            [
              "Tashkent",
              "high-speed train",
              "1 h 40 min",
              "business class costs 2–3× the standard seat",
            ],
            ["Tashkent", "road", "4–5 h", "taxi or a delegation transfer"],
            ["Bukhara", "train or road", "1.5–3 h", "train is cheaper"],
            ["Istanbul", "direct flight", "~5 h", "fare depends on season"],
            [
              "Moscow",
              "direct or via Tashkent",
              "4–6 h",
              "buy 3–6 weeks ahead",
            ],
            ["Almaty", "flight", "~2 h", "direct flights are seasonal"],
          ],
        },
        {
          type: "callout",
          kicker: "Two days instead of one",
          text: "If you have a chain meeting or distributor negotiations, plan two days: one for the expo, one for sites and warehouses. We arrange off-site visits.",
          title: "Combine the show with a site visit",
          action: { label: "Plan a visit route", href: "/contacts/" },
        },
        {
          type: "links",
          items: [
            { label: "Getting to the venue", href: "/venue/how-to-get-there/" },
            { label: "Visiting rules", href: "/visitors/tickets/" },
            { label: "The centre", href: "/venue/" },
          ],
        },
      ],
    },
  },
  {
    path: "/visitors/programme/",
    meta: {
      ru: {
        title: "Деловая программа выставок: форумы, сессии, мастер-классы",
        description:
          "Конференции и форумы в рамках FOODERA, BUILD PRO, AGROPRO, ECOM & RETAIL и WORLD EDU: форматы сессий, спикеры, как попасть, расписание и архив записей.",
      },
      en: {
        title: "Business programme: forums, sessions and masterclasses",
        description:
          "Conferences within FOODERA, BUILD PRO, AGROPRO, ECOM & RETAIL and WORLD EDU: session formats, speakers, how to attend, schedule and recording archive.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Программа",
          title: "Сессии, которые экономят месяц переписки",
          lead: "Деловая программа идёт параллельно с экспозицией: сцена в зале и конференц-зал. Вход на доклады включён в билет посетителя, на закрытые сессии — по списку.",
          image: "/images/venue-conference.jpg",
          imageAlt: "Конференц-зал во время форума",
          actions: [
            { label: "Предложить спикера", href: "/contacts/" },
            { label: "Заказать сессию", href: "/organizers/conferences/" },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "chart",
              title: "Отраслевой форум",
              text: "Рынок, цены, регуляторика, логистика: 60–90 минут с модератором и вопросами из зала.",
            },
            {
              icon: "handshake",
              title: "Биржа контактов",
              text: "Pre-matched встречи по 15 минут: вы указываете, с кем хотите говорить, мы договариваемся.",
            },
            {
              icon: "sparkle",
              title: "Презентация новинки",
              text: "20 минут на сцене для запуска продукта перед закупщиками раздела.",
            },
            {
              icon: "mic",
              title: "Мастер-класс",
              text: "Практика на площадке: монтаж, обработка, дегустация, работа с карточкой товара.",
            },
            {
              icon: "users",
              title: "Круглый стол",
              text: "Узкий формат на 20–40 человек для переговоров с участием регулятора или ассоциации.",
            },
            {
              icon: "award",
              title: "Конкурс продуктов",
              text: "Экспертное жюри, номинации, награждение в первый день выставки.",
            },
          ],
        },
        {
          type: "table",
          head: ["Выставка", "Что в программе", "Длительность", "Как попасть"],
          rows: [
            [
              "FOODERA EXPO",
              "форум Food Retail, дегустационные сессии, конкурс «Лучший продукт»",
              "1–2 часа",
              "по билету посетителя",
            ],
            [
              "BUILD PRO EXPO",
              "форум архитекторов, 10+ сессий о материалах и световых решениях",
              "45–90 мин",
              "регистрация на сессию",
            ],
            [
              "AGROPRO EXPO",
              "орошение, агрохимия, лизинг и господдержка, ярмарка вакансий АПК",
              "1 час",
              "по билету",
            ],
            [
              "ECOM & RETAIL EXPO",
              "треки маркетплейсов, логистики, финтеха, биржа контактов",
              "2 дня",
              "заявка участника форума",
            ],
            [
              "WORLD EDU",
              "презентации вузов, профориентация, тестирование IELTS/GMAT/SAT",
              "30 мин блоки",
              "свободно",
            ],
            [
              "PROMOTORS SHOW",
              "питч-сессии брендов, награждение, мастер-классы по детейлингу",
              "15–30 мин",
              "по билету фестиваля",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Регистрируйтесь на сессию заранее — мест в зале меньше, чем желающих.",
            "После доклада подойдите к спикеру: это самый короткий путь к контакту.",
            "Записи выступлений публикуются в канале выставки в течение недели.",
            "Хотите выступить — пришлите тему и биографию, редактор программы ответит за 2 дня.",
          ],
        },
        {
          type: "links",
          items: [
            { label: "Афиша выставок", href: "/events/" },
            {
              label: "Конференц-услуги для организаторов",
              href: "/organizers/conferences/",
            },
            {
              label: "Стать спонсором сессии",
              href: "/exhibitors/sponsorship/",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Programme",
          title: "Sessions that save you a month of email",
          lead: "The business programme runs alongside the expo: a stage in the hall and a conference hall. Talks are included in the visitor ticket; closed sessions are on a list.",
          image: "/images/venue-conference.jpg",
          imageAlt: "Conference during a forum",
          actions: [
            { label: "Propose a speaker", href: "/contacts/" },
            { label: "Order a session", href: "/organizers/conferences/" },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "chart",
              title: "Industry forum",
              text: "Market, prices, regulation, logistics: 60–90 minutes with a moderator and questions from the floor.",
            },
            {
              icon: "handshake",
              title: "Contact exchange",
              text: "Pre-matched 15-minute meetings: you name who you want to talk to, we arrange it.",
            },
            {
              icon: "sparkle",
              title: "Product launch",
              text: "Twenty minutes on stage in front of the section buyers.",
            },
            {
              icon: "mic",
              title: "Masterclass",
              text: "Hands-on practice: installation, processing, tasting, product-card work.",
            },
            {
              icon: "users",
              title: "Round table",
              text: "A tight 20–40 person format with a regulator or association present.",
            },
            {
              icon: "award",
              title: "Product contest",
              text: "Expert jury, nominations and awards on opening day.",
            },
          ],
        },
        {
          type: "table",
          head: ["Show", "Programme", "Length", "Access"],
          rows: [
            [
              "FOODERA EXPO",
              "Food Retail forum, tasting sessions, Best Product contest",
              "1–2 h",
              "with visitor ticket",
            ],
            [
              "BUILD PRO EXPO",
              "architects forum, 10+ sessions on materials and lighting",
              "45–90 min",
              "session registration",
            ],
            [
              "AGROPRO EXPO",
              "irrigation, agrochemistry, leasing and subsidies, agri careers fair",
              "1 h",
              "with ticket",
            ],
            [
              "ECOM & RETAIL EXPO",
              "marketplace, logistics and fintech tracks, matchmaking",
              "2 days",
              "forum participant form",
            ],
            [
              "WORLD EDU",
              "university presentations, career guidance, IELTS/GMAT/SAT testing",
              "30 min blocks",
              "open",
            ],
            [
              "PROMOTORS SHOW",
              "brand pitches, awards, detailing masterclasses",
              "15–30 min",
              "with festival ticket",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Register for a session early — the hall holds fewer people than the queue.",
            "Approach the speaker after the talk: the shortest route to a contact.",
            "Recordings are published in the show channel within a week.",
            "Want to speak? Send a topic and a bio; the programme editor replies in two days.",
          ],
        },
        {
          type: "links",
          items: [
            { label: "Exhibition line-up", href: "/events/" },
            {
              label: "Conference services for organizers",
              href: "/organizers/conferences/",
            },
            { label: "Sponsor a session", href: "/exhibitors/sponsorship/" },
          ],
        },
      ],
    },
  },
  {
    path: "/visitors/access/",
    meta: {
      ru: {
        title: "Доступная среда, дети и групповой визит на выставку",
        description:
          "Безбарьерный доступ в зал, парковка, навигация, условия для посетителей с инвалидностью, сопровождение, правила для детей и организованных групп.",
      },
      en: {
        title: "Accessibility, children and group visits",
        description:
          "Step-free hall access, parking, wayfinding, conditions for visitors with disabilities, assistance, rules for children and organized groups.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Доступность",
          title: "В зал заходит каждый",
          lead: "Площадка одноуровневая: вход без ступеней, широкие проходы между стендами, места для отдыха и доступный санитарный блок. Сообщите о визите заранее — подготовим сопровождение.",
          actions: [{ label: "Запросить помощь", href: "/contacts/" }],
          image: "/images/hero-hall.jpg",
          imageAlt: "Экспозиционный зал",
        },
        {
          type: "checklist",
          items: [
            "Вход в зал — без ступеней, с пандусом у главного входа.",
            "Проходы между стендами — от 3 метров: проезжает кресло-коляска.",
            "Парковочные места у входа — с увеличенным карманом.",
            "Зоны отдыха вдоль маршрута, вода и кафе на 350 мест.",
            "Сопровождение по экспозиции — по заявке за 2 дня, бесплатно.",
            "Собаки-поводыри допускаются в зал.",
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "users",
              title: "Дети на отраслевой выставке",
              text: "До 14 лет — со взрослым; на выставках с шоу-программой (PROMOTORS, WORLD EDU) — отдельная зона и регламент.",
            },
            {
              icon: "building",
              title: "Школьные и студенческие группы",
              text: "Заявка списком, отдельный вход, маршрут по экспозиции и профориентационная сессия.",
            },
            {
              icon: "handshake",
              title: "Делегации предприятий",
              text: "Координатор, регистрация без очереди, резерв мест на деловых сессиях.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Если вашему визиту нужна особая подготовка — сурдоперевод, тактильные материалы, отдельное время для обзора, — напишите нам. Мы делаем это не «по регламенту», а по запросу: такие визиты планируем отдельно.",
            "Для групп от 10 человек доступен трансфер от вокзала или аэропорта по согласованной цене.",
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Access",
          title: "Everyone gets into the hall",
          lead: "The venue is single-level: step-free entrance, wide aisles between stands, seating areas and an accessible sanitary block. Tell us before you come and we prepare assistance.",
          actions: [{ label: "Request assistance", href: "/contacts/" }],
          image: "/images/hero-hall.jpg",
          imageAlt: "Exhibition hall",
        },
        {
          type: "checklist",
          items: [
            "Step-free hall entrance with a ramp at the main door.",
            "Aisles of at least three metres — a wheelchair passes.",
            "Parking bays at the entrance with extra side space.",
            "Rest points along the route, water and cafés for 350 seats.",
            "Guided assistance through the expo — free, booked two days ahead.",
            "Assistance dogs are welcome in the hall.",
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "users",
              title: "Children at trade shows",
              text: "Under 14 with an adult; at shows with a stage programme (PROMOTORS, WORLD EDU) there is a separate area and rules.",
            },
            {
              icon: "building",
              title: "School and student groups",
              text: "List application, separate entrance, guided route and a career guidance session.",
            },
            {
              icon: "handshake",
              title: "Company delegations",
              text: "Coordinator, fast-track registration, reserved seats at business sessions.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "If your visit needs special preparation — sign language interpreting, tactile material, a private viewing slot — write to us. We arrange these individually, not by regulation.",
            "Groups of 10+ can book a transfer from the station or airport at an agreed rate.",
          ],
        },
      ],
    },
  },
];
