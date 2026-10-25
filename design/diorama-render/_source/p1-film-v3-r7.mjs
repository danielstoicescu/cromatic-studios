// Cromatic · story P1 v3 ("Postcard", hip edit). 120 BPM grid: beat = 15 frames, off-beat = 7.5 frames.
// 20.0 s, 600 frames, 1080 x 1920, 30 fps, no audio. Uses the v1 car frames (out/p1f/_1080, car check passed) and the
// real Postcard UI captures (out/p1/ui-*.png). One HTML page, the whole frame rebuilt from f each frame.
//   node film-v3.mjs [--sheet] [--frames a,b,c] [--out dir]
// An event at time t shows from frame floor(t*30) (off-beats: 17 ms before the beat sound, never after).
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const DR = "/Users/daniel.stoic/cromatic-vera-p1/design/diorama-render";
const CACHE = process.env.CACHE || path.join(DR, "out/p1f/_1080") /* (r7: CACHE = the r7 car frames over the v1 ones) */, UI = path.join(DR, "out/p1"), FONTS = "/Users/daniel.stoic/cromatic-vera-p1/site/fonts";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("out", path.join(HERE, "out")); fs.mkdirSync(OUT, { recursive: true });
const FF = "/Users/daniel.stoic/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg", FPS = 30, N = 600;

// grain tiles (deterministic)
const GR = path.join(HERE, "grain"); fs.mkdirSync(GR, { recursive: true });
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let g = 0; g < 6; g++) { const o = path.join(GR, `g${g}.png`); if (fs.existsSync(o)) continue; const w = 540, h = 960, b = Buffer.alloc(w * h); for (let i = 0; i < b.length; i++) b[i] = Math.max(0, Math.min(255, 128 + (rnd() + rnd() + rnd() - 1.5) * 120)); await sharp(b, { raw: { width: w, height: h, channels: 1 } }).png().toFile(o); }

