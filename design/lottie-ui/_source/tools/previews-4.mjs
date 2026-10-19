// lottie-ui piece 4: the preview of the small moments, from the real map, in slow motion (CDP Animation.setPlaybackRate:
// the page's CSS and Web Animations at RATE, screenshots as fast as they come, the video sped back up), with the camera
// at rest (nothing on a JS clock in shot): +25 XP off a real pin and the bar taking it, a place card landing and leaving,
// the 2M2F jab and gleam, Nearby's chips coming in. DEV=desktop|pixel OUT=file.mp4
import { ctxFor, waitMap, sleep, closeAll, BASE, Q } from "./.x-lui-lib.mjs";
import fs from "fs";
import { execFileSync } from "child_process";
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "micro3", RATE = 0.06, phone = kind !== "desktop";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2500);
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 120; i++) { await sleep(250); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden)"))) break; }
await sleep(3000);
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-close")?.click()); await sleep(2500);
const cdp = await page.context().newCDPSession(page);
await cdp.send("Animation.enable"); await cdp.send("Animation.setPlaybackRate", { playbackRate: RATE });
await page.evaluate((r) => { window.__czxRate = r; }, RATE);
const dir = `${Q}/cast-${tag}-${kind}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
let rec = true, n = 0; const frs = [];
const loop = (async () => { while (rec) { const t = Date.now() / 1000, file = `${dir}/f${String(n++).padStart(5, "0")}.jpg`; try { await page.screenshot({ path: file, type: "jpeg", quality: 74, scale: "css" }); frs.push({ t, file }); } catch (e) {} } })();
const S = (ms) => sleep(ms / RATE);
await S(300);
// +25 XP off the pin of the place we are at (Steam), to the bar
await page.evaluate(() => {
  const to = document.querySelector(".topbar .you").getBoundingClientRect();
  const pins = [...document.querySelectorAll(".map-pins .map-pin, .map-pins [class*='pin']")].filter((e) => /Steam/.test(e.textContent || "") && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().top > 60);
  const p = pins.sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0];
  const fr = p ? p.getBoundingClientRect() : { left: innerWidth * 0.5, top: innerHeight * 0.42, width: 30, height: 30 };
  window.czMicro.xpFly(fr, to, 25, "#2f9e4f", "#ffffff");
});
await S(1550);
// the card lands (its own content, back), stays, leaves
await page.evaluate(() => { const c = document.querySelector(".map-card"); c.classList.remove("in"); void c.offsetWidth; c.classList.remove("hidden"); c.classList.add("in"); });
await S(1300);
await page.evaluate(() => document.querySelector(".map-card").classList.add("hidden"));
await S(450);
if (!phone) {
  // Nearby's chips, as a new list comes in
  await page.evaluate(() => { let k = 0; document.querySelectorAll(".nav2-ui .n2-strip > .n2-pc").forEach((c) => { c.classList.remove("czx-new"); void c.offsetWidth; c.style.animationDelay = (k++ * 0.05) + "s"; c.classList.add("czx-new"); }); });
  await S(800);
  const b = await page.$(".map-top .map-2m2f");
  if (b && (await b.boundingBox())) { const r = await b.boundingBox(); await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await S(550); await page.mouse.move(10, 500); }
  // and its gleam, once
  await page.evaluate(() => { const b = document.querySelector(".map-top .map-2m2f"); b.style.setProperty("--x", "1"); const a = b.getAnimations({ pseudoElement: "::after" }); });
  await page.addStyleTag({ content: ".map-top .map-2m2f::after { animation: cz2m2fGleam 1.6s ease-in-out 0s 1 both !important; }" });
  await S(1400);
}
rec = false; await loop;
const fr = frs.filter((f) => fs.existsSync(f.file)).sort((a, b) => a.t - b.t);
const list = fr.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((fr[i + 1]?.t ?? f.t + 0.05) - f.t) * RATE).toFixed(4)}`).join("\n") + `\nfile '${fr.at(-1).file}'`;
const lf = `${dir}/list.txt`; fs.writeFileSync(lf, list);
const out = process.env.OUT || `${Q}/${tag}-${kind}.mp4`;
execFileSync(FF, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lf, "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-r", "60", "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
fs.rmSync(dir, { recursive: true, force: true });
console.log("frames", fr.length, "over", ((fr.at(-1).t - fr[0].t) * RATE).toFixed(2), "s at real speed ->", out);
console.log("errors:", log.errs, "bad:", log.bad);
await closeAll();
