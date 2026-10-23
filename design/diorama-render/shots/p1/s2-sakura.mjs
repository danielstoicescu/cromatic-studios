import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet } from "./common.js";
const still = (pos, look, fov, extra = {}) => cameraPath({ keys: [{ t: 0, pos, look, fov, ...extra }, { t: 1, pos, look, fov, ...extra }] });
// P1 · 2 · the Sakura world in the morning: the hero Dacia coming towards a low lens under the blossom, petals in the air.
let CAR, UN = [], PET;
export default {
  name: "s2", size: [2160, 3840], fps: 30, duration: 1, shutter: 0.5,
  camera: still([856, 7, 5262], [826, 20, 5560], 42, { focus: [842, 10, 5440] }),
  lens: { fstop: 11, scale: 1.45 },
  look: { sky: { top: "#8db2f0", mid: "#f6cfe0", hor: "#ffe2d2" }, fog: { color: "#f7dbe6", near: 600, far: 5200 }, bounce: "#f1c4cf", bounceK: 0.4, domeK: 0.55, domeSunGlow: 0.8, tone: 0.06, minRough: 0.68, bump: 0.03 },
  sun: { az: 65, el: 22, color: "#ffe2c6", intensity: 3.2, radius: 2 },
  shadow: { centre: [830, 0, 5440], ext: 320 },
  post: { tonemap: "neutral", exposure: 1.12, bloomK: 0.1, bloomThr: 0.9, vig: 0.2, grain: 0.02, lut: "cromatic-diorama", sat: 1.18, power: 1.05 },
  async prepare(ctx) { await world(ctx.S, "orchid"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: false }); CAR.place(842, 1.2, 5440, Math.PI, 0); PET = petals(ctx, { centre: [838, 0, 5400], half: [60, 110], height: 60, n: 260 }); UN.push(paintSky(ctx, { top: "#8db2f0", mid: "#f6cfe0", hor: "#ffe2d2", lit: "#fff0f4", shade: "#d9b4cf", glow: 65, clouds: 0.38, stars: 0 })); },
  pose(t) { PET.pose(2.2 + t); },
  dispose() { CAR?.dispose(); PET?.dispose(); UN.forEach((f) => f()); UN = []; }
};
