// Cromatic · metro mockups (TASK-062): the three animated mockups as Lottie, from the rendered plates (plates.json).
// Every piece is laid out in the s2 frame's pixels; the s1 set is the same piece with pictures half as dense (the image
// layers scale up by 1/k). Writes, per shot: src/lottie-ui/metro-<shot>-s1.json, -s2.json (pictures by asset id: the
// page gives their addresses) and <PLATES>/metro-<shot>-video.json (pictures from the plates folder, for record.mjs).
//   PLATES=<dir with s1/ s2/> PLATES_URL=</served path of that dir> node build.mjs [shot ...]
// The whole way (LOCAL ONLY): serve.mjs; node jobs.mjs <shot> > jobs.json; render.mjs --jobs; plates.mjs; build.mjs;
// record.mjs (MP4 + poster); copy.mjs (the web set into site/media/metro).
import fs from "fs";
import path from "path";
import { Comp, bake, group, rect, ell, fill, gfill, maskRect, path as shp, pathKeys, rgb, BM, QIN, QOUT } from "./lot.mjs";
import { SHOTS, camPx, proj, NEAR, AR, WALLZ } from "./shots.mjs";

const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, "../../..");
const PL = JSON.parse(fs.readFileSync(path.join(here, "plates.json"), "utf8"));
const PLATES = process.env.PLATES, PLATES_URL = process.env.PLATES_URL || "";
const FPS = 60, sec = (s) => Math.round(s * FPS);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);
const ramp = (t, t0, t1) => smooth(clamp((t - t0) / (t1 - t0)));

// the camera's slow breathing (a held camera, not a locked one): a tiny scale and drift that closes on itself
function drift(Cm, W, H, { s = 0.9, px = 3, py = 2 } = {}) {
  // (sine-like: keys at the quarter turns with an in-out ease; it closes on itself)
  const SIN = [0.37, 0, 0.63, 1], q = Cm.op / 4;
  const p = [[0, [W / 2, H / 2]], [q, [W / 2 + px, H / 2 - py]], [2 * q, [W / 2, H / 2]], [3 * q, [W / 2 - px, H / 2 + py]], [Cm.op, [W / 2, H / 2]]].map(([t, v], i, a) => [Math.round(t), v, i < a.length - 1 ? SIN : undefined]);
  const sc = [[0, 100], [2 * q, 100 + s], [Cm.op, 100]].map(([t, k], i, a) => [Math.round(t), [k, k], i < a.length - 1 ? SIN : undefined]);
  return Cm.nul("camera", { ks: { a: [W / 2, H / 2], p: { kf: p }, s: { kf: sc } } });
}
function vignette(Cm, W, H, k = 0.42) {
  Cm.shape("vignette", [group("v", [rect(W * 1.02, H * 1.02, W / 2, H / 2), gfill({ type: 2, s: [W / 2, H / 2], e: [W / 2 + Math.hypot(W, H) * 0.56, H / 2], stops: [[0, "#000000"], [0.55, "#000000"], [1, "#000000"]], alphas: [[0, 0], [0.55, 0], [1, k]] })])]);
}
function asset(Cm, set, id) {
  const P = (PL._all ||= Object.assign({}, ...Object.values(PL).filter((v) => typeof v === "object")))[id];
  if (!P) throw new Error("no plate " + id);
  const a = P[set === "video" ? "s2" : set];
  Cm.image(id, { w: a.w, h: a.h, k: a.k, file: id + ".webp", u: set === "video" ? `${PLATES_URL}/s2/` : "" });
  return P;
}

