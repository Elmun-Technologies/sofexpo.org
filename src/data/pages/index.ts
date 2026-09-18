import type { PageDef } from "./types";
import { venuePages } from "./venue";
import { exhibitorPages } from "./exhibitors";
import { visitorPages } from "./visitors";
import { organizerPages } from "./organizers";
import { companyPages } from "./company";

/** Every authored page of the site, keyed by its locale-free path. */
export const pages: PageDef[] = [
  ...venuePages,
  ...exhibitorPages,
  ...visitorPages,
  ...organizerPages,
  ...companyPages,
];

export const pagesByPath = new Map(pages.map((p) => [p.path, p]));

export function getPage(path: string): PageDef | undefined {
  return pagesByPath.get(path);
}

/** Paths used by getStaticPaths, with and without trailing slash. */
export function pagePaths(): string[] {
  const out = new Set<string>();
  for (const p of pages) {
    out.add(p.path);
    out.add(p.path.endsWith("/") ? p.path : `${p.path}/`);
  }
  return [...out];
}
