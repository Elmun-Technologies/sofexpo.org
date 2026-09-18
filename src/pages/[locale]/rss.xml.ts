import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { locales, type Locale } from "@/i18n/config";
import { isRootHost } from "@/data/hosts";
import { events } from "@/data/events";
import { abs } from "@/lib/seo";
import { postHref } from "@/lib/contentOwnership";

export function getStaticPaths() {
  // the feed is a property of the centre host: an exhibition hostname links to it absolutely
  return isRootHost ? locales.map((locale) => ({ params: { locale } })) : [];
}

/** Feed carries news, articles and exhibition dates — the three things a trade reader subscribes to. */
export async function GET(context: APIContext) {
  const locale = context.params.locale as Locale;
  const ru = locale === "ru";
  const posts = await getCollection("news", ({ data }) => !data.draft);
  const articles = await getCollection("articles", ({ data }) => !data.draft);
  const items = [
    ...posts
      .filter((e) => e.id.startsWith(`${locale}/`))
      .map((e) => ({
        title: e.data.title,
        description: e.data.description,
        pubDate: e.data.date,
        link: abs(postHref(locale, "news", e.id.split("/").slice(1).join("/"))),
        categories: ["news", ...(e.data.tags ?? [])],
      })),
    ...articles
      .filter((e) => e.id.startsWith(`${locale}/`))
      .map((e) => ({
        title: e.data.title,
        description: e.data.description,
        pubDate: e.data.date,
        link: abs(
          postHref(locale, "articles", e.id.split("/").slice(1).join("/")),
        ),
        categories: ["insights", ...(e.data.tags ?? [])],
      })),
    ...events
      .filter((e) => e.status !== "past")
      .map((e) => ({
        title: e.brand[locale],
        description: `${e.dates.display[locale]} — ${e.tagline[locale]}`,
        pubDate: new Date(`${e.dates.start}T09:00:00+05:00`),
        link: abs(`/${locale}/events/${e.slug}/`),
        categories: ["exhibition", e.industry],
      })),
  ].sort(
    (a, b) => (b.pubDate as Date).getTime() - (a.pubDate as Date).getTime(),
  );

  return rss({
    title: ru
      ? "SOF EXPO Samarkand — новости и выставки"
      : "SOF EXPO Samarkand — news and exhibitions",
    description: ru
      ? "Анонсы выставок, деловые программы и материалы для прессы от выставочно-конгрессного центра в Самарканде."
      : "Exhibition announcements, business programmes and press material from the exhibition and congress centre in Samarkand.",
    site: context.site ?? new URL("https://sofexpo.org"),
    items,
    customData: `<language>${ru ? "ru" : "en"}</language><image><url>${abs("/og/default.jpg")}</url><title>SOF EXPO Samarkand</title></image>`,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    stylesheet: false,
  });
}
