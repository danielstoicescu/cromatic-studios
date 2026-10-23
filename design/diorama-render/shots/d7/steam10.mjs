// Story D10 in diorama · the street at Steam (Daniel on D9): the camera locked off where the descent left it (D5's S0),
// the hero Dacia just pulled up (its rock settling in the first frames), the figurines sharp; 2.6 s.
import { cameraPath } from "../../src/camera.js";
import { D5, PARK } from "../../vendor/shotsD5.mjs";
import { GOLDEN, heroCar, hideMapRide, dressSteam, world } from "./common.js";
import { ZD, pitchAt } from "./zoom10.mjs";
const D = 2.6, c0 = D5.steam.cam(0);
let CAR = null, UNRIDE = null, UNDRESS = null;
export default {
  name: "steam", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: cameraPath({ keys: [{ t: 0, pos: c0.pos, look: c0.tgt, fov: c0.fov, focus: [918, 16, 5640] }, { t: D, pos: c0.pos, look: c0.tgt, fov: c0.fov, focus: [918, 16, 5640] }] }),
  lens: { fstop: 32, scale: 1.45 },
  ...GOLDEN,
  shadow: { ext: 380, domeExt: 380 },
  async prepare(ctx) { await world(ctx.S, "monument"); UNRIDE = hideMapRide(ctx.S); CAR = await heroCar(ctx, { lights: false }); UNDRESS = dressSteam(ctx); },
  pose(t) { CAR.place(PARK[0], 1.2, PARK[2], 0, PARK[2], pitchAt(ZD + Math.max(0, t))); },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); UNDRESS && UNDRESS(); }
};
