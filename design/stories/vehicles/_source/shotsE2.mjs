// story E2 (TASK-111b, Daniel's notes on E1): the shots (30 fps). The sequence is a list: a ride with on: false is
// kept (its line, its tag) but has no shot; set on: true to bring it back (the clock follows).
//   opening  the 1300 [driver.], then the F1 [pilot.] (the pill red like the car: Daniel's exception)
//   rides    Mystery van, Chrome racer, the E-scooter standing still under falling Sakura petals, the 1300 flat out
//            through the frame with the Polite Patrol coming up behind it, the Patrol held in the middle, following
//   then the lead-in and the end as E1
export const TURN = { e: 0.3, R: 340, fov: 22, ty: 14 };
export const RED = "#D7362C"; // (the F1's paint as the map renders it, sampled)
export const SEQ = [
  { id: "t1", ride: "dacia1300", dur: 36, a: [0.55, 0.8], ty: 26, kind: "open" },
  { id: "t2", ride: "f1", dur: 36, a: [0.6, 0.85], ty: 26, kind: "open" },
  { id: "van", ride: "groovy", dur: 45, a: [0.42, 1.04], on: true },
  { id: "chrome", ride: "monopoly", dur: 45, a: [0.42, 1.04], on: true },
  { id: "scooter", ride: "scooter", dur: 66, a: [0.86, 0.94], on: true, petals: true }, // (all but still: the petals do the moving)
  { id: "rush", ride: "dacia1300", dur: 60, on: true, kind: "pass" }, // (the 1300 through the frame, the Patrol up behind it)
  { id: "patrol", ride: "cop", dur: 60, a: [1.3, 1.05], ty: 8, on: true, kind: "follow" }, // (a little higher: the lines under it)
  // (not in Daniel's E2 sequence; kept, with their E1 lines, to come back)
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
// the pass (the rush shot): the camera side on, the ride still and the camera sliding past it (on paper it is the same
// picture as the ride racing by); dz: where the ride sits along its own axis relative to the frame's middle, per frame
export const PASS = { a: 1.42, e: 0.2, R: 340, ty: 12, sub: 6,
  car: (f) => (f <= 16 ? 64 - (128 * f) / 16 : null),   // (in from the right, out at the left in half a second)
  cop: (f) => (f < 14 ? null : f < 46 ? 70 * Math.pow(1 - (f - 14) / 32, 3) : 0), // (up from behind, slowing to the middle)
  shake: (f) => (f < 20 ? 1.4 * Math.exp(-f / 9) : 0) };
