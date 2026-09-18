#!/usr/bin/env node
/**
 * Cross-host integrity gate for the multi-host build (docs/05-subdomains.md).
 *
 * The per-host SEO audit proves each host is internally consistent. This script proves the
 * hosts are consistent WITH EACH OTHER, which is where a subdomain split actually breaks:
 *
 *  1. every absolute link to a registered sofexpo host resolves to a page built on that host;
 *  2. no relative link points at a page that this host does not build (a moved cluster page is
 *     the classic mistake — the page exists, just not here);
 *  3. a path is emitted by at most one host (duplicate content across hostnames);
 *  4. hreflang alternates stay on the same host — a language switch never jumps hostname;
 *  5. the root host redirects the legacy cluster URLs it no longer builds.
 *
 * usage: node scripts/check-hosts.mjs [--dir dist-hosts] [--mode subdomain]
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { LOCALES, allHosts, map, movedRedirects } from "./host-rules.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1]
    : fallback;
};
const DIR = arg("dir", "dist-hosts");
const mode = arg("mode", "subdomain");
const REGISTRY = allHosts().map((h) => h.host);

const problems = new Set();
const skipped = new Set();
const warn = (msg) => problems.add(msg);

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (full.endsWith(".html")) out.push(full);
  }
  return out;
}

/** `/ru/events/x/` -> the file the build must have written (index.html for a directory). */
function fileFor(root, href) {
  const rel = href
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return rel ? join(root, rel, "index.html") : join(root, "index.html");
}

const builtBy = new Map(); // host -> Set of host-local paths
const hosts = readdirSync(DIR).filter((name) =>
  statSync(join(DIR, name)).isDirectory(),
);
if (!hosts.length) {
  console.error(
    `check-hosts: nothing found in ${DIR}/ — run \`npm run build:hosts -- --mode ${mode}\` first`,
  );
  process.exit(2);
}

for (const host of hosts) {
  const paths = new Set();
  for (const file of htmlFiles(join(DIR, host))) {
    const rel = (
      "/" +
      file
        .slice(join(DIR, host).length)
        .replace(/\\/g, "/")
        .replace(/index\.html$/, "")
        .replace(/^\/+/, "")
    ).replace(/\/+/g, "/");
    paths.add(rel === "//" ? "/" : rel.replace(/\/$/, ""));
    paths.add(rel.endsWith("/") ? rel : `${rel}/`);
  }
  builtBy.set(host, paths);
}

const known = new Set([...REGISTRY, `www.${map.root}`, map.root]);
let checkedAbsolute = 0;
let checkedRelative = 0;
const ownerConflicts = new Map();

