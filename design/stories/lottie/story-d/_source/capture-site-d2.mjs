// Cromatic · stories in Lottie · story D2 (TASK-065c): the new normal site (/site/, the 4.1 build) on a phone, scrolled
// smoothly, captured as the browser paints it (the DevTools screencast: its own frames with their timestamps), then
// resampled to 30 a second. The Lottie scene at the coffee stop, the street cards, the portfolio cards dealt in: all
// as the site draws them. LOCAL ONLY.
//   node capture-site-d2.mjs <outDir> [path] [seconds]
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const [OUT, PATH = "/site/", SECS = "4.2"] = process.argv.slice(2), BASE = process.env.BASE || "http://localhost:8972", DPR = 1080 / 390;
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.startsWith("raw-")) fs.rmSync(`${OUT}/${f}`);
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch (e) {} });
const p = await ctx.newPage();
await p.goto(BASE + PATH, { waitUntil: "load" });
await p.waitForTimeout(3500);
// (where the scroll goes: from the top through the coffee stop to the portfolio cards)
const plan = await p.evaluate(() => { const q = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : null; }; return { H: document.documentElement.scrollHeight, coffee: q("[data-czl], .coffee, #coffee"), cards: q(".proj, .card, .pf-card, .portfolio") }; });
const target = Math.min(plan.H - 700, Math.max(1600, (plan.cards || 2400) + 200));
const cdp = await ctx.newCDPSession(p), frames = [];
cdp.on("Page.screencastFrame", async (e) => { frames.push({ t: e.metadata.timestamp, data: e.data }); try { await cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }); } catch (er) {} });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
// a smooth scroll in the page (its own frames): a hold, an ease in and out, a hold
const secs = +SECS;
await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; document.body.style.scrollBehavior = "auto"; });
await p.evaluate(({ target, secs }) => new Promise((res) => { const t0 = performance.now(), d = secs * 1000, hold = 500; const step = (now) => { const u = Math.min(1, Math.max(0, (now - t0 - hold) / (d - 2 * hold))), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; window.scrollTo(0, target * e); if (now - t0 < d) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }), { target, secs });
await p.waitForTimeout(300);
await cdp.send("Page.stopScreencast");
await br.close();
// resample to 30 a second (the frame shown at each tick)
frames.sort((a, b) => a.t - b.t);
const T0 = frames[0].t, n = Math.floor((frames[frames.length - 1].t - T0) * 30);
let j = 0;
for (let i = 0; i <= n; i++) { const t = T0 + i / 30; while (j < frames.length - 1 && frames[j + 1].t <= t) j++; fs.writeFileSync(`${OUT}/raw-${String(i).padStart(3, "0")}.jpg`, Buffer.from(frames[j].data, "base64")); }
console.log(JSON.stringify({ painted: frames.length, span: +(frames[frames.length - 1].t - T0).toFixed(2), out: n + 1, target, plan }));
