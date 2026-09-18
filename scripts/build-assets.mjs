// One-off asset generation: social card + favicons from the source imagery.
import sharp from "sharp";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";

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

// --- per-host brand icons: public/brand/<id>/favicon.svg -> favicon.png + apple-touch-icon.png ----
/* A branded host shares the layout of the centre but not its face: the same social card is retyped
   from brand-map.json, so a show link unfurls in the show's own colours. City and venue only — no
   dates, because dates change every edition and a duplicated fact would drift. */
const brandRoot = "public/brand";
const brands = JSON.parse(readFileSync("src/data/brand-map.json", "utf8"));
const ORN = `<g fill="none" stroke="{c}" stroke-width="1.5" stroke-linecap="round">
  <path d="M8 40C8 24 20 12 36 12c10 0 16 6 16 13 0 6-5 10-10 10-4 0-7-3-7-6 0-3 2-5 5-5"/>
  <path d="M88 8C88 24 76 36 60 36c-10 0-16-6-16-13 0-6 5-10 10-10 4 0 7 3 7 6 0 3-2 5-5 5"/>
  <path d="M48 5c6-4 12-3 16 2-6 4-12 3-16-2z"/>
  <path d="M48 43c-6 4-12 3-16-2 6-4 12-3 16 2z"/>
  <circle cx="48" cy="24" r="1.5" fill="{c}" stroke="none"/></g>`;
if (existsSync(brandRoot)) {
  for (const [slug, b] of Object.entries(brands.hosts ?? {})) {
    const dir = `${brandRoot}/${b.id}`;
    const fav = `${dir}/favicon.svg`;
    if (!existsSync(fav)) continue;
    const svg = readFileSync(fav);
    await sharp(svg, { density: 400 })
      .resize(512, 512)
      .png()
      .toFile(`${dir}/favicon.png`);
    await sharp(svg, { density: 400 })
      .resize(180, 180)
      .png()
      .toFile(`${dir}/apple-touch-icon.png`);
    console.log(
      `brand icons: ${b.id} (favicon.png 512, apple-touch-icon.png 180)`,
    );
    const c = b.palette;
    const band = Array.from({ length: 13 }, (_, n) =>
      ORN.replaceAll("{c}", c.ornament).replace(
        "<g ",
        `<g transform="translate(${n * 96} 24)" `,
      ),
    ).join("");
    const card = `<svg width="1200" height="630">
  <rect width="1200" height="630" fill="${c.evergreen}"/>
  ${band}
  <g fill="none" transform="translate(70 250) scale(1.35)">
    <rect x="3.25" y="3.25" width="57.5" height="57.5" stroke="${c.cream}" stroke-width="6.5" stroke-linejoin="round"/>
    <rect x="3.25" y="3.25" width="57.5" height="57.5" stroke="${c.goldSoft}" stroke-width="6.5" stroke-linejoin="round" transform="rotate(45 32 32)"/>
  </g>
  <text x="70" y="420" font-family="Helvetica, Arial, sans-serif" font-size="104" font-weight="700" fill="${c.cream}" letter-spacing="-3">${b.name.en}</text>
  <text x="74" y="472" font-family="Menlo, Consolas, monospace" font-size="30" fill="${c.ornament}" letter-spacing="10">${b.sub.en}</text>
  <text x="74" y="548" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="${c.cream}" opacity="0.82">Samarkand · SOF EXPO Samarkand</text>
  <text x="74" y="592" font-family="Menlo, Consolas, monospace" font-size="25" fill="${c.goldSoft}" letter-spacing="1.4">${b.host}</text>
</svg>`;
    await sharp(Buffer.from(card))
      .jpeg({ quality: 82 })
      .toFile(`${dir}/og.jpg`);
    console.log(`brand card: ${dir}/og.jpg`);
  }
}
