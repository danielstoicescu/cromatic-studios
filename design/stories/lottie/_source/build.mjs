// Cromatic · stories in Lottie (TASK-057, a pilot): Instagram Stories (1080x1920, 60 fps) cut from the real city.
// The city is rendered by the site's own engine (render.mjs, through harness.mjs) as depth layers at twice the story's
// size (plates.mjs: images/*.webp); here they are put back together as Lottie image layers under a virtual camera,
// with the studio's type, pills and clouds drawn as vectors (the site's Lottie toolchain: design/lottie-ui, the intro's
// writer and type).
//   story-a-<lang>.json  "Cromatic City": the bird's eye, a descent through the clouds, street level at Two Minutes
//   story-b-<lang>.json  "Same city, new paper": a street in colour, the Multiverse pill opens on Sketchbook, layer by layer
// The parallax is the camera's, not an effect's: every street camera is level, so a move sideways (T) or down (D) is
// exact for the ground (a shear and a squash about the horizon) and for whatever faces the camera (a slide of T·f/z,
// D·f/z at its depth z). The moves are baked every 2 frames.
//   node build.mjs   (the type libraries from design/node_modules, as for design/lottie-ui)
// The whole way, from the city to the MP4s (LOCAL ONLY; the map's test hook ?story is on this branch, never shipped):
//   1. PUBLIC_DIR=<scratch>/pub node build/build.mjs ; PUBLIC_DIR=<scratch>/pub PORT=8961 PRIMARY_HOST= node server.js
//   2. node harness.mjs            (a real-GPU Chromium on /?map&story, driven over HTTP on :8962)
//   3. JOB=a-air|a-street|b-street|b-sketch node render.mjs   (the cameras: shots.mjs; the layers: page-render.js)
//   4. node plates.mjs             (RAW PNGs -> images/*.webp, cropped; Sketchbook cut out with the colour alpha)
//   5. node build.mjs              (story-{a,b}-{en,ro}.json; the words: copy.mjs)
//   6. node serve.mjs ; node record.mjs story-a-en <out> <posterFrame>   (MP4 H.264 + poster); sheet.mjs: the sheet
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import opentype from "opentype.js";
import wawoff2 from "wawoff2";
import { Comp, group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, path as shp, roundRect, pathProp, rng, C, RISE, EXIT, line, capH, unionOutline, loadType, poly } from "../../../lottie-ui/_source/lib/ui.mjs";
import { COPY } from "./copy.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const PL = JSON.parse(fs.readFileSync(path.join(here, "plates.json"), "utf8"));
const W = 1080, H = 1920, K = 0.5; // the story; the plates are at 2x (K: plate px -> story px)
const INK = "#2B2E6E"; // Sketchbook's pencil (sampled from the notebook pass)
const T = await loadType();
const MONO = await openMono();

/* ======================= small helpers ======================= */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ramp = (t, t0, t1, fn = smooth) => fn(clamp((t - t0) / (t1 - t0)));
// keys baked every `step` frames over [t0, t1] (linear between: the curve is in the samples)
function bake(t0, t1, fn, step = 2) {
  const out = {};
  for (let t = t0; ; t = Math.min(t1, t + step)) {
    const v = fn(t);
    for (const k in v) (out[k] = out[k] || []).push([t, v[k], E.linear]);
    if (t >= t1) break;
  }
  for (const k in out) { const a = out[k]; a[a.length - 1] = [a[a.length - 1][0], a[a.length - 1][1]]; if (a.every((x) => JSON.stringify(x[1]) === JSON.stringify(a[0][1]))) out[k] = a[0][1]; }
  return out;
}
// skew (deg) on a layer the Comp writer has no field for
function addSkew(L, sk) { L.ks.sk = prop(sk); L.ks.sa = prop(0); }

