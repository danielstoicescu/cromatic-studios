// Direction A · "The pill" (kinetic type). The site's own lines on grid paper, set big and left-aligned, the key word
// of each line in the studio's pill. The pill is the one moving part: it changes word in place (place, facade, brand),
// nine of them count the worlds, one is chosen and becomes "yours.", and the last one, "coffee.", grows past the
// edges of the screen and opens in the middle like an aperture onto the city.
import { Comp, group, rect, fill, stroke, rgb, E, prop, roundRect, ellipse, poly, path, pathProp } from "../lib/lottie.mjs";
import { C, WORLDS, gridPaper, layout, wordsLayer, pillGeom, pillShift, slotWord, at } from "../lib/kit.mjs";
import { letterGroup } from "../lib/text.mjs";

// the timeline (seconds), in one place
export const TL_A = { B1: 0.1, B2: 1.85, B3: 4.05, B4: 7.0, HOLD: 8.75, HAND: 9.15, END: 10.0 };

export function buildA(T, ab) {
  const ph = ab.name === "phone";
  const W = ab.w, H = ab.h;
  const Cm = new Comp({ w: W, h: H, dur: TL_A.END, nm: `Cromatic opening · A · the pill · ${ab.name}` });
  const { B1, B2, B3, B4, HOLD, HAND, END } = TL_A;
  const S = ph ? 46 : 116; // type size (the site's display size at these widths)
  const LEAD = ph ? 1.04 : 1.0;
  const X = ph ? 24 : 128; // left-aligned: the brand never centres display type
  const capPx = (T.cap / T.upm) * S;
  const PG = 0.13; // a pill line sits this much (em) lower, as an inline-block pill makes its line box taller
  const top = (n, mid, pills = 0) => H * mid - (capPx + (n - 1) * S * LEAD + pills * PG * S) / 2 + capPx; // first baseline of an n-line block
  // the last line holds the pill (pill: true) in every block that has one
  const blk = (lines, mid = ph ? 0.45 : 0.5, pill = false) => layout(T, lines, { x: X, y: top(lines.length, mid, pill ? 1 : 0), size: S, leading: LEAD, pillLines: pill ? [lines.length - 1] : [], pillGap: PG });
  const SW = ph ? 2.5 : Math.max(2.5, 0.03 * S); // pill outline
  Cm.marker("words", 0, at(HOLD));
  Cm.marker("hold", at(HOLD), at(HAND));
  Cm.marker("handoff", at(HAND), at(END));
  const mid = [W / 2, H / 2];

  /* ---------- the handoff, top of the stack: the coffee pill grows past the edges and opens in the middle ---------- */
  const b4 = blk(ph ? ["That's how", "the right brand", "feels.", "And like a good", "coffee."] : ["That's how the right", "brand feels.", "And like a good", "coffee."], undefined, true);
  const coffeeW = b4.find((w) => w.text === "coffee.");
  const cX = coffeeW.lx + coffeeW.x + pillShift(S); // the word's first letter, inside the pill
  const cp = pillGeom(S, cX - 0.34 * S, coffeeW.by, coffeeW.w);
  const cpC = [cp.cx, cp.cy];
  const t4b = at(B4 + 0.8), tIn = at(B4 + 1.05), tHold = at(HOLD), tH = at(HAND), tCover = at(HAND + 0.4), tEnd = at(END);
  const big = [W * 2.6, H * 2.6];
  const outerSize = [[tIn, [cp.w * 0.55, cp.h * 0.55], E.spring], [tIn + 26, [cp.w, cp.h], E.hold], [tH + 6, [cp.w, cp.h], E.in], [tCover, big]];
  const outerPos = [[tIn, cpC, E.hold], [tH + 6, cpC, E.inOut], [tCover, mid]];
  const holeSize = [[0, [0, 0], E.hold], [tCover, [0, 0], [0.55, 0, 0.12, 1]], [tEnd, [W * 2.0, H * 2.0]]];
  // a hold that loops: the pill breathes once (100 -> 104 -> 100); when the city is late the player loops it
  const pulse = [[0, [100, 100], E.hold], [tHold, [100, 100], E.inOut], [Math.round((tHold + tH) / 2), [104, 104], E.inOut], [tH, [100, 100]]];
  Cm.shape("handoff · aperture edge", [group("edge", [rect(holeSize, mid, 9999), stroke(rgb(C.black), ph ? 2.5 : 3)])], { ip: tCover, op: tEnd + 1 });
  const cw = slotWord(T, "coffee.", S, C.black, cX, coffeeW.by, { inAt: tIn + 6, outAt: tH, dist: 0.62, outDur: 10 });
  Cm.shape("beat 4 · coffee. (word)", [group("word", cw.groups)], { ip: tIn, op: tH + 24, ks: { a: cpC, p: cpC, s: pulse } });
  Cm.shape("beat 4 · coffee. (pill → aperture)", [
    group("outline", [rect(outerSize, outerPos, 9999), stroke(rgb(C.black), SW)]),
    group("body", [rect(outerSize, outerPos, 9999), rect(holeSize, mid, 9999), fill(rgb(C.yellow), 100, 2)])
  ], { ip: tIn, op: tEnd + 1, ks: { a: cpC, p: cpC, s: pulse } });

  /* ---------- beat 4 · That's how the right brand feels. And like a good coffee. ---------- */
  const b4w = b4.filter((w) => w !== coffeeW);
  wordsLayer(Cm, T, b4w, {
    nm: "beat 4 · words", size: S,
    enterAt: (i) => (i < 6 ? at(B4) + i * 4 : t4b + (i - 6) * 4),
    exitAt: (i) => tH + i * 0.6, exitDur: 10, ip: at(B4) - 1, op: tCover
  });

  /* ---------- beat 3 · Nine worlds over the same streets. One will feel like yours. ---------- */
  const b3a = blk(ph ? ["Nine worlds", "over the same", "streets."] : ["Nine worlds over", "the same streets."], ph ? 0.4 : 0.44);
  const b3b = blk(["One will feel", "like yours."], undefined, true);
  const t3 = at(B3), tRow = at(B3 + 0.35), t3b = at(B3 + 1.6), tPick = at(B3 + 1.75), t3out = at(B4 - 0.28);
  wordsLayer(Cm, T, b3a, { nm: "beat 3 · nine worlds over the same streets", size: S, enterAt: (i) => t3 + i * 4, exitAt: (i) => t3b - 18 + i, exitDur: 12, ip: t3 - 1, op: t3b + 4 });
  const yoursW = b3b.find((w) => w.text === "yours.");
  wordsLayer(Cm, T, b3b.filter((w) => w !== yoursW), { nm: "beat 3 · one will feel like", size: S, enterAt: (i) => t3b + i * 4, exitAt: (i) => t3out + i * 1.5, exitDur: 14, ip: t3b - 1, op: t3out + 20 });
  // nine swatches under the lines, one per world, counted in; eight leave, the Cromatic one becomes the pill
  const yX = yoursW.lx + yoursW.x + pillShift(S);
  const yp = pillGeom(S, yX - 0.34 * S, yoursW.by, yoursW.w);
  const sw = ph ? [30, 18] : [64, 36], sg = ph ? 7 : 14;
  const rowY = b3a[b3a.length - 1].by + (ph ? 0.78 : 0.62) * S;
  const slot = (i) => X + sw[0] / 2 + i * (sw[0] + sg);
  let ci = 0; for (let i = 0; i < 9; i++) if (Math.abs(slot(i) - yp.cx) < Math.abs(slot(ci) - yp.cx)) ci = i;
  const others = WORLDS.slice(1), row = [...others.slice(0, ci), WORLDS[0], ...others.slice(ci)];
  const sws = row.map(([name, col], i) => {
    const cx = slot(i), t0 = tRow + i * 4, chosen = i === ci, tl = tPick + 2 + Math.abs(i - ci) * 2;
    const size = chosen
      ? [[t0, [0, 0], E.spring], [t0 + 18, sw, E.hold], [tPick + 8, sw, E.spring], [tPick + 30, [yp.w, yp.h], E.hold], [t3out, [yp.w, yp.h], E.in], [t3out + 14, [yp.w * 0.9, yp.h * 0.9]]]
      : [[t0, [0, 0], E.spring], [t0 + 18, sw, E.hold], [tl, sw, E.in], [tl + 12, [0, 0]]];
    const pos = chosen ? [[tPick, [cx, rowY], E.inOut], [tPick + 18, [yp.cx, yp.cy]]] : [[tl, [cx, rowY], E.in], [tl + 12, [cx, rowY + 0.3 * S]]];
    return group(name, [rect(size, [0, 0], 9999), stroke(rgb(C.black), ph ? 2 : 2.5), fill(rgb(col))], { p: pos, o: chosen ? [[t3out, 100, E.linear], [t3out + 14, 0]] : 100 });
  });
  const yw = slotWord(T, "yours.", S, C.black, yX, yoursW.by, { inAt: tPick + 22, outAt: t3out + 2, dist: 0.62, outDur: 12 });
  Cm.shape("beat 3 · yours. (word)", [group("word", yw.groups)], { ip: tPick, op: t3out + 20, masks: [pillMask([[0, roundRect(yp.cx, yp.cy, yp.w, yp.h, yp.h / 2)]])] });
  Cm.shape("beat 3 · nine worlds (pills)", sws, { ip: tRow, op: t3out + 20 });

  /* ---------- beat 2 · But someone could remember a place. facade. brand. ---------- */
  const b2 = blk(ph ? ["But someone", "could remember", "a place."] : ["But someone could", "remember a place."], undefined, true);
  const placeW = b2.find((w) => w.text === "place.");
  const t2 = at(B2), tP = at(B2 + 0.5), tF = at(B2 + 0.95), tB = at(B2 + 1.4), t2out = at(B3 - 0.22);
  wordsLayer(Cm, T, b2.filter((w) => w !== placeW), { nm: "beat 2 · but someone could remember a", size: S, enterAt: (i) => t2 + i * 4, exitAt: (i) => t2out + i * 1.5, exitDur: 14, ip: t2 - 1, op: t2out + 22 });
  const x0 = placeW.lx + placeW.x + pillShift(S);
  // colour has a job here: which thing is remembered (place green, facade blue, brand yellow, as on the site)
  const W2 = [["place.", C.green, C.black, tP], ["facade.", C.blue, C.white, tF], ["brand.", C.yellow, C.black, tB]];
  const g2 = W2.map(([w]) => pillGeom(S, x0 - 0.34 * S, placeW.by, slotWord(T, w, S, C.black, x0, placeW.by).width));
  const c2 = (g) => [g.cx, g.cy], s2 = (g, k = 1) => [g.w * k, g.h * k];
  const pSize = [[tP, s2(g2[0], 0.55), E.spring], [tP + 26, s2(g2[0]), E.hold], [tF - 2, s2(g2[0]), E.spring], [tF + 22, s2(g2[1]), E.hold], [tB - 2, s2(g2[1]), E.spring], [tB + 22, s2(g2[2]), E.hold], [t2out, s2(g2[2]), E.in], [t2out + 14, s2(g2[2], 0.9)]];
  const pPos = [[tP, c2(g2[0]), E.hold], [tF - 2, c2(g2[0]), E.spring], [tF + 22, c2(g2[1]), E.hold], [tB - 2, c2(g2[1]), E.spring], [tB + 22, c2(g2[2])]];
  const pCol = [[tP, rgb(C.green), E.hold], [tF + 2, rgb(C.blue), E.hold], [tB + 2, rgb(C.yellow)]];
  const slots = W2.map(([w, , ink, t], k) => slotWord(T, w, S, ink, x0, placeW.by, { inAt: t + (k ? 4 : 8), outAt: k < 2 ? W2[k + 1][3] - 2 : t2out + 1, dist: 0.62, outDur: 12 }));
  // the words are clipped by the pill (a mask with the pill's own keys), so they slide in and out of it like a slot
  const maskKeys = pSize.map(([t, sz, e]) => { const c = valAt(pPos, t); return [t, roundRect(c[0], c[1], sz[0], sz[1], sz[1] / 2), e]; });
  Cm.shape("beat 2 · place. facade. brand. (words)", slots.map((s, k) => group(W2[k][0], s.groups)), { ip: tP, op: t2out + 22, masks: [pillMask(maskKeys)] });
  Cm.shape("beat 2 · pill", [group("pill", [rect(pSize, pPos, 9999), stroke(rgb(C.black), SW), fill(pCol)], { o: [[t2out, 100, E.linear], [t2out + 14, 0]] })], { ip: tP, op: t2out + 22 });

  /* ---------- beat 1 · Nobody remembers a thumbnail. ---------- */
  const b1 = blk(ph ? ["Nobody", "remembers a", "thumbnail."] : ["Nobody remembers", "a thumbnail."]);
  const thumbW = b1.find((w) => w.text === "thumbnail.");
  const t1 = at(B1), tShrink = at(1.05), tFall = at(1.4), t1out = at(1.5);
  wordsLayer(Cm, T, b1.filter((w) => w !== thumbW), { nm: "beat 1 · nobody remembers a", size: S, enterAt: (i) => t1 + i * 5, exitAt: (i) => t1out + i * 2, exitDur: 16, ip: 0, op: t1out + 24 });
  // "thumbnail." becomes one: it shrinks into a small grey card, and the card is forgotten (it falls away)
  const k = ph ? 0.42 : 0.34;
  const cx = thumbW.lx + thumbW.x + thumbW.w / 2, cy = thumbW.by - (T.xh / T.upm) * S * 0.5;
  const tl = thumbW.letters.map((L, j) => letterGroup(T, { ...L, x: thumbW.lx + L.x }, S, rgb(C.black), { enter: riseAt(t1 + 3 * 5 + j * 1.2, S, thumbW.by) }));
  const cw2 = thumbW.w * k + (ph ? 22 : 44), ch2 = cw2 * 0.62, lw = ph ? 1.5 : 2;
  const card = group("card", [
    group("picture", [
      group("sun", [ellipse([cw2 * 0.13, cw2 * 0.13], [cw2 * 0.25, -ch2 * 0.2]), stroke(rgb(C.black), lw), fill(rgb(C.white))]),
      group("hill", [path(poly([[-cw2 * 0.38, ch2 * 0.34], [-cw2 * 0.1, -ch2 * 0.02], [cw2 * 0.08, ch2 * 0.17], [cw2 * 0.19, ch2 * 0.07], [cw2 * 0.38, ch2 * 0.34]])), stroke(rgb(C.black), lw), fill(rgb(C.white))])
    ], { o: [[0, 0, E.hold], [tShrink + 12, 0, E.linear], [tShrink + 20, 100]] }),
    group("frame", [rect([cw2, ch2], [0, 0], ph ? 8 : 14), stroke(rgb(C.black), ph ? 2 : 2.5), fill(rgb(C.bar))])
  ], { p: [cx, cy], s: [[tShrink + 12, [72, 72], E.spring], [tShrink + 32, [100, 100]]], o: [[0, 0, E.hold], [tShrink + 12, 0, E.linear], [tShrink + 18, 100]] });
  const word = group("word", tl, { a: [cx, cy], p: [[tShrink, [cx, cy], E.inOut], [tShrink + 20, [cx, cy - ch2 * 0.02]]], s: [[tShrink, [100, 100], E.inOut], [tShrink + 20, [k * 100, k * 100]]] });
  // the picture sits under the word only once it is small: the word moves to the card's lower part
  word.it[word.it.length - 1].p = prop([[tShrink, [cx, cy], E.inOut], [tShrink + 20, [cx, cy + ch2 * 0.26]]]);
  card.it[0].it[card.it[0].it.length - 1].p = prop([0, -ch2 * 0.12]);
  card.it[0].it[card.it[0].it.length - 1].s = prop([62, 62]);
  Cm.shape("beat 1 · thumbnail.", [group("thumbnail", [word, card], { a: [cx, cy], p: [[tFall, [cx, cy], E.in], [tFall + 22, [cx + 0.1 * S, cy + 0.9 * S]]], r: [[tFall, 0, E.in], [tFall + 22, 14]], o: [[tFall + 8, 100, E.linear], [tFall + 22, 0]], s: [[tFall, [100, 100], E.in], [tFall + 22, [80, 80]]] })], { ip: 0, op: tFall + 24 });

  /* ---------- the ground: grid paper, gone once the yellow covers the screen ---------- */
  gridPaper(Cm, { op: tCover + 1 });
  return Cm.json();
}

// the value of a key list at time t (keys hold or land exactly at the keys we sample)
function valAt(keys, t) { let v = keys[0][1]; for (const k of keys) if (k[0] <= t) v = k[1]; return v; }
const pillMask = (keys) => ({ inv: false, mode: "a", pt: pathProp(keys), o: prop(100), x: prop(0), nm: "pill" });
// the house rise for a letter whose group sits on baseline by (absolute coordinates)
function riseAt(t0, size, by) {
  return (base, s) => ({ p: [[t0, [base[0], base[1] + by + 0.42 * size], E.out], [t0 + 34, [base[0], base[1] + by]]], s: [[t0, [s * 0.96, s * 0.96], E.out], [t0 + 34, [s, s]]], o: [[t0, 0, E.linear], [t0 + 14, 100]] });
}
