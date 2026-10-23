// Cromatic · diorama renders (TASK-118) · test shot 2: the Slow Coffee dome from high in the south-east, the whole city
// behind it, at sunset; the camera arcs slowly round it (A6's "scf" shot, its first framing kept for the before/after,
// the move carried on to 3.5 s, never stopping). Tilt-shift: the dome sharp, the city behind and the street in front
// falling off as they would on a model filmed with a real lens.
import { cameraPath } from "../src/camera.js";
const DOME = [1192, 34, 5172]; // the near face of the dome (its centre is ~160 further: the face would blur)
export default {
  name: "slow",
  size: [2160, 3840], fps: 30, duration: 3.5, shutter: 0.5,
  camera: cameraPath({
    keys: [
      { t: 0, pos: [1528, 168, 4690], look: [1100, 30, 5300], fov: 55, focus: DOME },
      { t: 1.75, pos: [1496, 158, 4713], look: [1099, 29, 5298], fov: 54, focus: DOME },
      { t: 3.5, pos: [1461, 148, 4737], look: [1098, 28, 5296], fov: 53, focus: DOME }
    ]
  }),
  lens: { fstop: 3.5, scale: 1.45 }, // the model at 1:87 (a map unit is 0.69 mm of model)
  look: {
    sky: { top: "#5f7ee0", mid: "#d8afd6", hor: "#ffc9a0" },
    fog: { color: "#e7cdd6", near: 1600, far: 9000 },
    bounce: "#c79a80", bounceK: 0.3, domeK: 0.4, domeSunGlow: 0.8,
    tone: 0.06, minRough: 0.7, bump: 0.03
  },
  sun: { az: 78, el: 19, color: "#ffcfa0", intensity: 3.7, radius: 1.5 },
  shadow: { centre: [1100, 0, 5250], ext: 900 },
  post: { tonemap: "neutral", exposure: 1.05, bloomK: 0.05, bloomThr: 1.0, vig: 0.24, grain: 0.022, lut: "cromatic-diorama", sat: 1.08, power: 1.12 }
};
