import { ctxFor, closeAll, sleep, SH, BASE } from "./welcome-lib.mjs";
for (const lang of ["ro", "en"]) {
  const ls = { "cz-consent": "no", "cz-intro-at": String(Date.now()) }; if (lang === "ro") ls["cz-lang"] = "ro";
  const { page, log, ctx } = await ctxFor("desktop", { ls });
  await page.goto(BASE + "/?map");
  await page.waitForSelector(".map-welcome:not(.hidden)", { timeout: 90000 });
  const tw = await page.evaluate(() => performance.now());
  await sleep(3000);
  const r = await page.evaluate((tw) => ({
    lang: document.documentElement.lang, czRo: window.czL && window.czL.ro(),
    title: document.querySelector(".map-welcome .mw-t").textContent, heading: document.querySelector(".map-welcome .mw-t").getAttribute("role"),
    steps: [...document.querySelectorAll(".map-welcome .mw-how b")].map((b) => b.textContent),
    canvasesHidden: [...document.querySelectorAll(".map-welcome .czl")].every((c) => c.getAttribute("aria-hidden") === "true"),
    res: performance.getEntriesByType("resource").filter((e) => /lottie-welcome/.test(e.name)).map((e) => [e.name.replace(/.*lottie-/, "").replace(/\.[a-f0-9]{10}\.json/, ""), Math.round(e.startTime), Math.round(e.responseEnd), e.encodedBodySize, e.transferSize]),
    tw: Math.round(tw), state: window.czWelcome.state()
  }), tw);
  console.log(lang, JSON.stringify(r));
  if (lang === "ro") await page.screenshot({ path: `${SH}/ro.png` });
  console.log(JSON.stringify(log));
  await ctx.close();
}
await closeAll();
