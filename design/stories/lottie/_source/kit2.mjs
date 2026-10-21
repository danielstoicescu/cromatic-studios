// Cromatic · stories in Lottie · v2 (TASK-065): what the reworked stories share.
//   cam(o)          the engine's camera in Node: the city's warp, a lookAt, the lens and its shift -> a projector
//   planeText(...)  type set INTO the scene: a word laid on a plane of the city (the road, a wall), its outlines
//                   projected point by point (true perspective), painted or written in light, revealed per letter
//   titleCard(...)  a full-frame title with attitude (a chapter card): slammed in, held, cut
//   urlPill(...)    cromaticstudios.com on its own, tilted, landing with the house bounce
//   grain(...)      film grain over everything (three frames, cycling)
//   sized cards, a word that swaps in place
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, path as shp, rng, C, RISE, EXIT, line, capH } from "../../../lottie-ui/_source/lib/ui.mjs";
import { glyphShapes, setLine } from "../../../intro-lottie/_source/lib/type.mjs";
import { W, H, T, monoLine } from "./build.mjs";

/* ---------- the camera, as the engine has it ---------- */
export function warpD(x, z) {
  const a = (x - 1500) / 1100, b = (z - 4260) / 1100, a2 = (x - 1500) / 800, b2 = (z - 4260) / 800 + 1;
  const dx = 132 * Math.sin(b) * Math.cosh(a) + 24 * Math.sin(b2) * Math.cosh(a2);
  const dz = -132 * Math.cos(b) * Math.sinh(a) - 24 * Math.cos(b2) * Math.sinh(a2);
  const t = Math.min(1, Math.max(0, (z - 7500) / 1000)), m = 1 - t * t * (3 - 2 * t);
  return [dx * m, dz * m];
}
const warp = (p) => { const d = warpD(p[0], p[2]); return [p[0] + d[0], p[1], p[2] + d[1]]; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const n = Math.hypot(...a) || 1; return a.map((v) => v / n); };
// o: { pos, tgt, fov, w, h, shift, level } -> (point [x, y, z] logical) -> [px, py, depth]
export function cam(o) {
  const p = warp(o.pos), t = warp(o.tgt); if (o.level) t[1] = p[1];
  const z = norm(sub(p, t)), x = norm(cross([0, 1, 0], z)), y = cross(z, x);
  const f = o.h / 2 / Math.tan((o.fov * Math.PI) / 360), sh = o.shift || [0, 0], cx = o.w / 2 + sh[0] * o.w, cy = o.h / 2 + sh[1] * o.h;
  const P = (q) => { const d = sub(warp(q), p), zc = -dot(d, z); return [cx + (f * dot(d, x)) / zc, cy - (f * dot(d, y)) / zc, zc]; };
  P.f = f; P.o = o;
  return P;
}

