import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet } from "./common.js";
const still = (pos, look, fov, extra = {}) => cameraPath({ keys: [{ t: 0, pos, look, fov, ...extra }, { t: 1, pos, look, fov, ...extra }] });
// P1 · 5 · neon night after rain: Fintech Boulevard, the windows and lamps mirrored in the wet asphalt, the car's lamps.
let CAR, UN = [], KEY, WET;
export default {
  name: "s5", size: [2160, 3840], fps: 30, duration: 1, shutter: 0.5,
  camera: still([2070, 4, 4720], [2076, 14, 4560], 30, { focus: [2079, 9, 4590] }),
  lens: { fstop: 11, scale: 1.45 },
  ...NIGHT, post: { ...NIGHT.post, exposure: 1.7, bloomK: 0.16, sat: 1.18 },
  shadow: { centre: [2075, 0, 4600], ext: 300 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(0); CAR.place(2079, 1.2, 4580, 0, 0); KEY = followKey(ctx, 500, 200); KEY.at(2058, 46, 4640); WET = wet(ctx, { centre: [2075, 0, 4500], r: 700, rough: 0.16, refl: 0.12 }); UN.push(paintSky(ctx, { top: "#070b26", mid: "#1c2257", hor: "#6a4a8a", lit: "#b98aa0", shade: "#22264f", glow: 180, clouds: 0.3, stars: 1 })); },
  dispose() { CAR?.dispose(); KEY?.dispose(); WET?.dispose(); UN.forEach((f) => f()); UN = []; }
};
