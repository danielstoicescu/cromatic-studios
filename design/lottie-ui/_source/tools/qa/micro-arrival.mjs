// piece 4: a real arrival at a place not visited yet (+5 XP, its card), the piece on or off (__czL = false): main-thread
// long tasks (Chromium: the longtask observer; WebKit: frames over 50 ms) and frames in the 1.6 s from the card showing.
// DEV=pixel THR=4 | DEV=iphone ; OFF=1 ; PLACE=craft
import { ctxFor, waitMap, sleep, closeAll, BASE } from "./lib.mjs";
const kind = process.env.DEV || "pixel";
const out = [];
for (const off of [false, true, false, true]) {
  const { page, ctx, log } = await ctxFor(kind, { consent: "yes2" });
  if (off) await ctx.addInitScript(() => { window.__czL = false; });
  await ctx.addInitScript(() => { window.__lt = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ entryTypes: ["longtask"] }); } catch (e) {} window.__fr = []; const f = (t) => { window.__fr.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
  if (process.env.THR && kind !== "iphone") { const c = await ctx.newCDPSession(page); await c.send("Emulation.setCPUThrottlingRate", { rate: +process.env.THR }); }
  await page.evaluate(() => window.__mapGo("steam"));
  for (let i = 0; i < 120; i++) { await sleep(400); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden)"))) break; }
  await sleep(2500);
  await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-close")?.click()); await sleep(1500);
  await page.evaluate((p) => { window.__seenCard = null; new MutationObserver(() => { const c = document.querySelector(".map-card.in:not(.hidden)"); if (c && !window.__seenCard) window.__seenCard = performance.now(); }).observe(document.querySelector(".map-card"), { attributes: true, attributeFilter: ["class"] }); window.__mapGo(p); }, process.env.PLACE || "craft");
  for (let i = 0; i < 150; i++) { await sleep(200); if (await page.evaluate(() => window.__seenCard)) break; }
  await sleep(1800);
  const r = await page.evaluate(() => { const t0 = window.__seenCard, t1 = t0 + 1600; const lt = window.__lt.filter((x) => x[0] + x[1] > t0 - 100 && x[0] < t1); const fr = window.__fr.filter((t) => t >= t0 && t < t1); let gaps = 0, worst = 0; for (let i = 1; i < fr.length; i++) { const g = fr[i] - fr[i - 1]; if (g > 50) gaps++; worst = Math.max(worst, g); } return { card: !!t0, longTasks: lt.length, ltMs: Math.round(lt.reduce((a, x) => a + x[1], 0)), ltMax: Math.round(Math.max(0, ...lt.map((x) => x[1]))), frames: fr.length, over50: gaps, worst: Math.round(worst), xp: document.querySelectorAll(".czx, .xp-fly").length }; });
  console.log(kind + (process.env.THR ? " x" + process.env.THR : ""), off ? "OFF" : "ON ", JSON.stringify(r), log.errs.length ? log.errs[0] : "");
  await ctx.close();
}
await closeAll();
