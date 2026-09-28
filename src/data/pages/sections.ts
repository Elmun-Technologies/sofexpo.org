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
};

/** Sections of one show, in the order they are listed on the overview page. */
export function sectionsOf(slug: string): SectionPage[] {
  return sectionPages[slug] ?? [];
}

export function sectionOf(slug: string, section: string): SectionPage | null {
  return sectionsOf(slug).find((s) => s.slug === section) ?? null;
}
