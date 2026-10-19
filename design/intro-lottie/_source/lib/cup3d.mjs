// Cromatic opening, phase 3 · a 3D cup drawn as Lottie vectors. The geometry is the intro's own three.js cup
// (src/app.js, the kinetic stage: the lathe profiles, the ring handle, the coffee), projected here with a real
// perspective camera, and lit by the same lights (a warm key from the front left, a cool rim from the back right, a
// hemisphere, an environment). Nothing is drawn by hand: every outline, ellipse, gradient stop, highlight and shadow
// is computed from the model for the view it is seen from, so the cup turns, tilts and lands like the 3D one.
//
// A view: { pitch (deg, the cup's top tilted toward the camera, as the old tilt group), yaw (deg, the cup's own turn,
// three.js's rotation.y), dc (camera distance, cup units), yt (the height the camera looks at), U (px per cup unit at
// that distance) }. frame(view, design) -> everything a key needs; the emitters below turn a list of frames into layers.

/* ---------------------------------- the model (src/app.js) ---------------------------------- */
export const OUTER = [[0, 0.03], [1.12, 0.03], [1.2, 0], [1.3, 0.05], [1.36, 0.2], [1.39, 0.6], [1.42, 1.3], [1.44, 1.9], [1.44, 1.99]];
export const INNER = [[1.44, 1.99], [1.42, 2.05], [1.37, 2.07], [1.32, 2.03], [1.31, 1.9], [1.29, 1.3], [1.26, 0.6], [1.2, 0.3], [1.02, 0.2], [0, 0.18]];
export const HANDLE = { R: 0.5, r: 0.15, cx: 1.9, cy: 1.1 };
export const RIM = { outer: 1.44, top: 2.07, open: 1.315, openY: 2.035 };

// the designs: each surface a ramp from its shade to its light (an illustrator's porcelain: warm shade, no grey, no
// olive), the brand's yellow in the middle; the coffee is drawn apart
export const DESIGNS = {
  yellow: { outer: ["#D29300", "#FED012", "#FFE77F"], inner: ["#D9D3C7", "#F4F1EA", "#FFFFFF"], handle: ["#B87C00", "#F6C500", "#FFE37A"], lip: ["#E4DFD5", "#FAF8F3", "#FFFFFF"] },
  white: { outer: ["#CFC8BC", "#F4F1EA", "#FFFFFF"], inner: ["#1E5FAE", "#2F7FD8", "#7FB6F0"], handle: ["#1E5FAE", "#2F7FD8", "#7FB6F0"], lip: ["#E4DFD5", "#FAF8F3", "#FFFFFF"] },
  blank: { outer: ["#CFC9BF", "#F4F1EA", "#FFFFFF"], inner: ["#D9D3C7", "#F4F1EA", "#FFFFFF"], handle: ["#CFC9BF", "#F2EEE6", "#FFFFFF"], lip: ["#E4DFD5", "#FAF8F3", "#FFFFFF"] },
  green: { outer: ["#1E8F3A", "#28C840", "#8BE59C"], inner: ["#D9D3C7", "#F4F1EA", "#FFFFFF"], handle: ["#1E8F3A", "#28C840", "#8BE59C"], lip: ["#E4DFD5", "#FAF8F3", "#FFFFFF"] },
  blue: { outer: ["#0B6FBF", "#119BFE", "#7CC6FF"], inner: ["#D9D3C7", "#F4F1EA", "#FFFFFF"], handle: ["#0B6FBF", "#119BFE", "#7CC6FF"], lip: ["#E4DFD5", "#FAF8F3", "#FFFFFF"] },
  pink: { outer: ["#C9608A", "#F4A3C4", "#FFD3E4"], inner: ["#D9D3C7", "#F4F1EA", "#FFFFFF"], handle: ["#B34A78", "#E0679A", "#F7A8C8"], lip: ["#E4DFD5", "#FAF8F3", "#FFFFFF"] }
};

/* ---------------------------------- vectors ---------------------------------- */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]), norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const D2R = Math.PI / 180;

/* ---------------------------------- light (camera space, as the old scene: the camera never turned) ---------------------------------- */
export const LIGHT = {
  key: { d: norm([-6, 11, 12]), c: [1, 0.973, 0.925], i: 2.1 },
  rim: { d: norm([8, 4, -6]), c: [0.9, 0.933, 1], i: 0.8 },
  sky: [1, 1, 1], ground: [0.902, 0.875, 0.831], hemi: 0.95, exposure: 1.22
};

/* ---------------------------------- the camera ---------------------------------- */
export function makeView({ pitch = 30, yaw = 0, dc = 14, yt = 1.0, U = 100 } = {}) {
  const cp = Math.cos(pitch * D2R), sp = Math.sin(pitch * D2R), cy = Math.cos(yaw * D2R), sy = Math.sin(yaw * D2R);
  // cup space -> camera space: the turn (about the cup's axis), the look-at height, the tilt toward the camera
  const rotY = (p) => [cy * p[0] + sy * p[2], p[1], -sy * p[0] + cy * p[2]];
  const rotX = (p) => [p[0], cp * p[1] - sp * p[2], sp * p[1] + cp * p[2]];
  const toCam = (p) => rotX(sub(rotY(p), [0, yt, 0]));
  const dirCam = (n) => rotX(rotY(n));
  const tiltOnly = (p) => rotX(sub(p, [0, yt, 0])); // for things that do not turn with the cup (the coffee, the shadows)
  // inverse of the tilt (camera direction -> cup space, for the light on the ground)
  const unTilt = (d) => [d[0], cp * d[1] + sp * d[2], -sp * d[1] + cp * d[2]];
  const cam = [0, 0, dc];
  const proj = (c) => { const k = dc / (dc - c[2]); return [U * c[0] * k, -U * c[1] * k, dc - c[2]]; };
  return { pitch, yaw, dc, yt, U, toCam, dirCam, tiltOnly, unTilt, cam, proj, P: (p) => proj(toCam(p)), Pt: (p) => proj(tiltOnly(p)) };
}

