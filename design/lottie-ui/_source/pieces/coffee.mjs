// 6 · the website's coffee stop (TASK-067, Daniel: "acolo unde este scena de la Two Min, să avem o animație cu Lottie,
// care să se încarce instant"). The drive's coffee stop, drawn as a street elevation in the studio's line: the Cromatic
// villa with the red mansard (Strada George Călinescu 54) across from Two Minutes (Strada Constantin Aricescu 50A), the
// festoon between them, the yellow Dacia at the kerb. The Two Minutes marks are the real artwork, traced from the box's
// print file (~/Clienti/Two Min/04_Livrabile-finale/CU_TWOMIN_165x165x55_BxNo#101515_BTG24112025A.pdf: the stacked
// TWO MIN and the II' sign, pieces/tm-marks.json); the boxes are the shop's green, pink and blue.
// TASK-071 (beta 4.0, Daniel: "hai să punem Dacia galbenă", "plantează jocul arcade acolo, în fața Two Minutes",
// "asigură-te că e și rulota, în dreapta"): the van is the map's yellow Dacia 1300 (src/app.js buildDacia1300: Dacia
// yellow, chrome bumpers with black over-riders, the chrome side trim, red seats) with a roof rack for the boxes; the
// map's arcade cabinet of "2 Minutes 2 Fight w/ I O N" (deep purple, the gold side trims, the three buttons, the game's
// pixel 2M2F on its marquee, two little fighters boxing on its screen) stands on the pavement at the shop's left; the
// map's caravan (cream, its tan stripe, one axle, the hitch) is parked on the right, and rocks a hair as the Dacia goes by.
// One loop of 13 s that starts and ends on the same frame, the still (the website paints that frame as SVG with its
// HTML: lib/still.mjs; reduced motion keeps it); the website plays it on a loop while it is on screen:
//   0.0 s  the four double espressos on the sill, steam rising, the festoon breathing, the fight on the arcade's screen
//   1.5 s  the cups are drunk, one after another; the top shelf's three boxes hop onto the Dacia's roof rack
//   3.9 s  the Dacia pulls away (its nose lifts, the wheels roll with the road), past the caravan
//   5.6 s  three new boxes leave the mansard's window, one by one, and land on the shelf (a squash, a settle)
//   7.8 s  the Dacia comes back round and stops (its nose dips); 10 s: four doubles again, the counter 1, 2, 3, 4
// Two cuts: wide (1280 x 720, laptops) and tall (720 x 840, phones: the street a little smaller, so the cabinet and the
// caravan are in it too). No words: only digits and the client's and the game's marks.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, ellipse, fill, stroke, trim, rgb, E, path as shp, poly, C, clean, setLine, letterGroup } from "../lib/ui.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const MARKS = JSON.parse(fs.readFileSync(path.join(here, "tm-marks.json"), "utf8"));

export const CAB = {
  // villa / shop / arcade / caravan: [x, scale]; car: the Dacia's scale; park: where it stands (its centre)
  wide: { name: "wide", w: 1280, h: 720, sw: 2.1, ground: 566, kerb: 598, lane: 664, villa: [56, 1], shop: [690, 1], arcade: [656, 1], caravan: [1188, 0.82], car: 1, park: 560, vanY: 692, sun: [1158, 112], clouds: [[300, 104, 1], [640, 62, 0.78]],
    sky: [[0, 250, 92, 210], [420, 532, 260, 230], [530, 664, 330, 300], [1084, 1200, 250, 268], [1170, 1280, 196, 330]] },
  // the phone's cut: closer, the villa half out of the frame on the left (its mansard and its door in), the arcade, the
  // shop whole, the caravan's front half coming in from the right (its hitch, its window)
  tall: { name: "tall", w: 720, h: 840, sw: 3, ground: 616, kerb: 650, lane: 734, villa: [-114, 0.86], shop: [236, 0.86], arcade: [207, 0.86], caravan: [700, 0.8], car: 0.86, park: 352, vanY: 810, sun: [628, 96], clouds: [[150, 104, 0.8], [436, 60, 0.62]],
    sky: [[140, 250, 300], [500, 604, 372], [600, 720, 262]] }
};
const T = 780; // the loop, frames at 60 a second
const INK = "#0d0c09", PAPER = "#FFFFFF";
const PAL = {
  sky: "#EAF2F6", ground: "#EFE7DD", kerbTop: "#F7F1EA", road: "#E0907E", dash: "#FFFFFF",
  wall: "#F6EBDC", roof: C.coral, room: "#4A3426", glass: "#C9E2EF", frame: "#FFFFFF", door: C.green, step: "#E2D6C6", lit: C.yellow,
  shopUp: "#F2B4A3", shopFront: "#141414", warm: "#FFE7B4", warmDoor: "#FFD27A", wood: "#C98A55", awnA: "#E1251B", awnB: "#FFFFFF",
  dacia: "#F6BC0C", chrome: "#D9DDE2", seat: "#C8171B", tyre: "#1d1b17", hub: "#FFFFFF",
  arc: "#2a1f4a", arcDeep: "#1d1638", arcPanel: "#3a2f6a", arcDusk: "#5a2a6a", arcSun: "#e0622a", arcGold: "#FED012",
  cvBody: "#F2EEE2", cvRoof: "#E4DDCC", cvStripe: "#B98A54", cvDoor: "#EAE3D2",
  bulb: "#FFE27A", halo: C.yellow, cup: "#FFFFFF", cupBand: "#E1251B", badge: C.yellow,
  boxes: ["#2F9E4F", "#F2A9C4", "#119BFE"], blocks: ["#C3B6E2", "#F8D3B4", "#F4C9C2", "#C3B6E2", "#F8D3B4"]
};
const ACC = [0.333, 0, 0.667, 0.333], DEC = [0.333, 0.667, 0.667, 1], SPRING = [0.34, 1.56, 0.64, 1], LAND = [0.3, 1.32, 0.6, 1];
const UP = [0.2, 0.6, 0.4, 1], DOWN = [0.6, 0, 0.8, 0.4], GLIDE = [0.45, 0, 0.55, 1];

