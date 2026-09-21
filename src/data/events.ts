/**
 * Exhibition portfolio of SOF EXPO Samarkand.
 *
 * Every object here drives a whole cluster of pages (overview, exhibitors, visitors,
 * program, floor plan, contacts) — this is why the copy is written per-event, not templated.
 * Sources: official SOF EXPO materials (sofexpo.uz), exhibition catalogues 2023–2026.
 */

export type L = { ru: string; en: string };

export interface ExpoEvent {
  slug: string;
  brand: L;
  shortName: string;
  industry: string;
  dates: { start: string; end: string; display: L };
  edition: L;
  status: 'open' | 'registration' | 'past';
  heroImage: string;
  tagline: L;
  intro: L;
  pitch: L;
  categories: { name: L; icon: string }[];
  benefits: { title: L; text: L }[];
  program: { title: L; text: L; /** 1-based show day, for the by-day programme */ day?: number }[];
  audience: { label: L; value: string }[];
  facts: { value: string; label: L }[];
  stands: { name: L; area: string; note: L }[];
  speakers: { name: string; role: L; org: string }[];
  materials: { title: L; type: 'pdf' | 'catalog' | 'video' | 'photo'; href: string }[];
  faq: { q: L; a: L }[];
  socials: { instagram?: string; telegram?: string };
  /**
   * The one line we are allowed to shout about on the hero and in the site-wide
   * announcement bar. Only facts published by the organizer — no invented prices,
   * discounts or deadlines. `null` for finished editions.
   */
  highlight: { label: L; text: L } | null;
  searchTerms: L[];
}

