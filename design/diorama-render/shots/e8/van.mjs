import { mapRide, world, paintSky, track, dur, hideNear , asphalt } from "./common.js";
// E8 · van · the Mystery van on the street by Kompus and OMA, late afternoon: the lens trucking alongside at its speed,
// a front three-quarter that opens slowly to its side, the warm sun raking its flank.
const D = dur("van"), V = 12, van = (t) => ({ x: 821, z: 4560 - V * t });
let RIDE, UN = [];
export default {
  name: "van", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: track(D, (t) => { const p = van(t), u = t / D; return { pos: [p.x + 125 + 28 * u, 6, p.z - 210 + 39 * u], look: [p.x + 2, 12, p.z - 4], fov: 32, focus: [p.x + 10, 11, p.z - 14] }; }),
  lens: { fstop: 22, scale: 1.45 },
  look: { sky: { top: "#97a5c8", mid: "#dcc0c4", hor: "#ffd6ac" }, fog: { color: "#ecccb8", near: 700, far: 5200 }, bounce: "#d2a080", bounceK: 0.62, domeK: 0.34, domeSunGlow: 0.9, tone: 0.05, minRough: 0.62, bump: 0.03 },
  sun: { az: 70, el: 17, color: "#ffc994", intensity: 3.8, radius: 1.4 },
  shadow: { centre: [840, 0, 4490], ext: 260 },
  post: { tonemap: "agx", exposure: 1.22, bloomK: 0.08, bloomThr: 0.95, vig: 0.22, grain: 0.024, lut: "cromatic-diorama", lutMix: 0.6, sat: 1.12, power: 1.04 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(asphalt(ctx)); RIDE = await mapRide(ctx.S, "groovy"); RIDE.lights(false); UN.push(hideNear(ctx, [[851, 4406, 30], [880, 4440, 30], [900, 4420, 30]])); UN.push(paintSky(ctx, { top: "#5a7ed6", mid: "#d6b4c8", hor: "#ffd2a6", lit: "#ffdcb4", shade: "#a693b8", glow: 70, clouds: 0.42, stars: 0 })); },
  pose(t) { const p = van(t); RIDE.place(p.x, 1.73, p.z, Math.PI); },
  subject: () => RIDE.g,
  dispose() { RIDE?.restore(); UN.forEach((f) => f()); UN = []; }
};
