// Cromatic · the site's Lottie layer (lottie-ui, r231+): the helpers every piece shares. It imports the intro's own
// writer, kit and type (design/intro-lottie/_source/lib, read only: another agent owns them) and adds what the site's
// pieces need on top: the intro's depth (soft stacked shadows, the key light) as functions of their own, type set from
// Google Sans outlines, a union outline for clouds, confetti, a pixel grid.
import { Comp, group, rect, ellipse, fill, gfill, stroke, trim, rgb, E, prop, path, poly, roundRect, circlePath, pathProp, f, FPS, rng, tr } from "../../../intro-lottie/_source/lib/lottie.mjs";
import { C } from "../../../intro-lottie/_source/lib/kit.mjs";
import { letterGroup } from "../../../intro-lottie/_source/lib/text.mjs";
import { setLine, loadType } from "../../../intro-lottie/_source/lib/type.mjs";
export { Comp, group, rect, ellipse, fill, gfill, stroke, trim, rgb, E, prop, path, poly, roundRect, circlePath, pathProp, f, FPS, rng, tr, C, letterGroup, setLine, loadType };

// the intro's easings (directions/A2.mjs): a rise that overshoots a hair, an exit that accelerates away, a glide that
// lands past and settles, a deal, a fall
export const RISE = [0.18, 1.16, 0.32, 1], EXIT = [0.55, 0, 0.85, 0.35], GLIDE = [0.62, 0, 0.22, 1.08], DEAL = [0.22, 1.12, 0.32, 1], FALL = [0.5, 0, 0.92, 0.55];
export const LILAC = "#B098C8", SHADOW = "#2a2118";

// keys sorted, one per frame, the last without an easing (lottie-web reads an easing on the last key as a hold)
export function clean(k) {
  const s = [...k].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const x of s) { if (out.length && out[out.length - 1][0] === x[0]) out[out.length - 1] = x; else out.push(x); }
  return out.map((x, i) => (i === out.length - 1 ? [x[0], x[1]] : x));
}

/* ---------- depth: the intro's numbers (A2), as functions ---------- */
// elevation e (0 lying on the paper, 1 resting, 3-4 in flight) -> the shadow's offset away from the top-left key light,
// and its strength (the higher, the softer and fainter). U is the artboard's unit (1 laptop, .55 phone)
export const shOff = (e, U = 1) => [(2 + 5 * e) * U, (3.5 + 8 * e) * U];
export const shO = (e) => Math.max(38, 100 - 16 * e);
export const SPREAD = [1, 3, 6, 10, 15, 21], SHA = [7, 6.2, 5.2, 4, 2.8, 1.8];
export const elevKs = (elevK, U = 1, k = 1) => ({ p: elevK.map(([t, e, ea]) => [t, shOff(e, U).map((v) => v * k), ea]), o: elevK.map(([t, e, ea]) => [t, shO(e), ea]) });
// a soft shadow under a rounded rectangle: stacked shapes, growing and fading (no blur: cheap in the worker)
export const softShadow = (size, pos, radius = 9999, U = 1, { k = 1 } = {}) => SPREAD.map((sp0, n) => {
  const sp = sp0 * U * k;
  return group("shadow " + n, [rect([size[0] + 2 * sp, size[1] + 2 * sp], pos, radius === 9999 ? 9999 : radius + sp), fill(rgb(SHADOW), SHA[n])]);
});
// the key light on a shape: a sheen from the top left and a little shade at the bottom right, inside its outline
export const sheen = (shapeFn, w, h, cx, cy, { light = 0.3, shade = 0.1 } = {}) => [
  ...(light > 0 ? [group("sheen", [shapeFn(), gfill({ s: [cx - w * 0.5, cy - h * 0.62], e: [cx - w * 0.05, cy + h * 0.25], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, light], [1, 0]] })])] : []),
  ...(shade > 0 ? [group("shade", [shapeFn(), gfill({ s: [cx + w * 0.1, cy - h * 0.1], e: [cx + w * 0.5, cy + h * 0.62], stops: [[0, "#000000"], [1, "#000000"]], alphas: [[0, 0], [1, shade]] })])] : [])
];

/* ---------- type ---------- */
// a line of letters (Google Sans outlines) whose first letter starts at x on baseline by; keys(base, scale, j) gives each
// letter its own transform keys (a rise, a hold); returns { groups, width }
export function line(T, text, size, color, x, by, { tracking = -0.035, keys } = {}) {
  const L = setLine(T, text, size, tracking);
  const col = typeof color === "string" ? rgb(color) : color;
  const groups = L.letters.map((l, j) => letterGroup(T, { ...l, x: x + l.x }, size, col, { extra: (b, s) => (keys ? keys([b[0], b[1] + by], s, j) : { p: [b[0], b[1] + by], s: [s, s] }) }));
  return { groups, width: L.width };
}
export const capH = (T, size) => (T.cap / T.upm) * size;
// the house rise for one letter: from .42 em below, a hair squashed, with the overshoot (the intro's riseKeys)
export const riseKeys = (t0, size, { dur = 26, up = 0.42, fade = 8 } = {}) => (b, s) => ({
  p: [[t0, [b[0], b[1] + up * size], RISE], [t0 + dur, b]],
  s: [[t0, [s * 0.94, s * 1.1], E.out], [t0 + Math.round(dur * 0.75), [s, s]]],
  o: [[0, 0, E.hold], [t0, 0, E.linear], [t0 + fade, 100]]
});

