// lottie-ui piece 3: a case page in the map's frame asks for the boarding pass (its ticket's "Begin boarding"): the frame
// fades as before (no pill on top), the pass comes out (LOCAL)
import { ctxFor, waitMap, sleep, closeAll, BASE, shot } from "./lib.mjs";
const kind = process.env.DEV || "desktop";
const { page, log } = await ctxFor(kind, { consent: "yes2" });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2000);
await page.evaluate(() => window.__openGloves && document.querySelector(".case-frame") && (window.__casePage ? 1 : 1));
// open a case page in the frame the map's way
await page.evaluate(() => { const pg = window.__casePage?.("Antila") || "antila"; document.querySelector(".map-card .mcd-close")?.click(); window.__czOpenFrame ? 0 : 0; });
await page.evaluate(() => window.__mapGo("antila"));
for (let i = 0; i < 60; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(1000);
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click());
let fr = null;
for (let i = 0; i < 60 && !fr; i++) { await sleep(250); fr = page.frames().find((f) => /\/(work|proiecte)\//.test(f.url())); }
await sleep(2000);
console.log("frame:", fr && fr.url().replace(BASE, ""));
// as the page's ticket does (build/board.mjs): "the pass, from behind my ticket, there"
await fr.evaluate(() => window.parent.postMessage({ cz: "boarding", rect: { left: 120, top: 260, width: 520, height: 220 } }, location.origin));
for (let i = 0; i < 30; i++) { await sleep(200); if (await page.evaluate(() => document.body.classList.contains("map-boarding"))) break; }
await sleep(1500); await shot(page, `pill3-${kind}-pass`);
console.log("boarding open:", await page.evaluate(() => ({ boarding: document.body.classList.contains("map-boarding"), frameHidden: document.querySelector(".case-frame").classList.contains("hidden"), vis: document.querySelector(".case-frame").style.visibility, window: !!document.querySelector(".czpf"), form: !!document.querySelector(".cform") })));
console.log("errors:", log.errs, "bad:", log.bad);
await closeAll();
