// Cromatic · metro mockups (TASK-062): a metro car (a generic modern Bucharest-style unit, not any maker's livery):
// a painted body with a dark window band and a blue stripe, four double doors a side, wide windows, an interior with
// longitudinal seats, poles, light strips and ad frames (portrait beside the doors, landscape in the coves).
// Car local units: x along (centre 0), y up (the floor at 0), z across (side A at +HW faces the platform).
import * as THREE from "three";
import { rng } from "./lib.js";
import * as T from "./tex.js";
import { std, box, plane, lightbox, poster, POSTERS, frameMat } from "./station.js";

export const CAR = 19.0, GAP = 0.6, HW = 1.4, BODY_BOT = -0.62, CANT = 2.2, ROOF = 2.55;
export const DOORS = [-7.25, -2.45, 2.45, 7.25], DOOR_W = 1.3, DOOR_H = 1.97, LEAF_W = DOOR_W / 2;
// windows per bay [x0, x1] (y from SILL to WTOP); panels 0.6 m beside each door carry the interior posters
export const SILL = 0.88, WTOP = 1.84;
export const WINDOWS = [[-9.25, -8.6], [-6.0, -3.7], [-1.1, 1.1], [3.7, 6.0], [8.6, 9.25]];
// the exterior wrap on side A (the banner, 2.5:1) over the middle bay
export const WRAP = { kind: "wide", x: 0, y: 1.03, w: 3.32 }; // (2:1, over the bay's window: a perforated film)

function rrect(s, x0, y0, x1, y1, r, hole = false) {
  const p = hole ? new THREE.Path() : s;
  p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
  p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
  if (hole) s.holes.push(p);
  return p;
}
function sideShape() {
  const s = new THREE.Shape();
  rrect(s, -CAR / 2, BODY_BOT, CAR / 2, CANT, 0.05);
  for (const d of DOORS) rrect(s, d - DOOR_W / 2, 0.0, d + DOOR_W / 2, DOOR_H, 0.06, true);
  for (const [a, b] of WINDOWS) rrect(s, a, SILL, b, WTOP, 0.09, true);
  return s;
}
// the livery, as a canvas over the side (19 m x 2.82 m at 160 px a metre)
function livery({ seed = 3 } = {}) {
  const K = 160, w = Math.round(CAR * K), h = Math.round((CANT - BODY_BOT) * K), c = T.canvas(w, h), x = c.getContext("2d"), r = rng(seed);
  const Y = (y) => h - (y - BODY_BOT) * K, X = (xx) => (xx + CAR / 2) * K;
  x.fillStyle = "#d4d8db"; x.fillRect(0, 0, w, h);
  T.overlay(x, T.greyTile(256, { P: 6, oct: 4, seed }, { lo: 0.9, hi: 1 }), { op: "multiply", a: 0.6, seed, scale: 2 });
  // the dark window band (doors keep the body colour), the stripe
  x.fillStyle = "#1a1d21";
  for (const [a, b] of WINDOWS) x.fillRect(X(a - 0.22), Y(WTOP + 0.1), (b - a + 0.44) * K, (WTOP - SILL + 0.2) * K);
  x.fillStyle = "#1f58a6"; x.fillRect(0, Y(0.62), w, 0.1 * K);
  x.fillStyle = "#14396e"; x.fillRect(0, Y(0.515), w, 0.012 * K);
  // the skirt below the floor, darker; grime rising from it (brake dust)
  x.fillStyle = "#5a5d60"; x.fillRect(0, Y(-0.12), w, h - Y(-0.12));
  const g = x.createLinearGradient(0, Y(BODY_BOT), 0, Y(0.5)); g.addColorStop(0, "rgba(80,62,48,0.45)"); g.addColorStop(1, "rgba(80,62,48,0)");
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // panel seams and rivet lines
  x.strokeStyle = "rgba(60,64,70,0.35)"; x.lineWidth = 1.2;
  for (let s = -CAR / 2 + 1.2; s < CAR / 2; s += 2.38) { x.beginPath(); x.moveTo(X(s), Y(CANT)); x.lineTo(X(s), Y(SILL - 0.05)); x.stroke(); }
  x.beginPath(); x.moveTo(0, Y(-0.12)); x.lineTo(w, Y(-0.12)); x.stroke();
  // rain streaks under the windows
  for (const [a, b] of WINDOWS) for (let i = 0; i < 14; i++) { const sx = X(a + r() * (b - a)), sy = Y(SILL - 0.1), l = (0.1 + r() * 0.5) * K; const lg = x.createLinearGradient(0, sy, 0, sy + l); lg.addColorStop(0, "rgba(90,85,78,0.12)"); lg.addColorStop(1, "rgba(90,85,78,0)"); x.fillStyle = lg; x.fillRect(sx, sy, 1 + r() * 2, l); }
  return c;
}

