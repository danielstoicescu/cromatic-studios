// Fintech Boulevard: high over the boulevard's centre line, gliding down it between the towers (Investimental and
// Assetto on the east kerb, Infinity Capital and Longshield on the west), the sun behind the lens
import { street } from "./common.js";
import { GOLDEN } from "../a6/common.js";
const L = { look: { ...GOLDEN.look, domeK: 0.68, bounceK: 0.42, sky: { top: "#4a72d6", mid: "#c6c0e2", hor: "#ffd2a8" } }, sun: { az: 168, el: 32, color: "#ffdcb8", intensity: 3.8, radius: 1.5 }, post: { ...GOLDEN.post, exposure: 1.12 } };
export default street({ name: "b", from: { pos: [2072, 236, 4250], look: [2084, 30, 4730] }, to: { pos: [2074, 222, 4385], look: [2086, 30, 4865] },
  focus: [[2090, 40, 4700], [2090, 40, 4835]], fov: 40, fstop: 4.5, light: L, shadow: { centre: [2080, 0, 4750], ext: 700 } });
