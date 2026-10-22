// Cromatic · Zdrovit brand pages (TASK-076): device mockups made from captures of a brand's official product site
// (the site is Cromatic's work; the captures are Mira's, TASK-075: shots/<brand>/desktop-hero.png, desktop-full.png,
// phone-hero.png, phone-full.png, section-NN.png, desktop at 1440 x 2, phone at 390 x 2).
// One JSON per brand in brands/<slug>.json says which pictures to make; this script renders them in Chromium (the
// frames are plain HTML and CSS, in the case pages' own line: 1px ink outline, paper bar with three dots, rounded
// corners) and writes optimised JPGs to site/media/<slug>/<name>.jpg, with their sizes in site/cases/src/dims.json.
// The build makes the WebP variants.
//   node design/zdrovit-mockups/mock.mjs <slug> [name ...]       (no names: every picture in the brand's file)
//   SHOTS=<dir>  where the captures are (default ~/cromatic-ops/refs/zdrovit-pages/shots/<slug>)
//   PREVIEW=<dir>  also keep a PNG of each mockup there (for the evidence folder)
// Kinds (see brands/aspasia.json):
//   hero     the site in a browser window, the phone version beside it, on the brand's field (16:9, the page's hero,
//            cover and og picture). desktop: { src, y? }, phone: { src, y? }
//   browser  one stretch of the desktop page in a browser window on the field. src, crop: [x, y, w, h] in capture px
//   phone    one phone screen (390 x 844) on the field. src, y (capture px, 2x)
//   plain    a capture resized for the case page's own scrolling device frame (the "site" block). src, width
//   film     the brand's TV spot, once Daniel sends it (only full productions, no cuts or adaptations): src (an MP4,
//            absolute or in SHOTS), at (the poster frame, in seconds). Gives <name>.mp4 and <name>-poster.jpg; the
//            page shows it when the brand's entry in SPOTS (site/cases/src/specs270-zdrovit-web.mjs) is filled in
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
const { chromium, webkit } = await import(process.env.PLAYWRIGHT || "/Users/daniel.stoic/node_modules/playwright/index.mjs");

const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, "../..");
const [slug, ...only] = process.argv.slice(2);
if (!slug) { console.error("usage: node mock.mjs <slug> [name ...]"); process.exit(1); }
const B = JSON.parse(fs.readFileSync(path.join(here, "brands", slug + ".json"), "utf8"));
const SHOTS = process.env.SHOTS || path.join(os.homedir(), "cromatic-ops/refs/zdrovit-pages/shots", B.shots || slug);
const OUT = path.join(root, "site/media", slug);
const PREVIEW = process.env.PREVIEW;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zmock-"));
fs.mkdirSync(OUT, { recursive: true });
if (PREVIEW) fs.mkdirSync(PREVIEW, { recursive: true });

const INK = "#121212", PAPER = "#F1F1F1";
const [F1, F2] = B.field; // the field: a quiet two-stop gradient in the brand's colour
const W = 1600; // every mockup is drawn at 1600 CSS px and rendered at 2x, then brought back to its output width

// a stretch of a capture, saved as its own PNG (Chromium then only has to place it)
let n = 0;
async function cut(src, x, y, w, h) {
  const f = path.join(tmp, `c${n++}.png`);
  const img = sharp(path.join(SHOTS, src)), meta = await img.metadata();
  h = Math.min(h, meta.height - y);
  await img.extract({ left: x, top: y, width: w, height: h }).png().toFile(f);
  return { f: "file://" + f, w, h };
}
const css = `*{box-sizing:border-box;margin:0}html,body{background:transparent}
.stage{position:relative;overflow:hidden;background:radial-gradient(120% 140% at 18% 8%,${F1} 0%,${F2} 100%)}
.win{position:absolute;background:#fff;border:2px solid ${INK};border-radius:22px;overflow:hidden;box-shadow:0 50px 90px -40px rgba(10,40,45,.55),0 12px 24px -12px rgba(10,40,45,.25)}
.bar{display:flex;align-items:center;gap:10px;height:52px;padding:0 22px;background:${PAPER};border-bottom:2px solid ${INK}}
.bar i{width:15px;height:15px;border-radius:50%;border:2px solid ${INK};display:block}
.bar b{margin-left:18px;padding:6px 22px 8px;border:2px solid ${INK};border-radius:999px;background:#fff;font:700 19px/1 "Helvetica Neue",Helvetica,Arial,sans-serif;color:${INK};letter-spacing:.01em}
.win img{display:block;width:100%}
.phone{position:absolute;background:${INK};border-radius:58px;padding:13px;box-shadow:0 50px 90px -36px rgba(10,40,45,.6),0 14px 26px -14px rgba(10,40,45,.3)}
.phone .scr{position:relative;border-radius:46px;overflow:hidden;background:#fff}
.phone .scr img{display:block;width:100%}
.phone .sb{background:#fff}
.phone .isl{position:absolute;left:50%;width:31%;margin-left:-15.5%;background:${INK}}
.phone .scr::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}`;

