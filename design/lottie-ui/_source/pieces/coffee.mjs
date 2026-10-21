// 6 · the website's coffee stop (TASK-067, Daniel: "acolo unde este scena de la Two Min, să avem o animație cu Lottie,
// care să se încarce instant"). The drive's coffee stop, drawn as a street elevation in the studio's line: the Cromatic
// villa with the red mansard (Strada George Călinescu 54) across from Two Minutes (Strada Constantin Aricescu 50A), the
// festoon between them, the drive's van at the kerb. The Two Minutes marks are the real artwork, traced from the box's
// print file (~/Clienti/Two Min/04_Livrabile-finale/CU_TWOMIN_165x165x55_BxNo#101515_BTG24112025A.pdf: the stacked
// TWO MIN and the II' sign, pieces/tm-marks.json); the boxes are the shop's green, pink and blue.
// One loop of 13 s that starts and ends on the same frame, the still (the website paints that frame as SVG with its
// HTML: lib/still.mjs; reduced motion keeps it):
//   0.0 s  the four double espressos on the sill, steam rising, the festoon breathing
//   1.5 s  the cups are drunk, one after another; the top shelf's three boxes hop onto the van's roof
//   3.9 s  the van pulls away (its nose lifts, the wheels roll with the road)
//   5.6 s  three new boxes leave the mansard's window, one by one, and land on the shelf (a squash, a settle)
//   7.8 s  the van comes back round and stops (its nose dips); 10 s: four doubles again, the counter 1, 2, 3, 4
// Two cuts: wide (1280 x 720, laptops) and tall (720 x 900, phones). No words: only digits and the client's marks.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, ellipse, fill, stroke, trim, rgb, E, path as shp, poly, C, clean, setLine, letterGroup } from "../lib/ui.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const MARKS = JSON.parse(fs.readFileSync(path.join(here, "tm-marks.json"), "utf8"));

export const CAB = {
  wide: { name: "wide", w: 1280, h: 720, sw: 2.1, ground: 566, kerb: 598, lane: 664, villa: [86, 1], shop: [766, 1], park: 598, vanY: 692, sun: [1158, 112], clouds: [[318, 104, 1], [700, 66, 0.78]],
    sky: [[0, 300, 92, 210], [452, 562, 260, 230], [560, 700, 330, 300], [1146, 1280, 250, 268], [1210, 1280, 196, 330]] },
  // the phone's cut: closer, the villa half out of the frame on the left (its mansard and its door in), the shop whole
  tall: { name: "tall", w: 720, h: 840, sw: 3, ground: 592, kerb: 626, lane: 716, villa: [-118, 1], shop: [300, 1], park: 352, vanY: 800, sun: [622, 92], clouds: [[150, 96, 0.8], [436, 52, 0.62]],
    sky: [[192, 312, 330], [652, 720, 290]] }
};

