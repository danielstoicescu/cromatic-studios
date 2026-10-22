// Cromatic · stories · the card & type system (Iris, TASK-065d). One system for every story (A, B, C, D), 1080 x 1920.
// The tokens below are the rules; layout() turns a card's words into numbers (the house face's own metrics and GPOS
// kerning, the same setLine the Lottie builds use), so the SVGs, the JSON specs and the Lottie layers all agree.
import { loadType, setLine } from "../../../intro-lottie/_source/lib/type.mjs";

export const W = 1080, H = 1920;

export const TOKENS = {
  canvas: { w: W, h: H, fps: 30, lottieFps: 60 },
  // Instagram's own chrome: nothing that must be read goes in these bands
  safe: { top: 250, bottom: 340, side: 80, note: "Stories: progress bar + handle on top, reply bar at the bottom. Reels: also keep right-aligned words out of x > 900 between y 1100 and 1580 (the like / comment column)." },
  // the corners: generous padding, the same everywhere
  anchors: {
    left: 80, right: 1000, centre: 540,
    topCap: 300,       // the first line's cap height starts here (50 px under the safe band)
    bottomBase: 1530,  // the last line's baseline sits here (descenders end ~1570, 30 px over the band)
    middle: 960
  },
  colour: {
    paper: "#FBFAF5",  // text on dark and night scenes (the site's --paper)
    ink: "#0D0C09",    // text on light scenes, every keyline, every hard shadow (the site's --ink)
    yellow: "#FED012", // the pill, the aplat, the location dot: the one thing to look at
    white: "#FFFFFF",  // a pill sitting on the yellow aplat; the address tag's plate
    black: "#000000"   // the end
  },
  rule: "One text colour per card: paper on night/dark scenes, ink on light scenes and on the aplat. No letter or word in another colour. The pill and the aplat are objects, not type: the word in a pill is always ink.",
  face: {
    display: { family: "Google Sans", cssFamily: "CromaticSans, 'Google Sans'", weight: 600, file: "site/fonts/google-sans-latin.woff2", note: "The site's display face (the 18pt SemiBold cut the map, the intro and the welcome card are drawn with). One face for every word in the stories; no mono counters, no second family." }
  },
  // the type scale (px at 1080 x 1920): size, line height (x size), tracking (em)
  type: {
    hero:     { size: 336, lead: 0.92, tracking: -0.05,  use: "one word that is the shot (SLOW)" },
    headline: { size: 168, lead: 0.94, tracking: -0.045, use: "the short punches: Take your drive. / Night coffee hopping. / Ended too soon?" },
    title:    { size: 116, lead: 1.0,  tracking: -0.04,  use: "statements of one or two lines; the word-in-pill lines" },
    line:     { size: 88,  lead: 1.06, tracking: -0.035, use: "a sentence that leads into the end (Drive it for yourself.)" },
    lead:     { size: 60,  lead: 1.1,  tracking: -0.025, use: "the small line that sets up a big one (You should take it)" },
    tag:      { size: 44,  lead: 1.0,  tracking: -0.01,  use: "address tags only" },
    url:      { size: 64,  lead: 1.0,  tracking: -0.02,  use: "the cromaticstudios.com pill" }
  },
  // the word in a pill (the site hero's "remember a [place.]"): the full stop rides inside the pill, as on the site
  pill: { height: 1.16, padX: 0.34, gap: 0.24, extraLead: 0.2, centreFromBaseline: 0.355, keyline: 0.045, shadow: [0.03, 0.065], tilt: -3,
    fill: { onScene: "#FED012", onAplat: "#FFFFFF" }, ink: "#0D0C09",
    note: "height, padX, gap (after the words before it), extraLead (added to the lead of the line that carries it), keyline and shadow in em of the line's size. Full radius. Tilt about its left end (the end that stays put when the word swaps); the words around it stay level." },
  // the flat colour block (Ilinca's street card in the stories: radius 30, the ink keyline, a hard shadow)
  aplat: { radius: 30, keyline: 5, shadow: [0, 12], padX: 52, padTop: 46, padBottom: 50, tilt: -2, fill: "#FED012",
    note: "The block and everything on it turn together about the block's top-left corner. The text on it is ink; a pill on it is white." },
  // a map tag: a small plate pinned to the place, a yellow location dot, the name and the time
  tag: { size: 44, height: 84, padL: 26, dot: 22, dotGap: 16, padR: 32, keyline: 4, dotKeyline: 3.5, shadow: [0, 7], pointer: { x: 46, w: 30, h: 18 }, plate: "#FFFFFF", ink: "#0D0C09", dotFill: "#FED012",
    note: "Name · time, one line, never more than ~22 characters. Straight (no tilt): it is information, not a title.",
    // (C7, Daniel: the time is its own pill: no pointer, a perfect pill, inverted, its ":" blinking at 1 Hz, hard on/off)
    clock: { plate: "#0D0C09", ink: "#FFFFFF", line: "#FFFFFF", padX: 30, blink: { period: 60, on: 30 }, note: "Any tag whose text is a time (9:11, 11:11), or { clock: true }. Only the location tag keeps the pointer." } },
  url: { text: "cromaticstudios.com", size: 64, padX: 0.625, height: 1.6, keyline: 6, shadow: [10, 14], tilt: -6, centre: [540, 1000], fill: "#FED012", ink: "#0D0C09",
    note: "The end card: alone on black, centred, in every story. It never moves when the screen goes black." },
  // motion, at 30 fps (x2 for the 60 fps Lottie comps); transforms and opacity only
  motion: {
    lineIn: { kind: "rise out of the baseline (a mask on the line)", frames: 12, letterStagger: 0.6, lineStagger: 4, ease: [0.16, 1, 0.3, 1] },
    lineOut: { kind: "up and out of the same mask", frames: 7, letterStagger: 0.35, ease: [0.7, 0, 0.84, 0] },
    pillIn: { kind: "pops on its centre, 60 % -> 100 %, tilt -9 -> -3", frames: 10, ease: [0.34, 1.56, 0.64, 1] },
    pillSwap: { kind: "the width rolls to the next word (left edge fixed), the old word rises out, the new one rises in", frames: 8, ease: [0.16, 1, 0.3, 1] },
    aplatIn: { kind: "swings in from its top-left corner: rotate -7 -> -2, y -24 -> 0, opacity 0 -> 100 in 3", frames: 14, ease: [0.34, 1.56, 0.64, 1] },
    aplatMove: { kind: "the whole card glides to its next placement", frames: 12, ease: [0.65, 0, 0.35, 1] },
    tagIn: { kind: "lands on its pointer: scale 40 % -> 100 % about the pointer's tip", frames: 9, ease: [0.34, 1.56, 0.64, 1] },
    tagOut: { kind: "scale 100 % -> 0 % about the pointer's tip", frames: 6, ease: [0.7, 0, 0.84, 0] },
    smashCut: { kind: "on and off with the frame (SLOW only)", frames: 0 },
    urlIn: { kind: "up from +260 px with the house bounce, tilt -24 -> -6, a squash 104/96 -> 98/102 -> 100", frames: 20 },
    urlSettle: { kind: "the soft last move on black: tilt -6 -> -4, scale 100 -> 104", frames: 30, ease: [0.65, 0, 0.35, 1] },
    holdRule: "A line holds at least 18 frames + 1 frame per character. The two long holds Daniel asked for (the fountain, SLOW) hold 75 frames or more."
  }
};

