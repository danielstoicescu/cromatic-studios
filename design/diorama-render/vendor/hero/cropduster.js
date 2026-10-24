// Cromatic · hero vehicles (Radu): the Cropduster, a two-bay-less (single-bay) training biplane of the 1930s-40s type
// working as a crop sprayer, in the map's livery ("plane" ride): yellow, red wing tips, rudder and spinner, a black ring
// cowl with a chrome lip round a nine-cylinder radial, a two-blade wooden propeller (its own part: parts.propeller,
// spin it round its z axis), doped fabric over ribs on the wings and tail, N interplane struts, cabane struts, flying
// and landing wires, the hopper in the front cockpit, a spray bar with nozzles under the lower wing, the pilot in a
// leather helmet and goggles in the rear cockpit. An original airframe (no maker's markings).
// Metres; origin on the ground under the main wheels' axle, +z forward (the nose), +y up, +x the left wing.
// Modelled with the fuselage level (the tail up, as on the take-off run), the main wheels on the ground, the tail
// skid 0.3 m clear. Pitch the body back ~11 deg about the axle for the three-point (parked) attitude.
//   buildCropduster(THREE, { RoundedBoxGeometry }) -> { group, body, wheels, mats, tex, parts, DIM }
// Proportions of the type (a 1930s-40s biplane trainer turned sprayer): length 7.6 (spinner to rudder), span 9.8 (both wings), chord 1.37,
// gap 1.45, stagger 0.4, height 2.85 (fuselage level), propeller 2.44 across, main wheels 0.84 across on a 1.9 track.
import { pchip, clamp, lerp, sstep, makeTex, baseMats, makeKit, buildWheel } from "./kit.js";

export const DIM = { L: 7.6, span: 9.8, chord: 1.37, gap: 1.45, H: 2.85, prop: 2.44, track: 1.9, tyreR: 0.42, thrustY: 1.62 };

