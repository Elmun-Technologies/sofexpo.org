/**
 * Semantic core as data (docs/16-keyword-audit.md): one primary query per page and locale,
 * plus the secondary queries the same page must answer. Read by scripts/keyword-audit.mjs.
 *
 * A query is written for humans (`q`) and matched by stems (`s`): every stem must occur in the
 * field, in any order, so Russian and Uzbek case endings do not count as a miss. `a|b` inside
 * a stem means "either". Text is normalised first: lower case, ё→е, every Uzbek apostrophe
 * variant (‘ ’ ʻ ` ´) → '.
 *
 * Priority (`p`) is the commercial weight of the query, not a measured volume: A = money query
 * (a booking or a rental follows), B = a show / category query, C = an informational query.
 * Validate volumes in Yandex Wordstat and Google Keyword Planner before re-weighting.
 */
const k = (q, s, p = 'B') => ({ q, s, p });

export const keywordMap = {
  /* ------------------------------ centre ------------------------------ */
  '/': {
    ru: [k('выставочный центр Самарканд', ['выставочн', 'центр', 'самарканд'], 'A'), k('выставки в Самарканде', ['выстав', 'самарканд'], 'A'), k('выставки Узбекистан', ['выстав', 'узбекистан'], 'A'), k('экспоцентр Самарканд', ['экспоцентр', 'самарканд'])],
    en: [k('exhibition centre Samarkand', ['exhibition|expo', 'cent', 'samarkand'], 'A'), k('trade shows Uzbekistan', ['trade show|exhibition', 'uzbekistan'], 'A'), k('expo centre Samarkand', ['expo', 'samarkand'])],
    uz: [k("Samarqand ko'rgazma markazi", ["samarqand", "ko'rgazma|ekspomarkaz"], 'A'), k("ko'rgazmalar O'zbekiston", ["ko'rgazma", "o'zbekiston"], 'A')],
  },
  '/venue/': {
    ru: [k('выставочная площадка Самарканд', ['выставочн', 'площадк', 'самарканд'], 'A'), k('выставочный зал 4 400 м²', ['зал', '4 400'])],
    en: [k('exhibition venue Samarkand', ['exhibition', 'venue|centre', 'samarkand'], 'A'), k('exhibition halls', ['hall'])],
    uz: [k("ko'rgazma maydoni Samarqand", ["ko'rgazma", 'maydon|markaz'], 'A')],
  },
  '/venue/halls/': {
    ru: [k('залы выставочного центра', ['зал', 'самарканд|sof expo'], 'B'), k('вместимость зала', ['вместимост'])],
    en: [k('exhibition halls Samarkand', ['hall', 'samarkand|sof expo'], 'B'), k('hall capacity', ['capacity'])],
  },
  '/venue/tech-specs/': {
    ru: [k('технические характеристики выставочного зала', ['техническ', 'спецификац|характеристик'], 'C'), k('электричество 700 кВт', ['700'])],
    en: [k('venue technical data sheet', ['technical', 'sheet|specification'], 'C'), k('700 kW power', ['700'])],
  },
  '/venue/how-to-get-there/': {
    ru: [k('SOF EXPO Самарканд адрес как добраться', ['добрат', 'адрес'], 'B'), k('трансфер из аэропорта Самарканда', ['аэропорт'])],
    en: [k('how to get to SOF EXPO Samarkand', ['getting|get to', 'samarkand'], 'B'), k('Samarkand airport transfer', ['airport'])],
  },
  '/venue/services/': {
    ru: [k('услуги для экспонентов аренда оборудования', ['услуг', 'оборудован'], 'B')],
    en: [k('exhibition equipment rental', ['equipment', 'rental'], 'B')],
  },
  '/venue/gallery/': {
    ru: [k('фото выставочного центра', ['фото', 'выставочн'], 'C')],
    en: [k('exhibition centre photos', ['photo', 'samarkand|sof expo'], 'C')],
  },
  '/venue/virtual-tour/': {
    ru: [k('виртуальный тур SOF EXPO Самарканд', ['виртуальн', 'тур', 'samarkand|самарканд'], 'C')],
    en: [k('SOF EXPO Samarkand virtual tour', ['sof expo', 'samarkand', 'virtual', 'tour'], 'C')],
    uz: [k('SOF EXPO Samarqand virtual sayohat', ['sof expo', 'samarqand', 'virtual|360', 'sayohat|tur'], 'C')],
  },
  '/events/': {
    ru: [k('выставки в Самарканде 2026', ['выстав', 'самарканд', '2026'], 'A'), k('календарь выставок Узбекистан', ['календар|афиш', 'выстав'], 'A')],
    en: [k('exhibitions in Samarkand 2026', ['exhibition|trade show', 'samarkand', '2026'], 'A'), k('trade show calendar Uzbekistan', ['calendar|line-up', 'uzbekistan|samarkand'], 'A')],
    uz: [k("Samarqanddagi ko'rgazmalar 2026", ["samarqand", "ko'rgazma", '2026'], 'A')],
  },
  '/events/past/': {
    ru: [k('архив выставок итоги', ['архив', 'выставок'], 'C')],
    en: [k('exhibition archive results', ['archive', 'exhibition'], 'C')],
  },
  '/exhibitors/': {
    ru: [k('участие в выставке Самарканд', ['участи', 'выстав', 'самарканд|узбекистан'], 'A'), k('экспонентам', ['экспонент'])],
    en: [k('exhibit at a trade show in Uzbekistan', ['exhibit(?!ion)', 'uzbekistan|samarkand'], 'A'), k('exhibitor information', ['exhibitor'])],
    uz: [k("ko'rgazmada ishtirok etish", ["ko'rgazma", 'ishtirok'], 'A')],
  },
  '/exhibitors/packages/': {
    ru: [k('стоимость участия в выставке', ['участи', 'выстав', 'пакет|стоимост|ставк'], 'A')],
    en: [k('exhibition participation packages and rates', ['package', 'rate|price|cost'], 'A')],
  },
  '/exhibitors/stand-construction/': {
    ru: [k('строительство выставочных стендов Самарканд', ['стенд', 'строительств|застройк', 'самарканд'], 'A')],
    en: [k('exhibition stand construction Samarkand', ['stand', 'construction|build', 'samarkand'], 'A')],
  },
  '/exhibitors/floor-plan/': {
    ru: [k('план зала выставки место под стенд', ['план', 'стенд'], 'B')],
    en: [k('exhibition floor plan stand location', ['floor plan', 'stand'], 'B')],
  },
  '/exhibitors/documents/': {
    ru: [k('документы экспонента', ['документ', 'экспонент'], 'B')],
    en: [k('exhibitor documents', ['document', 'exhibitor'], 'B')],
  },
  '/exhibitors/faq/': {
    ru: [k('вопросы экспонента FAQ', ['экспонент', 'faq|вопрос'], 'C')],
    en: [k('exhibitor FAQ', ['exhibitor', 'faq|question'], 'C')],
  },
  '/exhibitors/services/': {
    ru: [k('сервисы для экспонентов', ['экспонент', 'сервис|услуг'], 'B')],
    en: [k('exhibitor services', ['exhibitor', 'service'], 'B')],
  },
  '/exhibitors/sponsorship/': {
    ru: [k('спонсорство выставки', ['спонсор', 'выстав'], 'B')],
    en: [k('exhibition sponsorship', ['sponsor', 'exhibition'], 'B')],
  },
  '/exhibitors/catalogue/': {
    ru: [k('каталог участников выставки', ['каталог', 'участник'], 'C')],
    en: [k('exhibitor catalogue', ['catalogue', 'exhibitor'], 'C')],
  },
  '/request-stand/': {
    ru: [k('забронировать стенд на выставке Самарканд', ['стенд', 'бронир|забронир', 'самарканд'], 'A'), k('заявка на участие в выставке', ['заявк'])],
    en: [k('book an exhibition stand Samarkand', ['book', 'stand', 'samarkand'], 'A'), k('exhibitor application', ['application|apply|request'])],
    uz: [k("ko'rgazmada stend band qilish", ['stend', 'band'], 'A')],
  },
  '/visitors/': {
    ru: [k('посетителям выставок Самарканд', ['посетител', 'выстав', 'самарканд|sof expo'], 'B'), k('билеты на выставку', ['билет'])],
    en: [k('visit a trade show in Samarkand', ['visitor', 'samarkand|sof expo'], 'B'), k('exhibition tickets', ['ticket'])],
  },
  '/visitors/tickets/': {
    ru: [k('билеты на выставку Самарканд', ['билет', 'выстав', 'самарканд'], 'A'), k('регистрация на выставку', ['регистрац'])],
    en: [k('exhibition tickets Samarkand', ['ticket', 'exhibition', 'samarkand'], 'A'), k('visitor registration', ['registration'])],
  },
  '/visitors/travel/': {
    ru: [k('как приехать на выставку в Самарканд', ['выстав', 'самарканд', 'отел|виз|проезд'], 'B')],
    en: [k('Samarkand hotels and visa for an exhibition', ['samarkand', 'hotel|visa'], 'B')],
  },
  '/visitors/programme/': {
    ru: [k('деловая программа выставки', ['деловая программ|деловой программ', 'выстав'], 'B')],
    en: [k('exhibition business programme', ['business programme', 'forum|session'], 'B')],
  },
  '/visitors/access/': {
    ru: [k('доступная среда на выставке', ['доступн', 'выстав'], 'C')],
    en: [k('exhibition accessibility', ['accessib'], 'C')],
  },
  '/organizers/': {
    ru: [k('аренда выставочного зала Самарканд', ['аренд', 'зал|площадк|экспоцентр', 'самарканд'], 'A'), k('площадка для мероприятия', ['площадк|мероприят|событ'])],
    en: [k('exhibition hall rental Samarkand', ['rent|hire', 'hall|venue', 'samarkand'], 'A'), k('event venue Samarkand', ['event', 'venue'])],
    uz: [k("Samarqandda ko'rgazma zali ijarasi", ['ijara', 'zal|maydon'], 'A')],
  },
  '/organizers/rates/': {
    ru: [k('стоимость аренды выставочного зала', ['аренд', 'зал', 'ставк|стоимост|цен'], 'A')],
    en: [k('exhibition hall rental rates', ['hall', 'rental|rent', 'rate|price'], 'A')],
  },
  '/organizers/conferences/': {
    ru: [k('конференц-зал в Самарканде', ['конференц', 'зал|форум', 'самарканд'], 'A')],
    en: [k('conference venue Samarkand', ['conference', 'venue|hall', 'samarkand'], 'A')],
  },
  '/organizers/checklist/': {
    ru: [k('чек-лист организатора мероприятия', ['чек-лист', 'организатор|событ|мероприят'], 'C')],
    en: [k('event organiser checklist', ['checklist', 'event|organi'], 'C')],
  },
  '/about/': {
    ru: [k('SOF EXPO Samarkand о компании', ['sof expo', 'компани|оператор'], 'C')],
    en: [k('about SOF EXPO Samarkand', ['sof expo', 'about|operator'], 'C')],
  },
  '/contacts/': {
    ru: [k('SOF EXPO контакты телефон', ['контакт', 'sof expo'], 'B')],
    en: [k('SOF EXPO contacts', ['contact', 'sof expo'], 'B')],
  },
  '/news/': {
    ru: [k('новости выставок Самарканд', ['новост', 'выстав'], 'C')],
    en: [k('exhibition news Samarkand', ['news', 'exhibition'], 'C')],
  },
  '/articles/': {
    ru: [k('статьи о выставках', ['выстав', 'рынк|аналитик'], 'C')],
    en: [k('trade show insights', ['exhibition|trade show', 'market|insight'], 'C')],
  },

  /* ------------------------------ shows ------------------------------ */
  '/events/foodera-expo/': {
    ru: [k('выставка продуктов питания Узбекистан 2026', ['выстав', 'продукт', 'самарканд|узбекистан'], 'A'), k('FOODERA EXPO 2026', ['foodera', '2026'], 'A'), k('выставка напитков', ['напит'])],
    en: [k('food exhibition Uzbekistan 2026', ['food', 'exhibition|expo', 'samarkand|uzbekistan'], 'A'), k('FOODERA EXPO 2026', ['foodera', '2026'], 'A'), k('food and beverage trade show', ['beverage|drink'])],
    uz: [k("oziq-ovqat ko'rgazmasi", ['oziq-ovqat', "ko'rgazma"], 'A')],
  },
  '/events/buildpro-expo/': {
    ru: [k('строительная выставка Узбекистан 2026', ['строительн', 'выстав', 'самарканд|узбекистан'], 'A'), k('BUILD PRO EXPO 2026', ['build ?pro', '2026'], 'A'), k('выставка строительных материалов', ['материал'])],
    en: [k('construction exhibition Uzbekistan 2026', ['construction|building', 'exhibition|expo', 'samarkand|uzbekistan'], 'A'), k('BUILD PRO EXPO 2026', ['build ?pro', '2026'], 'A'), k('building materials expo', ['material'])],
    uz: [k("qurilish ko'rgazmasi", ['qurilish', "ko'rgazma"], 'A')],
  },
  '/events/agropro-expo/': {
    ru: [k('сельскохозяйственная выставка Узбекистан 2027', ['агро|сельскохоз|сельхоз', 'выстав', 'самарканд|узбекистан'], 'A'), k('AGROPRO EXPO 2027', ['agropro', '2027'], 'A'), k('выставка сельхозтехники', ['техник'])],
    en: [k('agriculture exhibition Uzbekistan 2027', ['agri|agro', 'exhibition|expo', 'samarkand|uzbekistan'], 'A'), k('AGROPRO EXPO 2027', ['agropro', '2027'], 'A'), k('agricultural machinery show', ['machinery'])],
    uz: [k("qishloq xo'jaligi ko'rgazmasi", ["qishloq xo'jalig|agro", "ko'rgazma"], 'A')],
  },
  '/events/world-edu-expo/': {
    ru: [k('выставка образования Самарканд 2027', ['образован', 'выстав', 'самарканд|узбекистан'], 'A'), k('WORLD EDU EXPO 2027', ['world edu', '2027'], 'A'), k('обучение за рубежом', ['рубеж'])],
    en: [k('education fair Uzbekistan 2027', ['education', 'exhibition|fair|expo', 'samarkand|uzbekistan'], 'A'), k('WORLD EDU EXPO 2027', ['world edu', '2027'], 'A'), k('study abroad fair', ['abroad'])],
    uz: [k("ta'lim ko'rgazmasi", ["ta'lim", "ko'rgazma"], 'A')],
  },
  '/events/ecom-retail-expo/': {
    ru: [k('выставка e-commerce и ритейла Узбекистан', ['e-commerce|ecom|электронн', 'ритейл|retail', 'самарканд|узбекистан'], 'A'), k('ECOM & RETAIL EXPO 2027', ['ecom', '2027'], 'A'), k('маркетплейсы', ['маркетплейс'])],
    en: [k('e-commerce and retail expo Uzbekistan', ['e-commerce|ecom', 'retail', 'samarkand|uzbekistan'], 'A'), k('ECOM & RETAIL EXPO 2027', ['ecom', '2027'], 'A'), k('marketplaces', ['marketplace'])],
    uz: [k("elektron tijorat ko'rgazmasi", ['elektron tijorat|e-commerce', "ko'rgazma|forum"], 'A')],
  },
};

