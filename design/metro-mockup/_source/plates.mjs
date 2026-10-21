// Cromatic · metro mockups (TASK-062): the rendered layers (RAW PNGs) to the pieces' pictures, in two sets:
//   s2: the shot's own size (1920 or 1080 px wide: the MP4s and screens that draw the piece wider than ~1000 px)
//   s1: half of it (phones, ordinary screens)
// each as WebP (alpha where the layer has it), with where it lands in the shot (plates.json: px of the s2 frame).
//   RAW=<dir with <shot>/*.png> OUT=<dir> node plates.mjs [shot ...]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { SHOTS, camPx } from "./shots.mjs";

const RAW = process.env.RAW, OUT = process.env.OUT;
const here = path.dirname(new URL(import.meta.url).pathname);
const PJ = path.join(here, "plates.json");
const plates = fs.existsSync(PJ) ? JSON.parse(fs.readFileSync(PJ, "utf8")) : {};
const shots = process.argv.slice(2).length ? process.argv.slice(2) : ["platform", "train", "inside"];
const Q = { photo: 82, alpha: 80 };
const meta = (shot, name) => JSON.parse(fs.readFileSync(`${RAW}/${shot}/${name}.json`, "utf8"));
const src = (shot, name) => `${RAW}/${shot}/${name}.png`;
fs.mkdirSync(`${OUT}/s1`, { recursive: true }); fs.mkdirSync(`${OUT}/s2`, { recursive: true });

// write one picture in both sets: img (a sharp pipeline factory) at k px per s2 px; x, y: its top-left in s2 px
async function put(id, mk, { k, x = 0, y = 0, alpha = false, q, s1min = 0.5, kmax = 1 }) {
  // (materialised first: metadata() of a pipeline is its input's, not the crop's)
  const { data: buf, info } = await mk().png().toBuffer({ resolveWithObject: true }), w = info.width, h = info.height;
  mk = () => sharp(buf);
  const enc = (p) => p.webp({ quality: q || (alpha ? Q.alpha : Q.photo), alphaQuality: 90, effort: 6, smartSubsample: true });
  // s2: at most 1 px per s2 px
  const k2 = Math.min(k, kmax), w2 = Math.round((w * k2) / k), h2 = Math.round((h * k2) / k); // (kmax: soft pictures need fewer pixels)
  await enc(mk().resize(w2, h2, { kernel: "lanczos3" })).toFile(`${OUT}/s2/${id}.webp`);
  // s1: half the s2 density (never below s1min of the source's own)
  const k1 = Math.min(k2 / 2, k), w1 = Math.round((w * k1) / k), h1 = Math.round((h * k1) / k);
  await enc(mk().resize(w1, h1, { kernel: "lanczos3" })).toFile(`${OUT}/s1/${id}.webp`);
  const kb = (f) => +(fs.statSync(f).size / 1024).toFixed(1);
  return { id, x: +x.toFixed(2), y: +y.toFixed(2), s2: { w: w2, h: h2, k: k2, kb: kb(`${OUT}/s2/${id}.webp`) }, s1: { w: w1, h: h1, k: k1, kb: kb(`${OUT}/s1/${id}.webp`) } };
}