export function buildCropduster(T, ext = {}) {
  const group = new T.Group(); group.name = "hero-cropduster";
  const K = makeKit(T, group); K.setRB(ext.RoundedBoxGeometry);
  const { V3, add, sweep, roundProf, rod, tube, latheZ, rrShape, rbox, gridGeo, ribbon, sideExtrude, airfoil, wingPanel } = K;
  const tex = makeTex(T), mats = baseMats(T, tex);
  const YEL = "#FED012", RED = "#F65342";
  const fab = (name, color) => new T.MeshPhysicalMaterial({ name, color: new T.Color(color), roughness: 0.42, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.18, normalMap: tex.fabric, normalScale: new T.Vector2(0.6, 0.6), side: T.DoubleSide });
  Object.assign(mats, {
    paint: new T.MeshPhysicalMaterial({ name: "paint", color: new T.Color(YEL), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, side: T.DoubleSide }),
    red: new T.MeshPhysicalMaterial({ name: "paint red", color: new T.Color(RED), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, side: T.DoubleSide }),
    wing: fab("fabric", YEL), wingRed: fab("fabric red", RED),
    cowl: new T.MeshPhysicalMaterial({ name: "cowl", color: new T.Color("#141414"), roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, side: T.DoubleSide }),
    strut: new T.MeshPhysicalMaterial({ name: "strut", color: new T.Color("#c9ccd0"), roughness: 0.35, metalness: 0.6 }),
    wire: new T.MeshPhysicalMaterial({ name: "wire", color: new T.Color("#b8bcc2"), roughness: 0.25, metalness: 1 }),
    prop: new T.MeshPhysicalMaterial({ name: "propeller wood", color: new T.Color("#5a3a20"), roughness: 0.25, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, side: T.DoubleSide }),
    capLeather: new T.MeshPhysicalMaterial({ name: "leather helmet", color: new T.Color("#6b4a2e"), roughness: 0.6, metalness: 0, clearcoat: 0.2 }),
    skin: new T.MeshPhysicalMaterial({ name: "skin", color: new T.Color("#d9a384"), roughness: 0.6, metalness: 0 }),
    rimRed: new T.MeshPhysicalMaterial({ name: "red wheel", color: new T.Color(RED), roughness: 0.3, metalness: 0.1, clearcoat: 1, side: T.DoubleSide })
  });
  const TY = DIM.thrustY;

  // ================= the fuselage: a loft of rounded sections from the firewall to the tail post =================
  const Z0 = -5.45, Z1 = 1.25;
  const fW = pchip([[Z0, 0.04], [-4.8, 0.14], [-3.5, 0.29], [-2.2, 0.4], [-1.0, 0.44], [0.4, 0.45], [Z1, 0.47]]);
  const fYT = pchip([[Z0, 1.98], [-4.8, 2.02], [-3.0, 2.06], [-1.5, 2.08], [0.0, 2.1], [0.8, 2.1], [Z1, 2.08]]);
  const fYB = pchip([[Z0, 1.84], [-4.8, 1.75], [-3.5, 1.5], [-2.0, 1.25], [-0.8, 1.16], [0.6, 1.15], [Z1, 1.17]]);
  const fN = (z) => lerp(2.2, 3.0, sstep(-4.5, -2.0, z));
  const NC = 26, TH = Array.from({ length: NC + 1 }, (_, j) => -Math.PI / 2 + (j / NC) * Math.PI);
  const fpt = (z, th) => { const n = fN(z), c = Math.cos(th), s = Math.sin(th), yc = (fYT(z) + fYB(z)) / 2, h = (fYT(z) - fYB(z)) / 2; return [fW(z) * Math.pow(Math.abs(c), 2 / n), yc + h * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; };
  const ZS = []; for (let z = Z0; z <= Z1 + 1e-9; z += 0.04) ZS.push(+z.toFixed(4)); for (const z of [-2.15, -1.45, -0.95, -0.25]) ZS.push(z); ZS.sort((a, b) => a - b);
  const CP = [{ z0: -2.15, z1: -1.45 }, { z0: -0.95, z1: -0.25 }]; // the rear (pilot's) and front (the hopper's) cockpits
  const cut = (z, th) => th > 1.05 && CP.some((c) => z > c.z0 && z < c.z1);
  for (const sx of [1, -1]) add(gridGeo(ZS.length, NC + 1, (i, j) => { const [x, y] = fpt(ZS[i], TH[j]); return [sx * x, y, ZS[i]]; }, (i, j) => !cut((ZS[i] + ZS[i + 1]) / 2, (TH[j] + TH[j + 1]) / 2), sx > 0), mats.paint, "fuselage");
  // the cockpits' coamings (leather rolls), the pilot's screen, the hopper's lid
  for (const c of CP) {
    const pts = []; const th = 1.07, e = 0.012;
    for (let k = 0; k <= 12; k++) { const z = lerp(c.z1, c.z0, k / 12), [x, y] = fpt(z, th); pts.push(V3(x, y + e, z)); }
    for (let k = 1; k < 8; k++) { const t = k / 8, [x, y] = fpt(c.z0, th); pts.push(V3(lerp(x, -x, t), y + e + 0.02 * Math.sin(t * Math.PI) + (fYT(c.z0) - y) * Math.sin(t * Math.PI) * 0.7, c.z0)); }
    for (let k = 0; k <= 12; k++) { const z = lerp(c.z0, c.z1, k / 12), [x, y] = fpt(z, th); pts.push(V3(-x, y + e, z)); }
    for (let k = 1; k < 8; k++) { const t = k / 8, [x, y] = fpt(c.z1, th); pts.push(V3(lerp(-x, x, t), y + e + (fYT(c.z1) - y) * Math.sin(t * Math.PI) * 0.7, c.z1)); }
    tube(pts, 0.03, mats.capLeather, "coaming", { seg: 120, closed: true });
    const fl = new T.PlaneGeometry(0.7, c.z1 - c.z0); fl.rotateX(-Math.PI / 2); fl.translate(0, 1.5, (c.z0 + c.z1) / 2); add(fl, mats.dash, "cockpit floor");
  }
  { const g = new T.CylinderGeometry(0.3, 0.33, 0.14, 32); g.translate(0, 2.06, -0.6); add(g, mats.paint, "hopper"); const l = new T.CylinderGeometry(0.2, 0.2, 0.04, 28); l.translate(0, 2.15, -0.6); add(l, mats.strut, "hopper lid"); }
  { const sh = new T.Shape(); sh.moveTo(-0.24, 0); sh.lineTo(0.24, 0); sh.lineTo(0.2, 0.22); sh.lineTo(-0.2, 0.22); sh.closePath(); const g = new T.ShapeGeometry(sh); const m = add(g, mats.glass, "screen"); m.position.set(0, 2.1, -1.37); m.rotation.x = -0.35; }
  // the pilot: a leather helmet, goggles, a scarf
  { const hd = new T.SphereGeometry(0.12, 24, 18); hd.scale(1, 1.08, 1.1); hd.translate(0, 2.3, -1.85); add(hd, mats.capLeather, "pilot helmet");
    const fc = new T.SphereGeometry(0.105, 20, 14, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.4, Math.PI * 0.35); fc.translate(0, 2.29, -1.84); add(fc, mats.skin, "pilot face");
    for (const s of [-1, 1]) { const g = new T.TorusGeometry(0.03, 0.009, 8, 20); g.translate(s * 0.045, 2.33, -1.735); add(g, mats.chrome, "goggles"); const l = new T.CircleGeometry(0.03, 20); l.translate(s * 0.045, 2.33, -1.733); add(l, mats.mirror, "goggle glass"); }
    rbox(0.42, 0.14, 0.26, 0.06, mats.capLeather, "pilot shoulders", [0, 2.12, -1.88]); }
  // the tail post and the stringers' seam (a fine line along the flanks)
  for (const sx of [1, -1]) ribbon(Array.from({ length: 50 }, (_, k) => { const z = lerp(-5.3, 1.2, k / 49), [x, y] = fpt(z, 0.25); return { p: V3(sx * x, y, z), n: V3(sx, 0, 0) }; }), 0.004, 0.001, mats.gap, "panel line");

  // ================= the engine: crankcase, nine finned cylinders, pushrods, the collector ring; the ring cowl =================
  const EZ = 1.5;
  latheZ([[0, 0.12], [0.18, 0.1], [0.24, 0.0], [0.24, -0.12], [0.3, -0.18], [0.3, -0.26], [0.2, -0.3], [0, -0.3]], mats.darkMetal, "crankcase").position.set(0, TY, EZ);
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2, C = new T.Group(); C.name = "cylinder"; group.add(C); C.position.set(0, TY, EZ - 0.04); C.rotation.z = a;
    const prof = [[0, 0.22]]; for (let f = 0; f < 14; f++) { const y = 0.22 + f * 0.017; prof.push([0.07, y], [0.092, y + 0.004], [0.092, y + 0.01], [0.07, y + 0.014]); } prof.push([0.085, 0.47], [0.095, 0.5], [0.07, 0.55], [0, 0.56]);
    const g = new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), 20); K.add(g, mats.engine, "cylinder", C);
    for (const s of [-1, 1]) { const pr = new T.CylinderGeometry(0.012, 0.012, 0.32, 8); pr.translate(s * 0.05, 0.37, -0.09); K.add(pr, mats.satin, "pushrod", C); }
  }
  { const g = new T.TorusGeometry(0.42, 0.04, 12, 48); g.translate(0, TY, EZ - 0.3); add(g, mats.satin, "collector ring"); }
  latheZ([[0.6, 0.2], [0.64, 0.18], [0.655, 0.1], [0.64, -0.12], [0.6, -0.3], [0.54, -0.3], [0.58, -0.12], [0.6, 0.12], [0.57, 0.19]], mats.cowl, "ring cowl").position.set(0, TY, EZ);
  { const g = new T.TorusGeometry(0.6, 0.025, 12, 64); g.translate(0, TY, EZ + 0.2); add(g, mats.chrome, "cowl lip"); }
  latheZ([[0.6, 0.0], [0.5, -0.18], [0.47, -0.32]], mats.paint, "firewall fairing").position.set(0, TY, EZ - 0.3);
  // the exhaust stack down the right side
  tube([[-0.38, TY - 0.2, EZ - 0.32], [-0.48, TY - 0.45, EZ - 0.5], [-0.5, TY - 0.55, EZ - 1.1]], 0.04, mats.satin, "exhaust", { seg: 20, rs: 14 });

  // ================= the propeller (its own group, spins round z) =================
  const prop = new T.Group(); prop.name = "propeller"; prop.position.set(0, TY, EZ + 0.3); group.add(prop);
  latheZ([[0, 0.34], [0.07, 0.3], [0.13, 0.2], [0.16, 0.08], [0.17, 0.0], [0.15, -0.02], [0, -0.02]], mats.red, "spinner", { parent: prop });
  for (const s of [1, -1]) {
    // a blade lofted from airfoil sections along its radius: chord and thickness tapering, twist falling outward
    const NR = 22, sec = airfoil(1, 0.12, 0.03, 10), cols = sec.length + 1, pos = [], idx = [];
    for (let i = 0; i <= NR; i++) {
      const r = lerp(0.12, 1.22, i / NR), u = (r - 0.12) / 1.1, c = 0.2 * (0.55 + 0.75 * Math.sin(Math.min(1, u * 1.3) * Math.PI * 0.75)) * (u > 0.9 ? Math.sqrt(Math.max(0.05, (1 - u) / 0.1)) : 1), tw = lerp(0.95, 0.22, u), thk = lerp(2.2, 0.8, u);
      for (let j = 0; j < cols; j++) { const [cz, cy] = sec[j % sec.length]; const lx = cz * c, ly = cy * c * thk; // (lx along the chord, ly across)
        const X = lx * Math.cos(tw) - ly * Math.sin(tw), Z = lx * Math.sin(tw) + ly * Math.cos(tw); pos.push(X, s * r, Z * 0.9); }
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < cols - 1; j++) { const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); K.add(g, mats.prop, "blade", prop);
  }
  prop.rotation.z = 0.35;

  // ================= the wings =================
  const UY = 2.6, LY = 1.17, CH = DIM.chord, HS = DIM.span / 2, ULE = 0.78, LLE = 0.38, DIH = Math.tan((3 * Math.PI) / 180);
  const WB = { th: 0.12, cb: 0.035, nChord: 22, uvScale: 0.38 };
  // upper: one panel tip to tip (yellow), red tips; lower: two panels from the fuselage's flanks, 3 deg of dihedral
  wingPanel({ x0: -HS + 0.6, x1: HS - 0.6, chord: () => CH, zLE: () => ULE, y: () => UY, tip0: 0, tip1: 0, nSpan: 60, mat: mats.wing, name: "upper wing", ...WB });
  for (const s of [-1, 1]) {
    const a = s > 0 ? HS - 0.6 : -HS, b = s > 0 ? HS : -HS + 0.6;
    wingPanel({ x0: a, x1: b, chord: () => CH, zLE: () => ULE, y: () => UY, tip0: s < 0 ? 0.45 : 0, tip1: s > 0 ? 0.45 : 0, nSpan: 14, mat: mats.wingRed, name: "upper wing tip", ...WB });
    const x0 = s * 0.44, x1 = s * (HS - 0.6), lo = Math.min(x0, x1), hi = Math.max(x0, x1), ly = (x) => LY + (Math.abs(x) - 0.44) * DIH;
    wingPanel({ x0: lo, x1: hi, chord: () => CH, zLE: () => LLE, y: ly, tip0: 0, tip1: 0, nSpan: 50, mat: mats.wing, name: "lower wing", ...WB });
    const t0 = s > 0 ? HS - 0.6 : -HS, t1 = s > 0 ? HS : -HS + 0.6;
    wingPanel({ x0: t0, x1: t1, chord: () => CH, zLE: () => LLE, y: ly, tip0: s < 0 ? 0.45 : 0, tip1: s > 0 ? 0.45 : 0, nSpan: 14, mat: mats.wingRed, name: "lower wing tip", ...WB });
    // the ailerons' hinge lines (upper and lower, outboard)
    for (const [y0, le, dy] of [[UY, ULE, 0], [LY, LLE, DIH]]) { const pts = []; for (let k = 0; k <= 20; k++) { const x = s * lerp(2.4, HS - 0.25, k / 20), yy = y0 + (Math.abs(x) - 0.44) * dy; pts.push({ p: V3(x, yy + 0.035, le - CH * 0.74), n: V3(0, 1, 0) }); } ribbon(pts, 0.006, 0.0, mats.gap, "aileron hinge"); for (const xx of [2.4, HS - 0.25]) { const x = s * xx, yy = y0 + (Math.abs(x) - 0.44) * dy; ribbon([{ p: V3(x, yy + 0.04, le - CH * 0.74), n: V3(0, 1, 0) }, { p: V3(x, yy + 0.02, le - CH), n: V3(0, 1, 0) }], 0.006, 0, mats.gap, "aileron hinge"); } }
  }
  // the interplane N struts (two legs and the diagonal), the cabane struts, the flying and landing wires
  const SX = 3.05, ly = (x) => LY + (Math.abs(x) - 0.44) * DIH;
  for (const s of [-1, 1]) {
    const x = s * SX, fL = V3(x, ly(x) + 0.05, LLE - 0.25), rL = V3(x, ly(x) + 0.05, LLE - 0.95), fU = V3(x, UY - 0.02, ULE - 0.25), rU = V3(x, UY - 0.02, ULE - 0.95);
    for (const [a, b] of [[fL, fU], [rL, rU], [fL, rU]]) { const m = rod(a, b, 0.03, mats.strut, "interplane strut", { seg: 14 }); m.scale.set(1, 1, 0.45); }
    for (const [a, b] of [[V3(s * 0.25, 2.1, 0.45), V3(s * 0.45, UY - 0.03, ULE - 0.25)], [V3(s * 0.25, 2.1, -0.35), V3(s * 0.45, UY - 0.03, ULE - 0.95)], [V3(s * 0.25, 2.1, 0.45), V3(s * 0.45, UY - 0.03, ULE - 0.95)]]) rod(a, b, 0.022, mats.strut, "cabane strut");
    // the wires: flying wires from the lower roots up to the struts' tops, landing wires from the cabane to the struts' feet, doubled
    for (const dz of [-0.03, 0.03]) {
      for (const [a, b] of [[V3(s * 0.45, LY + 0.04, LLE - 0.3 + dz), V3(x, UY - 0.04, ULE - 0.3 + dz)], [V3(s * 0.45, LY + 0.04, LLE - 0.9 + dz), V3(x, UY - 0.04, ULE - 0.9 + dz)], [V3(s * 0.45, UY - 0.04, ULE - 0.3 + dz), V3(x, ly(x) + 0.06, LLE - 0.3 + dz)], [V3(s * 0.45, UY - 0.04, ULE - 0.9 + dz), V3(x, ly(x) + 0.06, LLE - 0.9 + dz)]]) rod(a, b, 0.0035, mats.wire, "wire", { seg: 5 });
    }
    // the cross wires in the bay between the front and the rear struts
    rod(fL, rU, 0.0035, mats.wire, "wire", { seg: 5 }); rod(rL, fU, 0.0035, mats.wire, "wire", { seg: 5 });
  }
  // the spray bar under the lower wing's trailing edge, its nozzles, the wind-driven pump under the fuselage
  { const zb = LLE - CH - 0.05; for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 30; k++) { const x = s * lerp(0.4, HS - 0.8, k / 30); pts.push(V3(x, ly(x) - 0.12, zb)); } tube(pts, 0.016, mats.satin, "spray bar", { seg: 30, rs: 10 }); for (let k = 0; k < 18; k++) { const x = s * lerp(0.6, HS - 0.9, k / 17); rod([x, ly(x) - 0.12, zb], [x, ly(x) - 0.2, zb - 0.02], 0.008, mats.darkMetal, "nozzle", { seg: 6 }); } for (const xx of [1.5, 3.4]) { const x = s * xx; rod([x, ly(x) - 0.12, zb], [x, ly(x) - 0.01, zb + 0.08], 0.01, mats.satin, "bar hanger", { seg: 6 }); } }
    tube([[0, 1.12, -0.3], [0, 1.0, -0.3], [0, 1.0, zb + 0.1], [0, ly(0.4) - 0.12, zb]], 0.02, mats.satin, "feed pipe", { seg: 20 });
    { const g = new T.CylinderGeometry(0.07, 0.09, 0.28, 18); g.rotateX(Math.PI / 2); g.translate(0, 0.98, 0.25); add(g, mats.darkMetal, "pump"); const pp = new T.BoxGeometry(0.34, 0.03, 0.01); pp.translate(0, 0.98, 0.4); add(pp, mats.wood, "pump propeller"); } }
  // ================= the tail: the stabiliser and elevators, the fin and the red rudder =================
  { const zs = -4.75, ys = 1.97;
    for (const s of [-1, 1]) { const lo = s > 0 ? 0.08 : -1.65, hi = s > 0 ? 1.65 : -0.08; wingPanel({ x0: lo, x1: hi, chord: (x) => lerp(0.95, 0.72, Math.abs(x) / 1.65), zLE: (x) => zs + 0.45 - 0.15 * (Math.abs(x) / 1.65), y: () => ys, th: 0.09, cb: 0, tip0: s < 0 ? 0.3 : 0, tip1: s > 0 ? 0.3 : 0, nSpan: 16, nChord: 14, mat: mats.wing, name: "stabiliser", uvScale: 0.38 });
      ribbon(Array.from({ length: 12 }, (_, k) => ({ p: V3(s * lerp(0.1, 1.5, k / 11), ys + 0.025, zs - 0.15), n: V3(0, 1, 0) })), 0.006, 0, mats.gap, "elevator hinge");
      rod([s * 0.06, 1.8, zs - 0.1], [s * 0.9, ys - 0.01, zs - 0.05], 0.01, mats.strut, "stabiliser strut"); }
    // fin (yellow) and rudder (red): profiles extruded thin
    sideExtrude([[zs + 0.5, ys], [zs - 0.25, ys], [zs - 0.3, ys + 0.8], [zs - 0.1, ys + 0.83], [zs + 0.2, ys + 0.5]], 0.07, mats.wing, "fin", { bevel: 0.02 });
    sideExtrude([[zs - 0.25, 1.78], [zs - 0.75, 1.82], [zs - 0.82, ys + 0.5], [zs - 0.6, ys + 0.88], [zs - 0.3, ys + 0.85], [zs - 0.25, ys + 0.76]], 0.05, mats.red, "rudder", { bevel: 0.015 });
  }
  // ================= the undercarriage: oleo legs and radius rods to the axles, the tail skid =================
  const R = DIM.tyreR, TX = DIM.track / 2;
  for (const s of [-1, 1]) {
    rod([s * 0.42, 1.2, 0.15], [s * (TX - 0.12), R + 0.04, 0.0], 0.045, mats.paint, "gear leg", { seg: 16 });
    rod([s * 0.3, 1.15, -0.45], [s * (TX - 0.12), R + 0.04, 0.0], 0.025, mats.strut, "radius rod");
    rod([s * 0.1, 1.13, 0.0], [s * (TX - 0.12), R + 0.02, 0.0], 0.025, mats.strut, "axle strut");
  }
  rod([0, 1.78, -5.05], [0, 1.45, -5.3], 0.025, mats.strut, "tail skid"); { const g = new T.SphereGeometry(0.04, 12, 8); g.translate(0, 1.44, -5.31); add(g, mats.darkMetal, "skid shoe"); }
  const wheels = [];
  for (const s of [1, -1]) {
    const w = buildWheel(T, mats, s, { R, W: 0.2, rr: 0.16, style: "plane", rimMat: mats.rimRed, capMat: mats.chrome, bulge: 0.025, shoulder: 0.06, grooves: [] });
    w.position.set(s * TX, R, 0); group.add(w); wheels.push(w);
  }
  const body = new T.Group(); body.name = "body";
  for (const c of group.children.slice()) if (c.name !== "wheel") body.add(c);
  group.add(body);
  return { group, body, wheels, mats, tex, parts: { propeller: prop }, DIM };
}
