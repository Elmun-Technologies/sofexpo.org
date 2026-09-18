/**
 * Per-host brand identity.
 *
 * The centre wears the system identity (evergreen ground, hall-module mark). An exhibition hostname
 * wears its own, derived from the organiser's badge: FOODERA's is an eight-pointed star — two equal
 * squares, one turned 45°, drawn as thick ribbons in blue and tan gold — inside a circle of islimi
 * scrollwork. `brand-map.json` is the single source; the app and the asset generator read the same file.
 *
 * Mechanism: `brandCss()` emits ONE token block, and every component already reads those tokens, so a
 * show's identity reaches header, hero, buttons, chips and tables without any component asking which
 * host it is on. Specificity `html[data-brand]` (0,1,1) beats `:root` (0,1,0) — stylesheet order is
 * irrelevant. Adding BUILDPRO's identity is one entry in the JSON plus their logo file, no code.
 */
import map from "./brand-map.json";

export type Locale = "ru" | "en";

export type BrandPalette = {
  evergreen: string;
  evergreen2: string;
  moss: string;
  ink: string;
  ink60: string;
  ink40: string;
  line: string;
  lineStrong: string;
  cream: string;
  cream2: string;
  gold: string;
  goldSoft: string;
  ornament: string;
  mark: string;
};

export type HostBrand = {
  id: string;
  host: string;
  name: Record<Locale, string>;
  sub: Record<Locale, string>;
  ornament: "islimi" | null;
  contrast: string;
  palette: BrandPalette;
};

const hosts = (map as { hosts: Record<string, HostBrand> }).hosts;

export const brands: Record<string, HostBrand> = hosts;

export function brandForEvent(slug?: string | null): HostBrand | null {
  if (!slug) return null;
  return hosts[slug] ?? null;
}

/** the single override block for a branded host; '' for the centre */
export function brandCss(brand: HostBrand | null): string {
  if (!brand) return "";
  const p = brand.palette;
  return [
    `html[data-brand="${brand.id}"]{`,
    `--evergreen:${p.evergreen};--evergreen-2:${p.evergreen2};--moss:${p.moss};`,
    `--ink:${p.ink};--ink-60:${p.ink60};--ink-40:${p.ink40};`,
    `--line:${p.line};--line-strong:${p.lineStrong};`,
    `--cream:${p.cream};--cream-2:${p.cream2};`,
    `--gold:${p.gold};--gold-soft:${p.goldSoft};--ornament:${p.ornament};--brand-mark:${p.mark};`,
    "}",
  ].join("");
}
