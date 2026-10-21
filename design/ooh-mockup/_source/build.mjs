// Cromatic · Litorsal OOH mockups (TASK-069): from the rendered plates to the site. LOCAL ONLY.
//   PLATES=<dir> node build.mjs
// The plates (render.mjs --jobs, see jobs.json): b-bg (the boulevard), s-bg (the tram stop), g-bg, g-fg, g-tram (the
// gable, its pole in front, the tram as a strip). Writes:
//   site/media/ooh/boulevard.jpg, shelter.jpg (the two stills, graded, 1600 wide)
//   site/media/ooh/gable-still.jpg (the gable piece's first frame: the plate with the tram where the piece starts)
//   site/media/ooh/g-*-s1.webp / -s2.webp (the piece's pictures, two densities, as the metro pieces)
//   src/lottie-ui/ooh-gable-s1.json / -s2.json (the piece: the tram crosses under the banner, right to left)
//   site/cases/src/ooh-assets.mjs (the piece's pictures by id, "m:" keys), the stills' sizes in site/cases/src/dims.json
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

// ---------- the two stills ----------
for (const [plate, shot, name] of [["b-bg", "boulevard", "boulevard"], ["s-bg", "shelter", "shelter"]]) {
  const f = path.join(media, name + ".jpg"), n = await put(jpg(await grade(path.join(PL, plate + ".png"), { width: 1600, shot })), f);
  const m = await sharp(f).metadata(); dims[`m:ooh/${name}`] = [m.width, m.height, n];
}

// ---------- the gable: a tram crosses under the banner ----------
const S = SHOTS.gable, W = S.W, H = S.H, FPS = 60, sec = (s) => Math.round(s * FPS);
const TJ = JSON.parse(fs.readFileSync(path.join(PL, "g-tram.json"), "utf8")); // (the strip: win in m, pxm at its render size)
const k0 = TJ.pxm / (W / (2 * TJ.D * Math.tan((S.cam.hfov / 2) * Math.PI / 180))); // (the strip's own density: 1.5)
const pxm = TJ.pxm / k0; // comp px per metre at the tram's depth
const camX = S.cam.pos[0], stripW = Math.round(TJ.W / k0), stripH = Math.round(TJ.H / k0);
// the strip's top in the frame: the window's top edge (y1 above the eye) at the tram's depth (render.mjs where)
const stripTop = 872.35;
// the tram's centre (world x) over time: from just off the right edge to just off the left, at a steady 8 m/s (29 km/h)
const v = 8, half = (TJ.win[1] - TJ.win[0]) / 2, view = W / 2 / pxm;
const xIn = camX + view + half + 0.5, xOut = camX - view - half - 0.5, T0 = 1.2, Tx = (xIn - xOut) / v, END = 10;
const xAt = (t) => (t < T0 ? xIn : t > T0 + Tx ? xOut : xIn - v * (t - T0));
const AT = sec(T0 + (xIn - (camX - 3.2)) / v); // the piece's first frame on the page: the tram mid-frame, a little left
const px = (x) => W / 2 + (x - camX) * pxm - stripW / 2;

// the pictures: graded (no vignette: the piece draws its own), s2 at the comp's size, s1 at half
const pics = {
  "g-bg": await grade(path.join(PL, "g-bg.png"), { width: W, shot: "gable", look: { vig: 0 } }),
  "g-fg": await grade(path.join(PL, "g-fg.png"), { width: W, shot: "gable", look: { vig: 0, grain: 0, alpha: true } }),
  "g-tram": await grade(path.join(PL, "g-tram.png"), { width: stripW, shot: "gable", look: { vig: 0, grain: 0.012, alpha: true, seed: 77 } })
};
const raw = {};
for (const [id, s] of Object.entries(pics)) raw[id] = await s.png().toBuffer();
// (the fg plate is mostly empty: only its pole's box is kept, placed by its offset)
const fgBox = await (async () => { const { data, info } = await sharp(raw["g-fg"]).raw().toBuffer({ resolveWithObject: true }); let x0 = info.width, x1 = -1, y0 = info.height, y1 = -1; for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 2) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return x1 < 0 ? null : { x: Math.max(0, x0 - 2), y: Math.max(0, y0 - 2), w: Math.min(info.width, x1 + 3) - Math.max(0, x0 - 2), h: Math.min(info.height, y1 + 3) - Math.max(0, y0 - 2) }; })();
if (fgBox) raw["g-fg"] = await sharp(raw["g-fg"]).extract({ left: fgBox.x, top: fgBox.y, width: fgBox.w, height: fgBox.h }).png().toBuffer();
const files = {};
for (const f of fs.readdirSync(media)) if (/^g-.*-s[12]\.webp$/.test(f)) fs.rmSync(path.join(media, f));
for (const [id, buf] of Object.entries(raw)) {
  const m = await sharp(buf).metadata();
  for (const [set, k] of [["s1", 0.5], ["s2", 1]]) {
    const w = Math.round(m.width * k), h = Math.round(m.height * k), f = path.join(media, `${id}-${set}.webp`);
    await put(sharp(buf).resize({ width: w, height: h }).webp({ quality: set === "s1" ? 78 : 80, alphaQuality: 90, effort: 6 }), f);
    (files[set] ||= {})[id] = { w, h, k };
  }
}

