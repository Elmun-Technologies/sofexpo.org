/**
 * Conversion system config — CTA, popups, livechat, contact hold
 * Single source of truth for all lead capture mechanics
 */

export const conversionConfig = {
  contacts: {
    phone: '+998557050705',
    phoneDisplay: '+998 55 705 0 705',
    phoneManager: '+998883990705',
    telegramManager: 'https://t.me/sofexpomgr',
    telegramChannel: 'https://t.me/sofexpo',
    whatsapp: 'https://wa.me/998557050705',
    whatsappManager: 'https://wa.me/998883990705',
    email: 'info@sofexpo.org',
    emailAlt: 'info@sofexpo.uz',
  },

  // LiveChat widget config
  liveChat: {
    enabled: true,
    position: 'bottom-right' as const,
    // working hours Asia/Samarkand UTC+5
    workingHours: {
      start: 9,
      end: 18,
      timezone: 'Asia/Samarkand',
      workDays: [1, 2, 3, 4, 5], // Mon-Fri
    },
    // quick replies per locale
    quickReplies: {
      ru: [
        'Забронировать стенд',
        'Узнать стоимость',
        'Получить каталог',
        'Как добраться?',
      ],
      en: [
        'Book a stand',
        'Get pricing',
        'Download catalogue',
        'How to get there?',
      ],
    },
  },

  // CTA placements — ideal positions per page type
  ctaPlacements: {
    header: {
      priority: 1,
      label: { ru: 'Забронировать стенд', en: 'Book a stand' },
      href: '/request-stand/',
      style: 'primary',
      showOn: ['all'],
    },
    hero: {
      priority: 2,
      label: { ru: 'Стать экспонентом', en: 'Become exhibitor' },
      secondary: { ru: 'Получить билет', en: 'Get ticket' },
      showOn: ['home', 'events', 'event'],
    },
    inline: {
      priority: 3,
      trigger: 'after-2-blocks',
      showOn: ['exhibitors', 'venue', 'organizers'],
    },
    stickyMobile: {
      priority: 4,
      enabled: true,
      showOnScroll: 300, // px
      hideOnFormVisible: true,
    },
    sidebar: {
      priority: 5,
      enabled: true,
      showOn: ['exhibitors', 'visitors', 'organizers', 'event'],
    },
    exitIntent: {
      priority: 6,
      enabled: true,
    },
    footerBand: {
      priority: 7,
      enabled: true,
    },
  },

  // Popup strategies
  popups: {
    // Global frequency capping
    capping: {
      sessionLimit: 2,
      dailyLimit: 3,
      minIntervalMinutes: 5,
      storageKey: 'sofexpo.popups',
    },

    strategies: [
      {
        id: 'welcome-new',
        name: { ru: 'Приветствие нового посетителя', en: 'New visitor welcome' },
        trigger: 'time',
        delay: 15000, // 15s
        condition: 'first-visit',
        template: 'welcome',
        cta: { ru: 'Подобрать формат участия', en: 'Find participation format' },
        frequency: 'once-per-session',
        pages: ['home', 'events'],
        enabled: true,
      },
      {
        id: 'exit-intent',
        name: { ru: 'Удержание при выходе', en: 'Exit intent hold' },
        trigger: 'exit-intent',
        template: 'contact-hold',
        headline: {
          ru: 'Подождите! Не теряйте контакт',
          en: "Wait! Don't lose contact",
        },
        text: {
          ru: 'Оставьте контакт в удобном мессенджере — пришлём каталог и расчёт за 15 минут',
          en: 'Leave your contact in messenger — we’ll send catalogue and quote in 15 min',
        },
        frequency: 'once-per-day',
        enabled: true,
      },
      {
        id: 'scroll-50-catalog',
        name: { ru: 'Каталог на 50% скролла', en: 'Catalog at 50% scroll' },
        trigger: 'scroll',
        scrollPercent: 50,
        template: 'lead-magnet',
        magnet: 'catalog',
        frequency: 'once-per-session',
        pages: ['exhibitors', 'event'],
        enabled: true,
      },
      {
        id: 'pricing-interest',
        name: { ru: 'Интерес к ценам', en: 'Pricing interest' },
        trigger: 'time-on-page',
        delay: 45000,
        condition: 'on-pricing-page',
        template: 'callback',
        headline: {
          ru: 'Рассчитаем стоимость за 15 минут',
          en: 'We’ll calculate cost in 15 minutes',
        },
        frequency: 'once-per-session',
        pages: ['exhibitors/packages', 'organizers/rates'],
        enabled: true,
      },
      {
        id: 'form-abandon',
        name: { ru: 'Брошенная форма', en: 'Abandoned form' },
        trigger: 'form-abandon',
        delay: 10000,
        template: 'contact-hold-mini',
        frequency: 'once-per-session',
        enabled: true,
      },
      {
        id: 'tg-whatsapp-hold',
        name: { ru: 'TG/WhatsApp удержание', en: 'TG/WhatsApp hold' },
        trigger: 'scroll',
        scrollPercent: 75,
        template: 'messengers',
        frequency: 'once-per-day',
        enabled: true,
      },
    ],
  },

  // Contact hold channels — per locale
  channels: {
    ru: [
      {
        id: 'telegram',
        name: 'Telegram',
        icon: 'telegram',
        href: 'https://t.me/sofexpomgr',
        color: '#229ED9',
        label: 'Написать в Telegram',
        prefill: 'Здравствуйте! Интересует участие в выставке SOF EXPO',
        primary: true,
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: 'whatsapp',
        href: 'https://wa.me/998557050705',
        color: '#25D366',
        label: 'Написать в WhatsApp',
        prefill: 'Здравствуйте! Интересует участие в SOF EXPO',
        primary: true,
      },
      {
        id: 'phone',
        name: 'Телефон',
        icon: 'phone',
        href: 'tel:+998557050705',
        color: '#0d2a1b',
        label: '+998 55 705 0 705',
        prefill: '',
        primary: false,
      },
    ],
    en: [
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: 'whatsapp',
        href: 'https://wa.me/998557050705',
        color: '#25D366',
        label: 'Chat on WhatsApp',
        prefill: 'Hello! Interested in exhibiting at SOF EXPO',
        primary: true,
      },
      {
        id: 'telegram',
        name: 'Telegram',
        icon: 'telegram',
        href: 'https://t.me/sofexpomgr',
        color: '#229ED9',
        label: 'Chat on Telegram',
        prefill: 'Hello! Interested in SOF EXPO exhibition',
        primary: true,
      },
      {
        id: 'email',
        name: 'Email',
        icon: 'mail',
        href: 'mailto:info@sofexpo.org',
        color: '#0d2a1b',
        label: 'info@sofexpo.org',
        prefill: '',
        primary: false,
      },
    ],
  },

  // Individual forms — each intent separate
  forms: {
    exhibitor: {
      id: 'exhibitor-form',
      title: { ru: 'Заявка на стенд', en: 'Stand booking request' },
      subtitle: {
        ru: '30 секунд, без оплаты сейчас. Расчёт и план зала за 15 минут.',
        en: '30 sec, no payment now. Floor plan and quote in 15 min.',
      },
      fields: ['name', 'company', 'phone', 'email', 'direction', 'area', 'event', 'comment'],
      required: ['name', 'company', 'phone', 'direction'],
      endpoint: '/api/lead?type=exhibitor',
      successMessage: {
        ru: 'Заявка принята! Менеджер пришлёт план зала и расчёт в течение 15 минут.',
        en: 'Request received! Manager will send floor plan and quote within 15 min.',
      },
      leadMagnet: 'catalog',
    },
    visitor: {
      id: 'visitor-form',
      title: { ru: 'Получить билет', en: 'Get ticket' },
      subtitle: {
        ru: 'Бесплатно для профильных специалистов. Билет на почту за 2 минуты.',
        en: 'Free for trade visitors. Ticket to email in 2 minutes.',
      },
      fields: ['name', 'company', 'position', 'phone', 'email', 'event', 'promo'],
      required: ['name', 'phone', 'email'],
      endpoint: '/api/lead?type=visitor',
      successMessage: {
        ru: 'Билет отправлен на почту! Проверьте также спам.',
        en: 'Ticket sent to email! Please check spam too.',
      },
    },
    organizer: {
      id: 'organizer-form',
      title: { ru: 'Забронировать площадку', en: 'Book venue' },
      subtitle: {
        ru: 'Своё событие на готовой площадке 4400 м². Ответ за 2 часа.',
        en: 'Your event on ready 4400 m² venue. Reply in 2 hours.',
      },
      fields: ['name', 'company', 'phone', 'email', 'eventType', 'date', 'attendees', 'comment'],
      required: ['name', 'company', 'phone', 'eventType'],
      endpoint: '/api/lead?type=organizer',
    },
    sponsor: {
      id: 'sponsor-form',
      title: { ru: 'Стать спонсором', en: 'Become sponsor' },
      subtitle: {
        ru: 'Пакеты от баннера до генерального спонсора. Презентация за 10 минут.',
        en: 'Packages from banner to general sponsor. Deck in 10 min.',
      },
      fields: ['name', 'company', 'phone', 'email', 'package', 'comment'],
      required: ['name', 'company', 'phone'],
    },
    callback: {
      id: 'callback-form',
      title: { ru: 'Заказать звонок', en: 'Request callback' },
      subtitle: {
        ru: 'Перезвоним за 15 минут в рабочее время 09:00–18:00',
        en: 'We’ll call back in 15 min during 09:00–18:00',
      },
      fields: ['name', 'phone', 'time'],
      required: ['name', 'phone'],
      compact: true,
    },
    catalog: {
      id: 'catalog-form',
      title: { ru: 'Скачать каталог', en: 'Download catalogue' },
      subtitle: {
        ru: 'Каталог выставки + план зала + цены в PDF',
        en: 'Exhibition catalogue + floor plan + rates PDF',
      },
      fields: ['name', 'company', 'phone', 'email', 'messenger'],
      required: ['name', 'phone'],
      leadMagnet: true,
    },
    group: {
      id: 'group-form',
      title: { ru: 'Групповой визит', en: 'Group visit' },
      subtitle: {
        ru: 'От 10 человек — трансфер, гид, кофе-брейк. Бесплатно.',
        en: '10+ people — transfer, guide, coffee break. Free.',
      },
      fields: ['name', 'company', 'phone', 'count', 'date', 'comment'],
      required: ['name', 'phone', 'count'],
    },
    ticket: {
      id: 'ticket-form',
      title: { ru: 'Регистрация посетителя', en: 'Visitor registration' },
      subtitle: {
        ru: 'Заполните и получите билет с QR-кодом на почту',
        en: 'Fill and get ticket with QR to email',
      },
      fields: ['name', 'company', 'position', 'phone', 'email', 'industry', 'purpose'],
      required: ['name', 'phone', 'email', 'industry'],
    },
  },

  // Tracking
  tracking: {
    events: [
      'cta_click',
      'form_start',
      'form_submit',
      'form_abandon',
      'popup_show',
      'popup_click',
      'chat_open',
      'chat_message',
      'channel_click',
      'phone_click',
      'scroll_50',
      'scroll_75',
      'time_30s',
      'exit_intent',
    ],
    storageKey: 'sofexpo.analytics',
  },
} as const;

export type FormType = keyof typeof conversionConfig.forms;
export type PopupStrategy = (typeof conversionConfig.popups.strategies)[number];
export type Channel = (typeof conversionConfig.channels.ru)[number];
