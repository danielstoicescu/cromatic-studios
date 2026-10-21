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
import { rng } from "../../intro-lottie/_source/lib/lottie.mjs";

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
// TASK-070 (Daniel: the doors took too long to open; when they open it should turn colourful, in the ad's colours, with
// the hydration coming over you; or, simpler, a much calmer piece). Two variants of one timeline, both starting at the
// stop, so the doors open within the first second:
//   "wave" (A): the doors open, the ad's yellow pours in through the doorway, then the car fills like a glass: the water
//   (the poster's cyan and blues) rises over the camera, fizzes (the tablet's bubbles) under rays of yellow light, and
//   drains; the doors close, the train pulls out, runs the tunnel and pulls in again (the loop's seam is the stop).
//   "chill" (B): no water; the doors open slowly and stay open, warm light breathes in from the platform with dust
//   floating in it, the camera barely moves; the ride out and back is the same, softer (no jolt, dimmer lamps).
// The station outside is two strips (the platform near, the far wall) at their own depths, sharp and blurred; the tunnel
// is drawn (vectors).
const LIN = [0, 0, 1, 1];
const lin = (kf) => kf.map(([t, v], i, a) => (i < a.length - 1 ? [t, v, LIN] : [t, v]));
// a closed shape whose top edge is a smooth curve through surf (left to right), down to y = bottom
function waterPath(surf, bottom) {
  const n = surf.length, v = [...surf, [surf[n - 1][0], bottom], [surf[0][0], bottom]], i = [], o = [];
  for (let k = 0; k < n; k++) { const a = surf[Math.max(0, k - 1)], b = surf[Math.min(n - 1, k + 1)], tx = (b[0] - a[0]) / 6, ty = (b[1] - a[1]) / 6; i.push([-tx, -ty]); o.push([tx, ty]); }
  i.push([0, 0], [0, 0]); o.push([0, 0], [0, 0]);
  const r = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
  return { c: true, v: v.map(r), i: i.map(r), o: o.map(r) };
}
function linePath(surf) {
  const n = surf.length, i = [], o = [];
  for (let k = 0; k < n; k++) { const a = surf[Math.max(0, k - 1)], b = surf[Math.min(n - 1, k + 1)], tx = (b[0] - a[0]) / 6, ty = (b[1] - a[1]) / 6; i.push([-tx, -ty]); o.push([tx, ty]); }
  const r = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
  return { c: false, v: surf.map(r), i: i.map(r), o: o.map(r) };
}
const shKeys = (keys) => ({ ty: "sh", d: 1, ks: { a: 1, k: keys.map(([t, pth], j) => { const k = { t, s: [pth] }; if (j < keys.length - 1) { k.o = { x: [0], y: [0] }; k.i = { x: [1], y: [1] }; } return k; }) } });
const stroke = (hex, w, o = 100) => ({ ty: "st", c: { a: 0, k: rgb(hex) }, o: { a: 0, k: o }, w: { a: 0, k: w }, lc: 2, lj: 2, ml: 4, bm: 0 });

