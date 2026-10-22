// Cromatic · stories in Lottie · v6 (TASK-065e, Daniel's notes on D2 -> D3): the renders, through the harness
// (harness.mjs on :8962, PATH0="/?map&story"). LOCAL ONLY. Writes big PNGs and their numbers to RAW/v6.
// Printoteca's hall (src/buildings/printoteca-hall.js, the map's building API) stands in for the lane house in these
// renders only: the module is read from the repo and given the page's three classes (the site's bundle is untouched).
//   JOB=scout CAMS='[{...}]' node renderV6.mjs     quick looks (540 x 960) with the hall in place
//   JOB=d3 [D3=drift,skyline,overtake] node renderV6.mjs
import fs from "fs";
import { D3 } from "./shotsD3.mjs";
import { A6 } from "./shotsA6.mjs";
import { SEG as B7SEG, car as b7car } from "./shotsB7.mjs";
import { omaArches } from "./shots5.mjs";
const job = process.env.JOB, RAW = (process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw") + "/v6";
fs.mkdirSync(RAW, { recursive: true });
const D = new URL(".", import.meta.url).pathname, HALL = fs.readFileSync(new URL("../../../../src/buildings/printoteca-hall.js", import.meta.url), "utf8").replace(/^export /m, "");
const head = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, true);
const RAW = "${RAW}";
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
const scheme = async (w) => { const cur = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id); if (cur !== w) { await p.evaluate((w) => window.__scheme(w), w); await p.waitForTimeout(6500); } await p.evaluate(() => { window.__story.state.weatherOn = false; }); };
const vehicle = async (v) => { await p.evaluate((v) => { if (window.__story.state.vehicleId !== v) window.__api.setVehicle(v); }, v); await p.waitForTimeout(1500); };
const force = "for (let o = x; o; o = o.parent) { if (o === window.__story.veh().group) return 'car'; if (o === window.__story.cop().group) return 'cop'; } return null;";
// the hall in place of the lane house (once): the module's text, given three's classes from the scene
await p.evaluate((src) => { const S = window.__story; if (S.printotecaHall) { S.printotecaHall.parent.remove(S.printotecaHall); S.printotecaHall = null; } // (rebuilt each job: the module may have changed)
  const K = { Mesh: S.sky.constructor, Group: S.veh().group.constructor, Color: S.sun.color.constructor, RepeatWrapping: 1000, SRGBColorSpace: S.renderer.outputColorSpace };
  S.scene.traverse((x) => { if (x.geometry && !K[x.geometry.type]) K[x.geometry.type] = x.geometry.constructor; const m = x.material && (Array.isArray(x.material) ? x.material[0] : x.material); if (m && !K[m.type]) K[m.type] = m.constructor; if (m && m.map && m.map.isCanvasTexture && !K.CanvasTexture) K.CanvasTexture = m.map.constructor; });
  const make = new Function(src + "; return makePrintotecaHall;")();
  let old = null; S.scene.traverse((o) => { if (!old && o.type === "Group" && o.name !== "printotecaHall" && Math.hypot(o.position.x - 1420.1, o.position.z - 6020.6) < 1 && o.children.length > 3) old = o; });
  if (old) old.visible = false;
  S.printotecaHall = make(K)(old ? old.parent : S.scene, 1420.1, 6020.6, { rotation: old ? old.rotation.y : -2.342, envMap: S.mats.omaGlow && S.mats.omaGlow.envMap });
}, ${JSON.stringify(HALL)});
await p.evaluate(() => document.fonts.ready);
// (the street's name painted big on the road by Printoteca reads as a smear from this low camera: hidden, for these renders)
await p.evaluate(() => { const S = window.__story, V = S.camera.position.constructor; S.scene.traverse((m) => { if (!m.isMesh || !m.visible || !m.material || Array.isArray(m.material) || !m.material.transparent || !m.material.map) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld), c = b.getCenter(new V()); if (b.max.y - b.min.y < 0.6 && Math.hypot(c.x - 1330, c.z - 6090) < 260) { m.visible = false; } }); });
const plate = async (name, o, { park = [9000, null, 9000, 0], wait = 2500 } = {}) => { await H.aim(p, o, wait); const u = await p.evaluate(({ o, park }) => { const S = window.__story, R = window.__R, FC = S.farClouds, fv = FC && FC.visible; if (FC) FC.visible = false; R.park(park); try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); if (FC) FC.visible = fv; } }, { o, park }); return save(u, RAW + "/" + name + ".png"); };
`;
const JOBS = {};
JOBS.scout = `
await scheme(process.env.SCHEME || "monument");
const cams = ${process.env.CAMS || "[]"};
fs.mkdirSync(RAW + "/scout", { recursive: true });
for (let i = 0; i < cams.length; i++) { const o = { w: 540, h: 960, level: true, ...cams[i] }; await plate("scout/s" + i, o, { park: o.park || [9000, null, 9000, 0], wait: 1500 }); }
return cams.length;
`.replace("process.env.SCHEME", JSON.stringify(process.env.SCHEME || "monument"));
{
  // ---- D3: the drift (the camera moving: plate and ride per frame), the skyline (and its tags' anchors), the overtake
  const dr = D3.drift, nF = Math.round(dr.dur * 30), drift = [];
  for (let i = 0; i <= nF; i++) { const t = i / 30, ta = t * dr.slow; drift.push({ cam: dr.cam(t), sub: Array.from({ length: dr.sub }, (_, j) => dr.pose(Math.max(0, ta + ((j + 0.5) / dr.sub - 0.5) * dr.shutter))) }); }
  const ov = D3.overtake, nO = Math.round(ov.dur * 30), SUB = 4, SH = 1 / 60, sub = (fn, t) => Array.from({ length: SUB }, (_, j) => fn(t - SH / 2 + ((j + 0.5) / SUB) * SH));
  const over = { dacia: [], f1: [] }; for (let i = 0; i <= nO; i++) { const t = i / 30; over.dacia.push(sub(ov.dacia, t)); over.f1.push(sub(ov.f1, t)); }
  const hall = []; for (let i = 0; i <= Math.round(D3.hall.dur * 30); i++) hall.push(D3.hall.cam(i / 30));
  JOBS.d3 = `
