// Cromatic · stories in Lottie · story C (TASK-058): "the chase, at night" (Daniel: "urmărirea poliției, noaptea").
// The city in Night Mode from the site's engine (renderC.mjs -> platesC.mjs), the cars as they really move: each car
// rendered alone at every frame of 30 (a 180-degree shutter's blur in it), laid over the street's layers; the marks,
// the smoke, the police lamps' washes, the grain and the type drawn here.
//   0.0-3.2 s  the bird's eye over the lit city: both cars up the main road toward the corner of Aricescu, the police
//              lamps pulsing; the camera pushes in, then dives into the corner (a flash of the lamps)
//   3.2-9.3 s  street level on the coffee street: the yellow ride drifts through the corner, comes at the lens and
//              misses it (a shake); the police car follows, slows, stops; its lamps go off: the five seconds are over
//   9.3-12  s  the end card over the night street
//   node buildC.mjs  -> story-c-en.json, story-c-ro.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { Comp, group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, path as shp, rng, C, EXIT, line, poly } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H, K, T, clamp, lerp, smooth, easeOut, ramp, bake, monoLine, headline, label, mark, glow, endCard } from "./build.mjs";
import { CARS, pose, rearWheels, sliding, beat, STREET_DUR, CSHOTS, AIR } from "./chase.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, ".."), IMG = path.join(OUT, "images");
const P = JSON.parse(fs.readFileSync(path.join(here, "platesC.json"), "utf8"));
const COPY = {
  en: { airLabel: "23:47 · AROUND TWO MINUTES", air: [["Drift too", null], ["long.", "long"]], copLabel: "POLICE · 5-B-4733", slow: "POLICE · SLOW DOWN", cop: [["Here they", null], ["come.", "come"]], free: [["Five seconds later,", null], ["you're free.", "free"]], endLabel: "THE CHASE IS ON THE MAP", end: [["Your", null], ["turn.", "turn"]] },
  ro: { airLabel: "23:47 · PE LÂNGĂ TWO MINUTES", air: [["Driftezi", null], ["prea mult.", "mult"]], copLabel: "POLIȚIA · 5-B-4733", slow: "POLIȚIA · MAI ÎNCET", cop: [["Vine", null], ["poliția.", "poliția"]], free: [["După cinci secunde,", null], ["ești liber.", "liber"]], endLabel: "URMĂRIREA E PE HARTĂ", end: [["E rândul", null], ["tău.", "tău"]] }
};
const NIGHT = "#0E1430", RED = "#FF3B4E", BLUE = "#3D7BFF";
// the clock (frames at 60)
const D = 12, F = D * 60, ST0 = 192, DIVE = 168, END = 560;
const ts = (f) => (f - ST0) / 60; // story frame -> street time (s)
const fOf = (t) => ST0 + t * 60;

/* ---------- plates ---------- */
function asset(Cm, name) {
  const m = P.plates[name]; if (!m) throw new Error("no plate " + name);
  if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; }
  return m;
}
const img = (Cm, name, parent, { ip, op, p, nm, o } = {}) => { const m = asset(Cm, name); return Cm.image(nm || name, name, { ip, op, parent, ks: { p: p || [m.x, m.y], ...(o != null ? { o } : {}) } }); };
// grain: two frames of film grain (made here, once), overlaid at a low opacity, swapping every 2 frames
async function grainPlates() {
  for (const k of [0, 1]) {
    const f = path.join(IMG, `c-grain-${k}.webp`); if (fs.existsSync(f)) continue;
    const R = rng(91 + k), w = 540, h = 960, buf = Buffer.alloc(w * h);
    for (let i = 0; i < buf.length; i++) { const g = (R() + R() + R() + R() - 2) * 0.5; buf[i] = Math.max(0, Math.min(255, Math.round(128 + g * 120))); }
    await sharp(buf, { raw: { width: w, height: h, channels: 1 } }).webp({ quality: 40 }).toFile(f);
  }
  for (const k of [0, 1]) P.plates[`c-grain-${k}`] = { file: `c-grain-${k}.webp`, x: 0, y: 0, w: 540, h: 960 };
}

