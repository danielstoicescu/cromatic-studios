// Cromatic · stories in Lottie · story B v3 (TASK-065b): one street, the Multiverse's nine worlds, English only. The
// worlds, their changes (a switch, a flood, a whip, the Multiverse pill, a run of crash cuts) and the camera as in v2;
// the words back ON the screen (the v3 gate: words rendered into the scene did not pass), as film titles: the line
// "Same street. New ___." on a card that resizes to each word (the pill pops once, then slides), each world named low
// left on a chip of its colour, the crash cuts smash-cut huge and centred; the end title and the address on its own.
//   node buildB3.mjs -> story-b3-en.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, path as shp, rng, C, line, roundRect, pathProp } from "../../../lottie-ui/_source/lib/ui.mjs";
import { swapPill, slotWord } from "../../../intro-lottie/_source/lib/kit.mjs";
import { W, H, T, bake, headline } from "./build.mjs";
import { cam, urlPill, grain, grainPlates, textWidth } from "./kit2.mjs";
import { INK, EXPO, reveal, typed, chip, shade, swapLine, tw, monoW } from "./kit3.mjs";
import { SHOTS } from "./shots.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const PB = JSON.parse(fs.readFileSync(path.join(here, "platesB2.json"), "utf8")).plates;
const PL1 = JSON.parse(fs.readFileSync(path.join(here, "plates.json"), "utf8"));
await grainPlates(PB);
const K = 0.5, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sm = (t) => t * t * (3 - 2 * t), easeOut = (t) => 1 - Math.pow(1 - t, 3);
const F = 870;
// the worlds in their order, when each is on (frames), its name on the road, its word, its pill's colour and ink
const WORLD = {
  monument: { nm: "CROMATIC", col: C.yellow, ink: C.black, style: "paint", paint: "#FFE27A" },
  nightlife: { nm: "NIGHT MODE", col: C.yellow, ink: C.black, style: "light", paint: "#FFE9B8" },
  underwater: { nm: "UNDERWATER", col: "#3DE0D0", ink: C.black, style: "light", paint: "#BDFBFF" },
  circuit: { nm: "RACE DAY", col: "#E10600", ink: C.white, style: "paint", paint: "#FFFFFF" },
  sketch: { nm: "SKETCHBOOK", col: C.white, ink: "#2B2E6E", style: "paint", paint: "#2B2E6E" },
  orchid: { nm: "SAKURA", col: "#F08BB4", ink: C.black, style: "paint", paint: "#FFF0F6" },
  gta2: { nm: "GTA 2", col: C.yellow, ink: C.black, style: "paint", paint: "#FFD21F" },
  riso: { nm: "RISOGRAPH", col: "#FF48B0", ink: C.white, style: "paint", paint: "#1D3F8F" },
  ghibli: { nm: "GHIB.LY", col: "#6FBF73", ink: C.black, style: "paint", paint: "#FFFFFF" }
};
const SPAN = { monument: [0, 122], nightlife: [118, 244], underwater: [214, 329], circuit: [333, 498], sketch: [418, 566], orchid: [560, 586], gta2: [584, 610], riso: [608, 634], ghibli: [632, 676], end: [674, F] };
const COPY = {
  en: { lead: "Same street.", pre: "New", words: { nightlife: "lights", underwater: "tide", circuit: "lap", sketch: "paper", orchid: "bloom", gta2: "rules", riso: "ink", ghibli: "magic" }, end: ["Nine worlds.", "One street."], emph: "street" }
};

// the street's camera (the pilot's b-street: level, the horizon low): its layers' moves, the same in every world
const BS = PL1.shots["b-street"].main, f2 = BS.f, YH = BS.horizon, CAMY = BS.camY, SW0 = 2592;
const fullW = (l) => (l === "near" ? 3024 : l === "ground" ? 3888 : 2592);
const Tf = (t) => lerp(-3.2, 3.2, clamp(t / 14)), Df = (t) => 3.5 * (1 - easeOut(clamp(t / 3))), Zf = (t) => lerp(1, 1.1, sm(clamp(t / 14)));
const LZ = { near: 95, mid: 230, far: 1100 };
function xf(l, t) {
  const Tm = Tf(t), Dm = Df(t), Zm = Zf(t), h = CAMY - 0.5, P0 = [fullW(l) / 2, YH], Pc = [W / 2, YH * K];
  if (l === "ground") return { a: P0, p: Pc, s: [100 * K * Zm, 100 * K * Zm * (1 + Dm / h)], sk: (Math.atan(Tm / (h + Dm)) * 180) / Math.PI };
  if (l === "sky") return { a: P0, p: Pc, s: [100 * K * Zm, 100 * K * Zm] };
  return { a: P0, p: [Pc[0] + K * Zm * ((-Tm * f2) / LZ[l]), Pc[1] + K * Zm * ((Dm * f2) / LZ[l])], s: [100 * K * Zm, 100 * K * Zm] };
}
const Pcam = cam({ ...SHOTS["b-street"], w: SW0, h: 3840 });
const fwd = (() => { const o = SHOTS["b-street"], dx = o.tgt[0] - o.pos[0], dz = o.tgt[2] - o.pos[2], n = Math.hypot(dx, dz); return [dx / n, dz / n]; })(), right = [-fwd[1], fwd[0]];