/* ---------------------------------- shading ---------------------------------- */
const srgb2lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lin2srgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
export const hex2lin = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => srgb2lin(v / 255)); };
// ACES (Narkowicz), as three.js's ACESFilmic tone mapping, close enough
const aces = (x) => { x *= 0.6; return Math.max(0, Math.min(1, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14))); };
export const lin2hex = (c) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join(""); // (shade() is already sRGB)
// the room (three.js RoomEnvironment, PMREM-blurred): bright above and to the sides, darker below; a broad window up left
const envRadiance = (r) => 0.55 + 0.55 * Math.max(0, r[1]) + 0.35 * Math.pow(Math.max(0, dot(r, norm([-0.6, 0.6, 0.5]))), 6) - 0.25 * Math.max(0, -r[1]);
// shade a point: camera-space position c, normal n, a material ramp [shade, base, light] -> sRGB [0..1]
const h2s = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255); };
const RIMC = h2s("#EEF4FF");
export function shade(c, n, ramp, { cam = [0, 0, 14], shin = 40 } = {}) {
  const v = norm(sub(cam, c));
  if (dot(n, v) < 0) n = mul(n, -1);
  const L = LIGHT;
  // the light a surface gets: the key (most), the sky above it, the room all round
  const d = 0.6 * Math.max(0, dot(n, L.key.d)) + 0.12 * (0.5 + 0.5 * n[1]) + 0.33;
  const t = Math.max(0, Math.min(1, (d - 0.22) / 0.78));
  const R = ramp.map(h2s);
  const base = t < 0.62 ? mixc(R[0], R[1], t / 0.62) : mixc(R[1], R[2], (t - 0.62) / 0.38);
  // the gloss: the key's highlight, the room at grazing angles (Fresnel), the cool rim from behind on the edge
  const nv = Math.max(0, dot(n, v)), hk = norm(add(L.key.d, v));
  const spec = dot(n, L.key.d) > 0 ? Math.pow(Math.max(0, dot(n, hk)), shin) : 0;
  const fres = Math.pow(1 - nv, 4);
  const rim = Math.pow(Math.max(0, dot(n, L.rim.d)), 1.5) * Math.pow(1 - nv, 0.8);
  let col = screen(base, [1, 1, 1], Math.min(0.85, 0.7 * spec + 0.22 * fres));
  col = screen(col, RIMC, Math.min(0.6, 0.55 * rim));
  return col;
}
// the same light as shade(), as amounts: t (0 shade .. 0.62 base .. 1 light), white (gloss), rim (the cool edge): so a
// glaze can be painted as a flat colour with overlays over it, and change colour by keying three colours only
export function terms(c, n, { cam = [0, 0, 14], shin = 40 } = {}) {
  const v = norm(sub(cam, c));
  if (dot(n, v) < 0) n = mul(n, -1);
  const L = LIGHT;
  const d = 0.6 * Math.max(0, dot(n, L.key.d)) + 0.12 * (0.5 + 0.5 * n[1]) + 0.33;
  const t = Math.max(0, Math.min(1, (d - 0.22) / 0.78));
  const nv = Math.max(0, dot(n, v)), hk = norm(add(L.key.d, v));
  const spec = dot(n, L.key.d) > 0 ? Math.pow(Math.max(0, dot(n, hk)), shin) : 0;
  return { t, white: Math.min(0.85, 0.7 * spec + 0.22 * Math.pow(1 - nv, 4)), rim: Math.min(0.6, 0.55 * Math.pow(Math.max(0, dot(n, L.rim.d)), 1.5) * Math.pow(1 - nv, 0.8)) };
}
const mixc = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t);
const screen = (a, b, k) => [0, 1, 2].map((i) => a[i] + (1 - a[i]) * b[i] * k);
// the specular alone (for the highlight shapes): 0..1
export function specOnly(c, n, { cam = [0, 0, 14], shin = 70 } = {}) {
  const v = norm(sub(cam, c));
  if (dot(n, v) < 0) return 0;
  const hk = norm(add(LIGHT.key.d, v));
  return dot(n, LIGHT.key.d) > 0 ? Math.pow(Math.max(0, dot(n, hk)), shin) : 0;
}

/* ---------------------------------- the profile, smooth ---------------------------------- */
// Catmull-Rom through the lathe points; returns [{r, y, nr, ny}] (outward normal in the profile plane)
function smoothProfile(pts, per = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out.map((p, i) => {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)];
    const tr = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tr, ty) || 1;
    return { r: p[0], y: p[1], nr: ty / l, ny: -tr / l }; // the outer profile goes up: (tr, ty) rotated -90 deg points out
  });
}
const OUT_S = smoothProfile(OUTER.slice(1), 6); // from the foot's edge up
const IN_S = smoothProfile(INNER, 6);
export const innerRadiusAt = (y) => { const pr = INNER.slice(3, 8); for (let i = 0; i < pr.length - 1; i++) { const [r0, y0] = pr[i], [r1, y1] = pr[i + 1]; if (y <= y0 && y >= y1) return r0 + ((r1 - r0) * (y0 - y)) / (y0 - y1); } return 1.26; };
const ringPt = (r, y, th) => [r * Math.cos(th), y, -r * Math.sin(th)]; // th: the cup's own angle (the handle at 0)

