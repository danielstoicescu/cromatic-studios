// Cromatic · diorama renders · story B9 (Daniel on B8, "Nine worlds, one street": the per-frame map captures read too
// crisp): B8's edit, frame for frame (its clock, its cameras, its ride path and brake: shotsB8.mjs, copied below as data),
// filmed in the diorama renderer with the hero vehicles (vendor/hero v3, vendor/dacia1300-hero.js), the map's world
// switched per shot. Same rules as E8: shutter 0 (no smear: every sub-frame at the frame's instant; the samples buy the
// lens, the soft sun, the sky light and the anti-aliasing), the 1300's body on its springs at the brake and the stop,
// a hair of engine shake on every ride. Each world keeps its identity: Sketchbook is drawn by the map's own notebook pass
// (per sub-frame, so it gets the lens and the anti-aliasing but stays pencil on paper), GTA 2 stays top-down and nearly
// flat, Risograph is printed after the render (riso-b9.mjs, two drums on cream paper); the stylised worlds get a lighter
// lens and grade.
//   shots/b9/sNN.mjs = make(NN)
export { hero1300, heroRide, shake, bodyPitch, hideNear, paintSky, petals, sakuraRow, wet, mirror, lamp } from "../e8/common.js";
import { hero1300, heroRide, shake, paintSky, petals, sakuraRow, wet, mirror, lamp } from "../e8/common.js";
import { hideMapRide, mapRide, world, followKey } from "../d7/common.js";
import { cameraPath } from "../../src/camera.js";

// ---------------------------------------------------------------- B8's clock and ride (shotsB8.mjs, 1034de9/b5578f0)
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const X = 1147, V = 88;
const YAW_BEND = -6.2; // (GTA 2, straight down: the city's bend turns Olari by -6.2 deg there; the picture's top follows the street)
export const T_END = 12.7;
export const BRAKE = { at: T_END + 0.05, dur: 2.1, x1: 1188, z1: 7335, dip: 0.032, f: 1.55, damp: 4.2 };
const DIST = (V * BRAKE.dur) / 2, Z0 = BRAKE.z1 - DIST - V * BRAKE.at;
export const STOP = BRAKE.at + BRAKE.dur;
export function car(t) {
  if (t < BRAKE.at) return { x: X, z: Z0 + V * t, yaw: 0, pitch: 0, v: V, d: V * t };
  const u = clamp((t - BRAKE.at) / BRAKE.dur), s = 2 * u - u * u;
  const zb = Z0 + V * BRAKE.at, x = lerp(X, BRAKE.x1, sm(s)), z = zb + DIST * s;
  const dxds = (BRAKE.x1 - X) * 6 * s * (1 - s), yaw = Math.atan2(dxds, DIST);
  let pitch;
  if (t < STOP) pitch = BRAKE.dip * sm(clamp((t - BRAKE.at) / 0.18));
  else { const k = t - STOP; pitch = BRAKE.dip * Math.exp(-BRAKE.damp * k) * Math.cos(2 * Math.PI * BRAKE.f * k); }
  return { x, z, yaw, pitch, v: t < STOP ? V * (1 - u) : 0, d: V * BRAKE.at + DIST * s };
}
// [world, from, to (story s), camera(t, ride) -> { pos, tgt, fov, shift? }, kind, ride]
export const SEG = [
  ["monument", 0, 2.4, (t) => { const u = sm(clamp(t / 2.4)); return { pos: [lerp(1160, 1154, u), lerp(12, 8.5, u), lerp(6080, 6235, u)], tgt: [1146, lerp(12.5, 11, u), lerp(6600, 6720, u)], fov: lerp(50, 46, u) }; }, "open", "1300"],
  ["monument", 2.4, 3.5, (t, c) => { const u = (t - 2.4) / 1.1; return { pos: [c.x - 96 + 6 * u, 4.5, c.z - 14 + 8 * u], tgt: [c.x, 6.5, c.z + 8], fov: 42, shift: [0, 0.1] }; }, "track", "1300"],
  ["nightlife", 3.5, 4.65, (t) => { const u = (t - 3.5) / 1.15, zc = Z0 + V * 4.75; return { pos: [1170 - 2 * u, 3, zc], tgt: [1150 - 3 * u, 6, zc - 90], fov: 48, shift: [0, 0.1] }; }, "pass", "chrome"],
  ["underwater", 4.65, 5.8, (t, c) => { const u = (t - 4.65) / 1.15; return { pos: [c.x + 14, lerp(52, 40, u), c.z - 96], tgt: [c.x, 4, c.z + 36], fov: 48 }; }, "high", "sub"],
  ["circuit", 5.8, 6.95, (t, c) => { const u = (t - 5.8) / 1.15; return { pos: [c.x - 9, 3.5, c.z + lerp(96, 84, u)], tgt: [c.x, 5, c.z], fov: 40, shift: [0, 0.1] }; }, "front", "formula"],
  ["sketch", 6.95, 8.1, (t, c) => { const u = (t - 6.95) / 1.15; return { pos: [c.x + 104, lerp(30, 24, u), c.z + 22 - 10 * u], tgt: [c.x, 8, c.z + 8], fov: 44 }; }, "side", "1300"],
  ["orchid", 8.1, 9.25, (t) => { const u = (t - 8.1) / 1.15, zc = Z0 + V * 9.3; return { pos: [1131 + 2 * u, 2.5, zc], tgt: [1148 + 2 * u, 5, zc - 70], fov: 44, shift: [0, 0.1] }; }, "pass", "scooter"],
  ["gta2", 9.25, 10.4, (t, c) => { const u = (t - 9.25) / 1.15; return { pos: [c.x, lerp(176, 160, u), c.z + 24], tgt: [c.x, 0, c.z + 24.5], fov: 52, yaw: 0 }; }, "top", "patrol"],
  ["riso", 10.4, 11.55, (t, c) => { const u = (t - 10.4) / 1.15; return { pos: [c.x + 18 + 4 * u, 4, c.z + 32], tgt: [c.x, 5, c.z], fov: 44, shift: [0, 0.1] }; }, "three-quarter", "scooter"],
  ["ghibli", 11.55, 12.7, (t, c) => { const u = (t - 11.55) / 1.15; return { pos: [c.x - 96 + 6 * u, 4.5, c.z - 14 + 8 * u], tgt: [c.x, 6.5, c.z + 8], fov: 42, shift: [0, 0.1] }; }, "track", "1300"],
  ["monument", 12.7, 15.75, (t) => { const u = sm(clamp((t - 12.7) / 3.05)); return { pos: [lerp(1290, 1282, u), 7.5, lerp(7368, 7363, u)], tgt: [1075, lerp(33, 28.5, u), 7322], fov: lerp(62, 60, u) }; }, "house", "1300"]
];
// B8's frames: t = a + i / 30 while t < b
export const nFrames = (k) => { const [, a, b] = SEG[k]; let i = 0; while (a + i / 30 < b - 1e-6) i++; return i; };

