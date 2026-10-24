// Cromatic · hero vehicles (Radu): the Classic Formula, a 1970s-style open-wheel single-seater in the map's red and
// white ("f1" ride), an original design with no team's livery or sponsors: a slim aluminium-skinned tub with a
// pointed nose and a two-plane front wing either side of it, flat-sided pods with radiator mouths, a tall airbox over
// the roll hoop, the engine bare behind it (cam covers, four-into-one exhausts), a high rear wing on a central pylon,
// wishbones and coil-over dampers in the open, slicks on cast wheels, the driver in a yellow helmet, 14 on the nose and
// on the airbox. Metres; origin on the ground under the middle of the wheelbase, +z forward, +y up, +x the car's left.
//   buildClassicFormula(THREE, { RoundedBoxGeometry }) -> { group, body, wheels, mats, tex, parts, DIM }
// Proportions of the type (a late-1970s Formula 1 car): length 4.30, width 2.03 over the rear wheels, height 0.99 at
// the airbox, wheelbase 2.60, track 1.45 front and 1.52 rear, tyres 0.57 m x 0.26 front, 0.67 m x 0.45 rear.
import { pchip, clamp, lerp, sstep, makeTex, baseMats, makeKit, buildWheel } from "./kit.js";

export const DIM = { L: 4.3, W: 2.03, H: 0.99, WB: 2.6, trackF: 1.45, trackR: 1.52, zF: 1.3, zR: -1.3, tyreRF: 0.285, tyreRR: 0.335 };