const solid = (hex, o = 100) => fill(rgb(hex), o);
const ink = (w, o = 100) => stroke(rgb(INK), w, o, { lc: 2, lj: 2 });
const box = (nm, x0, y0, x1, y1, col, w, r = 0, more = []) => group(nm, [...more, rect([x1 - x0, y1 - y0], [(x0 + x1) / 2, (y0 + y1) / 2], r), ink(w), solid(col)]);
// a value that loops: fn(phase 0..1) sampled every `step` frames over the whole loop (linear between samples)
const periodic = (fn, P, { step = 10, phase = 0, from = 0, to = T } = {}) => {
  const k = [];
  for (let t = from; t <= to; t += step) k.push([t, fn((((t + phase) % P) + P) % P / P), E.linear]);
  if (k[k.length - 1][0] !== to) k.push([to, fn((((to + phase) % P) + P) % P / P), E.linear]);
  return clean(k);
};
// the client's marks, as paths at scale k with their top left at (x, y)
function markPaths(m, x, y, k) {
  return m.paths.map((p) => shp({ c: true, v: p.v.map(([a, b]) => [x + a * k, y + b * k]), i: p.i.map(([a, b]) => [a * k, b * k]), o: p.o.map(([a, b]) => [a * k, b * k]) }));
}
const markGroup = (nm, m, x, y, h, col) => group(nm, [...markPaths(m, x, y, h / m.h), fill(rgb(col), 100, 2)]);

/* ======================= the buildings (local: x from the left wall, y up from the ground, negative) ======================= */
function windowAt(x, y, w, h, sw, { lit = false } = {}) {
  return group("window", [
    shp(poly([[x + w / 2, y + 2], [x + w / 2, y + h - 2]], false)), shp(poly([[x + 2, y + h * 0.42], [x + w - 2, y + h * 0.42]], false)), ink(sw * 0.7),
    group("sill", [rect([w + 10, 6], [x + w / 2, y + h + 3], 2), ink(sw * 0.8), solid(PAPER)]),
    rect([w, h], [x + w / 2, y + h / 2], 3), ink(sw), solid(lit ? PAL.lit : PAL.glass)
  ]);
}
// the Cromatic villa (330 wide): two floors in cream, the red mansard with its lit window, the green door
function villa(sw) {
  const W = 330, items = [];
  // the dormer: its little roof, the window (lit: the studio is in), the frame
  items.push(group("dormer", [
    group("roof", [shp(poly([[132, -394], [165, -424], [198, -394]])), ink(sw), solid(C.coral)]),
    group("room", [group("lamp", [ellipse([10, 10], [165, -376]), solid(PAL.lit)]), rect([48, 62], [165, -361], 4), ink(sw), solid(PAL.room)]),
    group("cheeks", [rect([66, 76], [165, -356], 6), ink(sw), solid(PAL.wall)])
  ]));
  items.push(group("mansard", [
    shp(poly([[14, -360], [316, -360]], false)), shp(poly([[4, -334], [326, -334]], false)), ink(sw * 0.6, 45),
    shp(poly([[-12, -304], [342, -304], [300, -412], [30, -412]])), ink(sw), solid(PAL.roof)
  ]));
  items.push(box("cornice", -16, -312, W + 16, -296, PAL.wall, sw, 3));
  // upper floor: three windows; ground floor: two, the door between, its steps
  for (const x of [40, 140, 240]) items.push(windowAt(x, -270, 50, 76, sw));
  for (const x of [40, 240]) items.push(windowAt(x, -150, 50, 76, sw));
  items.push(group("door", [
    group("knob", [ellipse([6, 6], [180, -54]), solid(INK)]),
    group("arch", [shp(poly([[165, -112], [165, -16]], false)), ink(sw * 0.6, 50)]),
    rect([50, 100], [165, -62], 6), ink(sw), solid(PAL.door)
  ]));
  items.push(box("step", 132, -14, 198, 0, PAL.step, sw, 2));
  items.push(box("band", -4, -166, W + 4, -156, PAL.wall, sw, 2));
  items.push(box("wall", 0, -300, W, 0, PAL.wall, sw));
  return items;
}
// Two Minutes (360 wide): the pink upper floor, the black shop front with the stacked mark, the awning, the door, the
// window with its two shelves (the top one's boxes are their own layers: they come and go), the II' sign on its bracket
const SLOT = (j) => 228 + j * 42; // the top shelf's three places (centres), boxes 38 x 30 standing on y = -99
const SHELF_Y = -99, BW = 38, BH = 30;
function boxShapes(col, sw, { k = 1 } = {}) {
  // a coffee box standing on (0, 0): the lid's line, the II' mark in white, its outline
  const w = BW * k, h = BH * k;
  return [
    markGroup("II'", MARKS.ii, (-15 * k * MARKS.ii.w) / MARKS.ii.h / 2, -h + 6.5 * k, 15 * k, PAPER),
    group("lid", [shp(poly([[-w / 2 + 2, -h + 5 * k], [w / 2 - 2, -h + 5 * k]], false)), ink(sw * 0.6, 60)]),
    rect([w, h], [0, -h / 2], 3 * k), ink(sw), solid(col)
  ];
}
function shop(sw) {
  const W = 360, items = [];
  // the II' sign on its bracket, off the corner
  items.push(group("blade", [
    markGroup("II'", MARKS.ii, 365, -238, 26, INK),
    group("plate", [ellipse([44, 44], [372, -225]), ink(sw), solid(PAPER)]),
    group("bracket", [shp(poly([[W, -252], [372, -252], [372, -248]], false)), ink(sw)])
  ]));
  // the awning over the door and the window: stripes and a scalloped edge
  const ax0 = 126, ax1 = 356, ay0 = -176, ay1 = -152, n = 8, sw8 = (ax1 - ax0) / n;
  items.push(group("awning", [
    group("scallops", [
      group("white", [...Array.from({ length: n / 2 }, (_, i) => ellipse([sw8, 14], [ax0 + sw8 * (2 * i + 1.5), ay1])), ink(sw), solid(PAL.awnB)]),
      group("red", [...Array.from({ length: n / 2 }, (_, i) => ellipse([sw8, 14], [ax0 + sw8 * (2 * i + 0.5), ay1])), ink(sw), solid(PAL.awnA)])
    ]),
    group("stripes", [...Array.from({ length: n / 2 }, (_, i) => rect([sw8, ay1 - ay0], [ax0 + sw8 * (2 * i + 1.5), (ay0 + ay1) / 2])), solid(PAL.awnB)]),
    rect([ax1 - ax0, ay1 - ay0], [(ax0 + ax1) / 2, (ay0 + ay1) / 2], 2), ink(sw), solid(PAL.awnA)
  ]));
  // the window: the sill in front, the shelves, the boxes of the bottom shelf, the warm light
  items.push(box("sill", 194, -28, 350, -18, PAPER, sw, 2));
  items.push(group("bottom shelf", [
    ...[0, 1, 2].map((j) => group("box", boxShapes(PAL.boxes[(j + 1) % 3], sw * 0.9), { p: [SLOT(j), -52] })),
    box("board", 202, -52, 342, -46, PAL.wood, sw * 0.8, 1)
  ]));
  items.push(box("top board", 202, SHELF_Y, 342, SHELF_Y + 6, PAL.wood, sw * 0.8, 1));
  items.push(box("window", 200, -150, 344, -28, PAL.warm, sw, 3));
  items.push(group("door", [
    group("handle", [rect([4, 22], [176, -66], 2), solid(INK)]),
    group("glass", [rect([30, 70], [161, -82], 3), ink(sw * 0.8), solid(PAL.warmDoor)]),
    rect([50, 126], [161, -63], 4), ink(sw), solid("#2a2724")
  ]));
  // the mark: the real stacked TWO MIN, white on the black front
  items.push(markGroup("TWO MIN", MARKS.twoMin, 20, -146, 116, PAPER));
  items.push(box("front", 0, -172, W, 0, PAL.shopFront, sw));
  for (const x of [52, 230]) items.push(windowAt(x, -306, 78, 98, sw));
  items.push(box("cornice", -10, -350, W + 10, -334, PAPER, sw, 3));
  items.push(box("upper", 0, -336, W, -172, PAL.shopUp, sw));
  return items;
}

