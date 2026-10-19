// smoke test of a preview page: worker player, slow city (hold loop), skip, scrub
import pw from "playwright";
const [, , D = "A", mode = "desktop", r = ""] = process.argv;
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
const o = mode === "phone" ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const ctx = await br.newContext(o); const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.goto(`file:///Users/daniel.stoic/cromatic-drive/design/intro-lottie/${D}/preview.html${r ? "?r=" + r : ""}`);
const out = "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/lottie-intro/t";
await p.waitForTimeout(3000); console.log("3s", await p.textContent("#info")); await p.screenshot({ path: `${out}/pv-${D}-${mode}-a.png` });
await p.waitForTimeout(8000); console.log("11s", await p.textContent("#info"), "done:", await p.$eval("#done", (e) => e.classList.contains("on")));
await p.click("#slow"); await p.waitForTimeout(10500); console.log("slow 10.5s", await p.textContent("#info"));
await p.click("#skip"); await p.waitForTimeout(400); console.log("skip+0.4", await p.textContent("#info"));
await p.waitForTimeout(2500); console.log("after", await p.textContent("#info"), "done:", await p.$eval("#done", (e) => e.classList.contains("on")));
await p.$eval("#scrub", (e) => { e.value = 330; e.dispatchEvent(new Event("input")); }); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/pv-${D}-${mode}-scrub.png` });
console.log("errors", errs);
await br.close();
