// Cromatic opening · the shared kit: brand tokens, the artboards, text that enters and leaves in the house motion,
// the pill (with its word changing in place, like a slot), the grid paper ground.
import { group, rect, fill, stroke, rgb, prop, E, tr, poly, path, f } from "./lottie.mjs";
import { letterGroup, riseIn, block } from "./text.mjs";
import { setLine } from "./type.mjs";

// brand tokens (cromatic-visual-language, Part A), defined once
export const C = {
  yellow: "#FED012", blue: "#119BFE", green: "#28C840", coral: "#F65342", black: "#000000", paper: "#F2F2F2", bar: "#E7E7E7", white: "#FFFFFF", grid: "#DCDCDC",
  // the city, sampled from the map's first frame (Cromatic world)
  road: "#E0907E", ground: "#EEE7EC", lav: "#9C8CC6", lavTop: "#C3B6E2", rose: "#E59C97", roseTop: "#F4C9C2", peach: "#F0B48A", peachTop: "#F8D3B4", tree: "#3DBE5A", treeTop: "#5CD877",
  coffee: "#3A2218", crema: "#C68B59", cremaLight: "#E2B486"
};
// the nine worlds (src/app.js SCHEMES), each by the colour it is remembered by
export const WORLDS = [
  ["Cromatic", "#FED012"], ["Night Mode", "#121D3A"], ["Ghib.ly", "#6FBF73"], ["Sketchbook", "#FFFFFF"], ["Race Day", "#E10600"],
  ["Sakura", "#F08BB4"], ["Underwater", "#3DE0D0"], ["GTA 2", "#3A3F45"], ["Risograph", "#1D3F8F"]
];
// the worlds' grounds for the city direction: [ground, road, ink]; the last is the Cromatic world the map opens on
export const WORLD_GROUNDS = [
  ["#121D3A", "#3B4466", "#F7EEDF"], ["#E4F1F4", "#CDBB8E", "#243322"], ["#F6F3EC", "#D6D0C2", "#232326"], ["#E9EDF1", "#2B2F36", "#111418"],
  ["#FBEEF3", "#F2B8CC", "#3A1E2C"], ["#0B3B5C", "#1B5E7A", "#E8FBFF"], ["#1A1E22", "#3C4148", "#E8E6DF"], ["#F3EEE3", "#FF48B0", "#1D3F8F"], ["#EEE7EC", "#E0907E", "#000000"]
];

export const ARTBOARDS = {
  desktop: { name: "desktop", w: 1440, h: 900 },
  phone: { name: "phone", w: 390, h: 844 }
};

/* ---------- ground ---------- */
export function gridPaper(Cm, { pitch = 34, ip = 0, op, ks = {}, masks, nm = "ground · grid paper", parent, gridO = 100, bleed = 0 } = {}) {
  const lines = [], x0 = -bleed, y0 = -bleed, x1 = Cm.w + bleed, y1 = Cm.h + bleed;
  for (let x = pitch / 2 - Math.ceil(bleed / pitch) * pitch; x < x1; x += pitch) lines.push(path(poly([[x, y0], [x, y1]], false)));
  for (let y = pitch / 2 - Math.ceil(bleed / pitch) * pitch; y < y1; y += pitch) lines.push(path(poly([[x0, y], [x1, y]], false)));
  return Cm.shape(nm, [
    group("grid", [...lines, stroke(rgb(C.grid), 1, 100, { lc: 1, lj: 1 })], { o: gridO }),
    group("paper", [rect([Cm.w + 4 + 2 * bleed, Cm.h + 4 + 2 * bleed], [Cm.w / 2, Cm.h / 2]), fill(rgb(C.paper))])
  ], { ip, op: op ?? Cm.op, ks, masks, parent });
}

/* ---------- text ---------- */
export const layout = (T, lines, o) => block(T, lines, o);
export const lineWidth = (T, text, size, tracking = -0.035) => setLine(T, text, size, tracking).width;

// one layer of words: letters rise in word by word; words leave upward in a short cascade
export function wordsLayer(Cm, T, ws, { nm = "words", size, color = C.black, enterAt, exitAt, letterGap = 1.2, exitDur = 16, ip = 0, op, enterOpts = {}, exitDy = -0.3, colorOf, parent, ks, extraWord } = {}) {
  const groups = ws.map((w, i) => {
    const col = colorOf ? colorOf(i, w) : color;
    const t0 = enterAt(i, w);
    const ls = w.letters.map((L, j) => letterGroup(T, L, size, typeof col === "string" ? rgb(col) : col, { enter: riseIn(t0 + j * letterGap, size, enterOpts) }));
    const base = [w.lx, w.by];
    const te = exitAt ? exitAt(i, w) : null;
    let t = te == null ? { p: base } : { p: [[te, base, E.in], [te + exitDur, [base[0], base[1] + exitDy * size]]], o: [[te, 100, E.linear], [te + exitDur, 0]] };
    if (extraWord) t = { ...t, ...(extraWord(i, w, base) || {}) };
    return { ty: "gr", nm: w.text, it: [...ls, tr(t)] };
  });
  return Cm.shape(nm, groups, { ip, op: op ?? Cm.op, parent, ks });
}

