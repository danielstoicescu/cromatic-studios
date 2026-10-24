// Cromatic · hero vehicles (Radu): the Yellow submarine, the Underwater world's ride ("sub" on the map), at the hero
// detail level. An original two-seat tourist mini-sub in the map's colours: a yellow riveted hull (lapped plates in
// rings and strakes, double rivet rows on the ring seams), the red belt strap round the middle, four portholes a side
// (brass flanges, bolts, rubber gaskets, thick glass, the dim cabin behind), the conning tower with its navy cap, the
// hatch (handwheel, hinge, dogs), the periscope (its own part), two small viewports, nav lights, grab rails and rungs;
// navy dive planes at the bow and stern (both movable), the upper fin with its rudder, a navy keel skid, the bow
// headlamp (brass bezel, chrome reflector, fluted lens, guard bars), a four-blade screw (its own part, spins) in a navy
// duct on four struts, zinc anodes, lifting eyes, vent grilles, limber holes, white draft marks; wear (chipped plate
// edges, grime in the seams, rust bleeding from rivets, a sun-faded top) and algae with a scum line at the waterline.
// Metres. The group's origin is on the ground under the hull's centre; body is the hull's frame: its origin (the pivot)
// IS the hull's centre (on the axis, mid length), DIM.hullY above the ground; +z forward (the bow), +y up, +x the left.
//   buildSubmarine(THREE, { RoundedBoxGeometry }) -> { group, body, wheels: [], mats, tex, parts, DIM, setLamps }
//   parts.propeller  spin with rotation.z (its origin is on the shaft)
//   parts.periscope  rotation.y sweeps it (its origin: the base, on the tower's top); position.y raises it
//   parts.bowPlanes, parts.sternPlanes  rotation.x pitches them (hinge lines across x); parts.rudder  rotation.y
//   parts.lamp       the headlamp group; setLamps(k) lights the headlamp, the nav lights and the cabin glow (0..1)
// Proportions after the map's model (1 m = 17 map units): hull 5.21 long x 1.60 across, 5.81 overall with the lamp and
// the duct, the red belt 0.30 ahead of the middle, the tower 1.44 x 0.72 rising to 1.47 over the axis, the periscope
// to 2.16, stern planes 1.76 across, bow planes 2.0, the screw 0.86 in a 1.07 duct.
import { pchip, clamp, lerp, sstep, makeTex, baseMats, makeKit, dNoise3, dNoise2 } from "./kit.js";

export const DIM = { L: 5.81, hullL: 5.21, D: 1.6, hullY: 1.18, span: 2.0, sternSpan: 1.76, prop: 0.86, duct: 1.07, towerTop: 1.47, periTop: 2.16, H: 3.34, WL: -0.03, zProp: -2.94 };

