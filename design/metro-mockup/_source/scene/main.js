// Cromatic · metro mockups (TASK-062): the jobs render.mjs asks the 3D stage for. One world (the station, a five-car
// train with the banner on its middle car, a few passengers); three cameras; each job renders one layer of one shot
// as a PNG data URL, with the numbers the Lottie needs (where things land, in the shot's pixels).
import * as THREE from "three";
import { renderer, makeCam, shoot, project, stats, Mirror, mirrorize, DEG } from "./lib.js";
import { buildStation, envFrom, EDGEZ, TRACKZ, WALLZ, CZ, PW } from "./station.js";
import { buildTrain, carLights, CAR, GAP, HW, DOORS, LEAF_W, WINDOWS, SILL, WTOP } from "./train.js";
import { person, CROWD } from "./people.js";
import { SHOTS, INSIDE, NEAR, FAR } from "../shots.mjs";
export { SHOTS, INSIDE };
export { THREE };

// the near wall's frames (shots 1 and 3 look at them), the far wall's (seen from inside the train)
export const CAR2 = -2 * (CAR + GAP); // the banner car's centre in the train's own x
const DEV = { expo: 1, glare: 0.05, contrast: 1.08, sat: 1.05, curve: "neutral" };

let WD = null;
async function world() {
  if (WD) return WD;
  const st = await buildStation({ W: 1920, H: 1080, frames: NEAR.map((f) => ({ ...f })), farFrames: FAR.map((f) => ({ ...f })), posterK: 1, shadowX: 0 });
  st.stationObjs = st.scene.children.filter((c) => c !== st.trainSlot);
  const train = await buildTrain({ n: 5, wrapCar: 2, k: 1 });
  train.userData.cars.forEach((c, i) => { if (i >= 1 && i <= 3) carLights(c, st.lights, { shadows: 0 }); });
  st.trainSlot.add(train); st.train = train;
  // passengers on board (they ride with their car): seated on the benches, one or two standing
  const riders = { 1: [[-5.2, 1, 1], [-4.1, -1, 1], [3.9, 1, 1], [5.4, -1, 1], [0.3, 0, 0]], 2: [[-1.2, 1, 1], [-0.2, -1, 1], [-4.6, 1, 1], [5.0, -1, 1]], 3: [[-5.6, -1, 1], [-0.8, 1, 1], [1.0, -1, 1], [4.4, 1, 1], [7.3, 0, 0]] };
  let rs = 40;
  for (const [ci, list] of Object.entries(riders)) for (const [x, side, sit] of list) {
    const P = person({ seed: rs++, coat: ["long", "short", "jacket"][rs % 3], h: 1.62 + (rs % 5) * 0.05, bag: rs % 4 === 0 });
    P.userData.pose(0, 1, sit);
    if (sit) { P.position.set(x, P.position.y, side * (HW - 0.38)); P.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2; }
    else { P.position.set(x, 0, (rs % 2 ? 0.25 : -0.3)); P.rotation.y = rs % 2 ? 0 : Math.PI; }
    train.userData.cars[+ci].add(P);
  }
  st.people = new THREE.Group(); st.scene.add(st.people);
  st.envs = {};
  return (WD = st);
}
// what a layer shows: station objects, the train (and which cars), people; everything else hidden
// (meshes are hidden, not their groups: the lights in a hidden part of the station still light the layer)
function meshesVisible(roots, v) { for (const r of roots) r.traverse((o) => { if (o.isMesh || o.isLine || o.isPoints) o.visible = v; }); }
function show(st, { station = true, train = false, cars = null, people = false } = {}) {
  meshesVisible(st.stationObjs, station);
  st.train.visible = train;
  st.train.userData.cars.forEach((c, i) => (c.visible = !cars || cars.includes(i)));
  st.people.visible = people;
}
function shadowsFor(st, shot) {
  // the station's shadow casters near the shot; inside the car, only the car's own lights cast
  for (const o of st.lights) if (o.l.userData.cast0 === undefined) o.l.userData.cast0 = o.l.castShadow;
  for (const o of st.lights) o.l.castShadow = shot === "inside" ? false : o.l.userData.cast0;
}
function env(st, key, at) { if (!st.envs[key]) st.envs[key] = envFrom(renderer(), st.scene, at); st.scene.environment = st.envs[key]; }
// the train placed so the banner car's centre is at world x = X
const placeTrain = (st, X) => { st.train.position.x = X - CAR2; st.train.updateMatrixWorld(true); };

