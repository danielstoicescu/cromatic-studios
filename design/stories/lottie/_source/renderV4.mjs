// Cromatic · stories in Lottie · v4 (TASK-065c): the renders of the new places (shots4.mjs), through the harness
// (harness.mjs on :8962, PATH0="/?map&story"). LOCAL ONLY. Writes big PNGs and the shots' numbers to RAW.
//   JOB=street node renderV4.mjs     a4-street's five layers (as the pilot's a-street), b4-street's numbers
//   JOB=a4 node renderV4.mjs         A's overhead (two lenses, ground and what stands on it) and the boot shot
//   JOB=b4 node renderV4.mjs         B's street in the nine worlds (WORLDS=... to redo some), as renderB2.mjs
import fs from "fs";
import { SHOTS4, A4, bootCar4 } from "./shots4.mjs";
const job = process.env.JOB, RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw";
fs.mkdirSync(RAW, { recursive: true });
const D = new URL(".", import.meta.url).pathname;
const WORLDS = (process.env.WORLDS || "monument,nightlife,underwater,circuit,sketch,orchid,gta2,riso,ghibli").split(",");
const frames = []; for (let i = 0; i <= Math.round(A4.boot.dur * 30); i++) { const t = i / 30; frames.push(Array.from({ length: 4 }, (_, j) => bootCar4(t - 1 / 120 + ((j + 0.5) / 4) / 60))); }
const head = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, true);
const RAW = "${RAW}", S4 = ${JSON.stringify(SHOTS4)}, A4 = ${JSON.stringify(A4)};
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
const scheme = async (w) => { const cur = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id); if (cur !== w) { await p.evaluate((w) => window.__scheme(w), w); await p.waitForTimeout(6500); } await p.evaluate(() => { window.__story.state.weatherOn = false; }); };
const bulbs = () => p.evaluate(() => { const S = window.__story, out = []; S.scene.traverse((x) => { if (x.isInstancedMesh && x.count === 13 && x.material.emissive && x.material.emissive.getHexString() === "ffca6a") { const m = new S.camera.matrixWorld.constructor(), V = S.camera.position.constructor; for (let i = 0; i < x.count; i++) { x.getMatrixAt(i, m); m.premultiply(x.matrixWorld); out.push(new V().setFromMatrixPosition(m).toArray()); } } }); return out; });
const info = async (o, extraPts = []) => { const pins = Object.entries(o.pins || {}); const pts = [...pins.map(([, q]) => q), ...extraPts]; const r = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o, pts }); return { ...r, pins: Object.fromEntries(pins.map(([k], i) => [k, r.pts[i]])), extra: r.pts.slice(pins.length) }; };
await scheme("monument");
await p.evaluate(() => { const S = window.__story; if (S.state.vehicleId !== "dacia1300") window.__api.setVehicle("dacia1300"); });
await p.waitForTimeout(1200);
`;
const JOBS = {
  street: `
const out = {};
const wid = (k) => ({ w: Math.round(1080 * 2 * k / 2) * 2 });
const L = [["sky", ["sky"]], ["far", ["far"]], ["mid", ["mid"]], ["near", ["near"], wid(1.4)], ["ground", ["ground"], wid(1.8)]];
for (const k of ["a4-street", "b4-street"]) {
  const o = S4[k];
  await H.aim(p, o, 2500);
  const r = k === "a4-street" ? await H.layers(p, o, L, RAW, k, { park: o.park }) : { count: null };
  const b = await bulbs();
  out[k] = { main: { ...r, ...(await info(o, b)), bulbs: b } };
  fs.writeFileSync(RAW + "/" + k + ".json", JSON.stringify(out[k], null, 1));
}
return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { horizon: v.main.horizon, f: v.main.f, camY: v.main.camY, pins: v.main.pins, bulbs: v.main.bulbs.length }]));
`,
  a4: `
