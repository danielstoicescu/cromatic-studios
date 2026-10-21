// Cromatic · stories in Lottie · v4 (TASK-065c): a quick look through a camera (scouting new places), through the
// harness (harness.mjs on :8962). LOCAL ONLY.
//   node look.mjs '<json: { pos, tgt, fov, shift, level, scheme, park: [x, null, z, yaw] }>' out.png [w h]
import fs from "fs";
const [J, OUT, w = 540, h = 960] = process.argv.slice(2), o = { w: +w, h: +h, level: true, ...JSON.parse(J) };
const D = new URL(".", import.meta.url).pathname;
const body = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, false);
const o = ${JSON.stringify(o)};
const cur = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id);
const want = o.scheme || "monument";
if (cur !== want) { await p.evaluate((w) => window.__scheme(w), want); await p.waitForTimeout(6500); }
await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; });
await H.aim(p, o, 1500);
const url = await p.evaluate((o) => { const R = window.__R; R.park(o.park || [9000, null, 9000, 0]); try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true, ...(o.mode ? { mode: o.mode } : {}) }); } finally { R.park(null); } }, o);
return url;
`;
const r = await fetch("http://localhost:8962/", { method: "POST", body });
const t = await r.text();
if (r.status !== 200) { console.log(t.slice(0, 800)); process.exit(1); }
fs.writeFileSync(OUT, Buffer.from(JSON.parse(t).split(",")[1], "base64"));
console.log("ok", OUT);
