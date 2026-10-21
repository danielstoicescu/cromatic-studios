// Cromatic · stories in Lottie · story A v3 (TASK-065b): "Cromatic City", English only. The shots and cameras of v2
// (a title card, the district from above with a crash zoom, a whip to street level at Two Minutes, the boot of the
// yellow ride) as they were; the words back ON the screen (the v3 gate: words rendered into the scene did not pass),
// as film titles: EVERY / BRAND stacked huge over the district, folding into a card the size of "Every brand has
// its" at street level, where the last word lands in a new place and size each time (place, 3D building, facade,
// space); COME FOR A DRIVE low left at the boot; the address on its own, tilted.
//   node buildA3.mjs (plates from v2: platesA2.json) -> story-a3-en.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { Comp, group, rect, ellipse, fill, stroke, gfill, rgb, E, prop, path as shp, rng, C } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H, T, bake, headline } from "./build.mjs";
import { cam, titleCard, urlPill, grain, grainPlates, textWidth } from "./kit2.mjs";
import { INK, EXPO, reveal, typed, chip, shade, tw, monoW } from "./kit3.mjs";
import { A2, bootCar } from "./shotsA2.mjs";
import { SHOTS } from "./shots.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, ".."), IMG = path.join(OUT, "images");
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/rawA2";
const PJ = path.join(here, "platesA2.json");
// ---- plates (once): the overhead's two lenses (ground opaque, what stands on it cut out), the boot shot, the ride
if (false) { // (the plates are v2's: PLATES=1 node buildA2.mjs)
  const plates = {}, boot = [];
  const write = async (name, file, { opaque = false, crop = true, at = [0, 0], q = 84 } = {}) => {
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = 0, y0 = 0, x1 = info.width - 1, y1 = info.height - 1;
    if (crop) { x0 = info.width; y0 = info.height; x1 = -1; y1 = -1; for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 < 0) return null; x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(info.width - 1, x1 + 3); y1 = Math.min(info.height - 1, y1 + 3); }
    let s = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
    if (opaque) s = s.removeAlpha();
    await s.webp({ quality: q, alphaQuality: 90, effort: 4 }).toFile(path.join(IMG, name + ".webp"));
    plates[name] = { file: name + ".webp", x: at[0] + x0, y: at[1] + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    return name;
  };
  for (const i of [0, 1]) { await write(`a2-over-${i}-ground`, `${RAW}/over-${i}-ground.png`, { opaque: true, crop: false }); await write(`a2-over-${i}-up`, `${RAW}/over-${i}-up.png`); }
  await write("a2-boot-plate", `${RAW}/boot-plate.png`, { opaque: true, crop: false });
  const J = JSON.parse(fs.readFileSync(`${RAW}/a2.json`, "utf8"));
  for (let i = 0; i < J.boot.length; i++) { const r = J.boot[i]; boot.push(r ? await write(`a2-boot-car-${String(i).padStart(3, "0")}`, `${RAW}/boot-car-${String(i).padStart(3, "0")}.png`, { at: [r[0], r[1]], q: 82 }) : null); }
  fs.writeFileSync(PJ, JSON.stringify({ plates, boot }));
}
const PA = JSON.parse(fs.readFileSync(PJ, "utf8")), PL1 = JSON.parse(fs.readFileSync(path.join(here, "plates.json"), "utf8"));
const PL = { ...PA.plates, ...PL1.plates };
await grainPlates(PL);
const K = 0.5, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sm = (t) => t * t * (3 - 2 * t), easeOut = (t) => 1 - Math.pow(1 - t, 3);
const F = 840, SP = { title: [0, 56], over: [56, 222], street: [212, 566], boot: [556, F] };
const COPY = {
  en: { title: [["CROMATIC", null], ["CITY.", "CITY"]], kicker: "POP. 50+ BRANDS", over: ["Every", "brand", "has its"], card: "Every brand has its", words: ["place.", ["3D", "building."], "facade.", "space."], road: ["Come for", "a drive."], emph: "drive" }
};
function asset(Cm, name) { const m = PL[name]; if (!m) throw new Error("no plate " + name); if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; } return m; }
const img = (Cm, name, parent, { ip, op, o, dx = 0, nm } = {}) => { const m = asset(Cm, name); return Cm.image(nm || name, name, { parent, ip, op, ks: { p: [m.x + dx, m.y], ...(o != null ? { o } : {}) } }); };

