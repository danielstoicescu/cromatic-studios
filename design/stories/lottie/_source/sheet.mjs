// Cromatic · stories in Lottie (TASK-057): the contact sheet: the site as a phone screen-records it (the "before") next
// to the Lottie stories' frames, with details at 2x. HTML laid out here, shot by Chromium, saved as a JPG.
//   node sheet.mjs <dir with plain-street.png, plain-birdseye.png, story-a-en-f*.jpg, story-b-en-f*.jpg> <out.jpg>
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const [DIR, OUT] = process.argv.slice(2);
const FONT = new URL("../../../../site/fonts/google-sans-latin.woff2", import.meta.url).pathname;
const MONO = new URL("../../../../site/fonts/gf/jetbrains-mono-latin.woff2", import.meta.url).pathname;
const b64 = (f) => fs.readFileSync(f).toString("base64");
const img = (f) => `data:image/${f.endsWith(".png") ? "png" : "jpeg"};base64,${b64(`${DIR}/${f}`)}`;
const A = process.env.AF || "story-a-en-f470.jpg", AIR = process.env.AIRF || "story-a-en-f150.jpg", B = process.env.BF || "story-b-en-f480.jpg", BT = process.env.BTF || "story-b-en-f330.jpg";
// a detail: the same part of two frames, at 2x (x, y, w, h in the 1080x1920 frame)
const crop = (src, [x, y, w, h], dh = 520) => { const k = dh / h; return `<div class="crop" style="width:${Math.round(w * k)}px;height:${dh}px"><img src="${src}" style="width:${1080 * k}px;height:${1920 * k}px;left:${-x * k}px;top:${-y * k}px"></div>`; };
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:GS;src:url(data:font/woff2;base64,${b64(FONT)}) format("woff2");font-weight:100 900}
@font-face{font-family:JM;src:url(data:font/woff2;base64,${b64(MONO)}) format("woff2")}
body{margin:0;background:#F2F2F2;font-family:GS;color:#000;width:1940px}
.wrap{padding:56px 64px 64px}
h1{font-size:64px;letter-spacing:-.03em;margin:0 0 8px;font-weight:600}
h1 em{font-style:normal;background:#FED012;border:3px solid #000;border-radius:99px;padding:0 22px}
.sub{font-family:JM;font-size:20px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin-bottom:40px}
.row{display:flex;gap:28px;align-items:flex-start;margin-bottom:44px}
.cell{display:flex;flex-direction:column;gap:12px}
.cell img.f{width:405px;height:720px;border:3px solid #000;border-radius:22px;display:block;background:#fff}
.cap{font-family:JM;font-size:17px;letter-spacing:.1em;text-transform:uppercase;max-width:405px;line-height:1.45}
.cap b{font-family:GS;font-size:24px;letter-spacing:-.01em;text-transform:none;display:block;margin-bottom:4px;font-weight:600}
.crops{display:flex;gap:16px}
.crop{position:relative;overflow:hidden;border:3px solid #000;border-radius:18px;background:#fff}
.crop img{position:absolute;max-width:none}
.vs{align-self:center;font-size:40px;font-weight:600}
.notes{font-size:24px;line-height:1.4;max-width:560px}
.notes p{margin:0 0 14px}
.pill{display:inline-block;border:3px solid #000;border-radius:99px;padding:2px 14px;background:#fff;font-size:20px;margin-right:6px}
</style></head><body><div class="wrap">
<h1>Same engine, new <em>camera</em></h1>
<div class="sub">TASK-057 · Lottie stories pilot · a phone screen capture vs a frame of the Lottie story · 1080×1920 both</div>
<div class="row">
  <div class="cell"><img class="f" src="${img("plain-street.png")}"><div class="cap"><b>Screen capture</b>The site on a phone, Street view at Two Minutes. UI and the place card over the city.</div></div>
  <div class="vs">→</div>
  <div class="cell"><img class="f" src="${img(A)}"><div class="cap"><b>Story A, street level</b>The same street from the engine: 5 depth layers at 2×, a crane down and a slow drift, the bulbs on.</div></div>
  <div class="cell"><div class="crops">${crop(img("plain-street.png"), [440, 500, 340, 520])}${crop(img(A), [360, 590, 420, 700])}</div><div class="cap"><b>Detail at 2×</b>Two Minutes' front: the capture (left) has the site's haze and grain over a 1× canvas; the story (right) is drawn at 2× and kept sharp under the move.</div></div>
</div>
<div class="row">
  <div class="cell"><img class="f" src="${img("plain-birdseye.png")}"><div class="cap"><b>Screen capture</b>Bird's eye, the place card open.</div></div>
  <div class="vs">→</div>
  <div class="cell"><img class="f" src="${img(AIR)}"><div class="cap"><b>Story A, bird's eye</b>Three nested renders of one camera (each half the field of the last): a ×4 zoom with no soft frame.</div></div>
  <div class="cell"><img class="f" src="${img(BT)}"><div class="cap"><b>Story B, the pill opening</b>The Multiverse pill opens on Sketchbook layer by layer, the far city first.</div></div>
  <div class="cell"><img class="f" src="${img(B)}"><div class="cap"><b>Story B, Sketchbook</b>The notebook pass of the same layers, cut out with the colour layers' alpha.</div></div>
</div>
</div></body></html>`;
const br = await pw.chromium.launch();
const p = await br.newPage({ viewport: { width: 1940, height: 800 }, deviceScaleFactor: 1 });
await p.setContent(html, { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: OUT, fullPage: true, type: "jpeg", quality: 88 });
await br.close();
console.log("sheet", OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
