// Direction A2 · "The pill", refined (Daniel, 2026-10-19): the site's loader and its opening.
// Lines rise from behind their own baseline like slots; the thumbnail is shrunk into a card, flipped away, and what is
// left of it, a dot, flies to the next line and becomes the pill (place, facade, brand: the colour rolls up with the
// word, the text always black). The brand pill shrinks to a dot that deals the nine worlds out, as pills with each
// world's own picture (the Multiverse previews) and name; eight fall away and the Cromatic one becomes "yours.".
// "feels." is the Multiverse button's pill (white, the turning rainbow ring); it glides to the middle of the screen,
// lets its word go, breathes while the city loads, and opens: the city shows inside it, and the window grows past
// every edge. A short version (the pill alone, then the same opening) is the loader for returning visitors.
// Depth (Daniel's second note): three planes (paper, the printed words, the objects) on a slow camera with parallax;
// a key light from the top left (light across the paper, a sheen on every pill); every object has an
// elevation that drives its soft shadow (a stack of pill shapes, no blur: cheap in the worker), tightening into a contact
// shadow each time it lands; objects in flight pass over the others and shade them.
import { Comp, group, rect, ellipse, fill, gfill, stroke, trim, rgb, E, prop, path, poly, roundRect, pathProp } from "../lib/lottie.mjs";
import { C, gridPaper, layout, pillGeom, pillShift, at } from "../lib/kit.mjs";
import { letterGroup } from "../lib/text.mjs";
import { setLine } from "../lib/type.mjs";
import fs from "fs";
import { fileURLToPath } from "url";
// r226 (Daniel: "the Cromatic Studios logo in the centre pill while the city loads"): the site's own logo artwork
// (src/app.js logoPortrait), traced into shapes by tools/trace-logo.py: no font stands in for it
const LOGO = JSON.parse(fs.readFileSync(fileURLToPath(new URL("../assets/logo.json", import.meta.url)), "utf8"));

// the clock (seconds); HOLD..HAND is a loop whose first and last frames are the same, SHORT is the returning visitor's
// r226: the logo rises into the pill after "feels." (the words end later, HOLD 8.95 -> 9.25, so it is read), and the
// handoff starts with a dissolve (DISSOLVE): the logo and the pill's white go, the live map shows in the pill, then it opens
export const TL = { B1: 0.12, B2: 1.62, B3: 3.8, B4: 6.85, HOLD: 9.25, HAND: 10.85, END: 12.15, SHORT: 12.25, SHORT_END: 12.7, COMP: 12.75 };
const DISSOLVE = 24; // frames (0.4 s)
export const ARTBOARDS2 = { desktop: { name: "desktop", w: 1280, h: 900 }, phone: { name: "phone", w: 390, h: 844 } };
export const WORLD_IDS = ["monument", "nightlife", "ghibli", "sketch", "circuit", "orchid", "underwater", "gta2", "riso"];
const WORLD_NAMES = ["Cromatic", "Night Mode", "Ghib.ly", "Sketchbook", "Race Day", "Sakura", "Underwater", "GTA 2", "Risograph"];
export const ATLAS = { cw: 324, ch: 128 }; // one crop per world in the atlas, stacked top to bottom, in WORLD_IDS order
// the Multiverse button's ring: conic-gradient(#FED012, #28C840, #119BFE, #B098C8, #F65342, #FED012), turning
const RAINBOW = ["#FED012", "#28C840", "#119BFE", "#B098C8", "#F65342", "#FED012"];

// easings: a rise that overshoots a hair, an exit that accelerates away, a glide that lands past and settles
const RISE = [0.18, 1.16, 0.32, 1], EXIT = [0.55, 0, 0.85, 0.35], GLIDE = [0.62, 0, 0.22, 1.08], DEAL = [0.22, 1.12, 0.32, 1], FALL = [0.5, 0, 0.92, 0.55];

