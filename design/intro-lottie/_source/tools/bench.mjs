// Cromatic opening (Lottie) · benchmark runner. One page per run, real-time playback of the whole 10 s.
// node ~/.x-li-bench.mjs [out.json] [filter]
// device: desktop = 1440x900 @2x, no throttling; phone4x = 390x844 @2.625 (Pixel 7 class), mobile, 4x CPU throttling
import pw from "playwright";
import fs from "fs";
const OUT = process.argv[2] || "/tmp/li-bench.json";
const FILTER = process.argv[3] || "";
const BASE = process.env.BENCH || "http://localhost:8576/bench.html";
const DEV = {
  desktop: { o: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, ab: "desktop", cpu: 1 },
  phone4x: { o: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: pw.devices["Pixel 7"].userAgent }, ab: "phone", cpu: 4 }
};
const runs = [];
for (const d of ["A", "B", "C"]) {
  for (const p of ["svg", "canvas", "lw", "dlw"]) runs.push([d, "desktop", p, ""]);
  for (const p of ["svg", "canvas", "lw", "dl", "dlw"]) runs.push([d, "phone4x", p, ""]);
  for (const p of ["svg", "canvas", "lw", "dlw"]) runs.push([d, "phone4x", p, "p4x"]);
}
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--enable-precise-memory-info"] });
const results = fs.existsSync(OUT) && FILTER ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
for (const [d, dev, p, jank] of runs) {
  const key = `${d} ${dev} ${p}${jank ? " +boot" : ""}`;
  if (FILTER && !key.includes(FILTER)) continue;
  const D = DEV[dev];
  const ctx = await br.newContext(D.o);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  if (D.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: D.cpu });
  await page.goto(`${BASE}?d=${d}&ab=${D.ab}&p=${p}${jank ? "&jank=" + jank : ""}`);
  await page.waitForFunction(() => window.__bench && window.__bench.ev.play != null || window.__bench?.err, null, { timeout: 60000 });
  const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  await page.waitForFunction(() => window.__bench.ok || window.__bench.err, null, { timeout: 90000 });
  const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const R = await page.evaluate(() => window.__bench);
  await ctx.close();
  if (R.err) { console.log(key, "ERROR", R.err.slice(0, 200)); results.push({ key, err: R.err }); continue; }
  const dur = (R.ev.done - R.ev.play) / 1000;
  // frames the player drew: lottie-web's enterFrame / dotLottie's frame events (a worker's arrive late under a busy
  // main thread, but each carries the frame it drew); gaps measured on the animation clock, in 60 fps frames
  const fr = R.frames.map((x) => x[1]);
  let gaps = 0, maxGap = 0; for (let i = 1; i < fr.length; i++) { const g = fr[i] - fr[i - 1]; if (g > 2.5) gaps++; if (g > maxGap) maxGap = g; }
  const drawn = fr.length, fps = drawn / dur;
  // main thread: rAF intervals during playback
  const raf = R.raf, iv = []; for (let i = 1; i < raf.length; i++) iv.push(raf[i] - raf[i - 1]);
  iv.sort((a, b) => a - b);
  const pct = (q) => iv.length ? +iv[Math.min(iv.length - 1, Math.floor(q * iv.length))].toFixed(1) : null;
  const task = +(m1.TaskDuration - m0.TaskDuration).toFixed(3), script = +(m1.ScriptDuration - m0.ScriptDuration).toFixed(3);
  const res = { key, d, dev, p, jank: !!jank, dur: +dur.toFixed(2), drawn, fps: +fps.toFixed(1), skips: gaps, maxSkip: +maxGap.toFixed(1), rafP50: pct(0.5), rafP95: pct(0.95), rafMax: iv.length ? +iv[iv.length - 1].toFixed(0) : null, mainTask_s: task, mainScript_s: script, mainBusyPct: +((100 * (task - R.jankMs / 1000)) / dur).toFixed(1), ev: R.ev };
  results.push(res);
  console.log(JSON.stringify({ key, fps: res.fps, skips: res.skips, maxSkip: res.maxSkip, rafP95: res.rafP95, main: res.mainBusyPct + "%", load: R.ev.loaded }));
}
await br.close();
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
console.log("wrote", OUT, results.length);
