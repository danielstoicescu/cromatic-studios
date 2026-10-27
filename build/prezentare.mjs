// r322 (Daniel, 27 Oct): /prezentare/proces-<code>/, the studio's process as a deck for live meetings, often on a big
// TV. One fold per step: the page moves by whole slides (site/prezentare/prez.js), never resting halfway. Content from
// the Google Slides credentials deck (Cromatic_Studios_25), brought to today's offer.
// r325: the portfolio is the website's own listing, whole, from the same data (R.workStreets in site/render.mjs); the
// words live in prezentare-copy.mjs, by language (en now, ro later at <path>ro/).
// r329 (Daniel: "now it's very plain, think about every fold and what UX opportunity exists on each one"): every fold
// has its own idea, driven by the pager's sub-steps (data-r="k" on what appears at step k; data-kind="row" for a
// horizontal row with a card cursor, "pan" for the Brand Canvas panned across its length), real site media throughout
// (long website captures in device frames, the reels and films, the packaging photos), and the streets of the site's
// portfolio as rows like the end of /onboarding/, each case opening in an overlay.
// PRIVATE, like /rapoarte/: written after the pass over public/ (no footer, no cookie card, no GA4), never in PAGES (no
// sitemap, no llms.txt), noindex in the page and in server.js's headers (no-store, no referrer), linked from nowhere.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { COPY } from "./prezentare-copy.mjs";
import { ARCHETYPES, QUADRANTS, ORDER, ZONE, archArt, archArtG } from "./prezentare-archetypes.mjs";
import { roPath } from "./i18n.mjs";
// r336: the portfolio's street ids, for ?streets=coffee,fintech,medical (any subset, in the site's order; default all):
// A Coffee Street, B Fintech Boulevard, C Medical Avenue (D The Shortest Shortcut is left out of the deck)
export const STREET_IDS = { A: "coffee", B: "fintech", C: "medical", D: "shortcut" };

export const PREZ_PATH = "/prezentare/proces-5000932d55/";

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
// the copy's own markup: [[word|c|l]] a tilted pill, **bold**
// {{core}}: The Core 3.0 as its pill with the turning rainbow ring (site.css .hc-mv, The Core's CoreMark)
const CORE = `<span class="corep"><b>The Core</b><sup>3.0</sup></span>`;
const md = (s) => String(s)
  .replace(/\{\{core\}\}/g, CORE)
  .replace(/\[\[([^|\]]+)\|(\w)(?:\|([lr]))?\]\]/g, (m, t, c, tl) => `<span class="pill pill-${c}${tl ? ` tilt-${tl}` : ""}">${t}</span>`)
  .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

