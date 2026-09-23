/**
 * Single source of truth for organisation, venue and contact data.
 * Facts come from the official SOF EXPO Samarkand materials (sofexpo.uz).
 * Anything that must be re-confirmed with the client is marked `needsVerification: true`.
 */

export const site = {
  domain: "https://sofexpo.org",
  brand: {
    ru: "SOF EXPO SAMARKAND",
    en: "SOF EXPO SAMARKAND",
    legal: "ООО «RESOF EXPO»",
    legalEn: "Resof Expo LLC",
  },
  tagline: {
    ru: "Выставочно-конгрессный центр в Самарканде: собственные отраслевые выставки и площадка для ваших событий.",
    en: "An exhibition and congress centre in Samarkand: our own trade shows and a venue for your events.",
  },
  contacts: {
    phoneMain: "+998 55 705 0 705",
    phoneManager: "+998 88 399 07 05",
    email: "info@sofexpo.uz",
    telegramManager: "https://t.me/sofexpomgr",
    telegramChannel: "https://t.me/sofexpo",
    instagram: "https://www.instagram.com/sofexpo.uz/",
    facebook: "https://www.facebook.com/sofexpo.uz",
    youtube: "https://www.youtube.com/channel/UCNPRKCh6okafi4EBLR2LvKg",
    tiktok: "",
    mapQuery: "SOF EXPO Samarkand",
    hours: {
      ru: "Пн–Пт 09:00–18:00, сб по договорённости",
      en: "Mon–Fri 09:00–18:00, Sat on request",
    },
    timezone: "Asia/Samarkand (UTC+5)",
  },
  location: {
    city: { ru: "Самарканд", en: "Samarkand" },
    region: {
      ru: "Самаркандская область, Джамбайский район",
      en: "Samarkand region, Dzhambay district",
    },
    country: { ru: "Узбекистан", en: "Uzbekistan" },
    isoCountry: "UZ",
    lat: 39.6542,
    lng: 66.9597,
    needsVerification: true,
    airport: {
      ru: "16 км от аэропорта Самарканда",
      en: "16 km from Samarkand International Airport",
    },
    station: {
      ru: "23 км от железнодорожного вокзала",
      en: "23 km from the railway station",
    },
  },
  venue: {
    indoorM2: 4400,
    outdoorM2: 5000,
    eventsPerYear: 20,
    visitorsTotal: 70000,
    powerKW: 700,
    voltage: "220 / 380 V",
    cafeSeats: 350,
    floorLoad: { ru: "уточняется", en: "on request", needsVerification: true },
    ceiling: { ru: "уточняется", en: "on request", needsVerification: true },
    halls: [
      {
        id: "main-hall",
        area: "4 400 м² / 4,400 m²",
        ru: {
          name: "Главный выставочный зал",
          text: "Крытая экспозиционная площадка с системой охлаждения, обогрева и вентиляции, акустической системой и свободной планировкой под любую сетку стендов.",
          specs: [
            "Климат-контроль",
            "Фоновая аудиосистема",
            "Свободная планировка",
            "Естественный свет",
          ],
        },
        en: {
          name: "Main exhibition hall",
          text: "An indoor exhibition space with cooling, heating and ventilation, a background audio system and an open floor plan that takes any stand grid.",
          specs: [
            "Climate control",
            "Background audio",
            "Open plan",
            "Daylight",
          ],
        },
      },
      {
        id: "open-area",
        area: "5 000 м² / 5,000 m²",
        ru: {
          name: "Открытая площадка",
          text: "Уличные экспозиции, тест-драйвы, тяжёлая техника, сцены для фестивалей и концертные форматы. Подъезд фурами и крановая техника.",
          specs: [
            "Тяжёлая техника",
            "Сцена и звук",
            "Подъезд фур",
            "Параллельно с залом",
          ],
        },
        en: {
          name: "Open-air area",
          text: "Outdoor expo, test drives, heavy machinery, festival stages. Truck access and crane handling available.",
          specs: [
            "Heavy machinery",
            "Stage and sound",
            "Truck access",
            "Runs alongside the hall",
          ],
        },
      },
      {
        id: "conference-hall",
        area: "до 350 мест / up to 350 seats",
        ru: {
          name: "Конференц-зал",
          text: "Зал для деловой программы, оснащённый аудио- и видеосистемами, проекцией и синхронным переводом по запросу.",
          specs: [
            "Проекция и экран",
            "Микрофоны и радиосистемы",
            "Перевод по запросу",
            "Онлайн-трансляция",
          ],
        },
        en: {
          name: "Conference hall",
          text: "A business-programme hall with audio and video systems, projection and simultaneous interpretation on request.",
          specs: [
            "Projection and screen",
            "Microphones and radio mics",
            "Interpretation on request",
            "Live stream",
          ],
        },
      },
      {
        id: "cafe",
        area: "2 зала / 350 мест",
        ru: {
          name: "Кафе на территории",
          text: "Два кафе быстрого питания общей вместимостью 350 человек — обед без очереди и без потери делового времени.",
          specs: [
            "350 мест",
            "Быстрое обслуживание",
            "Кофе-брейки для делегаций",
            "Кейтеринг по меню",
          ],
        },
        en: {
          name: "On-site cafés",
          text: "Two quick-service cafés seating 350 in total — lunch without queues and without losing business time.",
          specs: [
            "350 seats",
            "Fast service",
            "Coffee breaks for delegations",
            "Menu catering",
          ],
        },
      },
      {
        id: "parking",
        area: "бесплатно / free",
        ru: {
          name: "Автостоянка",
          text: "Большая парковка при въезде в экспоцентр с удобным подъездом — для делегаций, автобусов и разгрузочной техники.",
          specs: [
            "Автобусы и микроавтобусы",
            "Разгрузка у входа",
            "Охраняемый въезд",
            "Бесплатно для гостей",
          ],
        },
        en: {
          name: "Car park",
          text: "A large forecourt at the entrance with easy access — for delegations, coaches and unloading vehicles.",
          specs: [
            "Coaches and minibuses",
            "Unloading at the door",
            "Controlled entry",
            "Free for visitors",
          ],
        },
      },
    ],
    services: [
      {
        id: "wifi",
        icon: "wifi",
        ru: {
          name: "Бесплатный Wi-Fi и LAN",
          text: "Покрытие по всей территории, для экспонентов — скоростное подключение кабелем.",
        },
        en: {
          name: "Free Wi-Fi and LAN",
          text: "Site-wide coverage; exhibitors get a wired high-speed connection.",
        },
      },
      {
        id: "power",
        icon: "power",
        ru: {
          name: "Электричество 700 кВт",
          text: "220 и 380 В, вывод на стенд, отдельное питание для техники и демонстраций.",
        },
        en: {
          name: "700 kW power supply",
          text: "220 and 380 V, dedicated stand feed, separate supply for machinery and demos.",
        },
      },
      {
        id: "conference",
        icon: "mic",
        ru: {
          name: "Конференц-зал",
          text: "Аудио- и видеосистемы, проекция, модератор, технический режиссёр.",
        },
        en: {
          name: "Conference hall",
          text: "Audio and video systems, projection, moderator, technical director.",
        },
      },
      {
        id: "equipment",
        icon: "cube",
        ru: {
          name: "Прокат выставочного оборудования",
          text: "Стендовые системы, мебель, ТВ, свет, витрины, печатная продукция.",
        },
        en: {
          name: "Exhibition equipment rental",
          text: "Stand systems, furniture, screens, lighting, showcases, print.",
        },
      },
      {
        id: "climate",
        icon: "climate",
        ru: {
          name: "Климат-контроль",
          text: "Охлаждение, обогрев и вентиляция зала — комфортно и технике, и людям.",
        },
        en: {
          name: "Climate control",
          text: "Cooling, heating and hall ventilation — comfortable for equipment and people.",
        },
      },
      {
        id: "audio",
        icon: "audio",
        ru: {
          name: "Фоновая музыка и звук",
          text: "Современная аудиосистема зала, зональное озвучивание сцен и стоек.",
        },
        en: {
          name: "Background music and sound",
          text: "Modern hall audio, zoned sound for stages and stands.",
        },
      },
      {
        id: "parking",
        icon: "car",
        ru: {
          name: "Автостоянка",
          text: "Вместительный въезд при экспоцентре, удобный подъезд для фур и автобусов.",
        },
        en: {
          name: "Car park",
          text: "Spacious forecourt at the entrance, easy access for trucks and coaches.",
        },
      },
      {
        id: "cafe",
        icon: "cup",
        ru: {
          name: "Кафе 350 мест",
          text: "Два кафе быстрого питания на территории — кофе-брейки и деловые обеды.",
        },
        en: {
          name: "Cafés for 350",
          text: "Two quick-service cafés on site — coffee breaks and business lunches.",
        },
      },
      {
        id: "location",
        icon: "pin",
        ru: {
          name: "Логистика",
          text: "16 км от аэропорта, 23 км от вокзала, транзитный узел Самарканда.",
        },
        en: {
          name: "Logistics",
          text: "16 km from the airport, 23 km from the station, Samarkand transit hub.",
        },
      },
      {
        id: "security",
        icon: "shield",
        ru: {
          name: "Охрана и страховка экспозиции",
          text: "Контроль доступа, ночная охрана, хранение ценностей, монтаж и демонтаж по регламенту.",
        },
        en: {
          name: "Security and exhibition cover",
          text: "Access control, night guard, valuables storage, regulated build-up and dismantle.",
        },
      },
    ],
  },
  stats: [
    { value: "4 400", unit: "м²", ru: "Крытая площадь", en: "Indoor space" },
    {
      value: "5 000",
      unit: "м²",
      ru: "Открытая площадь",
      en: "Open-air space",
    },
    { value: "20+", unit: "", ru: "Событий в год", en: "Events a year" },
    { value: "70 000+", unit: "", ru: "Посетителей", en: "Visitors" },
  ],
  audiences: [
    { id: "exhibitors", ru: "Экспонентам", en: "Exhibitors" },
    { id: "visitors", ru: "Посетителям", en: "Visitors" },
    { id: "organizers", ru: "Организаторам событий", en: "Event organizers" },
    { id: "press", ru: "Журналистам", en: "Press" },
  ],
  markets: [
    { code: "UZ", ru: "Узбекистан", en: "Uzbekistan" },
    { code: "KZ", ru: "Казахстан", en: "Kazakhstan" },
    { code: "TJ", ru: "Таджикистан", en: "Tajikistan" },
    { code: "TM", ru: "Туркменистан", en: "Turkmenistan" },
    { code: "KG", ru: "Кыргызстан", en: "Kyrgyzstan" },
    { code: "AF", ru: "Афганистан", en: "Afghanistan" },
    { code: "RU", ru: "Россия", en: "Russia" },
    { code: "TR", ru: "Турция", en: "Türkiye" },
    { code: "CN", ru: "Китай", en: "China" },
  ],
  // Where PDFs and catalogues live: served from our own /files/ folder (migrated from sofexpo.uz).
  files: {
    fooderaPresentation: "/files/foodera-2026-presentation.pdf",
    promotorsSponsorship: "/files/promotors-sponsorship.pdf",
    promotorsPresentation: "/files/promotors-2026.pdf",
    buildSponsorship: "/files/build-sponsor.pdf",
    buildCatalog2025: "/files/build-2025-catalog.pdf",
    agroSponsorship: "/files/agro-sponsor.pdf",
    agroCatalog2026: "/files/catalog-agro-2026.pdf",
    worldEduCatalog2024: "/files/world-edu-catalog-2024.pdf",
    ecomSponsorship: "/files/ecom-sponsorship.pdf",
    techSpecs: "/files/sof-expo-technical-datasheet.pdf",
    rateCard: "/files/sof-expo-rate-card.pdf",
    floorPlan: "/files/sof-expo-floor-plan.pdf",
    regulations: "/files/sof-expo-regulations.pdf",
    serviceOrder: "/files/service-order.pdf",
    organizerChecklist: "/files/organizer-checklist.pdf",
    logo: "/files/sof-expo-logo.svg",
  },
  socialProof: {
    coOrganizers: [
      {
        ru: "Ассоциация продавцов Узбекистана",
        en: "Uzbekistan Sellers Association",
      },
      {
        ru: "Управление по туризму Самаркандской области",
        en: "Samarkand Region Tourism Directorate",
      },
    ],
  },
} as const;

