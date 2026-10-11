import type { PageDef } from "./types";

const TOUR = "https://my.cybermuseum.art";
const PANORAMA = "x36rtq6ggm";

export const virtualTourPages: PageDef[] = [
  {
    path: "/venue/virtual-tour/",
    image: "/images/hall-crowd.jpg",
    meta: {
      ru: {
        title: "Виртуальный тур SOF EXPO Samarkand — 360° обзор площадки",
        description:
          "Интерактивный виртуальный тур по SOF EXPO в Самарканде: выставочный зал, открытая площадка, конференц-зоны и образцы стендов. Осмотрите центр изнутри до визита.",
      },
      en: {
        title: "SOF EXPO Samarkand virtual tour | 360° venue walkthrough",
        description:
          "Take an interactive 360° virtual tour of SOF EXPO Samarkand. Explore the exhibition hall, outdoor grounds, conference spaces and sample stands before your visit.",
      },
    },
    blocks: {
      ru: [
        {
          type: "hero",
          kicker: "SOF EXPO Samarkand · виртуальный тур",
          title: "Загляните внутрь SOF EXPO Samarkand",
          lead: "Осмотрите выставочный зал, открытую площадку, конференц-зоны и образцы стендов в интерактивном 360° туре. Поворачивайте обзор мышью и переходите между зонами по плану.",
          bullets: [
            "Обзор 360° внутри и снаружи",
            "Выставочный зал, улица и конференц-зоны",
            "Интерактивный план с точками обзора",
          ],
          actions: [
            { label: "Начать виртуальный тур", href: "#virtual-tour" },
            { label: "Залы и площадки", href: "/venue/halls/" },
          ],
          image: "/images/hall-crowd.jpg",
          imageAlt: "Выставочный зал с экспозицией и потоками посетителей",
        },
        {
          type: "tour",
          id: "virtual-tour",
          tone: "forest",
          kicker: "Интерактивный 360° тур",
          title: "Пройдите по площадке SOF EXPO",
          text: "Переходите с открытой площадки в павильон и между выставочными стендами. Поворачивайте вид мышью или экранными кнопками, а точки на плане помогут быстро сменить ракурс.",
          tour: {
            src: `${TOUR}/ru/tour/sofexpo`,
            href: `${TOUR}/ru/tour/sofexpo`,
            planHref: `${TOUR}/ru/pano/${PANORAMA}`,
            frameTitle: "Виртуальный тур SOF EXPO Samarkand",
            launchLabel: "Открыть тур в новой вкладке",
            planLabel: "Открыть интерактивный план",
            fallback: "Если предпросмотр не загрузится, откройте полный тур в новой вкладке.",
            notice:
              "Интерактивный тур размещён на внешнем сервисе; загрузка медиа может занять несколько секунд.",
          },
        },
        {
          type: "h2",
          kicker: "Площадка без фильтров",
          title: "Настоящие пространства, которые вы увидите в туре",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/hall-stand.jpg",
              caption: "Главный зал: экспозиция и переговорные зоны",
            },
            {
              src: "/images/outdoor-area.jpg",
              caption: "Открытая площадка 5 000 м²: крупногабаритная техника",
            },
            {
              src: "/images/conference-audience.jpg",
              caption: "Конференц-зал во время деловой программы",
            },
            {
              src: "/images/conference-room.jpg",
              caption: "Переговорная внутри павильона",
            },
          ],
        },
        {
          type: "cta",
          tone: "paper",
          kicker: "Организаторам событий",
          title: "Площадка для вашего мероприятия",
          text: "После виртуального знакомства можно запросить свободные даты, планировки и технические требования для вашего события.",
          actions: [
            { label: "Запросить даты", href: "/organizers/" },
            { label: "Залы и площадки", href: "/venue/halls/" },
          ],
        },
      ],
      en: [
        {
          type: "hero",
          kicker: "SOF EXPO Samarkand · virtual tour",
          title: "Step inside SOF EXPO Samarkand",
          lead: "Explore the indoor exhibition hall, outdoor grounds, conference spaces and sample stands in an interactive 360° tour. Drag to look around, then use the on-screen plan to move between areas.",
          bullets: [
            "360° views, indoors and out",
            "The exhibition hall, outdoor area and conference spaces",
            "An interactive plan with selectable viewpoints",
          ],
          actions: [
            { label: "Start the virtual tour", href: "#virtual-tour" },
            { label: "Halls and areas", href: "/venue/halls/" },
          ],
          image: "/images/hall-crowd.jpg",
          imageAlt: "Exhibition hall with stands and foot traffic",
        },
        {
          type: "tour",
          id: "virtual-tour",
          tone: "forest",
          kicker: "Interactive 360° experience",
          title: "Walk through the venue",
          text: "Move between the outdoor space, indoor pavilion and exhibition stands. Drag or use the on-screen controls to look around; select the map to jump to another viewpoint.",
          tour: {
            src: `${TOUR}/en/tour/sofexpo`,
            href: `${TOUR}/en/tour/sofexpo`,
            planHref: `${TOUR}/en/pano/${PANORAMA}`,
            frameTitle: "SOF EXPO Samarkand virtual tour",
            launchLabel: "Open the tour in a new tab",
            planLabel: "Open the interactive plan",
            fallback: "If the preview does not load, open the full tour in a new tab.",
            notice:
              "The virtual tour is hosted on an external service. It may use additional data and take a moment to load.",
          },
        },
        {
          type: "h2",
          kicker: "A closer look",
          title: "Real spaces behind the virtual tour",
        },
        {
          type: "gallery",
          items: [
            {
              src: "/images/hall-stand.jpg",
              caption: "Main hall: expo and meeting zones",
            },
            {
              src: "/images/outdoor-area.jpg",
              caption: "The 5,000 m² open-air area: large machinery",
            },
            {
              src: "/images/conference-audience.jpg",
              caption: "Conference hall during the business programme",
            },
            {
              src: "/images/conference-room.jpg",
              caption: "A meeting room inside the pavilion",
            },
          ],
        },
        {
          type: "cta",
          tone: "paper",
          kicker: "For event organizers",
          title: "A venue for your event",
          text: "After the virtual walkthrough, ask us about available dates, floor plans and technical requirements for your event.",
          actions: [
            { label: "Request dates", href: "/organizers/" },
            { label: "Halls and areas", href: "/venue/halls/" },
          ],
        },
      ],
    },
  },
];
