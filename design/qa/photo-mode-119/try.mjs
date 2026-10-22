// TASK-119: photo mode, driven (LOCAL ONLY). BASE=http://localhost:8997 OUT=dir KIND=desktop|phone node try.mjs [steps.json]
// Opens /?map&photo, enters photo mode, runs the steps (orbit drags, wheel, keys, world and format picks, shots) and
// saves screenshots and the photos it makes (the PNG the sheet shows). VIDEO=1 records the session (WebM).
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const { BASE, OUT, KIND = "desktop", VIDEO } = process.env; fs.mkdirSync(OUT, { recursive: true });
const steps = JSON.parse(process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : "[]");
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const o = KIND === "phone" ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
if (VIDEO) o.recordVideo = { dir: OUT, size: KIND === "phone" ? { width: 390, height: 844 } : { width: 1280, height: 800 } };
const ctx = await br.newContext(o);
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} });
const p = await ctx.newPage(), errs = [];
p.on("pageerror", (e) => errs.push("pageerror " + e.message)); p.on("console", (m) => { if (m.type() === "error" || /\[photo\]/.test(m.text())) errs.push(m.type() + " " + m.text().slice(0, 240)); });
await p.goto(BASE + "/?map&photo", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(3500);
let n = 0;
const shot = async (name) => p.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-${name}.png` });
for (const s of steps) {
  if (s.go) { await p.evaluate((id) => window.__mapGo?.(id), s.go); await p.waitForTimeout(s.wait || 9000); }
  if (s.enter) { const b = await p.$(".map-photo"); if (b) await b.click(); else await p.keyboard.press("p"); await p.waitForTimeout(1600); }
  if (s.drag) { const [x0, y0, x1, y1, ms = 600] = s.drag; await p.mouse.move(x0, y0); await p.mouse.down(); const k = 18; for (let i = 1; i <= k; i++) { await p.mouse.move(x0 + ((x1 - x0) * i) / k, y0 + ((y1 - y0) * i) / k); await p.waitForTimeout(ms / k); } await p.mouse.up(); await p.waitForTimeout(s.wait || 900); }
  if (s.wheel) { await p.mouse.move(720, 450); for (let i = 0; i < (s.n || 4); i++) { await p.mouse.wheel(0, s.wheel); await p.waitForTimeout(60); } await p.waitForTimeout(s.wait || 700); }
  if (s.key) { for (let i = 0; i < (s.n || 1); i++) await p.keyboard.press(s.key); await p.waitForTimeout(s.wait || 500); }
  if (s.hold) { await p.keyboard.down(s.hold); await p.waitForTimeout(s.ms || 600); await p.keyboard.up(s.hold); await p.waitForTimeout(s.wait || 600); }
  if (s.format) { await p.click(`.pm-chip[data-f="${s.format}"]`); await p.waitForTimeout(s.wait || 600); }
  if (s.world) { await p.click('.pm-tab[data-tab="world"]'); await p.click(`.pm-world:has-text("${s.world}")`); await p.waitForTimeout(s.wait || 2500); await p.click('.pm-tab[data-tab="cam"]'); }
  if (s.slider) { await p.evaluate(([k, v]) => { const i = document.querySelector(`.pm-sl input[data-k="${k}"]`); i.value = String(v); i.dispatchEvent(new Event("input", { bubbles: true })); }, s.slider); await p.waitForTimeout(s.wait || 1200); }
  if (s.clean != null) { await p.keyboard.press("h"); await p.waitForTimeout(600); }
  if (s.screen) await shot(s.screen);
  if (s.take) {
    await p.click(".pm-shutter"); await p.waitForSelector(".pm-sheet:not([hidden]) img[src^='blob:']", { timeout: 60000 }); await p.waitForTimeout(800);
    if (s.sheet) await shot(s.take + "-sheet");
    const b64 = await p.evaluate(async () => { const r = await fetch(document.querySelector(".pm-sheet img").src); const b = await r.blob(); return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(",")[1]); fr.readAsDataURL(b); }); });
    fs.writeFileSync(`${OUT}/photo-${s.take}.png`, Buffer.from(b64, "base64"));
    await p.click(".pm-again"); await p.waitForTimeout(500);
  }
  if (s.eval) console.log("eval", JSON.stringify(await p.evaluate(s.eval)));
}
console.log("errors", errs.length, JSON.stringify(errs.slice(0, 6)));
await ctx.close(); await br.close();
