// Coffee Street: a low glide past Steam's terrace towards Berero and Lapterra, the street curving away (golden hour)
import { street } from "./common.js";
import { GOLDEN } from "../a6/common.js";
export default street({ name: "a", from: { pos: [955, 102, 5285], look: [795, 25, 5555] }, to: { pos: [915, 94, 5390], look: [788, 25, 5590] },
  fov: 38, fstop: 4, light: { ...GOLDEN, look: { ...GOLDEN.look, domeK: 0.68, bounceK: 0.42 }, sun: { ...GOLDEN.sun, el: 24 }, post: { ...GOLDEN.post, exposure: 1.14 } }, shadow: { centre: [850, 0, 5500], ext: 520 } });
