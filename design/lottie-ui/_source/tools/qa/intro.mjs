// lottie-ui: the intro still plays as before (a first visit, fresh storage): time to the map, the player loaded once,
// czL there, console clean. DEV=desktop|iphone|pixel
import { ctxFor, waitMap, sleep, closeAll, BASE, shot } from "./lib.mjs";
const kind = process.env.DEV || "desktop";
const { page, log } = await ctxFor(kind, { ls: "fresh" });
const t0 = Date.now();
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
const ms = await waitMap(page, 90000);
await sleep(1500);
const s = await page.evaluate(() => ({ mode: window.__czIntro?.mode, done: window.__czIntro?.done, tm: window.__czIntro?.tm, players: [...document.scripts].filter((x) => /lottie-worker/.test(x.src)).length, czL: !!window.czL, czFinale: !!window.czFinale, cfg: Object.keys(window.__CZL_CFG?.j || {}) }));
console.log(kind, "map ready after", ms, "ms", JSON.stringify(s));
await shot(page, `intro-${kind}`);
console.log("errors:", log.errs, "bad:", log.bad);
await closeAll();