function asset(Cm, name) { const m = PB[name]; if (!m) throw new Error("no plate " + name); if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; } return m; }

// a world as a precomp: the rig's nulls, its five layers, its name on the road, its extras (bulbs, water, petals)
function worldComp(Main, w, lang) {
  const S = new Comp({ w: W, h: H, dur: F / 60, nm: `world · ${w}` }), [a, b] = SPAN[w], N = {};
  for (const l of ["sky", "far", "ground", "mid", "near"]) {
    const k = bake(Math.max(0, a - 4), Math.min(F, b + 4), (f) => { const x = xf(l, f / 60); return { p: x.p, s: x.s, ...(x.sk != null ? { sk: x.sk } : {}) }; });
    N[l] = S.nul(`camera · ${l}`, { ks: { a: xf(l, 0).a, p: k.p, s: k.s } });
    if (k.sk != null) { N[l].ks.sk = prop(k.sk); N[l].ks.sa = prop(0); }
  }
  // extras on top
  if (w === "underwater") {
    // the water: a teal veil, light dancing, bubbles going up
    const R = rng(17), bubbles = [];
    for (let i = 0; i < 26; i++) { const x = R() * W, f0 = a + Math.round(R() * (b - a)), r = 6 + R() * 16, l = 80 + R() * 60; bubbles.push(group(`bubble ${i}`, [ellipse([2 * r, 2 * r], [0, 0]), stroke(rgb("#E8FFFF"), 3, 80), fill(rgb("#BFF7FF"), 18)], { p: [[f0, [x, H + 40], E.linear], [f0 + l, [x + (R() - 0.5) * 120, H * 0.25]]], o: [[0, 0, E.hold], [f0, 100, E.linear], [f0 + l, 0]] })); }
    S.shape("bubbles", bubbles);
    const caus = S.shape("caustics", Array.from({ length: 7 }, (_, i) => group(`c ${i}`, [ellipse([520, 140], [0, 0]), gfill({ type: 2, s: [0, 0], e: [260, 0], stops: [[0, "#CFFFFA"], [1, "#CFFFFA"]], alphas: [[0, 0.32], [1, 0]] })], { p: [[a, [(i / 7) * W + 60, H * (0.3 + 0.08 * (i % 3))], E.inOut], [b, [(i / 7) * W + 160, H * (0.32 + 0.08 * ((i + 1) % 3))]]], r: [[a, i * 25, E.inOut], [b, i * 25 + 40]] })));
    caus.bm = 2;
    S.shape("veil", [group("v", [rect([W, H], [W / 2, H / 2]), gfill({ type: 1, s: [0, 0], e: [0, H], stops: [[0, "#2FC7D4"], [1, "#05425E"]], alphas: [[0, 0.16], [1, 0.42]] })])]);
  }
  if (w === "orchid") {
    const R = rng(23), pet = [];
    for (let i = 0; i < 30; i++) { const x = R() * W, f0 = a - 20 + Math.round(R() * 30), l = 60 + R() * 40; pet.push(group(`petal ${i}`, [ellipse([22, 13], [0, 0]), fill(rgb(R() < 0.5 ? "#FFD3E6" : "#F7A8C8"))], { p: [[f0, [x, -30 + R() * 400], E.linear], [f0 + l, [x + 160 + R() * 200, 700 + R() * 1100]]], r: [[f0, R() * 360, E.linear], [f0 + l, R() * 720]] })); }
    S.shape("petals", pet);
  }
  if (w === "nightlife") {
    BS.extra.forEach((p0, i) => { if (p0[2] < 1 && p0[0] > -200 && p0[0] < 2800) { const L = S.shape(`bulb ${i}`, [group("g", [ellipse([180, 180], [0, 0]), gfill({ type: 2, s: [0, 0], e: [90, 0], stops: [[0, "#FFF6D8"], [0.25, "#FFD27A"], [1, "#FFD27A"]], alphas: [[0, 1], [0.25, 0.7], [1, 0]] })])], { parent: N.near, ks: { p: [p0[0] + (3024 - SW0) / 2, p0[1]], o: [[0, 0, E.hold], [a + 4 + i * 3, 0, E.linear], [a + 8 + i * 3, 100]] } }); L.bm = 2; } });
  }
  for (const l of ["near", "mid", "ground", "far", "sky"]) { const nm = `b2-${w}-${l}`, m = asset(S, nm); S.image(`${w} · ${l}`, nm, { parent: N[l], ks: { p: [m.x, m.y] } }); }
  // into the main comp: its image assets join the main list, the precomp is an asset of its own
  for (const as of S.assets) if (!Main.assets.find((x) => x.id === as.id)) Main.assets.push(as);
  const id = `world-${w}`; Main.assets.push({ id, layers: S.json().layers });
  return id;
}
// a precomp layer (an image layer, turned into a precomp: they share every field but w/h)
function precomp(Cm, id, nm, { ip, op, ks = {}, tt } = {}) { const L = Cm.image(nm, id, { ip, op, ks }); L.ty = 0; L.w = W; L.h = H; if (tt) L.tt = tt; return L; }