// ---------------------------------------------------------------- the rides
// scales: E8d's (the map rides' boxes); y: the road (E8's 1.2)
const RIDE = { "1300": { scale: 12.5 }, chrome: { scale: 19.5 }, formula: { scale: 16 }, scooter: { scale: 17.5 }, patrol: { scale: 12.5 } };
const Y = 1.2;
// the submarine: Radu's hero Yellow submarine (vendor/hero/submarine.js, B9), 1 m = 17 map units, hovering a little over
// the street; its screw turns, its portholes and lamps glow (setLamps 0.6). If the file is ever missing, the map's own sub.
const SUB_SCALE = 17;
async function loadSub(ctx) {
  try {
    const r = await heroRide(ctx, "sub", { scale: SUB_SCALE });
    r.v.setLamps && r.v.setLamps(0.6);
    return { hero: true, g: r.g, sub: r.g, place: (x, y, z, yaw, pitch = 0, roll = 0, d = 0) => { r.place(x, y, z, yaw, pitch, roll); const pr = r.parts.propeller; if (pr) { pr.rotation.z = d * 0.35; pr.updateMatrixWorld(true); } }, setLights() {}, dispose: r.dispose };
  } catch (e) { console.warn("b9: no hero sub", e && e.message); }
  const R = await mapRide(ctx.S, "sub"); R.lights(true, { beams: false });
  return { hero: false, g: R.g, place: (x, y, z, yaw, pitch, roll) => R.place(x, y, z, yaw, pitch, roll), setLights() {}, dispose() { R.restore(); } };
}
async function loadRide(ctx, id, lights) {
  if (id === "sub") return loadSub(ctx);
  if (id === "1300") {
    const c = await hero1300(ctx, { lights, scale: RIDE["1300"].scale }); c.setBeam(lights ? 5000 : 0);
    return { g: c.group, sub: c.group.children[0], place: (x, y, z, yaw, pitch = 0, roll = 0, d = 0) => { c.place(x, y, z, yaw, d, pitch); if (roll) { c.group.rotateZ(roll); c.group.updateMatrixWorld(true); } }, setLights: c.setLights, dispose: c.dispose };
  }
  const r = await heroRide(ctx, id, { scale: RIDE[id].scale, lights });
  return { g: r.g, sub: r.g, place: (x, y, z, yaw, pitch = 0, roll = 0, d = 0) => { r.place(x, y, z, yaw, pitch, roll); r.spin(d); }, setLights: r.setLights, setBeacons: r.setBeacons, dispose: r.dispose };
}