async function render(page, html, w, h) {
  await page.setViewportSize({ width: w, height: h });
  // (from a file: a page set with setContent is about:blank and may not load file:// pictures)
  const f = path.join(tmp, `p${n++}.html`);
  fs.writeFileSync(f, `<!doctype html><meta charset="utf-8"><style>${css}</style><div class="stage" style="width:${w}px;height:${h}px">${html}</div>`);
  await page.goto("file://" + f, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: w, height: h } });
}
const win = (img, { x, y, w }) => `<div class="win" style="left:${x}px;top:${y}px;width:${w}px"><div class="bar"><i></i><i></i><i></i><b>${B.label}</b></div><img src="${img.f}"></div>`;
// a 390 x 844 screen: a 50 px status bar (white, under the island), then the page; s = the screen's width in CSS px
const SB = 50, SCREEN = (844 - SB) * 2; // (capture px of page under the status bar)
const phone = (img, { x, y, s }) => { const k = s / 390; return `<div class="phone" style="left:${x}px;top:${y}px;width:${s + 26}px"><div class="scr" style="height:${Math.round(844 * k)}px"><div class="sb" style="height:${Math.round(SB * k)}px"></div><img src="${img.f}"><span class="isl" style="top:${Math.round(12 * k)}px;height:${Math.round(32 * k)}px;border-radius:${Math.round(18 * k)}px"></span></div></div>`; };

const KINDS = {
  async hero(page, o) {
    const H = 900;
    // the browser runs off the bottom edge, the phone stands whole beside it
    const bw = 1160, sh = Math.round((H - 84) * 2880 / bw) + 40; // enough of the page to fill the window
    const d = await cut(o.desktop.src, 0, o.desktop.y || 0, 2880, sh);
    const p = await cut(o.phone.src, 0, o.phone.y || 0, 780, SCREEN);
    return [await render(page, win(d, { x: 96, y: 84, w: bw }) + phone(p, { x: 1180, y: 128, s: 304 }), W, H), W, H];
  },
  async browser(page, o) {
    const [x, y, w, h] = o.crop, pad = 72, ww = W - 2 * pad;
    const c = await cut(o.src, x, y, w, h);
    const H = Math.round(pad + 52 + 4 + ww * c.h / c.w + pad);
    return [await render(page, win(c, { x: pad, y: pad, w: ww }), W, H), W, H];
  },
  async phone(page, o) {
    const w = 640, h = 1040, s = 390;
    const p = await cut(o.src, 0, o.y || 0, 780, SCREEN);
    const ph = Math.round(s * 844 / 390) + 26;
    return [await render(page, phone(p, { x: (w - s - 26) / 2, y: Math.round((h - ph) / 2), s }), w, h), w, h];
  }
};

