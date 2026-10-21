// Cromatic · stories in Lottie · v3 (TASK-065b): the words go back ON the screen (the gate: words rendered into the
// engine's scene did not pass), set as film titles. The house faces only: Google Sans for the display, JetBrains Mono
// for the metadata. What the three stories share:
//   reveal(...)    a display line rising out of its own baseline (a mask: the letters come up from nowhere, no fade),
//                  staggered, out the same way upward; or cut on and off (dur 0: a smash cut)
//   typed(...)     a mono line typed on, a block cursor running ahead of it, then out
//   rule(...)      a hairline drawn on and retracted
//   chip(...)      a mono label on a chip the size of it (cards sized to content)
//   shade(...)     a soft dark scrim under a block of type (legibility on the busy frames; never a box)
//   swapLine(...)  "New ___." whose last word swaps in a pill and its card resizing to each word, crisp (no bounce)
import { group, rect, fill, stroke, gfill, rgb, E, prop, path as shp, poly, trim, roundRect, pathProp, C } from "../../../lottie-ui/_source/lib/ui.mjs";
import { setLine } from "../../../intro-lottie/_source/lib/type.mjs";
import { letterGroup } from "../../../intro-lottie/_source/lib/text.mjs";
import { W, H, T, monoLine } from "./build.mjs";

export const INK = "#F6F3EC"; // the titles' white: warm, a print's paper rather than a screen's
export const EXPO = [0.16, 1, 0.3, 1], SNAP = [0.7, 0, 0.84, 0]; // in: a long expo landing; out: an accelerating snap
export const tw = (text, size, tracking = -0.045) => setLine(T, text, size, tracking).width;
const MONO_ADV = 0.6; // JetBrains Mono's advance (em)
export const monoW = (text, size, tracking = 0.18) => [...text].length * size * (MONO_ADV + tracking) - tracking * size;

// ---- a display line out of its baseline ----
// ink: a colour, or (j, ch) => colour | colour keys; align left | right | center about x
export function reveal(Cm, { text, size, x, by, ink = INK, t0, tOut, align = "left", tracking = -0.045, stagger = 1.4, dur = 24, outDur = 13, outStagger = 0.7, up = 1.08, nm = "title", parent, ip, op, mask = true, ks }) {
  const L = setLine(T, text, size, tracking), lx = align === "right" ? x - L.width : align === "center" ? x - L.width / 2 : x;
  const n = L.letters.length;
  const groups = L.letters.map((l, j) => {
    const col = typeof ink === "function" ? ink(j, l.ch) : ink;
    const g = letterGroup(T, { ...l, x: lx + l.x }, size, Array.isArray(col) && Array.isArray(col[0]) ? rgb(C.white) : rgb(col), {
      extra: (b, s) => {
        const at = [b[0], b[1] + by], below = [b[0], b[1] + by + up * size], above = [b[0], b[1] + by - up * size];
        const ti = t0 + Math.round(j * stagger), to = tOut == null ? null : tOut + Math.round(j * outStagger);
        const p = dur ? [[ti, below, EXPO], [ti + dur, at, ...(to == null ? [] : [E.hold])]] : [[ti, at, ...(to == null ? [] : [E.hold])]];
        if (to != null && outDur) p.push([to, at, SNAP], [to + outDur, above]);
        const o = [[0, 0, E.hold], [ti, 100, ...(to == null ? [] : [E.hold])]];
        if (to != null) o.push([to + (outDur || 0), 0]);
        return { p, s: [s, s], o };
      }
    });
    // keyed ink (a flicker): the fill's colour keys
    if (Array.isArray(col) && Array.isArray(col[0])) g.it.forEach((it) => { if (it.ty === "fl") it.c = prop(col.map(([t, c, e]) => [t, rgb(c), e])); });
    return g;
  });
  const top = by - size * 1.0, bot = by + size * 0.3, pad = size * 0.25;
  const masks = mask ? [{ inv: false, mode: "a", pt: pathProp(poly([[lx - pad, top], [lx + L.width + pad, top], [lx + L.width + pad, bot], [lx - pad, bot]])), o: prop(100), x: prop(0), nm: "baseline" }] : undefined;
  const end = tOut == null ? (op ?? Cm.op) : tOut + Math.round(n * outStagger) + outDur + 1;
  const layer = Cm.shape(nm, groups, { parent, ip: ip ?? t0, op: op ?? end, masks, ks });
  return { x: lx, w: L.width, layer };
}

