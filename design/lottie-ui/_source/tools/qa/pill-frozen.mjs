// pill-stab: the pill in WebKit (iPhone 13): frozen at points along the open and the close (in the page, the moment
// its animations are made), a still each
import { ctxFor, waitMap, sleep, closeAll, BASE, Q } from "./lib.mjs";
const kind = process.env.DEV || "iphone";
const { page, ctx, log } = await ctxFor(kind, { consent: "yes2" });
await ctx.addInitScript(() => {
  const A = Element.prototype.animate;
  Element.prototype.animate = function (k, o) { const a = A.call(this, k, o); try { if (window.__freeze && o && (o.duration === 480 || o.duration === 420 || o.duration === 140)) { a.pause(); a.currentTime = (o.duration === 140 ? 140 : o.duration * window.__freeze); (window.__held = window.__held || []).push(a); } } catch (e) {} return a; };
});
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(3000);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 100; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2000);
const step = async (name, fr) => { await page.evaluate((fr) => (window.__held || []).forEach((a) => { const d = a.effect.getTiming().duration; if (d > 200) a.currentTime = d * fr; }), fr); await sleep(250); await page.screenshot({ path: `${Q}/wk-${name}-${fr}.png` }); };
await page.evaluate(() => { window.__freeze = 0.001; window.__held = []; document.querySelector(".map-card:not(.hidden) .mcd-open").click(); });
await sleep(150); await page.screenshot({ path: `${Q}/wk-open-wait.png` });
for (let i = 0; i < 300; i++) { if (await page.evaluate(() => document.querySelector(".case-frame").classList.contains("czpf-run"))) break; await sleep(50); }
for (const fr of [0.05, 0.15, 0.3, 0.5, 0.75]) await step("open", fr);
await page.evaluate(() => { (window.__held || []).forEach((a) => a.play()); window.__held = []; window.__freeze = 0; });
await sleep(1500); await page.screenshot({ path: `${Q}/wk-open-done.png` });
await page.evaluate(() => { window.__freeze = 0.001; window.__held = []; document.querySelector(".case-frame .cf-close").click(); });
for (let i = 0; i < 300; i++) { if (await page.evaluate(() => document.querySelector(".case-frame").classList.contains("czpf-run"))) break; await sleep(50); }
for (const fr of [0.3, 0.6, 0.9]) await step("close", fr);
await page.evaluate(() => { (window.__held || []).forEach((a) => a.play()); window.__held = []; window.__freeze = 0; });
await sleep(1500);
console.log("after:", await page.evaluate(() => ({ hidden: document.querySelector(".case-frame").classList.contains("hidden"), ring: document.querySelectorAll(".czpf").length, body: document.body.className.includes("czpf") })));
console.log("errors:", log.errs.slice(0, 3), "bad:", log.bad);
await closeAll();