// ---------- shot 3: the train pulls in, stops, opens and closes its doors, pulls out ----------
// The cars move along the camera's x (a level camera square to the track): a car is a strip translated; three strips
// per car (sharp, a little and more motion blur) crossfade with the speed. The loop closes on a moving train: the cars
// before and after the banner car are the same, and the train has moved exactly two cars when it starts again.
function train(set) {
  const S = SHOTS.train, P = camPx("train"), T = PL.train, W = S.W, H = S.H;
  const Ta = 4.9, Ts = 10.4, Td = 4.9, L = 19.6, op = sec(Ts + Td);
  const Cm = new Comp({ w: W, h: H, op, fr: FPS, nm: "metro-train" });
  const x = (t) => { const s = t / FPS; return s < Ta ? -L * (1 - s / Ta) ** 2 : s < Ts ? 0 : L * ((s - Ts) / Td) ** 2; };
  const v = (t) => { const s = t / FPS; return s < Ta ? (2 * L / Ta) * (1 - s / Ta) : s < Ts ? 0 : (2 * L / Td) * ((s - Ts) / Td); };
  const blur = (t) => v(t) / 50; // (m in a 1/50 s shutter)
  // the train's x as three keys: a quadratic ease out (constant braking), the stop, a quadratic ease in
  const X = (m) => P.cx + m * T.pxm;
  const xKeys = { kf: [[0, [X(-L), 0], QOUT], [sec(Ta), [X(0), 0], "hold"], [sec(Ts), [X(0), 0], QIN], [op, [X(L), 0]]] };
  const wSharp = (t) => clamp((0.05 - blur(t)) / 0.05), wB1 = (t) => clamp((0.16 - blur(t)) / 0.1);
  const ids = ["t-bg", "t-fg", "t-car-wrap-sharp", "t-car-wrap-b1", "t-car-wrap-b2", "t-car-plain-b1", "t-car-plain-b2", "t-leaf-la", "t-leaf-lb", "t-leaf-ra", "t-leaf-rb"];
  const A = Object.fromEntries(ids.map((id) => [id, asset(Cm, set, id)]));
  vignette(Cm, W, H, 0.38);
  const cam = drift(Cm, W, H, { s: 0.7, px: 2.5, py: 1.5 });
  // the train's floor reflection: the cars again, flipped about the floor line at the cars' depth, faint, on the floor
  Cm.precomp("refl", "train · reflection", (into) => {
    const flip = Cm.nul("mirror", { into, ks: { a: [0, T.floorRow], p: [0, T.floorRow], s: [100, -100] } });
    const tn = Cm.nul("train · reflected", { into, parent: flip, ks: { p: xKeys } });
    for (const k of [1, 2, 3]) { const id = k === 2 ? "t-car-wrap-b2" : "t-car-plain-b2"; Cm.imgLayer(`car ${k} reflected`, id, { into, parent: tn, ks: { p: [A[id].x - P.cx + (2 - k) * T.carPitch, A[id].y] } }); }
  }, { parent: cam, ks: { o: 24 }, masks: [maskRect(0, T.edgeRow + 3, W, H - T.edgeRow)] });
  // someone waiting at the left edge (a breath of sway about her feet)
  if (T["t-person"] && process.env.WAITING) { // (off: at the frame's edge she read as a smudge, not a person) const pp = asset(Cm, set, "t-person"), ft = T["t-person"].foot;
    Cm.imgLayer("waiting", "t-person", { parent: cam, ks: { a: [(ft[0] - pp.x) * pp[set === "video" ? "s2" : set].k, (ft[1] - pp.y) * pp[set === "video" ? "s2" : set].k], p: ft, r: { kf: [[0, 0, [0.37, 0, 0.63, 1]], [Math.round(op / 2), -0.35, [0.37, 0, 0.63, 1]], [op, 0]] } } }); }
  // the platform in front (it hides the cars' skirts)
  Cm.imgLayer("platform (in front)", "t-fg", { parent: cam, ks: { p: [0, A["t-fg"].y] } });
  // the train
  const tn = Cm.nul("train", { parent: cam, ks: { p: xKeys } });
  const doorT = [[sec(5.4), sec(6.1), 1], [sec(9.0), sec(9.7), -1]];
  const open = (t) => { let o = 0; for (const [a, b, d] of doorT) { if (d > 0) o = Math.max(o, ramp(t, a, b)); else if (t >= a) o = 1 - ramp(t, a, b); } return t >= sec(9.7) ? 0 : o; };
  // (pocket doors: each door's two leaves in a precomp clipped to the doorway, over the banner car's sharp strip: they
  // slide into the body and the car's inside shows behind them)
  const leaves = () => { for (const [door, ids] of [["left", ["t-leaf-la", "t-leaf-lb"]], ["right", ["t-leaf-ra", "t-leaf-rb"]]]) {
    const a = A[ids[0]], b = A[ids[1]], wa = a[set === "video" ? "s2" : set], wb = b[set === "video" ? "s2" : set];
    const x0 = a.x - P.cx + 3, x1 = b.x - P.cx + wb.w / wb.k - 3, y0 = Math.min(a.y, b.y) + 3, y1 = Math.max(a.y + wa.h / wa.k, b.y + wb.h / wb.k) - 8;
    const PAD = 1200;
    Cm.precomp("door-" + door, "door " + door, (into, root) => { for (const [id, dir] of [[ids[0], -1], [ids[1], 1]]) {
      const L = A[id], dx = 0.64 * T.pxm * dir;
      Cm.imgLayer("leaf " + id.slice(-2), id, { into, parent: root, ks: { p: bake(0, op, (t) => [L.x - P.cx + dx * open(t), L.y], 1) } });
    } }, { pad: PAD, parent: tn, ks: { o: bake(0, op, (t) => Math.round(1000 * wSharp(t)) / 10, 1) }, masks: [maskRect(x0 + PAD, y0 + PAD, x1 - x0, y1 - y0)] });
  } };
  for (const k of [1, 2, 3]) {
    const wrap = k === 2, off = (2 - k) * T.carPitch;
    if (wrap) { leaves(); Cm.imgLayer("car 2 · sharp", "t-car-wrap-sharp", { parent: tn, ks: { p: [A["t-car-wrap-sharp"].x - P.cx, A["t-car-wrap-sharp"].y], o: bake(0, op, (t) => Math.round(1000 * wSharp(t)) / 10, 1) } }); }
    const b1 = wrap ? "t-car-wrap-b1" : "t-car-plain-b1", b2 = wrap ? "t-car-wrap-b2" : "t-car-plain-b2";
    Cm.imgLayer(`car ${k} · blur 1`, b1, { parent: tn, ks: { p: [A[b1].x - P.cx + off, A[b1].y], o: bake(0, op, (t) => Math.round(1000 * wB1(t) * (wrap ? 1 - wSharp(t) : 1)) / 10, 1) } });
    Cm.imgLayer(`car ${k} · blur 2`, b2, { parent: tn, ks: { p: [A[b2].x - P.cx + off, A[b2].y], o: bake(0, op, (t) => (wSharp(t) > 0.999 && wrap ? 0 : 100), 1) } });
  }
  Cm.imgLayer("station", "t-bg", { parent: cam });
  Cm.marker("loop", 0, op);
  return Cm.json();
}

