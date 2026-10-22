// Cromatic · diorama renders (TASK-118): story A7 (A in diorama, all of it) or the A preview: the diorama frames with the
// real cards on top. A7: node _source/preview-a.mjs <outDir> a7   (frames in out/a7 at 2x, scaled to 1080 here)
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
const OUT = process.argv[2] || "/Users/daniel.stoic/cromatic-ops/refs/diorama-render/preview-a", A7 = process.argv[3] === "a7", SRC = path.join(HERE, A7 ? "out/a7" : "out/a6d");
const FF = "/Users/daniel.stoic/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg";
const { Comp } = await import(`${STL}/design/lottie-ui/_source/lib/ui.mjs`);
const { loadCards, drawCard } = await import(`${STL}/design/stories/cards/cards.mjs`);
const SP = A7 ? { over: [0, 152], steam: [152, 268], oma: [268, 402], scf: [402, 516], drive: [516, 858], end: [830, 960] } : { over: [0, 152], steam: [152, 268], oma: [268, 402], scf: [402, 516] }, F = A7 ? 960 : 516;
const KC = await loadCards();
const card = (id, t) => { const { __T, ...src } = KC.card(id), c = JSON.parse(JSON.stringify(src)); c.__T = KC.T; if (t) Object.assign(c.timing.cues, t); return c; };
const Cm = new Comp({ w: 1080, h: 1920, dur: F / 60, nm: "story A in diorama · the cards" });
// (as buildA-v6.mjs: the end card first, then the words; a3 out at drive+116, the address in at end-30)
if (A7) drawCard(Cm, card("a4-end", { urlIn: "end-30" }), SP);
for (const id of ["a1-website", "a2-brand"]) drawCard(Cm, card(id), SP);
if (A7) drawCard(Cm, card("a3-drive", { out: "drive+116" }), SP);
const J = Cm.json();
fs.mkdirSync(path.join(SRC, "cards"), { recursive: true });
fs.writeFileSync(path.join(SRC, "cards.json"), JSON.stringify(J));
console.log("cards", J.layers.length, "layers,", (J.assets || []).length, "assets");
// the cards, transparent, 30 fps
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await p.route("http://cards.local/**", (r) => { const u = new URL(r.request().url()).pathname; if (u === "/") return r.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><html><head><style>html,body{margin:0;background:transparent}#l{position:fixed;inset:0}canvas{display:block}</style></head><body><div id="l"></div><script src="/lottie.js"></script><script>fetch("/cards.json").then(r=>r.json()).then(d=>{const a=lottie.loadAnimation({container:document.getElementById("l"),renderer:"canvas",loop:false,autoplay:false,animationData:d,rendererSettings:{clearCanvas:true,preserveAspectRatio:"xMidYMid meet"}});window.anim=a;a.addEventListener("DOMLoaded",()=>{window.ready=1});window.go=(f)=>a.goToAndStop(f,true);});</script></body></html>` }); if (u === "/lottie.js") return r.fulfill({ status: 200, contentType: "text/javascript", body: fs.readFileSync(`${STL}/design/intro-lottie/_lib/lottie_light_canvas.min.js`) }); if (u === "/cards.json") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(J) }); r.fulfill({ status: 404, body: "" }); });
await p.goto("http://cards.local/");
await p.waitForFunction(() => window.ready, null, { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
const n = F / 2;
for (let i = 0; i < n; i++) { await p.evaluate((f) => window.go(f), i * 2); await p.screenshot({ path: path.join(SRC, `cards/c${String(i).padStart(4, "0")}.png`), omitBackground: true }); }
await br.close();
// over the diorama frames
const shots = [["over", 76], ["steam", 58], ["oma", 67], ["scf", 57], ...(A7 ? [["drive", 171], ["black", 51]] : [])], comp = path.join(SRC, "comp");
fs.mkdirSync(comp, { recursive: true });
let k = 0;
for (const [s, cnt] of shots) for (let i = 0; i < cnt; i++, k++) {
  const base = s === "black" ? sharp({ create: { width: 1080, height: 1920, channels: 3, background: "#000000" } }).png() : sharp(path.join(SRC, `${s}-${String(i).padStart(4, "0")}.png`)).resize(1080, 1920, { kernel: "lanczos3" });
  const c = path.join(SRC, `cards/c${String(k).padStart(4, "0")}.png`), under = await base.png().toBuffer();
  await sharp(under).composite(fs.existsSync(c) ? [{ input: c }] : []).png().toFile(path.join(comp, `f${String(k).padStart(4, "0")}.png`));
}
fs.mkdirSync(OUT, { recursive: true });
const mp4 = path.join(OUT, A7 ? "story-a7-en.mp4" : "a6-diorama-draft.mp4");
const r = spawnSync(FF, ["-y", "-v", "error", "-framerate", "30", "-i", path.join(comp, "f%04d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", mp4], { stdio: "inherit" });
if (r.status) process.exit(r.status);
// the contact sheet: every 8th frame, 270 x 480 tiles, the shot's name under each row's first
const pick = Array.from({ length: k }, (_, i) => i).filter((i) => i % 8 === 0 || i === k - 1), W = 270, H = 480, cols = 11, rows = Math.ceil(pick.length / cols);
const tiles = await Promise.all(pick.map((i) => sharp(path.join(comp, `f${String(i).padStart(4, "0")}.png`)).resize(W, H).toBuffer()));
await sharp({ create: { width: cols * W, height: rows * H, channels: 3, background: "#111" } }).composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).jpeg({ quality: 86 }).toFile(path.join(OUT, "contact-sheet.jpg"));
console.log(k, "frames ->", mp4);
