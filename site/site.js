// Cromatic Studios · the lo-fi website. Menu, lazy video, the YouTube facade, reveal on scroll
// and the boarding-pass form (the same POST /api/boarding the drive uses).
(() => {
  const d = document, root = d.documentElement;
  const RO = (root.lang || "").slice(0, 2) === "ro"; // beta 3.48 r217 (Daniel, QA round 2): the script's own words in Romanian on the Romanian pages
  root.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // mobile menu
  const mb = d.querySelector(".menu-btn"), mn = d.getElementById("mnav");
  if (mb && mn) {
    const set = (on) => { mb.setAttribute("aria-expanded", String(on)); mn.classList.toggle("open", on); };
    mb.addEventListener("click", () => set(mb.getAttribute("aria-expanded") !== "true"));
    mn.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  }

  // videos load and play only while on screen
  const vids = [...d.querySelectorAll("video.lv")];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach(({ target: v, isIntersecting: on }) => {
      if (on) { if (!v.src) v.src = v.dataset.src; if (!reduced) v.play().catch(() => {}); }
      else if (v.src) v.pause();
    }), { rootMargin: "200px 0px" });
    vids.forEach((v) => io.observe(v));
    // gentle reveal
    const rv = [...d.querySelectorAll(".chap, .pcard, .svc, .tl li, .qa details, .cblock, .photos figure")]; // (TASK-067: the bento's cards deal in on their own, below)
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io2.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach((el, i) => { el.classList.add("rv"); el.style.transitionDelay = `${(i % 3) * 70}ms`; io2.observe(el); });
  } else vids.forEach((v) => { v.src = v.dataset.src; });

  // r143: the kinetic cups no longer play in the first fold of /site/ (it is the city and the opening's words now)

  // brand canvas: on desktop the page scrolls down while the board slides left; on phones the
  // board is dragged sideways. Elements appear as they enter the screen.
  if (/[?&]embed\b/.test(location.search)) root.classList.add("embed");
  const cv = d.querySelector(".cv");
  if (cv) {
    const sticky = cv.querySelector(".cv-sticky"), track = cv.querySelector(".cv-track"), bar = cv.querySelector(".cv-bar");
    const els = [...cv.querySelectorAll(".cv-el")];
    const mq = matchMedia("(max-width: 760px), (pointer: coarse)");
    let travel = 0, raf = 0, batch = 0;
    // r139a: elements past the first 18 come with data-src (render.mjs): one about to show gets its file at once, the
    // ones within two and a half screens once the page has loaded and painted
    // r139d: every element waits in data-src now, the first screen's too: they get their files once the board's
    // background (the page's largest paint) is on screen (czAfterLcp, the page's loading gate), the ones on screen
    // first, the ones within two and a half screens when those have come in (or 2.5 s later). Each takes, from its
    // data-srcset (1×, 1.5× and 2× of the board), the file for its real width on this screen; it comes in (the reveal)
    // once it is decoded, so it never slides in empty.
    let gate = false, ahead = false, wait = 0, aheadT = 0;
    const openAhead = () => { if (ahead) return; ahead = true; clearTimeout(aheadT); queue(); };
    const go = () => { gate = true; aheadT = setTimeout(openAhead, 2500); queue(); };
    if (window.czAfterLcp) window.czAfterLcp(go);
    else { const g = () => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(go, 60))); if (document.readyState === "complete") g(); else addEventListener("load", g); }
    const give = (e) => { const s = e.dataset.srcset; if (s) { e.sizes = `${Math.max(1, Math.ceil(e.getBoundingClientRect().width))}px`; e.srcset = s; e.removeAttribute("data-srcset"); } e.src = e.dataset.src; e.removeAttribute("data-src"); };
    const reveal = () => {
      const R = innerWidth * 0.94;
      let n = 0;
      for (const e of els) {
        if (e.classList.contains("in") || e.dataset.coming) continue;
        const r = e.getBoundingClientRect(), near = r.left < R && r.right > -40;
        if (e.dataset.src && gate && (near || (ahead && r.left < innerWidth * 2.5 && r.right > -innerWidth))) {
          give(e);
          if (near && !ahead) { wait++; const one = () => { if (--wait <= 0) openAhead(); }; e.decode ? e.decode().then(one, one) : one(); }
        }
        if (!near || e.dataset.src) continue;
        const delay = `${Math.min(n++, 10) * 55}ms`, show = () => { delete e.dataset.coming; e.style.transitionDelay = delay; e.classList.add("in"); };
        if (e.complete && e.naturalWidth) show();
        else { e.dataset.coming = "1"; e.decode ? e.decode().then(show, show) : e.addEventListener("load", show, { once: true }); }
      }
      if (gate && !wait && !ahead) openAhead();
    };
    const tick = () => {
      raf = 0;
      let p;
      if (mq.matches) {
        const max = sticky.scrollWidth - sticky.clientWidth;
        p = max > 0 ? sticky.scrollLeft / max : 0;
      } else {
        const top = cv.getBoundingClientRect().top - (root.classList.contains("embed") ? 0 : 72);
        p = travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 0;
        track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
      }
      bar?.style.setProperty("--p", p.toFixed(4));
      if (p > 0.01) cv.classList.add("moved");
      reveal();
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const layout = () => {
      if (mq.matches) { cv.style.height = ""; track.style.transform = ""; }
      else { travel = Math.max(0, track.scrollWidth - innerWidth); cv.style.height = `${travel + sticky.offsetHeight}px`; }
      queue();
    };
    addEventListener("scroll", queue, { passive: true });
    sticky.addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", layout);
    mq.addEventListener?.("change", layout);
    // mouse drag works too (and on a touch laptop the board follows the finger natively)
    let drag = null;
    sticky.addEventListener("pointerdown", (e) => { if (!mq.matches || e.pointerType === "touch") return; drag = { x: e.clientX, s: sticky.scrollLeft }; sticky.setPointerCapture(e.pointerId); });
    sticky.addEventListener("pointermove", (e) => { if (drag) sticky.scrollLeft = drag.s - (e.clientX - drag.x); });
    sticky.addEventListener("pointerup", () => { drag = null; });
    // arrow keys move along the board on desktop
    sticky.addEventListener("keydown", (e) => { if (mq.matches) return; const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); scrollBy({ top: k * innerWidth * 0.4, behavior: "smooth" }); } });
    // the board's images are wide: wait for the stage to have its size before measuring
    const st = cv.querySelector(".cv-stage");
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(st); else layout();
    layout();
  }

  // ---- case pages v2: reveals, rails, lightbox, swatches, hero parallax ----
  const reveals = [...d.querySelectorAll(".c2-reveal")];
  if (reveals.length && "IntersectionObserver" in window) {
    const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach((el) => ro.observe(el));
  } else reveals.forEach((el) => el.classList.add("in"));
  d.querySelectorAll(".c2-rail").forEach((rail) => {
    const tr = rail.querySelector(".c2-track");
    const step = () => Math.max(260, tr.clientWidth * 0.7);
    rail.querySelector(".prev")?.addEventListener("click", () => tr.scrollBy({ left: -step(), behavior: "smooth" }));
    rail.querySelector(".next")?.addEventListener("click", () => tr.scrollBy({ left: step(), behavior: "smooth" }));
    let drag = null, moved = 0;
    tr.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; drag = { x: e.clientX, s: tr.scrollLeft }; moved = 0; });
    addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; moved = Math.max(moved, Math.abs(dx)); if (moved > 4) tr.classList.add("drag"); tr.scrollLeft = drag.s - dx; });
    addEventListener("pointerup", () => { if (!drag) return; drag = null; setTimeout(() => tr.classList.remove("drag"), 0); });
    tr.addEventListener("click", (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
    // r130o: a vertical wheel or trackpad gesture over the rail scrolls it sideways until it reaches an end
    tr.addEventListener("wheel", (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const max = tr.scrollWidth - tr.clientWidth;
      if (max <= 1) return;
      const dd = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? tr.clientWidth : 1);
      if ((dd > 0 && tr.scrollLeft >= max - 1) || (dd < 0 && tr.scrollLeft <= 1)) return;
      e.preventDefault();
      tr.style.scrollSnapType = "none"; clearTimeout(tr._ws); tr._ws = setTimeout(() => { tr.style.scrollSnapType = ""; }, 220);
      tr.scrollLeft = Math.max(0, Math.min(max, tr.scrollLeft + dd));
    }, { passive: false });
    tr.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") tr.scrollBy({ left: step(), behavior: "smooth" }); if (e.key === "ArrowLeft") tr.scrollBy({ left: -step(), behavior: "smooth" }); });
  });
  const lbList = [...d.querySelectorAll("img[data-lb]")];
  if (lbList.length) {
    const box = d.createElement("div"); box.className = "lbx"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", RO ? "Galerie foto" : "Image viewer");
    box.innerHTML = RO ? '<img alt=""><button class="lx-close" aria-label="Închide">×</button><button class="lx-prev" aria-label="Înapoi">←</button><button class="lx-next" aria-label="Înainte">→</button><span class="lx-n"></span>' : '<img alt=""><button class="lx-close" aria-label="Close">×</button><button class="lx-prev" aria-label="Previous">←</button><button class="lx-next" aria-label="Next">→</button><span class="lx-n"></span>';
    d.body.appendChild(box);
    const im = box.querySelector("img"), nEl = box.querySelector(".lx-n");
    let k = 0;
    const show = (i) => { k = (i + lbList.length) % lbList.length; im.src = lbList[k].dataset.lb; im.alt = lbList[k].alt; nEl.textContent = `${k + 1} / ${lbList.length}`; };
    const open = (i) => { show(i); box.classList.add("on"); root.style.overflow = "hidden"; box.querySelector(".lx-close").focus(); };
    const close = () => { box.classList.remove("on"); root.style.overflow = ""; };
    lbList.forEach((el, i) => el.addEventListener("click", () => open(i)));
    box.querySelector(".lx-close").onclick = close;
    box.querySelector(".lx-prev").onclick = (e) => { e.stopPropagation(); show(k - 1); };
    box.querySelector(".lx-next").onclick = (e) => { e.stopPropagation(); show(k + 1); };
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    addEventListener("keydown", (e) => { if (!box.classList.contains("on")) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") show(k + 1); if (e.key === "ArrowLeft") show(k - 1); });
    let sx = null;
    box.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(k + (dx < 0 ? 1 : -1)); sx = null; });
  }
  d.querySelectorAll(".swatches .sw, .c2-pal .sw").forEach((b) => b.addEventListener("click", () => {
    navigator.clipboard?.writeText(b.dataset.hex).catch(() => {});
    b.classList.add("copied"); setTimeout(() => b.classList.remove("copied"), 1200);
  }));
  const heroImg = d.querySelector(".c2-heromedia img");
  if (heroImg && !reduced) {
    const par = () => { const r = heroImg.closest(".c2-heromedia").getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; heroImg.style.transform = `translateY(${(-r.top * 0.08).toFixed(1)}px) scale(${(1 + Math.max(0, -r.top) * 0.00012).toFixed(4)})`; };
    addEventListener("scroll", () => requestAnimationFrame(par), { passive: true }); par();
  }

  // ---- the coffee stop: the van rolls with the scroll; the counter pours ----
  const road = d.querySelector(".road-scene");
  if (road && road.querySelector(".rs-pour")) {
    const tick = () => { const r = road.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * 0.6))); road.style.setProperty("--p", p.toFixed(3)); };
    addEventListener("scroll", () => requestAnimationFrame(tick), { passive: true }); tick();
    let shots = 0, dropped = false;
    const msg = road.querySelector(".rs-msg"), cups = road.querySelector(".rs-cups"), pour = road.querySelector(".rs-pour"), boxes = road.querySelector(".rs-boxes");
    const LINES = ["One double espresso. Good start.", "Two. Now we're talking.", "Three. The ideas are flowing.", "Four. COFFEE RUSH ⚡", ""];
    pour.addEventListener("click", () => {
      if (shots >= 4) { shots = 0; cups.innerHTML = ""; road.classList.remove("rush"); msg.textContent = "Next time, I'll stop at three doubles."; pour.textContent = "☕ Pour a double espresso"; return; }
      shots++;
      cups.insertAdjacentHTML("beforeend", "<i></i>");
      msg.textContent = LINES[shots - 1];
      if (shots === 4) { road.classList.add("rush"); pour.textContent = "⚡ Sober up"; }
      if (!dropped && shots === 2) {
        dropped = true;
        const C = ["#2f9e4f", "#F2A9C4", "#119BFE"];
        boxes.innerHTML = Array.from({ length: 9 }, (_, i) => `<i style="left:${30 + (i % 3) * 2.9}%;bottom:${34 + Math.floor(i / 3) * 3.8}%;background:${C[i % 3]};animation-delay:${i * 90}ms"></i>`).join("");
      }
    });
  }
  // ---- TASK-067: the portfolio's streets and cards ----
  // a street's sign swings in and its cards are dealt as it comes into view (site.css: .dom-street.in, .bento.in)
  const deal = [...d.querySelectorAll(".bento, .dom-street")];
  if (deal.length) {
    if (reduced || !("IntersectionObserver" in window)) deal.forEach((el) => el.classList.add("in"));
    else {
      const io3 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io3.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
      deal.forEach((el) => io3.observe(el));
    }
  }
  // the picture in a card drifts a hair away from the pointer (--mx, --my: -0.5 .. 0.5; the card's CSS eases it)
  if (matchMedia("(hover: hover)").matches && !reduced) d.querySelectorAll("a.bcard.has-media").forEach((c) => {
    let raf = 0, ev = null;
    c.addEventListener("pointermove", (e) => { ev = e; if (!raf) raf = requestAnimationFrame(() => { raf = 0; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", ((ev.clientX - r.left) / r.width - 0.5).toFixed(3)); c.style.setProperty("--my", ((ev.clientY - r.top) / r.height - 0.5).toFixed(3)); }); });
    c.addEventListener("pointerleave", () => { c.style.removeProperty("--mx"); c.style.removeProperty("--my"); });
  });
  // the streets' switcher lights the street on screen (and, on a phone, slides it into view)
  const snav = d.querySelector(".streets-nav");
  if (snav && "IntersectionObserver" in window) {
    const links = new Map([...snav.querySelectorAll('a[href^="#street-"]')].map((a) => [a.getAttribute("href").slice(1), a]));
    const io4 = new IntersectionObserver((es) => es.forEach((e) => {
      const a = links.get(e.target.id);
      if (!a || !e.isIntersecting) return;
      links.forEach((x) => x.removeAttribute("aria-current"));
      a.setAttribute("aria-current", "location");
      if (snav.scrollWidth > snav.clientWidth + 4) snav.scrollTo({ left: Math.max(0, a.offsetLeft - 20), behavior: reduced ? "auto" : "smooth" });
    }), { rootMargin: "-38% 0px -58% 0px" });
    links.forEach((a, id) => { const el = d.getElementById(id); if (el) io4.observe(el); });
  }
  // r359 (Daniel: "it takes too long before it opens"): a street button scrolls straight to its street (the browser's own
  // smooth scroll, starting on the click; instant with reduced motion), stopping under the header and the switch, and
  // the street's sign and cards are shown at once instead of being dealt as they come into view
  if (snav) snav.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#street-"]');
    if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = d.getElementById(a.getAttribute("href").slice(1));
    if (!el) return;
    e.preventDefault();
    // TASK-145: on the way down the header slides away and the switch rises to the top, so it only counts on the way up
    const hdr = d.querySelector(".hdr"), down = el.getBoundingClientRect().top > 0, off = (hdr && !down ? hdr.offsetHeight : 0) + snav.offsetHeight * 0.8 + 12;
    scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - off), behavior: reduced ? "auto" : "smooth" });
    // after the scroll has started: the reveal is style work, it must not hold the first frame
    setTimeout(() => { el.classList.add("in"); el.querySelectorAll(".bento, .dom-street").forEach((x) => x.classList.add("in")); el.style.setProperty("--sp", "1"); try { history.replaceState(null, "", a.getAttribute("href")); } catch {} }, 120);
  });
  // r349: once the street buttons reach their sticky place under the header they shrink (.stuck), and grow back above it
  if (snav) {
    let rq = 0;
    const st = () => { rq = 0; const top = parseFloat(getComputedStyle(snav).top) || 0; snav.classList.toggle("stuck", snav.getBoundingClientRect().top <= top + 1 && scrollY > 200); };
    addEventListener("scroll", () => { if (!rq) rq = requestAnimationFrame(st); }, { passive: true }); st();
    // r366: on a phone the switch scrolls inside itself; its edges fade where there is more to see (.sn-l, .sn-r)
    let rq2 = 0;
    const ed = () => { rq2 = 0; const x = snav.scrollLeft, m = snav.scrollWidth - snav.clientWidth; snav.classList.toggle("sn-l", x > 2); snav.classList.toggle("sn-r", m - x > 2); };
    const edq = () => { if (!rq2) rq2 = requestAnimationFrame(ed); };
    snav.addEventListener("scroll", edq, { passive: true }); addEventListener("resize", edq, { passive: true }); ed();
  }

  // ---- TASK-067: the coffee stop, drawn. The still (an SVG picture) is the page's; the Lottie (the map's player, in a worker) draws
  // over it from the same frame once the section is near and the page has loaded, and plays while the section is on screen
  // (and the tab is); never with reduced motion. TASK-071 (beta 4.0, Daniel): it loops for as long as it is on screen (no
  // more resting after three turns). The round button pauses and plays it ----
  const rl = d.querySelector(".road-lottie");
  if (rl && !reduced && window.__czL !== false && "IntersectionObserver" in window && typeof Worker !== "undefined") {
    const ds = rl.dataset, pp = rl.querySelector(".rl-pp"), mqT = matchMedia("(max-width: 700px)");
    let piece = null, kind = "", busy = false, wanted = false, near = false, paused = false, playing = false, started = false;
    // the button says what it does next: pause while it plays, play once it is paused
    const btn = (on) => { pp.setAttribute("aria-pressed", String(on)); pp.setAttribute("aria-label", on ? (RO ? "Pornește animația" : "Play the animation") : (RO ? "Oprește animația" : "Pause the animation")); };
    const load = () => (window.czL ? Promise.resolve() : new Promise((res) => {
      const C = (window.__CZL_CFG = window.__CZL_CFG || {});
      C.player = C.player || ds.czlPlayer; C.j = C.j || {};
      C.j["site-coffee-wide"] = ds.czlWide; C.j["site-coffee-tall"] = ds.czlTall;
      const s = d.createElement("script"); s.src = ds.czlJs; s.async = true; s.onload = s.onerror = () => res(); d.head.appendChild(s);
    }));
    const sync = () => {
      if (!piece) return;
      const go = near && !paused && !d.hidden;
      if (go && !playing) {
        if (!started) { started = true; piece.seg([0, piece.data.op], true); }
        else piece.anim.play();
        playing = true;
      } else if (!go && playing) { playing = false; piece.anim.pause(); }
    };
    const mount = async () => {
      if (busy) return;
      busy = true;
      await load();
      const want = mqT.matches ? "tall" : "wide";
      if (!window.czL || (piece && kind === want)) { busy = false; return; }
      if (piece) { piece.destroy(); piece = null; playing = started = false; }
      const r = rl.getBoundingClientRect();
      const p = await window.czL.mount("site-coffee-" + want, { host: rl, w: Math.max(1, r.width), h: Math.max(1, r.height), cls: "rl-czl" });
      busy = false;
      if (!p) return;
      piece = p; kind = want;
      p.at(0);
      pp.hidden = false;
      sync();
    };
    // fetched once the page has loaded, the section is within about half a screen and the page is idle (the still covers
    // the wait: it is the very frame the piece starts on)
    const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1200 }) : setTimeout(f, 60));
    const ready = new Promise((res) => { const g = () => requestAnimationFrame(() => idle(res)); if (d.readyState === "complete") g(); else addEventListener("load", g, { once: true }); });
    new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting) && !wanted) { wanted = true; ready.then(mount); } }, { rootMargin: "60% 0px" }).observe(rl);
    new IntersectionObserver((es) => { near = es.some((e) => e.isIntersecting); sync(); }, { threshold: 0.15 }).observe(rl);
    d.addEventListener("visibilitychange", sync);
    mqT.addEventListener?.("change", () => { if (piece) mount(); });
    pp.addEventListener("click", () => { paused = !paused; btn(paused); sync(); });
  }

  // TASK-145 (Daniel, 2 Nov: "meniul principal sa nu mai fie sticky, ci doar sa apara la scroll al paginii in sus"): the
  // header slides away while the page goes down and comes back as soon as it goes up (html.hdr-off; it keeps its place
  // in the flow, so nothing below it moves). On the portfolio the street switch rises into its place (site.css). It
  // stays: near the top of the page, while the phone menu or the mega menu is open, while the keyboard is in it, and
  // while a brand canvas is pinned under it on a desktop (the canvas is sized to the room under the header). It changes
  // its mind only after 8 px of travel one way, and the bounce past either end of the page is clamped out (iOS)
  const hdr = d.querySelector(".hdr");
  if (hdr && !root.classList.contains("embed") && getComputedStyle(hdr).position === "sticky") {
    const mn2 = d.getElementById("mnav"), cvs = cv && cv.querySelector(".cv-sticky"), cvFlat = matchMedia("(max-width: 760px), (pointer: coarse)");
    let lastY = -1, acc = 0, off = false, rq = 0;
    const set = (v) => { if (v !== off) { off = v; root.classList.toggle("hdr-off", v); } };
    const hold = (h) => {
      if ((mn2 && mn2.classList.contains("open")) || root.classList.contains("mm-lock") || hdr.querySelector(":focus-visible")) return true;
      if (cvs && !cvFlat.matches) { const r = cvs.getBoundingClientRect(); if (r.top <= h + 1 && cv.getBoundingClientRect().bottom >= innerHeight - 1) return true; }
      return false;
    };
    const tick = () => {
      rq = 0;
      const max = Math.max(0, root.scrollHeight - innerHeight), y = Math.min(Math.max(scrollY, 0), max), h = hdr.offsetHeight;
      const dy = lastY < 0 ? 0 : y - lastY; lastY = y;
      if (y <= h || hold(h)) { acc = 0; set(false); return; }
      if (dy) acc = (dy > 0) === (acc > 0) ? acc + dy : dy;
      if (acc > 8) set(true); else if (acc < -8) set(false);
    };
    addEventListener("scroll", () => { if (!rq) rq = requestAnimationFrame(tick); }, { passive: true });
    hdr.addEventListener("focusin", () => { if (hdr.querySelector(":focus-visible")) { acc = 0; set(false); } });
    if (mn2) new MutationObserver(tick).observe(mn2, { attributes: true, attributeFilter: ["class"] });
    tick();
  }

  // a thin reading progress bar
  if (d.querySelector(".hero-city")) { // r143
    const bar = d.createElement("div"); bar.className = "scroll-prog"; d.body.appendChild(bar);
    const sp = () => bar.style.setProperty("--sp", (scrollY / Math.max(1, d.documentElement.scrollHeight - innerHeight)).toFixed(4));
    addEventListener("scroll", sp, { passive: true }); sp();
  }
  // TASK-106: the hero's loop of the city. The still stays the poster (and the LCP): the video gets its sources only
  // after load, once the hero is on screen; never with reduced motion, Save-Data or a 2g connection. Paused off
  // screen, in a background tab, or by its button; it fades in over the still once it plays.
  // r348: the same loop also sits behind the portfolio's "place → facade → brand" fold; each one runs on its own
  // r382 (Mira's audit): the AV1 files say so (a VP9 label sent a VP9-only browser to an AV1 file), and a band's video
  // starts only once half of it is on screen (or it fills half the screen), not ahead of it
  // r398: the desktop AV1 cuts (-d2-av1, 1920 wide) say level 4.0, the phone ones 3.1; and the test reads the hashed
  // name (/assets/m/<name>-av1-<hash>.webm): r382's /-av1\.webm/ never matched one, so every AV1 file went out as vp9
  const vType = (u) => (/-d2-av1(-[0-9a-f]{8})?\.webm(\?|$)/.test(u) ? 'video/webm; codecs="av01.0.08M.08"' : /-av1(-[0-9a-f]{8})?\.webm(\?|$)/.test(u) ? 'video/webm; codecs="av01.0.05M.08"' : /\.webm(\?|$)/.test(u) ? 'video/webm; codecs="vp9"' : "video/mp4");
  const vSrc = (list) => list.filter(Boolean).map((u) => `<source src="${u}" type='${vType(u)}'>`).join("");
  const half = (e) => e.isIntersecting && (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= innerHeight * 0.5);
  const HALF = [0, 0.25, 0.5, 0.75, 1];
  d.querySelectorAll(".hc-vid").forEach((hv) => {
    const cn = navigator.connection || {}, slow = cn.saveData || /(^|-)2g$/.test(cn.effectiveType || "");
    const card = hv.closest(".hc-card, .city-band"), pp = card && card.querySelector(".hc-pp"), mq = matchMedia("(max-width: 700px)");
    if (!reduced && !slow && pp && card && "IntersectionObserver" in window) {
      let seen = false, loaded = false, paused = false;
      const set = () => {
        const s = hv.dataset, m = mq.matches;
        hv.innerHTML = vSrc([m ? s.mw : s.dw, (m && s.m) || s.d]);
        hv.load();
      };
      const sync = () => { if (!loaded) return; if (seen && !paused && !d.hidden) hv.play().catch(() => {}); else hv.pause(); };
      const start = () => { if (loaded) return; loaded = true; hv.addEventListener("playing", () => { hv.classList.add("on"); pp.hidden = false; }, { once: true }); set(); };
      const go = () => setTimeout(() => new IntersectionObserver((es) => { seen = es.some((e) => e.isIntersecting && e.intersectionRatio >= 0.2); if (es.some(half)) start(); sync(); }, { threshold: HALF }).observe(card), 300);
      if (d.readyState === "complete") go(); else addEventListener("load", go, { once: true });
      d.addEventListener("visibilitychange", sync);
      mq.addEventListener?.("change", () => { if (loaded) { set(); sync(); } });
      pp.addEventListener("click", () => { paused = !paused; pp.setAttribute("aria-pressed", String(paused)); pp.setAttribute("aria-label", paused ? (RO ? "Pornește animația" : "Play the animation") : (RO ? "Oprește animația" : "Pause the animation")); sync(); });
    }
  });
  // ---- TASK-139 ----
  // the streets' bands (r346): each clip gets its sources once the page has loaded and the band is near the screen,
  // never with reduced motion, Save-Data or 2g (the poster stays the band). A phone takes the phone cut. Each one plays
  // only while on screen and in a visible tab, or until its button pauses it (r443: the button sits under the band, in the
  // street card, shown once the clip plays; r441 took it off the clip); it fades in over its poster once it plays
  const sbs = [...d.querySelectorAll(".street-band .sb-vid")];
  if (sbs.length) {
    const cn = navigator.connection || {}, slow = cn.saveData || /(^|-)2g$/.test(cn.effectiveType || "");
    const mq = matchMedia("(max-width: 700px)");
    if (!reduced && !slow && "IntersectionObserver" in window) {
      const st = new Map(sbs.map((v) => [v, { seen: false, loaded: false, paused: false, pp: v.closest(".dom-street")?.querySelector(".sb-pp") }]));
      const set = (v) => { const s = v.dataset, m = mq.matches; v.innerHTML = vSrc([m ? s.mw : s.dw, (m && s.m) || s.d]); v.load(); };
      const sync = (v) => { const o = st.get(v); if (!o.loaded) return; if (o.seen && !o.paused && !d.hidden) v.play().catch(() => {}); else v.pause(); };
      const start = (v) => { const o = st.get(v); if (o.loaded) return; o.loaded = true; v.addEventListener("playing", () => { v.classList.add("on"); if (o.pp) o.pp.hidden = false; }, { once: true }); set(v); };
      const go = () => {
        const near = new IntersectionObserver((es) => es.forEach((e) => { if (half(e)) { const v = e.target.querySelector(".sb-vid"); start(v); sync(v); } }), { threshold: HALF }); // r382: was 60% ahead of the screen
        const seen = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target.querySelector(".sb-vid"); st.get(v).seen = e.isIntersecting; sync(v); }), { threshold: 0.05 });
        sbs.forEach((v) => { const b = v.closest(".street-band"); near.observe(b); seen.observe(b); });
      };
      if (d.readyState === "complete") go(); else addEventListener("load", go, { once: true });
      d.addEventListener("visibilitychange", () => sbs.forEach(sync));
      mq.addEventListener?.("change", () => sbs.forEach((v) => { if (st.get(v).loaded) { set(v); sync(v); } }));
      // one label (from the page, so in its language), the pressed state says paused
      st.forEach((o, v) => o.pp && o.pp.addEventListener("click", () => { o.paused = !o.paused; o.pp.setAttribute("aria-pressed", String(o.paused)); sync(v); }));
    }
  }
  // the city that opens the portfolio: its word turns place → facade → brand once, when it is first seen
  const cityB = d.querySelector(".city-band");
  if (cityB) {
    if (reduced || !("IntersectionObserver" in window)) cityB.classList.add("in");
    else new IntersectionObserver((es, o) => { if (es.some((e) => e.isIntersecting)) { o.disconnect(); cityB.classList.add("in"); } }, { threshold: 0.45 }).observe(cityB);
  }
  // the wall of work under the hero (/onboarding/'s wall, site/onboarding/onb.js): the rows slide in opposite
  // directions with the scroll, each a little faster than the one above; with reduced motion they are plain
  // scrollable rows (site.css). On a touch screen the first tap on a card shows its name, the second opens it
  const pwall = d.querySelector(".pwall"), pwRows = pwall ? [...pwall.querySelectorAll(".pw-row:not(.pw-still)")] : [], pwStill = !!(pwall && pwall.classList.contains("f5")); // r450: a still wall (.f5) has no drifting rows, but keeps the loop (the CRT and the fold's own script hook on it)
  if (pwall) {
    pwall.addEventListener("click", (e) => {
      const a = e.target.closest("a.pw-case"); // r395: the murals (div.pw-mural) are no links: no name card, no tap
      if (!a || !matchMedia("(hover: none)").matches || a.classList.contains("show")) return;
      e.preventDefault(); pwall.querySelectorAll(".pw-case.show").forEach((x) => x.classList.remove("show")); a.classList.add("show");
    });
  }
  // the four numbers count up as they come into view (the real number is in the page from the start)
  const stats = d.querySelector(".stats");
  if (stats) {
    if (reduced || !("IntersectionObserver" in window)) stats.classList.add("in");
    else new IntersectionObserver((es, o) => {
      if (!es.some((e) => e.isIntersecting)) return;
      o.disconnect(); stats.classList.add("in");
      stats.querySelectorAll("b[data-n]").forEach((b, k) => {
        const n = +b.dataset.n, t0 = performance.now() + k * 110, T = 1300 + k * 120;
        b.textContent = "0";
        const step = (t) => { const p = Math.min(1, Math.max(0, (t - t0) / T)); b.textContent = String(Math.round(n * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.35 }).observe(stats);
  }
  // the crew comes in, one after another
  const crew = d.querySelector(".studio .crew");
  if (crew) {
    if (reduced || !("IntersectionObserver" in window)) crew.classList.add("in");
    else new IntersectionObserver((es, o) => { if (es.some((e) => e.isIntersecting)) { o.disconnect(); crew.classList.add("in"); } }, { rootMargin: "0px 0px -10% 0px" }).observe(crew);
  }
  // scroll-linked: the chapters' road fills (--rp) and each street's opening band opens and slides (--sp, 0 → 1)
  const road4 = d.querySelector("#what .chapters"), streets = [...d.querySelectorAll(".dom-street")], bands = [...d.querySelectorAll(".street-band")];
  // r360 (Daniel, 28 Oct: "una cu cea care se misca lent, pe designul actual, pe live"): the wall's rows also drift on
  // their own, very slowly (5.6 px/s, 3.5 on a phone since r362; each row a little faster than the one above, alternating as the
  // scroll does), on top of the scroll-linked offset. One rAF loop, only while the wall is on screen and the tab is
  // visible; transforms only, no layout read per frame (the scroll part and each row's width are read on scroll and
  // resize). A pointer on a cover or the keyboard inside a row holds that row. Nothing with reduced motion.
  // WALL.hooks: more per-frame work on the same loop (beta: the CRT curvature and glitches)
  const WALL = { base: 40, off: pwRows.map(() => 0), hold: pwRows.map(() => false), on: false, raf: 0, last: 0, hooks: [] };
  window.__czWall = WALL;
  const wallPaint = () => pwRows.forEach((row, i) => {
    const half = row._half; if (!half) return;
    const x = (WALL.base * (1 + i * 0.25) + WALL.off[i]) % half, tx = i % 2 ? x - half : -x;
    (WALL.x || (WALL.x = []))[i] = tx; // beta: the CRT wall reads where each row is
    row.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
  });
  if (!reduced && (pwRows.length || pwStill) && "IntersectionObserver" in window) {
    const v = matchMedia("(max-width: 700px)").matches ? 3.5 : 5.6; // r362 (Daniel: "poate fi mai lent"): 0.7x of r360
    const loop = (t) => {
      WALL.raf = 0;
      if (!WALL.on || d.hidden) { WALL.last = 0; return; }
      const dt = WALL.last ? Math.min(0.1, (t - WALL.last) / 1000) : 0; WALL.last = t;
      pwRows.forEach((r, i) => { if (!WALL.hold[i]) WALL.off[i] += v * dt * (1 + i * 0.1); });
      // beta (Daniel, 28 Oct: more covers pass as you scroll, "foaaarte sleek"): the scroll part glides after the
      // scroll, critically damped (about 0.1 of the way a frame at 60 fps, the same at any frame rate)
      if (WALL.tgt != null) { const k = 1 - Math.exp(-6.3 * dt), e = WALL.tgt - WALL.base; WALL.base = Math.abs(e) < 0.05 ? WALL.tgt : WALL.base + e * k; }
      wallPaint(); WALL.hooks.forEach((f) => f(t, dt));
      WALL.raf = requestAnimationFrame(loop);
    };
    WALL.go = () => { if (!WALL.raf && WALL.on && !d.hidden) WALL.raf = requestAnimationFrame(loop); };
    new IntersectionObserver((es) => { WALL.on = es[es.length - 1].isIntersecting; WALL.go(); }).observe(pwall);
    d.addEventListener("visibilitychange", WALL.go);
    pwRows.forEach((row, i) => {
      row.addEventListener("pointerover", (e) => { if (e.pointerType === "mouse" && e.target.closest("a.pw-case")) WALL.hold[i] = true; });
      row.addEventListener("pointerleave", () => { WALL.hold[i] = false; });
      row.addEventListener("focusin", () => { WALL.hold[i] = true; });
      row.addEventListener("focusout", () => { WALL.hold[i] = false; });
    });
  }
  if (!reduced && (road4 || streets.length || pwRows.length)) {
    let raf2 = 0;
    const clamp = (x) => Math.min(1, Math.max(0, x));
    const tick2 = () => {
      raf2 = 0;
      const vh = innerHeight;
      if (road4) { const r = road4.getBoundingClientRect(); if (r.top < vh && r.bottom > 0) road4.style.setProperty("--rp", clamp((vh * 0.9 - r.top) / (r.height + vh * 0.35)).toFixed(3)); }
      for (const el of streets) {
        const r = el.getBoundingClientRect();
        if (r.top > vh * 1.2 || r.top < -vh) continue;
        el.style.setProperty("--sp", clamp((vh * 1.02 - r.top) / (vh * 0.62)).toFixed(3));
      }
      // TASK-139: a street's band, 0 as its top meets the bottom of the screen, 1 as its bottom leaves the top
      for (const el of bands) {
        const r = el.getBoundingClientRect();
        if (r.top > vh || r.bottom < 0) continue;
        el.style.setProperty("--bp", clamp((vh - r.top) / (vh + r.height)).toFixed(4));
        // r359: the street's name fades before it reaches the header and the street switch (+32 px), never under them
        const c = el._cp || (el._cp = el.querySelector(".sb-copy"));
        if (c) { const hd = d.querySelector(".hdr"), sv = d.querySelector(".streets-nav"), sr = sv && sv.getBoundingClientRect(); const safe = Math.max(hd ? hd.getBoundingClientRect().bottom : 72, sr && sr.top < vh * 0.4 ? sr.bottom : 0) + 32; el.style.setProperty("--cf", clamp((c.getBoundingClientRect().top - safe) / 72).toFixed(3)); }
      }
      if (pwRows.length) {
        const r = pwall.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          // beta: 0.8 px a scrolled px (was 0.35, 2.3x), so each row brings in about two more covers across the fold;
          // the drift loop eases WALL.base to it (WALL.tgt); the first read lands at once
          WALL.tgt = (vh - r.top) * 0.8 + 40; if (!WALL.init || !WALL.raf) { WALL.init = 1; WALL.base = WALL.tgt; }
          pwRows.forEach((row) => { if (!row._half) row._half = row.scrollWidth / 2; });
          if (!WALL.raf) wallPaint();
        }
      }
    };
    const q2 = () => { if (!raf2) raf2 = requestAnimationFrame(tick2); };
    streets.forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) el.style.setProperty("--sp", "0"); });
    addEventListener("scroll", q2, { passive: true }); addEventListener("resize", () => { pwRows.forEach((r) => { r._half = 0; }); q2(); }); tick2();
  }
  // beta (Daniel, 29 Oct, after getlayers.ai's "AI Studio" layer): the four service cards assemble as you scroll from the
  // wall into them, one take. Each card starts scattered (in depth and turned on desktop, lower and tilted on phones),
  // and its pose follows the scroll through a critically damped spring, so it glides and settles, never snaps. No
  // pinning, no hijack: the page scrolls as always. Transforms and opacity only (no CLS); the loop runs only while the
  // grid is near the screen and stops when the springs settle. Nothing with reduced motion (the cards stay as they are).
  // r388 (Daniel: the cards "don't have the entry animation"; measured at 1440x900, they had landed while the grid's top
  // was still ~600 px down, so the whole take ran at the bottom edge or below the fold): the take is timed on the
  // screen, per row of cards. It starts as the row's top comes up past 95% of the screen's height and is complete when
  // it reaches 37.5% (desktop: the row is the grid, its top; phones, one card per row: each card's own top). Inside that
  // window the cards of a row land one after the other (each gets 64% of it, starting 12% apart), the pills last, once
  // a card is home. More presence than r379: deeper and further out at the start. Time fallback: when the target jumps
  // while the grid is on screen (an anchor link, a refresh restored mid-page, a fast flick), the cards play one ~700 ms
  // settle from where they are, staggered, instead of appearing done; while the grid is off screen they simply take
  // their pose. The first card's slot is the row reference, so the transformed cards are never measured.
  const asm = d.querySelector("#what .chapters"), asmCards = asm ? [...asm.querySelectorAll(".chap")] : [];
  if (asm && asmCards.length && !reduced && "IntersectionObserver" in window) {
    const phone = matchMedia("(max-width: 700px)");
    // scattered poses: [x px, y px, z px, rotateX, rotateY, rotateZ] (desktop); phones use only y and rotateZ
    const POSE = [[-190, 260, -760, 22, 28, -10], [-60, 380, -980, 26, 10, 7], [70, 340, -860, 24, -12, -6], [210, 240, -700, 20, -30, 11]];
    const S = asmCards.map(() => ({ x: 0, v: 0, rel: 0, col: 0, n: 1, tw: null }));
    const START = 0.95, END = 0.375, STEP = 0.12, SETTLE = 700, JUMP = 0.35;
    let on = false, raf = 0, last = 0, first = false; // first: a relayout (resize) just takes the pose
    const slots = () => {
      const tops = asmCards.map((c) => c.offsetTop), t0 = tops[0], rows = {};
      asmCards.forEach((c, i) => { S[i].rel = tops[i] - t0; S[i].col = rows[tops[i]] = (rows[tops[i]] ?? -1) + 1; });
      asmCards.forEach((c, i) => { S[i].n = rows[tops[i]] + 1; });
    };
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const paint = (c, s, i) => {
      const x = Math.min(1, Math.max(0, s.x)), k = 1 - ease(x), P = POSE[i % POSE.length], o = Math.min(1, x / 0.35);
      if (k < 0.0005) { if (c._asm !== 0) { c.style.transform = ""; c.style.opacity = ""; c._asm = 0; } }
      else {
        c._asm = 1;
        c.style.transform = phone.matches
          ? `translate3d(0,${(110 * k).toFixed(1)}px,0) rotate(${(P[5] * 0.55 * k).toFixed(2)}deg) scale(${(1 - 0.08 * k).toFixed(4)})`
          : `translate3d(${(P[0] * k).toFixed(1)}px,${(P[1] * k).toFixed(1)}px,${(P[2] * k).toFixed(1)}px) rotateX(${(P[3] * k).toFixed(2)}deg) rotateY(${(P[4] * k).toFixed(2)}deg) rotateZ(${(P[5] * k).toFixed(2)}deg)`;
        c.style.opacity = o.toFixed(3);
      }
      const land = s.x > 0.94 ? true : s.x < 0.55 ? false : !!s.landed; // hysteresis: pills do not flicker at the edge
      if (land !== !!s.landed) { s.landed = land; c.classList.toggle("landed", land); }
    };
    const frame = (t) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      const vh = innerHeight, r = asm.getBoundingClientRect(), g = r.top, seen = r.bottom > 0 && r.top < vh;
      const W = phone.matches ? 9 : 7.5; // spring stiffness (rad/s): critically damped, settles in about half a second after the scroll stops
      let busy = false;
      asmCards.forEach((c, i) => {
        const s = S[i], p = (vh * START - (g + s.rel)) / (vh * (START - END)), span = 1 - (s.n - 1) * STEP;
        const tgt = Math.min(1, Math.max(0, (p - s.col * STEP) / span));
        if (first || !seen) { s.x = tgt; s.v = 0; s.tw = null; } // off screen (or a relayout): just take the pose
        else if (!s.tw && tgt - s.x > JUMP) s.tw = { t0: t + (s.n > 1 ? s.col : i) * 60, from: s.x }; // a jump in view: the timed settle
        if (s.tw && seen && !first) {
          const u = Math.min(1, Math.max(0, (t - s.tw.t0) / (SETTLE - 3 * 60)));
          s.x = s.tw.from + (tgt - s.tw.from) * ease(u); s.v = 0;
          if (u >= 1) s.tw = null; else busy = true;
        } else if (!first && seen && dt > 0) {
          const a = W * W * (tgt - s.x) - 2 * W * s.v; s.v += a * dt; s.x += s.v * dt;
          if (Math.abs(tgt - s.x) < 0.0008 && Math.abs(s.v) < 0.002) { s.x = tgt; s.v = 0; } else busy = true;
        } else if (seen && s.x !== tgt) busy = true; // the loop just woke: integrate from the next frame, never snap
        paint(c, s, i);
      });
      first = false;
      if (busy && on && !d.hidden) raf = requestAnimationFrame(frame); else last = 0;
    };
    const go = () => { if (!raf && on && !d.hidden) raf = requestAnimationFrame(frame); };
    slots();
    asm.classList.add("asm");
    new IntersectionObserver((es) => { on = es[es.length - 1].isIntersecting; if (on) go(); }, { rootMargin: "25% 0px 25% 0px" }).observe(asm);
    addEventListener("scroll", go, { passive: true });
    addEventListener("resize", () => { slots(); first = true; go(); });
    d.addEventListener("visibilitychange", go);
    frame(performance.now()); // the first pose: off screen it is just taken; already on screen, it plays the settle
  }
  // r391 (Daniel: "the service cards should get their colour on mobile too as you pass over them, when they're in the
  // middle area of the screen, because we have no hover"): on a touch screen the card whose centre is in the middle band
  // of the screen (35-65% of its height) takes the hover colour (.lit), one at a time, the one nearest the middle. The
  // observer's band (rootMargin) wakes the check; while a card touches the band the scroll re-checks it, once a frame.
  // With the assemble running, a card colours only once it has landed (its .landed class, watched).
  const touch = matchMedia("(hover: none), (pointer: coarse)");
  if (asm && asmCards.length && touch.matches && "IntersectionObserver" in window) {
    const near = new Set();
    let litRaf = 0, lit = null;
    const pick = () => {
      litRaf = 0;
      const vh = innerHeight, assembling = asm.classList.contains("asm");
      let best = null, bd = Infinity;
      near.forEach((c) => {
        if (assembling && !c.classList.contains("landed")) return;
        const r = c.getBoundingClientRect(), cy = (r.top + r.bottom) / 2;
        if (cy < vh * 0.35 || cy > vh * 0.65) return;
        const dd = Math.abs(cy - vh / 2); if (dd < bd) { bd = dd; best = c; }
      });
      if (best !== lit) { if (lit) lit.classList.remove("lit"); if (best) best.classList.add("lit"); lit = best; }
    };
    const q = () => { if (!litRaf && (near.size || lit)) litRaf = requestAnimationFrame(pick); };
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) near.add(e.target); else near.delete(e.target); }); q(); }, { rootMargin: "-35% 0px -35% 0px" });
    asmCards.forEach((c) => io.observe(c));
    addEventListener("scroll", q, { passive: true });
    addEventListener("resize", q);
    new MutationObserver((ms) => { if (ms.some((m) => m.target.classList.contains("landed") !== (m.oldValue || "").split(" ").includes("landed"))) q(); })
      .observe(asm, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
  }
  // cards tilt a little towards the pointer (TASK-139: the chapters have their own hover now)
  if (matchMedia("(hover: hover)").matches && !reduced) d.querySelectorAll(".svc").forEach((c) => {
    c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; c.style.transform = `perspective(700px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`; });
    c.addEventListener("pointerleave", () => { c.style.transform = ""; });
  });

  // r450s (Daniel, 10 Nov: "mult mai mult ux ... illustrations si ceva mai multe interactiuni si microinteractiuni"): the home's
  // five services. One stop open at a time beside the list on a wide screen (pointing at a head, focusing it or the
  // arrow keys change the stage); under 1000 px all five are open (r454, below). A drawing plays when its stop opens, when the section comes into view, and when pointed at or
  // tapped. "Start a project" ticks the stop's own dream on the boarding pass on its way there. No timers hold anything.
  const sv = d.querySelector(".sv5-list");
  if (sv) {
    const cards = [...sv.children], wide = matchMedia("(min-width: 1000px)");
    const play = (c) => { const a = c.querySelector(".sv5-art"); if (!a || reduced) return; a.classList.remove("play"); void a.offsetWidth; a.classList.add("play"); };
    const set = (c, on) => { c.classList.toggle("on", on); c.querySelector("button").setAttribute("aria-expanded", String(on)); };
    const open = (c) => {
      if (c.classList.contains("on")) return;
      const h = c.firstElementChild, y = h.getBoundingClientRect().top;
      cards.forEach((x) => set(x, x === c));
      const dy = wide.matches ? 0 : h.getBoundingClientRect().top - y;
      if (dy) scrollBy({ top: dy, behavior: "instant" });
      play(c);
    };
    let aim = 0;
    sv.addEventListener("click", (e) => {
      const c = e.target.closest(".sv5-card"); if (!c) return;
      if (e.target.closest("button")) { if (wide.matches) open(c); return; } // r454: under 1000 px every stop is open, the head is only a title
      if (e.target.closest(".sv5-art")) return play(c);
      const s = e.target.closest(".sv5-start"), chip = s && d.querySelector('#czp-form .czp-chip[data-v="' + s.dataset.dream + '"]');
      if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
    });
    sv.addEventListener("keydown", (e) => {
      const i = cards.indexOf(e.target.closest("button")?.closest(".sv5-card")), n = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : -1;
      if (i < 0 || !cards[n]) return;
      e.preventDefault(); cards[n].querySelector("button").focus();
    });
    cards.forEach((c) => {
      const h = c.firstElementChild;
      h.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && wide.matches) { clearTimeout(aim); aim = setTimeout(() => open(c), 60); } }); // 60 ms: crossing a head on the way to the stage does not change it
      h.addEventListener("pointerleave", () => clearTimeout(aim));
      h.addEventListener("focusin", (e) => { if (wide.matches && e.target.matches(":focus-visible")) open(c); });
      c.querySelector(".sv5-art")?.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") play(c); });
    });
    // r454 (Daniel, 10 Nov: "cardurile de jos ar putea să fie direct deschise ... să nu mai ai butonul de închis/deschis, dar să
    // aibă o intrare interesantă"): under 1000 px all five stops are open, no plus, no toggling; each one comes in as it reaches
    // the screen (its dot lands, the card rises, then its own drawing plays). The wide stage keeps its hover (approved, 10 Nov).
    const lay = () => { if (wide.matches) { if (sv.querySelectorAll(".on").length !== 1) cards.forEach((x, k) => set(x, !k)); } else cards.forEach((x) => set(x, true)); cards.forEach((x) => { const b = x.querySelector("button"); if (wide.matches) b.removeAttribute("tabindex"); else b.tabIndex = -1; }); }; // a head that does nothing is not a tab stop
    lay(); wide.addEventListener("change", lay);
    if (!reduced && "IntersectionObserver" in window) {
      const vh = innerHeight, io2 = new IntersectionObserver((es) => es.forEach((x) => { if (!x.isIntersecting) return; io2.unobserve(x.target); x.target.classList.add("in"); if (!wide.matches) play(x.target); }), { rootMargin: "0px 0px -12% 0px" });
      cards.forEach((c) => { if (c.getBoundingClientRect().top > vh * 0.88) { c.classList.add("rv"); io2.observe(c); } }); // a card already on screen is never hidden
    }
    if ("IntersectionObserver" in window && wide.matches) { const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); const c = sv.querySelector(".on"); if (c) play(c); } }, { threshold: 0.3 }); io.observe(sv); }
  }

  // YouTube: a poster until clicked, then the privacy-friendly embed
  d.querySelectorAll(".yt").forEach((y) => y.querySelector(".yt-play")?.addEventListener("click", () => {
    if (window.__ytPlay && y.hasAttribute("data-yt")) return; // r138d: the build's chromeless player takes it (build/film.mjs)
    y.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${y.dataset.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${RO ? "Filmul Two Minutes" : "Two Minutes film"}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }));

  // r359: the boarding pass has its own script now (build/boarding.mjs)
})();

