// Cromatic · stories in Lottie · story D3 (TASK-065e): the new pictures into story D's images (d3-*.webp), added to
// D2's plates as platesD3.json:
//   work      the live /site/'s portfolio grid (#work, its case cards), scrolled steadily (capture-work-d3.mjs), a
//             little soft (the card over it stays the thing to read)
//   drift     the drift out of Printoteca's hall, the camera moving: a plate per frame (at the story's own size: it
//             is never zoomed) and the ride per frame (renderV6.mjs JOB=d3)
//   skyline   Fintech Boulevard from above its road
//   overtake  the F1 past the yellow ride, head on, at night: the plate, each car per frame
//   node plates-d3.mjs [only=work,drift,skyline,overtake]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const RAW = "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw/v6", CAP = process.env.CAP || "/private/tmp/claude-501/-Users-daniel-stoic/91f99970-4c85-4c76-9af9-b4762e98f53c/scratchpad/sd3/work";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
const only = (process.argv[2] || "work,drift,skyline,overtake").split(",");
const P2 = JSON.parse(fs.readFileSync(path.join(here, "platesD2.json"), "utf8")), S3 = JSON.parse(fs.readFileSync(path.join(here, "platesD3s.json"), "utf8"));
const prev = fs.existsSync(path.join(here, "platesD3.json")) ? JSON.parse(fs.readFileSync(path.join(here, "platesD3.json"), "utf8")) : { plates: {}, shots: {} };
const meta = { ...P2.plates, ...prev.plates, ...S3.plates }, nums = { ...P2.shots, ...prev.shots };
const J = JSON.parse(fs.readFileSync(`${RAW}/d3.json`, "utf8"));
async function rgba(src) { const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; }
function bbox({ data, w, h }, pad = 4) { let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 < 0) return null; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad); return [x0, y0, x1 - x0 + 1, y1 - y0 + 1]; }
async function write(name, img, { crop = false, opaque = false, at = [0, 0], q = 84 } = {}) {
  const b = crop ? bbox(img) : [0, 0, img.w, img.h]; if (!b) return null; const [x, y, w, h] = b;
  let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract({ left: x, top: y, width: w, height: h }); if (opaque) s = s.removeAlpha();
  const out = path.join(OUT, name + ".webp"); await s.webp({ quality: q, alphaQuality: 90, effort: 4 }).toFile(out);
  meta[name] = { file: name + ".webp", x: at[0] + x, y: at[1] + y, w, h, full: [img.w, img.h], kb: Math.round(fs.statSync(out).size / 1024) }; return name;
}
// the same grade as D2's drift: an S curve, warmer highlights, a touch more saturation
function grade(img, { k = 0.16, warm = 0.05, cool = 0.04, sat = 1.1 } = {}) {
  const { data } = img, out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    let r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255; const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = Y + (r - Y) * sat; g = Y + (g - Y) * sat; b = Y + (b - Y) * sat;
    const hi = Math.max(0, Y - 0.5) * 2, lo = Math.max(0, 0.5 - Y) * 2; r *= 1 + warm * hi - cool * 0.4 * lo; b *= 1 - warm * hi + cool * lo;
    const S = (x) => { x = Math.min(1, Math.max(0, x)); return x - (k * Math.sin(2 * Math.PI * x)) / (2 * Math.PI); };
    out[i] = Math.round(255 * S(r)); out[i + 1] = Math.round(255 * S(g)); out[i + 2] = Math.round(255 * S(b));
  }
  return { ...img, data: out };
}
if (only.includes("work")) {
  const fr = fs.readdirSync(CAP).filter((f) => f.startsWith("raw-")).sort(), names = [];
  for (const f of fr) { const nm = `d3-work-${f.slice(4, 7)}`, out = path.join(OUT, nm + ".webp"); await sharp(`${CAP}/${f}`).resize(1080, 1920, { fit: "cover" }).blur(2.2).webp({ quality: 78, effort: 4 }).toFile(out); meta[nm] = { file: nm + ".webp", x: 0, y: 0, w: 1080, h: 1920, kb: Math.round(fs.statSync(out).size / 1024) }; names.push(nm); }
  nums.work = { frames: names };
}
if (only.includes("drift")) {
  nums.drift3 = { plates: [], rides: [] };
  for (let i = 0; i < J.drift.length; i++) {
    const n = String(i).padStart(3, "0"), pl = `d3-drift-plate-${n}`, out = path.join(OUT, pl + ".webp");
    const g = grade(await rgba(`${RAW}/d3/drift-plate-${n}.png`));
    await sharp(g.data, { raw: { width: g.w, height: g.h, channels: 4 } }).removeAlpha().resize(1080, 1920).webp({ quality: 80, effort: 4 }).toFile(out);
    meta[pl] = { file: pl + ".webp", x: 0, y: 0, w: 1080, h: 1920, scale: 2, kb: Math.round(fs.statSync(out).size / 1024) }; nums.drift3.plates.push(pl);
    const r = J.drift[i]; nums.drift3.rides.push(r ? await write(`d3-drift-car-${n}`, grade(await rgba(`${RAW}/d3/drift-car-${n}.png`)), { crop: true, at: [r[0], r[1]], q: 82 }) : null);
  }
}
if (only.includes("hall")) {
  nums.hall = { plates: [] };
  for (let i = 0; i < (J.hall || 0); i++) { const n = String(i).padStart(3, "0"), pl = `d3-hall-plate-${n}`, out = path.join(OUT, pl + ".webp"); const g = grade(await rgba(`${RAW}/d3/hall-plate-${n}.png`)); await sharp(g.data, { raw: { width: g.w, height: g.h, channels: 4 } }).removeAlpha().resize(1080, 1920).webp({ quality: 82, effort: 4 }).toFile(out); meta[pl] = { file: pl + ".webp", x: 0, y: 0, w: 1080, h: 1920, scale: 2, kb: Math.round(fs.statSync(out).size / 1024) }; nums.hall.plates.push(pl); }
}
if (only.includes("skyline")) { await write("d3-skyline-L0", grade(await rgba(`${RAW}/d3/skyline-plate.png`), { k: 0.1, sat: 1.06 }), { opaque: true }); nums.skyline3 = { tags: J.tags }; }
if (only.includes("overtake")) {
  await write("d3-overtake-L0", await rgba(`${RAW}/d3/overtake-plate.png`), { opaque: true });
  nums.overtake = {};
  for (const v of ["dacia1300", "f1"]) { nums.overtake[v] = []; for (let i = 0; i < J.overtake[v].length; i++) { const r = J.overtake[v][i]; nums.overtake[v].push(r ? await write(`d3-overtake-${v}-${String(i).padStart(3, "0")}`, await rgba(`${RAW}/d3/overtake-${v}-${String(i).padStart(3, "0")}.png`), { crop: true, at: [r[0], r[1]], q: 82 }) : null); } }
}
fs.writeFileSync(path.join(here, "platesD3.json"), JSON.stringify({ plates: meta, shots: nums }));
console.log("plates D3", Object.keys(meta).length, only.join(","));