/* ---------- the street's camera: level, a crane down at the start, a slow push, a hand-held shake at the miss ---------- */
const SO = P.street.o, f2 = P.street.proj.f, YH = P.street.proj.horizon, CAMY = P.street.proj.camY;
const fullW = (l) => (P.plates[`c-street-${l}`] || {}).full?.[0] || SO.w;
const Df = (t) => 2.2 * (1 - easeOut(clamp(t / 2.6))); // up 2.2 above the render's eye, down to it
const Tf = (t) => lerp(-0.6, 0.6, clamp(t / 8.8)); // a drift sideways
const Zf = (t) => lerp(1, 1.13, smooth(clamp(t / 8.8))); // the push
const camFwd = (() => { const dx = SO.tgt[0] - SO.pos[0], dz = SO.tgt[2] - SO.pos[2], n = Math.hypot(dx, dz); return [dx / n, dz / n]; })();
const depthOf = (x, z) => (x - SO.pos[0]) * camFwd[0] + (z - SO.pos[2]) * camFwd[1];
const LAYER_Z = { near: 70, mid: 300, far: 1400 };
// a layer's transform at street time t (its picture: fullW(l) wide, 3840 high, the horizon at YH)
function xf(l, t, z) {
  const Tm = Tf(t), Dm = Df(t), Zm = Zf(t), h = CAMY - 0.5, Wl = fullW(l), P0 = [Wl / 2, YH], Pc = [W / 2, YH * K];
  if (l === "ground") return { a: P0, p: Pc, s: [100 * K * Zm, 100 * K * Zm * (1 + Dm / h)], sk: (Math.atan(Tm / (h + Dm)) * 180) / Math.PI };
  if (l === "sky") return { a: P0, p: Pc, s: [100 * K * Zm, 100 * K * Zm] };
  const zz = z ?? LAYER_Z[l];
  return { a: P0, p: [Pc[0] + K * Zm * ((-Tm * f2) / zz), Pc[1] + K * Zm * ((Dm * f2) / zz)], s: [100 * K * Zm, 100 * K * Zm] };
}
// a point of the 2592-wide frame on a layer (or at depth z) -> story px at street time t (no shake)
function toStory(pt, t, l = "mid", z) { const x = xf(l, t, z), off = (fullW(l) - SO.w) / 2, u = pt[0] + off - x.a[0], v = pt[1] - x.a[1], sx = x.s[0] / 100, sy = x.s[1] / 100, tk = Math.tan(((x.sk || 0) * Math.PI) / 180); return [x.p[0] + sx * u + tk * sy * v, x.p[1] + sy * v]; }
const MISS = 3.12; // (the yellow ride passes the lens)
const shake = (t) => { const k = Math.exp(-Math.max(0, t - MISS) * 5) * (t > MISS - 0.05 ? 1 : 0); const a = 14 * k; return [a * Math.sin(t * 97), a * Math.cos(t * 71) * 0.7, k * 1.4 * Math.sin(t * 53)]; };

