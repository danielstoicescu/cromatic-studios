// r474 (Daniel: "make them stand out somehow, maybe even use them. Extract them, make them transparent, use them on the
// page here and there, use them as patches"): the small characters of the Yoshi menu, cut out of the menu pages
// (~/cromatic-ops/refs/cases-2026-11/tools/yoshi-chars.py, near-white flood-filled from the crop's border; a straight
// edge is a deliberate cut: a head peeking over a box, the koi against the page's corner). Decorative: empty alt.
// Peeking: the koi in the problem card's top-right corner (clipped by the card's rounded corner), the horned one over
// the solution box, the rabbit over the result line. Patches: embroidered (twill, a merrowed edge, a stitch line, a
// sewn-on shadow) in the chapters' side columns. Phones: the koi smaller, the horned one, one patch.
// And (Daniel): the page opens on the two illustrated reels instead of the photo; each has its poster as a real
// image under the video (fetchpriority high), so the first paint is the poster.
const m = (n) => `m:yoshi-izakaya/${n}`;
const WH = { "chr-gyoza": [900, 739], "chr-koi": [560, 663], "chr-horned": [278, 198], "chr-cupbunny": [156, 215], "chr-blob": [174, 205], "chr-miso": [420, 314], "chr-traveller": [117, 340] };
const img = (n, cls = "") => `<img${cls ? ` class="${cls}"` : ""} src="${m(n)}" alt=""${WH[n] ? ` width="${WH[n][0]}" height="${WH[n][1]}"` : ""} loading="lazy" decoding="async" draggable="false">`;
const patch = (n, { s = 132, rot = -6, cls = "" } = {}) => `<span class="ypatch${cls ? " " + cls : ""}" style="--s:${s}px;--rot:${rot}deg" aria-hidden="true"><span class="yp-art">${img(n)}</span></span>`;
const reel = (n, alt) => `<figure style="--r:0.5625" data-fixed-ratio><div class="frame"><img src="${m(n + "-poster")}" alt="" width="480" height="854" fetchpriority="high" decoding="async"><video src="${m(n)}" autoplay muted loop playsinline preload="auto" aria-label="${alt}"></video></div></figure>`;
export const YOSHI_HERO = `<div class="hero-row hero-reels">${reel("reel-cherry", "A layered red and yellow cocktail, a hand-drawn cherry character above it and Japanese type down the side")}${reel("reel-egg", "Chopsticks lift a fried egg off a rice bowl, a hand-drawn character beside it and itadakimasu in Japanese above")}</div>`;
export const YOSHI_DECOR = {
  hero: `<span class="ypeek ypeek-gyoza" aria-hidden="true">${img("chr-gyoza")}</span>`, // r474d (Daniel): out of the hero's bottom-left corner, big
  "problem-top": `<span class="ypeek ypeek-koi" aria-hidden="true">${img("chr-koi")}</span>`,
  solution: `<span class="ypeek ypeek-horned" aria-hidden="true">${img("chr-horned")}</span>`,
  "side-0": `<span class="ypatches">${patch("chr-blob", { s: 128, rot: -7 })}${patch("chr-miso", { s: 112, rot: 6, cls: "yp-sm-hide" })}</span>`,
  "side-1": `<span class="ypatches">${patch("chr-traveller", { s: 120, rot: 5, cls: "yp-sm-hide yp-tall" })}</span>`,
  result: `<span class="ypeek ypeek-bunny" aria-hidden="true">${img("chr-cupbunny")}</span>`
};
export const YOSHI_CSS = `/* r474d (Daniel): the hero, editorial: the title and the gyoza on the left, the two reels on the right */
.hero{position:relative}
.hero .inner{position:relative;z-index:1}
.ypeek-gyoza{left:-2.5%;bottom:-9%;width:clamp(240px,30vw,450px);z-index:0}
.ypeek-gyoza img{aspect-ratio:900/739}
@media (min-width:900px){
  .hero .inner{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:clamp(28px,4vw,72px);align-items:start}
  .hero .hero-top{grid-template-columns:minmax(0,1fr);gap:clamp(18px,2vw,28px);padding-bottom:clamp(190px,15.5vw,232px)}
  .hero .hero-media{margin-top:0}
  .hero .hero-reels{width:calc(2 * min(60svh,560px) * .5625 + var(--gutter));max-width:none;margin:0}
  .hero .hero-reels .frame{max-height:min(60svh,560px)}
}
@media (max-width:899px){.hero .inner{padding-bottom:clamp(84px,18vw,150px)}.ypeek-gyoza{width:clamp(130px,30vw,230px);left:-14px;bottom:-22px}}
/* r474: the reels open the page */
.hero-reels{max-width:calc(2 * var(--max-h) * .5625 + var(--gutter));margin-inline:auto}
.hero-reels .frame>video{position:absolute;inset:0}
@media (max-width:640px){.hero-reels{flex-wrap:nowrap}.hero-reels>figure{flex-basis:0}}
/* r474: the menu's characters, peeking */
.problem,.solution-intro,.result .inner{position:relative}
.ypeek{position:absolute;pointer-events:none;line-height:0}
.ypeek img{display:block;width:100%;height:auto}
.ypeek-koi img{aspect-ratio:560/663}.ypeek-horned img{aspect-ratio:278/198}.ypeek-bunny img{aspect-ratio:156/215}
.ypeek-koi{top:0;right:0;width:clamp(96px,20vw,290px);filter:drop-shadow(0 6px 10px rgba(13,12,9,.12))}
.ypeek-horned{bottom:calc(100% - 2px);right:clamp(18px,4vw,56px);width:clamp(66px,7vw,104px)}
.ypeek-bunny{bottom:calc(100% - var(--pad) - 2px);right:var(--pad);width:clamp(54px,5vw,78px)}
.problem .sec-head{padding-right:clamp(80px,18vw,270px)}
/* r474: embroidered patches */
.ypatches{display:flex;flex-wrap:wrap;gap:22px 18px;align-items:center;padding:14px 6px 6px}
.ypatch{position:relative;display:grid;place-items:center;width:var(--s);aspect-ratio:1;border-radius:50%;rotate:var(--rot);transition:rotate .2s cubic-bezier(.3,.7,.4,1);
  background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.16),transparent 58%),repeating-linear-gradient(45deg,rgba(0,0,0,.10) 0 1px,transparent 1px 3px),repeating-linear-gradient(-45deg,rgba(255,255,255,.05) 0 1px,transparent 1px 3px),#22304b;
  box-shadow:0 0 0 1px rgba(13,12,9,.35),0 1px 1px rgba(13,12,9,.35),0 7px 12px -3px rgba(13,12,9,.30)}
.ypatch::before{content:"";position:absolute;inset:-6px;border-radius:50%;background:repeating-conic-gradient(#E9C27D 0 1.6deg,#b98d45 1.6deg 2.4deg,#f3d9a6 2.4deg 3deg);-webkit-mask:radial-gradient(closest-side,transparent calc(100% - 7px),#000 calc(100% - 6.5px));mask:radial-gradient(closest-side,transparent calc(100% - 7px),#000 calc(100% - 6.5px));pointer-events:none}
.ypatch::after{content:"";position:absolute;inset:7px;border-radius:50%;border:1.5px dashed rgba(233,194,125,.75);pointer-events:none}
.yp-art{position:relative;display:grid;place-items:center;width:78%;height:78%;border-radius:50%;overflow:hidden}
.yp-art img{max-width:100%;max-height:100%;width:auto;height:auto;filter:saturate(.92) contrast(1.04)}
.yp-tall .yp-art img{max-height:118%;margin-top:22%}
.yp-art::after{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-linear-gradient(45deg,rgba(0,0,0,.09) 0 1px,transparent 1px 2.5px);mix-blend-mode:multiply;pointer-events:none}
@media (hover:hover){.ypatch:hover{rotate:calc(var(--rot) * -.4)}}
@media (max-width:640px){.yp-sm-hide{display:none}.ypatches{padding-top:6px}.ypeek-bunny{display:none}.problem .sec-head{padding-right:96px}}
@media (prefers-reduced-motion:reduce){.ypatch{transition:none}}`;