/* ---------- the pill ---------- */
// a pill around a word whose letters start at x and sit on baseline by
export const pillShift = (size) => 0.30 * size; // a pill word starts this far right of its slot (the pill's padding, less a hair)
export function pillGeom(size, x, by, textW) {
  const padX = 0.34 * size, h = 1.14 * size, w = textW + padX * 2;
  return { x, w, h, cx: x + w / 2, cy: by - 0.355 * size, padX, stroke: Math.max(2.5, 0.03 * size) };
}
// letters of a word that slides into a slot from below and out of it to the top, letter by letter
// ins/outs: frames (or null); returns letter groups positioned with the word's first letter at x0 on baseline by
export function slotWord(T, text, size, color, x0, by, { inAt = null, outAt = null, gap = 1.2, dur = 20, dist = 0.95, fadeIn = 10, outDur = 14 } = {}) {
  const L = setLine(T, text, size, -0.035);
  const groups = L.letters.map((l, j) => {
    const ti = inAt == null ? null : inAt + j * gap, to = outAt == null ? null : outAt + j * gap * 0.6;
    const extra = (base, s) => {
      const at0 = [base[0], base[1] + by], below = [base[0], base[1] + by + dist * size], above = [base[0], base[1] + by - dist * size];
      const p = [], o = [];
      if (ti != null) { p.push([ti, below, E.out], [ti + dur, at0, to != null ? E.in : undefined]); o.push([ti, 0, E.linear], [ti + fadeIn, 100]); }
      else { p.push([0, at0, E.in]); o.push([0, 100, E.linear]); }
      if (to != null) { p.push([to, at0, E.in], [to + outDur, above]); o.push([to + outDur - 6, 100, E.linear], [to + outDur, 0]); }
      const clean = (arr) => arr.filter((k, i) => !(i > 0 && k[0] === arr[i - 1][0]));
      return { p: clean(p), o: clean(o), s: [s, s] };
    };
    return letterGroup(T, { ...l, x: x0 + l.x }, size, rgb(color), { extra });
  });
  return { groups, width: L.width };
}

// the tokens of time: seconds to frames, for readable timelines in the directions
export const at = f;

/* ---------- pills as layers (used by C; A and B carry the same logic inline) ---------- */
import { roundRect, pathProp } from "./lottie.mjs";
const valAtK = (keys, t) => { let v = keys[0][1]; for (const k of keys) if (k[0] <= t) v = k[1]; return v; };
// a pill whose word changes in place: words = [[text, pillColour, ink, t]], the pill leaves at tOut
export function swapPill(Cm, T, { S, x0, by, words, tOut, SW = 2.5, nm = "pill" }) {
  const g = words.map(([w]) => pillGeom(S, x0 - 0.34 * S, by, slotWord(T, w, S, C.black, x0, by).width));
  const c2 = (q) => [q.cx, q.cy], s2 = (q, k = 1) => [q.w * k, q.h * k];
  const size = [[words[0][3], s2(g[0], 0.55), E.spring], [words[0][3] + 26, s2(g[0]), E.hold]];
  const pos = [[words[0][3], c2(g[0]), E.hold]];
  for (let k = 1; k < words.length; k++) { const t = words[k][3]; size.push([t - 2, s2(g[k - 1]), E.spring], [t + 22, s2(g[k]), E.hold]); pos.push([t - 2, c2(g[k - 1]), E.spring], [t + 22, c2(g[k])]); }
  size.push([tOut, s2(g[g.length - 1]), E.in], [tOut + 14, s2(g[g.length - 1], 0.9)]);
  const col = words.map(([, fillC, , t], k) => [k ? t + 2 : t, rgb(fillC), k < words.length - 1 ? E.hold : undefined]);
  const slots = words.map(([w, , ink, t], k) => slotWord(T, w, S, ink, x0, by, { inAt: t + (k ? 4 : 8), outAt: k < words.length - 1 ? words[k + 1][3] - 2 : tOut + 1, dist: 0.62, outDur: 12 }));
  const maskKeys = size.map(([t, sz, e]) => { const c = valAtK(pos, t); return [t, roundRect(c[0], c[1], sz[0], sz[1], sz[1] / 2), e]; });
  const t0 = words[0][3];
  Cm.shape(`${nm} (words)`, slots.map((s, k) => group(words[k][0], s.groups)), { ip: t0, op: tOut + 22, masks: [{ inv: false, mode: "a", pt: pathProp(maskKeys), o: prop(100), x: prop(0), nm: "pill" }] });
  Cm.shape(nm, [group("pill", [rect(size, pos, 9999), stroke(rgb(C.black), SW), fill(col.length > 1 ? col : col[0][1])], { o: [[tOut, 100, E.linear], [tOut + 14, 0]] })], { ip: t0, op: tOut + 22 });
  return g;
}
