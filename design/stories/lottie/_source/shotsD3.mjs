// Cromatic · stories in Lottie · story D3 (TASK-065e, Daniel's notes on D2): the shots that change, in the map's
// logical x, z (y up), rendered by renderV6.mjs JOB=d3 (Printoteca's hall in place of the lane house).
//   hall      Printoteca's hall up close, the camera sliding along its long side (a plate per frame)
//   drift     out of Printoteca: the camera moves (a slow dolly and turn), so the hall's chrome roof catches the light
//             differently every frame: the plate is rendered per frame, the ride with it (D2's drift, its slow motion)
//   skyline   Fintech Boulevard from above its road, the towers on both sides, nothing odd in front (no Medical
//             Avenue, no Zdrovit); the tags: Investimental, Assetto, Longshield (Venevo stays hidden from here: dropped)
//   overtake  Fintech Boulevard at night, head on, low: the yellow ride steady in its lane, the F1 coming up behind it,
//             pulling out and past it, both in frame the whole time
import { D2 } from "./shotsD2.mjs";
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const YV = 1.73;
export const D3 = {
  // the hall up close first (v3): along its long side, the logo and the four steps, the chrome roof's glare sliding
  hall: { dur: 1.2, cam: (t) => { const u = sm(clamp(t / 1.2)); return { pos: L3([1298, 9, 6064], [1322, 7, 6100], u), tgt: L3([1418, 20, 6027], [1420, 20, 6016], u), fov: 56, shift: [0, 0.08], level: true, w: 2160, h: 3840 }; } },
  drift: {
    dur: D2.drift.dur, slow: D2.drift.slow, sub: D2.drift.sub, shutter: D2.drift.shutter, pose: D2.drift.pose,
    // the camera at screen time t: down the boulevard from the hall, the ride coming at it; a slow dolly back and turn
    cam: (t) => { const u = sm(clamp(t / D2.drift.dur)); return { pos: L3([1192, 8.5, 6114], [1170, 6.5, 6094], u), tgt: L3([1432, 22, 6058], [1410, 15, 6072], u), fov: lerp(56, 54, u), shift: [0, 0.08], level: true, w: 2160, h: 3840 }; }
  },
  skyline: {
    cam: { pos: [2060, 40, 5150], tgt: [2085, 70, 4600], fov: 54, shift: [0, 0.06], level: true, w: 2160, h: 3840 },
    tags: { Investimental: [2205, 156, 4500], Assetto: [2215, 138, 4760], Longshield: [1988, 166, 4880] }
  },
  overtake: {
    cam: { pos: [2062, 8, 4890], tgt: [2068, 9, 4450], fov: 22, shift: [0, 0.06], level: true, w: 2160, h: 3840 },
    dur: 1.8,
    dacia: (t) => ({ x: 2079, y: YV, z: 4440 + 150 * t, yaw: 0, lights: 1 }),
    // the F1: behind the Dacia in its lane, out to the left (seen from the lens: its right), past, back in
    f1: (t) => { const X = (u) => lerp(2079, 2053, sm(clamp((u - 0.25) / 0.35)) * (1 - sm(clamp((u - 1.3) / 0.4)))), h = 0.01, dx = (X(t + h) - X(t - h)) / (2 * h); return { x: X(t), y: YV, z: 4300 + 265 * t, yaw: Math.atan2(dx, 265), lights: 1 }; }
  }
};
