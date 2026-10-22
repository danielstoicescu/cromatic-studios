// Story A in diorama · 2 · Steam, "place": the coffee street at Steam (its tower, its sign), the hero Dacia parked at
// the kerb, lamps off; the camera low, sliding and turning (A6's "steam" camera, level, its lens shifted up), never at
// rest; it whips in and out. Focus on the car, Steam's shopfront close behind it.
import { cameraPath, whip } from "../../src/camera.js";
import { GOLDEN, secs, heroCar, hideMapRide } from "./common.js";
const D = secs("steam"), W = 0.15;
const L3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
let CAR = null, UNRIDE = null;
const keys = [W, (D) / 2, D - W].map((t) => { const u = t / D, pos = L3([786, 9, 5436], [800, 10.5, 5452], u), tg = L3([940, 15, 5640], [952, 18, 5636], u); return { t, pos, look: [tg[0], pos[1], tg[2]], fov: 60, focus: [852, 11, 5562] }; });
export default {
  name: "steam", size: [1080, 1920], fps: 30, duration: D, shutter: 0.5, shift: [0, 0.13],
  camera: whip(whip(cameraPath({ keys }), { at: "start", deg: 60, dur: W }), { at: "end", deg: 60, dur: W }),
  lens: { fstop: 16, scale: 1.45 },
  ...GOLDEN,
  shadow: { centre: [860, 0, 5560], ext: 380 },
  async prepare(ctx) { UNRIDE = hideMapRide(ctx.S); CAR = await heroCar(ctx, { lights: false }); CAR.place(842, 1.2, 5545, 0); },
  beforePrepare(ctx, on) { CAR.group.visible = !on; },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); }
};
