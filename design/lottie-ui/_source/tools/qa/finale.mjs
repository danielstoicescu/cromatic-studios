// lottie-ui piece 1 (the plane finale), on the real site: send the pass (fake QA data, LOCAL ONLY), the stamp, the walk,
// the climb into the clouds, the end card, Back to the map through the clouds. Records a video (CDP screencast) and logs
// the timeline, the POST and the console. DEV=desktop|iphone|pixel  THR=4 (CPU throttle, chromium)  SKIP=1 (tap to skip)
import { ctxFor, waitMap, shot, sleep, closeAll, BASE, tapSel, openAndFillPass, throttle, Q } from "./.x-lui-lib.mjs";
import fs from "fs";
import { fpsArm, fpsRead } from "./.x-lui-fps.mjs";
if (!/localhost|127\.0\.0\.1/.test(BASE)) { console.log("local only"); process.exit(1); }
const kind = process.env.DEV || "desktop", tag = process.env.TAG || "f1", phone = kind !== "desktop" && kind !== "laptop";
const vdir = `${Q}/vid-${tag}-${kind}`; fs.rmSync(vdir, { recursive: true, force: true });
const LS = process.env.RO ? { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-lang": "ro" } : "seen";
const { ctx, page, log } = await ctxFor(kind, { consent: "yes2", ls: LS, extra: process.env.RM ? { reducedMotion: "reduce" } : process.env.VID ? { recordVideo: { dir: vdir, size: phone ? { width: 390, height: kind === "iphone" ? 664 : 844 } : { width: 1440, height: 900 } } } : {} });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await waitMap(page); await sleep(2500);
if (process.env.THR) await throttle(page, +process.env.THR);
await openAndFillPass(page, phone);
await page.evaluate(() => { window.__lt = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: false }); } catch (e) {} });
const respP = page.waitForResponse((r) => r.url().includes("/api/boarding"), { timeout: 20000 }).catch(() => null);
const t0 = Date.now();
await tapSel(page, ".cform .cf-submit", phone);
const resp = await respP; console.log("POST /api/boarding:", resp ? resp.status() : "none", resp ? await resp.text().catch(() => "") : "", resp ? JSON.stringify(resp.request().postDataJSON()).slice(0, 160) : "");
await sleep(400); await shot(page, `${tag}-${kind}-stamp0`); await sleep(1100); await shot(page, `${tag}-${kind}-stamp1`);
console.log("stamp:", await page.evaluate(() => { const s = document.querySelector(".czl-stamp, .czl-stamp-still"); if (!s) return null; const r = s.getBoundingClientRect(); return { cls: s.className, r: [r.left, r.top, r.width, r.height].map(Math.round) }; }));
await fpsArm(page, "() => window.czFinale && window.czFinale.piece()");
const tl = []; let endSeen = 0, skipped = false;
for (let i = 0; i < 120; i++) {
  await sleep(100);
  const s = await page.evaluate(() => ({ b: document.body.className.split(" ").filter((c) => /board|jet|flight|cine|czl/.test(c)).join(" "), fin: window.czFinale?.state(), end: (document.querySelector(".flight-end")?.className || "").replace("flight-end", "").trim() || null }));
  const k = JSON.stringify(s); if (tl.at(-1)?.k !== k) tl.push({ t: ((Date.now() - t0) / 1000).toFixed(1), k });
  if (process.env.SKIP && !skipped && /jet-cine/.test(s.b)) { skipped = true; await sleep(600); await page.mouse.click(200, 300); }
  if (s.end && /fe-in/.test(s.end) && !endSeen) { endSeen = i; }
  if (endSeen && i > endSeen + 22) break;
}
await shot(page, `${tag}-${kind}-end`);
console.log("worker frames (clouds in + reveal):", JSON.stringify(await fpsRead(page)));
console.log("long tasks (main thread) since send:", JSON.stringify(await page.evaluate(() => { const l = window.__lt || []; return { n: l.length, max: Math.max(0, ...l.map((x) => x[1])), list: l.slice(-12) }; })));
console.log("timeline:\n " + tl.map((x) => x.t + "s " + x.k).join("\n "));
console.log("end card:", await page.evaluate(() => { const e = document.querySelector(".flight-end"); if (!e) return null; const r = e.getBoundingClientRect(); return { r: [r.left, r.top, r.right, r.bottom].map(Math.round), lang: e.lang, txt: e.innerText.replace(/\s+/g, " ").slice(0, 160) }; }));
if (endSeen) {
  const tb = Date.now(); await tapSel(page, ".flight-end .fe-map", phone);
  const tl2 = [];
  for (let i = 0; i < 40; i++) { await sleep(100); const s = await page.evaluate(() => ({ b: document.body.className.split(" ").filter((c) => /board|jet|flight|czl/.test(c)).join(" "), fin: window.czFinale?.state(), end: !!document.querySelector(".flight-end"), cv: !!document.querySelector(".czl-finale") })); const k = JSON.stringify(s); if (tl2.at(-1)?.k !== k) tl2.push({ t: ((Date.now() - tb) / 1000).toFixed(1), k }); }
  console.log("back:\n " + tl2.map((x) => x.t + "s " + x.k).join("\n "));
  await shot(page, `${tag}-${kind}-back`);
  await page.evaluate(() => window.__mapGo("tm")); await sleep(2500);
  console.log("drives after:", await page.evaluate(() => window.__nav2.state().auto));
}
console.log("errors:", log.errs); console.log("bad:", log.bad);
await ctx.close(); await closeAll();
if (process.env.VID) { const f = fs.readdirSync(vdir).find((x) => x.endsWith(".webm")); console.log("video", `${vdir}/${f}`); }