const loadOnce = {};
function stickerMat() {
  const c = T.canvas(256, 96), x = c.getContext("2d");
  x.fillStyle = "#f3f1ea"; x.beginPath(); x.roundRect(4, 4, 248, 88, 10); x.fill();
  x.strokeStyle = "#c8242b"; x.lineWidth = 7; x.beginPath(); x.arc(48, 48, 30, 0, 6.283); x.stroke(); x.beginPath(); x.moveTo(27, 27); x.lineTo(69, 69); x.stroke();
  x.fillStyle = "#222"; x.fillRect(40, 30, 6, 36); x.fillRect(52, 34, 5, 30);
  x.font = "bold 17px sans-serif"; x.fillText("NU VĂ SPRIJINIȚI", 88, 44); x.fillText("DE UȘI", 88, 66);
  return std({ map: T.tex(c), roughness: 0.4 });
}
// opts: { wrap (bool: the banner on side A), interior (bool), posters (bool: the interior frames), seed, k (poster 1/expo) }
export async function buildCar(opts = {}) {
  const car = new THREE.Group(), r = rng(opts.seed || 5);
  const shape = sideShape();
  const lv = loadOnce.lv || (loadOnce.lv = T.tex(livery(), { rep: [1 / CAR, 1 / (CANT - BODY_BOT)] }));
  lv.offset.set(0.5, -BODY_BOT / (CANT - BODY_BOT));
  const paint = std({ map: lv, roughness: 0.3, metalness: 0.12, envMapIntensity: 1.3 });
  paint.defines = { CZ_RS: "1.0" };
  const ext = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false, curveSegments: 6 });
  for (const sgn of [1, -1]) {
    const m = new THREE.Mesh(ext, paint); m.castShadow = m.receiveShadow = true;
    if (sgn > 0) m.position.z = HW - 0.08; else { m.rotation.y = Math.PI; m.position.z = -HW + 0.08; }
    m.userData.part = "body"; car.add(m);
  }
  // roof (a shallow arc) and the ends
  const R = (HW * HW + (ROOF - CANT) ** 2) / (2 * (ROOF - CANT)), th = Math.asin(HW / R);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(R, R, CAR, 48, 1, true, Math.PI / 2 - th, 2 * th), std({ color: 0x7f8388, roughness: 0.72, metalness: 0.3 }));
  roof.rotation.z = Math.PI / 2; roof.position.y = ROOF - R; roof.castShadow = true; roof.userData.part = "roof"; car.add(roof);
  for (const e of [-1, 1]) car.add(box(0.06, CANT - BODY_BOT, 2 * HW, std({ color: 0x2b2e31, roughness: 0.7 }), e * (CAR / 2 - 0.03), (CANT + BODY_BOT) / 2, 0));
  // glass in the windows (inset), dark and reflective; the interior shows through
  const glass = new THREE.MeshStandardMaterial({ color: 0x0b0e12, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.32, envMapIntensity: 1.4, depthWrite: false });
  glass.defines = { CZ_RS: "1.0" };
  const glassParts = [];
  for (const sgn of [1, -1]) for (const [a, b] of WINDOWS) {
    const g = plane(b - a, WTOP - SILL, glass, { pos: [(a + b) / 2, (SILL + WTOP) / 2, sgn * (HW - 0.05)], rot: [0, sgn > 0 ? 0 : Math.PI, 0], recv: false });
    g.renderOrder = 2; g.userData.part = "glass"; car.add(g); glassParts.push(g);
  }
  // the doors: two leaves each, outside the skin (they slide along it); a window in each
  const leafShape = new THREE.Shape(); rrect(leafShape, -LEAF_W / 2, 0.0, LEAF_W / 2, DOOR_H, 0.04);
  rrect(leafShape, -LEAF_W / 2 + 0.11, 0.8, LEAF_W / 2 - 0.11, 1.86, 0.06, true);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.04, bevelEnabled: false, curveSegments: 6 });
  const leafMat = std({ color: 0xd3d6d9, roughness: 0.35, metalness: 0.2 });
  const sealMat = std({ color: 0x15171a, roughness: 0.8 });
  const doors = [];
  const doorSticker = loadOnce.sticker || (loadOnce.sticker = stickerMat());
  for (const sgn of [1, -1]) for (const d of DOORS) for (const s of [-1, 1]) {
    const leaf = new THREE.Group();
    const m = new THREE.Mesh(leafGeo, leafMat); m.castShadow = m.receiveShadow = true; leaf.add(m);
    leaf.add(box(0.03, DOOR_H, 0.045, sealMat, -s * (LEAF_W / 2 - 0.015), DOOR_H / 2, 0.02)); // (the rubber where the leaves meet)
    const lg = plane(LEAF_W - 0.22, 1.06, glass, { pos: [0, 1.33, 0.02], recv: false }); lg.renderOrder = 2; leaf.add(lg); glassParts.push(lg);
    // the leaf's inner face: brushed stainless steel, the window cut out
    { const inner = new THREE.Mesh(new THREE.ShapeGeometry(leafShape, 6), loadOnce.leafIn || (loadOnce.leafIn = (() => { const b = T.brushed({ base: "#a9adb1", seed: 9 }); const m = std({ map: T.tex(b.map, { rep: [1.5, 1.5] }), roughnessMap: T.tex(b.rough, { srgb: false, rep: [1.5, 1.5] }), roughness: 1, metalness: 0.85, envMapIntensity: 1.2 }); m.defines = { CZ_RS: "1.0" }; return m; })()));
      inner.position.z = -0.0015; inner.rotation.y = Math.PI; leaf.add(inner); } // (the shape is symmetric)
    if (doorSticker) { const st = plane(0.2, 0.075, doorSticker, { pos: [0, 0.68, -0.002], rot: [0, Math.PI, 0] }); leaf.add(st); }
    leaf.userData = { door: d, side: sgn, s, x0: d + s * LEAF_W / 2 };
    leaf.position.set(d + s * LEAF_W / 2, 0, sgn * (HW - 0.065)); // (pocket doors: the leaves run inside the body's skin)
    if (sgn < 0) leaf.rotation.y = Math.PI;
    car.add(leaf); doors.push(leaf);
  }
  // the threshold and the door pockets' dark edges
  for (const sgn of [1, -1]) for (const d of DOORS) car.add(box(DOOR_W, 0.03, 0.12, std({ color: 0x8d9093, metalness: 0.8, roughness: 0.4 }), d, 0.015, sgn * (HW - 0.06)));

  // the wrap on side A: the banner as a decal over the middle bay (v1; v2 prints it on the body: exteriorV2)
  if (opts.wrap && !opts.v2) {
    const t0 = await poster(WRAP.kind), h = WRAP.w / POSTERS[WRAP.kind].ar;
    // the film is perforated where it covers the window: a fine dot screen, the dark glass behind it showing through
    const img = t0.image, cw = img.width * 2, ch = img.height * 2, cv = T.canvas(cw, ch), cx = cv.getContext("2d");
    cx.drawImage(img, 0, 0, cw, ch);
    const wx0 = ((-1.1 - (WRAP.x - WRAP.w / 2)) / WRAP.w) * cw, wx1 = ((1.1 - (WRAP.x - WRAP.w / 2)) / WRAP.w) * cw;
    const wy0 = ((WRAP.y + h / 2 - WTOP) / h) * ch, wy1 = ((WRAP.y + h / 2 - SILL) / h) * ch, pitch = cw / (WRAP.w / 0.004);
    cx.fillStyle = "rgba(10,12,16,0.26)";
    for (let yy = wy0; yy < wy1; yy += pitch) for (let xx = wx0 + ((Math.round((yy - wy0) / pitch) % 2) * pitch) / 2; xx < wx1; xx += pitch) { cx.beginPath(); cx.arc(xx, yy, pitch * 0.32, 0, 6.283); cx.fill(); }
    const t = T.tex(cv); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    const wm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.3, metalness: 0.0, envMapIntensity: 0.8 });
    wm.defines = { CZ_RS: "1.0" };
    const w = plane(WRAP.w, h, wm, { pos: [WRAP.x, WRAP.y, HW + 0.004] }); w.userData.part = "wrap"; w.renderOrder = 3; car.add(w);
  }

  // the doors from inside: the yellow threshold, the display over each door (amber: "Următoarea stație")
  const disp = T.canvas(512, 64), dx = disp.getContext("2d");
  dx.fillStyle = "#0c0c0c"; dx.fillRect(0, 0, 512, 64);
  dx.fillStyle = "#ffae2a"; dx.font = "bold 30px monospace"; dx.fillText("URMĂTOAREA STAȚIE", 18, 42);
  const dispMat = std({ map: T.tex(disp), emissiveMap: T.tex(disp), emissive: 0xffffff, emissiveIntensity: 1.4, roughness: 0.2 });
  for (const sgn of [1, -1]) for (const d of DOORS) {
    const yl = box(DOOR_W, 0.004, 0.1, std({ color: 0xd9a419, roughness: 0.7 }), d, 0.003, sgn * (HW - 0.17)); car.add(yl);
    const dp = plane(0.62, 0.078, dispMat, { pos: [d, DOOR_H + 0.12, sgn * (HW - 0.09)], rot: [0, sgn > 0 ? Math.PI : 0, 0] }); car.add(dp);
    car.add(box(DOOR_W + 0.12, 0.2, 0.03, std({ color: 0xc5c8ca, roughness: 0.45, metalness: 0.3 }), d, DOOR_H + 0.12, sgn * (HW - 0.1)));
  }
  if (opts.interior !== false) await interior(car, opts);
  car.userData = { doors, glassParts, glassMat: glass };
  if (opts.v2) await exteriorV2(car, { wrap: !!opts.wrap, number: opts.number || "", seed: opts.seed || 3 });
  return car;
}

