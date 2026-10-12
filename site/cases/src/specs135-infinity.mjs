// r135: Infinity Capital, rebuilt. Replaces the "infinity-capital" entry in specs128.mjs.
// Source: the Google Slides deck "[SIF Oltenia] The Core. Cromatic Studios.", Direction 2 (slides 30-46: logo and
// symbol, colours and fonts, visual universe, stationery & co, web), plus the strategy slides of the same deck
// (UVP, archetype, the love & hate brief). Nothing beyond them.
// The illustrations are the deck's own artwork, split so they can move on their own: the ring is a white mask
// (site/media/infinity-capital/ring.webp), the wordmark one mask per letter (wm-*.webp), and Brâncuși's four
// flights are vector paths traced from the slide (FLIGHTS below).
const m = (p) => "m:infinity-capital/" + p;

// traced from slide 35 (image120.png): Brâncuși's flights and the I of Infinity, in a 822 × 775 box
const FLIGHTS = {
  w: 822, h: 775,
  paths: [
    "M213.0 29.0 L6.0 540.0 L6.0 543.0 L88.0 544.0 L130.0 748.0 L132.0 748.0 L181.0 485.0 L181.0 477.0 L166.0 411.0 L196.0 364.0 L180.0 327.0 L204.0 281.0 L188.0 242.0 L213.0 198.0 L200.0 163.0 L200.0 157.0 L214.0 29.0 Z",
    "M387.5 12.0 L341.0 99.0 L387.5 164.0 L341.0 250.0 L387.5 315.0 L341.0 400.0 L387.5 465.0 L341.0 551.0 L387.5 615.0 L341.0 701.0 L387.5 769.0",
    "M522.0 6.0 L506.0 146.0 L497.0 268.0 L498.0 353.0 L502.0 433.0 L511.0 556.0 L517.0 606.0 L510.0 738.0 L503.0 766.0 L543.0 766.0 L536.0 729.0 L534.0 665.0 L530.0 633.0 L530.0 603.0 L535.0 564.0 L546.0 411.0 L549.0 344.0 L549.0 250.0 L540.0 138.0 L525.0 6.0 Z",
    "M655.0 23.0 L663.0 36.0 L673.0 67.0 L679.0 105.0 L682.0 154.0 L681.0 655.0 L673.0 718.0 L666.0 742.0 L655.0 763.0 L816.0 763.0 L807.0 747.0 L798.0 718.0 L792.0 680.0 L789.0 630.0 L790.0 130.0 L793.0 97.0 L799.0 63.0 L808.0 36.0 L816.0 23.0 Z"
  ]
};
// the wordmark, one letter per mask: [file, left %, top %, width %, height %] of a 3.2447 : 1 box
const WM = [
  ["wm-0",0.13,0.42,4.55,59.92],
  ["wm-1",7.15,0.42,16.25,59.92],
  ["wm-2",25.62,0.42,10.66,59.92],
  ["wm-3",38.62,0.42,4.55,59.92],
  ["wm-4",45.51,0.42,16.38,59.92],
  ["wm-5",64.37,0.42,4.55,59.92],
  ["wm-6",70.48,0.42,15.08,59.92],
  ["wm-7",85.05,0.42,14.82,59.92],
  ["wm-sub",18.6,81.86,62.55,17.3]
];

const C = { slate: "#505C6F", mist: "#E7EAE9", ink: "#202631", gold: "#DCA54A" };

const wordmark = (cls = "") => `<div class="ic-wm${cls ? " " + cls : ""}" role="img" aria-label="INFINITY Capital Investment">${WM.map(([f, l, t, w, h], i) => `<i class="ic-l${f === "wm-sub" ? " ic-l--sub" : ""}" style="--m:url(${m(f)});left:${l}%;top:${t}%;width:${w}%;height:${h}%;--i:${i}"></i>`).join("")}</div>`;
const ring = (cls = "", label = "") => `<div class="ic-ring${cls ? " " + cls : ""}"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}><i class="ic-ring-art"></i></div>`;
const flights = (cls = "") => `<svg class="ic-fl${cls ? " " + cls : ""}" viewBox="0 0 ${FLIGHTS.w} ${FLIGHTS.h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${FLIGHTS.paths.map((d, i) => `<g class="ic-f" style="--i:${i}"><path pathLength="1" d="${d}"/></g>`).join("")}</svg>`;
// an outline frame (slide 35) drawn edge by edge
const frame = (cls = "") => `<i class="ic-of${cls ? " " + cls : ""}" aria-hidden="true"><b></b><b></b><b></b><b></b></i>`;
const img = (name, w, h, alt, extra = "") => `<img src="${m(name)}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async"${extra}>`;

