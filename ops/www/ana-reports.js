// TASK-144 · /ops Analytics: the funnels and the reports (Mira's brief, 30 Oct), plus the admins' list of leads with its real / nu mark.
// The numbers come from GET /api/ops/analytics and the snapshot (GA4 cached on the server, the Leads from our own store); nothing here calls Google.
// Decision 1 (Daniel): /city/ is judged on being memorable, not on leads: its card only counts. No rate, no verdict, no "with or without the city".
// Decision 2 (Daniel): a lead is marked "real" or "nu"; the Leads KPI counts everything not marked "nu".
// The list holds personal data: it is fetched only when an admin opens it, only ever written with textContent, and never logged.
(() => {
  "use strict";
  const N = window.AnaNum, nf = N.nf;
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  const MONTHS = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
  const fday = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || "")); return m ? Number(m[3]) + " " + MONTHS[Number(m[2]) - 1] : ""; };
  const mmss = (s) => { s = Math.round(Number(s) || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const STILL_EMPTY = "Strângem date de la mutarea din 28 oct.";
  const NEXT_READ = "Apare la următoarea citire din GA.";
  const FAILED = "GA n-a răspuns pentru raportul ăsta la ultima citire. Restul paginii e proaspăt.";
  const card = (title, lede, cls) => { const c = el("section", "an-card anr-c" + (cls ? " " + cls : "")); c.append(el("h3", "anr-t", title)); if (lede) c.append(el("p", "anr-l", lede)); return c; };
  const empty = (t) => el("div", "anr-empty", t);
  const bar = (v, max) => { const b = el("span", "anr-bar"), i = el("i"); i.style.width = (max ? Math.max(1, v / max * 100) : 0) + "%"; b.append(i); return b; };
  function shareNode(num, den) { const s = N.share(num, den), o = el("span", "anr-sh"); o.append(el("b", "", s.main)); if (s.sub) o.append(el("small", "", s.sub)); return o; }

  // ---------- F1: the staircase ----------
  const F1 = [
    { key: "start", label: "Au venit" },
    { key: "pass", label: "Au ajuns la pass", note: "Au citit pagina până la capăt, unde e pass-ul, sau l-au deschis pe hartă" },
    { key: "form", label: "Au început să-l completeze" },
    { key: "lead", label: "L-au trimis" },
  ];
  const WHERE = ["înainte să ajungă la pass", "după ce ajung la pass, fără să-l înceapă", "în timp ce îl completează"];
  function funnelCard(A) {
    const from = A.pageFrom, to = (A.range || {}).to, f = (A.funnels || {}).f1;
    const c = card("De la vizită la lead", null, "anr-f1");
    const head = c.firstChild, line = el("div", "anr-th"); head.replaceWith(line); line.append(head); if (from) line.append(el("span", "mono muted anr-when", fday(from) + (to && to !== from ? " – " + fday(to) : "")));
    if (!f) { c.append(empty(NEXT_READ)); return c; }
    const steps = F1.map((s) => { const x = (f.steps || []).find((y) => y.key === s.key); return { ...s, users: x ? Number(x.users) || 0 : 0 }; });
    const top = Math.max(...steps.map((s) => s.users), 0);
    if (!top) { c.append(empty(STILL_EMPTY)); return c; }
    const same = !f.separate;
    if (same) { // the one sentence that answers the question, once there are enough people behind it
      let at = -1, lost = 0;
      steps.slice(0, -1).forEach((s, i) => { const d = s.users - steps[i + 1].users; if (s.users >= 100 && d > lost) { lost = d; at = i; } });
      if (at >= 0) c.append(el("p", "anr-find", "Cei mai mulți se opresc " + WHERE[at] + "."));
    }
    c.append(el("p", "anr-l", same
      ? "Aceiași oameni, pas cu pas, din 28 oct, de când site-ul e homepage. O comparație cu perioada trecută are sens abia de pe la sfârșitul lui decembrie."
      : "Numărate separat, nu aceiași oameni: GA n-a dat funnel-ul la ultima citire, așa că între pași nu e niciun procent. Din 28 oct."));
    const ol = el("ol", "anf" + (same ? "" : " sep"));
    ol.style.setProperty("--n", steps.length);
    steps.forEach((s, i) => {
      const li = el("li", "anf-s" + (s.key === "lead" ? " lead" : "")), h = s.users / top * 100, next = steps[i + 1];
      const txt = el("div", "anf-tx"); txt.append(el("span", "anf-no", String(i + 1)), el("b", "anf-n", nf(s.users)), el("span", "anf-lb", s.label)); if (s.note) txt.append(el("small", "anf-note", s.note));
      const plot = el("div", "anf-p"), b = el("i", "anf-b"); b.style.setProperty("--v", h + "%"); plot.append(b);
      if (next && same) {
        const link = el("span", "anf-link"), a = h, z = next.users / top * 100; link.style.clipPath = "polygon(0 " + (100 - a) + "%, 100% " + (100 - z) + "%, 100% 100%, 0 100%)"; plot.append(link);
        const rate = el("span", "anf-r"), sh = N.share(next.users, s.users); rate.append(el("b", "", sh.main)); if (sh.sub) rate.append(el("small", "", sh.sub)); plot.append(rate);
      }
      li.append(txt, plot); ol.append(li);
    });
    c.append(ol);
    if (f.sampled) c.append(el("p", "anr-foot", "GA a răspuns din eșantion, deci cifrele sunt aproximative."));
    return c;
  }

  // ---------- Surse ----------
  const NICE = { "(direct)|(none)": "Direct", "google|organic": "Google, căutare", "google|cpc": "Google Ads", "(not set)|(not set)": "Nesetat" };
  const srcName = (s) => NICE[s.source + "|" + s.medium] || s.source || "Nesetat";
  function sourcesCard(A) {
    const c = card("De unde vin cei care citesc și scriu", "Sesiunile, ce fac oamenii în ele și câți scriu. Lead-urile de aici sunt cele văzute de GA, deci doar de la cine a acceptat cookie-urile.");
    const rows = (A.sources || []).filter((s) => s && Number(s.sessions));
    if (!rows.length) { c.append(empty("Fără surse încă.")); return c; }
    const shown = N.fold(rows, "sessions", 30, 4, (rest) => [{ other: true, source: "Altele (" + rest.length + ")", medium: "", sessions: rest.reduce((t, r) => t + r.sessions, 0), engaged: rest.reduce((t, r) => t + (r.engaged || 0), 0), leads: rest.reduce((t, r) => t + (r.leads || 0), 0), caseSessions: rest.reduce((t, r) => t + (r.caseSessions || 0), 0) }]);
    const max = Math.max(...shown.map((r) => r.sessions)), sameWindow = A.pageFrom && (A.range || {}).from === A.pageFrom;
    const COLS = ["Sursă", "Sesiuni", "S-au implicat", "Au citit un caz", "Lead-uri"];
    const t = el("table", "anr-tbl"), th = el("thead"), hr = el("tr"); COLS.forEach((x, i) => { const h = el("th", i ? "anr-n" : "", x); h.scope = "col"; hr.append(h); }); th.append(hr);
    const tb = el("tbody");
    for (const r of shown) {
      const tr = el("tr", r.other ? "other" : "");
      const name = el("th", "anr-src"); name.scope = "row"; name.append(el("b", "", srcName(r))); if (r.medium && !NICE[r.source + "|" + r.medium]) name.append(el("small", "", r.medium));
      const td = (label, cls) => { const d = el("td", "anr-n " + (cls || "")); d.dataset.l = label; return d; };
      const s = td("Sesiuni", "anr-ses"); s.append(el("b", "", nf(r.sessions)), bar(r.sessions, max));
      const en = td("S-au implicat"); en.append(shareNode(r.engaged || 0, r.sessions));
      const ca = td("Au citit un caz"); if (sameWindow) ca.append(shareNode(r.caseSessions || 0, r.sessions)); else ca.append(el("b", "", nf(r.caseSessions || 0)));
      const le = td("Lead-uri"), lv = el("span", "anr-sh"); lv.append(el("b", "", nf(r.leads || 0))); { const sh = N.share(r.leads || 0, r.sessions); if (sh.pct != null && r.leads) lv.append(el("small", "", sh.main + " din sesiuni")); } le.append(lv);
      tr.append(name, s, en, ca, le); tb.append(tr);
    }
    t.append(th, tb); c.append(t);
    if (!sameWindow && A.pageFrom) c.append(el("p", "anr-foot", "„Au citit un caz” e numărat din " + fday(A.pageFrom) + ", restul pe toată perioada, deci coloana rămâne fără procent până se suprapun."));
    return c;
  }

  // ---------- Cazuri ----------
  const ui = { allCases: false };
  function casesCard(A, again) {
    const missing = (A.missing || []).includes("pages");
    const c = card("Ce cazuri se citesc", (A.pageFrom ? "Din " + fday(A.pageFrom) + ". " : "") + "Un lead de aici înseamnă ultima pagină înainte de trimitere, nu meritul cazului.");
    if (missing) { c.append(empty(FAILED)); return c; }
    if (!A.cases) { c.append(empty(NEXT_READ)); return c; }
    if (!A.cases.length) { c.append(empty(STILL_EMPTY)); return c; }
    const rows = ui.allCases ? A.cases : A.cases.slice(0, 8), max = Math.max(...A.cases.map((r) => r.views)), ol = el("ol", "anr-rank");
    for (const r of rows) {
      const li = el("li"), top = el("div", "anr-rt"); top.append(el("b", "", r.title || r.slug), el("span", "anr-rv", nf(r.views)));
      const meta = [mmss(r.avgSec) + " timp mediu"]; if (r.clicks) meta.push(nf(r.clicks) + (r.clicks === 1 ? " click spre el" : " click-uri spre el")); if (r.leads) meta.push(nf(r.leads) + (r.leads === 1 ? " lead trimis de aici" : " lead-uri trimise de aici"));
      li.append(top, bar(r.views, max), el("small", "", meta.join(", "))); ol.append(li);
    }
    c.append(ol);
    if (A.cases.length > 8) { const b = el("button", "btn sm ghost", ui.allCases ? "Doar primele 8" : "Toate (" + A.cases.length + ")"); b.type = "button"; b.setAttribute("aria-expanded", String(ui.allCases)); b.onclick = () => { ui.allCases = !ui.allCases; again(); }; c.append(b); }
    if ((A.missing || []).includes("caseClicks")) c.append(el("p", "anr-foot", "Click-urile spre cazuri lipsesc: GA n-a dat parametrul case_path la ultima citire."));
    return c;
  }

  // ---------- Orașul: a quiet count (decision 1) ----------
  const GAME = { gloves_open: "au deschis jocul", gloves_start: "au pornit", gloves_pick: "au ales un luptător", gloves_match_end: "au terminat un meci", gloves_voucher_shown: "au văzut voucherul" };
  function cityCard(A) {
    const c = card("Orașul", "Îl judecăm după cât rămâne în minte, nu după lead-uri. Aici doar numărăm" + (A.pageFrom ? ", din " + fday(A.pageFrom) : "") + ".", "anr-city");
    const f = (A.funnels || {}).f2; if (!f) { c.append(empty(NEXT_READ)); return c; }
    const by = (k) => { const x = (f.steps || []).find((s) => s.key === k); return x ? Number(x.users) || 0 : 0; };
    if (!by("city")) { c.append(empty(STILL_EMPTY)); return c; }
    const d = el("dl", "anr-cnt"); [["city", "au intrat în oraș"], ["open", "au deschis un loc"]].forEach(([k, l]) => { const w = el("div"); w.append(el("dd", "", nf(by(k))), el("dt", "", l)); d.append(w); }); c.append(d);
    if (by("lead") > 0 && !f.separate) c.append(el("p", "anr-l", by("lead") === 1 ? "Unul dintre ei a trimis apoi un boarding pass." : nf(by("lead")) + " dintre ei au trimis apoi un boarding pass."));
    if (f.separate) c.append(el("p", "anr-foot", "Numărate separat, nu aceiași oameni."));
    const game = (A.game || []).filter((g) => g.users);
    if (game.length) { const g = el("p", "anr-game"); g.append(el("b", "", "Jocul: ")); g.append(game.map((x) => nf(x.users) + " " + GAME[x.event]).join(", ") + "."); c.append(g); }
    return c;
  }

  // ---------- Pagini de intrare ----------
  const DOORS = { "/": "Homepage", "/ro/": "Homepage RO", "/city/": "Orașul", "(not set)": "Nesetat" };
  function landingCard(A) {
    const c = card("Pe ce ușă intră", (A.pageFrom ? "Din " + fday(A.pageFrom) + "." : "") + " Câte sesiuni încep aici și câte se implică.");
    if ((A.missing || []).includes("landing")) { c.append(empty(FAILED)); return c; }
    if (!A.landing) { c.append(empty(NEXT_READ)); return c; }
    const rows = A.landing.filter((r) => r.sessions); if (!rows.length) { c.append(empty(STILL_EMPTY)); return c; }
    const top = rows.slice(0, 5), rest = rows.slice(5), shown = rest.length ? top.concat([{ other: true, path: "Altele (" + rest.length + ")", sessions: rest.reduce((t, r) => t + r.sessions, 0), engaged: rest.reduce((t, r) => t + r.engaged, 0) }]) : top;
    const titled = new Map((A.cases || []).map((x) => [x.slug, x.title])), name = (p) => { if (DOORS[p]) return DOORS[p]; const m = /^\/(?:work|ro\/proiecte)\/([^/]+)/.exec(p); return (m && titled.get(m[1])) || p; };
    const max = Math.max(...shown.map((r) => r.sessions)), ol = el("ol", "anr-rank");
    for (const r of shown) { const li = el("li"), t = el("div", "anr-rt"); t.append(el("b", "", r.other ? r.path : name(r.path)), el("span", "anr-rv", nf(r.sessions))); const sh = N.share(r.engaged, r.sessions); li.append(t, bar(r.sessions, max), el("small", "", sh.main + (sh.sub ? " (" + sh.sub + ")" : "") + " s-au implicat")); ol.append(li); }
    c.append(ol); return c;
  }

  // ---------- Cine ----------
  const DEV = { mobile: "Telefon", desktop: "Desktop", tablet: "Tabletă" };
  function whoCard(A) {
    const c = card("Cine"); const ctry = (A.countries || []).slice(0, 5), dev = A.devices || [];
    if (!ctry.length && !dev.length) { c.append(empty("Fără date.")); return c; }
    const list = (rows, name) => { const tot = rows.reduce((t, r) => t + (r.users || 0), 0), max = Math.max(1, ...rows.map((r) => r.users || 0)), ol = el("ol", "anr-rank tight"); for (const r of rows) { const li = el("li"), t = el("div", "anr-rt"), sh = N.share(r.users, tot); t.append(el("b", "", name(r)), el("span", "anr-rv", sh.pct == null ? nf(r.users) : sh.main)); li.append(t, bar(r.users, max)); ol.append(li); } return ol; };
    const w = el("div", "anr-who"); w.append(list(dev, (d) => DEV[d.device] || d.device), list(ctry, (x) => x.country)); c.append(w); return c;
  }

  // ---------- Ce cer lead-urile ----------
  function wantsCard(A) {
    const W = (A.leadsStore || {}).wants;
    const c = card("Ce cer lead-urile", "Din serverul nostru, deci toate pass-urile, cu cookie-uri sau fără, fără testele noastre și fără cele marcate „nu”. Doar ce au bifat în formular.", "anr-wants");
    if (!W) { c.append(empty(NEXT_READ)); return c; }
    if (!W.n) { c.append(empty("Niciun lead în perioada asta.")); return c; }
    const g = el("div", "anr-3");
    [["Ce vor să facem", W.dreams], ["Ce fel de afacere", W.biz], ["Când", W.when]].forEach(([title, rows]) => {
      const box = el("div"), max = Math.max(1, ...rows.map((r) => r.n)), ol = el("ol", "anr-rank tight"); box.append(el("h4", "anr-h4", title));
      for (const r of rows) { const li = el("li"), t = el("div", "anr-rt"), sh = N.share(r.n, W.n); t.append(el("b", "", r.k), el("span", "anr-rv", sh.pct == null ? nf(r.n) : sh.main)); li.append(t, bar(r.n, max)); ol.append(li); }
      if (!rows.length) ol.append(el("li", "muted", "Nimic bifat."));
      box.append(ol); g.append(box);
    });
    c.append(g, el("p", "anr-foot", nf(W.n) + (W.n === 1 ? " lead" : " lead-uri") + " în perioada asta. La „Ce vor să facem” se poate bifa mai mult de un răspuns.")); return c;
  }

  // ---------- the list of leads, admins only ----------
  const LL = { open: false, loaded: false, busy: false, rows: [], filter: "todo", msg: "", unmarked: null, onMarked: null };
  const when = (iso) => { const d = new Date(iso); if (isNaN(d)) return ""; const t = d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }); return d.getDate() + " " + MONTHS[d.getMonth()] + ", " + t; };
  async function loadLeads() {
    LL.busy = true; LL.msg = ""; drawLeads();
    try { const r = await fetch("/api/ops/leads", { credentials: "same-origin", cache: "no-store" }), j = await r.json(); if (!r.ok || !j.ok) throw 0; LL.rows = j.leads; LL.unmarked = j.unmarked; LL.loaded = true; }
    catch { LL.msg = "Lista nu s-a putut citi. Mai încearcă o dată."; }
    LL.busy = false; drawLeads();
  }
  async function setMark(row, mark, status) {
    const next = row.mark === mark ? null : mark, before = { mark: row.mark, markBy: row.markBy, markAt: row.markAt };
    row.mark = next; row.pending = true; drawLeads();
    try {
      const r = await fetch("/api/ops/leads/mark", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, mark: next }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw r.status;
      row.mark = j.mark; row.markBy = j.markBy; row.markAt = j.markAt; LL.unmarked = j.unmarked; LL.msg = "";
      if (LL.onMarked) LL.onMarked();
    } catch (e) {
      Object.assign(row, before);
      LL.msg = e === 429 ? "Prea multe marcaje într-un timp scurt. Mai încearcă în câteva minute." : "Marcajul nu s-a salvat. Mai încearcă o dată.";
    }
    row.pending = false; drawLeads();
  }
  function drawLeads() {
    const box = document.getElementById("ana-leads"); if (!box) return;
    box.replaceChildren();
    const un = LL.unmarked;
    const h = el("div", "anr-th"); h.append(el("h3", "anr-t", "Lead-urile, unul câte unul")); box.append(h);
    box.append(el("p", "anr-l", (un == null ? "" : un === 0 ? "Toate sunt marcate. " : nf(un) + (un === 1 ? " lead nemarcat. " : " lead-uri nemarcate. ")) + "Un lead nemarcat se numără. Doar „nu” îl scoate din cifra din cardul galben, din grafic și din „Ce cer lead-urile”."));
    if (!LL.open) { const b = el("button", "btn sm k", "Arată lead-urile"); b.type = "button"; b.onclick = () => { LL.open = true; loadLeads(); }; box.append(b); return; }
    if (LL.busy && !LL.loaded) { box.append(empty("Citesc lista…")); return; }
    const st = el("p", "anr-st"); st.setAttribute("role", "status"); st.textContent = LL.msg; st.hidden = !LL.msg; box.append(st);
    if (!LL.loaded) return;
    const seg = el("div", "seg"); seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Ce lead-uri arăt");
    [["todo", "Nemarcate"], ["all", "Toate"], ["no", "Nu"]].forEach(([k, t]) => { const b = el("button", "", t); b.type = "button"; b.setAttribute("aria-pressed", String(LL.filter === k)); b.onclick = () => { LL.filter = k; drawLeads(); }; seg.append(b); });
    const close = el("button", "btn sm ghost", "Ascunde"); close.type = "button"; close.onclick = () => { LL.open = false; LL.loaded = false; LL.rows = []; LL.msg = ""; drawLeads(); }; // the personal data leaves the page too
    const bar2 = el("div", "anr-lbar"); bar2.append(seg, close); box.append(bar2);
    const rows = LL.rows.filter((r) => LL.filter === "all" || (LL.filter === "no" ? r.mark === "nu" : !r.mark || r.keep));
    if (!rows.length) { box.append(empty(LL.filter === "todo" ? "Nimic de marcat." : "Niciun lead aici.")); return; }
    const ul = el("ul", "anl");
    for (const r of rows) {
      const li = el("li", "anl-i" + (r.mark === "nu" ? " no" : ""));
      const who = el("div", "anl-who"); who.append(el("b", "", r.name || "Fără nume")); const mail = el("a", "anl-mail", r.email); mail.href = "mailto:" + encodeURIComponent(r.email).replace(/%40/g, "@"); who.append(mail); who.append(el("small", "", when(r.at) + (r.page ? ", de pe " + r.page : r.lp ? ", de pe landing " + r.lp : "")));
      const what = el("div", "anl-what"); if (r.msg) what.append(el("p", "anl-msg", r.msg)); const tags = [...(r.dreams || []), r.biz, r.when].filter(Boolean); if (tags.length) what.append(el("small", "", tags.join(", "))); if (!r.msg && !tags.length) what.append(el("small", "", "N-a scris nimic."));
      const act = el("div", "anl-act"), sg = el("div", "seg anl-seg"); sg.setAttribute("role", "group"); sg.setAttribute("aria-label", "Marcaj pentru " + (r.name || "lead"));
      [["real", "Real"], ["nu", "Nu"]].forEach(([k, t]) => { const b = el("button", "", t); b.type = "button"; b.disabled = !!r.pending; b.setAttribute("aria-pressed", String(r.mark === k)); b.onclick = () => { r.keep = true; setMark(r, k); }; sg.append(b); });
      act.append(sg, el("small", "anl-by", r.mark && r.markBy && r.markAt ? "Marcat de " + r.markBy + ", " + when(r.markAt) : "Nemarcat"));
      li.append(who, what, act); ul.append(li);
    }
    box.append(ul);
  }

  // ---------- the page ----------
  let last = "", lastA = null;
  function draw(A, force) {
    const host = document.getElementById("ana-rep"); if (!host) return;
    const { generatedAt, status, ...rest } = A, key = JSON.stringify(rest);
    if (key === last && !force) return;
    last = key; lastA = A;
    const again = () => draw(lastA, true);
    const two = (a, b, cls) => { const g = el("div", "anr-2" + (cls ? " " + cls : "")); g.append(a, b); return g; };
    host.replaceChildren(funnelCard(A), sourcesCard(A), two(casesCard(A, again), cityCard(A), "wide"), two(landingCard(A), whoCard(A)), wantsCard(A));
    host.classList.toggle("anr-anim", !draw.seen); draw.seen = true;
  }
  window.AnaReports = {
    render(A, ctx) {
      draw(A);
      const box = document.getElementById("ana-leads"), real = !!A.leadsStore && !ctx.mock;
      if (box) box.hidden = !real;
      if (real) { LL.onMarked = ctx.onMarked; if (!LL.loaded) LL.unmarked = A.leadsStore.unmarkedEver ?? null; drawLeads(); }
    },
    openLeads() { const box = document.getElementById("ana-leads"); if (!box) return; if (!LL.open) { LL.open = true; loadLeads(); } box.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); },
  };
})();