const force = "for (let o = x; o; o = o.parent) { if (o === window.__story.veh().group) return 'car'; if (o === window.__story.cop().group) return 'cop'; } return null;";
const frames = ${JSON.stringify(frames)}, out = {};
await H.aim(p, { ...A4.over, fov: A4.over.fovs[0] }, 2500);
for (let i = 0; i < A4.over.fovs.length; i++) {
  const o = { ...A4.over, fov: A4.over.fovs[i] };
  const r = await p.evaluate(({ o, park }) => { const R = window.__R; R.park(park); try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return { full: R.shot({ ...o, keepBg: true }), ground: R.layer(o, ["ground", "sky"]), up: R.layer(o, ["up"]) }; } finally { R.park(null); } }, { o, park: S4["a4-street"].park });
  for (const [k, u] of Object.entries(r)) save(u, RAW + "/over-" + i + "-" + k + ".png");
}
{
  const o = { ...A4.boot, forceSrc: force, occlude: true };
  await H.aim(p, o, 2500);
  const plate = await p.evaluate((o) => { const R = window.__R; R.park([9000, null, 9000, 0]); try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); } }, o);
  save(plate, RAW + "/boot-plate.png");
  out.boot = [];
  for (let i = 0; i < frames.length; i++) {
    const r = await p.evaluate(({ o, sub }) => window.__R.carShot(o, "car", sub), { o, sub: frames[i] });
    if (r) save(r.url, RAW + "/boot-car-" + String(i).padStart(3, "0") + ".png");
    out.boot.push(r ? r.rect : null);
  }
}
fs.writeFileSync(RAW + "/a4.json", JSON.stringify(out));
return { boot: out.boot.filter(Boolean).length };
`,
  b4: `
const o0 = S4["b4-street"], worlds = ${JSON.stringify(WORLDS)}, out = {};
const wid = (k) => ({ w: Math.round(1080 * 2 * k / 2) * 2 });
const L = [["sky", ["sky"]], ["far", ["far"]], ["mid", ["mid"]], ["near", ["near"], wid(1.4)], ["ground", ["ground"], wid(1.8)]];
for (const w of worlds) {
  await p.evaluate((w) => window.__scheme(w), w);
  await p.waitForTimeout(6500);
  await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; });
  const mode = w === "sketch" ? "sketch" : w === "riso" ? "riso" : null;
  await H.aim(p, o0, 2500);
  if (w === "sketch") { await p.evaluate((o) => { const S = window.__story; for (const q of [o.tgt, o.pos]) { const v = window.__R.W(q); S.sketchPaint(v.x, v.z, 3000, 1); } }, o0); await p.waitForTimeout(3500); }
  // (the frontal house shot is wide: the near cloud bank would fill its sky; it is left out)
  const r = await p.evaluate(({ o, L, mode }) => { const R = window.__R, FC = window.__story.farClouds, fcv = FC && FC.visible; if (FC) FC.visible = false; R.park([9000, null, 9000, 0]);
    try { const c = R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); const urls = { full: R.shot({ ...o, keepBg: true, ...(mode ? { mode } : {}) }) };
      for (const [nm, keep, ov] of L) { urls[nm] = R.layer({ ...o, ...(ov || {}) }, keep); if (mode) urls[nm + "-post"] = R.layer({ ...o, ...(ov || {}), mode }, keep); }
      return { c, urls }; } finally { R.park(null); if (FC) FC.visible = fcv; } }, { o: o0, L, mode });
  fs.mkdirSync(RAW + "/b4", { recursive: true });
  for (const [k, u] of Object.entries(r.urls)) save(u, RAW + "/b4/" + w + "-" + k + ".png");
  out[w] = r.c.count;
}
await p.evaluate(() => window.__scheme("monument")); await p.waitForTimeout(3000);
return out;
`
};
if (!JOBS[job]) throw new Error("JOB=street|a4|b4");
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body: head + JOBS[job] });
console.log(r.status, (await r.text()).slice(0, 2000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
