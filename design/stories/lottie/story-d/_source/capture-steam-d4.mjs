// Cromatic · stories in Lottie · story D4 (TASK-065f, Daniel: "a real scroll down Steam's case page, so the t-shirts
// come into view"): the live case page (/work/steam/) on a phone, scrolled from its top down to the tees at a reading
// pace (an ease in, steady, an ease out on the tees), captured as the browser paints it (its own videos and motion),
// resampled to 30 a second. LOCAL ONLY.   node capture-steam-d4.mjs <outDir> [seconds]
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const [OUT, SECS = "2.6"] = process.argv.slice(2), BASE = process.env.BASE || "https://cromaticstudios.com", DPR = 1080 / 390;
fs.mkdirSync(OUT, { recursive: true }); for (const f of fs.readdirSync(OUT)) if (f.startsWith("raw-")) fs.rmSync(`${OUT}/${f}`);
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { try { localStorage.setItem("cz-consent", "no"); } catch (e) {} });
const p = await ctx.newPage();
await p.goto(BASE + "/work/steam/", { waitUntil: "load" });
await p.waitForTimeout(3000);
// (the tees: the first of the white T-shirts' pictures (by their alt); the scroll ends with them in the middle of the screen)
for (let y = 0; y < 30000; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(60); } // (lazy pictures loaded)
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1500);
const plan = await p.evaluate(() => { const i = [...document.querySelectorAll("img")].find((x) => /White T-shirts/.test(x.alt || "")); return { H: document.documentElement.scrollHeight, tee: i ? i.getBoundingClientRect().top + scrollY : null, teeH: i ? i.getBoundingClientRect().height : 0 }; });
const target = Math.max(0, Math.round(plan.tee + plan.teeH / 2 - 693 / 2));
const cdp = await ctx.newCDPSession(p), frames = [];
cdp.on("Page.screencastFrame", async (e) => { frames.push({ t: e.metadata.timestamp, data: e.data }); try { await cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }); } catch (er) {} });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
await p.evaluate(({ target, secs }) => new Promise((res) => { const t0 = performance.now(), d = secs * 1000, hold = 250; const step = (now) => { const u = Math.min(1, Math.max(0, (now - t0 - hold) / (d - 2 * hold))), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; window.scrollTo(0, target * (0.15 * u + 0.85 * e)); if (now - t0 < d) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }), { target, secs: +SECS });
await p.waitForTimeout(700);
await cdp.send("Page.stopScreencast"); await br.close();
frames.sort((a, b) => a.t - b.t);
const T0 = frames[0].t, n = Math.floor((frames[frames.length - 1].t - T0) * 30); let j = 0;
for (let i = 0; i <= n; i++) { const t = T0 + i / 30; while (j < frames.length - 1 && frames[j + 1].t <= t) j++; fs.writeFileSync(`${OUT}/raw-${String(i).padStart(3, "0")}.jpg`, Buffer.from(frames[j].data, "base64")); }
console.log(JSON.stringify({ painted: frames.length, out: n + 1, target, plan }));
