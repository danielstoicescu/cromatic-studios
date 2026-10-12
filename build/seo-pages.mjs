// r131 (SEO + AI audit): one pass over every generated page, so the 36 pages carry the same head,
// the same schema.org graph and the same machine-readable text, whichever generator wrote them
// (site/render.mjs, site/cases/src/gen.mjs, or the Steam page lifted from src/app.js).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { STUDIO } from "./seo.mjs";

// search titles: what the page is about, in the words people search with (the H1 stays creative)
export const FAVICON_SPIN = `<script>/* the favicon: the yellow Cromatic cup, spinning as in the intro (24 frames; still when motion is reduced) */(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var go=function(){var im=new Image();im.onload=function(){var c=document.createElement("canvas");c.width=c.height=64;var x=c.getContext("2d"),f=[];for(var k=0;k<24;k++){x.clearRect(0,0,64,64);x.drawImage(im,k*64,0,64,64,0,0,64,64);f.push(c.toDataURL("image/png"))}var ls=[].slice.call(document.querySelectorAll('link[rel~="icon"]'));ls.forEach(function(l,j){if(j)l.remove()});var l=ls[0]||document.head.appendChild(document.createElement("link"));l.rel="icon";l.type="image/png";l.removeAttribute("sizes");var i=0;setInterval(function(){l.href=f[i=(i+1)%24]},94)};im.src="/favicon-spin.png"};if(document.readyState==="complete")setTimeout(go,800);else addEventListener("load",function(){setTimeout(go,800)})}catch(e){}})();</script>`;

export const WORK_TITLES = {
  "two-minutes": "Two Minutes: coffee brand, packaging & film",
  "oma-coffee": "OMA Coffee Brașov: specialty coffee branding",
  "sip-coffee-wine": "Sip Coffee & Wine: café identity & social launch",
  "pain-plaisir": "Pain Plaisir: bakery film, photo & product design",
  "yoshi-izakaya": "Yoshi Izakaya: restaurant content & social",
  "artisan-coffee-gear": "Artisan Coffee Gear: brand universe & webshop",
  "slow-coffee-festival": "Slow Coffee Festival: festival branding since 2021",
  "casa-berero": "Casa Berero: craft beer labels & merch",
  "steam": "Steam Coffee Shop: rebranding & growth",
  "craft-coffee": "Craft Coffee: coffee equipment brand & webshop",
  "kompus": "Kómpus: coffee shop brand identity",
  "arca-resort": "ARCA Resort: caviar packaging & van livery",
  "antila": "Antila: charcuterie brand identity & packaging",
  "unde": "UNDÉ: grocery store branding & signage",
  "patiline": "Patiline: bakery rebrand, website & photography",
  "bepco": "Bepco: energy company brand & digital",
  "investimental": "Investimental: retail broker UX & UI design",
  "infinity-capital": "Infinity Capital: investment brand & app",
  "assetto": "Assetto: fintech product & brand design",
  "longshield": "Longshield: investment group brand & website",
  "esd": "ESD: electronics service rebranding & website",
  "unchain-festival": "Unchain Festival: fintech festival brand & website",
  "techventures-bank": "Techventures Bank: bank rebranding & website",
  "clinica-sante": "Clinica Sante: TV ads for a medical lab network",
  "the-aesthetic-court": "The Aesthetic Court: medical congress website",
  "toskani-med": "Toskani MED: aesthetic medicine brand & packaging",
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
  "clinica-sante": "Clinica Sante: TV ads and brand work for a Romanian network of medical laboratories. Recommended by doctors, signed off by patients. By Cromatic Studios."
};

export const SAME_AS = [
  "https://cromaticstudios.com/",
  "https://www.instagram.com/cromatic.studios/",
  "https://www.facebook.com/CromaticStudios",
  "https://www.behance.net/cromaticstudios",
  "https://www.linkedin.com/company/cromatic-studios",
  "https://clutch.co/profile/cromatic-studios"
];

const decode = (t) => String(t).replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;/g, "’").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n));
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

// a description that ends where a sentence (or at least a word) ends, never mid-word
export function clip(t, max = 160) {
  t = decode(t).replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const dot = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (dot > max * 0.55) return cut.slice(0, dot + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:·—-]+$/, "") + "…";
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
export function lastmodStore(file, today) {
  let db = {};
  try { db = JSON.parse(readFileSync(file, "utf8")); } catch {}
  const used = {};
  return {
    get(path, text) {
      const h = createHash("sha1").update(text).digest("hex").slice(0, 12);
      const prev = db[path];
      used[path] = prev && prev.h === h ? prev : { h, d: today };
      return used[path].d;
    },
    save() { try { writeFileSync(file, JSON.stringify(used, null, 1) + "\n"); } catch {} }
  };
}

