import { cameraPath, whip } from "../../src/camera.js";
import { NIGHT, nightSky, heroCar, hideMapRide, mapRide, followKey, world, secs, L3 } from "./common.js";
// D7 · Drive. (r1): the hero Dacia at night from its bumper, low, lamps on; it rolls towards the lens and the lens
// backs away with it (a tracking shot, where D6 pushed a still); whips in.
const D = secs("r1"), V = 22;
let CAR, UNRIDE, KEY, UNSKY;
const cam = (t) => ({ pos: [846, 4, 4590 + V * t], look: [823, 10, 4500 + V * t] });
export default {
  name: "r1", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: whip(cameraPath({ keys: [0.15, D / 2, D].map((t) => ({ t, ...cam(t), fov: 50 - 2 * (t / D), focus: [823, 9, 4532 + V * t] })) }), { at: "start", deg: 60, dur: 0.15 }),
  lens: { fstop: 11, scale: 1.45 }, ...NIGHT, shadow: { ext: 260 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); UNRIDE = hideMapRide(ctx.S); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(2200); KEY = followKey(ctx, 700, 180); UNSKY = nightSky(ctx); },
  pose(t) { const z = 4500 + V * Math.max(0, t); CAR.place(823, 1.2, z, 0, z - 4500); KEY.at(850, 30, z + 70); },
  dispose() { CAR?.dispose(); UNRIDE?.(); KEY?.dispose(); UNSKY?.(); }
};
