// Cromatic · stories in Lottie · v2 (TASK-065): a contact sheet for one reworked story: its frames in order, each with
// what it does. node sheetV2.mjs <spec.json> <out.jpg>   spec: { title, emph, sub, dir, cells: [[file, head, caption]] }
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const [SPEC, OUT] = process.argv.slice(2), S = JSON.parse(fs.readFileSync(SPEC, "utf8"));
const FONT = new URL("../../../../site/fonts/google-sans-latin.woff2", import.meta.url).pathname, MONO = new URL("../../../../site/fonts/gf/jetbrains-mono-latin.woff2", import.meta.url).pathname;
const b64 = (f) => fs.readFileSync(f).toString("base64");
const n = S.cells.length, cw = 300, width = 112 + n * cw + (n - 1) * 20;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:GS;src:url(data:font/woff2;base64,${b64(FONT)}) format("woff2");font-weight:100 900}
@font-face{font-family:JM;src:url(data:font/woff2;base64,${b64(MONO)}) format("woff2")}
body{margin:0;background:#0C0C10;color:#F2F2F2;font-family:GS;width:${width}px}
.wrap{padding:48px 56px 52px}
h1{font-size:56px;letter-spacing:-.03em;margin:0 0 6px;font-weight:600}
h1 em{font-style:normal;background:#FED012;color:#000;border:3px solid #000;border-radius:99px;padding:0 20px}
.sub{font-family:JM;font-size:17px;letter-spacing:.12em;text-transform:uppercase;opacity:.65;margin-bottom:32px}
.row{display:flex;gap:20px;align-items:flex-start}
.cell{width:${cw}px;display:flex;flex-direction:column;gap:10px}
.cell img{width:${cw}px;height:${Math.round((cw * 16) / 9)}px;border-radius:18px;display:block;object-fit:cover;outline:2px solid #2a2a33}
.cap{font-family:JM;font-size:13px;letter-spacing:.06em;text-transform:uppercase;line-height:1.5;opacity:.85}
.cap b{font-family:GS;font-size:20px;letter-spacing:-.01em;text-transform:none;display:block;margin-bottom:3px;font-weight:600;opacity:1;color:#FED012}
</style></head><body><div class="wrap">
<h1>${S.title} <em>${S.emph}</em></h1><div class="sub">${S.sub}</div>
<div class="row">${S.cells.map(([f, h, c]) => `<div class="cell"><img src="data:image/jpeg;base64,${b64(S.dir + "/" + f)}"><div class="cap"><b>${h}</b>${c}</div></div>`).join("")}</div>
</div></body></html>`;
const br = await pw.chromium.launch(); const p = await br.newPage({ viewport: { width, height: 800 } });
await p.setContent(html, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: OUT, fullPage: true, type: "jpeg", quality: 86 }); await br.close();
console.log("sheet", OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
