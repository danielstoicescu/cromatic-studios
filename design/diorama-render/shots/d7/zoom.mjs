// Story D7 in diorama · the map: D6's "zoom" (shotsD5.mjs, the same camera at every frame, so Iris's pins stay on their
// places), the hero Dacia parked at Steam's kerb (lamps off), the map's day in the diorama's late-afternoon light.
import { cameraPath } from "../../src/camera.js";
import { D5, PARK } from "../../vendor/shotsD5.mjs";
import { GOLDEN, heroCar, hideMapRide, dressSteam, keysOf, world } from "./common.js";
const D = D5.zoom.dur;
let CAR = null, UNRIDE = null, UNDRESS = null;
export default {
  name: "zoom", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: cameraPath({ keys: keysOf(D5.zoom.cam, D) }), cameraLimits: { maxTurn: 12, maxTurnJump: 6, maxFlip: 12 },
  lens: { fstop: 8, scale: 1.45 },
  ...GOLDEN,
  shadow: { ext: 1200, domeExt: 1200 },
  async prepare(ctx) { await world(ctx.S, "monument"); UNRIDE = hideMapRide(ctx.S); CAR = await heroCar(ctx, { lights: false }); CAR.place(PARK[0], 1.2, PARK[2], PARK[3]); UNDRESS = dressSteam(ctx); },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); UNDRESS && UNDRESS(); }
};