/* ---------- type in the scene ---------- */
// a line of text laid on a plane: origin (the line's left end on its baseline, logical), u (along the line), v (up the
// letters: on a road, away from the lens), size (world units of the em), stretch (the letters drawn tall along v, as
// road markings are, so they read from low down); returns per letter: its projected contours (frame px) and the world
// point of its middle (for when the light reaches it)
export function layOnPlane(text, { origin, u, v, size, stretch = 1, tracking = 0.02, align = "left", P }) {
  const L = setLine(T, text, size, tracking), k = size / T.upm, x0 = align === "center" ? -L.width / 2 : align === "right" ? -L.width : 0;
  const at = (fx, fy) => [origin[0] + u[0] * (x0 + fx) + v[0] * fy * stretch, origin[1] + u[1] * (x0 + fx) + v[1] * fy * stretch, origin[2] + u[2] * (x0 + fx) + v[2] * fy * stretch];
  return L.letters.map((l) => {
    const gs = glyphShapes(T, l.ch);
    // font units: x right, y down (from the baseline); world: x along u, y up v
    const W3 = (gx, gy) => at(l.x + gx * k, -gy * k);
    const contours = gs.contours.map((c) => {
      const v2 = c.v.map(([gx, gy]) => P(W3(gx, gy)));
      const iT = c.i.map(([ix, iy], j) => { const a = P(W3(c.v[j][0] + ix, c.v[j][1] + iy)); return [a[0] - v2[j][0], a[1] - v2[j][1]]; });
      const oT = c.o.map(([ox, oy], j) => { const a = P(W3(c.v[j][0] + ox, c.v[j][1] + oy)); return [a[0] - v2[j][0], a[1] - v2[j][1]]; });
      return { c: true, v: v2.map((q) => [+q[0].toFixed(1), +q[1].toFixed(1)]), i: iT.map((q) => q.map((n) => +n.toFixed(1))), o: oT.map((q) => q.map((n) => +n.toFixed(1))) };
    });
    return { ch: l.ch, contours, mid: at(l.x + l.adv / 2, (T.cap * k) / 2), behind: contours.some((c) => c.v.some(() => false)) };
  });
}
// the letters as a shape layer (frame px, under the shot's null). style "light": a warm core and two soft halos,
// screen-blended (words in the light of a lamp); "paint": road paint, flat and a little worn. reveal: [t per letter]
export function planeText(Cm, letters, { parent, ip, op, style = "light", color, reveal, fadeIn = 6, o = 100, nm = "in the scene", tOut, glowW = 1 }) {
  const col = color || (style === "light" ? "#FFF1CF" : "#F2EDE2");
  const groups = letters.map((Lt, j) => {
    const shapes = Lt.contours.map((c) => ({ ty: "sh", d: 1, ks: { a: 0, k: c } }));
    const t0 = reveal ? reveal[j] : ip;
    const op_ = [[0, 0, E.hold], [t0, 0, E.linear], [t0 + fadeIn, 100, ...(tOut != null ? [E.hold] : [])], ...(tOut != null ? [[tOut, 100, E.linear], [tOut + 10, 0]] : [])];
    const items = style === "light"
      ? [...shapes, fill(rgb(col), 100), stroke(rgb(col), 3 * glowW, 70, { lc: 2, lj: 2 })]
      : [...shapes, fill(rgb(col), 88)];
    return { ty: "gr", nm: Lt.ch, it: [...items, { ty: "tr", p: prop([0, 0]), a: prop([0, 0]), s: prop([100, 100]), r: prop(0), o: prop(op_.length > 1 ? op_ : 100), sk: prop(0), sa: prop(0) }] };
  });
  const layers = [Cm.shape(nm, groups, { parent, ip, op, ks: { o } })];
  if (style === "light") {
    // the halo: the same letters, stroked wide and faint (two passes), under the core
    for (const [w, a] of [[16 * glowW, 26], [38 * glowW, 12]]) {
      const halo = letters.map((Lt, j) => { const t0 = reveal ? reveal[j] : ip; return { ty: "gr", nm: Lt.ch, it: [...Lt.contours.map((c) => ({ ty: "sh", d: 1, ks: { a: 0, k: c } })), stroke(rgb(col), w, a, { lc: 2, lj: 2 }), fill(rgb(col), a), { ty: "tr", p: prop([0, 0]), a: prop([0, 0]), s: prop([100, 100]), r: prop(0), o: prop([[0, 0, E.hold], [t0, 0, E.linear], [t0 + fadeIn + 4, 100, ...(tOut != null ? [E.hold] : [])], ...(tOut != null ? [[tOut, 100, E.linear], [tOut + 10, 0]] : [])]), sk: prop(0), sa: prop(0) }] }; });
      const L = Cm.shape(`${nm} · halo ${w}`, halo, { parent, ip, op, ks: { o } }); L.bm = 2; layers.push(L);
    }
    layers[0].bm = 2;
  }
  return layers;
}

