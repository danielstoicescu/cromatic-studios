// Cromatic · stories in Lottie · story C v3 (TASK-065b): the chase through the city, at night, English only. The
// shots, cameras and grain of v2 as they were; the words back ON the screen (the v3 gate: the word rendered into the
// engine's scene did not pass), set as film titles: a slug typed on, a numbered super per place (a chip the size of
// its number, the name rising out of its baseline), SLOW as one giant word the ride tears past in front of, the
// consequences as a title in the police lamps' two colours; the title card and the address on its own at the end.
//   node buildC3.mjs -> story-c3-en.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, path as shp, rng, C } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H, bake } from "./build.mjs";
import { cam, titleCard, urlPill, grain, grainPlates } from "./kit2.mjs";
import { INK, EXPO, reveal, typed, chip, rule, shade, tw, monoW } from "./kit3.mjs";
import { SHOTS } from "./chase2.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const P = JSON.parse(fs.readFileSync(path.join(here, "platesC2.json"), "utf8")), PL = P.plates;
await grainPlates(PL);
const RED = "#FF3348", BLUE = "#3C78FF", K = 0.5;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sm = (t) => t * t * (3 - 2 * t);
const COPY = {
  en: { slug: "CROMATIC CITY · 23:47", places: { olari: ["Olari 9."], palace: ["Casa", "Poporului."], steam: ["Steam."], fountain: "THE FOUNTAIN", scf: "SLOW", scfTag: "SLOW COFFEE FESTIVAL", corner: ["Two", "Minutes."], fintech: ["Fintech Blvd."] }, caught: "CAUGHT", msg: ["GO TOO FAR.", "Expect", "consequences."], end: [["Your", null], ["turn.", "turn"]], kicker: "THE CHASE IS ON THE MAP" }
};
// the clock (frames at 60): each shot's span in the story
const T = { olari: [0, 162], palace: [162, 237], steam: [237, 327], fountain: [327, 429], scf: [429, 480], corner: [480, 564], fintech: [564, 968], end: [960, 1200] };
const F = 1200;

function asset(Cm, name) { const m = PL[name]; if (!m) throw new Error("no plate " + name); if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; } return m; }
const sh = (k) => SHOTS[k], so = (k) => P.shots[k].o;
const Pk = {}; for (const k of Object.keys(P.shots)) Pk[k] = cam(so(k)); // (the shots' projectors)
// a car's rear wheels and front corners (logical) from its pose
const corners = (q, fwd, side, y = 0) => { const f = [Math.sin(q.yaw), Math.cos(q.yaw)], r = [Math.cos(q.yaw), -Math.sin(q.yaw)]; return [-1, 1].map((sd) => [q.x + f[0] * fwd + r[0] * sd * side, y, q.z + f[1] * fwd + r[1] * sd * side]); };

