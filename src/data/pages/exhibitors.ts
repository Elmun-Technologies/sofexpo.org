import type { PageDef } from "./types";

const P = (p: PageDef) => p;

export const exhibitorPages: PageDef[] = [
  P({
    path: "/exhibitors/",
    meta: {
      ru: {
        title:
          "Экспонентам SOF EXPO Samarkand: участие, пакеты, подготовка, аудитория",
        description:
          "Зачем участвовать в выставках в Узбекистане: профиль аудитории, форматы стендов, что входит в ставку, сроки подачи заявок, помощь с логистикой, сертификацией и персоналом.",
      },
      en: {
        title:
          "For exhibitors at SOF EXPO Samarkand: participation, packages, audience",
        description:
          "Why exhibit in Uzbekistan: audience profile, stand formats, what the rate includes, application deadlines, help with logistics, certification and staff.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Экспонентам",
          title: "Три дня, которые закрывают квартальный план по контактам",
          lead: "Выставка у нас — это не аренда метров, а собранный рынок: закупщики сетей, дистрибьюторы, подрядчики, архитекторы, агрономы и селлеры, которым нужен поставщик. Мы отвечаем за аудиторию и сервис, вы — за переговоры.",
          bullets: [
            "Ответ по заявке — 24 часа",
            "Профиль аудитории и план зала до договора",
            "Ставка включает мебель, электричество и брендирование",
          ],
          actions: [
            { label: "Получить прайс и план зала", href: "/request-stand/" },
            { label: "Пакеты участия", href: "/exhibitors/packages/" },
          ],
          image: "/images/hall-stand.jpg",
          imageAlt: "Выставочный зал: стенды и поток посетителей",
        },
        {
          type: "stats",
          items: [
            {
              value: "70 000+",
              ru: "посетителей в год на всех выставках",
              en: "visitors a year across the shows",
            },
            {
              value: "80+",
              ru: "компаний на крупной выставке",
              en: "companies at a major show",
            },
            {
              value: "1 600+",
              ru: "профильных посетителей (BUILD PRO 2025)",
              en: "trade visitors (BUILD PRO 2025)",
            },
            {
              value: "24 ч",
              ru: "среднее время ответа менеджера",
              en: "average manager response time",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Календарь",
          title: "Выберите свою выставку",
          text: "Продажа площади открывается за 4–6 месяцев до даты: лучшие локации разбирают в первый месяц.",
        },
        {
          type: "rail",
          railCount: 4,
        },
        {
          type: "h2",
          kicker: "Зачем ехать",
          title: "Что даёт участие, кроме стенда",
          text: "Ниже — то, ради чего компании берут бюджет на поездку в Самарканд.",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "handshake",
              title: "Живые переговоры",
              text: "Закупщик сети или подрядчик принимает решение быстрее, когда видел продукт и держал его в руках.",
            },
            {
              icon: "globe",
              title: "Дистрибьюторы",
              text: "Рынок Узбекистана растёт на импортозамещении: сети и оптовики ищут локальные и региональные бренды.",
            },
            {
              icon: "chart",
              title: "Тест спроса",
              text: "Три дня на выставке дают больше честной обратной связи, чем месяц опросов: видно цену, упаковку и реакцию.",
            },
            {
              icon: "star",
              title: "Презентация новинки",
              text: "Сцена деловой программы и профессиональная аудитория — запуск продукта без аренды отдельного зала.",
            },
            {
              icon: "users",
              title: "База контактов",
              text: "После выставки вы получаете отчёт организатора и свою статистику посещений стенда.",
            },
            {
              icon: "shield",
              title: "Госпрограммы",
              text: "На отраслевых выставках присутствуют банки, лизинг и регуляторы: субсидии и компенсации затрат.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Площадка",
          title: "Так выглядят дни выставки",
          text: "Съёмка делается в реальные дни монтажа и работы выставок — без рендеров и постановочных интерьеров.",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/hall-crowd.jpg",
              caption: "День выставки: поток посетителей в главном зале",
            },
            {
              src: "/images/hall-walk.jpg",
              caption: "Проход между стендами",
            },
            {
              src: "/images/conference-audience.jpg",
              caption: "Конференц-зал во время деловой программы",
            },
            {
              src: "/images/food-tasting.jpg",
              caption: "FOODERA EXPO: дегустационная линия",
            },
            {
              src: "/images/stand-agro-chem.jpg",
              caption: "Стенд агрохимии: продукция на полках и консультанты",
            },
            {
              src: "/images/stand-fertilizer.jpg",
              caption: "Стенд производителя удобрений: демонстрация линейки",
            },
            {
              src: "/images/stand-industrial.jpg",
              caption: "Промышленный стенд: оборудование в рабочем виде",
            },
            {
              src: "/images/stand-modern.jpg",
              caption: "Индивидуальная застройка: остров с переговорной зоной",
            },
            {
              src: "/images/buyers-talk.jpg",
              caption: "Переговоры закупщика с экспонентом на стенде",
            },
            {
              src: "/images/hall-aisle-red.jpg",
              caption: "Центральный проход зала в день работы выставки",
            },
          ],
        },
        {
          type: "table",
          head: ["Кто приходит", "Что решает на выставке", "Как подготовиться"],
          rows: [
            [
              "Розничные сети и байеры",
              "ввод SKU, условия, дегустация",
              "прайс, упаковка, документы, пробная партия",
            ],
            [
              "Дистрибьюторы и опт",
              "эксклюзив, отсрочка, логистика",
              "условия территории, склад, кейсы",
            ],
            [
              "Подрядчики и девелоперы",
              "спецификации, поставка на объект",
              "образцы, техкарты, сроки",
            ],
            [
              "Архитекторы и дизайнеры",
              "ассортимент для проектов",
              "визуализация, каталог, выборка",
            ],
            [
              "Фермеры и кластеры",
              "техника, орошение, семена",
              "демо, расчёт окупаемости, лизинг",
            ],
            [
              "Селлеры маркетплейсов",
              "контрактное производство",
              "минимальная партия, цена, фото",
            ],
          ],
        },
        {
          type: "steps",
          items: [
            {
              title: "Заявка",
              text: "Указываете выставку, направление и желаемую площадь. Это ни к чему не обязывает: места держим 3–5 дней.",
            },
            {
              title: "Предложение",
              text: "Присылаем план зала со свободными местами, ставку, состав пакета и профиль аудитории.",
            },
            {
              title: "Договор и счёт",
              text: "Фиксируем локацию. Оплата — по графику, для компаний из стран СНГ работаем по договору без предоплаты по согласованию.",
            },
            {
              title: "Подготовка",
              text: "Согласуем застройку, услуги, материалы и демо-сценарий. Отдельно — регистрация персонала и бейджи.",
            },
            {
              title: "Выставка и отчёт",
              text: "Работаем три дня. Через две недели — статистика, контакты, фото и выводы по локации.",
            },
          ],
        },
        {
          type: "links",
          title: "Дальше по разделу",
          items: [
            { label: "Пакеты участия и ставки", href: "/exhibitors/packages/" },
            {
              label: "Планировка и выбор места",
              href: "/exhibitors/floor-plan/",
            },
            {
              label: "Строительство стендов",
              href: "/exhibitors/stand-construction/",
            },
            {
              label: "Услуги на время выставки",
              href: "/exhibitors/services/",
            },
            {
              label: "Спонсорство и реклама",
              href: "/exhibitors/sponsorship/",
            },
            {
              label: "Документы и ключевые даты",
              href: "/exhibitors/documents/",
            },
            { label: "Каталог участников", href: "/exhibitors/catalogue/" },
            { label: "FAQ экспонента", href: "/exhibitors/faq/" },
          ],
        },
        {
          type: "quiz",
          title: "Подберём стенд за 4 шага",
          text: "Четыре вопроса — и менеджер пришлёт план зала, свободные метры и расчёт пакета.",
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "Заявка на стенд",
          text: "Подберём место под задачу и пришлём расчёт. Без оплаты на этом шаге.",
          directions: [
            "Продукты питания",
            "Напитки",
            "Строительные материалы",
            "Техника и оборудование",
            "Агро",
            "Авто",
            "E-commerce и ритейл",
            "Образование",
            "Услуги",
            "Другое",
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "For exhibitors",
          title: "Three days that close a quarterly contact plan",
          lead: "Exhibiting here is not renting metres — it is a market assembled in one hall: chain buyers, distributors, contractors, architects, agronomists and marketplace sellers who need a supplier. We own the audience and the service; you own the negotiation.",
          bullets: [
            "Reply within 24 hours",
            "Audience profile and floor plan before the contract",
            "Rate includes furniture, power and branding",
          ],
          actions: [
            { label: "Get rates and floor plan", href: "/request-stand/" },
            { label: "Participation packages", href: "/exhibitors/packages/" },
          ],
          image: "/images/hall-stand.jpg",
          imageAlt: "Exhibition hall with stands and foot traffic",
        },
        {
          type: "stats",
          items: [
            {
              value: "70 000+",
              ru: "visitors a year across shows",
              en: "visitors a year across the shows",
            },
            {
              value: "80+",
              ru: "companies at a major show",
              en: "companies at a major show",
            },
            {
              value: "1 600+",
              ru: "trade visitors (BUILD PRO 2025)",
              en: "trade visitors (BUILD PRO 2025)",
            },
            {
              value: "24 h",
              ru: "average manager response",
              en: "average manager response time",
            },
          ],
        },
        {
          type: "h2",
          kicker: "Calendar",
          title: "Pick your show",
          text: "Floor sales open 4–6 months before the date: the best positions go in the first month.",
        },
        {
          type: "rail",
          railCount: 4,
        },
        {
          type: "h2",
          kicker: "Why go",
          title: "What participation delivers besides a stand",
          text: "The reasons companies allocate a travel budget to Samarkand.",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "handshake",
              title: "Live negotiation",
              text: "A chain buyer or contractor decides faster after holding the product.",
            },
            {
              icon: "globe",
              title: "Distributors",
              text: "The Uzbek market is actively looking for local and regional brands to replace imports.",
            },
            {
              icon: "chart",
              title: "Demand test",
              text: "Three days on a stand give more honest feedback than a month of surveys: price, packaging, reaction.",
            },
            {
              icon: "star",
              title: "Launch a new product",
              text: "A business-programme slot and a professional audience — a launch without renting a separate venue.",
            },
            {
              icon: "users",
              title: "Contact database",
              text: "After the show you receive the organizer report plus your own stand traffic statistics.",
            },
            {
              icon: "shield",
              title: "Public programmes",
              text: "Banks, leasing companies and regulators attend industry shows: subsidies and cost compensation.",
            },
          ],
        },
        {
          type: "h2",
          kicker: "The venue",
          title: "What show days look like",
          text: "Shot on real build-up and show days — no renders, no staged interiors.",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/hall-crowd.jpg",
              caption: "Show day: visitor flow in the main hall",
            },
            {
              src: "/images/hall-walk.jpg",
              caption: "Aisle between stands",
            },
            {
              src: "/images/conference-audience.jpg",
              caption: "Conference hall during the business programme",
            },
            {
              src: "/images/food-tasting.jpg",
              caption: "FOODERA EXPO: tasting line",
            },
                      {
              src: "/images/stand-agro-chem.jpg",
              caption: "Agrochemistry stand: product on the shelves and consultants on hand",
            },
            {
              src: "/images/stand-fertilizer.jpg",
              caption: "Fertiliser maker's stand: the range on display",
            },
            {
              src: "/images/stand-industrial.jpg",
              caption: "Industrial stand: equipment shown in working condition",
            },
            {
              src: "/images/stand-modern.jpg",
              caption: "Custom build: an island stand with a meeting area",
            },
            {
              src: "/images/buyers-talk.jpg",
              caption: "A buyer in conversation with an exhibitor",
            },
            {
              src: "/images/hall-aisle-red.jpg",
              caption: "The central aisle of the hall on show day",
            },
],
        },
        {
          type: "table",
          head: ["Who comes", "What they decide at the show", "How to prepare"],
          rows: [
            [
              "Retail chains and buyers",
              "SKU introduction, terms, tasting",
              "price list, packaging, documents, trial batch",
            ],
            [
              "Distributors and wholesale",
              "exclusivity, payment terms, logistics",
              "territory terms, warehouse, cases",
            ],
            [
              "Contractors and developers",
              "specifications, site supply",
              "samples, tech sheets, lead times",
            ],
            [
              "Architects and designers",
              "assortment for projects",
              "visuals, catalogue, samples",
            ],
            [
              "Farmers and clusters",
              "machinery, irrigation, seeds",
              "demo, payback calculation, leasing",
            ],
            [
              "Marketplace sellers",
              "contract manufacturing",
              "minimum order, price, photos",
            ],
          ],
        },
        {
          type: "steps",
          items: [
            {
              title: "Application",
              text: "Name the show, your segment and the area you want. Nothing is payable yet; we hold locations for 3–5 days.",
            },
            {
              title: "Proposal",
              text: "We send the floor plan with free spots, the rate, what the package includes and the audience profile.",
            },
            {
              title: "Contract and invoice",
              text: "The location becomes yours on paper. Payment schedule agreed; for CIS companies terms without prepayment are possible.",
            },
            {
              title: "Preparation",
              text: "Build, services, materials and demo scenario are confirmed. Staff registration and badges run separately.",
            },
            {
              title: "Show and report",
              text: "Three working days. Two weeks later: statistics, contacts, photos and a verdict on your location.",
            },
          ],
        },
        {
          type: "links",
          title: "Continue in this section",
          items: [
            { label: "Packages and rates", href: "/exhibitors/packages/" },
            {
              label: "Floor plan and location",
              href: "/exhibitors/floor-plan/",
            },
            {
              label: "Stand construction",
              href: "/exhibitors/stand-construction/",
            },
            { label: "Show services", href: "/exhibitors/services/" },
            {
              label: "Sponsorship and advertising",
              href: "/exhibitors/sponsorship/",
            },
            {
              label: "Documents and deadlines",
              href: "/exhibitors/documents/",
            },
            { label: "Exhibitor catalogue", href: "/exhibitors/catalogue/" },
            { label: "Exhibitor FAQ", href: "/exhibitors/faq/" },
          ],
        },
        {
          type: "quiz",
          title: "Find your stand in four steps",
          text: "Four questions — and the manager sends the hall plan, free metres and the package quote.",
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "Stand request",
          text: "We pick a location around your objective and send the calculation. No payment at this stage.",
          directions: [
            "Food products",
            "Drinks",
            "Building materials",
            "Machinery and equipment",
            "Agriculture",
            "Automotive",
            "E-commerce and retail",
            "Education",
            "Services",
            "Other",
          ],
        },
      ],
    },
  }),
  P({
    path: "/exhibitors/packages/",
    meta: {
      ru: {
        title: "Пакеты участия и ставки на выставках SOF EXPO Samarkand",
        description:
          "Что входит в стандартный стенд 9 м², премиум 18 м², свободную площадь и спонсорский пакет. Сроки раннего бронирования, что оплачивается отдельно, как считается итоговая смета.",
      },
      en: {
        title: "Participation packages and rates at SOF EXPO Samarkand",
        description:
          "What a 9 m² standard stand, 18 m² premium, raw space and sponsorship packages include. Early-booking deadlines, separately charged items, how the final quote is built.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Деньги",
          title: "Четыре пакета и полная прозрачность сметы",
          lead: "Ставки зависят от выставки и сезона, поэтому точный прайс присылает менеджер вместе с планом зала. Ниже — состав пакетов, чтобы вы заранее понимали, за что платите.",
          image: "/images/event-buildpro.jpg",
          imageAlt: "Стенд участника строительной выставки",
        },
        {
          type: "grid",
          cols: 2,
          items: [
            {
              icon: "cube",
              title: "Стандарт 9 м²",
              text: "Застройка Octanorm, вывеска с логотипом, стол, два стула, розетка 220 В, освещение, два бейджа, место в каталоге. Монтаж и демонтаж включены.",
            },
            {
              icon: "star",
              title: "Премиум 18 м²",
              text: "Всё из «стандарта», плюс приоритетная локация, увеличенная рекламная поверхность, витрина, четыре бейджа и 20 секунд ролика на экране зала.",
            },
            {
              icon: "building",
              title: "Свободная площадь от 36 м²",
              text: "Только площадь и подведение электричества. Застройка, согласование проекта, подключение техники — отдельной сметой.",
            },
            {
              icon: "megaphone",
              title: "Спонсорский пакет",
              text: "Сцена и микрофон в деловой программе, брендирование входной группы, сумки участников, кофе-брейк с вашей презентацией, приоритет в анонсах.",
            },
          ],
        },
        {
          type: "table",
          head: [
            "Что входит",
            "Стандарт 9 м²",
            "Премиум 18 м²",
            "Свободная площадь",
          ],
          rows: [
            ["Площадь и локация", "да", "да, приоритет", "да, по плану"],
            ["Застройка и брендирование", "да", "да, расширенное", "нет"],
            ["Мебель", "стол + 2 стула", "стол, 4 стула, витрина", "по заказу"],
            ["Электричество 220 В", "1 точка", "2 точки", "по расчёту"],
            ["Бейджи персонала", "2", "4", "по заявке"],
            ["Строка в каталоге", "да", "да, с блоком", "да"],
            [
              "Пост-отчёт со статистикой",
              "базовый",
              "расширенный",
              "расширенный",
            ],
            [
              "Отдельное питание 380 В",
              "оплата отдельно",
              "оплата отдельно",
              "включено в расчёт",
            ],
          ],
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Экономика",
          title: "Раннее бронирование дешевле на 10–15%",
          text: "Цены сезона фиксируются при подаче заявки до старта общих продаж. Кроме того, ранние участники выбирают лучшие локации — а это влияет на трафик сильнее, чем скидка.",
        },
        {
          type: "rows",
          items: [
            {
              title: "Что считается отдельно",
              text: "Застройка по проекту, дополнительное электричество, телевизоры, мебель сверх пакета, перевод, хостес, печать, доставка образцов, хранение, разгрузка фур, парковка для грузового транспорта.",
            },
            {
              title: "Скидки и поддержки",
              text: "Для коллективных стендов ассоциаций и национальных экспозиций — отдельная тарификация. По ряду отраслей действуют государственные программы компенсации участия: подскажем, как в них попасть.",
            },
            {
              title: "Условия оплаты",
              text: "Договор, счёт, 50% при подтверждении места, остаток — за 14 дней до монтажа. Для постоянных партнёров — по графику.",
            },
            {
              title: "Отмена и замена",
              text: "Перенос участия на следующую выставку серии возможен до 30 дней до старта; отказ — по условиям договора с удержанием затрат на подготовку.",
            },
          ],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "Запросить прайс сезона",
          text: "Пришлём ставки по вашей выставке, план зала и расчёт полного пакета с услугами.",
          directions: [
            "Продукты питания",
            "Напитки",
            "Стройматериалы",
            "Техника",
            "Агро",
            "Авто",
            "E-commerce",
            "Образование",
            "Услуги",
            "Другое",
          ],
          areas: [
            "9 м²",
            "18 м²",
            "27 м²",
            "36 м²",
            "50+ м²",
            "Нужна консультация",
          ],
        },
        {
          type: "links",
          items: [
            {
              label: "Планировка зала",
              href: "/exhibitors/floor-plan/",
              note: "как выбирается место",
            },
            {
              label: "Строительство стендов",
              href: "/exhibitors/stand-construction/",
            },
            {
              label: "Спонсорство и реклама",
              href: "/exhibitors/sponsorship/",
            },
            {
              label: "Услуги на время выставки",
              href: "/exhibitors/services/",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Money",
          title: "Four packages and a fully transparent quote",
          lead: "Rates depend on the show and the season, so the exact price list comes from the account manager with the floor plan. Below is what each package contains, so you know what you are paying for.",
          image: "/images/event-buildpro.jpg",
          imageAlt: "Exhibitor stand at a construction show",
        },
        {
          type: "grid",
          cols: 2,
          items: [
            {
              icon: "cube",
              title: "Standard 9 m²",
              text: "Octanorm shell, fascia board with your logo, table, two chairs, one 220 V socket, lighting, two badges, catalogue listing. Build-up and dismantle included.",
            },
            {
              icon: "star",
              title: "Premium 18 m²",
              text: "Everything in Standard plus a priority location, larger advertising surface, showcase, four badges and 20 seconds of your reel on the hall screen.",
            },
            {
              icon: "building",
              title: "Raw space from 36 m²",
              text: "Space and power connection only. Build, design approval and machine hook-up are quoted separately.",
            },
            {
              icon: "megaphone",
              title: "Sponsorship package",
              text: "A slot on the business programme stage, entrance-area branding, participant bags, a coffee break with your presentation, priority in announcements.",
            },
          ],
        },
        {
          type: "table",
          head: ["Included", "Standard 9 m²", "Premium 18 m²", "Raw space"],
          rows: [
            ["Space and location", "yes", "yes, priority", "yes, per plan"],
            ["Shell and branding", "yes", "yes, extended", "no"],
            [
              "Furniture",
              "table + 2 chairs",
              "table, 4 chairs, showcase",
              "on order",
            ],
            ["220 V power", "1 point", "2 points", "by calculation"],
            ["Staff badges", "2", "4", "on request"],
            ["Catalogue entry", "yes", "yes, with block", "yes"],
            ["Post-show report", "basic", "extended", "extended"],
            [
              "Separate 380 V supply",
              "charged extra",
              "charged extra",
              "in the quote",
            ],
          ],
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Economics",
          title: "Early booking is 10–15% cheaper",
          text: "Season prices are locked when you apply before general sales open. Early exhibitors also choose locations, and location affects traffic more than the discount does.",
        },
        {
          type: "rows",
          items: [
            {
              title: "Charged separately",
              text: "Custom build, extra power, screens, additional furniture, interpreting, hostesses, printing, sample delivery, storage, truck unloading, freight parking.",
            },
            {
              title: "Discounts and support",
              text: "Association and national pavilions get separate tariffs. Several industries qualify for state participation compensation — we explain how to apply.",
            },
            {
              title: "Payment terms",
              text: "Contract and invoice, 50% to confirm the location, balance 14 days before build-up. Long-term partners work to an agreed schedule.",
            },
            {
              title: "Cancellation and substitution",
              text: "Moving participation to the next show in the series is possible until 30 days before the start; withdrawal follows the contract with preparation costs retained.",
            },
          ],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "Request the season price list",
          text: "We send rates for your show, the floor plan and a full package calculation including services.",
          directions: [
            "Food products",
            "Drinks",
            "Building materials",
            "Machinery",
            "Agriculture",
            "Automotive",
            "E-commerce",
            "Education",
            "Services",
            "Other",
          ],
          areas: ["9 m²", "18 m²", "27 m²", "36 m²", "50+ m²", "Need advice"],
        },
        {
          type: "links",
          items: [
            {
              label: "Floor plan",
              href: "/exhibitors/floor-plan/",
              note: "how a location is picked",
            },
            {
              label: "Stand construction",
              href: "/exhibitors/stand-construction/",
            },
            {
              label: "Sponsorship and advertising",
              href: "/exhibitors/sponsorship/",
            },
            { label: "Show services", href: "/exhibitors/services/" },
          ],
        },
      ],
    },
  }),
  P({
    path: "/exhibitors/floor-plan/",
    meta: {
      ru: {
        title: "Планировка зала и выбор места под стенд — SOF EXPO Samarkand",
        description:
          "Как устроена экспозиция, почему локация важнее площади, как получить актуальный план зала со свободными местами и что учитывать при размещении техники и демо-зон.",
      },
      en: {
        title: "Floor plan and choosing a stand location — SOF EXPO Samarkand",
        description:
          "How the expo is arranged, why location beats size, how to get the live plan with free spots, and what to consider for machinery and demo zones.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "План зала",
          title: "Локация стенда — это половина результата",
          lead: "Мы отправляем актуальный план зала с сеткой, размерами проходов и свободными местами. Ниже — правила, по которым стоит выбирать точку, если вы бронируете сами.",
          image: "/images/event-agropro.jpg",
          imageAlt: "Экспозиция на выставке техники",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/floor-plan.jpg",
              caption: "Рабочий чертёж главного зала: сетка стендов, оси колонн и проходы",
            },
            {
              src: "/images/hall-plan.jpg",
              caption: "Схема застройки: B2B-зоны, VIP-переговорные, регистрация и главный вход",
            },
            {
              src: "/images/site-plan.jpg",
              caption: "Генплан площадки: крытый и внешний павильоны, ресторан, парковки",
            },
            {
              src: "/images/site-section.jpg",
              caption: "Разрез комплекса: отель, хостел, павильон и техническая зона",
            },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Начинайте от маршрута посетителя",
              text: "Поток входит, идёт к сцене и обратно к зоне питания. Стенд «на пути» собирает 2–3 раза больше остановок, чем такой же в тупике.",
            },
            {
              title: "Смежный раздел важнее соседства с конкурентом",
              text: "Закупщик, который ищет упаковку, идёт в зону оборудования. Ставьте стенд там, где уже есть ваш покупатель, а не где «представлен бренд».",
            },
            {
              title: "Угол — всегда лучше прямой линии",
              text: "Угловой стенд виден из двух проходов. Если бюджет ограничен, лучше взять 9 м² в углу, чем 18 м² в середине ряда.",
            },
            {
              title: "Для демонстрации нужна глубина",
              text: "Для работы вживую требуется от 4 м от фронта стенда до прохода — иначе толпа перекрывает подход.",
            },
            {
              title: "Технику — на улицу",
              text: "Открытая площадка 5 000 м² подходит для машин, фур и теплиц: подъезд, кран, асфальт, отдельный вход для зрителей.",
            },
          ],
        },
        {
          type: "table",
          head: ["Зона", "Кому подходит", "Что учитывать"],
          rows: [
            [
              "Входная группа",
              "бренды с медийной задачей, спонсоры",
              "высокий трафик, короткие остановки, шум",
            ],
            [
              "Ряды у сцены",
              "продукты с демо, новинки",
              "аудитория задерживается после докладов",
            ],
            [
              "Средина зала",
              "переговорный формат",
              "нужен собственный трафик-мейкер: стойка, экран, образец",
            ],
            [
              "Дальний ряд",
              "крупные острова, техника",
              "меньше случайных, больше целевых визитов",
            ],
            [
              "Открытая площадка",
              "машины, крупногабарит, шоу",
              "погода, ограждение, согласование безопасности",
            ],
          ],
        },
        {
          type: "callout",
          kicker: "Как получить план",
          title: "Запросите актуальную схему со свободными местами",
          text: "В письме будут: PDF-план, размеры мест, список соседних разделов, ставка за м² и сроки фиксации брони.",
          action: { label: "Запросить план", href: "/request-stand/" },
        },
        {
          type: "links",
          items: [
            {
              label: "Залы и площадки",
              href: "/venue/halls/",
              note: "размеры и вместимость",
            },
            { label: "Пакеты участия", href: "/exhibitors/packages/" },
            {
              label: "Строительство стендов",
              href: "/exhibitors/stand-construction/",
            },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Floor plan",
          title: "Location is half of the result",
          lead: "We send the live floor plan with the grid, aisle widths and free spots. Below are the rules to choose by when you book yourself.",
          image: "/images/event-agropro.jpg",
          imageAlt: "Machinery expo",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/floor-plan.jpg",
              caption: "Working drawing of the main hall: stand grid, column axes and aisles",
            },
            {
              src: "/images/hall-plan.jpg",
              caption: "Build layout: B2B zones, VIP meeting rooms, registration and the main entrance",
            },
            {
              src: "/images/site-plan.jpg",
              caption: "Site master plan: indoor and outdoor pavilions, restaurant, parking",
            },
            {
              src: "/images/site-section.jpg",
              caption: "Section through the complex: hotel, hostel, pavilion and the technical zone",
            },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Start from the visitor route",
              text: "The flow enters, walks to the stage and returns past the food area. A stand on that route gets two to three times more stops than the same stand in a dead end.",
            },
            {
              title: "The neighbouring section beats the competitor next door",
              text: 'A buyer looking for packaging walks through the equipment zone. Place your stand where your buyer already is, not where your brand "looks natural".',
            },
            {
              title: "A corner always beats a straight line",
              text: "A corner stand is visible from two aisles. On a tight budget, 9 m² in a corner outperforms 18 m² mid-row.",
            },
            {
              title: "Demos need depth",
              text: "A live demonstration wants at least four metres from the stand front to the aisle, otherwise the crowd blocks approach.",
            },
            {
              title: "Machinery goes outdoors",
              text: "The 5,000 m² open area suits vehicles, trucks and greenhouses: drive-in access, crane, asphalt and a separate spectator entrance.",
            },
          ],
        },
        {
          type: "table",
          head: ["Zone", "Best for", "Consider"],
          rows: [
            [
              "Entrance area",
              "media-goal brands, sponsors",
              "high traffic, short dwell, noise",
            ],
            [
              "Rows near the stage",
              "products with a demo, launches",
              "audience stays after sessions",
            ],
            [
              "Mid hall",
              "meeting format",
              "you need your own traffic maker: counter, screen, sample",
            ],
            [
              "Back rows",
              "large islands, machinery",
              "fewer drive-bys, more planned visits",
            ],
            [
              "Open-air area",
              "vehicles, oversized items, shows",
              "weather, fencing, safety approval",
            ],
          ],
        },
        {
          type: "callout",
          kicker: "Getting the plan",
          title: "Request the live layout with free spots",
          text: "The email includes a PDF plan, pitch sizes, neighbouring sections, the per-m² rate and hold deadlines.",
          action: { label: "Request the plan", href: "/request-stand/" },
        },
        {
          type: "links",
          items: [
            {
              label: "Halls and areas",
              href: "/venue/halls/",
              note: "sizes and capacity",
            },
            { label: "Packages", href: "/exhibitors/packages/" },
            {
              label: "Stand construction",
              href: "/exhibitors/stand-construction/",
            },
          ],
        },
      ],
    },
  }),
  P({
    path: "/exhibitors/stand-construction/",
    meta: {
      ru: {
        title:
          "Строительство выставочных стендов в Самарканде: виды, сроки, согласование",
        description:
          "Готовая застройка, сборно-разборный стенд по брендбуку и капитальная экспозиция: что выбрать, сроки заказа, требования к материалам и высоте, хранение до следующего сезона.",
      },
      en: {
        title:
          "Exhibition stand construction in Samarkand: types, deadlines, approval",
        description:
          "Shell scheme, modular custom stand and full bespoke build: what to choose, ordering deadlines, material and height rules, storage until the next season.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Застройка",
          title: "Три уровня стенда и один вопрос: что вы показываете",
          lead: "Если продукт нужно взять в руки — хватает готовой застройки. Если продукт нужно включить — планируйте собственную застройку. Если продукт едет на фурах — вам на открытую площадку.",
          image: "/images/hall-stand.jpg",
          imageAlt: "Стенды в монтаже: каркас и брендирование",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cube",
              title: "Готовая застройка",
              text: "Octanorm/Moduli: перегородки, вывеска, свет, полки, мебель. Согласования минимум, срок заказа — 30 дней.",
            },
            {
              icon: "sparkle",
              title: "Сборная под заказ",
              text: "Своя геометрия, графика, медиа-экран, зона демо. Проект и расчёт нагрузок — за 45 дней до монтажа.",
            },
            {
              icon: "building",
              title: "Капитальная экспозиция",
              text: "Деревянные и смешанные конструкции, двухуровневые стенды, архитектурные решения. Проект, технадзор, разрешение по высоте.",
            },
          ],
        },
        {
          type: "table",
          head: ["Этап", "Срок", "Что нужно от вас"],
          rows: [
            [
              "Заявка и подбор места",
              "за 90–60 дней",
              "цель участия, площадь, состав команды",
            ],
            [
              "Концепция и смета застройки",
              "за 60–45 дней",
              "брендбук, пожелания по демо, бюджет",
            ],
            [
              "Рабочие чертежи и согласование",
              "за 40–25 дней",
              "подписанный проект, нагрузки, электричество",
            ],
            [
              "Печать графики",
              "за 25–14 дней",
              "макеты в печать (проверим бесплатно)",
            ],
            ["Монтаж", "день заезда", "1–2 ответственных от компании"],
            [
              "Хранение до следующего сезона",
              "после демонтажа",
              "решение: хранить, утилизировать, продать",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Высота стенда в зале — до 6 м при согласовании, стандартные пакеты — 2,5 м.",
            "Материалы перегородок — негорючие, по требованию технадзора предоставляются сертификаты.",
            "Крепление к конструкциям зала запрещено, вся стойкость — в рамках собственного стенда.",
            "Открытый огонь, фритюр и выпечка — только в согласованных зонах с вентиляцией.",
            "Питание демо-оборудования рассчитывается заранее: 220/380 В, автомат на стенд.",
          ],
        },
        {
          type: "cta",
          title: "Нужен стенд под ключ?",
          text: "Пришлём варианты конструкций, 3D-эскиз и смету — с учётом хранения между выставками.",
          actions: [
            { label: "Обсудить застройку", href: "/contacts/" },
            { label: "Услуги площадки", href: "/venue/services/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Build",
          title: "Three stand levels and one question: what do you show",
          lead: "If the product is picked up, a shell scheme is enough. If it must be switched on, plan a custom build. If it arrives by truck, you belong on the open area.",
          image: "/images/hall-stand.jpg",
          imageAlt: "Stands under construction: shell and branding",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cube",
              title: "Shell scheme",
              text: "Octanorm/Moduli: partitions, fascia, lighting, shelves, furniture. Minimal approval, 30-day lead time.",
            },
            {
              icon: "sparkle",
              title: "Modular custom",
              text: "Own geometry, graphics, media wall, demo zone. Design and load calculation 45 days before build-up.",
            },
            {
              icon: "building",
              title: "Bespoke build",
              text: "Timber and mixed structures, two-storey stands, architectural solutions. Drawings, technical supervision, height permit.",
            },
          ],
        },
        {
          type: "table",
          head: ["Stage", "Deadline", "What we need from you"],
          rows: [
            [
              "Application and location",
              "90–60 days ahead",
              "objective, area, team size",
            ],
            [
              "Concept and build quote",
              "60–45 days ahead",
              "brand book, demo needs, budget",
            ],
            [
              "Working drawings and approval",
              "40–25 days ahead",
              "signed design, loads, power",
            ],
            [
              "Graphics printing",
              "25–14 days ahead",
              "print-ready artwork (checked free of charge)",
            ],
            [
              "Build-up",
              "arrival day",
              "one or two responsible people from your team",
            ],
            [
              "Storage until next season",
              "after dismantle",
              "decision: store, scrap, sell",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Stand height is up to 6 m with approval; standard packages are 2.5 m.",
            "Partition materials must be non-combustible; certificates provided on request by the safety officer.",
            "Fixing to hall structures is prohibited; stability must come from the stand itself.",
            "Open flame, frying and baking only in approved zones with ventilation.",
            "Power for demo equipment is calculated in advance: 220/380 V with a dedicated breaker.",
          ],
        },
        {
          type: "cta",
          title: "Need a turnkey stand?",
          text: "We send build options, a 3D sketch and a quote — including storage between shows.",
          actions: [
            { label: "Discuss the build", href: "/contacts/" },
            { label: "Venue services", href: "/venue/services/" },
          ],
        },
      ],
    },
  }),
  P({
    path: "/exhibitors/services/",
    meta: {
      ru: {
        title:
          "Сервисы для экспонентов: от мебели до переводчиков и хранения груза",
        description:
          "Что заказывают экспоненты на время выставки в SOF EXPO: техника, персонал, печать, кейтеринг, логистика, встреча делегаций, страхование и хранение образцов.",
      },
      en: {
        title:
          "Exhibitor services: from furniture to interpreting and cargo storage",
        description:
          "What exhibitors order for the run of a show at SOF EXPO: technology, staff, print, catering, logistics, delegation pickup, insurance and sample storage.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Сервис",
          title: "Соберите участие как конструктор — один бланк, один счёт",
          lead: "Все позиции подтверждаются до монтажа, поэтому в день заезда ничего «вдруг» не появляется. Ниже — то, что чаще всего заказывают.",
          image: "/images/hall-crowd.jpg",
          imageAlt: "Сервис на площадке в день выставки",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "users",
              title: "Персонал",
              text: "Регистрация на стенде, хостес, промоутеры, встречa делегаций, уборка, техник на все дни.",
            },
            {
              icon: "audio",
              title: "Техника",
              text: "ТВ и проекторы, радиомикрофоны, трибуна, синхронный перевод, запись и трансляция докладов.",
            },
            {
              icon: "doc",
              title: "Печать и графика",
              text: "Каталоги, листовки, баннеры, рол-апы, бейджи, проверка макетов, срочная допечатка в дни выставки.",
            },
            {
              icon: "truck",
              title: "Логистика",
              text: "Доставка образцов, разгрузка, перемещение по залу, упаковка и временное хранение.",
            },
            {
              icon: "cup",
              title: "Кейтеринг",
              text: "Кофе-брейк для клиентов, обед команды, фуршет на открытии, вода и посуда на стенд.",
            },
            {
              icon: "seat",
              title: "Переговоры",
              text: "Зона встреч, мягкая мебель, резерв переговорной комнаты в часы пик.",
            },
            {
              icon: "shield",
              title: "Безопасность",
              text: "Сейф для образцов, ночная охрана, контроль доступа в монтажный период.",
            },
            {
              icon: "globe",
              title: "Перевод",
              text: "Русский, английский, узбекский, турецкий; кабина и наушники для сессии.",
            },
            {
              icon: "chart",
              title: "Маркетинг",
              text: "Строка в каталоге, баннер у входа, публикация в дайджесте, анонс в Telegram-канале выставки.",
            },
          ],
        },
        {
          type: "table",
          head: ["Позиция", "Единица", "Минимальный заказ", "Комментарий"],
          rows: [
            [
              "Хостес",
              "смена 4 ч",
              "2 смены",
              "скрипт и форма — с нашей стороны",
            ],
            [
              "Синхронный перевод",
              "сессия 2 ч",
              "1 сессия",
              "кабина, 2 переводчика, наушники",
            ],
            ["ТВ 55″", "сутки", "1 шт.", "подключение презентации бесплатно"],
            ["Печать баннера 3×1 м", "шт.", "1 шт.", "макет — за 5 дней"],
            ["Разгрузка фуры", "авто", "1", "расчет по массе и габаритам"],
            [
              "Хранение",
              "м²/сутки",
              "от 1 м²",
              "охраняемая зона, доступ по бейджу",
            ],
          ],
        },
        {
          type: "form",
          formType: "callback",
          title: "Заказать услуги",
          text: "Опишите выставку и задачи — пришлём перечень с ценами и сроками.",
        },
        {
          type: "links",
          items: [
            {
              label: "Услуги площадки",
              href: "/venue/services/",
              note: "полный прайс",
            },
            { label: "Документы и сроки", href: "/exhibitors/documents/" },
            { label: "FAQ экспонента", href: "/exhibitors/faq/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Service",
          title:
            "Assemble participation like a constructor — one form, one invoice",
          lead: 'Everything is confirmed before build-up, so nothing appears "suddenly" on arrival day. Below is what is ordered most often.',
          image: "/images/hall-crowd.jpg",
          imageAlt: "On-site services on show day",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "users",
              title: "Staff",
              text: "Stand registration, hostesses, promo crew, delegation pickup, cleaning, a technician for all days.",
            },
            {
              icon: "audio",
              title: "Technology",
              text: "Screens and projectors, radio mics, podium, simultaneous interpreting, session recording and streaming.",
            },
            {
              icon: "doc",
              title: "Print and graphics",
              text: "Catalogues, leaflets, banners, roll-ups, badges, artwork check, rush reprint during the show.",
            },
            {
              icon: "truck",
              title: "Logistics",
              text: "Sample delivery, unloading, moves inside the hall, packing and temporary storage.",
            },
            {
              icon: "cup",
              title: "Catering",
              text: "Client coffee break, team lunch, opening reception, water and crockery at the stand.",
            },
            {
              icon: "seat",
              title: "Meetings",
              text: "Meeting zone, soft seating, a booked negotiation room at peak hours.",
            },
            {
              icon: "shield",
              title: "Security",
              text: "Safe for samples, night guard, access control during the build period.",
            },
            {
              icon: "globe",
              title: "Interpreting",
              text: "Russian, English, Uzbek, Turkish; booth and headsets for a session.",
            },
            {
              icon: "chart",
              title: "Marketing",
              text: "Catalogue line, entrance banner, digest feature, announcement in the show Telegram channel.",
            },
          ],
        },
        {
          type: "table",
          head: ["Item", "Unit", "Minimum", "Note"],
          rows: [
            [
              "Hostess",
              "4 h shift",
              "2 shifts",
              "script and uniform on our side",
            ],
            [
              "Simultaneous interpreting",
              "2 h session",
              "1 session",
              "booth, two interpreters, headsets",
            ],
            ["55″ screen", "per day", "1 unit", "presentation connection free"],
            ["3×1 m banner", "piece", "1", "artwork 5 days ahead"],
            ["Truck unloading", "vehicle", "1", "priced by weight and size"],
            ["Storage", "m²/day", "from 1 m²", "guarded area, badge access"],
          ],
        },
        {
          type: "form",
          formType: "callback",
          title: "Order services",
          text: "Describe the show and the tasks — we send the list with prices and deadlines.",
        },
        {
          type: "links",
          items: [
            {
              label: "Venue services",
              href: "/venue/services/",
              note: "full price list",
            },
            {
              label: "Documents and deadlines",
              href: "/exhibitors/documents/",
            },
            { label: "Exhibitor FAQ", href: "/exhibitors/faq/" },
          ],
        },
      ],
    },
  }),
  P({
    path: "/exhibitors/sponsorship/",
    meta: {
      ru: {
        title: "Спонсорство и рекламные возможности на выставках SOF EXPO",
        description:
          "Пакеты спонсорства: сцена и микрофон, брендирование входной группы и проходов, сумки участников, кофе-брейк, цифровые экраны, анонсы в каналах выставки. Форматы и что входит.",
      },
      en: {
        title: "Sponsorship and advertising at SOF EXPO exhibitions",
        description:
          "Sponsorship packages: stage and microphone, entrance and aisle branding, participant bags, coffee break, digital screens, announcements in show channels. Formats and inclusions.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Спонсорство",
          title: "Контент, который видит вся аудитория, а не только ваш проход",
          lead: "Спонсорский пакет — самый быстрый способ занять место в сценарии выставки: доклады, приветствие, награды, материалы в сумке участника.",
          image: "/images/hall-stand.jpg",
          imageAlt: "Зал с брендированными стендами",
        },
        {
          type: "callout",
          kicker: "Носители",
          title: "Где именно висит реклама спонсора",
          text: "Схема рекламных поверхностей зала: баннеры у главного входа и регистрации, брендирование VIP-переговорных, B2B-зон и conference room. Размеры каждой поверхности — в спонсорском пакете.",
          image: "/images/expo-banner.jpg",
          imageAlt: "Схема рекламных носителей в зале SOF EXPO Samarkand",
          action: { label: "Запросить спонсорский пакет", href: "/request-stand/" },
        },
        {
          type: "table",
          head: ["Пакет", "Что включает", "Кому подходит"],
          rows: [
            [
              "Генеральный партнёр",
              "название в заголовке выставки, 10 минут на открытии, стенд премиум, 6 мест в зале деловой программы, баннеры у входа и в каталоге, рассылка по базе",
              "бренды, которые входят на рынок",
            ],
            [
              "Партнёр раздела",
              "модерация сессии раздела, 30 минут доклада, стенд 18 м², брендирование зоны, 3 анонса в каналах",
              "производители оборудования и сервисы",
            ],
            [
              "Кофе-брейк",
              "имя в программе, брендирование зоны, стойка, 15 минут презентации",
              "HoReCa, логистика, финансы",
            ],
            [
              "Приз конкурса",
              "награждение в своей номинации, кубок и диплом с логотипом, пост в соцсетях выставки",
              "ретейл, дистрибьюторы",
            ],
            [
              "Цифровая реклама",
              "ролики на экранах зала, баннер на сайте события, email-рассылка",
              "все сегменты",
            ],
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "mic",
              title: "Сцена и доклад",
              text: "Двадцать минут на аудитории, которая пришла слушать отрасль, а не рекламу.",
            },
            {
              icon: "star",
              title: "Награждение",
              text: "Ваш бренд в момент вручения — самый фотографируемый кадр выставки.",
            },
            {
              icon: "doc",
              title: "Каталог и сумка",
              text: "Печать в каталоге и вложение в сумку участника: остаётся у закупщика после выставки.",
            },
            {
              icon: "building",
              title: "Навигация",
              text: "Брендирование стоек регистрации, стоек информации и указателей разделов.",
            },
            {
              icon: "globe",
              title: "Цифровые каналы",
              text: "Анонсы в Telegram-канале выставки, баннер на лендинге события, рассылка.",
            },
            {
              icon: "handshake",
              title: "Закрытый ужин",
              text: "Узкий формат: 20–40 гостей, стол переговоров, модератор от организатора.",
            },
          ],
        },
        {
          type: "callout",
          tone: "gold",
          title: "Отчёт по спонсорству",
          text: "После события вы получаете статистику посещений, фото и видео с активацией, список аккредитованных посетителей и рекомендации по следующему сезону.",
        },
        {
          type: "form",
          formType: "sponsor",
          title: "Запросить спонсорское предложение",
          text: "Пришлём PDF с пакетами по конкретной выставке и свободными датами активаций.",
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Sponsorship",
          title: "Content the whole audience sees, not only your aisle",
          lead: "A sponsorship package is the fastest way to enter the script of the exhibition: talks, welcome word, awards, material in the participant bag.",
          image: "/images/hall-stand.jpg",
          imageAlt: "Hall with branded stands",
        },
        {
          type: "callout",
          kicker: "Carriers",
          title: "Exactly where the sponsor's advertising hangs",
          text: "The hall's advertising surfaces: banners at the main entrance and registration, branding of the VIP meeting rooms, the B2B zones and the conference room. Each surface is dimensioned in the sponsorship pack.",
          image: "/images/expo-banner.jpg",
          imageAlt: "Advertising-carrier layout in the SOF EXPO Samarkand hall",
          action: { label: "Request the sponsorship pack", href: "/request-stand/" },
        },
        {
          type: "table",
          head: ["Package", "Includes", "Best for"],
          rows: [
            [
              "General partner",
              "name in the exhibition title, 10 minutes at the opening, premium stand, six seats in the programme, entrance and catalogue banners, database mailing",
              "brands entering the market",
            ],
            [
              "Section partner",
              "moderating a section session, 30-minute talk, 18 m² stand, zone branding, three announcements in show channels",
              "equipment makers and services",
            ],
            [
              "Coffee break",
              "named in the programme, branded area, counter, 15-minute pitch",
              "HoReCa, logistics, finance",
            ],
            [
              "Award sponsor",
              "presenting your nomination, trophy and diploma with your logo, social post",
              "retail, distributors",
            ],
            [
              "Digital advertising",
              "reels on hall screens, banner on the event landing, email campaign",
              "all segments",
            ],
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "mic",
              title: "Stage and talk",
              text: "Twenty minutes with an audience that came to listen to the industry, not to an ad.",
            },
            {
              icon: "star",
              title: "Awards",
              text: "Your brand in the moment of handing over the prize — the most photographed minute of the show.",
            },
            {
              icon: "doc",
              title: "Catalogue and bag",
              text: "Print in the catalogue and an insert in the participant bag: it stays with the buyer after the show.",
            },
            {
              icon: "building",
              title: "Navigation",
              text: "Branding of registration desks, information points and section signage.",
            },
            {
              icon: "globe",
              title: "Digital channels",
              text: "Announcements in the show Telegram channel, banner on the event landing, mailing.",
            },
            {
              icon: "handshake",
              title: "Private dinner",
              text: "A tight format: 20–40 guests, negotiation table, a moderator from the organizer.",
            },
          ],
        },
        {
          type: "callout",
          tone: "gold",
          title: "Sponsorship report",
          text: "After the event you receive visitor statistics, photos and video of the activation, the accredited attendee list and recommendations for the next season.",
        },
        {
          type: "form",
          formType: "sponsor",
          title: "Request the sponsorship proposal",
          text: "We send a PDF with packages for the specific show and free dates for activations.",
        },
      ],
    },
  }),
  P({
    path: "/exhibitors/documents/",
    meta: {
      ru: {
        title: "Документы экспонента и ключевые даты подготовки к выставке",
        description:
          "Заявка, договор, акт, регистрация персонала, техзаявка на электричество, схемы стенда, документы на продукцию и дегустацию — полный список со сроками для SOF EXPO Samarkand.",
      },
      en: {
        title: "Exhibitor documents and key preparation dates",
        description:
          "Application, contract, acts, staff registration, power request, stand drawings, product and tasting paperwork — the full list with deadlines at SOF EXPO Samarkand.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Бюрократия",
          title: "Список документов, который экономит нервы на монтаже",
          lead: "Ниже — календарь paperwork для участника. Все бланки присылает менеджер; если чего-то не хватает, мы предупредим заранее, а не в день заезда.",
          image: "/images/documents.jpg",
          imageAlt: "Пакет документов участника выставки",
        },
        {
          type: "table",
          head: ["Документ", "Срок", "Кто готовит", "Комментарий"],
          rows: [
            [
              "Заявка на участие",
              "за 90–60 дней",
              "экспонент",
              "можно письмом на info@sofexpo.uz",
            ],
            [
              "Договор и счёт",
              "за 60–45 дней",
              "организатор",
              "электронный документооборот поддерживаем",
            ],
            [
              "Заявка на застройку и чертежи",
              "за 45–25 дней",
              "экспонент или наш подрядчик",
              "согласование высот и нагрузок",
            ],
            [
              "Техзаявка на электричество",
              "за 25 дней",
              "экспонент",
              "мощность по оборудованию",
            ],
            [
              "Регистрация персонала и бейджи",
              "за 14 дней",
              "экспонент",
              "ФИО, фото, должность",
            ],
            [
              "Список продукции для каталога",
              "за 21 день",
              "экспонент",
              "описание, фото, контакты",
            ],
            [
              "Документы на продукцию",
              "за 21 день",
              "экспонент",
              "сертификат/декларация, протоколы",
            ],
            [
              "Заявка на дегустацию",
              "за 14 дней",
              "экспонент",
              "санитарные требования, персонал",
            ],
            [
              "Акт приёма-передачи площади",
              "день монтажа",
              "организатор",
              "фиксация состояния зала",
            ],
            [
              "Пост-акт и отчёт",
              "14 дней после",
              "организатор",
              "статистика, контакты, фото",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Доверенность на ответственного на площадке, если директор не приезжает.",
            "Копия свидетельства о регистрации компании — для договора и для таможни на образцы.",
            "Для иностранных участников: инвойс и packing list на выставочные образцы, без пометки «для продажи».",
            "Страхование стенда и грузов — по желанию, но мы рекомендуем для техники и ретро-экспонатов.",
          ],
        },
        {
          type: "callout",
          kicker: "Языковые требования",
          title: "Маркировка и раздаточные материалы",
          text: "Информация для потребителя в Узбекистане дублируется на государственном языке. Для выставки это касается ценников, описаний в каталоге и раздатки — подготовьте два языка заранее.",
          action: { label: "Спросить про требования", href: "/contacts/" },
        },
        {
          type: "links",
          items: [
            { label: "FAQ экспонента", href: "/exhibitors/faq/" },
            { label: "Услуги и прокат", href: "/venue/services/" },
            { label: "Как добраться", href: "/venue/how-to-get-there/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Paperwork",
          title: "The document list that saves your nerves at build-up",
          lead: "Below is the participant calendar. All forms come from the account manager; if something is missing you hear it in advance, not on arrival day.",
          image: "/images/documents.jpg",
          imageAlt: "An exhibitor's document pack",
        },
        {
          type: "table",
          head: ["Document", "Deadline", "Prepared by", "Note"],
          rows: [
            [
              "Participation application",
              "90–60 days ahead",
              "exhibitor",
              "an email to info@sofexpo.uz is enough",
            ],
            [
              "Contract and invoice",
              "60–45 days ahead",
              "organizer",
              "e-document flow supported",
            ],
            [
              "Build application and drawings",
              "45–25 days ahead",
              "exhibitor or our contractor",
              "height and load approval",
            ],
            [
              "Power request",
              "25 days ahead",
              "exhibitor",
              "capacity by equipment",
            ],
            [
              "Staff registration and badges",
              "14 days ahead",
              "exhibitor",
              "names, photos, roles",
            ],
            [
              "Catalogue product list",
              "21 days ahead",
              "exhibitor",
              "description, photos, contacts",
            ],
            [
              "Product documents",
              "21 days ahead",
              "exhibitor",
              "certificate or declaration, test protocols",
            ],
            [
              "Tasting request",
              "14 days ahead",
              "exhibitor",
              "sanitary rules, trained staff",
            ],
            [
              "Area handover act",
              "build-up day",
              "organizer",
              "hall condition recorded",
            ],
            [
              "Final act and report",
              "14 days after",
              "organizer",
              "statistics, contacts, photos",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "A power of attorney for the on-site manager if the director does not attend.",
            "Company registration certificate — for the contract and for customs on samples.",
            "Foreign exhibitors: invoice and packing list marked as exhibition samples, not for sale.",
            "Stand and cargo insurance is optional but recommended for machinery and vintage exhibits.",
          ],
        },
        {
          type: "callout",
          kicker: "Language rules",
          title: "Labelling and handouts",
          text: "Consumer information in Uzbekistan is duplicated in the state language. For an exhibition this covers price tags, catalogue descriptions and handouts — prepare both languages early.",
          action: { label: "Ask about requirements", href: "/contacts/" },
        },
        {
          type: "links",
          items: [
            { label: "Exhibitor FAQ", href: "/exhibitors/faq/" },
            { label: "Services and rental", href: "/venue/services/" },
            { label: "Getting there", href: "/venue/how-to-get-there/" },
          ],
        },
      ],
    },
  }),
  P({
    path: "/exhibitors/catalogue/",
    meta: {
      ru: {
        title: "Каталог участников выставок SOF EXPO Samarkand",
        description:
          "Как найти поставщика: каталоги FOODERA, BUILD PRO, AGROPRO, ECOM & RETAIL и WORLD EDU, как попасть в каталог и получить доступ к списку экспонентов до выставки.",
      },
      en: {
        title: "Exhibitor catalogue of SOF EXPO Samarkand shows",
        description:
          "How to find a supplier: catalogues of FOODERA, BUILD PRO, AGROPRO, ECOM & RETAIL and WORLD EDU, how to get listed and receive the exhibitor list before the show.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "Каталог",
          title: "Кто выставляет и что искать",
          lead: "Каталог выходит в PDF перед каждой выставкой и обновляется на сайте после: с контактными данными, разделом и стендом участника. Для закупщиков — доступ открыт бесплатно.",
          image: "/images/hall-crowd.jpg",
          imageAlt: "Выставочный зал в день работы",
        },
        {
          type: "files",
          items: [
            {
              title: "BUILD PRO EXPO 2025",
              href: "/files/build-2025-catalog.pdf",
              note: "80+ компаний, строительный раздел",
              kind: "pdf",
            },
            {
              title: "BUILD PRO EXPO 2024",
              href: "/files/build-2024-catalog.pdf",
              note: "архив участников",
              kind: "pdf",
            },
            {
              title: "AGROPRO EXPO 2026",
              href: "/files/catalog-agro-2026.pdf",
              note: "техника, орошение, агрохимия",
              kind: "pdf",
            },
            {
              title: "AGROPRO EXPO 2025",
              href: "/files/catalog-agro-2025.pdf",
              note: "архив участников",
              kind: "pdf",
            },
            {
              title: "WORLD EDU 2025",
              href: "https://apicore.uz/world-edu",
              note: "онлайн-каталог вузов",
              kind: "link",
            },
            {
              title: "FOODERA EXPO 2026",
              href: "/files/foodera-catalogue.pdf",
              note: "будет опубликован перед стартом",
              kind: "pdf",
            },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "search",
              title: "Поиск по каталогу",
              text: "Фильтр по разделу, стране и типу предложения — производители, дистрибьюторы, услуги.",
            },
            {
              icon: "doc",
              title: "Как попасть в каталог",
              text: "Заполняете анкету за 21 день до старта: название, логотип, описание, продукция, контакты, стенд.",
            },
            {
              icon: "star",
              title: "Расширенная строка",
              text: "Для премиум-стендов — блок с фото и перечнем новинок, для спонсоров — разворот.",
            },
          ],
        },
        {
          type: "callout",
          kicker: "Для закупщика",
          title: "Получить список участников заранее",
          text: "За две недели до выставки мы высылаем перечет экспонентов с разделами и номерами стендов: составляете маршрут встреч до приезда.",
          action: { label: "Оставить запрос", href: "/contacts/" },
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "Catalogue",
          title: "Who exhibits and what to look for",
          lead: "The catalogue is published in PDF before every show and updated on the site afterwards: contacts, section and stand number. Free access for buyers.",
          image: "/images/hall-crowd.jpg",
          imageAlt: "Exhibition hall on a working day",
        },
        {
          type: "files",
          items: [
            {
              title: "BUILD PRO EXPO 2025",
              href: "/files/build-2025-catalog.pdf",
              note: "80+ companies, construction section",
              kind: "pdf",
            },
            {
              title: "BUILD PRO EXPO 2024",
              href: "/files/build-2024-catalog.pdf",
              note: "participant archive",
              kind: "pdf",
            },
            {
              title: "AGROPRO EXPO 2026",
              href: "/files/catalog-agro-2026.pdf",
              note: "machinery, irrigation, agrochemistry",
              kind: "pdf",
            },
            {
              title: "AGROPRO EXPO 2025",
              href: "/files/catalog-agro-2025.pdf",
              note: "participant archive",
              kind: "pdf",
            },
            {
              title: "WORLD EDU 2025",
              href: "https://apicore.uz/world-edu",
              note: "online university catalogue",
              kind: "link",
            },
            {
              title: "FOODERA EXPO 2026",
              href: "/files/foodera-catalogue.pdf",
              note: "published before the opening",
              kind: "pdf",
            },
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "search",
              title: "Catalogue search",
              text: "Filter by section, country and offer type — manufacturers, distributors, services.",
            },
            {
              icon: "doc",
              title: "How to get listed",
              text: "Fill the form 21 days ahead: name, logo, description, products, contacts, stand number.",
            },
            {
              icon: "star",
              title: "Extended entry",
              text: "Premium stands get a photo block with new products; sponsors get a spread.",
            },
          ],
        },
        {
          type: "callout",
          kicker: "For buyers",
          title: "Get the exhibitor list in advance",
          text: "Two weeks before the show we send the list of exhibitors with sections and stand numbers so you can plan your route before you travel.",
          action: { label: "Send a request", href: "/contacts/" },
        },
      ],
    },
  }),
  P({
    path: "/exhibitors/faq/",
    meta: {
      ru: {
        title: "FAQ экспонента: договор, монтаж, техника, персонал, отчётность",
        description:
          "Ответы на частые вопросы участников выставок в SOF EXPO Samarkand: сроки оплаты, что входит в ставку, электричество, высота стенда, ввоз образцов, страховка, отчёт после выставки.",
      },
      en: {
        title: "Exhibitor FAQ: contract, build-up, machinery, staff, reporting",
        description:
          "Answers to common questions from exhibitors at SOF EXPO Samarkand: payment terms, what the rate includes, power, stand height, sample import, insurance, post-show report.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "FAQ",
          title: "Вопросы, которые задают до подписания договора",
          lead: "Если ответа нет — напишите менеджеру, отвечает в рабочее время в течение 15 минут.",
          image: "/images/hall-walk.jpg",
          imageAlt: "Проход между стендами в выставочном зале",
        },
        {
          type: "faq",
          items: [
            {
              q: "Что входит в ставку за стенд?",
              a: "Площадь, застройка (для пакета «стандарт» и «премиум»), брендирование, мебель, одна-две электрические точки, освещение, бейджи персонала и место в каталоге. Отдельно оплачиваются: застройка под проект, дополнительное электричество, техника, печать, персонал, логистика.",
            },
            {
              q: "Можно ли приехать со своей застройкой?",
              a: "Да. Проект застройки согласуется за 25–40 дней: чертежи, нагрузки, материалы, высота, электрическая схема. Монтаж — в установленное окно, с инструктажом по технике безопасности.",
            },
            {
              q: "Какая максимальная высота стенда?",
              a: "Стандарт — 2,5 м, для проектов под заказ при согласовании — до 6 м. Двухуровневые стенды требуют отдельного расчёта и проекта.",
            },
            {
              q: "Можно ли подключать оборудование?",
              a: "Да, при заявке на электричество: 220 или 380 В, автомат на стенд, мощность по паспорту оборудования. Для техники с открытым огнем, фритюром или выбросами требуется согласование вентиляции и пожарной безопасности.",
            },
            {
              q: "Как ввезти образцы из-за рубежа?",
              a: "Образцы ввозятся как выставочные материалы: инвойс, упаковочный лист, описание. Продажа на стенде ограничена — при коммерческой продаже нужны локальные документы и кассовая дисциплина. Мы помогаем с письмами для таможни.",
            },
            {
              q: "Что с хранением и упаковкой?",
              a: "Временное хранение упаковки и материалов доступно на территории, вывоз после демонтажа — по заявке. Для техники можно оставить стенд на складе до следующего сезона.",
            },
            {
              q: "Кто отвечает за сохранность?",
              a: "Охрана территории и контроль доступа — на центре. Страхование содержимого стенда — ответственность экспонента; для дорогой техники рекомендуем полис.",
            },
            {
              q: "Какой отчёт я получу?",
              a: "Через две недели: посещаемость, география и роли аудитории, статистика активности на стенде (по запросу — счётчик), фотоматериалы с активациями и рекомендации по месту в следующем сезоне.",
            },
            {
              q: "Можно ли получить скидку на первое участие?",
              a: "Работают два механизма: раннее бронирование (фиксация цены сезона и лучший выбор места) и условия для коллективных стендов ассоциаций. Скидка «за первое участие» без оснований не применяется — вместо неё подбираем площадь под бюджет.",
            },
            {
              q: "Как зарегистрировать сотрудников?",
              a: "Список ФИО, должностей и фото за 14 дней до старта. Бейджи выдаются на стойке регистрации; для монтажного периода — отдельный пропуск.",
            },
          ],
        },
        {
          type: "cta",
          title: "Остались вопросы?",
          text: "Напишите в Telegram или позвоните — ответим до того, как вы примете решение о бюджете.",
          actions: [
            { label: "Telegram менеджера", href: "https://t.me/sofexpomgr" },
            { label: "Все контакты", href: "/contacts/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "FAQ",
          title: "Questions asked before signing the contract",
          lead: "If an answer is missing, write to the account manager — replies within 15 minutes during office hours.",
          image: "/images/hall-walk.jpg",
          imageAlt: "Aisle between stands in the exhibition hall",
        },
        {
          type: "faq",
          items: [
            {
              q: "What does the stand rate include?",
              a: "Space, shell scheme build (Standard and Premium), branding, furniture, one or two power points, lighting, staff badges and a catalogue entry. Custom build, extra power, technology, print, staff and logistics are charged separately.",
            },
            {
              q: "Can I bring my own contractor?",
              a: "Yes. The design is approved 25–40 days ahead: drawings, loads, materials, height and electrical diagram. Build-up happens inside the agreed window after a safety briefing.",
            },
            {
              q: "What is the maximum stand height?",
              a: "2.5 m as standard, up to 6 m for approved custom projects. Two-storey stands need a separate structural design and approval.",
            },
            {
              q: "Can we run equipment at the stand?",
              a: "Yes, with a power request: 220 or 380 V, a breaker at the stand, capacity per equipment passport. Anything with open flame, frying or emissions needs ventilation and fire approval.",
            },
            {
              q: "How do we import samples?",
              a: "Samples arrive as exhibition materials: invoice, packing list, description. Selling at the stand is limited — commercial sales require local documents and fiscal discipline. We provide letters for customs.",
            },
            {
              q: "What about storage and packing?",
              a: "Temporary storage of packing and materials is available on site, removal after dismantle by request. Machinery can stay in the warehouse until the next season.",
            },
            {
              q: "Who is responsible for security?",
              a: "Site security and access control are ours; insuring stand contents is yours — for expensive machinery we recommend a policy.",
            },
            {
              q: "What report do I get?",
              a: "Two weeks later: attendance, geography and roles of the audience, stand activity statistics (a counter on request), photos of activations and a recommendation for next season location.",
            },
            {
              q: "Is there a first-time discount?",
              a: "Two mechanisms work: early booking (season price lock and better location choice) and tariffs for association pavilions. A generic first-time discount is not applied — instead we size the area to your budget.",
            },
            {
              q: "How do we register staff?",
              a: "A list of names, roles and photos 14 days before the opening. Badges are issued at registration; build-up requires a separate pass.",
            },
          ],
        },
        {
          type: "cta",
          title: "Still have questions?",
          text: "Message us on Telegram or call — before you commit a budget.",
          actions: [
            { label: "Manager on Telegram", href: "https://t.me/sofexpomgr" },
            { label: "All contacts", href: "/contacts/" },
          ],
        },
      ],
    },
  }),
];