function inside(set, variant = "wave") {
  const S = SHOTS.inside, P = camPx("inside"), I = PL.inside, W = S.W, H = S.H, chill = variant === "chill";
  // the timeline (s): the stop is at 0 (the loop's seam); doors open at Tdo over Tdd, close at Tdc; the train leaves at
  // T1 (accelerating over Td to the tunnel's speed), runs the tunnel until Ttun and brakes over Ta into the station
  const T = chill
    ? { Tdo: 0.7, Tdd: 1.15, Tdc: 9.2, T1: 10.9, Td: 4.5, Ttun: 17.6, Ta: 4.5, L: 35 }
    : { Tdo: 0.45, Tdd: 0.7, Tdc: 6.6, T1: 7.9, Td: 4.0, Ttun: 13.4, Ta: 4.0, L: 31 };
  const { Tdo, Tdd, Tdc, T1, Td, Ttun, Ta, L } = T, END = Ttun + Ta;
  const op = sec(END), Cm = new Comp({ w: W, h: H, op, fr: FPS, nm: "metro-inside-" + variant });
  const ids = ["i-int", "i-refl", "i-leaf-a", "i-leaf-b", "i-near-sharp", "i-near-blur", "i-far", "i-far-blur"];
  const A = Object.fromEntries(ids.map((id) => [id, asset(Cm, set, id)]));
  const vmax = 2 * L / Td;
  // the train's own offset through the station (m): out (accelerating), the tunnel, back in from the other end (braking)
  const off = (t) => { const s = t / FPS; if (s < T1) return 0; if (s < T1 + Td) return L * ((s - T1) / Td) ** 2; if (s < Ttun) return L + vmax * (s - T1 - Td); return -L * (1 - (s - Ttun) / Ta) ** 2; };
  const v = (t) => { const s = t / FPS; if (s < T1) return 0; if (s < T1 + Td) return vmax * ((s - T1) / Td); if (s < Ttun) return vmax; return vmax * (1 - (s - Ttun) / Ta); };
  const inStation = (t) => { const s = t / FPS; return s < T1 + Td * 0.98 || s > Ttun + 0.02; };
  // the water (A): its level rises from below the frame over the camera, holds, drains (s)
  const Wv = { t0: 1.0, t1: 2.55, t2: 4.0, t3: 5.5 };
  const sub = (s) => (chill ? 0 : ramp(s, Wv.t1 - 0.5, Wv.t1 + 0.1) * (1 - ramp(s, Wv.t2, Wv.t2 + 0.6))); // (how far under)
  vignette(Cm, W, H, chill ? 0.3 : 0.46);
  // the camera: the car's rocking (with speed), the jolt of the stop (at the seam: it settles over the first second), and
  // under water a slow float
  const SW = (t) => {
    const s = t / FPS, k = v(t) / vmax * (chill ? 0.55 : 1), j = s < 1.2 ? Math.exp(-s * 4) * Math.sin(s * 11) * (chill ? 0.25 : 1) : 0, f = sub(s);
    return { r: 0.14 * k * Math.sin(s * 4.1) + 0.05 * k * Math.sin(s * 9.7) - 0.12 * j + f * 0.35 * Math.sin(s * 1.9), x: -5 * j + 1.2 * k * Math.sin(s * 6.3) + f * 7 * Math.sin(s * 1.3), y: 1.4 * k * Math.sin(s * 7.9 + 1) + 0.8 * k * Math.sin(s * 17) + f * 9 * Math.sin(s * 2.2 + 0.6) };
  };
  const cam = Cm.nul("camera (the car)", { ks: { a: [W / 2, H / 2], p: bake(0, op, (t) => { const q = SW(t); return [W / 2 + q.x, H / 2 + q.y]; }, 3, 1e-3, 0.6), r: bake(0, op, (t) => SW(t).r, 3, 1e-3, 0.025), s: [101.2, 101.2] } });
  const door = [300, 760]; // (the doorway's middle, px)

  if (!chill) {
    // ---- A: the hydration ----
    // Three waves in the poster's own colours come in through the open doorway one after the other (its yellow, the
    // cyan of "pentru un", then the blue of the headline, deepening to the logo's navy) and wash over the camera; for a
    // moment you are inside the drink, the tablet fizzing under rays of yellow light; then they drain in reverse order and
    // the car is back. Each wave is a static sine-topped body moved by its transforms (light on the page): the ripples
    // travel right (in from the doorway), a group rises and drains with the level and tilts as the water sloshes in.
    const f0 = sec(Wv.t0 - 0.05), f1 = sec(Wv.t3 + 0.5), BODY = H * 2.6;
    const WAVES = [
      { nm: "yellow", lam: 620, amp: 26, v: 260, d: 0, dd: 0.36, top: -260, stops: [[0, "#ffe46b"], [0.35, "#fdd525"], [1, "#f6c400"]], foam: "#fff7c2" },
      { nm: "cyan", lam: 470, amp: 22, v: 210, d: 0.2, dd: 0.18, top: -280, stops: [[0, "#9be9fb"], [0.35, "#41c6e6"], [1, "#1f9fd0"]], foam: "#e9fbff" },
      { nm: "blue", lam: 540, amp: 28, v: 240, d: 0.4, dd: 0, top: -320, stops: [[0, "#5d8fe6"], [0.3, "#3d5fb0"], [0.75, "#2a3a96"], [1, "#222c7c"]], foam: "#ffffff" }
    ];
    const lvl = (s, w) => { // (a wave's mean row: below the frame, over it, back down; the last one in drains first)
      const up = smooth(clamp((s - Wv.t0 - w.d) / (Wv.t1 - Wv.t0))), dn = smooth(clamp((s - Wv.t2 - w.dd) / (Wv.t3 - Wv.t2 - 0.36)));
      return (H + 140) + (w.top - (H + 140)) * up + ((H + 170) - w.top) * dn;
    };
    // the slosh: higher on the doorway's side as it pours in, settling; a lean the other way as it drains
    const tilt = (s, w) => { const u = Math.max(0, s - Wv.t0 - w.d); return (Math.atan2(330 * Math.exp(-u * 1.5) * Math.cos(u * 3.4), W) + Math.atan2(-120 * ramp(s, Wv.t2 + w.dd, Wv.t3), W)) * 180 / Math.PI; };
    const span = [-W * 1.2, W * 1.2 + (Wv.t3 - Wv.t0 + 0.6) * 270]; // (x in the level group's frame, centred on the frame)
    const sinePts = ({ lam, amp }, x0, x1) => { const n = Math.ceil((x1 - x0) / (lam / 8)), out = []; for (let i = 0; i <= n; i++) { const x = x0 + (i * lam) / 8; out.push([x, amp * Math.sin((2 * Math.PI * x) / lam)]); } return out; };
    const surfY = (s, x, w) => { const th = (tilt(s, w) * Math.PI) / 180, X = x - W / 2, xl = X - w.v * (s - Wv.t0); return lvl(s, w) + X * Math.tan(th) + w.amp * Math.sin((2 * Math.PI * xl) / w.lam); };
    const L0 = { parent: cam, ip: f0, op: f1 };
    const level = (w) => ({ p: lin(bake(f0, f1, (t) => [W / 2, lvl(t / FPS, w)], 2, 1e-3, 0.4).kf), r: lin(bake(f0, f1, (t) => tilt(t / FPS, w), 2, 1e-4, 0.03).kf) });
    const travel = (w) => ({ p: [[f0, [0, 0], LIN], [f1, [w.v * (f1 - f0) / FPS, 0]]] });
    const pts = (w) => sinePts(w, span[0] - w.v * 7, span[1]);
    const blue = WAVES[2];
    // (top of the stack first) bubbles: the tablet's fizz, rising inside the blue
    const rb = rng(7), bubbles = [];
    for (let b = 0; b < 46; b++) {
      const born = Wv.t0 + 0.6 + rb() * (Wv.t2 - Wv.t0 - 0.2), sz = 6 + rb() ** 2 * 34, sp = 200 + rb() * 300 + sz * 6, x0 = rb() * W, dr = (rb() - 0.5) * 60;
      const y0 = H + 40 + rb() * 160;
      const pos = (s) => { const u = s - born; return [x0 + u * dr, y0 - sp * u]; }; // (straight up, drifting: two keys)
      const vis = (s) => { if (s < born) return 0; const [x, y] = pos(s); return y > surfY(s, x, blue) + sz * 0.6 && y > -60 ? 1 : 0; };
      const bf0 = Math.max(f0, sec(born));
      const pk = [[bf0, pos(bf0 / FPS)], [f1, pos(f1 / FPS)]], okf = bake(bf0, f1, (t) => Math.round(100 * vis(t / FPS) * (0.5 + 0.5 * (sz / 40))), 1, 1e-3, 0.5).kf;
      if (okf.length === 1 && okf[0][1] === 0) continue;
      bubbles.push(group("bubble " + b, [
        ell(sz * 0.3, sz * 0.22, -sz * 0.17, -sz * 0.19), fill("#ffffff", 90),
        ell(sz, sz, 0, 0), gfill({ type: 2, s: [0, 0], e: [sz / 2, 0], stops: [[0, "#dff8ff"], [1, "#ffffff"]], alphas: [[0, 0.04], [0.7, 0.14], [0.9, 0.8], [1, 0]] })
      ], { p: lin(pk), o: okf.length > 1 ? okf.map(([t, v2], i, a) => (i < a.length - 1 ? [t, v2, "hold"] : [t, v2])) : okf[0][1] }));
    }
    Cm.shape("fizz", bubbles, { ...L0, bm: "screen" });
    // rays of the ad's yellow light from above, while under (screen)
    const rays = [[150, 80, -10], [400, 130, -4], [600, 70, 3], [830, 140, 8], [1000, 60, 13]].map(([x, w, a], i) => group("ray " + i, [
      shp([[-w / 2, 0], [w / 2, 0], [w * 1.9, H * 1.25], [-w * 1.2, H * 1.25]]), gfill({ type: 1, s: [0, 0], e: [0, H * 1.2], stops: [[0, "#fff4b8"], [1, "#ffd84a"]], alphas: [[0, 0.8], [0.5, 0.25], [1, 0]] })
    ], { p: [x, -40], r: [[sec(Wv.t1 - 0.4), a - 3 + i], [sec(Wv.t2 + 0.8), a + 3 - i]] }));
    Cm.shape("light rays", rays, { ...L0, bm: "screen", ks: { o: bake(f0, f1, (t) => 30 * sub(t / FPS), 2, 1e-3, 0.4) } });
    // the waves, the last in on top: each a body with its colour (deeper further down) and a foam line on its crest
    for (const w of [...WAVES].reverse()) {
      Cm.shape("wave · " + w.nm, [group("level", [group("ripples", [
        { ty: "sh", d: 1, ks: { a: 0, k: linePath(pts(w)) } }, stroke(w.foam, 7, 95), stroke(w.foam, 22, 30),
        { ty: "sh", d: 1, ks: { a: 0, k: waterPath(pts(w), BODY) } }, gfill({ type: 1, s: [0, -30], e: [0, H * 1.1], stops: w.stops, alphas: [[0, 1], [1, 1]] })
      ], travel(w))], level(w))], { ...L0 });
    }
  } else {
    // ---- B: calm ----
    const fo0 = sec(Tdo), fo1 = sec(Tdc + Tdd + 0.4);
    const wo = (s) => ramp(s, Tdo + 0.2, Tdo + 1.6) * (1 - ramp(s, Tdc - 0.2, Tdc + Tdd + 0.3)) * (0.78 + 0.22 * Math.sin((s - Tdo) * 0.7 - 1.2));
    // dust in the light from the platform: slow, drifting, catching the light now and then
    const rd = rng(11), motes = [];
    for (let m = 0; m < 30; m++) {
      const x0 = 30 + rd() * 640, y0 = 300 + rd() * 900, sz = 2 + rd() * 4.5, dx = 8 + rd() * 22, dy = -10 - rd() * 26, ph = rd() * 6.28, fr2 = 0.25 + rd() * 0.5;
      const pk = bake(fo0, fo1, (t) => { const u = t / FPS - Tdo; return [x0 + dx * u + 9 * Math.sin(u * fr2 + ph), y0 + dy * u + 6 * Math.sin(u * fr2 * 1.3 + ph * 2)]; }, 4, 1e-3, 0.3).kf;
      const ok = bake(fo0, fo1, (t) => { const u = t / FPS - Tdo; return 100 * (0.25 + 0.75 * Math.max(0, Math.sin(u * fr2 * 1.7 + ph)) ** 2); }, 4, 1e-3, 1).kf;
      motes.push(group("mote " + m, [ell(sz, sz, 0, 0), gfill({ type: 2, s: [0, 0], e: [sz / 2, 0], stops: [[0, "#fff3dc"], [1, "#fff3dc"]], alphas: [[0, 1], [0.5, 0.6], [1, 0]] })], { p: lin(pk), o: lin(ok) }));
    }
    Cm.shape("dust in the light", motes, { parent: cam, ip: fo0, op: fo1, bm: "screen", ks: { o: bake(fo0, fo1, (t) => 90 * wo(t / FPS), 3, 1e-3, 0.4) } });
    Cm.shape("warm light from the platform", [group("l", [ell(W * 1.9, H * 1.4, 0, 0), gfill({ type: 2, s: [0, 0], e: [W * 0.95, 0], stops: [[0, "#ffe2b0"], [0.5, "#ffc98a"], [1, "#ffb070"]], alphas: [[0, 1], [0.45, 0.45], [1, 0]] })], { p: [door[0] - 40, door[1] - 60] })],
      { parent: cam, ip: fo0, op: fo1, bm: "screen", ks: { o: bake(fo0, fo1, (t) => 46 * wo(t / FPS), 3, 1e-3, 0.4) } });
    // (and the whole piece a touch warmer and softer: a faint warm veil, screen)
    Cm.shape("warm veil", [group("v", [rect(W * 1.2, H * 1.2, W / 2, H / 2), gfill({ type: 1, s: [0, 0], e: [0, H], stops: [[0, "#ffd9a8"], [1, "#ffcf9a"]], alphas: [[0, 1], [1, 1]] })])], { parent: cam, bm: "screen", ks: { o: 7 } });
  }
  // the tunnel's lamps: the light of each one sweeps the car as it passes (a soft band, screen)
  const lampEvery = 12 / vmax, lamps = []; for (let s = T1 + Td + 0.35; s < Ttun - 0.1; s += lampEvery) lamps.push(s);
  const sweepW = W * 0.9;
  Cm.shape("lamp light on the car", lamps.map((s0, i) => group("sweep " + i, [rect(sweepW, H * 2, 0, 0), gfill({ type: 1, s: [-sweepW / 2, 0], e: [sweepW / 2, 0], stops: [[0, "#ffd9a0"], [0.5, "#ffd9a0"], [1, "#ffd9a0"]], alphas: [[0, 0], [0.5, 1], [1, 0]] })],
    { p: { kf: [[sec(s0 - 0.25), [-sweepW, H / 2]], [sec(s0 + 0.25), [W + sweepW, H / 2]]] } })), { parent: cam, bm: "screen", ks: { o: chill ? 8 : 13 } });
  // the windows' reflection of the car: strong in the dark tunnel, gone in the lit station
  const reflO = (t) => { const s = t / FPS; return 6 + (chill ? 34 : 46) * (ramp(s, T1 + Td - 0.9, T1 + Td + 0.2) * (1 - ramp(s, Ttun - 0.3, Ttun + 0.9))); };
  Cm.imgLayer("windows' reflection", "i-refl", { parent: cam, bm: "screen", ks: { o: bake(0, op, reflO, 2, 1e-3, 0.4) } });
  Cm.imgLayer("interior", "i-int", { parent: cam });
  // the leaves (pocket doors: they slide behind the panels; B's ease is slower and softer)
  const E2 = (t, a, b) => (chill ? (1 - Math.cos(Math.PI * clamp((t - a) / (b - a)))) / 2 : ramp(t, a, b));
  const open = (t) => (t >= sec(Tdc + Tdd) ? 0 : t >= sec(Tdc) ? 1 - E2(t, sec(Tdc), sec(Tdc + Tdd)) : E2(t, sec(Tdo), sec(Tdo + Tdd)));
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
    { p: { kf: [[sec(s0 - 0.12), [-W * 0.6, lampY]], [sec(s0 + 0.12), [W * 1.6, lampY]]] } })), { parent: cam, ks: { o: bake(0, op, (t) => (inStation(t) ? 0 : chill ? 70 : 100), 1) } });
  const cables = [0.55, 0.62, 0.7, 0.78, 2.15, 2.22].map((y, i) => group("cable " + i, [rect(W * 1.4, 3 + (i % 3), W / 2, P.horizon - (y - S.cam.pos[1]) * pxmT), fill(i < 4 ? "#2a2b2c" : "#1f2021", 100)]));
  Cm.shape("tunnel wall", [...cables, group("wall", [rect(W * 1.4, H * 1.4, W / 2, H / 2), gfill({ type: 1, s: [0, 0], e: [0, H], stops: [[0, "#121314"], [0.45, "#1a1b1c"], [1, "#0d0d0e"]] })])], { parent: cam });
  Cm.marker("loop", 0, op);
  return Cm.json();
}