const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(FONTS, f)).toString("base64")}`;
const ST = JSON.parse(fs.readFileSync(path.join(UI, "ui-states.json"), "utf8"));
const CSS = `@font-face{font-family:GS;src:url(${font("google-sans-latin.woff2")});font-weight:100 900}
@font-face{font-family:JB;src:url(${font("gf/jetbrains-mono-latin.woff2")});font-weight:100 900}
*{margin:0;box-sizing:border-box} body{width:1080px;height:1920px;overflow:hidden;background:#0D0C09;font-family:GS,sans-serif;position:relative}
#root,.L,.W{position:absolute;inset:0;overflow:hidden}
img.L{width:1080px;height:1920px;object-fit:cover}
.K{position:absolute;left:60px;width:960px;font-weight:900;text-transform:uppercase;letter-spacing:-.06em;line-height:.8;white-space:nowrap}
.K .w{display:block;transform-origin:480px 70%;width:max-content}
.clip{-webkit-background-clip:text;background-clip:text;color:transparent!important;background-size:1080px 1920px}
.sh{text-shadow:10px 13px 0 #0D0C09;-webkit-text-stroke:12px #0D0C09;paint-order:stroke fill}
.card{position:absolute;background:#FBFAF5;padding:24px 24px 0;border-radius:6px;box-shadow:12px 16px 0 rgba(13,12,9,.92)}
.card .ph{position:relative;width:100%;background-size:cover;border-radius:2px;overflow:hidden}
.card .gr{position:absolute;left:5%;bottom:5%;color:#fff;font-weight:700;letter-spacing:-.02em;text-shadow:0 2px 10px rgba(0,0,0,.45);white-space:nowrap}
.card .no{position:absolute;left:28px;bottom:0;height:var(--fb);display:flex;align-items:center;gap:.5em;font-family:JB;font-weight:700;color:#0D0C09;letter-spacing:.04em}
.card .no i{display:inline-block;width:.7em;height:.7em;border-radius:50%;background:#FED012;border:3px solid #0D0C09}
.stamp{position:absolute;right:5%;top:4%;background:#FBFAF5;padding:8px;-webkit-mask:radial-gradient(circle 7px at 7px 7px,transparent 6px,#000 6.5px) -7px -7px/18px 18px}
.stamp b{display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#FED012;color:#0D0C09;font-weight:900;letter-spacing:-.05em}
.pm{position:absolute;border:4px solid rgba(13,12,9,.75);border-radius:50%}
.finger{position:absolute;width:104px;height:104px;margin:-52px 0 0 -52px;border-radius:50%;background:rgba(24,22,30,.32);border:5px solid #fff;box-shadow:0 0 0 3px rgba(0,0,0,.4)}
.ring{position:absolute;width:104px;height:104px;margin:-52px 0 0 -52px;border-radius:50%;border:5px solid #fff;box-shadow:0 0 0 3px rgba(0,0,0,.35)}
.cell{position:absolute;overflow:hidden;background:#0D0C09}
.cell img{width:100%;height:100%;object-fit:cover;display:block}
.strip{position:absolute;background:#FBFAF5;padding:22px;box-shadow:14px 18px 0 rgba(13,12,9,.9)}
.strip .fr{width:100%;overflow:hidden;background:#0D0C09;margin-bottom:22px}
.strip .fr img{width:100%;height:100%;object-fit:cover;display:block}
.pill{position:absolute;background:#FBFAF5;color:#0D0C09;font-weight:700;font-size:70px;letter-spacing:-.02em;padding:16px 50px 22px;border-radius:999px;border:7px solid #0D0C09;box-shadow:12px 16px 0 #0D0C09;white-space:nowrap}
.lead{position:absolute;left:72px;color:#FBFAF5;font-weight:700;font-size:118px;line-height:1.02;letter-spacing:-.045em}
#grain{position:absolute;left:-60px;top:-60px;width:1200px;height:2040px;mix-blend-mode:overlay;opacity:.17;image-rendering:auto}`;

const BODY = `<div id="root"></div><img id="grain" src="/g/g0.png">`;
const P = { // the six postcards: the shot, the frame the shutter took, where the car sits in a 4:5 crop
  1: ["f7", 102, "50% 78%"], 2: ["f2", 104, "50% 30%"], 3: ["f3", 45, "50% 42%"], 4: ["f4", 30, "50% 36%"], 5: ["f5", 60, "50% 46%"], 6: ["f6", 30, "50% 62%"]
};
const JS = `
const ST=${JSON.stringify(ST)}, P=${JSON.stringify(P)};
const E=(t)=>Math.floor(t*30+1e-6), cl=(x)=>Math.max(0,Math.min(1,x)), eo=(x)=>1-Math.pow(1-cl(x),3), ss=(x)=>{x=cl(x);return x*x*(3-2*x)};
const fr=(s,n)=>'/f/'+s+'-'+String(n).padStart(4,'0')+'.jpg';
const ph=(i)=>fr(P[i][0],P[i][1]);
const Y='#FED012',O='#F65342',LI='#B098C8',BL='#119BFE',PK='#F28BA8',INK='#0D0C09',PA='#FBFAF5';
const slamW=(k)=>[1.1,1.03,0.99,1][Math.min(3,Math.max(0,k))];
const slam=(k)=>[1.22,1.06,0.985,1][Math.min(3,Math.max(0,k))];
const img=(src,o={})=>{const s=o.s||1,ox=o.ox??540,oy=o.oy??960,tx=o.tx||0,ty=o.ty||0;return '<img class="L" src="'+src+'" style="object-position:'+(o.pos||'50% 50%')+';transform-origin:'+ox+'px '+oy+'px;transform:translate('+tx+'px,'+ty+'px) scale('+s+')'+(o.st||'')+'">';};
const block=(c,st)=>'<div class="L" style="background:'+c+';'+(st||'')+'"></div>';
const ui=(n,st)=>'<img class="L" src="/u/ui-'+n+'.png" style="'+(st||'')+'">';
// kinetic words: lines [[text, frameIn, colour]], fitted to W wide
function words(f,lines,o){ let h='<div class="K" style="top:'+o.top+'px;'+(o.css||'')+(o.left!=null?'left:'+o.left+'px;':'')+'">';
  for(const [tx,fi,c,clip] of lines){ if(f<fi) continue; const k=f-fi;
    h+='<div class="w '+(clip?'clip':'sh')+'" data-fit="'+(o.W||960)+'" style="color:'+c+';'+(clip?'background-image:url('+clip+');':'')+'transform:scale('+slamW(k)+');margin-bottom:'+(o.gap??0)+'px">'+tx+'</div>'; }
  return h+'</div>'; }
function card(i,o){ const w=o.w, pw=w-48, phh=Math.round(pw*1.25), fb=Math.round(w*0.11), h=24+phh+fb;
  const s=o.s??1;
  let x='<div class="card" style="--fb:'+fb+'px;left:'+(o.cx-w/2)+'px;top:'+(o.cy-h/2)+'px;width:'+w+'px;height:'+h+'px;transform:rotate('+(o.r||0)+'deg) scale('+s+')">';
  x+='<div class="ph" style="height:'+phh+'px;background-image:url('+(o.src||ph(i))+');background-position:'+(o.pos||P[i][2])+'">';
  x+='<div class="gr" style="font-size:'+Math.round(w*0.052)+'px">Greetings from Cromatic City</div>';
  const sw=Math.round(w*0.15); x+='<div class="stamp" style="width:'+sw+'px;height:'+Math.round(sw*1.22)+'px"><b style="font-size:'+Math.round(sw*0.62)+'px">C</b></div>';
  x+='</div><div class="no" style="font-size:'+Math.round(w*0.045)+'px"><i></i>No. 0'+i+'</div>';
  if(o.scrib) x+=o.scrib(w,phh);
  return x+'</div>'; }
// hand-drawn marks, drawn on over 6 frames
function wob(cx,cy,rx,ry,seed){ let d='',n=26; for(let j=0;j<=n+3;j++){ const a=-1.9+j/n*Math.PI*2, q=1+0.025*Math.sin(j*0.9+seed)+0.015*Math.cos(j*2.3+seed); d+=(j?'L':'M')+(cx+Math.cos(a)*rx*q*(1+j*0.004)).toFixed(1)+' '+(cy+Math.sin(a)*ry*q).toFixed(1); } return d; }
const svgMark=(d,p,c,sw)=>'<svg class="L" style="overflow:visible" width="100%" height="100%"><path d="'+d+'" pathLength="1" fill="none" stroke="'+c+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 1" stroke-dashoffset="'+(1-p)+'"/></svg>';
const drawP=(k)=>eo((k-2)/6);
function flash(k){ const v=[1,.78,.45,.18][k]; return v?'<div class="L" style="background:#fff;opacity:'+v+'"></div>':''; }
function burn(k){ if(k<0||k>5) return ''; const v=[.95,.8,.6,.4,.22,.1][k];
  return '<div class="L" style="mix-blend-mode:screen;opacity:'+v+';background:radial-gradient(ellipse 70% 45% at '+(78-k*3)+'% '+(20+k*4)+'%,rgba(255,236,170,1),rgba(254,208,18,.85) 30%,rgba(246,83,66,.65) 55%,rgba(246,83,66,0) 80%),linear-gradient(90deg,rgba(246,83,66,.0) 60%,rgba(246,83,66,.55))"></div>'; }
function finger(f,tap,x,y,from){ const a=E(tap), k=f-a; if(f<a-(from??5)||k>7) return ''; let h='';
  const pre=cl((f-(a-(from??5)))/(from??5)), fx=x+(1-eo(pre))*120, fy=y+(1-eo(pre))*170, op=k>3?Math.max(0,1-(k-3)/4):1, sc=k>=0&&k<3?0.82:1;
  h+='<div class="finger" style="left:'+fx+'px;top:'+fy+'px;opacity:'+op+';transform:scale('+sc+')"></div>';
  if(k>=0){ const q=k/7; h+='<div class="ring" style="left:'+x+'px;top:'+y+'px;opacity:'+(1-q)*.95+';transform:scale('+(1+q*1.8)+')"></div>'; }
  return h; }
const SC=[ST.shutterC[0]+ST.shutterC[2]/2, ST.shutterC[1]+ST.shutterC[3]/2];
// a live viewfinder (the shot under the Postcard UI); z = punch-in zoom of the whole view (UI included)
function vf(src,z,uiName){ const zz=z||1; return '<div class="W" style="transform-origin:540px 860px;transform:scale('+zz+')">'+img(src)+ui(uiName||'A')+'</div>'; }
const punch=(k,from)=>1+(from-1)*(1-eo(k/5));
// the shutter beats: [shot, first live frame, shutter time, photo #, live start time]
function shutterBeat(f,h,shot,n0,tS,i,t0,z0,ui0){ // live from t0 to tS, frozen photo + flash tS..tS+.25
  const a0=E(t0), aS=E(tS);
  if(f<aS){ const n=Math.min(P[i][1], n0+(f-a0)); h.push(vf(fr(shot,n), z0?punch(f-a0,z0):1, ui0)); h.push(finger(f,tS,SC[0],SC[1],Math.min(5,aS-a0-1))); }
  else { h.push(vf(ph(i),1,ui0)); h.push(finger(f,tS,SC[0],SC[1])); h.push(flash(f-aS)); }
}
function slapCard(f,h,bg,i,tA,o,mark){ const k=f-E(tA); h.push(block(bg)); h.push(card(i,{...o,s:slam(k),scrib:mark?((w,phh)=>mark(w,phh,drawP(k))):null})); }
const circ=(fx,fy,rx,ry,c)=>(w,phh,p)=>svgMark(wob(24+(w-48)*fx,24+phh*fy,(w-48)*rx,phh*ry,2),p,c||'#FED012',Math.round(w*0.016));
const arrow=(w,phh,p)=>{const x0=w*0.06,y0=phh*0.08,x1=w*0.52,y1=phh*0.28; const d='M'+x0+' '+y0+' Q'+(w*0.18)+' '+(phh*0.34)+' '+x1+' '+y1+' M'+(x1-w*0.09)+' '+(y1-phh*0.035)+' L'+x1+' '+y1+' L'+(x1-w*0.04)+' '+(y1+phh*0.075); return svgMark(d,p,'#FED012',Math.round(w*0.018));};
const WALL=[[300,600,-9],[790,560,7],[250,1130,6],[830,1180,-7],[560,1560,-3],[560,880,3]];
function wall(f,h,tim){ tim.forEach((t,j)=>{ if(f<E(t)) return; const [x,y,r]=WALL[j]; h.push(card(j+1,{cx:x,cy:y,w:560,r,s:slam(f-E(t))})); }); }
window.R=(f)=>{
  const t=f/30, h=[];
  // ---------- bar 1: cold open, FIND / THE / ANGLES ----------
  if(f<E(1.5)){ const s=f<E(.5)?1.06:f<E(1)?1.22:1.42, k=f-(f<E(.5)?0:f<E(1)?E(.5):E(1));
    h.push(img(fr('f1',f),{s:s*(1+0.05*Math.max(0,1-k/3)),oy:900}));
    h.push(block('linear-gradient(rgba(13,12,9,.55),rgba(13,12,9,.15) 60%,rgba(13,12,9,0))'));
    h.push(words(f,[['Find',0,PA],['the',E(.5),PA],['angles',E(1),Y]],{top:230,gap:26})); }
  else if(f<E(1.75)){ h.push(block(Y)); h.push(words(f,[['Find',-9,INK],['the',-9,INK],['angles',-9,INK,fr('f5',60)]],{top:230,gap:26})); }
  else if(f<E(2)){ h.push(block(INK)); h.push(words(f,[['Find',-9,Y],['the',-9,Y],['angles',-9,PA]],{top:230,gap:26})); }
  // ---------- bar 2: WE MISSED. + the map's top bar, tap Postcard on beat 4 ----------
  else if(f<E(3)){ h.push(img(fr('f1',f),{s:1.0})); h.push(block('linear-gradient(rgba(13,12,9,0) 30%,rgba(13,12,9,.45) 60%,rgba(13,12,9,.25))'));
    h.push(ui('M','-webkit-mask-image:linear-gradient(#000 0 540px,transparent 540px)'));
    h.push(words(f,[['We',E(2),PA],['missed.',E(2.5),Y]],{top:720,gap:20})); }
  else if(f<E(4)){ const bx=ST.postcardBtn[0]+ST.postcardBtn[2]/2, by=ST.postcardBtn[1]+ST.postcardBtn[3]/2, k=f-E(3);
    let s=1+0.9*eo(k/4); const tx=(560-bx)*eo(k/4), ty=(820-by)*eo(k/4);
    const kz=f-E(3.75); if(kz>=0) s*=1+1.6*eo(kz/7);
    h.push('<div class="W" style="transform-origin:'+bx+'px '+by+'px;transform:translate('+tx+'px,'+ty+'px) scale('+s+')">'+img(fr('f1',f))+ui('M','-webkit-mask-image:linear-gradient(#000 0 540px,transparent 540px)')+
      (f>=E(3.5)?'<div style="position:absolute;left:'+(bx-74)+'px;top:'+(by-74)+'px;width:148px;height:148px;border-radius:50%;border:8px solid '+Y+';box-shadow:0 0 0 4px '+INK+'"></div>':'')+'</div>');
    const X=560, Yp=820; if(kz<0) h.push(finger(f,3.5,X,Yp,7));
    if(kz>=0) h.push('<div class="L" style="background:#fff;opacity:'+[1,1,.85,.7,.55,.4,.25,.12][Math.min(7,kz)]+'"></div>'); }
  // ---------- bars 3-6: the shutter montage ----------
  else if(f<E(4.5)){ const k=f-E(4); h.push(vf(fr('f7',87+k),1+0.12*(1-eo(k/4)))); h.push(finger(f,4.5,SC[0],SC[1],5)); h.push(burn(k)); }
  else if(f<E(4.75)) shutterBeat(f,h,'f7',87,4.5,1,4.0);
  else if(f<E(5)) slapCard(f,h,Y,1,4.75,{cx:540,cy:930,w:840,r:-5},circ(.47,.42,.44,.2,'#FED012'));
  else if(f<E(5.75)) shutterBeat(f,h,'f2',89,5.5,2,5.0,1.9);
  else if(f<E(6)){ h.push(block(LI)); h.push(card(1,{cx:400,cy:760,w:640,r:-9})); const k=f-E(5.75); h.push(card(2,{cx:640,cy:1160,w:760,r:5,s:slam(k)})); }
  else if(f<E(7.25)){ // 2x2 split, a cell per off-beat, then the whip
    const cells=[['f3',30,'50% 45%',Y,6],['f4',60,'50% 38%',O,6.25],['f5',20,'50% 48%',LI,6.5],['f6',50,'50% 62%',BL,6.75]];
    let g='<div class="W" style="background:'+INK+'">'; cells.forEach(([s,n,pos,c,ti],j)=>{ const x=j%2?545:0, y=j>1?965:0, on=f>=E(ti), k=f-E(ti);
      g+='<div class="cell" style="left:'+x+'px;top:'+y+'px;width:535px;height:955px;background:'+c+'">'+(on?'<img src="'+fr(s,n)+'" style="object-position:'+pos+';transform:scale('+slam(k)+')">':'')+'</div>'; });
    g+='</div>';
    const kw=f-E(7); if(kw<0) h.push(g); else { const e=eo((kw+1)/5);
      h.push('<div class="W" style="transform:translateX('+(-1080*e)+'px)">'+g+'</div>');
      h.push('<div class="W" style="transform:translateX('+(1080*(1-e))+'px)">'+vf(fr('f3',31+kw),1,'C')+'</div>'); } }
  else if(f<E(7.75)) shutterBeat(f,h,'f3',31,7.5,3,7.0,0,'C');
  else if(f<E(8)) slapCard(f,h,O,3,7.75,{cx:540,cy:960,w:860,r:4},arrow);
  else if(f<E(9)){ // photo-booth strip
    h.push(block(BL)); const tims=[8,8.25,8.5,8.75], ns=[89,60,40,16];
    let s='<div class="strip" style="left:300px;top:150px;width:480px;transform:rotate(-3deg)">';
    tims.forEach((ti,j)=>{ const on=f>=E(ti); s+='<div class="fr" style="height:350px'+(j===3?';margin-bottom:0':'')+'">'+(on?'<img src="'+fr('f4',ns[j])+'" style="object-position:50% 36%;transform:scale('+slam(f-E(ti))+')">':'')+'</div>'; });
    h.push(s+'</div>'); }
  else if(f<E(9.75)) shutterBeat(f,h,'f4',16,9.5,4,9.0,2.2);
  else if(f<E(10)) slapCard(f,h,PK,4,9.75,{cx:540,cy:940,w:840,r:-4},circ(.52,.43,.3,.14,INK));
  else if(f<E(10.75)){ if(f<E(10.5)){ const k=f-E(10); h.push(vf(fr('f5',46+k),1+0.12*(1-eo(k/4)))); h.push(finger(f,10.5,SC[0],SC[1],5)); } else shutterBeat(f,h,'f5',46,10.5,5,10.0); }
  else if(f<E(11.25)){ // 3x3 grid, shuffled stop-motion on the beat
    const A=[[ph(1),P[1][2]],[ph(2),P[2][2]],[ph(3),P[3][2]],[fr('f1',120),'50% 50%'],[fr('f6',22),'50% 62%'],[ph(4),P[4][2]],[ph(5),P[5][2]],[fr('f2',40),'50% 30%'],[fr('f3',80),'50% 42%']];
    const sh=f>=E(11)?[8,0,1,2,4,3,5,6,7]:[0,1,2,3,4,5,6,7,8]; const k=f-(f>=E(11)?E(11):E(10.75));
    let g='<div class="W" style="background:'+INK+'">'; for(let j=0;j<9;j++){ const [src,pos]=A[sh[j]], x=(j%3)*365, y=Math.floor(j/3)*645;
      g+='<div class="cell" style="left:'+x+'px;top:'+y+'px;width:350px;height:630px"><img src="'+src+'" style="object-position:'+pos+';transform:scale('+(j===4?1:slam(k))+')"></div>'; }
    h.push(g+'</div>'); if(f-E(10.75)<4) h.push(flash(Math.max(0,f-E(10.75)+1))); }
  else if(f<E(11.75)) shutterBeat(f,h,'f6',23,11.5,6,11.25,2.9);
  else if(f<E(12)){ slapCard(f,h,Y,6,11.75,{cx:540,cy:960,w:860,r:-3},circ(.5,.56,.46,.17,'#FED012')); h.push(burn(f-E(11.75))); }
  // ---------- bars 7-8: OR THE ONES / WE ALREADY LOVE. over the collage wall, then the flip ----------
  else if(f<E(14)){ h.push(block(LI)); wall(f,h,[12,12.5,13,13.25,13.5,13.75]);
    h.push(words(f,[['Or',E(12),PA],['the',E(12.5),PA],['ones',E(13),Y]],{top:150,gap:24})); }
  else if(f<E(16)){ h.push(block(O)); wall(f,h,[0,0,0,0,0,0]);
    if(f>=E(14.5)){ const j=Math.min(5,Math.floor((f-E(14.5))/7.5)), tj=E(14.5+j*0.25); h.push(block('rgba(13,12,9,.35)')); h.push(card(j+1,{cx:540,cy:1290,w:760,r:[-4,3,-2,5,-5,2][j],s:slam(f-tj)})); }
    h.push(words(f,[['We',E(14),PA],['already',E(14.5),PA],['love.',E(15),Y]],{top:150,gap:24}));
    h.push(burn(f-E(15))); }
  // ---------- bar 9: the break, one postcard, half-time ----------
  else if(f<E(18)){ const q=(f-E(16))/60; h.push(block(INK)); h.push(card(1,{cx:540,cy:1180,w:780,r:-2+q*1.2,s:slamW(f-E(16))*(1+q*0.05)}));
    let l='<div class="lead" style="top:210px"><span style="display:block;transform-origin:0 50%;transform:scale('+slamW(f-E(16))+')">Every corner</span>'; if(f>=E(17)) l+='<span style="display:block;transform-origin:0 50%;transform:scale('+slamW(f-E(17))+')">is a postcard.</span>'; h.push(l+'</div>'); }
  // ---------- bar 10: Take yours. + the pill ----------
  else { const k=f-E(18); h.push(block(Y));
    h.push(words(f,[['Take',E(18),INK],['yours.',E(18),INK]],{top:470,gap:30,W:900,left:90,css:'text-transform:none;letter-spacing:-.055em;line-height:.86;'}).replace(/class="w sh"/g,'class="w"'));
    const pk=k<12?[0.4,0.75,1.08,1.14,1.1,1.04,0.99,0.97,0.98,1,1,1][k]:1;
    h.push('<div class="pill" id="pill" style="left:540px;top:1330px;transform:translate(-50%,-50%) rotate(-5deg) scale('+pk+')">cromaticstudios.com</div>'); }
  const R=document.getElementById('root'); R.innerHTML=h.join('');
  for(const el of R.querySelectorAll('[data-fit]')){ el.style.fontSize='100px'; const w=el.getBoundingClientRect().width/ (parseFloat((el.style.transform.match(/scale\\(([\\d.]+)/)||[0,1])[1])); el.style.fontSize=(100*(+el.dataset.fit)/w)+'px'; }
  const G=document.getElementById('grain'); G.src='/g/g'+(f%6)+'.png'; G.style.transform='translate('+((f*37)%60-30)+'px,'+((f*53)%60-30)+'px)';
};`;

const br = await pw.chromium.launch();
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await p.route("**/*", (r) => {
  const u = new URL(r.request().url()).pathname;
  if (u === "/") return r.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${BODY}<script>${JS}</script></body></html>` });
  if (u.startsWith("/f/")) return r.fulfill({ status: 200, contentType: "image/jpeg", body: fs.readFileSync(path.join(CACHE, u.slice(3))) });
  if (u.startsWith("/u/")) return r.fulfill({ status: 200, contentType: "image/png", body: fs.readFileSync(path.join(UI, u.slice(3))) });
  if (u.startsWith("/g/")) return r.fulfill({ status: 200, contentType: "image/png", body: fs.readFileSync(path.join(GR, u.slice(3))) });
  return r.fulfill({ status: 404 });
});
p.on("pageerror", (e) => console.error("PAGE", e.message));
await p.goto("http://p1v3.local/");
await p.evaluate(async () => { const d = document.createElement("div"); d.innerHTML = '<span style="font-family:GS;font-weight:900">A</span><span style="font-family:GS;font-weight:700">A</span><span style="font-family:JB;font-weight:700">A</span>'; document.body.appendChild(d); await document.fonts.ready; await new Promise((r) => setTimeout(r, 200)); d.remove(); });
if (process.argv.includes("--list")) { const used = new Set(); for (let f = 0; f < N; f++) { const s2 = await p.evaluate((f) => { window.R(f); return [...document.querySelectorAll("img")].map((im) => im.getAttribute("src")).concat([...document.querySelectorAll("[style*=\"/f/\"]")].map((e) => (e.getAttribute("style").match(/\/f\/[^)'"]+/g) || []).join(" "))); }, f); for (const x of s2.join(" ").split(" ")) if (x.includes("/f/")) used.add(x.slice(x.indexOf("/f/") + 3)); } fs.writeFileSync(path.join(OUT, "used.json"), JSON.stringify([...used].sort())); console.log("used", used.size); await br.close(); process.exit(0); }
const list = arg("frames") ? arg("frames").split(",").map(Number) : Array.from({ length: N }, (_, i) => i);
const TMP = path.join(OUT, arg("frames") ? "pick" : "frames"); fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
let i = 0;
for (const f of list) {
  await p.evaluate(async (f) => { window.R(f); await Promise.all([...document.images].map((im) => im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))); await new Promise(requestAnimationFrame); }, f);
  await p.screenshot({ path: path.join(TMP, arg("frames") ? `p${String(f).padStart(3, "0")}.png` : `f${String(i).padStart(5, "0")}.png`) });
  i++;
}
await br.close();
if (!arg("frames")) {
  const r = spawnSync(FF, ["-y", "-v", "error", "-framerate", "30", "-i", path.join(TMP, "f%05d.png"), "-frames:v", "600", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", "30", "-movflags", "+faststart", "-an", path.join(OUT, process.env.NAME || "story-p1-en-v3.mp4")], { stdio: "inherit" });
  console.log("mp4", r.status);
}
console.log("frames", i);
