// One-off asset generation: social card + favicons from the source imagery.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('public/og', { recursive: true });

const W = 1200;
const H = 630;
const overlay = `<svg width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0b1c12" stop-opacity="0.95"/>
      <stop offset="0.62" stop-color="#0b1c12" stop-opacity="0.62"/>
      <stop offset="1" stop-color="#0b1c12" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="70" y="196" width="64" height="6" rx="3" fill="#c58a2e"/>
  <text x="70" y="296" font-family="Helvetica, Arial, sans-serif" font-size="74" font-weight="700" fill="#ffffff" letter-spacing="-1">SOF EXPO SAMARKAND</text>
  <text x="72" y="352" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#e9c981">Exhibition centre &amp; trade shows · Samarkand, Uzbekistan</text>
  <text x="72" y="404" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#f7f4ec" fill-opacity="0.82">4 400 m² hall · 5 000 m² open-air · 20+ events · 70 000+ visitors</text>
  <text x="72" y="470" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#f7f4ec" fill-opacity="0.7">sofexpo.org</text>
</svg>`;

const base = await sharp('public/images/venue-exterior.jpg').resize(W, H, { fit: 'cover', position: 'centre' }).toBuffer();
await sharp(base).composite([{ input: Buffer.from(overlay) }]).jpeg({ quality: 82, progressive: true }).toFile('public/og/default.jpg');

await sharp('public/favicon.svg').resize(512, 512).png().toFile('public/favicon.png');
await sharp('public/favicon.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png');

console.log('public/og/default.jpg + favicons written');
