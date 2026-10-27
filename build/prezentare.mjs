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

export const PREZ_PATH = "/prezentare/proces-5000932d55/";

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
// the copy's own markup: [[word|c|l]] a tilted pill, **bold**
const md = (s) => String(s)
  .replace(/\[\[([^|\]]+)\|(\w)(?:\|([lr]))?\]\]/g, (m, t, c, tl) => `<span class="pill pill-${c}${tl ? ` tilt-${tl}` : ""}">${t}</span>`)
  .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

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
  // every picture and film waits in data-src: prez.js hands it out as its slide comes near (the rest once idle)
  const img = (k, cls = "", alt = "") => { const s = src(k); return s ? `<img class="${cls}" data-src="${s}" alt="${esc(alt)}" decoding="async" draggable="false">` : ""; };
  const vid = (k, cls = "") => { const s = src(k); return s ? `<video class="${cls}" data-src="${s}" muted loop playsinline preload="none" aria-hidden="true"></video>` : ""; };

  let n = 0;
  for (const [lang, c] of Object.entries(COPY)) n = page(lang, c, lang === "en" ? PREZ_PATH : `${PREZ_PATH}${lang}/`);
  return n;

  function page(lang, c, base) {
    const slides = [];
    // theme: paper | grid | ink | yellow | green | purple | blue | coral; kind: build (sub-steps) | row | pan
    const S = (theme, part, title, body, cls = "", kind = "build") => slides.push({ theme, part, title, html: body, cls, kind });
    const eb = (t, r) => `<p class="eyebrow mono a"${r ? ` data-r="${r}"` : ""}>${t}</p>`;
    const h2 = (t, cls = "h2") => `<h2 class="${cls} a">${md(t)}</h2>`;
    const lead = (t) => `<p class="lead a">${md(t)}</p>`;
    const deliver = (t, r) => `<p class="deliver a"${r ? ` data-r="${r}"` : ""}><span class="mono">${c.ui.deliverable}</span><b>${t}</b></p>`;
    const step = (k) => `<p class="stepk mono a"><span class="pill pill-b sm">${c.ui.step} ${k}</span> ${c.ui.of} 4 · ${c.ui.phase2}</p>`;
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
      <ul class="ticks big">${c.studio.ticks.map((t, i) => `<li class="a" data-r="${i + 1}">${md(t)}</li>`).join("")}</ul>
    </div>
    <div class="col photos3" data-front>
      ${img("/onboarding/media/studio/s5.webp", "ph p1 a", c.studio.alts[0])}
      ${img("/onboarding/media/studio/s3.webp", "ph p2 a", c.studio.alts[1])}
      ${img("/onboarding/media/studio/s0.webp", "ph p3 a", c.studio.alts[2])}
    </div>
  </div>`, "s-studio");

    // ---------- 3 · people: the crew with their lines, the three principles one by one ----------
    S("ink", c.people.part, c.people.title, `
  <div class="stack">
    ${eb(c.people.eyebrow)}${h2(c.people.h)}
    <div class="three">${c.people.cols.map(([k, t], i) => `<div class="a" data-r="${i + 1}"><p class="k mono">${k}</p><p>${t}</p></div>`).join("")}</div>
    <ul class="crew">${c.people.crew.map(([f, nm, line]) => `<li class="a" tabindex="0">${img(`/onboarding/media/crew/${f}.webp`, "", nm)}<b>${esc(nm)}</b><span>${esc(line)}</span></li>`).join("")}</ul>
  </div>`, "s-people");

    // ---------- 4 · branding process: one word per press ----------
    S("yellow", c.process.part, c.process.title, `
  <div class="stack mid">
    ${eb(c.process.eyebrow)}
    <h2 class="d2 words">${c.process.words.map((w, i) => `<span class="w a" data-r="${i}">${i === c.process.words.length - 1 ? `<span class="pill pill-w tilt-r">${w}</span>` : w}</span>`).join("")}</h2>
    <div class="a" data-r="${c.process.words.length - 1}">${lead(c.process.lead)}</div>
  </div>`, "s-process");

    // ---------- 5 · brand = perception: the typographic moment ----------
    S("ink", c.perception.part, c.perception.title, `
  <div class="percep">
    <p class="pa a" aria-hidden="true">${c.perception.a}</p>
    <p class="peq a" aria-hidden="true">=</p>
    <p class="pb a" aria-hidden="true">${c.perception.b}</p>
    <h2 class="pl"><span class="l1 a" data-r="1">${c.perception.l1}</span><span class="l2 a" data-r="2">${md(c.perception.l2)}</span></h2>
  </div>`, "s-percep");

    // ---------- 6 · from core to market: a road drawn station by station ----------
    const ph = c.road.phases;
    S("grid", c.road.part, c.road.title, `
  <div class="stack">
    ${eb(c.road.eyebrow)}${h2(c.road.h)}
    <div class="route">
      <div class="route-line" aria-hidden="true"><i></i></div>
      <ol>${ph.map((p, i) => `<li class="st ph-${p.c} a" data-r="${i + 1}"><span class="dot"><b class="mono">${pad(i + 1)}</b></span><p class="k mono">${p.k}</p><h3>${p.t}</h3><ul>${p.items.map((x) => `<li>${x}</li>`).join("")}</ul></li>`).join("")}</ol>
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
        ${i === 2 ? `<p class="one mono">1 sentence</p>` : ""}
      </div>`).join("")}
    </div>
  </div>`, "s-core3");

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
    <div class="g2">${[0, 1].map((g) => `<div class="grp a" data-r="${g + 1}"><p class="gk mono"><span class="pill pill-${g ? "y" : "g"} sm">${c.covers.groups[g]}</span></p><ul class="grid4c">${c.covers.items.slice(g * 4, g * 4 + 4).map(([t, d], i) => `<li style="--j:${i}"><span class="n mono">${pad(g * 4 + i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul></div>`).join("")}</div>
  </div>`, "s-covers");

    // ---------- 11–14 · the workshop ----------
    const steps4 = (on) => `<ol class="steps4 a" aria-label="${fill(c.ws.stepsLabel, { n: on })}">${c.ws.steps.map((t, i) => `<li class="${i + 1 === on ? "on" : ""}"><span class="mono">${i + 1}</span>${t}</li>`).join("")}</ol>`;
    // attributes: a cloud of chips; three fly into the value slots
    const at = c.attr;
    S("paper", c.ws.part, at.title, `
  <div class="split">
    <div class="col">${steps4(1)}${eb(at.eyebrow)}${h2(at.h)}${lead(at.lead)}<p class="note a" data-r="2">${at.note}</p></div>
    <div class="col attr">
      <div class="cloud a">${at.chips.map((t, i) => { const k = at.pick.indexOf(i); return `<span class="chip${k >= 0 ? ` pick pk${k + 1}` : ""}" style="--j:${i}">${t}</span>`; }).join("")}</div>
      <div class="slots a" data-r="1"><p class="k mono">${at.slots}</p><div class="sl3">${at.pick.map((ci, k) => `<span class="vslot" style="--j:${k}"><i class="mono">${k + 1}</i><b>${at.chips[ci]}</b></span>`).join("")}</div></div>
    </div>
  </div>`, "s-attr");
    // archetypes: the wheel; the two of the mix light up, any segment can be tapped
    const ar = c.arch, N12 = ar.list.length;
    const seg = (i) => { const a0 = (i / N12) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / N12) * 2 * Math.PI - Math.PI / 2, R1 = 200, R0 = 92, g = 0.012;
      const p = (r, a) => `${(250 + r * Math.cos(a)).toFixed(1)} ${(250 + r * Math.sin(a)).toFixed(1)}`;
      return `M${p(R1, a0 + g)} A${R1} ${R1} 0 0 1 ${p(R1, a1 - g)} L${p(R0, a1 - g)} A${R0} ${R0} 0 0 0 ${p(R0, a0 + g)} Z`; };
    const lab = (i) => { const a = ((i + 0.5) / N12) * 2 * Math.PI - Math.PI / 2; return [250 + 146 * Math.cos(a), 250 + 146 * Math.sin(a)]; };
    const mixIdx = ar.mix.map(([m]) => ar.list.indexOf(m));
    S("paper", c.ws.part, ar.title, `
  <div class="split">
    <div class="col">${steps4(2)}${eb(ar.eyebrow)}${h2(ar.h)}${lead(ar.lead)}
      <div class="mix a" data-r="2"><p class="k mono">${ar.example}</p><div class="mixbar"><i class="m1" style="width:${ar.mix[0][1]}%"><b>${ar.mix[0][0]} ${ar.mix[0][1]}%</b></i><i class="m2" style="width:${ar.mix[1][1]}%"><b>${ar.mix[1][0]} ${ar.mix[1][1]}%</b></i></div></div>
    </div>
    <div class="col wheelc">
      <svg class="wheel a" viewBox="0 0 500 500" role="group" aria-label="${esc(ar.title)}">
        ${ar.list.map((t, i) => { const [x, y] = lab(i), k = mixIdx.indexOf(i); return `<g class="sg${k >= 0 ? ` mx mx${k + 1}` : ""}" data-i="${i}" tabindex="0" role="button" aria-label="${t}"><path d="${seg(i)}"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${t}</text></g>`; }).join("")}
        <circle cx="250" cy="250" r="78" class="hub"/><text x="250" y="244" class="hub-t">12</text><text x="250" y="270" class="hub-s">archetypes</text>
      </svg>
      <p class="caption mono a">${ar.tap}</p>
    </div>
  </div>`, "s-arch");
    // user profiles: a profile card that fills in, layer by layer
    const us = c.users;
    S("paper", c.ws.part, us.title, `
  <div class="split">
    <div class="col">${steps4(3)}${eb(us.eyebrow)}${h2(us.h)}${lead(us.lead)}</div>
    <div class="col">
      <div class="profile a">
        <div class="pf-top"><span class="av" aria-hidden="true"><i></i></span><div><p class="k mono">${us.who}</p><p class="bars"><i></i><i></i></p></div></div>
        ${us.steps.map(([t, d], i) => `<div class="pf-row" data-r="${i + 1}"><span class="n mono">${pad(i + 1)}</span><div><h3>${t}</h3><p>${d}</p></div><p class="bars"><i></i><i></i><i></i></p></div>`).join("")}
      </div>
    </div>
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

    // ---------- 18 · guidelines: the pages turn ----------
    const gu = c.guide;
    S("paper", gu.part, gu.title, `
  <div class="split">
    <div class="col">
      ${eb(gu.eyebrow)}${h2(gu.h)}${lead(gu.lead)}
      <ol class="toc a">${gu.pages.map(([, t], i) => `<li data-r="${i}" class="tc"><span class="mono">${pad(i + 1)}</span>${t}</li>`).join("")}</ol>
    </div>
    <div class="col bookc">
      <div class="book2 a">${gu.pages.map(([k, t], i) => `<figure class="pg" data-r="${i}" style="--z:${gu.pages.length - i}">${img(k, "", t)}</figure>`).join("")}</div>
      <p class="caption mono a">${gu.caption}</p>
    </div>
  </div>`, "s-guide");

    // ---------- 19 · divider: to market ----------
    divider(c.dMkt, "blue");

    // ---------- 20 · touchpoints: a marker walks the stage track ----------
    const tc = c.touch;
    S("paper", tc.part, tc.title, `
  <div class="stack">
    ${step(1)}${h2(tc.h)}${lead(tc.lead)}
    <ol class="track6" style="--n:${tc.stages.length}">${tc.stages.map(([s, q], i) => `<li class="a keep" data-r="${i + 1}"><span class="pin mono">${pad(i + 1)}</span><b>${s}</b><p>${q}</p></li>`).join("")}<i class="walker" aria-hidden="true"></i></ol>
    ${deliver(tc.deliver)}
  </div>`, "s-touch");

    // ---------- 21 · website: devices with the real sites scrolling inside, one site per press ----------
    const wb = c.web;
    S("paper", wb.part, wb.title, `
  <div class="split w-split">
    <div class="col">${step(2)}${h2(wb.h)}${lead(wb.lead)}
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

    // ---------- 22 · communication: the four pillars, one by one ----------
    const cm = c.comms;
    S("paper", cm.part, cm.title, `
  <div class="stack">
    ${step(3)}${h2(cm.h)}${lead(cm.lead)}
    <ul class="pillars">${cm.items.map(([t, d], i) => `<li class="a" data-r="${i + 1}"><span class="n mono">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul>
    ${deliver(cm.deliver)}
  </div>`, "s-comms");

    // ---------- 23 · content: the site's own films and reels, playing ----------
    const ct = c.content;
    S("ink", ct.part, ct.title, `
  <div class="split c-split">
    <div class="col">${step(4)}${h2(ct.h)}${lead(ct.lead)}${deliver(ct.deliver)}</div>
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
  ${row(ex.items.map(([k, nm, what, slug]) => `<a class="card ph" href="/work/${slug}/" data-case="${slug}" target="_blank" rel="noopener"><span class="cm">${img(k, "", `${nm}, ${what}`)}</span><span class="cb"><b>${esc(nm)}</b><span class="mono">${esc(what)}</span></span></a>`).join(""))}
  ${hint(c.ui.rowHint)}`, "s-row s-exp", "row");

    // ---------- 25 · the work: the four streets drawn as roads, one per press ----------
    const w = c.work;
    const totP = streets.reduce((a, s) => a + s.list.length, 0), totC = streets.reduce((a, s) => a + s.cases, 0);
    const sign = (s) => `<span class="sign" style="--sc:${s.col};--st:${s.ink}">${esc(s.street)}</span>`;
    S("ink", w.part, w.title, `
  <div class="stack">
    ${eb(w.eyebrow)}
    <div class="row-h">${h2(w.h)}<div>${lead(w.lead)}<p class="tot mono a">${fill(w.total, { projects: totP, cases: totC })}</p></div></div>
    <ol class="roads">${streets.map((s, i) => `<li class="a keep" data-r="${i + 1}" style="--sc:${s.col}">${sign(s)}<span class="road"><i class="asph"></i>${s.list.map((p, j) => `<i class="pt${p.page ? " cs" : ""}" style="--j:${j}"></i>`).join("")}</span><span class="st-n mono">${s.list.length} ${w.projects} · ${s.cases} ${s.cases === 1 ? w.caseOne : w.cases}</span><span class="st-t">${esc(s.t)}</span></li>`).join("")}</ol>
  </div>`, "s-roads");

    // ---------- 26… · one slide per street: its row of cards ----------
    const card = (p) => {
      const media = p.cover ? `<img data-src="${p.cover}" alt="" decoding="async" draggable="false">` : `<span class="poster" style="background:${p.c};color:${p.t}">${esc(p.poster || p.name)}</span>`;
      const tag = p.page ? `<span class="tag mono">${w.readCase} ↗</span>` : p.wip ? `<span class="tag mono wip">${w.wip}</span>` : "";
      const inner = `<span class="cm" style="--bc:${p.c}">${media}${tag}</span><span class="cb"><b>${esc(p.name)}</b><span class="mono">${esc(p.cat)}</span><span class="cd">${esc(p.desc || "")}</span></span>`;
      return p.page ? `<a class="card" href="/work/${p.page}/" data-case="${p.page}" target="_blank" rel="noopener">${inner}</a>` : `<div class="card" tabindex="-1">${inner}</div>`;
    };
    for (const s of streets) {
      S("paper", fill(w.streetPart, { street: s.street }), s.street, `
  <div class="rhead wk-h" style="--sc:${s.col}">
    <div class="a">${sign(s)}<h2 class="h3">${esc(s.t)}</h2></div>
    <p class="wk-n mono a">${s.list.length} ${w.projects} · ${s.cases} ${s.cases === 1 ? w.caseOne : w.cases}</p>
  </div>
  ${row(s.list.map(card).join(""))}
  ${hint(c.ui.rowHint)}`, "s-row s-street", "row");
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
    const body = slides.map((s, i) => `<section class="slide t-${s.theme} ${s.cls}" id="s${i + 1}" data-kind="${s.kind}" data-theme="${s.theme}" data-part="${esc(s.part)}" aria-roledescription="slide" aria-label="${i + 1} ${c.ui.of} ${N}: ${esc(s.title)}"><div class="in">${s.html}</div></section>`).join("\n");
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
