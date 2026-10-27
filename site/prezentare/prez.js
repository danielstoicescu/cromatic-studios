// Cromatic Studios · Process (internal deck, r322): a pager that moves by exactly one whole slide per action and never
// rests between two. Not CSS scroll-snap (a trackpad can leave it halfway): the page itself never scrolls; the track
// is moved by a transform, one viewport height per slide.
//   wheel / trackpad : one gesture = one slide. A gesture lasts until the wheel goes quiet (macOS inertia included);
//                      a new swipe inside an inertial tail is told apart by its delta rising again
//   keys             : ↓ → PageDown Space Enter = next · ↑ ← PageUp Shift+Space Backspace = back · Home / End ·
//                      a number then a short pause (or Enter) = that slide · F = full screen
//   touch            : a swipe up/down (or left/right) on a tablet or phone
//   the URL hash     : #7 is slide 7, so a reload stays where you were
(() => {
  "use strict";
  const deck = document.getElementById("deck"), track = document.getElementById("track");
  const slides = [...track.querySelectorAll(".slide")], N = slides.length;
  const $ = (id) => document.getElementById(id);
  const bar = $("bar"), count = $("count"), part = $("part"), prevB = $("prev"), nextB = $("next"), fsB = $("fs"), hint = $("hint");
  const RM = document.documentElement.classList.contains("rm");
  const DUR = RM ? 0 : 720;
  let cur = -1, h = 0, lastNav = -1e9, offTimer = 0;

  // the stagger of each slide's entries, in reading order
  for (const s of slides) [...s.querySelectorAll(".a")].forEach((el, i) => el.style.setProperty("--i", Math.min(i, 14)));

  // pictures: the slide on screen and its neighbours first, the rest once the deck has settled
  const load = (s) => { if (!s) return; for (const im of s.querySelectorAll("img[data-src]")) { im.src = im.dataset.src; im.removeAttribute("data-src"); } };
  const near = (i) => { for (let k = -1; k <= 3; k++) load(slides[i + k]); };
  let idleLoaded = false;
  const loadAll = () => { if (idleLoaded) return; idleLoaded = true; let k = 0; const step = () => { if (k >= N) return; load(slides[k++]); setTimeout(step, 120); }; step(); };

  const clamp = (i) => Math.max(0, Math.min(N - 1, i));
  const place = (instant) => {
    if (instant) track.classList.add("now");
    track.style.transform = `translate3d(0, ${-cur * h}px, 0)`;
    if (instant) { void track.offsetHeight; track.classList.remove("now"); }
  };
  function go(i, instant = false) {
    i = clamp(i);
    if (i === cur) return false;
    const old = cur;
    cur = i;
    lastNav = performance.now();
    place(instant || old < 0);
    near(i);
    slides.forEach((s, k) => { if (k === i) { s.removeAttribute("inert"); s.removeAttribute("aria-hidden"); } else { s.setAttribute("inert", ""); s.setAttribute("aria-hidden", "true"); } });
    if (old < 0) requestAnimationFrame(() => requestAnimationFrame(() => slides[cur].classList.add("on"))); else slides[i].classList.add("on");
    // the slide we leave keeps its content while it slides away, then resets so it plays again next time
    clearTimeout(offTimer);
    offTimer = setTimeout(() => slides.forEach((s, k) => { if (k !== cur) s.classList.remove("on"); }), instant ? 0 : DUR + 40);
    const s = slides[i];
    document.body.dataset.theme = s.dataset.theme;
    part.textContent = s.dataset.part || "";
    count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
    bar.style.transform = `scaleX(${N > 1 ? i / (N - 1) : 1})`;
    prevB.disabled = i === 0; nextB.disabled = i === N - 1;
    const want = `#${i + 1}`;
    if (location.hash !== want) history.replaceState(null, "", want);
    if (i > 0) hint.classList.add("gone");
    return true;
  }
  const next = () => go(cur + 1), prev = () => go(cur - 1);

  // ---------- size ----------
  const measure = () => { h = deck.clientHeight || window.innerHeight; place(true); };
  window.addEventListener("resize", measure);
  // the deck never scrolls by itself (a focus jump, a find-in-page): it is put back at once
  deck.addEventListener("scroll", () => { deck.scrollTop = 0; deck.scrollLeft = 0; });

  // ---------- wheel / trackpad ----------
  const QUIET = 190;      // ms without wheel events that end a gesture
  const MIN_GAP = 420;    // ms after a move before the wheel may move again
  const THRESH = 22;      // px a gesture must travel before it counts
  let lastWheel = -1e9, used = false, acc = 0, recent = [];
  deck.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.ctrlKey) return; // pinch-zoom on a trackpad
    const now = performance.now();
    let d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (e.deltaMode === 1) d *= 32; else if (e.deltaMode === 2) d *= h || 800;
    const a = Math.abs(d);
    if (now - lastWheel > QUIET) { used = false; acc = 0; recent = []; }
    lastWheel = now;
    // a new swipe while the last one's inertia is still decaying: its delta jumps well above the tail's
    if (used && recent.length >= 4 && now - lastNav > MIN_GAP + 180) {
      const avg = recent.reduce((x, y) => x + y, 0) / recent.length;
      if (a > Math.max(24, avg * 2.6)) { used = false; acc = 0; }
    }
    recent.push(a); if (recent.length > 5) recent.shift();
    if (used) return;
    acc += d;
    if (Math.abs(acc) < THRESH || now - lastNav < MIN_GAP) return;
    used = true;
    acc > 0 ? next() : prev();
    acc = 0;
  }, { passive: false });

  // ---------- keys ----------
  let digits = "", digitTimer = 0;
  const jumpDigits = () => { if (digits) go(parseInt(digits, 10) - 1); digits = ""; };
  window.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) { digits += k; clearTimeout(digitTimer); digitTimer = setTimeout(jumpDigits, 650); e.preventDefault(); return; }
    if (k === "Enter" && digits) { clearTimeout(digitTimer); jumpDigits(); e.preventDefault(); return; }
    if (k === "f" || k === "F") { toggleFs(); e.preventDefault(); return; }
    let act = null;
    if (["ArrowDown", "ArrowRight", "PageDown"].includes(k) || (k === " " && !e.shiftKey)) act = next;
    else if (["ArrowUp", "ArrowLeft", "PageUp", "Backspace"].includes(k) || (k === " " && e.shiftKey)) act = prev;
    else if (k === "Home") act = () => go(0);
    else if (k === "End") act = () => go(N - 1);
    else if (k === "Enter" && !(e.target.closest && e.target.closest("a, button"))) act = next;
    if (!act) return;
    e.preventDefault();
    if (e.repeat) return; // a held key moves once; a clicker's quick presses each count
    act();
  });

  // ---------- touch ----------
  let tx = 0, ty = 0, tOn = false;
  deck.addEventListener("touchstart", (e) => { if (e.touches.length !== 1) { tOn = false; return; } tOn = true; tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener("touchmove", (e) => { if (tOn) e.preventDefault(); }, { passive: false });
  deck.addEventListener("touchend", (e) => {
    if (!tOn) return; tOn = false;
    const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dy) > 40 && Math.abs(dy) >= Math.abs(dx)) dy < 0 ? next() : prev();
    else if (Math.abs(dx) > 60) dx < 0 ? next() : prev();
  });

  // ---------- buttons, hash, full screen ----------
  prevB.addEventListener("click", prev);
  nextB.addEventListener("click", next);
  window.addEventListener("hashchange", () => { const m = /^#(\d+)$/.exec(location.hash); if (m) go(parseInt(m[1], 10) - 1); });
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
  const m = /^#(\d+)$/.exec(location.hash);
  go(m ? parseInt(m[1], 10) - 1 : 0, true);
  if (document.readyState === "complete") setTimeout(loadAll, 1500); else window.addEventListener("load", () => setTimeout(loadAll, 1500));
  // for checks (and for a remote, later): where the deck is
  window.__prez = { get index() { return cur; }, get count() { return N; }, get height() { return h; }, go: (i) => go(i - 1) };
})();
