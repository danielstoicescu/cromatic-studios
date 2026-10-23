import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet, mirror, sakuraRow, focusOnCar, L3 } from "./common.js";
// P1 film · 5 · neon night after rain (3.0 s): Fintech Boulevard, the car coming on slowly, mirrored in the street.
let CAR, UN = [], KEY, WET, MIR;
const car = (t) => [2079, 9, 4560 + 13 * t];
const cam = cameraPath({ keys: Array.from({ length: Math.round(3 / 0.25) + 1 }, (_, i) => i * 0.25).map((t) => ({ t, pos: [2070, 4, 4720 + 5 * (t / 3)], look: [2076, 14, 4560], fov: 30, focus: ((p) => [p[0], p[1], p[2] + 10])(car(t)) })) });
export default {
  name: "f5", size: [2160, 3840], fps: 30, duration: 3, shutter: 0.12,
  camera: cam, lens: { fstop: 22, scale: 1.45 },
  ...NIGHT, post: { ...NIGHT.post, exposure: 1.7, bloomK: 0.16, sat: 1.18 },
  shadow: { centre: [2075, 0, 4600], ext: 300 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(0); KEY = followKey(ctx, 500, 200); WET = wet(ctx, { centre: [2075, 0, 4500], r: 700, rough: 0.3, refl: 0.06 }); MIR = await mirror(ctx, { centre: [2075, 0, 4560], size: 1400, opacity: 0.5, y: 1.4 }); UN.push(paintSky(ctx, { top: "#070b26", mid: "#1c2257", hor: "#6a4a8a", lit: "#b98aa0", shade: "#22264f", glow: 180, clouds: 0.3, stars: 1 })); },
  pose(t) { const p = car(t); CAR.place(p[0], 1.2, p[2], 0, 13 * t); KEY.at(2058, 46, p[2] + 60); },
  dispose() { CAR?.dispose(); KEY?.dispose(); WET?.dispose(); MIR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
