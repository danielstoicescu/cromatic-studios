// Cromatic · hero vehicles (Radu): the E-scooter, a commuter electric kick scooter in the map's colours ("scooter"
// ride): an aluminium deck with the battery inside, a black grip mat, a yellow line along each side, the folding neck
// and latch, a raked stem to a T bar with grips, brake lever, thumb throttle, bell and display, a headlamp on the stem,
// 8.5" pneumatic tyres on five-spoke wheels (a hub motor in the front, a disc brake in the back), mudguards, the brake
// lamp in the rear guard's tail, a folding kickstand. Metres; origin on the ground under the middle of the wheelbase,
// +z forward, +y up, +x the rider's left.
//   buildEScooter(THREE, { RoundedBoxGeometry }) -> { group, body, wheels, mats, tex, parts, DIM }
//   parts.steer: the fork, stem, bar AND the front wheel (v3): set parts.steer.rotation.y to steer (radians, + = to the
//   rider's left) - its frame turns about the steering axis (parts.steerAxis). wheels[0] (the front) is inside it;
//   wheels[1] (the rear) stays the group's direct child. Both are named "wheel" and spin with rotation.x as before.
// Proportions of the type (a common commuter e-scooter): length 1.13, height 1.18 at the bar, bar 0.43 wide, deck
// 0.50 x 0.155 with its top 0.14 off the ground, wheelbase 0.86, tyres 8.5" (0.22 m across).
import { lerp, makeTex, baseMats, makeKit, buildWheel, dBrake } from "./kit.js";

