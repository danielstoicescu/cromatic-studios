// The Shortest Shortcut: the lane curving down to the Dacia row, Sticker Republic and Printoteca on it (late afternoon)
import { street } from "./common.js";
import { GOLDEN } from "../a6/common.js";
const L = { look: { ...GOLDEN.look, domeK: 0.68, bounceK: 0.42 }, sun: { ...GOLDEN.sun, az: 140, el: 30 }, post: { ...GOLDEN.post, exposure: 1.14 } };
export default street({ name: "d", from: { pos: [1600, 130, 5690], look: [1400, 15, 5960] }, to: { pos: [1575, 122, 5735], look: [1395, 15, 5975] }, focus: [[1425, 12, 5905], [1420, 12, 5915]],
  fov: 38, fstop: 6.3, light: L, shadow: { centre: [1430, 0, 5900], ext: 360 } });
