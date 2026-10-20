// Cromatic · stories in Lottie (TASK-057): a long-lived browser on the local build of the map, driven over HTTP, for
// the renders of the city's layers. POST /run with a JS body (an async function body in Node: `p` is the page, `fs`,
// `log`); the answer is what it returns, as JSON. LOCAL ONLY (the build served by server.js on BASE).
//   BASE=http://localhost:8961 PORT=8962 VW=1080 VH=1920 DPR=2 node harness.mjs
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import http from "http";
import fs from "fs";
const BASE = process.env.BASE || "http://localhost:8961", PORT = +process.env.PORT || 8962;
const VW = +process.env.VW || 1080, VH = +process.env.VH || 1920, DPR = +process.env.DPR || 2;
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });
// (the site's analytics never leave this machine)
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} });
const p = await ctx.newPage();
const logs = [];
p.on("pageerror", (e) => logs.push("pageerror " + e.message));
p.on("console", (m) => { if (m.type() === "error") logs.push("console " + m.text().slice(0, 200)); });
await p.goto(BASE + (process.env.PATH0 || "/?map"), { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(2500);
console.log("ready", VW, VH, DPR);
const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
http.createServer(async (req, res) => {
  let body = ""; for await (const c of req) body += c;
  try {
    const fn = new AsyncFn("p", "fs", "logs", "br", "ctx", body);
    const out = await fn(p, fs, logs, br, ctx);
    res.end(JSON.stringify(out ?? null));
  } catch (e) { res.statusCode = 500; res.end(String(e.stack || e)); }
}).listen(PORT, () => console.log("listening", PORT));