export async function buildPrezentare({ root, pub, mediaMap, COVERS, canvases, R }) {
  const warn = (m) => console.warn(`[prezentare] ${m}`);
  // r332 (Daniel): the deck leaves out The Shortest Shortcut and the Zdrovit park; a street's case count is its own cards'
  const SKIP_STREETS = new Set(["D"]);
  // r336: the Romanian deck takes the projects' names, categories and descriptions from the site's own dictionary
  let RO = new Map();
  try { RO = new Map(Object.entries(JSON.parse(readFileSync(join(root, "site", "i18n", "ro.json"), "utf8"))).map(([k, v]) => [String(k).replace(/\s+/g, " ").trim(), v])); } catch (e) { warn("no site/i18n/ro.json: " + e.message); }
  const roOf = (t) => { const k = String(t ?? "").replace(/\s+/g, " ").trim(); const v = RO.get(k) ?? RO.get(k.replace(/&/g, "&amp;")); return v != null && v !== "" ? v : null; };
  const streets = R.workStreets(COVERS).filter((s) => !SKIP_STREETS.has(s.k)).map((s) => ({ ...s, zd: [], cases: new Set(s.list.filter((p) => p.page).map((p) => p.page)).size }));
  const src = (k) => {
    if (!k) return "";
    if (k.startsWith("/")) return k;
    const a = mediaMap.get(k);
    if (!a) { warn(`missing media ${k}`); return ""; }
    return a.src;
  };
  // every picture and film waits in data-src: prez.js hands it out as its slide comes near (the rest once idle)
  const img = (k, cls = "", alt = "") => { const s = src(k); return s ? `<img class="${cls}" data-src="${s}" alt="${esc(alt)}" decoding="async" draggable="false">` : ""; };
  const vid = (k, cls = "") => { const s = src(k); return s ? `<video class="${cls}" data-src="${s}" muted loop playsinline preload="none" aria-hidden="true"></video>` : ""; };

  let n = 0;
  for (const [lang, c] of Object.entries(COPY)) n = page(lang, c, lang === "en" ? PREZ_PATH : `${PREZ_PATH}${lang}/`);
  return n;

  function page(lang, c, base) {
    const slides = [];
    // a site string in the deck's language (RO through the site's dictionary, already HTML-safe), and a case's page
    const T = (t) => (lang === "ro" ? roOf(t) ?? esc(t) : esc(t));
    const caseUrl = (slug) => (lang === "ro" ? roPath(`/work/${slug}/`) || `/work/${slug}/` : `/work/${slug}/`);
    // theme: paper | grid | ink | yellow | green | purple | blue | coral; kind: build (sub-steps) | row | pan
    const S = (theme, part, title, body, cls = "", kind = "build", street = "") => slides.push({ theme, part, title, html: body, cls, kind, street });
    const eb = (t, r) => `<p class="eyebrow mono a"${r ? ` data-r="${r}"` : ""}>${md(t)}</p>`;
    const h2 = (t, cls = "h2") => `<h2 class="${cls} a">${md(t)}</h2>`;
    const lead = (t) => `<p class="lead a">${md(t)}</p>`;
    const deliver = (t, r) => `<p class="deliver a"${r ? ` data-r="${r}"` : ""}><span class="mono">${c.ui.deliverable}</span><b>${t}</b></p>`;
    // r336: the Phase II slides carry "What comes after branding?" as a small corner label, and their place among the three
    const step = (k) => `<p class="stepk mono a"><span class="pill pill-b sm">${k}</span> ${c.after.label}</p>`;
    const divider = (t, theme) => S(theme, t.part, t.title, `
  <div class="divider">
    <p class="big-n mono a" aria-hidden="true">${t.n}</p>
    ${eb(t.eyebrow)}${h2(t.h, "d1")}${lead(t.lead)}
  </div>`, "s-div");
    const hint = (t) => `<p class="rhint mono a" aria-hidden="true">${t}</p>`;

    // ---------- 1 · cover: the pill turns its word (as the intro's opening turns place → facade → brand) ----------
    S("ink", c.cover.part, c.cover.title, `
  <div class="shapes" aria-hidden="true"><i class="sh-p a"></i><i class="sh-r a"></i><i class="sh-c a"></i><i class="sh-d a"></i></div>
  <div class="cover">
    <i class="cup xxl a" aria-hidden="true"></i>
    ${eb(c.cover.eyebrow)}
    <h1 class="d1 a">${c.cover.h1} <span class="turn pill pill-y tilt-l" data-words="${esc(JSON.stringify(c.cover.words))}">${c.cover.words[0]}</span></h1>
    ${lead(c.cover.lead)}
    <p class="cover-foot mono a">${c.cover.foot}</p>
  </div>`, "s-cover");

    // ---------- 2 · the studio: three statements, each brings its photo to the front ----------
    S("paper", c.studio.part, c.studio.title, `
  <div class="split">
    <div class="col">
      ${eb(c.studio.eyebrow)}${h2(c.studio.h)}${lead(c.studio.lead)}
      <ul class="ticks big">${c.studio.ticks.map((t, i) => `<li class="a">${md(t)}</li>`).join("")}</ul>
    </div>
    <div class="col photos3">
      ${img("/onboarding/media/studio/s5.webp", "ph p1 a", c.studio.alts[0])}
      ${img("/onboarding/media/studio/s3.webp", "ph p2 a", c.studio.alts[1])}
      ${img("/onboarding/media/studio/s0.webp", "ph p3 a", c.studio.alts[2])}
    </div>
  </div>`, "s-studio");

    // ---------- 3 · people: the crew with their lines, the three principles one by one ----------
    S("ink", c.people.part, c.people.title, `
  <div class="stack">
    ${eb(c.people.eyebrow)}${h2(c.people.h)}
    <div class="three">${c.people.cols.map(([k, t], i) => `<div class="a"><p class="k mono">${k}</p><p>${t}</p></div>`).join("")}</div>
    <ul class="crew">${c.people.crew.map(([f, nm, line]) => `<li class="a" tabindex="0">${img(`/onboarding/media/crew/${f}.webp`, "", nm)}<b>${esc(nm)}</b><span>${esc(line)}</span></li>`).join("")}</ul>
  </div>`, "s-people");

    // ---------- 4 · branding process: one word per press ----------
    S("yellow", c.process.part, c.process.title, `
  <div class="stack mid">
    ${eb(c.process.eyebrow)}
    <h2 class="d2 words">${c.process.words.map((w, i) => `<span class="w a">${i === c.process.words.length - 1 ? `<span class="pill pill-w tilt-r">${w}</span>` : w}</span>`).join("")}</h2>
    ${lead(c.process.lead)}
  </div>`, "s-process");

    // ---------- 5 · brand = perception: the deck's equation, big and readable ----------
    S("ink", c.perception.part, c.perception.title, `
  <div class="stack mid percep">
    ${eb(c.perception.eyebrow)}
    <p class="eqn a" role="heading" aria-level="2"><span class="pill pill-y tilt-l">${c.perception.a}</span><span class="eq-s">=</span><span class="pill pill-b tilt-r">${c.perception.b}</span></p>
    <p class="pline a">${md(c.perception.line)}</p>
  </div>`, "s-percep");

    // ---------- 6 · from core to market: a road drawn station by station ----------
    const ph = c.road.phases;
    S("grid", c.road.part, c.road.title, `
  <div class="stack">
    ${eb(c.road.eyebrow)}${h2(c.road.h)}
    <div class="route">
      <div class="route-line" aria-hidden="true"><i></i></div>
      <ol>${ph.map((p, i) => `<li class="st ph-${p.c} a" data-r="${i + 1}"><span class="dot"><b class="mono">${pad(i + 1)}</b></span><p class="k mono">${p.k}</p><h3>${md(p.t)}</h3><ul>${p.items.map((x) => `<li>${x}</li>`).join("")}</ul></li>`).join("")}</ol>
    </div>
  </div>`, "s-route");

    // ---------- 7 · divider: The Core ----------
    divider(c.dCore, "green");

    // ---------- 8 · how The Core works: the three steps, each opening onto what's inside ----------
    const ch = c.coreHow;
    S("paper", ch.part, ch.title, `
  <div class="stack">
    ${eb(ch.eyebrow)}${h2(ch.h)}
    <div class="core3">
      ${ch.cards.map(([k, t, d], i) => `<div class="cc cc-${i + 1} a" data-r="${i + 1}"><span class="n mono">${pad(i + 1)}</span><p class="k mono">${k}</p><h3>${t}</h3><p>${d}</p>
        ${i === 0 ? `<ol class="mods">${ch.modules.map((m, j) => `<li style="--j:${j}"><span class="mono">${pad(j + 1)}</span>${m}</li>`).join("")}</ol>` : ""}
        ${i === 1 ? `<ol class="agenda">${ch.agenda.map((m, j) => `<li style="--j:${j}"><span class="mono">${pad(j + 1)}</span>${m}</li>`).join("")}</ol>` : ""}
        ${i === 2 ? `<ol class="result">${ch.result.map((m, j) => `<li style="--j:${j}">${m}</li>`).join("")}</ol>` : ""}
      </div>`).join("")}
    </div>
  </div>`, "s-core3");

    // ---------- the result: one document, everything it holds as one list ----------
    const dc = c.doc;
    S("paper", dc.part, dc.title, `
  <div class="split doc-split">
    <div class="col">${eb(dc.eyebrow)}${h2(dc.h)}${lead(dc.lead)}
      <ol class="dlist">${dc.items.map((x, j) => `<li style="--j:${j}"><span class="mono">${pad(j + 1)}</span>${x}</li>`).join("")}</ol>
    </div>
    <div class="col docc">
      <div class="docm a">
        <div class="dp dp3"></div><div class="dp dp2"></div>
        <div class="dp dp1"><p class="mono dk">${dc.client}</p>${CORE}<p class="dt">${dc.cover}</p><p class="mono dct">${dc.contents}</p><ol class="dtoc">${dc.items.map((x, j) => `<li style="--j:${j}"><span class="mono">${pad(j + 1)}</span><i></i></li>`).join("")}</ol></div>
      </div>
    </div>
  </div>`, "s-doc");

    // ---------- 9 · the sentence: its slots light one after another, then the X factor ----------
    S("ink", c.uvp.part, c.uvp.title, `
  <div class="stack mid">
    ${eb(c.uvp.eyebrow)}
    <h2 class="h3 a">${c.uvp.h}</h2>
    <p class="uvp a">${(() => { let j = 0; return c.uvp.sentence.replace(/\{([^}]+)\}/g, (m, t) => `<span class="slot" style="--j:${j++}">${t}</span>`); })()}</p>
    <div class="xf a" data-r="1"><span class="pill pill-y">${c.uvp.xf}</span><p>${c.uvp.xfText}</p></div>
  </div>`, "s-uvp");

    // ---------- 10 · what it covers: positioning, then culture ----------
    S("grid", c.covers.part, c.covers.title, `
  <div class="stack">
    ${eb(c.covers.eyebrow)}${h2(c.covers.h)}
    <ul class="grid8c a">${c.covers.items.map(([t, d], i) => `<li style="--j:${i}"><span class="n mono">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul>
  </div>`, "s-covers");

    // ---------- 11–14 · the workshop ----------
    const steps4 = (on) => `<ol class="steps4 a" aria-label="${fill(c.ws.stepsLabel, { n: on })}">${c.ws.steps.map((t, i) => `<li class="${i + 1 === on ? "on" : ""}"><span class="mono">${i + 1}</span>${t}</li>`).join("")}</ol>`;
    // attributes: six pillars (The Core's core6: culture, clients, voice, emotions, impact, X factor); the words fall in
    const at = c.attr;
    S("paper", c.ws.part, at.title, `
  <div class="split attr-split">
    <div class="col">${steps4(1)}${eb(at.eyebrow)}${h2(at.h)}${lead(at.lead)}<p class="note a">${at.note}</p></div>
    <div class="col">
      <ol class="pillars6">${at.pillars.map(([id, t, hint, words], i) => `<li class="p6 p6-${id}" style="--pi:${i}"><div class="p6-words">${words.map((x, j) => `<span class="w6" style="--wj:${j};--dx:${((i * 37 + j * 53) % 7) - 3};--rot:${((i * 29 + j * 17) % 13) - 6}deg">${x}</span>`).join("")}</div><div class="p6-base"><b>${t}</b><span>${hint}</span></div></li>`).join("")}</ol>
    </div>
  </div>`, "s-attr");
    // archetypes: The Core's own wheel (ArchWheel.tsx): four zones by what drives them, the twelve drawings, turning
    // slowly; each press lights the next zone (until then they take turns by themselves); tap a zone to hold it
    const ar = c.arch, lang2 = c.htmlLang === "ro" ? "ro" : "en", QN = QUADRANTS[lang2];
    const WC = 160, polar = (r, deg) => { const a = ((deg - 90) * Math.PI) / 180; return [WC + r * Math.cos(a), WC + r * Math.sin(a)]; };
    const arcP = (r0, r1, a0, a1) => { const [x0, y0] = polar(r1, a0), [x1, y1] = polar(r1, a1), [x2, y2] = polar(r0, a1), [x3, y3] = polar(r0, a0); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`; };
    const darkC = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 110; };
    const byQ = ORDER.map((q) => ({ q, xs: ARCHETYPES.filter((x) => x.q === q) }));
    const ICON = 40;
    const wheelSvg = `<svg class="cwheel a" viewBox="0 0 320 320" role="group" aria-label="${esc(ar.title)}"><g class="wh-spin">${byQ.map(({ q, xs }, qi) => { const a0 = qi * 90 + 2, a1 = qi * 90 + 88;
      return `<g class="wh-zone" data-q="${q}" data-zi="${qi}"><path d="${arcP(118, 152, a0, a1)}" fill="${ZONE[q]}" stroke="#0d0c09" stroke-width="2"/><path class="wh-in" d="${arcP(56, 116, a0, a1)}" fill="${ZONE[q]}"/>${xs.map((x, i) => { const [cx, cy] = polar(88, qi * 90 + (90 / xs.length) * (i + 0.5));
        return `<g transform="translate(${cx.toFixed(2)} ${cy.toFixed(2)})"><g class="wh-up"><circle r="${ICON / 2 + 2}" fill="${x.color}" stroke="#0d0c09" stroke-width="1.5"/><g transform="translate(${-ICON / 2} ${-ICON / 2}) scale(${ICON / 120})">${archArtG(x.id, darkC(x.color))}</g></g></g>`; }).join("")}</g>`; }).join("")}</g>
      <circle cx="${WC}" cy="${WC}" r="44" fill="#fbfaf5" stroke="#0d0c09" stroke-width="2"/><text x="${WC}" y="${WC + 4}" text-anchor="middle" class="wh-n">${ARCHETYPES.length}</text><text x="${WC}" y="${WC + 20}" text-anchor="middle" class="wh-sub">${ar.center}</text></svg>`;
    S("paper", c.ws.part, ar.title, `
  <div class="split arch-split">
    <div class="col">${steps4(2)}${eb(ar.eyebrow)}${h2(ar.h)}${lead(ar.lead)}
      <div class="wh-zones a">${byQ.map(({ q, xs }, qi) => `<button type="button" class="wh-z" data-q="${q}" data-r="${qi + 1}" style="--zc:${ZONE[q]}"><b>${esc(QN[q].name)}</b><span>${esc(QN[q].need)}</span><i class="mono">${xs.map((x) => x.name).join(" · ")}</i></button>`).join("")}</div>
    </div>
    <div class="col wheelc">${wheelSvg}<p class="caption mono a">${ar.tap}</p></div>
  </div>`, "s-arch");
    // archetypes, with the brands The Core gives as examples for each
    const ae = c.archEx, mx = ae.mix.map(([id, pc]) => [ARCHETYPES.find((x) => x.id === id), pc]);
    S("paper", c.ws.part, ae.title, `
  <div class="stack">
    <div class="row-h">${h2(ae.h)}<div class="mix a"><p class="k mono">${ae.mixLabel}</p><div class="mixbar">${mx.map(([x, pc], i) => `<i class="m${i + 1}" style="width:${pc}%;background:${x.color}"><b${darkC(x.color) ? ' style="color:#fbfaf5"' : ""}>${x.name} ${pc}%</b></i>`).join("")}</div></div></div>
    <ul class="agrid">${byQ.flatMap(({ q, xs }) => xs.map((x) => `<li class="ac a" style="--ac:${x.color};--zc:${ZONE[q]}"><span class="ai">${archArt(x.id, darkC(x.color), 120)}</span><div><b>${x.name}</b><p class="am">${esc(x.motto[lang2])}</p><p class="ax mono">${ae.eg} ${esc(x.example)}</p></div></li>`)).join("")}</ul>
  </div>`, "s-archex");

    // user profiles: the first card fills by itself, then a second (green) and a third (red) stack on top: a deck of personas
    const us = c.users;
    const pcard = (k) => `<div class="profile pf-${k}" style="--k:${k}">
        <div class="pf-top"><span class="av" aria-hidden="true"><i></i></span><div><p class="k mono">${us.who[k]}</p><p class="bars"><i></i><i></i></p></div></div>
        ${us.steps.map(([t, d], i) => `<div class="pf-row" style="--r:${i}"><span class="n mono">${pad(i + 1)}</span><div><h3>${t}</h3><p>${d}</p></div><p class="bars"><i></i><i></i><i></i></p></div>`).join("")}
      </div>`;
    S("paper", c.ws.part, us.title, `
  <div class="split">
    <div class="col">${steps4(3)}${eb(us.eyebrow)}${h2(us.h)}${lead(us.lead)}</div>
    <div class="col"><div class="pstack a">${[0, 1, 2].map(pcard).join("")}</div></div>
  </div>`, "s-profile");
    // goals: the tree grows
    const go = c.goals;
    S("paper", c.ws.part, go.title, `
  <div class="split">
    <div class="col">${steps4(4)}${eb(go.eyebrow)}${h2(go.h)}${lead(go.lead)}</div>
    <div class="col">
      <div class="tree">
        <span class="pill pill-y big a">${go.goal}</span>
        <svg class="tw" viewBox="0 0 400 110" preserveAspectRatio="none" aria-hidden="true"><path class="a" data-r="1" pathLength="100" d="M200 0 V40 M200 40 H40 V110 M200 40 H360 V110 M200 40 V110"/></svg>
        <div class="leaves">${go.actions.map((t, i) => `<span class="pill pill-w a" data-r="1" style="--j:${i}">${t}</span>`).join("")}</div>
      </div>
    </div>
  </div>`, "s-goals");

    // ---------- 15 · divider: identity ----------
    divider(c.dId, "purple");

    // ---------- 16 · three directions: they arrive, then one is chosen ----------
    const di = c.dirs;
    S("paper", di.part, di.title, `
  <div class="stack">
    ${eb(di.eyebrow)}${h2(di.h)}${lead(di.lead)}
    <ol class="dirs">${di.items.map(([k, d], i) => `<li class="dir d-${i + 1} a"><div class="art" aria-hidden="true"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div><p class="k mono">${k}</p><p>${d}</p>${i === 1 ? `<span class="chosen pill pill-y sm">${di.chosen}</span>` : ""}</li>`).join("")}</ol>
    ${deliver(di.deliver)}
  </div>`, "s-dirs");
    // the choice is its own press (the slide marks it with data-r on an invisible flag)
    slides[slides.length - 1].html += `<i class="flag" data-r="1" hidden></i>`;

    // ---------- 17 · the brand canvas, big, panned across its full length ----------
    const cv = canvases["oma-coffee"];
    let board = "";
    if (cv) {
      const { w: W, h: H, base: cb, items, bg } = cv;
      const pos = (b) => `left:${(b[0] / W * 100).toFixed(3)}%;top:${((H - b[3]) / H * 100).toFixed(3)}%;width:${((b[2] - b[0]) / W * 100).toFixed(3)}%`;
      const el = (it) => `<img class="cv-el" data-src="${cb}/${it.file}" alt="" decoding="async" draggable="false" style="${pos(it.box)}">`;
      board = `<div class="board" style="aspect-ratio:${(W / H).toFixed(4)}" role="img" aria-label="${esc(c.canvas.alt)}">${items.filter((i) => i.under).map(el).join("")}${bg ? (bg.solid ? `<div class="cv-bg" style="background:${bg.solid}"></div>` : `<img class="cv-bg" data-src="${cb}/${bg.file}" alt="" decoding="async" draggable="false">`) : ""}${items.filter((i) => !i.under).map(el).join("")}</div>`;
    } else warn("the OMA Coffee canvas is missing");
    S("paper", c.canvas.part, c.canvas.title, `
  <div class="cv-head">
    <div>${eb(c.canvas.eyebrow)}${h2(c.canvas.h)}</div>
    ${lead(c.canvas.lead)}
  </div>
  <div class="hscroll pan a" data-h>${board}</div>
  <div class="cv-foot a"><p class="caption mono">${c.canvas.caption}</p><div class="pbar" aria-hidden="true"><i></i></div></div>
  ${hint(c.ui.panHint)}`, "s-canvas", "pan");

    // ---------- 18 · guidelines: an open booklet of real Venevo spreads; each press turns the page to the next chapter ----------
    const gu = c.guide;
    S("paper", gu.part, gu.title, `
  <div class="split guide-split">
    <div class="col">
      ${eb(gu.eyebrow)}${h2(gu.h)}${lead(gu.lead)}
      <ol class="chap a">${gu.chapters.map(([t, d], i) => `<li data-r="${i}"><span class="mono">${pad(i + 1)}</span><div><b>${t}</b><p>${d}</p></div></li>`).join("")}</ol>
    </div>
    <div class="col bookc">
      <div class="booklet a">${gu.chapters.map(([t, , l, r], i) => `<div class="spread" data-r="${i}" style="--z:${gu.chapters.length - i}"><figure class="pl">${img(l, "", t)}</figure><figure class="pr">${img(r, "", t)}</figure></div>`).join("")}<i class="spine" aria-hidden="true"></i></div>
      <p class="caption mono a">${gu.caption}</p>
    </div>
  </div>`, "s-guide");

    // ---------- 19 · Phase II: what comes after branding? ----------
    const af = c.after;
    S("blue", af.part, af.title, `
  <div class="divider after">
    <p class="big-n mono a" aria-hidden="true">${af.n}</p>
    ${eb(af.eyebrow)}${h2(af.h, "d1")}${lead(af.lead)}
    <ol class="after3">${af.steps.map(([n, t, d]) => `<li class="a"><span class="mono">${n}</span><b>${t}</b><p>${d}</p></li>`).join("")}</ol>
  </div>`, "s-div s-after");

    // ---------- 20 · touchpoints: the journey as one roadmap (the deck's slide 19): six stages, the mood curve over them,
    // what people feel, need and ask, where to meet them, and the team's behaviours; all at once, drawn in on arrival
    const tc = c.touch, NS = tc.stages.length;
    const mpts = tc.mood.map((m, i) => [((i + 0.5) / NS) * 1000, 100 - m * 86]);
    const mpath = mpts.map(([x, y], i) => (i ? `S${(x - 1000 / NS / 2).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}` : `M${x.toFixed(1)} ${y.toFixed(1)}`)).join(" ");
    S("paper", tc.part, tc.title, `
  <div class="stack journey">
    ${step(tc.step)}${h2(tc.h)}<p class="lead a jl">${md(tc.lead)}</p>
    <div class="jmap a" style="--n:${NS}">
      <p class="jmood mono">${tc.moodLabel}</p>
      <div class="jcv" aria-hidden="true"><svg class="jcurve" viewBox="0 0 1000 100" preserveAspectRatio="none"><path d="${mpath}" pathLength="100"/></svg>
      ${mpts.map(([x, y], i) => `<i class="jdot" style="left:${(x / 10).toFixed(2)}%;top:${y.toFixed(1)}%;--i:${i}"></i>`).join("")}</div>
      <ol class="jst">${tc.stages.map(([s, f, nd, q, where], i) => `<li style="--i:${i}"><span class="pin mono">${pad(i + 1)}</span><b>${s}</b>
        <dl><dt class="mono">${tc.rows[0]}</dt><dd>${f}</dd><dt class="mono">${tc.rows[1]}</dt><dd>${nd}</dd><dt class="mono">${tc.rows[2]}</dt><dd class="q">${q}</dd></dl>
        <p class="jw">${where.map((x) => `<span>${x}</span>`).join("")}</p></li>`).join("")}</ol>
    </div>
    <div class="jin a"><b class="mono">${tc.inside}</b><p class="jdo"><span class="pill pill-g sm">${tc.doLabel}</span>${tc.dos.join(" · ")}</p><p class="jdont"><span class="pill pill-r sm">${tc.dontLabel}</span>${tc.donts.join(" · ")}</p></div>
    ${deliver(tc.deliver)}
  </div>`, "s-touch");

    // ---------- 21 · website: devices with the real sites scrolling inside, one site per press ----------
    const wb = c.web;
    S("paper", wb.part, wb.title, `
  <div class="split w-split">
    <div class="col">${step(wb.step)}${h2(wb.h)}${lead(wb.lead)}
      <ul class="ticks">${wb.ticks.map((t) => `<li class="a">${md(t)}</li>`).join("")}</ul>
      <ol class="sitepick a">${wb.sites.map(([nm], i) => `<li data-r="${i}" class="tc"><span class="mono">${pad(i + 1)}</span>${nm}</li>`).join("")}</ol>
    </div>
    <div class="col devices a">
      ${wb.sites.map(([nm, d, m], i) => `<div class="dset" data-r="${i}">
        <div class="laptop"><div class="scr"><div class="scroll">${img(d, "", nm)}</div></div><i class="base"></i></div>
        <div class="phone"><div class="scr"><div class="scroll">${img(m, "", nm)}</div></div></div>
      </div>`).join("")}
    </div>
  </div>`, "s-web");

    // ---------- 23 · content: the site's own films and reels, playing ----------
    const ct = c.content;
    S("ink", ct.part, ct.title, `
  <div class="split c-split">
    <div class="col">${step(ct.step)}${h2(ct.h)}${lead(ct.lead)}${deliver(ct.deliver)}</div>
    <div class="col films">${ct.films.map(([k, cap, f], i) => `<figure class="film ${f} a" style="--j:${i}">${vid(k)}<figcaption class="mono">${cap}</figcaption></figure>`).join("")}</div>
  </div>`, "s-content");

    // ---------- the rows: cards that a cursor walks along (← →), a case opens in an overlay ----------
    const row = (cards) => `<div class="hscroll rows a" data-h><div class="hrow">${cards}</div></div>`;
    // ---------- 24 · brand experiences: the real packaging, as a row ----------
    const ex = c.exp;
    S("coral", ex.part, ex.title, `
  <div class="rhead">
    <div>${eb(ex.eyebrow)}${h2(ex.h)}</div>
    <div>${lead(ex.lead)}${deliver(ex.deliver)}</div>
  </div>
  ${row(ex.items.map(([k, nm, what, slug]) => `<a class="card ph" href="${caseUrl(slug)}" data-case="${slug}" target="_blank" rel="noopener"><span class="cm">${img(k, "", `${nm}, ${what}`)}</span><span class="cb"><b>${esc(nm)}</b><span class="mono">${esc(what)}</span></span></a>`).join(""))}
  ${hint(c.ui.rowHint)}`, "s-row s-exp", "row");

    // ---------- 25 · the work: the four streets drawn as roads, one per press ----------
    const w = c.work;
    const totP = streets.reduce((a, s) => a + s.list.length, 0), totC = streets.reduce((a, s) => a + s.cases, 0);
    const sign = (s) => `<span class="sign" style="--sc:${s.col};--st:${s.ink}">${T(s.street)}</span>`;
    const cnt = (p, k) => `${p} ${w.projects} · ${k} ${k === 1 ? w.caseOne : w.cases}`;
    S("ink", w.part, w.title, `
  <div class="stack">
    ${eb(w.eyebrow)}
    <div class="row-h">${h2(w.h)}<div>${lead(w.lead)}<p class="tot mono a" data-tpl="${esc(w.total)}">${fill(w.total, { projects: totP, cases: totC })}</p></div></div>
    <ol class="roads">${streets.map((s, i) => `<li class="a" data-street="${STREET_IDS[s.k]}" data-p="${s.list.length}" data-c="${s.cases}" style="--sc:${s.col}">${sign(s)}<span class="road"><i class="asph"></i>${s.list.map((p, j) => `<i class="pt${p.page ? " cs" : ""}" style="--j:${j}"></i>`).join("")}</span><span class="st-n mono">${cnt(s.list.length, s.cases)}</span><span class="st-t">${T(s.t)}</span></li>`).join("")}</ol>
  </div>`, "s-roads");

    // ---------- 26… · one slide per street: its row of cards ----------
    const card = (p) => {
      const media = p.cover ? `<img data-src="${p.cover}" alt="" decoding="async" draggable="false">` : `<span class="poster" style="background:${p.c};color:${p.t}">${esc(p.poster || p.name)}</span>`;
      const tag = p.page ? `<span class="tag mono">${w.readCase} ↗</span>` : p.wip ? `<span class="tag mono wip">${w.wip}</span>` : "";
      const inner = `<span class="cm" style="--bc:${p.c}">${media}${tag}</span><span class="cb"><b>${T(p.name)}</b><span class="mono">${T(p.cat)}</span><span class="cd">${p.desc ? T(p.desc) : ""}</span></span>`;
      return p.page ? `<a class="card" href="${caseUrl(p.page)}" data-case="${p.page}" target="_blank" rel="noopener">${inner}</a>` : `<div class="card" tabindex="-1">${inner}</div>`;
    };
    for (const s of streets) {
      S("paper", fill(w.streetPart, { street: s.street }), s.street, `
  <div class="rhead wk-h" style="--sc:${s.col}">
    <div class="a">${sign(s)}<h2 class="h3">${T(s.t)}</h2></div>
    <p class="wk-n mono a">${cnt(s.list.length, s.cases)}</p>
  </div>
  ${row(s.list.map(card).join(""))}
  ${hint(c.ui.rowHint)}`, "s-row s-street", "row", STREET_IDS[s.k]);
      if (s.zd.length) {
        S("paper", fill(w.streetPart, { street: s.street }), `${s.street}: Zdrovit`, `
  <div class="rhead wk-h" style="--sc:${s.col}">
    <div class="a">${sign(s)}<h2 class="h3">${w.zdTitle}</h2></div>
    <p class="wk-n mono a">${s.zd.filter((b) => b.page).length} ${w.cases}</p>
  </div>
  ${row(s.zd.map((b) => card({ name: b.name, cat: b.line, cover: b.cover, page: b.page, c: "#e30613", t: "#fff", poster: b.name })).join(""))}
  ${hint(c.ui.rowHint)}`, "s-row s-street s-zd", "row");
      }
    }

    // ---------- last · thank you ----------
    S("yellow", c.thanks.part, c.thanks.title, `
  <div class="stack mid thanks">
    <i class="cup xxl a" aria-hidden="true"></i>
    <h2 class="d1 a">${c.thanks.h}</h2>
    <ul class="ty">${c.thanks.items.map(([col, k, href, t]) => `<li class="a"><span class="pill pill-${col} sm">${k}</span>${href ? `<a href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${t}</a>` : `<span>${t}</span>`}</li>`).join("")}</ul>
  </div>`, "s-thanks");

    const N = slides.length;
    const body = slides.map((s, i) => `<section class="slide t-${s.theme} ${s.cls}" id="s${i + 1}" data-kind="${s.kind}"${s.street ? ` data-street="${s.street}"` : ""} data-theme="${s.theme}" data-part="${esc(s.part)}" aria-roledescription="slide" aria-label="${i + 1} ${c.ui.of} ${N}: ${esc(s.title)}"><div class="in">${s.html}</div></section>`).join("\n");
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
<script>(function(){var q=location.search,m=/[?&]lang=(ro|en)(?:&|$)/.exec(q);if(m&&m[1]!=="${lang}"){location.replace((m[1]==="ro"?"${PREZ_PATH}ro/":"${PREZ_PATH}")+q.replace(/([?&])lang=(ro|en)(&|$)/,"$1").replace(/[?&]$/,"")+location.hash)}})();</script>
<script>document.documentElement.classList.add("js");try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("rm")}catch(e){}</script>
</head>
<body data-theme="ink">
<div class="deck" id="deck">
<div class="track" id="track">
${body}
</div>
</div>
<header class="chrome top">
  <p class="frame"><span class="tri">▶</span><b>Cromatic Studios</b> <span class="sl">//</span> ${c.frame}</p>
  <p class="part mono" id="part"></p>
  <nav class="langs mono" aria-label="${c.ui.lang}"><a href="${PREZ_PATH}" hreflang="en" lang="en"${lang === "en" ? ' aria-current="true"' : ""}>EN</a><a href="${PREZ_PATH}ro/" hreflang="ro" lang="ro"${lang === "ro" ? ' aria-current="true"' : ""}>RO</a></nav>
</header>
<nav class="chrome bot" aria-label="${c.ui.slides}">
  <div class="prog" aria-hidden="true"><i id="bar"></i></div>
  <p class="dots" id="dots" aria-hidden="true"></p>
  <p class="count mono" id="count" aria-live="polite"></p>
  <button type="button" class="nb" id="prev" aria-label="${c.ui.prev}">↑</button>
  <button type="button" class="nb" id="next" aria-label="${c.ui.next}">↓</button>
  <button type="button" class="nb fs" id="fs" aria-label="${c.ui.fs}">⛶</button>
</nav>
<div class="ov" id="ov" hidden role="dialog" aria-modal="true" aria-label="${c.ui.open}">
  <div class="ov-bar"><p class="mono" id="ov-t"></p><a class="ov-b mono" id="ov-new" href="#" target="_blank" rel="noopener">${c.ui.newTab} ↗</a><button type="button" class="ov-b mono" id="ov-x">${c.ui.close} ✕</button></div>
  <iframe id="ov-f" title="${c.ui.open}" loading="lazy"></iframe>
</div>
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