/* Global editions (docs/23): zh and tr are built from the EN page through the catalogs, so their
   targets check the translated title / h1 / description. A Chinese or Turkish buyer searches by
   country first («乌兹别克斯坦…展», «Özbekistan … fuarı»), then by city. */
const global = {
  '/': {
    zh: [k('撒马尔罕会展中心', ['撒马尔罕', '会展中心|展览中心'], 'A'), k('乌兹别克斯坦展会', ['乌兹别克斯坦', '展会|博览会'], 'A')],
    tr: [k('Semerkant fuar merkezi', ['semerkant', 'fuar merkez'], 'A'), k("Özbekistan fuarları", ['özbekistan', 'fuar'], 'A')],
  },
  '/events/': {
    zh: [k('撒马尔罕展会 2026', ['撒马尔罕', '展会', '2026'], 'B'), k('展会日历', ['展会日历'])],
    tr: [k("Semerkant'ta fuarlar 2026", ['semerkant', 'fuar', '2026'], 'B'), k('fuar takvimi', ['fuar takvim'])],
  },
  '/venue/': {
    zh: [k('撒马尔罕展览场馆', ['撒马尔罕', '展览场馆|展馆'], 'B')],
    tr: [k("Semerkant fuar mekânı", ['semerkant', 'fuar (mekân|alan|salon)'], 'B')],
  },
  '/organizers/': {
    zh: [k('撒马尔罕展厅租赁', ['撒马尔罕', '展厅', '租赁|租用'], 'B')],
    tr: [k('Semerkant fuar salonu kiralama', ['semerkant', 'salon', 'kirala'], 'B')],
  },
  '/exhibitors/': {
    zh: [k('乌兹别克斯坦参展', ['乌兹别克斯坦', '参展'], 'B')],
    tr: [k("Özbekistan'da fuara katılım", ['özbekistan', 'fuar', 'katıl'], 'B')],
  },
  '/request-stand/': {
    zh: [k('预订展位', ['预订', '展位'], 'B')],
    tr: [k('stand rezervasyonu', ['stan(d|t)', 'rezervasyon|ayırt'], 'B')],
  },
  '/events/foodera-expo/': {
    zh: [k('乌兹别克斯坦食品展', ['食品', '展', '乌兹别克斯坦|撒马尔罕'], 'A'), k('FOODERA EXPO 2026', ['foodera', '2026'])],
    tr: [k('Özbekistan gıda fuarı', ['gıda|yiyecek', 'fuar', 'özbekistan|semerkant'], 'A'), k('FOODERA EXPO 2026', ['foodera', '2026'])],
  },
  '/events/buildpro-expo/': {
    zh: [k('乌兹别克斯坦建材展', ['建筑|建材', '展', '乌兹别克斯坦|撒马尔罕'], 'A'), k('BUILD PRO EXPO 2026', ['build ?pro', '2026'])],
    tr: [k('Özbekistan inşaat fuarı', ['inşaat|yapı', 'fuar', 'özbekistan|semerkant'], 'A'), k('BUILD PRO EXPO 2026', ['build ?pro', '2026'])],
  },
  '/events/agropro-expo/': {
    zh: [k('乌兹别克斯坦农业展', ['农业', '展', '乌兹别克斯坦|撒马尔罕'], 'A'), k('AGROPRO EXPO 2027', ['agropro', '2027'])],
    tr: [k('Özbekistan tarım fuarı', ['tarım', 'fuar', 'özbekistan|semerkant'], 'A'), k('AGROPRO EXPO 2027', ['agropro', '2027'])],
  },
  '/events/world-edu-expo/': {
    zh: [k('乌兹别克斯坦教育展', ['教育|留学', '展', '乌兹别克斯坦|撒马尔罕'], 'A'), k('WORLD EDU EXPO 2027', ['world edu', '2027'])],
    tr: [k('Özbekistan eğitim fuarı', ['eğitim', 'fuar', 'özbekistan|semerkant'], 'A'), k('WORLD EDU EXPO 2027', ['world edu', '2027'])],
  },
  '/events/ecom-retail-expo/': {
    zh: [k('乌兹别克斯坦电商展', ['电商|电子商务', '乌兹别克斯坦|撒马尔罕'], 'A'), k('ECOM & RETAIL EXPO 2027', ['ecom', '2027'])],
    tr: [k('Özbekistan e-ticaret fuarı', ['e-ticaret', 'fuar|forum', 'özbekistan|semerkant'], 'A'), k('ECOM & RETAIL EXPO 2027', ['ecom', '2027'])],
  },
};
for (const [path, locales] of Object.entries(global)) Object.assign((keywordMap[path] ??= {}), locales);

