import { heroCar, hideMapRide, world, paintSky, track, dur , asphalt } from "./common.js";
// E8 · t1 · the 1300 on Coffee Street at golden hour: it rolls towards a low lens that backs away with it (a tracking
// shot: the car holds its place in the frame, the street slides by), front three-quarter, the low sun on its flank.
const D = dur("t1"), V = 14, car = (t) => [842, 9, 5520 + V * t];
let CAR, UN = [];
export default {
  name: "t1", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: track(D, (t) => { const p = car(t); return { pos: [p[0] + 54, 5.5, p[2] + 146], look: [p[0] + 0.1, 10.5, p[2] + 4.9], fov: 32, focus: [p[0] + 14, 9, p[2] + 20] }; }),
  lens: { fstop: 22, scale: 1.45 },
  look: { sky: { top: "#9aa6c8", mid: "#e6c4c4", hor: "#ffd6a8" }, fog: { color: "#efc9b2", near: 700, far: 5200 }, bounce: "#d8a07a", bounceK: 0.62, domeK: 0.29, domeSunGlow: 1.1, tone: 0.05, minRough: 0.62, bump: 0.03 },
  sun: { az: 34, el: 15, color: "#ffbe82", intensity: 3.9, radius: 1.3 },
  shadow: { centre: [842, 0, 5560], ext: 300 },
  post: { tonemap: "agx", exposure: 1.25, bloomK: 0.1, bloomThr: 0.9, vig: 0.24, grain: 0.024, lut: "cromatic-diorama", lutMix: 0.6, sat: 1.12, power: 1.04 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(asphalt(ctx)); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: false, scale: 12.5 }); UN.push(paintSky(ctx, { top: "#5d7fd8", mid: "#e2b6c6", hor: "#ffcf9a", lit: "#ffd6a8", shade: "#a98fb8", glow: 34, clouds: 0.4, stars: 0 })); },
  pose(t) { const p = car(t); CAR.place(p[0], 1.2, p[2], 0, V * t); },
  subject: () => CAR.group.children[0],
  dispose() { CAR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
