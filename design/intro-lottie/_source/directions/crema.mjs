// Phase 3 · concept "Crema": one cup, the camera around it. The old loader's yellow cup (the intro's own three.js cup,
// projected and lit here) lands on the paper seen from straight above; the thumbnail sinks into its crema and is gone;
// the camera tilts down to the cup as the pill counts place, facade, brand (the cup spins once for each); the camera
// dives into the cup and the crema becomes a lens on the same street in nine worlds, a slot reel that stops on yours;
// it pulls out, "feels." flies onto the cup as the Multiverse band, the cup turns (the loader, its steam rising) and
// the camera dives in again: the crema is the window onto the live map.
import { group, rect, ellipse, fill, gfill, stroke, rgb, E, prop, path, poly, roundRect, pathProp } from "../lib/lottie.mjs";
import { C } from "../lib/kit.mjs";
import { makeScene, clean, valAt, reversePath, ellipsePathAt, RISE, EXIT, GLIDE, WORLD_NAMES } from "../lib/scene.mjs";
import { cupTurn, cupPlay, cupMove, cupFrames, cupPath, cupPathPlay, steamLoop, steamPlay, valAtEased } from "../lib/cupLayers.mjs";
import { DESIGNS } from "../lib/cup3d.mjs";

export const TL = { B1: 0.12, B2: 1.62, B3: 3.8, B4: 6.85, HOLD: 9.25, HAND: 11.25, END: 12.55, SHORT: 12.65, SHORT_END: 13.15, COMP: 13.2 };
const BAND = { y0: 0.72, y1: 1.12 };

