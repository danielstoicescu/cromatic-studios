// r131 (SEO + AI audit): one pass over every generated page, so the 36 pages carry the same head,
// the same schema.org graph and the same machine-readable text, whichever generator wrote them
// (site/render.mjs, site/cases/src/gen.mjs, or the Steam page lifted from src/app.js).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { STUDIO, studioNode, websiteNode, withStudio } from "./seo.mjs";

// search titles: what the page is about, in the words people search with (the H1 stays creative)
export const FAVICON_SPIN = `<script>/* the favicon: the yellow Cromatic cup, spinning as in the intro (24 frames; still when motion is reduced) */(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var go=function(){var im=new Image();im.onload=function(){var c=document.createElement("canvas");c.width=c.height=64;var x=c.getContext("2d"),f=[];for(var k=0;k<24;k++){x.clearRect(0,0,64,64);x.drawImage(im,k*64,0,64,64,0,0,64,64);f.push(c.toDataURL("image/png"))}var ls=[].slice.call(document.querySelectorAll('link[rel~="icon"]'));ls.forEach(function(l,j){if(j)l.remove()});var l=ls[0]||document.head.appendChild(document.createElement("link"));l.rel="icon";l.type="image/png";l.removeAttribute("sizes");var i=0;setInterval(function(){l.href=f[i=(i+1)%24]},94)};im.src="/favicon-spin.png"};if(document.readyState==="complete")setTimeout(go,800);else addEventListener("load",function(){setTimeout(go,800)})}catch(e){}})();</script>`;

// r136 (N30): the box a sound button lands in is positioned from the first paint (CSS), not when the script adds it
export const VIDEO_SOUND = `<style>:where(figure,div):has(> video[muted]:not([controls])){position:relative}.vs-btn{position:absolute;right:10px;bottom:10px;z-index:5;display:inline-flex;align-items:center;gap:6px;padding:8px 12px 8px 10px;border:1.5px solid #0d0c09;border-radius:999px;background:#fff;color:#0d0c09;font:800 13px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 0 #0d0c09;opacity:.92}.vs-btn:hover{opacity:1;background:#FED012}.vs-btn[aria-pressed="true"]{background:#FED012}.vs-btn svg{width:16px;height:16px}/* r138d: a film without a soundtrack keeps its button hidden */.vs-btn[hidden]{display:none!important}</style>
<script>/* films and reels play silently until you ask: a sound button on every film that has a soundtrack (beta 3.46 r215: "Sunet" on the Romanian pages) */(function(){var SND=(document.documentElement.lang||"").slice(0,2)==="ro"?"Sunet":"Sound";var ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>',OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6M22 9l-5 6"/></svg>';var all=[];function hasAudio(v){return v.mozHasAudio||(v.webkitAudioDecodedByteCount||0)>0||(v.audioTracks&&v.audioTracks.length>0)}function add(v){if(v.dataset.vs||v.controls)return;var host=v.parentElement;if(!host)return;v.dataset.vs="1";var b=document.createElement("button");b.type="button";b.className="vs-btn";b.setAttribute("aria-pressed","false");b.innerHTML=OFF+"<span>"+SND+"</span>";b.hidden=true;if(getComputedStyle(host).position==="static")host.style.position="relative";host.appendChild(b);all.push([v,b]);var check=function(){if(hasAudio(v))b.hidden=false};v.addEventListener("playing",function(){setTimeout(check,900);setTimeout(check,2500)});b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var on=v.muted;all.forEach(function(p){if(p[0]!==v){p[0].muted=true;p[1].setAttribute("aria-pressed","false");p[1].innerHTML=OFF+"<span>"+SND+"</span>"}});v.muted=!on;if(on){v.volume=1;v.play().catch(function(){})}b.setAttribute("aria-pressed",String(on));b.innerHTML=(on?ON:OFF)+"<span>"+SND+"</span>"})}function scan(){document.querySelectorAll("video[muted],video").forEach(function(v){if(v.muted||v.hasAttribute("muted"))add(v)})}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",scan);else scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true})})();</script>`;