export type Site = typeof site;

export type NavItem = {
  key: string;
  base: string;
  desc: string;
  children: {
    path: string;
    ru: string;
    en: string;
    note?: { ru: string; en: string };
  }[];
};

export const nav: NavItem[] = [
  {
    key: "nav.events",
    base: "/events/",
    desc: "nav.events.desc",
    children: [
      {
        path: "/events/",
        ru: "Афиша 2026–2027",
        en: "Line-up 2026–2027",
        note: {
          ru: "Даты, разделы, регистрация участников и посетителей",
          en: "Dates, sections, exhibitor and visitor registration",
        },
      },
      {
        path: "/events/foodera-expo/",
        ru: "FOODERA EXPO — продукты и напитки",
        en: "FOODERA EXPO — food & drink",
        note: {
          ru: "20–22 октября 2026 · 12 разделов food & beverage",
          en: "20–22 Oct 2026 · 12 food & beverage sections",
        },
      },
      {
        path: "/events/buildpro-expo/",
        ru: "BUILDPRO EXPO — строительство",
        en: "BUILDPRO EXPO — construction",
        note: {
          ru: "9–11 ноября 2026 · 5-я редакция, 10 тем",
          en: "9–11 Nov 2026 · 5th edition, 10 topics",
        },
      },
      {
        path: "/events/agropro-expo/",
        ru: "AGROPRO EXPO — агропром",
        en: "AGROPRO EXPO — agriculture",
        note: {
          ru: "2–4 марта 2027 · техника в зале и на улице",
          en: "2–4 Mar 2027 · machinery indoors and outdoors",
        },
      },
      {
        path: "/events/promotors-show-samarkand/",
        ru: "PROMOTORS SHOW — авто и дрифт",
        en: "PROMOTORS SHOW — motors & drift",
        note: {
          ru: "Итоги 12–13 сентября 2026 · архив",
          en: "Results of 12–13 Sep 2026 · archive",
        },
      },
      {
        path: "/events/world-edu-expo/",
        ru: "WORLD EDU — образование",
        en: "WORLD EDU — education",
        note: {
          ru: "9–10 апреля 2027 · вузы, стипендии, тесты",
          en: "9–10 Apr 2027 · universities, scholarships, tests",
        },
      },
      {
        path: "/events/ecom-retail-expo/",
        ru: "ECOM & RETAIL — e-commerce",
        en: "ECOM & RETAIL — e-commerce",
        note: {
          ru: "16–17 июня 2027 · White Label Edition",
          en: "16–17 Jun 2027 · White Label Edition",
        },
      },
      {
        path: "/events/past/",
        ru: "Архив прошедших выставок",
        en: "Past editions archive",
        note: {
          ru: "Каталоги, цифры и фотоматериалы",
          en: "Catalogues, figures and photography",
        },
      },
    ],
  },
  {
    key: "nav.venue",
    base: "/venue/",
    desc: "nav.venue.desc",
    children: [
      {
        path: "/venue/",
        ru: "Экспоцентр: обзор",
        en: "The centre: overview",
        note: {
          ru: "Зал 4 400 м², открытая площадка 5 000 м²",
          en: "4,400 m² hall, 5,000 m² open area",
        },
      },
      {
        path: "/venue/halls/",
        ru: "Залы и площадки",
        en: "Halls and areas",
        note: {
          ru: "Площади, вместимость, схемы расстановки",
          en: "Areas, capacity, stand layouts",
        },
      },
      {
        path: "/venue/services/",
        ru: "Услуги и прокат оборудования",
        en: "Services and equipment rental",
        note: {
          ru: "Прокат оборудования, мебель, персонал",
          en: "Equipment rental, furniture, staffing",
        },
      },
      {
        path: "/venue/tech-specs/",
        ru: "Техническая спецификация",
        en: "Technical data sheet",
        note: {
          ru: "700 кВт, нагрузка на пол, ворота, высота",
          en: "700 kW, floor load, doors, ceiling height",
        },
      },
      {
        path: "/venue/how-to-get-there/",
        ru: "Как добраться, парковка, трансфер",
        en: "Getting there, parking, transfer",
        note: {
          ru: "16 км от аэропорта, 23 км от вокзала",
          en: "16 km from the airport, 23 km from the station",
        },
      },
      {
        path: "/venue/gallery/",
        ru: "Фото и видео центра",
        en: "Photos and video",
        note: {
          ru: "Экспозиции, монтажные дни, форум",
          en: "Expos, build days, the forum",
        },
      },
    ],
  },
  {
    key: "nav.exhibitors",
    base: "/exhibitors/",
    desc: "nav.exhibitors.desc",
    children: [
      {
        path: "/exhibitors/",
        ru: "Почему стоит участвовать",
        en: "Why exhibit",
        note: {
          ru: "Аудитория, форматы участия, что считать результатом",
          en: "Audience, participation formats, what to measure",
        },
      },
      {
        path: "/exhibitors/packages/",
        ru: "Пакеты участия и цены",
        en: "Packages and rates",
        note: {
          ru: "Что входит в пакет и от чего зависит смета",
          en: "What the package includes, what drives the quote",
        },
      },
      {
        path: "/exhibitors/floor-plan/",
        ru: "Планировка и выбор места",
        en: "Floor plan and stand location",
        note: {
          ru: "Где поставить стенд и почему это важно",
          en: "Where to place your stand and why it matters",
        },
      },
      {
        path: "/exhibitors/stand-construction/",
        ru: "Строительство стендов",
        en: "Stand construction",
        note: {
          ru: "Типовая застройка и проекты под ключ",
          en: "Shell scheme and bespoke build",
        },
      },
      {
        path: "/exhibitors/services/",
        ru: "Сервисы на время выставки",
        en: "Services during the show",
        note: {
          ru: "Заказ до монтажа и на дни работы выставки",
          en: "Order before build-up and for the show days",
        },
      },
      {
        path: "/exhibitors/sponsorship/",
        ru: "Спонсорство и реклама",
        en: "Sponsorship and advertising",
        note: {
          ru: "Баннеры, брендирование, партнёрские пакеты",
          en: "Banners, branding, partner packages",
        },
      },
      {
        path: "/exhibitors/catalogue/",
        ru: "Каталог экспонентов",
        en: "Exhibitor catalogue",
        note: {
          ru: "Компании, отрасли и контакты",
          en: "Companies, industries and contacts",
        },
      },
      {
        path: "/exhibitors/documents/",
        ru: "Документы и бланки",
        en: "Documents and forms",
        note: {
          ru: "Договор, бланки, ключевые даты подготовки",
          en: "Contract, forms and key preparation dates",
        },
      },
      {
        path: "/exhibitors/faq/",
        ru: "FAQ экспонента",
        en: "Exhibitor FAQ",
        note: {
          ru: "Монтаж, техника, персонал, отчётность",
          en: "Build-up, equipment, staff, reporting",
        },
      },
    ],
  },
  {
    key: "nav.visitors",
    base: "/visitors/",
    desc: "nav.visitors.desc",
    children: [
      {
        path: "/visitors/",
        ru: "Как посетить выставку",
        en: "How to attend",
        note: {
          ru: "Что смотреть и как планировать день",
          en: "What to see and how to plan the day",
        },
      },
      {
        path: "/visitors/tickets/",
        ru: "Билеты и регистрация",
        en: "Tickets and registration",
        note: {
          ru: "Регистрация специалиста и вход",
          en: "Trade registration and entry",
        },
      },
      {
        path: "/visitors/travel/",
        ru: "Проезд, отели, визы",
        en: "Travel, hotels, visas",
        note: {
          ru: "Отели, трансфер, визовые вопросы",
          en: "Hotels, transfer, visa questions",
        },
      },
      {
        path: "/visitors/programme/",
        ru: "Деловая программа",
        en: "Business programme",
        note: {
          ru: "Форумы, сессии, дегустации, биржа контактов",
          en: "Forums, sessions, tastings, matchmaking",
        },
      },
      {
        path: "/visitors/access/",
        ru: "Доступная среда и дети",
        en: "Accessibility and children",
        note: {
          ru: "Дети, организованные группы, доступность",
          en: "Children, organized groups, accessibility",
        },
      },
    ],
  },
  {
    key: "nav.organizers",
    base: "/organizers/",
    desc: "nav.organizers.desc",
    children: [
      {
        path: "/organizers/",
        ru: "Провести событие в SOF EXPO",
        en: "Host your event at SOF EXPO",
        note: {
          ru: "Своё событие на готовой площадке",
          en: "Your own event on a ready venue",
        },
      },
      {
        path: "/organizers/rates/",
        ru: "Ставки за аренду и услуги",
        en: "Rental and service rates",
        note: {
          ru: "Аренда площади, услуги, порядок оплаты",
          en: "Space rental, services, payment terms",
        },
      },
      {
        path: "/organizers/conferences/",
        ru: "Конференции и форумы",
        en: "Conferences and forums",
        note: {
          ru: "Конференц-зал, звук, свет, трансляция",
          en: "Conference room, sound, light, streaming",
        },
      },
      {
        path: "/organizers/checklist/",
        ru: "Чек-лист подготовки события",
        en: "Event readiness checklist",
        note: {
          ru: "От брифа до демонтажа — по пунктам",
          en: "From brief to de-install, step by step",
        },
      },
    ],
  },
  {
    key: "nav.news",
    base: "/news/",
    desc: "nav.news.desc",
    children: [
      {
        path: "/news/",
        ru: "Новости и пресс-релизы",
        en: "News and press releases",
        note: {
          ru: "Анонсы выставок и пресс-релизы",
          en: "Show announcements and press releases",
        },
      },
      {
        path: "/news/media-kit/",
        ru: "Медиа-кит и аккредитация",
        en: "Media kit and accreditation",
        note: {
          ru: "Логотипы, фотобанк, аккредитация",
          en: "Logos, photo bank, accreditation",
        },
      },
      {
        path: "/articles/",
        ru: "Аналитика рынков",
        en: "Market insights",
        note: {
          ru: "Разборы рынков и практики участия",
          en: "Market reviews and participation practice",
        },
      },
    ],
  },
  {
    key: "nav.about",
    base: "/about/",
    desc: "nav.about.desc",
    children: [
      {
        path: "/about/",
        ru: "О компании RESOF EXPO",
        en: "About RESOF EXPO",
        note: {
          ru: "Оператор центра, стандарты, цифры",
          en: "The operator, its standards and figures",
        },
      },
      {
        path: "/about/team/",
        ru: "Команда",
        en: "Team",
        note: { ru: "Кто ведёт ваш проект", en: "Who runs your project" },
      },
      {
        path: "/about/partners/",
        ru: "Партнёры и поддержки",
        en: "Partners and endorsements",
        note: {
          ru: "Ассоциации, вузы, отели, медиа",
          en: "Associations, universities, hotels, media",
        },
      },
      {
        path: "/contacts/",
        ru: "Контакты и реквизиты",
        en: "Contacts and details",
        note: {
          ru: "Телефоны, адрес, форма заявки",
          en: "Phones, address, request form",
        },
      },
      {
        path: "/request-stand/",
        ru: "Забронировать стенд",
        en: "Book a stand",
        note: {
          ru: "Ответ в течение рабочего дня",
          en: "Reply within one business day",
        },
      },
    ],
  },
];

