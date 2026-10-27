// TASK-135 · /ops "Ofertă": offers for clients, admins only.
// The team picks a process (Branding is active; Aplicație web and Producție video come later), fills the client, the
// situation (brand nou / rebranding), the line items against the base prices, special deliverables and the timeline,
// and sends it: a command to Claude (payload.type "offer-new", the whole config inside). Claude writes the copy and
// 5–6 brand experiences, renders a preview (tools/offer/build.mjs, uploaded with ops-bridge.mjs proposal --preview)
// and writes the offer into the snapshot's "offers" collection. The team reviews it here, next to the form, picks
// 1–3 experiences (price optional), asks for changes ("offer-edit") or publishes ("offer-publish"); the link shows up here.
(() => {
  "use strict";
  // base prices and names: ops/www/offer-prices.json is the one place to change them (loaded at start, admins only);
  // these are only the fallback if that file cannot be read
  const BASE = { audit: 1200, core: 2500, directions: 2500, canvas: 2500, guidelines: 2000, deliverables: 1500 };
  let PER_PIECE = "preț pe bucată";
  const ITEMS = [
    ["audit", "Audit de brand", "Ce funcționează, unde poate crește, unde sunt oportunitățile"],
    ["core", "The Core · workshop de poziționare", "Strategia, poziționarea, vocea, într-o zi în studio"],
    ["directions", "Direcții vizuale", "Drumuri vizuale distincte, pornite din strategie"],
    ["canvas", "Brand canvas", "Identitate, tipografie, paletă, univers de brand, pentru fiecare direcție"],
    ["guidelines", "Ghid de identitate", "Direcția aleasă, scrisă ca reguli"],
    ["deliverables", "Livrabile ulterioare", "Ce construim pe sistemul nou: social, papetărie, semnătură email, prezentare"],
  ];
  let CANVAS_QTY = 2;
  // default package names (Daniel, 28 Oct); an upsell above the main one is "Procesul extins"
  const PK_NAMES = [["Procesul de Branding Cromatic", "The Cromatic Branding Process"], ["Procesul de Branding Eficient", "The Efficient Branding Process"], ["Procesul Go to Market", "The Go-to-Market Process"]];
  const PK_EXT = ["Procesul extins", "The Extended Process"];
  const nm = (c, key) => (c.labels && c.labels[key] && c.labels[key].ro) || (ITEMS.find((x) => x[0] === key) || [key, key])[1];
  let HOL = { ranges: [["12-24", "01-02"]], dates: ["01-01", "01-02", "01-24", "05-01", "06-01", "08-15", "11-30", "12-01", "12-25", "12-26"], orthodox: ["goodFriday", "easterMonday", "whitMonday"], skipWeekDays: 5 };
  let NEXT_DEFAULT = [{ id: "marketing-plan", title: "Plan de marketing pe 1 an", desc: "Pe toate canalele potrivite domeniului tău, cu ritm, teme și buget pe luni.", price: "", picked: true }];
  async function loadPrices() {
    try {
      const r = await fetch("/ops/offer-prices.json", { credentials: "same-origin", cache: "no-store" }); if (!r.ok) return;
      const j = await r.json();
      for (const it of j.items || []) { if (!(it.key in BASE)) continue; if (Number(it.base) >= 0) BASE[it.key] = Number(it.base); const row = ITEMS.find((x) => x[0] === it.key); if (row && it.ro) row[1] = it.ro; if (it.key === "canvas" && it.defaultQty) CANVAS_QTY = Number(it.defaultQty) || 2; }
      if (j.perPiece && j.perPiece.ro) PER_PIECE = j.perPiece.ro;
      if (j.holidays) HOL = { ...HOL, ...j.holidays };
      if (Array.isArray(j.nextSteps) && j.nextSteps.length) NEXT_DEFAULT = j.nextSteps.map((x) => ({ id: x.key || undefined, title: x.ro || "", desc: x.descRo || "", price: "", picked: x.picked !== false }));
    } catch {}
  }
  const PH_COLORS = ["#48A8EF", "#F8D13B", "#4CC462", "#F27261", "#AE76E6"];
  const SIT = { fresh: "Fresh start-up · brand nou", rebrand: "Rebranding · upscale" };
  const STATUS = { sent: ["la Claude", "draft"], draft: ["draft", "draft"], preview: ["preview gata", "pv"], published: ["publicată", "pub"], withdrawn: ["retrasă", "wd"], working: ["Claude lucrează", "wk"] };
  const TYPES = [
    { k: "branding", t: "Proces de branding", c: "#28C840", on: true, pills: ["The Core", "Direcții vizuale", "Brand canvas", "Ghid de identitate", "Livrabile ulterioare"], art: `<svg viewBox="0 0 96 64" fill="none"><path class="sa-draw" d="M10 46 C 26 12, 54 10, 62 26 C 70 42, 46 52, 40 40 C 34 28, 62 18, 86 30" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path class="sa-nib" d="M82 22 l8 8 -5 9 -9 -5 z" fill="currentColor"/><circle class="sa-dot" cx="12" cy="46" r="4" fill="currentColor"/></svg>` },
    { k: "webapp", t: "Proces de aplicație web", c: "#B098C8", on: false, pills: ["Discovery", "UX", "UI", "Build", "Lansare"], art: `<svg viewBox="0 0 96 64" fill="none"><rect x="12" y="8" width="72" height="48" rx="7" stroke="currentColor" stroke-width="4"/><line x1="12" y1="20" x2="84" y2="20" stroke="currentColor" stroke-width="3"/><rect class="sa-btn" x="24" y="30" width="26" height="14" rx="7" fill="currentColor"/><path class="sa-cursor" d="M58 34 l12 5 -5 2 -1 6 -6 -13z" fill="currentColor"/></svg>` },
    { k: "video", t: "Producție video", c: "#FED012", on: false, pills: ["Concept", "Pre-producție", "Filmare", "Post-producție"], art: `<svg viewBox="0 0 96 64" fill="none"><rect x="18" y="26" width="52" height="26" rx="5" stroke="currentColor" stroke-width="4"/><g class="sa-clap"><path d="M18 24 l52 -8 -3 -10 -52 8 z" fill="currentColor"/></g><path class="sa-play" d="M40 33 l12 6 -12 6 z" fill="currentColor"/><circle class="sa-rec" cx="78" cy="14" r="5" fill="#F65342"/></svg>` },
  ];

  let db = null, offers = [], inbox = [], view = { name: "home" }, cfg = null, mounted = false, pvLang = "ro", pvTab = "live";
  const $ = (id) => document.getElementById(id);
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const money = (n) => Math.round(Number(n) || 0).toLocaleString("de-DE") + " €";
  const num = (v, d = 0) => { const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n : d; };
  const toast = (m, k) => (window.__opsToast ? window.__opsToast(m, k) : alert(m));
  const admin = () => !!(window.__ops && window.__ops.user && window.__ops.user.role === "admin");
  const rid = () => "of-" + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);
  const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" }); };

  // ---------- the config ----------
  function freshCfg() {
    const c = { id: rid(), offerType: "branding", client: { name: "", contact: "", email: "", website: "" }, situation: "fresh", brief: "",
      items: ITEMS.map(([k]) => ({ key: k, on: k !== "audit", base: BASE[k], price: BASE[k], ...(k === "canvas" ? { qty: CANVAS_QTY } : k === "directions" ? { qty: 3 } : {}) })), labels: {},
      specials: [], discount: { type: "pct", value: 0 }, vatNote: "Prețurile nu includ TVA.", validityDays: 30, startDate: nextMonday(), phases: [], phasesAuto: true, currentLogo: null,
      packages: [], nextSteps: NEXT_DEFAULT.map((x) => ({ ...x })) };
    c.phases = autoPhases(c);
    return c;
  }
  function nextMonday() { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7) + 7); return d.toISOString().slice(0, 10); }
  const item = (c, k) => c.items.find((i) => i.key === k);
  function autoPhases(c0) {
    const gp = ganttPk(c0), c = gp ? pkOffer(c0, gp) : c0; // the calendar follows one package (default: the recommended / first)
    const on = (k) => { const i = item(c, k); return i && i.on; }, P = []; let w = 0;
    if (on("audit")) { P.push({ id: "audit", title: "Audit de brand", start: 0, weeks: 1, milestone: "Raport de audit" }); w = 1; }
    if (on("core")) { P.push({ id: "core", title: "The Core · workshop", start: w, weeks: 2, milestone: "" }); w += 2; }
    if (on("directions")) { P.push({ id: "directions", title: "Direcții vizuale", start: w, weeks: 2, milestone: "Prezentare direcții" }); w += 2; }
    if (on("canvas")) { const q = Math.max(1, item(c, "canvas").qty || 1), wk = q <= 1 ? 2 : 3; P.push({ id: "canvas", title: "Brand canvas ×" + q, start: w, weeks: wk, milestone: "Alegi direcția" }); w += wk; }
    const w0 = w;
    if (on("guidelines")) P.push({ id: "guidelines", title: "Ghid de identitate", start: w0, weeks: 2, milestone: "" });
    if (on("deliverables")) P.push({ id: "deliverables", title: "Livrabile ulterioare", start: w0, weeks: 3, milestone: "" });
    c.specials.filter((s) => s.title).forEach((s, i) => P.push({ id: "s" + (i + 1), title: s.title, start: w0 + 1, weeks: 2, milestone: "" }));
    P.forEach((ph) => { if (c0.labels && c0.labels[ph.id] && c0.labels[ph.id].ro) ph.title = c0.labels[ph.id].ro + (ph.id === "canvas" ? " ×" + Math.max(1, item(c, "canvas").qty || 1) : ""); });
    return P;
  }
  function totals(c) {
    const items = c.items.filter((i) => i.on).map((i) => { const q = i.key === "canvas" ? Math.max(1, Math.round(i.qty || 1)) : 1; return { ...i, q, line: num(i.price) * q, baseLine: num(i.base) * q }; });
    const specials = c.specials.filter((s) => s.title);
    const subtotal = items.reduce((a, i) => a + i.line, 0) + specials.reduce((a, s) => a + num(s.price), 0);
    const base = items.reduce((a, i) => a + i.baseLine, 0) + specials.reduce((a, s) => a + num(s.price), 0);
    const dv = num(c.discount && c.discount.value);
    const discount = dv > 0 ? Math.round(c.discount.type === "amount" ? Math.min(subtotal, dv) : subtotal * Math.min(100, dv) / 100) : 0;
    return { items, specials, subtotal, base, discount, total: subtotal - discount };
  }
  /** packages (same rules as build.mjs packagesOf): 2–3 ways to buy the same process; [] = a single package */
  function pkOffer(c, p) {
    const off = new Set(p.off || []), soff = new Set((p.specialsOff || []).map(Number)), pr = p.prices || {};
    return { ...c, items: c.items.map((i) => ({ ...i, on: i.on && !off.has(i.key), ...(pr[i.key] !== undefined && pr[i.key] !== "" ? { price: num(pr[i.key]) } : {}),
      ...(i.key === "canvas" && p.canvasQty ? { qty: Math.max(1, p.canvasQty) } : {}), ...(i.key === "directions" && p.directionsQty ? { qty: Math.max(1, p.directionsQty) } : {}) })), specials: c.specials.filter((x, j) => !soff.has(j)) };
  }
  const ganttPk = (c) => (c.packages || []).length >= 2 ? (c.packages.find((p) => p.id === c.ganttPackage) || c.packages.find((p) => p.recommended) || c.packages[0]) : null;
  const pkTotals = (c) => ((c.packages || []).length >= 2 ? c.packages.map((p) => totals(pkOffer(c, p))) : null);
  const weeksOf = (c) => Math.max(0, ...c.phases.map((p) => num(p.start) + num(p.weeks)));
  // holidays, the same rule as build.mjs: a calendar week with skipWeekDays weekdays off is skipped
  function easter(y) { const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, m = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1; const t = new Date(Date.UTC(y, m - 1, day, 12)); t.setUTCDate(t.getUTCDate() + 13); return t; }
  function dayOff(t) {
    const md = String(t.getUTCMonth() + 1).padStart(2, "0") + "-" + String(t.getUTCDate()).padStart(2, "0");
    if ((HOL.dates || []).includes(md)) return true;
    for (const [a, b] of HOL.ranges || []) if (a <= b ? md >= a && md <= b : md >= a || md <= b) return true;
    const df = Math.round((t - easter(t.getUTCFullYear())) / 864e5), o = HOL.orthodox || [];
    return (o.includes("goodFriday") && df === -2) || (o.includes("easterMonday") && df === 1) || (o.includes("whitMonday") && df === 50);
  }
  function calendar(c, work) {
    const ww = [], hol = [];
    if (c.startDate) for (let k = 0; ww.length < Math.ceil(work) + 1 && k < 400; k++) { let off = 0; for (let d = 0; d < 5; d++) { const t = new Date(c.startDate + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + k * 7 + d); if (dayOff(t)) off++; } (off >= (Number(HOL.skipWeekDays) || 5) ? hol : ww).push(k); }
    const at = (k) => (k < ww.length ? ww[k] : ww.length ? ww[ww.length - 1] + 1 + k - ww.length : k);
    return { hol, cs: (x) => { const k = Math.floor(x); return at(k) + (x - k); }, ce: (x) => { const k = Math.floor(x), f = x - k; return f > 0 ? at(k) + f : x <= 0 ? 0 : at(k - 1) + 1; } };
  }

  // ---------- data ----------
  function offerList() {
    const docs = new Map(offers.map((o) => [o.id, { ...o }]));
    const open = inbox.filter((x) => x.payload && /^offer-/.test(x.payload.type || "") && x.status !== "done" && x.status !== "declined");
    const deleting = new Set(open.filter((x) => x.payload.type === "offer-delete").map((x) => x.payload.offerId));
    for (const x of open) {
      const pl = x.payload;
      if (pl.type === "offer-new" && pl.offer && !docs.has(pl.offer.id)) docs.set(pl.offer.id, { id: pl.offer.id, status: "sent", client: { name: pl.offer.client.name }, situation: pl.offer.situation, total: totals(normCfg(pl.offer)).total, config: pl.offer, createdAt: x.createdAt, pendingId: x.id });
      else if (pl.offerId && docs.has(pl.offerId)) { const d = docs.get(pl.offerId); d.working = pl.type === "offer-publish" ? "publish" : pl.type === "offer-unpublish" ? "unpublish" : "edit"; }
    }
    for (const id of deleting) docs.delete(id); // "Șterge": gone from the list right away; Claude removes the files
    return [...docs.values()].sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  }
  function normCfg(c0) {
    const c = JSON.parse(JSON.stringify(c0 || {})), f = freshCfg();
    const out = { ...f, ...c, client: { ...f.client, ...(c.client || {}) }, discount: { ...f.discount, ...(c.discount || {}) } };
    out.items = ITEMS.map(([k]) => ({ ...item(f, k), ...((c.items || []).find((i) => i.key === k) || {}) }));
    out.labels = c.labels && typeof c.labels === "object" ? c.labels : {};
    out.specials = Array.isArray(c.specials) ? c.specials : [];
    // packages; an older form's compact {on, canvasQty, off} (+ specials[].compact) becomes [full, compact]
    out.packages = Array.isArray(c.packages) ? c.packages : c.compact && c.compact.on ? [{ id: "full", label: "Varianta completă", off: [], specialsOff: [] }, { id: "compact", label: "Varianta compactă", canvasQty: c.compact.canvasQty || 1, off: c.compact.off || [], specialsOff: out.specials.map((x, k) => (x.compact === false ? k : -1)).filter((k) => k >= 0) }] : [];
    delete out.compact;
    // next steps: a list of opportunities with "picked"; an older form's nextOn: false = none picked
    out.nextSteps = (Array.isArray(c.nextSteps) ? c.nextSteps : f.nextSteps).map((x) => ({ ...x, picked: c.nextOn === false ? false : x.picked !== false }));
    delete out.nextOn; out.phases = Array.isArray(c.phases) && c.phases.length ? c.phases : autoPhases(out);
    return out;
  }

  // ---------- render ----------
  function render() {
    const root = $("ofr-root"); if (!root) return;
    if (!admin()) { root.replaceChildren(); return; }
    const list = offerList();
    const nb = $("nb-offer"); if (nb) { const n = list.filter((o) => o.status === "preview" && !o.working).length; nb.hidden = !n; nb.textContent = n ? String(n) : ""; nb.className = "nb" + (n ? " hot" : ""); }
    $("ofr-n").textContent = list.length ? list.length + (list.length === 1 ? " ofertă" : " oferte") : "";
    if (view.name === "edit" && cfg) { if (!mounted) renderEditor(root); else refreshEditor(); return; }
    mounted = false;
    const types = h("div", "ofr-types");
    TYPES.forEach((t, i) => {
      const b = h("button", "ofr-type" + (t.on ? "" : " soon")); b.type = "button"; b.style.setProperty("--sc", t.c); b.style.setProperty("--i", i);
      if (!t.on) { b.setAttribute("aria-disabled", "true"); b.title = "Curând"; }
      const art = h("span", "svcx-art"); art.innerHTML = t.art; art.setAttribute("aria-hidden", "true");
      const top = h("span", "ofr-tt"); top.append(art, h("span", "ofr-badge mono", t.on ? "Activ" : "Curând"));
      const pills = h("span", "oc-pills"); t.pills.forEach((p) => pills.append(h("i", "", p)));
      b.append(top, h("span", "oc-n mono", "PROCES " + (i + 1) + " / 3"), h("b", "", t.t), pills, h("span", "ofr-go mono", t.on ? "Ofertă nouă →" : "În curând"));
      b.onclick = () => { if (!t.on) { toast(t.t + ": vine curând. Deocamdată, ofertele de branding."); return; } openEditor(freshCfg(), null); };
      types.append(b);
    });
    const lh = h("div", "ofr-lh"); lh.append(h("h3", "", "Ofertele voastre"), h("span", "mono muted", "draft · preview gata · publicată"));
    const tbl = h("div", "ofr-list");
    if (!list.length) tbl.append(h("div", "ofr-empty muted", "Nicio ofertă încă. Alege procesul de branding de mai sus și pornește prima."));
    for (const o of list) {
      const st = o.working ? "working" : (STATUS[o.status] ? o.status : "draft");
      const r = h("div", "ofr-row"); r.tabIndex = 0;
      const pill = h("span", "ofr-st " + STATUS[st][1], STATUS[st][0] + (o.original && st === "published" ? " · originală" : ""));
      if (o.original) pill.title = "Pagina originală, făcută înainte de generator. Versiunea din generator e doar preview până apeși Publică.";
      if (o.working) pill.title = o.working === "publish" ? "Claude o publică" : "Claude aplică modificările";
      const who = h("div", "ofr-who"); who.append(h("b", "", (o.client && o.client.name) || "Fără nume"), h("small", "muted", [SIT[o.situation] || "", fmtDate(o.updatedAt || o.createdAt)].filter(Boolean).join(" · ")));
      const links = h("div", "ofr-links");
      if (o.url && o.status === "published") { const a = h("a", "btn sm k", "Deschide"); a.href = o.url; a.target = "_blank"; a.rel = "noopener"; const cp = h("button", "btn sm ghost", "Copiază linkul"); cp.type = "button"; cp.onclick = (e) => { e.stopPropagation(); copy(location.origin + o.url); }; links.append(a, cp); }
      else if (o.previewUrl) { const a = h("button", "btn sm y", "Vezi preview-ul"); a.type = "button"; a.onclick = (e) => { e.stopPropagation(); openEditor(normCfg(o.config), o, "claude"); }; links.append(a); }
      r.append(pill, who, h("b", "ofr-tot", money(o.total)), links);
      const open = () => openEditor(normCfg(o.config), o, o.previewUrl ? "claude" : "live");
      r.onclick = (e) => { if (!e.target.closest("a,button")) open(); }; r.onkeydown = (e) => { if (e.key === "Enter" && e.target === r) open(); };
      tbl.append(r);
    }
    root.replaceChildren(types, lh, tbl);
  }
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Link copiat."), () => prompt("Copiază linkul:", t)); }

  function openEditor(c, doc, tab) {
    if (doc && Array.isArray(doc.nextSteps) && doc.nextSteps.length) c.nextSteps = doc.nextSteps.map((x) => ({ id: x.id, title: x.title || "", desc: x.desc || "", price: x.price ?? "", picked: x.picked !== false }));
    cfg = c; view = { name: "edit", doc: doc || null }; pvTab = tab || "live"; mounted = false; render(); const s = $("ofr"); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function closeEditor() { view = { name: "home" }; cfg = null; mounted = false; render(); }
  const curDoc = () => (view.doc ? offerList().find((o) => o.id === view.doc.id) || view.doc : null);

  // editor: form on the left, preview on the right (stacked on phones)
  function renderEditor(root) {
    mounted = true; docSig = null; let gselEl = null;
    const doc = curDoc(), wrap = h("div", "ofr-ed");
    const bar = h("div", "ofr-bar");
    const back = h("button", "btn sm ghost", "← Toate ofertele"); back.type = "button"; back.onclick = closeEditor;
    bar.append(back, h("span", "ofr-bar-t", doc ? ((doc.client && doc.client.name) || "Ofertă") : "Ofertă nouă · Proces de branding"));
    if (doc) { const st = doc.working ? "working" : doc.status; bar.append(h("span", "ofr-st " + (STATUS[st] || STATUS.draft)[1], (STATUS[st] || STATUS.draft)[0] + (doc.original && st === "published" ? " · originală" : ""))); }
    const form = h("form", "ofr-form"); form.noValidate = true; form.onsubmit = (e) => e.preventDefault();
    const pane = h("aside", "ofr-pane"); pane.id = "ofr-pane";

    // "Atașează prezentarea de proces": the offer opens with the whole Cromatic process deck, then the financial offer
    const pr = h("label", "ofr-proc"), prc = h("input"); prc.type = "checkbox"; prc.checked = !!cfg.includeProcess;
    prc.onchange = () => { cfg.includeProcess = prc.checked; pr.classList.toggle("on", prc.checked); live(); };
    pr.classList.toggle("on", !!cfg.includeProcess);
    pr.append(prc, h("b", "", "Atașează prezentarea de proces"), h("small", "muted", "Oferta începe cu prezentarea procesului Cromatic (aceeași pentru toți), apoi oferta financiară. Clientul are buton „Vezi oferta financiară” sus și jos."));
    form.append(pr);
    // 01 client
    const s1 = sec("01", "Clientul");
    const g1 = h("div", "ofr-g2");
    g1.append(field("Client / brand", inp("text", cfg.client.name, (v) => { cfg.client.name = v; live(); }, "Ex.: Luma Ceramics", 120, "ofr-client")),
      field("Persoana de contact", inp("text", cfg.client.contact, (v) => (cfg.client.contact = v), "Nume (opțional)", 120)),
      field("Email (opțional)", inp("email", cfg.client.email, (v) => (cfg.client.email = v), "nume@brand.ro", 160)),
      field("Site / Instagram (opțional)", inp("text", cfg.client.website, (v) => (cfg.client.website = v), "https://…", 200)));
    const sit = h("div", "ofr-sit"); sit.setAttribute("role", "radiogroup"); sit.setAttribute("aria-label", "Situația brandului");
    for (const [k, t, d] of [["fresh", "Fresh start-up", "Brand nou, de la zero"], ["rebrand", "Rebranding · upscale", "Pornim de la brandul de azi"]]) {
      const b = h("button", "ofr-sit-b " + k); b.type = "button"; b.dataset.k = k; b.setAttribute("role", "radio"); b.append(h("b", "", t), h("small", "", d));
      b.onclick = () => { if (cfg.situation === k) return; cfg.situation = k; item(cfg, "audit").on = k === "rebrand"; if (cfg.phasesAuto) cfg.phases = autoPhases(cfg); drawSit(); drawItems(); drawPhases(); live(); };
      sit.append(b);
    }
    const drawSit = () => { for (const b of sit.children) b.setAttribute("aria-checked", String(b.dataset.k === cfg.situation)); logoBox.classList.toggle("rb", cfg.situation === "rebrand"); };
    const brief = h("textarea", "inp"); brief.rows = 3; brief.maxLength = 2000; brief.value = cfg.brief || ""; brief.placeholder = "Ce știm despre client: domeniu, ce vrea, ce i-a plăcut, ce nu. Claude scrie copy-ul și brand experiences din asta."; brief.oninput = () => (cfg.brief = brief.value);
    const logoBox = h("div", "ofr-logo");
    const logoHead = h("div", "ofr-logo-h"); logoHead.append(h("b", "", "Logo-ul actual"), h("small", "muted", "Mai ales la rebranding: apare în ofertă la „De unde pornim”. Opțional pentru un brand nou."));
    logoBox.append(logoHead);
    if (cfg.currentLogo && cfg.currentLogo.urls) {
      const cur = h("div", "ofr-logo-cur"), im = h("img"); im.alt = "Logo-ul actual"; im.src = cfg.currentLogo.urls.preview || cfg.currentLogo.urls.png || cfg.currentLogo.urls.webp || cfg.currentLogo.urls.svg || "";
      const x = h("button", "btn sm ghost", "Scoate"); x.type = "button"; x.onclick = () => { cfg.currentLogo = null; cur.remove(); };
      cur.append(im, h("span", "", cfg.currentLogo.name || "logo"), x); logoBox.append(cur);
    }
    if (window.__opsUp) logoBox.append(window.__opsUp.mount("offer-logo", { kind: "logo", open: cfg.situation === "rebrand", fresh: true }));
    s1.b.append(g1, field("Situația brandului", sit), field("Brief pentru Claude", brief), logoBox);

    // 02 items
    const s2 = sec("02", "Procesul și prețurile");
    s2.b.append(h("p", "ofr-hint muted", "Prețurile de bază sunt cele de listă. Schimbă prețul pentru oferta asta: diferența apare lângă."));
    const itemsBox = h("div", "ofr-items");
    function drawItems() {
      itemsBox.replaceChildren(...ITEMS.map(([k, t, d]) => {
        const it = item(cfg, k), r = h("div", "ofr-it" + (it.on ? "" : " off"));
        const cb = h("input"); cb.type = "checkbox"; cb.checked = it.on; cb.id = "ofr-on-" + k; cb.onchange = () => { it.on = cb.checked; if (cfg.phasesAuto) { cfg.phases = autoPhases(cfg); drawPhases(); } drawItems(); drawCp(); live(); };
        const lab = h("label", "ofr-it-l"); lab.htmlFor = cb.id; lab.append(h("b", "", nm(cfg, k)), h("small", "muted", d + (k === "audit" ? " · implicit la rebranding" : "")));
        // rename this component for this offer (RO / EN); empty = the standard name
        const ren = h("details", "ofr-ren"), sm = h("summary", "", "✎ Nume în ofertă"); ren.append(sm);
        const L = (cfg.labels[k] = cfg.labels[k] || {});
        const ro = inp("text", L.ro || "", (v) => { L.ro = v.trim(); lab.firstChild.textContent = nm(cfg, k); if (cfg.phasesAuto) { cfg.phases = autoPhases(cfg); drawPhases(); } live(); }, t, 80); ro.setAttribute("aria-label", "Numele în română");
        const en = inp("text", L.en || "", (v) => { L.en = v.trim(); }, "English name", 80); en.setAttribute("aria-label", "Numele în engleză");
        if (L.ro || L.en) ren.open = true;
        const rr = h("div", "ofr-ren-r"); rr.append(h("span", "mono", "RO"), ro, h("span", "mono", "EN"), en); ren.append(rr);
        const right = h("div", "ofr-it-r");
        if (k === "canvas") {
          const st = h("div", "ofr-step"), mi = h("button", "", "−"), pl = h("button", "", "+"), n = h("span", "", String(it.qty)); mi.type = pl.type = "button";
          mi.setAttribute("aria-label", "Un canvas mai puțin"); pl.setAttribute("aria-label", "Un canvas în plus");
          const set = (q) => { it.qty = Math.max(1, Math.min(6, q)); n.textContent = String(it.qty); if (cfg.phasesAuto) { cfg.phases = autoPhases(cfg); drawPhases(); } upd(); drawCp(); live(); };
          mi.onclick = () => set(it.qty - 1); pl.onclick = () => set(it.qty + 1); st.append(mi, n, pl); right.append(st);
        }
        const pin = h("input", "inp ofr-price"); pin.type = "number"; pin.min = "0"; pin.step = "50"; pin.inputMode = "numeric"; pin.value = it.price; pin.setAttribute("aria-label", t + ": preț în oferta asta (EUR)" + (k === "canvas" ? ", pe canvas" : ""));
        const delta = h("span", "ofr-d"), baseL = h("span", "ofr-base mono", "listă " + money(it.base) + (k === "canvas" ? " · " + PER_PIECE : ""));
        const line = h("b", "ofr-line");
        const upd = () => { const df = num(it.price) - num(it.base), pc = it.base ? Math.round(df / it.base * 100) : 0; delta.className = "ofr-d " + (df < 0 ? "dn" : df > 0 ? "up" : "eq"); delta.textContent = df === 0 ? "= listă" : (df > 0 ? "+" : "−") + money(Math.abs(df)) + " · " + (df > 0 ? "+" : "−") + Math.abs(pc) + "%"; line.textContent = k === "canvas" ? it.qty + " × " + PER_PIECE + " = " + money(num(it.price) * it.qty) : ""; };
        pin.oninput = () => { it.price = Math.max(0, num(pin.value)); upd(); live(); };
        const reset = h("button", "ofr-reset", "↺"); reset.type = "button"; reset.title = "Înapoi la prețul de listă"; reset.setAttribute("aria-label", "Prețul de listă pentru " + t); reset.onclick = () => { it.price = it.base; pin.value = it.base; upd(); live(); };
        const pr = h("div", "ofr-pr"); pr.append(pin, reset); right.append(pr, delta, baseL, line); upd();
        if (k === "directions") {
          const st = h("div", "ofr-step"), mi = h("button", "", "−"), pl = h("button", "", "+"), n = h("span", "", String(it.qty || 3)); mi.type = pl.type = "button";
          mi.setAttribute("aria-label", "O direcție mai puțin"); pl.setAttribute("aria-label", "O direcție în plus");
          const set = (q) => { it.qty = Math.max(1, Math.min(6, q)); n.textContent = String(it.qty); drawCp(); live(); };
          mi.onclick = () => set((it.qty || 3) - 1); pl.onclick = () => set((it.qty || 3) + 1); st.append(mi, n, pl); right.prepend(st);
        }
        r.append(cb, lab, right, ren); return r;
      }));
    }
    drawItems(); s2.b.append(itemsBox);
    // specials
    const spBox = h("div", "ofr-sp");
    const spH = h("div", "ofr-sp-h"); spH.append(h("b", "", "Livrabile speciale"), h("small", "muted", "Orice în plus, cu prețul lui"));
    const spList = h("div", "ofr-sp-l");
    const addSp = h("button", "btn sm", "+ Livrabil special"); addSp.type = "button"; addSp.onclick = () => { cfg.specials.push({ title: "", price: 0, desc: "" }); drawSp(); spList.lastChild && spList.lastChild.querySelector("input").focus(); };
    function drawSp() {
      spList.replaceChildren(...cfg.specials.map((s, i) => {
        const r = h("div", "ofr-sp-r");
        const t = inp("text", s.title, (v) => { s.title = v; if (cfg.phasesAuto) { cfg.phases = autoPhases(cfg); drawPhases(); } live(); }, "Ex.: Sistem de etichete", 120); t.addEventListener("change", () => drawCp()); t.setAttribute("aria-label", "Livrabil special " + (i + 1));
        const p = h("input", "inp ofr-price"); p.type = "number"; p.min = "0"; p.step = "50"; p.value = s.price; p.setAttribute("aria-label", "Prețul livrabilului special (EUR)"); p.oninput = () => { s.price = Math.max(0, num(p.value)); live(); };
        const d = inp("text", s.desc, (v) => (s.desc = v), "Ce conține (opțional, Claude îl scrie frumos)", 300); d.classList.add("ofr-sp-d");
        const x = h("button", "ofr-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Scoate livrabilul"); x.onclick = () => { cfg.specials.splice(i, 1); cfg.packages.forEach((p) => { p.specialsOff = (p.specialsOff || []).map(Number).filter((j) => j !== i).map((j) => (j > i ? j - 1 : j)); }); if (cfg.phasesAuto) { cfg.phases = autoPhases(cfg); drawPhases(); } drawSp(); drawCp(); live(); };
        r.append(t, p, x, d); return r;
      }));
    }
    drawSp(); spBox.append(spH, spList, addSp); s2.b.append(spBox);
    // discount / vat / validity
    const g3 = h("div", "ofr-g3");
    const dseg = h("div", "seg"); for (const [k, t] of [["pct", "%"], ["amount", "€"]]) { const b = h("button", "", t); b.type = "button"; b.dataset.k = k; b.onclick = () => { cfg.discount.type = k; drawD(); live(); }; dseg.append(b); }
    const drawD = () => { for (const b of dseg.children) b.setAttribute("aria-pressed", String(b.dataset.k === cfg.discount.type)); };
    const dval = h("input", "inp ofr-price"); dval.type = "number"; dval.min = "0"; dval.value = cfg.discount.value || ""; dval.placeholder = "0"; dval.setAttribute("aria-label", "Reducere"); dval.oninput = () => { cfg.discount.value = Math.max(0, num(dval.value)); live(); };
    const drow = h("div", "ofr-drow"); drow.append(dseg, dval); drawD();
    const valid = h("input", "inp"); valid.type = "number"; valid.min = "1"; valid.max = "180"; valid.value = cfg.validityDays; valid.oninput = () => (cfg.validityDays = Math.max(1, num(valid.value, 30)));
    g3.append(field("Reducere (opțional)", drow), field("Notă TVA", inp("text", cfg.vatNote, (v) => (cfg.vatNote = v), "Prețurile nu includ TVA.", 160)), field("Valabilă (zile)", valid));
    s2.b.append(g3);
    const totBox = h("div", "ofr-total"); totBox.id = "ofr-total"; s2.b.append(totBox);
    // packages: 1–3 ways to buy the same process, shown side by side in the offer (never as process cards)
    const cpBox = h("div", "ofr-cp");
    const cpH = h("div", "ofr-cp-h0"); cpH.append(h("b", "", "Pachete"), h("small", "muted", "Opțional: 2 sau 3 pachete pentru același proces (ex. complet + compact). Fiecare păstrează ce bifezi; în ofertă apar unul lângă altul, cu totalul lor."));
    const cpBody = h("div", "ofr-pk-l");
    const cpAdd = h("button", "btn sm", "+ Pachet"); cpAdd.type = "button";
    const cpExt = h("button", "btn sm ghost", "+ Pachet extins (upsell)"); cpExt.type = "button"; cpExt.title = "Un pachet peste cel principal, cu mai mult";
    const newPk = (k, extra) => ({ id: "p" + (k + 1) + Date.now().toString(36).slice(-3), label: PK_NAMES[Math.min(k, 2)][0], labelEn: PK_NAMES[Math.min(k, 2)][1], off: [], specialsOff: [], prices: {}, ...extra });
    cpAdd.onclick = () => {
      const cv = item(cfg, "canvas");
      if (!cfg.packages.length) cfg.packages.push({ ...newPk(0), id: "p1" });
      if (cfg.packages.length < 3) { const k = cfg.packages.length; cfg.packages.push(newPk(k, { canvasQty: Math.max(1, (cv.qty || 2) - k) })); }
      drawCp(); drawGsel(); live();
    };
    cpExt.onclick = () => {
      if (cfg.packages.length >= 3) return;
      const cv = item(cfg, "canvas");
      if (!cfg.packages.length) cfg.packages.push({ ...newPk(0), id: "p1" });
      cfg.packages.unshift({ id: "px" + Date.now().toString(36).slice(-3), label: PK_EXT[0], labelEn: PK_EXT[1], off: [], specialsOff: [], prices: {}, canvasQty: (cv.qty || 2) + 1 });
      drawCp(); drawGsel(); live();
    };
    function drawGsel() {
      const sel = gselEl; if (!sel) return;
      const pk = cfg.packages || [], g = ganttPk(cfg); sel.closest(".field").hidden = pk.length < 2;
      sel.replaceChildren(...pk.map((p, k) => { const o = h("option", "", (p.label || PK_NAMES[Math.min(k, 2)][0]) + (p.recommended ? " · recomandat" : "")); o.value = p.id; o.selected = g === p; return o; }));
    }
    function drawCp() {
      cpBox.classList.toggle("on", cfg.packages.length >= 2); cpAdd.hidden = cpExt.hidden = cfg.packages.length >= 3; cpAdd.textContent = cfg.packages.length ? "+ Pachet" : "+ Împarte în pachete";
      const TP = pkTotals(cfg) || [], cv = item(cfg, "canvas"), dv = item(cfg, "directions");
      cpBody.replaceChildren(...cfg.packages.map((p, k) => {
        p.prices = p.prices || {};
        const card = h("div", "ofr-pk" + (p.recommended ? " rec" : "")), top = h("div", "ofr-pk-top");
        const name = inp("text", p.label, (v) => { p.label = v; live(); }, PK_NAMES[Math.min(k, 2)][0], 60); name.setAttribute("aria-label", "Numele pachetului " + (k + 1) + " (RO)");
        const x = h("button", "ofr-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Scoate pachetul"); x.onclick = () => { cfg.packages.splice(k, 1); if (cfg.packages.length < 2) cfg.packages = []; drawCp(); drawGsel(); live(); };
        top.append(name, x);
        const nameEn = inp("text", p.labelEn || "", (v) => { p.labelEn = v; }, PK_NAMES[Math.min(k, 2)][1], 60); nameEn.classList.add("ofr-pk-en"); nameEn.setAttribute("aria-label", "Numele pachetului " + (k + 1) + " (EN)");
        const rec = h("label", "ofr-chip ofr-rec"), rb = h("input"); rb.type = "checkbox"; rb.checked = !!p.recommended; rb.onchange = () => { cfg.packages.forEach((q) => delete q.recommended); if (rb.checked) p.recommended = true; if (cfg.phasesAuto && !cfg.ganttPackage) { cfg.phases = autoPhases(cfg); drawPhases(); } drawCp(); drawGsel(); live(); }; rec.append(rb, h("span", "", "Recomandat"));
        const rows = h("div", "ofr-pk-rows");
        const step = (val, set, lab) => { const st = h("div", "ofr-step sm"), mi = h("button", "", "−"), pl = h("button", "", "+"), n = h("span", "", String(val)); mi.type = pl.type = "button"; mi.setAttribute("aria-label", lab + " −"); pl.setAttribute("aria-label", lab + " +"); mi.onclick = () => set(val - 1); pl.onclick = () => set(val + 1); st.append(mi, n, pl); return st; };
        for (const [key] of ITEMS) {
          const it = item(cfg, key); if (!it.on) continue;
          const r = h("div", "ofr-pk-r" + ((p.off || []).includes(key) ? " off" : "")), lb = h("label", "ofr-pk-c"), cb = h("input"); cb.type = "checkbox"; cb.checked = !(p.off || []).includes(key);
          cb.onchange = () => { const off = new Set(p.off || []); if (cb.checked) off.delete(key); else off.add(key); p.off = [...off]; r.classList.toggle("off", !cb.checked); if (cfg.phasesAuto && ganttPk(cfg) === p) { cfg.phases = autoPhases(cfg); drawPhases(); } live(); };
          lb.append(cb, h("span", "", nm(cfg, key)));
          const pin = h("input", "inp ofr-price"); pin.type = "number"; pin.min = "0"; pin.step = "50"; pin.placeholder = String(it.price); pin.value = p.prices[key] ?? ""; pin.setAttribute("aria-label", nm(cfg, key) + ": preț în " + (p.label || "pachet") + (key === "canvas" ? " (pe bucată)" : ""));
          pin.oninput = () => { if (pin.value === "") delete p.prices[key]; else p.prices[key] = Math.max(0, num(pin.value)); live(); };
          r.append(lb);
          if (key === "canvas") r.append(step(p.canvasQty || cv.qty, (v) => { p.canvasQty = Math.max(1, Math.min(6, v)); if (cfg.phasesAuto && ganttPk(cfg) === p) { cfg.phases = autoPhases(cfg); drawPhases(); } drawCp(); live(); }, "Canvas"));
          if (key === "directions") r.append(step(p.directionsQty || dv.qty || 3, (v) => { p.directionsQty = Math.max(1, Math.min(6, v)); drawCp(); live(); }, "Direcții"));
          r.append(pin); rows.append(r);
        }
        cfg.specials.forEach((sx, j) => { if (!sx.title) return; const r = h("div", "ofr-pk-r"), lb = h("label", "ofr-pk-c"), cb = h("input"); cb.type = "checkbox"; cb.checked = !(p.specialsOff || []).map(Number).includes(j); cb.onchange = () => { const so = new Set((p.specialsOff || []).map(Number)); if (cb.checked) so.delete(j); else so.add(j); p.specialsOff = [...so]; r.classList.toggle("off", !cb.checked); live(); }; lb.append(cb, h("span", "", "★ " + sx.title)); r.classList.toggle("off", !cb.checked); r.append(lb, h("span", "mono muted", money(sx.price))); rows.append(r); });
        const tot = h("b", "ofr-pk-t", TP[k] ? money(TP[k].total) : ""); tot.dataset.k = k;
        card.append(top, nameEn, rec, rows, h("small", "muted ofr-pk-hint", "Preț gol = prețul din ofertă. Canvas: preț pe bucată."), tot); return card;
      }));
    }
    const drawTot = () => {};
    const cpBtns = h("div", "ofr-cp-btns"); cpBtns.append(cpAdd, cpExt);
    cpBox.append(cpH, cpBody, cpBtns); drawCp(); s2.b.append(cpBox);

    // 03 timeline
    const s3 = sec("03", "Calendarul");
    const g4 = h("div", "ofr-g2"), sd = inp("date", cfg.startDate, (v) => { cfg.startDate = v; live(); });
    const auto = h("button", "btn sm ghost", "↺ Refă din pașii aleși"); auto.type = "button"; auto.onclick = () => { cfg.phases = autoPhases(cfg); cfg.phasesAuto = true; drawPhases(); live(); };
    // the Gantt follows one package (packages may differ in duration); default: the recommended / first one
    const gsel = h("select", "inp"); gsel.id = "ofr-gpk"; gselEl = gsel;
    gsel.onchange = () => { cfg.ganttPackage = gsel.value; if (cfg.phasesAuto) { cfg.phases = autoPhases(cfg); drawPhases(); } live(); };
    const gField = field("Calendarul urmează pachetul", gsel);
    g4.append(field("Start (luni)", sd), field("Etape", auto), gField);
    drawGsel();
    const phBox = h("div", "ofr-ph");
    function drawPhases() {
      const head = h("div", "ofr-ph-r hd"); ["Etapă", "Start (săpt.)", "Durată", "Reper la final (opțional)", ""].forEach((t) => head.append(h("span", "mono", t)));
      phBox.replaceChildren(head, ...cfg.phases.map((p, i) => {
        const r = h("div", "ofr-ph-r"); r.style.setProperty("--b", PH_COLORS[i % PH_COLORS.length]);
        const touch = () => { cfg.phasesAuto = false; live(); };
        const t = inp("text", p.title, (v) => { p.title = v; touch(); }, "Etapă", 80); t.setAttribute("aria-label", "Numele etapei " + (i + 1));
        const st = h("input", "inp"); st.type = "number"; st.min = "0"; st.step = "0.5"; st.value = Math.round(num(p.start) * 100) / 100; st.setAttribute("aria-label", "Săptămâna de start (0 = prima)"); st.oninput = () => { p.start = Math.max(0, num(st.value)); touch(); };
        const wk = h("input", "inp"); wk.type = "number"; wk.min = "0.5"; wk.step = "0.5"; wk.value = Math.round(num(p.weeks) * 100) / 100; wk.setAttribute("aria-label", "Durata în săptămâni"); wk.oninput = () => { p.weeks = Math.max(0.5, num(wk.value, 1)); touch(); };
        const ms = inp("text", p.milestone, (v) => { p.milestone = v; touch(); }, "Ex.: Prezentare", 60); ms.setAttribute("aria-label", "Reper la finalul etapei");
        const x = h("button", "ofr-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Scoate etapa"); x.onclick = () => { cfg.phases.splice(i, 1); cfg.phasesAuto = false; drawPhases(); live(); };
        r.append(t, st, wk, ms, x); return r;
      }));
      const add = h("button", "btn sm", "+ Etapă"); add.type = "button"; add.onclick = () => { cfg.phases.push({ id: "p" + Date.now().toString(36), title: "", start: weeksOf(cfg), weeks: 1, milestone: "" }); cfg.phasesAuto = false; drawPhases(); live(); };
      phBox.append(add);
    }
    drawPhases(); s3.b.append(g4, phBox);

    // 04 next step: delivered separately after the project, never in the total
    const s5 = sec("04", "Ce poate urma · oportunități");
    const nxL = h("p", "ofr-hint muted", "Oportunități după proiect: Claude propune 4–6 pentru client (plan de marketing pe 1 an, site, producție de conținut, strategie de comunicare, roadmap de touchpoint-uri…). Bifează ce apare în ofertă; prețul e opțional. Nu intră niciodată în total.");
    const nxList = h("div", "ofr-nx-l");
    const nxAdd = h("button", "btn sm", "+ Oportunitate"); nxAdd.type = "button"; nxAdd.onclick = () => { cfg.nextSteps.push({ title: "", desc: "", price: "", picked: true }); drawNx(); const ins = nxList.querySelectorAll("input[type=text]"); if (ins.length) ins[ins.length - 2].focus(); };
    function drawNx() {
      nxList.replaceChildren(...cfg.nextSteps.map((x, i) => {
        const r = h("div", "ofr-nx-r" + (x.picked !== false ? " on" : ""));
        const cb = h("input"); cb.type = "checkbox"; cb.checked = x.picked !== false; cb.setAttribute("aria-label", "Apare în ofertă"); cb.onchange = () => { x.picked = cb.checked; r.classList.toggle("on", cb.checked); live(); };
        const t = inp("text", x.title, (v) => { x.title = v; live(); }, "Ex.: Site de prezentare", 120); t.setAttribute("aria-label", "Oportunitatea " + (i + 1));
        const p = h("input", "inp ofr-price"); p.type = "number"; p.min = "0"; p.step = "50"; p.placeholder = "fără preț"; p.value = x.price ?? ""; p.setAttribute("aria-label", "Preț (opțional, EUR)"); p.oninput = () => { x.price = p.value; live(); };
        const d = inp("text", x.desc, (v) => (x.desc = v), "Ce conține (Claude îl scrie pentru client)", 300); d.classList.add("ofr-sp-d");
        const xb = h("button", "ofr-x", "×"); xb.type = "button"; xb.setAttribute("aria-label", "Scoate oportunitatea"); xb.onclick = () => { cfg.nextSteps.splice(i, 1); drawNx(); live(); };
        r.append(cb, t, p, xb, d); return r;
      }));
    }
    drawNx(); s5.b.append(nxL, nxList, nxAdd);

    // 05 experiences (after Claude's preview) + actions
    const s4 = sec("05", "Brand experiences · propuneri"); s4.id = "ofr-exp";
    const act = h("div", "ofr-act"); act.id = "ofr-act";
    form.append(s1, s2, s3, s5, s4, act);
    wrap.append(bar, h("div", "ofr-cols")); wrap.lastChild.append(form, pane);
    root.replaceChildren(wrap);
    drawSit(); refreshEditor();
  }

  let docSig = null;
  function refreshEditor() {
    // the snapshot comes every 20 s: redraw the parts that depend on Claude's doc only when it changed (no lost typing)
    const d = curDoc(), sig = JSON.stringify(d ? [d.status, d.working, d.pendingId, d.previewUrl, d.url, d.experiences, d.updatedAt] : null);
    drawTotal(); if (sig === docSig) return; docSig = sig; drawExp(); drawActions(); drawPane();
  }
  let liveT = 0;
  function live() { drawTotal(); { const TP = pkTotals(cfg) || []; document.querySelectorAll(".ofr-pk-t").forEach((b) => { const t = TP[+b.dataset.k]; b.textContent = t ? money(t.total) : ""; }); } clearTimeout(liveT); liveT = setTimeout(() => { if (pvTab === "live") drawPane(); }, 120); }
  function drawTotal() {
    const box = $("ofr-total"); if (!box) return; const T = totals(cfg), df = T.total - T.base;
    box.replaceChildren();
    const l = h("div", "ofr-total-l");
    l.append(h("span", "mono", "Total proces"), h("b", "", money(T.total)));
    const r = h("div", "ofr-total-r");
    const row = (a, b, cls) => { const x = h("div", "ofr-tr" + (cls ? " " + cls : "")); x.append(h("span", "", a), h("b", "", b)); r.append(x); };
    row("Subtotal", money(T.subtotal)); if (T.discount) row("Reducere", "−" + money(T.discount));
    row("Față de listă", df === 0 ? "la fel" : (df > 0 ? "+" : "−") + money(Math.abs(df)), df < 0 ? "dn" : df > 0 ? "up" : "");
    row("Durată", weeksOf(cfg) ? Math.ceil(weeksOf(cfg)) + " săpt. de lucru" : "–");
    const TP = pkTotals(cfg); if (TP) TP.forEach((t, k) => row((cfg.packages[k].label || PK_NAMES[Math.min(k, 2)][0]) + (cfg.packages[k].recommended ? " ★" : ""), money(t.total), "cv"));
    box.append(l, r);
  }
  function drawExp() {
    const s = $("ofr-exp"); if (!s) return; const doc = curDoc(), body = s.querySelector(".ofr-sec-b"); body.replaceChildren();
    const exps = doc && Array.isArray(doc.experiences) ? doc.experiences : [];
    if (!exps.length) { body.append(h("p", "ofr-hint muted", doc ? "Claude propune 5–6 experiențe pentru client odată cu preview-ul. Apar aici." : "După ce trimiți, Claude propune 5–6 brand experiences pentru client. Alegeți 1–3 aici, cu sau fără preț.")); return; }
    if (!cfg.picks) cfg.picks = Object.fromEntries(exps.filter((e) => e.picked).map((e) => [e.id, e.price == null ? "" : String(e.price)]));
    const n = () => Object.keys(cfg.picks).length;
    const cnt = h("p", "ofr-hint muted");
    const list = h("div", "ofr-xl");
    const draw = () => {
      cnt.textContent = "Alese: " + n() + " din max. 3 · prețul e opțional (gol = „preț la discuție”)";
      list.replaceChildren(...exps.map((e) => {
        const on = e.id in cfg.picks, r = h("div", "ofr-x-r" + (on ? " on" : "")), lb = h("label", "ofr-x-lb");
        const cb = h("input"); cb.type = "checkbox"; cb.checked = on; cb.disabled = !on && n() >= 3;
        cb.onchange = () => { if (cb.checked) { if (n() >= 3) { cb.checked = false; toast("Maximum 3 experiențe."); return; } cfg.picks[e.id] = e.price == null ? "" : String(e.price); } else delete cfg.picks[e.id]; draw(); drawActions(); };
        const tx = h("div", "ofr-x-t"); tx.append(h("b", "", e.title || e.id), h("small", "muted", e.desc || ""));
        const p = h("input", "inp ofr-price"); p.type = "number"; p.min = "0"; p.step = "50"; p.placeholder = "preț opț."; p.disabled = !on; p.value = on ? cfg.picks[e.id] : (e.price ?? ""); p.setAttribute("aria-label", "Prețul experienței (opțional, EUR)");
        p.oninput = () => { if (e.id in cfg.picks) cfg.picks[e.id] = p.value; };
        lb.append(cb, tx); r.append(lb, p); return r;
      }));
    };
    draw(); body.append(cnt, list);
  }
  function picksPayload() { return Object.entries(cfg.picks || {}).map(([id, v]) => ({ id, price: v === "" || v == null ? null : Math.max(0, num(v)) })); }
  function drawActions() {
    const a = $("ofr-act"); if (!a) return; a.replaceChildren(); const doc = curDoc();
    if (!doc || doc.status === "sent") {
      const send = h("button", "btn k", doc ? "Retrimite la Claude" : "Trimite la Claude"); send.type = "button";
      if (doc && doc.pendingId) { send.disabled = true; send.textContent = "Trimisă · Claude scrie preview-ul"; }
      send.onclick = () => sendNew(send);
      a.append(h("p", "ofr-hint muted", "Claude scrie copy-ul în RO și EN, propune brand experiences și face un preview. Nu se publică nimic până nu apăsați „Publică”."), send);
      return;
    }
    const note = h("textarea", "inp"); note.rows = 2; note.maxLength = 1500; note.placeholder = "Ce să schimbe Claude (opțional): ton, un paragraf, o experiență…"; note.id = "ofr-note";
    const edit = h("button", "btn", "Cere modificări"); edit.type = "button"; edit.onclick = () => sendEdit(edit, note.value);
    const pub = h("button", "btn y", doc.status === "published" ? "Republică" : "Publică"); pub.type = "button"; pub.onclick = () => sendPublish(pub);
    if (doc.working) { edit.disabled = pub.disabled = true; pub.textContent = doc.working === "publish" ? "Se publică…" : doc.working === "unpublish" ? "Se retrage…" : "Claude lucrează…"; }
    if (doc.status !== "preview" && doc.status !== "published" && doc.status !== "withdrawn") pub.disabled = true;
    if (doc.status === "withdrawn") pub.textContent = "Publică din nou";
    const row = h("div", "ofr-act-r"); row.append(edit, pub);
    // "Șterge": the whole offer (published page, preview, Claude's files); never the site's own proposals/ folder
    const del = h("button", "btn sm ghost ofr-del", "Șterge"); del.type = "button"; del.disabled = !!doc.working;
    del.onclick = async () => {
      const nm = (doc.client && doc.client.name) || "client";
      if (!confirm("Ștergi definitiv oferta pentru " + nm + "?\nDispar pagina publicată (dacă există), preview-ul și fișierele ei. Nu se poate anula.")) return;
      const ok = await send(del, "Ofertă · șterge · " + nm + " · " + (doc.slug || doc.id), { type: "offer-delete", offerId: doc.id, slug: doc.slug || null }, "Trimis. Claude șterge oferta.");
      if (ok) closeEditor();
    };
    a.append(field("Pentru Claude", note), row);
    const dz = h("div", "ofr-danger"); dz.append(h("span", "mono muted", "Zona periculoasă"), del); a.append(dz);
    if (doc.status === "published" && doc.url) {
      const wd = h("button", "btn sm ghost ofr-wd", "Retrage oferta"); wd.type = "button"; wd.disabled = !!doc.working;
      wd.onclick = async () => { if (!confirm("Retragi oferta pentru " + ((doc.client && doc.client.name) || "client") + "?\nLinkul nu mai merge pentru nimeni. O poți publica din nou mai târziu.")) return; await send(wd, "Ofertă · retrage · " + ((doc.client && doc.client.name) || "") + " · " + (doc.slug || ""), { type: "offer-unpublish", offerId: doc.id, slug: doc.slug || null }, "Trimis. Claude retrage oferta."); };
      row.prepend(wd);
    }
    if (doc.url && doc.status === "published") { const l = h("div", "ofr-pub"); const x = h("a", "", location.host + doc.url); x.href = doc.url; x.target = "_blank"; x.rel = "noopener"; const c = h("button", "btn sm ghost", "Copiază"); c.type = "button"; c.onclick = () => copy(location.origin + doc.url); l.append(h("span", "mono", "Publicată"), x, c); a.append(l); }
  }
  function drawPane() {
    const pane = $("ofr-pane"); if (!pane) return; const doc = curDoc();
    const tabs = h("div", "seg ofr-tabs"); tabs.setAttribute("role", "tablist");
    for (const [k, t] of [["live", "Schiță live"], ["claude", "Preview Claude"]]) { const b = h("button", "", t); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-pressed", String(pvTab === k)); b.onclick = () => { pvTab = k; drawPane(); }; tabs.append(b); }
    const head = h("div", "ofr-pane-h"); head.append(tabs);
    if (pvTab === "claude" && doc && (doc.previewUrl || doc.url)) {
      const lg = h("div", "seg"); for (const k of ["ro", "en"]) { const b = h("button", "", k.toUpperCase()); b.type = "button"; b.setAttribute("aria-pressed", String(pvLang === k)); b.onclick = () => { pvLang = k; drawPane(); }; lg.append(b); }
      // once published, the published page (the preview files may be older than the last publish)
      const src = doc.url && doc.status === "published" ? (pvLang === "en" && doc.urlEn ? doc.urlEn : doc.url) : (pvLang === "en" && doc.previewUrlEn ? doc.previewUrlEn : doc.previewUrl);
      const op = h("a", "btn sm ghost", "Deschide ↗"); op.href = src; op.target = "_blank"; op.rel = "noopener";
      head.append(lg, op);
      const old = pane.querySelector("iframe");
      if (old && old.dataset.src === src && pane.querySelector(".ofr-pane-h")) { pane.querySelector(".ofr-pane-h").replaceWith(head); return; }
      const fr = h("iframe", "ofr-frame"); fr.src = src; fr.dataset.src = src; fr.title = "Preview-ul ofertei"; fr.loading = "lazy"; fr.referrerPolicy = "no-referrer";
      pane.replaceChildren(head, fr); return;
    }
    const box = h("div", "ofr-live");
    if (pvTab === "claude") box.append(h("p", "ofr-wait", doc && doc.status === "sent" ? "Claude scrie oferta. Preview-ul apare aici când e gata (de obicei în câteva minute)." : "Încă nu există un preview de la Claude. Trimite oferta și apare aici."));
    const T = totals(cfg);
    const hero = h("div", "ofr-lv-hero");
    hero.append(h("span", "ofr-lv-sit " + cfg.situation, SIT[cfg.situation]), h("b", "ofr-lv-cl", cfg.client.name || "Numele clientului"));
    if (cfg.currentLogo && cfg.currentLogo.urls) { const f = h("figure", "ofr-lv-from"); const im = h("img"); im.alt = ""; im.src = cfg.currentLogo.urls.preview || cfg.currentLogo.urls.png || cfg.currentLogo.urls.webp || cfg.currentLogo.urls.svg || ""; f.append(h("figcaption", "mono", "De unde pornim"), im); hero.append(f); }
    const items = h("div", "ofr-lv-items");
    T.items.forEach((i, k) => { const r = h("div", "ofr-lv-i"); r.style.setProperty("--b", PH_COLORS[k % PH_COLORS.length]); const name = nm(cfg, i.key) + (i.key === "canvas" ? " ×" + i.q + " · " + money(i.price) + " " + PER_PIECE : ""); r.append(h("span", "", name)); const p = h("b", ""); if (i.line < i.baseLine) p.append(h("s", "", money(i.baseLine)), " "); p.append(money(i.line)); r.append(p); items.append(r); });
    T.specials.forEach((s) => { const r = h("div", "ofr-lv-i sp"); r.append(h("span", "", "★ " + s.title), h("b", "", money(s.price))); items.append(r); });
    const tot = h("div", "ofr-lv-tot"); tot.append(h("span", "mono", T.discount ? "Total · după reducere " + money(T.discount) : "Total proces"), h("b", "", money(T.total)));
    if (cfg.includeProcess) box.append(h("div", "ofr-lv-proc", "▶ Prezentarea procesului Cromatic · apoi oferta financiară"));
    box.append(hero, items, tot);
    const TP = pkTotals(cfg);
    if (TP) {
      const row = h("div", "ofr-lv-pks n" + TP.length);
      TP.forEach((t, k) => {
        const pk = cfg.packages[k], c = h("div", "ofr-lv-pk" + (pk.recommended || (!cfg.packages.some((x) => x.recommended) && k === 0) ? " ref" : ""));
        const out = T.items.filter((i) => !t.items.some((x) => x.key === i.key)).map((i) => nm(cfg, i.key));
        const cvA = t.items.find((i) => i.key === "canvas");
        T.specials.forEach((sx) => { if (!t.specials.includes(sx) && !t.specials.some((y) => y.title === sx.title)) out.push(sx.title); });
        c.append(h("span", "mono", (pk.label || PK_NAMES[Math.min(k, 2)][0]) + (pk.recommended ? " · recomandat" : "")), h("b", "", money(t.total)), h("small", "", (cvA ? cvA.q + " canvas · " : "") + (out.length ? "fără " + out.join(", ") : "tot procesul")));
        row.append(c);
      });
      box.append(row);
    }
    const NX = cfg.nextSteps.filter((x) => x.title && x.picked !== false);
    if (NX.length) { const nx = h("div", "ofr-lv-nx"); nx.append(h("span", "mono", "Ce poate urma · separat, nu intră în total")); NX.forEach((x) => { const r = h("div", ""); r.append(h("span", "", "→ " + x.title), h("b", "", x.price !== "" && x.price != null ? money(x.price) : "separat")); nx.append(r); }); box.append(nx); }
    box.append(gantt(cfg));
    pane.replaceChildren(head, box);
  }
  /** the same Gantt as the published offer, smaller: weeks across, a bar per phase, overlaps visible, milestones as diamonds */
  function gantt(c) {
    const P0 = c.phases.filter((p) => p.title && num(p.weeks) > 0), work = Math.max(0, ...P0.map((p) => num(p.start) + num(p.weeks))), K = calendar(c, work);
    const P = P0.map((p) => ({ ...p, s0: K.cs(num(p.start)), e0: K.ce(num(p.start) + num(p.weeks)) })), end = Math.max(0, ...P.map((p) => p.e0)), N = Math.max(1, Math.ceil(end)), HS = new Set(K.hol.filter((w) => w < N));
    const g = h("div", "ofr-gantt"); g.style.setProperty("--n", N);
    if (!P.length) { g.append(h("p", "muted", "Adaugă etape ca să vezi calendarul.")); return g; }
    const head = h("div", "ofr-gh"); for (let w = 0; w < N; w++) { const s = h("span", HS.has(w) ? "hol" : "", "S" + (w + 1)); if (HS.has(w)) s.title = "Săptămână liberă (sărbători)"; if (c.startDate) { const d = new Date(c.startDate + "T12:00:00"); d.setDate(d.getDate() + w * 7); s.title = d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" }); } head.append(s); }
    g.append(head);
    P.forEach((p, i) => {
      const r = h("div", "ofr-gr"), lab = h("span", "ofr-gl", p.title), tr = h("div", "ofr-gt"), bar = h("i", "ofr-gb");
      bar.style.left = (p.s0 / N * 100) + "%"; bar.style.width = ((p.e0 - p.s0) / N * 100) + "%";
      HS.forEach((w) => { const x = h("i", "ofr-ghol"); x.style.left = (w / N * 100) + "%"; x.style.width = (100 / N) + "%"; tr.append(x); }); bar.style.setProperty("--b", PH_COLORS[i % PH_COLORS.length]); bar.style.setProperty("--i", i);
      tr.append(bar);
      if (p.milestone) { const m = h("em", "ofr-gm"); m.style.left = (p.e0 / N * 100) + "%"; m.title = p.milestone; tr.append(m); }
      r.append(lab, tr); g.append(r);
    });
    if (c.startDate) { const d = new Date(c.startDate + "T12:00:00"); d.setDate(d.getDate() + Math.ceil(end) * 7 - 3); const f = h("div", "ofr-gf"); f.append(h("span", "mono", "Predare finală"), h("b", "", d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }))); g.append(f); }
    return g;
  }

  // ---------- commands ----------
  function cleanCfg() {
    const c = JSON.parse(JSON.stringify(cfg)); delete c.picks;
    c.specials = c.specials.filter((s) => s.title); c.phases = c.phases.filter((p) => p.title);
    const T = totals(c); c.totals = { subtotal: T.subtotal, discount: T.discount, total: T.total, base: T.base, weeks: Math.ceil(weeksOf(c)) };
    const TP = pkTotals(c); if (TP) c.totals.packages = TP.map((t, k) => ({ id: c.packages[k].id, label: c.packages[k].label, total: t.total }));
    if (!TP) c.packages = [];
    c.nextSteps = (c.nextSteps || []).filter((x) => x.title).map((x) => ({ ...x, picked: x.picked !== false }));
    return c;
  }
  function summary(c) {
    const T = c.totals;
    return [SIT[c.situation], ...totals(c).items.map((i) => (nm(cfg, i.key)) + (i.key === "canvas" ? " ×" + i.q : "") + " " + money(i.line) + (i.line !== i.baseLine ? " (listă " + money(i.baseLine) + ")" : "")),
      ...c.specials.map((s) => "Special: " + s.title + " " + money(s.price)), T.discount ? "Reducere −" + money(T.discount) : "", "Total " + money(T.total) + " · " + T.weeks + " săpt.", T.packages ? "Pachete: " + T.packages.map((p, k) => p.label + " " + money(p.total) + ((c.packages[k].off || []).length || (c.packages[k].specialsOff || []).length || c.packages[k].canvasQty ? " (" + [c.packages[k].canvasQty ? c.packages[k].canvasQty + " canvas" : "", (c.packages[k].off || []).length ? "fără " + c.packages[k].off.map((key) => (ITEMS.find((x) => x[0] === key) || [key, key])[1]).join(", ") : ""].filter(Boolean).join(", ") + ")" : "") + (c.packages[k].recommended ? " ★" : "")).join(" / ") : "", c.nextSteps.some((x) => x.picked) ? "Ce poate urma (bifat): " + c.nextSteps.filter((x) => x.picked).map((x) => x.title).join(", ") : ""].filter(Boolean).join(" · ");
  }
  async function send(btn, text, payload, ok) {
    if (!db) return; btn.disabled = true; const was = btn.textContent; btn.textContent = "Se trimite…";
    try { await db.collection("offers").add({ text: text.slice(0, 3900), payload }); toast(ok); btn.textContent = "Trimis"; setTimeout(render, 400); return true; }
    catch (e) { btn.disabled = false; btn.textContent = was; toast(e && e.code === "rate_limited" ? "Prea multe cereri. Mai încearcă în câteva minute." : "Nu s-a trimis. Mai încearcă.", "err"); return false; }
  }
  async function sendNew(btn) {
    if (!cfg.client.name.trim()) { toast("Scrie numele clientului.", "err"); const i = $("ofr-client"); if (i) i.focus(); return; }
    if (window.__opsUp && window.__opsUp.busy("offer-logo")) { toast("Logo-ul încă se încarcă.", "err"); return; }
    const up = window.__opsUp ? window.__opsUp.payload("offer-logo") : {};
    if (up.uploads && up.uploads.length) { const lg = up.uploads.find((u) => u.kind === "logo") || up.uploads[0]; cfg.currentLogo = { id: lg.id, name: lg.name, type: lg.type, urls: lg.urls, w: lg.w, h: lg.h }; }
    const c = cleanCfg();
    const ok = await send(btn, "Ofertă nouă · Branding · " + c.client.name + "\n" + summary(c) + (c.brief ? "\nBrief: " + c.brief : ""), { type: "offer-new", offer: c, ...(up.uploads ? { uploads: up.uploads } : {}) }, "Trimisă. Claude scrie preview-ul și îl vezi aici.");
    if (ok) { if (window.__opsUp) window.__opsUp.reset("offer-logo"); closeEditor(); }
  }
  async function sendEdit(btn, note) {
    const doc = curDoc(), c = cleanCfg();
    await send(btn, "Ofertă · modificări · " + c.client.name + (note ? "\n" + note : "") + "\n" + summary(c), { type: "offer-edit", offerId: doc.id, slug: doc.slug || null, offer: c, picks: picksPayload(), note: String(note || "").slice(0, 1500) }, "Trimis. Claude reface preview-ul.");
  }
  async function sendPublish(btn) {
    const doc = curDoc(), picks = picksPayload(), exps = (doc && doc.experiences) || [];
    if (exps.length && (picks.length < 1 || picks.length > 3)) { toast("Alegeți 1–3 brand experiences înainte de publicare.", "err"); const s = $("ofr-exp"); if (s) s.scrollIntoView({ behavior: "smooth" }); return; }
    if (!confirm((doc.original ? "Atenție: pagina originală rămâne cea vizibilă la acest link până o scoatem din repo (un commit + deploy). Versiunea din generator se pregătește sub același link.\n\n" : "") + "Publici oferta pentru " + ((doc.client && doc.client.name) || "client") + "?\nLinkul devine accesibil oricui îl are (nu e listat nicăieri).")) return;
    const c = cleanCfg();
    await send(btn, "Ofertă · publică · " + c.client.name + " · " + money(c.totals.total) + (picks.length ? " · experiențe: " + picks.map((p) => p.id + (p.price != null ? " " + money(p.price) : "")).join(", ") : ""), { type: "offer-publish", offerId: doc.id, slug: doc.slug || null, offer: c, picks }, "Trimis la publicare. Linkul apare aici.");
  }

  // ---------- small form helpers ----------
  function sec(n, t) { const s = h("section", "ofr-sec"), hd = h("div", "ofr-sec-h"), b = h("div", "ofr-sec-b"); hd.append(h("span", "mono", n), h("h3", "", t)); s.append(hd, b); s.b = b; return s; }
  function field(label, ctl) { const f = h("div", "field"); const l = h("label", "", label); if (ctl.id) l.htmlFor = ctl.id; else if (ctl.tagName === "INPUT" || ctl.tagName === "TEXTAREA") { ctl.id = "ofr-f-" + Math.random().toString(36).slice(2, 8); l.htmlFor = ctl.id; } f.append(l, ctl); return f; }
  function inp(type, val, on, ph, max, id) { const i = h("input", "inp"); i.type = type; i.value = val || ""; if (ph) i.placeholder = ph; if (max) i.maxLength = max; if (id) i.id = id; i.autocomplete = "off"; i.oninput = () => on(i.value); return i; }

  // ---------- start ----------
  async function start() {
    if (!window.claude || !window.claude.use) return;
    db = await window.claude.use("db"); if (!db) return;
    if (!admin()) return; // members: no offers, no prices (the server answers 403 anyway)
    await loadPrices();
    db.collection("offers").onSnapshot((q) => { offers = q.docs.map((x) => ({ id: x.id, ...x.data() })); render(); });
    db.collection("inbox").orderBy("createdAt", "desc").limit(60).onSnapshot((q) => { inbox = q.docs.map((x) => ({ id: x.id, ...x.data() })); render(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.__opsOffers = { totals, autoPhases, freshCfg }; // for tests
})();
