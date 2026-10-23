// Cromatic · diorama renders · story P1 v2 (TASK-129, "Postcard"; Daniel: the camera and the photos from the 2nd shot):
// the film, 1080 x 1920, 30 fps, 31 s, no audio: the hook, the map's Postcard button, the first photo, then shot -> photo
// beats through the viewfinder (each photo lands in a stack), the fan, the end. The same frames as v1 (out/p1f).
// The diorama shots (out/p1f/<shot>-NNNN.png, 2x, rendered by render.mjs from shots/p1/f1..f7) under one HTML page
// that sets the type (Google Sans 600, Iris's card system), the real Postcard interface (captured alone from the local
// map by p1-ui2.mjs: folded, unfolded, a look picked, folded again) with the finger's taps, the shutter's flash, the
// postcard, the montage of postcards and the end card. Frame by frame (Playwright), then ffmpeg.
//   node _source/p1-film.mjs [outDir] [--sheet] [--from s --to s]
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), ROOT = path.resolve(HERE, "../..");
const SRC = process.env.SRC || path.join(HERE, "out/p1f"), UI = path.join(HERE, "out/p1");
const OUT = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "/Users/daniel.stoic/cromatic-ops/refs/diorama-render/p1";
const SHEET = process.argv.includes("--sheet"), arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? +process.argv[i + 1] : d; };
const FF = "/Users/daniel.stoic/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg", FPS = 30;

/* ---------- the cut (seconds) ---------- */
// v2 (Daniel: the camera and the photos from the 2nd shot): the hook, the map's Postcard button, the first photo, then
// shot -> photo beats through the viewfinder (each photo lands in a stack), the fan, the end.
const B0 = 6.7, BEAT = 2.6, SHUT = 1.75; // the beats: start, length, the shutter's tap in each
const SEGS = [ // [shot, from, to, local time of the shot at film time t, dissolve half at its start]
  ["f1", 0, 3.125, (t) => t, 0],
  ["f7", 3.125, B0, (t) => (t < 4.05 ? 0 : Math.min(3.4, 1.2 + (t - 4.05) * (2.2 / 1.45))), 0.075],
  ["f2", B0, B0 + BEAT, (t) => 0.9 + (t - B0), 0.1],
  ["f3", B0 + BEAT, B0 + 2 * BEAT, (t) => 0.2 + (t - (B0 + BEAT)), 0.1],
  ["f4", B0 + 2 * BEAT, B0 + 3 * BEAT, (t) => 0.2 + (t - (B0 + 2 * BEAT)), 0.1],
  ["f5", B0 + 3 * BEAT, B0 + 4 * BEAT, (t) => 0.2 + (t - (B0 + 3 * BEAT)), 0.1],
  ["f6", B0 + 4 * BEAT, 20.3, (t) => t - (B0 + 4 * BEAT), 0.1]
];
const T = {
  open: [0.2, 2.25], mapIn: 2.35, tapPost: 2.9, uiA: 3.125, tapCam: 3.55, unfold: 3.65, tapLow: 3.95, tapFold: 4.85, fold: 4.95,
  shot0: 5.75, hold0: [5.9, 6.6], beats: [0, 1, 2, 3, 4].map((i) => B0 + i * BEAT), shut: SHUT,
  uiOut: 19.75, fan: 19.95, love: [20.6, 23.4], every: [23.6, 25.6], end: 25.8, take: 26.3, pill: 26.8
};
const PHOTOS = [["f7", 102], ["f2", 82], ["f3", 61], ["f4", 61], ["f5", 61], ["f6", 55]]; // what the viewfinder held at each shutter
const DUR2 = 31;
/* ---------- frames on disk ---------- */
const have = {}; for (const f of fs.existsSync(SRC) ? fs.readdirSync(SRC) : []) { const m = f.match(/^(f\d)-(\d{4})\.png$/); if (m) (have[m[1]] ||= []).push(+m[2]); }
for (const k in have) have[k].sort((a, b) => a - b);
const pick = (shot, want) => { const a = have[shot]; if (!a || !a.length) return null; let best = a[0]; for (const q of a) if (q <= want) best = q; return best; };
const CACHE = path.join(SRC, "_1080"); fs.mkdirSync(CACHE, { recursive: true });
const small = async (shot, n) => { const o = path.join(CACHE, `${shot}-${String(n).padStart(4, "0")}.jpg`), s = path.join(SRC, `${shot}-${String(n).padStart(4, "0")}.png`); if (!fs.existsSync(o) || fs.statSync(o).mtimeMs < fs.statSync(s).mtimeMs) await sharp(s).resize(1080, 1920, { kernel: "lanczos3" }).jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toFile(o); return `/f/${path.basename(o)}`; };
const bgAt = async (t) => {
  const out = [];
  for (let i = 0; i < SEGS.length; i++) {
    const [k, a, b, loc, X] = SEGS[i], Xn = i < SEGS.length - 1 ? SEGS[i + 1][4] : 0;
    if (t < a - X || t >= b + Xn) continue;
    const n = pick(k, Math.max(0, Math.round(loc(t) * FPS))); if (n == null) continue;
    out.push([await small(k, n), X && t < a + X ? (t - (a - X)) / (2 * X) : 1]);
  }
  return out.slice(-2);
};