export const WORK_TITLES = {
  "two-minutes": "Two Minutes: coffee brand, packaging & film",
  "oma-coffee": "OMA Coffee Brașov: specialty coffee branding",
  "venevo": "Venevo: fintech brand identity & website",
  "witanalytica": "Witanalytica: business intelligence brand identity",
  "sip-coffee-wine": "Sip Coffee & Wine: café identity & social launch",
  "pain-plaisir": "Pain Plaisir: bakery film, photo & product design",
  "yoshi-izakaya": "Yoshi Izakaya: restaurant content & social",
  "artisan-coffee-gear": "Artisan Coffee Gear: brand universe & webshop",
  "slow-coffee-festival": "Slow Coffee Festival: festival branding since 2021",
  "casa-berero": "Berero: craft beer labels & merch",
  "steam": "Steam Coffee Shop: rebranding & growth",
  "craft-coffee": "Craft Coffee: coffee equipment brand & webshop",
  "kompus": "Kómpus: coffee shop brand identity",
  "arca-resort": "ARCA Resort: caviar packaging & van livery",
  "antila": "Antila: charcuterie brand identity & packaging",
  "unde": "UNDÉ: grocery store branding & signage",
  "patiline": "Patiline: bakery rebrand, website & photography",
  "bepco": "Bepco: energy company brand & digital",
  "investimental": "Investimental: retail broker UX & UI design",
  "infinity-capital": "Infinity Capital: investment brand & website",
  "assetto": "Assetto: fintech product & brand design",
  "longshield": "Longshield: investment group brand & website",
  "esd": "ESD: electronics service rebranding & website",
  "unchain-festival": "Unchain Festival: fintech festival brand & website",
  "techventures-bank": "Techventures Bank: bank rebranding & website",
  "clinica-sante": "Clinica Sante: TV ads for a medical lab network",
  "the-aesthetic-court": "The Aesthetic Court: medical congress website",
  "toskani-med": "Toskani MED: aesthetic medicine brand & packaging",
  "litorsal": "Litorsal: billboards & posters for an electrolyte brand",
  "lacalut": "Lacalut White & Repair: Smart TV ads & motion",
  "maximag": "Maximag Bisglicinat: Smart TV ads & motion",
  "aspasia": "Aspasia Collagen Beauty: one-page product website",
  "bonilash": "Bonilash: product website for lash and brow serums",
  "glucopil": "Glucopil: one-page product website, blood sugar",
  "gripovit": "Gripovit: one-page product website, colds and flu",
  "lacium": "Lacium: one-page product website for a probiotic",
  "optisomn": "Optisomn: one-page product website, sleep",
  "routine-paris": "Routine Paris: daily ritual brand identity",
  "help-4-brain": "Help4Brain: pharma product & marketing",
  "altius": "Altius: medical brand & digital",
  "elithia": "Elithia: women's health clinic brand & website",
  "sticker-republic": "Sticker Republic: sticker reels & content",
  "printoteca": "Printoteca: print-on-demand reels & content",
  "eliade-18": "Eliade 18: our studio floor in Eliade Tower",
  "rdw-2023": "Romanian Design Week 2023: our AI pop-up studio"
};

// meta descriptions where the page's own lead is too thin for a search result
export const WORK_DESCS = {
  "slow-coffee-festival": "Slow Coffee Festival: the brand universe of Romania's biggest coffee community, upgraded every edition since 2021. Posters, merch and digital by Cromatic Studios.",
  "clinica-sante": "Clinica Sante: TV ads and brand work for a Romanian network of medical laboratories. Recommended by doctors, signed off by patients. By Cromatic Studios.",
  // r136 (N33): written for the result page (whole sentences, under 155 characters), where the lead ran longer
  "antila": "Antila: a 100% Romanian charcuterie brand with a bold black oval wordmark, funny characters and colour-coded packaging. By Cromatic Studios, Bucharest.",
  "artisan-coffee-gear": "Artisan Coffee Gear: brand strategy, identity, letterform pattern, technical illustration, packaging and webshop for coffee gear. By Cromatic Studios.",
  "craft-coffee": "Craft Coffee: identity, packaging, uniforms, merch and webshop for Romania's La Marzocco, Mazzer, PuQPress and Fellow distributor. By Cromatic Studios.",
  "eliade-18": "Eliade 18: the Cromatic Studios floor in Eliade Tower, Bucharest, from 2019. The open studio, the walls we drew on and the long table where work happens.",
  "oma-coffee": "OMA Coffee: a specialty coffee shop in Brașov, at the foot of the mountains, with passionate baristas and a brand as warm as a cup. By Cromatic Studios.",
  "pain-plaisir": "Pain Plaisir: product branding for the Anemone pastry, packaging, stickers, in-store visuals, photos and a Christmas campaign for a Bucharest bakery.",
  "unde": "UNDÉ, ARCA's grocery stores: a hand-drawn basket, a warm handwritten wordmark and three formats, Market, Store and Concept, each in its own colour.",
  "arca-resort": "ARCA Resort: brand architecture, identity, packaging, signage and website for a resort in Blăgești, Bacău, built around its own ponds and products.",
  "casa-berero": "Berero: brand identity, can labels for COMM lager and UNITY IPA, merch, posters and B2B presentations for a craft beer brand and its house, Casa Berero.",
  "elithia": "Elithia: brand strategy, identity, website and social content for a Bucharest women's health clinic founded by internationally experienced gynaecologists.",
  "routine-paris": "Routine Paris: brand strategy, the first perfume campaign, social launch and e-shop for a perfume and cosmetics boutique going from Bucharest to Paris.",
  "investimental": "Investimental: UX research, design systems, a web trading platform and a native mobile app for a retail broker, in twelve weeks. By Cromatic Studios.",
  "venevo": "Venevo: brand positioning, a dynamic logo with fourteen letter alternatives, brand guidelines, website and key visuals for a fractional investing platform."
};

