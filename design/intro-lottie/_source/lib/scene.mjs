// Cromatic opening, phase 3 · the A2 vocabulary as a kit for the cup concepts: the same type (lines rising from behind
// their baselines), the slot pill (its word and colour changing like a flip display), the flying dot, the depth system
// (elevation -> soft stacked shadows, the key light, the sheen), the Multiverse rainbow ring, the logo, the paper with
// its window. Copied from directions/A2.mjs (the live opening), so the concepts speak exactly its language.
import { Comp, group, rect, ellipse, fill, gfill, stroke, trim, rgb, E, prop, path, roundRect, pathProp } from "./lottie.mjs";
import { C, gridPaper, layout, pillGeom, pillShift, at } from "./kit.mjs";
import { letterGroup } from "./text.mjs";
import { setLine } from "./type.mjs";
import { valAtEased } from "./cupLayers.mjs";
import fs from "fs";
import { fileURLToPath } from "url";

export const LOGO = JSON.parse(fs.readFileSync(fileURLToPath(new URL("../assets/logo.json", import.meta.url)), "utf8"));
export const RAINBOW = ["#FED012", "#28C840", "#119BFE", "#B098C8", "#F65342", "#FED012"];
export const WORLD_IDS = ["monument", "nightlife", "ghibli", "sketch", "circuit", "orchid", "underwater", "gta2", "riso"];
export const WORLD_NAMES = ["Cromatic", "Night Mode", "Ghib.ly", "Sketchbook", "Race Day", "Sakura", "Underwater", "GTA 2", "Risograph"];
export const ATLAS = { cw: 324, ch: 128 };
export const RISE = [0.18, 1.16, 0.32, 1], EXIT = [0.55, 0, 0.85, 0.35], GLIDE = [0.62, 0, 0.22, 1.08], DEAL = [0.22, 1.12, 0.32, 1], FALL = [0.5, 0, 0.92, 0.55];

export function rainbowAt(u) {
  u = ((u % 1) + 1) % 1;
  const n = RAINBOW.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
  const a = parseInt(RAINBOW[i].slice(1), 16), b = parseInt(RAINBOW[i + 1].slice(1), 16);
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
}
export function valAt(keys, tk) { let v = keys[0][1]; for (const k of keys) if (k[0] <= tk) v = k[1]; return v; }
export function clean(k) {
  const s = [...k].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const x of s) { if (out.length && out[out.length - 1][0] === x[0]) out[out.length - 1] = x; else out.push(x); }
  return out.map((x, i) => (i === out.length - 1 ? [x[0], x[1]] : x));
}
export function reversePath(p) { return { c: p.c, v: [...p.v].reverse(), i: [...p.o].reverse(), o: [...p.i].reverse() }; }
// an ellipse as a 4-point bezier path (Lottie's own ellipse, from its top, clockwise)
export function ellipsePathAt(cx, cy, a, b) {
  const k = 0.5523, f = (v) => Math.round(v * 10) / 10;
  return { c: true, v: [[f(cx), f(cy - b)], [f(cx + a), f(cy)], [f(cx), f(cy + b)], [f(cx - a), f(cy)]], i: [[f(-a * k), 0], [0, f(-b * k)], [f(a * k), 0], [0, f(b * k)]], o: [[f(a * k), 0], [0, f(b * k)], [f(-a * k), 0], [0, f(-b * k)]] };
}

