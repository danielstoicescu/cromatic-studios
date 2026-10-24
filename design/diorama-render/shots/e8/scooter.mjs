import { mapRide, world, paintSky, track, dur, sakuraRow, petals , asphalt } from "./common.js";
// E8 · scooter · the E-scooter down the sakura alley on a soft spring morning, petals in the air: the lens low on the
// street, backing away in front of it at its speed.
const D = dur("scooter"), V = 9, sc = (t) => ({ x: 838, z: 5560 - V * t });
let RIDE, UN = [], ROW, PET;
export default {
  name: "scooter", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: track(D, (t) => { const p = sc(t); return { pos: [p.x + 27.6, 3.2, p.z - 106], look: [p.x - 1.35, 9.5, p.z], fov: 30, focus: [p.x + 1, 4, p.z - 1] }; }),
  lens: { fstop: 22, scale: 1.45 },
  look: { sky: { top: "#a9b8dc", mid: "#f2d4de", hor: "#ffe6d8" }, fog: { color: "#f7dbe6", near: 500, far: 4200 }, bounce: "#f1c4cf", bounceK: 0.62, domeK: 0.42, domeSunGlow: 0.8, tone: 0.05, minRough: 0.62, bump: 0.03 },
  sun: { az: 65, el: 24, color: "#ffe6cc", intensity: 3.2, radius: 2.2 },
  shadow: { centre: [838, 0, 5500], ext: 300 },
  post: { tonemap: "agx", exposure: 1.2, bloomK: 0.1, bloomThr: 0.9, vig: 0.2, grain: 0.022, lut: "cromatic-diorama", lutMix: 0.6, sat: 1.12, power: 1.03 },
  async prepare(ctx) {
    await world(ctx.S, "orchid"); UN.push(asphalt(ctx)); RIDE = await mapRide(ctx.S, "scooter"); RIDE.lights(false);
    ROW = sakuraRow(ctx, { x: [806, 880], z0: 5300, z1: 5760, step: 44 }); PET = petals(ctx, { centre: [838, 0, 5470], half: [55, 120], height: 60, n: 320 });
    UN.push(paintSky(ctx, { top: "#8db2f0", mid: "#f6cfe0", hor: "#ffe2d2", lit: "#fff0f4", shade: "#d9b4cf", glow: 65, clouds: 0.38, stars: 0 }));
  },
  pose(t) { const p = sc(t); RIDE.place(p.x, 1.73, p.z, Math.PI); PET.pose(2.2 + t); },
  subject: () => RIDE.g,
  dispose() { RIDE?.restore(); ROW?.dispose(); PET?.dispose(); UN.forEach((f) => f()); UN = []; }
};
