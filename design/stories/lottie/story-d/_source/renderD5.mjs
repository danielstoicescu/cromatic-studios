// Cromatic · stories in Lottie · story D5 (TASK-115, Iris): the renders, through the harness (harness.mjs on HPORT,
// PATH0="/?map&story", the stories-render-44 build). LOCAL ONLY. Writes the frames and their numbers to RAW/d5.
//   SHOT=bird,zoom,steam node renderD5.mjs
import fs from "fs";
import { D5, PARK, PINS } from "./shotsD5.mjs";
const RAW = (process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/91f99970-4c85-4c76-9af9-b4762e98f53c/scratchpad/d5/raw"), HP = process.env.HPORT || 8986;
fs.mkdirSync(RAW + "/d5", { recursive: true });
const LIB = new URL("../../_source/lib-harness.mjs", import.meta.url).pathname;
const only = (process.env.SHOT || Object.keys(D5).join(",")).split(",");
const shots = {};
for (const k of only) { const S = D5[k], n = Math.round(S.dur * 30), fr = []; for (let i = 0; i <= n; i++) { const t = i / 30, ns = S.sub ? S.sub(t) : 1; fr.push({ t, cams: Array.from({ length: ns }, (_, j) => S.cam(t + (ns > 1 ? ((j + 0.5) / ns - 0.5) / 30 : 0))) }); } shots[k] = fr; }
const job = `
const H = await import("${LIB}?" + Date.now());
await H.inject(p, true);
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
const cur = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id);
if (cur !== "monument") { await p.evaluate(() => window.__scheme("monument")); await p.waitForTimeout(6500); }
await p.evaluate(() => { window.__story.state.weatherOn = false; if (window.__story.state.vehicleId !== "dacia1300") window.__api.setVehicle("dacia1300"); });
await p.waitForTimeout(1500);
const shots = ${JSON.stringify(shots)}, PARK = ${JSON.stringify(PARK)}, PINS = ${JSON.stringify(PINS)}, RAW = ${JSON.stringify(RAW)};
const out = fs.existsSync(RAW + "/d5.json") ? JSON.parse(fs.readFileSync(RAW + "/d5.json", "utf8")) : {};
for (const [k, fr] of Object.entries(shots)) {
  const rec = { cams: [], pins: [], subs: [] };
  await H.aim(p, fr[0].cams[0], 2500);
  for (let i = 0; i < fr.length; i++) {
    const urls = [];
    for (const o of fr[i].cams) {
      const u = await p.evaluate(({ o, park }) => { window.__cam(o.pos, o.tgt); window.__camSnap(); const S = window.__story, R = window.__R, FC = S.farClouds, fv = FC && FC.visible; if (FC) FC.visible = false; R.park(park);
        try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); if (FC) FC.visible = fv; } }, { o, park: PARK });
      urls.push(u);
    }
    const n = String(i).padStart(3, "0");
    urls.forEach((u, j) => save(u, RAW + "/d5/" + k + "-" + n + (urls.length > 1 ? "-s" + j : "") + ".png"));
    const mid = fr[i].cams[Math.floor(fr[i].cams.length / 2)];
    const pj = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o: mid, pts: Object.values(PINS) });
    rec.cams.push(mid); rec.subs.push(urls.length); rec.pins.push(Object.fromEntries(Object.keys(PINS).map((id, q) => [id, pj.pts[q]])));
  }
  out[k] = rec;
  fs.writeFileSync(RAW + "/d5.json", JSON.stringify(out));
}
return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.cams.length]));
`;
const t0 = Date.now();
const r = await fetch("http://localhost:" + HP + "/", { method: "POST", body: job });
console.log(r.status, (await r.text()).slice(0, 2000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
