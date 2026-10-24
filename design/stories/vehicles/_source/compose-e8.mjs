// story E8: the cards (lottie-web, transparent) over the diorama renders (1080 x 1920 frames, f00000.jpg ...) -> MP4,
// poster and contact sheet. Streams every composed frame straight into ffmpeg (no temporary PNGs on disk).
//   PORT=8943 node ../../lottie/_source/serve.mjs &   (the worktree's root)
//   STAGE=http://127.0.0.1:8943 node compose-e8.mjs <frames dir> <out dir> [poster frame] [sheet name]
import fs from "fs";
import path from "path";
import { spawn, execFileSync } from "child_process";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { SHOTS, F } from "./shotsE8.mjs";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const [RIDES, OUT, posterAt = "380", sheetName = "contact-sheet-e8.jpg"] = process.argv.slice(2);
const STAGE = process.env.STAGE || "http://127.0.0.1:8943";
fs.mkdirSync(OUT, { recursive: true });
const mp4 = path.join(OUT, "story-e8-en.mp4");
const picks = SHOTS.flatMap((s) => (s.id === "leadin" || s.id === "end" ? [Math.min(F - 1, s.t[1] - 4)] : s.id === "rush" ? [s.t[0] + 22] : [s.t[0] + Math.round((s.t[1] - s.t[0]) * 0.75)]));
const keep = new Map();
const ff = spawn(FF, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "png", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-maxrate", "10M", "-bufsize", "20M", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2", "-movflags", "+faststart", "-an", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));
const br = await pw.chromium.launch();
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(`${STAGE}/design/stories/vehicles/_source/stage-alpha.html?s=story-e8-cards.json`);
await p.waitForFunction(() => window.ready === 1, null, { timeout: 60000 });
const t0 = Date.now(); let last = null;
for (let i = 0; i < F; i++) {
  await p.evaluate((f) => window.go(f), i * 2);
  const cards = await p.screenshot({ omitBackground: true });
  const rf = path.join(RIDES, `f${String(i).padStart(5, "0")}.jpg`);
  if (fs.existsSync(rf)) last = rf;
  const base = last ? sharp(last).resize(1080, 1920).removeAlpha() : sharp({ create: { width: 1080, height: 1920, channels: 3, background: "#000" } });
  const png = await sharp(await base.png().toBuffer()).composite([{ input: cards }]).png({ compressionLevel: 1 }).toBuffer();
  await write(png);
  if (picks.includes(i) || i === +posterAt) keep.set(i, png);
}
await br.close(); ff.stdin.end();
await new Promise((res) => ff.on("close", res));
console.log(F, "frames composed in", ((Date.now() - t0) / 1000).toFixed(0), "s");
await sharp(keep.get(+posterAt)).jpeg({ quality: 92 }).toFile(path.join(OUT, "story-e8-en-poster.jpg"));
const w = 270, h = 480, cols = picks.length;
const tiles = await Promise.all(picks.map((f) => sharp(keep.get(f)).resize(w, h).toBuffer()));
await sharp({ create: { width: cols * (w + 12) + 12, height: h + 24, channels: 3, background: "#111114" } })
  .composite(tiles.map((b, i) => ({ input: b, left: 12 + i * (w + 12), top: 12 }))).jpeg({ quality: 88 }).toFile(path.join(OUT, sheetName));
console.log("wrote", mp4, (fs.statSync(mp4).size / 1e6).toFixed(2), "MB; sheet frames", picks.join(","));
