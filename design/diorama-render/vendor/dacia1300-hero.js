// Cromatic · hero car (TASK-112): a detailed Dacia 1300 (1969-1979, the Renault 12 body) for the stories, built
// procedurally, in metres. Origin on the ground under the middle of the wheelbase, +z forward, +y up, +x the car's
// left (the driver's side). Built for offline renders (path traced or rasterised), not for the map: ~250k triangles.
//   buildHeroDacia(THREE, { RoundedBoxGeometry }) -> { group, mats }
// Proportions off the factory numbers: length 4.348, width 1.636, height 1.435, wheelbase 2.441, track 1.31, tyres
// 155 SR 13; and off the reference photos (~/Downloads/dacia*.jpg): the wide rounded-rectangle headlamps in a chrome
// band with the black grille and the chrome V, the slim chrome bumpers with black overriders, the crease along the
// flank, the chrome window frames and drip rails, the three slots in the C-pillar, the steel wheels with hub caps.

export const DIM = { L: 4.348, W: 1.636, H: 1.435, WB: 2.441, zF: 1.161, zR: -1.28, zN: 1.951, zT: -2.397, track: 1.31, tyreR: 0.292, rimR: 0.165, wheelY: 0.29 };

// ---- a monotone cubic through (x, y) pairs (Fritsch-Carlson): smooth, never overshoots
function pchip(pts) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
    const h0 = xs[i] - xs[i - 1], h1 = xs[i + 1] - xs[i], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function buildHeroDacia(T, ext = {}) {
  const { zF, zR, zN, zT } = DIM;
  const group = new T.Group(); group.name = "hero-dacia1300";
  const V3 = (x, y, z) => new T.Vector3(x, y, z);

  // ================= materials =================
  const tex = makeTextures(T);
  const mats = {
    paint: new T.MeshPhysicalMaterial({ name: "paint", color: new T.Color("#F6B400"), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.035, side: T.FrontSide }),
    chrome: new T.MeshPhysicalMaterial({ name: "chrome", color: new T.Color("#f4f5f7"), roughness: 0.055, metalness: 1 }),
    satin: new T.MeshPhysicalMaterial({ name: "satin chrome", color: new T.Color("#d9dce0"), roughness: 0.22, metalness: 1 }),
    // the headlamp bowls: their own chrome (not the trim's), brighter and a touch softer, so behind the fluted glass
    // they read as lit metal, as on every photo, and never as two black holes (E8b, Vera's look; a loader can now set
    // the bowls without touching the bumpers and frames, which share "chrome")
    reflector: new T.MeshPhysicalMaterial({ name: "reflector", color: new T.Color("#e9e9ea"), roughness: 0.16, metalness: 1 }),
    black: new T.MeshPhysicalMaterial({ name: "black trim", color: new T.Color("#0d0d0e"), roughness: 0.45, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
    rubber: new T.MeshPhysicalMaterial({ name: "rubber", color: new T.Color("#121212"), roughness: 0.82, metalness: 0 }),
    tyre: new T.MeshPhysicalMaterial({ name: "tyre", color: new T.Color("#151515"), roughness: 0.88, metalness: 0 }),
    tread: new T.MeshPhysicalMaterial({ name: "tread", color: new T.Color("#141414"), roughness: 0.92, metalness: 0, normalMap: tex.tread, normalScale: new T.Vector2(1.4, 1.4) }),
    steel: new T.MeshPhysicalMaterial({ name: "steel wheel", color: new T.Color("#c3c6ca"), roughness: 0.32, metalness: 0.75, clearcoat: 0.6, clearcoatRoughness: 0.12 }),
    glass: new T.MeshPhysicalMaterial({ name: "glass", color: new T.Color("#eef6f2"), roughness: 0, metalness: 0, transmission: 1, ior: 1.52, thickness: 0.004, transparent: true, side: T.DoubleSide, envMapIntensity: 1 }),
    lens: new T.MeshPhysicalMaterial({ name: "headlamp lens", color: new T.Color("#fbfaf2"), roughness: 0.02, metalness: 0, transmission: 1, ior: 1.5, thickness: 0.006, normalMap: tex.flutes, normalScale: new T.Vector2(0.55, 0.55), transparent: true, side: T.DoubleSide }),
    red: new T.MeshPhysicalMaterial({ name: "tail red", color: new T.Color("#a8120c"), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, normalMap: tex.prisms, normalScale: new T.Vector2(0.35, 0.35) }),
    amber: new T.MeshPhysicalMaterial({ name: "amber", color: new T.Color("#e3780f"), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, normalMap: tex.prisms, normalScale: new T.Vector2(0.35, 0.35) }),
    clear: new T.MeshPhysicalMaterial({ name: "reverse lens", color: new T.Color("#e9e6dc"), roughness: 0.1, metalness: 0, clearcoat: 1, normalMap: tex.prisms, normalScale: new T.Vector2(0.35, 0.35) }),
    gap: new T.MeshPhysicalMaterial({ name: "panel gap", color: new T.Color("#0b0907"), roughness: 0.75, metalness: 0 }),
    vinyl: new T.MeshPhysicalMaterial({ name: "tan vinyl", color: new T.Color("#9a6842"), roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.35 }),
    liner: new T.MeshPhysicalMaterial({ name: "headliner", color: new T.Color("#cfc6b3"), roughness: 0.9, metalness: 0, side: T.FrontSide }),
    dash: new T.MeshPhysicalMaterial({ name: "dashboard", color: new T.Color("#1c1a19"), roughness: 0.6, metalness: 0 }),
    carpet: new T.MeshPhysicalMaterial({ name: "carpet", color: new T.Color("#1d1715"), roughness: 0.95, metalness: 0 }),
    under: new T.MeshPhysicalMaterial({ name: "underbody", color: new T.Color("#141110"), roughness: 0.9, metalness: 0, side: T.DoubleSide }),
    plate: new T.MeshPhysicalMaterial({ name: "number plate", map: tex.plate, roughness: 0.35, metalness: 0, clearcoat: 0.5 }),
    plate1300: new T.MeshPhysicalMaterial({ name: "1300 plate", map: tex.plate1300, roughness: 0.35, metalness: 0, clearcoat: 0.5 }),
    mirror: new T.MeshPhysicalMaterial({ name: "mirror glass", color: new T.Color("#ffffff"), roughness: 0.0, metalness: 1 }),
    bulb: new T.MeshPhysicalMaterial({ name: "bulb", color: new T.Color("#fffbe8"), roughness: 0.05, metalness: 0, transmission: 0.9, transparent: true }),
    badge: new T.MeshPhysicalMaterial({ name: "badge enamel", color: new T.Color("#1a2a6c"), roughness: 0.15, metalness: 0, clearcoat: 1 })
  };
  // (two-sided where an open shell could show its inside: the body is a skin, the wheels are lathes)
  for (const k of ["paint", "chrome", "satin", "reflector", "black", "rubber", "tyre", "tread", "steel"]) mats[k].side = T.DoubleSide;
  const add = (geo, mat, name) => { const m = new T.Mesh(geo, mat); m.name = name || mat.name; m.castShadow = true; m.receiveShadow = true; group.add(m); return m; };

  // ================= the lower body: a loft of cross-sections along z =================
  const AR = 0.358, AY = 0.30; // wheel arch radius and centre height
  const hw0 = (z) => 0.809 - 0.014 * ((z + 0.2) / 2.2) ** 2;
  const rFc = 0.1, rRc = 0.115;
  function hw(z) { // half width at the crease, rounded in plan at both ends
    let w = hw0(z);
    if (z > zN - rFc) { const d = z - (zN - rFc); w = w - rFc + Math.sqrt(Math.max(0, rFc * rFc - d * d)); }
    if (z < zT + rRc) { const d = zT + rRc - z; w = w - rRc + Math.sqrt(Math.max(0, rRc * rRc - d * d)); }
    return w;
  }
  const RE = 0.034; // the radius of the face's top and bottom edges
  const endE = (z) => { const dn = zN - z, dt = z - zT, d = Math.min(dn, dt); if (d >= RE) return 0; const q = RE - d; return RE - Math.sqrt(Math.max(0, RE * RE - q * q)); };
  // the centre line of the top (bonnet, the belt under the glass, the boot deck)
  const HcT = pchip([[zT, 0.872], [-2.34, 0.893], [-2.15, 0.903], [-1.9, 0.906], [-1.64, 0.903], [-1.0, 0.893], [0.0, 0.882], [0.6, 0.874], [0.665, 0.873], [1.0, 0.853], [1.5, 0.81], [1.85, 0.766], [zN, 0.746]]);
  const crown = (z) => 0.03 * sstep(0.63, 0.7, z) + 0.022 * (1 - sstep(-1.84, -1.78, z));
  const rS = (z) => 0.03 + 0.012 * (sstep(0.6, 0.7, z) + 1 - sstep(-1.84, -1.76, z));
  const ybase = pchip([[zT, 0.335], [-2.25, 0.27], [-2.0, 0.222], [-1.8, 0.215], [1.55, 0.215], [1.75, 0.245], [zN, 0.30]]);
  function ybot(z) {
    let y = ybase(z);
    for (const za of [zF, zR]) { const dz = z - za; if (Math.abs(dz) < AR) y = Math.max(y, AY + Math.sqrt(AR * AR - dz * dz)); }
    return y + endE(z);
  }
  const sideTop = (z) => HcT(z) - endE(z) - rS(z) - crown(z);
  const yc = (z) => Math.min(0.69 - 0.007 * z, sideTop(z) - 0.06);
  function sideX(z, y) {
    const w = hw(z) - endE(z) * 0.6, c = yc(z), st = sideTop(z);
    if (y <= c) { const t = (c - y) / Math.max(0.05, c - 0.2); return w - 0.052 * t * t - 0.006 * t; }
    const t = (y - c) / Math.max(0.02, st - c); return w - 0.004 - 0.026 * Math.pow(t, 1.25);
  }
  // half section from the bottom flange to the centre line: [x, y] pairs; counts fixed so the rows line up
  const N1 = 16, N2 = 12, NA = 9, NT = 16;
  const J_SIDE0 = 1, J_CREASE = 1 + N1, J_ARC0 = 1 + N1 + N2, J_TOP0 = J_ARC0 + NA, HALF = J_TOP0 + NT;
  function lowerHalf(z) {
    const out = [], yb = ybot(z), c = Math.max(yb + 0.01, yc(z)), st = sideTop(z), r = rS(z);
    const x0 = sideX(z, yb);
    out.push([x0 - 0.028, yb + 0.004]); // the flange turned in under the edge
    for (let i = 0; i < N1; i++) { const t = i / N1, y = lerp(yb, c, 1 - Math.cos((t * Math.PI) / 2) * 0 - 0) ; const yy = lerp(yb, c, t < 0.5 ? t : t); out.push([sideX(z, yy), yy]); }
    for (let i = 0; i < N2; i++) { const t = i / N2, y = lerp(c, st, t); out.push([sideX(z, y), y]); }
    const xs = sideX(z, st), cx = xs - r;
    for (let i = 0; i < NA; i++) { const a = (i / (NA - 1)) * (Math.PI / 2); out.push([cx + r * Math.cos(a), st + r * Math.sin(a)]); }
    const cr = crown(z), topY = st + r;
    for (let i = 1; i <= NT; i++) { const t = i / NT, u = 1 - Math.cos((t * Math.PI) / 2); const x = cx * (1 - u); out.push([x, topY + cr * (1 - (x / Math.max(0.01, cx)) ** 2)]); }
    return out; // last point: x = 0
  }
  // the cabin zone (the windscreen's foot to the rear window's foot): the lower body has no lid there
  const ZC0 = 0.6, ZC1 = -1.635; // r2 (TASK-112 notes): the cabin ends earlier, the boot is long and flat
  // z rows: fine at the ends and round the arches' edges
  function rowsZ() {
    const zs = new Set();
    for (let z = zT; z <= zN + 1e-9; z += 0.018) zs.add(+z.toFixed(5));
    for (let d = 0; d <= 0.14; d += 0.006) { zs.add(+(zN - d).toFixed(5)); zs.add(+(zT + d).toFixed(5)); }
    for (const za of [zF, zR]) for (const s of [-1, 1]) for (let d = -0.03; d <= 0.03; d += 0.004) zs.add(+(za + s * AR + d).toFixed(5));
    for (const zc of [ZC0, ZC1, 0.63, 0.665, -1.665]) zs.add(zc);
    zs.add(zN); zs.add(zT);
    return [...zs].filter((z) => z >= zT && z <= zN).sort((a, b) => a - b);
  }
  const ZS = rowsZ();
  // a grid surface: rows (z) x columns (full section, x from - to +); keep(i, j) says which quads exist
  function gridSurface(rows, cols, P, keep, flip = false) {
    const pos = new Float32Array(rows * cols * 3);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const p = P(i, j), o = (i * cols + j) * 3; pos[o] = p[0]; pos[o + 1] = p[1]; pos[o + 2] = p[2]; }
    const idx = [];
    for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) {
      if (keep && !keep(i, j)) continue;
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      if (!flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  const full = (half) => { const L = half.slice(0, -1).map(([x, y]) => [-x, y]); return [...L, ...half.slice().reverse().map(([x, y]) => [x, y])].map((p, k, arr) => p); };
  // full section, left bottom (x<0) to right bottom, through the centre once
  const fullSec = (half) => { const left = half.map(([x, y]) => [-x, y]); const right = half.slice(0, -1).reverse(); return [...left, ...right]; };
  const LOW = ZS.map((z) => fullSec(lowerHalf(z)));
  const COLS = LOW[0].length; // 2 * HALF - 1 ... (HALF + 1 points per half incl. flange -> see lowerHalf)
  const halfIdx = (j) => Math.min(j, COLS - 1 - j); // 0 at the flange, HALF at the centre
  // the face's openings (E8b): the headlamps sit IN the front panel and the grille's black back, both at the face (FZ),
  // while the reflector bowls go in behind it; uncut, the panel and the black back covered the bowls and the clear
  // lenses showed two black holes. holesAt(): the lamp outlines as holes for a ShapeGeometry at the face; inLamp(): a point
  // (x, y) inside a lamp's outline, for the body's rounded front corners, which wrap in front of the lamps' outer ends
  const rrShape = (w, h, r) => { const s = new T.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const BAND = { w: 1.44, h: 0.19, y: 0.628 };
  const HL = { w: 0.236, h: 0.152, r: 0.06, x: 0.566 };
  // (xMax(y): the face panel's outline is narrower than the lamps' outer ends, which wrap into the skin, and rounder at
  // its top corners: each hole point stays inside it)
  const holesAt = (xMax = () => 1) => [-1, 1].map((s) => new T.Path(rrShape(HL.w * 0.98, HL.h * 0.98, HL.r * 0.98).getPoints(24).map((v) => { const x = v.x + s * HL.x, y = v.y + BAND.y; return new T.Vector2(Math.sign(x) * Math.min(xMax(y), Math.abs(x)), y); })));
  // the half-width of a closed outline (x, y pairs) along the line y: the outermost crossing
  const halfWidthAt = (poly, y) => { let w = 0; for (let k = 0; k < poly.length; k++) { const [x0, y0] = poly[k], [x1, y1] = poly[(k + 1) % poly.length]; if ((y0 - y) * (y1 - y) <= 0 && y0 !== y1) w = Math.max(w, Math.abs(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0))); } return w; };
  const inLamp = (x, y, pad = 0) => { const qx = Math.abs(Math.abs(x) - HL.x) - (HL.w / 2 - HL.r), qy = Math.abs(y - BAND.y) - (HL.h / 2 - HL.r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - HL.r < pad; };
  const inCabin = (z) => z < ZC0 - 0.004 && z > ZC1 + 0.004;
  const lowerGeo = gridSurface(ZS.length, COLS, (i, j) => [LOW[i][j][0], LOW[i][j][1], ZS[i]], (i, j) => {
    const zm = (ZS[i] + ZS[i + 1]) / 2, h = Math.min(halfIdx(j), halfIdx(j + 1));
    if (inCabin(zm) && h >= J_TOP0 + 2) return false; // the lid under the glasshouse: open (the cabin's in there)
    if (ZS[i] > zN - 0.06) { const q = [LOW[i][j], LOW[i][j + 1], LOW[i + 1][j], LOW[i + 1][j + 1]]; if (inLamp((q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, 0.012)) return false; } // E8b: open in front of the lamps (pad: under the chrome rim)
    return true;
  });
  add(lowerGeo, mats.paint, "body");
  // the door cards: the inside of the flanks in the cabin zone (a dark red vinyl shell 12 mm in)
  {
    const iz = ZS.map((z, i) => i).filter((i) => ZS[i] <= ZC0 && ZS[i] >= ZC1);
    const rows = iz.length, cols = COLS;
    const g = gridSurface(rows, cols, (i, j) => { const k = iz[i], [x, y] = LOW[k][j], s = Math.sign(x) || 1; const h = halfIdx(j); const inset = h < J_TOP0 ? 0.014 : 0.014; return [x - s * inset, Math.min(y, sideTop(ZS[k]) + rS(ZS[k]) - 0.01), ZS[k]]; }, (i, j) => { const h = Math.max(halfIdx(j), halfIdx(j + 1)); return h < J_TOP0 + 1 && Math.min(halfIdx(j), halfIdx(j + 1)) >= 2; }, true);
    add(g, mats.vinyl, "door cards");
  }
  // the end faces (the front panel behind the grille, the tail panel)
  for (const [z, sgn] of [[zN, 1], [zT, -1]]) {
    const sec = fullSec(lowerHalf(z));
    const shape = new T.Shape(sec.map(([x, y]) => new T.Vector2(x, y)));
    if (sgn > 0) shape.holes.push(...holesAt((y) => halfWidthAt(sec, y) - 0.002));
    const g = new T.ShapeGeometry(shape, 1);
    if (sgn < 0) { g.scale(-1, 1, 1); } // facing -z
    g.translate(0, 0, z);
    if (sgn < 0) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, -p.getX(i)); g.computeVertexNormals(); const idx = g.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 1]; idx[i + 1] = t; } g.computeVertexNormals(); }
    add(g, mats.paint, sgn > 0 ? "front panel" : "tail panel");
  }

  // ---- surface queries on the lower body (for gaps, trims, handles)
  function lowerSide(z, y) { // the point on the flank at height y (x > 0), with its normal
    const x = sideX(z, y), e = 0.002;
    const dz = (sideX(z + e, y) - sideX(z - e, y)) / (2 * e), dy = (sideX(z, y + e) - sideX(z, y - e)) / (2 * e);
    const n = V3(1, -dy, -dz).normalize();
    return { p: V3(x, y, z), n };
  }
  function lowerTop(z, x) { // the point on the bonnet / deck at |x| (y up), with its normal
    const h = lowerHalf(z); let k = J_ARC0; // search the arc and the top
    const ax = Math.abs(x);
    for (k = J_ARC0; k < h.length - 1; k++) if (h[k][0] >= ax && h[k + 1][0] <= ax) break;
    const a = h[Math.min(k, h.length - 2)], b = h[Math.min(k + 1, h.length - 1)], t = clamp((a[0] - ax) / Math.max(1e-6, a[0] - b[0]), 0, 1);
    const y = lerp(a[1], b[1], t);
    const nx = -(b[1] - a[1]), ny = -(a[0] - b[0]); // section normal (outward/up)
    const e = 0.003, y2 = (() => { const h2 = lowerHalf(z + e); let kk; for (kk = J_ARC0; kk < h2.length - 1; kk++) if (h2[kk][0] >= ax && h2[kk + 1][0] <= ax) break; const a2 = h2[Math.min(kk, h2.length - 2)], b2 = h2[Math.min(kk + 1, h2.length - 1)], t2 = clamp((a2[0] - ax) / Math.max(1e-6, a2[0] - b2[0]), 0, 1); return lerp(a2[1], b2[1], t2); })();
    const dydz = (y2 - y) / e;
    const n = V3(Math.sign(x || 1) * Math.abs(nx), Math.abs(ny), 0); n.z = -dydz * n.y; n.normalize();
    return { p: V3(Math.sign(x || 1) * ax, y, z), n };
  }
  // a ribbon laid on the skin along points (with normals): width w, lifted by lift
  function ribbon(pts, w, lift, mat, name) {
    const pos = [], idx = [];
    for (let i = 0; i < pts.length; i++) {
      const { p, n } = pts[i], a = pts[Math.max(0, i - 1)].p, b = pts[Math.min(pts.length - 1, i + 1)].p;
      const t = b.clone().sub(a).normalize(), s = new T.Vector3().crossVectors(n, t).normalize().multiplyScalar(w / 2), q = p.clone().addScaledVector(n, lift);
      pos.push(...q.clone().add(s).toArray(), ...q.clone().sub(s).toArray());
      if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // (one-sided: make sure it faces out)
    const nn = g.attributes.normal; let dot = 0; for (let i = 0; i < pts.length; i++) dot += nn.getX(i * 2) * pts[i].n.x + nn.getY(i * 2) * pts[i].n.y + nn.getZ(i * 2) * pts[i].n.z;
    if (dot < 0) { const ia = g.index.array; for (let i = 0; i < ia.length; i += 3) { const t0 = ia[i]; ia[i] = ia[i + 1]; ia[i + 1] = t0; } g.computeVertexNormals(); }
    return add(g, mat, name);
  }
  const mirrorPts = (pts) => pts.map(({ p, n }) => ({ p: V3(-p.x, p.y, p.z), n: V3(-n.x, n.y, n.z) }));
  const bothSides = (pts, w, lift, mat, name) => { ribbon(pts, w, lift, mat, name); ribbon(mirrorPts(pts), w, lift, mat, name); };
  const GAP = 0.0042, LIFT = 0.0012;
  // the doors: front edge behind the front wing, the shut line at the B-pillar, the rear door's edge over the arch
  const vline = (z, y0, y1, n = 40) => { const out = []; for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n); out.push(lowerSide(z, y)); } return out; };
  const doorTop = (z) => sideTop(z) + rS(z) * 0.55;
  const ZD0 = 0.585, ZD1 = -0.392, ZD2 = -1.03;
  for (const z of [ZD0, ZD1]) bothSides(vline(z, 0.232, sideTop(z) - 0.004), GAP, LIFT, mats.gap, "door gap");
  { const dz = ZD2 - zR, yArch = AY + Math.sqrt(Math.max(0, AR * AR - dz * dz)) + 0.004; bothSides(vline(ZD2, yArch, sideTop(ZD2) - 0.004), GAP, LIFT, mats.gap, "door gap"); }
  { const out = []; for (let i = 0; i <= 80; i++) { const z = lerp(zR + AR + 0.006, ZD0, i / 80); if (Math.abs(z - zR) < AR + 0.004 || Math.abs(z - zF) < AR + 0.004) continue; out.push(lowerSide(z, 0.236)); } bothSides(out, GAP, LIFT, mats.gap, "door sill gap"); }
  // the bonnet: its sides along the wings, its back edge at the scuttle
  const ZB0 = 0.668, XB = 0.715;
  { const out = []; for (let i = 0; i <= 90; i++) { const z = lerp(ZB0, zN - 0.012, i / 90); out.push(lowerTop(z, Math.min(XB, hw(z) - 0.075))); } bothSides(out, GAP, LIFT, mats.gap, "bonnet gap"); }
  { const out = []; for (let i = 0; i <= 60; i++) { const x = lerp(-XB, XB, i / 60); out.push(lowerTop(ZB0, x)); } ribbon(out, GAP, LIFT, mats.gap, "bonnet gap"); }
  // the boot lid: its front edge behind the rear window, its sides
  const ZK0 = -1.668, XK = 0.70;
  { const out = []; for (let i = 0; i <= 60; i++) { const x = lerp(-XK, XK, i / 60); out.push(lowerTop(ZK0, x)); } ribbon(out, GAP, LIFT, mats.gap, "boot gap"); }
  { const out = []; for (let i = 0; i <= 50; i++) { const z = lerp(ZK0, zT + 0.012, i / 50); out.push(lowerTop(z, Math.min(XK, hw(z) - 0.08))); } bothSides(out, GAP, LIFT, mats.gap, "boot gap"); }
  // the scuttle vent under the windscreen
  { const out = []; for (let i = 0; i <= 50; i++) { const x = lerp(-0.62, 0.62, i / 50); out.push(lowerTop(0.636, x)); } ribbon(out, 0.034, 0.002, mats.black, "scuttle"); }

  // ---- trims on the flank: the slim chrome strip low on the doors
  const sweep = (path, prof, mat, name, { closed = false, caps = true } = {}) => {
    // path: [{ p, n (the profile's 'up' or 'out' direction) }]; prof: [[u, v], ...] in the plane (n, binormal)
    const pos = [], idx = [], np = prof.length;
    for (let i = 0; i < path.length; i++) {
      const { p, n } = path[i], a = path[Math.max(0, i - 1)].p, b = path[Math.min(path.length - 1, i + 1)].p;
      const t = b.clone().sub(a).normalize(), bn = new T.Vector3().crossVectors(t, n).normalize(), nn = new T.Vector3().crossVectors(bn, t).normalize();
      for (const [u, v] of prof) pos.push(...p.clone().addScaledVector(nn, u).addScaledVector(bn, v).toArray());
    }
    for (let i = 0; i < path.length - 1; i++) for (let k = 0; k < np - (closed ? 0 : 1); k++) {
      const k2 = (k + 1) % np, a = i * np + k, b = i * np + k2, c = (i + 1) * np + k, d = (i + 1) * np + k2;
      idx.push(a, c, b, b, c, d);
    }
    if (caps && closed) for (const i of [0, path.length - 1]) { const c0 = i * np; for (let k = 1; k < np - 1; k++) idx.push(...(i ? [c0, c0 + k, c0 + k + 1] : [c0, c0 + k + 1, c0 + k])); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // (faces out: the normals should point away from the path)
    { const P = g.attributes.position, N = g.attributes.normal; let dot = 0; for (let i = 0; i < path.length; i++) for (let k = 0; k < np; k++) { const v = i * np + k, p0 = path[i].p; dot += (P.getX(v) - p0.x) * N.getX(v) + (P.getY(v) - p0.y) * N.getY(v) + (P.getZ(v) - p0.z) * N.getZ(v); }
      if (dot < 0) { const ia = g.index.array; for (let i = 0; i < ia.length; i += 3) { const t0 = ia[i]; ia[i] = ia[i + 1]; ia[i + 1] = t0; } g.computeVertexNormals(); } }
    return add(g, mat, name);
  };
  const roundProf = (r, n = 12, sq = 1) => Array.from({ length: n }, (_, k) => { const a = (k / n) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r * sq]; });
  const halfRound = (h, d, n = 10) => { const out = []; for (let k = 0; k <= n; k++) { const a = -Math.PI / 2 + (k / n) * Math.PI; out.push([Math.cos(a) * d, Math.sin(a) * h]); } out.push([-0.001, h * 0.95], [-0.001, -h * 0.95]); return out; };
  {
    const out = []; for (let i = 0; i <= 70; i++) { const z = lerp(zR + AR + 0.025, zF - AR - 0.025, i / 70); const s = lowerSide(z, 0.292); /* r3: low, along the doors' bottom edge */ out.push({ p: s.p.clone().addScaledVector(s.n, 0.0005), n: s.n }); }
    sweep(out, halfRound(0.0065, 0.0055), mats.chrome, "side strip", { closed: true });
    sweep(out.map(({ p, n }) => ({ p: V3(-p.x, p.y, p.z), n: V3(-n.x, n.y, n.z) })), halfRound(0.0065, 0.0055), mats.chrome, "side strip", { closed: true });
  }
  // the wheel arches' lips (a dark rubbery seam) and the wells
  for (const za of [zF, zR]) for (const s of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 60; i++) { const a = Math.PI * (i / 60); const z = za + Math.cos(a) * (AR - 0.002), y = AY + Math.sin(a) * (AR - 0.002); if (y < ybase(z) - 0.002) continue; const q = lowerSide(z, y); pts.push({ p: V3(s * (q.p.x - 0.012), y, z), n: V3(0, Math.sin(a), Math.cos(a)) }); }
    // the well: half a drum, from the flank in to x = 0.47
    const well = new T.CylinderGeometry(AR - 0.012, AR - 0.012, 0.36, 40, 1, true, 0, Math.PI);
    well.rotateZ(Math.PI / 2); // axis along x, the half drum over the top
    const wm = new T.Mesh(well, mats.under); wm.position.set(s * 0.63, AY, za); wm.rotation.set(0, 0, 0); wm.name = "wheel well"; group.add(wm);
    const disc = new T.CircleGeometry(AR - 0.012, 40, 0, Math.PI); disc.rotateY(s > 0 ? -Math.PI / 2 : Math.PI / 2); disc.rotateX(0); const dm = new T.Mesh(disc, mats.under); dm.position.set(s * 0.455, AY, za); dm.rotation.set(0, 0, 0); dm.name = "wheel well"; group.add(dm);
  }
  // the floor pan: closes the skin from below, flange to flange (up in the arches)
  { const pan = gridSurface(ZS.length, 9, (i, j) => { const z = ZS[i], x0 = sideX(z, ybot(z)) - 0.028, x = lerp(-x0, x0, j / 8), yy = Math.max(ybase(z) + endE(z), 0.2) + 0.004; return [x, Math.abs(x) > 0.5 ? ybot(z) + 0.004 : yy, z]; }, null, true); add(pan, mats.under, "floor pan"); }
  // underbody, floor
  { const g = new T.BoxGeometry(1.0, 0.03, 2.9); g.translate(0, 0.205, -0.1); add(g, mats.under, "underbody"); }
  { const g = new T.PlaneGeometry(1.5, ZC0 - ZC1 + 0.05); g.rotateX(-Math.PI / 2); g.translate(0, 0.275, (ZC0 + ZC1) / 2); add(g, mats.carpet, "floor"); }

  // ================= the glasshouse: a second loft, from the windscreen's foot to the rear window's foot =================
  const beltY = (z) => sideTop(z) + rS(z) - 0.004;
  const HrT = pchip([[ZC1, 0.912], [-1.52, 1.02], [-1.36, 1.19], [-1.18, 1.36], [-1.08, 1.41], [-0.96, 1.428], [-0.5, 1.435], [-0.05, 1.426], [0.03, 1.405], [0.12, 1.33], [0.36, 1.13], [ZC0, 0.892]]);
  const RR = 0.034, xRoof = ext.xRoof ?? 0.665; // r3: the side glass nearly upright, the roof wide (the 1:24 model). E8 (Vera): ext.xRoof narrows the roof (tumblehome, as the real car: the roof ~1.27 m over a 1.64 m body)
  const crownR = (z) => 0.024 + 0.012 * (sstep(0.06, 0.3, z) + 1 - sstep(-1.4, -1.15, z));
  const xBelt = (z) => hw(z) - 0.05;
  function cabHalf(z) {
    const out = [], yb = beltY(z) - 0.006, Hc = HrT(z), cr = crownR(z), yk = Math.max(yb + 0.002, Hc - RR - cr);
    const xb = xBelt(z), roofEdgeY = 1.435 - RR - 0.024, f = clamp((yk - yb) / (roofEdgeY - yb), 0, 1), xk = lerp(xb, xRoof + RR, Math.pow(f, 0.9)) - RR;
    const NS = 18, NA2 = 7, NT2 = 18;
    for (let i = 0; i < NS; i++) { const t = i / NS, y = lerp(yb, yk, t); out.push([lerp(xb, xk + RR, Math.pow(t, 0.92)), y]); }
    for (let i = 0; i < NA2; i++) { const a = (i / (NA2 - 1)) * (Math.PI / 2); out.push([xk + RR * Math.cos(a), yk + RR * Math.sin(a)]); }
    for (let i = 1; i <= NT2; i++) { const t = i / NT2, u = 1 - Math.cos((t * Math.PI) / 2), x = xk * (1 - u); out.push([x, yk + RR + cr * (1 - (x / Math.max(0.01, xk)) ** 2)]); }
    return out;
  }
  const C_SIDE = 18, C_ARC0 = 18, C_TOP0 = 25;
  // r4 (Daniel, on r3: the windows too long and stretched, the windscreen too big and sharp-cornered): the glasshouse
  // is no longer cut along its grid. Each opening is drawn as an outline with rounded corners in the surface's own
  // coordinates (the flank: z and height; the roof: z and a coordinate across from the pillar's corner to the middle),
  // the painted skin is triangulated round those outlines (holes), the glass inside them, and both are laid on the
  // skin, so the edges are the outlines themselves, exactly, with the chrome frames on them.
  const sideBot = (z) => beltY(z) - 0.006, sideTopY = (z) => cabHalf(z)[C_SIDE][1];
  // the roof part of the section (the pillar's rounded corner, then the crown to the middle): s in [-1, 1], 0 the middle
  const topPt = (z, s) => {
    const H = cabHalf(z).slice(C_ARC0), f = (1 - Math.min(1, Math.abs(s))) * (H.length - 1), k = Math.min(H.length - 2, Math.floor(f)), t = f - k;
    const x = lerp(H[k][0], H[k + 1][0], t), y = lerp(H[k][1], H[k + 1][1], t);
    return V3(s < 0 ? -x : x, y, z);
  };
  const topNrm = (z, s) => { const e = 0.003, a = topPt(z + e, s).sub(topPt(z - e, s)), b = topPt(z, s + e).sub(topPt(z, s - e)), n = new T.Vector3().crossVectors(b, a).normalize(); if (n.y < -0.2 || (Math.abs(n.y) < 0.2 && n.x * s < 0)) n.negate(); return n; };
  const sOfX = (z, x) => { const H = cabHalf(z).slice(C_ARC0), ax = Math.abs(x); for (let k = 0; k < H.length - 1; k++) if (H[k][0] >= ax && H[k + 1][0] <= ax) { const t = (H[k][0] - ax) / Math.max(1e-6, H[k][0] - H[k + 1][0]); return Math.sign(x || 1) * (1 - (k + t) / (H.length - 1)); } return 0; };
  const xkOf = (z) => cabHalf(z)[C_ARC0 + 6][0]; // where the corner meets the crown
  // a rounded quadrilateral through four corners (in order) with a radius per corner, as a dense outline
  function roundQuad(P, rad, n = 10) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const A = P[(i + 3) % 4], B = P[i], C = P[(i + 1) % 4], r = rad[i];
      const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]], lu = Math.hypot(...u), lv = Math.hypot(...v);
      const p0 = [B[0] + (u[0] / lu) * r, B[1] + (u[1] / lu) * r], p1 = [B[0] + (v[0] / lv) * r, B[1] + (v[1] / lv) * r];
      for (let k = 0; k <= n; k++) { const t = k / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; out.push([a * p0[0] + b * B[0] + c * p1[0], a * p0[1] + b * B[1] + c * p1[1]]); }
    }
    return out;
  }
  // triangulate an outline (with holes) in parameter space, split every edge longer than L (shared edges split once:
  // no cracks), then lay the vertices on the skin with map(a, b) -> { p, n }
  function paramMesh(outer, holes, map, L, { inset = 0, flip = false } = {}) {
    const shape = new T.Shape(outer.map(([a, b]) => new T.Vector2(a, b)));
    for (const h of holes) shape.holes.push(new T.Path(h.map(([a, b]) => new T.Vector2(a, b))));
    const g0 = new T.ShapeGeometry(shape, 1), P0 = g0.attributes.position;
    let V = []; for (let i = 0; i < P0.count; i++) V.push([P0.getX(i), P0.getY(i)]);
    let F = []; const I0 = g0.index.array; for (let i = 0; i < I0.length; i += 3) F.push([I0[i], I0[i + 1], I0[i + 2]]);
    for (let pass = 0; pass < 12; pass++) {
      const mid = new Map(), long = (a, b) => Math.hypot(V[a][0] - V[b][0], V[a][1] - V[b][1]) > L;
      const M = (a, b) => { const k = a < b ? a + "," + b : b + "," + a; if (!mid.has(k)) { V.push([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2]); mid.set(k, V.length - 1); } return mid.get(k); };
      let any = false; const NF = [];
      for (const [a, b, c] of F) {
        const ab = long(a, b), bc = long(b, c), ca = long(c, a);
        if (!ab && !bc && !ca) { NF.push([a, b, c]); continue; }
        any = true;
        if (ab && bc && ca) { const x = M(a, b), y = M(b, c), z2 = M(c, a); NF.push([a, x, z2], [x, b, y], [z2, y, c], [x, y, z2]); continue; }
        // one or two long edges (rotated so the pattern is p-q-r): split them, no long edge left behind
        const rot = [[a, b, c, ab, bc, ca], [b, c, a, bc, ca, ab], [c, a, b, ca, ab, bc]];
        const n = (ab ? 1 : 0) + (bc ? 1 : 0) + (ca ? 1 : 0);
        if (n === 1) { const [p, q, r] = rot.find((t) => t[3]); const m = M(p, q); NF.push([p, m, r], [m, q, r]); }
        else { const [p, q, r] = rot.find((t) => !t[3]); const m1 = M(q, r), m2 = M(r, p); NF.push([p, q, m1], [p, m1, m2], [m1, r, m2]); }
      }
      F = NF; if (!any) break;
    }
    const pos = [], nrm = [];
    for (const [a, b] of V) { const { p, n } = map(a, b); const q = p.clone().addScaledVector(n, -inset); pos.push(q.x, q.y, q.z); const s = flip ? -1 : 1; nrm.push(n.x * s, n.y * s, n.z * s); }
    const idx = []; for (const [a, b, c] of F) { if (flip) idx.push(a, c, b); else idx.push(a, b, c); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
    // (faces the way the normals say)
    const p = g.attributes.position, nn = g.attributes.normal, ia = g.index.array; let dot = 0;
    for (let i = 0; i < Math.min(ia.length, 300); i += 3) { const A = V3(p.getX(ia[i]), p.getY(ia[i]), p.getZ(ia[i])), B = V3(p.getX(ia[i + 1]), p.getY(ia[i + 1]), p.getZ(ia[i + 1])), C = V3(p.getX(ia[i + 2]), p.getY(ia[i + 2]), p.getZ(ia[i + 2])); const fn = new T.Vector3().crossVectors(B.clone().sub(A), C.clone().sub(A)); dot += fn.x * nn.getX(ia[i]) + fn.y * nn.getY(ia[i]) + fn.z * nn.getZ(ia[i]); }
    if (dot < 0) for (let i = 0; i < ia.length; i += 3) { const t0 = ia[i]; ia[i] = ia[i + 1]; ia[i + 1] = t0; }
    return g;
  }
  // ---- the openings, off the 1:24 model's photo (metres; the flank: z, y; the roof: z, x)
  const T_WIN = (z) => sideTopY(z) - 0.042; // the windows' top: a painted rail under the roof's corner
  const BOT = (z) => sideBot(z) + 0.022; // their bottom: just over the door's top edge
  // front door window: the front edge parallel to the A-pillar, set in from it (a wide painted pillar at its foot)
  const zFTop = (() => { let z = 0.2; for (let i = 0; i < 60; i++) { const d = sideTopY(z) - 0.085 - T_WIN(-0.3); z += d > 0 ? 0.004 : -0.004; } return z; })();
  const frontWin = roundQuad([[0.385, BOT(0.385)], [-0.352, BOT(-0.352)], [-0.352, T_WIN(-0.352)], [zFTop, T_WIN(zFTop)]], [0.02, 0.018, 0.026, 0.05]);
  // rear door window: from the B-pillar back, its rear edge a little slanted
  const RW_B = -1.165, RW_T = -1.09;
  const rearWin = roundQuad([[-0.44, BOT(-0.44)], [RW_B, BOT(RW_B)], [RW_T, T_WIN(RW_T)], [-0.44, T_WIN(-0.44)]], [0.018, 0.02, 0.05, 0.026]);
  // windscreen and rear window: rounded corners, a painted band all round (header, pillars, scuttle)
  const wsTop = 0.13, wsBot = 0.548, rwTop = -1.115, rwBot = -1.585;
  const glassOn = (zA, zB, inA, inB, rA, rB) => roundQuad([[zA, -(xkOf(zA) - inA)], [zA, xkOf(zA) - inA], [zB, xkOf(zB) - inB], [zB, -(xkOf(zB) - inB)]], [rA, rA, rB, rB], 12).map(([z, x]) => [z, sOfX(z, x)]);
  const wscreen = glassOn(wsBot, wsTop, 0.05, 0.06, 0.065, 0.1);
  const rwindow = glassOn(rwTop, rwBot, 0.062, 0.05, 0.09, 0.06);
  // ---- the flanks (both sides)
  const sideMap = (sx, inset0 = 0) => (z, y) => { const yy = clamp(y, sideBot(z), sideTopY(z)); const q = cabSide(z, yy); return { p: V3(sx * q.p.x, q.p.y, q.p.z), n: V3(sx * q.n.x, q.n.y, q.n.z) }; };
  const zs = []; for (let z = ZC1; z <= ZC0 + 1e-9; z += 0.01) zs.push(z);
  const sideOuter = [...zs.map((z) => [z, sideBot(z)]), ...zs.slice().reverse().map((z) => [z, sideTopY(z)])];
  for (const sx of [1, -1]) {
    const m = sideMap(sx);
    add(paramMesh(sideOuter, [frontWin, rearWin], m, 0.03), mats.paint, "flank of the glasshouse");
    add(paramMesh(sideOuter, [frontWin, rearWin], m, 0.04, { inset: 0.012, flip: true }), mats.liner, "pillar trim");
    for (const w of [frontWin, rearWin]) add(paramMesh(w, [], m, 0.03, { inset: 0.005 }), mats.glass, "side glass");
  }
  // ---- the roof, its pillars' corners, windscreen and rear window
  const topOuter = []; for (const z of zs) topOuter.push([z, -1]); for (let k = 1; k < 20; k++) topOuter.push([ZC0, -1 + k / 10]); for (const z of zs.slice().reverse()) topOuter.push([z, 1]); for (let k = 1; k < 20; k++) topOuter.push([ZC1, 1 - k / 10]);
  const topMap = (z, s) => ({ p: topPt(z, s), n: topNrm(z, s) });
  add(paramMesh(topOuter, [wscreen, rwindow], topMap, 0.03), mats.paint, "roof and pillars");
  add(paramMesh(topOuter, [wscreen, rwindow], topMap, 0.05, { inset: 0.012, flip: true }), mats.liner, "headliner");
  for (const w of [wscreen, rwindow]) add(paramMesh(w, [], topMap, 0.03, { inset: 0.005 }), mats.glass, "glass");
  // ---- chrome frames on every outline (a round rod laid on the skin)
  const frame = (outline, map) => { const pts = outline.map(([a, b]) => { const { p, n } = map(a, b); return { p: p.clone().addScaledVector(n, 0.001), n }; }); pts.push(pts[0]); sweep(pts, roundProf(0.0068, 10, 0.75), mats.chrome, "window frame", { closed: true, caps: false }); };
  for (const sx of [1, -1]) for (const w of [frontWin, rearWin]) frame(w, sideMap(sx));
  for (const w of [wscreen, rwindow]) frame(w, topMap);
  // ---- the drip rails along the roof's edges
  for (const s of [-1, 1]) { const pts = []; for (let z = -1.06; z <= 0.06; z += 0.01) pts.push({ p: topPt(z, s * 0.88).addScaledVector(topNrm(z, s * 0.88), 0.004), n: topNrm(z, s * 0.88) }); sweep(pts, roundProf(0.0058, 10), mats.chrome, "drip rail", { closed: true }); }
  // cabin surface query (the flank of the glasshouse at z, height y)
  function cabSide(z, y) {
    const h = cabHalf(z); let k; for (k = 0; k < C_SIDE - 1; k++) if (h[k + 1][1] >= y) break;
    const a = h[k], b = h[k + 1], t = clamp((y - a[1]) / Math.max(1e-6, b[1] - a[1]), 0, 1), x = lerp(a[0], b[0], t);
    const e = 0.004, h2 = cabHalf(z + e); let k2; for (k2 = 0; k2 < C_SIDE - 1; k2++) if (h2[k2 + 1][1] >= y) break; const a2 = h2[k2], b2 = h2[k2 + 1], x2 = lerp(a2[0], b2[0], clamp((y - a2[1]) / Math.max(1e-6, b2[1] - a2[1]), 0, 1));
    const dxdy = (b[0] - a[0]) / Math.max(1e-6, b[1] - a[1]), dxdz = (x2 - x) / e;
    return { p: V3(x, y, z), n: V3(1, -dxdy, -dxdz).normalize() };
  }
  // r4 (Daniel): the vents are three narrow black slots one above the other, in a line, ON the C-pillar behind the
  // rear door window, parallel to its rear edge, in a thin chrome surround
  {
    const yT = T_WIN(RW_T) - 0.01, yB = yT - 0.25, zAt = (y) => lerp(RW_B, RW_T, (y - BOT(RW_B)) / (T_WIN(RW_T) - BOT(RW_B))) - 0.068;
    const col = (y0, y1, off = 0) => { const pts = []; for (let i = 0; i <= 10; i++) { const y = lerp(y0, y1, i / 10); pts.push(cabSide(zAt(y) + off, y)); } return pts; };
    for (let k = 0; k < 3; k++) { const a = yT - 0.012 - k * 0.079, b = a - 0.066; bothSides(col(b, a), 0.02, 0.0012, mats.gap, "c-pillar vent"); }
    for (const off of [-0.0165, 0.0165]) bothSides(col(yB + 0.0, yT, off), 0.0035, 0.0016, mats.chrome, "vent surround");
    for (const y of [yT, yB]) { const pts = []; for (let i = 0; i <= 6; i++) pts.push(cabSide(zAt(y) - 0.0165 + (i / 6) * 0.033, y)); bothSides(pts, 0.003, 0.0016, mats.chrome, "vent surround"); }
  }
  // ================= the front =================
  const FZ = zN; // the face
  const ringGeo = (w, h, r, t, depth, bevel = 0.004) => { const s = rrShape(w + 2 * t, h + 2 * t, r + t); s.holes.push(rrShape(w, h, r)); return new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 4, curveSegments: 10 }); };
  const facing = (g, z, back) => { if (back) g.rotateY(Math.PI); g.translate(0, 0, z); return g; };
  // the band: chrome frame round lamps and grille, black inside
  { const g = ringGeo(BAND.w, BAND.h, 0.03, 0.011, 0.012, 0.004); g.translate(0, BAND.y, 0); add(facing(g, FZ - 0.006, false), mats.chrome, "grille surround"); }
  { const sh = rrShape(BAND.w, BAND.h, 0.03); sh.holes.push(...holesAt().map((h) => new T.Path(h.getPoints().map((v) => new T.Vector2(v.x, v.y - BAND.y))))); const g = new T.ShapeGeometry(sh, 8); g.translate(0, BAND.y, FZ + 0.001); add(g, mats.black, "grille back"); }
  // the grille's bars between the lamps, the chrome V and the shield
  for (let k = 0; k < 9; k++) { const g = new T.BoxGeometry(0.82, 0.006, 0.012); g.translate(0, BAND.y - 0.072 + k * 0.018, FZ + 0.008); add(g, mats.black, "grille bar"); }
  for (let k = 0; k < 24; k++) { const g = new T.BoxGeometry(0.004, 0.15, 0.008); g.translate(-0.405 + k * 0.0352, BAND.y, FZ + 0.006); add(g, mats.black, "grille bar"); }
  for (const s of [-1, 1]) { const g = new T.CylinderGeometry(0.0065, 0.0065, 0.15, 12); g.scale(1, 0.78, 1); g.rotateZ(-s * 0.36); g.translate(s * 0.024, BAND.y + 0.01, FZ + 0.022); add(g, mats.chrome, "grille V"); }
  { const sh = new T.Shape(); sh.moveTo(-0.018, 0.02); sh.lineTo(0.018, 0.02); sh.lineTo(0.018, -0.004); sh.absarc(0, -0.004, 0.018, 0, Math.PI, true); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 3 }); g.translate(0, BAND.y - 0.008, FZ + 0.026); add(g, mats.badge, "badge"); const r = ringGeo(0.036, 0.024, 0.004, 0.003, 0.004, 0.0015); r.translate(0, BAND.y, FZ + 0.026); add(r, mats.chrome, "badge rim"); }
  // headlamps: wide rounded rectangles, chrome rims, fluted lenses over chrome reflectors
  for (const s of [-1, 1]) {
    const cx = s * HL.x, cy = BAND.y;
    { const g = ringGeo(HL.w, HL.h, HL.r, 0.015, 0.024, 0.006); g.translate(cx, cy, FZ + 0.004); add(g, mats.chrome, "headlamp rim"); }
    // the reflector: a deep bowl behind the lens
    // E8b: a dish with the lens's own rounded-rectangle rim (an ellipsoid left the corners open onto the body's inside),
    // its rim just in front of the face so nothing on the face covers it, tucked under the chrome rim
    { const ring = rrShape(HL.w, HL.h, HL.r).getSpacedPoints(96), N = 16, pos = [], idx = [], M = ring.length;
      for (let k = 0; k <= N; k++) { const th = (k / N) * Math.PI / 2, sc = Math.cos(th), z = FZ + 0.002 - 0.055 * Math.sin(th); for (let i = 0; i < M; i++) pos.push(cx + ring[i].x * sc, cy + ring[i].y * sc, z); }
      for (let k = 0; k < N; k++) for (let i = 0; i < M; i++) { const a = k * M + i, b = k * M + ((i + 1) % M), c = a + M, d = b + M; idx.push(a, c, b, b, c, d); }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); add(g, mats.reflector, "reflector"); }
    { const g = new T.SphereGeometry(0.012, 16, 12); g.translate(cx, cy, FZ - 0.025); add(g, mats.bulb, "bulb"); const c = new T.CylinderGeometry(0.016, 0.016, 0.02, 16); c.rotateX(Math.PI / 2); c.translate(cx, cy, FZ - 0.045); add(c, mats.satin, "bulb cap"); }
    // the lens, domed
    { const g = new T.ShapeGeometry(rrShape(HL.w, HL.h, HL.r), 12); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (HL.w / 2), y = p.getY(i) / (HL.h / 2); p.setZ(i, 0.012 * Math.max(0, 1 - 0.55 * x * x - 0.75 * y * y)); uv.setXY(i, p.getX(i) / HL.w + 0.5, p.getY(i) / HL.h + 0.5); } g.computeVertexNormals(); g.translate(cx, cy, FZ + 0.012); add(g, mats.lens, "headlamp lens"); }
    // the indicator under the lamp, in a chrome cup
    { const g = new T.ShapeGeometry(rrShape(0.13, 0.042, 0.01), 6); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.13 + 0.5, p.getY(i) / 0.042 + 0.5); g.translate(s * 0.545, 0.505, FZ + 0.011); add(g, mats.amber, "indicator"); const r = ringGeo(0.13, 0.042, 0.01, 0.006, 0.01, 0.002); r.translate(s * 0.545, 0.505, FZ + 0.002); add(r, mats.chrome, "indicator rim"); }
  }
  // the slatted intake under the grille
  for (let k = 0; k < 5; k++) { const g = new T.BoxGeometry(0.44, 0.007, 0.016); g.translate(-0.1, 0.468 + k * 0.012, FZ + 0.006); add(g, mats.paint, "intake slat"); }
  { const g = new T.PlaneGeometry(0.44, 0.062); g.translate(-0.1, 0.492, FZ + 0.0015); add(g, mats.black, "intake"); }
  // bumpers: slim chrome blades wrapping round the corners, black rubber overriders
  function bumper(front) {
    const sgn = front ? 1 : -1, z0 = (front ? zN : zT) + sgn * 0.052, y = front ? 0.392 : 0.44;
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80, x = lerp(-0.84, 0.84, t), ax = Math.abs(x);
      const back = ax > 0.68 ? (ax - 0.68) ** 2 * 2.2 : 0; // the ends wrap back round the corners
      pts.push({ p: V3(x, y, z0 - sgn * (0.012 * (x / 0.86) ** 2 + back)), n: V3(0, 1, 0) });
    }
    // profile: a shallow C, 0.084 tall, 0.05 deep (u: up, v: outward along the path's binormal)
    const prof = []; for (let k = 0; k <= 16; k++) { const a = -Math.PI / 2 + (k / 16) * Math.PI; prof.push([Math.sin(a) * 0.042, sgn * (0.012 + Math.cos(a) * 0.03)]); } prof.push([0.038, -sgn * 0.012], [-0.038, -sgn * 0.012]);
    sweep(pts, prof, mats.chrome, front ? "front bumper" : "rear bumper", { closed: true });
    for (const s of [-1, 1]) {
      // r3: tall rubber overriders, reaching well under the blade (the 1:24 model)
      const g = ext.RoundedBoxGeometry ? new ext.RoundedBoxGeometry(0.05, front ? 0.27 : 0.22, 0.055, 3, 0.016) : new T.BoxGeometry(0.05, 0.27, 0.055);
      g.translate(s * (front ? 0.29 : 0.33), y - (front ? 0.02 : 0.01), z0 + sgn * 0.045); add(g, mats.rubber, "overrider");
      const st = new T.BoxGeometry(0.02, 0.03, 0.09); st.translate(s * 0.62, y, z0 - sgn * 0.06); add(st, mats.under, "bumper bracket");
    }
  }
  bumper(true); bumper(false);
  // number plates
  { const g = new T.PlaneGeometry(0.34, 0.105); g.translate(0, 0.395, zN + 0.11); add(g, mats.plate1300, "front plate"); const b = new T.BoxGeometry(0.35, 0.115, 0.008); b.translate(0, 0.395, zN + 0.105); add(b, mats.black, "plate holder"); }
  { const g = new T.PlaneGeometry(0.52, 0.112); g.rotateY(Math.PI); g.translate(0, 0.67, zT - 0.009); add(g, mats.plate, "rear plate"); const b = new T.BoxGeometry(0.535, 0.125, 0.006); b.translate(0, 0.67, zT - 0.004); add(b, mats.black, "plate holder"); const l = new T.BoxGeometry(0.12, 0.018, 0.03); l.translate(0, 0.762, zT - 0.012); add(l, mats.chrome, "plate lamp"); }

  // ================= the rear: tail lamps, the boot's lock, the exhaust =================
  // r3 (the photos): wide tail lamps at the corners in chrome frames: amber outboard, red, the clear reversing lamp
  for (const s of [-1, 1]) {
    const cx = s * 0.56, cy = 0.675, w = 0.25, h = 0.108;
    { const g = ringGeo(w, h, 0.016, 0.012, 0.016, 0.004); g.rotateY(Math.PI); g.translate(cx, cy, zT + 0.002); add(g, mats.chrome, "tail lamp rim"); }
    const seg = (x0, x1, mat) => { const g = new T.PlaneGeometry(Math.abs(x1 - x0), h, 1, 1); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.abs(x1 - x0) * 16, uv.getY(i)); g.rotateY(Math.PI); g.translate(cx + s * ((x0 + x1) / 2), cy, zT - 0.012); add(g, mat, "tail lamp"); };
    seg(w / 2 - 0.07, w / 2, mats.amber); seg(-w / 2 + 0.055, w / 2 - 0.07, mats.red); seg(-w / 2, -w / 2 + 0.055, mats.clear);
    for (const xs of [w / 2 - 0.07, -w / 2 + 0.055]) { const g = new T.BoxGeometry(0.005, h, 0.008); g.translate(cx + s * xs, cy, zT - 0.013); add(g, mats.satin, "lamp divider"); }
  }
  // mud flaps behind the rear wheels
  for (const s of [-1, 1]) { const g = new T.BoxGeometry(0.16, 0.25, 0.008); g.translate(s * 0.655, 0.255, zR - AR - 0.03); add(g, mats.rubber, "mud flap"); }
  { const g = new T.CylinderGeometry(0.014, 0.014, 0.012, 20); g.rotateX(Math.PI / 2); g.translate(0, 0.79, zT - 0.006); add(g, mats.chrome, "boot lock"); }
  { const g = new T.CylinderGeometry(0.024, 0.024, 0.28, 20, 1, true); g.rotateX(Math.PI / 2); g.translate(-0.42, 0.235, zT + 0.11); add(g, mats.satin, "exhaust"); const c = new T.CircleGeometry(0.02, 20); c.rotateY(Math.PI); c.translate(-0.42, 0.235, zT - 0.028); add(c, mats.under, "exhaust hole"); }

  // ================= the flank's fittings: handles, the mirror, the fuel cap, wipers =================
  for (const s of [-1, 1]) for (const zh of [-0.33, -0.975]) {
    const q = lowerSide(zh, 0.818), p = V3(s * q.p.x, q.p.y, q.p.z), n = V3(s * q.n.x, q.n.y, q.n.z);
    const g = new T.CapsuleGeometry ? new T.CapsuleGeometry(0.0095, 0.1, 6, 12) : new T.CylinderGeometry(0.01, 0.01, 0.12, 12);
    g.rotateX(Math.PI / 2); g.scale(1, 0.85, 1);
    const m = add(g, mats.chrome, "door handle"); m.position.copy(p).addScaledVector(n, 0.014); m.lookAt(m.position.clone().add(V3(0, 0, 1)));
    const rec = new T.PlaneGeometry(0.11, 0.032); const rm = add(rec, mats.gap, "handle recess"); rm.position.copy(p).addScaledVector(n, 0.0015); rm.lookAt(rm.position.clone().add(n));
    if (zh > -0.5) { const lk = new T.CylinderGeometry(0.007, 0.007, 0.008, 14); lk.rotateZ(Math.PI / 2); const lm = add(lk, mats.chrome, "lock"); lm.position.copy(p).addScaledVector(n, 0.005).add(V3(0, 0, -0.07)); }
  }
  { // the driver's mirror (left, +x): a chrome head on a short stalk at the front door's lower front corner (r3)
    const q = lowerSide(0.44, sideTop(0.44) + 0.01), p = q.p.clone();
    const st = new T.CylinderGeometry(0.007, 0.01, 0.075, 12); st.rotateZ(-Math.PI / 2 + 0.6); const sm = add(st, mats.chrome, "mirror stalk"); sm.position.set(p.x + 0.03, p.y + 0.03, p.z);
    const hg = ext.RoundedBoxGeometry ? new ext.RoundedBoxGeometry(0.03, 0.068, 0.088, 3, 0.012) : new T.BoxGeometry(0.03, 0.068, 0.088);
    const hm = add(hg, mats.chrome, "mirror"); hm.position.set(p.x + 0.075, p.y + 0.07, p.z - 0.005); hm.rotation.y = -0.25;
    const gl = new T.PlaneGeometry(0.06, 0.05); gl.rotateY(Math.PI); const gm = add(gl, mats.mirror, "mirror glass"); gm.position.set(p.x + 0.075, p.y + 0.07, p.z - 0.051); gm.rotation.y = Math.PI - 0.25 - Math.PI;
  }
  { const q = lowerSide(-1.86, 0.80); const g = new T.CylinderGeometry(0.042, 0.042, 0.008, 28); g.rotateZ(Math.PI / 2); const m = add(g, mats.chrome, "fuel cap"); m.position.set(-q.p.x - 0.002, q.p.y, q.p.z); }
  { // wipers parked at the foot of the windscreen
    for (const [x0, x1] of [[-0.42, 0.02], [0.08, 0.5]]) {
      const pts = []; for (let i = 0; i <= 20; i++) { const x = lerp(x0, x1, i / 20), z = 0.53 - 0.03 * (i / 20); const h = cabHalf(z); let y = 0; for (let k = C_TOP0; k < h.length - 1; k++) if (h[k][0] >= Math.abs(x) && h[k + 1][0] <= Math.abs(x)) { y = lerp(h[k][1], h[k + 1][1], (h[k][0] - Math.abs(x)) / Math.max(1e-6, h[k][0] - h[k + 1][0])); break; } if (!y) y = h[h.length - 1][1]; pts.push({ p: V3(x, y + 0.012, z), n: V3(0, 0.8, 0.6).normalize() }); }
      sweep(pts, [[0.005, -0.003], [0.005, 0.003], [-0.003, 0.004], [-0.003, -0.004]], mats.satin, "wiper", { closed: true }); // r3: bright arms, as on the model
    }
  }

  // ================= the wheels =================
  for (const [x, z] of [[1, zF], [-1, zF], [1, zR], [-1, zR]]) group.add(wheel(T, mats, x));
  const ws = group.children.filter((c) => c.name === "wheel");
  ws.forEach((w, k) => { const [sx, z] = [[1, zF], [-1, zF], [1, zR], [-1, zR]][k]; w.position.set(sx * DIM.track / 2, DIM.wheelY, z); });

  // ================= the cabin: seats, the dash, the wheel =================
  const RB = ext.RoundedBoxGeometry;
  const rbox = (w, h, d, r, mat, name, at, rot) => { const g = RB ? new RB(w, h, d, 4, r) : new T.BoxGeometry(w, h, d); const m = add(g, mat, name); m.position.set(...at); if (rot) m.rotation.set(...rot); return m; };
  for (const s of [-1, 1]) {
    rbox(0.5, 0.13, 0.52, 0.05, mats.vinyl, "front seat", [s * 0.34, 0.47, -0.18]);
    rbox(0.48, 0.56, 0.11, 0.05, mats.vinyl, "front seat back", [s * 0.34, 0.78, -0.47], [-0.2, 0, 0]);
    rbox(0.26, 0.12, 0.07, 0.03, mats.vinyl, "headrest", [s * 0.34, 1.11, -0.55], [-0.2, 0, 0]);
  }
  rbox(0.88, 0.14, 0.5, 0.05, mats.vinyl, "rear seat", [0, 0.45, -0.98]);
  rbox(1.34, 0.48, 0.12, 0.05, mats.vinyl, "rear seat back", [0, 0.71, -1.25], [-0.3, 0, 0]);
  rbox(1.4, 0.03, 0.3, 0.01, mats.dash, "parcel shelf", [0, beltY(-1.48) - 0.03, -1.47]);
  rbox(1.42, 0.16, 0.3, 0.04, mats.dash, "dashboard", [0, 0.8, 0.46]);
  { const g = new T.TorusGeometry(0.19, 0.012, 12, 48); const m = add(g, mats.dash, "steering wheel"); m.position.set(0.34, 0.86, 0.2); m.rotation.set(-0.45, 0, 0); const c = new T.CylinderGeometry(0.02, 0.02, 0.34, 12); const cm = add(c, mats.dash, "column"); cm.position.set(0.34, 0.8, 0.32); cm.rotation.set(1.1, 0, 0); }
  return { group, mats, tex };
}

