// Cromatic · diorama renders (TASK-118): a shot's PNGs (rendered at 2x) into the story's video: 1080 x 1920, 30 fps,
// H.264 (yuv420p, CRF 14, the 2x frames scaled down with Lanczos: the downscale is the last anti-aliasing pass).
//   node encode.mjs out/oma [out.mp4] [--fps 30] [--width 1080]
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const dir = path.resolve(args[0] || "."), name = path.basename(dir), out = path.resolve(args[1] && !args[1].startsWith("--") ? args[1] : path.join(dir, `${name}.mp4`));
const FF = process.env.FFMPEG || ["/Users/daniel.stoic/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg", "ffmpeg"].find((f) => f === "ffmpeg" || fs.existsSync(f));
const frames = fs.readdirSync(dir).filter((f) => new RegExp(`^${name}-\\d{4}\\.png$`).test(f)).sort();
if (!frames.length) { console.error("no frames", dir); process.exit(1); }
const W = +opt("width", 1080), fps = +opt("fps", 30), first = +frames[0].match(/(\d{4})\.png$/)[1];
const r = spawnSync(FF, ["-y", "-v", "error", "-framerate", String(fps), "-start_number", String(first), "-i", path.join(dir, `${name}-%04d.png`), "-vf", `scale=${W}:-2:flags=lanczos,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-profile:v", "high", "-movflags", "+faststart", out], { stdio: "inherit" });
if (r.status) process.exit(r.status);
console.log(frames.length, "frames ->", out);
