import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editions, languageTags, localizeHTML, localizeRSS, localizeSearchJSON } from './localization.mjs';

export function filesUnder(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root,{withFileTypes:true}).flatMap(e => e.isDirectory() ? filesUnder(join(root,e.name)) : [join(root,e.name)]);
}
export function buildEditions(root, { strict = true } = {}) {
  let count = 0;
  for (const file of filesUnder(join(root,'en'))) {
    if (!/\.(html|xml|json)$/.test(file)) continue;
    const source = readFileSync(file,'utf8');
    for (const locale of editions) {
      const destination = join(root,locale,file.slice(join(root,'en').length + 1));
      const result = file.endsWith('.html') ? localizeHTML(source,locale,{strict}) : file.endsWith('.json') ? localizeSearchJSON(source,locale,{strict}) : localizeRSS(source,locale,{strict});
      mkdirSync(dirname(destination),{recursive:true}); writeFileSync(destination,result); count++;
    }
  }
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
      const links = ['ru','en',...editions].map(l => `<xhtml:link rel="alternate" hreflang="${languageTags[l]}" href="${bare.replace('/en/',`/${l}/`)}"/>`).join('');
      block = block.replace(/<xhtml:link[^>]*\/>/g,'').replace('</url>',links+'</url>');
      if (loc.includes('/en/')) for (const l of editions) extra.push(block.replace(`<loc>${loc}</loc>`,`<loc>${loc.replace('/en/',`/${l}/`)}</loc>`));
      return block;
    });
    writeFileSync(sitemap,xml.replace('</urlset>',extra.join('')+'</urlset>'));
  }
  console.log(`[i18n] Materialized ${count} localized HTML/RSS/JSON files (zh-CN, tr).`);
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

              const match = /^\/(zh|tr)(?=\/|\?|$)/.exec(request.url || '');
              if (match) {
                const locals = Symbol.for('astro.locals');
                request[locals] = { ...request[locals], sofexpoLocale: match[1] };
                request.url = request.url.replace(/^\/(zh|tr)(?=\/|\?|$)/, '/en');
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
