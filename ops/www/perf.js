// TASK-141 · /ops Performance (admins only). Reads GET /api/ops/perf (ops/metrics.mjs): nothing here calls Google.
// A run is started with POST /api/ops/perf/run and goes on in the background, on the server, with this page closed too.
// The big number is the median of the last 3 fresh runs; a page Lighthouse cannot measure has no number at all, never 0.
(() => {
  "use strict";
  const body = document.getElementById("prf-body");
  if (!body) return;
  const stamp = document.getElementById("prf-n");
  const NS = "http://www.w3.org/2000/svg";
  const STRAT = { mobile: "Telefon", desktop: "Desktop" };
  const CAT = { FAST: ["good", "Rapid"], AVERAGE: ["mid", "Mediu"], SLOW: ["bad", "Lent"] };
  const FIELD = [["LCP", "Conținut principal", "LCP"], ["FCP", "Primul conținut", "FCP"], ["CLS", "Stabilitatea paginii", "CLS"], ["TTFB", "Răspunsul serverului", "TTFB"], ["INP", "Răspuns la atingeri și clicuri", "INP"]];
  const NARROW = matchMedia("(max-width: 760px)"); // the chart is drawn for its width, so its labels stay readable on a phone
  const SLUG = { "/": "home", "/ro/": "ro", "/city/": "city" };
  const ui = { repPage: "/", repSt: "mobile", field: "origin", trendS: "mobile", trendM: "performance" };
  let data = null, lastJson = "", timer = 0, message = "", busy = false;

  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  const ic = (id) => { const s = document.createElementNS(NS, "svg"); s.setAttribute("class", "ic"); s.setAttribute("aria-hidden", "true"); const u = document.createElementNS(NS, "use"); u.setAttribute("href", "#" + id); s.append(u); return s; };
  const fx = (v, d) => Number(v).toLocaleString("ro-RO", { maximumFractionDigits: d, minimumFractionDigits: d });
  const ms = (v) => (v == null ? "–" : v >= 1000 ? fx(v / 1000, 1) + " s" : Math.round(v) + " ms");
  const cls = (v) => (v == null ? "–" : fx(v, 2));
  const band = (s) => (s == null ? "none" : s >= 90 ? "good" : s >= 50 ? "mid" : "bad");
  const dayKey = (d) => d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  function when(iso) {
    const d = new Date(iso); if (!iso || isNaN(d)) return "";
    const t = d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }), n = new Date(), y = new Date(Date.now() - 864e5);
    if (dayKey(d) === dayKey(n)) return "azi, " + t;
    if (dayKey(d) === dayKey(y)) return "ieri, " + t;
    return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" }).replace(".", "") + ", " + t;
  }
  const day = (iso) => new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
  const dot = (k) => el("span", "prf-dot " + k);
  /** "**word**" is the house style's one emphasised word, as an <em>; everything else stays plain text */
  function rich(node, text) { String(text || "").split(/\*\*(.+?)\*\*/).forEach((p, i) => node.append(i % 2 ? el("em", "", p) : p)); return node; }
  const sec = (title, lede) => { const s = el("section", "prf-sec"); s.append(el("h3", "", title)); if (lede) s.append(el("p", "prf-lede", lede)); return s; };
  function seg(label, opts, cur, onPick) {
    const g = el("div", "seg"); g.setAttribute("role", "group"); g.setAttribute("aria-label", label);
    for (const [v, t] of opts) { const b = el("button", "", t); b.type = "button"; b.setAttribute("aria-pressed", String(v === cur)); b.onclick = () => onPick(v); g.append(b); }
    return g;
  }

  // ---------- the one action ----------
  function actions() {
    const box = el("div", "prf-act"), b = el("button", "btn sm k"), t = el("span", "prf-act-t"); b.type = "button"; b.id = "prf-run"; t.setAttribute("aria-live", "polite");
    const D = data, wait = D.manualNextAt && Date.parse(D.manualNextAt) > Date.now();
    b.append(ic("i-gauge"), el("span", "", D.running ? "Măsor…" : "Măsoară acum"));
    b.disabled = !D.configured || !!D.running || !!wait || busy;
    if (!D.configured) t.textContent = "Lipsește PSI_API_KEY pe server. Se vede ultima măsurătoare salvată.";
    else if (D.running) t.textContent = "Măsor " + (D.running.done + 1 > D.running.total ? D.running.total : D.running.done + 1) + " din " + D.running.total + (D.running.current ? ": " + D.running.current.path + " pe " + STRAT[D.running.current.strategy].toLowerCase() : "") + ". Durează câteva minute și continuă și dacă închizi pagina.";
    else if (wait) t.textContent = "Următoarea măsurătoare manuală poate porni la " + new Date(D.manualNextAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }) + ".";
    else t.textContent = "Automat o dată pe zi, dimineața devreme.";
    if (message) t.textContent = message;
    b.onclick = async () => {
      busy = true; message = ""; render(true);
      try {
        const r = await fetch("/api/ops/perf/run", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
        const j = await r.json().catch(() => ({}));
        if (r.status === 429) message = "Se poate o măsurătoare la 15 minute.";
        else if (r.status === 409) message = "O măsurătoare e deja în curs.";
        else if (r.status === 503) message = "Lipsește PSI_API_KEY pe server.";
        else if (!r.ok || !j.ok) message = "Măsurătoarea n-a pornit (" + r.status + ").";
      } catch { message = "Măsurătoarea n-a pornit: nu am ajuns la server."; }
      busy = false; await refresh(true);
    };
    box.append(b, t); return box;
  }

  // ---------- the lead conclusion: the live median for one page, phone and desktop ----------
  // The numbers come from the same headline as the score panels below, never from the content file. They count up from 01
  // once per visit to this section. The node is reused across re-renders, so a data refresh neither restarts nor cuts the count.
  const COUNT_MS = 900, COUNT_FROM = 1;
  const pad2 = (n) => String(n).padStart(2, "0");
  const stillMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // one counter per card: rings and figures run on the same clock, once per visit to the section
  function makeCounter(targetSel) {
    const c = { key: "", node: null, nums: [], counted: false, raf: 0, guard: 0, io: null };
    const put = (x, v) => { x.el.textContent = pad2(v); if (x.arc) x.arc.setAttribute("stroke-dashoffset", String(100 - v)); };
    const finish = () => { cancelAnimationFrame(c.raf); clearTimeout(c.guard); c.raf = 0; for (const x of c.nums) put(x, x.to); };
    function count() {
      if (c.counted) return;
      c.counted = true;
      if (c.io) c.io.disconnect();
      if (stillMotion() || !c.nums.length) return finish();
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / COUNT_MS), e = 1 - Math.pow(1 - k, 3);
        for (const x of c.nums) put(x, Math.max(COUNT_FROM, Math.round(COUNT_FROM + (x.to - COUNT_FROM) * e)));
        if (k < 1) c.raf = requestAnimationFrame(step); else finish();
      };
      c.raf = requestAnimationFrame(step);
      c.guard = setTimeout(finish, COUNT_MS + 600); // a hidden tab has no animation frames: the real number still lands
    }
    function arm() {
      if (c.io) c.io.disconnect();
      if (c.counted || !c.nums.length) return;
      if (stillMotion() || !("IntersectionObserver" in window)) { c.counted = true; return finish(); }
      for (const x of c.nums) put(x, COUNT_FROM);
      c.io = new IntersectionObserver((list) => { if (list.some((i) => i.isIntersecting)) count(); }, { threshold: .6, rootMargin: "0px 0px -72px 0px" }); // when the numbers themselves are in view, clear of the phone's bottom bar
      c.io.observe(c.node.querySelector(targetSel));
    }
    return {
      // the node is reused while its data is the same, so a refresh neither restarts nor cuts the count
      keep(key, build) {
        if (c.key === key && c.node) return c.node;
        if (c.io) c.io.disconnect();
        if (c.raf) { finish(); c.counted = true; } // the numbers changed during a count: land on the new ones
        const made = build();
        c.key = key; c.node = made.node; c.nums = made.nums;
        arm();
        return c.node;
      },
      leave() { cancelAnimationFrame(c.raf); clearTimeout(c.guard); c.raf = 0; c.counted = false; if (c.node) arm(); },
    };
  }
  const heroC = makeCounter(".prf-figs");
  function hero(lead) {
    const F = lead.figures, P = (data.pages || []).find((p) => p.path === F.path), of = (st) => { const h = P && P.strategies[st] && P.strategies[st].headline; return h && h.performance != null ? { v: Math.round(h.performance), n: h.n } : null; };
    const m = of("mobile"), d = of("desktop"), vals = [m, d].filter(Boolean), low = vals.some((x) => x.v < F.goodFrom);
    const text = !vals.length ? F.textNone : low ? F.textBelow : lead.text, prov = vals.some((x) => x.n < data.window);
    const key = JSON.stringify([m, d, text, F.path]);
    return heroC.keep(key, () => {
    const card = el("div", "prf-verdict"), head = el("div", "prf-verdict-h"), mark = el("span", "prf-verdict-i"), figs = el("div", "prf-figs" + (vals.some((x) => x.v >= 100) ? " d3" : ""));
    mark.append(ic("i-gauge"));
    head.append(mark, rich(el("p"), text));
    const nums = [];
    for (const [st, x] of [["mobile", m], ["desktop", d]]) {
      if (!x) { const f = el("div", "prf-fig"); f.append(el("span", "prf-fig-l", STRAT[st]), el("span", "prf-fig-none", "Fără scor Google")); figs.append(f); continue; }
      const f = el("button", "prf-fig"); f.type = "button"; f.title = "Arată raportul pentru " + STRAT[st].toLowerCase(); f.onclick = () => openReport(F.path, st); f.append(el("span", "prf-fig-l", STRAT[st]));
      const n = el("b", "", pad2(x.v)); n.style.width = Math.max(2, String(x.v).length) + "ch"; n.setAttribute("aria-hidden", "true");
      const sr = el("span", "prf-sr", "scor " + x.v + " din 100");
      f.append(n, sr); figs.append(f); nums.push({ el: n, to: x.v });
    }
    const cap = el("div", "prf-verdict-c", !vals.length ? "Google n-a reușit încă să măsoare " + F.path + "." : prov ? "Provizoriu pentru " + F.path + ": încă nu sunt " + data.window + " măsurători." : "Scorul de performanță pentru " + (P ? P.label + " (" + F.path + ")" : F.path) + ", mediana ultimelor " + data.window + " măsurători.");
    card.append(head, figs, cap);
    return { node: card, nums };
    });
  }

  // ---------- Concluzii ----------
  // {{mobile.LCP}} and {{mobile.LCP.cat}} in the content file read the newest CrUX data for the whole site; a conclusion whose numbers are missing is left out, never shown half
  function crux(tok) {
    const [st, key, part] = tok.split("."), m = data.field && data.field.origin && data.field.origin[st] && data.field.origin[st].metrics && data.field.origin[st].metrics[key];
    if (!m) return null;
    if (part === "cat") return CAT[m.cat] ? CAT[m.cat][1] : null;
    return key === "CLS" ? cls(m.p75) : ms(m.p75);
  }
  function fillText(t) { let miss = false; const out = String(t || "").replace(/\{\{([\w.]+)\}\}/g, (_, k) => { const v = crux(k); if (v == null) miss = true; return v == null ? "" : v; }); return miss ? null : out; }
  const leadOf = (C) => (Array.isArray(C.conclusions) ? C.conclusions : []).find((x) => x.lead);
  function verdict(C) { const lead = leadOf(C); return lead ? (lead.figures ? hero(lead) : rich(el("p", "prf-verdict-t"), lead.text)) : null; }
  function conclusions(C) {
    const rest = (Array.isArray(C.conclusions) ? C.conclusions : []).filter((x) => !x.lead);
    if (!rest.length) return null;
    const s = sec("Concluzii"), ul = el("ul", "prf-cons");
    for (const c of rest) {
      const text = fillText(c.text); if (text == null) continue;
      let tone = { good: "good", watch: "mid", bad: "bad" }[c.tone] || "none";
      if (c.toneFrom) { const [st, key] = c.toneFrom.split("."), m = data.field.origin[st] && data.field.origin[st].metrics[key]; tone = m && CAT[m.cat] ? CAT[m.cat][0] : "none"; }
      const li = el("li"); li.append(dot(tone), rich(el("span"), text)); ul.append(li);
    }
    s.append(ul);
    if (C.writtenAt) s.append(el("div", "prf-asof", "Scrise pe " + day(C.writtenAt) + ". Cifrele din cardul galben și cele de la vizitatorii reali se actualizează singure, restul textului nu."));
    return s;
  }

  // ---------- scores ----------
  function reason(last) {
    const e = last && last.error; if (!e) return "Google n-a întors încă un scor pentru pagina asta.";
    const secs = last.ms ? " după circa " + Math.round(last.ms / 1000) + " s" : "";
    if (e.http && e.http >= 400 && e.http < 500) return "Google a refuzat cererea (HTTP " + e.http + (e.message ? ": „" + e.message + "”" : "") + "). Nu e o problemă a paginii.";
    if (e.http && e.http < 400 || e.http >= 500) return "Lighthouse eșuează pe pagina asta" + secs + (e.http ? ", HTTP " + e.http : "") + (e.message ? ": „" + String(e.message).replace(/\.$/, "") + "”" : "") + ".";
    return e.message || "Google n-a răspuns" + secs + ".";
  }
  // Google's own limits, per device, the same ones behind its colours: good up to the first number, poor over the second
  const TH = {
    mobile: { fcpMs: [1800, 3000], lcpMs: [2500, 4000], tbtMs: [200, 600], cls: [.1, .25], speedIndexMs: [3400, 5800] },
    desktop: { fcpMs: [934, 1600], lcpMs: [1200, 2400], tbtMs: [150, 350], cls: [.1, .25], speedIndexMs: [1311, 2300] },
  };
  const METRICS = [["fcpMs", "Primul conținut", "FCP"], ["lcpMs", "Conținut principal", "LCP"], ["tbtMs", "Blocaj", "TBT"], ["cls", "Salt de pagină", "CLS"], ["speedIndexMs", "Viteza de afișare", "Speed Index"]];
  const WORD = { good: "Bun", mid: "De îmbunătățit", bad: "Slab" };
  const mk = (k) => el("span", "prf-mk " + k);
  const shotCache = new Map();
  function ring(v, cls) {
    const w = el("div", "prf-ring " + cls + " " + band(v)), svg = document.createElementNS(NS, "svg"), R = cls === "big" ? 45 : 42;
    svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("aria-hidden", "true");
    const c = (k) => { const n = document.createElementNS(NS, "circle"); n.setAttribute("cx", 50); n.setAttribute("cy", 50); n.setAttribute("r", R); n.setAttribute("class", k); n.setAttribute("pathLength", 100); return n; };
    const arc = c("prf-ring-a"); arc.setAttribute("transform", "rotate(-90 50 50)"); arc.setAttribute("stroke-dasharray", "100 100"); arc.setAttribute("stroke-dashoffset", String(100 - v));
    svg.append(c("prf-ring-t"), arc);
    const b = el("b", "", pad2(v)); b.setAttribute("aria-hidden", "true");
    w.append(svg, b);
    return { w, num: { el: b, to: v, arc } };
  }
  function small(label, v, nums) {
    const f = el("div", "prf-sring");
    if (v == null) { f.append(el("div", "prf-ring small none"), el("span", "", label + ": fără scor")); return f; }
    const r = ring(Math.round(v), "small"); nums.push(r.num);
    f.append(r.w, el("span", "", label), el("span", "prf-sr", "scor " + Math.round(v) + " din 100")); return f;
  }
  function metricRow(key, name, code, v, st) {
    const row = el("div", "prf-m"), head = el("div", "prf-m-h"), n = el("span", "prf-m-n"); n.append(name, el("small", "", code));
    const [g, m] = TH[st][key], f = key === "cls" ? cls : ms;
    if (v == null) { head.append(n, el("span", "prf-m-w", "fără date")); row.append(head); return row; }
    const k = v <= g ? "good" : v <= m ? "mid" : "bad", w = el("span", "prf-m-w"); w.append(mk(k), WORD[k]);
    head.append(n, w, el("b", "", f(v)));
    const pos = v <= g ? v / g / 3 : v <= m ? (1 + (v - g) / (m - g)) / 3 : (2 + Math.min(1, (v - m) / m)) / 3;
    const bar = el("div", "prf-m-b"); bar.setAttribute("aria-hidden", "true"); bar.append(el("i", "good"), el("i", "mid"), el("i", "bad"));
    const dot = el("span", "prf-m-d " + k); dot.style.left = (pos * 100).toFixed(1) + "%"; bar.append(dot);
    const ticks = el("div", "prf-m-t"); ticks.setAttribute("aria-hidden", "true"); ticks.append(el("span", "", f(g)), el("span", "", f(m)));
    row.append(head, bar, ticks); return row;
  }
  function deviceFrame(path, st, S) {
    const box = el("figure", "prf-dev " + st), screen = el("div", "prf-dev-s"), cap = el("figcaption", "prf-dev-c");
    if (st === "desktop") box.append(el("div", "prf-dev-b", "cromaticstudios.com" + path));
    box.append(screen, cap);
    if (!S.shot) { screen.append(el("span", "prf-dev-e", "Captura apare după următoarea măsurătoare. Cele vechi n-au păstrat-o.")); cap.textContent = "Fără captură încă."; return { box }; }
    cap.textContent = "Captură din ultima măsurătoare, " + when(S.shot.at) + ".";
    const img = el("img"); img.alt = "Cum arată " + path + " pe " + STRAT[st].toLowerCase() + " la finalul încărcării"; img.decoding = "async"; screen.append(img);
    return { box, img };
  }
  async function fillShot(key, S, img, film) {
    const id = key + "@" + S.shot.at;
    try {
      if (!shotCache.has(id)) { const r = await fetch("/api/ops/perf/shot/" + key, { credentials: "same-origin", cache: "no-store" }); const j = await r.json(); if (!j.ok) throw new Error("shot"); shotCache.set(id, j); }
      const j = shotCache.get(id);
      img.src = j.final;
      if (film) for (const t of j.thumbs || []) { const f = el("figure"), i = el("img"); i.src = t.data; i.alt = ""; f.append(i, el("figcaption", "", fx(t.ms / 1000, 1) + " s")); film.append(f); }
    } catch { img.replaceWith(el("span", "prf-dev-e", "Captura nu s-a putut citi acum.")); }
  }
  const repC = makeCounter(".prf-ring.big");
  function repCard(D) {
    const P = D.pages.find((p) => p.path === ui.repPage) || D.pages[0], st = ui.repSt, S = P.strategies[st], H = S.headline;
    const key = JSON.stringify([P.path, st, H, S.shot, S.last && S.last.ok, D.window]);
    return repC.keep(key, () => {
      const card = el("div", "prf-rep " + st), nums = [];
      if (!H) {
        card.classList.add("none");
        card.append(el("div", "prf-none", "Fără scor Google"), el("p", "prf-why", reason(S.last)), el("p", "prf-why", "Nu e 0 și nu e un scor mic. Google n-a reușit să măsoare, deci nu desenăm nimic."));
        return { node: card, nums };
      }
      const left = el("div", "prf-rep-l"), v = Math.round(H.performance), big = ring(v, "big"), prov = H.n < D.window; nums.push(big.num);
      if (prov) big.w.classList.add("prov");
      const title = el("div", "prf-rep-t"); title.append(el("b", "", "Performance"), el("span", "prf-sr", "scor " + v + " din 100"));
      const smalls = el("div", "prf-srings"); smalls.append(small("Accesibilitate", H.accessibility, nums), small("Bune practici", H.bestPractices, nums), small("SEO", H.seo, nums));
      const key2 = el("div", "prf-key"); [["bad", "0 până la 49"], ["mid", "50 până la 89"], ["good", "90 până la 100"]].forEach(([k, t]) => { const x = el("span"); x.append(mk(k), t); key2.append(x); });
      left.append(big.w, title, smalls, key2);
      const mid = el("div", "prf-rep-m"); for (const [k, n, c] of METRICS) mid.append(metricRow(k, n, c, H[k], st));
      const dev = deviceFrame(P.path, st, S);
      const foot = el("div", "prf-rep-f"), how = el("p");
      if (prov) how.append(el("strong", "", "Provizoriu. "), (H.n === 1 ? "O singură măsurătoare" : H.n + " măsurători") + " din cele " + D.window + " care fac cifrele sigure.");
      else how.append("Mediana ultimelor " + D.window + " măsurători (" + H.samples.join(", ") + "). Fiecare cifră de aici e mediana ei, deci nu vin toate din aceeași rulare. Doar captura e din ultima.");
      foot.append(how, el("p", "", st === "mobile" ? "Telefon emulat, pe 4G lent, în laboratorul Lighthouse. Nu e telefonul unui vizitator." : "Desktop emulat, pe o conexiune rapidă, în laboratorul Lighthouse."));
      if (S.last && !S.last.ok) { const w = el("p", "prf-warn"); w.append(mk("mid"), el("span", "", "Ultima încercare a eșuat (" + when(S.last.at) + "). Cifrele vin din măsurătorile reușite.")); foot.append(w); }
      const film = S.shot && S.shot.thumbs ? el("div", "prf-film") : null;
      card.append(left, mid, dev.box);
      if (film) card.append(film);
      card.append(foot);
      if (dev.img) fillShot(SLUG[P.path] + "-" + st, S, dev.img, film);
      return { node: card, nums };
    });
  }
  function report(D) {
    const s = sec("Raportul Google"); s.id = "prf-rep";
    const ctl = el("div", "prf-ctl");
    ctl.append(seg("Pagina", D.pages.map((p) => [p.path, p.path]), ui.repPage, (v) => { ui.repPage = v; render(true); }), seg("Dispozitiv", [["mobile", "Telefon"], ["desktop", "Desktop"]], ui.repSt, (v) => { ui.repSt = v; render(true); }));
    s.append(ctl, repCard(D));
    return s;
  }
  // every page at once: what the report cannot show while it shows one
  function overview(D) {
    const s = sec("Toate paginile"), wrap = el("div", "prf-tcard"), t = el("table", "prf-tbl"), th = el("thead"), tr0 = el("tr"), tb = el("tbody");
    ["Pagina", "Telefon", "Desktop"].forEach((x) => { const c = el("th", "", x); c.scope = "col"; tr0.append(c); }); th.append(tr0); t.append(th);
    for (const P of D.pages) {
      const tr = el("tr"), n = el("td"); n.append(P.label, el("small", "", P.path)); tr.append(n);
      for (const st of ["mobile", "desktop"]) {
        const td = el("td"), S = P.strategies[st], H = S.headline, b = el("button", "prf-ov"); b.type = "button"; b.onclick = () => openReport(P.path, st);
        if (!H) { b.setAttribute("aria-label", P.path + " pe " + STRAT[st].toLowerCase() + ": fără scor Google. Arată motivul."); b.append(el("span", "prf-c", "Fără scor")); }
        else { const v = Math.round(H.performance), l = el("span", "prf-v"); l.append(mk(band(v)), String(v)); b.append(l, el("small", "", H.n < D.window ? "Provizoriu, " + H.n + " din " + D.window : "din " + H.samples.join(", "))); b.setAttribute("aria-label", P.path + " pe " + STRAT[st].toLowerCase() + ": " + v + ". Arată raportul."); }
        td.append(b); tr.append(td);
      }
      tb.append(tr);
    }
    t.append(tb); wrap.append(t); s.append(wrap);
    return s;
  }
  function openReport(path, st) {
    ui.repPage = path; ui.repSt = st; render(true);
    const r = document.getElementById("prf-rep"); if (r) r.scrollIntoView({ block: "start", behavior: stillMotion() ? "auto" : "smooth" });
  }

  // ---------- real visitors ----------
  function fieldCell(block, key) {
    const td = el("td"), m = block && block.metrics && block.metrics[key];
    if (!m) { td.append(el("span", "prf-c", "fără date")); return td; }
    td.append(el("span", "prf-v", key === "CLS" ? cls(m.p75) : ms(m.p75)));
    const c = CAT[m.cat]; if (c) { const x = el("span", "prf-c"); x.append(dot(c[0]), c[1]); td.append(x); }
    return td;
  }
  function field(D) {
    const s = sec("Vizitatori reali", "Date de la Google (CrUX), din Chrome-ul oamenilor care au intrat chiar pe site. Sunt la percentila 75 pe ultimele 28 de zile: trei din patru vizite au fost cel puțin atât de rapide. Nu e o medie și nu e ziua de azi.");
    const pick = ui.field, tabs = [["origin", "Tot site-ul"], ...D.pages.map((p) => [p.path, p.path])];
    const ctl = el("div", "prf-ctl"); ctl.append(seg("Ce date", tabs, pick, (v) => { ui.field = v; render(true); })); s.append(ctl);
    const src = pick === "origin" ? D.field.origin : D.field.pages[pick] || {}, a = src.mobile, b = src.desktop;
    if (!a && !b) { s.append(el("p", "prf-note", pick === "/city/" ? "Google n-a întors date de la vizitatori pentru /city/: măsurarea eșuează înainte să ajungă la ele." : "Google n-are destule vizite pe pagina asta ca să arate cifre.")); return s; }
    const wrap = el("div", "prf-tcard"), t = el("table", "prf-tbl"), th = el("tr");
    [["Ce măsoară"], ["Telefon"], ["Desktop"]].forEach(([x]) => { const c = el("th", "", x); c.scope = "col"; th.append(c); });
    const thead = el("thead"); thead.append(th); t.append(thead); const tb = el("tbody");
    for (const [k, name, code] of FIELD) { const tr = el("tr"), n = el("td"); n.append(name); n.append(el("small", "", code)); tr.append(n, fieldCell(a, k), fieldCell(b, k)); tb.append(tr); }
    t.append(tb); wrap.append(t); s.append(wrap);
    const at = (a && a.at) || (b && b.at), notes = [];
    if (at) notes.push("Citite " + when(at) + ".");
    if (pick !== "origin" && ((a && a.fallback) || (b && b.fallback))) notes.push("Google n-are destule vizite doar pe pagina asta, așa că cifrele sunt pentru tot site-ul.");
    if (notes.length) s.append(el("p", "prf-note", notes.join(" ")));
    return s;
  }

  // ---------- trend ----------
  function trendChart(D) {
    const metric = ui.trendM, st = ui.trendS, isScore = metric === "performance";
    const series = D.pages.map((p) => ({ path: p.path, rows: D.trend.filter((r) => r.path === p.path && r.strategy === st && r[metric] != null).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)) })).filter((x) => x.rows.length);
    const box = el("div", "prf-chart");
    if (!series.length) { box.append(el("div", "empty", "Încă nu e nicio măsurătoare reușită aici.")); return box; }
    const narrow = NARROW.matches, W = narrow ? 360 : 800, H = narrow ? 210 : 230, pl = 36, pr = 14, pt = 12, pb = 26, iw = W - pl - pr, ih = H - pt - pb;
    const all = series.flatMap((x) => x.rows), ts = all.map((r) => Date.parse(r.at)), t0 = Math.min(...ts), t1 = Math.max(...ts), span = t1 - t0;
    const nice = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
    const top = isScore ? 100 : nice(Math.max(1, ...all.map((r) => r[metric])));
    const X = (r) => (span ? pl + (Date.parse(r.at) - t0) / span * iw : pl + iw / 2), Y = (v) => pt + ih - v / top * ih;
    const svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "prf-svg"); svg.setAttribute("role", "img"); svg.tabIndex = 0;
    const fmt = (v) => (isScore ? String(Math.round(v)) : ms(v));
    svg.setAttribute("aria-label", (isScore ? "Scorul de performanță" : "Timpul până la conținutul principal") + " pe " + STRAT[st].toLowerCase() + ". " + series.map((x) => x.path + ": ultima " + fmt(x.rows[x.rows.length - 1][metric])).join(", ") + ".");
    const mk = (tag, at) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); svg.append(n); return n; };
    for (let g = 0; g <= 4; g++) { const v = top / 4 * g, y = Y(v); mk("line", { x1: pl, x2: W - pr, y1: y, y2: y, class: "prf-grid" }); const t = mk("text", { x: pl - 6, y: y + 3, class: "prf-ax", "text-anchor": "end" }); t.textContent = isScore ? String(v) : fx(v / 1000, v < 2000 && v > 0 ? 1 : 0) + "s"; }
    const dates = span ? [t0, t0 + span / 2, t1] : [t0];
    dates.forEach((t, i) => { const a = mk("text", { x: span ? pl + (t - t0) / span * iw : pl + iw / 2, y: H - 7, class: "prf-ax", "text-anchor": !span ? "middle" : i === 0 ? "start" : i === 2 ? "end" : "middle" }); a.textContent = span && span < 36 * 3600e3 ? new Date(t).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }) : new Date(t).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }).replace(".", ""); });
    const guide = mk("line", { y1: pt, y2: pt + ih, class: "prf-guide", visibility: "hidden" });
    const pts = [];
    series.forEach((x, si) => {
      const k = Math.min(si, 1);
      if (x.rows.length > 1) mk("path", { d: x.rows.map((r, i) => (i ? "L" : "M") + X(r).toFixed(1) + " " + Y(r[metric]).toFixed(1)).join(" "), class: "prf-l" + k });
      x.rows.forEach((r) => { mk("circle", { cx: X(r), cy: Y(r[metric]), r: 4.5, class: "prf-p" + k }); pts.push({ x: X(r), y: Y(r[metric]), r, path: x.path }); });
    });
    const tip = el("div", "prf-tip"); tip.hidden = true;
    const show = (q) => { guide.setAttribute("x1", q.x); guide.setAttribute("x2", q.x); guide.setAttribute("visibility", "visible"); tip.replaceChildren(el("b", "", q.path + ": " + fmt(q.r[metric])), el("span", "", when(q.r.at))); tip.hidden = false; tip.style.left = q.x / W * 100 + "%"; tip.classList.toggle("left", q.x > W * .62); };
    const hide = () => { guide.setAttribute("visibility", "hidden"); tip.hidden = true; };
    const near = (e) => { const b = svg.getBoundingClientRect(), mx = (e.clientX - b.left) / b.width * W, my = (e.clientY - b.top) / b.height * H; let best = null, d = Infinity; for (const q of pts) { const c = Math.abs(q.x - mx) * 2 + Math.abs(q.y - my) * .5; if (c < d) { d = c; best = q; } } return best; };
    svg.addEventListener("pointermove", (e) => { const q = near(e); if (q) show(q); }); svg.addEventListener("pointerleave", hide);
    const order = pts.slice().sort((a, b) => a.x - b.x); let ki = order.length - 1;
    svg.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); ki = Math.max(0, Math.min(order.length - 1, ki + (e.key === "ArrowRight" ? 1 : -1))); show(order[ki]); } else if (e.key === "Escape") hide(); }); svg.addEventListener("blur", hide);
    const lg = el("div", "prf-lg");
    series.forEach((x, si) => { const k = Math.min(si, 1), i = el("span"), m = document.createElementNS(NS, "svg"); m.setAttribute("viewBox", "0 0 26 10"); m.setAttribute("aria-hidden", "true"); const l = document.createElementNS(NS, "path"); l.setAttribute("d", "M1 5 H25"); l.setAttribute("class", "prf-l" + k); const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", 13); c.setAttribute("cy", 5); c.setAttribute("r", 3.5); c.setAttribute("class", "prf-p" + k); m.append(l, c); i.append(m, x.path); lg.append(i); });
    const without = D.pages.filter((p) => !series.some((x) => x.path === p.path)).map((p) => p.path);
    if (without.length) lg.append(el("span", "", without.join(", ") + ": fără scor, nu apare"));
    box.append(lg, svg, tip);
    return box;
  }
  function trend(D) {
    const s = sec("În timp", "Fiecare punct e o măsurătoare, așa cum a ieșit. De asta sar uneori, iar cifrele de sus sunt mediane.");
    const ctl = el("div", "prf-ctl");
    ctl.append(seg("Dispozitiv", [["mobile", "Telefon"], ["desktop", "Desktop"]], ui.trendS, (v) => { ui.trendS = v; render(true); }), seg("Ce arată", [["performance", "Scor"], ["lcpMs", "Conținut principal"]], ui.trendM, (v) => { ui.trendM = v; render(true); }));
    s.append(ctl, trendChart(D));
    return s;
  }

  // ---------- city first (static, from the content file) ----------
  function cityFirst(C) {
    const F = C.cityFirst; if (!F || !Array.isArray(F.routes)) return null;
    const s = sec(F.title || "Dacă orașul ar fi prima pagină", F.caveat), grid = el("div", "prf-routes");
    const row = (k, v, big) => { const d = el("div"); d.append(el("dt", "", k), el("dd", big ? "big" : "", v)); return d; };
    for (const r of F.routes) {
      const a = el("article", "prf-rt"), h = el("div", "prf-rt-h"); h.append(el("b", "", r.name)); if (r.note) h.append(el("span", "", r.note)); a.append(h);
      const dv = el("div", "prf-rt-d");
      for (const st of ["mobile", "desktop"]) {
        const x = r[st] || {}, c = el("div"), dl = el("dl");
        c.append(el("h4", "", STRAT[st]));
        if (x.readyMs != null) dl.append(row("Gata de condus", fx(x.readyMs / 1000, 1) + " s", true));
        if (x.contentMs != null) dl.append(row("Primul conținut", ms(x.contentMs), x.readyMs == null));
        if (x.mb != null) dl.append(row("Transferat", fx(x.mb, 1) + " MB"));
        c.append(dl); dv.append(c);
      }
      a.append(dv); grid.append(a);
    }
    s.append(grid);
    if (F.measuredAt) s.append(el("div", "prf-asof", "Măsurat o singură dată, pe " + day(F.measuredAt) + ". Secțiunea asta nu se actualizează singură."));
    return s;
  }

  // ---------- history ----------
  function history(D) {
    if (!D.runs.length) return null;
    const det = el("details", "prf-hist"); det.open = !!ui.histOpen; det.ontoggle = () => { ui.histOpen = det.open; };
    det.append(el("summary", "", "Istoricul măsurătorilor"));
    const wrap = el("div", "prf-tcard"), t = el("table", "prf-tbl"), tr0 = el("tr"), th = el("thead"), tb = el("tbody");
    ["Când", "Cum", "Rezultat"].forEach((x) => { const c = el("th", "", x); c.scope = "col"; tr0.append(c); }); th.append(tr0); t.append(th);
    const WHO = { seed: "audit, punct de pornire", auto: "automat", manual: "manual" };
    for (const r of D.runs) {
      const tr = el("tr"), res = el("td"), parts = [];
      if (r.measured) parts.push(r.measured + (r.measured === 1 ? " măsurată" : " măsurate"));
      if (r.failed) parts.push(r.failed + " fără scor");
      if (r.cached) parts.push(r.cached + " din cache, nenumărate");
      if (r.state === "interrupted") parts.push("întreruptă");
      if (r.state === "running") parts.push("în curs");
      res.append(parts.join(", ") || "fără rezultate");
      const line = D.pages.map((p) => p.path + " " + ["mobile", "desktop"].map((st) => { const x = r.rows.find((y) => y.path === p.path && y.strategy === st); return !x ? "·" : x.ok ? String(x.performance) + (x.cached ? "*" : "") : "fără"; }).join("/")).join("   ");
      res.append(el("div", "prf-runs", line));
      tr.append(el("td", "", when(r.at)), el("td", "", WHO[r.trigger] || r.trigger), res); tb.append(tr);
    }
    t.append(tb); wrap.append(t); det.append(wrap);
    det.append(el("p", "prf-note", "Cifrele sunt telefon/desktop. Cu * e un răspuns din cache-ul Google, care nu intră în mediană."));
    return det;
  }

  function render(force) {
    if (!data) return;
    const J = JSON.stringify(data);
    if (!force && J === lastJson) return;
    lastJson = J;
    const y = window.scrollY, focusId = document.activeElement && document.activeElement.id;
    stamp.textContent = data.lastRunAt ? "ultima măsurătoare " + when(data.lastRunAt) : "";
    const C = data.content || {}, parts = [actions(), verdict(C), report(data), conclusions(C), overview(data), field(data), trend(data), cityFirst(C), history(data)].filter(Boolean);
    body.replaceChildren(...parts);
    if (force) { window.scrollTo({ top: y }); if (focusId) { const f = document.getElementById(focusId); if (f && !f.disabled) f.focus({ preventScroll: true }); } }
  }
  async function refresh(force) {
    try {
      const r = await fetch("/api/ops/perf", { credentials: "same-origin", cache: "no-store" });
      if (r.status === 403 || r.status === 401) { body.replaceChildren(el("div", "empty", "Secțiunea asta e doar pentru admini.")); return; }
      const j = await r.json(); if (!j.ok) throw new Error("perf");
      data = j; render(force);
    } catch { if (!data) body.replaceChildren(el("div", "empty", "Nu am putut citi măsurătorile. Reîncerc în curând.")); }
    schedule();
  }
  const on = () => document.body.dataset.cat === "perf";
  function schedule() { clearTimeout(timer); if (!on()) return; timer = setTimeout(() => { if (on() && !document.hidden) refresh(); else schedule(); }, data && data.running ? 6000 : 60000); }
  let was = false;
  function watch() { const now = on(); if (now && !was) refresh(true); if (!now) { clearTimeout(timer); if (was) { heroC.leave(); repC.leave(); } } was = now; }
  new MutationObserver(watch).observe(document.body, { attributes: true, attributeFilter: ["data-cat"] });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && on()) refresh(); });
  NARROW.addEventListener("change", () => { if (on() && data) render(true); });
  watch();
})();
