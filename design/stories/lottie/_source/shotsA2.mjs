// Cromatic · stories in Lottie · story A v2 (TASK-065): the new cameras of "Cromatic City" (renderA2.mjs, buildA2.mjs)
//   over: straight down on the Two Minutes district, two lenses (the second half the field: the crash zoom)
//   boot: low behind the yellow ride's boot on Aricescu, the street ahead; the ride pulls away
export const A2 = {
  over: { pos: [790, 1100, 4232], tgt: [790, 0, 4233], fovs: [46, 23.6], w: 2160, h: 3840, level: false, cuts: [["up", 1e9]], groundY: 3.4, flatH: 3.6 },
  boot: { pos: [918, 2.4, 4244], tgt: [700, 5, 4250], fov: 58, shift: [0, 0.12], w: 2160, h: 3840, level: true, dur: 1.6 }
};
// the ride parked on Aricescu heading west (as in the pilot), then pulling away: still for 0.45 s, then 140 u/s²
export const bootCar = (t) => { const tt = Math.max(0, t - 0.45), s = 0.5 * 140 * tt * tt; return { x: 880 - s, y: 1.73, z: 4243, yaw: -Math.PI / 2, lights: 1 }; };
