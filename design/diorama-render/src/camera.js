// Cromatic · diorama renders (TASK-118): camera paths that cannot jump. Plain ES module, no three: the same file runs in
// Node (render.mjs plans every frame and sub-frame) and in the page.
//
// Why A6 jumped: the drone shot aimed the camera with lookAt() at a point almost straight below it. A lookAt with the
// world's up is undefined there, so the picture's rotation came from the few units of horizontal offset between camera
// and target, and as the drone drifted that offset swung round: the image turned ~70 degrees in 14 frames. Every other
// shot eased in from rest and out to rest (smoothstep), and the cuts were 2D slides of 1.3 screen widths in 6 frames
// with no blur (black showing behind them).
//
// Here a camera is never aimed by a lookAt on the fly:
//   * position and look-at point are each one centripetal Catmull-Rom spline through the keys (no loops, no overshoot
//     at uneven spacing, C1 through every key), sampled by time with an optional ease of the whole move
//   * the roll about the view axis is never derived from the geometry: the frame's "up" comes from a heading (yaw) the
//     keys carry and the spline interpolates. Looking level, up is the world's up; looking down, up blends to the
//     heading's ground direction (the top of the picture points that way), smoothly, before the view gets near the
//     vertical. A key that looks within 25 degrees of straight down without a yaw is an error, not a guess.
//   * validate() samples the path far finer than the frame rate and throws on a frame-to-frame turn, a change of turn
//     speed or a flip of the up vector beyond its limits, so a broken path fails before anything renders
//   * whips are camera moves too (whip()): a fast pan of the look-at point round the camera, rendered with the shutter's
//     sub-frames, so they blur like a real whip pan instead of sliding the picture
//
// A key: { t, pos: [x, y, z], look: [x, y, z], fov?, yaw? (deg, heading of the picture's top on the ground when looking
//   down: 0 = +z), roll? (deg), focus? (a distance, or a point [x, y, z]: what stays sharp), fstop? }
// cameraPath({ keys, ease?: "none" | "inOut" | "in" | "out" | [inSec, outSec], fps? }) -> path:
//   path.at(t) -> { pos, look, fwd, up, right, fov, roll, focus, fstop, t }   (focus: a distance along fwd)
//   path.duration
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]), norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const EASE = {
  none: (u) => u,
  inOut: (u) => (1 - Math.cos(Math.PI * u)) / 2,
  in: (u) => 1 - Math.cos((Math.PI * u) / 2),
  out: (u) => Math.sin((Math.PI * u) / 2)
};
// an ease that starts and/or ends at rest over a set time only (seconds), constant speed in between (C1)
function easeEnds(D, a, b) {
  a = Math.max(0, a); b = Math.max(0, b);
  const v = 1 / (D - a / 2 - b / 2); // the cruise speed so the whole move still lasts D
  return (u) => {
    const t = u * D;
    if (t < a) return (v * t * t) / (2 * a);
    if (t > D - b) { const r = D - t; return 1 - (v * r * r) / (2 * b); }
    return v * (t - a / 2);
  };
}
// centripetal Catmull-Rom (Barry-Goldman), alpha 0.5, through P1..P2 for u in [0, 1]
function crSeg(P0, P1, P2, P3, u) {
  const kn = (a, b) => Math.max(1e-4, Math.pow(len(sub(b, a)), 0.5));
  const t0 = 0, t1 = t0 + kn(P0, P1), t2 = t1 + kn(P1, P2), t3 = t2 + kn(P2, P3), t = lerp(t1, t2, u);
  const L = (A, B, ta, tb) => add(mul(A, (tb - t) / (tb - ta)), mul(B, (t - ta) / (tb - ta)));
  const A1 = L(P0, P1, t0, t1), A2 = L(P1, P2, t1, t2), A3 = L(P2, P3, t2, t3);
  const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
}
// a spline of points through keys at times T (phantom end points continue the end segments: the move does not stop)
function spline(T, P) {
  const n = P.length;
  if (n === 1) return () => P[0].slice();
  const ext0 = sub(mul(P[0], 2), P[1]), extN = sub(mul(P[n - 1], 2), P[n - 2]);
  const Q = [ext0, ...P, extN];
  return (t) => {
    if (t <= T[0]) return P[0].slice();
    if (t >= T[n - 1]) return P[n - 1].slice();
    let i = 0; while (t > T[i + 1]) i++;
    const u = (t - T[i]) / (T[i + 1] - T[i]);
    return crSeg(Q[i], Q[i + 1], Q[i + 2], Q[i + 3], u);
  };
}
// numbers through keys (a natural cubic-ish: Catmull-Rom on 1D values, uniform in key time)
function spline1(T, V) {
  const n = V.length;
  if (n === 1) return () => V[0];
  return (t) => {
    if (t <= T[0]) return V[0];
    if (t >= T[n - 1]) return V[n - 1];
    let i = 0; while (t > T[i + 1]) i++;
    const u = (t - T[i]) / (T[i + 1] - T[i]), h = T[i + 1] - T[i];
    const m = (k) => (k <= 0 ? (V[1] - V[0]) / (T[1] - T[0]) : k >= n - 1 ? (V[n - 1] - V[n - 2]) / (T[n - 1] - T[n - 2]) : (V[k + 1] - V[k - 1]) / (T[k + 1] - T[k - 1]));
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * V[i] + (u3 - 2 * u2 + u) * h * m(i) + (-2 * u3 + 3 * u2) * V[i + 1] + (u3 - u2) * h * m(i + 1);
  };
}
const yawOf = (v) => (Math.atan2(v[0], v[2]) * 180) / Math.PI; // heading of a ground direction, deg (0 = +z, 90 = +x)
const unwrap = (a) => { const o = [a[0]]; for (let i = 1; i < a.length; i++) { let d = a[i] - o[i - 1]; d -= 360 * Math.round(d / 360); o.push(o[i - 1] + d); } return o; };

