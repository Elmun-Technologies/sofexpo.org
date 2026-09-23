import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parse} from 'parse5';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {localizeHTML,localizeRSS,localizeSearchJSON,translator,localizedURL,languageTags} from '../scripts/localization.mjs';
import {filesUnder} from '../scripts/localized-editions.mjs';
import {LOCALES,joinLocale,stripLocale,hrefFor} from '../scripts/host-rules.mjs';

const read = path => readFileSync(path,'utf8');
function nodes(root, predicate) {
  const found=[];
  function visit(n) { if(predicate(n))found.push(n);for(const c of n.childNodes??[])visit(c); }
  visit(root);return found;
}
const attribute = (node,name) => node.attrs?.find(a=>a.name===name)?.value;

test('public and host routing support four locales', () => {
  assert.deepEqual(LOCALES,['ru','en','zh','tr']);
  assert.equal(stripLocale('/zh/events/foodera-expo/'),'/events/foodera-expo/');
  assert.equal(joinLocale('tr','/zh/events/foodera-expo/'),'/tr/events/foodera-expo/');
  assert.equal(localizedURL('https://foodera.sofexpo.org/en/visitors/?a=1#faq','zh'),'https://foodera.sofexpo.org/zh/visitors/?a=1#faq');
  assert.equal(localizedURL('https://example.org/en/file.pdf','tr'),'https://example.org/en/file.pdf');
});

test('dates, changing countdowns and trade names are deterministic', () => {
  const zh=translator('zh',{strict:true}),tr=translator('tr',{strict:true});
  assert.equal(zh('20–22 October 2026'),'2026年10月20日至22日');
  assert.equal(tr('20–22 October 2026'),'20–22 Ekim 2026');
  assert.equal(zh('9 November 2030'),'2030年11月9日');
  assert.equal(tr('in 999 days'),'999 gün sonra');
  assert.equal(zh('SPRING · in 198 d'),'春季 · 198天后');
  assert.equal(zh('FOODERA EXPO 2026'),'FOODERA EXPO 2026');
  assert.equal(tr('RSS'),'RSS');
  assert.equal(zh('4 400 м²'),'4 400 m²');
  assert.equal(zh('от 100 м²'),'100平方米起');
  assert.equal(tr('Пользовательское соглашение'),'Kullanıcı sözleşmesi');
  assert.equal(zh('Самаркандская область'),'撒马尔罕州');
  assert.equal(tr('Русский'),'Русский');
  assert.throws(()=>zh('Новый текст без перевода'),/Missing zh translation/);
});

test('translate semantics, not selectors, classes, markup or language switches', () => {
  const html=`<!doctype html><html lang="en"><head><title>Book a stand</title><link rel="canonical" href="https://sofexpo.org/en/venue/"><link rel="alternate" hreflang="en" href="https://sofexpo.org/en/venue/"></head><body><a href="/en/venue/">The centre</a><a href="/en/venue/" hreflang="en">English</a><form data-err="Please complete the required fields."></form><script>document.querySelector('body form'); form.className='form__msg form__ok'; const message='Please complete the required fields.'; const index=[{title:'Contacts',href:'/en/contacts/',kind:'page'}];</script></body></html>`;
  const out=localizeHTML(html,'tr',{strict:true});
  assert.match(out,/<html lang="tr">/);
  assert.match(out,/rel="canonical" href="https:\/\/sofexpo.org\/tr\/venue\/"/);
  assert.match(out,/hreflang="en" href="https:\/\/sofexpo.org\/en\/venue\/"/);
  assert.match(out,/<a href="\/en\/venue\/" hreflang="en">English<\/a>/);
  assert.match(out,/form.className='form__msg form__ok'/);
  assert.match(out,/querySelector\('body form'\)/);
  assert.match(out,/Lütfen zorunlu alanları doldurun/);
  assert.match(out,/title:"İletişim"/);
  assert.match(out,/kind:'page'/);
});

