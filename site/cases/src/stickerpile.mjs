// r474 / r474d / r474e (Daniel: "much smoother, maybe driven by scroll, positioned more realistically"): Berero's six
// campaign stickers fall onto a matte table as the visitor scrolls, and lift back off when they scroll up. The table
// holds still (sticky) for a short run (about 1.15 screens on desktop, 0.95 on phones); the scroll position, eased
// toward with a critically damped follow, drives everything: each sticker's fall (a light card: a little ease-in
// through the air, a soft ease-out on contact, its turn settling on the way down, a hint of press), overlapping the
// next one's start, and two pre-rendered shadows on the table (stk-*-sha soft, stk-*-shc contact; refs
// tools/stkshadow.mjs): high, the soft one is big and faint and the contact one gone; landed, both small and dark.
// Transforms and opacity only, one rAF loop while the table is near. A hand-placed, slightly off-centre cluster.
// Without JS or with reduced motion: the finished pile, no sticky run. (A CSS scroll-timeline version was left out:
// it cannot ease the scroll or tie the shadows to each sticker's height in one place.)
const P = [
  // name, desktop [x%, y%, width%, rot], phone [x%, y%, width%, rot], shadow canvas factor
  ["stk-6pack", [33, 35, 36, -9], [34, 17, 56, -9], 1.0652],
  ["stk-lager", [59, 29, 40, 2], [64, 30, 60, 2], 1.0652],
  ["stk-mixed", [67, 55, 35, 6], [43, 48, 64, 6], 1.0652],
  ["stk-hops", [29, 66, 23, -14], [24, 66, 36, -14], 1.0928],
  ["stk-stash", [47, 69, 27, -2], [54, 73, 42, -2], 1.0712],
  ["stk-beachy", [84, 73, 27, 11], [75, 84, 44, 11], 1.0652]
];
const v = (o, [x, y, w, r], [xm, ym, wm, rm]) => `--x:${x}%;--y:${y}%;--w:${+(w * 1.12 * o).toFixed(3)}%;--r:${r}deg;--xm:${xm}%;--ym:${ym}%;--wm:${+(wm * o).toFixed(3)}%;--rm:${rm}deg`;
export const PILE_HTML = `<div class="stk-scrub"><div class="stk-stage" role="img" aria-label="Six Berero campaign stickers stacked in a pile: The 6 Pack, Lager than Life, Mixed Feelings, Hops Around, Ioan's Secret Stash and Life is Beachy">
  <div class="stk-table">
${P.map(([n, d, mb, k], i) => `    <img class="stk-sh stk-sha" src="m:casa-berero/${n}-sha" alt="" loading="lazy" decoding="async" style="${v(k, d, mb)};--i:${i}"><img class="stk-sh stk-shc" src="m:casa-berero/${n}-shc" alt="" loading="lazy" decoding="async" style="${v(k, d, mb)};--i:${i}">
    <div class="stk" style="${v(1, d, mb)};--i:${i};--m:url(m:casa-berero/${n})"><div class="stk-in"><img src="m:casa-berero/${n}" alt="" loading="lazy" decoding="async" draggable="false"><i class="stk-sheen" aria-hidden="true"></i></div></div>`).join("\n")}
  </div>
</div></div>`;
export const PILE_CSS = `/* r474e: the sticker table, scrubbed by the scroll */
.stk-scrub{position:relative;container-type:inline-size;margin:clamp(4px,1.5vw,20px) 0}
.stk-scrub.scrub{height:calc(62.5cqw + 115svh)}
.stk-stage{position:relative;width:100%;aspect-ratio:16/10;perspective:1400px;perspective-origin:50% 0%}
.stk-scrub.scrub .stk-stage{position:sticky;top:max(12px,calc(50svh - 31.25cqw))}
.stk-table{position:absolute;inset:0;border-radius:var(--radius-m);transform:rotateX(9deg);transform-origin:50% 100%;
  background:radial-gradient(120% 90% at 50% 35%,#fbfaf6 0%,#f2efe7 62%,#e9e5da 100%);box-shadow:inset 0 0 0 1px rgba(18,18,18,.06)}
.stk-table::before{content:"";position:absolute;inset:0;border-radius:inherit;opacity:.35;mix-blend-mode:multiply;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .48 0 0 0 0 .44 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
.stk,.stk-sh{position:absolute;left:var(--x);top:var(--y);width:var(--w);transform:translate(-50%,-50%) rotate(var(--r));will-change:transform,opacity}
.stk{z-index:calc(var(--i) * 2 + 2)}
.stk-sh{z-index:calc(var(--i) * 2 + 1);height:auto;pointer-events:none;mix-blend-mode:multiply}
.stk-sha{opacity:.3;transform:translate(-50%,calc(-50% + .6%)) rotate(var(--r))}
.stk-shc{opacity:.36}
.stk-in img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none;filter:drop-shadow(0 1.2px 0 #d6d1c4)}
.stk-in picture{display:block}
.stk-in{position:relative}
.stk-sheen{position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;opacity:.9;
  background:linear-gradient(112deg,transparent 32%,rgba(255,255,255,.5) 46%,rgba(255,255,255,0) 60%),linear-gradient(0deg,rgba(13,12,9,.06),transparent 50%);
  -webkit-mask:var(--m) center/100% 100% no-repeat;mask:var(--m) center/100% 100% no-repeat}
@media (max-width:640px){
  .stk-stage{aspect-ratio:5/7}
  .stk-scrub.scrub{height:calc(140cqw + 95svh)}
  .stk-scrub.scrub .stk-stage{top:max(12px,calc(50svh - 70cqw))}
  .stk,.stk-sh{left:var(--xm);top:var(--ym);width:var(--wm);transform:translate(-50%,-50%) rotate(var(--rm))}
  .stk-sha{transform:translate(-50%,calc(-50% + .6%)) rotate(var(--rm))}
}`;
export const PILE_JS = `// r474e: the stickers fall with the scroll (sticky table, eased follow, overlapping starts, shadows by height)
(function(){
  var wrap=document.querySelector('.stk-scrub');if(!wrap)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var st=wrap.querySelector('.stk-stage'),stk=[].slice.call(wrap.querySelectorAll('.stk')),sa=[].slice.call(wrap.querySelectorAll('.stk-sha')),sc=[].slice.call(wrap.querySelectorAll('.stk-shc'));
  var card=wrap.closest('.card');if(card)card.style.overflow='clip';
  wrap.classList.add('scrub');
  var mq=matchMedia('(max-width:640px)'),N=stk.length,cur=0,tgt=0,raf=0,last=0,live=false,R=[];
  function rots(){R=stk.map(function(e){return parseFloat(getComputedStyle(e).getPropertyValue(mq.matches?'--rm':'--r'))||0})}
  rots();mq.addEventListener&&mq.addEventListener('change',function(){rots();paint(cur)});
  function target(){var r=wrap.getBoundingClientRect(),h=st.offsetHeight,top=parseFloat(getComputedStyle(st).top)||0,run=r.height-h;return run>0?Math.max(0,Math.min(1,(top-r.top)/run)):1}
  function cl(x){return x<0?0:x>1?1:x}
  // a light card: ease-in through the air, soft ease-out on contact
  function fall(t){return t<.6?.62*Math.pow(t/.6,1.7):.62+.38*(1-Math.pow(1-(t-.6)/.4,2.2))}
  function paint(p){
    var H=st.offsetHeight;
    for(var i=0;i<N;i++){
      var t=cl((p*1.06-i*.135)/.33),s=fall(t),h=1-s,r=R[i];
      var press=t>.86?Math.sin((t-.86)/.14*Math.PI)*.012:0;
      var y=-h*H*.62,rot=r+h*(i%2?-16:14),zs=1+h*.16-press;
      stk[i].style.transform='translate(-50%,-50%) translate3d(0,'+y.toFixed(1)+'px,0) rotate('+rot.toFixed(2)+'deg) scale('+zs.toFixed(4)+')';
      stk[i].style.opacity=cl(t/.12).toFixed(3);
      sa[i].style.transform='translate(-50%,calc(-50% + '+(.6+h*7).toFixed(2)+'%)) rotate('+rot.toFixed(2)+'deg) scale('+(1+h*.5).toFixed(4)+')';
      sa[i].style.opacity=(cl(t/.2)*(.10+.20*s)).toFixed(3);
      sc[i].style.transform='translate(-50%,-50%) rotate('+r+'deg)';
      sc[i].style.opacity=(.36*Math.pow(s,6)).toFixed(3);
    }
  }
  function frame(now){
    raf=0;var dt=Math.min(.05,(now-(last||now))/1000);last=now;
    tgt=target();var k=1-Math.exp(-dt/.085);cur+= (tgt-cur)*k;
    if(Math.abs(tgt-cur)<.0005)cur=tgt;
    paint(cur);
    if(live||cur!==tgt)raf=requestAnimationFrame(frame);else last=0;
  }
  function kick(){if(!raf){last=0;raf=requestAnimationFrame(frame)}}
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){live=es[0].isIntersecting;if(live)kick()},{rootMargin:'50% 0px'}).observe(wrap);else live=true;
  addEventListener('scroll',kick,{passive:true});addEventListener('resize',kick);
  cur=tgt=target();paint(cur);
})();`;
