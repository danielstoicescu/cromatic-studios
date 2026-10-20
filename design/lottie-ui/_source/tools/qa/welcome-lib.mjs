// Lottie UI · the welcome card (TASK-007): the QA helpers its scripts share. BASE = the local server (default :8977),
// WELCOME_OUT = where shots, casts and videos go (default: the system temp folder), STAGE = the static server of the
// repository root that serves tools/stage-welcome.html (default :8932, as render.mjs)
import pw from "playwright";
import os from "os";
import fsx from "fs";
export { pw };
export const W = process.env.WELCOME_OUT || os.tmpdir() + "/cz-welcome-qa";
fsx.mkdirSync(W + "/shots", { recursive: true });
export const STAGE = process.env.STAGE || "http://127.0.0.1:8932";
export const SH = W + "/shots";
export const BASE = process.env.BASE || "http://localhost:8977";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const DEV = {
  desktop: { b: "chromium", o: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  laptop: { b: "chromium", o: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 } },
  iphone: { b: "webkit", o: () => ({ ...pw.devices["iPhone 13"] }) },
  pixel: { b: "chromium", o: () => ({ ...pw.devices["Pixel 7"] }) },
  se: { b: "chromium", o: () => ({ ...pw.devices["iPhone SE"], defaultBrowserType: undefined }) },
  iphoneC: { b: "chromium", o: () => ({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: pw.devices["Pixel 7"].userAgent }) }
};
const browsers = {};
export async function browserFor(b) {
  if (!browsers[b]) browsers[b] = await (b === "webkit" ? pw.webkit.launch() : pw.chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--enable-precise-memory-info"] }));
  return browsers[b];
}
export async function closeAll() { for (const k in browsers) await browsers[k].close().catch(() => {}); }
export async function ctxFor(kind, { ls = {}, extra = {} } = {}) {
  const d = DEV[kind]; const o = typeof d.o === "function" ? d.o() : d.o; delete o.defaultBrowserType;
  const br = await browserFor(d.b);
  const ctx = await br.newContext({ ...o, ...extra });
  const log = { errs: [], bad: [] };
  await ctx.route(/google-analytics\.com|analytics\.google\.com|\/g\/collect|googletagmanager\.com|bzrcdn\.openai\.com|doubleclick|facebook\.net/, (r) => r.fulfill({ status: 204, body: "" }));
  await ctx.addInitScript((pre) => { try { if (!sessionStorage.getItem("__qa_pre")) { for (const k in pre) localStorage.setItem(k, pre[k]); sessionStorage.setItem("__qa_pre", "1"); } } catch {} }, ls);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errs.push("pageerror " + String(e.message || e).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") log.errs.push("console " + m.text().slice(0, 300)); });
  ctx.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) log.bad.push(r.status() + " " + r.url().slice(0, 140)); });
  return { ctx, page, log };
}
export async function throttle(page, rate = 4) { try { const c = await page.context().newCDPSession(page); await c.send("Emulation.setCPUThrottlingRate", { rate }); return c; } catch (e) { return null; } }
export const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
export async function cast(page, dir, { q = 75, maxW = 1440, maxH = 900 } = {}) {
  const fs = await import("fs"); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const c = await page.context().newCDPSession(page), frames = []; let n = 0, on = true;
  c.on("Page.screencastFrame", async (f) => { if (!on) return; const file = `${dir}/f${String(n++).padStart(5, "0")}.jpg`; try { fs.writeFileSync(file, Buffer.from(f.data, "base64")); } catch (e) { return; } frames.push({ t: f.metadata.timestamp, file }); try { await c.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) {} });
  await c.send("Page.startScreencast", { format: "jpeg", quality: q, maxWidth: maxW, maxHeight: maxH, everyNthFrame: 1 });
  return { stop: async () => { on = false; try { await c.send("Page.stopScreencast"); } catch (e) {} return frames; } };
}
export async function castMp4(frames, out, fps = 60, { crf = 23, w = 0 } = {}) {
  const fs = await import("fs"), { execFileSync } = await import("child_process");
  frames = frames.filter((f) => fs.existsSync(f.file)).sort((a, b) => a.t - b.t);
  if (frames.length < 2) return null;
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? f.t + 1 / fps) - f.t).toFixed(4)}`).join("\n") + `\nfile '${frames.at(-1).file}'`;
  const lf = frames[0].file.replace(/f\d+\.jpg$/, "list.txt"); fs.writeFileSync(lf, list);
  execFileSync(FF, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lf, "-vf", w ? `scale=${w}:-2` : "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-r", String(fps), "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  fs.rmSync(frames[0].file.replace(/\/f\d+\.jpg$/, ""), { recursive: true, force: true });
  return out;
}
