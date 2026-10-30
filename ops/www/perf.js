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
  const ui = { field: "origin", trendS: "mobile", trendM: "performance" };
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

  // ---------- Concluzii ----------
  function conclusions(C) {
    const list = Array.isArray(C.conclusions) ? C.conclusions : [];
    if (!list.length) return null;
    const s = sec("Concluzii"), lead = list.find((x) => x.lead), rest = list.filter((x) => x !== lead);
    if (lead) { const v = el("div", "prf-verdict"); v.append(rich(el("p"), lead.text)); s.append(v); }
    const ul = el("ul", "prf-cons");
    for (const c of rest) { const li = el("li"); li.append(dot({ good: "good", watch: "mid", bad: "bad" }[c.tone] || "none"), rich(el("span"), c.text)); ul.append(li); }
    s.append(ul);
    if (C.writtenAt) s.append(el("div", "prf-asof", "Scrise pe " + day(C.writtenAt) + ", din măsurătorile de atunci. Cifrele de mai jos se actualizează singure, textul nu."));
    return s;
  }

  // ---------- scores ----------
  function reason(last) {
    const e = last && last.error; if (!e) return "Google n-a întors încă un scor pentru pagina asta.";
    const secs = last.ms ? " după circa " + Math.round(last.ms / 1000) + " s" : "";
    if (e.http && e.http >= 400 && e.http < 500) return "Google a refuzat cererea (HTTP " + e.http + (e.message ? ": „" + e.message + "”" : "") + "). Nu e o problemă a paginii.";
    if (e.http && e.http < 400 || e.http >= 500) return "Lighthouse eșuează pe pagina asta" + secs + (e.http ? ", HTTP " + e.http : "") + (e.message ? ": „" + e.message + "”" : "") + ".";
    return e.message || "Google n-a răspuns" + secs + ".";
  }
  function panel(st, S) {
    const H = S.headline, p = el("article", "prf-st" + (H ? "" : " none")), head = el("div", "prf-st-h"); head.append(STRAT[st]);
    const at = S.measuredAt || (S.last && S.last.at); if (at) head.append(el("span", "", when(at)));
    p.append(head);
    if (!H) {
      p.append(el("div", "prf-none", "Fără scor Google"), el("div", "prf-why", reason(S.last)), el("div", "prf-why", "Nu e 0 și nu e un scor mic. Google n-a reușit să măsoare."));
      return p;
    }
    const prov = H.n < data.window, sc = el("div", "prf-sc" + (prov ? " prov" : "")), bar = el("div", "prf-bar"), fill = el("i", band(H.performance));
    const perf = Math.round(H.performance); fill.style.width = perf + "%"; bar.append(fill); bar.setAttribute("aria-hidden", "true");
    const num = el("b", "", String(perf)); num.setAttribute("aria-label", "Scor de performanță " + perf + " din 100");
    sc.append(num, bar); p.append(sc);
    const how = el("div", "prf-how");
    if (prov) { how.append(el("strong", "", "Provizoriu. "), H.n === 1 ? "O singură măsurătoare din cele " + data.window + " care fac cifra sigură." : H.n + " măsurători din cele " + data.window + " care fac cifra sigură: " + H.samples.join(" și ") + "."); }
    else how.append("Mediana din " + H.samples.join(", ") + ", ultimele " + data.window + " măsurători.");
    p.append(how);
    const sub = el("dl", "prf-sub");
    [["Accesibilitate", H.accessibility], ["Bune practici", H.bestPractices], ["SEO", H.seo]].forEach(([k, v]) => { const d = el("div"); d.append(el("dt", "", k), el("dd", "", v == null ? "–" : String(Math.round(v)))); sub.append(d); });
    p.append(sub);
    const vit = el("dl", "prf-vit");
    [["Conținut principal (LCP)", ms(H.lcpMs)], ["Primul conținut (FCP)", ms(H.fcpMs)], ["Blocaj (TBT)", ms(H.tbtMs)], ["Salt de pagină (CLS)", cls(H.cls)]].forEach(([k, v]) => { const d = el("div"); d.append(el("dt", "", k), el("dd", "", v)); vit.append(d); });
    p.append(vit);
    if (S.last && !S.last.ok) { const w = el("div", "prf-warn"); w.append(dot("mid"), el("span", "", "Ultima încercare a eșuat (" + when(S.last.at) + "). Cifra vine din măsurătorile reușite.")); p.append(w); }
    return p;
  }
  function scores(D) {
    const s = sec("Scorurile Google", "Măsurate în laborator de Lighthouse, cu aceeași pagină și același telefon simulat de fiecare dată. O singură rulare poate ieși pe lângă, așa că cifra mare e mediana ultimelor " + D.window + ". Un răspuns venit din cache-ul Google nu se numără.");
    const key = el("div", "prf-key"); [["good", "90 sau peste"], ["mid", "50 până la 89"], ["bad", "sub 50"], ["none", "fără scor"]].forEach(([k, t]) => { const x = el("span"); x.append(dot(k), t); key.append(x); }); s.append(key);
    const box = el("div", "prf-pages");
    for (const P of D.pages) {
      const r = el("div", "prf-pg"), n = el("div", "prf-pg-n"), two = el("div", "prf-2");
      n.append(el("b", "", P.label), el("span", "", P.path));
      two.append(panel("mobile", P.strategies.mobile), panel("desktop", P.strategies.desktop));
      r.append(n, two); box.append(r);
    }
    s.append(box); return s;
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
    const C = data.content || {}, parts = [actions(), conclusions(C), scores(data), field(data), trend(data), cityFirst(C), history(data)].filter(Boolean);
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
  function watch() { const now = on(); if (now && !was) refresh(true); if (!now) clearTimeout(timer); was = now; }
  new MutationObserver(watch).observe(document.body, { attributes: true, attributeFilter: ["data-cat"] });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && on()) refresh(); });
  NARROW.addEventListener("change", () => { if (on() && data) render(true); });
  watch();
})();