/* ======================= JetBrains Mono (the site's utility face) as outlines ======================= */
async function openMono() {
  const dir = path.resolve(here, "../../../../site/fonts/gf");
  const open = async (f) => { const ttf = Buffer.from(await wawoff2.decompress(fs.readFileSync(path.join(dir, f)))); return opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length)); };
  const main = await open("jetbrains-mono-latin.woff2"), ext = await open("jetbrains-mono-latin-ext.woff2");
  return { main, ext, upm: main.unitsPerEm, glyph: (ch) => { const g = main.charToGlyph(ch); return g.index > 0 ? g : ext.charToGlyph(ch); } };
}
function glyphPaths(g) {
  const out = []; let cur = null, last = null; const R = (v) => Math.round(v);
  const push = (pt, inT) => { cur.v.push([R(pt[0]), R(-pt[1])]); cur.i.push([R(inT[0]), R(-inT[1])]); cur.o.push([0, 0]); };
  for (const c of g.path.commands) {
    if (c.type === "M") { cur = { v: [], i: [], o: [], c: true }; out.push(cur); push([c.x, c.y], [0, 0]); last = [c.x, c.y]; }
    else if (c.type === "L") { push([c.x, c.y], [0, 0]); last = [c.x, c.y]; }
    else if (c.type === "Q") { const c1 = [last[0] + (2 / 3) * (c.x1 - last[0]), last[1] + (2 / 3) * (c.y1 - last[1])], c2 = [c.x + (2 / 3) * (c.x1 - c.x), c.y + (2 / 3) * (c.y1 - c.y)]; cur.o[cur.o.length - 1] = [R(c1[0] - last[0]), R(-(c1[1] - last[1]))]; push([c.x, c.y], [c2[0] - c.x, c2[1] - c.y]); last = [c.x, c.y]; }
    else if (c.type === "C") { cur.o[cur.o.length - 1] = [R(c.x1 - last[0]), R(-(c.y1 - last[1]))]; push([c.x, c.y], [c.x2 - c.x, c.y2 - c.y]); last = [c.x, c.y]; }
    else if (c.type === "Z") { const n = cur.v.length; if (n > 1 && cur.v[n - 1][0] === cur.v[0][0] && cur.v[n - 1][1] === cur.v[0][1]) { cur.i[0] = cur.i[n - 1]; cur.v.pop(); cur.i.pop(); cur.o.pop(); } }
  }
  return out.filter((ct) => ct.v.length > 2);
}
// a line of mono caps at (x, baseline by), letter-spaced (em); returns { groups, width }
function monoLine(text, size, color, x, by, { tracking = 0.12 } = {}) {
  const k = size / MONO.upm, groups = []; let cx = x;
  for (const ch of [...text]) {
    const g = MONO.glyph(ch), adv = g.advanceWidth * k;
    if (ch !== " ") groups.push({ ty: "gr", nm: ch, it: [...glyphPaths(g).map((c) => ({ ty: "sh", d: 1, ks: { a: 0, k: c } })), fill(rgb(color)), { ty: "tr", p: prop([cx, by]), a: prop([0, 0]), s: prop([k * 100, k * 100]), r: prop(0), o: prop(100), sk: prop(0), sa: prop(0) }] });
    cx += adv + tracking * size;
  }
  return { groups, width: cx - x - tracking * size };
}

