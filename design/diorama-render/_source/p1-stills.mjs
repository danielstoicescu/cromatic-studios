// Cromatic · diorama renders · story P1 (TASK-129): the storyboard's hero stills at 1080 x 1920 (jpg) + a contact
// sheet. The 3D frames come from out/p1 (the renderer, 2x); the type is set in the house face (Google Sans 600, Iris's
// card system: one colour, the safe areas); the Postcard UI is captured from the real map (ui-capture png, optional).
//   node _source/p1-stills.mjs [outDir]
import fs from "fs";
import path from "path";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), SRC = path.join(HERE, "out/p1"), ROOT = path.resolve(HERE, "../..");
const OUT = process.argv[2] || "/Users/daniel.stoic/cromatic-ops/refs/diorama-render/p1/stills";
fs.mkdirSync(OUT, { recursive: true });
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, "site/fonts", f)).toString("base64")}`;
const img = async (f, w = 1080, h = 1920) => `data:image/jpeg;base64,${(await sharp(f).resize(w, h).jpeg({ quality: 92 }).toBuffer()).toString("base64")}`;
const S = {}; for (const k of ["s1-sunrise", "s2-sakura", "s3-sunglint", "s4-dusk", "s5-neon", "s6-fountain"]) { const f = path.join(SRC, `${k}-0000.png`); if (fs.existsSync(f)) S[k] = await img(f); }
const CSS = `@font-face{font-family:GS;src:url(${font("google-sans-latin.woff2")});font-weight:100 900}
*{margin:0;box-sizing:border-box} body{width:1080px;height:1920px;overflow:hidden;background:#000;font-family:GS,Helvetica,sans-serif}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.head{position:absolute;left:80px;top:300px;color:#FBFAF5;font-weight:600;font-size:168px;line-height:.94;letter-spacing:-.045em;text-shadow:0 6px 30px rgba(0,0,0,.25)}
.pill{position:absolute;left:50%;top:1000px;transform:translate(-50%,-50%) rotate(-6deg);background:#FED012;color:#0D0C09;font-weight:600;font-size:64px;letter-spacing:-.02em;padding:14px 46px 18px;border-radius:999px;border:6px solid #0D0C09;box-shadow:10px 14px 0 #0D0C09}
.card{position:absolute;background:#fbf8f1;border-radius:22px;padding:26px 26px 110px;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.card .ph{position:relative;width:100%;height:100%;border-radius:10px;background-size:cover;background-position:center;overflow:hidden}
.card .gr{position:absolute;right:22px;bottom:52px;color:rgba(255,255,255,.95);font-weight:800;letter-spacing:-.02em;text-shadow:0 2px 8px rgba(0,0,0,.42)}
.card .sg{position:absolute;right:22px;bottom:20px;color:rgba(255,255,255,.88);font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.38)}
.card .sg::before{content:"";display:inline-block;width:.44em;height:.44em;border-radius:50%;background:#FED012;margin-right:.35em;vertical-align:.12em}
.lead{position:absolute;left:80px;top:300px;color:#FBFAF5;font-weight:600;font-size:60px;line-height:1.1;letter-spacing:-.025em}
.card .hand{position:absolute;left:30px;bottom:30px;color:#5a4f45;font-weight:500;font-size:34px;letter-spacing:-.01em}`;
const postcard = (src, { x, y, w, h, r = 0, scale = 1 }) => `<div class="card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${r}deg) scale(${scale})"><div class="ph" style="background-image:url(${src})"><div class="gr" style="font-size:${Math.round(w * 0.05)}px">Greetings from Cromatic City</div><div class="sg" style="font-size:${Math.round(w * 0.03)}px">cromaticstudios.com</div></div><div class="hand">Cromatic City · 2026</div></div>`;
const pages = [];
if (S["s1-sunrise"]) pages.push(["01-sunrise", `<div class="bg" style="background-image:url(${S["s1-sunrise"]})"></div><div class="head" style="font-size:116px;line-height:1;letter-spacing:-.04em">Find the angles<br>we missed.</div>`]);
for (const [k, n] of [["s2-sakura", "02-sakura"], ["s3-sunglint", "03-sun-glint"], ["s4-dusk", "04-dusk"], ["s5-neon", "05-neon-night"], ["s6-fountain", "06-fountain-after-rain"]]) if (S[k]) pages.push([n, `<div class="bg" style="background-image:url(${S[k]})"></div>`]);
// the real Postcard interface (captured alone, transparent) over a diorama frame (the car, low drama)
const uiA = path.join(HERE, "out/p1/ui-alpha.png");
if (fs.existsSync(uiA) && S["s3-sunglint"]) pages.push(["07-postcard-ui", `<div class="bg" style="background-image:url(${S["s3-sunglint"]})"></div><div class="bg" style="background-image:url(data:image/png;base64,${(await sharp(uiA).resize(1080, 1920).png().toBuffer()).toString("base64")})"></div>`]);
if (S["s3-sunglint"]) pages.push(["08-the-postcard", `<div class="bg" style="background-image:url(${S["s3-sunglint"]});filter:blur(26px) brightness(.55);transform:scale(1.1)"></div>${postcard(S["s3-sunglint"], { x: 120, y: 420, w: 840, h: 1240, r: -3 })}<div class="lead">Every corner is a postcard.</div>`]);
const mont = ["s1-sunrise", "s2-sakura", "s4-dusk", "s5-neon"].filter((k) => S[k]);
if (mont.length) pages.push(["09-montage", `<div class="bg" style="background:radial-gradient(circle at 50% 40%,#3a2b4f,#0c0a14)"></div>${mont.map((k, i) => postcard(S[k], { x: 150 + (i - 1.5) * 70, y: 560 + Math.abs(i - 1.5) * 30, w: 780, h: 1100, r: (i - 1.5) * 7 })).join("")}<div class="head" style="font-size:116px;line-height:1;letter-spacing:-.04em">Or the ones<br>we already love.</div>`]);
pages.push(["10-end", `<div class="bg" style="background:#000"></div><div class="head" style="top:300px">Take yours.</div><div class="pill">cromaticstudios.com</div>`]);
const br = await pw.chromium.launch(); const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
const files = [];
for (const [n, body] of pages) { await p.setContent(`<!doctype html><html><head><style>${CSS}</style></head><body>${body}</body></html>`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150); const f = path.join(OUT, `${n}.jpg`); await p.screenshot({ path: f, type: "jpeg", quality: 92 }); files.push([n, f]); }
await br.close();
const w = 270, h = 480, cols = 5, rows = Math.ceil(files.length / cols), lab = 40;
const tiles = await Promise.all(files.map(([, f]) => sharp(f).resize(w, h).toBuffer()));
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols * (w + 14) + 14}" height="${rows * (h + lab + 14) + 80}"><text x="14" y="48" font-family="Helvetica" font-weight="700" font-size="32" fill="#FBFAF5">Story P1 · Postcard · storyboard (hero stills)</text>${files.map(([n], k) => `<text x="${14 + (k % cols) * (w + 14)}" y="${80 + Math.floor(k / cols) * (h + lab + 14) + h + 28}" font-family="Helvetica" font-size="19" fill="#cfcfd6">${n}</text>`).join("")}</svg>`);
await sharp({ create: { width: cols * (w + 14) + 14, height: rows * (h + lab + 14) + 80, channels: 3, background: "#111114" } }).composite([...tiles.map((b, k) => ({ input: b, left: 14 + (k % cols) * (w + 14), top: 64 + Math.floor(k / cols) * (h + lab + 14) })), { input: svg, left: 0, top: 0 }]).jpeg({ quality: 88 }).toFile(path.join(path.dirname(OUT), "contact-sheet-p1-stills.jpg"));
console.log(files.length, "stills ->", OUT);