export const events: ExpoEvent[] = [
  {
    slug: 'foodera-expo',
    brand: { ru: 'FOODERA EXPO 2026', en: 'FOODERA EXPO 2026' },
    shortName: 'FOODERA',
    industry: 'food',
    dates: {
      start: '2026-10-20',
      end: '2026-10-22',
      display: { ru: '20–22 октября 2026', en: '20–22 October 2026' },
    },
    edition: { ru: 'Специализированная выставка продуктов и напитков в Узбекистане', en: 'The food and beverage exhibition for Uzbekistan and Central Asia' },
    status: 'open',
    heroImage: '/images/event-foodera.jpg',
    tagline: {
      ru: 'Место встречи производителей, дистрибьюторов и покупателей пищевой отрасли Центральной Азии.',
      en: 'Where producers, distributors and buyers of the Central Asian food industry meet.',
    },
    intro: {
      ru: 'FOODERA EXPO объединяет производителей, дистрибьюторов, импортёров и поставщиков с закупщиками розницы, опта, HoReCa и кейтеринга. Три дня переговоров, дегустаций и презентаций на площадке SOF EXPO Samarkand.',
      en: 'FOODERA EXPO brings manufacturers, distributors, importers and suppliers together with retail, wholesale, HoReCa and catering buyers. Three days of negotiations, tastings and presentations at SOF EXPO Samarkand.',
    },
    pitch: {
      ru: 'Регион Центральной Азии и Афганистана — рынок от 58 до 78 млрд долларов и более 125 млн потребителей. Розница Узбекистана в 2024 году достигла 182 трлн сумов. FOODERA — точка входа в этот рынок с готовой аудиторией закупщиков.',
      en: 'Central Asia and Afghanistan is a market of $58–78 billion and 125 million+ consumers. Uzbekistan retail reached 182 billion UZS in 2024. FOODERA is the entry point with a pre-built audience of buyers.',
    },
    categories: [
      { name: { ru: 'Безалкогольные напитки', en: 'Soft drinks' }, icon: 'drink' },
      { name: { ru: 'Чай и кофе', en: 'Tea and coffee' }, icon: 'coffee' },
      { name: { ru: 'Бакалея', en: 'Grocery' }, icon: 'grocery' },
      { name: { ru: 'Кондитерские и хлебобулочные изделия', en: 'Confectionery and bakery' }, icon: 'bread' },
      { name: { ru: 'Молочная продукция и сыры', en: 'Dairy and cheese' }, icon: 'dairy' },
      { name: { ru: 'Мясо, птица и яйца', en: 'Meat, poultry and eggs' }, icon: 'meat' },
      { name: { ru: 'Замороженная продукция и полуфабрикаты', en: 'Frozen and semi-finished' }, icon: 'frozen' },
      { name: { ru: 'Консервация', en: 'Preserves and canned food' }, icon: 'jar' },
      { name: { ru: 'Масложировая продукция и соусы', en: 'Oils, fats and sauces' }, icon: 'oil' },
      { name: { ru: 'Гастрономические деликатесы', en: 'Gastronomic delicacies' }, icon: 'deli' },
      { name: { ru: 'Органическая продукция и здоровое питание', en: 'Organic and healthy food' }, icon: 'leaf' },
      { name: { ru: 'Упаковка и оборудование', en: 'Packaging and equipment' }, icon: 'package' },
    ],
    benefits: [
      { title: { ru: 'Региональные партнёры', en: 'Regional partners' }, text: { ru: 'Контакты с поставщиками из стран Центральной Азии и регионов Узбекистана.', en: 'Direct contact with suppliers from Central Asia and the regions of Uzbekistan.' } },
      { title: { ru: 'Презентация новинок', en: 'New product launch' }, text: { ru: 'Покажите новый SKU всей профессиональной аудитории отрасли за три дня.', en: 'Show a new SKU to the whole professional audience in three days.' } },
      { title: { ru: 'Новые рынки', en: 'New markets' }, text: { ru: 'Укрепите позицию бренда в регионе и протестируйте спрос без долгосрочных вложений.', en: 'Strengthen the brand in the region and test demand without long-term investment.' } },
      { title: { ru: 'Деловые связи', en: 'Business connections' }, text: { ru: 'Переговоры с закупщиками сетей, опта и HoReCa, договоры на площадке.', en: 'Negotiations with chain, wholesale and HoReCa buyers, contracts signed on site.' } },
    ],
    program: [
      { title: { ru: 'Дегустационная зона', en: 'Tasting area' }, text: { ru: 'Слепые дегустации для закупщиков сетей и голосование за лучший продукт выставки.', en: 'Blind tastings for retail buyers and voting for the best product of the show.' } , day: 1},
      { title: { ru: 'Закупочная биржа', en: 'Buying marketplace' }, text: { ru: 'Pre-matched 15-minute meetings с категорийными менеджерами розничных сетей.', en: 'Pre-matched 15-minute meetings with category managers of retail chains.' } , day: 2},
      { title: { ru: 'Форум Food Retail', en: 'Food Retail forum' }, text: { ru: 'Полки, логистика, ценообразование и private label в Узбекистане.', en: 'Shelves, logistics, pricing and private label in Uzbekistan.' } , day: 2},
      { title: { ru: 'Конкурс «Лучший продукт»', en: 'Best Product contest' }, text: { ru: 'Экспертное жюри и награждение участников в первый день выставки.', en: 'Expert jury and awards for exhibitors on the opening day.' } , day: 1},
    ],
    audience: [
      { label: { ru: 'Товароведческие сети', en: 'Retail chains' }, value: 'buyer' },
      { label: { ru: 'Оптовые базы и дистрибьюторы', en: 'Wholesale and distributors' }, value: 'distribution' },
      { label: { ru: 'HoReCa и кейтеринг', en: 'HoReCa and catering' }, value: 'horeca' },
      { label: { ru: 'Импортёры и байеры', en: 'Importers and buyers' }, value: 'import' },
    ],
    facts: [
      { value: '125 млн+', label: { ru: 'потребителей региона', en: 'consumers in the region' } },
      { value: '$58–78 млрд', label: { ru: 'объём рынка региона', en: 'regional market size' } },
      { value: '6', label: { ru: 'стран прямого доступа', en: 'countries within direct reach' } },
      { value: '3', label: { ru: 'дня работы выставки', en: 'days of trading' } },
    ],
    stands: [
      { name: { ru: 'Стандартный стенд', en: 'Standard stand' }, area: '9 м²', note: { ru: 'Готовая застройка, брендирование и мебель включены.', en: 'Shell scheme, branding and furniture included.' } },
      { name: { ru: 'Премиум-стенд', en: 'Premium stand' }, area: '18 м²', note: { ru: 'Улучшенная локация и увеличенная рекламная поверхность.', en: 'Better location and larger advertising surface.' } },
      { name: { ru: 'Свободная площадь', en: 'Raw space' }, area: '36 м²+', note: { ru: 'Индивидуальная застройка по вашему брендбуку.', en: 'Custom build following your brand book.' } },
    ],
    speakers: [],
    materials: [
      { title: { ru: 'Презентация FOODERA EXPO 2026', en: 'FOODERA EXPO 2026 presentation' }, type: 'pdf', href: '/files/foodera-2026-presentation.pdf' },
      { title: { ru: 'Каталог участников', en: 'Exhibitor catalogue' }, type: 'catalog', href: '/files/foodera-catalogue.pdf' },
    ],
    faq: [
      { q: { ru: 'Подходит ли выставка региональным брендам?', en: 'Is it suitable for regional brands?' }, a: { ru: 'Да. Значительная часть аудитории — оптовики и сети, которые ищут локальных поставщиков и private label производителей.', en: 'Yes. A large share of the audience are wholesalers and chains looking for local suppliers and private label producers.' } },
      { q: { ru: 'Можно ли привезти оборудование для демонстрации?', en: 'Can I bring equipment for a live demo?' }, a: { ru: 'Да, при согласовании с технологами центра: мощность 700 кВт, 220/380 В, выделенное питание оформляется заявкой.', en: 'Yes, subject to approval by the venue engineers: 700 kW capacity, 220/380 V, dedicated supply arranged by request.' } },
      { q: { ru: 'Нужна ли сертификация продукции?', en: 'Do my products need certification?' }, a: { ru: 'Для дегустаций требуется комплект документов на продукцию. Менеджер вышлет чек-лист при подаче заявки.', en: 'Tastings require a product document pack. The account manager sends a checklist with your application.' } },
    ],
    socials: { telegram: 'https://t.me/sofexpo', instagram: 'https://www.instagram.com/sofexpo.uz/' },
    highlight: {
      label: { ru: 'Бронирование открыто', en: 'Booking open' },
      text: {
        ru: 'Осталось 38 премиум-стендов, 12 тематических разделов. Место фиксируется договором.',
        en: '38 premium stands left across 12 thematic sections. Location is fixed by contract.',
      },
    },
    searchTerms: [
      { ru: 'выставка продуктов Узбекистан', en: 'food exhibition Uzbekistan' },
      { ru: 'выставка продуктов питания Самарканд', en: 'food expo Samarkand' },
      { ru: 'Foodera Expo', en: 'Foodera Expo' },
    ],
  },
  {
    slug: 'buildpro-expo',
    brand: { ru: 'BUILDPRO EXPO 2026', en: 'BUILDPRO EXPO 2026' },
    shortName: 'BUILDPRO',
    industry: 'construction',
    dates: { start: '2026-11-09', end: '2026-11-11', display: { ru: '9–11 ноября 2026', en: '9–11 November 2026' } },
    edition: { ru: 'Пятая международная строительная выставка', en: 'The fifth international construction exhibition' },
    status: 'open',
    heroImage: '/images/event-buildpro.jpg',
    tagline: {
      ru: 'Материалы, оборудование и технологии для строительства, архитектуры и девелопмента.',
      en: 'Materials, equipment and technologies for construction, architecture and development.',
    },
    intro: {
      ru: 'BUILDPRO EXPO собирает производителей материалов и оборудования, поставщиков технологий, архитекторов, дизайнеров, девелоперов и строительные компании. Три дня переговоров, презентаций и живых демонстраций.',
      en: 'BUILDPRO EXPO gathers material and equipment manufacturers, technology suppliers, architects, designers, developers and construction companies. Three days of negotiations, presentations and live demonstrations.',
    },
    pitch: {
      ru: 'Это не только выставка, а инструмент роста продаж: прямой контакт с теми, кто выбирает материалы, проектирует объекты и принимает решения о закупке. География участников — Узбекистан, Россия, Турция, Китай.',
      en: 'Not just an exhibition but a sales growth tool: direct contact with the people who select materials, design projects and take purchase decisions. Participants come from Uzbekistan, Russia, Türkiye and China.',
    },
    categories: [
      { name: { ru: 'Строительные материалы', en: 'Building materials' }, icon: 'brick' },
      { name: { ru: 'Инструменты и крепёж', en: 'Tools and fasteners' }, icon: 'tool' },
      { name: { ru: 'Станки и оборудование', en: 'Machine tools and equipment' }, icon: 'machine' },
      { name: { ru: 'Домостроение', en: 'House building' }, icon: 'house' },
      { name: { ru: 'Недвижимость', en: 'Real estate' }, icon: 'estate' },
      { name: { ru: 'Ландшафт и озеленение', en: 'Landscape and greening' }, icon: 'tree' },
      { name: { ru: 'Интерьер и дизайн', en: 'Interior and design' }, icon: 'interior' },
      { name: { ru: 'Свет и электрика', en: 'Light and electricity' }, icon: 'light' },
      { name: { ru: 'Окна, двери, фасады', en: 'Windows, doors, facades' }, icon: 'window' },
      { name: { ru: 'Керамика и отделочный камень', en: 'Ceramics and stone' }, icon: 'ceramic' },
    ],
    benefits: [
      { title: { ru: 'Новые клиенты', en: 'New clients' }, text: { ru: 'Прямой контакт с руководителями, закупщиками, подрядчиками, архитекторами.', en: 'Direct contact with decision makers, buyers, contractors, architects.' } },
      { title: { ru: 'Выход на рынок', en: 'Market entry' }, text: { ru: 'Проверьте спрос и представьте продукт аудитории со всего Узбекистана.', en: 'Test demand and present your product to an audience from all over Uzbekistan.' } },
      { title: { ru: 'Дистрибьюторы', en: 'Distributors' }, text: { ru: 'Найдите локальных партнёров для развития дилерской сети.', en: 'Find local partners to build a dealer network.' } },
      { title: { ru: 'Анализ конкурентов', en: 'Competitive intelligence' }, text: { ru: 'Оцените предложения рынка, позиционирование и новые тренды отрасли.', en: 'Assess market offers, positioning and emerging industry trends.' } },
    ],
    program: [
      { title: { ru: 'Форум архитекторов и дизайнеров', en: 'Architects and designers forum' }, text: { ru: '10+ сессий о материалах, световых решениях и частном домостроении.', en: '10+ sessions on materials, lighting design and private housing.' } , day: 1},
      { title: { ru: 'Демонстрации технологий', en: 'Live technology demos' }, text: { ru: 'Живые показы на площади: монтаж фасадов, работа инструмента, образцы покрытий.', en: 'Live demonstrations on the open area: facade installation, tool handling, coating samples.' } , day: 2},
      { title: { ru: 'Биржа контактов', en: 'Business matchmaking' }, text: { ru: 'Встречи производителей с девелоперами и закупщиками сетей.', en: 'Meetings between manufacturers, developers and chain buyers.' } , day: 3},
    ],
    audience: [
      { label: { ru: 'Девелоперы', en: 'Developers' }, value: 'dev' },
      { label: { ru: 'Строительные компании', en: 'Contractors' }, value: 'construction' },
      { label: { ru: 'Архитекторы и проектировщики', en: 'Architects and designers' }, value: 'design' },
      { label: { ru: 'Дистрибьюторы и розничные сети', en: 'Distributors and retail chains' }, value: 'retail' },
    ],
    facts: [
      { value: '1 600+', label: { ru: 'посетителей в 2025', en: 'visitors in 2025' } },
      { value: '80+', label: { ru: 'компаний-экспонентов', en: 'exhibiting companies' } },
      { value: '10+', label: { ru: 'форумов и сессий', en: 'forums and sessions' } },
      { value: '5-е', label: { ru: 'проведение выставки', en: 'edition of the show' } },
    ],
    stands: [
      { name: { ru: 'Готовый стенд Octanorm', en: 'Ready-made Octanorm stand' }, area: 'за м²', note: { ru: 'Стандартная застройка с расчётом стоимости за квадратный метр.', en: 'Shell scheme priced per square metre.' } },
      { name: { ru: 'Индивидуальная застройка', en: 'Custom build' }, area: 'по проекту', note: { ru: 'Стенд по дизайну и брендбуку вашей компании.', en: 'A stand built to your design and brand book.' } },
      { name: { ru: 'Рекламные поверхности', en: 'Advertising surfaces' }, area: 'в зале', note: { ru: 'Баннеры и медиа-поверхности внутри выставочного зала.', en: 'Banners and media surfaces inside the exhibition hall.' } },
    ],
    speakers: [],
    materials: [
      { title: { ru: 'Спонсорское предложение', en: 'Sponsorship proposal' }, type: 'pdf', href: '/files/build-sponsor.pdf' },
      { title: { ru: 'Каталог BUILD PRO EXPO 2025', en: 'BUILD PRO EXPO 2025 catalogue' }, type: 'catalog', href: '/files/build-2025-catalog.pdf' },
      { title: { ru: 'Каталог BUILD PRO EXPO 2024', en: 'BUILD PRO EXPO 2024 catalogue' }, type: 'catalog', href: '/files/build-2024-catalog.pdf' },
      { title: { ru: 'Каталог BUILD PRO EXPO 2023', en: 'BUILD PRO EXPO 2023 catalogue' }, type: 'catalog', href: '/files/build-2023-catalog.pdf' },
    ],
    faq: [
      { q: { ru: 'Можно ли привезти крупногабаритную технику?', en: 'Can I bring heavy machinery?' }, a: { ru: 'Да, для этого есть открытая площадка 5 000 м² с подъездом фур и возможностью крановой разгрузки.', en: 'Yes — the 5,000 m² open area has truck access and crane unloading.' } },
      { q: { ru: 'Помогаете ли с переводом и персоналом?', en: 'Do you help with interpreting and staff?' }, a: { ru: 'Да: синхронный перевод, хостес, промоперсонал и технический режиссёр заказываются в сервисной заявке.', en: 'Yes: interpreting, hostesses, promo staff and a technical director can be added to your service order.' } },
    ],
    socials: { telegram: 'https://t.me/BuildProExpo', instagram: 'https://www.instagram.com/buildproexpo/' },
    highlight: {
      label: { ru: '5-я выставка отрасли', en: '5th edition of the industry' },
      text: {
        ru: 'BUILD PRO 2025: 1 600+ посетителей, 80+ экспонентов, 10+ сессий форума. Разделы — 10 тем.',
        en: 'BUILD PRO 2025: 1,600+ visitors, 80+ exhibitors, 10+ forum sessions across 10 topics.',
      },
    },
    searchTerms: [
      { ru: 'строительная выставка Узбекистан', en: 'construction exhibition Uzbekistan' },
      { ru: 'Build Pro Expo Samarkand', en: 'Build Pro Expo Samarkand' },
    ],
  },
  {
    slug: 'agropro-expo',
    brand: { ru: 'AGROPRO EXPO 2027', en: 'AGROPRO EXPO 2027' },
    shortName: 'AGROPRO',
    industry: 'agriculture',
    dates: { start: '2027-03-02', end: '2027-03-04', display: { ru: '2–4 марта 2027', en: '2–4 March 2027' } },
    edition: { ru: 'Международная агровыставка в Узбекистане', en: 'The international agricultural exhibition in Uzbekistan' },
    status: 'registration',
    heroImage: '/images/event-agropro.jpg',
    tagline: {
      ru: 'Площадка для отечественных и зарубежных производителей в сфере агрономии.',
      en: 'A platform for local and international producers in agronomy.',
    },
    intro: {
      ru: 'AGROPRO EXPO показывает технику и оборудование, технологии, запчасти, оросительные системы (капельные, дождевальные, барабанные), автоматизацию хозяйства и решения для хранения и логистики урожая.',
      en: 'AGROPRO EXPO presents machinery and equipment, technologies, spare parts, irrigation systems (drip, pivot, drum), farm automation and storage and logistics solutions.',
    },
    pitch: {
      ru: 'Аграрный сектор Узбекистана производит продукцию на 25+ млрд долларов, в стране работают более 85 тысяч фермерских хозяйств и 468 агрокластеров. Государство субсидирует технику и орошение — выставка стала каналом, через который поставщики попадают в эти программы.',
      en: 'Uzbekistan agriculture produces over $25 billion of output, with 85,000+ farms and 468 agro-clusters. The state subsidises machinery and irrigation — the exhibition is the channel through which suppliers reach those programmes.',
    },
    categories: [
      { name: { ru: 'Агротехнологии', en: 'Agrotechnology' }, icon: 'tech' },
      { name: { ru: 'Сельхозтехника', en: 'Agricultural machinery' }, icon: 'tractor' },
      { name: { ru: 'Оборудование для орошения', en: 'Irrigation equipment' }, icon: 'irrigation' },
      { name: { ru: 'Семена и рассада', en: 'Seeds and seedlings' }, icon: 'seed' },
      { name: { ru: 'Агрохимия и лаборатории', en: 'Agrochemistry and labs' }, icon: 'lab' },
      { name: { ru: 'Теплицы и парники', en: 'Greenhouses' }, icon: 'greenhouse' },
      { name: { ru: 'Хранение и логистика', en: 'Storage and logistics' }, icon: 'storage' },
      { name: { ru: 'Животноводство и птицеводство', en: 'Livestock and poultry' }, icon: 'cow' },
      { name: { ru: 'Стандартизация и сертификация', en: 'Standardization and certification' }, icon: 'cert' },
    ],
    benefits: [
      { title: { ru: 'Прямой контакт с хозяйствами', en: 'Direct access to farms' }, text: { ru: 'Фермеры, кластеры, агрономы и животноводы — люди, которые покупают технику.', en: 'Farmers, clusters, agronomists and livestock breeders — the people who buy equipment.' } },
      { title: { ru: 'Государственные программы', en: 'Public programmes' }, text: { ru: 'Обсуждение субсидий, лизинга и льготных кредитных линий на площадке.', en: 'Subsidies, leasing and preferential credit lines discussed on site.' } },
      { title: { ru: 'Экспортный потенциал', en: 'Export potential' }, text: { ru: 'Партнёры из Казахстана, Таджикистана, Кыргызстана и Туркменистана.', en: 'Partners from Kazakhstan, Tajikistan, Kyrgyzstan and Turkmenistan.' } },
      { title: { ru: 'Сезон под рукой', en: 'Right before the season' }, text: { ru: 'Март — момент закупки техники и семян перед полевым сезоном.', en: 'March is the buying moment for machinery and seeds before the field season.' } },
    ],
    program: [
      { title: { ru: 'Практикум по капельному орошению', en: 'Drip irrigation practicum' }, text: { ru: 'Проектирование, монтаж и расчёт окупаемости системы.', en: 'Design, installation and payback calculation of a system.' } , day: 1},
      { title: { ru: 'Семинар агрохимии', en: 'Agrochemistry seminar' }, text: { ru: 'Нормы внесения, лаборатории и сертификация препаратов.', en: 'Application rates, laboratories and product certification.' } , day: 2},
      { title: { ru: 'Ярмарка вакансий АПК', en: 'Agri careers fair' }, text: { ru: 'Колледжи и хозяйства о подготовке механизаторов и агрономов.', en: 'Colleges and farms on training mechanics and agronomists.' } , day: 3},
    ],
    audience: [
      { label: { ru: 'Фермерские хозяйства', en: 'Farm holdings' }, value: 'farms' },
      { label: { ru: 'Агрокластеры', en: 'Agro-clusters' }, value: 'clusters' },
      { label: { ru: 'Поставщики техники', en: 'Machinery suppliers' }, value: 'machinery' },
      { label: { ru: 'Банки и лизинг', en: 'Banks and leasing' }, value: 'finance' },
    ],
    facts: [
      { value: '100+', label: { ru: 'компаний на первой выставке', en: 'companies at the first edition' } },
      { value: '4 500+', label: { ru: 'специалистов посетили выставку', en: 'specialists visited' } },
      { value: '25 млрд $', label: { ru: 'объём сельского хозяйства РУз', en: 'Uzbekistan agri output' } },
      { value: '468', label: { ru: 'агрокластеров в стране', en: 'agro-clusters in the country' } },
    ],
    stands: [
      { name: { ru: 'Стенд в зале', en: 'Indoor stand' }, area: '9–36 м²', note: { ru: 'Материалы, семена, техника малых форм, оборудование.', en: 'Materials, seeds, compact machinery, equipment.' } },
      { name: { ru: 'Экспозиция на улице', en: 'Outdoor stand' }, area: 'от 100 м²', note: { ru: 'Тракторы, комбайны, дождевальные машины, теплицы.', en: 'Tractors, harvesters, pivot machines, greenhouses.' } },
      { name: { ru: 'Демо-заезд техники', en: 'Live machinery demo' }, area: 'по регламенту', note: { ru: 'Показ работы машины на подготовленной площадке.', en: 'Machine demonstration on a prepared area.' } },
    ],
    speakers: [],
    materials: [
      { title: { ru: 'Спонсорское предложение', en: 'Sponsorship proposal' }, type: 'pdf', href: '/files/agro-sponsor.pdf' },
      { title: { ru: 'Каталог AGROPRO 2026', en: 'AGROPRO 2026 catalogue' }, type: 'catalog', href: '/files/catalog-agro-2026.pdf' },
      { title: { ru: 'Каталог AGROPRO 2025', en: 'AGROPRO 2025 catalogue' }, type: 'catalog', href: '/files/catalog-agro-2025.pdf' },
      { title: { ru: 'Каталог AGROPRO 2024', en: 'AGROPRO 2024 catalogue' }, type: 'catalog', href: '/files/catalog-agro-2024.pdf' },
      { title: { ru: 'Каталог AGROPRO 2023', en: 'AGROPRO 2023 catalogue' }, type: 'catalog', href: '/files/catalog-agro-2023.pdf' },
    ],
    faq: [
      { q: { ru: 'Есть ли субсидии на участие?', en: 'Is participation subsidised?' }, a: { ru: 'Для ряда отраслевых компаний доступны программы компенсации затрат на участие — уточните у менеджера до подачи заявки.', en: 'Several industry companies qualify for participation cost compensation — check with your account manager before applying.' } },
      { q: { ru: 'Можно ли показывать технику в работе?', en: 'Can we demonstrate running machinery?' }, a: { ru: 'Да, на открытой площадке по согласованному регламенту: безопасная зона, ограждение, инструктаж оператора.', en: 'Yes, on the open area under an agreed protocol: safety zone, barriers, operator briefing.' } },
    ],
    socials: { telegram: 'https://t.me/agroproexpo', instagram: 'https://www.instagram.com/agroproexpo/' },
    highlight: {
      label: { ru: 'Приём заявок открыт', en: 'Applications open' },
      text: {
        ru: 'AGROPRO 2026: 100+ компаний и 4 500+ специалистов. Техника — в зале и на улице, подъезд фур.',
        en: 'AGROPRO 2026: 100+ companies and 4,500+ specialists. Machinery indoors and outdoors, truck access.',
      },
    },
    searchTerms: [
      { ru: 'агро выставка Узбекистан 2027', en: 'agriculture exhibition Uzbekistan 2027' },
      { ru: ' Agropro Expo Samarkand', en: 'Agropro Expo Samarkand' },
    ],
  },
  {
    slug: 'promotors-show-samarkand',
    brand: { ru: 'PROMOTORS SHOW SAMARKAND', en: 'PROMOTORS SHOW SAMARKAND' },
    shortName: 'PROMOTORS',
    industry: 'automotive',
    dates: { start: '2026-09-12', end: '2026-09-13', display: { ru: '12–13 сентября 2026', en: '12–13 September 2026' } },
    edition: { ru: 'Выставка-фестиваль автоиндустрии', en: 'Automotive exhibition and festival' },
    status: 'past',
    heroImage: '/images/event-promotors.jpg',
    tagline: {
      ru: 'Дрифт, автозвук, тюнинг, детейлинг — и всё, что интересно профессионалам и любителям.',
      en: 'Drift, car audio, tuning, detailing — everything that interests both pros and enthusiasts.',
    },
    intro: {
      ru: 'Местные и международные производители показывают автомобили, автозапчасти и оборудование для сервисов и автомоек. В программе — выступления по дрифту, тюнингу и автозвуку, соревнования и шоу для зрителей.',
      en: 'Local and international manufacturers present cars, spare parts and equipment for service centres and car washes. The line-up includes drifting, tuning and car audio shows, competitions and spectator entertainment.',
    },
    pitch: {
      ru: 'Формат, в котором B2B и B2C работают одновременно: производители и дистрибьюторы заключают контракты, а зрителей собирают шоу и призовой фонд 20 млн сумов.',
      en: 'A format where B2B and B2C run together: manufacturers and distributors sign contracts while shows and a 20 million UZS prize fund pull in the crowd.',
    },
    categories: [
      { name: { ru: 'Дрифт-шоу', en: 'Drift show' }, icon: 'drift' },
      { name: { ru: 'Автозвук SPL', en: 'SPL car audio' }, icon: 'audio' },
      { name: { ru: 'Автотюнинг', en: 'Car tuning' }, icon: 'tuning' },
      { name: { ru: 'Детейлинг', en: 'Detailing' }, icon: 'detail' },
      { name: { ru: 'Ретро-автомобили', en: 'Retro cars' }, icon: 'retro' },
      { name: { ru: 'Запчасти и оборудование для СТО', en: 'Parts and service equipment' }, icon: 'parts' },
      { name: { ru: 'Автомойки и химия', en: 'Car wash and chemicals' }, icon: 'wash' },
      { name: { ru: 'Безмоторные гонки', en: 'Non-motorized racing' }, icon: 'race' },
    ],
    benefits: [
      { title: { ru: 'Живая аудитория', en: 'Live audience' }, text: { ru: 'Тест-показы и соревнования удерживают зрителей у стенда весь день.', en: 'Live demos and competitions keep the audience at your stand all day.' } },
      { title: { ru: 'Контракты с сервисами', en: 'Service-network contracts' }, text: { ru: 'Владелец СТО или мойки принимает решение о закупке на площадке.', en: 'A service or wash owner makes the purchase decision on site.' } },
      { title: { ru: 'Продукт в действии', en: 'Product in action' }, text: { ru: 'Химия, плёнки, звук и свет демонстрируются в работе, а не на полке.', en: 'Chemistry, films, audio and lighting are shown working, not on a shelf.' } },
    ],
    program: [
      { title: { ru: 'Чемпионат по дрифту', en: 'Drift championship' }, text: { ru: 'Заявки через Telegram @sofexpomgr. Заднеприводный автомобиль, ручной гидроручник, экипировка и шлем обязательны.', en: 'Entries via Telegram @sofexpomgr. Rear-wheel drive, hydraulic handbrake, suit and helmet mandatory.' } , day: 1},
      { title: { ru: 'Гонки на безмоторных машинах', en: 'Non-motorized racing' }, text: { ru: 'Гран-при 10 млн сумов, 6 млн за дизайн, 4 млн за командную форму. Команда до 4 человек, масса машины до 80 кг.', en: 'Grand Prix 10 mln UZS, 6 mln for design, 4 mln for team uniforms. Up to 4 crew, car under 80 kg.' } , day: 1},
      { title: { ru: 'SPL автотюнинг', en: 'SPL autotuning' }, text: { ru: 'Два класса — новички и профессионалы; кузов, салон, подкапотное пространство, мультимедиа.', en: 'Two classes — rookies and professionals; body, interior, engine bay, multimedia.' } , day: 2},
      { title: { ru: 'Пит-зона и маркет', en: 'Pit zone and market' }, text: { ru: 'Продажи запчастей, аксессуаров, химии и атрибутики.', en: 'Sales of parts, accessories, chemicals and merch.' } , day: 1},
    ],
    audience: [
      { label: { ru: 'Владельцы СТО и моек', en: 'Service and wash owners' }, value: 'service' },
      { label: { ru: 'Дистрибьюторы запчастей', en: 'Parts distributors' }, value: 'distributors' },
      { label: { ru: 'Энтузиасты и клубы', en: 'Enthusiasts and clubs' }, value: 'fans' },
      { label: { ru: 'Ритейл аксессуаров', en: 'Accessories retail' }, value: 'retail' },
    ],
    facts: [
      { value: '2', label: { ru: 'дня фестиваля', en: 'festival days' } },
      { value: '20 млн', label: { ru: 'сумов призовой фонд', en: 'UZS total prize fund' } },
      { value: '4 400 м²', label: { ru: 'крытая экспозиция', en: 'indoor expo' } },
      { value: '5 000 м²', label: { ru: 'площадка шоу', en: 'show area' } },
    ],
    stands: [
      { name: { ru: 'Экспозиция в зале', en: 'Indoor expo' }, area: '9–18 м²', note: { ru: 'Бренды запчастей, химии, детейлинга, акустики.', en: 'Parts, chemicals, detailing and audio brands.' } },
      { name: { ru: 'Пит-стоп на улице', en: 'Outdoor pit stop' }, area: 'от 36 м²', note: { ru: 'Рабочая зона с доступом к электричеству и воде.', en: 'Working zone with power and water access.' } },
      { name: { ru: 'Спонсорство шоу', en: 'Show sponsorship' }, area: 'пакеты', note: { ru: 'Брендирование трассы, сцены, наград и билетной зоны.', en: 'Track, stage, awards and ticket-zone branding.' } },
    ],
    speakers: [],
    materials: [
      { title: { ru: 'Спонсорское предложение', en: 'Sponsorship offer' }, type: 'pdf', href: '/files/promotors-sponsorship.pdf' },
      { title: { ru: 'Презентация 2026', en: '2026 presentation' }, type: 'pdf', href: '/files/promotors-2026.pdf' },
      { title: { ru: 'Фотоотчёт 2025', en: '2025 photo report' }, type: 'photo', href: 'https://disk.yandex.ru/d/AomBFx1nb3VAWg' },
      { title: { ru: 'Купить билет', en: 'Buy a ticket' }, type: 'video', href: 'https://ticketon.uz/sports/event/tckt2-promotors-show-samarkand-3' },
    ],
    faq: [
      { q: { ru: 'Сколько стоит участие в дрифт-шоу?', en: 'Does it cost anything to enter the drift show?' }, a: { ru: 'Для владельца проекта участие бесплатное после одобрения организаторами; партнёры проекта получают скидку 50%.', en: 'Free for the project owner once approved by the organizers; project partners get a 50% discount.' } },
      { q: { ru: 'Нужно ли согласовывать спонсорские логотипы на машине?', en: 'Do sponsor logos on the car need approval?' }, a: { ru: 'Да, любые спонсорские интеграции согласуются с организаторами фестиваля.', en: 'Yes, any sponsor integration must be approved by the organizers.' } },
    ],
    socials: { telegram: 'https://t.me/promotorsshow', instagram: 'https://www.instagram.com/promotorsshow/' },
    highlight: null,
    searchTerms: [
      { ru: 'дрифт Самарканд 2026', en: 'drift Samarkand 2026' },
      { ru: 'выставка автоиндустрии Узбекистан', en: 'automotive exhibition Uzbekistan' },
    ],
  },
  {
    slug: 'ecom-retail-expo',
    brand: { ru: 'ECOM & RETAIL EXPO SAMARKAND', en: 'ECOM & RETAIL EXPO SAMARKAND' },
    shortName: 'ECOM & RETAIL',
    industry: 'ecommerce',
    dates: { start: '2027-06-16', end: '2027-06-17', display: { ru: '16–17 июня 2027', en: '16–17 June 2027' } },
    edition: { ru: 'White Label Edition', en: 'White Label Edition' },
    status: 'registration',
    heroImage: '/images/event-ecom.jpg',
    tagline: {
      ru: 'Выставка-форум электронной коммерции и ритейла: производители встречаются с онлайн-продавцами.',
      en: 'The e-commerce and retail exhibition-forum: manufacturers meet online sellers.',
    },
    intro: {
      ru: 'Главная тема издания — модель White Label: производители предлагают готовый продукт, предприниматель продаёт его под своим брендом. Плюс финтех, маркетплейсы, логистика, фулфилмент, цифровой маркетинг и IT-сервисы.',
      en: 'The headline theme is the White Label model: manufacturers supply a finished product, entrepreneurs sell it under their own brand. Plus fintech, marketplaces, logistics, fulfillment, digital marketing and IT services.',
    },
    pitch: {
      ru: 'Мероприятие проходит при поддержке Управления Самаркандской области и Ассоциации продавцов Узбекистана. Для производителей это канал оптовых заказов, для селлеров — поиск фабрики под запуск бренда без инвестиций в производство.',
      en: 'Held with the support of the Samarkand Regional Administration and the Uzbekistan Sellers Association. For manufacturers it is a wholesale order channel; for sellers — a way to find a factory and launch a brand without investing in production.',
    },
    categories: [
      { name: { ru: 'White Label и контрактное производство', en: 'White label and contract manufacturing' }, icon: 'white' },
      { name: { ru: 'Маркетплейсы', en: 'Marketplaces' }, icon: 'marketplace' },
      { name: { ru: 'Финтех и эквайринг', en: 'Fintech and acquiring' }, icon: 'fintech' },
      { name: { ru: 'Логистика и фулфилмент', en: 'Logistics and fulfillment' }, icon: 'logistics' },
      { name: { ru: 'Цифровой маркетинг', en: 'Digital marketing' }, icon: 'marketing' },
      { name: { ru: 'IT-сервисы для торговли', en: 'IT services for retail' }, icon: 'it' },
      { name: { ru: 'Упаковка и фото-продакшн', en: 'Packaging and photo production' }, icon: 'package' },
      { name: { ru: 'Эквайринг и рассрочки', en: 'Payments and instalments' }, icon: 'fintech' },
    ],
    benefits: [
      { title: { ru: 'Партнёр-производитель', en: 'Manufacturing partner' }, text: { ru: 'Найдите фабрику под собственный бренд и договоритесь об условиях на месте.', en: 'Find a factory for your brand and agree terms on the spot.' } },
      { title: { ru: 'Оптовый канал', en: 'Wholesale channel' }, text: { ru: 'Производители показывают товар селлерам и получают заказы на серии.', en: 'Manufacturers show product to sellers and receive batch orders.' } },
      { title: { ru: 'Фото-зона для карточек', en: 'Product photo zone' }, text: { ru: 'На площадке работает студия подготовки карточек товаров для онлайн-продаж.', en: 'An on-site studio prepares product cards for online sales.' } },
      { title: { ru: 'Экспорт', en: 'Export' }, text: { ru: 'Заказы у узбекских производителей — вход на рынки соседних стран.', en: 'Orders from Uzbek manufacturers open doors to neighbouring markets.' } },
    ],
    program: [
      { title: { ru: 'Пленарная сессия ритейла', en: 'Retail plenary' }, text: { ru: 'Ритейл Узбекистана сегодня и завтра: полки, цены, сети.', en: 'Retail in Uzbekistan today and tomorrow: shelves, prices, chains.' } , day: 1},
      { title: { ru: 'Трек маркетплейсов', en: 'Marketplace track' }, text: { ru: 'Как зайти и продавать: комиссии, карточки, реклама, возвраты.', en: 'How to enter and sell: fees, product cards, ads, returns.' } , day: 1},
      { title: { ru: 'Трек логистики', en: 'Logistics track' }, text: { ru: 'Доставка последней мили, фулфилмент и склад.', en: 'Last-mile delivery, fulfillment and warehousing.' } , day: 2},
      { title: { ru: 'Биржа контактов', en: 'Matchmaking' }, text: { ru: 'Производитель — селлер: 10-минутные встречи по предварительному отбору.', en: 'Manufacturer — seller: pre-matched 10-minute meetings.' } , day: 2},
    ],
    audience: [
      { label: { ru: 'Онлайн-продавцы', en: 'Online sellers' }, value: 'sellers' },
      { label: { ru: 'Производители', en: 'Manufacturers' }, value: 'manufacturers' },
      { label: { ru: 'Маркетплейсы и сервисы', en: 'Marketplaces and services' }, value: 'platforms' },
      { label: { ru: 'Банки и финтех', en: 'Banks and fintech' }, value: 'finance' },
    ],
    facts: [
      { value: '2', label: { ru: 'дня выставки и форума', en: 'days of expo and forum' } },
      { value: '9', label: { ru: 'тематических треков программы', en: 'thematic programme tracks' } },
      { value: '350', label: { ru: 'мест в кафе для делегатов', en: 'café seats for delegates' } },
    ],
    stands: [
      { name: { ru: 'Стенд-витрина', en: 'Showcase stand' }, area: '9 м²', note: { ru: 'Образцы продукции и каталог для селлеров.', en: 'Product samples and a catalogue for sellers.' } },
      { name: { ru: 'Стенд сервиса', en: 'Service stand' }, area: '18 м²', note: { ru: 'Для логистики, финтеха и IT: экран, переговорная стойка.', en: 'For logistics, fintech and IT: screen and a meeting counter.' } },
      { name: { ru: 'Спонсорский пакет', en: 'Sponsorship package' }, area: 'пакеты', note: { ru: 'Брендирование сцены, биржи контактов и фото-зоны.', en: 'Stage, matchmaking and photo-zone branding.' } },
    ],
    speakers: [
      { name: 'Sellers Association', role: { ru: 'Соорганизатор', en: 'Co-organizer' }, org: 'uz' },
    ],
    materials: [
      { title: { ru: 'Спонсорская программа', en: 'Sponsorship programme' }, type: 'pdf', href: '/files/ecom-sponsorship.pdf' },
      { title: { ru: 'Презентация выставки', en: 'Event presentation' }, type: 'pdf', href: '/files/ecom-presentation.pdf' },
    ],
    faq: [
      { q: { ru: 'Кто может стать селлером-участником?', en: 'Who can attend as a seller?' }, a: { ru: 'Онлайн-продавцы, владельцы брендов, закупщики и стартапы e-commerce. Вход для посетителя бесплатный по регистрации.', en: 'Online sellers, brand owners, buyers and e-commerce startups. Visitor entry is free after registration.' } },
      { q: { ru: 'Есть ли поддержка Ассоциации продавцов?', en: 'Is the Sellers Association involved?' }, a: { ru: 'Да, Ассоциация продавцов Узбекистана — соорганизатор: программы обучения и консультации по выходу на маркетплейсы.', en: 'Yes, the Uzbekistan Sellers Association co-organizes: training sessions and marketplace entry consultations.' } },
    ],
    socials: { instagram: 'https://www.instagram.com/ecomretailexpo/' },
    highlight: {
      label: { ru: 'White Label Edition', en: 'White Label Edition' },
      text: {
        ru: 'Соорганизатор — Ассоциация продавцов Узбекистана, при поддержке управления Самаркандской области.',
        en: 'Co-organized with the Uzbekistan Sellers Association, backed by the Samarkand region administration.',
      },
    },
    searchTerms: [
      { ru: 'ecom выставка Узбекистан', en: 'e-commerce expo Uzbekistan' },
      { ru: 'white label самарканд', en: 'white label Samarkand' },
    ],
  },
  {
    slug: 'world-edu-expo',
    brand: { ru: 'WORLD EDU', en: 'WORLD EDU' },
    shortName: 'WORLD EDU',
    industry: 'education',
    dates: { start: '2027-04-09', end: '2027-04-10', display: { ru: '9–10 апреля 2027', en: '9–10 April 2027' } },
    edition: { ru: 'SPRING', en: 'SPRING' },
    status: 'registration',
    heroImage: '/images/event-worldedu.jpg',
    tagline: {
      ru: 'Международная выставка образования: вузы, стипендии и обучение за рубежом.',
      en: 'The international education exhibition: universities, scholarships and studying abroad.',
    },
    intro: {
      ru: 'Абитуриенты встречаются с представителями государственных и частных вузов Узбекистана, России, Беларуси, Казахстана, Европы, Юго-Восточной Азии и Турции, узнают о стипендиях и грантах, сдают пробные тесты.',
      en: 'Applicants meet representatives of public and private universities from Uzbekistan, Russia, Belarus, Kazakhstan, Europe, South-East Asia and Türkiye, learn about scholarships and grants, and take mock tests.',
    },
    pitch: {
      ru: 'Выставка закрывает три вопроса: кем учиться, где и за чей счёт. В деловой программе — презентации приёмных комиссий, консультации по IELTS, GMAT и SAT, профессиональное тестирование с разбором результатов.',
      en: 'The exhibition answers three questions: what to study, where, and at whose expense. The programme includes admission-office presentations, IELTS, GMAT and SAT consultations, and aptitude testing with a debrief.',
    },
    categories: [
      { name: { ru: 'Государственные университеты', en: 'State universities' }, icon: 'university' },
      { name: { ru: 'Филиалы иностранных вузов', en: 'Foreign university branches' }, icon: 'branch' },
      { name: { ru: 'Частные вузы и колледжи', en: 'Private universities and colleges' }, icon: 'college' },
      { name: { ru: 'Подготовка к IELTS, GMAT, SAT', en: 'IELTS, GMAT, SAT preparation' }, icon: 'exam' },
      { name: { ru: 'Стипендии и гранты', en: 'Scholarships and grants' }, icon: 'grant' },
      { name: { ru: 'Консультанты по образованию за рубежом', en: 'Study-abroad consultants' }, icon: 'consult' },
      { name: { ru: 'Онлайн-платформы и EdTech', en: 'Online platforms and EdTech' }, icon: 'edtech' },
      { name: { ru: 'Языковые центры', en: 'Language centres' }, icon: 'language' },
    ],
    benefits: [
      { title: { ru: 'Оценка шансов', en: 'Realistic chances' }, text: { ru: 'Консультант приёмной комиссии оценивает шансы на нужную специальность.', en: 'An admissions officer assesses your chances for the chosen major.' } },
      { title: { ru: 'План поступления', en: 'Admission plan' }, text: { ru: 'Как готовиться к поступлению в топовый вуз — по шагам.', en: 'How to prepare for entry into a top university, step by step.' } },
      { title: { ru: 'Тестирование на месте', en: 'On-site testing' }, text: { ru: 'Профессиональный тест и разбор результатов с экспертом.', en: 'Aptitude testing and a result debrief with an expert.' } },
      { title: { ru: 'Финансирование', en: 'Funding' }, text: { ru: 'Полное и частичное финансирование обучения, гранты, образовательные кредиты.', en: 'Full and partial tuition funding, grants, education loans.' } },
    ],
    program: [
      { title: { ru: 'Презентации вузов', en: 'University presentations' }, text: { ru: 'Требования к поступлению и стоимости обучения — от первых лиц.', en: 'Admission and tuition requirements from the people who decide.' } , day: 1},
      { title: { ru: 'Профориентация', en: 'Career guidance' }, text: { ru: 'Тесты и консультации для старшеклассников и родителей.', en: 'Tests and consultations for high-school students and parents.' } , day: 2},
      { title: { ru: 'Розыгрыш призов', en: 'Prize draw' }, text: { ru: 'Смартфоны, подписки на языковые курсы и профильные курсы. Розыгрыш в дни выставки, при личном присутствии.', en: 'Smartphones, language-course subscriptions and professional courses. Drawn during the show with the visitor present.' } , day: 2},
    ],
    audience: [
      { label: { ru: 'Абитуриенты и студенты', en: 'Applicants and students' }, value: 'students' },
      { label: { ru: 'Родители', en: 'Parents' }, value: 'parents' },
      { label: { ru: 'Школы и лицеи', en: 'Schools and lyceums' }, value: 'schools' },
      { label: { ru: 'Вузы и консультанты', en: 'Universities and agencies' }, value: 'unis' },
    ],
    facts: [
      { value: '2', label: { ru: 'дня работы', en: 'days' } },
      { value: '10+', label: { ru: 'стран-участниц', en: 'participating countries' } },
      { value: '2', label: { ru: 'смартфона в розыгрыше', en: 'smartphones in the draw' } },
    ],
    stands: [
      { name: { ru: 'Стенд вуза', en: 'University stand' }, area: '9 м²', note: { ru: 'Инфостойка, баннер, раздаточные материалы.', en: 'Counter, banner, printed materials.' } },
      { name: { ru: 'Стенд-презентация', en: 'Presentation stand' }, area: '18 м²', note: { ru: 'Экран для показа кампуса и программ.', en: 'Screen for campus and programme footage.' } },
      { name: { ru: 'Сессия в конференц-зале', en: 'Conference slot' }, area: '30–60 мин', note: { ru: 'Отдельная презентация для абитуриентов.', en: 'A standalone presentation for applicants.' } },
    ],
    speakers: [],
    materials: [
      { title: { ru: 'Онлайн-каталог WORLD EDU', en: 'WORLD EDU online catalogue' }, type: 'catalog', href: 'https://apicore.uz/world-edu' },
      { title: { ru: 'Каталог 2024', en: '2024 catalogue' }, type: 'catalog', href: '/files/world-edu-catalog-2024.pdf' },
    ],
    faq: [
      { q: { ru: 'Есть ли билет для посетителя?', en: 'Do visitors need a ticket?' }, a: { ru: 'Вход свободный по онлайн-регистрации; она же участвует в розыгрыше призов.', en: 'Free entry with online registration, which also enters you into the prize draw.' } },
      { q: { ru: 'Можно ли приехать классом?', en: 'Can a school bring a class?' }, a: { ru: 'Да, для организованных групп — отдельный вход, экскурсия по выставке и профориентационный тест.', en: 'Yes: organized groups get a separate entrance, a guided tour and aptitude testing.' } },
    ],
    socials: { telegram: 'https://t.me/worldeduexpo', instagram: 'https://www.instagram.com/worldeduexpo/' },
    highlight: {
      label: { ru: 'Приём заявок вузов открыт', en: 'University applications open' },
      text: {
        ru: 'Университеты Узбекистана, России, Беларуси, Казахстана, ЕС и Юго-Восточной Азии, стипендии, IELTS/GMAT/SAT, розыгрыш призов.',
        en: 'Universities from Uzbekistan, Russia, Belarus, Kazakhstan, the EU and South-East Asia, scholarships, IELTS/GMAT/SAT, prize draw.',
      },
    },
    searchTerms: [
      { ru: 'выставка образования Самарканд', en: 'education exhibition Samarkand' },
      { ru: 'World Edu expo Uzbekistan', en: 'World Edu expo Uzbekistan' },
    ],
  },
];

export const upcoming = events
  .filter((e) => e.status !== 'past')
  .sort((a, b) => a.dates.start.localeCompare(b.dates.start));

export const byIndustry = [...new Set(events.map((e) => e.industry))];

export function getEvent(slug: string): ExpoEvent | undefined {
  return events.find((e) => e.slug === slug);
}

export function nextEvent(from = new Date()): ExpoEvent {
  return (
    upcoming.find((e) => new Date(e.dates.end) >= from) ??
    upcoming[0]
  );
}
