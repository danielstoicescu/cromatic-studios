// Cromatic · stories in Lottie · story C v2 (TASK-065): the chase's renders, shot by shot (chase2.mjs), through the
// harness. Night Mode, the yellow Dacia, no rain. Per shot: the plate (the whole frame, both cars away) and each car
// alone at every frame of 30 (4 subframes averaged: a 180-degree shutter), behind whatever stands in front of it (the
// scene's depth first), under a warm key light; the shot's camera and a few projected points to check the projector.
//   SHOT=olari,palace,... node renderC2.mjs   (all by default)
import fs from "fs";
import { SHOTS, ORDER } from "./chase2.mjs";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/raw2";
fs.mkdirSync(RAW, { recursive: true });
const D = new URL(".", import.meta.url).pathname, FPS = 30, SUB = 4, SHUT = 1 / 60;
const want = process.env.SHOT ? process.env.SHOT.split(",") : ORDER;
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
return res;
`;
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body });
console.log(r.status, (await r.text()).slice(0, 2000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
