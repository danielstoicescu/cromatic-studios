import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet } from "./common.js";
const still = (pos, look, fov, extra = {}) => cameraPath({ keys: [{ t: 0, pos, look, fov, ...extra }, { t: 1, pos, look, fov, ...extra }] });
// P1 · 4 · dusk on Coffee Street: from behind, the car driving away under a pink and orange painted sky, lamps on.
let CAR, UN = [], KEY;
export default {
  name: "s4", size: [2160, 3840], fps: 30, duration: 1, shutter: 0.5,
  camera: still([842, 10, 5470], [842, 9, 5780], 48, { focus: [842, 8, 5600] }),
  lens: { fstop: 8, scale: 1.45 },
  look: { sky: { top: "#2a2f7c", mid: "#c86a9e", hor: "#ff9a58" }, fog: { color: "#7a5a8a", near: 900, far: 6000 }, bounce: "#7a5070", bounceK: 0.2, domeK: 0.9, domeSunGlow: 1.2, tone: 0.06, minRough: 0.68, bump: 0.03 },
  sun: { az: 8, el: 3, color: "#ff8a58", intensity: 0.9, radius: 3 },
  shadow: { centre: [842, 0, 5650], ext: 400 },
  post: { tonemap: "neutral", exposure: 1.6, bloomK: 0.12, bloomThr: 0.85, vig: 0.28, grain: 0.024, lut: "cromatic-night", sat: 1.2, power: 1.06 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(9000); CAR.place(842, 1.2, 5600, 0, 0); KEY = followKey(ctx, 1200, 220); KEY.at(826, 30, 5560); UN.push(paintSky(ctx, { top: "#2a2f7c", mid: "#c86a9e", hor: "#ff9a58", lit: "#ffb27a", shade: "#5a3d7c", glow: 8, clouds: 0.5, stars: 0.4 })); },
  dispose() { CAR?.dispose(); KEY?.dispose(); UN.forEach((f) => f()); UN = []; }
};