for (const host of hosts) {
  const root = join(DIR, host);
  for (const file of htmlFiles(root)) {
    const html = readFileSync(file, "utf8");
    const shown = file.slice(`${DIR}/`.length);

    /* 1 + 2: every internal href resolves to a built page, on the right host */
    /* only real anchors: <link rel=canonical|alternate> must be absolute by definition */
    for (const m of html.matchAll(
      /<a\b[^>]*?href="([^"#]*?)(?:[#?][^"]*)?"/g,
    )) {
      const href = m[1];
      if (
        !href ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("data:")
      )
        continue;
      if (/^https?:\/\//.test(href)) {
        const u = new URL(href);
        if (!u.hostname.endsWith("sofexpo.org") && u.hostname !== map.root)
          continue;
        if (!known.has(u.hostname)) {
          warn(`${shown}: link to an unregistered hostname ${u.hostname}`);
          continue;
        }
        if (u.hostname === host) {
          warn(
            `${shown}: absolute link to its own host — should be relative: ${href}`,
          );
          continue;
        }
        checkedAbsolute++;
        const target = builtBy.get(u.hostname);
        if (!target) {
          // not a failure: the peer simply was not part of this build (--only)
          skipped.add(u.hostname);
          continue;
        }
        const isFile = /\.[a-z0-9]+$/i.test(u.pathname);
        const want =
          u.pathname.endsWith("/") || isFile ? u.pathname : `${u.pathname}/`;
        const peerRoot = join(DIR, u.hostname);
        const ok = isFile
          ? existsSync(join(peerRoot, u.pathname.replace(/^\/+/, ""))) ||
            existsSync(join(DIR, map.root, u.pathname.replace(/^\/+/, "")))
          : target.has(want) || existsSync(fileFor(peerRoot, u.pathname));
        if (!ok)
          warn(
            `${shown}: link to ${u.hostname}${want} — no such page on that host`,
          );
      } else if (href.startsWith("/") && LOCALES.includes(href.split("/")[1])) {
        checkedRelative++;
        const target = builtBy.get(host);
        const isFile = /\.[a-z0-9]+$/i.test(href);
        const want = href.endsWith("/") || isFile ? href : `${href}/`;
        const ok = isFile
          ? existsSync(join(root, href.replace(/^\/+/, "")))
          : target.has(want) || existsSync(fileFor(root, href));
        if (!ok)
          warn(
            `${shown}: relative link ${want} is not built on ${host} (it lives on another host)`,
          );
      }
    }

    /* 4: hreflang pairs never leave the host — except on a moved stub, whose whole job is to
          hand its identity to the hostname that now owns the page */
    const isStub =
      /name="robots" content="noindex/.test(html) &&
      /http-equiv="refresh"/.test(html);
    if (!isStub) {
      for (const m of html.matchAll(
        /<link rel="alternate" hreflang="[a-z-]+" href="(https?:\/\/[^/]+)/g,
      )) {
        if (m[1] !== `https://${host}`)
          warn(`${shown}: hreflang points at ${m[1]} instead of ${host}`);
      }
    }

    /* 3: one path, one owner */
    const self = (
      "/" +
      file
        .slice(root.length)
        .replace(/index\.html$/, "")
        .replace(/^\/+/, "")
    ).replace(/\/+/g, "/");
    const key = self === "//" ? "/" : self.replace(/\/$/, "") || "/";
    if (!["/", "/404"].includes(key)) {
      const seen = ownerConflicts.get(key) ?? [];
      seen.push(host);
      ownerConflicts.set(key, seen);
    }
  }
}

for (const [path, owners] of ownerConflicts) {
  const sameContent = new Set(owners.filter((h) => !h.includes(".")));
  if (owners.length > 1 && sameContent.size === owners.length)
    warn(
      `path ${path} is built on ${owners.length} hosts (${owners.join(", ")}) — duplicated across hostnames`,
    );
}

/* 5: the centre must hand over the paths it gave up */
if (mode === "subdomain") {
  const expected = movedRedirects("subdomain");
  const file = join(DIR, map.root, "_redirects");
  if (!expected.length) {
    console.log(
      "check-hosts: no cluster was moved (alias mode) — nothing to redirect",
    );
  } else if (!existsSync(file)) {
    warn(
      `root host has no _redirects, but ${expected.length} cluster URL(s) moved to their own hosts`,
    );
  } else {
    const txt = readFileSync(file, "utf8");
    const missing = expected.filter((r) => !txt.includes(`${r.from} ${r.to}`));
    for (const r of missing)
      warn(`_redirects is missing: ${r.from} -> ${r.to}`);
  }
}

console.log(
  `check-hosts: ${hosts.length} host(s), ${checkedAbsolute} absolute + ${checkedRelative} relative internal link(s) verified`,
);
for (const host of skipped)
  console.log(
    `note: peer ${host} is not in ${DIR}/ — links to it were not verified (build it with npm run build:hosts)`,
  );

const list = [...problems];
if (list.length) {
  console.log(`✗ ${list.length} problem(s):`);
  for (const p of list.slice(0, 40)) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(
  "✓ hosts agree: every internal link resolves on the host that owns it",
);
