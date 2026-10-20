// Phase 3 · concept "Nine cups": the cup is the pill. The thumbnail's last dot lands in the line as a cup seen from
// above; the cup's rim opens into the pill (place, facade, brand) and closes back into the cup, which flies to the paper
// and deals eight more: nine cups, the same street in each one's coffee, in nine worlds. The camera tilts down and the
// cups stand up in perspective, spinning in a wave from the middle out; eight go, one stays, yours. It turns back to
// the camera, its rim becomes the Multiverse pill, "feels.", the logo, and the pill opens onto the live map (the live ending).
import { group, rect, ellipse, fill, gfill, stroke, rgb, E, prop, path, poly, roundRect, pathProp } from "../lib/lottie.mjs";
import { C } from "../lib/kit.mjs";
import { makeScene, clean, valAt, ellipsePathAt, RISE, EXIT, GLIDE, DEAL, WORLD_IDS, WORLD_NAMES } from "../lib/scene.mjs";
import { cupTurn, cupPlay, cupPath, cupPathPlay, valAtEased } from "../lib/cupLayers.mjs";
import { makeView } from "../lib/cup3d.mjs";
import { perspectiveGrid } from "../lib/ground.mjs";

export const TL = { B1: 0.12, B2: 1.62, B3: 3.8, B4: 6.85, HOLD: 9.25, HAND: 10.85, END: 12.15, SHORT: 12.25, SHORT_END: 12.7, COMP: 12.75 };
export const SQ = { cell: 150, n: 3 }; // the square atlas: the nine worlds' streets, 3 x 3 cells of 150 px

