// Cromatic · stories in Lottie · v5 (TASK-065d): renderV5.mjs's PNGs (RAW/v5) into the stories' plates (images/a6-*,
// c5-*) and their numbers (platesA6.json, platesC5.json).
//   a   OMA from further away: the plate, and the plate with its glass cut out (the room inside is drawn in the story,
//       under it: the bars, the handle, the bench and the bush stay in front); the dome
//   c   see the c section
//   node platesV5.mjs a|c
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import crypto from "crypto";
const RAW = (process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw") + "/v5";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
const which = process.argv[2] || "a";
export const rgba = async (f) => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
export function makeWriter(plates) {
  return async function write(name, img, { crop = true, opaque = false, q = 84, at = [0, 0] } = {}) {
    let x0 = 0, y0 = 0, x1 = img.w - 1, y1 = img.h - 1;
    if (crop) {
      x0 = img.w; y0 = img.h; x1 = -1; y1 = -1;
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 1; }
    }
    let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
    if (opaque) s = s.removeAlpha();
    await s.webp({ quality: q, alphaQuality: 92, effort: 5 }).toFile(path.join(OUT, name + ".webp"));
    plates[name] = { file: name + ".webp", x: at[0] + x0, y: at[1] + y0, w: x1 - x0 + 1, h: y1 - y0 + 1, kb: Math.round(fs.statSync(path.join(OUT, name + ".webp")).size / 1024) };
    return name;
  };
}
if (which.includes("a")) {
  const plates = {}, write = makeWriter(plates);
  const oma = await rgba(`${RAW}/a5-oma.png`), J = JSON.parse(fs.readFileSync(`${RAW}/a5.json`, "utf8"));
  await write("a6-oma", oma, { opaque: true, crop: false });
  // the front: only the band of the arches (their box and a margin), the glass (its one flat lit colour) cut out, soft
  // at its edge; everything else of the plate is the base under it
  const xs = J.arches.flat().map((p) => p[0]), ys = J.arches.flat().map((p) => p[1]);
  const bx0 = Math.floor(Math.min(...xs)) - 40, bx1 = Math.ceil(Math.max(...xs)) + 40, by0 = Math.floor(Math.min(...ys)) - 40, by1 = Math.ceil(Math.max(...ys)) + 60;
  const fw = bx1 - bx0 + 1, fh = by1 - by0 + 1, front = { data: Buffer.alloc(fw * fh * 4), w: fw, h: fh };
  const G = [215, 166, 89];
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = ((y + by0) * oma.w + (x + bx0)) * 4, o = (y * fw + x) * 4, d = Math.abs(oma.data[i] - G[0]) + Math.abs(oma.data[i + 1] - G[1]) + Math.abs(oma.data[i + 2] - G[2]);
    for (let c = 0; c < 3; c++) front.data[o + c] = oma.data[i + c];
    front.data[o + 3] = d < 10 ? 0 : d > 40 ? 255 : Math.round((255 * (d - 10)) / 30);
  }
  await write("a6-oma-front", front, { crop: false, at: [bx0, by0], q: 90 });
  await write("a6-scf", await rgba(`${RAW}/a5-scf.png`), { opaque: true, crop: false });
  fs.writeFileSync(path.join(here, "platesA6.json"), JSON.stringify({ plates, arches: J.arches.map((a) => a.map((p) => [p[0], p[1]])) }));
  console.log("plates A6", Object.keys(plates).length, Object.values(plates).reduce((s, m) => s + m.kb, 0), "KB");
}

