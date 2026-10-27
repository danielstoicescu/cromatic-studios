// r322 (Daniel, 27 Oct): /prezentare/proces-<code>/, the studio's process as a deck for live meetings, often on a big
// TV. One fold per step: the page moves by whole slides (site/prezentare/prez.js), never resting halfway. Content from
// the Google Slides credentials deck (Cromatic_Studios_25), brought to today's offer (The Core 3.0, 3 visual
// directions, the Brand Canvas, Brand guidelines, Phase II in four steps, Brand experiences).
// r325 (Daniel): the portfolio is the website's own listing, whole: every street of the map in the site's order, every
// project on it (with or without a case page) and the Zdrovit park, taken from the same data at build time
// (R.workStreets in site/render.mjs), so the deck never drifts from /site/. The words live in prezentare-copy.mjs, by
// language: English now, Romanian later (a `ro` block there is written to <path>ro/).
// PRIVATE, like /rapoarte/: written after the pass over public/ (no footer, no cookie card, no GA4), never in PAGES (no
// sitemap, no llms.txt), noindex in the page and in server.js's headers (no-store, no referrer), linked from nowhere.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { COPY } from "./prezentare-copy.mjs";

export const PREZ_PATH = "/prezentare/proces-5000932d55/";
const PER_SLIDE = 10; // cards on one slide at most: two rows of five, still readable from across the room

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
// the copy's own markup: [[word|c|l]] a tilted pill, **bold**
const md = (s) => String(s)
  .replace(/\[\[([^|\]]+)\|(\w)(?:\|([lr]))?\]\]/g, (m, t, c, tl) => `<span class="pill pill-${c}${tl ? ` tilt-${tl}` : ""}">${t}</span>`)
  .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
// n items in balanced chunks of at most `max`
const chunks = (arr, max) => { const k = Math.max(1, Math.ceil(arr.length / max)), out = []; let at = 0; for (let i = 0; i < k; i++) { const m = Math.ceil((arr.length - at) / (k - i)); out.push(arr.slice(at, at + m)); at += m; } return out; };

