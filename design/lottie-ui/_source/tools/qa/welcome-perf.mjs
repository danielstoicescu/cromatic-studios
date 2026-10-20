// node perf.mjs <kind> <base> [cpu] [runs]  -> long tasks on map start and around the welcome card; the worker's frames
import { ctxFor, closeAll, sleep, throttle } from "./welcome-lib.mjs";
const [kind = "desktop", base = "http://localhost:8977", cpu = "1", runs = "2"] = process.argv.slice(2);
const out = [];
for (let r = 0; r < +runs; r++) {
  const { page, ctx, log } = await ctxFor(kind, { ls: { "cz-consent": "no", "cz-intro-at": String(Date.now()) } });
  await page.addInitScript(() => {
    window.__lt = []; window.__fr = {}; window.__tw = null; window.__open = null; window.__gaps = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: true }); } catch (e) { window.__noLT = true; }
    const iv = setInterval(() => {
      if (window.czL && !window.czL.__w) {
        window.czL.__w = 1; const m = window.czL.mount;
        window.czL.mount = (name, o) => m(name, o).then((p) => { if (p) { const a = (window.__fr[name] = window.__fr[name] || []); p.anim.addEventListener("enterFrame", (e) => a.push([performance.now(), +e.currentTime || 0])); } return p; });
      }
      if (window.czWelcome && !window.czWelcome.__w) { window.czWelcome.__w = 1; const o = window.czWelcome.open; window.czWelcome.open = (el) => { const t = performance.now(); const v = o(el); window.__open = performance.now() - t; return v; }; }
      const w = document.querySelector(".map-welcome"); if (w && !w.classList.contains("hidden") && window.__tw == null) window.__tw = performance.now();
      if (window.__tw != null && window.czWelcome && window.czWelcome.__w && window.czL && window.czL.__w) clearInterval(iv);
    }, 20);
    // main-thread frame gaps (WebKit has no longtask entries): rAF deltas
    let last = 0; const raf = (t) => { if (last) window.__gaps.push([Math.round(t), Math.round(t - last)]); last = t; requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  });
  let cdp = null; if (+cpu > 1) cdp = await throttle(page, +cpu);
  await page.goto(base + "/?map");
  await page.waitForFunction(() => window.__tw != null, null, { timeout: 120000 });
  await sleep(7000);
  const res = await page.evaluate(() => {
    const tw = window.__tw, lt = window.__lt;
    const sum = (a) => a.reduce((s, x) => s + x[1], 0);
    const before = lt.filter((x) => x[0] < tw), during = lt.filter((x) => x[0] >= tw && x[0] < tw + 7000);
    const gaps = window.__gaps.filter((g) => g[0] >= tw && g[0] < tw + 7000), gb = window.__gaps.filter((g) => g[0] < tw);
    const fr = {};
    for (const [n, a] of Object.entries(window.__fr)) {
      if (a.length < 3) { fr[n] = { n: a.length }; continue; }
      let skips = 0, steps = 0, maxStep = 0; for (let i = 1; i < a.length; i++) { const d = a[i][1] - a[i - 1][1]; if (d <= 0 || d > 30) continue; steps++; if (d > maxStep) maxStep = d; if (d > 1.6) skips++; }
      // the worker's own rate: frames drawn over the animation time they covered (60 fps = 1 frame a step)
      let cover = 0; for (let i = 1; i < a.length; i++) { const d = a[i][1] - a[i - 1][1]; if (d > 0 && d <= 30) cover += d; }
      fr[n] = { frames: a.length, workerFps: +(60 * steps / Math.max(1, cover)).toFixed(1), skips, maxStep: +maxStep.toFixed(2) };
    }
    return { allLT: lt.map((x) => [x[0] - Math.round(tw), x[1]]), tw: Math.round(tw), openMs: window.__open == null ? null : +window.__open.toFixed(2), ltBefore: { n: before.length, ms: sum(before), max: Math.max(0, ...before.map((x) => x[1])) }, ltDuring: { n: during.length, ms: sum(during), max: Math.max(0, ...during.map((x) => x[1])), list: during }, rafDuring: { n: gaps.length, over34: gaps.filter((g) => g[1] > 34).length, max: Math.max(0, ...gaps.map((g) => g[1])), p95: gaps.map((g) => g[1]).sort((a, b) => a - b)[Math.floor(gaps.length * 0.95)] }, rafBefore: { over50: gb.filter((g) => g[1] > 50).length, max: Math.max(0, ...gb.map((g) => g[1])) }, noLT: !!window.__noLT, frames: fr };
  });
  res.errs = log.errs.length;
  out.push(res);
  console.log(JSON.stringify(res));
  await ctx.close();
}
await closeAll();
