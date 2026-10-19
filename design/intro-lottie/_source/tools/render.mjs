// Cromatic opening (Lottie): render one direction/artboard to MP4, frame by frame (deterministic, 60 fps), the
// city still under it moving as the host would move the map, plus a second of the map after the handoff.
// node ~/.x-li-render.mjs A desktop /path/out.mp4
import pw from "playwright";
import fs from "fs";
import { execFileSync } from "child_process";
const [, , D = "A", AB = "desktop", out] = process.argv;
const BASE = process.env.STAGE || "http://localhost:8575/_source/tools/stage.html";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const ph = AB === "phone";
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
const p = await br.newPage({ viewport: ph ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: ph ? 2 : 1 });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto(`${BASE}?d=${D}&ab=${AB}`);
await p.waitForFunction(() => window.ready, null, { timeout: 15000 });
const meta = await p.evaluate(() => window.meta);
const dir = `/tmp/li-render-${D}-${AB}-${process.pid}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const tail = 60; // a second of the map after the handoff
let n = 0;
for (let fr = 0; fr < meta.op + tail; fr++) {
  const f = Math.min(fr, meta.op - 0.001);
  await p.evaluate((f) => window.go(f), f);
  if (fr === meta.op) await p.evaluate(() => { document.getElementById("lot").style.visibility = "hidden"; });
  await p.screenshot({ path: `${dir}/f${String(n++).padStart(5, "0")}.jpg`, type: "jpeg", quality: 93 });
}
await br.close();
execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", "60", "-i", `${dir}/f%05d.jpg`, "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", out]);
fs.rmSync(dir, { recursive: true, force: true });
console.log("mp4", out, n, "frames", (fs.statSync(out).size / 1e6).toFixed(2) + " MB");
