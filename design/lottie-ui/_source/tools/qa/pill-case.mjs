// lottie-ui piece 3: a case page from a place card opens as a pill window and closes back into it (LOCAL). Records a
// screencast (chromium) or stills (webkit). DEV=desktop|pixel|iphone
import { ctxFor, waitMap, sleep, closeAll, BASE, shot, cast, castMp4, Q, throttle } from "./.x-lui-lib.mjs";
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "pill1", wk = kind === "iphone";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2000);
if (process.env.THR) await throttle(page, +process.env.THR);
await page.evaluate((p) => window.__mapGo(p), process.env.PLACE || "steam");
for (let i = 0; i < 60; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(1500);
const c = wk ? null : await cast(page, `${Q}/cast-${tag}-${kind}`);
const t0 = Date.now();
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click());
if (wk) for (let i = 0; i < 10; i++) { await shot(page, `${tag}-${kind}-open-${i}`); }
for (let i = 0; i < 40; i++) { await sleep(100); if (await page.evaluate(() => { const f = document.querySelector(".case-frame"); return !f.classList.contains("hidden") && !f.style.clipPath && !f.getAnimations().length; })) break; }
console.log("open done after", Date.now() - t0, "ms", await page.evaluate(() => ({ url: document.querySelector(".case-frame iframe").src.replace(location.origin, ""), layers: document.querySelectorAll(".czp-l").length })));
await sleep(1800);
const t1 = Date.now();
await page.evaluate(() => document.querySelector(".case-frame .cf-close").click());
if (wk) for (let i = 0; i < 8; i++) { await shot(page, `${tag}-${kind}-close-${i}`); }
for (let i = 0; i < 30; i++) { await sleep(60); if (await page.evaluate(() => document.querySelector(".case-frame").classList.contains("hidden"))) break; }
console.log("closed after", Date.now() - t1, "ms", await page.evaluate(() => ({ hidden: document.querySelector(".case-frame").classList.contains("hidden"), layers: document.querySelectorAll(".czp-l").length, scf: document.body.classList.contains("scf-open"), card: !!document.querySelector(".map-card:not(.hidden)") })));
await sleep(800);
// Escape closes it too, and the game still opens and closes as before
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open")?.click()); await sleep(1500);
await page.keyboard.press("Escape"); await sleep(900);
console.log("escape:", await page.evaluate(() => document.querySelector(".case-frame").classList.contains("hidden")));
if (c) { const fr = await c.stop(); console.log("cast frames", fr.length, "over", (fr.at(-1).t - fr[0].t).toFixed(2), "s"); await castMp4(fr, `${Q}/${tag}-${kind}.mp4`); }
console.log("errors:", log.errs, "bad:", log.bad);
await closeAll();
