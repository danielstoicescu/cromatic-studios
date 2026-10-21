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
