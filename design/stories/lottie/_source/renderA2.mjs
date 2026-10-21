// Cromatic · stories in Lottie · story A v2 (TASK-065): the new shots of "Cromatic City" (the street level at Two
// Minutes is the pilot's a-street, its layers kept): an overhead straight down on the Two Minutes district in two
// lenses, each as its ground and what stands on it (so words painted on the ground pass under the roofs); and a
// low shot from behind the yellow ride's boot, the street ahead, the ride alone at every frame of 30 as it pulls away.
//   node renderA2.mjs
import fs from "fs";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/rawA2";
fs.mkdirSync(RAW, { recursive: true });
const D = new URL(".", import.meta.url).pathname;
import { A2, bootCar } from "./shotsA2.mjs";
const frames = []; for (let i = 0; i <= Math.round(A2.boot.dur * 30); i++) { const t = i / 30; frames.push(Array.from({ length: 4 }, (_, j) => bootCar(t - 1 / 120 + ((j + 0.5) / 4) / 60))); }
const body = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, true);
const RAW = "${RAW}", A2 = ${JSON.stringify(A2)}, frames = ${JSON.stringify(frames)};
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
const sch = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id);
if (sch !== "monument") { await p.evaluate(() => window.__scheme("monument")); await p.waitForTimeout(6000); }
await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; if (S.state.vehicleId !== "dacia1300") window.__api.setVehicle("dacia1300"); });
await p.waitForTimeout(1200);
const force = "for (let o = x; o; o = o.parent) { if (o === window.__story.veh().group) return 'car'; if (o === window.__story.cop().group) return 'cop'; } return null;";
const out = {};
// the overhead: two lenses, the ground and what stands on it (the ride parked on Aricescu, as in the street shot)
await H.aim(p, { ...A2.over, fov: A2.over.fovs[0] }, 2500);
for (let i = 0; i < A2.over.fovs.length; i++) {
  const o = { ...A2.over, fov: A2.over.fovs[i] };
  const r = await p.evaluate((o) => { const R = window.__R; R.park([880, null, 4243, -Math.PI / 2]); try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return { full: R.shot({ ...o, keepBg: true }), ground: R.layer(o, ["ground", "sky"]), up: R.layer(o, ["up"]) }; } finally { R.park(null); } }, o);
  for (const [k, u] of Object.entries(r)) save(u, RAW + "/over-" + i + "-" + k + ".png");
}
// the boot shot: the street without the ride, then the ride alone, frame by frame, behind what stands before it
{
  const o = { ...A2.boot, forceSrc: force, occlude: true };
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
fs.writeFileSync(RAW + "/a2.json", JSON.stringify(out));
return { boot: out.boot.filter(Boolean).length };
`;
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body });
console.log(r.status, (await r.text()).slice(0, 600), ((Date.now() - t0) / 1000).toFixed(1) + " s");
