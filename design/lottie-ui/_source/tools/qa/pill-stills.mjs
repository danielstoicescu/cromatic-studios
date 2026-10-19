// lottie-ui piece 3: stills for the previews: the map with a place's card, that place's case page open, the website's
// first fold. DEV=desktop|pixel -> design/lottie-ui/_source/tools/bg/{pt-map,pt-case,pt-site}-<ab>.jpg
import { ctxFor, waitMap, sleep, closeAll, BASE } from "./.x-lui-lib.mjs";
const kind = process.env.DEV || "desktop", ab = kind === "desktop" ? "desktop" : "phone", OUT = "/Users/daniel.stoic/cromatic-lottie-ui/design/lottie-ui/_source/tools/bg";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
const snap = (n) => page.screenshot({ path: `${OUT}/${n}-${ab}.jpg`, type: "jpeg", quality: 84 });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2000);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 60; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2500); await snap("pt-map");
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click());
for (let i = 0; i < 40; i++) { await sleep(250); if (await page.evaluate(() => { const f = document.querySelector(".case-frame"); return !f.classList.contains("hidden") && !document.querySelector(".czl-window"); })) break; }
await sleep(3500); await snap("pt-case");
await page.goto(BASE + "/site/", { waitUntil: "load" }); await sleep(2500); await snap("pt-site");
console.log("ok", log.errs);
await closeAll();
