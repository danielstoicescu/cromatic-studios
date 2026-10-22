// Story A in diorama · 1 · the opening: straight down on the hero Dacia driving up the coffee street (A6's "over"),
// the camera holding on it. A6 aimed this with a lookAt at the point below the lens and its picture spun ~70 degrees as
// the drone drifted; here the picture's top is the street's heading (yaw 0: +z), the roll a slow -4 -> +3 degrees.
// A tilted plane of focus across the street at the car (it travels with it): the band of the car sharp, the street
// ahead and behind melting away, as a tilt-shift lens does from above. Lamps on (it is driving). Whips out at the end.
import { cameraPath, whip } from "../../src/camera.js";
import { GOLDEN, secs, heroCar, hideMapRide } from "./common.js";
const D = secs("over"), W = 0.15, V = 62, Z0 = 5478;
const carZ = (t) => Z0 + V * t;
let CAR = null, UNRIDE = null;
const keys = [0, D / 2, D - W].map((t) => ({ t, pos: [842 + 4 * (t / D), 300, carZ(t) + 18], look: [842, 0, carZ(t) + 18.5], yaw: 0, roll: -4 + 7 * (t / D), fov: 52, focus: 300 }));
export default {
  name: "over", size: [1080, 1920], fps: 30, duration: D, shutter: 0.5,
  camera: whip(cameraPath({ keys }), { at: "end", deg: 60, dur: W }),
  lens: { fstop: 2.8, scale: 1.45, plane: (t) => { const z = carZ(Math.min(t, D - W)); return [[780, 2, z], [900, 2, z], [842, 220, z + 200]]; } },
  ...GOLDEN, look: { ...GOLDEN.look }, sun: { ...GOLDEN.sun, az: 120, el: 42 },
  shadow: { ext: 420 },
  async prepare(ctx) { UNRIDE = hideMapRide(ctx.S); CAR = await heroCar(ctx, { lights: true }); },
  pose(t) { const tt = Math.min(t, D); CAR.place(842, 1.2, carZ(tt), 0); },
  beforePrepare(ctx, on) { CAR.group.visible = !on; },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); }
};
