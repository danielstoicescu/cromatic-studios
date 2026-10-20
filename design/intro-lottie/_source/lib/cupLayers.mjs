// Cromatic opening, phase 3 · the 3D cup (lib/cup3d.mjs) as Lottie layers.
//   cupTurn(Cm, ...)  a precomp of one full turn of the cup at a fixed tilt (the handle and the crema move, the rest is
//                     still); any number of cups play it with their own time remap (their own speed, phase, stops)
//   cupMove(Cm, ...)  one cup keyed over scene time on any path of views (a tilt toward the camera, a turn and a tilt
//                     at once): every outline, gradient and highlight is a keyframe
//   steam(Cm, ...)    wisps over a cup, looping
// The cup's origin (the point the camera looks at, its axis at height yt) is the layer's (0, 0); its parent places it.
import { Comp, group, ellipse, path, fill, gfill, stroke, trim, rgb, prop, tmProp, E, FPS, rect, tr } from "./lottie.mjs";
import { frame, ellipseFrac, DESIGNS } from "./cup3d.mjs";

const LIN = [0, 0, 1, 1];
const isAnim = (keys) => keys.length > 1;
// keys -> a Lottie property: [[t, v]] all linear (the frames are dense), or a static value
const kp = (keys, map, ease = LIN) => (keys.length === 1 ? map(keys[0][1]) : keys.map(([t, F], i) => [t, map(F), i < keys.length - 1 ? ease : undefined]));
const pk = (keys, map, ease = LIN) => (keys.length === 1 ? map(keys[0][1]) : keys.map(([t, F], i) => [t, map(F), i < keys.length - 1 ? ease : undefined]));
// a gradient whose stops (positions and colours) may change per key: Lottie keeps the count, the values animate
function gradKeys(keys, pick, { type = 1 } = {}) {
  const g0 = pick(keys[0][1]);
  const flat = (g) => [...g.stops.flatMap(([p, h]) => [p, ...rgb(h).slice(0, 3)]), ...(g.alphas || []).flatMap(([p, a]) => [p, a])];
  const base = gfill({ type, s: g0.s, e: g0.e, stops: g0.stops, alphas: g0.alphas });
  if (keys.length === 1) return base;
  // the gradient's colours: aligned stops (as gfill does), keyed
  const aligned = keys.map(([t, F]) => { const g = pick(F); const one = gfill({ type, s: g.s, e: g.e, stops: g.stops, alphas: g.alphas }); return [t, one.g.k.k, g.s, g.e]; });
  base.g.k = { a: 1, k: aligned.map(([t, k], i) => ({ t, s: k, ...(i < aligned.length - 1 ? { o: { x: [0], y: [0] }, i: { x: [1], y: [1] } } : {}) })) };
  base.s = prop(aligned.map(([t, , s], i) => [t, s, i < aligned.length - 1 ? LIN : undefined]));
  base.e = prop(aligned.map(([t, , , e], i) => [t, e, i < aligned.length - 1 ? LIN : undefined]));
  return base;
}
// the handle's ellipse as seen key to key: the representation (rotation + 90 deg steps, axes swapped) nearest the last,
// and the fractions of the hidden arc and the highlight measured on that representation, unwrapped
function handleKeys(keys) {
  let prev = null;
  const out = keys.map(([t, F]) => {
    const h = F.handle;
    let best = null;
    for (let m = -3; m <= 3; m++) {
      const rot = h.rot + 90 * m, swap = Math.abs(m) % 2 === 1, a = swap ? h.b : h.a, b = swap ? h.a : h.b;
      const d = prev ? Math.abs(rot - prev.rot) : Math.abs(m);
      if (!best || d < best.d) best = { d, rot, a, b };
    }
    const e = { cx: h.cx, cy: h.cy, a: Math.max(0.5, best.a), b: Math.max(0.5, best.b), rot: best.rot };
    const hide = h.hidePts.map((p) => ellipseFrac(e, p));
    const hl = h.hlPts.length ? h.hlPts[0].map((p) => ellipseFrac(e, p)) : null;
    const k = { t, e, hide, hl, front: h.front, w: h.w, lit: h.lit, dark: h.dark, ld: h.ld };
    prev = e;
    return k;
  });
  // a visible arc [from, len] for a trim (start 0, end len, offset from), unwrapped so it never spins the long way
  const unwrap = (vals) => { const o = []; vals.forEach((v, i) => { let x = v; if (i) { while (x - o[i - 1] > 0.5) x -= 1; while (o[i - 1] - x > 0.5) x += 1; } o.push(x); }); return o; };
  const visFrom = unwrap(out.map((k) => k.hide[1])), visLen = out.map((k) => { let l = k.hide[0] - k.hide[1]; while (l <= 0) l += 1; while (l > 1) l -= 1; return Math.min(1, Math.max(0.6, l)); });
  const hlFrom = unwrap(out.map((k) => (k.hl ? k.hl[0] : 0))), hlLen = out.map((k) => { if (!k.hl) return 0; let l = k.hl[1] - k.hl[0]; while (l < 0) l += 1; while (l > 1) l -= 1; return Math.min(0.45, l); });
  out.forEach((k, i) => { k.visFrom = visFrom[i]; k.visLen = visLen[i]; k.hlFrom = hlFrom[i]; k.hlLen = hlLen[i]; });
  // the rotation unwrapped too
  for (let i = 1; i < out.length; i++) { while (out[i].e.rot - out[i - 1].e.rot > 180) out[i].e.rot -= 360; while (out[i - 1].e.rot - out[i].e.rot > 180) out[i].e.rot += 360; }
  return out;
}
// the handle as a tube: a gradient stroke (lit to shade, across the ring) and a highlight stroke along its glint
function handleGroups(HK, which, opts = {}) {
  const T = (map) => (HK.length === 1 ? map(HK[0]) : HK.map((k, i) => [k.t, map(k), i < HK.length - 1 ? LIN : undefined]));
  const H = (map) => (HK.length === 1 ? map(HK[0]) : HK.map((k, i) => [k.t, map(k), i < HK.length - 1 ? "hold" : undefined]));
  const front = which === "front";
  const ell = () => ellipse(T((k) => [2 * k.e.a, 2 * k.e.b]), [0, 0]);
  const xf = { p: T((k) => [k.e.cx, k.e.cy]), r: T((k) => k.e.rot) };
  // the tube's own gradient: from its lit side to its shade, across the ring along the light's screen direction
  const k0 = HK[0];
  const gs = {
    ty: "gs", o: prop(100), w: prop(T((k) => k.w)), lc: 2, lj: 2, ml: 4, bm: 0, t: 1, h: prop(0), a: prop(0),
    g: { p: 3, k: HK.length === 1 ? { a: 0, k: gstops(k0) } : { a: 1, k: HK.map((k, i) => ({ t: k.t, s: gstops(k), ...(i < HK.length - 1 ? { o: { x: [0], y: [0] }, i: { x: [1], y: [1] } } : {}) })) } },
    // in the ellipse's own (rotated) frame: from the light's side to the other
    s: prop(T((k) => { const r = (-k.e.rot * Math.PI) / 180, d = [k.ld[0] * Math.cos(r) - k.ld[1] * Math.sin(r), k.ld[0] * Math.sin(r) + k.ld[1] * Math.cos(r)], m = Math.max(k.e.a, k.e.b) + k.w / 2; return [d[0] * m, d[1] * m]; })),
    e: prop(T((k) => { const r = (-k.e.rot * Math.PI) / 180, d = [k.ld[0] * Math.cos(r) - k.ld[1] * Math.sin(r), k.ld[0] * Math.sin(r) + k.ld[1] * Math.cos(r)], m = Math.max(k.e.a, k.e.b) + k.w / 2; return [-d[0] * m, -d[1] * m]; }))
  };
  const tube = group("tube", [ell(), ...(front ? [trim(0, T((k) => k.visLen * 100), T((k) => k.visFrom * 360))] : []), gs], xf);
  const glint = group("glint", [ell(), trim(0, T((k) => k.hlLen * 100), T((k) => k.hlFrom * 360)), stroke(rgb("#ffffff"), T((k) => k.w * 0.22), 72)], xf);
  return group(`handle · ${which}`, [glint, tube], { o: H((k) => (k.front === front ? 100 : 0)) });
}
function gstops(k) { const c = (h) => rgb(h).slice(0, 3); const mid = mix(k.lit, k.dark, 0.5); return [0, ...c(k.lit), 0.5, ...c(mid), 1, ...c(k.dark)]; }
function mix(a, b, t) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return "#" + [16, 8, 0].map((s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0")).join(""); }
const glazeCol = (col, F) => col(F.design);
// a highlight that is not there: its points at one spot (as many as a highlight's, so the keys can morph)
const dot12 = (F) => { const c = [F.coffee.cx, F.coffee.cy + F.coffee.b * 2]; return { c: true, v: Array.from({ length: 12 }, () => c.map((x) => Math.round(x))), i: Array.from({ length: 12 }, () => [0, 0]), o: Array.from({ length: 12 }, () => [0, 0]) }; };
const ellPath = (e) => ({ ty: "el", d: 1, s: prop([2 * e.a, 2 * e.b]), p: prop([e.cx, e.cy]) });
const ellK = (keys, pick, grow = 0) => ({ ty: "el", d: 1, s: prop(pk(keys, (F) => [2 * (pick(F).a + grow), 2 * (pick(F).b + grow)])), p: prop(pk(keys, (F) => [pick(F).cx, pick(F).cy])) });

/* ---------------------------------- the crema (in the coffee's own disc: scaled to its ellipse) ---------------------------------- */
// a few spiral streaks, lighter and darker, and the meniscus; drawn in a unit disc of radius 100, turned by `turn` keys
function cremaGroups(turn) {
  const spiral = (a0, turns, r0, r1, n = 14) => { const v = []; for (let k = 0; k <= n; k++) { const u = k / n, a = a0 + turns * 2 * Math.PI * u, r = r0 + (r1 - r0) * u; v.push([r * Math.cos(a), r * Math.sin(a)]); } return v; };
  const smoothOpen = (pts) => { const n = pts.length, v = [], i = [], o = []; for (let a = 0; a < n; a++) { const p0 = pts[Math.max(0, a - 1)], p2 = pts[Math.min(n - 1, a + 1)], t = [(p2[0] - p0[0]) / 6, (p2[1] - p0[1]) / 6]; v.push(pts[a].map((x) => +x.toFixed(1))); o.push(t.map((x) => +x.toFixed(1))); i.push(t.map((x) => +(-x).toFixed(1))); } return { c: false, v, i, o }; };
  const streak = (pts, col, w, o) => group("streak", [path(smoothOpen(pts)), stroke(rgb(col), w, o, { lc: 2, lj: 2 })]);
  return group("crema · swirl", [
    streak(spiral(0.3, 0.85, 14, 78), "#F0C590", 7, 55),
    streak(spiral(3.4, 0.7, 20, 72), "#E9B67C", 5, 45),
    streak(spiral(1.9, 0.6, 30, 86), "#6A3818", 4, 38),
    streak(spiral(5.0, 0.5, 8, 50), "#F6D3A6", 3, 50),
    group("bubbles", [...[[52, -40, 3.2], [-60, 30, 2.6], [20, 66, 2.2], [-34, -58, 2.8], [70, 22, 2.0]].map(([x, y, r]) => ellipse([r * 2, r * 2], [x, y])), fill(rgb("#F7DDB8"), 70)])
  ], { r: turn });
}
const CREMA = [[0, "#D59B5E"], [0.45, "#B87A41"], [0.8, "#92552A"], [0.94, "#6B3A1B"], [1, "#4A2410"]];

/* ---------------------------------- one cup's groups, keyed ---------------------------------- */
// keys: [[t, F]]; returns the three layers' shapes (bottom: shadows; body; coffee (needs the opening as a mask); lip)
function cupShapes(keys, { crema = true, turn = 0, still = null } = {}) {
  // `keys` drive what turns with the cup (the handle, its shadow); `still` (one key) the rest when the cup only turns
  const S = still || keys, F0 = S[0][1];
  const HK = handleKeys(keys);
  const shadow = [
    // the key's cast shadow, soft: one outline, filled, and stroked wide and faint round its edge
    group("cast", [path(kp(S, (F) => F.cast)), stroke(rgb("#2a2118"), pk(S, (F) => 0.16 * F.view.U), 5, { lc: 2, lj: 2 }), stroke(rgb("#2a2118"), pk(S, (F) => 0.07 * F.view.U), 6, { lc: 2, lj: 2 }), fill(rgb("#2a2118"), 9)]),
    group("handle shadow", [{ ty: "el", d: 1, s: prop(pk(keys, (F) => [2 * F.handleShadow.a + 10, 2 * F.handleShadow.b + 10])), p: prop(pk(keys, (F) => [F.handleShadow.cx, F.handleShadow.cy])) }, fill(rgb("#2a2118"), 9)]),
    // the contact: a radial gradient drawn in its own circle, squashed to the ellipse by the group's scale
    group("contact", [{ ty: "el", d: 1, s: prop([2 * (F0.contact.a + 6), 2 * (F0.contact.a + 6)]), p: prop([0, 0]) }, gfill({ type: 2, s: [0, 0], e: [F0.contact.a + 6, 0], stops: [[0, "#1d150c"], [1, "#1d150c"]], alphas: [[0, 0.5], [0.72, 0.3], [1, 0]] })], { s: kp(S, (F) => [100, (F.contact.b / F.contact.a) * 100]), p: kp(S, (F) => [F.contact.cx, F.contact.cy]) })
  ];
  const body = [
    group("inside · wall", [ellK(S, (F) => F.opening), gradKeys(S, (F) => F.wallSide), gradKeys(S, (F) => F.wall)]),
    handleGroups(HK, "front"),
    ...[0, 1].map((n) => group("gloss " + n, [path(kp(S, (F) => F.spec[n] || F.spec[0] || dot12(F))), fill(rgb("#ffffff"), pk(S, (F) => (F.spec[n] ? (n ? 50 : 26) * Math.min(1, 0.5 + F.specK) : 0)))])),
    // one outline, the glaze: a flat colour, its shade and its light across, the gloss and the cool rim over it, and
    // the light and shade up and down (the colours are the design's: a cup changes colour by keying them)
    group("glaze", [path(kp(S, (F) => F.hull)), gradKeys(S, (F) => F.vLight), gradKeys(S, (F) => F.vDark),
      ...[["rim", () => "#EEF4FF"], ["white", () => "#FFFFFF"], ["light", (d) => d.outer[2]], ["shade", (d) => d.outer[0]]].map(([k, col]) => gradKeys(S, (F) => ({ s: F.glaze.s, e: F.glaze.e, stops: [[0, glazeCol(col, F)], [1, glazeCol(col, F)]], alphas: F.glaze.pos.map((p, i) => [p, F.glaze[k][i]]) }))),
      ...(F0.band ? [] : [fill(rgb(F0.design.outer[1]))])]),
    // a printed band (the Multiverse ring), under the glaze's light and shade, over its colour
    ...(F0.band ? [group("band", [path(kp(S, (F) => F.band)), gradKeys(keys, (F) => F.bandGrad)]), group("glaze · colour", [path(kp(S, (F) => F.hull)), fill(rgb(F0.design.outer[1]))])] : []),
    handleGroups(HK, "back")
  ];
  // the coffee: in its own disc (scaled to the ellipse), the crema turning; then the lip's shadow and the glint
  const coffee = [
    group("glint", [ellipse([26, 12], [0, 0]), gfill({ type: 2, s: [0, 0], e: [13, 0], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, 0.55], [1, 0]] })], { p: kp(S, (F) => F.glint.p), o: kp(S, (F) => Math.min(100, 40 + 160 * F.glint.k)) }),
    ...(F0.crescent ? [group("lip's shadow", [path(kp(S, (F) => F.crescent || F0.crescent)), fill(rgb("#140a04"), 34)])] : []),
    group("coffee", [
      group("meniscus", [ellipse([196, 196], [0, 0]), stroke(rgb("#F2D3A8"), 3, 55)]),
      ...(crema ? [cremaGroups(turn)] : []),
      group("crema", [ellipse([200, 200], [0, 0]), gfill({ type: 2, s: [-14, -10], e: [100, 0], stops: CREMA })])
    ], { p: kp(S, (F) => [F.coffee.cx, F.coffee.cy]), s: kp(S, (F) => [F.coffee.a, F.coffee.b]) })
  ];
  const lip = [
    group("lip · glint", [ellK(S, (F) => F.lipOuter, -2), trim(0, 30, 200), stroke(rgb("#ffffff"), 2.2, 70)]),
    group("lip", [ellK(S, (F) => F.lipOuter), ellK(S, (F) => F.opening), gradKeys(S, (F) => F.lip)])
  ];
  lip[1].it[2].r = 2; // even-odd: a ring
  return { shadow, body, coffee, lip, openingMask: kp(S, (F) => openingPath(F.opening)) };
}
const openingPath = (e) => { const k = 0.5523, a = e.a, b = e.b, f = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; return { c: true, v: [f([e.cx, e.cy - b]), f([e.cx + a, e.cy]), f([e.cx, e.cy + b]), f([e.cx - a, e.cy])], i: [f([-a * k, 0]), f([0, -b * k]), f([a * k, 0]), f([0, b * k])], o: [f([a * k, 0]), f([0, b * k]), f([-a * k, 0]), f([0, -b * k])] }; };