export const DIM = { L: 1.13, H: 1.17, bar: 0.43, barY: 1.14, WB: 0.86, deckTop: 0.14, tyreR: 0.11, zF: 0.43, zR: -0.43 };

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
    screen: (() => { const t = displayTex(T); return new T.MeshPhysicalMaterial({ name: "display", color: new T.Color("#ffffff"), map: t, emissive: new T.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 0.55, roughness: 0.08, clearcoat: 1 }); })(),
    cable: new T.MeshPhysicalMaterial({ name: "cable", color: new T.Color("#0e0e0f"), roughness: 0.5, metalness: 0, clearcoat: 0.4 }),
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
  // v3: the steering turns about the head's axis: pivot (on the axis, tilted to it) -> steer (rotation.y = the angle)
  // -> inner (undoes the pivot: the parts below are built in the group's own frame); the front wheel goes in too
  const rake = Math.atan2(0.16, 0.99), pivot = new T.Group(); pivot.name = "steer pivot"; pivot.position.set(0, R, zF); pivot.rotation.x = -rake; group.add(pivot);
  const steerG = new T.Group(); steerG.name = "steer"; pivot.add(steerG);
  const steer = new T.Group(); steer.name = "steer frame"; steer.rotation.x = rake; steer.position.copy(new T.Vector3(0, -R, -zF).applyAxisAngle(new T.Vector3(1, 0, 0), rake)); steerG.add(steer);
  const axisZ = (y) => zF - 0.16 * (y - R) / 0.99; // the steering axis, from the front axle up to the bar (about 9 degrees of rake)
  for (const s of [-1, 1]) rod([s * 0.037, R, zF], [s * 0.037, 0.24, axisZ(0.24)], 0.009, mats.dark, "fork leg", { parent: steer });
  { const m = rbox(0.092, 0.024, 0.04, 0.006, mats.dark, "fork crown", [0, 0.245, axisZ(0.245)], [0.16, 0, 0], steer); void m; }
  rod([0, 0.235, axisZ(0.235)], [0, 0.33, axisZ(0.33)], 0.026, mats.alu, "head tube", { parent: steer, seg: 20 });
  // v3: the bar at 1.14 m (the type's), the stem longer to suit
  const BY = DIM.barY;
  rod([0, 0.32, axisZ(0.32)], [0, BY - 0.02, axisZ(BY - 0.02)], 0.019, mats.alu, "stem", { parent: steer, seg: 20 });
  rbox(0.05, 0.034, 0.046, 0.008, mats.dark, "bar clamp", [0, BY - 0.005, axisZ(BY - 0.005)], null, steer);
  const bz = axisZ(BY);
  rod([-0.215, BY, bz], [0.215, BY, bz], 0.011, mats.black, "bar", { parent: steer });
  for (const s of [-1, 1]) { const g = new T.CylinderGeometry(0.016, 0.016, 0.11, 18); g.rotateZ(Math.PI / 2); g.translate(s * 0.165, BY, bz); K.add(g, mats.rubber, "grip", steer); const e = new T.CylinderGeometry(0.018, 0.018, 0.012, 18); e.rotateZ(Math.PI / 2); e.translate(s * 0.226, BY, bz); K.add(e, mats.dark, "bar end", steer); }
  rbox(0.03, 0.03, 0.03, 0.008, mats.dark, "lever clamp", [-0.115, BY, bz], null, steer);
  rod([-0.125, BY + 0.004, bz + 0.01], [-0.18, BY - 0.008, bz + 0.064], 0.0045, mats.dark, "brake lever", { parent: steer, seg: 6 });
  rbox(0.016, 0.026, 0.006, 0.002, mats.dark, "throttle", [0.095, BY - 0.007, bz + 0.016], null, steer);
  { const g = new T.SphereGeometry(0.014, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(-0.085, BY + 0.01, bz); K.add(g, mats.chrome, "bell", steer); }
  // the display: a pod on the clamp, a canvas screen (speed, battery, mode), a little glass
  rbox(0.072, 0.02, 0.05, 0.009, mats.black, "display body", [0, BY + 0.02, bz], null, steer);
  { const g = new T.PlaneGeometry(0.056, 0.034); g.rotateX(-Math.PI / 2 + 0.35); g.translate(0, BY + 0.0335, bz + 0.002); K.add(g, mats.screen, "display", steer); }
  // the brake cable: out of the lever, a loop forward, down the stem's front in two clips, into the deck's neck, along
  // under the deck to the rear caliper
  { const c = (x, y, z) => [x, y, z]; tube([c(-0.15, BY + 0.0, bz + 0.03), c(-0.13, BY + 0.03, bz + 0.09), c(-0.04, BY - 0.06, axisZ(BY - 0.06) + 0.04), c(-0.022, 0.8, axisZ(0.8) + 0.024), c(-0.022, 0.45, axisZ(0.45) + 0.026), c(-0.02, 0.3, axisZ(0.3) + 0.03)], 0.0028, mats.cable, "brake cable", { parent: steer, seg: 80, rs: 6 });
    for (const y of [0.8, 0.5]) { const g = new T.TorusGeometry(0.021, 0.003, 6, 18); g.rotateX(Math.PI / 2 - rake); g.translate(0, y, axisZ(y)); K.add(g, mats.dark, "cable clip", steer); }
    tube([c(-0.02, 0.24, 0.36), c(-0.05, 0.12, 0.28), c(-0.07, 0.07, 0.1), c(-0.07, 0.07, -0.25), c(-0.045, 0.1, zR + 0.06)], 0.0028, mats.cable, "brake cable"); }
  { const ly = 1.04, lz = axisZ(ly) + 0.022, L = new T.Group(); L.name = "headlamp"; L.position.set(0, ly, lz); L.rotation.x = 0.16; steer.add(L);
    latheZ([[0, -0.02], [0.016, -0.02], [0.022, -0.005], [0.022, 0.008], [0.019, 0.01]], mats.black, "headlamp body", { parent: L, seg: 28 });
    latheZ(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return [0.018 * Math.sqrt(t) + 0.0005, -0.012 + 0.016 * t]; }), mats.reflector, "reflector", { parent: L, seg: 28 });
    { const g = new T.CircleGeometry(0.018, 28); g.translate(0, 0, 0.007); K.add(g, mats.lens, "headlamp lens", L); } }
  { const g = new T.CylinderGeometry(R + 0.014, R + 0.014, 0.062, 28, 1, true, -Math.PI * 0.06, Math.PI * 0.64); g.rotateZ(Math.PI / 2); g.translate(0, R, zF); K.add(g, mats.black, "front guard", steer); }
  // ================= the wheels: the hub motor in the front, the disc brake in the back =================
  const wheels = [];
  for (const z of [zF, zR]) {
    const w = buildWheel(T, mats, 1, { R, W: 0.055, rr: 0.066, style: "scooter", rimMat: mats.rimDark, capMat: mats.yellow, shoulder: 0.014, bulge: 0.006, grooves: [0], spec: "8 1/2 x 2", sub: "PNEUMATIC  50 PSI", bumpScale: 1.2 });
    if (z === zF) { const hub = new T.CylinderGeometry(0.05, 0.05, 0.06, 28); hub.rotateZ(Math.PI / 2); const m = new T.Mesh(hub, mats.dark); m.name = "hub motor"; w.add(m); }
    else { dBrake(T, w, { type: "disc", r: 0.06, w: 0.003, x: 0.034, mats }); }
    w.position.set(0, R, z); (z === zF ? steer : group).add(w); wheels.push(w);
  }
  // the rear caliper (on the swingarm, not turning), its cable's banjo
  rbox(0.014, 0.03, 0.026, 0.004, mats.dark, "brake caliper", [0.034, R + 0.052, zR + 0.012]);
  const body = new T.Group(); body.name = "body";
  for (const c of group.children.slice()) if (c.name !== "wheel") body.add(c);
  group.add(body);
  return { group, body, wheels, mats, tex, parts: { steer: steerG, steerAxis: { origin: [0, R, zF], dir: [0, 0.99, -0.16] } }, DIM };
}

// v3: the display's screen: speed in big digits, km/h, five battery bars, the mode, a headlamp icon (dark ground, cyan)
function displayTex(T) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 160; const x = c.getContext("2d");
  x.fillStyle = "#06121a"; x.fillRect(0, 0, 256, 160); x.fillStyle = "#8fe8ff"; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = "700 86px 'Helvetica Neue', Arial, sans-serif"; x.fillText("18", 112, 78); x.font = "600 20px 'Helvetica Neue', Arial, sans-serif"; x.fillText("km/h", 112, 132);
  for (let k = 0; k < 5; k++) { x.fillStyle = k < 4 ? "#8fe8ff" : "#1d3a46"; x.fillRect(206, 120 - k * 22, 32, 16); }
  x.fillStyle = "#ffd23a"; x.font = "700 22px 'Helvetica Neue', Arial, sans-serif"; x.fillText("D", 28, 30); x.fillStyle = "#8fe8ff"; x.beginPath(); x.arc(28, 128, 10, Math.PI * 0.5, Math.PI * 1.5); x.fill(); for (let k = 0; k < 3; k++) x.fillRect(42, 120 + k * 7, 12, 3);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
