// the welcome card's own main-thread work on a Pixel at 4x: the warm-up (fetch + parse), open(), each mount's sync part
import { ctxFor, closeAll, sleep, throttle, BASE } from "./welcome-lib.mjs";
const [kind = "pixel", cpu = "4"] = process.argv.slice(2);
const { page, ctx } = await ctxFor(kind, { ls: { "cz-consent": "no", "cz-intro-at": String(Date.now()) } });
await page.addInitScript(() => {
  window.__own = [];
  const J = Response.prototype.json;
  Response.prototype.json = function () { const u = this.url, t = performance.now(); return J.call(this).then((v) => { if (/lottie-welcome/.test(u)) window.__own.push(["parse " + u.replace(/.*lottie-/, "").replace(/\.[a-f0-9]{10}\.json/, ""), +(performance.now() - t).toFixed(2), Math.round(t)]); return v; }); };
  const iv = setInterval(() => {
    if (window.czL && !window.czL.__o) { window.czL.__o = 1; const m = window.czL.mount, lib = () => window.lottie; window.czL.mount = (n, o) => { const t = performance.now(); const p = m(n, o); window.__own.push(["mount(sync) " + n, +(performance.now() - t).toFixed(2), Math.round(t)]); return p; };
      const la = window.lottie && window.lottie.loadAnimation; }
    if (window.lottie && window.lottie.loadAnimation && !window.lottie.__o) { window.lottie.__o = 1; const la = window.lottie.loadAnimation; window.lottie.loadAnimation = (p) => { const t = performance.now(); const a = la(p); if (p && p.animationData && /welcome/.test(p.animationData.nm || "")) window.__own.push(["loadAnimation " + p.animationData.nm.replace(/Cromatic · welcome · /, ""), +(performance.now() - t).toFixed(2), Math.round(t)]); return a; }; }
    if (window.czWelcome && !window.czWelcome.__o) { window.czWelcome.__o = 1; const o = window.czWelcome.open; window.czWelcome.open = (el) => { const t = performance.now(); const v = o(el); window.__own.push(["open()", +(performance.now() - t).toFixed(2), Math.round(t)]); return v; }; }
  }, 10);
});
await throttle(page, +cpu);
await page.goto(BASE + "/?map");
await page.waitForSelector(".map-welcome:not(.hidden)", { timeout: 120000 });
await sleep(4000);
const own = await page.evaluate(() => window.__own);
own.forEach((x) => console.log(x.join("  ")));
console.log("total ms", own.reduce((s, x) => s + x[1], 0).toFixed(1));
await ctx.close(); await closeAll();