// the piece (one timeline, two densities)
function piece(set) {
  const op = sec(END), Cm = new Comp({ w: W, h: H, op, fr: FPS, nm: "ooh-gable" });
  const img = (id) => { const a = files[set][id]; Cm.image(id, { w: a.w, h: a.h, k: a.k, file: id + ".webp" }); };
  ["g-bg", "g-fg", "g-tram"].forEach(img);
  // the vignette (the stills' lens, drawn once over everything)
  Cm.shape("vignette", [group("v", [rect(W * 1.02, H * 1.02, W / 2, H / 2), gfill({ type: 2, s: [W / 2, H / 2], e: [W / 2 + Math.hypot(W, H) * 0.56, H / 2], stops: [[0, "#000000"], [0.5, "#000000"], [1, "#000000"]], alphas: [[0, 0], [0.5, 0], [1, 0.34]] })])]);
  // a held camera: a slow breath of scale and drift that closes on itself
  const SIN = [0.37, 0, 0.63, 1], q = op / 4;
  const cam = Cm.nul("camera", { ks: { a: [W / 2, H / 2], p: { kf: [[0, [W / 2, H / 2], SIN], [Math.round(q), [W / 2 + 2, H / 2 - 1.5], SIN], [Math.round(2 * q), [W / 2, H / 2], SIN], [Math.round(3 * q), [W / 2 - 2, H / 2 + 1.5], SIN], [op, [W / 2, H / 2]]] }, s: { kf: [[0, [101, 101], SIN], [Math.round(2 * q), [101.6, 101.6], SIN], [op, [101, 101]]] } } });
  if (fgBox) Cm.imgLayer("the near pole", "g-fg", { parent: cam, ks: { p: [fgBox.x, fgBox.y] } });
  // the tram: linear, steady (its keys: in, the crossing, out)
  const y = stripTop;
  Cm.imgLayer("tram", "g-tram", { parent: cam, ks: { p: { kf: [[0, [px(xIn), y], "hold"], [sec(T0), [px(xIn), y], [0, 0, 1, 1]], [sec(T0 + Tx), [px(xOut), y], "hold"], [op, [px(xOut), y]]] } } });
  Cm.imgLayer("street", "g-bg", { parent: cam });
  Cm.marker("loop", 0, op);
  return Cm.json();
}
for (const set of ["s1", "s2"]) fs.writeFileSync(path.join(root, "src/lottie-ui", `ooh-gable-${set}.json`), JSON.stringify(piece(set)));

// the still: the frame AT, as the piece draws it (the tram at its place, the pole, the camera's breath, the vignette)
{
  const t = AT / FPS, x = Math.round(px(xAt(t)));
  const ph = (AT / sec(END)) * 2 * Math.PI; // (the breath at AT: the keys above are a sine's quarter turns, near enough)
  const sc = 1.01 + 0.006 * (1 - Math.cos(ph)) / 2;
  const comp = [{ input: raw["g-tram"], left: x, top: Math.round(stripTop) }];
  if (fgBox) comp.push({ input: raw["g-fg"], left: fgBox.x, top: fgBox.y });
  // (the strip runs off the frame: composite on a wider canvas, then cut the frame back)
  const pad = stripW;
  let base = await sharp(raw["g-bg"]).extend({ left: pad, right: pad, background: "#000" }).composite(comp.map((c) => ({ ...c, left: c.left + pad }))).png().toBuffer();
  base = await sharp(base).extract({ left: pad, top: 0, width: W, height: H }).png().toBuffer();
  const sw = Math.round(W * sc), sh = Math.round(H * sc);
  base = await sharp(base).resize({ width: sw, height: sh }).extract({ left: Math.round((sw - W) / 2), top: Math.round((sh - H) / 2), width: W, height: H }).png().toBuffer();
  // the vignette, as the piece's: black, 0 inside half the radius, 0.34 at 0.56 of the diagonal
  const R = Math.hypot(W, H) * 0.56, vg = Buffer.alloc(W * H * 4);
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const d = Math.hypot(xx - W / 2, yy - H / 2) / R, a = d < 0.5 ? 0 : Math.min(1, (d - 0.5) / 0.5) * 0.34; vg[(yy * W + xx) * 4 + 3] = Math.round(a * 255); }
  base = await sharp(base).composite([{ input: vg, raw: { width: W, height: H, channels: 4 } }]).png().toBuffer();
  const f = path.join(media, "gable-still.jpg"), n = await put(jpg(sharp(base)), f);
  dims["m:ooh/gable-still"] = [W, H, n];
}

// the pictures' addresses by piece and set (the build swaps the m: keys for hashed addresses)
const OOH = { "ooh-gable": Object.fromEntries(["s1", "s2"].map((set) => [set, Object.fromEntries(Object.keys(files[set]).map((id) => [id, `m:ooh/${id}-${set}`]))])) };
fs.writeFileSync(path.join(root, "site/cases/src/ooh-assets.mjs"), `// TASK-069: the Litorsal OOH mockups' pictures, by piece and set (written by design/ooh-mockup/_source/build.mjs)\nexport const OOH = ${JSON.stringify(OOH, null, 1)};\n`);
const tail = fs.readFileSync(dimsF, "utf8").endsWith("\n") ? "\n" : "";
fs.writeFileSync(dimsF, JSON.stringify(dims, null, 1).replace(/^ +/gm, "") + tail);
console.log("AT", AT, "frames", sec(END), "tram", Tx.toFixed(2) + " s", "media", Math.round(kb / 1024) + " KB");
for (const set of ["s1", "s2"]) { const s = Object.keys(files[set]).reduce((a, id) => a + fs.statSync(path.join(media, `${id}-${set}.webp`)).size, 0); console.log(set, Math.round(s / 1024) + " KB", JSON.stringify(files[set])); }
