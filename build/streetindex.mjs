// r351 (Daniel, 28 Oct): direction A of the /site/ rebuild, "The Street Index" (refs/awwwards-research/brief.md §A,
// mockups refs/street-index-mockups/01-05), as a real page on BETA ONLY: /streetindex/ and /ro/streetindex/.
// Daniel: "the main emphasis must be on each brand's visuals, more important than the 3D of the city": every row leads
// with the brand's own cover and a mini gallery from its case page; the street still is a small focus-pull hint beside it.
// No real client addresses in the index (Daniel). Written after the pass over public/ like /prezentare/ (no footer, no
// cookie card, no GA4), never in PAGES (no sitemap, no llms.txt), noindex in the page; server.js answers 404 for these
// paths on every host that is not a beta host, so live never shows it, and nothing on the site links to it.
// Own layer: site/streetindex/si.css + si.js, inlined. Data: R.workStreets (the website's own listing) + the media of
// each built case page. The case pages get a dormant 1-line script: it opts into the View Transition only when the
// visitor clicked a row here (a sessionStorage flag this page alone sets), so they behave exactly as before otherwise.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { roPath } from "./i18n.mjs";
import { INDUSTRIES } from "../site/hubs.mjs";

export const SI_PATHS = ["/streetindex/", "/ro/streetindex/"];

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
export const STREET_SLUG = { A: "coffee-street", B: "fintech-boulevard", C: "medical-avenue", D: "the-shortest-shortcut" };

// the four filter chapters, read from each project's fields (data.mjs has no chapters[] yet, see brief §7.4)
export const CH = {
  dream: /strateg|position|naming|persona|brand universe|workshop/i,
  voice: /brand|identit|logo|label|visual|design/i,
  world: /web|site|app|packag|box|film|video|product|merch|print|sticker|ui\b|ux|3d|label|tv/i,
  crowd: /content|social|growth|campaign|communicat|photo|ads|motion|smart tv|event|festival|pr\b/i
};
export const chaptersOf = (p) => Object.keys(CH).filter((k) => CH[k].test(`${p.cat} ${p.desc}`));

// the media of each built case page: its hero first, then its pictures, in page order (logos and small pictures out).
// Shared with the header's mega menu (build/megamenu.mjs), which reads the same case pages before the image pass
export const caseGallery = (pub, page, max = 6) => {
  const f = join(pub, "work", page, "index.html");
  if (!existsSync(f)) return [];
  const html = readFileSync(f, "utf8").split('class="c2-next"')[0], out = []; // not the "Next case" picture at the end
  for (const tag of html.match(/<img\b[^>]*>/g) || []) {
    const src = (/data-lz-src="([^"]+)"/.exec(tag) || /\ssrc="(\/[^"]+)"/.exec(tag) || [])[1];
    const w = Number((/\swidth="(\d+)"/.exec(tag) || [])[1] || 0);
    if (!src || src.startsWith("data:") || /alt="Cromatic Studios"/.test(tag) || /\.svg$/.test(src) || (w && w < 360)) continue;
    if (!out.includes(src)) out.push(src);
    if (out.length >= max) break;
  }
  return out;
};

