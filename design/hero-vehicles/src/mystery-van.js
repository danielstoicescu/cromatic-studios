// Cromatic · hero vehicles (Radu): the Mystery van, a split-window bus of the 1960s type (a rear-engined forward-control
// van: the flat nose with the split windscreen, the cab over the front wheels, four side windows, the rounded loaf of a
// roof) in the map's own livery ("groovy" ride): teal, a lime belt stripe, a lime chevron on the nose, orange and lime
// waves with flowers on the flanks, the spare wheel with its flower cover on the nose, a chrome roof rack. The livery is
// Cromatic's (the map's), no film or cartoon vehicle's; no maker's badge (a plain chevron, no roundel).
// Metres; origin on the ground under the middle of the wheelbase, +z forward, +y up, +x the van's left.
//   buildMysteryVan(THREE, { RoundedBoxGeometry }) -> { group, body, wheels, mats, tex, parts, DIM }
// Proportions off the type's published numbers (the 1960s split-window bus): length 4.28 over the bumpers, width 1.75,
// height 1.90 (2.03 over the rack; v2: 4 cm under the type's 1.94, the roof read heavy), wheelbase 2.40, track 1.37, tyres 5.60-15 (0.66 m across).
import { pchip, clamp, lerp, sstep, makeTex, baseMats, paintMat, makeKit, buildWheel, dDust, dPlate, dSeat, dStitch, dGauge, dGaugeMesh, dSteering, dInnerMirror } from "./kit.js";

export const DIM = { L: 4.28, W: 1.75, H: 1.9, Hrack: 2.03, WB: 2.40, track: 1.37, zF: 1.2, zR: -1.2, zN: 1.835, zT: -2.31, tyreR: 0.33, rimR: 0.19 };

