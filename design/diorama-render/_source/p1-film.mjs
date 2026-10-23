// Cromatic · diorama renders · story P1 (TASK-129, "Postcard"): the film, 1080 x 1920, 30 fps, 36 s, no audio.
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
const FF = "/Users/daniel.stoic/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg", FPS = 30, DUR = 36, N = DUR * FPS;

/* ---------- the cut (seconds) ---------- */
// 3D shots: [name, start, end, local frame of the shot at its start]; X: dissolve half-length at each 3D cut (s)
const SHOTS = [["f1", 0, 4.5], ["f2", 4.5, 8.0], ["f3", 8.0, 11.0], ["f4", 11.0, 14.0], ["f5", 14.0, 17.0], ["f6", 17.0, 19.0], ["f7", 19.0, 24.5]];
const X = 0.1;
const T = {
  open: [0.45, 3.95],           // "Find the angles / we missed."
  uiIn: 19.0, tapCam: 19.6, unfold: 19.7, tapLow: 20.05, tapFold: 20.95, fold: 21.05, drag: [21.3, 22.35], tapShot: 22.65, flash: 22.72,
  card: 22.95, sub: 23.45,       // the postcard, "Every corner is a postcard."
  deal: 24.5, dealStep: 0.82, love: 28.9, // montage; "Or the ones / we already love."
  end: 31.0, take: 31.45, pill: 31.95
};
const POSTS = [["f1", 134], ["f2", 66], ["f4", 50], ["f5", 66], ["f6", 36]]; // the montage's postcards (shot, frame)

