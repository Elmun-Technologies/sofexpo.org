import type { L } from '@/data/events';

/**
 * Section (segment) pages — the FHA / SIAL "one landing page per product segment"
 * pattern (docs/13 §P1-2). A buyer searching for "tea and coffee exhibition Samarkand"
 * must land on copy about tea and coffee, not on a template with a name swapped in.
 *
 * This is the one place in the project where MANY pages share a renderer: it is a
 * directory family, not an authored page. What stays individual is the copy — every
 * section carries its own lead, its own "what buyers ask" and its own "what to bring".
 * Meta titles, descriptions and the CTA line are composed from the section name at
 * render time and translated through the parameterized rules in scripts/localization.mjs.
 */
export interface SectionPage {
  /** url segment, e.g. `tea-and-coffee` */
  slug: string;
  /** the category exactly as it is written in events.ts — the page's h1 */
  title: L;
  lead: L;
  /** what buyers in this segment ask for first */
  buyers: L;
  /** what an exhibitor in this segment must bring */
  exhibitors: L;
}

/**
 * Wording of the two cards and of the section that holds them. Trade-show vocabulary is
 * the default; a show whose visitor is not a buyer gets its own words — an education expo
 * has applicants and parents, not "закупщики".
 */
export interface SectionLabels {
  buyers: L;
  exhibitors: L;
  pair?: L;
}

export const sectionLabels: Record<string, SectionLabels> = {
  'world-edu-expo': {
    buyers: { ru: 'Что спрашивают абитуриенты и родители', en: 'What applicants and parents ask' },
    exhibitors: { ru: 'Что подготовить участнику', en: 'What an exhibitor prepares' },
    pair: { ru: 'Две стороны одного раздела: абитуриент и вуз', en: 'Two sides of one section: the applicant and the university' },
  },
  'ecom-retail-expo': {
    buyers: { ru: 'Что ищут заказчики', en: 'What clients look for' },
    exhibitors: { ru: 'Что подготовить подрядчику', en: 'What a contractor prepares' },
  },
};