// ---- a wheel: tyre (sidewalls and a treaded crown), steel rim, chrome hub cap; axis along x, its face towards side
function wheel(T, mats, side) {
  const g = new T.Group(); g.name = "wheel";
  const R = DIM.tyreR, Wt = 0.155, rr = DIM.rimR;
  // profile in (radius, axial) of the outer half, mirrored: bead -> sidewall bulge -> shoulder
  const sideProf = [];
  for (let k = 0; k <= 14; k++) { const t = k / 14, r = lerp(rr + 0.004, R - 0.022, t), a = Wt / 2 - 0.004 + 0.012 * Math.sin(Math.PI * t * 0.85); sideProf.push([r, a]); }
  for (let k = 1; k <= 8; k++) { const a = (k / 8) * (Math.PI / 2), r = R - 0.022 + 0.022 * Math.sin(a), ax = Wt / 2 - 0.004 + 0.012 * Math.sin(Math.PI * 0.85) * (1 - k / 8) - 0.016 * Math.sin(a) * 0 ; sideProf.push([r, lerp(sideProf[14][1], Wt / 2 - 0.018, Math.sin(a))]); }
  const lathe = (prof, mat, name) => { const geo = new T.LatheGeometry(prof.map(([r, a]) => new T.Vector2(r, a)), 96); geo.rotateZ(-Math.PI / 2); const m = new T.Mesh(geo, mat); m.name = name; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  // (LatheGeometry turns round y, the profile's second number along y; rotated so y -> x)
  const outer = sideProf.map(([r, a]) => [r, a]), inner = sideProf.map(([r, a]) => [r, -a]).reverse();
  lathe(outer.slice().reverse(), mats.tyre, "tyre wall"); lathe(inner.slice().reverse(), mats.tyre, "tyre wall");
  // the crown: three grooves
  const crown = []; const a0 = Wt / 2 - 0.018; const gro = [-0.036, 0, 0.036];
  for (let k = 0; k <= 60; k++) { const a = lerp(a0, -a0, k / 60); let r = R - 0.0035 * (a / a0) ** 4; for (const g0 of gro) if (Math.abs(a - g0) < 0.004) r -= 0.007 * Math.cos(((a - g0) / 0.004) * (Math.PI / 2)); crown.push([r, a]); }
  const cm = lathe(crown, mats.tread, "tread");
  { const uv = cm.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 24, uv.getY(i)); }
  // the steel rim: flange, a dished face with its ring of vents, the hub cap
  const rim = [[rr + 0.006, -0.06], [rr + 0.012, -0.066], [rr, -0.07], [rr - 0.012, -0.05], [rr - 0.016, 0.02], [rr - 0.006, 0.05], [rr + 0.012, 0.064], [rr + 0.004, 0.07], [rr - 0.012, 0.066], [rr - 0.03, 0.05], [0.12, 0.035], [0.105, 0.04], [0.09, 0.03], [0.0, 0.03]];
  lathe(rim, mats.steel, "rim");
  // r3 (the model): the painted steel face shows, a small domed chrome cap in the middle, a ring of vents round it
  const cap = []; for (let k = 0; k <= 22; k++) { const t = k / 22, r = 0.066 * (1 - t), a = 0.036 + 0.024 * Math.sqrt(1 - (r / 0.066) ** 2); cap.push([Math.max(0.0005, r), a]); }
  cap.unshift([0.07, 0.033]);
  for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2, gv = new T.BoxGeometry(0.004, 0.026, 0.012); const vm = new T.Mesh(gv, mats.under); vm.position.set(0.0365, Math.cos(ang) * 0.104, Math.sin(ang) * 0.104); vm.rotation.x = -ang; vm.name = "rim vent"; g.add(vm); }
  lathe(cap.slice().reverse().map(([r, a]) => [r, a]).reverse(), mats.chrome, "hub cap");
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}

