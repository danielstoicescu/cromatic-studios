// story E4 (TASK-111d, Daniel's notes on E3): E3 with every ride higher in the frame (nearer the middle) and a chase that drives: the wheels turning, the bodies pitching and lifting on the road, the Patrol's beacons flashing, a lower camera; E3 was:
//   the opening: the 1300 [driver.]; the Cropduster flying up and down in frame while the pill rolls to [pilot.]
//     (still yellow); then the F1 in its place, the pill only turning red (the same word) on that cut
//   the chase slower: the 1300 on screen about a second, a lighter blur; the Patrol up behind it, smooth, both in the
//     frame for a moment, the 1300 in front; then the Patrol held, following (its camera picks up the chase's)
//   the end: "Pick your ride." over the pill
export const TURN = { e: 0.3, R: 340, fov: 22, ty: 2 }; // (E4: the rides higher, near the middle)
export const RED = "#D7362C";
export const SEQ = [
  { id: "t1", ride: "dacia1300", dur: 36, a: [0.55, 0.8], ty: 12, kind: "open" },
  { id: "t2", ride: "plane", dur: 42, a: [0.62, 0.86], ty: 12, kind: "open", bob: 7 }, // (up and down: a gentle climb and dive)
  { id: "t3", ride: "f1", dur: 36, a: [0.6, 0.85], ty: 12, kind: "open" },
  { id: "van", ride: "groovy", dur: 45, a: [0.42, 1.04], on: true },
  { id: "chrome", ride: "monopoly", dur: 45, a: [0.42, 1.04], on: true },
  { id: "scooter", ride: "scooter", dur: 66, a: [0.86, 0.94], on: true, petals: true },
  { id: "rush", ride: "dacia1300", dur: 84, on: true, kind: "pass" },
  { id: "patrol", ride: "cop", dur: 60, a: [1.34, 1.08], ty: [3, 0], on: true, kind: "follow", beacon: true },
  { id: "f1", ride: "f1", dur: 45, a: [0.42, 1.04], on: false },
  { id: "foodvan", ride: "foodvan", dur: 45, a: [0.42, 1.04], on: false },
  { id: "plane", ride: "plane", dur: 45, a: [0.42, 1.04], on: false },
  { id: "sub", ride: "sub", dur: 45, a: [0.42, 1.04], on: false }
];
let t = 0;
export const SHOTS = [];
for (const s of SEQ) { if (s.on === false) continue; SHOTS.push({ ...s, t: [t, t + s.dur] }); t += s.dur; }
SHOTS.push({ id: "leadin", t: [t, t + 45] }); t += 45;
SHOTS.push({ id: "end", t: [t, t + 60] }); t += 60;
export const F = t;
export const CLOCK = Object.fromEntries(SHOTS.map((s) => [s.id, s.t]));
// the chase: side on, the camera sliding past the still rides (dz: where a ride sits along its axis from the frame's
// middle; + is the right of the frame). The 1300 crosses at 3 units a frame (about a second on screen); the Patrol 45
// behind it at the same speed, then easing into the middle and staying there (its shot goes on from there)
// E4: lower and a hair more frontal; the 1300 crosses at 2.6 a frame (on screen well over a second), the Patrol 40
// behind it, then braking into the middle (its nose dips, it settles); wheels turn with the speed they would have, the
// bodies bob on the road, the beacons flash red-blue (the map's 190 ms beat)
const car = (f) => 74 - 2.6 * f;
const copZ = (f) => (f < 30 ? 114 - 2.6 * f : f < 66 ? 36 * Math.pow(1 - (f - 30) / 36, 2) : 0);
export const PASS = { a: 1.32, e: 0.12, R: 330, ty: 4, sub: 4, shutter: 0.5,
  car: (f) => (car(f) > -95 ? car(f) : null),
  cop: (f) => copZ(f),
  shake: (f) => (f < 50 ? 0.35 * Math.exp(-f / 20) : 0),
  // the body and the wheels, per ride (f: the frame; the speed, 10 units a frame flat out, from the slope)
  fx: (who, f) => {
    const v = who === "car" ? 10 : f < 30 ? 10 : f < 66 ? 10 * (1 - (f - 30) / 36) : 0, d = who === "car" ? 10 * f : (f < 30 ? 10 * f : 300 + 10 * ((f - 30) - ((f - 30) ** 2) / 72));
    const brake = who === "cop" && f >= 30 && f < 70 ? Math.sin(Math.PI * Math.min(1, (f - 30) / 40)) : 0;
    return { spin: -d * 0.35, pitch: (who === "car" ? 0 : 0.035 * brake) + 0.006 * Math.sin(f * 1.7 + (who === "car" ? 0 : 2)) * (v / 10), lift: 0.12 * Math.sin(f * 2.3 + (who === "car" ? 1 : 0)) * (v / 10), beacon: who === "cop" ? Math.floor((f * 1000) / 30 / 190) % 2 : null };
  } };
