// piece 4: are the small moments the compositor's? The XP pop and a card landing, the main thread blocked 400 ms from
// 100 ms in; a screencast. DEV=pixel THR=4
import { ctxFor, waitMap, sleep, closeAll, BASE, cast, castMp4, Q } from "./lib.mjs";
const kind = process.env.DEV || "pixel";
const { page, ctx } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 120; i++) { await sleep(400); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden)"))) break; }
await sleep(3000);
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-close")?.click()); await sleep(1500);
if (process.env.THR) { const c = await ctx.newCDPSession(page); await c.send("Emulation.setCPUThrottlingRate", { rate: +process.env.THR }); }
const c = await cast(page, `${Q}/cast-mblk-${kind}`, { maxW: 600, maxH: 1300, q: 60 });
await sleep(400);
await page.evaluate(() => {
  const to = document.querySelector(".topbar .you").getBoundingClientRect();
  window.czMicro.xpFly({ left: innerWidth * 0.5, top: innerHeight * 0.42, width: 30, height: 30 }, to, 5, "#2f9e4f", "#fff");
  const k = document.querySelector(".map-card"); k.classList.remove("hidden"); k.classList.remove("in"); void k.offsetWidth; k.classList.add("in");
  setTimeout(() => { const t = performance.now(); while (performance.now() - t < 400); }, 100);
});
await sleep(2200);
const fr = await c.stop(); await castMp4(fr, `${Q}/mblk-${kind}.mp4`);
console.log("frames", fr.length);
await closeAll();