export function buildClassicFormula(T, ext = {}) {
  const { zF, zR } = DIM;
  const group = new T.Group(); group.name = "hero-classic-formula";
  const K = makeKit(T, group); K.setRB(ext.RoundedBoxGeometry);
  const { V3, add, sweep, roundProf, rod, tube, latheZ, rrShape, rbox, gridGeo, ribbon, sideExtrude, airfoil, wingPanel } = K;
  const tex = makeTex(T), mats = baseMats(T, tex);
  const RED = "#F65342", WHITE = "#f6f5f1", YEL = "#FED012";
  const P = (name, color, o = {}) => new T.MeshPhysicalMaterial({ name, color: new T.Color(color), roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, side: T.DoubleSide, ...o });
  Object.assign(mats, {
    red: P("paint", RED), white: P("paint white", WHITE), helmet: P("helmet", YEL, { roughness: 0.2 }),
    visor: new T.MeshPhysicalMaterial({ name: "visor", color: new T.Color("#17191d"), roughness: 0.05, metalness: 0.4, clearcoat: 1 }),
    suit: new T.MeshPhysicalMaterial({ name: "race suit", color: new T.Color("#f2f0ea"), roughness: 0.8, metalness: 0 }),
    rim: new T.MeshPhysicalMaterial({ name: "magnesium wheel", color: new T.Color("#1c1c1c"), roughness: 0.4, metalness: 0.5, side: T.DoubleSide }),
    nut: P("wheel nut", YEL, { metalness: 0.3 }),
    screen: new T.MeshPhysicalMaterial({ name: "glass", color: new T.Color("#d8dde0"), roughness: 0.02, metalness: 0, transmission: 0.9, ior: 1.49, thickness: 0.003, transparent: true, side: T.DoubleSide }),
    mesh: new T.MeshPhysicalMaterial({ name: "radiator mesh", color: new T.Color("#141414"), roughness: 0.6, metalness: 0.4, normalMap: tex.prisms, normalScale: new T.Vector2(0.6, 0.6) }),
    num: new T.MeshPhysicalMaterial({ name: "number", map: numTex(T, tex, "#ffffff", "rgba(20,20,20,.55)"), alphaTest: 0.5, roughness: 0.28, clearcoat: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    numDark: new T.MeshPhysicalMaterial({ name: "number dark", map: numTex(T, tex, "#141414", "rgba(255,255,255,0)"), alphaTest: 0.5, roughness: 0.28, clearcoat: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: T.FrontSide })
  });

  // ================= the tub: a loft of rounded sections from the nose's tip to the back of the cockpit =================
  const loft = (z0, z1, W, YT, YB, N, mat, name, { cut = null, nc = 24, step = 0.02, flip = false } = {}) => {
    const ZS = []; for (let z = z0; z <= z1 + 1e-9; z += step) ZS.push(Math.min(z, z1)); if (ZS[ZS.length - 1] < z1) ZS.push(z1);
    const TH = Array.from({ length: nc + 1 }, (_, j) => -Math.PI / 2 + (j / nc) * Math.PI);
    const pt = (z, th) => { const n = N(z), c = Math.cos(th), s = Math.sin(th), yc = (YT(z) + YB(z)) / 2, h = (YT(z) - YB(z)) / 2; return [W(z) * Math.pow(Math.abs(c), 2 / n), yc + h * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; };
    for (const sx of [1, -1]) add(gridGeo(ZS.length, nc + 1, (i, j) => { const [x, y] = pt(ZS[i], TH[j]); return [sx * x, y, ZS[i]]; }, cut ? (i, j) => !cut((ZS[i] + ZS[i + 1]) / 2, (TH[j] + TH[j + 1]) / 2) : null, sx > 0 !== flip), mat, name);
    return pt;
  };
  const ZTIP = 2.02, ZCB = -0.42; // the nose's tip, the cockpit's back bulkhead
  const tW = pchip([[ZCB, 0.37], [0.3, 0.34], [0.55, 0.27], [1.0, 0.22], [1.5, 0.165], [1.85, 0.12], [1.98, 0.075], [ZTIP, 0.03]]);
  const tYT = pchip([[ZCB, 0.6], [0.42, 0.6], [0.62, 0.56], [1.2, 0.43], [1.7, 0.33], [1.96, 0.25], [ZTIP, 0.2]]);
  const tYB = pchip([[ZCB, 0.075], [1.6, 0.085], [1.96, 0.12], [ZTIP, 0.15]]);
  const cockpit = (z, th) => z > -0.38 && z < 0.36 && th > 0.95;
  const tub = loft(ZCB, ZTIP, tW, tYT, tYB, (z) => lerp(2.4, 3.2, sstep(1.9, 1.2, z)), mats.red, "tub", { cut: cockpit, step: 0.02 });
  { const g = new T.SphereGeometry(0.04, 16, 10); g.scale(0.8, 0.6, 0.8); g.translate(0, 0.175, ZTIP - 0.005); add(g, mats.red, "nose tip"); }
  // the cockpit: its padded rim, the seat's back, the small curved screen on the cowl
  { const pts = []; const th = 0.97; for (let k = 0; k <= 16; k++) { const z = lerp(0.36, -0.38, k / 16), [x, y] = tub(z, th); pts.push(V3(x, y + 0.004, z)); } for (let k = 1; k < 10; k++) { const t = k / 10, [x, y] = tub(-0.38, th); pts.push(V3(lerp(x, -x, t), y + 0.01, -0.39 - 0.03 * Math.sin(t * Math.PI))); } for (let k = 0; k <= 16; k++) { const z = lerp(-0.38, 0.36, k / 16), [x, y] = tub(z, th); pts.push(V3(-x, y + 0.004, z)); } for (let k = 1; k < 10; k++) { const t = k / 10, [x, y] = tub(0.36, th); pts.push(V3(lerp(-x, x, t), y + 0.03 * Math.sin(t * Math.PI), 0.37)); } tube(pts, 0.018, mats.black, "cockpit rim", { seg: 140, closed: true }); }
  { const g = new T.PlaneGeometry(0.62, 0.8); g.rotateX(-Math.PI / 2); g.translate(0, 0.1, 0.0); add(g, mats.black, "cockpit floor"); }
  { const sh = new T.Shape(); sh.moveTo(-0.25, 0); sh.quadraticCurveTo(0, 0.14, 0.25, 0); sh.lineTo(0.22, -0.02); sh.lineTo(-0.22, -0.02); const g = new T.ShapeGeometry(sh, 16); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, -0.06 * (p.getX(i) / 0.25) ** 2); g.computeVertexNormals(); const m = add(g, mats.screen, "screen"); m.position.set(0, 0.6, 0.39); m.rotation.x = -0.5; }
  // the driver (v2): a full-face yellow helmet (an egg with a chin bar), a smoked visor, a red stripe, the collar, white
  // overalls with harness straps, arms bent at the elbows to gloves on a small suede-rimmed wheel, a red headrest
  { const H = new T.Group(); H.name = "driver"; group.add(H);
    const hp = V3(0, 0.79, -0.13), hs = [1, 1.04, 1.16];
    const hm = K.add(new T.SphereGeometry(0.13, 40, 28), mats.helmet, "helmet", H); hm.scale.set(...hs); hm.position.copy(hp);
    const chin = K.add(new T.SphereGeometry(0.1, 28, 16, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.3), mats.helmet, "helmet chin", H); chin.scale.set(1.25, 1.1, 1.45); chin.position.copy(hp).add(V3(0, -0.012, 0.01));
    const vs = K.add(new T.SphereGeometry(0.1335, 40, 12, Math.PI * 0.22, Math.PI * 0.56, Math.PI * 0.36, Math.PI * 0.16), mats.visor, "visor", H); vs.scale.set(...hs); vs.position.copy(hp); // (phi 0.5 pi is +z: ahead)
    for (const [ph, t0, tl] of [[0.5, 0, 0.35], [1.5, 0, 0.66]]) { const st = K.add(new T.SphereGeometry(0.1315, 4, 16, Math.PI * ph - 0.06, 0.12, t0, Math.PI * tl), mats.red, "helmet stripe", H); st.scale.set(...hs); st.position.copy(hp); }
    { const g = new T.CylinderGeometry(0.075, 0.09, 0.07, 24); g.translate(0, 0.67, -0.15); K.add(g, mats.black, "collar", H); }
    rbox(0.4, 0.16, 0.22, 0.07, mats.suit, "shoulders", [0, 0.6, -0.2], null, H);
    for (const s of [-1, 1]) { rbox(0.04, 0.17, 0.012, 0.004, mats.black, "harness", [s * 0.09, 0.62, -0.085], [0.25, 0, 0], H); }
    const sw = new T.Group(); sw.position.set(0, 0.6, 0.22); sw.rotation.x = -0.35; H.add(sw);
    K.add(new T.TorusGeometry(0.13, 0.014, 12, 48), mats.black, "steering wheel", sw);
    for (let k = 0; k < 3; k++) { const b = new T.BoxGeometry(0.012, 0.12, 0.006); b.translate(0, -0.06, 0); const m = K.add(b, mats.satin, "steering spoke", sw); m.rotation.z = (k / 3) * Math.PI * 2; }
    for (const s of [-1, 1]) {
      const sh = V3(s * 0.18, 0.62, -0.2), el = V3(s * 0.2, 0.52, -0.02), hd = new T.Vector3(s * 0.12, 0, 0).applyEuler(sw.rotation).add(sw.position);
      rod(sh, el, 0.04, mats.suit, "upper arm", { parent: H, r2: 0.045 }); rod(el, hd, 0.035, mats.suit, "forearm", { parent: H, r2: 0.04 });
      { const g = new T.SphereGeometry(0.042, 14, 10); g.translate(el.x, el.y, el.z); K.add(g, mats.suit, "elbow", H); }
      { const g = new T.SphereGeometry(0.036, 14, 10); g.scale(1, 0.85, 1.2); g.translate(hd.x, hd.y, hd.z); K.add(g, mats.black, "glove", H); }
    }
    rbox(0.2, 0.12, 0.08, 0.035, mats.red, "headrest", [0, 0.68, -0.36], [0.1, 0, 0]); }
  // the number on the nose (white on red), laid on its top
  { const g = new T.PlaneGeometry(0.22, 0.165, 6, 4); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = 1.55 + p.getZ(i), x = p.getX(i); const h = tYT(z), w = tW(z); p.setXYZ(i, x, h - (h - (tYT(z) + tYB(z)) / 2) * (1 - Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / w, 3)), 1 / 3)) * 0 + 0.002, z); } g.computeVertexNormals(); add(g, mats.num, "number nose"); }

  // ================= the front wing: two planes either side of the nose, endplates, the flap =================
  for (const s of [-1, 1]) {
    const x0 = s * 0.1, x1 = s * 0.74, a = Math.min(x0, x1), b = Math.max(x0, x1);
    wingPanel({ x0: a, x1: b, chord: () => 0.34, zLE: () => 2.0, y: () => 0.12, th: 0.1, cb: 0.05, tip0: 0, tip1: 0, nSpan: 10, mat: mats.white, name: "front wing" });
    wingPanel({ x0: a + (s > 0 ? 0.08 : 0), x1: b - (s < 0 ? 0.08 : 0), chord: () => 0.16, zLE: () => 1.68, y: () => 0.175, th: 0.09, cb: 0.04, tip0: 0, tip1: 0, nSpan: 8, mat: mats.red, name: "front wing flap" });
    sideExtrude([[2.04, 0.06], [1.6, 0.06], [1.56, 0.12], [1.58, 0.27], [1.72, 0.29], [2.04, 0.18]], 0.012, mats.red, "front endplate", { x: s * 0.745, bevel: 0.003 });
  }
  // ================= the pods: flat-sided, radiator mouths in front, the top sloping back =================
  for (const s of [-1, 1]) {
    // v2: a shaped pod, lofted: rounded sections, the top crowned and falling to the back, the outer flank waisted in
    // (coke bottle) behind the mouth; the radiator inlet a recessed duct with a black lip and the core inside
    const PZ0 = -1.08, PZ1 = 0.46, NCP = 44;
    const pW = pchip([[PZ0, 0.09], [-0.8, 0.15], [-0.4, 0.19], [0.2, 0.205], [PZ1, 0.2]]), pX = pchip([[PZ0, 0.4], [-0.6, 0.5], [0.0, 0.56], [PZ1, 0.565]]);
    const pT = pchip([[PZ0, 0.22], [-0.7, 0.3], [-0.2, 0.39], [0.25, 0.43], [PZ1, 0.415]]), pB = () => 0.1, pN = (z) => lerp(3.0, 4.2, sstep(PZ0, 0.0, z));
    const ring = (z, k = 1) => Array.from({ length: NCP + 1 }, (_, j) => { const th = (j / NCP) * Math.PI * 2, n = pN(z), cc = Math.cos(th), ss = Math.sin(th), yc = (pT(z) + pB(z)) / 2, h = ((pT(z) - pB(z)) / 2) * k; return [s * (pX(z) + pW(z) * k * Math.sign(cc) * Math.pow(Math.abs(cc), 2 / n)), yc + h * Math.sign(ss) * Math.pow(Math.abs(ss), 2 / n)]; });
    const PZS = []; for (let z = PZ0; z <= PZ1 + 1e-9; z += 0.03) PZS.push(Math.min(z, PZ1)); if (PZS[PZS.length - 1] < PZ1) PZS.push(PZ1);
    const R2 = PZS.map((z) => ring(z));
    add(gridGeo(PZS.length, NCP + 1, (i, j) => [R2[i][j][0], R2[i][j][1], PZS[i]], null, s < 0), mats.red, "pod");
    // the inlet: the skin turns in to a duct 0.82 of the mouth, 0.1 deep, the core at its bottom
    { const zs = [PZ1, PZ1 - 0.02, PZ1 - 0.1], ks = [1, 0.84, 0.82], RR = zs.map((z, i) => ring(PZ1, ks[i]));
      add(gridGeo(3, NCP + 1, (i, j) => [RR[i][j][0], RR[i][j][1], zs[i]], null, s > 0), mats.black, "inlet duct");
      const sh = new T.Shape(RR[2].map(([x, y]) => new T.Vector2(x, y))); const g = new T.ShapeGeometry(sh); g.translate(0, 0, PZ1 - 0.1); add(g, mats.mesh, "radiator core");
      tube(ring(PZ1, 0.99).map(([x, y]) => V3(x, y, PZ1 + 0.004)), 0.01, mats.black, "inlet lip", { seg: 90, closed: true, rs: 8 }); }
    { const r0 = ring(PZ0), n = r0.length, pos = [s * pX(PZ0), (pT(PZ0) + 0.1) / 2, PZ0 - 0.01], idx = []; for (let j = 0; j < n; j++) { pos.push(r0[j][0], r0[j][1], PZ0); if (j) idx.push(0, j, j + 1); } const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); add(g, mats.red, "pod tail"); }
    // the mirrors on stalks by the cockpit
    rod([s * 0.3, 0.55, 0.2], [s * 0.44, 0.66, 0.22], 0.008, mats.black, "mirror stalk");
    { const g = new T.SphereGeometry(0.05, 16, 12); g.scale(1.4, 0.8, 0.6); g.translate(s * 0.47, 0.68, 0.22); add(g, mats.red, "mirror"); const gl = new T.CircleGeometry(0.04, 20); gl.scale(1.4, 0.8, 1); gl.rotateY(Math.PI); gl.translate(s * 0.47, 0.68, 0.19); add(gl, mats.mirror, "mirror glass"); }
  }
  // ================= the airbox and the engine cover (white), the engine bare behind =================
  // v2: a sculpted airbox: round-shouldered, waisted behind the mouth, swelling over the engine and running down into a
  // low engine cover; the intake a raised oval mouth with a lip, black inside, a thin spine along the top
  const aW = pchip([[-1.55, 0.12], [-1.3, 0.17], [-1.0, 0.225], [-0.72, 0.2], [-0.52, 0.15], [-0.42, 0.145]]), aYT = pchip([[-1.55, 0.47], [-1.3, 0.54], [-1.0, 0.75], [-0.72, 0.92], [-0.52, 0.99], [-0.42, 0.995]]), aYB = () => 0.42;
  loft(-1.55, -0.42, aW, aYT, aYB, (z) => lerp(2.3, 2.9, sstep(-1.4, -0.6, z)), mats.white, "airbox", { step: 0.02, nc: 24 });
  { const mo = rrShape(0.25, 0.15, 0.07); const pts = mo.getSpacedPoints(80).map((v) => V3(v.x, 0.875 + v.y, -0.412)); tube(pts, 0.014, mats.white, "airbox lip", { seg: 120, closed: true, rs: 10 });
    const g = new T.ShapeGeometry(rrShape(0.24, 0.14, 0.065), 8); g.translate(0, 0.875, -0.45); add(g, mats.black, "airbox mouth");
    const d = new T.ExtrudeGeometry(rrShape(0.25, 0.15, 0.07), { depth: 0.04, bevelEnabled: false }); d.translate(0, 0.875, -0.452); const dm = add(d, mats.black, "airbox duct"); dm.material = mats.black; }
  { const pts = []; for (let k = 0; k <= 30; k++) { const z = lerp(-1.45, -0.46, k / 30); pts.push(V3(0, aYT(z) + 0.004, z)); } tube(pts, 0.007, mats.white, "airbox spine", { seg: 40, rs: 8 }); }
  // the roll hoop under the airbox's front
  tube([[-0.16, 0.55, -0.44], [-0.14, 0.9, -0.44], [0.14, 0.9, -0.44], [0.16, 0.55, -0.44]], 0.02, mats.satin, "roll hoop", { seg: 30 });
  // the numbers on the airbox's flanks
  for (const s of [-1, 1]) { const g = new T.PlaneGeometry(0.2, 0.15); g.rotateY(s * Math.PI / 2); const z = -0.78; g.translate(s * (aW(z) + 0.004), 0.68, z); add(g, mats.numDark, "number airbox"); }
  // the engine: a block, two cam covers in a V, the trumpets under the airbox, the gearbox, the oil tank
  rbox(0.46, 0.3, 0.7, 0.04, mats.engine, "engine block", [0, 0.3, -1.25]);
  for (const s of [-1, 1]) { const m = rbox(0.12, 0.08, 0.62, 0.03, mats.darkMetal, "cam cover", [s * 0.17, 0.5, -1.27]); m.rotation.z = -s * 0.5; }
  for (let k = 0; k < 8; k++) { const s = k % 2 ? 1 : -1, z = -1.0 - Math.floor(k / 2) * 0.13; rod([s * 0.06, 0.48, z], [s * 0.05, 0.6, z], 0.024, mats.satin, "intake trumpet", { r2: 0.03 }); }
  rbox(0.28, 0.24, 0.5, 0.04, mats.engine, "gearbox", [0, 0.3, -1.8]);
  { const g = new T.CylinderGeometry(0.09, 0.09, 0.22, 24); g.rotateZ(Math.PI / 2); g.translate(0, 0.42, -2.06); add(g, mats.darkMetal, "oil cooler"); }
  // four-into-one exhausts each side, sweeping out and back to a tail pipe under the wing
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) { const z = -0.98 - k * 0.14; tube([[s * 0.23, 0.36, z], [s * 0.34, 0.33, z - 0.04], [s * 0.36, 0.3, z - 0.3], [s * 0.3, 0.3, -1.75], [s * 0.26, 0.31, -1.95]], 0.019, mats.satin, "exhaust", { seg: 40, rs: 10 }); }
    tube([[s * 0.26, 0.31, -1.92], [s * 0.24, 0.32, -2.12]], 0.04, mats.satin, "tail pipe", { seg: 4, rs: 16 });
  }
  // ================= the rear wing: a high main plane (white), the flap (red), endplates (red), on a central pylon =================
  { const yW = 0.92, zW = -2.08;
    wingPanel({ x0: -0.55, x1: 0.55, chord: () => 0.34, zLE: () => zW + 0.17, y: () => yW, th: 0.13, cb: 0.06, tip0: 0, tip1: 0, nSpan: 16, mat: mats.white, name: "rear wing" });
    wingPanel({ x0: -0.55, x1: 0.55, chord: () => 0.17, zLE: () => zW - 0.1, y: () => yW + 0.09, th: 0.1, cb: 0.05, tip0: 0, tip1: 0, nSpan: 16, mat: mats.red, name: "rear wing flap" });
    for (const s of [-1, 1]) sideExtrude([[zW + 0.24, yW - 0.16], [zW - 0.3, yW - 0.16], [zW - 0.3, yW + 0.2], [zW + 0.24, yW + 0.12]], 0.014, mats.red, "rear endplate", { x: s * 0.56, bevel: 0.004 });
    sideExtrude([[-1.8, 0.4], [-2.02, 0.4], [-2.12, yW - 0.02], [-1.98, yW - 0.02]], 0.03, mats.black, "wing pylon", { bevel: 0.006 }); }
  // ================= the suspension: wishbones to the uprights, coil-over dampers =================
  const wF = DIM.trackF / 2, wR = DIM.trackR / 2;
  for (const s of [-1, 1]) {
    const up = (x, y, z) => V3(s * x, y, z);
    // front: upper and lower wishbones from the tub's flank to the upright, the push rod's damper inboard
    rbox(0.04, 0.2, 0.08, 0.01, mats.darkMetal, "upright", [s * (wF - 0.17), DIM.tyreRF, zF]);
    for (const [y0, y1] of [[0.14, 0.19], [0.34, 0.39]]) { rod(up(0.17, y0, zF + 0.17), up(wF - 0.18, y1, zF), 0.014, mats.darkMetal, "wishbone"); rod(up(0.17, y0, zF - 0.17), up(wF - 0.18, y1, zF), 0.014, mats.darkMetal, "wishbone"); }
    // v2: the coil-over in the open, from the lower wishbone near the upright up to a bracket on the tub's shoulder
    { const a = up(wF - 0.3, 0.18, zF - 0.05), b = up(0.2, 0.47, zF - 0.12), d = b.clone().sub(a);
      rod(a, b, 0.013, mats.satin, "damper"); rod(a, a.clone().addScaledVector(d, 0.45), 0.022, mats.darkMetal, "damper body");
      const g = new T.CylinderGeometry(0.034, 0.034, d.length() * 0.42, 18, 1, true); const m = add(g, mats.helmet, "spring"); m.position.copy(a).addScaledVector(d, 0.6); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
      for (let k = 0; k < 7; k++) { const t = new T.TorusGeometry(0.034, 0.0055, 6, 20); const tm = add(t, mats.helmet, "spring coil"); tm.position.copy(a).addScaledVector(d, 0.42 + k * 0.06); tm.quaternion.setFromUnitVectors(V3(0, 0, 1), d.clone().normalize()); }
      rbox(0.05, 0.05, 0.06, 0.01, mats.darkMetal, "damper bracket", [b.x, b.y, b.z]); }
    rod(up(0.16, 0.3, zF + 0.12), up(wF - 0.17, 0.3, zF + 0.1), 0.01, mats.darkMetal, "track rod");
    { const g = new T.BoxGeometry(0.05, 0.09, 0.12); g.translate(s * (wF - 0.2), DIM.tyreRF + 0.06, zF - 0.06); add(g, mats.red, "brake caliper"); }
    // rear: wide wishbones from the gearbox, the radius rods forward to the tub, the coil-overs
    rbox(0.05, 0.24, 0.12, 0.01, mats.darkMetal, "upright", [s * (wR - 0.24), DIM.tyreRR, zR]);
    for (const [y0, y1] of [[0.15, 0.2], [0.4, 0.44]]) { rod(up(0.14, y0, zR - 0.4), up(wR - 0.24, y1, zR), 0.012, mats.darkMetal, "wishbone"); rod(up(0.14, y0, zR + 0.1), up(wR - 0.24, y1, zR), 0.012, mats.darkMetal, "wishbone"); }
    rod(up(0.4, 0.2, -0.95), up(wR - 0.24, 0.22, zR), 0.012, mats.darkMetal, "radius rod");
    rod(up(0.2, 0.5, -1.55), up(wR - 0.3, 0.36, zR - 0.05), 0.03, mats.satin, "damper");
    { const g = new T.CylinderGeometry(0.035, 0.035, 0.14, 16, 1, true); const m = add(g, mats.helmet, "spring"); const a = up(0.2, 0.5, -1.55), b = up(wR - 0.3, 0.36, zR - 0.05), d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, 0.45); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); }
  }
  // ================= the wheels: slicks on cast magnesium wheels, yellow centre-lock nuts =================
  const wheels = [];
  for (const [sx, z, R, Wd, tr] of [[1, zF, DIM.tyreRF, 0.26, wF], [-1, zF, DIM.tyreRF, 0.26, wF], [1, zR, DIM.tyreRR, 0.45, wR], [-1, zR, DIM.tyreRR, 0.45, wR]]) {
    const w = buildWheel(T, mats, sx, { R, W: Wd, rr: 0.2, style: "racing", rimMat: mats.rim, capMat: mats.nut, shoulder: 0.035, bulge: 0.012, spokes: 10 });
    w.position.set(sx * tr, R, z); group.add(w); wheels.push(w);
  }
  const body = new T.Group(); body.name = "body";
  for (const c of group.children.slice()) if (c.name !== "wheel") body.add(c);
  group.add(body);
  return { group, body, wheels, mats, tex, parts: {}, DIM };
}

function numTex(T, tex, ink, edge) {
  return tex.colour(tex.cv(256, 192, (ctx) => { ctx.clearRect(0, 0, 256, 192); ctx.font = "italic 900 168px Helvetica, Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round"; ctx.lineWidth = 14; ctx.strokeStyle = edge; ctx.strokeText("14", 128, 104); ctx.fillStyle = ink; ctx.fillText("14", 128, 104); }));
}
