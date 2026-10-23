// Story A in diorama · 5 · "Take your drive.": from behind the hero Dacia, low on the coffee street, at the blue hour;
// it pulls away from the kerb at Steam and drives on until it is small (A6's driveCar: 70 u/s² up to 115 u/s), its
// lamps on (headlamps, two beams on the road, the tail lamps), its wheels turning, the motion blurred by the shutter;
// the camera eases after it a little (A6's "drive" camera, carried without the rest at its start). Whips in.
import { cameraPath, whip } from "../../src/camera.js";
import { DUSK, secs, heroCar, hideMapRide } from "./common.js";
import { paintSky } from "../../src/sky.js";
const D = secs("drive"), W = 0.15;
const L3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
// A6's driveCar (shots4.mjs), the distance rolled
const S0 = (t) => { const tt = Math.max(0, t - 0.3), ta = 115 / 70; return tt < ta ? 0.5 * 70 * tt * tt : 0.5 * 70 * ta * ta + 115 * (tt - ta); };
let CAR = null, UNRIDE = null, KEY = null, UNSKY = null, LAMPS = null, HEADM = null;
const keys = [W, 1.4, 2.8, 4.2, D].map((t) => { const u = Math.min(1, t / 4.2), pos = L3([842, 10, 5442], [842, 12, 5500], u), tg = L3([842, 8, 5760], [842, 9, 5800], u); return { t, pos, look: [tg[0], pos[1], tg[2]], fov: 58, focus: [842, 8, 5545 + S0(t)] }; });
export default {
  name: "drive", size: [2160, 3840], fps: 30, duration: D, shutter: 0.5, shift: [0, 0.12],
  camera: whip(cameraPath({ keys, ease: [0, 1.4] }), { at: "start", deg: 60, dur: W }),
  // the focus rides with the car: a plane square to the street through its middle, at its place at each instant
  lens: { fstop: 11, scale: 1.45, plane: (t) => { const z = 5545 + S0(Math.max(0, t)) - 18; return [[830, 0, z], [854, 0, z], [842, 20, z]]; } },
  ...DUSK, look: { ...DUSK.look, sky: { top: "#0d1748", mid: "#33397f", hor: "#f0875e" }, domeK: 1.15 }, domeK: 1.15, post: { ...DUSK.post, exposure: 1.75, bloomK: 0.14, bloomThr: 0.85 },
  shadow: { centre: [842, 0, 5700], ext: 420 },
  async prepare(ctx) {
    const { S, K } = ctx; UNRIDE = hideMapRide(S); CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(14000);
    // a soft warm key over the lens's shoulder, kept on the car as it goes (a film's follow light: the yellow reads
    // yellow at the blue hour, as A6's keyLight did for the night renders)
    KEY = new K.PointLight("#ffe6c8", 1500, 200, 2); KEY.castShadow = false; S.scene.add(KEY); this._S = S; this._K = K;
    // A8: the painted evening sky (the last light low ahead, up the street), and the street lamps lit
    UNSKY = paintSky(ctx, { top: "#0d1748", mid: "#33397f", hor: "#f0875e", lit: "#ffae7c", shade: "#3d3c7c", glow: 8, clouds: 0.42, stars: 0.7, k: 1.0 });
    // the map's two lamps on this stretch (their heads glowing), and a lamp post every ~150 along both kerbs up to the
    // end of the street, staggered (story props, in the map's lamp shape): each a warm pool on the asphalt
    LAMPS = new K.Group(); S.scene.add(LAMPS);
    const pole = new K.MeshStandardMaterial({ color: "#26262b", roughness: 0.5, metalness: 0.4 }), head = new K.MeshStandardMaterial({ color: "#fff2c8", emissive: new K.Color("#ffcf8a"), emissiveIntensity: 3.5, roughness: 0.4 });
    const heads = [[804, 61, 5479], [856, 61, 5877]];
    for (let i = 0, z = 5600; z < 6900; z += 150, i++) { if (Math.abs(z - 5877) < 70) continue; const side = i % 2 ? 1 : -1, px = 842 + side * 50, hx = 842 + side * 32; const p = new K.Mesh(new K.CylinderGeometry(1.1, 1.5, 62, 10), pole); p.position.set(px, 31, z); const arm = new K.Mesh(new K.BoxGeometry(Math.abs(px - hx), 1.2, 1.2), pole); arm.position.set((px + hx) / 2, 61.5, z); const hd = new K.Mesh(new K.SphereGeometry(4.6, 18, 12), head); hd.position.set(hx, 59, z); for (const m of [p, arm, hd]) { m.castShadow = m !== hd; m.receiveShadow = true; LAMPS.add(m); } heads.push([hx, 59, z]); }
    let mapHead = null; S.scene.traverse((o) => { if (!mapHead && o.isInstancedMesh && o.geometry.type === "SphereGeometry" && o.material.color.getHexString() === "fff2c8") mapHead = o; });
    if (mapHead) { HEADM = [mapHead.material, mapHead.material.emissive.clone(), mapHead.material.emissiveIntensity]; mapHead.material.emissive.set("#ffcf8a"); mapHead.material.emissiveIntensity = 3.5; }
    for (const [x, y, z] of heads) { const L = new K.PointLight("#ffc27a", 1500, 105, 2); L.position.copy(S.warpV(new K.Vector3(x, y - 6, z))); L.castShadow = false; LAMPS.add(L); }
  },
  pose(t) { const s = S0(Math.max(0, t)); CAR.place(842, 1.2, 5545 + s, 0, s); KEY.position.copy(this._S.warpV(new this._K.Vector3(826, 30, 5545 + s - 34))); KEY.updateMatrixWorld(true); },
  dispose() { CAR && CAR.dispose(); UNRIDE && UNRIDE(); KEY && KEY.parent && KEY.parent?.remove(KEY); UNSKY && UNSKY(); LAMPS && LAMPS.parent?.remove(LAMPS); if (HEADM) { HEADM[0].emissive.copy(HEADM[1]); HEADM[0].emissiveIntensity = HEADM[2]; } }
};
