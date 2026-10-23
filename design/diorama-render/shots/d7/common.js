// Cromatic · diorama renders (TASK-118) · story D7 in diorama (Iris's D6, Daniel's notes): what its shots share.
// The clock (D6's, at 60 fps, "Sip through." taken out and everything after it moved up), the looks (the map's day
// for the city from high and Steam's street; the rides at night under a painted night sky), the map's own rides
// (the van, the F1, the chrome racer, the plane, the patrol, the sub) put where a shot wants them, Radu's hero Dacia.
export { heroCar, hideMapRide, GOLDEN, DUSK, SUNSET } from "./a-common.js";
import { paintSky } from "../../src/sky.js";
const SIP = [1696, 1816], CUT = SIP[1] - SIP[0];
const T6 = { site: [0, 240], bird: [240, 456], zoom: [456, 660], steam: [660, 850], page: [790, 1204], r1: [1204, 1288], r2: [1288, 1378], r3: [1378, 1510], r4: [1510, 1600], r5: [1600, 1696], r9: [1816, 1906], r8: [1906, 2026], fount: [2026, 2206], end: [2206, 2346] };
export const T7 = Object.fromEntries(Object.entries(T6).map(([k, [a, b]]) => [k, a >= SIP[1] ? [a - CUT, b - CUT] : [a, b]]));
export const F7 = 2346 - CUT;
export const secs = (k, extra = 0) => (T7[k][1] - T7[k][0] + extra) / 60;
export const NIGHT = {
  look: { sky: { top: "#070b26", mid: "#1c2257", hor: "#5d4a7e" }, fog: { color: "#141a3c", near: 900, far: 5200 }, bounce: "#3a3050", bounceK: 0.14, domeK: 0.55, domeSunGlow: 0.2, tone: 0.06, minRough: 0.68, bump: 0.03 },
  sun: { az: 210, el: 34, color: "#a9bcff", intensity: 0.45, radius: 2.5 },
  post: { tonemap: "neutral", exposure: 1.8, bloomK: 0.13, bloomThr: 0.85, vig: 0.3, grain: 0.026, lut: "cromatic-night", sat: 1.06, power: 1.08 }
};
export const nightSky = (ctx) => paintSky(ctx, { top: "#070b26", mid: "#1c2257", hor: "#5d4a7e", lit: "#b98aa0", shade: "#22264f", glow: 200, clouds: 0.36, stars: 1.0, k: 1.0 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// the map's world: its scheme (the colours, the lamps), the weather off
export async function world(S, id) {
  const cur = S.schemes[S.state.schemeIdx].id;
  if (cur !== id) { window.__scheme(id); await wait(6500); }
  S.state.weatherOn = false;
}
// the map's own ride, swapped in (its spawn played out), then posed per sub-frame: place(x, y, z, yaw, pitch?, roll?)
export async function mapRide(S, id) {
  // D9: the map plays a spawn when a ride is swapped in (a drop, then a squash: x and z up to +18 %, y down): it runs
  // on the page's clock, which a render has frozen; left half-played, the ride kept a squashed scale into the shot
  // (Daniel's "stretched" Snoop, Pass Go and sub). The clock is ticked until the spawn is over, then the ride's own
  // scale is read, uniform
  if (S.state.vehicleId !== id) { window.__api.setVehicle(id); await wait(600); }
  for (let i = 0; i < 150 && window.__vclock && window.__vclock.frozen; i++) window.__vclock.tick(1 / 30);
  await wait(window.__vclock && window.__vclock.frozen ? 0 : 2600);
  const v = S.veh(), g = v.group, keep = { p: g.position.clone(), q: g.quaternion.clone(), vis: g.visible, s: g.scale.clone() }, base = g.scale.y;
  if (Math.abs(g.scale.x - g.scale.y) > 1e-4) console.warn("mapRide: still squashed", id, g.scale.toArray());
  g.visible = true;
  return {
    v, g,
    // (D9: beams: false keeps the lamps lit without their light cones, which read as odd flares from below)
    lights(on, { beams = true } = {}) { v.lampGlow?.(!!on); if (v.beams) v.beams.visible = !!on && beams; },
    // (D8: the city's bend scales the ground plan by s where the ride stands, never its height: the ride is drawn
    // 1/s wider and deeper, so its proportions on screen are its own)
    place(x, y, z, yaw, pitch = 0, roll = 0) { const k = 1 / warpScale(S, x, z); g.position.set(x, y, z); g.rotation.set(0, yaw, 0); if (pitch) g.rotateX(pitch); if (roll) g.rotateZ(roll); g.scale.set(base * k, base, base * k); g.updateMatrixWorld(true); },
    restore() { g.position.copy(keep.p); g.quaternion.copy(keep.q); g.scale.copy(keep.s); g.visible = keep.vis; }
  };
}
// a soft key over the lens's shoulder, kept on a ride (night: the ride reads in its own colours)
export function followKey(ctx, I = 800, d = 200) { const { S, K } = ctx, L = new K.PointLight("#ffe6c8", I, d, 2); L.castShadow = false; S.scene.add(L); return { L, at(x, y, z) { L.position.copy(S.warpV(new K.Vector3(x, y, z))); L.updateMatrixWorld(true); }, dispose() { L.parent?.remove(L); } }; }
// A D6 camera ({ pos, tgt, fov, roll }) as keys, with a small move of our own (the 2D push of D6 made a 3D one)
export const L3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
export const toward = (pos, tgt, k) => L3(pos, tgt, k); // a dolly: k of the way towards the target
import { hideNear } from "../../src/set.js";
import { figurine } from "../../src/figurines.js";
// Steam as A8 dressed it: its sign lit as a lightbox, a warm light on its front, figurines at its tables
export function dressSteam(ctx) {
  const { S, K } = ctx; let SIGN = null; const v = new K.Vector3();
  S.scene.traverse((o) => { if (SIGN || !o.isMesh || !o.material || !o.material.isMeshBasicMaterial || !o.material.map) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld); if (Math.abs(v.x - 949) < 3 && Math.abs(v.y - 37) < 3 && Math.abs(v.z - 5640) < 3) SIGN = [o, o.material.color.clone()]; });
  if (SIGN) SIGN[0].material.color.multiplyScalar(1.9);
  const L = new K.PointLight("#ffd9a8", 2600, 160, 2); L.position.copy(S.warpV(new K.Vector3(905, 44, 5612))); S.scene.add(L);
  const undress = hideNear(ctx, [[926, 5606, 3], [918, 5648, 3], [936, 5678, 3], [908, 5628, 3]]);
  const G = new K.Group(); S.scene.add(G);
  const put = (o, x, z, rot) => { const f = figurine(K, o); f.position.set(x, 0.4, z); f.rotation.y = rot; G.add(f); };
  put({ sex: "f", h: 28, skin: "#e3b391", hair: "#3b2416", hairStyle: "bun", top: "#e9e3d3", jacket: "#c4553a", bottom: "#2b2b2e", pose: "cupTalk", cupSleeve: "#2f3034" }, 926, 5606, -Math.PI / 2 - 0.4);
  put({ sex: "m", h: 29.5, skin: "#c98f6a", hair: "#1b120c", hairStyle: "crop", top: "#2f4f6b", bottom: "#c9b99a", shoes: "#efe8dc", pose: "walk" }, 908, 5628, Math.PI - 0.2);
  put({ sex: "m", h: 29, skin: "#f0c6a4", hair: "#6b6b6b", hairStyle: "short", beard: true, top: "#f2efe8", jacket: "#3a3f36", bottom: "#2d3340", pose: "standEasy", glasses: true }, 918, 5648, -Math.PI / 2 + 0.3);
  put({ sex: "f", h: 27.5, skin: "#8d5a3c", hair: "#0f0b08", hairStyle: "long", top: "#f3d36a", bottom: "#24304a", pose: "phone" }, 936, 5678, -Math.PI / 2);
  return () => { if (SIGN) SIGN[0].material.color.copy(SIGN[1]); L.parent?.remove(L); undress(); G.parent?.remove(G); };
}
// a D5 camera function sampled into keys, one a frame (the same picture at every frame: the pins stay on their places)
export function keysOf(fn, dur, fps = 30) { const out = []; for (let i = 0, n = Math.round(dur * fps); i <= n; i++) { const t = i / fps, c = fn(t); out.push({ t, pos: c.pos, look: c.tgt, fov: c.fov }); } return out; }

// the bend's local scale of the ground plan at (x, z): sqrt |det J| of the warp (conformal: the same in every direction)
export function warpScale(S, x, z) { const V = S.K.Vector3, p = S.warpV(new V(x, 0, z)), a = S.warpV(new V(x + 1, 0, z)).sub(p), b = S.warpV(new V(x, 0, z + 1)).sub(p); return Math.sqrt(Math.abs(a.x * b.z - a.z * b.x)); }
// the city from high in Daniel's D8 light: golden, more sun, warmer, livelier (not the grey of D7's)
export const BRIGHT = {
  look: { sky: { top: "#6f96ec", mid: "#e4bfd2", hor: "#ffd1a4" }, fog: { color: "#f2d6c4", near: 1800, far: 11000 }, bounce: "#e0a882", bounceK: 0.42, domeK: 0.32, domeSunGlow: 0.9, tone: 0.06, minRough: 0.7, bump: 0.03 },
  sun: { az: 78, el: 34, color: "#ffcf96", intensity: 4.6, radius: 1.4 },
  post: { tonemap: "neutral", exposure: 1.22, bloomK: 0.06, bloomThr: 1.0, vig: 0.18, grain: 0.02, lut: "cromatic-diorama", sat: 1.2, power: 1.08 }
};