// ---------------------------------------------------------------- blocks
const HERO = `<div class="ic-stage" data-ic data-par>
          ${frame("ic-of--stage")}
          ${flights("ic-fl--hero")}
          ${ring("ic-ring--hero", "Brâncuși's Endless Column, closed into a ring")}
          ${wordmark("ic-wm--hero")}
        </div>`;

const ARCHETYPE = `<div class="ic-arch" data-ic>
  <p class="ic-kicker">The archetype</p>
  <div class="ic-arch-bar" aria-hidden="true"><span style="--w:50%;--c:${C.ink};--i:0"></span><span style="--w:25%;--c:${C.slate};--i:1"></span><span style="--w:25%;--c:${C.gold};--i:2"></span></div>
  <ul class="ic-arch-list">
    <li style="--c:${C.ink};--i:0"><b>Hero</b> <em>50%</em> <span>Determination and achievement.</span></li>
    <li style="--c:${C.slate};--i:1"><b>Ruler</b> <em>25%</em> <span>Power, control, prosperity.</span></li>
    <li style="--c:${C.gold};--i:2"><b>Creator</b> <em>25%</em> <span>Think different, give form to a vision.</span></li>
  </ul>
</div>`;

const RING_STORY = `<div class="ic-story" data-ic data-par>
  <div class="ic-story-ring">${ring("ic-ring--story", "The Infinity symbol: the Endless Column as a ring of rhomboid modules")}</div>
  <blockquote class="ic-story-text">
    <p>“We will use a stylisation of the Endless Column by Brâncuși as a symbolic element of infinity and the identifier of the brand. It has no end: the column is set in a circle. An endless cycle of investments, a perfectly contoured process, for those who have vision and dare to be at the forefront of financial investment.”</p>
    <cite>From the identity presentation</cite>
  </blockquote>
</div>`;

const swatch = (c, fg, h, i, line = false) => `<div class="ic-sw${line ? " ic-sw--line" : ""}" style="--c:${c};--fg:${fg};--h:${h}%;--i:${i}"><span>${c}</span></div>`;
const PALETTE = `<div class="ic-pal" data-ic role="img" aria-label="The palette: slate ${C.slate}, mist ${C.mist}, ink ${C.ink} and gold ${C.gold}">
  ${swatch(C.slate, C.mist, 52, 0)}
  ${swatch(C.mist, C.ink, 68, 1, true)}
  ${swatch(C.ink, C.mist, 84, 2)}
  ${swatch(C.gold, C.ink, 100, 3)}
</div>`;

const FLIGHTS_BLOCK = `<div class="ic-flights" data-ic data-par>
  ${flights("ic-fl--big")}
  <div class="ic-flights-frame">${frame()}</div>
</div>`;

const photo = (name, w, h, alt, i) => `<figure class="ic-ph" style="--i:${i}">${frame()}<div class="ic-ph-in">${img(name, w, h, alt)}</div></figure>`;
const IMAGERY = `<div class="ic-imagery" data-ic data-par>
  ${photo("img-portrait", 1000, 1500, "A man in a dark suit and glasses, in front of a glass office facade", 0)}
  ${photo("img-towers", 1000, 1500, "Two tall towers against a pale blue sky", 1)}
  ${photo("img-dark", 1000, 1497, "The tip of a glass building, rising into a dark sky", 2)}
  ${photo("img-light", 1000, 1498, "The tip of a glass building, rising into a light blue sky", 3)}
</div>`;

const CARDS = `<div class="ic-cards" data-ic>
  ${img("card-1", 612, 356, "The gold business card, with the INFINITY wordmark", ' class="ic-card" style="--i:0"')}
  ${img("card-2", 613, 356, "An ink business card, with the outline of the column on the left", ' class="ic-card" style="--i:1"')}
  ${img("card-3", 613, 356, "A second ink business card, with the column's outline", ' class="ic-card" style="--i:2"')}
</div>`;

