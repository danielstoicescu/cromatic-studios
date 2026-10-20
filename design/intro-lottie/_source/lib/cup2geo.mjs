// Nine cups v2 · the geometry of the ORIGINAL intro cup (src/app.js at 13e8689, createKinetic: the lathe profiles, the
// ring handle, the coffee disc, the canvas patterns and LatheGeometry's own UV mapping) and of the old wall's camera
// (a PerspectiveCamera, FOV 30, on the z axis), in exactly three.js's conventions, so what is computed here lands on
// the pixels the bake renders with three r169 (tools/bakecups2.mjs). Wall units: the z = 0 plane, the camera at
// (0, ycam, Zc) looking down -z; a screen point is given in wall units on that plane (multiply by k px per unit).

export const OUTER = [[0, 0.03], [1.12, 0.03], [1.2, 0], [1.3, 0.05], [1.36, 0.2], [1.39, 0.6], [1.42, 1.3], [1.44, 1.9], [1.44, 1.99]];
export const INNER = [[1.44, 1.99], [1.42, 2.05], [1.37, 2.07], [1.32, 2.03], [1.31, 1.9], [1.29, 1.3], [1.26, 0.6], [1.2, 0.3], [1.02, 0.2], [0, 0.18]];
// the ring handle: TorusGeometry(0.5, 0.15) at (1.9, 1.1), in v2 0.05 further out (the original's ring poked through
// the inner wall: a speck of the handle's colour at the coffee's edge)
export const HANDLE = { R: 0.5, r: 0.15, cx: 1.95, cy: 1.1 };
export const LIQ = { y: 1.18, r: 1.265 };
export const SEG = 72; // LatheGeometry segments

const D2R = Math.PI / 180;

/* ------------------------------ the transforms (three.js order) ------------------------------ */
// a cup: G at (X, Y, Z), its tilt group rotation.x = tilt (radians), its spinner rotation.y = yaw (radians)
export function cupXf({ X = 0, Y = 0, Z = 0, tilt = 0.52, yaw = 0, s = 1 }) {
  const ct = Math.cos(tilt), st = Math.sin(tilt), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const rotY = (p) => [cy * p[0] + sy * p[2], p[1], -sy * p[0] + cy * p[2]];
  const rotX = (p) => [p[0], ct * p[1] - st * p[2], st * p[1] + ct * p[2]];
  return {
    spun: (p) => { const q = rotX(rotY(p)); return [X + s * q[0], Y + s * q[1], Z + s * q[2]]; }, // body, inside, handle
    still: (p) => { const q = rotX(p); return [X + s * q[0], Y + s * q[1], Z + s * q[2]]; }, // coffee, shadow (not spun)
    nSpun: (n) => rotX(rotY(n)), nStill: (n) => rotX(n)
  };
}
// the camera: a world point -> the screen in wall units (y up), and its depth
export function wallCam({ Zc = 50, ycam = 0 } = {}) {
  const P = (w) => { const d = Zc - w[2]; return [(Zc * w[0]) / d, (Zc * (w[1] - ycam)) / d + ycam, d]; };
  return { Zc, ycam, P, eye: [0, ycam, Zc] };
}

