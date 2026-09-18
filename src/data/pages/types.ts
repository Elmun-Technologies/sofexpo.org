import type { Locale } from "@/i18n/config";

/**
 * Pages are authored as an ordered list of blocks. One renderer
 * (`src/components/Blocks.astro`) draws them, while the *composition and the
 * copy stay individual per page* — no two pages share a template.
 */
export type BlockType =
  | "hero"
  | "h2"
  | "text"
  | "stats"
  | "grid"
  | "rows"
  | "table"
  | "steps"
  | "checklist"
  | "callout"
  | "files"
  | "gallery"
  | "quote"
  | "links"
  | "form"
  | "faq"
  | "cta";

export interface BlockAction {
  label: string;
  href: string;
}
export interface BlockStat {
  value: string;
  unit?: string;
  /** shared label for both locales */
  label?: string;
  ru?: string;
  en?: string;
}
export interface BlockCard {
  icon?: string;
  title: string;
  text?: string;
  meta?: string;
  href?: string;
}
export interface BlockRow {
  title: string;
  text?: string;
}
export interface BlockFile {
  title: string;
  href: string;
  note?: string;
  kind?: "pdf" | "link" | "video";
}
export interface BlockShot {
  src: string;
  alt?: string;
  caption?: string;
}
export interface BlockQA {
  q: string;
  a: string;
}
export interface BlockLink {
  label: string;
  href: string;
  note?: string;
}

export type BlockItem =
  | BlockCard
  | BlockRow
  | BlockStat
  | BlockFile
  | BlockShot
  | BlockQA
  | BlockLink;

export interface Block {
  type: BlockType;
  id?: string;
  kicker?: string;
  title?: string;
  lead?: string;
  text?: string;
  note?: string;
  bullets?: string[];
  actions?: BlockAction[];
  action?: BlockAction;
  /** media */
  image?: string;
  imageAlt?: string;
  /** layout */
  tone?: "default" | "paper" | "forest" | "sand" | "gold";
  width?: "narrow" | "wide";
  cols?: 2 | 3 | 4;
  /** collection-ish blocks */
  items?: BlockItem[];
  head?: string[];
  rows?: string[][];
  paragraphs?: string[];
  list?: string[];
  plain?: boolean;
  /** form block */
  directions?: string[];
  areas?: string[];
  event?: string;
  /** quote block */
  author?: string;
  role?: string;
  cite?: string;
}

export interface PageMeta {
  title: string;
  description: string;
}

export interface PageDef {
  /** locale-free site path, with trailing slash */
  path: string;
  /** default social image for this page */
  image?: string;
  meta: Record<Locale, PageMeta>;
  blocks: Record<Locale, Block[]>;
  /** keep out of the sitemap */
  noindex?: boolean;
}
