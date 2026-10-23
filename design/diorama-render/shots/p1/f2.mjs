import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet, mirror, sakuraRow, focusOnCar, L3 } from "./common.js";
// P1 film · 2 · the sakura row in the morning (3.5 s): the car rolling towards a low lens, petals falling.
let CAR, UN = [], PET, ROW;
const car = (t) => [842, 9, 5480 - 17 * t];
const cam = cameraPath({ keys: Array.from({ length: Math.round(3.5 / 0.25) + 1 }, (_, i) => i * 0.25).map((t) => ({ t, pos: [856, 7, 5262 + 4 * (t / 3.5)], look: [826, 20, 5560], fov: 42, focus: car(t) })) });
export default {
  name: "f2", size: [2160, 3840], fps: 30, duration: 3.5, shutter: 0.12,
  camera: cam, lens: { fstop: 32, scale: 1.45 },
  look: { sky: { top: "#8db2f0", mid: "#f6cfe0", hor: "#ffe2d2" }, fog: { color: "#f7dbe6", near: 600, far: 5200 }, bounce: "#f1c4cf", bounceK: 0.4, domeK: 0.55, domeSunGlow: 0.8, tone: 0.06, minRough: 0.68, bump: 0.03 },
  sun: { az: 65, el: 22, color: "#ffe2c6", intensity: 3.2, radius: 2 },
  shadow: { centre: [830, 0, 5440], ext: 320 },
  post: { tonemap: "neutral", exposure: 1.12, bloomK: 0.1, bloomThr: 0.9, vig: 0.2, grain: 0.02, lut: "cromatic-diorama", sat: 1.18, power: 1.05 },
  async prepare(ctx) { await world(ctx.S, "orchid"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: false }); ROW = sakuraRow(ctx, { x: [806, 880], z0: 5330, z1: 5720, step: 44 }); PET = petals(ctx, { centre: [838, 0, 5400], half: [60, 110], height: 60, n: 260 }); UN.push(paintSky(ctx, { top: "#8db2f0", mid: "#f6cfe0", hor: "#ffe2d2", lit: "#fff0f4", shade: "#d9b4cf", glow: 65, clouds: 0.38, stars: 0 })); },
  pose(t) { const p = car(t); CAR.place(p[0], 1.2, p[2], Math.PI, 17 * t); PET.pose(2.2 + t); },
  dispose() { CAR?.dispose(); PET?.dispose(); ROW?.dispose(); UN.forEach((f) => f()); UN = []; }
};
