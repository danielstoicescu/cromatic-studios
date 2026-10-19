// Phase 3 · concept "Cup City": a street of cups, the camera gliding down it (the site is a city you drive through).
// Plain white cups stand along a road on the paper, seen low, in perspective, passing by; the thumbnail flies off down
// the street into the haze; place, facade, brand: one cup lights up in each colour as it passes; nine worlds over the
// same street (the road and the ground re-skinned in a light sweep, nine times, the sky left white for the words); the
// right brand: every cup turns Cromatic yellow, a wave down the street; the glide loops while the city loads (the
// street repeats: the loader), and the road opens: through it, the live map.
import { group, rect, ellipse, fill, gfill, stroke, rgb, E, prop, tmProp, path, poly, roundRect, pathProp } from "../lib/lottie.mjs";
import { C, WORLD_GROUNDS } from "../lib/kit.mjs";
import { makeScene, clean, valAt, ellipsePathAt, reversePath, RISE, EXIT, GLIDE } from "../lib/scene.mjs";
import { cupStill, cupStillPlay, steamLoop, steamPlay } from "../lib/cupLayers.mjs";
import { makeView, DESIGNS } from "../lib/cup3d.mjs";
import { Comp } from "../lib/lottie.mjs";

// (the short version ends exactly two loops after the hold's start: the street is the same there, frame for frame)
export const TL = { B1: 0.12, B2: 1.62, B3: 3.8, B4: 6.85, HOLD: 9.25, HAND: 11.25, END: 12.45, SHORT: 12.75, SHORT_END: 13.25, COMP: 13.3 };

