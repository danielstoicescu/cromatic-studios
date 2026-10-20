// Nine cups v2 · the bake. Renders the ORIGINAL intro cup (tools/bake2.html: three r169, the original geometry,
// materials and lights) for every view the opening needs, and reads off it what the vectors cannot compute themselves:
//   · the visible handle, traced from a mask pass (white handle, everything that hides it black): the occlusion is exact,
//     the ring closes, it meets the body where the body is
//   · the colours: the glaze across and up the body, the lip, the inside, the coffee, the handle's light, sampled from
//     the beauty pass along lines the geometry (lib/cup2geo.mjs) places
// Run from ~ (serve the repo root on 8579): node <repo>/design/intro-lottie/_source/tools/bakecups2.mjs
// -> _source/bake/ninecups2.json
import pw from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const here = path.dirname(fileURLToPath(import.meta.url));
const sharp = createRequire(import.meta.url)(path.resolve(here, "../../../../node_modules/sharp"));
const G = await import("../lib/cup2geo.mjs");
const { contours, simplify } = await import("../lib/trace.mjs");
const L = await import("../directions/ninecups2.layout.mjs");
const PORT = process.env.PORT || 8579;
const ONLY = process.env.CUPS ? process.env.CUPS.split(",").map(Number) : null;
const PX = 560, HALF = 2.8, K = PX / (2 * HALF); // a tile: 5.6 wall units across, 100 px a unit
const { Zc, ycam } = L.CAM;
const cam = G.wallCam({ Zc, ycam });

const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
const page = await br.newPage({ viewport: { width: 640, height: 640 } });
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.goto(`http://localhost:${PORT}/design/intro-lottie/_source/tools/bake2.html`);
await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
const DESIGNS = await page.evaluate(() => window.DESIGNS);
const render = async (o) => {
  const url = await page.evaluate((q) => window.tile(q), { px: PX, half: HALF, Zc, ycam, ...o });
  const { data, info } = await sharp(Buffer.from(url.split(",")[1], "base64")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, d: data };
};
const px = (im, x, y) => { x = Math.max(0, Math.min(im.w - 1, Math.round(x))); y = Math.max(0, Math.min(im.h - 1, Math.round(y))); const i = (y * im.w + x) * 4; return [im.d[i], im.d[i + 1], im.d[i + 2], im.d[i + 3]]; };
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const r3 = (v) => Math.round(v * 1000) / 1000;

// the tile's framing for a view, and the mapping between tile pixels and wall units
const frameOf = (xf) => { const a = cam.P(xf.still([0, 1.0, 0])); return { cx: a[0], cy: a[1] }; };
const toWall = (fr, p) => [fr.cx + (p[0] - PX / 2) / K, fr.cy - (p[1] - PX / 2) / K];
const toPx = (fr, q) => [(q[0] - fr.cx) * K + PX / 2, PX / 2 - (q[1] - fr.cy) * K];

// average colour along a pixel line a -> b at n points (only where ok(x, y)), smoothing across w pixels
function profile(im, fr, a, b, n, ok = () => true, w = 2) {
  const A = toPx(fr, a), B = toPx(fr, b), dx = B[0] - A[0], dy = B[1] - A[1], Ln = Math.hypot(dx, dy) || 1, nx = -dy / Ln, ny = dx / Ln;
  const out = [];
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), x = A[0] + dx * t, y = A[1] + dy * t;
    let s = [0, 0, 0], c = 0;
    for (let o = -w; o <= w; o++) { const X = x + nx * o, Y = y + ny * o; const p = px(im, X, Y); if (p[3] > 250 && ok(X, Y)) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; c++; } }
    out.push(c ? { t, c: s.map((v) => v / c) } : { t, c: null });
  }
  return out;
}
// a profile into gradient stops: fill the gaps, then keep the stops that matter (the curve within tol of the full one)
function toStops(prof, maxStops = 12, tol = 3) {
  const P = prof.slice();
  // fill gaps by nearest known
  for (let k = 0; k < P.length; k++) if (!P[k].c) { let a = k - 1, b = k + 1; while (a >= 0 && !P[a].c) a--; while (b < P.length && !P[b].c) b++; const A = a >= 0 ? P[a] : null, B = b < P.length ? P[b] : null; P[k] = { t: P[k].t, c: A && B ? A.c.map((v, i) => v + ((B.c[i] - v) * (k - a)) / (b - a)) : (A || B || { c: [128, 128, 128] }).c }; }
  // greedy: start with the ends, add the worst point until within tolerance or out of stops
  const keep = new Set([0, P.length - 1]);
  const err = () => { let worst = 0, wi = -1; const ks = [...keep].sort((x, y) => x - y); for (let s = 0; s < ks.length - 1; s++) { const a = ks[s], b = ks[s + 1]; for (let k = a + 1; k < b; k++) { const f = (k - a) / (b - a); const e = Math.max(...[0, 1, 2].map((i) => Math.abs(P[a].c[i] + (P[b].c[i] - P[a].c[i]) * f - P[k].c[i]))); if (e > worst) { worst = e; wi = k; } } } return [worst, wi]; };
  for (let g = 0; g < maxStops; g++) { const [e, wi] = err(); if (e <= tol || wi < 0) break; keep.add(wi); }
  return [...keep].sort((x, y) => x - y).map((k) => [r3(P[k].t), hex(P[k].c)]);
}
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