/* ======================= the studio's type: a headline with one word in a yellow pill ======================= */
// lines: [[text, emphWord|null], ...]; x: left, y: first baseline; letters rise in (the house rise, with its overshoot),
// the pill pops (a spring) a beat before its word; at tOut the words leave upward, the pill shrinks away
function headline(Cm, { lines, x, y, size = 100, lead = 1.04, t0, tOut, color = C.black, pillFill = C.yellow, pillInk = C.black, nm = "headline", gap = 1.1, ip = 0, op }) {
  const sw = Math.max(3, size * 0.055), padX = 0.3 * size, ph = 1.12 * size, space = 0.26 * size;
  const letters = [], pills = []; let n = 0;
  lines.forEach(([text, emph], li) => {
    const by = y + li * size * lead * (lines.some((l) => l[1]) ? 1.08 : 1);
    let cx = x;
    for (const word of text.split(" ")) {
      const isE = emph && word.replace(/[.,!?]/g, "") === emph;
      const tail = isE ? word.slice(emph.length) : ""; // (the full stop after the pill word sits outside the pill)
      const core = isE ? emph : word;
      if (isE) cx += padX;
      const tw = n * gap;
      const L = line(T, core, size, isE ? pillInk : color, cx, by, { tracking: -0.03, keys: (b, s, j) => wordKeys(b, s, t0 + tw + j * gap, size, tOut == null ? null : tOut + Math.round(n * 0.6)) });
      letters.push(...L.groups);
      if (isE) {
        const pw = L.width + padX * 2, pcx = cx - padX + pw / 2, pcy = by - 0.36 * size, tp = t0 + tw - 5;
        pills.push(group(`pill · ${core}`, [rect([pw, ph], [0, 0], 9999), stroke(rgb(C.black), sw), fill(rgb(pillFill))], {
          p: [pcx, pcy], s: [[tp, [55, 55], E.spring], [tp + 22, [100, 100], ...(tOut == null ? [] : [E.hold])], ...(tOut == null ? [] : [[tOut + 4, [100, 100], EXIT], [tOut + 18, [70, 70]]])],
          o: [[0, 0, E.hold], [tp, 100, ...(tOut == null ? [] : [E.hold])], ...(tOut == null ? [] : [[tOut + 10, 100, E.linear], [tOut + 18, 0]])]
        }));
        cx += L.width + padX;
        if (tail) { const L2 = line(T, tail, size, color, cx + size * 0.02, by, { tracking: -0.03, keys: (b, s, j) => wordKeys(b, s, t0 + tw + (core.length + j) * gap, size, tOut == null ? null : tOut + Math.round(n * 0.6)) }); letters.push(...L2.groups); cx += L2.width; }
      } else cx += L.width;
      cx += space; n++;
    }
  });
  Cm.shape(nm, [...letters, ...pills], { ip, op: op ?? Cm.op });
}
// one letter: from .42 em below, a hair squashed, on the house's rise (it overshoots); out: up .3 em and away
function wordKeys(b, s, t0, size, tOut) {
  const p = [[t0, [b[0], b[1] + 0.42 * size], RISE], [t0 + 26, b, ...(tOut == null ? [] : [E.hold])]];
  const o = [[0, 0, E.hold], [t0, 0, E.linear], [t0 + 8, 100, ...(tOut == null ? [] : [E.hold])]];
  if (tOut != null) { p.push([tOut, b, EXIT], [tOut + 16, [b[0], b[1] - 0.3 * size]]); o.push([tOut + 6, 100, E.linear], [tOut + 16, 0]); }
  return { p, s: [[t0, [s * 0.94, s * 1.1], E.out], [t0 + 20, [s, s]]], o };
}
// a mono caps label (the site's metadata voice), with a short rule before it
function label(Cm, { text, x, y, t0, tOut, color = C.black, size = 31, nm = "label", o = 86 }) {
  const L = monoLine(text, size, color, x + 54, y);
  const ks = { o: [[t0, 0, E.linear], [t0 + 12, o, ...(tOut == null ? [] : [E.hold])], ...(tOut == null ? [] : [[tOut, o, E.linear], [tOut + 12, 0]])], p: [[t0, [0, 14], E.out], [t0 + 24, [0, 0]]] };
  Cm.shape(nm, [group("text", L.groups), group("rule", [shp(poly([[x, y - size * 0.36], [x + 38, y - size * 0.36]], false)), stroke(rgb(color), 3, 100, { lc: 1 })], { s: [[t0, [0, 100], E.out], [t0 + 20, [100, 100]]], a: [x, y], p: [x, y] })], { ks });
}
// the studio's mark at the top (under Instagram's own bar): a yellow dot, "Cromatic Studios"
function mark(Cm, { x = 72, y = 262, t0 = 6, color = C.black }) {
  const L = line(T, "Cromatic Studios", 38, color, x + 40, y, { tracking: -0.02 });
  Cm.shape("mark", [group("name", L.groups), group("dot", [ellipse([24, 24], [x + 12, y - 13]), stroke(rgb(C.black), 3), fill(rgb(C.yellow))])], { ks: { o: [[t0, 0, E.linear], [t0 + 14, 100]] } });
}
// a place's label on the map's way: a white pill with a coloured dot and the place's name, on a short stem to its point
function pin(Cm, { name, at, t0, tOut, dot = C.yellow, size = 34, nm, up = 64 }) {
  const L = line(T, name, size, C.black, 0, 0, { tracking: -0.02 });
  const w = L.width + size * 1.9, h = size * 1.7, sw = 4;
  const dx = -L.width / 2 + size * 0.45;
  const body = [
    group("name", L.groups, { p: [dx, size * 0.36 - up - h / 2] }),
    group("dot", [ellipse([size * 0.5, size * 0.5], [-w / 2 + size * 0.75, -up - h / 2]), stroke(rgb(C.black), 3), fill(rgb(dot))]),
    group("pill", [rect([w, h], [0, -up - h / 2], 9999), stroke(rgb(C.black), sw), fill(rgb(C.white))]),
    group("stem", [shp(poly([[0, 0], [0, -up]], false)), stroke(rgb(C.black), sw, 100, { lc: 2 })]),
    group("foot", [ellipse([14, 14], [0, 0]), stroke(rgb(C.black), 3), fill(rgb(C.white))])
  ];
  const s = [[t0, [0, 0], E.spring], [t0 + 20, [100, 100], ...(tOut == null ? [] : [E.hold])], ...(tOut == null ? [] : [[tOut, [100, 100], EXIT], [tOut + 12, [0, 0]]])];
  Cm.shape(nm || `pin · ${name}`, body, { ip: t0, op: tOut == null ? Cm.op : tOut + 13, ks: { p: at, s } });
}

