import { mapRide, world, paintSky, track, dur, tilt, shake } from "./common.js";
// E8 · t3 · the Classic Formula on Fintech Boulevard on race day, a hard midday sun: the lens on the tarmac, backing away
// in front of the car at its speed, the windmill and the towers soft behind.
const D = dur("t3"), V = 30, car = (t) => ({ x: 2079, z: 4640 + V * t });
let RIDE, UN = [];
const CAM = track(D, (t) => { const p = car(t); return { pos: [p.x - 24, 3.4, p.z + 150], look: [p.x + 1.5, 7, p.z - 2], fov: 26, focus: [p.x - 4, 5, p.z + 14] }; });
export default {
  name: "t3", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: CAM,
  lens: { fstop: 22, scale: 1.45, plane: tilt(CAM, (t) => { const p = car(t); return [p.x - 4, 5, p.z + 14]; }, 24) },
  look: { sky: { top: "#7898cc", mid: "#a6bee0", hor: "#dde6ee" }, fog: { color: "#cfdbe8", near: 240, far: 2600 }, bounce: "#d79a80", bounceK: 0.5, domeK: 0.5, domeSunGlow: 0.5, tone: 0.05, minRough: 0.6, bump: 0.03 },
  sun: { az: 238, el: 46, color: "#fff4e2", intensity: 4.4, radius: 1.2 },
  shadow: { centre: [2079, 0, 4700], ext: 300 },
  post: { tonemap: "agx", exposure: 1.18, bloomK: 0.07, bloomThr: 0.95, vig: 0.2, grain: 0.022, lut: "cromatic-diorama", lutMix: 0.75, sat: 1.14, power: 1.08 },
  async prepare(ctx) { await world(ctx.S, "circuit"); RIDE = await mapRide(ctx.S, "f1"); RIDE.lights(false); UN.push(paintSky(ctx, { top: "#2f6fd6", mid: "#7fb0ee", hor: "#d6e4f2", lit: "#ffffff", shade: "#b4c4dc", glow: 238, clouds: 0.35, stars: 0 })); },
  pose(t) { const p = car(t), s = shake(t, 0.02, 2); RIDE.place(p.x, 1.73 + s.dy, p.z, 0, s.pitch, s.roll); }, // (E8b: the engine's shake, a hair)
  subject: () => RIDE.g,
  dispose() { RIDE?.restore(); UN.forEach((f) => f()); UN = []; }
};