/* ---------- story C ---------- */
function storyC(lang) {
  const c = COPY[lang], Cm = new Comp({ w: W, h: H, dur: D, nm: `Cromatic · story C · the chase, at night · ${lang}` });
  // ---- nulls: the shake (over the street), the street's layers, the cars' plane; the bird's eye
  const shakeN = Cm.nul("camera · street · shake", { ip: ST0, op: F, ks: { a: [W / 2, H / 2], ...(() => { const k = bake(ST0, F, (f) => { const s = shake(ts(f)); return { p: [W / 2 + s[0], H / 2 + s[1]], r: s[2] }; }); return { p: k.p, r: k.r }; })() } });
  const N = {};
  for (const l of ["sky", "far", "ground", "mid", "near"]) {
    const k = bake(ST0, F, (f) => { const x = xf(l, ts(f)); return { p: x.p, s: x.s, ...(x.sk != null ? { sk: x.sk } : {}) }; });
    N[l] = Cm.nul(`camera · street · ${l}`, { parent: shakeN, ip: ST0, op: F, ks: { a: xf(l, 0).a, p: k.p, s: k.s } });
    if (k.sk != null) { N[l].ks.sk = prop(k.sk); N[l].ks.sa = prop(0); }
  }
  // the bird's eye: a push from x1.12 to x1.6, then the dive (to x3.4) into the corner; a slow roll
  const AIRC = [1080, 1920];
  const Zair = (f) => f < DIVE ? lerp(1.12, 1.6, smooth(f / DIVE)) : lerp(1.6, 3.6, Math.pow(clamp((f - DIVE) / (ST0 + 6 - DIVE)), 2.2));
  const Rair = (f) => lerp(3, -1.5, smooth(clamp(f / (ST0 + 6))));
  const airN = Cm.nul("camera · bird's eye", { ip: 0, op: ST0 + 8, ks: { a: AIRC, p: [W / 2, H / 2], ...(() => { const k = bake(0, ST0 + 8, (f) => ({ s: [100 * K * Zair(f), 100 * K * Zair(f)], r: Rair(f) })); return { s: k.s, r: k.r }; })() } });
  const lens1 = Cm.nul("lens 1", { parent: airN, ip: 0, op: ST0 + 8, ks: { a: AIRC, p: AIRC, s: [50, 50] } });

  // ---- top: grain, the mark, the end card, the words
  for (let k = 0; k < 2; k++) { const L = img(Cm, `c-grain-${k}`, null, { nm: `grain ${k}`, p: [0, 0] }); L.ks.s = prop([200, 200, 100]); L.bm = 3; L.ks.o = prop(18); L.tm = undefined; L.ip = 0; L.op = F; L.__alt = k; }
  // (the two grains swap every 2 frames: each is on for 2 of every 4)
  Cm.layers.filter((L) => L.__alt != null).forEach((L) => { const k = L.__alt; delete L.__alt; L.ks.o = prop(Array.from({ length: F / 2 + 1 }, (_, i) => [i * 2, (i + k) % 2 ? 0 : 18, E.hold])); });
  mark(Cm, { color: C.white });
  endCard(Cm, c, END);
  headline(Cm, { lines: c.free, x: 72, y: 452, size: lang === "ro" ? 88 : 96, t0: fOf(4.25), tOut: END - 16, color: C.white, nm: "free · headline" });
  // the countdown: the map's own pill (its ring with the seconds left, "POLICE · SLOW DOWN"), counted down quickly
  {
    const t0 = fOf(4.15), step = 13, x = 72, y = 668, txt = monoLine(c.slow, 27, C.black, x + 92, y + 10), pw = 92 + txt.width + 34;
    const digits = [5, 4, 3, 2, 1].map((d, i) => { const L = monoLine(String(d), 36, C.black, 0, 0); return group(`digit ${d}`, L.groups, { p: [x + 44 - L.width / 2, y + 13], o: [[0, 0, E.hold], [t0 + i * step, 100, E.hold], [t0 + (i + 1) * step, 0, E.hold]] }); });
    Cm.shape("free · countdown", [...digits, group("label", txt.groups), group("ring", [ellipse([56, 56], [x + 44, y]), stroke(rgb(C.black), 4), fill(rgb(C.yellow))]), group("pill", [rect([pw, 80], [x + pw / 2, y], 9999), stroke(rgb(C.black), 5), fill(rgb(C.white))])], {
      ip: t0 - 4, op: t0 + 5 * step + 22, ks: { a: [x + pw / 2, y], p: [x + pw / 2, y], s: [[t0 - 4, [40, 40], E.spring], [t0 + 14, [100, 100], E.hold], [t0 + 5 * step + 6, [100, 100], EXIT], [t0 + 5 * step + 20, [0, 0]]] }
    });
  }
  headline(Cm, { lines: c.cop, x: 72, y: 452, t0: fOf(2.25), tOut: fOf(4.0), color: C.white, nm: "cop · headline" });
  label(Cm, { text: c.copLabel, x: 72, y: 326, t0: fOf(2.15), tOut: fOf(4.05), color: C.white, nm: "cop · label" });
  headline(Cm, { lines: c.air, x: 72, y: 452, t0: 26, tOut: DIVE - 6, color: C.white, nm: "air · headline" });
  label(Cm, { text: c.airLabel, x: 72, y: 326, t0: 16, tOut: DIVE - 4, color: C.white, nm: "air · label" });
  // the dive's flash: the police lamps fill the lens (red, then blue), and the cut is under it
  for (const [col, t0] of [[RED, DIVE + 8], [BLUE, DIVE + 18]]) {
    const L = Cm.shape(`dive · flash ${col}`, [group("f", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H / 2], e: [W * 1.1, H / 2], stops: [[0, col], [1, col]], alphas: [[0, 1], [1, 0.55]] })])], { ip: t0, op: t0 + 26, ks: { o: [[t0, 0, E.linear], [t0 + 8, 92, E.inOut], [t0 + 24, 0]] } });
    L.bm = 2;
  }
  // a dark scrim under the words at the top (the bird's eye is busy), and the night's vignette
  Cm.shape("scrim", [group("s", [rect([W, 860], [W / 2, 430]), gfill({ type: 1, s: [0, 0], e: [0, 860], stops: [[0, NIGHT], [1, NIGHT]], alphas: [[0, 0.82], [0.55, 0.55], [1, 0]] })])], { ip: 0, op: F });
  Cm.shape("vignette", [group("v", [rect([W * 1.1, H * 1.1], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.05, H * 0.5], stops: [[0, "#05070F"], [1, "#05070F"]], alphas: [[0, 0], [0.55, 0], [1, 0.55]] })])], { ip: 0, op: F });

  // ---- the street: police lamps' washes, the cars, smoke, marks, the bulbs, then its layers
  const pr = P.street.proj, at = (car, i, k) => { const j = pr.idx[car][i]; return j == null ? null : pr.pts[j + k]; }; // k: 0 middle, 1 middle up 6, 2/3 the rear wheels
  const nF = pr.idx.yellow.length; // (frames of 30 in the moving part)
  // the police lamps: on the car's roof (the top of its picture: the lamps are its highest point), their light on the
  // road under it, and a wash over the street in the beat; in the cars' plane (the sky layer's null), with the car's
  // own parallax, so they ride with its picture
  {
    const tOn = CARS.cop.t0 + 0.2, tOff = 6.1, last = pose("cop", STREET_DUR);
    const copPic = (t) => { // the police car's picture at street time t: its rectangle and its depth
      if (t <= STREET_DUR) { const i = Math.round(t * 30), nm = P.frames.cop[Math.min(i, P.frames.cop.length - 1)], q = pose("cop", Math.min(t, STREET_DUR)); return nm && q ? { m: P.plates[nm], z: Math.max(8, depthOf(q.x, q.z)) } : null; }
      return { m: P.plates[P.hold[0]], z: depthOf(last.x, last.z) };
    };
    const par = (t, z) => [(-Tf(t) * f2) / z, (Df(t) * f2) / z];
    const keysAt = (fn) => bake(fOf(tOn), fOf(tOff), (f) => { const t = ts(f), c = copPic(t); if (!c) return { p: [-999, -999], s: [0, 0] }; const d = par(t, c.z); return fn(c, d); });
    for (const [col, b] of [[RED, 0], [BLUE, 1]]) {
      const beats = []; for (let f = fOf(tOn); f <= fOf(tOff); f++) { const on = beat(ts(f)) === b; if (!beats.length || beats[beats.length - 1][1] !== (on ? 100 : 0)) beats.push([f, on ? 100 : 0, E.hold]); }
      beats.push([fOf(tOff), 0]);
      const lamp = keysAt((c, d) => { const k = clamp(c.m.w / 900, 0.12, 1) * 100; return { p: [c.m.x + c.m.w * (b ? 0.62 : 0.38) + d[0], c.m.y + c.m.h * 0.05 + d[1]], s: [k, k] }; });
      const g = Cm.shape(`police · lamp ${b ? "blue" : "red"}`, [group("g", [ellipse([900, 900], [0, 0]), gfill({ type: 2, s: [0, 0], e: [450, 0], stops: [[0, "#FFFFFF"], [0.12, col], [1, col]], alphas: [[0, 0.95], [0.12, 0.8], [1, 0]] })])], { parent: N.sky, ip: fOf(tOn), op: fOf(tOff) + 1, ks: { p: lamp.p, s: lamp.s, o: beats } });
      g.bm = 2;
      const rd = keysAt((c, d) => { const k = clamp(c.m.w / 900, 0.12, 1) * 100; return { p: [c.m.x + c.m.w * (b ? 0.62 : 0.38) + d[0], c.m.y + c.m.h * 0.98 + d[1]], s: [k, k] }; });
      const road = Cm.shape(`police · on the road ${b ? "blue" : "red"}`, [group("r", [ellipse([300, 1400], [0, 700]), gfill({ type: 2, s: [0, 150], e: [0, 1400], stops: [[0, col], [1, col]], alphas: [[0, 0.3], [1, 0]] })])], { parent: N.sky, ip: fOf(tOn), op: fOf(tOff) + 1, ks: { p: rd.p, s: rd.s, o: beats } });
      road.bm = 2;
      // the wash over the street (the facades, the road): stronger as it comes near
      const wash = Cm.shape(`police · wash ${b ? "blue" : "red"}`, [group("w", [rect([W * 1.3, H * 0.9], [b ? W * 0.75 : W * 0.25, H * 0.56]), gfill({ type: 2, s: [b ? W * 0.8 : W * 0.2, H * 0.55], e: [b ? W * 1.6 : -W * 0.6, H * 0.55], stops: [[0, col], [1, col]], alphas: [[0, 0.5], [1, 0]] })])], {
        ip: fOf(tOn), op: fOf(tOff) + 1, ks: { o: beats.map(([f, v, e]) => [f, v ? Math.round(100 * clamp((ts(f) - tOn) / 2.2, 0.15, 1)) : 0, e]) }
      });
      wash.bm = 2;
    }
  }
  // the cars: one image layer per frame of 30 (2 story frames each), at its own depth's parallax (the street's drift)
  const carLayer = (car, i, name) => {
    const t = i / 30, q = pose(car, t), z = q ? Math.max(8, depthOf(q.x, q.z)) : 300, m = P.plates[name];
    const f0 = Math.round(fOf(t)), dx = (-Tf(t) * f2) / z, dy = (Df(t) * f2) / z;
    Cm.image(`${car} · ${String(i).padStart(3, "0")}`, name, { parent: N.sky, ip: f0, op: f0 + 2, ks: { p: [m.x + (fullW("sky") - SO.w) / 2 + dx, m.y + dy] } });
    asset(Cm, name);
  };
  // the police car: its frames, then standing (its lamps red, blue, ... then off)
  P.frames.cop.forEach((name, i) => { if (name) carLayer("cop", i, name); });
  {
    const last = pose("cop", STREET_DUR), z = depthOf(last.x, last.z);
    for (let f = Math.round(fOf(STREET_DUR + 1 / 30)); f < F; f += 2) {
      const t = ts(f), name = t >= 6.1 ? P.hold[2] : P.hold[beat(t)], m = asset(Cm, name);
      Cm.image(`police · standing · ${f}`, name, { parent: N.sky, ip: f, op: f + 2, ks: { p: [m.x + (fullW("sky") - SO.w) / 2 + (-Tf(t) * f2) / z, m.y + (Df(t) * f2) / z] } });
    }
  }
  P.frames.yellow.forEach((name, i) => { if (name) carLayer("yellow", i, name); });
  // tyre smoke: puffs from the rear wheels while they slide, growing, rising, fading (soft: no outline)
  for (const car of ["yellow", "cop"]) {
    const R = rng(car === "yellow" ? 5 : 9), groups = [];
    for (let i = 0; i < nF; i++) {
      const t = i / 30; if (!sliding(car, t) || i % 2) continue;
      const q = pose(car, t), z = Math.max(10, depthOf(q.x, q.z));
      for (const k of [2, 3]) {
        const w = at(car, i, k); if (!w) continue;
        const pu = at(car, i, 0), up = at(car, i, 1), pxu = Math.abs(pu[1] - up[1]) / 6; // (px per unit at the car)
        const f0 = Math.round(fOf(t)), life = 44 + Math.round(R() * 18), r0 = 3 * pxu * K, r1 = (9 + R() * 5) * pxu * K;
        const p0 = toStory(w, t, "mid", z), drift = [(R() - 0.5) * 30 * pxu * K, -(10 + R() * 8) * pxu * K];
        groups.push(group(`puff ${i}.${k}`, [ellipse([2, 2], [0, 0]), gfill({ type: 2, s: [0, 0], e: [1, 0], stops: [[0, "#E8ECFF"], [1, "#E8ECFF"]], alphas: [[0, 0.55], [1, 0]] })], {
          p: [[f0, p0, E.out], [f0 + life, [p0[0] + drift[0], p0[1] + drift[1]]]], s: [[f0, [r0 * 100, r0 * 100], E.out], [f0 + life, [r1 * 100, r1 * 100]]],
          o: [[0, 0, E.hold], [f0, 90, E.linear], [f0 + life, 0]]
        }));
      }
    }
    if (groups.length) Cm.shape(`smoke · ${car}`, groups, { parent: shakeN, ip: ST0, op: F });
  }
  // skid marks on the road (the ground's layer: they lie in its perspective): a strip per rear wheel, drawn as it slides
  for (const car of ["yellow", "cop"]) for (const k of [2, 3]) {
    const runs = []; let cur = null;
    for (let i = 0; i < nF; i++) { const s = sliding(car, i / 30) && at(car, i, k); if (s) { if (!cur) { cur = []; runs.push(cur); } cur.push(i); } else cur = null; }
    runs.forEach((run, ri) => {
      if (run.length < 3) return;
      const strip = (n) => { // the first n samples as a quad strip in the ground's picture (its picture is wider)
        const off = (fullW("ground") - SO.w) / 2, L = [], Rr = [];
        for (let j = 0; j < run.length; j++) {
          const i = run[Math.min(j, n - 1)], w = at(car, i, k), pu = at(car, i, 0), up = at(car, i, 1), half = (Math.abs(pu[1] - up[1]) / 6) * 1.3;
          const nx = run[Math.min(j + 1, run.length - 1)], w2 = at(car, nx, k) || w, dx = w2[0] - w[0], dy = w2[1] - w[1], dl = Math.hypot(dx, dy) || 1;
          L.push([w[0] + off - (dy / dl) * half * 0.85, w[1] + (dx / dl) * half * 0.85]); Rr.push([w[0] + off + (dy / dl) * half * 0.85, w[1] - (dx / dl) * half * 0.85]);
        }
        return poly([...L, ...Rr.reverse()]);
      };
      const keys = run.map((i, j) => [Math.round(fOf(i / 30)), strip(j + 1), E.linear]); keys[keys.length - 1] = [keys[keys.length - 1][0], keys[keys.length - 1][1]];
      Cm.shape(`marks · ${car} · ${k} · ${ri}`, [group("m", [shp(keys), fill(rgb("#140C10"), 62)])], { parent: N.ground, ip: keys[0][0], op: F });
    });
  }
  // the festoon's bulbs (on the street's far layer), warm
  P.street.bulbs.forEach((b, i) => { if (b[2] < 1 && b[0] > -100 && b[0] < SO.w + 100) glow(Cm, { at: [b[0], b[1]], r: 64, t0: ST0 + (i % 5), parent: N.far, nm: `bulb ${i}`, o: 70 }); });
  // the street's layers (front to back); the road darkened for the night (multiply, below the horizon only), under
  // the yellow ride's headlights' pool while it comes at the lens
  for (const l of ["near", "mid"]) img(Cm, `c-street-${l}`, N[l], { ip: ST0, op: F, nm: `street · ${l}` });
  {
    const pool = Cm.shape("street · headlights on the road", [group("p", [ellipse([900, 520], [0, 0]), gfill({ type: 2, s: [0, 0], e: [450, 0], stops: [[0, "#FFE6B0"], [1, "#FFE6B0"]], alphas: [[0, 0.5], [1, 0]] })])], {
      ip: fOf(0.8), op: fOf(3.1), ks: { p: bake(fOf(0.8), fOf(3.1), (f) => { const t = ts(f), q = pose("yellow", t), z = Math.max(12, depthOf(q.x, q.z)); const ahead = { x: q.x + Math.sin(q.yaw) * 22, z: q.z + Math.cos(q.yaw) * 22 }; const i = Math.round(t * 30), m0 = at("yellow", i, 0) || [SO.w / 2, YH]; return { p: toStory([m0[0], m0[1] + 60 * (300 / z)], t, "mid", z) }; }).p, s: bake(fOf(0.8), fOf(3.1), (f) => { const q = pose("yellow", ts(f)), k = clamp(160 / Math.max(12, depthOf(q.x, q.z)), 0.1, 2.2) * 100; return { s: [k, k * 0.8] }; }).s, o: [[fOf(0.8), 0, E.linear], [fOf(1.4), 100, E.hold], [fOf(2.9), 100, E.linear], [fOf(3.1), 0]] }
    });
    pool.bm = 2;
    const dark = Cm.shape("street · night road", [group("d", [rect([fullW("ground") + 400, 3840 - YH + 200], [fullW("ground") / 2, YH + (3840 - YH) / 2 + 60]), gfill({ type: 1, s: [0, YH], e: [0, 3840], stops: [[0, "#6A6FA0"], [1, "#2A2A52"]] })])], { parent: N.ground, ip: ST0, op: F });
    dark.bm = 1;
  }
  for (const l of ["ground", "far", "sky"]) img(Cm, `c-street-${l}`, N[l], { ip: ST0, op: F, nm: `street · ${l}` });

  // ---- the bird's eye: the police lamps (on the car), the cars, the lenses
  const tr = P.air.track, airT = (f) => f / 60; // (the aerial's own clock: from 0)
  const trackAt = (car, t) => { const i = clamp(Math.round(t * 30), 0, tr[car].length / 2 - 1); return [tr[car][2 * i], tr[car][2 * i + 1]]; };
  for (const [col, b] of [[RED, 0], [BLUE, 1]]) {
    const beats = []; for (let f = 0; f <= ST0; f++) { const on = beat(airT(f)) === b; if (!beats.length || beats[beats.length - 1][1] !== (on ? 100 : 0)) beats.push([f, on ? 100 : 0, E.hold]); }
    const g = Cm.shape(`air · police lamp ${b ? "blue" : "red"}`, [group("g", [ellipse([460, 460], [0, 0]), gfill({ type: 2, s: [0, 0], e: [230, 0], stops: [[0, "#FFFFFF"], [0.14, col], [1, col]], alphas: [[0, 1], [0.14, 0.9], [1, 0]] })])], {
      parent: airN, ip: 0, op: ST0 + 8, ks: { p: bake(0, ST0 + 8, (f) => { const q = trackAt("cop", airT(f)); return { p: [q[1][0], q[1][1]] }; }).p, o: beats }
    });
    g.bm = 2;
  }
  for (const car of ["yellow", "cop"]) {
    const poses = P.airPoses[car];
    poses.forEach((ps, k) => {
      if (!ps.name) return;
      const m = P.plates[ps.name], f0 = Math.round(ps.t * 60 - 3), f1 = Math.round(ps.t * 60 + 3), base = trackAt(car, ps.t)[0];
      if (f1 < 0 || f0 > ST0 + 8) return;
      const p = bake(Math.max(0, f0), Math.min(ST0 + 8, f1), (f) => { const q = trackAt(car, airT(f))[0]; return { p: [m.x + q[0] - base[0], m.y + q[1] - base[1]] }; }).p;
      Cm.image(`air · ${car} · ${k}`, ps.name, { parent: airN, ip: Math.max(0, f0), op: Math.min(ST0 + 8, f1), ks: { p } });
      asset(Cm, ps.name);
    });
  }
  img(Cm, "c-air-1", lens1, { ip: 0, op: ST0 + 8, nm: "bird's eye · lens 1" });
  img(Cm, "c-air-0", airN, { ip: 0, op: ST0 + 8, nm: "bird's eye · lens 0" });
  Cm.shape("night", [group("n", [rect([W, H], [W / 2, H / 2]), fill(rgb(NIGHT))])]);
  const j = Cm.json(); j.cromatic = { story: "C", lang, dur: D, cuts: { air: [0, ST0], street: [ST0, F], end: END } };
  return j;
}

await grainPlates();
const sizes = {};
for (const lang of ["en", "ro"]) {
  const j = storyC(lang), s = JSON.stringify(j);
  fs.writeFileSync(path.join(OUT, `story-c-${lang}.json`), s);
  sizes[`story-c-${lang}`] = { kb: +(s.length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, images: j.assets.length };
}
console.table(sizes);