function storyB2(lang) {
  const c = COPY[lang], Cm = new Comp({ w: W, h: H, dur: F / 60, nm: `Cromatic · story B v3 · nine worlds · ${lang}` });
  const ids = {}; for (const w of Object.keys(WORLD)) ids[w] = worldComp(Cm, w, lang);
  // ---- top: grain, vignette, the end's words, the swapping line
  grain(Cm, (C2, n) => { const m = PB[n]; if (!C2.assets.find((a) => a.id === n)) { C2.asset(n, m.w, m.h, m.file); C2.assets[C2.assets.length - 1].u = "images/"; } return m; }, { o: 28, F });
  // ---- the words, on the screen (v3): over the worlds, under the grain
  // the end: the title low left, two lines, the emphasised word in the house yellow; the address on its own, tilted
  {
    const t0 = SPAN.end[0] + 10, S = Math.min(176, 940 / tw(c.end[0], 1));
    urlPill(Cm, { t0: t0 + 44, t1: F, x: 640, y: 1530, rot: -6, size: 52 });
    reveal(Cm, { text: c.end[0], size: S, x: 66, by: 1170, t0, stagger: 1.6, nm: "end · line 1" });
    reveal(Cm, { text: c.end[1], size: S, x: 66, by: 1170 + S * 0.98, t0: t0 + 10, stagger: 1.6, ink: (j) => (j >= 3 && j < 3 + c.emph.length ? C.yellow : INK), nm: "end · line 2" });
    chip(Cm, { text: "THE MULTIVERSE", x: 70, by: 1170 - S * 0.72 - 44, t0: t0 - 4, nm: "end · tag", fillHex: C.yellow });
    shade(Cm, { y0: 520, y1: H, t0: t0 - 6, t1: F + 10, a: 0.78, nm: "end · scrim" });
  }
  // each world named: low left on a chip of its colour (its number), the name out of its baseline; the crash cuts
  // smash-cut, huge and centred
  {
    const order = ["monument", "nightlife", "underwater", "circuit", "sketch", "orchid", "gta2", "riso", "ghibli"];
    const win = { monument: [26, 96], nightlife: [128, 204], underwater: [246, 318], circuit: [346, 410], sketch: [500, 552], orchid: [560, 584], gta2: [584, 608], riso: [608, 632], ghibli: [632, 670] };
    const crash = ["orchid", "gta2", "riso", "ghibli"];
    order.forEach((w, i) => {
      const [t0, t1] = win[w], nm = WORLD[w].nm, num = `${String(i + 1).padStart(2, "0")}/09`, cw = monoW(num, 26, 0.16) + 2 * 0.62 * 26;
      if (crash.includes(w)) {
        const S = Math.min(250, 960 / tw(nm, 1, -0.05)), by = 1500;
        reveal(Cm, { text: nm, size: S, x: W / 2, by, align: "center", t0, dur: 0, stagger: 0, tOut: t1 - 1, outDur: 0, outStagger: 0, tracking: -0.05, mask: false, nm: `${w} · name`, ks: { a: [W / 2, by - S * 0.36], p: [W / 2, by - S * 0.36], s: [[t0, [108, 108], EXPO], [t0 + 10, [100, 100]]] } });
        chip(Cm, { text: num, x: (W - cw) / 2, by: by - S * 0.72 - 48, t0, tOut: t1 - 1, fillHex: WORLD[w].col, ink: WORLD[w].ink, cut: true, nm: `${w} · number` });
      } else {
        const S = Math.min(150, 930 / tw(nm, 1)), by = 1600;
        reveal(Cm, { text: nm, size: S, x: 68, by, t0: t0 + 4, tOut: t1, nm: `${w} · name` });
        chip(Cm, { text: num, x: 72, by: by - S * 0.72 - 44, t0, tOut: t1, fillHex: WORLD[w].col, ink: WORLD[w].ink, nm: `${w} · number` });
      }
    });
    shade(Cm, { y0: 1080, y1: H, t0: 20, t1: SPAN.end[0] + 4, a: 0.5, nm: "names · scrim" });
  }
  // the line: "Same street." then "New ___.", the word swapping in its pill, the card the size of the line
  {
    const wOn = ["nightlife", "underwater", "circuit", "sketch", "orchid", "gta2", "riso", "ghibli"];
    const words = wOn.map((w) => [c.words[w] + ".", WORLD[w].col, WORLD[w].ink, w === "nightlife" ? SPAN[w][0] + 2 : SPAN[w][0] + (["orchid", "gta2", "riso", "ghibli"].includes(w) ? -2 : 8)]);
    swapLine(Cm, { lead: c.lead, pre: c.pre, words, S: 100, x: 72, by1: 420, tIn: 16, tOut: SPAN.end[0] - 8 });
  }
  // the vignette under the words
  Cm.shape("vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.08, H * 0.5], stops: [[0, "#000000"], [1, "#000000"]], alphas: [[0, 0], [0.55, 0], [1, 0.45]] })])], { ip: 0, op: F });
  // ---- the worlds, the last on top
  // the run of crash cuts: each world punched in (a scale hit) with a white frame
  for (const w of ["ghibli", "riso", "gta2", "orchid"]) {
    const [a, b] = SPAN[w];
    precomp(Cm, ids[w], w, { ip: a, op: b, ks: { a: [W / 2, H / 2], p: [W / 2, H / 2], s: [[a, [109, 109], [0.1, 0.9, 0.2, 1]], [a + 7, [100, 100]]] } });
    Cm.shape(`${w} · flash`, [group("f", [rect([W, H], [W / 2, H / 2]), fill(rgb("#FFFFFF"))])], { ip: a, op: a + 3, ks: { o: [[a, 70, E.linear], [a + 2, 0]] } });
  }
  // the end on Cromatic, the world we started in
  precomp(Cm, ids.monument, "monument · end", { ip: SPAN.end[0], op: F, ks: { a: [W / 2, H / 2], p: [W / 2, H / 2], s: [[SPAN.end[0], [110, 110], [0.1, 0.9, 0.2, 1]], [SPAN.end[0] + 8, [100, 100]]] } });
  Cm.shape("end · flash", [group("f", [rect([W, H], [W / 2, H / 2]), fill(rgb("#FFFFFF"))])], { ip: SPAN.end[0], op: SPAN.end[0] + 3, ks: { o: [[SPAN.end[0], 80, E.linear], [SPAN.end[0] + 2, 0]] } });
  // Sketchbook through the Multiverse pill: a window on it, tapped, opening over the frame (its outline leads)
  {
    const [a, b] = SPAN.sketch, P0 = { cx: W / 2, cy: 1080, w: 640, h: 210 }, OPEN = a + 40, OPEN1 = a + 78;
    const pillAt = (f) => { const pop = clamp((f - a) / 14), back = 1 + 2.70158 * Math.pow(pop - 1, 3) + 1.70158 * Math.pow(pop - 1, 2), op = sm(clamp((f - OPEN) / (OPEN1 - OPEN))); const w = lerp(P0.w * back, 3200, op), h = lerp(P0.h * back, 3600, op); return roundRect(P0.cx, lerp(P0.cy, H / 2, op), Math.max(2, w), Math.max(2, h), Math.max(1, Math.min(w, h) / 2)); };
    const keys = []; for (let f = a; f <= OPEN1; f += 2) keys.push([f, pillAt(f), E.linear]); keys[keys.length - 1] = [keys[keys.length - 1][0], keys[keys.length - 1][1]];
    Cm.shape("sketch · pill outline", [group("o", [shp(keys), stroke(rgb(C.black), [[a, 8, E.linear], [OPEN, 8, E.linear], [OPEN1, 22]])])], { ip: a, op: OPEN1 });
    precomp(Cm, ids.sketch, "sketch · open", { ip: OPEN1, op: b });
    Cm.shape("sketch · pill", [group("p", [shp(keys), fill(rgb("#FFFFFF"))])], { ip: a, op: OPEN1, td: true });
    precomp(Cm, ids.sketch, "sketch · in the pill", { ip: a, op: OPEN1, tt: 1 });
  }
  // Race Day by a whip: Underwater flies out to the left, Race Day in from the right, both smeared
  {
    const a = SPAN.circuit[0], WH = 10;
    const inX = (f) => W / 2 + W * 1.3 * Math.pow(1 - clamp((f - a) / WH), 2);
    precomp(Cm, ids.circuit, "circuit", { ip: a, op: SPAN.circuit[1], ks: { a: [W / 2, H / 2], p: bake(a, a + WH, (f) => ({ p: [inX(f), H / 2] })).p } });
    for (const [dx, o] of [[-110, 40], [-230, 22]]) precomp(Cm, ids.circuit, `circuit · smear ${dx}`, { ip: a, op: a + WH, ks: { a: [W / 2, H / 2], p: bake(a, a + WH, (f) => ({ p: [inX(f) - dx, H / 2] })).p, o } });
  }
  // Underwater by a flood: the water's surface (a wave) rises from the bottom over Night
  {
    const [a, b] = SPAN.underwater, rise = 28;
    const wave = (f) => { const u = sm(clamp((f - a) / rise)), y = lerp(H + 80, -120, u), ph = f * 0.35, pts = []; for (let i = 0; i <= 24; i++) { const x = -40 + (i / 24) * (W + 80); pts.push([x, y + 26 * Math.sin(ph + i * 0.9) + 14 * Math.sin(ph * 1.7 + i * 2.1)]); } pts.push([W + 40, H + 200], [-40, H + 200]); return { c: true, v: pts.map((q) => q.map((n) => +n.toFixed(1))), i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]) }; };
    const keys = []; for (let f = a; f <= a + rise + 2; f += 1) keys.push([f, wave(f), E.linear]); keys[keys.length - 1] = [keys[keys.length - 1][0], keys[keys.length - 1][1]];
    // the surface's bright line, riding the wave
    Cm.shape("underwater · surface", [group("s", [shp(keys), stroke(rgb("#DFFFFF"), 7, 85)])], { ip: a, op: a + rise + 2 });
    precomp(Cm, ids.underwater, "underwater · open", { ip: a + rise + 2, op: b });
    Cm.shape("underwater · water", [group("w", [shp(keys), fill(rgb("#FFFFFF"))])], { ip: a, op: a + rise + 2, td: true });
    precomp(Cm, ids.underwater, "underwater · rising", { ip: a, op: a + rise + 2, tt: 1 });
    // smear out Race Day's predecessor: Underwater leaves left during the whip
    const wa = SPAN.underwater[1], WH = 10;
    precomp(Cm, ids.underwater, "underwater · whip out", { ip: wa, op: wa + WH, ks: { a: [W / 2, H / 2], p: bake(wa, wa + WH, (f) => ({ p: [W / 2 - W * 1.3 * Math.pow(clamp((f - wa) / WH), 2), H / 2] })).p } });
    for (const [dx, o] of [[110, 40], [230, 22]]) precomp(Cm, ids.underwater, `underwater · smear ${dx}`, { ip: wa, op: wa + WH, ks: { a: [W / 2, H / 2], p: bake(wa, wa + WH, (f) => ({ p: [W / 2 - W * 1.3 * Math.pow(clamp((f - wa) / WH), 2) + dx, H / 2] })).p, o } });
  }
  // Night by a switch: two black frames, then the lamps
  {
    const [a, b] = SPAN.nightlife;
    Cm.shape("night · switch", [group("k", [rect([W, H], [W / 2, H / 2]), fill(rgb("#000000"))])], { ip: a, op: a + 5 });
    precomp(Cm, ids.nightlife, "nightlife", { ip: a, op: b });
  }
  precomp(Cm, ids.monument, "monument", { ip: 0, op: SPAN.monument[1] });
  const j = Cm.json(); j.cromatic = { story: "B v3", lang, dur: F / 60, worlds: SPAN };
  return j;
}

const sizes = {};
for (const lang of ["en"]) {
  const j = storyB2(lang), s = JSON.stringify(j);
  fs.writeFileSync(path.join(OUT, `story-b3-${lang}.json`), s);
  sizes[`story-b3-${lang}`] = { kb: +(s.length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, assets: j.assets.length };
}
console.table(sizes);
