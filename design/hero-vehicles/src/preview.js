// Cromatic · hero vehicles: the preview page (driven by _source/preview.mjs in Playwright). Each vehicle alone in a
// neutral studio (RoomEnvironment through PMREM, a key light with soft shadows, a pale floor), rasterised.
//   HV.still(id, o)  a 3/4 front still -> { url, tris, size }
//   HV.sheet(urls, labels, o) the contact sheet -> jpeg data url
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { triCount } from "./kit.js";

const REG = {
  d1300: () => import("/ext/dacia1300-hero.js?v=" + Date.now()).then((m) => m.buildHeroDacia(THREE, { RoundedBoxGeometry })),
  patrol: () => import("./dacia1310-patrol.js").then((m) => m.buildPatrol1310(THREE, { RoundedBoxGeometry })),
  van: () => import("./mystery-van.js").then((m) => m.buildMysteryVan(THREE, { RoundedBoxGeometry })),
  chrome: () => import("./chrome-racer.js").then((m) => m.buildChromeRacer(THREE, { RoundedBoxGeometry })),
  formula: () => import("./classic-formula.js").then((m) => m.buildClassicFormula(THREE, { RoundedBoxGeometry })),
  plane: () => import("./cropduster.js").then((m) => m.buildCropduster(THREE, { RoundedBoxGeometry })),
  scooter: () => import("./e-scooter.js").then((m) => m.buildEScooter(THREE, { RoundedBoxGeometry })),
  submarine: () => import("./submarine.js").then((m) => m.buildSubmarine(THREE, { RoundedBoxGeometry }))
};

const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(R.domElement);
const pm = new THREE.PMREMGenerator(R), envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;

async function still(id, o = {}) {
  // per vehicle: the plane's span wants a higher, closer camera; the scooter a lower one
  const PER = { plane: { az: 32, el: 13, fill: 0.8 }, scooter: { az: 42, el: 8, fill: 0.86 }, submarine: { az: 40, el: 10 } }[id] || {};
  o = { ...PER, ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null)) };
  const { w = 1080, h = 1350, az = 38, el = 9, fov = 26, man = false } = o;
  R.setSize(w, h, false);
  const scene = new THREE.Scene(); scene.background = new THREE.Color("#d9d6d0"); scene.environment = envTex; scene.fog = new THREE.Fog("#d9d6d0", 1, 2); scene.environmentIntensity = o.envI ?? 0.75;
  const v = await REG[id]();
  if (v.setBeacons && o.beacons) v.setBeacons(3, 3);
  scene.add(v.group); v.group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(v.group), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const L = Math.max(size.x, size.z, size.y * 1.4);
  const sun = new THREE.DirectionalLight("#fff4e6", 2.4); sun.position.set(ctr.x + L * 0.9, L * 1.8, ctr.z + L * 1.1); sun.target.position.copy(ctr); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); const sc = L * 0.9; Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 0.1, far: L * 6 }); sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.01; sun.shadow.radius = 5;
  const fill = new THREE.DirectionalLight("#dfe8ff", 0.5); fill.position.set(ctr.x - L, L * 0.6, ctr.z - L * 0.4); scene.add(fill);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(L * 60, L * 60), new THREE.MeshStandardMaterial({ color: "#d9d6d0", roughness: 0.92 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd);
  if (man) { // a 1.75 m figure for scale (a grey capsule), beside the vehicle
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.35, 6, 16), new THREE.MeshStandardMaterial({ color: "#8a8f96", roughness: 0.7 })); m.position.set(box.max.x + 0.6, 0.875, ctr.z - size.z * 0.15); m.castShadow = true; scene.add(m);
  }
  // the camera: a 3/4 front from the vehicle's left (+x, +z), framed to fit the bounding sphere
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, rad = size.length() / 2;
  const asp = w / h, vf = (fov * Math.PI) / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
  const d = (rad / Math.sin(Math.min(vf, hf) / 2)) * (o.fill ?? 0.8);
  const tgt = ctr.clone(); tgt.y = Math.min(ctr.y, size.y * 0.42);
  const cam = new THREE.PerspectiveCamera(fov, asp, 0.05, d * 10); scene.fog.near = d * 1.6; scene.fog.far = d * 4.5;
  const dir = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  let dist = d;
  const place = () => { cam.position.copy(tgt).addScaledVector(dir, dist); cam.lookAt(tgt); cam.updateMatrixWorld(); };
  // fit: centre the bounding box's projection and scale the distance so it fills ~78% of the frame's width or height
  const corners = []; for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  for (let it = 0; it < 6; it++) {
    place(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of corners) { const q = p.clone().project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1), k = Math.tan(vf / 2) * dist;
    tgt.addScaledVector(right, ((x0 + x1) / 2) * k * asp).addScaledVector(up, ((y0 + y1) / 2 + 0.06) * k);
    dist *= Math.max((x1 - x0) / 2, (y1 - y0) / 2) / (o.frame ?? 0.9);
  }
  place();
  // a close-up: o.look = { t: [x, y, z] the target, d: [x, y, z] the direction to the camera, dist, fov }
  if (o.look) { const L = o.look; cam.fov = L.fov ?? 22; cam.near = 0.01; cam.updateProjectionMatrix(); const t = new THREE.Vector3(...L.t), dd = new THREE.Vector3(...L.d).normalize(); cam.position.copy(t).addScaledVector(dd, L.dist); cam.lookAt(t); cam.updateMatrixWorld(); scene.fog.near = L.dist * 4; scene.fog.far = L.dist * 12; }
  R.render(scene, cam);
  const url = R.domElement.toDataURL("image/png");
  const tris = triCount(v.group);
  scene.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); } });
  return { url, tris, size: [+size.x.toFixed(3), +size.y.toFixed(3), +size.z.toFixed(3)], DIM: v.DIM };
}

async function sheet(urls, labels, o = {}) {
  const cw = o.cw || 540, ch = o.ch || 675, cols = o.cols || 3, rows = Math.ceil(urls.length / cols), pad = 16, lab = 54;
  const c = document.createElement("canvas"); c.width = cols * cw + (cols + 1) * pad; c.height = rows * (ch + lab) + (rows + 1) * pad;
  const x = c.getContext("2d"); x.fillStyle = "#16171a"; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < urls.length; i++) {
    const im = new Image(); im.src = urls[i]; await im.decode();
    const cx = pad + (i % cols) * (cw + pad), cy = pad + Math.floor(i / cols) * (ch + lab + pad);
    x.drawImage(im, cx, cy, cw, ch);
    x.fillStyle = "#f2f2f2"; x.font = "600 20px Helvetica, Arial, sans-serif"; x.fillText(labels[i][0], cx + 4, cy + ch + 24);
    x.fillStyle = "#a9adb3"; x.font = "400 14px Helvetica, Arial, sans-serif"; x.fillText(labels[i][1], cx + 4, cy + ch + 45);
  }
  return c.toDataURL("image/jpeg", 0.9);
}
// the triangle budget by mesh name (the heaviest first)
async function tris(id) {
  const v = await REG[id](), by = {};
  v.group.traverse((m) => { if (m.isMesh) { const c = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3 * (m.isInstancedMesh ? m.count : 1); by[m.name] = (by[m.name] || 0) + c; } });
  return Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => k + " " + Math.round(n));
}
window.HV = { still, sheet, tris, ready: true };
