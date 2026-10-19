// Nine cups v2 · a baked cup (tools/bakecups2.mjs: the original three.js cup's colours and its traced handle) and the
// geometry (lib/cup2geo.mjs: outlines, ellipses, patterns) as Lottie precomps:
//   tilt  NT + 1 keys from straight above to the old angle, the handle where it stands: every part keyed
//   turn  NY + 1 keys of one turn at the old angle: the handle keyed (outline, hole, light), the rest still; the
//         pattern slides round under the glaze's light in a loop of its own (one period of the pattern), nested
// A cup plays them with a time remap (cup2Play): its own speed, ease, wobble come from its parent.
// Layers in a cup, top to bottom: handle, coffee (its glint, its edge, the world in it, the espresso), the inside, the
// lip, the glaze's light up and down, the pattern, the body, the shadow.
import { Comp, group, path, fill, gfill, rgb, prop, tmProp, FPS, ellipse, alignStops } from "./lottie.mjs";
import * as G from "./cup2geo.mjs";

const LIN = [0, 0, 1, 1];
const r1 = (v) => Math.round(v * 10) / 10;
const rh = (v) => Math.round(v * 2) / 2; // (shape points to half a precomp pixel: under a quarter of a screen pixel)
const kk = (arr, fn, ease = LIN) => (arr.length === 1 ? fn(arr[0][1], 0) : arr.map(([t, v], i) => [t, fn(v, i), i < arr.length - 1 ? ease : undefined]));
const pathKeys = (arr) => (arr.length === 1 ? { a: 0, k: arr[0][1] } : { a: 1, k: arr.map(([t, p], i) => ({ t, s: [p], ...(i < arr.length - 1 ? { o: { x: [0], y: [0] }, i: { x: [1], y: [1] } } : {}) })) });
const shp = (arr) => ({ ty: "sh", d: 1, ks: pathKeys(arr) });
const hexMix = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return "#" + [16, 8, 0].map((s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0")).join(""); };
const lumHex = (h) => { const n = parseInt(h.slice(1), 16); return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };

// a cup's precomp space: wall units around the origin O (its standing view's frame), KP px a unit, y down
export function space(O, KP, box) { const W = Math.round(box * KP); return { W, H: W, KP, O, to: (q) => [rh((q[0] - O[0]) * KP + W / 2), rh((O[1] - q[1]) * KP + W / 2)] }; }
// paths (in a space): a closed polygon (straight or smoothed), an ellipse (4 beziers), n points at one spot
const polyPath = (S, pts, smooth = false) => {
  const P = pts.map((q) => S.to(q)), n = P.length;
  const v = P, i = [], o = [];
  for (let a = 0; a < n; a++) {
    if (!smooth) { i.push([0, 0]); o.push([0, 0]); continue; }
    const p0 = P[(a - 1 + n) % n], p2 = P[(a + 1) % n], t = [rh((p2[0] - p0[0]) / 6), rh((p2[1] - p0[1]) / 6)];
    o.push(t); i.push([-t[0], -t[1]]);
  }
  return { c: true, v, i, o };
};
const ellPath = (S, e, grow = 0) => {
  const a = e.a + grow, b = e.b + grow, k = 0.5523, v = [], i = [], o = [];
  for (const t of [Math.PI / 2, 0, -Math.PI / 2, Math.PI]) { // the top, the right, the bottom, the left (y up)
    const p = G.ellPt({ ...e, a, b }, t), d = [-a * Math.sin(t) * Math.cos(e.ang) - b * Math.cos(t) * Math.sin(e.ang), -a * Math.sin(t) * Math.sin(e.ang) + b * Math.cos(t) * Math.cos(e.ang)];
    const P = S.to(p), D = [d[0] * S.KP * k, -d[1] * S.KP * k]; // (y down)
    v.push(P); o.push([r1(-D[0]), r1(-D[1])]); i.push([r1(D[0]), r1(D[1])]); // clockwise on screen (decreasing t)
  }
  return { c: true, v, i, o };
};
const dotPath = (S, q, n) => { const P = S.to(q); return { c: true, v: Array.from({ length: n }, () => P.slice()), i: Array.from({ length: n }, () => [0, 0]), o: Array.from({ length: n }, () => [0, 0]) }; };
const ellPoly = (e, n = 48) => Array.from({ length: n }, (_, k) => G.ellPt(e, (-k / n) * Math.PI * 2));
// a polygon clipped by a convex one (both counter-clockwise or both clockwise: Sutherland-Hodgman)
function clipConvex(subject, clip) {
  let out = subject;
  const sgn = Math.sign(G.area(clip)) || 1;
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length], inp = out; out = [];
    const inside = (p) => sgn * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q) => { const A1 = b[1] - a[1], B1 = a[0] - b[0], C1 = A1 * a[0] + B1 * a[1], A2 = q[1] - p[1], B2 = p[0] - q[0], C2 = A2 * p[0] + B2 * p[1], det = A1 * B2 - A2 * B1 || 1e-9; return [(B2 * C1 - B1 * C2) / det, (A1 * C2 - A2 * C1) / det]; };
    for (let k = 0; k < inp.length; k++) { const p = inp[k], q = inp[(k + 1) % inp.length]; if (inside(q)) { if (!inside(p)) out.push(cut(p, q)); out.push(q); } else if (inside(p)) out.push(cut(p, q)); }
    if (!out.length) return [];
  }
  return out;
}
// a list of colour stops -> n evenly spaced (so keyed gradients keep their count)
const resampleStops = (stops, n) => Array.from({ length: n }, (_, k) => { const t = k / (n - 1); let j = 0; while (j < stops.length - 2 && stops[j + 1][0] < t) j++; const [p0, c0] = stops[j], [p1, c1] = stops[Math.min(stops.length - 1, j + 1)]; return [+t.toFixed(3), hexMix(c0, c1, Math.max(0, Math.min(1, (t - p0) / (p1 - p0 || 1))))]; });
// a gradient fill keyed over the keys of a precomp (stops resampled to n when keyed)
function gradFill(S, arr, { type = 1, n = 12, rule } = {}) {
  const one = (g) => ({ ...g, s: S.to(g.s), e: S.to(g.e) });
  const flat = (g) => [...g.stops.flatMap(([p, h]) => [p, ...rgb(h).slice(0, 3)]), ...(g.alphas ? g.alphas.flatMap(([p, a]) => [p, a]) : [])];
  // (colour and opacity stops on the same positions: the canvas renderer draws a gradient opaque otherwise)
  let gs = arr.map(([t, g]) => [t, one(g.alphas ? (() => { const [st, al] = alignStops(g.stops, g.alphas); return { ...g, stops: st, alphas: al }; })() : g)]);
  if (gs.length > 1) gs = gs.map(([t, g]) => [t, { ...g, stops: resampleStops(g.stops, n), alphas: g.alphas ? resampleStops(g.alphas.map(([p, a]) => [p, "#" + Math.round(a * 255).toString(16).padStart(2, "0").repeat(3)]), n).map(([p, h]) => [p, +(parseInt(h.slice(1, 3), 16) / 255).toFixed(3)]) : null }]);
  const g0 = gs[0][1], P = g0.stops.length;
  const gf = { ty: "gf", o: prop(100), r: rule || 1, bm: 0, t: type, h: prop(0), a: prop(0), g: { p: P, k: gs.length === 1 ? { a: 0, k: flat(g0) } : { a: 1, k: gs.map(([t, g], i) => ({ t, s: flat(g), ...(i < gs.length - 1 ? { o: { x: [0], y: [0] }, i: { x: [1], y: [1] } } : {}) })) } }, s: prop(kk(gs, (g) => g.s)), e: prop(kk(gs, (g) => g.e)) };
  return gf;
}

