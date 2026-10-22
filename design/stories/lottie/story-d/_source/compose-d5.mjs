// Cromatic · stories in Lottie · story D5 (TASK-115, Iris): the Lottie (lottie-web, on a transparent stage) over the
// frames of the new shots (frames/d5: the site's grid, the city from high, the move down, the street at Steam, the
// case page), per BG in build-d5.mjs (story-d5-en.json's cromatic.bg), at 30 fps -> MP4, poster, contact sheet.
//   PORT=8994 node serve.mjs &    then   node compose-d5.mjs <out dir> [poster frame]
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const here = path.dirname(new URL(import.meta.url).pathname), FR = path.resolve(here, "../../frames/d5");
const [OUT, posterAt = "300"] = process.argv.slice(2), TMP = path.join(OUT, "_d5frames");
fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const J = JSON.parse(fs.readFileSync(path.resolve(here, "../story-d5-en.json"), "utf8")), BG = J.cromatic.bg, F = J.op;
const list = (k) => fs.readdirSync(FR).filter((f) => f.startsWith(k + "-")).sort();
const FRS = Object.fromEntries(["site", "bird", "zoom", "steam", "page"].map((k) => [k, list(k)]));
// the background of a story frame (60 fps): a frame of its shot, held on its last if the shot runs longer
const bgOf = (f) => {
  for (const [k, a, b] of BG) if (f >= a && f < b) {
    if (k === "street") return path.join(FR, FRS.steam[FRS.steam.length - 1]);
    const arr = FRS[k], off = k === "site" ? 10 : 0; return path.join(FR, arr[Math.min(arr.length - 1, off + Math.floor((f - a) / 2))]);
  }
  return null;
};
const bgImg = async (f) => sharp(f).resize(1080, 1920).removeAlpha();
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto(`http://127.0.0.1:${process.env.PORT || 8994}/design/stories/lottie/story-d/_source/stage-alpha.html?s=story-d5-en.json`);
await p.waitForFunction(() => window.ready, null, { timeout: 180000 });
await p.waitForTimeout(500);
const t0 = Date.now(); let n = 0;
// (PEEK=f,f,...: only those story frames (60 fps), as JPGs in OUT, for a look)
if (process.env.PEEK) { for (const f of process.env.PEEK.split(",").map(Number)) { await p.evaluate((f) => window.go(f), f); const top = await p.screenshot({ omitBackground: true }), bg = bgOf(f); await (bg ? (await bgImg(bg)).composite([{ input: top }]) : sharp(top).flatten({ background: "#000000" })).jpeg({ quality: 85 }).toFile(path.join(OUT, `peek-${f}.jpg`)); } await br.close(); process.exit(0); }
// (SHEET=1: only the contact sheet's frames, then the sheet: a look before the whole render)
const SHEET = !!process.env.SHEET;
const PICKS = (C, nn) => [["Our portfolio", C.site, 0.7], ["The map, from high", C.bird, 0.3], ["The cards", C.bird, 0.62], ["Down to Steam", C.zoom, 0.55], ["At Steam", C.zoom, 0.99], ["Knock knock.", C.steam, 0.62], ["Come in.", [790, 850], 0.8], ["The green T-shirt", [850, 1140], 0.2], ["The brand manual", [850, 1140], 0.45], ["Ne știm de la Steam", [850, 1140], 0.97], ["Closed into its pill", [1140, 1176], 0.6], ["Drive.", C.r1, 0.6], ["Snoop.", C.r2, 0.6], ["Overtake.", C.r3, 0.6], ["Pass Go. (the TAC pop-up)", C.r4, 0.6], ["Fly high.", C.r5, 0.6], ["Sip through.", C.sip, 0.6], ["Dive.", C.r9, 0.6], ["Avoid being pulled over.", C.r8, 0.6], ["See you around.", C.fount, 0.6], ["Black, the pill", C.end, 0.9]].map(([l, [a, b], u]) => [l, Math.min(nn - 1, Math.round((a + (b - a) * u) / 2))]);
const want = SHEET ? new Set(PICKS(J.cromatic.cuts, Math.ceil(F / 2)).map((x) => x[1])) : null;
for (let f = 0; f < F; f += 2, n++) {
  if (want && !want.has(n)) continue;
  await p.evaluate((f) => window.go(f), f);
  const top = await p.screenshot({ omitBackground: true }), bg = bgOf(f), o = path.join(TMP, `f${String(n).padStart(5, "0")}.png`);
  if (bg) await (await bgImg(bg)).composite([{ input: top }]).png({ compressionLevel: 1 }).toFile(o);
  else await sharp(top).flatten({ background: "#000000" }).png({ compressionLevel: 1 }).toFile(o);
}
await br.close();
console.log(n, "frames in", ((Date.now() - t0) / 1000).toFixed(0), "s");
n = Math.ceil(F / 2);
const mp4 = path.join(OUT, "story-d5-en.mp4");
if (!SHEET) {
execFileSync(FF, ["-y", "-loglevel", "error", "-framerate", "30", "-i", `${TMP}/f%05d.png`, "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-maxrate", "8M", "-bufsize", "16M", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2", "-movflags", "+faststart", mp4]);
execFileSync(FF, ["-y", "-loglevel", "error", "-i", `${TMP}/f${String(+posterAt).padStart(5, "0")}.png`, "-q:v", "2", path.join(OUT, "story-d5-en-poster.jpg")]);
}
// the contact sheet: a frame from the middle of every shot (and the stops of the page)
const C = J.cromatic.cuts, picks = PICKS(C, n);
const w = 216, h = 384, cols = 11, rows = Math.ceil(picks.length / cols), lab = 54;
const tiles = await Promise.all(picks.map(async ([l, i]) => sharp(path.join(TMP, `f${String(i).padStart(5, "0")}.png`)).resize(w, h).toBuffer()));
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols * (w + 14) + 14}" height="${rows * (h + lab + 14) + 90}"><text x="14" y="52" font-family="Google Sans, Helvetica" font-weight="600" font-size="38" fill="#FBFAF5">Story D5 · around the city · ${(F / 60).toFixed(1)} s</text>${picks.map(([l], k) => `<text x="${14 + (k % cols) * (w + 14)}" y="${90 + Math.floor(k / cols) * (h + lab + 14) + h + 26}" font-family="Google Sans, Helvetica" font-size="15" fill="${/placeholder/.test(l) ? "#F65342" : "#FED012"}">${l.replace(/&/g, "&amp;")}</text>`).join("")}</svg>`);
await sharp({ create: { width: cols * (w + 14) + 14, height: rows * (h + lab + 14) + 90, channels: 3, background: "#111114" } }).composite([...tiles.map((b, k) => ({ input: b, left: 14 + (k % cols) * (w + 14), top: 70 + Math.floor(k / cols) * (h + lab + 14) })), { input: svg, left: 0, top: 0 }]).jpeg({ quality: 86 }).toFile(path.join(OUT, "contact-sheet-d5.jpg"));
fs.rmSync(TMP, { recursive: true, force: true });
if (!SHEET) console.log("wrote", mp4, (fs.statSync(mp4).size / 1e6).toFixed(2), "MB"); else console.log("sheet only");