export function buildSubmarine(T, ext = {}) {
  const group = new T.Group(); group.name = "hero-submarine";
  const body = new T.Group(); body.name = "body"; body.position.y = DIM.hullY; group.add(body);
  const K = makeKit(T, body); K.setRB(ext.RoundedBoxGeometry);
  const { V3, add, rod, tube, latheZ, latheX, rbox, wingPanel, sweep } = K;
  const tex = makeTex(T), mats = baseMats(T, tex);
  const P = (o) => new T.MeshPhysicalMaterial(o);
  const YEL = "#FED012", RED = "#F65342", NAVY = "#1b2a52", WL = DIM.WL;

  // ================= the hull's profile: a stern taper (monotone), a short parallel middle, an elliptic bow =================
  const ZS = -2.58, RM = 0.8, ZB = 0.9, LB = 1.78, RN = 0.18, ZN = ZB + LB * Math.sqrt(1 - (RN / RM) ** 2);
  const rStern = pchip([[ZS, 0.13], [-2.35, 0.27], [-2.0, 0.46], [-1.5, 0.65], [-1.0, 0.76], [-0.5, 0.796], [0, 0.8], [0.3, 0.8]]);
  const rHull = (z) => (z < 0 ? rStern(Math.max(z, ZS)) : z <= ZB ? RM : RM * Math.sqrt(Math.max(0, 1 - ((Math.min(z, ZN) - ZB) / LB) ** 2)));
  const dHull = (z, off = () => 0) => { const e = 1e-3, a = Math.max(ZS, z - e), b = Math.min(ZN, z + e); return (rHull(b) + off(b) - rHull(a) - off(a)) / (b - a); };
  // arc length along the profile (the skin's v), both ways
  const NT = 4000, zt = new Float64Array(NT + 1), st = new Float64Array(NT + 1);
  for (let i = 0; i <= NT; i++) { zt[i] = lerp(ZS, ZN, i / NT); if (i) st[i] = st[i - 1] + Math.hypot(zt[i] - zt[i - 1], rHull(zt[i]) - rHull(zt[i - 1])); }
  const S = st[NT];
  const sOf = (z) => { const f = clamp((z - ZS) / (ZN - ZS), 0, 1) * NT, i = Math.min(NT - 1, Math.floor(f)); return lerp(st[i], st[i + 1], f - i); };
  const zOf = (s) => { let lo = 0, hi = NT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (st[m] < s) lo = m; else hi = m; } return lerp(zt[lo], zt[hi], (s - st[lo]) / Math.max(1e-9, st[hi] - st[lo])); };
  // a point on the skin: a round the axis from the top (towards +x), lifted along the normal; a right-handed frame
  // X (round), Y (along, roughly +z), Z (the normal) for parts seated on it
  const onHull = (z, a, lift = 0) => {
    const R = rHull(z), dR = dHull(z), sa = Math.sin(a), ca = Math.cos(a);
    const n = V3(sa, ca, -dR).normalize(), X = V3(ca, -sa, 0), Y = new T.Vector3().crossVectors(n, X);
    return { p: V3(R * sa, R * ca, z).addScaledVector(n, lift), n, X, Y };
  };
  const seat = (obj, f) => { const M = new T.Matrix4().makeBasis(f.X, f.Y, f.n); obj.quaternion.setFromRotationMatrix(M); obj.position.copy(f.p); return obj; };
  // a skin of revolution between zA and zB (rows uniform in arc length), radius rHull + off(z), analytic normals, the
  // hull's uv (u round from the top, v = s / S): the belt strap shares the hull's texture this way
  function skinGeo(zA, zB, rows, cols, off = () => 0) {
    const sA = sOf(zA), sB = sOf(zB), pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i <= rows; i++) {
      const s = lerp(sA, sB, i / rows), z = zOf(s), R = rHull(z) + off(z), dR = dHull(z, off);
      for (let j = 0; j <= cols; j++) { const a = (j / cols) * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a), l = Math.hypot(1, dR); pos.push(R * sa, R * ca, z); nor.push(sa / l, ca / l, -dR / l); uv.push(j / cols, s / S); }
    }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    return orient(g);
  }
  // turn every triangle to face its vertex normals (the majority decides)
  function orient(g) {
    const p = g.attributes.position, n = g.attributes.normal, ia = g.index.array; let dot = 0; const A = V3(0, 0, 0), B = V3(0, 0, 0), C = V3(0, 0, 0), F = V3(0, 0, 0);
    for (let i = 0; i < ia.length; i += 3) { A.fromBufferAttribute(p, ia[i]); B.fromBufferAttribute(p, ia[i + 1]).sub(A); C.fromBufferAttribute(p, ia[i + 2]).sub(A); F.crossVectors(B, C); dot += F.x * n.getX(ia[i]) + F.y * n.getY(ia[i]) + F.z * n.getZ(ia[i]); }
    if (dot < 0) for (let i = 0; i < ia.length; i += 3) { const t = ia[i]; ia[i] = ia[i + 1]; ia[i + 1] = t; }
    return g;
  }
  // merge many small geometries (positions + normals) into one
  function merge(list) {
    const pos = [], nor = [], idx = []; let off = 0;
    for (let g of list) { if (!g.index) { const n = g.attributes.position.count; g.setIndex([...Array(n).keys()]); } if (!g.attributes.normal) g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); } for (const i of g.index.array) idx.push(i + off); off += p.count; g.dispose(); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
  }
  const placed = (geo, f) => { const M = new T.Matrix4().makeBasis(f.X, f.Y, f.n).setPosition(f.p); return geo.applyMatrix4(M); };

  // ================= materials =================
  const skinT = hullTexture(T, tex, { S, sOf, zOf, rHull, WL });
  const towerT = towerTexture(T, tex);
  const grime = grimeTexture(T, tex), patina = patinaTexture(T, tex);
  const skinMat = (name, t, bump) => P({ name, color: new T.Color("#ffffff"), map: t.map, bumpMap: t.bump, bumpScale: bump, roughnessMap: t.rmc, metalnessMap: t.rmc, clearcoatMap: t.rmc, roughness: 1, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.12, side: T.DoubleSide });
  Object.assign(mats, {
    hull: skinMat("paint", skinT, 1.6),
    tower: skinMat("paint", towerT, 1.6),
    paint: P({ name: "paint", color: new T.Color(YEL), roughness: 0.36, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.14, side: T.DoubleSide }),
    navy: P({ name: "paint navy", color: new T.Color("#ffffff"), map: grime.map, roughnessMap: grime.rmc, clearcoatMap: grime.rmc, roughness: 1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.16, side: T.DoubleSide }),
    brass: P({ name: "brass", color: new T.Color("#d6ad55"), map: patina.map, roughnessMap: patina.rough, roughness: 1, metalness: 1, side: T.DoubleSide }),
    portGlass: P({ name: "glass", color: new T.Color("#dff4f7"), roughness: 0.02, metalness: 0, transmission: 1, ior: 1.5, thickness: 0.03, transparent: true, side: T.DoubleSide }),
    cabin: (() => { const c = tex.cv(128, 128, (x) => { const g = x.createRadialGradient(54, 50, 4, 64, 64, 66); g.addColorStop(0, "#9fdcec"); g.addColorStop(0.45, "#3d8fa8"); g.addColorStop(1, "#06141b"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }), t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
      return P({ name: "porthole interior", color: new T.Color("#16323d"), roughness: 0.6, metalness: 0, emissive: new T.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 0.3 }); })(),
    lampGlow: P({ name: "bulb", color: new T.Color("#fffbe8"), roughness: 0.05, metalness: 0, emissive: new T.Color("#fff3d0"), emissiveIntensity: 0 }),
    navGreen: P({ name: "nav green", color: new T.Color("#1f9a4c"), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, normalMap: tex.prisms, normalScale: new T.Vector2(0.35, 0.35), emissive: new T.Color("#38ff7a"), emissiveIntensity: 0 }),
    navRed: P({ name: "tail red", color: new T.Color("#a8120c"), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, normalMap: tex.prisms, normalScale: new T.Vector2(0.35, 0.35), emissive: new T.Color("#ff3020"), emissiveIntensity: 0 }),
    zinc: P({ name: "zinc anode", color: new T.Color("#9ea4a7"), roughness: 0.72, metalness: 0.55 }),
    scope: P({ name: "black trim", color: new T.Color("#141517"), roughness: 0.32, metalness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12 })
  });
  for (const t of [grime.map, grime.rmc]) t.repeat.set(2, 2);

  // ================= the hull, the belt strap =================
  add(skinGeo(ZS, ZN, 320, 192), mats.hull, "hull");
  const BZ0 = 0.237, BZ1 = 0.373, beltOff = (z) => 0.012 * Math.sqrt(Math.min(sstep(BZ0, BZ0 + 0.01, z), sstep(BZ1, BZ1 - 0.01, z)));
  add(skinGeo(BZ0, BZ1, 28, 192, beltOff), mats.hull, "belt strap");
  // the keel skid along the bottom
  { const path = []; for (let z = -1.95; z <= 1.951; z += 0.05) { const f = onHull(z, Math.PI); path.push({ p: f.p, n: f.n }); }
    sweep(path, [[-0.02, -0.035], [0.045, -0.035], [0.058, -0.024], [0.06, 0], [0.058, 0.024], [0.045, 0.035], [-0.02, 0.035]], mats.navy, "keel skid", { closed: true }); }

  // ================= the portholes: brass flange, ten bolts, gasket, domed glass, the cabin behind =================
  const PORT_Z = [-1.1, -0.45, 0.62, 1.27], PORT_Y = 0.12;
  const flange = new T.LatheGeometry([[0.146, -0.03], [0.146, 0.012], [0.152, 0.03], [0.162, 0.028], [0.188, 0.024], [0.2, 0.014], [0.204, -0.004], [0.204, -0.035]].map(([r, z]) => new T.Vector2(r, z)), 64).rotateX(Math.PI / 2);
  const lens = new T.LatheGeometry([[0, 0.018], [0.05, 0.0175], [0.1, 0.0155], [0.147, 0.011]].map(([r, z]) => new T.Vector2(r, z)), 48).rotateX(Math.PI / 2);
  const bolts = [], ports = [];
  for (const sx of [1, -1]) for (const z of PORT_Z) {
    const a0 = Math.acos(PORT_Y / rHull(z)), a = sx > 0 ? a0 : Math.PI * 2 - a0, f = onHull(z, a);
    const G = new T.Group(); G.name = "porthole"; seat(G, f); body.add(G); ports.push(G);
    const pm = (g, m, n) => K.add(g, m, n, G);
    pm(flange.clone(), mats.brass, "porthole flange");
    pm(new T.CircleGeometry(0.15, 40).translate(0, 0, 0.002), mats.cabin, "porthole interior");
    pm(lens.clone(), mats.portGlass, "porthole glass");
    pm(new T.TorusGeometry(0.147, 0.0045, 8, 48).translate(0, 0, 0.0115), mats.rubber, "porthole gasket");
    for (let k = 0; k < 10; k++) { const b = (k / 10) * Math.PI * 2 + 0.31, cx = Math.cos(b) * 0.176, cy = Math.sin(b) * 0.176, M = new T.Matrix4().makeBasis(f.X, f.Y, f.n).setPosition(f.p);
      bolts.push(new T.CylinderGeometry(0.0085, 0.0085, 0.007, 6).rotateX(Math.PI / 2).rotateZ(b).translate(cx, cy, 0.03).applyMatrix4(M), new T.CylinderGeometry(0.012, 0.012, 0.0025, 16).rotateX(Math.PI / 2).translate(cx, cy, 0.026).applyMatrix4(M)); }
  }
  add(merge(bolts), mats.brass, "porthole bolts");

  // ================= the conning tower: a loft of rounded sections, the navy cap, the foot flange =================
  const TY0 = 0.45, TY1 = 1.40, TN = 3.2, RC = 0.07, TOP = TY1 + RC;
  const tb = (t) => lerp(0.36, 0.32, t), tzf = (t) => lerp(0.72, 0.52, t), tzr = (t) => lerp(-0.70, -0.58, t);
  const sec = (t, th, inset = 0) => { const c = Math.cos(th), s = Math.sin(th), b = tb(t) - inset, zc = (tzf(t) + tzr(t)) / 2, ha = (tzf(t) - tzr(t)) / 2 - inset; return [b * Math.sign(c) * Math.abs(c) ** (2 / TN), zc + ha * Math.sign(s) * Math.abs(s) ** (2 / TN)]; };
  const sideX = (t, z) => { const zc = (tzf(t) + tzr(t)) / 2, ha = (tzf(t) - tzr(t)) / 2; return tb(t) * Math.max(0, 1 - Math.abs((z - zc) / ha) ** TN) ** (1 / TN); };
  const endZ = (t, x, sgn) => { const zc = (tzf(t) + tzr(t)) / 2, ha = (tzf(t) - tzr(t)) / 2; return zc + sgn * ha * Math.max(0, 1 - Math.abs(x / tb(t)) ** TN) ** (1 / TN); };
  const tOfY = (y) => (y - TY0) / (TY1 - TY0);
  const TCOL = 192;
  function towerGeo(rowsT, yOf, insetOf, uvOn) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= rowsT; i++) {
      const q = i / rowsT, y = yOf(q), t = Math.min(1, tOfY(y)), ins = insetOf(q), ring = [];
      for (let j = 0; j <= TCOL; j++) ring.push(sec(t, -Math.PI / 2 + (j / TCOL) * Math.PI * 2, ins));
      const L = [0]; for (let j = 1; j <= TCOL; j++) L.push(L[j - 1] + Math.hypot(ring[j][0] - ring[j - 1][0], ring[j][1] - ring[j - 1][1]));
      for (let j = 0; j <= TCOL; j++) { pos.push(ring[j][0], y, ring[j][1]); uv.push(uvOn ? L[j] / L[TCOL] : j / TCOL, uvOn ? q : q); }
    }
    for (let i = 0; i < rowsT; i++) for (let j = 0; j < TCOL; j++) { const a = i * (TCOL + 1) + j, b = a + 1, c = a + TCOL + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const n = g.attributes.normal; for (let i = 0; i <= rowsT; i++) { const a = i * (TCOL + 1), b = a + TCOL, v = V3(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize(); n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z); }
    // (faces out: the normal at the +x side should point +x)
    const k = Math.round(rowsT / 2) * (TCOL + 1) + TCOL / 4; if (n.getX(k) < 0) { for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); }
    return orient(g);
  }
  add(towerGeo(40, (q) => lerp(TY0, TY1, q), () => 0, true), mats.tower, "conning tower");
  add(towerGeo(10, (q) => TY1 + RC * Math.sin((q * Math.PI) / 2), (q) => RC * (1 - Math.cos((q * Math.PI) / 2)), false), mats.navy, "tower cap");
  { const s = new T.Shape(); for (let j = 0; j <= 96; j++) { const [x, z] = sec(1, (j / 96) * Math.PI * 2, RC); if (j) s.lineTo(x, -z); else s.moveTo(x, -z); }
    const g = new T.ShapeGeometry(s, 4); g.rotateX(-Math.PI / 2); g.translate(0, TOP, 0); add(g, mats.navy, "tower top"); }
  // the foot flange where the tower meets the hull, its bolts
  { const pts = [], bl = []; for (let j = 0; j < 120; j++) { const [x, z] = sec(0.29, (j / 120) * Math.PI * 2), y = Math.sqrt(Math.max(0, rHull(z) ** 2 - x * x)); pts.push(V3(x * 1.015, y + 0.004, z * 1.01)); }
    tube(pts, 0.02, mats.paint, "tower foot flange", { seg: 240, rs: 10, closed: true });
    for (let j = 0; j < 44; j++) { const [x, z] = sec(0.29, (j / 44) * Math.PI * 2 + 0.03), y = Math.sqrt(Math.max(0, rHull(z) ** 2 - x * x)), o = V3(x, 0, z).normalize(); bl.push(new T.CylinderGeometry(0.008, 0.008, 0.012, 6).translate(x * 1.015 + o.x * 0.026, y + 0.012, z * 1.01 + o.z * 0.026)); }
    add(merge(bl), mats.paint, "flange bolts"); }

  // ---- the hatch on the tower's top: coaming, the domed navy lid, a brass handwheel, four dogs, the rear hinge
  { const H = new T.Group(); H.name = "hatch"; H.position.set(0, TOP, 0.1); body.add(H);
    const ly = (pr, m, n) => K.add(new T.LatheGeometry(pr.map(([r, y]) => new T.Vector2(r, y)), 64), m, n, H);
    ly([[0.24, -0.01], [0.24, 0.035], [0.232, 0.045], [0.214, 0.045], [0.214, 0.03]], mats.brass, "hatch coaming");
    ly([[0, 0.092], [0.08, 0.089], [0.15, 0.079], [0.2, 0.062], [0.212, 0.05], [0.212, 0.04]], mats.navy, "hatch lid");
    ly([[0.03, 0.138], [0.03, 0.11], [0.022, 0.09]], mats.brass, "handwheel hub");
    K.add(new T.TorusGeometry(0.085, 0.009, 10, 48).rotateX(Math.PI / 2).translate(0, 0.128, 0), mats.brass, "handwheel", H);
    for (let k = 0; k < 4; k++) { const b = (k / 4) * Math.PI * 2 + Math.PI / 4; const m = rod([Math.cos(b) * 0.028, 0.128, Math.sin(b) * 0.028], [Math.cos(b) * 0.08, 0.128, Math.sin(b) * 0.08], 0.0055, mats.brass, "handwheel spoke", { parent: H }); void m; }
    for (let k = 0; k < 4; k++) { const b = (k / 4) * Math.PI * 2; const m = K.rbox(0.03, 0.022, 0.05, 0.006, mats.darkMetal, "hatch dog", [Math.cos(b) * 0.232, 0.05, Math.sin(b) * 0.232], [0, -b, 0], H); void m; }
    for (const x of [-0.1, 0, 0.1]) { const g = new T.CylinderGeometry(0.018, 0.018, 0.06, 16); g.rotateZ(Math.PI / 2); g.translate(x, 0.05, -0.245); K.add(g, mats.darkMetal, "hatch hinge", H); }
    K.rbox(0.28, 0.012, 0.05, 0.004, mats.darkMetal, "hinge leaf", [0, 0.07, -0.215], null, H); }

  // ---- the periscope (its own part): packing gland, the tube, a brass band, the elbow, the head with its window and hood
  const peri = new T.Group(); peri.name = "periscope"; peri.position.set(0.12, TOP, -0.3); body.add(peri);
  { const ly = (pr, m, n) => K.add(new T.LatheGeometry(pr.map(([r, y]) => new T.Vector2(r, y)), 40), m, n, peri);
    ly([[0.095, -0.01], [0.095, 0.03], [0.085, 0.04], [0.06, 0.045], [0.06, 0.09], [0.052, 0.1], [0.046, 0.1]], mats.brass, "periscope gland");
    for (let k = 0; k < 6; k++) { const b = (k / 6) * Math.PI * 2; K.add(new T.CylinderGeometry(0.008, 0.008, 0.01, 6).translate(Math.cos(b) * 0.077, 0.044, Math.sin(b) * 0.077), mats.brass, "gland bolt", peri); }
    K.add(new T.CylinderGeometry(0.042, 0.042, 0.56, 28).translate(0, 0.37, 0), mats.scope, "periscope tube", peri);
    ly([[0.047, 0.3], [0.047, 0.34]], mats.brass, "periscope band");
    K.add(new T.SphereGeometry(0.05, 24, 16).translate(0, 0.66, 0), mats.scope, "periscope elbow", peri);
    rod([0, 0.66, 0], [0, 0.66, 0.2], 0.042, mats.scope, "periscope head tube", { parent: peri, seg: 28 });
    K.rbox(0.11, 0.11, 0.14, 0.03, mats.scope, "periscope head", [0, 0.665, 0.25], null, peri);
    const w = new T.Mesh(new T.PlaneGeometry(0.075, 0.06), mats.portGlass); w.name = "periscope window"; w.position.set(0, 0.665, 0.3205); peri.add(w);
    const wb = new T.Mesh(new T.PlaneGeometry(0.075, 0.06), mats.cabin); wb.name = "periscope window back"; wb.position.set(0, 0.665, 0.319); peri.add(wb);
    K.rbox(0.12, 0.008, 0.05, 0.003, mats.scope, "periscope hood", [0, 0.722, 0.33], [-0.12, 0, 0], peri); }

  // ---- two small viewports on the tower's front, nav lights on its flanks, grab rails, rungs up the back
  const towerFrame = (x, y, sgnZ) => { const t = tOfY(y), z = endZ(t, x, sgnZ), zc = (tzf(t) + tzr(t)) / 2, ha = (tzf(t) - tzr(t)) / 2, b = tb(t);
    const gx = (TN * Math.sign(x) * Math.abs(x / b) ** (TN - 1)) / b, gz = (TN * Math.sign(z - zc) * Math.abs((z - zc) / ha) ** (TN - 1)) / ha;
    const dzdy = sgnZ > 0 ? (tzf(t + 0.01) - tzf(t)) / (0.01 * (TY1 - TY0)) : (tzr(t + 0.01) - tzr(t)) / (0.01 * (TY1 - TY0));
    const n = V3(gx, -dzdy * gz, gz).normalize(), X = new T.Vector3().crossVectors(V3(0, 1, 0), n).normalize(), Y = new T.Vector3().crossVectors(n, X); return { p: V3(x, y, z), n, X, Y }; };
  const flank = (y, z, sx) => { const t = tOfY(y), x = sx * sideX(t, z), zc = (tzf(t) + tzr(t)) / 2, ha = (tzf(t) - tzr(t)) / 2, b = tb(t);
    const gx = (TN * Math.sign(x) * Math.abs(x / b) ** (TN - 1)) / b, gz = (TN * Math.sign(z - zc) * Math.abs((z - zc) / ha) ** (TN - 1)) / ha, n = V3(gx, 0.04 * Math.sign(gx), gz).normalize();
    const X = new T.Vector3().crossVectors(V3(0, 1, 0), n).normalize(), Y = new T.Vector3().crossVectors(n, X); return { p: V3(x, y, z), n, X, Y }; };
  { const vp = new T.LatheGeometry([[0.05, -0.02], [0.05, 0.008], [0.058, 0.012], [0.068, 0.01], [0.072, 0.0], [0.072, -0.02]].map(([r, z]) => new T.Vector2(r, z)), 40).rotateX(Math.PI / 2);
    for (const x of [-0.13, 0.13]) { const G = new T.Group(); G.name = "viewport"; seat(G, towerFrame(x, 1.15, 1)); body.add(G);
      K.add(vp.clone(), mats.brass, "viewport rim", G); K.add(new T.CircleGeometry(0.05, 28).translate(0, 0, 0.001), mats.cabin, "viewport interior", G); K.add(new T.CircleGeometry(0.05, 28).translate(0, 0, 0.008), mats.portGlass, "viewport glass", G); } }
  for (const sx of [1, -1]) {
    const G = new T.Group(); G.name = "nav light"; seat(G, flank(1.3, 0.22, sx)); body.add(G);
    K.add(new T.LatheGeometry([[0.034, -0.01], [0.036, 0.012], [0.03, 0.02], [0.026, 0.02]].map(([r, z]) => new T.Vector2(r, z)), 28).rotateX(Math.PI / 2), mats.brass, "nav light housing", G);
    K.add(new T.SphereGeometry(0.027, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.8).translate(0, 0, 0.014), sx > 0 ? mats.navRed : mats.navGreen, sx > 0 ? "tail red" : "nav green", G);
    // the grab rail: three standoffs, the rail bent back into the tower at both ends
    const y = 0.98, t = tOfY(y), off = 0.055, pts = [];
    for (const z of [-0.42, -0.4, -0.3, -0.15, 0, 0.15, 0.3, 0.4, 0.42]) { const e = Math.abs(z) > 0.41 ? 0.008 : off; pts.push(V3(sx * (sideX(t, z) + e), y, z)); }
    tube(pts, 0.011, mats.brass, "grab rail", { seg: 60, rs: 10 });
    for (const z of [-0.25, 0.25]) rod([sx * sideX(t, z), y, z], [sx * (sideX(t, z) + off), y, z], 0.008, mats.brass, "rail standoff");
  }
  for (const y of [0.9, 1.04, 1.18, 1.32]) { const t = tOfY(y), zr = (x) => endZ(t, x, -1), pts = [V3(-0.13, y, zr(-0.13) + 0.01), V3(-0.13, y, zr(-0.13) - 0.06), V3(-0.11, y, zr(-0.11) - 0.075), V3(0.11, y, zr(0.11) - 0.075), V3(0.13, y, zr(0.13) - 0.06), V3(0.13, y, zr(0.13) + 0.01)]; tube(pts, 0.011, mats.satin, "rung", { seg: 40, rs: 10 }); }

  // ================= the planes and the fin =================
  const WB = { th: 0.13, cb: 0, nChord: 20, uvScale: 1.2, mat: mats.navy };
  // the stern planes (all-moving, hinged across x at z -2.3)
  const sternPlanes = new T.Group(); sternPlanes.name = "stern planes"; sternPlanes.position.set(0, 0, -2.3); body.add(sternPlanes);
  { const u = (x) => (Math.abs(x) - 0.12) / 0.76, zLE = (x) => 0.18 - 0.1 * u(x), ch = (x) => 0.47 - 0.14 * u(x);
    wingPanel({ x0: 0.12, x1: 0.88, chord: ch, zLE, y: () => 0, tip0: 0, tip1: 0.1, nSpan: 28, name: "stern plane", parent: sternPlanes, ...WB });
    wingPanel({ x0: -0.88, x1: -0.12, chord: ch, zLE, y: () => 0, tip0: 0.1, tip1: 0, nSpan: 28, name: "stern plane", parent: sternPlanes, ...WB });
    const g = new T.CylinderGeometry(0.02, 0.02, 0.36, 16); g.rotateZ(Math.PI / 2); K.add(g, mats.satin, "plane shaft", sternPlanes); }
  // the bow planes (all-moving, hinged at z 1.68, a little under the axis), fairing bosses on the hull
  const bowPlanes = new T.Group(); bowPlanes.name = "bow planes"; bowPlanes.position.set(0, -0.08, 1.68); body.add(bowPlanes);
  { const u = (x) => (Math.abs(x) - 0.6) / 0.4, zLE = (x) => 0.18 - 0.05 * u(x), ch = (x) => 0.36 - 0.1 * u(x);
    wingPanel({ x0: 0.6, x1: 1.0, chord: ch, zLE, y: () => 0, tip0: 0, tip1: 0.08, nSpan: 16, name: "bow plane", parent: bowPlanes, ...WB, th: 0.14 });
    wingPanel({ x0: -1.0, x1: -0.6, chord: ch, zLE, y: () => 0, tip0: 0.08, tip1: 0, nSpan: 16, name: "bow plane", parent: bowPlanes, ...WB, th: 0.14 }); }
  for (const sx of [1, -1]) { const y = -0.08, z = 1.68, a = sx > 0 ? Math.acos(y / rHull(z)) : Math.PI * 2 - Math.acos(y / rHull(z)), f = onHull(z, a, -0.01);
    const m = new T.Mesh(new T.LatheGeometry([[0.12, -0.02], [0.115, 0.012], [0.09, 0.03], [0.05, 0.042], [0, 0.046]].map(([r, zz]) => new T.Vector2(r, zz)), 40).rotateX(Math.PI / 2), mats.navy); m.name = "plane boss"; m.castShadow = m.receiveShadow = true; seat(m, f); body.add(m); }
  // the upper fin (fixed, swept) and its rudder, built along local x then stood up (local x -> +y, thickness -> x)
  { const zLEf = (h) => -2.0 - 0.372 * h, zTEf = pchip([[0, -2.59], [0.59, -2.71], [0.8, -2.665], [0.94, -2.47]]), ZH = -2.47;
    const fin = new T.Group(); fin.name = "fin"; fin.rotation.z = Math.PI / 2; body.add(fin);
    wingPanel({ x0: 0.12, x1: 0.78, chord: (h) => zLEf(h) - (ZH + 0.008), zLE: zLEf, y: () => 0, tip0: 0, tip1: 0, nSpan: 22, name: "fin", parent: fin, ...WB, th: 0.12 });
    wingPanel({ x0: 0.78, x1: 0.94, chord: (h) => zLEf(h) - zTEf(h), zLE: zLEf, y: () => 0, tip0: 0, tip1: 0.1, nSpan: 10, name: "fin", parent: fin, ...WB, th: 0.12 });
    const rudder = new T.Group(); rudder.name = "rudder"; rudder.position.set(0, 0, ZH); body.add(rudder);
    const rf = new T.Group(); rf.rotation.z = Math.PI / 2; rudder.add(rf);
    wingPanel({ x0: 0.2, x1: 0.775, chord: (h) => ZH - 0.008 - zTEf(h), zLE: () => -0.008, y: () => 0, tip0: 0, tip1: 0, nSpan: 20, name: "rudder", parent: rf, ...WB, th: 0.16 });
    for (const y of [0.3, 0.55, 0.74]) { const g = new T.CylinderGeometry(0.014, 0.014, 0.05, 12); g.translate(0, y, 0); K.add(g, mats.darkMetal, "rudder hinge", rudder); }
    var rudderG = rudder; }

  // ================= the stern: boss, shaft, the duct on four struts, the screw =================
  latheZ([[0.136, 0.0], [0.122, -0.06], [0.085, -0.13], [0.05, -0.18], [0.042, -0.2], [0, -0.2]], mats.darkMetal, "stern boss").position.z = ZS + 0.005;
  rod([0, 0, -2.76], [0, 0, -2.88], 0.03, mats.satin, "shaft");
  const DZ = DIM.zProp;
  latheZ([[0.49, 0.18], [0.515, 0.165], [0.53, 0.13], [0.536, 0.06], [0.53, -0.04], [0.515, -0.12], [0.5, -0.18], [0.468, -0.17], [0.458, -0.09], [0.455, 0.0], [0.458, 0.09], [0.468, 0.15], [0.49, 0.18]], mats.navy, "duct", { seg: 96 }).position.z = DZ;
  for (let k = 0; k < 4; k++) { const b = Math.PI / 4 + (k * Math.PI) / 2, c = Math.cos(b), s = Math.sin(b); rod([0.47 * c, 0.47 * s, DZ + 0.12], [0.16 * c, 0.16 * s, -2.47], 0.016, mats.navy, "duct strut", { seg: 10 }); }
  const prop = new T.Group(); prop.name = "propeller"; prop.position.set(0, 0, DZ); body.add(prop);
  latheZ([[0, 0.1], [0.055, 0.1], [0.082, 0.075], [0.09, 0.0], [0.084, -0.07], [0.062, -0.12], [0.03, -0.16], [0, -0.17]], mats.satin, "prop hub", { parent: prop });
  { // a blade lofted from airfoil sections along its radius (radial along +y): a broad skewed planform, a true helix of
    // 0.5 m pitch, thick at the root, a rounded tip; the four blades are one turned round the shaft
    const NR = 26, secA = K.airfoil(1, 0.1, 0.03, 12), cols = secA.length + 1, pos = [], idx = [];
    for (let i = 0; i <= NR; i++) {
      const r = lerp(0.075, 0.43, i / NR), u = (r - 0.075) / 0.355;
      const c = lerp(0.11, 0.21, sstep(0, 0.65, u)) * (u > 0.78 ? Math.sqrt(Math.max(0.03, (1 - u) / 0.22)) : 1), skew = 0.07 * u * u;
      const tw = Math.atan(0.5 / (2 * Math.PI * Math.max(r, 0.08))), thk = lerp(2.4, 0.8, u);
      for (let j = 0; j < cols; j++) { const [cz, cy] = secA[j % secA.length], lx = cz * c - skew, ly = cy * c * thk; pos.push(lx * Math.cos(tw) - ly * Math.sin(tw), r, lx * Math.sin(tw) + ly * Math.cos(tw)); }
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < cols - 1; j++) { const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g0 = new T.BufferGeometry(); g0.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g0.setIndex(idx); g0.computeVertexNormals();
    for (let k = 0; k < 4; k++) K.add(g0.clone().rotateZ((k * Math.PI) / 2), mats.satin, "blade", prop);
    g0.dispose(); prop.rotation.z = 0.3; }

  // ================= the bow headlamp: brass bezel, chrome reflector, bulb, fluted lens, guard bars =================
  const lamp = new T.Group(); lamp.name = "headlamp"; lamp.position.z = ZN - 0.012; body.add(lamp);
  latheZ([[0.155, -0.03], [0.155, 0.03], [0.165, 0.042], [0.2, 0.038], [0.212, 0.022], [0.214, -0.01], [0.21, -0.04]], mats.brass, "lamp bezel", { parent: lamp });
  latheZ([[0.156, 0.024], [0.13, -0.01], [0.09, -0.04], [0.045, -0.058], [0.0, -0.062]], mats.chrome, "lamp reflector", { parent: lamp });
  K.add(new T.SphereGeometry(0.026, 20, 14).translate(0, 0, -0.025), mats.lampGlow, "bulb", lamp);
  latheZ([[0.157, 0.026], [0.12, 0.037], [0.07, 0.045], [0, 0.048]], mats.lens, "headlamp lens", { parent: lamp });
  for (let k = 0; k < 8; k++) { const b = (k / 8) * Math.PI * 2 + 0.2; K.add(new T.CylinderGeometry(0.008, 0.008, 0.008, 6).rotateX(Math.PI / 2).translate(Math.cos(b) * 0.185, Math.sin(b) * 0.185, 0.042), mats.brass, "bezel bolt", lamp); }
  for (const y of [-0.06, 0.06]) tube([[-0.19, y * 1.1, 0.03], [-0.1, y, 0.075], [0.1, y, 0.075], [0.19, y * 1.1, 0.03]], 0.007, mats.brass, "lamp guard", { parent: lamp, seg: 24, rs: 8 });

  // ================= fittings: lifting eyes, vent grilles, zinc anodes =================
  for (const z of [1.5, -1.55]) { const y = rHull(z), dy = -dHull(z) * 0; void dy;
    K.rbox(0.022, 0.075, 0.11, 0.008, mats.paint, "lifting padeye", [0, y + 0.025, z]);
    K.add(new T.TorusGeometry(0.034, 0.008, 10, 28).rotateY(Math.PI / 2).translate(0, y + 0.07, z), mats.satin, "lifting ring"); }
  for (const z of [1.08, -1.08]) { const y = rHull(z);
    K.add(new T.TorusGeometry(0.062, 0.008, 8, 36).rotateX(Math.PI / 2).translate(0, y + 0.003, z), mats.brass, "vent rim");
    K.add(new T.CircleGeometry(0.06, 32).rotateX(-Math.PI / 2).translate(0, y + 0.002, z), mats.under, "vent");
    for (let k = -2; k <= 2; k++) K.add(new T.BoxGeometry(0.11 * Math.sqrt(1 - (k / 2.6) ** 2), 0.006, 0.007).translate(0, y + 0.006, z + k * 0.022), mats.brass, "vent bar"); }
  { const an = []; for (const z of [-2.05, -1.62]) for (const deg of [62, 118, 242, 298]) { const f = onHull(z, (deg * Math.PI) / 180), g = (K.rbox(0.05, 0.13, 0.026, 0.008, mats.zinc, "zinc anode")); seat(g, onHull(z, (deg * Math.PI) / 180, 0.008));
      for (const dz of [-0.045, 0.045]) an.push(placed(new T.CylinderGeometry(0.007, 0.007, 0.03, 6).rotateX(Math.PI / 2).translate(0, dz, 0.014), f)); }
    add(merge(an), mats.satin, "anode bolts"); }

  body.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  const setLamps = (k = 1) => { mats.lampGlow.emissiveIntensity = 4 * k; mats.navRed.emissiveIntensity = 2 * k; mats.navGreen.emissiveIntensity = 2 * k; mats.cabin.emissiveIntensity = 0.3 + 1.6 * k; };
  const parts = { propeller: prop, periscope: peri, bowPlanes, sternPlanes, rudder: rudderG, lamp, portholes: ports };
  return { group, body, wheels: [], mats, tex: { ...tex, skin: skinT, tower: towerT, grime, patina }, parts, DIM, setLamps };
}

