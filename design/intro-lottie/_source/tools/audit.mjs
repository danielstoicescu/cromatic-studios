// Lottie intro research (2026-10-19): audit of the current opening on "/".
// node ~/.x-li-audit.mjs <desktop|phone> <rec|perf|perf4x> [outDir]
// rec   = CDP screencast frames (+ timestamps) for an MP4, plus the state timeline
// perf  = no screencast: rAF frame log, long tasks, main-thread metrics, bytes
// perf4x = perf with 4x CPU throttling
import pw from "playwright";
import fs from "fs";
import path from "path";
const [, , dev = "desktop", kind = "rec", outArg] = process.argv;
const OUT = outArg || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/lottie-intro/audit";
const BASE = process.env.BASE || "http://localhost:8571";
const DUR = +(process.env.DUR || 32000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tag = `${dev}-${kind}`;
const dir = path.join(OUT, tag);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

const DEV = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: kind === "rec" ? 1 : 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: pw.devices["Pixel 7"].userAgent }
};
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--enable-precise-memory-info"] });
const ctx = await br.newContext({ ...DEV[dev] });
await ctx.route(/google-analytics\.com|analytics\.google\.com|\/g\/collect|googletagmanager\.com|doubleclick|facebook\.net/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => {
  const A = (window.__aud = { raf: [], lt: [], ev: [], last: {} });
  const loop = (t) => { A.raf.push(Math.round(t * 10) / 10); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => A.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: true }); } catch {}
  const vis = (sel) => { const e = document.querySelector(sel); if (!e) return 0; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05 ? 1 : 0; };
  const rect = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const mark = (k, v) => { if (A.last[k] !== v) { A.last[k] = v; A.ev.push([Math.round(performance.now()), k, v]); } };
  setInterval(() => {
    const b = document.body; if (!b) return;
    mark("body.kz-boot", b.classList.contains("kz-boot") ? 1 : 0);
    mark("body.kz-intro", b.classList.contains("kz-intro") ? 1 : 0);
    mark("i4pre", vis(".i4-pre"));
    const i4 = document.querySelector(".i4"); mark("i4", i4 ? i4.className.replace(/\s+/g, " ") : "-");
    mark("words", [...document.querySelectorAll(".i4 .kl")].map((k) => k.textContent.replace(/\s+/g, " ").trim()).join(" | ") || (document.querySelector(".i4-pre .kl") ? "[pre] " + document.querySelector(".i4-pre .kl").textContent.replace(/\s+/g, " ").trim() : ""));
    mark("skip", vis(".map-ui .kz-skip") || vis(".i4-skip"));
    mark("skipRect", JSON.stringify(rect(".map-ui .kz-skip:not(.hidden)") || rect(".i4-skip:not([hidden])")));
    mark("cookie", vis("#cz-ck"));
    mark("cookieRect", JSON.stringify(rect("#cz-ck")));
    mark("welcome", vis(".map-welcome:not(.hidden)"));
    mark("nav2ready", window.__nav2 && window.__nav2.D && window.__nav2.D.ready ? 1 : 0);
    mark("brew", vis(".kz-brew"));
    mark("cupsWall", vis(".kz") ? 1 : 0);
  }, 50);
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Performance.enable");
await cdp.send("Network.enable");
if (kind === "perf4x") await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const net = []; const reqT = {};
cdp.on("Network.requestWillBeSent", (e) => { reqT[e.requestId] = { url: e.request.url, t: e.timestamp }; });
cdp.on("Network.loadingFinished", (e) => { const r = reqT[e.requestId]; if (r) net.push({ url: r.url.replace(BASE, ""), bytes: e.encodedDataLength, t0: r.t, t1: e.timestamp }); });
const frames = [];
let fi = 0;
if (kind === "rec") {
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const f = path.join(dir, `f${String(fi++).padStart(5, "0")}.jpg`);
    fs.writeFileSync(f, Buffer.from(data, "base64"));
    frames.push([f, metadata.timestamp]);
    try { await cdp.send("Page.screencastFrameAck", { sessionId }); } catch {}
  });
  const vp = DEV[dev].viewport, k = dev === "phone" ? 2 : 1;
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 82, maxWidth: vp.width * k, maxHeight: vp.height * k, everyNthFrame: 1 });
}
const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
const tNav = Date.now();
await page.goto(BASE + "/", { waitUntil: "commit" });
await sleep(DUR);
const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
if (kind === "rec") await cdp.send("Page.stopScreencast").catch(() => {});
const aud = await page.evaluate(() => ({ ...window.__aud, paint: performance.getEntriesByType("paint").map((p) => [p.name, Math.round(p.startTime)]), nav: performance.getEntriesByType("navigation").map((n) => ({ dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), ttfb: Math.round(n.responseStart) })), bootT: window.__bootT || null, res: performance.getEntriesByType("resource").map((r) => [r.name.replace(location.origin, ""), Math.round(r.startTime), Math.round(r.responseEnd), r.transferSize, r.encodedBodySize]) }));
const md = {};
for (const k of ["TaskDuration", "ScriptDuration", "LayoutDuration", "RecalcStyleDuration", "JSHeapUsedSize"]) md[k] = +((m1[k] || 0) - (k === "JSHeapUsedSize" ? 0 : m0[k] || 0)).toFixed(3);
// frame stats per second from rAF
const raf = aud.raf; const per = {};
for (let i = 1; i < raf.length; i++) { const s = Math.floor(raf[i] / 1000); const d = raf[i] - raf[i - 1]; (per[s] ||= { n: 0, long: 0, max: 0 }); per[s].n++; if (d > 25) per[s].long++; if (d > per[s].max) per[s].max = Math.round(d); }
const out = { dev, kind, dur: DUR, metrics: md, perSecond: per, ev: aud.ev, lt: aud.lt, paint: aud.paint, nav: aud.nav, bootT: aud.bootT, net, res: aud.res, frames: frames.length };
fs.writeFileSync(path.join(OUT, `${tag}.json`), JSON.stringify(out, null, 1));
if (kind === "rec" && frames.length) {
  // ffconcat with real durations
  const t0 = frames[0][1];
  let s = "ffconcat version 1.0\n";
  for (let i = 0; i < frames.length; i++) { const d = i + 1 < frames.length ? frames[i + 1][1] - frames[i][1] : 0.04; s += `file '${frames[i][0]}'\nduration ${Math.max(0.001, d).toFixed(4)}\n`; }
  s += `file '${frames[frames.length - 1][0]}'\n`;
  fs.writeFileSync(path.join(dir, "list.ffconcat"), s);
  out.t0 = t0;
}
console.log(JSON.stringify({ tag, frames: frames.length, metrics: md, ev: aud.ev.length, lt: aud.lt.length }, null, 0));
await br.close();
