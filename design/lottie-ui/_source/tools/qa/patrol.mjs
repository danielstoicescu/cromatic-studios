// BUG-POLITE: the Polite Patrol on the map. Speeding (holding up on Medical Avenue's long straight) brings the chase;
// right after a chase, speeding again does not (the calm); the drift path still works (copNow, the test hook).
// BASE=http://localhost:8806 node design/lottie-ui/_source/tools/qa/patrol.mjs  -> prints ok true/false, exits 1 on fail
import { ctxFor, waitMap, sleep, closeAll } from "./lib.mjs";
const { page: p, log } = await ctxFor("desktop");
await p.goto(process.env.BASE ? process.env.BASE + "/?map" : "http://localhost:8931/?map", { waitUntil: "domcontentloaded" });
await waitMap(p); await sleep(2500);
const cop = () => p.evaluate(() => !!window.__nav2.D.cop);
async function speedRun(maxS = 9) {
  await p.evaluate(() => window.__nav2.put(1491, 4300, 0)); await sleep(300);
  await p.keyboard.down("ArrowUp");
  let t = null;
  for (let i = 0; i < maxS / 0.15; i++) { await sleep(150); if (await cop()) { t = +(i * 0.15).toFixed(2); break; } }
  await p.keyboard.up("ArrowUp");
  return t;
}
const r = {};
r.speeding = await speedRun();
await sleep(7500); // the chase ends (6.4 s)
r.calm = await speedRun(); // within the 45 s calm: no second chase for speeding
await sleep(3000);
await p.evaluate(() => window.__nav2.copNow()); await sleep(400);
r.drift = await cop();
const ok = r.speeding != null && r.calm == null && r.drift && log.errs.length === 0;
console.log(JSON.stringify({ ok, ...r, errs: log.errs }));
await closeAll();
process.exit(ok ? 0 : 1);
