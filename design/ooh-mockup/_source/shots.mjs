// Cromatic · Litorsal OOH mockups (TASK-069): the three cameras and their light, as plain numbers (shared by the 3D stage
// and the Node tools). pos in metres (the street's frame: see scene/city.js), yaw in degrees (0: looking down -z), hfov
// in degrees, shift: the lens shift in frames (y < 0 shows more of what is above the horizon), focus in metres, fstop.
// light: sun (toward the sun), its colour and strength, the sky (zenith, horizon, the sun's glow), the ground's bounce,
// the haze (colour, density), the shadow box (half width, half height, around focus).
export const SHOTS = {
  // 1: the 6 x 3 m billboard across a boulevard, late afternoon (a long lens, square to the street: the tram crosses)
  boulevard: { W: 1920, H: 1080, cam: { pos: [25, 1.35, -8.2], yaw: 80, hfov: 42, aspect: 16 / 9, shift: [0, -0.3], focus: 26, fstop: 4 },
    light: { sun: [0.42, 0.5, 0.76], sunCol: [1.0, 0.78, 0.52], sunI: 7, zenith: [0.13, 0.28, 0.64], horizon: [1.0, 0.84, 0.64], glow: [1.0, 0.75, 0.45], ground: [0.4, 0.34, 0.28], bounce: [0.55, 0.42, 0.3], haze: [0.95, 0.84, 0.7], hazeD: 0.003, envK: 0.45, skyK: 1.5, box: [130, 60], focus: [-50, 0, 0] },
    dev: { expo: 0.62, contrast: 1.06, sat: 1.04, glare: 0.045, curve: "neutral" } },
  // 2: a mesh banner on a block's blind gable, hard midday sun, looking up
  gable: { W: 1080, H: 1350, cam: { pos: [16, 1.6, 22], yaw: 0, hfov: 37, aspect: 1080 / 1350, shift: [0, -0.4], focus: 44, fstop: 5.6 },
    light: { sun: [0.45, 0.8, 0.4], sunCol: [1.0, 0.95, 0.88], sunI: 8.5, zenith: [0.07, 0.2, 0.62], horizon: [0.62, 0.72, 0.84], glow: [1.0, 0.95, 0.85], ground: [0.32, 0.3, 0.27], bounce: [0.3, 0.27, 0.23], haze: [0.62, 0.7, 0.8], hazeD: 0.003, envK: 1.0, box: [60, 60], focus: [15, 0, -20] },
    dev: { expo: 0.52, contrast: 1.08, sat: 1.05, glare: 0.04, curve: "neutral" } },
  // 3: the citylight at a tram stop's shelter, the sun low behind the blocks (the shelter in shade, the panel glowing)
  shelter: { W: 1920, H: 1080, cam: { pos: [-10.5, 1.4, 11.8], yaw: -86, hfov: 44, aspect: 16 / 9, shift: [0, -0.06], focus: 8.9, fstop: 2.2 },
    light: { sun: [0.95, 0.1, -0.27], sunCol: [1.0, 0.68, 0.42], sunI: 6.0, zenith: [0.14, 0.24, 0.5], horizon: [0.95, 0.72, 0.5], glow: [1.0, 0.62, 0.32], ground: [0.26, 0.22, 0.2], bounce: [0.26, 0.2, 0.16], haze: [0.78, 0.62, 0.5], hazeD: 0.006, envK: 1.0, box: [70, 50], focus: [0, 0, -5], glow2: 1.2 },
    dev: { expo: 0.7, contrast: 1.06, sat: 1.04, glare: 0.06, curve: "neutral" } }
};
