/**
 * The business-programme speakers of E-COM & RETAIL EXPO SAMARKAND.
 *
 * The client delivered 37 finished poster artboards in two series — the dark "Biz Network"
 * set for the 30 April – 1 May edition and the teal set for 20–21 May 2025. The names, roles
 * and companies below are transcribed from those posters; `card` points at the build output
 * of `scripts/build-photos.mjs` (public/images/speakers/speaker-NN.jpg + a 400/800 WebP pair).
 *
 * This is the one place a speaker is described. The programme page renders it, and when the
 * next edition's posters land the array is replaced without touching any layout.
 */
export interface Speaker {
  /** speaker-01 … speaker-37, matching public/images/speakers/ */
  card: string;
  name: { ru: string; en: string };
  role: { ru: string; en: string };
  org?: string;
  /** which poster series the card belongs to — the two editions of the forum */
  edition: 'apr' | 'may';
}

export const speakers: Speaker[] = [
  /* ── 30 April – 1 May: the "Biz Network" series ───────────────────────── */
  {
    card: 'speaker-17',
    name: { ru: 'Шерзод Бекназаров', en: 'Sherzod Beknazarov' },
    role: { ru: 'Серийный предприниматель, основатель брендов YSK и ALVON', en: 'Serial entrepreneur, founder of YSK and ALVON' },
    edition: 'apr',
  },
  {
    card: 'speaker-18',
    name: { ru: 'Эльмира Обри', en: 'Elmira Obri' },
    role: { ru: 'Генеральный директор', en: 'Chief executive officer' },
    org: 'Most Business Intelligence',
    edition: 'apr',
  },
  {
    card: 'speaker-19',
    name: { ru: 'Зафар Вахидов', en: 'Zafar Vakhidov' },
    role: { ru: 'Основатель юридической фирмы', en: 'Founder of the law firm' },
    org: 'Vakhidov & Partners',
    edition: 'apr',
  },
  {
    card: 'speaker-20',
    name: { ru: 'Азиз Ахраров', en: 'Aziz Akhrarov' },
    role: { ru: 'Руководитель проектов TAGROUP, генеральный директор Buka Sportswear, EL-MEROSI', en: 'Head of projects at TAGROUP, CEO of Buka Sportswear, EL-MEROSI' },
    org: 'shorttextile.uz · yukber.uz',
    edition: 'apr',
  },
  {
    card: 'speaker-21',
    name: { ru: 'Шерзод Мирходжаев', en: 'Sherzod Mirkhodjaev' },
    role: { ru: 'Основатель компаний Online E-commerce, Perfecto · топ-селлер Uzum Market', en: 'Founder of Online E-commerce and Perfecto · top Uzum Market seller' },
    org: 'Ideal Textile Product',
    edition: 'apr',
  },
  {
    card: 'speaker-22',
    name: { ru: 'Яна Понятова', en: 'Yana Ponyatova' },
    role: { ru: 'Маркетинговое агентство', en: 'Marketing agency' },
    org: 'Jedy Media',
    edition: 'apr',
  },
  {
    card: 'speaker-01',
    name: { ru: 'Рустам Хамдамов', en: 'Rustam Khamdamov' },
    role: { ru: 'CEO и сооснователь', en: 'CEO and co-founder' },
    org: 'Billz',
    edition: 'apr',
  },
  {
    card: 'speaker-02',
    name: { ru: 'Сайёд Баротов', en: 'Sayyod Barotov' },
    role: { ru: 'Эксперт-глава Alif Nasiya (BNPL), Alif Shop (маркетплейс)', en: 'Head of Alif Nasiya (BNPL) and Alif Shop marketplace' },
    org: 'Alif Uzbekistan',
    edition: 'apr',
  },
  {
    card: 'speaker-03',
    name: { ru: 'Екатерина Рашидова', en: 'Ekaterina Rashidova' },
    role: { ru: 'Сооснователь Ассоциации селлеров Узбекистана', en: 'Co-founder of the Uzbekistan Sellers Association' },
    edition: 'apr',
  },
  {
    card: 'speaker-04',
    name: { ru: 'Александр Капер', en: 'Alexander Kaper' },
    role: { ru: 'Менеджер франчайзинговой и локальной сети EasyBooking в Узбекистане', en: 'Franchise and local network manager, EasyBooking Uzbekistan' },
    edition: 'apr',
  },
  {
    card: 'speaker-05',
    name: { ru: 'Азамат Хамидов', en: 'Azamat Khamidov' },
    role: { ru: 'Генеральный директор', en: 'Chief executive officer' },
    org: 'Pointai',
    edition: 'apr',
  },
  {
    card: 'speaker-06',
    name: { ru: 'Юрий Андрюшков', en: 'Yuriy Andryushkov' },
    role: { ru: 'Руководитель', en: 'Head of' },
    org: 'Alif Shop',
    edition: 'apr',
  },
  {
    card: 'speaker-07',
    name: { ru: 'Аброр Холов', en: 'Abror Kholov' },
    role: { ru: 'Chief Business Development Officer и сооснователь', en: 'Chief Business Development Officer and co-founder' },
    org: 'WYZO',
    edition: 'apr',
  },
  {
    card: 'speaker-08',
    name: { ru: 'Тимур Рашидов', en: 'Timur Rashidov' },
    role: { ru: 'Председатель Ассоциации селлеров в Узбекистане', en: 'Chairman of the Sellers Association of Uzbekistan' },
    edition: 'apr',
  },
  {
    card: 'speaker-09',
    name: { ru: 'Дилдора Турсунова', en: 'Dildora Tursunova' },
    role: { ru: 'Директор по стратегическому развитию, основатель IT-академии Ustudy', en: 'Strategy director, founder of the Ustudy IT academy' },
    edition: 'apr',
  },
  {
    card: 'speaker-10',
    name: { ru: 'Владимир Денисов', en: 'Vladimir Denisov' },
    role: { ru: 'Сооснователь apicore.kz и optimage.pro, CEO iLab', en: 'Co-founder of apicore.kz and optimage.pro, CEO of iLab' },
    edition: 'apr',
  },
  {
    card: 'speaker-11',
    name: { ru: 'Даврон Адылходжаев', en: 'Davron Adylkhodjaev' },
    role: { ru: 'CIO / CTO', en: 'CIO / CTO' },
    org: 'TBC Bank Uzbekistan',
    edition: 'apr',
  },
  {
    card: 'speaker-12',
    name: { ru: 'Бобур Ражабов', en: 'Bobur Rajabov' },
    role: { ru: 'Сооснователь и генеральный директор', en: 'Co-founder and chief executive' },
    org: 'Everbestlab',
    edition: 'apr',
  },
  {
    card: 'speaker-13',
    name: { ru: 'Назокат Рашидова', en: 'Nazokat Rashidova' },
    role: { ru: 'Генеральный директор', en: 'Chief executive officer' },
    org: 'Freedom Pay Uzbekistan',
    edition: 'apr',
  },
  {
    card: 'speaker-14',
    name: { ru: 'Нафосатхон Тожибоева', en: 'Nafosatkhon Tojiboeva' },
    role: { ru: 'CEO международного креативного медиа-агентства MPA, основатель и продюсер проекта «Brand by MPA»', en: 'CEO of the MPA creative media agency, founder and producer of “Brand by MPA”' },
    edition: 'apr',
  },
  {
    card: 'speaker-15',
    name: { ru: 'Азамат Шаикалиев', en: 'Azamat Shaikaliev' },
    role: { ru: 'CBDO', en: 'CBDO' },
    org: 'Zood Uzbekistan · экс-Caspi',
    edition: 'apr',
  },
  {
    card: 'speaker-16',
    name: { ru: 'Камшат Кемельбаева', en: 'Kamshat Kemelbaeva' },
    role: { ru: 'Основатель образовательной компании Ograf, основатель по медицинскому туризму Beyong-Won', en: 'Founder of the Ograf education company and of Beyong-Won medical tourism' },
    edition: 'apr',
  },

  /* ── 20–21 May 2025: the teal series ──────────────────────────────────── */
  {
    card: 'speaker-33',
    name: { ru: 'Ильшат Хаметов', en: 'Ilshat Khametov' },
    role: { ru: 'Генеральный директор', en: 'Chief executive officer' },
    org: 'Uzum Market',
    edition: 'may',
  },
  {
    card: 'speaker-34',
    name: { ru: 'Григорий Тюхтиков', en: 'Grigoriy Tyukhtikov' },
    role: { ru: 'Руководитель департамента привлечения мерчантов', en: 'Head of merchant acquisition' },
    org: 'Uzum Market',
    edition: 'may',
  },
  {
    card: 'speaker-35',
    name: { ru: 'Лоик Раурзода', en: 'Loik Raurzoda' },
    role: { ru: 'Дизайнер, селлер, представитель малого бизнеса', en: 'Designer, seller, small-business representative' },
    edition: 'may',
  },
  {
    card: 'speaker-36',
    name: { ru: 'Татьяна Фоминова и Дмитрий Леснев', en: 'Tatyana Fominova and Dmitry Lesnev' },
    role: { ru: 'Топ-селлеры на Uzum Market, магазины In Touch и «Умный дом»', en: 'Top Uzum Market sellers — the In Touch and Smart Home stores' },
    edition: 'may',
  },
  {
    card: 'speaker-37',
    name: { ru: 'Никита Шмелёв', en: 'Nikita Shmelev' },
    role: { ru: 'Работа с матрицей больше 5000 SKU: команда и коммуникация в успехе бизнеса', en: 'Running a 5,000+ SKU matrix: team and communication behind the business' },
    edition: 'may',
  },
  {
    card: 'speaker-23',
    name: { ru: 'Алексей Марук', en: 'Alexey Maruk' },
    role: { ru: 'Руководитель направления FBS и DBS', en: 'Head of FBS and DBS' },
    org: 'Uzum Market',
    edition: 'may',
  },
  {
    card: 'speaker-24',
    name: { ru: 'Анастасия Кретова', en: 'Anastasia Kretova' },
    role: { ru: 'Руководитель направления FBS и DBS', en: 'Head of FBS and DBS' },
    org: 'Uzum Market',
    edition: 'may',
  },
  {
    card: 'speaker-25',
    name: { ru: 'Екатерина Рашидова', en: 'Ekaterina Rashidova' },
    role: { ru: 'Основатель агентства «ER» продаж на маркетплейсах, сооснователь Ассоциации селлеров', en: 'Founder of the “ER” marketplace sales agency, co-founder of the Sellers Association' },
    edition: 'may',
  },
  {
    card: 'speaker-26',
    name: { ru: 'Шохсанам Хуррамова', en: 'Shokhsanam Khurramova' },
    role: { ru: 'Контент-маркетолог сервиса «МойСклад»', en: 'Content marketer at MoySklad' },
    edition: 'may',
  },
  {
    card: 'speaker-27',
    name: { ru: 'Дмитрий Коврижко', en: 'Dmitry Kovrizhko' },
    role: { ru: 'Основатель аналитического сервиса ZoomSelling', en: 'Founder of the ZoomSelling analytics service' },
    edition: 'may',
  },
  {
    card: 'speaker-28',
    name: { ru: 'Леонид Ким', en: 'Leonid Kim' },
    role: { ru: 'Селлер Uzum Market: оборот 1,2 млрд+ сум, продажа шлемов по миру на $2 млн', en: 'Uzum Market seller: UZS 1.2 bn+ turnover, $2 m in helmet sales worldwide' },
    edition: 'may',
  },
  {
    card: 'speaker-29',
    name: { ru: 'Шерзод Мирходжаев', en: 'Sherzod Mirkhodjaev' },
    role: { ru: 'Топ-селлер Uzum Market, основатель группы компаний Ideal Textile Product, Perfecto, Online E-commerce', en: 'Top Uzum Market seller, founder of Ideal Textile Product, Perfecto and Online E-commerce' },
    edition: 'may',
  },
  {
    card: 'speaker-30',
    name: { ru: 'Темур Рашидов', en: 'Temur Rashidov' },
    role: { ru: 'Владелец фулфилмента Sell Sklad (1500 кв. м), сооснователь Ассоциации селлеров', en: 'Owner of the 1,500 m² Sell Sklad fulfilment centre, co-founder of the Sellers Association' },
    edition: 'may',
  },
  {
    card: 'speaker-31',
    name: { ru: 'Абдували Абдукаюмов', en: 'Abduvali Abdukayumov' },
    role: { ru: 'Селлер с опытом продаж более 10 лет: eBay, Shopify, Etsy', en: 'Seller with 10+ years on eBay, Shopify and Etsy' },
    edition: 'may',
  },
  {
    card: 'speaker-32',
    name: { ru: 'Роман Ким', en: 'Roman Kim' },
    role: { ru: 'Предприниматель, сооснователь клуба и Ассоциации селлеров', en: 'Entrepreneur, co-founder of the sellers club and Association' },
    edition: 'may',
  },
];

export const speakersByEdition = (edition: Speaker['edition']) =>
  speakers.filter((s) => s.edition === edition);