export function cameraPath(o) {
  const keys = [...o.keys].sort((a, b) => a.t - b.t);
  if (!keys.length) throw new Error("cameraPath: no keys");
  const T = keys.map((k) => k.t), D = T[T.length - 1] - T[0];
  for (let i = 1; i < T.length; i++) if (!(T[i] > T[i - 1])) throw new Error(`cameraPath: key times must increase (key ${i})`);
  // each key's heading: given, or the level part of its view (when it has one)
  const yaws = keys.map((k, i) => {
    const f = norm(sub(k.look, k.pos)), level = Math.hypot(f[0], f[2]);
    if (k.yaw != null) return k.yaw;
    if (level < Math.sin((25 * Math.PI) / 180)) throw new Error(`cameraPath: key ${i} looks within 25 deg of straight down/up: give it a yaw (the heading of the picture's top)`);
    return yawOf(f);
  });
  const P = spline(T, keys.map((k) => k.pos)), L = spline(T, keys.map((k) => k.look));
  const Y = spline1(T, unwrap(yaws)), R = spline1(T, keys.map((k) => k.roll || 0)), F = spline1(T, keys.map((k) => k.fov || 40));
  const FS = spline1(T, keys.map((k) => k.fstop ?? o.fstop ?? 2.8));
  // focus: a distance, a point, or (default) the look-at point
  const focusPts = keys.map((k) => (Array.isArray(k.focus) ? k.focus : null)), FD = keys.map((k) => (typeof k.focus === "number" ? k.focus : null));
  const FP = focusPts.every(Boolean) ? spline(T, focusPts) : null, FDs = FD.every((v) => v != null) ? spline1(T, FD) : null;
  const e = o.ease;
  const warp = Array.isArray(e) ? easeEnds(D || 1, e[0], e[1]) : EASE[e || "none"] || EASE.none;
  const at = (tt) => {
    const u = D > 0 ? clamp((tt - T[0]) / D) : 0, t = T[0] + warp(u) * D;
    const pos = P(t), look = L(t), fwd = norm(sub(look, pos));
    const yaw = (Y(t) * Math.PI) / 180, head = [Math.sin(yaw), 0, Math.cos(yaw)];
    // up: the world's up when level; the heading (the picture's top on the ground) when looking down. The blend is
    // done well before the view is vertical, so the cross products below never meet a zero
    const down = -fwd[1], k = sstep(0.55, 0.9, Math.abs(down));
    const upRef = norm(add(mul([0, 1, 0], 1 - k), mul(down > 0 ? head : mul(head, -1), k)));
    let right = cross(fwd, upRef); if (len(right) < 1e-6) right = cross(fwd, head);
    right = norm(right);
    let up = norm(cross(right, fwd));
    const rr = (R(t) * Math.PI) / 180;
    if (rr) { const c = Math.cos(rr), s = Math.sin(rr), r2 = add(mul(right, c), mul(up, s)), u2 = add(mul(up, c), mul(right, -s)); right = r2; up = u2; }
    let focus = len(sub(look, pos));
    if (FP) focus = Math.max(1, dot(sub(FP(t), pos), fwd)); else if (FDs) focus = FDs(t);
    return { t: tt, pos, look, fwd, up, right, fov: F(t), roll: R(t), focus, focusPt: add(pos, mul(fwd, focus)), fstop: FS(t) };
  };
  return { at, duration: D, t0: T[0], t1: T[T.length - 1], keys };
}

