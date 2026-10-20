// piece 5 (TASK-009): what the main thread does on the way out of the game (LOCAL, chromium). A CDP trace from the game's
// Escape for 4.5 s: every task over 50 ms with what took most of it (GC, script by file, style, layout, paint).
//   DEV=pixel CPU=4 AB=off|on ENTRY=card|topbar
import { ctxFor, waitMap, sleep, closeAll, BASE, gameFrame, throttle } from "./lib.mjs";
const kind = process.env.DEV || "pixel", entry = process.env.ENTRY || "card";
const ls = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "yes2" };
const { page, ctx } = await ctxFor(kind, { ls });
if (process.env.AB === "off") await page.addInitScript(() => { window.__czL = false; });
const cdp = await page.context().newCDPSession(page);
if (+process.env.CPU > 1) await throttle(page, +process.env.CPU);
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page, 120000); await sleep(6000);
if (entry === "card") {
  await page.evaluate(() => window.__mapGo("gloves"));
  for (let i = 0; i < 120; i++) { await sleep(250); if (await page.evaluate(() => !!document.querySelector(".map-card.in:not(.hidden) .mcd-fight"))) break; }
  await sleep(1500); await page.evaluate(() => document.querySelector(".map-card.in:not(.hidden) .mcd-fight").click());
} else await page.evaluate(() => window.__openGloves("qa"));
const gf = await gameFrame(page, 20000); await sleep(5000);
if (process.env.NOARC) await page.evaluate(() => { window.__czArcadeOut = () => false; }); // (an A/B: the pixels without the camera's pull-back)
const events = [];
cdp.on("Tracing.dataCollected", (e) => { for (const x of e.value) events.push(x); });
await cdp.send("Tracing.start", { categories: "devtools.timeline,v8,v8.execute,disabled-by-default-devtools.timeline,blink.user_timing" + (process.env.STACK ? ",disabled-by-default-devtools.timeline.stack,disabled-by-default-devtools.timeline.invalidationTracking" : ""), transferMode: "ReportEvents" });
await sleep(200);
await gf.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", key: "Escape" })));
await sleep(4500);
const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
await cdp.send("Tracing.end"); await done;
// the renderer's main thread: the thread with the most RunTask on it that has a FunctionCall
const byT = {}; for (const e of events) if (e.name === "RunTask" && e.ph === "X") (byT[e.pid + ":" + e.tid] = byT[e.pid + ":" + e.tid] || []).push(e);
const tids = Object.entries(byT).sort((a, b) => b[1].reduce((s, x) => s + x.dur, 0) - a[1].reduce((s, x) => s + x.dur, 0));
const esc = events.find((e) => e.name === "EventDispatch" && e.args?.data?.type === "keydown") || events.find((e) => e.name === "RunTask");
const t0 = esc ? esc.ts : 0;
for (const [key, tasks] of tids.slice(0, 2)) {
  const [pid, tid] = key.split(":").map(Number);
  const kids = events.filter((e) => e.pid === pid && e.tid === tid && e.ph === "X" && e.name !== "RunTask");
  const long = tasks.filter((t) => t.dur > 50000).sort((a, b) => a.ts - b.ts);
  console.log("thread", key, "tasks", tasks.length, "long", long.length);
  for (const t of long) {
    const inside = kids.filter((k) => k.ts >= t.ts && k.ts + k.dur <= t.ts + t.dur);
    const agg = {};
    for (const k of inside) { let n = k.name; if (n === "FunctionCall" || n === "EvaluateScript") n += " " + String(k.args?.data?.url || "").split("/").pop().slice(0, 30) + ":" + (k.args?.data?.functionName || ""); if (/GC/.test(n)) n = "GC " + k.name; agg[n] = (agg[n] || 0) + k.dur; }
    const top = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, d]) => n + " " + Math.round(d / 1000));
    console.log(Math.round((t.ts - t0) / 1000), "ms +", Math.round(t.dur / 1000), "|", top.join(" · "));
    if (process.env.STACK) for (const k of inside.filter((k) => k.name === "UpdateLayoutTree" && k.dur > 20000)) {
      const st = (k.args?.beginData?.stackTrace || []).slice(0, 4).map((f) => f.functionName + "@" + f.lineNumber + ":" + f.columnNumber).join(" < ");
      // what made it dirty: the invalidations just before it
      const inv = events.filter((e) => e.pid === pid && e.tid === tid && /StyleRecalcInvalidationTracking|StyleInvalidatorInvalidationTracking|ScheduleStyleInvalidationTracking/.test(e.name) && e.ts <= k.ts && e.ts > k.ts - 40000);
      const why = {}; for (const e of inv) { const d = e.args?.data || {}; const kk = (d.reason || e.name) + " " + (d.nodeName || "") + " " + (d.changedClass || d.changedAttribute || d.changedId || d.changedPseudo || d.extraData || ""); why[kk] = (why[kk] || 0) + 1; }
      console.log("   style", Math.round(k.dur / 1000), "ms, elements", k.args?.elementCount, "|", st, "|", Object.entries(why).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([a, b]) => a + " x" + b).join(" ; "));
      if (process.env.STACK === "2") for (const e of inv.slice(0, 8)) console.log("     ", e.name, JSON.stringify(e.args?.data || {}).slice(0, 260));
    }
  }
}
await ctx.close(); await closeAll();
