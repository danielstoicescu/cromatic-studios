// Cromatic · stories in Lottie · story B v2 (TASK-065): the same street (the corner of Str. C. Aricescu 50A, b-street)
// in the Multiverse's nine worlds, five layers each, one camera. Worlds with a pass of their own (Sketchbook, Risograph)
// are rendered twice per layer: plain (its alpha) and through the pass (its pixels); plates2B.mjs puts them together.
//   node renderB2.mjs   (WORLDS=monument,nightlife,... to redo some)
import fs from "fs";
import { SHOTS } from "./shots.mjs";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/rawB2";
fs.mkdirSync(RAW, { recursive: true });
const D = new URL(".", import.meta.url).pathname;
const WORLDS = (process.env.WORLDS || "monument,nightlife,underwater,circuit,sketch,orchid,gta2,riso,ghibli").split(",");
const o = SHOTS["b-street"];
const body = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, true);
const RAW = "${RAW}", o0 = ${JSON.stringify(o)}, worlds = ${JSON.stringify(WORLDS)};
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
const wid = (k) => ({ w: Math.round(1080 * 2 * k / 2) * 2 });
const L = [["sky", ["sky"]], ["far", ["far"]], ["mid", ["mid"]], ["near", ["near"], wid(1.4)], ["ground", ["ground"], wid(1.8)]];
const out = {};
for (const w of worlds) {
  await p.evaluate((w) => window.__scheme(w), w);
  await p.waitForTimeout(6500);
  await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; });
  const mode = w === "sketch" ? "sketch" : w === "riso" ? "riso" : null;
  await H.aim(p, o0, 2500);
  if (w === "sketch") { await p.evaluate((o) => { const S = window.__story; for (const q of [o.tgt, o.pos]) { const v = window.__R.W(q); S.sketchPaint(v.x, v.z, 3000, 1); } }, o0); await p.waitForTimeout(3500); }
  // (the ride away: this street has no car)
  const r = await p.evaluate(({ o, L, mode }) => { const R = window.__R; R.park([9000, null, 9000, 0]);
    try { const c = R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); const urls = { full: R.shot({ ...o, keepBg: true, ...(mode ? { mode } : {}) }) };
      for (const [nm, keep, ov] of L) { urls[nm] = R.layer({ ...o, ...(ov || {}) }, keep); if (mode) urls[nm + "-post"] = R.layer({ ...o, ...(ov || {}), mode }, keep); }
      return { c, urls }; } finally { R.park(null); } }, { o: o0, L, mode });
  for (const [k, u] of Object.entries(r.urls)) save(u, RAW + "/" + w + "-" + k + ".png");
  out[w] = r.c.count;
}
await p.evaluate(() => window.__scheme("monument")); await p.waitForTimeout(3000);
return out;
`;
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body });
console.log(r.status, (await r.text()).slice(0, 1500), ((Date.now() - t0) / 1000).toFixed(1) + " s");
