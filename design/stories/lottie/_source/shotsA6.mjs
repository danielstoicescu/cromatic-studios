// Cromatic · stories in Lottie · story A6 (TASK-065g, Daniel on A5: "nu mai redesena": every background is the map
// itself, captured from the beta 4.4 renderer at 2x, the camera animated in the map; the ride in the scene, its matte
// and the camera kept per frame for the composite of a better car later). Logical x, z (y up); t in screen seconds
// from the shot's start; 30 captures a second. Read by renderV6.mjs JOB=a6.
//   over    straight down on the yellow ride driving up the coffee street, the camera following it, turning a hair
//   steam   the coffee street at Steam (its tower, the sign, the truck), the ride parked; the camera slides and turns
//   oma     OMA Coffee from across the street, Tampa and the BRASOV letters behind; its room lit behind the glass, the
//           people in it (omaRoom.js), the camera easing in
//   scf     the Slow Coffee dome from high in the south-east, the whole city behind it; a slow arc round it
//   drive   from behind the ride on the coffee street: it pulls away and drives on until it is small; the camera eases
//           after it a little
import { driveCar } from "./shots4.mjs";
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const W = 2160, H = 3840, YV = 1.73;
const overCar = (t) => ({ x: 842, y: YV, z: 5478 + 62 * t, yaw: 0, lights: 0 });
export const A6 = {
  // (fix: pos and tgt drift together and the screen's up is fixed: a near-vertical lookAt spun with the drift)
  over: { dur: 2.55, car: overCar, cam: (t) => { const c = overCar(t), dx = 4 * Math.sin(t * 0.7); return { pos: [842 + dx, 300, c.z + 18], tgt: [842 + dx, 0, c.z + 18], up: [0, 0, 1], fov: 52, roll: lerp(-0.07, 0.05, sm(clamp(t / 2.55))), level: false, w: W, h: H }; } },
  steam: { dur: 1.95, park: [842, null, 5545, 0], cam: (t) => { const u = sm(clamp(t / 1.95)); return { pos: L3([786, 9, 5436], [800, 10.5, 5452], u), tgt: L3([940, 15, 5640], [952, 18, 5636], u), fov: 60, shift: [0, 0.13], level: true, w: W, h: H }; } },
  oma: { dur: 2.25, room: true, cam: (t) => { const u = sm(clamp(t / 2.25)); return { pos: L3([892, 13.5, 4602], [882, 12.5, 4594], u), tgt: L3([620, 44, 4579], [622, 42, 4577], u), fov: lerp(73.7, 71, u), shift: [0, 0.0833], level: true, w: W, h: H }; } },
  scf: { dur: 1.9, cam: (t) => { const u = sm(clamp(t / 1.9)); return { pos: L3([1528, 168, 4690], [1462, 150, 4728], u), tgt: L3([1100, 30, 5300], [1098, 28, 5296], u), fov: 55, level: false, w: W, h: H }; } },
  drive: { dur: 5.7, car: driveCar, cam: (t) => { const u = sm(clamp((t - 0.4) / 3.6)); return { pos: L3([842, 2.4, 5507], [842, 3.6, 5540], u), tgt: L3([842, 5, 5760], [842, 6, 5800], u), fov: 58, shift: [0, 0.12], level: true, w: W, h: H }; } }
};
// OMA's two glass arches, for the key (as shots5's omaArches; the glass is turned to one flat colour in the capture)
export const OMA_GLASS = { color: 0x3a2412, emissive: 0xffb35c, key: [215, 166, 89] };
