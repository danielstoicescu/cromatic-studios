// Cromatic opening (Lottie): a contact sheet of chosen moments of one direction/artboard, for review while designing.
// node ~/.x-li-frames.mjs A desktop "0.5,1.0,1.3" out.jpg [cols]
import pw from "playwright";
import fs from "fs";
import { execFileSync } from "child_process";
const [, , D = "A", AB = "desktop", times = "1,2,3", out = "/tmp/sheet.jpg", cols = "4"] = process.argv;
const BASE = process.env.STAGE || "http://localhost:8575/_source/tools/stage.html";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const vp = AB === "phone" ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
const p = await br.newPage({ viewport: vp, deviceScaleFactor: 1 });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto(`${BASE}?d=${D}&ab=${AB}`);
await p.waitForFunction(() => window.ready, null, { timeout: 15000 });
const meta = await p.evaluate(() => window.meta);
const hand = meta.markers.find((m) => m.cm === "handoff");
const dir = `/tmp/li-frames-${process.pid}`; fs.mkdirSync(dir, { recursive: true });
const ts = times.split(",").map(Number);
for (let i = 0; i < ts.length; i++) {
  const fr = Math.min(meta.op - 0.01, ts[i] * meta.fr);
  await p.evaluate((fr) => window.go(fr), fr);
  await p.waitForTimeout(30);
  await p.screenshot({ path: `${dir}/f${String(i).padStart(3, "0")}.png` });
}
await br.close();
const w = AB === "phone" ? 260 : 480;
const rows = Math.ceil(ts.length / +cols);
execFileSync(FF, ["-y", "-loglevel", "error", "-pattern_type", "glob", "-i", `${dir}/f*.png`, "-vf", `scale=${w}:-2,drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:text='%{n}':x=6:y=6:fontsize=14:fontcolor=red,tile=${cols}x${rows}:padding=4:color=gray`, "-frames:v", "1", out]);
console.log("sheet", out, ts.join(" "));