export async function buildPrezentare({ root, pub, mediaMap, COVERS, canvases, R }) {
  const warn = (m) => console.warn(`[prezentare] ${m}`);
  const streets = R.workStreets(COVERS);
  const src = (k) => {
    if (!k) return "";
    if (k.startsWith("/")) return k;
    const a = mediaMap.get(k);
    if (!a) { warn(`missing media ${k}`); return ""; }
    return a.src;
  };
  // every picture waits in data-src: prez.js hands it out as its slide comes near (and the rest once the deck is idle)
  const img = (k, cls = "", alt = "") => { const s = src(k); return s ? `<img class="${cls}" data-src="${s}" alt="${esc(alt)}" decoding="async" draggable="false">` : ""; };

  let n = 0;
  for (const [lang, c] of Object.entries(COPY)) {
    const base = lang === "en" ? PREZ_PATH : `${PREZ_PATH}${lang}/`;
    n = page(lang, c, base);
  }
  return n;

  function page(lang, c, base) {
    const slides = [];
    // theme: paper | grid | ink | yellow | green | purple | blue | coral; part: the label in the top right corner
    const S = (theme, part, title, body, cls = "") => slides.push({ theme, part, title, html: body, cls });
    const eb = (t) => `<p class="eyebrow mono a">${t}</p>`;
    const h2 = (t, cls = "h2") => `<h2 class="${cls} a">${md(t)}</h2>`;
    const lead = (t) => `<p class="lead a">${md(t)}</p>`;
    const ticks = (l) => `<ul class="ticks">${l.map((x) => `<li class="a">${md(x)}</li>`).join("")}</ul>`;
    const deliver = (t) => `<p class="deliver a"><span class="mono">${c.ui.deliverable}</span><b>${t}</b></p>`;
    const step = (k) => `<p class="stepk mono a"><span class="pill pill-b sm">${c.ui.step} ${k}</span> ${c.ui.of} 4 · ${c.ui.phase2}</p>`;
    const divider = (t, theme) => S(theme, t.part, t.title, `
  <div class="divider">
    <p class="big-n mono a">${t.n}</p>
    ${eb(t.eyebrow)}
    ${h2(t.h, "d1")}
    ${lead(t.lead)}
  </div>`);

    // ---------- cover ----------
    S("ink", c.cover.part, c.cover.title, `
  <div class="shapes" aria-hidden="true"><i class="sh-p a"></i><i class="sh-r a"></i><i class="sh-c a"></i><i class="sh-d a"></i></div>
  <div class="cover">
    <i class="cup xxl a" aria-hidden="true"></i>
    ${eb(c.cover.eyebrow)}
    <h1 class="d1 a">${md(c.cover.h)}</h1>
    ${lead(c.cover.lead)}
    <p class="cover-foot mono a">${c.cover.foot}</p>
  </div>`, "s-cover");

    // ---------- the studio ----------
    S("paper", c.studio.part, c.studio.title, `
  <div class="split">
    <div class="col">
      ${eb(c.studio.eyebrow)}
      ${h2(c.studio.h)}
      ${lead(c.studio.lead)}
      ${ticks(c.studio.ticks)}
    </div>
    <div class="col photos3">
      ${img("/onboarding/media/studio/s5.webp", "ph p1 a", c.studio.alts[0])}
      ${img("/onboarding/media/studio/s3.webp", "ph p2 a", c.studio.alts[1])}
      ${img("/onboarding/media/studio/s0.webp", "ph p3 a", c.studio.alts[2])}
    </div>
  </div>`);

    // ---------- people ----------
    const crew = [["cristian", "Cristian"], ["daniel", "Daniel"], ["ana", "Ana"], ["coz", "Coz"], ["alexandra", "Alexandra"], ["stefan", "Stefan"], ["adina", "Adina"], ["anne", "Anne"], ["iulica", "Iulică"], ["melissa", "Melissa"]];
    S("ink", c.people.part, c.people.title, `
  <div class="stack">
    ${eb(c.people.eyebrow)}
    ${h2(c.people.h)}
    <div class="three">${c.people.cols.map(([k, t]) => `<div class="a"><p class="k mono">${k}</p><p>${t}</p></div>`).join("")}</div>
    <ul class="crew">${crew.map(([f, nm]) => `<li class="a">${img(`/onboarding/media/crew/${f}.webp`, "", nm)}<b>${esc(nm)}</b></li>`).join("")}</ul>
  </div>`);

    // ---------- branding process, brand = perception ----------
    S("yellow", c.process.part, c.process.title, `
  <div class="stack mid">
    ${eb(c.process.eyebrow)}
    ${h2(c.process.h, "d2")}
    ${lead(c.process.lead)}
  </div>`);
    S("ink", c.perception.part, c.perception.title, `
  <div class="stack mid perception">
    <p class="eq a" aria-hidden="true"><span class="pill pill-y">${c.perception.eq[0]}</span><span>=</span><span class="pill pill-b tilt-l">${c.perception.eq[1]}</span></p>
    ${h2(c.perception.h)}
  </div>`);

    // ---------- from core to market ----------
    S("grid", c.road.part, c.road.title, `
  <div class="stack">
    ${eb(c.road.eyebrow)}
    ${h2(c.road.h)}
    ${lead(c.road.lead)}
    <ol class="road">${c.road.phases.map((p, i) => `<li class="ph ph-${p.c} a"><span class="n mono">${pad(i + 1)}</span><p class="k mono">${p.k}</p><h3>${p.t}</h3><ul>${p.items.map((x) => `<li>${x}</li>`).join("")}</ul></li>`).join("")}</ol>
  </div>`);

    // ---------- The Core 3.0 ----------
    divider(c.dCore, "green");
    S("paper", c.coreHow.part, c.coreHow.title, `
  <div class="stack">
    ${eb(c.coreHow.eyebrow)}
    ${h2(c.coreHow.h)}
    <ol class="cards3">${c.coreHow.cards.map(([k, t, d], i) => `<li class="card${i === 2 ? " card-y" : ""} a"><span class="n mono">${pad(i + 1)}</span><p class="k mono">${k}</p><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
    <p class="note a">${c.coreHow.note}</p>
  </div>`);
    S("ink", c.uvp.part, c.uvp.title, `
  <div class="stack mid">
    ${eb(c.uvp.eyebrow)}
    <h2 class="h3 a">${c.uvp.h}</h2>
    <p class="uvp a">${c.uvp.sentence.replace(/\{([^}]+)\}/g, '<span class="slot">$1</span>')}</p>
    <div class="xf a"><span class="pill pill-y">${c.uvp.xf}</span><p>${c.uvp.xfText}</p></div>
  </div>`);
    S("grid", c.covers.part, c.covers.title, `
  <div class="stack">
    ${eb(c.covers.eyebrow)}
    ${h2(c.covers.h)}
    <ul class="grid8">${c.covers.items.map(([t, d], i) => `<li class="a${i === c.covers.items.length - 1 ? " hl" : ""}"><span class="n mono">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul>
  </div>`);

    // ---------- the four workshop exercises ----------
    const steps4 = (on) => `<ol class="steps4 a" aria-label="${fill(c.ws.stepsLabel, { n: on })}">${c.ws.steps.map((t, i) => `<li class="${i + 1 === on ? "on" : ""}"><span class="mono">${i + 1}</span>${t}</li>`).join("")}</ol>`;
    S("paper", c.ws.part, c.attr.title, `
  <div class="split">
    <div class="col">${steps4(1)}${eb(c.attr.eyebrow)}${h2(c.attr.h)}${lead(c.attr.lead)}</div>
    <div class="col nums">${c.attr.nums.map(([b, t]) => `<div class="num a"><b>${b}</b><p>${t}</p></div>`).join("")}</div>
  </div>`);
    const mix = Object.fromEntries(c.arch.mix);
    S("paper", c.ws.part, c.arch.title, `
  <div class="split">
    <div class="col">${steps4(2)}${eb(c.arch.eyebrow)}${h2(c.arch.h)}${lead(c.arch.lead)}</div>
    <div class="col">
      <ul class="arch">${c.arch.list.map((t) => { const k = c.arch.mix.findIndex(([m]) => m === t); return `<li class="a${k >= 0 ? ` on${k + 1}` : ""}">${t}${mix[t] ? `<span class="mono">${mix[t]}</span>` : ""}</li>`; }).join("")}</ul>
      <p class="caption mono a">${c.arch.caption}</p>
    </div>
  </div>`);
    S("paper", c.ws.part, c.users.title, `
  <div class="stack">
    ${steps4(3)}${eb(c.users.eyebrow)}${h2(c.users.h)}${lead(c.users.lead)}
    <ol class="flow4">${c.users.steps.map(([t, d], i) => `<li class="a"><span class="n mono">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
  </div>`);
    S("paper", c.ws.part, c.goals.title, `
  <div class="split">
    <div class="col">${steps4(4)}${eb(c.goals.eyebrow)}${h2(c.goals.h)}${lead(c.goals.lead)}</div>
    <div class="col">
      <div class="tree">
        <span class="pill pill-y big a">${c.goals.goal}</span>
        <i class="tw a" aria-hidden="true"></i>
        <div class="leaves">${[0, 1, 2].map(() => `<span class="pill pill-w a">${c.goals.action}</span>`).join("")}</div>
      </div>
    </div>
  </div>`);

    // ---------- Phase I · identity ----------
    divider(c.dId, "purple");
    S("paper", c.dirs.part, c.dirs.title, `
  <div class="stack">
    ${eb(c.dirs.eyebrow)}${h2(c.dirs.h)}${lead(c.dirs.lead)}
    <ol class="dirs">${c.dirs.items.map(([k, d], i) => `<li class="dir d-${i + 1} a"><div class="art" aria-hidden="true"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div><p class="k mono">${k}</p><p>${d}</p></li>`).join("")}</ol>
    ${deliver(c.dirs.deliver)}
  </div>`);
    // the brand canvas: the website's OMA Coffee canvas, drawn from its own pieces
    const cv = canvases["oma-coffee"];
    let board = "";
    if (cv) {
      const { w: W, h: H, base: cb, items, bg } = cv;
      const pos = (b) => `left:${(b[0] / W * 100).toFixed(3)}%;top:${((H - b[3]) / H * 100).toFixed(3)}%;width:${((b[2] - b[0]) / W * 100).toFixed(3)}%`;
      const el = (it) => `<img class="cv-el" data-src="${cb}/${it.file}" alt="" decoding="async" draggable="false" style="${pos(it.box)}">`;
      board = `<div class="board a" style="aspect-ratio:${(W / H).toFixed(4)}" role="img" aria-label="${esc(c.canvas.alt)}">${items.filter((i) => i.under).map(el).join("")}${bg ? (bg.solid ? `<div class="cv-bg" style="background:${bg.solid}"></div>` : `<img class="cv-bg" data-src="${cb}/${bg.file}" alt="" decoding="async" draggable="false">`) : ""}${items.filter((i) => !i.under).map(el).join("")}</div>`;
    } else warn("the OMA Coffee canvas is missing");
    S("paper", c.canvas.part, c.canvas.title, `
  <div class="stack">
    ${eb(c.canvas.eyebrow)}
    <div class="row-h">${h2(c.canvas.h)}${lead(c.canvas.lead)}</div>
    ${board}
    <p class="caption mono a">${c.canvas.caption}</p>
  </div>`, "s-canvas");
    S("paper", c.guide.part, c.guide.title, `
  <div class="split">
    <div class="col">
      ${eb(c.guide.eyebrow)}${h2(c.guide.h)}${lead(c.guide.lead)}
      <ul class="chips a">${c.guide.chips.map((x) => `<li>${x}</li>`).join("")}</ul>
    </div>
    <div class="col book">
      ${img("m:venevo/gl-cover", "pg g1 a", c.guide.alts[0])}
      ${img("m:venevo/gl-logo-variations", "pg g2 a", c.guide.alts[1])}
      ${img("m:venevo/gl-colours", "pg g3 a", c.guide.alts[2])}
      <p class="caption mono a">${c.guide.caption}</p>
    </div>
  </div>`);

    // ---------- Phase II · to market ----------
    divider(c.dMkt, "blue");
    S("paper", c.touch.part, c.touch.title, `
  <div class="stack">
    ${step(1)}${h2(c.touch.h)}${lead(c.touch.lead)}
    <ol class="stages">${c.touch.stages.map((s, i) => `<li class="a"><span class="mono">${pad(i + 1)}</span>${s}</li>`).join("")}</ol>
    <div class="cols3 a">${c.touch.cols.map((x) => `<p>${md(x)}</p>`).join("")}</div>
    ${deliver(c.touch.deliver)}
  </div>`);
    S("paper", c.web.part, c.web.title, `
  <div class="split">
    <div class="col">${step(2)}${h2(c.web.h)}${lead(c.web.lead)}${ticks(c.web.ticks)}</div>
    <div class="col shots">
      ${img("m:venevo/d1-site-hero", "sh s1 a", c.web.alts[0])}
      ${img("m:cs/Web-1920---portofoliu---default", "sh s2 a", c.web.alts[1])}
      ${img("m:unchain-festival/site-scroll-phone", "sh s3 a", c.web.alts[2])}
    </div>
  </div>`);
    S("paper", c.comms.part, c.comms.title, `
  <div class="stack">
    ${step(3)}${h2(c.comms.h)}${lead(c.comms.lead)}
    <ul class="grid4">${c.comms.items.map(([t, d], i) => `<li class="a"><span class="n mono">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul>
    ${deliver(c.comms.deliver)}
  </div>`);
    S("ink", c.content.part, c.content.title, `
  <div class="split">
    <div class="col">${step(4)}${h2(c.content.h)}${lead(c.content.lead)}${ticks(c.content.ticks)}${deliver(c.content.deliver)}</div>
    <div class="col mosaic">
      ${img("m:wp/2025-07-Steam-Cromaticstudios-26", "m1 a", c.content.alts[0])}
      ${img("m:cs/Clinica-Sante", "m2 a", c.content.alts[1])}
      ${img("m:tm/tee-048", "m3 a", c.content.alts[2])}
    </div>
  </div>`);
    S("coral", c.exp.part, c.exp.title, `
  <div class="split">
    <div class="col">${eb(c.exp.eyebrow)}${h2(c.exp.h)}${lead(c.exp.lead)}${ticks(c.exp.ticks)}${deliver(c.exp.deliver)}</div>
    <div class="col mosaic">
      ${img("m:arca/caviar-photo", "m1 a", c.exp.alts[0])}
      ${img("m:antila/carnati", "m2 a", c.exp.alts[1])}
      ${img("m:cs/Lotca-by-Arca-Resort-5", "m3 a", c.exp.alts[2])}
    </div>
  </div>`);

    // ---------- the work: the website's portfolio, street by street ----------
    const w = c.work;
    const totP = streets.reduce((a, s) => a + s.list.length, 0), totC = streets.reduce((a, s) => a + s.cases, 0);
    const sign = (s) => `<span class="sign" style="--sc:${s.col};--st:${s.ink}">${esc(s.street)}</span>`;
    S("ink", w.part, w.title, `
  <div class="stack">
    ${eb(w.eyebrow)}
    <div class="row-h">${h2(w.h)}${lead(fill(w.lead, { projects: totP, cases: totC }))}</div>
    <ol class="streets">${streets.map((s) => `<li class="a">${sign(s)}<span class="st-t">${esc(s.t)}</span><span class="st-n mono">${s.list.length} ${w.projects} · ${s.cases} ${s.cases === 1 ? w.caseOne : w.cases}</span></li>`).join("")}</ol>
  </div>`, "s-streets");
    const card = (p) => {
      const media = p.cover ? `<img data-src="${p.cover}" alt="" decoding="async" draggable="false">` : `<span class="poster" style="background:${p.c};color:${p.t}">${esc(p.poster || p.name)}</span>`;
      const tag = p.page ? `<span class="tag mono">${w.readCase} ↗</span>` : p.wip ? `<span class="tag mono wip">${w.wip}</span>` : "";
      const inner = `<span class="wc-m" style="--bc:${p.c}">${media}${tag}</span><span class="wc-b"><b>${esc(p.name)}</b><span class="mono">${esc(p.cat)}</span></span>`;
      return p.page ? `<a class="wc a" href="/work/${p.page}/" target="_blank" rel="noopener">${inner}</a>` : `<div class="wc a">${inner}</div>`;
    };
    for (const s of streets) {
      const parts = chunks(s.list, PER_SLIDE);
      parts.forEach((list, i) => {
        const cols = list.length <= 3 ? list.length : Math.ceil(list.length / 2);
        S("paper", fill(w.streetPart, { street: s.street }), `${s.street}${parts.length > 1 ? ` ${i + 1}/${parts.length}` : ""}`, `
  <div class="stack wk" style="--sc:${s.col}">
    <div class="wk-h a">
      ${sign(s)}<span class="wk-t">${esc(s.t)}</span>
      <span class="wk-n mono">${s.cases} ${s.cases === 1 ? w.caseOne : w.cases}${parts.length > 1 ? ` · ${fill(w.cont, { i: i + 1, n: parts.length })}` : ""}</span>
    </div>
    <div class="wgrid${list.length <= 3 ? " few" : ""}" style="--cols:${cols}">${list.map(card).join("")}</div>
  </div>`, "s-work");
      });
      if (s.zd.length) {
        S("paper", fill(w.streetPart, { street: s.street }), `${s.street}: Zdrovit`, `
  <div class="stack wk" style="--sc:${s.col}">
    <div class="wk-h a">${sign(s)}<span class="wk-t">${w.zdTitle}</span><span class="wk-n mono">${s.zd.filter((b) => b.page).length} ${w.cases}</span></div>
    <p class="lead a">${w.zdLead}</p>
    <div class="zgrid">${s.zd.map((b) => { const inner = `<span class="zc-m">${b.cover ? `<img data-src="${b.cover}" alt="" decoding="async" draggable="false">` : ""}</span><span class="zc-b"><b>${esc(b.name)}</b><span class="mono">${esc(b.line || "")}</span></span>`; return b.page ? `<a class="zc a" href="/work/${b.page}/" target="_blank" rel="noopener">${inner}</a>` : `<div class="zc a">${inner}</div>`; }).join("")}</div>
  </div>`, "s-work");
      }
    }

    // ---------- thank you ----------
    S("yellow", c.thanks.part, c.thanks.title, `
  <div class="stack mid thanks">
    <i class="cup xxl a" aria-hidden="true"></i>
    <h2 class="d1 a">${c.thanks.h}</h2>
    <ul class="ty">${c.thanks.items.map(([col, k, href, t]) => `<li class="a"><span class="pill pill-${col} sm">${k}</span>${href ? `<a href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${t}</a>` : `<span>${t}</span>`}</li>`).join("")}</ul>
  </div>`);

    const N = slides.length;
    const body = slides.map((s, i) => `<section class="slide t-${s.theme} ${s.cls}" id="s${i + 1}" data-theme="${s.theme}" data-part="${esc(s.part)}" aria-roledescription="slide" aria-label="${i + 1} ${c.ui.of} ${N}: ${esc(s.title)}"><div class="in">${s.html}</div></section>`).join("\n");
    const html = `<!doctype html>
<html lang="${c.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${c.title}</title>
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="googlebot" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#0d0c09">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts.css">
<link rel="stylesheet" href="${PREZ_PATH}prez.css">
<script>document.documentElement.classList.add("js");try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("rm")}catch(e){}</script>
</head>
<body data-theme="ink">
<div class="deck" id="deck">
<div class="track" id="track">
${body}
</div>
</div>
<header class="chrome top" aria-hidden="true">
  <p class="frame"><span class="tri">▶</span><b>Cromatic Studios</b> <span class="sl">//</span> ${c.frame}</p>
  <p class="part mono" id="part"></p>
</header>
<nav class="chrome bot" aria-label="${c.ui.slides}">
  <div class="prog" aria-hidden="true"><i id="bar"></i></div>
  <p class="count mono" id="count" aria-live="polite"></p>
  <button type="button" class="nb" id="prev" aria-label="${c.ui.prev}">↑</button>
  <button type="button" class="nb" id="next" aria-label="${c.ui.next}">↓</button>
  <button type="button" class="nb fs" id="fs" aria-label="${c.ui.fs}">⛶</button>
</nav>
<p class="hint mono" id="hint" aria-hidden="true">${c.ui.hint}</p>
<script src="${PREZ_PATH}prez.js" defer></script>
</body>
</html>
`;
    const out = join(pub, ...base.split("/").filter(Boolean));
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "index.html"), html);
    if (lang === "en") for (const f of ["prez.css", "prez.js"]) writeFileSync(join(out, f), readFileSync(join(root, "site", "prezentare", f)));
    console.log(`[prezentare] ${base} (${lang}) -> ${N} slides, ${streets.length} streets, ${totP} projects, private`);
    return N;
  }
}
