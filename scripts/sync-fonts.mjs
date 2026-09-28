/**
 * Builds the woff2 files in public/fonts/ from the two TT Norms Pro variable TTFs that
 * live at the repository root:
 *
 *   TTNormsProVariable.ttf      → tt-norms-pro-{latin,latin-ext,cyrillic}.woff2
 *   TTNormsProMonoVariable.ttf  → tt-norms-pro-mono-{latin,latin-ext,cyrillic}.woff2
 *
 * Why subsets and not the TTFs as they are: the variable file is a single 1.45 MB face with
 * 2 081 glyphs covering every script at once. A page that only shows English would pay for
 * Turkish and Cyrillic too. Splitting by unicode-range keeps the weight where it was before
 * this migration (a Latin page downloads ~114 KB + ~42 KB of mono instead of ~123 KB of
 * Inter Tight + Golos Text + JetBrains Mono), and an English visitor never fetches a
 * Cyrillic byte.
 *
 * src/styles/fonts.css declares these six faces by hand with their unicode-ranges intact.
 * The committed woff2 files are build artefacts checked in on purpose — see below.
 *
 *   npm run fonts:sync
 *
 * Requires fonttools (a one-off dev tool, deliberately NOT an npm dependency, so `npm ci`
 * never installs it):
 *
 *   pip install fonttools brotli     # or: python3 -m pip install --user fonttools brotli
 *
 * Without it the script leaves the committed woff2 files alone and tells you what is missing,
 * so `npm run build` never breaks on a machine that has no Python toolchain.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'fonts');

/** every source face: TTF at the repo root → woff2 basename in public/fonts */
const SOURCES = [
  { ttf: 'TTNormsProVariable.ttf', out: 'tt-norms-pro' },
  { ttf: 'TTNormsProMonoVariable.ttf', out: 'tt-norms-pro-mono' },
];

/**
 * The three scripts this site renders, in the order src/styles/fonts.css declares them.
 * Latin first (every page), then the ranges that only some locales reach.
 */
const SUBSETS = {
  /* every page: ASCII, the Latin-1 block, common punctuation/quotes/dashes, €, №-adjacent
     symbols and the arrows the cards and CTAs use (→ ↗ ↑ ↓) */
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,' +
    'U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+2264-2265,U+FEFF,U+FFFD',
  /* Latin Extended-A: the Turkish İ/ı/Ş/ş/Ğ/ğ the tr edition is built on */
  'latin-ext': 'U+0100-017F',
  /* Russian plus the Uzbek/Kazakh letters (Ґ Ұ) and № */
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
};

/**
 * Layout features to keep. `kern` carries the whole GPOS kerning table — dropping it would
 * flatten the spacing of every headline. `tnum` backs `font-variant-numeric: tabular-nums`,
 * which the stat blocks, dates and tables rely on. Everything else (small caps, stylistic
 * sets, fractions) is unused here and only costs bytes.
 */
const FEATURES = 'kern,mark,mkmk,calt,ccmp,liga,locl,tnum';

/** the fonttools CLI, as an argv prefix — the standalone script or `python -m fontTools.subset` */
function pyftsubset() {
  const candidates = [
    ['pyftsubset', ['--help']],
    ['python3', ['-c', 'import fontTools.subset']],
    ['python', ['-c', 'import fontTools.subset']],
  ];
  for (const [bin, probe] of candidates) {
    try {
      execFileSync(bin, probe, { stdio: 'ignore' });
      return bin === 'pyftsubset' ? [bin] : [bin, '-m', 'fontTools.subset'];
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

const tool = pyftsubset();
if (!tool) {
  console.log('fonttools not found — keeping the committed woff2 files in public/fonts/.');
  console.log('To rebuild them from the TTFs at the repository root:');
  console.log('  pip install fonttools brotli && npm run fonts:sync');
  process.exit(0);
}

await mkdir(OUT, { recursive: true });

let total = 0;
for (const { ttf, out } of SOURCES) {
  const src = join(ROOT, ttf);
  try {
    await stat(src);
  } catch {
    console.error(`missing source font: ${ttf} (expected at the repository root)`);
    process.exit(1);
  }
  for (const [subset, unicodes] of Object.entries(SUBSETS)) {
    const to = join(OUT, `${out}-${subset}.woff2`);
    execFileSync(
      tool[0],
      [
        ...tool.slice(1),
        src,
        `--output-file=${to}`,
        '--flavor=woff2',
        `--unicodes=${unicodes}`,
        `--layout-features=${FEATURES}`,
        '--name-IDs=*',
        '--name-legacy',
        '--name-languages=*',
        '--notdef-outline',
      ],
      { stdio: 'pipe' },
    );
    const { size } = await stat(to);
    total += size;
    console.log(`  ${out}-${subset}.woff2  ${(size / 1024).toFixed(0)} KB`);
  }
}
console.log(`\nfont payload: ${(total / 1024).toFixed(0)} KB across ${SOURCES.length * 3} files`);
