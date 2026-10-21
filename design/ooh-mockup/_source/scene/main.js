// Cromatic · Litorsal OOH mockups (TASK-069): the three street scenes and the layers render.mjs asks for. Each scene is
// its own world (built once), lit by a sun jittered over its disc and the sky; each job renders one layer of one shot as
// a PNG data URL with the numbers the Lottie needs.
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { renderer, makeCam, shoot, project, stats, DEG, rng } from "../../../metro-mockup/_source/scene/lib.js";
import * as C from "./city.js";
import { SHOTS } from "../shots.mjs";
export { SHOTS, THREE };

// ---------- the boulevard (shot 1): the 6 x 3 m billboard across a boulevard with a tram line, late afternoon ----------
// ---------- the gable (shot 2): a mesh banner on a block's blind end wall, hard midday sun ----------
// ---------- the tram stop (shot 3): the citylight at a shelter's end, the low sun behind the blocks ----------
const STREET = {
  x0: -160, x1: 160,
  road: [[3.6, 10.6], [-10.6, -3.6]], median: [-3.6, 3.6], walks: [[10.6, 16.5], [-16.5, -10.6]], green: [[16.5, 30], [-34, -16.5]],
  kerbs: [3.6, -3.6, 10.6, -10.6], tracks: [1.55, -1.55], lines: [[7.1, true], [-7.1, true]]
};
const W = {};
async function world(name) {
  name = SHOTS[name].scene || name; // (a shot of another shot's world: gableWide)
  if (W[name]) return W[name];
  RectAreaLightUniformsLib.init();
  const sh = SHOTS[name], L = sh.light, S = new THREE.Scene(), Rr = renderer();
  const sunDir = new THREE.Vector3(...L.sun).normalize();
  const skyO = { sunDir: L.sun, zenith: L.zenith, horizon: L.horizon, ground: L.ground, sunGlow: L.glow, k: L.skyK ?? 1 };
  S.add(C.skyMesh(skyO));
  S.environment = C.envFromSky(Rr, skyO); S.environmentIntensity = L.envK ?? 1;
  S.fog = new THREE.FogExp2(new THREE.Color(...L.haze), L.hazeD ?? 0.004);
  const sun = new THREE.DirectionalLight(new THREE.Color(...L.sunCol), L.sunI);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.02;
  const sc = sun.shadow.camera; Object.assign(sc, { left: -L.box[0], right: L.box[0], top: L.box[1], bottom: -L.box[1], near: 1, far: 400 }); sc.updateProjectionMatrix();
  sun.target.position.set(...L.focus); S.add(sun, sun.target);
  const place = (j = [0, 0]) => { const d = sunDir.clone(); const up = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3().crossVectors(d, up).normalize(), b = new THREE.Vector3().crossVectors(a, d).normalize(); d.addScaledVector(a, j[0]).addScaledVector(b, j[1]).normalize(); sun.position.copy(sun.target.position).addScaledVector(d, 150); };
  place();
  // a warm bounce from the sunlit street (a hemisphere's lower half; the sky's part is the environment's)
  S.add(new THREE.HemisphereLight(new THREE.Color(0, 0, 0), new THREE.Color(...L.bounce), 1));
  const st = { scene: S, sun, groups: {}, perSample: (i, k, rnd) => { const a = Math.sqrt(rnd()) * 0.0047, t = rnd() * 6.283; place([a * Math.cos(t), a * Math.sin(t)]); } };
  await (BUILD[name])(st, S);
  return (W[name] = st);
}
const BUILD = {
  async boulevard(st, S) {
    // looking down the boulevard (toward -x) from the near sidewalk: the tram line in its median, lindens both sides,
    // blocks behind them, the billboard on the far side turned to face the traffic coming our way
    const g = st.groups;
    S.add(C.street({ ...STREET, x0: -420, x1: 140 }));
    const blocks = [
      // the far side (right of frame), facing the street (+z), sunlit
      [-14, -40, 46.8, 10, 61, "#dccaa4", 40], [-80, -44, 54, 11, 65, "#e2d3b4", 28], [-150, -40, 43.2, 9, 66, "#d4c3a2", 20], [-215, -42, 61.2, 10, 67, "#ddd0b6", 14], [-300, -44, 72, 12, 68, "#d9cbb0", 10],
      // the near side (left of frame), facing -z, in shade
      [10, 40, 54, 9, 62, "#cfc0a8", 30], [-62, 42, 43.2, 11, 69, "#d8c8aa", 22], [-130, 40, 61.2, 10, 70, "#cbbca4", 16], [-210, 42, 54, 12, 71, "#d6c7ad", 12], [-300, 40, 72, 10, 72, "#d2c4ac", 10]
    ];
    g.blocks = [];
    for (const [x, z, Wd, fl, seed, base, k] of blocks) { const B = await C.block({ x, z, W: Wd, D: 12, floors: fl, seed, base, k, face: z > 0 ? -1 : 1 }); S.add(B); g.blocks.push(B); }
    g.bb = await C.billboard({ x: 0, z: -14.4, rotY: 1.19, y0: 5.6 }); S.add(g.bb);
    g.trees = new THREE.Group(); S.add(g.trees);
    const r = rng(9);
    for (let x = -380; x <= 70; x += 9 + r() * 2) for (const z of [-13.0, 13.2]) {
      if (z < 0 && x > -21 && x < 16) continue; // (the billboard's own clearing)
      const d = Math.hypot(x - 25, z + 8), per = d < 40 ? 130 : d < 120 ? 75 : 45;
      g.trees.add(C.linden({ x: x + (r() - 0.5) * 1.5, z: z + (r() - 0.5) * 0.6, h: 11 + r() * 4, seed: 100 + Math.round(x * 3 + z), leafSeed: 81 + (Math.round(x) % 3 + 3) % 3, per }));
    }
    g.trees.add(C.linden({ x: 17, z: -12.6, h: 10.5, seed: 777, leafSeed: 82, per: 170, cx: 1.8, cz: -0.5 })); // (the one that frames the shot on the right)
    S.add(C.catenary({ x0: -420, x1: 140, poles: Array.from({ length: 18 }, (_, i) => 12 - i * 30), poleZ: [-3.3, 3.3], tracks: STREET.tracks, extra: [[[-420, 8.4, -11.6], [140, 8.4, -11.6], 0.008], [[-420, 8.2, 11.6], [140, 8.2, 11.6], 0.008]] }));
    S.add(C.lamps(Array.from({ length: 16 }, (_, i) => [[52 - i * 28, -11.1, 1], [24 - i * 28, 11.1, -1]]).flat().filter(([x, z]) => !(z < 0 && Math.abs(x) < 12))));
    g.tram = C.tram({ L: 31 }); g.tram.rotation.y = 0; g.tram.position.set(-60, 0.16, STREET.tracks[1]); g.tram.visible = false; S.add(g.tram);
  },
  async gable(st, S) {
    const g = st.groups;
    S.add(C.street({ ...STREET, green: [[16.5, 40], [-60, -16.5]] }));
    // the block end-on: its blind gable faces the street (+z), turned a little (dl) so the long facade with the
    // balconies shows on its left; the gable's centre at GX, GZ
    const dl = 0.42, GX = 22, GZ = -22, half = 27;
    g.blockA = await C.block({ x: GX - half * Math.sin(dl), z: GZ - half * Math.cos(dl), W: 54, D: 12.6, floors: 10, seed: 71, base: "#e0cfab", k: 34, gk: 60, rotY: -Math.PI / 2 + dl }); S.add(g.blockA);
    g.blockB = await C.block({ x: -40, z: -60, W: 57.6, D: 12, floors: 8, seed: 72, base: "#d5c6b0", k: 22 }); S.add(g.blockB);
    g.blockC = await C.block({ x: 70, z: -52, W: 46.8, D: 12, floors: 10, seed: 73, base: "#d9ccb4", k: 18 }); S.add(g.blockC);
    const H = g.blockA.userData.H, bw = 10.2, bh = bw / C.ART.tall.ar, nrm = [Math.sin(dl), Math.cos(dl)];
    g.banner = await C.gableBanner({ art: "tall", w: bw, rotY: dl, pos: [GX + nrm[0] * 0.16, H - 2.2 - bh / 2, GZ + nrm[1] * 0.16] }); S.add(g.banner);
    g.trees = new THREE.Group(); S.add(g.trees);
    for (const [x, z, h, s] of [[-4, -13.2, 13, 1], [-14, -13.2, 12, 2], [-24, -13.2, 14, 3], [36, -13.2, 12.5, 4], [46, -13.2, 13.5, 6], [-34, -13.2, 12, 7], [7, -13.4, 12.5, 8], [27, -13.0, 13, 9]]) g.trees.add(C.linden({ x, z, h, seed: 400 + s, leafSeed: 81 + (s % 3), per: 170 }));
    S.add(C.catenary({ x0: -160, x1: 160, poles: [-38, -8, 22, 52], poleZ: [-3.3, 3.3], tracks: STREET.tracks, extra: [[[-160, 8.6, -11.4], [160, 8.2, -11.4], 0.009]] }));
    S.add(C.lamps([[-12, -11.1, 1], [20, -11.1, 1]]));
    const nearLamp = C.lamps([[8, 11.1, -1]]); nearLamp.userData.fg = true; S.add(nearLamp); // (in front of the tram: the wide shot sees it)
    // (the near side's poles again, flagged: the layer that goes over the passing tram)
    g.fg = C.catenary({ x0: -160, x1: 160, poles: [-38, -8, 22, 52], poleZ: [3.3], tracks: [], wires: false }); g.fg.traverse((m) => (m.userData.fg = true)); S.add(g.fg);
    g.tram = C.tram({ L: 31 }); g.tram.position.set(0, 0.16, STREET.tracks[1]); g.tram.visible = false; S.add(g.tram);
  },
  async shelter(st, S) {
    // looking along the near sidewalk (toward +x) into the low sun: the shelter's open side to the road, the citylight
    // at its near end; the boulevard runs on to the haze, blocks both sides, the lindens' row, the tram line on the left
    const g = st.groups;
    S.add(C.street({ ...STREET, x0: -60, x1: 520 }));
    g.blocks = [];
    const blocks = [
      [40, -44, 61.2, 10, 81, "#d9c7a3", 26], [120, -42, 54, 9, 82, "#cbbca6", 18], [200, -44, 72, 11, 83, "#d6c6a8", 12], [300, -42, 61.2, 10, 84, "#d2c3a7", 10], [400, -44, 72, 10, 85, "#d9cbb0", 8],
      [52, 42, 54, 10, 86, "#d5c4a4", 26], [128, 40, 43.2, 9, 87, "#dccdb2", 16], [205, 42, 61.2, 11, 88, "#cfc1a8", 12], [300, 40, 72, 10, 89, "#d6c8ae", 10], [400, 42, 61.2, 10, 90, "#d2c4ac", 8]
    ];
    for (const [x, z, Wd, fl, seed, base, k] of blocks) { const B = await C.block({ x, z, W: Wd, D: 12, floors: fl, seed, base, k, face: z > 0 ? -1 : 1 }); S.add(B); g.blocks.push(B); }
    g.shelter = await C.shelter({ x: 0.6, z: 12.6, rotY: Math.PI, L: 4.4, glow: SHOTS.shelter.light.glow2 ?? 1.2 }); S.add(g.shelter);
    g.trees = new THREE.Group(); S.add(g.trees);
    const r = rng(19);
    for (let x = -40; x <= 460; x += 9 + r() * 2) for (const z of [-13.2, 13.6]) {
      if (z > 0 && x > -6 && x < 9) continue; // (the shelter's own clearing; one tree stands behind it)
      const per = x < 60 ? 100 : x < 160 ? 70 : 45;
      g.trees.add(C.linden({ x: x + (r() - 0.5) * 1.5, z: z + (r() - 0.5) * 0.6, h: 11 + r() * 4, seed: 500 + Math.round(x * 3 + z), leafSeed: 81 + (Math.round(x) % 3 + 3) % 3, per }));
    }
    g.trees.add(C.linden({ x: 3.5, z: 15.6, h: 13, seed: 590, leafSeed: 82, per: 110 }));
    S.add(C.catenary({ x0: -60, x1: 520, poles: Array.from({ length: 20 }, (_, i) => -26 + i * 30), poleZ: [-3.3, 3.3], tracks: STREET.tracks, extra: [[[-60, 8.4, -11.6], [520, 8.4, -11.6], 0.008]] }));
    S.add(C.lamps(Array.from({ length: 18 }, (_, i) => [[-14 + i * 28, -11.1, 1], [12 + i * 28, 11.1, -1]]).flat()));
    g.tram = C.tram({ L: 31 }); g.tram.position.set(0, 0.16, STREET.tracks[1]); g.tram.visible = false; S.add(g.tram);
  }
};