export function buildCupCity(T, ab) {
  const ph = ab.name === "phone";
  const K = makeScene(T, ab, { dur: TL.COMP, nm: `Cromatic opening · Cup City · ${ab.name}` });
  const { Cm, W, H, t, PO, PT, blk, lines, slotPill, letterAt, riseKeys, lineClip, pillGeom, pillShift, setLine, ring } = K;
  const S = ph ? 44 : 74, S3 = ph ? 38 : 62;
  const tHold = t(TL.HOLD), tH = t(TL.HAND), tEnd = t(TL.END), tS0 = t(TL.SHORT), tS1 = t(TL.SHORT_END);
  Cm.marker("words", 0, tHold); Cm.marker("hold", tHold, tH); Cm.marker("handoff", tH, tEnd); Cm.marker("short", tS0, tS1);

  /* ======================= the street's camera ======================= */
  const U = ph ? 32 : 56, PITCH = ph ? 21 : 19, dc = 14, yt = 0.9;
  const anchor = ph ? [195, 548] : [640, 612];
  const V = makeView({ pitch: PITCH, yaw: 0, U, dc, yt });
  const scr = (x, y, z) => { const q = V.Pt([x, y, z]); return [anchor[0] + q[0], anchor[1] + q[1]]; };
  const depthAt = (x, y, z) => dc - V.tiltOnly([x, y, z])[2];
  const horizonY = scr(0, 0, -1e5)[1];
  // the street: the road (x within ±RW), the cups on both sides, the ground's rows every STEP; it repeats every P
  const STEP = 0.8, P = 6 * STEP, RW = 1.7, CX = ph ? 3.0 : 3.3, LOOP = 120; // P per LOOP frames: the hold is one P
  const v = P / LOOP; // units per frame toward the camera
  const zFar = -21, zNear = 3.2;

  /* ---------- the road and the ground ---------- */
  // nine worlds over the same street: the ground and the road change, in a light sweep each time
  const t3 = t(TL.B3 + 0.06), tWorld0 = t(TL.B3 + 0.3), dW = 13; // frames per world
  const worldSeq = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // WORLD_GROUNDS order: night first ... Cromatic last
  const colK = (k) => clean([[0, rgb(WORLD_GROUNDS[8][k]), E.hold], ...worldSeq.map((wi, n) => [tWorld0 + n * dW, rgb(WORLD_GROUNDS[wi][k]), E.hold]), [tWorld0 + worldSeq.length * dW, rgb(WORLD_GROUNDS[8][k])]]);
  const groundK = colK(0), roadK = colK(1);
  const groundTop = horizonY - 2;
  // the road: its edges run to the vanishing point; the window opens through it in the handoff
  const roadPts = (wide = 0) => { const a = scr(-RW - wide, 0, zNear + 2), b = scr(RW + wide, 0, zNear + 2), c2 = scr(RW + wide * 0.2, 0, -400), d = scr(-RW - wide * 0.2, 0, -400); return [d, c2, b, a]; };
  const roadPath = (wide = 0) => poly(roadPts(wide).map((q) => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]));
  // the road's dashes: a precomp of one dash period, looped (the street moves toward the camera)
  const DASH = 2 * STEP, dashPer = Math.round(DASH / v);
  {
    const D = new Comp({ w: W, h: H, dur: (dashPer + 1) / 60, nm: "road · dashes" });
    D.op = dashPer;
    const dashes = [];
    for (let z = zNear + 2; z > -40; z -= DASH) {
      const keys = [0, dashPer / 2, dashPer].map((tt, i) => { const z1 = z + v * tt, z2 = z1 - DASH * 0.45; const pts = [scr(-0.09, 0, z1), scr(0.09, 0, z1), scr(0.09, 0, z2), scr(-0.09, 0, z2)].map((q) => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]); return [tt, { c: true, v: pts, i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]) }, i < 2 ? E.linear : undefined]; });
      dashes.push(path(keys));
    }
    D.shape("dashes", [group("dashes", [...dashes, fill(rgb("#FFFFFF"), 70)])]);
    Cm.assets.push({ id: "road · dashes", nm: "road · dashes", fr: 60, layers: D.layers });
  }
  const loopTm = (per, ip, op) => { const ks = []; let tt = ip; while (tt < op) { const end = Math.min(op, tt + per - ((tt) % per)); ks.push([tt, +(((tt % per) / 60)).toFixed(5), [0, 0, 1, 1]]); if (end >= op) { ks.push([op, +((((op % per) || per) / 60)).toFixed(5)]); break; } ks.push([end - 0.01, +((per - 0.01) / 60).toFixed(5), "hold"]); tt = end; } return tmProp(ks.map((k, i) => (i === ks.length - 1 ? [k[0], k[1]] : k))); };
  const dashL = { ddd: 0, ty: 0, nm: "road · dashes", refId: "road · dashes", sr: 1, ao: 0, w: W, h: H, ip: 0, op: Cm.op, st: 0, bm: 0, ks: { o: prop([[tH + 24, 100, E.linear], [tH + 34, 0, E.hold], [tEnd + 1, 100]]), r: prop(0), p: prop([W / 2, H / 2, 0]), a: prop([W / 2, H / 2, 0]), s: prop([100, 100, 100]) }, tm: loopTm(dashPer, 0, Cm.op) };
  // the ground's rows: a precomp of one row period, looped
  const rowPer = Math.round(STEP / v);
  {
    const R = new Comp({ w: W, h: H, dur: (rowPer + 1) / 60, nm: "ground · rows" });
    R.op = rowPer;
    const rows = [];
    for (let z = zNear + 2; z > -30; z -= STEP) {
      const yK = [0, rowPer / 2, rowPer].map((tt, i) => [tt, [0, Math.round(scr(0, 0, z + v * tt)[1] * 10) / 10], i < 2 ? E.linear : undefined]);
      rows.push(group("row", [path(poly([[-W, 0], [2 * W, 0]], false)), stroke(rgb("#000000"), 1, 100, { lc: 1, lj: 1 })], { p: yK }));
    }
    R.shape("rows", rows);
    Cm.assets.push({ id: "ground · rows", nm: "ground · rows", fr: 60, layers: R.layers });
  }
  const rowsL = { ddd: 0, ty: 0, nm: "ground · rows", refId: "ground · rows", sr: 1, ao: 0, w: W, h: H, ip: 0, op: Cm.op, st: 0, bm: 0, ks: { o: prop(9), r: prop(0), p: prop([W / 2, H / 2, 0]), a: prop([W / 2, H / 2, 0]), s: prop([100, 100, 100]) }, tm: loopTm(rowPer, 0, Cm.op) };
  // the lines along the street: rays from the vanishing point
  const vp = scr(0, 0, -1e5), rays = [];
  for (let x = -14 * STEP; x <= 14 * STEP + 1e-6; x += STEP) { const a = scr(x, 0, zNear + 2), b = scr(x, 0, -60); rays.push(path(poly([[Math.round(a[0] * 10) / 10, Math.round(a[1] * 10) / 10], [Math.round(b[0] * 10) / 10, Math.round(b[1] * 10) / 10]], false))); }

  /* ======================= the handoff's window: the road opens (its fill goes, then it widens past the edges) ======================= */
  const tOpen = tH + 14;
  // (it ends as the whole screen and more: its far edge rises past the top, its near edge spreads past the sides)
  const fullQ = poly([[-W * 0.6, -H * 0.6], [W * 1.6, -H * 0.6], [W * 1.6, H * 1.6], [-W * 0.6, H * 1.6]]);
  const winK = [[0, roadPath(0), E.hold], [tH - 1, roadPath(0), E.hold], [tH, roadPath(0), E.hold], [tOpen, roadPath(0), [0.55, 0, 0.2, 1]], [tOpen + Math.round((tEnd - tOpen) * 0.45), roadPath(ph ? 8 : 12), [0.6, 0, 0.3, 1]], [tEnd - 2, fullQ]];
  // (before the handoff the window is closed: a road of no width, far away)
  const closed = poly(roadPts(0).map(() => [anchor[0], horizonY]));
  const winHole = [[0, closed, E.hold], [tH - 1, closed, E.hold], ...winK.slice(2).map((k, i, a) => (i === a.length - 1 ? [k[0], k[1], E.hold] : k)), [tEnd + 1, closed, E.hold], [Cm.op, closed]];

  /* ======================= the short version's fade (on top of everything) ======================= */
  Cm.shape("short · fade in", [group("paper", [rect([W * 1.4, H * 1.4], [W / 2, H / 2]), fill(rgb(C.paper))])], { ip: tS0, op: tS1 + 1, ks: { o: [[tS0, 100, E.linear], [tS1, 0]] } });

  /* ======================= the words (the sky above the street) ======================= */
  const tP = t(TL.B2 + 0.28), tF = t(TL.B2 + 0.93), tB = t(TL.B2 + 1.48), t2out = t(TL.B3 - 0.18);

  const mid3 = ph ? 0.2 : 0.2;
  // beat 4 · that's how the right brand feels.
  const b4 = blk(ph ? ["That's how", "the right brand", "feels."] : ["That's how the right", "brand feels."], { size: S, pill: true, mid: mid3 });
  const feelsW = b4.find((w) => w.text === "feels.");
  const t4 = t(TL.B4), tFeels = t(TL.B4 + 0.32), t4out = t(8.85);
  const fX = feelsW.lx + feelsW.x + pillShift(S), fL = setLine(T, "feels.", S, -0.035), fg = pillGeom(S, fX - 0.34 * S, feelsW.by, fL.width);
  const fc = [fg.cx, fg.cy], ringW = (ph ? 0.08 : 0.064) * S;
  const fRoot = Cm.nul("beat 4 · feels.", { parent: PO, ip: tFeels, op: t4out + 16, ks: { a: fc, p: fc, s: [[tFeels, [40, 40], E.spring], [tFeels + 24, [100, 100], E.hold], [t4out, [100, 100], EXIT], [t4out + 14, [90, 90]]], o: [[t4out, 100, E.linear], [t4out + 14, 0]] } });
  const feelsLetters = group("feels.", fL.letters.map((l, j) => letterAt(l, fX, feelsW.by, S, C.black, (b, s) => ({ p: clean([[tFeels + 6 + j, [b[0], b[1] + 0.42 * S], RISE], [tFeels + 26 + j, b, E.linear]]), o: clean([[0, 0, E.hold], [tFeels + 6 + j, 0, E.linear], [tFeels + 13 + j, 100]]), s: [s, s] }))));
  Cm.shape("beat 4 · feels. · ring, word, body", [feelsLetters, ...ring([fg.w, fg.h], fc, [[tFeels, 0, E.linear], [t4out + 16, 300]], ringW), group("body", [rect([fg.w, fg.h], fc, 9999), fill(rgb(C.white))])], { parent: fRoot, ip: tFeels, op: t4out + 16 });
  lines("beat 4 · that's how the right brand", b4.filter((w) => w !== feelsW), { size: S, inAt: (i) => t4 + i * 3.5, outAt: (i) => t4out - 2 + i * 1.5 });

  // beat 3 · nine worlds over the same streets / one will feel like yours.
  const b3a = blk(["Nine worlds over", "the same streets."], { size: S3, mid: mid3 });
  const b3b = blk(["One will feel", "like yours."], { size: S3, mid: mid3, pill: true });
  const t3b = t(TL.B3 + 1.7), tPick = t(5.6), t3out = t(TL.B4 - 0.18);
  const yoursW = b3b.find((w) => w.text === "yours.");
  slotPill("beat 3 · yours.", { size: S3, x0: yoursW.lx + yoursW.x + pillShift(S3), by: yoursW.by, words: [["yours.", C.yellow, C.black, tPick]], tOut: t3out, outTo: "fade", ip: tPick - 1, op: t3out + 20, id: "yours" });
  lines("beat 3 · nine worlds over the same streets", b3a, { size: S3, inAt: (i) => t3 + i * 3.5, outAt: (i) => t3b - 8 + i * 1.2 });
  lines("beat 3 · one will feel like", b3b.filter((w) => w !== yoursW), { size: S3, inAt: (i) => t3b + i * 3.5, outAt: (i) => t3out + i * 1.2 });

  // beat 2 · but someone could remember a place / facade / brand.
  const b2 = blk(ph ? ["But someone", "could remember", "a place."] : ["But someone could", "remember a place."], { size: S, pill: true, mid: mid3 });
  const placeW = b2.find((w) => w.text === "place.");
  slotPill("beat 2 · place. facade. brand.", { size: S, x0: placeW.lx + placeW.x + pillShift(S), by: placeW.by, words: [["place.", C.green, C.black, tP], ["facade.", C.blue, C.black, tF], ["brand.", C.yellow, C.black, tB]], tOut: t2out, outTo: "fade", ip: tP - 1, op: t2out + 16, id: "word" });
  lines("beat 2 · but someone could remember a", b2.filter((w) => w !== placeW), { size: S, inAt: (i) => t(TL.B2) + i * 3.5, outAt: (i) => t2out + i * 1.2 });

  // beat 1 · nobody remembers a thumbnail.: the word, a grey card, flies away down the street into the haze
  const b1 = blk(ph ? ["Nobody", "remembers a", "thumbnail."] : ["Nobody remembers", "a thumbnail."], { size: S, mid: mid3 });
  const thumbW = b1.find((w) => w.text === "thumbnail.");
  const t1 = t(TL.B1), tShrink = t(0.9), tCard = t(1.0), tAway = t(1.2), tGone = t(1.75), t1out = t(1.42);
  const k = ph ? 0.42 : 0.36;
  const cx = thumbW.lx + thumbW.x + thumbW.w / 2, cy = thumbW.by - (T.xh / T.upm) * S * 0.5;
  const farP = scr(0, 1.2, -24);
  const thumbNull = Cm.nul("beat 1 · thumbnail", { parent: PO, op: tGone + 2, ks: {
    a: [cx, cy], p: [[tAway, [cx, cy], [0.5, 0, 0.2, 1]], [tGone, farP]],
    s: [[tShrink, [100, 100], [0.6, 0, 0.25, 1]], [tShrink + 16, [k * 100, k * 100], E.hold], [tAway, [k * 100, k * 100], [0.45, 0, 0.2, 1]], [tGone, [k * 8, k * 8]]],
    r: [[tAway, 0, E.inOut], [tGone, -12]], o: [[tGone - 10, 100, E.linear], [tGone, 0]]
  } });
  Cm.shape("beat 1 · thumbnail. (word)", [group("thumbnail.", thumbW.letters.map((L, j) => letterAt(L, thumbW.lx, thumbW.by, S, C.black, riseKeys(t1 + 8 + j, null, S))))], { parent: thumbNull, op: tCard + 6, masks: [lineClip([thumbW], S)], ks: { o: [[tCard, 100, E.linear], [tCard + 6, 0]] } });
  const cw = (thumbW.w * k + (ph ? 22 : 44)) / k, chh = cw * (ph ? 0.5 : 0.56), lw = (ph ? 1.5 : 2) / k, cardC = [cx, cy - chh * 0.12], cardR = (ph ? 8 : 14) / k;
  Cm.shape("beat 1 · the card", [
    group("picture", [
      group("sun", [ellipse([cw * 0.09, cw * 0.09], [cx + cw * 0.26, cy - chh * 0.42]), stroke(rgb(C.black), lw), fill(rgb(C.white))]),
      group("hill", [path(poly([[cx - cw * 0.36, cy - chh * 0.16], [cx - cw * 0.1, cy - chh * 0.44], [cx + cw * 0.06, cy - chh * 0.28], [cx + cw * 0.17, cy - chh * 0.36], [cx + cw * 0.36, cy - chh * 0.16]])), stroke(rgb(C.black), lw), fill(rgb(C.white))])
    ]),
    group("frame", [rect([cw, chh], cardC, cardR), stroke(rgb(C.black), (ph ? 2 : 2.5) / k), fill(rgb(C.bar))])
  ], { parent: thumbNull, ip: tCard, op: tGone + 2, ks: { a: [cx, cy], p: [cx, cy], s: [[tCard, [86, 86], E.spring], [tCard + 16, [100, 100]]], o: [[tCard, 0, E.linear], [tCard + 5, 100]] } });
  lines("beat 1 · nobody remembers a", b1.filter((w) => w !== thumbW), { size: S, inAt: (i) => t1 + i * 4, outAt: (i) => t1out + i * 1.5 });

  /* ---------- the cups: still precomps (one view: weak perspective, one look for every cup) ---------- */
  const view = { pitch: PITCH + 4, yaw: 330, U };
  const pre = { blank: cupStill(Cm, "cup · blank", { view, design: DESIGNS.blank }), yellow: cupStill(Cm, "cup · yellow", { view, design: DESIGNS.yellow }), green: cupStill(Cm, "cup · green", { view, design: DESIGNS.green }), blue: cupStill(Cm, "cup · blue", { view, design: DESIGNS.blue }) };
  const st = steamLoop(Cm, "steam", { period: LOOP, height: 120, scale: 0.75 });

  // every cup of the street: its place on the street at frame 0 (z0, before the glide), its side
  const cups = [];
  const span = (TL.COMP * 60) * v + (zNear - zFar) + P;
  for (const side of [-1, 1]) for (let z = zNear + P * 0.5 * (side > 0 ? 1 : 0) - P; z > zNear - span; z -= P) cups.push({ side, z0: z });
  // when a cup is on screen: from the far haze to past the camera
  const zAt = (c, tt) => c.z0 + v * tt;
  // the words' cups: the ones that light up for place, facade, brand (on the right, near, when the word comes)
  const pick = (tt, zWant) => cups.filter((c) => c.side > 0).reduce((b, c) => (Math.abs(zAt(c, tt) - zWant) < Math.abs(zAt(b, tt) - zWant) ? c : b));
  const lit = [[tP, "green"], [tF, "blue"], [tB, "yellow"]].map(([tt, col]) => ({ c: pick(tt, ph ? -5.5 : -6.5), t: tt, col }));
  // the wave: every cup turns yellow, from the near ones to the far, as "feels." comes
  const tWave = t(TL.B4 + 0.35);
  const waveAt = (c) => tWave + Math.round(Math.max(0, -zAt(c, tWave)) * 2.2);
  const order = [...cups].sort((a, b) => a.z0 - b.z0); // far first: the near ones are drawn on top
  const handoff = { t0: tH, t1: tEnd };
  for (const c of order.reverse()) {
    // visible frames
    const tIn = Math.max(0, Math.ceil((zFar - c.z0) / v)), tOut = Math.floor((zNear + 2 - c.z0) / v);
    if (tOut <= 0 || tIn >= Cm.op) continue;
    const ip = Math.max(0, tIn), op = Math.min(Cm.op, tOut);
    // (keyed on the frames that are multiples of 5 from 0: the hold's first and last frames are keys, so the loop is exact)
    const ts = [ip]; for (let tt = Math.ceil((ip + 1) / 5) * 5; tt < op; tt += 5) { if (tt > handoff.t1 && tt - 5 < handoff.t1) ts.push(handoff.t1, handoff.t1 + 1); ts.push(tt); } ts.push(op);
    ts.sort((a, b) => a - b); for (let i = ts.length - 1; i > 0; i--) if (ts[i] === ts[i - 1]) ts.splice(i, 1);
    const x = c.side * CX;
    // in the handoff the cups part: they slide out to the sides as the road opens
    const part = (tt) => (tt <= handoff.t0 || tt > handoff.t1 ? 0 : Math.pow(Math.min(1, (tt - handoff.t0) / (handoff.t1 - handoff.t0)), 2) * (ph ? 9 : 12));
    const pK = ts.map((tt, i) => [tt, scr(x + c.side * part(tt), 1.0, zAt(c, tt)).map((q) => Math.round(q * 10) / 10), i < ts.length - 1 ? E.linear : undefined]);
    const sK = ts.map((tt, i) => { const k = (dc / depthAt(x, 1.0, zAt(c, tt))) * 100; return [tt, [+k.toFixed(2), +k.toFixed(2)], i < ts.length - 1 ? E.linear : undefined]; });
    const fadeIn = Math.ceil((zFar + 5 - c.z0) / v);
    const oK = clean([[ip, 0, E.linear], [Math.max(ip + 1, fadeIn), 100, E.hold], ...(op > tH ? [[tH + 30, 100, E.linear], [tH + 52, 0, E.hold], [tEnd + 1, 100, E.hold]] : [])]);
    const nul = Cm.nul("street · cup", { ip, op, ks: { p: pK, s: sK, o: oK } });
    // its steam (one phase for all: the street repeats exactly every loop)
    // its steam, once it is near enough to see it (one phase for all: the street repeats exactly every loop)
    const sIp = Math.max(ip, Math.ceil((-11 - c.z0) / v));
    if (sIp < op) steamPlay(Cm, st, { nm: "street · cup · steam", parent: nul, p: [0, -U * 0.55], ip: sIp, op, phase: (((sIp % LOOP) / LOOP) + 1) % 1, o: [[sIp, 0, E.linear], [sIp + 20, 70]] });
    // its glaze: blank, then (a word's cup) lit in its colour, then (the wave) yellow
    const L = lit.find((q) => q.c === c), tw = waveAt(c);
    const segs = []; // [design, from, to]
    if (L && L.t < tw) { segs.push(["blank", ip, L.t + 8], [L.col, L.t, tw + 8]); }
    else segs.push(["blank", ip, tw + 8]);
    segs.push(["yellow", tw, op]);
    for (const [d, a, b] of segs) {
      if (b <= ip || a >= op) continue;
      const a2 = Math.max(ip, a), b2 = Math.min(op, b);
      const pop = d !== "blank" && a > ip;
      cupStillPlay(Cm, pre[d], { nm: `street · cup · ${d}`, parent: nul, ip: a2, op: b2, ks: { o: pop ? [[a2, 0, E.linear], [a2 + 8, 100]] : 100, s: pop ? [[a2, [100, 100], [0.2, 0.7, 0.3, 1]], [a2 + 6, [110, 110], [0.4, 0, 0.3, 1]], [a2 + 18, [100, 100]]] : [100, 100] } });
    }
  }

  /* ======================= the ground (under the cups: added last) ======================= */
  // the light sweep: a band of white across the street at each change of world
  const sweeps = worldSeq.map((wi, n) => { const t0 = tWorld0 + n * dW - 6; return group("sweep " + n, [rect([W * 0.5, H * 3], [0, 0]), gfill({ s: [-W * 0.25, 0], e: [W * 0.25, 0], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, 0], [0.5, 0.75], [1, 0]] })], { p: [[t0, [-W * 0.4, H / 2], [0.4, 0, 0.6, 1]], [t0 + 14, [W * 1.4, H / 2]]], r: 18, o: [[t0, 0, E.hold], [t0 + 1, 100, E.hold], [t0 + 14, 0]] }); });
  Cm.shape("street · light sweeps", sweeps, { ip: tWorld0 - 8, op: tWorld0 + worldSeq.length * dW + 10, masks: [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(W / 2, (groundTop + H) / 2, W * 1.2, H - groundTop, 0) }, o: prop(100), x: prop(0), nm: "ground" }] });
  // the haze at the horizon (the street fades into the paper's white there)
  Cm.shape("street · haze", [group("haze", [rect([W * 1.4, H * 0.4], [W / 2, horizonY + H * 0.12]), gfill({ s: [0, horizonY - 4], e: [0, horizonY + H * 0.3], stops: [[0, "#F2F2F2"], [1, "#F2F2F2"]], alphas: [[0, 1], [0.5, 0.65], [1, 0]] })])], { ks: { o: [[tH, 100, E.linear], [tH + 14, 0, E.hold], [tEnd + 1, 100]] } });
  Cm.add(dashL);
  // (the road is not cut by the window: its colour fades over it, the map shows through)
  Cm.shape("street · road", [group("road", [path(roadPath(0)), fill(roadK)], { o: [[tH, 100, [0.4, 0, 0.3, 1]], [tH + 14, 0, E.hold], [tEnd + 1, 100]] })]);
  Cm.shape("street · lines along", [group("rays", [...rays, stroke(rgb("#000000"), 1, 9, { lc: 1, lj: 1 })])], { masks: K.hole(winHole) });
  Cm.add({ ...rowsL, hasMask: true, masksProperties: K.hole(winHole) });
  // the ground (below the horizon) and the sky (the paper)
  Cm.shape("street · ground", [group("ground", [rect([W * 1.4, H - groundTop + 40], [W / 2, (groundTop + H + 40) / 2]), fill(groundK)])], { masks: K.hole(winHole) });
  K.keyLight("paper · key light", 0, Cm.op, [[tH, 100, E.linear], [tEnd - 6, 0, E.hold], [tEnd + 1, 100]], K.hole(winHole));
  Cm.shape("paper · sky", [group("paper", [rect([W * 1.4, H * 1.4], [W / 2, H / 2]), fill(rgb(C.paper))])], { masks: K.hole(winHole) });

  // (the short version: the street is the same street, at the same place in its loop; the fade on top brings it in)

  const json = Cm.json();
  json.cromatic = { v: 3, concept: "cupcity", markers: { words: [0, tHold], hold: [tHold, tH], handoff: [tH, tEnd], short: [tS0, tS1] }, handoff: { kind: "window" }, pill: [W * 0.5, 0, 1, 0] };
  return json;
}
