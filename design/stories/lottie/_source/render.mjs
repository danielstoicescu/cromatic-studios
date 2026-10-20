// Cromatic · stories in Lottie (TASK-057): the render jobs, sent to the harness (harness.mjs) as the body of an async
// function: `JOB=<name> node render.mjs` posts it. Writes the layers' PNGs and the shot's numbers (pins, horizon,
// focal length, layer depths) to RAW (scratch: big PNGs), which plates.mjs turns into the stories' images.
import fs from "fs";
const job = process.env.JOB, RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/raw";
const D = new URL(".", import.meta.url).pathname;
const body = `
const H = await import("${D}lib-harness.mjs?" + Date.now()); const { SHOTS } = await import("${D}shots.mjs?" + Date.now());
await H.inject(p, true);
const RAW = "${RAW}", job = "${job}";
fs.mkdirSync(RAW, { recursive: true });
const bulbs = () => p.evaluate(() => { const S = window.__story, out = []; S.scene.traverse((x) => { if (x.isInstancedMesh && x.count === 13 && x.material.emissive && x.material.emissive.getHexString() === "ffca6a") { const m = new S.camera.matrixWorld.constructor(), V = S.camera.position.constructor; for (let i = 0; i < x.count; i++) { x.getMatrixAt(i, m); m.premultiply(x.matrixWorld); out.push(new V().setFromMatrixPosition(m).toArray()); } } }); return out; });
const info = async (o, extraPts = []) => { const pins = Object.entries(o.pins || {}); const pts = [...pins.map(([, q]) => q), ...extraPts]; const r = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o, pts }); return { ...r, pins: Object.fromEntries(pins.map(([k], i) => [k, r.pts[i]])), extra: r.pts.slice(pins.length) }; };
const out = {};
if (job === "a-air") {
  const o = SHOTS[job]; await H.aim(p, o, 2500);
  for (let i = 0; i < o.fovs.length; i++) {
    const oo = { ...o, fov: o.fovs[i] };
    const r = await H.layers(p, oo, [], RAW, job + "-" + i, {});
    out["z" + i] = { ...r, ...(await info(oo)) };
  }
} else if (job === "a-street" || job === "b-street" || job === "b-sketch") {
  const k = job === "b-sketch" ? "b-street" : job, o = { ...SHOTS[k], ...(job === "b-sketch" ? { mode: "sketch" } : {}) };
  if (job === "b-sketch") { await p.evaluate(() => window.__scheme("sketch")); await p.waitForTimeout(7000); }
  await H.aim(p, o, 2500);
  if (job === "b-sketch") { await p.evaluate((o) => { const S = window.__story, v = window.__R.W(o.tgt); S.sketchPaint(v.x, v.z, 3000, 1); const c = window.__R.W(o.pos); S.sketchPaint(c.x, c.z, 3000, 1); }, o); await p.waitForTimeout(3000); }
  // each layer as wide as its drift needs: the ground's nearest rows stream past fastest (1.8x the story's width)
  const wid = (k) => ({ w: Math.round(1080 * 2 * k / 2) * 2 });
  const L = [["sky", ["sky"]], ["far", ["far"]], ["mid", ["mid"]], ["near", ["near"], wid(1.4)], ["ground", ["ground"], wid(1.8)]];
  const r = await H.layers(p, o, L, RAW, job, { park: o.park });
  const b = await bulbs();
  out.main = { ...r, ...(await info(o, b)), bulbs: b };
  if (job === "b-sketch") { await p.evaluate(() => window.__scheme("monument")); await p.waitForTimeout(3000); }
}
fs.writeFileSync(RAW + "/" + job + ".json", JSON.stringify(out, null, 1));
return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { count: v.count, stats: v.stats, horizon: v.horizon, f: v.f, pins: v.pins }]));
`;
const t0 = Date.now();
const res = await fetch("http://localhost:8962/", { method: "POST", body });
console.log(res.status, await res.text(), ((Date.now() - t0) / 1000).toFixed(1) + " s");
