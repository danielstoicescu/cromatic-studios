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

export const SI_PATHS = ["/streetindex/", "/ro/streetindex/"];

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const STREET_SLUG = { A: "coffee-street", B: "fintech-boulevard", C: "medical-avenue", D: "the-shortest-shortcut" };

// the four filter chapters, read from each project's fields (data.mjs has no chapters[] yet, see brief §7.4)
const CH = {
  dream: /strateg|position|naming|persona|brand universe|workshop/i,
  voice: /brand|identit|logo|label|visual|design/i,
  world: /web|site|app|packag|box|film|video|product|merch|print|sticker|ui\b|ux|3d|label|tv/i,
  crowd: /content|social|growth|campaign|communicat|photo|ads|motion|smart tv|event|festival|pr\b/i
};
const chaptersOf = (p) => Object.keys(CH).filter((k) => CH[k].test(`${p.cat} ${p.desc}`));

const T = {
  en: {
    lang: "en", path: "/streetindex/", alt: "/ro/streetindex/", home: "/site/",
    title: "The Street Index · Cromatic Studios",
    desc: "Every project of Cromatic Studios on the street it lives on: Coffee Street, Fintech Boulevard, Medical Avenue and The Shortest Shortcut.",
    nav: [["#index", "Work"], ["/site/#studio", "Studio"], ["/site/#services", "Services"], ["/site/#contact", "Contact"]],
    wheel: "Take the wheel", eyebrow: "Cromatic Studios · Bucharest · since 2014",
    morph: "Someone could remember a", words: ["place", "facade", "brand"], h1a: "Nobody remembers a thumbnail.", h1b: "Everyone remembers an", h1w: "address", h1c: ".",
    sub: (n) => `An independent studio for brand strategy, identity, websites, film and content. ${n} case studies on 4 streets of a city we built for them.`,
    read: "Read the work", drive: "Take the 3D drive", pause: "Pause the film", play: "Play the film",
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
    title: "Indexul străzilor · Cromatic Studios",
    desc: "Fiecare proiect Cromatic Studios pe strada lui: Coffee Street, Fintech Boulevard, Medical Avenue și The Shortest Shortcut.",
    nav: [["#index", "Proiecte"], ["/ro/#studio", "Studio"], ["/ro/#services", "Servicii"], ["/ro/#contact", "Contact"]],
    wheel: "Ia volanul", eyebrow: "Cromatic Studios · București · din 2014",
    morph: "Cineva ar putea ține minte", words: ["locul", "fațada", "brandul"], h1a: "Nimeni nu ține minte o miniatură.", h1b: "Toată lumea ține minte o", h1w: "adresă", h1c: ".",
    sub: (n) => `Un studio independent de strategie de brand, identitate, website-uri, film și conținut. ${n} studii de caz pe 4 străzi ale unui oraș construit pentru ele.`,
    read: "Citește proiectele", drive: "Ia-o pe drumul 3D", pause: "Oprește filmul", play: "Pornește filmul",
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

  // the media of each built case page: its hero first, then its pictures, in page order (logos and small pictures out)
  const galleryOf = (page) => {
    const f = join(pub, "work", page, "index.html");
    if (!existsSync(f)) return [];
    const html = readFileSync(f, "utf8"), out = [];
    for (const tag of html.match(/<img\b[^>]*>/g) || []) {
      const src = (/data-lz-src="([^"]+)"/.exec(tag) || /\ssrc="(\/[^"]+)"/.exec(tag) || [])[1];
      const w = Number((/\swidth="(\d+)"/.exec(tag) || [])[1] || 0);
      if (!src || src.startsWith("data:") || /alt="Cromatic Studios"/.test(tag) || /\.svg$/.test(src) || (w && w < 360)) continue;
      if (!out.includes(src)) out.push(src);
      if (out.length >= 6) break;
    }
    return out;
  };

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

  const streets = R.workStreets(COVERS);
  const total = streets.reduce((n, s) => n + s.list.length, 0);
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
        const tag = href ? "a" : "button";
        const attr = href ? `href="${href}"` : `type="button"`;
        const inner = `<span class="si-n mono">${d.n}</span><span class="si-thumb" aria-hidden="true">${pics[0] ? `<img src="${pics[0]}" alt="" loading="lazy" decoding="async">` : ""}</span><span class="si-txt"><b class="si-name">${esc(p.name)}</b><span class="si-cat mono">${esc(d.cat)}</span></span>${href ? `<span class="si-go" aria-hidden="true">→</span>` : `<span class="si-map mono">${t.onmap}</span>`}`;
        const more = `<div class="si-more" hidden>${pics[0] ? `<img src="${pics[0]}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : ""}<p class="mono">${esc(d.cat)}</p><p>${esc(d.desc)}</p>${href ? `<a class="si-btn si-btn-ink" href="${href}">${t.open} <span aria-hidden="true">→</span></a>` : ""}</div>`;
        return `<li class="si-row" id="r-${id}" data-id="${id}" data-ch="${chaptersOf(p).join(" ")}" data-q="${esc(hay)}"><${tag} class="si-a" ${attr} aria-describedby="d-${id}">${inner}</${tag}><span class="si-sr" id="d-${id}">${esc(d.poster)}. ${esc(d.desc)}</span>${more}</li>`;
      }).join("");
      const yard = s.zd.length ? `<li class="si-row si-yard" data-id="${s.k}zd" data-ch="voice world crowd" data-q="${esc(["zdrovit", ...s.zd.map((b) => b.name + " " + L(b.line))].join(" ").toLowerCase())}"><details><summary class="si-a"><span class="si-n mono">${pad(n + 1)}</span><span class="si-thumb" aria-hidden="true"></span><span class="si-txt"><b class="si-name">${esc(t.yard(s.zd.length))}</b><span class="si-cat mono">${esc(L("Beauty & Supplement Park"))}</span></span><span class="si-go" aria-hidden="true">+</span></summary><ul class="si-yard-list">${s.zd.map((b) => `<li>${b.page ? `<a href="${t.caseBase(b.page)}">${esc(b.name)}</a>` : `<span>${esc(b.name)}</span>`} <span class="mono">${esc(L(b.line))}</span></li>`).join("")}</ul></details></li>` : "";
      const covers = s.list.map((p, i) => { const d = data.find((x) => x.id === `${s.k}${pad(i + 1)}`); const tg = d.href ? "a" : "div"; return `<li class="si-card" data-id="${d.id}"><${tg} ${d.href ? `href="${d.href}"` : ""} class="si-card-a"><span class="si-card-img">${d.pics[0] ? `<img src="${d.pics[0]}" alt="" loading="lazy" decoding="async">` : ""}</span><b>${esc(d.name)}</b><span class="mono">${esc(d.cat)}</span><span class="si-card-p">${esc(d.poster)}</span></${tg}></li>`; }).join("");
      const hub = s.slug ? (lang === "ro" ? roPath(`/industries/${s.slug}/`) || `/industries/${s.slug}/` : `/industries/${s.slug}/`) : "";
      const first = data.find((x) => x.k === s.k);
      return `<section class="si-street" id="${slug}" data-k="${s.k}" data-name="${esc(s.street)}" style="--sc:${s.col}" aria-labelledby="h-${s.k}">
<header class="si-sh"><p class="mono si-sh-n">${pad(si + 1)}</p><h2 id="h-${s.k}">${esc(s.street)}</h2><p class="si-sh-lead">${esc(t.lead[s.k] || L(s.lead))}</p><p class="mono si-sh-c">${t.places(n + (s.zd.length ? s.zd.length : 0))}</p></header>
<div class="si-strip" aria-hidden="true"><div class="si-still" style="--fx:${first.fx}%;--fy:${first.fy}%"><img class="si-still-b" src="${stillM}" alt="" loading="lazy" decoding="async"><img class="si-still-s" src="${stillM}" alt="" loading="lazy" decoding="async"><i class="si-dot"></i></div><span class="mono si-strip-l"><span>${esc(s.street)}</span> · <span class="si-strip-n">${first.n}</span> / ${pad(n)}</span><i class="si-strip-p"></i></div>
<div class="si-split">
<ol class="si-list" aria-label="${esc(s.street)}">${rows}${yard}</ol>
<aside class="si-stage" aria-hidden="true" data-k="${s.k}">
<a class="si-cover" href="${first.href || "#index"}" tabindex="-1"><img src="${first.pics[0] || ""}" alt="" decoding="async" loading="${si ? "lazy" : "eager"}"></a>
<div class="si-gal">${first.pics.slice(0, 5).map((u, j) => `<button type="button" tabindex="-1" class="${j ? "" : "on"}"><img src="${u}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>
<div class="si-cap"><div class="si-cap-t"><p class="mono si-cap-cat">${esc(first.cat)}</p><p class="si-cap-name">${esc(first.name)}</p><p class="si-cap-d">${esc(first.desc)}</p></div>
<div class="si-still si-still-sm" style="--fx:${first.fx}%;--fy:${first.fy}%"><img class="si-still-b" src="${still}" alt="" loading="lazy" decoding="async"><img class="si-still-s" src="${still}" alt="" loading="lazy" decoding="async"><i class="si-dot"></i><span class="mono">${t.still} · ${esc(s.street)} · <span class="si-still-n">${first.n}</span></span></div></div>
<p class="mono si-hint">${t.hint}</p>
</aside>
</div>
<ul class="si-covers">${covers}</ul>
${hub ? `<p class="si-foot"><a href="${hub}">${t.foot} <span aria-hidden="true">→</span></a></p>` : ""}
</section>`;
    }).join("\n");

    const opts = (o) => Object.entries(o).map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("");
    const poster = m("m:drive-loop/poster"), posterM = m("m:drive-loop/poster-m") || poster;
    const vids = { mp4: m("m:drive-loop/drive-loop.mp4"), webm: m("m:drive-loop/drive-loop.webm"), m: m("m:drive-loop/drive-loop-m.mp4") };
    const html = `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.desc)}">
