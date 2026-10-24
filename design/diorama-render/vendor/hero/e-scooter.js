// Cromatic · hero vehicles (Radu): the E-scooter, a commuter electric kick scooter in the map's colours ("scooter"
// ride): an aluminium deck with the battery inside, a black grip mat, a yellow line along each side, the folding neck
// and latch, a raked stem to a T bar with grips, brake lever, thumb throttle, bell and display, a headlamp on the stem,
// 8.5" pneumatic tyres on five-spoke wheels (a hub motor in the front, a disc brake in the back), mudguards, the brake
// lamp in the rear guard's tail, a folding kickstand. Metres; origin on the ground under the middle of the wheelbase,
// +z forward, +y up, +x the rider's left.
//   buildEScooter(THREE, { RoundedBoxGeometry }) -> { group, body, wheels, mats, tex, parts, DIM }
//   parts.steer: the fork, stem and bar (turn it about parts.steerAxis); the wheels stay the group's direct children
// Proportions of the type (a common commuter e-scooter): length 1.13, height 1.18 at the bar, bar 0.43 wide, deck
// 0.50 x 0.155 with its top 0.14 off the ground, wheelbase 0.86, tyres 8.5" (0.22 m across).
import { lerp, makeTex, baseMats, makeKit, buildWheel } from "./kit.js";

export const DIM = { L: 1.13, H: 1.18, bar: 0.43, WB: 0.86, deckTop: 0.14, tyreR: 0.11, zF: 0.43, zR: -0.43 };

