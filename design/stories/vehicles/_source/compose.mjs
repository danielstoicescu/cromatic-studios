// story E: the cards (lottie-web, transparent) over the rides (the map's frames at 2x, brought to 1080 x 1920) -> MP4
//   PORT=8977 node ../../lottie/_source/serve.mjs &   (the worktree's root)
//   node compose.mjs <rides dir> <out dir> [poster frame]   -> story-e1-en.mp4, story-e1-en-poster.jpg, contact sheet
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
// (STORY=e2: E2's shots, cards and names)
const ST = process.env.STORY || "e1", { SHOTS, F } = await import(ST === "e5" || ST === "e6" || ST === "e7" ? "./shotsE5.mjs" : ST === "e4" ? "./shotsE4.mjs" : ST === "e3" ? "./shotsE3.mjs" : ST === "e2" ? "./shotsE2.mjs" : "./shots.mjs");
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const [RIDES, OUT, posterAt = "520"] = process.argv.slice(2);
const TMP = path.join(OUT, "_frames"); fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const PAPER = { r: 251, g: 250, b: 245 };
const br = await pw.chromium.launch();
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(`http://127.0.0.1:${process.env.PORT || 8977}/design/stories/vehicles/_source/stage-alpha.html?s=story-${ST}-cards.json`);
await p.waitForFunction(() => window.ready === 1, null, { timeout: 60000 });
const t0 = Date.now();
for (let i = 0; i < F; i++) {
  await p.evaluate((f) => window.go(f), i * 2);
  const cards = await p.screenshot({ omitBackground: true });
  const rf = path.join(RIDES, `f${String(i).padStart(5, "0")}.png`);
  const base = fs.existsSync(rf) ? sharp(rf).resize(1080, 1920, { kernel: "lanczos3" }).removeAlpha() : sharp({ create: { width: 1080, height: 1920, channels: 3, background: PAPER } });
  await sharp(await base.png().toBuffer()).composite([{ input: cards }]).png({ compressionLevel: 1 }).toFile(path.join(TMP, `f${String(i).padStart(5, "0")}.png`));
}
await br.close();
console.log(F, "frames composed in", ((Date.now() - t0) / 1000).toFixed(0), "s");
const mp4 = path.join(OUT, `story-${ST}-en.mp4`);
execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", "30", "-i", `${TMP}/f%05d.png`, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-maxrate", "8M", "-bufsize", "16M", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2", "-movflags", "+faststart", mp4]);
execFileSync(FF, ["-y", "-loglevel", "error", "-i", `${TMP}/f${String(+posterAt).padStart(5, "0")}.png`, "-q:v", "2", path.join(OUT, `story-${ST}-en-poster.jpg`)]);
// the contact sheet: a frame from every shot
const picks = SHOTS.flatMap((s) => (s.id === "leadin" || s.id === "end" ? [Math.min(F - 1, s.t[1] - 4)] : [s.t[0] + Math.round((s.t[1] - s.t[0]) * (s.kind === "pass" ? 0.33 : 0.75))]));
const w = 270, h = 480, cols = picks.length > 10 ? Math.ceil(picks.length / 2) : picks.length;
const tiles = await Promise.all(picks.map((f) => sharp(path.join(TMP, `f${String(f).padStart(5, "0")}.png`)).resize(w, h).toBuffer()));
await sharp({ create: { width: cols * (w + 12) + 12, height: Math.ceil(picks.length / cols) * (h + 12) + 12, channels: 3, background: "#111114" } })
  .composite(tiles.map((b, i) => ({ input: b, left: 12 + (i % cols) * (w + 12), top: 12 + Math.floor(i / cols) * (h + 12) }))).jpeg({ quality: 86 }).toFile(path.join(OUT, `contact-sheet-${ST}.jpg`));
fs.rmSync(TMP, { recursive: true, force: true });
console.log("wrote", mp4, (fs.statSync(mp4).size / 1e6).toFixed(2), "MB");
