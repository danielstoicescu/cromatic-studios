import { cameraPath, whip } from "../../src/camera.js";
import { NIGHT, nightSky, heroCar, hideMapRide, mapRide, followKey, world, secs, L3 } from "./common.js";
// D7 · Snoop. (r2): the Mystery van at the roundabout at night (the map's own), the lens sliding across it and
// levelling its tilt (D6's 2D dolly and roll made a camera move).
const D = secs("r2");
let RIDE, KEY, UNSKY;
export default {
  name: "r2", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: cameraPath({ keys: [0, D / 2, D].map((t) => { const u = t / D; return { t, pos: [1512 + 16 * (0.5 - u), 10, 4522 - 6 * (0.5 - u)], look: [1500, 13, 4332], fov: 34, roll: -4 + 3 * u, focus: [1500, 12, 4332] }; }) }),
  lens: { fstop: 11, scale: 1.45 }, ...NIGHT, shadow: { centre: [1500, 0, 4330], ext: 260 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); RIDE = await mapRide(ctx.S, "groovy"); RIDE.lights(true); KEY = followKey(ctx, 700, 200); UNSKY = nightSky(ctx); },
  pose(t) { RIDE.place(1500, 1.73, 4330, 1.5708); KEY.at(1515, 50, 4430); },
  dispose() { RIDE?.restore(); KEY?.dispose(); UNSKY?.(); }
};
