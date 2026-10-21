// Cromatic · metro mockups (TASK-062): procedural surfaces, drawn on canvases (no photographs: every texture is ours).
// Each returns { map, rough, (bump) } canvases; seeded, so a re-render is the same picture.
import * as THREE from "three";
import { rng } from "./lib.js";

// ---------- noise: periodic value noise, fbm, as grey tiles ----------
function lattice(seed, P) {
  const r = rng(seed), a = new Float32Array(P * P);
  for (let i = 0; i < a.length; i++) a[i] = r();
  return a;
}
const fade = (t) => t * t * (3 - 2 * t);
// a seamless fbm tile: size px, base period P cells, octaves; returns Float32Array 0..1
export function fbm(size, { P = 8, oct = 5, seed = 1, gain = 0.5, warp = 0 } = {}) {
  const out = new Float32Array(size * size);
  let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const per = P << o, L = lattice(seed * 31 + o * 7, per);
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * per, y0 = Math.floor(fy), ty = fade(fy - y0), y1 = (y0 + 1) % per;
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * per, x0 = Math.floor(fx), tx = fade(fx - x0), x1 = (x0 + 1) % per;
        const a = L[y0 * per + x0], b = L[y0 * per + x1], c = L[y1 * per + x0], d = L[y1 * per + x1];
        out[y * size + x] += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
      }
    }
    tot += amp; amp *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