function gradFillLocal(arr, opts) { const S0 = { to: (q) => q.map(r1) }; return gradFill(S0, arr, opts); }

// an ellipse turned by a quarter as needed (its axes swapped) so its angle is within 45 degrees of the screen's x
function normEll(e) {
  let { a, b, ang } = e;
  ang = Math.atan2(Math.sin(ang), Math.cos(ang));
  if (ang > Math.PI / 2) ang -= Math.PI; if (ang <= -Math.PI / 2) ang += Math.PI;
  if (ang > Math.PI / 4) { ang -= Math.PI / 2; [a, b] = [b, a]; } else if (ang <= -Math.PI / 4) { ang += Math.PI / 2; [a, b] = [b, a]; }
  return { ...e, a, b, ang };
}

/* ------------------------------ one view's shapes ------------------------------ */
// everything one key needs, from a baked view (B) and the geometry: in wall units, still to be put in the space
export function viewShapes(cam, cupDef, B, { pattern = null, design }) {
  const xf = G.cupXf({ X: cupDef.X, Y: cupDef.Y, tilt: B.tiltRad, yaw: B.yawRad });
  const F = {};
  F.hull = G.resample(G.bodyHull(cam, xf), 28, [0, -1]);
  // the lip: the inner lathe's lip rings, projected (the rim's whole top, far side rounded over)
  const lipPts = [];
  // (the rim's top only: from the outer edge over to the opening's edge; the inside below is the opening's to draw)
  for (let j = 0; j <= 3; j++) { const a = G.INNER[j], b = G.INNER[Math.min(3, j + 1)]; for (let f = 0; f < (j < 3 ? 1 : 0.01); f += 0.25) for (let k = 0; k < 96; k++) lipPts.push(cam.P(xf.spun(G.lathePt(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (k / 96) * Math.PI * 2)))); }
  F.lip = G.resample(G.hull(lipPts), 24, [0, -1]);
  // (ellipses with their axes as near the screen's as can be: a near circle (from above) has no stable major axis, and
  // a key-to-key turn of 90 degrees would sweep the coffee's squash through nothing)
  F.open = normEll(G.projCircle(cam, xf, 1.315, 2.035, { still: false }));
  F.coffeeE = normEll(G.projCircle(cam, xf, G.LIQ.r, G.LIQ.y, { still: true }));
  const openPoly = ellPoly(F.open, 40);
  F.coffee = clipConvex(ellPoly(F.coffeeE, 40), openPoly);
  // the shadow blob (the old plane under the cup, 5.2 square, a radial texture): its circle of 2.6 on the ground
  F.shadow = normEll(G.projCircle(cam, xf, 2.6, -0.02, { still: true }));
  F.axis = [cam.P(xf.spun([0, 0, 0])), cam.P(xf.spun([0, 2, 0]))];
  return F;
}