// ---- textures made on canvas: tread blocks, headlamp flutes, lamp prisms, the number plate
function makeTextures(T) {
  const cv = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
  // a height field -> a normal map
  const normalFrom = (w, h, H, k = 2) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"), im = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (H((x + 1) % w, y) - H((x - 1 + w) % w, y)) * k, dy = (H(x, (y + 1) % h) - H(x, (y - 1 + h) % h)) * k, l = Math.hypot(dx, dy, 1), o = (y * w + x) * 4;
      im.data[o] = (-dx / l * 0.5 + 0.5) * 255; im.data[o + 1] = (dy / l * 0.5 + 0.5) * 255; im.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; im.data[o + 3] = 255;
    }
    ctx.putImageData(im, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace; return t;
  };
  // tread: transverse sipes and blocks (u round the tyre, v across)
  const tread = normalFrom(128, 128, (x, y) => { const u = x / 128, v = y / 128; const block = Math.abs(((u * 2 + (v > 0.5 ? 0.25 : 0)) % 1) - 0.5) < 0.06 ? -1 : 0; const sipe = Math.abs(((u * 6 + v * 0.8) % 1) - 0.5) < 0.04 ? -0.5 : 0; return block + sipe; }, 1.5);
  // flutes: vertical cylinder lenslets across the lens, finer horizontal ones low down
  const flutes = normalFrom(256, 256, (x, y) => { const a = Math.sin((x / 256) * Math.PI * 2 * 22); const b = y > 150 ? Math.sin((y / 256) * Math.PI * 2 * 18) * 0.6 : 0; return Math.abs(a) * 0.6 + Math.abs(b); }, 1.2);
  // prisms: a fine grid of little pyramids for the tail lamps and indicators
  const prisms = normalFrom(128, 128, (x, y) => { const u = (x / 128) * 16 % 1, v = (y / 128) * 6 % 1; return 1 - Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2; }, 0.8);
  const plateC = cv(1040, 224, (ctx, w, h) => {
    ctx.fillStyle = "#f4f4f0"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#0f3d99"; ctx.fillRect(0, 0, 90, h);
    ctx.fillStyle = "#f4f4f0"; ctx.font = "700 48px Arial, sans-serif"; ctx.textAlign = "center"; ctx.fillText("RO", 45, 190);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = "#121212"; ctx.font = "700 170px 'DIN Alternate', 'Arial Narrow', Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("B 14 CRM", 565, 120);
  });
  const plate = new T.CanvasTexture(plateC); plate.colorSpace = T.SRGBColorSpace; plate.anisotropy = 8;
  const p13 = cv(720, 224, (ctx, w, h) => { ctx.fillStyle = "#f6f6f2"; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = "#111"; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8); ctx.fillStyle = "#121212"; ctx.font = "500 168px 'Helvetica Neue', Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("1300", w / 2, h / 2 + 8); });
  const plate1300 = new T.CanvasTexture(p13); plate1300.colorSpace = T.SRGBColorSpace; plate1300.anisotropy = 8;
  return { tread, flutes, prisms, plate, plate1300 };
}
