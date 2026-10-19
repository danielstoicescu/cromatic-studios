// Cromatic · the game's pixel letters and glove as Lottie shapes: the same 5x7 glyphs the map draws its "Challenge I O N"
// buttons with (src/app.js FIGHT_GLYPHS, from src/minigame.js), the same 11x11 glove. Rows are merged into runs, one
// fill per row (the title's yellow-to-coral ramp), its dark red shadow half a pixel down and right, as on the map.
import { group, rect, fill, rgb } from "./ui.mjs";

export const GLYPHS = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#", C: ".###.|#...#|#....|#....|#....|#...#|.###.", D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####", F: "#####|#....|#....|####.|#....|#....|#....", G: ".###.|#...#|#....|#.###|#...#|#...#|.####",
  H: "#...#|#...#|#...#|#####|#...#|#...#|#...#", I: "###|.#.|.#.|.#.|.#.|.#.|###", K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
  L: "#....|#....|#....|#....|#....|#....|#####", M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", N: "#...#|##..#|#.#.#|#..##|#...#|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.", P: "####.|#...#|#...#|####.|#....|#....|#....", R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.", T: "#####|..#..|..#..|..#..|..#..|..#..|..#..", U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
  V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..", W: "#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#", Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
  "Ă": ".#.#.|..#..|.###.|#...#|#####|#...#|#...#", "!": "#|#|#|#|#|.|#", "-": "...|...|...|###|...|...|...", " ": "..|..|..|..|..|..|..",
  "/": "....#|...#.|...#.|..#..|.#...|.#...|#....", ".": ".|.|.|.|.|.|#", "Î": ".#.|#.#|###|.#.|.#.|.#.|###",
  2: "..###..|.##.##.|##...##|....##.|..###..|.##....|#######", 1: ".#.|##.|.#.|.#.|.#.|.#.|###", 0: ".###.|#..##|#.#.#|#.#.#|#.#.#|##..#|.###."
};
export const RAMP = ["#FFF3A6", "#FED012", "#FED012", "#FFB21A", "#FF9A1F", "#FF7A1F", "#F65342"];
const rowsOf = (ch) => (GLYPHS[ch] || GLYPHS[" "]).split("|");
export const pixelWidth = (text) => [...text].reduce((w, ch) => w + rowsOf(ch)[0].length + 1, -1);
// a line of pixel letters: its left at x, its top at y, each pixel px across; colors: one per row (or one for all)
export function pixelText(text, { x = 0, y = 0, px = 3, colors = RAMP, shadow = "#7a1a2a", nm = "pixels" } = {}) {
  const rows = Array.from({ length: 7 }, () => []);
  let cx = 0;
  for (const ch of text) {
    const g = rowsOf(ch);
    g.forEach((row, ry) => { let run = -1; for (let rx = 0; rx <= row.length; rx++) { const on = row[rx] === "#"; if (on && run < 0) run = rx; if (!on && run >= 0) { rows[ry].push([cx + run, rx - run]); run = -1; } } });
    cx += g[0].length + 1;
  }
  const rectsOf = (ry, dx, dy) => rows[ry].map(([rx, n]) => rect([n * px, px], [x + (rx + n / 2) * px + dx, y + (ry + 0.5) * px + dy], 0));
  const cols = Array.isArray(colors) ? colors : Array(7).fill(colors);
  const fg = rows.map((_, ry) => (rows[ry].length ? group("row " + ry, [...rectsOf(ry, 0, 0), fill(rgb(cols[ry]))]) : null)).filter(Boolean);
  const sh = shadow ? [group("shadow", [...rows.flatMap((_, ry) => rectsOf(ry, px * 0.5, px * 0.5)), fill(rgb(shadow))])] : [];
  return { groups: [group(nm, [...fg, ...sh])], width: (cx - 1) * px, height: 7 * px };
}
// the 11x11 glove: red, a highlight, the white cuff, its dark outline
const GLOVE = ["...####....", "..#RRRR#...", ".#RRWRRR#..", "#RRWRRRRR#.", "#RRRRRRRR#.", "#RRRRRRRR##", ".#RRRRRRR#R", "..#RRRRR#R#", "..#CCCCC##.", "..#CCCCC#..", "...#####..."];
const GCOL = { "#": "#121212", R: "#F65342", W: "#FFD8CF", C: "#F3EEFE" };
export function glove({ x = 0, y = 0, px = 2, nm = "glove", flip = false } = {}) {
  const by = {};
  GLOVE.forEach((row, ry) => { let run = -1, rc = null; for (let rx = 0; rx <= row.length; rx++) { const c = row[rx]; if (c !== rc || !GCOL[c]) { if (run >= 0 && GCOL[rc]) (by[rc] = by[rc] || []).push([ry, run, rx - run]); run = GCOL[c] ? rx : -1; rc = c; } } });
  const X = (rx, n) => (flip ? x + (11 - rx - n / 2) * px : x + (rx + n / 2) * px);
  return group(nm, Object.entries(by).map(([c, runs]) => group(c, [...runs.map(([ry, rx, n]) => rect([n * px, px], [X(rx, n), y + (ry + 0.5) * px], 0)), fill(rgb(GCOL[c]))])));
}