/* ======================= clouds (the site's finale clouds: bands of puffs in one black outline) ======================= */
function cloudBand(seed, { hb, rMin, rMax, fillHex }) {
  const R = rng(seed), items = [], x0 = -W / 2 - 160 - rMax, x1 = W / 2 + 160 + rMax;
  const edge = (y, dir) => { let x = x0; while (x < x1) { const r = rMin + R() * (rMax - rMin); items.push([x + r * 0.6, y + dir * (R() * 0.35 - 0.1) * r, r]); x += r * (1.05 + R() * 0.35); } };
  edge(hb / 2, 1); edge(-hb / 2, -1);
  const shapes = () => [...items.map(([x, y, r]) => ellipse([2 * r, 2 * r], [x, y])), rect([x1 - x0, hb], [(x0 + x1) / 2, 0], 0)];
  return { shapes, extent: hb / 2 + rMax * 1.1, fillHex };
}
const BANDS = [cloudBand(3, { hb: H * 1.1, rMin: 70, rMax: 150, fillHex: "#E7E7E7" }), cloudBand(8, { hb: H * 1.15, rMin: 80, rMax: 170, fillHex: C.paper }), cloudBand(13, { hb: H * 1.2, rMin: 90, rMax: 190, fillHex: C.white })];
// the camera going down through a deck of clouds: they come up from under the frame (or start over it), cover it at
// tCover, and go on up and out of the top; lags put the far band first
function clouds(Cm, { tIn, tCover, tOut, from = "below", nm = "clouds" }) {
  const LAG = [0, 4, 8], SW = 6;
  for (let bi = BANDS.length - 1; bi >= 0; bi--) {
    const b = BANDS[bi], lag = LAG[bi], cover = H / 2 + [-0.16, -0.06, 0][bi] * H;
    const y = [];
    if (from === "below") y.push([tIn + lag, H + b.extent, [0.35, 0, 0.3, 1]]);
    y.push([tCover + lag, cover, [0.55, 0, 0.6, 1]], [tOut + lag, -b.extent]);
    const x = [[from === "below" ? tIn : tCover, W / 2 + (bi - 1) * 50, E.inOut], [tOut + lag, W / 2 - (bi - 1) * 70]];
    const s = [[from === "below" ? tIn : tCover, [100, 100], E.inOut], [tOut + lag, [118 + bi * 6, 118 + bi * 6]]];
    Cm.shape(`${nm} · band ${bi}`, unionOutline(b.shapes, b.fillHex, SW), { ip: from === "below" ? tIn + lag - 1 : Math.min(0, tIn), op: tOut + lag + 1, ks: { p: { x, y }, s, a: [0, 0] } });
  }
}

/* ======================= light ======================= */
// a soft warm glow (the festoon's bulbs coming on), screen-blended
function glow(Cm, { at, r, t0, color = "#FFD27A", o = 85, parent, nm = "glow", flicker = 0 }) {
  const L = Cm.shape(nm, [group("glow", [ellipse([2 * r, 2 * r], [0, 0]), gfill({ type: 2, s: [0, 0], e: [r, 0], stops: [[0, "#FFF6D8"], [0.25, color], [1, color]], alphas: [[0, 1], [0.25, 0.7], [1, 0]] })])], {
    parent, ip: t0, ks: { p: at, o: [[t0, 0, E.out], [t0 + 6, o * 1.15, E.inOut], [t0 + 10 + flicker, o * 0.6, E.inOut], [t0 + 16 + flicker, o]], s: [[t0, [40, 40], E.out], [t0 + 14, [100, 100]]] }
  });
  L.bm = 2; return L;
}
// a band of light crossing the frame (a sun sweep), screen-blended
function sweep(Cm, { t0, t1, o = 30, angle = -24, nm = "light sweep" }) {
  const L = Cm.shape(nm, [group("band", [rect([520, H * 2.4], [0, 0]), gfill({ type: 1, s: [-260, 0], e: [260, 0], stops: [[0, "#FFE7B8"], [0.5, "#FFF3D6"], [1, "#FFE7B8"]], alphas: [[0, 0], [0.5, 1], [1, 0]] })])], {
    ip: t0, op: t1, ks: { p: [[t0, [-500, H / 2], E.inOut], [t1, [W + 500, H / 2]]], r: angle, o: [[t0, 0, E.linear], [t0 + 20, o, E.hold], [t1 - 24, o, E.linear], [t1, 0]] }
  });
  L.bm = 2; return L;
}
// the sun low in the sky: a wide warm bloom, a hot core, and three ghosts on the line through the frame's middle
function sun(Cm, { at, t0, drift = [0, 0], dur, nm = "sun", op }) {
  const g = (r, a, c = "#FFE2A8") => [ellipse([2 * r, 2 * r], [0, 0]), gfill({ type: 2, s: [0, 0], e: [r, 0], stops: [[0, c], [1, c]], alphas: [[0, a], [1, 0]] })];
  const p = [[t0, at, E.inOut], [t0 + dur, [at[0] + drift[0], at[1] + drift[1]]]];
  const fo = (a) => (op ? [[t0, 0, E.linear], [t0 + a, 100, E.hold], [op - 16, 100, E.linear], [op, 0]] : [[t0, 0, E.linear], [t0 + a, 100]]);
  const L = Cm.shape(nm, [group("core", g(70, 0.9, "#FFF8E6")), group("bloom", g(420, 0.55))], { ip: t0, op: op ?? Cm.op, ks: { p, o: fo(30) } });
  L.bm = 2;
  [[0.55, 46, 0.22], [0.9, 22, 0.3], [1.35, 70, 0.14]].forEach(([k, r, a], i) => {
    const q = (pt) => [W / 2 + (W / 2 - pt[0]) * k, H / 2 + (H / 2 - pt[1]) * k];
    const G = Cm.shape(`${nm} · ghost ${i}`, [group("ghost", g(r, a, i === 1 ? "#BFD8FF" : "#FFD9A0"))], { ip: t0, op: op ?? Cm.op, ks: { p: [[t0, q(at), E.inOut], [t0 + dur, q([at[0] + drift[0], at[1] + drift[1]])]], o: fo(40) } });
    G.bm = 2;
  });
  return L;
}
function vignette(Cm, { ip = 0, op, o = 100 } = {}) {
  Cm.shape("vignette", [group("v", [rect([W * 1.1, H * 1.1], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.46], e: [W * 1.02, H * 0.46], stops: [[0, "#1A1424"], [1, "#1A1424"]], alphas: [[0, 0], [0.66, 0], [1, 0.22]] })])], { ip, op, ks: { o } });
}