// a whip pan out of (or into) a path: the camera stays where it is and its look-at point swings round it by `deg`
// (positive: to the right) over `dur` seconds, accelerating out (or decelerating in). Rendered with sub-frames it
// blurs as a whip does. whip(path, { at: "end" | "start", deg, dur }) -> a new path (its time runs on past the end)
export function whip(path, { at = "end", deg = 70, dur = 0.22 } = {}) {
  const t0 = at === "end" ? path.t0 : path.t0 - dur, t1 = at === "end" ? path.t1 + dur : path.t1;
  const win = at === "end" ? [path.t1, t1] : [t0, path.t0];
  return {
    duration: t1 - t0, t0, t1, whips: [...(path.whips || []), win],
    at(t) {
      const inWhip = at === "end" ? t > path.t1 : t < path.t0;
      if (!inWhip) return path.at(t);
      const c = path.at(at === "end" ? path.t1 : path.t0);
      const u = at === "end" ? (t - path.t1) / dur : (path.t0 - t) / dur, a = (((at === "end" ? 1 : -1) * deg * Math.PI) / 180) * u * u;
      // turn fwd about the up axis
      const ca = Math.cos(a), sa = Math.sin(a), f = norm(add(mul(c.fwd, ca), mul(c.right, sa))), r = norm(cross(f, c.up));
      return { ...c, t, fwd: f, right: r, look: add(c.pos, mul(f, c.focus)), focusPt: add(c.pos, mul(f, c.focus)) };
    }
  };
}

// the angle between two frames' orientations (deg), from their bases
function turn(a, b) {
  const tr = dot(a.right, b.right) + dot(a.up, b.up) + dot(a.fwd, b.fwd); // trace of Ra^T Rb
  return (Math.acos(clamp((tr - 1) / 2, -1, 1)) * 180) / Math.PI;
}
// throws if the path turns too fast, changes its turning speed too suddenly or flips its up vector (whips excepted)
export function validate(path, { fps = 30, maxTurn = 3.5, maxTurnJump = 0.9, maxFlip = 5, maxMove = Infinity } = {}) {
  const N = 8, dt = 1 / (fps * N), out = { frames: 0, maxTurn: 0, maxTurnJump: 0, maxMove: 0 };
  let prev = path.at(path.t0), prevTurn = null;
  for (let t = path.t0 + dt; t <= path.t1 + 1e-9; t += dt) {
    const c = path.at(t);
    const inWhip = (path.whips || []).some(([a, b]) => t > a - 1e-6 - dt && t < b + 1e-6 + dt);
    const tf = turn(prev, c) * N; // deg per frame
    const upFlip = (Math.acos(clamp(dot(prev.up, c.up), -1, 1)) * 180) / Math.PI * N;
    const mv = len(sub(c.pos, prev.pos)) * N;
    if (!inWhip) {
      out.maxTurn = Math.max(out.maxTurn, tf); out.maxMove = Math.max(out.maxMove, mv);
      if (tf > maxTurn) throw new Error(`camera turns ${tf.toFixed(2)} deg/frame at t=${t.toFixed(3)} (limit ${maxTurn})`);
      if (upFlip > maxFlip) throw new Error(`camera's up vector swings ${upFlip.toFixed(2)} deg/frame at t=${t.toFixed(3)}`);
      if (mv > maxMove) throw new Error(`camera moves ${mv.toFixed(1)} units/frame at t=${t.toFixed(3)} (limit ${maxMove})`);
      if (prevTurn != null) { const j = Math.abs(tf - prevTurn) * N; out.maxTurnJump = Math.max(out.maxTurnJump, j); if (j > maxTurnJump && Math.max(tf, prevTurn) > 0.2) throw new Error(`camera's turning speed jumps by ${j.toFixed(2)} deg/frame per frame at t=${t.toFixed(3)}`); }
      prevTurn = tf;
    } else prevTurn = null;
    prev = c; out.frames++;
  }
  out.frames = Math.round(out.frames / N);
  for (const k of ["maxTurn", "maxTurnJump", "maxMove"]) out[k] = +out[k].toFixed(3);
  return out;
}

// the camera of one sub-frame, as numbers the page applies directly (no lookAt there either): its world matrix
// columns (right, up, -fwd, pos), its vertical fov, the focus distance and the aperture radius in world units
// (fstop and a focal length in mm on a 24 mm-high frame; the scale says how many world units a mm of the model is)
export function lensOf(c, { scale = 1 } = {}) {
  const fmm = 12 / Math.tan((c.fov * Math.PI) / 360); // the focal length that gives this fov on a 24 mm-high frame
  const apertureMM = fmm / c.fstop / 2; // the aperture's radius, mm
  return { pos: c.pos, right: c.right, up: c.up, fwd: c.fwd, fov: c.fov, focus: c.focus, aperture: apertureMM * scale };
}
