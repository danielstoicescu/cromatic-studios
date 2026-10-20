// 3 · The pill transitions (Daniel, Lottie across the site: piece 3): the intro's window, wherever the map hands over to
// a page and back. One piece, two halves:
//   close  · the studio's paper comes in from past every edge and leaves a pill window in the middle onto what is
//            there (the map, or a page); the Multiverse's rainbow ring round it; at the end the pill fills with white
//   open   · the white dissolves onto what is there now (the page, or the map) and the window grows past every edge
// The host swaps what is under it while the pill is white (src/lottie-ui/pill.js). The paper is a hole made with an
// inverted mask (its path runs the other way round from the comp's rectangle: the worker's canvas renderer has no
// subtract mode, the intro's r226 lesson); the pill's shadow stays on the paper round the hole.
import { Comp, group, rect, fill, stroke, trim, rgb, E, prop, roundRect, pathProp, C, softShadow, shOff, shO, sheen, reversePath, gfill } from "../lib/ui.mjs";

const RAINBOW = ["#FED012", "#28C840", "#119BFE", "#B098C8", "#F65342", "#FED012"];
const rainbowAt = (u) => { const n = RAINBOW.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x)), f = x - i; const a = parseInt(RAINBOW[i].slice(1), 16), b = parseInt(RAINBOW[i + 1].slice(1), 16); return "#" + [16, 8, 0].map((s) => Math.round((((a >> s) & 255) * (1 - f)) + (((b >> s) & 255) * f)).toString(16).padStart(2, "0")).join(""); };
export const WINDOW_AB = { desktop: { name: "desktop", w: 1440, h: 900, U: 1, pill: [340, 122], ring: 5 }, phone: { name: "phone", w: 390, h: 844, U: 0.55, pill: [244, 88], ring: 3.4 } };
// frames: close 0-22 (white from 16), open 22-58 (the white goes by 34, the window past the edges by 58)
export const WT = { C0: 0, C1: 22, WHITE: 16, O1: 58, DIS: 12 };
export function buildWindow(T, ab) {
  const W = ab.w, H = ab.h, U = ab.U, [pw, ph] = ab.pill, ringW = ab.ring, cx = W / 2, cy = H / 2;
  const Cm = new Comp({ w: W, h: H, dur: WT.O1 / 60 + 0.02, nm: `Cromatic · the pill transition · ${ab.name}` });
  Cm.marker("close", WT.C0, WT.C1); Cm.marker("open", WT.C1, WT.O1);
  // the window's size: from past every corner (wider than tall to the end: the stadium never turns) to the pill, a
  // squash as it lands, a breath, then out past every corner again
  const big = [Math.max(W, H) * 2.6, Math.max(W, H) * 2.5];
  const tO = WT.C1 + WT.DIS;
  const sizeK = [
    [WT.C0, big, [0.3, 0, 0.12, 1]], [WT.C1 - 4, [pw * 1.04, ph * 0.94], [0.3, 0, 0.5, 1]], [WT.C1, [pw, ph], E.hold],
    [tO - 4, [pw, ph], [0.45, 0, 0.6, 1]], [tO, [pw * 0.95, ph * 0.95], [0.72, 0, 0.18, 1]], [WT.O1 - 1, big]
  ];
  const hole = (k = 1) => sizeK.map(([t, s, e]) => [t, reversePath(roundRect(cx, cy, s[0] * k, s[1] * k, (s[1] * k) / 2)), e]);
  // the white body of the pill: comes in as the paper lands, goes as the window starts to open
  const bodyO = [[0, 0, E.hold], [WT.WHITE, 0, [0.4, 0, 0.6, 1]], [WT.C1, 100, E.hold], [WT.C1 + 2, 100, [0.45, 0, 0.35, 1]], [tO, 0]];
  Cm.shape("pill · body", [group("body", [...sheen(() => rect(sizeK, [cx, cy], 9999), pw, ph, cx, cy, { light: 0.35, shade: 0.06 }), rect(sizeK, [cx, cy], 9999), fill(rgb(C.white))], { o: bodyO })]);
  // the ring: the Multiverse's rainbow, turning, the width of the window's edge
  const NR = 40, off = [[0, 0, E.linear], [WT.O1, 140]];
  const ringO = [[0, 0, E.linear], [6, 100, E.hold], [WT.O1 - 14, 100, E.linear], [WT.O1 - 4, 0]];
  Cm.shape("pill · ring", [
    ...Array.from({ length: NR }, (_, i) => group("ring " + i, [rect(sizeK, [cx, cy], 9999), trim((i * 100) / NR, Math.min(100, ((i + 1) * 100) / NR + 0.9), off), stroke(rgb(rainbowAt((i + 0.5) / NR)), ringW, 100, { lc: 1, lj: 1 })])),
    group("ring underlay", [rect(sizeK, [cx, cy], 9999), stroke(rgb(RAINBOW[0]), ringW * 0.98, 100, { lc: 1, lj: 1 })])
  ], { ks: { o: ringO } });
  // its shadow on the paper round the hole (cut out of it by the window itself, drawn back by the shadow's offset)
  const so = shOff(1.2, U);
  Cm.shape("pill · shadow", softShadow([pw, ph], [cx, cy], 9999, U).map((g, n) => g), {
    ks: { p: [so[0], so[1]], o: ringO },
    masks: [{ inv: true, mode: "a", pt: pathProp(hole(1).map(([t, q, e]) => [t, { ...q, v: q.v.map(([x, y]) => [x - so[0], y - so[1]]) }, e])), o: prop(100), x: prop(0), nm: "window" }]
  });
  // NB the shadow above is drawn at the pill's rest size: it is the landing's contact shadow, faded with the ring
  // the paper: the studio's ground, its key light, the window cut through both
  const win = () => [{ inv: true, mode: "a", pt: pathProp(hole(1)), o: prop(100), x: prop(0), nm: "window" }];
  Cm.shape("paper · key light", [
    group("light", [rect([W * 1.2, H * 1.2], [cx, cy]), gfill({ type: 2, s: [W * 0.12, -H * 0.05], e: [W * 0.95, H * 0.85], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, 0.5], [0.55, 0.1], [1, 0]] })])
  ], { masks: win() });
  Cm.shape("paper", [group("paper", [rect([W + 8, H + 8], [cx, cy]), fill(rgb(C.paper))])], { masks: win() });
  const json = Cm.json();
  json.cromatic = { piece: "window", markers: { close: [WT.C0, WT.C1], open: [WT.C1, WT.O1] } };
  return json;
}
