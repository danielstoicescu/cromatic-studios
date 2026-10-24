import { heroCar, mapRide, world, paintSky, NIGHT, wet, mirror, followKey, lamp, dur, smooth } from "./common.js";
import { cameraPath } from "../../src/camera.js";
// E8 · rush + patrol (one shot over both cards, 4.5 s) · Fintech Boulevard at night after the rain: the 1300 hurries
// past a low lens at the kerb (the lens pans with it), the Polite Patrol behind it brakes and stops in the middle of the
// frame, its beacons washing the wet street red and blue on the map's 190 ms beat; then a slow push in on the Patrol.
const D = dur("rush") + dur("patrol"), X1 = 2084, XP = 2081;
const car = (t) => ({ x: X1, z: 4470 + 150 * t });
const Z0 = 4360, ZB = 4488, TB = (ZB - Z0) / 140, ZS = 4552, A = (140 * 140) / (2 * (ZS - ZB)), TS = TB + 140 / A;
const cop = (t) => { if (t < TB) return { z: Z0 + 140 * t, v: 140 }; if (t < TS) { const u = t - TB; return { z: ZB + 140 * u - 0.5 * A * u * u, v: 140 - A * u }; } return { z: ZS, v: 0 }; };
// the brake: the nose dips while it decelerates, rocks back once at the stop
const dip = (t) => (t < TB ? 0 : t < TS ? 0.028 * smooth((t - TB) / 0.25) : 0.028 * Math.exp(-(t - TS) * 7) * Math.cos((t - TS) * 15));
const C0 = [2052, 4.6, 4706];
const camAt = (t) => {
  const c = car(t), w = smooth((t - 1.1) / 1.3); // a gentle pan after the 1300, then back to settle on the Patrol's stop
  const u = smooth(t / 1.6), look1 = [2080 + 10 * u, 11, 4540 + 80 * u], look2 = [XP + 2.6, 10, ZS + 5];
  const push = smooth((t - 2.3) / (D - 2.3)) * 8;
  return { pos: [C0[0] + push * 0.18, C0[1], C0[2] - push], look: look1.map((v, i) => v + (look2[i] - v) * w), fov: 30 - 3 * smooth((t - 2.3) / (D - 2.3)), focus: [XP - 6, 9, (t < 1.3 ? Math.min(c.z, 4630) : ZS + 12)] };
};
const keys = []; for (let t = 0; t <= D + 1e-6; t += 1 / 30) keys.push({ t: +t.toFixed(4), ...camAt(t) });
let CAR, RIDE, UN = [], KEY, WET, MIR, WASH, L1, L2;
export default {
  name: "chase", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: cameraPath({ keys }), cameraLimits: { maxTurn: 4.5, maxTurnJump: 1.2 },
  lens: { fstop: 22, scale: 1.45 },
  ...NIGHT, look: { ...NIGHT.look, fog: { color: "#1a2048", near: 500, far: 4200 }, bounceK: 0.2, domeK: 0.6 },
  post: { ...NIGHT.post, tonemap: "agx", exposure: 2.0, bloomK: 0.18, bloomThr: 0.8, sat: 1.15, vig: 0.3, grain: 0.028, lutMix: 0.7 },
  shadow: { centre: [2075, 0, 4560], ext: 320 },
  async prepare(ctx) {
    const { S, K } = ctx; await world(S, "nightlife");
    RIDE = await mapRide(S, "cop"); RIDE.lights(true, { beams: false });
    CAR = await heroCar(ctx, { lights: true, scale: 12.5 }); CAR.setBeam(6000);
    KEY = followKey(ctx, 700, 220);
    WET = wet(ctx, { centre: [2075, 0, 4560], r: 700, rough: 0.28, refl: 0.08 }); MIR = await mirror(ctx, { centre: [2075, 0, 4580], size: 1400, opacity: 0.5, y: 1.4 });
    L1 = lamp(ctx, { at: [2046, 40, 4610], color: "#ffcf96", I: 2400, d: 260 }); L2 = lamp(ctx, { at: [2112, 40, 4480], color: "#ffcf96", I: 1800, d: 240 });
    WASH = [new K.PointLight("#ff2a3c", 0, 240, 2), new K.PointLight("#3d7bff", 0, 240, 2)]; for (const L of WASH) S.scene.add(L); this._S = S; this._K = K;
    UN.push(paintSky(ctx, { top: "#070b26", mid: "#1c2257", hor: "#5a4a86", lit: "#b98aa0", shade: "#22264f", glow: 180, clouds: 0.35, stars: 0.8 }));
  },
  pose(t) {
    const c = car(t), p = cop(t), beat = Math.floor((t * 1000) / 190) % 2, v = RIDE.v;
    CAR.place(c.x, 1.2, c.z, 0, c.z);
    RIDE.place(XP, 1.73, p.z, 0, dip(t));
    (v.beacons || []).forEach((b, k) => { if (b.material) b.material.emissiveIntensity = beat === k ? 3.4 : 0.15; });
    WASH.forEach((L, k) => { L.intensity = beat === k ? 2600 : 0; L.position.copy(this._S.warpV(new this._K.Vector3(XP + (k ? 4 : -4), 24, p.z))); L.updateMatrixWorld(true); });
    KEY.at(2062, 30, p.z + 70);
  },
  subjects: () => [["1300", CAR.group.children[0]], ["Polite Patrol", RIDE.g]],
  subject: () => RIDE.g,
  dispose() { CAR?.dispose(); RIDE?.restore(); KEY?.dispose(); WET?.dispose(); MIR?.dispose(); L1?.dispose(); L2?.dispose(); WASH?.forEach((L) => L.parent?.remove(L)); UN.forEach((f) => f()); UN = []; }
};
