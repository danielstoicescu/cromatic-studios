// lottie-ui piece 2: /onboarding/'s explainers on the real page: lazy (nothing fetched before its card is near), mounted,
// playing while on screen, paused off it, the theme of its card, console clean. DEV=desktop|pixel|iphone RO=1 RM=1 THR=4
import { ctxFor, sleep, closeAll, BASE, shot, throttle } from "./lib.mjs";
import { fpsArm, fpsRead } from "./fps.mjs";
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "onb1", path = process.env.RO ? "/ro/onboarding/" : "/onboarding/";
const { page, log } = await ctxFor(kind, { consent: "no", extra: process.env.RM ? { reducedMotion: "reduce" } : {} });
const reqs = []; page.on("request", (r) => { const u = r.url(); if (/lottie-|czl-onb|intro-worlds/.test(u)) reqs.push([Date.now(), u.replace(/^https?:\/\/[^/]+/, "").replace(/\.[0-9a-f]{10}\./, ".")]); });
await page.goto(BASE + path, { waitUntil: "load" });
if (process.env.THR) await throttle(page, +process.env.THR);
await sleep(2500);
console.log("at load:", reqs.map((r) => r[1]).join(" "));
const boxes = await page.evaluate(() => [...document.querySelectorAll("[data-czl]")].map((b) => b.dataset.czl));
for (const k of boxes) {
  const n0 = reqs.length;
  await page.evaluate((k) => { const b = document.querySelector(`[data-czl="${k}"]`); const z = b.closest(".zstep, .zpin, section"); window.scrollTo(0, b.getBoundingClientRect().top + scrollY - innerHeight * (innerWidth < 760 ? 0.62 : 0.45)); }, k);
  await sleep(2600);
  const st = await page.evaluate((k) => { const b = document.querySelector(`[data-czl="${k}"]`); const r = b.getBoundingClientRect(); return { on: b.classList.contains("on"), fail: b.classList.contains("czl-fail"), playing: !!b._playing, th: b._th, r: [r.left, r.top, r.width, r.height].map(Math.round), disp: getComputedStyle(b).display }; }, k);
  if (st.on && !process.env.RM) { await page.evaluate((k) => { window.__czlProbe = document.querySelector(`[data-czl="${k}"]`); }, k); await fpsArm(page, "() => window.__czlProbe && window.__czlProbe._p"); await sleep(2000); }
  const fps = st.on && !process.env.RM ? await fpsRead(page) : null;
  console.log(k, JSON.stringify(st), "fetched:", reqs.slice(n0).map((r) => r[1]).join(" ") || "-", fps ? "frames " + JSON.stringify(fps) : "");
  await shot(page, `${tag}-${kind}-${k}`);
}
// off screen they pause
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(1500);
console.log("paused at the top:", await page.evaluate(() => [...document.querySelectorAll("[data-czl]")].map((b) => b.dataset.czl + ":" + (b._playing ? "playing" : "paused")).join(" ")));
console.log("errors:", log.errs, "bad:", log.bad.slice(0, 6));
await closeAll();
