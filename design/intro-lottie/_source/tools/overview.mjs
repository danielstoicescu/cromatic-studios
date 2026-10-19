// Cromatic opening (Lottie): overview.jpg, a side-by-side contact sheet of the three directions (laptop + phone),
// stills taken from the rendered MP4s. node ~/.x-li-overview.mjs
import pw from "playwright";
import fs from "fs";
import { execFileSync } from "child_process";
const R = "/Users/daniel.stoic/cromatic-drive/design/intro-lottie";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const tmp = `/tmp/li-overview-${process.pid}`; fs.mkdirSync(tmp, { recursive: true });
const DIRS = [
  ["A", "Pastila", "The pill", "Tipografie cinetică pe hârtie milimetrică; pastila își schimbă cuvântul, numără lumile și se deschide ca o diafragmă.", [1.48, 3.52, 5.15, 8.5, 9.72]],
  ["B", "Strada", "The street", "O stradă desenată pe care crește o casă; nouă lumi trec peste ea; camera se retrage și desenul aterizează pe strada reală.", [1.0, 3.6, 4.6, 8.4, 9.6]],
  ["C", "Ceașca", "The cup", "O ceașcă văzută de sus pe galbenul studioului; latte art, nouă cești, aburi; camera se scufundă în cafea, care se deschide spre oraș.", [1.0, 3.56, 5.3, 8.4, 9.62]]
];
const LBL = ["Rândul 1", "Rândul 2", "Lumile", "Cafeaua", "Predarea"];
for (const [k, , , , ts] of DIRS) for (const ab of ["desktop", "phone"]) ts.forEach((t, i) => execFileSync(FF, ["-y", "-loglevel", "error", "-ss", String(t), "-i", `${R}/${k}/${ab}.mp4`, "-frames:v", "1", "-q:v", "3", `${tmp}/${k}-${ab}-${i}.jpg`]));
const rows = DIRS.map(([k, ro, en, line, ts]) => `
<section><header><span class="k">${k}</span><div><h2>${ro} <i>${en}</i></h2><p>${line}</p></div></header>
<div class="strip">${ts.map((t, i) => `<figure class="d"><img src="file://${tmp}/${k}-desktop-${i}.jpg"><figcaption>${LBL[i]} · ${t.toFixed(1)} s</figcaption></figure>`).join("")}</div>
<div class="strip ph">${ts.map((t, i) => `<figure class="p"><img src="file://${tmp}/${k}-phone-${i}.jpg"></figure>`).join("")}</div></section>`).join("");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#F2F2F2;font:500 15px/1.35 -apple-system,system-ui,sans-serif;color:#000;padding:36px 40px 30px}
h1{font-size:30px;letter-spacing:-.02em;margin:0 0 4px}.sub{margin:0 0 26px;color:#333}
section{background:#fff;border:2.5px solid #000;border-radius:26px;padding:18px 20px 20px;margin-bottom:22px}
header{display:flex;gap:14px;align-items:center;margin-bottom:12px}.k{display:grid;place-items:center;width:46px;height:46px;border:2.5px solid #000;border-radius:999px;background:#FED012;font-weight:800;font-size:22px}
h2{margin:0;font-size:21px;letter-spacing:-.01em}h2 i{font-style:normal;font-weight:500;color:#555}p{margin:2px 0 0;color:#222}
.strip{display:flex;gap:10px}.strip.ph{margin-top:10px}
figure{margin:0}.d img{width:404px;height:252px;object-fit:cover;border:2px solid #000;border-radius:12px;display:block}
.p img{width:116px;height:251px;object-fit:cover;border:2px solid #000;border-radius:14px;display:block}
.strip.ph{gap:10px}.strip.ph figure{width:404px;display:flex;justify-content:center}
figcaption{font-size:12.5px;margin-top:5px;color:#333}
</style></head><body><h1>Cromatic Studios · deschiderea ca Lottie</h1><p class="sub">Trei direcții, faza 1. Sus laptop (1440×900), jos telefon (390×844). Fiecare: 10 s, aceleași replici, predare în harta 3D.</p>${rows}</body></html>`;
fs.writeFileSync(`${tmp}/overview.html`, html);
const br = await pw.chromium.launch();
const p = await br.newPage({ viewport: { width: 2190, height: 1200 }, deviceScaleFactor: 1 });
await p.goto(`file://${tmp}/overview.html`);
await p.waitForTimeout(400);
await p.screenshot({ path: `${tmp}/overview.png`, fullPage: true });
await br.close();
execFileSync(FF, ["-y", "-loglevel", "error", "-i", `${tmp}/overview.png`, "-q:v", "3", `${R}/overview.jpg`]);
console.log("overview", `${R}/overview.jpg`, (fs.statSync(`${R}/overview.jpg`).size / 1024).toFixed(0) + " KB");
