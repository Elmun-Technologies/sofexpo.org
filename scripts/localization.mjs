/**
 * Static localization boundary for the legacy, bilingual editorial renderer.
 * Translates semantic text, never markup or identifiers. Catalogs are checked in;
 * there is NO translation service, model, or DOM replacement in the client.
 * The same implementation serves Astro dev and materializes static editions.
 */
import { parse, parseFragment, serialize } from 'parse5';
import ts from 'typescript';
import reviewed from '../src/i18n/reviewed.json' with { type: 'json' };
import zh from '../src/i18n/catalogs/zh.json' with { type: 'json' };
import tr from '../src/i18n/catalogs/tr.json' with { type: 'json' };

export const editions = ['zh', 'tr'];
export const languageTags = { en: 'en', ru: 'ru', zh: 'zh-CN', tr: 'tr' };
const ogTags = { en: 'en_US', ru: 'ru_RU', zh: 'zh_CN', tr: 'tr_TR' };
const dictionaries = { zh: { ...zh }, tr: { ...tr } };
for (const [source, values] of Object.entries(reviewed)) { dictionaries.zh[source] = values[0]; dictionaries.tr[source] = values[1]; }
export const normalize = s => s.replace(/\s+/g, ' ').trim();
const protectedText = /^(?:(?:SOF EXPO(?: SAMARKAND| Samarkand)?|RESOF EXPO|FOODERA(?: EXPO)?|BUILDPRO(?: EXPO)?|BUILD PRO(?: EXPO)?|AGROPRO(?: EXPO)?|WORLD EDU(?: EXPO)?|PROMOTORS(?: SHOW SAMARKAND)?|ECOM & RETAIL(?: EXPO(?: SAMARKAND)?)?)(?: 20\d\d)?|PDF|QR|B2B|B2C|Wi-Fi|Telegram|Instagram|YouTube|Facebook|LinkedIn|TikTok|WhatsApp|English|Türkçe|Русский|EN|RU|TR|UZ|USD|UZS|HoReCa|IELTS|GMAT|SAT|PR|SKU|VIP|SPL|DJ|ISO|EXPO 20\d\d|SAMARKAND|RSS|CBDO|CIO \/ CTO|WYZO|RESOF|EXPO|SOF)$/i;
export function isCopy(value) {
  const text = normalize(value);
  return !!text && /[a-zA-ZА-Яа-яЁё]/.test(text) && !protectedText.test(text)
    && !/^(?:https?:|mailto:|tel:|\/|#|@)/.test(text)
    && !/^[\w.+-]+@[\w.-]+\.[a-z]+$/i.test(text)
    && !/^[\d\s.,–—+×x/()%-]*(?:m²|m|kW|V|km|mm|kg|MB|GB|USD|UZS|h|м²)(?:[\d\s.,–—+×x/()%-]*)$/.test(text)
    && !/^\d{4}-\d\d-\d\d/.test(text);
}
const textualAttrs = new Set(['alt','title','aria-label','placeholder','data-ok','data-err','data-fallback','data-empty','data-results','data-label','data-open-label','data-close-label']);
const jsonTextKeys = new Set(['title','name','description','headline','articleBody','text','caption','alternateName','addressLocality','addressRegion','jobTitle','keywords']);
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const put = (node, name, value) => {
  const a = node.attrs?.find(a => a.name === name);
  if (a) a.value = value; else (node.attrs ??= []).push({ name, value });
};
const strip = (node, name) => { node.attrs = node.attrs?.filter(a => a.name !== name); };
export function localizedURL(value, locale) {
  // Only owned locale-prefixed URLs; external assets, downloads and query values stay intact.
  return value.replace(/(^|https?:\/\/(?:[a-z0-9-]+\.)?sofexpo\.org)\/en(?=\/|$|[?#])/g, `$1/${locale}`);
}
function dynamicText(text, locale, translate) {
  const home = /^(.*?) — Home$/.exec(text);
  if (home && protectedText.test(home[1])) return `${home[1]} — ${locale === 'zh' ? '首页' : 'Ana sayfa'}`;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthIndex = word => monthNames.findIndex(m => m.toLowerCase().startsWith(word.toLowerCase()));
  const date = /^(?:(.*?) [·—] )?(\d{1,2})(?:[–-](\d{1,2}))? ([A-Za-z]+) (\d{4})$/.exec(text);
  if (date && monthIndex(date[4]) >= 0 && (!date[1] || protectedText.test(date[1]))) {
    const [, prefix, start, end, month, year] = date;
    const m = monthIndex(month);
    const result = locale === 'zh'
      ? `${year}年${m+1}月${+start}${end ? `日至${+end}` : ''}日`
      : `${+start}${end ? `–${+end}` : ''} ${new Intl.DateTimeFormat('tr-TR',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(+year,m,1)))} ${year}`;
    return prefix ? `${prefix} · ${result}` : result;
  }
  const range = /^(\d{1,2}) ([A-Za-z]+) — (\d{1,2}) ([A-Za-z]+)$/.exec(text);
  if (range && monthIndex(range[2]) >= 0 && monthIndex(range[4]) >= 0) {
    const month = word => new Intl.DateTimeFormat('tr-TR',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,monthIndex(word),1)));
    return locale === 'zh' ? `${monthIndex(range[2])+1}月${+range[1]}日—${monthIndex(range[4])+1}月${+range[3]}日` : `${+range[1]} ${month(range[2])} — ${+range[3]} ${month(range[4])}`;
  }
  const monthYear = /^([A-Za-z]+) (\d{4})$/.exec(text);
  if (monthYear && monthIndex(monthYear[1]) >= 0) {
    const m = monthIndex(monthYear[1]);
    return locale === 'zh' ? `${monthYear[2]}年${m+1}月` : new Intl.DateTimeFormat('tr-TR',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+monthYear[2],m,1)));
  }
  const countdown = /^(.*?)in (\d+) d$/.exec(text);
  if (countdown) {
    // Localize the whole descriptor too, not just the changing number. Unknown
    // descriptors must follow the same strict catalog policy as ordinary copy.
    const descriptor = countdown[1].replace(/\s*[·—]\s*$/, '').trim();
    const prefix = descriptor ? `${translate(descriptor)} · ` : '';
    return prefix + (locale === 'zh' ? `${countdown[2]}天后` : `${countdown[2]} gün sonra`);
  }
  const people = /^(\d+) (?:person|people)$/.exec(text);
  if (people) return locale === 'zh' ? `${people[1]}人` : `${people[1]} kişi`;
  const eventDay = /^day (\d+)$/i.exec(text);
  if (eventDay) return locale === 'zh' ? `第${eventDay[1]}天` : `${eventDay[1]}. gün`;
  const leadTime = /^(\d+(?:[–-]\d+)?) days (ahead|out|after)$/.exec(text);
  if (leadTime) {
    const after = leadTime[2] === 'after';
    return locale === 'zh' ? `${leadTime[1]}天${after ? '后' : '前'}` : `${leadTime[1]} gün ${after ? 'sonra' : 'önce'}`;
  }
  /* parameterised CTA lines (EventPage, PostDetail, Faq): the variable part is a title or
     show name that is itself translated through the catalog */
  const tpl = [
    [/^Put “(.+)” to the test: at the show these people and offers are in one hall\.$/, (m) => locale === 'zh' ? `在展会上检验“${translate(m[1])}”:这些人和报价都汇聚在同一个展馆。` : `“${translate(m[1])}” konusunu fuarda test edin: bu kişiler ve teklifler tek salonda.`],
    [/^Next step after “(.+)”: a stand request, answered within the business day\.$/, (m) => locale === 'zh' ? `读完“${translate(m[1])}”之后的下一步:提交展位申请,一个工作日内回复。` : `“${translate(m[1])}” haberinden sonra sıradaki adım: stant talebi, aynı iş günü içinde yanıt.`],
    [/^Still have a question about (.+)\? Message the manager — we reply within 15 minutes during office hours\.$/, (m) => locale === 'zh' ? `关于 ${m[1]} 还有疑问?请联系经理——工作时间内 15 分钟回复。` : `${m[1]} hakkında sorunuz mu var? Yöneticiye yazın — mesai saatlerinde 15 dakikada yanıt veriyoruz.`],
    [/^(.+): frequently asked questions$/, (m) => locale === 'zh' ? `${m[1]}:常见问题` : `${m[1]}: sıkça sorulan sorular`],
    [/^Per-m² rates and services for (.+) are in the packages section\.$/, (m) => locale === 'zh' ? `${m[1]} 的每平方米价格和服务见“参展套餐”栏目。` : `${m[1]} için m² fiyatları ve hizmetler paketler bölümünde.`],
    [/^(.+), (\d{1,2}(?:–\d{1,2})? [A-Za-z]+ \d{4}), Samarkand\. Name your product and area — we send the floor plan and a quote\.$/, (m) => `${m[1]}, ${translate(m[2])}, ${locale === 'zh' ? '撒马尔罕。告诉我们产品和面积——我们发送展馆平面图和报价。' : 'Semerkant. Ürününüzü ve alanı belirtin — salon planını ve teklifi gönderelim.'}`],
    [/^Space at (.+) goes in order of request: we hold the location you pick for 3–5 days, no payment\.$/, (m) => locale === 'zh' ? `${m[1]} 的展位按申请顺序分配:您选定的位置可免费保留 3–5 天。` : `${m[1]} alanları başvuru sırasına göre verilir: seçtiğiniz yeri ödeme olmadan 3–5 gün tutarız.`],
    [/^Want to show your own product at (.+), not just walk the aisles\? Stands can be booked until opening\.$/, (m) => locale === 'zh' ? `想在 ${m[1]} 展示自己的产品,而不只是参观?开幕前均可预订展位。` : `${m[1]} fuarında sadece gezmek değil, kendi ürününüzü göstermek mi istiyorsunuz? Stantlar açılışa kadar rezerve edilebilir.`],
    [/^Business-programme slots at (.+) go to exhibitors and partners first — a stand request opens the door to a talk\.$/, (m) => locale === 'zh' ? `${m[1]} 的商务活动发言名额优先给参展商和合作伙伴——提交展位申请即可争取演讲机会。` : `${m[1]} iş programındaki konuşma slotları önce katılımcılara ve ortaklara verilir — stant talebi konuşma fırsatı açar.`],
    [/^(.+) has closed\. Leave a request and we will send the next edition's dates and early-booking terms\.$/, (m) => locale === 'zh' ? `${m[1]} 已结束。留下申请,我们将发送下一届日期和早鸟预订条件。` : `${m[1]} sona erdi. Talep bırakın, bir sonraki fuarın tarihlerini ve erken rezervasyon koşullarını gönderelim.`],
  ];
  tpl.push([/^Getting to (.+): 16 km from Samarkand International Airport · 23 km from the railway station$/, (m) => locale === 'zh' ? `前往 ${m[1]}:距撒马尔罕国际机场 16 公里 · 距火车站 23 公里` : `${m[1]} fuarına ulaşım: Semerkant Uluslararası Havalimanı'na 16 km · tren istasyonuna 23 km`]);
  for (const [re, fn] of tpl) { const m = re.exec(text); if (m) return fn(m); }
  const duration = /^(\d+) days\.$/.exec(text);
  if (duration) return locale === 'zh' ? `${duration[1]}天。` : `${duration[1]} gün.`;
  const reading = /^(\d+) min$/.exec(text);
  if (reading) return locale === 'zh' ? `${reading[1]}分钟` : `${reading[1]} dk`;
  const days = /^in (\d+) days$/.exec(text);
  if (days) return locale === 'zh' ? `${days[1]}天后` : `${days[1]} gün sonra`;
  const minutes = /^(\d+) min read$/.exec(text);
  if (minutes) return locale === 'zh' ? `阅读约${minutes[1]}分钟` : `${minutes[1]} dk okuma`;
  return null;
}
export function translator(locale, { collect, missing, strict = false } = {}) {
  return function translate(value) {
    const key = normalize(value);
    if (!isCopy(key) && !reviewed[key]) return value.replace(/м²/g, 'm²');
    const dynamic = dynamicText(key, locale, translate);
    if (dynamic != null) return value.replace(key, dynamic);
    collect?.add(key);
    const translated = dictionaries[locale]?.[key];
    if (!translated) {
      missing?.add(key);
      if (strict) throw new Error(`Missing ${locale} translation: ${key}`);
      return value;
    }
    return value.replace(value.trim(), translated);
  };
}
function rewriteJSON(data, text, locale, key = '') {
  if (key === 'inLanguage' && Array.isArray(data)) return data;
  if (Array.isArray(data)) return data.map(v => rewriteJSON(v, text, locale, key));
  if (data && typeof data === 'object') return Object.fromEntries(Object.entries(data).map(([k,v]) => [k,rewriteJSON(v,text,locale,k)]));
  if (typeof data !== 'string') return data;
  if (key === 'inLanguage') return languageTags[locale];
  if (key === 'locale') return locale;
  if (key === 'availableLanguage') return data; // organization-wide capabilities, not page language
  return jsonTextKeys.has(key) ? text(data) : localizedURL(data, locale);
}
const scriptWords = new Set(['Results:', 'Results', 'Show more', 'Show less', 'Open', 'Close', 'Copy link', 'Copied', 'Received.', 'day', 'days', 'Check the fields.', 'Page', 'Exhibition', 'News', 'Insights']);
function scriptCopy(value) {
  return scriptWords.has(value.trim()) || (/[A-Za-z]{2}\s+[A-Za-z]{2}/.test(value) && !/[{}_<>;=\[\]\\]|\b(?:return|const|function)\b/.test(value) && !value.startsWith('/'));
}
function rewriteScript(source, text, locale) {
  const file = ts.createSourceFile('inline.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // Property names, selectors, event names, API payload keys are never translated.
      const isKey = (ts.isPropertyAssignment(node.parent) && node.parent.name === node) || ts.isElementAccessExpression(node.parent);
      let value = node.text;
      const parent = node.parent;
      const technicalCall = ts.isCallExpression(parent) && ts.isPropertyAccessExpression(parent.expression)
        && (['querySelector','querySelectorAll','getElementById','matches','closest','addEventListener','removeEventListener'].includes(parent.expression.name.text) || parent.expression.expression.getText(file).endsWith('.classList'));
      const technicalAssignment = ts.isBinaryExpression(parent) && ts.isPropertyAccessExpression(parent.left) && ['className','id','style'].includes(parent.left.name.text);
      if (!isKey && !technicalCall && !technicalAssignment) {
        const field = ts.isPropertyAssignment(node.parent) ? node.parent.name.getText(file).replace(/["']/g, '') : '';
        if (scriptCopy(value) || ['title', 'text', 'label', 'description'].includes(field)) value = text(value);
        else value = localizedURL(value, locale);
        if (value !== node.text) edits.push([node.getStart(file), node.end, JSON.stringify(value).replace(/</g, '\\u003c')]);
      }
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      if (scriptCopy(node.text)) {
        const value = text(node.text);
        if (value !== node.text) {
          const start = node.getStart(file) + 1;
          const end = node.end - (ts.isTemplateTail(node) ? 1 : 2);
          edits.push([start, end, value.replace(/[`\\]/g, '\\$&').replace(/\$\{/g, '\\${')]);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  for (const [start, end, value] of edits.sort((a,b) => b[0]-a[0])) source = source.slice(0,start)+value+source.slice(end);
  return source;
}
export function localizeHTML(html, locale, options = {}) {
  const text = translator(locale, options);
  const doc = parse(html);
  function visit(node, skip = false) {
    const tag = node.tagName;
    // Native language names and branded marks must not be translated.
    const languageLink = !!attr(node, 'hreflang');
    const noTranslate = skip || attr(node, 'translate') === 'no' || languageLink || tag === 'style' || tag === 'code' || tag === 'pre';
    if (tag === 'html' || (attr(node,'lang') === 'en' && !languageLink)) put(node, 'lang', languageTags[locale]);
    if (node.nodeName === '#text' && !noTranslate) node.value = text(node.value);
    if (node.attrs) {
      for (const a of node.attrs) {
        if (!noTranslate && textualAttrs.has(a.name)) a.value = text(a.value);
        if (['href','action','data-url'].includes(a.name) && !languageLink) a.value = localizedURL(a.value,locale);
      }
      if (tag === 'a' && languageLink) {
        if (attr(node,'hreflang') === languageTags[locale]) put(node,'aria-current','true');
        else strip(node,'aria-current');
      }
      if (tag === 'meta') {
        const key = attr(node,'name') || attr(node,'property');
        if (['description','og:title','og:description','twitter:title','twitter:description','og:image:alt'].includes(key)) put(node,'content',text(attr(node,'content') || ''));
        if (key === 'og:locale') put(node,'content',ogTags[locale]);
        if (key === 'og:locale:alternate' && attr(node,'content') === ogTags[locale]) put(node,'content',ogTags.en);
        if (['og:url','refresh'].includes(key)) put(node,'content',localizedURL(attr(node,'content') || '',locale));
      }
      if (tag === 'link' && attr(node,'hreflang') === 'zh') put(node,'hreflang','zh-CN');
      if (tag === 'summary' && node.parentNode?.attrs?.some(a => a.name === 'class' && a.value.includes('language-picker'))) {
        for (const child of node.childNodes ?? []) if (child.tagName === 'span' && !attr(child,'aria-hidden')) child.childNodes = [{nodeName:'#text',value:locale === 'zh' ? '中文' : 'TR',parentNode:child}];
      }
    }
    if (tag === 'script') {
      for (const child of node.childNodes ?? []) {
        if (child.nodeName !== '#text') continue;
        if (attr(node,'type') === 'application/ld+json') {
          child.value = JSON.stringify(rewriteJSON(JSON.parse(child.value),text,locale)).replace(/</g,'\\u003c');
        } else if (!attr(node,'src')) child.value = rewriteScript(child.value,text,locale);
      }
      return;
    }
    for (const child of node.childNodes ?? []) visit(child,noTranslate);
  }
  visit(doc);
  return serialize(doc);
}
const xmlEscape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const xmlDecode = s => {
  const fragment = parseFragment(s.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1'));
  const plain = n => n.nodeName === '#text' ? n.value : (n.childNodes ?? []).map(plain).join('');
  return plain(fragment);
};
export function localizeRSS(xml, locale, options = {}) {
  const text = translator(locale,options);
  return xml.replace(/<(title|description|category)>([\s\S]*?)<\/\1>/g, (_,tag,value) => `<${tag}>${xmlEscape(text(xmlDecode(value)))}</${tag}>`)
    .replace(/<(link|guid)([^>]*)>([\s\S]*?)<\/\1>/g, (_,tag,attrs,value) => `<${tag}${attrs}>${localizedURL(value,locale)}</${tag}>`)
    .replace(/<language>en<\/language>/g, `<language>${languageTags[locale]}</language>`);
}

export function localizeSearchJSON(source, locale, options = {}) {
  return JSON.stringify(rewriteJSON(JSON.parse(source),translator(locale,options),locale));
}