const T = {
  en: {
    lang: "en", path: "/streetindex/", alt: "/ro/streetindex/", home: "/site/",
    title: "Street Index: branding work from Bucharest · Cromatic Studios",
    desc: (n) => `${n} case studies on 4 streets: specialty coffee, banks and fintech, clinics and pharma, print. Brand strategy, identity, websites, film and content by Cromatic Studios, Bucharest.`,
    listName: "Cromatic Studios projects, street by street",
    nav: [["#index", "Work"], ["/site/#studio", "Studio"], ["/site/#services", "Services"], ["/site/#contact", "Contact"]],
    wheel: "Take the wheel", eyebrow: "Cromatic Studios · Bucharest · since 2014",
    morph: "Someone could remember a", words: ["place", "facade", "brand"], h1a: "Nobody remembers a thumbnail.",
    sub: (n) => `An independent studio for brand strategy, identity, websites, film and content. ${n} case studies on 4 streets of a city we built for them.`,
    read: "Read the work", drive: "Drive in the Cromatic City", pause: "Pause the film", play: "Play the film",
    show: "Show me", on: "on", all: "all the work", every: "every street",
    chapters: { dream: "brand strategy", voice: "identity", world: "websites, apps, packaging, film", crowd: "content and growth" },
    search: "a client, a field, a street", searchLabel: "Search the work", clear: "Clear",
    count: (n, s, t) => `<b>${n} ${n === 1 ? "place" : "places"}</b> on ${s} ${s === 1 ? "street" : "streets"}, of ${t}`,
    view: ["Index", "Covers"], viewLabel: "View",
    places: (n) => `${n} ${n === 1 ? "place" : "places"}`,
    hint: "Point at a name to see the work", still: "Bird's-eye",
    open: "Open the case", onmap: "On the map", nothing: (s, q) => `${s}: nothing for "${q}"`, tryit: `Try "a client, a field, a street"`,
    foot: "Know this street from the inside? Read how we work on it", yard: (n) => `The Zdrovit yard · ${n} brands`,
    gallery: "More from the case", lead: { A: "Specialty coffee, bakeries and food. Where we grew up.", B: "Banks, brokers, investment groups and tech, made clear and human.", C: "Clinics, labs, pharma and aesthetic medicine, from Bucharest to Barcelona.", D: "Two print shops with a voice: one sings, one sticks." },
    caseBase: (s) => `/work/${s}/`, back: "The website"
  },
  ro: {
    lang: "ro", path: "/ro/streetindex/", alt: "/streetindex/", home: "/ro/",
    title: "Indexul străzilor: branding din București · Cromatic Studios",
    desc: (n) => `${n} studii de caz pe 4 străzi: cafea de specialitate, bănci și fintech, clinici și farma, print. Strategie de brand, identitate, website-uri, film și conținut de la Cromatic Studios, București.`,
    listName: "Proiectele Cromatic Studios, stradă cu stradă",
    nav: [["#index", "Proiecte"], ["/ro/#studio", "Studio"], ["/ro/#services", "Servicii"], ["/ro/#contact", "Contact"]],
    wheel: "Ia volanul", eyebrow: "Cromatic Studios · București · din 2014",
    morph: "Cineva ar putea ține minte", words: ["locul", "fațada", "brandul"], h1a: "Nimeni nu ține minte o miniatură.",
    sub: (n) => `Un studio independent de strategie de brand, identitate, website-uri, film și conținut. ${n} studii de caz pe 4 străzi ale unui oraș construit pentru ele.`,
    read: "Citește proiectele", drive: "Condu prin orașul Cromatic", pause: "Oprește filmul", play: "Pornește filmul",
    show: "Arată-mi", on: "de pe", all: "toate proiectele", every: "toate străzile",
    chapters: { dream: "strategie de brand", voice: "identitate", world: "website-uri, aplicații, ambalaje, film", crowd: "conținut și creștere" },
    search: "un client, un domeniu, o stradă", searchLabel: "Caută în proiecte", clear: "Șterge",
    count: (n, s, t) => `<b>${n} ${n === 1 ? "loc" : "locuri"}</b> pe ${s} ${s === 1 ? "stradă" : "străzi"}, din ${t}`,
    view: ["Index", "Coperți"], viewLabel: "Vizualizare",
    places: (n) => `${n} ${n === 1 ? "loc" : "locuri"}`,
    hint: "Arată spre un nume ca să vezi lucrarea", still: "Din zbor",
    open: "Deschide studiul de caz", onmap: "Pe hartă", nothing: (s, q) => `${s}: nimic pentru „${q}”`, tryit: "Încearcă „un client, un domeniu, o stradă”",
    foot: "Cunoști strada din interior? Vezi cum lucrăm pe ea", yard: (n) => `Curtea Zdrovit · ${n} branduri`,
    gallery: "Mai mult din studiul de caz", lead: { A: "Cafea de specialitate, brutării și mâncare. Aici am crescut.", B: "Bănci, brokeri, grupuri de investiții și tehnologie, spuse clar și omenește.", C: "Clinici, laboratoare, farma și medicină estetică, de la București la Barcelona.", D: "Două tipografii cu voce: una cântă, una lipește." },
    caseBase: (s) => `/ro/proiecte/${s}/`, back: "Website-ul"
  }
};

