import { cameraPath, whip } from "../../src/camera.js";
import { NIGHT, nightSky, heroCar, hideMapRide, mapRide, followKey, world, secs, L3 } from "./common.js";
// D7 · Pass Go. (r4): the chrome racer (the map's Monopoly ride) in front of The Aesthetic Court's pop-up at night
// (beta 4.5, Ilinca's TASK-114), low on the red carpet, a slow push; it whips out.
const D = secs("r4");
let RIDE, KEY, UNSKY;
export default {
  name: "r4", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: whip(cameraPath({ keys: [0, D / 2, D - 0.15].map((t) => { const u = t / D; return { t, pos: L3([1563, 7, 4452], [1570, 7.3, 4459], u), look: [1652, 12, 4542], fov: 36, focus: [1650, 9, 4540] }; }) }), { at: "end", deg: -60, dur: 0.15 }),
  lens: { fstop: 11, scale: 1.45 }, ...NIGHT, shadow: { centre: [1680, 0, 4560], ext: 260 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); RIDE = await mapRide(ctx.S, "monopoly"); RIDE.lights(true); KEY = followKey(ctx, 1600, 320); UNSKY = nightSky(ctx); },
  pose() { RIDE.place(1650, 1.73, 4540, -0.6); KEY.at(1590, 50, 4470); },
  dispose() { RIDE?.restore(); KEY?.dispose(); UNSKY?.(); }
};