/* Insight long-reads (docs/23): one informational query per article, in all five languages. */
const insights = {
  'uzbekistan-market-entry-trade-shows': {
    ru: [k('выход на рынок Узбекистана', ['выход', 'рын', 'узбекистан'], 'C')],
    en: [k('Uzbekistan market entry', ['uzbekistan', 'market entry'], 'C')],
    uz: [k("O'zbekiston bozoriga kirish", ["o'zbekiston", 'bozor', 'kirish'], 'C')],
    zh: [k('进入乌兹别克斯坦市场', ['进入', '乌兹别克斯坦', '市场'], 'C')],
    tr: [k('Özbekistan pazarına giriş', ['özbekistan', 'pazar', 'giriş'], 'C')],
  },
  'exhibiting-in-uzbekistan-foreign-company': {
    ru: [k('участие в выставке в Узбекистане', ['участи', 'выставк', 'узбекистан'], 'C')],
    en: [k('exhibiting in Uzbekistan', ['exhibiting', 'uzbekistan'], 'C')],
    uz: [k("O'zbekistonda ko'rgazmada ishtirok", ["o'zbekiston", "ko'rgazma", 'ishtirok'], 'C')],
    zh: [k('在乌兹别克斯坦参展', ['乌兹别克斯坦', '参展'], 'C')],
    tr: [k("Özbekistan'da fuara katılım", ['özbekistan', 'fuar', 'katıl'], 'C')],
  },
  'food-export-to-uzbekistan-halal-labelling': {
    ru: [k('экспорт продуктов питания в Узбекистан', ['экспорт', 'продукт', 'узбекистан'], 'C'), k('халяль сертификация', ['халяль'])],
    en: [k('food export to Uzbekistan', ['food', 'export', 'uzbekistan'], 'C'), k('halal certification Uzbekistan', ['halal'])],
    uz: [k("O'zbekistonga oziq-ovqat eksporti", ['oziq-ovqat', 'eksport', "o'zbekiston"], 'C')],
    zh: [k('向乌兹别克斯坦出口食品', ['出口', '食品', '乌兹别克斯坦'], 'C')],
    tr: [k("Özbekistan'a gıda ihracatı", ['gıda', 'ihracat', 'özbekistan'], 'C')],
  },
  'selling-on-uzbekistan-marketplaces': {
    ru: [k('продажи на маркетплейсах Узбекистана', ['продаж', 'маркетплейс', 'узбекистан'], 'C'), k('Uzum Market для продавцов', ['uzum'])],
    en: [k('selling on marketplaces in Uzbekistan', ['selling', 'marketplace', 'uzbekistan'], 'C'), k('Uzum Market sellers', ['uzum'])],
    uz: [k("O'zbekiston marketpleyslarida sotish", ['marketpleys', 'sot', "o'zbekiston"], 'C')],
    zh: [k('在乌兹别克斯坦电商平台销售', ['电商|平台', '销售', '乌兹别克斯坦'], 'C')],
    tr: [k('Özbekistan pazaryerlerinde satış', ['pazaryer', 'satış', 'özbekistan'], 'C')],
  },
  'agriculture-in-uzbekistan-greenhouses-irrigation': {
    ru: [k('сельское хозяйство Узбекистана', ['сельск', 'хозяйств', 'узбекистан'], 'C'), k('капельное орошение', ['капельн'])],
    en: [k('agriculture in Uzbekistan', ['agriculture', 'uzbekistan'], 'C'), k('drip irrigation Uzbekistan', ['drip'])],
    uz: [k("O'zbekiston qishloq xo'jaligi", ["qishloq xo'jalig", "o'zbekiston"], 'C')],
    zh: [k('乌兹别克斯坦农业', ['乌兹别克斯坦', '农业'], 'C')],
    tr: [k('Özbekistan tarımı', ['özbekistan', 'tarım'], 'C')],
  },
  'construction-market-uzbekistan-building-materials': {
    ru: [k('строительный рынок Узбекистана', ['строительн', 'рын', 'узбекистан'], 'C'), k('стройматериалы', ['стройматериал|строительн\\S* материал'])],
    en: [k('construction market in Uzbekistan', ['construction', 'market', 'uzbekistan'], 'C'), k('building materials', ['building material'])],
    uz: [k("O'zbekiston qurilish bozori", ['qurilish', 'bozor', "o'zbekiston"], 'C')],
    zh: [k('乌兹别克斯坦建筑市场', ['乌兹别克斯坦', '建筑|建材', '市场'], 'C')],
    tr: [k('Özbekistan inşaat pazarı', ['özbekistan', 'inşaat', 'pazar'], 'C')],
  },
  'study-abroad-from-uzbekistan-guide': {
    ru: [k('обучение за рубежом из Узбекистана', ['обучени', 'рубеж', 'узбекистан'], 'C')],
    en: [k('study abroad from Uzbekistan', ['study abroad', 'uzbekistan'], 'C')],
    uz: [k("chet elda o'qish", ['chet el', "o'qish|ta'lim"], 'C')],
    zh: [k('乌兹别克斯坦出国留学', ['留学', '乌兹别克斯坦'], 'C')],
    tr: [k("Özbekistan'dan yurt dışında eğitim", ['yurt dışı', 'eğitim', 'özbekistan'], 'C')],
  },
  'car-show-samarkand-promotors-guide': {
    ru: [k('автошоу в Самарканде', ['автошоу', 'самарканд'], 'C')],
    en: [k('car show in Samarkand', ['car show', 'samarkand'], 'C')],
    uz: [k('Samarqandda avtoshou', ['avtoshou|avto shou', 'samarqand'], 'C')],
    zh: [k('撒马尔罕车展', ['撒马尔罕', '车展|汽车'], 'C')],
    tr: [k('Semerkant otomobil şovu', ['semerkant', 'otomobil|araba'], 'C')],
  },
  'business-trip-to-samarkand-guide': {
    ru: [k('командировка в Самарканд', ['командировк', 'самарканд'], 'C'), k('как добраться до Самарканда', ['добрат'])],
    en: [k('business trip to Samarkand', ['business trip', 'samarkand'], 'C'), k('how to get to Samarkand', ['get to|getting'])],
    uz: [k('Samarqandga xizmat safari', ['samarqand', 'safar'], 'C')],
    zh: [k('撒马尔罕商务出行', ['撒马尔罕', '商务'], 'C')],
    tr: [k('Semerkant iş seyahati', ['semerkant', 'iş seyahat'], 'C')],
  },
  'how-to-organize-an-exhibition-in-uzbekistan': {
    ru: [k('организовать выставку в Узбекистане', ['организ', 'выставк', 'узбекистан'], 'C')],
    en: [k('organize an exhibition in Uzbekistan', ['organi[sz]e', 'exhibition', 'uzbekistan'], 'C')],
    uz: [k("O'zbekistonda ko'rgazma tashkil qilish", ["ko'rgazma", 'tashkil', "o'zbekiston"], 'C')],
    zh: [k('在乌兹别克斯坦举办展览', ['举办', '展', '乌兹别克斯坦'], 'C')],
    tr: [k("Özbekistan'da fuar düzenlemek", ['özbekistan', 'fuar', 'düzenle'], 'C')],
  },
};
for (const [slug, locales] of Object.entries(insights)) keywordMap[`/articles/${slug}/`] = locales;

