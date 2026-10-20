// 5 · the way into the arcade game and back out (TASK-009, Daniel 2026-10-19: "the pixel transition into the game"; "exiting
// the game, the camera zooms out from the map's arcade cabinet screen to Bird's eye"). One piece, played twice:
//   in    · the screen breaks into chunky pixels: square blocks pop in from the button that was pressed (the page moves
//           their start times to it, src/lottie-ui/game.js), each a flash of the game's gold, then its colour: the game's
//           first screen itself, brought down to the blocks (game-mosaic.json: the splash on a laptop, the "rotate your
//           phone" screen on a phone upright), its colours lifted a little, its dark parts in a two-tone checker
//   hold  · only while the game is still loading: NOW LOADING (SE ÎNCARCĂ) in the game's pixel letters, the glove jabbing,
//           the dots counting, one CRT sweep down the screen; it loops
//   out   · the blocks go in a dissolve from the middle out (a 4x4 ordered dither and a little noise): under them is the
//           game's own splash, now sharp (on the way in), or the map, the camera on the arcade cabinet's screen (on the way
//           out, when the page first gives the blocks the colours of the game's screen as it was left: a true pixelation)
// Everything is an axis-aligned square: the page draws it at one canvas pixel a CSS pixel and lets the browser scale it
// up without smoothing. Two shapes (wide: a laptop or a phone on its side; tall: a phone upright), each in the game's
// colours and in Sketchbook's notebook (squares drawn in indigo ink on the paper, coloured in with pencil).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, fill, rgb, E, rng } from "../lib/ui.mjs";
import { pixelText, pixelWidth, glove, RAMP } from "../lib/pixel.mjs";

export const GAB = { wide: { name: "wide", W: 1440, H: 900, B: 60 }, tall: { name: "tall", W: 390, H: 840, B: 30 } };
// the clock (frames at 60): in 0-36 (blocks start over 0-28, each settles 5 frames later), hold 36-96 (a loop),
// out 96-125 (blocks go over 0-20 of it, each in 4 frames)
export const GT = { IN1: 36, SPREAD: 28, HOLD1: 96, OUT_SPREAD: 20, END: 125 };
export const GAME_TEXT = { en: "NOW LOADING", ro: "SE ÎNCARCĂ" };
let MOSAIC = {}; // (tools/game-mosaic.mjs writes it: it is read only when a piece is built)
try { MOSAIC = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "game-mosaic.json"), "utf8")); } catch (e) {}

/* ---- a block's colour from the game's screen (the page does the same at the way out: src/lottie-ui/game.js tone) ---- */
// TONE: saturation x s, lightness contrast x k about the middle, lifted by l; the dark ones (lightness under d) every
// other block lighter by dl (the checker that keeps a dark screen reading as pixels). Sketchbook: towards the paper by
// k, the dark ones in the notebook's indigo pencil
export const TONE = { s: 1.7, k: 1.25, l: 0.04, d: 0.1, dl: 0.035, sketch: { paper: "#fdfcf9", k: 0.5, ink: "#4b4f8f", inkK: 0.6 } };
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export function tone(c, checker, sketch, T = TONE) {
  let [r, g, b] = c;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let l = (mx + mn) / 2, s = mx === mn ? 0 : l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn), h = 0;
  if (mx !== mn) { const dd = mx - mn; h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6; }
  const dark = l < T.d;
  s = Math.min(1, s * T.s); l = Math.min(1, Math.max(0, (l - 0.5) * T.k + 0.5 + T.l)); if (dark && checker) l = Math.min(1, l + T.dl);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  let o = s === 0 ? [l, l, l] : [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  if (sketch) {
    const S = T.sketch, P = hex2(S.paper), I = hex2(S.ink);
    o = dark ? I.map((v, i) => v + (P[i] - v) * (S.inkK + (checker ? 0.08 : 0))) : o.map((v, i) => v + (P[i] - v) * S.k);
  }
  return [...o.map((v) => Math.round(v * 1000) / 1000), 1];
}

