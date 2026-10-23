import { cameraPath } from "../../src/camera.js";
import { heroCar, hideMapRide, followKey, world, NIGHT, paintSky, petals, wet, mirror, sakuraRow, focusOnCar, L3 } from "./common.js";
// P1 film · 7 · the Postcard moment's picture (5.5 s, under the UI): the car at golden hour, the sun behind it; the
// photo's camera held, then slid round the car (the sliders), then held for the shot (the photo is frame 102, 3.4 s).
let CAR, UN = [];
const C = [842, 10, 5600], R = 180, ANG = (t) => { const u = Math.min(1, Math.max(0, (t - 1.2) / 2.2)), e = u * u * (3 - 2 * u); return 0.06 - 0.32 * e; };
const camAt = (t) => { const a = ANG(t), h = 4 + 5 * Math.min(1, Math.max(0, (t - 1.2) / 2.2)); return { pos: [C[0] + Math.sin(a) * R, h, C[2] + Math.cos(a) * R + 0], look: [C[0], 20 - 2 * Math.min(1, Math.max(0, (t - 1.2) / 2.2)), C[2] - 40] }; };
const cam = cameraPath({ keys: Array.from({ length: 23 }, (_, i) => { const t = i * 0.25; return { t, ...camAt(t), fov: 28, focus: [C[0], 10, C[2] + 8] }; }) });
export default {
  name: "f7", size: [2160, 3840], fps: 30, duration: 5.5, shutter: 0.25,
  camera: cam, lens: { fstop: 32, scale: 1.45 },
  look: { sky: { top: "#4c62b8", mid: "#f29a7a", hor: "#ffc06a" }, fog: { color: "#f7b98a", near: 800, far: 6000 }, bounce: "#d98c66", bounceK: 0.3, domeK: 0.35, domeSunGlow: 1.6, tone: 0.06, minRough: 0.7, bump: 0.03 },
  sun: { az: 180, el: 10, color: "#ffad62", intensity: 3.6, radius: 1.2 },
  shadow: { centre: [842, 0, 5600], ext: 300 },
  post: { tonemap: "neutral", exposure: 1.1, bloomK: 0.16, bloomThr: 0.85, vig: 0.26, grain: 0.022, lut: "cromatic-diorama", sat: 1.2, power: 1.08 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(hideMapRide(ctx.S)); CAR = await heroCar(ctx, { lights: false }); CAR.place(C[0], 1.2, C[2], 0, 0); UN.push(paintSky(ctx, { top: "#4c62b8", mid: "#f29a7a", hor: "#ffc06a", lit: "#ffc58e", shade: "#8b5f8e", glow: 180, clouds: 0.42, stars: 0, sun: { az: 180, el: 10, size: 2.2, color: "#fff0c0" } })); },
  dispose() { CAR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
