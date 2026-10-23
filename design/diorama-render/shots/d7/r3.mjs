import { cameraPath, whip } from "../../src/camera.js";
import { NIGHT, nightSky, heroCar, hideMapRide, mapRide, followKey, world, secs, L3 } from "./common.js";
// D7 · Overtake. (r3): Fintech Boulevard at night, head on, a long lens: the hero Dacia steady in its lane, the map's
// F1 up behind it, out and past it (D3's overtake, the cars at their real speeds, frame by frame), lamps on.
const D = secs("r3"), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
// (D6 stretched D3's 1.8 s over this shot: the same, as a slower time)
const k = 1.8 / D, dacia = (t) => ({ x: 2079, z: 4440 + 150 * t * k });
const f1 = (t) => { const tt = t * k, X = (u) => lerp(2079, 2053, sm(clamp((u - 0.25) / 0.35)) * (1 - sm(clamp((u - 1.3) / 0.4)))), h = 0.01, dx = (X(tt + h) - X(tt - h)) / (2 * h); return { x: X(tt), z: 4300 + 265 * tt, yaw: Math.atan2(dx, 265) }; };
let CAR, RIDE, KEY, UNSKY, LABEL = [];
export default {
  name: "r3", size: [2160, 3840], fps: 30, duration: D, shutter: 0.15, shift: [0, 0.06], // (D8: less blur on the cars themselves)
  camera: whip(cameraPath({ keys: [0.15, D / 2, D].map((t) => ({ t, pos: [2064, 7, 4890 - 6 * (t / D)], look: [2071, 9, 4560], fov: 13 + 13 * Math.pow(t / D, 1.6), // (the lens widens as the cars come on: they stay in the frame)
          focus: [2070, 8, (dacia(t).z + f1(t).z) / 2 + 10] })) }), { at: "start", deg: 50, dur: 0.15 }),
  lens: { fstop: 64, scale: 1.45 }, ...NIGHT, // (D8: f/32: both cars sharp on the long lens, the far boulevard still soft)
  shadow: { centre: [2070, 0, 4600], ext: 420 },
  async prepare(ctx) {
    const { S } = ctx; await world(S, "nightlife");
    // (as Iris's D6 plate: the map's "Cărturești Modul" label sprite, far down the boulevard, out of this shot)
    const v = new S.K.Vector3(); S.scene.traverse((o) => { if (!o.isSprite || !o.visible) return; v.setFromMatrixPosition(o.matrixWorld); if (Math.abs(v.x - 2120) < 30 && Math.abs(v.z - 3120) < 30) { o.visible = false; LABEL.push(o); } }); RIDE = await mapRide(S, "f1"); RIDE.lights(true);
    CAR = await heroCar(ctx, { lights: true, scale: 13 }); CAR.setBeam(5000); KEY = followKey(ctx, 9000, 640); UNSKY = nightSky(ctx);
  },
  pose(t) { const d = dacia(Math.max(0, t)), f = f1(Math.max(0, t)); CAR.place(d.x, 1.2, d.z, 0, d.z); RIDE.place(f.x, 1.73, f.z, f.yaw); KEY.at(2072, 60, Math.max(d.z, f.z) + 170); },
  dispose() { for (const o of LABEL) o.visible = true; CAR?.dispose(); RIDE?.restore(); KEY?.dispose(); UNSKY?.(); }
};