/* ======================= the Dacia (the map's yellow 1300, facing right, standing on 0, 0, 240 long) =======================
   Its bones as on the map (src/app.js buildDacia1300: the 1300 re-fitted to its photo, a 2.44 m wheelbase, the nose 0.72 m
   ahead of the front axle, the tail 0.92 m behind the rear one): the long bonnet and boot, the upright glasshouse on thin
   pillars, chrome bumpers with black rubber over-riders, the chrome trim along the side, red seats behind the glass; a
   roof rack (the boxes ride on it) */
const AXF = 78, AXB = -65, WR = 18; // the axles, the wheels' radius
function daciaBody(sw) {
  return [
    group("lamps", [rect([6, 11], [117.5, -42], 2), ink(sw * 0.8), solid("#FFF3C2"), rect([6, 12], [-117.5, -41], 2), ink(sw * 0.8), solid("#E1251B")]),
    group("over-riders", [rect([5, 13], [104, -24], 2), rect([5, 13], [-104, -24], 2), solid(INK)]),
    group("bumpers", [rect([34, 8], [110, -24], 4), rect([34, 8], [-110, -24], 4), ink(sw * 0.8), solid(PAL.chrome)]),
    group("arches", [ellipse([50, 50], [AXF, -WR]), ellipse([50, 50], [AXB, -WR]), solid(INK)]),
    group("handles", [rect([11, 3.5], [-18, -46], 1.5), rect([11, 3.5], [36, -46], 1.5), solid(INK)]),
    group("doors", [shp(poly([[-60, -54], [-60, -40]], false)), shp(poly([[-6, -54], [-6, -16]], false)), shp(poly([[48, -54], [48, -42]], false)), ink(sw * 0.6, 60)]),
    group("trim", [rect([228, 3.5], [0, -36], 1.5), ink(sw * 0.45), solid(PAL.chrome)]),
    group("rack", [rect([96, 4.5], [-9, -91.5], 2), ink(sw * 0.8), solid(PAL.chrome), ...[-48, -9, 30].map((x) => rect([3.5, 8], [x, -87], 1)), ink(sw * 0.6), solid(PAL.chrome)]),
    group("seats", [rect([11, 10], [-30, -60], 3), rect([10, 12], [22, -61], 3), ink(sw * 0.5), solid(PAL.seat)]),
    group("glass", [
      shp(poly([[-54, -56], [-38, -79], [-10, -79], [-10, -56]])), shp(poly([[-2, -56], [-2, -79], [18, -79], [40, -56]])), ink(sw * 0.9), solid(PAL.glass)
    ]),
    group("cabin", [shp(poly([[-64, -54], [-42, -84], [22, -84], [52, -54]])), ink(sw), solid(PAL.dacia)]),
    rect([240, 42], [0, -35], 12), ink(sw), solid(PAL.dacia)
  ];
}
const daciaWheel = (sw) => [
  group("nuts", [...[0, 1, 2, 3].map((k) => ellipse([3.2, 3.2], [Math.cos((k * Math.PI) / 2) * 7.5, Math.sin((k * Math.PI) / 2) * 7.5])), solid(INK)]),
  group("cap", [ellipse([10, 10], [0, 0]), ink(sw * 0.6), solid(PAL.hub)]),
  group("rim", [ellipse([24, 24], [0, 0]), ink(sw * 0.8), solid(PAL.chrome)]),
  ellipse([WR * 2, WR * 2], [0, 0]), ink(sw), solid(PAL.tyre)
];

