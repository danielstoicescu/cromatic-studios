// r351 · The Street Index (beta only): the stage follows the row you point at, the sentence filter, the phone strip,
// the case entry (View Transition). No libraries, no loader, no custom cursor, no smooth scroll.
(() => {
  const D = JSON.parse(document.getElementById("si-data").textContent);
  const RO = D.lang === "ro";
  const byId = new Map(D.rows.map((r) => [r.id, r]));
  const RM = matchMedia("(prefers-reduced-motion: reduce)");
  const PHONE = matchMedia("(max-width: 820px)");
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const idx = $(".si-index");

  // the first fold's film: poster first (the LCP), the loop only after load, never with reduced motion / Save-Data / 2g
  const v = $(".si-fold-v"), pb = $(".si-pause");
  const slow = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ""));
  if (v && !RM.matches && !slow) addEventListener("load", () => setTimeout(() => {
    const ph = PHONE.matches && v.dataset.m;
    for (const [k, t] of ph ? [["m", "video/mp4"]] : [["webm", "video/webm"], ["mp4", "video/mp4"]]) { if (!v.dataset[k]) continue; const s = document.createElement("source"); s.src = v.dataset[k]; s.type = t; v.append(s); }
    v.load(); v.addEventListener("playing", () => v.classList.add("on"), { once: true });
    v.play().catch(() => {}); pb.hidden = false;
  }, 300), { once: true });
  pb?.addEventListener("click", () => { const p = !v.paused; p ? v.pause() : v.play(); pb.classList.toggle("paused", p); pb.setAttribute("aria-label", p ? pb.dataset.play : pb.dataset.pause); });

  // place → facade → brand: one pill turns through the words while the fold is on screen (never with reduced motion)
  const morph = $(".si-morph");
  if (morph && !RM.matches) {
    morph.classList.add("turn");
    const ps = $$(".pill", morph); let k = 0, tm = 0;
    const tick = () => { ps[k].classList.remove("on"); k = (k + 1) % ps.length; ps[k].classList.add("on"); };
    new IntersectionObserver(([e]) => { clearInterval(tm); if (e.isIntersecting) tm = setInterval(tick, 1700); }).observe(morph);
  }

  // the stage of a street: big cover, mini gallery, caption, the street still racking focus
  const setStage = (row) => {
    const r = byId.get(row.dataset.id); if (!r) return;
    const sec = row.closest(".si-street"), st = $(".si-stage", sec);
    $$(".si-row.on", sec).forEach((x) => x !== row && x.classList.remove("on"));
    row.classList.add("on");
    const pos = (el) => { el.style.setProperty("--fx", r.fx + "%"); el.style.setProperty("--fy", r.fy + "%"); };
    $$(".si-still", sec).forEach(pos);
    const n = $(".si-strip-n", sec); if (n) n.textContent = r.n;
    const k = $$(".si-row:not(.si-yard)", sec).indexOf(row) + 1, all = $$(".si-row:not(.si-yard)", sec).length;
    $(".si-strip", sec)?.style.setProperty("--p", (k / all) * 100 + "%");
    if (!st || st.dataset.cur === r.id) return;
    st.dataset.cur = r.id;
    const cov = $(".si-cover", st), img = $("img", cov);
    cov.href = r.href || "#index";
    const show = (u) => { if (!u || img.getAttribute("src") === u) return; if (RM.matches) { img.src = u; return; } img.classList.add("swap"); const pre = new Image(); pre.onload = pre.onerror = () => { img.src = u; requestAnimationFrame(() => img.classList.remove("swap")); }; pre.src = u; };
    show(r.pics[0]);
    $(".si-gal", st).innerHTML = r.pics.map((u, j) => `<button type="button" tabindex="-1" class="${j ? "" : "on"}"><img src="${u}" alt="" loading="lazy" decoding="async"></button>`).join("");
    $$(".si-gal button", st).forEach((b, j) => { const go = () => { show(r.pics[j]); $$(".si-gal button", st).forEach((x) => x.classList.toggle("on", x === b)); }; b.addEventListener("mouseenter", go); b.addEventListener("click", go); });
    $(".si-cap-cat", st).textContent = r.cat; $(".si-cap-name", st).textContent = r.name; $(".si-cap-d", st).textContent = r.desc;
  };
  for (const row of $$(".si-row:not(.si-yard)")) {
    const a = $(".si-a", row);
    a.addEventListener("mouseenter", () => !PHONE.matches && setStage(row));
    a.addEventListener("focus", () => setStage(row));
    a.addEventListener("click", (e) => {
      const r = byId.get(row.dataset.id);
      // phone: the first tap opens the row in place (cover, fields, two lines, "Open the case")
      if (PHONE.matches) { e.preventDefault(); const more = $(".si-more", row), open = more.hidden; $$(".si-row.open").forEach((x) => { x.classList.remove("open"); $(".si-more", x).hidden = true; $(".si-a", x).setAttribute("aria-expanded", "false"); }); if (open) { more.hidden = false; row.classList.add("open"); a.setAttribute("aria-expanded", "true"); setStage(row); } return; }
      if (!r.href) { e.preventDefault(); setStage(row); return; }
      enter(e, row, r);
    });
  }
  // the stage's cover opens the case too
  $$(".si-cover").forEach((c) => c.addEventListener("click", (e) => { const st = c.closest(".si-stage"), r = byId.get(st.dataset.cur || ""); if (!r?.href) { e.preventDefault(); return; } enter(e, document.getElementById("r-" + r.id), r); }));

  // case entry: the stage leans in (240 ms), then the cover becomes the case hero (cross-document View Transition)
  function enter(e, row, r) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    try { sessionStorage.setItem("si-vt", new URL(r.href, location.href).pathname); sessionStorage.setItem("si-back", r.id); } catch {}
    const st = row && $(".si-stage", row.closest(".si-street"));
    if (RM.matches || !st || getComputedStyle(st).display === "none") return;
    e.preventDefault();
    setStage(row);
    $$("[style*=case-hero]").forEach((x) => (x.style.viewTransitionName = ""));
    $(".si-cover img", st).style.viewTransitionName = "case-hero";
    st.classList.add("leave");
    setTimeout(() => (location.href = r.href), 240);
  }
  // back from a case: the row is focused again where you left it
  addEventListener("pageshow", () => {
    $$(".si-stage.leave").forEach((s) => s.classList.remove("leave"));
    let id = null; try { id = sessionStorage.getItem("si-back"); sessionStorage.removeItem("si-back"); } catch {}
    const row = id && document.getElementById("r-" + id);
    if (row) { setStage(row); $(".si-a", row).focus({ preventScroll: true }); row.scrollIntoView({ block: "center" }); }
  });

  // which street is on screen (header line on desktop); on phones the row at the middle of the screen leads the strip
  const streets = $$(".si-street");
  const so = new IntersectionObserver((es) => {
    for (const en of es) if (en.isIntersecting) {
      const s = en.target;
      const on = $(".si-row.on", s) || $(".si-row:not([hidden]):not(.si-yard)", s); if (on) setStage(on);
    }
  }, { rootMargin: "-50% 0px -50% 0px" });
  streets.forEach((s) => so.observe(s));
  const ro = new IntersectionObserver((es) => { if (!PHONE.matches) return; for (const en of es) if (en.isIntersecting) setStage(en.target); }, { rootMargin: "-48% 0px -48% 0px" });
  $$(".si-row:not(.si-yard)").forEach((r) => ro.observe(r));

  // the sentence filter + search
  const f = $(".si-filter"), q = f.q, clear = $(".si-clear"), count = $(".si-count"), empty = $(".si-empty");
  const fmt = (n, s, t) => RO ? `<b>${n} ${n === 1 ? "loc" : "locuri"}</b> pe ${s} ${s === 1 ? "stradă" : "străzi"}, din ${t}` : `<b>${n} ${n === 1 ? "place" : "places"}</b> on ${s} ${s === 1 ? "street" : "streets"}, of ${t}`;
  const names = new Map($$(".si-a .si-name").map((el) => [el, el.textContent]));
  const cats = new Map($$(".si-a .si-cat").map((el) => [el, el.textContent]));
  const escH = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const mark = (t, w) => { if (!w) return escH(t); const i = t.toLowerCase().indexOf(w); return i < 0 ? escH(t) : escH(t.slice(0, i)) + `<mark class="hl">${escH(t.slice(i, i + w.length))}</mark>` + escH(t.slice(i + w.length)); };
  const run = () => {
    const ch = f.ch.value, sk = f.st.value, w = q.value.trim().toLowerCase();
    let n = 0; const ss = new Set(), none = [];
    for (const s of streets) {
      let m = 0;
      for (const row of $$(".si-row", s)) {
        const ok = (!ch || row.dataset.ch.split(" ").includes(ch)) && (!sk || s.dataset.k === sk) && (!w || row.dataset.q.includes(w));
        row.hidden = !ok; if (ok) m++;
        const card = $(`.si-card[data-id="${row.dataset.id}"]`, s); if (card) card.hidden = !ok;
      }
      const sc = $(".si-sh-c", s); sc.dataset.o ??= sc.textContent; sc.textContent = ch || sk || w ? String(m).padStart(2, "0") : sc.dataset.o;
      s.hidden = !m; n += m; if (m) ss.add(s.dataset.k); else if (!sk || s.dataset.k === sk) none.push(s.dataset.name);
    }
    for (const [el, t] of names) el.innerHTML = mark(t, w);
    for (const [el, t] of cats) el.innerHTML = mark(t, w);
    idx.classList.toggle("filtering", !!(ch || sk || w));
    clear.hidden = !w;
    count.innerHTML = fmt(n, ss.size, D.total);
    empty.hidden = !(w && none.length);
    $(".si-empty-l").textContent = D.nothing.replace("{s}", none.join(" · ")).replace("{q}", q.value.trim());
  };
  // each select as wide as the words it shows, so the sentence reads as one line
  const sizer = document.createElement("span"); sizer.setAttribute("aria-hidden", "true"); sizer.style.cssText = "position:absolute;visibility:hidden;white-space:pre;left:-9999px";
  const fit = (sel) => { const cs = getComputedStyle(sel); sizer.style.font = cs.font; sizer.style.letterSpacing = cs.letterSpacing; sizer.textContent = sel.options[sel.selectedIndex].text; sel.style.setProperty("--w", Math.ceil(sizer.getBoundingClientRect().width + parseFloat(cs.paddingRight) + 4) + "px"); };
  document.body.append(sizer);
  const fitAll = () => [f.ch, f.st].forEach(fit); fitAll(); document.fonts?.ready.then(fitAll); addEventListener("resize", fitAll);
  f.addEventListener("change", (e) => e.target.tagName === "SELECT" && fit(e.target));
  f.addEventListener("input", run); f.addEventListener("change", run);
  clear.addEventListener("click", () => { q.value = ""; run(); q.focus(); });
  q.addEventListener("keydown", (e) => { if (e.key === "Escape" && q.value) { q.value = ""; run(); } });
  run();
  $$(".si-view button").forEach((b) => b.addEventListener("click", () => {
    const c = b.dataset.v === "covers"; idx.classList.toggle("covers", c);
    $$(".si-view button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
  // keyboard: arrow keys walk the rows of a street
  $$(".si-list").forEach((ol) => ol.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const as = $$(".si-row:not([hidden]) > .si-a, .si-row:not([hidden]) summary", ol), i = as.indexOf(document.activeElement);
    if (i < 0) return; e.preventDefault(); as[Math.max(0, Math.min(as.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))].focus();
  }));
})();