export const footerColumns = [
  {
    title: "footer.dir",
    links: [
      { path: "/venue/", key: "nav.venue" },
      { path: "/venue/halls/", ru: "Залы и площади", en: "Halls and areas" },
      {
        path: "/venue/services/",
        ru: "Услуги и прокат",
        en: "Services and rental",
      },
      {
        path: "/venue/tech-specs/",
        ru: "Техническая спецификация",
        en: "Technical data sheet",
      },
      { path: "/about/", key: "nav.about" },
    ],
  },
  {
    title: "footer.events",
    links: [
      { path: "/events/", ru: "Вся афиша", en: "All exhibitions" },
      { path: "/events/foodera-expo/", ru: "FOODERA EXPO", en: "FOODERA EXPO" },
      {
        path: "/events/buildpro-expo/",
        ru: "BUILDPRO EXPO",
        en: "BUILDPRO EXPO",
      },
      { path: "/events/agropro-expo/", ru: "AGROPRO EXPO", en: "AGROPRO EXPO" },
      {
        path: "/events/ecom-retail-expo/",
        ru: "ECOM & RETAIL EXPO",
        en: "ECOM & RETAIL EXPO",
      },
      { path: "/events/past/", ru: "Архив выставок", en: "Past exhibitions" },
    ],
  },
  {
    title: "footer.audience",
    links: [
      { path: "/exhibitors/", ru: "Экспонентам", en: "For exhibitors" },
      {
        path: "/exhibitors/packages/",
        ru: "Пакеты и цены",
        en: "Packages and rates",
      },
      {
        path: "/exhibitors/stand-construction/",
        ru: "Строительство стендов",
        en: "Stand construction",
      },
      { path: "/visitors/", ru: "Посетителям", en: "For visitors" },
      { path: "/organizers/", ru: "Организаторам", en: "For organizers" },
      {
        path: "/visitors/travel/",
        ru: "Проезд и отели",
        en: "Travel and hotels",
      },
    ],
  },
  {
    title: "footer.info",
    links: [
      { path: "/news/", ru: "Новости", en: "News" },
      { path: "/articles/", ru: "Аналитика рынков", en: "Market insights" },
      { path: "/about/team/", ru: "Команда", en: "Team" },
      { path: "/contacts/", ru: "Контакты", en: "Contacts" },
      { path: "/search/", ru: "Поиск", en: "Search" },
    ],
  },
] as const;
