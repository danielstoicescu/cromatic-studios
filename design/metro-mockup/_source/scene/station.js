// Cromatic · metro mockups (TASK-062): a Bucharest-style metro station, built from boxes and our own textures.
// Units: metres. x along the track (right +), y up (the platform's floor at 0, the track bed at BED), z toward the
// camera. An island platform (from EDGEZ to EDGEZ + PW, columns down its middle) between two tracks; each track has a
// stone-clad wall with backlit poster frames, downlights under a cornice and a glazed colour band above it. The far
// side is the near side mirrored.
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { rng, Mirror, mirrorize } from "./lib.js";
import * as T from "./tex.js";

export const EDGEZ = -1.6, TRACKZ = -3.12, WALLZ = -5.7, BED = -1.1, PW = 10, CZ = EDGEZ + PW / 2;
export const RAIL_TOP = BED + 0.316;
const loadTex = (u) => new Promise((res, rej) => new THREE.TextureLoader().load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; res(t); }, undefined, rej));
export const POSTERS = {
  landscape: { url: "/site/media/litorsal/vibe-metro.jpg", ar: 1600 / 1067 },
  portrait: { url: "/site/media/litorsal/vibe-metro-portrait.jpg", ar: 900 / 1621 },
  tall: { url: "/site/media/litorsal/vibe-metro-tall.jpg", ar: 900 / 2025 },
  wide: { url: "/site/media/litorsal/vibe-metro-wide.jpg", ar: 1600 / 800 },
  banner: { url: "/site/media/litorsal/vibe-banner.jpg", ar: 1600 / 641 }
};
const cache = {};
export async function poster(kind) { if (!cache[kind]) cache[kind] = await loadTex(POSTERS[kind].url); return cache[kind]; }

export const std = (o) => new THREE.MeshStandardMaterial(o);
export function box(w, h, d, mat, x, y, z, { cast = true, recv = true } = {}) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; return m; }
export function plane(w, h, mat, { pos = [0, 0, 0], rot = [0, 0, 0], recv = true } = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(...pos); m.rotation.set(...rot); m.receiveShadow = recv; return m; }
// a geometry whose UVs are in metres / span (a texture covering `span` m repeats at its true size)
export function metricUV(geo, span, axisU = "x", axisV = "z") {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p["get" + axisU.toUpperCase()](i) / span, p["get" + axisV.toUpperCase()](i) / span);
  uv.needsUpdate = true; return geo;
}
// a poster in a backlit frame with a glass front, on a wall facing +z; returns the group (its origin: the frame's centre
// on the wall). The poster is unlit, in its own colours (k: 1/expo, the Neutral curve passes them through)
export const frameMat = std({ color: 0x9a9ea3, roughness: 0.38, metalness: 0.9, envMapIntensity: 1 });
export const glassMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 1.6 });
export async function lightbox(kind, w, { k = 1, b = 0.06, d = 0.11, mat = frameMat, basic = true } = {}) {
  const t = await poster(kind), h = w / POSTERS[kind].ar, g = new THREE.Group();
  g.add(box(w + 2 * b, b, d, mat, 0, h / 2 + b / 2, d / 2));
  g.add(box(w + 2 * b, b, d, mat, 0, -h / 2 - b / 2, d / 2));
  g.add(box(b, h, d, mat, -w / 2 - b / 2, 0, d / 2));
  g.add(box(b, h, d, mat, w / 2 + b / 2, 0, d / 2));
  g.add(box(w + 2 * b, h + 2 * b, 0.006, mat, 0, 0, 0.003));
  const pm = basic ? new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(k, k, k) }) : std({ map: t, roughness: 0.5 });
  const p = plane(w, h, pm, { pos: [0, 0, Math.max(0.009, d - 0.012)] }); p.userData.poster = kind; g.add(p);
  g.add(plane(w, h, glassMat, { pos: [0, 0, d - 0.004], recv: false }));
  g.userData = { w, h, poster: p };
  return g;
}

