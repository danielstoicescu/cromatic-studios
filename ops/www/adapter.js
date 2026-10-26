// TASK-124 · the /ops mirror's stand-in for the artifact runtime: just the subset of claude.use("db") / claude.use("user")
// the Cromatic Ops page uses. Reads come from GET /api/ops/snapshot (polled every 20 s); the only writes are new
// inbox items (command / bug / feedback), sent to POST /api/ops/inbox. Everything else is read-only here: it changes
// by a request to Claude (the controls prefill "Spune-i lui Claude").
(() => {
  "use strict";
  const POLL = 20000;
  const KIND = { command: "command", bug: "bug", feedback: "feedback", "work-order": "command" };
  let snap = null, user = null, timer = 0, firstLoad = null;
  const pending = new Map(); // id -> inbox doc posted from this page, until the snapshot has it
  const edits = new Map(); // id -> task-edit posted from this page, shown at once until the server's snapshot carries it
  const prevPending = new Map(), justDone = new Map(), justBack = new Map(), seenPending = new Set();
  const seenRejected = (() => { try { return new Set(JSON.parse(localStorage.getItem("ops-rejected-seen") || "[]")); } catch { return new Set(); } })();
  const saveSeen = () => { try { localStorage.setItem("ops-rejected-seen", JSON.stringify([...seenRejected].slice(-200))); } catch {} };
  const listeners = new Set();
  const ops = (window.__ops = { mirror: true, user: null });

  const err = (code) => Object.assign(new Error(code), { code });
  async function api(path, opt) {
    const r = await fetch(path, { credentials: "same-origin", cache: "no-store", ...opt, headers: { "Content-Type": "application/json", ...((opt && opt.headers) || {}) } });
    if (r.status === 401) { location.replace("/ops"); throw err("not_granted"); }
    let j = null; try { j = await r.json(); } catch {}
    if (!r.ok || !j || !j.ok) throw err(r.status === 429 ? "rate_limited" : r.status === 403 ? "invalid_argument" : "error_" + r.status);
    return j;
  }
  async function load() {
    try {
      const j = await api("/api/ops/snapshot");
      snap = j; user = j.user; ops.user = user; ops.generatedAt = j.generatedAt;
      const inbox = (snap.collections && snap.collections.inbox) || {};
      for (const id of [...pending.keys()]) if (inbox[id]) pending.delete(id);
      trackEdits(snap.collections.tasks || {});
      header();
      listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    } catch (e) { if (e.code !== "not_granted") console.warn("[ops] snapshot", e.message); }
  }
  function trackEdits(tasks) {
    const now = Date.now(), cur = new Map();
    for (const [tid, t] of Object.entries(tasks)) {
      const ids = (t._opsPending || []).map((p) => p.id);
      if (ids.length) cur.set(tid, new Set(ids));
      ids.forEach((id) => { seenPending.add(id); edits.delete(id); });
      for (const r of t._opsRejected || []) {
        edits.delete(r.id);
        if (seenRejected.has(r.id)) continue;
        seenRejected.add(r.id); saveSeen();
        if (seenPending.has(r.id) || (user && r.byEmail === user.email)) {
          justBack.set(tid, now);
          const msg = "Nu s-a făcut: " + tid + (r.reply ? " · " + r.reply : "");
          setTimeout(() => { if (window.__opsToast) window.__opsToast(msg, "err"); }, 50);
        }
      }
    }
    for (const [tid, ids] of prevPending) {
      const still = cur.get(tid) || new Set(), rej = new Set(((tasks[tid] || {})._opsRejected || []).map((r) => r.id));
      if ([...ids].some((id) => !still.has(id) && !rej.has(id))) justDone.set(tid, now);
    }
    prevPending.clear(); for (const [k, v] of cur) prevPending.set(k, v);
    // a local edit the server already resolved (done) disappears too
    for (const [id, e] of edits) if (now - e.at > 120e3) edits.delete(id);
  }
  function startPolling() {
    if (!firstLoad) firstLoad = load();
    clearInterval(timer); timer = setInterval(() => { if (!document.hidden) load(); }, POLL);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
    return firstLoad;
  }

  const coll = (name) => {
    const c = Object.assign({}, (snap && snap.collections && snap.collections[name]) || {});
    if (name === "inbox") for (const [id, d] of pending) if (!c[id]) c[id] = d;
    if (name === "tasks") for (const [id, e] of edits) {
      const t = c[e.taskId]; if (!t || (t._opsPending || []).some((p) => p.id === id)) continue;
      c[e.taskId] = Object.assign({}, t, { [e.field]: e.to, _opsPending: (t._opsPending || []).concat([{ id, field: e.field, from: e.from, to: e.to, createdAt: e.createdAt, by: user && user.name }]) });
    }
    return c;
  };
  const docSnap = (id, d) => ({ id, exists: !!d, data: () => (d ? JSON.parse(JSON.stringify(d)) : undefined) });

  function query(name, order, lim) {
    return {
      orderBy: (f, dir) => query(name, [f, dir || "asc"], lim),
      limit: (n) => query(name, order, n),
      onSnapshot(cb, onErr) {
        const run = () => {
          let docs = Object.entries(coll(name)).map(([id, d]) => docSnap(id, d));
          if (order) { const [f, dir] = order, k = dir === "desc" ? -1 : 1; docs.sort((a, b) => String(a.data()[f] ?? "").localeCompare(String(b.data()[f] ?? "")) * k); }
          if (lim) docs = docs.slice(0, lim);
          cb({ docs, size: docs.length, empty: !docs.length });
        };
        listeners.add(run); if (snap) run();
        return () => listeners.delete(run);
      },
      async add(doc) {
        if (name === "inbox") return addInbox(doc);
        if (name === "coreRequests" && user && user.role === "admin") {
          const d = doc || {};
          return addInbox({ kind: "command", text: "Sesiune nouă în The Core: " + [d.name, d.email, d.edition, String(d.lang || "").toUpperCase()].filter(Boolean).join(" · "), payload: { type: "core-request", request: d } });
        }
        throw err("read_only");
      },
    };
  }
  async function addInbox(doc) {
    if (doc && (doc.kind === "task" || doc.kind === "epic")) return { id: null }; // the page's own note after "+ Task": set() above already told Claude
    const kind = KIND[doc && doc.kind];
    if (!kind) throw err("read_only");
    const payload = Object.assign({}, doc.payload || {});
    if (doc.kind === "work-order") payload.type = "work-order";
    const j = await api("/api/ops/inbox", { method: "POST", body: JSON.stringify({ kind, text: String(doc.text || ""), payload: Object.keys(payload).length ? payload : null }) });
    const it = j.item;
    pending.set(it.id, { createdAt: it.createdAt, from: "ops:" + it.from, kind: it.kind, text: it.text, payload: it.payload, status: "new", reply: "", by: { email: it.from, name: it.name, role: it.role }, pending: true });
    if (it.payload && it.payload.type === "task-edit") { edits.set(it.id, { ...it.payload, createdAt: it.createdAt, at: Date.now() }); seenPending.add(it.id); }
    listeners.forEach((f) => f());
    setTimeout(load, 300); // the server's merged view (everyone sees the edit) comes right back
    return { id: it.id };
  }

  const db = {
    collection: (name) => query(name),
    doc(path) {
      const [c, id] = String(path).split("/");
      return {
        onSnapshot(cb) { const run = () => cb(docSnap(id, coll(c)[id])); listeners.add(run); if (snap) run(); return () => listeners.delete(run); },
        update: async () => { throw err("read_only"); }, delete: async () => { throw err("read_only"); },
        // 26 Oct: "+ Task" and "+ Epic" work here too. A new task or epic goes to Claude as a command (payload.type
        // task-new / epic-new, the whole doc inside); Claude creates it in the artifact and the next snapshot shows it.
        async set(d) {
          if ((c === "tasks" || c === "epics") && !coll(c)[id]) {
            const kind = c === "tasks" ? "task" : "epic", ep = c === "tasks" && d.epicId ? coll("epics")[d.epicId] : null;
            return addInbox({ kind: "command", text: (kind === "task" ? "Task nou: " : "Epic nou: ") + (d.title || "") + (ep ? " (în " + (ep.title || d.epicId) + ")" : ""), payload: { type: kind + "-new", [kind]: { ...d, id } } });
          }
          throw err("read_only");
        },
      };
    },
  };
  const userCap = { id: () => (user ? user.email : null), can: async (cap) => (cap === "data.write" ? false : true) };

  window.claude = {
    async use(name) {
      if (name === "db") { await startPolling(); return db; }
      if (name === "user") { await startPolling(); return userCap; }
      return null; // no sample (no in-page AI), no assets (no uploads) in the mirror
    },
  };

  // ---------- header: who is logged in, logout; role on <body> hides the admin-only sections for members ----------
  function header() {
    if (!user || !document.body) return;
    document.body.classList.toggle("ops-member", user.role !== "admin");
    document.body.classList.toggle("ops-admin", user.role === "admin");
    const pills = document.querySelector(".top .pills");
    if (!pills || document.getElementById("ops-me")) return;
    const me = document.createElement("span"); me.className = "pill ops-me"; me.id = "ops-me"; me.title = user.email;
    const av = document.createElement("span"); av.className = "ops-av"; av.textContent = user.initial || "?"; av.setAttribute("aria-hidden", "true");
    const nm = document.createElement("span"); nm.textContent = user.name;
    const rl = document.createElement("span"); rl.className = "k"; rl.textContent = user.role === "admin" ? "ADMIN" : "ECHIPĂ";
    me.append(av, nm, rl);
    const out = document.createElement("button"); out.type = "button"; out.className = "btn sm ghost"; out.id = "ops-out"; out.textContent = "Ieși";
    out.onclick = async () => { out.disabled = true; try { await fetch("/api/ops/logout", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" }); } catch {} location.replace("/ops"); };
    pills.append(me, out);
  }
  document.addEventListener("DOMContentLoaded", header);

  // ---------- the "în procesare" pill on an edited card; a tick when it lands; the card rolls back when it is rejected ----------
  const LATE = 30 * 60e3;
  window.__opsPill = (card, t) => {
    const now = Date.now(), p = t._opsPending || [];
    let pill = null;
    if (p.length) {
      const age = now - (Date.parse(p[p.length - 1].createdAt) || now), late = age > LATE;
      pill = document.createElement("span"); pill.className = "ops-pill" + (late ? " late" : "");
      pill.title = late ? "Încă în așteptare: Claude nu a confirmat-o încă" : "Ajunge la Claude în câteva minute";
      const d = document.createElement("i"); d.className = "ops-dots"; d.setAttribute("aria-hidden", "true"); d.append(document.createElement("b"), document.createElement("b"), document.createElement("b"));
      const tx = document.createElement("span"); tx.textContent = late ? "încă în așteptare" : "în procesare";
      pill.append(d, tx); card.classList.add("ops-pending");
    } else if (justDone.has(t.id) && now - justDone.get(t.id) < 2600) {
      pill = document.createElement("span"); pill.className = "ops-pill done"; pill.title = "Gata, Claude a făcut-o"; pill.textContent = "✓ gata";
      pill.style.animationDelay = "-" + Math.min(2400, now - justDone.get(t.id)) + "ms";
    }
    if (justBack.has(t.id) && now - justBack.get(t.id) < 1200) card.classList.add("ops-back");
    if (pill) { pill.setAttribute("role", "status"); const m = card.querySelector(".m"); (m || card).append(pill); }
  };

  // ---------- touch: long-press a board card, drag it to a column, let go -> the same request as a desktop drop ----------
  // (HTML5 drag and drop does not fire on touch screens.) A quick swipe still scrolls; only a 350 ms press lifts the card.
  let td = null;
  const laneAt = (x, y) => { const e = document.elementFromPoint(x, y); return e && e.closest ? e.closest(".board .lane[data-st]") : null; };
  function endTouchDrag(drop, x, y) {
    if (!td) return;
    const d = td; td = null; clearTimeout(d.timer); cancelAnimationFrame(d.raf);
    document.body.classList.remove("ops-dragging");
    if (d.ghost) d.ghost.remove();
    d.card.classList.remove("ops-lift");
    document.querySelectorAll(".lane.drop-ok").forEach((l) => l.classList.remove("drop-ok"));
    if (!d.active) return;
    // the click that follows the lift must not open the task window
    const eat = (e) => { e.stopPropagation(); e.preventDefault(); };
    document.addEventListener("click", eat, { capture: true, once: true }); setTimeout(() => document.removeEventListener("click", eat, true), 400);
    const lane = drop ? laneAt(x, y) : null;
    if (window.__opsMove) window.__opsMove(d.id, lane ? lane.dataset.st : "");
  }
  // touch events (not pointer events): they keep coming even if the browser has started to scroll, so a drop is never lost
  const pt = (e) => { const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]); return t ? { x: t.clientX, y: t.clientY } : null; };
  document.addEventListener("touchstart", (e) => {
    if (td || e.touches.length !== 1) { if (td && !td.active) { clearTimeout(td.timer); td = null; } return; }
    const card = e.target.closest && e.target.closest(".board .card[data-task]");
    if (!card || e.target.closest("button, a, input, select, textarea")) return;
    const p = pt(e);
    td = { card, id: card.dataset.task, x0: p.x, y0: p.y, x: p.x, y: p.y, active: false };
    td.timer = setTimeout(() => {
      if (!td) return;
      td.active = true; document.body.classList.add("ops-dragging");
      const r = card.getBoundingClientRect(), g = card.cloneNode(true);
      g.classList.add("ops-ghost"); g.removeAttribute("data-task"); g.style.width = r.width + "px"; g.style.left = r.left + "px"; g.style.top = r.top + "px";
      td.dx = td.x - r.left; td.dy = td.y - r.top; td.ghost = g; document.body.append(g); card.classList.add("ops-lift");
      try { navigator.vibrate && navigator.vibrate(12); } catch {}
      const board = card.closest(".board");
      const tick = () => { // scroll the board sideways near the screen edges
        if (!td || !td.active) return;
        if (board) { if (td.x < 36) board.scrollLeft -= 12; else if (td.x > innerWidth - 36) board.scrollLeft += 12; }
        td.raf = requestAnimationFrame(tick);
      };
      td.raf = requestAnimationFrame(tick);
    }, 350);
  }, { passive: true, capture: true });
  document.addEventListener("touchmove", (e) => {
    if (!td) return;
    const p = pt(e); if (!p) return;
    td.x = p.x; td.y = p.y;
    if (!td.active) { if (Math.hypot(td.x - td.x0, td.y - td.y0) > 10) { clearTimeout(td.timer); td = null; } return; }
    if (e.cancelable) e.preventDefault();
    td.ghost.style.left = td.x - td.dx + "px"; td.ghost.style.top = td.y - td.dy + "px";
    const lane = laneAt(td.x, td.y);
    document.querySelectorAll(".lane.drop-ok").forEach((l) => { if (l !== lane) l.classList.remove("drop-ok"); });
    if (lane) lane.classList.add("drop-ok");
  }, { passive: false, capture: true });
  document.addEventListener("touchend", (e) => { if (td) { const p = pt(e) || { x: td.x, y: td.y }; endTouchDrag(true, p.x, p.y); } }, true);
  document.addEventListener("touchcancel", () => { if (td) endTouchDrag(false); }, true);
  document.addEventListener("contextmenu", (e) => { if (td && td.active) e.preventDefault(); }, true);
})();

// ---------- uploads + video links (composer, quick composer, bug report, Conținut request) ----------
// Files go straight to this server (POST /api/ops/upload), optimized there; the command carries the ids, links and urls.
(() => {
  "use strict";
  const ACCEPT = ".png,.jpg,.jpeg,.webp,.avif,.svg,.pdf,.mp4,.webm,image/png,image/jpeg,image/webp,image/avif,image/svg+xml,application/pdf,video/mp4,video/webm";
  const MAX = 25 * 1048576;
  const KINDS = [["logo", "Logo"], ["visual", "Vizual"], ["other", "Altceva"]];
  const boxes = new Map(); // key -> {files: [], links: [], kind, el}
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const size = (b) => b >= 1048576 ? (b / 1048576).toFixed(1).replace(".0", "") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
  function linkInfo(u) {
    let x; try { x = new URL(String(u || "").trim()); } catch { return null; }
    if (x.protocol !== "https:") return null;
    const host = x.hostname.replace(/^www\.|^m\./, ""); let m;
    if (host === "youtu.be" && (m = /^\/([\w-]{11})/.exec(x.pathname))) return { url: x.href, type: "youtube", id: m[1] };
    if (/(^|\.)youtube(-nocookie)?\.com$/.test(host)) { const id = x.searchParams.get("v") || (/^\/(?:shorts|embed|live)\/([\w-]{11})/.exec(x.pathname) || [])[1]; return { url: x.href, type: "youtube", ...(id && /^[\w-]{11}$/.test(id) ? { id } : {}) }; }
    if (/(^|\.)vimeo\.com$/.test(host)) { m = /\/(\d{6,})/.exec(x.pathname); return { url: x.href, type: "vimeo", ...(m ? { id: m[1] } : {}) }; }
    if (/^(drive|docs)\.google\.com$/.test(host)) return { url: x.href, type: "drive" };
    if (/(^|\.)wetransfer\.com$|^we\.tl$/.test(host)) return { url: x.href, type: "wetransfer" };
    if (/(^|\.)dropbox\.com$|^db\.tt$/.test(host)) return { url: x.href, type: "dropbox" };
    return { url: x.href, type: "other" };
  }
  const TYPE_LAB = { youtube: "YouTube", vimeo: "Vimeo", drive: "Google Drive", wetransfer: "WeTransfer", dropbox: "Dropbox", other: "link" };

  function mount(key, opt) {
    const o = opt || {}, st = boxes.get(key) && !o.fresh ? boxes.get(key) : { files: [], links: [], kind: o.kind || "visual" };
    boxes.set(key, st);
    const w = h("div", "ops-up" + (o.open ? " open" : "")); w.dataset.up = key; st.el = w;
    const tg = h("button", "ops-up-tg"); tg.type = "button"; tg.setAttribute("aria-expanded", String(!!o.open));
    tg.append(h("span", "pl", "+"), h("span", "", "Fișiere sau link video")); const cnt = h("span", "ops-up-n"); tg.append(cnt);
    tg.onclick = () => { const on = !w.classList.contains("open"); w.classList.toggle("open", on); tg.setAttribute("aria-expanded", String(on)); };
    const body = h("div", "ops-up-b");
    // kind
    const kr = h("div", "ops-kind"); kr.setAttribute("role", "radiogroup"); kr.setAttribute("aria-label", "Ce fel de fișier");
    const drawKind = () => { for (const b of kr.children) b.setAttribute("aria-checked", String(b.dataset.k === st.kind)); };
    for (const [k, l] of KINDS) { const b = h("button", "", l); b.type = "button"; b.dataset.k = k; b.setAttribute("role", "radio"); b.onclick = () => { st.kind = k; drawKind(); }; kr.append(b); }
    drawKind();
    // drop zone
    const inp = h("input"); inp.type = "file"; inp.multiple = true; inp.accept = ACCEPT; inp.hidden = true; inp.id = "ops-up-in-" + key;
    const dz = h("label", "ops-drop"); dz.htmlFor = inp.id; dz.tabIndex = 0;
    dz.append(h("b", "", "Trage fișierele aici"), h("span", "", " sau apasă să alegi"), h("small", "", "PNG, JPG, WebP, AVIF, SVG, PDF, MP4, WebM · max 25 MB · le optimizăm noi"));
    dz.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } };
    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add("over"); }; dz.ondragleave = () => dz.classList.remove("over");
    dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove("over"); add([...(e.dataTransfer.files || [])]); };
    inp.onchange = () => { add([...(inp.files || [])]); inp.value = ""; };
    const list = h("div", "ops-files");
    // video link
    const lr = h("div", "ops-link"), li = h("input", "inp"); li.type = "url"; li.inputMode = "url"; li.placeholder = "Link video: YouTube, Vimeo, Drive, WeTransfer, Dropbox…"; li.setAttribute("aria-label", "Link video (https)");
    const lb = h("button", "btn sm", "Adaugă"); lb.type = "button";
    const addLink = () => { const v = linkInfo(li.value); if (!v) { li.setCustomValidity("Un link https, ex.: https://youtu.be/…"); li.reportValidity(); return; } li.setCustomValidity(""); if (!st.links.some((x) => x.url === v.url)) st.links.push(v); li.value = ""; draw(); };
    lb.onclick = addLink; li.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }; li.oninput = () => li.setCustomValidity("");
    lr.append(li, lb);
    const links = h("div", "ops-links");
    body.append(kr, dz, inp, list, lr, links); w.append(tg, body);

    function add(fs) {
      if (!w.classList.contains("open")) tg.click();
      for (const f of fs) {
        const it = { name: f.name, size: f.size, state: "up", pct: 0, kind: st.kind, local: /^image\//.test(f.type) ? URL.createObjectURL(f) : "" };
        st.files.push(it);
        if (f.size > MAX) { it.state = "err"; it.err = "peste 25 MB"; continue; }
        const x = new XMLHttpRequest(); it.xhr = x;
        x.open("POST", "/api/ops/upload?kind=" + encodeURIComponent(it.kind) + "&name=" + encodeURIComponent(f.name));
        x.setRequestHeader("Content-Type", f.type || "application/octet-stream");
        x.upload.onprogress = (e) => { if (e.lengthComputable) { it.pct = e.loaded / e.total; draw(); } };
        x.onload = () => {
          let j = {}; try { j = JSON.parse(x.responseText); } catch {}
          if (x.status === 401) { location.replace("/ops"); return; }
          if (x.status === 200 && j.ok) { Object.assign(it, { state: "ok", id: j.id, urls: j.urls, w: j.w, h: j.h, type: j.type, bytesBefore: j.bytesBefore, bytesAfter: j.bytesAfter, optimize: j.optimize }); }
          else { it.state = "err"; it.err = j.message || "nu s-a încărcat (" + x.status + ")"; }
          draw();
        };
        x.onerror = () => { it.state = "err"; it.err = "fără conexiune"; draw(); };
        x.send(f);
      }
      draw();
    }
    function draw() {
      const n = st.files.filter((f) => f.state === "ok").length + st.links.length;
      cnt.textContent = n ? String(n) : ""; cnt.hidden = !n;
      list.replaceChildren(...st.files.map((f, i) => {
        const r = h("div", "ops-file " + f.state), th = h("div", "th");
        const src = f.urls ? (f.urls.preview || f.urls.webp || f.urls.png || f.urls.jpg) : f.local;
        if (src) { const im = h("img"); im.src = src; im.alt = ""; th.append(im); } else th.append(h("span", "", (f.name.split(".").pop() || "").toUpperCase()));
        const tx = h("div", "tx"); tx.append(h("b", "", f.name));
        if (f.state === "up") { const bar = h("div", "bar"), sp = h("span"); sp.style.width = Math.round(f.pct * 100) + "%"; bar.append(sp); tx.append(bar); }
        else if (f.state === "ok") tx.append(h("span", "sz", f.optimize && f.bytesAfter < f.bytesBefore ? size(f.bytesBefore) + " → " + size(f.bytesAfter) : size(f.bytesBefore) + (f.optimize ? "" : " · păstrat ca atare")));
        else tx.append(h("span", "er", f.err || "eroare"));
        const k = h("span", "kd", { logo: "logo", visual: "vizual", other: "altceva" }[f.kind] || "");
        const x = h("button", "rm"); x.type = "button"; x.setAttribute("aria-label", "Scoate " + f.name); x.textContent = "×";
        x.onclick = () => { if (f.xhr && f.state === "up") f.xhr.abort(); st.files.splice(i, 1); draw(); };
        r.append(th, tx, k, x); return r;
      }));
      links.replaceChildren(...st.links.map((v, i) => {
        const r = h("div", "ops-file ok"), th = h("div", "th");
        if (v.type === "youtube" && v.id) { const im = h("img"); im.src = "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg"; im.alt = ""; im.referrerPolicy = "no-referrer"; th.append(im); } else th.append(h("span", "", "▶"));
        const tx = h("div", "tx"); tx.append(h("b", "", TYPE_LAB[v.type] || "link"), h("span", "sz", v.url));
        const x = h("button", "rm"); x.type = "button"; x.setAttribute("aria-label", "Scoate linkul"); x.textContent = "×"; x.onclick = () => { st.links.splice(i, 1); draw(); };
        r.append(th, tx, h("span", "kd", "video"), x); return r;
      }));
    }
    st.draw = draw; draw();
    return w;
  }
  const ready = (key) => { const st = boxes.get(key); return st ? st.files.filter((f) => f.state === "ok") : []; };
  window.__opsUp = {
    mount,
    busy: (key) => { const st = boxes.get(key); return !!st && st.files.some((f) => f.state === "up"); },
    count: (key) => { const st = boxes.get(key); return st ? ready(key).length + st.links.length : 0; },
    payload: (key) => {
      const st = boxes.get(key); if (!st) return {};
      const up = ready(key).map((f) => ({ id: f.id, name: f.name, kind: f.kind, type: f.type, urls: f.urls, w: f.w, h: f.h, bytesBefore: f.bytesBefore, bytesAfter: f.bytesAfter }));
      return { ...(up.length ? { uploads: up } : {}), ...(st.links.length ? { videoLinks: st.links.map((v) => ({ ...v })) } : {}) };
    },
    textSuffix: (key) => {
      const st = boxes.get(key); if (!st) return "";
      const abs = (p) => location.origin + p, up = ready(key);
      return (up.length ? "\nFișiere: " + up.map((f) => f.name + " (" + abs(f.urls.webp || f.urls.svg || f.urls.png || f.urls.original) + ")").join(", ") : "")
        + (st.links.length ? "\nLinkuri video: " + st.links.map((v) => v.url + " (" + v.type + ")").join(", ") : "");
    },
    reset: (key) => { const st = boxes.get(key); if (!st) return; st.files = []; st.links = []; if (st.draw) st.draw(); },
  };
  document.addEventListener("DOMContentLoaded", () => { document.querySelectorAll("[data-up-slot]").forEach((s) => s.replaceWith(mount(s.dataset.upSlot))); });
})();
