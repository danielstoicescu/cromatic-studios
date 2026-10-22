// Story A in diorama · 2 · Steam, "place": the coffee street at Steam (its tower, its sign), the hero Dacia parked at
// the kerb, lamps off; the camera low, sliding and turning (A6's "steam" camera, level, its lens shifted up), never at
// rest; it whips in and out. Focus on the car, Steam's shopfront close behind it.
import { cameraPath, whip } from "../../src/camera.js";
import { GOLDEN, secs, heroCar, hideMapRide } from "./common.js";
const D = secs("steam"), W = 0.15;
const L3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
let CAR = null, UNRIDE = null, SIGN = null, SIGNL = null;
const keys = [W, (D) / 2, D - W].map((t) => { const u = t / D, pos = L3([786, 9, 5436], [800, 10.5, 5452], u), tg = L3([940, 15, 5640], [952, 18, 5636], u); return { t, pos, look: [tg[0], pos[1], tg[2]], fov: 60, focus: [868, 18, 5574] }; });
export default {
  name: "steam", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5, shift: [0, 0.13],
  camera: whip(whip(cameraPath({ keys }), { at: "start", deg: 60, dur: W }), { at: "end", deg: 60, dur: W }),
  lens: { fstop: 22, scale: 1.45 }, // (the car ~122 from the lens, the sign ~261: f/22 holds both within ~2.5 px at 1080)
  ...GOLDEN,
  shadow: { centre: [860, 0, 5560], ext: 380 },
  async prepare(ctx) {
    const { S, K } = ctx;
    UNRIDE = hideMapRide(S); CAR = await heroCar(ctx, { lights: false }); CAR.place(842, 1.2, 5545, 0);
    // Steam's sign (an unlit band over the shopfront, at 949, 37, 5640) lit as a lightbox, and a warm light on the front
    const v = new K.Vector3(); S.scene.traverse((o) => { if (SIGN || !o.isMesh || !o.material || !o.material.isMeshBasicMaterial || !o.material.map) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld); if (Math.abs(v.x - 949) < 3 && Math.abs(v.y - 37) < 3 && Math.abs(v.z - 5640) < 3) SIGN = [o, o.material.color.clone()]; });
    if (SIGN) SIGN[0].material.color.multiplyScalar(1.9);
    SIGNL = new K.PointLight("#ffd9a8", 2600, 160, 2); SIGNL.position.copy(S.warpV(new K.Vector3(905, 44, 5612))); S.scene.add(SIGNL);
  },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); if (SIGN) SIGN[0].material.color.copy(SIGN[1]); SIGNL && SIGNL.parent.remove(SIGNL); }
};
