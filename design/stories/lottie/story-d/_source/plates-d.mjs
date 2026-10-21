// Cromatic · stories in Lottie · story D (TASK-066): the renders (RAW: render-d.mjs, capture-ui-d.mjs) into story D's
// plates (story-d/images/d-*.webp) and their numbers (platesD.json): the plates whole, the rides' sprites cropped to
// what they hold (where they sit in their frame is kept), the UI as captured, a whip-pan smear of each plate (its own
// pixels pulled sideways or up, at a quarter size: a smear needs no detail), and the film grain.
//   node plates-d.mjs
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { SHOTS } from "./shots-d.mjs";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/sd/raw";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
fs.mkdirSync(OUT, { recursive: true });
const meta = {}, nums = {};
async function rgba(file) { const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; }
function bbox(img, pad = 4) {
  const { data, w, h } = img; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
// at: where the picture's top left is in its frame (a sprite's rectangle), added to the crop's own offset
async function write(name, file, { crop = false, opaque = false, at = [0, 0], q = 86, resize = null } = {}) {
  let img = await rgba(file);
  const b = crop ? bbox(img) : [0, 0, img.w, img.h];
  if (!b) return null;
  const [x, y, w, h] = b;
  let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract({ left: x, top: y, width: w, height: h });
  if (resize) s = s.resize(resize[0], resize[1], { fit: "fill" });
  if (opaque) s = s.removeAlpha();
  const out = path.join(OUT, name + ".webp");
  await s.webp({ quality: q, alphaQuality: 90, effort: 5, smartSubsample: true }).toFile(out);
  const m = await sharp(out).metadata();
  meta[name] = { file: path.basename(out), x: at[0] + x, y: at[1] + y, w: m.width, h: m.height, full: [img.w, img.h], kb: Math.round(fs.statSync(out).size / 1024) };
  return meta[name];
}
// a whip pan's smear: the plate squeezed to a few columns (or rows) and stretched back, at a quarter of its size
async function smear(name, file, dir, { opaque = true } = {}) {
  const m = await sharp(file).metadata(), qw = Math.round(m.width / 4), qh = Math.round(m.height / 4);
  const small = await sharp(file).resize(qw, qh).toBuffer();
  const squeezed = dir === "h" ? await sharp(small).resize(Math.max(2, Math.round(qw / 22)), qh, { fit: "fill", kernel: "cubic" }).toBuffer() : await sharp(small).resize(qw, Math.max(2, Math.round(qh / 22)), { fit: "fill", kernel: "cubic" }).toBuffer();
  let s = sharp(squeezed).resize(qw, qh, { fit: "fill", kernel: "linear" });
  if (opaque) s = s.flatten({ background: "#000" });
  const out = path.join(OUT, name + ".webp");
  await s.webp({ quality: 70, alphaQuality: 80 }).toFile(out);
  meta[name] = { file: path.basename(out), x: 0, y: 0, w: qw, h: qh, full: [m.width, m.height], scale: 4, kb: Math.round(fs.statSync(out).size / 1024) };
}
for (const id of Object.keys(SHOTS)) {
  const jf = `${RAW}/${id}.json`; if (!fs.existsSync(jf)) { console.log("no render", id); continue; }
  const J = JSON.parse(fs.readFileSync(jf, "utf8")); nums[id] = J;
  const opaque = !SHOTS[id].nosky;
  for (let i = 0; i < J.lenses.length; i++) await write(`d-${id}-L${i}`, `${RAW}/${id}-L${i}.png`, { opaque, q: id === "over" ? 84 : 86 });
  await smear(`d-${id}-wh`, `${RAW}/${id}-L0.png`, "h", { opaque });
  if (id === "inv" || id === "tac") await smear(`d-${id}-wv`, `${RAW}/${id}-L0.png`, "v", { opaque });
  for (const [k, sp] of Object.entries(J.sprites || {})) await write(`d-${id}-${k}`, `${RAW}/${id}-${k}.png`, { crop: true, at: [sp.rect[0], sp.rect[1]], q: 86 });
  if (J.pass) for (let i = 0; i < J.pass.length; i++) { const r = J.pass[i].rect; if (r) J.pass[i].plate = (await write(`d-${id}-pass-${String(i).padStart(3, "0")}`, `${RAW}/${id}-pass-${String(i).padStart(3, "0")}.png`, { crop: true, at: [r[0], r[1]], q: 82 })) ? `d-${id}-pass-${String(i).padStart(3, "0")}` : null; }
  if (J.beacons) for (let b = 0; b < J.beacons.length; b++) await write(`d-${id}-beacon-${b}`, `${RAW}/${id}-beacon-${b}.png`, { crop: true, at: [J.beacons[b][0], J.beacons[b][1]], q: 86 });
}
// the UI: the card (its corners already cut), the case page opened in the map's frame, the page tall (for the scroll)
for (const lang of ["en"]) { // (story D is English only: Daniel, 21 Oct)
  const jf = `${RAW}/ui-${lang}.json`; if (!fs.existsSync(jf)) continue;
  nums["ui-" + lang] = JSON.parse(fs.readFileSync(jf, "utf8"));
  if (lang === "en") await write(`d-ui-card`, `${RAW}/ui-card-${lang}.png`, { q: 90 });
  await write(`d-ui-opened-${lang}`, `${RAW}/ui-opened-${lang}.png`, { opaque: true, q: 88 });
  await write(`d-ui-page-${lang}`, `${RAW}/ui-page-${lang}.png`, { opaque: true, q: 84 });
  await smear(`d-ui-page-${lang}-wv`, `${RAW}/ui-page-${lang}.png`, "v");
  await smear(`d-ui-opened-${lang}-wh`, `${RAW}/ui-opened-${lang}.png`, "h");
  // where the scroll lands: the third heading ("The bench") 380 px under the top; that screen's own sideways smear
  const ui = nums["ui-" + lang], DPR = 1080 / 390, h2 = ui.heads.filter((q) => q[0] === "H2")[1];
  const sy = Math.round(h2[2] * DPR - 380); ui.scrollTo = sy;
  await sharp(`${RAW}/ui-page-${lang}.png`).extract({ left: 0, top: sy, width: 1080, height: 1920 }).png().toFile(`${RAW}/ui-landed-${lang}.png`);
  await smear(`d-ui-landed-${lang}-wh`, `${RAW}/ui-landed-${lang}.png`, "h");
}
// film grain: four frames (a gaussian-ish noise around mid grey), overlaid, one per frame of 30
for (let k = 0; k < 4; k++) {
  let s = 1234567 + k * 7919; const R = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const w = 540, h = 960, buf = Buffer.alloc(w * h);
  for (let i = 0; i < buf.length; i++) { const g = (R() + R() + R() + R() - 2) * 0.5; buf[i] = Math.max(0, Math.min(255, Math.round(128 + g * 150))); }
  const out = path.join(OUT, `d-grain-${k}.webp`);
  await sharp(buf, { raw: { width: w, height: h, channels: 1 } }).webp({ quality: 45 }).toFile(out);
  meta[`d-grain-${k}`] = { file: `d-grain-${k}.webp`, x: 0, y: 0, w, h, kb: Math.round(fs.statSync(out).size / 1024) };
}
const strip = (J) => { const { pass, ...rest } = J; return { ...rest, ...(pass ? { pass: pass.map((q) => ({ ...q })) } : {}) }; };
fs.writeFileSync(path.join(here, "platesD.json"), JSON.stringify({ plates: meta, shots: Object.fromEntries(Object.entries(nums).map(([k, v]) => [k, strip(v)])) }));
console.log("plates D", Object.keys(meta).length, Object.values(meta).reduce((s, m) => s + m.kb, 0), "KB");
