import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet, mirror } from "./common.js";
const still = (pos, look, fov, extra = {}) => cameraPath({ keys: [{ t: 0, pos, look, fov, ...extra }, { t: 1, pos, look, fov, ...extra }] });
// P1 · 6 · the fountain at night after rain: the roundabout lit, the city doubled in the street, the car going round.
let CAR, UN = [], KEY, WET, MIR;
export default {
  name: "s6", size: [2160, 3840], fps: 30, duration: 1, shutter: 0.5,
  camera: still([1690, 26, 4334], [1500, 8, 4250], 40, { focus: [1568, 8, 4268] }),
  lens: { fstop: 22, scale: 1.45 },
  ...NIGHT, post: { ...NIGHT.post, exposure: 1.8, bloomK: 0.15, sat: 1.16 },
  shadow: { centre: [1520, 0, 4260], ext: 300 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(0); const a = 0.12, x = 1500 + 70 * Math.cos(a), z = 4260 + 70 * Math.sin(a); CAR.place(x, 1.2, z, Math.atan2(Math.sin(a), -Math.cos(a)), 0); KEY = followKey(ctx, 450, 220); KEY.at(1600, 46, 4320); WET = wet(ctx, { centre: [1520, 0, 4260], r: 400, rough: 0.3, refl: 0.06 }); MIR = await mirror(ctx, { centre: [1520, 0, 4270], size: 1400, opacity: 0.45 }); UN.push(paintSky(ctx, { top: "#070b26", mid: "#1c2257", hor: "#5d4a7e", lit: "#b98aa0", shade: "#22264f", glow: 200, clouds: 0.34, stars: 1 })); },
  dispose() { CAR?.dispose(); KEY?.dispose(); WET?.dispose(); MIR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
