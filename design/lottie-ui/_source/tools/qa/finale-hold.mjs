// lottie-ui r232b: the city rests under the finale's paper and clouds. During the end card, 3 s each: WebGL draw calls a
// second, the main thread's time in animation frames a second (and CDP TaskDuration on chromium), with the pause on and
// off (window.__czNoHold); then Back to the map: frames drawn before the clouds open (must be > 0), stills of the opening.
// LOCAL ONLY (fake QA data). DEV=desktop|iphone|pixel
import { ctxFor, waitMap, shot, sleep, closeAll, BASE, tapSel, openAndFillPass, throttle } from "./.x-lui-lib.mjs";
if (!/localhost|127\.0\.0\.1/.test(BASE)) process.exit(1);
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "hold", phone = kind !== "desktop" && kind !== "laptop";
const { ctx, page, log } = await ctxFor(kind, { consent: "yes2" });
await ctx.addInitScript(() => {
  window.__dc = 0; window.__rafMs = 0; window.__rafN = 0;
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; for (const m of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) { const f = C.prototype[m]; if (f) C.prototype[m] = function () { window.__dc++; return f.apply(this, arguments); }; } }
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { const a = performance.now(); try { cb(t); } finally { window.__rafMs += performance.now() - a; window.__rafN++; } });
});
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2500);
if (process.env.THR) await throttle(page, +process.env.THR);
await openAndFillPass(page, phone);
const respP = page.waitForResponse((r) => r.url().includes("/api/boarding"), { timeout: 20000 }).catch(() => null);
await tapSel(page, ".cform .cf-submit", phone);
const resp = await respP; console.log("POST /api/boarding:", resp ? resp.status() : "none");
for (let i = 0; i < 200; i++) { await sleep(100); if (await page.evaluate(() => window.czFinale?.state() === "sky")) break; }
await sleep(800);
let cdp = null; try { cdp = await ctx.newCDPSession(page); await cdp.send("Performance.enable"); } catch (e) { cdp = null; }
const measure = async (noHold) => {
  await page.evaluate((v) => { window.__czNoHold = v; }, noHold); await sleep(600);
  const a = await page.evaluate(() => ({ dc: window.__dc, ms: window.__rafMs, n: window.__rafN, t: performance.now() }));
  const m0 = cdp ? (await cdp.send("Performance.getMetrics")).metrics.find((x) => x.name === "TaskDuration").value : 0;
  await sleep(3000);
  const b = await page.evaluate(() => ({ dc: window.__dc, ms: window.__rafMs, n: window.__rafN, t: performance.now(), hold: window.czFinale.hold() }));
  const m1 = cdp ? (await cdp.send("Performance.getMetrics")).metrics.find((x) => x.name === "TaskDuration").value : 0;
  const s = (b.t - a.t) / 1000;
  return { pause: !noHold, hold: b.hold, drawCallsPerS: Math.round((b.dc - a.dc) / s), rafMsPerS: +((b.ms - a.ms) / s).toFixed(1), framesPerS: Math.round((b.n - a.n) / s), mainTaskMsPerS: cdp ? Math.round(((m1 - m0) * 1000) / s) : null };
};
console.log("end card, no pause:", JSON.stringify(await measure(true)));
console.log("end card, paused:  ", JSON.stringify(await measure(false)));
await shot(page, `${tag}-${kind}-endcard`);
// Back to the map: how many frames the city draws before the clouds open (the sky leaves at DOWN1, 0.5 s in)
const d0 = await page.evaluate(() => { window.__stl = []; let last = ""; const t0 = performance.now(); window.__stI = setInterval(() => { const s = window.czFinale.state(); if (s !== last) { last = s; window.__stl.push([Math.round(performance.now() - t0), s, window.__dc]); } }, 8); return window.__dc; });
await tapSel(page, ".flight-end .fe-map", phone);
const opens = [];
for (let i = 0; i < 16; i++) { await sleep(70); opens.push(await page.evaluate(() => ({ st: window.czFinale.state(), dc: window.__dc, hold: window.czFinale.hold() }))); if (i % 3 === 1) await shot(page, `${tag}-${kind}-open-${String(i).padStart(2, "0")}`); }
console.log("down timeline (ms, state, draw calls):", JSON.stringify(await page.evaluate(() => window.__stl)));
const firstUp = opens.findIndex((o) => o.st === "upout");
console.log("down: draw calls before the clouds open:", firstUp >= 0 ? opens[firstUp].dc - d0 : "?", "states:", opens.map((o) => o.st[0]).join(""));
await sleep(1500); await shot(page, `${tag}-${kind}-back`);
console.log("after:", await page.evaluate(() => ({ st: window.czFinale.state(), body: document.body.className.slice(0, 80) })));
console.log("errors:", log.errs, "bad:", log.bad);
await ctx.close(); await closeAll();
