// pill-stab: CPU on the map with the Lottie UI layer (r231-r235) present vs off (window.__czL = false before any script).
// Chromium: a trace, per thread: the renderer's main thread, its workers (the shared lottie worker), its compositor, the
// GPU process; summed top-level task time per second. WebKit: CPU time of its processes (ps) over the same windows.
// Scenarios: the map idle (parked, no input) and driving (ArrowUp held, a turn now and then), FLOW=intro: a first visit
// (the opening plays on /, then its window opens, then idle there).  DEV=pixel THR=4 | DEV=iphone   RUNS=2  SECS=8
import { ctxFor, waitMap, sleep, closeAll, BASE, browserFor } from "./lib.mjs";
import { execSync } from "child_process";
const kind = process.env.DEV || "pixel", wk = kind.startsWith("iphone"), SECS = +(process.env.SECS || 8), RUNS = +(process.env.RUNS || 2), FLOW = process.env.FLOW || "map";
const CATS = ["toplevel", "disabled-by-default-devtools.timeline", "devtools.timeline", "__metadata"];
// total CPU seconds of Playwright's WebKit processes, except those that were running before this script (another
// session's): its UI process and its web, GPU and network processes (XPC services, not children of anything here)
const wkRows = () => { try { return execSync(`ps -A -o pid=,time=,command= | grep -i "ms-playwright/webkit" | grep -v grep`, { encoding: "utf8" }).trim().split("\n").filter(Boolean).map((l) => { const [pid, t] = l.trim().split(/\s+/); const p = t.split(":").map(Number); return { pid: +pid, s: p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1] }; }); } catch (e) { return []; } };
const preWk = new Set(wkRows().map((r) => r.pid));
let wkN = 0;
const wkCpu = () => { const r = wkRows().filter((x) => !preWk.has(x.pid)); wkN = r.length; return r.reduce((a, x) => a + x.s, 0); };
const perThread = (buf) => {
  const ev = JSON.parse(buf.toString()).traceEvents || JSON.parse(buf.toString());
  const tn = {}, pn = {};
  for (const e of ev) { if (e.ph === "M" && e.name === "thread_name") tn[e.pid + ":" + e.tid] = e.args.name; if (e.ph === "M" && e.name === "process_name") pn[e.pid] = e.args.name; }
  const sum = {};
  for (const e of ev) {
    if (e.ph !== "X" || !e.dur || !/toplevel/.test(e.cat) || !/RunTask/.test(e.name)) continue;
    let t = tn[e.pid + ":" + e.tid] || "?", p = pn[e.pid] || "?";
    if (/Renderer/i.test(p)) p = "renderer"; else if (/GPU/i.test(p)) p = "gpu"; else if (/Browser/i.test(p)) continue;
    if (/DedicatedWorker/i.test(t)) t = "worker"; else if (/^ThreadPool|CompositorTileWorker|Media|AudioOutput|Chrome_ChildIOThread|IO/i.test(t)) t = "pool/io";
    const k = p + "/" + t; sum[k] = (sum[k] || 0) + e.dur / 1000;
  }
  return sum;
};
const run = async (on) => {
  const { page, ctx, log } = await ctxFor(kind, { consent: "yes2", ls: FLOW === "intro" ? "fresh" : "seen" });
  if (!on) await ctx.addInitScript(() => { window.__czL = false; });
  if (FLOW === "intro") { await page.goto(BASE + "/", { waitUntil: "domcontentloaded" }); await sleep(22000); }
  else if (FLOW === "onb") { await page.goto(BASE + "/onboarding/", { waitUntil: "load" }); await sleep(3000); }
  else { await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(4000); }
  let cdp = null; if (!wk && process.env.THR) { cdp = await ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: +process.env.THR }); }
  const lay = await page.evaluate(() => ({ czL: !!window.czL, pill: !!window.czPill, canvases: document.querySelectorAll(".czl canvas, .czi canvas, canvas").length, lottie: !!window.lottie, workers: performance.getEntriesByType("resource").filter((r) => /lottie|player/i.test(r.name)).length }));
  const out = { lay };
  const phases = FLOW === "intro" ? ["idle"] : FLOW === "onb" ? ["onscreen", "offscreen"] : ["idle", "drive"];
  for (const ph of phases) {
    const br = await browserFor(kind);
    if (!wk) await br.startTracing(page, { categories: CATS });
    const c0 = wk ? wkCpu() : 0, t0 = Date.now();
    // frame pacing on the page's main thread meanwhile
    await page.evaluate(() => { window.__fp = []; let l = performance.now(); const f = (t) => { window.__fp.push(t - l); l = t; if (window.__fpOn) requestAnimationFrame(f); }; window.__fpOn = true; requestAnimationFrame(f); });
    if (ph === "onscreen" || ph === "offscreen") {
      // an explainer in the middle of the screen, or the page's top (none of them on screen)
      // the same scroll positions with the layer on or off (the drive's explainer, 5.9k px down on a Pixel, in the middle)
      const Y = ph === "onscreen" ? +(process.env.ONBY || 5929) - 300 : 0;
      await page.evaluate((y) => window.scrollTo(0, y), Y);
      await sleep(2500);
      out[ph + "Seen"] = await page.evaluate(() => ({ y: Math.round(scrollY), boxes: [...document.querySelectorAll("[data-czl]")].filter((b) => { const r = b.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; }).map((b) => b.getAttribute("data-czl") + (b._playing ? ":playing" : "")).join(",") || "none", canv: document.querySelectorAll(".czl canvas").length }));
      await sleep(SECS * 1000);
    } else if (ph === "drive") {
      await page.keyboard.down("ArrowUp");
      for (let i = 0; i < SECS; i++) { await sleep(700); if (i % 3 === 1) { await page.keyboard.down("ArrowLeft"); await sleep(300); await page.keyboard.up("ArrowLeft"); } else await sleep(300); }
      await page.keyboard.up("ArrowUp");
    } else await sleep(SECS * 1000);
    const fp = await page.evaluate(() => { window.__fpOn = false; const a = window.__fp.slice(2).sort((x, y) => x - y); const n = a.length; return { n, p50: Math.round(a[Math.floor(n * 0.5)] || 0), p95: Math.round(a[Math.floor(n * 0.95)] || 0), over50: a.filter((x) => x > 50).length }; });
    const secs = (Date.now() - t0) / 1000;
    if (wk) { const cpu = wkCpu() - c0; out[ph] = { cpuPct: Math.round((cpu / secs) * 100), msPerFrame: Math.round((cpu * 1000) / Math.max(1, fp.n)), procs: wkN, fp }; }
    else { const sum = perThread(await br.stopTracing()); const r = {}; for (const k in sum) if (sum[k] / secs > 2) r[k] = Math.round(sum[k] / secs); out[ph] = { msPerSec: r, fp }; }
  }
  out.errs = log.errs.slice(0, 3);
  await ctx.close();
  return out;
};
for (let i = 0; i < RUNS; i++) for (const on of i % 2 ? [false, true] : [true, false]) {
  const r = await run(on);
  console.log(`${kind}${process.env.THR ? " x" + process.env.THR : ""} ${FLOW} layer ${on ? "ON " : "OFF"} ${JSON.stringify(r)}`);
}
await closeAll();