// ---- C v5: the new shots' plates and sprites (as platesC4), with their looks
//   palace5   warm light on the court (its night blues turned to lit stone, no red cast), a soft bloom
//   steam     the plate with the blade sign (rendered in the scene), a soft bloom on what is lit
//   sidewin, ftPass, ftAway: a light bloom
async function bloom(img, { thr = 0.72, sigma = 26, k = 0.9, sigma2 = 90, k2 = 0.35, tint = [1, 0.93, 0.82] } = {}) {
  const { data, w, h } = img, hi = Buffer.alloc(w * h * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) { const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, l = 0.2126 * r + 0.7152 * g + 0.0722 * b, m = Math.max(0, (l - thr) / (1 - thr)) * (data[i + 3] / 255); hi[j] = Math.round(255 * Math.min(1, m * r * 1.4)); hi[j + 1] = Math.round(255 * Math.min(1, m * g * 1.4)); hi[j + 2] = Math.round(255 * Math.min(1, m * b * 1.4)); }
  const b1 = await sharp(hi, { raw: { width: w, height: h, channels: 3 } }).blur(sigma).raw().toBuffer();
  const b2 = await sharp(hi, { raw: { width: w, height: h, channels: 3 } }).resize({ width: Math.round(w / 4) }).blur(sigma2 / 4).resize({ width: w, height: h }).raw().toBuffer();
  const out = Buffer.from(data);
  for (let i = 0, j = 0; i < out.length; i += 4, j += 3) for (let c = 0; c < 3; c++) { const a = out[i + c] / 255, s = Math.min(1, (b1[j + c] / 255) * k * tint[c] + (b2[j + c] / 255) * k2 * tint[c]); out[i + c] = Math.round(255 * (1 - (1 - a) * (1 - s))); }
  return { data: out, w, h };
}
// the court in warm light: its blues (the night's tint on the stone) turned to lit limestone, warm and pale where it is
// bright, amber and deep where it is in shade; gold, white and the dark sky kept
function warmStone(img) {
  const { data } = img, out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 0.1 || mx < 0.16) continue;
    let hDeg = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4); if (hDeg < 0) hDeg += 360;
    if (hDeg < 200 || hDeg > 265) continue;
    const w = Math.min(1, Math.min(hDeg - 200, 265 - hDeg) / 12);
    const V = Math.min(1, mx * 1.12 + 0.04), Sat = 0.38 + 0.25 * (1 - V), H2 = 34 - 8 * (1 - V);
    const C2 = V * Sat, X = C2 * (1 - Math.abs(((H2 / 60) % 2) - 1)), m = V - C2, [rr, gg, bb] = [C2 + m, X + m, m];
    out[i] = Math.round(255 * (rr * w + r * (1 - w))); out[i + 1] = Math.round(255 * (gg * w + g * (1 - w))); out[i + 2] = Math.round(255 * (bb * w + b * (1 - w)));
  }
  return { ...img, data: out };
}
if (which.includes("c")) {
  const plates = {}, write = makeWriter(plates), shots = {}, J5 = (k) => JSON.parse(fs.readFileSync(`${RAW}/c5-${k}.json`, "utf8"));
  async function sprites(k) {
    const J = J5(k), out = []; const seen = new Map();
    for (let i = 0; i < J.sprites.yellow.length; i++) {
      const r = J.sprites.yellow[i]; if (!r) { out.push(null); continue; }
      const f = `${RAW}/c5-${k}-yellow-${String(i).padStart(3, "0")}.png`, h = crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex") + r.join(",");
      if (seen.has(h)) { out.push(seen.get(h)); continue; }
      const nm = await write(`c5-${k}-yellow-${String(i).padStart(3, "0")}`, await rgba(f), { at: [r[0], r[1]], q: 82 }); seen.set(h, nm); out.push(nm);
    }
    return { o: J.o, sprites: { yellow: out, cop: [] } };
  }
  const only = process.env.SHOT ? process.env.SHOT.split(",") : ["palace5", "steam", "sidewin", "ftPass", "ftAway"];
  const prev = fs.existsSync(path.join(here, "platesC5.json")) ? JSON.parse(fs.readFileSync(path.join(here, "platesC5.json"), "utf8")) : { plates: {}, shots: {} };
  Object.assign(plates, prev.plates); Object.assign(shots, prev.shots);
  for (const k of only) {
    let p = await rgba(`${RAW}/c5-${k}-plate.png`);
    if (k === "palace5") p = await bloom(warmStone(p), { thr: 0.78, k: 0.55, k2: 0.25, tint: [1, 0.9, 0.74] });
    else if (k === "steam") p = await bloom(p, { thr: 0.8, k: 0.5, k2: 0.22 });
    else p = await bloom(p, { thr: 0.8, k: 0.5, k2: 0.25 });
    const plate = await write(`c5-${k}-plate`, p, { opaque: true, crop: false, q: 84 });
    shots[k] = k === "steam" ? { plate } : { ...(await sprites(k)), plate };
    console.log(k, shots[k].sprites ? shots[k].sprites.yellow.filter(Boolean).length : "");
  }
  fs.writeFileSync(path.join(here, "platesC5.json"), JSON.stringify({ plates, shots }));
  console.log("plates C5", Object.keys(plates).length, Object.values(plates).reduce((s, m) => s + m.kb, 0), "KB");
}

// ---- B v5: the night world re-rendered with the house's new windows (Toma's house-windows: no shutters, white
// curtains and small lights, the glow at the back), from the stories-b5-house build (renderV4.mjs JOB=b4
// WORLDS=nightlife RAW=.../rawB5): its five layers as b5-nightlife-*
if (which.includes("b")) {
  const plates = {}, write = makeWriter(plates), RB = process.env.RAWB || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/rawB5/b4";
  // (and the other two dark worlds, where the windows glow too: Underwater, GTA 2)
  for (const w of ["nightlife", "underwater", "gta2"]) for (const l of ["sky", "far", "mid", "near", "ground"]) await write(`b5-${w}-${l}`, await rgba(`${RB}/${w}-${l}.png`), { crop: l !== "sky", opaque: l === "sky" });
  fs.writeFileSync(path.join(here, "platesB5.json"), JSON.stringify({ plates }));
  console.log("plates B5", Object.keys(plates).length, Object.values(plates).reduce((s, m) => s + m.kb, 0), "KB");
}
