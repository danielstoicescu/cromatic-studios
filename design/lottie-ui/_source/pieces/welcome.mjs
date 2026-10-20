// 4 · the map's welcome card (TASK-007, Daniel: "the old onboarding, not Lottie"). The card's four steps become small
// explainers in their grey circles, and the card opens out of the intro's last pill:
//   welcome-drive  · Drive it yourself: ↑ held, the road streams under the yellow car, ← and → change lanes
//   welcome-tap    · Or tap a place: a pin lands, a finger taps it, the place's card pops out of it
//   welcome-work   · See the work: a little portfolio opens and its pages turn (one project, another, the first again)
//   welcome-hi     · Say hi: the coffee cup hops, its steam rises into a "hi!" bubble
//   welcome-open   · the opening: the intro's rainbow pill pops in where the card will be and stretches into it; its ring
//                    turns into the card's ink outline, the card's hard shadow comes down under it. Written for a reference
//                    card (cromatic.fit) and fitted to the real one by the page (src/lottie-ui/welcome.js) before it plays
// Each icon has two segments: "in" (its pieces arrive as the card opens) and "act" (the explainer; it starts and ends on
// the same idle pose, so it can loop on hover without a seam). cromatic.still is the frame for reduced motion. A light
// version (the card's cream paper, every world but one) and a Sketchbook one (indigo ink, coloured pencil on white).
// The words drawn here ("hi!") are the map's, which is English by design (Daniel, 2026-10-19).
import { Comp, group, rect, ellipse, fill, stroke, trim, rgb, E, prop, path, poly, roundRect, circlePath, C, clean, LILAC, SHADOW, line, capH, softShadow } from "../lib/ui.mjs";

const L = 60; // frames a second
// the quadratic ease-in and ease-out: a stream that speeds up and slows down with no jump in speed
const ACC = [0.333, 0, 0.667, 0.333], DEC = [0.333, 0.667, 0.667, 1];
const SPRING = [0.34, 1.56, 0.64, 1], LAND = [0.3, 1.32, 0.6, 1];

export const WPAL = {
  light: {
    name: "light", ink: "#141414", w: 1.8, road: "#E0907E", roadEdge: "#2a2118", dash: "#FFFFFF", car: C.yellow, roof: "#FFE36B", glass: "#2b2b33", lamp: "#FFFFFF",
    key: "#FFFFFF", keyOn: C.yellow, lip: "#141414", blockA: LILAC, blockB: "#F0B48A", blockC: C.coral, tree: C.green,
    pin: C.coral, pinDot: "#FFFFFF", card: "#FFFFFF", cardPic: "#141414", cardMark: C.yellow, bar: "#141414", barO: 32, btn: "#141414",
    cover: C.yellow, page: "#FFFFFF", picA: C.blue, picB: C.coral, sun: C.yellow, hill: C.green, mark: "#FFFFFF",
    cup: "#FFFFFF", band: C.yellow, coffee: "#3A2218", crema: "#C68B59", steam: "#141414", steamO: 42, bubble: "#FFFFFF",
    shadow: SHADOW, shadowO: 24, finger: "#141414"
  },
  // the notebook (Sketchbook round 2): indigo ink a touch thinner, airy pencil colours on the white sheet, faint shadows
  sketch: {
    name: "sketch", ink: "#2e3266", w: 1.6, road: "#efe3d3", roadEdge: "#2e3266", dash: "#fdfcf9", car: "#e3b46c", roof: "#efd09d", glass: "#5a5f93", lamp: "#fdfcf9",
    key: "#fdfcf9", keyOn: "#efd09d", lip: "#2e3266", blockA: "#bcd2e3", blockB: "#ecd3a6", blockC: "#e3b8ae", tree: "#adc39a",
    pin: "#c77868", pinDot: "#fdfcf9", card: "#fdfcf9", cardPic: "#4b4f8f", cardMark: "#efd09d", bar: "#2e3266", barO: 38, btn: "#4b4f8f",
    cover: "#e3b46c", page: "#fdfcf9", picA: "#8db2cf", picB: "#d99486", sun: "#efd09d", hill: "#8fa877", mark: "#fdfcf9",
    cup: "#fdfcf9", band: "#e3b46c", coffee: "#8a6a55", crema: "#c9a27e", steam: "#5a5f93", steamO: 62, bubble: "#fdfcf9",
    shadow: "#2e3266", shadowO: 9, finger: "#2e3266"
  }
};

// the artboard: 80 x 80 around the step's 64 px circle (centre 40, 40), so a piece can pop a little out of it
const S = 80, CX = 40, CY = 40, R_IN = 30.6; // (the circle's inside: its 1 px border stays the page's)
const inCircle = () => [{ inv: false, mode: "a", pt: { a: 0, k: circlePath(CX, CY, R_IN) }, o: prop(100), x: prop(0), nm: "the circle" }];
const ink = (P, w = P.w, o = 100) => stroke(rgb(P.ink), w, o, { lc: 2, lj: 2 });
const solid = (hex, o = 100) => fill(rgb(hex), o);
const bar = (P, x, y, w, h = 2.2) => group("line", [rect([w, h], [x + w / 2, y], h / 2), solid(P.bar, P.barO)]);