const only = ${JSON.stringify((process.env.D3 || "hall,drift,skyline,overtake").split(","))}, drift = ${JSON.stringify(drift)}, SK = ${JSON.stringify(D3.skyline)}, OV = ${JSON.stringify({ cam: D3.overtake.cam })}, over = ${JSON.stringify(over)};
const out = fs.existsSync(RAW + "/d3.json") ? JSON.parse(fs.readFileSync(RAW + "/d3.json", "utf8")) : {};
fs.mkdirSync(RAW + "/d3", { recursive: true });
if (only.includes("drift")) {
  await scheme("monument"); await vehicle("dacia1300");
  out.drift = [];
  await H.aim(p, { ...drift[0].cam }, 2500);
  for (let i = 0; i < drift.length; i++) {
    const o = { ...drift[i].cam, forceSrc: force, occlude: true };
    // (the loop's camera follows, so the sun's shadow map covers the frame; the plate, then the ride alone)
    const r = await p.evaluate(({ o, sub, first }) => { window.__cam(o.pos, o.tgt); window.__camSnap(); const S = window.__story, R = window.__R, FC = S.farClouds, fv = FC && FC.visible; if (FC) FC.visible = false; R.park([9000, null, 9000, 0]);
      try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); const plate = R.shot({ ...o, keepBg: true }); R.park(null); const car = R.carShot(o, "car", sub); return { plate, car }; } finally { R.park(null); if (FC) FC.visible = fv; } }, { o, sub: drift[i].sub, first: i === 0 });
    save(r.plate, RAW + "/d3/drift-plate-" + String(i).padStart(3, "0") + ".png");
    if (r.car) save(r.car.url, RAW + "/d3/drift-car-" + String(i).padStart(3, "0") + ".png");
    out.drift.push(r.car ? r.car.rect : null);
  }
}
if (only.includes("hall")) {
  await scheme("monument"); const hall = ${JSON.stringify(hall)}; out.hall = hall.length;
  await H.aim(p, hall[0], 2500);
  for (let i = 0; i < hall.length; i++) { const o = hall[i]; const u = await p.evaluate((o) => { window.__cam(o.pos, o.tgt); window.__camSnap(); const S = window.__story, R = window.__R, FC = S.farClouds, fv = FC && FC.visible; if (FC) FC.visible = false; R.park([9000, null, 9000, 0]); try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); if (FC) FC.visible = fv; } }, o); save(u, RAW + "/d3/hall-plate-" + String(i).padStart(3, "0") + ".png"); }
}
if (only.includes("skyline")) {
  await scheme("monument");
  await plate("d3/skyline-plate", SK.cam);
  const names = Object.keys(SK.tags), r = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o: SK.cam, pts: names.map((n) => SK.tags[n]) });
  out.tags = Object.fromEntries(names.map((n, i) => [n, r.pts[i]]));
}
if (only.includes("overtake")) {
  await scheme("nightlife");
  const o = { ...OV.cam, forceSrc: force, occlude: true };
  await vehicle("dacia1300");
  await plate("d3/overtake-plate", o);
  out.overtake = {};
  for (const [veh, list] of [["dacia1300", over.dacia], ["f1", over.f1]]) {
    await vehicle(veh); await H.aim(p, o, 1500);
    await p.evaluate((o) => { const R = window.__R; R.park([9000, null, 9000, 0]); R.plan(o); R.park(null); R.keyLight(o, true); }, o);
    const rects = [];
    try { for (let i = 0; i < list.length; i++) { const r = await p.evaluate(({ o, sub }) => { const S = window.__story; S.veh().beams && (S.veh().beams.visible = true); return window.__R.carShot(o, "car", sub); }, { o, sub: list[i] }); if (r) save(r.url, RAW + "/d3/overtake-" + veh + "-" + String(i).padStart(3, "0") + ".png"); rects.push(r ? r.rect : null); } }
    finally { await p.evaluate(() => window.__R.keyLight(null, false)); }
    out.overtake[veh] = rects;
  }
  await vehicle("dacia1300");
}
await scheme("monument");
fs.writeFileSync(RAW + "/d3.json", JSON.stringify(out));
return { drift: out.drift && out.drift.filter(Boolean).length, tags: out.tags, overtake: out.overtake && Object.fromEntries(Object.entries(out.overtake).map(([k, v]) => [k, v.filter(Boolean).length])) };
`;
}
// ---- B6: one street, nine worlds, a camera of its own for each world round the house on Olari, the world's own ride
// parked in frame (the map's ENV_VEH: Night Mode's Monopoly car, Underwater's sub, Race Day's F1, Sakura's and
// Risograph's scooter, GTA 2's patrol, the Dacia elsewhere). Rendered from the stories-b5-house build (Toma's windows;
// v2: Radu's rides, TASK-109: the scooter at its real size, the F1's flat slicks, so the scooters stand nearer the lens)
const B6 = {
  monument: { cam: { pos: [1290, 7, 7330], tgt: [1060, 28, 7330], fov: 76, shift: [0, 0.1], level: true }, park: [1222, null, 7318, 1.57] },
  nightlife: { cam: { pos: [1330, 4, 7180], tgt: [1075, 30, 7330], fov: 58, shift: [0, 0.08], level: true }, park: [1205, null, 7262, -2.2] },
  underwater: { cam: { pos: [1300, 40, 7425], tgt: [1075, 26, 7330], fov: 60, shift: [0, 0.04], level: true }, park: [1185, null, 7365, 2.6] },
  circuit: { cam: { pos: [1300, 3, 7385], tgt: [1075, 26, 7322], fov: 60, shift: [0, 0.1], level: true }, park: [1190, null, 7345, 0] },
  sketch: { cam: { pos: [1330, 70, 7250], tgt: [1075, 18, 7330], fov: 58, level: false }, park: [1175, null, 7300, 0.9], mode: "sketch" },
  orchid: { cam: { pos: [1270, 6, 7425], tgt: [1075, 30, 7322], fov: 60, shift: [0, 0.08], level: true }, park: [1236, null, 7412, 2.9] },
  gta2: { cam: { pos: [1230, 150, 7330], tgt: [1100, 0, 7330], fov: 56, level: false }, park: [1150, null, 7292, 0.4] },
  riso: { cam: { pos: [1300, 5, 7250], tgt: [1075, 32, 7335], fov: 62, shift: [0, 0.1], level: true }, park: [1256, null, 7262, 0.6], mode: "riso" },
  ghibli: { cam: { pos: [1405, 20, 7280], tgt: [1075, 40, 7330], fov: 60, shift: [0, 0.06], level: true }, park: [1262, null, 7288, -1.3] }
};
JOBS.b6 = `
const B6 = ${JSON.stringify(B6)}, only = ${JSON.stringify((process.env.WORLDS || Object.keys(B6).join(",")).split(","))}, out = {};
fs.mkdirSync(RAW + "/b6", { recursive: true });
for (const w of only) {
  const W0 = B6[w], o = { ...W0.cam, w: 2160, h: 3840 };
  await p.evaluate((w) => window.__scheme(w), w); await p.waitForTimeout(6500);
  await p.evaluate(() => { window.__story.state.weatherOn = false; });
  await H.aim(p, o, 2500);
  if (w === "sketch") { await p.evaluate((o) => { const S = window.__story; for (const q of [o.tgt, o.pos, [1170, 0, 7320]]) { const v = window.__R.W(q); S.sketchPaint(v.x, v.z, 3000, 1); } }, o); await p.waitForTimeout(3500); }
  const r = await p.evaluate(({ o, park, mode }) => { const S = window.__story, R = window.__R, FC = S.farClouds, fv = FC && FC.visible; if (FC) FC.visible = false; R.park(park); S.veh().beams && (S.veh().beams.visible = true);
    try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return { url: R.shot({ ...o, keepBg: true, ...(mode ? { mode } : {}) }), veh: S.state.vehicleId }; } finally { R.park(null); if (FC) FC.visible = fv; } }, { o, park: W0.park, mode: W0.mode || null });
  save(r.url, RAW + "/b6/" + w + ".png"); out[w] = r.veh;
}
await p.evaluate(() => window.__scheme("monument")); await p.waitForTimeout(3000);
fs.writeFileSync(RAW + "/b6.json", JSON.stringify(out));
return out;
`;
{
  // ---- A6: every shot captured from the map per frame (30 a second), the camera moving; with the ride in it, the ride
  // alone too (its matte) and the camera's numbers (for the composite of a better car); OMA's room behind its glass
  const ROOM = fs.readFileSync(new URL("./omaRoom.js", import.meta.url), "utf8");
  const shots = {};
  for (const [k, S] of Object.entries(A6)) { const n = Math.round(S.dur * 30), fr = []; for (let i = 0; i <= n; i++) { const t = i / 30; fr.push({ t, cam: S.cam(t), car: S.car ? [S.car(t - 1 / 120), S.car(t + 1 / 120)] : null }); } shots[k] = { frames: fr, park: S.park || null, room: !!S.room }; }
  JOBS.a6 = `
