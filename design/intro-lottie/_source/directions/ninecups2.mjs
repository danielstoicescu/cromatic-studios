// Phase 3 · Nine cups v2 (Daniel picked Nine cups: "more realistic, like the original app's cups; their handles whole;
// a natural spin; finished transitions; the pills fixed"). The cups are the ORIGINAL intro's (src/app.js at 13e8689,
// createKinetic -> cups3): its porcelain, its five designs and four more in their grammar, its lens (FOV 30) and its
// tilt (0.52 rad), nine of its wall of cups as a rhombus (lib/cup2*.mjs, baked from three.js by tools/bakecups2.mjs).
// The story as v1: the thumbnail's dot lands in the line as a cup seen from above; its rim opens into the pill (place,
// facade, brand) and the brand pill closes back into the cup; it lands on the paper and deals eight more, each with its
// world's street in its coffee; the cups stand up (the old angle) and spin in a wave from the middle out; eight fly off,
// one stays, yours; it comes forward, turns its rim to the camera, and the rim becomes the Multiverse pill: the live
// ending (feels., the logo, the window onto the map).
import { group, rect, ellipse, fill, gfill, rgb, E, prop, tmProp, FPS } from "../lib/lottie.mjs";
import { C } from "../lib/kit.mjs";
import { makeScene, clean, RISE, DEAL } from "../lib/scene.mjs";
import { buildCups, KP, STEP_T, STEP_Y, NYK } from "../lib/cup2build.mjs";
import { preLayer } from "../lib/cup2layers.mjs";
import { steamLoop, steamPlay, valAtEased } from "../lib/cupLayers.mjs";
import * as G from "../lib/cup2geo.mjs";
import * as LY from "./ninecups2.layout.mjs";
import { warpTime, piecewise } from "../lib/optimize.mjs";

export const TL = { B1: 0.12, B2: 1.62, B3: 3.8, B4: 6.85, HOLD: 9.25, HAND: 10.85, END: 12.15, SHORT: 12.25, SHORT_END: 12.7, COMP: 12.75 };
export const SQ = { cell: 150, n: 3 };
const LIN = [0, 0, 1, 1];
const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;

