// pill-stab: a frame-exact slow motion of the pill (Chromium): its real animations frozen and stepped, a still each,
// stitched at 30 fps. Open: the ring's wait, then the grow in 48 steps (480 ms: 1/3 speed at 30 fps... 48 frames = 1.6 s);
// close in 30 steps. DEV=desktop|pixel OUT=file.mp4
import { ctxFor, waitMap, sleep, closeAll, BASE, Q } from "./lib.mjs";
import fs from "fs";
import { execFileSync } from "child_process";
const kind = process.env.DEV || "pixel", FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const { page, ctx, log } = await ctxFor(kind, { consent: "yes2" });
await ctx.addInitScript(() => {
  const A = Element.prototype.animate;
  Element.prototype.animate = function (k, o) { const a = A.call(this, k, o); try { if (window.__freeze && o && (o.duration === 480 || o.duration === 300)) { a.pause(); a.currentTime = 0; (window.__held = window.__held || []).push(a); } } catch (e) {} return a; };
  const T = window.setTimeout; window.setTimeout = function (f, ms) { if (window.__freeze && ms === 2000) return 0; return T.apply(this, arguments); }; // (the close's safety net, while it is held)
});
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 100; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2000);
const dir = `${Q}/steps-${kind}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
let n = 0; const snap = async (k = 1) => { const f = `${dir}/s${String(n++).padStart(4, "0")}.png`; await page.screenshot({ path: f }); for (let i = 1; i < k; i++) fs.copyFileSync(f, `${dir}/s${String(n++).padStart(4, "0")}.png`); };
await snap(12);
await page.evaluate(() => { window.__freeze = 1; window.__held = []; document.querySelector(".map-card:not(.hidden) .mcd-open").click(); });
await sleep(200); await snap(10); // the ring on the button (the page loading)
for (let i = 0; i < 300; i++) { if (await page.evaluate(() => document.querySelector(".case-frame").classList.contains("czpf-run") && (window.__held || []).length > 5)) break; await sleep(30); }
const step = async (fr) => { await page.evaluate((fr) => (window.__held || []).forEach((a) => { a.currentTime = a.effect.getTiming().duration * fr; }), fr); await sleep(40); await snap(); };
for (let i = 0; i <= 48; i++) await step(i / 48);
await page.evaluate(() => { (window.__held || []).forEach((a) => a.play()); window.__held = []; window.__freeze = 0; });
await sleep(1200); await snap(15);
await page.evaluate(() => { window.__freeze = 1; window.__held = []; document.querySelector(".case-frame .cf-close").click(); });
for (let i = 0; i < 300; i++) { if (await page.evaluate(() => document.querySelector(".case-frame").classList.contains("czpf-run") && (window.__held || []).length > 5)) break; await sleep(30); }
for (let i = 0; i <= 30; i++) await step(i / 30);
await page.evaluate(() => { (window.__held || []).forEach((a) => a.play()); window.__held = []; window.__freeze = 0; });
await sleep(150); await snap(); await sleep(250); await snap(12);
const out = process.env.OUT || `${Q}/steps-${kind}.mp4`;
execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", "30", "-i", `${dir}/s%04d.png`, "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
fs.rmSync(dir, { recursive: true, force: true });
console.log(kind, n, "frames ->", out, "| state after:", JSON.stringify(await page.evaluate(() => ({ hidden: document.querySelector(".case-frame").classList.contains("hidden"), ring: document.querySelectorAll(".czpf").length }))), "errors:", log.errs.length);
await closeAll();
