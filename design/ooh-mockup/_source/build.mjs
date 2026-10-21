// Cromatic · Litorsal OOH mockups (TASK-069, TASK-093): from the rendered plates to the site. LOCAL ONLY.
//   PLATES=<dir> node build.mjs
// The plates (render.mjs --jobs, see jobs.json): per piece a plate (bg), what stands in front of the tram (fg) and the
// tram as a strip; "g-" the gable in 4:5 (phones), "gw-" the gable in 3:2 (wider screens). Writes, per piece:
//   site/media/ooh/<still>.jpg (the piece's first frame on the page: the plate with the tram where the piece starts)
//   site/media/ooh/<pre>-*-s1.webp / -s2.webp (its pictures, two densities, as the metro pieces)
//   src/lottie-ui/<name>-s1.json / -s2.json (the tram crosses under the banner, right to left)
// and site/cases/src/ooh-assets.mjs (the pictures by piece, "m:" keys), the stills' sizes in site/cases/src/dims.json.
// (TASK-093: the boulevard and the tram stop stills are off the page; their scenes stay in scene/ and shots.mjs.)
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { Comp, group, rect, gfill } from "../../metro-mockup/_source/lot.mjs";
import { grade } from "./grade.mjs";
import { SHOTS } from "./shots.mjs";

const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, "../../..");
const PL = process.env.PLATES; if (!PL) throw new Error("PLATES=<dir>");
const media = path.join(root, "site/media/ooh"); fs.mkdirSync(media, { recursive: true });
const dimsF = path.join(root, "site/cases/src/dims.json"), dims = JSON.parse(fs.readFileSync(dimsF, "utf8"));
const jpg = (s) => s.jpeg({ quality: 82, mozjpeg: true });
let kb = 0;
const put = async (s, f) => { await s.toFile(f); const n = fs.statSync(f).size; kb += n; return n; };

