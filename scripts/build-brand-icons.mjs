// Show icons from the real logos (images/brand-masters/): the mark of each show's logo — FOODERA's
// eight-pointed star, AGROPRO's leaves, BUILD PRO's roof, WORLD EDU's owl, e-com's "e" — on a
// rounded square in the logo's own background. Writes public/brand/<id>/{favicon.png 512,
// apple-touch-icon.png 180, favicon.svg}. Run by hand after a logo changes:
//   node scripts/build-brand-icons.mjs
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const M = "images/brand-masters";
/* crop = the mark's box inside the master (px); bg = the logo's own ground; text = drawn mark
   for a logo that is a wordmark only */
const ICONS = [
  { id: "foodera", src: `${M}/foodera-expo-horizontal.png`, crop: [0, 0, 240, 240], bg: "#ffffff" },
  { id: "agropro", src: `${M}/agropro-expo-logo.png`, crop: [0, 0, 250, 240], bg: "#ffffff" },
  { id: "buildpro", src: `${M}/buildpro-expo-logo.png`, crop: [0, 0, 186, 176], bg: "#1b232d", trimBg: true },
  { id: "world-edu", src: `${M}/world-edu-logo.png`, crop: [0, 0, 262, 240], bg: "#ffffff" },
  /* the e-com master's dark ground carries a faint pattern: keep only the teal "e" */
  { id: "ecom-retail", src: `${M}/ecom-retail-expo-logo.png`, crop: [0, 0, 140, 128], bg: "#171717", keepTeal: true },
  { id: "promotors", text: "P", color: "#d7192b", bg: "#141414" },
];

const roundMask = (size, r) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`);

async function markBuffer(icon, inner) {
  if (icon.text) {
    return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${inner}" viewBox="0 0 100 100">
      <text x="50" y="80" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-style="italic" font-size="96" fill="${icon.color}">${icon.text}</text></svg>`))
      .png().toBuffer();
  }
  const [left, top, width, height] = icon.crop;
  let img = sharp(icon.src).extract({ left, top, width, height });
  if (icon.keepTeal) {
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const teal = data[i + 1] - data[i]; // green over red: the "e" is ~+100, the grey ground ~0
      data[i + 3] = teal > 40 ? 255 : teal > 20 ? Math.round(((teal - 20) / 20) * 255) : 0;
    }
    img = sharp(data, { raw: info });
    return sharp(await img.png().toBuffer()).trim({ threshold: 1 })
      .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  }
  /* trim against the ground colour (or transparency) so the mark is centred on its own pixels */
  img = sharp(await img.png().toBuffer()).trim(icon.trimBg ? { background: icon.bg, threshold: 40 } : { threshold: 10 });
  return img.resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

async function iconPng(icon, size) {
  const pad = Math.round(size * 0.14);
  const mark = await markBuffer(icon, size - pad * 2);
  const square = await sharp({ create: { width: size, height: size, channels: 4, background: icon.bg } })
    .composite([{ input: mark, left: pad, top: pad }])
    .png()
    .toBuffer();
  return sharp(square)
    .composite([{ input: roundMask(size, Math.round(size * 0.18)), blend: "dest-in" }])
    .png()
    .toBuffer();
}

for (const icon of ICONS) {
  const dir = `public/brand/${icon.id}`;
  writeFileSync(`${dir}/favicon.png`, await iconPng(icon, 512));
  writeFileSync(`${dir}/apple-touch-icon.png`, await iconPng(icon, 180));
  const small = (await iconPng(icon, 128)).toString("base64");
  writeFileSync(
    `${dir}/favicon.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img"><image width="64" height="64" href="data:image/png;base64,${small}"/></svg>\n`,
  );
  console.log(`brand icon: ${icon.id}`);
}
