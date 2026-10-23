import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet, mirror, sakuraRow, focusOnCar, L3 } from "./common.js";
// P1 film · 6 · the fountain after rain (2.0 s): the car going round the ring past the lens, the fountain behind.
let CAR, UN = [], KEY, WET, MIR;
const ang = (t) => 0.42 - 0.24 * t, at = (a) => [1500 + 70 * Math.cos(a), 9, 4260 + 70 * Math.sin(a)];
const car = (t) => at(ang(t));
const cam = cameraPath({ keys: Array.from({ length: Math.round(2 / 0.25) + 1 }, (_, i) => i * 0.25).map((t) => ({ t, pos: [1690, 26, 4334], look: [1500, 8, 4250], fov: 40, focus: car(t) })) });
export default {
  name: "f6", size: [2160, 3840], fps: 30, duration: 2, shutter: 0.12,
  camera: cam, lens: { fstop: 22, scale: 1.45 },
  ...NIGHT, post: { ...NIGHT.post, exposure: 1.8, bloomK: 0.15, sat: 1.16 },
  shadow: { centre: [1520, 0, 4260], ext: 300 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(0); KEY = followKey(ctx, 450, 220); KEY.at(1600, 46, 4320); WET = wet(ctx, { centre: [1520, 0, 4260], r: 400, rough: 0.3, refl: 0.06 }); MIR = await mirror(ctx, { centre: [1520, 0, 4270], size: 1400, opacity: 0.45 }); UN.push(paintSky(ctx, { top: "#070b26", mid: "#1c2257", hor: "#5d4a7e", lit: "#b98aa0", shade: "#22264f", glow: 200, clouds: 0.34, stars: 1 })); },
  pose(t) { const a = ang(t), p = at(a); CAR.place(p[0], 1.2, p[2], Math.atan2(Math.sin(a), -Math.cos(a)), (0.42 - a) * 70); },
  dispose() { CAR?.dispose(); KEY?.dispose(); WET?.dispose(); MIR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
