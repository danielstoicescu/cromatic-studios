// Cromatic · stories in Lottie · story D (TASK-066): the generator's tools (its own copies: the shared build.mjs of
// stories A-C is another agent's): the film's grain, weave and flicker; light; film titles; and planeText, a line laid
// on a wall or the road through the homography of a rectangle the renders measured on that plane (render-d.mjs,
// __D.quad). Story D's first cut used it; Daniel (21 Oct) wants the type on the screen, so build-d.mjs no longer does
// (kept for a later test of type in the scene).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import opentype from "opentype.js";
import wawoff2 from "wawoff2";
import { group, rect, ellipse, fill, gfill, stroke, rgb, E, prop, path as shp, poly, C, loadType, line as uiLine } from "../../../../lottie-ui/_source/lib/ui.mjs";
import { glyphShapes, setLine } from "../../../../intro-lottie/_source/lib/type.mjs";
export { group, rect, ellipse, fill, gfill, stroke, rgb, E, prop, shp, poly, C, uiLine };

const here = path.dirname(fileURLToPath(import.meta.url));
export const W = 1080, H = 1920, K = 0.5;
export const T = await loadType();

/* ---------- small maths ---------- */
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const ramp = (t, t0, t1, fn = smooth) => fn(clamp((t - t0) / (t1 - t0)));
// a back-out (overshoots ~8 %, settles)
export const backOut = (t, s = 1.4) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export function rng(seed = 7) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// keys baked every `step` frames over [t0, t1] (linear between: the curve is in the samples); a constant collapses
export function bake(t0, t1, fn, step = 1) {
  const out = {};
  for (let t = t0; ; t = Math.min(t1, t + step)) {
    const v = fn(t);
    for (const k in v) (out[k] = out[k] || []).push([t, v[k], E.linear]);
    if (t >= t1) break;
  }
  for (const k in out) { const a = out[k]; a[a.length - 1] = [a[a.length - 1][0], a[a.length - 1][1]]; if (a.every((x) => JSON.stringify(x[1]) === JSON.stringify(a[0][1]))) out[k] = a[0][1]; }
  return out;
}
// on/off keys (hold) from a predicate sampled every frame
export function holdKeys(t0, t1, fn) {
  const out = []; let last = null;
  for (let t = t0; t <= t1; t++) { const v = fn(t); if (v !== last) { out.push([t, v, E.hold]); last = v; } }
  if (out.length === 1) return out[0][1];
  out[out.length - 1] = [out[out.length - 1][0], out[out.length - 1][1]];
  return out;
}

/* ---------- the homography of a plane: plane units (s right, t down) -> plate px ---------- */
export function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  // Gauss-Jordan on the 8 x 9 system
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < 8; c++) {
    let piv = c; for (let r = c + 1; r < 8; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c]; for (let k = c; k < 9; k++) M[c][k] /= d;
    for (let r = 0; r < 8; r++) if (r !== c) { const f = M[r][c]; if (f) for (let k = c; k < 9; k++) M[r][k] -= f * M[c][k]; }
  }
  return [...M.map((r) => r[8]), 1];
}
export const hp = (Hm, x, y) => { const w = Hm[6] * x + Hm[7] * y + Hm[8]; return [(Hm[0] * x + Hm[1] * y + Hm[2]) / w, (Hm[3] * x + Hm[4] * y + Hm[5]) / w]; };
// a mark measured by the renders (world corners, their px) -> the plane's homography (plane units = world units,
// the rectangle's top left at 0, 0, t down)
export function planeOf(mark) {
  const [a, b, c, d] = mark.world, dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const w = dist(a, b), h = dist(a, d);
  return { w, h, H: homography([[0, 0], [w, 0], [w, h], [0, h]], mark.px) };
}
// a run of text laid on a plane: letters as groups whose paths are already in plate px (the perspective is in the
// vertices; tangents mapped as small vectors). x, y: the start of the baseline in plane units; size: the cap+ in plane
// units; stretch: the letters drawn this much taller along t (road markings: long letters that read short from low)
// keys(j, n): the j-th letter's transform keys (o, and anything else) in px of the plate
export function planeText(Hm, text, { x = 0, y = 0, size = 10, tracking = -0.03, stretch = 1, color = "#ffffff", opacity = 100, keys, align = "left", skewX = 0 } = {}) {
  const L = setLine(T, text, size, tracking), k = size / T.upm;
  const x0 = align === "left" ? x : align === "center" ? x - L.width / 2 : x - L.width;
  const groups = L.letters.map((l, j) => {
    const gs = glyphShapes(T, l.ch);
    const map = (vx, vy) => { const s = x0 + l.x + vx * k + skewX * (-vy * k * stretch), t = y + vy * k * stretch; return hp(Hm, s, t); };
    const items = gs.contours.map((c) => {
      const v = [], ii = [], oo = [];
      for (let q = 0; q < c.v.length; q++) {
        const [vx, vy] = c.v[q], P = map(vx, vy);
        const Pi = map(vx + c.i[q][0], vy + c.i[q][1]), Po = map(vx + c.o[q][0], vy + c.o[q][1]);
        v.push(P.map((n) => +n.toFixed(2))); ii.push([+(Pi[0] - P[0]).toFixed(2), +(Pi[1] - P[1]).toFixed(2)]); oo.push([+(Po[0] - P[0]).toFixed(2), +(Po[1] - P[1]).toFixed(2)]);
      }
      return { ty: "sh", d: 1, ks: { a: 0, k: { c: true, v, i: ii, o: oo } } };
    });
    const kk = keys ? keys(j, L.letters.length) : {};
    return group(l.ch, [...items, fill(rgb(color), opacity)], kk);
  });
  return { groups, width: L.width, n: L.letters.length };
}

