// Cromatic · hero vehicles (Radu): the Chrome racer, a vintage two-seat roadster of the early 1930s type, polished
// chrome, an original design (the map's "monopoly" ride, a nod to the general idea of a chrome toy car and nothing more:
// no token's shape, no maker's radiator or mascot). A long louvred bonnet behind an upright radiator, big bowl headlamps
// on a cross bar, cycle wings flowing into running boards, a cut-down cockpit with a padded roll and a raked screen, a
// rounded tail carrying the spare upright, wire wheels with whitewalls, three exhaust pipes into a flexible pipe.
// Metres; origin on the ground under the middle of the wheelbase, +z forward, +y up, +x the car's left.
//   buildChromeRacer(THREE, { RoundedBoxGeometry, allChrome }) -> { group, body, wheels, mats, tex, parts, DIM }
//   allChrome: the tyres and the seat in chrome too, as on the map's ride (default: black tyres, red leather)
// Proportions of the type (a 1930s sports two-seater): length 3.95, width 1.62 over the wings, height 1.30 over the
// screen (0.99 at the scuttle), wheelbase 2.60, track 1.36, 5.25-18 tyres on wire wheels (0.71 m across).
import { pchip, clamp, lerp, sstep, makeTex, baseMats, makeKit, buildWheel } from "./kit.js";

export const DIM = { L: 3.95, W: 1.62, H: 1.3, WB: 2.6, track: 1.36, zF: 1.3, zR: -1.3, tyreR: 0.355, rimR: 0.229 };

