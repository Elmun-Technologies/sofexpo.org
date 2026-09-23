import type { PageDef } from "./types";

export const venuePages: PageDef[] = [
  {
    path: "/venue/",
    image: "/images/venue-exterior.jpg",
    meta: {
      ru: {
        title:
          "Выставочный центр SOF EXPO Samarkand: залы, услуги, адрес",
        description:
          "SOF EXPO Samarkand: зал 4 400 м², улица 5 000 м², конференц-зал на 350 мест, 700 кВт, парковка и кафе. Планировка, техспецификация, как добраться.",
      },
      en: {
        title:
          "SOF EXPO Samarkand exhibition centre — halls, areas and services",
        description:
          "SOF EXPO Samarkand: 4,400 m² indoor hall, 5,000 m² open ground, a 350-seat conference hall, 700 kW power, parking and cafés. Floor plan, technical sheet and directions from the airport.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Экспоцентр · Самарканд",
          title: "Площадка, рассчитанная на монтаж, показ и переговоры",
          lead: "Центр построен как единый выставочный корпус: крытый зал со свободной планировкой, уличная экспозиция для техники, конференц-зал, два кафе и парковка при въезде. Расстояние до аэропорта — 16 км, до вокзала — 23 км.",
          bullets: [
            "4 400 м² в зале",
            "5 000 м² на улице",
            "700 кВт, 220/380 В",
            "Ответ на заявку — 24 часа",
          ],
          actions: [
            { label: "Забронировать дату", href: "/organizers/" },
            { label: "Техспецификация (PDF)", href: "/venue/tech-specs/" },
          ],
          image: "/images/venue-exterior.jpg",
          imageAlt: "Экстерьер выставочного центра SOF EXPO Samarkand",
        },
        {
          type: "stats",
          items: [
            {
              value: "4 400",
              unit: "м²",
              ru: "крытая экспозиция",
              en: "indoor exhibition",
            },
            {
              value: "5 000",
              unit: "м²",
              ru: "открытая площадка",
              en: "open-air area",
            },
            {
              value: "350",
              unit: "мест",
              ru: "конференц-зал и кафе",
              en: "conference hall and cafés",
            },
            {
              value: "20+",
              unit: "",
              ru: "событий в год",
              en: "events a year",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Планировка",
          title: "Один экран — вся площадка",
          text: "Зоны, площади и точки доступа: где встаёт стенд, где техника, где регистрации и грузовой двор.",
        },
        {
          /* one screen = one schematic (docs/08 §4.8): zones, areas, access points */
          type: "plan",
        },
        {
          type: "h2",
          kicker: "Что внутри",
          title: "Четыре элемента, из которых собирается любое событие",
          text: "Вы можете взять только зал, только улицу или весь контур вместе с деловой программой — конфигурация влияет на ставку, но не на сроки монтажа.",
        },
        {
          type: "grid",
          cols: 2,
          items: [
            {
              icon: "building",
              title: "Главный выставочный зал — 4 400 м²",
              text: "Свободная планировка, климат-контроль, фоновая аудиосистема, естественный свет через кровлю. Ставится любая сетка стендов: от 9 м² до островов 100+ м².",
            },
            {
              icon: "truck",
              title: "Открытая площадка — 5 000 м²",
              text: "Тяжёлая техника, тест-зоны, сцена и фестивальная инфраструктура. Подъезд фур, возможность крановой разгрузки, асфальтовое покрытие.",
            },
            {
              icon: "mic",
              title: "Конференц-зал",
              text: "Деловая программа, пресс-конференции, тренинги. Проекция, радиосистемы, модератор, онлайн-трансляция по запросу.",
            },
            {
              icon: "cup",
              title: "Кафе и зона ожидания",
              text: "Два кафе быстрого питания на 350 мест суммарно: кофе-брейки, деловые обеды и питание команды монтажа.",
            },
          ],
        },
        {
          type: "table",
          head: ["Параметр", "Значение", "Комментарий"],
          rows: [
            [
              "Крытая площадь",
              "4 400 м²",
              "свободная планировка, зонирование перегородками",
            ],
            [
              "Открытая площадь",
              "5 000 м²",
              "асфальт, подъезд фур, ограждение зоны",
            ],
            [
              "Электричество",
              "700 кВт, 220/380 В",
              "вывод на стенд, отдельное питание для демонстраций",
            ],
            [
              "Интернет",
              "Wi-Fi по территории + LAN",
              "выделенная линия для организаторов и прессы",
            ],
            [
              "Климат",
              "охлаждение, обогрев, вентиляция",
              "поддержание температуры на всех днях монтажа",
            ],
            [
              "Парковка",
              "при въезде, бесплатно",
              "места для автобусов делегаций",
            ],
            [
              "Звук",
              "фоновая система зала + сценический комплект",
              "зонное озвучивание сцен и стоек",
            ],
          ],
        },
        {
          type: "links",
          title: "Детальные страницы",
          items: [
            {
              label: "Залы и площадки",
              href: "/venue/halls/",
              note: "параметры, схемы, вместимость",
            },
            {
              label: "Услуги и прокат оборудования",
              href: "/venue/services/",
              note: "мебель, техника, печать, персонал",
            },
            {
              label: "Техническая спецификация",
              href: "/venue/tech-specs/",
              note: "для инженеров и застройщиков",
            },
            {
              label: "Как добраться",
              href: "/venue/how-to-get-there/",
              note: "аэропорт, вокзал, трансфер, парковка",
            },
            {
              label: "Фото и видео центра",
              href: "/venue/gallery/",
              note: "экспозиции, монтажные дни, форум",
            },
            {
              label: "Организаторам событий",
              href: "/organizers/",
              note: "аренда, ставки, регламент",
            },
          ],
        },
        {
          type: "cta",
          kicker: "Свободные даты",
          title: "Пришлём план зала, ставку и календарь на вашу дату",
          text: "Опишите событие: формат, площадь, даты, ожидаемая аудитория. Ответим в течение рабочего дня.",
          actions: [
            { label: "Заполнить бриф", href: "/organizers/" },
            { label: "Написать в Telegram", href: "https://t.me/sofexpomgr" },
          ],
        },
        {
          type: "faq",
          items: [
            { q: "Какая площадь у выставочного центра?", a: "Крытый зал — 4 400 м², открытая асфальтированная площадка — 5 000 м², конференц-зал на 350 мест." },
            { q: "Какая мощность электричества на площадке?", a: "Подведено 700 кВт, напряжение 220 и 380 В; к стенду подключаем 16 А в базе, 32 и 63 А по заявке." },
            { q: "Есть ли на территории питание?", a: "Да, два кафе быстрого питания общей вместимостью 350 человек." },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "The centre · Samarkand",
          title: "A venue built for build-up, demonstration and negotiation",
          lead: "SOF EXPO Samarkand is a single exhibition shell: an indoor hall with an open plan, an outdoor area for machinery, a conference hall, two cafés and parking at the gate. The airport is 16 km away, the railway station 23 km.",
          bullets: [
            "4,400 m² indoors",
            "5,000 m² outdoors",
            "700 kW, 220/380 V",
            "Answer within 24 hours",
          ],
          actions: [
            { label: "Request dates", href: "/organizers/" },
            { label: "Technical data sheet", href: "/venue/tech-specs/" },
          ],
          image: "/images/venue-exterior.jpg",
          imageAlt: "Exterior of SOF EXPO Samarkand",
        },
        {
          type: "stats",
          items: [
            {
              value: "4 400",
              unit: "m²",
              ru: "indoor exhibition",
              en: "indoor exhibition",
            },
            {
              value: "5 000",
              unit: "m²",
              ru: "open area",
              en: "open-air area",
            },
            {
              value: "350",
              unit: "seats",
              ru: "conference hall and cafés",
              en: "conference hall and cafés",
            },
            {
              value: "20+",
              unit: "",
              ru: "events a year",
              en: "events a year",
            },
          ],
        },
        {
          type: "h2",
          kicker: "The plan",
          title: "The whole venue on one screen",
          text: "Zones, areas and access points: where a stand goes, where machinery stands, where registration and the loading yard sit.",
        },
        {
          type: "plan",
        },
        {
          type: "h2",
          kicker: "Inside",
          title: "Four elements that assemble any event",
          text: "Take the hall only, the outdoor area only, or the whole contour with a business programme. The configuration changes the rate, not the build-up window.",
        },
        {
          type: "grid",
          cols: 2,
          items: [
            {
              icon: "building",
              title: "Main exhibition hall — 4,400 m²",
              text: "Open plan, climate control, background audio and daylight through the roof. Any stand grid works, from 9 m² to islands over 100 m².",
            },
            {
              icon: "truck",
              title: "Open-air area — 5,000 m²",
              text: "Heavy machinery, test zones, stage and festival infrastructure. Truck access, crane unloading, paved surface.",
            },
            {
              icon: "mic",
              title: "Conference hall",
              text: "For the business programme, press conferences and trainings. Projection, radio mics, a moderator and live streaming on request.",
            },
            {
              icon: "cup",
              title: "Cafés and lounge",
              text: "Two quick-service cafés seating 350 in total: coffee breaks, business lunches and meals for the build crew.",
            },
          ],
        },
        {
          type: "table",
          head: ["Parameter", "Value", "Notes"],
          rows: [
            [
              "Indoor area",
              "4,400 m²",
              "open plan, partition zoning available",
            ],
            ["Outdoor area", "5,000 m²", "asphalt, truck access, area fencing"],
            [
              "Power",
              "700 kW, 220/380 V",
              "stand feed, separate supply for demos",
            ],
            [
              "Internet",
              "site-wide Wi-Fi + LAN",
              "dedicated line for organizers and press",
            ],
            [
              "Climate",
              "cooling, heating, ventilation",
              "stable temperature through build-up days",
            ],
            [
              "Parking",
              "at the entrance, free",
              "spaces for delegation coaches",
            ],
            [
              "Sound",
              "hall background plus stage rig",
              "zoned audio for stages and stands",
            ],
          ],
        },
        {
          type: "links",
          title: "Detail pages",
          items: [
            {
              label: "Halls and areas",
              href: "/venue/halls/",
              note: "specs, layouts, capacity",
            },
            {
              label: "Services and rental",
              href: "/venue/services/",
              note: "furniture, tech, print, staff",
            },
            {
              label: "Technical data sheet",
              href: "/venue/tech-specs/",
              note: "for engineers and contractors",
            },
            {
              label: "Getting there",
              href: "/venue/how-to-get-there/",
              note: "airport, station, transfer, parking",
            },
            {
              label: "Photos and video",
              href: "/venue/gallery/",
              note: "expos, build days, forums",
            },
            {
              label: "For event organizers",
              href: "/organizers/",
              note: "rental, rates, regulations",
            },
          ],
        },
        {
          type: "cta",
          kicker: "Free dates",
          title:
            "We send the floor plan, the rate and the calendar for your date",
          text: "Describe the event: format, area, dates, expected audience. Reply within the working day.",
          actions: [
            { label: "Fill the brief", href: "/organizers/" },
            { label: "Message on Telegram", href: "https://t.me/sofexpomgr" },
          ],
        },
        {
          type: "faq",
          items: [
            { q: "How large is the exhibition centre?", a: "The indoor hall is 4,400 m², the paved open-air area 5,000 m², plus a 350-seat conference hall." },
            { q: "How much power is available on site?", a: "700 kW is installed at 220 and 380 V; a stand gets 16 A in the base package, 32 A and 63 A on request." },
            { q: "Is there food on site?", a: "Yes, two quick-service cafés with 350 seats in total." },
          ],
        },
      ],
    },
  },
  {
    path: "/venue/halls/",
    meta: {
      ru: {
        title: "Залы и площадки SOF EXPO Samarkand: планировки и вместимость",
        description:
          "Главный зал 4 400 м², открытая площадка 5 000 м², конференц-зал и кафе. Схемы размещения стендов, вместимость, варианты конфигурации под формат события.",
      },
      en: {
        title: "Halls and areas at SOF EXPO Samarkand — layouts and capacity",
        description:
          "Main hall of 4,400 m², 5,000 m² open ground, conference hall and cafés. Stand layouts, capacity and configuration options per event format.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Залы",
          title: "Планировки, которые выдерживают и выставку, и фестиваль",
          lead: "Ниже — базовые конфигурации, которые мы используем в своих выставках. Они же служат отправной точкой для сторонних организаторов: меняются только плотность стендов и место сцены.",
          image: "/images/hall-stand.jpg",
          imageAlt: "Выставочный зал SOF EXPO Samarkand со стендами",
          actions: [
            { label: "Запросить план в PDF", href: "/venue/tech-specs/" },
            { label: "Обсудить конфигурацию", href: "/contacts/" },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Экспозиция 9–18 м², плотная сетка",
              text: "До 120 стендов; проходы 3 м; сцена у входа; потоки построены вокруг двух входных групп. Использовали FOODERA и BUILD PRO.",
            },
            {
              title: "Смешанная: зал + улица",
              text: "Лёгкие экспоненты в зале, техника и крупногабарит на асфальте. Единая навигация, один вход для посетителя, общий регламент монтажа.",
            },
            {
              title: "Форумный контур",
              text: "Ползала отдаётся под три зоны: сцена, стенды и soft-seating. Работает для конференций на 300–400 участников.",
            },
            {
              title: "Фестивальный формат",
              text: "Сцена, трасса или шоу-зона, маркет, детская и фуд-зоны. Требует отдельного плана безопасности и согласования с администрацией.",
            },
          ],
        },
        {
          type: "table",
          head: ["Помещение", "Площадь", "Вместимость", "Особенности"],
          rows: [
            [
              "Главный выставочный зал",
              "4 400 м²",
              "до 2 500 посетителей одновременно",
              "климат-контроль, фонзовый звук, естественный свет",
            ],
            [
              "Открытая площадка",
              "5 000 м²",
              "по формату события",
              "асфальт, подъезд фур, возможность ограждения",
            ],
            [
              "Конференц-зал",
              "—",
              "до 350 мест",
              "проекция, радиосистемы, синхронный перевод",
            ],
            [
              "Переговорные зоны",
              "2 × 40 м²",
              "10–16 человек",
              "для биржи контактов и встреч с сетями",
            ],
            [
              "Кафе",
              "—",
              "350 мест",
              "два зала быстрого питания на территории",
            ],
            [
              "Зона хранения",
              "по заявке",
              "—",
              "временное хранение упаковки и стендовых материалов",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Все проходы сохраняются шириной не менее 3 метров.",
            "Сцену и входную группу разводим — иначе поток не доходит до дальних стендов.",
            "Тяжёлая техника ставится только на асфальтированную часть открытой площадки.",
            "Место у стойки регистрации и у кофейной точки продаётся дороже — это факт, и мы его не скрываем.",
          ],
        },
        {
          type: "links",
          items: [
            {
              label: "Техническая спецификация",
              href: "/venue/tech-specs/",
              note: "нагрузки, электричество, высота",
            },
            {
              label: "Услуги и прокат",
              href: "/venue/services/",
              note: "застройка, мебель, печать",
            },
            {
              label: "Планировка для экспонента",
              href: "/exhibitors/floor-plan/",
              note: "как выбирается место",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Halls",
          title: "Layouts that carry both a trade show and a festival",
          lead: "Below are the baseline configurations we run for our own shows. They are also the starting point for external organizers: only stand density and stage position change.",
          image: "/images/hall-stand.jpg",
          imageAlt: "SOF EXPO Samarkand exhibition hall with stands",
          actions: [
            { label: "Request the plan (PDF)", href: "/venue/tech-specs/" },
            { label: "Discuss a layout", href: "/contacts/" },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "9–18 m² expo, dense grid",
              text: "Up to 120 stands, 3 m aisles, stage at the entrance, circulation built around two door groups. Used for FOODERA and BUILD PRO.",
            },
            {
              title: "Mixed: hall plus outdoors",
              text: "Light exhibitors indoors, machinery and oversized items on asphalt. One navigation, one visitor entrance, one build schedule.",
            },
            {
              title: "Forum contour",
              text: "Half the hall becomes three zones: stage, stands and soft seating. Works for conferences of 300–400 delegates.",
            },
            {
              title: "Festival format",
              text: "Stage, track or show zone, market, family and food areas. Requires a safety plan and approval with local authorities.",
            },
          ],
        },
        {
          type: "table",
          head: ["Space", "Area", "Capacity", "Notes"],
          rows: [
            [
              "Main exhibition hall",
              "4,400 m²",
              "up to 2,500 visitors at once",
              "climate control, background audio, daylight",
            ],
            [
              "Open-air area",
              "5,000 m²",
              "per event format",
              "asphalt, truck access, optional fencing",
            ],
            [
              "Conference hall",
              "—",
              "up to 350 seats",
              "projection, radio mics, interpretation",
            ],
            [
              "Meeting zones",
              "2 × 40 m²",
              "10–16 people",
              "for matchmaking and chain meetings",
            ],
            ["Cafés", "—", "350 seats", "two quick-service areas on site"],
            [
              "Storage",
              "on request",
              "—",
              "temporary storage for packing and stand material",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "All aisles stay at least three metres wide.",
            "Stage and entrance group are separated — otherwise traffic never reaches the far stands.",
            "Heavy machinery is placed only on the paved part of the open area.",
            "Space next to the reception desk and the coffee point is priced higher — that is normal and we do not hide it.",
          ],
        },
        {
          type: "links",
          items: [
            {
              label: "Technical data sheet",
              href: "/venue/tech-specs/",
              note: "loads, power, height",
            },
            {
              label: "Services and rental",
              href: "/venue/services/",
              note: "build, furniture, print",
            },
            {
              label: "Floor plan for exhibitors",
              href: "/exhibitors/floor-plan/",
              note: "how to pick a spot",
            },
          ],
        },
      ],
    },
  },
  {
    path: "/venue/services/",
    meta: {
      ru: {
        title:
          "Услуги экспоцентра: оборудование, мебель, техника, персонал",
        description:
          "Что можно заказать на время выставки в SOF EXPO Samarkand: стендовые системы, мебель, экраны и звук, печать, электрика, клининг, перевод и хостес, хранение и погрузка.",
      },
      en: {
        title:
          "Venue services: equipment rental, furniture, AV, print and staff",
        description:
          "What to order at SOF EXPO Samarkand for the duration of a show: stand systems, furniture, screens and sound, printing, power, cleaning, interpreting and hostesses, storage and handling.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Сервис",
          title: "Всё, что делает стенд рабочим, заказывается одним бланком",
          lead: "Мы не делим услуги на «обязательные у партнёров» и «только свои». Форма подается до монтажа, позиции подтверждаются вместе со сметой — так на площадке не появляется ситуация «а этого у нас нет».",
          image: "/images/hall-walk.jpg",
          imageAlt: "Зал в день работы: услуги площадки",
          actions: [
            { label: "Заказать услуги", href: "/contacts/" },
            { label: "Скачать бланк заявки", href: "/files/service-order.pdf" },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cube",
              title: "Стендовые системы и застройка",
              text: "Octanorm, Moduli, световые рамы, витрины, стойки. Сборка, демонтаж, хранение до следующего сезона.",
            },
            {
              icon: "seat",
              title: "Мебель",
              text: "Стены, столы, стулья, барные стойки, soft seating, вешала, сейфы для образцов.",
            },
            {
              icon: "audio",
              title: "Техника и звук",
              text: "Телевизоры, проекторы, радиомикрофоны, трибуны, синхронный перевод, оператор, трансляция.",
            },
            {
              icon: "power",
              title: "Электрика и свет",
              text: "Кабель, розетки, автоматы, прожекторы, подсветка полки, отдельное питание для оборудования.",
            },
            {
              icon: "doc",
              title: "Полиграфия и печать",
              text: "Каталоги, листовки, бейджи, баннеры, рол-апы, печать по вашим макетам и проверка макетов.",
            },
            {
              icon: "users",
              title: "Персонал",
              text: "Хостес, регистрация, промоутеры, переводчики, уборка, грузчики, техник на все дни.",
            },
            {
              icon: "shield",
              title: "Безопасность",
              text: "Контроль доступа, ночная охрана, хранение ценностей, план эвакуации и инструктаж.",
            },
            {
              icon: "truck",
              title: "Логистика на месте",
              text: "Встреча фуры, разгрузка, перемещение, упаковка, вывоз после демонтажа.",
            },
            {
              icon: "cup",
              title: "Кейтеринг",
              text: "Кофе-брейки, обеды для команды, фуршет для открытия, вода на стенд.",
            },
          ],
        },
        {
          type: "table",
          head: ["Услуга", "Единица", "Когда заказывать", "Комментарий"],
          rows: [
            [
              "Застройка Octanorm",
              "за м²",
              "за 30 дней",
              "пакет со светом, полкой и вывеской",
            ],
            [
              "Мебель",
              "за предмет",
              "за 14 дней",
              "доставка на стенд в ночь монтажа",
            ],
            [
              "ТВ / проектор",
              "за сутки",
              "за 7 дней",
              "подключение к презентации — бесплатно",
            ],
            [
              "Электричество 380 В",
              "за точку",
              "за 21 день",
              "нужна схема потребления оборудования",
            ],
            [
              "Перевод синхронный",
              "за сессию",
              "за 14 дней",
              "кабины, наушники, инженер",
            ],
            [
              "Хостес / регистрация",
              "за смену",
              "за 10 дней",
              "скрипт и бейджи готовим вместе",
            ],
            [
              "Уборка",
              "за день",
              "включено в пакет",
              "расширенный клининг — по заявке",
            ],
            [
              "Хранение после демонтажа",
              "за м²/сутки",
              "за 3 дня",
              "до следующего события у нас на складе",
            ],
          ],
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Регламент",
          title: "Монтаж — 1 день, работа — 3, демонтаж — полдня",
          text: "Монтажные дни согласуются в договоре: заезд и разгрузка — по графику площадки, проверка технадзора — перед открытием. Работа в ночную смену — по отдельному согласованию.",
          action: {
            label: "Получить регламент площадки",
            href: "/organizers/checklist/",
          },
        },
        {
          type: "links",
          items: [
            {
              label: "Пакеты участия",
              href: "/exhibitors/packages/",
              note: "что входит в ставку",
            },
            {
              label: "Строительство стендов",
              href: "/exhibitors/stand-construction/",
              note: "типы застройки",
            },
            {
              label: "Ставки аренды",
              href: "/organizers/rates/",
              note: "для организаторов",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Services",
          title: "Everything that makes a stand work is ordered on one form",
          lead: 'We do not split services into "mandatory via partners" and "ours only". The order form goes in before build-up and every line is confirmed with the quote — so nothing is missing on site.',
          image: "/images/hall-walk.jpg",
          imageAlt: "Hall on a working day: venue services",
          actions: [
            { label: "Order services", href: "/contacts/" },
            {
              label: "Download the order form",
              href: "/files/service-order.pdf",
            },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cube",
              title: "Stand systems and build",
              text: "Octanorm, Moduli, lighting frames, showcases, counters. Assembly, dismantle and storage until the next season.",
            },
            {
              icon: "seat",
              title: "Furniture",
              text: "Tables, chairs, bar counters, soft seating, hangers, lockers for samples.",
            },
            {
              icon: "audio",
              title: "AV and sound",
              text: "Screens, projectors, radio microphones, podiums, simultaneous interpreting, technician, streaming.",
            },
            {
              icon: "power",
              title: "Power and lighting",
              text: "Cable, sockets, breakers, spotlights, shelf lighting, separate feed for your equipment.",
            },
            {
              icon: "doc",
              title: "Print",
              text: "Catalogues, leaflets, badges, banners, roll-ups, printing from your artwork and artwork checks.",
            },
            {
              icon: "users",
              title: "Staff",
              text: "Hostesses, registration desk, promo crew, interpreters, cleaning, handlers, a technician for all days.",
            },
            {
              icon: "shield",
              title: "Security",
              text: "Access control, night guard, valuables storage, evacuation plan and briefing.",
            },
            {
              icon: "truck",
              title: "On-site logistics",
              text: "Truck pickup, unloading, moves, packing and removal after dismantle.",
            },
            {
              icon: "cup",
              title: "Catering",
              text: "Coffee breaks, team lunches, opening reception, water at the stand.",
            },
          ],
        },
        {
          type: "table",
          head: ["Service", "Unit", "Order by", "Note"],
          rows: [
            [
              "Octanorm build",
              "per m²",
              "30 days ahead",
              "package with lighting, shelf and fascia",
            ],
            [
              "Furniture",
              "per item",
              "14 days ahead",
              "delivered to the stand on build night",
            ],
            [
              "Screen / projector",
              "per day",
              "7 days ahead",
              "free connection to your deck",
            ],
            [
              "380 V power",
              "per point",
              "21 days ahead",
              "we need your equipment load sheet",
            ],
            [
              "Simultaneous interpreting",
              "per session",
              "14 days ahead",
              "booths, headsets, engineer",
            ],
            [
              "Hostess / registration",
              "per shift",
              "10 days ahead",
              "script and badges prepared together",
            ],
            [
              "Cleaning",
              "per day",
              "included in the package",
              "extended cleaning on request",
            ],
            [
              "Storage after dismantle",
              "per m²/day",
              "3 days ahead",
              "kept at our warehouse until your next show",
            ],
          ],
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Regulation",
          title: "One build-up day, three show days, half a day to dismantle",
          text: "Build days are fixed in the contract: arrivals and unloading follow the venue schedule, the safety check happens before the doors open. Night build-up is agreed separately.",
          action: {
            label: "Get the venue regulations",
            href: "/organizers/checklist/",
          },
        },
        {
          type: "links",
          items: [
            {
              label: "Participation packages",
              href: "/exhibitors/packages/",
              note: "what the rate includes",
            },
            {
              label: "Stand construction",
              href: "/exhibitors/stand-construction/",
              note: "build types",
            },
            {
              label: "Rental rates",
              href: "/organizers/rates/",
              note: "for organizers",
            },
          ],
        },
      ],
    },
  },
  {
    path: "/venue/tech-specs/",
    meta: {
      ru: {
        title:
          "Техническая спецификация SOF EXPO Samarkand: площади, нагрузка, электричество",
        description:
          "Технические данные выставочного центра: 4 400 м² зала, 5 000 м² улицы, мощность 700 кВт, 220/380 В, подъезд фур, регламент монтажа, требования к застройке. Скачать datasheet.",
      },
      en: {
        title:
          "Technical data sheet of SOF EXPO Samarkand — areas, loads, power",
        description:
          "Venue technical data: 4,400 m² hall, 5,000 m² outdoor, 700 kW capacity, 220/380 V, truck access, build-up rules and stand requirements. Download the datasheet.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Для инженеров и застройщиков",
          title: "Техническая спецификация площадки",
          lead: "Полный datasheet высылаем по запросу в PDF с чертежами; здесь — основные параметры, которых хватает для предварительного расчёта застройки.",
          actions: [
            { label: "Запросить datasheet с чертежами", href: "/contacts/" },
          ],
          image: "/images/hero-hall.jpg",
          imageAlt: "Экспозиционный зал",
        },
        {
          type: "table",
          head: ["Параметр", "Значение"],
          rows: [
            ["Крытая площадь", "4 400 м²"],
            ["Открытая площадь", "5 000 м², асфальтовое покрытие"],
            ["Установленная мощность", "700 кВт"],
            ["Напряжение", "220 / 380 В, 50 Гц"],
            [
              "Электроточки на стенд",
              "1 × 16 А в базовом пакете; дополнительно 32 А, 63 А",
            ],
            ["Высота потолка", "по запросу (datasheet)"],
            ["Допустимая нагрузка на пол", "по запросу (datasheet)"],
            [
              "Пожарные требования",
              "негорючие материалы для перегородок, отсутствие открытого огня вне согласованных зон",
            ],
            [
              "Максимальная высота стенда",
              "6 м в зале при застройке под проект (по согласованию)",
            ],
            ["Подъезд транспорта", "фура до разгрузочной зоны, кран по заявке"],
            ["Интернет", "Wi-Fi по всей территории, LAN-подключение к стенду"],
            [
              "Вентиляция и климат",
              "приточно-вытяжная система, обогрев и охлаждение",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Схема электропотребления подаётся вместе с заявкой на застройку.",
            "Все материалы стенда должны иметь сертификаты горючести по запросу технадзора.",
            "Крепеж к конструкциям зала не допускается — только собственная стойкость стенда.",
            "Разгрузка фур планируется окном монтажа; отдельная ночная разгрузка согласуется заранее.",
          ],
        },
        {
          type: "files",
          items: [
            {
              title: "Datasheet площадки (PDF)",
              href: "/files/sof-expo-technical-datasheet.pdf",
              note: "чертежи, сечения, электрические схемы",
              kind: "pdf",
            },
            {
              title: "Регламент монтажа и демонтажа",
              href: "/files/sof-expo-regulations.pdf",
              note: "окна, требования, контакты технадзора",
              kind: "pdf",
            },
            {
              title: "Форма заказа услуг",
              href: "/files/service-order.pdf",
              note: "мебель, техника, персонал",
              kind: "pdf",
            },
          ],
        },
        {
          type: "links",
          items: [
            {
              label: "Услуги и прокат",
              href: "/venue/services/",
              note: "полный перечень",
            },
            {
              label: "Строительство стендов",
              href: "/exhibitors/stand-construction/",
              note: "варианты застройки",
            },
            {
              label: "Ставки аренды",
              href: "/organizers/rates/",
              note: "стоимость площади",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "For engineers and contractors",
          title: "Venue technical data sheet",
          lead: "The full datasheet with drawings goes out as a PDF on request; below are the parameters enough for a preliminary stand calculation.",
          actions: [{ label: "Request the datasheet", href: "/contacts/" }],
          image: "/images/hero-hall.jpg",
          imageAlt: "Exhibition hall",
        },
        {
          type: "table",
          head: ["Parameter", "Value"],
          rows: [
            ["Indoor area", "4,400 m²"],
            ["Outdoor area", "5,000 m², paved"],
            ["Installed capacity", "700 kW"],
            ["Supply", "220 / 380 V, 50 Hz"],
            [
              "Stand power point",
              "1 × 16 A in the base package; 32 A and 63 A on request",
            ],
            ["Ceiling height", "on request (datasheet)"],
            ["Floor load", "on request (datasheet)"],
            [
              "Fire rules",
              "non-combustible partition materials, no open flame outside approved zones",
            ],
            [
              "Max stand height",
              "6 m indoors for custom builds, subject to approval",
            ],
            ["Vehicle access", "truck to the unloading zone, crane on request"],
            ["Internet", "site-wide Wi-Fi, LAN drop to the stand"],
            [
              "Ventilation and climate",
              "supply and exhaust system with heating and cooling",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "The power consumption diagram is filed together with the build application.",
            "Stand materials must carry flammability certificates when asked by the safety officer.",
            "Fixing to hall structures is not allowed — stands must be self-supporting.",
            "Truck unloading is planned inside the build window; separate night unloading needs approval.",
          ],
        },
        {
          type: "files",
          items: [
            {
              title: "Venue datasheet (PDF)",
              href: "/files/sof-expo-technical-datasheet.pdf",
              note: "drawings, sections, power diagrams",
              kind: "pdf",
            },
            {
              title: "Build-up and dismantle regulations",
              href: "/files/sof-expo-regulations.pdf",
              note: "windows, requirements, safety contact",
              kind: "pdf",
            },
            {
              title: "Service order form",
              href: "/files/service-order.pdf",
              note: "furniture, tech, staff",
              kind: "pdf",
            },
          ],
        },
        {
          type: "links",
          items: [
            {
              label: "Services and rental",
              href: "/venue/services/",
              note: "full list",
            },
            {
              label: "Stand construction",
              href: "/exhibitors/stand-construction/",
              note: "build options",
            },
            {
              label: "Rental rates",
              href: "/organizers/rates/",
              note: "space pricing",
            },
          ],
        },
      ],
    },
  },
  {
    path: "/venue/how-to-get-there/",
    meta: {
      ru: {
        title:
          "Как добраться до SOF EXPO Samarkand — адрес, трансфер, парковка",
        description:
          "Джамбайский район Самарканда: 16 км от аэропорта, 23 км от вокзала. Маршрут на авто, такси и автобусе, парковка, въезд делегаций и заказ трансфера.",
      },
      en: {
        title: "Getting to SOF EXPO Samarkand — address, transfer, parking",
        description:
          "The centre is in Samarkand region (Dzhambay district): 16 km from the airport, 23 km from the station. Car, taxi and coach routes, parking and delegation transfer.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Логистика",
          title: "16 км от аэропорта, 23 км от вокзала",
          lead: "Центр стоит на выезде из Самарканда, поэтому до нас одинаково удобно ехать и из города, и напрямую из аэропорта — без транзита через центр. Парковка при въезде, свободная, без оплаты.",
          image: "/images/samarkand-real.jpg",
          imageAlt: "Регистан в Самарканде",
          actions: [
            {
              label: "Открыть в картах",
              href: "https://www.google.com/maps/search/?api=1&query=SOF%20EXPO%20Samarkand",
            },
            { label: "Заказать трансфер", href: "/contacts/" },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "plane",
              title: "Самолёт",
              text: "Аэропорт Самарканда (SKD), 16 км. Трансфер от организатора — микроавтобус на делегацию, подача к терминалу по списку рейсов.",
            },
            {
              icon: "train",
              title: "Поезд",
              text: "Вокзал Самарканд, 23 км. Быстрые составы Ташкент — Самарканд; для групп заказываем автобус к перрону.",
            },
            {
              icon: "car",
              title: "Автомобиль",
              text: "Выезд из города в сторону Джамбайского района; парковка при въезде в центр, места для автобусов и фур.",
            },
            {
              icon: "truck",
              title: "Грузовой транспорт",
              text: "Разгрузка у ворот зала в окно монтажа. Скажите заранее массу и габариты — подготовим кран и площадку.",
            },
            {
              icon: "seat",
              title: "Отели рядом",
              text: "Отель-партнёр Reikartz даёт участникам выставок скидку 15%; полный список — на странице для посетителей.",
            },
            {
              icon: "users",
              title: "Автобусные группы",
              text: "Для школ, кластеров и делегаций компаний — отдельный вход и регистрация, координатор на месте.",
            },
          ],
        },
        {
          type: "table",
          head: ["Откуда", "Расстояние", "Время", "Как проще всего"],
          rows: [
            ["Аэропорт Самарканда", "16 км", "20 мин", "трансфер или такси"],
            [
              "Ж/д вокзал Самарканда",
              "23 км",
              "35 мин",
              "трансфер для делегаций, такси",
            ],
            [
              "Центр Самарканда (Регистан)",
              "~12 км",
              "20 мин",
              "авто или такси",
            ],
            [
              "Ташкент",
              "~275 км",
              "1 ч 40 мин скоростным поездом",
              "поезд + трансфер",
            ],
            [
              "Термез (граница с Афганистаном)",
              "~330 км",
              "4–5 ч",
              "авто, доставка фурой",
            ],
            ["Бухара", "~270 км", "3 ч", "авто или поезд"],
          ],
        },
        {
          type: "callout",
          kicker: "На месте",
          title: "Парковка, гардероб, навигация",
          text: "Парковка бесплатная и находится при въезде в центр. Внутри — стойка информации, навигация по разделам, зона ожидания и два кафе на 350 мест.",
          action: {
            label: "Смотреть раздел для посетителей",
            href: "/visitors/",
          },
        },
        {
          type: "links",
          items: [
            {
              label: "Посетителям: билеты и регистрация",
              href: "/visitors/tickets/",
            },
            { label: "Проезд, отели, визы", href: "/visitors/travel/" },
            { label: "Доступная среда", href: "/visitors/access/" },
          ],
        },
        {
          type: "faq",
          items: [
            { q: "Сколько ехать от аэропорта?", a: "16 км, около 20 минут на машине без въезда в центр города. Делегациям организуем трансфер." },
            { q: "Парковка платная?", a: "Нет, парковка бесплатная и находится прямо у въезда; есть места для автобусов и грузовиков." },
            { q: "Есть ли скидка в гостинице?", a: "Партнёрский отель Reikartz даёт участникам SOF EXPO скидку 15% — назовите код выставки при бронировании." },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Logistics",
          title: "16 km from the airport, 23 km from the station",
          lead: "The centre sits on the outbound side of Samarkand, so it is equally easy to reach from the city and straight from the airport without crossing the centre. Parking is at the gate, free and open.",
          image: "/images/samarkand-real.jpg",
          imageAlt: "Registan in Samarkand",
          actions: [
            {
              label: "Open in Maps",
              href: "https://www.google.com/maps/search/?api=1&query=SOF%20EXPO%20Samarkand",
            },
            { label: "Book a transfer", href: "/contacts/" },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "plane",
              title: "By air",
              text: "Samarkand International (SKD), 16 km. Organizer transfer — a minibus per delegation, met at the terminal against the flight list.",
            },
            {
              icon: "train",
              title: "By rail",
              text: "Samarkand station, 23 km. High-speed trains from Tashkent; for groups we arrange a coach at the platform.",
            },
            {
              icon: "car",
              title: "By car",
              text: "Out of the city towards Dzhambay district; parking at the centre entrance, spaces for coaches and trucks.",
            },
            {
              icon: "truck",
              title: "Freight",
              text: "Unloading at the hall doors inside the build window. Send weight and dimensions in advance and we prepare a crane and a pad.",
            },
            {
              icon: "seat",
              title: "Hotels nearby",
              text: "Partner hotel Reikartz gives exhibition participants 15% off; the full list is on the visitor page.",
            },
            {
              icon: "users",
              title: "Group coaches",
              text: "Schools, clusters and company delegations get a separate entrance, priority registration and an on-site coordinator.",
            },
          ],
        },
        {
          type: "table",
          head: ["From", "Distance", "Time", "Easiest way"],
          rows: [
            ["Samarkand airport", "16 km", "20 min", "transfer or taxi"],
            [
              "Samarkand railway station",
              "23 km",
              "35 min",
              "delegation transfer, taxi",
            ],
            ["Samarkand centre (Registan)", "~12 km", "20 min", "car or taxi"],
            [
              "Tashkent",
              "~275 km",
              "1 h 40 min by high-speed train",
              "train + transfer",
            ],
            [
              "Termez (Afghan border)",
              "~330 km",
              "4–5 h",
              "car, truck delivery",
            ],
            ["Bukhara", "~270 km", "3 h", "car or train"],
          ],
        },
        {
          type: "callout",
          kicker: "On site",
          title: "Parking, cloakroom, wayfinding",
          text: "Parking is free and right at the entrance. Inside there is an information desk, section wayfinding, a waiting area and two cafés for 350 guests.",
          action: { label: "Visitor section", href: "/visitors/" },
        },
        {
          type: "links",
          items: [
            {
              label: "Visitors: tickets and registration",
              href: "/visitors/tickets/",
            },
            { label: "Travel, hotels, visas", href: "/visitors/travel/" },
            { label: "Accessibility", href: "/visitors/access/" },
          ],
        },
        {
          type: "faq",
          items: [
            { q: "How far is the airport?", a: "16 km, about 20 minutes by car without crossing the city centre. We arrange transfers for delegations." },
            { q: "Is parking paid?", a: "No, parking is free and right at the entrance, with spaces for coaches and trucks." },
            { q: "Is there a hotel discount?", a: "Partner hotel Reikartz gives SOF EXPO participants 15% off — mention the exhibition code when booking." },
          ],
        },
      ],
    },
  },
  {
    path: "/venue/gallery/",
    meta: {
      ru: {
        title: "Фото и видео выставочного центра SOF EXPO Samarkand",
        description:
          "Экспозиции, монтажные дни, деловая программа и открытая площадка: фотоматериалы центра для прессы, организаторов и экспонентов.",
      },
      en: {
        title: "Photos and video of SOF EXPO Samarkand",
        description:
          "Exhibitions, build days, business programme and the open area — image material for press, organizers and exhibitors.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Медиа",
          title: "Как площадка выглядит в работе",
          lead: "Съёмка делается в реальные дни монтажа и работы выставок: без рендеров и постановочных интерьеров. Материалы в высоком разрешении — по запросу для прессы и партнёров.",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/hall-stand.jpg",
              caption: "Главный зал: экспозиция и переговорные зоны",
            },
            {
              src: "/images/hall-crowd.jpg",
              caption: "День выставки: поток посетителей в главном зале",
            },
            {
              src: "/images/venue-exterior.jpg",
              caption: "Входная группа и парковка",
            },
            {
              src: "/images/conference-audience.jpg",
              caption: "Конференц-зал во время деловой программы",
            },
            {
              src: "/images/food-tasting.jpg",
              caption: "FOODERA EXPO: дегустационный стенд",
            },
            {
              src: "/images/food-tasting-counter.jpg",
              caption: "FOODERA EXPO: дегустационная линия",
            },
            {
              src: "/images/hall-walk.jpg",
              caption: "Проход между стендами в главный зал",
            },
            {
              src: "/images/hall-empty.jpg",
              caption: "Зал 4 400 м² без застройки: шаг колонн и высота потолка",
            },
            {
              src: "/images/hall-windows.jpg",
              caption: "Витражи и ворота для заезда техники",
            },
            {
              src: "/images/outdoor-area.jpg",
              caption: "Открытая площадка 5 000 м²: крупногабаритная техника",
            },
            {
              src: "/images/stand-green.jpg",
              caption: "Индивидуальная застройка стенда",
            },
            {
              src: "/images/officials-tour.jpg",
              caption: "Официальная делегация на обходе экспозиции",
            },
            {
              src: "/images/venue-facade.jpg",
              caption: "Фасад павильона и рекламные носители",
            },
            {
              src: "/images/machinery-outdoor.jpg",
              caption: "Крупногабаритная техника на открытой площадке",
            },
            {
              src: "/images/stand-agro.jpg",
              caption: "Стенд агротехники: демонстрация мотоблоков и навесного",
            },
            {
              src: "/images/visitors-flowers.jpg",
              caption: "Цветочная экспозиция: посетители на садовом разделе",
            },
            {
              src: "/images/samarkand.jpg",
              caption: "Самарканд: город, в который приезжает аудитория выставок",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Хотите кадры под публикацию или презентацию? Напишите нам — вышлем архив в исходном разрешении и краткую фактшит-справку о центре.",
          ],
          list: [
            "Разрешение для прессы — бесплатно с указанием источника.",
            "Для партнёров — по письму на info@sofexpo.uz.",
            "Съёмка на площадке стороннего организатора — по согласованию с ним.",
          ],
        },
        {
          type: "files",
          items: [
            {
              title: "Видеоканал центра на YouTube",
              href: "https://www.youtube.com/channel/UCNPRKCh6okafi4EBLR2LvKg",
              note: "репортажи с выставок",
              kind: "video",
            },
            {
              title: "Telegram-канал SOF EXPO",
              href: "https://t.me/sofexpo",
              note: "анонсы и фотоотчёты",
              kind: "link",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Media",
          title: "What the venue looks like in operation",
          lead: "The photos are taken on real build and show days — no renders, no staged interiors. High-resolution files are available for press and partners on request.",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/hall-stand.jpg",
              caption: "Main hall: expo and meeting zones",
            },
            {
              src: "/images/hall-crowd.jpg",
              caption: "Show day: visitor flow in the main hall",
            },
            {
              src: "/images/venue-exterior.jpg",
              caption: "Entrance and parking",
            },
            {
              src: "/images/conference-audience.jpg",
              caption: "Conference hall during the business programme",
            },
            {
              src: "/images/food-tasting.jpg",
              caption: "FOODERA EXPO: tasting stand",
            },
            {
              src: "/images/food-tasting-counter.jpg",
              caption: "FOODERA EXPO: tasting line",
            },
            {
              src: "/images/hall-walk.jpg",
              caption: "Aisle between stands to the main hall",
            },
            {
              src: "/images/hall-empty.jpg",
              caption: "The 4,400 m² hall before build-up: column grid and clear height",
            },
            {
              src: "/images/hall-windows.jpg",
              caption: "Glazing and the drive-in gates",
            },
            {
              src: "/images/outdoor-area.jpg",
              caption: "The 5,000 m² open-air area: large machinery",
            },
            {
              src: "/images/stand-green.jpg",
              caption: "Custom stand build",
            },
            {
              src: "/images/officials-tour.jpg",
              caption: "An official delegation touring the exhibition",
            },
            {
              src: "/images/venue-facade.jpg",
              caption: "Pavilion facade and advertising carriers",
            },
            {
              src: "/images/machinery-outdoor.jpg",
              caption: "Large machinery on the open-air area",
            },
            {
              src: "/images/stand-agro.jpg",
              caption: "Agri-machinery stand: power tillers and implements on show",
            },
            {
              src: "/images/visitors-flowers.jpg",
              caption: "Horticulture display: visitors in the garden section",
            },
            {
              src: "/images/samarkand.jpg",
              caption: "Samarkand: the city the show audience travels to",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Need frames for a publication or a deck? Write to us and we send the full-resolution archive plus a short fact sheet about the centre.",
          ],
          list: [
            "Press use is free with credit.",
            "For partners — by email to info@sofexpo.uz.",
            "Filming a third-party organizer show requires their approval.",
          ],
        },
        {
          type: "files",
          items: [
            {
              title: "YouTube channel",
              href: "https://www.youtube.com/channel/UCNPRKCh6okafi4EBLR2LvKg",
              note: "show reports",
              kind: "video",
            },
            {
              title: "Telegram channel",
              href: "https://t.me/sofexpo",
              note: "announcements and photo reports",
              kind: "link",
            },
          ],
        },
      ],
    },
  },
];
