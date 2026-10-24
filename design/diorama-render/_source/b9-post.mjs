// Cromatic · diorama renders · story B9: the light post per world, on the ungraded 1080 frames (sKK-NNN.jpg), before
// Iris's cards (which stay in the brand's colours). Per world, with judgement (lighter on the stylised worlds):
//   - the E8c film grade (gradeE8c.mjs, the same maths: orange-teal split kept off strong paint, vibrance, a film toe
//     and shoulder on the luminance, halation, vignette, grain) at a strength per world (GRADE below)
//   - Risograph: the map's own riso print (app.js risoRender, r130) ported per pixel: two drums (fluorescent pink takes
//     what green would reflect, medium blue what red would), round halftone dots at their own angles, each drum a
//     couple of pixels off-register, inked unevenly, multiplied on cream paper; then no film grade (it is a print)
//   - Sketchbook: drawn by the map's notebook pass in the render: no grade, only a hair of grain
//   node b9-post.mjs <in dir> <out dir> [segs 0,3,8]   -> <out>/sKK-NNN.jpg (q95)
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const [IN, OUT, segArg] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const WORLD = ["monument", "monument", "nightlife", "underwater", "circuit", "sketch", "orchid", "gta2", "riso", "ghibli", "monument"];
const GRADE = { monument: 1.0, nightlife: 1.0, underwater: 0.8, circuit: 0.9, sketch: 0, orchid: 0.8, gta2: 0.5, riso: 0, ghibli: 0.6 };
const only = segArg ? segArg.split(",").map(Number) : null;
const W = 1080, H = 1920;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function curve(x, k) { const c = 1 + 0.22 * k; let y = 0.5 + (x - 0.5) * c; const toe = 0.06 * k; if (y < 0.25) y -= toe * (1 - y / 0.25) * (y / 0.25) * 1.6; const top = 0.5 + 0.5 * c; if (y > 0.7) { const u = (y - 0.7) / (top - 0.7); y = 0.7 + 0.3 * (1 - Math.exp(-2.2 * u)) / (1 - Math.exp(-2.2)); } return Math.min(1, Math.max(0, y)); }
const LUT = new Map();
const curveLut = (k) => { const key = k.toFixed(3); if (LUT.has(key)) return LUT.get(key); const t = new Float32Array(1024); for (let i = 0; i < 1024; i++) t[i] = curve(i / 1023, k); LUT.set(key, t); return t; };
let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

async function grade(data, k, n) {
  const cl = curveLut(k), hi = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) { const y = (0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2]) / 255, m = smooth(0.72, 0.98, y); hi[i * 3] = 255 * m; hi[i * 3 + 1] = 120 * m; hi[i * 3 + 2] = 60 * m; }
  const halo = await sharp(hi, { raw: { width: W, height: H, channels: 3 } }).blur(22).raw().toBuffer();
  const out = Buffer.alloc(W * H * 3); seed = n * 7919 + 13;
  for (let p = 0, i = 0; p < W * H; p++, i += 3) {
    let r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx > 0 ? (mx - mn) / mx : 0, y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const keep = 1 - smooth(0.35, 0.75, sat) * 0.85, sh = (1 - smooth(0.05, 0.5, y)) * 0.075 * k * keep, hl = smooth(0.45, 0.95, y) * 0.07 * k * keep;
    r += -sh * 0.55 + hl * 0.9; g += sh * 0.18 + hl * 0.42; b += sh * 0.62 - hl * 0.55;
    const y2 = 0.2126 * r + 0.7152 * g + 0.0722 * b, v = 1 + 0.34 * k * (1 - sat) * (1 - sat) + 0.02 * k;
    r = y2 + (r - y2) * v; g = y2 + (g - y2) * v; b = y2 + (b - y2) * v;
    { const y3 = Math.max(1e-4, 0.2126 * r + 0.7152 * g + 0.0722 * b), cy = cl[Math.max(0, Math.min(1023, Math.round(y3 * 1023)))], q = cy / y3; r *= q; g *= q; b *= q; const m3 = Math.max(r, g, b); if (m3 > 1) { const yy3 = 0.2126 * r + 0.7152 * g + 0.0722 * b, t3 = Math.min(1, (m3 - 1) / Math.max(1e-4, m3 - yy3)); r += (yy3 - r) * t3; g += (yy3 - g) * t3; b += (yy3 - b) * t3; } }
    const hk = 0.22 * k; r += (halo[i] / 255) * hk; g += (halo[i + 1] / 255) * hk; b += (halo[i + 2] / 255) * hk;
    const x = (p % W) / W - 0.5, yy = ((p / W) | 0) / H - 0.5, rr = Math.sqrt(x * x * 0.5625 * 1.778 + yy * yy) / 0.62, vg = 1 - 0.16 * k * smooth(0.45, 1.3, rr);
    r *= vg; g *= vg; b *= vg;
    const yl = 0.2126 * r + 0.7152 * g + 0.0722 * b, gn = (rnd() + rnd() - 1) * 0.022 * Math.max(0.35, Math.min(1, k)) * (0.4 + 2.2 * yl * (1 - yl));
    out[i] = Math.max(0, Math.min(255, (r + gn) * 255 + 0.5)); out[i + 1] = Math.max(0, Math.min(255, (g + gn) * 255 + 0.5)); out[i + 2] = Math.max(0, Math.min(255, (b + gn) * 255 + 0.5));
  }
  return out;
}