export function buildChromeRacer(T, ext = {}) {
  const { zF, zR } = DIM;
  const group = new T.Group(); group.name = "hero-chrome-racer";
  const K = makeKit(T, group); K.setRB(ext.RoundedBoxGeometry);
  const { V3, add, sweep, roundProf, rod, tube, latheZ, rrShape, rbox, gridGeo, ribbon } = K;
  const tex = makeTex(T), mats = baseMats(T, tex);
  Object.assign(mats, {
    body: new T.MeshPhysicalMaterial({ name: "chrome", color: new T.Color("#f4f5f7"), roughness: 0.05, metalness: 1, side: T.DoubleSide }),
    reflector: new T.MeshPhysicalMaterial({ name: "reflector", color: new T.Color("#e9e9ea"), roughness: 0.16, metalness: 1, side: T.DoubleSide }),
    leather: new T.MeshPhysicalMaterial({ name: "red leather", color: new T.Color("#6e1a14"), roughness: 0.48, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.4, side: T.DoubleSide }),
    white: new T.MeshPhysicalMaterial({ name: "whitewall", color: new T.Color("#f1efe8"), roughness: 0.7, metalness: 0 }),
    dial: new T.MeshPhysicalMaterial({ name: "dial", color: new T.Color("#f2ead8"), roughness: 0.3, metalness: 0, clearcoat: 1 })
  });
  mats.chrome = mats.body;
  if (ext.allChrome) { mats.tyre = mats.tread = mats.leather = mats.white = mats.body; }

  // ================= the body: one loft of superelliptic sections from the tail to the radiator =================
  const Z0 = -1.66, Z1 = 1.58;
  const W = pchip([[Z0, 0.1], [-1.6, 0.25], [-1.45, 0.36], [-1.1, 0.44], [-0.7, 0.47], [0.2, 0.47], [0.55, 0.415], [0.9, 0.37], [Z1, 0.32]]);
  const YT = pchip([[Z0, 0.74], [-1.56, 0.85], [-1.3, 0.91], [-0.8, 0.935], [0.3, 0.95], [0.55, 0.99], [0.9, 0.995], [Z1, 0.985]]);
  const YB = pchip([[Z0, 0.64], [-1.56, 0.53], [-1.3, 0.48], [Z1, 0.48]]);
  const NX = (z) => lerp(2.6, 3.4, sstep(-1.6, -1.0, z));
  const NC = 28; // columns per half (bottom middle -> top middle)
  const secPt = (z, th) => { // th in [-pi/2 (bottom), pi/2 (top)], x >= 0
    const n = NX(z), c = Math.cos(th), s = Math.sin(th), yc = (YT(z) + YB(z)) / 2, h = (YT(z) - YB(z)) / 2;
    return [W(z) * Math.pow(Math.abs(c), 2 / n), yc + h * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)];
  };
  const TH = Array.from({ length: NC + 1 }, (_, j) => -Math.PI / 2 + (j / NC) * Math.PI);
  const ZS = (() => { const s = new Set(); for (let z = Z0; z <= Z1 + 1e-9; z += 0.025) s.add(+z.toFixed(5)); for (let d = 0; d <= 0.12; d += 0.008) s.add(+(Z0 + d).toFixed(5)); for (const z of [-0.72, 0.42, 0.55]) s.add(z); s.add(Z1); return [...s].sort((a, b) => a - b); })();
  const CK = { z0: -0.72, z1: 0.42, th: 1.02 }; // the cockpit opening: rows z0..z1, the columns above th
  const cut = (i, j) => { const zm = (ZS[i] + ZS[i + 1]) / 2, tm = (TH[j] + TH[j + 1]) / 2; return zm > CK.z0 && zm < CK.z1 && tm > CK.th; };
  for (const sx of [1, -1]) {
    const P = (i, j) => { const [x, y] = secPt(ZS[i], TH[j]); return [sx * x, y, ZS[i]]; };
    add(gridGeo(ZS.length, NC + 1, P, (i, j) => !cut(i, j), sx > 0), mats.body, "body");
    // the cockpit's inside: the same skin 2 cm in, leather
    const Pi = (i, j) => { const [x, y] = secPt(ZS[i], TH[j]); return [sx * (x - 0.02), y - 0.004, ZS[i]]; };
    add(gridGeo(ZS.length, NC + 1, Pi, (i, j) => { const zm = (ZS[i] + ZS[i + 1]) / 2; return zm > CK.z0 && zm < CK.z1 && (TH[j] + TH[j + 1]) / 2 > -0.4 && (TH[j] + TH[j + 1]) / 2 < CK.th; }, sx < 0), mats.leather, "cockpit trim");
  }
  // the tail's tip and the cockpit's front and back walls
  { const n = 24, pos = [0, (YT(Z0) + YB(Z0)) / 2, Z0 - 0.004], idx = []; for (let k = 0; k <= n; k++) { const th = -Math.PI / 2 + (k / n) * Math.PI * 2, [x, y] = secPt(Z0, Math.abs(((th + Math.PI / 2) % (2 * Math.PI)) - Math.PI) - Math.PI / 2); pos.push(k / n > 0.5 ? -x : x, y, Z0); if (k) idx.push(0, k + 1, k); } const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); add(g, mats.body, "tail tip"); }
  for (const z of [CK.z0, CK.z1]) { const sh = new T.Shape(); const pts = []; for (let j = 0; j <= NC; j++) { const [x, y] = secPt(z, TH[j]); if (TH[j] > -0.4) pts.push([x - 0.02, y]); } sh.moveTo(-pts[0][0], 0.5); for (const [x, y] of pts) sh.lineTo(x, Math.max(y, 0.5)); for (const [x, y] of pts.slice().reverse()) sh.lineTo(-x, Math.max(y, 0.5)); const g = new T.ShapeGeometry(sh, 4); g.translate(0, 0, z); add(g, mats.leather, "cockpit wall"); }
  { const g = new T.PlaneGeometry(0.88, CK.z1 - CK.z0); g.rotateX(-Math.PI / 2); g.translate(0, 0.52, (CK.z0 + CK.z1) / 2); add(g, mats.carpet, "floor"); }
  // skin queries: the point and normal at (z, th) on the left (+x) or right side
  const skin = (sx, z, th) => { const e = 0.002, p = V3(...((q) => [sx * q[0], q[1], z])(secPt(z, th))), a = V3(...((q) => [sx * q[0], q[1], z + e])(secPt(z + e, th))).sub(V3(...((q) => [sx * q[0], q[1], z - e])(secPt(z - e, th)))), b = V3(...((q) => [sx * q[0], q[1], z])(secPt(z, th + e))).sub(V3(...((q) => [sx * q[0], q[1], z])(secPt(z, th - e)))); const n = new T.Vector3().crossVectors(a, b).normalize(); if (n.x * sx + (n.y * (p.y - 0.7)) < 0) n.negate(); return { p, n }; };
  // the padded roll round the cockpit's opening
  { const pts = []; const thc = CK.th + 0.02; for (let k = 0; k <= 20; k++) { const z = lerp(CK.z1, CK.z0, k / 20); pts.push(skin(1, z, thc).p); }
    { const [x, y] = secPt(CK.z0, thc); for (let k = 1; k < 12; k++) { const t = k / 12; pts.push(V3(lerp(x, -x, t), y + 0.03 * Math.sin(t * Math.PI) + (YT(CK.z0) - y) * Math.sin(t * Math.PI) * 0.8, CK.z0 - 0.02 * Math.sin(t * Math.PI))); } }
    for (let k = 0; k <= 20; k++) { const z = lerp(CK.z0, CK.z1, k / 20); pts.push(skin(-1, z, thc).p); }
    { const [x, y] = secPt(CK.z1, thc); for (let k = 1; k < 12; k++) { const t = k / 12; pts.push(V3(lerp(-x, x, t), y + (YT(CK.z1) - y) * Math.sin(t * Math.PI) * 0.8, CK.z1)); } }
    tube(pts, 0.026, mats.leather, "cockpit roll", { seg: 160, closed: true }); }
  // the bonnet: its back seam at the scuttle, the hinge along the top, louvres down both sides
  const GAP = 0.004;
  for (const sx of [1, -1]) {
    ribbon(Array.from({ length: 30 }, (_, k) => skin(sx, 0.56, lerp(-1.2, 1.5, k / 29))), GAP, 0.001, mats.gap, "bonnet seam");
    ribbon(Array.from({ length: 30 }, (_, k) => skin(sx, lerp(0.58, 1.56, k / 29), 0.62)), GAP, 0.001, mats.gap, "bonnet seam");
    for (let k = 0; k < 14; k++) { const z = 0.74 + k * 0.055; ribbon(Array.from({ length: 8 }, (_, i) => skin(sx, z, lerp(-0.55, 0.35, i / 7))), 0.012, 0.0012, mats.gap, "louvre"); }
  }
  { const pts = []; for (let k = 0; k <= 30; k++) { const z = lerp(0.58, Z1, k / 30); pts.push(V3(0, YT(z) + 0.004, z)); } tube(pts, 0.008, mats.satin, "bonnet hinge", { seg: 30 }); }
  // the scuttle's cross band
  { const pts = Array.from({ length: 40 }, (_, k) => { const th = lerp(-1.2, Math.PI - (-1.2), k / 39); return th <= Math.PI / 2 ? skin(1, 0.54, th) : skin(-1, 0.54, Math.PI - th); }); ribbon(pts, 0.03, 0.002, mats.satin, "scuttle band"); }

  // ================= the radiator: an upright shell with a rounded top, vertical slats, a cap =================
  const RZ = 1.6;
  const radShape = (w, h, r) => { const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - r); s.quadraticCurveTo(w / 2, h, w / 2 - r, h); s.lineTo(-w / 2 + r, h); s.quadraticCurveTo(-w / 2, h, -w / 2, h - r); s.closePath(); return s; };
  { const s = radShape(0.6, 0.6, 0.2); s.holes.push(new T.Path(radShape(0.5, 0.53, 0.16).getPoints(16).map((v) => new T.Vector2(v.x, v.y + 0.035)))); const g = new T.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 5, curveSegments: 16 }); g.translate(0, 0.43, RZ - 0.05); add(g, mats.body, "radiator shell"); }
  { const g = new T.ShapeGeometry(radShape(0.5, 0.53, 0.16), 12); g.translate(0, 0.465, RZ + 0.0); add(g, mats.black, "radiator core"); }
  for (let k = -11; k <= 11; k++) { const x = k * 0.02, hTop = 0.53 - (Math.abs(x) > 0.09 ? 0.16 - Math.sqrt(Math.max(0, 0.16 ** 2 - (Math.abs(x) - 0.09) ** 2)) : 0); const g = new T.BoxGeometry(0.007, hTop - 0.02, 0.03); g.translate(x, 0.465 + (hTop) / 2, RZ + 0.02); add(g, mats.body, "radiator slat"); }
  latheZ([[0, 0.05], [0.03, 0.05], [0.035, 0.03], [0.028, 0.0], [0.02, -0.02], [0, -0.02]], mats.body, "radiator cap").position.set(0, 1.05, RZ + 0.02);
  group.children[group.children.length - 1].rotation.x = -Math.PI / 2;
  // the front: dumb irons, the axle beam on its leaf springs, the bumper bar, the headlamps on their cross bar
  for (const s of [-1, 1]) {
    rbox(0.06, 0.1, 0.5, 0.015, mats.darkMetal, "dumb iron", [s * 0.36, 0.4, 1.55]);
    rbox(0.06, 0.035, 0.9, 0.01, mats.darkMetal, "leaf spring", [s * 0.4, 0.31, zF]);
    rbox(0.08, 0.1, 3.0, 0.015, mats.darkMetal, "frame rail", [s * 0.36, 0.42, -0.05]);
    rbox(0.06, 0.035, 0.95, 0.01, mats.darkMetal, "leaf spring", [s * 0.42, 0.34, zR]);
  }
  rod([-0.62, 0.32, zF], [0.62, 0.32, zF], 0.03, mats.darkMetal, "axle beam");
  rod([-0.62, 0.355, zR], [0.62, 0.355, zR], 0.05, mats.darkMetal, "axle");
  { const g = new T.SphereGeometry(0.11, 24, 16); g.scale(1, 0.8, 1); g.translate(0, 0.355, zR); add(g, mats.darkMetal, "differential"); }
  for (const y of [0.37, 0.43]) tube([[-0.72, y, 1.8], [-0.4, y, 1.86], [0.4, y, 1.86], [0.72, y, 1.8]], 0.022, mats.body, "bumper bar", { seg: 40 });
  for (const s of [-1, 1]) rod([s * 0.38, 0.4, 1.7], [s * 0.38, 0.4, 1.85], 0.018, mats.body, "bumper iron");
  tube([[-0.62, 0.74, 1.47], [0, 0.74, 1.5], [0.62, 0.74, 1.47]], 0.016, mats.body, "lamp bar", { seg: 30 });
  const lamps = [];
  for (const s of [-1, 1]) {
    const L = new T.Group(); L.name = "headlamp"; group.add(L); L.position.set(s * 0.5, 0.92, 1.56);
    latheZ([[0.0, -0.17], [0.06, -0.165], [0.11, -0.14], [0.14, -0.09], [0.152, -0.03], [0.155, 0.0], [0.165, 0.008], [0.165, 0.03], [0.148, 0.035]], mats.body, "headlamp shell", { parent: L });
    latheZ(Array.from({ length: 17 }, (_, k) => { const t = k / 16; return [0.14 * Math.sqrt(t) + 0.0005, -0.12 + 0.12 * t]; }), mats.reflector, "reflector", { parent: L });
    { const g = new T.SphereGeometry(0.012, 16, 12); g.translate(0, 0, -0.07); K.add(g, mats.bulb, "bulb", L); }
    { const g = new T.CircleGeometry(0.146, 48); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 0.146, y = p.getY(i) / 0.146; p.setZ(i, 0.022 * Math.max(0, 1 - x * x - y * y)); uv.setXY(i, x * 0.5 + 0.5, y * 0.5 + 0.5); } g.computeVertexNormals(); g.translate(0, 0, 0.012); K.add(g, mats.lens, "headlamp lens", L); }
    rod([s * 0.5, 0.76, 1.5], [s * 0.5, 0.86, 1.5], 0.02, mats.body, "lamp stem");
    lamps.push(L);
  }

  // ================= the wings and the running boards: one sweep each side =================
  for (const s of [-1, 1]) {
    const x = s * 0.68, Rw = DIM.tyreR + 0.07, path = [];
    const arcF = (a0, a1, n, zc, yc) => { for (let k = 0; k <= n; k++) { const a = lerp(a0, a1, k / n); path.push([zc + Math.cos(a) * Rw, yc + Math.sin(a) * Rw]); } };
    arcF(0.18, Math.PI - 0.05, 30, zF, DIM.tyreR); // over the front wheel, from its front low down to its back
    path.push([zF - Rw - 0.05, 0.47], [zF - Rw - 0.16, 0.425], [0.62, 0.41]);
    for (let k = 1; k <= 10; k++) path.push([lerp(0.62, -0.75, k / 10), 0.405]);
    path.push([zR + Rw + 0.12, 0.43], [zR + Rw + 0.03, 0.5]);
    arcF(0.12, Math.PI - 0.16, 28, zR, DIM.tyreR); path.reverse();
    // (path from the rear wing's tail forward); resample smooth
    const curve = new T.CatmullRomCurve3(path.map(([z, y]) => V3(x, y, z)), false, "centripetal"), N = 220, pts = curve.getSpacedPoints(N);
    const P = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)], t = b.clone().sub(a).normalize(); let n = V3(0, t.z, -t.y); if (n.y < 0) n.negate(); return { p, n }; });
    const hw = (i) => { const z = pts[i].z; return z > 0.65 || z < -0.78 ? 0.1 : 0.12; };
    // the wing's section: a crowned shell 0.2 wide with a rolled edge (u along n, v across)
    const prof = []; for (let k = 0; k <= 16; k++) { const v = lerp(-1, 1, k / 16); prof.push([0.035 * (1 - v * v) + 0.004, v * 0.105]); } for (let k = 16; k >= 0; k--) { const v = lerp(-1, 1, k / 16); prof.push([0.035 * (1 - v * v) - 0.004, v * 0.1]); }
    void hw; sweep(P, prof, mats.body, "wing", { closed: true });
    // the running board's black ribbed rubber
    { const bp = P.filter(({ p }) => p.z < 0.6 && p.z > -0.73); ribbon(bp.map(({ p, n }) => ({ p: p.clone().add(V3(0, 0.04, 0)), n })), 0.17, 0, mats.rubber, "running board mat"); }
    for (const z of [0.5, -0.6]) rod([s * 0.4, 0.42, z], [x, 0.41, z], 0.015, mats.darkMetal, "wing stay");
    rod([s * 0.36, 0.45, zF + 0.05], [x * 0.98, 0.62, zF + 0.32], 0.012, mats.body, "wing stay");
  }

  // ================= the screen, the cockpit, the tail =================
  { // a raked flat screen in a chrome frame on two posts
    const zs = 0.45, y0 = 1.0, h = 0.3, w = 0.86, rk = 0.22;
    const fr = new T.Group(); fr.name = "screen"; group.add(fr); fr.position.set(0, y0, zs); fr.rotation.x = -rk;
    const g = new T.ShapeGeometry(rrShape(w, h, 0.03), 6); g.translate(0, h / 2, 0); K.add(g, mats.glass, "glass", fr);
    const pts = rrShape(w + 0.02, h + 0.02, 0.035).getSpacedPoints(80).map((v) => V3(v.x, v.y + h / 2, 0)); tube(pts, 0.009, mats.body, "screen frame", { seg: 120, closed: true, parent: fr });
    for (const s of [-1, 1]) rod([s * (w / 2 + 0.01), 0.96, zs + 0.02], [s * (w / 2 + 0.01), 1.12, zs - 0.03], 0.013, mats.body, "screen post");
  }
  rbox(0.84, 0.12, 0.42, 0.05, mats.leather, "seat", [0, 0.62, -0.42]);
  rbox(0.84, 0.36, 0.12, 0.05, mats.leather, "seat back", [0, 0.82, -0.64], [-0.18, 0, 0]);
  rbox(0.86, 0.14, 0.06, 0.02, mats.wood, "dashboard", [0, 0.9, 0.38]);
  for (const [x, r] of [[-0.12, 0.035], [0.0, 0.045], [0.12, 0.035], [-0.26, 0.025]]) { const g = new T.CircleGeometry(r, 32); g.translate(x, 0.9, 0.346); add(g, mats.dial, "dial"); const rg = new T.TorusGeometry(r, 0.005, 8, 32); rg.translate(x, 0.9, 0.346); add(rg, mats.body, "dial rim"); }
  { const sw = new T.Group(); sw.name = "steering wheel"; group.add(sw); sw.position.set(0.22, 0.98, 0.18); sw.rotation.x = -0.75;
    K.add(new T.TorusGeometry(0.19, 0.011, 12, 64), mats.black, "steering rim", sw);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; const b = new T.BoxGeometry(0.008, 0.18, 0.004); b.translate(0, 0.09, 0); const m = K.add(b, mats.satin, "steering spoke", sw); m.rotation.z = a; }
    rod([0.22, 0.98, 0.18], [0.22, 0.72, 0.6], 0.016, mats.satin, "column"); }
  // the spare, upright on the tail, its strap
  { const sp = buildWheel(T, mats, 1, { R: DIM.tyreR, W: 0.13, rr: DIM.rimR, style: "wire", rimMat: mats.body, capMat: mats.body, whitewall: true, whitewallMat: mats.white, spokes: 40 });
    sp.name = "spare wheel"; sp.rotation.y = -Math.PI / 2; sp.position.set(0, 0.62, -1.82); group.add(sp);
    rbox(0.06, 0.06, 0.16, 0.01, mats.darkMetal, "spare carrier", [0, 0.62, -1.71]); }
  // a small round tail lamp and the plate on the left of the spare
  { const g = new T.CylinderGeometry(0.035, 0.035, 0.03, 24); g.rotateX(Math.PI / 2); g.translate(0.32, 0.6, -1.5); add(g, mats.body, "tail lamp body"); const l = new T.CircleGeometry(0.03, 24); l.rotateY(Math.PI); l.translate(0.32, 0.6, -1.516); add(l, mats.red, "tail lamp"); }
  // the exhaust: three pipes out of the bonnet's right side into a flexible pipe along the running board
  for (let k = 0; k < 3; k++) { const z = 1.12 - k * 0.15; tube([[-0.36, 0.72, z], [-0.46, 0.68, z - 0.02], [-0.54, 0.56, z - 0.1], [-0.58, 0.5, z - 0.2], [-0.58, 0.49, 0.62]], 0.022, mats.body, "exhaust pipe", { seg: 40, rs: 14 }); }
  { const pts = []; for (let k = 0; k <= 60; k++) pts.push(V3(-0.58, 0.49, lerp(0.62, -1.15, k / 60))); const g = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 240, 0.032, 16, false); const p = g.attributes.position; // the flexible pipe's rings
    for (let i = 0; i < p.count; i++) { const u = Math.floor(i / 17) / 240, cz = lerp(0.62, -1.15, u), ring = 1 + 0.12 * Math.max(0, Math.sin(u * 240 * Math.PI * 0.5)); const dx = p.getX(i) + 0.58, dy = p.getY(i) - 0.49; p.setXYZ(i, -0.58 + dx * ring, 0.49 + dy * ring, p.getZ(i)); void cz; } g.computeVertexNormals(); add(g, mats.body, "flexible exhaust"); }
  { const g = new T.CylinderGeometry(0.034, 0.03, 0.12, 20, 1, true); g.rotateX(Math.PI / 2); g.translate(-0.58, 0.49, -1.2); add(g, mats.body, "tail pipe"); }

  // ================= the wheels =================
  const wheels = [];
  for (const [sx, z] of [[1, zF], [-1, zF], [1, zR], [-1, zR]]) {
    const w = buildWheel(T, mats, sx, { R: DIM.tyreR, W: 0.135, rr: DIM.rimR, style: "wire", rimMat: mats.body, capMat: mats.body, whitewall: true, whitewallMat: mats.white, spokes: 48 });
    w.position.set(sx * DIM.track / 2, DIM.tyreR, z); group.add(w); wheels.push(w);
  }
  const body = new T.Group(); body.name = "body";
  for (const c of group.children.slice()) if (c.name !== "wheel") body.add(c);
  group.add(body);
  return { group, body, wheels, mats, tex, parts: { headlamps: lamps }, DIM };
}
