// Cromatic · stories in Lottie · v4 (TASK-065c, Daniel: "Two Minutes is used too much"): the new places of stories A and
// B, in the city's logical coordinates (the map's x, z; y up). The same kinds of cameras as v2/v3, somewhere else.
//   A · "Cromatic City": the coffee street (Steam Coffee Shop, Craft Coffee, the Steam truck) instead of Aricescu
//   B · one street, nine worlds: Strada Olari, under the Cromatic Studios House's gate, instead of the Aricescu corner
// (C keeps its overhead drift through the Two Minutes corner: Daniel's one exception; D has no Two Minutes shot.)
import { STORY, K, OVER } from "./shots.mjs";
const street = (o) => ({ level: true, w: Math.round(STORY.w * K * OVER / 2) * 2, h: STORY.h * K, ...o });
export const SHOTS4 = {
  // A · street level on the coffee street, looking north-east at the Steam tower: its shopfront and sign, the green
  // Steam truck at the kerb on the left, the yellow ride parked ahead on the right
  "a4-street": street({ pos: [790, 9, 5440], tgt: [945, 14, 5640], fov: 60, shift: [0, 0.13], park: [842, null, 5545, 0],
    cuts: [["near", 150], ["mid", 560], ["far", 1e9]], skyD: 6000,
    pins: { sign: [905, 22, 5600], tower: [960, 90, 5650], car: [842, 12, 5545] } }),
  // B · on Strada Olari, by the kerb: the gate's banner (CROMATIC STUDIOS HOUSE · STR. OLARI 9 · COME BY) across the
  // street, the festoon under it, the house's arches on the right, the town behind
  "b4-street": street({ pos: [1215, 6, 7040], tgt: [1150, 20, 7290], fov: 46, shift: [0, 0.16], noMesa: true,
    cuts: [["near", 125], ["mid", 340], ["far", 1e9]], skyD: 6000,
    pins: { sign: [1170, 30, 7220] } })
};
// A · the overhead straight down on the coffee district (two lenses: the crash zoom), and the low shot behind the
// ride's boot on the coffee street, the street ahead; the ride pulls away north
export const A4 = {
  over: { pos: [842, 1100, 5560], tgt: [842, 0, 5561], fovs: [46, 23.6], w: 2160, h: 3840, level: false, cuts: [["up", 1e9]], groundY: 3.4, flatH: 3.6 },
  boot: { pos: [842, 2.4, 5507], tgt: [842, 5, 5760], fov: 58, shift: [0, 0.12], w: 2160, h: 3840, level: true, dur: 1.6 }
};
// the ride parked on the coffee street heading north (+z), then pulling away: still for 0.45 s, then 140 u/s²
export const bootCar4 = (t) => { const tt = Math.max(0, t - 0.45), s = 0.5 * 140 * tt * tt; return { x: 842, y: 1.73, z: 5545 + s, yaw: 0, lights: 1 }; };
