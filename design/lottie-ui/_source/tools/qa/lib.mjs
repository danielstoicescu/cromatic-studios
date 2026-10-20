// Lottie UI (lottie-ui branch): shared helpers, from .x-qalib.mjs. GA / Google / OpenAI hits are caught here and never reach the real property.
import pw from "playwright";
export const Q = "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/lottie-ui/shots";
export const BASE = process.env.BASE || "http://localhost:8931";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DEV = {
  desktop: () => ({ b: "chromium", o: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } }),
  laptop: () => ({ b: "chromium", o: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 } }),
  iphone: () => ({ b: "webkit", o: { ...pw.devices["iPhone 13"] } }),
  iphoneL: () => ({ b: "webkit", o: { ...pw.devices["iPhone 13 landscape"] } }),
  pixel: () => ({ b: "chromium", o: { ...pw.devices["Pixel 7"] } }),
  pixelL: () => ({ b: "chromium", o: { ...pw.devices["Pixel 7 landscape"] } })
};
const browsers = {};
export async function browserFor(kind) {
  const { b } = DEV[kind]();
  if (!browsers[b]) browsers[b] = await (b === "webkit" ? pw.webkit.launch() : pw.chromium.launch({ args: ["--use-angle=metal", "--enable-precise-memory-info", "--js-flags=--expose-gc"] }));
  return browsers[b];
}
export async function closeAll() { for (const k in browsers) await browsers[k].close().catch(() => {}); }
// ls: localStorage presets. "fresh" = nothing; "seen" = consent no + guides seen; {k:v}
export async function ctxFor(kind, { ls = "seen", consent = null, extra = {} } = {}) {
  const br = await browserFor(kind);
  const { o } = DEV[kind]();
  const ctx = await br.newContext({ ...o, ...extra });
  const log = { hits: [], google: [], errs: [], bad: [], reqs: 0 };
  await ctx.route(/google-analytics\.com|analytics\.google\.com|\/g\/collect/, async (r) => {
    const u = new URL(r.request().url()), body = r.request().postData() || "";
    for (const l of body ? body.split("\n") : [""]) { const q = new URLSearchParams(l); const en = q.get("en") || u.searchParams.get("en"); const ps = {}; for (const [k, v] of [...u.searchParams, ...q]) if (/^(ep|epn)\./.test(k)) ps[k.replace(/^epn?\./, "")] = v; if (en) log.hits.push({ en, ps, dl: (q.get("dl") || u.searchParams.get("dl") || "").replace(/^https?:\/\/[^/]+/, "") }); }
    await r.fulfill({ status: 204, body: "" });
  });
  await ctx.route(/googletagmanager\.com\/gtm\.js|bzrcdn\.openai\.com|doubleclick|facebook\.net/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  ctx.on("request", (r) => { log.reqs++; const u = r.url(); if (/^https?:\/\/[^/]*(google|gstatic|openai|doubleclick)/.test(u)) log.google.push(u.slice(0, 110)); });
  ctx.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) log.bad.push(r.status() + " " + r.url().slice(0, 140)); });
  ctx.on("requestfailed", (r) => { const f = r.failure()?.errorText || ""; if (!/ERR_ABORTED|cancelled|NS_BINDING_ABORTED|Load request cancelled/i.test(f)) log.bad.push("FAIL " + f + " " + r.url().slice(0, 140)); });
  const pre = ls === "fresh" ? {} : ls === "seen" ? { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()) } : ls;
  if (consent) pre["cz-consent"] = consent; else if (ls === "seen") pre["cz-consent"] = "no";
  await ctx.addInitScript((pre) => { try { if (!sessionStorage.getItem("__qa_pre")) { for (const k in pre) localStorage.setItem(k, pre[k]); sessionStorage.setItem("__qa_pre", "1"); } } catch {} }, pre);
  const page = await ctx.newPage();
  const hook = (p, tag = "") => { p.on("pageerror", (e) => log.errs.push(tag + "pageerror " + String(e.message || e).slice(0, 300))); p.on("console", (m) => { if (m.type() === "error") log.errs.push(tag + "console " + m.text().slice(0, 300)); }); };
  hook(page);
  ctx.on("page", (p) => p !== page && hook(p, "[popup] "));
  return { ctx, page, log };
}
export async function waitMap(page, ms = 60000) {
  const t0 = Date.now();
  await page.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: ms }).catch(() => {});
  return Date.now() - t0;
}
export const shot = (page, name) => page.screenshot({ path: `${Q}/${name}.png` }).catch((e) => console.log("shot fail", name, e.message.slice(0, 80)));
export async function gameFrame(page, ms = 30000) {
  for (let i = 0; i < ms / 250; i++) {
    for (const f of page.frames()) { if (f.isDetached() || !/play\/gloves/.test(f.url())) continue; try { if (await f.evaluate(() => !!(window.czGloves && window.czGloves.probe))) return f; } catch {} }
    await sleep(250);
  }
  return null;
}
export const vis = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.05; }).length, sel);
// CPU throttling (chromium only): the Pixel 7 profile at 4x
export async function throttle(page, rate = 4) { try { const c = await page.context().newCDPSession(page); await c.send("Emulation.setCPUThrottlingRate", { rate }); return c; } catch (e) { return null; } }
// tap or click the centre of an element
export async function tapSel(page, sel, phone) { const b = await page.$(sel); if (!b) throw new Error("no " + sel); const r = await b.boundingBox(); if (!r) throw new Error("hidden " + sel); if (phone) await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2); }
// open the boarding pass from the map and fill it with fake QA data (LOCAL ONLY), returns when it can be sent
export async function openAndFillPass(page, phone) {
  await page.evaluate(() => window.__openBoarding());
  for (let i = 0; i < 30; i++) { await sleep(500); if (await page.evaluate(() => document.body.classList.contains("map-boarding"))) break; }
  await sleep(2200);
  await page.evaluate(() => { const c = document.querySelector(".cform").parentElement; const ch = [...c.querySelectorAll(".cf-chip")]; ch[0].click(); ch.find((x) => x.textContent === "Startup")?.click(); ch.find((x) => x.textContent === "Just exploring")?.click(); });
  const ins = await page.$$(".cform input:not(.cf-hp)");
  await ins[0].fill("QA Lottie"); await ins[1].fill("qa-lottie@example.test");
  await (await page.$(".cform textarea")).fill("Lottie UI QA, local build. Please ignore.");
  await sleep(400);
  await page.evaluate(() => document.querySelector(".cform .cf-submit").scrollIntoView({ block: "center" })); await sleep(300);
}
// a real-time screencast (chromium, CDP): frames as JPEGs with their timestamps; stop() returns [{t, file}]
export async function cast(page, dir, { q = 70, maxW = 1440, maxH = 900 } = {}) {
  const fs = await import("fs"); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const c = await page.context().newCDPSession(page), frames = []; let n = 0;
  let on = true;
  c.on("Page.screencastFrame", async (f) => { if (!on) return; const file = `${dir}/f${String(n++).padStart(5, "0")}.jpg`; try { fs.writeFileSync(file, Buffer.from(f.data, "base64")); } catch (e) { return; } frames.push({ t: f.metadata.timestamp, file }); try { await c.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) {} });
  await c.send("Page.startScreencast", { format: "jpeg", quality: q, maxWidth: maxW, maxHeight: maxH, everyNthFrame: 1 });
  return { stop: async () => { on = false; try { await c.send("Page.stopScreencast"); } catch (e) {} return frames; } };
}
// frames of a cast to a timed MP4 (each frame held until the next one's timestamp)
export async function castMp4(frames, out, fps = 60) {
  const fs = await import("fs"), { execFileSync } = await import("child_process");
  const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
  frames = frames.filter((f) => fs.existsSync(f.file)).sort((a, b) => a.t - b.t);
  if (frames.length < 2) return null;
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? f.t + 1 / fps) - f.t).toFixed(4)}`).join("\n") + `\nfile '${frames.at(-1).file}'`;
  const lf = frames[0].file.replace(/f\d+\.jpg$/, "list.txt"); fs.writeFileSync(lf, list);
  execFileSync(FF, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lf, "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-r", String(fps), "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  fs.rmSync(frames[0].file.replace(/\/f\d+\.jpg$/, ""), { recursive: true, force: true }); // (the disk is shared: the frames go once encoded)
  return out;
}
