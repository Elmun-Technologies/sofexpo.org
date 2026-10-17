/**
 * Search-intent FAQ on each show's overview page (docs/23 §2.2): the questions people actually
 * type — «пищевая выставка», "food expo Uzbekistan", «oziq-ovqat ko‘rgazmasi» — answered with the
 * show's own facts. One block per show: it gives the page an h2 with the primary query, the
 * synonyms in body copy and a FAQPage the answer engines (Google, Bing/ChatGPT, Perplexity) can
 * quote. zh/tr/uz come from the EN text through the catalogs, as everywhere else.
 *
 * Plain text only — every answer is one translation key. Facts must match src/data/events.ts.
 */
type Faq = { title: string; items: { q: string; a: string }[] };

export const searchFaq: Record<string, { ru: Faq; en: Faq }> = {
  'foodera-expo': {
    ru: {
      title: 'Выставка продуктов питания FOODERA EXPO 2026: частые вопросы',
      items: [
        { q: 'Когда и где пройдёт выставка продуктов питания FOODERA EXPO 2026?', a: '27–29 октября 2026 года в выставочном центре SOF EXPO Samarkand, Самарканд, Узбекистан: крытый зал 4 400 м² и открытая площадь 5 000 м². Это пищевая выставка для производителей, дистрибьюторов, розничных сетей и HoReCa.' },
        { q: 'Что показывают на продуктовой выставке FOODERA?', a: '12 разделов: безалкогольные напитки, чай и кофе, бакалея, кондитерские и хлебобулочные изделия, молочная продукция и сыры, мясо и птица, заморозка, консервы, масла и соусы, деликатесы, органические продукты, упаковка и оборудование для пищевой промышленности.' },
        { q: 'Сколько стоит вход на выставку продуктов питания?', a: 'Для специалистов отрасли вход бесплатный по предварительной онлайн-регистрации: электронный билет приходит сразу.' },
        { q: 'Как стать экспонентом пищевой выставки FOODERA EXPO?', a: 'Оставьте заявку на стенд на сайте: менеджер ответит в течение рабочего дня и пришлёт план зала, пакеты участия и чек-лист документов для дегустаций.' },
        { q: 'Чем FOODERA отличается от других выставок продуктов питания в Центральной Азии?', a: 'Кроме экспозиции работает закупочная биржа: заранее назначенные 15-минутные встречи с категорийными менеджерами розничных сетей, слепые дегустации для закупщиков и форум Food Retail о полке, логистике и private label в Узбекистане.' },
      ],
    },
    en: {
      title: 'Food exhibition in Uzbekistan: FOODERA EXPO 2026 questions',
      items: [
        { q: 'When and where is the FOODERA EXPO 2026 food exhibition?', a: '27–29 October 2026 at the SOF EXPO Samarkand exhibition centre in Samarkand, Uzbekistan: a 4,400 m² indoor hall and a 5,000 m² open area. It is a food and beverage trade show for producers, distributors, retail chains and HoReCa.' },
        { q: 'What is on show at the FOODERA food expo?', a: '12 sections: soft drinks, tea and coffee, grocery, confectionery and bakery, dairy and cheese, meat and poultry, frozen food, preserves, oils and sauces, delicacies, organic food, and packaging and equipment for the food industry.' },
        { q: 'Is entry to the food fair free?', a: 'Entry is free for trade professionals who register online in advance; the e-ticket arrives at once.' },
        { q: 'How do I exhibit at the FOODERA EXPO food trade show?', a: 'Send a stand request on the site: the manager replies within one business day with the floor plan, participation packages and the document checklist for tastings.' },
        { q: 'What makes FOODERA different from other food exhibitions in Central Asia?', a: 'Besides the stands there is a buying marketplace: pre-booked 15-minute meetings with retail category managers, blind tastings for buyers and the Food Retail forum on shelves, logistics and private label in Uzbekistan.' },
      ],
    },
  },
  'buildpro-expo': {
    ru: {
      title: 'Строительная выставка BUILD PRO EXPO 2026: частые вопросы',
      items: [
        { q: 'Когда и где пройдёт строительная выставка BUILD PRO EXPO 2026?', a: '9–11 ноября 2026 года в SOF EXPO Samarkand, Самарканд, Узбекистан. Это пятая международная выставка строительных материалов, архитектуры и девелопмента.' },
        { q: 'Какие стройматериалы и оборудование показывают на выставке?', a: 'Строительные материалы, инструмент и крепёж, станки и оборудование, домостроение, недвижимость, ландшафт и озеленение, интерьер и дизайн, свет и электрика, окна, двери и фасады, керамика и камень.' },
        { q: 'Кто посещает выставку строительных материалов?', a: 'Девелоперы, подрядчики, архитекторы, дизайнеры, закупщики и дилеры. В 2025 году выставку посетили более 1 600 человек, в ней участвовали более 80 компаний.' },
        { q: 'Можно ли показать технику и монтаж вживую?', a: 'Да. На открытой площадке 5 000 м² есть подъезд для грузовиков и разгрузка краном, там же проходят живые демонстрации монтажа фасадов, инструмента и покрытий.' },
        { q: 'Как стать участником строительной выставки в Узбекистане?', a: 'Оставьте заявку на стенд на сайте: менеджер ответит в течение рабочего дня и пришлёт план зала и пакеты участия.' },
      ],
    },
    en: {
      title: 'Construction exhibition in Uzbekistan: BUILD PRO EXPO 2026 questions',
      items: [
        { q: 'When and where is the BUILD PRO EXPO 2026 construction exhibition?', a: '9–11 November 2026 at SOF EXPO Samarkand in Samarkand, Uzbekistan. It is the fifth international exhibition of building materials, architecture and development.' },
        { q: 'Which building materials and equipment are on show?', a: 'Building materials, tools and fasteners, machine tools and equipment, house building, real estate, landscape and greening, interior and design, light and electricity, windows, doors and facades, ceramics and stone.' },
        { q: 'Who visits the building materials expo?', a: 'Developers, contractors, architects, designers, buyers and dealers. In 2025 the show had more than 1,600 visitors and more than 80 exhibitors.' },
        { q: 'Can I demonstrate machinery and installation live?', a: 'Yes. The 5,000 m² open area has truck access and crane unloading, and it hosts live demonstrations of facade installation, tools and coatings.' },
        { q: 'How do I exhibit at a construction trade show in Uzbekistan?', a: 'Send a stand request on the site: the manager replies within one business day with the floor plan and participation packages.' },
      ],
    },
  },
  'agropro-expo': {
    ru: {
      title: 'Сельскохозяйственная выставка AGROPRO EXPO 2027: частые вопросы',
      items: [
        { q: 'Когда пройдёт агровыставка AGROPRO EXPO 2027?', a: '2–4 марта 2027 года в SOF EXPO Samarkand, Самарканд, Узбекистан, — до начала полевого сезона, когда хозяйства планируют закупки.' },
        { q: 'Что представлено на выставке сельхозтехники и агротехнологий?', a: 'Агротехнологии, сельскохозяйственная техника, оборудование для орошения, семена и саженцы, агрохимия и лаборатории, теплицы, хранение и логистика, животноводство и птицеводство, стандартизация и сертификация.' },
        { q: 'Кто приезжает на сельскохозяйственную выставку?', a: 'Фермеры и агрохолдинги, агрономы, дилеры техники и поставщики. В 2026 году в выставке участвовали более 100 компаний, её посетили более 4 500 специалистов.' },
        { q: 'Можно ли показать работающую сельхозтехнику?', a: 'Да, на открытой площадке по согласованному протоколу: зона безопасности, ограждение и инструктаж операторов.' },
        { q: 'Как стать экспонентом аграрной выставки?', a: 'Оставьте заявку на стенд на сайте: менеджер ответит в течение рабочего дня и пришлёт план зала, условия открытой площадки и пакеты участия.' },
      ],
    },
    en: {
      title: 'Agriculture exhibition in Uzbekistan: AGROPRO EXPO 2027 questions',
      items: [
        { q: 'When is the AGROPRO EXPO 2027 agriculture exhibition?', a: '2–4 March 2027 at SOF EXPO Samarkand in Samarkand, Uzbekistan, before the field season, when farms plan their purchases.' },
        { q: 'What is on show at the agricultural machinery and agritech expo?', a: 'Agrotechnology, agricultural machinery, irrigation equipment, seeds and seedlings, agrochemistry and labs, greenhouses, storage and logistics, livestock and poultry, standardization and certification.' },
        { q: 'Who comes to the agricultural exhibition?', a: 'Farmers and agro-holdings, agronomists, machinery dealers and suppliers. In 2026 more than 100 companies exhibited and more than 4,500 specialists attended.' },
        { q: 'Can we demonstrate running farm machinery?', a: 'Yes, on the open area under an agreed protocol: a safety zone, barriers and an operator briefing.' },
        { q: 'How do I exhibit at the agro expo?', a: 'Send a stand request on the site: the manager replies within one business day with the floor plan, the open-area terms and participation packages.' },
      ],
    },
  },
  'world-edu-expo': {
    ru: {
      title: 'Выставка образования WORLD EDU EXPO 2027: частые вопросы',
      items: [
        { q: 'Когда пройдёт выставка образования WORLD EDU EXPO 2027?', a: '9–10 апреля 2027 года в SOF EXPO Samarkand, Самарканд, Узбекистан.' },
        { q: 'Какие вузы будут на выставке обучения за рубежом?', a: 'Университеты Узбекистана, России, Беларуси, Казахстана, Европы, Юго-Восточной Азии и Турции, филиалы зарубежных вузов, частные вузы и колледжи, языковые центры и консультанты по обучению за рубежом.' },
        { q: 'Нужен ли билет на образовательную выставку?', a: 'Вход бесплатный по онлайн-регистрации; регистрация также даёт участие в розыгрыше призов.' },
        { q: 'Можно ли узнать о стипендиях и грантах?', a: 'Да, на выставке есть раздел стипендий и грантов, а также консультации по подготовке к IELTS, GMAT и SAT.' },
        { q: 'Можно ли прийти на выставку вузов школьным классом?', a: 'Да: организованные группы проходят через отдельный вход, получают экскурсию по выставке и профориентационное тестирование.' },
      ],
    },
    en: {
      title: 'Education fair in Uzbekistan: WORLD EDU EXPO 2027 questions',
      items: [
        { q: 'When is the WORLD EDU EXPO 2027 education fair?', a: '9–10 April 2027 at SOF EXPO Samarkand in Samarkand, Uzbekistan.' },
        { q: 'Which universities come to the study abroad fair?', a: 'Universities from Uzbekistan, Russia, Belarus, Kazakhstan, Europe, South-East Asia and Turkey, branches of foreign universities, private universities and colleges, language centres and study-abroad consultants.' },
        { q: 'Do I need a ticket for the education exhibition?', a: 'Entry is free with online registration, which also enters you into the prize draw.' },
        { q: 'Can I find out about scholarships and grants?', a: 'Yes, the fair has a scholarships and grants section and consultations on IELTS, GMAT and SAT preparation.' },
        { q: 'Can a school bring a class to the university fair?', a: 'Yes: organized groups get a separate entrance, a guided tour and aptitude testing.' },
      ],
    },
  },
  'ecom-retail-expo': {
    ru: {
      title: 'Выставка e-commerce и ритейла ECOM & RETAIL EXPO 2027: частые вопросы',
      items: [
        { q: 'Когда пройдёт выставка электронной коммерции ECOM & RETAIL EXPO 2027?', a: '16–17 июня 2027 года в SOF EXPO Samarkand, Самарканд, Узбекистан. Соорганизатор — Ассоциация продавцов Узбекистана.' },
        { q: 'Кому полезна выставка e-commerce?', a: 'Производителям, продавцам маркетплейсов, владельцам брендов, закупщикам и e-commerce стартапам. Вход для посетителей бесплатный после регистрации.' },
        { q: 'Какие темы на выставке ритейла и маркетплейсов?', a: 'White label и контрактное производство, маркетплейсы, финтех и эквайринг, логистика и фулфилмент, digital-маркетинг, IT для ритейла, упаковка и фотопродакшн, платежи и рассрочка.' },
        { q: 'Что такое White Label Edition?', a: 'Формат, в котором производители ищут продавцов для выпуска товаров под их брендом, а селлеры маркетплейсов находят фабрику для собственной торговой марки без вложений в производство.' },
        { q: 'Как стать экспонентом выставки электронной коммерции?', a: 'Оставьте заявку на стенд на сайте: менеджер ответит в течение рабочего дня и пришлёт план зала и пакеты участия.' },
      ],
    },
    en: {
      title: 'E-commerce expo in Uzbekistan: ECOM & RETAIL EXPO 2027 questions',
      items: [
        { q: 'When is the ECOM & RETAIL EXPO 2027 e-commerce exhibition?', a: '16–17 June 2027 at SOF EXPO Samarkand in Samarkand, Uzbekistan, co-organized with the Uzbekistan Sellers Association.' },
        { q: 'Who is the e-commerce expo for?', a: 'Manufacturers, marketplace sellers, brand owners, buyers and e-commerce startups. Visitor entry is free after registration.' },
        { q: 'Which topics does the retail and marketplace expo cover?', a: 'White label and contract manufacturing, marketplaces, fintech and acquiring, logistics and fulfilment, digital marketing, IT for retail, packaging and photo production, payments and instalments.' },
        { q: 'What is the White Label Edition?', a: 'A format where manufacturers find sellers to launch goods under the sellers’ brands, and marketplace sellers find a factory for their own label without investing in production.' },
        { q: 'How do I exhibit at the e-commerce exhibition?', a: 'Send a stand request on the site: the manager replies within one business day with the floor plan and participation packages.' },
      ],
    },
  },
  'promotors-show-samarkand': {
    ru: {
      title: 'Автошоу PROMOTORS SHOW SAMARKAND: частые вопросы',
      items: [
        { q: 'Когда прошло автошоу PROMOTORS SHOW SAMARKAND 2026?', a: '12–13 сентября 2026 года в SOF EXPO Samarkand, Самарканд, Узбекистан. Даты следующего автофестиваля организаторы объявят отдельно.' },
        { q: 'Что было на автошоу в Самарканде?', a: 'Дрифт-шоу, соревнования по SPL-автозвуку, тюнинг и детейлинг, ретро-автомобили, гонки безмоторных машин, а также автовыставка запчастей, сервисного оборудования, автохимии и оборудования для автомоек.' },
        { q: 'Сколько стоит участие в дрифт-шоу?', a: 'Для владельца проекта участие бесплатное после одобрения организаторами; партнёры проекта получают скидку 50%.' },
        { q: 'Как бренду участвовать в автовыставке?', a: 'Доступны стенды в зале, уличная пит-зона от 36 м² и спонсорские пакеты; любые логотипы спонсоров на автомобилях согласуются с организаторами.' },
        { q: 'Каким был призовой фонд автофестиваля?', a: 'В гонках безмоторных машин призовой фонд составил 10, 6 и 4 млн сумов за первые три места.' },
      ],
    },
    en: {
      title: 'Car show in Samarkand: PROMOTORS SHOW SAMARKAND questions',
      items: [
        { q: 'When was the PROMOTORS SHOW SAMARKAND 2026 car show?', a: '12–13 September 2026 at SOF EXPO Samarkand in Samarkand, Uzbekistan. The organizers will announce the dates of the next auto festival separately.' },
        { q: 'What happened at the car show in Samarkand?', a: 'A drift show, SPL car audio contests, tuning and detailing, retro cars, non-motorized racing and an auto expo of parts, service equipment, car chemicals and car wash equipment.' },
        { q: 'Does it cost anything to enter the drift show?', a: 'Free for the project owner once approved by the organizers; project partners get a 50% discount.' },
        { q: 'How can a brand take part in the auto show?', a: 'Hall stands, an outdoor pit zone from 36 m² and sponsorship packages are available; any sponsor logos on cars are approved by the organizers.' },
        { q: 'What was the prize fund of the auto festival?', a: 'In non-motorized racing the prize fund was 10, 6 and 4 million UZS for the top three places.' },
      ],
    },
  },
};
