// Nine cups v2 · the layout, shared by the bake (tools/bakecups2.mjs) and the direction (ninecups2.mjs).
// The original intro's wall of cups (src/app.js at 13e8689, cups3.fill()): rows 4.5 apart, cups 5.6 apart in a row,
// every other row shifted by 2.8, each cup tilted 0.52 rad toward a camera with a 30 degree lens. Nine of it, as a
// rhombus: rows of 1, 2, 3, 2, 1 (the lattice's own diagonals, 2.8 across and 4.5 up). The camera sits above the
// rhombus (it is centred 7 below the lens's axis), so the cups are seen from 27 to 48 degrees, the near ones deeper
// into, as the old wall's were.

export const CAM = { Zc: 50, ycam: 0 };
export const TILT_END = 0.52; // the old tilt group (rotation.x), about 30 degrees
export const TILT_TOP = Math.PI / 2; // looking straight down at the cup (its axis at the camera)
export const DIAMOND_Y = -7;
// the designs (tools/bake2.html DESIGNS): 0 yellow, 1 blue inside, 2 zigzag, 3 stripes, 4 pink (the original five),
// 5 dots, 6 lilac, 7 bands, 8 dipped (new, in their grammar). The worlds (WORLD_IDS order): 0 Cromatic, 1 Night Mode,
// 2 Ghib.ly, 3 Sketchbook, 4 Race Day, 5 Sakura, 6 Underwater, 7 Polite City, 8 Risograph
const PLACES = [
  // [i, j] on the lattice's diagonals (row = i + j), design, world, the handle's angle (deg) when the cups stand up
  // (handle angles on the turn's own 15-degree keys, so a cup's tilt hands over to its turn exactly)
  [[0, 0], 6, 8, 15], //  top: lilac, Risograph
  [[1, 0], 5, 7, -30], //  dots, Polite City
  [[0, 1], 2, 3, 45], //  zigzag, Sketchbook
  [[2, 0], 7, 4, 30], //  bands, Race Day
  [[1, 1], 0, 0, 15], //  the middle: yellow, Cromatic (the cup that stays)
  [[0, 2], 3, 6, -15], //  stripes, Underwater
  [[2, 1], 1, 1, 30], //  blue inside, Night Mode
  [[1, 2], 4, 5, -45], //  pink, Sakura
  [[2, 2], 8, 2, 15] //  bottom: dipped green, Ghib.ly
];
export const CUPS = PLACES.map(([[i, j], design, world, hdeg], n) => ({
  n, design, world,
  X: 2.8 * (i - j), Y: DIAMOND_Y + 4.5 * (2 - i - j),
  yaw0: (hdeg * Math.PI) / 180, row: i + j, mid: i === 1 && j === 1,
  // every cup is seen as the one in the middle of its row (the camera straight in front of it): the cups of a row share
  // their geometry (the file shares it too); a cup 5.6 to the side would be seen 6 degrees more from its side
  Xv: 0
}));
export const MID = CUPS.findIndex((c) => c.mid);
// the tilt: NT keys from straight above (u 0) to the old angle (u 1)
export const NT = 8;
export const tiltAt = (u) => TILT_TOP + (TILT_END - TILT_TOP) * u;
// the turn at the old angle: NY keys a turn
export const NY = 48;