// the street (the pilot's a-street layers): its camera's moves, as in v1, a little bolder
const AS = PL1.shots["a-street"].main, f2 = AS.f, YH = AS.horizon, CAMY = AS.camY, SW0 = 2592;
const fullW = (l) => (l === "near" ? 3024 : l === "ground" ? 3888 : 2592);
const LZ = { near: 125, mid: 380, far: 1200 };
const st = (f) => (f - SP.street[0]) / 60;
const Tf = (t) => lerp(-4.5, 4.5, clamp(t / 6)), Df = (t) => 6 * (1 - easeOut(clamp(t / 2.4))), Zf = (t) => lerp(1, 1.09, sm(clamp(t / 6)));
function xf(l, t) {
  const Tm = Tf(t), Dm = Df(t), Zm = Zf(t), h = CAMY - 0.5, P0 = [fullW(l) / 2, YH], Pc = [W / 2, YH * K];
  if (l === "ground") return { a: P0, p: Pc, s: [100 * K * Zm, 100 * K * Zm * (1 + Dm / h)], sk: (Math.atan(Tm / (h + Dm)) * 180) / Math.PI };
  if (l === "sky") return { a: P0, p: Pc, s: [100 * K * Zm, 100 * K * Zm] };
  return { a: P0, p: [Pc[0] + K * Zm * ((-Tm * f2) / LZ[l]), Pc[1] + K * Zm * ((Dm * f2) / LZ[l])], s: [100 * K * Zm, 100 * K * Zm] };
}
const Pst = cam({ ...SHOTS["a-street"] }), Pover = A2.over.fovs.map((fov) => cam({ ...A2.over, fov })), Pboot = cam(A2.boot);

