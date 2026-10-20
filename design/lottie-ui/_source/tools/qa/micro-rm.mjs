// piece 4 with reduced motion: an arrival (+5 XP, its card), the 2M2F tile, Nearby: which animations run
import { ctxFor, waitMap, sleep, closeAll, BASE } from "./lib.mjs";
const kind = process.env.DEV || "desktop";
const { page, log } = await ctxFor(kind, { consent: "yes2", extra: { reducedMotion: "reduce" } });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
await page.evaluate(() => { window.__an = new Set(); const t = setInterval(() => document.getAnimations().forEach((a) => window.__an.add((a.animationName || "waapi") + ":" + ((a.effect && a.effect.target && a.effect.target.className) + "").slice(0, 22) + ":" + JSON.stringify((a.effect.getKeyframes ? a.effect.getKeyframes() : []).map((k) => Object.keys(k).filter((x) => !/offset|easing|composite|computedOffset/.test(x)).join("+"))).slice(0, 40))), 40); });
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 120; i++) { await sleep(400); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden)"))) break; }
await sleep(2500);
const b = await page.$(".map-top .map-2m2f"); if (b && (await b.boundingBox())) { const r = await b.boundingBox(); await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await sleep(600); }
console.log(kind, "reduced motion, animations seen:", JSON.stringify([...(await page.evaluate(() => [...window.__an]))].filter((x) => !/^(grain|spin|mbSpin|dpLive)/.test(x))));
console.log("errors:", log.errs);
await closeAll();