/* ======================= drive: ↑ held, the road streams, ← and → change lanes ======================= */
// the yellow car from above, nose up, centred on 0,0 (the onboarding's, in the piece's palette)
function carTop(P, s) {
  return [
    group("roof", [rect([11 * s, 11 * s], [0, 2 * s], 3 * s), ink(P, 1.2), solid(P.roof)]),
    group("glass", [rect([13 * s, 5 * s], [0, -6 * s], 2 * s), solid(P.glass)]),
    group("lamps", [rect([3 * s, 2 * s], [-5 * s, -14 * s], 1), rect([3 * s, 2 * s], [5 * s, -14 * s], 1), solid(P.lamp)]),
    group("body", [rect([17 * s, 30 * s], [0, 0], 6 * s), ink(P), solid(P.car)]),
    group("wheels", [rect([3 * s, 7 * s], [-9 * s, -8 * s], 1.2), rect([3 * s, 7 * s], [9 * s, -8 * s], 1.2), rect([3 * s, 7 * s], [-9 * s, 9 * s], 1.2), rect([3 * s, 7 * s], [9 * s, 9 * s], 1.2), solid(P.ink)])
  ];
}
// the map's arrow, centred on cx, cy, k of its 18 px
const arrow = (dir, cx, cy, k) => {
  const A = [[0, -7.5], [6.5, -1], [2.5, -1], [2.5, 7.5], [-2.5, 7.5], [-2.5, -1], [-6.5, -1]], rot = ({ up: 0, right: 90, left: 270 }[dir] * Math.PI) / 180;
  return poly(A.map(([x, y]) => [cx + k * (x * Math.cos(rot) - y * Math.sin(rot)), cy + k * (x * Math.sin(rot) + y * Math.cos(rot))]));
};
// a keycap as on the map's pad: white, outlined, a lip under it; pressed = down on its lip, yellow
function key(P, { cx, cy, w = 13, h = 12, dir, press = [], held, born }) {
  const pk = [[0, [0, 0], E.hold]], fk = [[0, rgb(P.key), E.hold]];
  for (const [a, b] of press) { pk.push([a, [0, 0], [0.3, 0, 0.3, 1]], [a + 3, [0, 2], E.hold], [b, [0, 2], [0.3, 0, 0.3, 1]], [b + 4, [0, 0], E.hold]); fk.push([a, rgb(P.key), E.linear], [a + 2, rgb(P.keyOn), E.hold], [b, rgb(P.keyOn), E.linear], [b + 3, rgb(P.key), E.hold]); }
  if (held) { pk.push([held[0], [0, 0], [0.3, 0, 0.3, 1]], [held[0] + 3, [0, 2], E.hold], [held[1], [0, 2], [0.3, 0, 0.3, 1]], [held[1] + 4, [0, 0], E.hold]); fk.push([held[0], rgb(P.key), E.linear], [held[0] + 2, rgb(P.keyOn), E.hold], [held[1], rgb(P.keyOn), E.linear], [held[1] + 3, rgb(P.key), E.hold]); }
  const one = (k) => { const c = clean(k); return c.length > 1 ? c : c[0][1]; };
  return group("key " + dir, [
    group("cap", [group("arrow", [path(arrow(dir, cx, cy, 0.5)), solid(P.ink)]), rect([w, h], [cx, cy], 3.2), ink(P, 1.5), fill(one(fk))], { p: one(pk) }),
    group("lip", [rect([w, h], [cx, cy + 2.2], 3.2), ink(P, 1.5), solid(P.lip)])
  ], { a: [cx, cy + 6], p: [cx, cy + 6], s: [[born, [0, 0], SPRING], [born + 14, [100, 100]]], o: [[0, 0, E.hold], [born, 100]] });
}
export function buildWDrive(T, P) {
  const IN = 24, ACT = 150, END = IN + ACT;
  const Cm = new Comp({ w: S, h: S, dur: END / L, nm: `Cromatic · welcome · drive · ${P.name}` });
  Cm.marker("in", 0, IN); Cm.marker("act", IN, END);
  // the act: ↑ from IN+4 (the stream speeds up, cruises, slows down: 48 px, four dashes, two blocks: it ends as it began)
  const tUp = IN + 4, tL = IN + 34, tR = IN + 74, tOff = IN + 120;
  const v = 48 / (20 / 2 + 96 + 24 / 2), d1 = (v * 20) / 2, d2 = v * 96;
  const flow = [[0, [0, 0], E.hold], [tUp + 2, [0, 0], ACC], [tUp + 22, [0, d1], E.linear], [tUp + 118, [0, d1 + d2], DEC], [tUp + 142, [0, 48]]];
  // lanes: the right one (x 47), the left one (x 33): ← moves over, → moves back
  const xR = 47, xL = 33, carY = 31;
  const lane = (t0, from, to, turn) => [[t0, [from, carY], [0.45, 0, 0.3, 1]], [t0 + 22, [to, carY]]];
  const carP = [[0, [xR, carY], E.hold], ...lane(tL + 2, xR, xL), ...lane(tR + 2, xL, xR)];
  const steer = (t0, sgn) => [[t0, 0, [0.3, 0, 0.4, 1]], [t0 + 8, 15 * sgn, [0.45, 0, 0.4, 1]], [t0 + 18, -5 * sgn, [0.4, 0, 0.4, 1]], [t0 + 26, 0, E.hold]];
  const carR = [[0, 0, E.hold], ...steer(tL + 1, -1), ...steer(tR + 1, 1)];
  const carS = [[0, [0, 0], SPRING], [14, [100, 100], E.hold]];
  // the keys, under the car: ← ↑ → (they rise in one after another as the card opens)
  const ky = 59;
  Cm.shape("keys", [
    key(P, { cx: CX - 15, cy: ky, dir: "left", press: [[tL, tL + 16]], born: 4 }),
    key(P, { cx: CX, cy: ky, dir: "up", held: [tUp, tOff], born: 7 }),
    key(P, { cx: CX + 15, cy: ky, dir: "right", press: [[tR, tR + 16]], born: 10 })
  ]);
  const M = inCircle();
  // (a mask is in its layer's own space: the car moves inside its layer, as a group, so the circle stays put)
  Cm.shape("car", [group("car", carTop(P, 0.7), { p: clean(carP), r: clean(carR), s: carS })], { masks: M });
  Cm.shape("car · shadow", [group("shadow", [rect([13, 22], [0, 0], 5), solid(P.shadow, P.shadowO)], { p: clean(carP.map(([t, v2, e]) => [t, [v2[0] + 1.5, v2[1] + 2.5], e])), r: clean(carR), s: carS })], { masks: M });
  // the road (a lane each way), its dashes and what stands beside it, all moving with the stream
  const dashes = []; for (let k = 0; k < 11; k++) dashes.push(rect([1.8, 6], [CX, -36 + 12 * k], 0.9));
  Cm.shape("road · dashes", [group("dashes", [...dashes, solid(P.dash)], { p: clean(flow) })], { masks: M });
  const side = (x0, phase) => { const g = []; for (let k = 0; k < 6; k++) { const y = -64 + 24 * k + phase; g.push(group("block " + k, [rect([15, 13], [x0, y], 2.5), ink(P, 1.4), solid(k % 2 ? P.blockB : P.blockA)])); g.push(group("tree " + k, [ellipse([8, 8], [x0 + (x0 < CX ? 4 : -4), y + 12]), ink(P, 1.2), solid(P.tree)])); } return g; };
  Cm.shape("beside the road", [group("beside", [...side(13, 0), ...side(67, 12)], { p: clean(flow) })], { masks: M });
  Cm.shape("road", [group("edges", [path(poly([[26, -4], [26, 84]], false)), path(poly([[54, -4], [54, 84]], false)), ink(P, 1.5)]), group("asphalt", [rect([28, 90], [CX, CY], 0), solid(P.road)])], { masks: M });
  const json = Cm.json();
  json.cromatic = { piece: "welcome-drive", theme: P.name, still: tL + 12, in: [0, IN], act: [IN, END] };
  return json;
}