let T = null;
export async function type() { if (!T) T = await loadType(); return T; }
const sty = (k) => TOKENS.type[k];

// a line of the display face: letters (x from the line's left), width, the box it occupies
export function setText(text, style) {
  const s = typeof style === "string" ? sty(style) : style;
  const L = setLine(T, text, s.size, s.tracking);
  return { text, size: s.size, tracking: s.tracking, letters: L.letters, width: L.width };
}
const capOf = (size) => (size * T.cap) / T.upm;
// the ink box of a line: cap/ascender height over the baseline, the descender only if a letter has one
const box = (x, baseline, w, size, text = "g") => { const d = /[gjpqy,;]/.test(text) ? 0.24 : 0.03; return { x: r1(x), y: r1(baseline - 0.76 * size), w: r1(w), h: r1((0.76 + d) * size) }; };
const r1 = (v) => Math.round(v * 10) / 10;

// placement of a block of lines: "tl" | "tr" | "bl" | "br" | "c" | "top-c" | {x, align, top|base}
export function anchorFor(place, lines) {
  const A = TOKENS.anchors;
  const n = lines.length, heights = lines.map((l) => l.size * (sty(l.style).lead));
  const first = lines[0];
  // a line that carries a pill takes 0.2 em more lead (the pill is taller than the letters)
  const stack = (base0) => { const bs = [base0]; for (let i = 1; i < n; i++) bs.push(bs[i - 1] + lines[i].size * (sty(lines[i].style).lead + (lines[i].pill ? TOKENS.pill.extraLead : 0))); return bs; };
  const fromTop = () => stack(A.topCap + capOf(first.size));
  const fromBottom = () => { const bs = stack(0), d = A.bottomBase - bs[n - 1]; return bs.map((b) => b + d); };
  if (typeof place === "object") {
    const bs = place.base != null ? (() => { const s0 = stack(0); return s0.map((b) => b + place.base - s0[n - 1]); })() : stack(place.top + capOf(first.size));
    return { x: place.x, align: place.align || "left", baselines: bs };
  }
  switch (place) {
    case "tl": return { x: A.left, align: "left", baselines: fromTop() };
    case "tr": return { x: A.right, align: "right", baselines: fromTop() };
    case "bl": return { x: A.left, align: "left", baselines: fromBottom() };
    case "br": return { x: A.right, align: "right", baselines: fromBottom() };
    default: throw new Error("place " + place);
  }
}
const leftOf = (x, w, align) => (align === "right" ? x - w : align === "center" ? x - w / 2 : x);

