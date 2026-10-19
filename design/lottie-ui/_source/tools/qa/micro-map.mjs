// lottie-ui piece 4: the small moments on the real map (LOCAL): a place reached (+5 XP off its pin, the bar takes it,
// its card lands), the card closed (it leaves), the 2M2F button (the gleam, the jab on hover), Nearby's chips.
// Screencast (chromium), console. DEV=desktop|pixel  THR=4
import { ctxFor, waitMap, sleep, closeAll, BASE, cast, castMp4, Q, throttle } from "./.x-lui-lib.mjs";
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "micro1";
const { page, log } = await ctxFor(kind, { consent: "yes2", extra: process.env.RM ? { reducedMotion: "reduce" } : {} });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2500);
if (process.env.THR) await throttle(page, +process.env.THR);
const c = await cast(page, `${Q}/cast-${tag}-${kind}`);
await page.evaluate(() => window.__mapGo("oma"));
let xp = 0;
for (let i = 0; i < 80; i++) { await sleep(150); const s = await page.evaluate(() => ({ x: document.querySelectorAll(".czx").length, card: !!document.querySelector(".map-card.in:not(.hidden)") })); if (s.x) xp++; if (s.card && i > 10 && xp) break; }
console.log("xp pop seen:", xp > 0, "old pill:", await page.evaluate(() => document.querySelectorAll(".xp-fly").length));
await sleep(2200);
console.log("card anims:", await page.evaluate(() => [...new Set(document.querySelector(".map-card").getAnimations({ subtree: true }).map((a) => a.animationName || "waapi"))].join(",") || "(done)"));
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-close")?.click());
await sleep(600);
const b = await page.$(".map-top .map-2m2f");
if (b && (await b.boundingBox())) { const r = await b.boundingBox(); await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await sleep(700); await page.mouse.move(10, 400); console.log("2M2F hovered"); }
const n2 = await page.evaluate(() => ({ chips: document.querySelectorAll(".nav2-ui .n2-strip > .n2-pc").length, anim: document.querySelector(".nav2-ui .n2-strip > .n2-pc") ? getComputedStyle(document.querySelector(".nav2-ui .n2-strip > .n2-pc")).animationName : "-" }));
console.log("nearby:", JSON.stringify(n2));
await page.evaluate(() => window.__mapGo("tm")); await sleep(5000);
const fr = await c.stop(); console.log("cast", fr.length); await castMp4(fr, `${Q}/${tag}-${kind}.mp4`);
console.log("errors:", log.errs, "bad:", log.bad);
await closeAll();