// ================================================================ textures
const hsh = (a, b) => { let n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
const mix = (a, b, t) => a + (b - a) * t;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const texOf = (T, c, srgb, rep = false) => { const t = new T.CanvasTexture(c); t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; t.flipY = false; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = T.RepeatWrapping; else { t.wrapS = T.RepeatWrapping; t.wrapT = T.ClampToEdgeWrapping; } t.needsUpdate = true; return t; };

// The hull's skin in its own parameter space: canvas x = the angle round the axis from the top (towards +x), canvas
// y = the arc length from the stern (v = s / S). Plates in rings (seams at fixed z) and strakes (seams at fixed angles,
// staggered ring to ring; a porthole belt strake runs the length), lapped; rivets; the red belt; draft marks; wear;
// algae under the waterline (WL, in the hull's frame), a scum line on it, a salt line over it; limber holes; barnacles.
// Out: { map, bump, rmc } (rmc: R clearcoat, G roughness, B metalness)
function hullTexture(T, tex, { S, sOf, zOf, rHull, WL }) {
  const U = 2048, V = 3072, TAU = Math.PI * 2, n3 = dNoise3(21), n3b = dNoise3(47), n3c = dNoise3(5);
  const fbm = (x, y, z, o) => { let a = 0, w = 0.5, f = 1, sum = 0; for (let k = 0; k < o; k++) { a += w * n3(x * f, y * f, z * f); sum += w; w *= 0.5; f *= 2.03; } return a / sum; };
  const ringZ = [-2.3, -1.65, -0.78, -0.12, 0.95, 1.6, 2.15], ringS = ringZ.map(sOf), ringR = ringZ.map(rHull);
  const full = (L) => { const o = new Set(); for (const d of L) { o.add(d); o.add((360 - d) % 360); } return [...o].sort((a, b) => a - b).map((d) => (d * Math.PI) / 180); };
  const strA = full([0, 32, 64, 99, 140, 180]), strB = full([16, 48, 64, 99, 120, 160]);
  const YEL = hex("#FED012"), RED = hex("#F65342"), PRIMER = [128, 66, 44], STEEL = [92, 88, 84];
  const BZ0 = 0.237, BZ1 = 0.373;
  // ---- the decal layer (under the wear and the algae): draft marks, rust bleeding from rivets, scratches
  const dec = tex.cv(U, V, (ctx) => {
    ctx.clearRect(0, 0, U, V);
    // draft marks: white numerals 0.1 m tall every 0.2 m (decimetres over the keel), at the bow and the stern, both sides
    for (const sx of [1, -1]) for (const zc of [2.0, -1.85]) {
      const r = rHull(zc), ky = V / S, kx = U / (TAU * r), k = 0.001;
      for (const [lab, y] of [["3", -0.5], ["5", -0.3], ["7", -0.1], ["9", 0.1]]) {
        const a0 = Math.acos(y / r), a = sx > 0 ? a0 : TAU - a0, px = (a / TAU) * U, py = (sOf(zc) / S) * V;
        ctx.setTransform(0, -sx * ky * k, sx * kx * k, 0, px, py);
        ctx.fillStyle = "rgba(246,244,236,0.93)"; ctx.font = "700 120px 'DIN Condensed', 'Arial Narrow', Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(lab, 0, 0);
        ctx.fillRect(-55, -2, 30, 6);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // rust bleeding down from rivets on the ring seams (down = +canvas x on the +x side, - on the -x side)
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) {
      const m = 1 + Math.floor(rnd() * 5), rk = ringR[m], nK = Math.round((TAU * rk) / 0.05), step = TAU / nK, side = rnd() < 0.5 ? 1 : -1;
      let a = (0.25 + rnd() * 0.6) * Math.PI; a = Math.round(a / step) * step; if (side < 0) a = TAU - a;
      const s = ringS[m] + (rnd() < 0.5 ? -0.02 : 0.02), px = (a / TAU) * U, py = (s / S) * V, L = (0.04 + rnd() * 0.16) * U / (TAU * rk), w = 0.006 * V / S;
      const g = ctx.createLinearGradient(px, py, px + side * L, py); g.addColorStop(0, "rgba(120,58,26,0.42)"); g.addColorStop(1, "rgba(120,58,26,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px + side * L / 2, py, L / 2, w / 2, 0, 0, TAU); ctx.fill();
    }
    // scratches: thin pale lines, mostly low and towards the bow
    for (let i = 0; i < 40; i++) { const px = rnd() * U, py = (0.45 + rnd() * 0.5) * V, l = 20 + rnd() * 90, an = rnd() * TAU; ctx.strokeStyle = rnd() < 0.5 ? "rgba(255,246,200,0.16)" : "rgba(80,60,40,0.16)"; ctx.lineWidth = 0.8 + rnd(); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(an) * l, py + Math.sin(an) * l * 0.6); ctx.stroke(); }
  });
  const dd = dec.getContext("2d").getImageData(0, 0, U, V).data;
  const cC = tex.cv(U, V, () => {}), hC = tex.cv(U, V, () => {}), rC = tex.cv(U, V, () => {});
  const ci = cC.getContext("2d").createImageData(U, V), hi = hC.getContext("2d").createImageData(U, V), ri = rC.getContext("2d").createImageData(U, V);
  const cd = ci.data, hd = hi.data, rd = ri.data, RV = 0.0065;
  const dome = (d) => (d < RV ? Math.sqrt(1 - (d / RV) ** 2) : 0);
  const sinA = new Float64Array(U), cosA = new Float64Array(U); for (let i = 0; i < U; i++) { const a = ((i + 0.5) / U) * TAU; sinA[i] = Math.sin(a); cosA[i] = Math.cos(a); }
  for (let j = 0; j < V; j++) {
    const s = ((j + 0.5) / V) * S, z = zOf(s), r = rHull(z);
    let k = 0; while (k < ringS.length && ringS[k] < s) k++;
    let m = 0, dsb = 1e9; for (let q = 0; q < ringS.length; q++) { const d = s - ringS[q]; if (Math.abs(d) < Math.abs(dsb)) { dsb = d; m = q; } }
    const strakes = k === 0 || k === ringS.length ? null : k % 2 ? strB : strA, inBand = z > BZ0 - 0.002 && z < BZ1 + 0.002;
    const nK = Math.round((TAU * ringR[m]) / 0.05), stepK = TAU / nK, nB = Math.round((TAU * r) / 0.06), stepB = TAU / nB, ds2 = s - Math.round(s / 0.05) * 0.05;
    for (let i = 0; i < U; i++) {
      const a = ((i + 0.5) / U) * TAU, x = r * sinA[i], y = r * cosA[i], o = (j * U + i) * 4;
      // plate and seams
      let si = 0, dA = 1e9, sgnA = 0;
      if (strakes) { for (let q = 0; q < strakes.length; q++) { if (strakes[q] < a) si = q + 1; let d = a - strakes[q]; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; if (Math.abs(d) < Math.abs(dA)) { dA = d; } } sgnA = r * dA; }
      const dSeamC = Math.abs(dsb), dSeamL = strakes ? Math.abs(sgnA) : 1, dSeam = inBand ? 1 : Math.min(dSeamC, dSeamL);
      const tone = 1 + (hsh(k * 31 + 7, si % strakesLen(strakes)) - 0.5) * 0.05;
      let c = inBand ? RED.slice() : YEL.slice(); c[0] *= tone; c[1] *= tone; c[2] *= tone;
      let h = inBand ? 0.6 : 0.5 + ((k + si) % 2) * 0.07, rough = 0.34, coat = 0.8, metal = 0, grimeK = 0;
      h -= 0.24 * Math.exp(-((dSeam / 0.0013) ** 2)); grimeK += 0.4 * Math.exp(-((dSeam / 0.0035) ** 2));
      // rivets
      let rv = 0, rd2 = 1;
      if (!inBand) {
        if (dSeamC < 0.035) { for (const off of [-0.02, 0.02]) { const ph = off > 0 ? 0 : stepK / 2, ai = Math.round((a - ph) / stepK) * stepK + ph, d = Math.hypot(dsb - off, ringR[m] * (a - ai)); rd2 = Math.min(rd2, d); rv = Math.max(rv, dome(d)); } }
        else if (strakes && dSeamL < 0.03) { for (const off of [-0.017, 0.017]) { const d = Math.hypot(sgnA - off, ds2); rd2 = Math.min(rd2, d); rv = Math.max(rv, dome(d)); } }
      } else { for (const zr of [0.262, 0.348]) { const ph = zr > 0.3 ? stepB / 2 : 0, ai = Math.round((a - ph) / stepB) * stepB + ph, d = Math.hypot(z - zr, r * (a - ai)); rd2 = Math.min(rd2, d); rv = Math.max(rv, dome(d)); } }
      h += 0.5 * rv; if (rd2 > RV && rd2 < RV + 0.0022) grimeK += 0.35;
      // the decals
      const da = dd[o + 3] / 255; if (da > 0) { for (let q = 0; q < 3; q++) c[q] = mix(c[q], dd[o + q] / Math.max(da, 1e-3), da); }
      // chips along the seams, on the bow and the stern, a few low
      const cn = fbm(x * 40, y * 40, z * 40, 2), chipV = cn + 0.24 * Math.exp(-((dSeam / 0.007) ** 2)) + 0.1 * sstep(2.1, 2.55, z) + 0.06 * sstep(-2.1, -2.45, z) + 0.12 * rv;
      if (chipV > 0.9) { const bare = chipV > 0.96; const cc = bare ? STEEL : PRIMER; for (let q = 0; q < 3; q++) c[q] = cc[q]; h -= 0.07; rough = bare ? 0.5 : 0.7; coat = 0; metal = bare ? 0.7 : 0; }
      // grime in the seams and round the rivets, a general breakup, darker low, sun-faded high
      const gn = n3b(x * 5, y * 5, z * 5), gk = Math.min(0.6, grimeK);
      for (let q = 0; q < 3; q++) c[q] *= (1 - gk * 0.5) * (0.94 + 0.06 * gn) * (1 - 0.07 * sstep(0.0, -0.6, y));
      if (y > 0.3) { const f = 0.08 * sstep(0.3, 0.8, y) * (0.6 + 0.4 * gn), l = (c[0] + c[1] + c[2]) / 3; for (let q = 0; q < 3; q++) c[q] = mix(c[q], l * 0.6 + 255 * 0.4, f); rough += 0.08 * f / 0.22; }
      rough += 0.08 * gn + gk * 0.3; coat *= 1 - gk;
      // the waterline: salt over it, a scum line on it, algae under it
      const depth = WL - y;
      if (depth > -0.05) {
        const an = fbm(x * 8, y * 8, z * 8, 3), af = n3c(x * 45, y * 45, z * 45);
        if (depth < 0) { const sk = 0.3 * Math.exp(-(((depth + 0.022) / 0.01) ** 2)) * an; for (let q = 0; q < 3; q++) c[q] = mix(c[q], [234, 230, 214][q], sk); }
        const fringe = Math.exp(-(((depth - 0.03) / 0.04) ** 2)), film = 0.2 * sstep(0.0, 0.3, depth);
        const alg = depth < 0 ? 0 : clamp((fringe * 1.0 + film) * (0.4 + 1.3 * an) - 0.3 + 0.4 * (af - 0.5), 0, 1);
        const scum = Math.exp(-((depth / 0.006) ** 2)) * (0.35 + 0.65 * an);
        const ac = [mix(62, 104, af), mix(74, 122, af), mix(34, 52, af)], br = [86, 70, 42], bt = sstep(0.55, 0.75, an);
        for (let q = 0; q < 3; q++) { const col = mix(ac[q], br[q], bt); c[q] = mix(c[q], col, alg * 0.88); c[q] = mix(c[q], [70, 58, 38][q], scum * 0.6); }
        h += alg * 0.14 * af; rough = mix(rough, 0.86, Math.max(alg, scum * 0.7)); coat *= 1 - Math.max(alg, scum); metal *= 1 - alg;
      }
      // limber holes along the lower flanks
      if (Math.abs(y + 0.37) < 0.05 && Math.abs(z) < 1.4) { const zc = Math.round(z / 0.27) * 0.27, qx = Math.max(Math.abs(z - zc) - 0.03, 0), qy = Math.max(Math.abs(y + 0.37) - 0.006, 0), dd2 = Math.hypot(qx, qy) - 0.01;
        if (dd2 < 0) { c = [12, 14, 14]; h = 0.12; rough = 0.9; coat = 0; metal = 0; } else if (dd2 < 0.003) { for (let q = 0; q < 3; q++) c[q] *= 0.7; h -= 0.05 * (1 - dd2 / 0.003); } }
      // a few barnacles low down
      if (y < -0.5) { const arc = r * a, cz = Math.floor(z / 0.035), ca = Math.floor(arc / 0.035), hb = hsh(cz * 3 + 1, ca * 7 + 3);
        if (hb < 0.05) { const bz = (cz + 0.3 + 0.4 * hsh(cz, ca)) * 0.035, ba = (ca + 0.3 + 0.4 * hsh(ca, cz)) * 0.035, br2 = 0.004 + 0.005 * hsh(cz + 9, ca), d = Math.hypot(z - bz, arc - ba);
          if (d < br2) { const t = Math.sqrt(1 - (d / br2) ** 2); for (let q = 0; q < 3; q++) c[q] = mix(c[q], [200, 192, 174][q], 0.85); h += 0.45 * t; rough = 0.9; coat = 0; if (d < br2 * 0.35) for (let q = 0; q < 3; q++) c[q] *= 0.55; } } }
      cd[o] = c[0]; cd[o + 1] = c[1]; cd[o + 2] = c[2]; cd[o + 3] = 255;
      const hv = clamp(h, 0, 1) * 255; hd[o] = hd[o + 1] = hd[o + 2] = hv; hd[o + 3] = 255;
      rd[o] = clamp(coat, 0, 1) * 255; rd[o + 1] = clamp(rough, 0.05, 1) * 255; rd[o + 2] = clamp(metal, 0, 1) * 255; rd[o + 3] = 255;
    }
  }
  cC.getContext("2d").putImageData(ci, 0, 0); hC.getContext("2d").putImageData(hi, 0, 0); rC.getContext("2d").putImageData(ri, 0, 0);
  const hB = tex.cv(U, V, (ctx) => { ctx.filter = "blur(0.7px)"; ctx.drawImage(hC, 0, 0); });
  return { map: texOf(T, cC, true), bump: texOf(T, hB, false), rmc: texOf(T, rC, false) };
}
const strakesLen = (s) => (s ? s.length + 1 : 1);

// The tower's skin: canvas x = the arc length round the section from the rear centre (towards +x, then the front),
// canvas y = the height (v 0 at the foot, 1 at the cap's joint). Plates (six vertical seams, one horizontal), rivets,
// a row along the cap joint, the "CS 01" stencil on both flanks, chips on the corners and the top edge, rust streaks.
function towerTexture(T, tex) {
  const U = 2048, V = 640, PER = 3.5, HT = 0.95, YEL = hex("#FED012"), NAV = "#1b2a52", n3 = dNoise3(31), n3b = dNoise3(8);
  const seamsU = [0, 0.13, 0.37, 0.5, 0.63, 0.87, 1], seamV = 0.53, topV = 0.975, RV = 0.0065;
  const dec = tex.cv(U, V, (ctx) => {
    ctx.clearRect(0, 0, U, V);
    const kx = U / PER, ky = V / HT, k = 0.001;
    for (const uc of [0.25, 0.75]) { ctx.setTransform(-kx * k, 0, 0, -ky * k, uc * U, ((1.07 - 0.45) / HT) * V); ctx.fillStyle = NAV; ctx.font = "800 100px 'DIN Condensed', 'Arial Narrow', Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("CS 01", 0, 0); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 40; i++) { const px = rnd() * U, py = (rnd() < 0.5 ? topV : seamV) * V - 0.02 * ky, L = (0.03 + rnd() * 0.15) * ky, w = 0.006 * kx; const g = ctx.createLinearGradient(px, py, px, py - L); g.addColorStop(0, "rgba(120,58,26,0.4)"); g.addColorStop(1, "rgba(120,58,26,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py - L / 2, w / 2, L / 2, 0, 0, Math.PI * 2); ctx.fill(); }
  });
  const dd = dec.getContext("2d").getImageData(0, 0, U, V).data;
  const cC = tex.cv(U, V, () => {}), hC = tex.cv(U, V, () => {}), rC = tex.cv(U, V, () => {});
  const ci = cC.getContext("2d").createImageData(U, V), hi = hC.getContext("2d").createImageData(U, V), ri = rC.getContext("2d").createImageData(U, V);
  const cd = ci.data, hd = hi.data, rd = ri.data, dome = (d) => (d < RV ? Math.sqrt(1 - (d / RV) ** 2) : 0);
  for (let j = 0; j < V; j++) for (let i = 0; i < U; i++) {
    const u = (i + 0.5) / U, v = (j + 0.5) / V, pu = u * PER, pv = v * HT, o = (j * U + i) * 4;
    let du = 1e9; for (const q of seamsU) du = Math.min(du, Math.abs(u - q) * PER);
    const dvS = (v - seamV) * HT, dvT = (v - topV) * HT, dSeam = Math.min(du, Math.abs(dvS));
    const pid = seamsU.findIndex((q) => q > u) * 2 + (v > seamV ? 1 : 0), tone = 1 + (hsh(pid, 5) - 0.5) * 0.05;
    let c = YEL.map((x) => x * tone), h = 0.5 + (pid % 2) * 0.06, rough = 0.34, coat = 0.8, metal = 0, gk = 0;
    h -= 0.24 * Math.exp(-((dSeam / 0.0013) ** 2)); gk += 0.4 * Math.exp(-((dSeam / 0.0035) ** 2));
    let rv = 0, rmin = 1;
    const rowH = (dv) => { for (const off of [-0.018, 0.018]) { const ph = off > 0 ? 0 : 0.025, pi = Math.round((pu - ph) / 0.05) * 0.05 + ph, d = Math.hypot(dv - off, pu - pi); rmin = Math.min(rmin, d); rv = Math.max(rv, dome(d)); } };
    if (Math.abs(dvS) < 0.03) rowH(dvS); else if (Math.abs(dvT) < 0.03) rowH(dvT + 0.018);
    else if (du < 0.03) { for (const q of seamsU) { const sa = (u - q) * PER; if (Math.abs(sa) > 0.03) continue; for (const off of [-0.017, 0.017]) { const pi = Math.round(pv / 0.05) * 0.05, d = Math.hypot(sa - off, pv - pi); rmin = Math.min(rmin, d); rv = Math.max(rv, dome(d)); } } }
    h += 0.5 * rv; if (rmin > RV && rmin < RV + 0.0022) gk += 0.35;
    const da = dd[o + 3] / 255; if (da > 0) for (let q = 0; q < 3; q++) c[q] = mix(c[q], dd[o + q] / Math.max(da, 1e-3), da);
    // corners: the plan's quarter points (u 0.125.. ) wear most, and the top edge
    const x = Math.cos(u * Math.PI * 2) * 2, z = Math.sin(u * Math.PI * 2) * 2, cn = (n3(x * 12, pv * 24, z * 12) * 0.65 + n3(x * 34, pv * 68, z * 34) * 0.35);
    const corner = Math.max(...[0.125, 0.375, 0.625, 0.875].map((q) => Math.exp(-(((u - q) * PER / 0.06) ** 2))));
    const chipV = cn + 0.16 * corner + 0.16 * sstep(0.93, 1.0, v) + 0.22 * Math.exp(-((dSeam / 0.007) ** 2)) + 0.1 * rv;
    if (chipV > 0.9) { const bare = chipV > 0.96, cc = bare ? [92, 88, 84] : [128, 66, 44]; c = cc.slice(); h -= 0.07; rough = bare ? 0.5 : 0.7; coat = 0; metal = bare ? 0.7 : 0; }
    const gn = n3b(x * 3, pv * 6, z * 3); gk = Math.min(0.6, gk);
    for (let q = 0; q < 3; q++) c[q] *= (1 - gk * 0.5) * (0.94 + 0.06 * gn);
    const f = 0.06 * sstep(0.4, 1.0, v), l = (c[0] + c[1] + c[2]) / 3; for (let q = 0; q < 3; q++) c[q] = mix(c[q], l * 0.6 + 255 * 0.4, f);
    rough += 0.08 * gn + gk * 0.3 + f * 0.3; coat *= 1 - gk;
    cd[o] = c[0]; cd[o + 1] = c[1]; cd[o + 2] = c[2]; cd[o + 3] = 255;
    const hv = clamp(h, 0, 1) * 255; hd[o] = hd[o + 1] = hd[o + 2] = hv; hd[o + 3] = 255;
    rd[o] = clamp(coat, 0, 1) * 255; rd[o + 1] = clamp(rough, 0.05, 1) * 255; rd[o + 2] = clamp(metal, 0, 1) * 255; rd[o + 3] = 255;
  }
  cC.getContext("2d").putImageData(ci, 0, 0); hC.getContext("2d").putImageData(hi, 0, 0); rC.getContext("2d").putImageData(ri, 0, 0);
  const hB = tex.cv(U, V, (ctx) => { ctx.filter = "blur(0.7px)"; ctx.drawImage(hC, 0, 0); });
  const out = { map: texOf(T, cC, true), bump: texOf(T, hB, false), rmc: texOf(T, rC, false) };
  for (const t of Object.values(out)) t.wrapT = T.ClampToEdgeWrapping;
  return out;
}

// the navy paint: a tileable breakup (tone, a few scuffs) and its rmc (R clearcoat, G roughness)
function grimeTexture(T, tex) {
  const S = 512, n2 = dNoise2(17, 16), n2b = dNoise2(29, 32), NAV = hex("#1b2a52");
  const cC = tex.cv(S, S, (ctx) => { const im = ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, a = n2((x / S) * 16, (y / S) * 16), b = n2b((x / S) * 32, (y / S) * 32), k = 0.92 + 0.1 * a + 0.03 * b; im.data[o] = NAV[0] * k + 6 * Math.max(0, a - 0.7); im.data[o + 1] = NAV[1] * k + 6 * Math.max(0, a - 0.7); im.data[o + 2] = NAV[2] * k; im.data[o + 3] = 255; } ctx.putImageData(im, 0, 0);
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 40; i++) { const px = rnd() * S, py = rnd() * S, l = 8 + rnd() * 40, an = rnd() * 6.28; ctx.strokeStyle = "rgba(170,180,200,0.25)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(an) * l, py + Math.sin(an) * l); ctx.stroke(); } });
  const rC = tex.cv(S, S, (ctx) => { const im = ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, a = n2((x / S) * 16 + 5, (y / S) * 16), b = n2b((x / S) * 32, (y / S) * 32 + 3); im.data[o] = (0.75 - 0.35 * a) * 255; im.data[o + 1] = (0.34 + 0.16 * a + 0.04 * b) * 255; im.data[o + 2] = 0; im.data[o + 3] = 255; } ctx.putImageData(im, 0, 0); });
  return { map: texOf(T, cC, true, true), rmc: texOf(T, rC, false, true) };
}
// brass: a tileable tarnish (darker, greener patches) and its roughness
function patinaTexture(T, tex) {
  const S = 256, n2 = dNoise2(41, 8), n2b = dNoise2(43, 32);
  const cC = tex.cv(S, S, (ctx) => { const im = ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, a = n2((x / S) * 8, (y / S) * 8), b = n2b((x / S) * 32, (y / S) * 32), t = clamp((a - 0.55) * 2.5, 0, 1) * 0.5 + b * 0.08; im.data[o] = 255 * (1 - t * 0.55); im.data[o + 1] = 255 * (1 - t * 0.35); im.data[o + 2] = 255 * (1 - t * 0.4); im.data[o + 3] = 255; } ctx.putImageData(im, 0, 0); });
  const rC = tex.cv(S, S, (ctx) => { const im = ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, a = n2((x / S) * 8, (y / S) * 8), g = (0.22 + 0.3 * clamp((a - 0.5) * 2, 0, 1)) * 255; im.data[o] = im.data[o + 1] = im.data[o + 2] = g; im.data[o + 3] = 255; } ctx.putImageData(im, 0, 0); });
  return { map: texOf(T, cC, true, true), rough: texOf(T, rC, false, true) };
}