/* ======================= tap: a pin lands, a tap, the place's card pops out of it ======================= */
// a map pin: a round head of radius r at (cx, cy), its point 1.75 r under it
function pinPath(cx, cy, r) {
  const k = 0.5523 * r;
  return { c: true, v: [[cx, cy - r], [cx + r, cy], [cx, cy + 1.75 * r], [cx - r, cy]], i: [[-k, 0], [0, -k], [r * 0.32, -r * 0.5], [0, k]], o: [[k, 0], [0, r * 0.7], [-r * 0.32, -r * 0.5], [0, -k]] };
}
export function buildWTap(T, P) {
  const IN = 22, ACT = 150, END = IN + ACT;
  const Cm = new Comp({ w: S, h: S, dur: END / L, nm: `Cromatic · welcome · tap a place · ${P.name}` });
  Cm.marker("in", 0, IN); Cm.marker("act", IN, END);
  const hx = 47, hy = 37, r = 8, tip = [hx, hy + 1.75 * r];
  const tTap = IN + 16, tCard = IN + 22, tBack = IN + 112;
  // the card: as on the map, its picture, two lines, the way in; out of the pin's head, back into it
  const cc = [37, 15], cw = 40, ch = 26, top = cc[1] - ch / 2;
  const cardKs = { a: [hx, hy - r], p: [hx, hy - r], s: [[tCard, [16, 16], LAND], [tCard + 20, [100, 100], E.hold], [tBack, [100, 100], [0.55, 0, 0.85, 0.35]], [tBack + 12, [12, 12]]], r: [[tCard, -14, LAND], [tCard + 20, 0]], o: [[0, 0, E.hold], [tCard, 0, E.linear], [tCard + 3, 100, E.hold], [tBack + 9, 100, E.linear], [tBack + 12, 0]] };
  Cm.shape("card", [group("card", [
    group("button", [rect([12, 4.6], [cc[0] + cw / 2 - 10, top + 21], 2.3), solid(P.btn)]),
    bar(P, cc[0] - cw / 2 + 4, top + 15.5, 20), bar(P, cc[0] - cw / 2 + 4, top + 20.5, 12),
    group("cup", [path(poly([[cc[0] - 3, top + 3], [cc[0] + 3, top + 3], [cc[0] + 2.3, top + 8], [cc[0] - 2.3, top + 8]])), solid(P.cardMark)]),
    group("picture", [rect([cw - 3, 9.5], [cc[0], top + 6.2], 2), solid(P.cardPic)]),
    group("tail", [path(poly([[hx - 4, top + ch - 0.8], [hx + 0.5, top + ch + 3.5], [hx + 3, top + ch - 0.8]])), ink(P, 1.4), solid(P.card)]),
    group("body", [rect([cw, ch], cc, 5), ink(P, 1.6), solid(P.card)])
  ], cardKs)], { ip: tCard, op: tBack + 13 });
  Cm.shape("card · shadow", softShadow([cw, ch], [cc[0] + 1.5, cc[1] + 3], 5, 0.35), { ip: tCard, op: tBack + 13, ks: { a: [hx, hy - r], p: [hx, hy - r], s: cardKs.s, o: [[tCard, 0, E.linear], [tCard + 10, P.name === "sketch" ? 30 : 80, E.hold], [tBack, P.name === "sketch" ? 30 : 80, E.linear], [tBack + 10, 0]] } });
  // the tap: a fingertip on the head, a ring out of it
  Cm.shape("tap", [
    group("ring", [ellipse([16, 16], [hx, hy]), stroke(rgb(P.ink), 1.6, [[tTap, 85, E.linear], [tTap + 18, 0]])], { a: [hx, hy], p: [hx, hy], s: [[tTap, [60, 60], E.out], [tTap + 18, [250, 250]]] }),
    group("finger", [ellipse([18, 18], [hx + 2, hy + 3]), fill(rgb(P.finger), [[tTap - 8, 0, E.linear], [tTap - 2, 15, E.hold], [tTap + 6, 15, E.linear], [tTap + 14, 0]])])
  ], { ip: tTap - 8, op: tTap + 19 });
  // the pin: lands (in), squashes under the tap, and once more as the card goes back into it
  const squash = (t0, k = 1) => [[t0, [100, 100], E.out], [t0 + 3, [100 + 14 * k, 100 - 14 * k], [0.3, 1.3, 0.5, 1]], [t0 + 12, [100, 100], E.hold]];
  const pinS = clean([[0, [100, 100], E.hold], [10, [100, 100], E.out], [12, [118, 82], [0.3, 1.4, 0.5, 1]], [20, [100, 100], E.hold], ...squash(tTap), ...squash(tBack + 8, 0.6)]);
  const pinP = [[0, [tip[0], tip[1] - 30], [0.5, 0, 0.9, 0.55]], [10, tip, E.hold]];
  Cm.shape("pin", [group("pin", [
    group("dot", [ellipse([6.4, 6.4], [hx, hy]), ink(P, 1.3), solid(P.pinDot)]),
    group("head", [path(pinPath(hx, hy, r)), ink(P), solid(P.pin)])
  ], { a: tip, p: pinP, s: pinS })], { ks: { o: [[0, 0, E.hold], [1, 100]] } });
  Cm.shape("pin · shadow", [group("shadow", [ellipse([11, 3.6], [tip[0] + 1.5, tip[1] + 0.5]), solid(P.shadow, P.shadowO + 8)], { a: tip, p: tip, s: [[0, [20, 20], E.hold], [2, [20, 20], [0.5, 0, 0.9, 0.55]], [10, [100, 100]]] })]);
  // the city in the circle: two streets and their blocks
  const M = inCircle();
  Cm.shape("blocks", [
    group("tree a", [ellipse([10, 10], [63, 30]), ink(P, 1.3), solid(P.tree)]),
    group("tree b", [ellipse([8, 8], [30, 30]), ink(P, 1.3), solid(P.tree)]),
    group("block a", [rect([17, 13], [42, 69.5], 2.5), ink(P, 1.4), solid(P.blockA)]),
    group("block b", [rect([17, 13], [62, 69.5], 2.5), ink(P, 1.4), solid(P.blockB)]),
    group("block c", [rect([12, 18], [8, 38], 2.5), ink(P, 1.4), solid(P.blockC)])
  ], { masks: M });
  const roads = () => [path(poly([[-2, 56], [82, 56]], false)), path(poly([[21, -2], [21, 82]], false))];
  Cm.shape("streets", [group("dashes", [...roads(), stroke(rgb(P.dash), 1.2, 100, { lc: 1, lj: 1, d: [3.5, 4] })]), group("asphalt", [...roads(), stroke(rgb(P.road), 9, 100, { lc: 1, lj: 1 })]), group("edges", [...roads(), stroke(rgb(P.ink), 11.6, 100, { lc: 1, lj: 1 })])], { masks: M });
  const json = Cm.json();
  json.cromatic = { piece: "welcome-tap", theme: P.name, still: tCard + 40, in: [0, IN], act: [IN, END] };
  return json;
}

