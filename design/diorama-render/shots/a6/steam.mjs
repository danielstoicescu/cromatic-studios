// Story A in diorama · 2 · Steam, "place": the coffee street at Steam (its tower, its sign), the hero Dacia parked at
// the kerb, lamps off; the camera low, sliding and turning (A6's "steam" camera, level, its lens shifted up), never at
// rest; it whips in and out. Focus on the car, Steam's shopfront close behind it.
import { cameraPath, whip } from "../../src/camera.js";
import { GOLDEN, secs, heroCar, hideMapRide } from "./common.js";
import { hideNear } from "../../src/set.js";
import { figurine } from "../../src/figurines.js";
const D = secs("steam"), W = 0.15;
const L3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
let CAR = null, UNRIDE = null, SIGN = null, SIGNL = null, UNDRESS = null, FIGS = null;
// A8 (Daniel: the sign larger, readable, the car in frame): a longer lens from across the road, Steam's front square on
// enough to read, the car parked at its kerb in front; the camera pushes in a little, never at rest
const keys = [W, D / 2, D - W].map((t) => { const u = t / D; return { t, pos: L3([796, 18, 5486], [806, 19, 5497], u), look: L3([903, 28, 5603], [907, 28, 5606], u), fov: 42, focus: [897, 24, 5614] }; });
export default {
  name: "steam", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5,
  camera: whip(whip(cameraPath({ keys }), { at: "start", deg: 60, dur: W }), { at: "end", deg: 60, dur: W }),
  lens: { fstop: 22, scale: 1.45 }, // (the car ~134 from the lens, the sign ~217, the focus between: both within ~3-4 px at 1080)
  ...GOLDEN,
  shadow: { centre: [860, 0, 5560], ext: 380 },
  async prepare(ctx) {
    const { S, K } = ctx;
    UNRIDE = hideMapRide(S); CAR = await heroCar(ctx, { lights: false }); CAR.place(866, 1.2, 5600, 0);
    // Steam's sign (an unlit band over the shopfront, at 949, 37, 5640) lit as a lightbox, and a warm light on the front
    const v = new K.Vector3(); S.scene.traverse((o) => { if (SIGN || !o.isMesh || !o.material || !o.material.isMeshBasicMaterial || !o.material.map) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld); if (Math.abs(v.x - 949) < 3 && Math.abs(v.y - 37) < 3 && Math.abs(v.z - 5640) < 3) SIGN = [o, o.material.color.clone()]; });
    if (SIGN) SIGN[0].material.color.multiplyScalar(1.9);
    // the map's peg people at Steam's tables, swapped for figurines
    UNDRESS = hideNear(ctx, [[926, 5606, 3], [918, 5648, 3], [936, 5678, 3], [908, 5628, 3]]);
    FIGS = new K.Group(); S.scene.add(FIGS);
    const put = (o, x, z, rot) => { const f = figurine(K, o); f.position.set(x, 0.4, z); f.rotation.y = rot; FIGS.add(f); };
    put({ sex: "f", h: 28, skin: "#e3b391", hair: "#3b2416", hairStyle: "bun", top: "#e9e3d3", jacket: "#c4553a", bottom: "#2b2b2e", pose: "cupTalk", cupSleeve: "#2f3034" }, 926, 5606, -Math.PI / 2 - 0.4);
    put({ sex: "m", h: 29.5, skin: "#c98f6a", hair: "#1b120c", hairStyle: "crop", top: "#2f4f6b", bottom: "#c9b99a", shoes: "#efe8dc", pose: "walk" }, 908, 5628, Math.PI - 0.2);
    put({ sex: "m", h: 29, skin: "#f0c6a4", hair: "#6b6b6b", hairStyle: "short", beard: true, top: "#f2efe8", jacket: "#3a3f36", bottom: "#2d3340", pose: "standEasy", glasses: true }, 918, 5648, -Math.PI / 2 + 0.3);
    put({ sex: "f", h: 27.5, skin: "#8d5a3c", hair: "#0f0b08", hairStyle: "long", top: "#f3d36a", bottom: "#24304a", pose: "phone" }, 936, 5678, -Math.PI / 2);
    SIGNL = new K.PointLight("#ffd9a8", 2600, 160, 2); SIGNL.position.copy(S.warpV(new K.Vector3(905, 44, 5612))); S.scene.add(SIGNL);
  },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); if (SIGN) SIGN[0].material.color.copy(SIGN[1]); SIGNL && SIGNL.parent?.remove(SIGNL); UNDRESS && UNDRESS(); FIGS && FIGS.parent?.remove(FIGS); }
};
