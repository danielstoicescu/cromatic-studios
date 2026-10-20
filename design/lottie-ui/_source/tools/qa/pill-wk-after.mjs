// pill-stab: WebKit, after a pill open: main-thread fps by window, and the case page's own rAF fps (inside the iframe).
// OFF=1: the layer off (the page opens as on live). (r235b: WebKit stayed at ~12 fps for as long as the page was open
// when the box holding the iframe had been animated; the iframe and its buttons are moved instead)
import { ctxFor, waitMap, sleep, closeAll, BASE } from "./lib.mjs";
const kind = process.env.DEV || "iphone";
const { page, ctx, log } = await ctxFor(kind, { consent: "yes2" });
if (process.env.OFF) await ctx.addInitScript(() => { window.__czL = false; });
await ctx.addInitScript(() => { window.__fr = []; const l = (t) => { window.__fr.push(t); requestAnimationFrame(l); }; requestAnimationFrame(l); });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(3000);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 100; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2500);
const t0 = await page.evaluate(() => { const t = performance.now(); document.querySelector(".map-card:not(.hidden) .mcd-open").click(); return t; });
await sleep(1500);
// the case page's own frames, from 1.5 s to 3.5 s
await page.evaluate(() => { try { const w = document.querySelector(".case-frame iframe").contentWindow; w.__fr = []; const l = (t) => { w.__fr.push(t); w.requestAnimationFrame(l); }; w.requestAnimationFrame(l); } catch (e) {} });
await sleep(4500);
const r = await page.evaluate((t0) => { const fps = (a, b) => window.__fr.filter((t) => t - t0 >= a && t - t0 < b).length / ((b - a) / 1000); let inner = null; try { const w = document.querySelector(".case-frame iframe").contentWindow; inner = Math.round(w.__fr.length / 4.5 * 10) / 10; } catch (e) {} return { "0-0.7s": fps(0, 700), "0.7-1.5s": fps(700, 1500), "1.5-3s": fps(1500, 3000), "3-6s": fps(3000, 6000), pageRaf: inner, city: window.__perfLab.info().frame }; }, t0);
console.log(process.env.OFF ? "OFF" : "ON ", JSON.stringify(r));
await closeAll();