// ---------- inside ----------
async function interior(car, opts) {
  const r = rng(11);
  // floor: grey rubber with speckles, the aisle a little worn
  const fl = T.canvas(1024, 256), fx = fl.getContext("2d");
  fx.fillStyle = "#53575b"; fx.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 9000; i++) { fx.fillStyle = r() < 0.5 ? "rgba(30,32,34,0.6)" : "rgba(170,172,170,0.5)"; fx.fillRect(r() * 1024, r() * 256, 1 + r() * 1.5, 1 + r() * 1.5); }
  const ag = fx.createLinearGradient(0, 0, 0, 256); ag.addColorStop(0.3, "rgba(255,255,255,0)"); ag.addColorStop(0.5, "rgba(255,255,255,0.07)"); ag.addColorStop(0.7, "rgba(255,255,255,0)");
  fx.fillStyle = ag; fx.fillRect(0, 0, 1024, 256);
  const floorMat = std({ map: T.tex(fl, { rep: [4, 1] }), roughness: 0.75 });
  car.add(plane(CAR, 2 * HW - 0.16, floorMat, { pos: [0, 0.001, 0], rot: [-Math.PI / 2, 0, 0] }));
  // the inner skin of both sides: a light laminate with the same openings
  const lc = T.canvas(2048, 320), lx = lc.getContext("2d"), LK = 2048 / CAR;
  lx.fillStyle = "#d6d9db"; lx.fillRect(0, 0, 2048, 320);
  T.overlay(lx, T.greyTile(256, { P: 8, oct: 4, seed: 5 }, { lo: 0.9, hi: 1 }), { op: "multiply", a: 0.7, seed: 3 });
  lx.strokeStyle = "rgba(90,96,102,0.55)"; lx.lineWidth = 1.2;
  for (let xx = -CAR / 2 + 0.6; xx < CAR / 2; xx += 1.2) { lx.beginPath(); lx.moveTo((xx + CAR / 2) * LK, 0); lx.lineTo((xx + CAR / 2) * LK, 320); lx.stroke(); }
  const kick = lx.createLinearGradient(0, 320, 0, 230); kick.addColorStop(0, "rgba(70,70,70,0.35)"); kick.addColorStop(1, "rgba(70,70,70,0)"); lx.fillStyle = kick; lx.fillRect(0, 0, 2048, 320);
  for (let i = 0; i < 120; i++) { lx.fillStyle = `rgba(60,60,60,${0.05 + r() * 0.12})`; lx.fillRect(r() * 2048, 270 + r() * 50, 4 + r() * 30, 1 + r() * 3); }
  const lamT = T.tex(lc, { rep: [1 / CAR, 1 / (CANT - BODY_BOT)] }); lamT.offset.set(0.5, -BODY_BOT / (CANT - BODY_BOT));
  const lam = std({ map: lamT, roughness: 0.42, metalness: 0.0, envMapIntensity: 0.6 });
  lam.defines = { CZ_RS: "0.6" };
  const inner = new THREE.ShapeGeometry(sideShape(), 6);
  for (const sgn of [1, -1]) {
    const m = new THREE.Mesh(inner, lam); m.receiveShadow = true;
    if (sgn > 0) { m.rotation.y = Math.PI; m.position.z = HW - 0.081; } else m.position.z = -HW + 0.081; // (the shape is symmetric in x)
    m.userData.part = "inner"; car.add(m);
  }
  // the door surrounds inside: a grey frame with a black rubber edge
  const trim = std({ color: 0x9fa4a8, roughness: 0.35, metalness: 0.6 }), rub = std({ color: 0x141618, roughness: 0.8 });
  for (const sgn of [1, -1]) for (const d of DOORS) {
    const z = sgn * (HW - 0.09);
    for (const e of [-1, 1]) { car.add(box(0.07, DOOR_H + 0.05, 0.02, trim, d + e * (DOOR_W / 2 + 0.035), (DOOR_H + 0.05) / 2, z)); car.add(box(0.015, DOOR_H, 0.03, rub, d + e * (DOOR_W / 2 - 0.004), DOOR_H / 2, z)); }
    car.add(box(DOOR_W + 0.14, 0.06, 0.02, trim, d, DOOR_H + 0.03, z));
  }
  // window and door linings (the reveal, light grey)
  const rev = std({ color: 0xbfc2c4, roughness: 0.5 });
  for (const sgn of [1, -1]) for (const [a, b] of WINDOWS) { car.add(box(b - a, 0.02, 0.08, rev, (a + b) / 2, SILL - 0.01, sgn * (HW - 0.04))); }
  // ceiling: a white vault, two light strips, the angled coves above the windows (ad frames sit there)
  const ceil = std({ color: 0xeef0f1, roughness: 0.6 });
  const vR = 3.2, vth = Math.asin((HW - 0.42) / vR);
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(vR, vR, CAR, 32, 1, true, Math.PI / 2 - vth, 2 * vth), ceil);
  vault.material.side = THREE.BackSide; vault.rotation.z = Math.PI / 2; vault.position.y = 2.36 - vR; car.add(vault);
  const coveH = 0.45, coveA = Math.PI / 4;
  for (const sgn of [1, -1]) {
    const cv = plane(CAR, coveH, std({ color: 0xe6e8e9, roughness: 0.5 }), { pos: [0, 2.0 + (coveH / 2) * Math.sin(coveA), sgn * (HW - 0.08 - (coveH / 2) * Math.cos(coveA))] });
    cv.rotation.set(coveA, sgn > 0 ? Math.PI : 0, 0, "YXZ"); // (facing down and in)
    car.add(cv);
  }
  const lightMat = std({ color: 0x000000, emissive: 0xf6f8ff, emissiveIntensity: 9 });
  for (const sgn of [1, -1]) car.add(box(CAR - 0.6, 0.02, 0.16, lightMat, 0, 2.33, sgn * 0.62, { cast: false, recv: false }));
  // seats: longitudinal benches in every bay, blue moquette on a steel base; glass screens at the door ends
  const moq = T.canvas(256, 256), mx = moq.getContext("2d"); mx.fillStyle = "#2b4378"; mx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) { mx.fillStyle = ["rgba(240,190,40,0.5)", "rgba(20,30,60,0.6)", "rgba(120,150,210,0.4)"][i % 3]; mx.fillRect(r() * 256, r() * 256, 1.5, 1.5); }
  const seatMat = std({ map: T.tex(moq, { rep: [6, 1] }), roughness: 0.95 });
  const steel = std({ color: 0xbfc3c7, roughness: 0.25, metalness: 1, envMapIntensity: 1.2 });
  steel.defines = { CZ_RS: "1.0" };
  const screenGlass = new THREE.MeshStandardMaterial({ color: 0xaab4bb, roughness: 0.08, transparent: true, opacity: 0.18, depthWrite: false });
  const bays = [[-9.3, -8.55], [-6.0, -3.7], [-1.15, 1.15], [3.7, 6.0], [8.55, 9.3]]; // (under the windows: the panels by the doors stay clear)
  for (const sgn of [1, -1]) for (const [a, b] of bays) {
    const L = b - a - 0.1, cx = (a + b) / 2, z = sgn * (HW - 0.32);
    car.add(box(L, 0.1, 0.46, seatMat, cx, 0.45, z));
    const back = box(L, 0.5, 0.08, seatMat, cx, 0.78, sgn * (HW - 0.12)); back.rotation.x = sgn * 0.12; car.add(back);
    car.add(box(L, 0.4, 0.04, steel, cx, 0.2, sgn * (HW - 0.52)));
    for (const e of [a + 0.05, b - 0.05]) { if (Math.abs(e) > 9.2) continue; const sc = box(0.02, 0.85, 0.55, screenGlass, e, 0.95, sgn * (HW - 0.36), { cast: false }); sc.renderOrder = 2; car.add(sc); car.add(box(0.03, 0.03, 0.55, steel, e, 1.38, sgn * (HW - 0.36))); }
  }
  // poles: vertical at the doors' sides and in the middle of each vestibule, handrails over the seats
  const pole = (x, z, y0 = 0, y1 = 2.3) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, y1 - y0, 14), steel); m.position.set(x, (y0 + y1) / 2, z); m.castShadow = true; car.add(m); };
  for (const d of DOORS) { pole(d, 0); for (const sgn of [1, -1]) for (const s of [-1, 1]) pole(d + s * (DOOR_W / 2 + 0.06), sgn * (HW - 0.15), 0.9, 2.2); }
  // by each door, a small panel: the door button and the intercom
  const panelM = std({ color: 0x8e9396, roughness: 0.4, metalness: 0.5 }), btn = std({ color: 0x1f8f3a, emissive: 0x1f8f3a, emissiveIntensity: 0.6 }), red = std({ color: 0xb3262a, roughness: 0.4 });
  for (const sgn of [1, -1]) for (const d of DOORS) { const x = d + (DOOR_W / 2 + 0.04), z = sgn * (HW - 0.105); car.add(box(0.06, 0.18, 0.02, panelM, x, 1.12, z)); car.add(box(0.036, 0.036, 0.012, btn, x, 1.16, z - sgn * 0.012)); car.add(box(0.026, 0.026, 0.012, red, x, 1.075, z - sgn * 0.012)); }
  for (const sgn of [1, -1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0165, CAR - 0.6, 12), steel); h.rotation.z = Math.PI / 2; h.position.set(0, 1.9, sgn * (HW - 0.55)); car.add(h); }
  // ad frames: portrait beside the doors (on the panels between a door and its window), landscape in the coves
  if (opts.posters !== false) {
    const k = opts.k ?? 1;
    const fmat = std({ color: 0xa9adb1, roughness: 0.35, metalness: 0.8 });
    const panelX = [];
    for (const d of DOORS) for (const s of [-1, 1]) { const x = d + s * (DOOR_W / 2 + 0.31); if (Math.abs(x) < CAR / 2 - 0.3) panelX.push(x); }
    let n = 0;
    for (const sgn of [1, -1]) for (const x of panelX) {
      const kind = n++ % 3 === 2 ? "tall" : "portrait", w = kind === "tall" ? 0.4 : 0.5;
      const g = await lightbox(kind, w, { k, b: 0.022, d: 0.03, mat: fmat, basic: false });
      g.position.set(x, 1.36, sgn * (HW - 0.081)); if (sgn > 0) g.rotation.y = Math.PI; g.userData.slot = { x, sgn }; car.add(g);
    }
    let m = 0;
    for (const sgn of [1, -1]) for (let x = -8.2; x <= 8.2; x += 1.15) {
      if (DOORS.some((d) => Math.abs(d - x) < 0.95)) continue;
      const kind = m++ % 2 ? "landscape" : "wide", w = kind === "wide" ? 0.8 : 0.6;
      const g = await lightbox(kind, w, { k, b: 0.015, d: 0.02, mat: fmat, basic: false });
      g.position.set(x, 2.0 + 0.22 * Math.sin(Math.PI / 4), sgn * (HW - 0.08 - 0.22 * Math.cos(Math.PI / 4)));
      g.rotation.set(Math.PI / 4, sgn > 0 ? Math.PI : 0, 0, "YXZ");
      car.add(g);
    }
  }
}

