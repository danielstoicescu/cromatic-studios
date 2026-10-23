import { cameraPath, whip } from "../../src/camera.js";
import { NIGHT, nightSky, heroCar, hideMapRide, mapRide, followKey, world, secs, L3 } from "./common.js";
// D7 · and avoid being pulled over. (r8): the patrol (the map's Poliția Dacia) from its bumper at night, its roof lamps
// red and blue on the map's own 190 ms beat, washing the street; it rolls towards the lens.
const D = secs("r8"), V = 14;
let RIDE, KEY, UNSKY, WASH;
export default {
  name: "r8", size: [2160, 3840], fps: 30, duration: D, shutter: 0.2,
  camera: cameraPath({ keys: [0, D / 2, D].map((t) => ({ t, pos: [830, 2.6, 4562 + V * t], look: [823, 9, 4500 + V * t], fov: 50 - 3 * (t / D), focus: [823, 9, 4506 + V * t] })) }),
  lens: { fstop: 22, scale: 1.45 }, ...NIGHT, shadow: { ext: 260 },
  async prepare(ctx) {
    const { S, K } = ctx; await world(S, "nightlife"); RIDE = await mapRide(S, "cop"); RIDE.lights(true); KEY = followKey(ctx, 700, 180); UNSKY = nightSky(ctx);
    // the beacons' light on the street: a red and a blue light over the roof, on the beat
    WASH = [new K.PointLight("#ff2a3c", 0, 220, 2), new K.PointLight("#3d7bff", 0, 220, 2)]; for (const L of WASH) S.scene.add(L); this._S = S; this._K = K;
  },
  pose(t) {
    const z = 4500 + V * Math.max(0, t), beat = Math.floor((Math.max(0, t) * 1000) / 190) % 2, v = RIDE.v;
    RIDE.place(823, 1.73, z, 0); KEY.at(845, 28, z + 60);
    (v.beacons || []).forEach((b, k) => { if (b.material) b.material.emissiveIntensity = beat === k ? 3.2 : 0.15; });
    WASH.forEach((L, k) => { L.intensity = beat === k ? 2600 : 0; L.position.copy(this._S.warpV(new this._K.Vector3(823 + (k ? 4 : -4), 24, z))); L.updateMatrixWorld(true); });
  },
  dispose() { RIDE?.restore(); KEY?.dispose(); UNSKY?.(); WASH?.forEach((L) => L.parent?.remove(L)); }
};