/* ---------- union outline: one black contour around many overlapping shapes (clouds) ---------- */
// shapes: a function returning fresh shape items (ellipses, rects) each call; the outline is their stroke at twice the
// width drawn under their fill, so only the outer half of it shows, around the union
export const unionOutline = (shapes, fillHex, sw, { o = 100 } = {}) => [
  group("fill", [...shapes(), fill(rgb(fillHex), o)]),
  group("outline", [...shapes(), stroke(rgb(C.black), sw * 2, o, { lc: 1, lj: 1 })])
];

/* ---------- small marks ---------- */
// a four-point star (the site's punctuation) of radius r at (cx, cy)
export function starPath(cx, cy, r, inner = 0.34) {
  const pts = [];
  for (let i = 0; i < 8; i++) { const a = (Math.PI / 4) * i - Math.PI / 2, rr = i % 2 ? r * inner : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return poly(pts);
}
export const diamondPath = (cx, cy, r) => poly([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]);
// a check mark (stroke) inside a circle of diameter d at (cx, cy)
export const checkPath = (cx, cy, d) => poly([[cx - d * 0.24, cy + d * 0.02], [cx - d * 0.06, cy + d * 0.2], [cx + d * 0.26, cy - d * 0.18]], false);

/* ---------- confetti in the brand's shapes ---------- */
// a burst from a box (where the end card is): pills, dots, diamonds, stars and rings in the brand's colours, outlined,
// thrown up and out, falling with gravity, tumbling (a flip on x) and spinning. Times in frames.
export function confetti(Cm, { n = 46, box, t0, life = 100, U = 1, seed = 11, parent, nm = "confetti", colors, rise = [0.12, 0.34], fall = 0.32, spread = 0.5 } = {}) {
  const R = rng(seed), cols = colors || [C.yellow, C.blue, C.green, C.coral, LILAC, C.yellow, C.white];
  const kinds = ["pill", "pill", "dot", "diamond", "star", "pill", "ring", "dot"];
  const W = Cm.w, H = Cm.h, cxBox = box[0] + box[2] / 2;
  for (let i = 0; i < n; i++) {
    const kind = kinds[i % kinds.length], col = cols[Math.floor(R() * cols.length)];
    const x0 = box[0] + R() * box[2], y0 = box[1] + R() * box[3];
    const side = (x0 - cxBox) / (box[2] / 2); // -1 left .. 1 right
    const ti = t0 + Math.round(R() * 6), dur = Math.round(life * (0.75 + R() * 0.35)), T = dur / 60;
    // up fast, slowed by the air, then down at its own slow terminal speed; out to the sides, slowing
    const up = H * (rise[0] + R() * (rise[1] - rise[0])) * (1 - 0.35 * Math.abs(side)), tA = 0.22 + R() * 0.16;
    const dx = (side * 0.6 + (R() - 0.5) * 0.9) * W * spread * 0.5;
    const fa = ti + Math.round(tA * 60), fe = ti + dur, yA = y0 - up, yE = yA + H * fall * (0.7 + R() * 0.6) * (T - tA);
    const s = (kind === "star" ? 1.15 : kind === "pill" ? 1 : 0.9) * (0.75 + R() * 0.5) * U;
    const spin = (R() < 0.5 ? -1 : 1) * (160 + R() * 420);
    // the tumble: x scale swings between 100 and -100 (the piece seen edge-on, then from the back)
    const flips = [], nf = 2 + Math.floor(R() * 3), ph = R();
    for (let k = 0; k <= nf * 2; k++) { const tk = ti + 7 + Math.round(((dur - 7) * k) / (nf * 2)); flips.push([tk, [100 * Math.cos(Math.PI * (k / 2 + ph)) * s, 100 * s], E.inOut]); }
    const shapeOf = () => {
      if (kind === "pill") return [rect([9, 21], [0, 0], 4.5)];
      if (kind === "dot") return [ellipse([11, 11], [0, 0])];
      if (kind === "diamond") return [path(diamondPath(0, 0, 7))];
      if (kind === "star") return [path(starPath(0, 0, 10))];
      return [ellipse([12, 12], [0, 0])];
    };
    const items = kind === "ring" ? [...shapeOf(), stroke(rgb(col === C.white ? C.black : col), 3.2)] : [...shapeOf(), stroke(rgb(C.black), 1.6), fill(rgb(col))];
    Cm.shape(`${nm} · ${i} ${kind}`, [group(kind, items)], {
      ip: ti, op: fe + 1, parent,
      ks: {
        p: { x: [[ti, x0, [0.15, 0.7, 0.35, 1]], [fe, x0 + dx]], y: [[ti, y0, [0.2, 0.62, 0.4, 1]], [fa, yA, [0.45, 0, 0.7, 0.8]], [fe, yE]] },
        r: [[ti, R() * 360, [0.2, 0.5, 0.5, 1]], [fe, R() * 360 + spin]],
        s: [[ti, [0, 0], E.spring], ...flips],
        o: [[ti, 100, E.hold], [fe - Math.round(dur * 0.24), 100, E.linear], [fe, 0]]
      }
    });
  }
}

// a closed bezier path run the other way round (an inverted mask's hole)
export function reversePath(p) { return { c: p.c, v: [...p.v].reverse(), i: [...p.o].reverse(), o: [...p.i].reverse() }; }