// the gangway's bellows: black rubber folds
function bellowsMat() {
  if (loadOnce.bellows) return loadOnce.bellows;
  const c = T.canvas(64, 256), x = c.getContext("2d"); x.fillStyle = "#15161a"; x.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 64; i += 8) { const g = x.createLinearGradient(i, 0, i + 8, 0); g.addColorStop(0, "#0c0d10"); g.addColorStop(0.5, "#3a3d44"); g.addColorStop(1, "#0c0d10"); x.fillStyle = g; x.fillRect(i, 0, 8, 256); }
  return (loadOnce.bellows = std({ map: T.tex(c, { rep: [1, 1] }), roughness: 0.7 }));
}
// a train of n cars on a slot (its group's x is where car 0's centre is; cars go to -x behind it)
export async function buildTrain({ n = 3, wrapCar = 0, interior = true, k = 1, v2 = false } = {}) {
  const tr = new THREE.Group(); const cars = [];
  for (let i = 0; i < n; i++) {
    const c = await buildCar({ wrap: i === wrapCar, interior, k, seed: 5 + i, v2, number: v2 ? String(2140 + i * 3) : "" });
    c.position.x = -i * (CAR + GAP); tr.add(c); cars.push(c);
    if (i > 0) tr.add(box(GAP, 2.1, 2.3, v2 ? bellowsMat() : std({ color: 0x1b1c1e, roughness: 0.9 }), -i * (CAR + GAP) + CAR / 2 + GAP / 2, 1.05, 0));
  }
  tr.userData.cars = cars;
  return tr;
}
// the interior's lights for a car (diffuse, jittered along the strips; specular from rect lights)
export function carLights(car, L, { shadows = 2 } = {}) {
  for (const sgn of [1, -1]) {
    const rl = new THREE.RectAreaLight(0xf6f8ff, 40, CAR - 0.6, 0.16); rl.position.set(0, 2.32, sgn * 0.62); rl.lookAt(0, -5, sgn * 0.62); car.add(rl);
  }
  for (let i = 0; i < 4; i++) {
    const x = -7 + (i % 2) * 14, z = i < 2 ? 0.62 : -0.62;
    const p = new THREE.PointLight(0xf6f8ff, 24, 0, 2); p.position.set(x, 2.25, z); p.castShadow = i < shadows; p.shadow.mapSize.set(1024, 1024); p.shadow.bias = -0.002; car.add(p);
    L.push({ l: p, base: [x, 2.25, z], jitter: [6.5, 0, 0.05] });
  }
}

