import { hideMapRide, world, paintSky, track, dur, asphalt, tilt, hero1300, shake, bodyPitch } from "./common.js";
// E8b · t1 · the 1300 pulling away down Fintech Boulevard at golden hour (Daniel on E8: the car "deformed"): a longer lens
// from further off (fov 20, ~300 units: the long, low sedan reads at its true proportions, no close-lens stretch), the eye
// at ~1 m, a front-left three-quarter that shows its length; it accelerates (the tail squats, the nose lifts, then
// settles) and the engine shakes it a hair. The lens tracks it: the car holds its place in the frame.
const D = dur("t1"), A = 18, V0 = 4, car = (t) => [2079, 9, 4600 + V0 * t + 0.5 * A * t * t];
const acc = (t) => (t >= 0 && t <= D ? A : 0), pitch = bodyPitch(acc, { max: 0.04, a0: 20, t0: -0.05 });
const CAM = track(D, (t) => { const p = car(t); return { pos: [p[0] - 118, 12, p[2] + 278], look: [p[0] - 1.2, 10, p[2] + 1.8], fov: 20, focus: [p[0] - 6, 9, p[2] + 14] }; });
let CAR, UN = [];
export default {
  name: "t1", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: CAM,
  lens: { fstop: 16, scale: 1.45, plane: tilt(CAM, (t) => { const p = car(t); return [p[0] - 6, 9, p[2] + 14]; }, 24) },
  look: { sky: { top: "#9aa6c8", mid: "#e6c4c4", hor: "#ffd6a8" }, fog: { color: "#efc9b2", near: 300, far: 2800 }, bounce: "#d8a07a", bounceK: 0.62, domeK: 0.29, domeSunGlow: 1.1, tone: 0.05, minRough: 0.62, bump: 0.03 },
  sun: { az: 345, el: 13, color: "#ffbe82", intensity: 3.9, radius: 1.3 },
  shadow: { centre: [2079, 0, 4610], ext: 300 },
  post: { tonemap: "agx", exposure: 1.25, bloomK: 0.1, bloomThr: 0.9, vig: 0.3, grain: 0.024, lut: "cromatic-diorama", lutMix: 0.8, sat: 1.12, power: 1.08 },
  async prepare(ctx) { await world(ctx.S, "monument"); UN.push(asphalt(ctx)); UN.push(hideMapRide(ctx.S)); CAR = await hero1300(ctx, { lights: false }); UN.push(paintSky(ctx, { top: "#9aa6c8", mid: "#e6c4c4", hor: "#ffd6a8", lit: "#ffd6a8", shade: "#a98fb8", glow: 345, clouds: 0.4, stars: 0 })); },
  pose(t) {
    const p = car(t), s = shake(t, 0.03, 1);
    CAR.place(p[0], 1.2 + s.dy, p[2], 0, p[2] - 4600, pitch(t) + s.pitch);
    CAR.group.rotateZ(s.roll); CAR.group.updateMatrixWorld(true);
  },
  subject: () => CAR.group.children[0],
  dispose() { CAR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
