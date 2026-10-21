// Cromatic · stories in Lottie · story D (TASK-066): "around the city" (Daniel: "inca un story unde vedem ce se
// intampla prin oras: locatiile, cum deschizi portofoliul, si povestea cu vehiculele refacuta, tot in Lottie").
// 1080 x 1920, 60 fps, 16.5 s, English. The city from the site's own engine (render-d.mjs -> plates-d.mjs), the site's
// own UI for the portfolio beat (capture-ui-d.mjs), the camera of a film: an overhead, crash zooms, whip pans, low
// angles, held wides with the action crossing them; grain, weave, flicker. The type is on the screen, as film titles
// (Daniel, 21 Oct: text set into the scene read as unfinished): each line rises through its own slot and leaves the
// same way, cards hug their words (a black label, a white card, a cream card, the yellow pill, a red and blue one),
// sizes and places change with every beat; the cromaticstudios.com pill on its own, tilted.
//   0.00 the roundabout straight down: three rides go round; "Our portfolio has traffic."; a crash zoom on the yellow
//        ride; a whip pan
//   1.87 "Every client gets a" + a black card whose word swaps with the cut: corner. (Yoshi, low) / skyline.
//        (Investimental, from its foot, turning) / facade. (The Aesthetic Court, dead centre, a sweep of light); crash zoom
//   5.07 the place card rises (the site's own), "Knock knock." (two taps), the pill opens on the case page (the site's
//        own transition: sideways, then up and down, the Multiverse ring), "Come in.", a crash scroll to the bench
//   8.80 nine rides at night, a cut each, a verb each
//  13.30 the roundabout at night, held; the yellow ride goes round; the last line; the pill
//   node build-d.mjs  -> ../story-d-en.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp } from "../../../../intro-lottie/_source/lib/lottie.mjs";
import { roundRect } from "../../../../intro-lottie/_source/lib/lottie.mjs";
import { W, H, K, T, clamp, lerp, smooth, easeOut, easeIn, easeInOut, ramp, backOut, rng, bake, holdKeys, monoLine, grain, weave, flicker, vignette, glowShape, textWidth, group, rect, ellipse, fill, gfill, stroke, rgb, E, prop, shp, poly, C, uiLine } from "./lib-d.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const P = JSON.parse(fs.readFileSync(path.join(here, "platesD.json"), "utf8"));
const S = P.shots;
const YEL = "#FED012", PLUM = "#3b2b44", NIGHT = "#0E1430", WARM = "#FFE2A6";

/* ======================= the words (Mira; house style: no em dashes, one idea a line) ======================= */
const COPY = {
  traffic: ["Our portfolio", "has", "traffic."],
  head: "Every client gets a",
  swaps: ["corner.", "skyline.", "facade."],
  caps: ["YOSHI IZAKAYA · COFFEE STREET", "INVESTIMENTAL · FINTECH BOULEVARD", "THE AESTHETIC COURT · MEDICAL AVENUE"],
  knock: ["Knock", "knock."],
  kicker: "THE AESTHETIC COURT · CASE PAGE",
  come: "Come in.",
  verbs: ["Drive.", "Snoop.", "Overtake.", "Pass Go.", "Fly low.", ["Slip", "through."], "Pour.", "Pull over.", "Dive."],
  end: ["We saved you", "a corner."]
};

/* ======================= the clock (frames at 60) ======================= */
const T1 = { over: [0, 112], yoshi: [112, 178], inv: [178, 238], tac: [238, 392], page: [358, 528], end: [798, 990] };
const RIDES = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9"], R0 = 528, RD = 30;
RIDES.forEach((id, i) => (T1[id] = [R0 + i * RD, R0 + (i + 1) * RD]));
const F = 990, DUR = F / 60;
const CARD = 304, KNOCK = [324, 340], OPEN = 358, OPEND = 29, SCROLL = [420, 458], WHIPD = 6;

/* ======================= plates ======================= */
let Cm;
function asset(name) {
  const m = P.plates[name]; if (!m) throw new Error("no plate " + name);
  if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; }
  return name;
}
const img = (name, parent, { ip, op, p, s, o, nm, r, a } = {}) => { const m = P.plates[name]; asset(name); return Cm.image(nm || name, name, { ip, op, parent, ks: { p: p || [m.x, m.y], ...(s != null ? { s: Array.isArray(s) ? s : [s, s] } : {}), ...(o != null ? { o } : {}), ...(r != null ? { r } : {}), ...(a ? { a } : {}) } }); };
const wholeOf = (id) => P.plates[`d-${id}-L0`].full;

/* ======================= cameras ======================= */
// a shot's camera at frame t: the plate point at the frame's centre (a), the zoom z (1: the plate fills the frame at
// K), a roll r (deg), an offset in story px (whips). The null carries it; the plate and all in it are its children
const camNull = (nm, ip, op, fn, parent) => {
  const k = bake(ip, op, (t) => { const c = fn(t); return { a: c.a, p: [W / 2 + (c.dx || 0), H / 2 + (c.dy || 0)], s: [100 * K * c.z, 100 * K * c.z], r: c.r || 0 }; });
  return Cm.nul(nm, { ip, op: op + 1, parent, ks: { a: k.a, p: k.p, s: k.s, r: k.r } });
};
// whips: out, the scene leaves (dir: [-1, 0] to the left, [0, -1] up); in, it arrives from the other side
const D_WHIP = 1150;
const whipOut = (t, t1, dir) => { const u = ramp(t, t1 - WHIPD, t1, easeIn); return [dir[0] * D_WHIP * u, dir[1] * D_WHIP * u]; };
const whipIn = (t, t0, dir) => { const u = 1 - ramp(t, t0, t0 + WHIPD, easeOut); return [-dir[0] * D_WHIP * u, -dir[1] * D_WHIP * u]; };
const smearO = (t0in, t1out) => { const k = [[0, 0, E.hold]]; if (t0in != null) k.push([t0in, 100, E.linear], [t0in + 3, 100, E.linear], [t0in + WHIPD, 0, E.hold]); if (t1out != null) k.push([t1out - WHIPD + 1, 0, E.linear], [t1out - 2, 100, E.hold]); k.sort((a, b) => a[0] - b[0]); k[k.length - 1] = [k[k.length - 1][0], k[k.length - 1][1]]; return k; };

