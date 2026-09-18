// One-off asset generation: social card + favicons from the source imagery.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("public/og", { recursive: true });

const W = 1200;
const H = 630;
/* The calmest version of the card: flat brand ground, one rule, typeset facts, and the exterior
   as a plain panel. No grid texture, no desaturation, no accent colour — those were decoration
   for its own sake (docs/07 §7). The exterior is still a render, so the card says nothing about
   it being photography. */
const overlay = `<svg width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#0f2b1c"/>
  <rect x="70" y="132" width="34" height="34" fill="none" stroke="#ffffff" stroke-width="2"/>
  <rect x="112" y="132" width="34" height="34" fill="#ffffff"/>
  <text x="68" y="300" font-family="Helvetica, Arial, sans-serif" font-size="66" font-weight="700" fill="#ffffff" letter-spacing="-2">SOF EXPO</text>
  <text x="68" y="364" font-family="Helvetica, Arial, sans-serif" font-size="66" font-weight="700" fill="#ffffff" letter-spacing="-2">SAMARKAND</text>
  <text x="72" y="410" font-family="Menlo, Consolas, monospace" font-size="21" fill="#ffffff" opacity="0.72" letter-spacing="2.6">EXHIBITION CENTRE · TRADE SHOWS</text>
  <text x="72" y="462" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#ffffff">4 400 m² hall · 5 000 m² open-air</text>
  <text x="72" y="498" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#ffffff">20+ events a year · 70 000+ visitors</text>
  <text x="72" y="556" font-family="Menlo, Consolas, monospace" font-size="22" fill="#ffffff" opacity="0.8" letter-spacing="1.6">sofexpo.org</text>
  <rect x="70" y="576" width="640" height="1" fill="#ffffff" opacity="0.3"/>
</svg>`;

const panelW = 430;
const panel = await sharp("public/images/venue-exterior.jpg")
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
