import type { Block, PageMeta } from "./types";
import type { SectionKey } from "@/components/EventSections.astro";
import type { L } from "@/data/events"; /** * Authored copy for the four pages of every exhibition cluster. * Each event is written individually: different emphasis, different section * order (`before` / `after` decide which data blocks surround the authored text), * different numbers — never one template filled with names. */
export interface EventPage {
  path: string;
  image?: string;
  noindex?: boolean;
  hero: { kicker: L; title: L; lead: L; bullets?: L[] };
  /** data-driven sections rendered before the authored blocks */ before?: SectionKey[];
  /** data-driven sections rendered after the authored blocks */ after?: SectionKey[];
  blocks: { ru: Block[]; en: Block[] };
  meta: { ru: PageMeta; en: PageMeta };
}
export type EventPages = {
  overview: EventPage;
  exhibitors: EventPage;
  visitors: EventPage;
  program: EventPage;
};
export const eventPages: Record<string, EventPages> = {
  /* ------------------------------------------------------------------ FOODERA */ "foodera-expo":
    {
      overview: {
        path: "/events/foodera-expo/",
        image: "/images/event-foodera.jpg",
        meta: {
          ru: {
            title:
              "FOODERA EXPO 2026 — выставка продуктов и напитков, Самарканд",
            description:
              "20–22 октября 2026, SOF EXPO Samarkand: 12 разделов food & beverage, дегустации, закупочная биржа с сетями, форум Food Retail. Бронирование стендов и регистрация посетителей.",
          },
          en: {
            title: "FOODERA EXPO 2026 — food and drink exhibition, Samarkand",
            description:
              "20–22 October 2026 at SOF EXPO Samarkand: 12 food and beverage sections, tastings, a buying marketplace with retail chains, Food Retail forum. Stand booking and visitor registration.",
          },
        },
        hero: {
          kicker: {
            ru: "Выставка продуктов и напитков",
            en: "Food and beverage exhibition",
          },
          title: {
            ru: "FOODERA EXPO: три дня, за которые полки меняются",
            en: "FOODERA EXPO: three days that move shelves",
          },
          lead: {
            ru: "Производители, дистрибьюторы и поставщики встречаются с закупщиками розницы, опта, HoReCa и кейтеринга. Дегустации, закупочная биржа и форум Food Retail на одной площадке.",
            en: "Producers, distributors and suppliers meet retail, wholesale, HoReCa and catering buyers. Tastings, a buying marketplace and the Food Retail forum on one site.",
          },
          bullets: [
            { ru: "12 тематических разделов", en: "12 sections on show" },
            {
              ru: "Закупочная биржа с pre-matched встречами",
              en: "Pre-matched buying meetings",
            },
            { ru: "Конкурс «Лучший продукт»", en: "Best Product contest" },
          ],
        },
        before: ["facts"],
        /* the programme is the data-driven by-day section (events.ts `day` field) — one source,
           duplicated nowhere */
        after: [
          "categories",
          "programme",
          "materials",
          "faq",
          "related",
        ],
        blocks: {
          ru: [
            {
              type: "h2",
              kicker: "Кому нужна FOODERA",
              title: "Четыре профиля участников и что они здесь делают",
            },
            {
              type: "grid",
              cols: 4,
              items: [
                {
                  icon: "factory",
                  title: "Производитель",
                  text: "Тестирует SKU на закупщиках сетей, ищет дистрибьютора в регионах, получает обратную связь по цене и упаковке.",
                },
                {
                  icon: "truck",
                  title: "Импортёр и дистрибьютор",
                  text: "Собирает портфель брендов: 10–15 новых поставщиков за день, условия и отсрочки обсуждаются на месте.",
                },
                {
                  icon: "cart",
                  title: "Закупщик сети",
                  text: "Смотрит новинки, сравнивает цены, проводит планёрки с поставщиками в переговорной зоне.",
                },
                {
                  icon: "cup",
                  title: "HoReCa и кейтеринг",
                  text: "Подбирает продукты под меню, договаривается о форматах поставок и пробных партиях.",
                },
              ],
            },
            {
              type: "text",
              paragraphs: [
                "FOODERA проходит в Самарканде не случайно: город — логистический узел юга Узбекистана, где сходятся потоки из Ташкента, Бухары, Карши и пограничных регионов. Для поставщика это способ за три дня покрыть переговоры, которые иначе растягиваются на сезон объезда.",
                "Рынок одновременно и щедрый, и придирчивый: розница Узбекистана выросла до 182 трлн сумов за 2024 год, но полка ограничена. Побеждает тот, кто приехал с образцом, ценой и готовностью к первой поставке.",
              ],
              image: "/images/food-tasting.jpg",
              imageAlt: "Дегустации на FOODERA EXPO",
            },
            {
              type: "callout",
              tone: "gold",
              kicker: "Статус продаж",
              title: "Осталось 38 премиум-стендов",
              text: "Локации у центрального прохода и у входа в деловую программу разбираются первыми. Бронь фиксируется заявкой, договор — в течение 3 рабочих дней.",
              action: { label: "Забронировать место", href: "/request-stand/" },
            },
          ],
          en: [
            {
              type: "h2",
              kicker: "Who needs FOODERA",
              title: "Four exhibitor profiles and what they actually do here",
            },
            {
              type: "grid",
              cols: 4,
              items: [
                {
                  icon: "factory",
                  title: "Manufacturer",
                  text: "Tests a SKU on chain buyers, looks for regional distributors, gets feedback on price and packaging.",
                },
                {
                  icon: "truck",
                  title: "Importer and distributor",
                  text: "Builds a brand portfolio: 10–15 new suppliers a day, terms and payment windows discussed on the spot.",
                },
                {
                  icon: "cart",
                  title: "Chain buyer",
                  text: "Reviews new products, compares prices, runs supplier meetings in the negotiation area.",
                },
                {
                  icon: "cup",
                  title: "HoReCa and catering",
                  text: "Sources products for menus, agrees supply formats and trial batches.",
                },
              ],
            },
            {
              type: "text",
              paragraphs: [
                "FOODERA is held in Samarkand for a reason: the city is a logistics node of southern Uzbekistan where flows from Tashkent, Bukhara, Karshi and the border regions meet. For a supplier it is three days that replace a season of field trips.",
                "The market is generous and demanding at once: Uzbekistan retail reached UZS 182 trillion in 2024, but shelf space is finite. The one who arrives with a sample, a price and a first delivery date wins.",
              ],
              image: "/images/food-tasting.jpg",
              imageAlt: "Tastings at FOODERA EXPO",
            },
            {
              type: "callout",
              tone: "gold",
              kicker: "Sales status",
              title: "38 premium stands left",
              text: "Positions on the central aisle and near the programme entrance go first. A request holds the space, the contract follows within three working days.",
              action: { label: "Reserve a place", href: "/request-stand/" },
            },
          ],
        },
      },
      exhibitors: {
        path: "/events/foodera-expo/exhibitors/",
        image: "/images/hero-hall.jpg",
        meta: {
          ru: {
            title:
              "FOODERA 2026: пакеты участия, дегустации и сроки подачи заявок",
            description:
              "Форматы стендов FOODERA 2026, требования к образцам и документам, дедлайны и расчёт метража.",
          },
          en: {
            title: "FOODERA 2026: packages, tastings and application deadlines",
            description:
              "Stand formats at FOODERA 2026, sample and document rules, preparation deadlines and a space quote.",
          },
        },
        hero: {
          kicker: {
            ru: "Участникам FOODERA 2026",
            en: "FOODERA 2026 exhibitors",
          },
          title: {
            ru: "Чтобы привезти продукт, а не ожидания",
            en: "Bring a product, not expectations",
          },
          lead: {
            ru: "Форматы участия, требования к дегустациям, сроки подачи заявок и список документов для пищевой продукции — всё на одной странице.",
            en: "Participation formats, tasting requirements, deadlines and the document list for food products — on one page.",
          },
        },
        before: ["stands"],
        after: ["benefits", "materials", "faq"],
        blocks: {
          ru: [
            {
              type: "h2",
              kicker: "Готовность стенда",
              title: "Что должно быть на стенде, чтобы были переговоры",
            },
            {
              type: "checklist",
              items: [
                "Образцы для дегустации в объёме на 3 дня + резерв на повторный визит закупщика.",
                "Прайс с указанием цены FOB/склад, минимальной партии и срока поставки.",
                "Декларация соответствия и протоколы на продукцию, участвующую в дегустации.",
                "Человек, который принимает решение об условиях, а не только рассказывает о продукте.",
                "Материал для карточки поставщика: логотип, упаковка, 3 фото, контакты.",
              ],
            },
            {
              type: "table",
              head: ["Дедлайн", "Что происходит", "Что прислать"],
              rows: [
                [
                  "за 60 дней",
                  "бронирование места и раздел",
                  "заявка, описание продукции",
                ],
                [
                  "за 30 дней",
                  "застройка, графика, заявки на услуги",
                  "макет стенда, макросеты баннеров",
                ],
                [
                  "за 14 дней",
                  "дегустационная зона и биржа контактов",
                  "список SKU, образцы, документы",
                ],
                [
                  "за 3 дня",
                  "монтаж и заезд",
                  "габариты, вес, контакты монтажников",
                ],
                [
                  "день 1",
                  "награждение конкурса «Лучший продукт»",
                  "заявка на конкурс до старта выставки",
                ],
              ],
            },
            {
              type: "text",
              paragraphs: [
                "Для сетевых поставщиков мы отдельно ведём лист ожидания на биржу контактов: если ваш продукт попадает в дефицитную категорию (fresh, private label, халяль-сертификация), встреч будет больше, чем мест в расписании.",
                "Иностранным участникам помогаем с письмом для таможни на выставочные образцы и с переводом этикеток на узбекский — это требование маркировки, а не наша прихоть.",
              ],
              image: "/images/hall-stand.jpg",
              imageAlt: "Стенды FOODERA EXPO в монтаже",
            },
            {
              type: "quiz",
              title: "Подберём участие за 3 шага",
              text: "Три вопроса — и менеджер пришлёт карту раздела, свободные метры и расчёт.",
              event: "FOODERA EXPO 2026",
              areas: ["9 м²", "12 м²", "18 м²", "36 м²+"],
            },
            {
              type: "form",
          formType: "exhibitor",
              title: "Заявка на участие в FOODERA EXPO 2026",
              text: "Укажите продукцию и объём — пришлём карту раздела и расчёт стенда.",
              event: "FOODERA EXPO 2026",
              areas: ["9 м²", "12 м²", "18 м²", "36 м²+"],
              note: "Для участия в дегустационной зоне напишите список SKU в комментарии.",
            },
          ],
          en: [
            {
              type: "h2",
              kicker: "Stand readiness",
              title: "What must be on the stand for negotiations to happen",
            },
            {
              type: "checklist",
              items: [
                "Tasting samples for three days plus a reserve for a buyer return visit.",
                "A price list with FOB/warehouse price, minimum order and lead time.",
                "Conformity declaration and protocols for any product used in tastings.",
                "A person on site who can decide terms, not only describe the product.",
                "Supplier card material: logo, packaging, three photos, contacts.",
              ],
            },
            {
              type: "table",
              head: ["Deadline", "What happens", "What to send"],
              rows: [
                [
                  "60 days out",
                  "space and section booking",
                  "application, product description",
                ],
                [
                  "30 days out",
                  "build, graphics, service orders",
                  "stand draft, banner artwork",
                ],
                [
                  "14 days out",
                  "tasting area and contact exchange",
                  "SKU list, samples, documents",
                ],
                [
                  "3 days out",
                  "build-up and arrival",
                  "dimensions, weight, installer contacts",
                ],
                [
                  "day 1",
                  "Best Product awards",
                  "contest entry before the show opens",
                ],
              ],
            },
            {
              type: "text",
              paragraphs: [
                "For chain-facing suppliers we keep a separate waiting list for the buying marketplace: if your product sits in a short category (fresh, private label, halal certification), there will be more meetings than slots.",
                "Foreign participants get help with the customs letter for exhibition samples and with label translation into Uzbek — that is a marking requirement, not our preference.",
              ],
              image: "/images/hall-stand.jpg",
              imageAlt: "FOODERA EXPO stands under construction",
            },
            {
              type: "quiz",
              title: "Plan your participation in three steps",
              text: "Three questions — and the manager sends the section map, free metres and the quote.",
              event: "FOODERA EXPO 2026",
              areas: ["9 m²", "12 m²", "18 m²", "36 m²+"],
            },
            {
              type: "form",
          formType: "exhibitor",
              title: "FOODERA EXPO 2026 participation request",
              text: "List your products and volume — we send the section map and a stand quote.",
              event: "FOODERA EXPO 2026",
              areas: ["9 m²", "12 m²", "18 m²", "36 m²+"],
              note: "For the tasting area, put the SKU list in the comment.",
            },
          ],
        },
      },
      visitors: {
        path: "/events/foodera-expo/visitors/",
        image: "/images/event-foodera.jpg",
        meta: {
          ru: {
            title:
              "FOODERA 2026 для посетителей: вход, дегустации, биржа контактов",
            description:
              "Как попасть на FOODERA EXPO 2026: бесплатная регистрация специалистов, расписание дегустаций, переговоры с сетями и HoReCa, маршрут по разделам.",
          },
          en: {
            title:
              "FOODERA 2026 for visitors: entry, tastings, buying meetings",
            description:
              "How to attend FOODERA EXPO 2026: free trade registration, the tasting schedule, meetings with chains and HoReCa, a route through the sections.",
          },
        },
        hero: {
          kicker: { ru: "Посетителям FOODERA", en: "FOODERA visitors" },
          title: {
            ru: "Прийти с закупочной задачей",
            en: "Come with a buying task",
          },
          lead: {
            ru: "Вход для специалистов бесплатный по регистрации. Чтобы день не превратился в блуждание между столами, используйте маршрут по разделам и расписание дегустаций.",
            en: "Free entry for trade visitors after registration. To avoid wandering between tables, use the section route and the tasting schedule.",
          },
        },
        before: ["audience"],
        after: ["venue", "faq"],
        blocks: {
          ru: [
            {
              type: "grid",
              cols: 3,
              items: [
                {
                  icon: "cart",
                  title: "Закупщикам сетей",
                  text: "Отдел закупок получает каталог участников за неделю до выставки и отмечает, к кому идти.",
                  image: "/images/food-tasting.jpg",
                  imageAlt: "Закупочная сессия на FOODERA EXPO",
                },
                {
                  icon: "horeca",
                  title: "Ресторанам и отелям",
                  text: "Ищите новинки под меню, договаривайтесь о пробных партиях и дегустируйте на стенде.",
                  image: "/images/food-tasting-counter.jpg",
                  imageAlt: "Дегустация новинок на стенде",
                },
                {
                  icon: "shop",
                  title: "Оптовикам и рынкам",
                  text: "Цены на сезон, условия отсрочки, упаковка под трейд-ин — всё обсуждается на месте.",
                  image: "/images/hall-crowd.jpg",
                  imageAlt: "Поток посетителей в зале",
                },
              ],
            },
            {
              type: "rows",
              items: [
                {
                  title: "Регистрация",
                  text: "Онлайн-регистрация открывает QR-билет. На кассе просят подтвердить профиль: карточка компании, корпоративная почта или письмо.",
                },
                {
                  title: "Дегустации",
                  text: "Расписание слотов публикуем за 10 дней. Слепые дегустации для специалистов — голосование идёт на лучший продукт выставки.",
                },
                {
                  title: "Переговорная зона",
                  text: "Бронь столов у координатора биржи контактов: 15 минут, таймер, следующий стенд по маршруту.",
                },
              ],
            },
            {
              type: "links",
              items: [
                { label: "Как добраться", href: "/venue/how-to-get-there/" },
                { label: "Билеты и правила", href: "/visitors/tickets/" },
                {
                  label: "Деловая программа",
                  href: "/events/foodera-expo/program/",
                },
              ],
            },
          ],
          en: [
            {
              type: "grid",
              cols: 3,
              items: [
                {
                  icon: "cart",
                  title: "Chain buyers",
                  text: "Purchasing gets the exhibitor catalogue a week ahead and marks who to visit.",
                  image: "/images/food-tasting.jpg",
                  imageAlt: "Buying session at FOODERA EXPO",
                },
                {
                  icon: "horeca",
                  title: "Restaurants and hotels",
                  text: "Look for menu-ready novelties, agree trial batches and taste at the stand.",
                  image: "/images/food-tasting-counter.jpg",
                  imageAlt: "Tasting novelties at the stand",
                },
                {
                  icon: "shop",
                  title: "Wholesale and markets",
                  text: "Season pricing, deferral terms, packaging for trade-in — all discussed on site.",
                  image: "/images/hall-crowd.jpg",
                  imageAlt: "Visitor flow in the hall",
                },
              ],
            },
            {
              type: "rows",
              items: [
                {
                  title: "Registration",
                  text: "Online registration issues a QR ticket. At the desk, be ready to confirm your profile: company card, work email or a letter.",
                },
                {
                  title: "Tastings",
                  text: "The slot schedule is published 10 days ahead. Blind tastings run for trade visitors and feed the Best Product vote.",
                },
                {
                  title: "Negotiation area",
                  text: "Book tables with the marketplace coordinator: 15 minutes, a timer, the next stand on your route.",
                },
              ],
            },
            {
              type: "links",
              items: [
                { label: "Getting there", href: "/venue/how-to-get-there/" },
                { label: "Tickets and rules", href: "/visitors/tickets/" },
                {
                  label: "Business programme",
                  href: "/events/foodera-expo/program/",
                },
              ],
            },
          ],
        },
      },
      program: {
        path: "/events/foodera-expo/program/",
        image: "/images/venue-conference.jpg",
        meta: {
          ru: {
            title:
              "Программа FOODERA EXPO 2026: форум, биржа, конкурс продуктов",
            description:
              "Деловая программа FOODERA 2026 по дням: форум Food Retail, закупочная биржа, сессия о логистике, конкурс «Лучший продукт», как занять место в зале.",
          },
          en: {
            title:
              "FOODERA EXPO 2026 programme: forum, marketplace, product contest",
            description:
              "The FOODERA 2026 business programme by day: Food Retail forum, buying marketplace, logistics session, Best Product contest, how to reserve a seat.",
          },
        },
        hero: {
          kicker: {
            ru: "Программа FOODERA 2026",
            en: "FOODERA 2026 programme",
          },
          title: {
            ru: "Дегустации, биржа, форум",
            en: "Tastings, marketplace, forum",
          },
          lead: {
            ru: "Деловая часть идёт в конференц-зале и на сцене в зале. Расписание обновляется за неделю до старта, записи выступлений публикуются после.",
            en: "The business part runs in the conference hall and on the stage. The schedule updates a week before, recordings follow afterwards.",
          },
        },
        before: ["programme"],
        after: ["speakers", "faq"],
        blocks: {
          ru: [
            {
              type: "table",
              head: ["День", "Формат", "Для кого"],
              rows: [
                [
                  "день 1",
                  "Открытие, конкурс «Лучший продукт», питч-сессии производителей",
                  "все участники",
                ],
                [
                  "день 1",
                  "Форум Food Retail: полка, цена, private label",
                  "закупщики, бренд-менеджеры",
                ],
                [
                  "день 2",
                  "Закупочная биржа: pre-matched встречи",
                  "производители и сети",
                ],
                [
                  "день 2",
                  "Сессия по логистике и холодовой цепи",
                  "дистрибьюторы",
                ],
                [
                  "день 3",
                  "Разбор итогов дегустаций, переговоры с оптом",
                  "HoReCa, опт",
                ],
                ["день 3", "Награждение и план на следующую редакцию", "все"],
              ],
            },
            {
              type: "callout",
              kicker: "Как попасть",
              title: "Места в зале резервируются при регистрации",
              text: "Напишите в комментарии к заявке, какие сессии хотите посетить, — поставим вас в список. На биржу контактов отбор идёт по профилю закупки.",
              image: "/images/conference-audience.jpg",
              imageAlt: "Сессия деловой программы FOODERA EXPO",
              tone: "sand",
              action: {
                label: "Зарегистрироваться",
                href: "/visitors/tickets/",
              },
            },
          ],
          en: [
            {
              type: "table",
              head: ["Day", "Format", "For whom"],
              rows: [
                [
                  "day 1",
                  "Opening, Best Product contest, producer pitch sessions",
                  "everyone",
                ],
                [
                  "day 1",
                  "Food Retail forum: shelf, price, private label",
                  "buyers, brand managers",
                ],
                [
                  "day 2",
                  "Buying marketplace: pre-matched meetings",
                  "manufacturers and chains",
                ],
                ["day 2", "Logistics and cold chain session", "distributors"],
                [
                  "day 3",
                  "Tasting results review, wholesale negotiations",
                  "HoReCa, wholesale",
                ],
                ["day 3", "Awards and next-edition planning", "everyone"],
              ],
            },
            {
              type: "callout",
              kicker: "How to attend",
              title: "Hall seats are reserved at registration",
              text: "Write in the comment which sessions you want and we add you to the list. The marketplace screens by buying profile.",
              image: "/images/conference-audience.jpg",
              imageAlt: "FOODERA EXPO business programme session",
              tone: "sand",
              action: { label: "Register", href: "/visitors/tickets/" },
            },
          ],
        },
      },
    },
};

