/**
 * Copies the woff2 subsets this site actually renders out of the @fontsource-variable
 * packages into public/fonts/.
 *
 * Why not just `import '@fontsource-variable/inter-tight/wght.css'`? Because those
 * stylesheets declare every subset the family ships — 17 files across our three
 * families, including greek, greek-ext and vietnamese. A scan of all 151 built pages
 * found no codepoints outside latin and cyrillic, so those subsets were downloaded
 * by nobody and paid for by everybody (inter-tight-latin-ext alone is 88 KB).
 *
 * src/styles/fonts.css declares these six faces by hand with their unicode-ranges
 * intact. Run this after bumping a @fontsource-variable dependency:
 *
 *   npm run fonts:sync
 */
import { cp, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'fonts');

/** family (npm package name) → subsets to ship */
const WANTED = {
  'inter-tight': ['latin', 'latin-ext', 'cyrillic'],
  'golos-text': ['latin', 'latin-ext', 'cyrillic'],
  'jetbrains-mono': ['latin', 'latin-ext', 'cyrillic'],
};

await mkdir(OUT, { recursive: true });

let total = 0;
for (const [family, subsets] of Object.entries(WANTED)) {
  for (const subset of subsets) {
    const from = join(ROOT, 'node_modules', '@fontsource-variable', family, 'files', `${family}-${subset}-wght-normal.woff2`);
    const to = join(OUT, `${family}-${subset}.woff2`);
    await cp(from, to);
    const { size } = await stat(to);
    total += size;
    console.log(`  ${family}-${subset}.woff2  ${(size / 1024).toFixed(0)} KB`);
  }
}
console.log(`\nfont payload: ${(total / 1024).toFixed(0)} KB across ${Object.values(WANTED).flat().length} files`);
