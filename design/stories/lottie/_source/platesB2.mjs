// Cromatic · stories in Lottie · story B v2 (TASK-065): the nine worlds' layers (RAWB2) into plates (images/b2-*.webp)
// and their numbers (platesB2.json). A world with a pass of its own: its pass's pixels, its plain layer's alpha (wider
// by the pencil's line for Sketchbook). node platesB2.mjs
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/rawB2";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
const WORLDS = ["monument", "nightlife", "underwater", "circuit", "sketch", "orchid", "gta2", "riso", "ghibli"];
const plates = {};
const rgba = async (f) => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
function dilate(a, w, h, r) {
  const t = new Uint8Array(a.length), o = new Uint8Array(a.length);
  for (let y = 0; y < h; y++) { const row = y * w; for (let x = 0; x < w; x++) { let m = 0; for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) if (a[row + k] > m) m = a[row + k]; t[row + x] = m; } }
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { let m = 0; for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) if (t[k * w + x] > m) m = t[k * w + x]; o[y * w + x] = m; }
  return o;
}
async function write(name, img, { crop = true, opaque = false, q = 84 } = {}) {
  let x0 = 0, y0 = 0, x1 = img.w - 1, y1 = img.h - 1;
  if (crop) { x0 = img.w; y0 = img.h; x1 = -1; y1 = -1; for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 1; } x0 = Math.max(0, x0 - 4); y0 = Math.max(0, y0 - 4); x1 = Math.min(img.w - 1, x1 + 4); y1 = Math.min(img.h - 1, y1 + 4); }
  let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
  if (opaque) s = s.removeAlpha();
  await s.webp({ quality: q, alphaQuality: 90, effort: 4 }).toFile(path.join(OUT, name + ".webp"));
  plates[name] = { file: name + ".webp", x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, full: [img.w, img.h], kb: Math.round(fs.statSync(path.join(OUT, name + ".webp")).size / 1024) };
}
for (const w of WORLDS) {
  const post = w === "sketch" || w === "riso";
  for (const l of ["sky", "far", "mid", "near", "ground"]) {
    const base = await rgba(`${RAW}/${w}-${l}.png`);
    let img = base;
    if (post) {
      const pp = await rgba(`${RAW}/${w}-${l}-post.png`);
      if (l !== "sky") { const a = new Uint8Array(base.w * base.h); for (let i = 0; i < a.length; i++) a[i] = base.data[i * 4 + 3]; const d = dilate(a, base.w, base.h, w === "sketch" ? 5 : 2); for (let i = 0; i < a.length; i++) pp.data[i * 4 + 3] = d[i]; }
      img = pp;
    }
    await write(`b2-${w}-${l}`, img, { crop: l !== "sky", opaque: l === "sky" });
  }
  console.log(w);
}
fs.writeFileSync(path.join(here, "platesB2.json"), JSON.stringify({ plates }));
console.log("plates B2", Object.keys(plates).length, Object.values(plates).reduce((s, m) => s + m.kb, 0), "KB");
