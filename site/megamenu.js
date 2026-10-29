// r365 (beta) · the header's mega menu, the Street Index under "Work" (build/megamenu.mjs writes it, megamenu.css draws it).
// Opens on a click, or on a resting pointer over "Work" on a desktop; Esc, the scrim or the round button close it and the
// focus goes back to the button. Inside: Tab stays in the menu, the arrows walk the names, a name shows its brand in the
// preview, Enter in the search opens the first match. Pictures load only once it is open.
(() => {
  const d = document, root = d.documentElement, mm = d.getElementById("mm");
  if (!mm) return;
  const RO = (root.lang || "").slice(0, 2) === "ro";
  const $ = (s, el = mm) => el.querySelector(s), $$ = (s, el = mm) => [...el.querySelectorAll(s)];
  const hdr = mm.closest(".hdr") || d.querySelector(".hdr"), scrim = mm.nextElementSibling, scroller = $(".mm-scroll");
  const btns = $$('.mm-btn[aria-controls="mm"]', d);
  const RM = matchMedia("(prefers-reduced-motion: reduce)"), PHONE = matchMedia("(max-width: 860px)"), FINE = matchMedia("(hover: hover) and (pointer: fine)");
  const items = $$(".mm-i"), pv = $(".mm-pv"), f = $(".mm-f"), q = f.q, clear = $(".mm-clear"), count = $(".mm-count"), empty = $(".mm-empty");
  const total = +mm.dataset.total || items.length;
  let open = false, mode = "", opener = null, tHover = 0, tLeave = 0, tHide = 0, cur = null, booted = false, pushed = false;

  // the select options in the page's language (the dictionary does not reach inside a <select>)
  for (const s of $$(".mm-opts [data-v]")) { const [k, v] = s.dataset.v.split(":"), o = f[k] && [...f[k].options].find((x) => x.value === v); if (o) o.textContent = s.textContent; }
  const names = items.map((a) => [$(".mm-nm", a), $(".mm-nm", a).textContent]), cats = items.map((a) => [$(".mm-ct", a), $(".mm-ct", a).textContent]);
  const hay = new Map(items.map((a) => [a, (a.dataset.q + " " + a.textContent).toLowerCase()]));

  const load = (img) => { if (img && !img.src && img.dataset.src) img.src = img.dataset.src; };
  const boot = () => { if (booted) return; booted = true; if (PHONE.matches) lazyRails(); };
  let warmed = false;
  // on a phone the rails' covers load as they come near (vertical and sideways)
  let io = null;
  const lazyRails = () => {
    if (!("IntersectionObserver" in window)) { $$(".mm-th img").forEach(load); return; }
    io = io || new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } }), { root: null, rootMargin: "300px 50% 300px 50%" });
    $$(".mm-th img").forEach((i) => !i.src && io.observe(i));
  };

  // r371 pictures, ready before they are needed and never another brand's: a small cache of decoded images
  // (new Image + decode, fetchpriority on the one wanted now). Nothing is asked for before the menu first opens.
  const cache = new Map(); // url -> { img, ok: promise, done }
  const get = (u, prio = "auto") => {
    if (!u) return null;
    let c = cache.get(u);
    if (c) { cache.delete(u); cache.set(u, c); return c; } // most recent last
    const img = new Image(); img.decoding = "async"; try { img.fetchPriority = prio; } catch {}
    c = { img, done: false };
    img.src = u;
    c.ok = (img.decode ? img.decode() : new Promise((r, j) => { img.onload = r; img.onerror = j; })).then(() => { c.done = true; return u; });
    c.ok.catch(() => cache.delete(u));
    cache.set(u, c);
    if (cache.size > 120) { const k = cache.keys().next().value; cache.delete(k); } // the browser keeps its own copy
    return c;
  };
  const picsOf = (a) => (a.dataset.pics || "").split(" ").filter(Boolean).map((x) => x.includes(",") ? x.split(",") : ((h, b, sm) => [`/assets/w/${h}-${b}.webp`, `/assets/w/${h}-${sm}.webp`])(...x.split(".")));
  // on open: the 480 covers of what is on screen (small); on a name: its 960 cover and gallery, its neighbours' covers
  const warmCovers = () => visible().forEach((a) => { const p = picsOf(a)[0]; p && get(p[1], "low"); });
  const warm = (a) => {
    if (!a || PHONE.matches) return;
    const ps = picsOf(a); if (!ps.length) return;
    get(ps[0][0], "high"); ps.forEach((p) => get(p[1]));
    const vs = visible(), i = vs.indexOf(a);
    [vs[i - 1], vs[i + 1]].forEach((n) => { const q = n && picsOf(n)[0]; q && get(q[0], "low"); });
    get(ps[0][0]).ok.then(() => ps.slice(1).forEach((p) => get(p[0], "low")), () => {});
  };

  // the preview: on a new brand its own colour at once (and its small cover, blurred, if it is already here), then its
  // cover fades in once decoded, only if that brand is still the one pointed at (tok); within a brand the gallery's
  // pictures cross-fade on the two layers
  const ims = $$(".mm-im", pv), lq = $(".mm-lq", pv), gal = $(".mm-gal", pv), cv = $(".mm-cv", pv);
  let layer = 0, want = "", tok = 0;
  const showPic = (u, fresh) => {
    if (!u || (want === u && !fresh)) return; want = u;
    const t = tok, c = get(u, "high"), nx = ims[layer ^ 1];
    const go = () => { if (want !== u || t !== tok) return; nx.src = u; const put = () => { if (want !== u || t !== tok) return; nx.classList.add("on"); ims[layer].classList.remove("on"); layer ^= 1; }; nx.decode ? nx.decode().then(put, put) : put(); };
    if (c.done) go(); else c.ok.then(go, () => {});
  };
  const preview = (a) => {
    if (!a || a === cur) return;
    if (cur) cur.classList.remove("on");
    cur = a; a.classList.add("on");
    if (PHONE.matches || getComputedStyle(pv).display === "none") return;
    const t = ++tok, st = a.closest(".mm-st"), list = $$(".mm-i:not([hidden])", st).filter((x) => !x.closest("li").hidden);
    const pics = picsOf(a);
    warm(a);
    // the last brand's pictures go at once (no fade out), its colour and small cover take the frame
    pv.classList.add("cut"); ims.forEach((i) => i.classList.remove("on")); lq.classList.remove("on"); want = "";
    cv.style.backgroundColor = a.dataset.c || "";
    const small = pics[0] && get(pics[0][1]);
    if (small) { const sh = () => { if (t !== tok) return; lq.src = pics[0][1]; const put = () => t === tok && lq.getAttribute("src") === pics[0][1] && lq.classList.add("on"); lq.decode ? lq.decode().then(put, put) : put(); }; small.done ? sh() : small.ok.then(sh, () => {}); }
    pv.getBoundingClientRect(); pv.classList.remove("cut");
    pv.style.setProperty("--sc", st.style.getPropertyValue("--sc"));
    cv.href = a.getAttribute("href");
    pv.classList.toggle("case", !a.hasAttribute("data-nocase"));
    showPic(pics[0] ? pics[0][0] : "", true);
    gal.innerHTML = pics.length > 1 ? pics.map((p, j) => `<button type="button" tabindex="-1" class="${j ? "" : "on"}"><img src="${p[1]}" alt="" decoding="async"></button>`).join("") : "";
    $$("button", gal).forEach((b, j) => { const on = () => { showPic(pics[j][0]); $$("button", gal).forEach((x) => x.classList.toggle("on", x === b)); }; b.addEventListener("mouseenter", on); b.addEventListener("click", on); });
    $(".mm-pst", pv).textContent = $(".mm-sn", st).textContent;
    $(".mm-pnum", pv).textContent = String(list.indexOf(a) + 1).padStart(2, "0") + " / " + String(list.length).padStart(2, "0");
    $(".mm-pn", pv).textContent = names[items.indexOf(a)][1];
    $(".mm-pc", pv).textContent = cats[items.indexOf(a)][1];
    $(".mm-pd", pv).textContent = $(".mm-d", a).textContent;
  };
  const visible = () => items.filter((a) => !a.closest("li").hidden && a.offsetParent !== null);

  // open and close
  const lockW = () => innerWidth - root.clientWidth;
  const setTop = () => { const r = hdr.getBoundingClientRect(); mm.style.setProperty("--mm-top", Math.max(0, r.bottom) + "px"); };
  const show = (how, by) => {
    clearTimeout(tLeave); clearTimeout(tHide);
    if (open) { if (how !== "hover") mode = how; return; }
    open = true; mode = how; opener = by || btns.find((b) => b.offsetParent) || btns[0];
    const mb = d.querySelector(".menu-btn"), mn = d.getElementById("mnav");
    if (mn && mn.classList.contains("open")) { mn.classList.remove("open"); mb && mb.setAttribute("aria-expanded", "false"); }
    boot(); setTop();
    const w = lockW(); if (w > 0) { root.style.setProperty("--mm-sb", w + "px"); d.body.style.paddingRight = w + "px"; }
    root.classList.add("mm-lock"); setTop();
    mm.hidden = false; scrim.hidden = false;
    btns.forEach((b) => b.setAttribute("aria-expanded", "true"));
    if (!cur || cur.closest("li").hidden) preview(visible()[0]); else { const c = cur; cur = null; preview(c); }
    if (!warmed && !PHONE.matches) { warmed = true; requestAnimationFrame(warmCovers); }
    mm.getBoundingClientRect(); // the closed state is laid out, so the opening animates
    requestAnimationFrame(() => mm.classList.add("open"));
    // on a phone the sheet is a screen of its own: the back gesture closes it instead of leaving the page
    if (PHONE.matches && !pushed) { try { history.pushState({ ...(history.state || {}), mm: 1 }, ""); pushed = true; } catch {} }
    if (how === "key" && !PHONE.matches) q.focus({ preventScroll: true });
    else if (how !== "hover") scroller.focus({ preventScroll: true });
  };
  const hide = (back) => {
    clearTimeout(tHover); clearTimeout(tLeave);
    if (!open) return;
    open = false; mode = "";
    mm.classList.remove("open");
    btns.forEach((b) => b.setAttribute("aria-expanded", "false"));
    const done = () => { if (open) return; mm.hidden = true; scrim.hidden = true; root.classList.remove("mm-lock"); d.body.style.paddingRight = ""; };
    if (RM.matches) done(); else tHide = setTimeout(done, PHONE.matches ? 200 : 180);
    // the sheet's history step (the phone's back gesture closes it) goes away with it, unless a link is taking over
    if (pushed) { pushed = false; if (history.state && history.state.mm) history.back(); }
    if (back && opener) { (opener.offsetParent ? opener : btns.find((b) => b.offsetParent) || opener).focus({ preventScroll: true }); }
  };

  for (const b of btns) {
    b.addEventListener("click", (e) => {
      if (!open) show(e.detail === 0 ? "key" : "click", b);
      else if (mode === "hover") { mode = "click"; scroller.focus({ preventScroll: true }); } // a hover-opened menu stays when clicked
      else hide(true);
    });
    // hover with intent: the pointer rests on "Work" for a moment (not a pass on the way to another link)
    b.addEventListener("pointerenter", (e) => { if (e.pointerType !== "mouse" || !FINE.matches || PHONE.matches) return; clearTimeout(tLeave); if (!open) tHover = setTimeout(() => show("hover", b), 90); });
    b.addEventListener("pointerleave", () => { clearTimeout(tHover); if (open && mode === "hover") tLeave = setTimeout(() => hide(false), 280); });
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && !open) { e.preventDefault(); show("key", b); }
      else if (e.key === "Tab" && !e.shiftKey && open) { e.preventDefault(); q.focus(); }
    });
  }
  scroller.addEventListener("pointerenter", () => clearTimeout(tLeave));
  scroller.addEventListener("pointerleave", (e) => { if (open && mode === "hover" && e.pointerType === "mouse") tLeave = setTimeout(() => hide(false), 280); });
  scrim.addEventListener("click", () => hide(false));
  $(".mm-x").addEventListener("click", () => hide(true));
  addEventListener("pageshow", (e) => { if (e.persisted) hide(false); });
  addEventListener("popstate", () => { if (open && pushed) { pushed = false; hide(false); } });
  PHONE.addEventListener?.("change", () => open && hide(false));
  addEventListener("resize", () => open && setTop());

  // keys inside: Esc closes, Tab goes round, the arrows walk the names (up and down a street, sideways to the next)
  const focusables = () => $$("a[href], button, input, select, [tabindex]:not([tabindex='-1'])").filter((x) => x.offsetParent !== null && !x.disabled && x.tabIndex >= 0);
  const step = (from, key) => {
    const vs = visible(); if (!vs.length) return null;
    if (!from || !vs.includes(from)) return vs[0];
    if (key === "Home") return vs[0]; if (key === "End") return vs[vs.length - 1];
    const r = from.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bd = Infinity;
    for (const a of vs) {
      if (a === from) continue;
      const s = a.getBoundingClientRect(), x = s.left + s.width / 2, y = s.top + s.height / 2, dx = x - cx, dy = y - cy;
      const along = key === "ArrowDown" ? dy : key === "ArrowUp" ? -dy : key === "ArrowRight" ? dx : -dx, across = key === "ArrowDown" || key === "ArrowUp" ? Math.abs(dx) : Math.abs(dy);
      if (along <= 2) continue;
      const dist = along + across * 3;
      if (dist < bd) { bd = dist; best = a; }
    }
    return best;
  };
  d.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      if (e.target === q && q.value) { q.value = ""; run(); return; }
      e.preventDefault(); hide(true); return;
    }
    if (e.key === "Tab") {
      const fs = focusables(); if (!fs.length) return;
      const i = fs.indexOf(d.activeElement);
      if (i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === fs.length - 1)) { e.preventDefault(); fs[e.shiftKey ? fs.length - 1 : 0].focus(); }
      return;
    }
    if (!mm.contains(e.target) || e.target.tagName === "SELECT") return;
    if (!/^(Arrow(Up|Down|Left|Right)|Home|End)$/.test(e.key)) return;
    if (e.target === q) { if (e.key !== "ArrowDown") return; e.preventDefault(); const a = visible()[0]; a && a.focus(); return; }
    const a = step(e.target.closest(".mm-i"), e.key);
    if (a) { e.preventDefault(); a.focus(); a.scrollIntoView({ block: "nearest", inline: "nearest" }); }
  });
  for (const a of items) {
    a.addEventListener("mouseenter", () => FINE.matches && preview(a));
    a.addEventListener("focus", () => preview(a));
    a.addEventListener("click", (e) => go(e, a));
  }
  cv.addEventListener("click", (e) => cur && go(e, cur));
  // into the case: the preview's cover becomes the case's hero where the browser can (the Street Index's own handoff,
  // build/streetindex.mjs: the case pages opt in when this flag names them), then the menu closes behind
  function go(e, a) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    if (pushed) { pushed = false; try { history.replaceState({ ...history.state, mm: 0 }, ""); } catch {} } // the link takes the sheet's history step
    if (a.hasAttribute("data-nocase")) { hide(false); return; }
    try { sessionStorage.setItem("si-vt", new URL(a.href, location.href).pathname); } catch {}
    if (!RM.matches && !PHONE.matches && "onpagereveal" in window) {
      const s = d.createElement("style"); s.textContent = "@view-transition{navigation:auto}::view-transition-group(*){animation-duration:.2s}"; d.head.append(s);
      $$(".mm-im").forEach((i) => (i.style.viewTransitionName = ""));
      const on = $(".mm-im.on"); if (on && cur === a) on.style.viewTransitionName = "case-hero";
    }
  }

  // the sentence filter and the search, live across the streets
  const escH = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const mark = (t, w) => { const i = w ? t.toLowerCase().indexOf(w) : -1; return i < 0 ? escH(t) : escH(t.slice(0, i)) + `<mark class="mm-hl">${escH(t.slice(i, i + w.length))}</mark>` + escH(t.slice(i + w.length)); };
  // Romanian counts take "de" from 20 on ("44 de locuri"); unfiltered, the count is just the city ("44 places on 4 streets")
  const de = (n) => (n % 100 >= 20 || (n >= 100 && n % 100 === 0) ? "de " : "");
  const fmt = (n, s, on) => RO
    ? `<b>${n} ${de(n)}${n === 1 ? "loc" : "locuri"}</b> pe ${s} ${s === 1 ? "stradă" : "străzi"}${on ? `, din ${total}` : ""}`
    : `<b>${n} ${n === 1 ? "place" : "places"}</b> on ${s} ${s === 1 ? "street" : "streets"}${on ? `, of ${total}` : ""}`;
  const sts = $$(".mm-st");
  function run() {
    const ch = f.ch.value, sk = f.st.value, w = q.value.trim().toLowerCase(), on = !!(ch || sk || w);
    let n = 0, ns = 0;
    for (const s of sts) {
      let m = 0;
      for (const a of $$(".mm-i", s)) {
        const ok = (!ch || a.dataset.ch.split(" ").includes(ch)) && (!sk || s.dataset.k === sk) && (!w || hay.get(a).includes(w));
        a.closest("li").hidden = !ok; if (ok) m++;
      }
      const c = $(".mm-sc", s); c.textContent = String(on ? m : +c.dataset.n).padStart(2, "0");
      s.classList.toggle("empty", !m); $(".mm-none", s).hidden = !!m; n += m; if (m) ns++;
    }
    names.forEach(([el, t]) => (el.innerHTML = mark(t, w)));
    cats.forEach(([el, t]) => (el.innerHTML = mark(t, w)));
    mm.classList.toggle("filtering", on);
    // one street left (not the shortcut): its names spread over the three columns
    const hits = sts.filter((s) => !s.classList.contains("empty")), solo = on && hits.length === 1 && hits[0].dataset.k !== "D";
    mm.classList.toggle("solo", solo); sts.forEach((s) => s.classList.toggle("hit", solo && s === hits[0]));
    clear.hidden = !w;
    count.innerHTML = n ? fmt(n, ns, on) : "";
    empty.hidden = !!n; mm.classList.toggle("none", !n);
    if (on || PHONE.matches) visible().forEach((a) => (PHONE.matches && io ? io.observe($(".mm-th img", a) || a) : load($(".mm-th img", a))));
    // the preview follows the filter: a hidden brand gives way to the first match, a visible one gets its new position
    if (open) { const v = !cur || cur.closest("li").hidden ? visible()[0] : cur; if (v) { cur && cur.classList.remove("on"); cur = null; preview(v); } }
  }
  // each select as wide as its words, so the sentence reads as one line
  const sizer = d.createElement("span"); sizer.setAttribute("aria-hidden", "true"); sizer.style.cssText = "position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0";
  const fit = (sel) => { if (!sel.offsetParent) return; const cs = getComputedStyle(sel); sizer.style.font = cs.font; sizer.style.letterSpacing = cs.letterSpacing; sizer.textContent = sel.options[sel.selectedIndex].text; sel.style.setProperty("--w", Math.ceil(sizer.getBoundingClientRect().width + parseFloat(cs.paddingRight) + 4) + "px"); };
  const fitAll = () => { if (!sizer.isConnected) d.body.append(sizer); [f.ch, f.st].forEach(fit); };
  f.addEventListener("submit", (e) => { e.preventDefault(); const a = visible()[0]; if (a) { a.focus(); a.click(); } });
  f.addEventListener("input", run); f.addEventListener("change", (e) => { if (e.target.tagName === "SELECT") fit(e.target); run(); });
  clear.addEventListener("click", () => { q.value = ""; run(); q.focus(); });
  $(".mm-reset").addEventListener("click", () => { q.value = ""; f.ch.value = ""; f.st.value = ""; fitAll(); run(); q.focus(); });
  // the sentence is sized once it is on screen (fonts ready, the menu laid out)
  new MutationObserver(() => { if (!mm.hidden) { fitAll(); d.fonts && d.fonts.ready.then(fitAll); } }).observe(mm, { attributes: true, attributeFilter: ["hidden"] });
  addEventListener("resize", () => open && fitAll());
  run();
})();
