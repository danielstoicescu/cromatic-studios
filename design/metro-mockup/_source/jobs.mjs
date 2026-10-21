// Cromatic · metro mockups (TASK-062): the render jobs of each shot, for render.mjs --jobs.
//   node jobs.mjs <shot|all> [draft] > jobs.json
// Final quality: the plates at twice the shot's size, 256 samples; draft: the shot's size, 24 samples.
const [shot = "all", q = "final"] = process.argv.slice(2), D = q === "draft";
const N = (n) => (D ? 24 : n), S = (s) => (D ? s / 2 : s);
export const JOBS = {
  // shot 1: the platform, the far wall's posters; passers-by along the camera's x
  platform: [
    { name: "p-bg", shot: "platform", layer: "bg", scale: S(2), n: N(256) },
    // (a long shutter and a wide aperture: they pass as soft, smeared shapes, the way a slow exposure sees people)
    ...[[0, 1.6, 1, 1.45], [2, 0.9, -1, 1.3], [4, 1.3, 1, 1.2]].flatMap(([i, z, dir, v], w) =>
      Array.from({ length: 6 }, (_, f) => ({ name: `p-w${w}-${f}`, shot: "platform", layer: "walker", i, z, dir, v, f, F: 6, period: 1.08, shutter: 1 / 6, fstop: 1.4, scale: S(2), n: N(192) })))
  ],
  // shot 3: the train pulling in: the station, the cars as strips (sharp with open doorways; two motion blurs), leaves
  train: [
    { name: "t-bg", shot: "train", layer: "bg", scale: S(2), n: N(256) },
    { name: "t-car-wrap-sharp", shot: "train", layer: "car", kind: "wrap", doors: "open", blur: 0, res: D ? 0.5 : 1, n: N(160) },
    { name: "t-car-wrap-b1", shot: "train", layer: "car", kind: "wrap", doors: "closed", blur: 0.06, res: 0.5, n: N(96) },
    { name: "t-car-wrap-b2", shot: "train", layer: "car", kind: "wrap", doors: "closed", blur: 0.16, res: 0.35, n: N(96) },
    { name: "t-car-plain-b1", shot: "train", layer: "car", kind: "plain", doors: "closed", blur: 0.06, res: 0.5, n: N(96) },
    { name: "t-car-plain-b2", shot: "train", layer: "car", kind: "plain", doors: "closed", blur: 0.16, res: 0.35, n: N(96) },
    ...[[-2.45, -1], [-2.45, 1], [2.45, -1], [2.45, 1]].map(([door, s]) => ({ name: `t-leaf-${door > 0 ? "r" : "l"}${s > 0 ? "b" : "a"}`, shot: "train", layer: "leaf3", door, s, scale: S(2), n: N(96) })),
    // a woman waiting, out of focus at the left edge, her back to us
    { name: "t-person", shot: "train", layer: "person", i: 1, x: -1.3, z: 2.6, ry: Math.PI / 2, fstop: 2.0, scale: S(2), n: N(160) }
  ],
  // shot 2: inside the banner car: its interior (openings as alpha), the leaves beside the poster, the windows'
  // reflection, the station outside as strips (the platform near, the far wall), each sharp and blurred by motion
  inside: [
    { name: "i-int", shot: "inside", layer: "interior", scale: S(2), n: N(192) },
    { name: "i-refl", shot: "inside", layer: "refl2", scale: S(1), n: N(64) },
    { name: "i-leaf-a", shot: "inside", layer: "leaf2", door: 2.45, s: -1, scale: S(2), n: N(96) },
    { name: "i-leaf-b", shot: "inside", layer: "leaf2", door: 2.45, s: 1, scale: S(2), n: N(96) },
    { name: "i-near-sharp", shot: "inside", layer: "out", part: "near", res: D ? 0.5 : 1, half: 6.6, blur: 0, fstop: 1.8, n: N(160) },
    { name: "i-near-blur", shot: "inside", layer: "out", part: "near", res: 0.25, L: 31, blur: 0.3, n: N(96) },
    { name: "i-far", shot: "inside", layer: "out", part: "far", res: 0.5, L: 31, blur: 0, fstop: 1.8, n: N(128) },
    { name: "i-far-blur", shot: "inside", layer: "out", part: "far", res: 0.25, L: 31, blur: 0.3, n: N(64) }
  ]
};
const list = shot === "all" ? Object.values(JOBS).flat() : JOBS[shot];
process.stdout.write(JSON.stringify(list, null, 1));
