// Story D10 in diorama · the descent to Steam (Daniel on D9): D5's move down, done sooner (3.0 s, its camera at rest
// by 2.25 s, then locked off), while the hero Dacia drives up Coffee Street and pulls up at Steam's kerb right as the
// shot ends: a real brake, the nose dipping as it slows and rocking back once it stops (the rock finishes in "steam").
import { cameraPath } from "../../src/camera.js";
import { D5, PARK } from "../../vendor/shotsD5.mjs";
import { GOLDEN, heroCar, hideMapRide, dressSteam, keysOf, world } from "./common.js";
export const ZD = 3.0, CAM_END = 2.25, ARRIVE = 3.0;
// the car: from 230 back at 60 u/s, easing to rest at PARK by ARRIVE (a constant deceleration over its last 1.1 s)
export const carAt = (t) => { const tb = ARRIVE - 1.1, v = 60, dBrake = (v * 1.1) / 2, z0 = PARK[2] - (v * tb + dBrake); if (t <= tb) return { z: z0 + v * t, a: 0 }; const u = Math.min(t, ARRIVE) - tb; return { z: z0 + v * tb + v * u - (v / 1.1) * u * u / 2, a: t < ARRIVE ? 1 : 0 }; };
// the nose: dips ~2 degrees under braking, then a damped rock back past level and settle
export const pitchAt = (t) => { const tb = ARRIVE - 1.1, dip = 0.036; if (t < tb) return 0; if (t < ARRIVE) return dip * Math.min(1, (t - tb) / 0.25); const s = t - ARRIVE; return dip * Math.exp(-s * 7) * Math.cos(s * 15); };
let CAR = null, UNRIDE = null, UNDRESS = null;
const cam = (t) => D5.zoom.cam(Math.min(1, t / CAM_END) * D5.zoom.dur);
// (the D9 change kept: the middle of the move a little higher, so it never grazes the block by the road)
const camHigh = (t) => { const c = cam(t), u = Math.min(1, Math.max(0, t / CAM_END)), h0 = c.pos[1], hk = Math.exp(Math.log(742) + (Math.log(8) - Math.log(742)) * Math.pow(u, 1.8)); return { ...c, pos: [c.pos[0], Math.max(h0, Math.min(hk, h0 + 140)), c.pos[2]] }; };
export default {
  name: "zoom", size: [2160, 3840], fps: 30, duration: ZD, shutter: 0.5,
  camera: cameraPath({ keys: keysOf(camHigh, ZD) }), cameraLimits: { maxTurn: 16, maxTurnJump: 8, maxFlip: 16 },
  lens: { fstop: 8, scale: 1.45 },
  ...GOLDEN,
  shadow: { ext: 1200, domeExt: 1200 },
  async prepare(ctx) { await world(ctx.S, "monument"); UNRIDE = hideMapRide(ctx.S); CAR = await heroCar(ctx, { lights: false }); UNDRESS = dressSteam(ctx); },
  pose(t) { const c = carAt(Math.max(0, t)); CAR.place(PARK[0], 1.2, c.z, 0, c.z, pitchAt(Math.max(0, t))); },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); UNDRESS && UNDRESS(); }
};
