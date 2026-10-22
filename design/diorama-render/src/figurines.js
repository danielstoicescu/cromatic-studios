// Cromatic · diorama renders (TASK-118): people as model figurines (Preiser-style: sculpted, posed, hand-painted), for
// the diorama stories. Daniel on A6: "oamenii de la OMA nu sunt realiști". A model railway's figures do not move: each
// is a small sculpture in a held pose, its clothes, hair and face painted in satin enamels. So these do not walk or
// sway either: a pose is chosen once, and the camera's move does the rest.
//   figurine(K, opts) -> Group (feet at y 0, facing +z), opts:
//     h (height in map units, 29 = 1.75 m), sex "m" | "f", skin, hair, hairStyle "short" | "crop" | "bob" | "long" | "bun" |
//     "bald", beard, top (shirt colour), jacket (colour or null), bottom (trousers colour), skirt (colour or null),
//     legs (tights / skin under a skirt), shoes, apron, scarf, glasses, bag, pose (a name in POSES or a function)
//   K: three's classes (the map's own: window.__story.K)
// Proportions: about 7.6 heads; the joints (in a 29-unit body): ankle 1.2, knee 8, hip 14.6, waist 17.4, shoulder 23.5,
// chin 25.2, crown 29. Everything is built at 29 and scaled.
const R = (a) => (a * Math.PI) / 180;
export const POSES = {
  stand: {},
  standEasy: { hips: { z: R(3) }, hipL: { z: R(-4), x: R(3) }, hipR: { z: R(2), x: R(-6) }, kneeR: { x: R(12) }, spine: { z: R(-2) }, neck: { y: R(8) }, shL: { z: R(5) }, shR: { z: R(-6) }, elL: { x: R(-12) }, elR: { x: R(-10) } },
  // holding a cup at the chest, the other hand in a pocket, head turned
  cupTalk: { hips: { z: R(-3) }, hipL: { z: R(3), x: R(-4) }, hipR: { x: R(5) }, kneeL: { x: R(10) }, spine: { x: R(2), z: R(2) }, neck: { y: R(-28), x: R(4) }, shR: { x: R(-28), z: R(-8) }, elR: { x: R(-105), y: R(-10) }, shL: { x: R(8), z: R(10) }, elL: { x: R(-25) }, cup: "R" },
  // the barista at the machine: leaning in, both hands forward and down, head bent
  barista: { spine: { x: R(14) }, neck: { x: R(16), y: R(-6) }, shL: { x: R(-48), z: R(8) }, elL: { x: R(-62) }, shR: { x: R(-38), z: R(-6) }, elR: { x: R(-70), y: R(12) }, hipL: { x: R(-2) }, hipR: { x: R(4) } },
  // seated at a table: thighs forward, one hand on a cup on the table, the other in the lap
  sitCup: { sit: true, hipL: { x: R(-86), z: R(4) }, hipR: { x: R(-88), z: R(-3) }, kneeL: { x: R(84) }, kneeR: { x: R(92) }, spine: { x: R(6) }, neck: { x: R(6), y: R(10) }, shR: { x: R(-42), z: R(-6) }, elR: { x: R(-58) }, shL: { x: R(-14), z: R(8) }, elL: { x: R(-48) }, cup: "R" },
  // seated, leaning back, one arm over the chair's back, the other hand up (talking)
  sitTalk: { sit: true, hipL: { x: R(-80), z: R(8) }, hipR: { x: R(-84), z: R(-6) }, kneeL: { x: R(70) }, kneeR: { x: R(88) }, spine: { x: R(-10) }, neck: { x: R(4), y: R(-14) }, shL: { x: R(28), z: R(40) }, elL: { x: R(-50) }, shR: { x: R(-40), z: R(-12) }, elR: { x: R(-100), y: R(20) } },
  // looking at a phone held in both hands
  phone: { spine: { x: R(6) }, neck: { x: R(28) }, shL: { x: R(-30), z: R(10) }, elL: { x: R(-95), y: R(25) }, shR: { x: R(-30), z: R(-10) }, elR: { x: R(-95), y: R(-25) }, hipR: { x: R(5), z: R(-3) }, kneeR: { x: R(8) }, phone: true },
  // walking, caught mid-stride (a figure's stride: left foot forward)
  walk: { hipL: { x: R(-20) }, kneeL: { x: R(6) }, hipR: { x: R(16) }, kneeR: { x: R(26) }, shL: { x: R(16) }, elL: { x: R(-14) }, shR: { x: R(-18) }, elR: { x: R(-26) }, spine: { x: R(3) }, neck: { y: R(6) } },
  walkBag: { hipL: { x: R(14) }, kneeL: { x: R(24) }, hipR: { x: R(-18) }, kneeR: { x: R(5) }, shL: { x: R(-6), z: R(6) }, elL: { x: R(-8) }, shR: { x: R(14) }, elR: { x: R(-20) }, spine: { x: R(2) }, neck: { y: R(-10) }, bag: "L" },
  // leaning on a counter / a wall, one knee bent, arms crossed
  armsCrossed: { hipL: { x: R(-3), z: R(-2) }, hipR: { x: R(10), z: R(4) }, kneeR: { x: R(22) }, spine: { x: R(-4) }, neck: { y: R(18), z: R(4) }, shL: { x: R(-50), z: R(24) }, elL: { x: R(-112), y: R(40) }, shR: { x: R(-50), z: R(-24) }, elR: { x: R(-112), y: R(-40) } }
};
export function figurine(K, o = {}) {
  const h = o.h || 29, s = h / 29, f = o.sex === "f";
  const root = new K.Group(); root.name = "figurine";
  const body = new K.Group(); body.scale.setScalar(s); root.add(body);
  const paint = new Map();
  // satin enamel: a little sheen, a little roughness (the model's paint, not a real fabric)
  const M = (c, rough = 0.52) => { const k = c + rough; if (!paint.has(k)) paint.set(k, new K.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 })); return paint.get(k); };
  const skin = M(o.skin || "#e2b08e", 0.46), hairM = M(o.hair || "#2a1b12", 0.6);
  const topM = M(o.top || "#e9e4d8"), jackM = o.jacket ? M(o.jacket, 0.58) : null, botM = M(o.bottom || "#2e3442", 0.6), shoeM = M(o.shoes || "#1c1a19", 0.35);
  const sleeveM = jackM || (o.shortSleeves ? skin : topM);
  const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const me = new K.Mesh(g, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };
  const J = {};
  const joint = (name, parent, x, y, z) => { const j = new K.Group(); j.position.set(x, y, z); parent.add(j); J[name] = j; return j; };
  // a tapered limb from the joint downwards (length l, radii a at the top, b at the bottom)
  const limb = (parent, l, a, b, m, seg = 14) => { const g = new K.CylinderGeometry(b, a, l, seg, 1); g.translate(0, -l / 2, 0); return mesh(g, m, parent); };
  const ball = (r, m, parent, x, y, z, sx = 1, sy = 1, sz = 1, seg = 16) => { const me = mesh(new K.SphereGeometry(r, seg, Math.max(8, seg * 0.75)), m, parent, x, y, z); me.scale.set(sx, sy, sz); return me; };
  const lathe = (pts, m, parent, sx = 1, sz = 0.66, seg = 28) => { const g = new K.LatheGeometry(pts.map(([r, y]) => new K.Vector2(r, y)), seg); const me = mesh(g, m, parent); me.scale.set(sx, 1, sz); return me; };

  // ---- the pelvis and the legs
  const hips = joint("hips", body, 0, 14.6, 0);
  const hw = f ? 2.05 : 1.85;
  for (const side of [-1, 1]) {
    const hp = joint(side < 0 ? "hipL" : "hipR", hips, side * hw, 0, 0);
    const bare = !!o.skirt && !o.longSkirt;
    limb(hp, 6.8, f ? 1.7 : 1.62, 1.18, bare ? M(o.legs || o.skin || "#e2b08e", 0.46) : botM);
    const kn = joint(side < 0 ? "kneeL" : "kneeR", hp, 0, -6.6, 0);
    ball(1.2, bare ? M(o.legs || o.skin || "#e2b08e", 0.46) : botM, kn, 0, 0, 0);
    limb(kn, 6.4, 1.16, f ? 0.72 : 0.82, bare ? M(o.legs || o.skin || "#e2b08e", 0.46) : botM);
    // the trouser's hem, a little wider, then the shoe (a rounded wedge, toe forward)
    if (!bare) { const hem = new K.CylinderGeometry(0.98, 0.98, 0.7, 14, 1, true); mesh(hem, botM, kn, 0, -6.1, 0); }
    const sh = ball(1, shoeM, kn, 0, -7.45, 0.75, f ? 0.78 : 0.95, 0.55, f ? 2.1 : 2.35);
    if (f && o.heels) sh.position.y -= 0.2;
  }
  // the pelvis: a short squat lathe in the trousers' (or the skirt's) colour
  lathe([[0, -1.6], [hw + 0.9, -1.4], [hw + 1.15, 0.2], [hw + 0.95, 2.0], [0, 2.4]], o.skirt ? M(o.skirt, 0.55) : botM, hips, 1, 0.72);
  if (o.skirt) {
    const sk = new K.CylinderGeometry(f ? 2.5 : 2.4, o.longSkirt ? 3.6 : 3.3, o.longSkirt ? 11 : 7.2, 24, 1, true); sk.translate(0, -(o.longSkirt ? 11 : 7.2) / 2 + 1.6, 0);
    const m2 = mesh(sk, M(o.skirt, 0.55), hips); m2.scale.set(1, 1, 0.78); m2.material.side = K.DoubleSide;
  }
  // ---- the torso (a lathe, flattened front to back), the clothes over it
  const spine = joint("spine", hips, 0, 1.2, 0);
  const torsoPts = f
    ? [[0, -0.6], [2.6, -0.4], [2.15, 2.4], [2.35, 4.4], [2.75, 5.9], [2.55, 7.3], [2.45, 8.1], [1.0, 9.0], [0, 9.2]]
    : [[0, -0.6], [2.45, -0.4], [2.35, 2.2], [2.65, 4.4], [3.05, 6.4], [3.1, 7.6], [2.75, 8.4], [1.1, 9.15], [0, 9.3]];
  lathe(torsoPts, topM, spine, 1.08, 0.64);
  if (jackM) {
    // the jacket over the shirt, down to the hip, the shirt showing in a V at the chest
    const jp = torsoPts.map(([r, y], i) => [r > 0 ? r + 0.32 : 0, i === 0 ? -2.4 : y]);
    jp[1] = [2.9, -2.2];
    lathe(jp, jackM, spine, 1.08, 0.66);
    const v = new K.Shape(); v.moveTo(-1.05, 8.3); v.lineTo(1.05, 8.3); v.lineTo(0, 4.6); v.lineTo(-1.05, 8.3);
    const vm = mesh(new K.ShapeGeometry(v), topM, spine, 0, 0, 2.18); vm.rotation.x = -0.12;
    // the lapels, a hair proud of the jacket
    for (const sd of [-1, 1]) { const l = new K.Shape(); l.moveTo(sd * 1.05, 8.3); l.lineTo(sd * 1.9, 7.6); l.lineTo(sd * 0.25, 4.7); l.lineTo(sd * 1.05, 8.3); const lm = mesh(new K.ShapeGeometry(l), M(new K.Color(o.jacket).multiplyScalar(0.82).getStyle(), 0.6), spine, 0, 0, 2.26); lm.rotation.x = -0.12; lm.material.side = K.DoubleSide; }
  }
  if (o.apron) { const ap = new K.BoxGeometry(4.6, 9.6, 0.25); mesh(ap, M(o.apron, 0.7), spine, 0, 1.4, 2.05); const tie = new K.BoxGeometry(5.6, 0.35, 0.3); mesh(tie, M(o.apron, 0.7), spine, 0, 4.4, 1.9); }
  if (o.scarf) { const sc = new K.TorusGeometry(1.25, 0.55, 8, 16); const m2 = mesh(sc, M(o.scarf, 0.75), spine, 0, 8.9, 0.1); m2.rotation.x = Math.PI / 2; m2.scale.set(1.1, 0.9, 1); }
  // ---- the neck and head: a skull, a jaw, a nose, ears, the eyes painted as dots, the hair sculpted
  const neck = joint("neck", spine, 0, 9.0, -0.15);
  { const ng = new K.CylinderGeometry(0.78, 0.88, 1.7, 12); ng.translate(0, 0.55, 0); mesh(ng, skin, neck); }
  const head = joint("head", neck, 0, 1.45, 0.1);
  ball(1.72, skin, head, 0, 1.75, 0, 0.86, 1.06, 0.98, 22);
  ball(1.2, skin, head, 0, 0.95, 0.38, 0.86, 0.85, 0.92, 18); // the jaw
  // the face, sculpted then painted (a 1:22 figure's, not a 1:87's): a nose with a bridge, cheekbones, lips, a chin,
  // the eyes painted white with a dark iris, the brows
  { const n = ball(1, skin, head, 0, 1.5, 1.62, 0.3, 0.46, 0.4, 12); n.rotation.x = -0.25; ball(1, skin, head, 0, 1.92, 1.52, 0.2, 0.42, 0.22, 10); }
  for (const sd of [-1, 1]) ball(1, skin, head, sd * 0.78, 1.38, 1.18, 0.42, 0.34, 0.36, 10);
  ball(1, skin, head, 0, 0.52, 1.02, 0.5, 0.32, 0.34, 10);
  for (const sd of [-1, 1]) {
    ball(1, skin, head, sd * 1.5, 1.6, 0.05, 0.22, 0.42, 0.32, 10); // ears
    ball(1, M("#f4efe6", 0.35), head, sd * 0.55, 1.95, 1.44, 0.26, 0.17, 0.12, 10); // the eyes: white, the iris over it
    ball(1, M(o.eyes || "#2a1d16", 0.25), head, sd * 0.55, 1.94, 1.54, 0.12, 0.13, 0.06, 8);
    const brow = mesh(new K.BoxGeometry(0.62, 0.13, 0.2), hairM, head, sd * 0.56, 2.32, 1.55); brow.rotation.z = sd * -0.08;
  }
  { const lip = M(o.lips || (f ? "#b4544e" : "#9e5a50"), 0.45); const u = mesh(new K.CapsuleGeometry(0.11, 0.42, 4, 8), lip, head, 0, 1.02, 1.42); u.rotation.z = Math.PI / 2; const l = mesh(new K.CapsuleGeometry(0.12, 0.36, 4, 8), lip, head, 0, 0.86, 1.38); l.rotation.z = Math.PI / 2; }
  if (o.glasses) { for (const sd of [-1, 1]) { const gl = mesh(new K.TorusGeometry(0.36, 0.06, 6, 14), M("#1b1b1b", 0.3), head, sd * 0.56, 1.95, 1.66); } mesh(new K.BoxGeometry(0.4, 0.06, 0.06), M("#1b1b1b", 0.3), head, 0, 1.98, 1.68); }
  const hs = o.hairStyle || (f ? "bob" : "short");
  if (hs !== "bald") {
    const cap = (thetaLen, sx = 0.9, sy = 1.06, sz = 1.02, y = 1.86, z = -0.12) => { const g = new K.SphereGeometry(1.84, 22, 14, 0, Math.PI * 2, 0, thetaLen); const me = mesh(g, hairM, head, 0, y, z); me.scale.set(sx, sy, sz); return me; };
    if (hs === "crop") cap(Math.PI * 0.42, 0.89, 1.04, 1.0, 1.8, -0.1);
    else cap(Math.PI * (hs === "short" ? 0.5 : 0.56));
    // the back of the head covered lower down (hair is never just a cap)
    ball(1.7, hairM, head, 0, 1.45, -0.55, 0.92, 0.95, 0.85, 16);
    if (hs === "bob") { for (const sd of [-1, 1]) ball(1, hairM, head, sd * 1.25, 1.2, -0.2, 0.55, 1.25, 1.05, 12); }
    if (hs === "long") { const lg = new K.CapsuleGeometry(1.45, 3.4, 6, 14); const me = mesh(lg, hairM, head, 0, -0.4, -0.95); me.scale.set(1.12, 1, 0.6); }
    if (hs === "bun") ball(0.95, hairM, head, 0, 2.5, -1.55);
    // a fringe over the brow
    if (hs !== "crop") { const fr = new K.SphereGeometry(1.8, 18, 6, Math.PI * 0.62, Math.PI * 0.76, Math.PI * 0.2, Math.PI * 0.16); const me = mesh(fr, hairM, head, 0, 1.75, 0.06); me.scale.set(0.92, 1.06, 1.02); }
  }
  if (o.beard) { const bd = mesh(new K.SphereGeometry(1.22, 16, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.5), hairM, head, 0, 1.15, 0.36); bd.scale.set(0.88, 0.95, 0.95); }
  // ---- the arms: shoulder, upper arm, elbow, forearm, a hand with its thumb
  const sw = f ? 2.75 : 3.15;
  for (const side of [-1, 1]) {
    const shd = joint(side < 0 ? "shL" : "shR", spine, side * sw, 7.85, -0.1);
    ball(1.18, sleeveM, shd, 0, 0, 0);
    limb(shd, 5.0, 1.08, 0.88, sleeveM);
    const el = joint(side < 0 ? "elL" : "elR", shd, 0, -5.0, 0);
    ball(0.88, sleeveM, el, 0, 0, 0, 1, 1, 1, 12);
    const fore = limb(el, 4.4, 0.86, 0.62, o.shortSleeves && !jackM ? skin : sleeveM);
    if (!o.shortSleeves || jackM) { const cuff = new K.CylinderGeometry(0.66, 0.66, 0.5, 12, 1, true); mesh(cuff, skin, el, 0, -4.4, 0); }
    const hand = joint(side < 0 ? "handL" : "handR", el, 0, -4.9, 0.05);
    // a hand: the palm, four fingers a little curled, the thumb across
    ball(0.6, skin, hand, 0, -0.25, 0, 0.8, 0.85, 0.42, 12);
    for (let k = 0; k < 4; k++) { const fx = (k - 1.5) * 0.24, fl = [0.62, 0.72, 0.68, 0.52][k]; const fg = mesh(new K.CapsuleGeometry(0.105, fl, 4, 8), skin, hand, fx, -0.78 - fl / 2, 0.06); fg.rotation.x = 0.28; }
    const th = mesh(new K.CapsuleGeometry(0.13, 0.5, 4, 8), skin, hand, side * -0.42, -0.35, 0.22); th.rotation.z = side * 0.65; th.rotation.x = 0.4;
  }
  // ---- what they hold
  const cupM = M("#f6f1e8", 0.3);
  const cupAt = (side) => { const cup = new K.Group(); const c = mesh(new K.CylinderGeometry(0.62, 0.48, 1.2, 14), cupM, cup); const sl = mesh(new K.CylinderGeometry(0.66, 0.6, 0.55, 14, 1, true), M(o.cupSleeve || "#8a5a3a", 0.7), cup); sl.position.y = -0.05; J[side === "L" ? "handL" : "handR"].add(cup); cup.position.set(0, -0.65, 0.5); return cup; };
  const pose = typeof o.pose === "function" ? o.pose(J) : POSES[o.pose || "stand"] || {};
  for (const [k, r] of Object.entries(pose)) { if (!J[k] || typeof r !== "object") continue; J[k].rotation.set(r.x || 0, r.y || 0, r.z || 0); }
  if (pose.cup) { const c = cupAt(pose.cup); if (pose.cupLevel !== false) root.userData.cup = c; }
  if (pose.phone) { const ph = mesh(new K.BoxGeometry(1.5, 2.8, 0.25), M("#1b1d22", 0.25), J.handR, -0.9, -0.5, 0.45); ph.rotation.x = -0.6; }
  if (pose.bag || o.bag) { const sd = pose.bag || "L", bg = new K.Group(); mesh(new K.BoxGeometry(3.6, 4.0, 1.2), M(o.bagColor || "#c9a26b", 0.65), bg, 0, -3.4, 0); const strap = mesh(new K.TorusGeometry(1.3, 0.12, 6, 16, Math.PI), M(o.bagColor || "#c9a26b", 0.65), bg, 0, -1.4, 0); J[sd === "L" ? "handL" : "handR"].add(bg); bg.position.set(0, -0.4, 0); }
  // seated: the hips drop to a chair's height (the legs are already folded by the pose)
  if (pose.sit) hips.position.y = o.seat != null ? o.seat + 1.6 : 8.0; // (a seat 6.4 above the feet: the shins upright, the soles on the floor)
  root.userData.J = J;
  root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.userData.figurine = true; } });
  return root;
}