await scheme("monument"); await vehicle("dacia1300");
const shots = ${JSON.stringify(shots)}, only = ${JSON.stringify((process.env.SHOT || Object.keys(A6).join(",")).split(","))}, arches = ${JSON.stringify(omaArches())};
fs.mkdirSync(RAW + "/a6", { recursive: true });
const out = fs.existsSync(RAW + "/a6.json") ? JSON.parse(fs.readFileSync(RAW + "/a6.json", "utf8")) : {};
// OMA's room, in OMA's frame (made once)
await p.evaluate((src) => { const S = window.__story; if (S.omaRoom) return; const K = S.K3 || {}; if (!S.K3) { K.Mesh = S.sky.constructor; K.Group = S.veh().group.constructor; K.Color = S.sun.color.constructor; S.scene.traverse((x) => { if (x.geometry && !K[x.geometry.type]) K[x.geometry.type] = x.geometry.constructor; const m = x.material && (Array.isArray(x.material) ? x.material[0] : x.material); if (m && !K[m.type]) K[m.type] = m.constructor; }); S.K3 = K; }
  K.DirectionalLight = S.sun.constructor;
  const R = new Function(src + "; return makeOmaRoom;")()(K); R.group.position.set(706, 0, 4560); R.group.rotation.y = Math.PI / 2; R.group.visible = false; S.scene.add(R.group); S.omaRoom = R; }, ${JSON.stringify(ROOM)});
