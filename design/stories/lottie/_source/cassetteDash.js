// Cromatic · stories in Lottie · story C6 (TASK-065i, Daniel: "right at the start, when the engine starts: inside the
// car, the radio-cassette in the 1300's dashboard; the cassette goes in, Play, the reels turn, a little dashboard light,
// then out to the street"): the Dacia 1300's dashboard round a 70s/80s Romanian-style radio-cassette, in the map's
// style but detailed for a close-up. Evaluated in the page (renderV6.mjs JOB=c6dash): makeDash(K) -> { group, pose(t) }.
// Units: ~1 per cm (the deck is 18 wide). Its own lights; it stands far from the city (it is all that is in frame).
function makeDash(K) {
  const g = new K.Group(); g.name = "cassetteDash";
  const M = (color, o = {}) => new K.MeshStandardMaterial({ color, roughness: 0.6, ...o });
  const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new K.CanvasTexture(c); t.colorSpace = "srgb"; t.anisotropy = 8; return t; };
  const box = (w, h, d, m, x, y, z, parent = g) => { const b = new K.Mesh(new K.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
  const cyl = (r, h, m, x, y, z, seg = 32, parent = g) => { const c = new K.Mesh(new K.CylinderGeometry(r, r, h, seg), m); c.position.set(x, y, z); parent.add(c); return c; };
  // ---- the dashboard: padded dark vinyl, the console below it, a wood-grain strip (the 1300's), the vents
  const vinyl = M("#1b1714", { roughness: 0.85 }), plastic = M("#26221f", { roughness: 0.55 });
  const woodT = tex(512, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5a3520"); gr.addColorStop(1, "#3c2212"); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(${30 + (i % 3) * 20},${16 + (i % 4) * 6},8,0.35)`; c.lineWidth = 1 + (i % 2); c.beginPath(); c.moveTo(0, (i * 7) % h); c.bezierCurveTo(w * 0.3, ((i * 13) % h), w * 0.6, ((i * 5) % h), w, ((i * 11) % h)); c.stroke(); } });
  box(120, 16, 30, vinyl, 0, 20, -8);                                   // the dash top
  box(120, 3, 2, M("#ffffff", { map: woodT, roughness: 0.45 }), 0, 13.2, 6.6); // the wood strip
  box(64, 70, 22, plastic, 0, -24, -2);                                 // the console, down to the floor
  for (const vx of [-22, 22]) { box(14, 5, 2, M("#111"), vx, 17, 6.4); for (let i = 0; i < 5; i++) box(13, 0.4, 2.3, M("#2d2a27"), vx, 15 + i * 1, 6.6); }
  // ---- the radio-cassette: a brushed-aluminium face, the tuning scale (lit amber), the cassette door (smoked), the
  // piano keys, two knurled knobs, the red STEREO lamp, its maker's badge
  const R = new K.Group(); R.position.set(0, 4, 9.2); g.add(R);
  const faceT = tex(1024, 400, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#d8dbde"); gr.addColorStop(1, "#a9adb2"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) { c.fillStyle = `rgba(255,255,255,${0.05 + 0.05 * Math.sin(x * 1.7)})`; c.fillRect(x, 0, 1, h); } // (brushed)
    c.fillStyle = "#1a1a1a"; c.fillRect(30, 20, 964, 64); // the scale's window
    c.fillStyle = "#2b2b2b"; c.font = "700 30px CromaticSans, sans-serif"; c.fillText("ELECTRONICA", 44, 372); c.font = "600 20px CromaticSans, sans-serif"; c.fillText("RADIOCASETOFON AUTO · 2 x 6 W", 300, 372);
    c.fillStyle = "#444"; c.font = "600 16px CromaticSans, sans-serif"; ["REW", "FF", "PLAY", "STOP", "EJ"].forEach((s, i) => c.fillText(s, 640 + i * 76, 320));
    c.fillText("VOLUM", 18, 268); c.fillText("ACORD", 930, 214);
  });
  const face = box(20, 8.2, 0.6, M("#ffffff", { map: faceT, metalness: 0.7, roughness: 0.35 }), 0, 0, 0, R);
  // the tuning scale: its own lit panel (its lamp comes on with Play), the orange needle
  const scaleT = tex(1024, 120, (c, w, h) => { c.fillStyle = "#120c06"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffcf7a"; c.font = "600 30px CromaticSans, sans-serif"; ["88", "92", "96", "100", "104", "108"].forEach((s, i) => c.fillText(s, 60 + i * 170, 50)); for (let x = 60; x < 1000; x += 17) { c.fillRect(x, 70, 3, x % 85 < 17 ? 26 : 14); } c.font = "700 24px CromaticSans, sans-serif"; c.fillText("FM  MHz", 860, 108); });
  const scaleM = new K.MeshStandardMaterial({ map: scaleT, emissiveMap: scaleT, emissive: new K.Color("#ffb347"), emissiveIntensity: 0.05, roughness: 0.4 });
  box(18, 1.3, 0.2, scaleM, 0, 3.1, 0.38, R);
  const needle = box(0.12, 1.15, 0.12, new K.MeshStandardMaterial({ color: "#ff5a1f", emissive: new K.Color("#ff5a1f"), emissiveIntensity: 0.2 }), -4, 3.1, 0.55, R);
  // the cassette door: a smoked window over the slot; the cassette behind it when it is in
  const door = box(9.4, 5.8, 0.25, new K.MeshStandardMaterial({ color: "#1d1a17", transparent: true, opacity: 0.42, roughness: 0.12, metalness: 0.2 }), -3.6, -0.5, 0.42, R);
  box(9.8, 0.3, 0.45, M("#8b8f94", { metalness: 0.8, roughness: 0.3 }), -3.6, 2.4, 0.42, R); box(9.8, 0.3, 0.45, M("#8b8f94", { metalness: 0.8, roughness: 0.3 }), -3.6, -3.4, 0.42, R);
  // the cassette: a grey shell, its label (a mix tape), the clear window with the tape and the two hubs
  const C = new K.Group(); R.add(C);
  const labelT = tex(512, 320, (c, w, h) => { c.fillStyle = "#3a3d42"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2ead6"; c.fillRect(24, 24, w - 48, 170); c.fillStyle = "#e2382f"; c.fillRect(24, 24, w - 48, 34); c.fillStyle = "#fff"; c.font = "800 26px CromaticSans, sans-serif"; c.fillText("C-60 · A", 40, 50); c.fillStyle = "#1a2a6b"; c.font = "italic 600 44px Georgia, serif"; c.fillText("drive mix '83", 48, 120); c.fillStyle = "#111"; c.fillRect(150, 200, 212, 80); c.fillStyle = "#6b3a1c"; c.beginPath(); c.arc(200, 240, 30, 0, 7); c.arc(312, 240, 22, 0, 7); c.fill(); });
  const shell = box(10, 6.3, 1.2, M("#ffffff", { map: labelT, roughness: 0.5 }), 0, 0, 0, C);
  const hubs = [-1.12, 1.12].map((hx) => { const hb = new K.Group(); hb.position.set(hx, -1.25, 0.62); C.add(hb); cyl(0.42, 0.1, M("#f6f6f6"), 0, 0, 0, 24, hb).rotation.x = Math.PI / 2; for (let k = 0; k < 6; k++) { const tooth = box(0.12, 0.22, 0.12, M("#9a9a9a"), Math.cos((k / 6) * Math.PI * 2) * 0.28, Math.sin((k / 6) * Math.PI * 2) * 0.28, 0.07, hb); tooth.rotation.z = (k / 6) * Math.PI * 2; } return hb; });
  C.scale.setScalar(0.86); C.rotation.x = -Math.PI / 2 * 0; // (it goes in standing, label out, as into a car deck's slot)
  // the piano keys: chrome, the PLAY key goes down
  const chrome = M("#dfe2e5", { metalness: 0.35, roughness: 0.28 }); // (the keys and the knob caps: bright, they have no sky to mirror in a cabin)
  const keys = [0, 1, 2, 3, 4].map((i) => box(1.3, 1.0, 1.6, chrome, 4.35 + (i - 2) * 1.5, -2.2, 0.9, R));
  // the knobs: knurled, at the ends; the red STEREO lamp
  for (const [kx, ky] of [[-9.0, -0.4], [8.6, 0.6]]) { const kb = cyl(0.85, 1.4, M("#1b1b1b", { roughness: 0.4 }), kx, ky, 1.0, 40, R); kb.rotation.x = Math.PI / 2; const cap = cyl(0.55, 0.2, chrome, kx, ky, 1.75, 32, R); cap.rotation.x = Math.PI / 2; }
  const lamp = new K.Mesh(new K.SphereGeometry(0.18, 12, 10), new K.MeshStandardMaterial({ color: "#5a1010", emissive: new K.Color("#ff2a1a"), emissiveIntensity: 0 })); lamp.position.set(4.3, 1.6, 0.45); R.add(lamp);
  // ---- the windscreen behind: the night street's lights, out of focus (soft discs), and the bonnet's line
  const bokehM = (c) => new K.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 14; i++) { const d = new K.Mesh(new K.CircleGeometry(2 + (i % 4), 24), bokehM(i % 3 ? "#ffcf8a" : "#ff9e5a")); d.position.set(-70 + i * 11, 34 + (i % 5) * 6, -110 - (i % 3) * 20); g.add(d); }
  box(160, 2, 80, M("#c99b18", { roughness: 0.4, metalness: 0.3 }), 0, 24, -70); // (the yellow bonnet beyond the dash)
  // ---- light: the cabin at night (a cool low fill), a warm key from the deck when it lights up
  const fill = new K.DirectionalLight("#9fb2ff", 0.6); fill.position.set(-30, 60, 80); fill.target.position.set(0, 0, 0); g.add(fill, fill.target);
  const key = new K.DirectionalLight("#ffd9a0", 1.0); key.position.set(25, 25, 60); key.target.position.set(0, 2, 8); g.add(key, key.target);
  const glow = new K.DirectionalLight("#ffb347", 0); // (the deck's own light on the console, when Play is pressed) glow.position.set(0, -10, 30); glow.target.position.set(0, 4, 0); g.add(glow, glow.target);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  const sm = (x) => x * x * (3 - 2 * x), cl = (v) => Math.max(0, Math.min(1, v));
  return { group: g, pose(t) {
    // 0 - 0.55 s: the cassette slides in from the right and down into the slot; 0.75: PLAY goes down; 0.82: the lamps
    // come on; then the reels turn, the needle settles on the station
    const ins = sm(cl(t / 0.55));
    C.position.set(-3.6 + 14 * (1 - ins), -0.5 + 6 * (1 - ins) ** 2, 0.18 + 1.4 * (1 - ins) - 0.1 * ins); C.rotation.z = 0.35 * (1 - ins); C.visible = true;
    const press = sm(cl((t - 0.72) / 0.1)); keys[2].position.z = 0.9 - 0.7 * press; keys[2].position.y = -1.75 - 0.12 * press;
    const on = sm(cl((t - 0.8) / 0.25)); scaleM.emissiveIntensity = 0.05 + 1.25 * on; lamp.material.emissiveIntensity = 2.4 * on; glow.intensity = 0.4 * on; needle.material.emissiveIntensity = 0.2 + 1.2 * on;
    needle.position.x = -4 + 3.2 * sm(cl((t - 0.85) / 0.9));
    const spin = Math.max(0, t - 0.86) * 9.5; hubs[0].rotation.z = -spin; hubs[1].rotation.z = -spin * 1.35;
    g.updateMatrixWorld(true);
  } };
}
