// Cromatic · diorama renders (TASK-118): a shot module (shots/*.mjs) rendered frame by frame, in the page. Loaded by
// render.mjs through the harness; window.__RUN:
//   await __RUN.load("/__dr/shots/oma.mjs", { quality })   imports the shot, builds its props (prepare), the look
//   __RUN.frame(f) -> { url, ms }                           frame f (0-based, at the shot's fps), a PNG data URL
//   __RUN.before(f) -> url                                  the map's own render of frame f's camera, as A6 captured
//   __RUN.info()                                            frames, size, the camera check (validate)
import D from "./diorama.js";
import { validate, lensOf } from "./camera.js";
const QUALITY = { draft: { samples: 16, scale: 0.5 }, preview: { samples: 48, scale: 0.5 }, final: { samples: 128, scale: 1 }, ultra: { samples: 256, scale: 1 } };
let SHOT = null, CTX = null, Q = null, CHECK = null;
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
async function load(url, o = {}) {
  if (SHOT && SHOT.dispose) SHOT.dispose(CTX);
  D.teardown();
  const mod = await import(url + (url.includes("?") ? "&" : "?") + "v=" + Date.now());
  SHOT = mod.default; Q = { ...(QUALITY[o.quality || "final"] || QUALITY.final), ...(o.samples ? { samples: o.samples } : {}), ...(o.scale ? { scale: o.scale } : {}) };
  CHECK = validate(SHOT.camera, { fps: SHOT.fps || 30, ...(SHOT.cameraLimits || {}) }); // throws on a camera that jumps
  CTX = { S: window.__story, K: window.__story.K, D };
  if (SHOT.prepare) await SHOT.prepare(CTX);
  window.__vclock && window.__vclock.freeze();
  return info();
}
function info() {
  const fps = SHOT.fps || 30, n = Math.round((SHOT.duration ?? SHOT.camera.duration) * fps);
  const [w, h] = SHOT.size || [2160, 3840];
  return { name: SHOT.name, frames: n, fps, size: [Math.round(w * Q.scale), Math.round(h * Q.scale)], samples: Q.samples, check: CHECK };
}
// the cameras of a frame's sub-frames: times spread over the open shutter (stratified, a Halton offset inside each
// stratum), each with the lens of its moment
function subCams(f, N) {
  const fps = SHOT.fps || 30, sh = SHOT.shutter ?? 0.5, t = SHOT.camera.t0 + f / fps, lens = SHOT.lens || {};
  const out = [];
  for (let i = 0; i < N; i++) {
    const ts = t + (sh / fps) * ((i + halton(i + 1, 23)) / N - 0.5);
    const c = SHOT.camera.at(Math.max(SHOT.camera.t0, Math.min(SHOT.camera.t1, ts)));
    const L = lensOf({ ...c, fstop: lens.fstop ?? c.fstop }, { scale: lens.scale ?? 1.45 });
    out.push({ ...c, aperture: lens.pinhole ? 0 : L.aperture, shift: SHOT.shift || null, plane: lens.plane || null, ts });
  }
  return out;
}
function frame(f, o = {}) {
  const fps = SHOT.fps || 30, I = info(), [w, h] = I.size, N = o.samples || Q.samples;
  if (!D.look || o.relook) D.setup(SHOT.look || {});
  // the map's own loop, once, at this frame's time (its water, its fountain, its traffic), the loop's camera where ours is
  const c0 = SHOT.camera.at(SHOT.camera.t0 + f / fps);
  if (window.__cam) { window.__cam(c0.pos, c0.look); window.__camSnap && window.__camSnap(); }
  if (window.__vclock && window.__vclock.frozen) window.__vclock.tick(1 / fps);
  const cams = subCams(f, N);
  const r = D.renderFrame({ w, h, cams, sun: SHOT.sun, shadowCentre: SHOT.shadow && SHOT.shadow.centre, shadowExt: SHOT.shadow && SHOT.shadow.ext, domeExt: SHOT.shadow && SHOT.shadow.domeExt, domeK: SHOT.domeK, post: SHOT.post, seed: f + 1, near: SHOT.near, far: SHOT.far }, { pose: (i) => SHOT.pose && SHOT.pose(cams[i].ts, CTX, i) });
  return { url: D.toPNG(r.px, w, h), ms: r.ms, w, h };
}
function before(f, o = {}) {
  const fps = SHOT.fps || 30, I = info(), [w, h] = o.size || I.size;
  D.teardown();
  if (SHOT.beforePrepare) SHOT.beforePrepare(CTX, true);
  const c = SHOT.camera.at(SHOT.camera.t0 + f / fps);
  if (SHOT.pose) SHOT.pose(c.t, CTX, 0);
  const url = D.plain({ ...c, shift: SHOT.shift || null }, w, h);
  if (SHOT.beforePrepare) SHOT.beforePrepare(CTX, false);
  return url;
}
window.__RUN = { load, frame, before, info };
export default window.__RUN;