// add a cup's layers to a comp (or a precomp): shadow, body, coffee (masked by the opening), lip; parented to `parent`.
// o.extra: { lip, coffee, body, shadow } -> extra layer options (ks, masks) for that layer (a hole, a fade, a lift)
function addCup(C, sh, { nm = "cup", parent, ip = 0, op = C.op, extra = {} } = {}) {
  const o = { ip, op, parent };
  const x = (k) => extra[k] || {};
  const lip = C.shape(`${nm} · lip`, sh.lip, { ...o, ...x("lip") });
  const openM = { inv: false, mode: "a", pt: { a: Array.isArray(sh.openingMask) ? 1 : 0, k: Array.isArray(sh.openingMask) ? sh.openingMask.map(([t, p], i) => ({ t, s: [p], ...(i < sh.openingMask.length - 1 ? { o: { x: [0], y: [0] }, i: { x: [1], y: [1] } } : {}) })) : sh.openingMask }, o: prop(100), x: prop(0), nm: "opening" };
  const cof = C.shape(`${nm} · coffee`, sh.coffee, { ...o, ...x("coffee"), masks: [openM] });
  const body = C.shape(`${nm} · body`, sh.body, { ...o, ...x("body") });
  const shadow = C.shape(`${nm} · shadow`, sh.shadow, { ...o, ...x("shadow") });
  return { lip, cof, body, shadow };
}