// ---------- shot 2: inside the banner car, by the doors and the poster ----------
// It pulls out of the station, runs the tunnel (lamps streak past the windows and sweep the car), pulls into the
// station again, stops with a small sway, opens and closes its doors. The station outside is two strips (the
// platform near, the far wall) at their own depths, sharp and blurred; the tunnel is drawn (vectors).
function inside(set) {
  const S = SHOTS.inside, P = camPx("inside"), I = PL.inside, W = S.W, H = S.H;
  const T1 = 1.0, Td = 4.5, Ttun = 9.0, Ta = 4.5, Tst = Ttun + Ta, Tdo = Tst + 0.6, Tdc = Tdo + 3.2, END = Tdc + 0.7 + 0.8, L = 35;
  const op = sec(END), Cm = new Comp({ w: W, h: H, op, fr: FPS, nm: "metro-inside" });
  const ids = ["i-int", "i-refl", "i-leaf-a", "i-leaf-b", "i-near-sharp", "i-near-blur", "i-far", "i-far-blur"];
  const A = Object.fromEntries(ids.map((id) => [id, asset(Cm, set, id)]));
  // the train's own offset through the station (m): out (accelerating), then back in from the other end (braking)
  const off = (t) => { const s = t / FPS; if (s < T1) return 0; if (s < T1 + Td) return L * ((s - T1) / Td) ** 2; if (s < Ttun) return L + (2 * L / Td) * (s - T1 - Td); if (s < Tst) return -L * (1 - (s - Ttun) / Ta) ** 2; return 0; };
  const v = (t) => { const s = t / FPS; if (s < T1) return 0; if (s < T1 + Td) return (2 * L / Td) * ((s - T1) / Td); if (s < Ttun) return 2 * L / Td; if (s < Tst) return (2 * L / Ta) * (1 - (s - Ttun) / Ta); return 0; };
  const inStation = (t) => { const s = t / FPS; return s < T1 + Td * 0.98 || s > Ttun + 0.02; };
  const vmax = 2 * L / Td;
  vignette(Cm, W, H, 0.46);
  // the camera: the car's rocking (with speed), the jolt of the stop
  const SW = (t) => { const s = t / FPS, k = v(t) / vmax, j = s > Tst && s < Tst + 1.2 ? Math.exp(-(s - Tst) * 4) * Math.sin((s - Tst) * 11) : 0;
    return { r: 0.14 * k * Math.sin(s * 4.1) + 0.05 * k * Math.sin(s * 9.7) - 0.12 * j, x: -5 * j + 1.2 * k * Math.sin(s * 6.3), y: 1.4 * k * Math.sin(s * 7.9 + 1) + 0.8 * k * Math.sin(s * 17) }; };
  const cam = Cm.nul("camera (the car)", { ks: { a: [W / 2, H / 2], p: bake(0, op, (t) => { const q = SW(t); return [W / 2 + q.x, H / 2 + q.y]; }, 3, 1e-3, 0.6), r: bake(0, op, (t) => SW(t).r, 3, 1e-3, 0.025), s: [101.2, 101.2] } });
  // the tunnel's lamps: the light of each one sweeps the car as it passes (a soft band, screen)
  const lampEvery = 12 / vmax, lamps = []; for (let s = T1 + Td + 0.35; s < Ttun - 0.1; s += lampEvery) lamps.push(s);
  const sweepW = W * 0.9;
  Cm.shape("lamp light on the car", lamps.map((s0, i) => group("sweep " + i, [rect(sweepW, H * 2, 0, 0), gfill({ type: 1, s: [-sweepW / 2, 0], e: [sweepW / 2, 0], stops: [[0, "#ffd9a0"], [0.5, "#ffd9a0"], [1, "#ffd9a0"]], alphas: [[0, 0], [0.5, 1], [1, 0]] })],
    { p: { kf: [[sec(s0 - 0.25), [-sweepW, H / 2]], [sec(s0 + 0.25), [W + sweepW, H / 2]]] }, r: 18 })), { parent: cam, bm: "screen", ks: { o: 13 } });
  // the windows' reflection of the car: strong in the dark tunnel, gone in the lit station
  const reflO = (t) => { const s = t / FPS; return 6 + 46 * (ramp(s, T1 + Td - 0.9, T1 + Td + 0.2) * (1 - ramp(s, Ttun - 0.3, Ttun + 0.9))); };
  Cm.imgLayer("windows' reflection", "i-refl", { parent: cam, bm: "screen", ks: { o: bake(0, op, reflO, 2, 1e-3, 0.4) } });
  Cm.imgLayer("interior", "i-int", { parent: cam });
  // the leaves (pocket doors: they slide behind the panels)
  const open = (t) => (t >= sec(Tdc + 0.7) ? 0 : t >= sec(Tdc) ? 1 - ramp(t, sec(Tdc), sec(Tdc + 0.7)) : ramp(t, sec(Tdo), sec(Tdo + 0.7)));
  for (const [id, dir] of [["i-leaf-a", 1], ["i-leaf-b", -1]]) { const a = A[id], dx = 0.64 * (P.f / 1.4) * dir; Cm.imgLayer("leaf " + id.slice(-1), id, { parent: cam, ks: { p: bake(0, op, (t) => [a.x + dx * open(t), a.y], 1) } }); }
  // the station outside: near (the platform) and far (the far wall), sharp at rest, blurred when moving
  const wSharp = (t) => clamp((3 - v(t)) / 3);
  const strip = (id, o) => Cm.imgLayer(id, id, { parent: cam, ks: { p: bake(0, op, (t) => [A[id].x + off(t) * A[id].pxm, A[id].y], 1, 1e-3, 0.4), o } });
  strip("i-near-sharp", bake(0, op, (t) => Math.round(1000 * wSharp(t)) / 10, 1));
  strip("i-near-blur", bake(0, op, (t) => (inStation(t) ? 100 : 0), 1));
  strip("i-far", bake(0, op, (t) => Math.round(1000 * wSharp(t)) / 10, 1));
  strip("i-far-blur", bake(0, op, (t) => (inStation(t) ? 100 : 0), 1));
  // the tunnel: dark concrete, cable runs, lamps streaking past (and a glow on the wall around each)
  const pxmT = P.f / 2.3, lampY = P.horizon - (1.3 - S.cam.pos[1]) * pxmT;
  const streak = Math.max(60, (vmax / 50) * pxmT);
  Cm.shape("tunnel lamps", lamps.map((s0, i) => group("lamp " + i, [
    ell(streak + 40, 30, 0, 0), gfill({ type: 2, s: [0, 0], e: [streak / 2 + 20, 0], stops: [[0, "#fff6e4"], [0.4, "#ffd79a"], [1, "#ffb860"]], alphas: [[0, 1], [0.4, 0.9], [1, 0]] }),
    ell(streak * 3, 260, 0, 0), gfill({ type: 2, s: [0, 0], e: [streak * 1.5, 0], stops: [[0, "#ffc27a"], [1, "#ffc27a"]], alphas: [[0, 0.35], [1, 0]] })],
    { p: { kf: [[sec(s0 - 0.12), [-W * 0.6, lampY]], [sec(s0 + 0.12), [W * 1.6, lampY]]] } })), { parent: cam, ks: { o: bake(0, op, (t) => (inStation(t) ? 0 : 100), 1) } });
  const cables = [0.55, 0.62, 0.7, 0.78, 2.15, 2.22].map((y, i) => group("cable " + i, [rect(W * 1.4, 3 + (i % 3), W / 2, P.horizon - (y - S.cam.pos[1]) * pxmT), fill(i < 4 ? "#2a2b2c" : "#1f2021", 100)]));
  Cm.shape("tunnel wall", [...cables, group("wall", [rect(W * 1.4, H * 1.4, W / 2, H / 2), gfill({ type: 1, s: [0, 0], e: [0, H], stops: [[0, "#121314"], [0.45, "#1a1b1c"], [1, "#0d0d0e"]] })])], { parent: cam });
  Cm.marker("loop", 0, op);
  return Cm.json();
}