for (const k of only) {
  const sh = shots[k], rec = { cams: [], car: [], arches: [] };
  if (k === "oma") await p.evaluate(() => { const m = window.__story.mats.omaGlow; m.userData.keep = { c: m.color.getHex(), e: m.emissive.getHex(), ei: m.emissiveIntensity, me: m.metalness, ro: m.roughness, env: m.envMapIntensity }; m.color.setHex(0x3a2412); m.emissive.setHex(0xffb35c); m.emissiveIntensity = 0.62; m.metalness = 0; m.roughness = 1; m.envMapIntensity = 0; m.needsUpdate = true; });
  await H.aim(p, sh.frames[0].cam, 2500);
  for (let i = 0; i < sh.frames.length; i++) {
    const F0 = sh.frames[i], o = { ...F0.cam, forceSrc: force, occlude: true };
    const r = await p.evaluate(({ o, park, car, room, t }) => { window.__cam(o.pos, o.tgt); window.__camSnap(); const S = window.__story, R = window.__R, FC = S.farClouds, fv = FC && FC.visible; if (FC) FC.visible = false;
      try {
        R.park(park || [9000, null, 9000, 0]); if (S.omaRoom) S.omaRoom.group.visible = false;
        R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); const plate = R.shot({ ...o, keepBg: true });
        R.park(null); let carImg = null; if (car) { S.veh().beams && (S.veh().beams.visible = !!car[0].lights); carImg = R.carShot(o, "car", car); }
        let roomImg = null; if (room) { S.omaRoom.pose(t); S.omaRoom.group.visible = true; roomImg = R.layer(o, []); S.omaRoom.group.visible = false; }
        return { plate, car: carImg, room: roomImg };
      } finally { R.park(null); if (FC) FC.visible = fv; if (S.omaRoom) S.omaRoom.group.visible = false; } }, { o, park: sh.park, car: F0.car, room: sh.room, t: F0.t });
    const n = String(i).padStart(3, "0");
    save(r.plate, RAW + "/a6/" + k + "-plate-" + n + ".png");
    if (r.car) save(r.car.url, RAW + "/a6/" + k + "-car-" + n + ".png");
    if (r.room) save(r.room, RAW + "/a6/" + k + "-room-" + n + ".png");
    rec.cams.push(F0.cam); rec.car.push(r.car ? r.car.rect : null);
    if (sh.room) rec.arches.push((await p.evaluate(({ o, pts }) => window.__R.project(o, pts.flat()), { o: F0.cam, pts: arches })).pts);
  }
  if (k === "oma") await p.evaluate(() => { const m = window.__story.mats.omaGlow, q = m.userData.keep; m.color.setHex(q.c); m.emissive.setHex(q.e); m.emissiveIntensity = q.ei; m.metalness = q.me; m.roughness = q.ro; m.envMapIntensity = q.env; m.needsUpdate = true; });
  out[k] = rec;
  fs.writeFileSync(RAW + "/a6.json", JSON.stringify(out));
}
return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.cams.length]));
`;
}
{
  // ---- B7: Str. Olari, the ride driving up it, a shot per world (the world's own ride), captured per frame
  const segs = B7SEG.map((S, k) => { const fr = []; for (let t = S.a; t < S.b - 1e-6; t += 1 / 30) fr.push({ t: +t.toFixed(4), cam: S.cam(t), car: b7car(t) }); return { k, world: S.world, mode: S.mode, kind: S.kind, frames: fr }; });
  JOBS.b7 = `
