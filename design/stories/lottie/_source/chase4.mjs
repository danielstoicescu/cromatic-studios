// Cromatic · stories in Lottie · story C v4 (TASK-065c, Daniel's shot list): the chase's new and changed shots, in the
// map's logical x, z (as chase2.mjs). The rest (Olari 9, the fountain's camera and path, Slow Coffee, the Two Minutes
// drift) is chase2's, as rendered for v2/v3.
//   palace4   the Aesthetic Court square on, past its gate: the whole sign; the ride crosses the plaza in front
//   berero    Casa Berero across the coffee street, its sign; the ride tears past between it and the lens
//   cup       the ride parked under a lamp, the camera at its windscreen: a coffee lands on it (slow motion)
//   fintech4  Fintech Boulevard: the ride comes at the lens flat out, throws it into a drift and stops across the
//             road; the police come up behind it, lamps going
import { walker } from "./chase2.mjs";
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const YV = 1.73, YC = 1.7;
const beatAt = (t) => Math.floor((t * 1000) / 190) % 2;
export const SHOTS = {
  palace4: {
    cam: { pos: [1600, 5, 4570], tgt: [1775, 40, 4570], fov: 64, shift: [0, 0.1], level: true },
    dur: 1.5,
    yellow: (t) => ({ x: 1715, y: YV, z: 4470 + 200 * (t - 0.2), yaw: 0, lights: 1 })
  },
  berero: {
    cam: { pos: [935, 4, 5440], tgt: [706, 14, 5490], fov: 42, shift: [0, 0.1], level: true },
    dur: 1.35,
    yellow: (t) => ({ x: 826, y: YV, z: 5360 + 240 * (t - 0.15), yaw: 0, lights: 1 })
  },
  cup: {
    cam: { pos: [878, 22, 4392], tgt: [858, 11, 4336], fov: 42, level: false },
    dur: 2.0,
    park: [858, null, 4340, 0]
  },
  fintech4: {
    cam: { pos: [2062, 3.2, 4880], tgt: [2072, 3.2, 4400], fov: 55, shift: [0, 0.1], level: true },
    dur: 4.6,
    yellow: (t) => {
      // flat out up the boulevard at 300, into a drift at 1.25 s (the tail swings out, it slides on, scrubbing speed),
      // stopped across the road at 2.15 s
      const td0 = 1.25, td = 0.9, z0 = 4250, v = 300, zd = z0 + v * td0;
      if (t < td0) return { x: 2068, y: YV, z: z0 + v * t, yaw: 0, lights: 1 };
      const u = clamp((t - td0) / td), s = v * td * (u - 0.5 * u * u); // (constant deceleration to a stop)
      return { x: 2068 + 9 * sm(u), y: YV, z: zd + s, yaw: 1.25 * Math.sin((Math.PI / 2) * Math.min(1, u * 1.15)), lights: 1, slide: u > 0 && u < 0.97 };
    },
    cop: (t) => {
      const t0 = 1.55, z0 = 4180, v = 250, tb = 1.55, td = 0.95, tt = t - t0;
      if (tt < 0) return null;
      const zb = z0 + v * tb, z = tt < tb ? z0 + v * tt : zb + v * (Math.min(tt, tb + td) - tb) - (v / (2 * td)) * (Math.min(tt, tb + td) - tb) ** 2;
      const k = sm(clamp((tt - tb) / td));
      return { x: lerp(2050, 2040, k), y: YC, z, yaw: -0.12 * k, lights: 1, beat: beatAt(t) };
    }
  }
};
export const ORDER4 = ["palace4", "berero", "fintech4"];
// the fountain's water, frame by frame (the engine's own jets move): its box in the fountain plate (px of 2160 x 3840)
export const WATER = { box: [340, 1080, 1460, 1000], dur: 1.75 };
