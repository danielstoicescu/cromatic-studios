// Cromatic · diorama renders (TASK-118): a long-lived browser on the local map (?map&story), driven over HTTP.
// POST / with a JS body (an async function body: p = the page, fs, log) -> its return value as JSON. LOCAL ONLY.
//   BASE=http://localhost:8796 PORT=8797 [DEV=1] [HEADED=1] node harness.mjs
// DEV=1 serves src/app.js fresh (devapp.mjs) in place of the built bundle, so the map's working copy is rendered
// without a full build. /__dr/... serves this folder, /__three/... three's ES modules (examples too), /__hero/...
// Radu's hero car (TASK-112, ~/cromatic-herocar/design/hero-car/src) when it is there.
// The page's clock is virtual once the renders start (__vclock.freeze()): performance.now() and the frame callbacks
// only move when a render asks (__vclock.tick(dt)), so the city's own motion (water, traffic, the fountain) follows the
// story's time, never the time a frame took to render.
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import http from "http";
import fs from "fs";
import path from "path";
import { devApp } from "./devapp.mjs";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), ROOT = path.resolve(HERE, "../..");
const BASE = process.env.BASE || "http://localhost:8796", PORT = +process.env.PORT || 8797;
const VW = +process.env.VW || 1080, VH = +process.env.VH || 1920;
const HERO = process.env.HERO_DIR || "/Users/daniel.stoic/cromatic-herocar/design/hero-car/src";
const THREE_DIR = [path.join(HERE, "node_modules/three"), path.join(ROOT, "node_modules/three")].find((d) => fs.existsSync(d));
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".cube": "text/plain", ".bin": "application/octet-stream" };
const br = await pw.chromium.launch({ headless: !process.env.HEADED, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu", "--disable-gpu-watchdog", "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows"] });
const ctx = await br.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
let APP = null;
if (process.env.DEV) await ctx.route(/\/assets\/app\.[0-9a-f]+\.js$/, async (r) => { APP = APP || (await devApp(ROOT)); r.fulfill({ status: 200, body: APP, headers: { "content-type": "text/javascript" } }); });
const serve = (dir) => (r) => { const u = decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\/__\w+\//, ""), f = path.join(dir, u); if (!f.startsWith(dir) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: "404" }); r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" } }); };
await ctx.route(/\/__dr\//, serve(HERE));
await ctx.route(/\/__three\//, serve(THREE_DIR));
await ctx.route(/\/__hero\//, serve(HERO));
await ctx.addInitScript(() => {
  const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" };
  try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {}
  // the virtual clock
  const realNow = performance.now.bind(performance), realRAF = window.requestAnimationFrame.bind(window), realCAF = window.cancelAnimationFrame.bind(window);
  let frozen = false, vt = 0, nextId = 1e6; const q = new Map();
  performance.now = () => (frozen ? vt : realNow());
  window.requestAnimationFrame = (cb) => { if (!frozen) return realRAF(cb); const id = nextId++; q.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { if (q.has(id)) q.delete(id); else realCAF(id); };
  window.__vclock = {
    freeze() { if (!frozen) { vt = realNow(); frozen = true; } return vt; },
    // dt seconds on, then the frame callbacks that were waiting (the map's loop among them), once
    tick(dt = 1 / 30) { vt += dt * 1000; const list = [...q.entries()]; q.clear(); for (const [, cb] of list) { try { cb(vt); } catch (e) { console.error("tick", e && e.message); } } return vt; },
    thaw() { frozen = false; const list = [...q.values()]; q.clear(); for (const cb of list) realRAF(cb); },
    get t() { return vt; }, get frozen() { return frozen; }
  };
});
const p = await ctx.newPage();
const logs = [];
p.on("pageerror", (e) => logs.push("pageerror " + e.message));
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(m.type() + " " + m.text().slice(0, 300)); });
const t0 = Date.now();
await p.goto(BASE + (process.env.PATH0 || "/?map&story"), { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready && window.__story, null, { timeout: 240000 });
await p.waitForTimeout(3000);
const gpu = await p.evaluate(() => { const gl = window.__story.renderer.getContext(), d = gl.getExtension("WEBGL_debug_renderer_info"); return { renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE), floatBlend: !!gl.getExtension("EXT_float_blend"), cbf: !!gl.getExtension("EXT_color_buffer_float") }; });
console.log("ready", ((Date.now() - t0) / 1000).toFixed(1) + "s", JSON.stringify(gpu));
const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
http.createServer(async (req, res) => {
  let body = ""; for await (const c of req) body += c;
  try { const out = await new AsyncFn("p", "fs", "logs", "path", body)(p, fs, logs, path); res.end(JSON.stringify(out ?? null)); }
  catch (e) { res.statusCode = 500; res.end(String(e.stack || e) + "\n" + logs.slice(-12).join("\n")); }
}).listen(PORT, () => console.log("listening", PORT));