/* ======================= the arcade cabinet (the map's, r201: front on, standing on 0, 0, 62 wide, 113 tall) ======================= */
// the game's own pixel letters (src/app.js FIGHT_GLYPHS, the 2 as on the cabinet) and its colours, row by row
const GLYPH = { 2: "..###..|.##.##.|##...##|....##.|..###..|.##....|#######", M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", F: "#####|#....|#....|####.|#....|#....|#...." };
const GLYPH_ROW = ["#FFF3A6", "#FED012", "#FED012", "#FFB21A", "#FF9A1F", "#FF7A1F", "#F65342"];
function pixelWord(word, cx, cy, c) {
  const rows = [...word].map((ch) => GLYPH[ch].split("|")), W = rows.reduce((w, r) => w + r[0].length + 1, -1);
  const x0 = cx - (W * c) / 2, y0 = cy - (7 * c) / 2, byRow = GLYPH_ROW.map(() => []), sh = [];
  let x = x0;
  for (const r of rows) { r.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === "#") { byRow[ry].push(rect([c, c], [x + (rx + 0.5) * c, y0 + (ry + 0.5) * c])); sh.push(rect([c, c], [x + (rx + 1) * c, y0 + (ry + 1) * c])); } }); x += (r[0].length + 1) * c; }
  return [...byRow.map((rs, i) => group("row " + i, [...rs, solid(GLYPH_ROW[i])])), group("shade", [...sh, solid("#7a1a2a")])];
}
const SCR = { x0: -21, x1: 21, y0: -91, y1: -59 }; // the screen
function arcadeBody(sw) {
  const sc = (y0, y1, col) => rect([SCR.x1 - SCR.x0, y1 - y0], [0, (y0 + y1) / 2]), dusk = [[-91, -80, PAL.arcDeep], [-80, -69, PAL.arcDusk], [-69, -59, PAL.arcSun]];
  return [
    group("marquee", [...pixelWord("2M2F", 0, -104.5, 1.7), rect([64, 19], [0, -104.5], 3.5), ink(sw), solid(PAL.arcDeep)]),
    group("floor", [rect([SCR.x1 - SCR.x0, 3], [0, -60.5]), solid(PAL.arcDeep)]),
    group("bars", [rect([15, 2.2], [-11.5, -87.5], 1), rect([15, 2.2], [11.5, -87.5], 1), solid(PAL.arcGold)]),
    ...dusk.map(([a, b, col]) => group("screen", [sc(a, b), solid(col)])),
    group("bezel", [rect([50, 40], [0, -75], 5), ink(sw), solid(INK)]),
    group("stick", [ellipse([7, 7], [-15, -60]), ink(sw * 0.7), solid("#F65342"), shp(poly([[-15, -57], [-15, -50]], false)), ink(sw * 0.9)]),
    group("buttons", [ellipse([5.5, 5.5], [0, -49.5]), solid("#F65342"), ellipse([5.5, 5.5], [9, -49.5]), solid(PAL.arcGold), ellipse([5.5, 5.5], [18, -49.5]), solid("#119BFE")]),
    group("panel", [rect([64, 9], [0, -49], 3), ink(sw), solid(PAL.arcPanel)]),
    group("coin door", [rect([3.5, 8], [-4.5, -28], 1), rect([3.5, 8], [4.5, -28], 1), solid(PAL.arcDeep), rect([22, 24], [0, -27], 3), ink(sw * 0.8), solid(PAL.arcPanel)]),
    group("kick", [rect([58, 9], [0, -4.5], 2), ink(sw), solid(INK)]),
    group("trims", [rect([5.5, 96], [-28, -50], 2), rect([5.5, 96], [28, -50], 2), ink(sw * 0.8), solid(PAL.arcGold)]),
    rect([56, 104], [0, -52], 4), ink(sw), solid(PAL.arc)
  ];
}
// the two fighters on its screen (7 x 8 cells, facing each other): the crew in blue, I O N in his yellow, red gloves
const FIGHTER = {
  idle: ["..HH...", "..HH...", ".BBBGG.", ".BBB...", "..BB...", "..LL...", ".L..L..", ".L..L.."],
  hit: ["..HH...", "..HH...", ".BBBBGG", ".BBB...", "..BB...", "..LL...", ".L..L..", ".L..L.."]
};
function fighter(rows, body, mirror, c = 1.5) {
  const col = { H: "#FFD8CF", B: body, G: "#F65342", L: "#F3EEFE" }, by = {};
  const x0 = mirror ? 13 - 7 * c : -13, y0 = -62 - 8 * c;
  rows.forEach((row, ry) => { [...row].forEach((ch, rx) => { if (!col[ch]) return; const x = mirror ? 6 - rx : rx; (by[ch] = by[ch] || []).push(rect([c + 0.05, c + 0.05], [x0 + (x + 0.5) * c, y0 + (ry + 0.5) * c])); }); });
  return Object.entries(by).map(([k, rs]) => group(k, [...rs, solid(col[k])]));
}

