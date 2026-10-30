// TASK-142 · /ops Fișiere (admins only). Drop a file, get a link at once; replace keeps the link; delete kills it.
// Everything goes through /api/ops/files (ops/files.mjs); the links are /f/<id>/<name>, sandboxed by the server.
(() => {
  "use strict";
  const body = document.getElementById("fil-body");
  if (!body) return;
  const stamp = document.getElementById("fil-n");
  const NS = "http://www.w3.org/2000/svg";
  const ACCEPT = { html: ".html,.htm,text/html", pdf: ".pdf,application/pdf", image: ".png,.jpg,.jpeg,.webp,.avif,.gif,.svg,image/*" };
  const ALL = [ACCEPT.html, ACCEPT.pdf, ACCEPT.image].join(",");
  let files = null, room = null, asking = null, fresh = [], busy = new Map(), loading = false;

  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  const ic = (id) => { const s = document.createElementNS(NS, "svg"); s.setAttribute("class", "ic"); s.setAttribute("aria-hidden", "true"); const u = document.createElementNS(NS, "use"); u.setAttribute("href", "#" + id); s.append(u); return s; };
  const toast = (m, k) => { if (window.__opsToast) window.__opsToast(m, k); };
  const on = () => document.body.dataset.cat === "files";
  const abs = (url) => location.origin + url;
  const num = (v, d) => Number(v).toLocaleString("ro-RO", { maximumFractionDigits: d });
  function size(b) { if (b < 1024) return b + " B"; if (b < 1048576) return Math.round(b / 1024) + " KB"; if (b < 1073741824) return num(b / 1048576, b < 10485760 ? 1 : 0) + " MB"; return num(b / 1073741824, 1) + " GB"; }
  const dayKey = (d) => d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  function when(iso) {
    const d = new Date(iso); if (!iso || isNaN(d)) return "";
    const t = d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }), n = new Date(), y = new Date(Date.now() - 864e5);
    if (dayKey(d) === dayKey(n)) return "azi, " + t;
    if (dayKey(d) === dayKey(y)) return "ieri, " + t;
    return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" }).replace(".", "") + ", " + t;
  }
  const btn = (cls, txt, icon, fn) => { const b = el("button", "btn sm " + cls); b.type = "button"; if (icon) b.append(ic(icon)); b.append(txt); b.onclick = fn; return b; };

  async function copy(url, b) {
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; }
    catch { const t = el("textarea"); t.value = url; t.style.cssText = "position:fixed;opacity:0"; document.body.append(t); t.select(); try { ok = document.execCommand("copy"); } catch {} t.remove(); }
    if (!ok) return toast("Nu am putut copia. Ține apăsat pe link.", "err");
    if (!b) return;
    const was = [...b.childNodes]; b.replaceChildren(ic("i-check"), "Copiat");
    setTimeout(() => { if (b.isConnected) b.replaceChildren(...was); }, 1600);
  }

  // ---------- one upload: POST with progress; `to` is an id when it replaces ----------
  function send(file, to, onProgress) {
    return new Promise((done) => {
      if (room && file.size > room.fileMax) return done({ ok: false, message: "Fișierul e peste " + Math.round(room.fileMax / 1048576) + " MB." });
      const x = new XMLHttpRequest();
      x.open("POST", "/api/ops/files" + (to ? "/" + to : "") + "?name=" + encodeURIComponent(file.name));
      x.setRequestHeader("Content-Type", "application/octet-stream");
      x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      x.onload = () => {
        let j = null; try { j = JSON.parse(x.responseText); } catch {}
        if (j) return done(j);
        done({ ok: false, message: x.status === 413 ? "Fișierul e prea mare pentru server." : "Serverul nu a răspuns cum trebuie (" + x.status + ")." });
      };
      x.onerror = () => done({ ok: false, message: "Conexiunea s-a întrerupt. Încearcă din nou." });
      x.send(file);
    });
  }

  // ---------- adding: the queue is drawn apart from the list, so a slow upload never redraws what you are clicking ----------
  const queue = el("div", "fil-q"); queue.setAttribute("aria-live", "polite");
  async function addAll(list) {
    list = [...list]; if (!list.length) return;
    fresh = []; asking = null; queue.replaceChildren(); render();
    const items = list.map((f) => {
      const row = el("div", "fil-qi"), pc = el("span", "fil-pc", "așteaptă"), bar = el("div", "fil-bar"), fill = el("i");
      bar.append(fill); row.append(el("span", "", f.name), pc, bar); queue.append(row);
      return { f, row, pc, bar, fill };
    });
    for (const it of items) { // one at a time: the box is small, and the order stays the one you picked
      it.pc.textContent = "0%";
      const r = await send(it.f, null, (p) => { const v = Math.round(p * 100); it.pc.textContent = v + "%"; it.fill.style.width = v + "%"; });
      if (r.ok) { fresh.push(r.file); room = r.room; it.row.remove(); files = [r.file, ...(files || [])]; render(); }
      else { it.pc.remove(); it.bar.remove(); it.row.classList.add("err"); it.row.append(el("span", "fil-msg", r.message || "Nu s-a încărcat.")); }
    }
    const card = body.querySelector(".fil-ready"); // on a phone the new link would sit under the fold
    if (card) card.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }

  // ---------- replacing ----------
  function pickReplace(f) {
    const inp = el("input", "fil-in"); inp.type = "file"; inp.accept = ACCEPT[f.kind] || ALL; inp.setAttribute("aria-hidden", "true"); inp.tabIndex = -1;
    inp.onchange = async () => {
      const file = inp.files[0]; inp.remove(); if (!file) return;
      busy.set(f.id, 0); render();
      const r = await send(file, f.id, (p) => { busy.set(f.id, p); const i = body.querySelector('[data-bar="' + f.id + '"] i'); if (i) i.style.width = Math.round(p * 100) + "%"; });
      busy.delete(f.id);
      if (r.ok) { files = files.map((x) => (x.id === f.id ? r.file : x)).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)); room = r.room; toast("Înlocuit. Linkul rămâne același."); }
      else { toast(r.message || "Nu s-a înlocuit.", "err"); if (r.error === "not_found") load(); }
      render();
    };
    document.body.append(inp); inp.click();
  }

  // ---------- deleting ----------
  async function kill(f) {
    busy.set(f.id, -1); asking = null; render();
    let j = null; try { const r = await fetch("/api/ops/files/" + f.id, { method: "DELETE", credentials: "same-origin" }); j = await r.json(); } catch {}
    busy.delete(f.id);
    if (j && (j.ok || j.error === "not_found")) { files = files.filter((x) => x.id !== f.id); fresh = fresh.filter((x) => x.id !== f.id); if (j.room) room = j.room; toast("Șters. Linkul nu mai merge."); }
    else toast((j && j.message) || "Nu s-a șters. Încearcă din nou.", "err");
    render();
    const pick = document.getElementById("fil-pick"); if (pick) pick.focus({ preventScroll: true });
  }

  // ---------- drawing ----------
  const input = el("input", "fil-in"); input.type = "file"; input.id = "fil-input"; input.multiple = true; input.accept = ALL; input.tabIndex = -1; input.setAttribute("aria-hidden", "true");
  input.onchange = () => { const l = [...input.files]; input.value = ""; addAll(l); };
  const zone = el("div", "fil-zone");
  zone.onclick = (e) => { if (e.target !== input) input.click(); };
  const pick = el("button", "btn y"); pick.type = "button"; pick.id = "fil-pick";
  pick.append(el("span", "fil-desk", "Alege de pe calculator"), el("span", "fil-phone", "Alege un fișier"));
  pick.onclick = (e) => { e.stopPropagation(); input.click(); };
  const title = el("b"); title.append(el("span", "fil-desk", "Trage fișierele aici"), el("span", "fil-phone", "Încarcă un fișier"));
  const hint = el("p", "fil-hint");
  zone.append(ic("i-up"), title, pick, hint, input);

  function ready() {
    if (!fresh.length) return null;
    const c = el("section", "fil-ready"); c.setAttribute("aria-label", "Linkurile noi");
    const h = el("div", "fil-ready-h"), p = el("p"); p.append(fresh.length > 1 ? "Linkurile sunt " : "Linkul e ", el("em", "", "gata"), ".");
    const x = el("button", "fil-ready-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Închide"); x.onclick = () => { fresh = []; render(); };
    h.append(p, x); c.append(h);
    for (const f of fresh) {
      const r = el("div", "fil-ready-i"), a = el("a", "", abs(f.url)); a.href = f.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      r.append(el("b", "", f.name), a, btn("fil-copy", "Copiază linkul", "i-copy", (e) => copy(abs(f.url), e.currentTarget)));
      c.append(r);
    }
    return c;
  }
  function row(f) {
    const li = el("li", "fil-row"), th = el("div", "fil-th");
    if (f.kind === "image") { const im = el("img"); im.src = f.url; im.alt = ""; im.loading = "lazy"; th.append(im); } else th.append(f.label);
    const t = el("div", "fil-txt");
    const meta = [f.label, size(f.size), (f.replaced ? "înlocuit " : "") + when(f.updatedAt)]; if (f.byName) meta.push(f.byName);
    t.append(el("div", "fil-nm", f.name), el("div", "fil-me", meta.join(" · ")), el("div", "fil-lk", abs(f.url)));
    li.append(th, t);
    if (busy.has(f.id)) {
      const pr = busy.get(f.id);
      if (pr >= 0) { const b = el("div", "fil-bar"), i = el("i"); b.dataset.bar = f.id; i.style.width = Math.round(pr * 100) + "%"; b.append(i); li.append(b); }
      else li.append(el("div", "fil-me", "Se șterge…"));
      return li;
    }
    if (asking === f.id) {
      const q = el("div", "fil-ask"); q.append(el("span", "", "Ștergi „" + f.name + "”? Linkul nu va mai merge."));
      const no = btn("", "Renunță", null, () => { asking = null; render(); });
      no.addEventListener("keydown", (e) => { if (e.key === "Escape") no.click(); });
      const yes = btn("fil-sure", "Da, șterge", null, () => kill(f));
      yes.addEventListener("keydown", (e) => { if (e.key === "Escape") no.click(); });
      q.append(no, yes); li.append(q);
      setTimeout(() => { if (no.isConnected) no.focus({ preventScroll: true }); }, 0);
      return li;
    }
    const acts = el("div", "fil-acts");
    const open = el("a", "btn sm ghost", "Deschide"); open.href = f.url; open.target = "_blank"; open.rel = "noopener noreferrer";
    acts.append(btn("k fil-copy", "Copiază linkul", "i-copy", (e) => copy(abs(f.url), e.currentTarget)), open,
      btn("ghost", "Înlocuiește", null, () => pickReplace(f)), btn("ghost fil-del", "Șterge", null, () => { asking = f.id; render(); }));
    li.append(acts);
    return li;
  }
  function render() {
    const parts = [zone, queue];
    const rd = ready(); if (rd) parts.push(rd);
    const max = room ? Math.round(room.fileMax / 1048576) : 50;
    hint.textContent = "HTML, PDF și imagini, până la " + max + " MB fiecare.";
    const sec = el("section", "fil-listw"), hd = el("div", "fil-list-h"); hd.append(el("h3", "", "Încărcate"));
    sec.append(hd);
    if (files && !files.length) sec.append(el("p", "fil-empty", "Încă nimic aici. Primul fișier primește primul link."));
    else if (files) { const ul = el("ul", "fil-list"); ul.append(...files.map(row)); sec.append(ul); }
    else sec.append(el("p", "fil-empty", loading ? "Citesc fișierele…" : "Nu am putut citi lista. Reîncerc când revii aici."));
    parts.push(sec);
    const note = el("div", "fil-note");
    note.append(el("p", "", "Oricine are linkul deschide fișierul, fără cont. Linkurile nu ajung în Google și nu apar nicăieri pe site."),
      el("p", "", "Paginile HTML rulează izolat de /ops, fără cookie-uri și fără localStorage. Fonturile, mailto și linkurile externe merg."));
    parts.push(note);
    body.replaceChildren(...parts);
    stamp.textContent = room ? size(room.used) + " din " + size(room.cap) : "";
  }

  async function load() {
    loading = !files; if (loading) render();
    try {
      const r = await fetch("/api/ops/files", { credentials: "same-origin", cache: "no-store" });
      if (r.status === 401 || r.status === 403) { body.replaceChildren(el("div", "empty", "Secțiunea asta e doar pentru admini.")); return; }
      const j = await r.json(); if (!j.ok) throw new Error("files");
      files = j.files; room = j.room;
    } catch { /* the last list stays, or the message below */ }
    loading = false;
    if (!busy.size && !asking) render();
  }

  // ---------- the whole page takes the drop while this section is open ----------
  let depth = 0;
  const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
  document.addEventListener("dragenter", (e) => { if (on() && hasFiles(e)) { e.preventDefault(); depth++; zone.classList.add("over"); } });
  document.addEventListener("dragover", (e) => { if (on() && hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } });
  document.addEventListener("dragleave", (e) => { if (on() && hasFiles(e) && --depth <= 0) { depth = 0; zone.classList.remove("over"); } });
  document.addEventListener("drop", (e) => { if (!on() || !hasFiles(e)) return; e.preventDefault(); depth = 0; zone.classList.remove("over"); addAll(e.dataTransfer.files); });

  let was = false;
  function watch() { const now = on(); if (now && !was) load(); was = now; }
  new MutationObserver(watch).observe(document.body, { attributes: true, attributeFilter: ["data-cat"] });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && on()) load(); });
  watch();
})();
