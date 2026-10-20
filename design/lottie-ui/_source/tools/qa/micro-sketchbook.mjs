// piece 4 in Sketchbook: the XP pop, a card, the 2M2F tile, stills (frozen mid-way)
import { ctxFor, waitMap, sleep, closeAll, BASE, Q } from "./lib.mjs";
const { page, log } = await ctxFor(process.env.DEV || "desktop", { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2000);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 100; i++) { await sleep(400); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden)"))) break; }
await sleep(2500);
await page.evaluate(() => window.__scheme("sketch")); await sleep(4000);
const freeze = (t) => page.evaluate((t) => document.getAnimations().forEach((a) => { try { if (a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest(".czx, .czx-sparks, .map-card, .you")) { a.pause(); a.currentTime = t; } } catch (e) {} }), t);
await page.evaluate(() => { const to = document.querySelector(".topbar .you").getBoundingClientRect(); window.czMicro.xpFly({ left: innerWidth * 0.5, top: innerHeight * 0.45, width: 30, height: 30 }, to, 5, "#2f9e4f", "#fff"); const c = document.querySelector(".map-card"); c.classList.remove("in"); void c.offsetWidth; c.classList.add("in"); });
await freeze(260); await page.screenshot({ path: `${Q}/sk-xp1.png` });
await freeze(700); await page.screenshot({ path: `${Q}/sk-xp2.png` });
console.log("sketch:", await page.evaluate(() => document.body.classList.contains("scheme-sketch")), "errors:", log.errs);
await closeAll();