/* ---------- frames on disk ---------- */
const have = {}; for (const f of fs.existsSync(SRC) ? fs.readdirSync(SRC) : []) { const m = f.match(/^(f\d)-(\d{4})\.png$/); if (m) (have[m[1]] ||= []).push(+m[2]); }
for (const k in have) have[k].sort((a, b) => a - b);
const pick = (shot, want) => { const a = have[shot]; if (!a || !a.length) return null; let best = a[0]; for (const q of a) if (q <= want) best = q; return best; };
const CACHE = path.join(SRC, "_1080"); fs.mkdirSync(CACHE, { recursive: true });
const small = async (shot, n) => { const o = path.join(CACHE, `${shot}-${String(n).padStart(4, "0")}.jpg`), s = path.join(SRC, `${shot}-${String(n).padStart(4, "0")}.png`); if (!fs.existsSync(o) || fs.statSync(o).mtimeMs < fs.statSync(s).mtimeMs) await sharp(s).resize(1080, 1920, { kernel: "lanczos3" }).jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toFile(o); return `/f/${path.basename(o)}`; };
const bgAt = async (t) => {
  // the 3D picture(s) under frame t: [src, opacity] (a dissolve at each 3D cut)
  const out = [];
  for (let i = 0; i < SHOTS.length; i++) {
    const [k, a, b] = SHOTS[i], a0 = i ? a - X : a, b0 = i < SHOTS.length - 1 ? b + X : b;
    if (t < a0 || t >= b0) continue;
    const local = Math.max(0, Math.round((t - a) * FPS)), n = pick(k, local); if (n == null) continue;
    let o = 1; if (i && t < a + X) o = (t - (a - X)) / (2 * X);
    out.push([await small(k, n), o]);
  }
  return out;
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
.finger{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:rgba(255,255,255,.38);border:3px solid rgba(255,255,255,.85);box-shadow:0 4px 18px rgba(0,0,0,.25);opacity:0}
.ring{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;border:4px solid rgba(255,255,255,.9);opacity:0}
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
<img class="L" id="uA" src="/u/ui-A.png"><img class="L um" id="uB" src="/u/ui-B.png"><img class="L um" id="uB1" src="/u/ui-B1.png"><img class="L" id="uC" src="/u/ui-C.png">
<div class="ring" id="ring"></div><div class="finger" id="fing"></div>
<div class="flash" id="flash"></div>
<div class="blurbg" id="blur"></div><div class="mont" id="mont"></div>
<div class="stage">${card("c0", CW, CH)}${POSTS.map((_, i) => card("m" + i, MW, MH)).join("")}</div>
<div class="lead" id="sub">Every corner is a postcard.</div>
<div class="head" id="love"><span>Or the ones</span><span>we already love.</span></div>
<div class="L" id="black" style="background:#000"></div>
<div class="head" id="take" style="font-size:168px;line-height:.94;letter-spacing:-.045em">Take yours.</div>
<div class="pill" id="pill">cromaticstudios.com</div>`;
// the page's clock: everything as a function of t (seconds); the 3D frames set from outside
const JS = `
const $=(i)=>document.getElementById(i), cl=(x)=>Math.max(0,Math.min(1,x)), ss=(x)=>{x=cl(x);return x*x*(3-2*x)}, eo=(x)=>1-Math.pow(1-cl(x),3), ei=(x)=>Math.pow(cl(x),3);
const back=(x)=>{x=cl(x);const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const T=${JSON.stringify(T)}, ST=${JSON.stringify(ST)}, CW=${CW}, CH=${CH}, MW=${MW}, MH=${MH}, NP=${POSTS.length};
const ctr=(r)=>[r[0]+r[2]/2,r[1]+r[3]/2];
function rise(el,t,a,b,dy){ // in over 0.5 s from a (a rise), out over 0.4 s to b
  const i=eo((t-a)/0.5), o=b==null?1:1-ss((t-(b-0.4))/0.4); el.style.opacity=Math.min(i,o); el.style.transform='translateY('+((1-i)*(dy||40))+'px)'; }
function placeCard(el,{x,y,s=1,r=0,ry=0,o=1}){ el.style.opacity=o; el.style.transform='translate('+x+'px,'+y+'px) rotate('+r+'deg) rotateY('+ry+'deg) scale('+s+')'; }
window.R=(t,bgs)=>{
  for(let i=0;i<2;i++){const e=$('b'+i), b=bgs[i]; if(b){ if(e.getAttribute('src')!==b[0]) e.src=b[0]; e.style.opacity=b[1]; } else e.style.opacity=0;}
  rise($('open'),t,T.open[0],T.open[1]); $('scrim').style.opacity=ss((t-(T.open[0]-0.3))/0.6)*(1-ss((t-(T.open[1]-0.3))/0.6));
  // ---- the Postcard interface ----
  const inUI=t>=T.uiIn && t<T.card+0.35, ui=ss((t-T.uiIn)/0.35)*(1-ss((t-T.card)/0.3));
  const u=(id,o,dy)=>{const e=$(id); e.style.opacity=inUI?o*ui:0; e.style.transform='translateY('+(dy||0)+'px)';};
  const unf=ss((t-T.unfold)/0.28), lowOn=t>=T.tapLow+0.08, fold=ss((t-T.fold)/0.28);
  const open=unf*(1-fold); // the panel: up between unfold and fold
  // folded (A, then C once the look is picked), unfolded (B, B1): crossfaded, the panel sliding
  u('uA',(1-open)*(t<T.fold?1:0)); u('uC',(1-open)*(t>=T.fold?1:0));
  u('uB',open*(lowOn?0:1),(1-open)*500); u('uB1',open*(lowOn?1:0),(1-open)*500);
  // the finger: taps (press 0.12 s, a ring going out) and the one-finger orbit
  const taps=[[T.tapCam,ctr(ST.camTab)],[T.tapLow,ctr(ST.low)],[T.tapFold,ctr(ST.camTabB)],[T.tapShot,ctr(ST.shutterC)]];
  let fo=0,fx=0,fy=0,fs=1,ro=0,rs=1,rx=0,ry=0;
  for(const [a,[x,y]] of taps){ if(t>a-0.22&&t<a+0.3){ fx=x;fy=y; fo=ss((t-(a-0.22))/0.12)*(1-ss((t-(a+0.12))/0.16)); fs=1-0.18*Math.max(0,1-Math.abs(t-a)/0.08); }
    if(t>=a&&t<a+0.45){ const k=(t-a)/0.45; ro=(1-k)*0.9; rs=1+k*1.6; rx=x; ry=y; } }
  const [d0,d1]=T.drag; if(t>d0-0.2&&t<d1+0.25){ const k=ss((t-d0)/(d1-d0)); fx=760-340*k; fy=930-40*Math.sin(k*Math.PI); fo=ss((t-(d0-0.2))/0.15)*(1-ss((t-d1)/0.2)); fs=0.92; }
  const F=$('fing'); F.style.opacity=fo*ui; F.style.left=fx+'px'; F.style.top=fy+'px'; F.style.transform='scale('+fs+')';
  const Rg=$('ring'); Rg.style.opacity=ro*ui; Rg.style.left=rx+'px'; Rg.style.top=ry+'px'; Rg.style.transform='scale('+rs+')';
  $('flash').style.opacity= t<T.flash? ss((t-(T.flash-0.05))/0.05) : 1-eo((t-T.flash)/0.38);
  // ---- the postcard ----
  const c=ss((t-T.card)/0.5); $('blur').style.opacity= t<T.deal ? c : 1-ss((t-T.deal)/0.5);
  const mo=ss((t-T.deal)/0.5); $('mont').style.opacity=mo;
  const C0=$('c0');
  if(t<T.card){ C0.style.opacity=0; } else {
    const k=back((t-T.card)/0.6), s0=1.18-0.18*k; let x=(1080-CW)/2, y=500, r=-3*k, s=s0;
    // into the montage: to the back of the fan, smaller
    const m=ss((t-T.deal)/0.7); const fan=fanPos(0), fx0=fan.cx-CW/2, fy0=fan.cy-CH/2; x+=(fx0-x)*m; y+=(fy0-y)*m; r+=(fan.r-r)*m; s=s0+(fan.s-s0)*m;
    placeCard(C0,{x,y:y+(1-eo((t-T.card)/0.5))*60,s,r,o:ss((t-T.card)/0.18)}); }
  rise($('sub'),t,T.sub,T.deal+0.1,24);
  for(let i=0;i<NP;i++){ const a=T.deal+0.35+i*T.dealStep, k=(t-a)/0.62, e=$('m'+i); if(k<0){e.style.opacity=0;continue;}
    const f=fanPos(i+1), kk=eo(k), ry=180*(1-ss(k));
    placeCard(e,{x:f.cx-MW/2+(1-kk)*(i%2?-520:520), y:f.cy-MH/2-(1-kk)*240, s:f.s*(1.1-0.1*kk), r:f.r+(1-kk)*(i%2?-24:24), ry:-ry, o:ss(k/0.12)}); }
  rise($('love'),t,T.love,T.end+0.15);
  $('black').style.opacity=ss((t-T.end)/0.4);
  rise($('take'),t,T.take,null,50);
  const p=$('pill'), pk=back((t-T.pill)/0.5); p.style.opacity=ss((t-T.pill)/0.12); p.style.transform='translate(-50%,-50%) rotate(-6deg) scale('+(0.6+0.4*pk)+')';
};
// the fan: card j (0 = the shot just taken, at the back) of NP+1, settling into a loose stack below the line
function fanPos(j){ const n=NP+1, u=j-(n-1)/2; return { cx:540+u*34, cy:640+MH/2+Math.abs(u)*26, r:u*5.5, s:0.82*(j===0?MW/CW:1) }; }
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
const P0 = await ph("f7", 102), PM = await Promise.all(POSTS.map(([k, n]) => ph(k, n)));
await p.evaluate(([P0, PM]) => { const set = (id, s) => { if (s) document.querySelector(`#${id} .ph`).style.backgroundImage = `url(${s})`; }; set("c0", P0); PM.forEach((s, i) => set("m" + i, s)); if (P0) document.getElementById("blur").style.backgroundImage = `url(${P0})`; }, [P0, PM]);
await p.waitForTimeout(400);
const TMP = path.join(SRC, SHEET ? "_film_sheet" : "_film"); fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const from = Math.round(arg("from", 0) * FPS), to = Math.round(arg("to", DUR) * FPS);
const SHEETT = [0.3, 1.6, 3.6, 6, 9.5, 12.5, 15.5, 18, 19.3, 19.9, 20.4, 21.8, 22.73, 23.8, 25.4, 27.5, 30, 32.5, 35];
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
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols * (w + 12) + 12}" height="${rows * (h + lab + 12) + 70}"><text x="12" y="44" font-family="Helvetica" font-weight="700" font-size="28" fill="#FBFAF5">Story P1 · Postcard · the film (36 s)</text>${frames.map((f, k) => `<text x="${12 + (k % cols) * (w + 12)}" y="${60 + Math.floor(k / cols) * (h + lab + 12) + h + 24}" font-family="Helvetica" font-size="17" fill="#cfcfd6">${(f / FPS).toFixed(2)} s</text>`).join("")}</svg>`);
  await sharp({ create: { width: cols * (w + 12) + 12, height: rows * (h + lab + 12) + 70, channels: 3, background: "#111114" } }).composite([...tiles.map((b, k) => ({ input: b, left: 12 + (k % cols) * (w + 12), top: 60 + Math.floor(k / cols) * (h + lab + 12) })), { input: svg, left: 0, top: 0 }]).jpeg({ quality: 88 }).toFile(path.join(OUT, "contact-sheet-p1.jpg"));
  console.log("sheet ->", path.join(OUT, "contact-sheet-p1.jpg"));
} else {
  const r = spawnSync(FF, ["-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(TMP, "f%05d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", path.join(OUT, "story-p1-en.mp4")], { stdio: "inherit" });
  console.log("mp4 ->", path.join(OUT, "story-p1-en.mp4"), r.status);
}