export function buildNineCups2(T, ab) {
  const ph = ab.name === "phone";
  const K = makeScene(T, ab, { dur: TL.COMP, nm: `Cromatic opening · Nine cups v2 · ${ab.name}`, camKeys: [[0, [0, 0]], [180, [-6, 4]], [330, [6, 4]], [420, [-6, 8]], [540, [0, 0]]] });
  const { Cm, t, PO, blk, lines, slotPill, letterAt, riseKeys, lineClip, pillGeom, pillShift, setLine, pillEnding } = K;
  const S = ph ? 46 : 84, S3 = ph ? 40 : 66;
  const SQA = Cm.asset("worlds-sq", SQ.cell * SQ.n, SQ.cell * SQ.n, "worlds-sq.webp");
  const cupsB = buildCups(Cm, { tops: [LY.MID] });
  const cam = G.wallCam(LY.CAM);

  /* ======================= the rhombus on the screen ======================= */
  const k = ph ? 21 : 30; // px a wall unit (laptop: the rhombus inside a 1440 x 780 window's crop)
  const dC = ph ? [195, 496] : [930, 450]; // where the rhombus's middle sits
  const Yc = LY.DIAMOND_Y + 1.2;
  const comp = (q) => [r1(dC[0] + q[0] * k), r1(dC[1] - (q[1] - Yc) * k)];
  const MID = LY.MID, mid = cupsB[MID];
  const at0 = (c) => comp([c.C.X, c.C.Y]); // a cup's base, on the screen (its null's origin)

  /* ======================= the times ======================= */
  const t2out = t(3.5), tLand = t(4.0), tDeal = t(4.08), tTilt0 = t(4.92), tTilt1 = t(5.42);
  const tPick = t(5.85), tGo = t(6.0), tCome = t(6.22), tUp = t(6.5), tTopC = t(6.83), tFly = t(6.83);
  const TILT_E = [0.62, 0, 0.3, 1];
  const ring = (c) => (c.n === MID ? 0 : c.C.Y === LY.DIAMOND_Y || Math.abs(c.C.X) < 0.1 || (Math.abs(c.C.X) === 2.8 && Math.abs(c.C.Y - LY.DIAMOND_Y) === 4.5) ? 1 : 2);
  // the dealt order: nearest first (then by the clock from the top)
  const dealt = cupsB.filter((c) => c.n !== MID).map((c) => ({ c, d: Math.hypot(c.C.X, c.C.Y - LY.DIAMOND_Y), a: Math.atan2(c.C.X, c.C.Y - LY.DIAMOND_Y) })).sort((a, b) => a.d - b.d || a.a - b.a).map((x) => x.c);
  const rankOf = (c) => (c.n === MID ? -1 : dealt.indexOf(c));

  /* ======================= the ending (the live one: the pill, the logo, the window) ======================= */
  // the middle cup comes forward to there, its rim to the camera, and its rim becomes the pill
  const cupFwd = ph ? 1.5 : 1.6;
  const fwdAt = ph ? [195, 486] : [930, 456];
  const rimPx = 2.88 * k * cupFwd; // the rim's width on the screen, seen from above
  const END = pillEnding({ TLx: TL, lines4: ph ? ["That's how", "the right brand", "feels."] : ["That's how the right", "brand feels."], size: S, fromCircle: { t0: tFly, hold: 7, p: fwdAt, k: rimPx / (S * 1.14) } });
  const { tHold, tH, tEnd, tS0, tS1 } = END;
  Cm.marker("words", 0, tHold); Cm.marker("hold", tHold, tH); Cm.marker("handoff", tH, tEnd); Cm.marker("short", tS0, tS1);

  /* ======================= the spin (each cup's own) ======================= */
  // turns(t): eased up and down, a little past and back (the cup's weight), its own speed and start; the wave from the
  // middle out. The eight that leave spin up again as they go.
  const spin = new Map();
  for (const c of cupsB) {
    const rg = ring(c), seed = (c.n * 7919) % 97 / 97;
    const t0 = tTilt1 + 2 + rg * 6 + Math.round(seed * 3);
    const dur = c.n === MID ? 64 : 52 + Math.round(seed * 10);
    const keysT = [[t0, 0, [0.42, 0, 0.18, 1]], [t0 + dur, 1.04, [0.4, 0, 0.6, 1]], [t0 + dur + 14, 1]];
    spin.set(c.n, { t0, dur, keysT, seed });
  }
  const turnsAt = (c, tt) => {
    const sp = spin.get(c.n);
    let v = c.C.yaw0 / (2 * Math.PI) + valAtEased(sp.keysT, tt); // (the turn starts with the handle at 0: from its own angle)
    if (c.n !== MID && tt > goAt(c)) { const u = Math.min(1, (tt - goAt(c)) / 30); v += 1.6 * u * u; }
    return v;
  };
  // a remap from turns: seconds into the turn precomp, wrapping each turn (a hold jump back to the start)
  const turnRemap = (c, from, to) => {
    const turnS = (NYK * STEP_Y) / FPS, ks = [];
    let prevW = Math.floor(turnsAt(c, from));
    for (let tt = from; tt <= to + 0.001; tt += 1) {
      const v = turnsAt(c, tt), w = Math.floor(v);
      if (w !== prevW && ks.length) {
        const tl = ks[ks.length - 1][0], vl = turnsAt(c, tl), u = (prevW + (w > prevW ? 1 : 0) - vl) / (v - vl || 1), tc = tl + u;
        ks.push([tc - 0.01, w > prevW ? turnS - 0.0001 : 0, "hold"]); ks.push([tc, w > prevW ? 0 : turnS - 0.0001, LIN]);
        prevW = w;
      }
      ks.push([tt, (((v % 1) + 1) % 1) * turnS, LIN]);
    }
    // keep what a straight line between neighbours does not give
    const keep = [ks[0]];
    for (let i = 1; i < ks.length - 1; i++) { const a = keep[keep.length - 1], b = ks[i], cc = ks[i + 1]; if (b[2] === "hold" || a[2] === "hold") { keep.push(b); continue; } const lin = a[1] + ((cc[1] - a[1]) * (b[0] - a[0])) / (cc[0] - a[0] || 1); if (Math.abs(lin - b[1]) > 1 / FPS / 25) keep.push(b); }
    keep.push(ks[ks.length - 1]);
    return keep.map((q, i) => (i === keep.length - 1 ? [q[0], +q[1].toFixed(5)] : [q[0], +q[1].toFixed(5), q[2]]));
  };
  const speedAt = (c, tt) => (turnsAt(c, tt + 1) - turnsAt(c, tt - 1)) / 2; // turns a frame
  // the eight leave from the outside in
  const goOrder = [...dealt].reverse();
  const goAt = (c) => tGo + goOrder.indexOf(c) * 2;

  // (the cup's base sits a little off its rim's centre seen from above: offset so its rim is on the slot)
  const topRim = (() => { const xf = G.cupXf({ X: mid.C.Xv, Y: mid.C.Y, tilt: LY.TILT_TOP, yaw: mid.C.yaw0 }); return cam.P(xf.still([0, 2.05, 0])); })();
  const rimOff = (kk2) => [r1((mid.C.Xv - topRim[0]) * kk2), r1(-(mid.C.Y - topRim[1]) * kk2)];
  const add2 = (a, b) => [r1(a[0] + b[0]), r1(a[1] + b[1])];
  /* ======================= the cups ======================= */
  const tiltS = (LY.NT * STEP_T) / FPS;
  // where the tilt is at a time (0 straight above .. 1 standing), and when it reaches a key (for things keyed outside it)
  const tiltU = (tt) => valAtEased([[tTilt0, 0, TILT_E], [tTilt1, 1]], tt);
  const timeOfU = (u, a = tTilt0, b = tTilt1, inv = false) => { let lo = a, hi = b; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, um = inv ? 1 - valAtEased([[a, 0, TILT_E], [b, 1]], m) : valAtEased([[a, 0, TILT_E], [b, 1]], m); if (um < u) lo = m; else hi = m; } return (lo + hi) / 2; };
  // the back up (the middle cup, tUp..tTopC, the tilt played back to straight above): when it is at u
  const BACK_E = [0.45, 0, 0.35, 1];
  const timeOfBack = (u) => { let lo = tUp, hi = tTopC; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, um = 1 - valAtEased([[tUp, 0, BACK_E], [tTopC, 1]], m); if (um > u) lo = m; else hi = m; } return (lo + hi) / 2; };
  const steamPre = steamLoop(Cm, "steam", { period: 120, height: ph ? 70 : 120, scale: ph ? 0.5 : 0.85 });
  // front rows over the back ones (the first layer added is drawn on top)
  const byDepth = [...cupsB].sort((a, b) => a.C.Y - b.C.Y || Math.abs(a.C.X) - Math.abs(b.C.X));
  const kS = (k / KP) * 100;
  for (const c of byDepth) {
    const isMid = c.n === MID, rank = rankOf(c), P0 = at0(c), Pm = at0(mid);
    const ti = isMid ? tLand : tDeal + rank * 3;
    // (3.7x: an outer cup's layers end as it has faded, at goAt + 24: they were there, see-through, 10 frames more)
    const lop = isMid ? tFly + 11 : goAt(c) + 25;
    // the cup's null: its base on the screen, its scale, its turn in the plane (dealt spinning, rocking as it spins)
    const pK = isMid
      ? [[tLand, P0, E.hold], [tCome, P0, [0.5, 0, 0.25, 1]], [tUp + 6, add2(fwdAt, rimOff(k * cupFwd)), E.hold]]
      : [[ti, Pm, DEAL], [ti + 26, P0, E.hold], [goAt(c), P0, [0.55, 0, 0.9, 0.5]], [goAt(c) + 30, (() => { const d = [P0[0] - Pm[0], P0[1] - Pm[1]], l = Math.hypot(d[0], d[1]) || 1; return [r1(P0[0] + (d[0] / l) * (ph ? 230 : 640)), r1(P0[1] + (d[1] / l) * (ph ? 230 : 640))]; })()]];
    const sK = isMid
      ? [[tLand - 3, [kS * 1.06, kS * 0.94], [0.3, 0, 0.3, 1]], [tLand + 4, [kS * 0.97, kS * 1.03], [0.3, 0, 0.3, 1]], [tLand + 12, [kS, kS], E.hold], [tCome, [kS, kS], [0.5, 0, 0.25, 1]], [tUp + 6, [kS * cupFwd, kS * cupFwd], E.hold]]
      : [[ti, [kS * 0.4, kS * 0.4], DEAL], [ti + 26, [kS, kS], E.hold], [goAt(c), [kS, kS], [0.55, 0, 0.9, 0.5]], [goAt(c) + 30, [kS * 0.8, kS * 0.8]]];
    // its turn in the plane: dealt with a spin (seen from above a turn is a turn of the picture); then the rock of a
    // cup turning on its foot, as much as it is turning (a hair of precession)
    const sp = spin.get(c.n);
    const rK = [];
    if (!isMid) rK.push([ti, -(300 + rank * 25), DEAL], [ti + 26, 0, E.hold]);
    else rK.push([tLand, 0, E.hold]);
    for (let tt = sp.t0; tt <= Math.min(lop, sp.t0 + sp.dur + 24); tt += 3) {
      const v = turnsAt(c, tt), w = Math.min(1, Math.abs(speedAt(c, tt)) / 0.03);
      rK.push([tt, r2(1.6 * w * Math.sin(2 * Math.PI * v + sp.seed * 6)), LIN]);
    }
    const nul = Cm.nul(`cup ${c.n} · ${c.design.name}`, { parent: PO, ip: isMid ? tLand - 1 : ti - 1, op: lop, ks: { p: clean(pK), s: clean(sK), r: clean(rK) } });
    // (a null's opacity does not reach its children: each layer of the cup fades itself)
    const goneO = isMid ? null : [[goAt(c) + 10, 100, E.linear], [goAt(c) + 24, 0]];
    // the precomps, their origin O at the null's (base) point: placed by the base's offset from O
    const off = [r1(-(c.C.Xv - c.O[0]) * KP), r1(-(c.O[1] - c.C.Y) * KP)];
    const place = (pre, nm, ip, op, tm, ks = {}) => preLayer(Cm, pre, { nm: `cup ${c.n} · ${nm}`, parent: nul, ip, op, tm, ks: { p: off, ...ks } });
    // steam over it once it stands, leaning with its turn (the air drags it round)
    const coffeeTop = c.still.F.coffeeE, steamAt = [r1((coffeeTop.cx - c.C.Xv) * KP), r1((c.C.Y - coffeeTop.cy) * KP)];
    const st = steamPlay(Cm, steamPre, { nm: `cup ${c.n} · steam`, parent: nul, p: steamAt, ip: tTilt1 - 10, op: lop, phase: c.n / 9, s: 100 / (k / KP) * (ph ? 0.6 : 0.5), o: [[tTilt1 - 10, 0, E.linear], [tTilt1 + 20, isMid ? 80 : 55, E.hold], ...(isMid ? [[tCome, 80, E.linear], [tUp, 0]] : [[goAt(c), 55, E.linear], [goAt(c) + 10, 0]])] });
    const lean = []; for (let tt = tTilt1; tt <= lop; tt += 3) lean.push([tt, r1(-Math.max(-1, Math.min(1, speedAt(c, tt) / 0.03)) * 16), LIN]);
    st.ks.r = prop(lean);
    // the world in its coffee (outside the cup's precomps, so it can come and go): fades in once the cup has landed
    worldLayer(c, nul, { ip: isMid ? tLand - 1 : ti - 1, op: lop, fadeIn: isMid ? tLand + 8 : ti + 22, fadeOut: isMid ? [tUp - 2, tUp + 10] : null });
    // the cup: from above (dealt, landed) -> the tilt -> the turn (and the middle one, back up, from above again)
    if (isMid) {
      place(c.tilt, "tilt", tLand - 1, tTilt1 + 1, [[tLand - 1, 0, E.hold], [tTilt0, 0, TILT_E], [tTilt1, tiltS]]);
      place(c.turn, "turn", tTilt1, tUp + 1, turnRemap(c, tTilt1, tUp));
      place(c.tilt, "back up", tUp, lop, [[tUp, tiltS, BACK_E], [tTopC, 0]], { o: [[tFly + 5, 100, E.linear], [tFly + 10, 0]] });
    } else {
      place(c.tilt, "tilt", ti - 1, tTilt1 + 1, [[ti - 1, 0, E.hold], [tTilt0, 0, TILT_E], [tTilt1, tiltS]]);
      place(c.turn, "turn", tTilt1, lop, turnRemap(c, tTilt1, lop), { o: goneO });
    }
  }

  // the world's street in a cup's coffee: the square atlas's cell, squashed to the coffee's ellipse, clipped to what is
  // seen of the coffee, keyed through the tilt; a dark edge and a gloss over it (the espresso it is in)
  function worldLayer(c, nul, { ip, op, fadeIn, fadeOut }) {
    const cell = [(c.C.world % SQ.n) * SQ.cell + SQ.cell / 2, Math.floor(c.C.world / SQ.n) * SQ.cell + SQ.cell / 2];
    const loc = (w) => [r1((w[0] - c.C.Xv) * KP), r1((c.C.Y - w[1]) * KP)];
    // the keys: straight above until the tilt, through it (at the times it reaches each of its keys), standing after
    const isMid = c.n === MID;
    const KK = c.tiltKeys.map(([, Kd]) => Kd);
    const times = KK.map((_, i) => (i === 0 ? tTilt0 : i === KK.length - 1 ? tTilt1 : timeOfU(i / (KK.length - 1))));
    let seq = KK.map((Kd, i) => [Math.round(times[i] * 10) / 10, Kd]);
    if (isMid) { const back = KK.map((Kd, i) => [Math.round(timeOfBack(i / (KK.length - 1)) * 10) / 10, Kd]); seq = [...seq, ...back.filter(([tt]) => tt >= tUp)]; seq.sort((a, b) => a[0] - b[0]); }
    const L = seq.map(([tt, Kd]) => { const e = Kd.F.coffeeE, cc = loc([e.cx, e.cy]); return { tt, cc, sx: r2(((2 * e.a * KP) / SQ.cell) * 104), sy: r2(((2 * Math.max(e.b, 0.02) * KP) / SQ.cell) * 104), rot: r2((-e.ang * 180) / Math.PI), poly: G.resample(Kd.F.coffee.length >= 3 ? Kd.F.coffee : [[e.cx, e.cy], [e.cx, e.cy], [e.cx, e.cy]], 18, [0, 1]), e }; });
    const kk = (fn, ease = LIN) => L.map((l, i) => [l.tt, fn(l), i < L.length - 1 ? ease : undefined]);
    const imgPath = (l) => {
      const r = (l.rot * Math.PI) / 180, cs = Math.cos(-r), sn = Math.sin(-r);
      const pts = l.poly.map((q) => { const p = loc(q), d = [p[0] - l.cc[0], p[1] - l.cc[1]], u = [d[0] * cs - d[1] * sn, d[0] * sn + d[1] * cs]; return [r1(cell[0] + u[0] / (l.sx / 100)), r1(cell[1] + u[1] / (l.sy / 100))]; });
      return smooth(pts);
    };
    const pk = (fn) => ({ a: 1, k: L.map((l, i) => ({ t: l.tt, s: [fn(l)], ...(i < L.length - 1 ? { o: { x: [0], y: [0] }, i: { x: [1], y: [1] } } : {}) })) });
    const o = clean([[0, 0, E.hold], [fadeIn, 0, E.linear], [fadeIn + 14, 88, E.hold], ...(fadeOut ? [[fadeOut[0], 88, E.linear], [fadeOut[1], 0]] : []), ...(c.n !== MID ? [[goAt(c) + 10, 88, E.linear], [goAt(c) + 24, 0]] : [])]);
    // (the espresso's dark edge round the picture is in the atlas itself: build4.mjs squareAtlas, a vignette per cell)
    Cm.image(`cup ${c.n} · the world`, SQA, { parent: nul, ip, op, ks: { a: cell, p: kk((l) => l.cc), s: kk((l) => [l.sx, l.sy]), r: kk((l) => l.rot), o }, masks: [{ inv: false, mode: "a", pt: pk(imgPath), o: prop(100), x: prop(0), nm: "the coffee" }] });
  }

  /* ======================= text and pills ======================= */
  // beat 3 · nine worlds over the same streets / one will feel like yours.
  const b3a = blk(["Nine worlds over", "the same streets."], { size: S3, mid: ph ? 0.17 : 0.44 });
  const b3b = blk(["One will feel", "like yours."], { size: S3, mid: ph ? 0.17 : 0.44, pill: true });
  const t3 = t(TL.B3 + 0.06), t3b = t(TL.B3 + 1.7), t3out = t(TL.B4 - 0.18);
  const yoursW = b3b.find((w) => w.text === "yours.");
  slotPill("beat 3 · yours.", { size: S3, x0: yoursW.lx + yoursW.x + pillShift(S3), by: yoursW.by, words: [["yours.", C.yellow, C.black, tPick]], tOut: t3out, outTo: "fade", ip: tPick, op: t3out + 20, id: "yours" });
  lines("beat 3 · nine worlds over the same streets", b3a, { size: S3, inAt: (i) => t3 + i * 3.5, outAt: (i) => t3b - 8 + i * 1.2 });
  lines("beat 3 · one will feel like", b3b.filter((w) => w !== yoursW), { size: S3, inAt: (i) => t3b + i * 3.5, outAt: (i) => t3out + i * 1.2 });

  // beat 2 · the pill is a cup: it lands in the line seen from above, its rim opens into the pill, and closes back
  const b2 = blk(["But someone", "could remember", "a place."], { size: S, pill: true, mid: ph ? 0.2 : 0.5 });
  const placeW = b2.find((w) => w.text === "place.");
  const t2 = t(TL.B2), tCupIn = t(1.76), tP = t(2.02), tF = t(2.56), tB = t(3.06);
  const px0 = placeW.lx + placeW.x + pillShift(S);
  const g0 = pillGeom(S, px0 - 0.34 * S, placeW.by, setLine(T, "place.", S, -0.035).width);
  const slot = [px0 - 0.34 * S + g0.h / 2, g0.cy]; // the pill's left end: a circle the pill's height
  const sp = slotPill("beat 2 · place. facade. brand.", { size: S, x0: px0, by: placeW.by, words: [["place.", C.green, C.black, tP], ["facade.", C.blue, C.black, tF], ["brand.", C.yellow, C.black, tB]], start: { size: [g0.h, g0.h], pos: slot }, tOut: t2out, outTo: "circle", ip: tP - 1, op: t2out + 17, id: "word" });
  lines("beat 2 · but someone could remember a", b2.filter((w) => w !== placeW), { size: S, inAt: (i) => t2 + i * 3.5, outAt: (i) => t2out + i * 1.2 });
  // the line's cup: the middle cup seen from above, its rim the pill's height; lands from the thumbnail's dot in the
  // slot, the pill opens out of it; the brand pill closes back into it; it flies to the paper and lands there
  const gl = sp.last, outC = [gl.cx, gl.cy];
  const kLine = g0.h / 2.88, sLine = (kLine / KP) * 100;
  const tFlyOut = t2out + 12, tArc = Math.round((tFlyOut + tLand) / 2);
  const lineCup = Cm.nul("beat 2 · the cup in the line", { parent: PO, ip: tCupIn - 1, op: tLand, ks: {
    p: { x: [[tCupIn, add2(slot, rimOff(kLine))[0], E.hold], [t2out + 2, add2(outC, rimOff(kLine))[0], E.hold], [tFlyOut, add2(outC, rimOff(kLine))[0], [0.45, 0, 0.3, 1]], [tLand, at0(mid)[0]]], y: [[tCupIn, add2(slot, rimOff(kLine))[1], E.hold], [t2out + 2, add2(outC, rimOff(kLine))[1], E.hold], [tFlyOut, add2(outC, rimOff(kLine))[1], [0.2, 0.6, 0.4, 1]], [tArc, Math.min(outC[1], at0(mid)[1]) - (ph ? 50 : 100), [0.55, 0, 0.8, 0.4]], [tLand, at0(mid)[1]]] },
    s: [[tCupIn, [0, 0], E.spring], [tCupIn + 12, [sLine, sLine], E.hold], [tFlyOut, [sLine, sLine], [0.45, 0, 0.3, 1]], [tLand - 3, [kS * 1.04, kS * 1.04]]],
    r: [[tFlyOut, 0, [0.45, 0, 0.3, 1]], [tLand, -360]]
  } });
  // (gone under the pill as it opens; back under it as it closes, there when the circle dissolves off it)
  const lineCupO = [[tP - 1, 100, E.linear], [tP + 4, 0, E.hold], [t2out + 3, 0, E.linear], [t2out + 7, 100]];
  const offM = [r1(-(mid.C.Xv - mid.O[0]) * KP), r1(-(mid.O[1] - mid.C.Y) * KP)];
  preLayer(Cm, mid.top, { nm: "beat 2 · the cup in the line · cup", parent: lineCup, ip: tCupIn - 1, op: tLand, ks: { p: offM, o: lineCupO }, tm: [[tCupIn - 1, 0, "hold"], [tLand, 0]] });

  // beat 1 · nobody remembers a thumbnail.: the word shrinks into the grey card; it flips away; its dot flies to the line
  const b1 = blk(["Nobody", "remembers a", "thumbnail."], { size: S, mid: ph ? 0.2 : 0.5 });
  const FIRST_AT = -60; // the letters' rise ends before the first frame
  const thumbW = b1.find((w) => w.text === "thumbnail.");
  const t1 = t(TL.B1), tShrink = t(0.95), tCard = t(1.05), tFlip = t(1.4), t1out = t(1.42);
  const kk3 = ph ? 0.42 : 0.36;
  const cx = thumbW.lx + thumbW.x + thumbW.w / 2, cy = thumbW.by - (T.xh / T.upm) * S * 0.5;
  const thumbNull = Cm.nul("beat 1 · thumbnail", { parent: PO, op: tFlip + 10, ks: { a: [cx, cy], p: [cx, cy], s: [[tShrink, [100, 100], [0.6, 0, 0.25, 1]], [tShrink + 18, [kk3 * 100, kk3 * 100], E.hold], [tFlip, [kk3 * 100, kk3 * 100], [0.55, 0, 0.9, 0.4]], [tFlip + 9, [0, kk3 * 100]]] } });
  Cm.shape("beat 1 · thumbnail. (word)", [group("thumbnail.", thumbW.letters.map((L, j) => letterAt(L, thumbW.lx, thumbW.by, S, C.black, riseKeys(FIRST_AT + j, null, S))))], { parent: thumbNull, op: tFlip + 10, masks: [lineClip([thumbW], S)] });
  const cw = (thumbW.w * kk3 + (ph ? 22 : 44)) / kk3, chh = cw * (ph ? 0.5 : 0.56), lw = (ph ? 1.5 : 2) / kk3, cardC = [cx, cy - chh * 0.12], cardR = (ph ? 8 : 14) / kk3;
  Cm.shape("beat 1 · the card", [
    group("picture", [
      group("sun", [ellipse([cw * 0.09, cw * 0.09], [cx + cw * 0.26, cy - chh * 0.42]), { ty: "st", c: prop(rgb(C.black)), o: prop(100), w: prop(lw), lc: 2, lj: 2, ml: 4, bm: 0 }, fill(rgb(C.white))]),
      group("hill", [{ ty: "sh", d: 1, ks: { a: 0, k: { c: true, v: [[cx - cw * 0.36, cy - chh * 0.16], [cx - cw * 0.1, cy - chh * 0.44], [cx + cw * 0.06, cy - chh * 0.28], [cx + cw * 0.17, cy - chh * 0.36], [cx + cw * 0.36, cy - chh * 0.16]].map((q) => q.map(r1)), i: Array(5).fill([0, 0]), o: Array(5).fill([0, 0]) } } }, { ty: "st", c: prop(rgb(C.black)), o: prop(100), w: prop(lw), lc: 2, lj: 2, ml: 4, bm: 0 }, fill(rgb(C.white))])
    ], { o: [[0, 0, E.hold], [tCard + 8, 0, E.linear], [tCard + 14, 100]] }),
    group("frame", [rect([cw, chh], cardC, cardR), { ty: "st", c: prop(rgb(C.black)), o: prop(100), w: prop((ph ? 2 : 2.5) / kk3), lc: 2, lj: 2, ml: 4, bm: 0 }, fill(rgb(C.bar))])
  ], { parent: thumbNull, ip: tCard, op: tFlip + 10, ks: { a: [cx, cy], p: [cx, cy], s: [[tCard, [86, 86], E.spring], [tCard + 20, [100, 100]]], o: [[tCard, 0, E.linear], [tCard + 5, 100]] } });
  // its dot: off the flipped card, on an arc, into the line's slot (where it is a cup)
  Cm.shape("beat 1 · the dot", [group("dot", [ellipse([0.22 * S, 0.22 * S], [0, 0]), fill(rgb(C.black))])], { parent: PO, ip: tFlip + 4, op: tCupIn + 3, ks: {
    p: { x: [[tFlip + 9, cx, [0.45, 0, 0.35, 1]], [tCupIn, slot[0]]], y: [[tFlip + 9, cy, [0.2, 0.6, 0.4, 1]], [Math.round((tFlip + 9 + tCupIn) / 2), Math.min(cy, slot[1]) - (ph ? 40 : 70), [0.55, 0, 0.8, 0.4]], [tCupIn, slot[1]]] },
    s: [[tFlip + 5, [0, 0], E.spring], [tFlip + 13, [100, 100], E.hold], [tCupIn - 2, [100, 100], E.out], [tCupIn + 2, [0, 0]]]
  } });
  // (3.69: the first line is set from the first frame: the page paints it as real text (boot.js) while the player
  // loads, and the drawing takes over where the text is, at the same place, size and face)
  lines("beat 1 · nobody remembers a", b1.filter((w) => w !== thumbW), { size: S, inAt: (i) => FIRST_AT + i * 4, outAt: (i) => t1out + i * 1.5 });

  /* ======================= the paper ======================= */
  K.keyLight("paper · key light", 0, tEnd + 1, [[tH, 100, E.linear], [tEnd - 6, 0]], K.hole(END.winK));
  K.paper({ op: tEnd + 1, masks: K.hole(END.winK), gridO: [[tTilt0, 100, E.inOut], [tTilt1, 55, E.hold], [tCome, 55, E.inOut], [tTopC, 100]] });
  K.keyLight("short · key light", tS0, tS1 + 1);
  K.paper({ ip: tS0, op: tS1 + 1, nm: "short · ground" });

  const json = Cm.json();
  // the first line as the page sets it before the player draws (boot.js): its lines' starts and baselines, its size and
  // leading (CromaticSans 700 = Google Sans SemiBold, the -0.035 em tracking of every line here)
  const byLine = []; for (const w of b1) { (byLine[w.line] ||= { words: [], x: w.lx, by: w.by }).words.push(w.text); }
  const fm = { asc: +(T.asc / T.upm).toFixed(4), desc: +(-T.desc / T.upm).toFixed(4) }; // (the face's hhea metrics: boot.css sets them as the overrides)
  const first = { size: S, lead: K.LEAD, track: -0.035, ...fm, lines: byLine.map((l) => ({ t: l.words.join(" "), x: +l.x.toFixed(2), by: +l.by.toFixed(2) })) };
  // a returning visitor's (and reduced motion's) line: the pill's headline, one lockup with it (3.77, Daniel: over the
  // pill it "reads as an overlap", and on a phone "the right brand" ran edge to edge). Two lines on every screen (the
  // opening's own laptop setting), centred, half the pill's height clear above it; a size well inside the screen (the
  // widest line is kept, w: boot.js holds a 24 px margin on any screen) and still the page's largest paint (on a
  // 1440 x 900 laptop 68,376 px2 against the map's welcome title, the next largest, at 46,961; on a phone 21-23,000
  // against the road hint's 4,212)
  const brandLines = ["That's how the right", "brand feels."];
  const PH = END.fg.h * END.gS, pillTop = K.H / 2 - PH / 2, BS = ph ? 32 : 52, BL = K.LEAD, lastBy = pillTop - 0.5 * PH;
  const brand = { size: BS, lead: BL, track: -0.035, ...fm, center: K.W / 2, w: +Math.max(...brandLines.map((l) => setLine(T, l, BS, -0.035).width)).toFixed(2),
    lines: brandLines.map((t2, i) => ({ t: t2, by: +(lastBy - (brandLines.length - 1 - i) * BS * BL).toFixed(2) })) };
  json.cromatic = { v: 3, concept: "ninecups2", handoff: { kind: "window" }, pill: END.pillMeta, first, brand };
  // 3.69 (Daniel: "a bit fast"): the words about 30 % slower, the cups' beat 25 %, the hold, the opening and the short
  // version as they were (only later): a warp of the whole top level, its loop only shifted (cut where it starts)
  const W0 = piecewise([[0, 0], [228, 296], [411, 525], [555, 712]]);
  warpTime(json, W0, { splitAt: [tHold] });
  const mk = Object.fromEntries(json.markers.map((m) => [m.cm, [m.tm, m.tm + m.dr]]));
  json.cromatic.markers = { words: mk.words, hold: mk.hold, handoff: mk.handoff, short: mk.short };
  json.cromatic.pace = { words: 1.3, cups: 1.25, rest: 1 };
  return json;
}
// a closed smooth path through points (Catmull-Rom tangents)
function smooth(P) {
  const n = P.length, v = [], i = [], o = [];
  for (let a = 0; a < n; a++) { const p0 = P[(a - 1 + n) % n], p2 = P[(a + 1) % n], tg = [r1((p2[0] - p0[0]) / 6), r1((p2[1] - p0[1]) / 6)]; v.push(P[a].map(r1)); o.push(tg); i.push([-tg[0], -tg[1]]); }
  return { c: true, v, i, o };
}