export function makeScene(T, ab, { dur, nm, camKeys = [[0, [0, 0]]] } = {}) {
  const ph = ab.name === "phone";
  const W = ab.w, H = ab.h, mid = [W / 2, H / 2];
  const Cm = new Comp({ w: W, h: H, dur, nm });
  const t = (s) => at(s);
  const S = ph ? 46 : 110, S3 = ph ? 40 : 76, LEAD = ph ? 1.04 : 1.0, PG = 0.13;
  const X = ph ? 24 : 96;
  const SW = ph ? 2.5 : 3;
  const U = ph ? 0.55 : 1;
  const cap = (s) => (T.cap / T.upm) * s;
  const blk = (lines, { size = S, mid: my = ph ? 0.42 : 0.5, pill = false, x = X } = {}) => {
    const n = lines.length, y = H * my - (cap(size) + (n - 1) * size * LEAD + (pill ? PG * size : 0)) / 2 + cap(size);
    return layout(T, lines, { x, y, size, leading: LEAD, pillLines: pill ? [n - 1] : [], pillGap: PG });
  };
  // the camera: the paper moves least, the words more, the objects most
  const plane = (pnm, k) => Cm.nul(pnm, { ks: { p: camKeys.map(([tt, v], i) => [tt, [v[0] * k * U, v[1] * k * U], i < camKeys.length - 1 ? E.inOut : undefined]) }, op: Cm.op });
  const PG0 = plane("plane · paper (parallax .35)", 0.35), PT = plane("plane · words (parallax .7)", 0.7), PO = plane("plane · objects (parallax 1)", 1);

  // depth: elevation -> shadow offset (away from the top-left light) and strength
  const shOff = (e) => [(2 + 5 * e) * U, (3.5 + 8 * e) * U], shO = (e) => Math.max(38, 100 - 16 * e);
  const SPREAD = [1, 3, 6, 10, 15, 21].map((v) => v * U), SHA = [7, 6.2, 5.2, 4, 2.8, 1.8];
  const isKeys = (v) => Array.isArray(v[0]) && Array.isArray(v[0][1]);
  const grow = (sizeK, d) => (isKeys(sizeK) ? sizeK.map(([tt, v, ea]) => [tt, [Math.max(0, v[0] + d), Math.max(0, v[1] + d)], ea]) : [Math.max(0, sizeK[0] + d), Math.max(0, sizeK[1] + d)]);
  const elevKs = (elevK) => ({ p: elevK.map(([tt, e, ea]) => [tt, shOff(e), ea]), o: elevK.map(([tt, e, ea]) => [tt, shO(e), ea]) });
  const pillShadow = (sizeK, posK) => SPREAD.map((sp, n) => group("shadow " + n, [rect(grow(sizeK, 2 * sp), posK, 9999), fill(rgb("#2a2118"), SHA[n])]));
  const sheen = (sizeK, posK, w, h, cx, cy, { light = 0.42, shade = 0.1 } = {}) => [
    ...(light > 0 ? [group("sheen", [rect(sizeK, posK, 9999), gfill({ s: [cx - w * 0.5, cy - h * 0.62], e: [cx - w * 0.05, cy + h * 0.25], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, light], [1, 0]] })])] : []),
    group("shade", [rect(sizeK, posK, 9999), gfill({ s: [cx + w * 0.1, cy - h * 0.1], e: [cx + w * 0.5, cy + h * 0.62], stops: [[0, "#000000"], [1, "#000000"]], alphas: [[0, 0], [1, shade]] })])
  ];

  // text
  const letterAt = (L, lx, by, size, col, keys) => letterGroup(T, { ...L, x: lx + L.x }, size, typeof col === "string" ? rgb(col) : col, { extra: (base, s) => keys([base[0], base[1] + by], s) });
  const riseKeys = (t0, te, size, { dur = 30, outDur = 16, up = 1.2, out = 1.45 } = {}) => (b, s) => {
    const below = [b[0], b[1] + up * size], above = [b[0], b[1] - out * size];
    const p = [[t0, below, RISE], [t0 + dur, b, E.linear]], sc = [[t0, [s * 0.94, s * 1.12], E.out], [t0 + dur * 0.75, [s, s], E.linear]];
    if (te != null) { p.push([te, b, EXIT], [te + outDur, above]); sc.push([te, [s, s], EXIT], [te + outDur, [s * 0.96, s * 1.1]]); }
    return { p: clean(p), s: clean(sc) };
  };
  const lineClip = (ws, size) => {
    const a = ws[0], z = ws[ws.length - 1], by = a.by;
    const x0 = a.lx + a.x - 0.3 * size, x1 = z.lx + z.x + z.w + 0.3 * size, y0 = by - 1.0 * size, y1 = by + 0.34 * size;
    return { inv: false, mode: "a", pt: { a: 0, k: roundRect((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0) }, o: prop(100), x: prop(0), nm: "line" };
  };
  const lines = (lnm, ws, { size = S, color = C.black, inAt, outAt, letterGap = 1, ip = 0, op, dur: d, outDur }) => {
    const byLine = new Map(); ws.forEach((w, i) => { if (!byLine.has(w.line)) byLine.set(w.line, []); byLine.get(w.line).push([w, i]); });
    for (const [li, items] of byLine) {
      // (3.7x, the worker's frame: a line is a layer only while a letter of it can be seen. Before its first letter
      // rises it is all below its clip, after its last has gone all above: a layer there still cost its clip and its
      // letters' keys every frame of the opening, the pill's included)
      let first = Infinity, last = -Infinity;
      const groups = items.map(([w, i]) => {
        const t0 = inAt(i, w), te = outAt ? outAt(i, w) : null;
        first = Math.min(first, t0); last = te == null ? Infinity : Math.max(last, te + (w.letters.length - 1) * 0.6 + (outDur ?? 16));
        return group(w.text, w.letters.map((L, j) => letterAt(L, w.lx, w.by, size, color, riseKeys(t0 + j * letterGap, te == null ? null : te + j * 0.6, size, { dur: d, outDur }))));
      });
      const lip = Math.max(ip, Math.floor(first) - 1), lop = op ?? (Number.isFinite(last) ? Math.min(Cm.op, Math.ceil(last) + 2) : Cm.op);
      Cm.shape(`${lnm} · line ${li + 1}`, groups, { ip: lip, op: lop, parent: PT, masks: [lineClip(items.map(([w]) => w), size)] });
    }
  };
  // the slot pill (A2's): its word and colour change like a flip display; it starts as a dot and leaves as one or fades
  const slotPill = (snm, { size = S, x0, by, words, start, tOut, outTo = "dot", ip, op, elev, id = "pill" }) => {
    const L = words.map(([w]) => setLine(T, w, size, -0.035));
    const g = L.map((l) => pillGeom(size, x0 - 0.34 * size, by, l.width));
    const dot = 0.22 * size, c = (q) => [q.cx, q.cy], sz = (q, k = 1) => [q.w * k, q.h * k];
    const t0 = words[0][3];
    // (r229, as the live opening: a pill that takes over from something (start) dissolves its colour in over it and keeps
    // that shape until it has; one born of nothing opens from a dot, black clearing to its colour)
    const inner = Math.max(1, dot - SW);
    const tg = start && start.dissolve !== false ? t0 + 5 : t0;
    const sizeK = [[tg, start?.size || [inner, inner], E.spring], [tg + 22, sz(g[0]), E.linear]];
    const posK = [[tg, start?.pos || c(g[0]), E.spring], [tg + 22, c(g[0]), E.linear]];
    for (let k = 1; k < words.length; k++) { const tk = words[k][3] + 3; sizeK.push([tk, sz(g[k - 1]), E.spring], [tk + 22, sz(g[k]), E.linear]); posK.push([tk, c(g[k - 1]), E.spring], [tk + 22, c(g[k]), E.linear]); }
    const gl = g[g.length - 1];
    if (outTo === "dot") sizeK.push([tOut, sz(gl), [0.6, 0, 0.8, 0.2]], [tOut + 12, [inner, inner]]);
    else if (outTo === "circle") sizeK.push([tOut, sz(gl), [0.6, 0, 0.3, 1]], [tOut + 12, [gl.h, gl.h]]);
    else sizeK.push([tOut, sz(gl), EXIT], [tOut + 14, sz(gl, 0.92)]);
    const sizeKeys = clean(sizeK), posKeys = clean(posK);
    const maxW = Math.max(...g.map((q) => q.w)) + 0.8 * size, slabX = x0 - 0.34 * size + maxW / 2 - 0.4 * size, cy = g[0].cy, hh = g[0].h + 4;
    // (each colour gone once the next has covered it: a pill that fades shows no colours of the words before)
    const slabs = words.map(([, col, , tk], k) => group("colour " + k, [rect([maxW, hh], k === 0 ? [slabX, cy] : [[0, [slabX, cy + hh], E.hold], [tk, [slabX, cy + hh], [0.25, 0.9, 0.3, 1]], [tk + 14, [slabX, cy]]], 0), fill(rgb(col))], k < words.length - 1 ? { o: [[0, 100, E.hold], [words[k + 1][3] + 15, 0]] } : {})).reverse();
    const letters = words.map(([w, , ink, tk], k) => {
      const ti = k === 0 ? tk + 7 : tk + 3, to = k < words.length - 1 ? words[k + 1][3] - 3 : null;
      return group(w, L[k].letters.map((l, j) => letterAt(l, x0, by, size, ink, (b, s) => {
        // (r229: a word that leaves goes all the way out of the pill and is gone: the p of "place." stayed in its top edge)
        const below = [b[0], b[1] + 1.08 * size], above = [b[0], b[1] - 1.4 * size];
        const p = [[ti + j * 0.8, below, RISE], [ti + j * 0.8 + 20, b, E.linear]];
        const o = [[0, 0, E.hold], [ti + j * 0.8, 100, E.hold]];
        if (to != null) { p.push([to + j * 0.4, b, EXIT], [to + j * 0.4 + 11, above]); o.push([to + j * 0.4 + 11, 0]); }
        else if (outTo === "dot" || outTo === "circle") { const te = tOut - 4 + j * 0.4; p.push([te, b, EXIT], [te + 10, above]); o.push([te + 10, 0]); }
        else p.push([tOut + j * 0.4, b, EXIT], [tOut + 12 + j * 0.4, above]);
        return { p: clean(p), o: clean(o), s: [s, s] };
      })));
    });
    // (the mask's centre where the outline's is at that moment, as Lottie eases it: a held value lagged the pill when a
    // word's spring and the pill's exit overlapped, its colour beside the outline)
    const posAt = (tk) => [0, 1].map((d) => valAtEased(posKeys.map(([tt, v, e]) => [tt, v[d], e]), tk));
    const maskKeys = sizeKeys.map(([tk, s2, e]) => { const q = posAt(tk); return [tk, roundRect(q[0], q[1], s2[0], s2[1], s2[1] / 2), e]; });
    const fade = outTo === "dot" ? 100 : outTo === "circle" ? [[tOut + 8, 100, E.linear], [tOut + 14, 0]] : [[tOut, 100, E.linear], [tOut + 14, 0]];
    const colourO = start && start.dissolve !== false ? clean([[t0 - 1, 0, E.linear], [t0 + 4, 100, E.hold], ...(Array.isArray(fade) ? fade : [])]) : fade;
    const ink = start ? [] : [group("ink (the dot's black)", [rect(sizeKeys, posKeys, 9999), fill(rgb(C.black), [[t0, 100, [0.3, 0.5, 0.6, 1]], [t0 + 5, 0]])])];
    const big = g.reduce((a, q) => (q.w > a.w ? q : a), g[0]);
    Cm.shape(`${snm} · outline`, [group("outline", [rect(sizeKeys, posKeys, 9999), stroke(rgb(C.black), SW)], { o: fade })], { ip, op, parent: PO, ln: `ck-${id}` });
    Cm.shape(`${snm} · word, colour, light`, [...ink, ...sheen(sizeKeys, posKeys, big.w, big.h, big.cx, big.cy, { light: 0.3, shade: 0.1 }), ...letters, ...slabs], { ip, op, parent: PO, ks: { o: colourO }, masks: [{ inv: false, mode: "a", pt: pathProp(maskKeys), o: prop(100), x: prop(0), nm: "pill" }] });
    const elevK = clean(elev || [[t0, start ? 0.4 : 0.1, E.out], [t0 + 18, 1, E.linear], ...words.slice(1).flatMap(([, , , tk]) => [[tk, 1, E.out], [tk + 6, 1.7, E.inOut], [tk + 16, 1, E.linear]]), ...(outTo === "dot" ? [[tOut, 1, E.in], [tOut + 12, 1.2]] : [[tOut, 1, E.linear]])]);
    const eks = elevKs(elevK);
    const shadowO = outTo === "dot" ? eks.o : outTo === "circle" ? clean([...eks.o.filter((x) => x[0] < tOut + 8), [tOut + 8, shO(1), E.linear], [tOut + 14, 0]]) : clean([...eks.o.filter((x) => x[0] < tOut), [tOut, shO(1), E.linear], [tOut + 14, 0]]);
    Cm.shape(`${snm} · shadow`, pillShadow(sizeKeys, posKeys), { ip, op, parent: PO, ks: { p: eks.p, o: shadowO } });
    return { g, last: gl, center: c(gl), dot };
  };
  // the Multiverse ring (48 trimmed segments of the conic gradient, a yellow underlay under the seams)
  const NR = 48;
  // (tint: [t0, t1, "#hex"]: the ring's colours come out of that colour, a cup's white lip turning into the rainbow; a
  // fade of the 48 segments would show their overlaps as a dashed ring)
  const ring = (sizeKeys, center, offKeys, ringW, op = 100, tint = null) => {
    const col = (c) => (tint ? [[tint[0], rgb(tint[2]), E.inOut], [tint[1], rgb(c)]] : rgb(c));
    return [...Array.from({ length: NR }, (_, i) => group("ring " + i, [rect(sizeKeys, center, 9999), trim((i * 100) / NR, Math.min(100, ((i + 1) * 100) / NR + 0.9), offKeys), stroke(col(rainbowAt((i + 0.5) / NR)), ringW, op, { lc: 1, lj: 1 })])), group("ring underlay", [rect(sizeKeys, center, 9999), stroke(col(RAINBOW[0]), ringW * 0.98, op, { lc: 1, lj: 1 })])];
  };
  // the logo (the site's own artwork, traced), centred on c, height h
  const logoGroup = (c, h, o = {}) => group("logo · Cromatic Studios", [...LOGO.paths.map((q) => path(q)), fill(rgb(C.black), 100, 2)], { a: [LOGO.w / 2, LOGO.h / 2], p: o.p || c, s: o.s || [(h / LOGO.h) * 100, (h / LOGO.h) * 100], o: o.o ?? 100 });
  // the key light across the paper
  const keyLight = (knm, ip, op, o = 100, masks) => Cm.shape(knm, [
    group("light", [rect([W * 1.2, H * 1.2], mid), gfill({ type: 2, s: [W * 0.12, -H * 0.05], e: [W * 0.95, H * 0.85], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, 0.62], [0.55, 0.12], [1, 0]] })]),
    group("falloff", [rect([W * 1.2, H * 1.2], mid), gfill({ type: 1, s: [W * 0.45, H * 0.4], e: [W, H], stops: [[0, "#3a2c1c"], [1, "#3a2c1c"]], alphas: [[0, 0], [1, 0.07]] })])
  ], { ip, op, ks: { o }, masks });
  // a hole (the window onto the live map) through a layer: an inverted mask whose path runs the other way round
  const hole = (pathKeys) => [{ inv: true, mode: "a", pt: pathProp(pathKeys.map(([tk, q, e]) => [tk, reversePath(q), e])), o: prop(100), x: prop(0), nm: "window" }];
  const paper = (o = {}) => gridPaper(Cm, { parent: PG0, bleed: 40 * U, ...o });
  /* the live opening's ending (A2, r226), for a concept that ends in the Multiverse pill: "feels." in the pill on its line
     (from a circle when it is born of a cup), the glide to the middle, the logo in the pill (the hold, breathing), the
     dissolve onto the live map and the window; the short version (the pill alone). Returns the window's keys (for the
     paper's hole) and the times. TLx: { B4, HOLD, HAND, END, SHORT, SHORT_END }, DISSOLVE frames */
  const pillEnding = ({ TLx, lines4, size = S, fromCircle = null, DISSOLVE = 24 }) => {
    const tHold = t(TLx.HOLD), tH = t(TLx.HAND), tEnd = t(TLx.END), tS0 = t(TLx.SHORT), tS1 = t(TLx.SHORT_END);
    const loop = tH - tHold;
    const b4 = blk(lines4, { size, pill: true, mid: ph ? 0.2 : 0.5 });
    const feelsW = b4.find((w) => w.text === "feels.");
    const t4 = t(TLx.B4), tFeels = t(TLx.B4 + 0.32), tGlide = t(TLx.B4 + 1.35), tDrop = t(TLx.B4 + 1.7);
    const fX = feelsW.lx + feelsW.x + pillShift(size), fL = setLine(T, "feels.", size, -0.035), fg = pillGeom(size, fX - 0.34 * size, feelsW.by, fL.width);
    const fc = [fg.cx, fg.cy], gS = ph ? 1.6 : 1.25;
    const ringW = (ph ? 0.05 : 0.04) * size; // (r229: about 60 % of what it was)
    const finalSize = ph ? [H * 2.45, H * 2.3] : [W * 2.3, W * 2.2];
    const tOpen = tH + DISSOLVE;
    // born of a cup: a circle the size of the pill's height first, springing to the pill
    const born = fromCircle ? [[tFeels, [fg.h, fg.h], E.spring], [tFeels + 22, [fg.w, fg.h], E.hold]] : [[0, [fg.w, fg.h], E.hold]];
    const winSize = [...born, [tOpen, [fg.w, fg.h], [0.45, 0, 0.6, 1]], [tOpen + 8, [fg.w * 0.95, fg.h * 0.95], [0.72, 0, 0.18, 1]], [tEnd - 2, finalSize.map((v) => v / gS)]];
    const ringOff = (from, to, zeroAt) => [[from, ((from - zeroAt) / loop) * 360, E.linear], [to, ((to - zeroAt) / loop) * 360]];
    const feelsLetters = group("feels.", fL.letters.map((l, j) => letterAt(l, fX, feelsW.by, size, C.black, (b, s) => ({
      p: clean([[tFeels + 6 + j, [b[0], b[1] + 0.42 * size], RISE], [tFeels + 26 + j, b, E.linear], [tDrop + j * 1.4, b, [0.5, 0, 0.9, 0.5]], [tDrop + 14 + j * 1.4, [b[0], b[1] + 1.0 * size]]]),
      o: clean([[0, 0, E.hold], [tFeels + 6 + j, 0, E.linear], [tFeels + 13 + j, 100, E.linear], [tDrop + 9 + j * 1.4, 100, E.linear], [tDrop + 14 + j * 1.4, 0]]),
      r: [[tDrop + j * 1.4, 0, E.in], [tDrop + 14 + j * 1.4, (j % 2 ? 1 : -1) * 14]], s: [s, s]
    }))));
    const pulse = [[tHold, [gS * 100, gS * 100], E.inOut], [Math.round((tHold + tH) / 2), [gS * 103, gS * 103], E.inOut], [tH, [gS * 100, gS * 100]]];
    // (born of a cup: it sits on the cup's rim while the cup goes (hold frames), then goes to its line)
    const fH = fromCircle ? fromCircle.t0 + (fromCircle.hold || 0) : 0;
    const pStart = fromCircle ? [[fromCircle.t0, fromCircle.p, E.hold], [fH, fromCircle.p, [0.45, 0, 0.3, 1]], [tFeels, fc, E.hold]] : [[tFeels, fc, E.hold]];
    const feelsRoot = Cm.nul("beat 4 · feels. (the Multiverse pill)", { parent: PO, ip: fromCircle ? fromCircle.t0 : tFeels, op: tEnd + 1, ks: {
      a: fc, p: [...pStart, [tGlide, fc, GLIDE], [tGlide + 30, mid]],
      s: clean([...(fromCircle ? [[fromCircle.t0, [fromCircle.k * 100, fromCircle.k * 100], E.hold], [fH, [fromCircle.k * 100, fromCircle.k * 100], [0.45, 0, 0.3, 1]], [tFeels, [100, 100], E.hold]] : [[tFeels, [40, 40], E.spring], [tFeels + 24, [100, 100], E.hold]]), [tGlide, [100, 100], GLIDE], [tGlide + 30, [gS * 100, gS * 100], E.hold], ...pulse])
    } });
    // (born of a cup: its white comes up over the coffee as the ring comes onto the lip, so the cup goes behind it)
    const bodyO = [...(fromCircle ? [[fromCircle.t0, 0, [0.3, 0, 0.4, 1]], [fromCircle.t0 + 7, 100, E.hold]] : []), [tH, 100, [0.45, 0, 0.35, 1]], [tH + DISSOLVE, 0]];
    const logoH = 0.64 * fg.h, logoK = (logoH / LOGO.h) * 100, tLogo = tDrop + 14;
    const logo = logoGroup(fc, logoH, {
      p: [[tLogo, [fc[0], fc[1] + 0.12 * logoH], RISE], [tLogo + 26, fc]],
      s: [[tLogo, [logoK * 0.94, logoK * 0.94], RISE], [tLogo + 26, [logoK, logoK], E.hold], [tH, [logoK, logoK], [0.4, 0, 0.3, 1]], [tH + DISSOLVE, [logoK * 1.06, logoK * 1.06]]],
      o: [[0, 0, E.hold], [tLogo, 0, E.linear], [tLogo + 12, 100, E.hold], [tH, 100, [0.45, 0, 0.35, 1]], [tH + DISSOLVE - 4, 0]]
    });
    const ringO = [[tEnd - 12, 100, E.linear], [tEnd - 2, 0]];
    const t0 = fromCircle ? fromCircle.t0 : tFeels;
    // (r229: "feels." in its own layer, clipped to the inside of the ring: it rises into the pill and drops out through
    // the bottom, never across the rainbow)
    const inW = fg.w - ringW, inH = fg.h - ringW;
    Cm.shape("beat 4 · feels. · word", [feelsLetters], { parent: feelsRoot, ip: fromCircle ? fromCircle.t0 : tFeels, op: tDrop + 24, masks: [{ inv: false, mode: "a", pt: pathProp(roundRect(fc[0], fc[1], inW, inH, inH / 2)), o: prop(100), x: prop(0), nm: "inside the ring" }] });
    Cm.shape("beat 4 · feels. · ring, word, body", [logo, ...ring(winSize, fc, ringOff(t0, tEnd, tHold), ringW, ringO, fromCircle ? [t0, t0 + 8, "#f6f4ef"] : null),
      group("body", [...sheen(winSize, fc, fg.w, fg.h, fc[0], fc[1], { light: 0, shade: 0.07 }), rect(winSize, fc, 9999), fill(rgb(C.white))], { o: bodyO })
    ], { parent: feelsRoot, ip: t0, op: tEnd + 1, ln: "ck-feels" });
    const feelsElev = [[tFeels, 0.2, E.out], [tFeels + 18, 1, E.hold], [tGlide, 1, E.inOut], [tGlide + 14, 3.2, E.inOut], [tGlide + 28, 0.35, E.out], [tGlide + 40, 1.2, E.hold], [tHold, 1.2, E.inOut], [Math.round((tHold + tH) / 2), 1.55, E.inOut], [tH, 1.2]];
    const fEks = elevKs(feelsElev);
    const shEnd = shOff(1.2).map((v) => v / gS);
    const holeKeys = (cx, cy, k = 1) => [[0, roundRect(cx, cy, 0, 0, 0), E.hold], [tH - 1, roundRect(cx, cy, 0, 0, 0), E.hold], [tH, roundRect(cx, cy, fg.w * k, fg.h * k, (fg.h * k) / 2), E.hold], ...winSize.filter(([tk]) => tk >= tOpen).map(([tk, s2, e]) => [tk, roundRect(cx, cy, s2[0] * k, s2[1] * k, (s2[1] * k) / 2), e])];
    Cm.shape("beat 4 · feels. · shadow", pillShadow(winSize, fc), { parent: feelsRoot, ip: tFeels, op: tEnd + 1, ks: { p: fEks.p.map(([tt, v, ea]) => [tt, [v[0] / gS, v[1] / gS], ea]), o: clean([...fEks.o, [tEnd - 12, shO(1.2), E.linear], [tEnd - 2, 0]]) }, masks: hole(holeKeys(fc[0] - shEnd[0], fc[1] - shEnd[1])) });
    lines("beat 4 · that's how the right brand", b4.filter((w) => w !== feelsW), { size, inAt: (i) => t4 + i * 3.5, outAt: (i) => tGlide - 6 + i * 1.5 });
    // the short version: the pill alone, popping in, then the hold
    const shortRoot = Cm.nul("short · the pill", { ip: tS0, op: tS1 + 1, ks: { a: fc, p: mid, s: [[tS0, [gS * 30, gS * 30], E.spring], [tS1 - 2, [gS * 100, gS * 100]]] } });
    Cm.shape("short · logo, ring, body", [logoGroup(fc, logoH), ...ring([fg.w, fg.h], fc, ringOff(tS0, tS1 + 1, tS1), ringW), group("body", [...sheen([fg.w, fg.h], fc, fg.w, fg.h, fc[0], fc[1], { light: 0, shade: 0.07 }), rect([fg.w, fg.h], fc, 9999), fill(rgb(C.white))])], { parent: shortRoot, ip: tS0, op: tS1 + 1, ln: "ck-short" });
    const sEks = elevKs([[tS0, 0.2, E.out], [tS1 - 2, 1.2]]);
    Cm.shape("short · shadow", pillShadow([fg.w, fg.h], fc), { parent: shortRoot, ip: tS0, op: tS1 + 1, ks: { p: sEks.p.map(([tt, v, ea]) => [tt, [v[0] / gS, v[1] / gS], ea]), o: sEks.o } });
    return { winK: holeKeys(mid[0], mid[1], gS), tHold, tH, tEnd, tS0, tS1, tFeels, tGlide, tDrop, fg, fc, gS, ringW, pillMeta: [+fg.w.toFixed(1), +fg.h.toFixed(1), gS, +ringW.toFixed(2)] };
  };
  return { Cm, ph, W, H, mid, t, S, S3, X, SW, U, LEAD, PG, cap, blk, PG0, PT, PO, shOff, shO, SPREAD, SHA, elevKs, pillShadow, sheen, letterAt, riseKeys, lineClip, lines, slotPill, ring, logoGroup, keyLight, hole, paper, pillGeom, pillShift, setLine, pillEnding };
}
