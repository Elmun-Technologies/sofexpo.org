/**
 * Every show palette in brand-map.json must keep WCAG AA (4.5:1) for the pairs the
 * components actually draw: white on the dark grounds, body/muted/accent text on the light
 * grounds, the soft accent on the dark grounds. Exit 1 on any failure.
 */
import { readFileSync } from 'node:fs';

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export function paletteProblems(p) {
  // goldSoft is text on the dark band (evergreen); evergreen-2 is only a hover ground
  const pairs = [['#ffffff', p.evergreen], ['#ffffff', p.evergreen2], [p.goldSoft, p.evergreen]];
  for (const t of ['ink', 'ink60', 'ink40']) for (const g of ['cream', 'cream2', 'line']) pairs.push([p[t], p[g]]);
  // brass/accent text sits on paper and sheets, never on the 1px rule colour
  for (const t of ['gold', 'moss']) for (const g of ['cream', 'cream2']) pairs.push([p[t], p[g]]);
  return pairs.filter(([a, b]) => ratio(a, b) < 4.5).map(([a, b]) => `${a} on ${b} = ${ratio(a, b).toFixed(2)}`);
}

if (process.argv[1]?.endsWith('check-brand-contrast.mjs')) {
  const { hosts } = JSON.parse(readFileSync('src/data/brand-map.json', 'utf8'));
  let bad = 0;
  for (const [slug, h] of Object.entries(hosts)) {
    const problems = paletteProblems(h.palette);
    bad += problems.length;
    console.log(`${problems.length ? '✗' : '✓'} ${slug}${problems.length ? ': ' + problems.join(', ') : ''}`);
  }
  process.exitCode = bad ? 1 : 0;
}
