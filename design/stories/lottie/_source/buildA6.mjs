// Cromatic · stories in Lottie · story A v5 (TASK-065d, Daniel's notes on v4): as v4 (buildA5.mjs), and
//   3 · OMA from further away: Tampa and its BRASOV letters behind it, the shop lit warm from inside, people moving
//       behind its glass (the room drawn under the plate's front, the glass cut out of it)
//   4 · the Slow Coffee dome from further away (the streets and houses round it)
//   5 · after "Take your drive." no site: only the address, landing softly; black, the address stays where it was
//       (centred, as in story C)
//   node buildA6.mjs -> story-a5-en.json   (plates: platesA4/A5 as v4, platesA6.json: renderV5 JOB=a5 + platesV5 a)
// ---- v4's notes:
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
import { Comp, group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, roundRect, pathProp, rng, C } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H, bake } from "./build.mjs";
import { cam, urlPill, grain, grainPlates } from "./kit2.mjs";
import { INK, EXPO, SNAP, reveal, shade, swapLine, tw } from "./kit3.mjs";
import { SHOTS4, A5, driveCar } from "./shots4.mjs";
import { person } from "./kit5.mjs";
import { loadCards, drawCard } from "../../cards/cards.mjs";
const KC = await loadCards();

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const P4 = JSON.parse(fs.readFileSync(path.join(here, "platesA4.json"), "utf8")), P5 = JSON.parse(fs.readFileSync(path.join(here, "platesA5.json"), "utf8"));
const P6 = JSON.parse(fs.readFileSync(path.join(here, "platesA6.json"), "utf8"));
const PL = { ...P4.plates, ...P5.plates, ...P6.plates };
await grainPlates(PL);
const K = 0.5, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sm = (t) => t * t * (3 - 2 * t), easeOut = (t) => 1 - Math.pow(1 - t, 3);
const F = 960;
const SP = { over: [0, 152], steam: [148, 262], oma: [258, 392], scf: [388, 500], drive: [496, 866] };
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

// ---- 3 · OMA's room, behind its glass (plate px, under the plate's front, over its base): the warm light of the room,
// its lamps, the shelves and the counter, the barista and the people, the glass's reflection
function omaRoom(Cm, N, a, b) {
  const front = asset(Cm, "a6-oma-front");
  Cm.image("oma · the front (the glass cut out)", "a6-oma-front", { parent: N, ip: a, op: b, ks: { p: [front.x, front.y] } });
  const box = (A) => { const xs = A.map((q) => q[0]), ys = A.map((q) => q[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
  const maskOf = (A, grow = 3) => { const B = box(A), cx = (B.x0 + B.x1) / 2, v = A.map(([x, y]) => [x + Math.sign(x - cx) * grow, y + (y > (B.y0 + B.y1) / 2 ? grow : -grow)]); return [{ inv: false, mode: "a", pt: pathProp({ c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) }), o: prop(100), x: prop(0), nm: "the glass" }]; };
  const R = rng(613), dur = b - a;
  P6.arches.forEach((A, k) => {
    const B = box(A), w = B.x1 - B.x0, h = B.y1 - B.y0, door = k === 1, items = [];
    // the glass's reflection: a soft pale band, sliding a little with the camera (on top of the room)
    items.push(group("reflection", [rect([w * 0.34, h * 1.6], [0, 0]), gfill({ type: 1, s: [-w * 0.17, 0], e: [w * 0.17, 0], stops: [[0, "#FFF6E6"], [1, "#FFF6E6"]], alphas: [[0, 0], [0.5, 0.16], [1, 0]] })], { p: [[a, [B.x0 + w * 0.15, B.y0 + h * 0.5], E.linear], [b, [B.x0 + w * 0.32, B.y0 + h * 0.5]]], r: 24 }));
    // the people: the near ones darker and bigger
    const by = B.y1, u = h / 0.95 / 100; // (a grown-up stands a little shorter than the arch)
    if (!door) {
      // a customer at the counter, near the glass, leaning in and back
      items.push(person({ nm: "customer", h: 0.7 * h, col: "#5A2C14", o: 72, keys: [[a, [B.x0 + w * 0.8, by + h * 0.06], E.inOut], [a + dur * 0.55, [B.x0 + w * 0.74, by + h * 0.06], E.inOut], [b, [B.x0 + w * 0.77, by + h * 0.06]]], sway: 2.5, t0: a, t1: b }));
      // the counter
      items.push(group("counter", [rect([w + 20, h * 0.3], [B.x0 + w / 2, by - h * 0.15 + 8]), fill(rgb("#6E3A1C"))]), group("counter · top", [rect([w + 20, 10], [B.x0 + w / 2, by - h * 0.3 + 8]), fill(rgb("#F0B572"))]));
      // the barista behind it, working along it
      items.push(person({ nm: "barista", h: 0.6 * h, col: "#7E4420", o: 62, keys: [[a, [B.x0 + w * 0.3, by - h * 0.06], E.inOut], [a + dur * 0.5, [B.x0 + w * 0.46, by - h * 0.06], E.inOut], [b, [B.x0 + w * 0.4, by - h * 0.06]]], sway: 3, t0: a, t1: b }));
      // the shelves on the back wall, cups on them
      for (const [yy, n] of [[0.42, 6], [0.56, 5]]) { const cups = []; for (let j = 0; j < n; j++) cups.push(rect([w * 0.05, h * 0.035], [B.x0 + w * (0.18 + (0.64 * j) / (n - 1)), B.y0 + h * yy - h * 0.022], 3)); items.push(group(`shelf ${yy}`, [rect([w * 0.82, 7], [B.x0 + w / 2, B.y0 + h * yy]), ...cups, fill(rgb("#9A5A2C"), 85)])); }
    } else {
      // through the door: someone walking across the room, someone sitting further back
      items.push(person({ nm: "walking", h: 0.74 * h, col: "#5A2C14", o: 74, keys: [[a, [B.x1 + w * 0.25, by + h * 0.04]], [b, [B.x0 + w * 0.05, by + h * 0.04]]], bob: 1.4, t0: a, t1: b }));
      items.push(person({ nm: "sitting", h: 0.5 * h, col: "#8A4C22", o: 55, keys: [[a, [B.x0 + w * 0.3, by - h * 0.1]]], sway: 4, t0: a, t1: b }));
      items.push(group("table", [rect([w * 0.34, h * 0.03], [B.x0 + w * 0.42, by - h * 0.26]), rect([w * 0.03, h * 0.24], [B.x0 + w * 0.42, by - h * 0.13]), fill(rgb("#7E4320"), 85)]));
      items.push(group("picture", [rect([w * 0.3, h * 0.16], [B.x0 + w * 0.62, B.y0 + h * 0.45], 4), fill(rgb("#B86A34"), 80)]));
    }
    // the lamps: hanging from the top, each its warm pool
    for (const fx of door ? [0.5] : [0.3, 0.7]) {
      const lx = B.x0 + w * fx, ly = B.y0 + h * 0.26, fl = 92 + Math.round(R() * 6);
      items.push(group("lamp", [rect([4, h * 0.26], [lx, B.y0 + h * 0.13]), fill(rgb("#5A2E16")), rect([w * 0.12, h * 0.04], [lx, ly], 8), fill(rgb("#3A1E10"))]));
      items.push(group("lamp · light", [ellipse([w * 0.95, w * 0.95], [lx, ly + h * 0.05]), gfill({ type: 2, s: [lx, ly + h * 0.05], e: [lx + w * 0.47, ly + h * 0.05], stops: [[0, "#FFF0C8"], [1, "#FFB050"]], alphas: [[0, 0.75], [0.35, 0.3], [1, 0]] })], { o: [[a, 100, E.inOut], [a + dur * 0.5, fl, E.inOut], [b, 100]] }));
    }
    // the room's warm light: brightest under the lamps, deeper low down
    items.push(group("room", [rect([w + 40, h + 40], [B.x0 + w / 2, B.y0 + h / 2]), gfill({ type: 1, s: [0, B.y0], e: [0, B.y1], stops: [[0, "#FFD993"], [0.5, "#F5A85A"], [1, "#B9642E"]] })]));
    Cm.shape(`oma · the room ${door ? "(door)" : "(window)"}`, items, { parent: N, ip: a, op: b, masks: maskOf(A) });
  });
}

function story() {
  const Cm = new Comp({ w: W, h: H, dur: F / 60, nm: "Cromatic · story A v5 · Our new website is a city · en" });
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
  // (v5: the wider pictures, 2592 x 4608, shown whole, 2592 px into 1080, then a slow push)
  const still = (nm, a, b, dir, s0 = 41.7, s1 = 43.6) => Cm.nul(nm, { ip: a, op: b, ks: { a: [1296, 2304], ...(() => { const k = bake(a, b, (f) => { const u = (f - a) / (b - a); return { p: [W / 2 + whipIn(f, a) + whipOut(f, b) + dir * lerp(-10, 10, u), H / 2], s: [lerp(s0, s1, sm(u)), lerp(s0, s1, sm(u))] }; }); return { p: k.p, s: k.s }; })() } });
  const omaN = still("oma", m0, m1, 1), scfN = still("dome", c0, c1, -1, 41.7, 44);
  const driveN = Cm.nul("drive", { ip: d0, op: d1, ks: { a: [1080, 1920], p: bake(d0, d1, (f) => { const t = (f - d0) / 60, sk = Math.exp(-Math.max(0, t - 0.35) * 4) * (t > 0.3 ? 6 : 1); return { p: [W / 2 + whipIn(f, d0) + sk * Math.sin(f * 1.9), H / 2 + sk * Math.sin(f * 2.7) * 0.6] }; }).p, s: [[d0, [50, 50], E.hold], [d0 + 200, [50, 50], E.inOut], [d1, [53, 53]]] } });

  // ---- top: the address and the black end (Iris's a4-end: the pill lands centred, the black comes under it, the
  // soft settle), grain; then the words (Iris's cards: a1 website, a2 brand on the aplat, a3 take your drive)
  const BL0 = 836, SPK = { ...SP, end: [BL0, F] };
  const card = (id, t) => { const { __T, ...src } = KC.card(id), c = JSON.parse(JSON.stringify(src)); c.__T = KC.T; if (t) Object.assign(c.timing.cues, t); return c; };
  drawCard(Cm, card("a4-end", { urlIn: "end-36" }), SPK);
  grain(Cm, asset, { o: 30, F });
  for (const id of ["a1-website", "a2-brand"]) drawCard(Cm, card(id), SPK);
  drawCard(Cm, card("a3-drive", { out: "drive+124" }), SPK);
  // the vignette under the words
  Cm.shape("vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.08, H * 0.5], stops: [[0, "#120A1C"], [1, "#120A1C"]], alphas: [[0, 0], [0.55, 0], [1, 0.5]] })])], { ip: 0, op: BL0 + 24 });

  // ---- 5 · the drive away: the street, the ride frame by frame (it stays, small, far down the street)
  {
    P5.drive.forEach((name, i) => { if (!name) return; const f0 = d0 + i * 2, last = i === P5.drive.length - 1; img(Cm, name, driveN, { ip: f0, op: last ? d1 : f0 + 2, nm: `ride · ${i}` }); });
    const fEnd = d0 + P5.drive.length * 2;
    const sh = bake(d0, fEnd, (f) => { const t = (f - d0) / 60, q = driveCar(t), L = Pdrive([q.x - 6, 1.02, q.z + 11]), R = Pdrive([q.x + 6, 1.02, q.z + 11]), M = Pdrive([q.x, 1.02, q.z]), w = Math.abs(R[0] - L[0]) * 1.25; return { p: [M[0], M[1]], s: [w, Math.max(4, w * 0.22)] }; });
    Cm.shape("ride · shadow", [group("s", [ellipse([1, 1], [0, 0]), gfill({ type: 2, s: [0, 0], e: [0.5, 0], stops: [[0, "#2A1A22"], [1, "#2A1A22"]], alphas: [[0, 0.55], [1, 0]] })])], { parent: driveN, ip: d0, op: d1, ks: { p: sh.p, s: sh.s.map(([t, v, e]) => [t, [v[0] * 100, v[1] * 100], e]) } });
    img(Cm, "a5-drive-plate", driveN, { ip: d0, op: d1 });
    for (const [dx, o] of [[-110, 40], [-230, 22]]) img(Cm, "a5-drive-plate", driveN, { ip: d0, op: d0 + 6, o, dx, nm: `drive · smear ${dx}` });
  }
  // ---- 4, 3 · the dome, OMA
  img(Cm, "a6-scf", scfN, { ip: c0, op: c1 }); for (const [dx, o] of [[-110, 40], [-230, 22]]) img(Cm, "a6-scf", scfN, { ip: c0, op: c0 + 6, o, dx, nm: `dome · smear ${dx}` });
  omaRoom(Cm, omaN, m0, m1);
  img(Cm, "a6-oma", omaN, { ip: m0, op: m1 }); for (const [dx, o] of [[-110, 40], [-230, 22]]) img(Cm, "a6-oma", omaN, { ip: m0, op: m0 + 6, o, dx, nm: `oma · smear ${dx}` });
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
  const j = Cm.json(); j.cromatic = { story: "A v5 (Daniel's notes on v4)", lang: "en", dur: F / 60, spans: SP };
  return j;
}
const j = story(), s = JSON.stringify(j);
fs.writeFileSync(path.join(OUT, "story-a5-en.json"), s);
console.log("story-a5-en", (s.length / 1024).toFixed(1), "KB", j.layers.length, "layers", j.op, "frames", (j.op / 60).toFixed(2), "s");