export const sectionPages: Record<string, SectionPage[]> = {
  'foodera-expo': [
    {
      slug: 'soft-drinks',
      title: { ru: 'Безалкогольные напитки', en: 'Soft drinks' },
      lead: { ru: 'Вода, соки, лимонады, холодный чай и кофе, сиропы для HoReCa: здесь сравнивают не только вкус, но и логистику тары.', en: 'Water, juices, soft drinks, iced tea and coffee, HoReCa syrups: here a buyer compares taste and the logistics of the packaging.' },
      buyers: { ru: 'Смотрят срок хранения, вес паллеты, устойчивость поставок в сезон и готовность работать под маркой сети.', en: 'They check shelf life, pallet weight, whether supply holds in high season and readiness to work under the chain\'s own label.' },
      exhibitors: { ru: 'Берите образцы в той же таре, что пойдёт на полку, и цену за литр с доставкой до Самарканда.', en: 'Bring samples in the retail packaging that will reach the shelf and a price per litre delivered to Samarkand.' },
    },
    {
      slug: 'tea-and-coffee',
      title: { ru: 'Чай и кофе', en: 'Tea and coffee' },
      lead: { ru: 'Чай, кофе в зёрнах и молотый, капсулы, растворимые напитки и аксессуары — раздел, куда приходят закупщики сетей и кофейни.', en: 'Tea, whole-bean and ground coffee, capsules, instant drinks and accessories — where chain buyers and coffee shops come to source.' },
      buyers: { ru: 'Интересуются стабильностью обжарки, происхождением сырья, фасовкой под полку и сертификатами на партию.', en: 'They ask about roast consistency, the origin of the raw material, shelf-ready packing and certificates for the batch.' },
      exhibitors: { ru: 'Организуйте дегустацию на стенде: чай и кофе продаются вкусом, и решение часто принимается сразу на месте.', en: 'Run a tasting on the stand: tea and coffee sell on flavour, and the decision is often taken right there.' },
    },
    {
      slug: 'grocery',
      title: { ru: 'Бакалея', en: 'Grocery' },
      lead: { ru: 'Крупы, макароны, мука, сахар, соль, специи и сухие смеси — базовая полка, по которой судят об ассортименте поставщика.', en: 'Groats, pasta, flour, sugar, salt, spices and dry mixes — the basic shelf a supplier\'s whole range is judged by.' },
      buyers: { ru: 'Сравнивают цену за килограмм, стабильность фасовки, сертификаты и возможность поставки круглый год.', en: 'They compare price per kilogram, packing consistency, certificates and whether supply runs all year round.' },
      exhibitors: { ru: 'Привозите прайс с градацией по объёму и образцы в торговой упаковке: бакалею берут цифрами, а не рассказом.', en: 'Bring a volume-graded price list and samples in retail packing: grocery is bought with numbers, not with a story.' },
    },
    {
      slug: 'confectionery-bakery',
      title: { ru: 'Кондитерские и хлебобулочные изделия', en: 'Confectionery and bakery' },
      lead: { ru: 'Конфеты, шоколад, печенье, выпечка и хлеб длительного хранения — раздел с самой высокой долей импульсных решений.', en: 'Sweets, chocolate, biscuits, bakery products and long-life bread — the section with the highest share of impulse decisions.' },
      buyers: { ru: 'Смотрят на срок годности, устойчивость к перевозке, дизайн упаковки и готовность делать сезонные позиции.', en: 'They check shelf life, how the product survives transport, packaging design and readiness to make seasonal items.' },
      exhibitors: { ru: 'Держите на стенде ассортиментную коробку и мини-версии для раздачи: сладкое пробуют и заказывают сразу.', en: 'Keep an assortment box and mini samples to hand out: confectionery is tasted and ordered on the spot.' },
    },
    {
      slug: 'dairy-cheese',
      title: { ru: 'Молочная продукция и сыры', en: 'Dairy and cheese' },
      lead: { ru: 'Молоко, сыры, йогурты, сметана, масло и сухое молоко — раздел, где сделку решают холодовая цепь и документы.', en: 'Milk, cheese, yoghurt, sour cream, butter and milk powder — the section where the cold chain and documents decide the deal.' },
      buyers: { ru: 'Проверяют температурный режим, сроки реализации, ветеринарные документы и стабильность вкуса от партии к партии.', en: 'They check the temperature regime, shelf life, veterinary documents and whether taste stays stable batch to batch.' },
      exhibitors: { ru: 'Заранее согласуйте холодильное оборудование и мощность: образцы должны оставаться холодными все три дня.', en: 'Arrange refrigeration and power in advance: samples have to stay cold for all three days.' },
    },
    {
      slug: 'meat-poultry',
      title: { ru: 'Мясо, птица и яйца', en: 'Meat, poultry and eggs' },
      lead: { ru: 'Мясо, птица, колбасы, деликатесы, яйца и готовая кулинария — раздел с самыми строгими требованиями к документам.', en: 'Meat, poultry, sausages, deli meats, eggs and prepared foods — the section with the strictest document requirements.' },
      buyers: { ru: 'Смотрят на происхождение сырья, ветдокументы, условия хранения и готовность поставлять объёмом под сеть.', en: 'They look at raw-material origin, veterinary documents, storage conditions and the ability to supply a chain\'s volume.' },
      exhibitors: { ru: 'Готовьте комплект документов на партию и расчёт охлаждённой логистики — без этого разговор не станет поставкой.', en: 'Prepare the batch documents and a chilled-logistics calculation — without them the talk never becomes a delivery.' },
    },
    {
      slug: 'frozen-semi-finished',
      title: { ru: 'Замороженная продукция и полуфабрикаты', en: 'Frozen and semi-finished' },
      lead: { ru: 'Замороженные овощи, ягоды, полуфабрикаты, тесто и готовые блюда: раздел для сетей, HoReCa и кейтеринга.', en: 'Frozen vegetables, berries, semi-finished products, dough and ready meals: the section for chains, HoReCa and catering.' },
      buyers: { ru: 'Сравнивают выход после разморозки, срок хранения, поставку в зимний сезон и цену за порцию.', en: 'They compare yield after defrosting, storage life, winter supply and the price per portion.' },
      exhibitors: { ru: 'Покажите расчёт выхода и себестоимость порции: для заморозки это решает быстрее, чем дегустация.', en: 'Show the yield and the cost per portion: for frozen food these decide faster than a tasting does.' },
    },
    {
      slug: 'preserves-canned',
      title: { ru: 'Консервация', en: 'Preserves and canned food' },
      lead: { ru: 'Консервы, джемы, соусы в банке, овощная и фруктовая консервация, пасты — длинный срок хранения и ровный спрос.', en: 'Canned food, jams, jarred sauces, preserved vegetables and fruit, pastes — long shelf life and steady demand.' },
      buyers: { ru: 'Смотрят на состав, срок годности, стабильность партии и цену за единицу при поставке паллетами.', en: 'They check ingredients, shelf life, batch consistency and the unit price when delivered by the pallet.' },
      exhibitors: { ru: 'Возьмите пробники и спецификацию по всем SKU: консервацию закупают списком, а не одной позицией.', en: 'Bring tasters and a specification for every SKU: preserves are bought as a list, not as one item.' },
    },
    {
      slug: 'oils-fats-sauces',
      title: { ru: 'Масложировая продукция и соусы', en: 'Oils, fats and sauces' },
      lead: { ru: 'Растительные масла, жиры, маргарины, майонез, кетчуп и соусы — раздел, где конкурируют рецептура и цена за литр.', en: 'Vegetable oils, fats, margarine, mayonnaise, ketchup and sauces — where the recipe and the price per litre compete.' },
      buyers: { ru: 'Интересуются составом, жирностью, тарой под полку и возможностью выпуска под собственной маркой.', en: 'They ask about composition, fat content, shelf-ready containers and private-label production.' },
      exhibitors: { ru: 'Подготовьте сравнительную таблицу состава и цены: закупщик выбирает из трёх поставщиков за один заход.', en: 'Prepare a comparison table of composition and price: a buyer chooses between three suppliers in one pass.' },
    },
    {
      slug: 'delicacies',
      title: { ru: 'Гастрономические деликатесы', en: 'Gastronomic delicacies' },
      lead: { ru: 'Деликатесы, орехи, сухофрукты, восточные сладости и премиальные закуски — раздел подарков и праздничной полки.', en: 'Delicatessen, nuts, dried fruit, oriental sweets and premium snacks — gift sets and the festive shelf.' },
      buyers: { ru: 'Смотрят на подарочную упаковку, маржинальность, сезонность и возможность собрать набор под маркой сети.', en: 'They look at gift packaging, margin, seasonality and whether a set can be assembled under the chain\'s brand.' },
      exhibitors: { ru: 'Покажите готовые подарочные решения и минимальную партию: деликатесы берут под конкретный сезон.', en: 'Show finished gift sets and the minimum order: delicacies are bought for a specific season.' },
    },
    {
      slug: 'organic-healthy',
      title: { ru: 'Органическая продукция и здоровое питание', en: 'Organic and healthy food' },
      lead: { ru: 'Органическая продукция, безглютеновые и безсахарные линейки, спортивное питание — самый быстрорастущий раздел.', en: 'Organic produce, gluten-free and sugar-free lines, sports nutrition — the fastest-growing section of the show.' },
      buyers: { ru: 'Ищут подтверждённый статус продукта, понятный состав и поставщика, который держит качество малыми партиями.', en: 'They look for a certified status, a legible ingredient list and a supplier who keeps quality stable in small batches.' },
      exhibitors: { ru: 'Возьмите сертификаты и историю происхождения: в этом разделе доверие важнее цены.', en: 'Bring certificates and the origin story: in this section trust weighs more than price.' },
    },
    {
      slug: 'packaging-equipment',
      title: { ru: 'Упаковка и оборудование', en: 'Packaging and equipment' },
      lead: { ru: 'Упаковка, этикетка, торговое и холодильное оборудование, оснащение цеха — для тех, кто запускает производство.', en: 'Packaging, labels, retail and refrigeration equipment, processing machinery — for those starting or expanding production.' },
      buyers: { ru: 'Сравнивают срок изготовления, сервис и наличие запчастей в Узбекистане, а не только цену оборудования.', en: 'They compare lead time, service and spare parts available in Uzbekistan — not only the price of the machine.' },
      exhibitors: { ru: 'Ставьте образцы упаковки и, если позволяет площадь, работающий образец: техника продаётся в действии.', en: 'Show packaging samples and, if the space allows, a working machine: equipment sells in action.' },
    },
  ],
  'buildpro-expo': [
    {
      slug: 'building-materials',
      title: { ru: 'Строительные материалы', en: 'Building materials' },
      lead: { ru: 'Цемент, сухие смеси, блоки, утеплитель и кровля — раздел, с которого начинается смета.', en: 'Cement, dry mixes, blocks, insulation and roofing — the section a specification starts with.' },
      buyers: { ru: 'Смотрят сертификат, расход на квадратный метр и дойдёт ли объём до Самарканда в сезон.', en: 'They check the certificate, the consumption per square metre and whether the volume reaches Samarkand in season.' },
      exhibitors: { ru: 'Берите техкарту и паллет самого продукта: стройматериалы покупают по документам.', en: 'Bring the technical data sheet and a pallet of the actual product: materials are bought on documents.' },
    },
    {
      slug: 'tools-fasteners',
      title: { ru: 'Инструмент и крепёж', en: 'Tools and fasteners' },
      lead: { ru: 'Ручной и электроинструмент, крепёж, оснастка и расходники — раздел, где решение принимают за минуту.', en: 'Hand and power tools, fasteners, bits and consumables — the section where the decision is taken in a minute.' },
      buyers: { ru: 'Пробуют в руках, сравнивают цену за единицу и спрашивают, есть ли расходник в наличии круглый год.', en: 'They try it in the hand, compare the unit price and ask whether consumables are stocked all year.' },
      exhibitors: { ru: 'Держите рабочий стенд с инструментом под напряжением и коробку расходников на раздачу.', en: 'Keep a working stand with live tools and a box of consumables to hand out.' },
    },
    {
      slug: 'machine-tools-equipment',
      title: { ru: 'Станки и оборудование', en: 'Machine tools and equipment' },
      lead: { ru: 'Станки, линии, компрессоры и оснастка для производства — раздел для тех, кто расширяет цех.', en: 'Machine tools, production lines, compressors and tooling — the section for those expanding a workshop.' },
      buyers: { ru: 'Сравнивают производительность, срок поставки, пусконаладку и кто чинит оборудование в Узбекистане.', en: 'They compare output, delivery time, commissioning and who services the machine in Uzbekistan.' },
      exhibitors: { ru: 'Готовьте расчёт окупаемости и график поставки: оборудование покупают цифрами, а не каталогом.', en: 'Prepare a payback calculation and a delivery schedule: machinery is bought with numbers, not with a catalogue.' },
    },
    {
      slug: 'house-building',
      title: { ru: 'Домостроение', en: 'House building' },
      lead: { ru: 'Каркасные и модульные технологии, готовые дома, сэндвич-панели — раздел быстрого строительства.', en: 'Frame and modular systems, finished houses, sandwich panels — the section of fast construction.' },
      buyers: { ru: 'Считают срок сборки, цену за квадратный метр под ключ и как дом поведёт себя в жару и холод.', en: 'They count the assembly time, the turnkey price per square metre and how the house behaves in heat and cold.' },
      exhibitors: { ru: 'Покажите проект, смету и построенный объект: в домостроении продаёт уже сданный дом.', en: 'Show the project, the estimate and a finished building: in house building a delivered house sells.' },
    },
    {
      slug: 'real-estate',
      title: { ru: 'Недвижимость', en: 'Real estate' },
      lead: { ru: 'Застройщики, агентства, ипотека и рассрочка — раздел, куда приходят не за товаром, а за решением.', en: 'Developers, agencies, mortgages and instalment plans — where people come for a decision, not a product.' },
      buyers: { ru: 'Спрашивают про срок сдачи, документы на землю, рассрочку и кто будет управлять домом.', en: 'They ask about completion dates, land documents, instalment terms and who will manage the building.' },
      exhibitors: { ru: 'Привозите планировки, прайс по корпусам и документы: недвижимость покупают после проверки бумаг.', en: 'Bring floor plans, a price list by building and the documents: property is bought after the paperwork checks out.' },
    },
    {
      slug: 'landscape-greening',
      title: { ru: 'Ландшафт и озеленение', en: 'Landscape and greening' },
      lead: { ru: 'Саженцы, газоны, системы полива, малые формы и уход за территорией — раздел благоустройства.', en: 'Seedlings, lawns, irrigation systems, small architecture and grounds maintenance — the landscaping section.' },
      buyers: { ru: 'Смотрят приживаемость в местном климате, расход воды и кто будет обслуживать систему после сдачи.', en: 'They look at survival in the local climate, water consumption and who will service the system after handover.' },
      exhibitors: { ru: 'Покажите живые образцы и расчёт полива на сезон: озеленение продаётся глазами и водой.', en: 'Show live samples and a seasonal irrigation calculation: landscaping sells through the eye and through water.' },
    },
    {
      slug: 'interior-design',
      title: { ru: 'Интерьер и дизайн', en: 'Interior and design' },
      lead: { ru: 'Мебель, свет, текстиль, напольные покрытия и декор — раздел, где покупают глазами и тактильно.', en: 'Furniture, lighting, textiles, floor coverings and decor — the section bought with the eyes and the hands.' },
      buyers: { ru: 'Сравнивают износостойкость, срок изготовления, наличие на складе и условия работы с дизайнерами.', en: 'They compare wear resistance, production time, stock availability and the terms for working with designers.' },
      exhibitors: { ru: 'Соберите на стенде готовый фрагмент интерьера: по каталогу отделочные материалы не выбирают.', en: 'Build a finished interior fragment on the stand: finishing materials are not chosen from a catalogue.' },
    },
    {
      slug: 'light-electricity',
      title: { ru: 'Свет и электрика', en: 'Light and electricity' },
      lead: { ru: 'Светильники, кабель, щиты, автоматика и энергоэффективные решения — раздел инженерии здания.', en: 'Luminaires, cable, switchboards, automation and energy-efficient systems — the building engineering section.' },
      buyers: { ru: 'Проверяют соответствие нормам, срок службы, гарантию и совместимость с уже смонтированным.', en: 'They check compliance with standards, service life, warranty and compatibility with what is already installed.' },
      exhibitors: { ru: 'Возьмите образцы, сертификаты и схему подключения; включённый свет продаёт лучше описания.', en: 'Bring samples, certificates and a wiring diagram; switched-on light sells better than a description.' },
    },
    {
      slug: 'windows-doors-facades',
      title: { ru: 'Окна, двери, фасады', en: 'Windows, doors, facades' },
      lead: { ru: 'Оконные системы, двери, фасадные материалы и фурнитура — раздел, где считают тепло и шум.', en: 'Window systems, doors, facade materials and hardware — the section where heat and noise are counted.' },
      buyers: { ru: 'Смотрят на коэффициент теплопотери, шумоизоляцию, срок изготовления и монтаж под ключ.', en: 'They look at the heat-loss coefficient, sound insulation, production time and turnkey installation.' },
      exhibitors: { ru: 'Ставьте образец в разрезе и считайте экономию на отоплении: фасад продаётся расчётом.', en: 'Show a cut-away sample and calculate the heating saving: a facade sells with a calculation.' },
    },
    {
      slug: 'ceramics-stone',
      title: { ru: 'Керамика и камень', en: 'Ceramics and stone' },
      lead: { ru: 'Плитка, керамогранит, мозаика, натуральный и искусственный камень — раздел отделки и мощения.', en: 'Tiles, porcelain stoneware, mosaics, natural and engineered stone — the section of finishes and paving.' },
      buyers: { ru: 'Сравнивают износостойкость, партию (чтобы тон совпал), срок поставки и цену за квадратный метр.', en: 'They compare wear class, batch (so the shade matches), delivery time and the price per square metre.' },
      exhibitors: { ru: 'Выкладывайте плитку на стенде: цвет и фактуру на фото не покупают, их щупают.', en: 'Lay the tile out on the stand: colour and texture are not bought from a photo — they are touched.' },
    },
  ],
  'agropro-expo': [
    {
      slug: 'agrotechnology',
      title: { ru: 'Агротехнологии', en: 'Agrotechnology' },
      lead: { ru: 'Технологии возделывания, севооборот, точное земледелие и агрономический консалтинг.', en: 'Cultivation technology, crop rotation, precision farming and agronomic consulting.' },
      buyers: { ru: 'Считают прибавку урожая, расход воды и удобрений и окупаемость за сезон.', en: 'They count the yield gain, water and fertiliser consumption and payback within a season.' },
      exhibitors: { ru: 'Привозите данные полевых испытаний: в агротехнологиях верят результату, а не презентации.', en: 'Bring field-trial data: in agrotechnology people believe a result, not a presentation.' },
    },
    {
      slug: 'agricultural-machinery',
      title: { ru: 'Сельхозтехника', en: 'Agricultural machinery' },
      lead: { ru: 'Тракторы, комбайны, сеялки, опрыскиватели и навесное оборудование — самый крупный раздел выставки.', en: 'Tractors, combines, seed drills, sprayers and mounted implements — the largest section of the show.' },
      buyers: { ru: 'Сравнивают мощность, расход топлива, наличие сервиса и запчастей в области.', en: 'They compare power, fuel consumption and whether service and spare parts exist in the region.' },
      exhibitors: { ru: 'Готовьте расчёт лизинга и график поставки: технику берут в кредит и под уборку.', en: 'Prepare a leasing calculation and a delivery schedule: machinery is bought on credit and before harvest.' },
    },
    {
      slug: 'irrigation-equipment',
      title: { ru: 'Оборудование для орошения', en: 'Irrigation equipment' },
      lead: { ru: 'Капельный полив, насосы, фильтры, трубы и автоматика полива — раздел, где считают воду.', en: 'Drip irrigation, pumps, filters, pipes and automation — the section where water is counted.' },
      buyers: { ru: 'Смотрят расход воды на гектар, давление в системе и сколько рук нужно для обслуживания.', en: 'They look at water use per hectare, system pressure and how many hands the system needs.' },
      exhibitors: { ru: 'Покажите работающий узел и расчёт экономии воды: полив продаётся в цифрах.', en: 'Show a working unit and a water-saving calculation: irrigation sells in numbers.' },
    },
    {
      slug: 'seeds-seedlings',
      title: { ru: 'Семена и саженцы', en: 'Seeds and seedlings' },
      lead: { ru: 'Семена, гибриды, саженцы плодовых и винограда, питомники — раздел, где выбор делают на год вперёд.', en: 'Seeds, hybrids, fruit and vine seedlings, nurseries — the section where the choice is made a year ahead.' },
      buyers: { ru: 'Спрашивают про районирование, всхожесть, устойчивость к болезням и документы на партию.', en: 'They ask about regional suitability, germination, disease resistance and batch documents.' },
      exhibitors: { ru: 'Берите образцы, сертификаты и результаты испытаний: семена покупают под будущий урожай.', en: 'Bring samples, certificates and trial results: seed is bought against a future harvest.' },
    },
    {
      slug: 'agrochemistry-labs',
      title: { ru: 'Агрохимия и лаборатории', en: 'Agrochemistry and labs' },
      lead: { ru: 'Удобрения, средства защиты растений, лабораторный анализ почвы и воды.', en: 'Fertilisers, crop protection products, laboratory analysis of soil and water.' },
      buyers: { ru: 'Проверяют действующее вещество, регистрацию в Узбекистане, сроки внесения и дозировки.', en: 'They check the active substance, registration in Uzbekistan, application timing and dosage.' },
      exhibitors: { ru: 'Готовьте протоколы испытаний и инструкцию по применению: агрохимию покупают с документами.', en: 'Prepare test reports and the application instructions: agrochemistry is bought with paperwork.' },
    },
    {
      slug: 'greenhouses',
      title: { ru: 'Теплицы', en: 'Greenhouses' },
      lead: { ru: 'Тепличные конструкции, плёнка и стекло, климат-контроль, капельный полив и досвечивание.', en: 'Greenhouse structures, film and glass, climate control, drip lines and supplementary lighting.' },
      buyers: { ru: 'Считают стоимость квадратного метра, энергопотребление и урожай с квадрата в год.', en: 'They count the cost per square metre, energy use and the yearly yield per square metre.' },
      exhibitors: { ru: 'Покажите проект под местный климат и расчёт окупаемости: теплицу строят на годы.', en: 'Show a design for the local climate and a payback calculation: a greenhouse is built for years.' },
    },
    {
      slug: 'storage-logistics',
      title: { ru: 'Хранение и логистика', en: 'Storage and logistics' },
      lead: { ru: 'Овощехранилища, холодильное оборудование, тара, перевозка и склады — раздел после уборки.', en: 'Vegetable stores, refrigeration, containers, transport and warehousing — the section after the harvest.' },
      buyers: { ru: 'Сравнивают потери при хранении, энергопотребление и срок службы оборудования.', en: 'They compare storage losses, energy consumption and the service life of the equipment.' },
      exhibitors: { ru: 'Готовьте расчёт потерь и энергопотребления: хранение покупают, считая убытки.', en: 'Prepare a loss and energy calculation: storage is bought by counting the losses.' },
    },
    {
      slug: 'livestock-poultry',
      title: { ru: 'Животноводство и птицеводство', en: 'Livestock and poultry' },
      lead: { ru: 'Корма, ветеринария, оборудование для ферм, птичники и племенное дело.', en: 'Feed, veterinary supplies, farm equipment, poultry houses and breeding stock.' },
      buyers: { ru: 'Смотрят конверсию корма, сохранность поголовья, ветеринарные документы и сервис.', en: 'They look at feed conversion, survival rates, veterinary documents and service.' },
      exhibitors: { ru: 'Берите расчёт рациона и протоколы испытаний: животноводство считает в килограммах привеса.', en: 'Bring a ration calculation and trial protocols: livestock counts in kilograms of gain.' },
    },
    {
      slug: 'standardization-certification',
      title: { ru: 'Стандартизация и сертификация', en: 'Standardization and certification' },
      lead: { ru: 'Сертификация, лаборатории, органы по подтверждению соответствия и экспортные документы.', en: 'Certification bodies, laboratories, conformity assessment and export documentation.' },
      buyers: { ru: 'Спрашивают сроки, стоимость, признание сертификата за рубежом и перечень документов.', en: 'They ask about timing, cost, whether the certificate is recognised abroad and the document list.' },
      exhibitors: { ru: 'Покажите перечень документов и сроки: экспорт срывается не на цене, а на бумаге.', en: 'Show the document list and the timelines: export fails on paperwork, not on price.' },
    },
  ],
  'world-edu-expo': [
    {
      slug: 'state-universities',
      title: { ru: 'Государственные вузы', en: 'State universities' },
      lead: { ru: 'Государственные университеты Узбекистана и зарубежья: направления, бюджетные места, общежитие.', en: 'State universities from Uzbekistan and abroad: programmes, state-funded places and housing.' },
      buyers: { ru: 'Спрашивают про проходной балл, стоимость контракта, общежитие и диплом, который признают.', en: 'They ask about the entry score, the tuition fee, housing and whether the diploma is recognised.' },
      exhibitors: { ru: 'Держите на стенде приёмную комиссию с ответами, а не только буклет: вопросы решают выбор.', en: 'Staff the stand with an admissions officer, not just a booklet: answers decide the choice.' },
    },
    {
      slug: 'foreign-branches',
      title: { ru: 'Зарубежные вузы и филиалы', en: 'Foreign university branches' },
      lead: { ru: 'Филиалы зарубежных университетов в Узбекистане и кампусы за рубежом: программы и поступление.', en: 'Branches of foreign universities in Uzbekistan and campuses abroad: programmes and admission.' },
      buyers: { ru: 'Сравнивают язык обучения, стоимость, признание диплома и визу для студента.', en: 'They compare the language of instruction, tuition, diploma recognition and the student visa.' },
      exhibitors: { ru: 'Готовьте калькулятор стоимости и список документов: поступление за рубеж — это сроки.', en: 'Prepare a cost calculator and a document list: studying abroad is a matter of deadlines.' },
    },
    {
      slug: 'private-universities',
      title: { ru: 'Частные вузы и колледжи', en: 'Private universities and colleges' },
      lead: { ru: 'Частные университеты, колледжи и профессиональные школы: программы, цены, кампус.', en: 'Private universities, colleges and vocational schools: programmes, fees, campus life.' },
      buyers: { ru: 'Смотрят стоимость, есть ли рассрочка, кто преподаёт и куда устраиваются выпускники.', en: 'They look at tuition, whether instalments exist, who teaches and where graduates are hired.' },
      exhibitors: { ru: 'Покажите кампус, цифры трудоустройства и отзывы студентов: частное образование выбирают по результату.', en: 'Show the campus, employment figures and student feedback: private education is chosen on outcomes.' },
    },
    {
      slug: 'test-preparation',
      title: { ru: 'Подготовка IELTS, GMAT, SAT', en: 'IELTS, GMAT, SAT preparation' },
      lead: { ru: 'Подготовка к международным экзаменам: IELTS, GMAT, SAT и языковые тесты.', en: 'Preparation for international exams: IELTS, GMAT, SAT and language testing.' },
      buyers: { ru: 'Спрашивают про результат учеников, длительность курса, стоимость и пересдачу.', en: 'They ask about student results, course length, price and retake terms.' },
      exhibitors: { ru: 'Привозите статистику баллов и пробный урок: курсы выбирают по результату, а не по обещаниям.', en: 'Bring score statistics and a trial lesson: courses are chosen on results, not on promises.' },
    },
    {
      slug: 'scholarships-grants',
      title: { ru: 'Стипендии и гранты', en: 'Scholarships and grants' },
      lead: { ru: 'Стипендии, гранты и программы финансирования обучения в Узбекистане и за рубежом.', en: 'Scholarships, grants and study-funding programmes in Uzbekistan and abroad.' },
      buyers: { ru: 'Смотрят условия, сроки подачи, что покрывает грант и каков конкурс.', en: 'They look at the terms, deadlines, what the grant covers and how competitive it is.' },
      exhibitors: { ru: 'Готовьте чек-лист документов и календарь дедлайнов: грант проигрывают по срокам, а не по баллам.', en: 'Prepare a document checklist and a deadline calendar: grants are lost on deadlines, not on scores.' },
    },
    {
      slug: 'study-abroad-consultants',
      title: { ru: 'Консультанты по обучению за рубежом', en: 'Study-abroad consultants' },
      lead: { ru: 'Агентства и консультанты: подбор вуза, поступление, виза и адаптация.', en: 'Agencies and consultants: university choice, admission, visa and settling in.' },
      buyers: { ru: 'Спрашивают про опыт, список вузов-партнёров, стоимость услуг и что входит в сопровождение.', en: 'They ask about experience, partner universities, fees and what the support includes.' },
      exhibitors: { ru: 'Покажите кейсы поступлений и договор: в консультировании доверие важнее витрины.', en: 'Show admission cases and the contract: in consulting, trust outweighs the display.' },
    },
    {
      slug: 'online-edtech',
      title: { ru: 'Онлайн-платформы и EdTech', en: 'Online platforms and EdTech' },
      lead: { ru: 'Онлайн-курсы, платформы, школы программирования и цифровые учебники.', en: 'Online courses, platforms, coding schools and digital textbooks.' },
      buyers: { ru: 'Сравнивают программу, формат (живой или запись), стоимость и выдаваемый документ.', en: 'They compare the syllabus, the format (live or recorded), the price and what certificate is issued.' },
      exhibitors: { ru: 'Дайте пробный доступ на стенде: онлайн-продукт покупают после того, как его откроют.', en: 'Give trial access on the stand: an online product is bought after it has been opened.' },
    },
    {
      slug: 'language-centres',
      title: { ru: 'Языковые центры', en: 'Language centres' },
      lead: { ru: 'Языковые школы и центры: английский, русский, китайский, корейский и подготовка к экзаменам.', en: 'Language schools and centres: English, Russian, Chinese, Korean and exam preparation.' },
      buyers: { ru: 'Смотрят методику, уровень преподавателей, размер группы и результат за курс.', en: 'They look at the method, the teachers\' level, group size and the progress per course.' },
      exhibitors: { ru: 'Проведите мини-урок на стенде: язык продают, когда на нём заговорили.', en: 'Run a mini lesson on the stand: a language sells when the visitor has spoken it.' },
    },
  ],
};

/** Sections of one show, in the order they are listed on the overview page. */
export function sectionsOf(slug: string): SectionPage[] {
  return sectionPages[slug] ?? [];
}

export function sectionOf(slug: string, section: string): SectionPage | null {
  return sectionsOf(slug).find((s) => s.slug === section) ?? null;
}