const PIN = `<div class="row ic-pin" data-ic data-par>
  <figure style="--r:0.611"><div class="frame">${img("pin-1", 766, 1254, "A portrait on a stand: a man in a dark suit, the ring pin on his lapel")}</div></figure>
  <figure style="--r:0.679"><div class="frame ic-zoom">${img("pin-2", 998, 1470, "Close-up of the ring pin on the lapel of a navy jacket")}</div></figure>
</div>`;

const WEB = `<div class="ic-web" data-ic data-par>
  <figure class="ic-web-d">${img("web-home", 1600, 1187, "The Infinity home page on a desktop screen: the wordmark, the menu, financial news and featured articles")}</figure>
  <figure class="ic-web-m">${img("web-about", 900, 1519, "The about page on a phone, with the history of the company and a glass building rising")}</figure>
</div>`;

const END = `<div class="ic-end" data-ic data-par>
  ${ring("ic-ring--end")}
  <p class="ic-end-t">Mulțumim infinit!</p>
  <p class="ic-end-s">Thank you, infinitely: the last slide of the presentation.</p>
</div>`;

// ---------------------------------------------------------------- styles
const CSS = `
:root{--ic-slate:${C.slate};--ic-mist:${C.mist};--ic-ink:${C.ink};--ic-gold:${C.gold};--ic-ease:cubic-bezier(.16,1,.3,1)}
@property --a{syntax:"<angle>";inherits:false;initial-value:0deg}
.card.chapter .chapter-side{background:var(--ic-mist)}
.pill--accent{background:var(--ic-gold)}
.to-result b{color:var(--ic-gold)}
.to-result-go{background:var(--ic-gold);border-color:var(--ic-gold)}
.solution-intro{background:var(--ic-slate);color:var(--ic-mist)}
.quote blockquote p{color:var(--ic-slate)}
@media (max-width:640px){.quote{padding-inline:4%}}
.ic-kicker{font-size:var(--fs-small);line-height:var(--lh-small);font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.7}
.ic-panel,.ic-arch,.ic-story,.ic-pal,.ic-flights,.ic-cards,.ic-web,.ic-end{position:relative;border-radius:var(--radius-m);overflow:hidden;box-shadow:inset 0 0 0 1.5px rgba(18,18,18,.1)}

/* the ring: the deck's line art as a mask, drawn around the circle, then turning slowly */
.ic-ring{position:relative;aspect-ratio:988/974;color:var(--ic-mist);rotate:calc(var(--k,0) * -24deg)}
.ic-ring-art{position:absolute;inset:0;background:currentColor;--a:361deg;
  -webkit-mask-image:url(${m("ring")}),conic-gradient(from 200deg,#000 var(--a),#0000 calc(var(--a) + .5deg));-webkit-mask-size:contain,100% 100%;-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;-webkit-mask-composite:source-in;
  mask-image:url(${m("ring")}),conic-gradient(from 200deg,#000 var(--a),#0000 calc(var(--a) + .5deg));mask-size:contain,100% 100%;mask-repeat:no-repeat;mask-position:center;mask-composite:intersect}
@keyframes ic-draw{from{--a:0deg}to{--a:361deg}}
@keyframes ic-spin{to{rotate:360deg}}
/* the wordmark, letter by letter */
.ic-wm{position:relative;aspect-ratio:3.2447;color:var(--ic-mist)}
.ic-l{position:absolute;background:currentColor;-webkit-mask:var(--m) center/100% 100% no-repeat;mask:var(--m) center/100% 100% no-repeat}
/* the flights */
.ic-fl{display:block;overflow:visible}
.ic-fl path{fill:none;stroke:currentColor;stroke-width:var(--sw,2.4);stroke-linejoin:round;stroke-linecap:round}
/* outline frames, drawn edge by edge */
.ic-of{position:absolute;inset:0;pointer-events:none;color:inherit}
.ic-of b{position:absolute;background:currentColor}
.ic-of b:nth-child(1){left:0;top:0;width:100%;height:1px;transform-origin:left}
.ic-of b:nth-child(2){right:0;top:0;width:1px;height:100%;transform-origin:top}
.ic-of b:nth-child(3){right:0;bottom:0;width:100%;height:1px;transform-origin:right}
.ic-of b:nth-child(4){left:0;bottom:0;width:1px;height:100%;transform-origin:bottom}

/* hero stage */
.hero-media{animation:none}
.ic-stage{position:relative;width:100%;aspect-ratio:16/9;max-height:min(78svh,820px);min-height:320px;border:var(--line);border-radius:24px;overflow:hidden;isolation:isolate;color:var(--ic-mist);background:radial-gradient(110% 95% at 80% 20%,#5f6c80 0,var(--ic-slate) 46%,#465264 100%)}
.ic-of--stage{inset:4.5%;opacity:.38}
.ic-ring--hero{position:absolute;height:74%;top:13%;right:8%;translate:0 calc(var(--k,0) * -36px)}
.ic-wm--hero{position:absolute;width:41%;left:8%;top:41%}
.ic-fl--hero{position:absolute;left:8.6%;bottom:calc(4.5% + 1px);height:24%;width:auto;opacity:.55;--sw:3.4;translate:0 calc(var(--k,0) * -30px)}
@media (max-width:640px){
  .ic-stage{aspect-ratio:4/5;max-height:none}
  .ic-ring--hero{height:auto;width:62%;top:8%;right:19%}
  .ic-wm--hero{width:76%;left:12%;top:auto;bottom:11%}
  .ic-fl--hero{display:none}
  .ic-of--stage{inset:4%}
}

/* archetype */
.ic-arch{background:var(--white);padding:clamp(22px,3.4vw,52px);display:grid;gap:clamp(18px,2.2vw,30px)}
.ic-arch-bar{display:flex;height:clamp(18px,2.2vw,28px);gap:4px}
.ic-arch-bar span{width:var(--w);background:var(--c);border-radius:999px;transform-origin:left}
.ic-arch-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:2fr 1fr 1fr;gap:clamp(14px,2vw,28px)}
.ic-arch-list li{border-top:3px solid var(--c);padding-top:12px;display:grid;gap:2px}
.ic-arch-list b{font-size:var(--fs-lead);line-height:var(--lh-lead);font-weight:900}
.ic-arch-list em{font-style:normal;font-weight:900;color:var(--muted)}
.ic-arch-list span{font-weight:700}
@media (max-width:640px){.ic-arch-list{grid-template-columns:1fr}}

/* the ring, with the presentation's own words */
.ic-story{background:var(--ic-slate);color:var(--ic-mist);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);align-items:center;gap:clamp(24px,4vw,64px);padding:clamp(28px,5vw,80px)}
.ic-story-ring .ic-ring{width:100%}
.ic-story-text{margin:0}
.ic-story-text p{font-size:var(--fs-lead);line-height:var(--lh-lead);font-weight:700}
.ic-story-text cite{display:block;margin-top:18px;font-size:var(--fs-small);font-style:normal;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--ic-gold)}
@media (max-width:760px){.ic-story{grid-template-columns:1fr}.ic-story-ring{width:min(78%,420px);margin-inline:auto}}

/* palette: four bars that climb */
.ic-pal{background:var(--white);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:end;gap:clamp(8px,1.4vw,18px);height:clamp(300px,34vw,480px);padding:clamp(16px,3vw,44px) clamp(16px,3vw,44px) 0}
.ic-sw{height:var(--h);background:var(--c);color:var(--fg);border-radius:14px 14px 0 0;display:flex;align-items:flex-start;padding:clamp(10px,1.4vw,18px);transform-origin:bottom;font-weight:800;font-size:var(--fs-ui);line-height:1}
.ic-sw--line{box-shadow:inset 0 0 0 1px rgba(32,38,49,.25)}
@media (max-width:640px){.ic-sw{font-size:12px;padding:10px 6px;justify-content:center}}

/* the flights */
.ic-flights{background:var(--ic-mist);color:var(--ic-ink);aspect-ratio:16/9;display:flex;align-items:flex-end;justify-content:center;gap:8%;padding:7% 8% 0}
.ic-fl--big{height:86%;width:auto;--sw:2.2}
.ic-fl--big .ic-f{translate:0 calc(var(--k,0) * var(--sp,40) * -1px)}
.ic-fl--big .ic-f:nth-child(1){--sp:30}.ic-fl--big .ic-f:nth-child(2){--sp:70}.ic-fl--big .ic-f:nth-child(3){--sp:110}.ic-fl--big .ic-f:nth-child(4){--sp:50}
.ic-flights-frame{position:relative;align-self:center;height:72%;aspect-ratio:918/1394;color:var(--ic-ink)}
@media (max-width:640px){.ic-flights{aspect-ratio:4/5;flex-direction:column;align-items:center;gap:6%;padding:10% 8% 0}.ic-fl--big{height:auto;width:100%;max-height:72%}.ic-flights-frame{display:none}}

/* imagery, each picture in its outline frame */
.ic-imagery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(18px,2.6vw,40px);padding:18px 18px 0 0}
.ic-ph{position:relative;margin:0;aspect-ratio:2/3;color:var(--ic-slate)}
.ic-ph .ic-of{inset:-14px -14px 14px 14px}
.ic-ph-in{position:relative;height:100%;overflow:hidden;border-radius:6px;background:#cfd6dc}
.ic-ph-in img{width:100%;height:100%;object-fit:cover;scale:1.12;translate:0 calc(var(--k,0) * -5%)}
@media (max-width:640px){.ic-imagery{grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 22px;padding:12px 12px 0 0}.ic-ph .ic-of{inset:-10px -10px 10px 10px}}

/* business cards, fanned out */
.ic-cards{background:var(--ic-mist);aspect-ratio:16/8;display:grid;place-items:center}
.ic-card{position:absolute;width:30%;height:auto;left:35%;top:33%;border-radius:4px;box-shadow:0 26px 50px -22px rgba(32,38,49,.55),0 2px 6px rgba(32,38,49,.12);transition:transform 1.3s var(--ic-ease),box-shadow .4s ease;transition-delay:calc(var(--i) * .12s)}
.ic-card:nth-child(1){z-index:3}.ic-card:nth-child(2){z-index:2}
.ic-cards.is-on .ic-card:nth-child(1){transform:translate(-108%,-10%) rotate(-6deg)}
.ic-cards.is-on .ic-card:nth-child(2){transform:translate(0,12%) rotate(1.5deg)}
.ic-cards.is-on .ic-card:nth-child(3){transform:translate(108%,-6%) rotate(6deg)}
@media (hover:hover){.ic-cards.is-on .ic-card:hover{box-shadow:0 40px 70px -24px rgba(32,38,49,.6),0 2px 6px rgba(32,38,49,.12);transition-delay:0s}
  .ic-cards.is-on .ic-card:nth-child(1):hover{transform:translate(-108%,-16%) rotate(-4deg)}
  .ic-cards.is-on .ic-card:nth-child(2):hover{transform:translate(0,6%) rotate(0deg)}
  .ic-cards.is-on .ic-card:nth-child(3):hover{transform:translate(108%,-12%) rotate(4deg)}}
@media (max-width:640px){
  .ic-cards{aspect-ratio:3/4}
  .ic-card{width:64%;left:18%;top:36%}
  .ic-cards.is-on .ic-card:nth-child(1){transform:translate(-5%,-116%) rotate(-5deg)}
  .ic-cards.is-on .ic-card:nth-child(2){transform:translate(4%,0) rotate(2.5deg)}
  .ic-cards.is-on .ic-card:nth-child(3){transform:translate(-3%,116%) rotate(-2deg)}
}

/* the pin: the second picture closes in on the lapel as you scroll */
.ic-zoom img{transform-origin:64% 69%;scale:calc(1.06 + (1 - var(--k,0)) * .14)}

/* the website: the desktop page, with the phone in front */
.ic-web{background:var(--white);aspect-ratio:16/10.4}
.ic-web figure{position:absolute;margin:0}
.ic-web img{display:block;width:100%;height:auto}
.ic-web-d{right:2%;top:4%;width:80%;translate:0 calc(var(--k,0) * -18px)}
.ic-web-m{left:3%;bottom:3%;width:23%;translate:0 calc(var(--k,0) * -70px);filter:drop-shadow(0 30px 40px rgba(32,38,49,.18))}
@media (max-width:640px){.ic-web{aspect-ratio:auto;display:grid;gap:6px;padding:12px 10px 0}.ic-web figure{position:relative;inset:auto;width:100%}.ic-web-d{translate:none}.ic-web .ic-web-m{width:50%;margin-inline:auto!important;translate:0 calc(var(--k,0) * -24px)}}

/* thank you */
.ic-end{background:var(--ic-ink);color:var(--ic-mist);display:grid;justify-items:center;text-align:center;gap:clamp(14px,2vw,22px);padding:clamp(40px,7vw,110px) 20px;box-shadow:none}
.ic-ring--end{width:min(52%,320px);color:var(--ic-gold)}
.ic-end-t{font-size:var(--fs-h2);line-height:var(--lh-h2);font-weight:900;letter-spacing:-.01em}
.ic-end-s{color:#aeb6c2;font-size:var(--fs-small);font-weight:700}

/* ---- motion: everything starts hidden only when scripts run and motion is welcome ---- */
@media (scripting:enabled) and (prefers-reduced-motion:no-preference){
  [data-ic] .ic-ring-art{--a:0deg}
  [data-ic].is-on .ic-ring-art{animation:ic-draw 2.6s cubic-bezier(.55,.05,.25,1) .15s both,ic-spin 140s linear 2.8s infinite}
  .ic-stage.is-on .ic-ring-art{animation-delay:.35s,3s}
  [data-ic] .ic-l{opacity:0;transform:translateY(38%);filter:blur(6px)}
  [data-ic].is-on .ic-l{opacity:1;transform:none;filter:none;transition:transform 1.2s var(--ic-ease),opacity .9s ease,filter .9s ease;transition-delay:calc(.9s + var(--i) * .075s)}
  [data-ic].is-on .ic-l--sub{transition-delay:1.75s}
  [data-ic] .ic-fl path{stroke-dasharray:1 1;stroke-dashoffset:1}
  [data-ic].is-on .ic-fl path{stroke-dashoffset:0;transition:stroke-dashoffset 2.4s cubic-bezier(.65,0,.35,1);transition-delay:calc(.4s + var(--i) * .28s)}
  .ic-stage.is-on .ic-fl path{transition-delay:calc(1.6s + var(--i) * .22s)}
  [data-ic].is-on .ic-f path{animation:ic-float 7s ease-in-out infinite alternate;animation-delay:calc(2.6s + var(--i) * -1.9s)}
  @keyframes ic-float{from{transform:translateY(-10px)}to{transform:translateY(12px)}}
  [data-ic] .ic-of b{transform:scale(0)}
  [data-ic].is-on .ic-of b{transform:none;transition:transform .7s cubic-bezier(.65,0,.35,1)}
  [data-ic].is-on .ic-of b:nth-child(2){transition-delay:.55s}
  [data-ic].is-on .ic-of b:nth-child(3){transition-delay:1.1s}
  [data-ic].is-on .ic-of b:nth-child(4){transition-delay:1.65s}
  .ic-stage.is-on .ic-of b{transition-duration:1s}
  .ic-stage.is-on .ic-of b:nth-child(1){transition-delay:.2s}.ic-stage.is-on .ic-of b:nth-child(2){transition-delay:1s}.ic-stage.is-on .ic-of b:nth-child(3){transition-delay:1.8s}.ic-stage.is-on .ic-of b:nth-child(4){transition-delay:2.6s}
  .ic-imagery.is-on .ic-of b{transition-delay:calc(.5s + var(--i,0) * .18s)}
  .ic-ph .ic-of b:nth-child(1){--i:0}.ic-ph .ic-of b:nth-child(2){--i:1}.ic-ph .ic-of b:nth-child(3){--i:2}.ic-ph .ic-of b:nth-child(4){--i:3}
  .ic-ph:nth-child(2){--d:.15s}.ic-ph:nth-child(3){--d:.3s}.ic-ph:nth-child(4){--d:.45s}
  .ic-imagery.is-on .ic-ph .ic-of b{transition-delay:calc(.6s + var(--d,0s) + var(--i) * .2s)}
  [data-ic] .ic-ph-in{opacity:0;transform:translateY(60px)}
  [data-ic].is-on .ic-ph-in{opacity:1;transform:none;transition:transform 1.2s var(--ic-ease),opacity .9s ease;transition-delay:var(--d,0s)}
  [data-ic] .ic-arch-bar span{transform:scaleX(0)}
  [data-ic].is-on .ic-arch-bar span{transform:none;transition:transform 1.1s var(--ic-ease);transition-delay:calc(.2s + var(--i) * .35s)}
  [data-ic] .ic-arch-list li{opacity:0;transform:translateY(16px)}
  [data-ic].is-on .ic-arch-list li{opacity:1;transform:none;transition:opacity .7s ease,transform .9s var(--ic-ease);transition-delay:calc(.5s + var(--i) * .35s)}
  [data-ic] .ic-story-text p,[data-ic] .ic-story-text cite{opacity:0;transform:translateY(24px)}
  [data-ic].is-on .ic-story-text p,[data-ic].is-on .ic-story-text cite{opacity:1;transform:none;transition:opacity 1s ease .9s,transform 1.2s var(--ic-ease) .9s}
  [data-ic].is-on .ic-story-text cite{transition-delay:1.5s}
  [data-ic] .ic-sw{transform:scaleY(0)}
  [data-ic] .ic-sw span{opacity:0}
  [data-ic].is-on .ic-sw{transform:none;transition:transform 1.2s var(--ic-ease);transition-delay:calc(var(--i) * .16s)}
  [data-ic].is-on .ic-sw span{opacity:1;transition:opacity .6s ease;transition-delay:calc(.7s + var(--i) * .16s)}
  [data-ic] .ic-web-d,[data-ic] .ic-web-m{opacity:0}
  [data-ic].is-on .ic-web-d,[data-ic].is-on .ic-web-m{opacity:1;transition:opacity 1s ease}
  [data-ic].is-on .ic-web-m{transition-delay:.4s}
  [data-ic] .ic-end-t,[data-ic] .ic-end-s{opacity:0;transform:translateY(18px)}
  [data-ic].is-on .ic-end-t,[data-ic].is-on .ic-end-s{opacity:1;transform:none;transition:opacity 1s ease 1.6s,transform 1.2s var(--ic-ease) 1.6s}
  [data-ic].is-on .ic-end-s{transition-delay:2s}
}
@media (prefers-reduced-motion:reduce){
  .ic-ring,.ic-ring--hero,.ic-fl--hero,.ic-fl--big .ic-f,.ic-ph-in img,.ic-web-d,.ic-web-m{rotate:none;translate:none}
  .ic-zoom img{scale:1.06}
  .ic-card{transition:none}
}
`;

