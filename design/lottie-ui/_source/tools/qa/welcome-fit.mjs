// does the card fit? short phones and laptops: the card, its inner scroll, the X, the last button, after the entrance
import { pw, browserFor, closeAll, sleep, SH, BASE } from "./welcome-lib.mjs";
const VPS = [["iphone13", "webkit", { ...pw.devices["iPhone 13"] }], ["iphoneSE2", "chromium", { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ["android360", "chromium", { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ["iphoneSE1", "chromium", { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ["pixel7", "chromium", { ...pw.devices["Pixel 7"] }], ["laptop720", "chromium", { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 }], ["landscape", "chromium", { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }]];
const which = process.argv[2] ? process.argv[2].split(",") : null;
const tag = process.argv[3] || "fit";
for (const [nm, b, o] of VPS) {
  if (which && !which.includes(nm)) continue;
  const br = await browserFor(b); const o2 = { ...o }; delete o2.defaultBrowserType;
  const ctx = await br.newContext(o2);
  await ctx.route(/google-analytics|googletagmanager|bzrcdn|doubleclick/, (r) => r.fulfill({ status: 204, body: "" }));
  await ctx.addInitScript(() => { if (!sessionStorage.getItem("q")) { localStorage.setItem("cz-consent", "no"); localStorage.setItem("cz-intro-at", String(Date.now())); sessionStorage.setItem("q", 1); } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/?map");
  await page.waitForSelector(".map-welcome:not(.hidden)", { timeout: 90000 });
  await sleep(2600);
  const m = await page.evaluate(() => {
    const w = document.querySelector(".map-welcome"), inn = w.querySelector(".mw-in"), r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    const top = document.querySelector(".map-top"), tb = top ? top.getBoundingClientRect() : null;
    return { vp: [innerWidth, innerHeight], card: r(w), scroll: inn.scrollHeight - inn.clientHeight, x: r(w.querySelector(".mw-x")), go: r(w.querySelector(".mw-go")), tap: r(w.querySelector(".mw-tap")), topBarBottom: tb ? Math.round(tb.bottom) : null, icons: [...w.querySelectorAll(".mw-how i")].map((i) => i.offsetWidth) };
  });
  m.fits = m.scroll <= 1 && m.card[3] <= m.vp[1] && m.card[1] >= 0;
  console.log(nm, JSON.stringify(m));
  await page.screenshot({ path: `${SH}/${tag}-${nm}.png` });
  await ctx.close();
}
await closeAll();
