# Diorama renders: the stories' offline renderer (TASK-118)

The map, filmed as a model on a table. It is the same city, the map's own scene inside the map's own page, but each frame is
**rendered offline**. Every output frame is the average of many full renders (sub-frames). Each sub-frame varies:

| per sub-frame | gives |
|---|---|
| the camera on another point of a real aperture (thin lens, 1:87 scale) | true bokeh and tilt-shift depth of field, occlusion-correct (no post blur) |
| another instant inside the shutter (180° by default) | motion blur, of the camera and of anything the shot moves |
| another sub-pixel offset | anti-aliasing |
| the sun on another point of its disc, its shadow map drawn again | soft, physically sized penumbrae |
| a second shadowed light on another point of the sky dome, coloured like the sky there | sky light with its occlusion (streets, eaves, doorways, figurines' feet). The street's bounce stays as the hemisphere light's lower half |

The float sum then goes through bloom, exposure, a tone curve (Khronos **Neutral**, which keeps the brand palette, or **AgX**),
**our LUT** (`src/grade.js`; the same tables as `.cube` files in `luts/`, for Resolve or After Effects), a soft vignette and a fine luminance grain.

**Why not the path tracer.** three-gpu-pathtracer does run headless (Radu's TASK-112 test proved it on a lone car). But the
map is not a plain three.js scene: the city's bend lives in the three bundle's own shader chunks, the colours swap per world,
and the sky, clouds and windows are custom shaders. A path tracer would need a lossy copy of the whole city (warp baked into
millions of vertices, instances expanded) at minutes per 2x frame. The accumulation renderer keeps every pixel of the real map
and gets the look that matters for a model: DOF, soft sun, sky occlusion and motion blur. It runs at **~6–10 s per 2x frame**
(Slow Coffee) and **~25–40 s** (OMA at night, with 4 shadow-casting lamps) on the M4.

Nothing here changes the site. The renderer is injected into the page by the harness. `src/app.js` only hands the map's three
classes and footprints to `window.__story`, behind `?story`.

## Run it

```sh
# once: the site built somewhere, served (any free port)
PUBLIC_DIR=/tmp/pub GA_ID= node build/build.mjs && git checkout -- build/lastmod.json
PUBLIC_DIR=/tmp/pub PORT=8796 PRIMARY_HOST= node server.js &
# the harness: a long-lived Chromium (GPU, Metal) on /?map&story. DEV=1 serves src/app.js fresh, no rebuild needed
cd design/diorama-render
DEV=1 BASE=http://localhost:8796 PORT=8797 node _source/harness.mjs &      # prints "ready … listening 8797"
# a shot -> PNGs (2160 x 3840) in out/<shot>/, then the story's MP4 (1080 x 1920)
node render.mjs shots/slow.mjs --quality final                 # all frames
node render.mjs shots/oma.mjs --frames 0,52,104 --quality draft  # quick looks (1080 x 1920, 16 samples)
node render.mjs shots/oma.mjs --frames 0 --before --only-before  # the map's own render of the same camera
node encode.mjs out/slow                                         # -> out/slow/slow.mp4
node _source/scout.mjs '[{"pos":[960,60,4760],"look":[750,20,4585],"fov":30}]'   # framing, fast, no lens
```

Quality presets are `draft` (½ size, 16 samples), `preview` (½, 48), `final` (2x, 128) and `ultra` (2x, 256). `--samples N`
and `--scale s` override them. Stop the servers by their PID only.

`render.mjs` reloads the page by itself when `src/`, `shots/`, `vendor/` or `src/app.js` changed: the browser caches the
modules. Leave the harness up between renders. It waits for the city's last boot jobs before anything freezes its clock.

## A shot

A shot is an ES module in `shots/`. It is imported in the page, so it may build props with the map's three (`ctx.K`).

```js
import { cameraPath } from "../src/camera.js";
export default {
  name: "slow", size: [2160, 3840], fps: 30, duration: 3.5,
  shutter: 0.5,                         // fraction of a frame the shutter is open (0.5 = 180°)
  camera: cameraPath({ keys: [          // see "The camera"
    { t: 0,   pos: [1528, 168, 4690], look: [1100, 30, 5300], fov: 55, focus: [1192, 34, 5172] },
    { t: 3.5, pos: [1461, 148, 4737], look: [1098, 28, 5296], fov: 53, focus: [1192, 34, 5172] } ] }),
  lens: { fstop: 3.5, scale: 1.45 },    // scale: world units per mm of model (1:87 -> 1.45). pinhole: true turns DOF off.
                                        // plane: [p, q, r] focuses on any plane (a tilted lens) instead of the focus distance
  look: {                               // the world as a model
    sky: { top, mid, hor },             // the painted backdrop (also the sky light's colour by direction)
    fog: { color, near, far },
    bounce: "#c79a80", bounceK: 0.3,    // the street's bounce (the hemisphere light's lower half)
    domeK: 0.4,                         // the sky light's strength
    tone: 0.06, minRough: 0.7, bump: 0.03, // the model paint: tone wobble, matte floor, plaster grain (model: false = off)
    clouds: false
  },
  sun: { az: 78, el: 19, color: "#ffcfa0", intensity: 3.7, radius: 1.5 },  // degrees; az 0 = from +z, 90 = from +x
  shadow: { centre: [1100, 0, 5250], ext: 900, domeExt: 900 },             // the shadow maps' square (half size)
  post: { tonemap: "neutral" | "agx", exposure, bloomK, bloomThr, vig, grain, lut: "cromatic-diorama" | "cromatic-night",
          sat, power, wb: [r, g, b] },
  async prepare(ctx) {},                // once: build props, dress the set (ctx = { S: __story, K: three, D: renderer })
  pose(t, ctx, i) {},                   // before each sub-frame: put moving things where they are at time t
  beforePrepare(ctx, on) {},            // optional: the map's state for the "before" render
  dispose(ctx) {}                       // undo everything prepare did
};
```

Positions are the map's **logical** coordinates (as in the A-D story shots). The renderer bends cameras, focus points, the
focus plane and point lights into the warped city itself.

## The camera (`src/camera.js`): paths that cannot jump

**Why A6 jumped.** In the top-down drone shot the camera was aimed with `lookAt` at a point almost straight below it. That has
no defined roll, so the picture's rotation followed the few units of horizontal offset between camera and target. As the
drone drifted, the image turned ~70° in 14 frames. The other shots each eased from rest to rest (smoothstep), and the cuts
were 2D slides of 1.3 screen widths in 6 frames with no blur, black showing behind them.

**The API.**

```js
cameraPath({ keys: [{ t, pos, look, fov?, yaw?, roll?, focus?, fstop? }, ...], ease?: "none" | "inOut" | [inSec, outSec] })
```

* Position and look-at are each a **centripetal Catmull-Rom** through the keys: C1, no loops, no overshoot. By default the
  move does not stop at its ends (good for cuts). `ease: [0, 0.6]` settles only in its last 0.6 s.
* **The roll is never derived from geometry.** Up is the world's up when level. Looking down, up blends smoothly towards the
  heading `yaw` (the direction of the picture's top on the ground, degrees, 0 = +z), well before the view is vertical.
  A key within 25° of straight down **must** carry a `yaw`, or `cameraPath` throws.
* `focus`: a distance, or a point that stays sharp (default: the look-at point).
* `whip(path, { at: "end" | "start", deg, dur })` adds a whip pan as a real camera move: the look swings round the lens.
  With the shutter's sub-frames it smears like a film whip, so the 2D slide between shots is no longer needed.
* `validate(path, { fps, maxTurn: 3.5, maxTurnJump: 0.9, maxFlip: 5 })` samples at 8× the frame rate and throws if the
  camera turns too fast in one frame, changes its turning speed abruptly, or swings its up vector. Whips are exempt.
  `render.mjs` runs it on every shot before anything renders; a shot can relax it with `cameraLimits`.

## Depth of field at 1:87

The lens is physical: a full-frame lens of the shot's field of view, at the f-stop, on a 1:87 model. That is the miniature
look, and it is strict. Objects 25% nearer or farther than the focus blur visibly at f/5.6. Choose the focus point on the
subject (the face of a building, not its centre). Use f/11–f/22 when two subjects sit at different depths (OMA: the car at
~225, the room at ~310, f/22). A tilted plane (`lens.plane`) helps when the subjects lie on a plane that is not almost
parallel to the lens's rays.

## Props and helpers

* `src/figurines.js`: `figurine(K, { h, sex, skin, hair, hairStyle, beard, top, jacket, bottom, skirt, legs, shoes,
  apron, scarf, glasses, bag, pose, seat })`. These are Preiser-style figurines: sculpted heads (nose, ears, painted eyes,
  brows, mouth), hair, clothes with lapels, satin paint. A pose is held, not animated (a model's figures do not walk).
  The poses are `stand`, `standEasy`, `cupTalk`, `barista`, `sitCup`, `sitTalk`, `phone`, `walk`, `walkBag` and
  `armsCrossed`, or your own joint angles. A seat is 6.4 above the feet (or pass `seat`).
* `shots/oma-set.js`: OMA as a set. Its solid box becomes an open shell with real glass and a lit room behind it (bar,
  machine, pastry case, shelves, menu, tables, pendant lamps casting shadows, a fill) and the figurines.
* `src/set.js`: `hideNear(ctx, [[x, z, r], ...])` moves trees, bushes and lamps out of the lens's way, and is undone on
  dispose.
* `vendor/dacia1300-hero.js`: Radu's hero Dacia (TASK-112, hero-car e819e62), built with three's own modules and drawn by
  the map's renderer. 1 m = 15 units, glass made plain (no transmission pass).

## Gotchas (each one cost an hour)

* **Point lights must be placed warped**: `S.warpV(worldPos)`. The city's bend moves every vertex in the shader, but a
  light's position is an unbent uniform. Left unbent, OMA's lamps sat ~110 units away from their bulbs.
* **The map batches its static meshes** (r198). To swap a building's meshes, call `__perfLab.merge(false)` first (OMA's
  shot does it) and `merge(true)` on dispose.
* With the shadow map's `autoUpdate` off, nothing is drawn unless `renderer.shadowMap.needsUpdate` is set. The renderer
  sets it every sub-frame.
* The page clock is virtual during renders (`__vclock`), so water, the fountain and traffic follow story time. If the clock
  is frozen before the city has booted, the city never finishes building. The harness waits for `__fp` and the batches.

## The proof (TASK-118)

The proof lives in `~/cromatic-ops/refs/diorama-render/`:

* `oma-before.png` / `oma-after.png` and `slow-before.png` / `slow-after.png` (same camera)
* `oma-test.mp4`, `slow-test.mp4` (1080 x 1920, 3.5 s)
* `roofs.md`
