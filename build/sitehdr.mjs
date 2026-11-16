// r480b (Tudor, round-2 QA: "two header designs remain"): the pages that do not load the website's stylesheet (the
// case pages, the 404) wear the website's own header, not a look-alike. Its rules are lifted from the built site.css
// (every rule about .hdr, the logo, the nav, the language ring, the Drive button, the menu button and the phone menu,
// plus .skip), scoped under .hdr so they cannot touch the page around them, with the site's colour and type tokens set
// on .hdr itself. A case adds a breadcrumb line under it (Daniel 10 Nov: "logo + breadcrumb pe telefon").
// Home links are written /site/... (homemove.mjs turns them into /...; a bare / there means the city).

const KEEP = /\.(?:hdr|hdr-in|brand|nav|drive-btn|drive-mini|dk-host|dk|dk-roll|menu-btn|mnav|lang-sw|skip)(?![\w-])/;
const DROP = /\.(?:m-|mm-|pw|hc-|f5|ftr|czp|sv5|crt|cb-|rs-|road|cup)|#|\.js\b|html\.|\bbody\b|:root/;

// split "a,b:is(c,d)" on top-level commas
const splitSel = (s) => { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && !d) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()).filter(Boolean); };

function blocks(css) {
  const out = []; let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i); if (open < 0) break;
    const pre = css.slice(i, open).trim(); let d = 1, j = open + 1;
    while (j < css.length && d) { if (css[j] === "{") d++; else if (css[j] === "}") d--; j++; }
    out.push([pre, css.slice(open + 1, j - 1)]); i = j;
  }
  return out;
}

function lift(css, KEEP, DROP, scope) {
  let out = "";
  for (const [pre, body] of blocks(css)) {
    if (pre.startsWith("@media")) { const inner = lift(body, KEEP, DROP, scope); if (inner) out += `${pre}{${inner}}`; continue; }
    if (pre.startsWith("@keyframes dkRoll")) { out += `${pre}{${body}}`; continue; }
    if (pre.startsWith("@")) continue;
    const sels = splitSel(pre).filter((s) => KEEP.test(s) && !DROP.test(s));
    if (!sels.length) continue;
    const own = new RegExp(`^\\.${scope}(?![\\w-])`);
    const scoped = sels.map((s) => (own.test(s) || /^\.skip\b/.test(s) ? s : `.${scope} ${s}`));
    out += `${scoped.join(",")}{${body}}`;
  }
  return out;
}