// the handle's centre circle, projected: an ellipse, and the tube's width there (wall units)
export function ringEllipse(cam, xf) {
  const H = G.HANDLE, pts = [];
  for (let k = 0; k < 48; k++) { const t = (k / 48) * Math.PI * 2; pts.push(cam.P(xf.spun([H.cx + H.R * Math.cos(t), H.cy + H.R * Math.sin(t), 0]))); }
  const e = G.fitEllipse(pts), c = xf.spun([H.cx, H.cy, 0]);
  return { cx: e.cx, cy: e.cy, a: e.a, b: e.b, ang: e.ang, w: (2 * H.r * cam.Zc) / (cam.Zc - c[2]) };
}

/* ------------------------------ the pattern, slid round ------------------------------ */
// the shapes of a pattern seen at a view: each polygon on the outer surface, its points that turn away from the camera
// moved round to the outline (so a shape going behind folds onto the edge, never across the cup), in wall units
export function patternShapes(cam, cupDef, view, patName, { window: win = null } = {}) {
  const PT = G.PATTERNS[patName];
  const xf = G.cupXf({ X: cupDef.X, Y: cupDef.Y, tilt: view.tilt, yaw: view.yaw });
  const eye = cam.eye;
  // the outer surface at (phi, y): its point and outward normal
  const surf = (phi, r, y, nr, ny) => { const p = xf.spun(G.lathePt(r + 0.004, y, phi)), n = xf.nSpun([nr * Math.sin(phi), ny, nr * Math.cos(phi)]); return { p, n }; };
  const facing = (s) => (eye[0] - s.p[0]) * s.n[0] + (eye[1] - s.p[1]) * s.n[1] + (eye[2] - s.p[2]) * s.n[2];
  const prof = (y) => { const r = G.outerR(y), e = 0.01, nr = G.outerR(y + e) - G.outerR(y - e), l = Math.hypot(2 * e, nr); return { r, nr: (2 * e) / l, ny: -nr / l }; };
  // the front at a height, and where the surface stops facing the camera either side of it
  const frontPhi = (y) => { const q = prof(y); let best = 0, bz = -Infinity; for (let k = 0; k < 180; k++) { const ph = (k / 180) * Math.PI * 2, s = surf(ph, q.r, y, q.nr, q.ny); const f = facing(s) / Math.hypot(eye[0] - s.p[0], eye[1] - s.p[1], eye[2] - s.p[2]); if (f > bz) { bz = f; best = ph; } } return best; };
  const fronts = new Map();
  const fr = (y) => { const key = Math.round(y * 50); if (!fronts.has(key)) fronts.set(key, frontPhi(key / 50)); return fronts.get(key); };
  // dGiven: the angle from the front already worked out (a shape's points all on its centre's side of the cup)
  const place = (phi, y, dGiven = null) => {
    const q = prof(y), f0 = fr(y);
    let d = dGiven ?? phi - f0; if (dGiven == null) d = Math.atan2(Math.sin(d), Math.cos(d));
    const s = surf(f0 + d, q.r, y, q.nr, q.ny);
    if (facing(s) > 0) return cam.P(s.p);
    // slide toward the front until it faces: the outline point on that side
    let lo = 0, hi = d;
    if (facing(surf(f0, q.r, y, q.nr, q.ny)) <= 0) return cam.P(surf(f0, q.r, y, q.nr, q.ny).p); // (nothing of this height is seen)
    for (let it = 0; it < 18; it++) { const m = (lo + hi) / 2; if (facing(surf(f0 + m, q.r, y, q.nr, q.ny)) > 0) lo = m; else hi = m; }
    return cam.P(surf(f0 + lo, q.r, y, q.nr, q.ny).p);
  };
  const out = [];
  if (PT.space === "tex") {
    for (const sh of PT.shapes(win)) {
      // the polygon, its edges divided (it lies on a curved surface), its points in (phi, y)
      const pts = [];
      const P = sh.poly;
      // (an edge is divided where the profile bends, at the lathe's points, and where it runs far round the cup)
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length], ts = [0];
        const va = 1 - a[1] / 256, vb = 1 - b[1] / 256;
        for (let j = 1; j < 8; j++) { const vj = j / 8; if ((vj - va) * (vj - vb) < 0) ts.push((vj - va) / (vb - va)); }
        const nx = Math.ceil(Math.abs(b[0] - a[0]) / 40); for (let k = 1; k < nx; k++) ts.push(k / nx);
        ts.sort((x, y) => x - y);
        for (const t of ts) { const x = a[0] + (b[0] - a[0]) * t, yv = a[1] + (b[1] - a[1]) * t; const v = 1 - yv / 256, [, y] = G.outerAtV(v); pts.push([(x / 1024) * Math.PI * 2, y, v]); }
      }
      // what lies on the foot's underside is never seen from above: drop it
      const seen = pts.filter((q) => q[2] > 2.6 / 8);
      if (seen.length < 3) continue;
      out.push(seen.map(([phi, y]) => place(phi, y)));
    }
  } else {
    for (const sh of PT.shapes()) {
      if (sh.ring) {
        // a band all round: its top and bottom edges from one outline to the other
        const [y0, y1] = sh.ring, Y0 = Math.max(0.12, y0), Y1 = Math.min(1.98, y1), top = [], bot = [];
        const edge = (y) => { const f0 = fr(y), q = prof(y); let lo = 0, hi = Math.PI; for (let it = 0; it < 18; it++) { const m = (lo + hi) / 2; if (facing(surf(f0 + m, q.r, y, q.nr, q.ny)) > 0) lo = m; else hi = m; } let lo2 = 0, hi2 = -Math.PI; for (let it = 0; it < 18; it++) { const m = (lo2 + hi2) / 2; if (facing(surf(f0 + m, q.r, y, q.nr, q.ny)) > 0) lo2 = m; else hi2 = m; } return [f0 + lo2, f0 + lo]; };
        const [a1, b1] = edge(Y1), [a0, b0] = edge(Y0);
        for (let k = 0; k <= 24; k++) top.push(cam.P(surf(a1 + ((b1 - a1) * k) / 24, prof(Y1).r, Y1, prof(Y1).nr, prof(Y1).ny).p));
        for (let k = 24; k >= 0; k--) bot.push(cam.P(surf(a0 + ((b0 - a0) * k) / 24, prof(Y0).r, Y0, prof(Y0).nr, prof(Y0).ny).p));
        out.push(top.concat(bot));
      } else {
        // a shape of its own (a dot): its points on its centre's side, so one going round the back folds onto one edge
        const pc = sh.poly.reduce((a, q) => a + q[0], 0) / sh.poly.length, yc = sh.poly.reduce((a, q) => a + q[1], 0) / sh.poly.length;
        let dc = pc - fr(yc); dc = Math.atan2(Math.sin(dc), Math.cos(dc));
        const far = Math.abs(dc) > Math.PI * 0.7; // well behind: all of it on the edge
        out.push(sh.poly.map(([phi, y]) => place(phi, y, far ? Math.sign(dc) * Math.PI * 0.99 : dc + (phi - pc))));
      }
    }
  }
  return out;
}