/* ------------------------------------------------------------------ BUILD PRO */
eventPages["buildpro-expo"] = {
  overview: {
    path: "/events/buildpro-expo/",
    image: "/images/event-buildpro.jpg",
    meta: {
      ru: {
        title: "BUILD PRO EXPO 2026 — строительная выставка в Самарканде",
        description:
          "9–11 ноября 2026, пятая редакция: материалы, оборудование, форум архитекторов, демо монтажа, 1 600+ посетителей и 80+ экспонентов в 2025 году. Заявки на стенды открыты.",
      },
      en: {
        title: "BUILD PRO EXPO 2026 — construction exhibition in Samarkand",
        description:
          "9–11 November 2026, fifth edition: materials, equipment, architects forum, live installation demos, 1,600+ visitors and 80+ exhibitors in 2025. Stand applications are open.",
      },
    },
    hero: {
      kicker: {
        ru: "Пятая международная выставка",
        en: "Fifth international exhibition",
      },
      title: {
        ru: "BUILD PRO EXPO: материалы, проекты и те, кто закупает",
        en: "BUILD PRO EXPO: materials, projects and the people who buy",
      },
      lead: {
        ru: "Производители материалов и оборудования, архитекторы, девелоперы и строительные компании — три дня показов технологий, форума и переговоров по поставкам на сезон.",
        en: "Material and equipment makers, architects, developers and construction companies — three days of technology demos, a forum and supply negotiations for the season.",
      },
      bullets: [
        { ru: "1 600+ посетителей в 2025 году", en: "1,600+ visitors in 2025" },
        { ru: "80+ компаний-экспонентов", en: "80+ exhibiting companies" },
        {
          ru: "Языки: узбекский, русский, турецкий, китайский",
          en: "Languages: Uzbek, Russian, Turkish, Chinese",
        },
      ],
    },
    before: ["facts"],
    after: ["categories", "programme", "materials", "faq", "related"],
    blocks: {
      ru: [
        {
          type: "h2",
          kicker: "Что решает выставка",
          title: "Не «показать стенд», а закрыть четыре задачи",
        },
        {
          type: "rows",
          items: [
            {
              title: "Найти дистрибьютора в регионах",
              text: "На BUILD PRO приезжают оптовики из Самарканда, Карши, Бухары, Ферганы: для производителя из-за рубежа это короткий путь к локальному партнёру.",
            },
            {
              title: "Показать материал в деле",
              text: "Демонстрации монтажа, облицовки, световых решений: техника работает на площадке, а не на видео.",
            },
            {
              title: "Поговорить с проектировщиком",
              text: "Архитекторы и дизайнеры приходят за спецификациями. Их вопрос — не цена, а узел, допуск, наличие и сроки.",
            },
            {
              title: "Продать частному застройщику",
              text: "Второй контур аудитории — те, кто строит дом для себя и выбирает окно, кровлю, фасад, отопление за один сезон.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "BUILD PRO вырос из региональной строительной выставки в площадку, куда приезжают за поставщиками из Турции и Китая: на площадке работают переводчики, а деловая программа ведётся на четырёх языках.",
            "Отдельная часть — форум архитекторов и дизайнеров: сессии о материалах, световых решениях и частном домостроении. Для поставщика это шанс попасть в спецификации объектов, которые строятся в 2027 году.",
          ],
          image: "/images/hall-stand.jpg",
          imageAlt: "Выставочный зал BUILD PRO EXPO",
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Крупногабаритная техника",
          title: "Оборудование ставим на улице",
          text: "Станки, малые строительные линии, техника для производства изделий размещаются на открытой площадке с подъездом фуры и подводом 380 В. Габариты и вес согласуются на этапе заявки.",
          action: { label: "Согласовать размещение", href: "/contacts/" },
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cube",
              title: "Стенд Octanorm",
              text: "Готовая застройка: панель, свет, полка, стол и стулья. Расчёт за м², логотип — по вашему макету.",
            },
            {
              icon: "hammer",
              title: "Проект под заказ",
              text: "Стенд по брендбуку с переговорной и зоной образцов. Проект согласуем с техотделом до монтажа.",
            },
            {
              icon: "megaphone",
              title: "Реклама в зале",
              text: "Баннеры, медиа-поверхности, партнёрство сессии форума — для тех, кто работает на узнаваемость, а не на прямые продажи.",
            },
          ],
        },
      ],
      en: [
        {
          type: "h2",
          kicker: "What the show settles",
          title: 'Not "a stand" but four jobs to close',
        },
        {
          type: "rows",
          items: [
            {
              title: "Find a regional distributor",
              text: "Wholesalers from Samarkand, Karshi, Bukhara and Fergana come to BUILD PRO: for a foreign manufacturer that is the short path to a local partner.",
            },
            {
              title: "Show the material working",
              text: "Live demos of installation, cladding and lighting solutions — equipment running on site, not in a video.",
            },
            {
              title: "Talk to a designer",
              text: "Architects and designers arrive looking for specifications. Their question is detailing, tolerance, stock and lead time, not only price.",
            },
            {
              title: "Sell to private builders",
              text: "The second audience circle is people building their own house who choose windows, roof, facade and heating within one season.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "BUILD PRO grew from a regional construction show into a venue where suppliers from Turkey and China look for partners. Interpreters work on site and the business programme runs in four languages.",
            "A separate track is the architects and designers forum: sessions on materials, lighting and private housing. For a supplier this is a way into the specifications of objects built in 2027.",
          ],
          image: "/images/hall-stand.jpg",
          imageAlt: "BUILD PRO EXPO exhibition hall",
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Oversized equipment",
          title: "Machinery goes outdoors",
          text: "Machine tools, small production lines and building-product equipment are placed on the open area with truck access and 380 V supply. Dimensions and weight are agreed at application stage.",
          action: { label: "Agree a placement", href: "/contacts/" },
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cube",
              title: "Octanorm stand",
              text: "Shell scheme: panel, lighting, shelf, table and chairs. Priced per m², your logo from artwork.",
            },
            {
              icon: "hammer",
              title: "Custom project",
              text: "A stand to your brand book with a meeting area and sample zone. Approved with the technical office before build-up.",
            },
            {
              icon: "megaphone",
              title: "Hall advertising",
              text: "Banners, media surfaces, session sponsorship — for brands working on awareness rather than direct sales.",
            },
          ],
        },
      ],
    },
  },
  exhibitors: {
    path: "/events/buildpro-expo/exhibitors/",
    image: "/images/hero-hall.jpg",
    meta: {
      ru: {
        title: "Экспонентам BUILD PRO 2026: застройка, техника, перевод",
        description:
          "Как участвовать в BUILD PRO EXPO 2026: стенд Octanorm или проект по брендбуку, уличная площадка под оборудование, заявки на услуги, языки деловой программы.",
      },
      en: {
        title: "BUILD PRO 2026 exhibitors: build-up, machinery, interpreting",
        description:
          "How to exhibit at BUILD PRO EXPO 2026: Octanorm or custom stand, outdoor area for equipment, service orders and programme languages.",
      },
    },
    hero: {
      kicker: {
        ru: "Экспонентам BUILD PRO 2026",
        en: "BUILD PRO 2026 exhibitors",
      },
      title: {
        ru: "Приехать с образцом, который можно смонтировать",
        en: "Bring a sample that can be installed",
      },
      lead: {
        ru: "Что входит в пакеты, как привезти технику, кто помогает с переводом и персоналом на стенде.",
        en: "What the packages include, how to bring machinery, who helps with interpreting and stand staff.",
      },
    },
    before: ["stands"],
    after: ["benefits", "materials", "faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Что нужно", "Как оформить", "Срок"],
          rows: [
            [
              "Демонстрация монтажа",
              "заявка в техслужбу с описанием процесса",
              "за 21 день",
            ],
            [
              "Крупногабарит на улице",
              "габаритный лист, схема установки, вес",
              "за 30 дней",
            ],
            ["Переводчик (TR/CN/EN)", "запрос менеджеру", "за 14 дней"],
            ["Промоутеры и раздатка", "бриф + тираж", "за 10 дней"],
            [
              "Печать баннеров и каталога",
              "макеты в PDF/X-1a, CMYK",
              "за 14 дней",
            ],
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Цены на метраж и застройку едины для всех участников выставки и публикуются в разделе пакетов. Фиксация стоимости происходит по дате подачи заявки: ранние заявки получают ставку текущего сезона.",
            "Для участников из Турции и Китая мы берём на себя коммуникацию с русско- и узбекоязычными закупщиками: перевод сессий, карточка участника на трёх языках, сопровождение на бирже контактов.",
          ],
          image: "/images/hall-stand.jpg",
          imageAlt: "Стенды BUILD PRO EXPO в зале",
        },
        {
          type: "checklist",
          items: [
            "Согласуйте высоту стенда до заказа застройки — для строительной выставки это частая причина переделки.",
            "Если демонстрация связана с пылью, ревом или огнём — только открытая площадка и отдельное согласование.",
            "Привезите образцы, которые можно потрогать: на этой выставке тактильность решает.",
            "Оставьте на стенде прайс на русском и узбекском — половина запросов приходит сразу после выставки.",
          ],
        },
        {
          type: "quiz",
          title: "Подберём участие за 3 шага",
          text: "Три вопроса — и менеджер пришлёт карту раздела, свободные метры и расчёт.",
          event: "BUILD PRO EXPO 2026",
          areas: ["9 м²", "18 м²", "36 м²", "улица 50 м²+"],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "Заявка на участие в BUILD PRO EXPO 2026",
          text: "Укажите продукт, желаемую площадь и потребность в демо-зоне.",
          event: "BUILD PRO EXPO 2026",
          areas: ["9 м²", "18 м²", "36 м²", "улица 50 м²+"],
        },
      ],
      en: [
        {
          type: "table",
          head: ["Need", "How to arrange", "Deadline"],
          rows: [
            [
              "Installation demo",
              "application to the technical office with the process description",
              "21 days out",
            ],
            [
              "Oversized outdoors",
              "dimension sheet, installation plan, weight",
              "30 days out",
            ],
            [
              "Interpreter (TR/CN/EN)",
              "request to your manager",
              "14 days out",
            ],
            ["Promoters and leaflets", "brief + print run", "10 days out"],
            [
              "Banners and catalogue print",
              "PDF/X-1a artwork in CMYK",
              "14 days out",
            ],
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Rates for space and build are identical for all participants and published in the packages section. The price is fixed by the date of your application: early entries get the current-season rate.",
            "For exhibitors from Turkey and China we handle communication with Russian- and Uzbek-speaking buyers: session interpreting, a trilingual exhibitor card, support at the contact exchange.",
          ],
          image: "/images/hall-stand.jpg",
          imageAlt: "BUILD PRO EXPO stands in the hall",
        },
        {
          type: "checklist",
          items: [
            "Agree the stand height before ordering construction — the most common rework at a construction show.",
            "Dust, noise or flame demonstrations go outdoors only, with a separate approval.",
            "Bring samples you can touch: at this show tactility decides.",
            "Leave a Russian and Uzbek price list on the stand — half the enquiries arrive after the show.",
          ],
        },
        {
          type: "quiz",
          title: "Plan your participation in three steps",
          text: "Three questions — and the manager sends the section map, free metres and the quote.",
          event: "BUILD PRO EXPO 2026",
          areas: ["9 m²", "18 m²", "36 m²", "50 m²+ outdoors"],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "BUILD PRO EXPO 2026 participation request",
          text: "Name the product, the area you want and whether you need a demo position.",
          event: "BUILD PRO EXPO 2026",
          areas: ["9 m²", "18 m²", "36 m²", "50 m²+ outdoors"],
        },
      ],
    },
  },
  visitors: {
    path: "/events/buildpro-expo/visitors/",
    image: "/images/event-buildpro.jpg",
    meta: {
      ru: {
        title: "Посетителям BUILD PRO 2026: форум, демо-площадка, контакты",
        description:
          "Регистрация специалистов на BUILD PRO EXPO 2026, расписание демонстраций монтажа, форум архитекторов, биржа контактов с девелоперами и что взять с собой.",
      },
      en: {
        title: "BUILD PRO 2026 visitors: forum, demo area, supplier contacts",
        description:
          "Trade registration for BUILD PRO EXPO 2026, the installation demo schedule, architects forum, contact exchange with developers and what to bring.",
      },
    },
    hero: {
      kicker: { ru: "Посетителям BUILD PRO", en: "BUILD PRO visitors" },
      title: {
        ru: "Строите объект или выбираете для дома?",
        en: "Building a project or choosing for a house?",
      },
      lead: {
        ru: "Профессиональный вход бесплатный по регистрации, для частного застройщика — билет в дни работы выставки. Маршрут и программа — на этой странице.",
        en: "Trade entry is free after registration; private builders get a ticket during the show days. Routes and programme on this page.",
      },
    },
    before: ["audience"],
    after: ["venue", "faq"],
    blocks: {
      ru: [
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "search",
              title: "Программа под задачу",
              text: "Отметьте при регистрации, что ищете: материал, оборудование, проект, подрядчик — маршрут придёт письмом.",
              image: "/images/hall-walk.jpg",
              imageAlt: "Маршрут по залу BUILD PRO EXPO",
            },
            {
              icon: "hammer",
              title: "Демо-площадка",
              text: "Монтаж фасадов, кровли, световых решений по расписанию. Доступ по бейджу посетителя.",
              image: "/images/hall-stand.jpg",
              imageAlt: "Демо-стенды в главном зале",
            },
            {
              icon: "users",
              title: "Форум архитекторов",
              text: "Сессии о спецификациях и новых материалах — полезны и проектировщикам, и застройщикам.",
              image: "/images/conference-audience.jpg",
              imageAlt: "Сессия форума архитекторов",
            },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Биржа контактов",
              text: "Девелоперы и строительные компании заранее оставляют запрос на поставщика — встречи собираются до открытия.",
            },
            {
              title: "Что взять с собой",
              text: "Спецификацию или смету объекта: с ней поставщик считает предложение по вашим объёмам прямо на стенде.",
            },
            {
              title: "Парковка и разгрузка",
              text: "Парковка бесплатна при въезде; если забираете образцы и материалы — оформите пропуск на вывоз.",
            },
          ],
        },
        {
          type: "links",
          items: [
            { label: "Регистрация посетителя", href: "/visitors/tickets/" },
            { label: "Проезд и отели", href: "/visitors/travel/" },
            {
              label: "Программа выставки",
              href: "/events/buildpro-expo/program/",
            },
          ],
        },
      ],
      en: [
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "search",
              title: "A route per task",
              text: "Tell us at registration what you look for: material, equipment, design, contractor — the route arrives by email.",
              image: "/images/hall-walk.jpg",
              imageAlt: "Route through the BUILD PRO EXPO hall",
            },
            {
              icon: "hammer",
              title: "Demo area",
              text: "Facade, roof and lighting installations on schedule. Access with a visitor badge.",
              image: "/images/hall-stand.jpg",
              imageAlt: "Demo stands in the main hall",
            },
            {
              icon: "users",
              title: "Architects forum",
              text: "Sessions on specifications and new materials — useful for designers and for private builders.",
              image: "/images/conference-audience.jpg",
              imageAlt: "Architects forum session",
            },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Contact exchange",
              text: "Developers and construction companies file a supplier request in advance; meetings are assembled before the doors open.",
            },
            {
              title: "What to bring",
              text: "A specification or an estimate of your object: with it a supplier prices an offer for your volumes right at the stand.",
            },
            {
              title: "Parking and loading out",
              text: "Parking is free at the gate; if you take samples or materials out, request an exit pass.",
            },
          ],
        },
        {
          type: "links",
          items: [
            { label: "Visitor registration", href: "/visitors/tickets/" },
            { label: "Travel and hotels", href: "/visitors/travel/" },
            { label: "Show programme", href: "/events/buildpro-expo/program/" },
          ],
        },
      ],
    },
  },
  program: {
    path: "/events/buildpro-expo/program/",
    image: "/images/venue-conference.jpg",
    meta: {
      ru: {
        title: "Программа BUILD PRO EXPO 2026: форум архитекторов и сессии",
        description:
          "10+ сессий о материалах, световых решениях и частном домостроении, демо технологий на площадке и биржа контактов. Языки: узбекский, русский, турецкий, китайский.",
      },
      en: {
        title: "BUILD PRO EXPO 2026 programme: architects forum and sessions",
        description:
          "10+ sessions on materials, lighting and private housing, on-site technology demos and a contact exchange in Uzbek, Russian, Turkish and Chinese.",
      },
    },
    hero: {
      kicker: { ru: "Форум и сессии", en: "Forum and sessions" },
      title: {
        ru: "10+ сессий о материалах и световых решениях",
        en: "10+ sessions on materials and lighting",
      },
      lead: {
        ru: "Форум архитекторов и дизайнеров, демо на площадке, биржа контактов. Часть докладов читается на турецком и китайском с переводом.",
        en: "The architects and designers forum, on-site demos, a contact exchange. Some talks run in Turkish and Chinese with interpreting.",
      },
    },
    before: ["programme"],
    after: ["speakers", "faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Направление", "Формат", "Аудитория"],
          rows: [
            [
              "Материалы и конструкции",
              "доклады + разбор узлов",
              "проектировщики, застройщики",
            ],
            [
              "Свет и электрика",
              "презентации производителей",
              "дизайнеры, инженеры",
            ],
            [
              "Частное домостроение",
              "сессия о технологиях и цене",
              "частные застройщики",
            ],
            ["Дистрибуция", "переговоры с оптом", "производители, сети"],
            ["Демо на площадке", "монтаж вживую по расписанию", "все"],
          ],
        },
        {
          type: "callout",
          kicker: "Архив",
          title: "Доклады прошлых лет",
          text: "Материалы форума 2025 года доступны участникам по запросу: презентуйте свой продукт в следующей программе.",
          image: "/images/conference-audience.jpg",
          imageAlt: "Форум BUILD PRO EXPO 2025",
          tone: "sand",
          action: { label: "Запросить материалы", href: "/contacts/" },
        },
      ],
      en: [
        {
          type: "table",
          head: ["Track", "Format", "Audience"],
          rows: [
            [
              "Materials and structures",
              "talks plus detailing review",
              "designers, developers",
            ],
            [
              "Light and electricity",
              "manufacturer presentations",
              "designers, engineers",
            ],
            [
              "Private housing",
              "a session on technology and cost",
              "private builders",
            ],
            [
              "Distribution",
              "negotiations with wholesale",
              "manufacturers, chains",
            ],
            ["Site demos", "live installation on schedule", "everyone"],
          ],
        },
        {
          type: "callout",
          kicker: "Archive",
          title: "Past editions",
          text: "2025 forum material is available to participants on request — bring your product to the next programme.",
          image: "/images/conference-audience.jpg",
          imageAlt: "BUILD PRO EXPO 2025 forum",
          tone: "sand",
          action: { label: "Request materials", href: "/contacts/" },
        },
      ],
    },
  },
};

