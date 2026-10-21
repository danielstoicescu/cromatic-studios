// Cromatic · stories in Lottie · story C v4 (TASK-065c): the new shots' renders (chase4.mjs), as renderC2.mjs: per shot
// the plate and each car alone at every frame of 30 (a 180-degree shutter); then the fountain's water frame by frame
// (its own jets move: the box of the fountain plate, the cars away), and the windscreen close-up's plate (the ride parked).
//   SHOT=palace4,berero,fintech4 node renderC4.mjs   (EXTRA=water,cup for those two; EXTRA=only skips the shots)
import fs from "fs";
import { SHOTS as S2 } from "./chase2.mjs";
import { SHOTS as S4, ORDER4 as ORDER, WATER } from "./chase4.mjs";
const SHOTS = { ...S2, ...S4 };
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/rawC4";
fs.mkdirSync(RAW, { recursive: true });
const D = new URL(".", import.meta.url).pathname, FPS = 30, SUB = 4, SHUT = 1 / 60;
const want = process.env.EXTRA && !process.env.SHOT ? [] : process.env.SHOT ? process.env.SHOT.split(",") : ORDER;
const jobs = {};
for (const k of want) {
  const S = SHOTS[k], cam = S.cam, w = Math.round((2160 * (cam.wide || 1)) / 2) * 2;
  const o = { ...cam, w, h: 3840 };
  const frames = [];
  for (let i = 0; i <= Math.round(S.dur * FPS); i++) {
    const t = i / FPS, sub = (fn) => fn ? Array.from({ length: SUB }, (_, j) => fn(t - SHUT / 2 + ((j + 0.5) / SUB) * SHUT)).filter(Boolean) : [];
    frames.push({ t, yellow: sub(S.yellow), cop: sub(S.cop) });
  }
  jobs[k] = { o, frames, test: [[cam.tgt[0], 0, cam.tgt[2]], [cam.pos[0] + 30, 0, cam.pos[2] + 30]] };
}
const body = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, true);
const RAW = "${RAW}", jobs = ${JSON.stringify(jobs)};
const sch = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id);
if (sch !== "nightlife") { await p.evaluate(() => window.__scheme("nightlife")); await p.waitForTimeout(6000); }
await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; if (S.state.vehicleId !== "dacia1300") window.__api.setVehicle("dacia1300"); });
await p.waitForTimeout(1200);
const force = "for (let o = x; o; o = o.parent) { if (o === window.__story.veh().group) return 'car'; if (o === window.__story.cop().group) return 'cop'; } return null;";
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
const res = {};
for (const [k, J] of Object.entries(jobs)) {
  const o = { ...J.o, forceSrc: force, occlude: true };
  await H.aim(p, o, 2200);
  // the plate: both cars far away
  const plate = await p.evaluate((o) => { const S = window.__story, R = window.__R; S.cop().group.visible = true; R.park([9000, null, 9000, 0]); S.cop().group.position.set(9200, 1.7, 9200); S.cop().group.updateMatrixWorld(true);
    try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); } }, o);
  save(plate, RAW + "/" + k + "-plate.png");
  const out = { o: J.o, sprites: { yellow: [], cop: [] }, test: (await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o, pts: J.test })) };
  await p.evaluate((o) => window.__R.keyLight(o, true), o);
  try {
    for (const car of ["yellow", "cop"]) for (let i = 0; i < J.frames.length; i++) {
      const sub = J.frames[i][car];
      if (!sub.length) { out.sprites[car].push(null); continue; }
      const r = await p.evaluate(({ o, who, sub }) => { const S = window.__story; S.cop().group.visible = true; S.veh().beams && (S.veh().beams.visible = true); const r = window.__R.carShot(o, who, sub); S.cop().group.visible = false; return r; }, { o, who: car === "cop" ? "cop" : "car", sub });
      if (!r) { out.sprites[car].push(null); continue; }
      save(r.url, RAW + "/" + k + "-" + car + "-" + String(i).padStart(3, "0") + ".png");
      out.sprites[car].push(r.rect);
    }
  } finally { await p.evaluate(() => { window.__R.keyLight(null, false); window.__story.cop().group.visible = false; }); }
  fs.writeFileSync(RAW + "/" + k + ".json", JSON.stringify(out));
  res[k] = { yellow: out.sprites.yellow.filter(Boolean).length, cop: out.sprites.cop.filter(Boolean).length, test: out.test.pts };
}
// the fountain's water: its box, frame after frame at 30 (the loop runs between them, the jets move)
if (${JSON.stringify((process.env.EXTRA || "water,cup").includes("water"))}) {
  const F = ${JSON.stringify(SHOTS.fountain.cam)}, o = { ...F, w: 2160, h: 3840 }, box = ${JSON.stringify(WATER.box)}, n = ${Math.round(WATER.dur * 30) + 1};
  await H.aim(p, o, 2500);
  fs.mkdirSync(RAW + "/water", { recursive: true });
  await p.evaluate((o) => { const R = window.__R; R.park([9000, null, 9000, 0]); R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); }, o);
  // (the jets driven frame by frame: the fountain's own update at t = 100 + i / 30 s, then the shot, in one task)
  for (let i = 0; i < n; i++) {
    const u = await p.evaluate(({ o, t }) => { const S = window.__story, R = window.__R; R.park([9000, null, 9000, 0]); try { S.fountain().update(t); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); } }, { o, t: 100 + i / 30 });
    save(u, RAW + "/water/w-" + String(i).padStart(3, "0") + ".png");
  }
  res.water = n;
}
// the windscreen close-up: the ride parked under the lamp, lights on (one plate, the ride in it)
if (${JSON.stringify((process.env.EXTRA || "water,cup").includes("cup"))}) {
  const C = ${JSON.stringify(SHOTS.cup)}, o = { ...C.cam, w: 2160, h: 3840 };
  await H.aim(p, o, 2500);
  const u = await p.evaluate(({ o, park }) => { const S = window.__story, R = window.__R; R.park(park); S.veh().beams && (S.veh().beams.visible = true); S.veh().lampGlow?.(true); try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); } }, { o, park: C.park });
  save(u, RAW + "/cup-plate.png");
  res.cup = 1;
}
return res;
`;
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body });
console.log(r.status, (await r.text()).slice(0, 2000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
