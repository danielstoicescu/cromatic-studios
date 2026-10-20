// Cromatic · stories in Lottie · story C (TASK-058): the "before": the site on a phone at night, Street view on the
// coffee street with the police chase on (the map's test hook copNow: the chase without four seconds of drifting)
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
await p.evaluate(() => window.__scheme("nightlife")); await p.waitForTimeout(4000);
await p.evaluate(() => window.__api.setVehicle("dacia1300")); await p.waitForTimeout(1000);
await p.evaluate(() => window.__nav2.view(true)); await p.waitForTimeout(1500);
await p.evaluate(() => window.__mapGo("oma"));
for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (!(await p.evaluate(() => window.__nav2.moving()))) break; }
await p.evaluate(() => { try { window.__closeAllOverlays?.(); } catch (e) {} });
await p.waitForTimeout(800);
// a little drive on, and the chase
await p.evaluate(() => window.__nav2.press("u", true)); await p.waitForTimeout(700);
await p.evaluate(() => window.__nav2.copNow()); await p.waitForTimeout(1600);
await p.evaluate(() => window.__nav2.press("u", false)); await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/plain-chase.png` });
console.log(JSON.stringify(await p.evaluate(() => ({ cop: window.__nav2.copT(), s: window.__nav2.state().car }))));
await br.close();