/* ------------------------------------------------------------------ AGROPRO */
eventPages["agropro-expo"] = {
  overview: {
    path: "/events/agropro-expo/",
    image: "/images/event-agropro.jpg",
    meta: {
      ru: {
        title: "AGROPRO EXPO 2027 — агровыставка в Самарканде, 2–4 марта",
        description:
          "Техника, орошение, семена, агрохимия, теплицы, хранение и животноводство. 100+ компаний и 4 500+ специалистов в 2026 году. Заявки на площадь и уличные демо-позиции.",
      },
      en: {
        title:
          "AGROPRO EXPO 2027 — agriculture exhibition in Samarkand, 2–4 March",
        description:
          "Machinery, irrigation, seeds, agrochemistry, greenhouses, storage and livestock. 100+ companies and 4,500+ specialists in 2026. Space and outdoor demo applications open.",
      },
    },
    hero: {
      kicker: {
        ru: "Международная агровыставка",
        en: "International agriculture exhibition",
      },
      title: {
        ru: "AGROPRO EXPO: закупка перед сезоном, а не после",
        en: "AGROPRO EXPO: buying before the season, not after",
      },
      lead: {
        ru: "Техника, орошение, семена, агрохимия, теплицы, хранение и животноводство — в первых числах марта, когда хозяйства закрывают план закупок на год.",
        en: "Machinery, irrigation, seeds, agrochemistry, greenhouses, storage and livestock — in the first days of March, when farms close their purchase plan for the year.",
      },
      bullets: [
        {
          ru: "100+ компаний и 4 500+ специалистов в 2026",
          en: "100+ companies, 4,500+ specialists in 2026",
        },
        {
          ru: "Демонстрация техники на открытой площадке",
          en: "Machinery demos on the open area",
        },
        {
          ru: "Сессии о субсидиях и лизинге",
          en: "Sessions on subsidies and leasing",
        },
      ],
    },
    before: ["facts"],
    after: ["programme", "audience", "materials", "faq", "related"],
    blocks: {
      ru: [
        {
          type: "h2",
          kicker: "Почему первые числа марта",
          title: "Окно принятия решений длится две недели",
        },
        {
          type: "text",
          paragraphs: [
            "Весенняя полевая подготовка в Узбекистане начинается раньше, чем в соседних странах: техника и запчасти должны быть в хозяйстве к марту, семена и средства защиты — к посевной. Выставка стоит ровно на границе этого окна, поэтому решения о закупке здесь принимаются на месте, а не «после возвращения».",
            "Второй фактор — деньги. На площадке работают лизинговые компании, банки с льготными линиями и представители программ господдержки: условия финансирования обсуждаются с теми, кто их утверждает.",
          ],
          image: "/images/greenhouse-tomatoes.jpg",
          imageAlt: "Тепличное овощеводство — раздел AGROPRO EXPO",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "tractor",
              title: "Техника и запчасти",
              text: "Тракторы, комбайны, опрыскиватели, навесное оборудование, сервис и парк запчастей.",
            },
            {
              icon: "drop",
              title: "Орошение",
              text: "Капельные системы, дождевание, барабанные установки, насосные станции и автоматика полива.",
            },
            {
              icon: "seed",
              title: "Семена и агрохимия",
              text: "Сорта под вашу зону возделывания, удобрения, СЗР, лаборатории и агрономический сервис.",
            },
            {
              icon: "greenhouse",
              title: "Теплицы",
              text: "Конструкции, покрытия, климат-контроль, проекты тепличных комплексов под ключ.",
            },
            {
              icon: "cold",
              title: "Хранение и логистика",
              text: "Плодохранилища, холодильники, сортировка, упаковка, переработка.",
            },
            {
              icon: "certificate",
              title: "Сертификация",
              text: "Стандартизация, лабораторные испытания, экспортные требования и документы.",
            },
          ],
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Иностранному участнику",
          title: "Рынок заходит через партнёра",
          text: "Мы помогаем найти дилера, переводчика и согласовать демонстрацию техники на улице. Языки деловой программы — русский, английский, турецкий, нидерландский, немецкий.",
          action: { label: "Запросить условия", href: "/contacts/" },
        },
      ],
      en: [
        {
          type: "h2",
          kicker: "Why the first days of March",
          title: "The decision window is two weeks long",
        },
        {
          type: "text",
          paragraphs: [
            'Spring field preparation in Uzbekistan starts earlier than in neighbouring countries: machinery and spare parts must reach the farm by March, seeds and crop protection by sowing. The exhibition sits exactly on the edge of that window, which is why purchase decisions are taken on site rather than "after the trip".',
            "The second factor is money. Leasing companies, banks with concessional lines and representatives of state support programs work at the venue: financing terms are discussed with the people who approve them.",
          ],
          image: "/images/greenhouse-tomatoes.jpg",
          imageAlt: "Greenhouse vegetables — an AGROPRO EXPO section",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "tractor",
              title: "Machinery and parts",
              text: "Tractors, harvesters, sprayers, attachments, service and the spare-parts park.",
            },
            {
              icon: "drop",
              title: "Irrigation",
              text: "Drip systems, sprinklers, drum machines, pumping stations and irrigation automation.",
            },
            {
              icon: "seed",
              title: "Seeds and agrochemistry",
              text: "Varieties for your agro-climate, fertilizers, crop protection, labs and agronomy service.",
            },
            {
              icon: "greenhouse",
              title: "Greenhouses",
              text: "Structures, coverings, climate control, turnkey greenhouse complex projects.",
            },
            {
              icon: "cold",
              title: "Storage and logistics",
              text: "Fruit storage, cold rooms, sorting, packaging, processing.",
            },
            {
              icon: "certificate",
              title: "Certification",
              text: "Standardization, lab testing, export requirements and documentation.",
            },
          ],
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "For foreign exhibitors",
          title: "This market enters through a partner",
          text: "We help find a dealer and an interpreter and approve a machinery demo outdoors. Programme languages: Russian, English, Turkish, Dutch, German.",
          action: { label: "Request conditions", href: "/contacts/" },
        },
      ],
    },
  },
  exhibitors: {
    path: "/events/agropro-expo/exhibitors/",
    image: "/images/venue-exterior.jpg",
    meta: {
      ru: {
        title: "AGROPRO 2027: метраж, уличная площадка, электричество 380 В",
        description:
          "Форматы участия в AGROPRO EXPO: зал и улица, габариты и вес техники, кран, подключение мощности, лизинг и субсидии, документы для иностранных участников.",
      },
      en: {
        title: "AGROPRO 2027: floor space, outdoor area, 380 V power",
        description:
          "Participation formats: indoor and outdoor space, machinery dimensions and weight, crane access, power connection, leasing and subsidies, documents for foreign exhibitors.",
      },
    },
    hero: {
      kicker: { ru: "Экспонентам AGROPRO 2027", en: "AGROPRO 2027 exhibitors" },
      title: {
        ru: "Метраж, улица, электричество, кран",
        en: "Space, outdoors, power, crane",
      },
      lead: {
        ru: "Агротехника занимает площадь иначе, чем выставочный стенд. Ниже — как это считается и что согласуется заранее.",
        en: "Agricultural machinery takes space differently than a stand. Here is how it is counted and what is approved in advance.",
      },
    },
    before: ["stands"],
    after: ["benefits", "materials", "faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Заявка", "Что прислать", "Дедлайн"],
          rows: [
            ["Площадь в зале", "описание продукции, желаемые м²", "за 60 дней"],
            [
              "Уличная площадка",
              "габариты, масса, осевые нагрузки, схема установки",
              "за 45 дней",
            ],
            [
              "Подключение 380 В",
              "мощность, требования к автомату",
              "за 30 дней",
            ],
            ["Кран и разгрузка", "масса места, тип строповки", "за 14 дней"],
            [
              "Демо-показ в поле",
              "сценарий, время, требования к покрытию",
              "за 21 день",
            ],
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Субсидии и лизинг",
              text: "Для участников из регионов и хозяйств мы организуем сессию с лизинговыми компаниями: можно обсудить график платежа, а не только цену машины.",
            },
            {
              title: "Иностранный стенд",
              text: "Поможем с временным ввозом выставочного образца, переводом документов и регистрацией делегации.",
            },
            {
              title: "Сезонность",
              text: "Окно продаж короткое: подача заявки после декабря означает соседство с менее релевантным разделом.",
            },
          ],
        },
        {
          type: "quiz",
          title: "Подберём участие за 3 шага",
          text: "Три вопроса — и менеджер пришлёт карту раздела, свободные метры и расчёт.",
          event: "AGROPRO EXPO 2027",
          areas: ["9 м²", "18 м²", "36 м²", "улица 100 м²+"],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "Заявка на участие в AGROPRO EXPO 2027",
          text: "Укажите технику, габариты и потребность в электричестве.",
          event: "AGROPRO EXPO 2027",
          areas: ["9 м²", "18 м²", "36 м²", "улица 100 м²+"],
        },
      ],
      en: [
        {
          type: "table",
          head: ["Request", "What to send", "Deadline"],
          rows: [
            [
              "Indoor space",
              "product description, requested m²",
              "60 days out",
            ],
            [
              "Outdoor area",
              "dimensions, weight, axle loads, installation plan",
              "45 days out",
            ],
            [
              "380 V connection",
              "power demand, breaker requirements",
              "30 days out",
            ],
            [
              "Crane and unloading",
              "weight per spot, rigging type",
              "14 days out",
            ],
            ["Field demo", "scenario, timing, surface needs", "21 days out"],
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Subsidies and leasing",
              text: "For regional participants and farms we run a session with leasing companies: you can discuss the payment schedule, not only the machine price.",
            },
            {
              title: "Foreign stands",
              text: "We assist with temporary admission of the exhibition unit, document translation and delegation registration.",
            },
            {
              title: "Seasonality",
              text: "The sales window is short: applying after December means a less relevant section neighbourhood.",
            },
          ],
        },
        {
          type: "quiz",
          title: "Plan your participation in three steps",
          text: "Three questions — and the manager sends the section map, free metres and the quote.",
          event: "AGROPRO EXPO 2027",
          areas: ["9 m²", "18 m²", "36 m²", "100 m²+ outdoors"],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "AGROPRO EXPO 2027 participation request",
          text: "Name the machinery, dimensions and power needs.",
          event: "AGROPRO EXPO 2027",
          areas: ["9 m²", "18 m²", "36 m²", "100 m²+ outdoors"],
        },
      ],
    },
  },
  visitors: {
    path: "/events/agropro-expo/visitors/",
    image: "/images/event-agropro.jpg",
    meta: {
      ru: {
        title: "AGROPRO 2027 для хозяйств: групповой вход и маршрут",
        description:
          "Как приехать делегацией фермерского хозяйства или кластера: регистрация списком, трансфер, сессии по орошению и лизингу, что взять на переговоры.",
      },
      en: {
        title: "AGROPRO 2027 for farms: group entry and a buying route",
        description:
          "How to attend as a farm or cluster delegation: list registration, transfer, irrigation and leasing sessions, what to bring for negotiations.",
      },
    },
    hero: {
      kicker: { ru: "Посетителям AGROPRO", en: "AGROPRO visitors" },
      title: {
        ru: "Приехать делегацией хозяйства",
        en: "Come as a farm delegation",
      },
      lead: {
        ru: "Для фермерских хозяйств, кластеров и агро-служб районов действует групповой вход и трансфер по заявке.",
        en: "Farm holdings, clusters and district agro-services get group entry and a transfer on request.",
      },
    },
    before: ["audience"],
    after: ["venue", "faq"],
    blocks: {
      ru: [
        {
          type: "checklist",
          items: [
            "Список делегации подаётся за 5 рабочих дней — так мы успеем подготовить пропуска и маршрут.",
            "Для поездки на уличную площадку наденьте обувь: часть техники демонстрируется на открытии.",
            "Возьмите план хозяйства с площадями и культурами — агроном на стенде считает норму под ваши поля.",
            "На сессиях по лизингу и субсидиям нужна доверенность или подтверждение полномочий, если вы принимаете решение.",
          ],
        },
        {
          type: "links",
          items: [
            { label: "Как добраться из региона", href: "/visitors/travel/" },
            { label: "Групповая регистрация", href: "/visitors/tickets/" },
            {
              label: "Программа сессий",
              href: "/events/agropro-expo/program/",
            },
          ],
        },
      ],
      en: [
        {
          type: "checklist",
          items: [
            "Send the delegation list five working days ahead so we prepare passes and a route.",
            "Wear field shoes: part of the machinery is demonstrated outdoors.",
            "Bring your farm plan with areas and crops — the agronomist at the stand computes rates for your fields.",
            "For leasing and subsidy sessions, bring a power of attorney if you sign decisions.",
          ],
        },
        {
          type: "links",
          items: [
            { label: "Travel from the region", href: "/visitors/travel/" },
            { label: "Group registration", href: "/visitors/tickets/" },
            {
              label: "Session programme",
              href: "/events/agropro-expo/program/",
            },
          ],
        },
      ],
    },
  },
  program: {
    path: "/events/agropro-expo/program/",
    image: "/images/venue-conference.jpg",
    meta: {
      ru: {
        title: "Программа AGROPRO EXPO 2027: орошение, субсидии, экспорт",
        description:
          "Сессии о капельном орошении, господдержке и лизинге, хранении урожая, сертификации и экспорте; ярмарка вакансий АПК. Синхронный перевод для делегаций.",
      },
      en: {
        title: "AGROPRO EXPO 2027 programme: irrigation, subsidies, export",
        description:
          "Sessions on drip irrigation, state support and leasing, harvest storage, certification and export, plus an agri careers fair with interpreting.",
      },
    },
    hero: {
      kicker: { ru: "Деловая программа", en: "Business programme" },
      title: {
        ru: "Орошение, субсидии, экспорт",
        en: "Irrigation, subsidies, export",
      },
      lead: {
        ru: "Сессии готовят совместно с отраслевыми ведомствами и ассоциациями: сначала практика поля, потом регуляторика.",
        en: "Sessions are prepared with industry bodies and associations: field practice first, regulation second.",
      },
    },
    before: ["programme"],
    after: ["speakers", "faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Тема", "Кто говорит", "Зачем идти"],
          rows: [
            [
              "Капельное орошение: проект и стоимость",
              "проектировщики, поставщики систем",
              "сравнить цену метра и нормы полива",
            ],
            [
              "Субсидии и лизинг техники",
              "фонды, банки, Минсельхоз",
              "понять, какая техника доступна в этом сезоне",
            ],
            [
              "Экспорт плодоовощной продукции",
              "упаковка, логистика, сертификация",
              "требования рынков и документы",
            ],
            [
              "Хранение урожая",
              "плодохранилища, холодильные системы",
              "окупаемость и режимы хранения",
            ],
            [
              "Ярмарка вакансий АПК",
              "вузы, кластеры, хозяйства",
              "кадры для сезонов 2027–2028",
            ],
          ],
        },
        {
          type: "callout",
          tone: "sand",
          title: "Языки программы",
          text: "Основные сессии идут на русском и узбекском с синхронным переводом на английский для иностранных делегаций.",
          image: "/images/conference-audience.jpg",
          imageAlt: "Сессия AGROPRO EXPO с синхронным переводом",
        },
      ],
      en: [
        {
          type: "table",
          head: ["Topic", "Who speaks", "Why attend"],
          rows: [
            [
              "Drip irrigation: design and cost",
              "designers and system suppliers",
              "compare price per meter and irrigation norms",
            ],
            [
              "Subsidies and machinery leasing",
              "funds, banks, ministry",
              "see what machinery is financeable this season",
            ],
            [
              "Fruit and vegetable export",
              "packaging, logistics, certification",
              "market requirements and paperwork",
            ],
            [
              "Harvest storage",
              "storage and cold chain providers",
              "payback and storage regimes",
            ],
            [
              "Agri careers fair",
              "universities, clusters, farms",
              "staff for the 2027–2028 seasons",
            ],
          ],
        },
        {
          type: "callout",
          tone: "sand",
          title: "Programme languages",
          text: "Core sessions run in Russian and Uzbek with simultaneous English interpreting for foreign delegations.",
          image: "/images/conference-audience.jpg",
          imageAlt: "AGROPRO EXPO session with simultaneous interpreting",
        },
      ],
    },
  },
};

