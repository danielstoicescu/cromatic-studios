// Cromatic · stories in Lottie · story B8 (TASK-065j, Daniel on B7): Str. Olari, driven, more cinematic and warmer.
// - opens wide on Str. Olari in a 2.39:1 band (the black bars are Lottie's, buildB8.mjs) that opens out to 9:16; the
//   camera dollies in behind the 1300 as it drives off up the street, the street's plate revealed as the bars open
// - longer lenses and a slow move in every shot; a warm golden-hour key (b8page.js warm) and a warm key light on the ride
// - Ghib.ly's crane before the house is gone (Daniel: "strange")
// - the stop in front of the house: a constant-deceleration brake on a curve into the plaza, the nose dips while it
//   brakes, then pitches back past level as it stops and settles (a damped spring)
// - the house: no curtains, the rooms lamp-lit warm and the light let out (b8page.js house)
// Logical x, z (y up); t in screen seconds from the story's start.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const YV = 1.73, X = 1147, V = 88;
export const T_END = 11.55; // the house shot starts (the ride turning into the plaza)
export const BRAKE = { at: T_END + 0.05, dur: 2.1, x1: 1188, z1: 7335, dip: 0.032, f: 1.55, damp: 4.2 };
const DIST = (V * BRAKE.dur) / 2, Z0 = BRAKE.z1 - DIST - V * BRAKE.at; // (constant deceleration from V: V * dur / 2 to the stop)
export const STOP = BRAKE.at + BRAKE.dur;
export function car(t) {
  if (t < BRAKE.at) return { x: X, y: YV, z: Z0 + V * t, yaw: 0, pitch: 0 };
  const u = clamp((t - BRAKE.at) / BRAKE.dur), s = 2 * u - u * u; // (distance fraction, braking evenly)
  const zb = Z0 + V * BRAKE.at, x = lerp(X, BRAKE.x1, sm(s)), z = zb + DIST * s;
  const dxds = (BRAKE.x1 - X) * 6 * s * (1 - s), yaw = Math.atan2(dxds, DIST); // (the heading follows the curve)
  // the nose: down as the brakes bite (0.18 s), held while braking, then at the stop the body pitches back and settles
  let pitch;
  if (t < STOP) pitch = BRAKE.dip * sm(clamp((t - BRAKE.at) / 0.18));
  else { const k = t - STOP; pitch = BRAKE.dip * Math.exp(-BRAKE.damp * k) * Math.cos(2 * Math.PI * BRAKE.f * k); }
  return { x, y: YV, z, yaw, pitch };
}
const W = 2160, H = 3840;
// the dark worlds (the windows and the beams carry the light; the warm key softer)
const DARK = { nightlife: 1, underwater: 1, gta2: 1 };
// the shots: [world, from, to (s), camera(t, the ride's pose), kind, mode]
export const SEG = [
  ["monument", 0, 2.4, (t, c) => { const u = sm(clamp(t / 2.4)); return { pos: [lerp(1160, 1154, u), lerp(12, 8.5, u), lerp(6080, 6235, u)], tgt: [1146, lerp(12.5, 11, u), lerp(6600, 6720, u)], fov: lerp(50, 46, u), level: true }; }, "open"],
  ["monument", 2.4, 3.5, (t, c) => { const u = (t - 2.4) / 1.1; return { pos: [c.x - 96 + 6 * u, 4.5, c.z - 14 + 8 * u], tgt: [c.x, 6.5, c.z + 8], fov: 42, shift: [0, 0.1], level: true }; }, "track"],
  ["nightlife", 3.5, 4.65, (t) => { const u = (t - 3.5) / 1.15, zc = Z0 + V * 4.75; return { pos: [1170 - 2 * u, 3, zc], tgt: [1150 - 3 * u, 6, zc - 90], fov: 48, shift: [0, 0.1], level: true }; }, "pass"],
  ["underwater", 4.65, 5.8, (t, c) => { const u = (t - 4.65) / 1.15; return { pos: [c.x + 14, lerp(52, 40, u), c.z - 96], tgt: [c.x, 4, c.z + 36], fov: 48, level: false }; }, "high"],
  ["circuit", 5.8, 6.95, (t, c) => { const u = (t - 5.8) / 1.15; return { pos: [c.x - 9, 3.5, c.z + lerp(96, 84, u)], tgt: [c.x, 5, c.z], fov: 40, shift: [0, 0.1], level: true }; }, "front"],
  ["sketch", 6.95, 8.1, (t, c) => { const u = (t - 6.95) / 1.15; return { pos: [c.x + 104, lerp(30, 24, u), c.z + 22 - 10 * u], tgt: [c.x, 8, c.z + 8], fov: 44, level: false }; }, "side", "sketch"],
  ["orchid", 8.1, 9.25, (t) => { const u = (t - 8.1) / 1.15, zc = Z0 + V * 9.3; return { pos: [1131 + 2 * u, 2.5, zc], tgt: [1148 + 2 * u, 5, zc - 70], fov: 44, shift: [0, 0.1], level: true }; }, "pass"],
  ["gta2", 9.25, 10.4, (t, c) => { const u = (t - 9.25) / 1.15; return { pos: [c.x, lerp(176, 160, u), c.z + 24], tgt: [c.x, 0, c.z + 24.5], fov: 52, level: false }; }, "top"],
  ["riso", 10.4, 11.55, (t, c) => { const u = (t - 10.4) / 1.15; return { pos: [c.x + 18 + 4 * u, 4, c.z + 32], tgt: [c.x, 5, c.z], fov: 44, shift: [0, 0.1], level: true }; }, "three-quarter", "riso"],
  ["monument", 11.55, 14.6, (t) => { const u = sm(clamp((t - 11.55) / 3.05)); return { pos: [lerp(1302, 1288, u), lerp(8.5, 7.5, u), lerp(7374, 7366, u)], tgt: [1075, 26, 7322], fov: lerp(64, 61, u), level: true }; }, "house"]
].map(([world, a, b, cam, kind, mode]) => ({ world, a, b, kind, mode: mode || null, warm: DARK[world] ? 0.55 : 1, key: DARK[world] ? 0.9 : 0.55, house: kind === "house" ? 1 : 0, cam: (t) => ({ ...cam(t, car(t)), w: W, h: H }) }));
export const DUR = 14.6; // (then the black and the pill: 2 s more on the cards' clock)
// the letterbox: a 2.39:1 band in the 9:16 frame, held, then opening out to full frame
export const BARS = { band: 1080 / 2.39, hold: 0.7, open: 1.5 }; // (open from 0.7 s to 2.2 s, eased)