/* ---------------------------------- 2D helpers ---------------------------------- */
function hull(points) {
  const p = points.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  up.pop(); lo.pop();
  return lo.concat(up);
}
// a closed polygon resampled to n points by arc length, from the point nearest the given direction from its centre
export function resample(poly, n, startDir = [0, -1]) {
  const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length, cy = poly.reduce((s, q) => s + q[1], 0) / poly.length;
  let s0 = 0, best = -Infinity;
  poly.forEach((q, i) => { const d = (q[0] - cx) * startDir[0] + (q[1] - cy) * startDir[1]; if (d > best) { best = d; s0 = i; } });
  const P = poly.slice(s0).concat(poly.slice(0, s0)); P.push(P[0]);
  const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const tot = L[L.length - 1] || 1, out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (k / n) * tot;
    while (j < L.length - 2 && L[j + 1] < s) j++;
    const u = (s - L[j]) / (L[j + 1] - L[j] || 1);
    out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * u, P[j][1] + (P[j + 1][1] - P[j][1]) * u]);
  }
  return out;
}
// a smooth closed bezier through the points (Catmull-Rom tangents), as a Lottie path
export function smoothPath(pts, k = 1 / 6) {
  const n = pts.length, v = [], i = [], o = [];
  for (let a = 0; a < n; a++) {
    const p0 = pts[(a - 1 + n) % n], p2 = pts[(a + 1) % n];
    const t = [(p2[0] - p0[0]) * k, (p2[1] - p0[1]) * k];
    v.push(r1(pts[a])); o.push(r1(t)); i.push(r1([-t[0], -t[1]]));
  }
  return { c: true, v, i, o };
}
const r1 = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];

// a projected circle (radius r at height y of the cup, about its axis): an exact ellipse (a conic) under perspective.
// Returns centre, semi-axes (a horizontal, b vertical: the camera has no roll, so the axes are the screen's), and a
// 4-point path that starts at the top (as Lottie's ellipse); turnable: false for things that do not turn with the cup
export function circleEllipse(V, r, y, { turns = false } = {}) {
  const P = turns ? V.P : V.Pt;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const pts = [];
  for (let k = 0; k < 180; k++) { const th = (k / 180) * Math.PI * 2; const q = P(ringPt(r, y, th)); pts.push(q); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, a: (x1 - x0) / 2, b: Math.max(0.01, (y1 - y0) / 2), pts };
}
export const ellipsePath = (e, grow = 0) => { const a = e.a + grow, b = e.b + grow, k = 0.5523; return { c: true, v: [r1([e.cx, e.cy - b]), r1([e.cx + a, e.cy]), r1([e.cx, e.cy + b]), r1([e.cx - a, e.cy])], i: [r1([-a * k, 0]), r1([0, -b * k]), r1([a * k, 0]), r1([0, b * k])], o: [r1([a * k, 0]), r1([0, b * k]), r1([-a * k, 0]), r1([0, -b * k])] }; };

