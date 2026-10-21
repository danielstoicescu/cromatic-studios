// Cromatic · lottie-ui QA, the website's coffee stop (TASK-067): the SVG still against lottie-web's canvas renderer at
// frame 0 (they must match: the page swaps one for the other), a contact sheet of the loop, and the loop's seam (the last
// frame against the first).
//   node tools/qa/coffee.mjs <outdir> [wide|tall ...]
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, "../../../../..");
const out = process.argv[2] || "/tmp/coffee-qa", abs = process.argv.slice(3).length ? process.argv.slice(3) : ["wide", "tall"];
fs.mkdirSync(out, { recursive: true });
const lib = path.join(root, "design/intro-lottie/_lib/lottie_light_canvas.min.js");
const br = await chromium.launch();
for (const ab of abs) {
  const J = JSON.parse(fs.readFileSync(path.join(root, `src/lottie-ui/site-coffee-${ab}.json`), "utf8"));
  const svg = fs.readFileSync(path.join(root, `src/lottie-ui/site-coffee-${ab}.svg`), "utf8");
  const W = ab === "wide" ? 960 : 540, H = Math.round((W * J.h) / J.w);
  const p = await br.newPage({ viewport: { width: W * 2 + 30, height: H + 20 }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;display:flex;gap:10px;padding:10px;background:#888"><div id="s" style="width:${W}px;height:${H}px">${svg.replace("<svg", '<svg style="width:100%;height:100%;display:block"')}</div><div id="c" style="width:${W}px;height:${H}px"></div></body></html>`);
  await p.addScriptTag({ path: lib });
  await p.evaluate((J) => new Promise((res) => { window.anim = lottie.loadAnimation({ container: document.getElementById("c"), renderer: "canvas", loop: false, autoplay: false, animationData: J, rendererSettings: { preserveAspectRatio: "xMidYMid meet", clearCanvas: true } }); anim.addEventListener("DOMLoaded", () => { anim.goToAndStop(0, true); res(); }); }), J);
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/${ab}-still-vs-canvas.png` });
  // pixel difference between the two halves
  const diff = await p.evaluate(async ({ W, H }) => {
    const a = document.querySelector("#s svg"), c = document.querySelector("#c canvas");
    const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(a));
    await img.decode();
    const k = document.createElement("canvas"); k.width = c.width; k.height = c.height; const x = k.getContext("2d"); x.drawImage(img, 0, 0, k.width, k.height);
    const A = x.getImageData(0, 0, k.width, k.height).data, B = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0, big = 0; for (let i = 0; i < A.length; i += 4) { const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); if (d > 30) n++; if (d > 200) big++; }
    return { px: A.length / 4, over30: n, over200: big, share: +(n / (A.length / 4) * 100).toFixed(3) };
  }, { W, H });
  console.log(ab, "still vs canvas", JSON.stringify(diff));
  // the loop: a sheet, and the seam
  const frames = [0, 60, 100, 130, 170, 200, 245, 270, 300, 350, 380, 420, 470, 520, 560, 575, 610, 640, 690, 779];
  fs.mkdirSync(`${out}/${ab}-frames`, { recursive: true });
  for (const fr of frames) { await p.evaluate((fr) => anim.goToAndStop(fr, true), fr); await (await p.$("#c")).screenshot({ path: `${out}/${ab}-frames/f${String(fr).padStart(3, "0")}.png` }); }
  const seam = await p.evaluate(() => { const c = document.querySelector("#c canvas"), g = c.getContext("2d"); anim.goToAndStop(0, true); const a = g.getImageData(0, 0, c.width, c.height).data.slice(); anim.goToAndStop(anim.totalFrames - 1, true); const b = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 40) n++; return { last: anim.totalFrames - 1, differing: n }; });
  console.log(ab, "seam (last frame vs first)", JSON.stringify(seam));
  await p.close();
}
await br.close();
