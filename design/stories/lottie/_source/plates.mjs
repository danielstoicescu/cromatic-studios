// Cromatic · stories in Lottie (TASK-057): the renders (RAW, big PNGs from render.mjs) into the stories' plates
// (design/stories/lottie/images/*.webp), cropped to what they hold, with the numbers build.mjs needs (plates.json).
// Sketchbook's layers come out of its notebook pass on paper: each is cut out with the alpha of the same layer in
// colour (the same geometry from the same camera), a few pixels wider for the pencil's outline round it.
//   node plates.mjs
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/raw";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
fs.mkdirSync(OUT, { recursive: true });
const Q = +process.env.Q || 86;
const meta = {};

async function rgba(file) { const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; }
// the box of what is drawn (alpha > 2), padded, even-sized
function bbox(img, pad = 6) {
  const { data, w, h } = img; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return [0, 0, 2, 2];
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
// a separable max filter on the alpha channel (the pencil's outline reaches a little past the colour's silhouette)
function dilate(a, w, h, r) {
  const t = new Uint8Array(a.length), o = new Uint8Array(a.length);
  for (let y = 0; y < h; y++) { const row = y * w; for (let x = 0; x < w; x++) { let m = 0; for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) { const v = a[row + k]; if (v > m) m = v; } t[row + x] = m; } }
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { let m = 0; for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) { const v = t[k * w + x]; if (v > m) m = v; } o[y * w + x] = m; }
  return o;
}
async function write(name, img, { crop = true, opaque = false } = {}) {
  const [x, y, w, h] = crop ? bbox(img) : [0, 0, img.w, img.h];
  let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract({ left: x, top: y, width: w, height: h });
  if (opaque) s = s.removeAlpha();
  const file = path.join(OUT, name + ".webp");
  await s.webp({ quality: Q, alphaQuality: 92, effort: 5, smartSubsample: true }).toFile(file);
  meta[name] = { file: path.basename(file), x, y, w, h, full: [img.w, img.h], kb: Math.round(fs.statSync(file).size / 1024) };
  console.log(name, meta[name]);
}
const shots = JSON.parse(fs.readFileSync(path.join(RAW, "a-street.json"), "utf8"));
// A1 · the three lenses of the bird's eye (opaque)
for (let i = 0; i < 3; i++) await write(`a-air-${i}`, await rgba(`${RAW}/a-air-${i}-full.png`), { crop: false, opaque: true });
// A2, B · the street layers in colour
for (const s of ["a-street", "b-street"]) for (const l of ["sky", "far", "mid", "near", "ground"]) await write(`${s}-${l}`, await rgba(`${RAW}/${s}-${l}.png`), { crop: l !== "sky", opaque: l === "sky" });
// B · the same layers in Sketchbook: its pixels, the colour layer's alpha (dilated)
for (const l of ["sky", "far", "mid", "near", "ground"]) {
  const sk = await rgba(`${RAW}/b-sketch-${l}.png`);
  if (l !== "sky") {
    const col = await rgba(`${RAW}/b-street-${l}.png`);
    if (col.w !== sk.w || col.h !== sk.h) throw new Error("size " + l);
    const a = new Uint8Array(col.w * col.h); for (let i = 0; i < a.length; i++) a[i] = col.data[i * 4 + 3];
    const d = dilate(a, col.w, col.h, +process.env.DIL || 5);
    for (let i = 0; i < a.length; i++) sk.data[i * 4 + 3] = d[i];
  }
  await write(`b-sketch-${l}`, sk, { crop: l !== "sky", opaque: l === "sky" });
}
// the numbers of the shots (horizon, focal length, pins, bulbs) next to the plates
const nums = {};
for (const s of ["a-air", "a-street", "b-street"]) nums[s] = JSON.parse(fs.readFileSync(path.join(RAW, s + ".json"), "utf8"));
const strip = (o) => { const { files, count, ...rest } = o; return { ...rest, stats: count?.stats }; };
fs.writeFileSync(path.join(here, "plates.json"), JSON.stringify({ plates: meta, shots: Object.fromEntries(Object.entries(nums).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, strip(vv)]))])) }, null, 1));
console.log("plates", Object.values(meta).reduce((s, m) => s + m.kb, 0), "KB");
