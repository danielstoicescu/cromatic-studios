// Cromatic · stories in Lottie · story B7 (TASK-065h, Daniel on B: "more shots with the car moving on Olari street:
// open on its street sign, then the car driving on it, tracking, low, a pass by the lens, the world changing as it
// drives; in each world that world's ride"). Logical x, z (y up); t in screen seconds from the story's start; captured
// from the map frame by frame (renderV6.mjs JOB=b7). Str. Olari runs north (+z) at x ~1145 from its plate at the
// boulevard (1114, 6236) to the Cromatic Studios House's plaza (the house at 1075, 7330, facing +x).
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const YV = 1.73, X = 1147, V = 88, Z0 = 6128;
// the ride: up Str. Olari at 88 u/s, then into the plaza, slowing to a stop in front of the house
export const T_END = 1.5 + 9 * 1.15; // (when the end shot starts)
export function car(t) {
  const zEnd = Z0 + V * T_END;
  if (t < T_END) return { x: X, y: YV, z: Z0 + V * t, yaw: 0, lights: 1 };
  const u = clamp((t - T_END) / 1.6), s = V * 1.6 * (u - 0.5 * u * u); // (constant deceleration to a stop)
  return { x: lerp(X, 1172, sm(u)), y: YV, z: zEnd + s, yaw: 0.28 * Math.sin(Math.PI * u), lights: 1 };
}
const W = 2160, H = 3840;
// the shots: [world, from, to (s), camera(t, the ride's pose)]
export const SEG = [
  ["monument", 0, 1.5, (t) => { const u = sm(clamp(t / 1.5)); return { pos: [1178, lerp(48, 40, u), lerp(6214, 6224, u)], tgt: [1114, lerp(50, 40, u), 6212], fov: lerp(30, 40, u), level: true }; }, "sign"],
  ["monument", 1.5, 2.65, (t, c) => ({ pos: [c.x - 36, 4, c.z + 2], tgt: [c.x, 6, c.z + 12], fov: 58, shift: [0, 0.1], level: true }), "track"],
  ["nightlife", 2.65, 3.8, () => ({ pos: [1171, 3, Z0 + V * 3.9], tgt: [1150, 6, Z0 + V * 3.9 - 90], fov: 56, shift: [0, 0.1], level: true }), "pass"],
  ["underwater", 3.8, 4.95, (t, c) => ({ pos: [c.x + 12, 46, c.z - 84], tgt: [c.x, 4, c.z + 40], fov: 56, level: false }), "high"],
  ["circuit", 4.95, 6.1, (t, c) => ({ pos: [c.x - 8, 4, c.z + 72], tgt: [c.x, 5, c.z], fov: 50, shift: [0, 0.1], level: true }), "front"],
  ["sketch", 6.1, 7.25, (t, c) => ({ pos: [c.x + 92, 26, c.z + 18], tgt: [c.x, 8, c.z + 8], fov: 52, level: false }), "side", "sketch"],
  ["orchid", 7.25, 8.4, () => ({ pos: [1120, 3, Z0 + V * 8.5], tgt: [1146, 6, Z0 + V * 8.5 - 90], fov: 56, shift: [0, 0.1], level: true }), "pass"],
  ["gta2", 8.4, 9.55, (t, c) => ({ pos: [c.x, 170, c.z + 24], tgt: [c.x, 0, c.z + 24.5], fov: 54, level: false }), "top"],
  ["riso", 9.55, 10.7, (t, c) => ({ pos: [c.x + 30, 5, c.z + 52], tgt: [c.x, 6, c.z], fov: 54, shift: [0, 0.1], level: true }), "three-quarter", "riso"],
  ["ghibli", 10.7, 11.85, (t, c) => { const u = sm(clamp((t - 10.7) / 1.15)); return { pos: [c.x - 22, lerp(8, 46, u), c.z - 64], tgt: [1105, lerp(16, 30, u), 7320], fov: 56, level: false }; }, "crane"],
  ["monument", 11.85, 14.0, (t) => { const u = sm(clamp((t - 11.85) / 2.15)); return { pos: [lerp(1300, 1290, u), 7, 7330], tgt: [1060, 28, 7330], fov: 76, shift: [0, 0.1], level: true }; }, "house"]
].map(([world, a, b, cam, kind, mode]) => ({ world, a, b, kind, mode: mode || null, cam: (t) => ({ ...cam(t, car(t)), w: W, h: H }) }));
export const DUR = 14.0; // (then the black and the pill: 2 s more on the cards' clock)
