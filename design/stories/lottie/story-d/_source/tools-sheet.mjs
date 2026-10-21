// a contact sheet of PNG layers on a checkerboard (QA): node tools-sheet.mjs out.jpg a.png b.png ...
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const [out, ...files] = process.argv.slice(2);
const TW = +process.env.TW || 360;
const tiles = [];
for (const f of files) {
  const m = await sharp(f).metadata(); const th = Math.round((TW * m.height) / m.width);
  const sq = 12, svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${th}"><defs><pattern id="p" width="${sq * 2}" height="${sq * 2}" patternUnits="userSpaceOnUse"><rect width="${sq * 2}" height="${sq * 2}" fill="#ddd"/><rect width="${sq}" height="${sq}" fill="#999"/><rect x="${sq}" y="${sq}" width="${sq}" height="${sq}" fill="#999"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>`;
  const img = await sharp(f).resize(TW).png().toBuffer();
  tiles.push({ buf: await sharp(Buffer.from(svg)).composite([{ input: img }]).png().toBuffer(), h: th });
}
const H = Math.max(...tiles.map((t) => t.h));
await sharp({ create: { width: (TW + 6) * tiles.length, height: H, channels: 3, background: "#111" } }).composite(tiles.map((t, i) => ({ input: t.buf, left: i * (TW + 6), top: 0 }))).jpeg({ quality: 85 }).toFile(out);
console.log("sheet", out);