// ---------------------------------------------------------------- the worlds' looks (per shot: the world's own palette as a model's light)
const DAY = { tone: 0.05, minRough: 0.64, bump: 0.03 };
export const LOOKS = {
  // Cromatic (monument): B8's golden-hour warmth, a low warm sun; the house shot gets the sun on its front
  monument: {
    look: { sky: { top: "#7f9ade", mid: "#f0c6b4", hor: "#ffd3a2" }, fog: { color: "#f1cdb6", near: 700, far: 5200 }, bounce: "#d9a27c", bounceK: 0.5, domeK: 0.3, domeSunGlow: 1.0, ...DAY },
    sun: { az: 300, el: 17, color: "#ffbf80", intensity: 4.0, radius: 1.4 },
    post: { tonemap: "agx", exposure: 1.2, bloomK: 0.08, bloomThr: 0.9, vig: 0.22, grain: 0.02, lut: "cromatic-diorama", lutMix: 0.8, sat: 1.12, power: 1.06 },
    sky: { top: "#5c79c8", mid: "#eab0a8", hor: "#ffc48c", lit: "#ffd2a0", shade: "#a98aa6", glow: 300, clouds: 0.35, stars: 0 },
    fstop: 16
  },
  // Night Mode: orange and blue, a light drizzle (the street wet, its lamps in it)
  nightlife: {
    look: { sky: { top: "#070b26", mid: "#1c2257", hor: "#5d4a7e" }, fog: { color: "#18204a", near: 400, far: 3600 }, bounce: "#3a3050", bounceK: 0.2, domeK: 0.6, domeSunGlow: 0.2, tone: 0.06, minRough: 0.6, bump: 0.03 },
    sun: { az: 210, el: 34, color: "#a9bcff", intensity: 0.5, radius: 2.5 },
    post: { tonemap: "agx", exposure: 2.0, bloomK: 0.18, bloomThr: 0.8, vig: 0.3, grain: 0.028, lut: "cromatic-night", lutMix: 0.7, sat: 1.15, power: 1.08 },
    sky: { top: "#070b26", mid: "#1c2257", hor: "#5a4a86", lit: "#ff9e3d", shade: "#22264f", glow: 180, clouds: 0.35, stars: 0.7 },
    fstop: 16, night: true, wet: true
  },
  // Underwater: deep teal water, light from far above, the far street lost in the murk
  underwater: {
    look: { sky: { top: "#0a3a5a", mid: "#0f5a74", hor: "#2a8f96" }, fog: { color: "#0f5f72", near: 40, far: 620 }, bounce: "#2f8f8a", bounceK: 0.32, domeK: 0.5, domeSunGlow: 0.5, tone: 0.05, minRough: 0.6, bump: 0.03 },
    sun: { az: 160, el: 68, color: "#c8f6ff", intensity: 2.6, radius: 4 },
    post: { tonemap: "agx", exposure: 1.35, bloomK: 0.12, bloomThr: 0.85, vig: 0.28, grain: 0.024, lut: "cromatic-diorama", lutMix: 0.4, sat: 1.08, power: 1.04 },
    fstop: 16, keyLight: 1400
  },
  // Race Day: a bright clear race afternoon
  circuit: {
    look: { sky: { top: "#5f8fd8", mid: "#a9c4e8", hor: "#e4ebf2" }, fog: { color: "#d4dfea", near: 600, far: 5200 }, bounce: "#a8a49c", bounceK: 0.5, domeK: 0.4, domeSunGlow: 0.6, ...DAY },
    sun: { az: 140, el: 36, color: "#fff2dc", intensity: 4.3, radius: 1.3 },
    post: { tonemap: "agx", exposure: 1.18, bloomK: 0.06, bloomThr: 1.0, vig: 0.2, grain: 0.02, lut: "cromatic-diorama", lutMix: 0.6, sat: 1.12, power: 1.05 },
    sky: { top: "#3f78d8", mid: "#8fb4ea", hor: "#d9e6f2", lit: "#ffffff", shade: "#b9c6dc", glow: 140, clouds: 0.4, stars: 0 },
    fstop: 16
  },
  // Sketchbook: the map's own notebook pass draws every sub-frame (pencil and crayon on paper); the renderer only adds
  // the lens (a light one) and the anti-aliasing
  sketch: {
    look: { model: false, bounce: "#ffffff", bounceK: 0.6, domeK: 0.0, tone: 0, minRough: 0.7, bump: 0 },
    sun: { az: 300, el: 40, color: "#ffffff", intensity: 2.2, radius: 0.5 },
    post: { tonemap: "raw", exposure: 1, bloomK: 0, bloomThr: 2, vig: 0.06, grain: 0.008, lut: "cromatic-diorama", lutMix: 0, sat: 1, power: 1 },
    fstop: 32, sketch: true
  },
  // Sakura: a soft pink spring morning, petals in the air (E8's scooter light)
  orchid: {
    look: { sky: { top: "#a9b8dc", mid: "#f2d4de", hor: "#ffe6d8" }, fog: { color: "#f7dbe6", near: 300, far: 3000 }, bounce: "#f1c4cf", bounceK: 0.62, domeK: 0.42, domeSunGlow: 0.8, ...DAY },
    sun: { az: 65, el: 24, color: "#ffe6cc", intensity: 3.2, radius: 2.2 },
    post: { tonemap: "agx", exposure: 1.2, bloomK: 0.1, bloomThr: 0.9, vig: 0.2, grain: 0.022, lut: "cromatic-diorama", lutMix: 0.8, sat: 1.1, power: 1.07 },
    sky: { top: "#8db2f0", mid: "#f6cfe0", hor: "#ffe2d2", lit: "#fff0f4", shade: "#d9b4cf", glow: 65, clouds: 0.38, stars: 0 },
    fstop: 16, petals: true
  },
  // GTA 2: top-down, retro, dark: nearly flat (a deep focus, the sky light only a little), the street lamps and the
  // patrol's beacons carry it
  gta2: {
    look: { sky: { top: "#1a1e22", mid: "#2a2e34", hor: "#3a3a3c" }, fog: { color: "#1a1e22", near: 800, far: 6000 }, bounce: "#4a4640", bounceK: 0.35, domeK: 0.5, domeSunGlow: 0.2, tone: 0.03, minRough: 0.7, bump: 0.02 },
    sun: { az: 200, el: 62, color: "#c9c4b8", intensity: 1.2, radius: 1.5 },
    post: { tonemap: "agx", exposure: 1.7, bloomK: 0.12, bloomThr: 0.85, vig: 0.18, grain: 0.02, lut: "cromatic-night", lutMix: 0.3, sat: 1.05, power: 1.04 },
    fstop: 45, night: true, beacons: true
  },
  // Risograph: an even daylight (the print does the rest: riso-b9.mjs)
  riso: {
    look: { sky: { top: "#c9d6ea", mid: "#ece6dc", hor: "#f3eee3" }, fog: { color: "#efe9df", near: 600, far: 5000 }, bounce: "#d8d0c4", bounceK: 0.6, domeK: 0.45, domeSunGlow: 0.4, ...DAY },
    sun: { az: 120, el: 42, color: "#fff4e4", intensity: 3.4, radius: 2 },
    post: { tonemap: "agx", exposure: 0.9, bloomK: 0.03, bloomThr: 1.1, vig: 0.0, grain: 0.0, lut: "cromatic-diorama", lutMix: 0.3, sat: 1.35, power: 1.25 },
    fstop: 22
  },
  // Ghib.ly: a soft, hand-painted summer day, big painted clouds
  ghibli: {
    look: { sky: { top: "#6ea8e4", mid: "#bcdcf0", hor: "#f2f0dc" }, fog: { color: "#e2ecef", near: 500, far: 4800 }, bounce: "#b8c48c", bounceK: 0.55, domeK: 0.45, domeSunGlow: 0.7, tone: 0.05, minRough: 0.66, bump: 0.025 },
    sun: { az: 300, el: 30, color: "#fff0d4", intensity: 3.6, radius: 1.8 },
    post: { tonemap: "agx", exposure: 1.18, bloomK: 0.08, bloomThr: 0.95, vig: 0.18, grain: 0.018, lut: "cromatic-diorama", lutMix: 0.5, sat: 1.08, power: 1.03 },
    sky: { top: "#4f8fe0", mid: "#a8d0f0", hor: "#f2efd8", lit: "#ffffff", shade: "#b8c8dc", glow: 300, clouds: 0.62, stars: 0 },
    fstop: 18
  }
};
// the house: the sun round on the plaza's side, the rooms lamp-lit (b8page.js house(), injected by the shot)
const HOUSE = { sun: { az: 75, el: 15, color: "#ffbc7c", intensity: 3.6, radius: 1.4 } };

