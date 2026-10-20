// Cromatic · stories in Lottie · story C (TASK-058): the chase's renders, sent to the harness like render.mjs. Night
// Mode, the yellow Dacia 1300 as the ride, no rain. The street: its layers with both cars away, then each car alone at
// 30 poses a second (4 subframes each, averaged: a 180-degree shutter), only the rectangle it covers; the projected
// points build.mjs needs (the rear wheels, the cars' middles, the festoon's bulbs). The bird's eye: two lenses, and the
// cars at a few poses along the coffee street.
//   JOB=c-street|c-air node renderC.mjs
import fs from "fs";
import { CARS, pose, rearWheels, beat, STREET_DUR, CSHOTS, AIR } from "./chase.mjs";
const job = process.env.JOB, RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/raw";
fs.mkdirSync(RAW, { recursive: true });
const D = new URL(".", import.meta.url).pathname;
const K = 2, W = 1080 * K, H = 1920 * K, FPS = 30, SUB = 4, SHUT = 1 / 60;
const YV = 1.73, YC = 1.7; // (the ride's and the police car's height on the map)
// the poses: for frame i (1/30 s), SUB subframes over the open shutter
const CAMZ = 4640; // (the street camera looks south from z 4640: a car past z ~4628 is beside or behind the lens)
const subposes = (car, t, y, beatOn) => Array.from({ length: SUB }, (_, k) => { const tt = t - SHUT / 2 + ((k + 0.5) / SUB) * SHUT, q = pose(car, tt); return q && q.z < CAMZ - 12 && { x: q.x, y, z: q.z, yaw: q.yaw, beat: beatOn ? beat(tt) : 0 }; }).filter(Boolean);
let data = {};
if (job === "c-street") {
  const o = { ...CSHOTS["c-street"], level: true, w: Math.round(W * 1.2 / 2) * 2, h: H };
  const frames = [];
  for (let i = 0; i <= Math.round(STREET_DUR * FPS); i++) frames.push(i / FPS);
  data = { o, frames, cars: {} };
  for (const car of ["yellow", "cop"]) data.cars[car] = frames.map((t) => ({ t, sub: subposes(car, t, car === "cop" ? YC : YV, car === "cop") }));
  // the points to project: per frame, each car's middle and rear wheels (y 0: on the road), the middle a car's height up
  const pts = [], idx = {};
  for (const car of ["yellow", "cop"]) idx[car] = frames.map((t) => { const q = pose(car, t), w = rearWheels(car, t); if (!q) return null; const k = pts.length; pts.push([q.x, 0, q.z], [q.x, 6, q.z], [w[0][0], 0, w[0][1]], [w[1][0], 0, w[1][1]]); return k; });
  data.idx = idx; data.pts = pts;
} else if (job === "c-air") {
  const o = { ...CSHOTS["c-air"], w: W, h: H, noMesa: true };
  const times = []; for (let t = 0; t <= AIR.dur + 1e-6; t += 1 / FPS) times.push(+t.toFixed(4));
  // (the aerial's paths, sampled: functions do not travel to the page)
  const keyT = []; for (let t = 0; t <= AIR.dur + 1e-6; t += 0.1) keyT.push(+t.toFixed(2)); // (a pose every 0.1 s: the road curves out of the roundabout)
  const samp = (car) => Object.fromEntries([...times, ...keyT].map((t) => [t, { ...AIR[car](t), y: car === "cop" ? YC : YV, beat: 0 }]));
  data = { o, times, keyT, airS: { yellow: samp("yellow"), cop: samp("cop") } };
}
const body = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, true);
const RAW = "${RAW}", job = "${job}", data = ${JSON.stringify(data)};
// the night, the yellow ride, no rain
const sch = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id);
if (sch !== "nightlife") { await p.evaluate(() => window.__scheme("nightlife")); await p.waitForTimeout(6000); }
await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; if (S.state.vehicleId !== "dacia1300") window.__api.setVehicle("dacia1300"); });
await p.waitForTimeout(1500);
const force = "for (let o = x; o; o = o.parent) { if (o === window.__story.veh().group) return 'car'; if (o === window.__story.cop().group) return 'cop'; } return null;";
const out = { o: data.o };
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
if (job === "c-street") {
  const o = { ...data.o, forceSrc: force };
  await H.aim(p, o, 2500);
  // the street's layers: both cars put far away for these (the police car shown, so the plan has it)
  const env = await p.evaluate((o) => { const S = window.__story, R = window.__R; S.cop().group.visible = true; R.park([5000, null, 5000, 0]); S.cop().group.position.set(5200, 1.7, 5200); S.cop().group.updateMatrixWorld(true);
    try { const c = R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); const urls = { full: R.shot({ ...o, keepBg: true }) }; const wid = (k) => ({ w: Math.round(1080 * 2 * k / 2) * 2 });
      for (const [nm, keep, ov] of [["sky", ["sky"]], ["far", ["far"]], ["mid", ["mid"]], ["near", ["near"], wid(1.4)], ["ground", ["ground"], wid(1.8)]]) urls[nm] = R.layer({ ...o, ...(ov || {}) }, keep);
      return { c, urls }; } finally { R.park(null); } }, o);
  for (const [k, u] of Object.entries(env.urls)) save(u, RAW + "/c-street-" + k + ".png");
  out.plan = env.c;
  // each car alone, frame by frame (the plan kept: the cars are its "car" and "cop" layers)
  out.sprites = {};
  for (const car of ["yellow", "cop"]) {
    out.sprites[car] = [];
    for (let i = 0; i < data.cars[car].length; i++) {
      const f = data.cars[car][i];
      if (!f.sub.length) { out.sprites[car].push(null); continue; }
      const r = await p.evaluate(({ o, who, sub }) => { const S = window.__story; S.cop().group.visible = true; const r = window.__R.carShot(o, who, sub); return r; }, { o, who: car === "cop" ? "cop" : "car", sub: f.sub });
      if (!r) { out.sprites[car].push(null); continue; }
      save(r.url, RAW + "/c-" + car + "-" + String(i).padStart(3, "0") + ".png");
      out.sprites[car].push(r.rect);
    }
  }
  // the police car standing where it stopped: its lamps red, blue, then off
  const last = data.cars.cop[data.cars.cop.length - 1].sub[0];
  out.copHold = [];
  for (const b of [0, 1, 2]) {
    const r = await p.evaluate(({ o, q }) => { window.__story.cop().group.visible = true; return window.__R.carShot(o, "cop", [q]); }, { o, q: { ...last, beat: b } });
    save(r.url, RAW + "/c-cophold-" + b + ".png"); out.copHold.push(r.rect);
  }
  await p.evaluate(() => { window.__story.cop().group.visible = false; });
  const pr = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o: data.o, pts: data.pts });
  const bulbs = await p.evaluate(() => { const S = window.__story, out = []; S.scene.traverse((x) => { if (x.isInstancedMesh && x.count === 13 && x.material.emissive) { const m = new S.camera.matrixWorld.constructor(), V = S.camera.position.constructor; for (let i = 0; i < x.count; i++) { x.getMatrixAt(i, m); m.premultiply(x.matrixWorld); out.push(new V().setFromMatrixPosition(m).toArray()); } } }); return out; });
  const pb = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o: data.o, pts: bulbs });
  out.proj = { pts: pr.pts, f: pr.f, horizon: pr.horizon, camY: pr.camY, idx: data.idx }; out.bulbs = pb.pts;
} else if (job === "c-air") {
  const o0 = { ...data.o, forceSrc: force };
  await H.aim(p, { ...o0, fov: o0.fovs[0] }, 3000);
  for (let i = 0; i < o0.fovs.length; i++) {
    const o = { ...o0, fov: o0.fovs[i] };
    const r = await p.evaluate((o) => { const S = window.__story, R = window.__R; S.cop().group.visible = true; R.park([5000, null, 5000, 0]); S.cop().group.position.set(5200, 1.7, 5200); S.cop().group.updateMatrixWorld(true);
      try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.layer(o, ["sky", "far", "mid", "near", "ground"]); } finally { R.park(null); S.cop().group.visible = false; } }, o);
    save(r, RAW + "/c-air-" + i + ".png");
  }
  // the cars from up here: a few poses each (the street is straight: only their distance changes), and where their
  // middles are at every frame (with a point a car's height up: the scale)
  const o = { ...o0, fov: o0.fovs[0] };
  await p.evaluate((o) => { window.__story.cop().group.visible = true; window.__R.plan(o); }, o);
  out.air = { poses: {}, track: {} };
  for (const car of ["yellow", "cop"]) {
    out.air.poses[car] = [];
    for (const t of data.keyT) {
      const q = data.airS[car][t];
      const r = await p.evaluate(({ o, who, q }) => window.__R.carShot(o, who, [q], { margin: 10 }), { o, who: car === "cop" ? "cop" : "car", q });
      const f = RAW + "/c-air-" + car + "-" + data.keyT.indexOf(t) + ".png"; if (r) save(r.url, f);
      out.air.poses[car].push({ t, rect: r && r.rect });
    }
    const pts = data.times.flatMap((t) => { const q = data.airS[car][t]; return [[q.x, 0, q.z], [q.x, 8, q.z]]; });
    out.air.track[car] = (await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o, pts })).pts;
  }
  await p.evaluate(() => { window.__story.cop().group.visible = false; });
}
fs.writeFileSync(RAW + "/" + job + ".json", JSON.stringify(out));
return { plan: out.plan, sprites: out.sprites && Object.fromEntries(Object.entries(out.sprites).map(([k, v]) => [k, v.filter(Boolean).length])) };
`;
const t0 = Date.now();
const res = await fetch("http://localhost:8962/", { method: "POST", body });
console.log(res.status, (await res.text()).slice(0, 1500), ((Date.now() - t0) / 1000).toFixed(1) + " s");
