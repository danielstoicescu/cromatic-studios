// node record.mjs <scenario> <out.mp4>   scenarios: desktop | phone | sketch | rm
// A real-time screencast (Chromium/CDP) of the welcome card: its opening (from the intro's last beat), its explainers,
// hover / focus / taps, and its fold. A drawn cursor (and a touch dot on the phone) is added for the video only.
import { ctxFor, closeAll, sleep, cast, castMp4, W, BASE } from "./welcome-lib.mjs";
const [sc = "desktop", out = W + "/shots/rec.mp4"] = process.argv.slice(2);
const phone = sc === "phone";
const kind = phone ? "iphoneC" : "desktop";
const extra = sc === "rm" ? { reducedMotion: "reduce" } : {};
const ls = { "cz-consent": "no" };
if (sc !== "desktop") ls["cz-intro-at"] = String(Date.now());
const { page, log } = await ctxFor(kind, { ls, extra });
await page.addInitScript((phone) => {
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText = "position:fixed;left:0;top:0;z-index:99999;pointer-events:none;width:22px;height:22px;translate:-200px -200px;transition:scale .12s";
    c.innerHTML = phone ? '<i style="display:block;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(20,20,20,.22);border:2px solid rgba(255,255,255,.9);box-shadow:0 1px 4px rgba(0,0,0,.3);opacity:0;transition:opacity .15s"></i>' : '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l14 9-6.2 1.3L14 19l-2.6 1.2-3.1-6.7L3 18z" fill="#fff" stroke="#141414" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c); window.__cur = c;
    addEventListener(phone ? "pointerdown" : "mousemove", (e) => { c.style.translate = e.clientX + "px " + e.clientY + "px"; if (phone) { const i = c.firstChild; i.style.opacity = 1; setTimeout(() => (i.style.opacity = 0), 260); } }, true);
  });
}, phone);
if (sc === "desktop") await page.goto(BASE + "/?intro"); else await page.goto(BASE + "/?map");
const vp = page.viewportSize();
// start: the intro's last beat (its hold, before the pill opens onto the map)
let t0 = null;
if (sc === "desktop") {
  await page.waitForFunction(() => window.__czIntro && window.__czIntro.player && window.__czIntro.phase() !== "load", null, { timeout: 90000 });
}
const c = await cast(page, W + "/rec-" + process.pid, { maxW: vp.width * (phone ? 2 : 1), maxH: vp.height * (phone ? 2 : 1), q: 80 });
if (sc === "desktop") { await page.waitForFunction(() => ["hold", "handoff", "end", "fade"].includes(window.__czIntro.phase()), null, { timeout: 90000, polling: 50 }); t0 = Date.now() / 1000 - 2.6; }
const box = async (sel) => { const b = await (await page.$(sel)).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const glide = async (sel, steps = 18) => { const [x, y] = await box(sel); await page.mouse.move(x, y, { steps }); };
const tap = async (sel) => { const [x, y] = await box(sel); await page.touchscreen.tap(x, y); };
if (sc === "sketch") {
  await page.waitForSelector(".map-welcome:not(.hidden)", { timeout: 90000 });
  await page.evaluate(() => window.__welcome(false)); await sleep(400);
  await page.evaluate(() => window.__scheme("sketch")); await sleep(3500);
  t0 = Date.now() / 1000 - 0.4;
  await page.evaluate(() => window.__welcome(true));
} else await page.waitForSelector(".map-welcome:not(.hidden)", { timeout: 90000 });
if (sc === "phone") t0 = Date.now() / 1000 - 3.2;
if (sc === "rm") t0 = Date.now() / 1000 - 2.5;
await sleep(phone ? 5600 : 5200);
if (sc === "desktop" || sc === "sketch" || sc === "rm") {
  await page.mouse.move(vp.width * 0.8, vp.height * 0.85);
  for (const n of [1, 2, 3, 4]) { await glide(`.map-welcome .mw-how > span:nth-of-type(${n}) i`); await sleep(sc === "desktop" ? 2700 : 1600); }
  await glide('.map-welcome [data-go="end"]'); await sleep(sc === "desktop" ? 2200 : 1400);
  await glide('.map-welcome [data-go="tm"]'); await sleep(sc === "desktop" ? 2200 : 1400);
  if (sc === "desktop") {
    // the keyboard: from the × through the streets to "Drive it yourself" (its explainer loops while it has the focus)
    await page.mouse.move(vp.width * 0.86, vp.height * 0.5, { steps: 12 }); await sleep(400);
    await page.evaluate(() => document.querySelector(".map-welcome .mw-x").focus());
    for (let i = 0; i < 5; i++) { await page.keyboard.press("Tab"); await sleep(380); }
    await sleep(2400);
    await page.keyboard.press("Shift+Tab"); await sleep(1200);
  }
  await glide(".map-welcome .mw-x"); await sleep(500);
  await page.mouse.down(); await page.mouse.up();
  await sleep(1800);
} else {
  await tap(".map-welcome .mw-how > span:nth-of-type(3) i"); await sleep(2400);
  await tap(".map-welcome .mw-how > span:nth-of-type(4) i"); await sleep(2600);
  await tap(".map-welcome .mw-go"); await sleep(2600);
}
const fr = (await c.stop()).filter((f) => t0 == null || f.t >= t0);
console.log("frames", fr.length, "span", (fr.at(-1).t - fr[0].t).toFixed(1));
await castMp4(fr, out, 60, { crf: phone ? 27 : 28, w: phone ? 584 : 1280 });
console.log(JSON.stringify(log));
await closeAll();
