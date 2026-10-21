// Cromatic · stories in Lottie (TASK-057): a story's JSON to an MP4 (H.264, 1080x1920, 30 fps) and a poster JPG,
// frame by frame (lottie-web's canvas renderer in Chromium, every other frame of the 60 fps Lottie), through the
// toolchain's ffmpeg (the one design/lottie-ui's renders use: imageio-ffmpeg's static build, libx264).
//   node record.mjs story-d-en [outDir] [posterFrame]     (the stage served by serve.mjs on :8993)
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
import { execFileSync } from "child_process";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const name = process.argv[2], OUT = process.argv[3] || "/Users/daniel.stoic/cromatic-ops/refs/stories-lottie/v2", posterAt = process.argv[4] ? +process.argv[4] : null;
const SS = +process.env.SS || 1, FPS = 30, STEP = 60 / FPS;
const only = process.env.FRAMES ? process.env.FRAMES.split(",").map(Number) : null; // (stills only: QA)
fs.mkdirSync(OUT, { recursive: true });
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: SS });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto(`http://127.0.0.1:${process.env.STAGE_PORT || 8993}/design/stories/lottie/story-d/_source/stage.html?s=${name}.json`);
await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
await p.waitForTimeout(400);
const op = await p.evaluate(() => window.anim.totalFrames);
const dir = `/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/sd/frames-${name}-${process.pid}`; // (its own folder: two recorders of one story must not share it)
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const frames = only || Array.from({ length: Math.floor(op / STEP) }, (_, i) => i * STEP);
let n = 0; const t0 = Date.now();
for (const fr of frames) {
  await p.evaluate((fr) => window.go(fr), fr);
  await p.screenshot({ path: `${dir}/f${String(n++).padStart(5, "0")}.png`, type: "png", timeout: 180000 });
}
console.log(name, n, "frames in", ((Date.now() - t0) / 1000).toFixed(1), "s");
await br.close();
const sc = SS > 1 ? ["-vf", "scale=1080:1920:flags=lanczos"] : [];
if (only) {
  only.forEach((fr, i) => execFileSync(FF, ["-y", "-loglevel", "error", "-i", `${dir}/f${String(i).padStart(5, "0")}.png`, ...sc, "-q:v", "2", `${OUT}/${name}-f${fr}.jpg`]));
} else {
  execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${dir}/f%05d.png`, ...sc, "-c:v", "libx264", "-preset", "slow", "-crf", process.env.CRF || "19", "-maxrate", "6M", "-bufsize", "12M", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2", "-movflags", "+faststart", `${OUT}/${name}.mp4`]);
  if (posterAt != null) { const i = Math.round(posterAt / STEP); execFileSync(FF, ["-y", "-loglevel", "error", "-i", `${dir}/f${String(i).padStart(5, "0")}.png`, ...sc, "-q:v", "2", `${OUT}/${name}-poster.jpg`]); }
  console.log("wrote", `${OUT}/${name}.mp4`, (fs.statSync(`${OUT}/${name}.mp4`).size / 1e6).toFixed(2), "MB");
}
fs.rmSync(dir, { recursive: true, force: true }); // (the disk is shared: the frames go once encoded)