/* ---------- a title with attitude ---------- */
// a full-frame card: a flat ground, the words huge and tight, a mono kicker; slammed in on a white frame, held, cut.
// lines: [[text, emphWord?]]; size: the em in px
export function titleCard(Cm, { t0, t1, lines, size = 210, bg = "#0A0A0A", ink = C.yellow, emphInk, kicker, kickerInk, x = 72, y, align = "left", nm = "title card", flash = true, track = -0.045 }) {
  const lead = size * 0.92, total = lines.length * lead, by0 = y ?? H / 2 - total / 2 + size * 0.72;
  const groups = [];
  lines.forEach(([text, emph], li) => {
    const L = setLine(T, text, size, track), lx = align === "center" ? (W - L.width) / 2 : x;
    const words = text.split(" "); let wi = 0, ci = 0;
    const G = line(T, text, size, ink, lx, by0 + li * lead, { tracking: track });
    // the emphasised word in its own ink (letters of that word)
    if (emph) { const start = text.indexOf(emph); let n = 0; [...text].forEach((ch, k) => { if (ch === " ") return; if (k >= start && k < start + emph.length) G.groups[n].it.forEach((it) => { if (it.ty === "fl") it.c = prop(rgb(emphInk || C.white)); }); n++; }); }
    groups.push(group(`line ${li}`, G.groups));
  });
  const items = [...groups];
  if (kicker) { const K = monoLine(kicker, 30, kickerInk || C.white, x + 54, by0 - size * 0.95); items.push(group("kicker", [...K.groups, group("rule", [shp({ c: false, v: [[x, by0 - size * 0.95 - 11], [x + 38, by0 - size * 0.95 - 11]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }), stroke(rgb(kickerInk || C.white), 3)])])); }
  items.push(group("ground", [rect([W + 40, H + 40], [W / 2, H / 2]), fill(rgb(bg))]));
  Cm.shape(nm, items, { ip: t0, op: t1, ks: { a: [W / 2, H / 2], p: [W / 2, H / 2], s: [[t0, [112, 112], [0.1, 0.9, 0.2, 1]], [t0 + 7, [100, 100], E.hold], [t1 - 1, [100, 100]]] } });
  if (flash) Cm.shape(`${nm} · flash`, [group("f", [rect([W + 40, H + 40], [W / 2, H / 2]), fill(rgb("#FFFFFF"))])], { ip: t0, op: t0 + 4, ks: { o: [[t0, 90, E.linear], [t0 + 3, 0]] } });
}

/* ---------- the address on its own ---------- */
export function urlPill(Cm, { t0, t1, x = W / 2, y = 1480, rot = -6, size = 58, fillHex = C.yellow, ink = C.black, nm = "cromaticstudios.com" }) {
  const url = "cromaticstudios.com", Lu = line(T, url, size, ink, 0, 0, { tracking: -0.02 }), w = Lu.width + size * 1.25, h = size * 1.6;
  Cm.shape(nm, [group("text", Lu.groups, { p: [-Lu.width / 2, size * 0.36] }), group("pill", [rect([w, h], [0, 0], 9999), stroke(rgb(C.black), 6), fill(rgb(fillHex))]), group("shadow", [rect([w, h], [10, 14], 9999), fill(rgb(C.black), 100)])], {
    ip: t0, op: t1, ks: { p: [[t0, [x, y + 260], [0.2, 1.25, 0.3, 1]], [t0 + 22, [x, y]]], r: [[t0, rot - 18, [0.2, 1.4, 0.3, 1]], [t0 + 26, rot]], s: [[t0, [70, 70], E.spring], [t0 + 20, [104, 96], E.inOut], [t0 + 30, [98, 102], E.inOut], [t0 + 40, [100, 100]]] }
  });
  return { w, h };
}

/* ---------- grain ---------- */
const IMG = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../images");
export async function grainPlates(PL) {
  for (const k of [0, 1, 2]) {
    const f = path.join(IMG, `g2-grain-${k}.webp`);
    if (!fs.existsSync(f)) {
      const R = rng(331 + k), w = 540, h = 960, buf = Buffer.alloc(w * h);
      for (let i = 0; i < buf.length; i++) { const g = (R() + R() + R() - 1.5) * 0.66; buf[i] = Math.max(0, Math.min(255, Math.round(128 + g * 150))); }
      await sharp(buf, { raw: { width: w, height: h, channels: 1 } }).webp({ quality: 42 }).toFile(f);
    }
    PL[`g2-grain-${k}`] = { file: `g2-grain-${k}.webp`, x: 0, y: 0, w: 540, h: 960 };
  }
}
// three grain frames, each on for 2 frames of every 6, overlaid
export function grain(Cm, asset, { o = 30, F } = {}) {
  for (let k = 0; k < 3; k++) {
    asset(Cm, `g2-grain-${k}`);
    const L = Cm.image(`grain ${k}`, `g2-grain-${k}`, { ip: 0, op: F, ks: { p: [0, 0], s: [200, 200] } });
    L.bm = 3; L.ks.o = prop(Array.from({ length: Math.ceil(F / 2) + 1 }, (_, i) => [i * 2, i % 3 === k ? o : 0, E.hold]));
  }
}

/* ---------- a card the size of what it holds ---------- */
export function card(Cm, { t0, t1, x, y, w, h, fillHex = C.white, r = 36, rot = 0, nm = "card", from = [0, 80] }) {
  Cm.shape(nm, [group("card", [rect([w, h], [x + w / 2, y + h / 2], r), stroke(rgb(C.black), 6), fill(rgb(fillHex))])], {
    ip: t0, op: t1, ks: { a: [x + w / 2, y + h / 2], p: [[t0, [x + w / 2 + from[0], y + h / 2 + from[1]], [0.2, 1.15, 0.3, 1]], [t0 + 24, [x + w / 2, y + h / 2]]], r: rot, o: [[t0, 0, E.linear], [t0 + 6, 100]] }
  });
}
export const textWidth = (text, size, tracking = -0.03) => setLine(T, text, size, tracking).width;