// ---------- shot 1: the platform: the far wall's posters, a slow breath of the camera ----------
function platform(set) {
  const S = SHOTS.platform, P = camPx("platform"), PP = PL.platform, W = S.W, H = S.H, END = 12, op = sec(END);
  const Cm = new Comp({ w: W, h: H, op, fr: FPS, nm: "metro-platform" });
  asset(Cm, set, "p-bg");
  vignette(Cm, W, H, 0.4);
  const cam = drift(Cm, W, H, { s: 1.4, px: 6, py: 2 });
  // (TASK-070, Daniel: the hooded passers-by read as ghosts. They are gone: the frame is the posters, still, with the
  // camera's slow breath and the light of a train on the other track sliding across the frames' glass)
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

// (TASK-070: the carriage in two variants: "inside" is A, the wave (the page's default); "inside-chill" is B)
const BUILDERS = { train, inside: (set) => inside(set, "wave"), "inside-chill": (set) => inside(set, "chill"), platform };
const which = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(BUILDERS);
for (const shot of which) {
  for (const set of ["s1", "s2", "video"]) {
    const j = BUILDERS[shot](set), s = JSON.stringify(j);
    const f = set === "video" ? path.join(PLATES, `metro-${shot}-video.json`) : path.join(root, "src/lottie-ui", `metro-${shot}-${set}.json`);
    fs.writeFileSync(f, s);
    if (set !== "video") console.log(path.relative(root, f), (s.length / 1024).toFixed(1), "KB,", j.layers.length, "layers,", j.op, "frames");
  }
}