/* ------------------------------------------------------------------ PROMOTORS (past edition) */
eventPages["promotors-show-samarkand"] = {
  overview: {
    path: "/events/promotors-show-samarkand/",
    image: "/images/event-promotors.jpg",
    meta: {
      ru: {
        title: "PROMOTORS SHOW SAMARKAND 2026 — итоги авто-фестиваля",
        description:
          "Архив редакции 12–13 сентября 2026: дрифт, SPL-автотюнинг, детейлинг, ретро, гонки безмоторных машин, призовой фонд 10/6/4 млн сумов и экспозиция автобизнеса.",
      },
      en: {
        title: "PROMOTORS SHOW SAMARKAND 2026 — festival results",
        description:
          "Archive of the 12–13 September 2026 edition: drift, SPL audio, detailing, retro builds, soapbox racing, a 10/6/4 million UZS prize fund and the automotive expo.",
      },
    },
    noindex: true,
    hero: {
      kicker: {
        ru: "Прошедшая редакция · архив",
        en: "Past edition · archive",
      },
      title: {
        ru: "PROMOTORS SHOW SAMARKAND: авто-фестиваль и выставка индустрии",
        en: "PROMOTORS SHOW SAMARKAND: an auto festival and an industry expo",
      },
      lead: {
        ru: "12–13 сентября 2026 года: дрифт, SPL-авиакустика, детейлинг, ретро-техника, гонки безмоторных машин и экспозиция автобизнеса. Ниже — итоги и материалы редакции.",
        en: "12–13 September 2026: drifting, SPL car audio, detailing, retro machines, soapbox racing and the automotive business expo. Results and materials below.",
      },
    },
    before: ["facts"],
    after: ["categories", "audience", "materials", "related"],
    blocks: {
      ru: [
        {
          type: "h2",
          kicker: "Как это было",
          title: "Два дня, в которых шоу и бизнес работают вместе",
        },
        {
          type: "text",
          paragraphs: [
            "PROMOTORS SHOW устроен как фестиваль с промышленной частью: снаружи — трасса, пит-зона и маркет, в зале — экспозиция брендов запчастей, химии, детейлинга и автозвука. Такая конфигурация даёт дилеру аудиторию, а бренду — продажи с прилавка в те же два дня.",
            "Призовой фонд распределялся по трём местам: 10, 6 и 4 млн сумов. Билеты продавались через Ticketon.uz, отдельные категории — бесплатные проходы для специалистов автобизнеса.",
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "car",
              title: "Чемпионат по дрифту",
              text: "Заезды на трассе центра, судейство по линиям и угол, награждение на сцене.",
            },
            {
              icon: "audio",
              title: "SPL-автотюнинг",
              text: "Громкость и качество звука: замеры, категории, зрительская голосовалка.",
            },
            {
              icon: "sparkle",
              title: "Детейлинг и ретро",
              text: "Полировка, химия, восстановление техники, выставка самодельных машин.",
            },
            {
              icon: "ticket",
              title: "Маркет",
              text: "Запчасти, аксессуары, атрибутика — продажа со стенда в день фестиваля.",
            },
            {
              icon: "users",
              title: "B2B-зона",
              text: "Переговоры дистрибьюторов с СТО, мойками и магазинами аксессуаров.",
            },
            {
              icon: "megaphone",
              title: "Спонсорство",
              text: "Брендирование трассы, сцены, наград и билетной зоны.",
            },
          ],
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Следующая редакция",
          title: "Даты и условия участия — по запросу",
          text: "Пишите, если хотите получить бриф следующей редакции, статистику посещаемости 2026 года и прайс на спонсорство.",
          action: { label: "Запросить материалы", href: "/contacts/" },
        },
        {
          type: "files",
          items: [
            {
              title: "Презентация редакции 2026",
              href: "/files/promotors-2026.pdf",
              note: "структура, трасса, пакеты",
              kind: "pdf",
            },
            {
              title: "Спонсорское предложение",
              href: "/files/promotors-sponsorship.pdf",
              note: "поверхности и интеграции",
              kind: "pdf",
            },
            {
              title: "Фотоотчёт",
              href: "/venue/gallery/",
              note: "съёмка с площадки",
              kind: "link",
            },
          ],
        },
      ],
      en: [
        {
          type: "h2",
          kicker: "How it went",
          title: "Two days where show and business run together",
        },
        {
          type: "text",
          paragraphs: [
            "PROMOTORS SHOW is built as a festival with an industrial half: outside the track, pit zone and market; inside the expo of parts, chemicals, detailing and car audio brands. This gives a dealer an audience and a brand retail sales on the same two days.",
            "The prize fund was split across three places: 10, 6 and 4 million UZS. Tickets ran through Ticketon.uz, with free passes for automotive trade specialists.",
          ],
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "car",
              title: "Drift championship",
              text: "Heats on the centre track, judged by lines and angle, awards on stage.",
            },
            {
              icon: "audio",
              title: "SPL car audio",
              text: "Loudness and quality: measurements, categories, audience vote.",
            },
            {
              icon: "sparkle",
              title: "Detailing and retro",
              text: "Polishing, chemistry, restoration, homemade machine exhibition.",
            },
            {
              icon: "ticket",
              title: "Market",
              text: "Parts, accessories, merchandising — sold from the stand during the festival.",
            },
            {
              icon: "users",
              title: "B2B zone",
              text: "Distributor negotiations with service stations, car washes and accessory shops.",
            },
            {
              icon: "megaphone",
              title: "Sponsorship",
              text: "Track, stage, awards and ticket-zone branding.",
            },
          ],
        },
        {
          type: "callout",
          tone: "gold",
          kicker: "Next edition",
          title: "Dates and terms on request",
          text: "Write to us for the next-edition brief, 2026 attendance statistics and the sponsorship rate card.",
          action: { label: "Request materials", href: "/contacts/" },
        },
        {
          type: "files",
          items: [
            {
              title: "2026 edition presentation",
              href: "/files/promotors-2026.pdf",
              note: "structure, track, packages",
              kind: "pdf",
            },
            {
              title: "Sponsorship proposal",
              href: "/files/promotors-sponsorship.pdf",
              note: "surfaces and integrations",
              kind: "pdf",
            },
            {
              title: "Photo report",
              href: "/venue/gallery/",
              note: "shot on site",
              kind: "link",
            },
          ],
        },
      ],
    },
  },
  exhibitors: {
    path: "/events/promotors-show-samarkand/exhibitors/",
    image: "/images/event-promotors.jpg",
    meta: {
      ru: {
        title: "PROMOTORS SHOW: форматы участия для брендов автоиндустрии",
        description:
          "Архив пакетов редакции 2026: экспозиция в зале, пит-стоп на улице, спонсорство шоу и регламенты. Заявки на следующую редакцию принимаются после публикации дат.",
      },
      en: {
        title: "PROMOTORS SHOW: participation formats for automotive brands",
        description:
          "Archive of the 2026 packages: hall expo, outdoor pit stop and show sponsorship, plus regulations. Applications for the next edition open with the dates.",
      },
    },
    noindex: true,
    hero: {
      kicker: { ru: "Архив участия", en: "Participation archive" },
      title: {
        ru: "Как брендам автоиндустрии работать на этом фестивале",
        en: "How automotive brands work this festival",
      },
      lead: {
        ru: "Экспозиция в зале, пит-стоп на улице, спонсорство шоу: три формата, которые приносили продажи и узнаваемость в 2026 году.",
        en: "Hall expo, outdoor pit stop, show sponsorship: three formats that delivered sales and awareness in 2026.",
      },
    },
    before: ["stands"],
    after: ["audience", "faq"],
    blocks: {
      ru: [
        {
          type: "rows",
          items: [
            {
              title: "Экспозиция в зале",
              text: "Стенд 9–18 м² с витриной под товар и зоной расчёта. Продажи с площадки в дни фестиваля разрешены.",
            },
            {
              title: "Пит-стоп на улице",
              text: "Рабочая зона у трассы: электричество, вода, возможность показать продукт в действии на машинах зрителей.",
            },
            {
              title: "Спонсорство шоу",
              text: "Логотип на трассе и на сцене, интеграция в награждение, упоминание ведущим, промо-зона у входа.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Регламент единый для всех: согласование логотипов на машинах, требования к звуку и режим работы маркета. Заявки на следующую редакцию принимаются после публикации дат.",
          ],
        },
      ],
      en: [
        {
          type: "rows",
          items: [
            {
              title: "Hall expo",
              text: "A 9–18 m² stand with a product showcase and a checkout zone. Selling from the stand during the festival is allowed.",
            },
            {
              title: "Outdoor pit stop",
              text: "A working bay next to the track: power, water, a chance to demo the product on spectators\u2019 cars.",
            },
            {
              title: "Show sponsorship",
              text: "Logos on track and stage, integration into the awards, host mentions, a promo zone at the entrance.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "One regulation for everyone: car livery approval, sound limits and market opening hours. Applications for the next edition open once the dates are published.",
          ],
        },
      ],
    },
  },
  visitors: {
    path: "/events/promotors-show-samarkand/visitors/",
    image: "/images/event-promotors.jpg",
    meta: {
      ru: {
        title: "PROMOTORS SHOW 2026: билеты и правила фестиваля",
        description:
          "Как проходил фестиваль: билеты Ticketon.uz, допуски к трассе, заезды на безмоторных машинах, правила для детей, клубов и владельцев автомобилей.",
      },
      en: {
        title: "PROMOTORS SHOW 2026: tickets and festival rules",
        description:
          "How the festival ran: Ticketon.uz tickets, track access, spectator soapbox entry and rules for children and car clubs.",
      },
    },
    noindex: true,
    hero: {
      kicker: { ru: "Посетителям фестиваля", en: "Festival visitors" },
      title: {
        ru: "Билет, шоу-программа и маркет",
        en: "Ticket, show programme and market",
      },
      lead: {
        ru: "Билеты продавались через Ticketon.uz, часть программы была бесплатной для владельцев автомобилей и клубов.",
        en: "Tickets were sold via Ticketon.uz; part of the programme was free for car owners and clubs.",
      },
    },
    after: ["faq", "venue"],
    blocks: {
      ru: [
        {
          type: "checklist",
          items: [
            "Билет даёт доступ на все зоны фестиваля, кроме пит-стопов и рабочей части.",
            "Для заездов на безмоторных машинах — отдельная регистрация и шлем.",
            "С собой: документы на автомобиль, если участвуете в шоу-классе.",
            "Дети до 14 лет — со взрослым; зона у трассы ограничена по доступу.",
          ],
        },
        {
          type: "links",
          items: [
            {
              label: "Купить билет на следующие события",
              href: "/visitors/tickets/",
            },
            { label: "Как добраться", href: "/venue/how-to-get-there/" },
          ],
        },
      ],
      en: [
        {
          type: "checklist",
          items: [
            "A ticket covers all festival zones except pit stops and working areas.",
            "Soapbox racing needs a separate entry and a helmet.",
            "Bring vehicle documents if you enter a show class.",
            "Children under 14 come with an adult; the track-side area is restricted.",
          ],
        },
        {
          type: "links",
          items: [
            {
              label: "Tickets for upcoming events",
              href: "/visitors/tickets/",
            },
            { label: "Getting there", href: "/venue/how-to-get-there/" },
          ],
        },
      ],
    },
  },
  program: {
    path: "/events/promotors-show-samarkand/program/",
    image: "/images/event-promotors.jpg",
    meta: {
      ru: {
        title: "Программа PROMOTORS SHOW 2026: дрифт, SPL, награждение",
        description:
          "Расписание редакции 2026 года: квалификация и парные заезды по дрифту, SPL-замеры, мастер-классы по детейлингу и награждение на сцене.",
      },
      en: {
        title: "PROMOTORS SHOW 2026 programme: drift, SPL, awards",
        description:
          "The 2026 schedule: drift qualification and pair heats, SPL measurement, detailing masterclasses and awards on stage.",
      },
    },
    noindex: true,
    hero: {
      kicker: { ru: "Программа редакции 2026", en: "2026 programme" },
      title: { ru: "Трасса, сцена, судейство", en: "Track, stage, judging" },
      lead: {
        ru: "Расписание строилось по дням: квалификация, парные заезды, финалы и награждение между блоками шоу.",
        en: "The schedule ran by day: qualification, pair heats, finals and awards between show blocks.",
      },
    },
    before: ["programme"],
    after: ["faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Блок", "Что происходило", "Формат"],
          rows: [
            [
              "Дрифт",
              "квалификация, парные заезды, финал",
              "судейство по линиям",
            ],
            [
              "SPL",
              "замеры громкости, категории звука",
              "техническая комиссия",
            ],
            ["Детейлинг", "демо-полировка, разбор покрытий", "мастер-класс"],
            [
              "Гонки безмоторных машин",
              "трасса и любительский заезд",
              "открытая регистрация",
            ],
            [
              "Награждение",
              "призовой фонд 10 / 6 / 4 млн сумов",
              "сцена, первый и второй день",
            ],
          ],
        },
      ],
      en: [
        {
          type: "table",
          head: ["Block", "What happened", "Format"],
          rows: [
            ["Drift", "qualification, pair heats, final", "judged on lines"],
            [
              "SPL",
              "loudness measurement, audio categories",
              "technical panel",
            ],
            ["Detailing", "polish demos, coating review", "masterclass"],
            ["Soapbox racing", "track and amateur run", "open entry"],
            [
              "Awards",
              "prize fund of 10 / 6 / 4 million UZS",
              "stage, day one and two",
            ],
          ],
        },
      ],
    },
  },
};