const T = 780; // the loop, frames at 60 a second
const INK = "#0d0c09", PAPER = "#FFFFFF";
const PAL = {
  sky: "#EAF2F6", ground: "#EFE7DD", kerbTop: "#F7F1EA", road: "#E0907E", dash: "#FFFFFF",
  wall: "#F6EBDC", roof: C.coral, room: "#4A3426", glass: "#C9E2EF", frame: "#FFFFFF", door: C.green, step: "#E2D6C6", lit: C.yellow,
  shopUp: "#F2B4A3", shopFront: "#141414", warm: "#FFE7B4", warmDoor: "#FFD27A", wood: "#C98A55", awnA: "#E1251B", awnB: "#FFFFFF",
  van: "#2FB3A8", vanRoof: "#FFFFFF", stripe: C.yellow, tyre: "#1d1b17", hub: "#FFFFFF",
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

/* ======================= the van (facing right, standing on 0, 0, 236 long) ======================= */
function vanBody(sw) {
  return [
    group("lamps", [ellipse([12, 12], [106, -44]), ink(sw * 0.8), solid(C.yellow), rect([6, 14], [-114, -46], 2), ink(sw * 0.8), solid(C.coral)]),
    group("bumpers", [rect([30, 9], [104, -27], 4), rect([26, 9], [-108, -27], 4), solid(INK)]),
    group("arches", [ellipse([58, 58], [-70, -22]), ellipse([58, 58], [70, -22]), solid(INK)]),
    group("handle", [rect([14, 4], [-8, -56], 2), solid(INK)]),
    group("windows", [
      rect([42, 32], [-76, -82], 6), rect([42, 32], [-24, -82], 6), ink(sw), solid(PAL.glass),
      shp({ c: true, v: [[22, -98], [78, -98], [104, -66], [22, -66]], i: [[0, 0], [-4, 0], [0, 0], [0, 0]], o: [[0, 0], [4, 2], [0, 0], [0, 0]] }), ink(sw), solid(PAL.glass)
    ]),
    group("stripe", [rect([234, 12], [-3, -48]), ink(sw * 0.8), solid(PAL.stripe)]),
    group("roof", [rect([170, 12], [-12, -114], 5), ink(sw), solid(PAL.vanRoof)]),
    rect([236, 88], [-3, -64], 24), ink(sw), solid(PAL.van)
  ];
}
const wheel = (sw) => [
  group("spokes", [shp(poly([[0, -9], [0, 9]], false)), shp(poly([[-7.8, 4.5], [7.8, -4.5]], false)), shp(poly([[-7.8, -4.5], [7.8, 4.5]], false)), ink(sw * 0.8)]),
  group("hub", [ellipse([20, 20], [0, 0]), ink(sw * 0.8), solid(PAL.hub)]),
  ellipse([44, 44], [0, 0]), ink(sw), solid(PAL.tyre)
];

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

  // ---- the van: parked, loaded, away, back ----
  const R = 22, deg = 180 / Math.PI, park = L.park, away = L.w + 160, from = -170;
  const xK = clean([[0, park, E.hold], [252, park, ACC], [338, away, E.hold], [470, from, DEC], [566, park + 10, E.inOut], [580, park, E.hold], [T, park]]);
  const van = Cm.nul("van", { ks: { p: { x: xK, y: L.vanY } } });
  // the top shelf's boxes, which leave with the van: on the shelf (in the van's frame: it stands still till 252), hop
  // onto its roof, ride away. Over the van, under the cups
  const ROOF = [[-46, -120], [-6, -120], [-26, -150]];
  const give = []; for (let j = 0; j < 3; j++) { const tl = 156 + 22 * j + 30; give.push([tl + 1, [100, 100], E.out], [tl + 4, [101, 96.5], E.out], [tl + 14, [100, 100], E.hold]); }
  const body = Cm.nul("van · body", { parent: van, ks: { s: clean([[0, [100, 100], E.hold], ...give, [T, [100, 100]]]), r: clean([[0, 0, E.hold], [250, 0, E.inOut], [264, -2.6, E.inOut], [300, -0.8, E.inOut], [338, 0, E.hold], [556, 0, E.inOut], [570, 3, E.inOut], [580, -1.2, E.inOut], [592, 0, E.hold], [T, 0]]) } });
  for (let j = 0; j < 3; j++) {
    const shelf = S(SLOT(j), SHELF_Y), from0 = [shelf[0] - park, shelf[1] - L.vanY], to = ROOF[j];
    const t0 = 156 + 22 * j, t1 = t0 + 30, s0 = 100 * sk, sR = 100;
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
  // the wheels roll with the road: their turn is the distance over the radius, on the same keys as the van
  const wK = xK.map(([t, x, e]) => [t, ((x - park) / R) * deg, e]);
  for (const wx of [70, -70]) Cm.shape(`van · wheel ${wx > 0 ? "front" : "back"}`, [group("wheel", wheel(SW))], { parent: body, ks: { p: [wx, -22], r: clean(wK) } });
  Cm.shape("van · body", [group("van", vanBody(SW))], { parent: body });
  // two puffs as it pulls away, left behind in the street
  for (let n = 0; n < 2; n++) {
    const t0 = 254 + n * 12, p0 = [park - 122, L.vanY - 26];
    Cm.shape(`van · puff ${n + 1}`, [group("puff", [ellipse([16, 14], [0, 0]), ink(SW * 0.8), solid(PAPER)])], {
      ip: t0, op: t0 + 34,
      ks: { p: clean([[t0, p0, E.out], [t0 + 34, [p0[0] - 46 - n * 14, p0[1] - 18]]]), s: clean([[t0, [30, 30], E.out], [t0 + 34, [150, 150]]]), o: clean([[t0, 100, E.hold], [t0 + 18, 100, E.linear], [t0 + 34, 0]]) }
    });
  }
  Cm.shape("van · shadow", [group("shadow", [ellipse([236, 14], [0, 0]), solid(INK, 16)])], { parent: van });

  // ---- the festoon between the villa's eave and the shop's corner: the bulbs glow in a slow wave ----
  const a = V(338, -306), b = S(-6, -328), sag = L.name === "tall" ? 34 : 50, NB = L.name === "tall" ? 5 : 8;
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