/* ------------------------------ the precomps ------------------------------ */
// layers for a list of keys: [[frame, { B (baked view), F (viewShapes), pat (pattern polygons | null) }]]
function cupLayers(P, S, keys, { design, world, patternLayer = null, still = null, Cm = null, id = "cup" }) {
  const D = design;
  // still: one key for everything but the handle (a turn: only the handle and the pattern move)
  const SK = still ? [[0, still]] : keys;
  const st = (fn) => SK.map(([t, K]) => [t, fn(K)]);
  const root = P.nul("origin", {});
  // the handle. A ring of round section seen from anywhere is the stroke of its centre circle's ellipse, as wide as
  // the tube: drawn so, it is the same smooth closed loop from key to key. Where the cup hides part of it, a mask clips
  // it: the visible handle traced from the original (its outline, a hair wider), so it meets the cup where the cup is
  // Two copies, one over the other: one clipped to everything outside the cup's outline (which is still while the cup
  // turns, so where the cup hides the handle the cut is the cup's own edge, exactly); the other clipped to the handle as
  // the original shows it (traced), only while part of it is in front of the cup (the rest of the time a point): the
  // part in front, and its join with the cup, are the original's
  const HM = 28;
  const hk = keys.map(([t, K]) => {
    const front = (K.B.handle.front || [])[0], o = K.B.handle.outs[0], an = K.handleAnchor;
    const seen = front && o ? G.resample(growPoly(o, 0.7 / S.KP), HM, [an[0] - K.handleC[0], an[1] - K.handleC[1]]) : null;
    const fc = front ? front.reduce((a, p) => [a[0] + p[0] / front.length, a[1] + p[1] / front.length], [0, 0]) : null;
    return { t, ring: K.ring, mask: seen, fc, c: K.handleC, light: K.B.handleLight, hi: K.B.handleHi };
  });
  const near = (i, f) => { for (let d = 1; d < hk.length; d++) for (const j of [i - d, i + d]) if (j >= 0 && j < hk.length && f(hk[j])) return hk[j]; return null; };
  // the ellipse as the nearest of its equivalent forms to the last key's (axes swapped with a quarter turn)
  let prevR = null;
  for (const q of hk) {
    const e = q.ring; let best = null;
    for (let m = -3; m <= 3; m++) { const rot = e.ang + (m * Math.PI) / 2, sw = Math.abs(m) % 2 === 1, a = sw ? e.b : e.a, b = sw ? e.a : e.b; const d = prevR ? Math.abs(rot - prevR.rot) : Math.abs(m); if (!best || d < best.d) best = { d, rot, a, b }; }
    q.re = { cx: e.cx, cy: e.cy, a: best.a, b: best.b, rot: best.rot, w: e.w }; prevR = q.re;
  }
  const rk = hk.map((q) => [q.t, q.re]);
  const hMask = hk.map((q, i) => [q.t, q.mask ? polyPath(S, q.mask, true) : dotPath(S, (near(i, (x) => x.mask) || { fc: q.c }).fc || q.c, HM)]);
  // the light across the tube, in the ring group's own frame (it turns with the ellipse)
  const local = (q, p) => { const P0 = S.to([q.re.cx, q.re.cy]), P1 = S.to(p), d = [P1[0] - P0[0], P1[1] - P0[1]], r = q.re.rot; return [r1(d[0] * Math.cos(r) - d[1] * Math.sin(r)), r1(d[0] * Math.sin(r) + d[1] * Math.cos(r))]; };
  const hLight = hk.map((q, i) => { const L0 = q.light || (near(i, (x) => x.light) || { light: { s: [0, 0], e: [1, 0], stops: [[0, D.handle], [1, D.handle]] } }).light; return [q.t, { ...L0, s: local(q, L0.s), e: local(q, L0.e) }]; });
  // (the tube as a filled ring, its outer and inner edges ellipses a half-width out and in: the canvas renderer draws a
  // keyed gradient stroke a hair wide)
  const ringFill = gradFillLocal(hLight, { n: 6, rule: 2 });
  // the glint along the tube (where the original's highlight is, traced)
  const GN = 12;
  const hiPts = hk.map((q, i) => {
    if (q.hi) return G.resample(q.hi.pts, GN, [q.c[0] - 10, q.c[1] + 10]);
    const n = near(i, (x) => x.hi); if (n) { const P0 = n.hi.pts, c = P0.reduce((s2, p) => [s2[0] + p[0] / P0.length, s2[1] + p[1] / P0.length], [0, 0]); return Array(GN).fill(c); }
    return Array(GN).fill(q.c);
  });
  const hiK = hk.map((q, i) => [q.t, polyPath(S, hiPts[i], true)]);
  const hiO = hk.map((q) => [q.t, q.hi ? Math.min(65, 25 + q.hi.k * 150) : 0]);
  const outsideCup = { inv: true, mode: "a", pt: pathKeys(st((K) => ccwPath(polyPath(S, K.F.hull, true)))), o: prop(100), x: prop(0), nm: "outside the cup" };
  const seenMask = { inv: false, mode: "a", pt: pathKeys(hMask), o: prop(100), x: prop(0), nm: "as the original shows it" };
  const hw = (e) => (e.w / 2) * S.KP;
  const handleGroups = () => [
    group("glint", [shp(hiK), fill(rgb("#ffffff"), hiO.length === 1 ? hiO[0][1] : hiO.map(([t, v], i) => [t, v, i < hiO.length - 1 ? LIN : undefined]))]),
    group("ring", [
      ellipse(kk(rk, (e) => [r1(2 * e.a * S.KP + 2 * hw(e)), r1(2 * e.b * S.KP + 2 * hw(e))]), [0, 0]),
      ellipse(kk(rk, (e) => [r1(Math.max(0, 2 * e.a * S.KP - 2 * hw(e))), r1(Math.max(0, 2 * e.b * S.KP - 2 * hw(e)))]), [0, 0]),
      ringFill
    ], { p: kk(rk, (e) => S.to([e.cx, e.cy])), r: kk(rk, (e) => r1((-e.rot * 180) / Math.PI)) })
  ];
  // (the handle drawn once, in a precomp of its own the size and length of this one, placed twice)
  // 3.7x (the worker's frame, Daniel's phone): the copy in front is there only while the original shows part of the
  // handle in front (between two keys either of which has it: its mask grows from a point and back); the rest of the
  // time its mask was a point and it drew nothing, at the cost of a whole handle and a clip. (The copy behind keeps its
  // mask: under the body unmasked it would show through the body while a cup fades out, each layer see-through)
  if (Cm) {
    const HP = new Comp({ w: S.W, h: S.H, dur: P.op / FPS, nm: `${id} · handle` }); HP.op = P.op;
    HP.shape("handle", handleGroups(), {});
    Cm.assets.push({ id: `${id} · handle`, nm: `${id} · handle`, fr: FPS, layers: HP.layers });
    const pre = { id: `${id} · handle`, w: S.W, h: S.H };
    const wins = [];
    for (let i = 0; i < hk.length; i++) {
      const on = hk.length === 1 ? !!hk[0].mask : i < hk.length - 1 ? !!(hk[i].mask || hk[i + 1].mask) : !!hk[i].mask;
      if (!on) continue;
      const a = hk[i].t, b = i < hk.length - 1 ? hk[i + 1].t : P.op;
      if (wins.length && wins[wins.length - 1][1] >= a) wins[wins.length - 1][1] = b; else wins.push([a, b]);
    }
    for (const [a, b] of wins) preLayer(P, pre, { nm: "handle · in front", masks: [seenMask], ip: Math.max(0, Math.floor(a)), op: Math.min(P.op, Math.ceil(b) + 1) });
    preLayer(P, pre, { nm: "handle", masks: [outsideCup] });
  } else {
    P.shape("handle · in front", handleGroups(), { parent: root, masks: [seenMask] });
    P.shape("handle", handleGroups(), { parent: root, masks: [outsideCup] });
  }
  // the coffee: the espresso, the world in it, its edge and glint (the coffee is what the opening shows of it)
  const cofVis = st((K) => polyPath(S, K.F.coffee.length >= 3 ? G.resample(K.F.coffee, 28, [0, 1]) : Array(28).fill([K.F.coffeeE.cx, K.F.coffeeE.cy]), true));
  const cofGrad = st((K) => ({ s: [K.F.coffeeE.cx, K.F.coffeeE.cy], e: [K.F.coffeeE.cx + K.F.coffeeE.a, K.F.coffeeE.cy], stops: K.cofStops }));
  // (a radial gradient is round: the espresso's is drawn in a group squashed to the coffee's ellipse)
  const cofE = st((K) => K.F.coffeeE);
  const cofInGroup = SK.map(([t, K]) => { const e = K.F.coffeeE, c = S.to([e.cx, e.cy]), sy = Math.max(0.02, e.b / e.a), ang = -e.ang; const poly = K.F.coffee.length >= 3 ? G.resample(K.F.coffee, 28, [0, 1]) : Array(28).fill([e.cx, e.cy]); return [t, polyPath({ ...S, to: (q) => { const p = S.to(q), d = [p[0] - c[0], p[1] - c[1]], u = [d[0] * Math.cos(-ang) - d[1] * Math.sin(-ang), d[0] * Math.sin(-ang) + d[1] * Math.cos(-ang)]; return [r1(u[0]), r1(u[1] / sy)]; } }, poly, true)]; });
  if (world) {
    // the world's street, on the coffee: an image squashed to the coffee's ellipse, clipped to what is seen of it
    const { refId, cell, cellPx } = world;
    const L = SK.map(([t, K]) => {
      const e = K.F.coffeeE, c = S.to([e.cx, e.cy]), sx = ((2 * e.a * S.KP) / cellPx) * 103, sy = ((2 * e.b * S.KP) / cellPx) * 103, rot = (-e.ang * 180) / Math.PI;
      return { t, c, sx, sy, rot };
    });
    const maskK = SK.map(([t, K], i) => {
      const l = L[i], poly = K.F.coffee.length >= 3 ? G.resample(K.F.coffee, 28, [0, 1]) : Array(28).fill([K.F.coffeeE.cx, K.F.coffeeE.cy]);
      const r = (l.rot * Math.PI) / 180, cs = Math.cos(-r), sn = Math.sin(-r);
      const img = poly.map((q) => { const p = S.to(q), d = [p[0] - l.c[0], p[1] - l.c[1]], u = [d[0] * cs - d[1] * sn, d[0] * sn + d[1] * cs]; return [cell[0] + u[0] / (l.sx / 100), cell[1] + u[1] / (l.sy / 100)]; });
      const n = img.length, v = img.map((q) => q.map(r1)), ii = [], oo = [];
      for (let a = 0; a < n; a++) { const p0 = img[(a - 1 + n) % n], p2 = img[(a + 1) % n], tg = [r1((p2[0] - p0[0]) / 6), r1((p2[1] - p0[1]) / 6)]; oo.push(tg); ii.push([-tg[0], -tg[1]]); }
      return [t, { c: true, v, i: ii, o: oo }];
    });
    P.image("coffee · the world", refId, { parent: root, ks: { a: cell, p: kk(L.map((l) => [l.t, l]), (l) => l.c), s: kk(L.map((l) => [l.t, l]), (l) => [l.sx, l.sy]), r: kk(L.map((l) => [l.t, l]), (l) => l.rot), o: world.o ?? 100 }, masks: [{ inv: false, mode: "a", pt: pathKeys(maskK), o: prop(100), x: prop(0), nm: "coffee" }] });
  }
  P.shape("coffee · espresso", [group("espresso", [shp(cofInGroup), gradFillLocal(st((K) => ({ s: [0, 0], e: [K.F.coffeeE.a * S.KP, 0], stops: K.cofStops })), { type: 2, n: 7 })], { p: kk(cofE, (e) => S.to([e.cx, e.cy])), s: kk(cofE, (e) => [100, Math.max(2, (e.b / e.a) * 100)]), r: kk(cofE, (e) => (-e.ang * 180) / Math.PI) })], { parent: root });
  // the inside (the far wall above the coffee), the lip
  P.shape("inside", [group("wall", [shp(st((K) => ellPath(S, K.F.open))), gradFill(S, st((K) => K.wallGrad), { n: 6 })])], { parent: root });
  P.shape("inside · light across", [group("across", [shp(st((K) => ellPath(S, K.F.open))), gradFill(S, st((K) => K.wallSide), { n: 6 })])], { parent: root });
  P.shape("lip", [group("lip", [shp(st((K) => polyPath(S, K.F.lip, true))), gradFill(S, st((K) => K.lipGrad), { n: 8 })])], { parent: root });
  // the glaze's light up and down the body (an overlay: black where darker than at the middle, white where lighter)
  // (one outline, two fills: the white over the black)
  P.shape("glaze · up and down", [group("glaze", [shp(st((K) => polyPath(S, K.F.hull, true))), gradFill(S, st((K) => K.vLight), { n: 8 }), gradFill(S, st((K) => K.vDark), { n: 8 })])], { parent: root });
  // the pattern (its own shapes, or a nested loop), clipped to the body
  const hullMask = { inv: false, mode: "a", pt: pathKeys(st((K) => polyPath(S, K.F.hull, true))), o: prop(100), x: prop(0), nm: "body" };
  if (patternLayer) patternLayer(P, root, hullMask);
  else if (SK[0][1].pat) {
    const np = SK[0][1].pat.length, sm = !!SK[0][1].patSmooth;
    const shapes = [];
    for (let s = 0; s < np; s++) shapes.push(shp(st((K) => polyPath(S, K.pat[s], sm))));
    P.shape("pattern", [group("pattern", [...shapes, gradFill(S, st((K) => K.patGrad), { n: 12 })])], { parent: root });
  }
  P.shape("body", [group("body", [shp(st((K) => polyPath(S, K.F.hull, true))), gradFill(S, st((K) => K.bodyGrad), { n: 12 })])], { parent: root });
  // the old shadow blob: a radial gradient on the ground's circle (an ellipse: a circle in a group scaled to it)
  const shK = st((K) => K.F.shadow);
  P.shape("shadow", [group("blob", [ellipse([200, 200], [0, 0]), gfillRadialShadow()], { p: kk(shK, (e) => S.to([e.cx, e.cy])), s: kk(shK, (e) => [(e.a * S.KP * 2) / 2, (e.b * S.KP * 2) / 2]), r: kk(shK, (e) => (-e.ang * 180) / Math.PI) })], { parent: root });
  return root;
}
function gfillRadialShadow() {
  // rgba(20,14,8,.34) from 2 of 64 px out to 62 of 64 (the old canvas texture), on a circle of radius 100
  const g = { ty: "gf", o: prop(100), r: 1, bm: 0, t: 2, h: prop(0), a: prop(0), g: { p: 3, k: { a: 0, k: [0, 0.078, 0.055, 0.031, 0.031, 0.078, 0.055, 0.031, 0.969, 0.078, 0.055, 0.031, 0, SHADOW_A, 0.031, SHADOW_A, 0.969, 0] } }, s: prop([0, 0]), e: prop([100, 0]) };
  return g;
}
export let SHADOW_A = 0.34;
export const setShadowA = (a) => (SHADOW_A = a);

