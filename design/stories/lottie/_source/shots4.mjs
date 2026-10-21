// Cromatic · stories in Lottie · v4 (TASK-065c, Daniel: "Two Minutes is used too much"): the new places of stories A and
// B, in the city's logical coordinates (the map's x, z; y up). The same kinds of cameras as v2/v3, somewhere else.
//   A · "Cromatic City": the coffee street (Steam Coffee Shop, Craft Coffee, the Steam truck) instead of Aricescu
//   B · one street, nine worlds: the Cromatic Studios House on Strada Olari, frontal, instead of the Aricescu corner
// (C keeps its overhead drift through the Two Minutes corner: Daniel's one exception; D has no Two Minutes shot.)
import { STORY, K, OVER } from "./shots.mjs";
const street = (o) => ({ level: true, w: Math.round(STORY.w * K * OVER / 2) * 2, h: STORY.h * K, ...o });
export const SHOTS4 = {
  // A · street level on the coffee street, looking north-east at the Steam tower: its shopfront and sign, the green
  // Steam truck at the kerb on the left, the yellow ride parked ahead on the right
  "a4-street": street({ pos: [790, 9, 5440], tgt: [945, 14, 5640], fov: 60, shift: [0, 0.13], park: [842, null, 5545, 0],
    cuts: [["near", 150], ["mid", 560], ["far", 1e9]], skyD: 6000,
    pins: { sign: [905, 22, 5600], tower: [960, 90, 5650], car: [842, 12, 5545] } }),
  // B · (Daniel, round 2: "a frontal camera on the house") the Cromatic Studios House square on: the two arched windows
  // under the green roof, the arcade below, the plaza in front, a cypress and the town at its sides
  "b4-street": street({ pos: [1290, 7, 7330], tgt: [1060, 28, 7330], fov: 76, shift: [0, 0.1], noMesa: true,
    cuts: [["near", 125], ["mid", 340], ["far", 1e9]], skyD: 6000,
    pins: { windows: [1075, 40, 7330] } })
};
// A · the overhead straight down on the coffee district (two lenses: the crash zoom), and the low shot behind the
// ride's boot on the coffee street, the street ahead; the ride pulls away north
export const A4 = {
  over: { pos: [842, 1100, 5560], tgt: [842, 0, 5561], fovs: [46, 23.6], w: 2160, h: 3840, level: false, cuts: [["up", 1e9]], groundY: 3.4, flatH: 3.6 },
  boot: { pos: [842, 2.4, 5507], tgt: [842, 5, 5760], fov: 58, shift: [0, 0.12], w: 2160, h: 3840, level: true, dur: 1.6 }
};
// the ride parked on the coffee street heading north (+z), then pulling away: still for 0.45 s, then 140 u/s²
export const bootCar4 = (t) => { const tt = Math.max(0, t - 0.45), s = 0.5 * 140 * tt * tt; return { x: 842, y: 1.73, z: 5545 + s, yaw: 0, lights: 1 }; };

// ---------- A v4 (Daniel's storyboard, round 2): the car from above, already moving; Steam; OMA; Slow Coffee; the drive away ----------
// the drone over the ride on the coffee street: one tall picture of the street straight down (scrolled under the ride
// in the story), the ride alone from straight above it (it stays in frame; the street runs under it)
export const A5 = {
  strip: { pos: [842, 350, 5605], tgt: [842, 0, 5605.5], fov: 59.6, w: 1080, h: 3840, level: false, cuts: [["up", 1e9]], groundY: 3.4, flatH: 3.6 },
  ride: { pos: [842, 350, 5520], tgt: [842, 0, 5520.5], fov: 31.4, w: 1080, h: 1920, level: false },
  ridePose: { x: 842, y: 1.73, z: 5520, yaw: 0, lights: 0 },
  // OMA Coffee square on: the orange house, its two arched windows, the small "oma" plate between them
  oma: { pos: [850, 7, 4545], tgt: [706, 16, 4560], fov: 62, shift: [0, 0.1], w: 2592, h: 3840, level: true },
  // the Slow Coffee Festival's dome (Romexpo) by day, its ribs and its rim against the sky
  scf: { pos: [1420, 8, 4960], tgt: [1150, 50, 5140], fov: 60, shift: [0, 0.1], w: 2592, h: 3840, level: true },
  // the drive away: the boot shot (A4.boot), the ride going on down the coffee street until it is small
  boot: { pos: [842, 2.4, 5507], tgt: [842, 5, 5760], fov: 58, shift: [0, 0.12], w: 2160, h: 3840, level: true, dur: 3.6 }
};
// still for 0.3 s, then 70 u/s² up to 115 u/s, then steady: ~300 u away by the end (small, far down the street)
export const driveCar = (t) => { const tt = Math.max(0, t - 0.3), ta = 115 / 70, s = tt < ta ? 0.5 * 70 * tt * tt : 0.5 * 70 * ta * ta + 115 * (tt - ta); return { x: 842, y: 1.73, z: 5545 + s, yaw: 0, lights: 1 }; };
