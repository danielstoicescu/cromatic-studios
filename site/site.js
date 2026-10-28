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
    const hdr = d.querySelector(".hdr"), off = (hdr ? hdr.offsetHeight : 72) + snav.offsetHeight * 0.8 + 12;
    scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - off), behavior: reduced ? "auto" : "smooth" });
    // after the scroll has started: the reveal is style work, it must not hold the first frame
    setTimeout(() => { el.classList.add("in"); el.querySelectorAll(".bento, .dom-street").forEach((x) => x.classList.add("in")); el.style.setProperty("--sp", "1"); try { history.replaceState(null, "", a.getAttribute("href")); } catch {} }, 120);
  });
  // r349: once the street buttons reach their sticky place under the header they shrink (.stuck), and grow back above it
  if (snav) {
    let rq = 0;
    const st = () => { rq = 0; const top = parseFloat(getComputedStyle(snav).top) || 0; snav.classList.toggle("stuck", snav.getBoundingClientRect().top <= top + 1 && scrollY > 200); };
    addEventListener("scroll", () => { if (!rq) rq = requestAnimationFrame(st); }, { passive: true }); st();
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
  d.querySelectorAll(".hc-vid").forEach((hv) => {
    const cn = navigator.connection || {}, slow = cn.saveData || /(^|-)2g$/.test(cn.effectiveType || "");
    const card = hv.closest(".hc-card, .city-band"), pp = card && card.querySelector(".hc-pp"), mq = matchMedia("(max-width: 700px)");
    if (!reduced && !slow && pp && card && "IntersectionObserver" in window) {
      let seen = false, loaded = false, paused = false;
      const set = () => {
        const s = hv.dataset, m = mq.matches;
        hv.innerHTML = [[m ? s.mw : s.dw, 'video/webm; codecs="vp9"'], [(m && s.m) || s.d, "video/mp4"]].filter((x) => x[0]).map(([u, t]) => `<source src="${u}" type='${t}'>`).join("");
        hv.load();
      };
      const sync = () => { if (!loaded) return; if (seen && !paused && !d.hidden) hv.play().catch(() => {}); else hv.pause(); };
      const start = () => { if (loaded) return; loaded = true; hv.addEventListener("playing", () => { hv.classList.add("on"); pp.hidden = false; }, { once: true }); set(); };
      const go = () => setTimeout(() => new IntersectionObserver((es) => { seen = es.some((e) => e.isIntersecting); if (seen) start(); sync(); }, { threshold: 0.2 }).observe(card), 300);
      if (d.readyState === "complete") go(); else addEventListener("load", go, { once: true });
      d.addEventListener("visibilitychange", sync);
      mq.addEventListener?.("change", () => { if (loaded) { set(); sync(); } });
      pp.addEventListener("click", () => { paused = !paused; pp.setAttribute("aria-pressed", String(paused)); pp.setAttribute("aria-label", paused ? (RO ? "Pornește animația" : "Play the animation") : (RO ? "Oprește animația" : "Pause the animation")); sync(); });
    }
  });
  // ---- TASK-139 ----
  // the streets' bands (r346): each clip gets its sources once the page has loaded and the band is near the screen,
  // never with reduced motion, Save-Data or 2g (the poster stays the band). A phone takes the phone cut. Each one plays
  // only while on screen and in a visible tab, or until its button pauses it; it fades in over its poster once it plays
  const sbs = [...d.querySelectorAll(".street-band .sb-vid")];
  if (sbs.length) {
    const cn = navigator.connection || {}, slow = cn.saveData || /(^|-)2g$/.test(cn.effectiveType || "");
    const mq = matchMedia("(max-width: 700px)");
    if (!reduced && !slow && "IntersectionObserver" in window) {
      const st = new Map(sbs.map((v) => [v, { near: false, seen: false, loaded: false, paused: false, pp: v.closest(".street-band").querySelector(".sb-pp") }]));
      const set = (v) => { const s = v.dataset, m = mq.matches; v.innerHTML = [[m ? "" : s.dw, 'video/webm; codecs="vp9"'], [(m && s.m) || s.d, "video/mp4"]].filter((x) => x[0]).map(([u, t]) => `<source src="${u}" type='${t}'>`).join(""); v.load(); };
      const sync = (v) => { const o = st.get(v); if (!o.loaded) return; if (o.seen && !o.paused && !d.hidden) v.play().catch(() => {}); else v.pause(); };
      const start = (v) => { const o = st.get(v); if (o.loaded) return; o.loaded = true; v.addEventListener("playing", () => { v.classList.add("on"); if (o.pp) o.pp.hidden = false; }, { once: true }); set(v); };
      const go = () => {
        const near = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) start(e.target.querySelector(".sb-vid") || e.target); }), { rootMargin: "60% 0px" });
        const seen = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target.querySelector(".sb-vid"); st.get(v).seen = e.isIntersecting; sync(v); }), { threshold: 0.05 });
        sbs.forEach((v) => { const b = v.closest(".street-band"); near.observe(b); seen.observe(b); });
      };
      if (d.readyState === "complete") go(); else addEventListener("load", go, { once: true });
      d.addEventListener("visibilitychange", () => sbs.forEach(sync));
      mq.addEventListener?.("change", () => sbs.forEach((v) => { if (st.get(v).loaded) { set(v); sync(v); } }));
      st.forEach((o, v) => o.pp && o.pp.addEventListener("click", () => { o.paused = !o.paused; o.pp.setAttribute("aria-pressed", String(o.paused)); o.pp.setAttribute("aria-label", o.paused ? (RO ? "Pornește animația" : "Play the animation") : (RO ? "Oprește animația" : "Pause the animation")); sync(v); }));
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
  const pwall = d.querySelector(".pwall"), pwRows = pwall ? [...pwall.querySelectorAll(".pw-row")] : [];
  if (pwall) {
    pwall.addEventListener("click", (e) => {
      const a = e.target.closest(".pw-case");
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
          const base = (vh - r.top) * 0.35 + 40;
          pwRows.forEach((row, i) => {
            if (!row._half) row._half = row.scrollWidth / 2;
            const half = row._half, x = (base * (1 + i * 0.25)) % half;
            row.style.transform = `translate3d(${(i % 2 ? x - half : -x).toFixed(1)}px,0,0)`;
          });
        }
      }
    };
    const q2 = () => { if (!raf2) raf2 = requestAnimationFrame(tick2); };
    streets.forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) el.style.setProperty("--sp", "0"); });
    addEventListener("scroll", q2, { passive: true }); addEventListener("resize", () => { pwRows.forEach((r) => { r._half = 0; }); q2(); }); tick2();
  }
  // cards tilt a little towards the pointer (TASK-139: the chapters have their own hover now)
  if (matchMedia("(hover: hover)").matches && !reduced) d.querySelectorAll(".svc").forEach((c) => {
    c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; c.style.transform = `perspective(700px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`; });
    c.addEventListener("pointerleave", () => { c.style.transform = ""; });
  });

  // YouTube: a poster until clicked, then the privacy-friendly embed
  d.querySelectorAll(".yt").forEach((y) => y.querySelector(".yt-play")?.addEventListener("click", () => {
    if (window.__ytPlay && y.hasAttribute("data-yt")) return; // r138d: the build's chromeless player takes it (build/film.mjs)
    y.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${y.dataset.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${RO ? "Filmul Two Minutes" : "Two Minutes film"}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }));

  // r359: the boarding pass has its own script now (build/boarding.mjs)
})();