/* ------------------------------------------------------------------ WORLD EDU */
eventPages["world-edu-expo"] = {
  overview: {
    path: "/events/world-edu-expo/",
    image: "/images/event-worldedu.jpg",
    meta: {
      ru: {
        title: "WORLD EDU EXPO 2027 — выставка образования в Самарканде",
        description:
          "9–10 апреля 2027: вузы Узбекистана, России, Беларуси, Казахстана, Европы и Турции, стипендии, консультации по IELTS, GMAT и SAT, профориентация и розыгрыш призов.",
      },
      en: {
        title: "WORLD EDU EXPO 2027 — education exhibition in Samarkand",
        description:
          "9–10 April 2027: universities from Uzbekistan, Russia, Belarus, Kazakhstan, Europe and Turkey, scholarships, IELTS, GMAT and SAT consultations, guidance and a prize draw.",
      },
    },
    hero: {
      kicker: {
        ru: "Выставка образования · spring",
        en: "Education exhibition · spring",
      },
      title: {
        ru: "WORLD EDU: кем учиться, где и за чей счёт",
        en: "WORLD EDU: what to study, where and who pays",
      },
      lead: {
        ru: "Абитуриенты и родители встречаются с приёмными комиссиями вузов Узбекистана, России, Беларуси, Казахстана, Европы, Юго-Восточной Азии и Турции, получают оценку шансов и план поступления.",
        en: "Applicants and parents meet admissions offices of universities from Uzbekistan, Russia, Belarus, Kazakhstan, Europe, South-East Asia and Turkey, and leave with a chance assessment and a study plan.",
      },
      bullets: [
        {
          ru: "Консультации по IELTS, GMAT, SAT",
          en: "IELTS, GMAT, SAT consultations",
        },
        {
          ru: "Презентации стипендий и грантов",
          en: "Scholarship and grant presentations",
        },
        {
          ru: "Розыгрыш призов среди зарегистрированных",
          en: "Prize draw for registered visitors",
        },
      ],
    },
    before: ["facts"],
    after: ["categories", "programme", "materials", "faq", "related"],
    blocks: {
      ru: [
        {
          type: "h2",
          kicker: "Как это устроено",
          title: "Не ярмарка вузов, а маршрут поступления",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cap",
              title: "Стенд вуза",
              text: "Требования, стоимость, документы, собеседование. Спрашивайте про проходные баллы и места по гранту.",
            },
            {
              icon: "search",
              title: "Оценка шансов",
              text: "Консультант смотрит ваши баллы и профиль и говорит честно: туда — реально, сюда — нужно готовиться.",
            },
            {
              icon: "book",
              title: "Тестирование на месте",
              text: "Пробный IELTS/GMAT/SAT и разбор результатов с экспертом: за 40 минут понимаете дистанцию до цели.",
            },
            {
              icon: "money",
              title: "Стипендии",
              text: "Презентации грантов, образовательных кредитов и программ обмена — с дедлайнами подачи.",
            },
            {
              icon: "users",
              title: "Профориентация",
              text: "Тесты и консультации для старшеклассников вместе с родителями.",
            },
            {
              icon: "globe",
              title: "Обучение за рубежом",
              text: "Консультанты по поступлению, подготовительные курсы, визовые и жилые вопросы.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Выставка проходит в апреле, когда решение уже созрело, но до подачи документов ещё есть время: это последний шанс изменить подготовку, а не просто посмотреть буклеты.",
            "Мы просим вузы приносить не только буклеты, а конкретные цифры: конкурс на направление, стоимость, стипендиальные места и требования к языку. Без этого разговор с абитуриентом не сложится.",
          ],
          image: "/images/students-campus.jpg",
          imageAlt: "Студенты на кампусе — аудитория WORLD EDU EXPO",
        },
        {
          type: "quote",
          text: "Самая дорогая ошибка абитуриента — год, потраченный на подготовку «в никуда». На выставке этот год можно сэкономить.",
          cite: "проектная команда WORLD EDU",
        },
      ],
      en: [
        {
          type: "h2",
          kicker: "How it works",
          title: "Not a university fair but an admissions route",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cap",
              title: "University stand",
              text: "Requirements, tuition, documents, an interview. Ask about cut-off scores and grant places.",
            },
            {
              icon: "search",
              title: "Chance assessment",
              text: "A consultant looks at your scores and profile and says it plainly: this one is realistic, that one needs preparation.",
            },
            {
              icon: "book",
              title: "On-site testing",
              text: "A mock IELTS/GMAT/SAT with an expert review: forty minutes and you know the distance to the goal.",
            },
            {
              icon: "money",
              title: "Scholarships",
              text: "Grants, education loans and exchange programs with submission deadlines.",
            },
            {
              icon: "users",
              title: "Career guidance",
              text: "Testing and consultations for senior pupils together with parents.",
            },
            {
              icon: "globe",
              title: "Studying abroad",
              text: "Admission consultants, foundation courses, visa and housing questions.",
            },
          ],
        },
        {
          type: "text",
          paragraphs: [
            "The show runs in April, when the decision has formed but applications are still ahead: it is the last chance to change your preparation, not just collect brochures.",
            "We ask universities to bring numbers, not only leaflets: competition per program, tuition, scholarship seats and language requirements. Without that, a conversation with an applicant does not happen.",
          ],
          image: "/images/students-campus.jpg",
          imageAlt: "Students on campus — the WORLD EDU EXPO audience",
        },
        {
          type: "quote",
          text: "The costliest mistake of an applicant is a year spent preparing for nothing. At the show you can save that year.",
          cite: "the WORLD EDU project team",
        },
      ],
    },
  },
  exhibitors: {
    path: "/events/world-edu-expo/exhibitors/",
    image: "/images/venue-conference.jpg",
    meta: {
      ru: {
        title: "Вузам и консультантам: участие в WORLD EDU 2027",
        description:
          "Инфостойка, стенд с экраном, сессия в конференц-зале и профориентация для школ. Требования к материалам, каталог участников и сроки подачи заявок.",
      },
      en: {
        title: "For universities and agencies: exhibiting at WORLD EDU 2027",
        description:
          "Information desk, stand with a screen, a conference-hall session and school guidance. Material requirements, exhibitor catalogue and deadlines.",
      },
    },
    hero: {
      kicker: {
        ru: "Вузам и консультантам",
        en: "For universities and agencies",
      },
      title: {
        ru: "Стенд, презентация, поток абитуриентов",
        en: "A stand, a presentation, a flow of applicants",
      },
      lead: {
        ru: "Для приёмных комиссий, колледжей, языковых центров и EdTech: три формата участия и требования к материалам.",
        en: "For admissions offices, colleges, language centres and EdTech: three formats and what to prepare.",
      },
    },
    before: ["stands"],
    after: ["benefits", "materials", "faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Формат", "Что получаете", "Что нужно от вас"],
          rows: [
            [
              "Инфостойка",
              "поток абитуриентов, сбор заявок",
              "цифры приёма, требования, листовки",
            ],
            [
              "Стенд с экраном",
              "показ кампуса, программ, проживания",
              "видеоролик 3–5 минут, тайминг",
            ],
            [
              "Сессия в конференц-зале",
              "40 минут с аудиторией и вопросами",
              "спикер, презентация, модератор от нас",
            ],
            [
              "Участие в профориентации",
              "работа со школьными группами",
              "тесты и консультант",
            ],
          ],
        },
        {
          type: "text",
          paragraphs: [
            "Мы публикуем каталог участников на сайте выставки и в онлайновом каталоге: карточка вуза с программами, стоимостью и контактами приёмной комиссии. Заявки на каталог закрываются за три недели до открытия.",
            "Для иностранных вузов помогаем с визовой поддержкой, переводом презентаций и размещением делегации.",
          ],
          image: "/images/hall-stand.jpg",
          imageAlt: "Стенды вузов на WORLD EDU EXPO",
        },
        {
          type: "quiz",
          title: "Подберём участие за 3 шага",
          text: "Три вопроса — и менеджер пришлёт карту раздела, свободные метры и расчёт.",
          event: "WORLD EDU EXPO",
          areas: ["Инфостойка", "Стенд с экраном", "Сессия в зале"],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "Заявка на участие в WORLD EDU",
          text: "Выберите формат и приложите список программ.",
          event: "WORLD EDU EXPO",
          areas: ["Инфостойка", "Стенд с экраном", "Сессия в зале"],
        },
      ],
      en: [
        {
          type: "table",
          head: ["Format", "What you get", "What we need"],
          rows: [
            [
              "Information desk",
              "an applicant flow, applications collected",
              "admission figures, requirements, leaflets",
            ],
            [
              "Stand with a screen",
              "campus, programs and housing on video",
              "a 3–5 minute film, timing",
            ],
            [
              "Conference-hall session",
              "40 minutes with a live audience and questions",
              "a speaker, slides, our moderator",
            ],
            [
              "Career guidance slot",
              "work with school groups",
              "tests and a consultant",
            ],
          ],
        },
        {
          type: "text",
          paragraphs: [
            "We publish the exhibitor catalogue on the show page and in the online catalogue: a university card with programs, tuition and admissions contacts. Catalogue entries close three weeks before opening.",
            "Foreign universities get help with visa support, translation of presentations and delegation accommodation.",
          ],
          image: "/images/hall-stand.jpg",
          imageAlt: "University stands at WORLD EDU EXPO",
        },
        {
          type: "quiz",
          title: "Plan your participation in three steps",
          text: "Three questions — and the manager sends the section map, free metres and the quote.",
          event: "WORLD EDU EXPO",
          areas: ["Information desk", "Stand with a screen", "Hall session"],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "WORLD EDU participation request",
          text: "Choose the format and attach your program list.",
          event: "WORLD EDU EXPO",
          areas: ["Information desk", "Stand with a screen", "Hall session"],
        },
      ],
    },
  },
  visitors: {
    path: "/events/world-edu-expo/visitors/",
    image: "/images/event-worldedu.jpg",
    meta: {
      ru: {
        title: "Абитуриентам WORLD EDU 2027: регистрация и маршрут",
        description:
          "Как попасть на выставку образования: бесплатный вход по регистрации, оценка шансов на поступление, пробные IELTS/GMAT/SAT, сессии для родителей и школьных групп.",
      },
      en: {
        title: "WORLD EDU 2027 for applicants: registration and route",
        description:
          "How to attend: free entry after registration, admission chance assessment, mock IELTS/GMAT/SAT, parent sessions and school group routes.",
      },
    },
    hero: {
      kicker: {
        ru: "Абитуриентам и родителям",
        en: "For applicants and parents",
      },
      title: {
        ru: "Прийти с аттестатом и списком вопросов",
        en: "Bring your transcript and a list of questions",
      },
      lead: {
        ru: "Вход свободный по регистрации. Розыгрыш призов — только среди зарегистрированных посетителей.",
        en: "Free entry after registration. The prize draw runs among registered visitors only.",
      },
    },
    before: ["audience"],
    after: ["faq", "venue"],
    blocks: {
      ru: [
        {
          type: "steps",
          items: [
            {
              title: "Зарегистрируйтесь",
              text: "Один шаг: имя, школа или вуз, телефон. Пришлёте QR-билет и список участников.",
            },
            {
              title: "Отметьте интересующие направления",
              text: "В анкете выберите специальность и страну обучения — по этому списку построим маршрут.",
            },
            {
              title: "Пройдите оценку шансов",
              text: "Слот 20 минут с консультантом, с собой: последние баллы, перечень предметов, результаты языковых тестов.",
            },
            {
              title: "Запишитесь на тестирование",
              text: "Пробный IELTS/GMAT/SAT в день выставки, разбор — сразу после.",
            },
            {
              title: "Соберите документы по итогам",
              text: "Список требований по каждому вузу, дедлайны подачи, стоимость обучения — заберите на стойке информации.",
            },
          ],
        },
        {
          type: "checklist",
          items: [
            "Школьные классы приезжают списком: заявка за 5 дней, сопровождение и отдельная сессия.",
            "Родителям полезен трек о финансировании: гранты, кредиты, рассрочка.",
            "Фото и видео на сцене — по аккредитации, на стендах — свободно.",
          ],
        },
      ],
      en: [
        {
          type: "steps",
          items: [
            {
              title: "Register",
              text: "One step: name, school or university, phone. You receive a QR ticket and the participant list.",
            },
            {
              title: "Mark your fields of interest",
              text: "Pick a major and a country in the form — that is what builds your route.",
            },
            {
              title: "Get a chance assessment",
              text: "A 20-minute slot with a consultant; bring your latest scores, subject list and language results.",
            },
            {
              title: "Book the test",
              text: "A mock IELTS/GMAT/SAT on show day with the review right after.",
            },
            {
              title: "Collect the follow-up",
              text: "Requirements per university, submission deadlines, tuition — picked up at the information desk.",
            },
          ],
        },
        {
          type: "checklist",
          items: [
            "School classes come by list: apply five days ahead for assistance and a dedicated session.",
            "Parents get a financing track: grants, loans, instalments.",
            "Filming on stage requires accreditation; at stands it is free.",
          ],
        },
      ],
    },
  },
  program: {
    path: "/events/world-edu-expo/program/",
    image: "/images/venue-conference.jpg",
    meta: {
      ru: {
        title: "Программа WORLD EDU 2027: презентации вузов и тесты",
        description:
          "30-минутные презентации университетов и стран, языковые блоки, сессия для родителей, профориентация для классов и розыгрыш призов.",
      },
      en: {
        title: "WORLD EDU 2027 programme: university presentations and tests",
        description:
          "30-minute university and destination presentations, language blocks, a parent session, school guidance and the prize draw.",
      },
    },
    hero: {
      kicker: { ru: "Сцены и сессии", en: "Stages and sessions" },
      title: {
        ru: "Презентации, тесты, розыгрыш",
        en: "Presentations, tests, a prize draw",
      },
      lead: {
        ru: "Расписание блокируется за неделю: 30-минутные презентации вузов, практические сессии для абитуриентов, консультация для родителей.",
        en: "The timetable locks a week ahead: 30-minute university slots, practical sessions for applicants, a parent consultation.",
      },
    },
    before: ["programme"],
    after: ["faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Блок", "Содержание", "Длительность"],
          rows: [
            [
              "Презентация вуза",
              "программы, стоимость, требования, стипендии",
              "30 минут",
            ],
            [
              "Страна обучения",
              "разбор системы образования и визовых правил",
              "30 минут",
            ],
            [
              "Языковой блок",
              "как готовиться к IELTS/SAT и сколько это стоит",
              "45 минут",
            ],
            [
              "Родительская сессия",
              "бюджет, риски, контроль учёбы",
              "45 минут",
            ],
            [
              "Розыгрыш",
              "призы среди зарегистрированных посетителей",
              "конец дня",
            ],
          ],
        },
        {
          type: "callout",
          tone: "sand",
          title: "Школам — отдельный слот",
          text: "Для организованных групп проводим экскурсию по стендам и профориентационный практикум: 60 минут без очереди на общую сессию.",
          image: "/images/students-campus.jpg",
          imageAlt: "Школьная группа на WORLD EDU EXPO",
        },
      ],
      en: [
        {
          type: "table",
          head: ["Block", "Content", "Length"],
          rows: [
            [
              "University presentation",
              "programs, tuition, requirements, scholarships",
              "30 minutes",
            ],
            [
              "Study destination",
              "how the education system and visa rules work",
              "30 minutes",
            ],
            [
              "Language block",
              "how to prepare for IELTS/SAT and what it costs",
              "45 minutes",
            ],
            ["Parent session", "budget, risks, academic control", "45 minutes"],
            ["Prize draw", "among registered visitors", "end of day"],
          ],
        },
        {
          type: "callout",
          tone: "sand",
          title: "A slot for schools",
          text: "Organized groups get a stand tour and a guidance workshop: 60 minutes without queueing at the general session.",
          image: "/images/students-campus.jpg",
          imageAlt: "School group at WORLD EDU EXPO",
        },
      ],
    },
  },
};

