/**
 * Post-build pass: make hand-written links host-aware.
 *
 * `localize()` already resolves every component link, but markdown bodies (news + long-reads)
 * contain literal `/ru/events/foodera-expo/exhibitors/` hrefs. In alias mode nothing changes;
 * in subdomain mode such a link must become absolute when the target lives on another hostname,
 * otherwise it would point at a page that was never built. The SEO audit already fails on a
 * relative link to a missing page, so a missed case cannot ship silently.
 *
 * usage: node scripts/rewrite-host-links.mjs --dist dist --host sofexpo.org --mode subdomain
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LOCALES, joinLocale, map, ownerOf } from "./host-rules.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const dist = arg("dist", "dist");
const host = arg("host", map.root);
const mode = arg("mode", "alias");

if (mode !== "subdomain") {
  console.log(
    'host-links: mode is not "subdomain" — every path lives on this host, nothing to rewrite',
  );
  process.exit(0);
}

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith(".html")) files.push(full);
  }
};
walk(dist);

/** what this host actually built — a link that resolves here must never be rewritten */
const built = new Set();
for (const file of files) {
  const rel =
    "/" +
    file
      .slice(dist.length)
      .replace(/\\/g, "/")
      .replace(/index\.html$/, "")
      .replace(/^\/+/, "");
  const clean = rel === "//" ? "/" : rel.replace(/\/+$/, "");
  built.add(clean);
  built.add(`${clean}/`);
}

const RE = new RegExp(`href="/(${LOCALES.join("|")})(/[^"#{?]*)?"`, "g");
const knownEvents = new Set(map.hosts.map((h) => h.event));

let changed = 0;
let scanned = 0;
for (const file of files) {
  const html = readFileSync(file, "utf8");
  scanned += (html.match(RE) ?? []).length;
  const next = html.replace(RE, (whole, locale, rest = "/") => {
    const here = joinLocale(locale, rest || "/");
    if (built.has(here)) return whole; // this page IS built here (e.g. a host-local cluster path)
    const owner = ownerOf(rest, "subdomain", host);
    /* same host → the host-LOCAL path (a root-space cluster path is relocated here);
       other host → absolute URL */
    const href =
      owner.host === host
        ? joinLocale(locale, owner.path)
        : `https://${owner.host}${joinLocale(locale, owner.path)}`;
    if (href === here) return whole;
    changed++;
    return `href="${href}"`;
  });
  if (next !== html) writeFileSync(file, next);
}

console.log(
  `host-links: ${files.length} file(s), ${scanned} locale link(s), ${changed} rewritten to absolute`,
);