export const GPAL = {
  light: { name: "light", flash: ["#FFF3A6", "#FED012"], text: RAMP, shadow: "#7a1a2a", sweep: "#ffffff", sweepO: 9 },
  sketch: { name: "sketch", flash: ["#fdfcf9", "#fdfcf9"], ink: "#2e3266", inkW: 1.6, text: "#2e3266", shadow: "#e3b46c", sweep: null }
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function buildGamePx(ab, P, lang = "en") {
  const { W, H, B } = ab, cols = Math.round(W / B), rows = Math.round(H / B), M = MOSAIC[ab.name], sk = P.name === "sketch";
  if (!M || M.cols !== cols || M.rows !== rows) throw new Error(`game-mosaic.json has no ${cols}x${rows} grid for ${ab.name}: run tools/game-mosaic.mjs`);
  const Cm = new Comp({ w: W, h: H, dur: GT.END / 60, nm: `Cromatic · into the game · ${ab.name} · ${P.name} · ${lang}` });
  Cm.marker("in", 0, GT.IN1); Cm.marker("hold", GT.IN1, GT.HOLD1); Cm.marker("out", GT.HOLD1, GT.END);
  const R = rng(ab.name === "wide" ? 41 : 43);

  /* ---- the hold: the words, the glove, the dots, the sweep (over the blocks; only between in and out) ---- */
  const px = ab.name === "wide" ? 6 : 4, gpx = px;
  {
    const word = GAME_TEXT[lang], tw = pixelWidth(word) * px, dotW = 3 * 2 * px, gw = 11 * gpx, gap = 4 * px;
    const total = gw + gap + tw + px + dotW, x0 = Math.round((W - total) / 2), y0 = Math.round(H * 0.5 - 3.5 * px);
    const t = pixelText(word, { x: x0 + gw + gap, y: y0, px, colors: P.text, shadow: P.shadow, nm: "words" });
    // the dots: one, two, three, gone (a quarter of the loop each)
    const dots = [0, 1, 2].map((i) => {
      const d = pixelText(".", { x: x0 + gw + gap + tw + px + i * 2 * px, y: y0, px, colors: P.text, shadow: P.shadow, nm: "dot " + i });
      const on = GT.IN1 + 15 * (i + 1);
      return group("dot " + i, d.groups, { o: [[0, 0, E.hold], [on, 100, E.hold], [GT.HOLD1 - 1, 0]] });
    });
    // the glove jabs twice a loop: out, hold, back (whole pixels, no easing: the game's own steps)
    const jab = [];
    for (const t0 of [GT.IN1 + 10, GT.IN1 + 40]) jab.push([t0, [0, 0], E.hold], [t0 + 3, [px * 2, 0], E.hold], [t0 + 9, [px, 0], E.hold], [t0 + 12, [0, 0], E.hold]);
    jab.push([GT.HOLD1 - 1, [0, 0]]);
    // a plate under the words, so they read on any block (the game's own dark, or the notebook's paper)
    const plate = group("plate", [rect([total + 8 * px, 13 * px], [x0 + total / 2, H * 0.5]), fill(rgb(sk ? "#fdfcf9" : "#0b0816"), sk ? 92 : 78)]);
    Cm.shape("hold · words", [
      group("glove", [glove({ x: x0, y: Math.round(H * 0.5 - 5.5 * gpx), px: gpx, nm: "glove" })], { p: jab }),
      ...dots,
      ...t.groups,
      plate
    ], { ip: GT.IN1, op: GT.HOLD1 });
  }
  if (P.sweep) {
    // one CRT sweep down the screen a loop (a pale band, the lines a CRT draws)
    const bh = Math.round(H * 0.06);
    Cm.shape("hold · sweep", [group("band", [rect([W + 4, bh], [W / 2, 0]), fill(rgb(P.sweep), P.sweepO)])], {
      ip: GT.IN1, op: GT.HOLD1, ks: { p: [[GT.IN1, [0, -bh], E.linear], [GT.HOLD1, [0, H + bh]]] }
    });
  }

  /* ---- the blocks ---- */
  // in: from the middle (the page moves each block's start to the button that was pressed); out: from the middle too,
  // through a 4x4 ordered dither (the 90s dissolve) and a little noise. n: each block's own share of noise, for the page
  const cx0 = W / 2, cy0 = H / 2, maxD = Math.hypot(W / 2, H / 2), shapes = [], din = [], noise = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c + 0.5) * B, y = (r + 0.5) * B, dc = Math.hypot(x - cx0, y - cy0) / maxD;
    const n = Math.round(R() * 100) / 100, by = BAYER[(r % 4) * 4 + (c % 4)] / 15;
    const d = Math.round(Math.min(1, 0.86 * dc + 0.14 * n) * GT.SPREAD);
    const o = Math.round(Math.min(1, 0.32 * dc + 0.5 * by + 0.18 * n) * GT.OUT_SPREAD);
    din.push(d); noise.push(n);
    const col = tone(hex2(M.c[r * cols + c]), (r + c) % 2 === 1, sk);
    // a hair bigger than its cell, so no seam between two neighbours lets the page through
    const S1 = Math.ceil(B + 1.5), a = 1 + d, o0 = GT.HOLD1 + o, q = (k) => Math.round(S1 * k);
    const size = { a: 1, k: [kf(0, [0, 0], 1), kf(a, [q(0.45), q(0.45)], 1), kf(a + 2, [S1, S1], 1), kf(o0, [q(0.5), q(0.5)], 1), kf(o0 + 3, [0, 0])] };
    const color = { a: 1, k: [kf(0, c3(P.flash[0]), 1), kf(a + 2, c3(P.flash[1]), 1), kf(a + 4, col)] };
    const it = [{ ty: "rc", d: 1, s: size, p: { a: 0, k: [x, y] }, r: { a: 0, k: 0 } }];
    if (P.ink) it.push({ ty: "st", c: { a: 0, k: c3(P.ink) }, o: { a: 0, k: 100 }, w: { a: 0, k: P.inkW }, lc: 1, lj: 1, ml: 4, bm: 0 });
    it.push({ ty: "fl", c: color, o: { a: 0, k: 100 }, r: 1, bm: 0 });
    it.push(TR0);
    shapes.push({ ty: "gr", it });
  }
  Cm.shape("blocks", shapes);
  const json = Cm.json();
  json.cromatic = { piece: "game", ab: ab.name, theme: P.name, lang, cols, rows, B, d: din, n: noise, spread: GT.SPREAD, in1: GT.IN1, hold1: GT.HOLD1, tone: TONE };
  return json;
}
// a colour to 3 decimals (the blocks are many: every byte counts 360 times)
const c3 = (h) => rgb(h).map((v) => Math.round(v * 1000) / 1000);
// a key: hold keys step (the game's own whole-pixel moves); the last key has no easing
const kf = (t, s, h) => (h ? { t, s: Array.isArray(s) ? s : [s], h: 1 } : { t, s: Array.isArray(s) ? s : [s] });
const TR0 = { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } };
