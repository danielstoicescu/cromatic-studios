// Cromatic · stories in Lottie · story C v6 (TASK-065i, Daniel's notes on v5): C5's chase in the current style, every
//   plate captured again from the 4.4 render build (stories-render-44: Toma's lit rooms, the traffic lights, Ilinca's
//   Aesthetic Court pop-up, Casa Berero cleared), and:
//   0 a new opening inside the 1300 (radioDash.js): the engine catches (0.45), the stereo comes on by itself (display
//     0.85, "CROMATIC FM 101.4" settled with the station lock 1.10), its blue lights breathing on Sorin's kicks; the cut
//     to Olari at 2.2 (the car is already running there: no cough, the lights on)
//   Olari 9 / 9:11 and Fintech Blvd / 11:11 as two pills each; "Take it" over SLOW; Casa Berero square on.
//   node buildC6.mjs -> story-c6-en.json (29.53 s)   (plates: platesC2/C4 as v5, platesC6.json: renderV5 JOB=c5/c6plates
//   + platesV5 c PFX=c6; the interior: frames/c6/int-NNN.webp from renderV6 JOB=c6dash, local)
// Cromatic · stories in Lottie · story C v5 (TASK-065d, Daniel's notes on v4): the chase at night, English only.
//   The words are Iris's cards (design/stories/cards: one face, one text colour, the corners, the tags, the pill), on
//   her long clock (C_long x2) with the new shots in it:
//   2 the Aesthetic Court from further away, warm light (no burgundy)   3 Steam's blade sign on its bracket (3D, white,
//   lit)   3-4 Night coffee hopping. held from Steam through Casa Berero   5 the fountain held (the water ping-pongs, the
//   crash zoom eases back out)   6 SLOW held on the dome after the ride   7 the Two Minutes corner from above, then the
//   side window: the ride drifting at the lens in slow motion, a Two Minutes coffee flying in through its open window
//   8 Fintech Blvd · 11:11: the ride past the kerb, away up the boulevard, then head on (the drift, the police);
//   Ended too soon? / Drive it for yourself. + the pill; black, the pill stays centred.
//   node buildC5.mjs -> story-c5-en.json   (plates: platesC2/C4 as v4, platesC5.json: renderV5 JOB=c5 + platesV5 c)
// ---- v4's notes:
// Cromatic · stories in Lottie · story C v4 (TASK-065c, Daniel's shot list): the chase at night, English only.
//   1 Olari 9 as in v3 ("superb")   2 the Aesthetic Court in its burgundy, the whole sign: City landmarks / Event
//   locations   3 Steam, its original logo lit on the tower: Coffee hopping   4 past Casa Berero, its sign lit
//   5 the fountain, its water moving frame by frame, the lamps' light diffused: Down to earth, up for fun.
//   6 Slow Coffee: You should take it / SLOW   7 the Two Minutes drift: You always have two minutes., then a coffee
//   (a white cup, the real TWO MIN mark) lands on the windscreen in slow motion   8 Fintech Boulevard: flat out, a
//   drift, the police; Ended too soon? / Drive it for yourself + the address; black, the address stays, centred.
//   node buildC4.mjs -> story-c4-en.json   (plates: platesC2.json as v2/v3, platesC4.json: renderC4 + platesC4)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, path as shp, rng, C } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H, bake } from "./build.mjs";
import { cam, titleCard, urlPill, grain, grainPlates } from "./kit2.mjs";
import { INK, EXPO, reveal, typed, chip, rule, shade, tw, monoW } from "./kit3.mjs";
import { SHOTS as S2 } from "./chase2.mjs";
import { SHOTS as S4 } from "./chase4.mjs";
import { SHOTS as S5 } from "./chase5.mjs";
import { loadCards, drawCard, moveLayers } from "../../cards/cards.mjs";
const KC = await loadCards();
import { path as shpS, poly } from "../../../lottie-ui/_source/lib/ui.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const P2 = JSON.parse(fs.readFileSync(path.join(here, "platesC2.json"), "utf8")), P4 = JSON.parse(fs.readFileSync(path.join(here, "platesC4.json"), "utf8")), P5 = JSON.parse(fs.readFileSync(path.join(here, "platesC5.json"), "utf8"));
const P6 = JSON.parse(fs.readFileSync(path.join(here, "platesC6.json"), "utf8"));
const PL = { ...P2.plates, ...P4.plates, ...P5.plates, ...P6.plates }, X2 = P2.shots, X4 = P4.shots, X5 = P5.shots, X6 = P6.shots, none = { yellow: [], cop: [] };
// the shots by their names in this story (the new ones from chase4/platesC4, the kept ones from v2's renders)
const SHOTS = { olari: S2.olari, palace: S5.palace5, steam: S2.steam, berero: S5.berero6, fountain: S2.fountain, scf: S2.scf, corner: S2.corner, cup: S5.sidewin, ftPass: S5.ftPass, ftAway: S5.ftAway, ft4: S4.fintech4 };
const P = { plates: PL, shots: {
  olari: { ...X2.olari, plate: X6.olari.plate }, palace: X6.palace5, steam: { ...X2.steam, plate: X6.steam.plate }, berero: X6.berero6, fountain: { ...X2.fountain, plate: X6.fountain.plate, water: X4.fountain.water },
  scf: { ...X2.scf, plate: X6.scf.plate }, corner: { ...X2.corner, plate: X6.corner.plate }, cup: X6.sidewin, ftPass: X6.ftPass, ftAway: X6.ftAway, ft4: { ...X4.fintech4, plate: X6.fintech4.plate } } };
const MARKS = JSON.parse(fs.readFileSync(path.join(here, "tm-marks.json"), "utf8"));
await grainPlates(PL);
const RED = "#FF3348", BLUE = "#3C78FF", K = 0.5;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sm = (t) => t * t * (3 - 2 * t);
const COPY = {
  en: { slug: "CROMATIC CITY · 23:47", olari: ["Olari 9."], landmarks: ["City", "landmarks."], events: "Event locations.", coffee: ["Coffee", "hopping."], fountain: ["Down to earth,", "up for fun."],
    scfLead: "You should take it", scf: "SLOW", scfTag: "SLOW COFFEE FESTIVAL", tm: ["You always have", "two minutes."], soon: "Ended too soon?", drive: "Drive it for yourself." }
};
// the clock (frames at 60): each shot's span in the story
// (Iris's C_long x2; "cup" is the side window now; Fintech in three: past the kerb, away, head on)
const T5 = { olari: [0, 162], palace: [162, 282], steam: [282, 370], berero: [370, 450], fountain: [450, 660], scf: [660, 828], corner: [828, 912], cup: [912, 1080], ftPass: [1080, 1140], ftAway: [1140, 1200], ft4: [1200, 1502], end: [1502, 1640] };
// (C6: the interior first, 2.2 s; then C5's clock, 132 frames later)
const INT = 132, T = { interior: [0, INT], ...Object.fromEntries(Object.entries(T5).map(([k, [a, b]]) => [k, [a + INT, b + INT]])) };
const SHOT_KEYS = Object.keys(T).filter((k) => k !== "end" && k !== "interior");
const TC = { ...T, fintech: [T.ftPass[0], T.ft4[1]] }; // (the cards' clock: Fintech is one place)
const F = 1640 + INT;

function asset(Cm, name) { const m = PL[name]; if (!m) throw new Error("no plate " + name); if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; } return m; }
const sh = (k) => SHOTS[k], so = (k) => P.shots[k].o;
const Pk = {}; for (const k of Object.keys(P.shots)) Pk[k] = cam(so(k)); // (the shots' projectors)
// a car's rear wheels and front corners (logical) from its pose
const corners = (q, fwd, side, y = 0) => { const f = [Math.sin(q.yaw), Math.cos(q.yaw)], r = [Math.cos(q.yaw), -Math.sin(q.yaw)]; return [-1, 1].map((sd) => [q.x + f[0] * fwd + r[0] * sd * side, y, q.z + f[1] * fwd + r[1] * sd * side]); };

function storyC2(lang) {
  const c = COPY[lang], Cm = new Comp({ w: W, h: H, dur: F / 60, nm: `Cromatic · story C v6 · the chase · ${lang}` });
  const nulls = {};
  // ---- each shot's null: plate px -> story px, with its move (pan, crash zoom, roll, shake, whips in and out)
  const whips = { olari: { out: 1 }, palace: { in: 1 }, steam: { out: 1 }, berero: { in: 1, out: 1 }, fountain: { in: 1 }, cup: { out: 1 }, ftPass: { in: 1 } };
  const W2 = 12; // (a whip: 6 frames out, 6 in)
  const shakeAt = (f, amp) => [amp * Math.sin(f * 1.7) * Math.sin(f * 0.37), amp * Math.cos(f * 1.3) * Math.sin(f * 0.29)];
  // each shot's move as a null over its plate (plate px -> story px: p + s * (x - a), turned by r about a)
  const MID = [1080, 1920], SMID = [W / 2, H / 2];
  const xform = {
    olari: (f) => { const t = (f - T.olari[0]) / 60, near = Math.exp(-Math.max(0, t - 2.35) * 6) * (t > 2.3 ? 1 : 0), sk = shakeAt(f, 2 + 18 * near); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50, r: 0 }; },
    palace: (f) => { const sk = shakeAt(f, 2); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50 + 2 * ((f - T.palace[0]) / 75), r: 0 }; },
    steam: (f) => { const t = (f - T.steam[0]) / 60, q = sh("steam").yellow(Math.max(0, t - 0.1)), x = Pk.steam([q.x, 4, q.z])[0], w = so("steam").w, off = clamp(x - 1080, 1250, 2650); return { a: [1080 + off, 1700], p: SMID, s: 58, r: 0 }; },
    fountain: (f) => { const t = (f - T.fountain[0]) / 60, z = sm(clamp((t - 0.98) / 0.09)) * (1 - sm(clamp((t - 1.75) / 0.7))), q = sh("fountain").yellow(Math.min(t, 1.2)), c = Pk.fountain([q.x, 3, q.z]); const fx = lerp(MID[0], c[0], Math.min(1, z * 3)), fy = lerp(MID[1], c[1], Math.min(1, z * 3)); return { a: [fx, fy], p: [lerp(fx * K, W / 2, 0.55 * z), lerp(fy * K, H * 0.53, 0.55 * z)], s: 50 * (1 + 1.4 * z), r: 0 }; },
    berero: (f) => { const t = (f - T.berero[0]) / 60, sk = shakeAt(f, 2.5); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50 + 2.5 * t, r: 0 }; },
    cup: (f) => { const t = (f - T.cup[0]) / 60, sk = shakeAt(f, 1.2); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: lerp(50, 53, sm(clamp(t / 2.8))), r: lerp(-1, 1.2, sm(clamp(t / 2.8))) }; },
    ftPass: (f) => { const sk = shakeAt(f, 2.5); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50, r: 0 }; },
    ftAway: (f) => { const t = (f - T.ftAway[0]) / 60; return { a: MID, p: SMID, s: 50 * lerp(1, 1.06, t), r: lerp(1.5, -1.5, t) }; },
    scf: (f) => { const t = (f - T.scf[0]) / 60, sk = shakeAt(f, 3 + 16 * Math.exp(-Math.abs(t - 0.45) * 8)); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50, r: 0 }; },
    corner: (f) => { const t = (f - T.corner[0]) / 60; return { a: MID, p: SMID, s: 50 * lerp(1, 1.12, t / 1.4), r: lerp(-4, 6, t / 1.4) }; },
    ft4: (f) => { const t = (f - T.ft4[0]) / 60, sk = shakeAt(f, 1.6); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50 * lerp(1, 1.07, clamp(t / 6.7)), r: 0 }; }
  };
  for (const k of Object.keys(T)) {
    if (k === "end" || k === "interior") continue;
    const [a, b] = T[k], wh = whips[k] || {};
    const ks = bake(a, b, (f) => {
      const x = xform[k](f);
      // whips: out to the left over the last 6 frames, in from the right over the first 6
      let wx = 0;
      if (wh.out && f > b - W2 / 2) wx = -W * 1.25 * Math.pow((f - (b - W2 / 2)) / (W2 / 2), 2);
      if (wh.in && f < a + W2 / 2) wx = W * 1.25 * Math.pow(1 - (f - a) / (W2 / 2), 2);
      return { a: x.a, p: [x.p[0] + wx, x.p[1]], s: [x.s, x.s], r: x.r };
    });
    nulls[k] = Cm.nul(`shot · ${k}`, { ip: a, op: b, ks: { a: ks.a, p: ks.p, s: ks.s, r: ks.r } });
  }

  // ---- top: Iris's end (c9: "Drive it for yourself." over the pill; c10: black under the same pill, the settle), the
  // grain; then her cards c1-c8 where the words were (over the shots, under the grain)
  const card = (id, t) => { const { __T, ...src } = KC.card(id), cc = JSON.parse(JSON.stringify(src)); cc.__T = KC.T; if (t) Object.assign(cc.timing.cues, t); return cc; };
  drawCard(Cm, card("c9-drive", { in: "ft4+122", urlIn: "ft4+127" }), TC);
  grain(Cm, asset, { o: 34, F });
  // (Daniel: no word may leak into the next shot: a card's layers end at its last shot's cut, and its out starts early
  // enough to be over by then)
  const clip = (r, shot) => { for (const L of [...r.layers, ...r.behind]) L.op = Math.min(L.op, T[shot][1]); return r; };
  clip(drawCard(Cm, card("c1-olari"), TC), "olari");
  clip(drawCard(Cm, card("c2-landmarks", { out: "palace.end-13" }), TC), "palace");
  clip(drawCard(Cm, card("c3-coffee", { out: "berero.end-12" }), TC), "berero");
  clip(drawCard(Cm, card("c4-fountain", { out: "fountain.end-13" }), TC), "fountain");
  clip(drawCard(Cm, card("c6-two-minutes", { out: "cup.end-13" }), TC), "cup");
  clip(drawCard(Cm, card("c7-fintech", { in: "ftPass+6", out: "ftAway.end-8" }), TC), "ftAway");
  clip(drawCard(Cm, card("c8-soon", { in: "ft4+72", out: "ft4+114" }), TC), "ft4");
  const slow = clip(drawCard(Cm, card("c5-slow", { out: "scf.end-10" }), TC), "scf");
  // the vignette under the words (they stay at full strength at the frame's edges)
  Cm.shape("vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.08, H * 0.5], stops: [[0, "#000000"], [1, "#000000"]], alphas: [[0, 0], [0.5, 0], [1, 0.62]] })])], { ip: 0, op: F });
  // ---- the shots, last first (the stack: the first added is on top)
  // 8c · Fintech Boulevard head on: the police lamps (on the roof, on the road, over the frame), the cars
  {
    const k = "ft4", [a, b] = T[k], N = nulls[k], S = sh(k), Pp = Pk[k], dur = S.dur, tl = (f) => (f - a) / 60;
    const copPic = (t) => { const i = Math.min(Math.round(t * 30), P.shots[k].sprites.cop.length - 1); return S.cop(Math.min(t, dur)); };
    const beat = (t) => Math.floor((t * 1000) / 190) % 2;
    const tOn = 1.6;
    for (const [col, bb] of [[RED, 0], [BLUE, 1]]) {
      const beats = []; for (let f = a + tOn * 60; f <= b; f++) { const on = beat(tl(f)) === bb; if (!beats.length || beats[beats.length - 1][1] !== (on ? 100 : 0)) beats.push([f, on ? 100 : 0, E.hold]); }
      const roof = bake(a + tOn * 60, b, (f) => { const q = copPic(tl(f)); if (!q) return { p: [-999, -999], s: [0, 0] }; const r = Pp([q.x + (bb ? 2.5 : -2.5), 12.5, q.z]), d = Math.max(20, r[2]), sc = clamp(150 / d, 0.15, 1.2) * 100; return { p: [r[0], r[1]], s: [sc, sc] }; });
      const g = Cm.shape(`police · lamp ${bb ? "blue" : "red"}`, [group("g", [ellipse([700, 700], [0, 0]), gfill({ type: 2, s: [0, 0], e: [350, 0], stops: [[0, "#FFFFFF"], [0.12, col], [1, col]], alphas: [[0, 1], [0.12, 0.85], [1, 0]] })])], { parent: N, ip: a + tOn * 60, op: b, ks: { p: roof.p, s: roof.s, o: beats } }); g.bm = 2;
      const wash = Cm.shape(`police · wash ${bb ? "blue" : "red"}`, [group("w", [rect([W * 1.4, H * 1.1], [bb ? W * 0.8 : W * 0.2, H * 0.55]), gfill({ type: 2, s: [bb ? W * 0.85 : W * 0.15, H * 0.5], e: [bb ? W * 1.7 : -W * 0.7, H * 0.5], stops: [[0, col], [1, col]], alphas: [[0, 0.55], [1, 0]] })])], { ip: a + tOn * 60, op: b, ks: { o: beats.map(([f, v, e]) => [f, v ? Math.round(100 * clamp((tl(f) - tOn) / 2.0, 0.2, 1)) : 0, e]) } }); wash.bm = 2;
    }
    carFrames(Cm, k, N, a, b, "yellow"); carFrames(Cm, k, N, a, b, "cop", true);
    plateLayer(Cm, k, N, a, b);
  }
  // 8b, 8a · Fintech Boulevard from above and behind (away), from the kerb (past): the ride, its headlights on the road
  for (const k of ["ftAway", "ftPass"]) { const [a, b] = T[k], N = nulls[k]; carFrames(Cm, k, N, a, b, "yellow"); headlightsSweep(Cm, k, N, a, b); plateLayer(Cm, k, N, a, b); }
  // 7b · the side window, in slow motion: the ride drifting at the lens (its smoke slowed with it), the coffee flying
  // in through the open window (in the car's sprites: rendered in the car's own frame)
  { const k = "cup", [a, b] = T[k], N = nulls[k]; smoke(Cm, k, N, a, 2.8, 0.55, null, 4); carFrames(Cm, k, N, a, b, "yellow"); plateLayer(Cm, k, N, a, b); }
  // 6 · the Two Minutes corner from above: the drift's smoke and marks, the place painted on the road
  {
    const k = "corner", [a, b] = T[k], N = nulls[k];
    smoke(Cm, k, N, a, 1.4, 3);
    carFrames(Cm, k, N, a, b, "yellow");
    marks(Cm, k, N, a, 1.4);
    plateLayer(Cm, k, N, a, b);
  }
  // 5 · the Slow Coffee Festival's dome: SLOW painted on the avenue, the ride over it, fast
  {
    const k = "scf", [a, b] = T[k], N = nulls[k], camO = so(k), cpos = camO.pos, fwd = (() => { const dx = camO.tgt[0] - cpos[0], dz = camO.tgt[2] - cpos[2], n = Math.hypot(dx, dz); return [dx / n, dz / n]; })(), right = [-fwd[1], fwd[0]];
    carFrames(Cm, k, N, a, b, "yellow");
    plateLayer(Cm, k, N, a, b);
    // SLOW (Iris's c5: smash cut, on the dark plaza) behind the ride: over the plate, under the car
    moveLayers(Cm, slow.behind, "scf · plate");
  }
  // 4 · the fountain: smoke and marks of the drift, the crash zoom (the null), the car
  {
    const k = "fountain", [a, b] = T[k], N = nulls[k];
    smoke(Cm, k, N, a, 1.7, 2.4);
    carFrames(Cm, k, N, a, b, "yellow");
    marks(Cm, k, N, a, 1.7);
    // the water, frame by frame (30 a second), over the plate, under the ride
    // (v5: held 3.5 s: the frames go there and back, so the jets never jump)
    const Wf = P.shots[k].water, n = Wf.length, pp = (i) => { const m = i % (2 * n - 2); return m < n ? m : 2 * n - 2 - m; };
    for (let i = 0, f0 = a; f0 < b; i++, f0 += 2) { const name = Wf[pp(i)], m = asset(Cm, name); Cm.image(`${k} · water ${i}`, name, { parent: N, ip: f0, op: Math.min(b, f0 + 2), ks: { p: [m.x, m.y] } }); }
    plateLayer(Cm, k, N, a, b);
  }
  // 4 · past Casa Berero, its sign lit: the ride tears through between it and the lens
  { const k = "berero", [a, b] = T[k], N = nulls[k]; headlightsSweep(Cm, k, N, a, b); carFrames(Cm, k, N, a, b, "yellow"); plateLayer(Cm, k, N, a, b); }
  // 3 · Steam: the pan follows the ride
  { const k = "steam", [a, b] = T[k], N = nulls[k]; headlightsSweep(Cm, k, N, a, b); carFrames(Cm, k, N, a, b, "yellow"); plateLayer(Cm, k, N, a, b); }
  // 2 · the Aesthetic Court from its gate, in warm light: the ride crosses the esplanade close to the lens
  {
    const k = "palace", [a, b] = T[k], N = nulls[k], S = sh(k);
    carFrames(Cm, k, N, a, b, "yellow");
    plateLayer(Cm, k, N, a, b);
  }
  // 1 · Olari 9: the engine catches (exhaust), the headlights come on (a flare, OLARI 9 on the stones in their light),
  // the launch (wheelspin smoke), past the lens
  {
    const k = "olari", [a, b] = T[k], N = nulls[k], S = sh(k), Pp = Pk[k];
    // the flare: two hot points and an anamorphic streak at the headlights, when they come on
    const tOn = a; // (C6: the engine started inside: the lights are on from the cut)
    for (const side of [0, 1]) {
      const fl = bake(tOn, b, (f) => { const q = S.yellow((f - a) / 60), hl = corners(q, 10.5, 3.6, 4.3)[side], r = Pp(hl), d = Math.max(4, r[2]), sc = clamp(90 / d, 0.2, 3) * 100; return { p: [r[0], r[1]], s: [sc, sc] }; });
      const L = Cm.shape(`olari · headlight ${side}`, [group("streak", [ellipse([1500, 34], [0, 0]), gfill({ type: 2, s: [0, 0], e: [750, 0], stops: [[0, "#E6F0FF"], [1, "#9DBBFF"]], alphas: [[0, 0.75], [1, 0]] })]), group("core", [ellipse([150, 150], [0, 0]), gfill({ type: 2, s: [0, 0], e: [75, 0], stops: [[0, "#FFFFFF"], [1, "#FFF2D8"]], alphas: [[0, 1], [1, 0]] })])], { parent: N, ip: tOn, op: b, ks: { p: fl.p, s: fl.s, o: [[tOn, 0, E.hold], [tOn + 1, 100, E.hold], [tOn + 4, 30, E.hold], [tOn + 6, 100]] } });
      L.bm = 2;
    }
    // the exhaust's cough when the engine catches, the wheelspin's smoke at the launch
    if (0) puffs(Cm, N, a + 42, 5, (j) => { const q = S.yellow(0.7), r = corners(q, -10, 2.5, 3)[0]; return Pp([r[0] + (j - 2) * 1.5, 3 + j * 0.8, r[2]]); }, { r0: 18, r1: 120, life: 70, col: "#BFC3D6", a0: 0.5 });
    smoke(Cm, k, N, a, 2.2, 2.2, 1.35);
    carFrames(Cm, k, N, a, b, "yellow");
    // the ground lit in front of the car once the lights are on
    const pool = bake(tOn, b, (f) => { const q = S.yellow((f - a) / 60), c0 = corners(q, 26, 0, 0)[0], r = Pp(c0), d0 = Math.max(4, r[2]), sc = clamp(60 / d0, 0.2, 4) * 100; return { p: [r[0], r[1]], s: [sc * 1.6, sc * 0.55] }; });
    const pl = Cm.shape("olari · light pool", [group("p", [ellipse([600, 600], [0, 0]), gfill({ type: 2, s: [0, 0], e: [300, 0], stops: [[0, "#FFE7BF"], [1, "#FFE7BF"]], alphas: [[0, 0.5], [1, 0]] })])], { parent: N, ip: tOn, op: b, ks: { p: pool.p, s: pool.s, o: [[tOn, 0, E.linear], [tOn + 6, 100]] } });
    pl.bm = 2;
    plateLayer(Cm, k, N, a, b);
  }
  // 0 · inside the 1300: the stereo (renderV6 JOB=c6dash, 30 a second: each frame held 2)
  {
    const [a, b] = T.interior, n = fs.readdirSync(path.join(OUT, "frames/c6")).filter((f) => /^int-\d{3}\.webp$/.test(f)).length;
    for (let i = 0; i < n; i++) { const f0 = a + i * 2; if (f0 >= b) break; const name = "int-" + String(i).padStart(3, "0"); if (!Cm.assets.find((x) => x.id === name)) { Cm.asset(name, W, H, name + ".webp"); Cm.assets[Cm.assets.length - 1].u = "frames/c6/"; } Cm.image(`interior · ${i}`, name, { ip: f0, op: Math.min(b, f0 + 2) }); }
  }
  Cm.shape("night", [group("n", [rect([W, H], [W / 2, H / 2]), fill(rgb("#05060C"))])]);
  const j = Cm.json(); j.cromatic = { story: "C v6 (Daniel's notes on v5, Iris's cards; the interior, the 4.4 plates)", lang, dur: F / 60, shots: T };
  return j;

  // ---- helpers (hoisted)
  function plateLayer(Cm, k, N, a, b) {
    const name = P.shots[k].plate, m = asset(Cm, name);
    Cm.image(`${k} · plate`, name, { parent: N, ip: a, op: b, ks: { p: [m.x, m.y] } });
    // whips: the plate smeared sideways while it flies (three copies, fainter, offset)
    const wh = whips[k] || {};
    for (const [dx, o] of [[90, 45], [190, 28], [300, 14]]) {
      if (wh.out) Cm.image(`${k} · smear out ${dx}`, name, { parent: N, ip: b - W2 / 2, op: b, ks: { p: [m.x + dx, m.y], o } });
      if (wh.in) Cm.image(`${k} · smear in ${dx}`, name, { parent: N, ip: a, op: a + W2 / 2, ks: { p: [m.x - dx, m.y], o } });
    }
  }
  function carFrames(Cm, k, N, a, b, car, hold) {
    const list = P.shots[k].sprites[car]; let last = null;
    for (let i = 0; i < list.length; i++) {
      const name = list[i]; if (!name) continue; const m = asset(Cm, name), f0 = a + i * 2; if (f0 >= b) break;
      Cm.image(`${k} · ${car} · ${i}`, name, { parent: N, ip: f0, op: Math.min(b, f0 + 2), ks: { p: [m.x, m.y] } }); last = i;
    }
    // past the rendered frames: the last two (the police lamps' beat) alternate, the ride's last stands
    if (last != null && a + (last + 1) * 2 < b) {
      for (let f = a + (last + 1) * 2, n = 0; f < b; f += 2, n++) {
        const name = hold ? list[last - ((Math.floor(((f - a) / 60) * 1000 / 190) + last) % 2)] : list[last], m = asset(Cm, name);
        Cm.image(`${k} · ${car} · held ${n}`, name, { parent: N, ip: f, op: Math.min(b, f + 2), ks: { p: [m.x, m.y] } });
      }
    }
  }
  function puffs(Cm, N, t0, n, at, { r0 = 20, r1 = 90, life = 50, col = "#E8ECFF", a0 = 0.55, rise = 60, seed = 3 } = {}) {
    const R = rng(seed), groups = [];
    for (let j = 0; j < n; j++) {
      const p0 = at(j), f0 = t0 + j * 2, l = life + Math.round(R() * 16);
      groups.push(group(`puff ${j}`, [ellipse([2, 2], [0, 0]), gfill({ type: 2, s: [0, 0], e: [1, 0], stops: [[0, col], [1, col]], alphas: [[0, a0], [1, 0]] })], {
        p: [[f0, [p0[0], p0[1]], E.out], [f0 + l, [p0[0] + (R() - 0.5) * rise * 2, p0[1] - rise * (0.6 + R())]]], s: [[f0, [r0 * 100, r0 * 100], E.out], [f0 + l, [r1 * 100, r1 * 100]]], o: [[0, 0, E.hold], [f0, 100, E.linear], [f0 + l, 0]]
      }));
    }
    Cm.shape(`puffs · ${t0}`, groups, { parent: N, ip: t0, op: t0 + n * 2 + life + 20 });
  }
  // tyre smoke from the rear wheels while the car slides (or spins its wheels from tSpin)
  function smoke(Cm, k, N, a, dur, scale = 2, tSpin, slowK = 1) {
    const S = sh(k), Pp = Pk[k], R = rng(k.length * 7), groups = [];
    for (let i = 0; i < dur * 30; i += 1) {
      const t = i / 30, q = S.yellow(t); if (!q) continue;
      const on = q.slide || (tSpin != null && t > tSpin && t < tSpin + 0.45); if (!on) continue;
      for (const w of corners(q, -8.6, 4.6, 0)) {
        const r = Pp(w); if (r[2] < 3) continue;
        const pxu = Pp.f / r[2], f0 = a + i * 2, l = Math.round((46 + R() * 20) * slowK), r0 = 2.6 * pxu * scale / 2, r1 = (8 + R() * 5) * pxu * scale / 2;
        groups.push(group(`puff ${i}`, [ellipse([2, 2], [0, 0]), gfill({ type: 2, s: [0, 0], e: [1, 0], stops: [[0, "#DDE3F5"], [1, "#DDE3F5"]], alphas: [[0, 0.5], [1, 0]] })], {
          p: [[f0, [r[0], r[1]], E.out], [f0 + l, [r[0] + (R() - 0.5) * 24 * pxu, r[1] - (6 + R() * 6) * pxu]]], s: [[f0, [r0 * 100, r0 * 100], E.out], [f0 + l, [r1 * 100, r1 * 100]]], o: [[0, 0, E.hold], [f0, 90, E.linear], [f0 + l, 0]]
        }));
      }
    }
    if (groups.length) Cm.shape(`${k} · smoke`, groups, { parent: N, ip: a, op: Math.min(T[k][1], a + dur * 60 + 80 * slowK) });
  }
  // skid marks: a strip per rear wheel while it slides, drawn as it goes (projected, so they lie in the road)
  function marks(Cm, k, N, a, dur) {
    const S = sh(k), Pp = Pk[k];
    const samples = []; for (let i = 0; i < dur * 30; i++) { const q = S.yellow(i / 30); if (q && q.slide) samples.push(i); }
    if (samples.length < 3) return;
    for (const side of [0, 1]) {
      const pts = samples.map((i) => corners(S.yellow(i / 30), -8.6, 4.6, 0)[side]);
      const strip = (n) => { const L = [], Rr = []; for (let j = 0; j < pts.length; j++) { const p = pts[Math.min(j, n - 1)], p2 = pts[Math.min(j + 1, pts.length - 1)], dx = p2[0] - p[0], dz = p2[2] - p[2], dl = Math.hypot(dx, dz) || 1, nx = -dz / dl * 1.1, nz = dx / dl * 1.1; const a1 = Pp([p[0] + nx, 0, p[2] + nz]), b1 = Pp([p[0] - nx, 0, p[2] - nz]); L.push([+a1[0].toFixed(1), +a1[1].toFixed(1)]); Rr.push([+b1[0].toFixed(1), +b1[1].toFixed(1)]); } const v = [...L, ...Rr.reverse()]; return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) }; };
      const keys = samples.map((i, j) => [a + i * 2, strip(j + 1), E.linear]); keys[keys.length - 1] = [keys[keys.length - 1][0], keys[keys.length - 1][1]];
      Cm.shape(`${k} · marks ${side}`, [group("m", [shp(keys), fill(rgb("#120A10"), 66)])], { parent: N, ip: keys[0][0], op: a + dur * 60 + 2 });
    }
  }
  // the headlights' sweep on the street (Steam): a warm light moving ahead of the car on the road
  function headlightsSweep(Cm, k, N, a, b) {
    const S = sh(k), Pp = Pk[k];
    const pos = bake(a, b, (f) => { const q = S.yellow((f - a) / 60), c0 = corners(q, 28, 0, 0)[0], r = Pp(c0), d0 = Math.max(4, r[2]), sc = clamp(80 / d0, 0.2, 3) * 100; return { p: [r[0], r[1]], s: [sc * 1.8, sc * 0.6] }; });
    const L = Cm.shape(`${k} · headlights on the road`, [group("p", [ellipse([600, 600], [0, 0]), gfill({ type: 2, s: [0, 0], e: [300, 0], stops: [[0, "#FFE4B8"], [1, "#FFE4B8"]], alphas: [[0, 0.45], [1, 0]] })])], { parent: N, ip: a, op: b, ks: { p: pos.p, s: pos.s } });
    L.bm = 2;
  }
}

const sizes = {};
for (const lang of ["en"]) {
  const j = storyC2(lang), s = JSON.stringify(j);
  fs.writeFileSync(path.join(OUT, `story-c6-${lang}.json`), s);
  sizes[`story-c6-${lang}`] = { kb: +(s.length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, images: j.assets.length };
}
console.table(sizes);
