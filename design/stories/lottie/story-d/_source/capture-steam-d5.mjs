// Cromatic · stories in Lottie · story D5 (TASK-115, Iris; Daniel on D4: "scroll fast three times with variable
// velocity: a quick acceleration, stop, quick again", ~1 s on each stop): the live case page (/work/steam/) on a
// phone, captured as the browser paints it (the DevTools screencast), resampled to 30 a second. The three stops, found
// on the page itself: (a) the guest in the green Steam T-shirt, (b) the brand manual's logo lockups and type
// specimen, (c) "Ne știm de la Steam" and the camera with its sticker. LOCAL ONLY.
//   node capture-steam-d5.mjs <outDir>   -> raw-NNN.jpg + plan.json (the stops' frames)
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const [OUT] = process.argv.slice(2), BASE = process.env.BASE || "https://cromaticstudios.com", DPR = 1080 / 390, VH = 693;
fs.mkdirSync(OUT, { recursive: true }); for (const f of fs.readdirSync(OUT)) if (f.startsWith("raw-")) fs.rmSync(`${OUT}/${f}`);
// the clock (s): a beat at the top, then burst, stop, burst, stop, burst, stop
export const PLAN = [["hold", 0.35], ["go", 0.5], ["hold", 1.0], ["go", 0.45], ["hold", 1.0], ["go", 0.7], ["hold", 1.15]];
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: VH }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { try { localStorage.setItem("cz-consent", "no"); } catch (e) {} });
const p = await ctx.newPage();
await p.goto(BASE + "/work/steam/", { waitUntil: "load" });
await p.waitForTimeout(3000);
for (let y = 0; y < 30000; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(70); } // (every lazy picture in)
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1800);
const stops = await p.evaluate((VH) => {
  const top = (e) => e.getBoundingClientRect().top + scrollY, img = (re) => [...document.querySelectorAll("img")].find((x) => re.test(x.alt || ""));
  const mid = (a, b) => Math.max(0, Math.round((a + b) / 2 - VH / 2));
  const tee = img(/green Steam T-shirt/i), logo = img(/logo lockups/i), spec = img(/Type specimen/i);
  const h = [...document.querySelectorAll("h1,h2,h3,p")].find((e) => /Ne știm de la Steam/.test(e.textContent)), cam = img(/Ne știm de la Steam sticker/i);
  return [mid(top(tee), top(tee) + tee.getBoundingClientRect().height), mid(top(logo) - 40, top(spec) + spec.getBoundingClientRect().height), mid(top(h) - 20, top(cam) + cam.getBoundingClientRect().height)];
}, VH);
const cdp = await ctx.newCDPSession(p), frames = [];
cdp.on("Page.screencastFrame", async (e) => { frames.push({ t: e.metadata.timestamp, data: e.data }); try { await cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }); } catch (er) {} });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
const t0w = await p.evaluate(() => performance.timeOrigin + performance.now());
await p.evaluate(({ PLAN, stops }) => new Promise((res) => {
  // quartic in and out: a quick start, a quick stop
  const e = (u) => (u < 0.5 ? 8 * u ** 4 : 1 - 8 * (1 - u) ** 4);
  const segs = []; let t = 0, y = 0, k = 0; for (const [kind, d] of PLAN) { const y1 = kind === "go" ? stops[k++] : y; segs.push({ t0: t, t1: t + d, y0: y, y1 }); t += d; y = y1; }
  const T = t * 1000, t0 = performance.now();
  const step = (now) => { const s = (now - t0) / 1000, g = segs.find((q) => s < q.t1) || segs[segs.length - 1], u = Math.min(1, (s - g.t0) / (g.t1 - g.t0)); window.scrollTo(0, g.y0 + (g.y1 - g.y0) * e(u)); if (now - t0 < T) requestAnimationFrame(step); else res(); };
  requestAnimationFrame(step);
}), { PLAN, stops });
await p.waitForTimeout(400);
await cdp.send("Page.stopScreencast"); await br.close();
frames.sort((a, b) => a.t - b.t);
const T0 = frames[0].t, n = Math.floor((frames[frames.length - 1].t - T0) * 30); let j = 0;
for (let i = 0; i <= n; i++) { const t = T0 + i / 30; while (j < frames.length - 1 && frames[j + 1].t <= t) j++; fs.writeFileSync(`${OUT}/raw-${String(i).padStart(3, "0")}.jpg`, Buffer.from(frames[j].data, "base64")); }
// (where the plan starts in the resampled frames: the screencast began a little before the scroll)
const lead = Math.max(0, Math.round((t0w / 1000 - T0) * 30));
fs.writeFileSync(`${OUT}/plan.json`, JSON.stringify({ PLAN, stops, lead, out: n + 1 }));
console.log(JSON.stringify({ painted: frames.length, out: n + 1, stops, lead }));