/* ------------------------------------------------------------------ ECOM & RETAIL */
eventPages["ecom-retail-expo"] = {
  overview: {
    path: "/events/ecom-retail-expo/",
    image: "/images/event-ecom.jpg",
    meta: {
      ru: {
        title: "ECOM & RETAIL EXPO 2027 — форум e-commerce в Самарканде",
        description:
          "16–17 июня 2027, White Label Edition: производители, селлеры, маркетплейсы, логистика и финтех. Биржа контактов, фото-зона и тематические треки программы.",
      },
      en: {
        title: "ECOM & RETAIL EXPO 2027 — e-commerce forum in Samarkand",
        description:
          "16–17 June 2027, White Label Edition: manufacturers, sellers, marketplaces, logistics and fintech. Contact exchange, photo zone and programme tracks.",
      },
    },
    hero: {
      kicker: { ru: "White Label Edition", en: "White Label Edition" },
      title: {
        ru: "ECOM & RETAIL: полка, которая живёт в приложении",
        en: "ECOM & RETAIL: the shelf that lives inside an app",
      },
      lead: {
        ru: "Выставка-форум электронной коммерции и ритейла: производители предлагают готовый продукт под чужим брендом, селлеры ищут товар, сервисы — клиентов. При поддержке Ассоциации продавцов Узбекистана.",
        en: "A trade show and forum for e-commerce and retail: manufacturers offer ready product under someone else\u2019s brand, sellers look for supply, services look for clients. Backed by the Uzbekistan Sellers Association.",
      },
      bullets: [
        {
          ru: "Треки: маркетплейсы, логистика, финтех",
          en: "Tracks: marketplaces, logistics, fintech",
        },
        {
          ru: "Биржа контактов с pre-matched встречами",
          en: "Pre-matched contact exchange",
        },
        { ru: "Фото-зона для карточек товара", en: "Product photography zone" },
      ],
    },
    before: ["facts"],
    after: [
      "categories",
      "programme",
      "audience",
      "materials",
      "faq",
      "related",
    ],
    blocks: {
      ru: [
        {
          type: "h2",
          kicker: "Модель White Label",
          title: "Производителю — загрузка, продавцу — товар без риска",
        },
        {
          type: "text",
          paragraphs: [
            "Логика выставки простая: узбекский производитель умеет делать продукт, но не умеет продавать онлайн; предприниматель умеет продавать, но не имеет производства. White Label смыкает эти две компетенции в одну сделку — контрактное производство под брендом продавца.",
            "Отсюда и состав участников: фабрики и цеха, селлеры маркетплейсов, фулфилмент, эквайринг и рассрочки, IT-сервисы для торговли, упаковка и фото-продакшн.",
          ],
          image: "/images/supermarket-aisle.jpg",
          imageAlt: "Розничная полка — раздел E-COM & RETAIL EXPO",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "package",
              title: "Партнёр-производитель",
              text: "Показывает товар и возможности линии, получает заказы на серии и контрактное производство.",
            },
            {
              icon: "cart",
              title: "Селлер",
              text: "Находит продукт под свой бренд, считает маржу с себестоимости и логистики на месте.",
            },
            {
              icon: "truck",
              title: "Логистика и фулфилмент",
              text: "Склад, последняя миля, возвраты — то, на чём сыпется большинство новичков.",
            },
            {
              icon: "chart",
              title: "Финтех",
              text: "Эквайринг, рассрочка, платежи, скоринг для оптовых закупок.",
            },
            {
              icon: "megaphone",
              title: "Маркетинг",
              text: "Продвижение в сетях, инфлюенсеры, карточки товара, аналитика продаж.",
            },
            {
              icon: "camera",
              title: "Фото-зона",
              text: "Съёмка образцов для карточек прямо на площадке — по расписанию.",
            },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Соорганизатор — Ассоциация продавцов",
              text: "Программа форума и биржа контактов формируются вместе с ассоциацией: запросы сетей и селлеров известны до старта.",
            },
            {
              title: "Поддержка региональной администрации",
              text: "Событие проходит при поддержке Управления Самаркандской области — для местных производителей это ещё и вопрос мер поддержки.",
            },
            {
              title: "Два дня вместо недель переписки",
              text: "Форум идёт параллельно с экспозицией: утром — сессия про комиссии маркетплейсов, днём — переговоры, вечером — список контактов.",
            },
          ],
        },
      ],
      en: [
        {
          type: "h2",
          kicker: "The White Label model",
          title:
            "Capacity for the factory, product for the seller without risk",
        },
        {
          type: "text",
          paragraphs: [
            "The logic is simple: an Uzbek manufacturer can produce but cannot sell online; an entrepreneur can sell but has no production. White Label closes those two competencies into one deal — contract manufacturing under the seller\u2019s brand.",
            "That defines the line-up: factories and workshops, marketplace sellers, fulfilment, acquiring and instalments, IT services for retail, packaging and photo production.",
          ],
          image: "/images/supermarket-aisle.jpg",
          imageAlt: "Retail shelf — an E-COM & RETAIL EXPO section",
        },
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "package",
              title: "Partner manufacturer",
              text: "Shows the product and the line capacity, takes series orders and contract production.",
            },
            {
              icon: "cart",
              title: "Seller",
              text: "Finds a product under their brand and computes margin from cost and logistics on the spot.",
            },
            {
              icon: "truck",
              title: "Logistics and fulfilment",
              text: "Warehouse, last mile, returns — what most newcomers break on.",
            },
            {
              icon: "chart",
              title: "Fintech",
              text: "Acquiring, instalments, payments, scoring for wholesale purchases.",
            },
            {
              icon: "megaphone",
              title: "Marketing",
              text: "Social promotion, influencers, product cards, sales analytics.",
            },
            {
              icon: "camera",
              title: "Photo zone",
              text: "Shooting samples for marketplace cards on site, by schedule.",
            },
          ],
        },
        {
          type: "rows",
          items: [
            {
              title: "Co-organized with the Sellers Association",
              text: "The programme and the contact exchange are built with the association: chain and seller demands are known before sales open.",
            },
            {
              title: "Regional administration support",
              text: "The event runs with the support of the Samarkand Region Administration — for local producers that also means access to support measures.",
            },
            {
              title: "Two days instead of weeks of email",
              text: "The forum runs next to the expo: a session on marketplace commissions in the morning, negotiations at noon, a contact list by evening.",
            },
          ],
        },
      ],
    },
  },
  exhibitors: {
    path: "/events/ecom-retail-expo/exhibitors/",
    image: "/images/event-ecom.jpg",
    meta: {
      ru: {
        title: "Участие в ECOM & RETAIL 2027: витрина, сервис, спонсорство",
        description:
          "Форматы для производителей и сервисов, подготовка к бирже контактов, прайс на серию и MOQ, бронирование фото-зоны и заявки на сессии форума.",
      },
      en: {
        title:
          "Exhibiting at ECOM & RETAIL 2027: showcase, service, sponsorship",
        description:
          "Formats for manufacturers and services, preparing for the contact exchange, series pricing and MOQ, photo zone booking and forum session applications.",
      },
    },
    hero: {
      kicker: {
        ru: "Участникам ECOM & RETAIL",
        en: "ECOM & RETAIL participants",
      },
      title: {
        ru: "Витрина, демо сервиса, спонсорский пакет",
        en: "A showcase, a service demo, a sponsorship package",
      },
      lead: {
        ru: "Форматы под три задачи: продать серию, найти клиентов на сервис, закрепиться как партнёр категории.",
        en: "Formats for three jobs: sell a series, find service clients, become a category partner.",
      },
    },
    before: ["stands"],
    after: ["benefits", "materials", "faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Кто вы", "Формат", "Что делать на стенде"],
          rows: [
            [
              "Производитель",
              "стенд-витрина 12 м²",
              "образцы, прайс на серию, MOQ, срок производства",
            ],
            [
              "Сервис (логистика, IT, финтех)",
              "стенд с экраном",
              "кейсы, тариф, интеграция с маркетплейсами",
            ],
            [
              "Селлер",
              "переговорная зона",
              "портфель ниш, объёмы, условия закупки",
            ],
            [
              "Платформа, бренд",
              "спонсорский пакет",
              "сцена, биржа контактов, фото-зона, каталог",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Подготовьте прайс с ценой за серию и минимальной партией: на этой выставке так и спрашивают.",
            "Если работаете с маркетплейсами — принесите скриншоты карточек и рейтинг: это аргумент.",
            "Фото-зону бронируйте заранее: слоты заканчиваются за неделю до открытия.",
            "Хотите выступить на форуме — пришлите тему и кейс с цифрами, редактор отвечает за два дня.",
          ],
        },
        {
          type: "quiz",
          title: "Подберём участие за 3 шага",
          text: "Три вопроса — и менеджер пришлёт карту раздела, свободные метры и расчёт.",
          event: "ECOM & RETAIL EXPO",
          areas: ["9 м²", "12 м²", "Спонсорский пакет"],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "Заявка на участие в ECOM & RETAIL EXPO",
          text: "Опишите продукт или сервис и цель участия.",
          event: "ECOM & RETAIL EXPO",
          areas: ["9 м²", "12 м²", "Спонсорский пакет"],
        },
      ],
      en: [
        {
          type: "table",
          head: ["Who you are", "Format", "What the stand does"],
          rows: [
            [
              "Manufacturer",
              "12 m² showcase stand",
              "samples, series price, MOQ, production lead time",
            ],
            [
              "Service (logistics, IT, fintech)",
              "stand with a screen",
              "cases, tariffs, marketplace integration",
            ],
            [
              "Seller",
              "negotiation area",
              "niche portfolio, volumes, purchase terms",
            ],
            [
              "Platform, brand",
              "sponsorship package",
              "stage, contact exchange, photo zone, catalogue",
            ],
          ],
        },
        {
          type: "checklist",
          items: [
            "Prepare a price list per series with the minimum batch: that is exactly how buyers ask here.",
            "Working with marketplaces? Bring card screenshots and ratings — it is an argument.",
            "Book the photo zone early: slots close a week before opening.",
            "Want to speak at the forum? Send a topic and a case with numbers; the editor replies in two days.",
          ],
        },
        {
          type: "quiz",
          title: "Plan your participation in three steps",
          text: "Three questions — and the manager sends the section map, free metres and the quote.",
          event: "ECOM & RETAIL EXPO",
          areas: ["9 m²", "12 m²", "Sponsorship package"],
        },
        {
          type: "form",
          formType: "exhibitor",
          title: "ECOM & RETAIL EXPO participation request",
          text: "Describe the product or service and the goal of participation.",
          event: "ECOM & RETAIL EXPO",
          areas: ["9 m²", "12 m²", "Sponsorship package"],
        },
      ],
    },
  },
  visitors: {
    path: "/events/ecom-retail-expo/visitors/",
    image: "/images/event-ecom.jpg",
    meta: {
      ru: {
        title: "Посетителям ECOM & RETAIL 2027: треки и биржа контактов",
        description:
          "Регистрация участника форума: три дорожки программы, встречи с производителями, сессии по маркетплейсам, логистике и финтеху.",
      },
      en: {
        title: "ECOM & RETAIL 2027 visitors: tracks and contact exchange",
        description:
          "Forum registration: three programme tracks, manufacturer meetings and sessions on marketplaces, logistics and fintech.",
      },
    },
    hero: {
      kicker: { ru: "Посетителям форума", en: "Forum visitors" },
      title: {
        ru: "Прийти за поставщиком или за знаниями",
        en: "Come for a supplier or for the know-how",
      },
      lead: {
        ru: "Регистрация участника форума открывает все дорожки программы и к бирже контактов.",
        en: "Forum registration opens the three programme tracks and the contact exchange.",
      },
    },
    before: ["audience"],
    after: ["faq", "venue"],
    blocks: {
      ru: [
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cart",
              title: "Начинающему селлеру",
              text: "Трек «как зайти»: комиссии, карточки, логистика, возвраты, первый товар.",
              image: "/images/supermarket-aisle.jpg",
              imageAlt: "Розничная полка: результат трека «как зайти»",
            },
            {
              icon: "package",
              title: "Производителю",
              text: "Ищете канал — приходите на биржу и на трек про опт под маркетплейсы.",
              image: "/images/hall-stand.jpg",
              imageAlt: "Стенд производителя на E-COM & RETAIL EXPO",
            },
            {
              icon: "phone",
              title: "Банкам и финтеху",
              text: "Сессия о платежах, рассрочках и скоринге для оптовых закупок.",
              image: "/images/conference-audience.jpg",
              imageAlt: "Сессия о платежах для торговли",
            },
          ],
        },
        {
          type: "links",
          items: [
            { label: "Регистрация", href: "/visitors/tickets/" },
            {
              label: "Программа форума",
              href: "/events/ecom-retail-expo/program/",
            },
            { label: "Как добраться", href: "/venue/how-to-get-there/" },
          ],
        },
      ],
      en: [
        {
          type: "grid",
          cols: 3,
          items: [
            {
              icon: "cart",
              title: "New sellers",
              text: 'The "how to enter" track: commissions, cards, logistics, returns, first product.',
              image: "/images/supermarket-aisle.jpg",
              imageAlt: "Retail shelf: the outcome of the how-to-enter track",
            },
            {
              icon: "package",
              title: "Manufacturers",
              text: "Looking for a channel — go to the contact exchange and the wholesale-for-marketplaces track.",
              image: "/images/hall-stand.jpg",
              imageAlt: "Producer stand at E-COM & RETAIL EXPO",
            },
            {
              icon: "phone",
              title: "Banks and fintech",
              text: "A session on payments, instalments and scoring for wholesale purchases.",
              image: "/images/conference-audience.jpg",
              imageAlt: "Payments for retail session",
            },
          ],
        },
        {
          type: "links",
          items: [
            { label: "Registration", href: "/visitors/tickets/" },
            {
              label: "Forum programme",
              href: "/events/ecom-retail-expo/program/",
            },
            { label: "Getting there", href: "/venue/how-to-get-there/" },
          ],
        },
      ],
    },
  },
  program: {
    path: "/events/ecom-retail-expo/program/",
    image: "/images/venue-conference.jpg",
    meta: {
      ru: {
        title: "Программа ECOM & RETAIL EXPO 2027: ритейл и маркетплейсы",
        description:
          "Пленарная сессия ритейла, треки маркетплейсов, логистики, финтеха и контрактного производства, биржа контактов между селлерами и фабриками.",
      },
      en: {
        title: "ECOM & RETAIL EXPO 2027 programme: retail and marketplaces",
        description:
          "Retail plenary, tracks on marketplaces, logistics, fintech and contract manufacturing, plus a seller-factory contact exchange.",
      },
    },
    hero: {
      kicker: { ru: "Форум два дня", en: "A two-day forum" },
      title: {
        ru: "Пленарка, три трека, биржа контактов",
        en: "Plenary, three tracks, contact exchange",
      },
      lead: {
        ru: "Деловая программа ищет практический ответ: как производить, продавать и возить так, чтобы экономика сходилась.",
        en: "The programme answers one practical question: how to produce, sell and deliver so the economics add up.",
      },
    },
    before: ["programme"],
    after: ["speakers", "faq"],
    blocks: {
      ru: [
        {
          type: "table",
          head: ["Трек", "О чём", "Кому"],
          rows: [
            [
              "Пленарная сессия ритейла",
              "полка, цены, сети: ритейл Узбекистана сегодня и завтра",
              "всем",
            ],
            [
              "Маркетплейсы",
              "комиссии, карточки, реклама, возвраты",
              "селлерам, брендам",
            ],
            [
              "Логистика",
              "фулфилмент, последняя миля, склад",
              "селлерам, производителям",
            ],
            [
              "Финтех",
              "эквайринг, рассрочка, платежи для опта",
              "банкам, сервисам",
            ],
            [
              "Производство",
              "контрактное производство под марку продавца",
              "фабрикам, селлерам",
            ],
          ],
        },
        {
          type: "callout",
          tone: "sand",
          title: "Биржа контактов",
          text: "Заявку на встречу оставляют обе стороны: селлер ищет поставщика, поставщик — клиента. Расписание составляется до открытия выставки.",
          image: "/images/conference-audience.jpg",
          imageAlt: "Биржа контактов E-COM & RETAIL EXPO",
        },
      ],
      en: [
        {
          type: "table",
          head: ["Track", "About", "For"],
          rows: [
            [
              "Retail plenary",
              "shelf, prices, chains: Uzbekistan retail today and tomorrow",
              "everyone",
            ],
            [
              "Marketplaces",
              "commissions, product cards, ads, returns",
              "sellers, brands",
            ],
            [
              "Logistics",
              "fulfilment, last mile, warehouse",
              "sellers, manufacturers",
            ],
            [
              "Fintech",
              "acquiring, instalments, wholesale payments",
              "banks, services",
            ],
            [
              "Production",
              "contract manufacturing under a seller brand",
              "factories, sellers",
            ],
          ],
        },
        {
          type: "callout",
          tone: "sand",
          title: "Contact exchange",
          text: "Both sides file a request: a seller looks for supply, a supplier looks for clients. The schedule is built before the doors open.",
          image: "/images/conference-audience.jpg",
          imageAlt: "E-COM & RETAIL EXPO contact exchange",
        },
      ],
    },
  },
};