export function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
// a grey tile canvas from an fbm array (contrast around .5)
export function greyTile(size, opts = {}, { lo = 0, hi = 1, gamma = 1 } = {}) {
  const n = fbm(size, opts), c = canvas(size, size), x = c.getContext("2d"), im = x.createImageData(size, size);
  for (let i = 0; i < n.length; i++) { let v = Math.min(1, Math.max(0, (n[i] - 0.5) * 1.8 + 0.5)); v = Math.pow(v, gamma); v = lo + (hi - lo) * v; const b = Math.round(v * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  return c;
}
// lay a tile over a canvas region with an operation and opacity (random offset: no visible repeat)
export function overlay(ctx, tile, { op = "multiply", a = 0.3, x = 0, y = 0, w = ctx.canvas.width, h = ctx.canvas.height, scale = 1, seed = 1 } = {}) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = op; ctx.globalAlpha = a;
  const pat = ctx.createPattern(tile, "repeat");
  const m = new DOMMatrix().translateSelf(r() * tile.width, r() * tile.height).scaleSelf(scale, scale);
  pat.setTransform(m);
  ctx.fillStyle = pat; ctx.fillRect(x, y, w, h);
  ctx.restore();
}
export function tex(c, { srgb = true, rep = [1, 1], aniso = 16 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = aniso;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
const hex = (h, k = 1) => { const n = parseInt(h.slice(1), 16); return `rgb(${Math.round(((n >> 16) & 255) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`; };

// ---------- polished granite floor tiles (grey, speckled), 0.6 m tiles, the canvas covers span m ----------
export function granite({ px = 2048, span = 4.8, tile = 0.6, seed = 3, base = "#7d7c79" } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d"), k = px / span;
  x.fillStyle = base; x.fillRect(0, 0, px, px);
  // per tile tint
  const n = Math.round(span / tile);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = hex(base, 0.93 + r() * 0.12); x.fillRect(i * tile * k, j * tile * k, tile * k, tile * k); }
  // the stone: cloudy, then grains (black mica, white quartz, a warm feldspar)
  overlay(x, greyTile(512, { P: 4, oct: 5, seed: seed + 1 }, { lo: 0.55, hi: 1 }), { op: "multiply", a: 0.55, seed });
  overlay(x, greyTile(512, { P: 16, oct: 3, seed: seed + 2 }, { lo: 0.7, hi: 1 }), { op: "multiply", a: 0.5, seed: seed + 3, scale: 0.5 });
  const grains = Math.round(px * px * 0.045);
  for (let g = 0; g < grains; g++) {
    const t = r(), s = (0.4 + r() * r() * 2.6) * (px / 2048);
    x.fillStyle = t < 0.45 ? `rgba(28,27,27,${0.5 + r() * 0.5})` : t < 0.8 ? `rgba(225,224,220,${0.35 + r() * 0.5})` : `rgba(160,134,120,${0.3 + r() * 0.4})`;
    x.beginPath(); x.ellipse(r() * px, r() * px, s, s * (0.5 + r() * 0.5), r() * 3.14, 0, 6.283); x.fill();
  }
  // joints
  x.fillStyle = "rgba(40,38,36,0.85)";
  for (let i = 0; i <= n; i++) { x.fillRect(i * tile * k - 1.2, 0, 2.4, px); x.fillRect(0, i * tile * k - 1.2, px, 2.4); }
  // wear: a soft walked path (lighter, duller)
  overlay(x, greyTile(256, { P: 3, oct: 4, seed: seed + 9 }, { lo: 0, hi: 1, gamma: 2.2 }), { op: "screen", a: 0.1, seed: seed + 4, scale: 3 });
  // roughness (G channel): polished .2, scuffed blotches, joints rough
  const rc = canvas(px, px), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,46,0)"; rx.fillRect(0, 0, px, px);
  const rb = greyTile(512, { P: 5, oct: 5, seed: seed + 5 }, { lo: 0, hi: 1, gamma: 2.5 });
  rx.save(); rx.globalCompositeOperation = "lighter"; rx.globalAlpha = 0.35; overlay(rx, rb, { op: "lighter", a: 0.33, seed: seed + 6, scale: 2 }); rx.restore();
  for (let s = 0; s < 260; s++) { rx.strokeStyle = `rgba(0,${120 + r() * 80},0,${0.06 + r() * 0.1})`; rx.lineWidth = 0.5 + r() * 1.5; rx.beginPath(); const sx = r() * px, sy = r() * px, a = r() * 6.28, l = 10 + r() * 90; rx.moveTo(sx, sy); rx.quadraticCurveTo(sx + Math.cos(a) * l * 0.5 + r() * 10, sy + Math.sin(a) * l * 0.5, sx + Math.cos(a) * l, sy + Math.sin(a) * l); rx.stroke(); }
  rx.fillStyle = "rgb(0,230,0)";
  for (let i = 0; i <= n; i++) { rx.fillRect(i * tile * k - 1.5, 0, 3, px); rx.fillRect(0, i * tile * k - 1.5, px, 3); }
  return { map: c, rough: rc, span };
}

// ---------- stone wall cladding (a warm limestone / travertine), panels pw x ph m with thin dark joints ----------
// One unique canvas for the whole wall (W x H m), so nothing repeats; grime gathers low and under the frames.
export function stoneWall({ W, H, y0 = 0, px = 6144, pw = 1.2, ph = 0.6, seed = 5, base = "#c2bbae", grime = [] } = {}) {
  const r = rng(seed), k = px / W, ph_px = Math.round(H * k), c = canvas(px, ph_px), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, px, ph_px);
  const cols = Math.ceil(W / pw), rows = Math.ceil(H / ph);
  const v1 = greyTile(512, { P: 3, oct: 5, seed: seed + 1 }, { lo: 0.6, hi: 1 }), v2 = greyTile(512, { P: 12, oct: 4, seed: seed + 2 }, { lo: 0.75, hi: 1 });
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const X = i * pw * k, Y = ph_px - (j + 1) * ph * k; // (rows from the bottom)
    x.save(); x.beginPath(); x.rect(X, Y, pw * k, ph * k); x.clip();
    x.fillStyle = hex(base, 0.9 + r() * 0.12); x.fillRect(X, Y, pw * k, ph * k);
    // travertine: horizontal bedding (the tile stretched sideways), pores
    x.save(); x.translate(X, Y); x.scale(3.5, 0.5); overlay(x, v1, { op: "multiply", a: 0.55, w: (pw * k) / 3.5 + 2, h: (ph * k) / 0.5 + 2, seed: seed * 100 + i * 7 + j }); x.restore();
    overlay(x, v2, { op: "multiply", a: 0.35, x: X, y: Y, w: pw * k, h: ph * k, seed: seed * 50 + i + j * 13 });
    for (let p = 0; p < 50; p++) { x.fillStyle = `rgba(120,105,85,${0.15 + r() * 0.3})`; x.beginPath(); x.ellipse(X + r() * pw * k, Y + r() * ph * k, 1 + r() * 4, 0.6 + r() * 1.2, 0, 0, 6.283); x.fill(); }
    x.restore();
  }
  // joints
  x.fillStyle = "rgba(80,72,62,0.55)";
  for (let i = 0; i <= cols; i++) x.fillRect(i * pw * k - 0.8, 0, 1.6, ph_px);
  for (let j = 0; j <= rows; j++) x.fillRect(0, ph_px - j * ph * k - 0.8, px, 1.6);
  x.fillStyle = "rgba(255,255,255,0.12)";
  for (let j = 0; j <= rows; j++) x.fillRect(0, ph_px - j * ph * k + 0.8, px, 1); // (the lower panel's lit top edge)
  // grime: low on the wall (the track's dust), streaks under fixtures
  const g = x.createLinearGradient(0, ph_px, 0, ph_px - 1.6 * k);
  g.addColorStop(0, "rgba(60,50,40,0.55)"); g.addColorStop(1, "rgba(60,50,40,0)");
  x.fillStyle = g; x.fillRect(0, 0, px, ph_px);
  const gt = greyTile(256, { P: 4, oct: 4, seed: seed + 8 }, { lo: 0, hi: 1, gamma: 1.6 });
  overlay(x, gt, { op: "multiply", a: 0.18, seed: seed + 9, scale: 4 });
  for (const gr of grime) { // [xm, ym (top), wm, hm]: a dusty streak below a frame
    const gx = (gr[0] + W / 2) * k, gy = ph_px - (gr[1] - y0) * k, gw = gr[2] * k, gh = gr[3] * k;
    const lg = x.createLinearGradient(0, gy, 0, gy + gh); lg.addColorStop(0, "rgba(70,60,50,0.22)"); lg.addColorStop(1, "rgba(70,60,50,0)");
    x.fillStyle = lg; x.fillRect(gx, gy, gw, gh);
  }
  // roughness: honed stone .55, joints rough
  const rc = canvas(px >> 1, ph_px >> 1), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,135,0)"; rx.fillRect(0, 0, rc.width, rc.height);
  overlay(rx, greyTile(256, { P: 6, oct: 4, seed: seed + 11 }, { lo: 0, hi: 1 }), { op: "lighter", a: 0.15, seed: 2, scale: 2 });
  return { map: c, rough: rc, k };
}

