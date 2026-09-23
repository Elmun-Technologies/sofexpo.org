import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editions, strictEditions, failOnMissing, languageTags, localizeHTML, localizeRSS, localizeSearchJSON } from './localization.mjs';

export function filesUnder(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root,{withFileTypes:true}).flatMap(e => e.isDirectory() ? filesUnder(join(root,e.name)) : [join(root,e.name)]);
}
export function buildEditions(root, { strict = true } = {}) {
  let count = 0;
  const complete = new Set(), partial = new Map();
  for (const file of filesUnder(join(root,'en'))) {
    if (!/\.(html|xml|json)$/.test(file)) continue;
    const source = readFileSync(file,'utf8');
    for (const locale of editions) {
      const rel = file.slice(join(root,'en').length + 1);
      const destination = join(root,locale,rel);
      const hard = strict && failOnMissing.includes(locale);
      const soft = !strictEditions.includes(locale);
      const missing = new Set();
      const opts = {strict: hard, missing};
      let result = file.endsWith('.html') ? localizeHTML(source,locale,opts) : file.endsWith('.json') ? localizeSearchJSON(source,locale,opts) : localizeRSS(source,locale,opts);
      if (soft && file.endsWith('.html')) {
        if (missing.size) {
          partial.set(rel, missing.size);
          result = result.replace(/<meta name="robots" content="[^"]*">/, '').replace('</head>', '<meta name="robots" content="noindex, follow"></head>');
        } else if (!/name="robots" content="noindex/.test(result)) complete.add(rel);
      }
      mkdirSync(dirname(destination),{recursive:true}); writeFileSync(destination,result); count++;
    }
  }
  /* page-by-page editions (uz): a fully translated page joins the hreflang cluster and the
     language picker of every sibling; an incomplete one stays noindex and unlinked */
  const soft = editions.filter(l => !strictEditions.includes(l));
  for (const rel of complete) {
    for (const l of ['en','ru',...editions]) {
      const f = join(root,l,rel);
      if (!existsSync(f)) continue;
      let html = readFileSync(f,'utf8');
      const m = /<link rel="alternate" hreflang="tr" href="([^"]+)\/tr\/([^"]*)">/.exec(html);
      if (!m) continue;
      for (const s of soft) {
        if (html.includes(`hreflang="${languageTags[s]}" href=`)) continue;
        html = html.replace(m[0], `${m[0]}\n<link rel="alternate" hreflang="${languageTags[s]}" href="${m[1]}/${s}/${m[2]}">`);
        html = html.replace(/(<a href="([^"]*)\/tr\/([^"]*)" hreflang="tr" lang="tr"([^>]*)>[\s\S]*?<\/a>)/, (all, a, pre, path, rest) =>
          `${a}<a href="${pre}/${s}/${path}" hreflang="${s}" lang="${s}"${rest.replace(/ aria-current="true"/,'')}${l===s?' aria-current="true"':''}> <span${rest.replace(/ aria-current="true"/,'')}>O‘zbekcha</span><span class="language-code"${rest.replace(/ aria-current="true"/,'')}>UZ</span> </a>`);
      }
      writeFileSync(f,html);
    }
  }
  if (soft.length) console.log(`[i18n] ${soft.join(',')}: ${complete.size} pages complete, ${partial.size} partial (noindex)`);
  // Sitemap entries are based on actual emitted English pages, including each host's
  // ownership rules. The normal noindex-pruner still runs after this integration.
  const sitemap = join(root,'sitemap-0.xml');
  if (existsSync(sitemap)) {
    let xml = readFileSync(sitemap,'utf8');
    const extra = [];
    xml = xml.replace(/<url>[\s\S]*?<\/url>/g, block => {
      const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
      if (!loc || !/\/(en|ru)\//.test(loc)) return block;
      const bare = loc.replace(/\/(en|ru)\//,'/en/');
      const relp = new URL(bare).pathname.replace(/^\/en\//,'')+'index.html';
      const links = ['ru','en',...editions.filter(l => strictEditions.includes(l) || complete.has(relp))].map(l => `<xhtml:link rel="alternate" hreflang="${languageTags[l]}" href="${bare.replace('/en/',`/${l}/`)}"/>`).join('');
      block = block.replace(/<xhtml:link[^>]*\/>/g,'').replace('</url>',links+'</url>');
      if (loc.includes('/en/')) for (const l of editions) if (strictEditions.includes(l) || complete.has(new URL(bare).pathname.replace(/^\/en\//,'')+'index.html')) extra.push(block.replace(`<loc>${loc}</loc>`,`<loc>${loc.replace('/en/',`/${l}/`)}</loc>`));
      return block;
    });
    writeFileSync(sitemap,xml.replace('</urlset>',extra.join('')+'</urlset>'));
  }
  console.log(`[i18n] Materialized ${count} localized HTML/RSS/JSON files (zh-CN, tr, uz).`);
}
export function localizedEditions() {
  return {
    name: 'sofexpo-localized-editions',
    hooks: {
      'astro:config:setup': ({updateConfig}) => {
        updateConfig({vite:{plugins:[{
          name:'sofexpo-locale-routing',
          enforce:'pre',
          configureServer(server) {
            // Rewrite before route selection. Astro.rewrite() cannot disambiguate the
            // legacy [section] / [...slug] routes when their getStaticPaths differ.
            server.middlewares.use((request, _response, next) => {
              const routed = Symbol.for('sofexpo.dev.locale-routed');
              if (request[routed]) return next();
              request[routed] = true;

              const match = /^\/(zh|tr|uz)(?=\/|\?|$)/.exec(request.url || '');
              if (match) {
                const locals = Symbol.for('astro.locals');
                request[locals] = { ...request[locals], sofexpoLocale: match[1] };
                request.url = request.url.replace(/^\/(zh|tr|uz)(?=\/|\?|$)/, '/en');
              }
              next();
            });
          },
        }]}});
      },
      'astro:build:done': ({dir}) => {
        if (process.env.I18N_EXTRACT === '1') return;
        buildEditions(fileURLToPath(dir));
      },
    },
  };
}
