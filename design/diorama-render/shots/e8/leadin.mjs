import { hideMapRide, world, paintSky, NIGHT, wet, mirror, track, dur } from "./common.js";
// E8 · lead-in (under "Pick your ride." and the pill, into the black) · Coffee Street at night after the rain, the lens
// low in the street tilting slowly up past the lit windows to the night sky, where the line and the pill sit.
const D = dur("leadin", 14);
let UN = [], WET, MIR;
export default {
  name: "leadin", size: [2160, 3840], fps: 30, duration: D, shutter: 0,
  camera: track(D, (t) => ({ pos: [846, 4, 5480 + 4 * t], look: [842, 120 + 14 * t, 5800], fov: 40, focus: 900 })),
  lens: { fstop: 5.6, scale: 1.45 },
  ...NIGHT, look: { ...NIGHT.look, fog: { color: "#1a2048", near: 500, far: 4200 } },
  post: { ...NIGHT.post, tonemap: "agx", exposure: 2.1, bloomK: 0.2, bloomThr: 0.75, sat: 1.15, vig: 0.32, grain: 0.028, lutMix: 0.7 },
  shadow: { centre: [842, 0, 5600], ext: 320 },
  async prepare(ctx) { await world(ctx.S, "nightlife"); UN.push(hideMapRide(ctx.S)); WET = wet(ctx, { centre: [842, 0, 5600], r: 700, rough: 0.28, refl: 0.08 }); MIR = await mirror(ctx, { centre: [842, 0, 5600], size: 1400, opacity: 0.5, y: 1.4 }); UN.push(paintSky(ctx, { top: "#070b26", mid: "#1c2257", hor: "#5a4a86", lit: "#b98aa0", shade: "#22264f", glow: 180, clouds: 0.3, stars: 0.35 })); },
  dispose() { WET?.dispose(); MIR?.dispose(); UN.forEach((f) => f()); UN = []; }
};