// ---- the elements ----
// a line, optionally ending in a pill: { text, style, pill: { words: [...], fill } }
export function layLine(def, x, baseline, align, ink) {
  const s = sty(def.style), out = { kind: "line", id: def.id, style: def.style, size: s.size, tracking: s.tracking, lead: s.lead, ink, align };
  if (!def.pill) {
    const t = setText(def.text, def.style), lx = leftOf(x, t.width, align);
    return { ...out, text: def.text, x: r1(lx), baseline: r1(baseline), width: r1(t.width), box: box(lx, baseline, t.width, s.size, def.text) };
  }
  // words before the pill, then the pill (its width per state)
  const P = TOKENS.pill, S = s.size, pre = def.text ? setText(def.text, def.style) : null;
  const preW = pre ? pre.width : 0, gap = pre ? P.gap * S : 0;
  const states = def.pill.words.map((w) => { const t = setText(w, def.style); return { word: w, wordW: r1(t.width), w: r1(t.width + 2 * P.padX * S) }; });
  const widest = Math.max(...states.map((q) => q.w));
  // a centred line centres on its first state; a right-aligned one keeps the pill's right edge at x
  const total0 = preW + gap + states[0].w, lx = leftOf(x, align === "right" ? preW + gap + widest : total0, align);
  const px = lx + preW + gap, h = P.height * S, cy = baseline - P.centreFromBaseline * S;
  return {
    ...out, text: def.text || "", x: r1(lx), baseline: r1(baseline), width: r1(preW), box: box(lx, baseline, preW + gap + widest, s.size),
    pill: {
      id: def.id + "-pill", fill: def.pill.fill, ink: def.pill.ink || P.ink, line: def.pill.line, left: r1(px), cy: r1(cy), h: r1(h), keyline: r1(P.keyline * S), shadow: [r1(P.shadow[0] * S), r1(P.shadow[1] * S)], tilt: def.pill.tilt ?? P.tilt,
      wordX: r1(px + P.padX * S), states: states.map((q) => ({ ...q, cx: r1(px + q.w / 2) }))
    }
  };
}

export function layTag(def) {
  const G = TOKENS.tag, t = setText(def.text, "tag");
  if (def.clock ?? /^\d{1,2}:\d{2}$/.test(def.text)) { // the clock pill: no dot, no pointer, ink plate, white figures
    const C = G.clock, w = C.padX * 2 + t.width, h = G.height, x = def.align === "right" ? def.x - w : def.x, top = def.top;
    return { kind: "tag", clock: true, blink: C.blink, id: def.id, text: def.text, size: G.size, tracking: TOKENS.type.tag.tracking, ink: C.ink,
      plate: { x: r1(x), y: r1(top), w: r1(w), h, r: h / 2, fill: C.plate, line: C.line, keyline: G.keyline, shadow: G.shadow }, // (inverted: the keyline white too, so it holds on the night)
      textX: r1(x + C.padX), baseline: r1(top + h / 2 + 0.355 * G.size), anchor: [r1(x + w / 2), r1(top + h)], box: { x: r1(x), y: r1(top), w: r1(w), h } };
  }
  const w = G.padL + G.dot + G.dotGap + t.width + G.padR, h = G.height;
  const x = def.align === "right" ? def.x - w : def.x, top = def.top;
  return {
    kind: "tag", id: def.id, text: def.text, size: G.size, tracking: TOKENS.type.tag.tracking, ink: G.ink,
    plate: { x: r1(x), y: r1(top), w: r1(w), h, r: h / 2, fill: G.plate, keyline: G.keyline, shadow: G.shadow },
    dot: { cx: r1(x + G.padL + G.dot / 2), cy: r1(top + h / 2), d: G.dot, fill: G.dotFill, keyline: G.dotKeyline },
    textX: r1(x + G.padL + G.dot + G.dotGap), baseline: r1(top + h / 2 + 0.355 * G.size),
    pointer: { x: r1(x + G.pointer.x), y: r1(top + h), w: G.pointer.w, h: G.pointer.h, tip: [r1(x + G.pointer.x), r1(top + h + G.pointer.h)] },
    box: { x: r1(x), y: r1(top), w: r1(w), h: h + G.pointer.h }
  };
}

