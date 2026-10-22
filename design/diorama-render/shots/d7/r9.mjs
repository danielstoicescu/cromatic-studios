import { cameraPath, whip } from "../../src/camera.js";
import { NIGHT, nightSky, heroCar, hideMapRide, mapRide, followKey, world, secs, L3 } from "./common.js";
// D7 · Dive. (r9): the map's sub under water (the Underwater world), from below, nosing forward slowly, bobbing.
const D = secs("r9");
let RIDE, KEY;
export default {
  name: "r9", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: cameraPath({ keys: [0, D / 2, D].map((t) => { const u = t / D; return { t, pos: [884 - 4 * u, 5, 4572 - 6 * u], look: [823, 20, 4500], fov: 58, roll: -3 + 5 * u, focus: [823, 14, 4505] }; }) }),
  lens: { fstop: 8, scale: 1.45 },
  look: { sky: { top: "#0b4f6e", mid: "#1d7f96", hor: "#2aa3a8" }, fog: { color: "#126779", near: 120, far: 1500 }, bounce: "#1d6f7a", bounceK: 0.35, domeK: 0.6, domeSunGlow: 0.4, tone: 0.05, minRough: 0.6, bump: 0.02 },
  sun: { az: 160, el: 70, color: "#bff6ff", intensity: 2.0, radius: 6 },
  post: { tonemap: "neutral", exposure: 1.25, bloomK: 0.1, bloomThr: 0.9, vig: 0.32, grain: 0.024, lut: "cromatic-diorama", sat: 1.05, power: 1.06 },
  shadow: { centre: [823, 0, 4500], ext: 220 },
  async prepare(ctx) { await world(ctx.S, "underwater"); RIDE = await mapRide(ctx.S, "sub"); RIDE.lights(true); KEY = followKey(ctx, 700, 160); },
  pose(t) { RIDE.place(823, 1.73 + 1.2 * Math.sin(t * 2.1), 4500 + 6 * t, 0.6, 0.03 * Math.sin(t * 1.7)); KEY.at(850, 30, 4540); },
  dispose() { RIDE?.restore(); KEY?.dispose(); }
};
