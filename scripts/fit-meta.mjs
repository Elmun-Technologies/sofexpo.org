/* Post-build: keep <title> and meta description SERP-safe on every locale (after zh/tr editions
 * are generated, so translation keys stay the full authored strings). Cuts at a sentence or clause
 * boundary; never mid-word. Google shows ~160 chars of description / ~60–70 of title. */
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2] ?? 'dist';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const enc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cjk = (s) => /[\u3000-\u9fff]/.test(s);
export function fitDescription(d, max = 160) {
  const t = d.replace(/\s+/g, ' ').trim();
  if (cjk(t)) max = Math.round(max / 2); // CJK glyphs are double-width in the SERP
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sent = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '), cut.lastIndexOf('。'));
  if (sent >= max * 0.55) return cut.slice(0, sent + 1);
  const clause = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf('; '), cut.lastIndexOf(' — '), cut.lastIndexOf('，'));
  if (clause >= max * 0.6) return cut.slice(0, clause) + (cjk(t) ? '。' : '.');
  const sp = cut.lastIndexOf(' ');
  return (sp > 0 ? cut.slice(0, sp) : cut).replace(/[,;:—–-]+$/, '') + '…';
}
export function fitTitle(t, max = 70) {
  if (cjk(t)) max = 36;
  if (t.length <= max) return t;
  for (const sep of [' — ', ': ', ' | ', '：', '——']) {
    const i = t.lastIndexOf(sep, max);
    if (i >= max * 0.4) return t.slice(0, i);
  }
  return t;
}
if (process.argv[1]?.endsWith('fit-meta.mjs')) {
  let n = 0;
  for (const f of walk(root)) {
    const h = fs.readFileSync(f, 'utf8');
    const out = h
      .replace(/<title>([^<]*)<\/title>/, (m, t) => `<title>${enc(fitTitle(dec(t)))}</title>`)
      .replace(/(<meta name="description" content=")([^"]*)(")/, (m, a, d, b) => a + enc(fitDescription(dec(d))) + b);
    if (out !== h) { fs.writeFileSync(f, out); n++; }
  }
  console.log(`fit-meta: ${n} pages trimmed to SERP length`);
}