export const SAME_AS = [
  "https://www.instagram.com/cromatic.studios/",
  "https://www.facebook.com/CromaticStudios",
  "https://www.behance.net/cromaticstudios",
  "https://www.linkedin.com/company/cromatic-studios",
  "https://clutch.co/profile/cromatic-studios"
];

const decode = (t) => String(t).replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;/g, "’").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n));
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

// r136 (N33): a description ends where a sentence ends, within 155 characters (what Google shows): the longest run
// of whole sentences that fits. When not even the first sentence fits (or what fits is too thin to describe the
// page), it is cut at its last clause and closed with a full stop, and the build names the page, so it gets a
// hand-written one (WORK_DESCS, or a shorter lead at the source). Never "…".
export const CLIPPED = [];
export function clip(t, max = 155, where = "") {
  t = decode(t).replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const ends = [...t.matchAll(/[.!?](?=\s|$)/g)].map((m) => m.index + 1).filter((i) => i <= max);
  if (ends.length && ends[ends.length - 1] >= 70) return t.slice(0, ends[ends.length - 1]);
  const cut = t.slice(0, max - 1);
  const k = Math.max(cut.lastIndexOf(", "), cut.lastIndexOf(": "), cut.lastIndexOf("; "), cut.lastIndexOf(" — "));
  if (where !== null) CLIPPED.push(where || t.slice(0, 40)); // (null: a draft the page pass checks again)
  return (k > max * 0.5 ? cut.slice(0, k) : cut.slice(0, cut.lastIndexOf(" "))).replace(/[,;:·—-]+$/, "") + ".";
}

