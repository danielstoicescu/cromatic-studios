// Cromatic · stories in Lottie (TASK-057): the "before" for the contact sheet: the site as a visitor screen-records it
// on a phone (the local build, its UI on, no test hooks), at Two Minutes: Street view and the Bird's eye
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
const OUT = process.argv[2];
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: 1080 / 390, isMobile: true, hasTouch: true });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} });
const p = await ctx.newPage();
await p.goto("http://localhost:8961/?map", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(3000);
await p.evaluate(() => window.__mapGo("tm"));
for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (!(await p.evaluate(() => window.__nav2.moving()))) break; }
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/plain-birdseye.png` });
await p.evaluate(() => window.__nav2.view(true)); await p.waitForTimeout(3500);
await p.screenshot({ path: `${OUT}/plain-street.png` });
console.log(JSON.stringify(await p.evaluate(() => window.__nav2.state())));
await br.close();