/* ---------- the page ---------- */
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, "site/fonts", f)).toString("base64")}`;
const ST = JSON.parse(fs.readFileSync(path.join(UI, "ui-states.json"), "utf8"));
const CSS = `@font-face{font-family:GS;src:url(${font("google-sans-latin.woff2")});font-weight:100 900}
*{margin:0;box-sizing:border-box} body{width:1080px;height:1920px;overflow:hidden;background:#000;font-family:GS,Helvetica,sans-serif;position:relative}
.L{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0}
img.L{width:1080px;height:1920px;object-fit:cover}
.head{position:absolute;left:80px;top:300px;color:#FBFAF5;font-weight:600;font-size:116px;line-height:1;letter-spacing:-.04em;text-shadow:0 6px 30px rgba(0,0,0,.28);opacity:0;white-space:nowrap}
.head span{display:block}
.lead{position:absolute;left:80px;top:300px;color:#FBFAF5;font-weight:600;font-size:60px;line-height:1.1;letter-spacing:-.025em;opacity:0;text-shadow:0 3px 18px rgba(0,0,0,.3)}
.pill{position:absolute;left:540px;top:1000px;background:#FED012;color:#0D0C09;font-weight:600;font-size:64px;letter-spacing:-.02em;padding:14px 46px 18px;border-radius:999px;border:6px solid #0D0C09;box-shadow:10px 14px 0 #0D0C09;opacity:0;white-space:nowrap}
.finger{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:rgba(24,22,30,.32);border:4px solid rgba(255,255,255,.95);box-shadow:0 0 0 3px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.3);opacity:0}
.ring{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;border:4px solid rgba(255,255,255,.9);box-shadow:0 0 0 3px rgba(0,0,0,.35);opacity:0}
.um{-webkit-mask-image:linear-gradient(#000 0 170px,transparent 170px 680px,#000 680px);mask-image:linear-gradient(#000 0 170px,transparent 170px 680px,#000 680px)}
.flash{position:absolute;inset:0;background:#fff;opacity:0}
.stage{position:absolute;inset:0;perspective:2600px}
.card{position:absolute;left:0;top:0;transform-style:preserve-3d;opacity:0}
.face{position:absolute;inset:0;border-radius:22px;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.front{background:#fbf8f1;padding:26px 26px 110px}
.front .ph{position:relative;width:100%;height:100%;border-radius:10px;background-size:cover;background-position:center;overflow:hidden}
.front .gr{position:absolute;right:22px;bottom:52px;color:rgba(255,255,255,.95);font-weight:800;letter-spacing:-.02em;text-shadow:0 2px 8px rgba(0,0,0,.42);white-space:nowrap}
.front .sg{position:absolute;right:22px;bottom:20px;color:rgba(255,255,255,.88);font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.38)}
.front .sg::before{content:"";display:inline-block;width:.44em;height:.44em;border-radius:50%;background:#FED012;margin-right:.35em;vertical-align:.12em}
.front .hand{position:absolute;left:30px;bottom:30px;color:#5a4f45;font-weight:500;font-size:34px;letter-spacing:-.01em}
.back{background:#fbf8f1;transform:rotateY(180deg)}
.back .st{position:absolute;right:44px;top:44px;width:130px;height:160px;border:4px dashed #d8cdbd;border-radius:8px}
.back .ln{position:absolute;right:44px;height:3px;background:#e2d8c9;width:44%}
.back .dv{position:absolute;left:50%;top:60px;bottom:60px;width:3px;background:#e2d8c9}
.back .wm{position:absolute;left:44px;bottom:44px;color:#b9ab97;font-weight:600;font-size:40px;letter-spacing:-.02em}
.mont{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#3a2b4f,#0c0a14);opacity:0}
.blurbg{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(26px) brightness(.55);opacity:0}`;
const card = (id, w, h) => `<div class="card" id="${id}" style="width:${w}px;height:${h}px"><div class="face front"><div class="ph"><div class="gr" style="font-size:${Math.round(w * 0.05)}px">Greetings from Cromatic City</div><div class="sg" style="font-size:${Math.round(w * 0.03)}px">cromaticstudios.com</div></div><div class="hand">Cromatic City · 2026</div></div><div class="face back"><div class="st"></div><div class="dv"></div>${[0, 1, 2, 3].map((i) => `<div class="ln" style="top:${330 + i * 90}px"></div>`).join("")}<div class="wm">Cromatic City</div></div></div>`;
const CW = 840, CH = 1240, MW = 760, MH = 1122;
const BODY = `<img class="L" id="b0"><img class="L" id="b1">
<div class="L" id="scrim" style="background:linear-gradient(rgba(38,22,52,.55),rgba(38,22,52,.28) 32%,rgba(38,22,52,0) 52%)"></div>
<div class="head" id="open"><span>Find the angles</span><span>we missed.</span></div>
<img class="L" id="uM" src="/u/ui-M.png" style="-webkit-mask-image:linear-gradient(#000 0 540px,transparent 540px);mask-image:linear-gradient(#000 0 540px,transparent 540px)">
<img class="L" id="uA" src="/u/ui-A.png"><img class="L um" id="uB" src="/u/ui-B.png"><img class="L um" id="uB1" src="/u/ui-B1.png"><img class="L" id="uC" src="/u/ui-C.png">
<div class="L" id="dim" style="background:#000"></div>
<div class="flash" id="flash"></div>
<div class="mont" id="mont"></div>
<div class="stage">${PHOTOS.map((_, i) => card("m" + i, MW, MH)).join("")}</div>
<div class="ring" id="ring"></div><div class="finger" id="fing"></div>
<div class="head" id="love"><span>Or the ones</span><span>we already love.</span></div>
<div class="lead" id="every">Every corner is a postcard.</div>
<div class="L" id="black" style="background:#000"></div>
<div class="head" id="take" style="font-size:168px;line-height:.94;letter-spacing:-.045em">Take yours.</div>
<div class="pill" id="pill">cromaticstudios.com</div>`;
// the page's clock: everything as a function of t (seconds); the 3D frames set from outside
const JS = `
const $=(i)=>document.getElementById(i), cl=(x)=>Math.max(0,Math.min(1,x)), ss=(x)=>{x=cl(x);return x*x*(3-2*x)}, eo=(x)=>1-Math.pow(1-cl(x),3);
const back=(x)=>{x=cl(x);const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const T=${JSON.stringify(T)}, ST=${JSON.stringify(ST)}, MW=${MW}, MH=${MH}, NP=${PHOTOS.length};
const ctr=(r)=>[r[0]+r[2]/2,r[1]+r[3]/2];
function rise(el,t,a,b,dy){ const i=eo((t-a)/0.5), o=b==null?1:1-ss((t-(b-0.4))/0.4); el.style.opacity=Math.min(i,o); el.style.transform='translateY('+((1-i)*(dy||40))+'px)'; }
function place(el,{cx,cy,s=1,r=0,o=1}){ el.style.opacity=o; el.style.transform='translate('+(cx-MW/2)+'px,'+(cy-MH/2)+'px) rotate('+r+'deg) scale('+s+')'; }
// the shutters: the first photo, then one per beat
const SH=[T.shot0, ...T.beats.map((b)=>b+T.shut)];
// the stack (bottom left, left of the shutter): card i's resting place
const STK=(i)=>({cx:232+[0,-6,5,-3,6,-2][i], cy:1598-i*5, s:0.2, r:[-8,5,-3,7,-5,2][i]});
function fanPos(j){ const n=NP, u=j-(n-1)/2; return { cx:540+u*34, cy:640+MH/2+Math.abs(u)*26, r:u*5.5, s:0.82 }; }
const mix=(a,b,g)=>({cx:a.cx+(b.cx-a.cx)*g, cy:a.cy+(b.cy-a.cy)*g, s:a.s+(b.s-a.s)*g, r:a.r+(b.r-a.r)*g});
window.R=(t,bgs)=>{
  for(let i=0;i<2;i++){const e=$('b'+i), b=bgs[i]; if(b){ if(e.getAttribute('src')!==b[0]) e.src=b[0]; e.style.opacity=b[1]; } else e.style.opacity=0;}
  rise($('open'),t,T.open[0],T.open[1]); $('scrim').style.opacity=ss((t-(T.open[0]-0.2))/0.4)*(1-ss((t-(T.open[1]-0.3))/0.5));
  // ---- the map's own bar, then the Postcard interface ----
  $('uM').style.opacity=ss((t-T.mapIn)/0.25)*(1-ss((t-(T.uiA-0.075))/0.15));
  const ui=ss((t-(T.uiA-0.075))/0.15)*(1-ss((t-T.uiOut)/0.3));
  const unf=ss((t-T.unfold)/0.28), lowOn=t>=T.tapLow+0.08, fold=ss((t-T.fold)/0.28), open=unf*(1-fold);
  const u=(id,o,dy)=>{const e=$(id); e.style.opacity=o*ui; e.style.transform='translateY('+(dy||0)+'px)';};
  u('uA',(1-open)*(t<T.fold?1:0)); u('uC',(1-open)*(t>=T.fold?1:0));
  u('uB',open*(lowOn?0:1),(1-open)*500); u('uB1',open*(lowOn?1:0),(1-open)*500);
  // the finger's taps
  const taps=[[T.tapPost,ctr(ST.postcardBtn)],[T.tapCam,ctr(ST.camTab)],[T.tapLow,ctr(ST.low)],[T.tapFold,ctr(ST.camTabB)],...SH.map((s)=>[s,ctr(ST.shutterC)])];
  let fo=0,fx=0,fy=0,fs=1,ro=0,rs=1,rx=0,ry=0;
  for(const [a,[x,y]] of taps){ if(t>a-0.22&&t<a+0.3){ fx=x;fy=y; fo=ss((t-(a-0.22))/0.12)*(1-ss((t-(a+0.12))/0.16)); fs=1-0.18*Math.max(0,1-Math.abs(t-a)/0.08); }
    if(t>=a&&t<a+0.45){ const k=(t-a)/0.45; ro=(1-k)*0.9; rs=1+k*1.6; rx=x; ry=y; } }
  const F=$('fing'); F.style.opacity=fo; F.style.left=fx+'px'; F.style.top=fy+'px'; F.style.transform='scale('+fs+')';
  const Rg=$('ring'); Rg.style.opacity=ro; Rg.style.left=rx+'px'; Rg.style.top=ry+'px'; Rg.style.transform='scale('+rs+')';
  // the flashes (each shutter + 0.07)
  let fl=0; for(const s of SH){ const p=s+0.07; fl=Math.max(fl, t<p? ss((t-(p-0.05))/0.05) : 1-eo((t-p)/0.34)); } $('flash').style.opacity=fl;
  // the first photo held up big over the dimmed viewfinder
  $('dim').style.opacity=0.42*ss((t-T.hold0[0])/0.3)*(1-ss((t-T.hold0[1])/0.4));
  // ---- the postcards: each born at its flash, landing in the stack; the fan at the end ----
  const fm=ss((t-T.fan)/0.8), VF={cx:540,cy:930,s:1.32,r:0};
  for(let i=0;i<NP;i++){ const e=$('m'+i), p=SH[i]+0.07; if(t<p){e.style.opacity=0;continue;}
    const S=STK(i); let c;
    if(i===0){ const big=mix(VF,{cx:540,cy:930,s:1.0,r:-3},back((t-T.hold0[0])/0.5)), g=ss((t-T.hold0[1])/0.6); c=mix(big,S,g); c.cy-=Math.sin(g*Math.PI)*120; }
    else { const g=ss((t-(p+0.08))/0.62); c=mix(VF,S,g); c.cy-=Math.sin(g*Math.PI)*140; }
    c=mix(c,fanPos(i),fm);
    place(e,{...c,o:ss((t-p)/0.1)}); }
  $('mont').style.opacity=ss((t-T.uiOut)/0.4);
  rise($('love'),t,T.love[0],T.love[1]); rise($('every'),t,T.every[0],T.every[1],24);
  $('black').style.opacity=ss((t-T.end)/0.4);
  rise($('take'),t,T.take,null,50);
  const pl=$('pill'), pk=back((t-T.pill)/0.5); pl.style.opacity=ss((t-T.pill)/0.12); pl.style.transform='translate(-50%,-50%) rotate(-6deg) scale('+(0.6+0.4*pk)+')';
};
`;

/* ---------- run ---------- */
const br = await pw.chromium.launch();
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await p.route("**/*", (r) => {
  const u = new URL(r.request().url()).pathname;
  if (u === "/") return r.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${BODY}<script>${JS}</script></body></html>` });
  if (u.startsWith("/f/")) return r.fulfill({ status: 200, contentType: "image/jpeg", body: fs.readFileSync(path.join(CACHE, u.slice(3))) });
  if (u.startsWith("/u/")) return r.fulfill({ status: 200, contentType: "image/png", body: fs.readFileSync(path.join(UI, u.slice(3))) });
  if (u.startsWith("/p/")) return r.fulfill({ status: 200, contentType: "image/jpeg", body: fs.readFileSync(path.join(CACHE, u.slice(3))) });
  return r.fulfill({ status: 404 });
});
await p.goto("http://p1.local/");
await p.evaluate(() => document.fonts.ready);
// the postcards' photos: the taken shot (f7 at the shutter) and the montage's
const ph = async (shot, n) => { const m = pick(shot, n); return m == null ? null : (await small(shot, m)).replace("/f/", "/p/"); };
const PM = await Promise.all(PHOTOS.map(([k, n]) => ph(k, n)));
await p.evaluate((PM) => { PM.forEach((s, i) => { if (s) document.querySelector(`#m${i} .ph`).style.backgroundImage = `url(${s})`; }); }, PM);
await p.waitForTimeout(400);
const TMP = path.join(SRC, SHEET ? "_film2_sheet" : "_film2"); fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const DUR = DUR2, from = Math.round(arg("from", 0) * FPS), to = Math.round(arg("to", DUR) * FPS);
const SHEETT = [1.0, 2.6, 2.95, 3.5, 3.8, 4.4, 5.3, 5.82, 6.2, 7.0, 8.0, 8.6, 9.0, 10.5, 11.3, 13.2, 15.8, 18.0, 19.2, 20.5, 22.0, 24.6, 27.5, 30.5];
const frames = SHEET ? SHEETT.map((s) => Math.round(s * FPS)) : Array.from({ length: to - from }, (_, i) => from + i);
let i = 0;
for (const f of frames) {
  const t = f / FPS, bgs = await bgAt(t);
  await p.evaluate(async ([t, bgs]) => { window.R(t, bgs); await Promise.all([...document.images].filter((im) => !im.complete).map((im) => new Promise((r) => { im.onload = im.onerror = r; }))); await new Promise(requestAnimationFrame); }, [t, bgs]);
  await p.screenshot({ path: path.join(TMP, `f${String(i++).padStart(5, "0")}.png`) });
}
await br.close();
fs.mkdirSync(OUT, { recursive: true });
if (SHEET) {
  const w = 216, h = 384, cols = 10, rows = Math.ceil(frames.length / cols), lab = 30;
  const files = fs.readdirSync(TMP).filter((x) => x.endsWith(".png")).sort(), tiles = await Promise.all(files.map((x) => sharp(path.join(TMP, x)).resize(w, h).toBuffer()));
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols * (w + 12) + 12}" height="${rows * (h + lab + 12) + 70}"><text x="12" y="44" font-family="Helvetica" font-weight="700" font-size="28" fill="#FBFAF5">Story P1 v2 · Postcard · the film (31 s)</text>${frames.map((f, k) => `<text x="${12 + (k % cols) * (w + 12)}" y="${60 + Math.floor(k / cols) * (h + lab + 12) + h + 24}" font-family="Helvetica" font-size="17" fill="#cfcfd6">${(f / FPS).toFixed(2)} s</text>`).join("")}</svg>`);
  await sharp({ create: { width: cols * (w + 12) + 12, height: rows * (h + lab + 12) + 70, channels: 3, background: "#111114" } }).composite([...tiles.map((b, k) => ({ input: b, left: 12 + (k % cols) * (w + 12), top: 60 + Math.floor(k / cols) * (h + lab + 12) })), { input: svg, left: 0, top: 0 }]).jpeg({ quality: 88 }).toFile(path.join(OUT, "contact-sheet-p1-v2.jpg"));
  console.log("sheet ->", path.join(OUT, "contact-sheet-p1-v2.jpg"));
} else {
  const r = spawnSync(FF, ["-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(TMP, "f%05d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", path.join(OUT, "story-p1-en-v2.mp4")], { stdio: "inherit" });
  console.log("mp4 ->", path.join(OUT, "story-p1-en-v2.mp4"), r.status);
}
