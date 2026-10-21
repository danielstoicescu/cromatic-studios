// Cromatic · stories in Lottie · story D3 (TASK-065e, Daniel: "a nicer card from Steam's case page, with the t-shirts
// and the brand manual's pages, in Steam's font"): Steam's material as cards (PNG, transparent round them), drawn in a
// page with the site's own fonts (the case page's 'Steam Serif' = DM Serif Display for the title, Darker Grotesque for
// its lines) and the case's own pictures (site/wp-uploads). Each card in the objects' style of Iris's system: radius 30,
// an ink keyline, a hard ink shadow. LOCAL ONLY.   node make-steam-cards.mjs -> ../images/d3-steam-*.webp, platesD3s.json
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import fs from "fs";
import path from "path";
const here = path.dirname(new URL(import.meta.url).pathname), ROOT = path.resolve(here, "../../../../.."), OUT = path.resolve(here, "../images");
const b64 = (f) => fs.readFileSync(f).toString("base64"), F = (f) => path.join(ROOT, "site/fonts", f), U = (f) => path.join(ROOT, "site/wp-uploads/2025", f);
const LOGO = "/Users/daniel.stoic/cromatic-ops/refs/stories-lottie/v4/steam-logo-original.png";
const img = (f, mime = "image/jpeg") => `data:${mime};base64,${b64(f)}`;
const GREEN = "#1F9E46", INK = "#0D0C09";
const css = `
@font-face{font-family:SteamSerif;src:url(data:font/woff2;base64,${b64(F("dm-serif-display-latin.woff2"))}) format("woff2")}
@font-face{font-family:Darker;src:url(data:font/woff2;base64,${b64(F("darker-grotesque-latin.woff2"))}) format("woff2");font-weight:300 900}
body{margin:0;background:transparent;font-family:Darker}
.c{position:absolute;left:40px;top:40px;border:5px solid ${INK};border-radius:30px;box-shadow:0 12px 0 ${INK};overflow:hidden;box-sizing:border-box}
.title{width:860px;padding:56px 60px 60px;background:${GREEN};color:#fff}
.title .logo{width:150px;height:186px;background:url(${img(LOGO, "image/png")}) center/contain no-repeat;filter:invert(1);mix-blend-mode:screen}
.title .k{font:700 30px/1 Darker;letter-spacing:.12em;text-transform:uppercase;margin:34px 0 18px;opacity:.92}
.title h1{font:400 104px/0.98 SteamSerif;letter-spacing:-.01em;margin:0}
.title .m{font:600 34px/1.25 Darker;margin-top:30px;opacity:.95}
.title .tags{display:flex;gap:14px;margin-top:30px;flex-wrap:wrap}
.title .tags span{font:700 30px/1 Darker;padding:14px 26px;border-radius:999px;background:#fff;color:${INK};border:4px solid ${INK}}
.pic{background:#fff}.pic img{display:block;width:100%;height:100%;object-fit:cover}
`;
const CARDS = [
  ["title", `<div class="c title"><div class="logo"></div><div class="k">Steam Coffee Shop · 2024 to 2025</div><h1>Refreshing a pioneer brand for its community.</h1><div class="m">Brand strategy, brand facelift, content strategy, photo, video, merch, packaging</div><div class="tags"><span>Branding &amp; Design</span><span>Growth &amp; Content</span></div></div>`],
  ["tees", `<div class="c pic" style="width:820px;height:682px"><img src="${img(U("06/Tricouri-Steam-Cromaticstudios-1.jpg"))}"></div>`],
  ["tees2", `<div class="c pic" style="width:820px;height:682px"><img src="${img(U("06/Tricouri-Steam-Cromaticstudios-3.jpg"))}"></div>`],
  ["manual-3c", `<div class="c pic" style="width:900px;height:507px"><img src="${img(U("06/Steam-Cromaticstudios-10.jpg"))}"></div>`],
  ["manual-values", `<div class="c pic" style="width:900px;height:507px"><img src="${img(U("06/Steam-Cromaticstudios-11.jpg"))}"></div>`],
  ["manual-logo", `<div class="c pic" style="width:900px;height:506px"><img src="${img(U("06/Steam-Cromaticstudios-21.jpg"))}"></div>`]
];
const br = await pw.chromium.launch(); const p = await br.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 1 });
const plates = {};
for (const [id, html] of CARDS) {
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  const el = await p.$(".c"), bb = await el.boundingBox();
  const buf = await p.screenshot({ type: "png", omitBackground: true, clip: { x: bb.x - 2, y: bb.y - 2, width: bb.width + 4, height: bb.height + 16 } });
  const nm = `d3-steam-${id}`, f = path.join(OUT, nm + ".webp");
  await sharp(buf).webp({ quality: 88, alphaQuality: 95 }).toFile(f);
  const m = await sharp(f).metadata();
  plates[nm] = { file: nm + ".webp", x: 0, y: 0, w: m.width, h: m.height, kb: Math.round(fs.statSync(f).size / 1024) };
  console.log(nm, m.width, m.height);
}
await br.close();
fs.writeFileSync(path.join(here, "platesD3s.json"), JSON.stringify({ plates }));