/* ------------------------------ the lathe (LatheGeometry: x = r sin(phi), z = r cos(phi), u = i/SEG, v = j/(n-1)) ------------------------------ */
export const lathePt = (r, y, phi) => [r * Math.sin(phi), y, r * Math.cos(phi)];
// the outer profile at v (0 at the bottom's centre, 1 at the rim), as LatheGeometry interpolates it: by point index
export function outerAtV(v) {
  const n = OUTER.length - 1, x = Math.max(0, Math.min(n, v * n)), j = Math.min(n - 1, Math.floor(x)), f = x - j;
  const a = OUTER[j], b = OUTER[j + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
// a texture point (canvas px of the 1024 x 256 pattern; flipY: canvas y 0 is v 1) -> a point on the outer surface (cup space)
export function texPt(px, py, out = 0.004) {
  const u = px / 1024, v = 1 - py / 256;
  const [r, y] = outerAtV(v);
  return lathePt(r + out, y, u * Math.PI * 2);
}
// the inner radius at a height (the inner profile from the lip down)
export function innerR(y) {
  const pr = INNER.slice(3);
  for (let i = 0; i < pr.length - 1; i++) { const [r0, y0] = pr[i], [r1, y1] = pr[i + 1]; if (y <= y0 && y >= y1) return r0 + ((r1 - r0) * (y0 - y)) / (y0 - y1 || 1); }
  return 1.26;
}
export function outerR(y) {
  for (let i = 3; i < OUTER.length - 1; i++) { const [r0, y0] = OUTER[i], [r1, y1] = OUTER[i + 1]; if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1); }
  return y > 1.9 ? 1.44 : 1.3;
}

/* ------------------------------ 2D ------------------------------ */
export function hull(points) {
  const p = points.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  up.pop(); lo.pop();
  return lo.concat(up);
}
// a closed polygon resampled to n points by arc length, starting from the point furthest along dir from its centroid
export function resample(poly, n, dir = [0, 1]) {
  const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length, cy = poly.reduce((s, q) => s + q[1], 0) / poly.length;
  let s0 = 0, best = -Infinity;
  poly.forEach((q, i) => { const d = (q[0] - cx) * dir[0] + (q[1] - cy) * dir[1]; if (d > best) { best = d; s0 = i; } });
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
export const area = (poly) => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
// a projected circle (radius r at height y of the cup's axis frame), as an ellipse: centre, semi-axes, rotation, and its points
export function projCircle(cam, xf, r, y, { still = true, n = 96 } = {}) {
  const pts = [];
  for (let k = 0; k < n; k++) { const th = (k / n) * Math.PI * 2; const w = (still ? xf.still : xf.spun)(lathePt(r, y, th)); pts.push(cam.P(w)); }
  return fitEllipse(pts);
}
// an ellipse through the points of a projected circle: centre, axes (a major), the major axis's angle (rad), the points
export function fitEllipse(pts) {
  const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) { const x = p[0] - cx, y = p[1] - cy; sxx += x * x; syy += y * y; sxy += x * y; }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy), ux = Math.cos(ang), uy = Math.sin(ang);
  let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity;
  for (const p of pts) { const x = (p[0] - cx) * ux + (p[1] - cy) * uy, y = -(p[0] - cx) * uy + (p[1] - cy) * ux; p0 = Math.min(p0, x); p1 = Math.max(p1, x); q0 = Math.min(q0, y); q1 = Math.max(q1, y); }
  const ccx = cx + ((p0 + p1) / 2) * ux - ((q0 + q1) / 2) * uy, ccy = cy + ((p0 + p1) / 2) * uy + ((q0 + q1) / 2) * ux;
  return { cx: ccx, cy: ccy, a: (p1 - p0) / 2, b: Math.max(1e-4, (q1 - q0) / 2), ang, pts };
}
// a point on an ellipse at parameter t (0 along the major axis)
export const ellPt = (e, t) => [e.cx + e.a * Math.cos(t) * Math.cos(e.ang) - e.b * Math.sin(t) * Math.sin(e.ang), e.cy + e.a * Math.cos(t) * Math.sin(e.ang) + e.b * Math.sin(t) * Math.cos(e.ang)];
export const inEllipse = (e, p, grow = 0) => { const x = p[0] - e.cx, y = p[1] - e.cy, c = Math.cos(e.ang), s = Math.sin(e.ang); const u = (x * c + y * s) / (e.a + grow), v = (-x * s + y * c) / (e.b + grow); return u * u + v * v <= 1; };

