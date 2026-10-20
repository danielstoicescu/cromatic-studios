import { ctxFor, closeAll, sleep, BASE } from "./welcome-lib.mjs";
const { page, ctx } = await ctxFor("desktop", { ls: { "cz-consent": "no", "cz-intro-at": String(Date.now()) } });
await page.addInitScript(() => { window.__pc = {}; const iv = setInterval(() => { if (window.czL && !window.czL.__h) { window.czL.__h = 1; const m = window.czL.mount; window.czL.mount = (n, o) => m(n, o).then((p) => { if (p) { window.__pc[n] = 0; p.anim.addEventListener("enterFrame", () => window.__pc[n]++); } return p; }); clearInterval(iv); } }, 10); });
await page.goto(BASE + "/?map");
await page.waitForSelector(".map-welcome:not(.hidden)", { timeout: 90000 });
await sleep(1500);
const snap = () => page.evaluate(() => ({ ...window.__pc }));
const a = await snap();
await page.evaluate(() => document.body.classList.add("map-boarding")); // (the boarding pass hides the card: display none)
await sleep(300); const b = await snap(); await sleep(1500); const c = await snap();
await page.evaluate(() => document.body.classList.remove("map-boarding"));
await sleep(1500); const d = await snap();
await sleep(5000); const e = await snap(); await sleep(2000); const f = await snap();
console.log(JSON.stringify({ playing: a, hiddenStart: b, hiddenAfter1500: c, shownAgain1500: d, rest: e, rest2s: f, state: await page.evaluate(() => window.czWelcome.state()) }));
await ctx.close(); await closeAll();
