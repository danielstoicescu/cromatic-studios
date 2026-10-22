import { cameraPath, whip } from "../../src/camera.js";
import { NIGHT, nightSky, heroCar, hideMapRide, mapRide, followKey, world, secs, L3 } from "./common.js";
// D7 · See you around. (fount): the roundabout at night from a little above the plaza, the fountain playing (the
// map's own jets, on the story's clock), the hero Dacia going round in front, lamps on; a slow push. Runs 30 frames
// (60 fps) into the end card, as D6's did.
import { T7 } from "./common.js";
const D = (T7.fount[1] - T7.fount[0] + 30) / 60, RING = { c: [1500, 4260], r: 70 };
const ringAt = (a) => ({ x: RING.c[0] + RING.r * Math.cos(a), z: RING.c[1] + RING.r * Math.sin(a), yaw: Math.atan2(Math.sin(a), -Math.cos(a)) });
// D's pass: from 0.95 to -0.75 rad over 40 frames at 30 (1.33 s); here over the shot, a little slower
const ang = (t) => 0.95 - 1.7 * Math.min(1, Math.max(0, t / (D * 0.8)));
let CAR, UNRIDE, KEY, UNSKY;
export default {
  name: "fount", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: cameraPath({ keys: [0, D / 2, D].map((t) => { const u = t / D; return { t, pos: L3([1680, 22, 4300], [1673, 21.5, 4298], u), look: [1500, 6, 4250], fov: 55 - 1.8 * u, focus: [1560, 8, 4265] }; }) }),
  lens: { fstop: 8, scale: 1.45 }, ...NIGHT, shadow: { centre: [1520, 0, 4260], ext: 300 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); UNRIDE = hideMapRide(ctx.S); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(5000); KEY = followKey(ctx, 700, 260); UNSKY = nightSky(ctx); },
  pose(t) { const a = ang(Math.max(0, t)), p = ringAt(a); CAR.place(p.x, 1.2, p.z, p.yaw, (0.95 - a) * RING.r); KEY.at(1640, 40, 4290); },
  dispose() { CAR?.dispose(); UNRIDE?.(); KEY?.dispose(); UNSKY?.(); }
};
