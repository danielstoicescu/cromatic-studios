// story E8c (Daniel on E8b: "mai multă colorizare ... cât mai cinematic"): a film grade on the rendered frames (before
// the cards, which stay in the brand's own colours). Per pixel, in display space:
//   an orange-teal split (warm golden highlights, teal-ish shadows), weighted by luminance and kept off the cars' own
//   saturated paint (the 1300's mustard, the F1's red, the van's teal stay true: the split fades where a colour is
//   already strong), richer contrast with a film toe (deeper blacks) and a soft shoulder (highlights roll off), on the
//   luminance only (the paint keeps its hue and strength),
//   vibrance (more for muted colours than for strong ones), halation (a warm red-orange glow from the brightest parts,
//   blurred), a stronger vignette, a fine luminance grain that changes every frame.
//   node gradeE8c.mjs <in dir> <out dir> [strength 0..1.5] [frames a-b | list]   (f00000.jpg ...)
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const [IN, OUT, kArg = "1", spec] = process.argv.slice(2), K = +kArg;
fs.mkdirSync(OUT, { recursive: true });
let files = fs.readdirSync(IN).filter((f) => /^f\d{5}\.jpg$/.test(f)).sort();
if (spec) { const want = new Set(); for (const p of spec.split(",")) { const [a, b] = p.split("-").map(Number); for (let i = a; i <= (b ?? a); i++) want.add(i); } files = files.filter((f) => want.has(+f.slice(1, 6))); }
// the opening's shots carry the grade a little stronger (Daniel: "cel puțin la primele cadre")
const boost = (n) => (n < 204 ? 1.15 : 1.0);
const W = 1080, H = 1920;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the tone curve: a toe that sinks the blacks, a straight middle a touch steeper, a soft shoulder
function curve(x, k) { const c = 1 + 0.22 * k; let y = 0.5 + (x - 0.5) * c; const toe = 0.06 * k; if (y < 0.25) y -= toe * (1 - y / 0.25) * (y / 0.25) * 1.6; const top = 0.5 + 0.5 * c; if (y > 0.7) { const u = (y - 0.7) / (top - 0.7); y = 0.7 + 0.3 * (1 - Math.exp(-2.2 * u)) / (1 - Math.exp(-2.2)); } return Math.min(1, Math.max(0, y)); }
const LUT = new Map();
const curveLut = (k) => { const key = k.toFixed(3); if (LUT.has(key)) return LUT.get(key); const t = new Float32Array(1024); for (let i = 0; i < 1024; i++) t[i] = curve(i / 1023, k); LUT.set(key, t); return t; };
let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const t0 = Date.now();
for (const f of files) {
  const n = +f.slice(1, 6), k = K * boost(n), cl = curveLut(k);
  const { data } = await sharp(path.join(IN, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // halation: the brightest parts, blurred wide, tinted warm
  const hi = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) { const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2], y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, m = smooth(0.72, 0.98, y); hi[i * 3] = 255 * m; hi[i * 3 + 1] = 120 * m; hi[i * 3 + 2] = 60 * m; }
  const halo = await sharp(hi, { raw: { width: W, height: H, channels: 3 } }).blur(22).raw().toBuffer();
  const out = Buffer.alloc(W * H * 3); seed = n * 7919 + 13;
  for (let p = 0, i = 0; p < W * H; p++, i += 3) {
    let r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx > 0 ? (mx - mn) / mx : 0, y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // orange-teal split, faded on strong paint
    const keep = 1 - smooth(0.35, 0.75, sat) * 0.85, sh = (1 - smooth(0.05, 0.5, y)) * 0.075 * k * keep, hl = smooth(0.45, 0.95, y) * 0.07 * k * keep;
    r += -sh * 0.55 + hl * 0.9; g += sh * 0.18 + hl * 0.42; b += sh * 0.62 - hl * 0.55;
    // vibrance: muted colours gain more than strong ones
    const y2 = 0.2126 * r + 0.7152 * g + 0.0722 * b, v = 1 + 0.34 * k * (1 - sat) * (1 - sat) + 0.02 * k;
    r = y2 + (r - y2) * v; g = y2 + (g - y2) * v; b = y2 + (b - y2) * v;
    // contrast, toe, shoulder
    // (on the luminance, the colour ratios kept: per-channel curves push saturated paint further, the 1300's mustard to orange)
    { const y3 = Math.max(1e-4, 0.2126 * r + 0.7152 * g + 0.0722 * b), cy = cl[Math.max(0, Math.min(1023, Math.round(y3 * 1023)))], q = cy / y3; r *= q; g *= q; b *= q; const m3 = Math.max(r, g, b); if (m3 > 1) { const yy3 = 0.2126 * r + 0.7152 * g + 0.0722 * b, t3 = Math.min(1, (m3 - 1) / Math.max(1e-4, m3 - yy3)); r += (yy3 - r) * t3; g += (yy3 - g) * t3; b += (yy3 - b) * t3; } }
    // halation
    const hk = 0.22 * k; r += (halo[i] / 255) * hk; g += (halo[i + 1] / 255) * hk; b += (halo[i + 2] / 255) * hk;
    // vignette
    const x = (p % W) / W - 0.5, yy = (p / W | 0) / H - 0.5, rr = Math.sqrt(x * x * 0.5625 * 1.778 + yy * yy) / 0.62, vg = 1 - 0.16 * k * smooth(0.45, 1.3, rr);
    r *= vg; g *= vg; b *= vg;
    // grain (luminance, strongest in the mids)
    const yl = 0.2126 * r + 0.7152 * g + 0.0722 * b, gn = (rnd() + rnd() - 1) * 0.022 * Math.min(1, k) * (0.4 + 2.2 * yl * (1 - yl));
    out[i] = Math.max(0, Math.min(255, (r + gn) * 255 + 0.5)); out[i + 1] = Math.max(0, Math.min(255, (g + gn) * 255 + 0.5)); out[i + 2] = Math.max(0, Math.min(255, (b + gn) * 255 + 0.5));
  }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toFile(path.join(OUT, f));
}
console.log(files.length, "frames graded at", K, "in", ((Date.now() - t0) / 1000).toFixed(0), "s");