/* ---------------------------------- one view of the cup ---------------------------------- */
// the Multiverse ring's colours (the button's conic gradient), and a colour at u (0..1 round the cup)
export const RAINBOW = ["#FED012", "#28C840", "#119BFE", "#B098C8", "#F65342", "#FED012"];
const rainbowAt = (u) => { u = ((u % 1) + 1) % 1; const n = RAINBOW.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x)), f = x - i; const a = h2s(RAINBOW[i]), b = h2s(RAINBOW[i + 1]); return lin2hex(mixc(a, b, f)); };
export function frame(view, design = DESIGNS.yellow, { liquid = 1.62, N = 32, band = null } = {}) {
  const V = makeView(view), cam = V.cam;
  const A = { outer: design.outer, inner: design.inner, handle: design.handle, lip: design.lip };
  const F = { view, design };

  /* the body: its outline is the convex hull of the projected outer surface and the lip (the cup without its handle is convex) */
  const samples = [];
  // (sampled at the same angles relative to the camera whatever the cup's turn: the same view gives the same outline)
  const y0 = -((view.yaw || 0) * Math.PI) / 180;
  for (const q of OUT_S) for (let k = 0; k < 96; k++) samples.push(V.P(ringPt(q.r, q.y, y0 + (k / 96) * Math.PI * 2)));
  for (const [r, y] of INNER.slice(0, 4)) for (let k = 0; k < 96; k++) samples.push(V.P(ringPt(r, y, y0 + (k / 96) * Math.PI * 2)));
  const H = hull(samples);
  F.hull = smoothPath(resample(H, N, [0, -1]));
  F.hullPts = H;
  F.bbox = [Math.min(...H.map((q) => q[0])), Math.min(...H.map((q) => q[1])), Math.max(...H.map((q) => q[0])), Math.max(...H.map((q) => q[1]))];

  /* the body's light: across (the base gradient, sampled along the visible arc at mid height), and up and down */
  const surfAt = (q, th) => { const p = ringPt(q.r, q.y, th), n = [q.nr * Math.cos(th), q.ny, -q.nr * Math.sin(th)]; return { c: V.toCam(p), n: V.dirCam(n) }; };
  const facing = (q, th) => { const s = surfAt(q, th); return dot(s.n, sub(cam, s.c)); };
  const qMid = OUT_S.reduce((b, q) => (Math.abs(q.y - 1.0) < Math.abs(b.y - 1.0) ? q : b), OUT_S[0]);
  // the visible arc at mid height: the angles whose surface faces the camera, around the one nearest it
  const ths = Array.from({ length: 720 }, (_, k) => (k / 720) * Math.PI * 2);
  let thFront = 0, bestZ = -Infinity;
  for (const th of ths) { const z = V.toCam(ringPt(qMid.r, qMid.y, th))[2]; if (z > bestZ) { bestZ = z; thFront = th; } }
  const edge = (dir) => { let th = thFront; for (let k = 0; k < 360; k++) { const nt = th + dir * (Math.PI / 360); if (facing(qMid, nt) <= 0) break; th = nt; } return th; };
  let thL = edge(-1), thR = edge(1); // (which side is left on screen is found below)
  // seen from nearly above the wall barely faces the camera: light it across its half that faces it most
  if (thR - thL < Math.PI * 0.5) { thL = thFront - Math.PI * 0.48; thR = thFront + Math.PI * 0.48; }
  const across = [];
  const NS = 9;
  for (let k = 0; k < NS; k++) {
    const u = k / (NS - 1), th = thL + (thR - thL) * (0.5 - 0.5 * Math.cos(Math.PI * u)); // denser at the edges
    const s = surfAt(qMid, th), pj = V.proj(s.c);
    across.push({ x: pj[0], y: pj[1], col: shade(s.c, s.n, A.outer, { cam }), tm: terms(s.c, s.n, { cam }) });
  }
  across.sort((a, b) => a.x - b.x);
  const xa = across[0].x, xb = across[across.length - 1].x;
  const span = Math.max(1, xb - xa);
  F.base = { s: [xa, across[0].y], e: [xa + span, across[0].y], stops: across.map((p, i) => [+Math.min(1, Math.max(0, (p.x - xa) / span)).toFixed(3), lin2hex(p.col)]) };
  for (let i = 1; i < F.base.stops.length; i++) if (F.base.stops[i][0] < F.base.stops[i - 1][0]) F.base.stops[i][0] = F.base.stops[i - 1][0];
  // the glaze as overlays (see terms()): positions as the base gradient's, amounts per stop
  const pos = F.base.stops.map((q) => q[0]), r3 = (v) => +Math.max(0, Math.min(1, v)).toFixed(3);
  F.glaze = { s: F.base.s, e: F.base.e, pos,
    shade: across.map((p) => r3(p.tm.t < 0.62 ? 1 - p.tm.t / 0.62 : 0)), light: across.map((p) => r3(p.tm.t > 0.62 ? (p.tm.t - 0.62) / 0.38 : 0)),
    white: across.map((p) => r3(p.tm.white)), rim: across.map((p) => r3(p.tm.rim)) };
  // a printed band round the cup (the Multiverse ring's colours): its outline on the front, and its colours across,
  // which slide round as the cup turns (band: { y0, y1 } in cup units)
  if (band) {
    const top = [], bot = [], cols = [];
    const qAt = (y) => OUT_S.reduce((b2, q) => (Math.abs(q.y - y) < Math.abs(b2.y - y) ? q : b2), OUT_S[0]);
    const q0 = qAt(band.y0), q1 = qAt(band.y1);
    for (let k = 0; k <= 16; k++) {
      const th = thL + ((thR - thL) * k) / 16;
      top.push(V.proj(V.toCam(ringPt(q1.r + 0.002, band.y1, th)))); bot.push(V.proj(V.toCam(ringPt(q0.r + 0.002, band.y0, th))));
    }
    F.band = smoothPath(resample(top.concat(bot.reverse()).map((q) => [q[0], q[1]]), 20, [0, -1]));
    // its colours across: the cup's own angle at each sampled point (the cup turns: yaw moves them)
    const bandStops = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8, th = thL + (thR - thL) * (0.5 - 0.5 * Math.cos(Math.PI * u));
      const pj = V.proj(V.toCam(ringPt(qMid.r, 1.0, th)));
      bandStops.push([pj[0], rainbowAt(th / (2 * Math.PI))]);
    }
    bandStops.sort((a2, b2) => a2[0] - b2[0]);
    F.bandGrad = { s: F.base.s, e: F.base.e, stops: bandStops.map(([x, c]) => [+Math.min(1, Math.max(0, (x - F.base.s[0]) / (F.base.e[0] - F.base.s[0] || 1))).toFixed(3), c]) };
    for (let i = 1; i < F.bandGrad.stops.length; i++) if (F.bandGrad.stops[i][0] < F.bandGrad.stops[i - 1][0]) F.bandGrad.stops[i][0] = F.bandGrad.stops[i - 1][0];
  }
  // up and down the front: how much darker or lighter than the middle (the foot curls under, the lip rounds over)
  const midCol = shade(surfAt(qMid, thFront).c, surfAt(qMid, thFront).n, A.outer, { cam });
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const vert = OUT_S.filter((q, i) => i % 2 === 0 || i === OUT_S.length - 1).map((q) => { const s = surfAt(q, thFront), pj = V.proj(s.c); return { y: pj[1], ratio: lum(shade(s.c, s.n, A.outer, { cam })) / lum(midCol), h: q.y }; });
  vert.sort((a, b) => a.y - b.y);
  // eight stops are plenty (evenly by height on screen)
  if (vert.length > 8) { const v8 = []; for (let k = 0; k < 8; k++) v8.push(vert[Math.round((k * (vert.length - 1)) / 7)]); vert.length = 0; vert.push(...v8); }
  const ya = vert[0].y, yb = vert[vert.length - 1].y;
  // the contact: the last few hundredths above the paper get the ambient occlusion of the ground
  const ao = (h) => 0.28 * Math.exp(-h / 0.12);
  F.vDark = { s: [0, ya], e: [0, yb], stops: [[0, "#1a1208"], [1, "#1a1208"]], alphas: vert.map((p) => [+((p.y - ya) / (yb - ya || 1)).toFixed(3), +Math.min(0.8, Math.max(0, 1 - p.ratio) * 0.9 + ao(p.h)).toFixed(3)]) };
  F.vLight = { s: [0, ya], e: [0, yb], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: vert.map((p) => [+((p.y - ya) / (yb - ya || 1)).toFixed(3), +Math.min(0.6, Math.max(0, p.ratio - 1) * 0.6).toFixed(3)]) };

  /* the highlights on the porcelain: the key's specular, a contour of it, at two strengths */
  const GT = 64, GY = OUT_S.length;
  const grid = [];
  // the gloss a cylinder shows: the key's lobe, soft (a high light seldom glints off a near-vertical wall), and the room's
  // bright window up left, reflected; contoured relative to their strongest, kept as strong as they are
  const WIN = norm([-0.55, 0.55, 0.62]);
  let gmax = 0;
  for (let j = 0; j < GY; j++) { const row = []; for (let k = 0; k < GT; k++) { const th = thL + ((thR - thL) * k) / (GT - 1); const s = surfAt(OUT_S[j], th); const v = norm(sub(cam, s.c)), r = sub(mul(s.n, 2 * dot(s.n, v)), v); const val = Math.max(specOnly(s.c, s.n, { cam, shin: 26 }), 0.75 * Math.pow(Math.max(0, dot(r, WIN)), 10)); row.push(val); gmax = Math.max(gmax, val); } grid.push(row); }
  for (const row of grid) for (let k = 0; k < row.length; k++) row[k] /= gmax || 1;
  F.specK = gmax;
  const toScreen = (gx, gy) => { const j = Math.max(0, Math.min(GY - 1, gy)), j0 = Math.floor(j), j1 = Math.min(GY - 1, j0 + 1), f = j - j0; const q = { r: OUT_S[j0].r * (1 - f) + OUT_S[j1].r * f, y: OUT_S[j0].y * (1 - f) + OUT_S[j1].y * f, nr: 1, ny: 0 }; const th = thL + ((thR - thL) * gx) / (GT - 1); return V.proj(V.toCam(ringPt(q.r, q.y, th))); };
  F.spec = [0.5, 0.8].map((lvl) => { const c = biggestContour(grid, lvl); return c ? smoothPath(resample(c.map(([gx, gy]) => toScreen(gx, gy)), 12, [0, -1])) : null; });

  /* the rim light: a thin bright band along the far edge from the back-right light (sampled where the rim term is strong) */
  /* (it is in the base gradient's last stops already; nothing more here) */

  /* the handle: its ring centre-line projects to an ellipse; the tube is a stroke of the tube's width around it */
  const ringC = (t) => [HANDLE.cx + HANDLE.R * Math.cos(t), HANDLE.cy + HANDLE.R * Math.sin(t), 0];
  const hp = [];
  for (let k = 0; k < 72; k++) { const t = (k / 72) * Math.PI * 2; hp.push(V.P(ringC(t))); }
  const he = fitEllipse(hp);
  const hcCam = V.toCam([HANDLE.cx, HANDLE.cy, 0]), axisCam = V.toCam([0, HANDLE.cy, 0]);
  const front = hcCam[2] > axisCam[2];
  const depth = V.proj(hcCam)[2];
  F.handle = { ...he, w: 2 * HANDLE.r * V.U * (V.dc / depth), front };
  // where on that ellipse (as a fraction of Lottie's ellipse path, from its top, clockwise) the ring's points fall
  const fracOf = (pt) => ellipseFrac(he, pt);
  // the part of the ring inside the body (hidden in the front copy): its inner arc, radius under the body's
  const bodyR = 1.42;
  const inside = []; for (let k = 0; k < 360; k++) { const t = (k / 360) * Math.PI * 2; if (HANDLE.cx + HANDLE.R * Math.cos(t) < bodyR + 0.02) inside.push(t); }
  const tIn0 = Math.min(...inside), tIn1 = Math.max(...inside); // the inner arc, around t = pi
  F.handle.hidePts = [V.P(ringC(tIn0)), V.P(ringC(tIn1))];
  F.handle.hide = [fracOf(F.handle.hidePts[0]), fracOf(F.handle.hidePts[1])];
  // the light on the tube: the screen direction toward the key, and the arcs where the ring's tangent is square to it
  const kS = V.proj(add(hcCam, mul(LIGHT.key.d, 0.5))), hS = V.proj(hcCam);
  const ld = [kS[0] - hS[0], kS[1] - hS[1]], ll = Math.hypot(ld[0], ld[1]) || 1;
  F.handle.ld = [ld[0] / ll, ld[1] / ll];
  const tubeLit = []; const tubeCol = [];
  for (let k = 0; k < 72; k++) {
    const t = (k / 72) * Math.PI * 2, Tg = norm(V.dirCam([-Math.sin(t), Math.cos(t), 0])), c = V.toCam(ringC(t));
    const h = norm(add(LIGHT.key.d, norm(sub(cam, c))));
    tubeLit.push(Math.pow(Math.sqrt(Math.max(0, 1 - dot(h, Tg) ** 2)), 40));
    // the tube's colour on its lit side and its dark side: the normal toward the camera turned toward the key, or away
    const vv = norm(sub(cam, c)), nV = norm(sub(vv, mul(Tg, dot(vv, Tg)))), lp = sub(LIGHT.key.d, mul(Tg, dot(LIGHT.key.d, Tg))), lpp = norm(sub(lp, mul(nV, dot(lp, nV))));
    tubeCol.push([shade(c, norm(add(nV, mul(lpp, 0.9))), A.handle, { cam }), shade(c, norm(sub(nV, mul(lpp, 0.9))), A.handle, { cam })]);
  }
  const avg = (arr, i) => [0, 1, 2].map((ch) => arr.reduce((s, x) => s + x[i][ch], 0) / arr.length);
  F.handle.lit = lin2hex(avg(tubeCol, 0)); F.handle.dark = lin2hex(avg(tubeCol, 1));
  // the highlight arcs (two windows at most), as fractions of the ellipse path
  F.handle.hlPts = arcs(tubeLit, 0.55).slice(0, 1).map(([k0, k1]) => [V.P(ringC((k0 / 72) * Math.PI * 2)), V.P(ringC((k1 / 72) * Math.PI * 2))]);

  /* the opening, the lip, the inside, the coffee */
  const lipOuter = circleEllipse(V, RIM.outer, 2.0), opening = circleEllipse(V, RIM.open, RIM.openY), lipTop = circleEllipse(V, 1.38, RIM.top);
  F.lipOuter = lipOuter; F.opening = opening;
  // the lip: lit from the front left (its far side catches the key), as a gradient across it
  const lipCols = [];
  for (let k = 0; k <= 8; k++) { const th = (k / 8) * Math.PI * 2; const p = ringPt(1.38, 2.06, th), n = norm([0.35 * Math.cos(th), 1, -0.35 * Math.sin(th)]); const c = V.toCam(p); lipCols.push({ x: V.proj(c)[0], y: V.proj(c)[1], col: shade(c, V.dirCam(n), A.lip, { cam }) }); }
  F.lip = { s: [lipOuter.cx - lipOuter.a, lipOuter.cy - lipOuter.b], e: [lipOuter.cx + lipOuter.a, lipOuter.cy + lipOuter.b], stops: [[0, lin2hex(lipCols[3].col)], [0.5, lin2hex(lipCols[0].col)], [1, lin2hex(lipCols[6].col)]] };
  F.lipHl = arcsOnEllipse(lipTop, (th) => { const p = ringPt(1.38, 2.07, th), n = [0.25 * Math.cos(th), 1, -0.25 * Math.sin(th)]; return specOnly(V.toCam(p), norm(V.dirCam(n)), { cam, shin: 50 }); }, V, 1.38, 2.07);
  // the inside: the far wall from the lip down to the coffee, darker as it goes down; lighter on the side the key reaches
  const ry = innerRadiusAt(liquid);
  const coffee = circleEllipse(V, ry - 0.004, liquid);
  F.coffee = coffee;
  const wallAt = (th, y) => { const r = innerRadiusAt(y), p = ringPt(r, y, th), n = [-Math.cos(th), 0.05, Math.sin(th)]; const c = V.toCam(p); return { c, n: V.dirCam(norm(n)), pj: V.proj(c) }; };
  // the far wall's line straight behind the axis
  let thBack = 0, bz = Infinity; for (const th of ths) { const z = V.toCam(ringPt(1.3, 1.8, th))[2]; if (z < bz) { bz = z; thBack = th; } }
  const wallV = [];
  for (let k = 0; k <= 4; k++) { const y = RIM.openY - 0.01 - ((RIM.openY - 0.01 - liquid) * k) / 4; const w = wallAt(thBack, y); wallV.push({ y: w.pj[1], col: shade(w.c, w.n, A.inner, { cam }), depth: k / 4 }); }
  const wy0 = Math.min(...wallV.map((p) => p.y)), wy1 = Math.max(...wallV.map((p) => p.y));
  F.wall = { s: [opening.cx, wy0], e: [opening.cx, Math.max(wy1, wy0 + 1)], stops: wallV.map((p) => [+((p.y - wy0) / (wy1 - wy0 || 1)).toFixed(3), lin2hex(p.col.map((v) => v * (1 - 0.12 * p.depth)))]) };
  // across the inside: the side facing the key is lit, the other in the lip's shade
  const wallH = [];
  for (let k = 0; k <= 5; k++) { const th = thBack - Math.PI / 2 + (Math.PI * k) / 5; const w = wallAt(th, (RIM.openY + liquid) / 2); wallH.push({ x: w.pj[0], l: lum(shade(w.c, w.n, A.inner, { cam })) }); }
  wallH.sort((a, b) => a.x - b.x);
  const lmax = Math.max(...wallH.map((p) => p.l)), wx0 = wallH[0].x, wx1 = wallH[wallH.length - 1].x;
  F.wallSide = { s: [wx0, opening.cy], e: [wx1, opening.cy], stops: [[0, "#6b5a45"], [1, "#6b5a45"]], alphas: wallH.map((p) => [+((p.x - wx0) / (wx1 - wx0 || 1)).toFixed(3), +Math.min(0.22, (1 - p.l / lmax) * 0.35).toFixed(3)]) };
  // the lip's shadow on the coffee: the opening seen from the key, dropped onto the coffee's plane
  // the key in cup space (the cup is tilted, the light is not); seen from above it is taken higher (a short shadow on
  // the paper, as the paper's own light gives the pills)
  const Lc0 = norm(V.unTilt(LIGHT.key.d)), hi = Math.pow(Math.max(0, view.pitch) / 90, 2);
  const Lc = norm([Lc0[0], Lc0[1] + 1.1 * hi, Lc0[2]]);
  const drop = (RIM.openY - liquid) / Math.max(0.15, Lc[1]);
  const lit = [];
  for (let k = 0; k < 96; k++) { const th = (k / 96) * Math.PI * 2; const p = ringPt(RIM.open, liquid, th); lit.push([p[0] - Lc[0] * drop, p[2] - Lc[2] * drop]); }
  F.crescent = crescent(lit, ry, liquid, V);
  // the key's glint on the coffee: where the mirror of the view meets the key (kept inside the cup)
  let gl = null, gbest = -1;
  for (let a = 0; a < 24; a++) for (let rr = 0; rr <= 6; rr++) {
    const th = (a / 24) * Math.PI * 2, rad = (ry * 0.85 * rr) / 6, p = [rad * Math.cos(th), liquid, -rad * Math.sin(th)];
    const c = V.tiltOnly(p), v = norm(sub(cam, c)), n = V.dirCam([0, 1, 0]);
    const r = sub(mul(n, 2 * dot(n, v)), v), s = dot(r, LIGHT.key.d);
    if (s > gbest) { gbest = s; gl = V.proj(c); }
  }
  F.glint = { p: [gl[0], gl[1]], k: Math.max(0, gbest) };

  /* shadows on the ground (the cup's own plane, y = 0): the contact, and the key's cast shadow */
  F.contact = circleEllipse(V, 1.32, 0.0);
  const g = [];
  const shadowOf = (p) => [p[0] - (Lc[0] * p[1]) / Math.max(0.2, Lc[1]), 0, p[2] - (Lc[2] * p[1]) / Math.max(0.2, Lc[1])];
  // the body's (it does not turn: the same for every turn of the cup), and the handle's, a small ring of its own
  for (const q of OUT_S.filter((_, i) => i % 3 === 0)) for (let k = 0; k < 48; k++) g.push(V.Pt(shadowOf(ringPt(q.r, q.y, (k / 48) * Math.PI * 2))));
  const gh = hull(g);
  F.cast = smoothPath(resample(gh, 24, [0, -1]));
  F.castC = [gh.reduce((s, q) => s + q[0], 0) / gh.length, gh.reduce((s, q) => s + q[1], 0) / gh.length].map((v) => Math.round(v * 10) / 10);
  const cyw = Math.cos((view.yaw || 0) * D2R), syw = Math.sin((view.yaw || 0) * D2R);
  const hsh = []; for (let k = 0; k < 24; k++) { const t = (k / 24) * Math.PI * 2, p = ringC(t); hsh.push(V.Pt(shadowOf([cyw * p[0], p[1], -syw * p[0]]))); }
  F.handleShadow = fitEllipse(hsh);
  return F;
}