// ---------- small glazed tiles (a colour band), tw m square ----------
export function glazed({ px = 1024, span = 1.2, tw = 0.15, seed = 9, base = "#2f6f86", grout = "#c9c6bd" } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d"), k = px / span, n = Math.round(span / tw);
  x.fillStyle = grout; x.fillRect(0, 0, px, px);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const g = 2.2, X = i * tw * k + g, Y = j * tw * k + g, s = tw * k - 2 * g;
    const gr = x.createLinearGradient(X, Y, X + s, Y + s); const kk = 0.92 + r() * 0.14;
    gr.addColorStop(0, hex(base, kk * 1.04)); gr.addColorStop(1, hex(base, kk * 0.94));
    x.fillStyle = gr; x.fillRect(X, Y, s, s);
  }
  overlay(x, greyTile(256, { P: 4, oct: 4, seed }, { lo: 0.75, hi: 1 }), { op: "multiply", a: 0.5, seed });
  const rc = canvas(px >> 1, px >> 1), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,230,0)"; rx.fillRect(0, 0, rc.width, rc.height);
  rx.fillStyle = "rgb(0,30,0)";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) rx.fillRect((i * tw * k + 2.2) / 2, (j * tw * k + 2.2) / 2, (tw * k - 4.4) / 2, (tw * k - 4.4) / 2);
  return { map: c, rough: rc };
}

// ---------- concrete (the track bed, the platform's face), dirty ----------
export function concrete({ px = 1024, seed = 13, base = "#5d5a55", dirt = 0.5, stains = 30 } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, px, px);
  overlay(x, greyTile(512, { P: 4, oct: 6, seed }, { lo: 0.45, hi: 1 }), { op: "multiply", a: 0.7, seed });
  overlay(x, greyTile(512, { P: 32, oct: 2, seed: seed + 1 }, { lo: 0.7, hi: 1 }), { op: "multiply", a: 0.5, seed: seed + 2, scale: 0.5 });
  for (let s = 0; s < stains; s++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(20,18,16,${0.25 * dirt})`); g.addColorStop(1, "rgba(20,18,16,0)"); x.save(); x.translate(r() * px, r() * px); x.scale(20 + r() * 120, 10 + r() * 60); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 6.283); x.fill(); x.restore(); }
  const rc = canvas(px >> 1, px >> 1), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,225,0)"; rx.fillRect(0, 0, rc.width, rc.height);
  return { map: c, rough: rc };
}

// ---------- brushed / painted metal, a sheet with soft streaks ----------
export function brushed({ px = 512, seed = 21, base = "#9a9da0", streak = 0.25 } = {}) {
  const r = rng(seed), c = canvas(px, px), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, px, px);
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "0,0,0"},${r() * 0.06 * streak * 4})`; x.fillRect(r() * px, r() * px, 30 + r() * 300, 0.6 + r()); }
  const rc = canvas(px >> 1, px >> 1), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,90,0)"; rx.fillRect(0, 0, rc.width, rc.height);
  overlay(rx, greyTile(128, { P: 4, oct: 3, seed }, {}), { op: "lighter", a: 0.12, seed });
  return { map: c, rough: rc };
}

