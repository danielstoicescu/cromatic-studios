import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet } from "./common.js";
const still = (pos, look, fov, extra = {}) => cameraPath({ keys: [{ t: 0, pos, look, fov, ...extra }, { t: 1, pos, look, fov, ...extra }] });
// P1 · 3 · the sun through the windshield: low in front of the car, the setting sun right behind it in the painted sky.
let CAR, UN = [];
export default {
  name: "s3", size: [2160, 3840], fps: 30, duration: 1, shutter: 0.5,
  camera: still([853, 4, 5740], [842, 21, 5560], 28, { focus: [842, 10, 5604] }),
  lens: { fstop: 32, scale: 1.45 },
  look: { sky: { top: "#4c62b8", mid: "#f29a7a", hor: "#ffc06a" }, fog: { color: "#f7b98a", near: 800, far: 6000 }, bounce: "#d98c66", bounceK: 0.3, domeK: 0.35, domeSunGlow: 1.6, tone: 0.06, minRough: 0.7, bump: 0.03 },
  sun: { az: 180, el: 10, color: "#ffad62", intensity: 3.6, radius: 1.2 },
  shadow: { centre: [842, 0, 5590], ext: 260 },
  post: { tonemap: "neutral", exposure: 1.1, bloomK: 0.16, bloomThr: 0.85, vig: 0.26, grain: 0.022, lut: "cromatic-diorama", sat: 1.2, power: 1.08 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: false }); CAR.place(842, 1.2, 5600, 0, 0); UN.push(paintSky(ctx, { top: "#4c62b8", mid: "#f29a7a", hor: "#ffc06a", lit: "#ffc58e", shade: "#8b5f8e", glow: 180, clouds: 0.42, stars: 0, sun: { az: 180, el: 10, size: 2.2, color: "#fff0c0" } })); },
  dispose() { CAR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
