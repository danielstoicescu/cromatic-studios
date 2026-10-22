// Story A in diorama · 4 · Slow Coffee, "building": the dome from high in the south-east, the city behind it, at
// sunset; a slow arc (A6's "scf" camera, carried on smoothly). Whips in. Focus on the dome's near face.
import { cameraPath, whip } from "../../src/camera.js";
import { GOLDEN, secs, hideMapRide } from "./common.js";
const D = secs("scf"), W = 0.15, F = [1192, 34, 5172];
let UNRIDE = null;
const L3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const keys = [W, D / 2, D].map((t) => { const u = t / 1.9; return { t, pos: L3([1528, 168, 4690], [1462, 150, 4728], u), look: L3([1100, 30, 5300], [1098, 28, 5296], u), fov: 55, focus: F }; });
export default {
  name: "scf", size: [1080, 1920], fps: 30, duration: D, shutter: 0.5,
  camera: whip(cameraPath({ keys }), { at: "start", deg: 60, dur: W }),
  lens: { fstop: 3.5, scale: 1.45 },
  ...GOLDEN,
  shadow: { centre: [1100, 0, 5250], ext: 900 },
  async prepare(ctx) { UNRIDE = hideMapRide(ctx.S); },
  dispose() { UNRIDE && UNRIDE(); }
};
