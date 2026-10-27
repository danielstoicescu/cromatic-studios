// Cromatic Studios · Process (internal deck, r322 · r329). A pager that moves by exactly one whole slide and never rests
// between two (the page never scrolls; the track moves by one viewport height per slide), with sub-steps inside a slide:
//   build slides : elements with data-r="k" appear at step k (k = 0 is there from the start, and marked "now" while
//                  current). Forward (→ ↓ PageDown Space Enter, a scroll or swipe) shows the next step, then moves on;
//                  back (← ↑ PageUp Shift+Space Backspace) takes it away, then goes back to the previous slide, built.
//   row slides   : a horizontal row of cards with a cursor. → / PageDown / Space walk the cursor along the row (a clicker
//                  goes through every card, then on); ← / PageUp walk back; ↑ ↓ always change slides; a sideways trackpad
//                  scroll or a drag moves the row freely; a click (or Enter on the cursor) opens the case in an overlay.
//   pan slides   : the Brand Canvas, panned across its length: it starts gliding by itself when the slide opens, stops
//                  as soon as anyone touches anything; → ← / PageDown PageUp move it a screen at a time, drag moves it.
//   Home / End · a number then a pause (or Enter) = that slide · F = full screen · Esc closes the overlay
//   the URL: #7 is slide 7, #7.2 is slide 7 at step 2, so a reload stays where you were
(() => {
  "use strict";
  const deck = document.getElementById("deck"), track = document.getElementById("track");
  const slides = [...track.querySelectorAll(".slide")], N = slides.length;
  const $ = (id) => document.getElementById(id);
  const bar = $("bar"), count = $("count"), part = $("part"), dots = $("dots"), prevB = $("prev"), nextB = $("next"), fsB = $("fs"), hint = $("hint");
  const ov = $("ov"), ovF = $("ov-f"), ovT = $("ov-t"), ovNew = $("ov-new"), ovX = $("ov-x");
  const RM = document.documentElement.classList.contains("rm");
  const DUR = RM ? 0 : 720;
  let cur = -1, h = 0, lastNav = -1e9, offTimer = 0;

  // ---------- per slide: its kind, its steps ----------
  const S = slides.map((el) => {
    const kind = el.dataset.kind || "build";
    const rs = [...el.querySelectorAll("[data-r]")];
    const scroller = el.querySelector("[data-h]");
    const cards = scroller ? [...scroller.querySelectorAll(".card")] : [];
    return { el, kind, rs, scroller, cards, step: 0, maxBuild: rs.reduce((m, x) => Math.max(m, +x.dataset.r || 0), 0) };
  });
  const panPage = (s) => Math.max(1, s.scroller.clientWidth * 0.62);
  const maxOf = (s) => s.kind === "row" ? s.cards.length : s.kind === "pan" ? Math.ceil(Math.max(0, s.scroller.scrollWidth - s.scroller.clientWidth) / panPage(s) - 0.02) : s.maxBuild;

  // the stagger of each slide's entries, in reading order
  for (const s of S) [...s.el.querySelectorAll(".a")].forEach((el, i) => el.style.setProperty("--i", Math.min(i, 14)));
  for (const s of S) s.cards.forEach((c, j) => c.style.setProperty("--ci", Math.min(j, 8)));

  // pictures and films: the slide on screen and its neighbours first, the rest once the deck has settled
  const load = (s) => { if (!s) return; for (const m of s.el.querySelectorAll("[data-src]")) { m.src = m.dataset.src; m.removeAttribute("data-src"); } };
  const near = (i) => { for (let k = -1; k <= 2; k++) load(S[i + k]); };
  let idleLoaded = false;
  const loadAll = () => { if (idleLoaded) return; idleLoaded = true; let k = 0; const step = () => { if (k >= N) return; load(S[k++]); setTimeout(step, 150); }; step(); };

  // ---------- horizontal scrollers ----------
  const smoothTo = (sc, x, dur) => {
    x = Math.max(0, Math.min(sc.scrollWidth - sc.clientWidth, x));
    cancelAnimationFrame(sc._raf);
    if (RM || !dur) { sc.scrollLeft = x; edges(sc); return; }
    const x0 = sc.scrollLeft, t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; sc.scrollLeft = x0 + (x - x0) * e; edges(sc); if (p < 1) sc._raf = requestAnimationFrame(tick); };
    sc._raf = requestAnimationFrame(tick);
  };
  const edges = (sc) => {
    const max = sc.scrollWidth - sc.clientWidth;
    sc.classList.toggle("at-start", sc.scrollLeft < 4);
    sc.classList.toggle("at-end", sc.scrollLeft > max - 4);
    const pb = sc.parentElement.querySelector(".pbar i");
    if (pb) pb.style.transform = `scaleX(${max > 0 ? sc.scrollLeft / max : 1})`;
  };
  for (const s of S) if (s.scroller) {
    const sc = s.scroller; edges(sc);
    sc.addEventListener("scroll", () => edges(sc), { passive: true });
    // drag (mouse, pen or a finger): the row follows; a drag is not a click
    let down = false, x0 = 0, l0 = 0, moved = 0;
    sc.addEventListener("pointerdown", (e) => { if (e.button) return; down = true; moved = 0; x0 = e.clientX; l0 = sc.scrollLeft; stopAuto(s); cancelAnimationFrame(sc._raf); });
    window.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = Math.abs(dx); sc.classList.add("drag"); } sc.scrollLeft = l0 - dx; });
    window.addEventListener("pointerup", () => { if (!down) return; down = false; setTimeout(() => sc.classList.remove("drag"), 0); if (s.kind === "pan") s.step = Math.round(sc.scrollLeft / panPage(s)); });
    sc.addEventListener("click", (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  }
  // the canvas glides by itself when its slide opens, until anyone touches anything
  const stopAuto = (s) => { if (s && s.auto) { cancelAnimationFrame(s.auto); s.auto = 0; } };
  const startAuto = (s) => {
    if (RM || s.kind !== "pan") return;
    const sc = s.scroller; stopAuto(s);
    const t0 = performance.now() + 1400, x0 = sc.scrollLeft;
    const tick = (t) => { const max = sc.scrollWidth - sc.clientWidth, dur = Math.max(6000, (max - x0) / 0.09); if (t < t0) { s.auto = requestAnimationFrame(tick); return; } const p = Math.min(1, (t - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; sc.scrollLeft = x0 + (max - x0) * e; edges(sc); s.step = Math.floor(sc.scrollLeft / panPage(s)); if (p < 1) s.auto = requestAnimationFrame(tick); else s.auto = 0; };
    s.auto = requestAnimationFrame(tick);
  };

  // ---------- show a step ----------
  function apply(s, instant) {
    const k = s.step;
    s.el.dataset.step = k;
    if (s.kind === "build") for (const x of s.rs) { const r = +x.dataset.r || 0; x.classList.toggle("rv", r <= k); x.classList.toggle("now", r === k); }
    else if (s.kind === "row") {
      s.cards.forEach((c, j) => c.classList.toggle("cur", j === k - 1));
      const sc = s.scroller;
      if (k === 0) smoothTo(sc, 0, instant ? 0 : 650);
      else { const c = s.cards[k - 1]; smoothTo(sc, c.offsetLeft + c.offsetWidth / 2 - sc.clientWidth / 2, instant ? 0 : 650); }
    } else if (s.kind === "pan") { stopAuto(s); smoothTo(s.scroller, k * panPage(s), instant ? 0 : 900); }
    paintDots();
  }
  function paintDots() {
    const s = S[cur]; if (!s) return;
    const m = maxOf(s);
    if (s.kind === "build" && m > 0 && m <= 14) dots.innerHTML = Array.from({ length: m + 1 }, (_, j) => `<i class="${j <= s.step ? "on" : ""}"></i>`).join("");
    else if (s.kind !== "build" && m > 0) dots.innerHTML = `<b class="mono">${s.kind === "row" ? `${s.step} / ${m}` : `${Math.round((s.scroller.scrollLeft / Math.max(1, s.scroller.scrollWidth - s.scroller.clientWidth)) * 100)}%`}</b>`;
    else dots.innerHTML = "";
  }

  // ---------- slides ----------
  const clamp = (i) => Math.max(0, Math.min(N - 1, i));
  const place = (instant) => {
    if (instant) track.classList.add("now");
    track.style.transform = `translate3d(0, ${-cur * h}px, 0)`;
    if (instant) { void track.offsetHeight; track.classList.remove("now"); }
  };
  function go(i, enter = "start", instant = false) {
    i = clamp(i);
    if (i === cur) return false;
    const old = cur;
    cur = i; lastNav = performance.now();
    place(instant || old < 0);
    near(i);
    const s = S[i];
    s.step = enter === "end" && s.kind === "build" ? s.maxBuild : typeof enter === "number" ? Math.max(0, Math.min(maxOf(s), enter)) : 0;
    S.forEach((x, k) => { if (k === i) { x.el.removeAttribute("inert"); x.el.removeAttribute("aria-hidden"); } else { x.el.setAttribute("inert", ""); x.el.setAttribute("aria-hidden", "true"); stopAuto(x); } });
    apply(s, true);
    if (old < 0) requestAnimationFrame(() => requestAnimationFrame(() => s.el.classList.add("on"))); else s.el.classList.add("on");
    clearTimeout(offTimer);
    offTimer = setTimeout(() => S.forEach((x, k) => { if (k !== cur) { x.el.classList.remove("on"); if (x.scroller && x.kind === "row") { x.step = 0; apply(x, true); } } }), instant ? 0 : DUR + 40);
    films(); turnWord();
    if (s.kind === "pan" && s.step === 0) startAuto(s);
    document.body.dataset.theme = s.el.dataset.theme;
    document.body.dataset.kind = s.kind;
    part.textContent = s.el.dataset.part || "";
    count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
    bar.style.transform = `scaleX(${N > 1 ? i / (N - 1) : 1})`;
    prevB.disabled = i === 0;
    setHash();
    if (i > 0) hint.classList.add("gone");
    return true;
  }
  const setHash = () => { const s = S[cur], want = s.step ? `#${cur + 1}.${s.step}` : `#${cur + 1}`; if (location.hash !== want) history.replaceState(null, "", want); };
  // forward / back: a step inside the slide first (unless asked to change slides), then the next slide
  function fwd(slideOnly = false) {
    const s = S[cur], m = maxOf(s);
    if (!(slideOnly && s.kind !== "build") && s.step < m) {
      if (s.kind === "pan" && s.auto) { stopAuto(s); s.step = Math.floor(s.scroller.scrollLeft / panPage(s)); }
      s.step = Math.min(m, s.step + 1); apply(s); setHash(); lastNav = performance.now(); return true;
    }
    return go(cur + 1, "start");
  }
  function back(slideOnly = false) {
    const s = S[cur];
    if (!(slideOnly && s.kind !== "build") && s.step > 0) {
      if (s.kind === "pan") { stopAuto(s); s.step = Math.ceil(s.scroller.scrollLeft / panPage(s) - 0.02); }
      s.step = Math.max(0, s.step - 1); apply(s); setHash(); lastNav = performance.now(); return true;
    }
    return go(cur - 1, "end");
  }

  // ---------- films play only on their slide ----------
  function films() { S.forEach((x, k) => x.el.querySelectorAll("video").forEach((v) => { if (k === cur && !RM) { if (v.dataset.src) { v.src = v.dataset.src; v.removeAttribute("data-src"); } const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); })); }
  // ---------- the cover's pill turns its word ----------
  let turnT = 0;
  function turnWord() {
    clearInterval(turnT);
    const t = S[cur].el.querySelector(".turn"); if (!t || RM) return;
    const words = JSON.parse(t.dataset.words || "[]"); let k = 0;
    turnT = setInterval(() => { k = (k + 1) % words.length; t.classList.add("swap"); setTimeout(() => { t.textContent = words[k]; t.classList.remove("swap"); }, 220); }, 2300);
  }

  // ---------- size ----------
  const measure = () => { h = deck.clientHeight || window.innerHeight; place(true); const s = S[cur]; if (s && s.kind !== "build") apply(s, true); };
  window.addEventListener("resize", measure);
  deck.addEventListener("scroll", () => { deck.scrollTop = 0; deck.scrollLeft = 0; });

  // ---------- wheel / trackpad ----------
  const QUIET = 190, MIN_GAP = 420, THRESH = 22;
  let lastWheel = -1e9, used = false, acc = 0, recent = [], axis = "";
  deck.addEventListener("wheel", (e) => {
    if (!ov.hidden) return;
    e.preventDefault();
    if (e.ctrlKey) return;
    const now = performance.now(), s = S[cur];
    let dx = e.deltaX, dy = e.deltaY;
    const mul = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? (h || 800) : 1; dx *= mul; dy *= mul;
    if (now - lastWheel > QUIET) { used = false; acc = 0; recent = []; axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y"; }
    lastWheel = now;
    // sideways on a row or the canvas: the row itself moves, freely
    if (axis === "x" && s.scroller) { stopAuto(s); cancelAnimationFrame(s.scroller._raf); s.scroller.scrollLeft += dx; edges(s.scroller); if (s.kind === "pan") s.step = Math.round(s.scroller.scrollLeft / panPage(s)); paintDots(); return; }
    const d = axis === "x" ? dx : dy, a = Math.abs(d);
    if (used && recent.length >= 4 && now - lastNav > MIN_GAP + 180) {
      const avg = recent.reduce((x, y) => x + y, 0) / recent.length;
      if (a > Math.max(24, avg * 2.6)) { used = false; acc = 0; }
    }
    recent.push(a); if (recent.length > 5) recent.shift();
    if (used) return;
    acc += d;
    if (Math.abs(acc) < THRESH || now - lastNav < MIN_GAP) return;
    used = true;
    // a vertical scroll changes slides on a row or the canvas, and builds a build slide
    const slideOnly = axis === "y";
    acc > 0 ? fwd(slideOnly) : back(slideOnly);
    acc = 0;
  }, { passive: false });

  // ---------- keys ----------
  let digits = "", digitTimer = 0;
  const jumpDigits = () => { if (digits) go(parseInt(digits, 10) - 1); digits = ""; };
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (!ov.hidden) { if (k === "Escape" || k === "Backspace") { closeCase(); e.preventDefault(); } return; }
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const s = S[cur];
    if (/^[0-9]$/.test(k)) { digits += k; clearTimeout(digitTimer); digitTimer = setTimeout(jumpDigits, 650); e.preventDefault(); return; }
    if (k === "Enter" && digits) { clearTimeout(digitTimer); jumpDigits(); e.preventDefault(); return; }
    if (k === "f" || k === "F") { toggleFs(); e.preventDefault(); return; }
    // Enter on a row opens the card under the cursor; on an archetype it picks it
    if (k === "Enter" && s.kind === "row" && s.step > 0) { const c = s.cards[s.step - 1]; if (c && c.dataset.case) { openCase(c); e.preventDefault(); return; } }
    if ((k === "Enter" || k === " ") && e.target.closest && e.target.closest(".sg")) { pickArch(e.target.closest(".sg")); e.preventDefault(); return; }
    let act = null;
    if (k === "ArrowDown") act = () => fwd(true);
    else if (k === "ArrowUp") act = () => back(true);
    else if (["ArrowRight", "PageDown"].includes(k) || (k === " " && !e.shiftKey)) act = () => fwd(false);
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(k) || (k === " " && e.shiftKey)) act = () => back(false);
    else if (k === "Home") act = () => go(0);
    else if (k === "End") act = () => go(N - 1);
    else if (k === "Enter" && !(e.target.closest && e.target.closest("a, button"))) act = () => fwd(false);
    if (!act) return;
    e.preventDefault();
    if (e.repeat && !(s.kind !== "build" && /Arrow(Left|Right)/.test(k))) return; // a held key moves once (except along a row)
    act();
  });

  // ---------- touch ----------
  let tx = 0, ty = 0, tOn = false;
  deck.addEventListener("touchstart", (e) => { if (e.touches.length !== 1) { tOn = false; return; } tOn = true; tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener("touchmove", (e) => { if (tOn) e.preventDefault(); }, { passive: false });
  deck.addEventListener("touchend", (e) => {
    if (!tOn) return; tOn = false;
    const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    const inRow = e.target.closest && e.target.closest("[data-h]");
    if (Math.abs(dy) > 40 && Math.abs(dy) >= Math.abs(dx)) dy < 0 ? fwd(true) : back(true);
    else if (!inRow && Math.abs(dx) > 60) dx < 0 ? fwd() : back();
  });

  // ---------- the case overlay ----------
  let lastFocus = null;
  function openCase(card) {
    const slug = card.dataset.case; if (!slug) return;
    lastFocus = card;
    ovT.textContent = card.querySelector("b")?.textContent || slug;
    ovNew.href = `/work/${slug}/`;
    ovF.src = `/work/${slug}/?embed=1`;
    ov.hidden = false; document.body.classList.add("ov-on");
    requestAnimationFrame(() => ov.classList.add("open"));
    ovX.focus();
  }
  function closeCase() {
    ov.classList.remove("open"); document.body.classList.remove("ov-on");
    setTimeout(() => { ov.hidden = true; ovF.src = "about:blank"; }, RM ? 0 : 260);
    if (lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  ovX.addEventListener("click", closeCase);
  ov.addEventListener("click", (e) => { if (e.target === ov) closeCase(); });
  ovF.addEventListener("load", () => { try { ovF.contentWindow.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCase(); }); } catch (e) {} });
  for (const s of S) for (const c of s.cards) c.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // a new tab, as asked
    e.preventDefault();
    const j = s.cards.indexOf(c);
    if (s.step !== j + 1) { s.step = j + 1; apply(s); setHash(); }
    if (c.dataset.case) openCase(c);
  });

  // ---------- the archetype wheel: any segment can be picked ----------
  function pickArch(g) { const w = g.closest("svg"); w.querySelectorAll(".sg").forEach((x) => x.classList.toggle("sel", x === g && !g.classList.contains("sel"))); w.classList.toggle("picking", !!w.querySelector(".sg.sel")); }
  document.querySelectorAll(".wheel .sg").forEach((g) => g.addEventListener("click", () => pickArch(g)));

  // ---------- the studio photos: the statement on screen brings its photo forward ----------
  // (pure CSS, keyed on data-step)

  // ---------- buttons, hash, full screen ----------
  prevB.addEventListener("click", () => back());
  nextB.addEventListener("click", () => fwd());
  const fromHash = () => { const m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash); return m ? [parseInt(m[1], 10) - 1, m[2] ? parseInt(m[2], 10) : 0] : null; };
  window.addEventListener("hashchange", () => { const m = fromHash(); if (!m) return; if (m[0] !== cur) go(m[0], m[1]); else { const s = S[cur]; s.step = Math.min(maxOf(s), m[1]); apply(s); } });
  function toggleFs() {
    const d = document;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else { const el = d.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen).call(el); }
    } catch (e) {}
  }
  fsB.addEventListener("click", toggleFs);

  // ---------- on a TV: the pointer and the buttons fade when nobody touches anything ----------
  let idleT = 0;
  const wake = () => { document.body.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add("idle"), 2600); };
  ["mousemove", "mousedown", "touchstart"].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
  wake();
  setTimeout(() => hint.classList.add("gone"), 6000);

  // ---------- start ----------
  measure();
  const m0 = fromHash();
  go(m0 ? m0[0] : 0, m0 ? m0[1] : "start", true);
  if (document.readyState === "complete") setTimeout(loadAll, 1500); else window.addEventListener("load", () => setTimeout(loadAll, 1500));
  // for checks (and for a remote, later): where the deck is
  window.__prez = { get index() { return cur; }, get step() { return S[cur].step; }, get max() { return maxOf(S[cur]); }, get count() { return N; }, get height() { return h; }, kind: (i) => S[i - 1].kind, go: (i, st = 0) => go(i - 1, st), fwd, back };
})();
