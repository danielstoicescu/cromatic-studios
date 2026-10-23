// TASK-124 · the /ops mirror's stand-in for the artifact runtime: just the subset of claude.use("db") / claude.use("user")
// the Cromatic Ops page uses. Reads come from GET /api/ops/snapshot (polled every 20 s); the only writes are new
// inbox items (command / bug / feedback), sent to POST /api/ops/inbox. Everything else is read-only here: it changes
// in Daniel's session, or by a command.
(() => {
  "use strict";
  const POLL = 20000;
  const KIND = { command: "command", bug: "bug", feedback: "feedback", "work-order": "command" };
  let snap = null, user = null, timer = 0, firstLoad = null;
  const pending = new Map(); // id -> inbox doc posted from this page, until the snapshot has it
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
      header();
      listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    } catch (e) { if (e.code !== "not_granted") console.warn("[ops] snapshot", e.message); }
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
    listeners.forEach((f) => f());
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
    const note = document.createElement("span"); note.className = "ops-note"; note.textContent = "Oglindă · se modifică din sesiunea lui Daniel / prin comandă";
    pills.append(me, out);
    const top = document.querySelector(".top"); if (top) top.after(note);
  }
  document.addEventListener("DOMContentLoaded", header);
})();
