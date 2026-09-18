/** Types for the shared host rules (implementation lives in host-rules.mjs, JS on purpose:
 *  plain Node scripts and the Astro SSG must import the same module). */
export interface HostMapEntry {
  host: string;
  event: string | null;
  label: { ru: string; en: string };
}
export interface HostMap {
  root: string;
  sections: string[];
  hosts: HostMapEntry[];
}
export interface HostCtx {
  mode?: 'alias' | 'subdomain';
  currentHost?: string;
}
export const map: HostMap;
export const ROOT_HOST: string;
export const SECTIONS: string[];
export const HOSTS: HostMapEntry[];
export const LOCALES: string[];
export function hostOfEvent(slug: string): HostMapEntry | null;
export function eventOfHost(host: string): string | null;
export function stripLocale(path: string): string;
export function joinLocale(locale: string, path: string): string;
export function ownerOf(path: string, mode?: 'alias' | 'subdomain'): { host: string; path: string };
export function hrefFor(locale: string, path: string, ctx?: HostCtx): string;
export function isBuiltHere(path: string, ctx?: HostCtx): boolean;
export function movedRedirects(mode?: 'alias' | 'subdomain'): { from: string; to: string }[];
export function aliasRedirects(mode?: 'alias' | 'subdomain'): { from: string; to: string }[];
export function allHosts(): { host: string; event: string | null }[];
