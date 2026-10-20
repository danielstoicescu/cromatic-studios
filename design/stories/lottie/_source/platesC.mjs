// Cromatic · stories in Lottie · story C (TASK-058): the chase's renders (RAW) into its plates (images/c-*.webp) and
// numbers (platesC.json): the street's layers, the bird's eye's two lenses, and the cars' frames (each a rectangle of
// the frame: where it goes is in platesC.json). node platesC.mjs
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/raw";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
fs.mkdirSync(OUT, { recursive: true });
const meta = {};
async function rgba(file) { const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; }
function bbox(img, pad = 4) {
  const { data, w, h } = img; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
// at: where the picture's top left is in the frame (a car's rectangle), added to the crop's own offset
async function write(name, file, { crop = true, opaque = false, at = [0, 0], q = 84 } = {}) {
  const img = await rgba(file);
  const b = crop ? bbox(img) : [0, 0, img.w, img.h];
  if (!b) return null;
  const [x, y, w, h] = b;
  let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract({ left: x, top: y, width: w, height: h });
  if (opaque) s = s.removeAlpha();
  const out = path.join(OUT, name + ".webp");
  await s.webp({ quality: q, alphaQuality: 90, effort: 4, smartSubsample: true }).toFile(out);
  meta[name] = { file: path.basename(out), x: at[0] + x, y: at[1] + y, w, h, full: [img.w, img.h], kb: Math.round(fs.statSync(out).size / 1024) };
  return meta[name];
}
const st = JSON.parse(fs.readFileSync(`${RAW}/c-street.json`, "utf8")), air = JSON.parse(fs.readFileSync(`${RAW}/c-air.json`, "utf8"));
for (const l of ["sky", "far", "mid", "near", "ground"]) await write(`c-street-${l}`, `${RAW}/c-street-${l}.png`, { crop: l !== "sky", opaque: l === "sky", q: 86 });
for (let i = 0; i < 2; i++) await write(`c-air-${i}`, `${RAW}/c-air-${i}.png`, { crop: false, opaque: true, q: 86 });
const frames = { yellow: [], cop: [] };
for (const car of ["yellow", "cop"]) for (let i = 0; i < st.sprites[car].length; i++) {
  const r = st.sprites[car][i];
  frames[car].push(r ? (await write(`c-${car}-${String(i).padStart(3, "0")}`, `${RAW}/c-${car}-${String(i).padStart(3, "0")}.png`, { at: [r[0], r[1]], q: 80 })) && `c-${car}-${String(i).padStart(3, "0")}` : null);
}
const hold = []; for (let b = 0; b < 3; b++) { const r = st.copHold[b]; await write(`c-cophold-${b}`, `${RAW}/c-cophold-${b}.png`, { at: [r[0], r[1]], q: 84 }); hold.push(`c-cophold-${b}`); }
const airPoses = { yellow: [], cop: [] };
for (const car of ["yellow", "cop"]) air.air.poses[car].forEach((p, k) => { airPoses[car].push(p.rect ? { t: p.t, name: `c-air-${car}-${k}`, rect: p.rect } : { t: p.t, name: null }); });
for (const car of ["yellow", "cop"]) for (const p of airPoses[car]) if (p.name) { const m = await write(p.name, `${RAW}/${p.name}.png`, { at: [p.rect[0], p.rect[1]], q: 84 }); if (!m) p.name = null; }
fs.writeFileSync(path.join(here, "platesC.json"), JSON.stringify({ plates: meta, frames, hold, airPoses, street: { o: st.o, proj: st.proj, bulbs: st.bulbs, plan: st.plan }, air: { o: air.o, track: air.air.track } }));
console.log("plates C", Object.keys(meta).length, Object.values(meta).reduce((s, m) => s + m.kb, 0), "KB");