/* ======================= work: the portfolio opens, its pages turn ======================= */
// a two-page spread under a yellow cover; a page turns about the spine (its x scale from 100 to -100), its back drawn
// mirrored so it reads the right way once it lies on the left. Project A (blue, a sun over a hill) and B (coral, a ring)
export function buildWWork(T, P) {
  const IN = 30, ACT = 120, END = IN + ACT;
  const Cm = new Comp({ w: S, h: S, dur: END / L, nm: `Cromatic · welcome · the work · ${P.name}` });
  Cm.marker("in", 0, IN); Cm.marker("act", IN, END);
  const sp = CX, by = 42, pw = 22, ph = 29, lx = sp - pw / 2 - 0.5, rx = sp + pw / 2 + 0.5; // the pages' centres
  const book = Cm.nul("book", { ks: { a: [CX, by], p: [CX, by], r: -4, s: [[0, [40, 40], SPRING], [12, [100, 100]]] } });
  // a page's contents at its centre x (m = -1: mirrored, for the back of a turning page)
  const picA = (x, m = 1) => [
    group("sun", [ellipse([4.6, 4.6], [x + 3.6 * m, by - 9.6]), solid(P.sun)]),
    group("hill", [path(poly([[x - 8, by - 2.5], [x - 2.5, by - 7.5], [x + 1.5, by - 4.5], [x + 4, by - 6.5], [x + 8, by - 2.5]].map(([px, py]) => [x + (px - x) * m, py]))), solid(P.hill)]),
    group("picture", [rect([16, 11], [x, by - 8], 1.5), ink(P, 1.2), solid(P.picA)])
  ];
  const picB = (x, m = 1) => [
    group("ring", [ellipse([6.5, 6.5], [x - 2 * m, by - 8]), stroke(rgb(P.mark), 1.8)]),
    group("dot", [ellipse([2.6, 2.6], [x + 4.5 * m, by - 10.5]), solid(P.mark)]),
    group("picture", [rect([16, 11], [x, by - 8], 1.5), ink(P, 1.2), solid(P.picB)])
  ];
  const caption = (x, m = 1) => [[15, 3.5], [12, 7], [14, 10.5]].map(([w, dy]) => bar(P, m > 0 ? x - 8 : x + 8 - w, by + dy, w, 1.9));
  const text = (x, m = 1) => [group("title", [rect([12, 2.6], [m > 0 ? x - 8 + 6 : x + 8 - 6, by - 10], 1.3), solid(P.bar, 70)]), ...[[15, -5], [13, -1.5], [15, 2], [10, 5.5], [14, 9]].map(([w, dy]) => bar(P, m > 0 ? x - 8 : x + 8 - w, by + dy, w, 1.9))];
  const page = (x) => group("page", [rect([pw, ph], [x, by], 2), ink(P, 1.4), solid(P.page)]);
  // a turning page: front (text) on the right; its back (a project) mirrored; it turns between t0 and t0 + 18
  const turn = (nm, t0, front, back, { ip, op } = {}) => {
    const mid = t0 + 9;
    Cm.shape(nm, [group("leaf", [
      group("back", [...back, page(rx)], { o: [[0, 0, E.hold], [mid, 100]] }),
      group("front", [...front, page(rx)], { o: [[0, 100, E.hold], [mid, 0]] })
    ], { a: [sp, by], p: [[t0, [sp, by], [0.45, 0, 0.55, 1]], [mid, [sp, by - 2.2], [0.45, 0, 0.55, 1]], [t0 + 18, [sp, by]]], s: [[t0, [100, 100], [0.5, 0, 0.4, 1]], [t0 + 18, [-100, 100]]] })], { parent: book, ip: ip ?? t0 - 1, op: op ?? t0 + 19 });
  };
  // the cover opens (in): its outside yellow with a white star, its inside the left page with project A
  const tO = 12;
  Cm.shape("cover", [group("leaf", [
    group("inside", [...caption(rx, -1), ...picA(rx, -1), page(rx)], { o: [[0, 0, E.hold], [tO + 9, 100]] }),
    group("outside", [
      group("star", [path(poly(Array.from({ length: 8 }, (_, i) => { const a = (Math.PI / 4) * i - Math.PI / 2, rr = i % 2 ? 1.7 : 5; return [rx + Math.cos(a) * rr, by - 2 + Math.sin(a) * rr]; }))), solid(P.mark)]),
      group("board", [rect([pw + 2, ph + 3], [rx + 1, by + 0.5], 2.5), ink(P, 1.5), solid(P.cover)])
    ], { o: [[0, 100, E.hold], [tO + 9, 0]] })
  ], { a: [sp, by], p: [[tO, [sp, by], [0.45, 0, 0.55, 1]], [tO + 9, [sp, by - 2.5], [0.45, 0, 0.55, 1]], [tO + 18, [sp, by]]], s: [[tO, [100, 100], [0.5, 0, 0.4, 1]], [tO + 18, [-100, 100]]] })], { parent: book, op: tO + 19 });
  // the pages turn (act): A -> B -> A; as one lands the spread under it takes its picture (the same frame: no seam)
  const t1 = IN + 12, t2 = IN + 62;
  turn("page · to B", t1, text(rx), [...caption(rx, -1), ...picB(rx, -1)]);
  turn("page · to A", t2, text(rx), [...caption(rx, -1), ...picA(rx, -1)]);
  // the spread: the left page (A, then B, then A again), the right page's text, the spine, the back of the cover
  const showA = [[0, 0, E.hold], [tO + 18, 100, E.hold], [t1 + 18, 0, E.hold], [t2 + 18, 100]], showB = [[0, 0, E.hold], [t1 + 18, 100, E.hold], [t2 + 18, 0]];
  Cm.shape("spread", [
    group("left · A", [...caption(lx), ...picA(lx)], { o: showA }),
    group("left · B", [...caption(lx), ...picB(lx)], { o: showB }),
    group("left page", [page(lx)], { o: [[0, 0, E.hold], [tO + 9, 100]] }),
    group("right", [...text(rx), page(rx)]),
    group("spine", [path(poly([[sp, by - ph / 2 + 1], [sp, by + ph / 2 + 1]], false)), ink(P, 1.4)]),
    group("boards", [rect([[0, [pw + 2, ph + 3], E.hold], [tO, [pw + 2, ph + 3], [0.45, 0, 0.3, 1]], [tO + 18, [2 * pw + 5, ph + 3]]], [[0, [rx + 1, by + 1.5], E.hold], [tO, [rx + 1, by + 1.5], [0.45, 0, 0.3, 1]], [tO + 18, [sp, by + 1.5]]], 2.5), ink(P, 1.5), solid(P.cover)])
  ], { parent: book });
  Cm.shape("book · shadow", [group("shadow", [rect([[0, [pw + 4, ph + 4], E.hold], [tO, [pw + 4, ph + 4], [0.45, 0, 0.3, 1]], [tO + 18, [2 * pw + 7, ph + 4]]], [[0, [rx + 2.5, by + 4], E.hold], [tO, [rx + 2.5, by + 4], [0.45, 0, 0.3, 1]], [tO + 18, [sp + 1.5, by + 4]]], 4), solid(P.shadow, P.shadowO)])], { parent: book });
  const json = Cm.json();
  json.cromatic = { piece: "welcome-work", theme: P.name, still: t1 + 7, in: [0, IN], act: [IN, END] };
  return json;
}

