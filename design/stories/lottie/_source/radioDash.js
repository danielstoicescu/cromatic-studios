// Cromatic · stories in Lottie · story C6 (TASK-065i): the opening shot inside the car, v2 (Daniel's reference
// c6-radio-ref.png, a single-DIN car stereo; "nobody presses anything, no character"): the Dacia 1300's dashboard
// round a made-up single-DIN stereo of our own (no maker's brand): a matt black face, a large knob with a chrome ring
// and an icy blue light ring, a backlit segment display, small buttons along the bottom over a blue strip, USB and
// AUX on the right. The engine starts, the radio comes on by itself, the display settles on "CROMATIC FM 101.4", the
// blue lights breathe with the music. Evaluated in the page (renderV6.mjs JOB=c6dash DECK=radio): makeDash(K) ->
// { group, pose(t), cues }. Units: ~1 per cm (the face is 18 wide, a DIN is 18 x 5). Its own lights.
function makeDash(K) {
  const g = new K.Group(); g.name = "radioDash";
  const M = (color, o = {}) => new K.MeshStandardMaterial({ color, roughness: 0.6, ...o });
  const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new K.CanvasTexture(c); t.colorSpace = "srgb"; t.anisotropy = 8; t.__c = c; return t; };
  const box = (w, h, d, m, x, y, z, parent = g) => { const b = new K.Mesh(new K.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
  const cyl = (r, h, m, x, y, z, seg = 48, parent = g) => { const c = new K.Mesh(new K.CylinderGeometry(r, r, h, seg), m); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); parent.add(c); return c; };
  const ICE = "#5cc8ff", BLUE = "#1f9bff";
  const faces = (front, side) => [side, side, side, side, front, side]; // (a box's materials: its printing on the front only)
  // ---- the dashboard: padded dark vinyl, the console below it, the 1300's wood-grain strip, the vents
  const vinyl = M("#1b1714", { roughness: 0.85 }), plastic = M("#26221f", { roughness: 0.55 });
  const woodT = tex(512, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5a3520"); gr.addColorStop(1, "#3c2212"); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(${30 + (i % 3) * 20},${16 + (i % 4) * 6},8,0.35)`; c.lineWidth = 1 + (i % 2); c.beginPath(); c.moveTo(0, (i * 7) % h); c.bezierCurveTo(w * 0.3, ((i * 13) % h), w * 0.6, ((i * 5) % h), w, ((i * 11) % h)); c.stroke(); } });
  box(120, 16, 30, vinyl, 0, 20, -8);
  box(120, 3, 2, M("#ffffff", { map: woodT, roughness: 0.45 }), 0, 13.2, 6.6);
  box(64, 70, 22, plastic, 0, -24, -2);
  for (const vx of [-22, 22]) { box(14, 5, 2, M("#111"), vx, 17, 6.4); for (let i = 0; i < 5; i++) box(13, 0.4, 2.3, M("#2d2a27"), vx, 15 + i * 1, 6.6); }
  box(23, 8.4, 0.6, M("#0c0b0b", { roughness: 0.9 }), 0, 4, 8.9); // (the DIN pocket in the console, round the set)
  // ---- the stereo: R is its face's frame (x right, y up, z out of the face; the face's front at z 0.3)
  const R = new K.Group(); R.position.set(0, 4, 9.4); g.add(R);
  box(21, 6.5, 0.5, M("#050506", { roughness: 0.18, metalness: 0.2 }), 0, 0, -0.25, R); // the glossy trim
  // the face: matt black, its printing (light grey and blue), the moulded button shapes; the blue glyphs glow (mask)
  const FX = (x) => (x + 10) * 100, FY = (y) => (2.9 - y) * 100; // (face units -> its 2000 x 580 canvas)
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const sideBtns = [["⏻ / ◀×", 1.75], ["BAND", 0.15], ["SRC", -1.45]];
  const facePaint = (glow) => (c, w, h) => {
    if (!glow) { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1d1e21"); gr.addColorStop(0.08, "#121315"); gr.addColorStop(1, "#08090a"); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(255,255,255,${0.012 + Math.random() * 0.02})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
    else { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); }
    // the three buttons down the left: moulded shapes, their blue labels
    sideBtns.forEach(([lab, y]) => { const x0 = FX(-9.85), y0 = FY(y + 0.7); if (!glow) { const gr = c.createLinearGradient(0, y0, 0, y0 + 140); gr.addColorStop(0, "#2a2c30"); gr.addColorStop(1, "#141518"); c.fillStyle = gr; rr(c, x0, y0, 140, 140, 18); c.fill(); c.strokeStyle = "rgba(255,255,255,0.08)"; c.lineWidth = 3; c.stroke(); } c.fillStyle = glow ? BLUE : "#3e7fb3"; c.font = "800 30px CromaticSans, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(lab, x0 + 70, y0 + 72); });
    if (!glow) {
      // the display's glossy bezel; the name of the set (made up, our own) and its model; RST, MIC, USB, AUX
      c.fillStyle = "#020203"; rr(c, FX(-3.15), FY(2.55), 980, 260, 14); c.fill(); c.strokeStyle = "rgba(255,255,255,0.10)"; c.lineWidth = 4; c.stroke();
      c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillStyle = "#e9ecef"; c.font = "800 34px CromaticSans, sans-serif"; c.fillText("● CROMATIC", FX(-3.0), FY(-0.42)); c.font = "600 30px CromaticSans, sans-serif"; c.textAlign = "right"; c.fillText("CR-1014 BT", FX(6.6), FY(-0.42));
      c.fillStyle = "#8d9399"; c.font = "700 20px CromaticSans, sans-serif"; c.textAlign = "center"; c.fillText("RST", FX(-7.9), FY(-2.55)); c.fillText("MIC", FX(-7.5), FY(2.25)); c.fillText("USB", FX(7.95), FY(2.3)); c.fillText("AUX IN", FX(8.75), FY(-0.95));
      c.fillStyle = "#000"; c.beginPath(); c.arc(FX(-7.9), FY(-2.2), 7, 0, 7); c.arc(FX(-7.5), FY(2.6), 6, 0, 7); c.fill();
    }
  };
  const faceT = tex(2000, 580, facePaint(false)), faceG = tex(2000, 580, facePaint(true));
  const faceM = new K.MeshStandardMaterial({ map: faceT, emissiveMap: faceG, emissive: new K.Color("#ffffff"), emissiveIntensity: 0, roughness: 0.78, metalness: 0.05 });
  box(20.2, 5.8, 0.6, faces(faceM, M("#0a0b0c", { roughness: 0.8 })), 0, 0, 0, R);
  // the knob: an icy blue light ring, the chrome ring, the black cap (with a fine grip ring)
  const KX = -6.05, KY = 0.15;
  const ringM = new K.MeshStandardMaterial({ color: "#0b2236", emissive: new K.Color(ICE), emissiveIntensity: 0, roughness: 0.3 });
  cyl(2.32, 0.34, ringM, KX, KY, 0.42, 64, R);
  cyl(2.06, 0.9, M("#e6e9ec", { metalness: 0.9, roughness: 0.16 }), KX, KY, 0.68, 64, R);
  cyl(1.72, 1.15, M("#0d0d0f", { roughness: 0.35, metalness: 0.3 }), KX, KY, 0.82, 64, R);
  cyl(1.5, 0.05, M("#1c1d20", { roughness: 0.5 }), KX, KY, 1.41, 64, R);
  const halo = cyl(2.55, 0.04, new K.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0, depthWrite: false }), KX, KY, 0.31, 64, R); // (the ring's light on the face)
  // the display: a backlit segment LCD (14-segment cells), redrawn per frame
  const DW = 9.4, DH = 2.3, DXc = 1.75, DYc = 1.25;
  const dispT = tex(1880, 460, () => {}), dc = dispT.__c.getContext("2d");
  const dispM = new K.MeshStandardMaterial({ map: dispT, emissiveMap: dispT, emissive: new K.Color("#ffffff"), emissiveIntensity: 1, roughness: 0.12, metalness: 0.1 });
  box(DW, DH, 0.06, faces(dispM, M("#020203")), DXc, DYc, 0.32, R);
  // 14 segments: a top, b/c right, d bottom, e/f left, g/h the middle halves, i/l the centre verticals, j k m n the diagonals
  const SEG = { a: [[0, 0], [1, 0]], b: [[1, 0], [1, 0.5]], c: [[1, 0.5], [1, 1]], d: [[0, 1], [1, 1]], e: [[0, 0.5], [0, 1]], f: [[0, 0], [0, 0.5]], g: [[0, 0.5], [0.5, 0.5]], h: [[0.5, 0.5], [1, 0.5]], i: [[0.5, 0], [0.5, 0.5]], l: [[0.5, 0.5], [0.5, 1]], j: [[0, 0], [0.5, 0.5]], k: [[1, 0], [0.5, 0.5]], m: [[0.5, 0.5], [0, 1]], n: [[0.5, 0.5], [1, 1]] };
  const GL = { C: "adef", R: "abefghn", O: "abcdef", M: "bcefjk", A: "abcefgh", T: "ail", I: "adil", F: "aefg", "1": "il", "0": "abcdef", "4": "bcfgh", "8": "abcdefgh", " ": "" };
  const CELLS = 16, PITCH = 82, CW = 52, CH = 190, X0 = 70, Y0 = 135;
  const drawDisp = (light, text, test, st) => {
    dc.fillStyle = "#020305"; dc.fillRect(0, 0, 1880, 460); if (light <= 0) { dispT.needsUpdate = true; return; }
    const bg = dc.createLinearGradient(0, 0, 0, 460); bg.addColorStop(0, `rgba(10,40,70,${0.9 * light})`); bg.addColorStop(1, `rgba(4,18,36,${0.9 * light})`); dc.fillStyle = bg; dc.fillRect(0, 0, 1880, 460);
    const seg = (x, y, s, on) => { const [[x1, y1], [x2, y2]] = SEG[s], sh = 0.1; const ax = x + CW * (x1 + (x2 - x1) * sh), ay = y + CH * (y1 + (y2 - y1) * sh), bx = x + CW * (x2 - (x2 - x1) * sh), by = y + CH * (y2 - (y2 - y1) * sh); dc.strokeStyle = on ? `rgba(225,246,255,${light})` : `rgba(120,190,235,${0.07 * light})`; dc.lineWidth = 12; dc.lineCap = "round"; dc.beginPath(); dc.moveTo(ax - (y1 === y2 ? 0 : 0), ay); dc.lineTo(bx, by); dc.stroke(); };
    const cells = []; for (const ch of text) { if (ch === "." && cells.length) cells[cells.length - 1][1] = true; else cells.push([ch, false]); } // (the point sits in its digit's cell)
    for (const pass of [0, 1]) { // (0: the unlit segments' ghosts, 1: the lit ones, with their glow)
      if (pass) { dc.shadowColor = ICE; dc.shadowBlur = 22; } else dc.shadowBlur = 0;
      for (let k = 0; k < CELLS; k++) {
        const x = X0 + k * PITCH, ch = cells[k] ? cells[k][0] : " ", lit = test ? "abcdefghijklmn" : (GL[ch] ?? "");
        for (const s of Object.keys(SEG)) { const on = lit.includes(s); if (on === !!pass) seg(x + (1 - (CH * 0.5 - 0) / CH) * 0, Y0, s, on); }
        const dot = test || !!(cells[k] && cells[k][1]); if (pass === (dot ? 1 : 0)) { dc.fillStyle = dot ? `rgba(225,246,255,${light})` : `rgba(120,190,235,${0.07 * light})`; dc.beginPath(); dc.arc(x + CW + 15, Y0 + CH, 8, 0, 7); dc.fill(); }
      }
    }
    // the stereo / signal icons, top right: on when the station is in
    dc.shadowBlur = st ? 18 : 0; dc.fillStyle = st ? `rgba(225,246,255,${light})` : `rgba(120,190,235,${0.07 * light})`; dc.font = "800 44px CromaticSans, sans-serif"; dc.textAlign = "left"; dc.fillText("ST", 1500, 100); for (let i = 0; i < 4; i++) dc.fillRect(1630 + i * 34, 100 - 14 - i * 12, 22, 14 + i * 12);
    dc.font = "700 34px CromaticSans, sans-serif"; dc.fillText("FM1", 1500, 400); dc.shadowBlur = 0; dispT.needsUpdate = true;
  };
  // the buttons along the bottom: one moulded strip, their labels blue (glow mask)
  const btnLabels = ["|◀◀", "▶▶|", "1 ▶II", "2 SCN", "3 RPT", "4 RDM", "5 DIR-", "6 DIR+", "DISP"];
  const btnPaint = (glow) => (c, w, h) => { c.fillStyle = glow ? "#000" : "#0a0b0d"; c.fillRect(0, 0, w, h); const bw = w / 9; btnLabels.forEach((s, i) => { if (!glow) { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2b2d31"); gr.addColorStop(1, "#151619"); c.fillStyle = gr; rr(c, i * bw + 5, 6, bw - 10, h - 12, 10); c.fill(); } c.fillStyle = glow ? BLUE : "#3e7fb3"; c.font = "800 30px CromaticSans, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(s, i * bw + bw / 2, h / 2 + 2); }); };
  const btnM = new K.MeshStandardMaterial({ map: tex(1080, 64, btnPaint(false)), emissiveMap: tex(1080, 64, btnPaint(true)), emissive: new K.Color("#ffffff"), emissiveIntensity: 0, roughness: 0.55 });
  box(10.4, 0.62, 0.22, faces(btnM, M("#1a1b1e", { roughness: 0.6 })), 1.75, -1.3, 0.38, R);
  // the blue strip under the buttons, its ends turning up
  const stripM = new K.MeshStandardMaterial({ color: "#071a2b", emissive: new K.Color(BLUE), emissiveIntensity: 0, roughness: 0.3 });
  box(11.2, 0.13, 0.12, stripM, 2.15, -2.1, 0.34, R);
  for (const [sx, a] of [[-3.95, -0.55], [8.25, 0.55]]) { const e = box(1.2, 0.13, 0.12, stripM, sx, -1.85, 0.34, R); e.rotation.z = a; }
  // USB (a vertical port) and AUX on the right
  box(0.62, 1.45, 0.08, M("#000", { roughness: 0.4 }), 7.95, 1.3, 0.32, R); box(0.36, 1.05, 0.1, M("#9aa1a8", { metalness: 0.8, roughness: 0.3 }), 7.95, 1.3, 0.3, R); box(0.18, 0.8, 0.12, M("#1a3c66"), 7.95, 1.3, 0.33, R);
  cyl(0.36, 0.08, M("#1a1b1e", { metalness: 0.5, roughness: 0.3 }), 8.75, -1.55, 0.32, 32, R); cyl(0.17, 0.1, M("#000"), 8.75, -1.55, 0.34, 24, R);
  // ---- below the stereo, the 1300's heater panel (three sliders, the fan) and the ashtray: the console is not bare
  const heatT = tex(1600, 300, (c, w, h) => { c.fillStyle = "#151311"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,0.08)"; c.lineWidth = 4; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = "#b9b2a6"; c.font = "700 34px CromaticSans, sans-serif"; c.textAlign = "center"; ["AER", "CALD", "DIRECTIE"].forEach((s, i) => { const x = 260 + i * 420; c.fillStyle = "#050505"; c.fillRect(x - 160, 120, 320, 22); c.fillStyle = "#b9b2a6"; c.fillText(s, x, 230); c.fillText("●", x - 180, 140); c.fillText("○", x + 180, 140); }); c.fillStyle = "#3a6ea8"; c.fillRect(470, 230 - 28, 0, 0); });
  box(16, 3, 0.4, faces(M("#ffffff", { map: heatT, roughness: 0.7 }), M("#151311")), 0, -3.2, 9.15);
  [-5.4, -0.15, 5.1].forEach((sx, i) => box(0.9, 0.75, 0.55, M("#6f6b66", { roughness: 0.4, metalness: 0.4 }), sx + [-1.2, 1.6, 0.4][i], -2.8, 9.5));
  box(10, 2.6, 0.5, M("#2c2925", { roughness: 0.5, metalness: 0.3 }), 0, -7.6, 9.1); box(8.6, 0.5, 0.6, M("#8a8680", { metalness: 0.5, roughness: 0.5 }), 0, -6.6, 9.3); // (the ashtray, its chrome pull)
  // ---- the two auxiliary gauges over the stereo (rev counter, oil pressure): needles at rest till the engine catches
  // (C7, Daniel: the two gauges are Berero's two beers, COMM and UNITY: each dial in its can's colour, the word in the
  // labels' condensed black capitals; sampled from the case's labels: COMM lager yellow, UNITY IPA green)
  const gaugeT = (label, marks, face = "#0d0d0f", ink = "#e9e3d3") => tex(512, 512, (c) => { c.scale(2, 2); c.translate(128, 128); c.rotate(-Math.PI / 2); c.translate(-128, -128); /* (the cap's uv runs a quarter turn round) */ c.fillStyle = face; c.beginPath(); c.arc(128, 128, 126, 0, 7); c.fill(); c.strokeStyle = ink; c.lineWidth = 5; for (let i = 0; i <= marks; i++) { const a = Math.PI * (0.75 + 1.5 * i / marks); c.beginPath(); c.moveTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104); c.lineTo(128 + Math.cos(a) * (i % 2 ? 90 : 80), 128 + Math.sin(a) * (i % 2 ? 90 : 80)); c.stroke(); } c.fillStyle = ink; c.textAlign = "center"; c.save(); c.translate(128, 196); c.scale(0.62, 1); c.font = "900 50px CromaticSans, 'Arial Narrow', sans-serif"; c.fillText(label, 0, 0); c.restore(); c.beginPath(); c.arc(128, 128, 9, 0, 7); c.fill(); });
  const gFace = [], gNeedle = [];
  [["COMM", 8, -4.2, "#F5EC0A", "#0D0C09"], ["UNITY", 6, 4.2, "#4CAF4C", "#0D0C09"]].forEach(([lab, mk, gx, faceC, inkC]) => {
    const pod = new K.Group(); pod.position.set(gx, 14.6, 7.6); g.add(pod);
    const rim = new K.Mesh(new K.CylinderGeometry(3.3, 3.3, 1.6, 40), M("#cfd2d6", { metalness: 0.6, roughness: 0.3 })); rim.rotation.x = Math.PI / 2; pod.add(rim);
    const gt = gaugeT(lab, mk, faceC, inkC), fm = new K.MeshStandardMaterial({ map: gt, emissiveMap: gt, emissive: new K.Color("#ffffff"), emissiveIntensity: 0, roughness: 0.4 });
    const face = new K.Mesh(new K.CylinderGeometry(2.9, 2.9, 0.2, 40), fm); face.rotation.x = Math.PI / 2; face.position.z = 0.75; pod.add(face); gFace.push(fm);
    const nd = new K.Group(); nd.position.z = 0.95; pod.add(nd); const bar = new K.Mesh(new K.BoxGeometry(0.16, 2.3, 0.1), new K.MeshStandardMaterial({ color: "#ff5a1f", emissive: new K.Color("#ff5a1f"), emissiveIntensity: 0.6 })); bar.position.y = 1.1; nd.add(bar); gNeedle.push(nd);
  });
  // ---- the windscreen behind: the night street's lights out of focus, the yellow bonnet's line
  const bokehM = (c) => new K.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 14; i++) { const d = new K.Mesh(new K.CircleGeometry(2 + (i % 4), 24), bokehM(i % 3 ? "#ffcf8a" : "#ff9e5a")); d.position.set(-70 + i * 11, 34 + (i % 5) * 6, -110 - (i % 3) * 20); g.add(d); }
  box(160, 2, 80, M("#c99b18", { roughness: 0.4, metalness: 0.3 }), 0, 24, -70);
  // ---- light: the cabin at night (a cool low fill), a soft key; the stereo's blue on the console when it is on
  const fill = new K.DirectionalLight("#9fb2ff", 0.55); fill.position.set(-30, 60, 80); fill.target.position.set(0, 0, 0); g.add(fill, fill.target);
  const key = new K.DirectionalLight("#ffe2b8", 0.75); key.position.set(25, 25, 60); key.target.position.set(0, 2, 8); g.add(key, key.target);
  const glow = new K.DirectionalLight(BLUE, 0); glow.position.set(0, -14, 30); glow.target.position.set(0, 4, 0); g.add(glow, glow.target);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; } }); // (no culling: small parts far out over the city got culled mid-shot)
  const sm = (x) => x * x * (3 - 2 * x), cl = (v) => Math.max(0, Math.min(1, v));
  // the cues (s, from the video's start = this shot's; the cut to Olari at 2.2), on Sorin's radio sound (power
  // click, tuning static, the station locking) and his beat grid (sound/_work/c6-pulse-cues-draft.json, 86.49 bpm):
  // the engine catches 0.45; the display lights 0.85 (backlight, all segments for a blink), the text steps in from
  // the right 0.92 - 1.10 and settles as the station locks (ST); the blue lights come up with the display and from
  // 1.10 breathe on his kicks (1.47, 2.16 in this shot, strength 0.6; 2.86, 3.55 ... fall after the cut)
  const CUE = { engine: 0.45, displayOn: 0.85, textIn: 0.92, settled: 1.10, station: 1.10, pulse: 1.10, cut: 2.2, kicks: [[1.4688, 0.6], [2.1625, 0.6], [2.8563, 0.6], [3.55, 1]] };
  const TEXT = "CROMATIC FM 101.4";
  return { group: g, cues: CUE, pose(t) {
    const k = t - CUE.engine, rest = Math.PI * 0.75; // (the needle's rest: the dial's start, lower left; it turns clockwise)
    const jump = (target) => k <= 0 ? 0 : target * (1 - Math.exp(-k * 7) * Math.cos(k * 22));
    gNeedle[0].rotation.z = rest - jump(1.15); gNeedle[1].rotation.z = rest - jump(1.7);
    const flick = k < 0 ? 0 : k < 0.04 ? 1 : k < 0.08 ? 0.15 : 1; gFace.forEach((m) => { m.emissiveIntensity = 0.28 * flick; });
    // the radio: the backlight up in 0.1 s; the segment test; the text stepping in a cell at a time
    const on = sm(cl((t - CUE.displayOn) / 0.1));
    let txt = "", test = false;
    if (t >= CUE.displayOn && t < CUE.textIn) test = t < CUE.displayOn + 0.06;
    else if (t >= CUE.textIn) { const u = cl((t - CUE.textIn) / (CUE.settled - CUE.textIn)), sh = Math.round((1 - sm(u)) * TEXT.length); txt = " ".repeat(sh) + TEXT.slice(0, TEXT.length - sh); }
    drawDisp(on, txt, test, t >= CUE.station);
    // the blue lights: up with the display, then breathing on the beat (a soft swell and fall, never off)
    // a slow breath from the lock, and a swell on each kick (quick up, a long soft fall), never off
    let pulse = 0; if (t >= CUE.pulse) { const br = sm(cl((t - CUE.pulse) / 0.3)); pulse = 0.18 * br * (0.5 - 0.5 * Math.cos(2 * Math.PI * (t - CUE.kicks[0][0]) / (60 / 86.486) + Math.PI)); for (const [kt, ks] of CUE.kicks) { const d = t - kt; if (d > -0.03 && d < 0.9) pulse += ks * (d < 0 ? sm((d + 0.03) / 0.03) : Math.exp(-d * 5)); } }
    const lvl = on * (0.6 + 0.55 * Math.min(1.2, pulse));
    ringM.emissiveIntensity = 1.5 * lvl; stripM.emissiveIntensity = 2.0 * lvl; halo.material.opacity = 0.22 * lvl; faceM.emissiveIntensity = 1.1 * on; btnM.emissiveIntensity = 1.1 * on; glow.intensity = 0.55 * lvl;
    g.updateMatrixWorld(true);
  } };
}