// ---------------------------------------------------------------- script: reveal on view, scroll-linked depth
const JS = `(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els=[].slice.call(document.querySelectorAll('[data-ic]'));
  if(reduce||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('is-on')});if(reduce)return;}
  else{
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-on');io.unobserve(e.target)}})},{threshold:.2,rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(e){io.observe(e)});
  }
  // --k: where a block sits in the viewport, from 1 (just below) through 0 (centred) to -1 (just above)
  var par=[].slice.call(document.querySelectorAll('[data-par]')),raf=0;
  var run=function(){raf=0;var vh=innerHeight||1;par.forEach(function(el){var r=el.getBoundingClientRect();if(r.bottom<-vh*.5||r.top>vh*1.5)return;var k=(r.top+r.height/2-vh/2)/vh;k=Math.max(-1.25,Math.min(1.25,k));el.style.setProperty('--k',k.toFixed(4))})};
  addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(run)},{passive:true});
  addEventListener('resize',run);run();
})();
// the quote is split into lines before the webfont arrives: split it again once the type is in
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(document.fonts.status==='loaded')dispatchEvent(new Event('resize'))});`;

export const INFINITY = {
  slug: "infinity-capital",
  name: "Infinity Capital",
  tagline: "Brâncuși's Endless Column, closed into a ring, for an investment company from Craiova.",
  desc: "Infinity Capital Investments, Craiova: an identity built on Brâncuși's Endless Column, with stationery, key visuals and a website. By Cromatic Studios.",
  title: "Be at the forefront of finance.",
  accent: { bg: C.slate, fg: C.mist, ink: "#3c475a" },
  info: ["Investments, financial services", "Craiova, formerly SIF Oltenia", "Brand identity, symbol, illustration, stationery, key visuals, website UI"],
  cover: { img: m("web") },
  og: m("web"),
  heroHtml: HERO,
  problem: {
    h: "Investments with a long view",
    p: [
      "Infinity Capital Investments, the former SIF Oltenia, offers <strong>financial investments to visionary clients</strong>, with the best team at their disposal and a voice at the forefront. It helps them reach <strong>long-term financial growth</strong>, and feel empowered doing it.",
      "The brief was short: something new in approach, a simple website with a touch of the new, no pink or loud colours, and <strong>not the usual blue</strong>. And something that says the company believes in Romania, without saying it through colours."
    ],
    media: [{ raw: ARCHETYPE }],
    quote: { text: "Something that shows we are a company that believes in Romania. Not through colours.", cite: "From the brief, in the client's own words" }
  },
  solution: {
    h: "An endless column, closed into a circle",
    p: "A Romanian symbol instead of Romanian colours: Constantin Brâncuși's <strong>Endless Column</strong>, stylised and set in a circle, as the sign of infinity and the brand's identifier. Around it, a serif wordmark, slate, ink and gold, and illustrations that climb.",
    stat: "∞",
    statText: "No beginning, no end: the column, closed into a ring"
  },
  chapters: [
    {
      pillar: "brand",
      pills: ["Logo", "&amp; symbol"],
      text: "A serif wordmark with flared strokes, INFINITY over CAPITAL INVESTMENT, in ink on mist or in mist on slate. Next to it, the symbol: the Endless Column's rhomboid modules, drawn in outline and closed into a ring.",
      deliverables: ["Wordmark", "Symbol", "Light and dark versions"],
      media: [
        { raw: RING_STORY },
        { row: [{ img: m("logo-mist"), alt: "The INFINITY Capital Investment logo in ink on mist" }, { img: m("logo-slate"), alt: "The INFINITY Capital Investment logo in mist on slate" }], cap: "The logo on mist and on slate" }
      ]
    },
    {
      pillar: "brand",
      pills: ["Colour", "&amp; type"],
      text: "Four colours: slate, mist, ink and a warm gold, which keeps the greys from going cold. Baker for titles, Gotham for body text.",
      deliverables: ["Colour palette", "Typography"],
      media: [
        { raw: PALETTE, cap: "Slate, mist, ink and gold" },
        { img: m("fonts"), alt: "The type: Baker for titles and subtitles, Gotham for body text", cap: "Baker for titles, Gotham for body text" }
      ]
    },
    {
      pillar: "brand",
      pills: ["Visual", "universe"],
      text: "Ascending illustrations derived from Brâncuși's flights and from the I of Infinity, thin outline frames, and imagery in blues: futuristic, minimal, every vector pointing up, towards growth.",
      deliverables: ["Illustration", "Outline frames", "Imagery direction"],
      media: [
        { raw: FLIGHTS_BLOCK, cap: "Ascending illustrations, from Brâncuși's flights and the initial of Infinity, and an outline frame" },
        { raw: IMAGERY, cap: "Imagery: blues, futuristic, minimal, vectors pointing up" }
      ]
    },
    {
      pillar: "brand",
      pills: ["Stationery", "&amp; co"],
      text: "Documents with charts in slate, mist and gold, business cards in gold and ink with the column's outline, key visuals for investors with vision, and the ring as a pin for the lapel.",
      deliverables: ["Documents", "Business cards", "Key visuals", "Pin"],
      media: [
        { row: [{ img: m("doc-mock"), alt: "A letter with a table and a bar chart, on a white surface", bg: C.mist, contain: true }, { img: m("doc"), alt: "The letter template: recipient fields, a table, a bar chart in slate, mist and gold, and the ring at the bottom", contain: true, bg: "#ffffff" }], cap: "Documents" },
        { raw: CARDS, cap: "Business cards" },
        { row: [{ img: m("kv-1"), alt: "Key visual on a stand: CREȘTERE CONSTANTĂ, pentru investitori cu viziune, with the gold ring above a building" }, { img: m("kv-2"), alt: "Key visual on a stand: FII ÎN AVANGARDA FINANCIARĂ, with two towers and the ring" }], cap: "Key visuals: “Constant growth, for investors with vision” and “Be at the forefront of finance”" },
        { raw: PIN, cap: "The ring, as a pin" }
      ]
    },
    {
      pillar: "product",
      pills: ["Website", "UI"],
      text: "A website led by news and analysis: a home page with financial news and featured articles, article pages that open next to a gold panel with the zigzag flight, and an about page that reads well on a phone.",
      deliverables: ["Website UI", "Home page", "Article page", "About page", "Mobile"],
      media: [
        { raw: WEB, cap: "The home page, and the about page on a phone" },
        { img: m("web-article"), alt: "An article page: The financial scene, a headline about the construction sector, the author and date, and a gold panel with a zigzag line", cap: "An article page" }
      ]
    }
  ],
  result: {
    text: "An investment brand that carries Romania in its symbol, not in its colours: Brâncuși's Endless Column, closed into a ring, from a business card and a lapel pin to the website.",
    media: [{ raw: END }]
  },
  related: ["longshield", "techventures-bank", "investimental"],
  css: CSS,
  js: JS
};
