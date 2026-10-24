import { mapRide, world, paintSky, track, dur, L3, asphalt, tilt } from "./common.js";
// E8 · chrome · the Chrome racer on the roundabout at sunset, the fountain behind it: a slow low arc round its nose,
// the low sun glinting off the polished body.
const D = dur("chrome"), C = [1500, 9, 4330], R = 150;
let RIDE, UN = [];
const CAM = track(D, (t) => { const a = -0.66 + 0.12 * (t / D); return { pos: [C[0] + Math.sin(a) * R, 5, C[2] + Math.cos(a) * R], look: [C[0], 11, C[2]], fov: 50, focus: [C[0] + Math.sin(a) * 14, 9, C[2] + Math.cos(a) * 14] }; });
export default {
  name: "chrome", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: CAM,
  lens: { fstop: 22, scale: 1.45, plane: tilt(CAM, (t) => { const a = -0.66 + 0.12 * (t / D); return [C[0] + Math.sin(a) * 14, 9, C[2] + Math.cos(a) * 14]; }, 45) },
  look: { sky: { top: "#8a90bc", mid: "#e2aaae", hor: "#ffbe84" }, fog: { color: "#e8b8a0", near: 280, far: 2500 }, bounce: "#c8806a", bounceK: 0.56, domeK: 0.29, domeSunGlow: 1.4, tone: 0.05, minRough: 0.62, bump: 0.03 },
  sun: { az: 300, el: 8, color: "#ffac66", intensity: 3.6, radius: 1.3 },
  shadow: { centre: [1490, 0, 4320], ext: 260 },
  post: { tonemap: "agx", exposure: 1.22, bloomK: 0.12, bloomThr: 0.85, vig: 0.3, grain: 0.024, lut: "cromatic-diorama", lutMix: 0.8, sat: 1.12, power: 1.08 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(asphalt(ctx)); RIDE = await mapRide(ctx.S, "monopoly"); RIDE.lights(false); UN.push(paintSky(ctx, { top: "#4c62b8", mid: "#e09aa8", hor: "#ffb878", lit: "#ffc690", shade: "#8b6a9a", glow: 300, clouds: 0.45, stars: 0, sun: { az: 300, el: 8, size: 2, color: "#fff0c0" } })); },
  pose() { RIDE.place(C[0], 1.73, C[2], Math.PI / 2); },
  subject: () => RIDE.g,
  dispose() { RIDE?.restore(); UN.forEach((f) => f()); UN = []; }
};