/* ======================= the caravan (the map's, facing left: its hitch towards the shop; standing on 0, 0) ======================= */
function caravanShapes(sw) {
  return [
    group("steady", [shp(poly([[84, -26], [88, 0]], false)), ink(sw)]),
    group("jockey", [ellipse([12, 12], [-128, -6]), ink(sw * 0.8), solid(PAL.tyre), rect([4.5, 24], [-128, -23], 1.5), ink(sw * 0.8), solid(PAL.chrome)]),
    group("cover", [rect([22, 15], [-113, -40], 4), ink(sw * 0.8), solid(PAL.cvRoof)]),
    group("hitch", [shp(poly([[-98, -40], [-142, -30], [-98, -26]], false)), ink(sw), ellipse([9, 9], [-143, -30]), ink(sw * 0.8), solid(INK)]),
    group("wheel", [ellipse([10, 10], [8, -20]), ink(sw * 0.6), solid(PAL.hub), ellipse([26, 26], [8, -20]), ink(sw * 0.8), solid(PAL.chrome), ellipse([40, 40], [8, -20]), ink(sw), solid(PAL.tyre)]),
    group("arch", [ellipse([50, 50], [8, -20]), solid(INK)]),
    group("step", [rect([30, 6], [42, -21], 2), ink(sw * 0.8), solid(PAL.chrome)]),
    group("handle", [rect([3.5, 11], [53, -62], 1.5), solid(INK)]),
    group("porthole", [ellipse([16, 16], [42, -92]), ink(sw * 0.9), solid(PAL.glass)]),
    group("door", [rect([34, 80], [42, -67], 7), ink(sw), solid(PAL.cvDoor)]),
    group("back window", [rect([22, 24], [80, -90], 6), ink(sw * 0.9), solid(PAL.glass)]),
    group("curtains", [rect([11, 30], [-80, -88], 3), rect([11, 30], [-36, -88], 3), ink(sw * 0.6), solid(PAL.awnA)]),
    group("window", [shp(poly([[-58, -105], [-58, -71]], false)), ink(sw * 0.6, 60), rect([60, 34], [-58, -88], 9), ink(sw), solid(PAL.warm)]),
    group("stripe", [rect([194, 11], [0, -46]), ink(sw * 0.8), solid(PAL.cvStripe)]),
    group("vent", [rect([30, 8], [26, -131], 2.5), ink(sw * 0.8), solid(PAL.cvRoof)]),
    group("roof line", [shp(poly([[-78, -112], [78, -112]], false)), ink(sw * 0.6, 45)]),
    rect([200, 102], [0, -76], 32), ink(sw), solid(PAL.cvBody)
  ];
}

/* ======================= the cups, the steam, the counter ======================= */
function cupShapes(sw) {
  return [
    group("handle", [ellipse([12, 12], [14, -14]), ink(sw * 0.9)]),
    group("band", [rect([20, 4], [0, -15]), solid(PAL.cupBand)]),
    group("cup", [shp({ c: true, v: [[-12, -24], [12, -24], [8, -6], [-8, -6]], i: [[0, 0], [0, 0], [3, 2], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [-3, 2]] }), ink(sw), solid(PAL.cup)]),
    group("saucer", [ellipse([34, 7], [0, -3]), ink(sw), solid(PAL.cup)])
  ];
}
const steamPath = () => shp({ c: false, v: [[0, 0], [-6, -16], [5, -34], [-2, -50]], i: [[0, 0], [5, 6], [-6, 6], [5, 6]], o: [[-5, -6], [6, -6], [-5, -6], [0, 0]] });