// the end: a white card high in the frame (the brand's card: a big radius, the black outline), over the sky, so the
// street stays in view under it: the label, the line, the address in the yellow pill (it lands with the house bounce)
function endCard(Cm, c, t0) {
  const x0 = 72, cw = W - 144, y0 = 300, chh = 470, cx = x0 + cw / 2, cy = y0 + chh / 2;
  label(Cm, { text: c.endLabel, x: x0 + 56, y: y0 + 84, t0: t0 + 16, nm: "end · label" });
  headline(Cm, { lines: c.end, x: x0 + 56, y: y0 + 196, size: 96, t0: t0 + 20, nm: "end · headline" });
  const url = "cromaticstudios.com", us = 52, Lu = line(T, url, us, C.black, 0, 0, { tracking: -0.02 }), uw = Lu.width + us * 1.2, uh = us * 1.5;
  const ux = x0 + 56 + uw / 2, uy = y0 + chh - 82, tu = t0 + 56;
  Cm.shape("end · address", [group("text", Lu.groups, { p: [ux - Lu.width / 2, uy + us * 0.36] }), group("pill", [rect([uw, uh], [ux, uy], 9999), stroke(rgb(C.black), 5), fill(rgb(C.yellow))])], {
    ip: tu, ks: { a: [ux, uy], p: [ux, uy], s: [[tu, [40, 40], E.spring], [tu + 18, [104, 96], E.inOut], [tu + 28, [98, 102], E.inOut], [tu + 38, [100, 100]]] }
  });
  Cm.shape("end · card", [group("card", [rect([cw, chh], [cx, cy], 54), stroke(rgb(C.black), 6), fill(rgb(C.white))])], {
    ip: t0, ks: { a: [cx, cy], p: [[t0, [cx, cy + 60], [0.2, 1.15, 0.3, 1]], [t0 + 30, [cx, cy]]], s: [[t0, [92, 92], [0.2, 1.15, 0.3, 1]], [t0 + 30, [100, 100]]], o: [[t0, 0, E.linear], [t0 + 8, 100]] }
  });
}

/* ======================= the city's layers ======================= */
// one plate (a cropped webp) as an image layer under a null that carries the camera; returns the null
function asset(Cm, name) {
  const m = PL.plates[name]; if (!m) throw new Error("no plate " + name);
  if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; }
  return m;
}
function plateLayer(Cm, name, parent, { ip = 0, op, masks, tt, nm } = {}) {
  const m = asset(Cm, name);
  const L = Cm.image(nm || `city · ${name}`, name, { ip, op: op ?? Cm.op, parent, ks: { p: [m.x, m.y] }, masks });
  if (tt) L.tt = tt;
  return L;
}
// a street shot's camera: T (sideways, + is right), D (up from the render's height), Z (a zoom) as functions of the
// frame; each layer's null gets the transform of its depth. Returns { nulls: {layer: null}, at(layer, [x, y], t) }
function streetRig(Cm, shot, { t0, t1, Tf, Df, Zf, depth, h }) {
  const S = PL.shots[shot].main, f = S.f, yh = S.horizon, nulls = {};
  const wOf = (l) => PL.plates[`${shot}-${l}`].full[0];
  const xf = (l, t) => {
    const Tm = Tf(t), Dm = Df(t), Zm = Zf(t), Wl = wOf(l), P = [Wl / 2, yh], Pc = [W / 2, yh * K];
    if (l === "ground") return { a: P, p: Pc, s: [100 * K * Zm, 100 * K * Zm * (1 + Dm / h)], sk: (Math.atan(Tm / (h + Dm)) * 180) / Math.PI };
    if (l === "sky") return { a: P, p: Pc, s: [100 * K * Zm, 100 * K * Zm] };
    const z = depth[l], dx = (-Tm * f) / z, dy = (Dm * f) / z;
    return { a: P, p: [Pc[0] + K * Zm * dx, Pc[1] + K * Zm * dy], s: [100 * K * Zm, 100 * K * Zm] };
  };
  for (const l of ["sky", "far", "ground", "mid", "near"]) {
    const ks = bake(t0, t1, (t) => { const x = xf(l, t); return { p: x.p, s: x.s, ...(x.sk != null ? { sk: x.sk } : {}) }; });
    const a = xf(l, t0).a;
    const N = Cm.nul(`camera · ${shot} · ${l}`, { ip: t0, op: t1 + 1, ks: { a, p: ks.p, s: ks.s } });
    if (ks.sk != null) addSkew(N, ks.sk);
    nulls[l] = N;
  }
  // where a point of a layer's picture (2592-wide frame coordinates) is in the story at frame t
  const at = (l, pt, t) => { const x = xf(l, t), off = (wOf(l) - wOf("mid")) / 2, u = pt[0] + off - x.a[0], v = pt[1] - x.a[1]; const sx = x.s[0] / 100, sy = x.s[1] / 100, tk = Math.tan(((x.sk || 0) * Math.PI) / 180); return [x.p[0] + sx * u + tk * sy * v, x.p[1] + sy * v]; };
  return { nulls, at, wOf };
}

