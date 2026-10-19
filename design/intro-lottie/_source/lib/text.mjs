// Cromatic opening · text blocks as Lottie shape layers, with the house motion for letters and words.
import { group, fill, rgb, prop, E, tr } from "./lottie.mjs";
import { glyphShapes, words as setWords } from "./type.mjs";

// one letter as a group: its contours in font units, scaled to size, pivot on the middle of its x-height
export function letterGroup(T, L, size, color, { enter, extra } = {}) {
  const gs = glyphShapes(T, L.ch);
  const k = size / T.upm;
  const ax = gs.adv / 2, ay = -T.xh / 2;
  const base = [L.x + ax * k, ay * k];
  const items = gs.contours.map((c) => ({ ty: "sh", d: 1, ks: { a: 0, k: c } }));
  items.push({ ty: "fl", c: prop(color), o: prop(100), r: 1, bm: 0 });
  const t = { p: base, a: [ax, ay], s: [k * 100, k * 100] };
  if (enter) Object.assign(t, enter(base, k * 100));
  if (extra) Object.assign(t, extra(base, k * 100));
  return { ty: "gr", nm: L.ch, it: [...items, tr(t)] };
}

// the house entrance for a letter: up from .42em, from .96 scale, opacity in, on a long ease-out (the site's i4in)
export const riseIn = (t0, size, { dy = 0.42, dur = 34, ease = E.out, s0 = 0.96, fade = 14 } = {}) => (base, s) => ({
  p: [[t0, [base[0], base[1] + dy * size], ease], [t0 + dur, base]],
  s: [[t0, [s * s0, s * s0], ease], [t0 + dur, [s, s]]],
  o: [[t0, 0, E.linear], [t0 + fade, 100]]
});

// a word: letters with a stagger; returns a group with its own transform (for word-level exits)
export function wordGroup(T, w, size, color, { t0, stagger = 1, enter = riseIn, enterOpts = {}, wordT = {} } = {}) {
  const ls = w.letters.map((L, j) => letterGroup(T, L, size, color, { enter: t0 == null ? null : enter(t0 + j * stagger, size, enterOpts) }));
  return { ty: "gr", nm: w.text, it: [...ls, tr(wordT)] };
}

// lay a block of lines at (x, y) = left of the first baseline; returns positioned words with their boxes
// pillLines: indexes of lines that hold a pill; like an inline-block in CSS, the pill makes its line box taller, so
// the line sits lower by `pillGap` em (the pill clears the descenders of the line above)
export function block(T, lines, { x, y, size, leading = 1.0, tracking = -0.035, align = "left", width, pillLines = [], pillGap = 0.13 } = {}) {
  const out = [];
  let extra = 0;
  lines.forEach((text, li) => {
    const L = setWords(T, text, size, tracking);
    const lx = align === "left" ? x : align === "center" ? x + (width - L.width) / 2 : x + width - L.width;
    if (pillLines.includes(li) && li > 0) extra += pillGap * size;
    const by = y + li * size * leading + extra;
    for (const w of L.words) out.push({ ...w, line: li, lx, by, box: [lx + w.x, by - T.cap * size / T.upm, w.w, T.cap * size / T.upm] });
    out.lineWidths = (out.lineWidths || []).concat(L.width);
  });
  return out;
}
