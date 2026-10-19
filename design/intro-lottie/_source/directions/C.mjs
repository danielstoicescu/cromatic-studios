// Direction C · "The cup" (the coffee motif). On the studio's yellow, one cup seen from above. What someone could
// remember is poured into it as latte art (a house, a facade, the studio's star); nine cups for nine worlds, one stays;
// it steams through "and like a good coffee"; then the camera dives into the cup and the coffee opens like an iris,
// its crema rushing out to the edges, onto the city.
import { Comp, group, rect, ellipse, fill, stroke, trim, rgb, E, prop, path, poly, roundRect, f } from "../lib/lottie.mjs";
import { C, WORLDS, layout, wordsLayer, pillGeom, pillShift, slotWord, swapPill, at } from "../lib/kit.mjs";
import { letterGroup } from "../lib/text.mjs";

export const TL_C = { B1: 0.1, B2: 1.85, B3: 4.05, B4: 7.0, HOLD: 8.6, HAND: 9.2, END: 10.0 };

export function buildC(T, ab) {
  const ph = ab.name === "phone";
  const W = ab.w, H = ab.h;
  const Cm = new Comp({ w: W, h: H, dur: TL_C.END, nm: `Cromatic opening · C · the cup · ${ab.name}` });
  const { B1, B2, B3, B4, HOLD, HAND, END } = TL_C;
  Cm.marker("words", 0, at(HOLD)); Cm.marker("hold", at(HOLD), at(HAND)); Cm.marker("handoff", at(HAND), at(END));
  const S = ph ? 38 : 76, LEAD = 1.05, PG = 0.13, SW = 2.5;
  const capPx = (T.cap / T.upm) * S;
  const TX = ph ? 24 : 112, TY = ph ? 0.21 : 0.5;
  const blk = (lines, pill = false) => { const n = lines.length; const y = H * TY - (capPx + (n - 1) * S * LEAD + (pill ? PG * S : 0)) / 2 + capPx; return layout(T, lines, { x: TX, y, size: S, leading: LEAD, pillLines: pill ? [n - 1] : [], pillGap: PG }); };
  // the cup: seen from above; saucer, cup, coffee, crema
  // on a phone the cup stays above y 0.76 H: below it, during the opening, sit the consent card and Skip (r217)
  const cc = ph ? [W / 2, H * 0.6] : [W * 0.73, H * 0.52];
  const rs = ph ? 0.33 * W : 0.245 * H, rc = rs * 0.7, rk = rc * 0.8; // saucer, cup, coffee radii
  const mid = [W / 2, H / 2], halfDiag = Math.hypot(W, H) / 2;
  const tH = at(HAND), tHold = at(HOLD), tEnd = at(END);
  const tDive = tH + 2, tCover = tH + at(0.3), tOpen = tCover - 6;
  const Scover = (halfDiag * 1.04) / rk, Send = Scover * 1.7;

  /* ---------- text, top of the stack (pills are porcelain white: on the yellow, the yellow is the ground) ---------- */
  const b4 = blk(["That's how the right", "brand feels.", "And like a good", "coffee."], true);
  const coffeeW = b4.find((w) => w.text === "coffee."), t4 = at(B4), t4b = at(B4 + 0.7), tIn = at(B4 + 0.95);
  wordsLayer(Cm, T, b4.filter((w) => w !== coffeeW), { nm: "beat 4 · words", size: S, enterAt: (i) => (i < 6 ? t4 + i * 4 : t4b + (i - 6) * 4), exitAt: (i) => tH + i * 0.6, exitDur: 12, ip: t4 - 1, op: tH + 20 });
  const cX = coffeeW.lx + coffeeW.x + pillShift(S), cp = pillGeom(S, cX - 0.34 * S, coffeeW.by, coffeeW.w);
  Cm.shape("beat 4 · coffee. (word)", [group("word", slotWord(T, "coffee.", S, C.black, cX, coffeeW.by, { inAt: tIn + 6, outAt: tH, dist: 0.62, outDur: 10 }).groups)], { ip: tIn, op: tH + 14 });
  Cm.shape("beat 4 · coffee. (pill)", [group("pill", [rect([[tIn, [cp.w * 0.55, cp.h * 0.55], E.spring], [tIn + 26, [cp.w, cp.h], E.hold], [tH, [cp.w, cp.h], E.in], [tH + 12, [cp.w * 0.9, cp.h * 0.9]]], [cp.cx, cp.cy], 9999), stroke(rgb(C.black), SW), fill(rgb(C.white))], { o: [[tH, 100, E.linear], [tH + 12, 0]] })], { ip: tIn, op: tH + 14 });

  const b3a = blk(["Nine worlds over", "the same streets."]), b3b = blk(["One will feel", "like yours."], true);
  const t3 = at(B3), t3b = at(B3 + 1.6), tPick = at(B3 + 1.7), t3out = at(B4 - 0.28);
  wordsLayer(Cm, T, b3a, { nm: "beat 3 · nine worlds over the same streets", size: S, enterAt: (i) => t3 + i * 4, exitAt: (i) => t3b - 16 + i, exitDur: 12, ip: t3 - 1, op: t3b + 4 });
  const yoursW = b3b.find((w) => w.text === "yours.");
  wordsLayer(Cm, T, b3b.filter((w) => w !== yoursW), { nm: "beat 3 · one will feel like", size: S, enterAt: (i) => t3b + i * 4, exitAt: (i) => t3out + i * 1.5, exitDur: 14, ip: t3b - 1, op: t3out + 20 });
  const yX = yoursW.lx + yoursW.x + pillShift(S), yp = pillGeom(S, yX - 0.34 * S, yoursW.by, yoursW.w), tY = t3b + 16;
  Cm.shape("beat 3 · yours. (word)", [group("word", slotWord(T, "yours.", S, C.black, yX, yoursW.by, { inAt: tY + 6, outAt: t3out + 2, dist: 0.62, outDur: 12 }).groups)], { ip: tY, op: t3out + 20 });
  Cm.shape("beat 3 · yours. (pill)", [group("pill", [rect([[tY, [yp.w * 0.55, yp.h * 0.55], E.spring], [tY + 26, [yp.w, yp.h], E.hold], [t3out, [yp.w, yp.h], E.in], [t3out + 14, [yp.w * 0.9, yp.h * 0.9]]], [yp.cx, yp.cy], 9999), stroke(rgb(C.black), SW), fill(rgb(C.white))], { o: [[t3out, 100, E.linear], [t3out + 14, 0]] })], { ip: tY, op: t3out + 20 });

  const b2 = blk(["But someone could", "remember a", "place."], true);
  const placeW = b2.find((w) => w.text === "place."), t2 = at(B2), tP = at(B2 + 0.5), tF = at(B2 + 0.95), tB = at(B2 + 1.4), t2out = at(B3 - 0.22);
  wordsLayer(Cm, T, b2.filter((w) => w !== placeW), { nm: "beat 2 · but someone could remember a", size: S, enterAt: (i) => t2 + i * 4, exitAt: (i) => t2out + i * 1.5, exitDur: 14, ip: t2 - 1, op: t2out + 22 });
  swapPill(Cm, T, { S, x0: placeW.lx + placeW.x + pillShift(S), by: placeW.by, words: [["place.", C.white, C.black, tP], ["facade.", C.white, C.black, tF], ["brand.", C.white, C.black, tB]], tOut: t2out, SW, nm: "beat 2 · place. facade. brand." });

  const b1 = blk(["Nobody remembers", "a thumbnail."]), t1out = at(1.5);
  wordsLayer(Cm, T, b1, { nm: "beat 1 · nobody remembers a thumbnail", size: S, enterAt: (i) => at(B1) + i * 5, exitAt: (i) => t1out + i * 2, exitDur: 16, ip: 0, op: t1out + 24 });

  /* ---------- steam: three ribbons, drawn upward, on a loop that the hold repeats seamlessly ---------- */
  const loop = at(HAND) - at(HOLD); // the hold's length: the steam's period
  const sTop = cc[1] - rc - (ph ? 12 : 20), sLen = ph ? 118 : 230;
  const ribbons = [-1, 0, 1].map((k, i) => {
    const x = cc[0] + k * rc * 0.46, w = ph ? 13 : 20;
    const pts = [[x, sTop], [x + w, sTop - sLen * 0.25], [x - w, sTop - sLen * 0.5], [x + w, sTop - sLen * 0.75], [x, sTop - sLen]];
    const pth = { c: false, v: pts, i: pts.map((_, j) => (j ? [0, sLen * 0.09] : [0, 0])), o: pts.map((_, j) => (j < pts.length - 1 ? [0, -sLen * 0.09] : [0, 0])) };
    // each period the ribbon draws on (end 0 -> 100) and off (start 0 -> 100), then resets while empty; periods are
    // in phase with the hold, so the hold starts and ends on the same frame and loops without a seam
    const tS = at(B4 + 0.2), ph0 = (i * loop) / 3;
    const sK = [[0, 0, E.hold]], eK = [[0, 0, E.hold]];
    for (let t = tHold - Math.ceil((tHold - tS) / loop) * loop - ph0; t < tEnd; t += loop) {
      eK.push([t, 0, E.inOut], [t + loop * 0.62, 100, E.hold]);
      sK.push([t + loop * 0.38, 0, E.inOut], [t + loop, 100, E.hold]);
    }
    const clean = (k) => k.filter((x, j) => j === 0 || x[0] > k[j - 1][0]).map((x, j, arr) => (j === arr.length - 1 ? [x[0], x[1]] : x));
    return group("steam " + i, [path(pth), trim(clean(sK), clean(eK)), stroke(rgb(C.white), ph ? 8 : 12, 100, { lc: 2 }), stroke(rgb(C.black), (ph ? 8 : 12) + 5, 100, { lc: 2 })]);
  });
  Cm.shape("beat 4 · steam", ribbons, { ip: at(B4 + 0.2), op: tH + 10, ks: { o: [[at(B4 + 0.2), 0, E.linear], [at(B4 + 0.5), 100, E.hold], [tH, 100, E.linear], [tH + 8, 0]] } });

  /* ---------- the cup ---------- */
  // latte art, in the crema's light colour: a house (place), a facade (facade), the studio's star (brand)
  const art = (tIn2, tOut2, items) => group("art", items, { a: cc, p: cc, s: [[0, [0, 0], E.hold], [tIn2, [0, 0], E.spring], [tIn2 + 20, [100, 100], ...(tOut2 ? [E.in] : [])], ...(tOut2 ? [[tOut2, [100, 100], E.in], [tOut2 + 10, [0, 0]]] : [])], o: [[0, 0, E.hold], [tIn2, 0, E.linear], [tIn2 + 6, 100, ...(tOut2 ? [E.hold] : [])], ...(tOut2 ? [[tOut2 + 6, 100, E.linear], [tOut2 + 10, 0]] : [])] });
  const a = rk * 0.55, L = rgb(C.cremaLight);
  const houseArt = art(tP + 6, tF - 2, [group("house", [path(poly([[cc[0] - a * 0.7, cc[1] + a * 0.65], [cc[0] - a * 0.7, cc[1] - a * 0.1], [cc[0], cc[1] - a * 0.75], [cc[0] + a * 0.7, cc[1] - a * 0.1], [cc[0] + a * 0.7, cc[1] + a * 0.65]])), rect([a * 0.34, a * 0.5], [cc[0], cc[1] + a * 0.4], 2), fill(L, 100, 2)])]);
  const facadeArt = art(tF + 6, tB - 2, [group("facade", [
    rect([a * 1.5, a * 1.3], [cc[0], cc[1] + a * 0.05], 3),
    ...[-0.45, 0, 0.45].flatMap((u) => [rect([a * 0.28, a * 0.36], [cc[0] + u * a, cc[1] - a * 0.22], a * 0.14), rect([a * 0.28, a * 0.3], [cc[0] + u * a, cc[1] + a * 0.36], 1)]),
    fill(L, 100, 2)]), group("cornice", [rect([a * 1.75, a * 0.16], [cc[0], cc[1] - a * 0.66], 2), fill(L)])]);
  const starArt = art(tB + 6, tOpen - 2, [group("star", [path(star4(cc[0], cc[1], a * 0.95)), fill(L)])]);
  // the coffee, with its iris: a hole that opens from the middle (even-odd), crema at its edge
  const holeR = [[0, 0, E.hold], [tOpen, 0, [0.5, 0, 0.15, 1]], [tEnd, rk * 1.02]];
  const holeS = holeR.map(([t, r, e]) => [t, [r * 2, r * 2], e]);
  const coffee = [
    group("iris edge", [ellipse(holeS, cc), stroke(rgb(C.black), 0.5), ], { o: [[0, 0, E.hold], [tOpen, 0, E.linear], [tOpen + 2, 100]] }),
    group("iris crema", [ellipse(holeS, cc), stroke(rgb(C.crema), rk * 0.08)], { o: [[0, 0, E.hold], [tOpen, 0, E.linear], [tOpen + 2, 100]] }),
    houseArt, facadeArt, starArt,
    group("crema", [ellipse([rk * 2 - rk * 0.12, rk * 2 - rk * 0.12], cc), stroke(rgb(C.crema), rk * 0.1)]),
    group("coffee", [ellipse([rk * 2, rk * 2], cc), ellipse(holeS, cc), fill(rgb(C.coffee), 100, 2)])
  ];
  const cupBody = [
    group("rim", [ellipse([rc * 2, rc * 2], cc), stroke(rgb(C.black), SW), fill(rgb(C.white))]),
    group("handle", [rect([rs * 0.36, rs * 0.17], [cc[0] + rc + rs * 0.12, cc[1]], 9999), stroke(rgb(C.black), SW), fill(rgb(C.white))], { a: cc, p: cc, r: 32 }),
    group("saucer well", [ellipse([rc * 2.18, rc * 2.18], cc), stroke(rgb(C.black), 1.5)]),
    group("saucer", [ellipse([rs * 2, rs * 2], cc), stroke(rgb(C.black), SW), fill(rgb(C.white))])
  ];
  // the cup's camera: it lands (beat 2), shrinks into the middle of nine (beat 3), comes back (the pick), then dives
  const tLand = at(B2 - 0.05), tNine = at(B3 + 0.45), tBack = tPick + 4;
  const k9 = 0.3; // the cup's size among the nine
  const sK = [[tLand, [55, 55], E.spring], [tLand + 30, [100, 100], E.hold], [tNine, [100, 100], E.inOut], [tNine + 22, [k9 * 100, k9 * 100], E.hold], [tBack, [k9 * 100, k9 * 100], E.spring], [tBack + 30, [100, 100], E.hold], [tDive, [100, 100], [0.55, 0, 0.75, 0.3]], [tCover, [Scover * 100, Scover * 100], E.linear], [tEnd, [Send * 100, Send * 100]]];
  const pK = [[tDive, cc, [0.55, 0, 0.75, 0.3]], [tCover, mid]];
  const rK = [[tLand, -24, E.spring], [tLand + 30, 0, E.hold], [tDive, 0, E.in], [tCover, 18]];
  const cupCam = Cm.nul("cup · camera", { ks: { a: cc, p: pK, s: sK, r: rK }, op: tEnd + 1 });
  Cm.shape("cup · coffee", coffee, { parent: cupCam, ip: tLand, op: tEnd + 1, ks: { o: [[tLand, 0, E.linear], [tLand + 4, 100]] } });
  Cm.shape("cup · porcelain", cupBody, { parent: cupCam, ip: tLand, op: tCover + 2, ks: { o: [[tLand, 0, E.linear], [tLand + 4, 100]] } });

  // the other eight cups, one per world, around the middle one; they pop in, then out when one is chosen
  const others = [];
  const step = rs * k9 * 2.45;
  const cells = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  cells.forEach(([gx, gy], i) => {
    const [, col] = WORLDS[i + 1], x = cc[0] + gx * step, y = cc[1] + gy * step, r = rs * k9, t0 = tNine + 10 + i * 3, tOut = tPick - 6 + i * 2;
    others.push(group("cup " + WORLDS[i + 1][0], [
      group("coffee", [ellipse([rk * k9 * 2, rk * k9 * 2], [x, y]), fill(rgb(C.coffee))]),
      group("rim", [ellipse([rc * k9 * 2, rc * k9 * 2], [x, y]), stroke(rgb(C.black), 2), fill(rgb(col))]),
      group("saucer", [ellipse([r * 2, r * 2], [x, y]), stroke(rgb(C.black), 2), fill(rgb(C.white))])
    ], { a: [x, y], p: [x, y], s: [[0, [0, 0], E.hold], [t0, [0, 0], E.spring], [t0 + 20, [100, 100], E.hold], [tOut, [100, 100], E.in], [tOut + 12, [0, 0]]] }));
  });
  Cm.shape("beat 3 · eight more cups", others, { ip: tNine, op: tPick + 40 });

  // beat 1: a thumbnail where the cup will be, forgotten (it shrinks away, turning)
  const tw = ph ? 96 : 150, th = tw * 0.62;
  Cm.shape("beat 1 · a thumbnail", [group("thumbnail", [
    group("hill", [path(poly([[-tw * 0.36, th * 0.3], [-tw * 0.1, -th * 0.04], [tw * 0.08, th * 0.16], [tw * 0.18, th * 0.06], [tw * 0.36, th * 0.3]])), stroke(rgb(C.black), 2), fill(rgb(C.white))], { p: cc }),
    group("sun", [ellipse([tw * 0.12, tw * 0.12], [tw * 0.24, -th * 0.2]), stroke(rgb(C.black), 2), fill(rgb(C.white))], { p: cc }),
    group("card", [rect([tw, th], cc, ph ? 8 : 12), stroke(rgb(C.black), SW), fill(rgb(C.bar))])
  ], { a: cc, p: cc, s: [[at(0.35), [0, 0], E.spring], [at(0.35) + 22, [100, 100], E.hold], [at(1.15), [100, 100], E.in], [at(1.15) + 24, [0, 0]]], r: [[at(1.15), 0, E.in], [at(1.15) + 24, 90]] })], { ip: 0, op: at(1.6) });

  /* ---------- the ground: the studio's yellow, until the coffee covers the screen ---------- */
  Cm.shape("ground · yellow", [group("ground", [rect([W + 8, H + 8], mid), fill(rgb(C.yellow))])], { op: tCover + 1 });
  return Cm.json();
}

function star4(cx, cy, r) {
  const k = 0.3 * r, c = 0.18 * r; // a soft four-point star: curved sides, like the site's punctuation
  const v = [[cx, cy - r], [cx + k, cy - k], [cx + r, cy], [cx + k, cy + k], [cx, cy + r], [cx - k, cy + k], [cx - r, cy], [cx - k, cy - k]];
  return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) };
}
