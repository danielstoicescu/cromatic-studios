// Cromatic · stories in Lottie · story D2 (TASK-066b, Daniel's storyboard): the new pictures (renders from the
// stories-lottie harness, renderV4.mjs JOB=d2; the site's captures, capture-site-d2.mjs and capture-ui-d.mjs for Steam)
// into story D's images (d2-*.webp), added to story D's plates as platesD2.json:
//   site     the /site/ capture, 30 frames a second
//   drift    the slow-motion drift past Printoteca: its plate, warmer and contrastier, the far part a little soft (a
//            lens), and the ride at every frame (8 subframes of blur)
//   skyline  Fintech Boulevard and where its tags go;  steam  the Steam tower by day
//   sip      the F1 through the Two Minutes corner at night (story C's corner plate, the F1's frames)
//   water    the fountain's jets for the end, frame by frame (in the end plate's box), with the lamps' bloom
//   ui       Steam's place card, its case page opened and tall (as story D's d-ui-*)
//   node plates-d2.mjs <RAW of renderV4> <capture dir>
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const [RAW = "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw", CAP = "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/sd2"] = process.argv.slice(2);
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
const PD = JSON.parse(fs.readFileSync(path.join(here, "platesD.json"), "utf8")), meta = { ...PD.plates }, nums = { ...PD.shots };
const J = JSON.parse(fs.readFileSync(`${RAW}/d2.json`, "utf8")), R2 = `${RAW}/d2`;
async function rgba(src) { const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; }
function bbox({ data, w, h }, pad = 4) { let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 < 0) return null; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad); return [x0, y0, x1 - x0 + 1, y1 - y0 + 1]; }
async function write(name, img, { crop = false, opaque = false, at = [0, 0], q = 86 } = {}) {
  const b = crop ? bbox(img) : [0, 0, img.w, img.h]; if (!b) return null; const [x, y, w, h] = b;
  let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract({ left: x, top: y, width: w, height: h }); if (opaque) s = s.removeAlpha();
  const out = path.join(OUT, name + ".webp"); await s.webp({ quality: q, alphaQuality: 90, effort: 4 }).toFile(out);
  meta[name] = { file: name + ".webp", x: at[0] + x, y: at[1] + y, w, h, full: [img.w, img.h], kb: Math.round(fs.statSync(out).size / 1024) }; return name;
}
async function smear(name, src, dir) {
  const m = await sharp(src).metadata(), qw = Math.round(m.width / 4), qh = Math.round(m.height / 4), small = await sharp(src).resize(qw, qh).toBuffer();
  const sq = dir === "h" ? await sharp(small).resize(Math.max(2, Math.round(qw / 22)), qh, { fit: "fill" }).toBuffer() : await sharp(small).resize(qw, Math.max(2, Math.round(qh / 22)), { fit: "fill" }).toBuffer();
  const out = path.join(OUT, name + ".webp"); await sharp(sq).resize(qw, qh, { fit: "fill", kernel: "linear" }).flatten({ background: "#000" }).webp({ quality: 70 }).toFile(out);
  meta[name] = { file: name + ".webp", x: 0, y: 0, w: qw, h: qh, full: [m.width, m.height], scale: 4, kb: Math.round(fs.statSync(out).size / 1024) };
}
// a grade for the drift: an S curve, warmer highlights, cooler shadows, a touch more saturation
function grade(img, { k = 0.18, warm = 0.05, cool = 0.04, sat = 1.12 } = {}) {
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
async function bloom(img, { thr = 0.62, sigma = 22, k = 1.0, k2 = 0.45, tint = [1, 0.92, 0.8] } = {}) {
  const { data, w, h } = img, hi = Buffer.alloc(w * h * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) { const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, l = 0.2126 * r + 0.7152 * g + 0.0722 * b, m = Math.max(0, (l - thr) / (1 - thr)); hi[j] = Math.round(255 * Math.min(1, m * r * 1.4)); hi[j + 1] = Math.round(255 * Math.min(1, m * g * 1.4)); hi[j + 2] = Math.round(255 * Math.min(1, m * b * 1.4)); }
  const b1 = await sharp(hi, { raw: { width: w, height: h, channels: 3 } }).blur(sigma).raw().toBuffer(), b2 = await sharp(hi, { raw: { width: w, height: h, channels: 3 } }).blur(sigma * 3).raw().toBuffer();
  const out = Buffer.from(data); for (let i = 0, j = 0; i < out.length; i += 4, j += 3) for (let c = 0; c < 3; c++) { const a = out[i + c] / 255, s = Math.min(1, (b1[j + c] / 255) * k * tint[c] + (b2[j + c] / 255) * k2 * tint[c]); out[i + c] = Math.round(255 * (1 - (1 - a) * (1 - s))); }
  return { ...img, data: out };
}
const SKIP = (process.env.SKIP || "").split(",");
// ---- the site capture (30 a second)
if (!SKIP.includes("site")) {
const site = fs.readdirSync(`${CAP}/site`).filter((f) => f.startsWith("raw-")).sort(), siteNames = [];
for (const f of site) { const nm = `d2-site-${f.slice(4, 7)}`; const out = path.join(OUT, nm + ".webp"); await sharp(`${CAP}/site/${f}`).resize(1080, 1920, { fit: "cover" }).webp({ quality: 80, effort: 4 }).toFile(out); meta[nm] = { file: nm + ".webp", x: 0, y: 0, w: 1080, h: 1920, kb: Math.round(fs.statSync(out).size / 1024) }; siteNames.push(nm); }
nums.site = { frames: siteNames };
} else { const prev = JSON.parse(fs.readFileSync(path.join(here, "platesD2.json"), "utf8")); for (const k of Object.keys(prev.plates)) if (k.startsWith("d2-site") || k.startsWith("d2-drift")) meta[k] = prev.plates[k]; nums.site = prev.shots.site; nums.drift = prev.shots.drift; }
// ---- the drift: the plate graded, its far half softened (a lens's depth: a vertical blend to a blurred copy above the
// road's near edge), the ride's frames graded the same
if (!SKIP.includes("drift")) {
  let p = grade(await rgba(`${R2}/drift-plate.png`));
  const soft = await sharp(p.data, { raw: { width: p.w, height: p.h, channels: 4 } }).blur(7).raw().toBuffer(), y0 = 2300, y1 = 2700;
  for (let y = 0; y < p.h; y++) { const t = y < y0 ? 1 : y > y1 ? 0 : 1 - (y - y0) / (y1 - y0), k = 0.85 * t; if (!k) continue; for (let x = 0; x < p.w; x++) { const i = (y * p.w + x) * 4; for (let c = 0; c < 3; c++) p.data[i + c] = Math.round(p.data[i + c] * (1 - k) + soft[i + c] * k); } }
  await write("d2-drift-L0", p, { opaque: true, q: 86 }); await smear("d2-drift-wh", `${R2}/drift-plate.png`, "h");
  nums.drift = { rides: [] };
  for (let i = 0; i < J.drift.length; i++) { const r = J.drift[i]; if (!r) { nums.drift.rides.push(null); continue; } nums.drift.rides.push(await write(`d2-drift-${String(i).padStart(3, "0")}`, grade(await rgba(`${R2}/drift-${String(i).padStart(3, "0")}.png`)), { crop: true, at: [r[0], r[1]], q: 84 })); }
}
// ---- skyline (and its tags), Steam
// (v5: the skyline from the west, wide: renderV5.mjs JOB=d2b, the frame pans across it; the tags' anchors with it)
{ const SW = `${RAW}/v5/d2-skyline-wide.png`, SJ = JSON.parse(fs.readFileSync(`${RAW}/v5/d2-skyline-wide.json`, "utf8"));
  await write("d2-skyline-L0", grade(await rgba(SW), { k: 0.1, sat: 1.06 }), { opaque: true }); await smear("d2-skyline-wh", SW, "h"); nums.skyline = { tags: SJ.tags, o: SJ.o }; }
await write("d2-steam-L0", grade(await rgba(`${R2}/steam-plate.png`), { k: 0.1, sat: 1.06 }), { opaque: true }); await smear("d2-steam-wh", `${R2}/steam-plate.png`, "h"); await smear("d2-steam-wv", `${R2}/steam-plate.png`, "v");
// ---- sip: the F1 through the corner
await write("d2-sip-L0", await bloom(await rgba(`${R2}/sip-plate.png`), { thr: 0.75, k: 0.6, k2: 0.25 }), { opaque: true }); nums.sip = { rides: [] };
for (let i = 0; i < J.sip.length; i++) { const r = J.sip[i]; nums.sip.rides.push(r ? await write(`d2-sip-${String(i).padStart(3, "0")}`, await rgba(`${R2}/sip-${String(i).padStart(3, "0")}.png`), { crop: true, at: [r[0], r[1]], q: 84 }) : null); }
// ---- the end's water
nums.water = { box: J.waterBox, frames: [] };
// (v5: each frame blended with its two neighbours, a 1/10 s shutter: the jets read as falling water, not clumps)
const wf = (i) => rgba(`${R2}/water-${String(Math.max(0, Math.min(J.water - 1, i))).padStart(3, "0")}.png`);
for (let i = 0; i < J.water; i++) { const nm = `d2-water-${String(i).padStart(3, "0")}`, a = await wf(i - 1), b = await wf(i), c2 = await wf(i + 1), m = { ...b, data: Buffer.from(b.data) };
  for (let k = 0; k < m.data.length; k++) m.data[k] = Math.round(0.25 * a.data[k] + 0.5 * b.data[k] + 0.25 * c2.data[k]);
  await write(nm, await bloom(m), { opaque: true, at: [J.waterBox[0], J.waterBox[1]], q: 80 }); nums.water.frames.push(nm); }
// ---- Steam's place card, its case page (as plates-d.mjs did for the Court)
{
  const U = `${CAP}/ui`, ui = JSON.parse(fs.readFileSync(`${U}/ui-en.json`, "utf8")), DPR = 1080 / 390;
  await write("d2-ui-card", await rgba(`${U}/ui-card-en.png`), { q: 90 });
  await write("d2-ui-opened-en", await rgba(`${U}/ui-opened-en.png`), { opaque: true, q: 88 });
  await write("d2-ui-page-en", await rgba(`${U}/ui-page-en.png`), { opaque: true, q: 84 });
  await smear("d2-ui-page-en-wv", `${U}/ui-page-en.png`, "v"); await smear("d2-ui-opened-en-wh", `${U}/ui-opened-en.png`, "h");
  const h2 = ui.heads.filter((q) => q[0] === "H2")[1] || ui.heads.find((q) => q[0] === "H2") || ["", "", 1400]; const sy = Math.max(600, Math.min(Math.round(h2[2] * DPR - 380), ui.pageH - 1920)); ui.scrollTo = sy;
  await sharp(`${U}/ui-page-en.png`).extract({ left: 0, top: sy, width: 1080, height: 1920 }).png().toFile(`${U}/ui-landed-en.png`); await smear("d2-ui-landed-en-wh", `${U}/ui-landed-en.png`, "h");
  nums["ui2-en"] = ui;
}
fs.writeFileSync(path.join(here, "platesD2.json"), JSON.stringify({ plates: meta, shots: nums }));
console.log("plates D2", Object.keys(meta).length, "site", nums.site.frames.length, "drift", nums.drift.rides.filter(Boolean).length, "sip", nums.sip.rides.filter(Boolean).length, "water", nums.water.frames.length, "scrollTo", nums["ui2-en"].scrollTo);