export async function buildStreetIndex({ root, pub, mediaMap, COVERS, R }) {
  const warn = (m) => console.warn(`[streetindex] ${m}`);
  let RO = new Map();
  try { RO = new Map(Object.entries(JSON.parse(readFileSync(join(root, "site", "i18n", "ro.json"), "utf8"))).map(([k, v]) => [String(k).replace(/\s+/g, " ").trim(), v])); } catch (e) { warn("no ro.json: " + e.message); }
  const roOf = (t) => { const k = String(t ?? "").replace(/\s+/g, " ").trim(); const v = RO.get(k) ?? RO.get(k.replace(/&/g, "&amp;")); return v != null && v !== "" ? v : t; };
  const m = (k) => mediaMap.get(k)?.src || "";

  const galleryOf = (page) => caseGallery(pub, page);

  const css = readFileSync(join(root, "site", "streetindex", "si.css"), "utf8");
  const js = readFileSync(join(root, "site", "streetindex", "si.js"), "utf8");
  // the site's own faces: CromaticSans from the site stylesheet, JetBrains Mono from the website's inline fonts
  let faces = "";
  try {
    const sc = readdirSync(join(pub, "assets")).find((f) => /^site\.[0-9a-f]+\.css$/.test(f));
    faces += (readFileSync(join(pub, "assets", sc), "utf8").match(/@font-face\{font-family:CromaticSans[^}]*\}/g) || []).join("");
    faces += (readFileSync(join(pub, "site", "index.html"), "utf8").match(/@font-face\{font-family:'JetBrains Mono'[^}]*\}/g) || []).join("");
  } catch (e) { warn("fonts: " + e.message); }
  const fontPre = (readFileSync(join(pub, "site", "index.html"), "utf8").match(/<link rel="preload" href="\/assets\/fonts\/[^"]+" as="font" type="font\/woff2" crossorigin>/g) || []).slice(0, 2).join("\n");

  // the website's own chrome, taken from the built /site/ and /ro/ (render.mjs untouched): the header, the boarding pass
  // ("What do you dream of?") as the closing call, the full footer, and the site's stylesheet and script they need
  const SITE = (process.env.SITE_URL || "https://cromaticstudios.com").replace(/\/$/, "");
  const chrome = (lang) => {
    const h = readFileSync(join(pub, lang === "ro" ? "ro" : "site", "index.html"), "utf8"), home = lang === "ro" ? "/ro/" : "/site/", self = SI_PATHS[lang === "ro" ? 1 : 0];
    const pick = (re) => (re.exec(h) || [""])[0];
    const header = pick(/<a class="skip"[^>]*>[^<]*<\/a>\s*<header class="hdr">[\s\S]*?<\/header>/)
      .replace(/href="#work"/g, 'href="#index"').replace(/href="#(?!index|contact|main)([\w-]+)"/g, `href="${home}#$1"`)
      .replace(/(class="lang-sw" href=")[^"]*"/, `$1${SI_PATHS[lang === "ro" ? 0 : 1]}"`);
    if (!header) warn(`no site header in ${home}`);
    return {
      header, contact: pick(/<section id="contact"[\s\S]*?<\/section>/), footer: pick(/<footer class="ftr">[\s\S]*?<\/footer>/),
      css: pick(/<link rel="stylesheet" href="\/assets\/site\.[0-9a-f]+\.css">/) + pick(/<style id="czf-css">[\s\S]*?<\/style>/) + pick(/<style id="cz-bl">[\s\S]*?<\/style>/), js: pick(/<script src="\/assets\/site\.[0-9a-f]+\.js"[^>]*><\/script>/), self
    };
  };
  // the page stays private until Daniel makes it the site: STREETINDEX_PUBLIC=1 at build time turns on the canonical
  // and indexing (server.js still answers 404 off the beta hosts until that gate is lifted too)
  const PUBLIC = process.env.STREETINDEX_PUBLIC === "1";
  const streets = R.workStreets(COVERS);
  const total = streets.reduce((n, s) => n + s.list.length + (s.zd.length ? 1 : 0), 0); // the Zdrovit yard is one row
  const cases = new Set(streets.flatMap((s) => s.list.filter((p) => p.page).map((p) => p.page))).size;
  const galleries = {};
  for (const s of streets) for (const p of s.list) if (p.page && !galleries[p.page]) galleries[p.page] = galleryOf(p.page);

  for (const lang of ["en", "ro"]) {
    const t = T[lang], L = (x) => (lang === "ro" ? roOf(x) : x);
    const data = [];
    const streetHtml = streets.map((s, si) => {
      const slug = STREET_SLUG[s.k], still = m(`m:streets/${slug}/poster`), stillM = m(`m:streets/${slug}/poster-m`) || still;
      const n = s.list.length;
      const rows = s.list.map((p, i) => {
        const id = `${s.k}${pad(i + 1)}`, href = p.page ? t.caseBase(p.page) : "";
        const gal = (p.page && galleries[p.page]) || [];
        const pics = [...new Set([p.cover, ...gal].filter(Boolean))].slice(0, 5);
        // where the focus lands on the street still: spread over the picture, the same every build (no real addresses)
        const fx = 14 + ((i * 37 + si * 11) % 72), fy = 30 + ((i * 23 + si * 7) % 46);
        const d = { id, k: s.k, n: pad(i + 1), of: pad(n), name: p.name, cat: L(p.cat), desc: L(p.desc), poster: L(p.poster), href, pics, fx, fy, c: p.c };
        data.push(d);
        const hay = [p.name, d.cat, d.desc, d.poster, s.street, L(s.t)].join(" ").toLowerCase();
        const tag = "a";
        const attr = href ? `href="${href}"` : `href="#r-${id}"`;
        const inner = `<span class="si-n mono">${d.n}</span><span class="si-thumb" aria-hidden="true">${pics[0] ? `<img src="${pics[0]}" alt="" loading="lazy" decoding="async">` : ""}</span><span class="si-txt"><h3 class="si-name">${esc(p.name)}</h3><span class="si-cat mono">${esc(d.cat)}</span></span>${href ? `<span class="si-go" aria-hidden="true">→</span>` : `<span class="si-map mono">${t.onmap}</span>`}`;
        const more = `<div class="si-more" hidden>${pics[0] ? `<img src="${pics[0]}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : ""}<p class="mono">${esc(d.cat)}</p><p>${esc(d.desc)}</p>${href ? `<a class="si-btn si-btn-ink" href="${href}">${t.open} <span aria-hidden="true">→</span></a>` : ""}</div>`;
        return `<li class="si-row" id="r-${id}" data-id="${id}" data-ch="${chaptersOf(p).join(" ")}" data-q="${esc(hay)}"><${tag} class="si-a" ${attr} aria-describedby="d-${id}">${inner}</${tag}><span class="si-sr" id="d-${id}">${esc(d.poster)}. ${esc(d.desc)}</span>${more}</li>`;
      }).join("");
      const yard = s.zd.length ? `<li class="si-row si-yard" data-id="${s.k}zd" data-ch="voice world crowd" data-q="${esc(["zdrovit", ...s.zd.map((b) => b.name + " " + L(b.line))].join(" ").toLowerCase())}"><details><summary class="si-a"><span class="si-n mono">${pad(n + 1)}</span><span class="si-thumb" aria-hidden="true"></span><span class="si-txt"><h3 class="si-name">${esc(t.yard(s.zd.length))}</h3><span class="si-cat mono">${esc(L("Beauty & Supplement Park"))}</span></span><span class="si-go" aria-hidden="true">+</span></summary><ul class="si-yard-list">${s.zd.map((b) => `<li>${b.page ? `<a href="${t.caseBase(b.page)}">${esc(b.name)}</a>` : `<span>${esc(b.name)}</span>`} <span class="mono">${esc(L(b.line))}</span></li>`).join("")}</ul></details></li>` : "";
      const covers = s.list.map((p, i) => { const d = data.find((x) => x.id === `${s.k}${pad(i + 1)}`); const tg = d.href ? "a" : "div"; return `<li class="si-card" data-id="${d.id}"><${tg} ${d.href ? `href="${d.href}"` : ""} class="si-card-a"><span class="si-card-img">${d.pics[0] ? `<img src="${d.pics[0]}" alt="" loading="lazy" decoding="async">` : ""}</span><b>${esc(d.name)}</b><span class="mono">${esc(d.cat)}</span><span class="si-card-p">${esc(d.poster)}</span></${tg}></li>`; }).join("");
      const hub = s.slug ? (lang === "ro" ? roPath(`/industries/${s.slug}/`) || `/industries/${s.slug}/` : `/industries/${s.slug}/`) : "";
      const first = data.find((x) => x.k === s.k);
      return `<section class="si-street" id="${slug}" data-k="${s.k}" data-name="${esc(s.street)}" style="--sc:${s.col}" aria-labelledby="h-${s.k}">
<header class="si-sh"><p class="mono si-sh-n">${pad(si + 1)}</p><h2 id="h-${s.k}">${esc(s.street)}</h2><p class="si-sh-lead">${esc(L(INDUSTRIES.find((x) => x.street === s.k)?.lead || "") || t.lead[s.k] || L(s.lead))}</p><p class="mono si-sh-c">${t.places(n + (s.zd.length ? s.zd.length : 0))}</p></header>
<div class="si-split">
<ol class="si-list" aria-label="${esc(s.street)}">${rows}${yard}</ol>
<aside class="si-stage" aria-hidden="true" data-k="${s.k}">
<a class="si-cover" href="${first.href || "#index"}" tabindex="-1"><img src="${first.pics[0] || ""}" alt="" decoding="async" loading="${si ? "lazy" : "eager"}"></a>
<div class="si-gal">${first.pics.slice(0, 5).map((u, j) => `<button type="button" tabindex="-1" class="${j ? "" : "on"}"><img src="${u}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>
<div class="si-cap"><div class="si-cap-t"><p class="mono si-cap-cat">${esc(first.cat)}</p><p class="si-cap-name">${esc(first.name)}</p><p class="si-cap-d">${esc(first.desc)}</p></div></div>
</aside>
</div>
<ul class="si-covers">${covers}</ul>
${hub ? `<p class="si-foot"><a href="${hub}">${t.foot} <span aria-hidden="true">→</span></a></p>` : ""}
</section>`;
    }).join("\n");

    const opts = (o) => Object.entries(o).map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("");
    const poster = m("m:drive-loop/poster"), posterM = m("m:drive-loop/poster-m") || poster;
    const vids = { mp4: m("m:drive-loop/drive-loop.mp4"), webm: m("m:drive-loop/drive-loop.webm"), m: m("m:drive-loop/drive-loop-m2.mp4") || m("m:drive-loop/drive-loop-m.mp4") }; // r382: the lighter phone cut (Mira's audit)
    const ch = chrome(lang);
    const items = data.filter((r) => r.href).map((r, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + r.href, name: r.name }));
    const ld = { "@context": "https://schema.org", "@graph": [
      { "@type": "Organization", "@id": `${SITE}/#org`, name: "Cromatic Studios", url: `${SITE}/`, logo: `${SITE}/icon.svg`, email: "hi@cromaticstudios.com", foundingDate: "2014",
        address: { "@type": "PostalAddress", streetAddress: "Strada Olari 9", addressLocality: "Bucharest", addressCountry: "RO" } },
      { "@type": "CollectionPage", "@id": `${SITE}${t.path}#page`, url: `${SITE}${t.path}`, name: t.title, description: t.desc(cases), inLanguage: lang, isPartOf: { "@id": `${SITE}/#org` },
        mainEntity: { "@type": "ItemList", name: t.listName, numberOfItems: items.length, itemListElement: items } }
    ] };
    const html = `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="${PUBLIC ? "index, follow" : "noindex, nofollow, noarchive"}">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.desc(cases))}">
${PUBLIC ? "" : "<!-- canonical, on the day this becomes the site: "}<link rel="canonical" href="${SITE}${t.path}">${PUBLIC ? "" : " -->"}
<link rel="alternate" hreflang="en" href="${SITE}${SI_PATHS[0]}"><link rel="alternate" hreflang="ro" href="${SITE}${SI_PATHS[1]}"><link rel="alternate" hreflang="x-default" href="${SITE}${SI_PATHS[0]}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Cromatic Studios"><meta property="og:title" content="${esc(t.title)}"><meta property="og:description" content="${esc(t.desc(cases))}"><meta property="og:url" content="${SITE}${t.path}"><meta property="og:image" content="${SITE}${poster}"><meta property="og:locale" content="${lang === "ro" ? "ro_RO" : "en_GB"}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<meta name="theme-color" content="#fbfaf5">
<link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" href="/icon.svg" type="image/svg+xml">
${fontPre}
<link rel="preload" as="image" href="${poster}" media="(min-width: 761px)" fetchpriority="high"><link rel="preload" as="image" href="${posterM}" media="(max-width: 760px)" fetchpriority="high">
${ch.css}
<style>${faces}${css}</style>
</head>
<body>
${ch.header}
<main id="main">
<section class="si-fold" aria-labelledby="h1">
<picture class="si-fold-bg"><source media="(max-width: 760px)" srcset="${posterM}"><img src="${poster}" alt="" fetchpriority="high" decoding="async"></picture>
<video class="si-fold-v" muted loop playsinline preload="none" aria-hidden="true" data-mp4="${vids.mp4}" data-webm="${vids.webm}" data-m="${vids.m}"></video>
<button class="si-pause" type="button" aria-label="${t.pause}" data-pause="${t.pause}" data-play="${t.play}" hidden><i></i></button>
<div class="si-fold-t">
<p class="mono si-eyebrow">${t.eyebrow}</p>
<h1 id="h1">${t.h1a}</h1>
<p class="si-morph"><span>${t.morph}</span> <span class="si-pills" role="img" aria-label="${t.words.join(", ")}">${t.words.map((w, j) => `${j ? '<i class="si-ar" aria-hidden="true">→</i>' : ""}<span class="pill${j ? "" : " on"}" style="--pc:${["#FED012", "#28C840", "#119BFE"][j]};--rot:${[-2, 1.5, -1][j]}deg" aria-hidden="true">${w}</span>`).join("")}</span></p>
<p class="si-sub">${t.sub(cases)}</p>
<p class="si-acts"><a class="si-btn si-btn-y" href="#index">${t.read} <span aria-hidden="true">↓</span></a><a class="si-link" href="/">${t.drive} <span aria-hidden="true">→</span></a></p>
</div>
<ul class="si-streets">${streets.map((s) => `<li><a href="#${STREET_SLUG[s.k]}" style="--sc:${s.col}"><i aria-hidden="true"></i>${esc(s.street)}<span class="mono">${pad(s.list.length + s.zd.length)}</span></a></li>`).join("")}</ul>
</section>
<section class="si-index" id="index" aria-label="${esc(t.searchLabel)}">
<form class="si-filter" role="search" onsubmit="return false">
<p class="si-sentence"><span class="si-dim">${t.show}</span> <label class="si-sel"><span class="si-sr">${t.show}</span><select name="ch"><option value="">${t.all}</option>${opts(t.chapters)}</select></label> <span class="si-dim">${t.on}</span> <label class="si-sel"><span class="si-sr">${t.on}</span><select name="st"><option value="">${t.every}</option>${streets.map((s) => `<option value="${s.k}">${esc(s.street)}</option>`).join("")}</select></label></p>
<div class="si-tools"><label class="si-search"><span class="si-sr">${t.searchLabel}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input type="search" name="q" placeholder="${esc(t.search)}" autocomplete="off" spellcheck="false"><button type="button" class="si-clear mono" hidden>${t.clear}</button></label>
<p class="si-count" aria-live="polite" data-total="${total}"></p>
<p class="si-view" role="group" aria-label="${t.viewLabel}"><button type="button" aria-pressed="true" data-v="index">${t.view[0]}</button> · <button type="button" aria-pressed="false" data-v="covers">${t.view[1]}</button></p></div>
</form>
${streetHtml}
<p class="si-empty mono" hidden><span class="si-empty-l"></span><span>${t.tryit}</span></p>
</section>
${ch.contact}
</main>
${ch.footer}
<script type="application/json" id="si-data">${JSON.stringify({ lang, total, rows: data, nothing: t.nothing("{s}", "{q}") }).replace(/</g, "\\u003c")}</script>
${ch.js}
<script>${js}</script>
</body>
</html>`;
    mkdirSync(join(pub, t.path), { recursive: true });
    writeFileSync(join(pub, t.path, "index.html"), html);
  }

  // the case pages: a dormant opt-in to the cross-document View Transition (cover -> case hero), live only after a
  // click on a row here (the index writes the case's path to sessionStorage "si-vt"), and never with reduced motion
  const VT = `<script>try{if(sessionStorage.getItem("si-vt")===location.pathname&&!matchMedia("(prefers-reduced-motion: reduce)").matches){var s=document.createElement("style");s.textContent="@view-transition{navigation:auto}img[fetchpriority=high]{view-transition-name:case-hero}::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation-duration:.2s}";document.head.appendChild(s)}}catch(e){}</script>`;
  let nvt = 0;
  for (const base of [join(pub, "work"), join(pub, "ro", "proiecte")]) {
    let ds = []; try { ds = readdirSync(base); } catch {}
    for (const d of ds) {
      const f = join(base, d, "index.html");
      if (!existsSync(f)) continue;
      const h = readFileSync(f, "utf8");
      if (h.includes('"si-vt"') || !h.includes("</head>")) continue;
      writeFileSync(f, h.replace("</head>", VT + "\n</head>")); nvt++;
    }
  }
  console.log(`[streetindex] ${SI_PATHS.join(" + ")} -> ${streets.length} streets, ${total} places, ${cases} cases, beta only; view transition opt-in on ${nvt} case pages`);
}
// the sentence filter's words, for the header's mega menu (build/megamenu.mjs; its Romanian comes from site/i18n/ro.json)
export const SI_WORDS = T;
