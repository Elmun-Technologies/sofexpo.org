import type { PageDef } from "./types";
import { events } from "@/data/events";

/**
 * Booked windows, computed from events.ts (docs/08 §4.7): every own show holds the venue
 * for build-up (−2 days) through dismantling (+2 days). Rebuilds automatically when the
 * line-up changes; no second source to keep in sync by hand.
 */
function busyWindows(locale: "ru" | "en"): [string, string][] {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", {
      day: "numeric",
      month: "long",
      timeZone: "Asia/Samarkand",
    }).format(new Date(`${iso}T12:00:00+05:00`));
  const shift = (iso: string, n: number) => {
    const d = new Date(`${iso}T12:00:00+05:00`);
    d.setDate(d.getDate() + n);
    const p = (x: number) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  return events
    .filter((e) => e.status !== "past")
    .sort((a, b) => a.dates.start.localeCompare(b.dates.start))
    .map((e) => [e.brand[locale], `${fmt(shift(e.dates.start, -2))} — ${fmt(shift(e.dates.end, 2))}`]);
}

export const organizerPages: PageDef[] = [
  {
    path: "/organizers/",
    meta: {
      ru: {
        title: "Организаторам событий: аренда экспоцентра SOF EXPO Samarkand",
        description:
          "Ваша выставка, форум или фестиваль в SOF EXPO: зал 4 400 м², улица 5 000 м², конференц-зал, техника и сервисы. Расчёт — за один рабочий день.",
      },
      en: {
        title: "Event organizers: rent SOF EXPO Samarkand as a venue",
        description:
          "Your exhibition, forum or festival at SOF EXPO: 4,400 m² hall, 5,000 m² outdoors, conference room, tech and services. Quote in one business day.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Площадка для вашего события",
          title: "Вы — организатор. Мы — зал, техника и сервис",
          lead: "Центр работает с внешними организаторами: федеральные и региональные выставки, форумы, конференции, корпоративные мероприятия и фестивали. Берём на себя инфраструктуру, монтаж, безопасность и сервис для экспонентов, чтобы ваша команда занималась содержанием.",
          bullets: [
            "Расчёт даты и ставки за 1 рабочий день",
            "Техспецификация и регламент — до договора",
            "Опыт 20+ событий в год на этой площадке",
          ],
          actions: [
            { label: "Оставить бриф", href: "/organizers/#brief" },
            { label: "Ставки аренды", href: "/organizers/rates/" },
          ],
          image: "/images/venue-exterior.jpg",
          imageAlt: "Выставочный центр",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "calendar",
              title: "Свободные даты",
              text: "Мягкий календарь: под крупное событие выделяем окно монтажа, работы и демонтажа целиком, без соседних заездов.",
            },
            {
              icon: "building",
              title: "Зал и улица",
              text: "4 400 м² под экспозицию, 5 000 м² под технику, сцену и шоу. Комбинируем под формат.",
            },
            {
              icon: "power",
              title: "Техническая часть",
              text: "700 кВт, 220/380 В, кабельные трассы, освещение, климат, аудио, экраны, интернет и LAN.",
            },
            {
              icon: "users",
              title: "Сервис для экспонентов",
              text: "Регистрация, застройка, мебель, печать, хранение — мы можем вести ваших участников по нашему прайсу.",
            },
            {
              icon: "shield",
              title: "Безопасность",
              text: "Контроль доступа, охрана в монтажный период, план эвакуации, координация с администрацией города.",
            },
            {
              icon: "chart",
              title: "Маркетинг и медиа",
              text: "Помогаем с анонсами, рассылкой по нашей базе, площадкой для прессы и трансляцией.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Площадка",
          title: "Как проходят события в центре",
          text: "Съёмка — с реальных событий: конференции, выставки и фестивали на этой площадке.",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/conference-audience.jpg",
              caption: "Конференция в конференц-зале на 350 мест",
            },
            {
              src: "/images/hall-stand.jpg",
              caption: "Монтаж экспозиции в главном зале",
            },
            {
              src: "/images/hall-crowd.jpg",
              caption: "День мероприятия: поток посетителей",
            },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Бриф",
              text: "Формат события, дата, площадь, ожидаемое число экспонентов и посетителей, технические пожелания.",
            },
            {
              title: "Расчёт",
              text: "Ставка за м², пакет услуг, смета застройки, график монтажа. Присылаем в течение рабочего дня.",
            },
            {
              title: "Договор и подготовка",
              text: "Фиксируем дату, согласуем регламент, раздаём ваши заявки на услуги нашим подрядчикам.",
            },
            {
              title: "Событие",
              text: "Работаем в одном штабе: техник, администратор зала, служба регистрации, координатор.",
            },
            {
              title: "Итог",
              text: "Отчёт: посещаемость, активность, логистические замечания, рекомендации к следующей дате.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Календарь",
          title: "Занятые даты — собственные выставки",
          text: "Каждая выставка занимает площадку с монтажом за два дня и демонтажом два дня после. Любая другая дата свободна — пришлите бриф, вернёмся с расчётом за рабочий день.",
        },
        {
          type: "table",
          head: ["Собственная выставка", "Площадка занята: монтаж + работа + демонтаж"],
          rows: busyWindows("ru"),
        },
        {
          type: "callout",
          tone: "gold",
          title: "Кому мы подходим",
          text: "Отраслевым организаторам, ассоциациям, региональным администрациям, корпорациям с крупной выставкой сотрудников, промоутерам фестивалей. Не берём события, которые требуют перепланировки здания или не проходят по пожарной нагрузке — и говорим об этом на брифе.",
          kicker: "Совместимость",
        },
        {
          id: "brief",
          type: "form",
          title: "Бриф на расчёт даты",
          text: "Опишите событие — пришлём план зала, ставки и график монтажа.",
          directions: [
            "Отраслевая выставка",
            "Форум или конференция",
            "Фестиваль или шоу",
            "Корпоративное мероприятие",
            "Ярмарка",
            "Спортивное событие",
          ],
        },
        {
          type: "links",
          items: [
            { label: "Ставки аренды и услуг", href: "/organizers/rates/" },
            { label: "Конференции и форумы", href: "/organizers/conferences/" },
            { label: "Чек-лист подготовки", href: "/organizers/checklist/" },
            { label: "Техническая спецификация", href: "/venue/tech-specs/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "A venue for your event",
          title: "You organize. We run the hall, the tech and the service",
          lead: "The centre works with external organizers: national and regional trade shows, forums, conferences, corporate events and festivals. We take infrastructure, build-up, security and exhibitor service so your team focuses on content.",
          bullets: [
            "Date and rate quote in one business day",
            "Technical sheet and regulations before the contract",
            "Experience of 20+ events a year on this site",
          ],
          actions: [
            { label: "Send a brief", href: "/organizers/#brief" },
            { label: "Rental rates", href: "/organizers/rates/" },
          ],
          image: "/images/venue-exterior.jpg",
          imageAlt: "Exhibition centre",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "calendar",
              title: "Available dates",
              text: "A flexible calendar: for a major event we book build-up, run and dismantle as one window with no neighbouring load-ins.",
            },
            {
              icon: "building",
              title: "Hall and outdoors",
              text: "4,400 m² for the expo, 5,000 m² for machinery, stage and show. Combined to fit the format.",
            },
            {
              icon: "power",
              title: "Technical layer",
              text: "700 kW, 220/380 V, cable routes, lighting, climate, audio, screens, internet and LAN.",
            },
            {
              icon: "users",
              title: "Exhibitor services",
              text: "Registration, build, furniture, print, storage — we can serve your exhibitors at our rate card.",
            },
            {
              icon: "shield",
              title: "Security",
              text: "Access control, guarding during build, evacuation plan, coordination with city authorities.",
            },
            {
              icon: "chart",
              title: "Marketing and media",
              text: "Announcements, mailing from our database, a press area and streaming.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "The venue",
          title: "How events run at the centre",
          text: "Shot at real events: conferences, exhibitions and festivals on this site.",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/conference-audience.jpg",
              caption: "Conference in the 350-seat hall",
            },
            {
              src: "/images/hall-stand.jpg",
              caption: "Exhibition build-up in the main hall",
            },
            {
              src: "/images/hall-crowd.jpg",
              caption: "Event day: visitor flow",
            },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Brief",
              text: "Format, date, area, expected exhibitors and visitors, technical wishes.",
            },
            {
              title: "Quote",
              text: "Rate per m², service package, build budget and build-up schedule. Within the business day.",
            },
            {
              title: "Contract and preparation",
              text: "The date is fixed, regulations agreed, your service orders handed to our contractors.",
            },
            {
              title: "Event",
              text: "One shared operations room: technician, hall manager, registration desk, coordinator.",
            },
            {
              title: "Report",
              text: "Attendance, activity, logistics notes and a recommendation for the next date.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Calendar",
          title: "Booked dates — our own exhibitions",
          text: "Each show holds the venue for build-up two days before and dismantling two days after. Any other date is free — send a brief and we reply with a quote within one business day.",
        },
        {
          type: "table",
          head: ["Own exhibition", "Venue booked: build-up + run + dismantling"],
          rows: busyWindows("en"),
        },
        {
          type: "callout",
          tone: "gold",
          title: "Who we fit",
          text: "Industry organizers, associations, regional administrations, corporations with a large employee expo, festival promoters. We decline events that need structural changes or exceed fire load — and say so at the brief stage.",
          kicker: "Fit",
        },
        {
          id: "brief",
          type: "form",
          title: "Brief for a date quote",
          text: "Describe the event and we send the floor plan, rates and build schedule.",
          directions: [
            "Trade show",
            "Forum or conference",
            "Festival or show",
            "Corporate event",
            "Fair",
            "Sports event",
          ],
        },
        {
          type: "links",
          items: [
            { label: "Rental and service rates", href: "/organizers/rates/" },
            {
              label: "Conferences and forums",
              href: "/organizers/conferences/",
            },
            { label: "Readiness checklist", href: "/organizers/checklist/" },
            { label: "Technical data sheet", href: "/venue/tech-specs/" },
          ],
        },
      ],
    },
  },
  {
    path: "/organizers/rates/",
    meta: {
      ru: {
        title: "Ставки аренды зала и услуг — SOF EXPO Samarkand",
        description:
          "Из чего считается стоимость проведения события: ставка за м², дни монтажа, пакет услуг, conference-зал, питание, охрана, уборка. Как получить точный расчёт.",
      },
      en: {
        title: "Hall rental and service rates — SOF EXPO Samarkand",
        description:
          "How event cost is calculated: rate per m², build-up days, service package, conference hall, catering, security, cleaning. How to get an exact quote.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Ставки",
          title: "Прозрачная экономика события",
          lead: "Мы не публикуем «цены от» без контекста: ставка зависит от сезона, формата и загрузки даты. Ниже — структура расчёта, чтобы вы могли заранее спланировать бюджет.",
          image: "/images/event-foodera.jpg",
          imageAlt: "Экспозиция выставки",
          actions: [
            { label: "Получить расчёт по дате", href: "/organizers/#brief" },
          ],
        },
        {
          type: "table",
          head: ["Статья", "Единица", "Что влияет на цену", "Комментарий"],
          rows: [
            [
              "Аренда выставочной площади",
              "м² × сутки",
              "сезон, формат, плотность застройки",
              "базовая статка расчёта",
            ],
            [
              "Дни монтажа и демонтажа",
              "сутки",
              "объём застройки",
              "обычно 1 + 0,5 дня",
            ],
            [
              "Открытая площадка",
              "м² × сутки",
              "грузопоток, ограждения",
              "для техники и шоу",
            ],
            [
              "Конференц-зал",
              "сессия / день",
              "техника, перевод",
              "до 350 мест",
            ],
            [
              "Электричество",
              "точка",
              "мощность 220/380 В",
              "автомат на стенд",
            ],
            [
              "Застройка Octanorm",
              "м²",
              "высота, графика",
              "пакет со светом и полкой",
            ],
            [
              "Клининг и охрана",
              "сутки",
              "площадь и график",
              "включено в базовый пакет",
            ],
            [
              "Регистрация посетителей",
              "чел/смена",
              "число гостей",
              "сканирование QR, статистика",
            ],
            [
              "Разгрузка и хранение",
              "заявка",
              "масса, габарит",
              "кран по запросу",
            ],
          ],
        },
        {
          type: "callout",
          kicker: "Как считается скидка",
          title: "Длительность и регулярность важнее торга",
          text: "События на 3+ дня, второй год подряд и блоки дат в сезон — три случая, когда ставка пересматривается в пользу организатора. Скидка «в лоб» не работает: мы держим рынок.",
          tone: "sand",
        },
        {
          type: "checklist",
          items: [
            "В расчёт всегда включаем страховку ответственности площадки.",
            "Питание и кафе — по факту, наценка на организацию не закладывается.",
            "Для государственных и ассоциационных мероприятий есть отдельные условия.",
            "Итоговая смета фиксируется договором и не меняется без изменения ТЗ.",
          ],
        },
        {
          type: "form",
          title: "Запросить смету",
          text: "Приложите техзадание или опишите событие словами — вернём расчёт в течение рабочего дня.",
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Rates",
          title: "Transparent event economics",
          lead: 'We do not publish "from" prices without context: the rate depends on season, format and calendar load. Below is the structure so you can plan the budget.',
          image: "/images/event-foodera.jpg",
          imageAlt: "Exhibition expo",
          actions: [{ label: "Get a date quote", href: "/organizers/#brief" }],
        },
        {
          type: "table",
          head: ["Line", "Unit", "What moves the price", "Note"],
          rows: [
            [
              "Exhibition area",
              "m² × day",
              "season, format, build density",
              "base line of the quote",
            ],
            [
              "Build-up and dismantle days",
              "day",
              "volume of construction",
              "usually 1 + 0.5 days",
            ],
            [
              "Open-air area",
              "m² × day",
              "freight flow, fencing",
              "for machinery and shows",
            ],
            [
              "Conference hall",
              "session / day",
              "AV, interpreting",
              "up to 350 seats",
            ],
            ["Power", "point", "220/380 V load", "dedicated breaker"],
            [
              "Octanorm build",
              "m²",
              "height, graphics",
              "package with lighting and shelf",
            ],
            [
              "Cleaning and security",
              "day",
              "area and schedule",
              "included in the base package",
            ],
            [
              "Visitor registration",
              "person/shift",
              "guest count",
              "QR scanning and statistics",
            ],
            [
              "Unloading and storage",
              "request",
              "weight, size",
              "crane on request",
            ],
          ],
        },
        {
          type: "callout",
          kicker: "How a discount works",
          title: "Duration and regularity beat negotiation",
          text: "Events of three days or more, a second consecutive year and blocks of dates in season are the three cases where the rate is revisited in the organizer favour. A blunt discount does not work: we hold the market.",
          tone: "sand",
        },
        {
          type: "checklist",
          items: [
            "Venue liability insurance is always part of the calculation.",
            "Catering is billed at cost with no handling mark-up.",
            "State and association events have separate terms.",
            "The final quote is fixed by contract and does not change unless the brief does.",
          ],
        },
        {
          type: "form",
          title: "Request a budget",
          text: "Attach a technical brief or describe the event — we return the quote within the business day.",
        },
      ],
    },
  },
  {
    path: "/organizers/conferences/",
    meta: {
      ru: {
        title: "Конференции и форумы: зал, техника, модератор, трансляция",
        description:
          "Организация деловой программы в SOF EXPO Samarkand: зал на 350 мест, звук и свет, проекция, синхронный перевод, режиссёр трансляции, регистрация делегатов, кофе-брейки.",
      },
      en: {
        title: "Conferences and forums: hall, AV, moderator, streaming",
        description:
          "Business programme delivery at SOF EXPO Samarkand: a 350-seat hall, sound and light, projection, simultaneous interpreting, a stream director, delegate registration, coffee breaks.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Конгресс-сервис",
          title: "Программа, которую слышно и видно",
          lead: "Собираем деловую часть под ключ: от сцены и звука до регистрации делегатов и записи выступлений. Можно заказать как весь контур, так и отдельные позиции.",
          image: "/images/conference-audience.jpg",
          imageAlt: "Конференция в конференц-зале",
          actions: [{ label: "Заказать программу", href: "/contacts/" }],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "mic",
              title: "Сцена и трибуна",
              text: "Подиум, экран, фактура для спикеров, таймер, суфлёр по запросу.",
            },
            {
              icon: "audio",
              title: "Звук и перевод",
              text: "Радиосистемы, петлички, зональное озвучивание, кабина синхронного перевода и наушники.",
            },
            {
              icon: "play",
              title: "Трансляция и запись",
              text: "Режиссёр, 2–3 камеры, стрим на YouTube или в закрытый зал, монтаж доклада на следующий день.",
            },
            {
              icon: "seat",
              title: "Регистрация делегатов",
              text: "QR-проверка, бейджи, печатный список, статистика посещаемости по сессиям.",
            },
            {
              icon: "cup",
              title: "Кофе-брейки и обеды",
              text: "Меню на площадке или кейтеринг по вашему списку, отдельные зоны для VIP.",
            },
            {
              icon: "chart",
              title: "Модератор и сценарий",
              text: "Профессиональный модератор отраслевых сессий, тайминг, подготовка спикеров.",
            },
          ],
        },
        {
          type: "table",
          head: ["Услуга", "Формат", "В базовом пакете"],
          rows: [
            ["Зал с рассадкой", "до 350 мест", "да"],
            ["Свет и звук", "2 радиомикрофона, пульт", "да"],
            ["Проекция", "экран + проектор", "да"],
            ["Синхронный перевод", "2 кабины, 40 наушников", "нет"],
            ["Видеотрансляция", "2 камеры, режиссёр", "нет"],
            ["Модератор", "на сессии", "нет"],
            ["Регистрация", "2 человека, сканеры", "по пакету"],
          ],
        },
        {
          type: "links",
          items: [
            { label: "Ставки аренды", href: "/organizers/rates/" },
            { label: "Услуги площадки", href: "/venue/services/" },
            {
              label: "Деловая программа выставок",
              href: "/visitors/programme/",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Congress service",
          title: "A programme you can hear and see",
          lead: "We build the business side turnkey: from stage and sound to delegate registration and session recording. Order the whole contour or single items.",
          image: "/images/conference-audience.jpg",
          imageAlt: "Conference in the conference hall",
          actions: [{ label: "Order a programme", href: "/contacts/" }],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "mic",
              title: "Stage and podium",
              text: "Podium, screen, speaker backdrop, timer, teleprompter on request.",
            },
            {
              icon: "audio",
              title: "Sound and interpreting",
              text: "Radio mics, lavaliers, zoned audio, interpreting booth and headsets.",
            },
            {
              icon: "play",
              title: "Stream and recording",
              text: "Director, two to three cameras, YouTube or private-room stream, next-day edit of each talk.",
            },
            {
              icon: "seat",
              title: "Delegate registration",
              text: "QR check, badges, printed list, attendance statistics per session.",
            },
            {
              icon: "cup",
              title: "Coffee breaks and lunches",
              text: "On-site menu or catering by your list, a separate VIP area.",
            },
            {
              icon: "chart",
              title: "Moderator and script",
              text: "Professional moderator for industry sessions, timing, speaker preparation.",
            },
          ],
        },
        {
          type: "table",
          head: ["Service", "Format", "In the base package"],
          rows: [
            ["Hall with seating", "up to 350 seats", "yes"],
            ["Sound and light", "2 radio mics, desk", "yes"],
            ["Projection", "screen + projector", "yes"],
            ["Simultaneous interpreting", "2 booths, 40 headsets", "no"],
            ["Video streaming", "2 cameras, director", "no"],
            ["Moderator", "per session", "no"],
            ["Registration", "2 staff, scanners", "by package"],
          ],
        },
        {
          type: "links",
          items: [
            { label: "Rental rates", href: "/organizers/rates/" },
            { label: "Venue services", href: "/venue/services/" },
            { label: "Show business programme", href: "/visitors/programme/" },
          ],
        },
      ],
    },
  },
  {
    path: "/organizers/checklist/",
    meta: {
      ru: {
        title: "Чек-лист подготовки события в экспоцентре",
        description:
          "Что согласовать до монтажа: техплан, электричество, застройку, безопасность, регистрацию, навигацию, питание, транспорт и прессу. Календарь организатора от ТЗ до пост-отчёта.",
      },
      en: {
        title: "Event readiness checklist for the exhibition centre",
        description:
          "What to agree before build-up: technical plan, power, construction, safety, registration, wayfinding, catering, transport and press. An organizer calendar from brief to post-report.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Чек-лист",
          title: "Календарь организатора: 90 дней до входа посетителя",
          lead: "Этот список мы используем сами на своих выставках. Скачайте и адаптируйте под своё событие — он снимает 90% вопросов на монтаже.",
          image: "/images/conference-audience.jpg",
          imageAlt: "Конференц-зал во время события",
        },
        {
          type: "steps",
          items: [
            {
              title: "За 90 дней: концепция и смета",
              text: "Формат, дата, площадь, число экспонентов, ожидаемая аудитория, бюджет застройки. Заявка в администрацию, если нужно перекрытие улицы.",
            },
            {
              title: "За 60 дней: продажи экспонентам",
              text: "План зала, пакеты, прайс, лендинг события, приём заявок, договоры.",
            },
            {
              title: "За 30 дней: техника и застройка",
              text: "Технические заявки участников, электричество, заявки по высоте, проекты стендов под заказ, страховка.",
            },
            {
              title: "За 14 дней: аудитория",
              text: "Регистрация посетителей, приглашения, список СМИ, аккредитация, программа с таймингом.",
            },
            {
              title: "За 3 дня: монтаж",
              text: "График заезда фур, инструктаж подрядчиков, стойка регистрации, навигация, проверка связи и Wi-Fi.",
            },
            {
              title: "В дни события: оперштаб",
              text: "Администратор зала, техник, координатор программы, служба безопасности, ежедневная сводка.",
            },
            {
              title: "После: демонтаж и отчёт",
              text: "Вывоз, хранение, акты, статистика, отчёт партнёрам, база контактов для следующей даты.",
            },
          ],
        },
        {
          type: "checklist",
          items: [
            "Пожарная нагрузка и материалы застройки согласованы с технадзором.",
            "План эвакуации размещён на входах и у стоек регистрации.",
            "Для демонстраций с открытым огнём, фритюром или дымом — отдельное согласование.",
            "Питание животных, если оно часть шоу, — ветеринарные документы.",
            "Музыка и публичное исполнение — права и уведомление соответствующей организации.",
            "Для иностранных экспонентов — письмо для таможни на выставочные образцы.",
          ],
        },
        {
          type: "files",
          items: [
            {
              title: "Чек-лист организатора (PDF)",
              href: "/files/organizer-checklist.pdf",
              note: "полный список с ответственными",
              kind: "pdf",
            },
            {
              title: "Регламент площадки",
              href: "/files/sof-expo-regulations.pdf",
              note: "окна монтажа, требования",
              kind: "pdf",
            },
          ],
        },
        {
          type: "cta",
          title: "Нужен внешний взгляд на подготовку?",
          text: "Наш проджект-менеджер проверит техплан и график — обычно это экономит один день монтажа.",
          actions: [
            { label: "Обсудить подготовку", href: "/contacts/" },
            { label: "Услуги площадки", href: "/venue/services/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Checklist",
          title: "The organizer calendar: 90 days before the doors open",
          lead: "We use this list for our own shows. Download it and adapt it to your event — it removes 90% of the questions at build-up.",
          image: "/images/conference-audience.jpg",
          imageAlt: "Conference hall during an event",
        },
        {
          type: "steps",
          items: [
            {
              title: "90 days: concept and budget",
              text: "Format, date, area, exhibitor count, expected audience, build budget. Notice to the city administration if a street needs closing.",
            },
            {
              title: "60 days: selling the floor",
              text: "Floor plan, packages, price list, event landing, applications, contracts.",
            },
            {
              title: "30 days: technical and build",
              text: "Participant technical forms, power, height requests, custom stand drawings, insurance.",
            },
            {
              title: "14 days: audience",
              text: "Visitor registration, invitations, media list, accreditation, timed programme.",
            },
            {
              title: "3 days: build-up",
              text: "Truck schedule, contractor briefing, registration desk, wayfinding, connectivity check.",
            },
            {
              title: "Show days: operations room",
              text: "Hall manager, technician, programme coordinator, security, a daily briefing.",
            },
            {
              title: "After: dismantle and report",
              text: "Removal, storage, acts, statistics, partner report, contact base for the next date.",
            },
          ],
        },
        {
          type: "checklist",
          items: [
            "Fire load and build materials approved with the safety officer.",
            "Evacuation plan posted at entrances and registration desks.",
            "Open flame, frying or smoke demonstrations need a separate approval.",
            "Live animals as part of a show require veterinary documents.",
            "Music and public performance require rights and the relevant notification.",
            "Foreign exhibitors need a customs letter for exhibition samples.",
          ],
        },
        {
          type: "files",
          items: [
            {
              title: "Organizer checklist (PDF)",
              href: "/files/organizer-checklist.pdf",
              note: "full list with owners",
              kind: "pdf",
            },
            {
              title: "Venue regulations",
              href: "/files/sof-expo-regulations.pdf",
              note: "build windows, requirements",
              kind: "pdf",
            },
          ],
        },
        {
          type: "cta",
          title: "Want an external review of your plan?",
          text: "Our project manager checks the technical plan and schedule — usually it saves one build day.",
          actions: [
            { label: "Discuss preparation", href: "/contacts/" },
            { label: "Venue services", href: "/venue/services/" },
          ],
        },
      ],
    },
  },
];