// ---------------------------------------------------------------- the cameras
// B8's frames came from the beta 4.4 build, whose map rides were drawn ~2/3 the size of the hero rides (their real
// size in the city, as in E8): B8's cameras, as they were, cut the hero rides off. The framing is kept by moving each
// camera back from the ride by DOLLY (the same angle on the ride, the same lens; a hair more street round it), never by
// shrinking the rides. The open (the street) and the house (the plaza) keep their cameras. B8's level cameras (looking
// along the horizontal, the picture shifted) stay level.
const DOLLY = { side: 1.1, top: 1.25, high: 2.0 }, LEVEL = { open: 1, track: 1, pass: 1, front: 1, "three-quarter": 1, house: 1 };
function dolly(kind, q, c, k = DOLLY[kind] || 1.5) {
  let pos = q.pos.slice();
  if (kind === "pass") pos[0] = X + (pos[0] - X) * k;
  else if (kind === "top") pos[1] = pos[1] * k;
  else if (kind !== "open" && kind !== "house") { pos[0] = c.x + (pos[0] - c.x) * k; pos[2] = c.z + (pos[2] - c.z) * k; if (pos[1] > 10) pos[1] *= k; }
  const tgt = q.tgt.slice(); if (LEVEL[kind]) tgt[1] = pos[1];
  return { ...q, pos, tgt };
}