// BETA, CRT v3 (Daniel, 28 Oct: "calculează exact cum ar arăta prin tub CRT"; his picks: the 80s look, clearly curved
// spherical tubes, and a wall of many small sets). Every cover is its own convex 80s tube in a flat bezel; the rig faces
// you flat (no card is turned any more), and the one shared perspective comes from the optics: each tube is ray-traced
// from one eye in front of the middle of the screen, so the domes, their bulge and the window's reflection on the glass
// shift together across the rig. WebGL2, on the drift's own frame loop (window.__czWall.hooks: nothing off screen or in
// a hidden tab). The maths (~/cromatic-ops/refs/wall-crt/crt-research.md): a sphere of radius R = 0.85 x the screen's
// diagonal through the screen's corners; the eye ray meets it; the picture is laid on the glass by arc length (as
// crt-geom does), so straight lines bow and the middle swells; rounded raster corners, a strong edge falloff (glass
// thickening to the rim), Gaussian scanlines that widen on bright parts, a fine mask on 2x screens, halation, a touch
// of misconvergence, a bezel shadow and one soft specular window. The DOM covers stay where they are, above the canvas,
// transparent: links, focus, the hover name and the first-tap name work as before, and because every set's bezel IS its
// DOM box (the bulge lives inside it) a pointer always lands on the set it is over. The h1 and the link stay flat above.
// Every 6-10 s ONE visible screen loses its signal (snow, a drop, the horizontal hold slipping, the picture rolling),
// now in the shader. No WebGL2, reduced motion, a lost context: the flat wall (A). ?glitch=1 (or ?glitch=snow,roll)
// glitches at once and often; ?crt=R,d tries other radii and distances (both in diagonals).
// r382 (Mira's audit: on software GL, SwiftShader, the wall took the whole main thread, 260 long tasks, 12.6 fps): the
// context is asked with failIfMajorPerformanceCaveat, so a browser without a real GPU says no and keeps the flat wall;
// the canvas is drawn at 1.5x at most; phones keep 384 x 260 textures (desktop 560 x 380), each cover scaled to it
// from whichever file the browser chose (the covers have a srcset now); and when the CRT stops (a lost context, a
// failed link) its hook leaves the wall's loop and its listeners go, so nothing of it runs any more.
(function () {
  var W = window.__czWall, wall = document.querySelector(".pwall.pw-first");
  if (!W || !W.go || !wall || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var cv = document.createElement("canvas"), gl = null;
  try { gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: true, powerPreference: "low-power" }); } catch (e) {}
  if (!gl) { document.documentElement.classList.remove("crt-w"); return; } // r451: no tubes after all: the flat sets switch themselves on (site.css)
  var phone = matchMedia("(max-width: 700px)").matches, Q = new URLSearchParams(location.search);
  var geo = (Q.get("crt") || "").split(",").map(Number), RK = geo[0] > 0.3 ? geo[0] : 0.85, DK = geo[1] > 0.5 ? geo[1] : 2.0;
  var TW = phone ? 384 : 560, TH = phone ? 260 : 380, TL = Math.floor(Math.log2(TW)) + 1, up2d = null;
  var DPR = Math.min(devicePixelRatio || 1, 1.5), PITCH = Math.max(3, 3 * (devicePixelRatio || 1) / DPR), BEZ = phone ? 3 : 8, RAD = phone ? 7 : 12;
  cv.className = "pw-gl"; cv.setAttribute("aria-hidden", "true");
  var VS = "#version 300 es\nlayout(location=0) in vec2 aC;layout(location=1) in vec4 iBox;layout(location=2) in vec4 iA;layout(location=3) in vec4 iG;layout(location=4) in vec4 iM;layout(location=5) in vec4 iU;layout(location=6) in vec4 iX;uniform vec2 uRes;out vec2 vP;flat out vec4 vBox,vA,vG,vM,vU,vX;void main(){vec2 p=iBox.xy+aC*iBox.zw;vP=(aC-.5)*iBox.zw;vBox=iBox;vA=iA;vG=iG;vM=iM;vU=iU;vX=iX;gl_Position=vec4(p/uRes*2.-1.,0.,1.);gl_Position.y=-gl_Position.y;}";
  var FS = "#version 300 es\nprecision highp float;precision highp sampler2DArray;uniform sampler2DArray uT;uniform sampler2D uB;uniform float uPitch,uDpr,uBez,uRad,uRk,uDk,uSeed,uMask,uTime,uLimS,uLimK,uGain;uniform vec4 uLim;in vec2 vP;flat in vec4 vBox,vA,vG,vM,vU,vX;out vec4 o;" +
    "float rr(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}" +
    "float h1(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}" +
    // r450: each set reads a window (vU) of its picture; vM.w = 1 reads the one big picture (uB) instead of its own layer
    "vec3 tb(vec2 u,float l){vec2 w=vU.xy+clamp(u,.001,.999)*vU.zw;return vM.w>.5?textureLod(uB,w,l).rgb:textureLod(uT,vec3(w,vA.x),l).rgb;}vec3 tx(vec2 u){return tb(u,0.);}" +
    "void main(){vec2 hf=vBox.zw*.5;float aa=1./uDpr;" +
    // the set: a flat bezel with rounded corners; outside it nothing
    "float so=rr(vP,hf,uRad);float al=1.-smoothstep(-aa,aa,so);if(al<=0.){discard;}" +
    "float dg=2.*length(hf-uBez);vec2 ab=(hf-uBez)/dg,P=vP/dg;float R=uRk,dE=uDk,zc=-sqrt(max(R*R-dot(ab,ab),1e-4));" +
    // the face swells towards you in the middle of each edge: shrink it so that swell (and the eye's slant) stays inside the bezel
    "vec2 ze=sqrt(R*R-ab*ab)+zc;ab*=(dE-ze)/dE*(1.-1.6*length(vA.zw)*(ze.x+ze.y));zc=-sqrt(max(R*R-dot(ab,ab),1e-4));" +
    // the eye (shared direction, vA.zw = lateral offset per unit of depth) and the ray through this pixel
    "vec3 E=vec3(vA.zw*dE,dE),dir=normalize(vec3(P,0.)-E),oc=E-vec3(0.,0.,zc);float b=dot(oc,dir),a2=dot(dir,dir),c=dot(oc,oc)-R*R,ds=b*b-c;" +
    "vec3 S=E+dir*(-b-sqrt(max(ds,0.))),n=(S-vec3(0.,0.,zc))/R;" +
    // arc length on the glass: the corners of the raster sit on the corners of the opening
    "float al0=acos(clamp(n.z,-1.,1.));vec2 q=R*al0*n.xy/max(length(n.xy),1e-5);float sc=R*acos(-zc/R)/length(ab);vec2 AB=ab*sc;vec2 f=q/AB;" +
    "float rc=.15*2.*AB.y,sd=rr(q,AB,rc);" +
    // the plastic: warm black, a little lighter at the top, a hairline catching the light on its top edge
    "vec3 pl=mix(vec3(.135,.128,.112),vec3(.07,.066,.058),clamp(vP.y/vBox.w+.5,0.,1.));pl+=.05*(1.-smoothstep(0.,1.5,-so))*step(vP.y,-hf.y+3.);" +
    "float px=1./(sc*dg);if(sd>0.){vec3 cc=sd<1.6*px?vec3(.02):pl;o=vec4(cc*al,al);return;}" +
    "vec2 ras=f*.5+.5,uv=ras;float hov=vA.y,ty=vG.x,p=vG.y,s=vG.z,bl=vG.w,yy=vM.x,ln=max(60.,floor(vBox.w*uDpr/uPitch));" +
    "uv=(uv-.5)/(1.+.05*hov)+.5;" +
    // r451: the set switching on (vX.y, 0 off to 1 on): a white line that opens into the picture
    "float pw=vX.y,pon=1.;if(pw<.999){float hh=max(.014,pw*pw*(3.-2.*pw)),ww=min(1.,.12+pw*3.2);vec2 dq=abs(ras-.5)*2.;pon=step(dq.y,hh)*step(dq.x,ww)*step(.001,pw);uv=vec2((uv.x-.5)/ww+.5,(uv.y-.5)/hh+.5);}" +
    // the glitches (1 snow, 2 drop, 3 the horizontal hold, 4 the vertical roll)
    "float nz=0.,vbi=0.,bar=0.;" +
    "if(ty>2.5&&ty<3.5){float nb=5.,bd=floor(clamp(ras.y+.04*sin(uTime*11.+ras.y*9.+vM.y),0.,.999)*nb),sg=mod(bd,2.)*2.-1.,bc=(bd+.5)/nb;uv.x+=sg*s*(10.+14.*sin(bd*2.1+vM.y))/(2.*AB.x*dg)+sg*s*.1*(ras.y-bc);float yb=p*1.3-.2;bar=s*.6*exp(-pow((ras.y-yb)/.06,2.));}" +
    "if(ty>3.5){float y=ras.y+yy*1.06;y=mod(y,1.06);if(y>1.){vbi=1.;}uv.y=y;}" +
    "vec2 mc=f*.0011;vec3 col=vec3(tx(uv+mc).r,tx(uv).g,tx(uv-mc).b);" +
    // halation: the glass scatters the bright parts into a soft glow around them
    "vec3 hl=.5*tb(uv,3.5)+.5*tb(uv,5.);" +
    "col=mix(col,tb(uv,1.6),.12);col+=.09*hl*hl;float lu=dot(col,vec3(.299,.587,.114)),la=dot(hl,vec3(.299,.587,.114));" +
    "if(ty>.5){float fl=.88+.24*h1(vec2(uSeed,7.));vec3 pc=col;float br=1.-.15*s+.32*bl,ct=1.-.25*s+.08*bl,st=1.-.5*s;" +
    " if(ty>1.5&&ty<2.5){float dk=min(1.,s*1.15);br=1.-.82*dk+.4*bl;st=1.-.9*dk;ct=1.-.3*dk;}" +
    " pc=(pc-.5)*ct+.5;pc*=br;pc=mix(vec3(dot(pc,vec3(.299,.587,.114))),pc,st);" +
    " float lnn=floor(ras.y*ln*2.),sm=h1(vec2(lnn,uSeed*13.1));nz=mix(sm,h1(vec2(floor(gl_FragCoord.x/(1.5*uDpr)),lnn+uSeed*71.)),.6)*(.7+.6*h1(vec2(lnn*.37,uSeed)));" +
    " float ns=(.45+la*1.1);float amt=ty<1.5?min(1.,s*1.05)*.92*fl:ty<2.5?.32*min(1.,s*1.15)*fl:(ty<3.5?.12:.1)*s*fl;" +
    " col=ty>1.5&&ty<2.5?pc+vec3(nz*ns)*amt:mix(pc,vec3(nz*ns),amt);col+=bar;}" +
    "if(vbi>.5){float m=(mod(ras.y+yy*1.06,1.06)-1.)/.06;col=vec3(.04)+vec3(.22)*exp(-pow((m-.5)/.12,2.));}" +
    // the hover: the picture leans in a little, its bottom darkens under the name
    "col*=1.-hov*.68*smoothstep(.42,1.02,ras.y);" +
    "col*=uGain*vX.x;if(pw<.999){col=mix(vec3(1.,.98,.92),col,smoothstep(.12,.85,pw))*pon*(1.+1.1*(1.-pw));}" +
    // scanlines: a Gaussian beam that widens where the picture is bright
    "float Y=ras.y*ln,fw=fwidth(Y),sgm=mix(.24,.42,clamp(lu,0.,1.)),bw=0.;for(int i=-2;i<=2;i++){float fy=fract(Y+fw*.2*float(i))-.5;bw+=exp(-.5*fy*fy/(sgm*sgm));}bw/=5.;float mn=sgm*2.5066*.95;col*=mix(1.,bw/mn,.42*(1.-smoothstep(.3,.55,fw)));" +
    // the mask (only where there are pixels enough for it): an aperture of three phosphor stripes
    "if(uMask>.5){float m=mod(floor(gl_FragCoord.x),3.);col*=mix(vec3(1.),vec3(m<.5?1.08:.84,m>.5&&m<1.5?1.08:.84,m>1.5?1.08:.84),.7);}" +
    // edge falloff: the glass thickens to the rim and the beam lands at a slant there
    "float e=(1.-.85*f.x*f.x)*(1.-.85*f.y*f.y);col*=.42+.58*pow(clamp(e,0.,1.),.6);" +
    // the bezel's shadow on the glass, deeper under the top edge
    "float sh=rr(q-vec2(0.,.022*AB.y),AB,rc);col*=mix(.3,1.,smoothstep(0.,7.*px,-sh));" +
    // the glass: the room's dim reflection (the black of an 80s screen is a grey) and one soft window up on the left
    "vec3 V=normalize(E-S),Rf=reflect(-V,n);float sp=dot(Rf,normalize(vec3(-.42,-.62,1.)));col+=vec3(.03,.032,.03)+vec3(1.,.99,.96)*(smoothstep(.95,.995,sp)*.13+pow(max(sp,0.),6.)*.07);" +
    // r408, the limiter behind the h1: only what is brighter than the knee comes down (hue kept, a soft shoulder), so a bright set goes to a mid tone with its picture still there and a dark set is not touched
    "vec2 ld=abs(vBox.xy+vP+hf-uLim.xy)-uLim.zw;float lm=uLimK*(1.-smoothstep(0.,uLimS,length(max(ld,0.))));if(lm>.002){float yy0=dot(col,vec3(.2126,.7152,.0722));if(yy0>.3){float yy1=.3+.26*(1.-exp(-(yy0-.3)/.26));col*=mix(1.,yy1/yy0,lm);}}" +
    "float ed=smoothstep(0.,aa*1.5*px,-sd);col=mix(vec3(.02),col,ed);o=vec4(clamp(col,0.,1.)*al,al);}";
  var mk = function (t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  var prog = gl.createProgram(), vs = mk(gl.VERTEX_SHADER, VS), fs = mk(gl.FRAGMENT_SHADER, FS);
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  var PAR = gl.getExtension("KHR_parallel_shader_compile"), ready = false, dead = false, U = {};
  // the covers: one layer each in a texture array, uploaded from the wall's own <img> once it is loaded and decoded
  var rowsEl = wall.querySelector(".pw-rows"), rows = [].slice.call(wall.querySelectorAll(".pw-row")), cards = [], layers = {}, NL = 0, queue = [];
  rows.forEach(function (row, i) { [].forEach.call(row.querySelectorAll(".pw-case"), function (el) { var k = el.getAttribute("href") || el.getAttribute("data-k"); if (!(k in layers)) layers[k] = { i: NL++, up: 0, cards: [] }; var L = layers[k]; var c = { el: el, img: el.querySelector("img"), row: i, L: L, hov: 0, p: el.getAttribute("data-p"), big: 0, uv: [0, 0, 1, 1], s: 1, ox: 0, oy: 0, gn: 1, pw: 1 }; L.cards.push(c); cards.push(c); }); });
  var host = wall.querySelector(".f5-wall") || wall, PAD = host === wall ? 0 : 28, PL = PAD, PR = PAD, HX = 0, HW = 1, NF = 24; // r454: the canvas spans the fold's whole width (PL/PR), so a slid row is never cut by its edge
  var tex = null, inst = new Float32Array(cards.length * NF), big = null, CC = { scale: 1, gain: 1 }, ibuf = null, vao = null;
  var offs = [], on = function (el, k, f, o) { el.addEventListener(k, f, o); offs.push(function () { el.removeEventListener(k, f, o); }); };
  var lost = function () { if (dead) return; dead = true; document.documentElement.classList.remove("crt-w"); wall.classList.remove("crt3"); cv.remove(); setTimeout(function () { var i = W.hooks.indexOf(frame); if (i >= 0) W.hooks.splice(i, 1); }, 0); offs.forEach(function (f) { f(); }); offs = []; queue = []; window.__czCrt = null; };
  cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); lost(); });
  var setup = function () {
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { lost(); return; }
    gl.useProgram(prog); ["uRes", "uT", "uPitch", "uDpr", "uBez", "uRad", "uRk", "uDk", "uSeed", "uMask", "uTime", "uLim", "uLimS", "uLimK", "uB", "uGain"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, TL, gl.RGBA8, TW, TH, NL); // mips: the halation reads the blurred levels
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    ibuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW);
    for (var a = 1; a <= 6; a++) { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 4, gl.FLOAT, false, NF * 4, (a - 1) * 16); gl.vertexAttribDivisor(a, 1); }
    big = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, big); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([13, 12, 9, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.generateMipmap(gl.TEXTURE_2D); gl.activeTexture(gl.TEXTURE0); gl.uniform1i(U.uB, 1);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(U.uT, 0); gl.uniform1f(U.uDpr, DPR); gl.uniform1f(U.uPitch, PITCH); gl.uniform1f(U.uBez, BEZ); gl.uniform1f(U.uRad, RAD); gl.uniform1f(U.uRk, RK); gl.uniform1f(U.uDk, DK); gl.uniform1f(U.uMask, DPR >= 1.9 ? 1 : 0);
    host.insertBefore(cv, host.firstChild); wall.classList.add("crt3"); measure(); ready = true;
    cards.forEach(function (c) { if (c.img && !c.L.dec) { var go = function () { if (c.L.dec) return; c.L.dec = 1; (c.img.decode ? c.img.decode() : Promise.resolve()).then(function () { queue.push(c); }, function () { c.L.dec = 0; }); }; if (c.img.complete && c.img.naturalWidth) go(); else c.img.addEventListener("load", go, { once: true }); } });
  };
  // where everything is (on resize only): each set's box in the wall, without its row's current drift
  var nudge = function (el) { var tr = getComputedStyle(el).translate, p = tr && tr !== "none" ? tr.split(" ") : []; return [parseFloat(p[0]) || 0, parseFloat(p[1]) || 0]; };
  var vw = 1, wh = 1, secTop = 0, D = 1, lim = null, limK = 0, gen = 0, hTop = 0, mw = 0, mh = 0, chk = 0, heal = 0, measure = function () { gen++;
    var r0 = host.getBoundingClientRect(), wr = wall.getBoundingClientRect(); if (PAD) { PL = Math.max(PAD, r0.left - wr.left); PR = Math.max(PAD, wr.right - r0.right); cv.style.left = -PL + "px"; cv.style.width = r0.width + PL + PR + "px"; }
    var r = { left: r0.left - PL, top: r0.top - PAD, width: r0.width + PL + PR, height: r0.height + 2 * PAD }, X = W.x || []; vw = r.width; HX = PL + r0.width / 2; HW = r0.width / 2 + PAD; wh = r.height; secTop = r.top + scrollY; D = innerWidth * (phone ? 4 : 1.8);
    cv.width = Math.round(vw * DPR); cv.height = Math.round(wh * DPR);
    var h1 = /* r449: the h1 sits on its own ink plate, nothing behind it to limit */ wall.classList.contains("f5") ? null : wall.querySelector(".pw-h"); if (h1) { var fs = parseFloat(getComputedStyle(h1).fontSize) || 60; lim = [h1.offsetLeft + h1.offsetWidth / 2, h1.offsetTop + h1.offsetHeight / 2, h1.offsetWidth / 2, h1.offsetHeight / 2 + fs * 0.04, fs * 1.1]; wall.style.setProperty("--pwl", h1.offsetLeft + "px"); wall.style.setProperty("--pwt", h1.offsetTop + "px"); wall.style.setProperty("--pww", h1.offsetWidth + "px"); wall.style.setProperty("--pwh", h1.offsetHeight + "px"); wall.style.setProperty("--pwf", fs + "px"); }
    // r467 (Daniel, 11 Nov: the TVs came back "defazat" after a scroll away and back): the nudge taken off is the one the box
    // really has now (its computed translate), not the one asked for in its style: a set that is not on the GPU yet still
    // eased its translate (.45 s with an overshoot), so a measure in that window kept its tube off its box for good
    cards.forEach(function (c) { var b = c.el.getBoundingClientRect(), nt = b.width ? nudge(c.el) : [0, 0]; c.x = b.left - r.left - (X[c.row] || 0) - nt[0]; /* r454: without the heart's forming nudge */ c.y = b.top - r.top - nt[1]; c.w = b.width; c.h = b.height; });
    mw = r0.width; mh = r0.height; chk = 0;
    if (ready || gl.isProgram(prog)) { gl.viewport(0, 0, cv.width, cv.height); }
  };
  var rz = 0; on(window, "resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (ready && !dead) measure(); }, 150); });
  on(window, "load", function () { if (ready && !dead) measure(); });
  // r467: and on whatever else lays the fold out again without a window resize (fonts, a scrollbar, a restored page)
  on(window, "pageshow", function () { if (ready && !dead) measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (ready && !dead) measure(); });
  if (window.ResizeObserver) { var ro = new ResizeObserver(function () { if (ready && !dead) measure(); }); ro.observe(host); offs.push(function () { ro.disconnect(); }); }
  // the pointer and the keyboard: the set under them leans in (the DOM decides which one, so it is always the right one)
  var over = null, focus = null;
  on(wall, "pointerover", function (e) { over = e.target.closest && e.target.closest("a.pw-case"); /* r395: never a mural */ if (live && live.c.el === over) live = null; });
  on(wall, "pointerleave", function () { over = null; });
  on(wall, "focusin", function (e) { focus = e.target.closest && e.target.closest("a.pw-case"); });
  on(wall, "focusout", function () { focus = null; });
  // the glitches: when, which screen, how the signal goes (a fast loss, a sustain where the tuner fights back, the recovery with a bloom)
  var TYPES = ["snow", "drop", "hsync", "roll"], TID = { snow: 1, drop: 2, hsync: 3, roll: 4 }, DUR = { snow: [520, 900], drop: [620, 950], hsync: [380, 760], roll: [700, 980] };
  var gq = Q.get("glitch"), DEBUG = gq != null, FORCE = gq && gq !== "1" ? gq.split(",").filter(function (x) { return TID[x]; }) : null;
  if (FORCE && !FORCE.length) FORCE = null;
  var live = null, last = null, lastType = "", next = 0;
  var sig = function (p, g) { if (p < 0.12) { var a = p / 0.12; return a * a * (3 - 2 * a); } if (p < 0.7) return 0.78 + 0.22 * Math.sin(p * g.f1) * Math.sin(p * g.f2 + 1.3); var r = (p - 0.7) / 0.3; return 1 - r * r * (3 - 2 * r); };
  var bloom = function (p) { return p < 0.7 ? 0 : Math.sin(Math.PI * Math.min(1, (p - 0.7) / 0.3)) * Math.exp(-2.2 * (p - 0.7) / 0.3); };
  var rollY = function (p) { var y = Math.min(1, Math.max(0, (p - 0.06) / 0.8)); return y < 0.75 ? 1.03 * Math.pow(y / 0.75, 2.2) : 1 + 0.03 * Math.cos(Math.PI * 1.5 * (y - 0.75) / 0.25) * Math.exp(-4 * (y - 0.75) / 0.25); };
  var fire = function (t) {
    var vis = cards.filter(function (c) { return c.on && Math.abs(c.nx) < 0.8 && c.el !== over && c.el !== focus && c !== last && c.L.up; });
    if (!vis.length) return;
    var c = vis[Math.floor(Math.random() * vis.length)], all = FORCE || TYPES, pool = all.filter(function (x) { return x !== lastType || all.length === 1; }), type = pool[Math.floor(Math.random() * pool.length)], R = DUR[type];
    last = c; lastType = type; live = { c: c, type: TID[type], t0: t, dur: R[0] + Math.random() * (R[1] - R[0]), f1: 22 + Math.random() * 18, f2: 41 + Math.random() * 30, ph: Math.random() * 6 };
  };
  var frame = function (t, dt) {
    if (dead) return;
    if (!ready) { if (!PAR || gl.getProgramParameter(prog, PAR.COMPLETION_STATUS_KHR)) setup(); return; }
    // at most two covers a frame go up to the GPU (each one TW x TH copy, scaled from the file the browser chose)
    var upd = 0;
    for (var u = 0; u < 2 && queue.length; u++) { var c0 = queue.shift(); if (c0.L.up) continue; try { if (!up2d) { up2d = document.createElement("canvas"); up2d.width = TW; up2d.height = TH; up2d.x = up2d.getContext("2d"); up2d.x.imageSmoothingQuality = "high"; } up2d.x.clearRect(0, 0, TW, TH); up2d.x.drawImage(c0.img, 0, 0, TW, TH); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex); gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, c0.L.i, TW, TH, 1, gl.RGBA, gl.UNSIGNED_BYTE, up2d); c0.L.up = 1; upd = 1; c0.L.cards.forEach(function (x) { x.el.classList.add("crt-ready"); }); } catch (e) {} }
    if (upd) gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    if (!next) next = t + (DEBUG ? 900 : 6000 + Math.random() * 4000);
    if (!live && t >= next) { fire(t); next = t + (DEBUG ? 1600 : 6000 + Math.random() * 4000); }
    // r467: one geometry. Back on screen (the loop's first frame, dt 0) the sets are measured again; and every frame one set's box
    // is checked against the place its tube is drawn from: if the two ever disagree by more than a pixel, everything is measured again
    var hr = host.getBoundingClientRect();
    if (!dt || Math.abs(hr.width - mw) > 0.5 || Math.abs(hr.height - mh) > 0.5) measure();
    else if (cards.length) { var cc = cards[chk = (chk + 1) % cards.length]; if (cc.w > 0) { var bb = cc.el.getBoundingClientRect(), nt = nudge(cc.el); if ((Math.abs(bb.left - (hr.left - PL) - ((W.x || [])[cc.row] || 0) - nt[0] - cc.x) > 1 || Math.abs(bb.top - (hr.top - PAD) - nt[1] - cc.y) > 1 || Math.abs(bb.width - cc.w) > 1) && t - heal > 250) { heal = t; measure(); } } }
    var X = W.x || [], ex = HX, ey = PAD ? innerHeight / 2 - (hTop = hr.top) + PAD : scrollY + innerHeight / 2 - secTop, n = 0, k = 1 - Math.exp(-(dt || 0.016) / 0.06);
    var S = CC.scale, mx = CC.cx == null ? HX : CC.cx, my = CC.cy == null ? wh / 2 : CC.cy;
    if (live && (t - live.t0) / live.dur >= 1) live = null;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], x = c.x + (X[c.row] || 0), g = live && live.c === c ? live : null, gp = 0, gs = 0, gb = 0;
      if (g) { gp = (t - g.t0) / g.dur; if (gp >= 1) { g = null; gp = 0; } else { gs = sig(gp, g); gb = bloom(gp); } }
      c.on = x + c.w > -2 && x < vw + 2 && (c.L.up || c.big) && c.w > 0; if (!c.on) continue;
      var cx = x + c.w / 2, cy = c.y + c.h / 2; c.nx = (cx - HX) / HW;
      c.hov += ((c.el === over || c.el === focus || c.el.classList.contains("show") ? 1 : 0) - c.hov) * k;
      var gg = !!g, o = n * NF, s1 = S * c.s, px = mx + (cx + c.ox - mx) * S, py = my + (cy + c.oy - my) * S;
      inst[o] = px - c.w * s1 / 2; inst[o + 1] = py - c.h * s1 / 2; inst[o + 2] = c.w * s1; inst[o + 3] = c.h * s1; inst[o + 20] = c.gn; inst[o + 21] = c.pw;
      inst[o + 16] = c.uv[0]; inst[o + 17] = c.uv[1]; inst[o + 18] = c.uv[2]; inst[o + 19] = c.uv[3];
      inst[o + 4] = c.L.i; inst[o + 5] = c.hov; inst[o + 6] = (ex - cx) / D; inst[o + 7] = (ey - cy) / D;
      inst[o + 8] = gg ? g.type : 0; inst[o + 9] = gg ? gp : 0; inst[o + 10] = gg ? gs : 0; inst[o + 11] = gg ? gb : 0;
      inst[o + 12] = gg && g.type === 4 ? rollY(gp) : 0; inst[o + 13] = gg ? g.ph : 0; inst[o + 15] = c.big; n++;
    }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (!n) return;
    gl.useProgram(prog); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst, 0, n * NF);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, big); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex); gl.uniform1f(U.uGain, CC.gain);
    gl.uniform2f(U.uRes, vw, wh); gl.uniform1f(U.uSeed, Math.floor(Math.random() * 997)); gl.uniform1f(U.uTime, t / 1000);
    if (lim) { var sp = Math.min(1, Math.max(0, scrollY / (wh * 0.62))); limK += ((1 - sp * sp * (3 - 2 * sp)) - limK) * (1 - Math.exp(-(dt || 0.016) / 0.1)); gl.uniform4f(U.uLim, lim[0], lim[1], lim[2], lim[3]); gl.uniform1f(U.uLimS, lim[4]); gl.uniform1f(U.uLimK, limK); } else gl.uniform1f(U.uLimK, 0);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
  };
  W.hooks.push(frame);
  // r450: what the fold's own script may ask of the rig: the one big picture (pic: any loaded <img>), a new measure, the beat (C.scale, C.gain)
  window.__czCrt = { cards: cards, get live() { return live; }, get gen() { return gen; }, get top() { return hTop; }, get h() { return wh - 2 * PAD; }, get pl() { return PL; }, get hw() { return vw - PL - PR; }, get vw() { return vw; }, R: RK, d: DK, C: CC, get ready() { return ready && !dead; }, measure: function () { if (ready && !dead) measure(); },
    pic: function (im) { if (!ready || dead) return false; try { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, big); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.generateMipmap(gl.TEXTURE_2D); gl.activeTexture(gl.TEXTURE0); return true; } catch (e) { gl.activeTexture(gl.TEXTURE0); return false; } } };
  W.go();
})();
// r451 (Daniel, 10 Nov: "imi place cel cu inima. hai sa il dezvoltam, sa facem mai mutla animatie si solutie pe mobile si
// finisat cat se paote de mult"). The heart's whole life, all of it on the CRT rig's own calls (window.__czCrt; per set: scale,
// gain, power, a nudge; nothing in the DOM moves, nothing is laid out again), on the wall's loop (nothing off screen or in a
// hidden tab):
//  load   the sets wait switched off and switch on from the middle outwards, each one as a line that opens into its picture;
//  rest   it beats: two short pulses that travel from the middle to the edge, every 3.2 s; now and then one set loses its signal;
//  away   as the heart leaves the screen the sets drift a little apart and dim.
//  form   r454 (Daniel, 10 Nov: "când scrollezi să se formeze: inima să înceapă deformată ... Să fie defazate rândurile și să se
//         formeze ulterior"): the heart opens with its rows slid sideways like loose bricks, every row its own way and amount,
//         and the scroll lays them in, the top row first and the tip last, scrubbed: it is whole by the time the heart reaches
//         the top of the screen (just before "away" starts). The links move with their pictures (a translate: no layout, no CLS;
//         the fold clips, so nothing widens the page). Only with the rig: without it the heart is whole from the start.
// r452 (Daniel, 10 Nov: "Hai să renunțăm la sortarea pe servicii în hero"): the five service keys and the lighting of each
// service's work are gone; the services live in their own section (.sv5). Without the rig or with reduced motion it is a still picture.
(function () {
  var wall = document.querySelector(".pwall.pw-first.f5c"), W = window.__czWall;
  if (!wall || !W || !W.hooks || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var rig = function () { var C = window.__czCrt; return C && C.ready ? C : null; };
  var pulse = function (x) { return x <= 0 || x >= 1 ? 0 : Math.pow(Math.sin(Math.PI * x), 2) * (1 - 0.35 * x); };
  var G = -1, T0 = 0, mx = 0, my = 0, AW = false, armed = false, HT = -1e9, FD = 150, NR = 1, RS = [], SLIDE = [0.6, -0.5, 0.55, -0.45, 0.6], ST = 0.35;
  var phone = matchMedia("(max-width: 700px)"), stacked = matchMedia("(max-width: 900px)"), host = wall.querySelector(".f5-wall");
  var sets = [].slice.call(wall.querySelectorAll(".pw-case")), slid = false;
  var hdr = document.querySelector(".hdr");
  // r472 (Daniel, 12 Nov: "cand se creaza inima si sare si incepe sa respire, sa faca la fel si experiences"): the key word
  // (.pw-x) lives on the heart's own clock, read off the same numbers as the heart's middle set (d = 0): the big beat when
  // it forms (a jump: a lift and a size up) and the two-pulse breath every 3.2 s, in phase. No clock of its own, so it cannot
  // drift. Transform only (scale, translate on its own fit-content box): no layout, CLS 0. Written only when it changes.
  var kx = wall.querySelector(".pw-h .pw-x"), ks = "";
  var kset = function (sc, ty) { var v = sc.toFixed(4) + "|" + ty.toFixed(4); if (!kx || v === ks) return; ks = v; kx.style.scale = sc === 1 ? "" : sc.toFixed(4); kx.style.translate = ty ? "0 " + ty.toFixed(4) + "em" : ""; };
  W.hooks.push(function (t, dt) {
    var C = rig(); if (!C) { kset(1, 0); if (slid) { slid = false; sets.forEach(function (el) { el.style.translate = ""; }); } return; } // the rig went: the still heart is whole
    slid = true;
    if (G !== C.gen) { // where the heart's middle is and how far each set is from it (0 the middle, 1 the tip): on a new measure only
      G = C.gen; var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, far = 1;
      C.cards.forEach(function (c) { if (c.w > 0) { x0 = Math.min(x0, c.x); y0 = Math.min(y0, c.y); x1 = Math.max(x1, c.x + c.w); y1 = Math.max(y1, c.y + c.h); } });
      mx = (x0 + x1) / 2; my = y0 + (y1 - y0) * 0.44;
      C.cards.forEach(function (c) { c.dx = c.x + c.w / 2 - mx; c.dy = c.y + c.h / 2 - my; c.d = Math.hypot(c.dx, c.dy * 1.2); if (c.w > 0) far = Math.max(far, c.d); });
      C.cards.forEach(function (c) { c.d /= far; });
      var ys = []; C.cards.forEach(function (c) { if (c.w > 0 && !ys.some(function (y) { return Math.abs(y - c.y) < 4; })) ys.push(c.y); }); ys.sort(function (a, b) { return a - b; }); NR = Math.max(1, ys.length);
      C.cards.forEach(function (c) { c.ri = 0; ys.forEach(function (y, k) { if (Math.abs(y - c.y) < 4) c.ri = k; }); });
      // how far each row may slide: inside the fold, never over the title column (side by side), off the screen's edge by
      // under half a set on a phone (the edge of a small screen is the frame); a row with no room on its side slides the other way
      var hr = host.getBoundingClientRect(), wr = wall.getBoundingClientRect(), o0 = hr.left - C.pl, tw = 0, side = !stacked.matches;
      if (side) [].forEach.call(wall.querySelectorAll(".f5-h, .f5-say"), function (el) { tw = Math.max(tw, el.getBoundingClientRect().right); });
      var w0 = 1; C.cards.forEach(function (c) { if (c.w > 0) w0 = c.w; });
      var lo = (side ? Math.max(tw + 12, wr.left + 8) : phone.matches ? wr.left - 0.4 * w0 : wr.left + 8) - o0, hi = (phone.matches ? wr.right + 0.4 * w0 : wr.right - 8) - o0;
      RS = ys.map(function (y, k) {
        var l = 1e9, r = -1e9; C.cards.forEach(function (c) { if (c.w > 0 && c.ri === k) { l = Math.min(l, c.x); r = Math.max(r, c.x + c.w); } });
        var want = SLIDE[k % SLIDE.length] * w0, dir = want > 0 ? 1 : -1, room = function (d) { return d > 0 ? hi - r : l - lo; };
        if (room(dir) < 0.2 * w0 && room(-dir) > room(dir) * 1.5) dir = -dir;
        return dir * Math.max(0, Math.min(Math.abs(want), room(dir)));
      });
      FD = Math.max(60, hr.top + scrollY + hr.height / 2 - innerHeight / 2); // r456: whole as the heart's middle reaches the screen's middle
      if (!side) { var h1t = wall.querySelector(".pw-h").getBoundingClientRect().top + scrollY; FD = Math.max(60, Math.min(FD, h1t - 12)); } // r461: stacked, it is whole before the title leaves the screen (Daniel: "în dreptul textului")
      C.C.cx = mx; C.C.cy = my; C.C.scale = 1; C.C.gain = 1;
    }
    var sp = Math.min(1, Math.max(0, (4 - C.top) / (C.h * 0.9))), e = sp * sp * (3 - 2 * sp);
    if ((e > 0.01) !== AW) { AW = !AW; wall.classList.toggle("away", AW); } // the sets drift off their DOM boxes: the boxes' shadows go
    var fp = Math.min(1, Math.max(0, scrollY / FD)) * (1 + ST * (NR - 1));
    // r456: the moment. Once the heart has been seen loose (armed), laying its last row in is "you formed it": one big beat
    // from the middle out, the key words flare, a short sound (window.__czBeep: only if a tap or a key
    // has unlocked audio and the site's sound is on). Once per forming: it re-arms only when the heart has come loose again.
    var fq = fp / (1 + ST * (NR - 1));
    if (fq < 0.6) armed = true;
    else if (armed && fq > 0.99) {
      armed = false; HT = t; wall.classList.remove("formed"); void wall.offsetWidth; wall.classList.add("formed");
      if (window.__czBeep) window.__czBeep();
    }
    var hp = t - HT;
    // r463 (Daniel, 11 Nov: "poate si tv-urile la scroll, cand raman sus sa aiba un efect interesant prin care dispar si cat mai
    // contextual"): each set switches off as it reaches the top of the screen (the header's height, shown or not: the same place both ways), the way a
    // tube does: the picture folds into a bright line, the line shrinks to a dot, the dot goes out. It is the switching-on
    // played backwards, on the scroll itself: scroll back and each set comes on again. Only the rig's power value moves.
    var hd = hdr ? hdr.offsetHeight : 0, y0 = C.top - 28;
    for (var i = 0; i < C.cards.length; i++) {
      var c = C.cards[i]; if (!(c.w > 0)) continue;
      var q = Math.min(1, Math.max(0, fp - c.ri * ST)), fx = Math.round((RS[c.ri] || 0) * (1 - q * q * (3 - 2 * q)) * 2) / 2;
      if (fx !== c.fx) { c.fx = fx; c.el.style.translate = fx ? fx + "px 0" : ""; }
      if (c.t1 == null) { if (!c.L.up) { c.pw = 0; continue; } if (!T0) T0 = t; c.t1 = Math.max(t, T0 + 60 + c.d * 340); }
      var p = (t - c.t1) / 460; c.pw = p <= 0 ? 0 : p >= 1 ? 1 : p;
      var off = Math.min(1, Math.max(0, (hd + 0.55 * c.h - (y0 + c.y)) / (0.85 * c.h))); if (off > 0) c.pw = Math.min(c.pw, 1 - off * off * (3 - 2 * off));
      var ph = t - T0 - 1500 - c.d * 190, b = 0; if (ph > 0) { ph %= 3200; b = pulse(ph / 320) + 0.6 * pulse((ph - 370) / 300); }
      var on = p > 0 && p < 1.6 ? Math.exp(-3 * Math.max(0, p - 0.55)) * Math.min(1, p / 0.55) : 0; // the tube overshoots as it comes on, then settles
      var hb = hp < 1200 ? pulse((hp - c.d * 150) / 420) : 0; // r456: the big beat, the middle first
      c.s = 1 + 0.026 * b + 0.02 * on + 0.07 * hb - 0.05 * e;
      c.gn = (1 + 0.15 * b + 0.3 * on + 0.55 * hb) * (1 - 0.45 * e);
      c.ox = c.dx * 0.12 * e + fx; c.oy = c.dy * (c.dy < 0 ? 0.12 : 0.03) * e; // upwards and sideways; the tip stays inside the heart's own box
    }
    // r472: the key word, on the middle set's numbers (the same formulas at d = 0)
    var kb = 0, kh = hp < 1200 ? pulse(hp / 420) : 0, kp = T0 ? t - T0 - 1500 : 0;
    if (kp > 0) { kp %= 3200; kb = pulse(kp / 320) + 0.6 * pulse((kp - 370) / 300); }
    kset(1 + 0.03 * kb + 0.065 * kh, -0.08 * kh);
  });
})();
// r456 (Daniel: "un sunet 8-bit scurt" when the heart forms; then: a success sound, subtle, "you feel it is there"). The
// heart's one sound, synthesised (no file): a soft lub-dub and a rising major arpeggio on a square voice, about 0.5 s, the
// whole thing under a low master (0.07) and a low-pass. The rules it keeps:
//  - the site's sound switch: localStorage "cz-sound" = "off" (the drive's and the game's speaker) keeps it silent;
//  - autoplay: nothing is made at load. A real gesture (pointerup, touchend, keydown; a scroll is not one) unlocks it:
//    WebKit (Safari, every iOS browser) needs the context made and resumed inside that gesture, plus one silent buffer;
//    Chromium and Firefox let a context made later run once the page has had a gesture, so there it is made in the next
//    idle moment (new AudioContext() is a 100+ ms task: never inside the tap, never on a scroll frame);
//  - with no unlock, a hidden tab or a context that is not running it simply does not play. Never an error.
// window.__czBeep() plays it (true) or says why not (false); __czBeep.state for QA.
(function () {
  var wall = document.querySelector(".pwall.pw-first.f5c");
  if (!wall || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  var ua = navigator.userAgent, wk = /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) || (/AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua));
  var ctx = null, last = -1e9, idle = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
  var off = function () { try { return localStorage.getItem("cz-sound") === "off"; } catch (e) { return false; } };
  var make = function () { if (!ctx) { try { ctx = new AC(); } catch (e) { ctx = null; } } return ctx; };
  var EV = ["pointerup", "touchend", "keydown"];
  var unlock = function (ev) {
    if (ev && ev.type === "keydown" && (ev.key === "Escape" || ev.key === "Tab" || ev.metaKey || ev.ctrlKey || ev.altKey)) return; // not an activation in every browser
    if (off()) return;
    if (wk) {
      if (!make()) return;
      try { var r = ctx.resume(); if (r && r.catch) r.catch(function () {}); } catch (e) {}
      try { var b = ctx.createBuffer(1, 1, 22050), s0 = ctx.createBufferSource(); s0.buffer = b; s0.connect(ctx.destination); s0.start(0); } catch (e) {}
    } else if (!ctx) { var ua2 = navigator.userActivation; if (ua2 && !ua2.hasBeenActive) return; idle(function () { make(); }, { timeout: 1500 }); } // the end of a scroll swipe is no activation: wait for a real one (no "not allowed to start" warning)
    else if (ctx.state === "suspended") { try { var r2 = ctx.resume(); if (r2 && r2.catch) r2.catch(function () {}); } catch (e) {} }
  };
  EV.forEach(function (n) { addEventListener(n, unlock, { capture: true, passive: true }); });
  document.addEventListener("visibilitychange", function () { if (ctx && document.hidden && ctx.state === "running") try { ctx.suspend(); } catch (e) {} });
  var beep = function () {
    if (off()) return (beep.state = "off"), false;
    if (!ctx) return (beep.state = "locked"), false;
    if (document.hidden) return (beep.state = "hidden"), false;
    if (ctx.state !== "running") { try { var r = ctx.resume(); if (r && r.catch) r.catch(function () {}); } catch (e) {} return (beep.state = "suspended"), false; }
    var now = performance.now(); if (now - last < 3000) return (beep.state = "soon"), false; last = now;
    try {
      var t0 = ctx.currentTime + 0.03, m = ctx.createGain(), lp = ctx.createBiquadFilter();
      m.gain.value = 0.07; lp.type = "lowpass"; lp.frequency.value = 3400; lp.Q.value = 0.3; m.connect(lp); lp.connect(ctx.destination);
      var v = function (type, f0, f1, at, dur, g, atk) {
        var o = ctx.createOscillator(), e = ctx.createGain(), a = t0 + at;
        o.type = type; o.frequency.setValueAtTime(f0, a); if (f1) o.frequency.exponentialRampToValueAtTime(f1, a + dur);
        e.gain.setValueAtTime(0, a); e.gain.linearRampToValueAtTime(g, a + atk); e.gain.exponentialRampToValueAtTime(0.0005, a + dur);
        o.connect(e); e.connect(m); o.start(a); o.stop(a + dur + 0.03);
      };
      v("triangle", 210, 80, 0, 0.1, 0.9, 0.006); v("triangle", 190, 75, 0.13, 0.09, 0.65, 0.006); // lub-dub, with the big beat
      [[784, 0.24], [988, 0.29], [1175, 0.34], [1568, 0.39]].forEach(function (n, i) { v("square", n[0], 0, n[1], i < 3 ? 0.065 : 0.12, 0.26, 0.012); }); // G5 B5 D6 G6: up, resolved
      setTimeout(function () { try { m.disconnect(); lp.disconnect(); } catch (e) {} }, 900);
      beep.state = "played"; return true;
    } catch (e) { beep.state = "error"; return false; }
  };
  beep.state = "idle"; beep.ctx = function () { return ctx ? ctx.state : "none"; };
  window.__czBeep = beep;
})();
// r380 (beta; Daniel: the intro text, "fine and subtle, very modern"): after the h1's signal lock (the split and the
// keyframes are in render.mjs + site.css), it lives with the wall. On the wall's own loop (so nothing runs while the
// wall is off screen): on a desktop pointer it floats ±3 px against the wall, eased; as you scroll the wall away it
// sinks a little behind the scroll, softens and fades with the scroll's progress (phones: fade and sink only, no
// blur). (Its glint on a CRT glitch went in r408: the letters' own glitches are in the block below.)
// At rest every inline style is cleared, so the type stays crisp. Nothing with reduced motion.
(function () {
  var W = window.__czWall, h = document.querySelector(".pw-h.si"), wall = h && h.closest(".pwall");
  if (!W || !W.go || !h || !wall || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (h.closest(".f5")) return; // r450: the title is part of a still composition; it does not float, sink or blur
  var phone = matchMedia("(max-width: 700px)").matches, fine = matchMedia("(hover: hover) and (pointer: fine)").matches && !phone;
  var wh = 1, measure = function () { wh = wall.getBoundingClientRect().height; };
  measure(); addEventListener("resize", measure); addEventListener("load", measure);
  var tx = 0, ty = 0, px = 0, py = 0, idle = true, ready = false;
  setTimeout(function () { ready = true; }, 1000); // the parallax waits for the lock to finish
  if (fine) addEventListener("pointermove", function (e) { tx = -(e.clientX / innerWidth - 0.5) * 6; ty = -(e.clientY / innerHeight - 0.5) * 6; }, { passive: true });
  if (fine) document.addEventListener("pointerleave", function () { tx = ty = 0; });
  W.hooks.push(function (t, dt) {
    var k = 1 - Math.exp(-(dt || 0.016) / 0.14);
    if (ready) { px += (tx - px) * k; py += (ty - py) * k; }
    var p = Math.min(1, Math.max(0, scrollY / (wh * 0.62)));
    if (p < 0.002 && Math.abs(px) < 0.05 && Math.abs(py) < 0.05) {
      if (!idle) { h.style.transform = h.style.filter = h.style.opacity = ""; idle = true; }
    } else {
      idle = false; var e = p * p * (3 - 2 * p);
      h.style.transform = "translate3d(" + px.toFixed(2) + "px," + (py + e * (phone ? 26 : 44)).toFixed(2) + "px,0)" + (phone ? "" : " scale(" + (1 - 0.05 * e).toFixed(4) + ")");
      h.style.filter = !phone && e > 0.01 ? "blur(" + (e * 7).toFixed(2) + "px)" : "";
      h.style.opacity = e > 0.001 ? (1 - 0.88 * e).toFixed(3) : "";
    }
  });
})();
// r408 (Daniel: "câte o literă care se glitchuiască conform glitch-urilor de pe TV, dar mult mai specific pentru literă, câte
// una pe rând sau câte un rând întreg"). The interference reaches the h1: when a set on the wall loses its signal, the letter
// nearest to that set loses its own a beat later, the same way: snow inside the letter, a drop, the hold slipping in bands,
// or the letter's picture rolling once in its cell; sometimes one or two more letters follow, one at a time, and a slip or
// snow can take a whole line. Round 2 (Daniel: "mai mult glitch pe text, acum e rar si putin, si poate si randuri intregi"):
// every wall glitch counts, the slips reach further, and between them the type has its own clock (a letter every 2.2-4.2 s,
// shorter; a line at most every 7 s). Without the CRT only that clock runs. Nothing runs off screen or in a hidden tab
// (the wall's loop stops), only a compare per frame between glitches; the motion is WAAPI on transform and opacity, so it
// leaves the main thread (snow alone steps a background on the letter or line).
// The h1's DOM is never touched: no letter is split, kerning, wrapping and diacritics stay the browser's own and nothing
// can shift. The letter's place is read from a Range; the real letter is hidden through a CSS highlight (paint only, its
// shadow stays); the copies are absolute, aria-hidden, in generated content (attr), so no extra text ever exists for a
// screen reader, a selection or a crawler. Copies are solid fills. No Highlight API (Safari < 17.2, Firefox < 140): no
// glitches. Never with reduced motion (no .si). One switch: window.__czH1.off() / .on(). QA, no UI: ?h1g=1 cycles all
// every 1.6 s, ?h1g=roll|snow|drop|hsync|line|lsnow only that one; __czH1.fire(type, letterIndex).
(function () {
  var W = window.__czWall, h = document.querySelector(".pw-h.si");
  if (!W || !W.go || !h || !window.CSS || !CSS.highlights || typeof Highlight !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var KIND = { 1: "snow", 2: "drop", 3: "hsync", 4: "roll" }, ALL = ["snow", "drop", "hsync", "roll"], gq = new URLSearchParams(location.search).get("h1g");
  var off = false, busy = false, q = [], lastLive = null, lastIdx = -1, lastLine = -1e9, own = 0, cyc = 0, noise = null, hook, QA = ALL.concat("line", "lsnow");
  // every letter and where it is now (read at the moment of a glitch: a clean layout, about 40 ranges)
  var letters = function () {
    var hb = h.getBoundingClientRect(), out = [];
    [].forEach.call(h.querySelectorAll(".si-w"), function (w, wi) {
      var n = w.firstChild; if (!n || n.nodeType !== 3) return;
      var kk = w.classList.contains("si-k"), fs = kk ? getComputedStyle(w).fontSize : ""; // r456: the key words are bigger and yellow: their copies must be too
      var re = /\p{L}\p{M}*|./gu, m;
      while ((m = re.exec(n.data))) { var r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); var b = r.getClientRects()[0]; if (b) out.push({ c: m[0], r: r, w: wi, x: b.left - hb.left, y: b.top - hb.top, W: b.width, H: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2, wide: /\p{L}/u.test(m[0]) && !/^[iljtfr]/.test(m[0]), k: kk, fs: fs }); }
    });
    return out;
  };
  var KF = "";
  var piece = function (o, txt, x, y, W2, H, cls) { var e = document.createElement("span"); e.className = "h1g-p" + (cls ? " " + cls : "") + (KF ? " h1g-k" : ""); e.setAttribute("data-c", txt); e.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + W2 + "px;height:" + H + "px;line-height:" + H + "px" + (KF ? ";font-size:" + KF : ""); o.appendChild(e); return e; };
  var AT = [0, 0.1, 0.22, 0.38, 0.55, 0.7, 0.86, 1], SL = [0, 1, 0.55, 0.95, 0.4, 0.75, 0.12, 0];
  var kf = function (vals, fn, ease) { return vals.map(function (v, i) { var f = fn(v); f.offset = AT[i]; if (ease) f.easing = ease; return f; }); };
  // the hold slipping: bands sliding in turn against each other, the red and blue guns showing where they part
  var slip = function (o, a, txt, x, y, W2, H, nb, amp, gun, dur, lag) {
    var em = parseFloat(KF || getComputedStyle(h).fontSize);
    [["h1g-r", gun], ["h1g-b", -gun]].forEach(function (g) { var e = piece(o, txt, x, y, W2, H, g[0]); a.push(e.animate(kf(SL, function (v) { return { transform: "translate3d(" + (g[1] * em * v).toFixed(2) + "px,0,0)", opacity: v > 0.05 ? 1 : 0 }; }), { duration: dur, fill: "both" })); });
    for (var i = 0; i < nb; i++) (function (i) {
      var e = piece(o, txt, x, y, W2, H), s = (i % 2 ? 1 : -1) * amp * em * (0.65 + 0.35 * Math.random()), t = H * 0.1, band = (H - 2 * t) / nb;
      e.style.clipPath = "inset(" + (i ? t + band * i : -9) + "px -30% " + (i < nb - 1 ? t + band * (nb - i - 1) : -9) + "px -30%)";
      a.push(e.animate(kf(SL, function (v) { return { transform: "translate3d(" + (s * v).toFixed(2) + "px,0,0)" }; }, "steps(2)"), { duration: dur, delay: i * lag, fill: "both" }));
    })(i);
  };
  var bloom = function (o, a, L, dur) { var e = piece(o, L.c, L.x, L.y, L.W, L.H, "h1g-g"); a.push(e.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.68 }, { opacity: 1, offset: 0.78 }, { opacity: 0, offset: 1 }], { duration: dur, fill: "both" })); };
  var snow = function () {
    if (noise) return noise;
    var c = document.createElement("canvas"); c.width = c.height = 64; var x = c.getContext("2d"), d = x.createImageData(64, 64);
    // the shader's snow: scanlines of grain, some lines hotter; never dark enough to lose the letter
    for (var y = 0; y < 64; y++) { var ln = 0.6 + 0.6 * Math.random(), run = 0, v = 0; for (var i = 0; i < 64; i++) { if (run-- <= 0) { v = Math.min(255, 58 + 230 * Math.random() * ln); run = Math.floor(Math.random() * 3); } var k = (y * 64 + i) * 4; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; } }
    x.putImageData(d, 0, 0); return (noise = c.toDataURL("image/png"));
  };
  var run = function (type, L, all, quick) {
    KF = L.k ? L.fs : "";
    var o = document.createElement("span"); o.className = "h1g-o"; o.setAttribute("aria-hidden", "true");
    var a = [], rs = [L.r], dur = 640, k = quick ? 0.72 : 1;
    if (type === "line" || type === "lsnow") {
      var line = all.filter(function (q0) { return Math.abs(q0.y - L.y) < 2; }), end = line[line.length - 1], txt = "", w0 = -1, lw;
      line.forEach(function (q0) { if (w0 >= 0 && q0.w !== w0) txt += " "; txt += q0.c; w0 = q0.w; });
      rs = line.map(function (q0) { return q0.r; }); lw = end.x + end.W - line[0].x + 8;
    }
    if (type === "hsync") { dur = 560 * k; slip(o, a, L.c, L.x, L.y, L.W, L.H, 5, 0.15, 0.06, dur, 0); }
    else if (type === "line") { dur = 540 * k; slip(o, a, txt, line[0].x, L.y, lw, L.H, 5, 0.085, 0.018, dur, 22); }
    else if (type === "lsnow") {
      dur = 460 * k; var ln = piece(o, txt, line[0].x, L.y, lw, L.H, "h1g-n"), lt = piece(o, txt, line[0].x, L.y, lw, L.H);
      ln.style.setProperty("--n", "url(" + snow() + ")");
      a.push(ln.animate([{ backgroundPosition: "0 0" }, { backgroundPosition: "-1120px 770px" }], { duration: dur, easing: "steps(9)", pseudoElement: "::before", fill: "both" }));
      a.push(lt.animate([{ opacity: 1, offset: 0 }, { opacity: 0, offset: 0.12 }, { opacity: 0.25, offset: 0.4, easing: "steps(2)" }, { opacity: 0, offset: 0.55 }, { opacity: 1, offset: 0.9 }, { opacity: 1, offset: 1 }], { duration: dur, fill: "both" }));
    } else if (type === "roll") {
      // the letter's own picture rolls once in its cell, as the set's does, and settles with a small bounce
      var cell = document.createElement("span"); cell.className = "h1g-c"; cell.style.cssText = "left:" + L.x + "px;top:" + L.y + "px;width:" + L.W + "px;height:" + L.H + "px"; o.appendChild(cell);
      var A = piece(cell, L.c, 0, 0, L.W, L.H), B = piece(cell, L.c, 0, -L.H * 1.06, L.W, L.H), fr = [];
      for (var i = 0; i <= 14; i++) { var p = i / 14, y = Math.min(1, Math.max(0, (p - 0.06) / 0.8)), v = y < 0.75 ? 1.03 * Math.pow(y / 0.75, 2.2) : 1 + 0.03 * Math.cos(Math.PI * 1.5 * (y - 0.75) / 0.25) * Math.exp(-4 * (y - 0.75) / 0.25); fr.push({ offset: p, transform: "translate3d(0," + (v * L.H * 1.06).toFixed(2) + "px,0)" }); }
      fr[14].transform = "translate3d(0," + (L.H * 1.06).toFixed(2) + "px,0)";
      a.push(A.animate(fr, { duration: dur, fill: "both" }), B.animate(fr, { duration: dur, fill: "both" }));
    } else if (type === "snow") {
      dur = 700 * k; var n = piece(o, L.c, L.x, L.y, L.W, L.H, "h1g-n"), top = piece(o, L.c, L.x, L.y, L.W, L.H);
      n.style.setProperty("--n", "url(" + snow() + ")");
      a.push(n.animate([{ backgroundPosition: "0 0" }, { backgroundPosition: "-1680px 1190px" }], { duration: dur, easing: "steps(" + Math.round(14 * k) + ")", pseudoElement: "::before", fill: "both" }));
      a.push(top.animate([{ opacity: 1, offset: 0 }, { opacity: 0, offset: 0.1 }, { opacity: 0, offset: 0.7 }, { opacity: 1, offset: 0.92 }, { opacity: 1, offset: 1 }], { duration: dur, fill: "both" }));
      bloom(o, a, L, dur);
    } else {
      dur = 620 * k; var e = piece(o, L.c, L.x, L.y, L.W, L.H);
      a.push(e.animate([{ opacity: 1, offset: 0 }, { opacity: 0.3, offset: 0.12 }, { opacity: 0.58, offset: 0.3, easing: "steps(2)" }, { opacity: 0.3, offset: 0.46 }, { opacity: 0.55, offset: 0.6 }, { opacity: 0.34, offset: 0.7 }, { opacity: 1, offset: 0.86 }, { opacity: 1, offset: 1 }], { duration: dur, fill: "both" }));
      bloom(o, a, L, dur);
    }
    if (KF) { var er = line ? piece(o, txt, line[0].x, L.y, lw, L.H, "h1g-e") : piece(o, L.c, L.x, L.y, L.W, L.H, "h1g-e"); o.insertBefore(er, o.firstChild); } // r458: a key letter's weight and plate are shadows, which the highlight cannot hide: a paper copy covers them while it glitches
    busy = true; h.appendChild(o); CSS.highlights.set("h1g", new Highlight(...rs));
    var done = false, end2 = function () { if (done) return; done = true; a.forEach(function (x) { x.cancel(); }); o.remove(); CSS.highlights.delete("h1g"); busy = false; };
    Promise.all(a.map(function (x) { return x.finished; })).then(end2, end2);
    setTimeout(end2, dur + 500);
    run.stop = end2;
  };
  var fire = function (type, idx, near, quick) {
    if (off || busy) return false;
    var all = letters(), pool = all.filter(function (q0, i) { q0.i = i; return q0.wide && i !== lastIdx; }); if (!pool.length) return false;
    var L;
    if (idx != null && all[idx]) L = all[idx];
    else if (near) { pool.sort(function (a, b) { return Math.hypot(a.cx - near[0], a.cy - near[1]) - Math.hypot(b.cx - near[0], b.cy - near[1]); }); L = pool[Math.floor(Math.random() * Math.min(3, pool.length))]; }
    else { var kp = pool.filter(function (q0) { return q0.k; }); if (kp.length && Math.random() < 0.6) pool = kp; L = pool[Math.floor(Math.random() * pool.length)]; } // r456: the type's own clock leans on the key words
    lastIdx = L.i; run(type, L, all, quick); return true;
  };
  // a set lost its signal: the letters near it go too (or the whole line), the same way
  var hit = function (t, type, near) {
    var pl = type === "hsync" ? 0.6 : type === "snow" ? 0.35 : 0;
    if (t - lastLine > 7000 && Math.random() < pl) { lastLine = t; q.push({ gap: 110, type: type === "snow" ? "lsnow" : "line", near: near }); }
    else { q.push({ gap: 110, type: type, near: near }); var n = Math.random() < 0.55 ? 1 + Math.floor(Math.random() * 2) : 0; while (n--) q.push({ gap: 70 + Math.random() * 90, type: type, near: near, quick: true }); }
    own = Math.max(own, t + 1800);
  };
  // between the sets, the type's own clock
  var tick = function (t) {
    if (t - lastLine > 7000 && Math.random() < 0.38) { lastLine = t; q.push({ gap: 0, type: Math.random() < 0.72 ? "line" : "lsnow", quick: true }); return; }
    var r = Math.random(); q.push({ gap: 0, type: r < 0.45 ? "hsync" : r < 0.65 ? "snow" : r < 0.85 ? "roll" : "drop", quick: true });
  };
  hook = function (t) {
    if (busy) return;
    if (scrollY > innerHeight * 0.12) { q.length = 0; return; }
    if (q.length) { var j = q[0]; if (j.t == null) j.t = t + j.gap; if (t >= j.t) { q.shift(); fire(j.type, null, j.near, j.quick); } return; }
    if (gq) { if (t > own) { own = t + 1600; fire(QA.indexOf(gq) >= 0 ? gq : QA[cyc++ % QA.length]); } return; }
    var C = window.__czCrt;
    if (C) {
      var live = C.live;
      if (live && live !== lastLive) { var b = live.c.el.getBoundingClientRect(); hit(t, KIND[live.type], [b.left + b.width / 2, b.top + b.height / 2]); }
      lastLive = live || null;
    }
    if (!own) own = t + 2200 + Math.random() * 1500;
    else if (t > own) { own = t + 2200 + Math.random() * 2000; tick(t); }
  };
  W.hooks.push(hook);
  window.__czH1 = {
    off: function () { off = true; q.length = 0; var i = W.hooks.indexOf(hook); if (i >= 0) W.hooks.splice(i, 1); if (run.stop) run.stop(); },
    on: function () { if (!off) return; off = false; W.hooks.push(hook); W.go(); },
    fire: function (type, idx) { return fire(type, idx); }
  };
})();
