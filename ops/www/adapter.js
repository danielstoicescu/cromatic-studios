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
        update: async () => { throw err("read_only"); }, set: async () => { throw err("read_only"); }, delete: async () => { throw err("read_only"); },
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
