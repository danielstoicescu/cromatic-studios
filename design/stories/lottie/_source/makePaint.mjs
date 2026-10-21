// Cromatic · stories in Lottie · v3 gate test (TASK-065b): a road marking as the engine will paint it: the word's
// outlines (Google Sans, the site's CromaticSans) stretched along the road as road markings are, worn by a fractal
// noise (eroded edges, holes, a few cracks, speckle), and a bump map (the paint's thickness, the aggregate showing
// through). Writes PNGs the page turns into the decal's textures.
//   node makePaint.mjs SLOW 4.2 out-dir     (text, stretch)
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { loadType, setLine } from "../../../intro-lottie/_source/lib/type.mjs";
import { glyphShapes } from "../../../intro-lottie/_source/lib/type.mjs";
const [text = "SLOW", stretchS = "4.2", OUT = "."] = process.argv.slice(2), stretch = +stretchS;
const T = await loadType();
// the word as an SVG path: em 1000, letters stretched along y (the road's length)
const size = 1000, L = setLine(T, text, size, 0.04), k = size / T.upm, pad = 160;
const capH = (T.cap / T.upm) * size * stretch, W0 = Math.ceil(L.width + 2 * pad), H0 = Math.ceil(capH + 2 * pad);
let d = "";
for (const l of L.letters) {
  for (const c of glyphShapes(T, l.ch).contours) {
    const P = (v) => [pad + l.x + v[0] * k, pad + capH + v[1] * k * stretch];
    const n = c.v.length; d += `M${P(c.v[0]).join(",")}`;
    for (let i = 1; i <= n; i++) { const a = c.v[(i - 1) % n], b = c.v[i % n], o = c.o[(i - 1) % n], ii = c.i[i % n]; d += `C${P([a[0] + o[0], a[1] + o[1]]).join(",")} ${P([b[0] + ii[0], b[1] + ii[1]]).join(",")} ${P(b).join(",")}`; }
    d += "Z";
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}"><path d="${d}" fill="#fff" fill-rule="nonzero"/></svg>`;
// texture size (the long side 2048)
const S = 2048 / Math.max(W0, H0), TW = Math.round(W0 * S / 4) * 4, TH = Math.round(H0 * S / 4) * 4;
const mask = await sharp(Buffer.from(svg)).resize(TW, TH).greyscale().raw().toBuffer();
// fractal value noise
function vnoise(w, h, cell, seed) {
  let s = seed >>> 0; const R = () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = new Float32Array(gw * gh); for (let i = 0; i < g.length; i++) g[i] = R();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); const a = g[y0 * gw + x0], b = g[y0 * gw + x0 + 1], c = g[(y0 + 1) * gw + x0], e = g[(y0 + 1) * gw + x0 + 1]; out[y * w + x] = a + (b - a) * su + (c - a) * sv + (a - b - c + e) * su * sv; }
  return out;
}
const n1 = vnoise(TW, TH, 160, 7), n2 = vnoise(TW, TH, 40, 11), n3 = vnoise(TW, TH, 9, 13), n4 = vnoise(TW, TH, 3, 17);
const rgba = Buffer.alloc(TW * TH * 4), bump = Buffer.alloc(TW * TH);
for (let i = 0; i < TW * TH; i++) {
  const a = mask[i] / 255;
  // wear: big worn patches (n1), their ragged edges (n2), pitting (n3), grit (n4)
  // (mostly intact: real paint wears in the wheel paths, in small flakes, with the asphalt's grit showing through)
  const x = (i % TW) / TW, lane = Math.exp(-(((x - 0.3) / 0.1) ** 2)) + Math.exp(-(((x - 0.72) / 0.1) ** 2));
  const wear = 0.5 * n1[i] + 0.3 * n2[i] + 0.2 * n3[i] - 0.16 * lane;
  const keep = Math.min(1, Math.max(0, (wear - (+process.env.WEAR || 0.2)) * 9)) * (n4[i] > 0.05 ? 1 : 0.35);
  // the edges eaten a little more than the middle (where tyres and weather get at it)
  const alpha = Math.min(1, Math.max(0, a * keep * 1.05 - (1 - a) * 0.3)) * (0.9 + 0.1 * n2[i]);
  const tone = 222 + Math.round((n2[i] - 0.5) * 30 + (n4[i] - 0.5) * 22);
  rgba[i * 4] = tone; rgba[i * 4 + 1] = tone - 2; rgba[i * 4 + 2] = tone - 8; rgba[i * 4 + 3] = Math.round(alpha * 255);
  bump[i] = Math.round(Math.min(255, alpha * 200 + n4[i] * 55));
}
fs.mkdirSync(OUT, { recursive: true });
const base = path.join(OUT, `paint-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
await sharp(rgba, { raw: { width: TW, height: TH, channels: 4 } }).png().toFile(base + ".png");
await sharp(bump, { raw: { width: TW, height: TH, channels: 1 } }).png().toFile(base + "-bump.png");
fs.writeFileSync(base + ".json", JSON.stringify({ text, stretch, tw: TW, th: TH, aspect: W0 / H0, capFrac: capH / H0, widthEm: L.width / size }));
console.log("paint", base, TW, TH, (W0 / H0).toFixed(3));
