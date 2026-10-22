// Cromatic · stories in Lottie · story A6 (TASK-065g): renderV6.mjs JOB=a6's captures into the story's frames
// (design/stories/lottie/frames/a6/<shot>-NNN.webp, 1080 x 1920, local only: gitignored, rebuilt from RAW by this
// script): the plate, the ride over it (its own render: its matte stays in RAW with the camera's numbers, a6.json,
// for the composite of a better car), OMA's room under its glass (the plate's flat glass keyed out) with a faint
// reflection of the street on the glass.   node framesA6.mjs [shots]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const RAW = (process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw") + "/v6", R = RAW + "/a6";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, process.env.OUTDIR || "../frames/a6");
fs.mkdirSync(OUT, { recursive: true });
const J = JSON.parse(fs.readFileSync(RAW + "/a6.json", "utf8")), only = (process.argv[2] || Object.keys(J).join(",")).split(",");
const index = fs.existsSync(path.join(OUT, "index.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf8")) : {};
for (const k of only) {
  const rec = J[k], names = [];
  for (let i = 0; i < rec.cams.length; i++) {
    const n = String(i).padStart(3, "0"), comp = [];
    let base;
    if (k === "oma") {
      // the glass: its one flat lit colour keyed out (soft at its edge), the room under it, a faint reflection over it
      const pl = await sharp(`${R}/oma-plate-${n}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), d = pl.data, K = process.env.KEY ? process.env.KEY.split(",").map(Number) : [215, 166, 89]; // (C8 at night: KEY=232,193,119)
      for (let q = 0; q < d.length; q += 4) { const e = Math.abs(d[q] - K[0]) + Math.abs(d[q + 1] - K[1]) + Math.abs(d[q + 2] - K[2]); d[q + 3] = e < 10 ? 0 : e > 40 ? 255 : Math.round((255 * (e - 10)) / 30); }
      const front = await sharp(d, { raw: { width: pl.info.width, height: pl.info.height, channels: 4 } }).png().toBuffer();
      const refl = Buffer.from(`<svg width="${pl.info.width}" height="${pl.info.height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0.35"><stop offset="0.32" stop-color="#fff6e8" stop-opacity="0"/><stop offset="${0.42 + i * 0.0012}" stop-color="#fff6e8" stop-opacity="0.16"/><stop offset="${0.5 + i * 0.0012}" stop-color="#fff6e8" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
      base = await sharp(`${R}/oma-room-${n}.png`).flatten({ background: "#3a2412" }).composite([{ input: refl }, { input: front }]).png().toBuffer();
    } else base = await sharp(`${R}/${k}-plate-${n}.png`).png().toBuffer();
    const r = rec.car[i]; if (r && fs.existsSync(`${R}/${k}-car-${n}.png`)) comp.push({ input: `${R}/${k}-car-${n}.png`, left: r[0], top: r[1] });
    const full = comp.length ? await sharp(base).composite(comp).png().toBuffer() : base;
    const nm = `${k}-${n}`; await sharp(full).resize(1080, 1920).removeAlpha().webp({ quality: 84, effort: 4 }).toFile(path.join(OUT, nm + ".webp"));
    names.push(nm);
  }
  index[k] = names; console.log(k, names.length);
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