export function buildMysteryVan(T, ext = {}) {
  const { zF, zR, zN, zT } = DIM;
  const group = new T.Group(); group.name = "hero-mystery-van";
  const K = makeKit(T, group); K.setRB(ext.RoundedBoxGeometry);
  const { V3, add, sweep, roundProf, rod, tube, rrShape, ringGeo, rbox, gridGeo, roundQuad, paramMesh: paramMesh0, paramMeshD, ribbon } = K;
  const paramMesh = (o, h, m, L, opt = {}) => paramMeshD(o, h, m, L, { scale: m === topMap ? [1, 0.8] : [1, 1], ...opt });
  const tex = makeTex(T), mats = baseMats(T, tex);
  const TEAL = "#3FB8C9", LIME = "#7CC94F", ORANGE = "#F65342", YEL = "#FED012", INK = "#1c1c1c";
  Object.assign(mats, {
    paint: paintMat(T, TEAL, { name: "paint" }),
    lime: paintMat(T, LIME, { name: "paint lime" }),
    limeNose: paintMat(T, "#62b532", { name: "paint lime" }), // (the nose faces the light: a touch deeper so it reads as the stripe's lime)
    cream: new T.MeshPhysicalMaterial({ name: "cream wheel", color: new T.Color("#f4f2ea"), roughness: 0.3, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.1, side: T.DoubleSide }),
    reflector: new T.MeshPhysicalMaterial({ name: "reflector", color: new T.Color("#e9e9ea"), roughness: 0.16, metalness: 1, side: T.DoubleSide }),
    seat: new T.MeshPhysicalMaterial({ name: "seat vinyl", color: new T.Color("#e9e1cf"), roughness: 0.55, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.35 }),
    liner: new T.MeshPhysicalMaterial({ name: "headliner", color: new T.Color("#e6dfcf"), roughness: 0.9, metalness: 0 }),
    livery: new T.MeshPhysicalMaterial({ name: "livery", map: sideTex(T, tex), alphaTest: 0.5, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.035, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: T.DoubleSide }),
    flower: new T.MeshPhysicalMaterial({ name: "spare cover", map: flowerTex(T, tex), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
    plate: new T.MeshPhysicalMaterial({ name: "number plate", map: tex.plateRO("B 99 CRS"), roughness: 0.35, metalness: 0, clearcoat: 0.5 })
  });

  // ================= the shell: sections along z =================
  const HW0 = 0.86, rF = 0.30, rR = 0.32, RT = 0.1, CROWN = 0.028; /* v3: a tighter roof corner, a flatter crown (less loaf, less toy) */ /* v2: a lighter roof (smaller corner, flatter crown) */ // half width, plan corner radii, the roof's corner, its crown
  const AR = 0.40, AY = 0.33; // wheel arches
  const BELT = 1.26, LIME0 = 1.06, LIME1 = 1.20; // the windows' sill line; the lime stripe under it
  function hw(z) {
    let w = HW0;
    if (z > zN - rF) { const d = z - (zN - rF); w = w - rF + Math.sqrt(Math.max(0, rF * rF - d * d)); }
    if (z < zT + rR) { const d = zT + rR - z; w = w - rR + Math.sqrt(Math.max(0, rR * rR - d * d)); }
    return w;
  }
  // the centre line of the roof: the windscreen (steep) at the front, the rear window and the engine lid at the back
  // v2 (Daniel: less toy-like): the roof 4 cm lower, a lower windscreen over a taller nose, the roof's front a short peak
  const Ht = pchip([[zT, 1.12], [zT + 0.05, 1.32], [zT + 0.13, 1.62], [zT + 0.26, 1.8], [zT + 0.5, 1.89], [zT + 0.8, 1.9], [zN - 0.75, 1.9], [zN - 0.5, 1.878], [zN - 0.32, 1.8], [zN - 0.2, 1.66], [zN - 0.1, 1.42], [zN - 0.04, 1.27], [zN, 1.2]]);
  const ys = (z) => Ht(z) - RT - CROWN; // where the roof's corner starts
  const ybase = pchip([[zT, 0.47], [zT + 0.2, 0.42], [zN - 0.25, 0.42], [zN, 0.47]]);
  const ybot = (z) => { let y = ybase(z); for (const za of [zF, zR]) { const dz = z - za; if (Math.abs(dz) < AR) y = Math.max(y, AY + Math.sqrt(AR * AR - dz * dz)); } return y; };
  function sideX(z, y) {
    let x = hw(z);
    if (y < 0.56) x -= 0.03 * ((0.56 - y) / 0.15) ** 2; // the sill tucks under
    if (y > LIME1) x -= 0.045 * Math.pow(Math.max(0, y - LIME1) / 0.55, 1.4); // the glass leans in
    return x;
  }
  // the nose and the tail bulge in plan (the face is curved across): z is pushed out at the middle
  const warpZ = (x, z) => z + 0.13 * (1 - (x / HW0) ** 2) * sstep(zN - 0.75, zN, z) - 0.07 * (1 - (x / HW0) ** 2) * sstep(zT + 0.6, zT, z);
  const W3 = (x, y, z) => V3(x, y, warpZ(x, z));
  const faceZ = (x) => warpZ(x, zN), tailZ = (x) => warpZ(x, zT);
  // the roof's half section from the corner's start (s = 1) to the middle (s = 0): [x, y]
  const NA = 8, NT = 16;
  function topHalf(z) {
    const y0 = ys(z), xs = sideX(z, y0), cx = xs - RT, out = [];
    for (let i = 0; i < NA; i++) { const a = (i / (NA - 1)) * (Math.PI / 2); out.push([cx + RT * Math.cos(a), y0 + RT * Math.sin(a)]); }
    for (let i = 1; i <= NT; i++) { const t = i / NT, u = 1 - Math.cos((t * Math.PI) / 2), x = cx * (1 - u); out.push([x, y0 + RT + CROWN * (1 - (x / Math.max(0.01, cx)) ** 2)]); }
    return out;
  }
  const topXY = (z, s) => { const H = topHalf(z), f = (1 - Math.min(1, Math.abs(s))) * (H.length - 1), k = Math.min(H.length - 2, Math.floor(f)), t = f - k; return [Math.sign(s || 1) * lerp(H[k][0], H[k + 1][0], t), lerp(H[k][1], H[k + 1][1], t)]; };
  const fdMap = (P, ea = 0.002, eb = 0.002, outHint) => (a, b) => {
    const p = P(a, b), A = P(a + ea, b).sub(P(a - ea, b)), B = P(a, b + eb).sub(P(a, b - eb)), n = new T.Vector3().crossVectors(A, B).normalize();
    if (outHint(p, n) < 0) n.negate(); return { p, n };
  };
  const topP = (z, s) => { const [x, y] = topXY(z, s); return W3(x, y, z); };
  const outward = (p, n) => n.x * p.x + n.y * (p.y - 0.95) + n.z * (p.z - clamp(p.z, zT + 0.7, zN - 0.7)); // away from the van's core
  const topMap = fdMap(topP, 0.002, 0.002, outward);
  const sideP = (sx) => (z, y) => W3(sx * sideX(z, y), y, z);
  const sideMap = (sx) => fdMap(sideP(sx), 0.002, 0.002, outward);
  // rows along z: fine at the ends and round the arches
  const ZS = (() => { const s = new Set(); for (let z = zT; z <= zN + 1e-9; z += 0.02) s.add(+z.toFixed(5)); for (let d = 0; d <= 0.3; d += 0.008) { s.add(+(zN - d).toFixed(5)); s.add(+(zT + d).toFixed(5)); } for (const za of [zF, zR]) for (const g of [-1, 1]) for (let d = -0.03; d <= 0.03; d += 0.005) s.add(+(za + g * AR + d).toFixed(5)); s.add(zN); s.add(zT); return [...s].filter((z) => z >= zT && z <= zN).sort((a, b) => a - b); })();
  // ---- the lower flanks: the flange, the sill to the lime stripe, the stripe, up to the sill of the windows (or the
  // roof's corner at the ends, where the roof comes down lower than the windows' sill)
  const NAa = 12, NBb = 3, NCc = 4;
  const yTop = (z) => Math.min(BELT, ys(z));
  function lowerHalf(z) { // x >= 0 side: [x, y] from the flange up
    const yb = ybot(z), yt = yTop(z), out = [[sideX(z, yb) - 0.03, yb + 0.004]];
    const seg = (y0, y1, n, last) => { for (let i = 0; i < n + (last ? 1 : 0); i++) { const y = Math.min(yt, lerp(y0, y1, i / n)); out.push([sideX(z, y), y]); } };
    seg(yb, Math.max(yb + 0.01, Math.min(LIME0, yt)), NAa, false); seg(Math.min(LIME0, yt), Math.min(LIME1, yt), NBb, false); seg(Math.min(LIME1, yt), yt, NCc, true);
    return out;
  }
  const LOW = ZS.map(lowerHalf), CL = LOW[0].length;
  for (const sx of [1, -1]) {
    const P = (i, j) => { const [x, y] = LOW[i][j]; const p = W3(sx * x, y, ZS[i]); return [p.x, p.y, p.z]; };
    const isLime = (j) => j >= 1 + NAa && j < 1 + NAa + NBb;
    add(gridGeo(ZS.length, CL, P, (i, j) => !isLime(j), sx < 0), mats.paint, "body");
    add(gridGeo(ZS.length, CL, P, (i, j) => isLime(j), sx < 0), mats.lime, "belt stripe");
  }
  // ---- the window band (the flanks between the windows' sill and the roof's corner) with the windows cut in it
  const zBand = (() => { let a = zT, b = zN; while (ys(a) < BELT + 0.004) a += 0.002; while (ys(b) < BELT + 0.004) b -= 0.002; return [a, b]; })();
  const bandOuter = []; for (let z = zBand[0]; z <= zBand[1]; z += 0.04) bandOuter.push([z, BELT]); bandOuter.push([zBand[1], BELT]); for (let z = zBand[1]; z >= zBand[0]; z -= 0.04) bandOuter.push([z, Math.max(BELT + 0.002, ys(z))]);
  const WB = 1.32, WT = 1.69; // v2: taller glass, less paint over it // the windows' bottom and top
  const win = (z0, z1, r = 0.038, f0 = 0) => roundQuad([[z1, WB], [z0, WB], [z0, WT], [z1 - f0, WT]], [r, r, r, r]);
  // the cab door's window (its front edge leaning with the windscreen's pillar), three big windows with even 0.14 pillars, the small rear quarter
  const WINS = [win(0.96, 1.48, 0.04, 0.16), win(0.16, 0.82, 0.038), win(-0.62, 0.06, 0.038), win(-1.40, -0.72, 0.038), win(-1.8, -1.52, 0.05)]; // v3: squarer corners, slimmer pillars
  for (const sx of [1, -1]) {
    const m = sideMap(sx);
    add(paramMesh(bandOuter, WINS, m, 0.04, { Lb: 0.015 }), mats.paint, "window band");
    add(paramMesh(bandOuter, WINS, m, 0.12, { inset: 0.025, flip: true }), mats.liner, "inner panels");
    for (const w of WINS) add(paramMesh(w, [], m, 0.06, { inset: 0.006 }), mats.glass, "side glass");
    for (const w of WINS) { const pts = w.map(([a, b]) => { const q = m(a, b); return { p: q.p.clone().addScaledVector(q.n, 0.002), n: q.n }; }); pts.push(pts[0]); sweep(pts, roundProf(0.0075, 10, 0.6), mats.rubber, "window rubber", { closed: true, caps: false }); }
  }
  // ---- the roof, with the split windscreen and the rear window
  const topOuter = []; const zl = []; for (let z = zT; z < zN - 0.03; z += z < zT + 0.4 || z > zN - 0.45 ? 0.02 : 0.05) zl.push(z); zl.push(zN); for (const z of zl) topOuter.push([z, -1]); for (let k = 1; k < 20; k++) topOuter.push([zN, -1 + k / 10]); for (const z of zl.slice().reverse()) topOuter.push([z, 1]); for (let k = 1; k < 20; k++) topOuter.push([zT, 1 - k / 10]);
  const WS0 = zN - 0.19, WS1 = zN - 0.055; // the windscreen's top and foot (z)
  const wsPane = (sg) => roundQuad([[WS1, sg * 0.05], [WS1, sg * 0.62], [WS0, sg * 0.6], [WS0, sg * 0.05]].map(([a, b]) => [a, b]), [0.03, 0.06, 0.06, 0.03]).map(([z, s]) => [z, s]);
  const RW0 = zT + 0.16, RW1 = zT + 0.06;
  const rwPane = roundQuad([[RW0, -0.5], [RW0, 0.5], [RW1, 0.47], [RW1, -0.47]], [0.06, 0.06, 0.05, 0.05]);
  const TOPHOLES = [wsPane(-1), wsPane(1), rwPane];
  add(paramMesh(topOuter, TOPHOLES, topMap, 0.035, { Lb: 0.015 }), mats.paint, "roof");
  add(paramMesh(topOuter, TOPHOLES, topMap, 0.16, { inset: 0.025, flip: true }), mats.liner, "headliner");
  for (const w of TOPHOLES) add(paramMesh(w, [], topMap, 0.04, { inset: 0.006 }), mats.glass, "glass");
  for (const w of TOPHOLES) { const pts = w.map(([a, b]) => { const q = topMap(a, b); return { p: q.p.clone().addScaledVector(q.n, 0.002), n: q.n }; }); pts.push(pts[0]); sweep(pts, roundProf(0.01, 10, 0.7), mats.rubber, "window rubber", { closed: true, caps: false }); }
  // ---- the nose and the tail: flat faces bulged by warpZ, the headlamps cut in the nose
  const LAMP = { x: 0.53, y: 0.86, r: 0.088 }; // v3: in from 0.62 (the near lamp sat under the nose's corner skin)
  const endOutline = (z) => { const L = lowerHalf(z), H = topHalf(z); const half = [...L, ...H]; return [...half.map(([x, y]) => [x, y]), ...half.slice(0, -1).reverse().map(([x, y]) => [-x, y])]; };
  const circ = (cx, cy, r, n = 40) => Array.from({ length: n }, (_, k) => { const a = (k / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const faceMap = (zf, sg) => (x, y) => ({ p: W3(x, y, zf), n: (() => { const e = 0.003, a = W3(x + e, y, zf).sub(W3(x - e, y, zf)), b = W3(x, y + e, zf).sub(W3(x, y - e, zf)); const n = new T.Vector3().crossVectors(a, b).normalize(); if (n.z * sg < 0) n.negate(); return n; })() });
  const noseHoles = [circ(-LAMP.x, LAMP.y, LAMP.r * 0.98), circ(LAMP.x, LAMP.y, LAMP.r * 0.98)];
  add(paramMesh(endOutline(zN), noseHoles, faceMap(zN, 1), 0.035, { Lb: 0.012 }), mats.paint, "nose");
  add(paramMesh(endOutline(zT), [], faceMap(zT, -1), 0.035, { Lb: 0.012 }), mats.paint, "tail");
  // the lime chevron on the nose (a plain V under the windscreen: no badge)
  // v2: the chevron continues the flanks' lime stripe (1.06-1.20) across the nose into a V
  { const V = [[-0.552, 1.2], [0, 0.93], [0.552, 1.2], [0.552, 1.06], [0, 0.79], [-0.552, 1.06]]; const fm = faceMap(zN + 0.0, 1); const m = (x, y) => { const q = fm(x, y); return { p: q.p.clone().addScaledVector(q.n, 0.0015), n: q.n }; }; add(paramMesh(V, [], m, 0.04), mats.limeNose, "nose chevron"); }
  // ---- seams: the cab doors, the cargo doors (the right side), the engine lid and the rear hatch
  const GAP = 0.0045, LIFT = 0.0012;
  const onSide = (sx, z, y) => { const q = sideMap(sx)(z, y); return { p: q.p, n: q.n }; };
  const onTail = (x, y) => faceMap(zT, -1)(x, y);
  const line = (f, n = 40) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
  const CAB = [0.86, 1.57], CARGO = [-0.80, 0.74];
  for (const sx of [1, -1]) {
    for (const z of CAB) ribbon(line((t) => onSide(sx, z, lerp(0.77, z > 1.4 ? Math.min(ys(z), BELT + 0.42) : ys(z) - 0.004, t))), GAP, LIFT, mats.gap, "door gap");
    ribbon(line((t) => onSide(sx, lerp(CAB[0], CAB[1], t), 0.77)), GAP, LIFT, mats.gap, "door gap");
    // the cab step under the door (a black rubber tread in the sill)
    { const pts = line((t) => onSide(sx, lerp(CAB[0] - 0.02, CAB[1] - 0.06, t), 0.52), 20); ribbon(pts, 0.05, 0.002, mats.rubber, "cab step"); }
  }
  for (const z of [CARGO[0], (CARGO[0] + CARGO[1]) / 2, CARGO[1]]) ribbon(line((t) => onSide(-1, z, lerp(0.46, ys(z) - 0.004, t))), GAP, LIFT, mats.gap, "cargo door gap");
  ribbon(line((t) => onSide(-1, lerp(CARGO[0], CARGO[1], t), 0.455)), GAP, LIFT, mats.gap, "cargo door gap");
  { const box = (x0, x1, y0, y1) => { const pts = [...line((t) => onTail(lerp(x0, x1, t), y0), 20), ...line((t) => onTail(x1, lerp(y0, y1, t)), 10), ...line((t) => onTail(lerp(x1, x0, t), y1), 20), ...line((t) => onTail(x0, lerp(y1, y0, t)), 10)]; ribbon(pts, GAP, LIFT, mats.gap, "lid gap"); };
    box(-0.52, 0.52, 0.5, 0.9); }
  // the engine's louvres on the rear quarters, over the windows' line
  for (const sx of [1, -1]) for (let k = 0; k < 9; k++) { const z = -1.98 + k * 0.026; ribbon(line((t) => onSide(sx, z + 0.008 * t, lerp(1.0, 1.17, t)), 6), 0.011, 0.0015, mats.gap, "louvre"); }
  // handles: chrome pulls on the cab doors and the cargo doors, the engine lid's T handle
  for (const [sx, z, y] of [[1, 0.94, 1.18], [-1, 0.94, 1.18], [-1, -0.08, 1.12], [-1, 0.06, 1.12]]) { const q = onSide(sx, z, y); const g = new T.CapsuleGeometry(0.011, 0.11, 6, 12); g.rotateX(Math.PI / 2); const m = add(g, mats.chrome, "door handle"); m.position.copy(q.p).addScaledVector(q.n, 0.016); m.lookAt(m.position.clone().add(V3(0, 0, 1))); }
  { const q = onTail(0, 0.82); const g = new T.CylinderGeometry(0.012, 0.012, 0.1, 12); g.rotateZ(Math.PI / 2); const m = add(g, mats.chrome, "lid handle"); m.position.copy(q.p).addScaledVector(q.n, 0.02); }

  // ================= the nose's fittings =================
  for (const s of [-1, 1]) {
    const cx = s * LAMP.x, cy = LAMP.y, zf = faceZ(cx), r = LAMP.r;
    { const g = new T.TorusGeometry(r + 0.004, 0.012, 12, 48); g.translate(cx, cy, zf + 0.012); add(g, mats.chrome, "headlamp rim"); }
    { const g = new T.TorusGeometry(r + 0.03, 0.02, 12, 48); g.scale(1, 1, 0.6); g.translate(cx, cy, zf + 0.002); add(g, mats.paint, "headlamp pod"); }
    { const prof = []; for (let k = 0; k <= 16; k++) { const t = k / 16; prof.push(new T.Vector2(Math.max(0.0005, r * Math.sqrt(1 - t)), -0.07 * t)); } const g = new T.LatheGeometry(prof.reverse(), 48); g.rotateX(Math.PI / 2); g.translate(cx, cy, zf + 0.004); add(g, mats.reflector, "reflector"); }
    { const g = new T.SphereGeometry(0.011, 16, 12); g.translate(cx, cy, zf - 0.025); add(g, mats.bulb, "bulb"); }
    { const g = new T.CircleGeometry(r, 40); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / r, y = p.getY(i) / r; p.setZ(i, 0.018 * Math.max(0, 1 - x * x - y * y)); uv.setXY(i, x * 0.5 + 0.5, y * 0.5 + 0.5); } g.computeVertexNormals(); g.translate(cx, cy, zf + 0.01); add(g, mats.lens, "headlamp lens"); }
    // the bullet indicators over the lamps: chrome bodies, amber lenses
    { const x = s * 0.53, y = 1.04, z = faceZ(x); const b = new T.SphereGeometry(0.034, 20, 12); b.scale(1, 1, 1.3); b.translate(x, y, z + 0.02); add(b, mats.chrome, "indicator body"); const l = new T.SphereGeometry(0.03, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); l.rotateX(Math.PI / 2); l.scale(1, 1, 0.8); l.translate(x, y, z + 0.055); add(l, mats.amber, "indicator"); }
  }
  // the spare wheel on the nose, with its flower cover and a chrome ring, on a bracket
  {
    const sp = buildWheel(T, mats, 1, { R: 0.3, W: 0.15, rr: 0.19, style: "steel", rimMat: mats.cream, capMat: mats.chrome });
    sp.name = "spare wheel"; sp.rotation.set(0, -Math.PI / 2, 0); sp.position.set(0, 0.5, faceZ(0) + 0.13); group.add(sp);
    const c = new T.CircleGeometry(0.27, 64); c.translate(0, 0.5, faceZ(0) + 0.212); add(c, mats.flower, "spare cover");
    { const g = new T.TorusGeometry(0.27, 0.012, 12, 64); g.translate(0, 0.5, faceZ(0) + 0.212); add(g, mats.chrome, "spare ring"); }
    rbox(0.12, 0.05, 0.12, 0.01, mats.darkMetal, "spare bracket", [0, 0.5, faceZ(0) + 0.04]);
  }
  // bumpers (v3: the type's flat pressed blade, a rolled top edge and a step, slim overriders with rubber faces on
  // tubular arms, not a round toy bar)
  function bumper(front) {
    const sg = front ? 1 : -1, y = 0.42, pts = [];
    for (let i = 0; i <= 80; i++) { const x = lerp(-0.86, 0.86, i / 80), ax = Math.abs(x); const back = ax > 0.7 ? (ax - 0.7) ** 2 * 2.2 : 0; pts.push({ p: V3(x, y, (front ? warpZ(x * 0.9, zN) + 0.075 : warpZ(x * 0.9, zT) - 0.07) - sg * back), n: V3(0, 1, 0) }); }
    // the section (u up, v out): a flat face 0.1 tall, a rolled lip on top, a small step low, turned in behind
    const prof = [[-0.05, sg * 0.004], [-0.048, sg * 0.016], [-0.02, sg * 0.018], [-0.016, sg * 0.022], [0.035, sg * 0.022], [0.044, sg * 0.018], [0.05, sg * 0.008], [0.048, -sg * 0.004], [0.04, -sg * 0.008], [-0.046, -sg * 0.006]];
    sweep(pts, prof, mats.chrome, front ? "front bumper" : "rear bumper", { closed: true });
    for (const s of [-1, 1]) {
      const x = s * 0.4, z = (front ? warpZ(x * 0.9, zN) + 0.075 : warpZ(x * 0.9, zT) - 0.07) + sg * 0.02;
      rbox(0.04, 0.16, 0.03, 0.012, mats.chrome, "overrider", [x, y + 0.04, z]);
      rbox(0.022, 0.12, 0.012, 0.005, mats.rubber, "overrider rubber", [x, y + 0.04, z + sg * 0.018]);
      rod([s * 0.6, y, (front ? zN : zT) - sg * 0.1], [s * 0.6, y, z - sg * 0.03], 0.014, mats.darkMetal, "bumper arm");
    }
  }
  bumper(true); bumper(false);
  // plates: the rear on the engine lid, under its lamp
  { const m = dPlate(T, "B 69 MYS", 0.42, 0.105, { kind: "eu", back: true }); m.name = "rear plate"; m.position.set(0, 0.62, tailZ(0) - 0.006); group.add(m); const l = new T.BoxGeometry(0.14, 0.03, 0.04); l.translate(0, 0.705, tailZ(0) - 0.016); add(l, mats.chrome, "plate lamp"); }
  // the tail lamps: tall rounded lamps in chrome rims at the tail's corners
  for (const s of [-1, 1]) {
    const x = s * 0.74, z = tailZ(x), w = 0.1, h = 0.2, cy = 0.95;
    const g = ringGeo(w, h, 0.04, 0.01, 0.018, 0.003); g.rotateY(Math.PI); g.translate(x, cy, z + 0.0); add(g, mats.chrome, "tail lamp rim");
    const l = new T.ShapeGeometry(rrShape(w, h, 0.04), 8); const uv = l.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i)); l.rotateY(Math.PI); l.translate(x, cy, z - 0.016); add(l, mats.red, "tail lamp");
  }
  // the exhaust under the tail
  { const g = new T.CylinderGeometry(0.026, 0.026, 0.3, 20, 1, true); g.rotateX(Math.PI / 2); g.translate(0.45, 0.33, zT + 0.08); add(g, mats.satin, "exhaust"); }
  // mirrors on long chrome arms by the windscreen pillars, wipers parked at the windscreen's foot
  for (const s of [-1, 1]) {
    const q = onSide(s, 1.5, BELT + 0.12);
    const a = q.p.clone(), b = a.clone().add(V3(s * 0.11, 0.07, 0.02));
    rod(a, b, 0.009, mats.chrome, "mirror arm");
    const g = new T.SphereGeometry(0.075, 20, 14); g.scale(0.35, 1, 0.75); const m = add(g, mats.black, "mirror"); m.position.copy(b).add(V3(s * 0.02, 0.02, 0));
    const gl = new T.CircleGeometry(0.065, 24); gl.scale(1, 1.2, 1); gl.rotateY(Math.PI); const gm = add(gl, mats.mirror, "mirror glass"); gm.position.copy(b).add(V3(s * 0.02, 0.02, -0.03));
  }
  for (const s of [-1, 1]) {
    const pts = line((t) => { const sv = s * lerp(0.1, 0.55, t), q = topMap(WS1 + 0.012, sv); return { p: q.p.clone().addScaledVector(q.n, 0.012), n: q.n }; }, 16);
    sweep(pts, [[0.005, -0.003], [0.005, 0.003], [-0.003, 0.004], [-0.003, -0.004]], mats.satin, "wiper", { closed: true });
  }
  // v3: the cab's fresh-air lip over the windscreen (a shallow painted visor with a dark slot under it)
  { const pts = line((t) => { const q = topMap(zN - 0.205, lerp(-0.66, 0.66, t)); return { p: q.p.clone().addScaledVector(q.n, 0.003), n: q.n }; }, 30); sweep(pts, [[0, -0.03], [0.014, -0.026], [0.018, 0.0], [0.012, 0.022], [0, 0.026]], mats.paint, "vent lip", { closed: true }); ribbon(line((t) => { const q = topMap(zN - 0.185, lerp(-0.6, 0.6, t)); return { p: q.p, n: q.n }; }, 30), 0.008, 0.0015, mats.gap, "vent slot"); }
  // v3: the pressed swage ribs round the body at the stripe's edges (the type's beltline), a fuel flap, the cargo doors' hinges
  for (const sx of [1, -1]) for (const y of [LIME0, LIME1]) { const pts = []; for (let z = zT + 0.32; z <= zN - 0.3; z += 0.03) { const q = onSide(sx, z, y); pts.push({ p: q.p.clone().addScaledVector(q.n, -0.001), n: q.n }); } sweep(pts, [[0, -0.007], [0.004, -0.004], [0.005, 0], [0.004, 0.004], [0, 0.007]], y === LIME0 ? mats.lime : mats.lime, "swage rib", { closed: true }); }
  { const c = []; for (let k = 0; k <= 40; k++) { const a = (k / 40) * Math.PI * 2; c.push(onSide(-1, -1.62 + Math.cos(a) * 0.06, 0.88 + Math.sin(a) * 0.06)); } ribbon(c, 0.004, 0.0013, mats.gap, "fuel flap"); }
  for (const z of [CARGO[1] - 0.02, CARGO[0] + 0.02]) for (const y of [0.62, 1.12]) { const q = onSide(-1, z, y); const g = new T.CylinderGeometry(0.009, 0.009, 0.05, 12); const m = add(g, mats.chrome, "door hinge"); m.position.copy(q.p).addScaledVector(q.n, 0.006); }
  // the rain gutters along the roof's edges, the chrome roof rack on six feet
  for (const s of [-1, 1]) { const pts = []; for (let z = zT + 0.42; z <= zN - 0.44; z += 0.02) { const q = topMap(z, s * 0.97); pts.push({ p: q.p.clone().addScaledVector(q.n, 0.006), n: q.n }); } sweep(pts, roundProf(0.008, 10), mats.paint, "rain gutter", { closed: true }); }
  {
    const yR = 1.96, xs = 0.62, z0 = -1.55, z1 = 0.95;
    for (const s of [-1, 1]) {
      tube([[s * xs, yR, z0], [s * xs, yR, z1]], 0.016, mats.chrome, "rack rail", { seg: 8 });
      for (const zz of [z0, (z0 + z1) / 2, z1]) { const q = topMap(zz, s * 0.93); rod(q.p, V3(s * xs, yR, zz), 0.012, mats.chrome, "rack foot"); }
    }
    for (let k = 0; k < 6; k++) { const zz = lerp(z0 + 0.05, z1 - 0.05, k / 5); rod([-xs, yR + 0.004, zz], [xs, yR + 0.004, zz], 0.011, mats.chrome, "rack slat"); }
    for (const zz of [z0, z1]) { tube([[-xs, yR, zz], [-xs * 0.96, yR + 0.045, zz], [xs * 0.96, yR + 0.045, zz], [xs, yR, zz]], 0.014, mats.chrome, "rack hoop", { seg: 24 }); }
  }
  // the flanks' livery: waves and flowers under the stripe, laid on the skin, both sides (not over the wheel openings)
  {
    const z0 = -2.0, z1 = 1.62, y0 = 0.47, y1 = 1.03, nz = 90, ny = 16;
    for (const sx of [1, -1]) {
      const m = sideMap(sx);
      const g = gridGeo(ny + 1, nz + 1, (i, j) => { const z = lerp(z1, z0, j / nz), y = lerp(y0, y1, i / ny), yy = Math.max(y, ybot(z) + 0.005), q = m(z, yy); const p = q.p.clone().addScaledVector(q.n, 0.0016); return [p.x, p.y, p.z]; },
        (i, j) => { const z = lerp(z1, z0, (j + 0.5) / nz), y = lerp(y0, y1, (i + 0.5) / ny); return y > ybot(z) + 0.012; }, false,
        (i, j) => [sx > 0 ? j / nz : 1 - j / nz, i / ny]);
      add(g, mats.livery, "livery");
    }
  }
  // the wheel wells (half drums) and the floor
  for (const za of [zF, zR]) for (const s of [-1, 1]) {
    const well = new T.CylinderGeometry(AR - 0.015, AR - 0.015, 0.34, 40, 1, true, 0, Math.PI); well.rotateZ(Math.PI / 2); well.translate(s * 0.69, AY, za); add(well, mats.under, "wheel well");
    const disc = new T.CircleGeometry(AR - 0.015, 40, 0, Math.PI); disc.rotateY(s > 0 ? -Math.PI / 2 : Math.PI / 2); disc.translate(s * 0.52, AY, za); add(disc, mats.under, "wheel well");
  }
  { const pan = gridGeo(ZS.length, 9, (i, j) => { const z = ZS[i], x0 = sideX(z, ybot(z)) - 0.03, x = lerp(-x0, x0, j / 8); const p = W3(x, Math.abs(x) > 0.52 ? ybot(z) + 0.004 : ybase(z) + 0.004, z); return [p.x, p.y, p.z]; }, null, true); add(pan, mats.under, "floor pan"); }
  rbox(1.0, 0.1, 3.2, 0.02, mats.under, "chassis", [0, 0.3, -0.15]);
  { const g = new T.PlaneGeometry(1.5, 3.6); g.rotateX(-Math.PI / 2); g.translate(0, 0.5, -0.2); add(g, mats.carpet, "floor"); }
  // ================= the cabin (v3): stitched cream benches, the painted dash with one big dial, the thin bus wheel,
  // the interior mirror, the engine deck under its carpet
  { const st = dStitch(T, 7), seat = mats.seat.clone(); seat.map = st.map; seat.normalMap = st.normalMap; seat.normalScale = new T.Vector2(0.9, 0.9); const RB = ext.RoundedBoxGeometry;
    dSeat(T, group, RB, seat, { x: 0, y: 0.86, z: 0.95, w: 1.42, d: 0.42, h: 0.14, backH: 0.5, backT: 0.1, rake: 0.12, head: false, bolster: false });
    for (const z of [0.1, -0.85]) dSeat(T, group, RB, seat, { x: 0, y: 0.86, z, w: 1.4, d: 0.46, h: 0.14, backH: 0.48, backT: 0.1, rake: 0.12, head: false, bolster: false });
    rbox(1.5, 0.14, 0.26, 0.04, mats.paint, "dashboard", [0, 1.2, 1.62]);
    rbox(1.3, 0.02, 0.06, 0.008, mats.black, "dash rail", [0, 1.275, 1.52]);
    dGaugeMesh(T, group, dGauge(T, "speed", { face: "#141414" }), mats.chrome, { r: 0.068, at: [0.38, 1.205, 1.487] });
    rbox(0.2, 0.05, 0.02, 0.006, mats.chrome, "radio", [0, 1.19, 1.488]);
    for (const x of [-0.5, -0.2, 0.15]) { const g = new T.CylinderGeometry(0.008, 0.008, 0.016, 12); g.rotateX(Math.PI / 2); g.translate(x, 1.16, 1.484); add(g, mats.chrome, "dash knob"); }
    dSteering(T, group, { at: [0.38, 1.24, 1.38], tilt: 1.15, r: 0.22, tube: 0.011, spokes: 2, rimMat: mats.cream, spokeMat: mats.cream, hubMat: mats.black });
    rod([0.38, 1.22, 1.39], [0.38, 0.8, 1.62], 0.02, mats.black, "column");
    dInnerMirror(T, group, { at: [0, 1.68, 1.6], w: 0.18, h: 0.07, housing: mats.black, glass: mats.mirror, stem: 0.06, RB });
    { const g = new T.ConeGeometry(0.04, 0.06, 14); g.translate(0.0, 0.53, 1.3); add(g, mats.rubber, "gear boot"); rod([0, 0.53, 1.3], [0.02, 0.98, 1.18], 0.006, mats.satin, "gear lever"); const k = new T.SphereGeometry(0.022, 14, 10); k.translate(0.02, 0.99, 1.18); add(k, mats.black, "gear knob"); }
  }
  rbox(1.5, 0.3, 0.6, 0.03, mats.carpet, "engine deck", [0, 0.95, -1.95]);

  // ================= the wheels =================
  const wheels = [];
  for (const [sx, z] of [[1, zF], [-1, zF], [1, zR], [-1, zR]]) {
    // v3: a smaller, taller domed cap (the type's), five lug nuts showing round it, a fine lime pinstripe, drum brakes
    const w = buildWheel(T, mats, sx, { R: DIM.tyreR, W: 0.16, rr: DIM.rimR, style: "steel", rimMat: mats.cream, capMat: mats.chrome, capR: 0.066, capDome: 0.038, vents: 0, spec: "185 R 15 C", brake: { type: "drum", r: 0.15, w: 0.06, x: -0.03 } });
    const ring = new T.Mesh(new T.TorusGeometry(DIM.rimR * 0.66, 0.0045, 8, 64), mats.lime); ring.rotation.y = Math.PI / 2; ring.position.x = 0.16 * 0.22; ring.name = "rim ring"; w.add(ring);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2, g = new T.CylinderGeometry(0.009, 0.011, 0.016, 6); g.rotateZ(Math.PI / 2); const m = new T.Mesh(g, mats.chrome); m.name = "lug nut"; m.position.set(0.16 * 0.21, Math.cos(a) * 0.085, Math.sin(a) * 0.085); w.add(m); }
    w.position.set(sx * DIM.track / 2, DIM.tyreR, z); group.add(w); wheels.push(w);
  }
  // v3: road dust: the sills, the spray behind the wheels, the nose's lower half
  { const wh = [{ z: zF, r: DIM.tyreR }, { z: zR, r: DIM.tyreR }]; dDust(T, group, { mats: [mats.paint, mats.lime, mats.limeNose, mats.livery], top: 0.72, amount: 0.5, color: "#8e8273", wheels: wh, seed: 31 }); }
  const body = new T.Group(); body.name = "body";
  for (const c of group.children.slice()) if (c.name !== "wheel") body.add(c);
  group.add(body);
  return { group, body, wheels, mats, tex, parts: {}, DIM };
}

// the flanks' livery (the map's: two waves, orange and lime, black keylines, three flowers), on a transparent canvas
function sideTex(T, tex) {
  const ORANGE = "#F65342", LIME = "#7CC94F", YEL = "#FED012", INK = "#1c1c1c";
  return tex.colour(tex.cv(2048, 320, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); const sx = w / 512, sy = h / 176; ctx.scale(sx, sy);
    const wave = (lw, col, a) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(...a[0]); ctx.bezierCurveTo(...a[1]); if (a[2]) ctx.bezierCurveTo(...a[2]); ctx.stroke(); };
    const A = [[12, 70], [120, 22, 200, 118, 300, 66], [370, 30, 420, 74, 500, 50]], B = [[12, 112], [140, 74, 240, 150, 360, 102]];
    wave(34, INK, A); wave(25, ORANGE, A); wave(17, INK, B); wave(10, LIME, B);
    const flower = (cx, cy, s, petal, core) => { for (const pass of ["line", "fill"]) for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s, cy + Math.sin(a) * s, s * 0.62, 0, Math.PI * 2); if (pass === "line") { ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke(); } else { ctx.fillStyle = petal; ctx.fill(); } } ctx.beginPath(); ctx.arc(cx, cy, s * 0.7, 0, Math.PI * 2); ctx.fillStyle = core; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); };
    flower(232, 128, 20, ORANGE, YEL); flower(392, 108, 14, YEL, ORANGE); flower(300, 42, 10, LIME, ORANGE);
  }));
}
function flowerTex(T, tex) {
  const ORANGE = "#F65342", LIME = "#7CC94F", YEL = "#FED012", INK = "#1c1c1c";
  return tex.colour(tex.cv(512, 512, (ctx) => {
    ctx.fillStyle = LIME; ctx.fillRect(0, 0, 512, 512); ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(256, 256, 246, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; ctx.beginPath(); ctx.arc(256 + Math.cos(a) * 92, 256 + Math.sin(a) * 92, 62, 0, Math.PI * 2); ctx.fillStyle = ORANGE; ctx.fill(); ctx.lineWidth = 10; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(256, 256, 66, 0, Math.PI * 2); ctx.fillStyle = YEL; ctx.fill(); ctx.lineWidth = 10; ctx.stroke();
  }));
}