// the riso print (app.js risoRender's shader, per pixel; dpr 1.4: dots ~4.3 px across at 1080, they survive the encode)
const fract = (x) => x - Math.floor(x);
const h21 = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
function vn(x, y) { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = h21(ix, iy), b = h21(ix + 1, iy), c = h21(ix, iy + 1), d = h21(ix + 1, iy + 1); return a + (b - a) * fx + (c - a) * fy * (1 - fx) + (d - b) * fx * fy; }
function dots(px, py, d, a, s) { const cs = Math.cos(a), sn = Math.sin(a), rx = (cs * px - sn * py) / s, ry = (sn * px + cs * py) / s, fx = fract(rx) - 0.5, fy = fract(ry) - 0.5, rad = Math.sqrt(Math.min(1, Math.max(0, d))) * 0.72, aa = 1.2 / s, l = Math.hypot(fx, fy); return 1 - smooth(rad - aa, rad + aa, l); }
function riso(data, n) {
  const dpr = 1.4, cell = 3.1 * dpr, out = Buffer.alloc(W * H * 3);
  const at = (x, y, c) => { x = Math.max(0, Math.min(W - 1, Math.round(x))); y = Math.max(0, Math.min(H - 1, Math.round(y))); return data[(y * W + x) * 3 + c] / 255; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const py = H - 1 - y; // (the shader's pixel space is bottom-up)
    const pR = at(x + 1.6 * dpr, y + 1.1 * dpr, 0), pG = at(x + 1.6 * dpr, y + 1.1 * dpr, 1), pB = at(x + 1.6 * dpr, y + 1.1 * dpr, 2);
    const bR = at(x - 1.3 * dpr, y - 0.9 * dpr, 0), bG = at(x - 1.3 * dpr, y - 0.9 * dpr, 1), bB = at(x - 1.3 * dpr, y - 0.9 * dpr, 2);
    const lP = 0.299 * pR + 0.587 * pG + 0.114 * pB, lB = 0.299 * bR + 0.587 * bG + 0.114 * bB;
    let dP = Math.min(1, Math.max(0, (1 - pG) * 1.15 - 0.38)), dB = Math.min(1, Math.max(0, (1 - bR) * 1.2 - 0.42)); // (B9: a little more ink than the map's: the render has no outline pass to print solid)
    const darkP = 1 - smooth(0.05, 0.18, lP), darkB = 1 - smooth(0.05, 0.18, lB);
    dP = Math.max(dP, darkP); dB = Math.max(dB, darkB);
    const inkP = 0.86 + 0.16 * vn(x * 0.012 + 3, py * 0.012 + 3) - 0.06 * vn(py * 0.004, 1), inkB = 0.88 + 0.14 * vn(x * 0.011 + 11, py * 0.011 + 11);
    let hP = dots(x, py, dP * inkP, 0.2618, cell), hB = dots(x, py, dB * inkB, 1.309, cell);
    hP = Math.max(hP, darkP * 0.9); hB = Math.max(hB, darkB);
    const pv = vn(x * 0.4, py * 0.4) * 0.025, paper = [0.953 - pv, 0.933 - pv, 0.89 - pv], pink = [1, 0.282, 0.69], blue = [0, 0.47, 0.75];
    const gr = (h21(x, py + n * 0.37) - 0.5) * 0.018;
    for (let c = 0; c < 3; c++) { const o = paper[c] * (1 + (pink[c] - 1) * hP * 0.74) * (1 + (blue[c] - 1) * hB * 0.72) + gr; out[(y * W + x) * 3 + c] = Math.max(0, Math.min(255, o * 255 + 0.5)); }
  }
  return out;
}
function grain(data, n, amt = 0.01) { const out = Buffer.from(data); seed = n * 7919 + 13; for (let i = 0; i < out.length; i += 3) { const g = (rnd() + rnd() - 1) * amt * 255; for (let c = 0; c < 3; c++) out[i + c] = Math.max(0, Math.min(255, out[i + c] + g)); } return out; }

const files = fs.readdirSync(IN).filter((f) => /^s\d\d-\d{3}\.jpg$/.test(f)).sort().filter((f) => !only || only.includes(+f.slice(1, 3)));
const t0 = Date.now();
for (const f of files) {
  const k = +f.slice(1, 3), n = k * 1000 + +f.slice(4, 7), w = WORLD[k];
  const dst = path.join(OUT, f); if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs > fs.statSync(path.join(IN, f)).mtimeMs && !process.env.FORCE) continue;
  const { data } = await sharp(path.join(IN, f)).removeAlpha().resize(W, H).raw().toBuffer({ resolveWithObject: true });
  const out = w === "riso" ? riso(data, n) : w === "sketch" ? grain(data, n, 0.008) : await grade(data, GRADE[w] * (k === 0 ? 1.1 : 1), n);
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toFile(dst);
}
console.log(files.length, "frames in", ((Date.now() - t0) / 1000).toFixed(0), "s");
