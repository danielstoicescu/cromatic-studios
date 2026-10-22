// Story A in diorama · 3 · OMA, "facade": A6's OMA camera (across the street, level, its lens shifted up), easing in
// without stopping, at blue hour: the room lit warm behind the glass, the figurines (posed, painted), the street lamp.
// Whips in and out. Focus on the glass.
import { cameraPath, whip } from "../../src/camera.js";
import { SUNSET, secs, hideMapRide } from "./common.js";
import { buildOmaSet } from "../oma-set.js";
import { hideNear } from "../../src/set.js";
const D = secs("oma"), W = 0.15;
const L3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
let SET = null, UNDRESS = null, LAMP = null, UNRIDE = null;
const keys = [W, D / 2, D - W].map((t) => { const u = t / D, pos = L3([892, 13.5, 4602], [882, 12.5, 4594], u), tg = L3([620, 44, 4579], [622, 42, 4577], u); return { t, pos, look: [tg[0], pos[1], tg[2]], fov: 73.7 - 2.7 * u, focus: [731, 20, 4566] }; });
export default {
  name: "oma", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5, shift: [0, 0.0833],
  camera: whip(whip(cameraPath({ keys }), { at: "start", deg: 60, dur: W }), { at: "end", deg: 60, dur: W }),
  lens: { fstop: 6.3, scale: 1.45 },
  // the sun going down behind the camera's right: the facade in its last warm light, the room already lit
  ...SUNSET, sun: { az: 75, el: 6, color: "#ff9a5c", intensity: 2.6, radius: 2 }, post: { ...SUNSET.post, exposure: 1.2 },
  shadow: { centre: [760, 0, 4580], ext: 300, domeExt: 360 },
  async prepare(ctx) {
    const { S, K } = ctx;
    UNRIDE = hideMapRide(S);
    window.__perfLab && window.__perfLab.merge(false);
    UNDRESS = hideNear(ctx, [[776, 4598, 6], [751, 4597, 6]]);
    SET = buildOmaSet(ctx, { lampI: 680, glassOpacity: 0.1, glassRefl: 0.6 });
    LAMP = new K.PointLight("#ffc98a", 5200, 260, 2); LAMP.position.copy(S.warpV(new K.Vector3(770, 46, 4702))); LAMP.castShadow = true; LAMP.shadow.mapSize.set(512, 512); LAMP.shadow.camera.near = 1; LAMP.shadow.camera.far = 170; LAMP.shadow.bias = -0.001; LAMP.shadow.normalBias = 0.3; S.scene.add(LAMP);
  },
  dispose() { UNDRESS && UNDRESS(); LAMP && LAMP.parent.remove(LAMP); SET && SET.dispose(); window.__perfLab && window.__perfLab.merge(true); UNRIDE && UNRIDE(); }
};
