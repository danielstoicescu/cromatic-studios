// Cromatic · stories in Lottie · v4 (TASK-065c): renderV4.mjs's PNGs (RAW) into the stories' plates (images/a4-*,
// b4-*) and their numbers (platesA4.json, platesB4.json), as plates.mjs, buildA2.mjs (PLATES) and platesB2.mjs did.
// B's Sketchbook gets more contrast (Daniel: it read pale next to the other worlds): its pencil darkened on a curve
// that keeps the paper white.   node platesV4.mjs [a|b]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
const which = process.argv[2] || "ab";
const rgba = async (f) => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
function dilate(a, w, h, r) {
  const t = new Uint8Array(a.length), o = new Uint8Array(a.length);
  for (let y = 0; y < h; y++) { const row = y * w; for (let x = 0; x < w; x++) { let m = 0; for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) if (a[row + k] > m) m = a[row + k]; t[row + x] = m; } }
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { let m = 0; for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) if (t[k * w + x] > m) m = t[k * w + x]; o[y * w + x] = m; }
  return o;
}
function makeWriter(plates) {
  return async function write(name, img, { crop = true, opaque = false, q = 84, at = [0, 0] } = {}) {
    let x0 = 0, y0 = 0, x1 = img.w - 1, y1 = img.h - 1;
    if (crop) {
      x0 = img.w; y0 = img.h; x1 = -1; y1 = -1;
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 1; }
      x0 = Math.max(0, x0 - 6); y0 = Math.max(0, y0 - 6); x1 = Math.min(img.w - 1, x1 + 6); y1 = Math.min(img.h - 1, y1 + 6);
    }
    let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
    if (opaque) s = s.removeAlpha();
    await s.webp({ quality: q, alphaQuality: 90, effort: 5 }).toFile(path.join(OUT, name + ".webp"));
    plates[name] = { file: name + ".webp", x: at[0] + x0, y: at[1] + y0, w: x1 - x0 + 1, h: y1 - y0 + 1, full: [img.w, img.h], kb: Math.round(fs.statSync(path.join(OUT, name + ".webp")).size / 1024) };
    return name;
  };
}
const strip = (o) => { const { files, count, ...rest } = o; return { ...rest, stats: count?.stats }; };
// the street's numbers (horizon, focal length, pins), festoon bulbs only where they are in the frame and in front
function numbers(k) {
  const j = JSON.parse(fs.readFileSync(`${RAW}/${k}.json`, "utf8")), m = strip(j.main);
  m.extra = (m.extra || []).filter((b) => b[2] < 1 && b[0] > -200 && b[0] < 2800 && b[1] > -200 && b[1] < 4000);
  return { main: m };
}
if (which.includes("a")) {
  const plates = {}, write = makeWriter(plates), boot = [];
  for (const l of ["sky", "far", "mid", "near", "ground"]) await write(`a4-street-${l}`, await rgba(`${RAW}/a4-street-${l}.png`), { crop: l !== "sky", opaque: l === "sky", q: 86 });
  for (const i of [0, 1]) { await write(`a4-over-${i}-ground`, await rgba(`${RAW}/over-${i}-ground.png`), { opaque: true, crop: false }); await write(`a4-over-${i}-up`, await rgba(`${RAW}/over-${i}-up.png`)); }
  await write("a4-boot-plate", await rgba(`${RAW}/boot-plate.png`), { opaque: true, crop: false });
  const J = JSON.parse(fs.readFileSync(`${RAW}/a4.json`, "utf8"));
  for (let i = 0; i < J.boot.length; i++) { const r = J.boot[i]; boot.push(r ? await write(`a4-boot-car-${String(i).padStart(3, "0")}`, await rgba(`${RAW}/boot-car-${String(i).padStart(3, "0")}.png`), { at: [r[0], r[1]], q: 82 }) : null); }
  fs.writeFileSync(path.join(here, "platesA4.json"), JSON.stringify({ plates, boot, shots: { "a4-street": numbers("a4-street") } }));
  console.log("plates A4", Object.keys(plates).length, Object.values(plates).reduce((s, m) => s + m.kb, 0), "KB");
}
if (which.includes("b")) {
  const plates = {}, write = makeWriter(plates);
  const WORLDS = ["monument", "nightlife", "underwater", "circuit", "sketch", "orchid", "gta2", "riso", "ghibli"];
  // (the pencil's curve: v^GAM keeps 1 at 1 and darkens the greys; a touch of ink blue in the darkest strokes)
  const GAM = +process.env.SKETCH_GAMMA || 2.7;
  for (const w of WORLDS) {
    const post = w === "sketch" || w === "riso";
    for (const l of ["sky", "far", "mid", "near", "ground"]) {
      const base = await rgba(`${RAW}/b4/${w}-${l}.png`);
      let img = base;
      if (post) {
        const pp = await rgba(`${RAW}/b4/${w}-${l}-post.png`);
        if (l !== "sky") { const a = new Uint8Array(base.w * base.h); for (let i = 0; i < a.length; i++) a[i] = base.data[i * 4 + 3]; const d = dilate(a, base.w, base.h, w === "sketch" ? 5 : 2); for (let i = 0; i < a.length; i++) pp.data[i * 4 + 3] = d[i]; }
        img = pp;
      }
      if (w === "sketch") for (let i = 0; i < img.data.length; i += 4) for (let c = 0; c < 3; c++) { const v = img.data[i + c] / 255; img.data[i + c] = Math.round(255 * Math.pow(v, GAM * (c === 2 ? 0.92 : 1))); }
      await write(`b4-${w}-${l}`, img, { crop: l !== "sky", opaque: l === "sky" });
    }
    console.log(w);
  }
  fs.writeFileSync(path.join(here, "platesB4.json"), JSON.stringify({ plates, shots: { "b4-street": numbers("b4-street") } }));
  console.log("plates B4", Object.keys(plates).length, Object.values(plates).reduce((s, m) => s + m.kb, 0), "KB");
}
