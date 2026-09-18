#!/usr/bin/env node
/**
 * Build the site once per hostname.
 *
 * `npm run build:hosts -- --mode subdomain` produces:
 *   dist-hosts/sofexpo.org/            the centre: venue, hubs, calendar, editorial, legal
 *   dist-hosts/foodera.sofexpo.org/    FOODERA's cluster at the root of its own host
 *   …
 * Each host gets its own robots.txt (own Sitemap line), its own sitemap and — on the root
 * host — a `_redirects` file so the legacy `/events/{slug}/…` URLs 301 to the new hostname
 * instead of landing on the built-in stub. `dist/` ends up holding the ROOT build, so the
 * usual `npm run preview` keeps working.
 *
 * usage: node scripts/build-hosts.mjs [--mode alias|subdomain] [--only hostA,hostB] [--out dist-hosts] [--keep]
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { aliasRedirects, allHosts, eventOfHost, map, movedRedirects } from './host-rules.mjs';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const mode = arg('mode', process.env.PUBLIC_HOSTS_MODE || 'alias');
const out = arg('out', 'dist-hosts');
const only = (arg('only', '') || '').split(',').filter(Boolean);
const hosts = allHosts().filter((h) => !only.length || only.includes(h.host));

/* the centre must be built last: dist/ is what `npm run preview` serves */
const ordered = [...hosts.filter((h) => h.event), ...hosts.filter((h) => !h.event)];
if (!ordered.length) {
  console.error(`build-hosts: no host matched --only ${only.join(',')}`);
  process.exit(2);
}

const ROBOT_SHARED = `User-agent: *
Allow: /
Disallow: /*?utm_
Disallow: /*?gclid=
Disallow: /*?fbclid=
`;

function robotsFor(host) {
  return `${ROBOT_SHARED}\nSitemap: https://${host}/sitemap-index.xml\nHost: ${host}\n`;
}

/** Path-based 301s for the site's own `_redirects` file (Cloudflare Pages / Netlify). */
function redirectsFor(host) {
  if (host !== map.root) return '';
  return movedRedirects(mode)
    .map((r) => `${r.from} ${r.to} 301`)
    .join('\n');
}

/**
 * Hostname-based rules cannot live in `_redirects` (it is per-site), so the vanity hosts are
 * emitted as a ready-to-paste CDN config instead of being described in prose somewhere.
 */
function vanityConfig(mode) {
  const list = aliasRedirects(mode);
  const lines = [
    '# Vanity hostnames -> centre paths.',
    '# Cloudflare Pages: a custom hostname per entry + a Bulk Redirect list, or one Redirect Rule with these pairs.',
    '# nginx: server_name <host> { return 301 <to>; }',
    '',
    ...list.map((r) => `${r.from}  ->  ${r.to}`),
  ];
  return lines.join('\n') + '\n';
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const report = [];
for (const { host } of ordered) {
  const label = eventOfHost(host) ? `${host} (${eventOfHost(host)})` : `${host} (centre)`;
  console.log(`\n=== build ${label} — mode ${mode} ===`);
  rmSync('dist', { recursive: true, force: true });
  const env = { ...process.env, SITE: `https://${host}/`, PUBLIC_HOSTS_MODE: mode };
  execFileSync('npx', ['astro', 'build'], { env, stdio: 'inherit' });
  execFileSync('node', ['scripts/prune-sitemap.mjs', 'dist'], { env, stdio: 'inherit' });
  execFileSync('node', ['scripts/rewrite-host-links.mjs', '--dist', 'dist', '--host', host, '--mode', mode], {
    env,
    stdio: 'inherit',
  });

  writeFileSync('dist/robots.txt', robotsFor(host));
  const redirects = redirectsFor(host);
  if (redirects) writeFileSync('dist/_redirects', redirects);
  if (host === map.root) writeFileSync(join(out, 'redirects.vanity.md'), vanityConfig(mode));

  const target = join(out, host);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync('dist', target, { recursive: true });
  report.push({ host, dir: target, redirects: redirects ? redirects.trim().split('\n').length : 0 });
}

/* ---- phase 2: audit every host knowing about its siblings ---- */
if (!flag('no-audit')) {
  for (const { host, dir } of report) {
    console.log(`\n=== audit ${host} (peers: ${out}) ===`);
    execFileSync('node', ['scripts/seo-audit.mjs', dir, '--host', host, '--peers', out], {
      env: { ...process.env, SITE: `https://${host}/`, PUBLIC_HOSTS_MODE: mode },
      stdio: 'inherit',
    });
  }
  console.log('\n=== cross-host link check ===');
  execFileSync('node', ['scripts/check-hosts.mjs', '--dir', out, '--mode', mode], { stdio: 'inherit' });
}

/* `dist/` keeps the centre build so `npm run preview` behaves as before */
const centre = join(out, map.root);
if (existsSync(centre)) {
  rmSync('dist', { recursive: true, force: true });
  cpSync(centre, 'dist', { recursive: true });
}

const countHtml = (dir) => {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) n += countHtml(full);
    else if (name.endsWith('.html')) n++;
  }
  return n;
};

console.log('\nbuild-hosts: summary');
for (const r of report)
  console.log(
    `  ${r.host.padEnd(28)} ${String(countHtml(r.dir)).padStart(4)} page(s)  ${String(r.redirects).padStart(3)} redirect rule(s)  ->  ${r.dir}`,
  );
console.log(`\ndist/ now holds ${map.root} (the centre) — preview as usual.`);
