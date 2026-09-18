import { site } from "@/data/site";

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function formatDate(iso: string, locale: "ru" | "en") {
  const d = new Date(iso + "T12:00:00+05:00");
  return d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function monthsUptime() {
  return site.contacts.hours;
}

import { nav } from "@/data/site";
import { useUI } from "@/i18n/ui";

export interface Crumb {
  name: string;
  path: string;
}

/** Sections that live outside the main navigation tree. */
const extra: {
  base: string;
  children: { path: string; ru: string; en: string }[];
}[] = [
  {
    base: "/legal/",
    children: [
      {
        path: "/legal/privacy/",
        ru: "Политика конфиденциальности",
        en: "Privacy policy",
      },
      {
        path: "/legal/terms/",
        ru: "Пользовательское соглашение",
        en: "Terms of use",
      },
    ],
  },
  {
    base: "/",
    children: [
      { path: "/contacts/", ru: "Контакты", en: "Contacts" },
      {
        path: "/request-stand/",
        ru: "Забронировать стенд",
        en: "Book a stand",
      },
      { path: "/search/", ru: "Поиск", en: "Search" },
      { path: "/404/", ru: "Страница не найдена", en: "Page not found" },
    ],
  },
];

/** Breadcrumb trail (excluding Home, which Base prepends) for any authored path. */
export function pageCrumbs(locale: "ru" | "en", path: string): Crumb[] {
  const t = useUI(locale);
  const sections = [...nav, ...extra];
  const section = sections.find(
    (s) => path === s.base || (s.base !== "/" && path.startsWith(s.base)),
  );
  if (!section) return [];
  const out: Crumb[] = [];
  const sectionLabel =
    "key" in section && section.key
      ? t(section.key as Parameters<typeof t>[0])
      : section.base;
  if (path === section.base)
    return [{ name: sectionLabel, path: section.base }];
  const child = section.children.find((c) => c.path === path);
  const parentIsPage = section.children.some((c) => c.path === section.base) || section.base === '/';
  if (parentIsPage) out.push({ name: sectionLabel, path: section.base });
  out.push({
    name: child ? (locale === "ru" ? child.ru : child.en) : labelFromPath(path),
    path,
  });
  return out;
}

function labelFromPath(path: string) {
  const seg = path.replace(/\/+$/, "").split("/").pop() ?? path;
  return seg.replace(/[-_]/g, " ");
}