/* ======================= Story A · Cromatic City ======================= */
function storyA(lang) {
  const Tx = COPY[lang].a, D = 13, Cm = new Comp({ w: W, h: H, dur: D, nm: `Cromatic · story A · Cromatic City · ${lang}` });
  // the clock (frames at 60)
  const AIR1 = 300, ST0 = 276, END = 610;
  // --- the bird's eye: one camera, three nested lenses; a zoom of x1.2 -> x4.4 (log-even, easing in) and a slow roll
  const Zair = (t) => Math.exp(lerp(Math.log(1.2), Math.log(4.4), ramp(t, 0, AIR1, (u) => 0.55 * u * u + 0.45 * u * u * u)));
  const Rair = (t) => lerp(6, -3, ramp(t, 0, AIR1, easeInOut));
  const AIRC = [1080, 1920]; // (the camera's aim, Two Minutes' ground, is the plates' centre)
  const airAt = (pt, t) => { const z = Zair(t) * K, r = (Rair(t) * Math.PI) / 180, u = (pt[0] - AIRC[0]) * z, v = (pt[1] - AIRC[1]) * z; return [W / 2 + u * Math.cos(r) - v * Math.sin(r), H / 2 + u * Math.sin(r) + v * Math.cos(r)]; };
  // --- the street: down from 5 above the render's eye (9.5) to it, sideways -4 -> +4, a zoom of 7 %
  const h = PL.shots["a-street"].main.camY - 0.5;
  const rig = { t0: ST0, t1: D * 60, Tf: (t) => lerp(-4, 4, ramp(t, ST0, D * 60, (u) => u)), Df: (t) => 5 * (1 - ramp(t, ST0, ST0 + 150, easeOut)), Zf: (t) => lerp(1, 1.07, ramp(t, ST0, D * 60, (u) => u)), depth: { near: 125, mid: 380, far: 1200 }, h };

  // nulls first (invisible: their place in the stack does not matter)
  const zoomN = Cm.nul("camera · bird's eye", { ip: 0, op: AIR1 + 1, ks: { a: AIRC, p: [W / 2, H / 2], ...(() => { const k = bake(0, AIR1, (t) => ({ s: [100 * K * Zair(t), 100 * K * Zair(t)], r: Rair(t) })); return { s: k.s, r: k.r }; })() } });
  const lens = (i) => Cm.nul(`lens ${i}`, { parent: zoomN, ip: 0, op: AIR1 + 1, ks: { a: AIRC, p: AIRC, s: [100 / 2 ** i, 100 / 2 ** i] } });
  const L1 = lens(1), L2 = lens(2);
  const R = streetRig(Cm, "a-street", rig);

  // ---- top of the stack: the type, the end card, the clouds, the light
  mark(Cm, {});
  const c = Tx;
  endCard(Cm, c, END);
  // the street's words
  headline(Cm, { lines: c.street, x: 72, y: 452, t0: 352, tOut: 588, nm: "street · headline" });
  label(Cm, { text: c.streetLabel, x: 72, y: 326, t0: 340, tOut: 590, nm: "street · label" });
  // the bird's eye's words
  headline(Cm, { lines: c.air, x: 72, y: 452, t0: 52, tOut: 232, nm: "air · headline" });
  label(Cm, { text: c.airLabel, x: 72, y: 326, t0: 40, tOut: 236, nm: "air · label" });
  // the clouds: over the frame at the start, then the deck the camera goes down through to the street
  clouds(Cm, { tIn: -22, tCover: -22, tOut: 50, from: "over", nm: "clouds · opening" });
  clouds(Cm, { tIn: 236, tCover: 272, tOut: 318, from: "below", nm: "clouds · descent" });
  // pins on the bird's eye (they ride the zoom, they keep their size)
  const pz = PL.shots["a-air"].z0.pins;
  const pinKeys = (pt, t0, t1) => bake(t0, t1, (t) => ({ p: airAt(pt, t) })).p;
  pin(Cm, { name: "Two Minutes", at: pinKeys(pz.tm, 118, 250), t0: 118, tOut: 236, dot: C.coral });
  pin(Cm, { name: "Two Min Lab", at: pinKeys(pz.lab, 132, 250), t0: 132, tOut: 238, dot: C.yellow });
  pin(Cm, { name: "2 Minutes 2 Fight", at: pinKeys(pz.fight, 146, 250), t0: 146, tOut: 240, dot: C.blue });
  // pin on the street: Two Minutes, on its layer
  const ps = PL.shots["a-street"].main.pins;
  pin(Cm, { name: "Two Minutes", at: bake(384, D * 60, (t) => ({ p: R.at("mid", [ps.tm[0], ps.tm[1] - 120], t) })).p, t0: 384, tOut: 596, dot: C.coral, size: 40, up: 80 });
  // light on the street: the low sun, a sweep across, the festoon's bulbs coming on
  vignette(Cm, { ip: ST0 });
  sweep(Cm, { t0: 430, t1: 600, o: 26 });
  sun(Cm, { at: [930, 420], t0: ST0, dur: D * 60 - ST0, drift: [-60, 10] });
  PL.shots["a-street"].main.extra.forEach((b, i) => { if (b[1] > -50 && b[1] < 3900) glow(Cm, { at: [b[0] + (R.wOf("mid") - R.wOf("mid")) / 2, b[1]], r: 70 + (b[1] < 1600 ? 50 : 0), t0: 336 + i * 5, parent: R.nulls.mid, nm: `bulb ${i}`, flicker: (i * 7) % 5 }); });
  // a paper scrim under the words while they sit over the busy bird's eye (it goes with them)
  Cm.shape("air · scrim", [group("scrim", [rect([W, 820], [W / 2, 410]), gfill({ type: 1, s: [0, 0], e: [0, 820], stops: [[0, C.paper], [1, C.paper]], alphas: [[0, 0.9], [0.55, 0.72], [1, 0]] })])], { ip: 0, op: 250, ks: { o: [[30, 0, E.linear], [56, 100, E.hold], [226, 100, E.linear], [248, 0]] } });
  // ---- the city: the street (top: near .. bottom: sky), then the bird's eye's lenses (the sharpest on top)
  for (const l of ["near", "mid", "ground", "far", "sky"]) plateLayer(Cm, `a-street-${l}`, R.nulls[l], { ip: ST0, op: D * 60 });
  plateLayer(Cm, "a-air-2", L2, { ip: 0, op: AIR1 });
  plateLayer(Cm, "a-air-1", L1, { ip: 0, op: AIR1 });
  plateLayer(Cm, "a-air-0", zoomN, { ip: 0, op: AIR1 });
  Cm.shape("ground", [group("paper", [rect([W, H], [W / 2, H / 2]), fill(rgb(C.paper))])]);
  const j = Cm.json(); j.cromatic = { story: "A", lang, dur: D, cuts: { air: [0, AIR1], street: [ST0, D * 60], end: END } };
  return j;
}