/* ======================= the piece ======================= */
export function buildCoffee(Ty, L) {
  const Cm = new Comp({ w: L.w, h: L.h, dur: T / 60, nm: `Cromatic · website · the coffee stop · ${L.name}` });
  Cm.marker("loop", 0, T);
  const SW = L.sw, G = L.ground;
  const [vx, vk] = L.villa, [sx, sk] = L.shop;
  const V = (x, y) => [vx + x * vk, G + y * vk], S = (x, y) => [sx + x * sk, G + y * sk];
  const swV = SW / vk, swS = SW / sk;

  // ---- the counter: a yellow disc with the number of doubles, over the sill's right end ----
  const bc = S(372, -64), bR = 25;
  const tOut = 140, tIn = 604, CUP = (k) => 604 + 26 * k;
  const badge = Cm.shape("counter", [
    group("disc", [ellipse([bR * 2, bR * 2], [0, 0]), ink(SW * 0.9 / sk), solid(PAL.badge)]),
    group("shadow", [ellipse([bR * 2, bR * 2], [0, 3]), solid(INK)])
  ], { ks: { p: bc, s: clean([[0, [100 * sk, 100 * sk], E.hold], [tOut, [100 * sk, 100 * sk], E.in], [tOut + 12, [0, 0], E.hold], [tIn, [0, 0], SPRING], [tIn + 16, [100 * sk, 100 * sk]]]) } });
  // (the digits ride on the disc: drawn over it, so added first)
  Cm.layers.pop(); Cm.ind--;
  const digitLayers = [];
  for (let d = 1; d <= 4; d++) {
    const size = 30, Lt = setLine(Ty, String(d), size, 0), lt = Lt.letters[0];
    const g = letterGroup(Ty, { ...lt, x: -Lt.width / 2 }, size, rgb(INK));
    const t0 = CUP(d - 1), t1 = d < 4 ? CUP(d) : T;
    const o = d === 4 ? clean([[0, 100, E.hold], [tOut + 12, 0, E.hold], [t0, 100, E.hold], [T, 100]]) : clean([[0, 0, E.hold], [t0, 100, E.hold], [t1, 0, E.hold], [T, 0]]);
    const s = clean([[0, [100, 100], E.hold], [t0, [140, 140], SPRING], [t0 + 12, [100, 100]]]);
    digitLayers.push({ nm: `counter · ${d}`, g, o, s });
  }
  // the badge's own layer after its digits (so they are drawn over it), the digits parented to it
  const dl = digitLayers.map((x) => Cm.shape(x.nm, [group("digit", [x.g], { p: [0, 11], s: x.s })], { ks: { o: x.o } }));
  Cm.add(badge);
  for (const x of dl) x.parent = badge.ind;

  // ---- the steam over two of the cups (a curl drawn up, then away), while the cups are there ----
  const cupX = (k) => 214 + k * 34, cupY = -28;
  for (const [n, k] of [[0, 1], [1, 3]]) {
    const P = 130, ph = n ? 18 : 62;
    const e = periodic((u) => 100 * Math.min(1, Math.max(0, u / 0.55)) ** 0.7, P, { phase: ph, step: 6 });
    const s = periodic((u) => 100 * Math.min(1, Math.max(0, (u - 0.3) / 0.7)) ** 1.6, P, { phase: ph, step: 6 });
    const drunk = 90 + 12 * k, back = CUP(k) + 30;
    Cm.shape(`steam · ${n}`, [group("curl", [steamPath(), trim(s, e), ink(SW * 0.9 / sk, 45)], { p: [0, 0] })], {
      ks: { p: S(cupX(k), cupY - 30), s: [100 * sk, 100 * sk], o: clean([[0, 100, E.hold], [drunk - 6, 100, E.linear], [drunk + 4, 0, E.hold], [back, 0, E.linear], [back + 20, 100, E.hold], [T, 100]]) }
    });
  }
  // ---- the four doubles on the sill: drunk one after another (a squash, gone), poured again one after another ----
  for (let k = 0; k < 4; k++) {
    const d = 90 + 12 * k, c = CUP(k), base = S(cupX(k), cupY), s0 = 100 * sk;
    Cm.shape(`espresso · ${k + 1}`, [group("cup", cupShapes(SW / sk))], {
      ks: {
        p: clean([[0, base, E.hold], [c, [base[0], base[1] - 16 * sk], [0.3, 1.2, 0.5, 1]], [c + 14, base]]),
        s: clean([[0, [s0, s0], E.hold], [d, [s0, s0], E.inOut], [d + 5, [s0 * 1.14, s0 * 0.84], E.in], [d + 14, [0, 0], E.hold], [c, [0, 0], SPRING], [c + 16, [s0, s0]]]),
        r: clean([[0, 0, E.hold], [d + 5, 0, E.in], [d + 14, -24, E.hold], [c, 6, SPRING], [c + 16, 0]])
      }
    });
  }

  // ---- the new boxes: out of the mansard's window, across the street, onto the top shelf ----
  const dorm = V(165, -362);
  const launch = (j) => 344 + 46 * j, FLY = 54;
  for (let j = 0; j < 3; j++) {
    const t0 = launch(j), t1 = t0 + 10, t2 = t1 + FLY, land = S(SLOT(j), SHELF_Y), s0 = 100 * sk;
    const peak = Math.min(dorm[1], land[1]) - (L.name === "tall" ? 130 : 150) - j * 8;
    const tp = t1 + Math.round(FLY * 0.46);
    Cm.shape(`new box · ${j + 1}`, [group("box", boxShapes(PAL.boxes[j], SW / sk))], {
      ip: t0, op: T,
      ks: {
        p: { x: clean([[t0, dorm[0], E.hold], [t1, dorm[0], GLIDE], [t2, land[0], E.hold], [T, land[0]]]), y: clean([[t0, dorm[1] + 14, E.out], [t1, dorm[1], UP], [tp, peak, DOWN], [t2, land[1], E.hold], [T, land[1]]]) },
        s: clean([[t0, [0, 0], SPRING], [t1, [s0 * 0.9, s0 * 0.9], E.inOut], [tp, [s0 * 0.94, s0 * 1.08], E.in], [t2, [s0 * 1.04, s0 * 0.98], E.out], [t2 + 3, [s0 * 1.2, s0 * 0.78], LAND], [t2 + 14, [s0, s0], E.hold], [T, [s0, s0]]]),
        r: clean([[t0, -10, E.inOut], [tp, 8 - j * 6, E.inOut], [t2, 0, E.hold], [T, 0]])
      }
    });
    // the dust where it lands: four short ticks, out and gone
    const dx = (BW / 2 + 6) * sk;
    Cm.shape(`new box · ${j + 1} · dust`, [
      group("ticks", [shp(poly([[-dx, -2], [-dx - 9, -8]], false)), shp(poly([[-dx - 2, -14], [-dx - 11, -22]], false)), shp(poly([[dx, -2], [dx + 9, -8]], false)), shp(poly([[dx + 2, -14], [dx + 11, -22]], false)),
        trim(clean([[t2 + 2, 0, E.out], [t2 + 16, 100]]), clean([[t2, 0, E.out], [t2 + 8, 100]])), ink(SW * 0.8)])
    ], { ip: t2, op: t2 + 18, ks: { p: land } });
  }

  // ---- the Dacia: parked, loaded, away, back ----
  const ck = L.car, deg = 180 / Math.PI, park = L.park, away = L.w + 170 * ck, from = -170 * ck;
  const xK = clean([[0, park, E.hold], [252, park, ACC], [338, away, E.hold], [470, from, DEC], [566, park + 10, E.inOut], [580, park, E.hold], [T, park]]);
  const van = Cm.nul("dacia", { ks: { p: { x: xK, y: L.vanY }, s: [100 * ck, 100 * ck] } });
  // the top shelf's boxes, which leave with the car: on the shelf (in the car's frame: it stands still till 252), hop
  // onto its roof rack, ride away. Over the car, under the cups
  const ROOF = [[-28, -94], [10, -94], [-9, -124]];
  const give = []; for (let j = 0; j < 3; j++) { const tl = 156 + 22 * j + 30; give.push([tl + 1, [100, 100], E.out], [tl + 4, [101, 96], E.out], [tl + 14, [100, 100], E.hold]); }
  const body = Cm.nul("dacia · body", { parent: van, ks: { s: clean([[0, [100, 100], E.hold], ...give, [T, [100, 100]]]), r: clean([[0, 0, E.hold], [250, 0, E.inOut], [264, -2.4, E.inOut], [300, -0.8, E.inOut], [338, 0, E.hold], [556, 0, E.inOut], [570, 2.8, E.inOut], [580, -1.1, E.inOut], [592, 0, E.hold], [T, 0]]) } });
  for (let j = 0; j < 3; j++) {
    const shelf = S(SLOT(j), SHELF_Y), from0 = [(shelf[0] - park) / ck, (shelf[1] - L.vanY) / ck], to = ROOF[j];
    const t0 = 156 + 22 * j, t1 = t0 + 30, s0 = (100 * sk) / ck, sR = 100;
    const pk = Math.min(from0[1], to[1]) - 44;
    Cm.shape(`leaving box · ${j + 1}`, [group("box", boxShapes(PAL.boxes[j], SW / sk))], {
      parent: body, op: 344,
      ks: {
        p: { x: clean([[0, from0[0], E.hold], [t0, from0[0], GLIDE], [t1, to[0], E.hold], [344, to[0]]]), y: clean([[0, from0[1], E.hold], [t0, from0[1], UP], [t0 + 12, pk, DOWN], [t1, to[1], E.hold], [344, to[1]]]) },
        s: clean([[0, [s0, s0], E.hold], [t0, [s0, s0], E.out], [t0 + 4, [s0 * 1.06, s0 * 0.92], E.out], [t0 + 12, [(s0 + sR) / 2 * 0.95, (s0 + sR) / 2 * 1.06], E.in], [t1, [sR * 1.02, sR], E.out], [t1 + 3, [sR * 1.16, sR * 0.82], LAND], [t1 + 13, [sR, sR], E.hold], [344, [sR, sR]]]),
        r: clean([[0, 0, E.hold], [t0, 0, E.inOut], [t0 + 12, -14 + 7 * j, E.inOut], [t1, 0, E.hold], [344, 0]])
      }
    });
  }
  // the wheels roll with the road: their turn is the distance over the radius, on the same keys as the car
  const wK = xK.map(([t, x, e]) => [t, ((x - park) / (WR * ck)) * deg, e]);
  for (const wx of [AXF, AXB]) Cm.shape(`dacia · wheel ${wx > 0 ? "front" : "back"}`, [group("wheel", daciaWheel(SW / ck))], { parent: body, ks: { p: [wx, -WR], r: clean(wK) } });
  Cm.shape("dacia · body", [group("dacia", daciaBody(SW / ck))], { parent: body });
  // two puffs as it pulls away, left behind in the street
  for (let n = 0; n < 2; n++) {
    const t0 = 254 + n * 12, p0 = [park - 124 * ck, L.vanY - 16 * ck];
    Cm.shape(`dacia · puff ${n + 1}`, [group("puff", [ellipse([16, 14], [0, 0]), ink(SW * 0.8), solid(PAPER)])], {
      ip: t0, op: t0 + 34,
      ks: { p: clean([[t0, p0, E.out], [t0 + 34, [p0[0] - 46 - n * 14, p0[1] - 18]]]), s: clean([[t0, [30, 30], E.out], [t0 + 34, [150, 150]]]), o: clean([[t0, 100, E.hold], [t0 + 18, 100, E.linear], [t0 + 34, 0]]) }
    });
  }
  Cm.shape("dacia · shadow", [group("shadow", [ellipse([244, 14], [0, 0]), solid(INK, 16)])], { parent: van });

  // ---- the arcade cabinet of "2 Minutes 2 Fight w/ I O N" on the pavement at the shop's left (the map's, r201): the
  // fight on its screen (a jab each way, every second), its coin slots and its marquee breathing ----
  const [ax, ak] = L.arcade, AP = { p: [ax, G], s: [100 * ak, 100 * ak] }, swA = SW / ak, FP = 60;
  const blink = (on0, on1) => { const k = [[0, 0, E.hold]]; for (let t = 0; t < T; t += FP) k.push([t + on0, 100, E.hold], [t + on1, 0, E.hold]); k.push([T, 0]); return clean(k); };
  const idleO = (on0, on1) => { const k = [[0, 100, E.hold]]; for (let t = 0; t < T; t += FP) k.push([t + on0, 0, E.hold], [t + on1, 100, E.hold]); k.push([T, 100]); return clean(k); };
  Cm.shape("arcade · jab (crew)", [group("f", fighter(FIGHTER.hit, "#119BFE", false))], { ks: { ...AP, o: blink(14, 22) } });
  Cm.shape("arcade · guard (crew)", [group("f", fighter(FIGHTER.idle, "#119BFE", false))], { ks: { ...AP, o: idleO(14, 22) } });
  Cm.shape("arcade · jab (I O N)", [group("f", fighter(FIGHTER.hit, PAL.arcGold, true))], { ks: { ...AP, o: blink(38, 46) } });
  Cm.shape("arcade · guard (I O N)", [group("f", fighter(FIGHTER.idle, PAL.arcGold, true))], { ks: { ...AP, o: idleO(38, 46) } });
  Cm.shape("arcade · coin lights", [group("lights", [rect([3.5, 8], [-4.5, -28], 1), rect([3.5, 8], [4.5, -28], 1), solid("#FF9A1F")], { o: periodic((u) => 15 + 85 * (0.5 + 0.5 * Math.cos(2 * Math.PI * u)), 78, { step: 6 }) })], { ks: AP });
  Cm.shape("arcade", [group("cabinet", arcadeBody(swA))], { ks: AP });
  Cm.shape("arcade · shadow", [group("shadow", [ellipse([70, 8], [0, 0]), solid(INK, 14)])], { ks: AP });

  // ---- the caravan, on the right (the map's, by Two Minutes): it rocks a hair as the Dacia goes by ----
  const [cx, cvk] = L.caravan, pass = 252 + 86 * Math.sqrt(Math.max(0, Math.min(1, (cx - 150 * cvk - park) / (away - park))));
  const tr0 = Math.round(Math.min(330, pass));
  Cm.shape("caravan", [group("caravan", caravanShapes(SW / cvk), { a: [8, 0], p: [8, 0], r: clean([[0, 0, E.hold], [tr0, 0, E.inOut], [tr0 + 7, -0.9, E.inOut], [tr0 + 18, 0.55, E.inOut], [tr0 + 30, -0.2, E.inOut], [tr0 + 40, 0, E.hold], [T, 0]]) })], { ks: { p: [cx, G], s: [100 * cvk, 100 * cvk] } });
  Cm.shape("caravan · shadow", [group("shadow", [ellipse([236, 10], [-20, 0]), solid(INK, 12)])], { ks: { p: [cx, G], s: [100 * cvk, 100 * cvk] } });

  // ---- the festoon between the villa's eave and the shop's corner: the bulbs glow in a slow wave ----
  const a = V(338, -306), b = S(-6, -328), NB = Math.max(2, Math.round((b[0] - a[0]) / 36)), sag = NB < 4 ? 18 : 50;
  const at = (u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + sag * 4 * u * (1 - u)];
  const mid = at(0.5);
  const wire = shp({ c: false, v: [a, b], o: [[(mid[0] - a[0]) * 0.66, (mid[1] + sag - a[1]) * 0.66], [0, 0]], i: [[0, 0], [(mid[0] - b[0]) * 0.66, (mid[1] + sag - b[1]) * 0.66]] });
  const bulbs = [], halos = [];
  for (let i = 0; i < NB; i++) {
    const u = (i + 0.5) / NB, [x, y] = at(u);
    bulbs.push(group("bulb " + i, [rect([5, 4], [x, y + 3], 1), ellipse([10, 13], [x, y + 10]), ink(SW * 0.7), solid(PAL.bulb)]));
    const ph = (i / NB) * 195;
    halos.push(group("halo " + i, [ellipse([30, 30], [x, y + 10]), solid(PAL.halo)], { o: periodic((u2) => 22 + 26 * (0.5 + 0.5 * Math.cos(2 * Math.PI * u2)), 195, { phase: -ph, step: 13 }) }));
  }
  Cm.shape("festoon", [group("bulbs", bulbs), group("wire", [wire, ink(SW * 0.75)]), group("halos", halos)]);

  // ---- the buildings ----
  // the mansard's window: two panes on their hinges, open while the boxes go out (the room behind is the villa's)
  const openT = 326, shutT = launch(2) + 24, ps = (k0) => clean([[0, [100, 100], E.hold], [openT, [100, 100], SPRING], [openT + 16, [k0, 100], E.hold], [shutT, [k0, 100], E.inOut], [shutT + 14, [100, 100], E.hold], [T, [100, 100]]]);
  const pane = (nm, x0, x1, hinge) => group(nm, [shp(poly([[x0 + 2, 0], [x1 - 2, 0]], false)), ink(SW * 0.75 / vk), rect([x1 - x0, 62], [(x0 + x1) / 2, 0], 3), ink(SW / vk), solid(PAL.lit)], { a: [hinge, 0], p: [hinge, 0], s: ps(16) });
  Cm.shape("villa · the mansard's window", [pane("left pane", -24, 0, -24), pane("right pane", 0, 24, 24)], { ks: { p: V(165, -361), s: [100 * vk, 100 * vk] } });
  Cm.shape("Two Minutes", [group("shop", shop(swS), { p: [sx, G], s: [100 * sk, 100 * sk] })]);
  Cm.shape("Cromatic", [group("villa", villa(swV), { p: [vx, G], s: [100 * vk, 100 * vk] })]);

  // ---- the street: the kerb, the road, its dashes ----
  const dashes = [];
  for (let x = 30; x < L.w; x += 120) dashes.push(rect([60, 7], [x + 30, L.lane], 3.5));
  Cm.shape("street", [
    group("dashes", [...dashes, solid(PAL.dash)]),
    group("kerb", [shp(poly([[-10, L.kerb], [L.w + 10, L.kerb]], false)), ink(SW)]),
    group("road", [rect([L.w + 20, L.h - L.kerb + 10], [L.w / 2, (L.kerb + L.h) / 2 + 5]), solid(PAL.road)]),
    group("pavement", [shp(poly([[-10, G], [L.w + 10, G]], false)), ink(SW), rect([L.w + 20, L.kerb - G], [L.w / 2, (G + L.kerb) / 2]), solid(PAL.ground)])
  ]);
  // ---- the city behind: blocks in the map's colours, their windows ----
  const blocks = L.sky.map(([x0, x1, h, ww], i) => {
    const wins = [];
    for (let y = G - h + 26; y < G - 30; y += 40) for (let x = x0 + 18; x < x1 - 24; x += 34) wins.push(rect([14, 20], [x + 7, y + 10], 2));
    return group("block " + i, [group("windows", [...wins, solid(INK, 12)]), rect([x1 - x0, h], [(x0 + x1) / 2, G - h / 2], 4), ink(SW * 0.8), solid(PAL.blocks[i % PAL.blocks.length])]);
  });
  Cm.shape("city", blocks);
  // ---- clouds that breathe, the sun that turns ----
  L.clouds.forEach(([x, y, k], i) => {
    const puffs = () => [ellipse([70, 54], [-30, 0]), ellipse([84, 70], [12, -10]), ellipse([60, 46], [52, 4]), rect([150, 30], [10, 14], 15)];
    Cm.shape("cloud " + i, [group("fill", [...puffs(), solid(PAPER)]), group("line", [...puffs(), stroke(rgb(INK), SW * 2 / k, 100, { lc: 2, lj: 2 })])], {
      ks: { p: periodic((u) => [x + 10 * Math.sin(2 * Math.PI * u) * (i ? -1 : 1), y + 4 * Math.sin(4 * Math.PI * u)], T, { step: 26, phase: i * 200 }), s: [100 * k, 100 * k] }
    });
  });
  const rays = Array.from({ length: 8 }, (_, i) => { const an = (i * Math.PI) / 4; return shp(poly([[Math.cos(an) * 54, Math.sin(an) * 54], [Math.cos(an) * 66, Math.sin(an) * 66]], false)); });
  Cm.shape("sun", [group("rays", [...rays, ink(SW)], { r: [[0, 0, E.linear], [T, 45]] }), group("disc", [ellipse([84, 84], [0, 0]), ink(SW), solid(C.yellow)])], { ks: { p: L.sun } });
  Cm.shape("sky", [group("sky", [rect([L.w, L.h], [L.w / 2, L.h / 2]), solid(PAL.sky)])]);
  return Cm.json();
}
