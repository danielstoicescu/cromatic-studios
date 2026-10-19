// Lottie intro research: clean stills of the map's first frame (no UI) for the preview pages' handoff
import pw from "playwright";
const OUT = process.argv[2];
const BASE = process.env.BASE || "http://localhost:8571";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
for (const [name, o] of [["desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }], ["phone", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: pw.devices["Pixel 7"].userAgent }]]) {
  const ctx = await br.newContext(o);
  await ctx.route(/google-analytics|googletagmanager|doubleclick/, (r) => r.fulfill({ status: 204, body: "" }));
  await ctx.addInitScript(() => { try { localStorage.setItem("cz-consent", "no"); localStorage.setItem("cz-welcome-at", String(Date.now())); localStorage.setItem("cz-map-guide", "1"); localStorage.setItem("cz-drive-guide", "2"); } catch {} });
  const page = await ctx.newPage();
  // the full intro, so the camera ends exactly where the opening hands over
  await page.goto(BASE + "/?intro", { waitUntil: "commit" });
  await page.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready && !document.querySelector(".i4"), null, { timeout: 60000 }).catch(() => {});
  await sleep(600);
  await page.addStyleTag({ content: ".ui-root,.nav2-ui,#cz-ck,.kz,.kz-lens-layer,.i4-pre,.i4-host{display:none!important}" });
  await sleep(400);
  await page.screenshot({ path: `${OUT}/city-${name}.png` });
  await ctx.close();
}
await br.close();
