// pill-stab: Escape, Back and an early Escape (while the ring waits) close the page cleanly; nothing left behind
import { ctxFor, waitMap, sleep, closeAll, BASE } from "./lib.mjs";
const kind = process.env.DEV || "pixel";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 80; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(1500);
const st = () => page.evaluate(() => { const f = document.querySelector(".case-frame"); return { hidden: f.classList.contains("hidden"), run: f.classList.contains("czpf-run"), ring: document.querySelectorAll(".czpf").length, anims: f.getAnimations({ subtree: true }).length, cover: !!f._czCover, body: [...document.body.classList].filter((c) => /czpf|scf-open/.test(c)).join(","), url: location.pathname + location.search }; });
const openIt = async () => { await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click()); for (let i = 0; i < 60; i++) { await sleep(100); const s = await st(); if (!s.hidden && !s.run && !s.ring && !s.anims) break; } await sleep(800); };
await openIt(); console.log("opened:", JSON.stringify(await st()));
await page.keyboard.press("Escape"); await sleep(1300); console.log("Escape:", JSON.stringify(await st()));
await openIt(); console.log("opened:", JSON.stringify(await st()));
await page.goBack(); await sleep(1300); console.log("Back:", JSON.stringify(await st()));
// an Escape while the ring still waits on the page
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click()); await sleep(60);
await page.keyboard.press("Escape"); await sleep(1000); console.log("early Escape:", JSON.stringify(await st()));
await openIt(); console.log("reopen:", JSON.stringify(await st()));
await page.evaluate(() => document.querySelector(".case-frame .cf-close").click()); await sleep(1300); console.log("x:", JSON.stringify(await st()));
console.log("errors:", log.errs, "bad:", log.bad);
await closeAll();
