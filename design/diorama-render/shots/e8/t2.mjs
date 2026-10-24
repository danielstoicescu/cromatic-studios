import { mapRide, world, paintSky, track, dur, grass, hideNear , asphalt } from "./common.js";
// E8 · t2 · the Cropduster low over a field below the Brașov hill on a clear afternoon: the lens in the grass, trucking
// alongside the plane at its speed (it holds its place in the frame, the forested hill slides behind it).
const D = dur("t2"), V = 46, plane = (t) => ({ x: 742, y: 30 + 2.5 * Math.sin(t * 2.2), z: 4700 + V * t, bank: 0.05 * Math.sin(t * 1.6), pitch: -0.03 });
let RIDE, UN = [], GR;
// (the lollipop trees and lamps between the lens and the plane, and round the lens: out of the way, before the grass)
const SPOTS = []; for (let x = 744; x <= 884; x += 16) for (let z = 4600; z <= 4900; z += 16) SPOTS.push([x, z, 12]);
export default {
  name: "t2", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: track(D, (t) => { const p = plane(t); return { pos: [p.x + 122, 3.2, p.z + 52], look: [p.x, p.y + 17, p.z + 2], fov: 46, focus: [p.x + 6, p.y, p.z] }; }),
  lens: { fstop: 22, scale: 1.45 },
  look: { sky: { top: "#7a9bd0", mid: "#a9c0e2", hor: "#dfe6ee" }, fog: { color: "#c9d8e6", near: 500, far: 4200 }, bounce: "#8fa070", bounceK: 0.56, domeK: 0.42, domeSunGlow: 0.6, tone: 0.05, minRough: 0.62, bump: 0.03 },
  sun: { az: 118, el: 34, color: "#fff0d8", intensity: 4.2, radius: 1.3 },
  shadow: { centre: [790, 0, 4740], ext: 260 },
  post: { tonemap: "agx", exposure: 1.2, bloomK: 0.06, bloomThr: 1.0, vig: 0.2, grain: 0.022, lut: "cromatic-diorama", lutMix: 0.5, sat: 1.14, power: 1.04 },
  async prepare(ctx) {
    await world(ctx.S, "monument"); UN.push(asphalt(ctx)); RIDE = await mapRide(ctx.S, "plane"); RIDE.lights(false, { beams: false }); UN.push(hideNear(ctx, SPOTS, { meshes: true }));
    GR = await grass(ctx, { x0: 640, x1: 768, z0: 4560, z1: 5000 }); this._g2 = await grass(ctx, { x0: 812, x1: 930, z0: 4620, z1: 4900, bx0: 840, bx1: 890, bz0: 4650, bz1: 4790, density: 2.2, seed: 9 }); 
    UN.push(paintSky(ctx, { top: "#3f78d8", mid: "#8fb4ea", hor: "#d9e6f2", lit: "#ffffff", shade: "#b9c6dc", glow: 118, clouds: 0.5, stars: 0 }));
  },
  pose(t) { const p = plane(t); RIDE.place(p.x, p.y, p.z, 0, p.pitch, p.bank); },
  subject: () => RIDE.g,
  dispose() { RIDE?.restore(); GR?.dispose(); this._g2?.dispose(); UN.forEach((f) => f()); UN = []; }
};
