// Cromatic · Litorsal OOH mockups (TASK-069): the street's surfaces, drawn on canvases (no photographs: every texture is
// ours). Seeded, so a re-render is the same picture. Built on the metro mockups' noise helpers.
import * as THREE from "three";
import { rng } from "../../../metro-mockup/_source/scene/lib.js";
import { greyTile, overlay, canvas, tex } from "../../../metro-mockup/_source/scene/tex.js";
export { tex, canvas };

const hex = (h, k = 1) => { const n = parseInt(h.slice(1), 16); return `rgb(${Math.min(255, Math.round(((n >> 16) & 255) * k))},${Math.min(255, Math.round(((n >> 8) & 255) * k))},${Math.min(255, Math.round((n & 255) * k))})`; };
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const lerpHex = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return "#" + [16, 8, 0].map((s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0")).join(""); };

// ---------- asphalt, sun-bleached, with patches and the tyres' darker tracks; span m a canvas ----------
export function asphalt({ px = 2048, span = 12, seed = 31, base = "#56544f", lanes = [] } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d"), k = px / span;
  x.fillStyle = base; x.fillRect(0, 0, px, px);
  overlay(x, greyTile(512, { P: 3, oct: 6, seed }, { lo: 0.62, hi: 1 }), { op: "multiply", a: 0.6, seed, scale: 2 });
  overlay(x, greyTile(512, { P: 64, oct: 2, seed: seed + 1 }, { lo: 0.55, hi: 1 }), { op: "multiply", a: 0.6, seed: seed + 2, scale: 0.5 });
  // aggregate: light stones in the worn binder
  for (let g = 0; g < px * px * 0.02; g++) { const s = (0.5 + r() * 1.6) * (px / 2048); x.fillStyle = r() < 0.6 ? `rgba(190,186,176,${0.25 + r() * 0.4})` : `rgba(25,24,22,${0.3 + r() * 0.4})`; x.fillRect(r() * px, r() * px, s, s); }
  // patches (darker, newer) and sealed cracks
  for (let p = 0; p < 7; p++) { const w = (1 + r() * 3) * k, h = (0.6 + r() * 2) * k; x.fillStyle = `rgba(30,29,28,${0.18 + r() * 0.2})`; x.fillRect(r() * px, r() * px, w, h); }
  x.lineCap = "round";
  for (let s = 0; s < 22; s++) { x.strokeStyle = `rgba(18,17,16,${0.35 + r() * 0.35})`; x.lineWidth = (0.5 + r() * 1.5) * (px / 2048) * 2; x.beginPath(); let cx = r() * px, cy = r() * px; x.moveTo(cx, cy); for (let i = 0; i < 8; i++) { cx += (r() - 0.5) * 120; cy += (r() - 0.3) * 90; x.lineTo(cx, cy); } x.stroke(); }
  const rc = canvas(px >> 1, px >> 1), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,215,0)"; rx.fillRect(0, 0, rc.width, rc.height);
  overlay(rx, greyTile(256, { P: 6, oct: 4, seed: seed + 3 }, { lo: 0, hi: 1 }), { op: "multiply", a: 0.2, seed: 3, scale: 2 });
  return { map: c, rough: rc, span };
}
// ---------- concrete slabs (the sidewalk, the tram's bed), tw m, grimy joints ----------
export function slabs({ px = 2048, span = 6, tw = 0.4, th = 0.4, seed = 41, base = "#a29d92" } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d"), k = px / span, nx = Math.round(span / tw), ny = Math.round(span / th);
  x.fillStyle = base; x.fillRect(0, 0, px, px);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { x.fillStyle = hex(base, 0.86 + r() * 0.2); x.fillRect(i * tw * k, j * th * k, tw * k, th * k); if (r() < 0.08) { x.fillStyle = "rgba(40,36,30,0.18)"; x.fillRect(i * tw * k, j * th * k, tw * k, th * k); } }
  overlay(x, greyTile(512, { P: 4, oct: 6, seed }, { lo: 0.6, hi: 1 }), { op: "multiply", a: 0.6, seed, scale: 2 });
  overlay(x, greyTile(512, { P: 48, oct: 2, seed: seed + 3 }, { lo: 0.75, hi: 1 }), { op: "multiply", a: 0.5, seed, scale: 0.5 });
  x.fillStyle = "rgba(48,44,38,0.7)";
  for (let i = 0; i <= nx; i++) x.fillRect(i * tw * k - 2, 0, 4, px);
  for (let j = 0; j <= ny; j++) x.fillRect(0, j * th * k - 2, px, 4);
  // gum spots, old stains
  for (let s = 0; s < 120; s++) { x.fillStyle = `rgba(30,28,25,${0.15 + r() * 0.25})`; x.beginPath(); x.ellipse(r() * px, r() * px, 2 + r() * 5, 2 + r() * 4, 0, 0, 6.283); x.fill(); }
  const rc = canvas(px >> 1, px >> 1), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,225,0)"; rx.fillRect(0, 0, rc.width, rc.height);
  return { map: c, rough: rc, span };
}
// ---------- dry summer grass (the strip between the sidewalk and the blocks) ----------
export function grass({ px = 1024, span = 4, seed = 51 } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d");
  x.fillStyle = "#6f7a3c"; x.fillRect(0, 0, px, px);
  overlay(x, greyTile(512, { P: 3, oct: 6, seed }, { lo: 0.5, hi: 1 }), { op: "multiply", a: 0.7, seed, scale: 2 });
  for (let b = 0; b < px * px * 0.05; b++) { const t = r(); x.strokeStyle = t < 0.4 ? `rgba(170,160,90,${0.4 + r() * 0.4})` : t < 0.8 ? `rgba(80,100,40,${0.4 + r() * 0.4})` : `rgba(120,100,60,${0.4 + r() * 0.4})`; x.lineWidth = 1; x.beginPath(); const sx = r() * px, sy = r() * px; x.moveTo(sx, sy); x.lineTo(sx + (r() - 0.5) * 6, sy - 3 - r() * 8); x.stroke(); }
  const rc = canvas(256, 256), rx = rc.getContext("2d"); rx.fillStyle = "rgb(0,245,0)"; rx.fillRect(0, 0, 256, 256);
  return { map: c, rough: rc, span };
}