for (const shot of shots) {
  if (!fs.existsSync(`${RAW}/${shot}`)) continue;
  const P = camPx(shot), sh = SHOTS[shot], out = {};
  const has = (n) => fs.existsSync(src(shot, n));
  if (shot === "train") {
    const c = sh.cam, D = c.pos[2] - (-3.12 + 1.4); // (the car's side)
    const pxm = P.f / D;
    // the station; and its platform below the edge, as a layer over the train (the edge hides the train's skirt)
    const bg = meta(shot, "t-bg"), kb = bg.job.scale;
    out["t-bg"] = await put("t-bg", () => sharp(src(shot, "t-bg")), { k: kb });
    const edgeRow = P.horizon + (c.pos[1] - 0) * (P.f / (c.pos[2] + 1.6)); // (the nosing's front edge at y = 0, z = -1.6)
    const er = Math.floor(edgeRow - 1);
    out["t-fg"] = await put("t-fg", () => sharp(src(shot, "t-bg")).extract({ left: 0, top: Math.round(er * kb), width: Math.round(sh.W * kb), height: Math.round((sh.H - er) * kb) }), { k: kb, y: er });
    out.edgeRow = edgeRow; out.floorRow = P.horizon + c.pos[1] * pxm; // (where y = 0 lands at the car's depth: the mirror's axis)
    // the cars: a strip is 19.6 m (the car and half a gap each side) centred on world x = 0
    for (const n of ["t-car-wrap-sharp", "t-car-wrap-b1", "t-car-wrap-b2", "t-car-plain-b1", "t-car-plain-b2"]) {
      if (!has(n)) continue;
      const m = meta(shot, n), k = m.pxm / pxm, [x0, , , y1] = m.win;
      const left = P.cx + x0 * pxm, top = P.horizon - y1 * pxm;
      if (n === "t-car-wrap-sharp") { // (only the middle is ever seen sharp: +-6.2 m)
        const hw = 6.2 * m.pxm, cxr = m.W / 2;
        out[n] = await put(n, () => sharp(src(shot, n)).extract({ left: Math.round(cxr - hw), top: 0, width: Math.round(2 * hw), height: m.H }), { k, x: P.cx - 6.2 * pxm, y: top, alpha: true });
      } else out[n] = await put(n, () => sharp(src(shot, n)), { k, x: left, y: top, alpha: true, q: 74 });
    }
    out.pxm = pxm; out.carPitch = 19.6 * pxm;
    if (has("t-person")) { const m = meta(shot, "t-person"), k = m.job.scale, [x, y] = m.rect; out["t-person"] = await put("t-person", () => sharp(src(shot, "t-person")), { k, x: x / k, y: y / k, alpha: true, q: 70, kmax: 0.5 }); out["t-person"].foot = m.foot.map((v) => +(v / k).toFixed(1)); }
    for (const n of ["t-leaf-la", "t-leaf-lb", "t-leaf-ra", "t-leaf-rb"]) {
      if (!has(n)) continue;
      const m = meta(shot, n), k = m.job.scale, [x, y] = m.rect;
      out[n] = await put(n, () => sharp(src(shot, n)), { k, x: x / k, y: y / k, alpha: true });
    }
  }
  if (shot === "platform") {
    const bg = meta(shot, "p-bg");
    out["p-bg"] = await put("p-bg", () => sharp(src(shot, "p-bg")), { k: bg.job.scale });
    for (let w = 0; w < 6; w++) for (let f = 0; f < 16; f++) {
      const n = `p-w${w}-${f}`; if (!has(n)) continue;
      const m = meta(shot, n), k = m.job.scale, [x, y] = m.rect;
      out[n] = await put(n, () => sharp(src(shot, n)), { k, x: x / k, y: y / k, alpha: true, q: 66, kmax: 0.5 });
      out[n].foot = m.foot.map((v) => +(v / k).toFixed(1));
    }
  }
  if (shot === "inside") {
    const c = sh.cam;
    for (const n of ["i-int", "i-refl"]) if (has(n)) { const m = meta(shot, n); out[n] = await put(n, () => sharp(src(shot, n)), { k: m.job.scale, alpha: n === "i-int", q: n === "i-refl" ? 70 : undefined }); }
    for (const n of ["i-leaf-a", "i-leaf-b"]) if (has(n)) { const m = meta(shot, n), k = m.job.scale, [x, y] = m.rect; out[n] = await put(n, () => sharp(src(shot, n)), { k, x: x / k, y: y / k, alpha: true }); }
    for (const n of ["i-near-sharp", "i-near-blur", "i-far", "i-far-blur"]) {
      if (!has(n)) continue;
      const m = meta(shot, n), pxm = P.f / m.D, k = m.pxm / pxm, [x0, , , y1] = m.win;
      out[n] = await put(n, () => sharp(src(shot, n)), { k, x: P.cx + x0 * pxm, y: P.horizon - y1 * pxm, alpha: true, q: 72 });
      out[n].pxm = pxm;
    }
  }
  plates[shot] = out;
  const tot = (s) => Object.values(out).reduce((a, v) => a + (v && v[s] ? v[s].kb : 0), 0).toFixed(0);
  console.log(shot, Object.keys(out).length, "entries; s1", tot("s1"), "KB; s2", tot("s2"), "KB");
}
fs.writeFileSync(PJ, JSON.stringify(plates, null, 1));
