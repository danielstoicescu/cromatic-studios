// Cromatic · stories in Lottie · story C v4 (TASK-065c): renderC4.mjs's renders into plates (images/c4-*.webp) and
// their places (platesC4.json), as platesC2.mjs, with the shot list's looks baked into the pictures:
//   palace4   the court lit in its burgundy (the blues of the facade turned to the brand's colour; its gold sign kept)
//   berero    its lamps and windows glowing (a soft bloom of what is bright)
//   steam     (v2's plate) the original Steam logo as an illuminated sign on the tower, white, glowing on the facade
//   fountain  (v2's plate) the lamps' light diffused; the water frame by frame (the engine's jets, driven per frame),
//             with the same bloom
//   cup       the windscreen close-up's plate
//   fintech4  the new drift and the police
//   node platesC4.mjs
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { WATER } from "./chase4.mjs";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/rawC4";
const LOGO = process.env.LOGO || "/Users/daniel.stoic/cromatic-ops/refs/stories-lottie/v4/steam-logo-original.png";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
const plates = {}, shots = {};
const rgba = async (src) => { const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
async function writeImg(name, img, { at = [0, 0], opaque = false, q = 82, crop = true } = {}) {
  const { data, w: W0, h: H0 } = img; let x0 = 0, y0 = 0, x1 = W0 - 1, y1 = H0 - 1;
  if (crop) { x0 = W0; y0 = H0; x1 = -1; y1 = -1; for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (data[(y * W0 + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 1; } }
  let s = sharp(data, { raw: { width: W0, height: H0, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
  if (opaque) s = s.removeAlpha();
  await s.webp({ quality: q, alphaQuality: 90, effort: 4 }).toFile(path.join(OUT, name + ".webp"));
  plates[name] = { file: name + ".webp", x: at[0] + x0, y: at[1] + y0, w: x1 - x0 + 1, h: y1 - y0 + 1, kb: Math.round(fs.statSync(path.join(OUT, name + ".webp")).size / 1024) };
  return name;
}
// a soft bloom: what is brighter than thr, blurred wide, screened back over the picture (the lamps' light diffused)
async function bloom(img, { thr = 0.72, sigma = 26, k = 0.9, sigma2 = 90, k2 = 0.35, tint = [1, 0.93, 0.82] } = {}) {
  const { data, w, h } = img, hi = Buffer.alloc(w * h * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) { const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, l = 0.2126 * r + 0.7152 * g + 0.0722 * b, m = Math.max(0, (l - thr) / (1 - thr)) * (data[i + 3] / 255); hi[j] = Math.round(255 * Math.min(1, m * r * 1.4)); hi[j + 1] = Math.round(255 * Math.min(1, m * g * 1.4)); hi[j + 2] = Math.round(255 * Math.min(1, m * b * 1.4)); }
  const b1 = await sharp(hi, { raw: { width: w, height: h, channels: 3 } }).blur(sigma).raw().toBuffer();
  const b2 = await sharp(hi, { raw: { width: w, height: h, channels: 3 } }).resize({ width: Math.round(w / 4) }).blur(sigma2 / 4).resize({ width: w, height: h }).raw().toBuffer();
  const out = Buffer.from(data);
  for (let i = 0, j = 0; i < out.length; i += 4, j += 3) for (let c = 0; c < 3; c++) { const a = out[i + c] / 255, s = Math.min(1, (b1[j + c] / 255) * k * tint[c] + (b2[j + c] / 255) * k2 * tint[c]); out[i + c] = Math.round(255 * (1 - (1 - a) * (1 - s))); }
  return { data: out, w, h };
}
// the court in burgundy: the facade's blues turned to the brand's red-violet, a little deeper; gold, white, dark kept
function burgundy(img) {
  const { data } = img, out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 0.12 || mx < 0.12) continue;
    let hDeg = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4); if (hDeg < 0) hDeg += 360;
    if (hDeg < 195 || hDeg > 275) continue;
    const w = Math.min(1, Math.min(hDeg - 195, 275 - hDeg) / 15); // (soft at the edges of the band)
    const H2 = 342, S2 = Math.min(1, (d / mx) * 0.95), V2 = mx * 0.82;
    const C2 = V2 * S2, X = C2 * (1 - Math.abs(((H2 / 60) % 2) - 1)), m = V2 - C2;
    const [rr, gg, bb] = H2 < 60 ? [C2, X, 0] : H2 < 120 ? [X, C2, 0] : H2 < 180 ? [0, C2, X] : H2 < 240 ? [0, X, C2] : H2 < 300 ? [X, 0, C2] : [C2, 0, X];
    out[i] = Math.round(255 * ((rr + m) * w + r * (1 - w))); out[i + 1] = Math.round(255 * ((gg + m) * w + g * (1 - w))); out[i + 2] = Math.round(255 * ((bb + m) * w + b * (1 - w)));
  }
  return { ...img, data: out };
}
// the Steam sign: a dark box on the tower, the original logo inside it in white light, its glow on the facade
async function steamSign(img, { cx = 2643, cy = 1130, bw = 900, bh = 1080 } = {}) {
  const L = await sharp(LOGO).ensureAlpha().resize({ height: Math.round(bh * 0.78) }).raw().toBuffer({ resolveWithObject: true });
  const lw = L.info.width, lh = L.info.height, white = Buffer.alloc(lw * lh * 4);
  // (the logo's ink is its dark pixels: they become the light; the paper goes)
  for (let i = 0; i < lw * lh; i++) { const v = (L.data[i * 4] + L.data[i * 4 + 1] + L.data[i * 4 + 2]) / 3, a = (L.data[i * 4 + 3] / 255) * Math.max(0, Math.min(1, (200 - v) / 120)); white[i * 4] = 255; white[i * 4 + 1] = 253; white[i * 4 + 2] = 246; white[i * 4 + 3] = Math.round(255 * a); }
  const logo = await sharp(white, { raw: { width: lw, height: lh, channels: 4 } }).png().toBuffer();
  const glow1 = await sharp(white, { raw: { width: lw, height: lh, channels: 4 } }).extend({ top: 80, bottom: 80, left: 80, right: 80, background: { r: 0, g: 0, b: 0, alpha: 0 } }).blur(18).png().toBuffer();
  const box = Buffer.from(`<svg width="${bw}" height="${bh}"><rect x="6" y="6" width="${bw - 12}" height="${bh - 12}" rx="36" fill="#0B0D16" fill-opacity="0.94" stroke="#E9EEFF" stroke-opacity="0.55" stroke-width="6"/></svg>`);
  const halo = Buffer.from(`<svg width="${bw * 2}" height="${bh * 2}"><defs><radialGradient id="g"><stop offset="0" stop-color="#F4F7FF" stop-opacity="0.42"/><stop offset="1" stop-color="#F4F7FF" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const base = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } });
  const out = await base.composite([
    { input: halo, left: Math.round(cx - bw), top: Math.round(cy - bh), blend: "screen" },
    { input: box, left: Math.round(cx - bw / 2), top: Math.round(cy - bh / 2) },
    { input: glow1, left: Math.round(cx - lw / 2 - 80), top: Math.round(cy - lh / 2 - 80), blend: "screen" },
    { input: glow1, left: Math.round(cx - lw / 2 - 80), top: Math.round(cy - lh / 2 - 80), blend: "screen" },
    { input: logo, left: Math.round(cx - lw / 2), top: Math.round(cy - lh / 2) }
  ]).raw().toBuffer();
  return { data: out, w: img.w, h: img.h };
}
// a shot's sprites (as platesC2: a standing car is one picture for all its frames)
async function sprites(k) {
  const J = JSON.parse(fs.readFileSync(`${RAW}/${k}.json`, "utf8")), out = {};
  for (const car of ["yellow", "cop"]) {
    out[car] = []; const seen = new Map();
    for (let i = 0; i < J.sprites[car].length; i++) {
      const r = J.sprites[car][i]; if (!r) { out[car].push(null); continue; }
      const f = `${RAW}/${k}-${car}-${String(i).padStart(3, "0")}.png`, h = crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex") + r.join(",");
      if (seen.has(h)) { out[car].push(seen.get(h)); continue; }
      const nm = await writeImg(`c4-${k}-${car}-${String(i).padStart(3, "0")}`, await rgba(f), { at: [r[0], r[1]] }); seen.set(h, nm); out[car].push(nm);
    }
  }
  return { o: J.o, sprites: out };
}
// palace4, berero, fintech4: their plates (with their looks) and sprites
for (const k of ["palace4", "berero", "fintech4"]) {
  let p = await rgba(`${RAW}/${k}-plate.png`);
  if (k === "palace4") p = await bloom(burgundy(p), { thr: 0.8, k: 0.6, k2: 0.25 });
  if (k === "berero") p = await bloom(p, { thr: 0.7, k: 1.0, k2: 0.45, tint: [1, 0.9, 0.74] });
  if (k === "fintech4") p = await bloom(p, { thr: 0.78, k: 0.6, k2: 0.3 });
  const plate = await writeImg(`c4-${k}-plate`, p, { opaque: true, crop: false, q: 84 });
  shots[k] = { ...(await sprites(k)), plate };
  console.log(k, shots[k].sprites.yellow.filter(Boolean).length, shots[k].sprites.cop.filter(Boolean).length);
}
// Steam: v2's plate and the sign
{ const p = await steamSign(await rgba(path.join(OUT, "c2-steam-plate.webp"))); shots.steam = { plate: await writeImg("c4-steam-plate", p, { opaque: true, crop: false, q: 84 }) }; }
// the fountain: v2's plate with the lamps' bloom; the water's box frame by frame, the same bloom
{
  const p = await bloom(await rgba(path.join(OUT, "c2-fountain-plate.webp")), { thr: 0.62, k: 1.1, k2: 0.5, tint: [1, 0.92, 0.8] });
  shots.fountain = { plate: await writeImg("c4-fountain-plate", p, { opaque: true, crop: false, q: 84 }), water: [] };
  const [bx, by, bw, bh] = WATER.box, files = fs.readdirSync(`${RAW}/water`).filter((f) => f.endsWith(".png")).sort();
  for (const f of files) {
    const full = await bloom(await rgba(`${RAW}/water/${f}`), { thr: 0.62, k: 1.1, k2: 0.5, tint: [1, 0.92, 0.8] });
    const crop = await sharp(full.data, { raw: { width: full.w, height: full.h, channels: 4 } }).extract({ left: bx, top: by, width: bw, height: bh }).raw().toBuffer();
    const nm = `c4-water-${f.slice(2, 5)}`;
    await sharp(crop, { raw: { width: bw, height: bh, channels: 4 } }).removeAlpha().webp({ quality: 80, effort: 4 }).toFile(path.join(OUT, nm + ".webp"));
    plates[nm] = { file: nm + ".webp", x: bx, y: by, w: bw, h: bh, kb: Math.round(fs.statSync(path.join(OUT, nm + ".webp")).size / 1024) };
    shots.fountain.water.push(nm);
  }
}
// the windscreen close-up
shots.cup = { plate: await writeImg("c4-cup-plate", await bloom(await rgba(`${RAW}/cup-plate.png`), { thr: 0.75, k: 0.8, k2: 0.3 }), { opaque: true, crop: false, q: 86 }) };
fs.writeFileSync(path.join(here, "platesC4.json"), JSON.stringify({ plates, shots }));
console.log("plates C4", Object.keys(plates).length, Object.values(plates).reduce((s, m) => s + m.kb, 0), "KB");
