// /ops rail in groups (Daniel, 27 Oct): Claude AI · Ops Tools · Website · Marketing, as small mono caps headers.
// A group header hides itself when none of its items is available to this user (members never see the admin-only ones).
// Phone: the bottom bar keeps Acasă, Conversația, Progres, Echipa + "Mai mult", a sheet with every section by group.
(() => {
  "use strict";
  const ADMIN_ONLY = new Set(["core", "sec", "offer", "perf", "files"]); // the server never sends members their data either
  const side = document.getElementById("side");
  if (!side) return;
  const isAdmin = () => document.body.classList.contains("ops-admin");
  const avail = (b) => !b.hidden && !(ADMIN_ONLY.has(b.dataset.cat) && !isAdmin()) && !((b.dataset.cat === "soc" || b.dataset.cat === "ana") && !isAdmin() && document.body.classList.contains("ops-member"));
  function groups() {
    const out = []; let cur = null;
    for (const el of side.children) {
      if (el.classList.contains("nav-grp")) { cur = { el, label: el.textContent.trim(), items: [] }; out.push(cur); }
      else if (el.classList.contains("nav-i") && !el.classList.contains("nav-more") && cur) cur.items.push(el);
    }
    return out;
  }
  // only write when something changes: the observers below watch these same attributes
  function sync() { for (const g of groups()) { const h = !g.items.some(avail); if (g.el.hidden !== h) g.el.hidden = h; } markMore(); }
  const MAIN = new Set(["home", "talk", "work", "team"]);
  function markMore() { const m = document.getElementById("nav-more"); if (!m) return; const c = document.body.dataset.cat || "home"; const on = !MAIN.has(c); if (on && m.getAttribute("aria-current") !== "page") m.setAttribute("aria-current", "page"); else if (!on && m.hasAttribute("aria-current")) m.removeAttribute("aria-current"); }

  // the "Mai mult" sheet
  let sheet = null;
  function close() { if (!sheet) return; sheet.remove(); sheet = null; document.getElementById("nav-more").setAttribute("aria-expanded", "false"); document.removeEventListener("keydown", onKey, true); }
  function onKey(e) { if (e.key === "Escape") { e.preventDefault(); close(); } }
  function open() {
    if (sheet) return close();
    const more = document.getElementById("nav-more");
    sheet = document.createElement("div"); sheet.className = "nav-sheet";
    const scrim = document.createElement("div"); scrim.className = "nav-sheet-s"; scrim.onclick = close;
    const box = document.createElement("div"); box.className = "nav-sheet-b"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Toate secțiunile");
    const head = document.createElement("div"); head.className = "nav-sheet-h"; head.textContent = "Toate secțiunile";
    const x = document.createElement("button"); x.type = "button"; x.className = "nav-sheet-x"; x.setAttribute("aria-label", "Închide"); x.textContent = "×"; x.onclick = close; head.append(x);
    box.append(head);
    const home = side.querySelector('.nav-i[data-cat="home"]');
    const all = [{ label: "", items: [home] }, ...groups()];
    for (const g of all) {
      const items = g.items.filter(avail); if (!items.length) continue;
      if (g.label) { const h = document.createElement("div"); h.className = "nav-sheet-g"; h.textContent = g.label; box.append(h); }
      const grid = document.createElement("div"); grid.className = "nav-sheet-l";
      for (const b of items) {
        const it = document.createElement("button"); it.type = "button"; it.className = "nav-sheet-i";
        if (b.getAttribute("aria-current") === "page") it.setAttribute("aria-current", "page");
        const ic = b.querySelector("svg.ic"); if (ic) it.append(ic.cloneNode(true));
        const src = (b.querySelector(".lbl") || b).cloneNode(true), soon = !!src.querySelector(".soon-k");
        src.querySelectorAll(".kps, .soon-k, .nb").forEach((e) => e.remove());
        const lb = document.createElement("span"); lb.textContent = src.textContent.replace(/\s+/g, " ").trim(); it.append(lb);
        if (soon) { const k = document.createElement("small"); k.className = "nav-sheet-soon"; k.textContent = "curând"; it.append(k); }
        const nb = b.querySelector(".nb"); if (nb && !nb.hidden && nb.textContent) { const n = document.createElement("i"); n.textContent = nb.textContent; it.append(n); }
        it.onclick = () => { close(); b.click(); };
        grid.append(it);
      }
      box.append(grid);
    }
    sheet.append(scrim, box); document.body.append(sheet);
    more.setAttribute("aria-expanded", "true"); document.addEventListener("keydown", onKey, true);
    const first = box.querySelector(".nav-sheet-i[aria-current]") || box.querySelector(".nav-sheet-i"); if (first) first.focus();
  }
  function wire() {
    const more = document.getElementById("nav-more"); if (more) more.onclick = (e) => { e.preventDefault(); e.stopPropagation(); open(); };
    sync();
  }
  new MutationObserver(sync).observe(side, { subtree: true, attributes: true, attributeFilter: ["hidden", "aria-current"] });
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class", "data-cat"] });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
  window.addEventListener("load", wire);
})();

// Home: the tasks part (Progres · Task-uri) never takes more than one screen (Daniel, 27 Oct). Taller -> capped at the
// viewport minus the header, a soft fade, "Vezi mai mult" expands it in place, "Vezi mai puțin" folds it back.
// The choice is kept for the session. Only on Acasă: the full Progres section is untouched.
(() => {
  "use strict";
  const KEY = "ops-home-tasks-open";
  const sec = document.getElementById("work");
  if (!sec) return;
  const ss = { get: () => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } }, set: (v) => { try { sessionStorage.setItem(KEY, v ? "1" : "0"); } catch {} } };
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "btn sm home-more"; btn.hidden = true;
  btn.setAttribute("aria-controls", "work");
  sec.append(btn);
  let open = ss.get(), raf = 0;
  const home = () => (document.body.dataset.cat || "home") === "home";
  function cap() {
    const top = document.querySelector(".top"), hh = top ? top.getBoundingClientRect().height : 60;
    return Math.max(360, Math.round(innerHeight - hh - 24));
  }
  function apply() {
    raf = 0;
    if (!home()) { sec.classList.remove("home-cap", "home-open"); sec.style.removeProperty("--home-cap"); btn.hidden = true; return; }
    const c = cap(); sec.style.setProperty("--home-cap", c + "px");
    // measure the natural height (without the cap and without the button)
    const was = sec.className; sec.classList.remove("home-cap", "home-open"); btn.hidden = true;
    const tall = sec.scrollHeight > c + 40;
    sec.className = was;
    if (!tall) { sec.classList.remove("home-cap", "home-open"); btn.hidden = true; return; }
    sec.classList.toggle("home-cap", !open); sec.classList.toggle("home-open", open);
    const t = open ? "Vezi mai puțin" : "Vezi mai mult"; btn.hidden = false; if (btn.textContent !== t) btn.textContent = t; btn.setAttribute("aria-expanded", String(open)); // no write if unchanged: the observer watches sec
  }
  const later = () => { if (!raf) raf = requestAnimationFrame(apply); };
  btn.onclick = () => {
    open = !open; ss.set(open); apply();
    if (!open) { const r = sec.getBoundingClientRect(); if (r.top < 0) sec.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }
  };
  new MutationObserver(later).observe(document.body, { attributes: true, attributeFilter: ["data-cat"] });
  new MutationObserver(later).observe(sec, { childList: true, subtree: true });
  addEventListener("resize", later);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", later); else later();
  addEventListener("load", later);
})();
