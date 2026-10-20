// the four explainers side by side at 3x (stage-welcome.html), frame by frame: "in" then "act", light then Sketchbook
import { pw, FF, W, STAGE } from "./welcome-lib.mjs";
import fs from "fs"; import { execFileSync } from "child_process";
const out = process.argv[2];
const k = 3, br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
const dir = `${W}/cu-${process.pid}`; fs.mkdirSync(dir, { recursive: true }); let n = 0;
for (const th of ["light", "sketch"]) {
  const p = await br.newPage({ viewport: { width: 4 * 90 * k + 160, height: 116 * k }, deviceScaleFactor: 1 });
  await p.goto(`${STAGE}/design/lottie-ui/_source/tools/stage-welcome.html?th=${th}&k=${k}`);
  await p.waitForFunction(() => window.ready, null, { timeout: 15000 });
  for (let f = 0; f <= 190; f++) { await p.evaluate((f) => window.go(f), f); await p.screenshot({ path: `${dir}/f${String(n++).padStart(5, "0")}.jpg`, type: "jpeg", quality: 90 }); }
  for (let h = 0; h < 30; h++) fs.copyFileSync(`${dir}/f${String(n - 1).padStart(5, "0")}.jpg`, `${dir}/f${String(n++).padStart(5, "0")}.jpg`);
  await p.close();
}
execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", "60", "-i", `${dir}/f%05d.jpg`, "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-movflags", "+faststart", out]);
fs.rmSync(dir, { recursive: true, force: true }); await br.close(); console.log("wrote", out, (fs.statSync(out).size / 1e6).toFixed(2), "MB");