// opts: { W, H (render size, for the mirror), frames: [{ kind, x, w, yTop }] (near wall), farFrames, shadowX, posterK }
export async function buildStation(opts = {}) {
  RectAreaLightUniformsLib.init();
  const S = new THREE.Scene();
  S.background = new THREE.Color(0x050505);
  const r = rng(opts.seed || 11);
  const X0 = -30, X1 = 30, LEN = X1 - X0;
  const mirror = new Mirror(opts.W || 1920, opts.H || 1080, { y: 0, scale: 0.5 });
  const L = [];
  const spot = (parent, x, y, z, I, col, { cast = true, ang = 1.2, pen = 1, tx = x, ty = y - 5, tz = z, size = 1024, jitter = [0, 0, 0] } = {}) => {
    const s = new THREE.SpotLight(col, I, 0, ang, pen, 2); s.position.set(x, y, z); s.target.position.set(tx, ty, tz); s.castShadow = cast;
    s.shadow.mapSize.set(size, size); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.02; s.shadow.camera.near = 0.2; s.shadow.camera.far = 30;
    parent.add(s); parent.add(s.target); L.push({ l: s, base: [x, y, z], jitter }); return s;
  };
  const tubeRect = (parent, x, y, z, w, h, I, col, look) => { const l = new THREE.RectAreaLight(col, I, w, h); l.position.set(x, y, z); l.lookAt(...look); parent.add(l); return l; };

  // ---------- the platform's floor (polished granite, the mirror), its ceiling, its columns ----------
  const gr = T.granite({ seed: 3, base: "#6c6b68" });
  const floorMat = mirrorize(std({ map: T.tex(gr.map), roughnessMap: T.tex(gr.rough, { srgb: false }), roughness: 1, metalness: 0, envMapIntensity: 0.6 }), mirror, { k: 0.9, blur: 0.014 });
  floorMat.defines = { CZ_RS: "0.0" };
  const fw = PW - 0.72;
  const floor = new THREE.Mesh(metricUV(new THREE.PlaneGeometry(LEN, fw).rotateX(-Math.PI / 2), gr.span, "x", "z"), floorMat);
  floor.position.set(0, 0, CZ); floor.receiveShadow = true; S.add(floor);
  const edgeT = T.granite({ seed: 8, base: "#8d8b86", px: 1024, span: 2.4, tile: 1.2 });
  const edgeMat = mirrorize(std({ map: T.tex(edgeT.map), roughnessMap: T.tex(edgeT.rough, { srgb: false }), roughness: 1 }), mirror, { k: 0.35, blur: 0.008 });
  edgeMat.defines = { CZ_RS: "0.0" };
  const yl = T.canvas(2048, 64), yx = yl.getContext("2d");
  yx.fillStyle = "#e1b318"; yx.fillRect(0, 0, 2048, 64);
  T.overlay(yx, T.greyTile(256, { P: 8, oct: 4, seed: 4 }, { lo: 0.55, hi: 1 }), { op: "multiply", a: 0.45, seed: 2 });
  for (let i = 0; i < 160; i++) { yx.fillStyle = `rgba(110,105,98,${0.4 + r() * 0.5})`; yx.beginPath(); yx.ellipse(r() * 2048, r() * 64, 2 + r() * 14, 1 + r() * 5, 0, 0, 6.283); yx.fill(); }
  const yMat = std({ map: T.tex(yl, { rep: [LEN / 8, 1] }), roughness: 0.72 });
  const ceilY = 3.65;
  const slat = T.brushed({ base: "#b9bbbc", seed: 3 });
  const ceilMat = std({ map: T.tex(slat.map, { rep: [LEN / 2, 6] }), roughness: 0.55, metalness: 0.3 });
  S.add(plane(LEN, PW, ceilMat, { pos: [0, ceilY, CZ], rot: [Math.PI / 2, 0, 0] }));
  const lum = std({ color: 0x000000, emissive: 0xf4f7ff, emissiveIntensity: 7 });
  for (const z of [CZ - 2.2, CZ + 2.2]) for (let x = X0 + 1; x < X1; x += 3.2) S.add(box(1.5, 0.02, 0.18, lum, x, ceilY - 0.01, z, { cast: false, recv: false }));
  for (const z of [CZ - 2.2, CZ + 2.2]) tubeRect(S, 0, ceilY - 0.02, z, LEN, 0.18, 60, 0xf4f7ff, [0, -10, z]);
  spot(S, 0, ceilY - 0.05, CZ - 2.2, 60, 0xf4f7ff, { ang: 1.4, jitter: [12, 0, 0.09], cast: true });
  spot(S, 0, ceilY - 0.05, CZ + 2.2, 60, 0xf4f7ff, { ang: 1.4, jitter: [12, 0, 0.09], cast: false });
  // columns down the middle, clad in the same stone (every 9 m, clear of the shots' lines of sight)
  const colT = T.stoneWall({ W: 2.8, px: 512, H: ceilY, seed: 17, pw: 0.7, ph: 0.6 });
  const colMat = std({ map: T.tex(colT.map), roughness: 0.55 });
  for (const x of [-22.5, -13.5, -4.5, 4.5, 13.5, 22.5]) S.add(box(0.7, ceilY, 0.7, colMat, x, ceilY / 2, CZ));

  // ---------- a track side: edge, pit, track, wall, frames, cornice and its lights (near: as built; far: mirrored) ----------
  const wallTop = 3.4, wallBot = -0.2;
  async function side(frames, { far = false } = {}) {
    const G = new THREE.Group();
    for (const f of frames) f.h = f.w / POSTERS[f.kind].ar;
    // the edge nosing and the yellow line
    const edge = new THREE.Mesh(metricUV(new THREE.BoxGeometry(LEN, 0.08, 0.36), edgeT.span, "x", "z"), edgeMat); edge.position.set(0, -0.04, EDGEZ + 0.18); edge.receiveShadow = true; G.add(edge);
    const yline = plane(LEN, 0.1, yMat, { pos: [0, 0.0012, EDGEZ + 0.42], rot: [-Math.PI / 2, 0, 0] }); G.add(yline);
    // the platform's face and the refuge under it
    const con = T.concrete({ seed: 14, base: "#4b4945" });
    const conMat = std({ map: T.tex(con.map, { rep: [LEN / 3, 1] }), roughness: 1 });
    G.add(box(LEN, 0.25, 0.05, conMat, 0, -0.205, EDGEZ + 0.025));
    G.add(box(LEN, 0.85, 0.05, conMat, 0, BED + 0.425, EDGEZ + 0.6));
    G.add(box(LEN, 0.05, 0.6, conMat, 0, -0.33, EDGEZ + 0.3));
    // the bed, sleeper blocks, rails, the covered third rail
    const bedT = T.concrete({ seed: 21, base: "#3f3c38", dirt: 1, stains: 60 });
    G.add(plane(LEN, EDGEZ - WALLZ + 0.6, std({ map: T.tex(bedT.map, { rep: [LEN / 2.5, 2] }), roughness: 0.95 }), { pos: [0, BED, (EDGEZ + 0.6 + WALLZ) / 2], rot: [-Math.PI / 2, 0, 0] }));
    const sleeperMat = std({ map: T.tex(T.concrete({ seed: 31, base: "#6b6862", px: 256 }).map), roughness: 0.9 });
    const gauge = 1.435 + 0.07;
    for (let x = X0; x < X1; x += 0.68) for (const s of [-1, 1]) G.add(box(0.26, 0.16, 0.62, sleeperMat, x, BED + 0.08, TRACKZ + s * gauge / 2));
    const railSide = std({ color: 0x302a25, roughness: 0.8, metalness: 0.5 });
    const railTop = std({ color: 0xb8b6b2, roughness: 0.18, metalness: 1, envMapIntensity: 1.2 });
    for (const s of [-1, 1]) {
      const z = TRACKZ + s * gauge / 2;
      G.add(box(LEN, 0.012, 0.15, railSide, 0, BED + 0.166, z));
      G.add(box(LEN, 0.11, 0.018, railSide, 0, BED + 0.226, z));
      G.add(box(LEN, 0.035, 0.072, railSide, 0, BED + 0.296, z));
      G.add(box(LEN, 0.004, 0.06, railTop, 0, BED + 0.3155, z, { cast: false }));
    }
    const coverMat = std({ color: 0x3f3b35, roughness: 0.75 });
    G.add(box(LEN, 0.035, 0.17, coverMat, 0, BED + 0.29, TRACKZ - 1.55));
    G.add(box(LEN, 0.07, 0.02, coverMat, 0, BED + 0.25, TRACKZ - 1.47));
    for (let x = X0; x < X1; x += 4.5) G.add(box(0.06, 0.22, 0.24, std({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.4 }), x, BED + 0.11, TRACKZ - 1.59));
    // the wall: stone (its own canvas over the 18 m any shot sees), the low band with its cables, the band, the cornice
    const WW = far ? LEN : 18; // (near: 256 px a metre over what shots 1 and 3 see; far: all of it, seen from 15 m)
    const sw = T.stoneWall({ W: WW, px: far ? 4800 : 4608, H: wallTop - wallBot, y0: wallBot, seed: far ? 6 : 5, grime: frames.map((f) => [f.x - f.w / 2 - 0.05, f.yTop - f.h - 0.02, f.w + 0.1, 0.5]) });
    const swMat = std({ map: T.tex(sw.map), roughnessMap: T.tex(sw.rough, { srgb: false }), roughness: 1, envMapIntensity: 0.5 });
    swMat.map.wrapS = swMat.map.wrapT = THREE.ClampToEdgeWrapping; swMat.defines = { CZ_RS: "0.12" };
    G.add(plane(WW, wallTop - wallBot, swMat, { pos: [0, (wallTop + wallBot) / 2, WALLZ] }));
    if (!far) for (const sx of [-1, 1]) G.add(plane((LEN - WW) / 2, wallTop - wallBot, std({ color: 0x8f897e, roughness: 0.7 }), { pos: [sx * (WW / 2 + (LEN - WW) / 4), (wallTop + wallBot) / 2, WALLZ] }));
    const lowT = T.concrete({ seed: 41, base: "#4a4844", dirt: 0.6, stains: 14 });
    G.add(plane(LEN, wallBot - BED, std({ map: T.tex(lowT.map, { rep: [LEN / 6, 0.25] }), roughness: 0.9 }), { pos: [0, (wallBot + BED) / 2, WALLZ] }));
    G.add(box(LEN, 0.04, 0.12, std({ color: 0x3b3d3f, metalness: 0.6, roughness: 0.5 }), 0, -0.32, WALLZ + 0.07));
    const cableMat = std({ color: 0x141414, roughness: 0.45 });
    for (let c = 0; c < 4; c++) {
      const y = -0.45 - c * 0.07, zz = WALLZ + 0.06 + c * 0.012, pts = [];
      for (let x = X0; x <= X1; x += 0.25) { const ph = ((x - X0) % 3) / 3; pts.push(new THREE.Vector3(x, y - Math.sin(ph * Math.PI) * 0.035, zz)); }
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.014 + c * 0.003, 6), cableMat); m.castShadow = true; G.add(m);
    }
    for (let x = X0; x < X1; x += 3) G.add(box(0.03, 0.34, 0.1, std({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.5 }), x, -0.56, WALLZ + 0.05));
    const gz = T.glazed({ base: "#2d6a82" });
    G.add(plane(LEN, 0.8, std({ map: T.tex(gz.map, { rep: [LEN / 1.2, 0.8 / 1.2] }), roughnessMap: T.tex(gz.rough, { srgb: false, rep: [LEN / 1.2, 0.8 / 1.2] }), roughness: 1, envMapIntensity: 0.9 }), { pos: [0, wallTop + 0.52, WALLZ] }));
    G.add(box(LEN, 0.12, 0.3, std({ color: 0x8f9296, roughness: 0.4, metalness: 0.7 }), 0, wallTop + 0.06, WALLZ + 0.15));
    G.add(box(LEN, 0.6, 0.1, std({ color: 0x1d1f22, roughness: 0.9 }), 0, wallTop + 1.22, WALLZ + 0.05));
    G.add(plane(LEN, 3, std({ color: 0x141516, roughness: 1 }), { pos: [0, 4.4, (EDGEZ + WALLZ) / 2], rot: [Math.PI / 2, 0, 0] }));
    // the frames
    for (const f of frames) {
      const g = await lightbox(f.kind, f.w, { k: opts.posterK ?? 1 });
      g.position.set(f.x, f.yTop - f.h / 2, WALLZ); G.add(g);
    }
    // the fascia over the platform's edge, with its slot of light
    G.add(box(LEN, 0.75, 0.06, std({ color: 0x232528, roughness: 0.5, metalness: 0.5 }), 0, ceilY + 0.36, EDGEZ + 0.62));
    G.add(box(LEN, 0.02, 0.12, lum, 0, ceilY - 0.01, EDGEZ + 0.8, { cast: false, recv: false }));
    tubeRect(G, 0, ceilY - 0.02, EDGEZ + 0.8, LEN, 0.12, 160, 0xe6edff, [0, -10, EDGEZ + 0.8]);
    for (const x of [-6, 6]) spot(G, x, ceilY - 0.05, EDGEZ + 0.8, 105, 0xe6edff, { ang: 1.35, tz: EDGEZ - 1.5, jitter: [6, 0, 0.05], cast: !far });
    // the cornice's downlights (every 2.4 m; the ones near the shot cast the frames' shadows)
    const dlMat = std({ color: 0x000000, emissive: 0xfff3e0, emissiveIntensity: 30 });
    const dl = far ? { a: -28.8, b: 28.8, d: 4.8, I: 40, ang: 0.8 } : { a: -13.2, b: 13.2, d: 2.4, I: 22, ang: 0.62 };
    for (let x = dl.a; x <= dl.b + 1e-6; x += dl.d) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 20), dlMat); m.position.set(x, wallTop - 0.005, WALLZ + 0.22); G.add(m);
      spot(G, x, wallTop - 0.03, WALLZ + 0.22, dl.I, 0xfff2e2, { ang: dl.ang, pen: 0.85, ty: -1.2, tz: WALLZ + 0.55, jitter: [0.04, 0, 0.02], cast: !far && Math.abs(x - (opts.shadowX ?? 0)) < 5.5 });
    }
    // the pit: the fascia's light bounced off the bed and the wall's foot
    for (const x of [-8, 0, 8]) spot(G, x, 1.2, EDGEZ - 0.3, 6, 0xd9dde6, { ang: 1.2, ty: BED, tz: WALLZ, jitter: [4, 0.1, 0.1], cast: false });
    if (far) { G.rotation.y = Math.PI; G.position.z = 2 * CZ; } // (turned about the platform's middle: the far wall reads the right way round)
    S.add(G);
    return { G, edge, yline };
  }
  const near = await side(opts.frames || []);
  const farS = await side(opts.farFrames || [], { far: true });
  // the station's ends: a wall across the platform, the tunnel mouths over the tracks (dark), at x = +-30
  const endMat = std({ color: 0x5b5852, roughness: 0.9 });
  for (const e of [-1, 1]) {
    S.add(box(0.4, 4.6, PW + 0.2, endMat, e * (X1 + 0.2), 2.3 - 0.0, CZ));
    for (const zc of [TRACKZ, 2 * CZ - TRACKZ]) { S.add(box(0.4, 1.0, 4.3, endMat, e * (X1 + 0.2), 3.9, zc)); }
    S.add(box(0.2, 6, 30, std({ color: 0x0a0a0a, roughness: 1 }), e * (X1 + 9), 2, CZ));
  }
  S.add(new THREE.HemisphereLight(0xdfe6ee, 0x5a5048, 0.1));
  // a place for a train on the near track (its floor at the platform's level)
  const trainSlot = new THREE.Group(); trainSlot.position.set(0, 0, TRACKZ); S.add(trainSlot);

  const perSample = (i, k, rnd) => { for (const o of L) o.l.position.set(o.base[0] + (rnd() - 0.5) * 2 * o.jitter[0], o.base[1] + (rnd() - 0.5) * 2 * o.jitter[1], o.base[2] + (rnd() - 0.5) * 2 * o.jitter[2]); };
  return { scene: S, mirror, floor, mirrorHide: [floor, near.edge, near.yline, farS.edge, farS.yline], perSample, lights: L, trainSlot, near: near.G, far: farS.G };
}

// an environment for the glossy things: the scene seen from a point, filtered (and lit once more by itself)
export function envFrom(Rr, scene, at) {
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cc = new THREE.CubeCamera(0.1, 200, cubeRT); cc.position.set(...at);
  const pm = new THREE.PMREMGenerator(Rr);
  let env = null;
  for (let pass = 0; pass < 2; pass++) { cc.update(Rr, scene); const e = pm.fromCubemap(cubeRT.texture); if (env) env.dispose(); env = e.texture; scene.environment = env; }
  return env;
}