/* ------------------------------ the body's outline ------------------------------ */
// the outer surface and the lip, projected; their hull is the body's outline (the cup without its handle is convex)
export function bodyHull(cam, xf) {
  const pts = [];
  for (const [r, y] of OUTER.slice(1)) for (let k = 0; k < 144; k++) pts.push(cam.P(xf.spun(lathePt(r, y, (k / 144) * Math.PI * 2))));
  for (const [r, y] of INNER.slice(0, 5)) for (let k = 0; k < 144; k++) pts.push(cam.P(xf.spun(lathePt(r, y, (k / 144) * Math.PI * 2))));
  // the profile between the points (the lip rounds over): denser there
  for (let j = 0; j < 4; j++) { const a = INNER[j], b = INNER[j + 1]; for (let f = 0.25; f < 1; f += 0.25) for (let k = 0; k < 144; k++) pts.push(cam.P(xf.spun(lathePt(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (k / 144) * Math.PI * 2)))); }
  return hull(pts);
}

/* ------------------------------ the patterns ------------------------------ */
// The original two are the canvases' own shapes (canvas px of the 1024 x 256 texture, mapped by LatheGeometry's UVs:
// distorted as they were); the new three are drawn in the cup's own space (th radians round the cup, y up), so dots are
// round and bands level. period: after how much of a turn (radians) the pattern repeats.
const TAU = Math.PI * 2;
export const PATTERNS = {
  // win: { x0, x1 } the texture's px round the cup that can be seen (from behind the left edge to behind the right)
  zig: { space: "tex", period: TAU / 16, shapes(win = { x0: -64, x1: 1088 }) {
    // six rows, a 13 px line, mitred: as a band whose vertical half thickness is 6.5 / cos(slope)
    const out = [], h = 6.5 / Math.cos(Math.atan(22 / 32)), xa = Math.floor(win.x0 / 32) * 32;
    for (let r2 = 0; r2 < 6; r2++) {
      const y = 34 + r2 * 34, top = [], bot = [];
      for (let x = xa; x <= win.x1 + 32; x += 32) { const yy = y + (((x / 32) % 2 + 2) % 2 ? -11 : 11); top.push([x, yy - h]); bot.push([x, yy + h]); }
      out.push({ poly: top.concat(bot.reverse()), long: true });
    }
    return out;
  } },
  stripes: { space: "tex", period: TAU / 16, shapes(win = { x0: -64, x1: 1088 }) { const out = []; for (let x = Math.floor(win.x0 / 64) * 64; x < win.x1; x += 64) out.push({ poly: [[x + 16, 40], [x + 46, 40], [x + 46, 256], [x + 16, 256]] }); return out; } },
  dots: { space: "cup", period: TAU / 16, rows: [[1.62, 0], [1.06, 0.5], [0.5, 0]], rad: 0.13, shapes() {
    const out = [];
    for (const [y, off] of this.rows) for (let k = -1; k <= 16; k++) { const th0 = ((k + off) / 16) * TAU, pts = []; for (let a = 0; a < 8; a++) { const t = (a / 8) * TAU; pts.push([th0 + (this.rad * Math.cos(t)) / 1.42, y + this.rad * Math.sin(t)]); } out.push({ poly: pts }); }
    return out;
  }, inside(th, y) { for (const [yy, off] of this.rows) { const k = Math.round((th / TAU) * 16 - off), th0 = ((k + off) / 16) * TAU; if (Math.hypot((th - th0) * 1.42, y - yy) <= this.rad) return true; } return false; } },
  bands: { space: "cup", period: TAU, ys: [[1.62, 1.78], [1.22, 1.38], [0.82, 0.98]], shapes() { return this.ys.map(([a, b]) => ({ ring: [a, b] })); }, inside(th, y) { return this.ys.some(([a, b]) => y >= a && y <= b); } },
  dipped: { space: "cup", period: TAU, shapes() { return [{ ring: [-0.1, 0.95] }]; }, inside(th, y) { return y <= 0.95; } }
};
