// Generates the standalone case-study pages in site/cases/<slug>.html, in the design system of the
// Steam case study (its CSS and script are read from src/app.js, so the pages stay in sync with it).
//   node site/cases/src/gen.mjs            -> every page in specs.mjs
//   node site/cases/src/gen.mjs elithia    -> one page
// Image sources in specs: "cs:2025/06/x.jpg" (hotlinked from cromaticstudios.com) or
// "m:<dir>/<name>" (site/media/<dir>/<name>.jpg, swapped for the hashed /assets/m/... URL by build.mjs).
// Ratios come from dims.json (refresh it when images change); videos carry their own "r".
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES } from "./specs.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const DIMS = JSON.parse(readFileSync(join(here, "dims.json"), "utf8"));
const js = readFileSync(join(root, "src", "app.js"), "utf8");
const lit = /var steamCaseHtml = ("(?:[^"\\]|\\.)*");/.exec(js);
if (!lit) throw new Error("steamCaseHtml not found in src/app.js");
const steam = new Function(`return ${lit[1]}`)();
const STEAM_CSS = /<style>([\s\S]*?)<\/style>/.exec(steam)[1];
const STEAM_JS = /<script>([\s\S]*?)<\\?\/script>\s*<\/body>/.exec(steam)[1].replace("querySelectorAll('video')", "querySelectorAll('video:not([data-manual])')");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const CS = "https://cromaticstudios.com/wp-content/uploads/";
// cromaticstudios.com images are served from local, recompressed copies (site/media/cs/) when present
const loc = (src) => {
  if (!src || !src.startsWith("cs:") || !/\.(jpe?g|png)$/i.test(src)) return src;
  const k = "m:cs/" + src.split("/").pop().replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "");
  return DIMS[k] ? k : src;
};
const D = (src) => DIMS[loc(src)] || DIMS[src];
const url = (src) => { src = loc(src); return src.startsWith("cs:") ? CS + encodeURI(src.slice(3)) : src; };
const ratio = (it) => {
  if (it.r) return +it.r;
  const d = D(it.img || it.poster);
  if (!d) throw new Error(`no dims for ${it.img || it.poster}`);
  return d[0] / d[1];
};
const r4 = (n) => (+n).toFixed(3).replace(/\.?0+$/, "");

const PILLARS = {
  brand: { id: "branding-design", cls: "brand", pills: ["Branding", "&amp; Design"], label: "Branding &amp; Design", aria: "Branding and Design" },
  marketing: { id: "growth-content", cls: "marketing", pills: ["Growth", "&amp; Content"], label: "Growth &amp; Content", aria: "Growth and Content" },
  product: { id: "product-design", cls: "product", pills: ["Product", "Design"], label: "Product Design", aria: "Product Design" },
  video: { id: "photo-video", cls: "video", pills: ["Photo", "&amp; Video"], label: "Photo &amp; Video", aria: "Photo and Video" }
};

