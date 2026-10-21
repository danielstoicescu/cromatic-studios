// Cromatic · stories in Lottie · story A v4 (TASK-065c, Daniel's storyboard, round 2): "Our new website is a city.",
// English only. No black intro, no Two Minutes:
//   1 · the ride from straight above, already moving up the coffee street (a drone holding on it, the street running
//       under it); "Our new website / is a [city]." and the pill rolls to "diorama."
//   2 · the Steam tower on the coffee street: "Every brand has its own / [place]." the pill on a flat yellow block
//   3 · OMA Coffee square on: the pill rolls to "facade."   4 · the Slow Coffee Festival's dome: "building."
//   5 · from behind the ride: "Take your / drive." It drives on down the street until it is small; where it went, the
//       site itself (cromaticstudios.com's map, a screenshot) comes towards us until it fills the frame, the title
//       snaps out, the address lands; the screen goes black, the address stays where it is.
//   node buildA5.mjs -> story-a4-en.json   (plates: renderV4.mjs JOB=a5 + JOB=street, platesV4.mjs 5 + a)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, roundRect, pathProp, C } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H, bake } from "./build.mjs";
import { cam, urlPill, grain, grainPlates } from "./kit2.mjs";
import { INK, EXPO, SNAP, reveal, shade, swapLine, tw } from "./kit3.mjs";
import { SHOTS4, A5, driveCar } from "./shots4.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const P4 = JSON.parse(fs.readFileSync(path.join(here, "platesA4.json"), "utf8")), P5 = JSON.parse(fs.readFileSync(path.join(here, "platesA5.json"), "utf8"));
const PL = { ...P4.plates, ...P5.plates };
await grainPlates(PL);
const K = 0.5, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sm = (t) => t * t * (3 - 2 * t), easeOut = (t) => 1 - Math.pow(1 - t, 3);
const F = 980;
const SP = { over: [0, 152], steam: [148, 262], oma: [258, 352], scf: [348, 444], drive: [440, 780], site: [650, F] };
function asset(Cm, name) { const m = PL[name]; if (!m) throw new Error("no plate " + name); if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; } return m; }
const img = (Cm, name, parent, { ip, op, o, dx = 0, nm, ks } = {}) => { const m = asset(Cm, name); return Cm.image(nm || name, name, { parent, ip, op, ks: { p: [m.x + dx, m.y], ...(o != null ? { o } : {}), ...(ks || {}) } }); };
const whipOut = (f, b) => (f > b - 6 ? -W * 1.3 * Math.pow((f - (b - 6)) / 6, 2) : 0), whipIn = (f, a) => (f < a + 6 ? W * 1.3 * Math.pow(1 - (f - a) / 6, 2) : 0);

// ---- 1 · the drone: the strip (story density, 1080 wide) runs under the ride, which holds its place in the frame
const Pstrip = cam(A5.strip), RIDE_AT = [540, 1240], V = 62, Z0 = 5478;
const zAt = (f) => Z0 + (V * f) / 60;
const kRide = (A5.ride.h / 2 / Math.tan((A5.ride.fov * Math.PI) / 360)) / Pstrip.f; // (the ride's lens is a hair longer)
// ---- 2 · the street at Steam: v4's a4-street layers and their parallax, over this shot's length
const AS = P4.shots["a4-street"].main, f2 = AS.f, YH = AS.horizon, CAMY = AS.camY;
const fullW = (l) => (l === "near" ? 3024 : l === "ground" ? 3888 : 2592);
const LZ = { near: 125, mid: 380, far: 1200 };
const sDur = (SP.steam[1] - SP.steam[0]) / 60;
const Tf = (t) => lerp(-3.4, 3.4, clamp(t / sDur)), Df = (t) => 5 * (1 - easeOut(clamp(t / 1.6))), Zf = (t) => lerp(1, 1.07, sm(clamp(t / sDur)));
function xf(l, t) {
  const Tm = Tf(t), Dm = Df(t), Zm = Zf(t), h = CAMY - 0.5, P0 = [fullW(l) / 2, YH], Pc = [W / 2, YH * K];
  if (l === "ground") return { a: P0, p: Pc, s: [100 * K * Zm, 100 * K * Zm * (1 + Dm / h)], sk: (Math.atan(Tm / (h + Dm)) * 180) / Math.PI };
  if (l === "sky") return { a: P0, p: Pc, s: [100 * K * Zm, 100 * K * Zm] };
  return { a: P0, p: [Pc[0] + K * Zm * ((-Tm * f2) / LZ[l]), Pc[1] + K * Zm * ((Dm * f2) / LZ[l])], s: [100 * K * Zm, 100 * K * Zm] };
}
const Pdrive = cam(A5.boot);