<meta name="theme-color" content="#fbfaf5">
<link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" href="/icon.svg" type="image/svg+xml">
${fontPre}
<link rel="preload" as="image" href="${poster}" media="(min-width: 761px)" fetchpriority="high"><link rel="preload" as="image" href="${posterM}" media="(max-width: 760px)" fetchpriority="high">
<style>${faces}${css}</style>
</head>
<body>
<a class="si-skip" href="#index">${t.read}</a>
<header class="si-top"><a class="si-logo" href="${t.home}">Cromatic Studios</a>
<p class="si-where mono" aria-hidden="true"><span class="si-where-s"></span> · <span class="si-where-n"></span></p><i class="si-prog" aria-hidden="true"></i>
<nav aria-label="Main"><ul>${t.nav.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul>
<p class="si-lang"><a href="/streetindex/"${lang === "en" ? ' aria-current="page"' : ""} lang="en">EN</a> / <a href="/ro/streetindex/"${lang === "ro" ? ' aria-current="page"' : ""} lang="ro">RO</a></p></nav>
<a class="si-btn si-btn-y si-wheel" href="/">${t.wheel}</a></header>
<main>
<section class="si-fold" aria-labelledby="h1">
<picture class="si-fold-bg"><source media="(max-width: 760px)" srcset="${posterM}"><img src="${poster}" alt="" fetchpriority="high" decoding="async"></picture>
<video class="si-fold-v" muted loop playsinline preload="none" aria-hidden="true" data-mp4="${vids.mp4}" data-webm="${vids.webm}" data-m="${vids.m}"></video>
<button class="si-pause" type="button" aria-label="${t.pause}" data-pause="${t.pause}" data-play="${t.play}" hidden><i></i></button>
<div class="si-fold-t">
<p class="mono si-eyebrow">${t.eyebrow}</p>
<h1 id="h1">${t.h1a}<br class="si-br"> ${t.h1b} <mark>${t.h1w}</mark>${t.h1c}</h1>
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
</main>
<footer class="si-footer"><a href="${t.home}">${t.back} <span aria-hidden="true">→</span></a><span class="mono">Cromatic Studios · beta</span></footer>
<script type="application/json" id="si-data">${JSON.stringify({ lang, total, rows: data, nothing: t.nothing("{s}", "{q}") }).replace(/</g, "\\u003c")}</script>
<script>${js}</script>
</body>
</html>`;
    mkdirSync(join(pub, t.path), { recursive: true });
    writeFileSync(join(pub, t.path, "index.html"), html);
  }

  // the case pages: a dormant opt-in to the cross-document View Transition (cover -> case hero), live only after a
  // click on a row here (the index writes the case's path to sessionStorage "si-vt"), and never with reduced motion
  const VT = `<script>try{if(sessionStorage.getItem("si-vt")===location.pathname&&!matchMedia("(prefers-reduced-motion: reduce)").matches){var s=document.createElement("style");s.textContent="@view-transition{navigation:auto}img[fetchpriority=high]{view-transition-name:case-hero}";document.head.appendChild(s)}}catch(e){}</script>`;
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
