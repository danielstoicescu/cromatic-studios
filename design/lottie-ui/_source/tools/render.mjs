// Cromatic · lottie-ui: render a piece frame by frame over a still of the site (design/lottie-ui/_source/tools/stage.html)
// node ~/.x-lui-render.mjs '{"j":"/src/lottie-ui/stamp-en.json","bg":"...","x":1010,"y":445,"w":318,"vp":"desktop","frames":[0,45],"pre":20,"hold":60,"out":"/path/x.mp4"}'
// "sheet": [frames] writes a contact sheet instead; "dom": {html, css, start} lays page markup over it, its CSS animations
// stepped with the frames (start = the piece frame at which they begin)
import pw from "playwright";
import fs from "fs";
import { execFileSync } from "child_process";
const o = JSON.parse(process.argv[2]);
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const VP = { desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, iphone: { viewport: { width: 390, height: 664 }, deviceScaleFactor: 2 }, pixel: { viewport: { width: 412, height: 839 }, deviceScaleFactor: 2 } }[o.vp || "desktop"];
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
const p = await br.newPage(VP);
p.on("pageerror", (e) => console.log("pageerror", e.message));
const qs = new URLSearchParams({ j: o.j, ...(o.bg ? { bg: o.bg } : {}), ...(o.atlas ? { atlas: o.atlas } : {}), ...(o.full ? { full: "1" } : { x: o.x, y: o.y, w: o.w }) });
await p.goto(`http://127.0.0.1:8932/design/lottie-ui/_source/tools/stage.html?${qs}`);
await p.waitForFunction(() => window.ready, null, { timeout: 15000 });
await p.waitForTimeout(o.atlas ? 600 : 50); // (the pictures decode)
if (o.dom) await p.evaluate(({ html, css }) => window.layer(html, css), o.dom);
const dir = `/tmp/lui-r-${process.pid}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
let n = 0;
const snap = async () => p.screenshot({ path: `${dir}/f${String(n++).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
const seq = o.seq || (o.frames ? [[o.frames[0], o.frames[1]]] : [[0, 0]]);
const at = async (fr, domMs) => { await p.evaluate(({ fr, ms }) => { window.go(fr); if (ms != null) window.cssAt(Math.max(0, ms)); }, { fr, ms: domMs }); };
if (o.sheet) {
  for (const fr of o.sheet) { await at(fr, o.dom ? ((fr - (o.dom.start || 0)) / 60) * 1000 : null); await snap(); }
  const cols = o.cols || 5, w = o.tw || 480;
  execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", "1", "-i", `${dir}/f%05d.jpg`, "-vf", `${o.crop ? `crop=${o.crop.join(":")},` : ""}scale=${w}:-1,tile=${cols}x${Math.ceil(o.sheet.length / cols)}:padding=4:color=white`, "-frames:v", "1", o.out]);
} else {
  await at(seq[0][0], o.dom ? -1 : null); for (let i = 0; i < (o.pre || 0); i++) await snap();
  let clock = 0;
  // "events": [[clock, js]] run before that frame (classes on the page's markup, a new still under: setBg(url))
  const ev = new Map((o.events || []).map(([c, js]) => [c, js]));
  const step = async (fr) => { if (ev.has(clock)) await p.evaluate(ev.get(clock)); if (o.steps) await p.evaluate(({ fr, c }) => { window.go(fr); window.cssStep(c); }, { fr, c: clock }); else await at(fr, o.dom ? ((clock - (o.dom.start || 0)) / 60) * 1000 : null); await snap(); clock++; };
  for (const sg of seq) { if (sg.hold) { for (let i = 0; i < sg.hold; i++) await step(sg.at); continue; } const [a, b] = sg; for (let fr = a; fr <= b; fr++) await step(fr); }
  for (let i = 0; i < (o.hold || 0); i++) await step(seq.at(-1).hold ? seq.at(-1).at : seq.at(-1)[1]);
  execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", "60", "-i", `${dir}/f%05d.jpg`, "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-movflags", "+faststart", o.out]);
}
await br.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log("wrote", o.out, n, "frames", (fs.statSync(o.out).size / 1e6).toFixed(2) + " MB");
