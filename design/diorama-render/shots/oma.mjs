// Cromatic · diorama renders (TASK-118) · test shot 1: OMA Coffee at dusk, filmed as a model. Its room lit warm behind
// the glass, the figurines in it (posed, painted), Radu's hero Dacia (TASK-112, hero-car e819e62) parked at the kerb in
// front; the camera low on the far pavement, drifting slowly left and in (a slider move), never stopping. Tilt-shift:
// the window and the car sharp, the street in front and the hill behind falling off.
import { cameraPath } from "../src/camera.js";
import { buildOmaSet } from "./oma-set.js";
import { buildHeroDacia } from "../vendor/dacia1300-hero.js";
import { makeOmaRoom } from "../vendor/omaRoom-a6.js";
import { hideNear } from "../src/set.js";
const FOCUS = [750, 22, 4562]; // between the car (~251 from the lens) and the glass (~297): both within a few pixels // the glass of the left arch (OMA's front is at x 730; the room behind it)
const CAR = { x: 801, z: 4588, yaw: 0.32, scale: 15 }; // metres -> map units (a figurine is 29 = 1.75 m: 16.6; the car a hair smaller)
let SET = null, CARG = null, A6ROOM = null, UNDRESS = null, LAMP = null;
export default {
  name: "oma",
  size: [2160, 3840], fps: 30, duration: 3.5, shutter: 0.5,
  camera: cameraPath({
    keys: [
      { t: 0, pos: [962, 52, 4752], look: [748, 24, 4580], fov: 28, focus: FOCUS },
      { t: 1.75, pos: [955, 51.5, 4757], look: [747, 24, 4581], fov: 27.8, focus: FOCUS },
      { t: 3.5, pos: [948, 51, 4762], look: [746, 24, 4582], fov: 27.6, focus: FOCUS }
    ]
  }),
  lens: { fstop: 22, scale: 1.45 },
  look: {
    // dusk: the sky's last warmth low down, deep blue over it; the street lit by the sky and the shop
    sky: { top: "#24347a", mid: "#5a5aa0", hor: "#f08a64" },
    fog: { color: "#3b3f73", near: 1200, far: 6000 },
    bounce: "#5a4a68", bounceK: 0.22, domeK: 0.95, domeSunGlow: 1.2,
    tone: 0.06, minRough: 0.68, bump: 0.03
  },
  // the sun is down: what is left is a low warm glow from the west (soft, weak), so the forms still have a side
  sun: { az: 200, el: 6, color: "#ff9a6a", intensity: 0.55, radius: 4 },
  shadow: { centre: [760, 0, 4580], ext: 300, domeExt: 360 },
  domeK: 0.95,
  post: { tonemap: "neutral", exposure: 1.7, bloomK: 0.09, bloomThr: 0.9, vig: 0.3, grain: 0.026, lut: "cromatic-night", sat: 1.06, power: 1.08 },
  async prepare(ctx) {
    const { S, K } = ctx;
    // the map batches its static meshes (r198: per cell and material): OMA's box and mirror glass are drawn by a batch,
    // not by the meshes the set swaps; for the stories the batches are undone (the originals draw again)
    window.__perfLab && window.__perfLab.merge(false);
    // set dressing: the two bushes in front of OMA's windows and the street tree in front of the lens
    UNDRESS = hideNear(ctx, [[776, 4598, 6], [751, 4597, 6], [856, 4643, 8]]);
    SET = buildOmaSet(ctx, { lampI: 680, glassOpacity: 0.1, glassRefl: 0.6 });
    // Radu's car, built with three's own modules (MeshPhysicalMaterial is not in the map's bundle), drawn by the map's
    // renderer like everything else; its glass made plain (no transmission pass per sub-frame), the city in its paint
    const T = await import("/__three/build/three.module.js"), { RoundedBoxGeometry } = await import("/__three/examples/jsm/geometries/RoundedBoxGeometry.js");
    const car = buildHeroDacia(T, { RoundedBoxGeometry });
    const env = S.mats.omaGlow.envMap;
    car.group.traverse((m) => { if (!m.isMesh) return; const mt = m.material; if (mt.transmission > 0) { m.material = new T.MeshPhysicalMaterial({ color: mt.color, roughness: 0.02, metalness: 0, transparent: true, opacity: mt.name === "glass" ? 0.28 : 0.55, envMap: env, envMapIntensity: 0.3, side: T.DoubleSide, depthWrite: false }); m.castShadow = false; m.userData.dioNoCast = true; } else { mt.envMap = env; mt.envMapIntensity = mt.metalness > 0.5 ? 0.55 : 0.4; } m.material.userData.dioKeep = true; });
    // the street lamp on the near pavement (the map's own lamp at 759, 4710: its head, warped like everything drawn)
    LAMP = new K.PointLight("#ffc98a", 5200, 260, 2); LAMP.position.copy(S.warpV(new K.Vector3(770, 46, 4702))); LAMP.castShadow = true; LAMP.shadow.mapSize.set(512, 512); LAMP.shadow.camera.near = 1; LAMP.shadow.camera.far = 170; LAMP.shadow.bias = -0.001; LAMP.shadow.normalBias = 0.3; S.scene.add(LAMP);
    CARG = new K.Group(); CARG.add(car.group); car.group.scale.setScalar(CAR.scale); CARG.position.set(CAR.x, 1.2, CAR.z); CARG.rotation.y = CAR.yaw; S.scene.add(CARG);
    // A6's room (capsule people), for the "before" only
    const R = makeOmaRoom({ ...K }); R.group.position.set(706, 0, 4560); R.group.rotation.y = Math.PI / 2; R.group.visible = false; S.scene.add(R.group); A6ROOM = R;
  },
  // the "before": the map as A6 captured it (its own OMA, its room of capsule people behind keyed glass, no hero car)
  beforePrepare(ctx, on) {
    SET.on(!on); if (CARG) CARG.visible = !on; if (LAMP) LAMP.visible = !on;
    if (on) { SET.body.visible = false; SET.set.visible = true; SET.set.children.forEach((c, i) => (c.visible = i === 0)); for (const L of SET.lights) L.visible = false; for (const g of SET.glass) g.visible = false; A6ROOM.pose(0.9); A6ROOM.group.visible = true; }
    else { SET.set.children.forEach((c) => (c.visible = true)); for (const g of SET.glass) g.visible = true; A6ROOM.group.visible = false; SET.on(true); }
  },
  pose() {},
  dispose(ctx) { if (UNDRESS) UNDRESS(); if (LAMP) LAMP.parent.remove(LAMP); window.__perfLab && window.__perfLab.merge(true); if (SET) SET.dispose(); if (CARG) CARG.parent.remove(CARG); if (A6ROOM) A6ROOM.group.parent.remove(A6ROOM.group); }
};
