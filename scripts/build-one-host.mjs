#!/usr/bin/env node
/**
 * Build ONE hostname into `dist/` — the command each deploy target runs.
 *
 * Cloudflare Pages / Netlify / Vercel bind one project to one output directory, so a multi-host
 * site is one project per hostname building the same repo with a different environment. This
 * wrapper keeps the four steps in the right order and in one place:
 *
 *   1. regenerate the editorial ownership map (which show publishes which text)
 *   2. astro build with SITE=<host> and PUBLIC_HOSTS_MODE=<mode>
 *   3. generate per-page OG cards, trim SERP metadata, and add image sitemap entries
 *   4. drop noindex URLs, rewrite cross-host links, and write per-host robots/redirect rules
 *   5. run the host-aware SEO audit before the output can be published
 *
 * usage:
 *   node scripts/build-one-host.mjs sofexpo.org              # the centre
 *   node scripts/build-one-host.mjs foodera.sofexpo.org      # a show hostname
 *   node scripts/build-one-host.mjs foodera.sofexpo.org --mode alias   # single-host build
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { allHosts, map, movedRedirectsAsync } from "./host-rules.mjs";

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")
    ? argv[i + 1]
    : fallback;
};

const requested = positional[0] || map.root;
const host = requested.includes(".") ? requested : `${requested}.${map.root}`;
const mode = arg("mode", "subdomain");

if (!allHosts().some((h) => h.host === host)) {
  console.error(
    `build-one-host: "${host}" is not in src/data/host-map.json (known: ${allHosts()
      .map((h) => h.host)
      .join(", ")})`,
  );
  process.exit(2);
}

const env = {
  ...process.env,
  SITE: `https://${host}/`,
  PUBLIC_HOSTS_MODE: mode,
};
const run = (cmd, args) => execFileSync(cmd, args, { env, stdio: "inherit" });

console.log(`build-one-host: ${host} (mode ${mode})`);
run("node", ["scripts/gen-editorial-map.mjs"]);
run("npx", ["astro", "build"]);
run("node", ["scripts/build-og.mjs", "dist"]);
run("node", ["scripts/fit-meta.mjs", "dist"]);
run("node", ["scripts/prune-sitemap.mjs", "dist"]);
run("node", ["scripts/sitemap-images.mjs", "dist"]);
run("node", [
  "scripts/rewrite-host-links.mjs",
  "--dist",
  "dist",
  "--host",
  host,
  "--mode",
  mode,
]);

const robots = readFileSync("public/robots.txt", "utf8")
  .replace(/^Sitemap:.*$/m, `Sitemap: https://${host}/sitemap-index.xml`)
  .trimEnd();
writeFileSync("dist/robots.txt", `${robots}\nHost: ${host}\n`);

const redirects = ["/ /en/ 301"];
if (host === map.root) {
  // the centre hands the moved cluster paths over at the CDN level too
  redirects.push(...(await movedRedirectsAsync(mode)).map((rule) => `${rule.from} ${rule.to} 301`));
}
writeFileSync("dist/_redirects", `${redirects.join("\n")}\n`);
console.log(`build-one-host: wrote ${redirects.length} redirect rules and per-host robots.txt`);
if (arg("audit", "1") !== "0")
  run("node", [
    "scripts/seo-audit.mjs",
    "dist",
    "--host",
    host,
    "--peers",
    arg("peers", "dist-hosts"),
  ]);
console.log(`build-one-host: dist/ is ready to publish for ${host}`);
