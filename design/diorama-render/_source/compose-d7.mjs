// Cromatic · diorama renders (TASK-118) · story D7: the overlay Lottie (build-d7.gen.mjs -> out/d7/story-d7-en.json,
// Iris's pins, cards, page pill) on a transparent stage over the frames: the site's and Steam's page captures (Iris's
// frames/d6, read-only) and the diorama renders (out/d7/<shot>-NNNN.png, 2x), at 30 fps -> MP4 + contact sheet.
//   node _source/compose-d7.mjs <outDir> [--sheet]      (--sheet: only the sheet's frames, then the sheet)
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), SRC = path.join(HERE, "out/d7");
const IRIS = "/Users/daniel.stoic/cromatic-d5/design", FR6 = path.join(IRIS, "stories/lottie/frames/d6");
const OUT = process.argv[2] || "/Users/daniel.stoic/cromatic-ops/refs/diorama-render/d7", SHEET = process.argv.includes("--sheet");
const FF = "/Users/daniel.stoic/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg";
const SD = process.env.STORY || "d7", J = JSON.parse(fs.readFileSync(path.join(SRC, `story-${SD}-en.json`), "utf8")), C = J.cromatic.cuts, F = J.op;
const list6 = (k) => fs.readdirSync(FR6).filter((f) => f.startsWith(k + "-")).sort();
const mine = (k) => fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => new RegExp(`^${k}-\\d{4}\\.png$`).test(f)).sort() : [];
const S6 = { site: list6("site"), page: list6("page") }, M = Object.fromEntries(["bird", "zoom", "steam", "r1", "r2", "r3", "r4", "r5", "r9", "r8", "fount"].map((k) => [k, mine(k)]));
const REAL = 850, CLOSE0 = 1140;
const BG = [["site", 0, 240, "6"], ["bird", 240, 456], ["zoom", 456, 660], ["steam", 660, REAL], ["page", REAL, CLOSE0, "6"], ["street", CLOSE0, C.r1[0]], ...["r1", "r2", "r3", "r4", "r5", "r9", "r8"].map((k) => [k, C[k][0], C[k][1]]), ["fount", C.fount[0], C.end[0] + 30]];
const bgOf = (f) => {
  for (const [k, a, b, six] of BG) if (f >= a && f < b) {
    if (six) { const arr = S6[k], off = k === "site" ? 10 : 0; return arr.length ? path.join(FR6, arr[Math.min(arr.length - 1, off + Math.floor((f - a) / 2))]) : null; }
    // (by frame number: a sheet renders only some; a shot longer than its render holds its last)
    const kk = k === "street" ? "steam" : k, arr = M[kk]; if (!arr.length) return null;
    const nums = arr.map((x) => +x.match(/(\d{4})\.png$/)[1]), want = k === "street" ? Infinity : Math.floor((f - a) / 2);
    let best = nums[0]; for (const q of nums) if (q <= want) best = q;
    return path.join(SRC, `${kk}-${String(best).padStart(4, "0")}.png`);
  }
  return null;
};
const TMP = path.join(SRC, SHEET ? "_sheet" : "_comp"); fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.route("http://d7.local/**", (r) => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname);
  if (u === "/") return r.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><html><head><style>html,body{margin:0;background:transparent;overflow:hidden}#l{position:fixed;inset:0}canvas{display:block;width:100%!important;height:100%!important}</style></head><body><div id="l"></div><script src="/lottie.js"></script><script>const a=lottie.loadAnimation({container:document.getElementById("l"),renderer:"canvas",loop:false,autoplay:false,path:"/story-d/story-d7-en.json",rendererSettings:{clearCanvas:true,preserveAspectRatio:"xMidYMid meet"}});window.anim=a;const sm=()=>{try{const c=a.renderer.canvasContext;c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high"}catch(e){}};a.addEventListener("DOMLoaded",sm);a.addEventListener("loaded_images",()=>{window.ready=1});window.go=(f)=>{sm();a.goToAndStop(f,true)};</script></body></html>` });
  if (u === "/lottie.js") return r.fulfill({ status: 200, contentType: "text/javascript", body: fs.readFileSync(path.join(IRIS, "intro-lottie/_lib/lottie_light_canvas.min.js")) });
  if (u === "/story-d/story-d7-en.json" || u === `/story-d/story-${SD}-en.json`) return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(J) });
  if (u.startsWith("/story-d/images/")) { const f = path.join(IRIS, "stories/lottie/story-d/images", u.slice(16)); if (fs.existsSync(f)) return r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: f.endsWith(".png") ? "image/png" : "image/webp" }); }
  r.fulfill({ status: 404, body: "" });
});
await p.goto("http://d7.local/"); await p.waitForFunction(() => window.ready, null, { timeout: 180000 }); await p.waitForTimeout(500);
// the sheet: a frame from inside every shot (and the cards' moments)
const mid = (k, u) => Math.round((C[k][0] + (C[k][1] - C[k][0]) * u) / 2);
const PICKS = [["Our portfolio", Math.round(170 / 2)], ["The pins", mid("bird", 0.2)], ["The cards", mid("bird", 0.45)], ["The map line", mid("bird", 0.85)], ["Down to Steam", mid("zoom", 0.55)], ["At Steam", Math.round(650 / 2)], ["Knock knock.", Math.round(770 / 2)], ["Come in.", Math.round(830 / 2)], ["The page", Math.round(1000 / 2)], ["The street", Math.round(1180 / 2)], ["Drive.", mid("r1", 0.6)], ["Snoop.", mid("r2", 0.6)], ["Overtake.", mid("r3", 0.6)], ["Pass Go.", mid("r4", 0.6)], ["Fly high.", mid("r5", 0.6)], ["Dive.", mid("r9", 0.6)], ["…pulled over.", mid("r8", 0.6)], ["See you around.", mid("fount", 0.6)], ["The end", mid("end", 0.7)]];
const want = SHEET ? new Set(PICKS.map((x) => x[1])) : null, n = Math.ceil(F / 2);
for (let i = 0; i < n; i++) {
  if (want && !want.has(i)) continue;
  const f = i * 2; await p.evaluate((f) => window.go(f), f);
  const top = await p.screenshot({ omitBackground: true }), bg = bgOf(f), o = path.join(TMP, `f${String(i).padStart(5, "0")}.png`);
  const base = bg ? sharp(bg).resize(1080, 1920, { kernel: "lanczos3" }).removeAlpha() : sharp({ create: { width: 1080, height: 1920, channels: 3, background: "#000000" } });
  await sharp(await base.png().toBuffer()).composite([{ input: top }]).png({ compressionLevel: 1 }).toFile(o);
}
await br.close();
fs.mkdirSync(OUT, { recursive: true });
if (!SHEET) { const r = spawnSync(FF, ["-y", "-v", "error", "-framerate", "30", "-i", path.join(TMP, "f%05d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", path.join(OUT, `story-${SD}-en.mp4`)], { stdio: "inherit" }); if (r.status) process.exit(r.status); }
const w = 216, h = 384, cols = 10, rows = Math.ceil(PICKS.length / cols), lab = 50;
const tiles = await Promise.all(PICKS.map(([, i]) => sharp(path.join(TMP, `f${String(i).padStart(5, "0")}.png`)).resize(w, h).toBuffer()));
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols * (w + 14) + 14}" height="${rows * (h + lab + 14) + 84}"><text x="14" y="50" font-family="Helvetica" font-weight="700" font-size="34" fill="#FBFAF5">Story ${SD.toUpperCase()} in diorama · ${(F / 60).toFixed(1)} s${SHEET ? " · draft" : ""}</text>${PICKS.map(([l], k) => `<text x="${14 + (k % cols) * (w + 14)}" y="${84 + Math.floor(k / cols) * (h + lab + 14) + h + 30}" font-family="Helvetica" font-size="20" fill="#cfcfd6">${esc(l)}</text>`).join("")}</svg>`);
await sharp({ create: { width: cols * (w + 14) + 14, height: rows * (h + lab + 14) + 84, channels: 3, background: "#111114" } }).composite([...tiles.map((b, k) => ({ input: b, left: 14 + (k % cols) * (w + 14), top: 64 + Math.floor(k / cols) * (h + lab + 14) })), { input: svg, left: 0, top: 0 }]).jpeg({ quality: 88 }).toFile(path.join(OUT, SHEET ? `contact-sheet-${SD}-draft.jpg` : `contact-sheet-${SD}.jpg`));
fs.rmSync(TMP, { recursive: true, force: true });
console.log(SHEET ? "sheet" : "mp4 + sheet", "->", OUT);
