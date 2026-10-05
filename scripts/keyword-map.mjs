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