// ---------- v2 exterior (TASK-062, Daniel: "the poster must look applied, like a real vinyl wrap") ----------
// The side is a tessellated skin with tumblehome (it leans in toward the cantrail and toward the skirt), its windows
// and doorways cut by an alpha map. Its livery is one texture that carries the wrap: the poster is printed on the body's
// own surface, so it follows the curve, is cut around the window gasket and the door trims, crosses the panel seams
// and rivet lines of the normal map and takes the body's gloss. Over the window glass a perforated film carries it on.
export const prof = (y) => (y > 0.55 ? -0.034 * (y - 0.55) ** 2 : -0.036 * (0.55 - y) ** 2);
function curvedPlane(x0, x1, y0, y1, nx, ny, zoff = 0) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0, nx, ny), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + (x0 + x1) / 2, y = p.getY(i) + (y0 + y1) / 2; p.setXYZ(i, x, y, prof(y) + zoff); }
  g.computeVertexNormals(); return g;
}
const WRAP2 = { x0: -1.76, x1: 1.76, y0: 0.13, y1: 1.89 }; // (the 2:1 poster, door trim to door trim)
const SEAMS_X = [-8.6, -7.95, -6.55, -6.0, -3.7, -3.15, -1.15, 1.15, 3.15, 3.7, 6.0, 6.55, 7.95, 8.6], SEAMS_Y = [0.0, 0.8, 2.08], RIVETS_Y = [0.04, 0.76, 2.13];
function rrPath(x, x0, y0, x1, y1, r) { x.beginPath(); x.moveTo(x0 + r, y0); x.lineTo(x1 - r, y0); x.quadraticCurveTo(x1, y0, x1, y0 + r); x.lineTo(x1, y1 - r); x.quadraticCurveTo(x1, y1, x1 - r, y1); x.lineTo(x0 + r, y1); x.quadraticCurveTo(x0, y1, x0, y1 - r); x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0); x.closePath(); }
// canvases for one side: colour (with the wrap when given), roughness, height (-> normals), alpha (the holes)
function sideV2Canvases({ wrapImg = null, number = "", seed = 3 }) {
  // (the wrapped side at 400 px a metre: the poster stays sharp at the stop)
  const K = wrapImg ? 400 : 200, w = Math.round(CAR * K), h = Math.round((CANT - BODY_BOT) * K), r = rng(seed);
  const X = (x) => (x + CAR / 2) * K, Y = (y) => h - (y - BODY_BOT) * K, L = (m) => m * K;
  const c = T.canvas(w, h), x = c.getContext("2d");
  x.fillStyle = "#e6e8e9"; x.fillRect(0, 0, w, h);
  T.overlay(x, T.greyTile(256, { P: 8, oct: 4, seed }, { lo: 0.93, hi: 1 }), { op: "multiply", a: 0.5, seed, scale: 1.5 });
  x.fillStyle = "#16191d"; for (const [a, b] of WINDOWS) x.fillRect(X(a - 0.2), Y(WTOP + 0.09), L(b - a + 0.4), L(WTOP - SILL + 0.18));
  x.fillStyle = "#1f58a6"; x.fillRect(0, Y(0.65), w, L(0.1)); x.fillStyle = "#14396e"; x.fillRect(0, Y(0.52), w, L(0.012));
  x.fillStyle = "#7d8186"; x.fillRect(0, Y(-0.02), w, h - Y(-0.02));
  // the door trims (brushed aluminium round each doorway, a dark gap outside them)
  for (const d of DOORS) { x.fillStyle = "#3b3f44"; rrPath(x, X(d - 0.7), Y(DOOR_H + 0.05), X(d + 0.7), Y(-0.005), L(0.07)); x.fill(); x.fillStyle = "#b5babf"; rrPath(x, X(d - 0.69), Y(DOOR_H + 0.04), X(d + 0.69), Y(0.0), L(0.065)); x.fill(); }
  // the wrap: printed on the panels, door trim to door trim (the window band under it is painted over first)
  if (wrapImg) { x.fillStyle = "#e6e8e9"; x.fillRect(X(WRAP2.x0), Y(WTOP + 0.12), L(WRAP2.x1 - WRAP2.x0), L(WTOP - SILL + 0.24)); }
  if (wrapImg) { x.drawImage(wrapImg, X(WRAP2.x0), Y(WRAP2.y1), L(WRAP2.x1 - WRAP2.x0), L(WRAP2.y1 - WRAP2.y0)); x.fillStyle = "rgba(255,255,255,0.03)"; x.fillRect(X(WRAP2.x0), Y(WRAP2.y1), L(WRAP2.x1 - WRAP2.x0), L(WRAP2.y1 - WRAP2.y0)); }
  // window gaskets (the vinyl is cut round them)
  for (const [a, b] of WINDOWS) { x.fillStyle = "#0c0d0f"; rrPath(x, X(a - 0.024), Y(WTOP + 0.024), X(b + 0.024), Y(SILL - 0.024), L(0.11)); x.fill(); }
  // seams and rivet lines show through paint and vinyl alike; grime low, streaks under the windows
  const sw = L(0.004); x.fillStyle = "rgba(30,34,40,0.3)"; for (const sx of SEAMS_X) x.fillRect(X(sx) - sw / 2, Y(CANT), sw, L(CANT - SILL + 0.05)); for (const sy of SEAMS_Y) x.fillRect(0, Y(sy) - sw / 2, w, sw);
  x.fillStyle = "rgba(20,22,26,0.3)"; for (const ry of RIVETS_Y) for (let rx = -CAR / 2 + 0.03; rx < CAR / 2; rx += 0.05) { x.beginPath(); x.arc(X(rx), Y(ry), L(0.004), 0, 6.283); x.fill(); x.fillStyle = "rgba(255,255,255,0.25)"; x.beginPath(); x.arc(X(rx) - L(0.0015), Y(ry) - L(0.0015), L(0.0018), 0, 6.283); x.fill(); x.fillStyle = "rgba(20,22,26,0.3)"; }
  const g = x.createLinearGradient(0, Y(BODY_BOT), 0, Y(0.45)); g.addColorStop(0, "rgba(84,66,50,0.42)"); g.addColorStop(1, "rgba(84,66,50,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (const [a, b] of WINDOWS) for (let i = 0; i < 16; i++) { const sx = X(a + r() * (b - a)), sy = Y(SILL - 0.05), l = L(0.1 + r() * 0.45); const lg = x.createLinearGradient(0, sy, 0, sy + l); lg.addColorStop(0, "rgba(80,74,66,0.1)"); lg.addColorStop(1, "rgba(80,74,66,0)"); x.fillStyle = lg; x.fillRect(sx, sy, 1 + r() * 2, l); }
  if (number) { x.fillStyle = "#24282d"; x.font = `600 ${L(0.07)}px Helvetica, Arial, sans-serif`; x.fillText(number, X(3.25), Y(1.02)); }
  // roughness (G): the paint and the vinyl's laminate glossy, rubber and trims less
  const rc = T.canvas(w >> 1, h >> 1), rx = rc.getContext("2d"); rx.scale(0.5, 0.5);
  rx.fillStyle = "rgb(0,58,0)"; rx.fillRect(0, 0, w, h);
  for (const d of DOORS) { rx.fillStyle = "rgb(0,90,0)"; rrPath(rx, X(d - 0.69), Y(DOOR_H + 0.04), X(d + 0.69), Y(-0.1), L(0.065)); rx.fill(); }
  for (const [a, b] of WINDOWS) { rx.fillStyle = "rgb(0,200,0)"; rrPath(rx, X(a - 0.024), Y(WTOP + 0.024), X(b + 0.024), Y(SILL - 0.024), L(0.11)); rx.fill(); }
  rx.fillStyle = "rgb(0,150,0)"; rx.fillRect(0, Y(-0.02), w, h);
  // height: seams are grooves, rivets and gaskets are raised, the trims stand proud
  const hc = T.canvas(w, h), hx = hc.getContext("2d");
  hx.fillStyle = "rgb(128,128,128)"; hx.fillRect(0, 0, w, h);
  for (const d of DOORS) { hx.fillStyle = "rgb(175,175,175)"; rrPath(hx, X(d - 0.69), Y(DOOR_H + 0.04), X(d + 0.69), Y(-0.1), L(0.065)); hx.fill(); hx.fillStyle = "rgb(60,60,60)"; hx.fillRect(X(d - 0.7) - 1, Y(DOOR_H + 0.05), 2, L(DOOR_H + 0.15)); hx.fillRect(X(d + 0.7) - 1, Y(DOOR_H + 0.05), 2, L(DOOR_H + 0.15)); }
  for (const [a, b] of WINDOWS) { hx.strokeStyle = "rgb(190,190,190)"; hx.lineWidth = L(0.02); rrPath(hx, X(a - 0.012), Y(WTOP + 0.012), X(b + 0.012), Y(SILL - 0.012), L(0.1)); hx.stroke(); }
  hx.fillStyle = "rgb(70,70,70)"; for (const sx of SEAMS_X) hx.fillRect(X(sx) - L(0.004), Y(CANT), L(0.008), L(CANT - SILL + 0.05)); for (const sy of SEAMS_Y) hx.fillRect(0, Y(sy) - L(0.004), w, L(0.008));
  for (const ry of RIVETS_Y) for (let rx2 = -CAR / 2 + 0.03; rx2 < CAR / 2; rx2 += 0.05) { const gg = hx.createRadialGradient(X(rx2), Y(ry), 0, X(rx2), Y(ry), L(0.007)); gg.addColorStop(0, "rgb(215,215,215)"); gg.addColorStop(1, "rgba(128,128,128,0)"); hx.fillStyle = gg; hx.beginPath(); hx.arc(X(rx2), Y(ry), L(0.007), 0, 6.283); hx.fill(); }
  // alpha: the holes (256 px a metre: crisp corners)
  const K2 = 256, ac = T.canvas(Math.round(CAR * K2), Math.round((CANT - BODY_BOT) * K2)), ax = ac.getContext("2d"), X2 = (xx) => (xx + CAR / 2) * K2, Y2 = (yy) => ac.height - (yy - BODY_BOT) * K2;
  ax.fillStyle = "#fff"; ax.fillRect(0, 0, ac.width, ac.height); ax.fillStyle = "#000";
  for (const [a, b] of WINDOWS) { rrPath(ax, X2(a), Y2(WTOP), X2(b), Y2(SILL), 0.09 * K2); ax.fill(); }
  for (const d of DOORS) { rrPath(ax, X2(d - DOOR_W / 2), Y2(DOOR_H), X2(d + DOOR_W / 2), Y2(0.0), 0.06 * K2); ax.fill(); ax.fillRect(X2(d - DOOR_W / 2), Y2(0.06), DOOR_W * K2, 0.06 * K2); } // (square at the sill)
  return { c, rc, nc: T.normalFrom(hc, 3), ac };
}
function leafV2Mats() {
  if (loadOnce.leafV2) return loadOnce.leafV2;
  const K = 300, w = Math.round(LEAF_W * K), h = Math.round(DOOR_H * K), c = T.canvas(w, h), x = c.getContext("2d");
  const wx0 = 0.11 * K, wx1 = w - 0.11 * K, wy0 = h - 1.86 * K, wy1 = h - 0.8 * K;
  x.fillStyle = "#e3e5e6"; x.fillRect(0, 0, w, h);
  T.overlay(x, T.greyTile(128, { P: 6, oct: 3, seed: 5 }, { lo: 0.93, hi: 1 }), { op: "multiply", a: 0.5, seed: 2 });
  const g = x.createLinearGradient(0, h, 0, h - 0.5 * K); g.addColorStop(0, "rgba(84,66,50,0.35)"); g.addColorStop(1, "rgba(84,66,50,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = "#0c0d0f"; rrPath(x, wx0 - 0.02 * K, wy0 - 0.02 * K, wx1 + 0.02 * K, wy1 + 0.02 * K, 0.07 * K); x.fill();
  const hc = T.canvas(w, h), hx = hc.getContext("2d"); hx.fillStyle = "rgb(128,128,128)"; hx.fillRect(0, 0, w, h);
  hx.strokeStyle = "rgb(90,90,90)"; hx.lineWidth = 6; hx.strokeRect(0, 0, w, h);
  hx.strokeStyle = "rgb(190,190,190)"; hx.lineWidth = 0.02 * K; rrPath(hx, wx0 - 0.01 * K, wy0 - 0.01 * K, wx1 + 0.01 * K, wy1 + 0.01 * K, 0.065 * K); hx.stroke();
  const ac = T.canvas(w, h), ax = ac.getContext("2d"); ax.fillStyle = "#fff"; ax.fillRect(0, 0, w, h); ax.fillStyle = "#000"; rrPath(ax, wx0, wy0, wx1, wy1, 0.06 * K); ax.fill();
  const m = std({ map: T.tex(c), alphaMap: T.tex(ac, { srgb: false }), alphaTest: 0.5, normalMap: T.tex(T.normalFrom(hc, 3), { srgb: false }), roughness: 0.26, metalness: 0.05, envMapIntensity: 1.15 });
  for (const t of [m.map, m.alphaMap, m.normalMap]) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  m.defines = { CZ_RS: "1.0" };
  return (loadOnce.leafV2 = m);
}
// replaces a v1 car's exterior: body skins, roof, window glass, door leaves' outer faces, the wrap
export async function exteriorV2(car, { wrap = false, number = "", seed = 3 } = {}) {
  const drop = car.children.filter((o) => o.userData.part === "body" || o.userData.part === "glass" || o.userData.part === "wrap" || o.userData.part === "roof");
  drop.forEach((o) => car.remove(o));
  const gp = car.userData.glassParts = car.userData.glassParts.filter((g) => !drop.includes(g));
  const mk = (cv) => { const m = std({ map: T.tex(cv.c), roughnessMap: T.tex(cv.rc, { srgb: false }), roughness: 1, normalMap: T.tex(cv.nc, { srgb: false }), alphaMap: T.tex(cv.ac, { srgb: false }), alphaTest: 0.5, metalness: 0.05, envMapIntensity: 0.6 }); for (const t of [m.map, m.roughnessMap, m.normalMap, m.alphaMap]) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; m.defines = { CZ_RS: "1.0" }; return m; };
  const wrapImg = wrap ? (await poster("wide")).image : null;
  const plain = loadOnce.plainV2 || (loadOnce.plainV2 = mk(sideV2Canvases({ seed: 3 })));
  const geo = loadOnce.skinGeo || (loadOnce.skinGeo = curvedPlane(-CAR / 2, CAR / 2, BODY_BOT, CANT, 380, 64));
  for (const sgn of [1, -1]) {
    const mat = sgn > 0 && (wrap || number) ? mk(sideV2Canvases({ wrapImg, number, seed })) : plain;
    const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; m.userData.part = "body";
    if (sgn > 0) m.position.z = HW; else { m.rotation.y = Math.PI; m.position.z = -HW; }
    car.add(m);
    // the doorways' jambs (the body's depth), following the curve
    for (const d of DOORS) for (const e of [-1, 1]) {
      const g = new THREE.PlaneGeometry(0.09, DOOR_H, 1, 24), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const u = p.getX(i) + 0.045, y = p.getY(i) + DOOR_H / 2; p.setXYZ(i, d + e * DOOR_W / 2, y, prof(y) - u); }
      g.computeVertexNormals();
      const j = new THREE.Mesh(g, loadOnce.jamb || (loadOnce.jamb = std({ color: 0x55595e, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide })));
      if (sgn > 0) j.position.z = HW; else { j.rotation.y = Math.PI; j.position.z = -HW; }
      car.add(j);
    }
    // window glass (curved, set in 2.8 cm), and over the wrapped bay's window the perforated film
    for (const [a, b] of WINDOWS) {
      const gm = new THREE.Mesh(curvedPlane(a, b, SILL, WTOP, 12, 10, -0.028), car.userData.glassMat);
      gm.renderOrder = 2; gm.userData.part = "glass"; if (sgn > 0) gm.position.z = HW; else { gm.rotation.y = Math.PI; gm.position.z = -HW; }
      car.add(gm); gp.push(gm);
      if (sgn > 0 && wrap && a < 0 && b > 0) {
        const K = 600, fw = Math.round((b - a) * K), fh = Math.round((WTOP - SILL) * K), fc = T.canvas(fw, fh), fx = fc.getContext("2d");
        const sx = ((a - WRAP2.x0) / (WRAP2.x1 - WRAP2.x0)) * wrapImg.width, sy = ((WRAP2.y1 - WTOP) / (WRAP2.y1 - WRAP2.y0)) * wrapImg.height;
        fx.drawImage(wrapImg, sx, sy, ((b - a) / (WRAP2.x1 - WRAP2.x0)) * wrapImg.width, ((WTOP - SILL) / (WRAP2.y1 - WRAP2.y0)) * wrapImg.height, 0, 0, fw, fh);
        fx.fillStyle = "rgba(14,16,20,0.16)"; fx.fillRect(0, 0, fw, fh); // (the film's holes darken it; seen from the platform it reads as the print, a shade deeper)
        const fm = new THREE.MeshStandardMaterial({ map: T.tex(fc), roughness: 0.26, metalness: 0.05, envMapIntensity: 0.6 });
        fm.map.wrapS = fm.map.wrapT = THREE.ClampToEdgeWrapping; fm.defines = { CZ_RS: "1.0" };
        const film = new THREE.Mesh(curvedPlane(a, b, SILL, WTOP, 30, 14, 0.0006), fm); film.position.z = HW; film.renderOrder = 3; film.userData.part = "wrap"; car.add(film);
      }
    }
    // the door head (the doorway's top)
    for (const d of DOORS) { const hd = box(DOOR_W, 0.015, 0.09, loadOnce.jamb, d, DOOR_H, sgn * (HW + prof(DOOR_H) - 0.045)); car.add(hd); }
  }
  // the roof from the curved cantrail, its gutter
  const c = HW + prof(CANT), sag = ROOF - CANT, R = (c * c + sag * sag) / (2 * sag), th = Math.asin(c / R);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(R, R, CAR, 64, 1, true, Math.PI / 2 - th, 2 * th), std({ color: 0x9ca0a4, roughness: 0.62, metalness: 0.25 }));
  roof.rotation.z = Math.PI / 2; roof.position.y = ROOF - R; roof.castShadow = true; roof.userData.part = "roof"; car.add(roof);
  for (const e of [-1, 1]) { const gu = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, CAR, 10), std({ color: 0x4c5055, roughness: 0.5, metalness: 0.5 })); gu.rotation.z = Math.PI / 2; gu.position.set(0, CANT + 0.008, e * (c + 0.006)); gu.castShadow = true; car.add(gu); }
  // the leaves: their outer faces follow the curve, 2.5 cm in from the skin (pocket doors), their glass too
  for (const leaf of car.userData.doors) {
    const old = leaf.children[0]; old.visible = false;
    const oldGlass = leaf.children.find((ch) => ch.isMesh && car.userData.glassParts.includes(ch) && ch.geometry.type === "PlaneGeometry" && !ch.userData.v2);
    if (oldGlass) { oldGlass.visible = false; car.userData.glassParts = car.userData.glassParts.filter((g) => g !== oldGlass); }
    const lx0 = -LEAF_W / 2 + 0.003, lx1 = LEAF_W / 2 - 0.003;
    const front = new THREE.Mesh(curvedPlane(lx0, lx1, 0.003, DOOR_H - 0.003, 6, 40, 0.04), leafV2Mats()); front.castShadow = front.receiveShadow = true; leaf.add(front);
    const lg = new THREE.Mesh(curvedPlane(-LEAF_W / 2 + 0.11, LEAF_W / 2 - 0.11, 0.8, 1.86, 6, 12, 0.026), car.userData.glassMat); lg.renderOrder = 2; lg.userData.v2 = true; leaf.add(lg); car.userData.glassParts.push(lg);
  }
}
