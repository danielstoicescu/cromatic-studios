// Cromatic · stories in Lottie · story C (TASK-058): the small contact sheet: the site's own chase on a phone (the
// "before") and four frames of the story. node sheetC.mjs <dir: plain-chase.png, story-c-en-f*.jpg> <out.jpg>
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const [DIR, OUT] = process.argv.slice(2);
const FONT = new URL("../../../../site/fonts/google-sans-latin.woff2", import.meta.url).pathname;
const MONO = new URL("../../../../site/fonts/gf/jetbrains-mono-latin.woff2", import.meta.url).pathname;
const b64 = (f) => fs.readFileSync(f).toString("base64");
const img = (f) => `data:image/${f.endsWith(".png") ? "png" : "jpeg"};base64,${b64(`${DIR}/${f}`)}`;
const cells = [
  ["plain-chase.png", "Screen capture", "The site on a phone at night, the chase on: the map's own pill counts down. UI over the street."],
  ["story-c-en-f140.jpg", "Bird's eye", "Night Mode from the engine, two lenses; both cars rendered alone and laid on the road, the police lamps pulsing."],
  ["story-c-en-f364.jpg", "The near miss", "The yellow Dacia at the lens: one render per frame, a 180° shutter of blur in each; smoke and marks drawn."],
  ["story-c-en-f470.jpg", "Five seconds later", "The police car stops, its lamps wash the street and the road; then they go off."],
  ["story-c-en-f700.jpg", "End card", "Your turn, on the map."]
];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:GS;src:url(data:font/woff2;base64,${b64(FONT)}) format("woff2");font-weight:100 900}
@font-face{font-family:JM;src:url(data:font/woff2;base64,${b64(MONO)}) format("woff2")}
body{margin:0;background:#F2F2F2;font-family:GS;color:#000;width:1720px}
.wrap{padding:48px 56px 52px}
h1{font-size:56px;letter-spacing:-.03em;margin:0 0 6px;font-weight:600}
h1 em{font-style:normal;background:#FED012;border:3px solid #000;border-radius:99px;padding:0 20px}
.sub{font-family:JM;font-size:18px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin-bottom:34px}
.row{display:flex;gap:22px;align-items:flex-start}
.cell{display:flex;flex-direction:column;gap:10px;width:300px}
.cell img{width:300px;height:533px;border:3px solid #000;border-radius:20px;display:block;object-fit:cover}
.cell.first img{border-style:dashed}
.cap{font-family:JM;font-size:14px;letter-spacing:.08em;text-transform:uppercase;line-height:1.45}
.cap b{font-family:GS;font-size:21px;letter-spacing:-.01em;text-transform:none;display:block;margin-bottom:3px;font-weight:600}
.vs{align-self:center;font-size:34px;font-weight:600;margin-top:-80px}
</style></head><body><div class="wrap">
<h1>The chase, at <em>night</em></h1>
<div class="sub">TASK-058 · story C · a phone screen capture vs frames of the Lottie story · 1080×1920</div>
<div class="row">${cells.map(([f, t, c], i) => `${i === 1 ? '<div class="vs">→</div>' : ""}<div class="cell${i ? "" : " first"}"><img src="${img(f)}"><div class="cap"><b>${t}</b>${c}</div></div>`).join("")}</div>
</div></body></html>`;
const br = await pw.chromium.launch();
const p = await br.newPage({ viewport: { width: 1720, height: 800 }, deviceScaleFactor: 1 });
await p.setContent(html, { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: OUT, fullPage: true, type: "jpeg", quality: 88 });
await br.close();
console.log("sheet", OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
