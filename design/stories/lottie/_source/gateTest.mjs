// Cromatic · stories in Lottie · v3 gate test (TASK-065b): the word IN the engine, not over it. "SLOW" painted on the
// Slow Coffee Festival's plaza at night as a real decal in the 3D scene (a worn road-paint texture, a bump map for
// its thickness, the scene's own lights, fog and shadows on it), the yellow ride driving over it with real spotlights
// for headlights; the whole frame rendered by the engine at every frame of 30 (4 subframes: the motion blur).
//   node gateTest.mjs   (the harness on :8962; paint from makePaint.mjs in RAW)
import fs from "fs";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/v3";
const D = new URL(".", import.meta.url).pathname;
const paint = "data:image/png;base64," + fs.readFileSync(`${RAW}/paint-slow.png`).toString("base64");
const bump = "data:image/png;base64," + fs.readFileSync(`${RAW}/paint-slow-bump.png`).toString("base64");
const meta = JSON.parse(fs.readFileSync(`${RAW}/paint-slow.json`, "utf8"));
const CAM = { pos: [1462, 7, 5060], tgt: [1150, 40, 5160], fov: 58, shift: [0, 0.12], level: true, w: 2160, h: 3840 };
const GY = -0.5, DD = 32, F0 = (() => { const dx = 1150 - 1462, dz = 5160 - 5060, n = Math.hypot(dx, dz); return [dx / n, dz / n]; })(), C0 = [1462 + F0[0] * DD, 5060 + F0[1] * DD], U = [-F0[1], F0[0]].map((v) => -v);
const A = [C0[0] - U[0] * 75, C0[1] - U[1] * 75], B = [C0[0] + U[0] * 75, C0[1] + U[1] * 75], V = 165, T0 = 0.05, DUR = 1.3;
const pose = (t) => { const s = Math.max(0, V * (t - T0)), L = Math.hypot(B[0] - A[0], B[1] - A[1]), u = Math.min(1, s / L); return { x: A[0] + (B[0] - A[0]) * u, y: GY + 0.73, z: A[1] + (B[1] - A[1]) * u, yaw: Math.atan2(B[0] - A[0], B[1] - A[1]), lights: 1 }; };
const frames = []; for (let i = 0; i <= Math.round(DUR * 30); i++) { const t = i / 30; frames.push(Array.from({ length: 4 }, (_, j) => pose(t - 1 / 120 + ((j + 0.5) / 4) / 60))); }
const body = `
const H = await import("${D}lib-harness.mjs?" + Date.now()); await H.inject(p, true);
const RAW = "${RAW}", CAM = ${JSON.stringify(CAM)}, frames = ${JSON.stringify(frames)}, meta = ${JSON.stringify(meta)}, stillPose = ${JSON.stringify(pose(0.62))};
const sch = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id);
if (sch !== "nightlife") { await p.evaluate(() => window.__scheme("nightlife")); await p.waitForTimeout(6000); }
await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; if (S.state.vehicleId !== "dacia1300") window.__api.setVehicle("dacia1300"); });
await p.waitForTimeout(1500);
await H.aim(p, CAM, 2500);
// the decal and the headlights, in the scene
await p.evaluate(async ({ CAM, paint, bump, meta }) => {
  const T = window.__T3 || (window.__T3 = await import("https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js"));
  const S = window.__story, scene = S.scene;
  const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src; });
  const [pi, bi] = await Promise.all([load(paint), load(bump)]);
  const tex = new T.Texture(pi); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 16; tex.needsUpdate = true;
  const btex = new T.Texture(bi); btex.anisotropy = 16; btex.needsUpdate = true;
  // where: across the ride's line, ~42 ahead of the lens, on the plaza (its height found by a ray from above)
  const dx = CAM.tgt[0] - CAM.pos[0], dz = CAM.tgt[2] - CAM.pos[2], n = Math.hypot(dx, dz), f = [dx / n, dz / n], d = 32;
  const cx = CAM.pos[0] + f[0] * d, cz = CAM.pos[2] + f[1] * d;
  const ray = new T.Raycaster(new T.Vector3(cx, 80, cz), new T.Vector3(0, -1, 0));
  const hits = []; scene.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || !o.visible || o === S.sky || !o.geometry) return; try { o.raycast(ray, hits); } catch (e) {} }); hits.sort((a, b) => a.distance - b.distance);
  // (the plaza: the highest opaque surface under a man's height; not a lamp's head or a kerb's see-through casing)
  const ground = hits.filter((h) => h.point.y < 6 && !(h.object.material && h.object.material.transparent));
  const gy = ground.length ? ground[0].point.y : 0;
  const w = 17, h = w / meta.aspect;
  const geo = new T.PlaneGeometry(w, h); geo.rotateX(-Math.PI / 2);
  const mat = new T.MeshStandardMaterial({ map: tex, bumpMap: btex, bumpScale: 2.2, roughness: 0.38, metalness: 0, transparent: true, alphaTest: 0.32, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const mesh = new T.Mesh(geo, mat); mesh.position.set(cx, gy + 0.04, cz); mesh.rotation.y = Math.atan2(-f[0], -f[1]); mesh.receiveShadow = true; mesh.name = "gate · SLOW decal";
  scene.add(mesh);
  // the headlights: two spotlights on the ride's nose, aimed down the road ahead
  const mk = () => { const L = new T.SpotLight("#fff1d6", 7000, 140, 0.62, 0.7, 1.5); L.castShadow = false; scene.add(L); scene.add(L.target); return L; };
  window.__gate = { mesh, gy, lights: [mk(), mk()], T };
  return { gy, hits: hits.length };
}, { CAM, paint: ${JSON.stringify(paint)}, bump: ${JSON.stringify(bump)}, meta });
// render a frame: the ride at its subframe poses, its headlights with it, the whole frame, averaged
const shotAt = (sub) => p.evaluate(({ CAM, sub }) => {
  const S = window.__story, R = window.__R, G = window.__gate, g = S.veh().group, keep = { p: g.position.clone(), q: g.quaternion.clone() };
  const acc = document.createElement("canvas"); acc.width = CAM.w; acc.height = CAM.h; const cx = acc.getContext("2d"); cx.globalCompositeOperation = "lighter"; cx.globalAlpha = 1 / sub.length;
  try {
    for (const q of sub) {
      g.position.set(q.x, q.y, q.z); g.rotation.set(0, q.yaw, 0); S.veh().lampGlow?.(true); if (S.veh().beams) S.veh().beams.visible = true; g.updateMatrixWorld(true);
      const fw = [Math.sin(q.yaw), Math.cos(q.yaw)], rt = [Math.cos(q.yaw), -Math.sin(q.yaw)];
      G.lights.forEach((L, k) => { const sd = k ? 1 : -1; L.position.set(q.x + fw[0] * 11 + rt[0] * 3.6 * sd, q.y + 2.4, q.z + fw[1] * 11 + rt[1] * 3.6 * sd); L.target.position.set(q.x + fw[0] * 45 + rt[0] * 3.6 * sd, q.y - 1, q.z + fw[1] * 45 + rt[1] * 3.6 * sd); L.updateMatrixWorld(true); L.target.updateMatrixWorld(true); });
      const url = R.shot({ ...CAM, keepBg: true, shadowUpdate: true });
      // (shot() returns a data URL after drawing; the canvas is sized back after it, so draw from the URL)
      const im = new Image(); im.src = url; window.__pending = (window.__pending || []).concat([im]);
    }
  } finally { g.position.copy(keep.p); g.quaternion.copy(keep.q); }
  return Promise.all(window.__pending.map((im) => im.decode().then(() => cx.drawImage(im, 0, 0)))).then(() => { window.__pending = []; return acc.toDataURL("image/png"); });
}, { CAM, sub });
fs.mkdirSync(RAW + "/frames", { recursive: true });
for (let i = 0; i < frames.length; i++) { const url = await shotAt(frames[i]); fs.writeFileSync(RAW + "/frames/f" + String(i).padStart(4, "0") + ".png", Buffer.from(url.split(",")[1], "base64")); }
// a still with the ride standing on the word's edge, for the before/after
const still = await shotAt([stillPose]);
fs.writeFileSync(RAW + "/still-after.png", Buffer.from(still.split(",")[1], "base64"));
// tidy the scene
await p.evaluate(() => { const S = window.__story, G = window.__gate; S.scene.remove(G.mesh); G.lights.forEach((L) => { S.scene.remove(L); S.scene.remove(L.target); }); window.__gate = null; });
return { frames: frames.length };
`;
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body });
console.log(r.status, (await r.text()).slice(0, 800), ((Date.now() - t0) / 1000).toFixed(1) + " s");
