/**
 * Copies the two site families into public/fonts/ from their npm packages:
 *
 *   @fontsource-variable/manrope → manrope-{latin,latin-ext,cyrillic}.woff2
 *   @fontsource-variable/onest   → onest-{latin,latin-ext,cyrillic}.woff2
 *
 * The woff2 files are committed (a build never needs the packages); run this after bumping
 * either package. src/styles/fonts.css declares the six faces with their unicode-ranges.
 *
 *   npm run fonts:sync
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'fonts');
await mkdir(out, { recursive: true });
for (const family of ['manrope', 'onest']) {
  for (const subset of ['latin', 'latin-ext', 'cyrillic']) {
    const from = join(root, 'node_modules', '@fontsource-variable', family, 'files', `${family}-${subset}-wght-normal.woff2`);
    await copyFile(from, join(out, `${family}-${subset}.woff2`));
    console.log(`fonts: ${family}-${subset}.woff2`);
  }
}
