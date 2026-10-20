// piece 4: frames presented while the XP pop and a card landing play (Pixel, CPU x4): the GPU process's DrawAndSwap
// count in the 1.3 s from the trigger, against the main thread's frames (BeginMainFrame) in the same window
import { ctxFor, waitMap, sleep, closeAll, BASE, browserFor } from "./lib.mjs";
const kind = process.env.DEV || "pixel";
const { page, ctx } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 120; i++) { await sleep(400); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden)"))) break; }
await sleep(3000);
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-close")?.click()); await sleep(1500);
if (process.env.THR) { const c = await ctx.newCDPSession(page); await c.send("Emulation.setCPUThrottlingRate", { rate: +process.env.THR }); }
const br = await browserFor(kind);
for (const run of [0, 1]) {
  await br.startTracing(page, { categories: ["toplevel", "viz", "disabled-by-default-devtools.timeline.frame", "devtools.timeline", "blink.user_timing", "cc"] });
  await page.evaluate(() => { performance.mark("czx-go"); const to = document.querySelector(".topbar .you").getBoundingClientRect(); window.czMicro.xpFly({ left: innerWidth * 0.5, top: innerHeight * 0.42, width: 30, height: 30 }, to, 5, "#2f9e4f", "#fff"); const k = document.querySelector(".map-card"); k.classList.remove("hidden"); k.classList.remove("in"); void k.offsetWidth; k.classList.add("in"); });
  await sleep(1600);
  const ev = JSON.parse((await br.stopTracing()).toString()).traceEvents;
  const m = ev.find((e) => e.name === "czx-go"); const a = m.ts, b = m.ts + 1.3e6;
  const n = (re, f = () => true) => ev.filter((e) => e.ts >= a && e.ts <= b && re.test(e.name) && f(e)).length;
  console.log(`${kind} x${process.env.THR || 1} run ${run}: presented frames (DrawAndSwap) ${n(/^Display::DrawAndSwap$/)} in 1.3 s; main-thread frames ${n(/^ProxyMain::BeginMainFrame$/, (e) => e.pid === m.pid)}; compositor draws ${n(/^ProxyImpl::ScheduledActionDraw$/, (e) => e.pid === m.pid)}`);
  await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-close")?.click()); await sleep(1200);
}
await closeAll();
