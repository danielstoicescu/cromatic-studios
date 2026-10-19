// lottie-ui piece 3: the map to the website and back, across a navigation (LOCAL): the map's "Normal website" closes
// into a pill on the paper, /site/ opens out of it; the website's "Take the 3D drive" closes into the pill, the map's
// loader takes it from there. Screencast (chromium) + timings. DEV=desktop|pixel
import { ctxFor, waitMap, sleep, closeAll, BASE, cast, castMp4, Q } from "./.x-lui-lib.mjs";
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "pill2";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2500);
const c = await cast(page, `${Q}/cast-${tag}-${kind}`);
const t0 = Date.now();
const sel = await page.evaluate(() => { const a = [...document.querySelectorAll("a.map-site, a.site-btn")].find((x) => x.getBoundingClientRect().width > 0); return a ? (a.classList.contains("map-site") ? "a.map-site" : "a.site-btn") : null; });
console.log("link:", sel);
await Promise.all([page.waitForURL(/\/(site|ro)\//, { timeout: 20000 }), page.evaluate((s) => [...document.querySelectorAll(s)].find((x) => x.getBoundingClientRect().width > 0).click(), sel)]);
const tNav = Date.now() - t0;
await page.waitForLoadState("domcontentloaded");
const arr = await page.evaluate(() => ({ overlay: !!document.querySelector(".czpt-arrive"), flag: sessionStorage.getItem("cz-pt") }));
console.log("navigated in", tNav, "ms; arrival overlay:", JSON.stringify(arr));
await sleep(2500);
console.log("overlay gone:", await page.evaluate(() => !document.querySelector(".czpt")));
// and back: the website's link to the map
const t1 = Date.now();
await Promise.all([page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 20000 }), page.evaluate(() => document.querySelector('a[href="/"]').click())]);
console.log("back to the map in", Date.now() - t1, "ms; loader:", await page.evaluate(() => window.__czIntro?.mode));
await waitMap(page); await sleep(1500);
const fr = await c.stop(); console.log("cast frames", fr.length); await castMp4(fr, `${Q}/${tag}-${kind}.mp4`);
console.log("errors:", log.errs, "bad:", log.bad);
await closeAll();
