// Cromatic · Litorsal OOH mockups (TASK-069): the grade, after the render. A summer afternoon's film look: a gentle S
// curve, warm highlights and cool shadows, the greens dried toward olive (Bucharest in July), a lens vignette and a
// fine grain (seeded: the same picture every time). The artwork on the boards is graded with the scene, as a camera
// would see it; nothing is painted over it. LOCAL ONLY.
//   node grade.mjs <in.png> <out.jpg|.png|.webp> [width] [shot]
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { rng } from "../../metro-mockup/_source/scene/lib.js";

const LOOK = {
  boulevard: { curve: 0.16, warm: 0.05, cool: 0.04, dry: 0.3, vig: 0.3, grain: 0.022, lift: 0.012 },
  gable: { curve: 0.14, warm: 0.035, cool: 0.03, dry: 0.3, vig: 0.24, grain: 0.02, lift: 0.01 },
  shelter: { curve: 0.12, warm: 0.04, cool: 0.05, dry: 0.15, vig: 0.34, grain: 0.024, lift: 0.018 }
};
export async function grade(inp, { width, shot = "boulevard", look = {} } = {}) {
  const L = { ...LOOK[shot], ...look };
  let img = sharp(inp).removeAlpha();
  if (width) img = img.resize({ width, kernel: "lanczos3" });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info, r = rng(4242);
  const out = Buffer.alloc(W * H * 3);
  const S = (x) => x - (L.curve * Math.sin(2 * Math.PI * x)) / (2 * Math.PI); // (steeper in the mids by 1 + curve)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C, o = (y * W + x) * 3;
    let R = data[i] / 255, G = data[i + 1] / 255, B = data[i + 2] / 255;
    // dry the greens: a pixel greener than both its red and blue goes toward olive
    const gx = G - Math.max(R, B);
    if (gx > 0) { const k = Math.min(1, gx * 6) * L.dry; R += (G - R) * 0.45 * k; G -= gx * 0.35 * k; }
    // split tone by luma: warm the highlights, cool the shadows
    const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, hi = Math.max(0, Y - 0.45) / 0.55, lo = Math.max(0, 0.45 - Y) / 0.45;
    R *= 1 + L.warm * hi - L.cool * 0.5 * lo; G *= 1 + L.warm * 0.35 * hi; B *= 1 - L.warm * 0.9 * hi + L.cool * lo;
    // the curve, a lift in the blacks
    R = L.lift + (1 - L.lift) * S(Math.min(1, Math.max(0, R))); G = L.lift + (1 - L.lift) * S(Math.min(1, Math.max(0, G))); B = L.lift + (1 - L.lift) * S(Math.min(1, Math.max(0, B)));
    // vignette (a lens's: smooth, oval with the frame)
    const u = (x / W - 0.5) * 2, v = (y / H - 0.5) * 2, d = Math.min(1, (u * u + v * v) / 2), vg = 1 - L.vig * d * d * (3 - 2 * d);
    // grain: luma noise, stronger in the mids
    const n = (r() + r() + r() - 1.5) * L.grain * (0.5 + 2 * Y * (1 - Y));
    out[o] = Math.max(0, Math.min(255, Math.round((R * vg + n) * 255)));
    out[o + 1] = Math.max(0, Math.min(255, Math.round((G * vg + n) * 255)));
    out[o + 2] = Math.max(0, Math.min(255, Math.round((B * vg + n) * 255)));
  }
  return sharp(out, { raw: { width: W, height: H, channels: 3 } });
}
if (process.argv[1] && process.argv[1].endsWith("grade.mjs")) {
  const [inp, outp, w, shot] = process.argv.slice(2);
  const s = await grade(inp, { width: w ? +w : undefined, shot });
  if (outp.endsWith(".jpg")) await s.jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(outp);
  else if (outp.endsWith(".webp")) await s.webp({ quality: 80, effort: 6 }).toFile(outp);
  else await s.png().toFile(outp);
  console.log(outp);
}