export function buildEScooter(T, ext = {}) {
  const group = new T.Group(); group.name = "hero-e-scooter";
  const K = makeKit(T, group); K.setRB(ext.RoundedBoxGeometry);
  const { V3, add, rod, tube, rrShape, rbox, sideExtrude, latheZ } = K;
  const tex = makeTex(T), mats = baseMats(T, tex);
  Object.assign(mats, {
    yellow: new T.MeshPhysicalMaterial({ name: "paint", color: new T.Color("#FED012"), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
    alu: new T.MeshPhysicalMaterial({ name: "aluminium", color: new T.Color("#c9ccd1"), roughness: 0.34, metalness: 0.85, clearcoat: 0.4, clearcoatRoughness: 0.2, side: T.DoubleSide }),
    dark: new T.MeshPhysicalMaterial({ name: "dark grey", color: new T.Color("#26282c"), roughness: 0.5, metalness: 0.3, side: T.DoubleSide }),
    grip: new T.MeshPhysicalMaterial({ name: "grip mat", color: new T.Color("#151515"), roughness: 0.9, metalness: 0, normalMap: tex.grip, normalScale: new T.Vector2(0.8, 0.8) }),
    rimDark: new T.MeshPhysicalMaterial({ name: "wheel", color: new T.Color("#2b2b2b"), roughness: 0.4, metalness: 0.5, side: T.DoubleSide }),
    screen: new T.MeshPhysicalMaterial({ name: "display", color: new T.Color("#0c1a20"), emissive: new T.Color("#7fe0ff"), emissiveIntensity: 0.6, roughness: 0.1 }),
    reflector: new T.MeshPhysicalMaterial({ name: "reflector", color: new T.Color("#e9e9ea"), roughness: 0.16, metalness: 1, side: T.DoubleSide }),
    disc: new T.MeshPhysicalMaterial({ name: "brake disc", color: new T.Color("#b9bcc2"), roughness: 0.3, metalness: 0.85 })
  });
  const { zF, zR } = DIM, R = DIM.tyreR;
  // ================= the deck: an aluminium slab (the battery inside), the grip mat, the yellow side lines =================
  sideExtrude([[-0.3, 0.075], [0.28, 0.075], [0.31, 0.09], [0.31, 0.138], [-0.3, 0.138], [-0.325, 0.12], [-0.325, 0.095]], 0.155, mats.alu, "deck", { bevel: 0.012 });
  { const g = new T.ShapeGeometry(rrShape(0.13, 0.52, 0.025), 6); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 8, uv.getY(i) * 30); g.translate(0, 0.1395, -0.015); add(g, mats.grip, "grip mat"); }
  for (const s of [-1, 1]) rbox(0.003, 0.011, 0.47, 0.001, mats.yellow, "side line", [s * 0.0785, 0.105, -0.01]);
  rbox(0.12, 0.015, 0.48, 0.005, mats.dark, "battery tray", [0, 0.068, -0.01]);
  // ================= the neck to the head tube, the folding latch =================
  sideExtrude([[0.22, 0.075], [0.31, 0.075], [0.42, 0.19], [0.42, 0.25], [0.375, 0.25], [0.24, 0.125], [0.22, 0.125]], 0.07, mats.alu, "neck", { bevel: 0.01 });
  { const m = rbox(0.056, 0.022, 0.045, 0.006, mats.dark, "latch", [0, 0.185, 0.365]); m.rotation.x = -0.8; }
  // ================= the rear: swingarm plates, the guard with the brake lamp, the kickstand =================
  for (const s of [-1, 1]) sideExtrude([[-0.27, 0.085], [-0.3, 0.1], [zR - 0.03, R + 0.02], [zR - 0.03, R - 0.02], [-0.3, 0.078]], 0.008, mats.alu, "swingarm", { x: s * 0.036, bevel: 0.002 });
  const guard = (cz, r, w, a0, a1, name) => { const g = new T.CylinderGeometry(r, r, w, 28, 1, true, a0, a1 - a0); g.rotateZ(Math.PI / 2); g.translate(0, R, cz); return add(g, mats.black, name); };
  guard(zR, R + 0.016, 0.064, Math.PI * 0.38, Math.PI * 1.06, "rear guard");
  { const g = new T.BoxGeometry(0.042, 0.014, 0.01); const m = add(g, mats.red, "tail red"); m.position.set(0, 0.143, zR - 0.119); m.rotation.x = -0.35; m.material = mats.red; }
  rod([-0.068, 0.072, -0.04], [-0.068, 0.066, -0.19], 0.0055, mats.dark, "kickstand");
  // ================= the steering: fork, head tube, stem, the bar and its controls, the headlamp =================
  const steer = new T.Group(); steer.name = "steer"; group.add(steer);
  const axisZ = (y) => zF - 0.16 * (y - R) / 0.99; // the steering axis, from the front axle up to the bar (about 9 degrees of rake)
  for (const s of [-1, 1]) rod([s * 0.037, R, zF], [s * 0.037, 0.24, axisZ(0.24)], 0.009, mats.dark, "fork leg", { parent: steer });
  { const m = rbox(0.092, 0.024, 0.04, 0.006, mats.dark, "fork crown", [0, 0.245, axisZ(0.245)], [0.16, 0, 0], steer); void m; }
  rod([0, 0.235, axisZ(0.235)], [0, 0.33, axisZ(0.33)], 0.026, mats.alu, "head tube", { parent: steer, seg: 20 });
  rod([0, 0.32, axisZ(0.32)], [0, 1.06, axisZ(1.06)], 0.019, mats.alu, "stem", { parent: steer, seg: 20 });
  rbox(0.05, 0.034, 0.046, 0.008, mats.dark, "bar clamp", [0, 1.075, axisZ(1.075)], null, steer);
  const bz = axisZ(1.08);
  rod([-0.215, 1.08, bz], [0.215, 1.08, bz], 0.011, mats.black, "bar", { parent: steer });
  for (const s of [-1, 1]) { const g = new T.CylinderGeometry(0.016, 0.016, 0.11, 18); g.rotateZ(Math.PI / 2); g.translate(s * 0.165, 1.08, bz); K.add(g, mats.rubber, "grip", steer); }
  rod([-0.125, 1.084, bz + 0.01], [-0.175, 1.072, bz + 0.062], 0.0045, mats.dark, "brake lever", { parent: steer, seg: 6 });
  rbox(0.016, 0.026, 0.006, 0.002, mats.dark, "throttle", [0.095, 1.073, bz + 0.016], null, steer);
  { const g = new T.SphereGeometry(0.014, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(-0.09, 1.09, bz); K.add(g, mats.chrome, "bell", steer); }
  rbox(0.064, 0.016, 0.046, 0.008, mats.black, "display body", [0, 1.098, bz], null, steer);
  { const g = new T.PlaneGeometry(0.042, 0.024); g.rotateX(-Math.PI / 2 + 0.35); g.translate(0, 1.107, bz + 0.002); K.add(g, mats.screen, "display", steer); }
  { const ly = 0.99, lz = axisZ(ly) + 0.022, L = new T.Group(); L.name = "headlamp"; L.position.set(0, ly, lz); L.rotation.x = 0.16; steer.add(L);
    latheZ([[0, -0.02], [0.016, -0.02], [0.022, -0.005], [0.022, 0.008], [0.019, 0.01]], mats.black, "headlamp body", { parent: L, seg: 28 });
    latheZ(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return [0.018 * Math.sqrt(t) + 0.0005, -0.012 + 0.016 * t]; }), mats.reflector, "reflector", { parent: L, seg: 28 });
    { const g = new T.CircleGeometry(0.018, 28); g.translate(0, 0, 0.007); K.add(g, mats.lens, "headlamp lens", L); } }
  { const g = new T.CylinderGeometry(R + 0.014, R + 0.014, 0.062, 28, 1, true, -Math.PI * 0.06, Math.PI * 0.64); g.rotateZ(Math.PI / 2); g.translate(0, R, zF); K.add(g, mats.black, "front guard", steer); }
  // ================= the wheels: the hub motor in the front, the disc brake in the back =================
  const wheels = [];
  for (const z of [zF, zR]) {
    const w = buildWheel(T, mats, 1, { R, W: 0.055, rr: 0.066, style: "scooter", rimMat: mats.rimDark, capMat: mats.yellow, shoulder: 0.014, bulge: 0.006, grooves: [0] });
    if (z === zF) { const hub = new T.CylinderGeometry(0.05, 0.05, 0.06, 28); hub.rotateZ(Math.PI / 2); const m = new T.Mesh(hub, mats.dark); m.name = "hub motor"; w.add(m); }
    else { const d = new T.CylinderGeometry(0.06, 0.06, 0.003, 32); d.rotateZ(Math.PI / 2); const m = new T.Mesh(d, mats.disc); m.position.x = 0.034; m.name = "brake disc"; w.add(m); }
    w.position.set(0, R, z); group.add(w); wheels.push(w);
  }
  const body = new T.Group(); body.name = "body";
  for (const c of group.children.slice()) if (c.name !== "wheel") body.add(c);
  group.add(body);
  return { group, body, wheels, mats, tex, parts: { steer, steerAxis: { origin: [0, R, zF], dir: [0, 0.99, -0.16] } }, DIM };
}