export function makeSiteHeader({ siteCss, A }) {
  // the site's tokens (custom properties of its :root blocks), set on .hdr and .skip
  const vars = blocks(siteCss).filter(([p]) => p === ":root").map(([, b]) => b.split(";").filter((d) => d.trim().startsWith("--")).join(";")).join(";");
  const logo = A("logoLandscape"), r = A("m:drive-car/dacia-1300-roll.webp"), s = A("m:drive-car/dacia-1300-parked.webp");
  const DK = r && s ? `<span class="dk" aria-hidden="true"><i class="dk-roll" style="--dk-s:url(${s.src});--dk-r:url(${r.src})"></i></span>` : "";
  const css = `<link rel="stylesheet" href="/fonts.css"><style id="czh-css">.hdr,.skip{${vars}}
${lift(siteCss, KEEP, DROP, "hdr")}
.hdr{position:fixed;left:0;right:0;top:0;z-index:9998;font-family:var(--f,CromaticSans),"CromaticSans Fallback",system-ui,sans-serif;color:var(--ink);line-height:1.5}
.hdr .wrap{width:min(1280px,100% - 2 * clamp(16px,4vw,40px));margin-inline:auto}.hdr a{color:inherit}.hdr *{box-sizing:border-box}
.hdr .menu-btn{flex:0 0 auto}.hdr .mnav a{color:var(--ink)}
.czc{box-sizing:border-box;width:min(1280px,100% - 2 * clamp(16px,4vw,40px));margin:72px auto 0;padding:6px 0 0;font:500 12px/1.4 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:#57524a;display:flex;gap:8px;align-items:center;min-width:0}
.czc a{color:#0d0c09;text-decoration:underline;text-underline-offset:4px;display:inline-flex;align-items:center;justify-content:flex-start;min-height:44px;min-width:44px}.czc span[aria-current]{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
html:not(.embed) .page,html:not(.embed) main.sc{padding-top:8px!important}
html.cb-up .hdr{transform:translateY(calc(-100% - 2px));visibility:hidden;transition:transform .18s cubic-bezier(.4,0,1,1),visibility 0s .18s}
.hdr{transition:transform .18s cubic-bezier(.2,.7,.2,1),visibility 0s}.hdr:focus-within{transform:none!important;visibility:visible!important}
html.embed .hdr,html.embed .czc,html.embed .skip{display:none!important}
@media (prefers-reduced-motion:reduce){.hdr{transition:none!important}}</style>`;
  // hide on the way down, back on the way up (as the old case bar did); the phone menu opens and closes
  const js = `<script>(function(){var h=document.documentElement;if(h.classList.contains("embed"))return;var y=scrollY,q=0;function f(){q=0;var n=scrollY,d=n-y;var m=document.getElementById("mnav");if(m&&m.classList.contains("open"))return;if(n<90){h.classList.remove("cb-up");y=n;return}if(Math.abs(d)>8){h.classList.toggle("cb-up",d>0);y=n}}addEventListener("scroll",function(){if(!q)q=requestAnimationFrame(f)},{passive:true});var b=document.querySelector(".hdr .menu-btn"),m=document.getElementById("mnav");if(b&&m)b.addEventListener("click",function(){var o=m.classList.toggle("open");b.setAttribute("aria-expanded",o?"true":"false")})})();</script>`;
  const html = ({ lang, other, label, name, crumb, mainId = "main" }) => {
    const ro = lang === "ro", home = ro ? "/ro/" : "/site/";
    const L = ro ? { work: "Proiecte", svc: "Servicii", team: "Echipa", ct: "Contact", drive: "Condu prin orașul Cromatic", mini: "Condu", menu: "Meniu", main: "Principal", mob: "Mobil", skip: "Sari la conținut", crumbL: "Unde ești", title: "Proiectele noastre ca un oraș 3D al Bucureștiului, prin care conduci" }
      : { work: "Work", svc: "Services", team: "Team", ct: "Contact", drive: "Drive in the Cromatic City", mini: "Drive", menu: "Menu", main: "Main", mob: "Mobile", skip: "Skip to content", crumbL: "You are here", title: "Our work as a 3D city of Bucharest, to drive through" };
    const work = ro ? "/ro/proiecte/" : "/work/", team = ro ? "/ro/echipa/" : "/team/";
    const nav = `<a href="${work}">${L.work}</a><a href="${home}#services">${L.svc}</a><a href="${team}">${L.team}</a><a href="${home}#contact">${L.ct}</a>`;
    const lang2 = other ? `<a class="lang-sw" href="${other}" hreflang="${label.toLowerCase()}" lang="${label.toLowerCase()}" title="${name}">${label}</a>` : "";
    return `<a class="skip" href="#${mainId}">${L.skip}</a>
<header class="hdr">
  <div class="wrap hdr-in">
    <a class="brand" href="${home}">${logo ? `<img src="${logo.src}" alt="Cromatic Studios" width="${logo.w}" height="${logo.h}">` : "Cromatic Studios"}</a>
    <nav class="nav" aria-label="${L.main}">${nav}</nav>
    ${lang2}<a class="drive-btn dk-host" href="/city/" title="${L.title}">${DK}<span>${L.drive}</span></a>
    <a class="drive-mini dk-host" href="/city/" aria-label="${L.drive}">${DK}<span>${L.mini}</span></a>
    <button class="menu-btn" type="button" aria-label="${L.menu}" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
  </div>
  <nav id="mnav" class="mnav" aria-label="${L.mob}">${nav}<a class="drive-btn dk-host" href="/city/">${DK}<span>${L.drive}</span></a></nav>
</header>${crumb ? `\n<nav class="czc" aria-label="${L.crumbL}"><a href="${work}">${L.work}</a><span aria-hidden="true">/</span><span aria-current="page">${crumb}</span></nav>` : ""}`;
  };
  return { css, js, html };
}

// r480b (Tudor, UI 2: "two footers"): the cases end on the website's own footer too (the studio, the address and the
// way there, the links), its rules lifted the same way, scoped under .ftr; build/footer.mjs adds the strip inside it
const KEEP_F = /\.ftr[\w-]*(?![\w-])/;
const DROP_F = /\.(?:m-|mm-|pw|hc-|f5|czp|sv5)|#|\.js\b|html\.|\bbody\b|:root/;
export function makeSiteFooter({ siteCss }) {
  const vars = blocks(siteCss).filter(([p]) => p === ":root").map(([, b]) => b.split(";").filter((d) => d.trim().startsWith("--")).join(";")).join(";");
  return `<style id="czft-css">.ftr{${vars}}
${lift(siteCss, KEEP_F, DROP_F, "ftr")}
.ftr{font-family:var(--f,CromaticSans),"CromaticSans Fallback",system-ui,sans-serif;color:var(--ink);line-height:1.5}.ftr *{box-sizing:border-box}.ftr a{color:inherit}.ftr p{margin:0 0 8px}
.ftr .wrap{width:min(1280px,100% - 2 * clamp(16px,4vw,40px));margin-inline:auto}.ftr .mono{font-family:"JetBrains Mono",ui-monospace,monospace}
html.embed .ftr-in,html.embed .ftr-motto{display:none}</style>`;
}