/* ======================= hi: the cup hops, its steam rises into a "hi!" ======================= */
export function buildWHi(T, P) {
  const IN = 22, ACT = 140, END = IN + ACT;
  const Cm = new Comp({ w: S, h: S, dur: END / L, nm: `Cromatic · welcome · say hi · ${P.name}` });
  Cm.marker("in", 0, IN); Cm.marker("act", IN, END);
  const tHop = IN + 6, tB = IN + 18, tBout = IN + 96;
  // the bubble: a pill with a tail down to the steam, "hi!" in it; it pops (a spring, a little turn) and pops away
  const bc = [57, 19], bw = 27, bh = 17, sz = 11, hw = line(T, "hi!", sz, P.ink, 0, 0, { tracking: -0.01 }).width;
  const tailTip = [45, 31];
  Cm.shape("bubble", [group("bubble", [
    group("hi!", line(T, "hi!", sz, P.ink, bc[0] - hw / 2, bc[1] + capH(T, sz) / 2, { tracking: -0.01 }).groups),
    group("body", [rect([bw, bh], bc, bh / 2), ink(P, 1.6), solid(P.bubble)]),
    group("tail", [path(poly([[bc[0] - 8, bc[1] + 3], tailTip, [bc[0] - 2, bc[1] + 6.5]])), ink(P, 1.6), solid(P.bubble)])
  ], { a: tailTip, p: tailTip, s: [[tB, [0, 0], LAND], [tB + 18, [100, 100], E.hold], [tBout, [100, 100], [0.55, 0, 0.85, 0.35]], [tBout + 10, [0, 0]]], r: [[tB, -18, LAND], [tB + 18, -3]] })], { ip: tB, op: tBout + 11 });
  Cm.shape("bubble · shadow", [group("shadow", [rect([bw, bh], [bc[0] + 1.5, bc[1] + 2.5], bh / 2), solid(P.shadow, P.shadowO)], { a: tailTip, p: tailTip, s: [[tB, [0, 0], LAND], [tB + 18, [100, 100], E.hold], [tBout, [100, 100], [0.55, 0, 0.85, 0.35]], [tBout + 10, [0, 0]]], r: [[tB, -18, LAND], [tB + 18, -3]] })], { ip: tB, op: tBout + 11 });
  // the steam: two wisps; idle, a short stroke; the act sends them up and out of the cup and brings new ones up
  const wisp = (x0, d) => ({ c: false, v: [[x0, 34], [x0 + 3 * d, 26], [x0 - 1 * d, 17]], i: [[0, 0], [0, 3.5], [2.5 * d, 3]], o: [[-3 * d, -3], [0, -3.5], [0, 0]] });
  const steam = (x0, d, dt) => group("wisp", [path(wisp(x0, d)),
    trim([[0, 0, E.hold], [8 + dt, 0, E.out], [22, 12], ...[[tHop + 4 + dt, 12, [0.4, 0, 0.6, 1]], [tB + 10 + dt, 100, E.hold], [tB + 11 + dt, 0, E.hold], [tBout + 10 + dt, 0, E.out], [tBout + 30 + dt, 12]]], [[0, 0, E.hold], [8 + dt, 0, E.out], [22, 72], ...[[tHop + 4 + dt, 72, [0.4, 0, 0.6, 1]], [tB + 4 + dt, 100, E.hold], [tB + 11 + dt, 0, E.hold], [tBout + 6 + dt, 0, E.out], [tBout + 26 + dt, 72]]], 0),
    stroke(rgb(P.steam), 1.9, P.steamO, { lc: 2, lj: 2 })]);
  Cm.shape("steam", [steam(32, 1, 0), steam(40, -1, 3)]);
  // the cup: rises in on its saucer (in), hops (act)
  const cupA = [36, 58];
  const cup = Cm.nul("cup", { ks: { a: cupA, p: [[0, [cupA[0], cupA[1] + 20], [0.2, 1.2, 0.4, 1]], [16, cupA, E.hold], [tHop, cupA, [0.3, 0, 0.6, 1]], [tHop + 7, [cupA[0], cupA[1] - 3.5], [0.3, 0, 0.5, 1]], [tHop + 15, cupA]], s: [[0, [100, 100], E.hold], [tHop, [100, 100], E.out], [tHop + 3, [107, 92], [0.3, 0, 0.5, 1]], [tHop + 8, [96, 105], [0.3, 0, 0.5, 1]], [tHop + 15, [104, 96], E.out], [tHop + 20, [100, 100]]] } });
  const body = { c: true, v: [[24, 38], [48, 38], [43.5, 57], [28.5, 57]], i: [[0, 9], [0, 0], [3, -2], [0, 0]], o: [[0, 0], [0, 9], [0, 0], [-3, -2]] };
  Cm.shape("cup · body", [
    group("rim", [ellipse([24, 5], [36, 38]), ink(P, 1.5), solid(P.coffee)]),
    group("crema", [ellipse([17, 2.6], [36, 38.6]), solid(P.crema)]),
    group("band", [path(poly([[24.9, 44], [47.1, 44], [46.1, 49.5], [25.9, 49.5]])), ink(P, 1.3), solid(P.band)]),
    group("body", [path(body), ink(P), solid(P.cup)]),
    group("handle", [ellipse([10, 10], [48.5, 46]), stroke(rgb(P.cup), 1.8), ellipse([10, 10], [48.5, 46]), stroke(rgb(P.ink), 4.4)])
  ], { parent: cup, ks: { o: [[0, 0, E.linear], [6, 100]] } });
  Cm.shape("saucer", [group("saucer", [ellipse([36, 7.5], [36, 58]), ink(P, 1.6), solid(P.cup)])], { parent: cup, ks: { o: [[0, 0, E.linear], [6, 100]] } });
  Cm.shape("cup · shadow", [group("shadow", [ellipse([36, 7.5], [37.5, 60.5]), solid(P.shadow, P.shadowO)])], { ks: { o: [[0, 0, E.hold], [6, 0, E.linear], [16, 100]] } });
  const json = Cm.json();
  json.cromatic = { piece: "welcome-hi", theme: P.name, still: tB + 40, in: [0, IN], act: [IN, END] };
  return json;
}