/* ---------------------------------- helpers for frame() ---------------------------------- */
// marching squares on a grid of values, the longest closed contour at the level (grid coordinates)
function biggestContour(G, lvl) {
  const H = G.length, W = G[0].length;
  const pad = (j, k) => (j < 0 || k < 0 || j >= H || k >= W ? 0 : G[j][k]);
  const segs = [];
  const ip = (a, b) => (lvl - a) / (b - a || 1e-9);
  for (let j = -1; j < H; j++) for (let k = -1; k < W; k++) {
    const a = pad(j, k), b = pad(j, k + 1), c = pad(j + 1, k + 1), d = pad(j + 1, k);
    const idx = (a > lvl ? 8 : 0) | (b > lvl ? 4 : 0) | (c > lvl ? 2 : 0) | (d > lvl ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const top = [k + ip(a, b), j], right = [k + 1, j + ip(b, c)], bot = [k + ip(d, c), j + 1], left = [k, j + ip(a, d)];
    const L = { 1: [[left, bot]], 2: [[bot, right]], 3: [[left, right]], 4: [[top, right]], 5: [[left, top], [bot, right]], 6: [[top, bot]], 7: [[left, top]], 8: [[left, top]], 9: [[top, bot]], 10: [[left, bot], [top, right]], 11: [[top, right]], 12: [[left, right]], 13: [[bot, right]], 14: [[left, bot]] }[idx];
    for (const s of L) segs.push(s);
  }
  // chain the segments
  const key = (p) => p[0].toFixed(4) + "," + p[1].toFixed(4);
  const map = new Map();
  segs.forEach((s, i) => { for (const e of [0, 1]) { const kk = key(s[e]); if (!map.has(kk)) map.set(kk, []); map.get(kk).push([i, e]); } });
  const used = new Set(); let best = null;
  for (let i = 0; i < segs.length; i++) {
    if (used.has(i)) continue;
    const chain = [segs[i][0], segs[i][1]]; used.add(i);
    let cur = segs[i][1];
    for (let guard = 0; guard < 10000; guard++) {
      const nx = (map.get(key(cur)) || []).find(([si]) => !used.has(si));
      if (!nx) break;
      used.add(nx[0]); cur = segs[nx[0]][1 - nx[1]]; chain.push(cur);
    }
    if (!best || chain.length > best.length) best = chain;
  }
  return best && best.length > 4 ? best : null;
}
// an ellipse through projected points: centre, axes and the rotation of its major axis (degrees)
function fitEllipse(pts) {
  const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) { const x = p[0] - cx, y = p[1] - cy; sxx += x * x; syy += y * y; sxy += x * y; }
  sxx /= n; syy /= n; sxy /= n;
  const tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(Math.max(0, (tr * tr) / 4 - det)), l2 = tr / 2 - Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const ang = Math.atan2(l1 - sxx, sxy || 1e-9);
  // the points are spread by the ring's parameter, not by arc length: for a circle seen at an angle the second moments
  // of evenly spaced parameter samples are exactly a^2/2 and b^2/2 (perspective shifts the centre a hair, kept)
  let a = Math.sqrt(2 * l1), b = Math.sqrt(2 * Math.max(0, l2));
  // the true extent along the axes (perspective makes the near half larger): measure it
  const ux = Math.cos(ang), uy = Math.sin(ang);
  let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity;
  for (const p of pts) { const x = (p[0] - cx) * ux + (p[1] - cy) * uy, y = -(p[0] - cx) * uy + (p[1] - cy) * ux; p0 = Math.min(p0, x); p1 = Math.max(p1, x); q0 = Math.min(q0, y); q1 = Math.max(q1, y); }
  const ccx = cx + ((p0 + p1) / 2) * ux - ((q0 + q1) / 2) * uy, ccy = cy + ((p0 + p1) / 2) * uy + ((q0 + q1) / 2) * ux;
  a = (p1 - p0) / 2; b = Math.max(0.02, (q1 - q0) / 2);
  return { cx: ccx, cy: ccy, a, b, rot: (ang * 180) / Math.PI };
}
// where a point falls on Lottie's ellipse path (from the top of the ellipse in its own frame, clockwise), by arc length
export function ellipseFrac(e, pt) {
  const r = (-e.rot * Math.PI) / 180, x = pt[0] - e.cx, y = pt[1] - e.cy;
  const lx = x * Math.cos(r) - y * Math.sin(r), ly = x * Math.sin(r) + y * Math.cos(r);
  // the parameter angle of the nearest point (from the top, clockwise in screen space: x right, y down)
  const t = Math.atan2(lx / e.a, -ly / e.b); // 0 at the top, increasing clockwise
  const tt = (t + 2 * Math.PI) % (2 * Math.PI);
  return arcFrac(e.a, e.b, tt);
}
function arcFrac(a, b, t) {
  const N = 256; let tot = 0, at = 0, prev = [0, -b];
  for (let k = 1; k <= N; k++) { const u = (k / N) * Math.PI * 2, p = [a * Math.sin(u), -b * Math.cos(u)], d = Math.hypot(p[0] - prev[0], p[1] - prev[1]); tot += d; if (u <= t) at += d; prev = p; }
  return at / (tot || 1);
}
// runs of an array (circular) above a threshold: [[k0, k1]]
function arcs(vals, th) {
  const n = vals.length, out = [];
  let k = 0; while (k < n && vals[k] > th) k++; // start outside a run
  if (k === n) return [[0, n - 1]];
  for (let i = 0; i < n; i++) {
    const a = (k + i) % n;
    if (vals[a] > th && vals[(a - 1 + n) % n] <= th) { let b = a; while (vals[(b + 1) % n] > th && b - a < n) b++; out.push([a, b % n, b - a]); }
  }
  return out.sort((x, y) => y[2] - x[2]).map(([a, b]) => [a, b]);
}
// the arcs of a projected circle where a value is high, as fractions of the Lottie ellipse path of that circle
function arcsOnEllipse(e, f, V, r, y) {
  const vals = []; for (let k = 0; k < 72; k++) vals.push(f((k / 72) * Math.PI * 2));
  const ee = { ...e, rot: 0 };
  return arcs(vals, 0.35).slice(0, 1).map(([k0, k1]) => [ellipseFrac(ee, V.Pt(ringPt(r, y, (k0 / 72) * Math.PI * 2))), ellipseFrac(ee, V.Pt(ringPt(r, y, (k1 / 72) * Math.PI * 2)))]);
}
// the coffee outside the lip's shadow-free disc: a crescent, as a closed polygon on the coffee's plane, projected
function crescent(litPts, ry, liquid, V) {
  // the lit disc on the coffee plane is the opening dropped along the light: a circle of radius RIM.open at the offset
  const ox = litPts.reduce((s, p) => s + p[0], 0) / litPts.length, oz = litPts.reduce((s, p) => s + p[1], 0) / litPts.length;
  const R = RIM.open, pts = [];
  const insideLit = (x, z) => Math.hypot(x - ox, z - oz) < R;
  // walk the coffee's edge where it is in shadow, then back along the lit circle's edge inside the coffee
  const edgeIn = [], edgeLit = [];
  for (let k = 0; k < 180; k++) { const th = (k / 180) * Math.PI * 2, x = ry * Math.cos(th), z = -ry * Math.sin(th); edgeIn.push([x, z, !insideLit(x, z)]); }
  for (let k = 0; k < 180; k++) { const th = (k / 180) * Math.PI * 2, x = ox + R * Math.cos(th), z = oz - R * Math.sin(th); edgeLit.push([x, z, Math.hypot(x, z) < ry]); }
  const run = (arr) => { const n = arr.length; let s = arr.findIndex((p, i) => p[2] && !arr[(i - 1 + n) % n][2]); if (s < 0) return arr.every((p) => p[2]) ? arr : []; const out = []; for (let i = 0; i < n; i++) { const p = arr[(s + i) % n]; if (!p[2]) break; out.push(p); } return out; };
  const a = run(edgeIn), b = run(edgeLit);
  if (a.length < 3) return null;
  // the lit circle's edge inside the coffee, joined from a's end back to a's start (whichever way round meets it)
  const end = a[a.length - 1], d0 = b.length ? Math.hypot(b[0][0] - end[0], b[0][1] - end[1]) : 0, d1 = b.length ? Math.hypot(b[b.length - 1][0] - end[0], b[b.length - 1][1] - end[1]) : 0;
  const bb = !b.length ? [] : d0 <= d1 ? b : b.slice().reverse();
  const poly = a.concat(bb).map(([x, z]) => V.Pt([x, liquid, z]));
  return smoothPath(resample(poly, 14, [-1, 1]), 1 / 6);
}