// ---- a mono line typed on ----
export function typed(Cm, { text, size = 28, x, by, ink = INK, t0, tOut, rate = 1, tracking = 0.18, align = "left", cursor = true, nm = "mono", parent, o = 100, outRate = 0.5 }) {
  const w = monoW(text, size, tracking), lx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
  const M = monoLine(text, size, ink, lx, by, { tracking });
  // each visible letter on at its turn (the spaces count in the rhythm)
  let vis = 0; const order = []; [...text].forEach((ch, i) => { if (ch !== " ") order.push(i); });
  M.groups.forEach((g, j) => {
    const i = order[j], ti = t0 + Math.round(i * rate), to = tOut == null ? null : tOut + Math.round((order.length - 1 - j) * outRate);
    const keys = [[0, 0, E.hold], [ti, o, ...(to == null ? [] : [E.hold])]]; if (to != null) keys.push([to, 0]);
    g.it[g.it.length - 1].o = prop(keys); vis++;
  });
  const items = [...M.groups];
  if (cursor) {
    const n = [...text].length, step = size * (MONO_ADV + tracking), tEnd = t0 + Math.round(n * rate);
    const px = []; for (let i = 0; i <= n; i++) px.push([t0 + Math.round(i * rate), [lx + i * step + size * 0.3, by - size * 0.36], E.hold]);
    px[px.length - 1] = [px[px.length - 1][0], px[px.length - 1][1]];
    const blink = [[0, 0, E.hold], [t0, 100, E.hold]]; for (let k = 0; k < 3; k++) blink.push([tEnd + 8 + k * 16, 0, E.hold], [tEnd + 16 + k * 16, 100, E.hold]); blink.push([tEnd + 56, 0]);
    items.unshift(group("cursor", [rect([size * 0.58, size * 1.02], [0, 0]), fill(rgb(C.yellow))], { p: px, o: blink }));
  }
  Cm.shape(nm, items, { parent, ip: t0, op: tOut == null ? Cm.op : tOut + Math.round(order.length * outRate) + 2 });
  return { x: lx, w };
}

// ---- a hairline ----
export function rule(Cm, { x, y, w, t0, tOut, ink = INK, sw = 3, dur = 18, nm = "rule", parent, o = 100 }) {
  const e = [[t0, 0, EXPO], [t0 + dur, 100]], s = tOut == null ? 0 : [[tOut, 0, SNAP], [tOut + 12, 100]];
  Cm.shape(nm, [group("r", [shp(poly([[x, y], [x + w, y]], false)), stroke(rgb(ink), sw, o, { lc: 1 }), trim(s, e)])], { parent, ip: t0, op: tOut == null ? Cm.op : tOut + 13 });
}

// ---- a mono label on a chip its size ----
// cut: on and off with the frame (a smash cut), no growth
export function chip(Cm, { text, size = 26, x, by, fillHex = C.yellow, ink = C.black, t0, tOut, tracking = 0.16, padX = 0.62, nm = "chip", parent, rot = 0, ks, cut = false }) {
  const w = monoW(text, size, tracking) + 2 * padX * size, h = size * 1.7, cy = by - size * 0.36;
  const M = monoLine(text, size, ink, x + padX * size, by, { tracking });
  const box = group("box", [rect([w, h], [x + w / 2, cy], 6), fill(rgb(fillHex))], cut ? {} : { a: [x, cy], p: [x, cy], s: [[t0, [0, 100], EXPO], [t0 + 14, [100, 100], ...(tOut == null ? [] : [E.hold])], ...(tOut == null ? [] : [[tOut + 4, [100, 100], SNAP], [tOut + 14, [0, 100]]])] });
  const txt = group("text", M.groups, cut ? {} : { o: [[0, 0, E.hold], [t0 + 6, 100, ...(tOut == null ? [] : [E.hold])], ...(tOut == null ? [] : [[tOut, 0]])] });
  Cm.shape(nm, [txt, box], { parent, ip: t0, op: tOut == null ? Cm.op : cut ? tOut : tOut + 15, ks: { ...(rot ? { r: rot, a: [x, cy], p: [x, cy] } : {}), ...(ks || {}) } });
  return { w, h };
}

