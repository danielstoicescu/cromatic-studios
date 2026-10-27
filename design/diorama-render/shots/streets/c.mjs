// Medical Avenue: over the Zdrovit park's gate, down the avenue to Altius and Routine Paris (soft morning)
import { street } from "./common.js";
import { GOLDEN } from "../a6/common.js";
const L = { look: { ...GOLDEN.look, domeK: 0.68, bounceK: 0.42, sky: { top: "#6a8be0", mid: "#e6c6dc", hor: "#ffe0c0" } }, sun: { az: 160, el: 30, color: "#ffe0c0", intensity: 3.6, radius: 1.6 }, post: { ...GOLDEN.post, exposure: 1.12 } };
export default street({ name: "c", from: { pos: [1630, 175, 4760], look: [1485, 40, 5210] }, to: { pos: [1625, 165, 4880], look: [1480, 40, 5330] },
  fov: 38, fstop: 4, light: L, shadow: { centre: [1530, 0, 5100], ext: 620 } });
