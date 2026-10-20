// node flows.mjs <kind>  : hover / focus / fold / actions / reduced motion / Sketchbook / idle checks
import { ctxFor, closeAll, sleep, SH, BASE } from "./welcome-lib.mjs";
const kind = process.argv[2] || "desktop", only = process.argv[3] || "all";
const R = {};
const st = (page) => page.evaluate(() => window.czWelcome?.state());
const playing = (page) => page.evaluate(() => [...document.querySelectorAll(".map-welcome .czl")].length);
async function boot(extra = {}, ls = {}) {
  const L0 = { "cz-consent": "no", "cz-intro-at": String(Date.now()), ...ls }; for (const k in L0) if (L0[k] == null) delete L0[k];
  const x = await ctxFor(kind, { ls: L0, extra });
  await x.page.goto(BASE + "/?map");
  await x.page.waitForSelector(".map-welcome:not(.hidden)", { timeout: 90000 });
  return x;
}
const phone = kind !== "desktop" && kind !== "laptop";
if (only === "all" || only === "main") {
  const { page, log, ctx } = await boot();
  await sleep(6500);
  R.idle = await st(page);
  // nothing playing at rest: every piece paused (the worker draws nothing)
  R.pausedAtRest = await page.evaluate(() => { const s = window.czWelcome.state(); return s; });
  if (!phone) {
    const box = async (sel) => { const b = await (await page.$(sel)).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    let [x, y] = await box(".map-welcome .mw-how > span:nth-of-type(3) i"); await page.mouse.move(x, y); await sleep(700);
    R.hoverWork = (await st(page)).st;
    [x, y] = await box('.map-welcome [data-go="end"]'); await page.mouse.move(x, y); await sleep(700);
    R.hoverOlari = (await st(page)).st;
    await page.screenshot({ path: `${SH}/${kind}-hover-olari.png` });
    await page.mouse.move(5, 5); await sleep(3200);
    R.afterLeave = (await st(page)).st;
    // the keyboard: Tab through the card (the focus order), the drive explainer loops on "Drive it yourself"
    const order = [];
    await page.evaluate(() => document.querySelector(".map-welcome .mw-x").focus());
    order.push("mw-x (focused)");
    for (let i = 0; i < 12 && order.length < 9; i++) {
      await page.keyboard.press("Tab");
      const a = await page.evaluate(() => { const e = document.activeElement; return e && e.closest(".map-welcome") ? (e.className || e.tagName) + (e.dataset.go ? ":" + e.dataset.go : "") : null; });
      if (a && !order.includes(a)) order.push(a);
      if (a && a.includes("mw-go")) { await sleep(600); R.focusGo = (await st(page)).st; R.focusVisible = await page.evaluate(() => document.activeElement.matches(":focus-visible")); }
    }
    R.focusOrder = order;
  }
  // × : it folds away, the pieces go, the first-time guide follows
  await page.click(".map-welcome .mw-x");
  await sleep(60);
  R.foldClass = await page.evaluate(() => document.querySelector(".map-welcome").className);
  await sleep(400);
  R.afterClose = await page.evaluate(() => ({ cls: document.querySelector(".map-welcome").className, state: window.czWelcome.state(), canvases: document.querySelectorAll(".map-welcome .czl").length, guide: !!document.querySelector(".map-guide:not(.hidden), .n2-tut:not(.hidden), .mg-start:not(.hidden)") }));
  // open again (forced), the first street: it folds and the drive there starts
  await page.evaluate(() => window.__welcome(true)); await sleep(1800);
  await page.click('.map-welcome [data-go="tm"]'); await sleep(500);
  R.afterStreet = await page.evaluate(() => ({ hidden: document.querySelector(".map-welcome").classList.contains("hidden"), moving: !!document.querySelector(".n2-auto:not(.hidden)") || document.body.className }));
  R.errs = log.errs; R.bad = log.bad;
  await ctx.close();
}
if (only === "all" || only === "rm") {
  const { page, log, ctx } = await boot({ reducedMotion: "reduce" });
  await sleep(2500);
  R.rm = await page.evaluate(() => ({ cls: document.querySelector(".map-welcome").className, state: window.czWelcome.state(), running: document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest(".map-welcome") && a.playState === "running").length }));
  await page.screenshot({ path: `${SH}/${kind}-rm.png` });
  await page.click(".map-welcome .mw-x"); await sleep(30);
  R.rmClose = await page.evaluate(() => document.querySelector(".map-welcome").className);
  R.rmErrs = log.errs;
  await ctx.close();
}
if (only === "all" || only === "sketch") {
  const { page, log, ctx } = await boot();
  await page.click(".map-welcome .mw-x"); await sleep(500);
  await page.evaluate(() => window.__scheme("sketch")); await sleep(2500);
  await page.evaluate(() => window.__welcome(true)); await sleep(5500);
  R.sketch = await st(page);
  await page.screenshot({ path: `${SH}/${kind}-sketch.png` });
  R.skErrs = log.errs;
  await ctx.close();
}
if (only === "cookie") {
  const { page, log, ctx } = await boot({}, { "cz-consent": null });
  const ck = () => page.evaluate(() => { const c = document.getElementById("cz-ck"), w = document.querySelector(".map-welcome"); if (!c) return "no cookie card"; const a = c.getBoundingClientRect(), b = w.getBoundingClientRect(), cs = getComputedStyle(c); return { ckOpacity: cs.opacity, ckTop: Math.round(a.top), ckBottom: Math.round(a.bottom), wTop: Math.round(b.top), wBottom: Math.round(b.bottom), overlap: !(a.bottom <= b.top || b.bottom <= a.top || a.right <= b.left || b.right <= a.left), ckw: document.body.classList.contains("ck-welcome") }; });
  await sleep(3000); R.ck3 = await ck();
  await sleep(18500); R.ck21 = await ck();
  await page.screenshot({ path: `${SH}/${kind}-cookie21.png` });
  R.ckErrs = log.errs;
  await ctx.close();
}
console.log(JSON.stringify(R, null, 1));
await closeAll();