const orgRef = (SITE) => ({
  "@type": ["Organization", "ProfessionalService"], "@id": `${SITE}/#studio`, name: STUDIO.name, url: `${SITE}/`,
  logo: `${SITE}/icon-512.png`, email: STUDIO.email, telephone: STUDIO.phone, sameAs: SAME_AS, foundingDate: STUDIO.founded,
  founder: { "@type": "Person", "@id": `${SITE}/#daniel`, name: STUDIO.founder.name, jobTitle: STUDIO.founder.jobTitle },
  address: { "@type": "PostalAddress", streetAddress: STUDIO.street, postalCode: STUDIO.postalCode, addressLocality: "Bucharest", addressRegion: "București", addressCountry: STUDIO.country }
});
const websiteRef = (SITE) => ({ "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "Cromatic Studios", publisher: { "@id": `${SITE}/#studio` }, inLanguage: "en" });

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
  // 3. films below the first one start loading only when they scroll into view (the page's own
  //    IntersectionObserver plays them); before, every autoplay film downloaded on page load
  if (/IntersectionObserver/.test(html) && /querySelectorAll\('video(?::not\(\[data-manual\]\))?'\)/.test(html)) {
    let k = 0;
    html = html.replace(/<video\b([^>]*)>/g, (m, a) => {
      if (!/\bautoplay\b/.test(a) || k++ === 0) return m;
      return `<video${a.replace(/\s*\bautoplay\b/, "").replace(/\bpreload="[^"]*"/, 'preload="none"')}${/preload=/.test(a) ? "" : ' preload="none"'}>`;
    });
  }

  // 4. Darker Grotesque from our own domain, the Latin file preloaded (Google's late swap moved the hero: CLS)
  if (dg && dg.latin) html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Darker\+Grotesque[^"]*" rel="stylesheet">/, () =>
    `<link rel="preload" href="${dg.latin}" as="font" type="font/woff2" crossorigin>\n<style>@font-face{font-family:"Darker Grotesque";font-style:normal;font-weight:300 900;font-display:swap;src:url(${dg.latin}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}${dg["latin-ext"] ? `@font-face{font-family:"Darker Grotesque";font-style:normal;font-weight:300 900;font-display:swap;src:url(${dg["latin-ext"]}) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}` : ""}@font-face{font-family:"Darker Grotesque Fallback";src:local("Arial"),local("Helvetica"),local("Liberation Sans");size-adjust:79.8%;ascent-override:132.8%;descent-override:37.1%;line-gap-override:0%}</style>`)
      // until the face arrives, Arial scaled to its width and line metrics (measured from the font files) holds the layout still
      .replace(/--font:"Darker Grotesque",/g, '--font:"Darker Grotesque","Darker Grotesque Fallback",')
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
  let desc = clip(fullDesc);
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
      orgRef(SITE), websiteRef(SITE),
      { "@type": "WebPage", "@id": url, url, name: title, description: desc, isPartOf: { "@id": `${SITE}/#website` }, primaryImageOfPage: image, mainEntity: { "@id": `${url}#work` }, breadcrumb: { "@id": `${url}#breadcrumb` }, dateModified: lastmod, inLanguage: "en" },
      cw,
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cromatic Studios", item: `${SITE}/site/` },
        { "@type": "ListItem", position: 2, name: "Work", item: `${SITE}/site/#work` },
        { "@type": "ListItem", position: 3, name, item: url }
      ] }
    ] });
  }
  if (!head.includes("favicon-spin.png")) add.push(FAVICON_SPIN);
  head = head.replace(/\n?$/, "\n" + add.join("\n") + "\n");
  // Cloudflare's email obfuscation turns the address into "[email protected]" for every reader that
  // runs no script (AI assistants, many crawlers) and adds a render-blocking script: opt the page out
  body = body.replace(/(<body\b[^>]*>)/, "$1<!--email_off-->").replace(/<\/body>/, "<!--/email_off--></body>");
  html = head + body;
  const images = [...new Set([image, ...[...html.split(/<section class="card related"|<section class="c-end"/)[0].matchAll(/<img\b[^>]*\bsrc="(\/assets\/[^"]+\.(?:jpe?g|png|webp))"/g)].map((m) => SITE + m[1])])].slice(0, 20);
  return { html, title, desc, fullDesc, image, images };
}