/* ======================= the opening: the intro's pill stretches into the card ======================= */
// Written for a reference card (W0 x H0, its corner R0) and the reference pill (PW x PH); welcome.js maps every
// rectangle's size, corner and centre onto the real card and the intro's real pill (its size on this screen) before it
// plays (cromatic.fit says how). The ring: the intro's rainbow, its colours turning; it gives way to the card's 1 px ink
// line; the card's hard shadow (0 5px 0) and its soft one (0 30px 60px -20px) come with it.
const RAINBOW = ["#FED012", "#28C840", "#119BFE", "#B098C8", "#F65342", "#FED012"];
const rainbowAt = (u) => { const n = RAINBOW.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x)), f = x - i; const a = parseInt(RAINBOW[i].slice(1), 16), b = parseInt(RAINBOW[i + 1].slice(1), 16); return "#" + [16, 8, 0].map((s) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f).toString(16).padStart(2, "0")).join(""); };
export function buildWOpen() {
  const W0 = 560, H0 = 560, R0 = 26, PW = 300, PH = 112, PAD = 72, END = 34;
  const Cm = new Comp({ w: W0 + 2 * PAD, h: H0 + 2 * PAD, dur: END / L, nm: "Cromatic · welcome · the opening (the pill into the card)" });
  Cm.marker("open", 0, END);
  const c = [PAD + W0 / 2, PAD + H0 / 2];
  // the size: the pill pops in (0-9), breathes, and stretches into the card with the house spring (11-31)
  const t1 = 11, t2 = 31;
  const sz = (dw = 0, dh = dw) => [[0, [PW * 0.5 + dw, PH * 0.5 + dh], SPRING], [9, [PW + dw, PH + dh], E.hold], [t1, [PW + dw, PH + dh], [0.32, 1.22, 0.42, 1]], [t2, [W0 + dw, H0 + dh]]];
  // (the corner: as big as the pill's height until it stretches, so the rectangle stays a stadium; lottie clamps it)
  const rr = (d = 0) => [[0, PH + d, E.hold], [t1, PH + d, [0.32, 1.22, 0.42, 1]], [t2, R0 + d]];
  // a rectangle whose size, corner and centre all follow the card (dw, dh, dr: a shadow's spread; off: its offset)
  const box = (dw = 0, dh = dw, dr = 0, off = [0, 0]) => ({ ty: "rc", d: 1, s: prop(sz(dw, dh)), p: prop([c[0] + off[0], c[1] + off[1]]), r: prop(rr(dr)) });
  const NR = 24, ringW = 4.6;
  const turnK = [[0, 0, E.linear], [END, 150]];
  const ringO = [[0, 100, E.hold], [t1 + 9, 100, E.linear], [t2 - 4, 0]];
  Cm.shape("ring", [...Array.from({ length: NR }, (_, i) => group("ring " + i, [box(), trim((i * 100) / NR, Math.min(100, ((i + 1) * 100) / NR + 0.9), turnK), stroke(rgb(rainbowAt((i + 0.5) / NR)), ringW, ringO, { lc: 1, lj: 1 })])),
    group("ring underlay", [box(), stroke(rgb(RAINBOW[0]), ringW * 0.98, ringO, { lc: 1, lj: 1 })])]);
  Cm.shape("card", [
    group("ink", [box(), stroke(rgb("#141414"), 1.2, [[0, 0, E.hold], [t1 + 6, 0, E.linear], [t2 - 6, 100]], { lc: 1, lj: 1 })]),
    group("paper", [box(), fill([[0, rgb("#FFFFFF"), E.hold], [t1, rgb("#FFFFFF"), E.linear], [t2 - 6, rgb("#fbf7f2")]])])
  ], { ks: { o: [[0, 0, E.linear], [3, 100]] } });
  // the card's hard shadow (5 px down, ink) comes down under it as it opens
  Cm.shape("hard shadow", [group("hard", [box(0, 0, 0, [0, 5]), fill(rgb("#141414"), [[0, 0, E.hold], [t1 + 4, 0, E.linear], [t2 - 4, 100]])])]);
  // the pill's soft stacked shadow (the intro's), giving way to the card's long soft one
  const SPREAD = [2, 5, 9, 14, 20, 27], SHA = [6, 5.2, 4.4, 3.4, 2.4, 1.6];
  Cm.shape("pill shadow", SPREAD.map((sp, n) => group("pill shadow " + n, [box(2 * sp, 2 * sp, sp, [4, 7]), fill(rgb(SHADOW), SHA[n])])), { ks: { o: [[0, 0, E.linear], [6, 100, E.hold], [t1 + 4, 100, E.linear], [t2 - 8, 0]] } });
  const LONG = [4, 10, 18, 28, 40, 54], LSHA = [5.5, 5, 4.4, 3.6, 2.6, 1.6];
  Cm.shape("card shadow", LONG.map((sp, n) => group("card shadow " + n, [box(2 * sp - 40, 2 * sp - 40, sp, [0, 30]), fill(rgb("#28142a"), LSHA[n])])), { ks: { o: [[0, 0, E.hold], [t1 + 6, 0, E.linear], [t2, 100]] } });
  const json = Cm.json();
  json.cromatic = { piece: "welcome-open", fit: { W: W0, H: H0, R: R0, PW, PH, PAD }, open: [0, END] };
  return json;
}
