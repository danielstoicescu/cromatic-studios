// pill-stab: is the pill the compositor's? the main thread is blocked 300 ms just after the grow starts (and after the
// shrink starts); a screencast meanwhile. DEV=desktop|pixel
import { ctxFor, waitMap, sleep, closeAll, BASE, cast, castMp4, Q } from "./lib.mjs";
const kind = process.env.DEV || "pixel";
const { page, ctx } = await ctxFor(kind, { consent: "yes2" });
await ctx.addInitScript(() => { const A = Element.prototype.animate; Element.prototype.animate = function (k, o) { const r = A.call(this, k, o); try { if (Array.isArray(k) && k.length > 10 && this.classList.contains("cf-w") && this.parentElement.classList.contains("case-frame")) setTimeout(() => { window.__blk = (window.__blk || 0) + 1; const t = performance.now(); while (performance.now() - t < 300); }, 60); } catch (e) {} return r; }; });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 80; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2000);
const c = await cast(page, `${Q}/cast-blk-${kind}`, { maxW: 600, maxH: 1200, q: 60 });
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click());
await sleep(+(process.env.MS || 2500));
await page.evaluate(() => document.querySelector(".case-frame .cf-close").click());
await sleep(1500);
const fr = await c.stop();
await castMp4(fr, `${Q}/blk-${kind}.mp4`);
console.log("blocks:", await page.evaluate(() => window.__blk), "frames", fr.length);
await closeAll();