export function buildNineCups(T, ab, { atlasPath = "worlds.webp" } = {}) {
  const ph = ab.name === "phone";
  const K = makeScene(T, ab, { dur: TL.COMP, nm: `Cromatic opening · Nine cups · ${ab.name}`, camKeys: [[0, [0, 0]], [180, [-6, 4]], [330, [8, 6]], [420, [-8, 10]], [540, [0, 0]]] });
  const { Cm, W, H, t, PO, blk, lines, slotPill, letterAt, riseKeys, lineClip, pillGeom, pillShift, setLine, pillEnding } = K;
  const S = ph ? 46 : 84, S3 = ph ? 40 : 66;
  const SQA = Cm.asset("worlds-sq", SQ.cell * SQ.n, SQ.cell * SQ.n, "worlds-sq.webp");

  /* ======================= the ending (the live one: the pill, the logo, the window) ======================= */
  const grid = ph ? [195, 452] : [930, 492], U = ph ? 26 : 40;
  const tCome = t(6.35), tUp = t(6.75), tTopC = t(7.05), tFly = t(7.02);
  const END = pillEnding({ TLx: TL, lines4: ["That's how", "the right brand", "feels."], size: S, fromCircle: { t0: tFly, p: grid, k: (2.88 * U * (ph ? 1.55 : 1.45)) / (S * 1.14) } });
  const { tHold, tH, tEnd, tS0, tS1, tFeels } = END;
  Cm.marker("words", 0, tHold); Cm.marker("hold", tHold, tH); Cm.marker("handoff", tH, tEnd); Cm.marker("short", tS0, tS1);

  /* ======================= the cups ======================= */
  const PITCH = 35;
  const preT = cupPath(Cm, "cup-tilt", { viewAt: (u) => ({ pitch: PITCH + (90 - PITCH) * u, yaw: 330, U }), steps: 16, U });
  const preS = cupTurn(Cm, "cup-35", { pitch: PITCH, U, steps: 36 });
  const steps = preT.steps;
  // the grid on the paper (cup units), seen by a camera that tilts from straight above to PITCH: each cup's place and size
  const D = 3.5;
  const cells = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) cells.push([(i - 1) * D, (j - 1) * D]);
  const MID = 4; // the middle cup: Cromatic
  const worldOf = [1, 2, 3, 4, 0, 5, 6, 7, 8]; // which world is in which cell (Cromatic in the middle)
  const tTilt0 = t(4.95), tTilt1 = t(5.45);
  const uAt = (tt) => { if (tt <= tTilt0) return 1; if (tt >= tTilt1) return 0; const u = (tt - tTilt0) / (tTilt1 - tTilt0); return 1 - (0.5 - 0.5 * Math.cos(Math.PI * u)); };
  const placeAt = (cell, u) => { const V = makeView({ pitch: PITCH + (90 - PITCH) * u, yaw: 0, U }); const q = V.Pt([cell[0], 1.0, cell[1]]); const cam = V.toCam([cell[0], 1.0, cell[1]]); return { p: [grid[0] + q[0], grid[1] + q[1]], k: V.dc / (V.dc - cam[2]) }; };

  // the dealt cups (8) and the middle one; keyed positions and scales from the tilt, their pictures in their coffee
  const tLand = t(3.95), tDeal = t(4.12), tPic = t(4.45), tGo = t(5.72);
  const dealt = cells.map((c, n) => ({ n, d: Math.hypot(c[0], c[1]) })).filter((x) => x.n !== MID).sort((a, b) => a.d - b.d || a.n - b.n);
  const rankOf = (n) => (n === MID ? -1 : dealt.findIndex((x) => x.n === n));
  const tiltT = []; for (let tt = tTilt0; tt <= tTilt1; tt += 3) tiltT.push(tt); tiltT.push(tTilt1);
  const tiltK = (n, f) => tiltT.map((tt, i) => [tt, f(placeAt(cells[n], uAt(tt))), i < tiltT.length - 1 ? E.linear : undefined]);
  // the coffee as seen at a point of the tilt (interpolated between the precomp's keys), clipped to the opening
  const coffeeAt = (u) => {
    const x = u * steps, a = Math.floor(x), b = Math.min(steps, a + 1), f = x - a;
    const A = preT.keys[a][1], B = preT.keys[b][1];
    const lerp = (p, q) => p + (q - p) * f;
    const co = { cx: lerp(A.coffee.cx, B.coffee.cx), cy: lerp(A.coffee.cy, B.coffee.cy), a: lerp(A.coffee.a, B.coffee.a), b: lerp(A.coffee.b, B.coffee.b) };
    const op = { cx: lerp(A.opening.cx, B.opening.cx), cy: lerp(A.opening.cy, B.opening.cy), a: lerp(A.opening.a, B.opening.a), b: lerp(A.opening.b, B.opening.b) };
    return { co, op };
  };
  // the picture's mask, in the picture's own pixels: the coffee's ellipse, pulled inside the opening where it passes it
  const picScale = (2 * 1.31 * U) / SQ.cell; // the picture covers the coffee seen from above
  const maskAt = (u) => {
    const { co, op } = coffeeAt(u), pts = [];
    for (let k = 0; k < 16; k++) {
      const th = (k / 16) * Math.PI * 2;
      let x = co.cx + co.a * Math.sin(th), y = co.cy - co.b * Math.cos(th);
      const ex = (x - op.cx) / op.a, ey = (y - op.cy) / op.b, r = Math.hypot(ex, ey);
      if (r > 0.985) { x = op.cx + (ex / r) * op.a * 0.985; y = op.cy + (ey / r) * op.b * 0.985; }
      pts.push([SQ.cell / 2 + x / picScale, SQ.cell / 2 + y / picScale]);
    }
    const n = pts.length, v = [], i = [], o = [];
    for (let a2 = 0; a2 < n; a2++) { const p0 = pts[(a2 - 1 + n) % n], p2 = pts[(a2 + 1) % n], tg = [(p2[0] - p0[0]) / 6, (p2[1] - p0[1]) / 6]; v.push(pts[a2].map((z) => +z.toFixed(1))); o.push(tg.map((z) => +z.toFixed(1))); i.push(tg.map((z) => +(-z).toFixed(1))); }
    return { c: true, v, i, o };
  };
  const maskKeys = [[0, maskAt(1), E.hold], ...tiltT.map((tt, i) => [tt, maskAt(uAt(tt)), i < tiltT.length - 1 ? E.linear : undefined])];
  // the middle cup's own way back up to the camera (6.35..7.05): it comes forward and tilts back to straight above
  const upT = []; for (let tt = tUp; tt <= tTopC; tt += 3) upT.push(tt); upT.push(tTopC);
  const uUp = (tt) => { const u = Math.max(0, Math.min(1, (tt - tUp) / (tTopC - tUp))); return 0.5 - 0.5 * Math.cos(Math.PI * u); };
  const midMask = [...maskKeys, ...upT.map((tt, i) => [tt, maskAt(uUp(tt)), i < upT.length - 1 ? E.linear : undefined])];

  // the spin: after the tilt each cup turns once, in a wave from the middle out
  const spinAt = (n) => tTilt1 + 4 + Math.round(Math.hypot(cells[n][0], cells[n][1]) / D) * 7;
  const byDepth = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort((a, b) => cells[b][1] - cells[a][1] || Math.abs(cells[a][0]) - Math.abs(cells[b][0]));
  for (const n of byDepth) {
    const mid = n === MID, rank = rankOf(n), wi = worldOf[n];
    const ti = mid ? tLand : tDeal + rank * 3;
    const tOut = tGo + (mid ? 0 : Math.round((Math.hypot(cells[n][0], cells[n][1]) / D) * 4) + (rank % 3) * 2);
    const lop = mid ? tFly + 10 : tOut + 14;
    const p0 = placeAt(cells[n], 1), pM = placeAt(cells[MID], 1);
    // place: dealt from the middle (an arc), then the tilt's perspective, then (the middle one) forward and up
    const pK = clean([...(mid ? [[ti, p0.p, E.hold]] : [[ti, pM.p, DEAL], [ti + 24, p0.p, E.hold]]), ...tiltK(n, (q) => q.p), ...(mid ? [[tCome, placeAt(cells[n], 0).p, [0.5, 0, 0.25, 1]], [tUp + 10, [grid[0], grid[1] + (ph ? 6 : 10)], E.hold], [tFly, [grid[0], grid[1] + (ph ? 6 : 10)]]] : [])]);
    const sK = clean([...(mid ? [[ti - 2, [130, 130], [0.3, 0, 0.25, 1]], [ti + 8, [96, 96], E.out], [ti + 16, [100, 100], E.hold]] : [[ti, [40, 40], DEAL], [ti + 24, [100, 100], E.hold]]), ...tiltK(n, (q) => [q.k * 100, q.k * 100]),
      ...(mid ? [[tCome, [placeAt(cells[n], 0).k * 100, placeAt(cells[n], 0).k * 100], [0.5, 0, 0.25, 1]], [tUp + 10, [(ph ? 1.55 : 1.45) * 100, (ph ? 1.55 : 1.45) * 100], E.hold]] : [[tOut, [placeAt(cells[n], 0).k * 100, placeAt(cells[n], 0).k * 100], [0.4, 0, 0.6, 1]], [tOut + 4, [placeAt(cells[n], 0).k * 112, placeAt(cells[n], 0).k * 112], [0.5, 0, 0.9, 0.4]], [tOut + 14, [0, 0]]])]);
    const nul = Cm.nul(`cup ${n} · ${WORLD_NAMES[wi]}`, { parent: PO, ip: ti - 1, op: lop, ks: { p: pK, s: sK } });
    // its picture: the street in its world, in its coffee (fading in on the crema), clipped to the coffee
    const cx = (wi % SQ.n) * SQ.cell + SQ.cell / 2, cy = Math.floor(wi / SQ.n) * SQ.cell + SQ.cell / 2;
    const tPicN = tPic + (mid ? 0 : rank * 2);
    Cm.image(`cup ${n} · its world`, SQA, { parent: nul, ip: tPicN, op: lop, ks: {
      a: [cx, cy], p: [0, 0], s: [picScale * 100, picScale * 100],
      o: [[tPicN, 0, E.linear], [tPicN + 10, 100, E.hold], ...(mid ? [[tUp + 6, 100, E.linear], [tTopC - 4, 0]] : [])]
    }, masks: [{ inv: false, mode: "a", pt: pathProp((mid ? midMask : maskKeys).map(([tt, q, e]) => [tt, { ...q, v: q.v.map(([x, y]) => [x - SQ.cell / 2 + cx, y - SQ.cell / 2 + cy]) }, e])), o: prop(100), x: prop(0), nm: "coffee" }] });
    // the cup: from above (the tilt held), tilting down with the camera, then turning (its spin), then (the middle) up
    const tS = spinAt(n);
    cupPathPlay(Cm, preT, { nm: `cup ${n} · tilting`, parent: nul, ip: ti - 1, op: tS + 1, uK: [[ti - 1, 1, E.hold], ...tiltT.map((tt, i) => [tt, uAt(tt), E.linear])] });
    if (mid) {
      cupPlay(Cm, preS, { nm: `cup ${n} · spin`, parent: nul, ip: tS, op: tUp + 1, turnsK: [[tS, 330 / 360, [0.3, 0.6, 0.3, 1.04]], [tS + 34, 330 / 360 + 1]] });
      cupPathPlay(Cm, preT, { nm: `cup ${n} · back up`, parent: nul, ip: tUp, op: lop, uK: [[tUp, 0, E.linear], ...upT.map((tt) => [tt, uUp(tt), E.linear])], ks: { o: [[tFly, 100, E.linear], [tFly + 8, 0]] } });
    } else cupPlay(Cm, preS, { nm: `cup ${n} · spin`, parent: nul, ip: tS, op: lop, turnsK: [[tS, 330 / 360, [0.3, 0.6, 0.3, 1.04]], [tS + 34, 330 / 360 + 1]] });
  }

  /* ======================= text and pills ======================= */
  // beat 3 · nine worlds over the same streets / one will feel like yours.
  const b3a = blk(["Nine worlds over", "the same streets."], { size: S3, mid: ph ? 0.19 : 0.46 });
  const b3b = blk(["One will feel", "like yours."], { size: S3, mid: ph ? 0.19 : 0.46, pill: true });
  const t3 = t(TL.B3 + 0.06), t3b = t(TL.B3 + 1.7), tPick = t(5.85), t3out = t(TL.B4 - 0.18);
  const yoursW = b3b.find((w) => w.text === "yours.");
  slotPill("beat 3 · yours.", { size: S3, x0: yoursW.lx + yoursW.x + pillShift(S3), by: yoursW.by, words: [["yours.", C.yellow, C.black, tPick]], tOut: t3out, outTo: "fade", ip: tPick - 1, op: t3out + 20, id: "yours" });
  lines("beat 3 · nine worlds over the same streets", b3a, { size: S3, inAt: (i) => t3 + i * 3.5, outAt: (i) => t3b - 8 + i * 1.2 });
  lines("beat 3 · one will feel like", b3b.filter((w) => w !== yoursW), { size: S3, inAt: (i) => t3b + i * 3.5, outAt: (i) => t3out + i * 1.2 });

  // beat 2 · the pill is a cup: it lands in the line seen from above, its rim opens into the pill, and closes back
  const b2 = blk(["But someone", "could remember", "a place."], { size: S, pill: true, mid: ph ? 0.2 : 0.5 });
  const placeW = b2.find((w) => w.text === "place.");
  const t2 = t(TL.B2), tCupIn = t(1.76), tP = t(2.02), tF = t(2.58), tB = t(3.12), t2out = t(3.5);
  const px0 = placeW.lx + placeW.x + pillShift(S);
  const g0 = pillGeom(S, px0 - 0.34 * S, placeW.by, setLine(T, "place.", S, -0.035).width);
  const slot = [px0 - 0.34 * S + g0.h / 2, g0.cy]; // the pill's left end: a circle the pill's height
  const lineK = (g0.h / (2.88 * U)) * 100;
  const sp = slotPill("beat 2 · place. facade. brand.", { size: S, x0: px0, by: placeW.by, words: [["place.", C.green, C.black, tP], ["facade.", C.blue, C.black, tF], ["brand.", C.yellow, C.black, tB]], start: { size: [g0.h, g0.h], pos: slot }, tOut: t2out, outTo: "circle", ip: tP - 1, op: t2out + 17, id: "word" });
  lines("beat 2 · but someone could remember a", b2.filter((w) => w !== placeW), { size: S, inAt: (i) => t2 + i * 3.5, outAt: (i) => t2out + i * 1.2 });
  // the line's cup: lands (from the thumbnail's dot) in the slot, becomes the pill; comes back out of it and flies to the paper
  const gl = sp.last, outC = [gl.cx, gl.cy];
  const lineCup = Cm.nul("beat 2 · the cup in the line", { parent: PO, ip: tCupIn - 1, op: tLand + 1, ks: {
    p: { x: [[tCupIn, slot[0], E.hold], [t2out + 10, outC[0], [0.45, 0, 0.3, 1]], [tLand, grid[0]]], y: [[tCupIn, slot[1], E.hold], [t2out + 10, outC[1], [0.2, 0.6, 0.4, 1]], [Math.round((t2out + 10 + tLand) / 2), Math.min(outC[1], grid[1]) - (ph ? 40 : 90), [0.55, 0, 0.8, 0.4]], [tLand, grid[1]]] },
    s: [[tCupIn, [0, 0], E.spring], [tCupIn + 12, [lineK, lineK], E.hold], [t2out + 10, [lineK, lineK], [0.45, 0, 0.3, 1]], [tLand, [100, 100]]],
    o: [[tP - 1, 100, E.linear], [tP + 4, 0, E.hold], [t2out + 10, 0, E.linear], [t2out + 14, 100]]
  } });
  cupPathPlay(Cm, preT, { nm: "beat 2 · the cup in the line · cup", parent: lineCup, ip: tCupIn - 1, op: tLand + 1, uK: [[tCupIn - 1, 1]] });

  // beat 1 · nobody remembers a thumbnail.: the word shrinks into the grey card; it flips away; its dot flies to the line
  const b1 = blk(["Nobody", "remembers a", "thumbnail."], { size: S, mid: ph ? 0.2 : 0.5 });
  const thumbW = b1.find((w) => w.text === "thumbnail.");
  const t1 = t(TL.B1), tShrink = t(0.95), tCard = t(1.05), tFlip = t(1.4), t1out = t(1.42);
  const k = ph ? 0.42 : 0.36;
  const cx = thumbW.lx + thumbW.x + thumbW.w / 2, cy = thumbW.by - (T.xh / T.upm) * S * 0.5;
  const thumbNull = Cm.nul("beat 1 · thumbnail", { parent: PO, op: tFlip + 10, ks: { a: [cx, cy], p: [cx, cy], s: [[tShrink, [100, 100], [0.6, 0, 0.25, 1]], [tShrink + 18, [k * 100, k * 100], E.hold], [tFlip, [k * 100, k * 100], [0.55, 0, 0.9, 0.4]], [tFlip + 9, [0, k * 100]]] } });
  Cm.shape("beat 1 · thumbnail. (word)", [group("thumbnail.", thumbW.letters.map((L, j) => letterAt(L, thumbW.lx, thumbW.by, S, C.black, riseKeys(t1 + 8 + j, null, S))))], { parent: thumbNull, op: tFlip + 10, masks: [lineClip([thumbW], S)] });
  const cw = (thumbW.w * k + (ph ? 22 : 44)) / k, chh = cw * (ph ? 0.5 : 0.56), lw = (ph ? 1.5 : 2) / k, cardC = [cx, cy - chh * 0.12], cardR = (ph ? 8 : 14) / k;
  Cm.shape("beat 1 · the card", [
    group("picture", [
      group("sun", [ellipse([cw * 0.09, cw * 0.09], [cx + cw * 0.26, cy - chh * 0.42]), stroke(rgb(C.black), lw), fill(rgb(C.white))]),
      group("hill", [path(poly([[cx - cw * 0.36, cy - chh * 0.16], [cx - cw * 0.1, cy - chh * 0.44], [cx + cw * 0.06, cy - chh * 0.28], [cx + cw * 0.17, cy - chh * 0.36], [cx + cw * 0.36, cy - chh * 0.16]])), stroke(rgb(C.black), lw), fill(rgb(C.white))])
    ], { o: [[0, 0, E.hold], [tCard + 8, 0, E.linear], [tCard + 14, 100]] }),
    group("frame", [rect([cw, chh], cardC, cardR), stroke(rgb(C.black), (ph ? 2 : 2.5) / k), fill(rgb(C.bar))])
  ], { parent: thumbNull, ip: tCard, op: tFlip + 10, ks: { a: [cx, cy], p: [cx, cy], s: [[tCard, [86, 86], E.spring], [tCard + 20, [100, 100]]], o: [[tCard, 0, E.linear], [tCard + 5, 100]] } });
  // its dot: off the flipped card, on an arc, into the line's slot (where it is a cup)
  const dotL = Cm.shape("beat 1 · the dot", [group("dot", [ellipse([0.22 * S, 0.22 * S], [0, 0]), fill(rgb(C.black))])], { parent: PO, ip: tFlip + 4, op: tCupIn + 3, ks: {
    p: { x: [[tFlip + 9, cx, [0.45, 0, 0.35, 1]], [tCupIn, slot[0]]], y: [[tFlip + 9, cy, [0.2, 0.6, 0.4, 1]], [Math.round((tFlip + 9 + tCupIn) / 2), Math.min(cy, slot[1]) - (ph ? 40 : 70), [0.55, 0, 0.8, 0.4]], [tCupIn, slot[1]]] },
    s: [[tFlip + 5, [0, 0], E.spring], [tFlip + 13, [100, 100], E.hold], [tCupIn - 2, [100, 100], E.out], [tCupIn + 2, [0, 0]]]
  } });
  lines("beat 1 · nobody remembers a", b1.filter((w) => w !== thumbW), { size: S, inAt: (i) => t1 + i * 4, outAt: (i) => t1out + i * 1.5 });

  /* ======================= the paper ======================= */
  K.keyLight("paper · key light", 0, tEnd + 1, [[tH, 100, E.linear], [tEnd - 6, 0]], K.hole(END.winK));
  // the paper's grid tilts with the camera: the flat grid hands over to the same lines in perspective (identical from above)
  const gT = []; for (let tt = tTilt0; tt < tTilt1; tt += 5) gT.push(tt); gT.push(tTilt1); for (let tt = tUp; tt < tTopC; tt += 5) gT.push(tt); gT.push(tTopC);
  const gView = (tt) => ({ pitch: PITCH + (90 - PITCH) * (tt >= tUp ? uUp(tt) : uAt(tt)), yaw: 0 });
  perspectiveGrid(Cm, { centre: grid, U, times: gT, viewAt: gView, parent: K.PG0, ip: tTilt0, op: tTopC + 1 });
  K.paper({ op: tEnd + 1, masks: K.hole(END.winK), gridO: [[tTilt0, 100, E.hold], [tTilt0 + 1, 0, E.hold], [tTopC, 0, E.hold], [tTopC + 1, 100]] });
  K.keyLight("short · key light", tS0, tS1 + 1);
  K.paper({ ip: tS0, op: tS1 + 1, nm: "short · ground" });

  const json = Cm.json();
  json.cromatic = { v: 3, concept: "ninecups", markers: { words: [0, tHold], hold: [tHold, tH], handoff: [tH, tEnd], short: [tS0, tS1] }, handoff: { kind: "window" }, pill: END.pillMeta };
  return json;
}
