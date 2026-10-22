// Cromatic · stories in Lottie · C8 (TASK-065i): the light cinematic post on the image only (the plates, the ride's
// sprites, the frame sequences; never the cards, never the website captures): Vera's night grade (luts/cromatic-night.cube,
// from origin/diorama-render, TASK-118) mixed at AMT, and for opaque frames a soft tilt-shift (the top and bottom of the
// frame blurred on a gradient). Alpha is kept (the sprites get the grade only).
//   node post.mjs <in> <out> [--tilt] [--amt 0.7]      or as a module: post(inBuf|file, { tilt, amt }) -> PNG buffer
import fs from "fs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const CUBE = new URL("./luts/cromatic-night.cube", import.meta.url).pathname;
let LUT = null, N = 0;
function load() { if (LUT) return; const v = []; for (const ln of fs.readFileSync(CUBE, "utf8").split("\n")) { const t = ln.trim(); if (!t || t[0] === "#" || /^[A-Z]/.test(t)) { const m = t.match(/^LUT_3D_SIZE\s+(\d+)/); if (m) N = +m[1]; continue; } const p = t.split(/\s+/).map(Number); if (p.length === 3) v.push(p); } LUT = new Float32Array(v.flat()); }
// a 256-step table per channel would lose the cross-talk: trilinear on the cube, cached per 6-bit colour
export async function post(input, { tilt = false, amt = 0.7, blur = 9 } = {}) {
  load();
  const img = sharp(input).ensureAlpha(), { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const cache = new Map(), n1 = N - 1, at = (r, g, b) => (r + g * N + b * N * N) * 3;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const key = (data[i] >> 2) | ((data[i + 1] >> 2) << 6) | ((data[i + 2] >> 2) << 12);
    let o = cache.get(key);
    if (!o) {
      const rf = ((data[i] | 3) / 255) * n1, gf = ((data[i + 1] | 3) / 255) * n1, bf = ((data[i + 2] | 3) / 255) * n1;
      const r0 = Math.floor(rf), g0 = Math.floor(gf), b0 = Math.floor(bf), r1 = Math.min(n1, r0 + 1), g1 = Math.min(n1, g0 + 1), b1 = Math.min(n1, b0 + 1), dr = rf - r0, dg = gf - g0, db = bf - b0;
      o = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        const c00 = LUT[at(r0, g0, b0) + c] * (1 - dr) + LUT[at(r1, g0, b0) + c] * dr, c10 = LUT[at(r0, g1, b0) + c] * (1 - dr) + LUT[at(r1, g1, b0) + c] * dr;
        const c01 = LUT[at(r0, g0, b1) + c] * (1 - dr) + LUT[at(r1, g0, b1) + c] * dr, c11 = LUT[at(r0, g1, b1) + c] * (1 - dr) + LUT[at(r1, g1, b1) + c] * dr;
        o[c] = ((c00 * (1 - dg) + c10 * dg) * (1 - db) + (c01 * (1 - dg) + c11 * dg) * db) * 255;
      }
      cache.set(key, o);
    }
    for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round(data[i + c] * (1 - amt) + o[c] * amt)));
  }
  let out = sharp(data, { raw: info });
  if (!tilt) return out.png().toBuffer();
  // the tilt-shift: a blurred copy over the frame through a vertical mask (sharp in the middle 50 %, soft to the edges)
  const base = await out.png().toBuffer(), W = info.width, H = info.height;
  const mask = Buffer.alloc(W * H); for (let y = 0; y < H; y++) { const v = y / H, m = v < 0.25 ? (0.25 - v) / 0.25 : v > 0.72 ? (v - 0.72) / 0.28 : 0, a = Math.round(255 * Math.min(1, m) ** 1.4); mask.fill(a, y * W, (y + 1) * W); }
  const br = await sharp(base).removeAlpha().blur(blur).raw().toBuffer(), rgba = Buffer.alloc(W * H * 4);
  for (let q = 0, j = 0; q < W * H; q++, j += 3) { rgba[q * 4] = br[j]; rgba[q * 4 + 1] = br[j + 1]; rgba[q * 4 + 2] = br[j + 2]; rgba[q * 4 + 3] = mask[q]; }
  const bl = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  return sharp(base).composite([{ input: bl }]).png().toBuffer();
}
if (process.argv[1] && process.argv[1].endsWith("post.mjs")) {
  const [inp, outp] = process.argv.slice(2), tilt = process.argv.includes("--tilt"), ai = process.argv.indexOf("--amt"), amt = ai > 0 ? +process.argv[ai + 1] : 0.7;
  const b = await post(inp, { tilt, amt }); await sharp(b).toFile(outp); console.log(outp);
}
