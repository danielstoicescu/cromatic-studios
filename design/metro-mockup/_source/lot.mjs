// Cromatic · metro mockups (TASK-062): a small Lottie (bodymovin 5.x) writer for layered photographic pieces: image
// assets with their own pixel density, nulls, shapes, precomps, track mattes, blend modes and keys baked from functions.
// It borrows the intro's property and gradient helpers (design/intro-lottie/_source/lib/lottie.mjs).
import { prop, E, rgb, gfill } from "../../intro-lottie/_source/lib/lottie.mjs";
export { prop, E, rgb, gfill };

// quadratic eases, exactly: constant deceleration (out) and acceleration (in) as cubic Béziers
export const QOUT = [1 / 3, 2 / 3, 2 / 3, 1], QIN = [1 / 3, 0, 2 / 3, 1 / 3];
export const BM = { normal: 0, multiply: 1, screen: 2, overlay: 3, add: 16 };
const r3 = (v) => Math.round(v * 1000) / 1000;
// Ramer–Douglas–Peucker on keys [t, value | [values]] (linear in between)
function rdp(k, tol) {
  if (k.length < 3) return k;
  const val = (e) => (Array.isArray(e[1]) ? e[1] : [e[1]]);
  const keep = new Array(k.length).fill(false); keep[0] = keep[k.length - 1] = true;
  const st = [[0, k.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let mx = -1, mi = -1;
    const va = val(k[a]), vb = val(k[b]);
    for (let i = a + 1; i < b; i++) { const u = (k[i][0] - k[a][0]) / (k[b][0] - k[a][0]); const vi = val(k[i]); let d = 0; for (let j = 0; j < vi.length; j++) d = Math.max(d, Math.abs(vi[j] - (va[j] + (vb[j] - va[j]) * u))); if (d > mx) { mx = d; mi = i; } }
    if (mx > tol) { keep[mi] = true; st.push([a, mi], [mi, b]); }
  }
  return k.filter((_, i) => keep[i]);
}
// a transform from static values or baked keys: { p, a, s, r, o } each a value or { keys: [[t, v], ...] }
function tp(v, dims) {
  if (v && v.kf) {
    const k = v.kf;
    if (k.length === 1) return { a: 0, k: dims ? k[0][1].map(r3) : r3(k[0][1]) };
    // a key's own ease (a CSS-style cubic-bezier [x1, y1, x2, y2], or "hold") shapes the segment it starts; else linear
    return { a: 1, k: k.map(([t, val, ease], i) => { const s = Array.isArray(val) ? val.map(r3) : [r3(val)]; const o = { t, s }; if (i < k.length - 1) { if (v.hold || ease === "hold") o.h = 1; else { const [x1, y1, x2, y2] = ease || [0, 0, 1, 1]; o.o = { x: [x1], y: [y1] }; o.i = { x: [x2], y: [y2] }; } } return o; }) };
  }
  return { a: 0, k: Array.isArray(v) ? v.map(r3) : r3(v) };
}
function ks({ p = [0, 0], a = [0, 0], s = [100, 100], r = 0, o = 100 } = {}) {
  const p3 = (v) => (v && v.kf ? { ...v, kf: v.kf.map(([t, x, e]) => [t, [x[0], x[1], 0], e]) } : [v[0], v[1], 0]);
  const s3 = (v) => (v && v.kf ? { ...v, kf: v.kf.map(([t, x, e]) => [t, [x[0], x[1], 100], e]) } : [v[0], v[1], 100]);
  return { o: tp(o), r: tp(r), p: tp(p3(p), true), a: tp(p3(a), true), s: tp(s3(s), true) };
}
// keys from a function of the frame, sampled every `step` frames between t0 and t1, with repeats folded away
// (then simplified: a key is kept only where dropping it would move the curve by more than tol)
export function bake(t0, t1, fn, step = 2, eps = 1e-3, tol = 0.25) {
  let out = [];
  for (let t = t0; ; t = Math.min(t1, t + step)) { out.push([t, fn(t)]); if (t >= t1) break; }
  out = rdp(out, tol);
  const same = (a, b) => (Array.isArray(a) ? a.every((x, i) => Math.abs(x - b[i]) < eps) : Math.abs(a - b) < eps);
  const k = out.filter((e, i) => i === 0 || i === out.length - 1 || !(same(e[1], out[i - 1][1]) && same(e[1], out[i + 1][1])));
  return { kf: k.every((e) => same(e[1], k[0][1])) ? [k[0]] : k };
}

export class Comp {
  constructor({ w, h, op, fr = 60, nm = "metro" }) { Object.assign(this, { w, h, op, fr, nm }); this.layers = []; this.assets = []; this.ind = 0; this.markers = []; }
  add(L, { into = this.layers } = {}) { L.ind = ++this.ind; into.push(L); return L; }
  base(ty, nm, o) {
    const L = { ddd: 0, ty, nm, sr: 1, ks: ks(o.ks), ao: 0, ip: o.ip ?? 0, op: o.op ?? this.op, st: 0, bm: BM[o.bm || "normal"] };
    if (o.parent) L.parent = o.parent.ind;
    if (o.masks) { L.hasMask = true; L.masksProperties = o.masks; }
    if (o.td) L.td = 1;
    if (o.tt) L.tt = o.tt;
    if (o.hidden) L.hd = true;
    return L;
  }
  // an image asset: px size, file name, k = its pixels per comp pixel (the layer scales by 1/k)
  // (u given: an absolute folder, the asset is "embedded"-flagged so the player uses p as it is: u + file)
  image(id, { w, h, file, k = 1, u = "" }) { if (!this.assets.find((a) => a.id === id)) this.assets.push(u ? { id, w, h, u: "", p: u + file, e: 1, k } : { id, w, h, u: "", p: file, e: 0, k }); return id; }
  imgLayer(nm, refId, o = {}) {
    const a = this.assets.find((x) => x.id === refId), k = a.k || 1;
    const L = this.base(2, nm, { ...o, ks: { ...(o.ks || {}), s: o.ks?.s || [100 / k, 100 / k] } });
    L.refId = refId; return this.add(L, o);
  }
  nul(nm, o = {}) { const L = this.base(3, nm, o); return this.add(L, o); }
  shape(nm, shapes, o = {}) { const L = this.base(4, nm, o); L.shapes = shapes; return this.add(L, o); }
  // a precomp: its own layer list (filled by fn(into)), shown as one layer
  // (a precomp clips to its own box: o.pad moves the content into it by pad px each way, through a null "pad" the
  // content's layers take as parent, and the layer's anchor takes it back)
  precomp(id, nm, fn, o = {}) {
    const layers = [], pad = o.pad || 0;
    const root = pad ? this.nul("pad", { into: layers, ks: { p: [pad, pad] } }) : null;
    fn(layers, root); this.assets.push({ id, layers });
    const L = this.base(0, nm, { ...o, ks: { ...(o.ks || {}), a: [pad, pad] } }); L.refId = id; L.w = this.w + 2 * pad; L.h = this.h + 2 * pad; return this.add(L, o);
  }
  marker(cm, t0, t1) { this.markers.push({ tm: t0, cm, dr: t1 - t0 }); }
  json() {
    const assets = this.assets.map((a) => { const { k, ...rest } = a; return rest; });
    return { v: "5.12.2", fr: this.fr, ip: 0, op: this.op, w: this.w, h: this.h, nm: this.nm, ddd: 0, assets, layers: this.layers, markers: this.markers, meta: { g: "Cromatic metro mockups (design/metro-mockup/_source)" } };
  }
}
// shapes
export const tr = (o = {}) => ({ ty: "tr", p: prop(o.p || [0, 0]), a: prop(o.a || [0, 0]), s: prop(o.s || [100, 100]), r: prop(o.r || 0), o: prop(o.o ?? 100), sk: prop(0), sa: prop(0) });
export const group = (nm, items, t = {}) => ({ ty: "gr", nm, it: [...items, tr(t)] });
export const rect = (w, h, cx, cy) => ({ ty: "rc", d: 1, s: prop([w, h]), p: prop([cx, cy]), r: prop(0) });
export const ell = (w, h, cx, cy) => ({ ty: "el", d: 1, s: prop([w, h]), p: prop([cx, cy]) });
export const fill = (hex, o = 100) => ({ ty: "fl", c: prop(rgb(hex)), o: typeof o === "object" ? tp(o) : prop(o), r: 1, bm: 0 });
export const path = (pts, closed = true) => ({ ty: "sh", d: 1, ks: { a: 0, k: { c: closed, v: pts, i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]) } } });
// a path with baked vertex keys: frames -> list of points
export function pathKeys(keys) { return { ty: "sh", d: 1, ks: { a: 1, k: keys.map(([t, pts], i) => { const o = { t, s: [{ c: true, v: pts.map((p) => p.map(r3)), i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]) }] }; if (i < keys.length - 1) { o.o = { x: [0], y: [0] }; o.i = { x: [1], y: [1] }; } return o; }) } }; }
export const maskRect = (x, y, w, h, { mode = "a", inv = false } = {}) => ({ inv, mode, pt: { a: 0, k: { c: true, v: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]] } }, o: prop(100), x: prop(0), nm: "m" });
