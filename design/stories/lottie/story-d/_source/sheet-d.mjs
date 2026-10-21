// Cromatic · stories in Lottie · story D (TASK-066): the contact sheet: the old screen-capture stories it replaces (the
// rides on a plain ground, the tap on a building: design/stories/v5, read only) next to story D's frames. HTML laid out
// here, shot by Chromium, saved as a JPG.
//   node sheet-d.mjs <dir with story-d-en-f*.jpg and before-*.jpg> <out.jpg>
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const [DIR, OUT] = process.argv.slice(2);
const FONT = new URL("../../../../../site/fonts/google-sans-latin.woff2", import.meta.url).pathname;
const MONO = new URL("../../../../../site/fonts/gf/jetbrains-mono-latin.woff2", import.meta.url).pathname;
const b64 = (f) => fs.readFileSync(f).toString("base64");
const img = (f) => `data:image/jpeg;base64,${b64(`${DIR}/${f}`)}`;
const cell = (f, t, cap, cls = "") => `<div class="cell ${cls}"><img class="f" src="${img(f)}"><div class="cap"><b>${t}</b>${cap}</div></div>`;
const row = (cells) => `<div class="row">${cells.join("")}</div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:GS;src:url(data:font/woff2;base64,${b64(FONT)}) format("woff2");font-weight:100 900}
@font-face{font-family:JM;src:url(data:font/woff2;base64,${b64(MONO)}) format("woff2")}
body{margin:0;background:#F2F2F2;font-family:GS;color:#000;width:2280px}
.wrap{padding:56px 64px 64px}
h1{font-size:64px;letter-spacing:-.03em;margin:0 0 8px;font-weight:600}
h1 em{font-style:normal;background:#FED012;border:3px solid #000;border-radius:99px;padding:0 22px}
.sub{font-family:JM;font-size:20px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin-bottom:36px}
.row{display:flex;gap:22px;align-items:flex-start;margin-bottom:36px}
.cell{display:flex;flex-direction:column;gap:10px;width:248px}
.cell img.f{width:248px;height:441px;border:3px solid #000;border-radius:18px;display:block;background:#111;object-fit:cover}
.cell.old img.f{border-style:dashed}
.cap{font-family:JM;font-size:14px;letter-spacing:.06em;text-transform:uppercase;line-height:1.45}
.cap b{font-family:GS;font-size:20px;letter-spacing:-.01em;text-transform:none;display:block;margin-bottom:3px;font-weight:600}
.vs{align-self:center;font-size:40px;font-weight:600;width:30px}
.lbl{font-family:JM;font-size:16px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 10px}
</style></head><body><div class="wrap">
<h1>Around the <em>city</em></h1>
<div class="sub">TASK-066 · Lottie story D · the old screen captures vs frames of the story · 1080×1920 · 16.5 s · English</div>
<div class="lbl">Before: v5 screen captures (the rides on a plain ground; a tap on a building)</div>
${row([cell("before-16a.jpg", "v5 · story 16", "The rides, one by one, turning on a plain ground. Card over the frame.", "old"), cell("before-16b.jpg", "v5 · story 16", "Same frame, another ride.", "old"), cell("before-18.jpg", "v5 · story 18", "Tap a building, the card, a screen capture.", "old"),
  '<div class="vs">→</div>',
  cell("story-d-en-f60.jpg", "Our portfolio has traffic.", "Straight down on the roundabout, three rides going round; a crash zoom on the yellow one. Black type on the pale plaza, the one yellow pill."),
  cell("story-d-en-f150.jpg", "corner.", "Yoshi from the kerb, Dutch tilt. A black card hugs the word; it swaps with every cut."),
  cell("story-d-en-f205.jpg", "skyline.", "Investimental from its foot, turning. The card narrows to the new word."),
  cell("story-d-en-f262.jpg", "facade.", "The Court dead centre, a sweep of light; then a crash zoom on its door.")])}
${row([cell("story-d-en-f346.jpg", "Knock knock.", "The site's own place card rises; each word lands with a tap on Go deeper."),
  cell("story-d-en-f368.jpg", "The pill", "The site's own transition: the button's pill stretches sideways, then up and down, the Multiverse ring round it."),
  cell("story-d-en-f405.jpg", "Come in.", "The case page as the map opens it (the frame's Share and close)."),
  cell("story-d-en-f480.jpg", "Crash scroll", "Down the page to the bench, its own pixels smeared on the way."),
  cell("story-d-en-f548.jpg", "Drive.", "Night, from the bumper. Big, low, rising through its slot."),
  cell("story-d-en-f570.jpg", "Snoop.", "A black label, top right."),
  cell("story-d-en-f605.jpg", "Overtake.", "A held wide; the F1 crosses it (rendered per frame, a 180° shutter); the word slides with it."),
  cell("story-d-en-f640.jpg", "Pass Go.", "A white card, the board's red arrow.")])}
${row([cell("story-d-en-f668.jpg", "Fly low.", "The Cropduster from below; a cream card."),
  cell("story-d-en-f700.jpg", "Slip through.", "Straight down on the scooter; two lines, right."),
  cell("story-d-en-f725.jpg", "Pour.", "The Kompus truck sliding by; the yellow pill."),
  cell("story-d-en-f752.jpg", "Pull over.", "The card flashes red and blue in the lamps' 190 ms beat."),
  cell("story-d-en-f785.jpg", "Dive.", "Under water; the word drops in."),
  cell("story-d-en-f975.jpg", "End", "The roundabout at night, held; the yellow ride goes round; the last line; the pill on its own, tilted.")])}
</div></body></html>`;
const br = await pw.chromium.launch();
const p = await br.newPage({ viewport: { width: 2280, height: 800 }, deviceScaleFactor: 1 });
await p.setContent(html, { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: OUT, fullPage: true, type: "jpeg", quality: 86 });
await br.close();
console.log("sheet", OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
