// Cromatic opening · a tiny Lottie (bodymovin 5.x) writer. No After Effects: every layer, shape and keyframe is
// written here, by hand, so the timing lives in code and can be diffed.
// Units: frames at FPS; positions in composition pixels; opacity 0..100; scale in percent.

export const FPS = 60;
export const f = (s) => Math.round(s * FPS); // seconds -> frame

// colours as Lottie wants them: [r, g, b, a] in 0..1
export const rgb = (h, a = 1) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a].map((v) => +v.toFixed(4));
};

// easings as CSS cubic-bezier(x1, y1, x2, y2): the segment that starts at a key uses that key's easing
export const E = {
  linear: [0, 0, 1, 1],
  out: [0.16, 1, 0.3, 1], // a long, soft landing (the site's --eoq is .22,1,.36,1)
  outQuick: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.55, 0, 0.9, 0.4],
  spring: [0.34, 1.56, 0.64, 1], // ~10 % overshoot (the brand's entrance)
  springSoft: [0.3, 1.32, 0.6, 1],
  hold: "hold"
};

const r2 = (v) => (Array.isArray(v) ? v.map(r2) : typeof v === "number" ? Math.round(v * 100) / 100 : v);

// a property: static value or [[t, value, ease?], ...] keys (frames). Values may be numbers or arrays.
export function prop(v) {
  if (!Array.isArray(v) || !Array.isArray(v[0]) || typeof v[0][0] !== "number" || v[0].length < 2 || !isKeys(v)) return { a: 0, k: r2(v) };
  const keys = [...v].sort((a, b) => a[0] - b[0]);
  if (keys.length === 1) return { a: 0, k: r2(keys[0][1]) };
  const k = keys.map(([t, val, ease], i) => {
    const s = Array.isArray(val) ? r2(val) : [r2(val)];
    const key = { t, s };
    if (i < keys.length - 1) {
      if (ease === "hold") key.h = 1;
      else {
        const [x1, y1, x2, y2] = ease || E.inOut;
        key.o = { x: [x1], y: [y1] };
        key.i = { x: [x2], y: [y2] };
      }
    }
    return key;
  });
  return { a: 1, k };
}
function isKeys(v) { return v.every((k) => Array.isArray(k) && typeof k[0] === "number" && k.length >= 2 && k.length <= 3 && (k[2] === undefined || typeof k[2] === "string" || Array.isArray(k[2]))); }
// a time remap (seconds): as prop(), but to 1e-5 s (prop's 1/100 would be most of a frame: a loop would not close)
export function tmProp(v) {
  if (!Array.isArray(v)) return { a: 0, k: v };
  const keys = [...v].sort((a, b) => a[0] - b[0]);
  return { a: 1, k: keys.map(([t, val, ease], i) => { const key = { t, s: [Math.round(val * 1e5) / 1e5] }; if (i < keys.length - 1) { if (ease === "hold") key.h = 1; else { const [x1, y1, x2, y2] = ease || E.inOut; key.o = { x: [x1], y: [y1] }; key.i = { x: [x2], y: [y2] }; } } return key; }) };
}
// keys for a shape path: [[t, pathObj, ease?]]
export function pathProp(keys) {
  if (!Array.isArray(keys)) return { a: 0, k: keys };
  if (keys.length === 1) return { a: 0, k: keys[0][1] };
  return {
    a: 1,
    k: keys.map(([t, p, ease], i) => {
      const key = { t, s: [p] };
      if (i < keys.length - 1) {
        if (ease === "hold") key.h = 1;
        else { const [x1, y1, x2, y2] = ease || E.inOut; key.o = { x: [x1], y: [y1] }; key.i = { x: [x2], y: [y2] }; }
      }
      return key;
    })
  };
}

