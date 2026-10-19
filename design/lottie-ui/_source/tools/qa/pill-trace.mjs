// pill-stab: what the renderer's main thread does during the pill's grow (Pixel x4): trace events by name in the window
import { ctxFor, waitMap, sleep, closeAll, BASE, browserFor } from "./lib.mjs";
const kind = process.env.DEV || "pixel";
const { page, ctx } = await ctxFor(kind, { consent: "yes2" });
await ctx.addInitScript(() => { const A = Element.prototype.animate; Element.prototype.animate = function (k, o) { try { if (Array.isArray(k) && k.length > 10 && this.classList.contains("cf-in")) performance.mark(o.duration === 480 ? "czpf-grow" : "czpf-shrink"); } catch (e) {} return A.call(this, k, o); }; });
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(2500);
const cdp = await ctx.newCDPSession(page);
await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 4e6 / 8, uploadThroughput: 1e6 / 8 });
if (process.env.THR) await cdp.send("Emulation.setCPUThrottlingRate", { rate: +process.env.THR });
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 80; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2000);
const br = await browserFor(kind);
await br.startTracing(page, { categories: ["toplevel", "devtools.timeline", "disabled-by-default-devtools.timeline", "blink.user_timing", "blink", "cc", "benchmark", "blink.animations", "disabled-by-default-devtools.timeline.frame", "viz"] });
await page.evaluate(() => document.querySelector(".map-card:not(.hidden) .mcd-open").click());
await sleep(+(process.env.MS || 3500));
await page.evaluate(() => document.querySelector(".case-frame .cf-close").click());
await sleep(1500);
const ev = JSON.parse((await br.stopTracing()).toString()).traceEvents;
const tn = {}; for (const e of ev) if (e.ph === "M" && e.name === "thread_name") tn[e.pid + ":" + e.tid] = e.args.name;
const mk = (n) => ev.find((e) => e.name === n && /user_timing/.test(e.cat));
for (const [nm, D] of [["czpf-grow", 480], ["czpf-shrink", 420]]) {
  const m = mk(nm); if (!m) { console.log("no mark", nm); continue; }
  const a = m.ts, b = m.ts + D * 1000, main = m.pid + ":" + m.tid;
  const by = {}; let top = 0, frames = [];
  for (const e of ev) {
    if (e.ph !== "X" || !e.dur || e.ts < a || e.ts > b) continue;
    const t = e.pid + ":" + e.tid;
    if (t !== main) continue;
    if (/RunTask/.test(e.name) && /toplevel/.test(e.cat)) { top += e.dur; continue; }
    by[e.name] = (by[e.name] || 0) + e.dur;
  }
  console.log(`== ${nm}: main thread busy ${Math.round(top / 1000)} ms of ${D}`);
  const inW = (e) => e.ts >= a && e.ts <= b;
  const cnt = (re) => ev.filter((e) => inW(e) && re.test(e.name)).length;
  console.log("   BeginMainFrame (main):", ev.filter((e) => inW(e) && e.name === "ProxyMain::BeginMainFrame" && e.pid + ":" + e.tid === main).length, "| compositor draws:", ev.filter((e) => inW(e) && /ScheduledActionDraw|DrawFrame/.test(e.name) && e.pid === m.pid).length, "| viz frames:", cnt(/^Graphics.Pipeline|DisplayScheduler::DrawAndSwap|Display::DrawAndSwap/));
  const fails = ev.filter((e) => e.name === "Animation" && e.args && e.args.data && e.args.data.compositeFailed).map((e) => e.args.data.compositeFailed + (e.args.data.unsupportedProperties ? ":" + e.args.data.unsupportedProperties : ""));
  console.log("   composite failed:", [...new Set(fails)].join(" ") || "none", "| paint by frame:", JSON.stringify(ev.filter((e) => inW(e) && e.name === "Paint" && e.pid + ":" + e.tid === main).reduce((o, e) => { const f = (e.args.data && e.args.data.frame || "?").slice(-6); o[f] = (o[f] || 0) + Math.round(e.dur / 1000); return o; }, {})));
  Object.entries(by).sort((x, y) => y[1] - x[1]).slice(0, 14).forEach(([k, v]) => console.log("   ", String(Math.round(v / 1000)).padStart(5), "ms", k));
}
await closeAll();