function story() {
  const Cm = new Comp({ w: W, h: H, dur: F / 60, nm: "Cromatic · story A v4 · Our new website is a city · en" });
  // ---- nulls, one per shot: each whips in and out (a pan's smear across the cut)
  const [o0, o1] = SP.over, [s0, s1] = SP.steam, [m0, m1] = SP.oma, [c0, c1] = SP.scf, [d0, d1] = SP.drive;
  const overN = Cm.nul("over", { ip: o0, op: o1, ks: { a: RIDE_AT, ...(() => { const k = bake(o0, o1, (f) => ({ p: [RIDE_AT[0] + whipOut(f, o1), RIDE_AT[1]], s: [lerp(104, 112, sm(f / o1)), lerp(104, 112, sm(f / o1))], r: lerp(-4, 3, sm(f / o1)) })); return { p: k.p, s: k.s, r: k.r }; })() } });
  const stN = Cm.nul("steam · whips", { ip: s0, op: s1, ks: { a: [W / 2, H / 2], p: bake(s0, s1, (f) => ({ p: [W / 2 + whipIn(f, s0) + whipOut(f, s1), H / 2] })).p } });
  const N = {};
  for (const l of ["sky", "far", "ground", "mid", "near"]) {
    const k = bake(s0, s1, (f) => { const x = xf(l, (f - s0) / 60); return { p: x.p, s: x.s, ...(x.sk != null ? { sk: x.sk } : {}) }; });
    N[l] = Cm.nul(`steam · ${l}`, { parent: stN, ip: s0, op: s1, ks: { a: xf(l, 0).a, p: k.p, s: k.s } });
    if (k.sk != null) { N[l].ks.sk = prop(k.sk); N[l].ks.sa = prop(0); }
  }
  // OMA and the dome: one picture each (2592 x 3840), a slow push and a drift
  const still = (nm, a, b, dir) => Cm.nul(nm, { ip: a, op: b, ks: { a: [1296, 1920], ...(() => { const k = bake(a, b, (f) => { const u = (f - a) / (b - a); return { p: [W / 2 + whipIn(f, a) + whipOut(f, b) + dir * lerp(-14, 14, u), H / 2], s: [lerp(50, 54, sm(u)), lerp(50, 54, sm(u))] }; }); return { p: k.p, s: k.s }; })() } });
  const omaN = still("oma", m0, m1, 1), scfN = still("dome", c0, c1, -1);
  const driveN = Cm.nul("drive", { ip: d0, op: d1, ks: { a: [1080, 1920], p: bake(d0, d1, (f) => { const t = (f - d0) / 60, sk = Math.exp(-Math.max(0, t - 0.35) * 4) * (t > 0.3 ? 6 : 1); return { p: [W / 2 + whipIn(f, d0) + sk * Math.sin(f * 1.9), H / 2 + sk * Math.sin(f * 2.7) * 0.6] }; }).p, s: [[d0, [50, 50], E.hold], [d0 + 200, [50, 50], E.inOut], [d1, [53, 53]]] } });

  // ---- top: the black end (under the address), grain, the address
  const BL0 = 880;
  urlPill(Cm, { t0: 800, t1: F, x: W / 2 + 10, y: 1520, rot: -7, size: 62 });
  grain(Cm, asset, { o: 30, F });
  Cm.shape("the end · black", [group("b", [rect([W + 40, H + 40], [W / 2, H / 2]), fill(rgb("#000000"))])], { ip: BL0, op: F, ks: { o: [[BL0, 0, E.inOut], [BL0 + 22, 100]] } });

  // ---- the words
  // 1 · "Our new website / is a [city]." the pill rolling to "diorama." (the line's own roll, the house's expo)
  swapLine(Cm, { lead: "Our new website", pre: "is a", words: [["city.", C.yellow, C.black, 30], ["diorama.", C.yellow, C.black, 92]], S: 104, x: 70, by1: 400, tIn: 6, tOut: o1 - 16, nm: "website" });
  // 2-4 · "Every brand has its own / [place]." the pill on a flat yellow block, rolling to facade, then building
  {
    const S = 84, x = 64, by1 = 400, tIn = s0 + 4, tOut = c1 - 14;
    const words = [["place.", "#FFFFFF", C.black, s0 + 20], ["facade.", "#FFFFFF", C.black, m0 + 6], ["building.", "#FFFFFF", C.black, c0 + 6]];
    const { by2 } = swapLine(Cm, { lead: "Every brand has its own", pre: "", words, S, x, by1, tIn, tOut, nm: "brand" });
    // the block: the pill's size plus a margin, following it word to word (the same keys), under the pill, over the card
    const padX = 0.3 * S, ph = 1.12 * S, x0 = x + tw("", S, -0.03) + S * 0.26 + padX, M = 22, MY = 7;
    const geo = words.map(([w]) => tw(w.replace(/\.$/, ""), S, -0.035) + 2 * padX + tw(".", S, -0.035) + S * 0.1);
    const c = (k) => [x0 - padX - M + (geo[k] + 2 * M) / 2, by2 - 0.355 * S + 2];
    const sz = [[words[0][3] - 4, [geo[0] * 0.5, ph * 0.5], E.spring], [words[0][3] + 16, [geo[0] + 2 * M, ph + 2 * MY], E.hold]], ps = [[words[0][3] - 4, c(0), E.hold]];
    words.forEach(([, , , t], k) => { if (!k) return; sz.push([t - 2, [geo[k - 1] + 2 * M, ph + 2 * MY], EXPO], [t + 14, [geo[k] + 2 * M, ph + 2 * MY], E.hold]); ps.push([t - 2, c(k - 1), EXPO], [t + 14, c(k), E.hold]); });
    sz.push([tOut, [geo[2] + 2 * M, ph + 2 * MY], SNAP], [tOut + 12, [0, 0]]);
    const fin = (a) => { a[a.length - 1] = [a[a.length - 1][0], a[a.length - 1][1]]; return a; };
    Cm.shape("brand · the yellow block", [group("aplat", [rect(fin(sz), fin(ps), 18), fill(rgb(C.yellow))])], { ip: words[0][3] - 4, op: tOut + 14, ks: { r: -2, a: [x, by1], p: [x, by1] } });
    // (moved under the pill: just over the line's card, the last layer swapLine drew)
    const L = Cm.layers.pop(); Cm.layers.splice(Cm.layers.length - 1, 0, L);
  }
  // 5 · "Take your / drive." low left, the house yellow on drive; it snaps out as the site comes
  {
    const Sz = 186, by = 1460, tO = 742;
    reveal(Cm, { text: "Take your", size: Sz, x: 66, by, t0: d0 + 22, tOut: tO, stagger: 1.6, outDur: 16, outStagger: 1.4, nm: "drive · take your" });
    reveal(Cm, { text: "drive.", size: Sz, x: 66, by: by + Sz * 0.98, t0: d0 + 32, tOut: tO + 4, stagger: 1.6, outDur: 16, outStagger: 1.4, ink: (j) => (j < 5 ? C.yellow : INK), nm: "drive · drive" });
    shade(Cm, { y0: 1050, y1: H, t0: d0 + 14, t1: tO + 30, a: 0.55, nm: "drive · scrim" });
  }
  // the vignette under the words
  Cm.shape("vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.08, H * 0.5], stops: [[0, "#120A1C"], [1, "#120A1C"]], alphas: [[0, 0], [0.55, 0], [1, 0.5]] })])], { ip: 0, op: BL0 + 24 });

  // ---- 5 · the site, where the ride went: it comes towards us from the vanishing point until it fills the frame
  {
    const last = P5.drive.filter(Boolean).pop(), lm = PL[last];
    const Pcar = [(lm.x + lm.w / 2 - 1080) * 0.5 + W / 2, (lm.y + lm.h * 0.62 - 1920) * 0.5 + H / 2]; // (the drive's null is still at 50 % then)
    const Q = [537.7, 1455.3], t0 = 650, t1 = 800;
    asset(Cm, "a5-site");
    const pK = [[t0, Pcar, [0.7, 0, 0.2, 1]], [t1, Q]];
    const sK = [[t0, [5, 5], [0.7, 0, 0.2, 1]], [t1, [100, 100], E.hold], [BL0, [100, 100], E.linear], [F, [103, 103]]];
    const site = Cm.image("the site", "a5-site", { ip: t0, op: BL0 + 24, ks: { a: Q, p: pK, s: sK, o: [[t0, 0, E.linear], [t0 + 10, 100]] }, masks: [{ inv: false, mode: "a", pt: pathProp(roundRect(W / 2, H / 2, W, H, 44)), o: prop(100), x: prop(0), nm: "screen" }] });
    // its shadow on the street while it comes (a soft dark block, behind it)
    Cm.shape("the site · shadow", [group("s", [rect([W, H], [Q[0] - 0, Q[1] - 0], 60), fill(rgb("#0A0610"), 45)], { a: Q, p: [Q[0] + 18, Q[1] + 26] })], { ip: t0, op: t1 + 8, ks: { a: Q, p: pK, s: sK.slice(0, 2), o: [[t0, 0, E.linear], [t0 + 14, 100, E.hold], [t1 - 6, 100, E.linear], [t1 + 6, 0]] } });
  }

  // ---- 5 · the drive away: the street, the ride frame by frame (it stays, small, until the site covers it)
  {
    P5.drive.forEach((name, i) => { if (!name) return; const f0 = d0 + i * 2, last = i === P5.drive.length - 1; img(Cm, name, driveN, { ip: f0, op: last ? 800 : f0 + 2, nm: `ride · ${i}` }); });
    const fEnd = d0 + P5.drive.length * 2;
    const sh = bake(d0, fEnd, (f) => { const t = (f - d0) / 60, q = driveCar(t), L = Pdrive([q.x - 6, 1.02, q.z + 11]), R = Pdrive([q.x + 6, 1.02, q.z + 11]), M = Pdrive([q.x, 1.02, q.z]), w = Math.abs(R[0] - L[0]) * 1.25; return { p: [M[0], M[1]], s: [w, Math.max(4, w * 0.22)] }; });
    Cm.shape("ride · shadow", [group("s", [ellipse([1, 1], [0, 0]), gfill({ type: 2, s: [0, 0], e: [0.5, 0], stops: [[0, "#2A1A22"], [1, "#2A1A22"]], alphas: [[0, 0.55], [1, 0]] })])], { parent: driveN, ip: d0, op: 800, ks: { p: sh.p, s: sh.s.map(([t, v, e]) => [t, [v[0] * 100, v[1] * 100], e]) } });
    img(Cm, "a5-drive-plate", driveN, { ip: d0, op: d1 });
    for (const [dx, o] of [[-110, 40], [-230, 22]]) img(Cm, "a5-drive-plate", driveN, { ip: d0, op: d0 + 6, o, dx, nm: `drive · smear ${dx}` });
  }
  // ---- 4, 3 · the dome, OMA
  img(Cm, "a5-scf", scfN, { ip: c0, op: c1 }); for (const [dx, o] of [[-110, 40], [-230, 22]]) img(Cm, "a5-scf", scfN, { ip: c0, op: c0 + 6, o, dx, nm: `dome · smear ${dx}` });
  img(Cm, "a5-oma", omaN, { ip: m0, op: m1 }); for (const [dx, o] of [[-110, 40], [-230, 22]]) img(Cm, "a5-oma", omaN, { ip: m0, op: m0 + 6, o, dx, nm: `oma · smear ${dx}` });
  // ---- 2 · the street at Steam
  for (const l of ["near", "mid", "ground", "far", "sky"]) img(Cm, `a4-street-${l}`, N[l], { ip: s0, op: s1 });
  // ---- 1 · the drone: the ride (and its shadow) over the street running under it
  {
    const rm = PL["a5-ride"], k = kRide;
    asset(Cm, "a5-ride");
    Cm.image("ride from above", "a5-ride", { parent: overN, ip: o0, op: o1, ks: { a: [540 - rm.x, 960 - rm.y], p: [RIDE_AT[0], RIDE_AT[1]], s: [100 * k, 100 * k] } });
    const pk = bake(o0, o1, (f) => { const q = Pstrip([842, 0, zAt(f)]); return { p: [RIDE_AT[0] - q[0], RIDE_AT[1] - q[1]] }; }).p;
    asset(Cm, "a5-strip");
    Cm.image("the coffee street, from above", "a5-strip", { parent: overN, ip: o0, op: o1, ks: { p: pk } });
  }
  Cm.shape("ground", [group("g", [rect([W, H], [W / 2, H / 2]), fill(rgb("#0A0A0A"))])]);
  const j = Cm.json(); j.cromatic = { story: "A v4 (storyboard)", lang: "en", dur: F / 60, spans: SP };
  return j;
}
const j = story(), s = JSON.stringify(j);
fs.writeFileSync(path.join(OUT, "story-a4-en.json"), s);
console.log("story-a4-en", (s.length / 1024).toFixed(1), "KB", j.layers.length, "layers", j.op, "frames", (j.op / 60).toFixed(2), "s");
