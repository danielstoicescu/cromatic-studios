// Cromatic · stories in Lottie · story C (TASK-058): the chase at night. The two cars' paths through the corner of
// Str. C. Aricescu and up the coffee street (the map's logical x, z; time in seconds from the shot's start), and the
// story's two cameras. Read by render.mjs (the cars' poses, rendered one by one) and build.mjs (the marks, the smoke,
// the police lights' washes).
//   the yellow ride: in from the east on Aricescu, a drift through the corner (the tail out ~0.6 rad), up the coffee
//   street toward the lens with a fishtail, past it on the left. The police Dacia 1300: 1.2 s behind, a tidier line,
//   past on the right, its lamps flashing (red, blue: 190 ms each, as on the map)
const C0 = [905, 4340], R = 82; // the corner's arc: from (905, 4258) heading west to (823, 4340) heading north
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sm = (t) => t * t * (3 - 2 * t);
// a path as segments with their speeds; returns (t) -> { x, z, h (heading), s (distance) }
function pathOf({ x0, laneN, passX, v1, v2, v3, stopZ }) {
  const L1 = x0 - 905, L2 = (R * Math.PI) / 2, L3 = 4900 - 4340;
  const t1 = L1 / v1, t2 = t1 + L2 / v2;
  const at = (t) => {
    if (t <= t1) { const s = v1 * t; return { x: x0 - s, z: 4258, h: -Math.PI / 2, seg: 1, u: t / t1 }; }
    if (t <= t2) { const u = (t - t1) / (t2 - t1), th = -Math.PI / 2 - u * (Math.PI / 2); return { x: C0[0] + R * Math.cos(th), z: C0[1] + R * Math.sin(th), h: -Math.PI / 2 + u * (Math.PI / 2), seg: 2, u }; }
    // up the coffee street, easing from the corner's exit (x 823) to the line it passes the lens on
    // (stopZ: it brakes evenly from the corner's exit to a stop there)
    const tt = t - t2, Ls = stopZ ? stopZ - 4340 : 0, tb = stopZ ? (2 * Ls) / v3 : 0;
    const s = stopZ ? (tt >= tb ? Ls : v3 * tt - (v3 / (2 * tb)) * tt * tt) : v3 * tt, z = 4340 + s, k = sm(clamp((z - 4380) / 220));
    const x = laneN + (passX - laneN) * k, dx = (passX - laneN) * (6 * ((z - 4380) / 220) * (1 - (z - 4380) / 220)) / 220 * (z > 4380 && z < 4600 ? 1 : 0);
    return { x, z, h: Math.atan2(dx, 1), seg: 3, u: s / L3 };
  };
  return { at, t1, t2 };
}
// the body's yaw: the heading, plus the drift (the tail out through the corner), then a fishtail settling
function yawOf(p, t, { beta, wob }) {
  let b = 0;
  if (p.seg === 1) b = beta * 0.35 * sm(clamp((p.u - 0.75) / 0.25)); // (the flick before the corner)
  else if (p.seg === 2) b = beta * (0.35 + 0.65 * Math.sin(Math.PI * p.u));
  else b = beta * 0.35 * Math.exp(-p.u * 5) - wob * Math.sin(p.u * 18) * Math.exp(-p.u * 3.2);
  return p.h + b;
}
export const CARS = {
  yellow: { t0: 0.35, path: pathOf({ x0: 1030, laneN: 823, passX: 824, v1: 190, v2: 150, v3: 230 }), beta: 0.62, wob: 0.16 },
  cop: { t0: 1.55, path: pathOf({ x0: 1030, laneN: 828, passX: 838, v1: 200, v2: 160, v3: 230, stopZ: 4545 }), beta: 0.3, wob: 0.06 }
};
// the pose of a car at shot time t (s): position (logical), yaw; null before it enters
export function pose(car, t) {
  const C = CARS[car], tt = t - C.t0;
  if (tt < 0) return null;
  const p = C.path.at(tt);
  return { x: p.x, z: p.z, yaw: yawOf(p, tt, C), seg: p.seg, u: p.u, h: p.h };
}
// the rear wheels' tracks (where the marks go and the smoke starts): offsets from the car's centre in its own frame
export const REAR = { back: -8.6, side: 4.6 };
export function rearWheels(car, t) {
  const q = pose(car, t); if (!q) return null;
  const f = [Math.sin(q.yaw), Math.cos(q.yaw)], r = [Math.cos(q.yaw), -Math.sin(q.yaw)];
  return [-1, 1].map((sd) => [q.x + f[0] * REAR.back + r[0] * sd * REAR.side, q.z + f[1] * REAR.back + r[1] * sd * REAR.side]);
}
// when the tyres slide (marks, smoke): through the corner and the fishtail
export const sliding = (car, t) => { const q = pose(car, t); return !!q && ((q.seg === 2) || (q.seg === 1 && q.u > 0.8) || (q.seg === 3 && q.u < (car === "cop" ? 0.1 : 0.35))); };
// the police lamps: red on even 190 ms beats, blue on odd (the map's own rhythm)
export const beat = (t) => Math.floor((t * 1000) / 190) % 2;
// the shot's span (s) and the cameras
export const STREET_DUR = 5.0; // (the moving part: after it the police car stands, its lamps flashing, then off)
export const CSHOTS = {
  // street level on the coffee street, looking south down it to the corner of Aricescu (the festoon over it, the lit
  // blocks behind): level, the lens a hand above the road, a little to the right of its middle
  "c-street": { pos: [834, 5, 4640], tgt: [812, 5, 4300], fov: 60, shift: [0, 0.06], cuts: [["near", 90], ["mid", 420], ["far", 1e9]], skyD: 6000 },
  // the bird's eye over the night city: the coffee street from the south-east, the cars as small as they are
  "c-air": { pos: [1500, 1500, 5112], tgt: [850, 0, 4262], fovs: [32, 16.27], level: false }
};
// the aerial's beat: the approach, before the street: both cars along the main road (the map's route A) from the
// roundabout west to the corner of Aricescu, the police 75 behind; the camera aims at the corner (the cut dives into it)
export const ROUTE = [[1500, 4120], [1500, 4161], [1498, 4180], [1494, 4189], [1486, 4192], [1474, 4196], [1462, 4203], [1451, 4211], [1443, 4222], [1436, 4234], [1432, 4246], [1427, 4256], [1419, 4259], [1407, 4260], [1375, 4260], [1290, 4260], [1150, 4260], [1000, 4260], [880, 4260]];
const RL = (() => { const c = [0]; for (let i = 1; i < ROUTE.length; i++) c.push(c[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1])); return c; })();
function along(s) { s = clamp(s, 0, RL[RL.length - 1] - 1e-6); let i = 1; while (RL[i] < s) i++; const u = (s - RL[i - 1]) / (RL[i] - RL[i - 1]), a = ROUTE[i - 1], b = ROUTE[i]; return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) }; }
export const AIR = {
  dur: 3.4,
  yellow: (t) => along(430 + 85 * t),
  cop: (t) => along(355 + 85 * t)
};