export function layUrl(def = {}) {
  const U = TOKENS.url, t = setText(U.text, "url"), w = t.width + 2 * U.padX * U.size, h = U.height * U.size, c = def.centre || U.centre;
  return { kind: "url", id: def.id || "url", text: U.text, size: U.size, tracking: TOKENS.type.url.tracking, ink: U.ink, fill: U.fill, centre: c, w: r1(w), h: r1(h), textX: r1(c[0] - t.width / 2), baseline: r1(c[1] + 0.36 * U.size), keyline: U.keyline, shadow: U.shadow, tilt: U.tilt };
}

// a block of lines at a placement (and its pills); optionally on an aplat
export function layBlock(def, ink) {
  const lines = def.lines.map((l, i) => ({ ...l, id: l.id || `${def.id}-l${i + 1}`, size: sty(l.style).size }));
  let place = def.place;
  if (def.aplat) {
    // the block's content sits inside the padding: the anchors move in by it
    const AP = TOKENS.aplat;
    if (typeof place === "string") {
      const A = TOKENS.anchors, s0 = lines[0].size;
      place = place === "tl" ? { x: A.left + AP.padX, top: A.topCap + AP.padTop, align: "left" } : place;
    }
  }
  const a = anchorFor(place, lines);
  // (C8: { row: true }: the lines side by side on one baseline (the last line's), each its own style, any of them a pill;
  // the row aligned as the block is)
  if (def.row) {
    const P = TOKENS.pill, gap = def.gap ?? 22, base = a.baselines[lines.length - 1];
    const wOf = (l) => l.pill ? Math.max(...l.pill.words.map((w) => setText(w, l.style).width + 2 * P.padX * sty(l.style).size)) + (l.text ? setText(l.text, l.style).width + P.gap * sty(l.style).size : 0) : setText(l.text, l.style).width;
    const ws = lines.map(wOf), total = ws.reduce((s0, w) => s0 + w, 0) + gap * (lines.length - 1);
    let x = leftOf(a.x, total, a.align);
    const laid = lines.map((l, i) => { const r = layLine(l, x, base, "left", ink); x += ws[i] + gap; return r; });
    return { kind: "block", id: def.id, place: def.place, ink, lines: laid, row: { x0: r1(leftOf(a.x, total, a.align)), w: r1(total) } };
  }
  const laid = lines.map((l, i) => layLine(l, a.x, a.baselines[i], a.align, ink));
  const out = { kind: "block", id: def.id, place: def.place, ink, lines: laid };
  if (def.aplat) out.aplat = aplatAround(laid, def.aplat);
  return out;
}

// the aplat around the lines, per pill state
export function aplatAround(laid, opt = {}) {
  const AP = TOKENS.aplat;
  const nStates = Math.max(1, ...laid.map((l) => (l.pill ? l.pill.states.length : 1)));
  const states = [];
  for (let k = 0; k < nStates; k++) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const l of laid) {
      const s = l.size, top = l.baseline - capOf(s), bot = l.baseline + 0.06 * s;
      let lx0 = l.x, lx1 = l.x + l.width;
      if (l.pill) { const q = l.pill.states[Math.min(k, l.pill.states.length - 1)]; lx1 = l.pill.left + q.w + l.pill.shadow[0]; y0 = Math.min(y0, l.pill.cy - l.pill.h / 2); y1 = Math.max(y1, l.pill.cy + l.pill.h / 2 + l.pill.shadow[1]); }
      x0 = Math.min(x0, lx0); x1 = Math.max(x1, lx1); y0 = Math.min(y0, top); y1 = Math.max(y1, bot);
    }
    states.push({ x: r1(x0 - AP.padX), y: r1(y0 - AP.padTop), w: r1(x1 - x0 + 2 * AP.padX), h: r1(y1 - y0 + AP.padTop + AP.padBottom) });
  }
  return { fill: opt.fill || AP.fill, radius: AP.radius, keyline: AP.keyline, shadow: AP.shadow, tilt: opt.tilt ?? AP.tilt, states };
}
