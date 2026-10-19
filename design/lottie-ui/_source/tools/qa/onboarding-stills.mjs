// lottie-ui piece 2: stills of /onboarding/ at each explainer (the explainer itself hidden) and where its box is, for the
// frame-exact previews. DEV=desktop|pixel  -> design/lottie-ui/_source/tools/bg/onb-<k>-<ab>.jpg + onb-rects-<ab>.json
import { ctxFor, sleep, closeAll, BASE } from "./lib.mjs";
import fs from "fs";
const kind = process.env.DEV || "desktop", ab = kind === "desktop" ? "desktop" : "phone", OUT = "/Users/daniel.stoic/cromatic-lottie-ui/design/lottie-ui/_source/tools/bg";
const { page, log } = await ctxFor(kind, { consent: "no" });
await page.goto(BASE + "/onboarding/", { waitUntil: "load" }); await sleep(2500);
const rects = {};
for (const k of ["drive", "views", "places", "game", "worlds"]) {
  await page.evaluate((k) => { const b = document.querySelector(`[data-czl="${k}"]`); window.scrollTo(0, b.getBoundingClientRect().top + scrollY - innerHeight * (innerWidth < 760 ? 0.62 : 0.45)); }, k);
  await sleep(4500);
  await page.evaluate((k) => { document.querySelector(`[data-czl="${k}"]`).style.visibility = "hidden"; }, k);
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/onb-${k}-${ab}.jpg`, type: "jpeg", quality: 84 });
  rects[k] = await page.evaluate((k) => { const b = document.querySelector(`[data-czl="${k}"]`); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, name: b._p ? b._p.data.nm : null, th: b._th }; }, k);
  await page.evaluate((k) => { document.querySelector(`[data-czl="${k}"]`).style.visibility = ""; }, k);
}
fs.writeFileSync(`${OUT}/onb-rects-${ab}.json`, JSON.stringify(rects, null, 1));
console.log(JSON.stringify(rects), log.errs);
await closeAll();