// ---- media ----
function inner(it, eager) {
  if (it.video) {
    const pre = it.preload || "metadata";
    // long films play on demand, with controls: they are too heavy to start on their own
    if (it.manual) return `<video src="${url(it.video)}"${it.poster ? ` poster="${url(it.poster)}"` : ""} controls playsinline preload="none" data-manual aria-label="${esc(it.alt || "")}"></video>`;
    return `<video src="${url(it.video)}"${it.poster ? ` poster="${url(it.poster)}"` : ""} autoplay muted loop playsinline preload="${pre}" aria-label="${esc(it.alt || "")}"></video>`;
  }
  const d = D(it.img);
  const wh = d ? ` width="${d[0]}" height="${d[1]}"` : "";
  return `<img src="${url(it.img)}" alt="${esc(it.alt || "")}"${wh} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}
function fig(it, { cls = "", eager = false } = {}) {
  const c = [cls, it.full ? "full-sm" : "", it.hideSm ? "hide-sm" : ""].filter(Boolean).join(" ");
  const fit = it.contain ? ` frame--contain` : "";
  const bg = it.bg ? ` style="--frame-bg:${it.bg}"` : "";
  return `<figure${c ? ` class="${c}"` : ""} style="--r:${r4(ratio(it))}"${it.fixed ? " data-fixed-ratio" : ""}>
  <div class="frame${fit}"${bg}>${inner(it, eager)}</div>${it.cap ? `\n  <figcaption>${it.cap}</figcaption>` : ""}
</figure>`;
}
const titlePills = (words) => `<h4>${words.map((w, i) => `<span class="pill" style="--rot:${i % 2 ? 4 + ((w.length * 3) % 8) : -5 - ((w.length * 2) % 7)}deg">${w}</span>`).join("")}</h4>`;
let railN = 0;
function row(items, cap) {
  // on phones a wide row would shrink to slivers: landscape items take a line each, the rest go two by two
  const rs = items.map(ratio);
  const sum = rs.reduce((a, b) => a + b, 0);
  const crowded = items.length >= 3 && sum > 1.6 || items.length === 2 && sum > 2.6;
  const figs = items.map((it, i) => fig({ ...it, full: it.full || (crowded && rs[i] > 1.15) }));
  const body = `<div class="row${crowded ? " row--wrap-sm" : ""}">\n${figs.join("\n")}\n</div>`;
  return cap ? `<div class="stack">\n${body}\n<figcaption>${cap}</figcaption>\n</div>` : body;
}
function block(b) {
  if (b.img || b.video) return fig(b);
  if (b.row) return row(b.row, b.cap);
  if (b.rail) {
    railN++;
    const label = b.rail.join(" ").replace(/&amp;/g, "and");
    return `<div class="rail bleed" data-rail>
  <div class="rail-head">
    ${titlePills(b.rail)}
    <div class="rail-btns"><button type="button" data-prev aria-label="Previous: ${esc(label)}">←</button><button type="button" data-next aria-label="Next: ${esc(label)}">→</button></div>
  </div>
  <div class="track" tabindex="0" aria-label="${esc(label)}, scroll horizontally">
${b.items.map((it) => fig(it)).join("\n")}
  </div>${b.cap ? `\n  <figcaption class="rail-cap">${b.cap}</figcaption>` : ""}
</div>`;
  }
  if (b.stack) {
    return `<div class="stack">
${b.head ? `<div class="rail-head">${titlePills(b.head)}</div>\n` : ""}${b.stack.map(block).join("\n")}${b.cap ? `\n<figcaption>${b.cap}</figcaption>` : ""}
</div>`;
  }
  if (b.site) return site(b);
  if (b.field) {
    // low-resolution artwork presented as cards on a brand colour field
    return `<figure class="field" style="--field:${b.field}${b.fg ? `;--field-fg:${b.fg}` : ""}">
  <div class="field-inner${b.items.length > 1 ? " field-inner--multi" : ""}">
${b.items.map((it) => `    <div class="field-card" style="--r:${r4(ratio(it))}">${inner(it)}</div>`).join("\n")}
  </div>${b.cap ? `\n  <figcaption>${b.cap}</figcaption>` : ""}
</figure>`;
  }
  if (b.statement) return `<div class="statement" style="--field:${b.bg || "var(--accent)"};--field-fg:${b.fg || "var(--ink)"}"><p>${b.statement}</p>${b.sub ? `<span>${b.sub}</span>` : ""}</div>`;
  if (b.btn) return `<a class="btn site-link" href="${b.btn.href}" target="_blank" rel="noopener">${b.btn.label} <span aria-hidden="true">↗</span></a>`;
  throw new Error("unknown block " + JSON.stringify(b).slice(0, 80));
}
function screen(s, sr, w) {
  if (s.video) return `<div class="screen" style="--sr:${sr}"><video src="${url(s.video)}"${s.poster ? ` poster="${url(s.poster)}"` : ""} autoplay muted loop playsinline preload="metadata" aria-label="${esc(s.alt || "")}"></video></div>`;
  const d = D(s.img);
  const tall = d ? d[1] / d[0] : 3;
  const dur = Math.round(Math.min(60, Math.max(14, tall * (w > 600 ? 5 : 2.4))));
  return `<div class="screen${s.scroll ? " screen--scroll" : ""}" style="--sr:${sr};--dur:${dur}s"><img src="${url(s.img)}" alt="${esc(s.alt || "")}" loading="lazy" decoding="async"></div>`;
}
function site(b) {
  const s = b.site;
  const out = [];
  out.push(`<div class="stack">`);
  if (b.head) out.push(`<div class="rail-head">${titlePills(b.head)}</div>`);
  out.push(`<div class="row site-row">`);
  if (s.d) {
    const sr = s.d.r || 1.6;
    out.push(`<figure class="hide-sm" style="--r:${r4(sr)}">
  <div class="device">
    <div class="device-bar" aria-hidden="true"><i></i><i></i><i></i><span>${s.label}</span></div>
    ${screen(s.d, r4(sr), 1440)}
  </div>
</figure>`);
  }
  if (s.m) {
    const sr = s.m.r || 0.462;
    out.push(`<figure class="full-sm${s.d ? "" : ""}" style="--r:${r4(sr)}">
  <div class="device device--phone">
    <div class="device-bar" aria-hidden="true"><i></i><span>${s.label}</span></div>
    ${screen(s.m, r4(sr), 390)}
  </div>
</figure>`);
  }
  out.push(`</div>`);
  if (b.cap) out.push(`<figcaption>${b.cap}</figcaption>`);
  if (s.href) out.push(`<a class="btn site-link" href="${s.href}" target="_blank" rel="noopener">Visit ${s.label} <span aria-hidden="true">↗</span></a>`);
  out.push(`</div>`);
  return out.join("\n");
}

// ---- page ----
function page(P, all) {
  railN = 0;
  const pills = (P.chapters || []).map((c) => PILLARS[c.pillar]);
  const firstId = pills.length ? "#" + pills[0].id : "#result";
  const accent = P.accent;
  const h = [];
  h.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(P.name)} — Cromatic Studios</title>
<meta name="description" content="${esc(P.desc)}">
<link rel="canonical" href="%%SITE_URL%%/work/${P.slug}/">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(P.name)} — Cromatic Studios">
<meta property="og:description" content="${esc(P.desc)}">
<meta property="og:url" content="%%SITE_URL%%/work/${P.slug}/">${P.og ? `\n<meta property="og:image" content="${url(P.og)}">` : ""}
<link rel="icon" href="/favicon.ico" sizes="32x32">
<script>(function(){try{if(/[?&]embed\\b/.test(location.search)||window.self!==window.top)document.documentElement.classList.add("embed")}catch(e){document.documentElement.classList.add("embed")}})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Darker+Grotesque:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${STEAM_CSS}
/* ---- case pages built on the Steam system: brand accent, embed mode, extras ---- */
:root{--accent:${accent.bg};--accent-fg:${accent.fg || "var(--ink)"};--accent-ink:${accent.ink};--frame-bg:#d9d9d9}
.solution-intro{background:var(--accent);color:var(--accent-fg)}
.quote blockquote p{color:var(--accent-ink)}
.frame{background:var(--frame-bg)}
.frame--contain img{object-fit:contain}
.frame::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1.5px rgba(18,18,18,.1);pointer-events:none}
.to-result b.is-text{font-size:var(--fs-lead)}
.cs-back{position:fixed;left:14px;top:14px;z-index:9999;padding:10px 16px;border-radius:999px;background:#FED012;color:#0d0c09;border:2.5px solid #0d0c09;font:800 14px/1 system-ui,sans-serif;text-decoration:none}
html.embed .cs-back{display:none}
html:not(.embed) .page{padding-top:64px}
.rail-cap{margin-top:var(--caption-gap);padding-inline:var(--media-pad)}
.hero-media figure:only-child .frame{max-height:min(78svh,820px)}
.hero-row{display:flex;gap:var(--gutter)}
.hero-row>figure{flex:var(--r) 1 0;min-width:0}
/* a full-page capture, scrolled slowly inside the device frame */
.screen--scroll img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 0;animation:shot-scroll var(--dur,30s) ease-in-out 1s infinite alternate}
.device:hover .screen--scroll img{animation-play-state:paused}
@keyframes shot-scroll{0%,6%{object-position:50% 0}94%,100%{object-position:50% 100%}}
.screen video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.result .btn{margin-top:clamp(28px,3vw,44px)}
.result .result-media{margin-top:clamp(36px,5vw,72px)}
.result figcaption{color:#b9b9b9}
/* a film that opens the page */
.film{background:#0d0c09;border-color:#0d0c09}
.film-frame{position:relative;width:min(100%,calc((100svh - 2 * var(--gutter) - 4px) * 16 / 9));aspect-ratio:16/9;margin-inline:auto}
.film-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
@media (max-width:640px){
  .row--wrap-sm>figure{flex-basis:calc(50% - var(--gutter) / 2)}
  .row--wrap-sm>figure.full-sm{flex-basis:100%}
  .hero-row{flex-wrap:wrap}
  .hero-row>figure{flex-basis:100%}
}
/* colour fields and statements */
.field{border-radius:var(--radius-m);background:var(--field);padding:clamp(22px,5vw,80px) clamp(16px,5vw,80px)}
.field figcaption{color:var(--field-fg,rgba(255,255,255,.85));margin-top:clamp(16px,2vw,28px)}
.field-inner{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(14px,2.4vw,36px)}
.field-card{width:min(100%,860px);aspect-ratio:var(--r);border-radius:14px;overflow:hidden;box-shadow:0 30px 60px -24px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.06)}
.field-inner--multi .field-card{width:auto;flex:var(--r) 1 0;min-width:0;max-width:640px}
.field-card img,.field-card video{width:100%;height:100%;object-fit:cover}
.statement{border-radius:var(--radius-m);background:var(--field);color:var(--field-fg);padding:clamp(28px,6vw,96px) clamp(22px,5vw,80px);display:grid;gap:18px}
.statement p{font-size:var(--fs-h2);line-height:var(--lh-h2);font-weight:900;letter-spacing:-.01em;max-width:14em}
.statement span{font-size:var(--fs-lead);line-height:var(--lh-lead);font-weight:700;max-width:28em;opacity:.85}
@media (max-width:640px){.field-inner--multi{flex-direction:column;align-items:center}.field-inner--multi .field-card{flex:none;width:100%}}
/* the first image: a mask that opens from the bottom, the picture settling from a slow zoom, then a light parallax */
.hero-media{animation:none}
.hero-media .frame,.film-frame{clip-path:inset(0 0 0 0 round 24px);animation:hero-wipe 1.1s cubic-bezier(.16,1,.3,1) .12s both}
.hero-row>figure:nth-child(2) .frame{animation-delay:.24s}
.hero-media .frame>img,.hero-media .frame>video{scale:1.04;translate:0 var(--py,0px);will-change:scale,translate,filter;animation:hero-settle 1.6s cubic-bezier(.16,1,.3,1) .12s both}
@keyframes hero-wipe{from{clip-path:inset(100% 0 0 0 round 24px)}to{clip-path:inset(0 0 0 0 round 24px)}}
@keyframes hero-settle{from{scale:1.12;filter:blur(10px) brightness(1.25)}to{scale:1.04;filter:none}}
@media (prefers-reduced-motion:reduce){
  .screen--scroll img{animation:none}
  .hero-media .frame,.film-frame,.hero-media .frame>img,.hero-media .frame>video{animation:none;clip-path:none;scale:1;translate:none}
}
</style>
</head>
<body>
<a class="cs-back" href="/site/#work">← Cromatic Studios</a>
<main class="page">
`);
  if (P.film) {
    h.push(`  <section class="card film" aria-label="${esc(P.film.title)}">
    <div class="film-frame"><iframe src="https://www.youtube-nocookie.com/embed/${P.film.id}?rel=0&amp;modestbranding=1&amp;playsinline=1" title="${esc(P.film.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
  </section>
`);
  }
  // hero
  const heroMedia = P.hero ? (Array.isArray(P.hero)
    ? `<div class="hero-row">${P.hero.map((it) => fig(it, { eager: true })).join("")}</div>`
    : fig({ fixed: P.hero.fixed !== false, ...P.hero, r: P.hero.r || (P.hero.fixed === false ? undefined : 1.778) }, { eager: true })) : "";
  h.push(`  <header class="card hero">
    <div class="inner">
      <div class="hero-top">
        <div class="hero-title">
          <p class="client-name">${P.name}</p>
          <h1>${P.title}</h1>
        </div>
        <div class="hero-info">${pills.length ? `
          <div class="client-row">
            <ul class="pills" aria-label="Jump to a pillar">
${pills.map((p) => `              <li><a class="pill pill--${p.cls}" href="#${p.id}">${p.label}</a></li>`).join("\n")}
            </ul>
          </div>` : ""}
          <ul class="info">
${P.info.map((l) => `            <li>${l}</li>`).join("\n")}
          </ul>
        </div>
      </div>${heroMedia ? `
      <div class="hero-media">
        ${heroMedia}
      </div>` : ""}
    </div>
  </header>
`);
  // problem + solution
  const pr = P.problem;
  h.push(`  <section class="card problem" id="problem">
    <div class="inner">
      <div class="sec-head">
        <h2>${pr.h}</h2>
        <div class="prose">
${pr.p.map((p) => `          <p>${p}</p>`).join("\n")}
        </div>
      </div>${pr.media ? `
      <div class="problem-media stack">
${pr.media.map(block).join("\n")}
      </div>` : ""}${pr.quote ? `
      <div class="quote">
        <blockquote>
          <p data-lines>“${pr.quote.text}”</p>
          <cite>${pr.quote.cite}</cite>
        </blockquote>
      </div>` : ""}
      <div class="handoff">
        <div class="solution-intro" id="solution">
          <h2>${P.solution.h}</h2>
          <p>${P.solution.p}</p>
        </div>
        <a class="to-result" href="${firstId}">
          <b${P.solution.stat.length > 14 ? ' class="is-text"' : ""}>${P.solution.stat}</b>
          <span>${P.solution.statText}</span>
          <span class="to-result-go">Drop for more <span class="go-icon" aria-hidden="true">↓</span></span>
        </a>
      </div>
    </div>
  </section>
`);
  for (const c of P.chapters || []) {
    const pl = PILLARS[c.pillar];
    const words = c.pills || pl.pills;
    h.push(`  <section class="card chapter chapter--${pl.cls}" id="${pl.id}" aria-label="${pl.aria}">
    <div class="chapter-side">
      <div>
        <span class="pill-title"><span class="pill pill--${pl.cls}">${words[0]}</span><span class="pill pill--accent">${words[1]}</span></span>
        <p class="chapter-text">${c.text}</p>
        <ul class="deliverables">
${c.deliverables.map((d) => `          <li>${d}</li>`).join("\n")}
        </ul>
      </div>
    </div>
    <div class="chapter-media">
${c.media.map(block).join("\n")}
    </div>
  </section>
`);
  }
  // result
  const R = P.result;
  h.push(`  <section class="card result" id="result">
    <div class="inner">
      <p class="result-text">${R.text}</p>${R.media ? `
      <div class="stack result-media">
${R.media.map(block).join("\n")}
      </div>` : ""}${P.link ? `
      <a class="btn" href="${P.link.href}" target="_blank" rel="noopener">${P.link.label} <span aria-hidden="true">↗</span></a>` : ""}
    </div>
  </section>
`);
  // related
  const rel = P.related.map((s) => all.find((x) => x.slug === s) || STEAM).filter(Boolean);
  h.push(`  <section class="card related" aria-labelledby="related-title">
    <div class="inner">
      <div class="rail bleed" data-rail>
        <div class="rail-head">
          <h2 id="related-title">Related projects</h2>
          <div class="rail-btns"><button type="button" data-prev aria-label="Previous projects">←</button><button type="button" data-next aria-label="Next projects">→</button></div>
        </div>
        <div class="track" tabindex="0" aria-label="Related projects, scroll horizontally">
${rel.map((q) => `          <article class="proj">
            ${fig({ ...q.cover, r: 1.778, fixed: true, alt: "" }).replace("<figure", "<figure").replace(/\n\s*/g, "")}
            <h3>${q.name}</h3>
            <p>${q.tagline}</p>
            <ul class="pills">${(q.chapters || []).map((c) => `<li><span class="pill pill--${PILLARS[c.pillar].cls}">${PILLARS[c.pillar].label}</span></li>`).join("")}</ul>
            <a class="cover" href="/work/${q.slug}/" aria-label="${esc(q.name.replace(/<[^>]+>/g, ""))} case study"></a>
          </article>`).join("\n")}
        </div>
      </div>
    </div>
  </section>

  <section class="card cta">
    <div class="inner">
      <h2>What is your winning soundtrack?</h2>
      <a class="btn" href="https://cromaticstudios.com/contact/" target="_blank" rel="noopener">We can bring the mixtape</a>
    </div>
  </section>

</main>

<script>${STEAM_JS}
// hero parallax: the first image drifts a little slower than the page
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const media=[...document.querySelectorAll('.hero-media .frame>img,.hero-media .frame>video')];
  if(!media.length)return;
  let raf=0;
  const run=()=>{raf=0;media.forEach(m=>{const f=m.parentElement.getBoundingClientRect();if(f.bottom<0||f.top>innerHeight)return;const k=(f.top+f.height/2-innerHeight/2)/innerHeight;m.style.setProperty('--py',(Math.max(-1,Math.min(1,k))*-f.height*.035).toFixed(1)+'px')})};
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(run)},{passive:true});
  addEventListener('resize',run);run();
})();
// rails: a vertical wheel or trackpad gesture over a rail scrolls it sideways until it reaches an end
document.querySelectorAll('.track').forEach(t=>{
  t.addEventListener('wheel',e=>{
    if(e.ctrlKey||Math.abs(e.deltaX)>=Math.abs(e.deltaY))return;
    const max=t.scrollWidth-t.clientWidth;
    if(max<=1)return;
    const d=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?t.clientWidth:1);
    if((d>0&&t.scrollLeft>=max-1)||(d<0&&t.scrollLeft<=1))return;
    e.preventDefault();
    t.style.scrollSnapType='none';clearTimeout(t._ws);t._ws=setTimeout(()=>{t.style.scrollSnapType=''},220);
    t.scrollLeft=Math.max(0,Math.min(max,t.scrollLeft+d));
  },{passive:false});
});
// embedded in the drive: keep links between case studies inside the frame
if(document.documentElement.classList.contains('embed'))document.querySelectorAll('a[href^="/work/"]').forEach(a=>{a.href=a.getAttribute('href')+'?embed=1'});
<\/script>
</body>
</html>
`);
  return h.join("");
}
// Steam's own page, for the related rails
const STEAM = { slug: "steam", name: "Steam", tagline: "Refreshing a pioneer brand for its community.", cover: { img: "cs:2025/06/Steam-Cromaticstudios-1.jpg" }, chapters: [{ pillar: "brand" }, { pillar: "marketing" }, { pillar: "product" }] };
DIMS["cs:2025/06/Steam-Cromaticstudios-1.jpg"] ||= [704, 600, 0];

const only = process.argv[2];
for (const P of PAGES) {
  if (only && P.slug !== only) continue;
  const html = page(P, PAGES);
  writeFileSync(join(here, "..", `${P.slug}.html`), html);
  console.log(`site/cases/${P.slug}.html ${(html.length / 1024).toFixed(0)} KB`);
}