function storyC2(lang) {
  const c = COPY[lang], Cm = new Comp({ w: W, h: H, dur: F / 60, nm: `Cromatic · story C v3 · the chase · ${lang}` });
  const nulls = {};
  // ---- each shot's null: plate px -> story px, with its move (pan, crash zoom, roll, shake, whips in and out)
  const whips = { olari: { out: 1 }, palace: { in: 1 }, steam: { out: 1 }, fountain: { in: 1 }, corner: { out: 1 }, fintech: { in: 1 } };
  const W2 = 12; // (a whip: 6 frames out, 6 in)
  const shakeAt = (f, amp) => [amp * Math.sin(f * 1.7) * Math.sin(f * 0.37), amp * Math.cos(f * 1.3) * Math.sin(f * 0.29)];
  // each shot's move as a null over its plate (plate px -> story px: p + s * (x - a), turned by r about a)
  const MID = [1080, 1920], SMID = [W / 2, H / 2];
  const xform = {
    olari: (f) => { const t = (f - T.olari[0]) / 60, near = Math.exp(-Math.max(0, t - 2.35) * 6) * (t > 2.3 ? 1 : 0), sk = shakeAt(f, 2 + 18 * near); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50, r: 0 }; },
    palace: (f) => { const sk = shakeAt(f, 2); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50 + 2 * ((f - T.palace[0]) / 75), r: 0 }; },
    steam: (f) => { const t = (f - T.steam[0]) / 60, q = sh("steam").yellow(Math.max(0, t - 0.1)), x = Pk.steam([q.x, 4, q.z])[0], w = so("steam").w, off = clamp(x - 1080, 1250, 2650); return { a: [1080 + off, 1700], p: SMID, s: 58, r: 0 }; },
    fountain: (f) => { const t = (f - T.fountain[0]) / 60, z = sm(clamp((t - 0.98) / 0.09)), q = sh("fountain").yellow(Math.min(t, 1.2)), c = Pk.fountain([q.x, 3, q.z]); const fx = lerp(MID[0], c[0], Math.min(1, z * 3)), fy = lerp(MID[1], c[1], Math.min(1, z * 3)); return { a: [fx, fy], p: [lerp(fx * K, W / 2, 0.55 * z), lerp(fy * K, H * 0.53, 0.55 * z)], s: 50 * (1 + 1.4 * z), r: 0 }; },
    scf: (f) => { const t = (f - T.scf[0]) / 60, sk = shakeAt(f, 3 + 16 * Math.exp(-Math.abs(t - 0.45) * 8)); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50, r: 0 }; },
    corner: (f) => { const t = (f - T.corner[0]) / 60; return { a: MID, p: SMID, s: 50 * lerp(1, 1.12, t / 1.4), r: lerp(-4, 6, t / 1.4) }; },
    fintech: (f) => { const t = (f - T.fintech[0]) / 60, sk = shakeAt(f, 1.6); return { a: MID, p: [SMID[0] + sk[0], SMID[1] + sk[1]], s: 50 * lerp(1, 1.07, clamp(t / 6.7)), r: 0 }; }
  };
  for (const k of Object.keys(T)) {
    if (k === "end") continue;
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

  // ---- top: grain, the vignette, the end
  grain(Cm, asset, { o: 34, F });
  // the end: a title card with attitude, and the address on its own, tilted, held
  urlPill(Cm, { t0: T.end[0] + 34, t1: F, x: W / 2 + 40, y: 1380, rot: -7 });
  titleCard(Cm, { t0: T.end[0], t1: F, lines: c.end, size: 250, bg: "#0A0A0A", ink: C.yellow, emphInk: C.white, kicker: c.kicker, x: 80, y: 760 });

  // ---- the words, on the screen: over the shots, under the grain (v3)
  // a numbered super: the place's number on a chip its size (and a mono tag after it), the name rising out of its
  // baseline line by line; left or right aligned; a scrim under it on the busy frames
  const chipW = (text, size = 26) => monoW(text, size, 0.16) + 2 * 0.62 * size;
  function superTitle({ idx, tag, lines, x, by, size, align = "left", t0, tOut, lead = 0.96, nm, scrim = true }) {
    const num = `${String(idx).padStart(2, "0")}/07`, cw = chipW(num), byC = by - size * 0.72 - 44;
    const cx = align === "right" ? x - cw : x;
    chip(Cm, { text: num, x: cx, by: byC, t0, tOut, nm: `${nm} · number` });
    if (tag) typed(Cm, { text: tag, size: 26, x: align === "right" ? cx - 18 : cx + cw + 18, by: byC, align, t0: t0 + 6, tOut, rate: 0.8, cursor: false, nm: `${nm} · tag`, o: 92 });
    lines.forEach((ln, i) => reveal(Cm, { text: ln, size, x, by: by + i * size * lead, align, t0: t0 + 4 + i * 5, tOut: tOut == null ? null : tOut + i * 2, nm: `${nm} · ${ln}` }));
    if (scrim) { const top = byC - 120, bot = by + (lines.length - 1) * size * lead + size * 0.6; if (by > H / 2) shade(Cm, { y0: top - 260, y1: H, t0: t0 - 4, t1: (tOut ?? F - 20) + 20, a: 0.55, nm: `${nm} · scrim` }); else shade(Cm, { y0: 0, y1: bot + 260, t0: t0 - 4, t1: (tOut ?? F - 20) + 20, a: 0.6, from: "top", nm: `${nm} · scrim` }); }
  }
  // 7 · Fintech Boulevard: the super, then the consequences as a title in the lamps' two colours
  {
    const [a, b] = T.fintech, tOn = 0.5, beat = (f) => Math.floor((((f - a) / 60) * 1000) / 190) % 2;
    const tM = [a + 176, a + 212, a + 236], tOut = b - 16;
    typed(Cm, { text: c.msg[0], size: 40, x: 74, by: 1170, t0: tM[0], tOut, rate: 1.2, nm: "message · go too far", tracking: 0.2 });
    reveal(Cm, { text: c.msg[1], size: 210, x: 66, by: 1400, t0: tM[1], tOut, stagger: 2, nm: "message · expect" });
    const S = Math.min(200, 944 / tw(c.msg[2], 1)), flick = []; for (let f = tM[2] + 20; f <= b; f++) { const v = beat(f); if (!flick.length || flick[flick.length - 1][2] !== v) flick.push([f, v ? "#7EA6FF" : "#FF5A6C", v]); }
    const inkKeys = [[0, INK, E.hold], ...flick.map(([f, col]) => [f, col, E.hold])]; inkKeys[inkKeys.length - 1] = [inkKeys[inkKeys.length - 1][0], inkKeys[inkKeys.length - 1][1]];
    reveal(Cm, { text: c.msg[2], size: S, x: 66, by: 1400 + S * 1.02, t0: tM[2], tOut, stagger: 1.2, ink: () => inkKeys, nm: "message · consequences" });
    shade(Cm, { y0: 900, y1: H, t0: tM[0] - 6, t1: b, a: 0.66, nm: "message · scrim" });
    superTitle({ idx: 7, tag: c.caught, lines: c.places.fintech, x: 70, by: 1560, size: 150, t0: a + 30, tOut: a + 150, nm: "fintech" });
  }
  // 6 · the Two Minutes corner, from above: top left, big
  superTitle({ idx: 6, lines: c.places.corner, x: 70, by: 480, size: 172, t0: T.corner[0] + 4, tOut: T.corner[1] - 18, nm: "corner" });
  // 5 · the Slow Coffee Festival: its number and name under the giant word (the word itself is behind the ride)
  { const [a, b] = T.scf, cw = chipW("05/07"), w = cw + 18 + monoW(c.places.scfTag, 26, 0.18), x0 = (W - w) / 2;
    chip(Cm, { text: "05/07", x: x0, by: 1356, t0: a + 2, tOut: b - 8, nm: "scf · number" });
    typed(Cm, { text: c.places.scfTag, size: 26, x: x0 + cw + 18, by: 1356, t0: a + 4, tOut: b - 8, rate: 0.5, cursor: false, nm: "scf · tag" }); }
  // 4 · the fountain: only its number and name, top left (the drift and the crash zoom are the shot)
  { const [a, b] = T.fountain, cw = chipW("04/07");
    chip(Cm, { text: "04/07", x: 72, by: 300, t0: a + 8, tOut: b - 14, nm: "fountain · number" });
    typed(Cm, { text: c.places.fountain, size: 26, x: 72 + cw + 18, by: 300, t0: a + 12, tOut: b - 14, rate: 1, nm: "fountain · tag" }); }
  // 3 · Steam: low right, big
  superTitle({ idx: 3, tag: "COFFEE SHOP", lines: c.places.steam, x: 1008, by: 1600, size: 210, align: "right", t0: T.steam[0] + 8, tOut: T.steam[1] - 16, nm: "steam" });
  // 2 · the palace: low right, two lines
  superTitle({ idx: 2, lines: c.places.palace, x: 1008, by: 1440, size: 150, align: "right", t0: T.palace[0] + 7, tOut: T.palace[1] - 15, nm: "palace" });
  // 1 · Olari 9: the slug typed at the top, the name low left when the lights come on
  typed(Cm, { text: c.slug, size: 30, x: 72, by: 300, t0: 12, tOut: 128, rate: 1.4, nm: "olari · slug" });
  superTitle({ idx: 1, lines: c.places.olari, x: 70, by: 1600, size: 200, t0: 64, tOut: 134, nm: "olari" });

  // the vignette under the words (they stay at full strength at the frame's edges)
  Cm.shape("vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.08, H * 0.5], stops: [[0, "#000000"], [1, "#000000"]], alphas: [[0, 0], [0.5, 0], [1, 0.62]] })])], { ip: 0, op: F });
  // ---- the shots, last first (the stack: the first added is on top)
  // 7 · Fintech Boulevard: the police lamps (on the roof, on the road, over the frame), the message in their light,
  // the place painted on the road, the cars
  {
    const k = "fintech", [a, b] = T[k], N = nulls[k], S = sh(k), Pp = Pk[k], dur = S.dur, tl = (f) => (f - a) / 60;
    const copPic = (t) => { const i = Math.min(Math.round(t * 30), P.shots[k].sprites.cop.length - 1); return S.cop(Math.min(t, dur)); };
    const beat = (t) => Math.floor((t * 1000) / 190) % 2;
    const tOn = 0.5;
    for (const [col, bb] of [[RED, 0], [BLUE, 1]]) {
      const beats = []; for (let f = a + tOn * 60; f <= b; f++) { const on = beat(tl(f)) === bb; if (!beats.length || beats[beats.length - 1][1] !== (on ? 100 : 0)) beats.push([f, on ? 100 : 0, E.hold]); }
      const roof = bake(a + tOn * 60, b, (f) => { const q = copPic(tl(f)); if (!q) return { p: [-999, -999], s: [0, 0] }; const r = Pp([q.x + (bb ? 2.5 : -2.5), 12.5, q.z]), d = Math.max(20, r[2]), sc = clamp(150 / d, 0.15, 1.2) * 100; return { p: [r[0], r[1]], s: [sc, sc] }; });
      const g = Cm.shape(`police · lamp ${bb ? "blue" : "red"}`, [group("g", [ellipse([700, 700], [0, 0]), gfill({ type: 2, s: [0, 0], e: [350, 0], stops: [[0, "#FFFFFF"], [0.12, col], [1, col]], alphas: [[0, 1], [0.12, 0.85], [1, 0]] })])], { parent: N, ip: a + tOn * 60, op: b, ks: { p: roof.p, s: roof.s, o: beats } }); g.bm = 2;
      const wash = Cm.shape(`police · wash ${bb ? "blue" : "red"}`, [group("w", [rect([W * 1.4, H * 1.1], [bb ? W * 0.8 : W * 0.2, H * 0.55]), gfill({ type: 2, s: [bb ? W * 0.85 : W * 0.15, H * 0.5], e: [bb ? W * 1.7 : -W * 0.7, H * 0.5], stops: [[0, col], [1, col]], alphas: [[0, 0.55], [1, 0]] })])], { ip: a + tOn * 60, op: b, ks: { o: beats.map(([f, v, e]) => [f, v ? Math.round(100 * clamp((tl(f) - tOn) / 2.0, 0.2, 1)) : 0, e]) } }); wash.bm = 2;
    }
    carFrames(Cm, k, N, a, b, "yellow"); carFrames(Cm, k, N, a, b, "cop", true);
    plateLayer(Cm, k, N, a, b);
  }
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
    // SLOW: one giant word, cut on with the shot, the ride tearing past in front of it (a title behind the subject)
    { const size = Math.min(360, 960 / tw(c.places.scf, 1, -0.05)), by = 1262;
      reveal(Cm, { text: c.places.scf, size, x: W / 2, by, align: "center", t0: a + 1, dur: 0, stagger: 0, tOut: b - 2, outDur: 0, outStagger: 0, tracking: -0.05, mask: false, nm: "scf · SLOW, behind the ride", ks: { a: [W / 2, by - size * 0.36], p: [W / 2, by - size * 0.36], s: [[a + 1, [107, 107], EXPO], [a + 12, [100, 100]]] } }); }
    plateLayer(Cm, k, N, a, b);
  }
  // 4 · the fountain: smoke and marks of the drift, the crash zoom (the null), the car
  {
    const k = "fountain", [a, b] = T[k], N = nulls[k];
    smoke(Cm, k, N, a, 1.7, 2.4);
    carFrames(Cm, k, N, a, b, "yellow");
    marks(Cm, k, N, a, 1.7);
    plateLayer(Cm, k, N, a, b);
  }
  // 3 · Steam: the pan follows the ride
  { const k = "steam", [a, b] = T[k], N = nulls[k]; headlightsSweep(Cm, k, N, a, b); carFrames(Cm, k, N, a, b, "yellow"); plateLayer(Cm, k, N, a, b); }
  // 2 · the palace through its gate: CASA POPORULUI written on the avenue as the headlights cross it
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
    const tOn = a + 60;
    for (const side of [0, 1]) {
      const fl = bake(tOn, b, (f) => { const q = S.yellow((f - a) / 60), hl = corners(q, 10.5, 3.6, 4.3)[side], r = Pp(hl), d = Math.max(4, r[2]), sc = clamp(90 / d, 0.2, 3) * 100; return { p: [r[0], r[1]], s: [sc, sc] }; });
      const L = Cm.shape(`olari · headlight ${side}`, [group("streak", [ellipse([1500, 34], [0, 0]), gfill({ type: 2, s: [0, 0], e: [750, 0], stops: [[0, "#E6F0FF"], [1, "#9DBBFF"]], alphas: [[0, 0.75], [1, 0]] })]), group("core", [ellipse([150, 150], [0, 0]), gfill({ type: 2, s: [0, 0], e: [75, 0], stops: [[0, "#FFFFFF"], [1, "#FFF2D8"]], alphas: [[0, 1], [1, 0]] })])], { parent: N, ip: tOn, op: b, ks: { p: fl.p, s: fl.s, o: [[tOn, 0, E.hold], [tOn + 1, 100, E.hold], [tOn + 4, 30, E.hold], [tOn + 6, 100]] } });
      L.bm = 2;
    }
    // the exhaust's cough when the engine catches, the wheelspin's smoke at the launch
    puffs(Cm, N, a + 42, 5, (j) => { const q = S.yellow(0.7), r = corners(q, -10, 2.5, 3)[0]; return Pp([r[0] + (j - 2) * 1.5, 3 + j * 0.8, r[2]]); }, { r0: 18, r1: 120, life: 70, col: "#BFC3D6", a0: 0.5 });
    smoke(Cm, k, N, a, 2.2, 2.2, 1.35);
    carFrames(Cm, k, N, a, b, "yellow");
    // the ground lit in front of the car once the lights are on
    const pool = bake(tOn, b, (f) => { const q = S.yellow((f - a) / 60), c0 = corners(q, 26, 0, 0)[0], r = Pp(c0), d0 = Math.max(4, r[2]), sc = clamp(60 / d0, 0.2, 4) * 100; return { p: [r[0], r[1]], s: [sc * 1.6, sc * 0.55] }; });
    const pl = Cm.shape("olari · light pool", [group("p", [ellipse([600, 600], [0, 0]), gfill({ type: 2, s: [0, 0], e: [300, 0], stops: [[0, "#FFE7BF"], [1, "#FFE7BF"]], alphas: [[0, 0.5], [1, 0]] })])], { parent: N, ip: tOn, op: b, ks: { p: pool.p, s: pool.s, o: [[tOn, 0, E.linear], [tOn + 6, 100]] } });
    pl.bm = 2;
    plateLayer(Cm, k, N, a, b);
  }
  Cm.shape("night", [group("n", [rect([W, H], [W / 2, H / 2]), fill(rgb("#05060C"))])]);
  const j = Cm.json(); j.cromatic = { story: "C v3", lang, dur: F / 60, shots: T };
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
  function smoke(Cm, k, N, a, dur, scale = 2, tSpin) {
    const S = sh(k), Pp = Pk[k], R = rng(k.length * 7), groups = [];
    for (let i = 0; i < dur * 30; i += 1) {
      const t = i / 30, q = S.yellow(t); if (!q) continue;
      const on = q.slide || (tSpin != null && t > tSpin && t < tSpin + 0.45); if (!on) continue;
      for (const w of corners(q, -8.6, 4.6, 0)) {
        const r = Pp(w); if (r[2] < 3) continue;
        const pxu = Pp.f / r[2], f0 = a + i * 2, l = 46 + Math.round(R() * 20), r0 = 2.6 * pxu * scale / 2, r1 = (8 + R() * 5) * pxu * scale / 2;
        groups.push(group(`puff ${i}`, [ellipse([2, 2], [0, 0]), gfill({ type: 2, s: [0, 0], e: [1, 0], stops: [[0, "#DDE3F5"], [1, "#DDE3F5"]], alphas: [[0, 0.5], [1, 0]] })], {
          p: [[f0, [r[0], r[1]], E.out], [f0 + l, [r[0] + (R() - 0.5) * 24 * pxu, r[1] - (6 + R() * 6) * pxu]]], s: [[f0, [r0 * 100, r0 * 100], E.out], [f0 + l, [r1 * 100, r1 * 100]]], o: [[0, 0, E.hold], [f0, 90, E.linear], [f0 + l, 0]]
        }));
      }
    }
    if (groups.length) Cm.shape(`${k} · smoke`, groups, { parent: N, ip: a, op: a + dur * 60 + 80 });
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
  fs.writeFileSync(path.join(OUT, `story-c3-${lang}.json`), s);
  sizes[`story-c3-${lang}`] = { kb: +(s.length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, images: j.assets.length };
}
console.table(sizes);