test('structured data, RSS and the JSON search endpoint carry the target language', () => {
  const json=JSON.parse(localizeSearchJSON(JSON.stringify({locale:'en',count:1,items:[{title:'Contacts',text:'Book a stand',href:'/en/contacts/',kind:'page'}]}),'zh',{strict:true}));
  assert.equal(json.locale,'zh');assert.equal(json.count,1);assert.equal(json.items[0].href,'/zh/contacts/');assert.equal(json.items[0].kind,'page');assert.equal(json.items[0].title,'联系我们');
  const rss=localizeRSS('<rss><channel><title>News</title><language>en</language><item><link>https://sofexpo.org/en/news/</link><pubDate>Wed, 23 Sep 2026 00:00:00 GMT</pubDate></item></channel></rss>','tr',{strict:true});
  assert.match(rss,/<title>Haberler<\/title>/);assert.match(rss,/<language>tr<\/language>/);assert.match(rss,/\/tr\/news\//);assert.match(rss,/Wed, 23 Sep 2026/);
  const graph={name:'Contacts',inLanguage:'en',url:'https://sofexpo.org/en/contacts/',isPartOf:{inLanguage:['ru','en','zh-CN','tr']}};
  const out=localizeHTML(`<script type="application/ld+json">${JSON.stringify(graph)}</script>`,'zh',{strict:true});
  assert.match(out,/"inLanguage":"zh-CN"/);assert.match(out,/"inLanguage":\["ru","en","zh-CN","tr"\]/);
});

test('missing editorial translations fail loudly; corrections have bilingual parity', () => {
  assert.throws(()=>translator('zh',{strict:true})('A newly added untranslated editorial sentence.'),/Missing zh translation/);
  for(const [key,values] of Object.entries(JSON.parse(read('src/i18n/reviewed.json')))) {
    assert.equal(values.length,2,key);assert.ok(values.every(v=>typeof v==='string'&&v.trim()),key);
  }
});

test('every source UI key has a non-empty Chinese and Turkish translation', () => {
  const source=ts.createSourceFile('ui.ts',read('src/i18n/ui.ts'),ts.ScriptTarget.Latest,true);
  const module={exports:{}};
  const compiled=ts.transpileModule(read('src/i18n/ui.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}});
  runInNewContext(compiled.outputText,{module,exports:module.exports,require:createRequire(new URL('../src/i18n/ui.ts',import.meta.url))});
  let count=0;
  function visit(n) {
    if(ts.isPropertyAssignment(n)&&n.name.getText(source)==='en'&&ts.isObjectLiteralExpression(n.initializer)) {
      for(const p of n.initializer.properties) if(ts.isPropertyAssignment(p)&&ts.isStringLiteral(p.initializer)) {
        for(const locale of ['zh','tr']) {
          const expected=translator(locale,{strict:true})(p.initializer.text);
          assert.ok(expected);
          assert.equal(module.exports.useUI(locale)(p.name.text),expected,`${locale}:${p.name.text}`);
        }
        count++;
      }
    }
    ts.forEachChild(n,visit);
  }
  visit(source);assert.ok(count>100);
});

test('all built pages, inline scripts, feeds and search indexes have locale parity', () => {
  const sources=filesUnder('dist/en').filter(f=>/\.(html|xml|json)$/.test(f));
  assert.ok(sources.length>=77,'run npm run build before the tests');
  for(const file of sources) for(const locale of ['zh','tr']) {
    const target=file.replace('dist/en/',`dist/${locale}/`);
    assert.ok(existsSync(target),target);
    const source=read(file),output=read(target);
    if(file.endsWith('.html')) {
      assert.equal(output,localizeHTML(source,locale,{strict:true}),target);
      const document=parse(output);
      assert.equal(attribute(nodes(document,n=>n.tagName==='html')[0],'lang'),languageTags[locale]);
      for(const node of nodes(document,n=>n.nodeName==='#text'&&!['script','style'].includes(n.parentNode?.tagName))) {
        if(node.value.trim()!=='Русский') assert.doesNotMatch(node.value,/[А-Яа-яЁё]/,`${target}: residual Russian copy`);
      }
      for(const script of nodes(document,n=>n.tagName==='script'&&!attribute(n,'src'))) {
        const code=(script.childNodes??[]).map(n=>n.value??'').join('');
        if(attribute(script,'type')==='application/ld+json') JSON.parse(code);
        else assert.equal(ts.createSourceFile('inline.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS).parseDiagnostics.length,0,`${target}: invalid script`);
      }
    } else if(file.endsWith('.json')) {
      const index=JSON.parse(output);assert.equal(index.locale,locale);assert.ok(index.items.every(i=>i.href.startsWith(`/${locale}/`)));
    } else assert.match(output,new RegExp(`<language>${languageTags[locale]}</language>`));
  }
});