// readable text of a page (markdown-ish): headings, paragraphs, list items, captions, quotes.
// Feeds /llms-full.txt and the per-page lastmod (a page is "modified" when its words change).
export function pageText(html) {
  let b = html.slice(html.indexOf("<body"));
  b = b.replace(/<(script|style|noscript|svg|template|button)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(nav|footer)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<a class="(?:cs-back|skip)"[\s\S]*?<\/a>/g, " ");
  b = b.replace(/<h1\b[^>]*>/gi, "\n\n# ").replace(/<h2\b[^>]*>/gi, "\n\n## ").replace(/<h3\b[^>]*>/gi, "\n\n### ").replace(/<h4\b[^>]*>/gi, "\n\n#### ")
    .replace(/<\/h[1-6]>/gi, "\n").replace(/<li\b[^>]*>/gi, "\n- ").replace(/<(p|figcaption|blockquote|dt|dd|summary|tr)\b[^>]*>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<img\b[^>]*\balt="([^"]+)"[^>]*>/gi, (m, a) => `\n[Image: ${a}]\n`)
    .replace(/<[^>]+>/g, " ");
  return decode(b).split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).filter((l, i, a) => l && !(l === a[i - 1]))
    .join("\n").replace(/\n(#+ )/g, "\n\n$1").replace(/(#+ [^\n]*)\n/g, "$1\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

// per-page last modified date: kept in build/lastmod.json, bumped only when the page's words change
// r139c (audit N47): with git at hand (a local build), the date is the last commit of the page's own source file
// (site/cases/<slug>.html, a canvas folder, /onboarding): `src` = { files, own }. A page made from a shared file
// (site/data.mjs, site/hubs.mjs, site/render.mjs) keeps its date while its words stay the same, and takes that file's
// last commit when they change. Uncommitted sources count as today when the words changed. Without git (the Docker
// build has no .git), the dates written to build/lastmod.json by the last local build are used, as before.
export function lastmodStore(file, today, root) {
  let db = {};
  try { db = JSON.parse(readFileSync(file, "utf8")); } catch {}
  const used = {};
  let git = false, dirty = new Set();
  const cache = new Map();
  if (root) {
    try {
      const st = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      dirty = new Set(st.split("\n").filter(Boolean).map((l) => l.slice(3).replace(/^.* -> /, "").replace(/^"|"$/g, "")));
      git = true;
    } catch {}
  }
  const isDirty = (files) => files.some((f) => [...dirty].some((d) => d === f || d.startsWith(f.replace(/\/?$/, "/"))));
  const commitDate = (files) => {
    const k = files.join("|");
    if (!cache.has(k)) { let d = null; try { d = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...files], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null; } catch {} cache.set(k, d); }
    return cache.get(k);
  };
  return {
    get(path, text, src) {
      const h = createHash("sha1").update(text).digest("hex").slice(0, 12);
      const prev = db[path], same = !!prev && prev.h === h;
      let d = same ? prev.d : today;
      if (git && src && src.files && src.files.length && !isDirty(src.files)) {
        const g = commitDate(src.files);
        if (g) d = src.own ? g : (same ? prev.d : g);
      }
      if (d > today) d = today;
      used[path] = { h, d };
      return d;
    },
    save() { try { writeFileSync(file, JSON.stringify(used, null, 1) + "\n"); } catch {} }
  };
}


/**
 * Normalise one page. `info` = { path, SITE, project, media (url -> {w,h}), lastmod, wp (url -> local) }.
 * Returns { html, text, title, desc, image, images }.
 */
export function seoPage(html, { path, SITE, project, media, lastmod, wp, dg }) {
  const url = `${SITE}${path}`;
  const work = /^\/work\/([\w-]+)\/$/.exec(path)?.[1];
  // 1. images of the studio's own WordPress, served from here (compressed copies in site/media/wp)
  if (wp) html = html.replace(/https:\/\/cromaticstudios\.com\/wp-content\/uploads\/[^"' )]+\.(?:jpe?g|png)/g, (u) => wp(u) || u);
  // 2. every <img> of ours gets its intrinsic size (no layout shift while the page loads)
  html = html.replace(/<img\b(?![^>]*\bwidth=)([^>]*?)\bsrc="(\/assets\/[^"]+)"([^>]*)>/g, (m, a, src, b) => {
    const d = media(src);
    return d && d.w ? `<img${a}src="${src}" width="${d.w}" height="${d.h}"${b}>` : m;
  });
  // r136 (N41): the gallery titles of the case pages (pills in a .rail-head) sat as H4 under an H2: they become H3,
  // with the same look (their rules follow the tag; the H3 keeps the H4's size, weight and letter spacing)
  if (/<div class="rail-head">\s*<h4>/.test(html)) {
    html = html.replace(/(<div class="rail-head">\s*)<h4>([\s\S]*?)<\/h4>/g, "$1<h3>$2</h3>")
      .replace(/(\.rail-head(?::first-child)?) h4\b/g, "$1 h3")
      .replace("</head>", "<style>.rail-head>h3{font-size:1em;font-weight:700;letter-spacing:normal}</style>\n</head>");
  }
  // r136 (N30): every film of ours gets its intrinsic size too (width/height set its aspect ratio before it loads)
  html = html.replace(/<video\b(?![^>]*\bwidth=)([^>]*?)\b(data-src|src)="(\/assets\/[^"]+\.(?:mp4|webm))"([^>]*)>/g, (m, a, at, src, b) => {
    const d = media(src);
    return d && d.w ? `<video${a}${at}="${src}" width="${d.w}" height="${d.h}"${b}>` : m;
  });
  // 3. films below the first one start loading only when they scroll into view (the page's own
  //    IntersectionObserver plays them); before, every autoplay film downloaded on page load
  if (/IntersectionObserver/.test(html) && /querySelectorAll\('video(?::not\(\[data-manual\]\))?'\)/.test(html)) {
    // r139a: the first film too, wherever the page's observer can be told to wait for the page: it starts once the page
    // has loaded. As an autoplay film it was fetched with the HTML (Steam: ~1 MB plus a 685 KB poster on a phone before
    // the title had painted, LCP 6.5 s on a slow 4G); its poster holds the frame until then (images.mjs)
    const IO_PLAY = "if(e.isIntersecting){e.target.play().catch(()=>{});}else{e.target.pause();}";
    const late = html.includes(IO_PLAY);
    if (late) html = html.split(IO_PLAY).join("const v=e.target;v._vis=e.isIntersecting;if(e.isIntersecting){if(document.readyState==='complete')v.play().catch(()=>{});else addEventListener('load',()=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>{if(v._vis)v.play().catch(()=>{})},60))),{once:true});}else{v.pause();}");
    let k = 0;
    html = html.replace(/<video\b([^>]*)>/g, (m, a) => {
      if (!/\bautoplay\b/.test(a) || (k++ === 0 && (!late || /\bdata-manual\b/.test(a)))) return m;
      return `<video${a.replace(/\s*\bautoplay\b/, "").replace(/\bpreload="[^"]*"/, 'preload="none"')}${/preload=/.test(a) ? "" : ' preload="none"'}>`;
    });
  }

  // 4. Darker Grotesque from our own domain, the Latin file preloaded (Google's late swap moved the hero: CLS)
  if (dg && dg.latin) html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Darker\+Grotesque[^"]*" rel="stylesheet">/, () =>
    `<link rel="preload" href="${dg.latin}" as="font" type="font/woff2" crossorigin>\n<style>@font-face{font-family:"Darker Grotesque";font-style:normal;font-weight:300 900;font-display:swap;src:url(${dg.latin}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}${dg["latin-ext"] ? `@font-face{font-family:"Darker Grotesque";font-style:normal;font-weight:300 900;font-display:swap;src:url(${dg["latin-ext"]}) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}` : ""}@font-face{font-family:"Darker Grotesque Fallback";src:local("Arial"),local("Helvetica"),local("Liberation Sans");size-adjust:79.8%;ascent-override:132.8%;descent-override:37.1%;line-gap-override:0%}</style>`)
      // until the face arrives, Arial scaled to its width and line metrics (measured from the font files) holds the layout still
      .replace(/--font:"Darker Grotesque",/g, dg.cs ? '--font:CromaticSans,"Darker Grotesque","Darker Grotesque Fallback",' : '--font:"Darker Grotesque","Darker Grotesque Fallback",')
      .replace("</head>", dg.cs ? `<style>${dg.cs}</style>\n</head>` : "</head>")
      .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n?(?![\s\S]*fonts\.googleapis\.com\/css)/, "");
  const headEnd = html.indexOf("</head>");
  let head = html.slice(0, headEnd), body = html.slice(headEnd);
  const has = (re) => re.test(head);
  const get = (re) => re.exec(head)?.[1];

  // titles: a search title for the work pages; one separator everywhere
  let title = decode(get(/<title>([^<]*)<\/title>/) || "");
  if (work && WORK_TITLES[work]) title = `${WORK_TITLES[work]} · Cromatic Studios`;
  title = title.replace(/\s+—\s+Cromatic Studios$/, " · Cromatic Studios");
  head = head.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  const fullDesc = decode((work && WORK_DESCS[work]) || get(/<meta name="description" content="([^"]*)"/) || project?.desc || STUDIO.description).replace(/\s+/g, " ").trim();
  let desc = clip(fullDesc, 155, path);
  head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
  if (!has(/name="description"/)) head += `\n<meta name="description" content="${esc(desc)}">`;
  let image = get(/<meta property="og:image" content="([^"]*)"/) || `${SITE}/og.jpg`;
  if (image.startsWith("/")) image = SITE + image;
  const imgDims = media(image.replace(SITE, ""));

  const add = [];
  if (!has(/name="robots"/)) add.push(`<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`);
  if (!has(/name="theme-color"/)) add.push(`<meta name="theme-color" content="#FED012">`);
  if (!has(/rel="canonical"/)) add.push(`<link rel="canonical" href="${url}">`);
  // social cards: same title and description as the search result
  head = head.replace(/<meta property="og:(title|description|image:alt|image:width|image:height|site_name|locale|url|type)" content="[^"]*">\n?/g, "")
    .replace(/<meta name="twitter:(card|title|description|image)" content="[^"]*">\n?/g, "");
  add.push(`<meta property="og:type" content="${work ? "article" : "website"}">`,
    `<meta property="og:site_name" content="Cromatic Studios">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${url}">`);
  if (!has(/property="og:image"/)) add.push(`<meta property="og:image" content="${image}">`);
  if (imgDims && imgDims.w) add.push(`<meta property="og:image:width" content="${imgDims.w}">`, `<meta property="og:image:height" content="${imgDims.h}">`);
  else if (image === `${SITE}/og.jpg`) add.push(`<meta property="og:image:width" content="1200">`, `<meta property="og:image:height" content="630">`);
  add.push(`<meta property="og:image:alt" content="${esc(title)}">`);
  if (work) add.push(`<meta property="article:publisher" content="https://www.facebook.com/CromaticStudios">`, `<meta property="article:modified_time" content="${lastmod}">`);
  add.push(`<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${esc(title)}">`, `<meta name="twitter:description" content="${esc(desc)}">`, `<meta name="twitter:image" content="${image}">`);
  if (!has(/rel="icon" href="\/icon\.svg"/)) add.push(`<link rel="icon" href="/icon.svg" type="image/svg+xml">`);
  if (!has(/rel="apple-touch-icon"/)) add.push(`<link rel="apple-touch-icon" href="/apple-touch-icon.png">`);
  if (!has(/rel="manifest"/)) add.push(`<link rel="manifest" href="/site.webmanifest">`);
  add.push(`<link rel="alternate" type="text/plain" title="Cromatic Studios for AI assistants" href="${SITE}/llms.txt">`);
  head = head.replace(/<link rel="alternate" type="text\/plain"[^>]*>\n?/g, "");

  // schema.org: the work pages get one complete graph (the studio, the page, the case study, the trail)
  if (work) {
    head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, "");
    const h1 = decode((/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(body)?.[1] || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const name = project?.name || title.split(":")[0];
    const own = body.split(/<section class="card related"|<section class="c-end"/)[0];
    const images = [...new Set([image, ...[...own.matchAll(/<img\b[^>]*\bsrc="(\/assets\/[^"]+\.(?:jpe?g|png|webp))"/g)].map((m) => SITE + m[1])])].slice(0, 8);
    const cw = {
      "@type": "CreativeWork", "@id": `${url}#work`, name: `${name}: case study`, headline: h1 || title, description: desc,
      url, mainEntityOfPage: url, image: images, inLanguage: "en", dateModified: lastmod,
      genre: project?.cat, keywords: project?.cat ? project.cat.split(" · ").join(", ") : undefined,
      creator: { "@id": `${SITE}/#studio` }, publisher: { "@id": `${SITE}/#studio` },
      about: project ? { "@type": "Organization", name: project.name } : undefined
    };
    head += "\n" + ld({ "@context": "https://schema.org", "@graph": [
      studioNode(SITE, SAME_AS), websiteNode(SITE),
      { "@type": "WebPage", "@id": url, url, name: title, description: desc, isPartOf: { "@id": `${SITE}/#website` }, primaryImageOfPage: image, mainEntity: { "@id": `${url}#work` }, breadcrumb: { "@id": `${url}#breadcrumb` }, dateModified: lastmod, inLanguage: "en" },
      cw,
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cromatic Studios", item: `${SITE}/site/` },
        { "@type": "ListItem", position: 2, name: "Work", item: `${SITE}/site/#work` },
        { "@type": "ListItem", position: 3, name, item: url }
      ] }
    ] });
  }
  // r136 (N28): whatever generator wrote the page, the studio and the website are described in full on it
  const haveLd = new Set();
  head = head.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, a, j, b) => {
    try { return a + JSON.stringify(withStudio(JSON.parse(j), SITE, SAME_AS, haveLd)).replace(/</g, "\\u003c") + b; } catch { return m; }
  });
  if (!head.includes("favicon-spin.png")) add.push(FAVICON_SPIN);
  head = head.replace(/\n?$/, "\n" + add.join("\n") + "\n");
  // Cloudflare's email obfuscation turns the address into "[email protected]" for every reader that
  // runs no script (AI assistants, many crawlers) and adds a render-blocking script: opt the page out
  body = body.replace(/(<body\b[^>]*>)/, "$1<!--email_off-->").replace(/<\/body>/, "<!--/email_off--></body>");
  if (/<video\b/.test(body)) body = body.replace(/<\/body>/, VIDEO_SOUND + "\n</body>");
  html = head + body;
  const images = [...new Set([image, ...[...html.split(/<section class="card related"|<section class="c-end"/)[0].matchAll(/<img\b[^>]*\bsrc="(\/assets\/[^"]+\.(?:jpe?g|png|webp))"/g)].map((m) => SITE + m[1])])].slice(0, 20);
  return { html, title, desc, fullDesc, image, images };
}
