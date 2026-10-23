import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet, mirror, sakuraRow, focusOnCar, L3 } from "./common.js";
// P1 film · 3 · the sun behind the car (3.0 s): it rolls slowly towards the lens, the lens backing away with it.
let CAR, UN = [];
const car = (t) => [842, 10, 5590 + 10 * t];
const cam = cameraPath({ keys: Array.from({ length: Math.round(3 / 0.25) + 1 }, (_, i) => i * 0.25).map((t) => ({ t, pos: [853, 4, 5740 + 10 * t], look: [842, 21, 5560 + 10 * t], fov: 28, focus: ((p) => [p[0], p[1], p[2] + 9])(car(t)) })) });
export default {
  name: "f3", size: [2160, 3840], fps: 30, duration: 3, shutter: 0.12,
  camera: cam, lens: { fstop: 32, scale: 1.45 },
  look: { sky: { top: "#4c62b8", mid: "#f29a7a", hor: "#ffc06a" }, fog: { color: "#f7b98a", near: 800, far: 6000 }, bounce: "#d98c66", bounceK: 0.3, domeK: 0.35, domeSunGlow: 1.6, tone: 0.06, minRough: 0.7, bump: 0.03 },
  sun: { az: 180, el: 10, color: "#ffad62", intensity: 3.6, radius: 1.2 },
  shadow: { centre: [842, 0, 5600], ext: 260 },
  post: { tonemap: "neutral", exposure: 1.1, bloomK: 0.16, bloomThr: 0.85, vig: 0.26, grain: 0.022, lut: "cromatic-diorama", sat: 1.2, power: 1.08 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: false }); UN.push(paintSky(ctx, { top: "#4c62b8", mid: "#f29a7a", hor: "#ffc06a", lit: "#ffc58e", shade: "#8b5f8e", glow: 180, clouds: 0.42, stars: 0, sun: { az: 180, el: 10, size: 2.2, color: "#fff0c0" } })); },
  pose(t) { const p = car(t); CAR.place(p[0], 1.2, p[2], 0, 10 * t); },
  dispose() { CAR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