/* ---------- JetBrains Mono (the site's utility face) as outlines: captions ---------- */
async function openMono() {
  const dir = path.resolve(here, "../../../../../site/fonts/gf");
  const open = async (f) => { const ttf = Buffer.from(await wawoff2.decompress(fs.readFileSync(path.join(dir, f)))); return opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length)); };
  const main = await open("jetbrains-mono-latin.woff2"), ext = await open("jetbrains-mono-latin-ext.woff2");
  return { main, ext, upm: main.unitsPerEm, glyph: (ch) => { const g = main.charToGlyph(ch); return g.index > 0 ? g : ext.charToGlyph(ch); } };
}
export const MONO = await openMono();
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
// a line of mono caps at (x, baseline by), letter-spaced; returns { groups, width }
export function monoLine(text, size, color, x, by, { tracking = 0.14, o = 100 } = {}) {
  const k = size / MONO.upm, groups = []; let cx = x;
  for (const ch of [...text]) {
    const g = MONO.glyph(ch), adv = g.advanceWidth * k;
    if (ch !== " ") groups.push({ ty: "gr", nm: ch, it: [...glyphPaths(g).map((c) => ({ ty: "sh", d: 1, ks: { a: 0, k: c } })), fill(rgb(color), o), { ty: "tr", p: prop([cx, by]), a: prop([0, 0]), s: prop([k * 100, k * 100]), r: prop(0), o: prop(100), sk: prop(0), sa: prop(0) }] });
    cx += adv + tracking * size;
  }
  return { groups, width: cx - x - tracking * size };
}

/* ---------- the film: grain, weave, flicker, vignette ---------- */
// four grain frames, a new one for every recorded frame (every 2 frames at 60), overlay
export function grain(Cm, asset, { o = 32, ip = 0, op } = {}) {
  op = op ?? Cm.op;
  for (let k = 0; k < 4; k++) {
    const L = Cm.image(`grain ${k}`, asset(`d-grain-${k}`), { ip, op, ks: { s: [200, 200], o: holdKeys(ip, op, (t) => (Math.floor(t / 2) % 4 === k ? (typeof o === "function" ? o(t) : o) : 0)) } });
    L.bm = 3;
  }
}
// the gate weave: the whole picture a pixel or so off, every recorded frame; a breath of exposure
export function weave(Cm, { ip = 0, op, amp = 1.3, seed = 3 } = {}) {
  op = op ?? Cm.op; const R = rng(seed), p = [];
  for (let t = ip; t <= op; t += 2) p.push([t, [W / 2 + (R() - 0.5) * 2 * amp, H / 2 + (R() - 0.5) * 2 * amp], E.hold]);
  p[p.length - 1] = [p[p.length - 1][0], p[p.length - 1][1]];
  return Cm.nul("film · weave", { ip, op, ks: { a: [W / 2, H / 2], p } });
}
export function flicker(Cm, { ip = 0, op, seed = 5, amt = 5 } = {}) {
  op = op ?? Cm.op; const R = rng(seed), o = [];
  for (let t = ip; t <= op; t += 2) o.push([t, Math.round(R() * amt * 10) / 10, E.hold]);
  o[o.length - 1] = [o[o.length - 1][0], o[o.length - 1][1]];
  Cm.shape("film · flicker", [group("f", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), fill(rgb("#000000"))])], { ip, op, ks: { o } });
}
export function vignette(Cm, { ip = 0, op, o = 100, color = "#120C18", a = 0.42, inner = 0.55 } = {}) {
  Cm.shape("film · vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.48], e: [W * 1.05, H * 0.48], stops: [[0, color], [1, color]], alphas: [[0, 0], [inner, 0], [1, a]] })])], { ip, op: op ?? Cm.op, ks: { o } });
}

/* ---------- light ---------- */
// a soft round glow (screen): r its radius, colour, opacity keys or a number
export function glowShape(r, color, { core = "#FFF6E0", a0 = 0.95, mid = 0.6 } = {}) {
  return group("glow", [ellipse([2 * r, 2 * r], [0, 0]), gfill({ type: 2, s: [0, 0], e: [r, 0], stops: [[0, core], [0.18, color], [1, color]], alphas: [[0, a0], [0.18, mid], [1, 0]] })]);
}

/* ---------- film titles (in the frame, Google Sans) ---------- */
// a title line: letters rise in from below (a short travel, a fast ease), leave by fading up; x left, by baseline
export function title(Cm, { text, x, y, size = 96, color = "#ffffff", t0, tOut, nm = "title", stagger = 1.2, rise = 0.35, parent, ip, op, track = -0.035, o = 100, dur = 18 }) {
  const L = uiLine(T, text, size, color, x, y, { tracking: track, keys: (b, s, j) => {
    const ta = Math.round(t0 + j * stagger);
    const p = [[ta, [b[0], b[1] + rise * size], [0.12, 0.9, 0.2, 1]], [ta + dur, b, ...(tOut == null ? [] : [E.hold])]];
    const oo = [[0, 0, E.hold], [ta, 0, E.linear], [ta + 6, o, ...(tOut == null ? [] : [E.hold])]];
    if (tOut != null) { p.push([tOut, b, [0.6, 0, 0.9, 0.4]], [tOut + 10, [b[0], b[1] - 0.18 * size]]); oo.push([tOut + 2, o, E.linear], [tOut + 10, 0]); }
    return { p, o: oo };
  } });
  return Cm.shape(nm, L.groups, { ip: ip ?? Math.max(0, t0 - 1), op: op ?? (tOut != null ? tOut + 11 : Cm.op), parent });
}
export const textWidth = (text, size, track = -0.035) => setLine(T, text, size, track).width;
