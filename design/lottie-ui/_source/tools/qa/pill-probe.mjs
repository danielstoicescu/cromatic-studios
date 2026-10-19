// pill-stab: what a case page's open and close actually do, frame by frame on the main thread (BASE=beta or local).
// Logs per rAF: t since click, window canvas present, frame visible, frame clip, iframe readyState, painted content;
// long tasks; the gaps between frames (the map's hitches). DEV=desktop|pixel|iphone THR=4 NET=4g
import { ctxFor, waitMap, sleep, closeAll, BASE, throttle } from "./lib.mjs";
const kind = process.env.DEV || "desktop";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2500);
let cdp = null;
if (process.env.THR && kind !== "iphone") cdp = await throttle(page, +process.env.THR);
if (process.env.NET && kind !== "iphone") { cdp = cdp || await page.context().newCDPSession(page); await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8 * 4, uploadThroughput: 750e3 / 8 }); }
await page.evaluate((p) => window.__mapGo(p), process.env.PLACE || "steam");
for (let i = 0; i < 80; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2000);
await page.evaluate(() => {
  window.__pp = { f: [], lt: [] };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__pp.lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ["longtask"] }); } catch (e) {}
  const rec = () => {
    const P = window.__pp; if (!P.on) { requestAnimationFrame(rec); return; }
    const f = document.querySelector(".case-frame"), fr = f && f.querySelector("iframe"), cs = f && getComputedStyle(f);
    let rs = "-", body = 0; try { rs = fr.contentDocument ? fr.contentDocument.readyState : "x"; body = fr.contentDocument && fr.contentDocument.body ? fr.contentDocument.body.children.length : 0; } catch (e) { rs = "err"; }
    P.f.push([Math.round(performance.now() - P.t0), document.querySelector(".czl-window, .czpf") ? 1 : 0, f.classList.contains("hidden") ? "H" : cs.visibility === "hidden" ? "h" : "V", rs, body, f.getAnimations().length]);
    requestAnimationFrame(rec);
  };
  requestAnimationFrame(rec);
});
const run = async (what, fn, ms) => {
  await page.evaluate(() => { window.__pp.f = []; window.__pp.lt = []; window.__pp.t0 = performance.now(); window.__pp.on = true; });
  await page.evaluate(fn);
  await sleep(ms);
  const r = await page.evaluate(() => { window.__pp.on = false; const P = window.__pp; return { f: P.f, lt: P.lt.map((x) => [x[0] - Math.round(P.t0), x[1]]).filter((x) => x[0] > -50) }; });
  // compress: print state changes only, plus gaps over 40 ms
  let last = "", gaps = [];
  console.log(`== ${what} (${kind}${process.env.THR ? " cpu x" + process.env.THR : ""}${process.env.NET ? " net " + process.env.NET : ""})`);
  for (let i = 0; i < r.f.length; i++) { const [t, w, v, rs, b, an] = r.f[i]; const s = `win=${w} frame=${v} doc=${rs} kids=${b > 0 ? "y" : "n"} anim=${an}`; if (s !== last) { console.log(String(t).padStart(5), "ms", s); last = s; } if (i && t - r.f[i - 1][0] > 40) gaps.push(`${r.f[i - 1][0]}+${t - r.f[i - 1][0]}`); }
  console.log("   frames", r.f.length, "gaps>40ms:", gaps.join(" ") || "none", "| long tasks:", r.lt.map((x) => x.join("+")).join(" ") || "none");
};
await run("open", () => document.querySelector(".map-card:not(.hidden) .mcd-open").click(), +(process.env.OPENMS || 3500));
console.log("iframe nav (ms after click):", await page.evaluate(() => { try { const fr = document.querySelector(".case-frame iframe"), w = fr.contentWindow, n = w.performance.getEntriesByType("navigation")[0], off = w.performance.timeOrigin - performance.timeOrigin - window.__pp.t0; const r = (x) => Math.round(off + x); return { navStart: r(0), fetch: r(n.fetchStart), resp: r(n.responseStart), respEnd: r(n.responseEnd), domInt: r(n.domInteractive), dcl: r(n.domContentLoadedEventEnd), load: r(n.loadEventEnd), fcp: (w.performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime != null ? r(w.performance.getEntriesByName("first-contentful-paint")[0].startTime) : null }; } catch (e) { return String(e); } }));
await run("close", () => document.querySelector(".case-frame .cf-close").click(), 2500);
console.log("errors:", log.errs.slice(0, 5));
await closeAll();
