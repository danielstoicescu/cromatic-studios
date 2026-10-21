// Cromatic · metro mockups (TASK-062): a piece's video JSON to an MP4 (H.264, 30 fps, the piece's own size) and a
// poster JPG, frame by frame from the stage (lottie-web's canvas renderer), through the toolchain's ffmpeg (imageio-ffmpeg's
// static build). The video gets a fine moving grain (ffmpeg's temporal noise), as a camera's sensor would; the site's
// pieces do not (it would cost weight and repaint).
//   node record.mjs <shot> <outDir> <posterFrame>      (the stage served by serve.mjs on :8965, PLATES at /_plates)
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
import { execFileSync } from "child_process";
import { SHOTS } from "./shots.mjs";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const [shot, OUT, posterAt] = process.argv.slice(2), S = SHOTS[shot], FPS = 30, STEP = 60 / FPS;
fs.mkdirSync(OUT, { recursive: true });
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const p = await br.newPage({ viewport: { width: S.W, height: S.H }, deviceScaleFactor: 1 });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto(`http://127.0.0.1:${process.env.PORT || 8965}/design/metro-mockup/_source/stage.html?j=${encodeURIComponent(`/_plates/metro-${shot}-video.json`)}`);
await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
await p.waitForTimeout(400);
const op = await p.evaluate(() => window.anim.totalFrames);
const dir = `${process.env.FRAMES || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/metro"}/frames-${shot}-${process.pid}`;
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const t0 = Date.now(); let n = 0;
for (let fr = 0; fr < op; fr += STEP) { await p.evaluate((fr) => window.go(fr), fr); await p.screenshot({ path: `${dir}/f${String(n++).padStart(5, "0")}.png`, type: "png" }); }
console.log(shot, n, "frames in", ((Date.now() - t0) / 1000).toFixed(1), "s");
await br.close();
const mp4 = `${OUT}/litorsal-metro-${shot}.mp4`;
execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${dir}/f%05d.png`, "-vf", "noise=alls=5:allf=t+u,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", process.env.CRF || "18", "-maxrate", "10M", "-bufsize", "20M", "-profile:v", "high", "-level", "4.2", "-movflags", "+faststart", mp4]);
const pi = Math.round((+posterAt || 0) / STEP);
execFileSync(FF, ["-y", "-loglevel", "error", "-i", `${dir}/f${String(pi).padStart(5, "0")}.png`, "-q:v", "2", `${OUT}/litorsal-metro-${shot}-poster.jpg`]);
console.log("wrote", mp4, (fs.statSync(mp4).size / 1e6).toFixed(2), "MB");
fs.rmSync(dir, { recursive: true, force: true });