async function render(st, sh, { scale = 2, n = 256, alpha = false, crop = null, perSample = null, cam = {}, dev = {}, mirror = true, extraMirrors = [], win = null, W = null, H = null, camMove = null }) {
  let Wp = W || Math.round(sh.W * scale), Hp = H || Math.round(sh.H * scale);
  // a crop is rendered as its own smaller frustum (same pixels, a fraction of the work)
  const sub = crop ? { sub: crop.map(Math.round), full: [Wp, Hp] } : {};
  if (crop) { Wp = Math.round(crop[2]); Hp = Math.round(crop[3]); crop = null; }
  const c = makeCam({ ...sh.cam, ...cam, ...(win ? { win } : {}), ...sub });
  st.mirror.rt.setSize(Math.round(Wp / 2), Math.round(Hp / 2));
  const pos0 = [...c.userData.o.pos];
  const ps = (i, k, rnd) => { st.perSample(i, k, rnd); if (perSample) perSample(i, k, rnd); if (camMove) c.userData.o.pos = camMove(pos0, k); };
  const url = await shoot({ scene: st.scene, cam: c, W: Wp, H: Hp, n, alpha, crop, mirror: mirror ? [st.mirror, ...extraMirrors] : extraMirrors, mirrorHide: st.mirrorHide, perSample: ps, dev: { ...DEV, ...(sh.dev || {}), ...dev } });
  return url;
}

// the station's own lights on or off (the interior's plate is lit as in the tunnel: by the car alone)
function stationLights(st, on) {
  st.scene.traverse((o) => { if (!o.isLight) return; let inTrain = false; for (let p = o; p; p = p.parent) if (p === st.train) inTrain = true; if (inTrain) return;
    o.visible = on; }); // (hidden, not dimmed: a hidden light leaves the shaders, which keeps a big frame under the GPU's time limit)
}
// people waiting on the platform by the banner car's door (seen from inside when it opens)
function waiting(st, on) {
  if (!st.waiting) {
    st.waiting = new THREE.Group(); st.scene.add(st.waiting);
    for (const [x, z, ry, seed, sit] of [[3.9, 0.15, Math.PI / 2, 61, 0], [0.4, 0.9, 0.3, 62, 0], [5.6, 2.4, -0.6, 63, 0]]) {
      const P = person({ seed, coat: ["long", "short", "jacket"][seed % 3], h: 1.66 + (seed % 3) * 0.06, bag: seed % 2 === 0 }); P.userData.pose(0, 1); P.position.set(x, P.position.y, z); P.rotation.y = ry; st.waiting.add(P);
    }
  }
  st.waiting.visible = on;
}

// ---------- passengers ----------
const crowd = {};
function getPerson(st, i) { if (!crowd[i]) { crowd[i] = person(CROWD[i]); st.people.add(crowd[i]); } return crowd[i]; }
function onlyPeople(st, list) { for (const k in crowd) crowd[k].visible = list.includes(+k); }
// the floor as a shadow catcher for a passenger's layer
let catcher = null;
function shadowCatcher(st, on) {
  if (!catcher) { catcher = new THREE.Mesh(new THREE.PlaneGeometry(60, PW - 0.72).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.55 })); catcher.position.set(0, 0.0005, CZ); catcher.receiveShadow = true; st.scene.add(catcher); }
  catcher.visible = on;
}
// a box around a person over the shutter, projected (px), with a margin for the blur
function personRect(sh, cam, pts, W, H, margin) {
  const c = makeCam({ ...sh.cam, ...cam });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of pts) { const [x, y] = project(c, W, H, p); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  x0 = Math.max(0, Math.floor(x0 - margin)); y0 = Math.max(0, Math.floor(y0 - margin)); x1 = Math.min(W, Math.ceil(x1 + margin)); y1 = Math.min(H, Math.ceil(y1 + margin));
  return [x0, y0, x1 - x0, y1 - y0];
}

