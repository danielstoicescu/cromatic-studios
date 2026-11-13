// r474 (Daniel: "where all 6 stickers are laid out on black, let's do an effect where the stickers stack one on top of the
// other in the middle of the section ... as realistic as possible"): Berero's six campaign stickers land one by one on the
// same spot as the stage scrolls up through the screen, building a pile on the page's own white. The die-cuts
// (site/media/casa-berero/stk-*.webp) are made by ~/cromatic-ops/refs/cases-2026-11/tools/diecut.mjs: trimmed artwork, a
// white border grown from its alpha. Shadows: a tight contact shadow and a wider ambient one, on an unrotated wrapper so
// the light stays put while the sticker turns. A paper sheen is masked by the sticker itself (loaded only when it lands).
// Landing: 200 ms, pressed down a touch past flat, then settled. Without JS or with reduced motion: the finished pile.
const P = [
  // name, width % of the stage, x, y offsets (% of the stage), rotation
  ["stk-6pack", 62, -15, -15, -9],
  ["stk-lager", 66, 12, -19, 7],
  ["stk-mixed", 64, -9, 15, -5],
  ["stk-hops", 36, 24, 9, 12],
  ["stk-stash", 40, -25, 5, -11],
  ["stk-beachy", 42, 5, 3, 6]
];
export const PILE_HTML = `<div class="stk-stage" role="img" aria-label="Six Berero campaign stickers stacked in a pile: The 6 Pack, Lager than Life, Mixed Feelings, Hops Around, Ioan's Secret Stash and Life is Beachy">
${P.map(([n, w, x, y, r], i) => `  <div class="stk" style="--w:${w}%;--x:${x};--y:${y};--r:${r}deg;--i:${i};--m:url(m:casa-berero/${n})"><div class="stk-in"><img src="m:casa-berero/${n}" alt="" loading="lazy" decoding="async" draggable="false"><i class="stk-sheen" aria-hidden="true"></i></div></div>`).join("\n")}
</div>`;
export const PILE_CSS = `/* r474: the sticker pile */
.stk-stage{position:relative;width:min(100%,620px);aspect-ratio:1;margin:clamp(8px,3vw,40px) auto;contain:layout paint}
.stk{position:absolute;left:50%;top:50%;width:var(--w);translate:-50% -50%;z-index:var(--i);filter:drop-shadow(0 1px 1px rgba(13,12,9,.30)) drop-shadow(0 7px 12px rgba(13,12,9,.13))}
@supports (width:1cqw){.stk-stage{container-type:inline-size}.stk{translate:calc(-50% + var(--x) * 1cqw) calc(-50% + var(--y) * 1cqw)}}
.stk-in{position:relative;rotate:var(--r);transform-origin:50% 60%}
.stk-in picture{display:block}
.stk-in img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none}
.stk-sheen{position:absolute;inset:0;pointer-events:none;background:linear-gradient(118deg,transparent 30%,rgba(255,255,255,.34) 46%,rgba(255,255,255,0) 58%),linear-gradient(0deg,rgba(13,12,9,.05),transparent 45%);mix-blend-mode:soft-light;opacity:0}
.stk.in .stk-sheen,.stk-stage.rm .stk-sheen{opacity:1;-webkit-mask:var(--m) center/100% 100% no-repeat;mask:var(--m) center/100% 100% no-repeat}
.stk-stage.armed .stk{opacity:0}
.stk-stage.armed .stk.in{opacity:1;animation:stk-land .2s cubic-bezier(.3,.7,.4,1) both}
@keyframes stk-land{0%{opacity:0;transform:translateY(-7%) scale(1.07);filter:drop-shadow(0 1px 1px rgba(13,12,9,.08)) drop-shadow(0 18px 22px rgba(13,12,9,.10))}60%{opacity:1;transform:translateY(.4%) scale(.985)}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.stk-stage.armed .stk{opacity:1}.stk-stage.armed .stk.in{animation:none}}`;
export const PILE_JS = `// r474: the sticker pile lands as the stage rises through the screen (one sticker per sixth of the way)
(function(){
  var st=document.querySelector('.stk-stage');if(!st)return;
  var items=[].slice.call(st.querySelectorAll('.stk')),n=0,raf=0;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){st.classList.add('rm');return}
  st.classList.add('armed');
  function land(){var el=items[n++];if(el)el.classList.add('in')}
  function run(){raf=0;var r=st.getBoundingClientRect(),vh=innerHeight||800;
    var c=r.top+r.height*.5,p=(vh*.98-c)/(vh*.5);
    var t=Math.max(0,Math.min(items.length,Math.ceil(p*items.length)));
    if(r.bottom<0)t=items.length;
    while(n<t)land();
    if(n>=items.length){removeEventListener('scroll',on);removeEventListener('resize',on)}}
  function on(){if(!raf)raf=requestAnimationFrame(run)}
  addEventListener('scroll',on,{passive:true});addEventListener('resize',on);run();
})();`;
