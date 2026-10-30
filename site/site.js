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
  // only while on screen and in a visible tab, or until its button pauses it; it fades in over its poster once it plays
  const sbs = [...d.querySelectorAll(".street-band .sb-vid")];
  if (sbs.length) {
    const cn = navigator.connection || {}, slow = cn.saveData || /(^|-)2g$/.test(cn.effectiveType || "");
    const mq = matchMedia("(max-width: 700px)");
    if (!reduced && !slow && "IntersectionObserver" in window) {
      const st = new Map(sbs.map((v) => [v, { near: false, seen: false, loaded: false, paused: false, pp: v.closest(".street-band").querySelector(".sb-pp") }]));
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
  if (!gl) return;
  var phone = matchMedia("(max-width: 700px)").matches, Q = new URLSearchParams(location.search);
  var geo = (Q.get("crt") || "").split(",").map(Number), RK = geo[0] > 0.3 ? geo[0] : 0.85, DK = geo[1] > 0.5 ? geo[1] : 2.0;
  var TW = phone ? 384 : 560, TH = phone ? 260 : 380, TL = Math.floor(Math.log2(TW)) + 1, up2d = null;
  var DPR = Math.min(devicePixelRatio || 1, 1.5), PITCH = Math.max(3, 3 * (devicePixelRatio || 1) / DPR), BEZ = phone ? 6 : 8, RAD = phone ? 10 : 12;
  cv.className = "pw-gl"; cv.setAttribute("aria-hidden", "true");
  var VS = "#version 300 es\nlayout(location=0) in vec2 aC;layout(location=1) in vec4 iBox;layout(location=2) in vec4 iA;layout(location=3) in vec4 iG;layout(location=4) in vec4 iM;uniform vec2 uRes;out vec2 vP;flat out vec4 vBox,vA,vG,vM;void main(){vec2 p=iBox.xy+aC*iBox.zw;vP=(aC-.5)*iBox.zw;vBox=iBox;vA=iA;vG=iG;vM=iM;gl_Position=vec4(p/uRes*2.-1.,0.,1.);gl_Position.y=-gl_Position.y;}";
  var FS = "#version 300 es\nprecision highp float;precision highp sampler2DArray;uniform sampler2DArray uT;uniform float uPitch,uDpr,uBez,uRad,uRk,uDk,uSeed,uMask,uTime,uLimS,uLimK;uniform vec4 uLim;in vec2 vP;flat in vec4 vBox,vA,vG,vM;out vec4 o;" +
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
    // r408, the limiter behind the h1: only what is brighter than the knee comes down (hue kept, a soft shoulder), so a bright set goes to a mid tone with its picture still there and a dark set is not touched
    "vec2 ld=abs(vBox.xy+vP+hf-uLim.xy)-uLim.zw;float lm=uLimK*(1.-smoothstep(0.,uLimS,length(max(ld,0.))));if(lm>.002){float yy0=dot(col,vec3(.2126,.7152,.0722));if(yy0>.3){float yy1=.3+.26*(1.-exp(-(yy0-.3)/.26));col*=mix(1.,yy1/yy0,lm);}}" +
    "float ed=smoothstep(0.,aa*1.5*px,-sd);col=mix(vec3(.02),col,ed);o=vec4(clamp(col,0.,1.)*al,al);}";
  var mk = function (t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  var prog = gl.createProgram(), vs = mk(gl.VERTEX_SHADER, VS), fs = mk(gl.FRAGMENT_SHADER, FS);
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  var PAR = gl.getExtension("KHR_parallel_shader_compile"), ready = false, dead = false, U = {};
  // the covers: one layer each in a texture array, uploaded from the wall's own <img> once it is loaded and decoded
  var rowsEl = wall.querySelector(".pw-rows"), rows = [].slice.call(wall.querySelectorAll(".pw-row")), cards = [], layers = {}, NL = 0, queue = [];
  rows.forEach(function (row, i) { [].forEach.call(row.querySelectorAll(".pw-case"), function (el) { var k = el.getAttribute("href") || el.getAttribute("data-k"); if (!(k in layers)) layers[k] = { i: NL++, up: 0, cards: [] }; var L = layers[k]; var c = { el: el, img: el.querySelector("img"), row: i, L: L, hov: 0 }; L.cards.push(c); cards.push(c); }); });
  var tex = null, inst = new Float32Array(cards.length * 16), ibuf = null, vao = null;
  var offs = [], on = function (el, k, f, o) { el.addEventListener(k, f, o); offs.push(function () { el.removeEventListener(k, f, o); }); };
  var lost = function () { if (dead) return; dead = true; wall.classList.remove("crt3"); cv.remove(); setTimeout(function () { var i = W.hooks.indexOf(frame); if (i >= 0) W.hooks.splice(i, 1); }, 0); offs.forEach(function (f) { f(); }); offs = []; queue = []; window.__czCrt = null; };
  cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); lost(); });
  var setup = function () {
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { lost(); return; }
    gl.useProgram(prog); ["uRes", "uT", "uPitch", "uDpr", "uBez", "uRad", "uRk", "uDk", "uSeed", "uMask", "uTime", "uLim", "uLimS", "uLimK"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, TL, gl.RGBA8, TW, TH, NL); // mips: the halation reads the blurred levels
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
  var vw = 1, wh = 1, secTop = 0, D = 1, lim = null, limK = 0, measure = function () {
    var r = wall.getBoundingClientRect(), X = W.x || []; vw = r.width; wh = r.height; secTop = r.top + scrollY; D = innerWidth * (phone ? 4 : 1.8);
    cv.width = Math.round(vw * DPR); cv.height = Math.round(wh * DPR);
    var h1 = wall.querySelector(".pw-h"); if (h1) { var fs = parseFloat(getComputedStyle(h1).fontSize) || 60; lim = [h1.offsetLeft + h1.offsetWidth / 2, h1.offsetTop + h1.offsetHeight / 2, h1.offsetWidth / 2, h1.offsetHeight / 2 + fs * 0.04, fs * 1.1]; wall.style.setProperty("--pwl", h1.offsetLeft + "px"); wall.style.setProperty("--pwt", h1.offsetTop + "px"); wall.style.setProperty("--pww", h1.offsetWidth + "px"); wall.style.setProperty("--pwh", h1.offsetHeight + "px"); wall.style.setProperty("--pwf", fs + "px"); }
    cards.forEach(function (c) { var b = c.el.getBoundingClientRect(); c.x = b.left - r.left - (X[c.row] || 0); c.y = b.top - r.top; c.w = b.width; c.h = b.height; });
    if (ready || gl.isProgram(prog)) { gl.viewport(0, 0, cv.width, cv.height); }
  };
  var rz = 0; on(window, "resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (ready && !dead) measure(); }, 150); });
  on(window, "load", function () { if (ready && !dead) measure(); });
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
    if (lim) { var sp = Math.min(1, Math.max(0, scrollY / (wh * 0.62))); limK += ((1 - sp * sp * (3 - 2 * sp)) - limK) * (1 - Math.exp(-(dt || 0.016) / 0.1)); gl.uniform4f(U.uLim, lim[0], lim[1], lim[2], lim[3]); gl.uniform1f(U.uLimS, lim[4]); gl.uniform1f(U.uLimK, limK); } else gl.uniform1f(U.uLimK, 0);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
  };
  W.hooks.push(frame);
  window.__czCrt = { cards: cards, get live() { return live; }, R: RK, d: DK };
  W.go();
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
// or the letter's picture rolling once in its cell. Now and then, on a hold slip, a whole line tears instead. Three wall
// glitches out of four at most, never two skipped in a row, one at a time. Where the wall has no CRT (software GL, a lost
// context) it keeps its own 6-10 s clock on the wall's loop, with the same four. Nothing runs off screen or in a hidden tab
// (the wall's loop stops), only a compare per frame between glitches; the motion is WAAPI on transform and opacity, so it
// leaves the main thread (snow alone steps a background on one letter).
// The h1's DOM is never touched: no letter is split, kerning, wrapping and diacritics stay the browser's own and nothing
// can shift. The letter's place is read from a Range; the real letter is hidden through a CSS highlight (paint only, its
// shadow stays); the copies are absolute, aria-hidden, in generated content (attr), so no extra text ever exists for a
// screen reader, a selection or a crawler. Copies are solid fills. No Highlight API (Safari < 17.2, Firefox < 140): no
// glitches. Never with reduced motion (no .si). One switch: window.__czH1.off() / .on(). QA, no UI: ?h1g=1 cycles all
// every 1.6 s, ?h1g=roll|snow|drop|hsync|line only that one; __czH1.fire(type, letterIndex).
(function () {
  var W = window.__czWall, h = document.querySelector(".pw-h.si");
  if (!W || !W.go || !h || !window.CSS || !CSS.highlights || typeof Highlight !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var KIND = { 1: "snow", 2: "drop", 3: "hsync", 4: "roll" }, ALL = ["snow", "drop", "hsync", "roll"], gq = new URLSearchParams(location.search).get("h1g");
  var off = false, busy = false, pend = null, lastLive = null, skipped = false, first = true, lastIdx = -1, lastLine = -1e9, own = 0, cyc = 0, noise = null, hook;
  // every letter and where it is now (read at the moment of a glitch: a clean layout, about 40 ranges)
  var letters = function () {
    var hb = h.getBoundingClientRect(), out = [];
    [].forEach.call(h.querySelectorAll(".si-w"), function (w, wi) {
      var n = w.firstChild; if (!n || n.nodeType !== 3) return;
      var re = /\p{L}\p{M}*|./gu, m;
      while ((m = re.exec(n.data))) { var r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); var b = r.getClientRects()[0]; if (b) out.push({ c: m[0], r: r, w: wi, x: b.left - hb.left, y: b.top - hb.top, W: b.width, H: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2, wide: /\p{L}/u.test(m[0]) && !/^[iljtfr]/.test(m[0]) }); }
    });
    return out;
  };
  var piece = function (o, txt, x, y, W2, H, cls) { var e = document.createElement("span"); e.className = "h1g-p" + (cls ? " " + cls : ""); e.setAttribute("data-c", txt); e.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + W2 + "px;height:" + H + "px;line-height:" + H + "px"; o.appendChild(e); return e; };
  var AT = [0, 0.1, 0.22, 0.38, 0.55, 0.7, 0.86, 1], SL = [0, 1, 0.55, 0.95, 0.4, 0.75, 0.12, 0];
  var kf = function (vals, fn, ease) { return vals.map(function (v, i) { var f = fn(v); f.offset = AT[i]; if (ease) f.easing = ease; return f; }); };
  // the hold slipping: bands sliding in turn against each other, the red and blue guns showing where they part
  var slip = function (o, a, txt, x, y, W2, H, nb, amp, gun, dur) {
    var em = parseFloat(getComputedStyle(h).fontSize);
    [["h1g-r", gun], ["h1g-b", -gun]].forEach(function (g) { var e = piece(o, txt, x, y, W2, H, g[0]); a.push(e.animate(kf(SL, function (v) { return { transform: "translate3d(" + (g[1] * em * v).toFixed(2) + "px,0,0)", opacity: v > 0.05 ? 1 : 0 }; }), { duration: dur, fill: "both" })); });
    for (var i = 0; i < nb; i++) (function (i) {
      var e = piece(o, txt, x, y, W2, H), s = (i % 2 ? 1 : -1) * amp * em * (0.65 + 0.35 * Math.random()), t = H * 0.1, band = (H - 2 * t) / nb;
      e.style.clipPath = "inset(" + (i ? t + band * i : -9) + "px -30% " + (i < nb - 1 ? t + band * (nb - i - 1) : -9) + "px -30%)";
      a.push(e.animate(kf(SL, function (v) { return { transform: "translate3d(" + (s * v).toFixed(2) + "px,0,0)" }; }, "steps(2)"), { duration: dur, fill: "both" }));
    })(i);
  };
  var bloom = function (o, a, L, dur) { var e = piece(o, L.c, L.x, L.y, L.W, L.H, "h1g-g"); a.push(e.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.68 }, { opacity: 1, offset: 0.78 }, { opacity: 0, offset: 1 }], { duration: dur, fill: "both" })); };
  var snow = function () {
    if (noise) return noise;
    var c = document.createElement("canvas"); c.width = c.height = 96; var x = c.getContext("2d"), d = x.createImageData(96, 96);
    // the shader's snow: scanlines of grain, some lines hotter; never dark enough to lose the letter
    for (var y = 0; y < 96; y++) { var ln = 0.65 + 0.5 * Math.random(); for (var i = 0; i < 96; i++) { var v = Math.min(255, 96 + 190 * Math.random() * ln), k = (y * 96 + i) * 4; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; } }
    x.putImageData(d, 0, 0); return (noise = c.toDataURL("image/png"));
  };
  var run = function (type, L, all) {
    var o = document.createElement("span"); o.className = "h1g-o"; o.setAttribute("aria-hidden", "true");
    var a = [], rs = [L.r], dur = 640;
    if (type === "hsync") { dur = 560; slip(o, a, L.c, L.x, L.y, L.W, L.H, 5, 0.085, 0.045, dur); }
    else if (type === "line") {
      var line = all.filter(function (q) { return Math.abs(q.y - L.y) < 2; }), end = line[line.length - 1], txt = "", w0 = -1;
      line.forEach(function (q) { if (w0 >= 0 && q.w !== w0) txt += " "; txt += q.c; w0 = q.w; });
      rs = line.map(function (q) { return q.r; }); dur = 480; slip(o, a, txt, line[0].x, L.y, end.x + end.W - line[0].x + 8, L.H, 5, 0.05, 0.014, dur);
    } else if (type === "roll") {
      // the letter's own picture rolls once in its cell, as the set's does, and settles with a small bounce
      var cell = document.createElement("span"); cell.className = "h1g-c"; cell.style.cssText = "left:" + L.x + "px;top:" + L.y + "px;width:" + L.W + "px;height:" + L.H + "px"; o.appendChild(cell);
      var A = piece(cell, L.c, 0, 0, L.W, L.H), B = piece(cell, L.c, 0, -L.H * 1.06, L.W, L.H), fr = [];
      for (var i = 0; i <= 14; i++) { var p = i / 14, y = Math.min(1, Math.max(0, (p - 0.06) / 0.8)), v = y < 0.75 ? 1.03 * Math.pow(y / 0.75, 2.2) : 1 + 0.03 * Math.cos(Math.PI * 1.5 * (y - 0.75) / 0.25) * Math.exp(-4 * (y - 0.75) / 0.25); fr.push({ offset: p, transform: "translate3d(0," + (v * L.H * 1.06).toFixed(2) + "px,0)" }); }
      fr[14].transform = "translate3d(0," + (L.H * 1.06).toFixed(2) + "px,0)";
      a.push(A.animate(fr, { duration: dur, fill: "both" }), B.animate(fr, { duration: dur, fill: "both" }));
    } else if (type === "snow") {
      dur = 700; var n = piece(o, L.c, L.x, L.y, L.W, L.H, "h1g-n"), top = piece(o, L.c, L.x, L.y, L.W, L.H);
      n.style.setProperty("--n", "url(" + snow() + ")");
      a.push(n.animate([{ backgroundPosition: "0 0" }, { backgroundPosition: "-1680px 1190px" }], { duration: dur, easing: "steps(14)", pseudoElement: "::before", fill: "both" }));
      a.push(top.animate([{ opacity: 1, offset: 0 }, { opacity: 0, offset: 0.1 }, { opacity: 0, offset: 0.7 }, { opacity: 1, offset: 0.92 }, { opacity: 1, offset: 1 }], { duration: dur, fill: "both" }));
      bloom(o, a, L, dur);
    } else {
      dur = 620; var e = piece(o, L.c, L.x, L.y, L.W, L.H);
      a.push(e.animate([{ opacity: 1, offset: 0 }, { opacity: 0.42, offset: 0.12 }, { opacity: 0.62, offset: 0.3, easing: "steps(2)" }, { opacity: 0.42, offset: 0.46 }, { opacity: 0.58, offset: 0.6 }, { opacity: 0.45, offset: 0.7 }, { opacity: 1, offset: 0.86 }, { opacity: 1, offset: 1 }], { duration: dur, fill: "both" }));
      bloom(o, a, L, dur);
    }
    busy = true; h.appendChild(o); CSS.highlights.set("h1g", new Highlight(...rs));
    var done = false, end2 = function () { if (done) return; done = true; a.forEach(function (x) { x.cancel(); }); o.remove(); CSS.highlights.delete("h1g"); busy = false; };
    if (a[0]) a[0].finished.then(end2, end2);
    setTimeout(end2, dur + 500);
    run.stop = end2;
  };
  var fire = function (type, idx, near) {
    if (off || busy) return false;
    var all = letters(), pool = all.filter(function (q, i) { q.i = i; return q.wide && i !== lastIdx; }); if (!pool.length) return false;
    var L;
    if (idx != null && all[idx]) L = all[idx];
    else if (near) { pool.sort(function (a, b) { return Math.hypot(a.cx - near[0], a.cy - near[1]) - Math.hypot(b.cx - near[0], b.cy - near[1]); }); L = pool[Math.floor(Math.random() * Math.min(3, pool.length))]; }
    else L = pool[Math.floor(Math.random() * pool.length)];
    lastIdx = L.i; run(type, L, all); return true;
  };
  var when = function (t, type, near) {
    // one line now and then, on a slip of the hold
    if (type === "hsync" && t - lastLine > 28000 && Math.random() < 0.6) { type = "line"; lastLine = t; }
    if (!first && !skipped && Math.random() < 0.25) { skipped = true; return; }
    skipped = false; first = false; pend = { t: t + 110, type: type, near: near };
  };
  hook = function (t) {
    if (busy) return;
    if (scrollY > innerHeight * 0.12) { pend = null; return; }
    if (pend) { if (t >= pend.t) { var q = pend; pend = null; fire(q.type, null, q.near); } return; }
    if (gq) { if (t > own) { own = t + 1600; fire(ALL.indexOf(gq) >= 0 || gq === "line" ? gq : ALL.concat("line")[cyc++ % 5]); } return; }
    var C = window.__czCrt;
    if (C) {
      var live = C.live;
      if (live && live !== lastLive) { var b = live.c.el.getBoundingClientRect(); when(t, KIND[live.type], [b.left + b.width / 2, b.top + b.height / 2]); }
      lastLive = live || null;
    } else { if (!own) own = t + 6000 + Math.random() * 4000; else if (t > own) { own = t + 6000 + Math.random() * 4000; when(t, ALL[Math.floor(Math.random() * 4)]); } }
  };
  W.hooks.push(hook);
  window.__czH1 = {
    off: function () { off = true; pend = null; var i = W.hooks.indexOf(hook); if (i >= 0) W.hooks.splice(i, 1); if (run.stop) run.stop(); },
    on: function () { if (!off) return; off = false; W.hooks.push(hook); W.go(); },
    fire: function (type, idx) { return fire(type, idx); }
  };
})();