// ---------- the jobs ----------
function cam(sh, o = {}) { return makeCam({ ...sh.cam, far: 4000, ...o }); }
export async function layer(o) {
  const st = await world(o.shot), sh = SHOTS[o.shot], scale = o.scale ?? 2, n = o.n ?? 128;
  const Wp = Math.round(sh.W * scale), Hp = Math.round(sh.H * scale);
  const g = st.groups;
  if (g.tram) g.tram.visible = false;
  const job = { scene: st.scene, W: Wp, H: Hp, n, mirror: [], perSample: st.perSample, dev: { ...(sh.dev || SHOTS[sh.scene]?.dev || {}), ...(o.dev || {}) } };
  // the whole frame
  if (o.layer === "bg" && o.tramX != null && g.tram) { g.tram.visible = true; g.tram.position.x = o.tramX; }
  if (o.layer === "bg") { const url = await shoot({ ...job, cam: cam(sh, o.cam || {}) }); return { url, ...stats() }; }
  // what stands in front of the tram (flagged userData.fg), alone, over a transparent background
  if (o.layer === "fg") {
    const hid = []; st.scene.traverse((m) => { if ((m.isMesh || m.isLine) && m.visible && !m.userData.fg) { hid.push(m); m.visible = false; } });
    try { const url = await shoot({ ...job, alpha: true, cam: cam(sh, o.cam || {}) }); return { url, ...stats() }; } finally { hid.forEach((m) => (m.visible = true)); }
  }
  // a passing tram as a strip: alone (with its shadow on a catcher), centred at x = 0, blurred by a motion of `blur` m
  if (o.layer === "tram") {
    const tr = g.tram, keep = []; st.scene.traverse((m) => { if ((m.isMesh || m.isLine) && !isIn(m, tr) && m.visible) { keep.push(m); } });
    keep.forEach((m) => (m.visible = false)); tr.visible = true;
    const sky = st.scene.children.find((c) => c.material && c.material.isShaderMaterial); if (sky) sky.visible = false;
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(80, 14).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: o.shadowK ?? 0.5 })); catcher.position.set(0, 0.16, tr.position.z - 2); catcher.receiveShadow = true; st.scene.add(catcher);
    const c = sh.cam, D = c.pos[2] - tr.position.z, half = o.half ?? 24, y0 = (o.y0 ?? -0.3) - c.pos[1], y1 = (o.y1 ?? 4.5) - c.pos[1];
    const pxm = (sh.W / (2 * D * Math.tan((c.hfov / 2) * DEG))) * (o.res ?? 1);
    const W2 = Math.round(2 * half * pxm), H2 = Math.round((y1 - y0) * pxm);
    const x0 = tr.position.x;
    try {
      const url = await shoot({ ...job, W: W2, H: H2, alpha: true, cam: makeCam({ ...c, far: 4000, yaw: 0, pos: [0, c.pos[1], c.pos[2]], shift: [0, 0], win: [-half, half, y0, y1, D], focus: D }),
        perSample: (i, k, rnd) => { st.perSample(i, k, rnd); tr.position.x = x0 + (o.blur || 0) * (k - 0.5); tr.updateMatrixWorld(true); } });
      return { url, W: W2, H: H2, pxm, D, win: [-half, half, y0, y1], ...stats() };
    } finally { tr.position.x = x0; keep.forEach((m) => (m.visible = true)); if (sky) sky.visible = true; st.scene.remove(catcher); tr.visible = false; }
  }
  return { error: "unknown layer " + o.layer };
}
function isIn(m, root) { for (let p = m; p; p = p.parent) if (p === root) return true; return false; }
// a quick look: the shot at a fraction of its size (draft)
export async function test({ shot = "boulevard", scale = 0.5, n = 16, cam = {}, dev = {}, light = null, tramX = null } = {}) { if (light && !W[shot]) Object.assign(SHOTS[shot].light, light); return layer({ shot, layer: "bg", scale, n, cam, dev, tramX }); }
// where a world point lands in the shot (px of the shot's own size)
export async function where({ shot, pts }) { const sh = SHOTS[shot]; const c = cam(sh); return { px: pts.map((p) => project(c, sh.W, sh.H, p)) }; }
// (debug) what the camera sees at a few points of the frame: [u, v] in 0..1
export async function pick({ shot, uv = [[0.5, 0.5]] }) {
  const st = await world(shot), c = cam(SHOTS[shot]); st.scene.updateMatrixWorld(true); c.updateMatrixWorld(true); c.updateProjectionMatrix();
  const rc = new THREE.Raycaster();
  return { hits: uv.map(([u, v]) => { rc.setFromCamera(new THREE.Vector2(u * 2 - 1, 1 - v * 2), c); const h = rc.intersectObjects(st.scene.children, true).filter((x) => x.object.visible)[0]; if (!h) return null; const o = h.object; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; return { bb: [bb.min.toArray().map((x) => +x.toFixed(1)), bb.max.toArray().map((x) => +x.toFixed(1))], verts: o.geometry.attributes.position.count, rot: o.parent && o.parent.rotation.y, d: +h.distance.toFixed(2), type: o.type, geo: o.geometry && o.geometry.type, mat: o.material && (o.material.type + " " + (o.material.color ? o.material.color.getHexString() : "")), pos: o.getWorldPosition(new THREE.Vector3()).toArray().map((x) => +x.toFixed(2)), p: h.point.toArray().map((x) => +x.toFixed(2)) }; }) };
}
