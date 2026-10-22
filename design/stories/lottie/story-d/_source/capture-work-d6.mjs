// Cromatic · stories in Lottie · story D6 (TASK-115b, Iris; Daniel on D5: "the scroll behind at varying speeds, never
// too fast"): /site/'s portfolio grid on a phone, scrolled at a breathing pace (slow, a little quicker, slow again,
// never fast), captured as the browser paints it, resampled to 30 a second. LOCAL ONLY.
//   BASE=... node capture-work-d6.mjs <outDir> [seconds] [distance]
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const [OUT, SECS = "4.6", DIST = "980"] = process.argv.slice(2), BASE = process.env.BASE || "http://localhost:8987", DPR = 1080 / 390;
fs.mkdirSync(OUT, { recursive: true }); for (const f of fs.readdirSync(OUT)) if (f.startsWith("raw-")) fs.rmSync(`${OUT}/${f}`);
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { try { localStorage.setItem("cz-consent", "no"); } catch (e) {} });
const p = await ctx.newPage();
await p.goto(BASE + "/site/", { waitUntil: "load" }); await p.waitForTimeout(3500);
const from = await p.evaluate(() => { const c = document.querySelector("#work .bcard"); return Math.round(c.getBoundingClientRect().top + scrollY - 90); });
await p.evaluate((y) => window.scrollTo(0, y), from); await p.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(p), frames = [];
cdp.on("Page.screencastFrame", async (e) => { frames.push({ t: e.metadata.timestamp, data: e.data }); try { await cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }); } catch (er) {} });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
// the speed: 1 + 0.6 sin (a breath every 2.3 s), integrated; eased at both ends
await p.evaluate(({ from, dist, secs }) => new Promise((res) => { const t0 = performance.now(), T = secs, w = (2 * Math.PI) / 2.3;
  const pos = (t) => t + (0.6 / w) * (1 - Math.cos(w * t)), total = pos(T);
  const step = (now) => { const t = Math.min(T, (now - t0) / 1000), e = Math.min(1, t / 0.4) * Math.min(1, (T - t) / 0.4 + 0.0001); window.scrollTo(0, from + (dist * pos(t)) / total); if (t < T) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }), { from, dist: +DIST, secs: +SECS });
await p.waitForTimeout(300); await cdp.send("Page.stopScreencast"); await br.close();
frames.sort((a, b) => a.t - b.t);
const T0 = frames[0].t, n = Math.floor((frames[frames.length - 1].t - T0) * 30); let j = 0;
for (let i = 0; i <= n; i++) { const t = T0 + i / 30; while (j < frames.length - 1 && frames[j + 1].t <= t) j++; fs.writeFileSync(`${OUT}/raw-${String(i).padStart(3, "0")}.jpg`, Buffer.from(frames[j].data, "base64")); }
console.log(JSON.stringify({ painted: frames.length, out: n + 1, from }));