// the front of the cup at a height: the point of that ring facing the camera most, and the axis on screen
function frontAt(xf, r, y) { let best = null, bz = -Infinity; for (let k = 0; k < 360; k++) { const ph = (k / 360) * Math.PI * 2, w = xf.spun(G.lathePt(r, y, ph)); if (w[2] > bz) { bz = w[2]; best = ph; } } return best; }

// the visible handle from its mask: outlines (up to two) and holes (up to one), in wall units
function handleShapes(im, fr, hullW) {
  const cs = contours(im.w, im.h, (x, y) => im.d[(y * im.w + x) * 4]);
  const outs = cs.filter((c) => c.area < -6).sort((a, b) => a.area - b.area), holes = cs.filter((c) => c.area > 6).sort((a, b) => b.area - a.area);
  const conv = (c) => simplify(c.pts, 0.35).map((p) => toWall(fr, p).map(r3));
  // the part of the visible handle that lies over the cup (in front of it): outside the cup's outline the outline's own
  // mask shows the handle; inside it only this part may show
  const H = hullW.map((q) => toPx(fr, q));
  const inHull = (x, y) => { let c = false; for (let i = 0, j = H.length - 1; i < H.length; j = i++) { const a = H[i], b = H[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const fcs = contours(im.w, im.h, (x, y) => (inHull(x + 0.5, y + 0.5) ? im.d[(y * im.w + x) * 4] : 0));
  const fouts = fcs.filter((c) => c.area < -4).sort((a, b) => a.area - b.area);
  return { outs: outs.slice(0, 2).map(conv), holes: holes.slice(0, 1).map(conv), front: fouts.slice(0, 2).map(conv), areas: [outs.map((c) => c.area / (K * K)), holes.map((c) => c.area / (K * K))] };
}
// the handle's light: a linear gradient along the direction its colours change most, sampled across the visible handle
function handleLight(im, mask, fr) {
  const pts = [];
  for (let y = 0; y < im.h; y += 2) for (let x = 0; x < im.w; x += 2) { const m = mask.d[(y * im.w + x) * 4]; if (m > 240) { const p = px(im, x, y); if (p[3] > 250) pts.push([x, y, p]); } }
  if (pts.length < 12) return null;
  // the direction: least squares of luminance on position
  const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n, ml = pts.reduce((s, p) => s + lum(p[2]), 0) / n;
  let sxx = 0, syy = 0, sxy = 0, sxl = 0, syl = 0;
  for (const [x, y, c] of pts) { const X = x - mx, Y = y - my, Lm = lum(c) - ml; sxx += X * X; syy += Y * Y; sxy += X * Y; sxl += X * Lm; syl += Y * Lm; }
  const det = sxx * syy - sxy * sxy || 1, gx = (sxl * syy - syl * sxy) / det, gy = (syl * sxx - sxl * sxy) / det, gl = Math.hypot(gx, gy) || 1;
  const ux = gx / gl, uy = gy / gl;
  const proj = pts.map(([x, y, c]) => [(x - mx) * ux + (y - my) * uy, c]);
  const t0 = Math.min(...proj.map((q) => q[0])), t1 = Math.max(...proj.map((q) => q[0]));
  const NB = 9, bins = Array.from({ length: NB }, () => [0, 0, 0, 0]);
  for (const [t, c] of proj) { const b = Math.min(NB - 1, Math.floor(((t - t0) / (t1 - t0 || 1)) * NB)); bins[b][0] += c[0]; bins[b][1] += c[1]; bins[b][2] += c[2]; bins[b][3]++; }
  const prof = bins.map((b, i) => ({ t: (i + 0.5) / NB, c: b[3] ? [b[0] / b[3], b[1] / b[3], b[2] / b[3]] : null }));
  const s = [mx + ux * t0, my + uy * t0], e = [mx + ux * t1, my + uy * t1];
  return { s: toWall(fr, s).map(r3), e: toWall(fr, e).map(r3), stops: toStops(prof, 6, 4), hi: hex(pts.reduce((b, p) => (lum(p[2]) > lum(b) ? p[2] : b), [0, 0, 0])) };
}

// the handle's glint: where the beauty is brightest within the handle (its own top tenth), traced; and how bright
function handleHi(im, mask, fr) {
  let mx = 0, sum = 0, n = 0;
  for (let i = 0; i < im.w * im.h; i++) if (mask.d[i * 4] > 240 && im.d[i * 4 + 3] > 250) { const l = lum([im.d[i * 4], im.d[i * 4 + 1], im.d[i * 4 + 2]]); mx = Math.max(mx, l); sum += l; n++; }
  if (n < 30) return null;
  const mean = sum / n, thr = mean + (mx - mean) * 0.55;
  if (mx - mean < 14) return null;
  const cs = contours(im.w, im.h, (x, y) => { const i = (y * im.w + x) * 4; if (mask.d[i] < 200 || im.d[i + 3] < 250) return 0; const l = lum([im.d[i], im.d[i + 1], im.d[i + 2]]); return Math.max(0, Math.min(255, ((l - thr) / (mx - thr || 1)) * 255 + 127.5)); });
  const outs = cs.filter((c) => c.area < -4).sort((a, b) => a.area - b.area);
  if (!outs.length) return null;
  return { pts: simplify(outs[0].pts, 0.35).map((p) => toWall(fr, p).map(r3)), k: r3((mx - mean) / 255) };
}
// the visible coffee, traced from its mask (its edge where the lip hides it is the lip's own)
function traceMask(m, fr) {
  const cs = contours(m.w, m.h, (x, y) => m.d[(y * m.w + x) * 4]);
  const outs = cs.filter((c) => c.area < -6).sort((a, b) => a.area - b.area);
  return outs.length ? simplify(outs[0].pts, 0.3).map((p) => toWall(fr, p).map(r3)) : null;
}
const out = { v: 1, cam: L.CAM, tile: { PX, HALF }, designs: DESIGNS, cups: [] };
const OUTF = path.resolve(here, "../bake/ninecups2.json");
let prev = null;
if (ONLY && fs.existsSync(OUTF)) prev = JSON.parse(fs.readFileSync(OUTF, "utf8"));
for (const cup of L.CUPS) {
  if (ONLY && !ONLY.includes(cup.n)) { out.cups.push(prev ? prev.cups[cup.n] : null); continue; }
  const D = DESIGNS[cup.design], pat = D.outer.pat || null;
  const C = { n: cup.n, design: cup.design, world: cup.world, X: cup.X, Xv: cup.Xv, Y: cup.Y, yaw0: cup.yaw0, tilt: [], turn: [] };
  const t0 = Date.now();
  // the tilt (straight above -> the old angle), the handle where it will stand
  for (let i = 0; i <= L.NT; i++) {
    const u = i / L.NT, tilt = L.tiltAt(u), V = { X: cup.Xv, Y: cup.Y, tilt, yaw: cup.yaw0 };
    C.tilt.push({ u: r3(u), tilt: r3(tilt), ...(await bakeView(cup, D, pat, V, true)) });
  }
  // the turn at the old angle
  for (let k = 0; k < L.NY; k++) {
    // (the turn from the handle at 0: the cups of a row share it, each plays it from its own angle)
    const V = { X: cup.Xv, Y: cup.Y, tilt: L.TILT_END, yaw: (k / L.NY) * Math.PI * 2 };
    C.turn.push({ k, ...(await bakeView(cup, D, pat, V, false)) });
  }
  out.cups.push(C);
  console.log("cup", cup.n, D.name, ((Date.now() - t0) / 1000).toFixed(1) + " s", "handle pieces", C.turn.map((q) => q.handle.outs.length + (q.handle.holes.length ? "h" : "")).join(" "));
}
fs.mkdirSync(path.dirname(OUTF), { recursive: true });
fs.writeFileSync(OUTF, JSON.stringify(out));
await br.close();
console.log("baked", OUTF, (fs.statSync(OUTF).size / 1024).toFixed(0) + " KB");

async function bakeView(cup, D, pat, V, full) {
  const xf = G.cupXf(V), fr = frameOf(xf);
  const beauty = await render({ design: cup.design, ...V, cx: fr.cx, cy: fr.cy, pass: "beauty" });
  const hmask = await render({ design: cup.design, ...V, cx: fr.cx, cy: fr.cy, pass: "handle" });
  const R = { frame: [r3(fr.cx), r3(fr.cy)], handle: handleShapes(hmask, fr, G.bodyHull(cam, xf)), handleLight: handleLight(beauty, hmask, fr), handleHi: handleHi(beauty, hmask, fr) };
  if (!full) return R;
  // the glaze: a solid render of the body's colour (white for a patterned cup), and of the pattern's colour
  const bodyCol = pat ? "#f8f6f1" : D.outer.color;
  const solid = await render({ design: cup.design, ...V, cx: fr.cx, cy: fr.cy, pass: "beauty", solid: bodyCol });
  const solidP = pat ? await render({ design: cup.design, ...V, cx: fr.cx, cy: fr.cy, pass: "beauty", solid: D.outer.col }) : null;
  const bmask = await render({ design: cup.design, ...V, cx: fr.cx, cy: fr.cy, pass: "body" });
  const onBody = (x, y) => px(bmask, x, y)[0] > 240 && px(hmask, x, y)[0] < 16;
  // the axis on screen, and the line across the body at the height of its widest visible band
  const ax0 = cam.P(xf.spun([0, 0, 0])), ax1 = cam.P(xf.spun([0, 2, 0]));
  const au = [ax1[0] - ax0[0], ax1[1] - ax0[1]], al = Math.hypot(au[0], au[1]) || 1, A = [au[0] / al, au[1] / al], Nn = [A[1], -A[0]]; // Nn: across (to the right)
  const yMid = 1.0, phF = frontAt(xf, G.outerR(yMid), yMid), mid = cam.P(xf.spun(G.lathePt(G.outerR(yMid), yMid, phF)));
  // the body's extent across through that point (from its outline)
  const H = G.bodyHull(cam, xf);
  const along = H.map((q) => (q[0] - mid[0]) * Nn[0] + (q[1] - mid[1]) * Nn[1]);
  const w0 = Math.min(...along), w1 = Math.max(...along);
  const a = [mid[0] + Nn[0] * w0, mid[1] + Nn[1] * w0], b = [mid[0] + Nn[0] * w1, mid[1] + Nn[1] * w1];
  const across = profile(solid, fr, a, b, 48, onBody, 2);
  if (across.filter((q) => q.c).length < 4) { R.body = null; return lipEtc(); } // (straight above: the wall is not seen)
  R.body = { s: a.map(r3), e: b.map(r3), stops: toStops(across, 14, 2.5) };
  if (solidP) R.pattern = { s: a.map(r3), e: b.map(r3), stops: toStops(profile(solidP, fr, a, b, 48, onBody, 2), 14, 2.5) };
  // up the front: how much lighter or darker than at the middle height (an overlay, black or white with alpha)
  const midC = across.filter((q) => q.c).reduce((bst, q) => (Math.abs(q.t - (-w0 / (w1 - w0))) < Math.abs(bst.t - (-w0 / (w1 - w0))) ? q : bst)).c;
  const vert = [];
  const ys = [0.06, 0.15, 0.3, 0.5, 0.75, 1.0, 1.3, 1.6, 1.85, 1.97];
  for (const y of ys) { const ph = frontAt(xf, G.outerR(y), y), p = cam.P(xf.spun(G.lathePt(G.outerR(y), y, ph))); const q = toPx(fr, p); const s = [0, 0, 0]; let c = 0; for (let o = -3; o <= 3; o++) { const X = q[0] + Nn[0] * o * 1, Y = q[1] - Nn[1] * o * 1; const pp = px(solid, X, Y); if (pp[3] > 250 && onBody(X, Y)) { s[0] += pp[0]; s[1] += pp[1]; s[2] += pp[2]; c++; } } vert.push({ p, c: c ? s.map((v) => v / c) : null }); }
  const okV = vert.filter((q) => q.c);
  if (okV.length >= 2) {
    const v0 = okV[0].p, v1 = okV[okV.length - 1].p, vl = Math.hypot(v1[0] - v0[0], v1[1] - v0[1]) || 1;
    R.vert = { midL: r3(lum(midC) / 255), s: v0.map(r3), e: v1.map(r3), stops: okV.map((q) => { const t = ((q.p[0] - v0[0]) * (v1[0] - v0[0]) + (q.p[1] - v0[1]) * (v1[1] - v0[1])) / (vl * vl); const ratio = lum(q.c) / (lum(midC) || 1); return [r3(Math.max(0, Math.min(1, t))), r3(ratio)]; }) };
  }
  return lipEtc();
  async function lipEtc() {
  // the lip, the inside, the coffee: along the axis through the opening (far side to near side), and across the inside
  const omask = await render({ design: cup.design, ...V, cx: fr.cx, cy: fr.cy, pass: "open" });
  const comask = await render({ design: cup.design, ...V, cx: fr.cx, cy: fr.cy, pass: "coffee" });
  R.coffeeVis = traceMask(comask, fr);
  const rimO = G.projCircle(cam, xf, 1.44, 1.995, { still: false }), open = G.projCircle(cam, xf, 1.315, 2.035, { still: false }), cof = G.projCircle(cam, xf, G.LIQ.r, G.LIQ.y, { still: true });
  R.rim = ell(rimO); R.open = ell(open); R.coffee = ell(cof);
  // a line along the axis direction through the opening's centre, from beyond the far rim to beyond the near rim
  const oc = [open.cx, open.cy], ext = rimO.a + 0.3;
  const la = [oc[0] + A[0] * ext, oc[1] + A[1] * ext], lb = [oc[0] - A[0] * ext, oc[1] - A[1] * ext]; // far (up the axis) -> near
  const isLip = (x, y) => px(omask, x, y)[0] > 240 && px(comask, x, y)[0] < 16 && px(hmask, x, y)[0] < 16;
  const isCof = (x, y) => px(comask, x, y)[0] > 240 && px(hmask, x, y)[0] < 16;
  R.axisLine = { s: la.map(r3), e: lb.map(r3) };
  R.openProf = profile(beauty, fr, la, lb, 64, isLip, 1).map((q) => ({ t: r3(q.t), c: q.c ? hex(q.c) : null }));
  R.cofProf = profile(beauty, fr, la, lb, 64, isCof, 1).map((q) => ({ t: r3(q.t), c: q.c ? hex(q.c) : null }));
  // across the coffee and across the inside wall (at the middle of what is seen of it)
  const cc = [cof.cx, cof.cy], ca = [cc[0] - Nn[0] * (cof.a + 0.1), cc[1] - Nn[1] * (cof.a + 0.1)], cb = [cc[0] + Nn[0] * (cof.a + 0.1), cc[1] + Nn[1] * (cof.a + 0.1)];
  R.cofAcross = { s: ca.map(r3), e: cb.map(r3), prof: profile(beauty, fr, ca, cb, 48, isCof, 1).map((q) => ({ t: r3(q.t), c: q.c ? hex(q.c) : null })) };
  // the inside wall's band: halfway between the opening's far edge and the coffee's far edge, along the axis
  const farO = [oc[0] + A[0] * open.b, oc[1] + A[1] * open.b], farC = [cof.cx + A[0] * cof.b, cof.cy + A[1] * cof.b];
  const wm = [(farO[0] + farC[0]) / 2, (farO[1] + farC[1]) / 2];
  const wa = [wm[0] - Nn[0] * open.a, wm[1] - Nn[1] * open.a], wb = [wm[0] + Nn[0] * open.a, wm[1] + Nn[1] * open.a];
  R.wallAcross = { s: wa.map(r3), e: wb.map(r3), prof: profile(beauty, fr, wa, wb, 40, isLip, 1).map((q) => ({ t: r3(q.t), c: q.c ? hex(q.c) : null })) };
  // the axis direction and the body's outline (for the shapes the direction draws)
  R.axis = [r3(A[0]), r3(A[1])];
  return R;
  }
}
function ell(e) { return { cx: r3(e.cx), cy: r3(e.cy), a: r3(e.a), b: r3(e.b), ang: r3(e.ang) }; }
