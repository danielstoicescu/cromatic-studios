// Cromatic · story P1 (TASK-129): the real Postcard UI captured from the local map (normal mode, a phone, 1080 x 1920):
// the view switch with Postcard on, a ready shot picked. LOCAL ONLY.   BASE=http://localhost:8796 node _source/p1-ui.mjs
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import path from "path";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), BASE = process.env.BASE || "http://localhost:8796";
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: 1080 / 390, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} });
const p = await ctx.newPage();
await p.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(6000);
const btn = await p.evaluate(() => { const b = [...document.querySelectorAll("button,[role=button],a")].find((e) => /postcard/i.test(e.textContent || "") && e.offsetParent); if (b) { b.click(); return true; } return false; }); if (!btn) await p.keyboard.press("p");
await p.waitForTimeout(2500);
const low = await p.evaluate(() => { const b = [...document.querySelectorAll("button,[role=button]")].find((e) => /low drama/i.test(e.textContent || "") || /low drama/i.test(e.getAttribute("aria-label") || "") || /low drama/i.test(e.title || "")); if (b) { b.click(); return true; } return false; }); await p.waitForTimeout(2200);
await p.screenshot({ path: path.join(HERE, "out/p1/ui-capture.png") });
console.log("ui", !!btn, !!low);
await br.close();