// ---- a scrim under the type ----
export function shade(Cm, { y0, y1, t0, t1, a = 0.62, from = "bottom", col = "#05060C", nm = "shade", fade = 10 }) {
  const top = from === "bottom", stops = top ? [[0, 0], [0.5, a * 0.75], [1, a]] : [[0, a], [0.5, a * 0.75], [1, 0]];
  Cm.shape(nm, [group("s", [rect([W + 40, y1 - y0], [W / 2, (y0 + y1) / 2]), gfill({ type: 1, s: [0, y0], e: [0, y1], stops: [[0, col], [1, col]], alphas: stops })])], { ip: t0, op: t1, ks: { o: [[t0, 0, E.linear], [t0 + fade, 100, E.hold], [t1 - fade, 100, E.linear], [t1, 0]] } });
}

// ---- "New ___.": the last word swaps in its pill, the card resizing to it ----
// words: [[text, pillHex, ink, t]]; lead: the first line ("Same street."); pre: the line's first word ("New")
export function swapLine(Cm, { lead, pre, words, S = 96, x = 72, by1, tIn, tOut, cardHex = "#0B0B0F", nm = "line" }) {
  const by2 = by1 + S * 1.16, padX = 0.3 * S, ph = 1.12 * S, x0 = x + tw(pre, S, -0.03) + S * 0.26 + padX;
  const geo = words.map(([w]) => { const tw0 = tw(w.replace(/\.$/, ""), S, -0.035), dot = w.endsWith(".") ? tw(".", S, -0.035) : 0; return { w: tw0 + 2 * padX, tw: tw0, dot }; });
  const leadW = tw(lead, S, -0.03), pad = 36;
  const cardW = (k) => Math.max(leadW, x0 - padX - x + geo[k].w + geo[k].dot + S * 0.04) + 2 * pad;
  const cy0 = by1 - S * 1.02, ch = by2 - by1 + S * 1.42, t0 = words[0][3];
  // the card: in from the left with the one bounce of the line; then its width follows the word (crisp); drawn last
  // (one line's height until "New" comes, then the two)
  const w1 = leadW + 2 * pad, h1 = S * 1.42;
  const sizeK = [[tIn, [w1, h1], E.hold], [t0 - 8, [w1, h1], EXPO], [t0 + 8, [cardW(0), ch], E.hold]], posK = [[tIn, [x - pad + w1 / 2, cy0 + h1 / 2], E.hold], [t0 - 8, [x - pad + w1 / 2, cy0 + h1 / 2], EXPO], [t0 + 8, [x - pad + cardW(0) / 2, cy0 + ch / 2], E.hold]];
  words.forEach(([, , , t], k) => { if (!k) return; sizeK.push([t - 2, [cardW(k - 1), ch], EXPO], [t + 14, [cardW(k), ch], E.hold]); posK.push([t - 2, [x - pad + cardW(k - 1) / 2, cy0 + ch / 2], EXPO], [t + 14, [x - pad + cardW(k) / 2, cy0 + ch / 2], E.hold]); });
  const fin = (a) => { a[a.length - 1] = [a[a.length - 1][0], a[a.length - 1][1]]; return a; };
  reveal(Cm, { text: lead, size: S, x, by: by1, t0: tIn + 6, tOut, tracking: -0.03, nm: `${nm} · lead`, ks: { r: -2, a: [x, by1], p: [x, by1] } });
  reveal(Cm, { text: pre, size: S, x, by: by2, t0: t0 - 4, tOut, tracking: -0.03, nm: `${nm} · pre`, ks: { r: -2, a: [x, by1], p: [x, by1] } });
  // the pill: its width and colour per word (the first pops, the rest slide), its words in and out of it
  const pc = (k) => [x0 - padX + geo[k].w / 2, by2 - 0.355 * S];
  const pS = [[t0, [geo[0].w * 0.6, ph * 0.6], E.spring], [t0 + 20, [geo[0].w, ph], E.hold]], pP = [[t0, pc(0), E.hold]], pF = [];
  words.forEach(([, hex, , t], k) => { pF.push([k ? t + 2 : t, rgb(hex), E.hold]); if (!k) return; pS.push([t - 2, [geo[k - 1].w, ph], EXPO], [t + 14, [geo[k].w, ph], E.hold]); pP.push([t - 2, pc(k - 1), EXPO], [t + 14, pc(k), E.hold]); });
  pS.push([tOut, [geo[geo.length - 1].w, ph], SNAP], [tOut + 12, [geo[geo.length - 1].w * 0.7, ph * 0.7]]);
  const valAt = (keys, t) => { let v = keys[0][1]; for (const kk of keys) if (kk[0] <= t) v = kk[1]; return v; };
  const maskK = pS.map(([t, sz, e]) => { const c = valAt(pP, t); return [t, roundRect(c[0], c[1], sz[0], sz[1], sz[1] / 2), e]; });
  const slots = words.map(([w, , ink, t], k) => {
    const core = w.replace(/\.$/, ""), next = k < words.length - 1 ? words[k + 1][3] - 2 : tOut;
    const L = setLine(T, core, S, -0.035);
    return group(core, L.letters.map((l, j) => letterGroup(T, { ...l, x: x0 + l.x }, S, rgb(ink), { extra: (b) => {
      const at = [b[0], b[1] + by2], below = [b[0], b[1] + by2 + 0.7 * S], above = [b[0], b[1] + by2 - 0.7 * S], ti = t + (k ? 2 : 6) + j, to = next + Math.round(j * 0.5);
      return { p: [[ti, below, EXPO], [ti + 16, at, E.hold], [to, at, SNAP], [to + 10, above]], o: [[0, 0, E.hold], [ti, 100, E.hold], [to + 10, 0]] };
    } })));
  });
  Cm.shape(`${nm} · words`, slots, { ip: t0, op: tOut + 14, ks: { r: -2, a: [x, by1], p: [x, by1] }, masks: [{ inv: false, mode: "a", pt: pathProp(fin(maskK)), o: prop(100), x: prop(0), nm: "pill" }] });
  // the full stop rides after the pill
  const dotK = [[t0, [x0 + geo[0].w - padX + S * 0.02, by2], E.hold]]; words.forEach(([, , , t], k) => { if (k) dotK.push([t - 2, [x0 + geo[k - 1].w - padX + S * 0.02, by2], EXPO], [t + 14, [x0 + geo[k].w - padX + S * 0.02, by2], E.hold]); });
  const dotL = setLine(T, ".", S, -0.035);
  Cm.shape(`${nm} · stop`, [group("stop", [letterGroup(T, { ...dotL.letters[0], x: 0 }, S, rgb(INK))], { p: fin(dotK), o: [[0, 0, E.hold], [t0 + 10, 100, E.hold], [tOut, 0]] })], { ip: t0, op: tOut + 14, ks: { r: -2, a: [x, by1], p: [x, by1] } });
  Cm.shape(`${nm} · pill`, [group("pill", [rect(fin(pS), fin(pP), 9999), stroke(rgb(C.black), 5), fill(pF.length > 1 ? fin(pF) : pF[0][1])])], { ip: t0, op: tOut + 14, ks: { r: -2, a: [x, by1], p: [x, by1] } });
  // (the card last: under its words)
  Cm.shape(`${nm} · card`, [group("card", [rect(fin(sizeK), fin(posK), 24), fill(rgb(cardHex), 92)])], { ip: tIn, op: tOut + 14, ks: { a: [x - pad, cy0], p: [[tIn, [x - pad - 60, cy0], [0.2, 1.15, 0.3, 1]], [tIn + 20, [x - pad, cy0], E.hold], [tOut, [x - pad, cy0], SNAP], [tOut + 12, [x - pad - 40, cy0]]], r: [[tIn, -6, [0.2, 1.2, 0.3, 1]], [tIn + 22, -2]], o: [[tIn, 0, E.linear], [tIn + 5, 100, E.hold], [tOut + 4, 100, E.linear], [tOut + 12, 0]] } });
  return { by2 };
}
