// Cromatic · story P1 (TASK-129): the real Postcard UI in its states for the film, captured alone (transparent) from the
// local map on a phone (1080 x 1920): A the Postcard view, B its looks open, C a look picked (Low drama); with the
// buttons' rects (story px) for the taps. LOCAL ONLY.   BASE=http://localhost:8796 node _source/p1-ui2.mjs
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
import path from "path";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), BASE = process.env.BASE || "http://localhost:8796", O = path.join(HERE, "out/p1");
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: 1080 / 390, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} });
const p = await ctx.newPage();
await p.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(6000);
await p.evaluate(() => { const b = [...document.querySelectorAll("button,[role=button],a")].find((e) => /postcard/i.test(e.textContent || "") && e.offsetParent); b && b.click(); });
await p.waitForTimeout(2500);
const D = 1080 / 390;
const rect = (sel) => p.evaluate(([sel, D]) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x * D, r.y * D, r.width * D, r.height * D].map(Math.round); }, [sel, D]);
const alpha = async (n) => { await p.evaluate(() => { for (const c of document.querySelectorAll("canvas")) c.style.visibility = "hidden"; document.documentElement.style.background = "transparent"; document.body.style.background = "transparent"; }); await p.waitForTimeout(120); await p.screenshot({ path: path.join(O, `ui-${n}.png`), omitBackground: true }); await p.evaluate(() => { for (const c of document.querySelectorAll("canvas")) c.style.visibility = ""; }); };
const R = {};
await alpha("A"); R.camTab = await rect('.pm-tab[data-tab="cam"]'); R.shutter = await rect(".pm-shutter");
await p.evaluate(() => document.querySelector('.pm-tab[data-tab="cam"]').click()); await p.waitForTimeout(1400);
await alpha("B"); R.low = await rect('.pm-preset[data-p="low"]'); R.camTabB = await rect('.pm-tab[data-tab="cam"]'); R.yaw = await rect("#pm-yaw");
await p.evaluate(() => document.querySelector('.pm-preset[data-p="low"]').click()); await p.waitForTimeout(1800);
await alpha("B1"); R.yaw0 = await p.evaluate(() => +document.querySelector("#pm-yaw").value);
// the Rotation slider dragged: 12 steps (its value, then the thumb's x for the finger)
R.steps = [];
for (let i = 1; i <= 12; i++) { const v = Math.round(R.yaw0 - 140 * i / 12); await p.evaluate((v) => { const s = document.querySelector("#pm-yaw"); s.value = String(v); s.dispatchEvent(new Event("input", { bubbles: true })); }, v); await p.waitForTimeout(260); await alpha("S" + String(i).padStart(2, "0")); R.steps.push(await p.evaluate(() => +document.querySelector("#pm-yaw").value)); }
await p.evaluate(() => document.querySelector('.pm-tab[data-tab="cam"]').click()); await p.waitForTimeout(1400);
await alpha("C"); R.shutterC = await rect(".pm-shutter");
fs.writeFileSync(path.join(O, "ui-states.json"), JSON.stringify(R, null, 1));
console.log(JSON.stringify(R));
await br.close();
