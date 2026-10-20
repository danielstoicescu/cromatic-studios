// Cromatic opening, phase 3 · the paper's grid in perspective: the same lines as the flat paper (34 px apart, on the same
// phase) seen by the cups' camera as it tilts; seen from straight above they are exactly the flat grid, so one hands
// over to the other. Cheap: the lines that run away from the camera all pass through the vanishing point, so they are
// one fan of rays (static) whose group is moved to the vanishing point and scaled; the lines across are horizontal on
// screen, each only a height that is keyed.
import { group, path, stroke, fill, rgb, E } from "./lottie.mjs";
import { makeView } from "./cup3d.mjs";
// centre: where the cups' middle (the camera's target, yt above the ground) is on screen; U px per cup unit; viewAt(t)
export function perspectiveGrid(Cm, { nm = "paper · grid in perspective", centre, U, times, viewAt, pitchPx = 34, W = Cm.w, H = Cm.h, parent, ip, op, o = 100, color = "#DCDCDC", width = 1, yt = 1, dc = 14, zFar = 16, paperC = "#F2F2F2" } = {}) {
  const Ug = (U * dc) / (dc + yt), step = pitchPx / Ug;
  const x0 = ((17 - centre[0]) % pitchPx) / Ug, z0 = ((17 - centre[1]) % pitchPx) / Ug;
  // the views (never exactly from above: the vanishing point must stay at a finite height)
  const Vs = times.map((tt) => makeView({ ...viewAt(tt), pitch: Math.min(89.6, viewAt(tt).pitch), U, yt, dc }));
  const scr = (V, x, z) => { const q = V.Pt([x, 0, z]); return [centre[0] + q[0], centre[1] + q[1]]; };
  // the fan: rays from the vanishing point through each line's point on the row z = 0
  const fan = Vs.map((V) => { const vp = scr(V, 0, -1e5), r0 = scr(V, 0, 0), r1 = scr(V, 1, 0); return { vp, A: r1[0] - r0[0], B: r0[1] - vp[1] }; });
  // the lines across that the screen can show at any of the views (from above: the flat grid's rows)
  // (only the near field: the far rows crowd into the haze at the horizon)
  const zs = [], xs = [];
  for (let z = z0 - Math.ceil((z0 + zFar) / step) * step; z < dc * 0.6; z += step) {
    if (Vs.some((V) => { const y = scr(V, 0, z)[1]; return y > -20 && y < H + 20; })) zs.push(z);
  }
  // the rays: enough to cover the screen's width where it is widest (its bottom edge) at any view
  let xr = 0;
  for (const f of fan) { const tb = (H + 40 - f.vp[1]) / f.B; xr = Math.max(xr, (W * 1.2) / Math.abs(f.A * Math.max(0.35, tb))); }
  for (let x = x0 - Math.ceil((x0 + xr) / step) * step; x <= xr; x += step) xs.push(x);
  const L = 4; // the rays' length (in the fan's own units): past the screen's bottom
  const lin = [0, 0, 1, 1];
  const K = (map) => times.map((tt, i) => [tt, map(i), i < times.length - 1 ? lin : undefined]);
  // (each ray a thin filled quad, as wide across as a line: a fill scales with its group, a stroke would not stay thin)
  const Aavg = fan.reduce((s2, f) => s2 + Math.abs(f.A), 0) / fan.length, d = width / Aavg / 2;
  // (from the far row on: the fan's apex, where every ray meets, is not drawn)
  const sFar = Math.min(...Vs.map((V, i) => (scr(V, 0, -zFar)[1] - fan[i].vp[1]) / fan[i].B)), s0 = Math.max(0.02, sFar);
  const quad = (x) => ({ c: true, v: [[x * s0 - d, s0], [x * s0 + d, s0], [x * L + d, L], [x * L - d, L]].map(([a2, b2]) => [+a2.toFixed(4), +b2.toFixed(4)]), i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]] });
  const fanGroup = group("lines away (a fan from the vanishing point)", [...xs.map((x) => path(quad(x))), fill(rgb(color))], { p: K((i) => fan[i].vp.map(r1)), s: K((i) => [fan[i].A * 100, fan[i].B * 100].map(r1)) });
  const across = zs.map((z) => group("line across", [path({ c: false, v: [[-W, 0], [2 * W, 0]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }), stroke(rgb(color), width, 100, { lc: 1, lj: 1 })], { p: K((i) => [0, r1(scr(Vs[i], 0, z)[1])]) }));
  // the haze: the paper's colour thickening toward the far row, so the grid fades into the distance
  const haze = group("haze", [{ ty: "rc", d: 1, s: { a: 0, k: [W * 3, H * 0.6] }, p: { a: 0, k: [W / 2, 0] }, r: { a: 0, k: 0 } },
    { ty: "gf", o: { a: 0, k: 100 }, r: 1, bm: 0, t: 1, g: { p: 3, k: { a: 0, k: [0, ...rgbOf(paperC), 0.55, ...rgbOf(paperC), 1, ...rgbOf(paperC), 0, 1, 0.55, 0.75, 1, 0] } }, s: { a: 0, k: [0, -H * 0.3] }, e: { a: 0, k: [0, H * 0.3] }, h: { a: 0, k: 0 }, a: { a: 0, k: 0 } }],
    { p: K((i) => [0, r1(scr(Vs[i], 0, -zFar)[1] + H * 0.18)]) });
  return Cm.shape(nm, [haze, fanGroup, ...across], { parent, ip, op, ks: { o } });
}
const r1 = (v) => Math.round(v * 10) / 10;
const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((v) => +v.toFixed(4)); };
