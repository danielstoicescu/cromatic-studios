// story E · the shots (30 fps frames). The opening: three quick rides under the title (road, air, water); then the nine
// rides 1.5 s each, Mira's order (road first, then air, then water); the lead-in and the end on paper / black.
// Every ride on the same turntable at the same distance: their real scale relationship (the scooter small).
export const TURN = { e: 0.3, R: 340, fov: 22, ty: 14 };
const RIDES = ["dacia1300", "groovy", "f1", "monopoly", "scooter", "foodvan", "cop", "plane", "sub"];
export const SHOTS = [
  { id: "t1", ride: "dacia1300", t: [0, 30], a: [0.55, 0.78], ty: 26 },
  { id: "t2", ride: "plane", t: [30, 60], a: [0.6, 0.83], ty: 26 },
  { id: "t3", ride: "sub", t: [60, 90], a: [0.6, 0.83], ty: 26 },
  ...RIDES.map((ride, k) => ({ id: `r${k + 1}`, ride, t: [90 + 45 * k, 135 + 45 * k], a: [0.42, 1.04] })),
  { id: "leadin", t: [495, 540] },
  { id: "end", t: [540, 600] }
];
export const F = 600;
// the clock the cards cue on (30 fps)
export const CLOCK = Object.fromEntries(SHOTS.map((s) => [s.id, s.t]));
