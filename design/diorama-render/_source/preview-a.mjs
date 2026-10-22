// Cromatic · diorama renders (TASK-118): the diorama preview of story A's first four shots, with the real cards on top.
// The cards are Iris's and Lia's (design/stories/cards, read from the stories-lottie worktree, untouched): built into a
// cards-only Lottie on A6's spans, drawn by lottie-web's canvas renderer on a transparent page, frame by frame (every
// other frame of the 60 fps Lottie), then laid over the diorama frames (out/a6d/<shot>-NNNN.png), encoded.
//   node _source/preview-a.mjs [outDir]
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const STL = "/Users/daniel.stoic/cromatic-stories-lottie", HERE = path.resolve(new URL("..", import.meta.url).pathname);
const OUT = process.argv[2] || "/Users/daniel.stoic/cromatic-ops/refs/diorama-render/preview-a";
const FF = "/Users/daniel.stoic/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg";
const { Comp } = await import(`${STL}/design/lottie-ui/_source/lib/ui.mjs`);
const { loadCards, drawCard } = await import(`${STL}/design/stories/cards/cards.mjs`);
const SP = { over: [0, 152], steam: [152, 268], oma: [268, 402], scf: [402, 516] }, F = 516;
const KC = await loadCards();
const card = (id) => { const { __T, ...src } = KC.card(id), c = JSON.parse(JSON.stringify(src)); c.__T = KC.T; return c; };
const Cm = new Comp({ w: 1080, h: 1920, dur: F / 60, nm: "story A in diorama · the cards" });
for (const id of ["a1-website", "a2-brand"]) drawCard(Cm, card(id), SP);
const J = Cm.json();
fs.mkdirSync(path.join(HERE, "out/a6d/cards"), { recursive: true });
fs.writeFileSync(path.join(HERE, "out/a6d/cards.json"), JSON.stringify(J));
console.log("cards", J.layers.length, "layers,", (J.assets || []).length, "assets");
// the cards, transparent, 30 fps
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await p.route("http://cards.local/**", (r) => { const u = new URL(r.request().url()).pathname; if (u === "/") return r.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><html><head><style>html,body{margin:0;background:transparent}#l{position:fixed;inset:0}canvas{display:block}</style></head><body><div id="l"></div><script src="/lottie.js"></script><script>fetch("/cards.json").then(r=>r.json()).then(d=>{const a=lottie.loadAnimation({container:document.getElementById("l"),renderer:"canvas",loop:false,autoplay:false,animationData:d,rendererSettings:{clearCanvas:true,preserveAspectRatio:"xMidYMid meet"}});window.anim=a;a.addEventListener("DOMLoaded",()=>{window.ready=1});window.go=(f)=>a.goToAndStop(f,true);});</script></body></html>` }); if (u === "/lottie.js") return r.fulfill({ status: 200, contentType: "text/javascript", body: fs.readFileSync(`${STL}/design/intro-lottie/_lib/lottie_light_canvas.min.js`) }); if (u === "/cards.json") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(J) }); r.fulfill({ status: 404, body: "" }); });
await p.goto("http://cards.local/");
await p.waitForFunction(() => window.ready, null, { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
const n = F / 2;
for (let i = 0; i < n; i++) { await p.evaluate((f) => window.go(f), i * 2); await p.screenshot({ path: path.join(HERE, `out/a6d/cards/c${String(i).padStart(4, "0")}.png`), omitBackground: true }); }
await br.close();
// over the diorama frames
const shots = [["over", 76], ["steam", 58], ["oma", 67], ["scf", 57]], comp = path.join(HERE, "out/a6d/comp");
fs.mkdirSync(comp, { recursive: true });
let k = 0;
for (const [s, cnt] of shots) for (let i = 0; i < cnt; i++, k++) {
  const base = path.join(HERE, `out/a6d/${s}-${String(i).padStart(4, "0")}.png`), c = path.join(HERE, `out/a6d/cards/c${String(k).padStart(4, "0")}.png`);
  await sharp(base).composite(fs.existsSync(c) ? [{ input: c }] : []).png().toFile(path.join(comp, `f${String(k).padStart(4, "0")}.png`));
}
fs.mkdirSync(OUT, { recursive: true });
const mp4 = path.join(OUT, "a6-diorama-draft.mp4");
const r = spawnSync(FF, ["-y", "-v", "error", "-framerate", "30", "-i", path.join(comp, "f%04d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", mp4], { stdio: "inherit" });
if (r.status) process.exit(r.status);
// the contact sheet: every 8th frame, 270 x 480 tiles, the shot's name under each row's first
const pick = Array.from({ length: k }, (_, i) => i).filter((i) => i % 8 === 0 || i === k - 1), W = 270, H = 480, cols = 11, rows = Math.ceil(pick.length / cols);
const tiles = await Promise.all(pick.map((i) => sharp(path.join(comp, `f${String(i).padStart(4, "0")}.png`)).resize(W, H).toBuffer()));
await sharp({ create: { width: cols * W, height: rows * H, channels: 3, background: "#111" } }).composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).jpeg({ quality: 86 }).toFile(path.join(OUT, "contact-sheet.jpg"));
console.log(k, "frames ->", mp4);