export function buildA2(T, ab, { atlasPath = "worlds.webp" } = {}) {
  const ph = ab.name === "phone";
  const W = ab.w, H = ab.h, mid = [W / 2, H / 2];
  const Cm = new Comp({ w: W, h: H, dur: TL.COMP, nm: `Cromatic opening · A2 · the pill · ${ab.name}` });
  const t = (s) => at(s);
  const tHold = t(TL.HOLD), tH = t(TL.HAND), tEnd = t(TL.END), tS0 = t(TL.SHORT), tS1 = t(TL.SHORT_END);
  const loop = tH - tHold; // the hold's length = one turn of the ring
  Cm.marker("words", 0, tHold);
  Cm.marker("hold", tHold, tH);
  Cm.marker("handoff", tH, tEnd);
  Cm.marker("short", tS0, tS1);
  const S = ph ? 46 : 110, S3 = ph ? 40 : 76, LEAD = ph ? 1.04 : 1.0, PG = 0.13;
  const X = ph ? 24 : 112;
  const SW = ph ? 2.5 : 3;
  const U = ph ? 0.55 : 1; // the depth's unit (shadow offsets and spreads, camera moves)
  const cap = (s) => (T.cap / T.upm) * s;
  const blk = (lines, { size = S, mid: my = ph ? 0.42 : 0.5, pill = false, x = X } = {}) => {
    const n = lines.length, y = H * my - (cap(size) + (n - 1) * size * LEAD + (pill ? PG * size : 0)) / 2 + cap(size);
    return layout(T, lines, { x, y, size, leading: LEAD, pillLines: pill ? [n - 1] : [], pillGap: PG });
  };
  const ATL = Cm.asset("worlds", ATLAS.cw, ATLAS.ch * WORLD_IDS.length, atlasPath);

  /* ======================= the camera and its planes ======================= */
  // a slow camera that follows the story's big moves; the paper moves least, the words more, the objects most
  const camKeys = [[0, [0, 0]], [t(1.35), [-12, -6]], [t(2.15), [10, 8]], [t(3.6), [14, 4]], [t(4.3), [-6, 14]], [t(5.3), [-14, 18]], [t(5.55), [-14, 18]], [t(6.2), [-30, -6]], [t(6.85), [-20, -4]], [t(8.7), [0, 0]]];
  const plane = (nm, k) => Cm.nul(nm, { ks: { p: camKeys.map(([tt, v], i) => [tt, [v[0] * k * U, v[1] * k * U], i < camKeys.length - 1 ? E.inOut : undefined]) }, op: Cm.op });
  const PG0 = plane("plane · paper (parallax .35)", 0.35), PT = plane("plane · words (parallax .7)", 0.7), PO = plane("plane · objects (parallax 1)", 1);

  /* ======================= depth helpers ======================= */
  // elevation e (0 lying on the paper, 1 resting, 3-4 in flight) -> the shadow's offset (away from the top-left light),
  // and its strength (the higher, the softer and fainter)
  const shOff = (e) => [(2 + 5 * e) * U, (3.5 + 8 * e) * U], shO = (e) => Math.max(38, 100 - 16 * e);
  const SPREAD = [1, 3, 6, 10, 15, 21].map((v) => v * U), SHA = [7, 6.2, 5.2, 4, 2.8, 1.8];
  const isKeys = (v) => Array.isArray(v[0]) && Array.isArray(v[0][1]);
  const grow = (sizeK, d) => (isKeys(sizeK) ? sizeK.map(([tt, v, ea]) => [tt, [Math.max(0, v[0] + d), Math.max(0, v[1] + d)], ea]) : [Math.max(0, sizeK[0] + d), Math.max(0, sizeK[1] + d)]);
  const elevKs = (elevK) => ({ p: elevK.map(([tt, e, ea]) => [tt, shOff(e), ea]), o: elevK.map(([tt, e, ea]) => [tt, shO(e), ea]) });
  // a soft shadow under a pill: stacked stadiums, growing and fading; sizeK/posK as the pill's own (local) keys
  const pillShadow = (sizeK, posK) => SPREAD.map((sp, n) => group("shadow " + n, [rect(grow(sizeK, 2 * sp), posK, 9999), fill(rgb("#2a2118"), SHA[n])]));
  // the key light on a pill: a sheen from the top left and a little shade at the bottom right, inside its shape
  const sheen = (sizeK, posK, w, h, cx, cy, { light = 0.42, shade = 0.1 } = {}) => [
    ...(light > 0 ? [group("sheen", [rect(sizeK, posK, 9999), gfill({ s: [cx - w * 0.5, cy - h * 0.62], e: [cx - w * 0.05, cy + h * 0.25], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, light], [1, 0]] })])] : []),
    group("shade", [rect(sizeK, posK, 9999), gfill({ s: [cx + w * 0.1, cy - h * 0.1], e: [cx + w * 0.5, cy + h * 0.62], stops: [[0, "#000000"], [1, "#000000"]], alphas: [[0, 0], [1, shade]] })])
  ];

  /* ======================= text ======================= */
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
  const lines = (nm, ws, { size = S, color = C.black, inAt, outAt, letterGap = 1, ip = 0, op, dur, outDur }) => {
    const byLine = new Map(); ws.forEach((w, i) => { if (!byLine.has(w.line)) byLine.set(w.line, []); byLine.get(w.line).push([w, i]); });
    for (const [li, items] of byLine) {
      const groups = items.map(([w, i]) => {
        const t0 = inAt(i, w), te = outAt ? outAt(i, w) : null;
        return group(w.text, w.letters.map((L, j) => letterAt(L, w.lx, w.by, size, color, riseKeys(t0 + j * letterGap, te == null ? null : te + j * 0.6, size, { dur, outDur }))));
      });
      Cm.shape(`${nm} · line ${li + 1}`, groups, { ip, op: op ?? Cm.op, parent: PT, masks: [lineClip(items.map(([w]) => w), size)] });
    }
  };

  /* ======================= objects ======================= */
  // a pill whose word (and colour) changes in place like a flip display; it starts as a dot (start) and leaves as one
  const slotPill = (nm, { size = S, x0, by, words, start, tOut, outTo = "dot", ip, op, elev, id = "pill" }) => {
    const L = words.map(([w]) => setLine(T, w, size, -0.035));
    const g = L.map((l) => pillGeom(size, x0 - 0.34 * size, by, l.width));
    const dot = 0.22 * size, c = (q) => [q.cx, q.cy], sz = (q, k = 1) => [q.w * k, q.h * k];
    const t0 = words[0][3];
    const sizeK = [[t0, start?.size || [dot, dot], E.spring], [t0 + 22, sz(g[0]), E.linear]];
    const posK = [[t0, start?.pos || c(g[0]), E.spring], [t0 + 22, c(g[0]), E.linear]];
    for (let k = 1; k < words.length; k++) { const tk = words[k][3] + 3; sizeK.push([tk, sz(g[k - 1]), E.spring], [tk + 22, sz(g[k]), E.linear]); posK.push([tk, c(g[k - 1]), E.spring], [tk + 22, c(g[k]), E.linear]); }
    const gl = g[g.length - 1];
    if (outTo === "dot") sizeK.push([tOut, sz(gl), [0.6, 0, 0.8, 0.2]], [tOut + 12, [dot, dot]]);
    else sizeK.push([tOut, sz(gl), EXIT], [tOut + 14, sz(gl, 0.92)]);
    const sizeKeys = clean(sizeK), posKeys = clean(posK);
    const maxW = Math.max(...g.map((q) => q.w)) + 0.8 * size, slabX = x0 - 0.34 * size + maxW / 2 - 0.4 * size, cy = g[0].cy, hh = g[0].h + 4;
    const slabs = words.map(([, col, , tk], k) => group("colour " + k, [rect([maxW, hh], k === 0 ? [slabX, cy] : [[0, [slabX, cy + hh], E.hold], [tk, [slabX, cy + hh], [0.25, 0.9, 0.3, 1]], [tk + 14, [slabX, cy]]], 0), fill(rgb(col))])).reverse();
    const letters = words.map(([w, , ink, tk], k) => {
      const ti = k === 0 ? tk + 7 : tk + 3, to = k < words.length - 1 ? words[k + 1][3] - 3 : null;
      return group(w, L[k].letters.map((l, j) => letterAt(l, x0, by, size, ink, (b, s) => {
        const below = [b[0], b[1] + 1.08 * size], above = [b[0], b[1] - 1.1 * size];
        const p = [[ti + j * 0.8, below, RISE], [ti + j * 0.8 + 20, b, E.linear]];
        const o = [[0, 0, E.hold], [ti + j * 0.8, 100, E.linear]];
        if (to != null) p.push([to + j * 0.4, b, EXIT], [to + j * 0.4 + 10, above]);
        else if (outTo === "dot") { p.push([tOut - 2 + j * 0.3, b, EXIT], [tOut + 8 + j * 0.3, [b[0], b[1] + 0.2 * size]]); o.push([tOut - 2, 100, E.linear], [tOut + 6, 0]); }
        else p.push([tOut + j * 0.4, b, EXIT], [tOut + 12 + j * 0.4, above]);
        return { p: clean(p), o: clean(o), s: [s, s] };
      })));
    });
    const maskKeys = sizeKeys.map(([tk, s2, e]) => { const q = valAt(posKeys, tk); return [tk, roundRect(q[0], q[1], s2[0], s2[1], s2[1] / 2), e]; });
    const fade = outTo === "dot" ? 100 : [[tOut, 100, E.linear], [tOut + 14, 0]];
    const big = g.reduce((a, q) => (q.w > a.w ? q : a), g[0]);
    Cm.shape(`${nm} · outline`, [group("outline", [rect(sizeKeys, posKeys, 9999), stroke(rgb(C.black), SW)], { o: fade })], { ip, op, parent: PO, ln: `ck-${id}` });
    Cm.shape(`${nm} · word, colour, light`, [...sheen(sizeKeys, posKeys, big.w, big.h, big.cx, big.cy, { light: 0.3, shade: 0.1 }), ...letters, ...slabs], { ip, op, parent: PO, ks: { o: fade }, masks: [{ inv: false, mode: "a", pt: pathProp(maskKeys), o: prop(100), x: prop(0), nm: "pill" }] });
    // the pill's shadow: it lands from the air (contact), hops at each change, lifts as it becomes a dot again
    const elevK = clean(elev || [[t0, 3, E.out], [t0 + 7, 0.15, E.out], [t0 + 18, 1, E.linear], ...words.slice(1).flatMap(([, , , tk]) => [[tk, 1, E.out], [tk + 6, 1.7, E.inOut], [tk + 16, 1, E.linear]]), ...(outTo === "dot" ? [[tOut, 1, E.in], [tOut + 12, 3]] : [[tOut, 1, E.linear]])]);
    const eks = elevKs(elevK);
    const shadowO = outTo === "dot" ? eks.o : clean([...eks.o.filter((x) => x[0] < tOut), [tOut, shO(1), E.linear], [tOut + 14, 0]]);
    Cm.shape(`${nm} · shadow`, pillShadow(sizeKeys, posKeys), { ip, op, parent: PO, ks: { p: eks.p, o: shadowO } });
    return { g, last: gl, center: c(gl), dot };
  };
  // a black dot that travels on an arc (split position), high above the paper, and lands with a squash and a contact shadow
  const flyingDot = (nm, { from, to, tAppear, t0, t1, d, lift = 0.18 * H, ip, op }) => {
    const top = Math.min(from[1], to[1]) - lift;
    const tm = Math.round(t0 + (t1 - t0) * 0.45);
    const dotL = Cm.shape(nm, [group("dot", [ellipse([d, d], [0, 0]), fill(rgb(C.black))])], {
      ip, op, parent: PO, ks: {
        p: { x: [[t0, from[0], [0.45, 0, 0.35, 1]], [t1, to[0]]], y: [[t0, from[1], [0.2, 0.6, 0.4, 1]], [tm, top, [0.55, 0, 0.8, 0.4]], [t1, to[1]]] },
        s: [[tAppear, [0, 0], E.spring], [tAppear + 8, [100, 100], E.hold], [t1 - 3, [100, 100], E.out], [t1, [128, 76], E.out], [t1 + 4, [100, 100]]]
      }
    });
    // its shadow, on the paper: far and faint at the top of the arc, tight as it lands
    const elevK = [[t0, 1.2, E.inOut], [tm, 4.5, E.inOut], [t1 - 2, 0.6, E.out], [t1, 0.1]];
    Cm.shape(nm + " · shadow", [group("shadow", [ellipse([d * 1.15, d * 1.15], [0, 0]), fill(rgb("#2a2118"), 26)]), group("shadow soft", [ellipse([d * 1.9, d * 1.9], [0, 0]), fill(rgb("#2a2118"), 10)])], { ip, op, parent: dotL, ks: { p: elevK.map(([tt, e, ea]) => [tt, shOff(e), ea]), o: elevK.map(([tt, e, ea]) => [tt, shO(e) * 0.8, ea]), s: elevK.map(([tt, e, ea]) => [tt, [100 + 22 * e, 100 + 22 * e], ea]) } });
    return dotL;
  };

  /* ======================= beat 4 and the handoff (top of the stack) ======================= */
  const b4 = blk(ph ? ["That's how", "the right brand", "feels."] : ["That's how the right", "brand feels."], { pill: true });
  const feelsW = b4.find((w) => w.text === "feels.");
  const t4 = t(TL.B4), tFeels = t(TL.B4 + 0.32), tGlide = t(TL.B4 + 1.35), tDrop = t(TL.B4 + 1.7);
  const fX = feelsW.lx + feelsW.x + pillShift(S), fL = setLine(T, "feels.", S, -0.035), fg = pillGeom(S, fX - 0.34 * S, feelsW.by, fL.width);
  const fc = [fg.cx, fg.cy], gS = ph ? 1.6 : 1.25; // the pill's scale in the middle of the screen
  const ringW = (ph ? 0.08 : 0.064) * S;
  const finalSize = ph ? [H * 2.45, H * 2.3] : [W * 2.3, W * 2.2]; // wider than tall to the end, so the stadium never turns
  const tOpen = tH + DISSOLVE; // the window starts to grow once the logo has dissolved into the map
  const winSize = [[0, [fg.w, fg.h], E.hold], [tOpen, [fg.w, fg.h], [0.45, 0, 0.6, 1]], [tOpen + 8, [fg.w * 0.95, fg.h * 0.95], [0.72, 0, 0.18, 1]], [tEnd - 2, finalSize.map((v) => v / gS)]];
  const ringOff = (from, to, zeroAt) => [[from, ((from - zeroAt) / loop) * 360, E.linear], [to, ((to - zeroAt) / loop) * 360]];
  const NR = 48;
  const ring = (sizeKeys, center, offKeys, op = 100) => [...Array.from({ length: NR }, (_, i) => group("ring " + i, [rect(sizeKeys, center, 9999), trim((i * 100) / NR, Math.min(100, ((i + 1) * 100) / NR + 0.9), offKeys), stroke(rgb(rainbowAt((i + 0.5) / NR)), ringW, op, { lc: 1, lj: 1 })])), group("ring underlay", [rect(sizeKeys, center, 9999), stroke(rgb(RAINBOW[0]), ringW * 0.98, op, { lc: 1, lj: 1 })])];
  const feelsLetters = group("feels.", fL.letters.map((l, j) => letterAt(l, fX, feelsW.by, S, C.black, (b, s) => ({
    p: clean([[tFeels + 6 + j, [b[0], b[1] + 0.42 * S], RISE], [tFeels + 26 + j, b, E.linear], [tDrop + j * 1.4, b, [0.5, 0, 0.9, 0.5]], [tDrop + 14 + j * 1.4, [b[0], b[1] + 0.55 * S]]]),
    o: clean([[0, 0, E.hold], [tFeels + 6 + j, 0, E.linear], [tFeels + 13 + j, 100, E.linear], [tDrop + 6 + j * 1.4, 100, E.linear], [tDrop + 14 + j * 1.4, 0]]),
    r: [[tDrop + j * 1.4, 0, E.in], [tDrop + 14 + j * 1.4, (j % 2 ? 1 : -1) * 14]], s: [s, s]
  }))));
  // the pill: pops in on the line, lifts and glides to the middle (landing past it and settling), breathes in the hold
  // (its shadow breathes with it), and opens: its white goes clear, the city is inside it, the window grows
  const pulse = [[tHold, [gS * 100, gS * 100], E.inOut], [Math.round((tHold + tH) / 2), [gS * 103, gS * 103], E.inOut], [tH, [gS * 100, gS * 100]]];
  const feelsRoot = Cm.nul("beat 4 · feels. (the Multiverse pill)", { parent: PO, ip: tFeels, op: tEnd + 1, ks: {
    a: fc, p: [[tFeels, fc, E.hold], [tGlide, fc, GLIDE], [tGlide + 30, mid]],
    s: clean([[tFeels, [40, 40], E.spring], [tFeels + 24, [100, 100], E.hold], [tGlide, [100, 100], GLIDE], [tGlide + 30, [gS * 100, gS * 100], E.hold], ...pulse])
  } });
  const bodyO = [[tH, 100, [0.45, 0, 0.35, 1]], [tH + DISSOLVE, 0]];
  // the logo: rises into the pill as "feels." drops out of it, breathes with it in the hold, dissolves into the map
  const logoH = 0.64 * fg.h, logoK = (logoH / LOGO.h) * 100, tLogo = tDrop + 12;
  const logoGroup = (o) => group("logo · Cromatic Studios", [...LOGO.paths.map((q) => path(q)), fill(rgb(C.black), 100, 2)], {
    a: [LOGO.w / 2, LOGO.h / 2], p: o.p, s: o.s, o: o.o
  });
  const logoLift = 0.12 * logoH;
  const logo = logoGroup({
    p: [[tLogo, [fc[0], fc[1] + logoLift], RISE], [tLogo + 26, fc]],
    s: [[tLogo, [logoK * 0.94, logoK * 0.94], RISE], [tLogo + 26, [logoK, logoK], E.hold], [tH, [logoK, logoK], [0.4, 0, 0.3, 1]], [tH + DISSOLVE, [logoK * 1.06, logoK * 1.06]]],
    o: [[0, 0, E.hold], [tLogo, 0, E.linear], [tLogo + 12, 100, E.hold], [tH, 100, [0.45, 0, 0.35, 1]], [tH + DISSOLVE - 4, 0]]
  });
  const ringO = [[tEnd - 12, 100, E.linear], [tEnd - 2, 0]];
  Cm.shape("beat 4 · feels. · ring, word, body", [
    feelsLetters,
    logo,
    ...ring(winSize, fc, ringOff(tFeels, tEnd, tHold), ringO),
    group("body", [...sheen(winSize, fc, fg.w, fg.h, fc[0], fc[1], { light: 0, shade: 0.07 }), rect(winSize, fc, 9999), fill(rgb(C.white))], { o: bodyO })
  ], { parent: feelsRoot, ip: tFeels, op: tEnd + 1, ln: "ck-feels" });
  const feelsElev = [[tFeels, 0.2, E.out], [tFeels + 18, 1, E.hold], [tGlide, 1, E.inOut], [tGlide + 14, 3.2, E.inOut], [tGlide + 28, 0.35, E.out], [tGlide + 40, 1.2, E.hold], [tHold, 1.2, E.inOut], [Math.round((tHold + tH) / 2), 1.55, E.inOut], [tH, 1.2]];
  const fEks = elevKs(feelsElev);
  // r226 (Daniel: "the map behind the final pill, not the grid"): the pill opens as a hole through every layer onto the live
  // map; its shadow stays on the paper around the hole (a mask that cuts the window out of it, drawn back by the
  // shadow's own offset) until the ring goes
  const shEnd = shOff(1.2).map((v) => v / gS);
  // the hole opens at the pill's size when the handoff starts (the white still covers it: it dissolves), then grows
  const holeKeys = (cx, cy, k = 1) => [[0, roundRect(cx, cy, 0, 0, 0), E.hold], [tH - 1, roundRect(cx, cy, 0, 0, 0), E.hold], [tH, roundRect(cx, cy, fg.w * k, fg.h * k, (fg.h * k) / 2), E.hold], ...winSize.filter(([tk]) => tk >= tOpen).map(([tk, s2, e]) => [tk, roundRect(cx, cy, s2[0] * k, s2[1] * k, (s2[1] * k) / 2), e])];
  const shadowHole = holeKeys(fc[0] - shEnd[0], fc[1] - shEnd[1]).map(([tk, q, e]) => [tk, reversePath(q), e]);
  Cm.shape("beat 4 · feels. · shadow", pillShadow(winSize, fc), { parent: feelsRoot, ip: tFeels, op: tEnd + 1, ks: { p: fEks.p.map(([tt, v, ea]) => [tt, [v[0] / gS, v[1] / gS], ea]), o: clean([...fEks.o, [tEnd - 12, shO(1.2), E.linear], [tEnd - 2, 0]]) }, masks: [{ inv: true, mode: "a", pt: pathProp(shadowHole), o: prop(100), x: prop(0), nm: "window" }] });
  lines("beat 4 · that's how the right brand", b4.filter((w) => w !== feelsW), { inAt: (i) => t4 + i * 3.5, outAt: (i) => tGlide - 6 + i * 1.5 });

  /* ======================= beat 3 · nine worlds ======================= */
  const b3a = blk(["Nine worlds over", "the same streets."], { size: S3, mid: ph ? 0.19 : 0.165 });
  const b3b = blk(["One will feel", "like yours."], { size: S3, mid: ph ? 0.19 : 0.165, pill: true });
  const t3 = t(TL.B3 + 0.06), t3b = t(TL.B3 + 1.7), tPick = t(TL.B3 + 1.9), t3out = t(TL.B4 - 0.18);
  const yoursW = b3b.find((w) => w.text === "yours.");
  const yX = yoursW.lx + yoursW.x + pillShift(S3), yL = setLine(T, "yours.", S3, -0.035), yp = pillGeom(S3, yX - 0.34 * S3, yoursW.by, yL.width);
  const pw = ph ? 150 : 300, phh = pw * (ATLAS.ch / ATLAS.cw), nameS = ph ? 11 : 19;
  const kY = (yp.h / phh) * 100; // the Cromatic pill's scale when it reaches "yours."
  // "yours.": the Cromatic pill hands over to the yellow pill at its size, which springs to the word's width
  slotPill("beat 3 · yours.", { size: S3, x0: yX, by: yoursW.by, words: [["yours.", C.yellow, C.black, tPick + 22]], start: { size: [pw * kY / 100, yp.h], pos: [yp.cx, yp.cy] }, tOut: t3out, outTo: "fade", ip: tPick + 21, op: t3out + 20, id: "yours", elev: [[tPick + 22, 2.4, E.out], [tPick + 30, 0.2, E.out], [tPick + 42, 1, E.linear], [t3out, 1, E.linear]] });
  // the worlds: big picture pills (the Multiverse previews), dealt into a brick of rows on a gentle smile; the
  // Cromatic one in the middle. Laptop: three rows of three; phone: two columns, above the consent card's place
  const slots = [];
  if (ph) {
    // a phone's safe band: Safari's toolbars crop the 844-tall frame to ~664 (90 off the top and the bottom), and the
    // cookie card sits at the bottom while the opening plays: the worlds stay between y 224 and 532
    for (let r = 0; r < 5; r++) slots.push([104 - 8 * Math.sin((Math.PI * r) / 4), 254 + r * 62]);
    for (let r = 0; r < 4; r++) slots.push([286 - 6 * Math.sin((Math.PI * (r + 0.5)) / 4), 285 + r * 62]);
  } else {
    const rowX = [0, -62, 46], rowY = [372, 516, 660];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) slots.push([300 + c * 340 + rowX[r], rowY[r] + 22 * Math.cos((Math.PI * (c - 1)) / 2) - 22]);
  }
  const midSlot = ph ? 2 : 4;
  const order = [midSlot, ...slots.map((_, i) => i).filter((i) => i !== midSlot)];
  const sc = slots[midSlot], tilt = [0, -3.5, 2.5, -2, 3, 2, -3, 2.5, -1.5];
  const tC = t(TL.B3 + 0.34); // the dot lands, the Cromatic pill grows from it
  const dealt = order.slice(1).map((si) => ({ si, d: Math.hypot(slots[si][0] - sc[0], slots[si][1] - sc[1]) })).sort((a, b) => a.d - b.d);
  const rankOf = (wi) => (wi === 0 ? -1 : dealt.findIndex((x) => x.si === order[wi]));
  // the last dealt fly over the ones already down: they are higher in the stack, and their shadows fall on them
  const stack = WORLD_IDS.map((id, wi) => wi).sort((a, b) => rankOf(b) - rankOf(a));
  for (const wi of stack) {
    const si = order[wi], s0 = slots[si], chosen = wi === 0;
    const rank = rankOf(wi);
    const ti = chosen ? tC : tC + 8 + rank * 3;
    const tf = tPick + (chosen ? 0 : 2 + ((rank * 5) % 8) * 2);
    let ks, elevK;
    if (chosen) {
      ks = {
        p: [[tPick, sc, GLIDE], [tPick + 24, [yp.cx, yp.cy]]],
        s: [[ti, [10, 10], E.spring], [ti + 24, [100, 100], E.hold], [tPick, [100, 100], GLIDE], [tPick + 24, [kY, kY]]],
        o: [[0, 0, E.hold], [ti, 100, E.hold], [tPick + 22, 100, E.linear], [tPick + 28, 0]]
      };
      elevK = [[ti, 2.2, E.out], [ti + 8, 0.15, E.out], [ti + 20, 1, E.hold], [tPick, 1, E.inOut], [tPick + 10, 3, E.inOut], [tPick + 24, 2.4]];
    } else {
      const drift = (s0[0] < W / 2 ? -1 : 1) * (ph ? 30 : 60) + (rank % 2 ? 18 : -12);
      ks = {
        p: [[ti, sc, DEAL], [ti + 26, s0, E.linear], [tf, s0, FALL], [tf + 32, [s0[0] + drift, s0[1] + H * 0.75]]],
        s: [[ti, [45, 45], DEAL], [ti + 26, [100, 100]]],
        r: [[ti, -tilt[wi] * 2, DEAL], [ti + 26, tilt[wi], E.linear], [tf, tilt[wi], E.in], [tf + 32, tilt[wi] + (drift > 0 ? 28 : -28)]],
        o: [[0, 0, E.hold], [ti, 0, E.linear], [ti + 3, 100, E.hold], [tf + 20, 100, E.linear], [tf + 32, 0]]
      };
      elevK = [[ti, 3.4, E.inOut], [ti + 20, 0.15, E.out], [ti + 32, 1, E.hold], [tf, 1, E.in], [tf + 18, 4.2]];
    }
    const lop = chosen ? tPick + 30 : tf + 34;
    const nul = Cm.nul(`world · ${WORLD_NAMES[wi]}`, { ks, ip: ti - 1, op: lop, parent: PO });
    const nL = setLine(T, WORLD_NAMES[wi], nameS, -0.01), tagH = nameS * 1.7, tagW = nL.width + nameS * 1.1;
    const tagC = [-pw / 2 + phh * 0.22 + tagW / 2, phh / 2 - phh * 0.14 - tagH / 2];
    const nameBy = tagC[1] + (T.cap / T.upm) * nameS * 0.5, nameX = tagC[0] - nL.width / 2;
    const nameLetters = nL.letters.map((l) => letterGroup(T, { ...l, x: nameX + l.x }, nameS, rgb(C.black), { extra: (b, s) => ({ p: [b[0], b[1] + nameBy], s: [s, s] }) }));
    const tagFade = chosen ? [[tPick, 100, E.linear], [tPick + 8, 0]] : 100;
    Cm.shape(`world · ${WORLD_NAMES[wi]} · tag, outline, light`, [
      group("name", nameLetters, { o: tagFade }),
      group("tag", [rect([tagW, tagH], tagC, 9999), stroke(rgb(C.black), ph ? 1.2 : 1.6), fill(rgb(C.white))], { o: tagFade }),
      group("tag shadow", [rect([tagW, tagH], [tagC[0] + 1.5 * U, tagC[1] + 2.5 * U], 9999), fill(rgb("#000000"), 22)], { o: tagFade }),
      group("outline", [rect([pw, phh], [0, 0], 9999), stroke(rgb(C.black), ph ? 2 : 2.5)]),
      ...sheen([pw, phh], [0, 0], pw, phh, 0, 0, { light: 0.34, shade: 0.16 })
    ], { parent: nul, ip: ti - 1, op: lop, ln: `ck-world-${wi}` });
    const ay = ATLAS.ch * wi + ATLAS.ch / 2;
    Cm.image(`world · ${WORLD_NAMES[wi]} · picture`, ATL, {
      parent: nul, ip: ti - 1, op: lop,
      ks: { a: [ATLAS.cw / 2, ay], p: [0, 0], s: [(pw / ATLAS.cw) * 100, (pw / ATLAS.cw) * 100] },
      masks: [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(ATLAS.cw / 2, ay, ATLAS.cw, ATLAS.ch, ATLAS.ch / 2) }, o: prop(100), x: prop(0), nm: "pill" }]
    });
    Cm.shape(`world · ${WORLD_NAMES[wi]} · shadow`, pillShadow([pw, phh], [0, 0]), { parent: nul, ip: ti - 1, op: lop, ks: elevKs(clean(elevK)) });
  }
  lines("beat 3 · nine worlds over the same streets", b3a, { size: S3, inAt: (i) => t3 + i * 3.5, outAt: (i) => t3b - 8 + i * 1.2 });
  lines("beat 3 · one will feel like", b3b.filter((w) => w !== yoursW), { size: S3, inAt: (i) => t3b + i * 3.5, outAt: (i) => t3out + i * 1.2 });

  /* ======================= beat 2 · but someone could remember a place / facade / brand ======================= */
  const b2 = blk(ph ? ["But someone", "could remember", "a place."] : ["But someone could", "remember a place."], { pill: true });
  const placeW = b2.find((w) => w.text === "place.");
  const t2 = t(TL.B2), tP = t(TL.B2 + 0.28), tF = t(TL.B2 + 0.93), tB = t(TL.B2 + 1.48), t2out = t(TL.B3 - 0.18);
  const px0 = placeW.lx + placeW.x + pillShift(S);
  // the brand pill, now a dot, deals the worlds: it flies to the middle of the worlds
  const spGeom = pillGeom(S, px0 - 0.34 * S, placeW.by, setLine(T, "brand.", S, -0.035).width);
  flyingDot("beat 3 · the dot that deals the worlds", { from: [spGeom.cx, spGeom.cy], to: sc, tAppear: t2out + 11, t0: t2out + 12, t1: tC, d: 0.22 * S, lift: ph ? 0.08 * H : 0.12 * H, ip: t2out + 11, op: tC + 2 });
  // the colour has a job: which thing is remembered; the text stays black on every colour (Daniel)
  const sp = slotPill("beat 2 · place. facade. brand.", { x0: px0, by: placeW.by, words: [["place.", C.green, C.black, tP], ["facade.", C.blue, C.black, tF], ["brand.", C.yellow, C.black, tB]], tOut: t2out, outTo: "dot", ip: tP - 1, op: t2out + 13, id: "word" });
  lines("beat 2 · but someone could remember a", b2.filter((w) => w !== placeW), { inAt: (i) => t2 + (i > 2 ? 10 : 0) + i * 3.5, outAt: (i) => t2out + i * 1.2 });

  /* ======================= beat 1 · nobody remembers a thumbnail ======================= */
  const b1 = blk(ph ? ["Nobody", "remembers a", "thumbnail."] : ["Nobody remembers", "a thumbnail."]);
  const thumbW = b1.find((w) => w.text === "thumbnail.");
  const t1 = t(TL.B1), tShrink = t(0.95), tCard = t(1.05), tFlip = t(1.4), t1out = t(1.42);
  const k = ph ? 0.42 : 0.34;
  const cx = thumbW.lx + thumbW.x + thumbW.w / 2, cy = thumbW.by - (T.xh / T.upm) * S * 0.5;
  flyingDot("beat 2 · the dot that becomes the pill", { from: [cx, cy], to: [sp.g[0].cx, sp.g[0].cy], tAppear: tFlip + 5, t0: tFlip + 9, t1: tP, d: sp.dot, lift: ph ? 0.05 * H : 0.08 * H, ip: tFlip + 4, op: tP + 2 });
  // "thumbnail." shrinks into a small grey card, which flips over and is gone; a dot is what is left of it
  const thumbNull = Cm.nul("beat 1 · thumbnail (camera)", { parent: PO, ks: { a: [cx, cy], p: [cx, cy], s: [[tShrink, [100, 100], [0.6, 0, 0.25, 1]], [tShrink + 18, [k * 100, k * 100], E.hold], [tFlip, [k * 100, k * 100], [0.55, 0, 0.9, 0.4]], [tFlip + 9, [0, k * 100]]] }, op: tFlip + 10 });
  const ti1 = t1 + 3 * 4;
  Cm.shape("beat 1 · thumbnail. (word)", [group("thumbnail.", thumbW.letters.map((L, j) => letterAt(L, thumbW.lx, thumbW.by, S, C.black, riseKeys(ti1 + j, null, S))))], { parent: thumbNull, op: tFlip + 10, masks: [lineClip([thumbW], S)] });
  const cw = (thumbW.w * k + (ph ? 22 : 44)) / k, chh = cw * (ph ? 0.5 : 0.56), lw = (ph ? 1.5 : 2) / k, cardC = [cx, cy - chh * 0.12], cardR = (ph ? 8 : 14) / k;
  const cardS = [[tCard, [86, 86], E.spring], [tCard + 20, [100, 100]]];
  Cm.shape("beat 1 · the card", [
    group("picture", [
      group("sun", [ellipse([cw * 0.09, cw * 0.09], [cx + cw * 0.26, cy - chh * 0.42]), stroke(rgb(C.black), lw), fill(rgb(C.white))]),
      group("hill", [path(poly([[cx - cw * 0.36, cy - chh * 0.16], [cx - cw * 0.1, cy - chh * 0.44], [cx + cw * 0.06, cy - chh * 0.28], [cx + cw * 0.17, cy - chh * 0.36], [cx + cw * 0.36, cy - chh * 0.16]])), stroke(rgb(C.black), lw), fill(rgb(C.white))])
    ], { o: [[0, 0, E.hold], [tCard + 8, 0, E.linear], [tCard + 14, 100]] }),
    group("frame", [rect([cw, chh], cardC, cardR), stroke(rgb(C.black), (ph ? 2 : 2.5) / k), fill(rgb(C.bar))])
  ], { parent: thumbNull, ip: tCard, op: tFlip + 10, ks: { a: [cx, cy], p: [cx, cy], s: cardS, o: [[tCard, 0, E.linear], [tCard + 5, 100]] } });
  // the card's shadow: it arrives lifted, and lifts more as it flips away
  const cardElev = [[tCard, 2.4, E.out], [tCard + 16, 1, E.hold], [tFlip - 4, 1, E.in], [tFlip + 9, 2.8]];
  Cm.shape("beat 1 · the card · shadow", SPREAD.map((sp2, n) => group("shadow " + n, [rect([cw + (2 * sp2) / k, chh + (2 * sp2) / k], cardC, cardR + sp2 / k), fill(rgb("#2a2118"), SHA[n])])), { parent: thumbNull, ip: tCard, op: tFlip + 10, ks: { a: [cx, cy], p: cardElev.map(([tt, e, ea]) => [tt, [cx + shOff(e)[0] / k, cy + shOff(e)[1] / k], ea]), s: cardS, o: clean([[tCard, 0, E.linear], [tCard + 5, shO(2.4), E.linear], ...cardElev.map(([tt, e, ea]) => [tt, shO(e), ea]).filter((x) => x[0] > tCard + 5)]) } });
  lines("beat 1 · nobody remembers a", b1.filter((w) => w !== thumbW), { inAt: (i) => t1 + i * 4, outAt: (i) => t1out + i * 1.5 });

  /* ======================= the paper: the key light across it, the grid (it recedes while the worlds are up) ======================= */
  const keyLight = (nm, ip, op, o = 100, masks) => Cm.shape(nm, [
    group("light", [rect([W * 1.2, H * 1.2], mid), gfill({ type: 2, s: [W * 0.12, -H * 0.05], e: [W * 0.95, H * 0.85], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, 0.62], [0.55, 0.12], [1, 0]] })]),
    group("falloff", [rect([W * 1.2, H * 1.2], mid), gfill({ type: 1, s: [W * 0.45, H * 0.4], e: [W, H], stops: [[0, "#3a2c1c"], [1, "#3a2c1c"]], alphas: [[0, 0], [1, 0.07]] })])
  ], { ip, op, ks: { o }, masks });
  // the window: a hole through the paper and its light (an inverted mask; its path runs the other way round from the
  // canvas renderer's comp rectangle, so the non-zero clip leaves the hole open: the worker's canvas renderer has no
  // subtract mode, and drew the paper only inside the window, the grid Daniel saw in the final pill)
  const winK = holeKeys(mid[0], mid[1], gS).map(([tk, q, e]) => [tk, reversePath(q), e]);
  const hole = () => [{ inv: true, mode: "a", pt: pathProp(winK), o: prop(100), x: prop(0), nm: "window" }];
  keyLight("paper · key light", 0, tEnd + 1, [[tH, 100, E.linear], [tEnd - 6, 0]], hole());
  const gridO = [[t(TL.B3), 100, E.inOut], [t(TL.B3 + 0.5), 55, E.hold], [t(TL.B4 - 0.2), 55, E.inOut], [t(TL.B4 + 0.3), 100]];
  // the paper bleeds past the edges (the camera moves it) and has the window cut in it (the camera is still by then)
  gridPaper(Cm, { op: tEnd + 1, parent: PG0, gridO, bleed: 40 * U, masks: hole() });

  /* ======================= the short version: the pill alone, popping in, then the hold ======================= */
  const shortRoot = Cm.nul("short · the pill", { ip: tS0, op: tS1 + 1, ks: { a: fc, p: mid, s: [[tS0, [gS * 30, gS * 30], E.spring], [tS1 - 2, [gS * 100, gS * 100]]] } });
  Cm.shape("short · ring, body", [
    logoGroup({ p: fc, s: [logoK, logoK], o: 100 }),
    ...ring([fg.w, fg.h], fc, ringOff(tS0, tS1 + 1, tS1)),
    group("body", [...sheen([fg.w, fg.h], fc, fg.w, fg.h, fc[0], fc[1], { light: 0, shade: 0.07 }), rect([fg.w, fg.h], fc, 9999), fill(rgb(C.white))])
  ], { parent: shortRoot, ip: tS0, op: tS1 + 1, ln: "ck-short" });
  const sEks = elevKs([[tS0, 0.2, E.out], [tS1 - 2, 1.2]]);
  Cm.shape("short · shadow", pillShadow([fg.w, fg.h], fc), { parent: shortRoot, ip: tS0, op: tS1 + 1, ks: { p: sEks.p.map(([tt, v, ea]) => [tt, [v[0] / gS, v[1] / gS], ea]), o: sEks.o } });
  keyLight("short · key light", tS0, tS1 + 1);
  gridPaper(Cm, { ip: tS0, op: tS1 + 1, nm: "short · ground", bleed: 40 * U });

  const json = Cm.json();
  json.cromatic = { v: 3, markers: { words: [0, tHold], hold: [tHold, tH], handoff: [tH, tEnd], short: [tS0, tS1] }, handoff: { kind: "window" }, pill: [+fg.w.toFixed(1), +fg.h.toFixed(1), gS, +ringW.toFixed(2)] };
  return json;
}

function rainbowAt(u) {
  const n = RAINBOW.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
  const a = parseInt(RAINBOW[i].slice(1), 16), b = parseInt(RAINBOW[i + 1].slice(1), 16);
  const ch = (s) => Math.round((((a >> s) & 255) * (1 - f)) + (((b >> s) & 255) * f));
  return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
}
// a closed bezier path run the other way round (an inverted mask's hole: see the window)
function reversePath(p) { return { c: p.c, v: [...p.v].reverse(), i: [...p.o].reverse(), o: [...p.i].reverse() }; }
function valAt(keys, tk) { let v = keys[0][1]; for (const k of keys) if (k[0] <= tk) v = k[1]; return v; }
function clean(k) {
  const s = [...k].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const x of s) { if (out.length && out[out.length - 1][0] === x[0]) out[out.length - 1] = x; else out.push(x); }
  return out.map((x, i) => (i === out.length - 1 ? [x[0], x[1]] : x));
}
