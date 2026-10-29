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
  if (!reduced && pwRows.length && "IntersectionObserver" in window) {
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
      row.addEventListener("pointerover", (e) => { if (e.pointerType === "mouse" && e.target.closest(".pw-case")) WALL.hold[i] = true; });
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
(function () {
  var W = window.__czWall, wall = document.querySelector(".pwall.pw-first");
  if (!W || !W.go || !wall || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var cv = document.createElement("canvas"), gl = null;
  try { gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false }); } catch (e) {}
  if (!gl) return;
  var phone = matchMedia("(max-width: 700px)").matches, Q = new URLSearchParams(location.search);
  var geo = (Q.get("crt") || "").split(",").map(Number), RK = geo[0] > 0.3 ? geo[0] : 0.85, DK = geo[1] > 0.5 ? geo[1] : 2.0;
  var DPR = Math.min(devicePixelRatio || 1, 2), PITCH = Math.max(3, 3 * (devicePixelRatio || 1) / DPR), BEZ = phone ? 6 : 8, RAD = phone ? 10 : 12;
  cv.className = "pw-gl"; cv.setAttribute("aria-hidden", "true");
  var VS = "#version 300 es\nlayout(location=0) in vec2 aC;layout(location=1) in vec4 iBox;layout(location=2) in vec4 iA;layout(location=3) in vec4 iG;layout(location=4) in vec4 iM;uniform vec2 uRes;out vec2 vP;flat out vec4 vBox,vA,vG,vM;void main(){vec2 p=iBox.xy+aC*iBox.zw;vP=(aC-.5)*iBox.zw;vBox=iBox;vA=iA;vG=iG;vM=iM;gl_Position=vec4(p/uRes*2.-1.,0.,1.);gl_Position.y=-gl_Position.y;}";
  var FS = "#version 300 es\nprecision highp float;precision highp sampler2DArray;uniform sampler2DArray uT;uniform float uPitch,uDpr,uBez,uRad,uRk,uDk,uSeed,uMask,uTime;in vec2 vP;flat in vec4 vBox,vA,vG,vM;out vec4 o;" +
    "float rr(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}" +
    "float h1(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}" +
    "vec3 tx(vec2 u){return textureLod(uT,vec3(clamp(u,.001,.999),vA.x),0.).rgb;}vec3 tb(vec2 u,float l){return textureLod(uT,vec3(clamp(u,.001,.999),vA.x),l).rgb;}" +
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
    "float ed=smoothstep(0.,aa*1.5*px,-sd);col=mix(vec3(.02),col,ed);o=vec4(clamp(col,0.,1.)*al,al);}";
  var mk = function (t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  var prog = gl.createProgram(), vs = mk(gl.VERTEX_SHADER, VS), fs = mk(gl.FRAGMENT_SHADER, FS);
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  var PAR = gl.getExtension("KHR_parallel_shader_compile"), ready = false, dead = false, U = {};
  // the covers: one layer each in a texture array, uploaded from the wall's own <img> once it is loaded and decoded
  var rowsEl = wall.querySelector(".pw-rows"), rows = [].slice.call(wall.querySelectorAll(".pw-row")), cards = [], layers = {}, NL = 0, queue = [];
  rows.forEach(function (row, i) { [].forEach.call(row.querySelectorAll(".pw-case"), function (el) { var k = el.getAttribute("href"); if (!(k in layers)) layers[k] = { i: NL++, up: 0, cards: [] }; var L = layers[k]; var c = { el: el, img: el.querySelector("img"), row: i, L: L, hov: 0 }; L.cards.push(c); cards.push(c); }); });
  var tex = null, inst = new Float32Array(cards.length * 16), ibuf = null, vao = null;
  var lost = function () { dead = true; wall.classList.remove("crt3"); cv.remove(); };
  cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); lost(); });
  var setup = function () {
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { lost(); return; }
    gl.useProgram(prog); ["uRes", "uT", "uPitch", "uDpr", "uBez", "uRad", "uRk", "uDk", "uSeed", "uMask", "uTime"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 10, gl.RGBA8, 560, 380, NL); // mips: the halation reads the blurred levels
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    ibuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW);
    for (var a = 1; a <= 4; a++) { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 4, gl.FLOAT, false, 64, (a - 1) * 16); gl.vertexAttribDivisor(a, 1); }
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(U.uT, 0); gl.uniform1f(U.uDpr, DPR); gl.uniform1f(U.uPitch, PITCH); gl.uniform1f(U.uBez, BEZ); gl.uniform1f(U.uRad, RAD); gl.uniform1f(U.uRk, RK); gl.uniform1f(U.uDk, DK); gl.uniform1f(U.uMask, DPR >= 1.9 ? 1 : 0);
    wall.insertBefore(cv, wall.firstChild); wall.classList.add("crt3"); measure(); ready = true;
    cards.forEach(function (c) { if (c.img && !c.L.dec) { var go = function () { if (c.L.dec) return; c.L.dec = 1; (c.img.decode ? c.img.decode() : Promise.resolve()).then(function () { queue.push(c); }, function () { c.L.dec = 0; }); }; if (c.img.complete && c.img.naturalWidth) go(); else c.img.addEventListener("load", go, { once: true }); } });
  };
  // where everything is (on resize only): each set's box in the wall, without its row's current drift
  var vw = 1, wh = 1, secTop = 0, D = 1, measure = function () {
    var r = wall.getBoundingClientRect(), X = W.x || []; vw = r.width; wh = r.height; secTop = r.top + scrollY; D = innerWidth * (phone ? 4 : 1.8);
    cv.width = Math.round(vw * DPR); cv.height = Math.round(wh * DPR);
    cards.forEach(function (c) { var b = c.el.getBoundingClientRect(); c.x = b.left - r.left - (X[c.row] || 0); c.y = b.top - r.top; c.w = b.width; c.h = b.height; });
    if (ready || gl.isProgram(prog)) { gl.viewport(0, 0, cv.width, cv.height); }
  };
  var rz = 0; addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (ready) measure(); }, 150); });
  addEventListener("load", function () { if (ready) measure(); });
  // the pointer and the keyboard: the set under them leans in (the DOM decides which one, so it is always the right one)
  var over = null, focus = null;
  wall.addEventListener("pointerover", function (e) { over = e.target.closest && e.target.closest(".pw-case"); if (live && live.c.el === over) live = null; });
  wall.addEventListener("pointerleave", function () { over = null; });
  wall.addEventListener("focusin", function (e) { focus = e.target.closest && e.target.closest(".pw-case"); });
  wall.addEventListener("focusout", function () { focus = null; });
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
    // at most two covers a frame go up to the GPU (each a single 560 x 380 copy)
    var upd = 0;
    for (var u = 0; u < 2 && queue.length; u++) { var c0 = queue.shift(); if (c0.L.up) continue; try { gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex); gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, c0.L.i, 560, 380, 1, gl.RGBA, gl.UNSIGNED_BYTE, c0.img); c0.L.up = 1; upd = 1; c0.L.cards.forEach(function (x) { x.el.classList.add("crt-ready"); }); } catch (e) {} }
    if (upd) gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    if (!next) next = t + (DEBUG ? 900 : 6000 + Math.random() * 4000);
    if (!live && t >= next) { fire(t); next = t + (DEBUG ? 1600 : 6000 + Math.random() * 4000); }
    var X = W.x || [], ex = vw / 2, ey = scrollY + innerHeight / 2 - secTop, n = 0, k = 1 - Math.exp(-(dt || 0.016) / 0.06);
    var g = live, gp = 0, gs = 0, gb = 0;
    if (g) { gp = (t - g.t0) / g.dur; if (gp >= 1) { live = g = null; } else { gs = sig(gp, g); gb = bloom(gp); } }
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], x = c.x + (X[c.row] || 0);
      c.on = x + c.w > -2 && x < vw + 2 && c.L.up; if (!c.on) continue;
      var cx = x + c.w / 2, cy = c.y + c.h / 2; c.nx = (cx - vw / 2) / (vw / 2);
      c.hov += ((c.el === over || c.el === focus || c.el.classList.contains("show") ? 1 : 0) - c.hov) * k;
      var gg = g && g.c === c, o = n * 16;
      inst[o] = x; inst[o + 1] = c.y; inst[o + 2] = c.w; inst[o + 3] = c.h;
      inst[o + 4] = c.L.i; inst[o + 5] = c.hov; inst[o + 6] = (ex - cx) / D; inst[o + 7] = (ey - cy) / D;
      inst[o + 8] = gg ? g.type : 0; inst[o + 9] = gg ? gp : 0; inst[o + 10] = gg ? gs : 0; inst[o + 11] = gg ? gb : 0;
      inst[o + 12] = gg && g.type === 4 ? rollY(gp) : 0; inst[o + 13] = gg ? g.ph : 0; inst[o + 14] = 0; inst[o + 15] = 0; n++;
    }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (!n) return;
    gl.useProgram(prog); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst, 0, n * 16);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.uniform2f(U.uRes, vw, wh); gl.uniform1f(U.uSeed, Math.floor(Math.random() * 997)); gl.uniform1f(U.uTime, t / 1000);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
  };
  W.hooks.push(frame);
  window.__czCrt = { cards: cards, get live() { return live; }, R: RK, d: DK };
  W.go();
})();
