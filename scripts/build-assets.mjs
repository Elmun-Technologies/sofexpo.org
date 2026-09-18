// One-off asset generation: social card + favicons from the source imagery.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("public/og", { recursive: true });

const W = 1200;
const H = 630;
/* The card is built from the same system as the site: flat brand ground, a measured module
   grid, hard rules instead of pills, and the (still synthetic) exterior used as a greyscale
   panel at the right edge rather than as a "photo of the venue" hero. No gold, no gradient
   wash, no rounded corners. */
const grid = Array.from(
  { length: 17 },
  (_, i) =>
    `<rect x="${75 * i}" y="0" width="1" height="${H}" fill="#ffffff" opacity="0.05"/>`,
).join("");
const rows = Array.from(
  { length: 9 },
  (_, i) =>
    `<rect x="0" y="${70 * i}" width="${W}" height="1" fill="#ffffff" opacity="0.05"/>`,
).join("");
const overlay = `<svg width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#0f2b1c"/>
  ${grid}${rows}
  <g>
    <rect x="70" y="120" width="14" height="14" fill="#ffffff"/>
    <rect x="90" y="120" width="14" height="14" fill="#ffffff"/>
    <rect x="110" y="120" width="14" height="14" fill="#ffffff"/>
    <rect x="70" y="142" width="54" height="3" fill="#ffffff" opacity="0.55"/>
  </g>
  <rect x="70" y="182" width="640" height="2" fill="#ffffff"/>
  <text x="68" y="266" font-family="Helvetica, Arial, sans-serif" font-size="66" font-weight="700" fill="#ffffff" letter-spacing="-2">SOF EXPO</text>
  <text x="68" y="330" font-family="Helvetica, Arial, sans-serif" font-size="66" font-weight="700" fill="#ffffff" letter-spacing="-2">SAMARKAND</text>
  <text x="72" y="372" font-family="Menlo, Consolas, monospace" font-size="21" fill="#ffffff" opacity="0.72" letter-spacing="2.6">EXHIBITION CENTRE · TRADE SHOWS</text>
  <text x="72" y="436" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#ffffff">4 400 m² hall · 5 000 m² open-air</text>
  <text x="72" y="472" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#ffffff">20+ events a year · 70 000+ visitors</text>
  <text x="72" y="540" font-family="Menlo, Consolas, monospace" font-size="22" fill="#ffffff" opacity="0.8" letter-spacing="1.6">sofexpo.org</text>
  <rect x="70" y="566" width="640" height="1" fill="#ffffff" opacity="0.3"/>
</svg>`;

const panelW = 430;
const panel = await sharp("public/images/venue-exterior.jpg")
  .grayscale()
  .linear(1.12, -8)
  .resize(panelW, H, { fit: "cover", position: "centre" })
  .toBuffer();
await sharp({
  create: { width: W, height: H, channels: 3, background: "#0f2b1c" },
})
  .composite([
    { input: Buffer.from(overlay) },
    { input: panel, left: W - panelW, top: 0 },
    {
      input: Buffer.from(
        `<svg width="${panelW}" height="${H}"><rect width="1" height="${H}" fill="#ffffff" opacity="0.5"/></svg>`,
      ),
      left: W - panelW,
      top: 0,
    },
  ])
  .jpeg({ quality: 82, progressive: true })
  .toFile("public/og/default.jpg");

await sharp("public/favicon.svg")
  .resize(512, 512)
  .png()
  .toFile("public/favicon.png");
await sharp("public/favicon.svg")
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon.png");

console.log("public/og/default.jpg + favicons written");