// ---------- the jobs ----------
// { shot, layer, ... } -> { url, ...numbers }
export async function layer(o) {
  const st = await world(), sh = SHOTS[o.shot];
  shadowsFor(st, o.shot);
  if (o.shot === "inside") placeTrain(st, 0);
  // the environment the glossy things reflect: the car's inside for the car's layers, the station for the rest (the
  // station seen from the car included: with the car's white inside the platform's floor went white at grazing angles)
  const envKey = o.shot === "inside" && o.layer !== "out" ? "inside" : "platform";
  if (!st.envs[envKey]) { show(st, { station: true, train: envKey === "inside" }); if (st.waiting) st.waiting.visible = false; }
  if (envKey === "inside") env(st, "inside", [INSIDE.x, 1.6, TRACKZ]); else env(st, "platform", [0, 1.6, 1.5]);
  const scale = o.scale ?? 2, n = o.n ?? 256;
  const W = Math.round(sh.W * scale), H = Math.round(sh.H * scale);
  st.train.userData.doorsOpen?.(0);
  if (catcher) catcher.visible = false;

  // the station alone (shots 1 and 3), people and train hidden
  if (o.layer === "bg") {
    show(st, { station: true });
    const url = await render(st, sh, { scale, n, cam: o.cam || {} });
    return { url, ...stats() };
  }
  // a passer-by: crowd index i, walking along the camera's x at depth z (world), direction dir, speed v, at frame f of F
  if (o.layer === "walker") {
    show(st, { station: false, people: true });
    shadowCatcher(st, true);
    onlyPeople(st, [o.i]);
    const P = getPerson(st, o.i), cam = sh.cam, yaw = (cam.yaw || 0) * DEG;
    const ax = [Math.cos(yaw), 0, -Math.sin(yaw)]; // (the camera's right, on the floor)
    const period = o.period || 1.06, shutter = o.shutter || 1 / 20;
    const base = [o.x0 ?? cam.pos[0] + ax[0] * 0, 0, o.z];
    const at = (k) => { const d = o.dir * o.v * (k - 0.5) * shutter; return [base[0] + ax[0] * d, 0, base[2] + ax[2] * d]; };
    const facing = Math.atan2(-ax[2] * o.dir, ax[0] * o.dir); // (yaw so that the person's +x is the walking direction)
    const pose = (k) => { const p = at(k); P.position.set(p[0], 0, p[2]); P.rotation.y = facing; P.userData.pose(o.f / o.F + (k - 0.5) * shutter / period, 0); P.updateMatrixWorld(true); };
    pose(0.5);
    // the crop: the person's box at both ends of the shutter, with room for the out-of-focus blur
    const bb = new THREE.Box3(); for (const k of [0, 1]) { pose(k); bb.expandByObject(P); }
    bb.min.y = 0; bb.expandByScalar(0.12);
    const pts = []; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) pts.push([x, y, z]);
    const crop = personRect(sh, {}, pts, W, H, 150 * scale);
    const url = await render(st, sh, { scale, n, alpha: true, crop, mirror: false, cam: { fstop: o.fstop || sh.cam.fstop }, perSample: (i, k) => pose(k) });
    shadowCatcher(st, false);
    // where the person's feet land (the layer's anchor) in shot px
    const c = makeCam({ ...sh.cam }); const foot = project(c, W, H, base);
    return { url, rect: crop, foot, ...stats() };
  }
  // someone standing on the platform (crowd index i at x, z, turned ry), still; shot's px
  if (o.layer === "person") {
    show(st, { station: false, people: true });
    shadowCatcher(st, true);
    onlyPeople(st, [o.i]);
    const P = getPerson(st, o.i);
    P.position.set(o.x, 0, o.z); P.rotation.y = o.ry || 0; P.userData.pose(0, 1); P.position.x = o.x; P.position.z = o.z; P.updateMatrixWorld(true);
    const bb = new THREE.Box3().expandByObject(P); bb.min.y = 0; bb.expandByScalar(0.25);
    const pts = []; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) pts.push([x, y, z]);
    const crop = personRect(sh, {}, pts, W, H, 60 * scale);
    const url = await render(st, sh, { scale, n, alpha: true, crop, mirror: false, cam: { fstop: o.fstop || sh.cam.fstop } });
    shadowCatcher(st, false);
    const c = makeCam({ ...sh.cam }); const foot = project(c, W, H, [o.x, 0, o.z]);
    return { url, rect: crop, foot, ...stats() };
  }
  // shot 3: a car as a strip (the banner car "wrap" or a plain one), centred at x = 0, blurred by a motion of `blur` m
  if (o.layer === "car") {
    const ci = o.kind === "wrap" ? 2 : 3;
    show(st, { station: false, train: true, cars: [ci] });
    const X = 0;
    st.train.position.x = X - (-ci * (CAR + GAP)); st.train.updateMatrixWorld(true);
    st.train.userData.cars[ci].userData.doors.forEach((d) => (d.visible = o.doors !== "open"));
    const D = -(TRACKZ + HW) + sh.cam.pos[2]; // (the car's side, from the camera)
    const half = (CAR + GAP) / 2, y0 = -0.75 - sh.cam.pos[1], y1 = 2.78 - sh.cam.pos[1];
    const pxm = sh.W / (2 * D * Math.tan((sh.cam.hfov / 2) * DEG)) * (o.res ?? 1); // (the shot's px a metre at the car's side, times res)
    const Wp = Math.round(2 * half * pxm), Hp = Math.round((y1 - y0) * pxm);
    const x0tr = st.train.position.x;
    const url = await render(st, sh, { W: Wp, H: Hp, n, alpha: true, mirror: false, win: [-half, half, y0, y1, D], cam: { focus: D },
      perSample: (i, k) => { st.train.position.x = x0tr + (o.blur || 0) * (k - 0.5); st.train.updateMatrixWorld(true); } });
    st.train.position.x = x0tr; st.train.userData.cars[ci].userData.doors.forEach((d) => (d.visible = true));
    return { url, W: Wp, H: Hp, pxm, D, win: [-half, half, y0, y1], ...stats() };
  }
  // shot 3: one door leaf of the banner car (door at car-local x = o.door, leaf side o.s), in the shot's px
  if (o.layer === "leaf3") {
    show(st, { station: false, train: true, cars: [2] });
    placeTrain(st, 0);
    const car = st.train.userData.cars[2];
    for (const d of car.userData.doors) d.visible = d.userData.door === o.door && d.userData.s === o.s && d.userData.side > 0;
    const leaf = car.userData.doors.find((d) => d.visible);
    // hide the car's body: the leaf alone
    car.children.forEach((ch) => { if (!car.userData.doors.includes(ch)) ch.userData.vis0 = ch.visible, ch.visible = false; });
    const bb = new THREE.Box3().expandByObject(leaf).expandByScalar(0.04);
    const pts = []; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) pts.push([x, y, z]);
    const crop = personRect(sh, {}, pts, W, H, 6 * scale);
    const url = await render(st, sh, { scale, n, alpha: true, crop, mirror: false });
    car.children.forEach((ch) => { if (ch.userData.vis0 !== undefined) { ch.visible = ch.userData.vis0; delete ch.userData.vis0; } });
    car.userData.doors.forEach((d) => (d.visible = true));
    return { url, rect: crop, ...stats() };
  }
  // ---------- shot 2: inside the banner car (at the stop: car 2's centre at x = 0) ----------
  const car2 = st.train.userData.cars[2];
  const withHidden = (objs, fn) => { const v = objs.map((x) => x.visible); objs.forEach((x) => (x.visible = false)); return Promise.resolve(fn()).finally(() => objs.forEach((x, i) => (x.visible = v[i]))); };
  // the interior: the car alone, its leaves and glass out (the openings are alpha), lit by its own lamps
  if (o.layer === "interior") {
    show(st, { station: false, train: true, cars: [2] }); waiting(st, false);
    stationLights(st, false);
    try { return await withHidden([...car2.userData.doors, ...car2.userData.glassParts], async () => ({ url: await render(st, sh, { scale, n, alpha: true, mirror: false }), ...stats() })); }
    finally { stationLights(st, true); }
  }
  // a leaf of the door beside the poster (side A, door at car-local 2.45, s = -1 | 1), alone, glass out
  if (o.layer === "leaf2") {
    show(st, { station: false, train: true, cars: [2] }); waiting(st, false); stationLights(st, false);
    const leaf = car2.userData.doors.find((d) => d.userData.door === o.door && d.userData.s === o.s && d.userData.side > 0);
    const others = car2.children.filter((ch) => ch !== leaf && !ch.isLight);
    try {
      return await withHidden([...others, ...car2.userData.glassParts], async () => {
        const bb = new THREE.Box3().expandByObject(leaf).expandByScalar(0.03);
        const pts = []; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) pts.push([x, y, z]);
        const crop = personRect(sh, {}, pts, W, H, 8 * scale);
        return { url: await render(st, sh, { scale, n, alpha: true, crop, mirror: false }), rect: crop, ...stats() };
      });
    } finally { stationLights(st, true); }
  }
  // the windows' reflection of the car (they are mirrors when the tunnel is dark): black but for the glass
  if (o.layer === "refl2") {
    show(st, { station: false, train: true, cars: [2] }); waiting(st, false); stationLights(st, false);
    const zA = TRACKZ + HW - 0.05;
    const mr = new Mirror(W, H, { scale: 0.5, normal: [0, 0, -1], point: [0, 0, zA] });
    const glassIn = car2.userData.glassParts.filter((g) => { const p = new THREE.Vector3(); g.getWorldPosition(p); return p.z > TRACKZ; });
    mr.hide = car2.userData.glassParts;
    const gm = new THREE.ShaderMaterial({ uniforms: { ...mr.uniforms, k: { value: o.k ?? 0.9 } }, vertexShader: "uniform mat4 reflMat; varying vec4 vR; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vR = reflMat * w; gl_Position = projectionMatrix * viewMatrix * w; }", fragmentShader: "uniform sampler2D reflTex; uniform float k; varying vec4 vR; void main(){ gl_FragColor = vec4(texture2DProj(reflTex, vR).rgb * k, 1.0); }", depthWrite: true, side: THREE.DoubleSide });
    const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const swaps = [];
    car2.traverse((m) => { if (!m.isMesh) return; swaps.push([m, m.material, m.visible, m.renderOrder]); });
    const isGlass = new Set(glassIn);
    // the mirror sees the car as it is; the frame then shows the glass only
    const url = await (async () => {
      const job = { scene: st.scene, cam: makeCam({ ...sh.cam }), W, H, n, alpha: false, mirror: [], perSample: (i, k, rnd) => { st.perSample(i, k, rnd); for (const [m, mat, vis] of swaps) { m.material = mat; m.visible = vis; } mr.update(renderer(), st.scene, job.cam, car2.userData.glassParts); for (const [m] of swaps) { if (isGlass.has(m)) { m.material = gm; m.visible = true; } else m.material = black; } }, dev: { ...DEV, glare: 0 } };
      try { return await shoot(job); } finally { for (const [m, mat, vis, ro] of swaps) { m.material = mat; m.visible = vis; m.renderOrder = ro; } stationLights(st, true); }
    })();
    return { url, ...stats() };
  }
  // the station seen from the car: "far" (the far side: its track, wall and posters) or "near" (the platform: floor,
  // columns, ceiling, the people waiting), as a strip wider than the shot by L m each way; blur: the train's motion (m)
  if (o.layer === "out") {
    show(st, { station: true, train: false }); waiting(st, o.part === "near");
    meshesVisible([st.far], o.part === "far");
    if (o.part === "far") { meshesVisible(st.stationObjs.filter((x) => x !== st.far), false); meshesVisible([st.far], true); }
    const c = sh.cam, D = o.part === "far" ? (2 * CZ - WALLZ) - c.pos[2] : CZ - c.pos[2];
    const f = sh.W / 2 / Math.tan((c.hfov / 2) * DEG), pxm = (f / D) * (o.res ?? 1);
    const hw = (sh.W / 2) / (f / D), L = o.L ?? 20, half = (o.half ?? hw + L);
    const y0 = o.y0 ?? (o.part === "far" ? -2.9 : -7.4), y1 = o.y1 ?? (o.part === "far" ? 3.0 : 2.4);
    const Wp = Math.round(2 * half * pxm), Hp = Math.round((y1 - y0) * pxm);
    const url = await render(st, sh, { W: Wp, H: Hp, n, alpha: true, mirror: o.part === "near", win: [-half, half, y0, y1, D], cam: { focus: sh.cam.focus, fstop: o.fstop || sh.cam.fstop },
      camMove: (p0, k) => [p0[0] + (o.blur || 0) * (k - 0.5), p0[1], p0[2]] });
    waiting(st, false);
    return { url, W: Wp, H: Hp, pxm, D, half, win: [-half, half, y0, y1], ...stats() };
  }
  return { error: "unknown layer " + o.layer };
}
// a quick look (old test entry): the station from a shot's camera
export async function test({ shot = "platform", scale = 0.5, n = 32, cam = {} } = {}) { return layer({ shot, layer: "bg", scale, n, cam }); }
