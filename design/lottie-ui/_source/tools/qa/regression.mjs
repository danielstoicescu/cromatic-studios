// lottie-ui: quick regression on the map (LOCAL): a place card opens and closes, the game opens in its frame and
// closes, Go deeper opens a case page in the frame and closes; console clean. DEV=desktop|iphone|pixel
import { ctxFor, waitMap, sleep, closeAll, BASE, shot, gameFrame, vis } from "./lib.mjs";
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "reg";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2000);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 60; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden)"))) break; }
await sleep(1200);
const card = await page.evaluate(() => { const c = document.querySelector(".map-card:not(.hidden)"); return c ? { t: c.querySelector(".mcd-title")?.textContent, open: !!c.querySelector(".mcd-open") } : null; });
console.log("card:", JSON.stringify(card)); await shot(page, `${tag}-${kind}-card`);
if (card?.open) {
  await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click());
  for (let i = 0; i < 40; i++) { await sleep(250); if (await page.evaluate(() => !!document.querySelector(".case-frame:not(.hidden) iframe")?.contentDocument?.querySelector("main, article, body > *"))) break; }
  await sleep(1500); await shot(page, `${tag}-${kind}-case`);
  console.log("case frame:", await page.evaluate(() => { const f = document.querySelector(".case-frame:not(.hidden)"); return f ? f.querySelector("iframe").src.replace(location.origin, "") : null; }));
  await page.evaluate(() => document.querySelector(".case-frame .cf-close").click()); await sleep(1200);
  console.log("closed:", await page.evaluate(() => document.querySelector(".case-frame").classList.contains("hidden")));
}
await page.evaluate(() => window.__openGloves("qa")); const gf = await gameFrame(page, 30000);
console.log("game:", !!gf); await sleep(1500); await shot(page, `${tag}-${kind}-game`);
if (gf) { await gf.evaluate(() => window.parent.postMessage({ cz: "gloves-close" }, location.origin)); await sleep(1200); }
console.log("game closed:", await page.evaluate(() => document.querySelector(".case-frame").classList.contains("hidden")));
console.log("errors:", log.errs, "bad:", log.bad);
await closeAll();
