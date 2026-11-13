// r474 / r474d (Daniel: "much more realistic ... each one must be visible on its own, much more 3D"): Berero's six
// campaign stickers are dealt onto a matte table one by one as the stage rises through the screen, a loose overlapping
// scatter where each keeps most of itself in view. The table recedes a little (perspective, rotateX); a sticker drops
// from above (bigger, lifted, a wide soft shadow), presses down a touch and settles (the shadow tightens to contact).
// Three shadows (contact, mid, ambient) and a hairline under the white die-cut border for the paper's thickness; a
// sheen that drifts with the scroll. (A lifted corner was tried and left out: a CSS curl does not follow the die-cut.) Die-cuts: site/media/casa-berero/stk-*.webp (refs tools/diecut.mjs). No JS or reduced motion: the scatter.
const P = [
  // name, desktop [x%, y%, width%, rot], phone [x%, y%, width%, rot]   (x, y: the sticker's centre on the table)
  ["stk-6pack", [23, 31, 38, -8], [30, 15, 52, -8]],
  ["stk-lager", [52, 24, 41, 5], [70, 24, 54, 6]],
  ["stk-mixed", [79, 37, 37, -4], [35, 45, 60, -4]],
  ["stk-hops", [25, 71, 25, 9], [74, 55, 34, 10]],
  ["stk-stash", [52, 70, 30, -9], [30, 78, 40, -9]],
  ["stk-beachy", [78, 73, 32, 6], [70, 82, 44, 5]]
];
export const PILE_HTML = `<div class="stk-stage" role="img" aria-label="Six Berero campaign stickers stacked in a pile: The 6 Pack, Lager than Life, Mixed Feelings, Hops Around, Ioan's Secret Stash and Life is Beachy">
  <div class="stk-table">
${P.map(([n, [x, y, w, r], [xm, ym, wm, rm], curl], i) => `    <div class="stk${curl ? " stk-curl" : ""}" style="--x:${x}%;--y:${y}%;--w:${w}%;--r:${r}deg;--xm:${xm}%;--ym:${ym}%;--wm:${wm}%;--rm:${rm}deg;--i:${i};--m:url(m:casa-berero/${n})"><div class="stk-in"><img src="m:casa-berero/${n}" alt="" loading="lazy" decoding="async" draggable="false"><i class="stk-sheen" aria-hidden="true"></i>${curl ? '<i class="stk-fold" aria-hidden="true"></i>' : ""}</div></div>`).join("\n")}
  </div>
</div>`;
export const PILE_CSS = `/* r474d: the sticker table */
.stk-stage{position:relative;width:100%;aspect-ratio:16/10;margin:clamp(4px,1.5vw,20px) 0;perspective:1400px;perspective-origin:50% 0%}
.stk-table{position:absolute;inset:0;border-radius:var(--radius-m);transform:rotateX(9deg);transform-origin:50% 100%;
  background:radial-gradient(120% 90% at 50% 35%,#fbfaf6 0%,#f2efe7 62%,#e9e5da 100%);box-shadow:inset 0 0 0 1px rgba(18,18,18,.06)}
.stk-table::before{content:"";position:absolute;inset:0;border-radius:inherit;opacity:.35;mix-blend-mode:multiply;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .48 0 0 0 0 .44 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
.stk{position:absolute;left:var(--x);top:var(--y);width:var(--w);translate:-50% -50%;z-index:var(--i);
  filter:drop-shadow(0 1.2px 0 #d6d1c4) drop-shadow(0 1px 1.5px rgba(13,12,9,.34)) drop-shadow(0 5px 7px rgba(13,12,9,.16)) drop-shadow(0 16px 22px rgba(13,12,9,.10))}
.stk-in{position:relative;rotate:var(--r);transform-origin:50% 55%}
.stk-in picture{display:block}
.stk-in img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none}
.stk-sheen{position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:soft-light;
  background:linear-gradient(112deg,transparent 30%,rgba(255,255,255,.55) 45%,rgba(255,255,255,0) 60%) calc(var(--sp,.5) * 100%) 0/300% 100% no-repeat,linear-gradient(0deg,rgba(13,12,9,.06),transparent 50%)}
.stk.in .stk-sheen,.stk-stage.rm .stk-sheen{opacity:1;-webkit-mask:var(--m) center/100% 100% no-repeat;mask:var(--m) center/100% 100% no-repeat}
@media (max-width:640px){
  .stk-stage{aspect-ratio:5/7}
  .stk{left:var(--xm);top:var(--ym);width:var(--wm)}
  .stk-in{rotate:var(--rm)}
}
.stk-stage.armed .stk{opacity:0}
.stk-stage.armed .stk.in{opacity:1;animation:stk-drop .2s cubic-bezier(.3,.7,.4,1) both}
@keyframes stk-drop{
  0%{opacity:0;transform:translateY(-9%) scale(1.15);filter:drop-shadow(0 1.2px 0 #d6d1c4) drop-shadow(0 6px 10px rgba(13,12,9,.06)) drop-shadow(0 26px 30px rgba(13,12,9,.10)) drop-shadow(0 40px 46px rgba(13,12,9,.06))}
  62%{opacity:1;transform:translateY(.5%) scale(.985)}
  100%{transform:none}}
@media (prefers-reduced-motion:reduce){.stk-stage.armed .stk{opacity:1}.stk-stage.armed .stk.in{animation:none}}`;
export const PILE_JS = `// r474d: the stickers land as the table rises through the screen (one per sixth of the way); the sheen drifts with it
(function(){
  var st=document.querySelector('.stk-stage');if(!st)return;
  var items=[].slice.call(st.querySelectorAll('.stk')),n=0,raf=0;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){st.classList.add('rm');return}
  st.classList.add('armed');
  function run(){raf=0;var r=st.getBoundingClientRect(),vh=innerHeight||800;
    if(r.bottom<-vh||r.top>vh*2)return;
    var c=r.top+r.height*.5,p=(vh*.98-c)/(vh*.55);
    var t=Math.max(0,Math.min(items.length,Math.ceil(p*items.length)));
    if(r.bottom<0)t=items.length;
    while(n<t){items[n++].classList.add('in')}
    st.style.setProperty('--sp',Math.max(0,Math.min(1,(vh-r.top)/(vh+r.height))).toFixed(3))}
  function on(){if(!raf)raf=requestAnimationFrame(run)}
  addEventListener('scroll',on,{passive:true});addEventListener('resize',on);run();
})();`;