/* Cluster sub-pages: the show name plus the page's job. */
const showWord = { 'foodera-expo': 'foodera', 'buildpro-expo': 'build ?pro', 'agropro-expo': 'agropro', 'world-edu-expo': 'world edu', 'ecom-retail-expo': 'ecom' };
for (const [slug, brand] of Object.entries(showWord)) {
  keywordMap[`/events/${slug}/exhibitors/`] ??= {
    ru: [k('участие в выставке', [brand, 'участи|экспонент|стенд|пакет|метраж'], 'A')],
    en: [k('exhibiting at the show', [brand, 'exhibit|stand|package|space'], 'A')],
  };
  keywordMap[`/events/${slug}/visitors/`] ??= {
    ru: [k('посетителям выставки', [brand, 'посетител|вход|регистрац|абитуриент|хозяйств'], 'B')],
    en: [k('visiting the show', [brand, 'visitor|entry|registration|applicant|farm'], 'B')],
  };
  keywordMap[`/events/${slug}/program/`] ??= {
    ru: [k('программа выставки', [brand, 'программ'], 'B')],
    en: [k('show programme', [brand, 'programme|program'], 'B')],
  };
}

/** Section (segment) pages are generated from their h1: «<segment> exhibition» + the show. */
export const sectionRule = {
  ru: (segment) => [k(`выставка «${segment}»`, [stemOf(segment, 'ru'), 'выстав'], 'B')],
  en: (segment) => [k(`${segment} exhibition`, [stemOf(segment, 'en'), 'exhibition|expo|trade show'], 'B')],
};
export function stemOf(phrase, locale) {
  const w = normalize(phrase).split(/[\s,]+/).find((x) => x.length > 3) ?? normalize(phrase);
  if (locale === 'ru') return w.length > 6 ? w.slice(0, w.length - 3) : w.slice(0, Math.max(4, w.length - 1));
  return w.replace(/(ies|es|s)$/, '');
}
export function normalize(s) {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/[‘’ʻ`´]/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
}
