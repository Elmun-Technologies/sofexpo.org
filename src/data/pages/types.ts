import type { SourceLocale as Locale } from "@/i18n/config";

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
  | "cta"
  /* Phase 1 (docs/08 §6): the structural blocks — the line-up rail, the venue schematic and
     the location map. No other block type changes. */
  | "rail"
  | "plan"
  | "map"
  /* The team wall: 17 finished 1:1 poster artboards grouped by role, rendered by
     `src/components/TeamWall.astro`. The block carries no items of its own — the wall
     reads `src/data/team.ts` so a hire or a departure is a one-line edit. */
  | "team";

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
  /** optional photo at the top of the card (stock placeholder until client photos arrive) */
  image?: string;
  imageAlt?: string;
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
  /** hero media: override the default 4/3 frame (1/1 for finished artboards that must never be cropped) */
  mediaRatio?: string;
  /** layout */
  tone?: "default" | "paper" | "forest" | "sand" | "gold";
  width?: "narrow" | "wide";
  cols?: 2 | 3 | 4;
  /** `rail` block: how many upcoming shows to show (default 4) */
  railCount?: number;
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
