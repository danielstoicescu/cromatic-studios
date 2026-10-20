// pill-stab: record a case page opened from a place card and closed again (x), the real flow, as an MP4 (chromium
// screencast). NET=1: 150 ms RTT, 4 Mbps (about beta); THR=4 CPU. DEV=desktop|pixel OUT=path PLACE=steam
// (slow motion: pill-steps.mjs; a screencast stalls under a slowed timeline)
import { ctxFor, waitMap, sleep, closeAll, BASE, cast, castMp4, Q, throttle } from "./lib.mjs";
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "rec";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2500);
const cdp = await page.context().newCDPSession(page);
if (process.env.NET) { await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 4e6 / 8, uploadThroughput: 1e6 / 8 }); }
if (process.env.THR) await cdp.send("Emulation.setCPUThrottlingRate", { rate: +process.env.THR });
await page.evaluate((p) => window.__mapGo(p), process.env.PLACE || "steam");
for (let i = 0; i < 120; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2500);
const c = await cast(page, `${Q}/cast-${tag}-${kind}`, { q: 72, maxW: kind === "desktop" ? 1440 : 824, maxH: kind === "desktop" ? 900 : 1830 });
await sleep(400);
const t0 = Date.now();
await page.evaluate(() => { window.__tc = performance.now(); document.querySelector(".map-card:not(.hidden) .mcd-open").click(); });
// open done: the frame visible, no clip, no window canvas, no animation of ours
for (let i = 0; i < 120; i++) { await sleep(50); if (await page.evaluate(() => { const f = document.querySelector(".case-frame"); return !f.classList.contains("hidden") && !f.style.clipPath && f.style.visibility !== "hidden" && !document.querySelector(".czl-window, .czpf") && !f.getAnimations().length; })) break; }
const tOpen = Date.now() - t0;
await sleep(1600);
const t1 = Date.now();
await page.evaluate(() => document.querySelector(".case-frame .cf-close").click());
for (let i = 0; i < 80; i++) { await sleep(40); if (await page.evaluate(() => document.querySelector(".case-frame").classList.contains("hidden") && !document.querySelector(".czl-window, .czpf"))) break; }
const tClose = Date.now() - t1;
await sleep(1200);
const fr = await c.stop();
const out = process.env.OUT || `${Q}/${tag}-${kind}.mp4`;
await castMp4(fr, out);
console.log(`${kind}: open settled ${tOpen} ms after the click (incl. the laptop's parking shot), close ${tClose} ms; ${fr.length} frames -> ${out}`);
console.log("errors:", log.errs.slice(0, 4), "bad:", log.bad.slice(0, 4));
await closeAll();
