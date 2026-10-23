import { cameraPath, whip } from "../../src/camera.js";
import { NIGHT, nightSky, heroCar, hideMapRide, mapRide, followKey, world, secs, L3 } from "./common.js";
// D7 · Fly high. (r5): the map's Cropduster taking off over Fintech, from below, climbing away into the night sky
// and the stars (D6 moved a sprite up the frame; here it flies, the lens tilting after it); whips in.
const D = secs("r5"), ease = (u) => 1 - Math.pow(1 - u, 2);
let RIDE, KEY, UNSKY;
const plane = (t) => { const u = Math.max(0, Math.min(1, t / D)), e = ease(u); return { x: 2130, y: 14 + 230 * e, z: 4500 + 160 * e, pitch: -0.32 * (1 - u * 0.5) }; };
export default {
  name: "r5", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: whip(cameraPath({ keys: [0.15, D / 2, D].map((t) => { const p = plane(t); return { t, pos: [2130, 1.5, 4530 - 10 * (t / D)], look: [p.x, p.y + 8, p.z], fov: 70 - 6 * (t / D), roll: 6 * (t / D), yaw: 0, focus: [p.x, p.y, p.z] }; }) }), { at: "start", deg: 50, dur: 0.15 }),
  cameraLimits: { maxTurn: 8, maxTurnJump: 3 },
  lens: { fstop: 8, scale: 1.45 }, ...NIGHT, shadow: { centre: [2130, 0, 4560], ext: 360 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); RIDE = await mapRide(ctx.S, "plane"); RIDE.lights(true, { beams: false }); this._s0 = RIDE.g.scale.x; RIDE.g.scale.multiplyScalar(1.8); KEY = followKey(ctx, 2600, 260); UNSKY = nightSky(ctx); },
  pose(t) { const p = plane(t); RIDE.place(p.x, p.y, p.z, 0, p.pitch); KEY.at(p.x - 30, p.y - 20, p.z - 60); },
  dispose() { if (RIDE && this._s0) RIDE.g.scale.setScalar(this._s0); RIDE?.restore(); KEY?.dispose(); UNSKY?.(); }
};
