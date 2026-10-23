// Story D7 in diorama · the map: D6's "steam" (shotsD5.mjs, the same camera at every frame, so Iris's pins stay on their
// places), the hero Dacia parked at Steam's kerb (lamps off), the map's day in the diorama's late-afternoon light.
import { cameraPath } from "../../src/camera.js";
import { D5, PARK } from "../../vendor/shotsD5.mjs";
import { GOLDEN, heroCar, hideMapRide, dressSteam, keysOf, world } from "./common.js";
const D = D5.steam.dur;
let CAR = null, UNRIDE = null, UNDRESS = null;
export default {
  name: "steam", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: cameraPath({ keys: keysOf(D5.steam.cam, D).map((k) => ({ ...k, focus: [918, 16, 5640] })) }), cameraLimits: { maxTurn: 12, maxTurnJump: 6, maxFlip: 12 },
  lens: { fstop: 32, scale: 1.45 }, // (D8: the figurines at Steam's tables sharp, only the far background soft)
  ...GOLDEN,
  shadow: { ext: 380, domeExt: 380 },
  async prepare(ctx) { await world(ctx.S, "monument"); UNRIDE = hideMapRide(ctx.S); CAR = await heroCar(ctx, { lights: false }); CAR.place(PARK[0], 1.2, PARK[2], PARK[3]); UNDRESS = dressSteam(ctx); },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); UNDRESS && UNDRESS(); }
};
