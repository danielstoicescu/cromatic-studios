// Cromatic · stories in Lottie · story A6 (TASK-065g, Daniel: "the people inside OMA much more realistic: proportions,
// posture, clothes, slow natural movement, depth behind the glass; no mannequin silhouettes"): OMA Coffee's room, built
// in the scene behind the shop's two glass arches (in OMA's own frame: buildOmaShop at 706, 4560, turned a quarter) and
// rendered on its own with the shot's camera, then laid under the plate whose glass is keyed out. Evaluated in the page
// (renderV6.mjs): makeOmaRoom(K) -> { group, pose(t) }. K: three's classes from the scene. Units: the map's (the door's
// arch is 44.5 tall; a person ~29, 1.75 m).
function makeOmaRoom(K) {
  const g = new K.Group(); g.name = "omaRoom";
  const M = (color, o = {}) => new K.MeshStandardMaterial({ color, roughness: 0.8, ...o });
  const box = (w, h, d, m, x, y, z) => { const b = new K.Mesh(new K.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  const cyl = (rt, rb, h, m, x, y, z, seg = 16) => { const c = new K.Mesh(new K.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); g.add(c); return c; };
  // the room: behind the front (local z 24), 20 deep; warm plaster, a timber floor, a dark ceiling with the lamps
  const wall = M("#e8cfae", { emissive: new K.Color("#ffb766"), emissiveIntensity: 0.18 }), floor = M("#7a5034", { roughness: 0.6 }), ceil = M("#3b2a22");
  box(74, 52, 1, wall, 0, 31, 3);                 // the back wall
  box(1, 52, 21, wall, -36.5, 31, 13.5); box(1, 52, 21, wall, 36.5, 31, 13.5);
  box(74, 1, 21, floor, 0, 4.5, 13.5); box(74, 1, 21, ceil, 0, 56, 13.5);
  // the counter (behind the left window), its top, the espresso machine, the grinder, cups on a shelf
  const wood = M("#6b4126", { roughness: 0.55 }), top = M("#d9cfc0", { roughness: 0.3 }), steel = M("#c9ccd0", { metalness: 0.9, roughness: 0.25 });
  box(30, 15, 6, wood, -19, 12.5, 9); box(31, 1.2, 7, top, -19, 20.6, 9);
  box(9, 7, 5, steel, -24, 24.6, 8); box(2.4, 6, 2.4, M("#1d1d1f"), -13, 24.2, 8);
  for (let i = 0; i < 7; i++) cyl(0.9, 0.7, 1.8, M("#f4efe6"), -30 + i * 3.4, 35.4, 4.2, 10);
  box(30, 0.8, 3, wood, -19, 34.2, 4.6);
  // a small round table and two chairs (behind the door), plants, a framed print
  cyl(4.6, 4.6, 0.7, top, 15, 16.5, 13); cyl(0.6, 0.6, 11, M("#2a2a2a"), 15, 11, 13);
  for (const cx of [9, 21]) { box(5, 0.8, 5, wood, cx, 10.6, 13); box(5, 8, 0.8, wood, cx, 14.4, cx < 15 ? 10.8 : 15.2); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) box(0.5, 6, 0.5, wood, cx + dx, 7.6, 13 + dz); }
  box(12, 9, 0.6, M("#a85d32"), 16, 38, 3.8); box(10.4, 7.4, 0.6, M("#f2e4cf"), 16, 38, 4.2);
  cyl(2.4, 1.8, 5, M("#9a5a34"), 31, 7.5, 18); const leaf = M("#3f7d3f"); for (let i = 0; i < 5; i++) { const l = new K.Mesh(new K.IcosahedronGeometry(2.6, 0), leaf); l.position.set(31 + Math.sin(i * 2.4) * 1.6, 12 + i * 1.4, 18 + Math.cos(i * 2.4) * 1.6); g.add(l); }
  // the lamps: three pendants, their bulbs lit, a warm key light from them on the people (the scene's directional)
  const bulbM = new K.MeshStandardMaterial({ color: "#fff2d0", emissive: new K.Color("#ffd28a"), emissiveIntensity: 2.2 });
  for (const x of [-19, 0, 17]) { cyl(0.15, 0.15, 10, M("#111"), x, 50, 12, 6); const sh = cyl(1.2, 3.6, 3, M("#1c1c1c", { side: 2 }), x, 44.4, 12, 18); const b = new K.Mesh(new K.SphereGeometry(1.1, 12, 10), bulbM); b.position.set(x, 43, 12); g.add(b); }
  const key = new K.DirectionalLight("#ffc98a", 1.4); key.position.set(0, 46, 22); key.target.position.set(0, 14, 9); g.add(key); g.add(key.target);
  const fill = new K.DirectionalLight("#ffe7c4", 0.5); fill.position.set(-20, 30, 40); fill.target.position.set(0, 15, 8); g.add(fill); g.add(fill.target);
  // ---- people: a skeleton of groups (hips, spine, neck, shoulders, elbows, hips, knees), capsule limbs, clothes
  const cap = (r, l, m) => new K.Mesh(new K.CapsuleGeometry(r, l, 6, 12), m);
  function person({ h = 29, skin = "#d7a17c", hair = "#2b1d14", shirt = "#f2efe8", trousers = "#2d3340", shoes = "#1b1b1b", apron = null, hairLong = false }) {
    const s = h / 29, P = new K.Group(), sk = M(skin, { roughness: 0.7 }), hm = M(hair, { roughness: 0.9 }), sm = M(shirt), tm = M(trousers), shm = M(shoes);
    const J = {}; const joint = (name, parent, x, y, z) => { const j = new K.Group(); j.position.set(x * s, y * s, z * s); parent.add(j); J[name] = j; return j; };
    const hips = joint("hips", P, 0, 14.6, 0);
    for (const side of [-1, 1]) { const hp = joint(side < 0 ? "hipL" : "hipR", hips, side * 1.9, 0, 0); const th = cap(1.45 * s, 5.4 * s, tm); th.position.y = -3.6 * s; hp.add(th);
      const kn = joint(side < 0 ? "kneeL" : "kneeR", hp, 0, -7.2, 0); const sh = cap(1.2 * s, 5.2 * s, tm); sh.position.y = -3.4 * s; kn.add(sh); const ft = new K.Mesh(new K.BoxGeometry(2.2 * s, 1.1 * s, 4 * s), shm); ft.position.set(0, -7.1 * s, 0.9 * s); kn.add(ft); }
    const pelvis = cap(2.6 * s, 1.4 * s, tm); pelvis.rotation.z = Math.PI / 2; pelvis.scale.set(1, 1, 0.75); hips.add(pelvis);
    const spine = joint("spine", hips, 0, 0.8, 0); const torso = cap(2.9 * s, 4.6 * s, sm); torso.position.y = 3.6 * s; torso.scale.set(1.05, 1, 0.68); spine.add(torso);
    if (apron) { const ap = new K.Mesh(new K.BoxGeometry(5.4 * s, 10 * s, 0.4 * s), M(apron)); ap.position.set(0, 1.4 * s, 2.1 * s); spine.add(ap); }
    const neck = joint("neck", spine, 0, 8.4, 0); const nk = cap(0.8 * s, 0.8 * s, sk); nk.position.y = 0.6 * s; neck.add(nk);
    const head = joint("head", neck, 0, 1.6, 0); const hd = new K.Mesh(new K.SphereGeometry(1.75 * s, 18, 14), sk); hd.scale.set(0.92, 1.12, 1); hd.position.y = 1.6 * s; head.add(hd);
    const hr = new K.Mesh(new K.SphereGeometry(1.86 * s, 18, 12, 0, Math.PI * 2, 0, Math.PI * (hairLong ? 0.62 : 0.5)), hm); hr.position.set(0, 1.85 * s, -0.15 * s); hr.scale.set(0.96, 1.1, 1.02); head.add(hr);
    if (hairLong) { const hl = cap(1.6 * s, 2.6 * s, hm); hl.position.set(0, 0.6 * s, -1 * s); hl.scale.set(1.1, 1, 0.6); head.add(hl); }
    for (const side of [-1, 1]) { const shd = joint(side < 0 ? "shL" : "shR", spine, side * 3.1, 7.2, 0); const ua = cap(1.0 * s, 3.9 * s, sm); ua.position.y = -2.6 * s; shd.add(ua);
      const el = joint(side < 0 ? "elL" : "elR", shd, 0, -5.2, 0); const fa = cap(0.85 * s, 3.6 * s, sk); fa.position.y = -2.4 * s; el.add(fa); const hn = new K.Mesh(new K.SphereGeometry(0.95 * s, 10, 8), sk); hn.position.y = -5 * s; el.add(hn); J[side < 0 ? "handL" : "handR"] = hn; }
    P.J = J; P.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return P;
  }
  const cupM = M("#f6f1e8");
  const people = [];
  // 1 · the barista behind the counter, apron on, working the machine: turns from it to the counter and back
  const ba = person({ h: 28, skin: "#c98f6a", hair: "#1b120c", shirt: "#ece6da", trousers: "#2b2b2b", apron: "#2f5b46" }); ba.position.set(-22, 5, 5.5); g.add(ba);
  people.push((t) => { const J = ba.J, w = Math.sin(t * 0.9); ba.rotation.y = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.45)); J.spine.rotation.x = 0.12; J.neck.rotation.y = 0.25 * w; J.shR.rotation.x = -0.9 - 0.25 * Math.sin(t * 1.3); J.elR.rotation.x = -0.8; J.shL.rotation.x = -0.6; J.elL.rotation.x = -0.9 - 0.2 * w; });
  // 2 · a customer at the counter, near the glass, weight on one leg, a cup in his hand, turning to talk
  const cu = person({ h: 29.5, skin: "#e0b08e", hair: "#5a3a22", shirt: "#33475f", trousers: "#5b5348" }); cu.position.set(-13, 5, 18.5); cu.rotation.y = Math.PI + 0.35; g.add(cu);
  const cup1 = cyl(0.8, 0.6, 1.8, cupM, 0, 0, 0, 10); cu.J.handR.add(cup1); cup1.position.set(0, 0.6, 0.4);
  people.push((t) => { const J = cu.J; J.hips.rotation.z = 0.05; J.hipL.rotation.z = -0.06; J.spine.rotation.x = 0.05 + 0.03 * Math.sin(t * 0.7); J.neck.rotation.y = -0.45 * (0.5 + 0.5 * Math.sin(t * 0.5 + 1)); J.shR.rotation.x = -0.35 - 0.35 * (0.5 + 0.5 * Math.sin(t * 0.6)); J.elR.rotation.x = -1.3; J.shL.rotation.z = 0.08; });
  // 3 · two at the table behind the door: one seated, sipping now and then; one leaning on the chair back, laughing
  const se = person({ h: 27.5, skin: "#f0c7a6", hair: "#a8662f", shirt: "#c6463c", trousers: "#2f3b55", hairLong: true }); se.position.set(9, 5, 13); se.rotation.y = -Math.PI / 2 + 0.3; g.add(se);
  const cup2 = cyl(0.75, 0.55, 1.6, cupM, 0, 0, 0, 10); se.J.handL.add(cup2); cup2.position.set(0, 0.6, 0.3);
  people.push((t) => { const J = se.J, sip = Math.max(0, Math.sin(t * 0.55 - 0.6)) ** 2; J.hips.position.y = 10.4 * (27.5 / 29); J.hipL.rotation.x = -1.5; J.hipR.rotation.x = -1.45; J.kneeL.rotation.x = 1.5; J.kneeR.rotation.x = 1.45; J.spine.rotation.x = 0.1 - 0.08 * sip;
    J.shL.rotation.x = -0.5 - 1.2 * sip; J.elL.rotation.x = -1.2 - 0.6 * sip; J.shR.rotation.x = -0.7; J.elR.rotation.x = -0.9; J.neck.rotation.x = -0.15 * sip; J.neck.rotation.y = 0.2 * Math.sin(t * 0.4); });
  const st = person({ h: 30, skin: "#8d5a3c", hair: "#0f0b08", shirt: "#e9e3d3", trousers: "#3a3f36" }); st.position.set(21, 5, 16); st.rotation.y = -Math.PI / 2 - 0.5; g.add(st);
  people.push((t) => { const J = st.J; J.spine.rotation.x = 0.22 + 0.05 * Math.sin(t * 1.1); J.shR.rotation.x = -0.9; J.elR.rotation.x = -0.5; J.shL.rotation.z = 0.15; J.elL.rotation.x = -1.6; J.neck.rotation.x = -0.1 + 0.08 * Math.sin(t * 2.2); J.head.rotation.z = 0.06 * Math.sin(t * 1.7); });
  // 4 · someone walking slowly across the door's window, a coat on, from the right to the counter
  const wa = person({ h: 29, skin: "#dcae8c", hair: "#3b2a1c", shirt: "#7a5a3a", trousers: "#22262e" }); wa.rotation.y = -Math.PI / 2; g.add(wa);
  people.push((t) => { const J = wa.J, x = 33 - 3.2 * t, ph = t * 3.4; wa.position.set(x, 5 + 0.25 * Math.abs(Math.sin(ph)), 20); J.hipL.rotation.x = 0.42 * Math.sin(ph); J.hipR.rotation.x = -0.42 * Math.sin(ph); J.kneeL.rotation.x = 0.5 * Math.max(0, -Math.sin(ph)); J.kneeR.rotation.x = 0.5 * Math.max(0, Math.sin(ph)); J.shL.rotation.x = -0.3 * Math.sin(ph); J.shR.rotation.x = 0.3 * Math.sin(ph); J.elL.rotation.x = -0.3; J.elR.rotation.x = -0.3; J.neck.rotation.y = 0.3; });
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return { group: g, pose: (t) => { for (const f of people) f(t); g.updateMatrixWorld(true); } };
}

// TASK-118: vendored from stories-lottie (1b77838) for the diorama test's "before" (A6 as it was)
export { makeOmaRoom };
