// Cromatic · stories in Lottie · story D (TASK-066): the cameras of story D, in the city's logical coordinates (the
// map's x, z; y up), rendered by render-d.mjs through the harness (its copy in this folder, on :8992) and read by
// build-d.mjs. Plates at twice the story's size; the bird's eye with room round it for the camera's turn.
//   cam      { pos, tgt, fov, roll, w, h } (not level: the low angles look up, the overheads look down)
//   lenses   extra fields of view of the same camera (a crash zoom never runs out of pixels)
//   away     the ride parked far off for the plate (it comes back as sprites)
//   sprites  the ride alone (a 180-degree shutter's blur: poses are subframes), where it is in the frame
//   marks    a rectangle on a wall or the road (a ray through (u, v) of the frame finds it), measured for type in the
//            scene; the final story D sets its type on the screen, the numbers stay in platesD.json
export const STORY = { w: 1080, h: 1920 }, K = 2;
const W2 = STORY.w * K, H2 = STORY.h * K;
const RING = { c: [1500, 4260], r: 70 }; // the roundabout's lane (FORK_POS, the ring's centre line)
export { RING };
// the ring's lane, counter-clockwise seen from above (the way Bucharest goes round): angle -> point, heading
export const ringAt = (a) => ({ x: RING.c[0] + RING.r * Math.cos(a), z: RING.c[1] + RING.r * Math.sin(a), yaw: Math.atan2(Math.sin(a), -Math.cos(a)) });
// the bird's eye: 2720 x 4160 (the frame turned by up to 8 degrees still sits inside it), the same px per unit as a
// 2160 x 3840 plate at 40 degrees
const OVW = 2720, OVH = 4160, ovFov = (k) => (2 * Math.atan((Math.tan((20 * Math.PI) / 180) / k) * (OVH / H2)) * 180) / Math.PI;
export const SHOTS = {
  // 1 · straight down on the roundabout (the fountain, the four arms), three rides going round it
  over: {
    scheme: "monument", away: true,
    cam: { pos: [1500, 900, 4260], tgt: [1500, 0, 4259.5], fov: ovFov(1), roll: Math.PI, w: OVW, h: OVH },
    lenses: [ovFov(2.6)],
    rideSprites: ["dacia1300", "f1", "groovy"], // (each alone, top down at the fountain, turned in 2D in the story)
    pts: { c: [1500, 1.6, 4260], e: [1570, 1.6, 4260], s: [1500, 1.6, 4330], n: [1500, 1.6, 4190], w: [1430, 1.6, 4260] }
  },
  // 2 · Yoshi Izakaya from the kerb, low, a hair of Dutch tilt: its corner, the lanterns, the tall sign
  yoshi: {
    scheme: "monument", away: true, nosky: true,
    cam: { pos: [770, 2.5, 5120], tgt: [712, 34, 5172], fov: 62, roll: -0.05, w: W2, h: H2 },
    marks: [{ name: "word", uv: [0.2, 0.74], w: 40, h: 10, align: [0.5, 0.5] }]
  },
  // 3 · Investimental from its foot, looking up its glass
  inv: {
    scheme: "monument", away: true, nosky: true,
    cam: { pos: [2100, 2, 4500], tgt: [2205, 230, 4500], fov: 72, w: W2, h: H2 },
    marks: [{ name: "word", uv: [0.5, 0.84], w: 50, h: 12, align: [0.5, 0.5] }]
  },
  // 4 · The Aesthetic Court, dead centre, from the red carpet; a second lens for the crash zoom on its door
  tac: {
    scheme: "monument", away: true, nosky: true,
    cam: { pos: [1600, 2, 4570], tgt: [1775, 95, 4570], fov: 58, w: W2, h: H2 },
    lenses: [24],
    marks: [{ name: "word", p: [1707.3, 22.36, 4570], n: [-1, 0, 0], w: 80, h: 20, align: [0.5, 0.5] }]
  },
  // the rides at night (each its own best side), and the sub under water
  r1: { scheme: "nightlife", veh: "dacia1300", away: true, sprite: { at: [823, null, 4500, 0] }, cam: { pos: [842, 2.6, 4570], tgt: [823, 10, 4500], fov: 50, w: W2, h: H2 } },
  r2: { scheme: "nightlife", veh: "groovy", away: true, sprite: { at: [1500, null, 4330, 1.5708] }, cam: { pos: [1548, 5, 4432], tgt: [1500, 12, 4330], fov: 46, w: W2, h: H2 } },
  r3: { scheme: "nightlife", veh: "f1", away: true, cam: { pos: [1512, 3, 4412], tgt: [1500, 30, 4260], fov: 52, w: W2, h: H2 },
    // (the F1 along the near side of the ring, left to right, at 30 frames a second, 4 subframes each)
    pass: { from: 2.25, to: 0.85, frames: 16 } },
  r4: { scheme: "nightlife", veh: "monopoly", away: true, sprite: { at: [1650, null, 4540, -0.6] }, cam: { pos: [1598, 2.5, 4488], tgt: [1650, 10, 4540], fov: 50, w: W2, h: H2 } },
  r5: { scheme: "nightlife", veh: "plane", away: true, cam: { pos: [2130, 1, 4530], tgt: [2130, 60, 4497], fov: 70, w: W2, h: H2 },
    sprite: { at: [2130, null, 4500, 0] } },
  r6: { scheme: "nightlife", veh: "scooter", away: true, cam: { pos: [823, 220, 4330], tgt: [823, 0, 4329.5], fov: 40, roll: Math.PI, w: W2, h: H2 },
    sprite: { at: [823, null, 4330, 0] }, pts: { a: [823, 0, 4250], b: [823, 0, 4410] } },
  r7: { scheme: "nightlife", veh: "foodvan", away: true, sprite: { at: [823, null, 4500, 0] }, cam: { pos: [905, 7, 4525], tgt: [823, 13, 4500], fov: 50, w: W2, h: H2 } },
  r8: { scheme: "nightlife", veh: "cop", away: true, sprite: { at: [823, null, 4500, 0] }, cam: { pos: [830, 2.6, 4562], tgt: [823, 9, 4500], fov: 50, w: W2, h: H2 } },
  r9: { scheme: "underwater", veh: "sub", away: true, sprite: { at: [823, null, 4500, 0.6] }, cam: { pos: [858, 2, 4545], tgt: [823, 24, 4500], fov: 58, w: W2, h: H2 } },
  // the end: the roundabout at night from a little above the plaza; the yellow ride goes round, in front
  end: { scheme: "nightlife", veh: "dacia1300", away: true, cam: { pos: [1680, 22, 4300], tgt: [1500, 6, 4250], fov: 55, w: W2, h: H2 },
    pass: { from: 0.95, to: -0.75, frames: 40 }, marks: [{ name: "word", uv: [0.5, 0.84], w: 60, h: 20, align: [0.5, 0.5], ax: "right" }] }
};