function storyA2(lang) {
  const c = COPY[lang], Cm = new Comp({ w: W, h: H, dur: F / 60, nm: `Cromatic · story A v3 · Cromatic City · ${lang}` });
  // ---- nulls: the overhead (a slow turn, then the crash zoom into the second lens), the street's layers, the boot
  const [o0, o1] = SP.over;
  const Z = (f) => f < o1 - 40 ? lerp(1.0, 1.25, (f - o0) / (o1 - 40 - o0)) : lerp(1.25, 3.4, Math.pow(clamp((f - (o1 - 40)) / 22), 1.8));
  const ROT = (f) => lerp(-7, 5, clamp((f - o0) / (o1 - o0)));
  const whipOut = (f, b) => (f > b - 6 ? -W * 1.3 * Math.pow((f - (b - 6)) / 6, 2) : 0), whipIn = (f, a) => (f < a + 6 ? W * 1.3 * Math.pow(1 - (f - a) / 6, 2) : 0);
  const overN = Cm.nul("overhead", { ip: o0, op: o1, ks: { a: [1080, 1920], ...(() => { const k = bake(o0, o1, (f) => ({ p: [W / 2 + whipOut(f, o1), H / 2], s: [50 * Z(f), 50 * Z(f)], r: ROT(f) })); return { p: k.p, s: k.s, r: k.r }; })() } });
  const lens1 = Cm.nul("overhead · lens 1", { parent: overN, ip: o0, op: o1, ks: { a: [1080, 1920], p: [1080, 1920], s: [50, 50] } });
  const [s0, s1] = SP.street, N = {};
  const shakeN = Cm.nul("street · whips", { ip: s0, op: s1, ks: { a: [W / 2, H / 2], p: bake(s0, s1, (f) => ({ p: [W / 2 + whipIn(f, s0) + whipOut(f, s1), H / 2] })).p } });
  for (const l of ["sky", "far", "ground", "mid", "near"]) {
    const k = bake(s0, s1, (f) => { const x = xf(l, st(f)); return { p: x.p, s: x.s, ...(x.sk != null ? { sk: x.sk } : {}) }; });
    N[l] = Cm.nul(`street · ${l}`, { parent: shakeN, ip: s0, op: s1, ks: { a: xf(l, 0).a, p: k.p, s: k.s } });
    if (k.sk != null) { N[l].ks.sk = prop(k.sk); N[l].ks.sa = prop(0); }
  }
  const [b0, b1] = SP.boot;
  const bootN = Cm.nul("boot", { ip: b0, op: b1, ks: { a: [1080, 1920], p: bake(b0, b1, (f) => { const t = (f - b0) / 60, sk = Math.exp(-Math.max(0, t - 0.55) * 4) * (t > 0.5 ? 7 : 1.2); return { p: [W / 2 + whipIn(f, b0) + sk * Math.sin(f * 1.9), H / 2 + sk * Math.cos(f * 1.3)] }; }).p, s: bake(b0, b1, (f) => ({ s: [50 * lerp(1.0, 1.08, clamp((f - b0) / (b1 - b0))), 50 * lerp(1.0, 1.08, clamp((f - b0) / (b1 - b0)))] })).s } });

  // ---- top: grain, vignette, the address, the title card, the line's card
  grain(Cm, asset, { o: 30, F });
  urlPill(Cm, { t0: b0 + 95, t1: F, x: W / 2 + 20, y: 300, rot: -8, size: 60 });
  titleCard(Cm, { t0: 0, t1: SP.title[1], lines: c.title, size: lang === "ro" ? 168 : 186, bg: "#0A0A0A", ink: C.yellow, emphInk: C.white, kicker: c.kicker, x: 70, y: 1020 });
  // ---- the words, on the screen (v3): over the shots, under the grain
  // the boot: COME FOR / A DRIVE low left, the emphasised word in the house yellow
  {
    const S = 186, by = 1440;
    reveal(Cm, { text: c.road[0], size: S, x: 66, by, t0: b0 + 16, stagger: 1.6, nm: "boot · come for" });
    reveal(Cm, { text: c.road[1], size: S, x: 66, by: by + S * 0.98, t0: b0 + 26, stagger: 1.6, ink: (j) => (j >= 2 && j < 2 + c.emph.length ? C.yellow : INK), nm: "boot · a drive" });
    shade(Cm, { y0: 1000, y1: H, t0: b0 + 8, t1: F + 10, a: 0.6, nm: "boot · scrim" });
  }
  // the street: the card the size of "Every brand has its", high left; the last word lands somewhere new each time
  {
    const [p1, p2, p3, p4] = [s0 + 40, s0 + 128, s0 + 206, s0 + 270], out = [p2 - 6, p3 - 6, p4 - 6, s1 - 14];
    // 1 · place: low left, the biggest
    reveal(Cm, { text: c.words[0], size: 290, x: 60, by: 1620, t0: p1, tOut: out[0], stagger: 1.8, nm: "word 1 · place" });
    // 2 · 3D building: low right, two sizes
    reveal(Cm, { text: c.words[1][0], size: 330, x: 1012, by: 1420, align: "right", t0: p2, tOut: out[1], stagger: 2.5, nm: "word 2 · 3D" });
    reveal(Cm, { text: c.words[1][1], size: 150, x: 1008, by: 1600, align: "right", t0: p2 + 8, tOut: out[1] + 2, stagger: 1.2, nm: "word 2 · building" });
    // 3 · facade: on Two Minutes' front, set like its sign (small: the one word that whispers)
    reveal(Cm, { text: c.words[2], size: 118, x: 532, by: 842, align: "center", t0: p3, tOut: out[2], stagger: 1.4, ink: "#0B0B0F", nm: "word 3 · facade" });
    // 4 · space: in the sky, wide apart, letter by letter
    reveal(Cm, { text: c.words[3], size: 168, x: W / 2, by: 640, align: "center", tracking: 0.32, t0: p4, tOut: out[3], stagger: 5, dur: 34, nm: "word 4 · space" });
    shade(Cm, { y0: 1050, y1: H, t0: p1 - 6, t1: out[1] + 24, a: 0.52, nm: "street · scrim" });
    shade(Cm, { y0: 0, y1: 1000, t0: p4 - 8, t1: out[3] + 20, a: 0.5, from: "top", nm: "sky · scrim" });
    // the card
    const S = 70, x = 76, by = 330, w = tw(c.card, S, -0.03) + 2 * 30, h = S * 1.5, t0 = s0 + 18, t1 = s1 - 8;
    reveal(Cm, { text: c.card, size: S, x, by, t0: t0 + 6, tOut: t1 - 12, tracking: -0.03, stagger: 0.9, nm: "line · card words", ks: { r: -2.5, a: [x - 30, by - S * 0.36], p: [x - 30, by - S * 0.36] } });
    Cm.shape("line · card", [group("card", [rect([w, h], [x - 30 + w / 2, by - S * 0.36], 22), fill(rgb("#0B0B0F"), 92)])], { ip: t0, op: t1, ks: { a: [x - 30, by - S * 0.36], p: [[t0, [x - 70, by - S * 0.36], [0.2, 1.15, 0.3, 1]], [t0 + 20, [x - 30, by - S * 0.36], E.hold], [t1 - 8, [x - 30, by - S * 0.36], EXPO], [t1, [x - 30, by - S * 0.36 - 30]]], r: [[t0, -7, [0.2, 1.2, 0.3, 1]], [t0 + 22, -2.5]], o: [[t0, 0, E.linear], [t0 + 6, 100, E.hold], [t1 - 6, 100, E.linear], [t1, 0]] } });
  }
  // the overhead: EVERY / BRAND stacked huge, HAS ITS after them; out as the crash zoom starts
  {
    const tO = o1 - 44;
    typed(Cm, { text: c.kicker, size: 28, x: 74, by: 520, t0: o0 + 4, tOut: tO, rate: 1, ink: C.black, nm: "over · kicker" });
    reveal(Cm, { text: c.over[0], size: 270, x: 60, by: 790, t0: o0 + 8, tOut: tO, stagger: 2, ink: "#0B0B0F", nm: "over · every" });
    reveal(Cm, { text: c.over[1], size: 270, x: 60, by: 790 + 262, t0: o0 + 18, tOut: tO + 3, stagger: 2, ink: "#0B0B0F", nm: "over · brand" });
    reveal(Cm, { text: c.over[2], size: 140, x: 66, by: 790 + 262 + 190, t0: o0 + 32, tOut: tO + 6, stagger: 1.6, ink: "#0B0B0F", nm: "over · has its" });
  }
  // the vignette under the words
  Cm.shape("vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.08, H * 0.5], stops: [[0, "#120A1C"], [1, "#120A1C"]], alphas: [[0, 0], [0.55, 0], [1, 0.5]] })])], { ip: 0, op: F });
  // ---- the boot shot: COME FOR A DRIVE painted on the road ahead, the ride pulling away over it
  {
    const camO = A2.boot, cpos = camO.pos, fwd = (() => { const dx = camO.tgt[0] - cpos[0], dz = camO.tgt[2] - cpos[2], n = Math.hypot(dx, dz); return [dx / n, dz / n]; })(), right = [-fwd[1], fwd[0]];
    PA.boot.forEach((name, i) => { if (!name) return; const f0 = b0 + i * 2, last = i === PA.boot.length - 1; if (f0 >= b1) return; const L = img(Cm, name, bootN, { ip: f0, op: last ? f0 + 14 : Math.min(b1, f0 + 2), nm: `ride · ${i}` }); if (last) L.ks.o = prop([[f0, 100, E.linear], [f0 + 12, 0]]); });
    // its contact shadow on the road (the plate was drawn without the ride): a soft dark ellipse under its body
    { const fEnd = b0 + PA.boot.length * 2 + 12;
      const sh = bake(b0, fEnd, (f) => { const t = (f - b0) / 60, q = bootCar(t), L = Pboot([q.x - 11, 1.02, q.z - 6]), R = Pboot([q.x - 11, 1.02, q.z + 6]), M = Pboot([q.x, 1.02, q.z]), w = Math.abs(R[0] - L[0]) * 1.25; return { p: [M[0], M[1]], s: [w, Math.max(4, w * 0.22)] }; });
      const S2 = Cm.shape("ride · shadow", [group("s", [ellipse([1, 1], [0, 0]), gfill({ type: 2, s: [0, 0], e: [0.5, 0], stops: [[0, "#2A1A22"], [1, "#2A1A22"]], alphas: [[0, 0.55], [1, 0]] })])], { parent: bootN, ip: b0, op: fEnd, ks: { p: sh.p, s: sh.s.map(([t, v, e]) => [t, [v[0] * 100, v[1] * 100], e]), o: [[fEnd - 14, 100, E.linear], [fEnd - 2, 0]] } }); }
    img(Cm, "a2-boot-plate", bootN, { ip: b0, op: b1 });
    for (const [dx, o] of [[-110, 40], [-230, 22]]) img(Cm, "a2-boot-plate", bootN, { ip: b0, op: b0 + 6, o, dx, nm: `boot · smear ${dx}` });
  }

  // ---- the street: the word where it means (the road, Two Minutes' facade twice, the sky)
  {
    const [p1, p2, p3, p4] = [s0 + 40, s0 + 128, s0 + 206, s0 + 270], out = [p2 - 4, p3 - 4, p4 - 4, s1 - 12];
    const camO = SHOTS["a-street"], cpos = camO.pos, fwd = (() => { const dx = camO.tgt[0] - cpos[0], dz = camO.tgt[2] - cpos[2], n = Math.hypot(dx, dz); return [dx / n, dz / n]; })(), right = [-fwd[1], fwd[0]];
    const offG = (fullW("ground") - SW0) / 2;
    // the festoon's bulbs come on
    AS.extra.forEach((b, i) => { if (b[1] > -50 && b[1] < 3900) { const L = Cm.shape(`bulb ${i}`, [group("g", [ellipse([160, 160], [0, 0]), gfill({ type: 2, s: [0, 0], e: [80, 0], stops: [[0, "#FFF6D8"], [0.25, "#FFD27A"], [1, "#FFD27A"]], alphas: [[0, 1], [0.25, 0.7], [1, 0]] })])], { parent: N.mid, ip: s0, op: s1, ks: { p: [b[0], b[1]], o: [[0, 0, E.hold], [s0 + 30 + i * 4, 0, E.linear], [s0 + 34 + i * 4, 85]] } }); L.bm = 2; } });
    for (const l of ["near", "mid", "ground", "far", "sky"]) img(Cm, `a-street-${l}`, N[l], { ip: s0, op: s1 });
  }

  // ---- the overhead: the line painted across the streets (under the roofs and the trees), its two lenses
  {
    img(Cm, "a2-over-1-up", lens1, { ip: o0, op: o1 }); img(Cm, "a2-over-0-up", overN, { ip: o0, op: o1 });
    img(Cm, "a2-over-1-ground", lens1, { ip: o0, op: o1 }); img(Cm, "a2-over-0-ground", overN, { ip: o0, op: o1 });
  }
  Cm.shape("ground", [group("g", [rect([W, H], [W / 2, H / 2]), fill(rgb("#0A0A0A"))])]);
  const j = Cm.json(); j.cromatic = { story: "A v3", lang, dur: F / 60, spans: SP };
  return j;
}
const sizes = {};
for (const lang of ["en"]) {
  const j = storyA2(lang), s = JSON.stringify(j);
  fs.writeFileSync(path.join(OUT, `story-a3-${lang}.json`), s);
  sizes[`story-a3-${lang}`] = { kb: +(s.length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, assets: j.assets.length };
}
console.table(sizes);