// ---------------------------------------------------------------- the shot
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export function make(k, over = {}) {
  const [W0, a, , camFn, kind, rideId] = SEG[k], L = { ...LOOKS[W0], ...(kind === "house" ? HOUSE : {}), ...over };
  const n = nFrames(k), D = n / 30;
  // the camera: B8's, keyed every 1/30 s (dense: the Catmull-Rom follows it exactly), at local time t (story a + t)
  const keys = []; let shift = null;
  for (let i = 0; i <= n; i++) {
    const t = i / 30, ts = a + t, c = car(ts), q = dolly(kind, camFn(ts, c), c, over.dolly);
    shift = q.shift || null;
    const focus = kind === "open" || kind === "house" ? [c.x, 7, c.z] : [c.x, 6, c.z];
    keys.push({ t, pos: q.pos, look: q.tgt, fov: q.fov, focus, ...(q.yaw != null ? { yaw: q.yaw + YAW_BEND } : {}) });
  }
  const camera = cameraPath({ keys });
  let RIDE = null, UN = [], KEY = null, PET = null, ROW = null, WET = null, MIR = null, LAMPS = [], SKETCH = null;
  const lightsOn = !!L.night || kind === "house" || W0 === "underwater";
  return {
    name: "b9-s" + String(k).padStart(2, "0"), size: [2160, 3840], fps: 30, duration: D, shutter: 0,
    camera, shift, cameraLimits: { maxTurn: 6, maxTurnJump: 2, maxFlip: 8 },
    lens: { fstop: L.fstop || 16, scale: 1.45 },
    look: L.look, sun: L.sun, post: L.post,
    shadow: { centre: [car(a + D / 2).x, 0, car(a + D / 2).z], ext: kind === "open" ? 700 : kind === "house" ? 420 : 340 },
    world: W0, kind, ride: rideId, storyT0: a,
    async prepare(ctx) {
      const { S, K } = ctx;
      await world(S, W0);
      UN.push(hideMapRide(S));
      RIDE = await loadRide(ctx, rideId, lightsOn);
      if (L.sky) UN.push(paintSky(ctx, L.sky));
      if (L.night) { KEY = followKey(ctx, 700, 220); }
      if (L.keyLight) { KEY = followKey(ctx, L.keyLight, 300); }
      if (L.wet) { const c = car(a + D / 2); WET = wet(ctx, { centre: [c.x, 0, c.z], r: 600, rough: 0.28, refl: 0.08 }); MIR = await mirror(ctx, { centre: [c.x, 0, c.z], size: 1200, opacity: 0.45, y: 1.4 }); }
      if (L.night) { const c = car(a + D / 2); LAMPS.push(lamp(ctx, { at: [c.x - 30, 40, c.z + 40], color: "#ffb060", I: 2200, d: 260 }), lamp(ctx, { at: [c.x + 34, 40, c.z - 60], color: "#ffb060", I: 1800, d: 240 })); }
      if (L.petals) { const c = car(a + D / 2); PET = petals(ctx, { centre: [c.x, 0, c.z - 40], half: [60, 120], height: 60, n: 320 }); }
      if (kind === "house") {
        // b8page.js's house(): no curtains, the rooms lamp-lit warm, the light let out (the map's own materials)
        const src = await (await fetch("/__dr/shots/b9/b8page.js")).text(); if (!window.__b8) (0, eval)(src);
        window.__b8.house(true, 1); UN.push(() => window.__b8.house(false));
      }
      if (L.sketch) {
        // the notebook drawn where the ride goes (B8 painted it per frame: the same, once over the shot's path)
        for (let t = 0; t <= D + 0.01; t += 0.1) { const c = car(a + t), q = camFn(a + t, c); for (const p0 of [[c.x, 0, c.z], q.tgt, [c.x, 0, c.z + 60]]) { const v = S.warpV(new K.Vector3(...p0)); S.sketchPaint(v.x, v.z, 900, 1); } }
        if (S.sketchRevealFlush) S.sketchRevealFlush();
        await wait(300);
      }
    },
    pose(t, ctx, i) {
      const ts = a + t, c = car(ts), s = shake(ts, rideId === "scooter" ? 0.008 : rideId === "sub" ? 0.0 : 0.03, k + 1);
      const bob = rideId === "sub" ? 1.2 * Math.sin(ts * 2.1) : 0, y = rideId === "sub" ? 6 + bob : Y; // (the sub hovers ~0.35 m over the street, bobbing)
      RIDE.place(c.x, y + s.dy, c.z, c.yaw, (rideId === "1300" ? c.pitch : rideId === "sub" ? 0.03 * Math.sin(ts * 1.7) : 0) + s.pitch, s.roll, rideId === "sub" ? ts * 30 : c.d);
      if (RIDE.setBeacons && L.beacons) { const beat = Math.floor((ts * 1000) / 190) % 2; RIDE.setBeacons(beat === 0 ? 3.4 : 0.15, beat === 1 ? 3.4 : 0.15); }
      if (KEY) KEY.at(c.x - 20, 30, c.z - 50);
      if (PET) PET.pose(2.2 + ts);
    },
    draw: L.sketch ? (target, cam, ctx) => {
      // the map's own Sketchbook pass (full: the camera as set, the target as the screen): its last draw, meant for the
      // screen, is sent to the sub-frame's target instead
      const S = ctx.S, R = S.renderer, orig = R.setRenderTarget;
      R.setRenderTarget = function (t, ...r) { return orig.call(this, t === null ? target : t, ...r); };
      try { S.sketchRender(performance.now(), cam, true); } finally { R.setRenderTarget = orig; }
    } : undefined,
    subject: () => RIDE.sub || RIDE.g,
    dispose() { RIDE?.dispose(); KEY?.dispose(); PET?.dispose(); ROW?.dispose(); WET?.dispose(); MIR?.dispose(); LAMPS.forEach((l) => l.dispose()); UN.reverse().forEach((f) => f()); UN = []; LAMPS = []; }
  };
}