// ---------- v2 (TASK-062, Daniel: brighter, warmer, a modern station) ----------
// enamel wall panels: warm white, large format, thin grey joints, a little tone per panel; one canvas for the wall
export function enamel({ W, H, px = 4608, pw = 1.2, ph = 0.6, seed = 7, base = "#ecebe7" } = {}) {
  const r = rng(seed), k = px / W, hp = Math.round(H * k), c = canvas(px, hp), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, px, hp);
  const cols = Math.ceil(W / pw), rows = Math.ceil(H / ph);
  const cl = greyTile(256, { P: 3, oct: 4, seed: seed + 1 }, { lo: 0.9, hi: 1 });
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const X = i * pw * k, Y = hp - (j + 1) * ph * k;
    x.save(); x.beginPath(); x.rect(X, Y, pw * k, ph * k); x.clip();
    x.fillStyle = hex(base, 0.955 + r() * 0.05); x.fillRect(X, Y, pw * k, ph * k);
    overlay(x, cl, { op: "multiply", a: 0.4, x: X, y: Y, w: pw * k, h: ph * k, seed: seed * 31 + i * 3 + j, scale: 2 });
    x.restore();
  }
  x.fillStyle = "rgba(96,92,86,0.85)";
  for (let i = 0; i <= cols; i++) x.fillRect(i * pw * k - 1, 0, 2, hp);
  for (let j = 0; j <= rows; j++) x.fillRect(0, hp - j * ph * k - 1, px, 2);
  // a faint grime at the foot, nothing more: the station is kept clean
  const g = x.createLinearGradient(0, hp, 0, hp - 0.8 * k); g.addColorStop(0, "rgba(90,80,66,0.18)"); g.addColorStop(1, "rgba(90,80,66,0)");
  x.fillStyle = g; x.fillRect(0, 0, px, hp);
  const rc = canvas(px >> 2, hp >> 2), rx = rc.getContext("2d");
  rx.fillStyle = "rgb(0,48,0)"; rx.fillRect(0, 0, rc.width, rc.height);
  rx.fillStyle = "rgb(0,200,0)";
  for (let i = 0; i <= cols; i++) rx.fillRect((i * pw * k) / 4 - 0.6, 0, 1.2, rc.height);
  for (let j = 0; j <= rows; j++) rx.fillRect(0, (hp - j * ph * k) / 4 - 0.6, rc.width, 1.2);
  return { map: c, rough: rc, k };
}
// glass accent panels (the station's colour), with joints every pw m
export function accent({ px = 2048, span = 4.8, pw = 1.2, seed = 4, base = "#e8762a" } = {}) {
  const r = rng(seed), c = canvas(px, 128), x = c.getContext("2d"), k = px / span;
  for (let i = 0; i < span / pw; i++) { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, hex(base, 1.06)); g.addColorStop(1, hex(base, 0.9 + r() * 0.05)); x.fillStyle = g; x.fillRect(i * pw * k, 0, pw * k, 128); }
  x.fillStyle = "rgba(60,30,10,0.6)"; for (let i = 0; i <= span / pw; i++) x.fillRect(i * pw * k - 1.5, 0, 3, 128);
  return { map: c };
}
// a normal map (tangent space, +y up) from a height canvas; s: strength
export function normalFrom(hc, s = 2) {
  const w = hc.width, h = hc.height, src = hc.getContext("2d").getImageData(0, 0, w, h).data, c = canvas(w, h), x = c.getContext("2d"), im = x.createImageData(w, h), d = im.data;
  const H = (i, j) => src[(Math.min(h - 1, Math.max(0, j)) * w + Math.min(w - 1, Math.max(0, i))) * 4] / 255;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const nx = (H(i - 1, j) - H(i + 1, j)) * s, ny = (H(i, j + 1) - H(i, j - 1)) * s, l = Math.hypot(nx, ny, 1), o = (j * w + i) * 4;
    d[o] = (nx / l * 0.5 + 0.5) * 255; d[o + 1] = (ny / l * 0.5 + 0.5) * 255; d[o + 2] = (1 / l * 0.5 + 0.5) * 255; d[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); return c;
}
