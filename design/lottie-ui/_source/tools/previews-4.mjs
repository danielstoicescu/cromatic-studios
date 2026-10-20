// piece 4: one MP4 per small moment, frame-exact: the page's CSS and Web Animations at RATE (CDP), screenshots back to
// back, retimed to real speed (and a quarter speed copy with SLOW=1). The city is held still meanwhile (its loop would
// run at full speed and look sped up). CLIP=xp|card|2m2f|nearby|gloves  DEV=desktop|pixel  SKETCH=1  OUT=dir
import { ctxFor, waitMap, sleep, closeAll, BASE, Q } from "./qa/lib.mjs";
import fs from "fs";
import { execFileSync } from "child_process";
const kind = process.env.DEV || "desktop", clip = process.env.CLIP || "xp", RATE = 0.06, sketch = !!process.env.SKETCH;
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const OUT = process.env.OUT || Q, name = `${clip}${sketch ? "-sketchbook" : ""}-${kind === "desktop" ? "desktop" : "phone"}`;
const { page, ctx, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
await page.evaluate((p) => window.__mapGo(p), clip === "gloves" ? "tm" : "steam");
for (let i = 0; i < 150; i++) { await sleep(400); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden)"))) break; }
await sleep(3000);
if (sketch) { await page.evaluate(() => window.__scheme("sketch")); await sleep(5000); }
if (clip !== "card") { await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-close")?.click()); await sleep(1500); }
// the city held still; the page's animations slowed
await page.evaluate(() => { if (window.czFinale) window.czFinale.hold = () => true; });
const cdp = await ctx.newCDPSession(page);
await cdp.send("Animation.enable"); await cdp.send("Animation.setPlaybackRate", { playbackRate: RATE });
await page.evaluate((r) => { window.__czxRate = r; }, RATE);
const dir = `${Q}/rec-${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
let on = true, n = 0; const frs = [];
const clipRect = kind === "desktop" ? null : null;
const loop = (async () => { while (on) { const t = Date.now() / 1000, f = `${dir}/f${String(n++).padStart(5, "0")}.jpg`; try { await page.screenshot({ path: f, type: "jpeg", quality: 82, scale: "css" }); frs.push({ t, f }); } catch (e) {} } })();
const S = (ms) => sleep(ms / RATE);
await S(250);
if (clip === "xp") {
  await page.evaluate(() => {
    const to = document.querySelector(".topbar .you").getBoundingClientRect();
    const pin = [...document.querySelectorAll(".map-pin")].find((e) => /Craft Coffee/.test(e.textContent || "") && e.getBoundingClientRect().width > 0) || [...document.querySelectorAll(".map-pin")].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top > 120 && r.top < innerHeight - 200; });
    const r = pin ? pin.getBoundingClientRect() : { left: innerWidth * 0.5, top: innerHeight * 0.45, width: 30, height: 30 };
    window.czMicro.xpFly(r, to, 5, "#119BFE", "#ffffff");
  });
  await S(1500);
} else if (clip === "card") {
  await page.evaluate(() => { const k = document.querySelector(".map-card"); k.classList.add("hidden"); });
  await S(400);
  await page.evaluate(() => { const k = document.querySelector(".map-card"); k.classList.remove("in"); void k.offsetWidth; k.classList.remove("hidden"); k.classList.add("in"); });
  await S(1500);
  await page.evaluate(() => document.querySelector(".map-card").classList.add("hidden"));
  await S(500);
} else if (clip === "2m2f") {
  // the gleam once (it plays three times after the map opens, then rests), then the pointer onto the tile
  await page.addStyleTag({ content: "html.czx-on .map-top .map-2m2f::after { animation: cz2m2fGleam 2.2s ease-in-out 0s 1 both !important; }" });
  await S(2000);
  const b = await page.$(".map-top .map-2m2f"); const r = await b.boundingBox();
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await S(700);
  await page.mouse.move(10, 500); await S(300);
} else if (clip === "gloves") {
  const b = await page.$('.nav2-ui .n2-pc[data-id="gloves"]'); const r = b && (await b.boundingBox());
  if (r) { await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await S(700); await page.mouse.move(10, 500); await S(300); } else console.log("no 2M2F card in Nearby");
} else if (clip === "nearby") {
  // the list's places dealt in, as a new list comes in (the same CSS a new list gets)
  await page.evaluate(() => { const cs = [...document.querySelectorAll(".nav2-ui .n2-strip > .n2-pc")]; cs.forEach((c) => { c.classList.remove("czx-new"); c.style.opacity = "0"; }); });
  await S(200);
  await page.evaluate(() => { const cs = [...document.querySelectorAll(".nav2-ui .n2-strip > .n2-pc")]; cs.forEach((c, k) => { void c.offsetWidth; c.style.opacity = ""; c.style.animationDelay = (Math.min(k, 6) * 0.055).toFixed(3) + "s"; c.classList.add("czx-new"); }); });
  await S(1100);
}
on = false; await loop;
const fr = frs.filter((x) => fs.existsSync(x.f)).sort((a, b) => a.t - b.t);
const enc = (k, out) => { const list = fr.map((x, i) => `file '${x.f}'\nduration ${Math.max(0.001, ((fr[i + 1]?.t ?? x.t + 0.05) - x.t) * RATE * k).toFixed(4)}`).join("\n") + `\nfile '${fr.at(-1).f}'`; fs.writeFileSync(`${dir}/list.txt`, list); execFileSync(FF, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", `${dir}/list.txt`, "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-r", "60", "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]); };
enc(1, `${OUT}/${name}.mp4`);
if (process.env.SLOW) enc(4, `${OUT}/${name}-quarter-speed.mp4`);
fs.rmSync(dir, { recursive: true, force: true });
console.log(name, fr.length, "frames,", ((fr.at(-1).t - fr[0].t) * RATE).toFixed(2), "s at real speed", log.errs.length ? log.errs : "");
await closeAll();
