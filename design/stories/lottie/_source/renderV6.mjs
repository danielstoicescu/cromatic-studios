// Cromatic · stories in Lottie · v6 (TASK-065e, Daniel's notes on D2 -> D3): the renders, through the harness
// (harness.mjs on :8962, PATH0="/?map&story"). LOCAL ONLY. Writes big PNGs and their numbers to RAW/v6.
// Printoteca's hall (src/buildings/printoteca-hall.js, the map's building API) stands in for the lane house in these
// renders only: the module is read from the repo and given the page's three classes (the site's bundle is untouched).
//   JOB=scout CAMS='[{...}]' node renderV6.mjs     quick looks (540 x 960) with the hall in place
//   JOB=d3 [D3=drift,skyline,overtake] node renderV6.mjs
import fs from "fs";
import { D3 } from "./shotsD3.mjs";
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
if (!JOBS[job]) throw new Error("JOB=" + Object.keys(JOBS).join("|"));
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body: head + JOBS[job] });
console.log(r.status, (await r.text()).slice(0, 2000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
