// story E3 (TASK-111c, Daniel's notes on E2): E2 with
//   the opening: the 1300 [driver.]; the Cropduster flying up and down in frame while the pill rolls to [pilot.]
//     (still yellow); then the F1 in its place, the pill only turning red (the same word) on that cut
//   the chase slower: the 1300 on screen about a second, a lighter blur; the Patrol up behind it, smooth, both in the
//     frame for a moment, the 1300 in front; then the Patrol held, following (its camera picks up the chase's)
//   the end: "Pick your ride." over the pill
export const TURN = { e: 0.3, R: 340, fov: 22, ty: 14 };
export const RED = "#D7362C";
export const SEQ = [
  { id: "t1", ride: "dacia1300", dur: 36, a: [0.55, 0.8], ty: 26, kind: "open" },
  { id: "t2", ride: "plane", dur: 42, a: [0.62, 0.86], ty: 26, kind: "open", bob: 7 }, // (up and down: a gentle climb and dive)
  { id: "t3", ride: "f1", dur: 36, a: [0.6, 0.85], ty: 26, kind: "open" },
  { id: "van", ride: "groovy", dur: 45, a: [0.42, 1.04], on: true },
  { id: "chrome", ride: "monopoly", dur: 45, a: [0.42, 1.04], on: true },
  { id: "scooter", ride: "scooter", dur: 66, a: [0.86, 0.94], on: true, petals: true },
  { id: "rush", ride: "dacia1300", dur: 72, on: true, kind: "pass" },
  { id: "patrol", ride: "cop", dur: 60, a: [1.42, 1.12], ty: [12, 8], on: true, kind: "follow" },
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
const car = (f) => 70 - 3 * f;
export const PASS = { a: 1.42, e: 0.2, R: 340, ty: 12, sub: 4, shutter: 0.5,
  car: (f) => (car(f) > -90 ? car(f) : null),
  cop: (f) => (f < 25 ? 115 - 3 * f : f < 55 ? 40 * Math.pow(1 - (f - 25) / 30, 2) : 0),
  shake: (f) => (f < 40 ? 0.5 * Math.exp(-f / 14) : 0) };