/* ======================= Story B · Same city, new paper ======================= */
function storyB(lang) {
  const Tx = COPY[lang].b, D = 12.5, Cm = new Comp({ w: W, h: H, dur: D, nm: `Cromatic · story B · Same city, new paper · ${lang}` });
  const t1 = Math.round(D * 60), PILL = 228, TAP = 284, OPEN = 296, OPEN1 = 380, END = 600;
  const h = PL.shots["b-street"].main.camY - 0.5;
  const R = streetRig(Cm, "b-street", { t0: 0, t1, Tf: (t) => lerp(-3, 3, ramp(t, 0, t1, (u) => u)), Df: (t) => 3.5 * (1 - ramp(t, 0, 170, easeOut)), Zf: (t) => lerp(1, 1.08, ramp(t, 0, t1, (u) => u)), depth: { near: 95, mid: 230, far: 1100 }, h });
  // the Multiverse pill: a window on Sketchbook at the frame's lower middle; tapped, it opens over the whole frame,
  // the far layers first (each layer's own pill, a few frames apart), so the city is redrawn from the back to the front
  const P0 = { cx: W / 2, cy: 1000, w: 720, h: 240 }, LAG = { sky: 0, far: 8, ground: 16, mid: 26, near: 38 };
  const big = { w: 2900, h: 2900 * 0.42 + 2600 };
  const pillAt = (t, lag) => {
    const pop = ramp(t, PILL, PILL + 22, (u) => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2)); // (back-out: a spring)
    const tap = t >= TAP && t < OPEN ? 1 - 0.06 * Math.sin(Math.PI * clamp((t - TAP) / (OPEN - TAP))) : 1;
    const op = ramp(t, OPEN + lag, OPEN1 + lag - 20, (u) => u * u * u * (u * (u * 6 - 15) + 10));
    const w = lerp(P0.w * pop * tap, big.w, op), hh = lerp(P0.h * pop * tap, big.h, op), cy = lerp(P0.cy, H / 2, op);
    return { w: Math.max(2, w), h: Math.max(2, hh), cx: P0.cx, cy, r: Math.max(1, Math.min(w, hh) / 2) };
  };
  const pillPath = (t, lag) => { const q = pillAt(t, lag); return roundRect(q.cx, q.cy, q.w, q.h, q.r); };
  const pillKeys = (lag) => { const out = []; for (let t = PILL; t <= OPEN1 + lag; t += 2) out.push([t, pillPath(t, lag), E.linear]); out[out.length - 1] = [out[out.length - 1][0], out[out.length - 1][1]]; return out; };

  mark(Cm, {});
  endCard(Cm, Tx, END);
  headline(Cm, { lines: Tx.sketch, x: 72, y: 452, t0: 400, tOut: 584, nm: "sketch · headline" });
  label(Cm, { text: Tx.sketchLabel, x: 72, y: 326, t0: 392, tOut: 588, nm: "sketch · label" });
  headline(Cm, { lines: Tx.street, x: 72, y: 452, t0: 30, tOut: 262, nm: "street · headline" });
  label(Cm, { text: Tx.streetLabel, x: 72, y: 326, t0: 22, tOut: 266, nm: "street · label" });
  // the pill's outline (it leads: the sky's pill) and its name under it; the tap: a ring off its middle
  Cm.shape("multiverse · outline", [group("o", [shp(pillKeys(0)), stroke(rgb(C.black), [[PILL, 6, E.linear], [OPEN, 6, E.linear], [OPEN1, 14]])])], { ip: PILL, op: OPEN1 });
  {
    const tn = monoLine(Tx.pillLabel, 30, C.black, 0, 0), wl = tn.width + 60;
    Cm.shape("multiverse · name", [group("text", tn.groups, { p: [-tn.width / 2, 11] }), group("pill", [rect([wl, 58], [0, 0], 9999), stroke(rgb(C.black), 4), fill(rgb(C.white))])], {
      ip: PILL + 6, op: OPEN + 10, ks: { p: [P0.cx, P0.cy + P0.h / 2 + 64], s: [[PILL + 6, [0, 0], E.spring], [PILL + 26, [100, 100], E.hold], [OPEN, [100, 100], EXIT], [OPEN + 10, [0, 0]]] }
    });
    Cm.shape("multiverse · tap", [group("ring", [ellipse([120, 120], [0, 0]), stroke(rgb(C.black), [[TAP, 6, E.out], [TAP + 22, 1]], [[TAP, 90, E.linear], [TAP + 22, 0]])], { s: [[TAP, [40, 40], E.out], [TAP + 22, [220, 220]]] })], { ip: TAP, op: TAP + 23, ks: { p: [P0.cx, P0.cy] } });
  }
  vignette(Cm, { ip: 0, op: OPEN1 + 2, o: [[OPEN, 100, E.linear], [OPEN1, 0]] });
  sun(Cm, { at: [880, 380], t0: 0, dur: OPEN1, drift: [-50, 10], op: OPEN1 });
  // the colour bulbs come on (b-street's festoon is on its near layer)
  PL.shots["b-street"].main.extra.forEach((b, i) => { if (b[1] > -50 && b[1] < 3900 && b[0] > -200 && b[0] < 2800) glow(Cm, { at: [b[0] + (R.wOf("near") - R.wOf("mid")) / 2, b[1]], r: 90, t0: 90 + i * 5, parent: R.nulls.near, nm: `bulb ${i}`, o: 70, flicker: (i * 7) % 5 }); });
  // the city: per layer, front to back: Sketchbook inside its pill (an alpha matte above it), then the colour layer
  for (const l of ["near", "mid", "ground", "far", "sky"]) {
    // after the opening: the notebook's layer, plain
    plateLayer(Cm, `b-sketch-${l}`, R.nulls[l], { ip: OPEN1 + LAG[l], op: t1, nm: `sketchbook · ${l}` });
    // during it: the same, through its pill
    const M = Cm.shape(`multiverse · pill · ${l}`, [group("pill", [shp(pillKeys(LAG[l])), fill(rgb(C.white))])], { ip: PILL, op: OPEN1 + LAG[l], td: true });
    plateLayer(Cm, `b-sketch-${l}`, R.nulls[l], { ip: PILL, op: OPEN1 + LAG[l], tt: 1, nm: `sketchbook · ${l} · in the pill` });
    plateLayer(Cm, `b-street-${l}`, R.nulls[l], { ip: 0, op: OPEN1 + LAG[l], nm: `colour · ${l}` });
  }
  Cm.shape("ground", [group("paper", [rect([W, H], [W / 2, H / 2]), fill(rgb(C.paper))])]);
  const j = Cm.json(); j.cromatic = { story: "B", lang, dur: D, cuts: { street: [0, OPEN], open: [OPEN, OPEN1 + 20], sketch: [OPEN1, t1], end: END } };
  return j;
}

/* ======================= write ======================= */
export { W, H, K, T, MONO, clamp, lerp, smooth, easeOut, easeInOut, ramp, bake, addSkew, monoLine, headline, label, mark, pin, clouds, glow, sweep, sun, vignette, endCard };
const sizes = {};
if (process.argv[1] === fileURLToPath(import.meta.url)) for (const lang of ["en", "ro"]) for (const [k, fn] of [["a", storyA], ["b", storyB]]) {
  const j = fn(lang), s = JSON.stringify(j), file = path.join(OUT, `story-${k}-${lang}.json`);
  fs.writeFileSync(file, s);
  sizes[`story-${k}-${lang}`] = { kb: +(s.length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, images: j.assets.length };
}
if (Object.keys(sizes).length) console.table(sizes);