const segs = ${JSON.stringify(segs)}, only = ${JSON.stringify(process.env.SEGS ? process.env.SEGS.split(",").map(Number) : null)};
fs.mkdirSync(RAW + "/b7", { recursive: true });
const out = fs.existsSync(RAW + "/b7.json") ? JSON.parse(fs.readFileSync(RAW + "/b7.json", "utf8")) : {};
for (const S of segs) {
  if (only && !only.includes(S.k)) continue;
  const cur = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id);
  if (cur !== S.world) { await p.evaluate((w) => window.__scheme(w), S.world); await p.waitForTimeout(6500); }
  await p.evaluate(() => { window.__story.state.weatherOn = false; });
  await H.aim(p, S.frames[0].cam, 2500);
  const veh = await p.evaluate(() => window.__story.state.vehicleId);
  for (let i = 0; i < S.frames.length; i++) {
    const F0 = S.frames[i], o = F0.cam, q = F0.car;
    const u = await p.evaluate(async ({ o, q, mode }) => { window.__cam(o.pos, o.tgt); window.__camSnap(); const S = window.__story, R = window.__R, FC = S.farClouds, fv = FC && FC.visible; if (FC) FC.visible = false;
      if (mode === "sketch") { for (const p0 of [[q.x, 0, q.z], o.tgt, [q.x, 0, q.z + 60]]) { const v = R.W(p0); S.sketchPaint(v.x, v.z, 900, 1); } }
      R.park([q.x, q.y, q.z, q.yaw]); S.veh().beams && (S.veh().beams.visible = true);
      try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true, ...(mode ? { mode } : {}) }); } finally { R.park(null); if (FC) FC.visible = fv; } }, { o, q, mode: S.mode });
    save(u, RAW + "/b7/s" + String(S.k).padStart(2, "0") + "-" + String(i).padStart(3, "0") + ".png");
  }
  out[S.k] = { world: S.world, veh, n: S.frames.length };
  fs.writeFileSync(RAW + "/b7.json", JSON.stringify(out));
}
await p.evaluate(() => window.__scheme("monument")); await p.waitForTimeout(3000);
return out;
`;
}
{
  // ---- C6: the radio-cassette in the 1300's dashboard (cassetteDash.js), placed far from the city, its own lights;
  // the camera close on the deck, a slow push; captured per frame (30 a second)
  const DASH = fs.readFileSync(new URL("./cassetteDash.js", import.meta.url), "utf8"), at = [1500, 420, 4260]; // (high over the roundabout: inside the sky, out of the warp)
  const cam = (t) => { const u = Math.min(1, t / 2.2), e = u * u * (3 - 2 * u); const k = t - 0.45, sh = k > 0 && k < 0.35 ? 0.22 * Math.exp(-k * 9) : 0, jx = sh * Math.sin(t * 157), jy = sh * Math.cos(t * 131); // (the engine catching: a tiny shudder of the frame)
    return { raw: true, pos: [at[0] + 9 - 4 * e + jx, at[1] + 15 - 4 * e + jy, at[2] + 82 - 22 * e], tgt: [at[0] + 0.6 + jx * 0.5, at[1] + 7.5 + jy * 0.5, at[2] + 9.2], fov: 36, level: false, w: 2160, h: 3840 }; };
  const fr = []; for (let i = 0; i <= Math.round(2.2 * 30); i++) fr.push({ t: i / 30, cam: cam(i / 30) });
  JOBS.c6dash = `
