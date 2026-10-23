import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet, mirror, sakuraRow, focusOnCar, L3 } from "./common.js";
// P1 film · 4 · dusk on Coffee Street (3.0 s): the car driving away, the lens following, lamps on.
let CAR, UN = [], KEY;
const car = (t) => [842, 9, 5590 + 30 * t];
const cam = cameraPath({ keys: Array.from({ length: Math.round(3 / 0.25) + 1 }, (_, i) => i * 0.25).map((t) => ({ t, pos: [842, 10, 5470 + 20 * t], look: [842, 9, 5780 + 20 * t], fov: 48, focus: car(t) })) });
export default {
  name: "f4", size: [2160, 3840], fps: 30, duration: 3, shutter: 0.12,
  camera: cam, lens: { fstop: 22, scale: 1.45 },
  look: { sky: { top: "#2a2f7c", mid: "#c86a9e", hor: "#ff9a58" }, fog: { color: "#7a5a8a", near: 900, far: 6000 }, bounce: "#7a5070", bounceK: 0.2, domeK: 0.9, domeSunGlow: 1.2, tone: 0.06, minRough: 0.68, bump: 0.03 },
  sun: { az: 8, el: 3, color: "#ff8a58", intensity: 0.9, radius: 3 },
  shadow: { centre: [842, 0, 5680], ext: 400 },
  post: { tonemap: "neutral", exposure: 1.6, bloomK: 0.12, bloomThr: 0.85, vig: 0.28, grain: 0.024, lut: "cromatic-night", sat: 1.2, power: 1.06 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(9000); KEY = followKey(ctx, 1200, 220); UN.push(paintSky(ctx, { top: "#2a2f7c", mid: "#c86a9e", hor: "#ff9a58", lit: "#ffb27a", shade: "#5a3d7c", glow: 8, clouds: 0.5, stars: 0.4 })); },
  pose(t) { const p = car(t); CAR.place(p[0], 1.2, p[2], 0, 30 * t); KEY.at(826, 30, p[2] - 40); },
  dispose() { CAR?.dispose(); KEY?.dispose(); UN.forEach((f) => f()); UN = []; }
};