/* ---------- shapes ---------- */
export const tr = ({ p = [0, 0], a = [0, 0], s = [100, 100], r = 0, o = 100 } = {}) => ({ ty: "tr", p: prop(p), a: prop(a), s: prop(s), r: prop(r), o: prop(o), sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } });
export const group = (nm, items, t = {}) => ({ ty: "gr", nm, it: [...items, tr(t)] });
export const rect = (size, pos = [0, 0], radius = 0) => ({ ty: "rc", d: 1, s: prop(size), p: prop(pos), r: prop(radius) });
export const ellipse = (size, pos = [0, 0]) => ({ ty: "el", d: 1, s: prop(size), p: prop(pos) });
export const path = (shape) => ({ ty: "sh", d: 1, ks: pathProp(shape) });
export const fill = (color, o = 100, rule = 1) => ({ ty: "fl", c: prop(color), o: prop(o), r: rule, bm: 0 });
export const stroke = (color, w = 2.5, o = 100, { lc = 2, lj = 2, d } = {}) => {
  const s = { ty: "st", c: prop(color), o: prop(o), w: prop(w), lc, lj, ml: 4, bm: 0 };
  if (d) s.d = d.map((v, i) => ({ n: i % 2 ? "g" : "d", nm: i % 2 ? "gap" : "dash", v: prop(v) })).concat([{ n: "o", nm: "offset", v: prop(0) }]);
  return s;
};
export const trim = (s = 0, e = 100, o = 0) => ({ ty: "tm", s: prop(s), e: prop(e), o: prop(o), m: 1 });

// path data helpers (absolute vertices, relative tangents)
export const poly = (pts, closed = true) => ({ c: closed, v: pts.map((p) => r2(p)), i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]) });
export function roundRect(cx, cy, w, h, r) {
  // a rounded rectangle as a bezier path, clockwise from the top edge; r is clamped to the half height/width
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const k = 0.5523 * r, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const v = [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]];
  const o = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
  const i = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]]; // the closing corner (top left) ends here: its in-tangent is the first vertex's
  return { c: true, v: r2(v), i: r2(i), o: r2(o) };
}
export function circlePath(cx, cy, rad) {
  const k = 0.5523 * rad;
  return { c: true, v: r2([[cx, cy - rad], [cx + rad, cy], [cx, cy + rad], [cx - rad, cy]]), i: r2([[-k, 0], [0, -k], [k, 0], [0, k]]), o: r2([[k, 0], [0, k], [-k, 0], [0, -k]]) };
}

/* ---------- layers ---------- */
export class Comp {
  constructor({ w, h, dur, nm }) { this.w = w; this.h = h; this.op = f(dur); this.nm = nm; this.layers = []; this.ind = 0; this.markers = []; this.assets = []; }
  // layers are added top to bottom (the first added is drawn on top)
  add(layer) { layer.ind = ++this.ind; this.layers.push(layer); return layer; }
  shape(nm, shapes, { ip = 0, op = this.op, ks = {}, parent, masks, td, tt, hidden, ln } = {}) {
    const L = { ddd: 0, ty: 4, nm, sr: 1, ks: lks(ks), ao: 0, shapes, ip, op, st: 0, bm: 0 };
    if (ln) L.ln = ln; // the layer's id in the SVG renderer (tools find it by it)
    if (parent) L.parent = parent.ind;
    if (masks) { L.hasMask = true; L.masksProperties = masks; }
    if (td) L.td = 1;
    if (tt) L.tt = tt;
    if (hidden) L.hd = true;
    return this.add(L);
  }
  // an image layer: refId of an asset added with asset(); masks and parenting as for shapes
  image(nm, refId, { ip = 0, op = this.op, ks = {}, parent, masks, ln } = {}) {
    const L = { ddd: 0, ty: 2, nm, refId, sr: 1, ks: lks(ks), ao: 0, ip, op, st: 0, bm: 0 };
    if (ln) L.ln = ln;
    if (parent) L.parent = parent.ind;
    if (masks) { L.hasMask = true; L.masksProperties = masks; }
    return this.add(L);
  }
  asset(id, w, h, p) { this.assets.push({ id, w, h, u: "", p, e: 0 }); return id; }
  nul(nm, { ip = 0, op = this.op, ks = {}, parent } = {}) {
    const L = { ddd: 0, ty: 3, nm, sr: 1, ks: lks(ks), ao: 0, ip, op, st: 0, bm: 0 };
    if (parent) L.parent = parent.ind;
    return this.add(L);
  }
  marker(cm, t0, t1) { this.markers.push({ tm: t0, cm, dr: t1 - t0 }); }
  json() {
    return { v: "5.12.2", fr: FPS, ip: 0, op: this.op, w: this.w, h: this.h, nm: this.nm, ddd: 0, assets: this.assets, layers: this.layers, markers: this.markers, meta: { g: "Cromatic intro generator (design/intro-lottie/_source)" } };
  }
}
function lks({ o = 100, r = 0, p = [0, 0], a = [0, 0], s = [100, 100] } = {}) {
  const p3 = (v) => (Array.isArray(v) && Array.isArray(v[0]) ? v.map(([t, val, e]) => [t, [...val, 0].slice(0, 3), e]) : [...v, 0].slice(0, 3));
  const s3 = (v) => (Array.isArray(v) && Array.isArray(v[0]) ? v.map(([t, val, e]) => [t, [...val, 100].slice(0, 3), e]) : [...v, 100].slice(0, 3));
  // a split position ({ x: keys, y: keys }): x and y on their own easings, which draws a curve (an arc, a throw)
  const pp = p && !Array.isArray(p) && (p.x !== undefined) ? { s: true, x: prop(p.x), y: prop(p.y) } : prop(p3(p));
  return { o: prop(o), r: prop(r), p: pp, a: prop(p3(a)), s: prop(s3(s)) };
}
// a mask: mode "a" add, "s" subtract, "i" intersect; pathKeys as for pathProp
export const mask = (pathKeys, mode = "a", { inv = false, o = 100 } = {}) => ({ inv, mode, pt: pathProp(pathKeys), o: prop(o), x: prop(0), nm: "m" });