const FPS = 60, sec = (s) => Math.round(s * FPS);
const OOH = {};
// one piece: name (src/lottie-ui), its shot (shots.mjs), the plates' prefix, the strip's top row in the frame (render.mjs
// where: the window's top edge, y1 above the eye, at the tram's depth), the still's name, s1's density, where the tram
// stands in the still (m from the camera's x)
async function gablePiece({ name, shot, pre, stripTop, still, s1k, atOff }) {
  const S = SHOTS[shot], W = S.W, H = S.H;
  const TJ = JSON.parse(fs.readFileSync(path.join(PL, pre + "-tram.json"), "utf8")); // (the strip: win in m, pxm at its render size)
  const k0 = TJ.pxm / (W / (2 * TJ.D * Math.tan((S.cam.hfov / 2) * Math.PI / 180))); // (the strip's own density: 1.5)
  const pxm = TJ.pxm / k0; // comp px per metre at the tram's depth
  const camX = S.cam.pos[0], stripW = Math.round(TJ.W / k0), stripH = Math.round(TJ.H / k0);
  // the strip's top in the frame: the window's top edge (y1 above the eye) at the tram's depth (render.mjs where)
  // (passed in)
  // the tram's centre (world x) over time: from just off the right edge to just off the left, at a steady 8 m/s (29 km/h)
  const v = 8, half = (TJ.win[1] - TJ.win[0]) / 2, view = W / 2 / pxm;
  const xIn = camX + view + half + 0.5, xOut = camX - view - half - 0.5, T0 = 1.2, Tx = (xIn - xOut) / v, END = Math.max(10, Math.ceil(T0 + Tx + 2));
  const xAt = (t) => (t < T0 ? xIn : t > T0 + Tx ? xOut : xIn - v * (t - T0));
  const AT = sec(T0 + (xIn - (camX + atOff)) / v); // the piece's first frame on the page: the tram mid-frame, a little left
  const px = (x) => W / 2 + (x - camX) * pxm - stripW / 2;

  // the pictures: graded (no vignette: the piece draws its own), s2 at the comp's size, s1 at half
  const BG = pre + "-bg", FG = pre + "-fg", TR = pre + "-tram";
  const pics = {
    [BG]: await grade(path.join(PL, BG + ".png"), { width: W, shot: "gable", look: { vig: 0 } }),
    [FG]: await grade(path.join(PL, FG + ".png"), { width: W, shot: "gable", look: { vig: 0, grain: 0, alpha: true } }),
    [TR]: await grade(path.join(PL, TR + ".png"), { width: stripW, shot: "gable", look: { vig: 0, grain: 0.012, alpha: true, seed: 77 } })
  };
  const raw = {};
  for (const [id, s] of Object.entries(pics)) raw[id] = await s.png().toBuffer();
  // (the fg plate is mostly empty: only its pole's box is kept, placed by its offset)
  const fgBox = await (async () => { const { data, info } = await sharp(raw[FG]).raw().toBuffer({ resolveWithObject: true }); let x0 = info.width, x1 = -1, y0 = info.height, y1 = -1; for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 2) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return x1 < 0 ? null : { x: Math.max(0, x0 - 2), y: Math.max(0, y0 - 2), w: Math.min(info.width, x1 + 3) - Math.max(0, x0 - 2), h: Math.min(info.height, y1 + 3) - Math.max(0, y0 - 2) }; })();
  if (fgBox) raw[FG] = await sharp(raw[FG]).extract({ left: fgBox.x, top: fgBox.y, width: fgBox.w, height: fgBox.h }).png().toBuffer();
  const files = {};
  for (const f of fs.readdirSync(media)) if (f.startsWith(pre + "-") && /-s[12]\.webp$/.test(f)) fs.rmSync(path.join(media, f));
  for (const [id, buf] of Object.entries(raw)) {
    const m = await sharp(buf).metadata();
    for (const [set, k] of [["s1", s1k], ["s2", 1]]) { // (s1 at 0.8, not the metro pieces' 0.5: this frame is half a row wide, ~470 px on a laptop, ~940 device px)
      const w = Math.round(m.width * k), h = Math.round(m.height * k), f = path.join(media, `${id}-${set}.webp`);
      await put(sharp(buf).resize({ width: w, height: h }).webp({ quality: set === "s1" ? 78 : 80, alphaQuality: 90, effort: 6 }), f);
      (files[set] ||= {})[id] = { w, h, k };
    }
  }

  // the piece (one timeline, two densities)
  function piece(set) {
    const op = sec(END), Cm = new Comp({ w: W, h: H, op, fr: FPS, nm: name });
    const img = (id) => { const a = files[set][id]; Cm.image(id, { w: a.w, h: a.h, k: a.k, file: id + ".webp" }); };
    [BG, FG, TR].forEach(img);
    // the vignette (the stills' lens, drawn once over everything)
    Cm.shape("vignette", [group("v", [rect(W * 1.02, H * 1.02, W / 2, H / 2), gfill({ type: 2, s: [W / 2, H / 2], e: [W / 2 + Math.hypot(W, H) * 0.56, H / 2], stops: [[0, "#000000"], [0.5, "#000000"], [1, "#000000"]], alphas: [[0, 0], [0.5, 0], [1, 0.34]] })])]);
    // a held camera: a slow breath of scale and drift that closes on itself
    const SIN = [0.37, 0, 0.63, 1], q = op / 4;
    const cam = Cm.nul("camera", { ks: { a: [W / 2, H / 2], p: { kf: [[0, [W / 2, H / 2], SIN], [Math.round(q), [W / 2 + 2, H / 2 - 1.5], SIN], [Math.round(2 * q), [W / 2, H / 2], SIN], [Math.round(3 * q), [W / 2 - 2, H / 2 + 1.5], SIN], [op, [W / 2, H / 2]]] }, s: { kf: [[0, [101, 101], SIN], [Math.round(2 * q), [101.6, 101.6], SIN], [op, [101, 101]]] } } });
    if (fgBox) Cm.imgLayer("in front: the near pole and lamp", FG, { parent: cam, ks: { p: [fgBox.x, fgBox.y] } });
    // the tram: linear, steady (its keys: in, the crossing, out)
    const y = stripTop;
    Cm.imgLayer("tram", TR, { parent: cam, ks: { p: { kf: [[0, [px(xIn), y], "hold"], [sec(T0), [px(xIn), y], [0, 0, 1, 1]], [sec(T0 + Tx), [px(xOut), y], "hold"], [op, [px(xOut), y]]] } } });
    Cm.imgLayer("street", BG, { parent: cam });
    Cm.marker("loop", 0, op);
    return Cm.json();
  }
  for (const set of ["s1", "s2"]) fs.writeFileSync(path.join(root, "src/lottie-ui", `${name}-${set}.json`), JSON.stringify(piece(set)));

  // the still: the frame AT, as the piece draws it (the tram at its place, the pole, the camera's breath, the vignette)
  {
    const t = AT / FPS, x = Math.round(px(xAt(t)));
    const ph = (AT / sec(END)) * 2 * Math.PI; // (the breath at AT: the keys above are a sine's quarter turns, near enough)
    const sc = 1.01 + 0.006 * (1 - Math.cos(ph)) / 2;
    const comp = [{ input: raw[TR], left: x, top: Math.round(stripTop) }];
    if (fgBox) comp.push({ input: raw[FG], left: fgBox.x, top: fgBox.y });
    // (the strip runs off the frame: composite on a wider canvas, then cut the frame back)
    const pad = stripW;
    let base = await sharp(raw[BG]).extend({ left: pad, right: pad, background: "#000" }).composite(comp.map((c) => ({ ...c, left: c.left + pad }))).png().toBuffer();
    base = await sharp(base).extract({ left: pad, top: 0, width: W, height: H }).png().toBuffer();
    const sw = Math.round(W * sc), sh = Math.round(H * sc);
    base = await sharp(base).resize({ width: sw, height: sh }).extract({ left: Math.round((sw - W) / 2), top: Math.round((sh - H) / 2), width: W, height: H }).png().toBuffer();
    // the vignette, as the piece's: black, 0 inside half the radius, 0.34 at 0.56 of the diagonal
    const R = Math.hypot(W, H) * 0.56, vg = Buffer.alloc(W * H * 4);
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const d = Math.hypot(xx - W / 2, yy - H / 2) / R, a = d < 0.5 ? 0 : Math.min(1, (d - 0.5) / 0.5) * 0.34; vg[(yy * W + xx) * 4 + 3] = Math.round(a * 255); }
    base = await sharp(base).composite([{ input: vg, raw: { width: W, height: H, channels: 4 } }]).png().toBuffer();
    const f = path.join(media, still + ".jpg"), n = await put(jpg(sharp(base)), f);
    dims["m:ooh/" + still] = [W, H, n];
  }
  OOH[name] = Object.fromEntries(["s1", "s2"].map((set) => [set, Object.fromEntries(Object.keys(files[set]).map((id) => [id, `m:ooh/${id}-${set}`]))]));
  console.log(name, "AT", AT, "frames", sec(END), "tram", Tx.toFixed(2) + " s");
  for (const set of ["s1", "s2"]) { const s = Object.keys(files[set]).reduce((a, id) => a + fs.statSync(path.join(media, `${id}-${set}.webp`)).size, 0); console.log(" ", set, Math.round(s / 1024) + " KB", JSON.stringify(files[set])); }
  return AT;
}
// (s1 at 0.8 / 0.7, not the metro pieces' 0.5: the 4:5 frame is ~350-470 px wide, the 3:2 one ~880 px on a laptop)
await gablePiece({ name: "ooh-gable", shot: "gable", pre: "g", stripTop: 872.35, still: "gable-still", s1k: 0.8, atOff: -3.2 });
await gablePiece({ name: "ooh-gable-wide", shot: "gableWide", pre: "gw", stripTop: 709.75, still: "gable-wide-still", s1k: 0.7, atOff: -1.5 });
for (const k of ["m:ooh/boulevard", "m:ooh/shelter"]) delete dims[k];

// the pictures' addresses by piece and set (the build swaps the m: keys for hashed addresses)
fs.writeFileSync(path.join(root, "site/cases/src/ooh-assets.mjs"), `// TASK-069: the Litorsal OOH mockups' pictures, by piece and set (written by design/ooh-mockup/_source/build.mjs)\nexport const OOH = ${JSON.stringify(OOH, null, 1)};\n`);
const tail = fs.readFileSync(dimsF, "utf8").endsWith("\n") ? "\n" : "";
fs.writeFileSync(dimsF, JSON.stringify(dims, null, 1).replace(/^ +/gm, "") + tail);
console.log("media written", Math.round(kb / 1024) + " KB");
