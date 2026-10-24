import { hideMapRide, heroRide, subU, world, paintSky, track, dur, grass, hideNear , asphalt } from "../e8/common.js";
// E8d: Radu's detailed Cropduster (vendor/hero/cropduster.js) in place of the map's plane, 6.5 units a metre (64 across, the
// map plane's span), its middle where the map plane's was; the propeller turns (2034 rpm: on film it creeps forward
// 0.13 of a turn a frame) and only it is blurred: each sub-frame puts it at another instant of a 1/170 s shutter, everything else stays at the frame's instant (shutter 0).
// E8 · t2 · the Cropduster low over a field below the Brașov hill on a clear afternoon: the lens in the grass, trucking
// alongside the plane at its speed (it holds its place in the frame, the forested hill slides behind it).
const D = dur("t2"), V = 46, plane = (t) => ({ x: 742, y: 30 + 2.5 * Math.sin(t * 2.2), z: 4700 + V * t, bank: 0.05 * Math.sin(t * 1.6), pitch: -0.03 });
const PS = 6.5;
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
    await world(ctx.S, "monument"); UN.push(asphalt(ctx)); UN.push(hideMapRide(ctx.S)); RIDE = await heroRide(ctx, "plane", { scale: PS }); UN.push(hideNear(ctx, SPOTS, { meshes: true }));
    GR = await grass(ctx, { x0: 640, x1: 768, z0: 4560, z1: 5000 }); this._g2 = await grass(ctx, { x0: 812, x1: 930, z0: 4620, z1: 4900, bx0: 840, bx1: 890, bz0: 4650, bz1: 4790, density: 2.2, seed: 9 }); 
    UN.push(paintSky(ctx, { top: "#3f78d8", mid: "#8fb4ea", hor: "#d9e6f2", lit: "#ffffff", shade: "#b9c6dc", glow: 118, clouds: 0.5, stars: 0 }));
  },
  pose(t, ctx, i = 0) { const p = plane(t); RIDE.place(p.x, p.y, p.z + 1.72 * PS, 0, p.pitch, p.bank); RIDE.prop(2 * Math.PI * (33.9 * t + subU(i) * 0.2)); },
  subject: () => RIDE.g,
  dispose() { RIDE?.dispose(); GR?.dispose(); this._g2?.dispose(); UN.forEach((f) => f()); UN = []; }
};
