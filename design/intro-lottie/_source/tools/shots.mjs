// visual check of the worker players: screenshots during real-time playback of the bench page
import pw from "playwright";
const [, , d = "A", ab = "phone", p = "lw", times = "3000,6000,9700"] = process.argv;
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
const o = ab === "phone" ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const pg = await (await br.newContext(o)).newPage();
await pg.goto(`http://localhost:8576/bench.html?d=${d}&ab=${ab}&p=${p}`);
await pg.waitForFunction(() => window.__bench && window.__bench.ev.play != null, null, { timeout: 30000 });
const t0 = Date.now();
for (const t of times.split(",").map(Number)) { const w = t - (Date.now() - t0); if (w > 0) await pg.waitForTimeout(w); await pg.screenshot({ path: `/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/lottie-intro/t/w-${d}-${ab}-${p}-${t}.png` }); }
console.log(await pg.evaluate(() => window.__bench.err));
await br.close();