/* ======================= the story ======================= */
function story() {
  const c = COPY, lang = "en";
  Cm = new Comp({ w: W, h: H, dur: DUR, nm: `Cromatic · story D · around the city · ${lang}` });
  // ---------- nulls first (no picture of their own) ----------
  const WV = weave(Cm, { amp: 1.4 });
  const N = {};
  // 1 · the overhead: a slow turn, a crash zoom that locks on the yellow ride, a whip out to the left
  const OV = S.over, ovC = OV.pts.c, ovR = Math.hypot(OV.pts.e[0] - ovC[0], OV.pts.e[1] - ovC[1]);
  const ring = (th) => [ovC[0] - ovR * Math.cos(th), ovC[1] - ovR * Math.sin(th)];
  const rides = [
    { id: "dacia1300", th0: 2.9, w: 1.55 },
    { id: "f1", th0: 5.65, w: 2.4 },
    { id: "groovy", th0: 0.75, w: 1.05 }
  ];
  const rideAt = (rd, t) => { const th = rd.th0 - rd.w * (t / 60), p = ring(th), d = [-Math.sin(th), Math.cos(th)]; return { p, r: (Math.atan2(d[1], d[0]) * 180) / Math.PI + 90 }; };
  const ovZ0 = 86, ovZ1 = 98, ovZ = 2.75;
  const ovBase = (t) => ({ z: lerp(1.0, 1.1, ramp(t, 0, ovZ0, (u) => u)), r: lerp(-4, 3, t / 112) });
  N.over = camNull("camera · overhead", 0, T1.over[1], (t) => {
    const b = ovBase(t), cz = ramp(t, ovZ0, ovZ1 + 6, (u) => backOut(u, 1.2)), cu = ramp(t, ovZ0, ovZ1, easeOut);
    const w = whipOut(t, T1.over[1], [-1, 0]);
    if (t < ovZ0) return { a: ovC, z: b.z, r: b.r, dx: w[0], dy: w[1] };
    // (the ride's point, where the base camera shows it; then to the middle, the zoom on top)
    const D = rideAt(rides[0], t).p, rr = (b.r * Math.PI) / 180, v = [(D[0] - ovC[0]) * K * b.z, (D[1] - ovC[1]) * K * b.z];
    const sb = [v[0] * Math.cos(rr) - v[1] * Math.sin(rr), v[0] * Math.sin(rr) + v[1] * Math.cos(rr)];
    return { a: D, z: lerp(b.z, ovZ, cz), r: b.r, dx: sb[0] * (1 - cu) + w[0], dy: sb[1] * (1 - cu) + w[1] };
  }, WV);
  const ovLens = Cm.nul("overhead · lens 1", { parent: N.over, ip: 0, op: T1.over[1] + 1, ks: { a: [OV.o.w / 2, OV.o.h / 2], p: [OV.o.w / 2, OV.o.h / 2], s: [100 / 2.6, 100 / 2.6] } });
  // 2 · Yoshi: a push, the Dutch tilt easing; whips in from the right, out to the left
  const day = (id, { z0 = 1, z1 = 1.08, r0 = 0, r1 = 0, inDir, outDir }) => camNull(`camera · ${id}`, T1[id][0], T1[id][1], (t) => {
    const [a, b] = T1[id], u = (t - a) / (b - a), wi = inDir ? whipIn(t, a, inDir) : [0, 0], wo = outDir ? whipOut(t, b, outDir) : [0, 0];
    return { a: [wholeOf(id)[0] / 2, wholeOf(id)[1] / 2], z: lerp(z0, z1, u), r: lerp(r0, r1, u), dx: wi[0] + wo[0], dy: wi[1] + wo[1] };
  }, WV);
  N.yoshi = day("yoshi", { z0: 1.0, z1: 1.09, r0: 1.2, r1: -0.4, inDir: [-1, 0], outDir: [-1, 0] });
  N.inv = day("inv", { z0: 1.0, z1: 1.06, r0: -2, r1: 6, inDir: [-1, 0], outDir: [0, -1] });
  // 4 · the Court: from below (the tilt down), held, then the crash zoom on its door; the card comes over it
  const tacF = [1080, 2060], tZ0 = 288, tZ1 = 298;
  N.tac = camNull("camera · court", T1.tac[0], T1.tac[1], (t) => {
    const wi = whipIn(t, T1.tac[0], [0, -1]), b = lerp(1.0, 1.04, ramp(t, T1.tac[0], tZ0, (u) => u)), cz = ramp(t, tZ0, tZ1 + 6, (u) => backOut(u, 1.25));
    const z = lerp(b, 2.2, cz) * lerp(1, 1.03, ramp(t, tZ1 + 6, T1.tac[1], (u) => u)), cu = ramp(t, tZ0, tZ1, easeOut);
    const a = [lerp(1080, tacF[0], cu), lerp(1920, tacF[1], cu)], off = [(a[0] - 1080) * K * b, (a[1] - 1920) * K * b];
    return { a, z, dx: wi[0] + off[0] * (1 - cu), dy: wi[1] + off[1] * (1 - cu) };
  }, WV);
  const tacK = Math.tan((S.tac.lenses[0] * Math.PI) / 360) / Math.tan((S.tac.lenses[1] * Math.PI) / 360);
  const tacLens = Cm.nul("court · lens 1", { parent: N.tac, ip: T1.tac[0], op: T1.tac[1] + 1, ks: { a: [1080, 1920], p: [1080, 1920], s: [100 / tacK, 100 / tacK] } });
  // the rides: a snap in (the lens settling from 1.1), a slow push; r1 whips in from the page, r5 tilts up into the sky
  // (dolly: a sideways travel in story px; shake: a hand-held jolt at the cut, dying away)
  const rideCam = (id, { snap = 1.1, push = 1.04, inDir, outDir, r0 = 0, r1 = 0, still = false, dolly = [0, 0], shake = 0, sn = 8 } = {}) => camNull(`camera · ${id}`, T1[id][0], T1[id][1], (t) => {
    const [a, b] = T1[id], u = (t - a) / (b - a), wi = inDir ? whipIn(t, a, inDir) : [0, 0], wo = outDir ? whipOut(t, b, outDir) : [0, 0];
    const z = still ? 1 : lerp(snap, 1, ramp(t, a, a + sn, easeOut)) * lerp(1, push, u);
    const k = shake * Math.exp(-(t - a) / 9), sh = [k * Math.sin(t * 2.7), k * 0.7 * Math.cos(t * 3.3)];
    return { a: [1080, 1920], z, r: lerp(r0, r1, u) + k * 0.06 * Math.sin(t * 1.9), dx: wi[0] + wo[0] + lerp(dolly[0], dolly[1], u) + sh[0], dy: wi[1] + wo[1] + sh[1] };
  }, WV);
  N.r1 = rideCam("r1", { inDir: [-1, 0], snap: 1.0, push: 1.06 });
  N.r2 = rideCam("r2", { snap: 1.12, r0: -5, r1: -2, dolly: [150, -150] });
  N.r3 = rideCam("r3", { still: true });
  N.r4 = rideCam("r4", { snap: 1.4, sn: 6, outDir: [-1, 0] });
  N.r5 = rideCam("r5", { inDir: [-1, 0], snap: 1.0, push: 1.05, r0: 0, r1: 8 });
  N.r6 = rideCam("r6", { snap: 1.15, push: 1.0, r0: -4, r1: 10 });
  N.r7 = rideCam("r7", { snap: 1.0, push: 1.06, dolly: [200, -200] });
  N.r8 = rideCam("r8", { snap: 1.3, sn: 6, push: 1.03, shake: 16 });
  N.r9 = rideCam("r9", { snap: 1.0, push: 1.07, r0: -3, r1: 2 });
  N.end = camNull("camera · end", T1.end[0], T1.end[1], (t) => ({ a: [1080, 1920], z: lerp(1.0, 1.025, ramp(t, T1.end[0], T1.end[1], (u) => u)) }), WV);
  // the page (story space, its own null for the scroll and the whip out)
  const ui = S["ui-" + lang], pageDPR = 1080 / 390, SY = ui.scrollTo;
  const scrollY = (t) => SY * ramp(t, SCROLL[0], SCROLL[1], (u) => (u < 0.5 ? 16 * u ** 5 : 1 - Math.pow(-2 * u + 2, 5) / 2));
  const pageN = Cm.nul("page · scroll", { parent: WV, ip: T1.page[0], op: T1.page[1] + 1, ks: (() => { const k = bake(T1.page[0], T1.page[1], (t) => { const w = whipOut(t, T1.page[1], [-1, 0]), z = lerp(1, 1.035, ramp(t, SCROLL[1], T1.page[1] - 6, (u) => u)); return { p: [W / 2 + w[0], H / 2 - scrollY(t) * z + w[1] + (z - 1) * 0], s: [100 * z, 100 * z] }; }); return { a: [W / 2, H / 2], p: k.p, s: k.s }; })() });

  // ================= the picture, top to bottom =================
  // ---------- the film over everything ----------
  grain(Cm, asset, { o: (t) => (t >= T1.page[1] ? 40 : 32) });

  // ---------- the end: the pill (on its own, tilted), the mark ----------
  {
    const t0 = 900, url = "cromaticstudios.com", us = 66, Lu = uiLine(T, url, us, "#000000", 0, 0, { tracking: -0.02 }), uw = Lu.width + us * 1.25, uh = us * 1.62;
    const cx = W / 2 + 30, cy = 610;
    Cm.shape("end · pill", [group("text", Lu.groups, { p: [-Lu.width / 2, us * 0.36] }), group("pill", [rect([uw, uh], [0, 0], 9999), stroke(rgb("#000000"), 5), fill(rgb(YEL))])], {
      ip: t0, ks: { p: [[t0, [cx, cy + 60], [0.2, 1.3, 0.3, 1]], [t0 + 26, [cx, cy]]], s: [[t0, [30, 30], [0.25, 1.5, 0.4, 1]], [t0 + 22, [100, 100]]], r: [[t0, -16, [0.2, 1.4, 0.35, 1]], [t0 + 28, -6]], o: [[t0, 0, E.linear], [t0 + 5, 100]] }
    });
    Cm.shape("end · pill shadow", [group("s", [rect([uw, uh], [0, 0], 9999), fill(rgb("#000000"), 45)])], { ip: t0 + 2, ks: { p: [[t0 + 2, [cx + 10, cy + 74], [0.2, 1.3, 0.3, 1]], [t0 + 28, [cx + 10, cy + 14]]], s: [[t0 + 2, [30, 30], [0.25, 1.5, 0.4, 1]], [t0 + 24, [100, 100]]], r: [[t0 + 2, -16, [0.2, 1.4, 0.35, 1]], [t0 + 30, -6]], o: [[t0 + 2, 0, E.linear], [t0 + 8, 100]] } });
    // the mark, small, top left
    const t1 = 912, L = uiLine(T, "Cromatic Studios", 38, "#ffffff", 72 + 40, 262, { tracking: -0.02 });
    Cm.shape("end · mark", [group("name", L.groups), group("dot", [ellipse([24, 24], [72 + 12, 262 - 13]), stroke(rgb("#000000"), 3), fill(rgb(YEL))])], { ip: t1, ks: { o: [[t1, 0, E.linear], [t1 + 14, 100]] } });
  }

  // ---------- the type: film titles on the screen ----------
  const CAP = (size) => (T.cap / T.upm) * size, EXPO = [0.16, 1, 0.3, 1], IN = [0.7, 0, 0.84, 0];
  // a line of type. from "below" (the default) or "above": it rises (drops) through its own slot, an alpha matte the
  // size of its line, letter after letter, and leaves the same way, upward; "left": it slides in from the left and out
  // to the right; "slam": it lands from big. Returns its width and left edge (for the cards)
  function kline(nm, text, { x, y, size, color = "#ffffff", t0, tOut, align = "left", stagger = 1, dur = 16, from = "below", track = -0.035, outDur = 10, slot = true }) {
    const w = textWidth(text, size, track), x0 = align === "left" ? x : align === "right" ? x - w : x - w / 2;
    const n = [...text].filter((ch) => ch !== " ").length, end = tOut != null ? Math.round(tOut + n * stagger * 0.5 + outDur + 2) : F;
    const tr = (from === "above" ? -1 : 1) * 1.25 * size, slotted = slot && (from === "below" || from === "above");
    const L = uiLine(T, text, size, color, x0, y, { tracking: track, keys: (b, s, j) => {
      const ta = Math.round(t0 + j * stagger), to = tOut != null ? Math.round(tOut + j * stagger * 0.5) : null, H1 = to != null ? [E.hold] : [];
      if (from === "slam") return { p: b, s: [[ta, [s * 1.8, s * 1.8], EXPO], [ta + 9, [s, s]]], o: [[0, 0, E.hold], [ta, 0, E.linear], [ta + 2, 100, ...H1], ...(to != null ? [[to, 100, E.linear], [to + 6, 0]] : [])] };
      if (from === "left") {
        const p = [[ta, [b[0] - 700, b[1]], EXPO], [ta + dur, b, ...H1]]; if (to != null) p.push([to, b, IN], [to + outDur, [b[0] + 700, b[1]]]);
        return { p, o: [[0, 0, E.hold], [ta, 0, E.linear], [ta + 3, 100, ...H1], ...(to != null ? [[to + outDur - 3, 100, E.linear], [to + outDur, 0]] : [])] };
      }
      const p = [[ta, [b[0], b[1] + tr], EXPO], [ta + dur, b, ...H1]]; if (to != null) p.push([to, b, IN], [to + outDur, [b[0], b[1] - tr]]);
      return { p };
    } });
    if (slotted) { const top = y - CAP(size) * 1.35, bot = y + size * 0.3; Cm.shape(`${nm} · slot`, [group("m", [rect([w + size, bot - top], [x0 + w / 2, (top + bot) / 2]), fill(rgb("#ffffff"))])], { parent: WV, ip: t0 - 1, op: end, td: true }); }
    const Ly = Cm.shape(nm, L.groups, { parent: WV, ip: t0 - 1, op: end });
    if (slotted) Ly.tt = 1;
    return { w, x0, end, layer: Ly };
  }
  // a card that hugs a line (the line's width, a little air): it wipes open from its left edge just before the words
  // and folds shut after them
  function kcard(nm, { x0, w, y, size, color = "#000000", line = null, lw = 5, radius = 0, t0, tOut, padX = 0.3, padY = 0.2, desc = true }) {
    const px = size * padX, py = size * padY, top = y - CAP(size) - py, bot = y + (desc ? size * 0.22 : size * 0.04) + py * 0.8, bw = w + 2 * px;
    const items = [rect([bw, bot - top], [bw / 2, 0], radius), ...(line ? [stroke(rgb(line), lw)] : []), fill(rgb(color))];
    const sk = [[t0 - 7, [0, 100], EXPO], [t0 + 5, [100, 100], ...(tOut != null ? [E.hold] : [])], ...(tOut != null ? [[tOut + 4, [100, 100], IN], [tOut + 12, [100, 0]]] : [])];
    return Cm.shape(`${nm} · card`, [group("card", items)], { parent: WV, ip: t0 - 7, op: tOut != null ? tOut + 13 : F, ks: { p: [x0 - px, (top + bot) / 2], s: sk } });
  }
  const mono = (nm, text, x, y, t0, t1, size = 22) => { const L = monoLine(text, size, "#ffffff", x + 50, y, { o: 92 }); return Cm.shape(nm, [group("t", L.groups), group("rule", [shp(poly([[x, y - size * 0.36], [x + 34, y - size * 0.36]], false)), stroke(rgb("#ffffff"), 3, 92)])], { parent: WV, ip: t0, op: t1, ks: { o: [[t0, 0, E.linear], [t0 + 6, 100, E.hold], [t1 - 5, 100, E.linear], [t1, 0]], p: [[t0, [0, 14], EXPO], [t0 + 14, [0, 0]]] } }); };
  // a low band of shade under the type (the cinema's lower third)
  const scrim = (nm, a, b, { y0 = 980, k = 0.6 } = {}) => Cm.shape(`${nm} · shade`, [group("s", [rect([W * 1.2, H - y0 + 200], [W / 2, (y0 + H + 200) / 2]), gfill({ type: 1, s: [0, y0], e: [0, H], stops: [[0, "#08060C"], [1, "#08060C"]], alphas: [[0, 0], [0.5, k * 0.7], [1, k]] })])], { ip: a, op: b, ks: { o: [[a, 0, E.linear], [a + 8, 100, E.hold], [b - 8, 100, E.linear], [b, 0]] } });

  // 1 · the overhead (on its pale plaza: black type, the one yellow pill)
  {
    const sz = 142, l1 = kline("t · our portfolio", c.traffic[0], { x: 72, y: 430, size: sz, color: "#111111", t0: 10, tOut: 90, stagger: 1.1 });
    const l2 = kline("t · has", c.traffic[1], { x: 72, y: 600, size: sz, color: "#111111", t0: 22, tOut: 91, stagger: 1.1 });
    const px = l2.x0 + l2.w + sz * 0.42, l3 = kline("t · traffic", c.traffic[2], { x: px, y: 600, size: sz, color: "#000000", t0: 30, tOut: 92, stagger: 1 });
    kcard("t · traffic", { x0: l3.x0, w: l3.w, y: 600, size: sz, color: YEL, line: "#000000", lw: 6, radius: 9999, t0: 28, tOut: 92, padX: 0.32 });
  }
  // 2 · "Every client gets a" + the black card whose word swaps with each cut
  {
    const SW = [120, 184, 244], OUTW = 292, size = 204, x0 = 104, y = 1500;
    mono("t · supers 0", c.caps[0], x0, 1150, 118, 178); mono("t · supers 1", c.caps[1], x0, 1150, 184, 238); mono("t · supers 2", c.caps[2], x0, 1150, 244, OUTW + 4);
    kline("t · head", c.head, { x: x0, y: 1262, size: 76, t0: 118, tOut: OUTW, stagger: 0.7 });
    const ws = c.swaps.map((wd) => textWidth(wd, size));
    c.swaps.forEach((wd, i) => kline(`t · swap ${i}`, wd, { x: x0, y, size, color: YEL, t0: SW[i] + 3, tOut: i < 2 ? SW[i + 1] - 7 : OUTW, stagger: 0.8, dur: 14 }));
    const px = size * 0.3, py = size * 0.2, top = y - CAP(size) - py, bot = y + size * 0.22 + py * 0.8, bh = bot - top, cw = (i) => ws[i] + 2 * px;
    const sizeK = [[SW[0] - 4, [0, bh], EXPO], [SW[0] + 8, [cw(0), bh], E.hold], [SW[1] - 5, [cw(0), bh], EXPO], [SW[1] + 7, [cw(1), bh], E.hold], [SW[2] - 5, [cw(1), bh], EXPO], [SW[2] + 7, [cw(2), bh], E.hold], [OUTW + 6, [cw(2), bh], IN], [OUTW + 14, [cw(2), 0]]];
    Cm.shape("t · swap · card", [group("card", [{ ty: "rc", d: 1, s: prop(sizeK), p: prop(sizeK.map(([t, v, e]) => [t, [v[0] / 2, 0], e])), r: prop(0) }, fill(rgb("#000000"))])], { parent: WV, ip: SW[0] - 4, op: OUTW + 15, ks: { p: [x0 - px, (top + bot) / 2] } });
    scrim("t · swap", 112, OUTW + 12);
  }
  // 3 · "Knock knock." (each word lands with a tap); "Come in." over the page
  {
    const s = 160, y = 700, w1 = textWidth(c.knock[0] + " ", s);
    kline("t · knock 1", c.knock[0], { x: 72, y, size: s, t0: KNOCK[0] - 1, tOut: OPEN - 7, stagger: 0, from: "slam" });
    kline("t · knock 2", c.knock[1], { x: 72 + w1, y, size: s, t0: KNOCK[1] - 1, tOut: OPEN - 5, stagger: 0, from: "slam" });
    mono("t · case kicker", c.kicker, 72, 1300, 394, 424);
    kline("t · come in", c.come, { x: 72, y: 1470, size: 176, t0: 396, tOut: SCROLL[0] - 2, stagger: 1.2 });
  }
  // the rides: a verb each, a place and a size each, some on a card
  {
    const V = (i) => c.verbs[i], at = (id) => T1[id];
    let [a, b] = at("r1"); kline("t · drive", V(0), { x: 64, y: 1590, size: 280, t0: a + 4, tOut: b - 9, stagger: 1.4 }); scrim("t · r1", a, b + 4, { y0: 1100, k: 0.5 });
    [a, b] = at("r2"); { const l = kline("t · snoop", V(1), { x: 1012, y: 520, size: 156, align: "right", t0: a + 4, tOut: b - 9 }); kcard("t · snoop", { x0: l.x0, w: l.w, y: 520, size: 156, color: "#000000", t0: a + 3, tOut: b - 9 }); }
    [a, b] = at("r3"); kline("t · overtake", V(2), { x: 540, y: 1180, size: 196, align: "center", from: "left", t0: a + 3, tOut: b - 9, stagger: 0.7, dur: 12 });
    [a, b] = at("r4"); {
      const s = 138, l = kline("t · pass go", V(3), { x: 540, y: 1470, size: s, color: "#000000", align: "center", t0: a + 5, tOut: b - 9 });
      kcard("t · pass go", { x0: l.x0, w: l.w, y: 1470, size: s, color: "#FFFFFF", line: "#000000", lw: 6, radius: 26, t0: a + 4, tOut: b - 9, padX: 0.34 });
      // the board's arrow, under the card, pointing back the way the board goes round
      const ax = 540, ay = 1600, aw = l.w * 0.9, t0 = a + 9, t1 = b - 9;
      Cm.shape("t · pass go · arrow", [group("arrow", [shp(poly([[aw / 2, -13], [-aw / 2 + 46, -13], [-aw / 2 + 46, -36], [-aw / 2 - 10, 0], [-aw / 2 + 46, 36], [-aw / 2 + 46, 13], [aw / 2, 13]])), stroke(rgb("#000000"), 5), fill(rgb("#E8322A"))])], { parent: WV, ip: t0, op: t1 + 9, ks: { p: [[t0, [ax + 500, ay], EXPO], [t0 + 12, [ax, ay], E.hold], [t1, [ax, ay], IN], [t1 + 8, [ax - 900, ay]]] } });
    }
    [a, b] = at("r5"); { const l = kline("t · fly low", V(4), { x: 72, y: 470, size: 132, color: "#14101C", t0: a + 5, tOut: b - 9 }); kcard("t · fly low", { x0: l.x0, w: l.w, y: 470, size: 132, color: "#FFF1D6", line: "#000000", lw: 5, radius: 6, t0: a + 4, tOut: b - 9 }); }
    [a, b] = at("r6"); { const v = V(5); kline("t · slip", v[0], { x: 1008, y: 860, size: 220, align: "right", t0: a + 3, tOut: b - 10 }); kline("t · through", v[1], { x: 1008, y: 1080, size: 220, align: "right", t0: a + 7, tOut: b - 8 }); }
    [a, b] = at("r7"); { const l = kline("t · pour", V(6), { x: 96, y: 520, size: 176, color: "#000000", t0: a + 5, tOut: b - 9 }); kcard("t · pour", { x0: l.x0, w: l.w, y: 520, size: 176, color: YEL, line: "#000000", lw: 6, radius: 9999, t0: a + 4, tOut: b - 9, padX: 0.36 }); }
    [a, b] = at("r8"); {
      const s = 146, l = kline("t · pull over", V(7), { x: 540, y: 560, size: s, align: "center", t0: a + 4, tOut: b - 9 }), beat = (t) => Math.floor(((t - a) * 1000) / 60 / 190) % 2;
      ["#E8263F", "#2F6BFF"].forEach((col, k) => { const L = kcard(`t · pull over ${k}`, { x0: l.x0, w: l.w, y: 560, size: s, color: col, t0: a + 3, tOut: b - 9 }); L.ks.o = prop(holdKeys(a - 4, b + 4, (t) => (beat(t) === k ? 100 : 0))); });
    }
    [a, b] = at("r9"); kline("t · dive", V(8), { x: 540, y: 1430, size: 330, align: "center", from: "above", t0: a + 3, tOut: b - 9, stagger: 1.6 });
  }
  // the end: the last line, low and big; the pill (above) on its own
  {
    kline("t · we saved you", c.end[0], { x: 72, y: 1300, size: 112, t0: 836, stagger: 1 });
    kline("t · a corner", c.end[1], { x: 64, y: 1540, size: 236, color: YEL, t0: 848, stagger: 1.3 });
    scrim("t · end", 830, F + 10, { y0: 900, k: 0.62 });
  }

  flicker(Cm, { amt: 3 });
  vignette(Cm, { a: 0.3, inner: 0.6 });

  // ---------- 3 · the pill and the page (story space, over the card and the Court) ----------
  {
    const [bx, by, bw, bh] = ui.btnPx, R = bh / 2, k = 3 * pageDPR, L1 = -(R + k + 6), R1 = W + R + k + 6, T2 = -48 * pageDPR, B2 = H + 48 * pageDPR;
    const d1 = Math.max(bx - L1, R1 - (bx + bw)), d2 = Math.max(by - T2, B2 - (by + bh)), cut = d1 / (d1 + d2);
    const bez = (x1, y1, x2, y2) => (x) => { let t = x; for (let i = 0; i < 10; i++) { const u = 1 - t, cx = 3 * x1 * t * u * u + 3 * x2 * t * t * u + t * t * t - x, d = 3 * x1 * u * u + 6 * (x2 - x1) * t * u + 3 * (1 - x2) * t * t; if (Math.abs(cx) < 1e-6) break; if (d) t = clamp(t - cx / d); } const v = 1 - t; return 3 * y1 * t * v * v + 3 * y2 * t * t * v + t * t * t; };
    const EOPEN = bez(0.6, 0, 0.2, 1);
    const edges = (u) => u <= cut ? { l: bx + (L1 - bx) * (u / cut), r: bx + bw + (R1 - bx - bw) * (u / cut), t: by, b: by + bh } : (() => { const f = (u - cut) / (1 - cut); return { l: L1, r: R1, t: by + (T2 - by) * f, b: by + bh + (B2 - by - bh) * f }; })();
    const uOf = (t) => EOPEN(clamp((t - OPEN) / OPEND));
    const pk = []; for (let t = OPEN; t <= OPEN + OPEND; t++) { const e = edges(uOf(t)); pk.push([t, roundRect((e.l + e.r) / 2, (e.t + e.b) / 2, e.r - e.l, e.b - e.t, R), E.linear]); }
    pk[pk.length - 1] = [pk[pk.length - 1][0], pk[pk.length - 1][1]];
    // the ring (the Multiverse's colours, along the pill), fading as the pill passes the screen's edges
    const ringStops = [[0, "#F65342"], [0.22, "#FED012"], [0.45, "#28C840"], [0.68, "#119BFE"], [0.88, "#B098C8"], [1, "#F65342"]];
    const gs = { ty: "gs", o: prop([[OPEN, 100, E.hold], [OPEN + Math.round(OPEND * 0.7), 100, E.linear], [OPEN + OPEND, 0]]), w: prop(k * 2), g: { p: ringStops.length, k: { a: 0, k: ringStops.flatMap(([p, h]) => [p, ...rgb(h).slice(0, 3)]) } }, s: prop([0, H / 2]), e: prop([W, H / 2]), t: 1, lc: 2, lj: 2, ml: 4, bm: 0, h: prop(0), a: prop(0), nm: "ring" };
    Cm.shape("pill · ring", [group("ring", [shp(pk), gs])], { ip: OPEN, op: OPEN + OPEND + 1 });
    // the frame's own buttons (Share, close) stay put over the scroll
    const fb = ui.frameButtons, bx0 = Math.floor(fb[0][0] * pageDPR) - 12, by1 = Math.ceil((fb[1][1] + fb[1][3]) * pageDPR) + 12;
    const btnLayer = img(`d-ui-opened-${lang}`, WV, { ip: SCROLL[0] - 2, op: T1.page[1] - WHIPD, nm: "page · frame buttons" });
    btnLayer.hasMask = true; btnLayer.masksProperties = [{ inv: false, mode: "a", pt: { a: 0, k: poly([[bx0, 0], [W, 0], [W, by1], [bx0, by1]]) }, o: prop(100), x: prop(0), nm: "buttons" }];
    btnLayer.ks.o = prop([[SCROLL[0] - 2, 100, E.hold], [T1.page[1] - WHIPD - 2, 100, E.linear], [T1.page[1] - WHIPD, 0]]);
    // the whip out of the landed page: its smear
    img(`d-ui-landed-${lang}-wh`, WV, { ip: T1.page[1] - WHIPD, op: T1.page[1] + 1, p: [0, 0], s: 400, o: smearO(null, T1.page[1]), nm: "page · whip smear" }).ks.p = prop(bake(T1.page[1] - WHIPD, T1.page[1], (t) => ({ p: whipOut(t, T1.page[1], [-1, 0]) })).p);
    // the scroll's smear (its own pixels pulled up), then the page itself, tall
    const sm = img(`d-ui-page-${lang}-wv`, pageN, { ip: SCROLL[0], op: SCROLL[1] + 1, p: [0, 0], s: 400, nm: "page · scroll smear" });
    sm.ks.o = prop([[SCROLL[0], 0, E.linear], [SCROLL[0] + 9, 80, E.linear], [SCROLL[1] - 12, 80, E.linear], [SCROLL[1] - 3, 0]]);
    img(`d-ui-page-${lang}`, pageN, { ip: SCROLL[0] - 2, op: T1.page[1] - WHIPD + 1, p: [0, 0], nm: "page · tall" });
    // the pill: the page as the map opens it, through the button's pill (an alpha matte); fades in over the first third
    Cm.shape("pill · matte", [group("pill", [shp(pk), fill(rgb("#ffffff"))])], { ip: OPEN, op: OPEN + OPEND + 1, td: true });
    const pg = img(`d-ui-opened-${lang}`, null, { ip: OPEN, op: OPEN + OPEND + 1, nm: "pill · the page" });
    pg.tt = 1; pg.ks.o = prop(bake(OPEN, OPEN + OPEND, (t) => ({ o: 100 * clamp(uOf(t) / 0.33) })).o);
    img(`d-ui-opened-${lang}`, WV, { ip: OPEN + OPEND, op: SCROLL[0], nm: "page · opened" });
  }

  // ---------- 3 · the card: the site's own, rising over the Court; the knocks ----------
  {
    const [cx0, cy0, cw, ch] = ui.cardPx, [bx, by, bw, bh] = ui.btnPx, bc = [bx + bw / 2, by + bh / 2];
    // the knocks: a ring off the button each, the card pressed a hair
    KNOCK.forEach((t0, i) => {
      Cm.shape(`knock ring ${i}`, [group("ring", [ellipse([120, 120], [0, 0]), stroke(rgb("#ffffff"), [[t0, 8, E.out], [t0 + 20, 1]], [[t0, 95, E.linear], [t0 + 20, 0]])], { s: [[t0, [50, 50], E.out], [t0 + 20, [300, 300]]] })], { ip: t0, op: t0 + 21, ks: { p: bc } });
    });
    const press = (t) => KNOCK.reduce((s, t0) => s * (1 - 0.018 * Math.sin(Math.PI * clamp((t - t0) / 8))), 1);
    const ck = bake(CARD, OPEN + OPEND, (t) => { const u = ramp(t, CARD, CARD + 26, (x) => backOut(x, 1.1)); const s = press(t) * 100; return { p: [cx0 + cw / 2, lerp(H + ch * 0.6, cy0 + ch / 2, u)], r: lerp(-4, 0, u), s: [s, s] }; });
    const cardN = Cm.nul("card", { parent: WV, ip: CARD, op: OPEN + OPEND + 1, ks: { a: [cw / 2, ch / 2], p: ck.p, r: ck.r, s: ck.s } });
    img("d-ui-card", cardN, { ip: CARD, op: OPEN + OPEND + 1, p: [0, 0], nm: "card · the site's place card" });
    Cm.shape("card · shadow", [group("s", [rect([cw - 20, ch - 20], [cw / 2 + 6, ch / 2 + 28], 60), fill(rgb("#000000"), 34)])], { parent: cardN, ip: CARD, op: OPEN + OPEND + 1 });
    // the Court dims under it
    Cm.shape("card · dim", [group("d", [rect([W * 1.3, H * 1.3], [W / 2, H / 2]), fill(rgb("#0B0710"))])], { ip: 296, op: OPEN + OPEND + 1, ks: { o: [[296, 0, E.linear], [314, 46]] } });
  }

  // ---------- the end: the roundabout at night ----------
  {
    const id = "end", J = S.end, [a, b] = T1.end, n0 = 806;
    // the ride going round: a frame of 30 each (2 here), its lamps and their streak
    J.pass.forEach((q, i) => {
      const f0 = n0 + i * 2;
      if (q.plate) img(q.plate, N.end, { ip: f0, op: f0 + 2, nm: `end · ride ${i}` });
      for (const [k, L] of q.lamps.entries()) {
        if (L[2] >= 1) continue;
        const g = Cm.shape(`end · lamp ${i}.${k}`, [glowShape(150, "#FFE6B0"), group("streak", [ellipse([900, 26], [0, 0]), gfill({ type: 2, s: [0, 0], e: [450, 0], stops: [[0, "#FFF6E0"], [1, "#FFD9A0"]], alphas: [[0, 0.7], [1, 0]] })])], { parent: N.end, ip: f0, op: f0 + 2, ks: { p: [L[0], L[1]] } });
        g.bm = 2;
      }
    });
    // the headlights' wash sweeping the plaza while the ride comes round (screen, on the ground)
    const sweep = Cm.shape("end · headlight sweep", [group("w", [ellipse([1500, 520], [0, 0]), gfill({ type: 2, s: [0, 0], e: [750, 0], stops: [[0, "#FFE9BC"], [1, "#FFE9BC"]], alphas: [[0, 0.5], [1, 0]] })])], {
      parent: N.end, ip: 820, op: 872, ks: { p: bake(820, 870, (t) => { const i = clamp(Math.round((t - n0) / 2), 0, J.pass.length - 1), q = J.pass[i]; return { p: [lerp(q.ahead[0], 1080, 0.35), lerp(q.ahead[1], 3000, 0.6)] }; }).p, o: [[820, 0, E.linear], [834, 100, E.linear], [858, 80, E.linear], [872, 0]] }
    });
    sweep.bm = 2;
    J.glows.forEach((g, i) => { const L = Cm.shape(`end · bulb ${i}`, [glowShape(g[1] < 1600 ? 46 : 70, "#FFC870", { a0: 0.8, mid: 0.4 })], { parent: N.end, ip: a, op: b, ks: { p: [g[0], g[1]], o: 75 } }); L.bm = 2; });
    img("d-end-L0", N.end, { ip: a, op: b, nm: "end · the roundabout at night" });
  }

  // ---------- the rides ----------
  const nightGlows = (id, { r = 60, o = 70 } = {}) => S[id].glows.forEach((g, i) => { const [a, b] = T1[id]; const L = Cm.shape(`${id} · bulb ${i}`, [glowShape(r, "#FFC870", { a0: 0.8, mid: 0.4 })], { parent: N[id], ip: a, op: b, ks: { p: [g[0], g[1]], o } }); L.bm = 2; });
  const lampFlare = (id, pts, { r = 190, streak = 1100, ip, op } = {}) => pts.forEach((L, k) => { const [a, b] = T1[id]; const g = Cm.shape(`${id} · lamp ${k}`, [glowShape(r, "#FFE6B0"), group("streak", [ellipse([streak, 30], [0, 0]), gfill({ type: 2, s: [0, 0], e: [streak / 2, 0], stops: [[0, "#FFF6E0"], [1, "#FFD9A0"]], alphas: [[0, 0.75], [1, 0]] })])], { parent: N[id], ip: ip ?? a, op: op ?? b, ks: { p: L, o: [[ip ?? a, 0, E.linear], [(ip ?? a) + 3, 100]] } }); g.bm = 2; });
  const ride = (id, nm = "ride") => img(`d-${id}-${nm}`, N[id], { ip: T1[id][0], op: T1[id][1], nm: `${id} · the ride` });
  const plate = (id) => img(`d-${id}-L0`, N[id], { ip: T1[id][0], op: T1[id][1], nm: `${id} · plate` });
  const smearLayer = (id, inAt, outAt, dir = "h") => img(`d-${id}-w${dir}`, N[id], { ip: T1[id][0], op: T1[id][1], p: [0, 0], s: 400, o: smearO(inAt, outAt), nm: `${id} · whip smear` });

  // r9 · the sub, under water: light from the surface, bubbles, "Dive." in the water behind it
  {
    const id = "r9", [a, b] = T1[id];
    const rays = Cm.shape("r9 · light from above", [0, 1, 2, 3].map((k) => group(`ray ${k}`, [rect([260 + k * 60, 4200], [0, 1800]), gfill({ type: 1, s: [-150, 0], e: [150, 0], stops: [[0, "#CFFBFF"], [0.5, "#E9FFFF"], [1, "#CFFBFF"]], alphas: [[0, 0], [0.5, 0.28], [1, 0]] })], { p: [400 + k * 480, -200], r: -14 + k * 6 })), { parent: N[id], ip: a, op: b, ks: { o: [[a, 60, E.linear], [b, 90]] } });
    rays.bm = 2;
    const R = rng(21), bub = [];
    for (let i = 0; i < 26; i++) { const x = 300 + R() * 1600, y = 2600 + R() * 1200, r = 8 + R() * 22, d = 400 + R() * 700, t0 = a + Math.round(R() * 10); bub.push(group(`b${i}`, [ellipse([r * 2, r * 2], [0, 0]), stroke(rgb("#E8FDFF"), 3, 80), fill(rgb("#E8FDFF"), 18)], { p: [[t0, [x, y], E.linear], [b, [x + (R() - 0.5) * 80, y - d]]] })); }
    Cm.shape("r9 · bubbles", bub, { parent: N[id], ip: a, op: b });
    ride(id);
    plate(id);
  }
  // r8 · Patrol: its roof lamps red, blue (the map's 190 ms beat), the washes; "Pull over." above it
  {
    const id = "r8", [a, b] = T1[id], beat = (t) => Math.floor(((t - a) * 1000) / 60 / 190) % 2;
    ["red", "blue"].forEach((col, k) => {
      const L = img(`d-${id}-beacon-${k}`, N[id], { ip: a, op: b, nm: `r8 · lamp ${col}` }); L.ks.o = prop(holdKeys(a, b, (t) => (beat(t) === k ? 100 : 0)));
      const w = Cm.shape(`r8 · wash ${col}`, [group("w", [rect([3000, 4200], [1080, 1920]), gfill({ type: 2, s: [k ? 1500 : 660, 900], e: [k ? 3300 : -1100, 900], stops: [[0, k ? "#3D7BFF" : "#FF3B4E"], [1, k ? "#3D7BFF" : "#FF3B4E"]], alphas: [[0, 0.55], [1, 0]] })])], { parent: N[id], ip: a, op: b, ks: { o: holdKeys(a, b, (t) => (beat(t) === k ? 100 : 0)) } });
      w.bm = 2;
    });
    lampFlare(id, [[216, 1624], [1448, 1624]], { r: 150, streak: 900 });
    ride(id);
    nightGlows(id, { r: 50 });
    plate(id);
  }
  // r7 · Kompus: a neon on its roof, flickering on
  {
    const id = "r7";
    ride(id);
    plate(id);
  }
  // r6 · the scooter, straight down: the words painted on the road, the scooter weaving over them
  {
    const id = "r6", [a, b] = T1[id], sp = S[id].sprites.ride, m = P.plates[`d-${id}-ride`];
    const rn = Cm.nul("r6 · scooter", { parent: N[id], ip: a, op: b + 1, ks: (() => { const k = bake(a, b, (t) => { const u = clamp((t - a) / ((b - a) * 0.62)); return { p: [sp.c[0] + 230 * Math.sin(u * Math.PI * 2.4 + 0.6), lerp(4500, -900, u)], r: 16 * Math.cos(u * Math.PI * 2.4 + 0.6) }; }); return { a: [0, 0], p: k.p, r: k.r }; })() });
    img(`d-${id}-ride`, rn, { ip: a, op: b, p: [m.x - sp.c[0], m.y - sp.c[1]], nm: "r6 · the scooter" });
    nightGlows(id, { r: 120 });
    plate(id);
  }
  // r5 · the Cropduster passing over, a banner behind it
  {
    const id = "r5", [a, b] = T1[id], sp = S[id].sprites.ride, m = P.plates[`d-${id}-ride`];
    const pn = Cm.nul("r5 · plane", { parent: N[id], ip: a, op: b + 1, ks: (() => { const k = bake(a, b, (t) => { const u = (t - a) / (b - a), s = lerp(0.95, 0.42, easeOut(u)); return { p: [lerp(1180, 1000, u), lerp(3600, 1100, easeOut(u))], s: [100 * s, 100 * s], r: lerp(-8, 4, u) }; }); return { a: [0, 0], p: k.p, s: k.s, r: k.r }; })() });
    img(`d-${id}-ride`, pn, { ip: a, op: b, p: [m.x - sp.c[0], m.y - sp.c[1]], nm: "r5 · the plane" });
    // stars
    const R = rng(55), st = []; for (let i = 0; i < 70; i++) st.push(group(`s${i}`, [ellipse([3 + R() * 5, 3 + R() * 5], [R() * 2160, R() * 2600]), fill(rgb("#FFFFFF"), 40 + R() * 50)]));
    Cm.shape("r5 · stars", st, { parent: N[id], ip: a, op: b });
    smearLayer(id, a, null);
    plate(id);
  }
  // r4 · the chrome racer under the Court's lights: "Pass Go." and the board's arrow
  {
    const id = "r4", [a, b] = T1[id];
    ride(id);
    smearLayer(id, null, b, "h");
    plate(id);
  }
  // r3 · the F1 crosses the held wide, over its word
  {
    const id = "r3", [a, b] = T1[id], J = S[id];
    J.pass.forEach((q, i) => { const f0 = a + i * 2; if (q.plate && f0 < b) img(q.plate, N[id], { ip: f0, op: Math.min(b, f0 + 2), nm: `r3 · F1 ${i}` }); });
    J.pass.forEach((q, i) => { const f0 = a + i * 2; if (f0 >= b) return; q.lamps.forEach((L, k) => { if (L[2] >= 1) return; const g = Cm.shape(`r3 · lamp ${i}.${k}`, [group("streak", [ellipse([700, 20], [0, 0]), gfill({ type: 2, s: [0, 0], e: [350, 0], stops: [[0, "#FFF6E0"], [1, "#FFD9A0"]], alphas: [[0, 0.5], [1, 0]] })])], { parent: N[id], ip: f0, op: f0 + 2, ks: { p: [L[0], L[1]] } }); g.bm = 2; }); });
    nightGlows(id, { r: 60 });
    plate(id);
  }
  // r2 · the Mystery van at the roundabout: "Snoop." over its roof
  {
    const id = "r2", [a, b] = T1[id];
    lampFlare(id, [[2056, 1712]], { r: 170, streak: 900 });
    ride(id);
    nightGlows(id, { r: 55 });
    plate(id);
  }
  // r1 · the yellow Dacia, from the bumper: its lamps flare, "Drive." under the festoon
  {
    const id = "r1", [a, b] = T1[id];
    lampFlare(id, [[160, 1800], [1096, 1800]], { r: 200, streak: 1300 });
    ride(id);
    nightGlows(id, { r: 55, o: 80 });
    smearLayer(id, a, null);
    plate(id);
  }

  // ---------- 2 · the Court: a sweep of light as its word lands ----------
  {
    const id = "tac", [a, b] = T1[id], sw0 = 250, sw1 = 276;
    // the light: a bright band crossing the facade (screen) as its word lands
    const sweepX = (t) => lerp(-900, 3100, ramp(t, sw0, sw1, easeInOut));
    const band = Cm.shape("court · light sweep", [group("b", [rect([700, 4400], [0, 1920]), gfill({ type: 1, s: [-350, 0], e: [350, 0], stops: [[0, "#FFF2D0"], [0.5, "#FFFBEF"], [1, "#FFF2D0"]], alphas: [[0, 0], [0.5, 0.55], [1, 0]] })], { r: 12 })], { parent: N.tac, ip: sw0, op: sw1 + 1, ks: { p: bake(sw0, sw1, (t) => ({ p: [sweepX(t), 0] })).p } });
    band.bm = 2;
    // the zoom's blur: two fainter copies a little smaller round the focus while it rushes in
    const zb = (k, o) => { const n = Cm.nul(`court · zoom blur ${k}`, { parent: N.tac, ip: tZ0, op: tZ1 + 4, ks: { a: tacF, p: tacF, s: [k, k] } }); const L = img("d-tac-L0", n, { ip: tZ0, op: tZ1 + 4, o: [[tZ0, 0, E.linear], [tZ0 + 4, o, E.linear], [tZ1 + 4, 0]], nm: `court · zoom blur ${k}` }); return L; };
    zb(95, 40); zb(89, 24);
    img("d-tac-L1", tacLens, { ip: a, op: b, nm: "court · lens 1" });
    img(`d-tac-wv`, N.tac, { ip: a, op: a + WHIPD + 1, p: [0, 0], s: 400, o: smearO(a, null), nm: "court · whip smear" });
    img("d-tac-L0", N.tac, { ip: a, op: b, nm: "court · plate" });
    // the sky (the plates leave it out): dusk, warm low behind the palace, and the sun behind it
    sky(N.tac, a, b, ["#2B336F", "#7E6FB0", "#F3A97E", "#FFD49A"], [0, 0.42, 0.78, 1], 600, 2200);
    const sg = Cm.shape("court · sun", [glowShape(700, "#FFC98A", { core: "#FFF4DC", a0: 0.9, mid: 0.35 })], { parent: N.tac, ip: a, op: b, ks: { p: [1080, 1750] } });
    sg.bm = 2; Cm.layers.splice(Cm.layers.indexOf(sg), 1); Cm.layers.splice(Cm.layers.length - 1, 0, sg); // (behind the plate, over the sky)
  }
  // ---------- 2 · Investimental ----------
  {
    const id = "inv", [a, b] = T1[id];
    img("d-inv-wh", N.inv, { ip: a, op: a + WHIPD + 1, p: [0, 0], s: 400, o: smearO(a, null), nm: "inv · whip in" });
    img("d-inv-wv", N.inv, { ip: b - WHIPD, op: b + 1, p: [0, 0], s: 400, o: smearO(null, b), nm: "inv · whip out" });
    img("d-inv-L0", N.inv, { ip: a, op: b, nm: "inv · plate" });
    sky(N.inv, a, b, ["#1F2963", "#4A4E98", "#9B8FCB", "#E7B7A8"], [0, 0.35, 0.75, 1], -200, 3400);
  }
  // ---------- 2 · Yoshi ----------
  {
    const id = "yoshi", [a, b] = T1[id];
    img("d-yoshi-wh", N.yoshi, { ip: a, op: b + 1, p: [0, 0], s: 400, o: smearO(a, b), nm: "yoshi · whip smear" });
    img("d-yoshi-L0", N.yoshi, { ip: a, op: b, nm: "yoshi · plate" });
    sky(N.yoshi, a, b, ["#33407E", "#8E80C2", "#F1B293", "#FFD7A6"], [0, 0.4, 0.8, 1], 0, 3400);
  }
  // ---------- 1 · the overhead: the rides, the plate ----------
  {
    const [a, b] = T1.over;
    rides.forEach((rd, i) => {
      const sp = OV.sprites[rd.id], m = P.plates[`d-over-${rd.id}`];
      const k = bake(a, b, (t) => { const q = rideAt(rd, t); return { p: q.p, r: q.r }; });
      const rn = Cm.nul(`overhead · ${rd.id}`, { parent: N.over, ip: a, op: b + 1, ks: { a: [0, 0], p: k.p, r: k.r } });
      img(`d-over-${rd.id}`, rn, { ip: a, op: b, p: [m.x - sp.c[0], m.y - sp.c[1]], nm: `overhead · ${rd.id}` });
    });
    // zoom blur on the crash zoom
    [[96, 36], [90, 22]].forEach(([k, o]) => {
      const n = Cm.nul(`overhead · zoom blur ${k}`, { parent: N.over, ip: ovZ0, op: ovZ1 + 6, ks: (() => { const kk = bake(ovZ0, ovZ1 + 6, (t) => { const D = rideAt(rides[0], t).p; return { a: D, p: D }; }); return { a: kk.a, p: kk.p, s: [k, k] }; })() });
      img("d-over-L0", n, { ip: ovZ0, op: ovZ1 + 6, o: [[ovZ0, 0, E.linear], [ovZ0 + 4, o, E.linear], [ovZ1 + 6, 0]], nm: `overhead · zoom blur ${k}` });
    });
    img("d-over-wh", N.over, { ip: b - WHIPD, op: b + 1, p: [0, 0], s: 400, o: smearO(null, b), nm: "overhead · whip smear" });
    img("d-over-L1", ovLens, { ip: 60, op: b, nm: "overhead · lens 1" });
    img("d-over-L0", N.over, { ip: a, op: b, nm: "overhead · plate" });
  }
  Cm.shape("ground", [group("g", [rect([W * 1.4, H * 1.4], [W / 2, H / 2]), fill(rgb("#0B0A12"))])]);
  const j = Cm.json(); j.cromatic = { story: "D", lang, dur: DUR, cuts: T1 };
  return j;

  // a sky behind a plate whose sky was left out: a vertical gradient over the plate's height (plate px)
  function sky(parent, a, b, cols, pos, y0, y1) {
    const w = 2160;
    Cm.shape(`sky · ${parent.nm}`, [group("s", [rect([w * 3, (y1 - y0) + 8000], [w / 2, (y0 + y1) / 2]), gfill({ type: 1, s: [w / 2, y0], e: [w / 2, y1], stops: cols.map((col, i) => [pos[i], col]) })])], { parent, ip: a, op: b });
  }
}

const sizes = {};
{
  const j = story(), s = JSON.stringify(j);
  fs.writeFileSync(path.join(OUT, "story-d-en.json"), s);
  sizes["story-d-en"] = { kb: +(s.length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, images: j.assets.length };
}
console.table(sizes);