/* ---------------------------------- a turn, as a precomp ---------------------------------- */
// one full turn in `steps` keys over `steps` frames (time remap plays it at any speed: 1 s of remap = 60 steps)
export function cupTurn(Cm, id, { pitch = 30, U = 100, design = DESIGNS.yellow, steps = 48, dc = 14, yt = 1.0, liquid = 1.62, box = 6.4, cremaTurns = 1, band = null } = {}) {
  const keys = [];
  for (let k = 0; k <= steps; k++) keys.push([k, frame({ pitch, yaw: (360 * k) / steps, U, dc, yt }, design, { liquid, band })]);
  // what does not turn with the cup is the same in every key: keep one key of it
  const still = [[0, keys[0][1]]];
  const sh = cupShapes(keys, { turn: [[0, 0, LIN], [steps, 360 * cremaTurns]], still });
  const W = Math.round(U * box), H = Math.round(U * box);
  const P = new Comp({ w: W, h: H, dur: (steps + 1) / FPS, nm: id });
  P.op = steps + 1;
  const root = P.nul(`${id} · origin`, { ks: { p: [W / 2, H / 2] } });
  addCup(P, sh, { nm: id, parent: root });
  Cm.assets.push({ id, nm: id, fr: FPS, layers: P.layers });
  return { id, w: W, h: H, steps, U };
}
// a cup that plays a turn precomp: its own time remap (turnsK: [[t, turns, ease]] in scene frames: how far it has turned)
export function cupPlay(Cm, pre, { nm = "cup", parent, ip = 0, op = Cm.op, ks = {}, turnsK = [[0, 0]], masks } = {}) {
  const L = { ddd: 0, ty: 0, nm, refId: pre.id, sr: 1, ks: lksPre(ks, pre), ao: 0, w: pre.w, h: pre.h, ip, op, st: 0, bm: 0 };
  if (parent) L.parent = parent.ind;
  if (masks) { L.hasMask = true; L.masksProperties = masks; }
  // the remap: turns -> seconds into the precomp, wrapped each turn (a hold jump back to the start)
  L.tm = tmProp(remapKeys(turnsK, pre.steps));
  return Cm.add(L);
}
function lksPre(ks, pre) {
  const v3 = (v, z) => (Array.isArray(v) && Array.isArray(v[0]) ? v.map(([t, val, e]) => [t, [...val, z].slice(0, 3), e]) : [...v, z].slice(0, 3));
  return { o: prop(ks.o ?? 100), r: prop(ks.r ?? 0), p: prop(v3(ks.p ?? [0, 0], 0)), a: prop([pre.w / 2, pre.h / 2, 0]), s: prop(v3(ks.s ?? [100, 100], 100)) }; // (o may be keys)
}
// sample the turns curve every 2 frames and write remap keys, wrapping at each whole turn
function remapKeys(turnsK, steps) {
  const at = (t) => valAtEased(turnsK, t);
  const t0 = turnsK[0][0], t1 = turnsK[turnsK.length - 1][0];
  const out = [];
  const sec = (turns) => ((((turns % 1) + 1) % 1) * steps) / FPS;
  let prevTurn = Math.floor(at(t0));
  for (let t = t0; t <= t1 + 0.001; t += 2) {
    const v = at(t), w = Math.floor(v);
    if (w !== prevTurn && out.length) {
      // crossing a whole turn between the last sample and this one: end the turn, jump to its start
      const tl = out[out.length - 1][0];
      const u = (prevTurn + (w > prevTurn ? 1 : 0) - at(tl)) / (v - at(tl) || 1);
      const tc = tl + 2 * u;
      out.push([tc - 0.01, w > prevTurn ? (steps - 0.001) / FPS : 0, "hold"]);
      out.push([tc, w > prevTurn ? 0 : (steps - 0.001) / FPS, LIN]);
      prevTurn = w;
    }
    out.push([t, sec(v), LIN]);
  }
  // keep only the samples a straight line between their neighbours does not already give (to a frame's 1/20)
  const keep = [out[0]];
  for (let i = 1; i < out.length - 1; i++) {
    const a = keep[keep.length - 1], b = out[i], c = out[i + 1];
    if (b[2] === "hold" || a[2] === "hold") { keep.push(b); continue; }
    const lin = a[1] + ((c[1] - a[1]) * (b[0] - a[0])) / (c[0] - a[0] || 1);
    if (Math.abs(lin - b[1]) > 1 / FPS / 20) keep.push(b);
  }
  keep.push(out[out.length - 1]);
  return keep.map((k, i) => (i === keep.length - 1 ? [k[0], +k[1].toFixed(5)] : [k[0], +k[1].toFixed(5), k[2]]));
}
// a keyed value with cubic-bezier easing between keys (as Lottie plays it)
export function valAtEased(K, t) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [ta, va, ea] = K[i], [tb, vb] = K[i + 1];
    if (t <= tb) { const u = (t - ta) / (tb - ta || 1); const e = ea === "hold" ? 0 : bez(...(ea || [0.65, 0, 0.35, 1]))(u); return va + (vb - va) * e; }
  }
  return K[K.length - 1][1];
}
function bez(x1, y1, x2, y2) {
  const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = (a) => 3 * a;
  const f = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t, d = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
  return (x) => { let t = x; for (let i = 0; i < 8; i++) { const s = d(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (f(t, x1, x2) - x) / s; } return f(t, y1, y2); };
}

/* ---------------------------------- a path of views (a tilt), as a precomp ---------------------------------- */
// the cup seen along a path of views (viewAt(u), u 0..1) in `steps` keys: any move along it plays as a remap (forward,
// backward, held), so a tilt down and a dive back up share one set of keys
export function cupPath(Cm, id, { viewAt, steps = 20, design = DESIGNS.yellow, liquid = 1.62, box = 6.4, band = null, U = 100, cremaTurn = 0 } = {}) {
  const keys = [];
  for (let k = 0; k <= steps; k++) keys.push([k, frame(viewAt(steps ? k / steps : 0), design, { liquid, band })]);
  // (the crema's own turn: as a turn precomp has it at this yaw, so the two hand over without a jump)
  const sh = cupShapes(keys, { turn: cremaTurn });
  const W = Math.round(U * box), H = Math.round(U * box);
  const P = new Comp({ w: W, h: H, dur: (steps + 1) / FPS, nm: id });
  P.op = Math.max(steps + 1, 2);
  const root = P.nul(`${id} · origin`, { ks: { p: [W / 2, H / 2] } });
  addCup(P, sh, { nm: id, parent: root });
  Cm.assets.push({ id, nm: id, fr: FPS, layers: P.layers });
  return { id, w: W, h: H, steps, U, keys };
}
// a still cup (one view) as a precomp, for many instances: a cup standing in a street
export function cupStill(Cm, id, { view, design = DESIGNS.yellow, liquid = 1.62, band = null, box = 6.4 } = {}) {
  return cupPath(Cm, id, { viewAt: () => view, steps: 0, design, liquid, band, box, U: view.U });
}
// an instance of a still precomp (no remap: it is one frame)
export function cupStillPlay(Cm, pre, { nm = "cup", parent, ip = 0, op = Cm.op, ks = {} } = {}) {
  const L = { ddd: 0, ty: 0, nm, refId: pre.id, sr: 1, ks: lksPre(ks, pre), ao: 0, w: pre.w, h: pre.h, ip, op, st: 0, bm: 0 };
  if (parent) L.parent = parent.ind;
  L.tm = prop(0);
  return Cm.add(L);
}
// a cup that plays a path precomp: uK [[t, u, ease]] (where along the path it is), masks (a hole) on the whole cup
export function cupPathPlay(Cm, pre, { nm = "cup", parent, ip = 0, op = Cm.op, ks = {}, uK = [[0, 0]], masks } = {}) {
  const L = { ddd: 0, ty: 0, nm, refId: pre.id, sr: 1, ks: lksPre(ks, pre), ao: 0, w: pre.w, h: pre.h, ip, op, st: 0, bm: 0 };
  if (parent) L.parent = parent.ind;
  if (masks) { L.hasMask = true; L.masksProperties = masks; }
  L.tm = tmProp(uK.map(([t, u, e], i) => (i < uK.length - 1 ? [t, +((u * pre.steps) / FPS).toFixed(5), e || LIN] : [t, +((u * pre.steps) / FPS).toFixed(5)])));
  return Cm.add(L);
}

/* ---------------------------------- a cup keyed over scene time ---------------------------------- */
// viewAt(t) -> view; keyed every `every` frames from t0 to t1
export function cupFrames({ t0, t1, every = 3, times, viewAt, design = DESIGNS.yellow, liquid = 1.62, band = null }) {
  const ts = times || (() => { const a = []; for (let t = t0; t < t1; t += every) a.push(t); a.push(t1); return a; })();
  return ts.map((t) => [t, frame(viewAt(t), typeof design === "function" ? design(t) : design, { liquid, band })]);
}
export function cupMove(Cm, { nm = "cup", parent, t0, t1, every = 3, times, viewAt, design = DESIGNS.yellow, liquid = 1.62, ip, op, turnK, band = null, crema = true, keys, extra } = {}) {
  keys = keys || cupFrames({ t0, t1, every, times, viewAt, design, liquid, band });
  const sh = cupShapes(keys, { turn: turnK || [[keys[0][0], 0, LIN], [keys[keys.length - 1][0], 90]], crema });
  const L = addCup(Cm, sh, { nm, parent, ip: ip ?? keys[0][0], op: op ?? keys[keys.length - 1][0] + 1, extra });
  return { ...L, keys };
}

/* ---------------------------------- steam, as a precomp (one loop), played by any cup ---------------------------------- */
// one loop of three wisps (period frames), in a box of `w` x `h` with the source at the bottom centre
export function steamLoop(Cm, id, { period = 120, height = 150, scale = 1 } = {}) {
  const W = Math.round(140 * scale), H = Math.round(height * scale + 40 * scale);
  const P = new Comp({ w: W, h: H, dur: (period + 1) / FPS, nm: id });
  P.op = period;
  const nul = P.nul("source", { ks: { p: [W / 2, H - 10 * scale] } });
  steam(P, { nm: id + " · wisps", parent: nul, ip: 0, op: period, period, height, scale, loopOnce: true });
  Cm.assets.push({ id, nm: id, fr: FPS, layers: P.layers });
  return { id, w: W, h: H, period, anchor: [W / 2, H - 10 * scale] };
}
// a cup's steam: the loop played on repeat (a remap that runs and jumps back), its own phase
export function steamPlay(Cm, pre, { nm = "steam", parent, p = [0, 0], ip = 0, op = Cm.op, phase = 0, o = 100, s = 100 } = {}) {
  const L = { ddd: 0, ty: 0, nm, refId: pre.id, sr: 1, ao: 0, w: pre.w, h: pre.h, ip, op, st: 0, bm: 0,
    ks: { o: prop(o), r: prop(0), p: prop(Array.isArray(p[0]) ? p.map(([t, v, e]) => [t, [...v, 0], e]) : [...p, 0]), a: prop([...pre.anchor, 0]), s: prop(Array.isArray(s) ? s.map(([t, v, e]) => [t, [v, v, 100], e]) : [s, s, 100]) } };
  if (parent) L.parent = parent.ind;
  // the remap: seconds into the loop, rising linearly, jumping back at each loop's end
  const per = pre.period / FPS, ks = [];
  let t = ip, x = (phase % 1) * per;
  while (t < op) {
    const left = per - x, tEnd = t + left * FPS;
    ks.push([t, +x.toFixed(5), [0, 0, 1, 1]]);
    if (tEnd >= op) { ks.push([op, +(x + ((op - t) / FPS)).toFixed(5)]); break; }
    ks.push([tEnd - 0.01, +(per - 0.001).toFixed(5), "hold"]);
    t = tEnd; x = 0;
  }
  L.tm = tmProp(ks.map((k, i) => (i === ks.length - 1 ? [k[0], k[1]] : k)));
  return Cm.add(L);
}

/* ---------------------------------- steam ---------------------------------- */
// three wisps rising from the coffee (origin: the coffee's centre in the parent's space), looping every `period` frames
export function steam(Cm, { nm = "steam", parent, origin = [0, 0], scale = 1, ip = 0, op = Cm.op, period = 120, o = 100, height = 150, seed = 3, loopOnce = false } = {}) {
  const wisps = [];
  const N = 6;
  for (let w = 0; w < 3; w++) {
    const x0 = (w - 1) * 22 * scale, ph = w / 3;
    // the wisp's path at a few moments of its loop: a sine that travels up, swaying
    const keyAt = (u) => {
      const v = [];
      for (let k = 0; k < N; k++) {
        const s = k / (N - 1), y = -s * height * scale, sway = Math.sin(2 * Math.PI * (u + ph) + s * 3.2 + w) * (6 + 16 * s) * scale;
        v.push([+(x0 * (1 - 0.3 * s) + sway).toFixed(1), +y.toFixed(1)]);
      }
      const n = v.length, vv = [], ii = [], oo = [];
      for (let a = 0; a < n; a++) { const p0 = v[Math.max(0, a - 1)], p2 = v[Math.min(n - 1, a + 1)], t = [(p2[0] - p0[0]) / 6, (p2[1] - p0[1]) / 6]; vv.push(v[a]); oo.push(t.map((x) => +x.toFixed(1))); ii.push(t.map((x) => +(-x).toFixed(1))); }
      return { c: false, v: vv, i: ii, o: oo };
    };
    const pkeys = []; for (let k = 0; k <= 6; k++) pkeys.push([ip + (k * period) / 6, keyAt(k / 6), k < 6 ? E.inOut : undefined]);
    const loopK = (fn) => { const ks = []; for (let c = 0; ip + c * period < op + period; c++) for (const [t, v, e] of fn(ip + c * period)) ks.push([t, v, e]); return dedupe(ks); };
    const pathKeys = loopK((s) => pkeys.map(([t, v, e]) => [t - ip + s, v, e || E.inOut]));
    // the wisp rises out of the coffee and thins away at the top: a trim that travels up, its own phase
    const off = ph * period;
    const trimE = loopK((s) => [[s - off, 0, E.out], [s - off + period * 0.55, 100, E.linear], [s - off + period, 100, "hold"]]).filter((k) => k[0] >= ip - period);
    const trimS = loopK((s) => [[s - off, 0, E.hold], [s - off + period * 0.35, 0, E.in], [s - off + period, 100, "hold"]]).filter((k) => k[0] >= ip - period);
    const strokes = [[20, 8], [11, 14], [4.5, 28]].map(([wd, op2]) => stroke(rgb("#ffffff"), wd * scale, op2, { lc: 2, lj: 2 }));
    wisps.push(group("wisp " + w, [path(pathKeys), trim(trimS, trimE, 0), ...strokes]));
  }
  return Cm.shape(nm, wisps, { parent, ip, op, ks: { p: origin, o } });
}

// keys sorted, one per time (the later wins), the last without an easing
function dedupe(ks) {
  const s = [...ks].sort((a, b) => a[0] - b[0]), out = [];
  for (const k of s) { if (out.length && Math.abs(out[out.length - 1][0] - k[0]) < 1e-6) out[out.length - 1] = k; else out.push(k); }
  return out.map((k, i) => (i === out.length - 1 ? [k[0], k[1]] : k));
}
