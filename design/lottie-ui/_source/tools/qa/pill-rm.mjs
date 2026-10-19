// lottie-ui piece 3 with reduced motion: a case page opens and closes at once (no window), the map to the website has
// no paper, the website arrives with none (LOCAL)
import { ctxFor, waitMap, sleep, closeAll, BASE } from "./lib.mjs";
const { page, log } = await ctxFor(process.env.DEV || "desktop", { consent: "yes2", extra: { reducedMotion: "reduce" } });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(1500);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 60; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(800);
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click());
for (let i = 0; i < 30; i++) { await sleep(200); if (await page.evaluate(() => !document.querySelector(".case-frame").classList.contains("hidden"))) break; }
console.log("open:", await page.evaluate(() => ({ pill: !!document.querySelector(".czpf"), vis: document.querySelector(".case-frame").style.visibility })));
await page.evaluate(() => document.querySelector(".case-frame .cf-close").click()); await sleep(100);
console.log("closed at once:", await page.evaluate(() => document.querySelector(".case-frame").classList.contains("hidden")));
await Promise.all([page.waitForURL(/\/site\//), page.evaluate(() => [...document.querySelectorAll("a.map-site")].find((x) => x.getBoundingClientRect().width > 0).click())]);
console.log("site: overlay", await page.evaluate(() => !!document.querySelector(".czpt")));
console.log("errors:", log.errs, "bad:", log.bad); await closeAll();
