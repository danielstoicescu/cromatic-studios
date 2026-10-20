// piece 5 (TASK-009): into the arcade game and back out, on the map (LOCAL). One run: the map, a way in (ENTRY), the
// pixels, the game's splash, the game's own way out (its Escape: backToMap), the pixels, the camera's pull-back from the
// cabinet's screen. Measures the main thread (long tasks, rAF gaps) in each window, the worker's frames, what is left
// running after; GA hits are caught (lib.mjs) to check the gloves_* events.
//   DEV=desktop|laptop|pixel|pixelL|iphone|iphoneL  ENTRY=topbar|card|n2|lab|tm|labmodal|qa  SCHEME=sketch  RM=1  CPU=4  LANG=ro
//   REC=<file.mp4> (chromium: a real-time screencast)  VIDEO=<dir> (any browser: Playwright's WebM of the whole run)  SHOTS=1 (stills of the exit at a few moments)
//   EXIT=game (its own Escape) | x (the frame's ×) | back (the browser's Back) | map-esc (Escape on the map's page)
//   STREET=1 (the visitor drives in Street view when the game opens)  ROTATE=1 (the phone turned while the game is on)
//   AB=off: the same run with the Lottie layer off (window.__czL = false: the game opens and closes as before), for an A/B
import { ctxFor, waitMap, sleep, closeAll, BASE, gameFrame, throttle, cast, castMp4, Q } from "./lib.mjs";
const kind = process.env.DEV || "desktop", entry = process.env.ENTRY || "topbar", tag = process.env.TAG || `g-${kind}-${entry}`;
const ls = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "yes2" };
if (process.env.LANG2 === "ro" || process.env.LANG === "ro") ls["cz-lang"] = "ro";
const extra = process.env.RM ? { reducedMotion: "reduce" } : {};
if (process.env.VIDEO) extra.recordVideo = { dir: process.env.VIDEO }; // (WebKit: Playwright's own recording, WebM)
const { page, ctx, log } = await ctxFor(kind, { ls, extra });
if (process.env.AB === "off") await page.addInitScript(() => { window.__czL = false; });
await page.addInitScript(() => {
  window.__lt = []; window.__gaps = []; window.__fr = {}; window.__mk = {};
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: true }); } catch (e) { window.__noLT = true; }
  let last = 0, shk = null; window.__ev = []; const raf = (t) => { if (last) window.__gaps.push([Math.round(t), Math.round(t - last)]); last = t; if (window.__shKey !== shk) { shk = window.__shKey; window.__ev.push(["shadow", Math.round(t)]); } const pc = document.querySelector(".map-pins"); const c = pc ? pc.className : ""; if (c !== window.__pc) { window.__pc = c; window.__ev.push(["pins:" + c, Math.round(t)]); } requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  const iv = setInterval(() => {
    if (window.czL && !window.czL.__w) {
      window.czL.__w = 1; const m = window.czL.mount;
      window.czL.mount = (name, o) => { const t0 = performance.now(); if (o && o.patch) { const pf = o.patch; o.patch = (d) => { const a = performance.now(), r = pf(d); (window.__patch = window.__patch || []).push(+(performance.now() - a).toFixed(2)); return r; }; } return m(name, o).then((p) => { if (p) { window.__mk[name] = (window.__mk[name] || []).concat([[Math.round(t0), Math.round(performance.now() - t0)]]); const a = (window.__fr[name + "@" + Math.round(t0)] = []); p.anim.addEventListener("enterFrame", (e) => a.push([performance.now(), +e.currentTime || 0])); } return p; }); };
      clearInterval(iv);
    }
  }, 20);
  const iv2 = setInterval(() => { if (window.__czArcadeOut && !window.__czArcadeOut.__w) { const f = window.__czArcadeOut; window.__czArcadeOut = () => { const a = performance.now(), r = f(); window.__arcAt = [Math.round(a), +(performance.now() - a).toFixed(1)]; return r; }; window.__czArcadeOut.__w = 1; clearInterval(iv2); } }, 50);
});
let cdp = null; if (+process.env.CPU > 1) cdp = await throttle(page, +process.env.CPU);
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page, 120000); await sleep(+process.env.CPU > 1 ? 6000 : 2500);
if (process.env.SCHEME) { await page.evaluate((s) => window.__scheme(s), process.env.SCHEME); await sleep(4000); }
if (process.env.STREET) { await page.evaluate(() => window.__nav2.view(true)); await sleep(2500); }
const mark = (k) => page.evaluate((k) => { window.__m = window.__m || {}; window.__m[k] = Math.round(performance.now()); }, k);
// the way in
const phone = /pixel|iphone/.test(kind) && !/L$/.test(kind);
const click = async (sel) => { const b = await page.$(sel); if (!b) throw new Error("no " + sel); const r = await b.boundingBox(); if (phone) await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2); };
if (entry === "card" || entry === "lab" || entry === "tm") {
  await page.evaluate((id) => window.__mapGo(id), entry === "card" ? "gloves" : entry);
  for (let i = 0; i < 120; i++) { await sleep(250); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden) .mcd-fight"))) break; }
  await sleep(1500);
}
const rec = process.env.REC && !/iphone/.test(kind) ? await cast(page, `${Q}/cast-${tag}`, { q: 62 }) : null;
await mark("in0");
if (entry === "topbar") await click(".map-top .map-2m2f");
else if (entry === "n2") await click(".nav2-ui .n2-2m2f");
else if (entry === "qa") await page.evaluate(() => window.__openGloves("qa"));
else if (entry === "labmodal") { await page.evaluate(() => document.querySelector(".lab-tag").click()); for (let i = 0; i < 40; i++) { await sleep(250); if (await page.$(".hmodal .lab-play")) break; } await sleep(900); await click(".hmodal .lab-play"); } // (the Two Min Lab's modal: the drive's, reached here by its tag)
else await click(".map-card.in:not(.hidden) .mcd-fight");
// the pixels in, the game shown, the pixels out (the piece gone)
const t0 = Date.now(); let saw = { px: false, shown: false };
for (let i = 0; i < 200; i++) {
  await sleep(50);
  const s = await page.evaluate(() => ({ px: !!document.querySelector(".czl-game"), f: !!document.querySelector(".case-frame.cf-game:not(.hidden)") }));
  if (s.px) saw.px = true;
  if (s.f && !s.px && (saw.px || Date.now() - t0 > 4000)) { saw.shown = true; break; }
}
await mark("in1");
const tIn = Date.now() - t0;
const WIN = 4500; // (each window the same length, on and off: the game's own start is in both)
const gf = await gameFrame(page, 20000);
if (process.env.ROTATE) { const v = page.viewportSize(); await page.setViewportSize({ width: v.height, height: v.width }); await sleep(1500); } // (a phone turned for the game: the way out is the other shape)
await sleep(Math.max(1500, WIN - (Date.now() - t0)));
const probe = gf ? await gf.evaluate(() => ({ ready: window.czGloves.ready?.(), scene: window.czGloves.probe().scene })) : null;
await page.screenshot({ path: `${Q}/${tag}-game.png` });
// the way out: the game's own Escape (backToMap: its GA event, then the frame's close)
await mark("out0");
const exitBy = process.env.EXIT || "game";
if (exitBy === "x") await click(".case-frame:not(.hidden) .cf-close");
else if (exitBy === "back") await page.goBack().catch(() => {});
else if (exitBy === "map-esc") { await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur()); await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))); }
else if (gf) await gf.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", key: "Escape", bubbles: true })));
const t1 = Date.now(), shots = [];
const SH = process.env.SHOTS ? [350, 700, 1000, 1500, 2100, 2800] : [];
for (let i = 0; i < 160; i++) {
  await sleep(50);
  const el = Date.now() - t1;
  if (SH.length && el >= SH[0]) { const at = SH.shift(); await page.screenshot({ path: `${Q}/${tag}-out-${at}.png` }); shots.push(at); }
  const s = await page.evaluate(() => ({ px: !!document.querySelector(".czl-game"), f: !!document.querySelector(".case-frame:not(.hidden)"), cab: !!document.querySelector(".czg-cab, .czg-back") }));
  if (!s.px && !s.f && !s.cab && el > 3200) break;
}
await mark("out1");
const tOut = Date.now() - t1;
await sleep(Math.max(1500, WIN + 300 - (Date.now() - t1)));
const frames = rec ? await rec.stop() : null;
if (rec && frames) await castMp4(frames, process.env.REC);
// what is left: animations running, the piece, the classes; the camera where it was asked to land
const rest = await page.evaluate(() => ({
  anims: document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.effect && a.effect.target ? (a.effect.target.className || a.effect.target.tagName) + "" : "?").slice(0, 40)),
  url: location.pathname + location.search, frameHidden: document.querySelector(".case-frame").classList.contains("hidden"), czl: document.querySelectorAll(".czl").length, cls: [...document.body.classList].filter((c) => /^czg|czpf/.test(c)).concat([...document.querySelectorAll(".czg-cab, .czg-back")].map((e) => e.className.slice(0, 30))), mv: window.__mapView(), view: window.__nav2?.D?.view, camK: window.__nav2?.camK
}));
const res = await page.evaluate(() => {
  const M = window.__m, lt = window.__lt, g = window.__gaps;
  const win = (a, b) => { const l = lt.filter((x) => x[0] >= a && x[0] < b), gg = g.filter((x) => x[0] >= a && x[0] < b).map((x) => x[1]).sort((p, q) => p - q); return { lt: l.length, ltMs: l.reduce((s, x) => s + x[1], 0), ltMax: Math.max(0, ...l.map((x) => x[1])), frames: gg.length, p50: gg[gg.length >> 1], p95: gg[Math.floor(gg.length * 0.95)], max: gg[gg.length - 1], over34: gg.filter((x) => x > 34).length } };
  const fr = {};
  // the worker's frames: how many reached the page a real second, and the longest wait between two
  for (const [n, a] of Object.entries(window.__fr)) { let gap = 0; for (let i = 1; i < a.length; i++) gap = Math.max(gap, a[i][0] - a[i - 1][0]); const span = a.length > 1 ? a[a.length - 1][0] - a[0][0] : 0; fr[n] = { frames: a.length, fps: span ? +((1000 * (a.length - 1)) / span).toFixed(1) : 0, maxGap: Math.round(gap) }; }
  const rel = (k) => lt.filter((x) => x[0] >= M[k] && x[0] < M[k] + 4500).map((x) => [x[0] - M[k], x[1]]);
  return { ev: (window.__ev || []).filter((e) => e[1] >= M.out0).map((e) => [e[0], e[1] - M.out0]), ltIn: rel("in0"), ltOut: rel("out0"), arcAt: window.__arcAt ? [window.__arcAt[0] - M.out0, window.__arcAt[1]] : null, in: win(M.in0, M.in0 + 4500), out: win(M.out0, M.out0 + 4500), before: win(M.in0 - 3000, M.in0), mounts: window.__mk, patchMs: window.__patch, worker: fr, noLT: !!window.__noLT };
});
const ga = log.hits.filter((h) => /^gloves_/.test(h.en)).map((h) => h.en + (h.ps.entry_source ? "(" + h.ps.entry_source + ")" : "") + (h.ps.last_screen ? "[" + h.ps.last_screen + "]" : ""));
console.log(JSON.stringify({ tag, tIn, tOut, saw, probe, res, rest, ga, errs: log.errs, bad: log.bad.slice(0, 5), shots }, null, 0));
if (cdp) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 }).catch(() => {});
await ctx.close();
await closeAll();
