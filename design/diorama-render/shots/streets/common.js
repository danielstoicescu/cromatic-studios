// Street bands (site/media/streets/<id>/, Daniel 29 Oct on r341: "a video of Fintech Boulevard from the premium
// diorama, with a very modern parallax"): one slow camera move per portfolio street, 2:1 master (3840 x 1920 at scale 1:
// the 2.4:1 desktop band and the 4:5 phone cut are both crops of it), filmed in real slow motion (fps 75, played at 30:
// 0.4x, every frame rendered). FRAMES = 240 + 30: the last 30 dissolve into the first 30 at the encode (a seamless 8 s).
import { cameraPath } from "../../src/camera.js";
import { hideMapRide } from "../a6/common.js";
import { world } from "../d7/common.js";
export const FRAMES = 270, FPS = 75;
export function street({ name, from, to, focus, fov = 36, fstop = 4, light, shadow }) {
  const D = FRAMES / FPS, L = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
  const keys = [0, 0.5, 1].map((u) => ({ t: u * D, pos: L(from.pos, to.pos, u), look: L(from.look, to.look, u), fov, focus: focus ? L(focus[0], focus[1], u) : undefined }));
  let UN = null;
  return {
    name, size: [3840, 1920], fps: FPS, duration: D, shutter: 0.5,
    camera: cameraPath({ keys, ease: "none" }),
    lens: { fstop, scale: 1.45 },
    ...light, look: { ...light.look }, shadow,
    async prepare(ctx) { await world(ctx.S, "monument"); UN = hideMapRide(ctx.S); },
    dispose() { UN && UN(); UN = null; }
  };
}
