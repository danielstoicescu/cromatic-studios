// Cromatic · stories in Lottie · story C v5 (TASK-065d, Daniel's notes on v4): the chase's new and changed shots, in
// the map's logical x, z (as chase2/chase4). Time in screen seconds from the shot's start (a slowed shot maps it to
// its own action time inside yellow()).
//   palace5   the Aesthetic Court from further away: from its gate on the kerb, the whole palace and its big sign,
//             in warm light (no burgundy); the ride crosses the esplanade just behind the gate
//   steam     v2's wide pan, re-rendered with Steam's own blade sign: a white lit box on a wall bracket between the
//             fascia's STEAM COFFEE SHOP and CRAFT COFFEE, sticking out over the pavement (STEAM_SIGN)
//   sidewin   the Two Minutes corner from the pavement outside it, low: the ride drifting through at speed, in slow
//             motion; a Two Minutes coffee flies in through its open driver's window (the cup is a 3D cup in the car's
//             own frame, so the door hides it once it is in)
//   ftPass    Fintech Boulevard from the kerb by Investimental: the ride flashes past, flat out
//   ftAway    Fintech Boulevard from above and behind: the ride racing away up the boulevard
//   (then chase4's fintech4: head on, the drift, the police)
import { SHOTS as S2 } from "./chase2.mjs";
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const YV = 1.73, SCALE = 0.5702479338842975;
// ---- the slowed drift: screen time -> action time (a ramp down to 0.12x, held, back up to 1x)
function remap({ dur, k0 = 0.9, kSlow = 0.12, a = 0.2, b = 0.6, c = 2.15, d = 2.6, at0 = 0.55 }) {
  const N = Math.round(dur * 600), T = [0];
  const k = (t) => t < a ? k0 : t < b ? lerp(k0, kSlow, sm((t - a) / (b - a))) : t < c ? kSlow : t < d ? lerp(kSlow, 1, sm((t - c) / (d - c))) : 1;
  for (let i = 1; i <= N; i++) T.push(T[i - 1] + k((i - 0.5) / 600) / 600);
  return (ts) => at0 + T[Math.max(0, Math.min(N, Math.round(ts * 600)))];
}
// (ahead of the ride and to its left at the cup's moment: it slides towards the lens, its driver's side to us)
const SIDE_CAM = { pos: [782.6, 3.5, 4317.3], tgt: [844.5, 8, 4286], fov: 46, shift: [0, 0.12], level: true };
const sideTa = remap({ dur: 2.8 });
// the cup: from just in front of the lens, low on its right, up and across into the driver's window (car-local
// [-9, 21, 3]: the driver's side is the car's -x), landing at action time CUP[1]
const CUP = [0.94, 1.07], WIN = [-9.5, 21.5, 3.5];
const camF = (() => { const dx = SIDE_CAM.tgt[0] - SIDE_CAM.pos[0], dz = SIDE_CAM.tgt[2] - SIDE_CAM.pos[2], n = Math.hypot(dx, dz); return [dx / n, dz / n]; })();
const CUP0 = [SIDE_CAM.pos[0] + 6 * camF[0] - 1.1 * camF[1], SIDE_CAM.pos[1] - 0.5, SIDE_CAM.pos[2] + 6 * camF[1] + 1.1 * camF[0]];
const toWorld = (q, l) => { const c = Math.cos(q.yaw), s = Math.sin(q.yaw); return [q.x + SCALE * (l[0] * c + l[2] * s), q.y + SCALE * l[1], q.z + SCALE * (-l[0] * s + l[2] * c)]; };
const toLocal = (q, w) => { const c = Math.cos(q.yaw), s = Math.sin(q.yaw), dx = (w[0] - q.x) / SCALE, dz = (w[2] - q.z) / SCALE; return [dx * c - dz * s, (w[1] - q.y) / SCALE, dx * s + dz * c]; };
function cupAt(ta, q) {
  if (ta < CUP[0]) return null;
  const u = clamp((ta - CUP[0]) / (CUP[1] - CUP[0])), spin = [lerp(-1.1, 0.05, sm(u)) + 0.35 * Math.sin(u * 5), lerp(0.6, 2.4, u), lerp(0.5, 0, sm(u))];
  if (u >= 1) return [...WIN, 0.05, 2.4, 0];
  const end = toWorld(q, WIN), e = 1 - Math.pow(1 - u, 1.6), w = [lerp(CUP0[0], end[0], e), lerp(CUP0[1], end[1], e) + 3.2 * Math.sin(Math.PI * u) * (1 - 0.3 * u), lerp(CUP0[2], end[2], e)];
  return [...toLocal(q, w), ...spin];
}
const fint = (z0, v = 300) => (t) => ({ x: 2068, y: YV, z: z0 + v * t, yaw: 0, lights: 1 });
export const SHOTS = {
  palace5: {
    cam: { pos: [1540, 16, 4570], tgt: [1775, 45, 4570], fov: 72, shift: [0, 0.08], level: true },
    dur: 1.6,
    yellow: (t) => ({ x: 1600, y: YV, z: 4465 + 190 * (t - 0.15), yaw: 0, lights: 1 })
  },
  steam: { ...S2.steam },
  sidewin: {
    cam: SIDE_CAM, dur: 2.8, glassOff: true,
    action: sideTa,
    yellow: (t) => { const ta = sideTa(t); return { ...S2.corner.yellow(ta), ta }; },
    pose: (t) => { const ta = sideTa(t), q = S2.corner.yellow(ta), cup = cupAt(ta, q); return { ...q, ...(cup ? { cup } : {}) }; }
  },
  ftPass: { cam: { pos: [2040, 3, 4700], tgt: [2075, 6, 4640], fov: 62, shift: [0, 0.08], level: true }, dur: 1.0, yellow: fint(4470) },
  ftAway: { cam: { pos: [2062, 60, 4300], tgt: [2068, 0, 4640], fov: 55, level: false }, dur: 1.0, yellow: fint(4300) }
};
export const ORDER5 = ["palace5", "sidewin", "ftPass", "ftAway"];
// Steam's blade sign (logical): the bracket's foot on the wall at the fascia's gap (x 950, z 5638), 12 out over the
// pavement; the box 10 wide, 12.5 tall, 2.4 deep, its faces the original logo, white and lit
export const STEAM_SIGN = { wall: [950, 57, 5638], out: 12, box: [10, 12.5, 2.4] };