export function buildCrema(T, ab, { atlasPath = "worlds.webp" } = {}) {
  const ph = ab.name === "phone";
  const K = makeScene(T, ab, { dur: TL.COMP, nm: `Cromatic opening · Crema · ${ab.name}`, camKeys: [[0, [0, 0]], [120, [-6, 4]], [240, [6, -4]], [420, [-4, 6]], [540, [0, 0]]] });
  const { Cm, W, H, t, PO, PT, blk, lines, slotPill, ring, setLine, pillGeom, pillShift, elevKs, pillShadow, shOff, shO, letterAt, riseKeys, lineClip } = K;
  const S = ph ? 46 : 84, S3 = ph ? 40 : 66;
  const tHold = t(TL.HOLD), tH = t(TL.HAND), tEnd = t(TL.END), tS0 = t(TL.SHORT), tS1 = t(TL.SHORT_END);
  Cm.marker("words", 0, tHold); Cm.marker("hold", tHold, tH); Cm.marker("handoff", tH, tEnd); Cm.marker("short", tS0, tS1);

  /* ======================= the cup's places on screen (the rig) ======================= */
  const U = ph ? 54 : 92; // px per cup unit at rest
  const home = ph ? [195, 452] : [1010, 470], centre = ph ? [195, 432] : [640, 450];
  const lensC = ph ? [195, 418] : [985, 462], lensK = ph ? 2.0 : 1.9; // the dive: the crema as a lens
  // (the pull-out ends exactly one hold-turn before the hold: the cup is at the hold's pose there)
  const tLand = t(0.42), tTilt0 = t(1.72), tTilt1 = t(2.42), tDive0 = t(3.62), tDive1 = t(4.1), tBack1 = t(TL.HOLD) - 120, tBack0 = tBack1 - 33, tGo = t(8.35), tGone = t(9.05);
  const tP = t(TL.B2 + 0.28), tF = t(TL.B2 + 0.93), tB = t(TL.B2 + 1.48), t2out = t(TL.B3 - 0.18);
  const DROP = [0.3, 0, 0.25, 1];
  const rigP = [[0, home, E.hold], [tDive0, home, [0.6, 0, 0.25, 1]], [tDive1, lensC, E.hold], [tBack0, lensC, [0.55, 0, 0.3, 1]], [tBack1, home, E.hold], [tGo, home, GLIDE], [tGone, centre, E.hold], [tH, centre, E.hold]];
  const rigS = [[0, 172, DROP], [tLand, 100, E.out], [tLand + 5, 97, E.out], [tLand + 14, 100, E.hold], [tDive0, 100, [0.6, 0, 0.25, 1]], [tDive1, lensK * 100, E.hold], [tBack0, lensK * 100, [0.55, 0, 0.3, 1]], [tBack1, 100, E.hold]];
  const rig = Cm.nul("cup · rig", { parent: PO, ks: { p: rigP, s: rigS.map(([tt, v, e]) => [tt, [v, v], e]) } });
  const rigAt = (tt) => ({ p: [valAtEased(rigP.map(([a, v, e]) => [a, v[0], e]), tt), valAtEased(rigP.map(([a, v, e]) => [a, v[1], e]), tt)], s: valAtEased(rigS, tt) / 100 });

  /* ======================= the views of the cup, segment by segment ======================= */
  const PITCH = 26;
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));
  const seg = (a, b) => (tt) => ease((tt - a) / (b - a));
  // yaw (deg) at the joins: top view 300 (the handle down right), tilted 330 (the handle right, toward us)
  const top0 = { pitch: 90, yaw: 330, U };
  const pre = cupTurn(Cm, "cup-26", { pitch: PITCH, U, steps: 48 });
  const preB = cupTurn(Cm, "cup-26-band", { pitch: PITCH, U, steps: 48, band: BAND });
  const st = steamLoop(Cm, "steam", { period: 120, height: ph ? 120 : 190, scale: ph ? 0.55 : 0.92 });
  const steamAt = [0, -(ph ? 34 : 58)]; // the coffee's centre, tilted, in the rig

  /* ---------- the hold, the handoff, the short version (top of the stack: they come last in time) ---------- */
  // the handoff: from the hold's pose, the camera dives into the cup; the crema goes, the live map is in the cup, and the
  // cup grows past every edge (the window: a hole through the paper, its light, the cup's inside)
  const tTop = tH + 30;
  // the tilt: one precomp of views from the side (26 deg) to straight above, played forward and back (with the band too)
  const tiltView = (u) => ({ pitch: PITCH + (90 - PITCH) * u, yaw: 330, U });
  const preT = cupPath(Cm, "cup-tilt", { viewAt: tiltView, steps: 16, U, cremaTurn: 330 });
  const preTB = cupPath(Cm, "cup-tilt-band", { viewAt: tiltView, steps: 16, U, band: BAND, cremaTurn: 330 });
  const topF = preT.keys[preT.keys.length - 1][1]; // seen from above: the coffee's ellipse, in the rig's space
  const handS = [[tH, 100, [0.5, 0, 0.75, 0.25]], [tTop, 150, [0.45, 0, 0.92, 0.32]], [tEnd - 2, 1500]];
  const hY = [[tH, centre[1], E.inOut], [tTop, centre[1] + (ph ? 36 : 56)]];
  const hrig = Cm.nul("handoff · rig", { parent: PO, ip: tH, op: tEnd + 1, ks: { p: hY.map(([tt, y, e]) => [tt, [centre[0], y], e]), s: handS.map(([tt, v, e]) => [tt, [v, v], e]) } });
  // the window: an iris opens in the crema (a dot to the coffee's edge), the live map is in the cup; it grows past every edge
  const irisK = [[tTop - 1, 0, E.hold], [tTop, 0.04, [0.3, 0.6, 0.3, 1]], [tTop + 12, 0.996]];
  const irisAt = (tt) => (tt < tTop ? 0 : valAtEased(irisK, tt));
  const winAt = (tt) => { const sc = valAtEased(handS, tt) / 100, y = valAtEased(hY, tt), r = irisAt(tt); return ellipsePathAt(centre[0] + topF.coffee.cx * sc, y + topF.coffee.cy * sc, topF.coffee.a * sc * r, topF.coffee.b * sc * r); };
  const holeT = []; for (let tt = tTop - 1; tt <= tEnd; tt += 2) holeT.push(tt);
  const winK = [[0, ellipsePathAt(centre[0], centre[1], 0, 0), E.hold], ...holeT.map((tt) => [tt, winAt(tt), E.linear])];
  const holeMask = (keys) => [{ inv: true, mode: "a", pt: pathProp(keys.map(([tk, q, e]) => [tk, reversePath(q), e])), o: prop(100), x: prop(0), nm: "window" }];
  // (in the precomp's own space: its origin is the middle of its box)
  const pc = [preTB.w / 2, preTB.h / 2];
  const localHole = [[tH, ellipsePathAt(pc[0], pc[1], 0, 0), E.hold], [tTop - 1, ellipsePathAt(pc[0], pc[1], 0, 0), E.hold], ...irisK.slice(1).map(([tt, r, e]) => [tt, ellipsePathAt(pc[0] + topF.coffee.cx, pc[1] + topF.coffee.cy, topF.coffee.a * r, topF.coffee.b * r), e])];
  // (into the handoff the steam goes on, thinning, as the camera rises over the cup; above the cup, as in the hold)
  steamPlay(Cm, st, { nm: "handoff · steam", parent: rig, p: steamAt, ip: tH, op: tH + 22, phase: 0, o: [[tH, 100, E.linear], [tH + 20, 0]] });
  cupPathPlay(Cm, preTB, { nm: "handoff · cup", parent: hrig, ip: tH, op: tEnd + 1, uK: [[tH, 0, [0.5, 0, 0.3, 1]], [tTop, 1, E.hold], [tEnd, 1]], masks: holeMask(localHole) });
  // the short version: the cup pops in where it holds, turning, then the hold
  const sRig = Cm.nul("short · rig", { parent: PO, ip: tS0, op: tS1 + 1, ks: { p: centre, s: [[tS0, [30, 30], E.spring], [tS1 - 2, [100, 100]]] } });
  steamPlay(Cm, st, { nm: "short · steam", parent: sRig, p: steamAt, ip: tS0, op: tS1 + 1, phase: ((((tS0 - tS1) / 120) % 1) + 1) % 1, o: [[tS0, 0, E.linear], [tS1, 100]] });
  cupPlay(Cm, preB, { nm: "short · cup", parent: sRig, ip: tS0, op: tS1 + 1, turnsK: [[tS0, 330 / 360 - 0.35, E.out], [tS1, 330 / 360]] });
  function tBandIn() { return t(8.22); }
  // the cup's turn from the pull-out on: one turn every 120 frames, the hold's turn exactly (330 deg at the hold's start)
  const turnsAt = (tt) => 330 / 360 + (tt - tHold) / 120;

  /* ---------- text and pills (the words plane) ---------- */
  // beat 4 · that's how the right brand feels. "feels." is the Multiverse pill; it flies onto the cup and is its band
  const b4 = blk(ph ? ["That's how", "the right brand", "feels."] : ["That's how", "the right brand", "feels."], { size: S, pill: true, mid: ph ? 0.2 : 0.5 });
  const feelsW = b4.find((w) => w.text === "feels.");
  const t4 = t(TL.B4), tFeels = t(TL.B4 + 0.32), tFly = t(7.92);
  const fX = feelsW.lx + feelsW.x + pillShift(S), fL = setLine(T, "feels.", S, -0.035), fg = pillGeom(S, fX - 0.34 * S, feelsW.by, fL.width);
  const fc = [fg.cx, fg.cy], ringW = (ph ? 0.08 : 0.064) * S;
  // where the band is on the cup at rest (the rig's home), in comp space: the pill shrinks into it
  const bandC = [home[0], home[1] + U * 0.02], bandSz = [U * 2.86, U * 0.42];
  const tB0 = tBandIn();
  const feelsRoot = Cm.nul("beat 4 · feels.", { parent: PO, ip: tFeels, op: tB0 + 8, ks: {
    a: fc, p: [[tFeels, fc, E.hold], [tFly, fc, [0.5, 0, 0.2, 1]], [tB0, bandC]],
    s: [[tFeels, [40, 40], E.spring], [tFeels + 24, [100, 100], E.hold], [tFly, [100, 100], [0.5, 0, 0.2, 1]], [tB0, [(bandSz[0] / fg.w) * 100, (bandSz[1] / fg.h) * 100]]],
    o: [[tB0, 100, E.linear], [tB0 + 6, 0]]
  } });
  const feelsLetters = group("feels.", fL.letters.map((l, j) => letterAt(l, fX, feelsW.by, S, C.black, (b, s) => ({
    p: clean([[tFeels + 6 + j, [b[0], b[1] + 0.42 * S], RISE], [tFeels + 26 + j, b, E.linear], [tFly - 4 + j, b, EXIT], [tFly + 8 + j, [b[0], b[1] - 0.5 * S]]]),
    o: clean([[0, 0, E.hold], [tFeels + 6 + j, 0, E.linear], [tFeels + 13 + j, 100, E.linear], [tFly + 2 + j, 100, E.linear], [tFly + 8 + j, 0]]), s: [s, s]
  }))));
  Cm.shape("beat 4 · feels. · ring, word, body", [feelsLetters, ...ring([fg.w, fg.h], fc, [[tFeels, 0, E.linear], [tB0, 400]], ringW), group("body", [rect([fg.w, fg.h], fc, 9999), fill(rgb(C.white))], { o: [[tFly, 100, E.linear], [tFly + 10, 0]] })], { parent: feelsRoot, ip: tFeels, op: tB0 + 8 });
  lines("beat 4 · that's how the right brand", b4.filter((w) => w !== feelsW), { size: S, inAt: (i) => t4 + i * 3.5, outAt: (i) => tFly - 2 + i * 1.5 });

  // beat 3 · nine worlds over the same streets / one will feel like yours.
  const b3a = blk(["Nine worlds over", "the same streets."], { size: S3, mid: ph ? 0.19 : 0.46 });
  const b3b = blk(["One will feel", "like yours."], { size: S3, mid: ph ? 0.19 : 0.46, pill: true });
  const t3 = t(TL.B3 + 0.06), t3b = t(TL.B3 + 1.7), tPick = t(5.72), t3out = t(TL.B4 - 0.18);
  const yoursW = b3b.find((w) => w.text === "yours.");
  const yX = yoursW.lx + yoursW.x + pillShift(S3);
  slotPill("beat 3 · yours.", { size: S3, x0: yX, by: yoursW.by, words: [["yours.", C.yellow, C.black, tPick + 6]], tOut: t3out, outTo: "fade", ip: tPick + 5, op: t3out + 20, id: "yours" });
  lines("beat 3 · nine worlds over the same streets", b3a, { size: S3, inAt: (i) => t3 + i * 3.5, outAt: (i) => t3b - 8 + i * 1.2 });
  lines("beat 3 · one will feel like", b3b.filter((w) => w !== yoursW), { size: S3, inAt: (i) => t3b + i * 3.5, outAt: (i) => t3out + i * 1.2 });

  // beat 2 · but someone could remember a place / facade / brand.
  const b2 = blk(ph ? ["But someone", "could remember", "a place."] : ["But someone", "could remember", "a place."], { size: S, pill: true, mid: ph ? 0.2 : 0.5 });
  const placeW = b2.find((w) => w.text === "place.");
  const t2 = t(TL.B2);
  const px0 = placeW.lx + placeW.x + pillShift(S);
  slotPill("beat 2 · place. facade. brand.", { size: S, x0: px0, by: placeW.by, words: [["place.", C.green, C.black, tP], ["facade.", C.blue, C.black, tF], ["brand.", C.yellow, C.black, tB]], tOut: t2out, outTo: "fade", ip: tP - 1, op: t2out + 16, id: "word" });
  lines("beat 2 · but someone could remember a", b2.filter((w) => w !== placeW), { size: S, inAt: (i) => t2 + i * 3.5, outAt: (i) => t2out + i * 1.2 });

  // beat 1 · nobody remembers a thumbnail.: the word shrinks into the grey card; the card falls into the cup and sinks
  const b1 = blk(ph ? ["Nobody", "remembers a", "thumbnail."] : ["Nobody", "remembers a", "thumbnail."], { size: S, mid: ph ? 0.2 : 0.5 });
  const thumbW = b1.find((w) => w.text === "thumbnail.");
  const t1 = t(TL.B1), tShrink = t(0.9), tCard = t(1.0), tThrow = t(1.22), tSink = t(1.52), t1out = t(1.42);
  const k = ph ? 0.42 : 0.36;
  const cx = thumbW.lx + thumbW.x + thumbW.w / 2, cy = thumbW.by - (T.xh / T.upm) * S * 0.5;
  // the coffee's centre, seen from above, on screen (the rig at home, landed)
  const cupTop = [home[0], home[1]];
  const thumbNull = Cm.nul("beat 1 · thumbnail", { parent: PO, op: tSink + 2, ks: {
    a: [cx, cy],
    p: { x: [[tThrow, cx, [0.45, 0, 0.35, 1]], [tSink, cupTop[0]]], y: [[tThrow, cy, [0.2, 0.6, 0.4, 1]], [Math.round((tThrow + tSink) / 2), Math.min(cy, cupTop[1]) - (ph ? 50 : 110), [0.55, 0, 0.8, 0.4]], [tSink, cupTop[1]]] },
    s: [[tShrink, [100, 100], [0.6, 0, 0.25, 1]], [tShrink + 16, [k * 100, k * 100], E.hold], [tThrow, [k * 100, k * 100], [0.5, 0, 0.9, 0.5]], [tSink, [8, 8]]],
    r: [[tThrow, 0, [0.4, 0, 0.7, 1]], [tSink, 200]],
    o: [[tSink - 6, 100, E.linear], [tSink, 0]]
  } });
  const ti1 = t1 + 2 * 4;
  Cm.shape("beat 1 · thumbnail. (word)", [group("thumbnail.", thumbW.letters.map((L, j) => letterAt(L, thumbW.lx, thumbW.by, S, C.black, riseKeys(ti1 + j, null, S))))], { parent: thumbNull, op: tCard + 6, masks: [lineClip([thumbW], S)], ks: { o: [[tCard, 100, E.linear], [tCard + 6, 0]] } });
  const cw = (thumbW.w * k + (ph ? 22 : 44)) / k, chh = cw * (ph ? 0.5 : 0.56), lw = (ph ? 1.5 : 2) / k, cardC = [cx, cy - chh * 0.12], cardR = (ph ? 8 : 14) / k;
  Cm.shape("beat 1 · the card", [
    group("picture", [
      group("sun", [ellipse([cw * 0.09, cw * 0.09], [cx + cw * 0.26, cy - chh * 0.42]), stroke(rgb(C.black), lw), fill(rgb(C.white))]),
      group("hill", [path(poly([[cx - cw * 0.36, cy - chh * 0.16], [cx - cw * 0.1, cy - chh * 0.44], [cx + cw * 0.06, cy - chh * 0.28], [cx + cw * 0.17, cy - chh * 0.36], [cx + cw * 0.36, cy - chh * 0.16]])), stroke(rgb(C.black), lw), fill(rgb(C.white))])
    ]),
    group("frame", [rect([cw, chh], cardC, cardR), stroke(rgb(C.black), (ph ? 2 : 2.5) / k), fill(rgb(C.bar))])
  ], { parent: thumbNull, ip: tCard, op: tSink + 2, ks: { a: [cx, cy], p: [cx, cy], s: [[tCard, [86, 86], E.spring], [tCard + 16, [100, 100]]], o: [[tCard, 0, E.linear], [tCard + 5, 100]] } });
  lines("beat 1 · nobody remembers a", b1.filter((w) => w !== thumbW), { size: S, inAt: (i) => t1 + i * 4, outAt: (i) => t1out + i * 1.5 });

  /* ---------- the hold: the cup turning (one full turn), its steam (one full loop): the loop's first frame is its last ---------- */
  steamPlay(Cm, st, { nm: "cup · steam (back, hold)", parent: rig, p: steamAt, ip: tBack1 - 8, op: tH, phase: ((((tBack1 - 8 - tHold) / 120) % 1) + 1) % 1, o: [[tBack1 - 8, 0, E.linear], [tBack1 + 10, 100]] });
  cupPlay(Cm, preB, { nm: "hold · cup (the band)", parent: rig, ip: tBandIn(), op: tH, turnsK: [[tBandIn(), turnsAt(tBandIn()), E.linear], [tH, turnsAt(tH)]] });

  /* ---------- the lens: the same street in nine worlds, one after another, an iris each, slowing onto yours ---------- */
  // each world's street (the Multiverse preview: the roundabout and the road) fills the crema; the next opens over it from
  // the middle with a bright ring at its edge; quick at first, slower, and the last is Cromatic
  const SQA = Cm.asset("worlds-sq", 450, 450, "worlds-sq.webp");
  const lensR = 1.27 * U * lensK; // the coffee's radius seen from above, on screen
  const seqW = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const gaps = [10, 10, 10, 11, 12, 14, 17, 22]; // frames between the irises (they slow down)
  const tR0 = t(4.08), scaleT = (tPick - 6 - tR0) / gaps.reduce((a, b) => a + b, 0);
  const tIris = [tR0]; gaps.forEach((g) => tIris.push(Math.round(tIris[tIris.length - 1] + g * scaleT)));
  const IR = 7; // frames an iris takes to open
  const lensO = [[tDive1 - 10, 0, E.linear], [tDive1 + 4, 100, E.hold], [tBack0, 100, E.linear], [tBack0 + 12, 0]];
  const picK = (2 * lensR * 1.02) / 150;
  // the lens's glass on top: a gloss, the coffee's dark meniscus at the edge, and the irises' bright rings
  Cm.shape("lens · glass", [
    ...seqW.map((wi, n) => n === 0 ? null : group("iris " + n, [ellipse([[tIris[n], [4, 4], [0.25, 0.6, 0.3, 1]], [tIris[n] + IR, [lensR * 2, lensR * 2]]], lensC), stroke(rgb("#FFF4DE"), [[tIris[n], 5, E.linear], [tIris[n] + IR, 1.5]], [[tIris[n], 0, E.hold], [tIris[n] + 1, 90, E.linear], [tIris[n] + IR + 2, 0]])])).filter(Boolean),
    group("gloss", [ellipse([lensR * 1.2, lensR * 0.5], [lensC[0] - lensR * 0.28, lensC[1] - lensR * 0.5]), gfill({ type: 2, s: [lensC[0] - lensR * 0.28, lensC[1] - lensR * 0.5], e: [lensC[0] + lensR * 0.32, lensC[1] - lensR * 0.5], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, 0.32], [1, 0]] })]),
    group("edge", [ellipse([lensR * 2, lensR * 2], lensC), stroke(rgb("#3a1c0a"), lensR * 0.08, 55)])
  ], { ip: tDive1 - 10, op: tBack0 + 13, ks: { o: lensO } });
  // the worlds, the last on top; each masked by its own iris (a circle growing from the middle, in its picture's pixels)
  for (let n = seqW.length - 1; n >= 0; n--) {
    const wi = seqW[n], cx = (wi % 3) * 150 + 75, cy = Math.floor(wi / 3) * 150 + 75;
    const rK = n === 0 ? null : [[tIris[n], 0.5 / picK, [0.25, 0.6, 0.3, 1]], [tIris[n] + IR, (lensR * 0.985) / picK]];
    const mk = (r) => ellipsePathAt(cx, cy, r, r);
    const mask = n === 0 ? { a: 0, k: mk((lensR * 0.985) / picK) } : pathProp(rK.map(([tt, r, e]) => [tt, mk(r), e]));
    const end = n < seqW.length - 1 ? tIris[n + 1] + IR + 1 : tBack0 + 13;
    Cm.image(`lens · ${WORLD_NAMES[wi]}`, SQA, { ip: n === 0 ? tDive1 - 10 : tIris[n], op: end, ks: { a: [cx, cy], p: lensC, s: [picK * 100, picK * 100], o: n === 0 ? lensO : lensO.slice(2) }, masks: [{ inv: false, mode: "a", pt: mask, o: prop(100), x: prop(0), nm: "iris" }] });
  }

  /* ---------- the cup ---------- */
  // ripples on the crema where the thumbnail sank (seen from above: circles round the coffee's centre)
  const top0F = cupFrames({ times: [0], viewAt: () => top0 })[0][1];
  const rip = (d, n) => group("ripple " + n, [ellipse([[tSink + d, [6, 6], [0.2, 0.7, 0.4, 1]], [tSink + d + 40, [top0F.coffee.a * 1.9, top0F.coffee.b * 1.9]]], [top0F.coffee.cx, top0F.coffee.cy]), stroke(rgb("#F5D6AE"), [[tSink + d, 3.2, E.linear], [tSink + d + 40, 0.6]], [[tSink + d, 0, E.linear], [tSink + d + 4, 80, E.linear], [tSink + d + 40, 0]])]);
  Cm.shape("cup · ripples", [rip(0, 0), rip(9, 1), rip(19, 2)], { parent: rig, ip: tSink - 1, op: tSink + 62, masks: [{ inv: false, mode: "a", pt: { a: 0, k: ellipsePathAt(top0F.opening.cx, top0F.opening.cy, top0F.opening.a, top0F.opening.b) }, o: prop(100), x: prop(0), nm: "opening" }] });
  // the steam: while the cup stands (not from straight above: it rises toward us there, it is not seen)
  steamPlay(Cm, st, { nm: "cup · steam (turning)", parent: rig, p: steamAt, ip: tTilt1 - 10, op: tDive0 + 6, phase: 0.2, o: [[tTilt1 - 10, 0, E.linear], [tTilt1 + 6, 100, E.hold], [tDive0 - 6, 100, E.linear], [tDive0 + 6, 0]] });
  // segment 0: from above, landing; the crema swirls the card down
  cupMove(Cm, { nm: "cup · above", parent: rig, keys: [[0, top0F]], ip: 0, op: tTilt0 + 1, turnK: [[0, 0, E.linear], [tSink - 10, 30, [0.3, 0, 0.2, 1]], [tSink + 60, 380, E.linear], [tTilt0, 400]],
    extra: { shadow: { ks: { p: [[0, [26, 44], DROP], [tLand, [0, 0]]], o: [[0, 30, DROP], [tLand, 100]] } } } });
  // the landing's ring on the paper (seen from above), the dot of the reel's first frame
  Cm.shape("paper · the landing ring", [group("ring", [ellipse([[tLand - 2, [U * 2.9, U * 2.9], [0.15, 0.7, 0.3, 1]], [tLand + 34, [U * 5.2, U * 5.2]]], [0, 0]), stroke(rgb("#2a2118"), [[tLand - 2, 3, E.linear], [tLand + 34, 0.5]], [[tLand - 2, 0, E.linear], [tLand + 2, 30, E.linear], [tLand + 34, 0]])])], { parent: rig, ip: tLand - 2, op: tLand + 36 });
  // segment 1: the camera tilts down to the cup (the tilt, played back)
  cupPathPlay(Cm, preT, { nm: "cup · tilt down", parent: rig, ip: tTilt0, op: tTilt1 + 1, uK: [[tTilt0, 1, [0.55, 0, 0.3, 1]], [tTilt1, 0]] });
  // segment 2: one spin for each word (the slot), then the dive
  const spin = (t0, n) => [[t0, n, [0.2, 0.7, 0.25, 1.06]], [t0 + 30, n + 1, E.linear]];
  cupPlay(Cm, pre, { nm: "cup · the words spin it", parent: rig, ip: tTilt1, op: tDive0 + 1, turnsK: clean([[tTilt1, 330 / 360, E.linear], [tF - 2, 330 / 360, E.linear], ...spin(tF - 2, 330 / 360), [tB - 2, 330 / 360 + 1, E.linear], ...spin(tB - 2, 330 / 360 + 1), [tDive0, 330 / 360 + 2]]) });
  // segment 3: the dive (the rig grows, the camera tilts back over the cup); 4: held above, the lens; 5: back out
  cupPathPlay(Cm, preT, { nm: "cup · dive, above, back out", parent: rig, ip: tDive0, op: tBack1 + 1, uK: [[tDive0, 0, [0.6, 0, 0.25, 1]], [tDive1, 1, E.hold], [tBack0, 1, [0.55, 0, 0.3, 1]], [tBack1, 0]] });
  // segment 6: turning slowly while "feels." comes; then the band (the pill lands on it) and the hold
  cupPlay(Cm, pre, { nm: "cup · turning", parent: rig, ip: tBack1, op: tB0 + 7, turnsK: [[tBack1, turnsAt(tBack1), E.linear], [tB0 + 7, turnsAt(tB0 + 7)]], ks: { o: [[tB0, 100, E.linear], [tB0 + 6, 0]] } });

  /* ---------- the paper ---------- */
  K.keyLight("paper · key light", 0, tEnd + 1, [[tH, 100, E.linear], [tEnd - 6, 0]], K.hole(winK));
  K.paper({ op: tEnd + 1, masks: K.hole(winK) });
  // the short version's ground
  K.keyLight("short · key light", tS0, tS1 + 1);
  K.paper({ ip: tS0, op: tS1 + 1, nm: "short · ground" });

  const json = Cm.json();
  // the cup's box at the hold (for the caption under it): width, height, scale 1, ring 0
  json.cromatic = { v: 3, concept: "crema", markers: { words: [0, tHold], hold: [tHold, tH], handoff: [tH, tEnd], short: [tS0, tS1] }, handoff: { kind: "window" }, pill: [U * 3.3, U * 3.1, 1, 0] };
  return json;
}
