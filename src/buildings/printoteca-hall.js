// Cromatic Studios · the map · Printoteca's hall (TASK-065d, Lia, for story D3; Daniel: "a hall like Patiline's, in
// chrome, the real logo on it, the four print-on-demand steps on one side"). A building module with the map's own
// API: build(parent, x, z, opts) adds a Group at (x, 0, z) in the city's logical coordinates (the shaders bend it, as
// every other building) and returns it.
//
// It is written without imports so it can live beside src/app.js (a pre-bundled IIFE with three inlined): it takes
// three's classes from its caller once:
//   const buildPrintotecaHall = makePrintotecaHall({ Group, Mesh, BoxGeometry, CylinderGeometry, PlaneGeometry,
//     MeshStandardMaterial, CanvasTexture, Color, RepeatWrapping, SRGBColorSpace });
//   const g = buildPrintotecaHall(world, LANE_PR.x, LANE_PR.z, { rotation: Math.atan2(LANE_PR.fx, LANE_PR.fz),
//     envMap: getEnvMap() });            // then, as the others: shadows on, a keep-out (EXTRA_KEEPOUT, r ~ 70)
//
// The hall: corrugated silver walls (64 wide, 104 deep, 34 high; local +z is its front, local +x its long side),
// a barrel roof of polished chrome (metal, low roughness, the city's environment map: the sun's glare and the sky's
// reflection slide over it as the camera moves), ink trim and a CMYK band under the eave. The front: the Printoteca
// logo painted large across the ribs (the real mark, 149 x 26 viewBox, #231f20), a roller door and a door. The long
// side: the logo again along its top, and under it the four print-on-demand steps as lit panels, redrawn as vectors (connect your shop, start selling, we print,
// we ship), numbered in the CMYK dots. opts.labels: the four captions (English by default).
export function makePrintotecaHall(K) {
  const LOGO_D = "m28.99 5.377h5.072v-5.071h-5.072zm-20.882-5.071h-7.608v25.361h5.072v-10.145h2.536c4.202 0 7.609-3.407 7.609-7.609s-3.407-7.607-7.609-7.607zm2.211 8.881c-.457.787-1.3 1.269-2.21 1.263h-2.536v-5.072h2.536c.91-.006 1.753.476 2.21 1.263.457.788.457 1.758 0 2.546zm11.808-8.448v-.434h-5.072v25.361h5.072v-17.753c0-.673.267-1.317.743-1.793.476-.475 1.121-.743 1.793-.743h2.536v-5.072h-2.536c-.864 0-1.722.146-2.536.434zm6.863 24.926h5.072v-17.751h-5.072zm19.607-23.964c-2.017-1.426-4.6-1.785-6.928-.962v-.434h-5.072v25.361h5.072v-17.753c-.007-.91.476-1.753 1.263-2.21s1.759-.457 2.546 0c.787.456 1.269 1.3 1.263 2.21v17.752h5.072v-17.752c0-2.47-1.199-4.786-3.216-6.212zm9.145-1.396h-5.096v5.072h5.096v20.288h5.048v-20.288h5.072v-5.072zm50.148.029c-4.191 0-7.592 3.388-7.608 7.578v10.144c-.011 2.725 1.437 5.248 3.796 6.614 2.358 1.366 5.267 1.366 7.624 0 2.359-1.366 3.807-3.889 3.796-6.614h-5.072c.006.91-.476 1.753-1.263 2.211-.787.456-1.759.456-2.546 0-.787-.457-1.269-1.301-1.263-2.211v-2.536h10.144v-7.607c-.016-4.19-3.417-7.579-7.608-7.579zm2.536 10.116h-5.072v-2.537c.009-1.394 1.142-2.519 2.536-2.519s2.526 1.125 2.536 2.519zm30.466-10.145c-4.202 0-7.608 3.407-7.608 7.608h5.072c.01-1.394 1.142-2.519 2.536-2.519s2.527 1.125 2.536 2.519v.005c-.002 1.398-1.136 2.53-2.534 2.532h-.002c-3.028.001-5.767 1.797-6.974 4.574-1.207 2.776-.654 6.005 1.41 8.22 2.065 2.215 5.245 2.996 8.1 1.987v.435h5.072v-17.753c0-4.202-3.406-7.608-7.608-7.608zm2.536 17.757c-.002 1.4-1.139 2.533-2.539 2.532-1.4-.002-2.534-1.138-2.533-2.538 0-1.4 1.136-2.534 2.536-2.534h.003c1.398.002 2.531 1.134 2.533 2.531zm-18.621-12.685c1.401 0 2.536 1.136 2.536 2.536h5.073c0-4.202-3.406-7.608-7.608-7.608s-7.608 3.406-7.608 7.608v10.144c0 4.202 3.406 7.609 7.608 7.609s7.608-3.407 7.608-7.609h-5.073c0 1.401-1.135 2.536-2.536 2.536-1.4 0-2.536-1.136-2.536-2.536v-10.144c0-1.4 1.136-2.536 2.536-2.536zm-48.687-5.072c-4.202 0-7.608 3.406-7.608 7.608v10.144c-.011 2.725 1.438 5.247 3.796 6.613 2.359 1.366 5.267 1.366 7.625 0 2.359-1.366 3.806-3.889 3.796-6.613v-10.144c0-2.018-.802-3.953-2.229-5.38-1.427-1.426-3.363-2.228-5.38-2.228zm2.536 17.753c0 1.4-1.136 2.535-2.536 2.535-1.401 0-2.536-1.135-2.536-2.535v-10.145c0-1.4 1.136-2.536 2.536-2.536s2.536 1.136 2.536 2.536zm10.856-17.753h-5.096v5.072h5.096v20.288h5.048v-20.288h5.072v-5.072z";
  const INK = "#231f20", CMYK = ["#00aeef", "#ec008c", "#ffde00", "#231f20"];
  const tex = (w, h, draw, { repeat = null } = {}) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    const t = new K.CanvasTexture(c); t.colorSpace = K.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = K.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  };
  // corrugation: vertical ribs, each a light crest and a dark trough (the paint on it is shaded by them too)
  const ribs = (ctx, w, h, pitch, base = [207, 211, 216]) => {
    ctx.fillStyle = `rgb(${base})`; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += pitch) { const g = ctx.createLinearGradient(x, 0, x + pitch, 0); g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(0.35, "rgba(255,255,255,0.05)"); g.addColorStop(0.62, "rgba(40,46,54,0.28)"); g.addColorStop(1, "rgba(255,255,255,0.35)"); ctx.fillStyle = g; ctx.fillRect(x, 0, pitch, h); }
  };
  const shadeRibs = (ctx, w, h, pitch) => { ctx.save(); ctx.globalCompositeOperation = "multiply"; for (let x = 0; x < w; x += pitch) { const g = ctx.createLinearGradient(x, 0, x + pitch, 0); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.62, "rgba(150,154,160,1)"); g.addColorStop(1, "rgba(255,255,255,1)"); ctx.fillStyle = g; ctx.fillRect(x, 0, pitch, h); } ctx.restore(); };
  const logo = (ctx, x, y, width, colour) => { const k = width / 149; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = colour; ctx.fill(new Path2D(LOGO_D)); ctx.restore(); };
  // the four steps, drawn as clean line icons (ink, round caps, 1 unit = 1/100 of the icon box)
  const ICONS = [
    // 1 · you connect your shop: a hub and six nodes
    (c, s) => { const n = [[18, 20], [74, 12], [86, 46], [78, 82], [24, 80], [10, 50]]; c.beginPath(); for (const [x, y] of n) { c.moveTo(50 * s, 48 * s); c.lineTo(x * s, y * s); } c.stroke(); c.beginPath(); c.arc(50 * s, 48 * s, 15 * s, 0, 7); c.fillStyle = "#fff"; c.fill(); c.stroke(); for (const [x, y] of n) { c.beginPath(); c.arc(x * s, y * s, 8 * s, 0, 7); c.fill(); c.stroke(); } },
    // 2 · you start selling: a browser window, a tee in it with a picture on its chest
    (c, s) => { c.beginPath(); c.roundRect(6 * s, 8 * s, 88 * s, 84 * s, 8 * s); c.stroke(); c.beginPath(); c.moveTo(6 * s, 22 * s); c.lineTo(94 * s, 22 * s); c.stroke(); for (const x of [16, 24, 32]) { c.beginPath(); c.arc(x * s, 15 * s, 2.4 * s, 0, 7); c.fillStyle = c.strokeStyle; c.fill(); }
      c.beginPath(); c.moveTo(36 * s, 34 * s); c.lineTo(28 * s, 38 * s); c.lineTo(20 * s, 50 * s); c.lineTo(30 * s, 56 * s); c.lineTo(34 * s, 52 * s); c.lineTo(34 * s, 84 * s); c.lineTo(66 * s, 84 * s); c.lineTo(66 * s, 52 * s); c.lineTo(70 * s, 56 * s); c.lineTo(80 * s, 50 * s); c.lineTo(72 * s, 38 * s); c.lineTo(64 * s, 34 * s); c.quadraticCurveTo(50 * s, 44 * s, 36 * s, 34 * s); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(40 * s, 74 * s); c.lineTo(47 * s, 62 * s); c.lineTo(52 * s, 69 * s); c.lineTo(56 * s, 64 * s); c.lineTo(61 * s, 74 * s); c.stroke(); c.beginPath(); c.arc(56 * s, 55 * s, 3 * s, 0, 7); c.stroke(); },
    // 3 · we print: a gear on a line, a tick before it and after it
    (c, s) => { c.beginPath(); c.moveTo(18 * s, 32 * s); c.lineTo(40 * s, 32 * s); c.moveTo(60 * s, 66 * s); c.lineTo(82 * s, 66 * s); c.moveTo(10 * s, 70 * s); c.lineTo(36 * s, 70 * s); c.moveTo(64 * s, 30 * s); c.lineTo(90 * s, 30 * s); c.stroke();
      const g = (cx, cy, r) => { c.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r : r * 1.28; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fillStyle = "#fff"; c.fill(); c.stroke(); c.beginPath(); c.arc(cx, cy, r * 0.42, 0, 7); c.stroke(); };
      g(50 * s, 50 * s, 17 * s); for (const [x, y] of [[18, 32], [82, 66]]) { c.beginPath(); c.arc(x * s, y * s, 9 * s, 0, 7); c.fillStyle = "#fff"; c.fill(); c.stroke(); c.beginPath(); c.moveTo((x - 4) * s, y * s); c.lineTo((x - 1) * s, (y + 3) * s); c.lineTo((x + 4.5) * s, (y - 3.5) * s); c.stroke(); } },
    // 4 · we ship: a parcel with its tape, on its way (speed lines), a tick
    (c, s) => { c.beginPath(); c.moveTo(34 * s, 30 * s); c.lineTo(62 * s, 20 * s); c.lineTo(90 * s, 30 * s); c.lineTo(90 * s, 68 * s); c.lineTo(62 * s, 80 * s); c.lineTo(34 * s, 68 * s); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(34 * s, 30 * s); c.lineTo(62 * s, 40 * s); c.lineTo(90 * s, 30 * s); c.moveTo(62 * s, 40 * s); c.lineTo(62 * s, 80 * s); c.moveTo(48 * s, 25 * s); c.lineTo(76 * s, 35 * s); c.lineTo(76 * s, 46 * s); c.stroke();
      for (const [y, l] of [[40, 20], [52, 26], [64, 16]]) { c.beginPath(); c.moveTo((28 - l) * s, y * s); c.lineTo(24 * s, y * s); c.stroke(); } }
  ];
  const panelTex = (k, label) => tex(512, 600, (c, w, h) => {
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.lineWidth = 18; c.strokeStyle = INK; c.strokeRect(9, 9, w - 18, h - 18);
    c.save(); c.translate(106, 70); c.lineWidth = 15; c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = INK; ICONS[k](c, 3.0); c.restore();
    // the step's number in its CMYK dot
    c.beginPath(); c.arc(84, 84, 46, 0, 7); c.fillStyle = CMYK[k]; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
    c.fillStyle = k === 3 ? "#ffffff" : INK; c.font = "800 54px CromaticSans, 'Google Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(k + 1), 84, 88);
    c.fillStyle = INK; c.textAlign = "center"; c.textBaseline = "alphabetic"; let fs = 58; c.font = `800 ${fs}px CromaticSans, 'Google Sans', sans-serif`; while (c.measureText(label).width > w - 60 && fs > 30) { fs -= 2; c.font = `800 ${fs}px CromaticSans, 'Google Sans', sans-serif`; }
    c.fillText(label, w / 2, 540);
  });
  return function buildPrintotecaHall(parent, x, z, opts = {}) {
    const { rotation = 0, envMap = null, labels = ["Connect your shop", "Start selling", "We print", "We ship"] } = opts;
    const W = 64, D = 104, H = 34, g = new K.Group(); g.name = "printotecaHall";
    // the walls: ribs 1.6 apart; the front with the logo painted over them, the door and the roller door
    const PX = 16; // canvas px per unit
    const sideT = tex(1024, 512, (c, w, h) => ribs(c, w, h, 26), { repeat: [D / 64, 1] });
    const front = tex(W * PX, H * PX, (c, w, h) => {
      ribs(c, w, h, 26);
      // the roller door (horizontal slats), the door, the dock's black lintel
      c.fillStyle = "#3a3d42"; c.fillRect(w * 0.52, h * 0.34, w * 0.34, h * 0.66); for (let y = h * 0.34; y < h; y += 14) { c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(w * 0.52, y, w * 0.34, 4); }
      c.fillStyle = INK; c.fillRect(w * 0.5, h * 0.3, w * 0.38, h * 0.05); c.fillRect(w * 0.12, h * 0.5, w * 0.16, h * 0.5); c.fillStyle = "#9fd7f2"; c.fillRect(w * 0.14, h * 0.53, w * 0.12, h * 0.2);
      // the logo, large, in ink, applied over the ribs (shaded by them: paint, not a sticker)
      logo(c, w * 0.08, h * 0.08, w * 0.84, INK); shadeRibs(c, w, h * 0.3, 26);
    });
    // the long side (+x): its own picture, the ribs and the logo painted along its top, over the four steps
    const longT = tex(D * PX, H * PX, (c, w, h) => { ribs(c, w, h, 26); logo(c, w * 0.32, h * 0.16, w * 0.36, INK); shadeRibs(c, w, h * 0.38, 26); });
    const plain = new K.MeshStandardMaterial({ map: sideT, roughness: 0.42, metalness: 0.6, envMap, envMapIntensity: 0.7 });
    const longM = new K.MeshStandardMaterial({ map: longT, roughness: 0.42, metalness: 0.55, envMap, envMapIntensity: 0.6 });
    const frontM = new K.MeshStandardMaterial({ map: front, roughness: 0.42, metalness: 0.55, envMap, envMapIntensity: 0.6 });
    const backM = plain;
    // (box faces: +x the long side with the steps, -x, top, bottom, +z the front, -z the back)
    const body = new K.Mesh(new K.BoxGeometry(W, H, D), [longM, plain, plain, plain, frontM, backM]); body.position.y = H / 2; g.add(body);
    // the chrome roof: a barrel along the hall's length, polished (its ribs in the colour map, the glare is the light's)
    const roofT = tex(1024, 64, (c, w, h) => { c.fillStyle = "#e9edf2"; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { c.fillStyle = "rgba(120,128,138,0.35)"; c.fillRect(x, 0, 5, h); c.fillStyle = "rgba(255,255,255,0.6)"; c.fillRect(x + 7, 0, 3, h); } }, { repeat: [3, 1] });
    const chrome = new K.MeshStandardMaterial({ map: roofT, color: "#ffffff", metalness: 1, roughness: 0.14, envMap, envMapIntensity: 1.5 });
    const gable = new K.MeshStandardMaterial({ map: sideT, roughness: 0.42, metalness: 0.6, envMap, envMapIntensity: 0.7 });
    const rg = new K.CylinderGeometry(W / 2 + 1, W / 2 + 1, D + 2, 48, 1, false, Math.PI / 2, Math.PI); rg.rotateX(Math.PI / 2);
    const roof = new K.Mesh(rg, [chrome, gable, gable]); roof.scale.set(1, 0.36, 1); roof.position.y = H; g.add(roof);
    // ink trim: the base, the eave; the CMYK band under the eave all round
    const inkM = new K.MeshStandardMaterial({ color: INK, roughness: 0.5 });
    for (const [y, h] of [[1.2, 2.4], [H - 0.6, 1.2]]) { const b = new K.Mesh(new K.BoxGeometry(W + 0.8, h, D + 0.8), inkM); b.position.y = y; g.add(b); }
    CMYK.forEach((col, i) => { const b = new K.Mesh(new K.BoxGeometry(W + 0.6, 0.7, D + 0.6), new K.MeshStandardMaterial({ color: col, roughness: 0.5 })); b.position.y = H - 1.6 - i * 0.7; g.add(b); });
    // the long side's four steps: lit panels on standoffs, a little proud of the ribs
    const pw = 16, ph = 17, gap = (D - 4 * pw) / 5; // (under the logo band)
    labels.forEach((lab, k) => {
      const t = panelTex(k, lab), face = new K.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new K.Color("#ffffff"), emissiveIntensity: 0.32, roughness: 0.6 });
      const p = new K.Mesh(new K.BoxGeometry(0.8, ph, pw), [face, inkM, inkM, inkM, inkM, inkM]);
      // (+x face of the box looks out of the side; z runs front to back: step 1 nearest the front)
      p.position.set(W / 2 + 0.9, 3.4 + ph / 2, D / 2 - gap - pw / 2 - k * (pw + gap)); p.rotation.y = 0; g.add(p);
      // its uv: the panel's +x face shows the canvas the right way round from outside (u along -z)
    });
    // a canopy over the roller door and two bollards (the dock)
    const can = new K.Mesh(new K.BoxGeometry(W * 0.42, 0.8, 7), inkM); can.position.set(W * 0.19, H * 0.72, D / 2 + 3.5); g.add(can);
    for (const bx of [W * 0.04, W * 0.36]) { const b = new K.Mesh(new K.CylinderGeometry(0.9, 0.9, 4, 10), new K.MeshStandardMaterial({ color: "#ffde00", roughness: 0.5 })); b.position.set(bx, 2, D / 2 + 6); g.add(b); }
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    g.position.set(x, 0, z); g.rotation.y = rotation; parent.add(g);
    return g;
  };
}
