import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet } from "./common.js";
const still = (pos, look, fov, extra = {}) => cameraPath({ keys: [{ t: 0, pos, look, fov, ...extra }, { t: 1, pos, look, fov, ...extra }] });
// P1 · 1 · sunrise over Cromatic City: high from the south-west, the dome and Coffee Street below, the sun just up on
// the horizon in a painted dawn (rose, gold), long shadows across the blocks.
let UN = [];
export default {
  name: "s1", size: [2160, 3840], fps: 30, duration: 1, shutter: 0.5,
  camera: still([520, 380, 6420], [1050, 30, 5150], 48, { focus: [1000, 30, 5300] }),
  lens: { fstop: 4, scale: 1.45 },
  look: { sky: { top: "#3d58a6", mid: "#f0a2b0", hor: "#ffcc8a" }, fog: { color: "#f6c2b4", near: 1500, far: 9000 }, bounce: "#e3a487", bounceK: 0.42, domeK: 0.62, domeSunGlow: 1.2, tone: 0.06, minRough: 0.7, bump: 0.03 },
  sun: { az: 157, el: 4, color: "#ffb47a", intensity: 3.4, radius: 1.3 },
  shadow: { centre: [980, 0, 5400], ext: 1400 },
  post: { tonemap: "neutral", exposure: 1.3, bloomK: 0.12, bloomThr: 0.9, vig: 0.22, grain: 0.02, lut: "cromatic-diorama", sat: 1.22, power: 1.08 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(hideMapRide(ctx.S)); const u = paintSky(ctx, { top: "#3d58a6", mid: "#f0a2b0", hor: "#ffcc8a", lit: "#ffd0a0", shade: "#9a77b0", glow: 157, clouds: 0.5, stars: 0, sun: { az: 157, el: 4, size: 1.9, color: "#fff2c6" } }); UN.push(u); },
  dispose() { UN.forEach((f) => f()); UN = []; }
};