// the key data a view needs, from a baked view and the geometry
export function keyData(cam, cupDef, B, design, { patName, patShapes }) {
  const F = viewShapes(cam, cupDef, B, { design });
  if (B.coffeeVis && B.coffeeVis.length > 5) F.coffee = B.coffeeVis; // (the coffee as the bake saw it: the lip's own edge)
  const K = { B, F };
  // the handle's centre and two anchors that turn with it (for points that stay put between keys)
  const xf = G.cupXf({ X: cupDef.X, Y: cupDef.Y, tilt: B.tiltRad, yaw: B.yawRad });
  const H = G.HANDLE;
  K.handleC = cam.P(xf.spun([H.cx, H.cy, 0]));
  K.handleAnchor = cam.P(xf.spun([H.cx + H.R + H.r, H.cy, 0]));
  K.holeAnchor = cam.P(xf.spun([H.cx + H.R - H.r, H.cy, 0]));
  K.ring = ringEllipse(cam, xf);
  const bd = B.body;
  K.bodyGrad = bd ? { s: bd.s, e: bd.e, stops: bd.stops } : null;
  K.patGrad = B.pattern ? { s: B.pattern.s, e: B.pattern.e, stops: B.pattern.stops } : null;
  K.pat = patShapes || null;
  // up and down: black (multiply) where the ratio < 1, white (screen) where > 1, against the middle's luminance
  if (B.vert) {
    const m = B.vert.midL;
    const dark = B.vert.stops.map(([t, r]) => [t, +Math.max(0, Math.min(0.85, 1 - r)).toFixed(3)]);
    const light = B.vert.stops.map(([t, r]) => [t, +Math.max(0, Math.min(0.85, r > 1 ? (m * (r - 1)) / Math.max(0.05, 1 - m) : 0)).toFixed(3)]);
    K.vDark = { s: B.vert.s, e: B.vert.e, stops: [[0, "#120c06"], [1, "#120c06"]], alphas: dark };
    K.vLight = { s: B.vert.s, e: B.vert.e, stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: light };
  }
  // the lip and the inside, from the line along the axis: outside the opening the lip, inside it (above the coffee) the wall
  const A = B.axisLine, open = F.open;
  const along = (t) => [A.s[0] + (A.e[0] - A.s[0]) * t, A.s[1] + (A.e[1] - A.s[1]) * t];
  const lipS = [], wallS = [];
  for (const q of B.openProf) { if (!q.c) continue; (G.inEllipse(open, along(q.t), -0.01) ? wallS : lipS).push([q.t, q.c]); }
  const fallback = design.inner === "#f8f6f1" ? "#e8e5df" : design.inner;
  const norm = (arr, lo, hi) => (arr.length ? arr.map(([t, c]) => [+Math.max(0, Math.min(1, (t - lo) / (hi - lo || 1))).toFixed(3), c]) : [[0, fallback], [1, fallback]]);
  const ts = B.openProf.filter((q) => q.c).map((q) => q.t), tlo = Math.min(...ts), thi = Math.max(...ts);
  K.lipGrad = { s: along(tlo), e: along(thi), stops: thinStops(norm(lipS, tlo, thi)) };
  const ws = wallS.length ? wallS : [[0, fallback], [1, fallback]], wlo = ws[0][0], whi = ws[ws.length - 1][0];
  K.wallGrad = { s: along(wlo), e: along(whi), stops: thinStops(norm(ws, wlo, whi)) };
  // across the inside: darker on the side away from the key (an overlay against its lightest)
  const wa = B.wallAcross.prof.filter((q) => q.c);
  if (wa.length > 3) { const Lmax = Math.max(...wa.map((q) => lumHex(q.c))); K.wallSide = { s: B.wallAcross.s, e: B.wallAcross.e, stops: [[0, "#2a2018"], [1, "#2a2018"]], alphas: wa.filter((_, i) => i % 4 === 0 || i === wa.length - 1).map((q) => [q.t, +Math.min(0.5, Math.max(0, 1 - lumHex(q.c) / Lmax)).toFixed(3)]) }; }
  else K.wallSide = { s: B.wallAcross.s, e: B.wallAcross.e, stops: [[0, "#2a2018"], [1, "#2a2018"]], alphas: [[0, 0], [1, 0]] };
  // the coffee, centre to edge (across it)
  // (the crema texture is radial: dark in the middle, warm toward the edge; what is seen of it is read along the axis)
  const ce = F.coffeeE, rad = [];
  for (const q of B.cofProf) { if (!q.c) continue; const p = along(q.t), d = Math.hypot(p[0] - ce.cx, p[1] - ce.cy) / Math.max(1e-3, ce.b); rad.push([+Math.min(1, d).toFixed(3), q.c]); }
  rad.sort((x, y) => x[0] - y[0]);
  if (rad.length > 3) { const st = [[0, rad[0][1]], ...rad.filter((q) => q[0] > 0.05)]; if (st[st.length - 1][0] < 1) st.push([1, st[st.length - 1][1]]); K.cofStops = thinStops(dedupe(st), 7); }
  else K.cofStops = [[0, "#362d2a"], [0.75, "#3a2e2a"], [0.86, "#4b342c"], [0.94, "#623c2f"], [1, "#814a34"]];
  return K;
}
// a polygon grown outward by d (its own units): each point moved along its outward normal
const revPath = (p) => ({ c: p.c, v: [...p.v].reverse(), i: [...p.o].reverse(), o: [...p.i].reverse() });
// a path for an inverted mask: counter-clockwise on screen (y down), against the renderer's clockwise frame, so the
// canvas renderer's non-zero clip leaves the path's inside out (it has no subtract mode)
const ccwPath = (p) => { let A = 0; const v = p.v; for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length]; A += a[0] * b[1] - b[0] * a[1]; } return A > 0 ? revPath(p) : p; };
// points of P within near of the closed polygon H's edge moved out across it by by (along H's outward normal there)
function pushPast(P, H, near, by) {
  const cx = H.reduce((a, q) => a + q[0], 0) / H.length, cy = H.reduce((a, q) => a + q[1], 0) / H.length;
  return P.map((p) => {
    let best = Infinity, bq = null;
    for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)), q = [a[0] + dx * t, a[1] + dy * t], d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < best) { best = d; bq = q; } }
    if (best > near) return p;
    const nx = bq[0] - cx, ny = bq[1] - cy, nl = Math.hypot(nx, ny) || 1;
    return [bq[0] + (nx / nl) * by, bq[1] + (ny / nl) * by];
  });
}
function growPoly(P, d) {
  const n = P.length, A = G.area(P), sg = A > 0 ? 1 : -1;
  return P.map((p, i) => { const a = P[(i - 1 + n) % n], b = P[(i + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; return [p[0] + (sg * ty * d) / l, p[1] - (sg * tx * d) / l]; });
}
function dedupe(st) { const out = []; for (const q of st) { if (out.length && q[0] <= out[out.length - 1][0]) continue; out.push(q); } return out; }
function thinStops(st, max = 8) { if (st.length <= max) return st; const out = []; for (let k = 0; k < max; k++) out.push(st[Math.round((k * (st.length - 1)) / (max - 1))]); return out; }

// a precomp of keys (each [frame, K]); returns its asset id and size
export function cupPre(Cm, id, S, keys, opts) {
  const P = new Comp({ w: S.W, h: S.H, dur: (keys[keys.length - 1][0] + 1) / FPS, nm: id });
  P.op = keys[keys.length - 1][0] + 1;
  cupLayers(P, S, keys, { ...opts, Cm, id });
  Cm.assets.push({ id, nm: id, fr: FPS, layers: P.layers });
  return { id, w: S.W, h: S.H, frames: keys[keys.length - 1][0] };
}
// a nested loop of the pattern: K + 1 keys over one period of it (key K draws what key 0 does, one period on)
export function patternLoop(Cm, id, S, keys) {
  const P = new Comp({ w: S.W, h: S.H, dur: (keys[keys.length - 1][0] + 1) / FPS, nm: id });
  P.op = keys[keys.length - 1][0] + 1;
  const np = keys[0][1].pat.length, st = (fn) => keys.map(([t, K]) => [t, fn(K)]), sm = !!keys[0][1].patSmooth;
  const shapes = [];
  for (let s = 0; s < np; s++) shapes.push(shp(st((K) => polyPath(S, K.pat[s], sm))));
  P.shape("pattern", [group("pattern", [...shapes, gradFill(S, [[0, keys[0][1].patGrad]], {})])], {});
  Cm.assets.push({ id, nm: id, fr: FPS, layers: P.layers });
  return { id, w: S.W, h: S.H, frames: keys[keys.length - 1][0] };
}
// a precomp as a layer, with a time remap (keys [[t, seconds, ease]])
export function preLayer(C, pre, { nm, parent, ip = 0, op = C.op, ks = {}, tm, masks } = {}) {
  const v3 = (v, z) => (Array.isArray(v) && Array.isArray(v[0]) ? v.map(([t, val, e]) => [t, [...val, z].slice(0, 3), e]) : [...v, z].slice(0, 3));
  const L = { ddd: 0, ty: 0, nm, refId: pre.id, sr: 1, ks: { o: prop(ks.o ?? 100), r: prop(ks.r ?? 0), p: prop(v3(ks.p ?? [pre.w / 2, pre.h / 2], 0)), a: prop([pre.w / 2, pre.h / 2, 0]), s: prop(v3(ks.s ?? [100, 100], 100)) }, ao: 0, w: pre.w, h: pre.h, ip, op, st: 0, bm: 0 };
  if (parent) L.parent = parent.ind;
  if (masks) { L.hasMask = true; L.masksProperties = masks; }
  if (tm) L.tm = tmProp(tm);
  return C.add(L);
}