// ---------- shot 1: the platform: the far wall's posters, passers-by, a slow breath of the camera ----------
function platform(set) {
  const S = SHOTS.platform, P = camPx("platform"), PP = PL.platform, W = S.W, H = S.H, END = 12, op = sec(END);
  const Cm = new Comp({ w: W, h: H, op, fr: FPS, nm: "metro-platform" });
  asset(Cm, set, "p-bg");
  vignette(Cm, W, H, 0.4);
  const cam = drift(Cm, W, H, { s: 1.4, px: 6, py: 2 });
  const th = (S.cam.yaw * Math.PI) / 180;
  // passers-by: [walker, z, dir, v, enter (s)]
  const WALK = [[0, 1.6, 1, 1.45, 0.5], [1, 0.9, -1, 1.3, 4.0], [2, 1.3, 1, 1.2, 7.6]];
  // each walker: one walk cycle (6 poses) as a precomp, played on a loop by a time remap (a saw: two keys a step),
  // carried across the frame by a null; and again flipped about the feet, faint: the floor's reflection
  for (const [w, z, dir, vv, t0] of WALK) {
    const fr = Array.from({ length: 6 }, (_, f) => `p-w${w}-${f}`).filter((id) => PP[id]);
    if (!fr.length) continue;
    fr.forEach((id) => asset(Cm, set, id));
    const depth = (S.cam.pos[2] - z) * Math.cos(th), pxm = P.f / depth, foot = PP[fr[0]].foot;
    const wmax = Math.max(...fr.map((id) => PP[id].s2.w / PP[id].s2.k));
    const x0 = dir > 0 ? -wmax / 2 - 40 : W + wmax / 2 + 40, x1 = dir > 0 ? W + wmax / 2 + 40 : -wmax / 2 - 40;
    const dur = Math.abs(x1 - x0) / (vv * pxm), f0 = sec(t0), f1 = Math.min(op - 1, sec(t0 + dur));
    const PER = Math.round(1.08 * FPS), cyc = "cycle-" + w;
    const layers = [], PAD = 1600; Cm.assets.push({ id: cyc, layers });
    const padN = Cm.nul("pad", { into: layers, ks: { p: [PAD, PAD] } }); // (a precomp clips to its box: the poses sit PAD px in)
    fr.forEach((id, j) => Cm.imgLayer(`pose ${j}`, id, { into: layers, parent: padN, ip: Math.round((j * PER) / fr.length), op: Math.round(((j + 1) * PER) / fr.length), ks: { p: [PP[id].x - foot[0], PP[id].y] } }));
    const tmK = []; for (let t = f0; t < f1; t += PER) { tmK.push([t, 0]); tmK.push([Math.min(f1, t + PER - 1), (PER - 1) / FPS, "hold"]); }
    const walker = Cm.nul("walker " + w, { parent: cam, ip: f0, op: f1, ks: { p: { kf: [[f0, [x0, 0]], [f1, [x0 + (x1 - x0) * ((f1 - f0) / sec(dur)), 0]]] } } });
    const inst = (nm, parent, o = {}) => { const L = Cm.base(0, nm, { parent, ip: f0, op: f1, ...o, ks: { ...(o.ks || {}), a: [PAD, PAD] } }); L.refId = cyc; L.w = W + 2 * PAD; L.h = H + 2 * PAD; L.tm = { a: 1, k: tmK.map(([t, v, e], i) => { const k = { t, s: [v] }; if (i < tmK.length - 1) { if (e === "hold") k.h = 1; else { k.o = { x: [0], y: [0] }; k.i = { x: [1], y: [1] }; } } return k; }) }; return Cm.add(L); };
    const mirror = Cm.nul("walker " + w + " · mirror", { parent: walker, ip: f0, op: f1, ks: { a: [0, foot[1]], p: [0, foot[1]], s: [100, -100] } });
    inst("passer-by " + w, walker);
    inst("passer-by " + w + " · reflected", mirror, { ks: { o: 20 } });
  }
  // a train passes on the other track, behind us: its lit windows slide across the frames' glass (a reflection, faint)
  const quads = NEAR.map((f) => { const h = f.w / AR[f.kind], y0 = f.yTop - h, z = WALLZ + 0.107; return [[f.x - f.w / 2, f.yTop], [f.x + f.w / 2, f.yTop], [f.x + f.w / 2, y0], [f.x - f.w / 2, y0]].map(([x, y]) => proj("platform", [x, y, z]).slice(0, 2)); })
    .filter((q) => q.some(([x]) => x > -50 && x < W + 50));
  const pass0 = sec(5.2), pass1 = sec(7.4), winW = 260, gap = 70, nWin = 14, band = [P.horizon - 300, 210];
  const wins = Array.from({ length: nWin }, (_, i) => group("window " + i, [rect(winW, band[1], 0, 0), gfill({ type: 1, s: [-winW / 2, 0], e: [winW / 2, 0], stops: [[0, "#fff4e2"], [0.5, "#ffffff"], [1, "#fff4e2"]], alphas: [[0, 0], [0.5, 1], [1, 0]] })], { p: [i * (winW + gap), 0] }));
  const travel = nWin * (winW + gap) + W;
  Cm.shape("passing train, in the glass", [group("train windows", wins, { p: { kf: [[pass0, [W + 100, band[0]]], [pass1, [W + 100 - travel, band[0]]]] } })],
    { parent: cam, ip: pass0, op: pass1, bm: "screen", ks: { o: { kf: [[pass0, 0], [pass0 + 20, 16], [pass1 - 20, 16], [pass1, 0]] } }, masks: quads.map((q) => ({ inv: false, mode: "a", pt: { a: 0, k: { c: true, v: q, i: q.map(() => [0, 0]), o: q.map(() => [0, 0]) } }, o: { a: 0, k: 100 }, x: { a: 0, k: 0 }, nm: "glass" })) });
  Cm.imgLayer("station", "p-bg", { parent: cam });
  Cm.marker("loop", 0, op);
  return Cm.json();
}

const BUILDERS = { train, inside, platform };
const which = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(BUILDERS);
for (const shot of which) {
  for (const set of ["s1", "s2", "video"]) {
    const j = BUILDERS[shot](set), s = JSON.stringify(j);
    const f = set === "video" ? path.join(PLATES, `metro-${shot}-video.json`) : path.join(root, "src/lottie-ui", `metro-${shot}-${set}.json`);
    fs.writeFileSync(f, s);
    if (set !== "video") console.log(path.relative(root, f), (s.length / 1024).toFixed(1), "KB,", j.layers.length, "layers,", j.op, "frames");
  }
}