const dimsF = path.join(root, "site/cases/src/dims.json"), dims = JSON.parse(fs.readFileSync(dimsF, "utf8"));
const b = await chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const page = await b.newPage({ deviceScaleFactor: 2 });
let total = 0;
for (const [name, o] of Object.entries(B.out)) {
  if (only.length && !only.includes(name)) continue;
  const dst = path.join(OUT, name + ".jpg");
  let info;
  if (o.kind === "film") {
    // the TV spot: a web-ready MP4 (H.264, 1280 or 1920 wide, a few MB; export or transcode it first, this script
    // does not encode video) copied to site/media/<slug>/<name>.mp4, and its poster, the frame at o.at seconds, grabbed
    // in WebKit (Playwright's Chromium has no H.264) to <name>-poster.jpg
    const src = o.src.startsWith("/") ? o.src : path.join(SHOTS, o.src), mp4 = path.join(OUT, name + ".mp4");
    fs.copyFileSync(src, mp4);
    const wk = await webkit.launch(), wp = await wk.newPage();
    const f = path.join(tmp, `v${n++}.html`);
    fs.writeFileSync(f, `<!doctype html><style>*{margin:0}</style><video muted playsinline preload="auto" src="file://${mp4}"></video>`);
    await wp.goto("file://" + f);
    const [vw, vh] = await wp.evaluate(async (t) => { const v = document.querySelector("video"); if (v.readyState < 1) await new Promise((r) => v.addEventListener("loadedmetadata", r, { once: true })); v.currentTime = t; await new Promise((r) => v.addEventListener("seeked", r, { once: true })); return [v.videoWidth, v.videoHeight]; }, o.at ?? 2);
    await wp.setViewportSize({ width: vw, height: vh });
    const png = await wp.locator("video").screenshot();
    await wk.close();
    const pdst = path.join(OUT, name + "-poster.jpg");
    info = await sharp(png).resize({ width: Math.min(1600, vw) }).jpeg({ quality: 84, mozjpeg: true, progressive: true }).toFile(pdst);
    dims[`m:${slug}/${name}-poster`] = [info.width, info.height, fs.statSync(pdst).size];
    console.log(`site/media/${slug}/${name}.mp4 ${(fs.statSync(mp4).size / 1048576).toFixed(1)} MB, ${vw} x ${vh}, r ${(vw / vh).toFixed(3)} (put it in the spot's "r"); poster ${name}-poster.jpg`);
    total += fs.statSync(mp4).size + fs.statSync(pdst).size;
    continue;
  }
  if (o.kind === "plain") {
    // (WebP stops at 16383 px: a long page is cut at the bottom, at 16000 px once resized; the footer goes first)
    const img = sharp(path.join(SHOTS, o.src)), meta = await img.metadata();
    const maxSrc = Math.floor(16000 * meta.width / o.width);
    if (meta.height > maxSrc) { img.extract({ left: 0, top: 0, width: meta.width, height: maxSrc }); console.log(`  (${name}: cut at ${maxSrc} of ${meta.height} capture px)`); }
    info = await img.resize({ width: o.width }).flatten({ background: "#fff" }).jpeg({ quality: o.q || 78, mozjpeg: true, progressive: true }).toFile(dst);
  } else {
    const [png, w] = await KINDS[o.kind](page, o);
    if (PREVIEW) fs.writeFileSync(path.join(PREVIEW, name + ".png"), png);
    const ow = o.width || (o.kind === "phone" ? 900 : 1600); // the case pages' sizes: 1600 wide, portraits 900
    info = await sharp(png).resize({ width: Math.min(ow, w * 2), kernel: "lanczos3" }).flatten({ background: "#fff" }).jpeg({ quality: o.q || 84, mozjpeg: true, progressive: true }).toFile(dst);
  }
  const size = fs.statSync(dst).size;
  dims[`m:${slug}/${name}`] = [info.width, info.height, size];
  total += size;
  console.log(`site/media/${slug}/${name}.jpg ${info.width} x ${info.height} ${(size / 1024).toFixed(0)} KB`);
}
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
const tail = fs.readFileSync(dimsF, "utf8").endsWith("\n") ? "\n" : "";
fs.writeFileSync(dimsF, JSON.stringify(dims, null, 1).replace(/^ +/gm, "") + tail); // (the file's own format)
console.log(`${(total / 1024).toFixed(0)} KB in site/media/${slug}/`);