await scheme("nightlife");
const fr = ${JSON.stringify(fr)}, at = ${JSON.stringify(at)}, only = ${JSON.stringify(process.env.FR ? process.env.FR.split(",").map(Number) : null)};
fs.mkdirSync(RAW + "/c6dash", { recursive: true });
await p.evaluate(({ src, at }) => { const S = window.__story; if (S.dash) { S.dash.group.parent.remove(S.dash.group); S.dash = null; } const K = S.K3 || {}; if (!S.K3) { K.Mesh = S.sky.constructor; K.Group = S.veh().group.constructor; K.Color = S.sun.color.constructor; S.scene.traverse((x) => { if (x.geometry && !K[x.geometry.type]) K[x.geometry.type] = x.geometry.constructor; const m = x.material && (Array.isArray(x.material) ? x.material[0] : x.material); if (m && !K[m.type]) K[m.type] = m.constructor; if (m && m.map && m.map.isCanvasTexture && !K.CanvasTexture) K.CanvasTexture = m.map.constructor; }); S.K3 = K; }
  if (!K.CanvasTexture) S.scene.traverse((x) => { const m = x.material && (Array.isArray(x.material) ? x.material[0] : x.material); if (!K.CanvasTexture && m && m.map && m.map.isCanvasTexture) K.CanvasTexture = m.map.constructor; });
  K.DirectionalLight = S.sun.constructor; if (!K.CircleGeometry) { const c = S.sky.geometry.constructor; K.CircleGeometry = function (r, n) { return new K.CylinderGeometry(r, r, 0.01, n).rotateX(Math.PI / 2); }; }
  const D = new Function(src + "; return makeDash;")()(K); D.group.position.set(at[0], at[1], at[2]); D.group.traverse((m) => { if (m.isMesh) for (const mt of [].concat(m.material)) { mt.defines = { ...(mt.defines || {}), NO_CITY_WARP: "" }; mt.needsUpdate = true; } }); S.scene.add(D.group); S.dash = D; }, { src: ${JSON.stringify(DASH)}, at }); // (out of the city's warp: far away it bends everything; the camera raw too)
await H.aim(p, fr[0].cam, 1500);
for (let i = 0; i < fr.length; i++) {
  if (only && !only.includes(i)) continue;
  const o = fr[i].cam;
  const u = await p.evaluate(({ o, t }) => { const S = window.__story, R = window.__R; S.dash.pose(t); R.park([9000, null, 9000, 0]); try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); } }, { o, t: fr[i].t });
  save(u, RAW + "/c6dash/d-" + String(i).padStart(3, "0") + ".png");
}
await p.evaluate(() => { const S = window.__story; if (S.dash) { S.dash.group.parent.remove(S.dash.group); S.dash = null; } });
return fr.length;
`;
}
if (!JOBS[job]) throw new Error("JOB=" + Object.keys(JOBS).join("|"));
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body: head + JOBS[job] });
console.log(r.status, (await r.text()).slice(0, 2000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