/* ---------- motion vocabulary (the brand's: transforms and opacity, a spring that overshoots ~10 %) ---------- */
// a value that goes from a to b at t0 over d frames with ease, holding before and after
export const tween = (t0, d, a, b, ease = E.out) => [[t0, a, ease], [t0 + d, b]];
// several segments chained: [[t, v, ease], ...]
export const keys = (...k) => k;
// seeded random, so every build is the same
export function rng(seed = 7) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// a gradient fill: type 1 linear, 2 radial; stops [[pos, "#hex"]], alphas [[pos, 0..1]]; s/e start and end points.
// The colour and opacity stops are put on the same positions: lottie-web's canvas renderer (the site's worker) applies
// a gradient's opacity only when the two sets line up ("collapsable"); otherwise it draws it opaque (r226: the paper's
// key light was an opaque white sheet on the site)
export const gfill = ({ type = 1, s, e, stops, alphas, o = 100 }) => {
  if (alphas) [stops, alphas] = alignStops(stops, alphas);
  return {
    ty: "gf", o: prop(o), r: 1, bm: 0,
    g: { p: stops.length, k: { a: 0, k: [...stops.flatMap(([p, h]) => [p, ...rgb(h).slice(0, 3)]), ...(alphas || []).flatMap(([p, a]) => [p, a])] } },
    s: prop(s), e: prop(e), t: type, h: prop(0), a: prop(0)
  };
};
export function alignStops(stops, alphas) {
  const pos = [...new Set([...stops.map((x) => x[0]), ...alphas.map((x) => x[0])])].sort((a, b) => a - b);
  const at = (arr, p, mix) => { if (p <= arr[0][0]) return arr[0][1]; for (let i = 1; i < arr.length; i++) if (p <= arr[i][0]) { const [p0, v0] = arr[i - 1], [p1, v1] = arr[i]; return mix(v0, v1, (p - p0) / (p1 - p0 || 1)); } return arr[arr.length - 1][1]; };
  const mixHex = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return "#" + [16, 8, 0].map((sh) => Math.round(((A >> sh) & 255) * (1 - t) + ((B >> sh) & 255) * t).toString(16).padStart(2, "0")).join(""); };
  return [pos.map((p) => [p, at(stops, p, mixHex)]), pos.map((p) => [p, +at(alphas, p, (x, y, t) => x + (y - x) * t).toFixed(4)])];
}