// ---------- a block of flats' facade: prefab panels, windows by bay, the owners' own insulation patches ----------
// W x H m (H includes the ground floor GF); floors of FH m; bays of BW m. Windows are painted (glass dark with a sky
// sheen, frames white PVC or old brown wood, curtains); balcony bays (balc: Set of bay indices) get a door and a window
// behind where the balcony boxes stand (geometry, built by the caller). k px per metre.
export function facade({ W, H, GF = 3.4, FH = 2.75, BW = 3.6, k = 48, seed = 61, base = "#d9c9a8", palette = ["#e6d3ae", "#d8c7a6", "#e9dcc2", "#cdb38c", "#e2c9a0", "#c9c2b1", "#e7cfb5"], balc = new Set(), shop = true, gable = false } = {}) {
  const r = rng(seed), px = Math.round(W * k), py = Math.round(H * k), c = canvas(px, py), x = c.getContext("2d");
  const Y = (ym) => py - ym * k; // metres from the ground -> canvas row
  x.fillStyle = base; x.fillRect(0, 0, px, py);
  const floors = Math.floor((H - GF) / FH), bays = Math.round(W / BW);
  // panels: one per bay and floor, each its own shade (weathered differently); some insulated (a brighter, smoother
  // colour, its own outline: the owner's polystyrene)
  for (let f = 0; f < floors; f++) for (let b = 0; b < bays; b++) {
    const X0 = b * BW * k, Y0 = Y(GF + (f + 1) * FH), w = BW * k, h = FH * k;
    x.fillStyle = hex(base, 0.9 + r() * 0.12); x.fillRect(X0, Y0, w, h);
    if (!gable && r() < 0.13) { x.fillStyle = palette[Math.floor(r() * palette.length)]; x.fillRect(X0 + 2, Y0 + 2, w - 4, h - 4); x.strokeStyle = "rgba(255,255,255,0.25)"; x.lineWidth = 2; x.strokeRect(X0 + 3, Y0 + 3, w - 6, h - 6); }
  }
  overlay(x, greyTile(512, { P: 3, oct: 6, seed }, { lo: 0.7, hi: 1 }), { op: "multiply", a: 0.45, seed, scale: k / 24 });
  overlay(x, greyTile(512, { P: 24, oct: 3, seed: seed + 1 }, { lo: 0.8, hi: 1 }), { op: "multiply", a: 0.35, seed: seed + 2, scale: k / 48 });
  // panel joints (sealed, darker), the floor lines
  x.fillStyle = "rgba(70,60,50,0.45)";
  for (let b = 0; b <= bays; b++) x.fillRect(b * BW * k - 1.5, 0, 3, Y(GF));
  for (let f = 0; f <= floors; f++) x.fillRect(0, Y(GF + f * FH) - 1.5, px, 3);
  const win = [];
  if (!gable) for (let f = 0; f < floors; f++) for (let b = 0; b < bays; b++) {
    const y0 = GF + f * FH, X0 = b * BW * k;
    if (balc.has(b)) { // a door and a window behind the balcony
      win.push([X0 + 0.45 * k, Y(y0 + 2.2), 0.8 * k, 2.15 * k, f, b, "door"]);
      win.push([X0 + 1.45 * k, Y(y0 + 2.2), 1.7 * k, 1.35 * k, f, b, "win"]);
    } else { const ww = r() < 0.5 ? 1.8 : 1.5; win.push([X0 + (BW - ww) / 2 * k, Y(y0 + 2.15), ww * k, 1.4 * k, f, b, "win"]); }
  }
  // stairwell: a column of narrow windows at half-floors
  for (const [X0, Y0, w, h, f, b, kind] of win) {
    const pvc = r() < 0.62, frame = pvc ? "#eeeeea" : r() < 0.6 ? "#5a3f2a" : "#8a7f70";
    // the reveal's shadow (top and left: the sun is high and right; the recess)
    x.fillStyle = "rgba(40,32,24,0.55)"; x.fillRect(X0 - 4, Y0 - 5, w + 8, h + 9);
    // the glass: dark, with the sky's sheen from above, curtains or blinds in some, a lamp lit in a few
    const g = x.createLinearGradient(0, Y0, 0, Y0 + h); const sky = r() < 0.5;
    g.addColorStop(0, sky ? "#8fa3b4" : "#4d5560"); g.addColorStop(0.45, sky ? "#5e6e7c" : "#33383f"); g.addColorStop(1, "#24272b");
    x.fillStyle = g; x.fillRect(X0, Y0, w, h);
    const cur = r();
    if (cur < 0.35) { x.fillStyle = rgba(["#e9e2d0", "#d8cdb6", "#c9d1d6", "#e6d6c6"][Math.floor(r() * 4)], 0.75); const cw = w * (0.3 + r() * 0.4); x.fillRect(r() < 0.5 ? X0 : X0 + w - cw, Y0, cw, h); }
    else if (cur < 0.55) { x.fillStyle = "rgba(225,220,205,0.6)"; const bh = h * (0.2 + r() * 0.7); x.fillRect(X0, Y0, w, bh); for (let l = 0; l < bh; l += 4) { x.fillStyle = "rgba(120,110,95,0.25)"; x.fillRect(X0, Y0 + l, w, 1); } }
    // frames and mullions
    x.strokeStyle = frame; x.lineWidth = Math.max(2, 0.06 * k); x.strokeRect(X0, Y0, w, h);
    x.fillStyle = frame; if (kind === "win") { const n = w > 1.6 * k ? 2 : 1; for (let m = 1; m <= n; m++) x.fillRect(X0 + (w * m) / (n + 1) - 0.03 * k, Y0, 0.06 * k, h); if (r() < 0.4) x.fillRect(X0, Y0 + h * 0.28, w, 0.05 * k); }
    // the sill (a lit edge) and the streak of dirt under it
    x.fillStyle = "rgba(240,236,228,0.8)"; x.fillRect(X0 - 0.05 * k, Y0 + h, w + 0.1 * k, 0.05 * k);
    const sg = x.createLinearGradient(0, Y0 + h, 0, Y0 + h + 0.9 * k); sg.addColorStop(0, "rgba(70,58,45,0.28)"); sg.addColorStop(1, "rgba(70,58,45,0)");
    x.fillStyle = sg; x.fillRect(X0 + w * 0.15, Y0 + h + 0.05 * k, w * 0.7, 0.9 * k);
  }
  // the ground floor: shopfronts (dark glass, no signs) between pilasters, a plinth
  if (shop && !gable) {
    x.fillStyle = hex(base, 0.72); x.fillRect(0, Y(GF), px, GF * k);
    for (let b = 0; b < bays; b++) {
      const X0 = b * BW * k;
      if (r() < 0.25) { x.fillStyle = hex(base, 0.68); x.fillRect(X0, Y(GF), BW * k, GF * k); x.fillStyle = "#3a3632"; x.fillRect(X0 + 1.1 * k, Y(2.2), 1.2 * k, 2.2 * k); continue; }
      const g = x.createLinearGradient(0, Y(GF - 0.3), 0, Y(0.45)); g.addColorStop(0, "#56616b"); g.addColorStop(0.5, "#30363c"); g.addColorStop(1, "#1d2024");
      x.fillStyle = g; x.fillRect(X0 + 0.25 * k, Y(GF - 0.35), (BW - 0.5) * k, (GF - 0.8) * k);
      x.fillStyle = "#3b3f44"; x.fillRect(X0 + 0.25 * k, Y(GF - 0.35), (BW - 0.5) * k, 0.06 * k); x.fillRect(X0 + BW / 2 * k - 0.03 * k, Y(GF - 0.35), 0.06 * k, (GF - 0.8) * k);
      // an awning band over some (plain colours)
      if (r() < 0.35) { x.fillStyle = ["#7b2f2a", "#2f4f6b", "#5b5b5b", "#8a6a2a"][Math.floor(r() * 4)]; x.fillRect(X0 + 0.15 * k, Y(GF - 0.05), (BW - 0.3) * k, 0.35 * k); }
    }
    x.fillStyle = hex(base, 0.55); x.fillRect(0, Y(0.45), px, 0.45 * k);
  }
  // the roof's parapet edge, rust and rain streaks from the top
  x.fillStyle = hex(base, 0.78); x.fillRect(0, 0, px, 0.5 * k);
  for (let s = 0; s < W * 0.8; s++) { const sx = r() * px, sl = (2 + r() * 10) * k, sg = x.createLinearGradient(0, 0.5 * k, 0, 0.5 * k + sl); sg.addColorStop(0, `rgba(80,66,50,${0.12 + r() * 0.15})`); sg.addColorStop(1, "rgba(80,66,50,0)"); x.fillStyle = sg; x.fillRect(sx, 0.5 * k, (0.08 + r() * 0.3) * k, sl); }
  // grime rising from the ground
  const gg = x.createLinearGradient(0, py, 0, py - 2.2 * k); gg.addColorStop(0, "rgba(60,50,40,0.45)"); gg.addColorStop(1, "rgba(60,50,40,0)"); x.fillStyle = gg; x.fillRect(0, 0, px, py);
  // roughness: plaster rough; glass smooth (it takes the sky's reflection from the environment)
  const rc = canvas(px >> 1, py >> 1), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,235,0)"; rx.fillRect(0, 0, rc.width, rc.height);
  rx.fillStyle = "rgb(0,30,0)"; for (const [X0, Y0, w, h] of win) rx.fillRect(X0 / 2, Y0 / 2, w / 2, h / 2);
  return { map: c, rough: rc, win, floors, bays };
}
// a balcony's parapet: painted concrete or corrugated sheet, its own colour, stained
export function parapet({ seed = 71, base = "#d8ccb4", kind = "concrete", px = 256 } = {}) {
  const r = rng(seed), c = canvas(px, px / 4 * 1), x = c.getContext("2d"), w = c.width, h = c.height;
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  if (kind === "ribbed") for (let i = 0; i < w; i += 8) { x.fillStyle = "rgba(0,0,0,0.12)"; x.fillRect(i, 0, 3, h); x.fillStyle = "rgba(255,255,255,0.12)"; x.fillRect(i + 4, 0, 2, h); }
  overlay(x, greyTile(256, { P: 4, oct: 5, seed }, { lo: 0.7, hi: 1 }), { op: "multiply", a: 0.5, seed });
  const sg = x.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, "rgba(255,255,255,0.1)"); sg.addColorStop(1, "rgba(60,50,40,0.25)"); x.fillStyle = sg; x.fillRect(0, 0, w, h);
  return c;
}
// ---------- linden leaves: a cluster of heart-shaped leaves on a twig (alpha) ----------
export function leafCluster({ px = 256, seed = 81, n = 7 } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d");
  x.clearRect(0, 0, px, px);
  x.strokeStyle = "#4a3a24"; x.lineWidth = 3; x.beginPath(); x.moveTo(px * 0.5, px * 0.98); x.quadraticCurveTo(px * 0.45, px * 0.6, px * 0.5, px * 0.35); x.stroke();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.4, d = px * (0.12 + r() * 0.26), cx = px * 0.5 + Math.cos(a) * d, cy = px * 0.55 + Math.sin(a) * d, s = px * (0.13 + r() * 0.07), rot = a + Math.PI / 2 + (r() - 0.5) * 0.6;
    x.save(); x.translate(cx, cy); x.rotate(rot);
    const tone = 0.8 + r() * 0.35, g = x.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, hex("#5a7432", tone * 1.05)); g.addColorStop(1, hex("#3a5222", tone * 0.95));
    x.fillStyle = g; x.beginPath();
    // a heart: the stalk at the bottom (y = s), the tip at the top (y = -s)
    x.moveTo(0, s * 0.75); x.bezierCurveTo(-s * 1.15, s * 0.95, -s * 1.1, -s * 0.35, 0, -s * 1.05); x.bezierCurveTo(s * 1.1, -s * 0.35, s * 1.15, s * 0.95, 0, s * 0.75); x.fill();
    x.strokeStyle = "rgba(200,220,150,0.35)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, s * 0.7); x.lineTo(0, -s * 0.95); x.stroke();
    x.restore();
  }
  return c;
}
// bark: grey-brown, furrowed (vertical)
export function bark({ px = 512, seed = 91 } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d");
  x.fillStyle = "#5a5148"; x.fillRect(0, 0, px, px);
  x.save(); x.scale(0.25, 4); overlay(x, greyTile(256, { P: 6, oct: 5, seed }, { lo: 0.35, hi: 1 }), { op: "multiply", a: 0.8, w: px * 4, h: px / 4, seed }); x.restore();
  for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(30,26,22,${0.2 + r() * 0.3})`; x.fillRect(r() * px, 0, 2 + r() * 5, px); }
  return c;
}
// ---------- a mesh banner's weave: the print seen through a fine grid of holes (a multiply tile) ----------
export function meshWeave({ px = 64, holes = 8 } = {}) {
  const c = canvas(px, px), x = c.getContext("2d"), s = px / holes;
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, px, px);
  x.fillStyle = "rgba(60,60,60,0.35)"; for (let i = 0; i < holes; i++) for (let j = 0; j < holes; j++) { x.beginPath(); x.ellipse((i + 0.5) * s, (j + 0.5) * s, s * 0.22, s * 0.22, 0, 0, 6.283); x.fill(); }
  return c;
}
export { hex, rgba, lerpHex };
